import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { registerSchema, loginSchema } from "../schemas/auth.schema.js";
import { createUser, getUserByEmail } from "../repositories/users.repository.js";
import { createLogger } from "../utils/logger.js";
import { JWT_SECRET, jwtOptions } from "../config/jwt.js";

const logger = createLogger("auth-service");

const BCRYPT_ROUNDS = 10;

export function validateRegisterPayload(body) {
  return registerSchema.safeParse(body);
}

export function validateLoginPayload(body) {
  return loginSchema.safeParse(body);
}

export async function register(email, password) {
  logger.info("Registering new user", { email });

  const existing = await getUserByEmail(email);
  if (existing) {
    logger.warn("User already exists", { email });
    throw new Error("Email is already registered. Please log in instead.");
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  logger.info("Password hashed", { email });

  const user = await createUser(email, passwordHash);
  logger.info("User created successfully", { userId: user.id, email });

  const token = generateToken(user.id);
  return {
    user: {
      id: user.id,
      email: user.email,
    },
    token,
  };
}

export async function login(email, password) {
  logger.info("User login attempt", { email });

  const user = await getUserByEmail(email);
  if (!user) {
    logger.warn("Login failed - user not found", { email });
    throw new Error("Email or password is incorrect.");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    logger.warn("Login failed - password mismatch", { email });
    throw new Error("Email or password is incorrect.");
  }

  logger.info("User logged in successfully", { userId: user.id, email });

  const token = generateToken(user.id);
  return {
    user: {
      id: user.id,
      email: user.email,
    },
    token,
  };
}

export function generateToken(userId) {
  logger.info("Generating JWT token", { userId });
  const token = jwt.sign({ userId }, JWT_SECRET, jwtOptions);
  return token;
}

export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    logger.info("Token verified", { userId: decoded.userId });
    return decoded;
  } catch (error) {
    logger.warn("Token verification failed", { error: error.message });
    return null;
  }
}
