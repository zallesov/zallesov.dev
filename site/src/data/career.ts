// Career block of the lab home page: what I do now, then the CV split into eras.
// Employments and side projects still come from zall.dev.json; this file only adds
// the "now" projects and decides which era each CV entry belongs to.

export const CAREER_NOW: {
  lead: string;
  projects: { name: string; url: string; role: string; about: string; highlights: string[]; stack: string }[];
} = {
  lead: "Right now I build two AI products of my own. On both I own the whole technical side: architecture, agents, infrastructure and delivery.",
  projects: [
    {
      name: "RedDeck",
      url: "https://reddeck.ai",
      role: "Tech lead · own product",
      about:
        "A node-based cockpit for AI video production. Commercials, series and film go from brief to final cut on one board: generation, review and montage side by side.",
      highlights: [
        "Node canvas where the brief and references feed every generation automatically",
        "One catalogue of image and video models from fal, Runway, Higgsfield and ByteDance; studios bring their own keys, no markup",
        "Long generation jobs run in Cloudflare Workflows; results land in R2 and reach the board live",
        "Built with a team of coding agents: every ticket goes through a plan, review and tests in CI",
      ],
      stack: "Next.js · TypeScript · Supabase · Cloudflare Workflows · R2 · Railway",
    },
    {
      name: "Call Helper",
      url: "https://call-helper.eu",
      role: "Tech lead · own product",
      about:
        "An AI assistant that makes phone calls for you. You write the task in your language; it calls doctors, landlords and local businesses across Europe in theirs, and reports back with a comparison.",
      highlights: [
        "Two LangGraph agents: a wizard that turns a chat into a call plan, and an event-driven orchestrator that runs the calls, retries and follow-ups",
        "Real phone calls through ElevenLabs voice agents over SIP, in 21 languages",
        "Scheduling and retries on Cloud Tasks, live task state in Firestore, billing by the second",
        "Prompts and models are checked with Evalite evals; every run is traced in LangSmith",
        "Landing page optimised for SEO and GEO, so both Google and AI assistants find and cite it; mentions in AI search are tracked with Peec AI",
      ],
      stack: "Next.js · LangGraph · LangSmith · ElevenLabs · Firebase · Cloud Tasks · Evalite · Peec AI",
    },
  ],
};

export type CareerEra = "llm" | "pre-ai";

export const CAREER_ERAS: { id: CareerEra; label: string }[] = [
  { id: "llm", label: "Before Opus 5.5" },
  { id: "pre-ai", label: "Before AI" },
];

// CV entries (company or side-project name) that belong to the LLM era; everything else is "pre-ai"
const LLM_ERA = new Set(["Mult.dev", "Peec.ai", "Beeboard", "Snubes", "Super-real"]);

export const careerEra = (name: string): CareerEra => (LLM_ERA.has(name) ? "llm" : "pre-ai");

// Jobs held in more than one stretch: the periods shown instead of the CV's single start and end.
export const CAREER_PERIODS: Record<string, string[]> = {};
