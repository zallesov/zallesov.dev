// Timeline of the "Agentic Evals" animation. Kept apart from the scene so
// the page can list the steps without pulling Remotion into the main bundle.
import voiceover from "./evals-voiceover.json";
import { makeTimeline } from "./timeline";

/**
 * Scene-time frame each narrated part starts on; the last value is the end.
 * looks good? · dataset · scoring · models × prompts · toolsets · regression · production · leaderboard · punchline
 */
const CUTS = [0, 140, 280, 440, 580, 700, 860, 990, 1110, 1220];
const T = makeTimeline({ cuts: CUTS, lines: voiceover.lines, audioDir: "/audio/evals" });

export const EVALS = T.meta;
export const EVALS_AUDIO = T.audio;
export const toSceneTime = T.toSceneTime;
export const SCENE_END = CUTS[CUTS.length - 1];

/** `at` is the scene-time frame the step starts on; `tools` are shown on screen with it. */
export const EVALS_STEPS: { at: number; text: string; tools: string[] }[] = [
  { at: 0, text: "Agents need tests. Evals are tests for agents.", tools: [] },
  { at: 140, text: "Real conversations from LangSmith become a dataset.", tools: ["LangSmith"] },
  { at: 280, text: "Every case is scored: correct, grounded, right tool.", tools: ["Evalite"] },
  { at: 440, text: "Same cases, different models and prompts.", tools: ["Evalite"] },
  { at: 580, text: "And different sets of tools.", tools: ["Evalite"] },
  { at: 700, text: "A prompt change breaks something? Evals catch it first.", tools: ["Evalite"] },
  { at: 860, text: "In production, LangSmith keeps scoring real traffic.", tools: ["LangSmith"] },
  { at: 990, text: "The cheapest model that passes wins.", tools: [] },
  { at: 1110, text: "If you don't measure it, you can't improve it.", tools: [] },
];

/** Which step a scene-time frame belongs to. */
export function evalsStepAt(sceneTime: number): number {
  let idx = 0;
  EVALS_STEPS.forEach((s, i) => {
    if (sceneTime >= s.at) idx = i;
  });
  return idx;
}
