// Content for the new home page blocks. Career, articles and links still come from zall.dev.json.

export const ROLE_LINE = "AI engineer. I build agentic systems and the teams of agents that ship them.";

export const PUNCHLINES = [
  { value: "20", unit: "years", label: "shipping software" },
  { value: "7", unit: "years", label: "leading teams" },
  { value: "4", unit: "years", label: "building agentic systems" },
  { value: "Now", unit: "", label: "orchestrating agent swarms", live: true },
];

export const LOGOS = [
  "SoundCloud",
  "Zalando",
  "MOIA · Volkswagen",
  "Zapp",
  "Peec.ai",
  "Beeboard",
  "Mult.dev",
  "2Meters",
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
}

export const APPROACHES: Approach[] = [
  {
    id: "agent-team",
    title: "Autonomous Agent Team",
    summary:
      "Tickets go in, production code comes out. An orchestrator hands work to developer agents, a different model reviews it, CI decides.",
    flow: ["Backlog", "Orchestrator", "Dev agents · Opus", "Review · Codex", "CI", "Production"],
    side: ["Oracle · Fable ⇄ project knowledge base", "Me ⇄ voice · ChatGPT → backlog", "Me ⇄ chat ⇄ Orchestrator"],
    points: [
      "Independent review by a second model catches what the author model misses.",
      "An oracle agent answers questions from the project knowledge base.",
      "Always online: I steer by voice and chat, the system keeps working.",
    ],
  },
  {
    id: "agentic-systems",
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
    summary: "I don't trust prompts by eye. Every prompt and model change is measured against a fixed set of cases.",
    flow: ["Dataset", "Prompt v1…vN", "Models", "Scores", "Decision"],
    points: [
      "Prompt regressions are caught before release, not by users.",
      "Models are compared on quality, speed and cost per run.",
      "The cheapest model that passes wins.",
    ],
  },
  {
    id: "automation",
    title: "Business Automation",
    summary:
      "Agents that do the routine nobody wants. Example: a daily crawl of provider docs that turns changes into new catalogue offerings.",
    flow: ["Daily schedule", "Agents read provider docs · MCP · APIs", "Diff with imported base", "New offerings"],
    points: [
      "Runs every day without a person in the loop.",
      "Only real changes become new entries.",
      "If a job needs doing twice, it gets automated.",
    ],
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
