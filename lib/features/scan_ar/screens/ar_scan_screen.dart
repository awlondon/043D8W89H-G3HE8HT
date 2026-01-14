import 'dart:async';
import 'dart:typed_data';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';

import '../models/rebar_detection.dart';
import '../models/rebar_recognition_result.dart';
import '../services/rebar_vision_api.dart';
import 'ar_scan_review_screen.dart';

class ARScanScreen extends StatefulWidget {
  const ARScanScreen({super.key});

  @override
  State<ARScanScreen> createState() => _ARScanScreenState();
}

class _ARScanScreenState extends State<ARScanScreen> {
  static const bool kUseMockVision = true;
  static const String kVisionApiBaseUrl = 'http://localhost:8080';

  CameraController? _controller;
  bool _isInitializing = true;
  bool _isAnalyzing = false;
  bool _torchEnabled = false;
  String? _errorMessage;

  final RebarVisionApi _visionApi =
      RebarVisionApi(baseUrl: kVisionApiBaseUrl);

  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  Future<void> _initializeCamera() async {
    setState(() {
      _isInitializing = true;
      _errorMessage = null;
    });

    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        setState(() {
          _errorMessage = 'Camera unavailable';
          _isInitializing = false;
        });
        return;
      }

      final controller = CameraController(
        cameras.first,
        ResolutionPreset.medium,
        enableAudio: false,
      );

      await controller.initialize();

      if (!mounted) {
        return;
      }

      setState(() {
        _controller = controller;
        _isInitializing = false;
      });
    } on CameraException {
      if (!mounted) {
        return;
      }
      setState(() {
        _errorMessage = 'Camera unavailable';
        _isInitializing = false;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _errorMessage = 'Camera unavailable';
        _isInitializing = false;
      });
    }
  }

  Future<void> _handleCapture() async {
    if (_controller == null || !_controller!.value.isInitialized) {
      setState(() {
        _errorMessage = 'Camera unavailable';
      });
      return;
    }

    if (_isAnalyzing) {
      return;
    }

    setState(() {
      _isAnalyzing = true;
      _errorMessage = null;
    });

    try {
      final file = await _controller!.takePicture();
      final bytes = await file.readAsBytes();

      final result = await _recognizeRebar(bytes);
      if (result.detections.isEmpty) {
        setState(() {
          _errorMessage = 'No rebar detected — try again';
        });
        return;
      }

      final reviewResult = await Navigator.of(context)
          .push<RebarRecognitionResult>(
        MaterialPageRoute(
          builder: (_) => ARScanReviewScreen(
            result: result,
            imageBytes: bytes,
          ),
        ),
      );

      if (reviewResult != null && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content:
                Text('Confirmed ${reviewResult.totalCount} rebar items'),
          ),
        );
      }
    } on TimeoutException {
      if (!mounted) {
        return;
      }
      setState(() {
        _errorMessage = 'Could not analyze image';
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _errorMessage = 'Could not analyze image';
      });
    } finally {
      if (!mounted) {
        return;
      }
      setState(() {
        _isAnalyzing = false;
      });
    }
  }

  Future<RebarRecognitionResult> _recognizeRebar(Uint8List bytes) async {
    if (kUseMockVision) {
      await Future<void>.delayed(const Duration(seconds: 1));
      return _mockResult();
    }

    return _visionApi.recognizeRebar(jpegBytes: bytes).timeout(
          const Duration(seconds: 12),
        );
  }

  RebarRecognitionResult _mockResult() {
    return RebarRecognitionResult(
      imageId: 'mock-001',
      detections: [
        RebarDetection(
          id: 'd1',
          specKey: '#5-G60',
          confidence: 0.92,
          x: 0.12,
          y: 0.18,
          w: 0.2,
          h: 0.25,
        ),
        RebarDetection(
          id: 'd2',
          specKey: '#5-G60',
          confidence: 0.88,
          x: 0.45,
          y: 0.22,
          w: 0.18,
          h: 0.24,
        ),
        RebarDetection(
          id: 'd3',
          specKey: '#4-G60',
          confidence: 0.63,
          x: 0.2,
          y: 0.55,
          w: 0.22,
          h: 0.28,
        ),
      ],
    );
  }

  Future<void> _toggleTorch() async {
    if (_controller == null || !_controller!.value.isInitialized) {
      return;
    }

    final nextMode = _torchEnabled ? FlashMode.off : FlashMode.torch;
    try {
      await _controller!.setFlashMode(nextMode);
      if (!mounted) {
        return;
      }
      setState(() {
        _torchEnabled = !_torchEnabled;
      });
    } on CameraException {
      if (!mounted) {
        return;
      }
      setState(() {
        _errorMessage = 'Camera unavailable';
      });
    }
  }

  void _handleExit() {
    Navigator.of(context).pushNamed('/home');
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('AR Scanner'),
      ),
      body: SafeArea(
        child: Stack(
          children: [
            Positioned.fill(
              child: _buildCameraBody(context),
            ),
            if (_errorMessage != null)
              Positioned(
                top: 16,
                left: 16,
                right: 16,
                child: _ErrorBanner(
                  message: _errorMessage!,
                  onRetry: _initializeCamera,
                ),
              ),
            if (_isAnalyzing)
              Positioned.fill(
                child: Container(
                  color: Colors.black.withOpacity(0.45),
                  child: const Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        CircularProgressIndicator(),
                        SizedBox(height: 16),
                        Text(
                          'Analyzing…',
                          style: TextStyle(color: Colors.white),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: Container(
                padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
                decoration: BoxDecoration(
                  color: colorScheme.surface,
                  border: Border(
                    top: BorderSide(color: colorScheme.outlineVariant),
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _toggleTorch,
                        icon: Icon(
                          _torchEnabled ? Icons.flash_off : Icons.flash_on,
                        ),
                        label: Text(_torchEnabled ? 'Torch Off' : 'Torch On'),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: _handleCapture,
                        icon: const Icon(Icons.camera_alt),
                        label: const Text('CAPTURE'),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 18),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _handleExit,
                        icon: const Icon(Icons.exit_to_app),
                        label: const Text('Exit'),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCameraBody(BuildContext context) {
    if (_isInitializing) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_controller == null || !_controller!.value.isInitialized) {
      return _EmptyState(
        title: 'Camera unavailable',
        subtitle: 'Check permissions and try again.',
        onRetry: _initializeCamera,
      );
    }

    return Center(
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: AspectRatio(
          aspectRatio: _controller!.value.aspectRatio,
          child: CameraPreview(_controller!),
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final String title;
  final String subtitle;
  final VoidCallback onRetry;

  const _EmptyState({
    required this.title,
    required this.subtitle,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 420),
        child: Card(
          margin: const EdgeInsets.all(24),
          elevation: 2,
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.videocam_off,
                    size: 48, color: Theme.of(context).colorScheme.error),
                const SizedBox(height: 16),
                Text(
                  title,
                  style: Theme.of(context)
                      .textTheme
                      .titleLarge
                      ?.copyWith(fontWeight: FontWeight.w700),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  subtitle,
                  style: Theme.of(context)
                      .textTheme
                      .bodyMedium
                      ?.copyWith(color: Colors.black54),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                OutlinedButton(
                  onPressed: onRetry,
                  child: const Text('Retake'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorBanner({
    required this.message,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      elevation: 2,
      borderRadius: BorderRadius.circular(12),
      color: Theme.of(context).colorScheme.errorContainer,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Icon(Icons.warning_amber,
                color: Theme.of(context).colorScheme.onErrorContainer),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: Theme.of(context)
                    .textTheme
                    .bodyMedium
                    ?.copyWith(
                      color:
                          Theme.of(context).colorScheme.onErrorContainer,
                    ),
              ),
            ),
            TextButton(
              onPressed: onRetry,
              child: const Text('Retake'),
            ),
          ],
        ),
      ),
    );
  }
}
