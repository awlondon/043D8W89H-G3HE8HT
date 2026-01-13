import 'package:flutter/material.dart';

import 'cut_card_demo.dart';
import 'cut_card_screen.dart';

class CutCardDemoScreen extends StatelessWidget {
  const CutCardDemoScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return CutCardScreen(viewModel: mockViewModel);
  }
}
