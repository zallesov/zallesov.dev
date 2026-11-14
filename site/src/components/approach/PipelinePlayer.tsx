// Player chunk for "Development Pipeline".
import { DevPipelineScene } from "./DevPipelineScene";
import { PIPELINE, pipelineStepAt, toSceneTime } from "./pipelineSteps";
import ScenePlayer, { type SceneSpec, type ScenePlayerProps } from "./ScenePlayer";

const SPEC: SceneSpec = { component: DevPipelineScene, meta: PIPELINE, toSceneTime, stepAt: pipelineStepAt };

export default function PipelinePlayer(props: ScenePlayerProps) {
  return <ScenePlayer spec={SPEC} {...props} />;
}
