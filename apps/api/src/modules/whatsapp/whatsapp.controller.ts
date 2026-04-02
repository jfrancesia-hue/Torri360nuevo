import { Controller, Get, Post, Body, Query, Param, Res, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { WhatsappService } from './whatsapp.service';

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  // Meta webhook verification
  @Get('webhook/:tenantId')
  verify(
    @Param('tenantId') _tenantId: string,
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const result = this.whatsappService.verifyWebhook(mode, token, challenge);
    if (result !== null) {
      res.status(HttpStatus.OK).send(result);
    } else {
      res.status(HttpStatus.FORBIDDEN).send('Forbidden');
    }
  }

  // Meta webhook incoming messages
  @Post('webhook/:tenantId')
  async handleWebhook(
    @Param('tenantId') tenantId: string,
    @Body() payload: Record<string, unknown>,
    @Res() res: Response,
  ) {
    // Respond immediately to Meta (< 5s required)
    res.status(HttpStatus.OK).json({ received: true });

    // Process asynchronously
    this.whatsappService.handleWebhookPayload(tenantId, payload).catch(() => {});
  }
}
