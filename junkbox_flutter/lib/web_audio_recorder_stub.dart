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

Future<WebAudio> recordWebAudio(Duration duration) {
  throw UnsupportedError('Gravação web indisponível nesta plataforma.');
}
