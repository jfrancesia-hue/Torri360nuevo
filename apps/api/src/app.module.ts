import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { UnitsModule } from './modules/units/units.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { TradesModule } from './modules/trades/trades.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { VisitsModule } from './modules/visits/visits.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { AssetsModule } from './modules/assets/assets.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AiModule } from './modules/ai/ai.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { WorkersModule } from './workers/workers.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    TenantsModule,
    UsersModule,
    PropertiesModule,
    UnitsModule,
    ProvidersModule,
    TradesModule,
    CategoriesModule,
    TicketsModule,
    QuotesModule,
    VisitsModule,
    DashboardModule,
    UploadsModule,
    AssetsModule,
    RealtimeModule,
    NotificationsModule,
    AiModule,
    WhatsappModule,
    WorkersModule,
  ],
})
export class AppModule {}
