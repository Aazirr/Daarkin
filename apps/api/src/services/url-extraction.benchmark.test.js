import { describe, it, expect } from "vitest";
import { extractJobDataFromHtml, calculateOverallConfidence } from "./url-extraction.service.js";
import { URL_PARSER_FIXTURES } from "./__fixtures__/url-parser-fixtures.js";

describe("url extraction benchmark fixtures", () => {
  it("extracts expected fields across fixture set", async () => {
    let totalChecks = 0;
    let passedChecks = 0;

    for (const fixture of URL_PARSER_FIXTURES) {
      const result = await extractJobDataFromHtml(fixture.html, fixture.url, { allowRenderFallback: false });
      const expected = fixture.expected;

      if (expected.companyName) {
        totalChecks += 1;
        const ok = String(result.companyName || "").toLowerCase().includes(expected.companyName.toLowerCase());
        if (ok) passedChecks += 1;
      }

      if (expected.positionTitle) {
        totalChecks += 1;
        const ok = String(result.positionTitle || "").toLowerCase().includes(expected.positionTitle.toLowerCase());
        if (ok) passedChecks += 1;
      }

      if (expected.locationIncludes) {
        totalChecks += 1;
        const ok = String(result.location || "").toLowerCase().includes(expected.locationIncludes.toLowerCase());
        if (ok) passedChecks += 1;
      }

      expect(calculateOverallConfidence(result)).toBeGreaterThanOrEqual(25);
      expect(result.trace?.length || 0).toBeGreaterThan(0);
      expect(result.sources).toBeTruthy();
    }

    const accuracy = totalChecks ? passedChecks / totalChecks : 0;
    expect(accuracy).toBeGreaterThanOrEqual(0.8);
  });
});
