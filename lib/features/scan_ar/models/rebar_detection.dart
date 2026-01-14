class RebarDetection {
  final String id;
  final String specKey;
  final double confidence;
  final double x;
  final double y;
  final double w;
  final double h;

  RebarDetection({
    required this.id,
    required this.specKey,
    required this.confidence,
    required this.x,
    required this.y,
    required this.w,
    required this.h,
  });

  factory RebarDetection.fromJson(Map<String, dynamic> json) {
    final bbox = json['bbox'] as Map<String, dynamic>?;
    final xValue = bbox?['x'] ?? json['x'];
    final yValue = bbox?['y'] ?? json['y'];
    final wValue = bbox?['w'] ?? json['w'];
    final hValue = bbox?['h'] ?? json['h'];

    return RebarDetection(
      id: json['id'] as String,
      specKey: json['specKey'] as String,
      confidence: (json['confidence'] as num).toDouble(),
      x: (xValue as num).toDouble(),
      y: (yValue as num).toDouble(),
      w: (wValue as num).toDouble(),
      h: (hValue as num).toDouble(),
    );
  }
}
