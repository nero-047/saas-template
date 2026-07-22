import 'package:flutter_test/flutter_test.dart';
import 'package:saas_flutter/main.dart';

void main() {
  testWidgets('renders the application shell', (tester) async {
    await tester.pumpWidget(const SaaSTemplateApp());

    expect(find.text('SaaS Template'), findsOneWidget);
  });
}
