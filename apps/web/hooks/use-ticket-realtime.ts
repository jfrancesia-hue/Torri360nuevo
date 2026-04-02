'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

let globalSocket: Socket | null = null;

function getSocket(token: string): Socket {
  if (!globalSocket || !globalSocket.connected) {
    globalSocket = io(`${WS_URL}/realtime`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
    });
  }
  return globalSocket;
}

export function disconnectSocket() {
  if (globalSocket) {
    globalSocket.disconnect();
    globalSocket = null;
  }
}

interface UseTicketRealtimeOptions {
  ticketId?: string;
  onUpdate?: (data: Record<string, unknown>) => void;
  onEvent?: (data: Record<string, unknown>) => void;
}

export function useTicketRealtime({ ticketId, onUpdate, onEvent }: UseTicketRealtimeOptions = {}) {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    const socket = getSocket(token);
    socketRef.current = socket;

    const handleTicketUpdated = (data: { ticketId: string; status?: string }) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      if (data.ticketId) {
        queryClient.invalidateQueries({ queryKey: ['ticket', data.ticketId] });
      }
      onUpdate?.(data as Record<string, unknown>);
    };

    const handleTicketEvent = (data: { ticketId: string; event: Record<string, unknown> }) => {
      if (data.ticketId) {
        queryClient.invalidateQueries({ queryKey: ['ticket', data.ticketId] });
      }
      onEvent?.(data as Record<string, unknown>);
    };

    const handleTicketCreated = (data: { ticket: { number: string; title: string } }) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.info(`Nuevo ticket: ${data.ticket.number} — ${data.ticket.title}`);
    };

    socket.on('ticket:updated', handleTicketUpdated);
    socket.on('ticket:event', handleTicketEvent);
    socket.on('ticket:created', handleTicketCreated);

    if (ticketId) {
      socket.emit('join:ticket', { ticketId });
    }

    return () => {
      socket.off('ticket:updated', handleTicketUpdated);
      socket.off('ticket:event', handleTicketEvent);
      socket.off('ticket:created', handleTicketCreated);

      if (ticketId) {
        socket.emit('leave:ticket', { ticketId });
      }
    };
  }, [ticketId, queryClient, onUpdate, onEvent]);

  return socketRef.current;
}
