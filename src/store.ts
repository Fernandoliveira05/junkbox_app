import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { Album, Database, Profile, Review, Song } from "./types.js";

const emptyDatabase = (): Database => ({
  profiles: [],
  songs: [],
  albums: [],
  reviews: []
});

export class JsonStore {
  private readonly filePath: string;
  private db: Database | null = null;

  constructor(filePath = process.env.DATA_FILE ?? "./data/junkbox.json") {
    this.filePath = resolve(filePath);
  }

  async load(): Promise<Database> {
    if (this.db) {
      return this.db;
    }

    try {
      const raw = await readFile(this.filePath, "utf8");
      this.db = JSON.parse(raw) as Database;
      return this.db;
    } catch {
      this.db = emptyDatabase();
      await this.save();
      return this.db;
    }
  }

  async save(): Promise<void> {
    if (!this.db) {
      this.db = emptyDatabase();
    }

    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(this.db, null, 2));
  }

  async profiles(): Promise<Profile[]> {
    return (await this.load()).profiles;
  }

  async songs(): Promise<Song[]> {
    return (await this.load()).songs;
  }

  async albums(): Promise<Album[]> {
    return (await this.load()).albums;
  }

  async reviews(): Promise<Review[]> {
    return (await this.load()).reviews;
  }
}

export const store = new JsonStore();
