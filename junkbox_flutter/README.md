# JunkBox Flutter Demo

Exemplo minimo em Flutter consumindo o backend JunkBox.

## Rodar

Com o backend rodando:

```bash
cd ..
npm run dev
```

Em outro terminal:

```bash
cd junkbox_flutter
flutter create . --platforms=android,ios,web --no-pub
flutter pub get
flutter run --dart-define=JUNKBOX_API_BASE=http://10.0.2.2:3333
```

Use `http://10.0.2.2:3333` para Android Emulator. Para iOS Simulator, desktop ou Chrome, use `http://localhost:3333`.

Neste workspace, `flutter pub get` foi validado e gerou `pubspec.lock`. As chamadas `flutter create`, `dart format` e `flutter analyze` travaram no SDK local, entao as pastas nativas nao foram materializadas aqui.

## Login seed

```text
email: demo@junkbox.local
senha: junkbox123
```

## Permissoes de microfone

Se voce gerar as pastas nativas com `flutter create .`, adicione:

Android `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

iOS `ios/Runner/Info.plist`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>O JunkBox usa o microfone para reconhecer musicas tocando.</string>
```

O reconhecimento real exige `AUDD_API_TOKEN` configurado no `.env` do backend.
