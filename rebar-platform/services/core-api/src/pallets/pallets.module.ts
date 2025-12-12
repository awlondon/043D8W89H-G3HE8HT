import { Module } from '@nestjs/common';
import { PalletPlannerService } from './pallet-planner.service';
import { PalletsController } from './pallets.controller';

@Module({
  controllers: [PalletsController],
  providers: [PalletPlannerService],
})
export class PalletsModule {}
