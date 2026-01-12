import 'package:flutter/material.dart';

import '../domain/view_models/stock_plan_view_model.dart';
import '../features/cut_card/cut_card_screen.dart';

class RebarCutApp extends StatelessWidget {
  final StockPlanViewModel viewModel;

  const RebarCutApp({super.key, required this.viewModel});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF0F172A),
        cardColor: const Color(0xFF1E293B),
        primaryColor: const Color(0xFF2563EB),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF3B82F6),
          secondary: Color(0xFF10B981),
          error: Color(0xFFEF4444),
          surface: Color(0xFF1E293B),
        ),
      ),
      home: CutCardScreen(viewModel: viewModel),
    );
  }
}
