import '../models/optimizer/stock_plan.dart' as optimizer;
import '../view_models/stock_plan_view_model.dart';

StockPlanViewModel mapStockPlanToViewModel(optimizer.StockPlan stockPlan) {
  assert(stockPlan.cuts.isNotEmpty, 'cuts list must not be empty');
  assert(
    stockPlan.remainingAfterCutUnits.length == stockPlan.cuts.length,
    'remainingAfterCutUnits length must match cuts length',
  );
  assert(
    stockPlan.finalRemainderUnits == stockPlan.remainingAfterCutUnits.last,
    'finalRemainderUnits must equal last remainingAfterCutUnits',
  );
  assert(stockPlan.totalLengthUnits >= 0, 'totalLengthUnits must be >= 0');
  assert(stockPlan.finalRemainderUnits >= 0, 'finalRemainderUnits must be >= 0');
  assert(
    stockPlan.remainingAfterCutUnits.every((value) => value >= 0),
    'remainingAfterCutUnits must not contain negative values',
  );
  assert(
    stockPlan.cuts.every((cut) => cut.lengthUnits >= 0),
    'cuts must not contain negative lengths',
  );

  return StockPlanViewModel(
    stickId: stockPlan.stickId,
    specKey: stockPlan.specKey,
    totalLengthUnits: stockPlan.totalLengthUnits,
    cuts: stockPlan.cuts
        .map(
          (cut) => CutItemViewModel(
            id: cut.id,
            label: cut.label,
            lengthUnits: cut.lengthUnits,
          ),
        )
        .toList(growable: false),
    remainingAfterCutUnits: List<int>.from(
      stockPlan.remainingAfterCutUnits,
      growable: false,
    ),
    finalRemainderUnits: stockPlan.finalRemainderUnits,
    remainderClassification:
        _mapRemainderClassification(stockPlan.remainderClassification),
  );
}

RemainderClassification _mapRemainderClassification(
  optimizer.RemainderClassification remainderClassification,
) {
  switch (remainderClassification) {
    case optimizer.RemainderClassification.keepRemnant:
      return RemainderClassification.keepRemnant;
    case optimizer.RemainderClassification.scrapWaste:
      return RemainderClassification.scrapWaste;
  }
}
