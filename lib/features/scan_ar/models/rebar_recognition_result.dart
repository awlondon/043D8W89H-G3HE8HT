import 'rebar_detection.dart';

class RebarRecognitionResult {
  final String imageId;
  final List<RebarDetection> detections;

  RebarRecognitionResult({
    required this.imageId,
    required this.detections,
  });

  int get totalCount => detections.length;

  Map<String, int> get countBySpecKey {
    final map = <String, int>{};
    for (final detection in detections) {
      map[detection.specKey] = (map[detection.specKey] ?? 0) + 1;
    }
    return map;
  }

  double get averageConfidence {
    if (detections.isEmpty) {
      return 0;
    }
    final total = detections
        .map((detection) => detection.confidence)
        .reduce((a, b) => a + b);
    return total / detections.length;
  }

  double get minConfidence {
    if (detections.isEmpty) {
      return 0;
    }
    return detections
        .map((detection) => detection.confidence)
        .reduce((a, b) => a < b ? a : b);
  }

  factory RebarRecognitionResult.fromJson(Map<String, dynamic> json) {
    final list = (json['detections'] as List<dynamic>)
        .map((e) => RebarDetection.fromJson(e as Map<String, dynamic>))
        .toList();

    return RebarRecognitionResult(
      imageId: json['imageId'] as String,
      detections: list,
    );
  }
}
