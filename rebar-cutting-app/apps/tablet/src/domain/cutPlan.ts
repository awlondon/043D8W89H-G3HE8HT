import { generateCutPlan, type CutPlan, type Job } from '@rebar/core';

export const createCutPlan = (job: Job): CutPlan => generateCutPlan(job);
