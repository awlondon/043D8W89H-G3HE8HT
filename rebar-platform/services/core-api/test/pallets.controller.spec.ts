import { PalletPlannerService } from '../src/pallets/pallet-planner.service';
import { PalletsController } from '../src/pallets/pallets.controller';
import { ensureSeedData, resetAllPallets } from '../src/data/data-store';
import { seedData } from '../src/data/seed-data';

describe('PalletsController', () => {
  beforeAll(async () => {
    await ensureSeedData(seedData);
  });

  beforeEach(async () => {
    await resetAllPallets();
  });

  it('creates and retrieves pallet plans for a project', async () => {
    const controller = new PalletsController(new PalletPlannerService());
    const created = await controller.generatePalletPlan('project-1', {});
    expect(created.length).toBeGreaterThan(0);

    const listed = await controller.listPlans('project-1');
    expect(listed.length).toBe(created.length);

    const first = await controller.getPallet(created[0].id);
    expect(first?.layers.length ?? 0).toBeGreaterThan(0);
  });

  it('updates pallet status', async () => {
    const controller = new PalletsController(new PalletPlannerService());
    const [pallet] = await controller.generatePalletPlan('project-1', {});

    const updated = await controller.updateStatus(pallet.id, { status: 'stacked' });
    expect(updated?.status).toBe('stacked');
  });
});
