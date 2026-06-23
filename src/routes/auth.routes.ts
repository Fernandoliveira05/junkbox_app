import { Router } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { conflict, unauthorized } from "../errors.js";
import { signToken, toOwnProfile } from "../auth.js";
import { registerSchema, loginSchema } from "../schemas.js";
import { store } from "../store.js";

export const authRoutes = Router();

authRoutes.post("/register", async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const profiles = await store.profiles();
    const username = input.username.toLowerCase();

    if (profiles.some((profile) => profile.email === input.email || profile.username.toLowerCase() === username)) {
      throw conflict("Email or username already registered");
    }

    const profile = {
      id: uuid(),
      username: input.username,
      email: input.email,
      passwordHash: await bcrypt.hash(input.password, 12),
      displayName: input.displayName,
      createdAt: new Date().toISOString()
    };

    profiles.push(profile);
    await store.save();

    res.status(201).json({
      token: signToken(profile),
      profile: toOwnProfile(profile)
    });
  } catch (error) {
    next(error);
  }
});

authRoutes.post("/login", async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const profile = (await store.profiles()).find((candidate) => candidate.email === input.email);

    if (!profile || !(await bcrypt.compare(input.password, profile.passwordHash))) {
      throw unauthorized("Invalid email or password");
    }

    res.json({
      token: signToken(profile),
      profile: toOwnProfile(profile)
    });
  } catch (error) {
    next(error);
  }
});
