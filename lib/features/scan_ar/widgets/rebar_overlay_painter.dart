import 'package:flutter/material.dart';

import '../models/rebar_detection.dart';

class RebarOverlayPainter extends CustomPainter {
  final List<RebarDetection> detections;

  RebarOverlayPainter({required this.detections});

  @override
  void paint(Canvas canvas, Size size) {
    for (final detection in detections) {
      final color = _colorForConfidence(detection.confidence);
      final rect = Rect.fromLTWH(
        detection.x * size.width,
        detection.y * size.height,
        detection.w * size.width,
        detection.h * size.height,
      );
      final paint = Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2;

      canvas.drawRect(rect, paint);

      final textSpan = TextSpan(
        text: detection.specKey,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w600,
          backgroundColor: Colors.black.withOpacity(0.5),
        ),
      );

      final textPainter = TextPainter(
        text: textSpan,
        textDirection: TextDirection.ltr,
      )..layout();

      textPainter.paint(
        canvas,
        Offset(rect.left + 4, rect.top + 4),
      );
    }
  }

  @override
  bool shouldRepaint(covariant RebarOverlayPainter oldDelegate) {
    return oldDelegate.detections != detections;
  }

  Color _colorForConfidence(double confidence) {
    if (confidence >= 0.8) {
      return Colors.greenAccent.shade400;
    }
    if (confidence >= 0.5) {
      return Colors.amberAccent.shade400;
    }
    return Colors.redAccent.shade200;
  }
}
