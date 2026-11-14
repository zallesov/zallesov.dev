// Remotion composition: "Development Pipeline".
// One big world with every station on it; a camera flies from step to step and
// pulls back at the end. Everything is a pure function of the current frame.
import type { ReactNode } from "react";
import { Audio, Sequence, useCurrentFrame } from "remotion";
import { PIPELINE, PIPELINE_AUDIO, PIPELINE_STEPS, pipelineStepAt, toSceneTime } from "./pipelineSteps";
import {
  BG, PANEL, PANEL2, ORANGE, PINK, RED, GREEN, PURPLE, SKY, DIM, FAINT, MONO, DOTS, HAND, SPIN,
  lin, io, out, bump, mix, rnd, makeCamera, type P,
  Greek, fly, Chip, FlyChip, Bubble, FlyBubble, Win, Human, TechRow,
} from "./sceneKit";

// ---------- world layout ----------
const HUMAN: P = { x: 260, y: 640 };
const PHONE = { x: 520, y: 600, w: 190, h: 380 };
const TICKETS = [
  { x: 900, y: 360, r: -3, n: 142, title: "Billing webhook", labels: ["feat", "api"] },
  { x: 950, y: 560, r: 2, n: 143, title: "Invoice PDF export", labels: ["feat"] },
  { x: 900, y: 760, r: -2, n: 144, title: "Retry failed charges", labels: ["bug", "billing"] },
];
const NAF = { x: 1250, y: 420, w: 480, h: 360 };
const NAF_C: P = { x: 1490, y: 600 };
const DEV_W = 400;
const DEV_H = 250;
const DEVS = [
  { name: "kuzya", x: 2050, y: 150, think: "Thinking…" },
  { name: "bublik", x: 2050, y: 480, think: "Brewing…" },
  { name: "pelmen", x: 2050, y: 810, think: "Wrangling…" },
];
const devC = (i: number): P => ({ x: DEVS[i].x + DEV_W / 2, y: DEVS[i].y + DEV_H / 2 });
const DOCS: P = { x: 1600, y: 1210 };
const CODEX = { x: 2740, y: 90, w: 420, h: 320 };
const CODEX_C: P = { x: 2950, y: 250 };
const CI = { x: 3360, y: 100, w: 380, h: 300 };
const CI_C: P = { x: 3550, y: 250 };
const STG = { x: 3930, y: 100, w: 400, h: 300 };
const STG_C: P = { x: 4130, y: 250 };
const DESK: P = { x: 420, y: 1300 };

// ---------- camera ----------
/** [frame, centre x, centre y, zoom] */
const CAM: [number, number, number, number][] = [
  [0, 400, 610, 1.4],
  [140, 400, 610, 1.4],
  [165, 720, 590, 1.05],
  [295, 720, 590, 1.05],
  [322, 1400, 600, 1.1],
  [455, 1400, 600, 1.1],
  [485, 1880, 605, 0.7],
  [755, 1880, 605, 0.7],
  [785, 950, 600, 0.8],
  [872, 950, 600, 0.8],
  [900, 1880, 605, 0.7],
  [920, 1880, 605, 0.7],
  [945, 1930, 1060, 1.0],
  [982, 1930, 1060, 1.0],
  [1005, 1880, 730, 0.54],
  [1018, 1880, 730, 0.54],
  [1040, 2600, 260, 1.05],
  [1122, 2600, 260, 1.05],
  [1142, 2900, 380, 0.72],
  [1236, 2900, 380, 0.72],
  [1258, 3840, 260, 1.05],
  [1298, 3840, 260, 1.05],
  [1328, 420, 1300, 1.4],
  [1408, 420, 1300, 1.4],
  [1428, 1880, 730, 0.54],
  [1448, 1880, 730, 0.54],
  [1474, 2235, 770, 0.29],
  [1500, 2235, 770, 0.29],
];

const camera = makeCamera(CAM);

interface Line {
  at: number;
  t: string;
}
const lineColor = (t: string) => {
  const c = t.trimStart()[0];
  if (c === "+" || c === "✓") return GREEN;
  if (c === "-" || c === "✗") return RED;
  if (c === "●" || c === ">") return PINK;
  if (c === "<" || c === "?") return ORANGE;
  return DIM;
};

/** A command-line agent: the log types itself and scrolls up. */
function Term({ id, x, y, w, h, title, badge, lines, f, fs = 13, hot = 0, status, phase }: { id: string; x: number; y: number; w: number; h: number; title: string; badge?: string; lines: Line[]; f: number; fs?: number; hot?: number; status?: { text: string; color?: string; spin?: boolean }; phase?: number }) {
  const lh = Math.round(fs * 1.55);
  const top = y + 34 + 12;
  const bodyH = h - 34 - 12 - 34;
  const rows = Math.floor(bodyH / lh);
  const maxChars = Math.floor((w - 32) / (fs * 0.602));
  let shown = 0;
  for (const l of lines) shown += lin(f, l.at, l.at + 5);
  const offset = Math.max(0, shown - rows) * lh;
  const els: ReactNode[] = [];
  let last: { x: number; y: number } | null = null;
  lines.forEach((l, i) => {
    if (f < l.at) return;
    const ly = top + i * lh - offset;
    if (ly < top - lh || ly > top + bodyH) return;
    const text = l.t.slice(0, maxChars).slice(0, Math.max(1, (f - l.at) * 3));
    els.push(
      <text key={i} x={x + 16} y={ly + fs} fill={lineColor(l.t)} style={{ fontFamily: MONO, fontSize: fs, whiteSpace: "pre" }} xmlSpace="preserve">
        {text}
      </text>,
    );
    last = { x: x + 16 + text.length * fs * 0.602, y: ly };
  });
  const cur = last as { x: number; y: number } | null;
  return (
    <Win x={x} y={y} w={w} h={h} title={title} badge={badge} hot={hot}>
      <clipPath id={`dp-clip-${id}`}>
        <rect x={x} y={top - 2} width={w} height={bodyH + 4} />
      </clipPath>
      <g clipPath={`url(#dp-clip-${id})`}>
        {els}
        {cur && Math.floor(f / 8) % 2 === 0 && <rect x={cur.x + 2} y={cur.y + 2} width={fs * 0.55} height={fs + 1} fill={PINK} opacity={0.7} />}
      </g>
      {status && (
        <text x={x + 16} y={y + h - 13} fill={status.color ?? ORANGE} style={{ fontFamily: MONO, fontSize: fs }}>
          {status.spin ? `${SPIN[Math.floor(f / 3) % SPIN.length]} ` : ""}
          {status.text}
        </text>
      )}
      {phase !== undefined && phase >= 0 && (
        <text x={x + w - 14} y={y + h - 13} textAnchor="end" style={{ fontFamily: MONO, fontSize: 11.5 }}>
          {PHASES.map((p, k) => (
            <tspan key={p} fill={k === phase ? PURPLE : k < phase ? GREEN : FAINT} fontWeight={k === phase ? 700 : 400}>
              {k > 0 ? " › " : ""}
              {k < phase ? "✓" : ""}
              {p}
            </tspan>
          ))}
        </text>
      )}
    </Win>
  );
}

// ---------- scripts for the terminals ----------
const NAF_LINES: Line[] = [
  { at: 322, t: "> inbox: 3 new tickets" },
  { at: 402, t: "> reading #142 #143 #144" },
  { at: 414, t: "> plan: 3 tasks, no overlaps" },
  { at: 428, t: "> #142 → kuzya" },
  { at: 438, t: "> #143 → bublik" },
  { at: 448, t: "> #144 → pelmen" },
  { at: 670, t: "< kuzya asks" },
  { at: 680, t: "> answered: see DECISIONS.md" },
  { at: 755, t: "< bublik asks" },
  { at: 766, t: "> not my call → texting Zall" },
  { at: 884, t: "< Zall replied" },
  { at: 892, t: "> relayed to bublik" },
  { at: 1128, t: "> #151 approved by codex" },
  { at: 1240, t: "✓ #151 merged → staging" },
];

const POOL = [
  "● Read src/billing/webhook.ts",
  "● Grep \"stripe\" src/",
  "● Edit src/billing/webhook.ts",
  "  + export async function handle(evt) {",
  "  +   await verify(evt.signature)",
  "  -   return legacy(evt)",
  "  +   return queue.push(evt)",
  "● Edit src/billing/retry.ts",
  "  + const backoff = [1, 5, 30]",
  "  - if (!charge) return",
  "● Bash pnpm test billing",
  "  ✓ 12 passed",
  "● Read docs/ARCHITECTURE.md",
  "● Edit test/webhook.test.ts",
  "  + it(\"rejects a bad signature\")",
  "● Bash pnpm typecheck",
  "  ✓ no errors",
  "● Write src/invoice/pdf.ts",
  "  + import { render } from \"./tpl\"",
];
/** Fill the given frame ranges with believable agent output. */
function genLines(seed: number, segs: [number, number][], extra: Line[] = []): Line[] {
  const res: Line[] = [...extra];
  let i = 0;
  let k = Math.floor(rnd(seed) * POOL.length);
  for (const [a, b] of segs) {
    let t = a;
    while (t < b) {
      res.push({ at: t, t: POOL[k % POOL.length] });
      k += 1 + Math.floor(rnd(seed * 3.1 + i) * 2);
      t += 7 + Math.floor(rnd(seed * 5.7 + i) * 9);
      i++;
    }
  }
  return res.sort((p, q) => p.at - q.at);
}
const DEV_SEGS: [number, number][][] = [
  [[470, 640], [712, 1018]],
  [[478, 725], [925, 1288]],
  [[486, 935], [998, 1288]],
];
const DEV_LINES: Line[][] = [
  genLines(1, DEV_SEGS[0], [
    { at: 642, t: "? asking nafanya" },
    { at: 1022, t: "● Bash gh pr create --fill" },
    { at: 1100, t: "● Edit: address review notes" },
    { at: 1196, t: "● Edit: fix the failing test" },
    { at: 1240, t: "✓ merged #151" },
  ]),
  genLines(2, DEV_SEGS[1], [
    { at: 727, t: "? asking nafanya" },
    { at: 1292, t: "✓ pushed, PR #152 open" },
  ]),
  genLines(3, DEV_SEGS[2], [
    { at: 937, t: "? looking it up in project docs" },
    { at: 1292, t: "✓ pushed, PR #153 open" },
  ]),
];

function devStatus(i: number, f: number) {
  if (f < DEV_SEGS[i][0][0]) return { text: "waiting for work", color: DIM };
  if (DEV_SEGS[i].some(([a, b]) => f >= a && f < b)) return { text: DEVS[i].think, spin: true };
  if (i === 0) {
    if (f < 712) return { text: "waiting for nafanya", color: DIM };
    if (f < 1126) return { text: "in review · codex", spin: true };
    if (f < 1238) return { text: "waiting for CI", spin: true };
    return { text: "✓ merged", color: GREEN };
  }
  if (i === 1 && f < 925) return { text: "waiting for nafanya", color: DIM };
  if (i === 2 && f < 998) return { text: "reading project docs", color: DIM };
  return { text: "✓ done", color: GREEN };
}

/** compound engineering: every developer goes plan → implement → review. */
const PHASES = ["plan", "implement", "review"];
function devPhase(i: number, f: number): number {
  const segs = DEV_SEGS[i];
  const start = segs[0][0];
  const end = segs[segs.length - 1][1];
  if (f < start) return -1;
  if (f < start + 40) return 0;
  if (i === 0) return f < 1022 ? 1 : f < 1240 ? 2 : 3;
  return f < end - 60 ? 1 : f < end ? 2 : 3;
}

// ---------- stations ----------

function Phone({ f }: { f: number }) {
  const { x, y, w, h } = PHONE;
  const buzz = f >= 818 && f < 842 ? Math.sin(f * 2.4) * 5 : 0;
  // who is talking in the opening conversation
  const aiTalk = Math.max(bump(f, 50, 76), bump(f, 110, 138), bump(f, 150, 215, 8));
  const pulse = 1 + 0.05 * Math.sin(f / 5) + 0.1 * aiTalk * Math.sin(f / 2.2);
  const oy = y - 70;
  const label = f < 150 ? (aiTalk > 0.5 ? "speaking…" : "listening…") : f < 220 ? "creating tickets…" : f < 815 ? "3 tickets created ✓" : f < 850 ? "nafanya is asking" : f < 880 ? "sent ✓" : "all quiet";
  const notif = bump(f, 818, 852, 6);
  return (
    <g transform={`translate(${buzz} 0)`}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={34} fill={PANEL} stroke={PINK} strokeOpacity={0.45} strokeWidth={2} />
      <rect x={x - w / 2 + 9} y={y - h / 2 + 9} width={w - 18} height={h - 18} rx={26} fill="#120916" />
      <rect x={x - 26} y={y - h / 2 + 18} width={52} height={12} rx={6} fill={PANEL} />
      {/* the voice orb */}
      <circle cx={x} cy={oy} r={62 * pulse} fill={ORANGE} opacity={0.08} />
      <circle cx={x} cy={oy} r={50 * pulse} fill={ORANGE} opacity={0.14} />
      <circle cx={x} cy={oy} r={38 * pulse} fill="url(#dp-orb)" />
      {[-2, -1, 0, 1, 2].map((k) => {
        const amp = 5 + aiTalk * 16 * (0.5 + 0.5 * Math.sin(f / 2 + k * 1.7));
        return <rect key={k} x={x + k * 10 - 2.5} y={oy - amp} width={5} height={amp * 2} rx={2.5} fill={BG} opacity={0.75} />;
      })}
      <text x={x} y={y + 30} textAnchor="middle" fill={DIM} style={{ fontFamily: MONO, fontSize: 12 }}>
        {label}
      </text>
      <Greek x={x - 62} y={y + 58} w={124} rows={3} seed={Math.floor(f / 40) + 3} o={0.22} />
      <rect x={x - 62} y={y + 124} width={124} height={30} rx={15} fill="none" stroke={FAINT} />
      <circle cx={x + 46} cy={y + 139} r={9} fill={f >= 852 && f < 880 ? GREEN : FAINT} />
      {/* a message from the orchestrator */}
      {notif > 0 && (
        <g opacity={notif} transform={`translate(0 ${(1 - notif) * -18})`}>
          <rect x={x - 78} y={y - h / 2 + 38} width={156} height={56} rx={14} fill={PANEL2} stroke={ORANGE} strokeWidth={1.5} />
          <circle cx={x - 60} cy={y - h / 2 + 56} r={8} fill={ORANGE} />
          <text x={x - 46} y={y - h / 2 + 60} fill={PINK} style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700 }}>
            nafanya
          </text>
          <Greek x={x - 66} y={y - h / 2 + 74} w={100} rows={1} seed={9} />
          <text x={x + 58} y={y - h / 2 + 82} textAnchor="middle" fill={ORANGE} style={{ fontFamily: MONO, fontSize: 26, fontWeight: 800 }}>
            ?
          </text>
        </g>
      )}
    </g>
  );
}

function Ticket({ i, f }: { i: number; f: number }) {
  const t = TICKETS[i];
  const born = 165 + i * 20;
  const gone = 304 + i * 12;
  if (f < born || f > gone + 30) return null;
  const a = out(f, born, born + 26);
  const b = io(f, gone, gone + 30);
  const x = mix(mix(PHONE.x, t.x, a), NAF_C.x, b);
  const y = mix(mix(PHONE.y - 40, t.y, a), NAF_C.y, b) - Math.sin(Math.PI * a) * 60 - Math.sin(Math.PI * b) * 50;
  const s = mix(mix(0.15, 1, a), 0.12, b);
  const rot = mix(mix(-30, t.r, a), 0, b);
  const W = 300;
  const H = 150;
  let lx = -W / 2 + 18;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={1 - lin(f, gone + 22, gone + 30)}>
      <rect x={-W / 2} y={-H / 2} width={W} height={H} rx={12} fill={PANEL} stroke={FAINT} strokeWidth={1.5} />
      {/* GitHub "open issue" mark */}
      <circle cx={-W / 2 + 28} cy={-H / 2 + 30} r={9} fill="none" stroke={GREEN} strokeWidth={2.2} />
      <circle cx={-W / 2 + 28} cy={-H / 2 + 30} r={2.6} fill={GREEN} />
      <text x={-W / 2 + 46} y={-H / 2 + 35} fill={PINK} style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700 }}>
        {t.title}
      </text>
      <text x={W / 2 - 16} y={-H / 2 + 35} textAnchor="end" fill={DIM} style={{ fontFamily: MONO, fontSize: 13 }}>
        #{t.n}
      </text>
      <Greek x={-W / 2 + 18} y={-H / 2 + 54} w={W - 60} rows={2} seed={t.n} o={0.25} />
      {t.labels.map((l) => {
        const w = l.length * 7.4 + 18;
        const el = (
          <g key={l}>
            <rect x={lx} y={8} width={w} height={20} rx={10} fill={l === "bug" ? RED : PURPLE} opacity={0.22} />
            <text x={lx + w / 2} y={22} textAnchor="middle" fill={l === "bug" ? RED : PURPLE} style={{ fontFamily: MONO, fontSize: 11.5 }}>
              {l}
            </text>
          </g>
        );
        lx += w + 6;
        return el;
      })}
      <line x1={-W / 2} y1={40} x2={W / 2} y2={40} stroke={FAINT} />
      <circle cx={-W / 2 + 26} cy={57} r={10} fill={ORANGE} />
      <text x={-W / 2 + 26} y={61.5} textAnchor="middle" fill={BG} style={{ fontFamily: MONO, fontSize: 12, fontWeight: 800 }}>
        N
      </text>
      <text x={-W / 2 + 44} y={62} fill={DIM} style={{ fontFamily: MONO, fontSize: 12.5 }}>
        ASSIGNED TO: <tspan fill={ORANGE} fontWeight={700}>nafanya</tspan>
      </text>
    </g>
  );
}

function Docs({ f }: { f: number }) {
  const { x, y } = DOCS;
  const W = 230;
  const H = 280;
  const sheets = f >= 1444 ? 4 : 3;
  const look = bump(f, 962, 992, 5);
  const grew = out(f, 1444, 1458);
  const files = ["ARCHITECTURE.md", "DECISIONS.md", "RUNBOOK.md", "CONVENTIONS.md"];
  return (
    <g>
      {Array.from({ length: sheets }, (_, k) => sheets - 1 - k).map((k) => (
        <rect key={k} x={x - W / 2 - k * 8} y={y - H / 2 - k * 8} width={W} height={H} rx={10} fill={k === 0 ? PANEL : PANEL2} stroke={FAINT} strokeWidth={1.5} />
      ))}
      {/* bookmark */}
      <path d={`M ${x + W / 2 - 44} ${y - H / 2} v 40 l 11 -9 l 11 9 v -40 Z`} fill={ORANGE} />
      <text x={x - W / 2 + 18} y={y - H / 2 + 36} fill={PINK} style={{ fontFamily: DOTS, fontSize: 20, fontWeight: 600, fontVariationSettings: "'ROND' 100" }}>
        PROJECT DOCS
      </text>
      <line x1={x - W / 2 + 18} y1={y - H / 2 + 50} x2={x + W / 2 - 18} y2={y - H / 2 + 50} stroke={FAINT} />
      {files.map((name, k) => {
        const ry = y - H / 2 + 76 + k * 50;
        const hit = k === 1 ? look : 0;
        return (
          <g key={name}>
            {hit > 0 && <rect x={x - W / 2 + 10} y={ry - 18} width={W - 20} height={42} rx={8} fill={ORANGE} opacity={0.16 * hit} />}
            <path d={`M ${x - W / 2 + 20} ${ry - 10} h 9 l 5 5 v 15 h -14 Z`} fill="none" stroke={hit > 0.5 ? ORANGE : DIM} strokeWidth={1.3} />
            <text x={x - W / 2 + 44} y={ry + 2} fill={hit > 0.5 ? ORANGE : PINK} style={{ fontFamily: MONO, fontSize: 12.5 }}>
              {name}
            </text>
            <Greek x={x - W / 2 + 44} y={ry + 10} w={W - 80} rows={1} seed={k + 40} o={0.2} h={4} />
          </g>
        );
      })}
      {grew > 0 && (
        <text x={x + W / 2 + 14} y={y - H / 2 + 20 - grew * 14} fill={GREEN} opacity={grew} style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700 }}>
          +1 note
        </text>
      )}
    </g>
  );
}

function Codex({ f }: { f: number }) {
  const { x, y, w, h } = CODEX;
  const has = out(f, 1056, 1066);
  const approved = out(f, 1122, 1130);
  const rows = [1, 0, 1, 1, -1, 1, 0, 1];
  return (
    <g>
      <text x={x + w / 2} y={y - 18} textAnchor="middle" fill={ORANGE} opacity={0.4 + 0.6 * bump(f, 1040, 1130, 10)} style={{ fontFamily: MONO, fontSize: 14, letterSpacing: 2 }}>
        REVIEW BY A DIFFERENT LLM
      </text>
      <Win x={x} y={y} w={w} h={h} title="codex — reviewer" hot={bump(f, 1058, 1124, 8)}>
        {has > 0 && (
          <g opacity={has}>
            <PrIcon x={x + 26} y={y + 62} color={approved > 0.5 ? GREEN : PINK} />
            <text x={x + 44} y={y + 67} fill={PINK} style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700 }}>
              feat: billing webhook
            </text>
            <text x={x + w - 18} y={y + 67} textAnchor="end" fill={DIM} style={{ fontFamily: MONO, fontSize: 13 }}>
              #151
            </text>
            <text x={x + 44} y={y + 87} style={{ fontFamily: MONO, fontSize: 12.5 }}>
              <tspan fill={GREEN}>+248</tspan>
              <tspan fill={RED}> −31</tspan>
              <tspan fill={DIM}> · 6 files</tspan>
            </text>
            {rows.map((kind, k) => {
              const ry = y + 104 + k * 22;
              const c = kind > 0 ? GREEN : kind < 0 ? RED : PINK;
              return (
                <g key={k}>
                  {kind !== 0 && <rect x={x + 14} y={ry - 3} width={w - 28} height={18} fill={c} opacity={0.08} />}
                  <text x={x + 20} y={ry + 11} fill={c} opacity={0.8} style={{ fontFamily: MONO, fontSize: 12 }}>
                    {kind > 0 ? "+" : kind < 0 ? "−" : " "}
                  </text>
                  <Greek x={x + 38 + (k % 3) * 12} y={ry + 3} w={150 + rnd(k) * 140} rows={1} seed={k + 70} color={c} o={0.4} />
                </g>
              );
            })}
            {/* review notes on two lines; they turn green once fixed */}
            {[
              { at: 1068, row: 2 },
              { at: 1076, row: 5 },
            ].map((n) => {
              const o = out(f, n.at, n.at + 6);
              if (o <= 0) return null;
              const done = f >= 1120;
              const cx = x + w - 62;
              const cy = y + 104 + n.row * 22 + 6;
              return (
                <g key={n.at} opacity={o} transform={`translate(${cx} ${cy}) scale(${0.6 + 0.4 * o})`}>
                  <rect x={-44} y={-13} width={88} height={26} rx={13} fill={PANEL2} stroke={done ? GREEN : ORANGE} strokeWidth={1.5} />
                  {done ? (
                    <text x={0} y={4.5} textAnchor="middle" fill={GREEN} style={{ fontFamily: MONO, fontSize: 12 }}>
                      ✓ fixed
                    </text>
                  ) : (
                    <Greek x={-32} y={-3} w={64} rows={1} seed={n.at} color={ORANGE} o={0.8} />
                  )}
                </g>
              );
            })}
            {approved > 0 && (
              <g opacity={approved} transform={`translate(${x + w / 2} ${y + h - 30}) scale(${1.5 - 0.5 * approved})`}>
                <rect x={-78} y={-17} width={156} height={34} rx={17} fill={GREEN} />
                <text x={0} y={5.5} textAnchor="middle" fill={BG} style={{ fontFamily: MONO, fontSize: 15, fontWeight: 800 }}>
                  ✓ Approved
                </text>
              </g>
            )}
          </g>
        )}
        {has <= 0 && (
          <text x={x + w / 2} y={y + h / 2 + 20} textAnchor="middle" fill={FAINT} style={{ fontFamily: MONO, fontSize: 13 }}>
            no open reviews
          </text>
        )}
      </Win>
    </g>
  );
}

function PrIcon({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y})`} fill="none" stroke={color} strokeWidth={1.8}>
      <circle cx={-5} cy={-7} r={3} />
      <circle cx={-5} cy={8} r={3} />
      <circle cx={6} cy={8} r={3} />
      <path d="M -5 -4 V 5 M 6 5 V -1 Q 6 -7 0 -7" />
    </g>
  );
}

function CiBox({ f }: { f: number }) {
  const { x, y, w, h } = CI;
  const checks = ["lint", "typecheck", "test", "build"];
  // first run: test fails, build is skipped; second run: all green
  const run1 = [1158, 1164, 1172, 1172];
  const run2 = [1222, 1226, 1230, 1234];
  const started = f >= 1148;
  const bar = f >= 1216 ? lin(f, 1216, 1236) : lin(f, 1148, 1172) * 0.62;
  const failed = f >= 1172 && f < 1216;
  const green = f >= 1234;
  return (
    <Win x={x} y={y} w={w} h={h} title="GitHub Actions — checks" hot={bump(f, 1148, 1238, 8)}>
      {checks.map((name, k) => {
        const ry = y + 70 + k * 44;
        let state: "idle" | "run" | "ok" | "fail" | "skip" = "idle";
        if (f >= run2[k]) state = "ok";
        else if (f >= 1216) state = "run";
        else if (f >= run1[k]) state = k === 2 ? "fail" : k === 3 ? "skip" : "ok";
        else if (started) state = "run";
        const c = state === "ok" ? GREEN : state === "fail" ? RED : state === "run" ? ORANGE : FAINT;
        return (
          <g key={name}>
            <rect x={x + 16} y={ry - 17} width={w - 32} height={36} rx={9} fill={c} opacity={state === "idle" || state === "skip" ? 0.04 : 0.1} />
            {state === "run" ? (
              <circle cx={x + 38} cy={ry + 1} r={8} fill="none" stroke={ORANGE} strokeWidth={2.4} strokeDasharray="30 22" transform={`rotate(${f * 14 + k * 50} ${x + 38} ${ry + 1})`} />
            ) : (
              <text x={x + 38} y={ry + 6.5} textAnchor="middle" fill={c} style={{ fontFamily: MONO, fontSize: 17, fontWeight: 800 }}>
                {state === "ok" ? "✓" : state === "fail" ? "✗" : "○"}
              </text>
            )}
            <text x={x + 60} y={ry + 6} fill={state === "idle" || state === "skip" ? DIM : PINK} style={{ fontFamily: MONO, fontSize: 14 }}>
              {name}
            </text>
            <text x={x + w - 28} y={ry + 6} textAnchor="end" fill={c} style={{ fontFamily: MONO, fontSize: 12 }}>
              {state === "ok" ? "passed" : state === "fail" ? "1 failed" : state === "run" ? "running" : state === "skip" ? "skipped" : ""}
            </text>
          </g>
        );
      })}
      <rect x={x + 16} y={y + h - 34} width={w - 32} height={10} rx={5} fill="rgba(255,255,255,0.08)" />
      <rect x={x + 16} y={y + h - 34} width={(w - 32) * bar} height={10} rx={5} fill={failed ? RED : green ? GREEN : ORANGE} />
    </Win>
  );
}

function Staging({ f }: { f: number }) {
  const { x, y, w, h } = STG;
  const dep = lin(f, 1270, 1290);
  const live = out(f, 1290, 1298);
  return (
    <Win x={x} y={y} w={w} h={h} title="" hot={bump(f, 1268, 1300, 8)}>
      {/* address bar */}
      <rect x={x + 70} y={y + 7} width={w - 90} height={21} rx={10.5} fill="#120916" stroke={FAINT} />
      <text x={x + 84} y={y + 22} fill={DIM} style={{ fontFamily: MONO, fontSize: 12 }}>
        staging.yourapp.dev
      </text>
      {dep > 0 && dep < 1 && <rect x={x} y={y + 34} width={w * dep} height={3} fill={ORANGE} />}
      {live > 0 ? (
        <g opacity={live}>
          <rect x={x + 24} y={y + 58} width={120} height={14} rx={7} fill={PINK} opacity={0.5} />
          <Greek x={x + 24} y={y + 90} w={w - 150} rows={3} seed={88} o={0.25} />
          <rect x={x + 24} y={y + 140} width={w - 48} height={90} rx={10} fill="rgba(255,255,255,0.04)" stroke={FAINT} />
          <Greek x={x + 40} y={y + 158} w={w - 90} rows={4} seed={91} o={0.2} gap={15} />
          <rect x={x + w - 126} y={y + 54} width={102} height={26} rx={13} fill={GREEN} />
          <text x={x + w - 75} y={y + 71.5} textAnchor="middle" fill={BG} style={{ fontFamily: MONO, fontSize: 12, fontWeight: 800 }}>
            ✓ deployed
          </text>
        </g>
      ) : (
        <text x={x + w / 2} y={y + h / 2 + 20} textAnchor="middle" fill={dep > 0 ? ORANGE : FAINT} style={{ fontFamily: MONO, fontSize: 13 }}>
          {dep > 0 ? `deploying ${Math.round(dep * 100)}%` : "previous build"}
        </text>
      )}
    </Win>
  );
}

/** A commit travelling as a small parcel. */
function Parcel({ f }: { f: number }) {
  const p = fly(f, 1246, 1270, { x: CI_C.x + 120, y: CI_C.y }, STG_C, 110);
  if (!p.on) return null;
  return (
    <g transform={`translate(${p.x} ${p.y}) scale(${p.s}) rotate(${Math.sin(p.t * Math.PI) * -10})`}>
      <rect x={-46} y={-32} width={92} height={64} rx={8} fill={PANEL2} stroke={GREEN} strokeWidth={1.8} />
      <path d="M -46 -12 H 46 M -8 -32 V -12 M 8 -32 V -12" stroke={GREEN} strokeWidth={1.5} fill="none" />
      <text x={0} y={14} textAnchor="middle" fill={GREEN} style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700 }}>
        4e2b7d0
      </text>
    </g>
  );
}

/** Next morning: the human wakes up and tests what was built overnight. */
function Morning({ f }: { f: number }) {
  const { x, y } = DESK;
  const dawn = io(f, 1332, 1366);
  const awake = io(f, 1350, 1368);
  const mins = Math.round(mix(192, 510, dawn));
  const clock = `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
  const screenOn = lin(f, 1364, 1372);
  const cur = io(f, 1374, 1390);
  const ok = out(f, 1392, 1400);
  const sleeping = f < 1350;
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* window with the sky */}
      <clipPath id="dp-sky">
        <rect x={110} y={-215} width={190} height={130} rx={10} />
      </clipPath>
      <g clipPath="url(#dp-sky)">
        <rect x={110} y={-215} width={190} height={130} fill="#0b0612" />
        <rect x={110} y={-215} width={190} height={130} fill="url(#dp-dawn)" opacity={dawn} />
        {[0, 1, 2, 3, 4, 5, 6].map((k) => (
          <circle key={k} cx={124 + rnd(k + 5) * 160} cy={-205 + rnd(k + 20) * 80} r={1.6} fill={PINK} opacity={(1 - dawn) * (0.5 + 0.5 * Math.sin(f / 6 + k))} />
        ))}
        <circle cx={170} cy={-170 + dawn * 150} r={20} fill="#f4e9ff" />
        <circle cx={179} cy={-176 + dawn * 150} r={17} fill="#0b0612" opacity={1 - dawn} />
        <circle cx={245} cy={-40 - dawn * 110} r={24} fill={ORANGE} />
      </g>
      <rect x={110} y={-215} width={190} height={130} rx={10} fill="none" stroke={FAINT} strokeWidth={2} />
      <path d="M 205 -215 V -85 M 110 -150 H 300" stroke={FAINT} strokeWidth={2} />
      {/* clock */}
      <rect x={-300} y={-205} width={128} height={54} rx={10} fill={PANEL} stroke={FAINT} strokeWidth={1.5} />
      <text x={-236} y={-167} textAnchor="middle" fill={dawn > 0.95 ? ORANGE : PINK} style={{ fontFamily: DOTS, fontSize: 32, fontWeight: 700, fontVariationSettings: "'ROND' 100" }}>
        {clock}
      </text>
      {/* the human: asleep, then up */}
      <Human x={-170} y={-10 + (1 - awake) * 46} s={0.72} tilt={(1 - awake) * 24} glow={screenOn} />
      {sleeping &&
        [0, 1, 2].map((k) => {
          const t = ((f + k * 14) % 42) / 42;
          return (
            <text key={k} x={-120 + t * 46} y={-70 - t * 60} fill={PINK} opacity={0.7 * (1 - t)} style={{ fontFamily: MONO, fontSize: 14 + t * 14, fontWeight: 700 }}>
              z
            </text>
          );
        })}
      {/* desk */}
      <rect x={-330} y={112} width={660} height={8} rx={4} fill={PANEL2} stroke={FAINT} />
      {/* laptop */}
      <rect x={-30} y={-48} width={236} height={150} rx={10} fill={PANEL} stroke={PINK} strokeOpacity={0.4} strokeWidth={1.5} />
      <rect x={-22} y={-40} width={220} height={134} rx={5} fill="#120916" />
      <path d="M -52 104 H 228 L 216 112 H -40 Z" fill={PANEL2} stroke={FAINT} />
      {screenOn > 0 && (
        <g opacity={screenOn}>
          <rect x={-14} y={-33} width={204} height={14} rx={7} fill={PANEL} />
          <text x={-6} y={-22.5} fill={DIM} style={{ fontFamily: MONO, fontSize: 9 }}>
            staging.yourapp.dev
          </text>
          <rect x={-12} y={-10} width={80} height={10} rx={5} fill={PINK} opacity={0.5} />
          <Greek x={-12} y={10} w={130} rows={3} seed={61} o={0.25} h={4} gap={10} />
          <rect x={110} y={48} width={70} height={24} rx={12} fill={ok > 0 ? GREEN : ORANGE} />
          <text x={145} y={64} textAnchor="middle" fill={BG} style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 800 }}>
            {ok > 0 ? "✓ LGTM" : "Approve"}
          </text>
          {/* cursor */}
          <path d="M 0 0 L 0 15 L 4 11 L 7 18 L 10 17 L 7 10 L 12 10 Z" fill={PINK} stroke={BG} strokeWidth={1} transform={`translate(${mix(20, 150, cur)} ${mix(10, 60, cur)})`} />
        </g>
      )}
      {/* mug */}
      <rect x={244} y={72} width={38} height={40} rx={6} fill={PANEL2} stroke={PINK} strokeOpacity={0.4} strokeWidth={1.5} />
      <path d="M 282 82 q 16 0 16 12 q 0 12 -16 12" fill="none" stroke={PINK} strokeOpacity={0.4} strokeWidth={1.5} />
      {awake > 0.5 &&
        [0, 1].map((k) => {
          const t = ((f + k * 20) % 40) / 40;
          return <path key={k} d={`M ${256 + k * 14} ${66 - t * 26} q 6 -7 0 -14`} fill="none" stroke={PINK} strokeWidth={1.5} opacity={0.5 * (1 - t)} />;
        })}
      {ok > 0 && (
        <text x={88} y={-64} textAnchor="middle" fill={GREEN} opacity={ok} style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700 }}>
          tested by a human ✓
        </text>
      )}
    </g>
  );
}

/** The opening conversation: human and AI take turns. */
function Talk({ f }: { f: number }) {
  const turns: { a: number; b: number; who: "me" | "ai"; rows: number; w: number }[] = [
    { a: 14, b: 46, who: "me", rows: 2, w: 170 },
    { a: 50, b: 76, who: "ai", rows: 3, w: 180 },
    { a: 80, b: 106, who: "me", rows: 3, w: 190 },
    { a: 110, b: 138, who: "ai", rows: 2, w: 160 },
  ];
  return (
    <>
      {turns.map((t, i) => {
        const o = bump(f, t.a, t.b, 5);
        if (o <= 0) return null;
        const me = t.who === "me";
        return <Bubble key={i} x={me ? 250 : 735} y={(me ? 455 : 470) - (1 - o) * 8} o={o} seed={i + 11} rows={t.rows} w={t.w} tail={me ? "left" : "left"} />;
      })}
      {/* voice arcs from the human towards the phone */}
      {[0, 1, 2].map((k) => {
        const talking = Math.max(bump(f, 14, 46), bump(f, 80, 106));
        const t = ((f + k * 7) % 21) / 21;
        if (talking <= 0) return null;
        return <path key={k} d={`M ${330 + t * 50} ${590} q 14 22 0 44`} fill="none" stroke={ORANGE} strokeWidth={2.5} strokeLinecap="round" opacity={talking * (1 - t)} />;
      })}
    </>
  );
}

/** Three dancing dots while the orchestrator thinks. */
function ThinkingDots({ f }: { f: number }) {
  const o = bump(f, 338, 396, 5);
  if (o <= 0) return null;
  return (
    <g opacity={o}>
      {[0, 1, 2].map((k) => (
        <circle key={k} cx={NAF_C.x - 30 + k * 30} cy={NAF_C.y + 30 - Math.max(0, Math.sin(f / 3.2 - k * 0.9)) * 22} r={9} fill={ORANGE} />
      ))}
    </g>
  );
}

const WIRES: [P, P][] = [
  [{ x: PHONE.x + 95, y: PHONE.y }, { x: 760, y: 590 }],
  [{ x: 1100, y: 590 }, { x: NAF.x, y: NAF_C.y }],
  [{ x: NAF.x + NAF.w, y: NAF_C.y }, { x: DEVS[0].x, y: devC(0).y }],
  [{ x: NAF.x + NAF.w, y: NAF_C.y }, { x: DEVS[1].x, y: devC(1).y }],
  [{ x: NAF.x + NAF.w, y: NAF_C.y }, { x: DEVS[2].x, y: devC(2).y }],
  [{ x: DEVS[0].x + DEV_W, y: devC(0).y }, { x: CODEX.x, y: CODEX_C.y }],
  [{ x: CODEX.x + CODEX.w, y: CODEX_C.y }, { x: CI.x, y: CI_C.y }],
  [{ x: CI.x + CI.w, y: CI_C.y }, { x: STG.x, y: STG_C.y }],
];
/** Dashed links from the documentation to every agent. */
const DOC_LINKS: P[] = [{ x: NAF_C.x, y: NAF.y + NAF.h }, { x: DEVS[0].x, y: devC(0).y + 60 }, { x: DEVS[1].x, y: devC(1).y + 60 }, { x: DEVS[2].x, y: devC(2).y + 40 }];

export const DevPipelineScene: React.FC = () => {
  // everything below runs on scene time: each scene is stretched to fit its narration
  const f = toSceneTime(useCurrentFrame());
  const cam = camera(f);
  const step = pipelineStepAt(f);
  // fade in at the start only: the player stops on the last frame, which should be the full map
  const fade = 1 - lin(f, 0, 10);
  const docLinks = f >= 1410 ? 1 : lin(f, 990, 1012);
  const docGlow = Math.max(bump(f, 990, 1020, 8), bump(f, 1418, 1460, 8));
  const nafHot = Math.max(bump(f, 322, 452, 8), bump(f, 668, 690, 6), bump(f, 753, 780, 6), bump(f, 882, 900, 6));
  const A = { naf: NAF_C, phone: { x: PHONE.x, y: PHONE.y - 60 }, docs: { x: DOCS.x + 60, y: DOCS.y - 60 } };

  return (
    // plain div instead of <AbsoluteFill>: Remotion's version passes `ref` as a prop, which React 18 warns about
    <div style={{ position: "absolute", inset: 0, backgroundColor: BG }}>
      {PIPELINE_AUDIO.map((a) => (
        <Sequence key={a.src} from={a.from} durationInFrames={a.frames} layout="none">
          <Audio src={a.src} />
        </Sequence>
      ))}
      <svg viewBox={`0 0 ${PIPELINE.width} ${PIPELINE.height}`} width="100%" height="100%">
        <defs>
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
          <linearGradient id="dp-dawn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5B7FD6" />
            <stop offset="100%" stopColor="#F9C48A" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#dp-dots)" />

        {/* ---------- the world, seen through the camera ---------- */}
        <g transform={`translate(${PIPELINE.width / 2} ${PIPELINE.height / 2}) scale(${cam.z}) translate(${-cam.x} ${-cam.y})`}>
          {WIRES.map(([a, b], i) => (
            <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(255,221,255,0.1)" strokeWidth={2} strokeDasharray="3 9" strokeLinecap="round" />
          ))}
          {docLinks > 0 &&
            DOC_LINKS.map((p, i) => (
              <line
                key={i}
                x1={DOCS.x}
                y1={DOCS.y - 100}
                x2={mix(DOCS.x, p.x, docLinks)}
                y2={mix(DOCS.y - 100, p.y, docLinks)}
                stroke={ORANGE}
                strokeOpacity={0.2 + 0.6 * docGlow}
                strokeWidth={2}
                strokeDasharray="8 8"
                strokeDashoffset={-f * 1.2}
              />
            ))}

          {/* station names, readable in the wide shots */}
          {(
            [
              [HUMAN.x + 130, 400, "ME + AI"],
              [NAF_C.x, NAF.y - 22, "ORCHESTRATOR"],
              [devC(0).x, DEVS[0].y - 22, "DEVELOPERS"],
              [CI_C.x, CI.y - 22, "CI"],
              [STG_C.x, STG.y - 22, "STAGING"],
              [DESK.x, DESK.y + 170, "NEXT MORNING"],
            ] as [number, number, string][]
          ).map(([x, y, t]) => (
            <text key={t} x={x} y={y} textAnchor="middle" fill={DIM} style={{ fontFamily: MONO, fontSize: 14, letterSpacing: 2 }}>
              {t}
            </text>
          ))}

          {/* tools at each station */}
          <TechRow x={PHONE.x} y={PHONE.y + PHONE.h / 2 + 34} tags={[{ text: "ChatGPT" }, { text: "Grok" }]} />
          <TechRow x={1010} y={878} tags={[{ text: "via GitHub MCP" }]} o={bump(f, 196, 300, 10)} />
          <TechRow x={NAF_C.x} y={NAF.y + NAF.h + 34} tags={[{ text: "BB orchestrator" }, { text: "Fable", kind: "model" }]} />
          <TechRow x={devC(2).x} y={DEVS[2].y + DEV_H + 34} tags={[{ text: "compound engineering" }, { text: "Opus", kind: "model" }]} />
          <TechRow x={CODEX_C.x} y={CODEX.y + CODEX.h + 34} tags={[{ text: "Codex", kind: "model" }]} />
          <TechRow x={DOCS.x} y={DOCS.y + 175} tags={[{ text: "Graphify" }]} />
          <TechRow x={CI_C.x} y={CI.y + CI.h + 34} tags={[{ text: "GitHub Actions" }]} o={1 - bump(f, 1238, 1268, 4)} />

          <Human x={HUMAN.x} y={HUMAN.y} glow={0.4 + 0.6 * Math.max(bump(f, 14, 140, 10), bump(f, 818, 880, 8))} />
          <Phone f={f} />
          <Talk f={f} />

          {/* tickets and the note about names */}
          {TICKETS.map((_, i) => (
            <Ticket key={i} i={i} f={f} />
          ))}
          {(() => {
            const o = bump(f, 236, 296, 8);
            if (o <= 0) return null;
            return (
              <g opacity={o}>
                <text x={420} y={892} fill={PINK} transform="rotate(-4 420 892)" style={{ fontFamily: HAND, fontSize: 26, fontStyle: "italic" }}>
                  yes, I give my agents names
                </text>
                <path d="M 772 866 C 800 866 818 856 812 834" fill="none" stroke={PINK} strokeWidth={2} strokeLinecap="round" strokeDasharray="70" strokeDashoffset={70 * (1 - out(f, 240, 258))} />
                <path d="M 803 845 L 812 832 L 822 844" fill="none" stroke={PINK} strokeWidth={2} strokeLinecap="round" opacity={lin(f, 254, 260)} />
              </g>
            );
          })()}

          {/* orchestrator */}
          <Term id="naf" x={NAF.x} y={NAF.y} w={NAF.w} h={NAF.h} title="nafanya — orchestrator" badge="N" lines={NAF_LINES} f={f} fs={15} hot={nafHot} status={f >= 338 && f < 400 ? { text: "thinking", spin: true } : { text: f < 322 ? "idle" : "3 developers online", color: DIM }} />
          <ThinkingDots f={f} />

          {/* developers */}
          {DEVS.map((d, i) => (
            <Term key={d.name} id={d.name} x={d.x} y={d.y} w={DEV_W} h={DEV_H} title={`${d.name} — developer`} badge={d.name[0].toUpperCase()} lines={DEV_LINES[i]} f={f} status={devStatus(i, f)} phase={devPhase(i, f)} hot={i === 0 ? bump(f, 1020, 1240, 10) * 0.6 : 0} />
          ))}

          <Docs f={f} />
          <Codex f={f} />
          <CiBox f={f} />
          <Staging f={f} />
          <Morning f={f} />

          {/* ---------- things in flight ---------- */}
          {/* tasks handed out */}
          {DEVS.map((d, i) => (
            <FlyChip key={d.name} f={f} s={430 + i * 10} e={458 + i * 10} a={{ x: NAF.x + NAF.w, y: NAF_C.y }} b={devC(i)} text={`#${142 + i} → ${d.name}`} lift={i === 1 ? 50 : 20} />
          ))}
          {/* kuzya asks, the orchestrator answers */}
          <FlyBubble f={f} s={642} e={668} a={devC(0)} b={A.naf} mark="?" seed={21} />
          <FlyBubble f={f} s={686} e={712} a={A.naf} b={devC(0)} mark="!" seed={22} />
          {/* bublik asks, the orchestrator asks the human */}
          <FlyBubble f={f} s={727} e={753} a={devC(1)} b={A.naf} mark="?" seed={23} lift={60} />
          <FlyBubble f={f} s={782} e={818} a={A.naf} b={A.phone} mark="?" seed={24} lift={140} />
          <FlyBubble f={f} s={852} e={884} a={A.phone} b={A.naf} mark="!" seed={25} lift={140} />
          <FlyBubble f={f} s={898} e={924} a={A.naf} b={devC(1)} mark="!" seed={26} lift={60} />
          {/* pelmen looks something up */}
          <FlyChip f={f} s={940} e={962} a={devC(2)} b={A.docs} text="⌕ retry policy?" color={PINK} />
          {(() => {
            const p = fly(f, 970, 996, A.docs, devC(2), 90);
            if (!p.on) return null;
            return <Sheet x={p.x} y={p.y} s={p.s} title="DECISIONS.md" rot={Math.sin(p.t * Math.PI) * 12} />;
          })()}
          {/* review loop */}
          <FlyChip f={f} s={1034} e={1058} a={devC(0)} b={CODEX_C} text="PR #151 · +248 −31" color={PINK} />
          <FlyChip f={f} s={1080} e={1098} a={CODEX_C} b={devC(0)} text="2 notes" lift={50} />
          <FlyChip f={f} s={1102} e={1120} a={devC(0)} b={CODEX_C} text="a3f9c1 fix" color={PINK} lift={50} />
          {/* CI loop */}
          <FlyChip f={f} s={1128} e={1148} a={CODEX_C} b={CI_C} text="PR #151 ✓ approved" color={GREEN} />
          <FlyChip f={f} s={1174} e={1194} a={CI_C} b={devC(0)} text="✗ 1 test failed" color={RED} lift={150} />
          <FlyChip f={f} s={1198} e={1216} a={devC(0)} b={CI_C} text="c07d44 fix test" color={PINK} lift={150} />
          {(() => {
            const o = out(f, 1238, 1246) * (1 - lin(f, 1262, 1272));
            if (o <= 0) return null;
            return <Chip x={CI_C.x} y={CI.y + CI.h + 30} text="⇄ merged" color={PURPLE} o={o} />;
          })()}
          <Parcel f={f} />
          {/* new knowledge goes back into the docs */}
          {(() => {
            const p = fly(f, 1420, 1444, devC(0), A.docs, 120);
            if (!p.on) return null;
            return <Sheet x={p.x} y={p.y} s={p.s} title="learned: …" rot={Math.sin(p.t * Math.PI) * -14} />;
          })()}
        </g>

        {/* ---------- heads-up display ---------- */}
        <rect x={0} y={0} width={PIPELINE.width} height={78} fill="url(#dp-hud)" />
        <defs>
          <linearGradient id="dp-hud" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BG} stopOpacity={0.96} />
            <stop offset="70%" stopColor={BG} stopOpacity={0.8} />
            <stop offset="100%" stopColor={BG} stopOpacity={0} />
          </linearGradient>
        </defs>
        <text x={28} y={38} fill={PINK} opacity={bump(f, PIPELINE_STEPS[step].at + 4, f >= 1410 ? 1486 : (PIPELINE_STEPS[step + 1]?.at ?? 1410) - 6, 6)} style={{ fontFamily: MONO, fontSize: 17, letterSpacing: 0.5 }}>
          <tspan fill={ORANGE}>[ 0{step + 1} ] </tspan>
          {PIPELINE_STEPS[step].text.toUpperCase()}
        </text>
        <text x={28 + PIPELINE_STEPS.length * 26 + 12} y={58} opacity={bump(f, PIPELINE_STEPS[step].at + 4, f >= 1410 ? 1486 : (PIPELINE_STEPS[step + 1]?.at ?? 1410) - 6, 6)} style={{ fontFamily: MONO, fontSize: 13, letterSpacing: 1 }}>
          <tspan fill={DIM}>STACK </tspan>
          <tspan fill={PURPLE}>{(f >= 1410 ? ["Graphify"] : PIPELINE_STEPS[step].tools).join(" · ")}</tspan>
          {f < 1410 && PIPELINE_STEPS[step].models.length > 0 && <tspan fill={SKY}> · {PIPELINE_STEPS[step].models.join(" · ")}</tspan>}
        </text>
        {PIPELINE_STEPS.map((_, i) => (
          <rect key={i} x={28 + i * 26} y={52} width={20} height={3} rx={1.5} fill={i === step ? ORANGE : i < step && f < 1410 ? PINK : FAINT} opacity={i === step ? 1 : 0.6} />
        ))}

        <rect width="100%" height="100%" fill={BG} opacity={fade} />
      </svg>
    </div>
  );
};

/** A page of documentation in flight. */
function Sheet({ x, y, s, title, rot }: { x: number; y: number; s: number; title: string; rot: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${rot})`}>
      <path d="M -50 -62 H 30 L 50 -42 V 62 H -50 Z" fill={PANEL2} stroke={ORANGE} strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M 30 -62 V -42 H 50" fill="none" stroke={ORANGE} strokeWidth={1.5} />
      <text x={-40} y={-34} fill={ORANGE} style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700 }}>
        {title}
      </text>
      <Greek x={-40} y={-20} w={78} rows={6} seed={title.length} o={0.35} h={4} gap={11} />
    </g>
  );
}

export default DevPipelineScene;
