// Lab preview: one scene alone, full width.
// `?scene=automation|evals` picks the film (default: the pipeline), `?f=640` opens paused on that frame.
import AutomationPlayer from "./AutomationPlayer";
import EvalsPlayer from "./EvalsPlayer";
import PipelinePlayer from "./PipelinePlayer";

const PLAYERS = { automation: AutomationPlayer, evals: EvalsPlayer };

export default function PipelinePreview() {
  const q = new URLSearchParams(window.location.search);
  const f = q.get("f");
  const Player = PLAYERS[q.get("scene") as keyof typeof PLAYERS] ?? PipelinePlayer;
  return <Player seek={{ frame: f ? Number(f) : 0, n: 0 }} autoPlay={f === null} />;
}
