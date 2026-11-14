import { lazy, Suspense, useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { SeekRequest } from "./ScenePlayer";

// Each film (player + scene) is a separate chunk, fetched on the first click. Keyed by card id.
const PLAYERS = {
  "dev-pipeline": lazy(() => import("./PipelinePlayer")),
  automation: lazy(() => import("./AutomationPlayer")),
  evals: lazy(() => import("./EvalsPlayer")),
};

/** Page → player: jump to a frame (starts the player if needed). detail: { id, frame } */
export const SEEK_EVENT = "approach:seek";
/** Player → page: the step being shown changed. detail: { id, step } */
export const STEP_EVENT = "approach:step";

/**
 * Poster (the steps as text, and a Play button); the live Remotion animation loads only when pressed.
 */
export default function ApproachAnimation({ id, label = "Play animation", seconds, steps = [] }: { id: string; label?: string; seconds: number; steps?: string[] }) {
  const [seek, setSeek] = useState<SeekRequest | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onSeek = (e: Event) => {
      const d = (e as CustomEvent<{ id: string; frame: number }>).detail;
      if (d.id === id) setSeek((s) => ({ frame: d.frame, n: (s?.n ?? 0) + 1 }));
    };
    window.addEventListener(SEEK_EVENT, onSeek);
    return () => window.removeEventListener(SEEK_EVENT, onSeek);
  }, [id]);

  const onStep = useCallback((step: number) => window.dispatchEvent(new CustomEvent(STEP_EVENT, { detail: { id, step } })), [id]);

  // Before playing: the steps as text on the left, Play on the right.
  const poster = (loading: boolean) => (
    <div
      className="relative grid w-full items-center gap-6 overflow-hidden rounded-2xl border border-dashed border-white/15 p-5 sm:p-8 md:aspect-[16/10] md:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]"
      style={{
        background: "#140a18",
        backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1.1px, transparent 1.2px)",
        backgroundSize: "10px 10px",
      }}
    >
      {steps.length > 0 && (
        <ol className="space-y-4 font-mono text-[13px] leading-relaxed text-white/80 sm:text-[14px]">
          {steps.map((text, k) => (
            <li key={k} className="flex gap-3">
              <span className="w-7 shrink-0 text-[#F97316]">{String(k + 1).padStart(2, "0")}</span>
              <span>{text}</span>
            </li>
          ))}
        </ol>
      )}
      <button
        type="button"
        onClick={() => setSeek({ frame: 0, n: 0 })}
        disabled={loading}
        className="group flex flex-col items-center gap-3 justify-self-center py-4"
      >
        <span className="grid h-20 w-20 place-items-center rounded-full bg-[#F97316] text-[#1C0E21] shadow-[0_0_40px_rgba(249,115,22,0.35)] transition group-hover:scale-105">
          {loading ? (
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#1C0E21] border-t-transparent" />
          ) : (
            <svg viewBox="0 0 24 24" className="ml-1 h-8 w-8" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </span>
        <span className="text-center font-mono text-xs uppercase tracking-widest text-white/60">
          {loading ? "loading…" : label}
          {!loading && (
            <>
              <br />
              {seconds}s · sound on
            </>
          )}
        </span>
      </button>
    </div>
  );

  const ScenePlayer = PLAYERS[id as keyof typeof PLAYERS];
  if (!seek || !ScenePlayer) return poster(false);
  return (
    <div ref={box} className="scroll-my-4 overflow-hidden rounded-2xl border border-white/10">
      <Suspense fallback={poster(true)}>
        <ScenePlayer seek={seek} onStep={onStep} />
        <KeepInView target={box} />
      </Suspense>
    </div>
  );
}

/**
 * On phones the poster (steps stacked over the Play button) is much taller than the 16:10 player,
 * so swapping one for the other leaves the viewport below the film. Mounts with the player and
 * brings it back into view if it ended up off screen.
 */
function KeepInView({ target }: { target: RefObject<HTMLDivElement | null> }) {
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const el = target.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) el.scrollIntoView({ block: "center", behavior: "smooth" });
    });
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return null;
}
