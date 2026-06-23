export type Profile = {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: string;
};

export type PublicProfile = Omit<Profile, "email" | "passwordHash">;

export type Song = {
  id: string;
  title: string;
  artist: string;
  albumId?: string;
  durationSeconds?: number;
  releaseDate?: string;
  coverUrl?: string;
  externalIds?: Record<string, string>;
  createdBy: string;
  createdAt: string;
};

export type Album = {
  id: string;
  title: string;
  artist: string;
  releaseDate?: string;
  coverUrl?: string;
  songIds: string[];
  externalIds?: Record<string, string>;
  createdBy: string;
  createdAt: string;
};

export type ReviewTargetType = "song" | "album";

export type Review = {
  id: string;
  targetType: ReviewTargetType;
  targetId: string;
  rating: number;
  text?: string;
  vibeTags?: string[];
  userId: string;
  createdAt: string;
};

export type Database = {
  profiles: Profile[];
  songs: Song[];
  albums: Album[];
  reviews: Review[];
};

export type AuthPayload = {
  sub: string;
  username: string;
};
