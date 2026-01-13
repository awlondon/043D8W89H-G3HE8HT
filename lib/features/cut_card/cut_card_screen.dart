import 'package:flutter/material.dart';

import '../../domain/view_models/stock_plan_view_model.dart';

/// CUT CARD SCREEN
/// ----------------
/// IMPORTANT:
/// - This UI MUST NOT perform any cutting math
/// - All remaining lengths and classifications come from StockPlanViewModel
/// - Do NOT add kerf, tolerance, or min-length logic here
/// - Optimizer is the single source of truth
///
/// If you think you need math here, stop and fix the optimizer instead.
class CutCardScreen extends StatefulWidget {
  final StockPlanViewModel viewModel;

  const CutCardScreen({super.key, required this.viewModel});

  @override
  State<CutCardScreen> createState() => _CutCardScreenState();
}

class _CutCardScreenState extends State<CutCardScreen> {
  int _nextCutIndex = 0;

  bool get _isJobComplete => _nextCutIndex == widget.viewModel.cuts.length;

  void _confirmCut() {
    // Safeguard 2: Lock sequential enforcement defensively
    if (_isJobComplete) return;
    setState(() => _nextCutIndex++);
  }

  void _resetStick() {
    setState(() => _nextCutIndex = 0);
  }

  // Safeguard 4: Integer-safe conversion for display
  String _formatInches(int units) {
    final clamped = units < 0 ? 0 : units;
    return (clamped / 1000.0).toStringAsFixed(3);
  }

  String _getCurrentRemainingDisplay() {
    if (_nextCutIndex == 0) {
      return _formatInches(widget.viewModel.totalLengthUnits);
    }
    return _formatInches(
      widget.viewModel.remainingAfterCutUnits[_nextCutIndex - 1],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _buildAppBar(),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(flex: 2, child: _buildCutList()),
            const SizedBox(width: 32),
            Expanded(flex: 1, child: _buildStatusPanel()),
          ],
        ),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: const Color(0xFF1E293B),
      elevation: 0,
      toolbarHeight: 100,
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.blue[700],
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.tune_rounded,
              size: 32,
              color: Colors.white,
            ),
          ),
          const SizedBox(width: 24),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.viewModel.stickId,
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                ),
              ),
              Text(
                widget.viewModel.specKey,
                style: const TextStyle(fontSize: 16, color: Colors.blueAccent),
              ),
            ],
          ),
          const Spacer(),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              const Text(
                "TOTAL STOCK",
                style: TextStyle(
                  color: Colors.grey,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                '${_formatInches(widget.viewModel.totalLengthUnits)}"',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCutList() {
    return ListView.separated(
      itemCount: widget.viewModel.cuts.length,
      separatorBuilder: (ctx, i) => const SizedBox(height: 16),
      itemBuilder: (ctx, index) {
        final cut = widget.viewModel.cuts[index];
        final bool isCompleted = index < _nextCutIndex;
        final bool isActive = index == _nextCutIndex;
        final bool isPending = index > _nextCutIndex;

        return Opacity(
          opacity: isPending ? 0.3 : 1.0,
          child: Container(
            decoration: BoxDecoration(
              color: isActive ? const Color(0xFF1E293B) : Colors.transparent,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isActive ? Colors.blueAccent : Colors.grey[800]!,
                width: isActive ? 3 : 1,
              ),
            ),
            padding: const EdgeInsets.all(24),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 32,
                  backgroundColor: isCompleted
                      ? Colors.green[600]
                      : isActive
                      ? Colors.blue[600]
                      : Colors.grey[800],
                  child: isCompleted
                      ? const Icon(Icons.check, size: 36, color: Colors.white)
                      : Text(
                          "${index + 1}",
                          style: const TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                ),
                const SizedBox(width: 32),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        cut.label,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.grey,
                        ),
                      ),
                      Text(
                        '${_formatInches(cut.lengthUnits)} IN',
                        style: const TextStyle(
                          fontSize: 48,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      // Nice-to-have: Current cut remaining after confirm preview
                      if (isActive)
                        Text(
                          "EST. REMAINING AFTER CUT: ${_formatInches(widget.viewModel.remainingAfterCutUnits[index])}\"",
                          style: TextStyle(
                            color: Colors.blue[200],
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                    ],
                  ),
                ),
                if (isActive)
                  SizedBox(
                    height: 80,
                    child: ElevatedButton.icon(
                      onPressed: _confirmCut,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue[600],
                        padding: const EdgeInsets.symmetric(horizontal: 40),
                      ),
                      icon: const Icon(Icons.check_circle, size: 28),
                      label: const Text(
                        "CONFIRM",
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildStatusPanel() {
    return Column(
      children: [
        Container(
          width: double.infinity,
          decoration: BoxDecoration(
            color: const Color(0xFF1E293B),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: Colors.grey[800]!),
          ),
          padding: const EdgeInsets.all(32),
          child: Column(
            children: [
              const Text(
                "LIVE REMAINING",
                style: TextStyle(
                  color: Colors.grey,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '${_getCurrentRemainingDisplay()}"',
                style: const TextStyle(
                  fontSize: 64,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: Divider(color: Colors.grey),
              ),
              const Text(
                "FINAL REMAINDER",
                style: TextStyle(
                  color: Colors.grey,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                '${_formatInches(widget.viewModel.finalRemainderUnits)}"',
                style: const TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 24),
              _buildClassificationBadge(),
            ],
          ),
        ),
        const Spacer(),
        if (_isJobComplete)
          _buildCompletionCard()
        else
          TextButton.icon(
            onPressed: _resetStick,
            icon: const Icon(Icons.refresh),
            label: const Text("RESET STICK"),
          ),
      ],
    );
  }

  Widget _buildClassificationBadge() {
    final isKeep =
        widget.viewModel.remainderClassification ==
        RemainderClassification.keepRemnant;
    final color = isKeep ? Colors.green : Colors.red;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color, width: 2),
      ),
      child: Column(
        children: [
          Icon(
            isKeep ? Icons.inventory : Icons.delete_sweep,
            color: color,
            size: 32,
          ),
          const SizedBox(height: 8),
          Text(
            isKeep ? "KEEP REMNANT" : "SCRAP WASTE",
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w900,
              color: color,
            ),
          ),
          // Safeguard 3: Clarify source of classification
          const Text(
            "Classification provided by optimizer",
            style: TextStyle(
              fontSize: 12,
              fontStyle: FontStyle.italic,
              color: Colors.grey,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCompletionCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.blue[600],
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        children: [
          const Text(
            "STICK COMPLETE",
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w900,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _resetStick,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: Colors.blue[900],
              minimumSize: const Size(double.infinity, 60),
            ),
            child: const Text(
              "START NEW STICK",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }
}
