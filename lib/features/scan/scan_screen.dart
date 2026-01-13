import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../domain/repositories/job_repository.dart';
import '../cut_card/cut_card_screen.dart';

class ScanScreen extends StatefulWidget {
  final JobRepository jobRepository;

  const ScanScreen({super.key, required this.jobRepository});

  @override
  State<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends State<ScanScreen> {
  final MobileScannerController _controller = MobileScannerController();
  bool _isLoading = false;
  String? _errorMessage;

  String? _parseJobId(String rawValue) {
    final trimmed = rawValue.trim();
    if (trimmed.isEmpty) {
      return null;
    }

    final uri = Uri.tryParse(trimmed);
    if (uri != null && uri.scheme == 'rebar' && uri.host == 'job') {
      if (uri.pathSegments.isNotEmpty) {
        return uri.pathSegments.first;
      }
    }

    const prefix = 'rebar://job/';
    if (trimmed.startsWith(prefix)) {
      final jobId = trimmed.substring(prefix.length);
      return jobId.isEmpty ? null : jobId;
    }

    final match = RegExp(r'^JOB-[A-Za-z0-9-]+$').firstMatch(trimmed);
    return match?.group(0);
  }

  Future<void> _handleScan(String rawValue) async {
    if (_isLoading) {
      return;
    }

    final jobId = _parseJobId(rawValue);
    if (jobId == null) {
      setState(() {
        _errorMessage = 'Unrecognized QR format. Try rebar://job/JOB-123.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final viewModel = await widget.jobRepository.getJobStockPlan(jobId);
      if (!mounted) {
        return;
      }
      setState(() {
        _isLoading = false;
      });
      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => CutCardScreen(viewModel: viewModel),
        ),
      );
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _isLoading = false;
        _errorMessage = 'Failed to load job $jobId. Please try again.';
      });
    }
  }

  void _onDetect(BarcodeCapture capture) {
    final rawValue =
        capture.barcodes.isNotEmpty ? capture.barcodes.first.rawValue : null;
    if (rawValue == null || rawValue.isEmpty) {
      setState(() {
        _errorMessage = 'No QR data detected. Please try again.';
      });
      return;
    }
    _handleScan(rawValue);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan QR'),
        actions: [
          IconButton(
            tooltip: 'Toggle torch',
            icon: const Icon(Icons.flash_on),
            onPressed: () => _controller.toggleTorch(),
          ),
        ],
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: _controller,
            onDetect: _onDetect,
          ),
          Positioned(
            left: 24,
            right: 24,
            bottom: 24,
            child: _buildStatusCard(context),
          ),
          if (_isLoading)
            Container(
              color: Colors.black54,
              child: const Center(child: CircularProgressIndicator()),
            ),
        ],
      ),
    );
  }

  Widget _buildStatusCard(BuildContext context) {
    return Card(
      color: Theme.of(context).colorScheme.surface.withOpacity(0.9),
      elevation: 6,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Align QR code within the frame to load a job.',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            Text(
              _errorMessage ??
                  'Accepted formats: rebar://job/JOB-123 or JOB-123.',
              style: TextStyle(
                color: _errorMessage == null
                    ? Theme.of(context).colorScheme.onSurfaceVariant
                    : Theme.of(context).colorScheme.error,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
