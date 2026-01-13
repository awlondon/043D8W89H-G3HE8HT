import 'package:flutter/material.dart';
import 'package:rebar_cutting_app/domain/view_models/stock_plan_view_model.dart';
import 'package:rebar_cutting_app/features/cut_card/cut_card_screen.dart';

class CutCardDemoScreen extends StatelessWidget {
  const CutCardDemoScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final mockViewModel = StockPlanViewModel(
      stickId: "STK-2024-X99",
      specKey: "#5 GRADE 60",
      totalLengthUnits: 240000,
      cuts: const [
        CutItemViewModel(id: 'c1', label: 'JOB-101-A', lengthUnits: 62000),
        CutItemViewModel(id: 'c2', label: 'JOB-101-B', lengthUnits: 62000),
        CutItemViewModel(id: 'c3', label: 'JOB-202-X', lengthUnits: 48500),
        CutItemViewModel(id: 'c4', label: 'JOB-202-Y', lengthUnits: 48500),
      ],
      remainingAfterCutUnits: const [
        177875,
        115750,
        67125,
        18500,
      ],
      finalRemainderUnits: 18500,
      remainderClassification: RemainderClassification.keepRemnant,
    );

    return CutCardScreen(viewModel: mockViewModel);
  }
}
