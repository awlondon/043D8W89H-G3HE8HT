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
    return RebarDetection(
      id: json['id'] as String,
      specKey: json['specKey'] as String,
      confidence: (json['confidence'] as num).toDouble(),
      x: (json['x'] as num).toDouble(),
      y: (json['y'] as num).toDouble(),
      w: (json['w'] as num).toDouble(),
      h: (json['h'] as num).toDouble(),
    );
  }
}
