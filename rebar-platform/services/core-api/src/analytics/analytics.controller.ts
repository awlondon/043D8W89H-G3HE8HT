import { Controller, Get, Param, Query } from '@nestjs/common';
import { computeScrapFreeStats } from '../data/data-store';
import { ScrapFreeStats } from '../data/models';

@Controller('analytics')
export class AnalyticsController {
  @Get('operators/:operatorId/scrap-free')
  getOperatorScrapFree(
    @Param('operatorId') operatorId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): ScrapFreeStats {
    // Date filtering would be handled in the data layer; parameters are accepted for parity with other analytics endpoints.
    return computeScrapFreeStats({ operatorId });
  }

  @Get('shops/:shopId/scrap-free')
  getShopScrapFree(
    @Param('shopId') shopId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): ScrapFreeStats {
    return computeScrapFreeStats({ shopId });
  }
}
