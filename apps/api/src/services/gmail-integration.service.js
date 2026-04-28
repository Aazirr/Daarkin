import jwt from "jsonwebtoken";
import { google } from "googleapis";
import { JWT_SECRET } from "../config/jwt.js";
import env from "../config/env.js";
import {
  createEmailEventIfNotExists,
  deleteEmailIntegration,
  getEmailIntegration,
  upsertEmailIntegration,
} from "../repositories/email-integrations.repository.js";
import { listApplicationsForMatching, updateApplication } from "../repositories/applications.repository.js";
import { createLogger } from "../utils/logger.js";
import { gmailCallbackQuerySchema, gmailSyncBodySchema } from "../schemas/integration.schema.js";

const logger = createLogger("gmail-integration-service");
const PROVIDER = "gmail";
const STATUS_PRIORITY = { applied: 1, interview: 2, offer: 3, rejected: 4 };
const WEAK_INTERVIEW_WORDS = ["schedule", "availability", "meeting", "call"];
const NORMALIZE_REGEX = /[^a-z0-9\s]/g;

function createOAuthClient() {
  if (!env.gmailClientId || !env.gmailClientSecret || !env.gmailRedirectUri) {
    throw new Error("Gmail OAuth is not configured. Set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REDIRECT_URI.");
  }

  return new google.auth.OAuth2(env.gmailClientId, env.gmailClientSecret, env.gmailRedirectUri);
}

function createStateToken(userId) {
  return jwt.sign({ userId, provider: PROVIDER }, JWT_SECRET, { expiresIn: "10m" });
}

function verifyStateToken(stateToken) {
  const decoded = jwt.verify(stateToken, JWT_SECRET);
  if (!decoded?.userId || decoded?.provider !== PROVIDER) {
    throw new Error("Invalid OAuth state.");
  }
  return decoded;
}

function getHeader(headers, name) {
  const match = headers?.find((header) => header.name?.toLowerCase() === name.toLowerCase());
  return match?.value ?? null;
}

function countMatches(text, patterns) {
  return patterns.reduce((count, pattern) => count + (pattern.test(text) ? 1 : 0), 0);
}

function normalizeForMatch(value = "") {
  return value
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(NORMALIZE_REGEX, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectStatus(subject = "", snippet = "", sender = "") {
  const text = normalizeForMatch(`${subject}\n${snippet}`);
  const senderText = normalizeForMatch(sender);

  const rejectionScore = countMatches(text, [
    /\bunfortunately\b/,
    /\bregret to inform\b/,
    /\bnot moving forward\b/,
    /\bwe (have )?decided to (move forward|proceed) with other candidates\b/,
    /\bapplication (was )?(unsuccessful|declined|rejected)\b/,
  ]);

  const offerScore = countMatches(text, [
    /\bjob offer\b/,
    /\bwritten offer\b/,
    /\boffer letter\b/,
    /\bwe are excited to offer\b/,
    /\bcompensation package\b/,
  ]);

  const interviewScore = countMatches(text, [
    /\binterview\b/,
    /\binterview round\b/,
    /\bphone screen\b/,
    /\btechnical screen\b/,
    /\bpanel interview\b/,
    /\binterview invitation\b/,
    /\binterview schedule\b/,
  ]);

  const appliedScore = countMatches(text, [
    /\bapplication received\b/,
    /\bthank you for applying\b/,
    /\bthanks for applying\b/,
    /\bapplication submission\b/,
    /\bapplication has been received\b/,
  ]);

  const newsletterSignals = countMatches(text, [
    /\bunsubscribe\b/,
    /\bmarketing\b/,
    /\bweekly digest\b/,
    /\bnewsletter\b/,
  ]);

  // Avoid statusing newsletters and obvious non-recruiting mail.
  if (newsletterSignals >= 2 && rejectionScore + offerScore + interviewScore + appliedScore <= 1) {
    return "unknown";
  }

  // Sender based confidence bump for recruiting domains/aliases.
  const recruitingSenderBoost = /(careers|recruit|talent|jobs|greenhouse|lever|workday|smartrecruiters)/.test(senderText) ? 1 : 0;

  // Weak interview words alone are noisy.
  const weakInterviewOnly =
    WEAK_INTERVIEW_WORDS.some((word) => text.includes(word)) &&
    interviewScore === 0 &&
    offerScore === 0 &&
    rejectionScore === 0 &&
    appliedScore === 0;
  if (weakInterviewOnly) {
    return "unknown";
  }

  if (rejectionScore >= 1 && offerScore === 0) {
    return "rejected";
  }
  if (offerScore + recruitingSenderBoost >= 2 && rejectionScore === 0) {
    return "offer";
  }
  if (interviewScore + recruitingSenderBoost >= 2 && rejectionScore === 0) {
    return "interview";
  }
  if (appliedScore + recruitingSenderBoost >= 2 && rejectionScore === 0) {
    return "applied";
  }

  return "unknown";
}

function tokenizeNormalized(value = "") {
  return normalizeForMatch(value).split(" ").filter((token) => token.length >= 2);
}

function findApplicationMatch(applications, subject = "", snippet = "", sender = "") {
  const normalizedCorpus = normalizeForMatch(`${subject}\n${snippet}\n${sender}`);
  const corpusTokens = new Set(tokenizeNormalized(normalizedCorpus));

  let bestMatch = null;
  let bestScore = 0;

  for (const application of applications) {
    const normalizedCompany = normalizeForMatch(application.companyName);
    if (!normalizedCompany) {
      continue;
    }

    let score = 0;
    if (normalizedCorpus.includes(normalizedCompany)) {
      score += 4;
    }

    const companyTokens = tokenizeNormalized(normalizedCompany);
    companyTokens.forEach((token) => {
      if (corpusTokens.has(token)) {
        score += 1;
      }
    });

    const roleTokens = tokenizeNormalized(application.positionTitle);
    roleTokens.slice(0, 3).forEach((token) => {
      if (corpusTokens.has(token)) {
        score += 0.5;
      }
    });

    if (score > bestScore) {
      bestScore = score;
      bestMatch = application;
    }
  }

  // Require minimum confidence to avoid incorrect cross-company linking.
  return bestScore >= 3 ? bestMatch : null;
}

function shouldUpdateStatus(currentStatus, nextStatus) {
  if (!nextStatus || nextStatus === "unknown") {
    return false;
  }
  return STATUS_PRIORITY[nextStatus] >= STATUS_PRIORITY[currentStatus];
}

export function validateGmailCallbackQuery(query) {
  return gmailCallbackQuerySchema.safeParse(query);
}

export function validateGmailSyncBody(body) {
  return gmailSyncBodySchema.safeParse(body ?? {});
}

export function buildGmailConnectUrl(userId) {
  const oauth2Client = createOAuthClient();
  const state = createStateToken(userId);

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/userinfo.email"],
    prompt: "consent",
    state,
  });
}

export async function completeGmailOAuth(query) {
  const { code, state } = query;
  const decoded = verifyStateToken(state);
  const userId = decoded.userId;

  const oauth2Client = createOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
  const profile = await oauth2.userinfo.get();

  await upsertEmailIntegration(userId, PROVIDER, {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
    connectedEmail: profile.data.email ?? null,
  });

  return { userId, connectedEmail: profile.data.email ?? null };
}

async function getAuthorizedClient(userId) {
  const integration = await getEmailIntegration(userId, PROVIDER);
  if (!integration) {
    return null;
  }

  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken,
    expiry_date: integration.tokenExpiresAt ? new Date(integration.tokenExpiresAt).getTime() : undefined,
  });

  return { oauth2Client, integration };
}

export async function syncGmailMessages(userId, maxResults = 20) {
  const auth = await getAuthorizedClient(userId);
  if (!auth) {
    throw new Error("Gmail is not connected.");
  }

  const gmail = google.gmail({ version: "v1", auth: auth.oauth2Client });
  const applications = await listApplicationsForMatching(userId);
  const listResponse = await gmail.users.messages.list({
    userId: "me",
    maxResults,
    q: "newer_than:30d",
  });

  const messageIds = listResponse.data.messages?.map((message) => message.id).filter(Boolean) ?? [];

  let processed = 0;
  let created = 0;
  let matched = 0;
  let statusUpdated = 0;

  for (const messageId of messageIds) {
    const messageResponse = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "metadata",
      metadataHeaders: ["Subject", "From", "Date"],
    });

    const metadata = messageResponse.data;
    const subject = getHeader(metadata.payload?.headers, "Subject") ?? "";
    const sender = getHeader(metadata.payload?.headers, "From") ?? "";
    const snippet = metadata.snippet ?? "";
    const detectedStatus = detectStatus(subject, snippet, sender);
    const matchedApplication = findApplicationMatch(applications, subject, snippet, sender);
    const occurredAt = metadata.internalDate
      ? new Date(Number(metadata.internalDate)).toISOString()
      : new Date().toISOString();

    const event = await createEmailEventIfNotExists(userId, {
      provider: PROVIDER,
      providerMessageId: metadata.id,
      applicationId: matchedApplication?.id ?? null,
      detectedType: detectedStatus,
      occurredAt,
      subject,
      sender,
      snippet,
      metadata: {
        threadId: metadata.threadId ?? null,
      },
    });

    processed += 1;

    if (!event) {
      continue;
    }

    created += 1;

    if (matchedApplication) {
      matched += 1;
      if (shouldUpdateStatus(matchedApplication.status, detectedStatus)) {
        await updateApplication(
          matchedApplication.id,
          userId,
          { status: detectedStatus },
          {
            source: "email_auto",
            note: `Auto-updated from Gmail message: ${subject.slice(0, 120)}`,
          }
        );
        matchedApplication.status = detectedStatus;
        statusUpdated += 1;
      }
    }
  }

  return {
    processed,
    created,
    matchedApplications: matched,
    statusUpdated,
    connectedEmail: auth.integration.connectedEmail,
  };
}

export async function disconnectGmail(userId) {
  return deleteEmailIntegration(userId, PROVIDER);
}
