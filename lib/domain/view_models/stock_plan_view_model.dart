// ---------------------------------------------------------------------------
// 1. Domain Models (ViewModel)
// ---------------------------------------------------------------------------

enum RemainderClassification {
  keepRemnant,
  scrapWaste,
}

class CutItemViewModel {
  final String id;
  final String label;
  final int lengthUnits; // mill-units (1/1000 inch)

  const CutItemViewModel({
    required this.id,
    required this.label,
    required this.lengthUnits,
  });
}

class StockPlanViewModel {
  final String stickId;
  final String specKey;
  final int totalLengthUnits;
  final List<CutItemViewModel> cuts;

  /// Pre-computed remaining length after each cut index [0..N-1].
  /// Index i corresponds to the state AFTER cuts[i] is confirmed.
  final List<int> remainingAfterCutUnits;

  final int finalRemainderUnits;
  final RemainderClassification remainderClassification;

  const StockPlanViewModel({
    required this.stickId,
    required this.specKey,
    required this.totalLengthUnits,
    required this.cuts,
    required this.remainingAfterCutUnits,
    required this.finalRemainderUnits,
    required this.remainderClassification,
  })  : assert(cuts.length == remainingAfterCutUnits.length,
            'remainingAfterCutUnits must match cuts length'),
        assert(
            cuts.isEmpty || finalRemainderUnits == remainingAfterCutUnits.last,
            'finalRemainderUnits must equal last remainingAfterCutUnits');
}
