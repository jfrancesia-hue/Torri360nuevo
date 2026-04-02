import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private resend: Resend | null = null;
  private fromEmail: string;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn('RESEND_API_KEY not set — email notifications disabled');
    }
    this.fromEmail = this.config.get<string>('RESEND_FROM_EMAIL', 'noreply@toori360.com');
  }

  async sendEmail(payload: EmailPayload): Promise<void> {
    if (!this.resend) {
      this.logger.debug(`[Email skipped] to=${payload.to} subject="${payload.subject}"`);
      return;
    }

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      });
      this.logger.log(`Email sent to ${payload.to}: ${payload.subject}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${payload.to}`, err);
    }
  }

  async sendTicketCreated(ticket: {
    number: string;
    title: string;
    status: string;
    priority: string;
  }, recipientEmail: string, recipientName: string): Promise<void> {
    await this.sendEmail({
      to: recipientEmail,
      subject: `[Toori360] Ticket ${ticket.number} creado`,
      html: `
        <h2>Hola ${recipientName},</h2>
        <p>Se creó el ticket <strong>${ticket.number}</strong>: ${ticket.title}</p>
        <p>Estado: ${ticket.status} | Prioridad: ${ticket.priority}</p>
        <p>Podés seguir el estado en la plataforma.</p>
        <hr/>
        <small>Toori360 — Nativos Consultora Digital</small>
      `,
    });
  }

  async sendTicketStatusChanged(ticket: {
    number: string;
    title: string;
    newStatus: string;
    oldStatus: string;
  }, recipientEmail: string, recipientName: string): Promise<void> {
    await this.sendEmail({
      to: recipientEmail,
      subject: `[Toori360] Ticket ${ticket.number} actualizado`,
      html: `
        <h2>Hola ${recipientName},</h2>
        <p>El ticket <strong>${ticket.number}</strong> cambió de estado:</p>
        <p><strong>${ticket.oldStatus}</strong> → <strong>${ticket.newStatus}</strong></p>
        <p>Título: ${ticket.title}</p>
        <hr/>
        <small>Toori360 — Nativos Consultora Digital</small>
      `,
    });
  }

  async sendSlaAlert(ticket: {
    number: string;
    title: string;
    slaDueAt: string;
  }, recipientEmail: string, recipientName: string): Promise<void> {
    await this.sendEmail({
      to: recipientEmail,
      subject: `⚠ [Toori360] SLA próximo a vencer — ${ticket.number}`,
      html: `
        <h2>Alerta de SLA</h2>
        <p>Hola ${recipientName},</p>
        <p>El ticket <strong>${ticket.number}</strong> está próximo a vencer su SLA.</p>
        <p>Título: ${ticket.title}</p>
        <p>Vencimiento: ${ticket.slaDueAt}</p>
        <p>Por favor, tomá acción inmediata.</p>
        <hr/>
        <small>Toori360 — Nativos Consultora Digital</small>
      `,
    });
  }

  async sendPasswordReset(email: string, name: string, resetToken: string, appUrl: string): Promise<void> {
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;
    await this.sendEmail({
      to: email,
      subject: '[Toori360] Restablecer contraseña',
      html: `
        <h2>Hola ${name},</h2>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p><a href="${resetUrl}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Restablecer contraseña</a></p>
        <p>Si no solicitaste esto, ignorá este email. El enlace vence en 1 hora.</p>
        <hr/>
        <small>Toori360 — Nativos Consultora Digital</small>
      `,
    });
  }

  async sendQuoteRequest(ticket: {
    number: string;
    title: string;
    description: string;
  }, providerEmail: string, providerName: string): Promise<void> {
    await this.sendEmail({
      to: providerEmail,
      subject: `[Toori360] Solicitud de presupuesto — ${ticket.number}`,
      html: `
        <h2>Solicitud de presupuesto</h2>
        <p>Hola ${providerName},</p>
        <p>Te solicitamos presupuesto para el ticket <strong>${ticket.number}</strong>:</p>
        <p><strong>${ticket.title}</strong></p>
        <p>${ticket.description}</p>
        <p>Por favor, ingresá a la plataforma para enviar tu presupuesto.</p>
        <hr/>
        <small>Toori360 — Nativos Consultora Digital</small>
      `,
    });
  }
}
