import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RunsService } from './runs.service';
import { ProductionRun } from '../data/models';

interface CloseoutDto {
  projectId: string;
  shopId: string;
  operatorId: string;
  scrapLengthIn: number;
  stockUsedIn: number;
}

@Controller()
export class RunsController {
  constructor(private readonly runs: RunsService) {}

  @Get('runs/:runId')
  async getRun(@Param('runId') runId: string): Promise<ProductionRun> {
    const run = await this.runs.getRun(runId);
    if (!run) {
      throw new Error('Run not found');
    }
    return run;
  }

  @Get('projects/:projectId/runs')
  listRuns(@Param('projectId') projectId: string): Promise<ProductionRun[]> {
    return this.runs.listRuns(projectId);
  }

  @Post('runs/:runId/closeout')
  closeout(@Param('runId') runId: string, @Body() body: CloseoutDto): Promise<ProductionRun> {
    return this.runs.closeoutRun(runId, body);
  }
}
