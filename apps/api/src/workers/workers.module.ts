import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SlaCheckerWorker } from './sla-checker.worker';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [SlaCheckerWorker],
})
export class WorkersModule {}
