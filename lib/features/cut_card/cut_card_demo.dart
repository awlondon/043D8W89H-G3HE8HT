import '../../domain/view_models/stock_plan_view_model.dart';

// TODO: Replace with optimizer output.
const mockViewModel = StockPlanViewModel(
  stickId: "STK-2024-X99",
  specKey: "#5 GRADE 60",
  totalLengthUnits: 240000,
  cuts: [
    CutItemViewModel(id: 'c1', label: 'JOB-101-A', lengthUnits: 62000),
    CutItemViewModel(id: 'c2', label: 'JOB-101-B', lengthUnits: 62000),
    CutItemViewModel(id: 'c3', label: 'JOB-202-X', lengthUnits: 48500),
    CutItemViewModel(id: 'c4', label: 'JOB-202-Y', lengthUnits: 48500),
  ],
  remainingAfterCutUnits: [
    177875, // 240.000 - 62.000 - 0.125
    115750, // 177.875 - 62.000 - 0.125
    67125, // 115.750 - 48.500 - 0.125
    18500, // 67.125  - 48.500 - 0.125
  ],
  finalRemainderUnits: 18500,
  remainderClassification: RemainderClassification.keepRemnant,
);
