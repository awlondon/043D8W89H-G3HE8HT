import 'package:flutter/material.dart';

import 'app_shell.dart';

class RebarApp extends StatelessWidget {
  const RebarApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Rebar Cutting',
      theme: ThemeData(
        colorSchemeSeed: const Color(0xFF1E293B),
        useMaterial3: true,
      ),
      home: const AppShell(),
    );
  }
}
