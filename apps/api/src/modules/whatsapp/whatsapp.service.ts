import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { generateTicketNumber } from '@toori360/shared';

interface WhatsAppMessage {
  from: string;       // phone number
  body: string;       // message text
  messageId: string;
}

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private prisma: PrismaService,
    private ai: AiService,
    private config: ConfigService,
  ) {}

  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    const verifyToken = this.config.get<string>('WHATSAPP_VERIFY_TOKEN');
    if (mode === 'subscribe' && token === verifyToken) {
      return challenge;
    }
    return null;
  }

  async processIncomingMessage(tenantId: string, message: WhatsAppMessage): Promise<void> {
    this.logger.log(`Processing WhatsApp message from ${message.from}: "${message.body.slice(0, 50)}..."`);

    // Find the user by phone number
    const user = await this.prisma.user.findFirst({
      where: {
        tenantId,
        phone: message.from,
        status: 'ACTIVE',
      },
    });

    if (!user) {
      this.logger.warn(`No user found for phone ${message.from} in tenant ${tenantId}`);
      return;
    }

    // Use AI to classify the ticket
    const classification = await this.ai.classifyTicket(message.body);

    // Find the best matching category
    let categoryId: string | undefined;
    if (classification.categoryHint) {
      const category = await this.prisma.category.findFirst({
        where: {
          tenantId,
          name: { contains: classification.categoryHint, mode: 'insensitive' },
        },
      });
      categoryId = category?.id;
    }

    // Get tenant's first property as default (fallback)
    const defaultProperty = await this.prisma.property.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });

    if (!defaultProperty) {
      this.logger.warn(`No property found for tenant ${tenantId}`);
      return;
    }

    // Generate ticket number
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const seq = await this.prisma.ticketSequence.upsert({
      where: { tenantId },
      create: { tenantId, yearMonth, sequence: 1 },
      update: { sequence: { increment: 1 }, yearMonth },
    });
    const number = generateTicketNumber(seq.sequence, now);

    // Find SLA config for priority
    const slaConfig = await this.prisma.slaConfig.findFirst({
      where: { tenantId, priority: classification.priority },
    });

    const slaDueAt = slaConfig
      ? new Date(now.getTime() + slaConfig.resolutionTimeHours * 3600000)
      : undefined;

    // Create the ticket
    const ticket = await this.prisma.ticket.create({
      data: {
        tenantId,
        number,
        title: classification.title,
        description: classification.description,
        status: 'NEW',
        priority: classification.priority,
        requesterId: user.id,
        propertyId: defaultProperty.id,
        categoryId,
        source: 'WHATSAPP',
        slaConfigId: slaConfig?.id,
        slaDueAt,
        tags: ['whatsapp', 'ai-classified'],
      },
    });

    // Create initial event
    await this.prisma.ticketEvent.create({
      data: {
        ticketId: ticket.id,
        eventType: 'SYSTEM',
        data: {
          message: `Ticket creado automáticamente vía WhatsApp. Confianza IA: ${(classification.confidence * 100).toFixed(0)}%`,
          source: 'whatsapp',
          from: message.from,
          aiConfidence: classification.confidence,
        },
        visibility: 'INTERNAL',
      },
    });

    this.logger.log(`Created ticket ${number} from WhatsApp message (AI confidence: ${classification.confidence})`);
  }

  async handleWebhookPayload(tenantId: string, payload: Record<string, unknown>): Promise<void> {
    try {
      const entry = (payload as { entry?: { changes?: { value?: { messages?: { from: string; id: string; text?: { body: string } }[] } }[] }[] }).entry;
      if (!entry) return;

      for (const e of entry) {
        for (const change of (e.changes || [])) {
          const messages = change.value?.messages || [];
          for (const msg of messages) {
            if (msg.text?.body) {
              await this.processIncomingMessage(tenantId, {
                from: msg.from,
                body: msg.text.body,
                messageId: msg.id,
              });
            }
          }
        }
      }
    } catch (err) {
      this.logger.error('Error processing WhatsApp webhook', err);
    }
  }
}
