import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const dataFile = join(process.cwd(), "data", "junkbox.json");

const db = JSON.parse(await readFile(dataFile, "utf8"));
const coverOverrides = new Map([
  [
    "Taylor Swift::Folklore",
    "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/7c/04/ba/7c04ba17-2ff8-21b3-0ac0-7d141f86e924/20UMGIM64216.rgb.jpg/1000x1000bb.jpg"
  ],
  [
    "The Velvet Underground & Nico::The Velvet Underground & Nico",
    "https://coverartarchive.org/release-group/5cbd9d7b-597a-3c5e-bfd1-c2b364215560/front-500"
  ],
  [
    "Chico Science and Nacao Zumbi::Da Lama ao Caos",
    "https://coverartarchive.org/release-group/b09ea0ac-051f-3d7d-b54b-432d1ad5cde6/front-500"
  ]
]);
let updated = 0;
let fallback = 0;

for (const album of db.albums) {
  const coverUrl = coverOverrides.get(`${album.artist}::${album.title}`) ?? (await findCover(album));

  if (coverUrl) {
    album.coverUrl = coverUrl;
    for (const song of db.songs.filter((candidate) => candidate.albumId === album.id)) {
      song.coverUrl = coverUrl;
    }
    updated += 1;
  } else {
    fallback += 1;
    console.warn(`No real cover found for: ${album.artist} - ${album.title}`);
  }
}

await writeFile(dataFile, JSON.stringify(db, null, 2), "utf8");
console.log(`Real covers updated: ${updated}. Local fallbacks kept: ${fallback}.`);

async function findCover(album) {
  return (await findItunesCover(album)) ?? (await findDeezerCover(album));
}

async function findItunesCover(album) {
  const query = new URLSearchParams({
    term: `${album.artist} ${album.title}`,
    entity: "album",
    media: "music",
    limit: "10"
  });

  const response = await fetch(`https://itunes.apple.com/search?${query.toString()}`);
  if (!response.ok) {
    return undefined;
  }

  const payload = await response.json();
  const results = Array.isArray(payload.results) ? payload.results : [];
  const match = bestMatch(results, album, {
    titleKey: "collectionName",
    artistKey: "artistName"
  });

  return match?.artworkUrl100?.replace("100x100bb", "1000x1000bb");
}

async function findDeezerCover(album) {
  const query = encodeURIComponent(`artist:"${album.artist}" album:"${album.title}"`);
  const response = await fetch(`https://api.deezer.com/search/album?q=${query}&limit=10`);
  if (!response.ok) {
    return undefined;
  }

  const payload = await response.json();
  const results = Array.isArray(payload.data) ? payload.data : [];
  const match = bestMatch(results, album, {
    titleKey: "title",
    artistKey: "artist.name"
  });

  return match?.cover_xl ?? match?.cover_big;
}

function bestMatch(results, album, keys) {
  const wantedTitle = normalize(album.title);
  const wantedArtist = normalize(album.artist);

  return (
    results.find((result) => {
      const title = normalize(get(result, keys.titleKey));
      const artist = normalize(get(result, keys.artistKey));
      return title === wantedTitle && artist === wantedArtist;
    }) ??
    results.find((result) => {
      const title = normalize(get(result, keys.titleKey));
      const artist = normalize(get(result, keys.artistKey));
      return title.includes(wantedTitle) || wantedTitle.includes(title) || artist.includes(wantedArtist);
    }) ??
    results[0]
  );
}

function get(value, path) {
  return path.split(".").reduce((current, key) => current?.[key], value);
}

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
