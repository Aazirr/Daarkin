export const URL_PARSER_FIXTURES = [
  {
    name: "jsonld-simple-jobposting",
    url: "https://jobs.example.com/backend-engineer",
    html: `
      <html>
        <head>
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "JobPosting",
              "title": "Backend Engineer",
              "description": "Build APIs and services for the platform.",
              "hiringOrganization": { "@type": "Organization", "name": "Acme" },
              "jobLocation": {
                "@type": "Place",
                "address": {
                  "@type": "PostalAddress",
                  "addressLocality": "Makati",
                  "addressRegion": "NCR",
                  "addressCountry": "PH"
                }
              }
            }
          </script>
        </head>
      </html>
    `,
    expected: {
      companyName: "Acme",
      positionTitle: "Backend Engineer",
      locationIncludes: "Makati",
    },
  },
  {
    name: "jsonld-graph-array",
    url: "https://careers.example.org/jobs/123",
    html: `
      <html>
        <head>
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@graph": [
                { "@type": "WebPage", "name": "Job page" },
                {
                  "@type": ["JobPosting", "Thing"],
                  "name": "Data Scientist",
                  "description": "Apply ML models and experimentation.",
                  "hiringOrganization": { "name": "Northstar Labs" },
                  "jobLocationType": "TELECOMMUTE"
                }
              ]
            }
          </script>
        </head>
      </html>
    `,
    expected: {
      companyName: "Northstar Labs",
      positionTitle: "Data Scientist",
      locationIncludes: "Remote",
    },
  },
  {
    name: "og-twitter-fallback",
    url: "https://jobs.foobar.dev/roles/mobile",
    html: `
      <html>
        <head>
          <meta property="og:title" content="Mobile Engineer - Foobar" />
          <meta property="og:description" content="Ship delightful mobile experiences" />
          <meta name="twitter:description" content="iOS and Android product team" />
        </head>
      </html>
    `,
    expected: {
      companyName: "Foobar",
      positionTitle: "Mobile Engineer",
    },
  },
  {
    name: "linkedin-adapter",
    url: "https://www.linkedin.com/jobs/view/12345",
    html: `
      <html>
        <body>
          <h1 class="jobs-details-top__job-title">Senior Product Manager</h1>
          <a class="jobs-details-top__company-name">LinkedIn Corp</a>
          <div class="jobs-details-top__job-primary-description">Taguig, Metro Manila</div>
          <div class="jobs-description-content__text">Lead roadmap for growth products.</div>
        </body>
      </html>
    `,
    expected: {
      companyName: "LinkedIn Corp",
      positionTitle: "Senior Product Manager",
      locationIncludes: "Taguig",
    },
  },
  {
    name: "greenhouse-adapter",
    url: "https://boards.greenhouse.io/example/jobs/999",
    html: `
      <html>
        <body>
          <div class="app-title">Staff Frontend Engineer - Horizon</div>
          <div id="header"><span class="location">Remote - APAC</span></div>
          <div id="content">Build scalable frontend architecture.</div>
        </body>
      </html>
    `,
    expected: {
      companyName: "Horizon",
      positionTitle: "Staff Frontend Engineer",
      locationIncludes: "Remote",
    },
  },
  {
    name: "workday-adapter",
    url: "https://company.wd5.myworkdayjobs.com/en-US/careers/job/abc",
    html: `
      <html>
        <body>
          <h1 data-automation-id="jobPostingHeader">Principal Platform Engineer</h1>
          <div data-automation-id="company">Workday Systems Inc</div>
          <div data-automation-id="locations">Pasig, Philippines</div>
          <div data-automation-id="jobPostingDescription">Own platform reliability and scaling.</div>
        </body>
      </html>
    `,
    expected: {
      companyName: "Workday Systems Inc",
      positionTitle: "Principal Platform Engineer",
      locationIncludes: "Pasig",
    },
  },
  {
    name: "taleo-adapter",
    url: "https://jobs.taleo.net/careersection/jobdetail.ftl?job=111",
    html: `
      <html>
        <body>
          <div class="jobTitle">Security Engineer II</div>
          <div class="company">Global Secure Co</div>
          <div class="location">Mandaluyong, Philippines</div>
          <div class="description">Protect systems and incident response.</div>
        </body>
      </html>
    `,
    expected: {
      companyName: "Global Secure Co",
      positionTitle: "Security Engineer II",
      locationIncludes: "Mandaluyong",
    },
  },
  {
    name: "domain-fallback-only",
    url: "https://stripe.com/careers/role/infra",
    html: "<html><head><title>Open Position</title></head><body><h1>Open Position</h1></body></html>",
    expected: {
      companyName: "Stripe",
    },
  },
];
