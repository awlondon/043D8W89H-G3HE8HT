import { Controller, Get, Param } from '@nestjs/common';
import { getShapesForProject, listProjects } from '../data/data-store';
import { Project, Shape } from '../data/models';

@Controller()
export class ProjectsController {
  @Get('projects')
  listProjects(): Promise<Project[]> {
    return listProjects();
  }

  @Get('projects/:projectId/shapes')
  listShapes(@Param('projectId') projectId: string): Promise<Shape[]> {
    return getShapesForProject(projectId);
  }
}
