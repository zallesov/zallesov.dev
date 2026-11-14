export type CategoryId =
  | "ai"
  | "workflow"
  | "cloud"
  | "data"
  | "devops"
  | "code"
  | "product";

export interface Category {
  id: CategoryId;
  label: string;
  color: string;
  text: string;
}

export interface Tool {
  name: string;
  cat: CategoryId;
  /** 1 = regular, 2 = important, 3 = core tool. Drives cube size. */
  weight?: 1 | 2 | 3;
}

export const CATEGORIES: Category[] = [
  { id: "ai", label: "AI", color: "#F97316", text: "#1C0E21" },
  { id: "workflow", label: "Workflow", color: "#A855F7", text: "#FFFFFF" },
  { id: "cloud", label: "Cloud", color: "#38BDF8", text: "#1C0E21" },
  { id: "data", label: "Data", color: "#22C55E", text: "#1C0E21" },
  { id: "devops", label: "DevOps", color: "#FACC15", text: "#1C0E21" },
  { id: "code", label: "Code", color: "#F43F5E", text: "#FFFFFF" },
  { id: "product", label: "Product", color: "#14B8A6", text: "#1C0E21" },
];

export const TOOLS: Tool[] = [
  // AI
  { name: "Claude Code", cat: "ai", weight: 3 },
  { name: "Codex", cat: "ai", weight: 3 },
  { name: "Copilot", cat: "ai" },
  { name: "LangChain", cat: "ai", weight: 2 },
  { name: "LangGraph", cat: "ai", weight: 2 },
  { name: "LangSmith", cat: "ai", weight: 2 },
  { name: "Evalite", cat: "ai", weight: 2 },
  { name: "MCP", cat: "ai", weight: 2 },
  { name: "OpenAI", cat: "ai" },
  { name: "Anthropic", cat: "ai" },
  { name: "Gemini", cat: "ai" },
  { name: "Hugging Face", cat: "ai" },
  { name: "Replicate", cat: "ai" },
  { name: "Whisper", cat: "ai" },
  { name: "Vertex AI", cat: "ai" },
  // Workflow
  { name: "Orca", cat: "workflow", weight: 2 },
  { name: "Compound Eng.", cat: "workflow", weight: 2 },
  { name: "Graphify", cat: "workflow", weight: 2 },
  { name: "BB", cat: "workflow" },
  { name: "HyperFrames", cat: "workflow" },
  { name: "ChatGPT Voice", cat: "workflow" },
  // Cloud
  { name: "GCP", cat: "cloud", weight: 2 },
  { name: "AWS", cat: "cloud", weight: 2 },
  { name: "Azure", cat: "cloud" },
  { name: "Cloudflare", cat: "cloud", weight: 2 },
  { name: "Firebase", cat: "cloud" },
  { name: "Railway", cat: "cloud" },
  { name: "Vercel", cat: "cloud" },
  // Data
  { name: "PostgreSQL", cat: "data", weight: 2 },
  { name: "Redis", cat: "data" },
  { name: "Cassandra", cat: "data" },
  { name: "Firestore", cat: "data" },
  { name: "Kafka", cat: "data", weight: 2 },
  { name: "RabbitMQ", cat: "data" },
  { name: "Pub/Sub", cat: "data" },
  { name: "Kinesis", cat: "data" },
  // DevOps
  { name: "Docker", cat: "devops", weight: 2 },
  { name: "Kubernetes", cat: "devops", weight: 2 },
  { name: "Terraform", cat: "devops", weight: 2 },
  { name: "GitHub Actions", cat: "devops" },
  { name: "CircleCI", cat: "devops" },
  { name: "Cloud Build", cat: "devops" },
  // Code
  { name: "TypeScript", cat: "code", weight: 3 },
  { name: "Node.js", cat: "code", weight: 2 },
  { name: "Python", cat: "code", weight: 2 },
  { name: "Scala", cat: "code" },
  { name: "Java", cat: "code" },
  { name: "React", cat: "code", weight: 2 },
  { name: "Next.js", cat: "code" },
  { name: "NestJS", cat: "code" },
  { name: "Astro", cat: "code" },
  { name: "Akka", cat: "code" },
  { name: "ZIO", cat: "code" },
  // Product
  { name: "PostHog", cat: "product", weight: 2 },
];
