// Timeline of the "Business Automation" animation. Kept apart from the scene so
// the page can list the steps without pulling Remotion into the main bundle.
import voiceover from "./automation-voiceover.json";
import { makeTimeline } from "./timeline";

/**
 * Scene-time frame each narrated part starts on; the last value is the end.
 * the swarm · support · summarizer · delivery → oracle · notes → oracle · competitors + logs · orchestrator · my dashboard · punchline
 */
const CUTS = [0, 150, 280, 400, 540, 680, 840, 1000, 1180, 1290];
const T = makeTimeline({ cuts: CUTS, lines: voiceover.lines, audioDir: "/audio/automation" });

export const AUTOMATION = T.meta;
export const AUTOMATION_AUDIO = T.audio;
export const toSceneTime = T.toSceneTime;
export const SCENE_END = CUTS[CUTS.length - 1];

/** `at` is the scene-time frame the step starts on; `tools` are shown on screen with it. */
export const AUTOMATION_STEPS: { at: number; text: string; tools: string[] }[] = [
  { at: 0, text: "In my setup, a swarm of agents does real, everyday work.", tools: [] },
  { at: 150, text: "Support agents answer users in the chat.", tools: [] },
  { at: 280, text: "An agent sums up what users ask for most.", tools: [] },
  { at: 400, text: "An agent knows what was shipped and updates the knowledge base.", tools: ["Graphify"] },
  { at: 540, text: "Another reads the meeting notes into the knowledge base.", tools: ["Graphify"] },
  { at: 680, text: "Scheduled jobs watch the competitors and the logs.", tools: [] },
  { at: 840, text: "All of them run through one orchestrator.", tools: ["BB orchestrator"] },
  { at: 1000, text: "I only look at the summaries and the charts.", tools: [] },
  { at: 1180, text: "Many agents. One orchestrator.", tools: ["BB orchestrator"] },
];

/** Which step a scene-time frame belongs to. */
export function automationStepAt(sceneTime: number): number {
  let idx = 0;
  AUTOMATION_STEPS.forEach((s, i) => {
    if (sceneTime >= s.at) idx = i;
  });
  return idx;
}
