import { BendCompensationService } from '../src/bend-compensation/bend-compensation.service';
import type { FeedDraw, MachineConfig, PerceivedStretch } from '../src/data/models';

jest.mock('../src/data/data-store', () => ({
  findPerceivedStretch: jest.fn(),
  findFeedDraw: jest.fn(),
  getMachineConfig: jest.fn(),
  listFeedDraws: jest.fn(),
  listMachineConfigs: jest.fn(),
  listPerceivedStretch: jest.fn(),
  updateFeedDraw: jest.fn(),
  updateMachineConfig: jest.fn(),
  updatePerceivedStretch: jest.fn(),
  addFeedDraw: jest.fn(),
  addPerceivedStretch: jest.fn(),
  ensureMachineConfig: jest.fn(),
}));

const dataStore = jest.requireMock('../src/data/data-store') as {
  findPerceivedStretch: jest.Mock;
  findFeedDraw: jest.Mock;
  getMachineConfig: jest.Mock;
};

describe('BendCompensationService', () => {
  it('returns deterministic bend outputs for fixed configs', async () => {
    const service = new BendCompensationService();

    const stretch: PerceivedStretch = {
      id: 'stretch-1',
      barSize: '#4',
      angleDeg: 90,
      offsetIn: 1.25,
      isDefault: true,
    };
    const feedDraw: FeedDraw = {
      id: 'feed-1',
      barSize: '#4',
      angleDeg: 90,
      drawIn: 0.75,
      isDefault: true,
      isProvisional: false,
    };
    const machine: MachineConfig = {
      id: 'machine-1',
      machineId: 'machine-1',
      mode: 'BASE',
      offset4BarIn: 0.5,
      offset5BarIn: 0,
      offset6BarIn: 0,
      globalConfigOffsetIn: 0.1,
    };

    dataStore.findPerceivedStretch.mockResolvedValue(stretch);
    dataStore.findFeedDraw.mockResolvedValue(feedDraw);
    dataStore.getMachineConfig.mockResolvedValue(machine);

    const result = await service.computeBendSetpoints({
      machineId: 'machine-1',
      barSize: '#4',
      angleDeg: 90,
      targetBendSideLengthIn: 24,
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "effectiveBendSideLengthIn": 25.25,
        "feedDrawIn": 0.75,
        "machineOffsetIn": 0.6,
        "measureFromFeedDatumIn": 26.6,
        "provisionalFeed": false,
      }
    `);
  });
});
