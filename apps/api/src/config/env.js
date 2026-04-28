import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? "",
  appBaseUrl: process.env.APP_BASE_URL ?? "http://localhost:5173",
  gmailClientId: process.env.GMAIL_CLIENT_ID ?? "",
  gmailClientSecret: process.env.GMAIL_CLIENT_SECRET ?? "",
  gmailRedirectUri: process.env.GMAIL_REDIRECT_URI ?? "http://localhost:4000/api/integrations/gmail/callback",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:4000/api/auth/google/callback",
};

if (!env.databaseUrl) {
  if (env.nodeEnv !== "production") {
    console.warn("DATABASE_URL is not set. Database operations will fail until configured.");
  }
}

export default env;
