import { createLogger } from "../utils/logger.js";

const logger = createLogger("url-extraction-service");

const FIELD_KEYS = ["companyName", "positionTitle", "location", "description"];
const RENDER_FALLBACK_THRESHOLD = 72;
const FETCH_TIMEOUT_MS = 10000;

const SOURCE_BASE_SCORE = {
  jsonld: 95,
  adapter: 88,
  og: 82,
  twitter: 76,
  titlePattern: 68,
  selector: 58,
  readability: 52,
  domainFallback: 35,
};

/**
 * Extract job posting data from a URL
 * Returns structured data with confidence scores
 */
export async function extractJobDataFromUrl(url) {
  try {
    logger.info("Extracting job data from URL", { url });

    // Dynamically import cheerio to avoid Node 18 compatibility issues at import time
    const { load } = await import("cheerio");

    // Validate URL format
    try {
      new URL(url);
    } catch (err) {
      throw new Error(`Invalid URL format: ${url}`);
    }

    const trace = [];
    const pools = createCandidatePools();

    const staticHtml = await fetchHtml(url, trace, "static");
    const $static = load(staticHtml);
    extractCandidatesFromHtml($static, url, pools, trace, "static");

    let extracted = resolveCandidates(pools, trace);

    if (calculateOverallConfidence(extracted) < RENDER_FALLBACK_THRESHOLD) {
      const renderedHtml = await fetchRenderedHtml(url, trace);
      if (renderedHtml) {
        const $rendered = load(renderedHtml);
        extractCandidatesFromHtml($rendered, url, pools, trace, "rendered");
        extracted = resolveCandidates(pools, trace);
      }
    }

    extracted.trace = trace;

    logger.info("Successfully extracted job data", { url, extracted });
    return extracted;
  } catch (error) {
    logger.error("Error extracting job data", { url, error: error.message });
    throw error;
  }
}

/**
 * Extract candidates from HTML using layered strategies.
 */
function extractCandidatesFromHtml($, baseUrl, pools, trace, mode) {
  const hostname = getHostname(baseUrl);

  extractJsonLdCandidates($, pools, trace, mode);
  extractOpenGraphCandidates($, pools, trace, mode);
  extractTwitterCandidates($, pools, trace, mode);
  extractTitlePatternCandidates($, pools, trace, mode);
  extractSelectorCandidates($, pools, trace, mode);
  applyDomainAdapters($, hostname, pools, trace, mode);
  applyDomainFallback(baseUrl, pools, trace, mode);
}

/**
 * Parse job title and company from combined text
 * Examples: "Senior Engineer at Google", "Data Scientist - Stripe"
 */
function parseJobTitle(text) {
  const atMatch = text.match(/^(.+?)\s+at\s+(.+?)$/i);
  const dashMatch = text.match(/^(.+?)\s+[-–—]\s+(.+?)$/);

  if (atMatch) {
    return {
      position: atMatch[1].trim(),
      company: atMatch[2].trim(),
    };
  }

  if (dashMatch) {
    return {
      position: dashMatch[1].trim(),
      company: dashMatch[2].trim(),
    };
  }

  return {
    position: text.trim(),
    company: null,
  };
}

function createCandidatePools() {
  return {
    companyName: [],
    positionTitle: [],
    location: [],
    description: [],
  };
}

function addCandidate(pools, field, value, source, trace, details = {}) {
  const cleaned = sanitizeValue(field, value);
  if (!cleaned) {
    return;
  }

  const base = SOURCE_BASE_SCORE[source] || 40;
  const quality = qualityAdjustment(field, cleaned);
  const score = Math.max(1, Math.min(99, base + quality));

  pools[field].push({
    field,
    value: cleaned,
    source,
    mode: details.mode || "static",
    score,
    reason: details.reason || "",
  });

  trace.push({
    event: "candidate",
    field,
    source,
    mode: details.mode || "static",
    score,
    preview: cleaned.slice(0, 120),
    reason: details.reason || "",
  });
}

function sanitizeValue(field, value) {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return null;
  }

  if (field === "description") {
    return cleaned.slice(0, 500);
  }

  return cleaned;
}

function qualityAdjustment(field, value) {
  const len = value.length;

  if (field === "positionTitle") {
    if (len >= 4 && len <= 120) return 4;
    if (len <= 180) return 0;
    return -8;
  }

  if (field === "companyName") {
    if (len >= 2 && len <= 80) return 3;
    if (len <= 140) return 0;
    return -8;
  }

  if (field === "location") {
    if (len >= 2 && len <= 100) return 2;
    return -5;
  }

  if (field === "description") {
    if (len >= 80) return 4;
    if (len >= 30) return 0;
    return -6;
  }

  return 0;
}

function resolveCandidates(pools, trace) {
  const result = {
    companyName: null,
    positionTitle: null,
    location: null,
    description: null,
    confidence: {
      companyName: 0,
      positionTitle: 0,
      location: 0,
      description: 0,
    },
    sources: {
      companyName: null,
      positionTitle: null,
      location: null,
      description: null,
    },
  };

  for (const field of FIELD_KEYS) {
    const chosen = chooseBestCandidate(pools[field]);
    if (!chosen) {
      continue;
    }

    result[field] = chosen.value;
    result.confidence[field] = chosen.score;
    result.sources[field] = {
      source: chosen.source,
      mode: chosen.mode,
      reason: chosen.reason,
    };

    trace.push({
      event: "selected",
      field,
      source: chosen.source,
      mode: chosen.mode,
      score: chosen.score,
      preview: chosen.value.slice(0, 120),
    });
  }

  return result;
}

function chooseBestCandidate(candidates) {
  if (!candidates.length) {
    return null;
  }

  const byValue = new Map();
  for (const candidate of candidates) {
    const key = candidate.value.toLowerCase();
    const current = byValue.get(key);
    if (!current || candidate.score > current.score) {
      byValue.set(key, { ...candidate, support: 1 });
    } else {
      current.support += 1;
      current.score = Math.min(99, Math.max(current.score, candidate.score) + 2);
    }
  }

  return [...byValue.values()].sort((a, b) => b.score - a.score)[0];
}

function extractOpenGraphCandidates($, pools, trace, mode) {
  const ogTitle = getMeta($, "property", "og:title");
  const ogDescription = getMeta($, "property", "og:description");
  const ogSiteName = getMeta($, "property", "og:site_name");

  if (ogTitle) {
    const parsed = parseJobTitle(ogTitle);
    addCandidate(pools, "positionTitle", parsed.position, "og", trace, { mode, reason: "og:title" });
    addCandidate(pools, "companyName", parsed.company, "og", trace, { mode, reason: "og:title split" });
  }

  addCandidate(pools, "description", ogDescription, "og", trace, { mode, reason: "og:description" });
  addCandidate(pools, "companyName", ogSiteName, "og", trace, { mode, reason: "og:site_name" });
}

function extractTwitterCandidates($, pools, trace, mode) {
  const title = getMeta($, "name", "twitter:title");
  const description = getMeta($, "name", "twitter:description");

  if (title) {
    const parsed = parseJobTitle(title);
    addCandidate(pools, "positionTitle", parsed.position, "twitter", trace, { mode, reason: "twitter:title" });
    addCandidate(pools, "companyName", parsed.company, "twitter", trace, { mode, reason: "twitter:title split" });
  }

  addCandidate(pools, "description", description, "twitter", trace, { mode, reason: "twitter:description" });
}

function extractTitlePatternCandidates($, pools, trace, mode) {
  const titleTag = $("title").text().trim();
  if (!titleTag) {
    return;
  }

  const parsed = parseJobTitle(titleTag);
  addCandidate(pools, "positionTitle", parsed.position, "titlePattern", trace, { mode, reason: "<title>" });
  addCandidate(pools, "companyName", parsed.company, "titlePattern", trace, { mode, reason: "<title> split" });
}

function extractSelectorCandidates($, pools, trace, mode) {
  const titleSelectors = [
    ".jobs-details-top__job-title",
    ".jobsearch-JobInfoHeader-title",
    ".job-title",
    ".position-title",
    '[data-test*="job-title"]',
    'h1[class*="job"]',
    'h1[class*="title"]',
    "h1",
  ];

  for (const selector of titleSelectors) {
    const value = $(selector).first().text().trim();
    if (value) {
      addCandidate(pools, "positionTitle", value, "selector", trace, { mode, reason: selector });
      break;
    }
  }

  const companySelectors = [
    ".jobs-details-top__company-name",
    ".jobsearch-InlineCompanyRating-companyHeaderTitle",
    ".company-name",
    ".company",
    '[data-test*="company"]',
    'a[class*="company"]',
  ];

  for (const selector of companySelectors) {
    const value = $(selector).first().text().trim();
    if (value) {
      addCandidate(pools, "companyName", value, "selector", trace, { mode, reason: selector });
      break;
    }
  }

  const locationSelectors = [
    ".job-location",
    ".location",
    '[data-test*="location"]',
    'span[class*="location"]',
    '[class*="job-location"]',
  ];

  for (const selector of locationSelectors) {
    const value = $(selector).first().text().trim();
    if (value) {
      addCandidate(pools, "location", value, "selector", trace, { mode, reason: selector });
      break;
    }
  }

  const mainText = $("article, main, .description, .job-description").first().text().trim();
  addCandidate(pools, "description", mainText, "readability", trace, { mode, reason: "main content" });
}

function extractJsonLdCandidates($, pools, trace, mode) {
  const scripts = $('script[type="application/ld+json"]');
  scripts.each((_idx, script) => {
    const raw = $(script).html();
    if (!raw) {
      return;
    }

    const parsed = parseJsonSafe(raw, trace);
    if (!parsed) {
      return;
    }

    const nodes = flattenJsonNodes(parsed);
    for (const node of nodes) {
      if (!looksLikeJobPosting(node)) {
        continue;
      }

      const company =
        node?.hiringOrganization?.name ||
        node?.hiringOrganization?.legalName ||
        node?.employerOverview ||
        node?.identifier?.name ||
        null;
      addCandidate(pools, "companyName", company, "jsonld", trace, { mode, reason: "hiringOrganization" });

      const title = node?.title || node?.name || null;
      addCandidate(pools, "positionTitle", title, "jsonld", trace, { mode, reason: "title/name" });

      const location = resolveJobLocation(node);
      addCandidate(pools, "location", location, "jsonld", trace, { mode, reason: "jobLocation" });

      const description = node?.description || null;
      addCandidate(pools, "description", description, "jsonld", trace, { mode, reason: "description" });

      if (String(node?.jobLocationType || "").toUpperCase().includes("TELECOMMUTE")) {
        addCandidate(pools, "location", "Remote", "jsonld", trace, { mode, reason: "jobLocationType=TELECOMMUTE" });
      }
    }
  });
}

function parseJsonSafe(raw, trace) {
  try {
    return JSON.parse(raw);
  } catch {
    try {
      const cleaned = raw.trim().replace(/[\u0000-\u001F]+/g, " ");
      return JSON.parse(cleaned);
    } catch (error) {
      trace.push({ event: "jsonld-parse-failed", reason: error.message });
      return null;
    }
  }
}

function flattenJsonNodes(value, out = []) {
  if (!value) {
    return out;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      flattenJsonNodes(item, out);
    }
    return out;
  }

  if (typeof value !== "object") {
    return out;
  }

  out.push(value);

  for (const key of Object.keys(value)) {
    const child = value[key];
    if (child && typeof child === "object") {
      flattenJsonNodes(child, out);
    }
  }

  return out;
}

function looksLikeJobPosting(node) {
  const type = node?.["@type"];
  const types = Array.isArray(type) ? type : [type];
  const hasType = types.some((entry) => String(entry || "").toLowerCase().includes("jobposting"));
  if (hasType) {
    return true;
  }

  return Boolean(node?.title && (node?.hiringOrganization || node?.jobLocation || node?.description));
}

function resolveJobLocation(node) {
  const location = node?.jobLocation;

  if (Array.isArray(location)) {
    const values = location.map((item) => resolveJobLocation({ jobLocation: item })).filter(Boolean);
    return values[0] || null;
  }

  const address = location?.address || location;
  const parts = [
    address?.streetAddress,
    address?.addressLocality,
    address?.addressRegion,
    address?.postalCode,
    address?.addressCountry,
  ].filter(Boolean);

  return parts.join(", ") || null;
}

function applyDomainAdapters($, hostname, pools, trace, mode) {
  const adapters = getDomainAdapters();
  for (const adapter of adapters) {
    if (!adapter.match(hostname)) {
      continue;
    }

    const values = adapter.extract($);
    addCandidate(pools, "positionTitle", values.positionTitle, "adapter", trace, { mode, reason: adapter.name });
    addCandidate(pools, "companyName", values.companyName, "adapter", trace, { mode, reason: adapter.name });
    addCandidate(pools, "location", values.location, "adapter", trace, { mode, reason: adapter.name });
    addCandidate(pools, "description", values.description, "adapter", trace, { mode, reason: adapter.name });
  }
}

function getDomainAdapters() {
  return [
    {
      name: "linkedin",
      match: (hostname) => hostname.includes("linkedin.com"),
      extract: ($) => ({
        positionTitle: $(".jobs-details-top__job-title").first().text().trim() || $('[data-test="job-title"]').first().text().trim(),
        companyName: $(".jobs-details-top__company-name").first().text().trim() || $('[data-test="company-name"]').first().text().trim(),
        location: $(".jobs-details-top__job-primary-description").first().text().trim(),
        description: $(".jobs-description-content__text").first().text().trim(),
      }),
    },
    {
      name: "greenhouse",
      match: (hostname) => hostname.includes("greenhouse.io"),
      extract: ($) => {
        const headline = $(".app-title, .header h1").first().text().trim();
        const split = parseJobTitle(headline);
        return {
          positionTitle: split.position || $("#header h1").first().text().trim(),
          companyName: split.company || $("#header .company-name").first().text().trim(),
          location: $("#header .location, .location").first().text().trim(),
          description: $("#content").first().text().trim(),
        };
      },
    },
    {
      name: "lever",
      match: (hostname) => hostname.includes("lever.co"),
      extract: ($) => ({
        positionTitle: $(".posting-headline h2, h2.posting-headline").first().text().trim() || $("h2").first().text().trim(),
        companyName: $(".main-header-logo, .main-header").first().text().trim(),
        location: $(".posting-categories .location, .posting-categories").first().text().trim(),
        description: $(".section-wrapper, .posting-description").first().text().trim(),
      }),
    },
  ];
}

function applyDomainFallback(baseUrl, pools, trace, mode) {
  try {
    const hostname = getHostname(baseUrl);
    const domainPart = hostname.split(".")[0];
    if (domainPart && domainPart !== "www") {
      const normalized = domainPart.charAt(0).toUpperCase() + domainPart.slice(1);
      addCandidate(pools, "companyName", normalized, "domainFallback", trace, { mode, reason: "hostname" });
    }
  } catch (error) {
    trace.push({ event: "domain-fallback-failed", reason: error.message });
  }
}

function getMeta($, attr, key) {
  return $(`meta[${attr}="${key}"]`).attr("content") || null;
}

function getHostname(url) {
  return new URL(url).hostname.toLowerCase();
}

async function fetchHtml(url, trace, mode) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    trace.push({ event: "fetch-ok", mode, status: response.status, bytes: html.length });
    return html;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchRenderedHtml(url, trace) {
  if (String(process.env.EXTRACTOR_ENABLE_RENDER_FALLBACK || "").toLowerCase() !== "true") {
    trace.push({ event: "render-fallback-skipped", reason: "disabled" });
    return null;
  }

  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ headless: true });

    try {
      const page = await browser.newPage({
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      });

      await page.goto(url, { waitUntil: "domcontentloaded", timeout: FETCH_TIMEOUT_MS + 2000 });
      const html = await page.content();
      trace.push({ event: "render-fallback-ok", bytes: html.length });
      return html;
    } finally {
      await browser.close();
    }
  } catch (error) {
    trace.push({ event: "render-fallback-failed", reason: error.message });
    return null;
  }
}

/**
 * Calculate overall confidence score (0-100)
 */
export function calculateOverallConfidence(extracted) {
  const weights = {
    companyName: 0.25,
    positionTitle: 0.35,
    location: 0.2,
    description: 0.2,
  };

  let total = 0;
  for (const [key, weight] of Object.entries(weights)) {
    total += (extracted.confidence[key] || 0) * weight;
  }

  return Math.round(total);
}
