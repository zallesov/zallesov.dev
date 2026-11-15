import type { TyperSpec } from "../components/hero/HeroSpace";
import { PIPELINE, PIPELINE_STEPS } from "../components/approach/pipelineSteps";
import { AUTOMATION, AUTOMATION_STEPS } from "../components/approach/automationSteps";
import { EVALS, EVALS_STEPS } from "../components/approach/evalsSteps";

const seconds = (m: { durationInFrames: number; fps: number }) => Math.round(m.durationInFrames / m.fps);

// Content for the new home page blocks. Career, articles and links still come from zall.dev.json.

/** One of these is typed under the title, picked at random on every load. */
export const HERO_TAGLINES = [
  "HUMANS DECIDE. AGENTS DELIVER.",
  "YOU SLEEP. THEY SHIP.",
  "> AGENTS ONLINE. WHAT ARE WE BUILDING?",
];

/**
 * Hero title that types itself. Line 0 is the small lead-in above, line 1 the big title.
 * software (thinks, erases) → AI engineer → agents engineer → agents manager.
 */
export const HERO_TYPER: TyperSpec & { final: string } = {
  lines: [
    { target: "#hero-lead", widest: "I'M", size: "small" },
    { target: "#hero-title", widest: "AGENTS ENGINEER", size: "large" },
    { target: "#hero-role", widest: "> AGENTS ONLINE. WHAT ARE WE BUILDING?", size: "small", candidates: HERO_TAGLINES },
  ],
  /** line 2 gets a random tagline once the title is done */
  outro: { line: 2 },
  script: [
    { line: 0 },
    { type: "I'M", fast: true },
    { wait: 250 },
    { line: 1 },
    { type: "SOFTWARE" },
    { blink: 2 }, // thinking...
    { back: 8 }, // "SOFTWARE"
    { type: "AI ENGINEER" },
    { blink: 2 },
    { caret: "start" },
    { del: 2 }, // "AI"
    { type: "AGENTS" },
    { blink: 2 },
    { caret: "end" },
    { back: 8 }, // "ENGINEER"
    { type: "MANAGER" },
  ],
  /** What the title says once typed; for search engines and screen readers. */
  final: "Agents manager",
};

/** Shown next to the portrait: what to come to me for, one punchy line each. `live` = what I'm doing right now. */
export const FOCUS: { title: string; line: string; live?: boolean }[] = [
  { title: "Agentic systems", line: "Agents in production, not in demos." },
  { title: "Agent swarms", line: "Orchestrating teams of agents for development and business tasks." },
  { title: "AI transformation", line: "Teaching teams how to use AI in day-to-day tasks." },
  { title: "Business automation", line: "If you do it twice, it has to be automated." },
  { title: "Content pipelines", line: "AI content that looks professional and slick." },
  { title: "Evals / Agentic monitoring", line: "If you can't measure it, you can't improve it." },
  { title: "Highload", line: "Good old software development in the cloud." },
];

/**
 * Companies row. `logos` are files in src/assets/logos, shown side by side. With kind "icon"
 * the name is printed next to the mark; "wordmark" logos already spell the name.
 */
export const LOGOS: { name: string; url: string; logos: string[]; kind: "icon" | "wordmark" }[] = [
  { name: "SoundCloud", url: "https://soundcloud.com", logos: ["soundcloud"], kind: "icon" },
  { name: "Zalando", url: "https://zalando.de", logos: ["zalando"], kind: "icon" },
  { name: "MOIA, a Volkswagen company", url: "https://www.moia.io/en", logos: ["volkswagen", "moia"], kind: "wordmark" },
  { name: "Zapp", url: "https://justzapp.com", logos: ["zapp"], kind: "wordmark" },
  { name: "Peec AI", url: "https://peec.ai", logos: ["peec"], kind: "wordmark" },
];

export interface Approach {
  id: string;
  title: string;
  summary: string;
  /** Main flow, left to right. Becomes the animated diagram later. */
  flow: string[];
  /** Nodes attached to the side of the flow. */
  side?: string[];
  points: string[];
  /** Numbered steps, synced with the animation: `at` is the frame a step starts on. */
  steps?: { at: number; text: string }[];
  /** The animation: Play button label and length. Set together with `steps`. */
  film?: { label: string; seconds: number };
  /** Not shown on the page yet (work in progress). */
  hidden?: boolean;
}

export const APPROACHES: Approach[] = [
  {
    id: "dev-pipeline",
    title: "Development Pipeline",
    summary: "I make the decisions, the agents deliver, I review.",
    flow: [],
    points: [],
    steps: PIPELINE_STEPS,
    film: { label: "Play the pipeline", seconds: seconds(PIPELINE) },
  },
  {
    id: "agentic-systems",
    hidden: true,
    title: "Agentic Systems",
    summary:
      "Production multi-agent systems with clear roles. Example: a call helper with a wizard, a scheduler and a swarm of workers.",
    flow: ["User", "Wizard agent", "Scheduler agent", "Worker agents", "Result"],
    points: [
      "Each agent has one job, its own tools and a narrow context.",
      "Scheduling and execution are separated, so workers scale out.",
      "Every step is traced and replayable.",
    ],
  },
  {
    id: "evals",
    title: "Agentic Evals",
    summary: "Evals are tests for agents. If you don't measure it, you can't improve it.",
    flow: [],
    points: [],
    steps: EVALS_STEPS,
    film: { label: "Play the evals", seconds: seconds(EVALS) },
  },
  {
    id: "automation",
    title: "Business Automation",
    summary: "A swarm of agents runs the routine. I only look at the summaries.",
    flow: [],
    points: [],
    steps: AUTOMATION_STEPS,
    film: { label: "Play the automation", seconds: seconds(AUTOMATION) },
  },
];

export const EXPERTISE = [
  {
    title: "AI Engineering",
    motto: "Agents are software. Treat them like it.",
    items: [
      "Agent architecture: orchestrators, workers, multi-agent",
      "Context engineering and RAG",
      "Evals and prompt regression testing",
      "LLM observability and tracing",
      "Model selection by cost, speed, quality",
      "Guardrails and human-in-the-loop",
    ],
  },
  {
    title: "Software & Architecture",
    motto: "Boring tech, done right.",
    items: [
      "Software development: TypeScript, Python, Scala/JVM",
      "Cloud architecture: GCP, AWS, Azure, Cloudflare",
      "Databases",
      "High-load and distributed systems",
      "Performance optimisation",
    ],
  },
  {
    title: "Product",
    motto: "Opinions are hypotheses.",
    items: [
      "Data-driven decisions",
      "A/B testing",
      "Measure everything",
      "SaaS ownership end to end",
      "AI prototypes in days, not months",
    ],
  },
  {
    title: "Automate Everything",
    motto: "If the job needs to be done twice, it has to be automated.",
    items: [
      "Agentic UX testing",
      "CI/CD and infrastructure as code",
      "Business process automation with agents",
      "Observability and alerting",
    ],
  },
  {
    title: "Leadership",
    motto: "Build teams that build systems.",
    items: [
      "7 years leading engineering teams",
      "Hiring, mentoring, growing engineers",
      "Moving teams to AI-native development",
      "Technical strategy, fractional CTO",
    ],
  },
];

/** Side experiments: a square picture, the question as the hook, the name and address under it. */
export const EXPERIMENTS: { name: string; url: string; hook: string; image: string }[] = [
  { name: "Pride Prep", url: "https://pride.zall.dev", hook: "Planning to attend Pride this year? You'll need a look.", image: "/experiments/pride-prep.jpg" },
  { name: "Prince of Persia with AK47", url: "https://prince.zall.dev", hook: "Are you old enough to remember it?", image: "/experiments/princejs.png" },
];
