// ignore_for_file: avoid_web_libraries_in_flutter, deprecated_member_use

import 'dart:async';
import 'dart:html' as html;
import 'dart:typed_data';

class WebAudio {
  WebAudio({
    required this.bytes,
    required this.filename,
    required this.contentType,
  });

  final List<int> bytes;
  final String filename;
  final String contentType;
}

Future<WebAudio> recordWebAudio(Duration duration) async {
  final stream = await html.window.navigator.mediaDevices?.getUserMedia({
    'audio': true,
  });

  if (stream == null) {
    throw Exception('Este navegador não liberou acesso ao microfone.');
  }

  final recorder = html.MediaRecorder(stream);
  final chunks = <html.Blob>[];
  final stopped = Completer<void>();

  recorder.addEventListener('dataavailable', (event) {
    final data = (event as html.BlobEvent).data;
    if (data != null && data.size > 0) {
      chunks.add(data);
    }
  });
  recorder.addEventListener('stop', (_) {
    if (!stopped.isCompleted) {
      stopped.complete();
    }
  });

  recorder.start();
  await Future<void>.delayed(duration);
  recorder.stop();
  await stopped.future;

  for (final track in stream.getTracks()) {
    track.stop();
  }

  final contentType = (recorder.mimeType?.isNotEmpty ?? false) ? recorder.mimeType! : 'audio/webm';
  final blob = html.Blob(chunks, contentType);
  final bytes = await _blobToBytes(blob);

  return WebAudio(
    bytes: bytes,
    filename: 'junkbox-recognition.webm',
    contentType: contentType,
  );
}

Future<List<int>> _blobToBytes(html.Blob blob) async {
  final reader = html.FileReader();
  reader.readAsArrayBuffer(blob);
  await reader.onLoadEnd.first;
  return Uint8List.view(reader.result as ByteBuffer);
}
