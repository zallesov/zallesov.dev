// Narration-driven timing shared by the "How I work" animations.
//
// A scene is written in "scene time" (frames of the silent cut). Each narrated part is
// then stretched to fit its line, so real frames map to scene time through `toSceneTime`.
// Kept free of Remotion, so the page can import step lists and lengths cheaply.

export interface VoiceLine {
  id: string;
  text: string;
  /** Length of the generated clip; written by scripts/voiceover.mjs. */
  seconds?: number;
}

export interface SceneMeta {
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
}

export function makeTimeline({
  cuts,
  lines,
  audioDir,
  fps = 30,
  pad = 0.5,
  lead = 6,
  width = 1280,
  height = 800,
}: {
  /** Scene-time frame each narrated part starts on; the last value is the end. One more than `lines`. */
  cuts: number[];
  lines: VoiceLine[];
  /** Public folder of the clips, e.g. "/audio/pipeline". */
  audioDir: string;
  fps?: number;
  /** Silence left after a line before the next part starts, in seconds. */
  pad?: number;
  /** Frames into a part before its line starts. */
  lead?: number;
  width?: number;
  height?: number;
}) {
  /** Real frame each part starts on. */
  const starts: number[] = [0];
  lines.forEach((line, i) => {
    const own = cuts[i + 1] - cuts[i];
    const spoken = Math.ceil(((line.seconds ?? 0) + pad) * fps) + lead;
    starts.push(starts[i] + Math.max(own, spoken));
  });

  const meta: SceneMeta = { width, height, fps, durationInFrames: starts[starts.length - 1] };

  /** Narration clips: where each one starts, in real frames. Lines not generated yet are silent. */
  const audio = lines.flatMap((line, i) =>
    line.seconds
      ? [
          {
            src: `${audioDir}/${line.id}.mp3`,
            from: starts[i] + lead,
            // bounded, so a finished clip unmounts and frees its shared audio tag
            frames: Math.ceil((line.seconds + 0.3) * fps),
          },
        ]
      : [],
  );

  /** Real frame → scene time. */
  function toSceneTime(frame: number): number {
    let i = 0;
    while (i < starts.length - 2 && frame >= starts[i + 1]) i++;
    const t = Math.min(1, Math.max(0, (frame - starts[i]) / (starts[i + 1] - starts[i])));
    return cuts[i] + t * (cuts[i + 1] - cuts[i]);
  }

  return { meta, audio, toSceneTime };
}
