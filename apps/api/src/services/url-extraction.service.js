import { createLogger } from "../utils/logger.js";

const logger = createLogger("url-extraction-service");

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
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (err) {
      throw new Error(`Invalid URL format: ${url}`);
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 10000,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();

    // Parse with cheerio
    const $ = load(html);

    // Extract data from various sources
    const extracted = extractMetadata($, url);

    logger.info("Successfully extracted job data", { url, extracted });
    return extracted;
  } catch (error) {
    logger.error("Error extracting job data", { url, error: error.message });
    throw error;
  }
}

/**
 * Extract metadata from HTML using multiple strategies
 */
function extractMetadata($, baseUrl) {
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
  };

  // 1. Try Open Graph / meta tags (most reliable)
  const ogTitle = $('meta[property="og:title"]').attr("content");
  const ogDescription = $('meta[property="og:description"]').attr("content");

  if (ogTitle) {
    const parsed = parseJobTitle(ogTitle);
    if (parsed.position) {
      result.positionTitle = parsed.position;
      result.confidence.positionTitle = 90;
    }
    if (parsed.company) {
      result.companyName = parsed.company;
      result.confidence.companyName = 85;
    }
  }

  if (ogDescription) {
    result.description = ogDescription.substring(0, 500);
    result.confidence.description = 80;
  }

  // 2. Try common job board patterns
  const titleTag = $("title").text().trim();
  if (titleTag && !result.positionTitle) {
    const parsed = parseJobTitle(titleTag);
    if (parsed.position) {
      result.positionTitle = parsed.position;
      result.confidence.positionTitle = 75;
    }
    if (parsed.company) {
      result.companyName = parsed.company;
      result.confidence.companyName = 70;
    }
  }

  // 3. Try JSON-LD (structured data) - common on modern job boards
  const jsonLdScripts = $('script[type="application/ld+json"]');
  jsonLdScripts.each((idx, script) => {
    try {
      const data = JSON.parse($(script).html());

      if (data.hiringOrganization?.name) {
        result.companyName = data.hiringOrganization.name;
        result.confidence.companyName = 95;
      }

      if (data.title) {
        result.positionTitle = data.title;
        result.confidence.positionTitle = 95;
      }

      if (data.jobLocation?.address?.addressLocality) {
        result.location = data.jobLocation.address.addressLocality;
        if (data.jobLocation.address.addressRegion) {
          result.location += `, ${data.jobLocation.address.addressRegion}`;
        }
        result.confidence.location = 95;
      }

      if (data.description) {
        result.description = data.description.substring(0, 500);
        result.confidence.description = 95;
      }
    } catch (e) {
      logger.debug("Failed to parse JSON-LD", { error: e.message });
    }
  });

  // 4. Common job board selectors (LinkedIn, Indeed, etc)
  if (!result.positionTitle) {
    // LinkedIn: .jobs-details-top__job-title
    // Indeed: .jobsearch-JobInfoHeader-title
    // Others: h1, .job-title, .position-title
    const titleSelectors = [
      ".jobs-details-top__job-title",
      ".jobsearch-JobInfoHeader-title",
      ".job-title",
      ".position-title",
      'h1[class*="job"]',
      'h1[class*="title"]',
      "h1",
    ];

    for (const selector of titleSelectors) {
      const title = $(selector).first().text().trim();
      if (title && title.length > 0 && title.length < 200) {
        result.positionTitle = title;
        result.confidence.positionTitle = 60;
        break;
      }
    }
  }

  if (!result.companyName) {
    // LinkedIn: .jobs-details-top__company-name
    // Indeed: .jobsearch-InlineCompanyRating-companyHeaderTitle
    const companySelectors = [
      ".jobs-details-top__company-name",
      ".jobsearch-InlineCompanyRating-companyHeaderTitle",
      ".company-name",
      ".company",
      'a[class*="company"]',
    ];

    for (const selector of companySelectors) {
      const company = $(selector).first().text().trim();
      if (company && company.length > 0 && company.length < 150) {
        result.companyName = company;
        result.confidence.companyName = 55;
        break;
      }
    }
  }

  if (!result.location) {
    // Common location patterns
    const locationSelectors = [
      ".job-location",
      ".location",
      'span[class*="location"]',
      '[class*="job-location"]',
    ];

    for (const selector of locationSelectors) {
      const location = $(selector).first().text().trim();
      if (location && location.length > 0 && location.length < 100) {
        result.location = location;
        result.confidence.location = 50;
        break;
      }
    }
  }

  // 5. Parse domain for company fallback
  if (!result.companyName) {
    try {
      const domain = new URL(baseUrl).hostname;
      const domainPart = domain.split(".")[0];
      if (domainPart && domainPart !== "www") {
        result.companyName = domainPart.charAt(0).toUpperCase() + domainPart.slice(1);
        result.confidence.companyName = 30;
      }
    } catch (e) {
      logger.debug("Failed to parse company from domain", { error: e.message });
    }
  }

  return result;
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
