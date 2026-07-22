import 'package:flutter/material.dart';

void main() {
  runApp(const SaaSTemplateApp());
}

class SaaSTemplateApp extends StatelessWidget {
  const SaaSTemplateApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        body: Center(child: Text('SaaS Template', key: Key('app-title'))),
      ),
    );
  }
}
