import 'package:flutter/material.dart';
import 'package:rebar_cutting_app/domain/repositories/job_repository.dart';
import 'package:rebar_cutting_app/features/cut_card/cut_card_screen.dart';

class CutCardDemoScreen extends StatelessWidget {
  const CutCardDemoScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return CutCardScreen(viewModel: demoStockPlanViewModel);
  }
}
