import 'package:flutter/material.dart';
import 'package:rebar_cutting_app/features/cut_card/cut_card_demo.dart';
import 'package:rebar_cutting_app/features/home/home_screen.dart';
import 'package:rebar_cutting_app/features/scan/scan_screen.dart';

class RebarApp extends StatefulWidget {
  const RebarApp({super.key});

  @override
  State<RebarApp> createState() => _RebarAppState();
}

class _RebarAppState extends State<RebarApp> {
  int _selectedIndex = 0;

  void _onNavSelected(int index) {
    setState(() => _selectedIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Rebar Cutting App',
      theme: ThemeData.light().copyWith(
        scaffoldBackgroundColor: const Color(0xFFF5F7FB),
      ),
      routes: {
        '/home': (context) => const HomeScreen(),
        '/scan': (context) => const ScanScreen(),
        '/cut-card-demo': (context) => const CutCardDemoScreen(),
      },
      home: _AppShell(
        selectedIndex: _selectedIndex,
        onSelectedIndex: _onNavSelected,
      ),
    );
  }
}

class _AppShell extends StatelessWidget {
  final int selectedIndex;
  final ValueChanged<int> onSelectedIndex;

  const _AppShell({
    required this.selectedIndex,
    required this.onSelectedIndex,
  });

  @override
  Widget build(BuildContext context) {
    final screens = <Widget>[
      const HomeScreen(),
      const ScanScreen(),
      const CutCardDemoScreen(),
    ];

    return Scaffold(
      body: Row(
        children: [
          NavigationRail(
            selectedIndex: selectedIndex,
            onDestinationSelected: onSelectedIndex,
            labelType: NavigationRailLabelType.all,
            destinations: const [
              NavigationRailDestination(
                icon: Icon(Icons.home_outlined),
                selectedIcon: Icon(Icons.home),
                label: Text('Home'),
              ),
              NavigationRailDestination(
                icon: Icon(Icons.qr_code_scanner_outlined),
                selectedIcon: Icon(Icons.qr_code_scanner),
                label: Text('Scan'),
              ),
              NavigationRailDestination(
                icon: Icon(Icons.content_cut_outlined),
                selectedIcon: Icon(Icons.content_cut),
                label: Text('Cut Card'),
              ),
            ],
          ),
          const VerticalDivider(width: 1),
          Expanded(child: screens[selectedIndex]),
        ],
      ),
    );
  }
}
