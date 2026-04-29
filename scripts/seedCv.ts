import { credential } from "firebase-admin";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { CV as CVSchema, type CV } from "../src/types/CV";
import baseCv from "../.content/zallesov.dev";

const APP_NAME = "zallesov-dev-seed-cv";

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function buildDefaultCv(id: string): CV {
  const updatedHighlights: CV["highlights"] = [
    { title: "AI-first development", text: "Custom AI software development harness for high quality and fast results." },
    { title: "Agentic systems", text: "Track record building and deploying agentic systems." },
    { title: "SaaS ownership", text: "Experience running a SaaS product end-to-end." },
    { title: "Architecture", text: "Deep understanding of software architecture principles." },
    { title: "Scale & reliability", text: "Experience running distributed and high-load systems at scale." },
    { title: "Tech leadership", text: "Led engineering teams at startups and scale-ups, driving technical strategy and delivering complex systems from concept to production." },
  ];

  const multDevEmployment: CV["employments"][number] = {
    company: "Mult.dev",
    startDate: "Aug 2024",
    endDate: "present",
    text: "Chief Everything Officer",
    projects: [
      {
        name: "Mult.dev",
        title: "AI-first fullstack product + infra",
        urls: ["https://mult.dev"],
        highlights: [
          "Engineered an autoscaling GPU cluster on GCP for high-performance video rendering, reducing processing costs by ~40%.",
          "Architected and deployed an AI-powered user feedback management system using LangGraph, automating categorization and sentiment analysis.",
          "Implemented AI-driven SEO/GEO optimization strategies, increasing organic visibility.",
          "Led a non-technical team of customer success and marketing specialists.",
        ],
        stack: "GCP, GPUs, autoscaling, video rendering pipeline, LangGraph, TypeScript, DevOps",
      },
    ],
  };

  const peecEmployment: CV["employments"][number] = {
    company: "Peec.ai",
    startDate: "Jan 2025",
    endDate: "Aug 2025",
    text: "Principal AI Engineer",
    projects: [
      {
        name: "Peec.ai",
        title: "LLM analytics infrastructure",
        urls: ["https://peec.ai"],
        highlights: [
          "Developed core AI infrastructure including a high-performance system to intercept and analyze ChatGPT response streams in real-time.",
          "Built an automated AI response categorization engine for deep analytics into LLM behavior.",
          "Designed and managed a distributed network of parser bots using Playwright to extract data from non-API LLM interfaces.",
          "Integrated AI analytics with Looker Studio for stakeholder dashboards.",
        ],
        stack: "TypeScript, Playwright, distributed workers, Looker Studio",
      },
    ],
  };

  const baseEmployments = (baseCv as any).employments ?? [];
  const employments = [
    multDevEmployment,
    peecEmployment,
    ...baseEmployments.filter(
      (e: any) => e?.company !== "Mult.dev" && e?.company !== "Peec.ai"
    ),
  ];

  const cv: CV = {
    ...(baseCv as any),
    id,
    highlights: updatedHighlights,
    // Firebase Storage object path (used by Actions.tsx)
    pdf: "ALEKSANDR_ZALESOV CV 05.2026.pdf",
    employments,
  };

  return CVSchema.parse(cv);
}

async function main() {
  const id = process.argv[2] || process.env.NEXT_PUBLIC_CV_ID || "zallesov.dev";
  const projectId = requiredEnv("GCLOUD_PROJECT");

  const adminApp =
    getApps().find((it) => it.name === APP_NAME) ||
    initializeApp(
      {
        projectId,
        credential: credential.applicationDefault(),
      },
      APP_NAME
    );

  const db = getFirestore(adminApp);
  const cv = buildDefaultCv(id);

  await db.doc(["cvs", id].join("/")).set(cv);
  // eslint-disable-next-line no-console
  console.log(`Seeded CV: cvs/${id}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

