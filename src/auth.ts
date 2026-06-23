import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { store } from "./store.js";
import type { AuthPayload, Profile, PublicProfile } from "./types.js";
import { unauthorized } from "./errors.js";

declare global {
  namespace Express {
    interface Request {
      user?: Profile;
    }
  }
}

const jwtSecret = () => process.env.JWT_SECRET ?? "development-only-secret";

export function signToken(profile: Profile): string {
  const payload: AuthPayload = {
    sub: profile.id,
    username: profile.username
  };

  return jwt.sign(payload, jwtSecret(), { expiresIn: "7d" });
}

export function toPublicProfile(profile: Profile): PublicProfile {
  const { passwordHash: _passwordHash, email: _email, ...publicProfile } = profile;
  return publicProfile;
}

export function toOwnProfile(profile: Profile) {
  const { passwordHash: _passwordHash, ...ownProfile } = profile;
  return ownProfile;
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.header("authorization");
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;

    if (!token) {
      throw unauthorized("Missing bearer token");
    }

    const payload = jwt.verify(token, jwtSecret()) as AuthPayload;
    const profile = (await store.profiles()).find((candidate) => candidate.id === payload.sub);

    if (!profile) {
      throw unauthorized("Invalid bearer token");
    }

    req.user = profile;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(unauthorized("Invalid bearer token"));
      return;
    }

    next(error);
  }
}
