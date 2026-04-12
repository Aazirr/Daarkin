import { extractJobDataFromHtml, calculateOverallConfidence } from "../services/url-extraction.service.js";
import { URL_PARSER_FIXTURES } from "../services/__fixtures__/url-parser-fixtures.js";

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

function includes(actual, expected) {
  return normalize(actual).includes(normalize(expected));
}

async function runBenchmark() {
  const rows = [];
  let totalChecks = 0;
  let passedChecks = 0;

  for (const fixture of URL_PARSER_FIXTURES) {
    const result = await extractJobDataFromHtml(fixture.html, fixture.url, { allowRenderFallback: false });
    const confidence = calculateOverallConfidence(result);

    const checks = [];

    if (fixture.expected.companyName) {
      const ok = includes(result.companyName, fixture.expected.companyName);
      checks.push(ok);
      totalChecks += 1;
      if (ok) passedChecks += 1;
    }

    if (fixture.expected.positionTitle) {
      const ok = includes(result.positionTitle, fixture.expected.positionTitle);
      checks.push(ok);
      totalChecks += 1;
      if (ok) passedChecks += 1;
    }

    if (fixture.expected.locationIncludes) {
      const ok = includes(result.location, fixture.expected.locationIncludes);
      checks.push(ok);
      totalChecks += 1;
      if (ok) passedChecks += 1;
    }

    const passRate = checks.length ? Math.round((checks.filter(Boolean).length / checks.length) * 100) : 100;

    rows.push({
      fixture: fixture.name,
      passRate,
      confidence,
      sourceTitle: result.sources?.positionTitle?.source || "n/a",
      sourceCompany: result.sources?.companyName?.source || "n/a",
      sourceLocation: result.sources?.location?.source || "n/a",
    });
  }

  const globalAccuracy = totalChecks ? (passedChecks / totalChecks) * 100 : 0;
  const avgConfidence = rows.length ? rows.reduce((sum, row) => sum + row.confidence, 0) / rows.length : 0;

  console.log("\nURL Parser Benchmark Report\n");
  console.table(rows);
  console.log(`Global Accuracy: ${globalAccuracy.toFixed(1)}% (${passedChecks}/${totalChecks})`);
  console.log(`Average Confidence: ${avgConfidence.toFixed(1)}`);

  if (globalAccuracy < 80) {
    process.exitCode = 1;
  }
}

runBenchmark().catch((error) => {
  console.error("Benchmark failed:", error);
  process.exit(1);
});
