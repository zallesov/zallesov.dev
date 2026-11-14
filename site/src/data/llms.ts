// llms.txt and llms-full.txt (https://llmstxt.org): the home page as plain Markdown for AI
// assistants and AI search. Built from the same data as the page, so the two never drift apart.
import cvJson from "../zall.dev.json";
import { CV } from "../types/CV";
import { APPROACHES, EXPERTISE, FOCUS, LOGOS } from "./home";
import { CAREER_NOW } from "./career";
import { CATEGORIES, TOOLS } from "./toolbox";

const cv = CV.parse(cvJson);
const SITE = "https://zall.dev";
const plain = (s: string) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

const intro = [
  "# Alex Zalesov (Alex Zall)",
  "",
  "> AI engineer and tech lead with 15+ years in software (SoundCloud, Zalando, MOIA/Volkswagen, Peec AI).",
  "> Builds agentic systems in production, runs swarms of coding agents, sets up evals and automates",
  "> business processes with agents. Based in Málaga, Spain and Berlin, Germany; works remote. Open to work.",
  "",
];

const focus = ["## What to come to me for", ...FOCUS.map((f) => `- **${f.title}**: ${f.line}`), ""];

const approaches = [
  "## How I work",
  ...APPROACHES.filter((a) => !a.hidden).flatMap((a) => [
    "",
    `### ${a.title}`,
    a.summary,
    ...(a.steps ?? []).map((s, i) => `${i + 1}. ${s.text}`),
  ]),
  "",
];

const now = [
  "## Now",
  CAREER_NOW.lead,
  ...CAREER_NOW.projects.flatMap((p) => [
    "",
    `### ${p.name} (${p.url}) — ${p.role}`,
    p.about,
    ...p.highlights.map((h) => `- ${h}`),
    `Stack: ${p.stack}`,
  ]),
  "",
];

const contact = [
  "## Contact",
  `- Website: ${SITE}`,
  cv.calendly && `- Book a call: ${cv.calendly}`,
  cv.linkedin && `- LinkedIn: ${cv.linkedin}`,
  cv.telegram && `- Telegram: ${cv.telegram}`,
  cv.github && `- GitHub: ${cv.github}`,
  cv.pdf && `- CV (PDF): ${SITE}${cv.pdf}`,
  "",
].filter((l): l is string => typeof l === "string");

/** Short version: who, what, current work, links. */
export function llmsTxt(): string {
  return [
    ...intro,
    ...focus,
    "## Companies",
    LOGOS.map((l) => l.name).join(", "),
    "",
    "## Current work",
    ...CAREER_NOW.projects.map((p) => `- [${p.name}](${p.url}) — ${p.role}. ${p.about}`),
    "",
    "## More",
    `- [Full profile: approach, career, skills](${SITE}/llms-full.txt)`,
    ...(cv.articles ?? []).map((a) => `- [${plain(a.title)}](${a.url})`),
    "",
    ...contact,
  ].join("\n");
}

/** Everything on the page: approach, career with highlights, expertise, toolbox. */
export function llmsFullTxt(): string {
  const career = (cv.employments ?? [])
    .filter((e) => !/present/i.test(e.endDate ?? ""))
    .flatMap((e) => [
      "",
      `### ${e.company} (${e.startDate} — ${e.endDate})`,
      ...e.projects.flatMap((p) => [
        p.title && `**${plain(p.title)}**`,
        p.preambule && plain(p.preambule),
        ...(p.highlights ?? []).map((h) => `- ${plain(h)}`),
        p.stack && `Stack: ${p.stack.replace(/^stack:\s*/i, "")}`,
      ]),
    ])
    .filter((l): l is string => typeof l === "string");
  const side = (cv.sideProjects ?? []).flatMap((p) => [
    "",
    `### ${p.name}${p.title ? ` — ${plain(p.title)}` : ""}`,
    ...(p.preambule ? [plain(p.preambule)] : []),
    ...(p.highlights ?? []).map((h) => `- ${plain(h)}`),
  ]);
  const edu = cv.educations?.[0];
  return [
    ...intro,
    ...focus,
    ...approaches,
    ...now,
    "## Career",
    ...career,
    "",
    "## Side projects",
    ...side,
    "",
    "## Expertise",
    ...EXPERTISE.flatMap((x) => ["", `### ${x.title}`, `_${x.motto}_`, ...x.items.map((i) => `- ${i}`)]),
    "",
    "## Toolbox",
    ...CATEGORIES.map((c) => `- ${c.label}: ${TOOLS.filter((t) => t.cat === c.id).map((t) => t.name).join(", ")}`),
    "",
    ...(edu ? ["## Education", `${edu.specialisation}, ${edu.university}, ${edu.startYear}–${edu.endYear}`, ""] : []),
    ...contact,
  ].join("\n");
}
