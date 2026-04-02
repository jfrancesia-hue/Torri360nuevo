import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

interface AuthPayload {
  sub: string;
  email: string;
  tenantId: string;
  role: string;
}

@WebSocketGateway({
  cors: {
    origin: (origin: string, cb: (err: Error | null, allow?: boolean) => void) => {
      // Allow all in development, restrict in production via env
      const allowed = process.env.NODE_ENV !== 'production' ||
        [
          process.env.NEXT_PUBLIC_APP_URL,
          process.env.PORTAL_URL,
        ].filter(Boolean).includes(origin);
      cb(null, allowed);
    },
    credentials: true,
  },
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private userSockets = new Map<string, string>(); // userId → socketId

  constructor(
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwt.verify<AuthPayload>(token, {
        secret: this.config.get<string>('JWT_SECRET'),
      });

      client.data.userId = payload.sub;
      client.data.tenantId = payload.tenantId;
      client.data.role = payload.role;

      // Join tenant room
      client.join(`tenant:${payload.tenantId}`);
      this.userSockets.set(payload.sub, client.id);

      this.logger.log(`Client connected: ${payload.sub} (tenant: ${payload.tenantId})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.userId) {
      this.userSockets.delete(client.data.userId);
      this.logger.log(`Client disconnected: ${client.data.userId}`);
    }
  }

  @SubscribeMessage('join:ticket')
  handleJoinTicket(@MessageBody() data: { ticketId: string }, @ConnectedSocket() client: Socket) {
    client.join(`ticket:${data.ticketId}`);
    return { event: 'joined', ticketId: data.ticketId };
  }

  @SubscribeMessage('leave:ticket')
  handleLeaveTicket(@MessageBody() data: { ticketId: string }, @ConnectedSocket() client: Socket) {
    client.leave(`ticket:${data.ticketId}`);
    return { event: 'left', ticketId: data.ticketId };
  }

  // Called by services to broadcast ticket updates
  notifyTicketUpdated(tenantId: string, ticketId: string, payload: Record<string, unknown>) {
    this.server.to(`tenant:${tenantId}`).emit('ticket:updated', { ticketId, ...payload });
    this.server.to(`ticket:${ticketId}`).emit('ticket:updated', { ticketId, ...payload });
  }

  notifyTicketEvent(tenantId: string, ticketId: string, event: Record<string, unknown>) {
    this.server.to(`tenant:${tenantId}`).emit('ticket:event', { ticketId, event });
    this.server.to(`ticket:${ticketId}`).emit('ticket:event', { ticketId, event });
  }

  notifyNewTicket(tenantId: string, ticket: Record<string, unknown>) {
    this.server.to(`tenant:${tenantId}`).emit('ticket:created', { ticket });
  }
}
