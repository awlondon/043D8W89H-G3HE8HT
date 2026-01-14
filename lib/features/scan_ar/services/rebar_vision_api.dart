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
    Duration timeout = const Duration(seconds: 12),
  }) async {
    final uri = Uri.parse('$baseUrl/vision/rebar-detect');

    final request = http.MultipartRequest('POST', uri);
    request.files.add(
      http.MultipartFile.fromBytes(
        'image',
        jpegBytes,
        filename: 'capture.jpg',
        contentType: MediaType('image', 'jpeg'),
      ),
    );

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
