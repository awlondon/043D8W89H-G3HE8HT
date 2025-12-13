import { Module } from '@nestjs/common';
import { AnalyticsModule } from './analytics/analytics.module';
import { PalletsModule } from './pallets/pallets.module';
import { RunsModule } from './runs/runs.module';

@Module({
  imports: [PalletsModule, RunsModule, AnalyticsModule],
})
export class AppModule {}
