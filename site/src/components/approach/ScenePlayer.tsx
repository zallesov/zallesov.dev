// Loaded only after the visitor presses Play: pulls in @remotion/player and the scene.
import { Player, type PlayerRef } from "@remotion/player";
import { useEffect, useRef, type FC } from "react";
import type { SceneMeta } from "./timeline";

export interface SeekRequest {
  frame: number;
  /** changes on every request, so the same frame can be asked for twice */
  n: number;
}

/** One animation: the composition and its timing. */
export interface SceneSpec {
  component: FC;
  meta: SceneMeta;
  toSceneTime: (frame: number) => number;
  stepAt: (sceneTime: number) => number;
}

export interface ScenePlayerProps {
  seek?: SeekRequest;
  autoPlay?: boolean;
  onStep?: (step: number) => void;
}

export default function ScenePlayer({ spec, seek, autoPlay = true, onStep }: ScenePlayerProps & { spec: SceneSpec }) {
  const ref = useRef<PlayerRef>(null);
  const first = useRef(seek?.frame ?? 0);

  // report the current step while playing
  useEffect(() => {
    const player = ref.current;
    if (!player || !onStep) return;
    let last = -1;
    const report = (frame: number) => {
      const step = spec.stepAt(spec.toSceneTime(frame));
      if (step !== last) onStep((last = step));
    };
    report(first.current);
    const onFrame = (e: { detail: { frame: number } }) => report(e.detail.frame);
    player.addEventListener("frameupdate", onFrame);
    return () => player.removeEventListener("frameupdate", onFrame);
  }, [onStep, spec]);

  // jump when a step is clicked
  useEffect(() => {
    if (!seek || seek.n === 0) return;
    ref.current?.seekTo(seek.frame);
    if (autoPlay) ref.current?.play();
  }, [seek?.n]);

  const { meta } = spec;
  return (
    <Player
      ref={ref}
      component={spec.component}
      durationInFrames={meta.durationInFrames}
      fps={meta.fps}
      compositionWidth={meta.width}
      compositionHeight={meta.height}
      style={{ width: "100%", aspectRatio: `${meta.width} / ${meta.height}` }}
      initialFrame={first.current}
      autoPlay={autoPlay}
      controls
      showVolumeControls
      numberOfSharedAudioTags={2}
      allowFullscreen
      clickToPlay
      acknowledgeRemotionLicense
    />
  );
}
