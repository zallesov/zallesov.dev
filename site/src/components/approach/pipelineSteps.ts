// Timeline of the "Development Pipeline" animation. Kept apart from the scene so
// the page can list the steps without pulling Remotion into the main bundle.
import voiceover from "./voiceover.json";
import { makeTimeline } from "./timeline";

/** Scene-time frame each narrated part starts on; the last value is the end. */
const CUTS = [0, 150, 300, 480, 630, 920, 1022, 1128, 1240, 1300, 1410, 1500];
const T = makeTimeline({ cuts: CUTS, lines: voiceover.lines, audioDir: "/audio/pipeline" });

export const PIPELINE = T.meta;
export const PIPELINE_AUDIO = T.audio;
export const toSceneTime = T.toSceneTime;

/** `at` is the scene-time frame the step starts on; `tools` and `models` are shown on screen with it. */
export const PIPELINE_STEPS: { at: number; text: string; tools: string[]; models: string[] }[] = [
  { at: 0, text: "It starts with a conversation: AI and I take the problem apart.", tools: ["ChatGPT", "Grok"], models: [] },
  { at: 150, text: "The tickets are assigned to an agent.", tools: ["GitHub MCP"], models: [] },
  { at: 300, text: "An orchestrator agent picks them up and hands them out to developer agents.", tools: ["BB orchestrator", "compound engineering"], models: ["Fable", "Opus"] },
  { at: 630, text: "Developers come back to the orchestrator for decisions. When a decision is mine, it texts me.", tools: ["BB orchestrator"], models: ["Fable"] },
  { at: 920, text: "Every agent reads and updates the project-wide documentation.", tools: ["Graphify"], models: [] },
  { at: 1022, text: "A different LLM reviews the code.", tools: ["compound engineering"], models: ["Codex"] },
  { at: 1128, text: "The developer waits for green CI and fixes errors and conflicts.", tools: ["GitHub Actions"], models: ["Opus"] },
  { at: 1240, text: "The PR goes to staging for human review.", tools: ["GitHub Actions"], models: [] },
];

/** The closing beat returns to the documentation step. */
const EPILOGUE = { at: 1410, step: 4 };
/** Scene-time length of the whole thing. */
export const SCENE_END = CUTS[CUTS.length - 1];

/** Which step a scene-time frame belongs to. */
export function pipelineStepAt(sceneTime: number): number {
  if (sceneTime >= EPILOGUE.at) return EPILOGUE.step;
  let idx = 0;
  PIPELINE_STEPS.forEach((s, i) => {
    if (sceneTime >= s.at) idx = i;
  });
  return idx;
}
