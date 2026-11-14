// Lab preview: the scene alone, full width. `?f=640` opens paused on that frame.
import ScenePlayer from "./ScenePlayer";

export default function PipelinePreview() {
  const f = new URLSearchParams(window.location.search).get("f");
  return <ScenePlayer seek={{ frame: f ? Number(f) : 0, n: 0 }} autoPlay={f === null} />;
}
