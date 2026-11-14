# SEO Meta, OG Tags & Heading Structure Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix LinkedIn/social share previews (currently showing "Past Experience" + company name instead of Alex's name and description), fix heading hierarchy, add robots.txt + sitemap, and add llms.txt for AI search readiness.

**Architecture:** All changes are in `/Users/zall/zall.dev/site/`. The site is Astro (static output) + React components + Tailwind. The `Layout.astro` controls `<head>` — this is the single file to fix for OG/meta/schema. Section components each incorrectly use `<h1>` for section headings; change to `<h2>`/`<h3>`. The Header component hides the real `<h1>` via `visibility:hidden` (JS-controlled font reveal) — crawlers never see the name; fix with `opacity` transition instead.

**Tech Stack:** Astro 6, React, Tailwind CSS, TypeScript, pnpm

**Root cause of LinkedIn bug:** No `og:title`/`og:description` tags → LinkedIn scrapes raw HTML → real H1 (`Alex Zall`) is `visibility:hidden` in static HTML → LinkedIn can't see the name → falls back to first visible text: "Past Experience" heading + company names.

---

## Chunk 1: OG Tags, Schema, and Meta (LinkedIn Fix)

### Task 1: Fix Layout.astro — add OG/Twitter/Schema/canonical

**Files:**
- Modify: `src/layouts/Layout.astro`
- Modify: `src/pages/index.astro`

The `Layout.astro` accepts `title` and `description` props but passes nothing else to `<head>`. We add optional `ogImage` prop (defaults to the avatar) and wire up all missing social/schema tags.

- [ ] **Step 1: Update Layout.astro**

Replace the entire file content:

```astro
---
import "../styles/global.css";

interface Props {
  title?: string;
  description?: string;
  ogImage?: string;
  canonicalUrl?: string;
}

const {
  title = "Alex Zall — Senior AI/Cloud Engineer",
  description = "Senior AI and Cloud engineer with 15+ years experience. Consulting in LLM systems, agentic pipelines, GCP/AWS architecture, and distributed systems.",
  ogImage = "https://zall.dev/photos/ava1-460.webp",
  canonicalUrl = "https://zall.dev/",
} = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />

    <!-- Primary meta -->
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonicalUrl} />

    <!-- Open Graph (LinkedIn, Facebook, Slack) -->
    <meta property="og:type" content="profile" />
    <meta property="og:url" content={canonicalUrl} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={ogImage} />
    <meta property="og:image:width" content="460" />
    <meta property="og:image:height" content="460" />
    <meta property="og:locale" content="en_US" />
    <meta property="profile:first_name" content="Alex" />
    <meta property="profile:last_name" content="Zall" />
    <meta property="profile:username" content="zallesov" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={ogImage} />

    <!-- JSON-LD structured data -->
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Person",
            "@id": "https://zall.dev/#person",
            "name": "Alex Zalesov",
            "alternateName": "Alex Zall",
            "url": "https://zall.dev",
            "image": {
              "@type": "ImageObject",
              "url": "https://zall.dev/photos/ava1-460.webp",
              "width": 460,
              "height": 460
            },
            "jobTitle": "Senior AI/Cloud Engineer",
            "description": "Senior AI and Cloud engineer with 15+ years experience specialising in LLM systems, agentic pipelines, and cloud-native architecture.",
            "sameAs": [
              "https://www.linkedin.com/in/zallesov",
              "https://medium.com/@zallesov",
              "https://github.com/zallesov"
            ],
            "knowsAbout": [
              "Large Language Models",
              "Agentic Systems",
              "Google Cloud Platform",
              "Amazon Web Services",
              "LangGraph",
              "LangChain",
              "TypeScript",
              "Python",
              "Scala",
              "Kubernetes",
              "Terraform"
            ],
            "alumniOf": {
              "@type": "CollegeOrUniversity",
              "name": "Novosibirsk State Technical University"
            },
            "homeLocation": {
              "@type": "Place",
              "name": "Malaga, Spain"
            }
          },
          {
            "@type": "WebSite",
            "@id": "https://zall.dev/#website",
            "url": "https://zall.dev",
            "name": "Zall.DEV",
            "description": "Portfolio and consulting site of Alex Zalesov — Senior AI/Cloud Engineer",
            "publisher": { "@id": "https://zall.dev/#person" },
            "inLanguage": "en-US"
          }
        ]
      }
    </script>

    <!-- Font -->
    <link
      rel="preload"
      href="/fonts/Honk-Regular.woff2"
      as="font"
      type="font/woff2"
      crossorigin
    />

    <!-- Favicons -->
    <link rel="icon" type="image/png" sizes="16x16" href="/favico_16x16.png" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favico_32x32.png" />
    <link rel="icon" type="image/png" sizes="48x48" href="/favico_48x48.png" />
    <link rel="icon" type="image/png" sizes="64x64" href="/favico_64x64.png" />
  </head>
  <body>
    <slot />
  </body>
</html>
```

- [ ] **Step 2: Update index.astro to pass proper title**

Replace `src/pages/index.astro`:

```astro
---
import Layout from "../layouts/Layout.astro";
import CVPage from "../components/CVPage";
import cvJson from "../zall.dev.json";
import { CV } from "../types/CV";

const parsed = CV.safeParse(cvJson);
if (!parsed.success) {
  console.error(parsed.error.flatten());
  throw new Error("Invalid zall.dev.json");
}
const cv = parsed.data;
---

<Layout
  title="Alex Zall — Senior AI/Cloud Engineer"
  description="Senior AI and Cloud engineer with 15+ years experience at SoundCloud, Zalando, and MOIA/Volkswagen. Consulting in LLM systems, agentic pipelines, and cloud-native architecture."
>
  <CVPage client:load cv={cv} />
</Layout>
```

- [ ] **Step 3: Build and verify**

```bash
cd /Users/zall/zall.dev/site
pnpm build
```

Expected: build succeeds with no errors.

- [ ] **Step 4: Check OG tags in built HTML**

```bash
grep -i "og:title\|og:description\|og:image\|canonical" /Users/zall/zall.dev/site/dist/index.html
```

Expected: all 4 tags present with correct values.

- [ ] **Step 5: Validate with LinkedIn Post Inspector**

Open https://www.linkedin.com/post-inspector/ in a browser, enter `https://zall.dev`, click Inspect. Expected: shows "Alex Zall — Senior AI/Cloud Engineer" as title and the avatar image as preview.

(Can also test with https://cards-dev.twitter.com/validator and https://developers.facebook.com/tools/debug/)

- [ ] **Step 6: Commit**

```bash
cd /Users/zall/zall.dev/site
git add src/layouts/Layout.astro src/pages/index.astro
git commit -m "feat: add OG tags, canonical, JSON-LD schema, and fix meta description"
```

---

## Chunk 2: Fix Heading Hierarchy (H1 → H2)

### Task 2: Fix all section components using H1 incorrectly

**Files:**
- Modify: `src/components/EmploymentSection.tsx` (line 12)
- Modify: `src/components/ArticlesSection.tsx` (line 11)
- Modify: `src/components/EductionSection.tsx` (line 12)
- Modify: `src/components/SideProjectsSection.tsx` (line 12)
- Modify: `src/components/PortfolioSection.tsx` (lines 13, 21)
- Modify: `src/components/SkillsSection.tsx` (line 10)

There should be exactly ONE `<h1>` on the page: the person's name in `Header.tsx`. All section headings (Past Experience, Articles, Education, Other Projects, Portfolio, Buzzwordz) must be `<h2>`. Portfolio item titles within the Portfolio section must be `<h3>`.

**Important:** Only change the HTML tag — do NOT change any `className` props. The Tailwind classes control visual sizing and are intentionally decoupled from semantic heading level.

- [ ] **Step 1: Fix EmploymentSection.tsx**

In `src/components/EmploymentSection.tsx` line 12, change:
```tsx
// Before
<h1 className="font-medium text-white text-3xl md:text-4xl mb-5">Past Experience</h1>
// After
<h2 className="font-medium text-white text-3xl md:text-4xl mb-5">Past Experience</h2>
```

- [ ] **Step 2: Fix ArticlesSection.tsx**

In `src/components/ArticlesSection.tsx` line 11, change:
```tsx
// Before
<h1 className="font-medium text-white text-3xl md:text-4xl mb-5">Articles</h1>
// After
<h2 className="font-medium text-white text-3xl md:text-4xl mb-5">Articles</h2>
```

- [ ] **Step 3: Fix EductionSection.tsx**

In `src/components/EductionSection.tsx` line 12, change:
```tsx
// Before
<h1 className="font-medium text-white text-3xl md:text-4xl mb-5">Education</h1>
// After
<h2 className="font-medium text-white text-3xl md:text-4xl mb-5">Education</h2>
```

- [ ] **Step 4: Fix SideProjectsSection.tsx**

In `src/components/SideProjectsSection.tsx` line 12, change:
```tsx
// Before
<h1 className="font-large text-white text-3xl md:text-4xl mb-5">Other Projects</h1>
// After
<h2 className="font-large text-white text-3xl md:text-4xl mb-5">Other Projects</h2>
```

- [ ] **Step 5: Fix PortfolioSection.tsx (two changes)**

In `src/components/PortfolioSection.tsx`:
- Line 13: section heading `<h1>Portfolio</h1>` → `<h2>Portfolio</h2>`
- Line 21: portfolio item title `<h1 ...>{parse(portfolio.title)}</h1>` → `<h3 ...>{parse(portfolio.title)}</h3>`

```tsx
// Line 13: Before
<h1 className="font-medium text-white text-3xl md:text-4xl mb-5">Portfolio</h1>
// Line 13: After
<h2 className="font-medium text-white text-3xl md:text-4xl mb-5">Portfolio</h2>

// Line 21: Before
<h1 className="font-normal text-white text-3xl md:text-4xl break-words min-w-fit">{parse(portfolio.title)}</h1>
// Line 21: After
<h3 className="font-normal text-white text-3xl md:text-4xl break-words min-w-fit">{parse(portfolio.title)}</h3>
```

- [ ] **Step 6: Fix SkillsSection.tsx**

In `src/components/SkillsSection.tsx` line 10, change:
```tsx
// Before
<h1 className="font-medium text-white text-3xl md:text-4xl mb-5">Buzzwordz</h1>
// After
<h2 className="font-medium text-white text-3xl md:text-4xl mb-5">Buzzwordz</h2>
```

- [ ] **Step 7: Verify exactly one H1 remains**

```bash
grep -rn "<h1" /Users/zall/zall.dev/site/src/components/
```

Expected: only `Header.tsx` contains `<h1`.

- [ ] **Step 8: Build and verify visual appearance unchanged**

```bash
cd /Users/zall/zall.dev/site && pnpm build
```

Open `dist/index.html` in a browser (`pnpm preview`) and confirm all sections look identical — only the semantic tag changed, not the styling.

- [ ] **Step 9: Commit**

```bash
cd /Users/zall/zall.dev/site
git add src/components/EmploymentSection.tsx src/components/ArticlesSection.tsx src/components/EductionSection.tsx src/components/SideProjectsSection.tsx src/components/PortfolioSection.tsx src/components/SkillsSection.tsx
git commit -m "fix: convert section headings from h1 to h2/h3 — one h1 per page"
```

---

## Chunk 3: Fix H1 Visibility (Crawler Can't See Name)

### Task 3: Replace visibility:hidden with opacity transition in Header.tsx

**Files:**
- Modify: `src/components/Header.tsx`

Currently the H1 (`Alex Zall`) is rendered with `style={{ visibility: isHonkReady ? "visible" : "hidden" }}`. `visibility:hidden` keeps the element in the DOM but makes it invisible — crucially, crawlers that don't execute JS (LinkedIn, most SEO bots) see the name hidden and ignore it. Replace with `opacity: 0 → 1` which achieves the same visual fade-in but never hides the text from parsers that read the HTML.

- [ ] **Step 1: Update Header.tsx**

In `src/components/Header.tsx`, change the `<h1>` element's style prop:

```tsx
// Before (line 51-56)
<h1
  className="font-honk text-white text-9xl uppercase mb-8"
  style={{ visibility: isHonkReady ? "visible" : "hidden" }}
>
  {firstName} {lastName}
</h1>

// After
<h1
  className="font-honk text-white text-9xl uppercase mb-8"
  style={{
    opacity: isHonkReady ? 1 : 0,
    transition: "opacity 0.3s ease-in",
  }}
>
  {firstName} {lastName}
</h1>
```

- [ ] **Step 2: Build**

```bash
cd /Users/zall/zall.dev/site && pnpm build
```

- [ ] **Step 3: Verify H1 text is in static HTML (not hidden)**

```bash
grep -A2 'font-honk' /Users/zall/zall.dev/site/dist/index.html | head -10
```

Expected: the H1 tag is present in the HTML **without** `visibility:hidden`. The `style` attribute should contain `opacity` only (the initial value before hydration). 

Note: Astro renders the initial React state server-side. Since `isHonkReady` starts as `false`, the static HTML will have `opacity:0` — this is correct. Crawlers read the text content regardless of opacity. The visual transition only affects the browser render after JS hydrates.

- [ ] **Step 4: Confirm crawlers can read the name**

```bash
curl -s https://zall.dev | grep -i "alex zall\|font-honk"
```

Run after deploying. Expected: `Alex Zall` appears in the curl output inside the H1 tag (not hidden by visibility).

- [ ] **Step 5: Commit**

```bash
cd /Users/zall/zall.dev/site
git add src/components/Header.tsx
git commit -m "fix: replace visibility:hidden with opacity transition on H1 — name now readable by crawlers"
```

---

## Chunk 4: robots.txt + Sitemap

### Task 4: Add robots.txt and sitemap integration

**Files:**
- Create: `public/robots.txt`
- Modify: `astro.config.mjs`

`public/` in Astro is copied verbatim to `dist/` at build time — no config needed for static files. The `@astrojs/sitemap` integration auto-generates `/sitemap-index.xml` and `/sitemap-0.xml` on each build when `site` is set in `astro.config.mjs`.

- [ ] **Step 1: Create public/robots.txt**

Create file at `/Users/zall/zall.dev/site/public/robots.txt`:

```
User-agent: *
Allow: /

Sitemap: https://zall.dev/sitemap-index.xml
```

- [ ] **Step 2: Install @astrojs/sitemap**

```bash
cd /Users/zall/zall.dev/site && pnpm add @astrojs/sitemap
```

- [ ] **Step 3: Update astro.config.mjs**

```js
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://zall.dev",
  output: "static",
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
    sitemap(),
  ],
});
```

- [ ] **Step 4: Build and verify both files exist**

```bash
cd /Users/zall/zall.dev/site && pnpm build
ls dist/robots.txt dist/sitemap-index.xml dist/sitemap-0.xml
```

Expected: all three files present.

- [ ] **Step 5: Check sitemap content**

```bash
cat /Users/zall/zall.dev/site/dist/sitemap-0.xml
```

Expected: contains `<loc>https://zall.dev/</loc>`.

- [ ] **Step 6: Commit**

```bash
cd /Users/zall/zall.dev/site
git add public/robots.txt astro.config.mjs pnpm-lock.yaml package.json
git commit -m "feat: add robots.txt and @astrojs/sitemap integration"
```

---

## Chunk 5: llms.txt for AI Search

### Task 5: Add llms.txt

**Files:**
- Create: `public/llms.txt`
- Create: `public/llms-full.txt`

The [llms.txt standard](https://llmstxt.org) provides a plain Markdown summary for AI tools (Perplexity, ChatGPT Browse, etc.) that check for it. Served as a static file.

- [ ] **Step 1: Create public/llms.txt**

Create `/Users/zall/zall.dev/site/public/llms.txt`:

```markdown
# Alex Zalesov (Alex Zall)

> Senior AI/Cloud Engineer and technical consultant based in Malaga, Spain.
> 15+ years experience building distributed systems, AI/LLM infrastructure,
> and leading engineering teams. Available for consulting and contract work.

## Services
- AI-first development and LLM system architecture (LangGraph, LangChain, VertexAI)
- Agentic pipeline design and deployment
- Cloud infrastructure (GCP, AWS, Azure, Kubernetes, Terraform)
- SaaS product ownership end-to-end
- Technical leadership and fractional CTO engagements

## Notable employers
SoundCloud (2013–2017), Zalando (2017–2018), MOIA/Volkswagen (2019–2021), Zapp/Quickcommerce (2021–2023)

## Current work
- Mult.dev — Chief Everything Officer (Aug 2024–present)
- Beeboard — Head of Engineering (Dec 2023–present)

## Articles
- [A Practical Memo on Building LLM Agents](https://medium.com/@zallesov/a-practical-memo-on-building-llm-agents-cc5179cb2e50)
- [Types in 3-layer application](https://medium.com/@zallesov/types-in-3-layer-application-ddc03ec5cbf7)
- [Stateful routing with LangGraph](https://medium.com/@zallesov/stateful-routing-with-langgraph-6dc8edc798bd)

## Contact
- Website: https://zall.dev
- LinkedIn: https://www.linkedin.com/in/zallesov
- Schedule: https://calendly.com/zallesov
- Location: Malaga, Spain / Berlin, Germany (remote available)
```

- [ ] **Step 2: Create public/llms-full.txt**

Create `/Users/zall/zall.dev/site/public/llms-full.txt` with the same content as llms.txt plus a full employment history section pulled from `zall.dev.json`. Keep it in Markdown prose.

- [ ] **Step 3: Build and verify**

```bash
cd /Users/zall/zall.dev/site && pnpm build
curl -s file:///Users/zall/zall.dev/site/dist/llms.txt | head -5
```

Expected: first line is `# Alex Zalesov (Alex Zall)`.

- [ ] **Step 4: Commit**

```bash
cd /Users/zall/zall.dev/site
git add public/llms.txt public/llms-full.txt
git commit -m "feat: add llms.txt for AI search readiness (Perplexity, ChatGPT Browse)"
```

---

## Execution order

Run chunks in order — each builds on the previous:

1. **Chunk 1** (OG tags) → direct LinkedIn fix, deploy immediately after
2. **Chunk 2** (heading hierarchy) → supports Chunk 1's SEO signal
3. **Chunk 3** (H1 visibility) → secondary LinkedIn fix
4. **Chunk 4** (robots + sitemap) → crawlability
5. **Chunk 5** (llms.txt) → AI search readiness

After all chunks, submit `https://zall.dev` to:
- Google Search Console → URL Inspection → Request Indexing
- Bing Webmaster Tools → URL Submission
- LinkedIn Post Inspector → force re-scrape of OG tags
