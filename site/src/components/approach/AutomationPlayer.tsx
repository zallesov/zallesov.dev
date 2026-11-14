// Player chunk for "Business Automation".
import { AutomationScene } from "./AutomationScene";
import { AUTOMATION, automationStepAt, toSceneTime } from "./automationSteps";
import ScenePlayer, { type SceneSpec, type ScenePlayerProps } from "./ScenePlayer";

const SPEC: SceneSpec = { component: AutomationScene, meta: AUTOMATION, toSceneTime, stepAt: automationStepAt };

export default function AutomationPlayer(props: ScenePlayerProps) {
  return <ScenePlayer spec={SPEC} {...props} />;
}
