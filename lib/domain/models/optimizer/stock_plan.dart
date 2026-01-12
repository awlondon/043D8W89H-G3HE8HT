enum RemainderClassification {
  keepRemnant,
  scrapWaste,
}

class Cut {
  final String id;
  final String label;
  final int lengthUnits;

  const Cut({
    required this.id,
    required this.label,
    required this.lengthUnits,
  });
}

class StockPlan {
  final String stickId;
  final String specKey;
  final int totalLengthUnits;
  final List<Cut> cuts;
  final List<int> remainingAfterCutUnits;
  final int finalRemainderUnits;
  final RemainderClassification remainderClassification;

  const StockPlan({
    required this.stickId,
    required this.specKey,
    required this.totalLengthUnits,
    required this.cuts,
    required this.remainingAfterCutUnits,
    required this.finalRemainderUnits,
    required this.remainderClassification,
  });
}
