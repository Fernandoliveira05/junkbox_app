import 'dart:async';
import 'dart:convert';
import 'dart:ui' as ui;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';
import 'package:share_plus/share_plus.dart';
import 'package:timezone/data/latest.dart' as tz;
import 'package:timezone/timezone.dart' as tz;

import 'web_audio_recorder_stub.dart'
    if (dart.library.html) 'web_audio_recorder_web.dart';

const apiBase = String.fromEnvironment(
  'JUNKBOX_API_BASE',
  defaultValue: 'http://10.0.2.2:3333',
);

const vibeOptions = [
  'nostalgico',
  'intenso',
  'calmo',
  'dancante',
  'noturno',
  'feliz',
  'melancolico',
  'brilhante',
  'experimental',
  'classico',
];

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await NotificationService.instance.initialize();
  runApp(const JunkBoxApp());
}

class NotificationService {
  NotificationService._();

  static final instance = NotificationService._();
  final plugin = FlutterLocalNotificationsPlugin();

  static const discoveryReminderId = 1001;
  static const auddFoundId = 1002;

  Future<void> initialize() async {
    tz.initializeTimeZones();

    const androidSettings = AndroidInitializationSettings(
      '@mipmap/ic_launcher',
    );
    const darwinSettings = DarwinInitializationSettings();
    const settings = InitializationSettings(
      android: androidSettings,
      iOS: darwinSettings,
      macOS: darwinSettings,
    );

    await plugin.initialize(settings: settings);
    await requestPermissions();
  }

  Future<void> requestPermissions() async {
    await plugin
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.requestNotificationsPermission();

    await plugin
        .resolvePlatformSpecificImplementation<
          IOSFlutterLocalNotificationsPlugin
        >()
        ?.requestPermissions(alert: true, badge: true, sound: true);
  }

  Future<void> scheduleDailyDiscoveryReminder() async {
    final now = tz.TZDateTime.now(tz.local);
    var scheduled = tz.TZDateTime(tz.local, now.year, now.month, now.day, 20);
    if (scheduled.isBefore(now)) {
      scheduled = scheduled.add(const Duration(days: 1));
    }

    await plugin.zonedSchedule(
      id: discoveryReminderId,
      title: 'Descubra uma música',
      body: 'Abra o JunkBox e reconheça o que está tocando agora.',
      scheduledDate: scheduled,
      notificationDetails: notificationDetails(),
      androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
      matchDateTimeComponents: DateTimeComponents.time,
    );
  }

  Future<void> showAuddFoundNotification(Recognition recognition) async {
    final title = recognition.title;
    if (title == null) return;

    final artist = recognition.artist ?? 'artista desconhecido';
    await plugin.show(
      id: auddFoundId,
      title: 'Musica encontrada',
      body: '$title - $artist',
      notificationDetails: notificationDetails(),
    );
  }

  NotificationDetails notificationDetails() {
    const android = AndroidNotificationDetails(
      'junkbox_music',
      'JunkBox Music',
      channelDescription: 'Reconhecimento de músicas e lembretes do JunkBox.',
      importance: Importance.high,
      priority: Priority.high,
    );
    const darwin = DarwinNotificationDetails();
    return const NotificationDetails(
      android: android,
      iOS: darwin,
      macOS: darwin,
    );
  }
}

class JunkBoxApp extends StatefulWidget {
  const JunkBoxApp({super.key});

  @override
  State<JunkBoxApp> createState() => _JunkBoxAppState();
}

class _JunkBoxAppState extends State<JunkBoxApp> {
  final api = JunkBoxApi(apiBase);
  Session? session;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'JunkBox',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF6C4DFF),
          brightness: Brightness.light,
        ),
        scaffoldBackgroundColor: const Color.fromARGB(255, 255, 255, 255),
        useMaterial3: true,
      ),
      home: session == null
          ? AuthScreen(
              api: api,
              onAuthenticated: (value) => setState(() => session = value),
            )
          : HomeScreen(
              api: api,
              session: session!,
              onLogout: () => setState(() => session = null),
            ),
    );
  }
}

class AuthScreen extends StatefulWidget {
  const AuthScreen({
    required this.api,
    required this.onAuthenticated,
    super.key,
  });

  final JunkBoxApi api;
  final ValueChanged<Session> onAuthenticated;

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final email = TextEditingController(text: '');
  final password = TextEditingController(text: '');
  final username = TextEditingController(text: 'novo_ouvinte');
  final displayName = TextEditingController(text: 'Novo Ouvinte');
  bool register = false;
  bool loading = false;
  String? error;

  Future<void> submit() async {
    setState(() {
      loading = true;
      error = null;
    });

    try {
      final session = register
          ? await widget.api.register(
              username: username.text,
              displayName: displayName.text,
              email: email.text,
              password: password.text,
            )
          : await widget.api.login(email: email.text, password: password.text);
      await NotificationService.instance.scheduleDailyDiscoveryReminder();
      widget.onAuthenticated(session);
    } catch (exception) {
      setState(() => error = exception.toString());
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            const SizedBox(height: 8),
            const Text(
              'Descubra, avalie e compartilhe discos.',
              style: TextStyle(
                fontSize: 42,
                height: 0.95,
                fontWeight: FontWeight.w900,
                color: Color(0xFF1A1A2E),
              ),
            ),
            Image.asset(
              'assets/logo/Logo.png',
              height: 180,
              fit: BoxFit.contain,
            ),
            const SizedBox(height: 8),
            Center(
              child: Text(
                'JunkBox',
                style: TextStyle(
                  fontSize: 42,
                  height: 1.00,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF6C4DFF),
                ),
              ),
            ),
            const SizedBox(height: 78),
            SegmentedButton<bool>(
              segments: const [
                ButtonSegment(value: false, label: Text('Login')),
                ButtonSegment(value: true, label: Text('Registro')),
              ],
              selected: {register},
              onSelectionChanged: (value) =>
                  setState(() => register = value.first),
              style: SegmentedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: const Color(0xFF6C4DFF),
                selectedBackgroundColor: const Color(0xFF6C4DFF),
                selectedForegroundColor: Colors.white,
                side: const BorderSide(color: Color(0xFF6C4DFF), width: 1.5),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                textStyle: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ),
            const SizedBox(height: 18),
            if (register) ...[
              TextField(
                controller: username,
                decoration: const InputDecoration(labelText: 'Username'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: displayName,
                decoration: const InputDecoration(labelText: 'Nome público'),
              ),
              const SizedBox(height: 12),
            ],
            TextField(
              controller: email,
              decoration: const InputDecoration(labelText: 'Email'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: password,
              decoration: const InputDecoration(labelText: 'Senha'),
              obscureText: true,
            ),
            const SizedBox(height: 18),
            FilledButton(
              onPressed: loading ? null : submit,
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF6C4DFF),
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(48),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                textStyle: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),
              child: loading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        color: Colors.white,
                      ),
                    )
                  : Text(register ? 'Criar conta' : 'Entrar'),
            ),
            if (error != null) ...[
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  color: Theme.of(
                    context,
                  ).colorScheme.error.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  error!,
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.error,
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({
    required this.api,
    required this.session,
    required this.onLogout,
    super.key,
  });

  final JunkBoxApi api;
  final Session session;
  final VoidCallback onLogout;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final scaffoldKey = GlobalKey<ScaffoldState>();
  int tab = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: scaffoldKey,
      appBar: AppBar(
        title: InkWell(
          borderRadius: BorderRadius.circular(10),
          onTap: () => scaffoldKey.currentState?.openDrawer(),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Image.asset('assets/logo/Logo.png', height: 52),
          ),
        ),
        actions: [
          IconButton(
            tooltip: 'Sair',
            icon: const Icon(Icons.logout),
            onPressed: widget.onLogout,
          ),
        ],
      ),
      drawer: MyReviewsDrawer(api: widget.api, session: widget.session),
      body: IndexedStack(
        index: tab,
        children: [
          AlbumsPage(api: widget.api, session: widget.session),
          RecognizePage(api: widget.api, session: widget.session),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: tab,
        onDestinationSelected: (value) => setState(() => tab = value),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.album), label: 'Albuns'),
          NavigationDestination(icon: Icon(Icons.mic), label: 'Descobrir'),
        ],
      ),
    );
  }
}

class MyReviewsDrawer extends StatelessWidget {
  const MyReviewsDrawer({required this.api, required this.session, super.key});

  final JunkBoxApi api;
  final Session session;

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: SafeArea(
        child: FutureBuilder<({List<Album> albums, List<JunkBoxReview> reviews})>(
          future: _load(),
          builder: (context, snapshot) {
            if (!snapshot.hasData) {
              return const Center(child: CircularProgressIndicator());
            }

            final albumsById = {
              for (final album in snapshot.data!.albums) album.id: album,
            };
            final reviews = snapshot.data!.reviews.reversed.toList();

            return ListView(
              padding: const EdgeInsets.all(18),
              children: [
                Row(
                  children: [
                    Image.asset('assets/logo/Logo.png', height: 44),
                    const Spacer(),
                    IconButton(
                      tooltip: 'Fechar',
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.close),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                const Text(
                  'Minhas avaliações',
                  style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 6),
                Text('${reviews.length} avaliações salvas'),
                const SizedBox(height: 18),
                if (reviews.isEmpty)
                  const Text('Você ainda não salvou nenhuma avaliação.')
                else
                  ...reviews.map((review) {
                    final album = albumsById[review.targetId];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                if (album != null)
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(8),
                                    child: Image.network(
                                      album.coverUrl,
                                      width: 58,
                                      height: 58,
                                      fit: BoxFit.cover,
                                      cacheWidth: 160,
                                      cacheHeight: 160,
                                    ),
                                  ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        album?.title ?? 'Álbum removido',
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w900,
                                        ),
                                      ),
                                      Text(
                                        album?.artist ?? review.targetType,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            StaticStars(value: review.rating),
                            if (review.vibeTags.isNotEmpty) ...[
                              const SizedBox(height: 8),
                              VibeTagPills(tags: review.vibeTags, compact: true),
                            ],
                            if (review.text.trim().isNotEmpty) ...[
                              const SizedBox(height: 8),
                              Text(
                                review.text,
                                maxLines: 3,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ],
                        ),
                      ),
                    );
                  }),
              ],
            );
          },
        ),
      ),
    );
  }

  Future<({List<Album> albums, List<JunkBoxReview> reviews})> _load() async {
    final results = await Future.wait([
      api.albums(),
      api.myReviews(token: session.token),
    ]);

    return (
      albums: results[0] as List<Album>,
      reviews: results[1] as List<JunkBoxReview>,
    );
  }
}

class AlbumsPage extends StatefulWidget {
  const AlbumsPage({required this.api, required this.session, super.key});

  final JunkBoxApi api;
  final Session session;

  @override
  State<AlbumsPage> createState() => _AlbumsPageState();
}

class _AlbumsPageState extends State<AlbumsPage> {
  late Future<List<Album>> albumsFuture = widget.api.albums();
  String query = '';

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Album>>(
      future: albumsFuture,
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }

        final filteredAlbums = snapshot.data!
            .where(
              (album) => '${album.title} ${album.artist}'
                  .toLowerCase()
                  .contains(query.toLowerCase()),
            )
            .toList();
        final albums = filteredAlbums.take(200).toList();

        return CustomScrollView(
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              sliver: SliverToBoxAdapter(
                child: TextField(
                  decoration: const InputDecoration(
                    prefixIcon: Icon(Icons.search),
                    labelText: 'Buscar álbum ou artista',
                    helperText: 'Mostrando até 200 albuns por vez',
                  ),
                  onChanged: (value) => setState(() => query = value),
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverGrid.builder(
                itemCount: albums.length,
                gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                  maxCrossAxisExtent: 240,
                  mainAxisSpacing: 16,
                  crossAxisSpacing: 16,
                  childAspectRatio: 0.54,
                ),
                itemBuilder: (context, index) => AlbumTile(
                  album: albums[index],
                  onReview: () => openReview(context, albums[index]),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Future<void> openReview(BuildContext context, Album album) async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) =>
            ReviewPage(api: widget.api, session: widget.session, album: album),
      ),
    );
  }
}

class AlbumTile extends StatelessWidget {
  const AlbumTile({required this.album, required this.onReview, super.key});

  final Album album;
  final VoidCallback onReview;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AspectRatio(
            aspectRatio: 1,
            child: Image.network(
              album.coverUrl,
              fit: BoxFit.cover,
              cacheWidth: 360,
              cacheHeight: 360,
              filterQuality: FilterQuality.low,
              loadingBuilder: (context, child, progress) {
                if (progress == null) return child;
                return const ColoredBox(
                  color: Color(0xff241c17),
                  child: Center(
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  album.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 4),
                Text(
                  album.artist,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const Spacer(),
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
            child: SizedBox(
              width: double.infinity,
              height: 40,
              child: FilledButton(
                onPressed: onReview,
                child: const Text(
                  'Classificar',
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class ReviewPage extends StatefulWidget {
  const ReviewPage({
    required this.api,
    required this.session,
    required this.album,
    super.key,
  });

  final JunkBoxApi api;
  final Session session;
  final Album album;

  @override
  State<ReviewPage> createState() => _ReviewPageState();
}

class _ReviewPageState extends State<ReviewPage> {
  final shareCardKey = GlobalKey();
  final text = TextEditingController();
  final selectedVibes = <String>{};
  bool saved = false;
  double rating = 4;
  bool saving = false;
  Future<void> saveReview({required bool shareAfterSave}) async {
    setState(() => saving = true);
    try {
      if (!saved) {
        await widget.api.createReview(
          token: widget.session.token,
          albumId: widget.album.id,
          rating: rating,
          text: text.text,
          vibeTags: selectedVibes.toList(),
        );
        saved = true;
      }

      if (shareAfterSave) {
        final shareText =
            'Eu dei ${rating.toStringAsFixed(1)}/5 para "${widget.album.title}" de ${widget.album.artist} no JunkBox.';
        final imageBytes = await captureShareCard();

        await SharePlus.instance.share(
          ShareParams(
            title: 'Minha classificacao no JunkBox',
            text: shareText,
            files: [
              XFile.fromData(
                imageBytes,
                name: 'junkbox-${widget.album.id}.png',
                mimeType: 'image/png',
              ),
            ],
          ),
        );
      }

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            shareAfterSave ? 'Avaliacao salva e pronta para compartilhar.' : 'Avaliacao salva.',
          ),
        ),
      );
      Navigator.pop(context);
    } catch (exception) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(exception.toString())));
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  Future<Uint8List> captureShareCard() async {
    await WidgetsBinding.instance.endOfFrame;
    await Future<void>.delayed(const Duration(milliseconds: 80));
    final boundary =
        shareCardKey.currentContext!.findRenderObject()!
            as RenderRepaintBoundary;
    final image = await boundary.toImage(pixelRatio: 2);
    final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
    return byteData!.buffer.asUint8List();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Classificar')),
      body: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned(
            left: -10000,
            top: 0,
            child: SizedBox(
              width: 360,
              height: 640,
              child: RepaintBoundary(
                key: shareCardKey,
                child: ReviewShareCard(
                  album: widget.album,
                  rating: rating,
                  comment: text.text,
                  vibeTags: selectedVibes.toList(),
                ),
              ),
            ),
          ),
          ListView(
            padding: const EdgeInsets.all(16),
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.network(
                  widget.album.coverUrl,
                  height: 280,
                  fit: BoxFit.contain,
                  cacheWidth: 720,
                  filterQuality: FilterQuality.medium,
                ),
              ),
              const SizedBox(height: 18),
              Text(
                widget.album.artist,
                style: const TextStyle(
                  color: Color.fromARGB(255, 201, 74, 240),
                ),
              ),
              Text(
                widget.album.title,
                style: const TextStyle(
                  fontSize: 34,
                  height: 1,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 18),
              StarRating(
                value: rating,
                onChanged: (value) => setState(() => rating = value),
              ),
              const SizedBox(height: 14),
              VibeTagSelector(
                selected: selectedVibes,
                onChanged: (tag) {
                  setState(() {
                    if (selectedVibes.contains(tag)) {
                      selectedVibes.remove(tag);
                    } else if (selectedVibes.length < 6) {
                      selectedVibes.add(tag);
                    }
                  });
                },
              ),
              const SizedBox(height: 12),
              TextField(
                controller: text,
                minLines: 4,
                maxLines: 7,
                decoration: const InputDecoration(labelText: 'Comentario'),
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: 22),
              FilledButton.icon(
                onPressed: saving ? null : () => saveReview(shareAfterSave: false),
                icon: const Icon(Icons.save),
                label: Text(saving ? 'Salvando...' : 'Salvar avaliacao'),
              ),
              const SizedBox(height: 10),
              OutlinedButton.icon(
                onPressed: saving ? null : () => saveReview(shareAfterSave: true),
                icon: const Icon(Icons.ios_share),
                label: Text(
                  saving
                      ? 'Preparando imagem...'
                      : 'Salvar e compartilhar imagem',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class VibeTagSelector extends StatelessWidget {
  const VibeTagSelector({
    required this.selected,
    required this.onChanged,
    super.key,
  });

  final Set<String> selected;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Tags de vibe',
          style: TextStyle(fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: vibeOptions.map((tag) {
            final active = selected.contains(tag);
            return FilterChip(
              label: Text(tag),
              selected: active,
              onSelected: (_) => onChanged(tag),
            );
          }).toList(),
        ),
      ],
    );
  }
}

class VibeTagPills extends StatelessWidget {
  const VibeTagPills({required this.tags, this.compact = false, super.key});

  final List<String> tags;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: compact ? 5 : 8,
      runSpacing: compact ? 5 : 8,
      children: tags
          .map(
            (tag) => Container(
              padding: EdgeInsets.symmetric(
                horizontal: compact ? 8 : 10,
                vertical: compact ? 4 : 6,
              ),
              decoration: BoxDecoration(
                color: const Color(0xfff0b14a),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                tag,
                style: TextStyle(
                  color: const Color(0xff15120f),
                  fontSize: compact ? 11 : 13,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          )
          .toList(),
    );
  }
}

class ReviewShareCard extends StatelessWidget {
  const ReviewShareCard({
    required this.album,
    required this.rating,
    required this.comment,
    required this.vibeTags,
    super.key,
  });

  final Album album;
  final double rating;
  final String comment;
  final List<String> vibeTags;

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 9 / 16,
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Image.asset(
                  'assets/logo/Logo.png',
                  width: 92,
                  height: 42,
                  fit: BoxFit.contain,
                ),
                const Spacer(),
                const Text(
                  'JunkBox',
                  style: TextStyle(
                    color: Color(0xff15120f),
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: Image.network(
                  album.coverUrl,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  cacheWidth: 720,
                  cacheHeight: 1280,
                  filterQuality: FilterQuality.medium,
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              album.title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Color(0xff15120f),
                fontSize: 28,
                height: 0.98,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              album.artist,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: Color(0xff5b534a)),
            ),
            const SizedBox(height: 10),
            StaticStars(value: rating),
            if (vibeTags.isNotEmpty) ...[
              const SizedBox(height: 8),
              VibeTagPills(tags: vibeTags, compact: true),
            ],
            if (comment.trim().isNotEmpty) ...[
              const SizedBox(height: 10),
              Text(
                '"${comment.trim()}"',
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Color(0xff15120f),
                  fontSize: 16,
                  height: 1.25,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class StaticStars extends StatelessWidget {
  const StaticStars({required this.value, super.key});

  final double value;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        ...List.generate(5, (index) {
          final starValue = index + 1;
          final icon = value >= starValue
              ? Icons.star
              : value >= starValue - 0.5
              ? Icons.star_half
              : Icons.star_border;
          return Icon(icon, color: const Color(0xfff0b14a), size: 26);
        }),
        const SizedBox(width: 8),
        Text(
          value.toStringAsFixed(1),
          style: const TextStyle(
            color: Color(0xff15120f),
            fontWeight: FontWeight.w900,
          ),
        ),
      ],
    );
  }
}

class StarRating extends StatelessWidget {
  const StarRating({required this.value, required this.onChanged, super.key});

  final double value;
  final ValueChanged<double> onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text('Nota: ${value.toStringAsFixed(1)}'),
        const SizedBox(height: 8),
        Wrap(
          spacing: 2,
          children: List.generate(5, (index) {
            final starValue = index + 1;
            final icon = value >= starValue
                ? Icons.star
                : value >= starValue - 0.5
                ? Icons.star_half
                : Icons.star_border;

            return SizedBox(
              width: 48,
              height: 48,
              child: IconButton(
                tooltip: '${starValue.toStringAsFixed(1)} estrelas',
                icon: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 200),
                  transitionBuilder: (child, animation) =>
                      ScaleTransition(scale: animation, child: child),
                  child: Icon(
                    icon,
                    key: ValueKey(icon),
                    size: 34,
                    color: const Color(0xfff0b14a),
                  ),
                ),
                onPressed: () {
                  final next = value == starValue
                      ? starValue - 0.5
                      : starValue.toDouble();
                  onChanged(next.clamp(0.5, 5).toDouble());
                },
              ),
            );
          }),
        ),
      ],
    );
  }
}

class RecognizePage extends StatefulWidget {
  const RecognizePage({required this.api, required this.session, super.key});

  final JunkBoxApi api;
  final Session session;

  @override
  State<RecognizePage> createState() => _RecognizePageState();
}

class _RecognizePageState extends State<RecognizePage> {
  final recorder = AudioRecorder();
  bool recording = false;
  String status = 'Toque para gravar 8 segundos do áudio ambiente.';
  String? result;

  @override
  void dispose() {
    recorder.dispose();
    super.dispose();
  }

  Future<void> recognize() async {
    setState(() {
      recording = true;
      status = 'Gravando...';
      result = null;
    });

    try {
      if (!await recorder.hasPermission()) {
        throw Exception('Permissão de microfone negada.');
      }

      Recognition recognition;
      if (kIsWeb) {
        final audio = await recordWebAudio(const Duration(seconds: 8));
        setState(() => status = 'Enviando para AudD...');
        recognition = await widget.api.recognizeBytes(
          token: widget.session.token,
          bytes: audio.bytes,
          filename: audio.filename,
          contentType: audio.contentType,
        );
      } else {
        final temp = await getTemporaryDirectory();
        final path = '${temp.path}/junkbox-recognition.m4a';
        await recorder.start(
          const RecordConfig(encoder: AudioEncoder.aacLc),
          path: path,
        );
        await Future<void>.delayed(const Duration(seconds: 8));
        final audioPath = await recorder.stop();

        if (audioPath == null) {
          throw Exception('Não foi possível gravar o áudio.');
        }

        setState(() => status = 'Enviando para AudD...');
        recognition = await widget.api.recognize(
          token: widget.session.token,
          audioPath: audioPath,
        );
      }

      setState(() {
        status = recognition.title == null
            ? 'Nenhuma música reconhecida.'
            : 'Música encontrada.';
        result = recognition.title == null
            ? 'Tente aproximar o microfone da música.'
            : '${recognition.title} - ${recognition.artist ?? 'artista desconhecido'}';
      });
      await NotificationService.instance.showAuddFoundNotification(recognition);
    } catch (exception) {
      setState(() => status = exception.toString());
    } finally {
      if (mounted) setState(() => recording = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                _EqualizerBar(
                  delay: const Duration(milliseconds: 0),
                  active: recording,
                ),
                const SizedBox(width: 6),
                _EqualizerBar(
                  delay: const Duration(milliseconds: 120),
                  active: recording,
                ),
                const SizedBox(width: 6),
                _EqualizerBar(
                  delay: const Duration(milliseconds: 240),
                  active: recording,
                ),
                const SizedBox(width: 6),
                _EqualizerBar(
                  delay: const Duration(milliseconds: 360),
                  active: recording,
                ),
                const SizedBox(width: 6),
                _EqualizerBar(
                  delay: const Duration(milliseconds: 480),
                  active: recording,
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Text(
              'Descobrir música',
              style: TextStyle(fontSize: 34, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 10),
            Text(status, textAlign: TextAlign.center),
            if (result != null) ...[
              const SizedBox(height: 18),
              Text(
                result!,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 20, color: Color(0xff66d0a1)),
              ),
            ],
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: recording ? null : recognize,
              icon: Icon(recording ? Icons.mic : Icons.mic_none),
              label: Text(recording ? 'Gravando...' : 'Gravar 8s'),
            ),
          ],
        ),
      ),
    );
  }
}

class _EqualizerBar extends StatefulWidget {
  const _EqualizerBar({required this.delay, required this.active});

  final Duration delay;
  final bool active;

  @override
  State<_EqualizerBar> createState() => _EqualizerBarState();
}

class _EqualizerBarState extends State<_EqualizerBar> {
  double height = 16;
  bool disposed = false;

  @override
  void initState() {
    super.initState();
    Future.delayed(widget.delay, tick);
  }

  @override
  void dispose() {
    disposed = true;
    super.dispose();
  }

  void tick() {
    if (disposed || !mounted) return;
    setState(() => height = widget.active ? (height < 50 ? 76 : 16) : 16);
    Future.delayed(const Duration(milliseconds: 350), tick);
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 350),
      curve: Curves.easeInOut,
      width: 10,
      height: height,
      decoration: BoxDecoration(
        color: const Color(0xfff0b14a),
        borderRadius: BorderRadius.circular(4),
      ),
    );
  }
}

class JunkBoxApi {
  JunkBoxApi(this.baseUrl);

  final String baseUrl;

  Future<Session> login({
    required String email,
    required String password,
  }) async {
    final json = await postJson('/auth/login', {
      'email': email,
      'password': password,
    });
    return Session.fromJson(json);
  }

  Future<Session> register({
    required String username,
    required String displayName,
    required String email,
    required String password,
  }) async {
    final json = await postJson('/auth/register', {
      'username': username,
      'displayName': displayName,
      'email': email,
      'password': password,
    });
    return Session.fromJson(json);
  }

  Future<List<Album>> albums() async {
    final response = await http.get(Uri.parse('$baseUrl/albums'));
    final json = decodeResponse(response) as List<dynamic>;
    return json
        .map((item) => Album.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<void> createReview({
    required String token,
    required String albumId,
    required double rating,
    required String text,
    required List<String> vibeTags,
  }) async {
    await postJson('/reviews', {
      'targetType': 'album',
      'targetId': albumId,
      'rating': rating,
      'text': text,
      'vibeTags': vibeTags,
    }, token: token);
  }

  Future<List<JunkBoxReview>> myReviews({required String token}) async {
    final response = await http.get(
      Uri.parse('$baseUrl/reviews/me'),
      headers: {'Authorization': 'Bearer $token'},
    );
    final json = decodeResponse(response) as List<dynamic>;
    return json
        .map((item) => JunkBoxReview.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<Recognition> recognize({
    required String token,
    required String audioPath,
  }) async {
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/recognition/audd'),
    );
    request.headers['Authorization'] = 'Bearer $token';
    request.files.add(await http.MultipartFile.fromPath('audio', audioPath));
    final streamed = await request.send();
    final response = await http.Response.fromStream(streamed);
    final json = decodeResponse(response) as Map<String, dynamic>;
    return Recognition.fromJson(json);
  }

  Future<Recognition> recognizeBytes({
    required String token,
    required List<int> bytes,
    required String filename,
    required String contentType,
  }) async {
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/recognition/audd'),
    );
    request.headers['Authorization'] = 'Bearer $token';
    request.files.add(
      http.MultipartFile.fromBytes(
        'audio',
        bytes,
        filename: filename,
        contentType: MediaType.parse(contentType),
      ),
    );
    final streamed = await request.send();
    final response = await http.Response.fromStream(streamed);
    final json = decodeResponse(response) as Map<String, dynamic>;
    return Recognition.fromJson(json);
  }

  Future<Map<String, dynamic>> postJson(
    String path,
    Map<String, dynamic> body, {
    String? token,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl$path'),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
      body: jsonEncode(body),
    );
    return decodeResponse(response) as Map<String, dynamic>;
  }

  Object decodeResponse(http.Response response) {
    final body = response.body.isEmpty ? null : jsonDecode(response.body);
    if (response.statusCode >= 400) {
      final message = body is Map<String, dynamic> ? body['message'] : null;
      throw Exception(message ?? 'Erro HTTP ${response.statusCode}');
    }
    return body as Object;
  }
}

class Session {
  Session({required this.token, required this.profile});

  final String token;
  final Profile profile;

  factory Session.fromJson(Map<String, dynamic> json) {
    return Session(
      token: json['token'] as String,
      profile: Profile.fromJson(json['profile'] as Map<String, dynamic>),
    );
  }
}

class Profile {
  Profile({required this.displayName});

  final String displayName;

  factory Profile.fromJson(Map<String, dynamic> json) {
    return Profile(
      displayName: (json['displayName'] ?? json['username']) as String,
    );
  }
}

class Album {
  Album({
    required this.id,
    required this.title,
    required this.artist,
    required this.coverUrl,
  });

  final String id;
  final String title;
  final String artist;
  final String coverUrl;

  factory Album.fromJson(Map<String, dynamic> json) {
    return Album(
      id: json['id'] as String,
      title: json['title'] as String,
      artist: json['artist'] as String,
      coverUrl: json['coverUrl'] as String,
    );
  }
}

class JunkBoxReview {
  JunkBoxReview({
    required this.id,
    required this.targetType,
    required this.targetId,
    required this.rating,
    required this.text,
    required this.vibeTags,
  });

  final String id;
  final String targetType;
  final String targetId;
  final double rating;
  final String text;
  final List<String> vibeTags;

  factory JunkBoxReview.fromJson(Map<String, dynamic> json) {
    return JunkBoxReview(
      id: json['id'] as String,
      targetType: json['targetType'] as String,
      targetId: json['targetId'] as String,
      rating: (json['rating'] as num).toDouble(),
      text: (json['text'] ?? '') as String,
      vibeTags: (json['vibeTags'] as List<dynamic>? ?? [])
          .map((tag) => tag as String)
          .toList(),
    );
  }
}

class Recognition {
  Recognition({this.title, this.artist});

  final String? title;
  final String? artist;

  factory Recognition.fromJson(Map<String, dynamic> json) {
    final song = json['song'];
    if (song is! Map<String, dynamic>) return Recognition();
    return Recognition(
      title: song['title'] as String?,
      artist: song['artist'] as String?,
    );
  }
}
