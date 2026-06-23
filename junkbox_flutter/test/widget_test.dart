import 'package:flutter_test/flutter_test.dart';

import 'package:junkbox_flutter/main.dart';

void main() {
  testWidgets('renders auth screen', (tester) async {
    await tester.pumpWidget(const JunkBoxApp());
    await tester.pump();

    expect(find.text('JunkBox'), findsOneWidget);
    expect(find.text('Login'), findsOneWidget);
  });
}
