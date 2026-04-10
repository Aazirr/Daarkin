// JWT Configuration
export const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-dev-key-change-in-production";
export const JWT_EXPIRY = "7d"; // 7 days

export const jwtOptions = {
  algorithm: "HS256",
  expiresIn: JWT_EXPIRY,
};
