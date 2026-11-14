import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import type { SeekRequest } from "./ScenePlayer";

// The player and the scene are a separate chunk, fetched on the first click.
const ScenePlayer = lazy(() => import("./ScenePlayer"));

/** Page → player: jump to a frame (starts the player if needed). detail: { id, frame } */
export const SEEK_EVENT = "approach:seek";
/** Player → page: the step being shown changed. detail: { id, step } */
export const STEP_EVENT = "approach:step";

/**
 * Poster with a Play button; the live Remotion animation loads only when pressed.
 */
export default function ApproachAnimation({ id, label = "Play animation", seconds }: { id: string; label?: string; seconds: number }) {
  const [seek, setSeek] = useState<SeekRequest | null>(null);

  useEffect(() => {
    const onSeek = (e: Event) => {
      const d = (e as CustomEvent<{ id: string; frame: number }>).detail;
      if (d.id === id) setSeek((s) => ({ frame: d.frame, n: (s?.n ?? 0) + 1 }));
    };
    window.addEventListener(SEEK_EVENT, onSeek);
    return () => window.removeEventListener(SEEK_EVENT, onSeek);
  }, [id]);

  const onStep = useCallback((step: number) => window.dispatchEvent(new CustomEvent(STEP_EVENT, { detail: { id, step } })), [id]);

  const poster = (loading: boolean) => (
    <button
      type="button"
      onClick={() => setSeek({ frame: 0, n: 0 })}
      disabled={loading}
      className="group relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/15 transition hover:border-white/30"
      style={{
        background: "#140a18",
        backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1.1px, transparent 1.2px)",
        backgroundSize: "10px 10px",
      }}
    >
      <span className="flex flex-col items-center gap-3">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-[#F97316] text-[#1C0E21] shadow-[0_0_40px_rgba(249,115,22,0.35)] transition group-hover:scale-105">
          {loading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#1C0E21] border-t-transparent" />
          ) : (
            <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </span>
        <span className="font-mono text-xs uppercase tracking-widest text-white/60">
          {loading ? "loading…" : `${label} · ${seconds}s · sound on`}
        </span>
      </span>
    </button>
  );

  if (!seek) return poster(false);
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <Suspense fallback={poster(true)}>
        <ScenePlayer seek={seek} onStep={onStep} />
      </Suspense>
    </div>
  );
}
