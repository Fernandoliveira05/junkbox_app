import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import bcrypt from "bcryptjs";

const baseUrl = "http://localhost:3333";
const seedUserId = "11111111-1111-4111-8111-111111111111";
const coverDir = join(process.cwd(), "public", "covers");
const dataFile = join(process.cwd(), "data", "junkbox.json");

const albums = [
  {
    title: "Random Access Memories",
    artist: "Daft Punk",
    releaseDate: "2013-05-17",
    colors: ["#101114", "#d7c48d", "#e6e1d2"],
    songs: [
      ["Give Life Back to Music", 274],
      ["Instant Crush", 337],
      ["Get Lucky", 369]
    ]
  },
  {
    title: "OK Computer",
    artist: "Radiohead",
    releaseDate: "1997-05-21",
    colors: ["#d8dfe8", "#23354e", "#7590a8"],
    songs: [
      ["Paranoid Android", 383],
      ["Karma Police", 264],
      ["No Surprises", 229]
    ]
  },
  {
    title: "DAMN.",
    artist: "Kendrick Lamar",
    releaseDate: "2017-04-14",
    colors: ["#eee8db", "#c61f2d", "#171717"],
    songs: [
      ["DNA.", 185],
      ["HUMBLE.", 177],
      ["LOVE.", 213]
    ]
  },
  {
    title: "RENAISSANCE",
    artist: "Beyonce",
    releaseDate: "2022-07-29",
    colors: ["#141820", "#d9d6ce", "#b7a16b"],
    songs: [
      ["ALIEN SUPERSTAR", 215],
      ["CUFF IT", 225],
      ["BREAK MY SOUL", 278]
    ]
  },
  {
    title: "IGOR",
    artist: "Tyler, The Creator",
    releaseDate: "2019-05-17",
    colors: ["#f4b8c9", "#312d2f", "#f6ccda"],
    songs: [
      ["EARFQUAKE", 190],
      ["NEW MAGIC WAND", 195],
      ["A BOY IS A GUN", 210]
    ]
  },
  {
    title: "The Miseducation of Lauryn Hill",
    artist: "Lauryn Hill",
    releaseDate: "1998-08-25",
    colors: ["#7a3f2a", "#f1d2a0", "#263238"],
    songs: [
      ["Doo Wop (That Thing)", 320],
      ["Ex-Factor", 327],
      ["To Zion", 369]
    ]
  },
  {
    title: "Thriller",
    artist: "Michael Jackson",
    releaseDate: "1982-11-30",
    colors: ["#f3f0e8", "#1f2530", "#b21f2d"],
    songs: [
      ["Wanna Be Startin' Somethin'", 363],
      ["Billie Jean", 294],
      ["Beat It", 258]
    ]
  },
  {
    title: "Abbey Road",
    artist: "The Beatles",
    releaseDate: "1969-09-26",
    colors: ["#cfd9df", "#ffffff", "#2d3a2f"],
    songs: [
      ["Come Together", 259],
      ["Something", 182],
      ["Here Comes the Sun", 185]
    ]
  },
  {
    title: "Purple Rain",
    artist: "Prince and the Revolution",
    releaseDate: "1984-06-25",
    colors: ["#2d153f", "#7f4bb2", "#f0d3ff"],
    songs: [
      ["Let's Go Crazy", 279],
      ["When Doves Cry", 353],
      ["Purple Rain", 520]
    ]
  },
  {
    title: "Blonde",
    artist: "Frank Ocean",
    releaseDate: "2016-08-20",
    colors: ["#edf1e8", "#85a98f", "#232323"],
    songs: [
      ["Nikes", 314],
      ["Ivy", 249],
      ["Nights", 307]
    ]
  },
  {
    title: "Songs in the Key of Life",
    artist: "Stevie Wonder",
    releaseDate: "1976-09-28",
    colors: ["#0c2c44", "#f2c14e", "#f9f1d0"],
    songs: [
      ["Sir Duke", 233],
      ["I Wish", 252],
      ["As", 427]
    ]
  },
  {
    title: "Back to Black",
    artist: "Amy Winehouse",
    releaseDate: "2006-10-27",
    colors: ["#f1f1ed", "#111111", "#c9a227"],
    songs: [
      ["Rehab", 214],
      ["You Know I'm No Good", 257],
      ["Back to Black", 241]
    ]
  },
  {
    title: "Nevermind",
    artist: "Nirvana",
    releaseDate: "1991-09-24",
    colors: ["#2b90d9", "#d7f1ff", "#172f49"],
    songs: [
      ["Smells Like Teen Spirit", 301],
      ["Come as You Are", 219],
      ["Lithium", 257]
    ]
  },
  {
    title: "Lemonade",
    artist: "Beyonce",
    releaseDate: "2016-04-23",
    colors: ["#f5d24a", "#1d1d1d", "#fff4bf"],
    songs: [
      ["Hold Up", 221],
      ["Sorry", 232],
      ["Formation", 206]
    ]
  },
  {
    title: "Rumours",
    artist: "Fleetwood Mac",
    releaseDate: "1977-02-04",
    colors: ["#f0efe8", "#1d2633", "#b9a77d"],
    songs: [
      ["Dreams", 257],
      ["Go Your Own Way", 218],
      ["The Chain", 270]
    ]
  },
  {
    title: "21",
    artist: "Adele",
    releaseDate: "2011-01-24",
    colors: ["#181818", "#e7e2d8", "#6b6b6b"],
    songs: [
      ["Rolling in the Deep", 228],
      ["Someone Like You", 285],
      ["Set Fire to the Rain", 242]
    ]
  },
  {
    title: "Blue",
    artist: "Joni Mitchell",
    releaseDate: "1971-06-22",
    colors: ["#143a5a", "#5fb0d7", "#e7f3ff"],
    songs: [
      ["Carey", 183],
      ["River", 240],
      ["A Case of You", 263]
    ]
  },
  {
    title: "What's Going On",
    artist: "Marvin Gaye",
    releaseDate: "1971-05-21",
    colors: ["#8b5a36", "#d6b38c", "#243a31"],
    songs: [
      ["What's Going On", 233],
      ["Mercy Mercy Me", 193],
      ["Inner City Blues", 316]
    ]
  },
  {
    title: "Discovery",
    artist: "Daft Punk",
    releaseDate: "2001-03-12",
    colors: ["#10152e", "#48d1cc", "#f6a623"],
    songs: [
      ["One More Time", 320],
      ["Digital Love", 301],
      ["Harder, Better, Faster, Stronger", 224]
    ]
  },
  {
    title: "Kind of Blue",
    artist: "Miles Davis",
    releaseDate: "1959-08-17",
    colors: ["#102a43", "#5d91c4", "#e2eef8"],
    songs: [
      ["So What", 545],
      ["Freddie Freeloader", 586],
      ["Blue in Green", 337]
    ]
  },
  {
    title: "The Dark Side of the Moon",
    artist: "Pink Floyd",
    releaseDate: "1973-03-01",
    colors: ["#050505", "#ffffff", "#6dd3ff"],
    songs: [
      ["Time", 413],
      ["Money", 382],
      ["Us and Them", 469]
    ]
  },
  {
    title: "The Low End Theory",
    artist: "A Tribe Called Quest",
    releaseDate: "1991-09-24",
    colors: ["#0f1512", "#d33f49", "#59c173"],
    songs: [
      ["Excursions", 234],
      ["Check the Rhime", 216],
      ["Scenario", 250]
    ]
  },
  {
    title: "When We All Fall Asleep, Where Do We Go?",
    artist: "Billie Eilish",
    releaseDate: "2019-03-29",
    colors: ["#f3f4f1", "#121212", "#8ea7b7"],
    songs: [
      ["bad guy", 194],
      ["bury a friend", 193],
      ["when the party's over", 196]
    ]
  },
  {
    title: "Jagged Little Pill",
    artist: "Alanis Morissette",
    releaseDate: "1995-06-13",
    colors: ["#f2a03d", "#111111", "#f7e5c7"],
    songs: [
      ["You Oughta Know", 249],
      ["Hand in My Pocket", 222],
      ["Ironic", 229]
    ]
  },
  {
    title: "Ready to Die",
    artist: "The Notorious B.I.G.",
    releaseDate: "1994-09-13",
    colors: ["#f4f0dc", "#b2192a", "#191919"],
    songs: [
      ["Juicy", 302],
      ["Big Poppa", 253],
      ["Machine Gun Funk", 257]
    ]
  },
  {
    title: "Kid A",
    artist: "Radiohead",
    releaseDate: "2000-10-02",
    colors: ["#dfe8ee", "#bf2f3d", "#1e4e7a"],
    songs: [
      ["Everything in Its Right Place", 251],
      ["Idioteque", 309],
      ["How to Disappear Completely", 356]
    ]
  },
  {
    title: "London Calling",
    artist: "The Clash",
    releaseDate: "1979-12-14",
    colors: ["#121212", "#1bb04a", "#e95b4d"],
    songs: [
      ["London Calling", 200],
      ["Train in Vain", 190],
      ["Lost in the Supermarket", 227]
    ]
  },
  {
    title: "Illmatic",
    artist: "Nas",
    releaseDate: "1994-04-19",
    colors: ["#6c7a89", "#f2d2a9", "#151515"],
    songs: [
      ["N.Y. State of Mind", 294],
      ["The World Is Yours", 290],
      ["It Ain't Hard to Tell", 202]
    ]
  },
  {
    title: "Aquemini",
    artist: "Outkast",
    releaseDate: "1998-09-29",
    colors: ["#1d1028", "#d9a441", "#60a65f"],
    songs: [
      ["Rosa Parks", 324],
      ["Aquemini", 319],
      ["SpottieOttieDopaliscious", 427]
    ]
  },
  {
    title: "Remain in Light",
    artist: "Talking Heads",
    releaseDate: "1980-10-08",
    colors: ["#cc2b2b", "#f2e8cf", "#1d1d1d"],
    songs: [
      ["Born Under Punches", 349],
      ["Crosseyed and Painless", 285],
      ["Once in a Lifetime", 259]
    ]
  },
  {
    title: "Ctrl",
    artist: "SZA",
    releaseDate: "2017-06-09",
    colors: ["#2e6b4f", "#d4e0c8", "#111812"],
    songs: [
      ["Supermodel", 181],
      ["Love Galore", 275],
      ["The Weekend", 272]
    ]
  },
  {
    title: "Un Verano Sin Ti",
    artist: "Bad Bunny",
    releaseDate: "2022-05-06",
    colors: ["#77c8e8", "#f9d65c", "#ef6b73"],
    songs: [
      ["Moscow Mule", 245],
      ["Tití Me Preguntó", 243],
      ["Ojitos Lindos", 258]
    ]
  },
  {
    title: "El Mal Querer",
    artist: "Rosalia",
    releaseDate: "2018-11-02",
    colors: ["#f6efe7", "#c32235", "#d6a734"],
    songs: [
      ["MALAMENTE", 151],
      ["PIENSO EN TU MIRÁ", 193],
      ["BAGDAD", 182]
    ]
  },
  {
    title: "The College Dropout",
    artist: "Kanye West",
    releaseDate: "2004-02-10",
    colors: ["#7b4f2c", "#f0c36a", "#3a2416"],
    songs: [
      ["We Don't Care", 240],
      ["Jesus Walks", 193],
      ["Through the Wire", 221]
    ]
  },
  {
    title: "Channel Orange",
    artist: "Frank Ocean",
    releaseDate: "2012-07-10",
    colors: ["#f47c20", "#fff3d1", "#202020"],
    songs: [
      ["Thinkin Bout You", 200],
      ["Pyramids", 592],
      ["Lost", 234]
    ]
  },
  {
    title: "Is This It",
    artist: "The Strokes",
    releaseDate: "2001-07-30",
    colors: ["#1f2933", "#d8d8d8", "#cc3d3d"],
    songs: [
      ["Is This It", 155],
      ["Last Nite", 197],
      ["Someday", 183]
    ]
  },
  {
    title: "In Rainbows",
    artist: "Radiohead",
    releaseDate: "2007-10-10",
    colors: ["#101010", "#e9462f", "#4aa3df"],
    songs: [
      ["15 Step", 237],
      ["Nude", 255],
      ["Reckoner", 290]
    ]
  },
  {
    title: "Folklore",
    artist: "Taylor Swift",
    releaseDate: "2020-07-24",
    colors: ["#d9d9d4", "#4f5655", "#111111"],
    songs: [
      ["cardigan", 239],
      ["exile", 285],
      ["august", 261]
    ]
  },
  {
    title: "A Night at the Opera",
    artist: "Queen",
    releaseDate: "1975-11-21",
    colors: ["#f7f2e7", "#a83f3f", "#354f7a"],
    songs: [
      ["Death on Two Legs", 223],
      ["You're My Best Friend", 172],
      ["Bohemian Rhapsody", 354]
    ]
  },
  {
    title: "The Velvet Underground & Nico",
    artist: "The Velvet Underground & Nico",
    releaseDate: "1967-03-12",
    colors: ["#f8e45c", "#202020", "#f4f1dc"],
    songs: [
      ["Sunday Morning", 173],
      ["I'm Waiting for the Man", 279],
      ["Heroin", 432]
    ]
  },
  {
    title: "Chega de Saudade",
    artist: "Joao Gilberto",
    releaseDate: "1959-03-01",
    colors: ["#efe7d0", "#2f6d67", "#1f2d2c"],
    songs: [
      ["Chega de Saudade", 119],
      ["Desafinado", 118],
      ["Bim Bom", 90]
    ]
  },
  {
    title: "Elis & Tom",
    artist: "Elis Regina and Antonio Carlos Jobim",
    releaseDate: "1974-05-01",
    colors: ["#f4efe4", "#8f5b3f", "#2d2a26"],
    songs: [
      ["Aguas de Marco", 212],
      ["Corcovado", 236],
      ["So Tinha de Ser com Voce", 229]
    ]
  },
  {
    title: "Clube da Esquina",
    artist: "Milton Nascimento and Lo Borges",
    releaseDate: "1972-03-01",
    colors: ["#d6b279", "#2d4d5e", "#f3ead8"],
    songs: [
      ["Tudo Que Voce Podia Ser", 169],
      ["Cais", 170],
      ["Trem Azul", 197]
    ]
  },
  {
    title: "Acabou Chorare",
    artist: "Novos Baianos",
    releaseDate: "1972-09-01",
    colors: ["#f0cc53", "#197c68", "#25211a"],
    songs: [
      ["Brasil Pandeiro", 237],
      ["Preta Pretinha", 380],
      ["Acabou Chorare", 270]
    ]
  },
  {
    title: "Construcao",
    artist: "Chico Buarque",
    releaseDate: "1971-01-01",
    colors: ["#b94836", "#f1d9ae", "#2b201b"],
    songs: [
      ["Deus Lhe Pague", 195],
      ["Cotidiano", 169],
      ["Construcao", 389]
    ]
  },
  {
    title: "Transa",
    artist: "Caetano Veloso",
    releaseDate: "1972-01-01",
    colors: ["#e2d2a2", "#5b3b82", "#181818"],
    songs: [
      ["You Don't Know Me", 210],
      ["Nine Out of Ten", 295],
      ["Triste Bahia", 580]
    ]
  },
  {
    title: "Expresso 2222",
    artist: "Gilberto Gil",
    releaseDate: "1972-01-01",
    colors: ["#e9a13b", "#1f684d", "#2a1d16"],
    songs: [
      ["Expresso 2222", 157],
      ["Oriente", 358],
      ["Back in Bahia", 272]
    ]
  },
  {
    title: "A Tabua de Esmeralda",
    artist: "Jorge Ben Jor",
    releaseDate: "1974-01-01",
    colors: ["#1f7a5a", "#d9bf73", "#121714"],
    songs: [
      ["Os Alquimistas Estao Chegando", 198],
      ["Menina Mulher da Pele Preta", 235],
      ["Zumbi", 207]
    ]
  },
  {
    title: "Cartola",
    artist: "Cartola",
    releaseDate: "1976-01-01",
    colors: ["#3b1f1d", "#d75a4a", "#f0dcc2"],
    songs: [
      ["O Mundo e um Moinho", 249],
      ["As Rosas Nao Falam", 173],
      ["Preciso Me Encontrar", 170]
    ]
  },
  {
    title: "A Divina Comedia ou Ando Meio Desligado",
    artist: "Os Mutantes",
    releaseDate: "1970-03-01",
    colors: ["#7c2d6b", "#f6d34d", "#1e1521"],
    songs: [
      ["Ando Meio Desligado", 285],
      ["Quem Tem Medo de Brincar de Amor", 225],
      ["Ave Lucifer", 162]
    ]
  },
  {
    title: "Da Lama ao Caos",
    artist: "Chico Science and Nacao Zumbi",
    releaseDate: "1994-04-01",
    colors: ["#40311f", "#d16f36", "#d9c7a3"],
    songs: [
      ["A Cidade", 275],
      ["Da Lama ao Caos", 260],
      ["Maracatu de Tiro Certeiro", 226]
    ]
  },
  {
    title: "Sobrevivendo no Inferno",
    artist: "Racionais MC's",
    releaseDate: "1997-12-20",
    colors: ["#111111", "#7d1f1f", "#e0d6c8"],
    songs: [
      ["Diario de um Detento", 451],
      ["Capitulo 4, Versiculo 3", 484],
      ["Formula Magica da Paz", 642]
    ]
  },
  {
    title: "Afrociberdelia",
    artist: "Chico Science and Nacao Zumbi",
    releaseDate: "1996-04-01",
    colors: ["#182f2b", "#39a87d", "#f1c95b"],
    songs: [
      ["Maracatu Atomico", 254],
      ["Manguetown", 209],
      ["Macô", 255]
    ]
  },
  {
    title: "A Mulher do Fim do Mundo",
    artist: "Elza Soares",
    releaseDate: "2015-10-03",
    colors: ["#20191f", "#c9463d", "#f1dfc0"],
    songs: [
      ["A Mulher do Fim do Mundo", 226],
      ["Maria da Vila Matilde", 225],
      ["Luz Vermelha", 257]
    ]
  },
  {
    title: "AmarElo",
    artist: "Emicida",
    releaseDate: "2019-10-30",
    colors: ["#f4c430", "#23395d", "#181818"],
    songs: [
      ["Principia", 336],
      ["AmarElo", 324],
      ["Libre", 257]
    ]
  },
  {
    title: "Gal Costa",
    artist: "Gal Costa",
    releaseDate: "1969-01-01",
    colors: ["#f4f0df", "#d73d32", "#172a44"],
    songs: [
      ["Nao Identificado", 186],
      ["Divino Maravilhoso", 263],
      ["Baby", 210]
    ]
  }
];

const hash = await bcrypt.hash("junkbox123", 12);
await mkdir(coverDir, { recursive: true });
await mkdir(dirname(dataFile), { recursive: true });

const profiles = [
  {
    id: seedUserId,
    username: "junkbox",
    email: "demo@junkbox.local",
    passwordHash: hash,
    displayName: "JunkBox",
    bio: "Perfil seed usado para popular a biblioteca inicial.",
    avatarUrl: `${baseUrl}/assets/covers/igor.svg`,
    createdAt: "2026-06-22T12:00:00.000Z"
  }
];

const songs = [];
const albumRows = albums.map((album, albumIndex) => {
  const albumId = uuidFor("33333333", albumIndex + 1);
  const slug = slugify(album.title);
  const coverUrl = `${baseUrl}/assets/covers/${slug}.svg`;
  const songIds = album.songs.map((song, songIndex) => {
    const songId = uuidFor("22222222", albumIndex * 10 + songIndex + 1);
    songs.push({
      id: songId,
      title: song[0],
      artist: album.artist,
      albumId,
      durationSeconds: song[1],
      releaseDate: album.releaseDate,
      coverUrl,
      externalIds: {
        sample: slugify(`${album.artist}-${song[0]}`)
      },
      createdBy: seedUserId,
      createdAt: timestamp(albumIndex, songIndex)
    });
    return songId;
  });

  return {
    id: albumId,
    title: album.title,
    artist: album.artist,
    releaseDate: album.releaseDate,
    coverUrl,
    songIds,
    externalIds: {
      sample: slugify(`${album.artist}-${album.title}`)
    },
    createdBy: seedUserId,
    createdAt: timestamp(albumIndex, 9)
  };
});

for (const album of albums) {
  await writeFile(join(coverDir, `${slugify(album.title)}.svg`), coverSvg(album), "utf8");
}

const reviews = albumRows.slice(0, 12).map((album, index) => ({
  id: uuidFor("44444444", index + 1),
  targetType: "album",
  targetId: album.id,
  rating: [4.5, 5, 4, 3.5][index % 4],
  text: "Review seed para testar a experiencia de listas, detalhes e notas.",
  vibeTags: [
    ["nostalgico", "classico"],
    ["intenso", "noturno"],
    ["dancante", "brilhante"],
    ["calmo", "emocional"]
  ][index % 4],
  userId: seedUserId,
  createdAt: timestamp(index, 20)
}));

await writeFile(
  dataFile,
  JSON.stringify(
    {
      profiles,
      songs,
      albums: albumRows,
      reviews
    },
    null,
    2
  ),
  "utf8"
);

console.log(`Seed generated: ${albumRows.length} albums, ${songs.length} songs, ${reviews.length} reviews.`);

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function uuidFor(prefix, index) {
  const tail = String(index).padStart(12, "0");
  return `${prefix}-${prefix.slice(0, 4)}-4${prefix.slice(1, 4)}-8${prefix.slice(1, 4)}-${tail}`;
}

function timestamp(albumIndex, offset) {
  return new Date(Date.UTC(2026, 5, 22, 12, albumIndex, offset)).toISOString();
}

function coverSvg(album) {
  const [bg, accent, ink] = album.colors;
  const title = escapeXml(album.title.toUpperCase());
  const artist = escapeXml(album.artist.toUpperCase());
  const initials = escapeXml(
    album.title
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  );

  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900" role="img" aria-label="${escapeXml(album.title)} cover">
  <rect width="900" height="900" fill="${bg}"/>
  <rect x="78" y="78" width="744" height="744" rx="26" fill="${accent}"/>
  <circle cx="450" cy="362" r="202" fill="${ink}" opacity="0.94"/>
  <circle cx="450" cy="362" r="136" fill="${bg}" opacity="0.9"/>
  <path d="M158 596c124-78 219-92 337-40 88 39 166 43 247-14" fill="none" stroke="${ink}" stroke-width="34" stroke-linecap="round" opacity="0.86"/>
  <path d="M208 220h484M208 504h484" stroke="${bg}" stroke-width="18" stroke-linecap="round" opacity="0.55"/>
  <text x="450" y="408" fill="${accent}" font-family="Arial Black, Arial, sans-serif" font-size="126" font-weight="900" text-anchor="middle">${initials}</text>
  <text x="450" y="710" fill="${ink}" font-family="Arial, sans-serif" font-size="46" font-weight="700" text-anchor="middle">${fitText(title, 26)}</text>
  <text x="450" y="764" fill="${ink}" font-family="Arial, sans-serif" font-size="30" text-anchor="middle" opacity="0.82">${fitText(artist, 34)}</text>
</svg>
`;
}

function fitText(value, max) {
  return value.length > max ? `${value.slice(0, max - 1)}...` : value;
}

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
