import '../view_models/stock_plan_view_model.dart';

abstract class JobRepository {
  Future<StockPlanViewModel> getJobStockPlan(String jobId);
}

class FakeJobRepository implements JobRepository {
  @override
  Future<StockPlanViewModel> getJobStockPlan(String jobId) async {
    return demoStockPlanViewModel;
  }
}

final StockPlanViewModel demoStockPlanViewModel = StockPlanViewModel(
  stickId: 'STK-2024-X99',
  specKey: '#5 GRADE 60',
  totalLengthUnits: 240000,
  cuts: const [
    CutItemViewModel(id: 'c1', label: 'JOB-101-A', lengthUnits: 62000),
    CutItemViewModel(id: 'c2', label: 'JOB-101-B', lengthUnits: 62000),
    CutItemViewModel(id: 'c3', label: 'JOB-202-X', lengthUnits: 48500),
    CutItemViewModel(id: 'c4', label: 'JOB-202-Y', lengthUnits: 48500),
  ],
  remainingAfterCutUnits: const [
    177875, // 240.000 - 62.000 - 0.125
    115750, // 177.875 - 62.000 - 0.125
    67125, // 115.750 - 48.500 - 0.125
    18500, // 67.125  - 48.500 - 0.125
  ],
  finalRemainderUnits: 18500,
  remainderClassification: RemainderClassification.keepRemnant,
);
