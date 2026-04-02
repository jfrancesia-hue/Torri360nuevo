import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../../prisma/prisma.service';
import { UserPayload } from '@toori360/shared';

@Injectable()
export class UploadsService {
  private supabase: SupabaseClient;
  private bucket: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.supabase = createClient(
      this.config.get<string>('SUPABASE_URL')!,
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    this.bucket = this.config.get<string>('SUPABASE_BUCKET', 'toori360-attachments');
  }

  async uploadToTicket(
    tenantId: string,
    ticketId: string,
    file: Express.Multer.File,
    category: string,
    user: UserPayload,
  ) {
    const ticket = await this.prisma.ticket.findFirst({ where: { id: ticketId, tenantId } });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');

    const ext = file.originalname.split('.').pop();
    const key = `${tenantId}/${ticketId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(key, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) throw new BadRequestException(`Error al subir archivo: ${error.message}`);

    const { data: urlData } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(key);

    const attachment = await this.prisma.attachment.create({
      data: {
        ticketId,
        fileUrl: urlData.publicUrl,
        fileType: file.mimetype,
        fileName: file.originalname,
        fileSize: file.size,
        category: category as 'BEFORE' | 'AFTER' | 'QUOTE_DOC' | 'DOCUMENT' | 'EVIDENCE' | 'OTHER',
        uploadedBy: user.id,
      },
    });

    return { data: attachment };
  }

  async deleteAttachment(tenantId: string, attachmentId: string, user: UserPayload) {
    const attachment = await this.prisma.attachment.findFirst({
      where: { id: attachmentId, ticket: { tenantId } },
    });
    if (!attachment) throw new NotFoundException('Adjunto no encontrado');

    // Extract key from URL
    const url = new URL(attachment.fileUrl);
    const key = url.pathname.split(`/${this.bucket}/`)[1];

    if (key) {
      await this.supabase.storage.from(this.bucket).remove([key]);
    }

    await this.prisma.attachment.delete({ where: { id: attachmentId } });

    return { data: { deleted: true } };
  }

  async listByTicket(tenantId: string, ticketId: string) {
    const ticket = await this.prisma.ticket.findFirst({ where: { id: ticketId, tenantId } });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');

    const attachments = await this.prisma.attachment.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'desc' },
      include: {
        // include uploader info via raw select workaround
      },
    });

    return { data: attachments };
  }
}
