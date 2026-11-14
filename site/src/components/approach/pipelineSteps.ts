// Timeline of the "Development Pipeline" animation. Kept apart from the scene so
// the page can list the steps without pulling Remotion into the main bundle.
//
// The scene is written in "scene time" (frames of the silent cut). Each scene is
// then stretched to fit its narration line, so real frames map to scene time
// through `toSceneTime`.
import voiceover from "./voiceover.json";

const FPS = 30;
/** Scene-time frame each narrated scene starts on; the last value is the end. */
const CUTS = [0, 150, 300, 480, 630, 920, 1022, 1128, 1240, 1300, 1410, 1500];
/** Silence left after a line before the next scene starts, in seconds. */
const PAD = 0.5;
/** Frames into a scene before its line starts. */
const LEAD = 6;

/** Real frame each scene starts on. */
const STARTS: number[] = [0];
voiceover.lines.forEach((line, i) => {
  const own = CUTS[i + 1] - CUTS[i];
  const spoken = Math.ceil((((line as { seconds?: number }).seconds ?? 0) + PAD) * FPS) + LEAD;
  STARTS.push(STARTS[i] + Math.max(own, spoken));
});

export const PIPELINE = { width: 1280, height: 800, fps: FPS, durationInFrames: STARTS[STARTS.length - 1] } as const;

/** Narration clips: where each one starts, in real frames. */
export const PIPELINE_AUDIO = voiceover.lines.map((line, i) => ({
  src: `/audio/pipeline/${line.id}.mp3`,
  from: STARTS[i] + LEAD,
  // bounded, so a finished clip unmounts and frees its shared audio tag
  frames: Math.ceil((((line as { seconds?: number }).seconds ?? 0) + 0.3) * FPS),
}));

/** Real frame → scene time. */
export function toSceneTime(frame: number): number {
  let i = 0;
  while (i < STARTS.length - 2 && frame >= STARTS[i + 1]) i++;
  const t = Math.min(1, Math.max(0, (frame - STARTS[i]) / (STARTS[i + 1] - STARTS[i])));
  return CUTS[i] + t * (CUTS[i + 1] - CUTS[i]);
}

/** `at` is the scene-time frame the step starts on; `tools` and `models` are shown on screen with it. */
export const PIPELINE_STEPS: { at: number; text: string; tools: string[]; models: string[] }[] = [
  { at: 0, text: "We talk through every aspect of the problem with AI.", tools: ["ChatGPT", "Grok"], models: [] },
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
