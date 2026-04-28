import jwt from "jsonwebtoken";
import { google } from "googleapis";
import env from "../config/env.js";
import { JWT_SECRET } from "../config/jwt.js";
import { generateToken } from "./auth.service.js";
import {
  attachGoogleToUser,
  createGoogleUser,
  getUserByEmail,
  getUserByGoogleId,
  getUserById,
} from "../repositories/users.repository.js";

const GOOGLE_PROVIDER = "google";

function createGoogleOAuthClient() {
  if (!env.googleClientId || !env.googleClientSecret || !env.googleRedirectUri) {
    throw new Error("Google OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI.");
  }

  return new google.auth.OAuth2(env.googleClientId, env.googleClientSecret, env.googleRedirectUri);
}

function createGoogleStateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "10m" });
}

function parseGoogleStateToken(token) {
  const decoded = jwt.verify(token, JWT_SECRET);
  if (decoded.provider !== GOOGLE_PROVIDER || !decoded.mode) {
    throw new Error("Invalid Google OAuth state.");
  }
  return decoded;
}

function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
  };
}

export function buildGoogleAuthUrl(mode, userId = null) {
  const oauth2Client = createGoogleOAuthClient();
  const state = createGoogleStateToken({
    provider: GOOGLE_PROVIDER,
    mode,
    userId,
  });

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
    prompt: "consent",
    state,
  });
}

export async function completeGoogleAuth(code, state) {
  const decoded = parseGoogleStateToken(state);
  const oauth2Client = createGoogleOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
  const profile = await oauth2.userinfo.get();
  const googleId = profile.data.id;
  const email = profile.data.email?.toLowerCase();

  if (!googleId || !email) {
    throw new Error("Google account profile is incomplete.");
  }

  if (decoded.mode === "link") {
    if (!decoded.userId) {
      throw new Error("Invalid account-linking state.");
    }

    const existingByGoogle = await getUserByGoogleId(googleId);
    if (existingByGoogle && existingByGoogle.id !== decoded.userId) {
      throw new Error("This Google account is already linked to a different user.");
    }

    const targetUser = await getUserById(decoded.userId);
    if (!targetUser) {
      throw new Error("User account not found.");
    }

    await attachGoogleToUser(decoded.userId, googleId, email);
    return { mode: "link" };
  }

  let user = await getUserByGoogleId(googleId);

  if (!user) {
    user = await getUserByEmail(email);
    if (user) {
      await attachGoogleToUser(user.id, googleId, email);
      user = await getUserById(user.id);
    } else {
      user = await createGoogleUser(email, googleId);
    }
  }

  const token = generateToken(user.id);
  return {
    mode: "login",
    token,
    user: toPublicUser(user),
  };
}
