// Loaded only after the visitor presses Play: pulls in @remotion/player and the scene.
import { Player, type PlayerRef } from "@remotion/player";
import { useEffect, useRef } from "react";
import { DevPipelineScene } from "./DevPipelineScene";
import { PIPELINE, pipelineStepAt, toSceneTime } from "./pipelineSteps";

export interface SeekRequest {
  frame: number;
  /** changes on every request, so the same frame can be asked for twice */
  n: number;
}

export default function ScenePlayer({ seek, autoPlay = true, onStep }: { seek?: SeekRequest; autoPlay?: boolean; onStep?: (step: number) => void }) {
  const ref = useRef<PlayerRef>(null);
  const first = useRef(seek?.frame ?? 0);

  // report the current step while playing
  useEffect(() => {
    const player = ref.current;
    if (!player || !onStep) return;
    let last = -1;
    const report = (frame: number) => {
      const step = pipelineStepAt(toSceneTime(frame));
      if (step !== last) onStep((last = step));
    };
    report(first.current);
    const onFrame = (e: { detail: { frame: number } }) => report(e.detail.frame);
    player.addEventListener("frameupdate", onFrame);
    return () => player.removeEventListener("frameupdate", onFrame);
  }, [onStep]);

  // jump when a step is clicked
  useEffect(() => {
    if (!seek || seek.n === 0) return;
    ref.current?.seekTo(seek.frame);
    if (autoPlay) ref.current?.play();
  }, [seek?.n]);

  return (
    <Player
      ref={ref}
      component={DevPipelineScene}
      durationInFrames={PIPELINE.durationInFrames}
      fps={PIPELINE.fps}
      compositionWidth={PIPELINE.width}
      compositionHeight={PIPELINE.height}
      style={{ width: "100%", aspectRatio: `${PIPELINE.width} / ${PIPELINE.height}` }}
      initialFrame={first.current}
      autoPlay={autoPlay}
      loop
      controls
      showVolumeControls
      numberOfSharedAudioTags={2}
      allowFullscreen
      clickToPlay
      acknowledgeRemotionLicense
    />
  );
}
