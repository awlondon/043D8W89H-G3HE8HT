import { PalletPlannerService } from '../src/pallets/pallet-planner.service';
import { PalletsController } from '../src/pallets/pallets.controller';
import { resetAllPallets } from '../src/data/data-store';

describe('PalletsController', () => {
  beforeEach(() => resetAllPallets());

  it('creates and retrieves pallet plans for a project', () => {
    const controller = new PalletsController(new PalletPlannerService());
    const created = controller.generatePalletPlan('project-1', {});
    expect(created.length).toBeGreaterThan(0);

    const listed = controller.listPlans('project-1');
    expect(listed.length).toBe(created.length);

    const first = controller.getPallet(created[0].id);
    expect(first.layers.length).toBeGreaterThan(0);
  });

  it('updates pallet status', () => {
    const controller = new PalletsController(new PalletPlannerService());
    const [pallet] = controller.generatePalletPlan('project-1', {});

    const updated = controller.updateStatus(pallet.id, { status: 'stacked' });
    expect(updated.status).toBe('stacked');
  });
});
