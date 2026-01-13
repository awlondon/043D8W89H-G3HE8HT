import 'package:test/test.dart';

import '../../../lib/domain/mappers/optimizer_to_view_model.dart';
import '../../../lib/domain/models/optimizer/stock_plan.dart' as optimizer;
import '../../../lib/domain/view_models/stock_plan_view_model.dart';

optimizer.StockPlan _buildStockPlan({
  String stickId = 'stick-1',
  String specKey = 'spec-1',
  int totalLengthUnits = 100,
  List<optimizer.Cut>? cuts,
  List<int>? remainingAfterCutUnits,
  int? finalRemainderUnits,
  optimizer.RemainderClassification remainderClassification =
      optimizer.RemainderClassification.keepRemnant,
}) {
  final resolvedCuts =
      cuts ??
      const [
        optimizer.Cut(id: 'cut-1', label: 'Cut A', lengthUnits: 20),
        optimizer.Cut(id: 'cut-2', label: 'Cut B', lengthUnits: 20),
      ];
  final resolvedRemainingAfterCutUnits = remainingAfterCutUnits ?? [80, 60];
  final resolvedFinalRemainderUnits =
      finalRemainderUnits ?? resolvedRemainingAfterCutUnits.last;

  return optimizer.StockPlan(
    stickId: stickId,
    specKey: specKey,
    totalLengthUnits: totalLengthUnits,
    cuts: resolvedCuts,
    remainingAfterCutUnits: resolvedRemainingAfterCutUnits,
    finalRemainderUnits: resolvedFinalRemainderUnits,
    remainderClassification: remainderClassification,
  );
}

void main() {
  group('mapStockPlanToViewModel', () {
    test('maps optimizer stock plan fields into view model', () {
      final stockPlan = _buildStockPlan();

      final viewModel = mapStockPlanToViewModel(stockPlan);

      expect(viewModel.stickId, stockPlan.stickId);
      expect(viewModel.specKey, stockPlan.specKey);
      expect(viewModel.totalLengthUnits, stockPlan.totalLengthUnits);
      expect(
        viewModel.remainingAfterCutUnits,
        equals(stockPlan.remainingAfterCutUnits),
      );
      expect(viewModel.finalRemainderUnits, stockPlan.finalRemainderUnits);
      expect(
        viewModel.remainderClassification,
        RemainderClassification.keepRemnant,
      );
      expect(viewModel.cuts, hasLength(stockPlan.cuts.length));
      expect(viewModel.cuts.first.id, stockPlan.cuts.first.id);
      expect(viewModel.cuts.first.label, stockPlan.cuts.first.label);
      expect(
        viewModel.cuts.first.lengthUnits,
        stockPlan.cuts.first.lengthUnits,
      );
    });

    test('maps scrap waste classification', () {
      final stockPlan = _buildStockPlan(
        remainderClassification: optimizer.RemainderClassification.scrapWaste,
      );

      final viewModel = mapStockPlanToViewModel(stockPlan);

      expect(
        viewModel.remainderClassification,
        RemainderClassification.scrapWaste,
      );
    });

    test('asserts when cuts list is empty', () {
      final stockPlan = _buildStockPlan(cuts: const []);

      expect(
        () => mapStockPlanToViewModel(stockPlan),
        throwsA(isA<AssertionError>()),
      );
    });

    test('asserts when remainingAfterCutUnits length mismatches cuts', () {
      final stockPlan = _buildStockPlan(remainingAfterCutUnits: [80]);

      expect(
        () => mapStockPlanToViewModel(stockPlan),
        throwsA(isA<AssertionError>()),
      );
    });

    test('asserts when final remainder does not match last remaining', () {
      final stockPlan = _buildStockPlan(finalRemainderUnits: 10);

      expect(
        () => mapStockPlanToViewModel(stockPlan),
        throwsA(isA<AssertionError>()),
      );
    });

    test('asserts when remainingAfterCutUnits contains negatives', () {
      final stockPlan = _buildStockPlan(
        remainingAfterCutUnits: [80, -1],
        finalRemainderUnits: -1,
      );

      expect(
        () => mapStockPlanToViewModel(stockPlan),
        throwsA(isA<AssertionError>()),
      );
    });

    test('asserts when cuts contain negative lengths', () {
      final stockPlan = _buildStockPlan(
        cuts: const [
          optimizer.Cut(id: 'cut-1', label: 'Cut A', lengthUnits: -1),
        ],
        remainingAfterCutUnits: const [-1],
        finalRemainderUnits: -1,
      );

      expect(
        () => mapStockPlanToViewModel(stockPlan),
        throwsA(isA<AssertionError>()),
      );
    });
  });
}
