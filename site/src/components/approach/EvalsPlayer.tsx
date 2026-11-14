// Player chunk for "Agentic Evals".
import { EvalsScene } from "./EvalsScene";
import { EVALS, evalsStepAt, toSceneTime } from "./evalsSteps";
import ScenePlayer, { type SceneSpec, type ScenePlayerProps } from "./ScenePlayer";

const SPEC: SceneSpec = { component: EvalsScene, meta: EVALS, toSceneTime, stepAt: evalsStepAt };

export default function EvalsPlayer(props: ScenePlayerProps) {
  return <ScenePlayer spec={SPEC} {...props} />;
}
