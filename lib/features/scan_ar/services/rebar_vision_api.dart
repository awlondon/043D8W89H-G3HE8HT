import 'dart:convert';
import 'dart:typed_data';

import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';

import '../models/rebar_recognition_result.dart';

class RebarVisionApi {
  final String baseUrl;

  RebarVisionApi({required this.baseUrl});

  Future<RebarRecognitionResult> recognizeRebar({
    required Uint8List jpegBytes,
    String? jobId,
    String? deviceId,
    int? rotate,
    bool? mirror,
    double? minConfidence,
    bool? returnOverlay,
    String? bearerToken,
    String? apiKey,
    Duration timeout = const Duration(seconds: 12),
  }) async {
    final uri = Uri.parse('$baseUrl/vision/rebar-detect');

    final request = http.MultipartRequest('POST', uri);
    if (bearerToken != null && bearerToken.isNotEmpty) {
      request.headers['Authorization'] = 'Bearer $bearerToken';
    }
    if (apiKey != null && apiKey.isNotEmpty) {
      request.headers['X-Api-Key'] = apiKey;
    }
    request.files.add(
      http.MultipartFile.fromBytes(
        'image',
        jpegBytes,
        filename: 'capture.jpg',
        contentType: MediaType('image', 'jpeg'),
      ),
    );
    if (jobId != null && jobId.isNotEmpty) {
      request.fields['jobId'] = jobId;
    }
    if (deviceId != null && deviceId.isNotEmpty) {
      request.fields['deviceId'] = deviceId;
    }
    if (rotate != null) {
      request.fields['rotate'] = rotate.toString();
    }
    if (mirror != null) {
      request.fields['mirror'] = mirror.toString();
    }
    if (minConfidence != null) {
      request.fields['minConfidence'] = minConfidence.toString();
    }
    if (returnOverlay != null) {
      request.fields['returnOverlay'] = returnOverlay.toString();
    }

    final streamed = await request.send().timeout(timeout);
    final response = await http.Response.fromStream(streamed).timeout(timeout);

    if (response.statusCode != 200) {
      throw Exception('Vision API error: ${response.statusCode} ${response.body}');
    }

    try {
      final jsonMap = jsonDecode(response.body) as Map<String, dynamic>;
      return RebarRecognitionResult.fromJson(jsonMap);
    } on FormatException catch (error) {
      throw Exception('Invalid JSON from Vision API: $error');
    }
  }
}
