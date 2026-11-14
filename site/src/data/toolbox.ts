export type CategoryId =
  | "ai"
  | "models"
  | "agents"
  | "workflow"
  | "media"
  | "testing"
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
  { id: "agents", label: "Agents", color: "#A855F7", text: "#FFFFFF" },
  { id: "ai", label: "AI", color: "#F97316", text: "#1C0E21" },
  { id: "models", label: "Models", color: "#FDBA74", text: "#1C0E21" },
  { id: "workflow", label: "Workflow", color: "#E9D5FF", text: "#1C0E21" },
  { id: "media", label: "Motion & media", color: "#EC4899", text: "#FFFFFF" },
  { id: "testing", label: "Testing", color: "#84CC16", text: "#1C0E21" },
  { id: "code", label: "Code", color: "#F43F5E", text: "#FFFFFF" },
  { id: "cloud", label: "Cloud", color: "#38BDF8", text: "#1C0E21" },
  { id: "data", label: "Data", color: "#22C55E", text: "#1C0E21" },
  { id: "devops", label: "DevOps", color: "#FACC15", text: "#1C0E21" },
  { id: "product", label: "Product", color: "#14B8A6", text: "#1C0E21" },
];

export const TOOLS: Tool[] = [
  // Agents: what does the work day to day
  { name: "BB", cat: "agents", weight: 3 },
  { name: "Graphify", cat: "agents", weight: 3 },
  { name: "Claude Code", cat: "agents", weight: 3 },
  { name: "Codex", cat: "agents", weight: 2 },
  { name: "MCP", cat: "agents", weight: 2 },
  { name: "Context7", cat: "agents" },
  { name: "Orca", cat: "agents", weight: 2 },
  { name: "Omnigent", cat: "agents" },
  { name: "Compound Engineering", cat: "agents", weight: 2 },
  { name: "Superpowers", cat: "agents" },
  { name: "Caveman", cat: "agents" },
  { name: "Daytona", cat: "agents" },
  { name: "Hermes", cat: "agents" },
  { name: "Copilot", cat: "agents" },
  // AI: models and LLM frameworks
  { name: "LangChain", cat: "ai", weight: 2 },
  { name: "LangGraph", cat: "ai", weight: 2 },
  { name: "LangSmith", cat: "ai" },
  { name: "AI SDK", cat: "ai" },
  { name: "Anthropic", cat: "ai", weight: 2 },
  { name: "OpenAI", cat: "ai" },
  { name: "Gemini", cat: "ai" },
  { name: "Vertex AI", cat: "ai" },
  { name: "Hugging Face", cat: "ai" },
  { name: "Replicate", cat: "ai" },
  { name: "Whisper", cat: "ai" },
  // Models
  { name: "Opus", cat: "models", weight: 3 },
  { name: "Sonnet", cat: "models", weight: 2 },
  { name: "Haiku", cat: "models" },
  { name: "Fable", cat: "models", weight: 2 },
  { name: "Llama", cat: "models" },
  { name: "Mistral", cat: "models" },
  { name: "DeepSeek", cat: "models" },
  { name: "Qwen", cat: "models" },
  { name: "Grok", cat: "models" },
  { name: "Veo", cat: "models" },
  { name: "Kling", cat: "models" },
  { name: "Sora", cat: "models" },
  { name: "Seedance", cat: "models" },
  { name: "Nano Banana", cat: "models" },
  // Workflow
  { name: "GitHub", cat: "workflow", weight: 2 },
  { name: "Obsidian", cat: "workflow", weight: 2 },
  { name: "Telegram", cat: "workflow" },
  { name: "Linear", cat: "workflow" },
  { name: "Notion", cat: "workflow" },
  { name: "Slack", cat: "workflow" },
  { name: "Figma", cat: "workflow" },
  { name: "Cursor", cat: "workflow" },
  // Motion & media
  { name: "Higgsfield", cat: "media", weight: 2 },
  { name: "HyperFrames", cat: "media", weight: 2 },
  { name: "Remotion", cat: "media", weight: 2 },
  { name: "Three.js", cat: "media" },
  { name: "React Three Fiber", cat: "media" },
  { name: "Rapier", cat: "media" },
  { name: "Motion", cat: "media" },
  { name: "ElevenLabs", cat: "media" },
  { name: "FFmpeg", cat: "media" },
  { name: "Runway", cat: "media" },
  { name: "Midjourney", cat: "media" },
  // Testing
  { name: "Evalite", cat: "testing", weight: 2 },
  { name: "Playwright", cat: "testing", weight: 2 },
  { name: "Vitest", cat: "testing" },
  { name: "Jest", cat: "testing" },
  // Code
  { name: "TypeScript", cat: "code", weight: 3 },
  { name: "Node.js", cat: "code", weight: 2 },
  { name: "Bun", cat: "code" },
  { name: "npm", cat: "code" },
  { name: "Python", cat: "code", weight: 2 },
  { name: "React", cat: "code", weight: 2 },
  { name: "Next.js", cat: "code" },
  { name: "Astro", cat: "code" },
  { name: "Tailwind", cat: "code" },
  { name: "shadcn", cat: "code" },
  { name: "Zustand", cat: "code" },
  { name: "Expo", cat: "code" },
  { name: "NestJS", cat: "code" },
  { name: "Zod", cat: "code" },
  { name: "Scala", cat: "code" },
  { name: "Java", cat: "code" },
  { name: "ZIO", cat: "code" },
  // Cloud
  { name: "GCP", cat: "cloud", weight: 2 },
  { name: "AWS", cat: "cloud" },
  { name: "Azure", cat: "cloud" },
  { name: "Cloudflare", cat: "cloud", weight: 2 },
  { name: "Firebase", cat: "cloud", weight: 2 },
  { name: "Supabase", cat: "cloud" },
  { name: "Railway", cat: "cloud" },
  { name: "Vercel", cat: "cloud" },
  // Data
  { name: "Postgres", cat: "data", weight: 2 },
  { name: "BigQuery", cat: "data" },
  { name: "pgvector", cat: "data" },
  { name: "Pinecone", cat: "data" },
  { name: "Firestore", cat: "data" },
  { name: "Redis", cat: "data" },
  { name: "Kafka", cat: "data" },
  { name: "Cassandra", cat: "data" },
  { name: "RabbitMQ", cat: "data" },
  { name: "Pub/Sub", cat: "data" },
  { name: "Kinesis", cat: "data" },
  // DevOps
  { name: "Docker", cat: "devops", weight: 2 },
  { name: "Kubernetes", cat: "devops" },
  { name: "Terraform", cat: "devops" },
  { name: "GitHub Actions", cat: "devops" },
  { name: "CircleCI", cat: "devops" },
  { name: "Cloud Build", cat: "devops" },
  // Product
  { name: "PostHog", cat: "product", weight: 2 },
  { name: "Peec AI", cat: "product", weight: 2 },
  { name: "ManyChat", cat: "product" },
  { name: "Stripe", cat: "product" },
  { name: "Twilio", cat: "product" },
  { name: "Sentry", cat: "product" },
  { name: "Resend", cat: "product" },
];
