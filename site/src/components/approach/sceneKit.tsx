// Shared parts of the "How I work" animations: palette, timing maths and the small
// SVG pieces (unreadable text, chips, bubbles, windows, the human, stack tags).
// Every scene is a pure function of the frame, so everything here takes `f` or plain props.
import type { ReactNode } from "react";
import { Easing, interpolate } from "remotion";

export const BG = "#140a18";
export const PANEL = "#1d1024";
export const PANEL2 = "#26142e";
export const ORANGE = "#F97316";
export const PINK = "#FFDDFF";
export const RED = "#F43F5E";
export const GREEN = "#22C55E";
export const PURPLE = "#A78BFA";
export const SKY = "#7DD3FC";
export const DIM = "rgba(255,221,255,0.5)";
export const FAINT = "rgba(255,221,255,0.18)";
export const MONO = "'JetBrains Mono Variable', ui-monospace, monospace";
export const DOTS = "'Doto Variable', ui-monospace, monospace";
export const HAND = "'Bradley Hand', 'Segoe Script', 'Comic Sans MS', cursive";

// ---------- maths ----------
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const lin = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], clamp);
export const io = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
export const out = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
/** 0..1: rises at `a`, holds, falls after `b`. */
export const bump = (f: number, a: number, b: number, edge = 6) => interpolate(f, [a - edge, a, b, b + edge], [0, 1, 1, 0], clamp);
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
/** Deterministic 0..1 noise. */
export const rnd = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 4.1414) * 43758.5453;
  return x - Math.floor(x);
};

export type P = { x: number; y: number };

/** Camera from keyframes `[frame, centre x, centre y, zoom]`, eased between them. */
export function makeCamera(keys: [number, number, number, number][]) {
  return (f: number) => {
    let i = 0;
    while (i < keys.length - 2 && f >= keys[i + 1][0]) i++;
    const a = keys[i];
    const b = keys[i + 1];
    const t = io(f, a[0], b[0]);
    // zoom in log space so a pull-back does not rush at the start
    return { x: mix(a[1], b[1], t), y: mix(a[2], b[2], t), z: Math.exp(mix(Math.log(a[3]), Math.log(b[3]), t)) };
  };
}

/** Spinner glyphs for "working…" states. */
export const SPIN = ["·", "✢", "✳", "✶", "✻", "✽"];

/** Gradients, patterns and the glow filter the shared parts refer to. */
export function SceneDefs() {
  return (
    <>
      <pattern id="dp-dots" width="10" height="10" patternUnits="userSpaceOnUse">
        <circle cx="5" cy="5" r="1.1" fill="rgba(255,255,255,0.05)" />
      </pattern>
      <filter id="dp-blur" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="10" />
      </filter>
      <radialGradient id="dp-orb" cx="35%" cy="30%" r="80%">
        <stop offset="0%" stopColor="#FFD9B0" />
        <stop offset="55%" stopColor={ORANGE} />
        <stop offset="100%" stopColor="#B4470B" />
      </radialGradient>
      <linearGradient id="dp-hoodie" x1="0" y1="0" x2="1" y2="0.3">
        <stop offset="0%" stopColor="#1f1027" />
        <stop offset="65%" stopColor="#2e1838" />
        <stop offset="100%" stopColor="#3e2249" />
      </linearGradient>
      <linearGradient id="dp-hud" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={BG} stopOpacity={0.96} />
        <stop offset="70%" stopColor={BG} stopOpacity={0.8} />
        <stop offset="100%" stopColor={BG} stopOpacity={0} />
      </linearGradient>
    </>
  );
}

// ---------- small parts ----------

/** Lines of "text" you can see but cannot read. */
export function Greek({ x, y, w, rows, seed, color = PINK, o = 0.45, h = 5, gap = 12 }: { x: number; y: number; w: number; rows: number; seed: number; color?: string; o?: number; h?: number; gap?: number }) {
  const els: ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    const maxW = r === rows - 1 && rows > 1 ? w * (0.35 + 0.45 * rnd(seed + r)) : w;
    let cx = 0;
    let k = 0;
    while (cx < maxW - 8) {
      const ww = Math.min(8 + rnd(seed * 7.3 + r * 31 + k) * 30, maxW - cx);
      els.push(<rect key={`${r}-${k}`} x={x + cx} y={y + r * gap} width={ww} height={h} rx={h / 2} fill={color} opacity={o} />);
      cx += ww + 6;
      k++;
    }
  }
  return <>{els}</>;
}

/** Position on an arc from `a` to `b` while f runs s..e. */
export function fly(f: number, s: number, e: number, a: P, b: P, lift = 70) {
  const t = io(f, s, e);
  return {
    on: f >= s && f <= e,
    t,
    x: mix(a.x, b.x, t),
    y: mix(a.y, b.y, t) - Math.sin(Math.PI * t) * lift,
    // pop in, shrink into the target
    s: Math.min(1, t * 6) * (t > 0.88 ? 1 - (t - 0.88) * 5 : 1),
  };
}

export function Chip({ x, y, text, color = ORANGE, s = 1, o = 1 }: { x: number; y: number; text: string; color?: string; s?: number; o?: number }) {
  const w = text.length * 7.9 + 26;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <rect x={-w / 2} y={-16} width={w} height={32} rx={16} fill={PANEL2} stroke={color} strokeWidth={1.5} />
      <text x={0} y={4.5} textAnchor="middle" fill={color} style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600 }}>
        {text}
      </text>
    </g>
  );
}

/** A chip that travels between two points. */
export function FlyChip({ f, s, e, a, b, text, color, lift, scale = 1 }: { f: number; s: number; e: number; a: P; b: P; text: string; color?: string; lift?: number; scale?: number }) {
  const p = fly(f, s, e, a, b, lift);
  if (!p.on) return null;
  return <Chip x={p.x} y={p.y} s={p.s * scale} text={text} color={color} />;
}

/** Speech bubble: unreadable words, optionally ending in a big ? or !. */
export function Bubble({ x, y, s = 1, o = 1, mark, seed, w = 150, rows = 2, tail = "left" }: { x: number; y: number; s?: number; o?: number; mark?: "?" | "!"; seed: number; w?: number; rows?: number; tail?: "left" | "right" | "none" }) {
  const h = 30 + rows * 12;
  const color = mark === "!" ? GREEN : mark === "?" ? ORANGE : PINK;
  const tx = tail === "left" ? -w / 2 + 26 : w / 2 - 26;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      {tail !== "none" && <path d={`M ${tx - 9} ${h / 2 - 1} L ${tx} ${h / 2 + 14} L ${tx + 9} ${h / 2 - 1} Z`} fill={PANEL2} stroke={color} strokeWidth={1.5} strokeLinejoin="round" />}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={16} fill={PANEL2} stroke={color} strokeWidth={1.5} />
      {tail !== "none" && <rect x={tx - 8} y={h / 2 - 3} width={16} height={4} fill={PANEL2} />}
      <Greek x={-w / 2 + 16} y={-h / 2 + 16} w={w - 32 - (mark ? 30 : 0)} rows={rows} seed={seed} />
      {mark && (
        <text x={w / 2 - 24} y={13} textAnchor="middle" fill={color} style={{ fontFamily: MONO, fontSize: 38, fontWeight: 800 }}>
          {mark}
        </text>
      )}
    </g>
  );
}

export function FlyBubble({ f, s, e, a, b, mark, seed, lift = 90 }: { f: number; s: number; e: number; a: P; b: P; mark: "?" | "!"; seed: number; lift?: number }) {
  const p = fly(f, s, e, a, b, lift);
  if (!p.on) return null;
  return <Bubble x={p.x} y={p.y} s={p.s} mark={mark} seed={seed} tail="none" />;
}

/** Window chrome shared by terminals, panels and browsers. */
export function Win({ x, y, w, h, title, hot = 0, children, badge, o = 1 }: { x: number; y: number; w: number; h: number; title: string; hot?: number; children?: ReactNode; badge?: string; o?: number }) {
  return (
    <g opacity={o}>
      {hot > 0.01 && <rect x={x - 8} y={y - 8} width={w + 16} height={h + 16} rx={22} fill={ORANGE} opacity={0.16 * hot} filter="url(#dp-blur)" />}
      <rect x={x} y={y} width={w} height={h} rx={14} fill={PANEL} stroke={hot > 0.01 ? ORANGE : FAINT} strokeOpacity={hot > 0.01 ? 0.3 + 0.7 * hot : 1} strokeWidth={1.5} />
      <line x1={x} y1={y + 34} x2={x + w} y2={y + 34} stroke={FAINT} />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={x + 18 + i * 16} cy={y + 17} r={4.5} fill={["#F43F5E", "#F59E0B", "#22C55E"][i]} opacity={0.75} />
      ))}
      <text x={x + 70} y={y + 22} fill={DIM} style={{ fontFamily: MONO, fontSize: 13 }}>
        {title}
      </text>
      {badge && (
        <g>
          <circle cx={x + w - 22} cy={y + 17} r={11} fill={ORANGE} />
          <text x={x + w - 22} y={y + 21.5} textAnchor="middle" fill={BG} style={{ fontFamily: MONO, fontSize: 13, fontWeight: 800 }}>
            {badge}
          </text>
        </g>
      )}
      {children}
    </g>
  );
}

/**
 * The human: a bust in three-quarter view, facing right (towards the phone or the laptop).
 * `glow` is the screen light falling on the face, 0..1.
 */
export function Human({ x, y, s = 1, tilt = 0, glow = 0.5 }: { x: number; y: number; s?: number; tilt?: number; glow?: number }) {
  const SKIN = "#4a2d55";
  const SKIN_LIT = "#6b4277";
  const HAIR = "#2a1530";
  const LINE = "rgba(255,221,255,0.35)";
  // front of the face: forehead, brow, nose, lips, chin, jaw
  const FACE = "M 30 -78 C 42 -68 48 -54 47 -40 C 47 -34 49 -30 54 -20 C 57 -14 54 -11 48 -10 C 49 -6 49 -3 46 -1 C 48 2 47 6 44 8 C 44 14 40 20 32 24 C 24 28 16 30 10 30";
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${tilt} 0 150)`}>
      {/* hoodie */}
      <path d="M -132 172 C -132 96 -102 66 -52 54 L 50 54 C 100 66 132 96 132 172 Z" fill="url(#dp-hoodie)" stroke={LINE} strokeWidth={1.5} />
      {/* hood lying round the neck */}
      <path d="M -62 58 C -66 30 -40 18 -8 20 C 30 20 60 30 60 58 C 40 72 -40 74 -62 58 Z" fill="#331b3e" stroke={LINE} strokeWidth={1.5} />
      {/* neck */}
      <path d="M -14 8 L -16 50 Q 4 62 24 48 L 22 18 Z" fill={SKIN} />
      <path d="M -16 34 Q 4 44 24 34 L 24 48 Q 4 60 -16 50 Z" fill="#000" opacity={0.25} />
      {/* drawstrings */}
      <path d="M -14 66 C -16 90 -12 108 -14 124" fill="none" stroke={PINK} strokeOpacity={0.45} strokeWidth={2} strokeLinecap="round" />
      <path d="M 18 66 C 20 88 16 104 19 118" fill="none" stroke={PINK} strokeOpacity={0.45} strokeWidth={2} strokeLinecap="round" />
      <rect x={-17} y={122} width={6} height={10} rx={2} fill={PINK} opacity={0.5} />
      <rect x={16} y={116} width={6} height={10} rx={2} fill={PINK} opacity={0.5} />
      {/* pocket seam and shoulder seams */}
      <path d="M -70 150 Q 0 136 70 150" fill="none" stroke={LINE} strokeOpacity={0.5} strokeWidth={1.2} />
      <path d="M -96 84 Q -88 120 -92 172 M 96 84 Q 88 120 92 172" fill="none" stroke={LINE} strokeOpacity={0.4} strokeWidth={1.2} />

      {/* head */}
      <path d={`M -38 -40 C -46 -80 -10 -98 14 -94 C 22 -92 28 -86 30 -78 ${FACE.slice(FACE.indexOf("C"))} C 0 30 -14 22 -22 10 C -34 -4 -36 -20 -38 -40 Z`} fill={SKIN} stroke={LINE} strokeWidth={1.5} />
      {/* screen light on the face */}
      <path d={`${FACE} C 26 22 34 4 34 -12 C 34 -40 30 -62 30 -78 Z`} fill={SKIN_LIT} opacity={0.35 + 0.65 * glow} />
      <path d={FACE} fill="none" stroke={ORANGE} strokeWidth={2} strokeLinecap="round" opacity={0.25 + 0.6 * glow} />
      {/* ear */}
      <path d="M -10 -36 C -22 -42 -28 -26 -22 -14 C -18 -6 -10 -8 -8 -14" fill={SKIN} stroke={LINE} strokeWidth={1.5} />
      <path d="M -14 -30 C -20 -28 -20 -18 -14 -16" fill="none" stroke={LINE} strokeWidth={1.2} />
      {/* eye, brow, mouth */}
      <path d="M 26 -46 Q 34 -52 42 -47" fill="none" stroke={HAIR} strokeWidth={3.5} strokeLinecap="round" />
      <path d="M 30 -37 Q 35 -40 40 -37" fill="none" stroke={PINK} strokeOpacity={0.8} strokeWidth={2} strokeLinecap="round" />
      <circle cx={36} cy={-37} r={2.2} fill={PINK} opacity={0.9} />
      <path d="M 36 3 Q 41 4 44 2" fill="none" stroke={PINK} strokeOpacity={0.45} strokeWidth={1.6} strokeLinecap="round" />
      {/* stubble along the jaw */}
      <path d="M -18 6 C -6 24 14 30 32 22 C 40 16 44 10 44 6 C 36 16 20 22 4 18 C -6 16 -14 12 -18 6 Z" fill="#000" opacity={0.18} />
      {/* hair: volume on top, swept forward, short at the back */}
      <path d="M -40 -38 C -52 -70 -36 -104 2 -108 C 30 -110 52 -96 54 -76 C 56 -66 50 -60 46 -62 C 40 -74 30 -74 20 -70 C 4 -66 -8 -72 -14 -62 C -20 -52 -18 -42 -24 -34 C -30 -28 -36 -30 -40 -38 Z" fill={HAIR} stroke={LINE} strokeWidth={1.2} />
      <path d="M -24 -92 C -6 -100 22 -100 40 -86 M -30 -76 C -12 -86 14 -88 34 -80 M -34 -58 C -26 -70 -10 -76 6 -76" fill="none" stroke={PINK} strokeOpacity={0.18} strokeWidth={1.5} strokeLinecap="round" />
      {/* sideburn */}
      <path d="M -6 -40 C -2 -30 -2 -22 -4 -16 L -10 -18 C -10 -26 -10 -34 -12 -40 Z" fill={HAIR} />
    </g>
  );
}

/** Stack labels pinned to a station: tools (purple, square mark) and models (sky, diamond mark). */
export type Tech = { text: string; kind?: "tool" | "model" };
const techW = (t: Tech) => t.text.length * 8.4 + 40;

export function ToolTag({ x, y, text, kind = "tool", o = 1 }: Tech & { x: number; y: number; o?: number }) {
  const w = techW({ text });
  const c = kind === "model" ? SKY : PURPLE;
  return (
    <g opacity={o}>
      <rect x={x} y={y - 15} width={w} height={30} rx={8} fill={PANEL2} stroke={c} strokeWidth={1.5} />
      {kind === "model" ? (
        <path d={`M ${x + 17} ${y - 7} L ${x + 24} ${y} L ${x + 17} ${y + 7} L ${x + 10} ${y} Z`} fill="none" stroke={c} strokeWidth={1.6} />
      ) : (
        <>
          <rect x={x + 11} y={y - 6} width={12} height={12} rx={3} fill="none" stroke={c} strokeWidth={1.6} />
          <circle cx={x + 17} cy={y} r={2} fill={c} />
        </>
      )}
      <text x={x + 31} y={y + 5} fill={c} style={{ fontFamily: MONO, fontSize: 14, fontWeight: 600 }}>
        {text}
      </text>
    </g>
  );
}

/** A centred row of stack labels. */
export function TechRow({ x, y, tags, o = 1, s = 1 }: { x: number; y: number; tags: Tech[]; o?: number; s?: number }) {
  const gap = 10;
  const total = tags.reduce((sum, t) => sum + techW(t), 0) + gap * (tags.length - 1);
  let left = -total / 2;
  return (
    <g opacity={o} transform={`translate(${x} ${y}) scale(${s})`}>
      {tags.map((t) => {
        const el = <ToolTag key={t.text} x={left} y={0} {...t} />;
        left += techW(t) + gap;
        return el;
      })}
    </g>
  );
}
