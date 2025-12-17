import { Module } from '@nestjs/common';
import { BendCompensationService } from './bend-compensation.service';
import { BendCompensationController } from './bend-compensation.controller';

@Module({
  providers: [BendCompensationService],
  controllers: [BendCompensationController],
})
export class BendCompensationModule {}
