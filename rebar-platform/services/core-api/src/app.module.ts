import { Module } from '@nestjs/common';
import { AnalyticsModule } from './analytics/analytics.module';
import { BendCompensationModule } from './bend-compensation/bend-compensation.module';
import { PalletsModule } from './pallets/pallets.module';
import { RunsModule } from './runs/runs.module';

@Module({
  imports: [PalletsModule, RunsModule, AnalyticsModule, BendCompensationModule],
})
export class AppModule {}
