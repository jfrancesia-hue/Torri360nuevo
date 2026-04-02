import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';

@Module({
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
  // RealtimeGateway is provided globally via RealtimeModule
})
export class TicketsModule {}
