// Remotion composition: "Business Automation".
// A swarm of agents on the left, each busy with its own job; the BB orchestrator in the
// middle, wired to every one of them; the knowledge base (Oracle) and my dashboard on the
// right. The camera visits a few agents, pulls back to show the whole swarm running
// through the orchestrator, and lands on the dashboard: all I look at is summaries and charts.
// Everything is a pure function of the frame.
import type { ReactNode } from "react";
import { Audio, Sequence, useCurrentFrame } from "remotion";
import { AUTOMATION, AUTOMATION_AUDIO, AUTOMATION_STEPS, automationStepAt, SCENE_END, toSceneTime } from "./automationSteps";
import {
  BG, PANEL, PANEL2, ORANGE, PINK, RED, GREEN, PURPLE, DIM, FAINT, MONO, DOTS, SPIN,
  lin, io, out, bump, mix, rnd, makeCamera, type P,
  Greek, fly, Chip, Win, Human, TechRow, SceneDefs,
} from "./sceneKit";

// ---------- the swarm ----------
const TILE_W = 360;
const TILE_H = 240;
const COL_X = [0, 400, 800, 1200];
const ROW_Y = [200, 480, 760, 1040];

type Kind = "support" | "summary" | "delivery" | "notes" | "competitor" | "partner" | "logs" | "trend";
interface Agent {
  name: string;
  kind: Kind;
  col: number;
  row: number;
  /** what the agent is looking at: a channel, a site, a service */
  arg?: string;
}
const AGENTS: Agent[] = [
  { name: "support · chat EN", kind: "support", col: 0, row: 0 },
  { name: "support · chat DE", kind: "support", col: 1, row: 0 },
  { name: "support · email", kind: "support", col: 2, row: 0 },
  { name: "feedback-summarizer", kind: "summary", col: 3, row: 0 },
  { name: "delivery-digest", kind: "delivery", col: 0, row: 1 },
  { name: "meeting-notes", kind: "notes", col: 1, row: 1 },
  { name: "competitor-watch", kind: "competitor", col: 2, row: 1, arg: "rival-shop.com" },
  { name: "competitor-watch", kind: "competitor", col: 3, row: 1, arg: "competitor.io" },
  { name: "partner-sync", kind: "partner", col: 0, row: 2 },
  { name: "log-watcher · api", kind: "logs", col: 1, row: 2 },
  { name: "log-watcher · payments", kind: "logs", col: 2, row: 2, arg: "payments" },
  { name: "trend-watch", kind: "trend", col: 3, row: 2 },
  { name: "support · chat FR", kind: "support", col: 0, row: 3 },
  { name: "review-digest", kind: "summary", col: 1, row: 3 },
  { name: "price-watch", kind: "competitor", col: 2, row: 3, arg: "market.example" },
  { name: "log-watcher · search", kind: "logs", col: 3, row: 3 },
];
const tile = (i: number) => ({ x: COL_X[AGENTS[i].col], y: ROW_Y[AGENTS[i].row], w: TILE_W, h: TILE_H });
const tileC = (i: number): P => ({ x: COL_X[AGENTS[i].col] + TILE_W / 2, y: ROW_Y[AGENTS[i].row] + TILE_H / 2 });
const born = (i: number) => 8 + i * 7;
const ID = { summarizer: 3, delivery: 4, notes: 5, rival: 6, competitor: 7, payments: 10 };
const SUPPORT = AGENTS.map((a, i) => (a.kind === "support" ? i : -1)).filter((i) => i >= 0);

// ---------- the rest of the world ----------
const HUB: P = { x: 2120, y: 860 };
const HUB_R = 170;
const ORACLE: P = { x: 2120, y: 270 };
const ORACLE_R = 190;
const DASH = { x: 2650, y: 560, w: 640, h: 660 };
const HUMAN: P = { x: 2470, y: 1190 };

/** Each row of agents shares a bus that runs into the orchestrator. */
const busY = (row: number) => ROW_Y[row] + TILE_H + 20;
const BUS_END_X = 1640;
/** A point on row `row`'s bus, t = 0 at the first agent, 1 at the orchestrator. */
function busPoint(row: number, t: number): P {
  const y = busY(row);
  const split = 0.7;
  if (t < split) return { x: mix(COL_X[0] + TILE_W / 2, BUS_END_X, t / split), y };
  const u = (t - split) / (1 - split);
  const a = { x: BUS_END_X, y };
  const c1 = { x: BUS_END_X + 180, y };
  const c2 = { x: HUB.x - HUB_R - 120, y: HUB.y + (y - HUB.y) * 0.25 };
  const b = { x: HUB.x - HUB_R, y: HUB.y + (y - HUB.y) * 0.25 };
  const v = 1 - u;
  return {
    x: v * v * v * a.x + 3 * v * v * u * c1.x + 3 * v * u * u * c2.x + u * u * u * b.x,
    y: v * v * v * a.y + 3 * v * v * u * c1.y + 3 * v * u * u * c2.y + u * u * u * b.y,
  };
}
const busPath = (row: number) => {
  const y = busY(row);
  const by = HUB.y + (y - HUB.y) * 0.25;
  return `M ${COL_X[0] + TILE_W / 2} ${y} H ${BUS_END_X} C ${BUS_END_X + 180} ${y} ${HUB.x - HUB_R - 120} ${by} ${HUB.x - HUB_R} ${by}`;
};

// ---------- camera ----------
type V = [number, number, number];
const SWARM: V = [820, 730, 0.56];
const MID: V = [1060, 560, 0.5];
const WIDE: V = [1620, 760, 0.36];
const DASH_VIEW: V = [2760, 880, 0.9];
const focus = (i: number, z = 1.4): V => [tileC(i).x, tileC(i).y + 10, z];
const at = (f: number, v: V): [number, number, number, number] => [f, ...v];
const camera = makeCamera([
  at(0, SWARM),
  at(140, SWARM),
  at(170, [580, 330, 1.05]),
  at(262, [580, 330, 1.05]),
  at(292, focus(ID.summarizer)),
  at(392, focus(ID.summarizer)),
  at(414, focus(ID.delivery)),
  at(452, focus(ID.delivery)),
  at(478, MID),
  at(540, MID),
  at(562, focus(ID.notes)),
  at(598, focus(ID.notes)),
  at(622, MID),
  at(680, MID),
  at(700, [1180, 610, 1.0]),
  at(724, [1180, 610, 1.0]),
  at(744, [780, 890, 1.0]),
  at(828, [780, 890, 1.0]),
  at(860, WIDE),
  at(990, WIDE),
  at(1014, DASH_VIEW),
  at(1130, DASH_VIEW),
  at(1180, WIDE),
  at(SCENE_END, WIDE),
]);

/** The punchline, two lines over the dimmed wide shot, in time with the voice. */
const PUNCH = [
  { at: 1188, lead: "MANY", word: "AGENTS" },
  { at: 1214, lead: "ONE", word: "ORCHESTRATOR" },
];
function Punchline({ f }: { f: number }) {
  const dim = out(f, 1180, 1196);
  if (dim <= 0) return null;
  return (
    <g>
      <rect width="100%" height="100%" fill={BG} opacity={0.72 * dim} />
      {PUNCH.map((p, k) => {
        const o = out(f, p.at, p.at + 10);
        if (o <= 0) return null;
        return (
          <text
            key={p.word}
            x={AUTOMATION.width / 2}
            y={380 + k * 120}
            textAnchor="middle"
            opacity={o}
            transform={`translate(0 ${(1 - o) * 16})`}
            style={{ fontFamily: DOTS, fontSize: 84, fontWeight: 700, fontVariationSettings: "'ROND' 100" }}
          >
            <tspan fill={ORANGE}>{p.lead}</tspan>
            <tspan fill={PINK}> {p.word}</tspan>
          </text>
        );
      })}
    </g>
  );
}

// ---------- beats (scene time) ----------
const T = {
  chat: 172, // the readable conversation in the first support tile
  summarize: 296,
  shipped: 410,
  toOracle1: 452,
  notes: 560,
  toOracle2: 600,
  rivalChange: 704,
  spike: 760,
  swarm: 856,
  dash: 1012,
};

// ---------- tile contents ----------
const text = (x: number, y: number, s: string, color = PINK, size = 12.5, weight = 400) => (
  <text x={x} y={y} fill={color} style={{ fontFamily: MONO, fontSize: size, fontWeight: weight }}>
    {s}
  </text>
);

function SupportBody({ i, f, x, y }: { i: number; f: number; x: number; y: number }) {
  // the first tile turns into a real conversation when the camera arrives
  if (i === 0 && f >= T.chat - 6) {
    const typed = "Yes! 2–3 days, free over €50.".slice(0, Math.max(0, Math.floor((f - (T.chat + 26)) * 2.2)));
    return (
      <g>
        <rect x={x + 120} y={y + 50} width={224} height={32} rx={12} fill={PANEL2} stroke={PINK} strokeOpacity={0.6} />
        {text(x + 134, y + 71, "Do you deliver to Austria?", PINK, 12)}
        {f >= T.chat + 8 && f < T.chat + 26 && (
          <g>
            <rect x={x + 16} y={y + 96} width={64} height={30} rx={12} fill="rgba(249,115,22,0.1)" stroke={ORANGE} strokeOpacity={0.7} />
            {[0, 1, 2].map((k) => (
              <circle key={k} cx={x + 34 + k * 14} cy={y + 111 - Math.max(0, Math.sin(f / 3 - k)) * 5} r={4} fill={ORANGE} />
            ))}
          </g>
        )}
        {f >= T.chat + 26 && (
          <g>
            <rect x={x + 16} y={y + 96} width={270} height={32} rx={12} fill="rgba(249,115,22,0.1)" stroke={ORANGE} strokeOpacity={0.7} />
            {text(x + 30, y + 117, typed, "#FFE7D6", 12)}
          </g>
        )}
        {f >= T.chat + 60 && text(x + 18, y + 152, "⚡ answered in 2.1 s", GREEN, 11.5)}
      </g>
    );
  }
  // a conversation that keeps going: question, typing, answer, next
  const ph = (f + i * 17) % 64;
  return (
    <g>
      {ph > 4 && (
        <g>
          <rect x={x + 150} y={y + 50} width={194} height={30} rx={12} fill={PANEL2} stroke={PINK} strokeOpacity={0.5} />
          <Greek x={x + 162} y={y + 62} w={170} rows={1} seed={i * 3 + Math.floor((f + i * 17) / 64)} o={0.45} />
        </g>
      )}
      {ph > 14 && ph < 26 && [0, 1, 2].map((k) => <circle key={k} cx={x + 34 + k * 14} cy={y + 111 - Math.max(0, Math.sin(f / 3 - k)) * 5} r={4} fill={ORANGE} />)}
      {ph >= 26 && (
        <g>
          <rect x={x + 16} y={y + 94} width={240} height={46} rx={12} fill="rgba(249,115,22,0.1)" stroke={ORANGE} strokeOpacity={0.6} />
          <Greek x={x + 28} y={y + 106} w={216} rows={2} seed={i * 5 + Math.floor((f + i * 17) / 64)} o={0.45} color="#FFE7D6" gap={12} />
        </g>
      )}
    </g>
  );
}

const TOPICS = [
  { name: "price alerts", n: 37 },
  { name: "delivery times", n: 21 },
  { name: "refunds", n: 12 },
  { name: "dark mode", n: 9 },
];
function SummaryBody({ i, f, x, y }: { i: number; f: number; x: number; y: number }) {
  const live = i === ID.summarizer;
  return (
    <g>
      {text(x + 16, y + 58, live ? "MOST ASKED · 412 chats" : "TOP REVIEWS · this week", FAINT, 11)}
      {TOPICS.map((t, k) => {
        const g = live ? out(f, T.summarize + k * 6, T.summarize + 30 + k * 6) : 0.4 + 0.5 * rnd(k + i);
        const ry = y + 72 + k * 34;
        return (
          <g key={k}>
            {live ? text(x + 16, ry + 11, t.name, k === 0 ? ORANGE : PINK, 12, k === 0 ? 700 : 400) : <Greek x={x + 16} y={ry + 4} w={120} rows={1} seed={k + i * 9} o={0.35} />}
            {live && text(x + TILE_W - 50, ry + 11, `×${Math.round(t.n * g)}`, k === 0 ? ORANGE : DIM, 12, 700)}
            <rect x={x + 16} y={ry + 17} width={TILE_W - 32} height={8} rx={4} fill="rgba(255,255,255,0.06)" />
            <rect x={x + 16} y={ry + 17} width={(TILE_W - 32) * (live ? t.n / 37 : 1) * g} height={8} rx={4} fill={k === 0 ? ORANGE : PINK} opacity={k === 0 ? 1 : 0.45} />
          </g>
        );
      })}
    </g>
  );
}

const SHIPPED = [
  { name: "price alerts", pr: "#212" },
  { name: "faster checkout", pr: "#215" },
  { name: "fix: refund emails", pr: "#218" },
];
function DeliveryBody({ f, x, y }: { f: number; x: number; y: number }) {
  return (
    <g>
      {text(x + 16, y + 58, "SHIPPED TODAY", FAINT, 11)}
      {SHIPPED.map((s, k) => {
        const o = out(f, T.shipped + k * 10, T.shipped + 10 + k * 10);
        const ry = y + 74 + k * 40;
        return (
          <g key={s.pr} opacity={0.25 + 0.75 * o}>
            <rect x={x + 12} y={ry} width={TILE_W - 24} height={32} rx={8} fill={GREEN} opacity={0.07 * o} />
            {text(x + 22, ry + 21, o > 0.5 ? "✓" : "○", o > 0.5 ? GREEN : FAINT, 14, 800)}
            {text(x + 44, ry + 21, s.name, k === 0 ? ORANGE : PINK, 13, k === 0 ? 700 : 400)}
            {text(x + TILE_W - 62, ry + 21, s.pr, DIM, 12)}
          </g>
        );
      })}
    </g>
  );
}

function NotesBody({ f, x, y }: { f: number; x: number; y: number }) {
  const hl = [1, 3, 5];
  return (
    <g>
      {text(x + 16, y + 58, "weekly sync · notes", DIM, 11.5)}
      {Array.from({ length: 7 }, (_, r) => {
        const k = hl.indexOf(r);
        const h = k >= 0 ? out(f, T.notes + k * 10, T.notes + 8 + k * 10) : 0;
        const ry = y + 72 + r * 19;
        return (
          <g key={r}>
            {h > 0 && <rect x={x + 10} y={ry - 5} width={TILE_W - 20} height={16} rx={4} fill={ORANGE} opacity={0.2 * h} />}
            <Greek x={x + 16} y={ry} w={300 - (r % 3) * 50} rows={1} seed={r + 70} o={h > 0.5 ? 0.85 : 0.3} color={h > 0.5 ? ORANGE : PINK} h={5} />
          </g>
        );
      })}
    </g>
  );
}

const FINDINGS: Record<number, string> = { [ID.rival]: "−10% on boots", [ID.competitor]: "new loyalty plan" };
function CompetitorBody({ i, f, x, y }: { i: number; f: number; x: number; y: number }) {
  const a = AGENTS[i];
  const scan = ((f + i * 13) % 56) / 56;
  const found = FINDINGS[i] ? out(f, T.rivalChange + (i - ID.rival) * 8, T.rivalChange + 10 + (i - ID.rival) * 8) : 0;
  return (
    <g>
      <rect x={x + 12} y={y + 44} width={TILE_W - 24} height={22} rx={11} fill="#120916" stroke={FAINT} />
      {text(x + 26, y + 60, a.arg ?? "", DIM, 11.5)}
      <rect x={x + 12} y={y + 74} width={TILE_W - 24} height={118} rx={8} fill="rgba(255,255,255,0.03)" />
      <Greek x={x + 24} y={y + 86} w={TILE_W - 48} rows={6} seed={i + 90} o={0.22} gap={17} />
      <rect x={x + 14} y={y + 76 + scan * 112} width={TILE_W - 28} height={2.5} fill={RED} opacity={0.75} />
      {found > 0 && (
        <g opacity={found}>
          <rect x={x + TILE_W - 190} y={y + 150} width={176} height={30} rx={15} fill={PANEL2} stroke={ORANGE} strokeWidth={1.5} />
          {text(x + TILE_W - 176, y + 170, `Δ ${FINDINGS[i]}`, ORANGE, 12.5, 700)}
        </g>
      )}
    </g>
  );
}

function PartnerBody({ f, x, y }: { f: number; x: number; y: number }) {
  const rows = 5;
  const shift = Math.floor(f / 14);
  return (
    <g>
      {text(x + 16, y + 58, "partner catalogues → database", FAINT, 11)}
      {Array.from({ length: rows }, (_, r) => (
        <g key={r}>
          {text(x + 16, y + 86 + r * 24, "+", GREEN, 13, 700)}
          <Greek x={x + 34} y={y + 78 + r * 24} w={260} rows={1} seed={r + shift} o={0.35} />
        </g>
      ))}
    </g>
  );
}

const SPARK = 44;
function LogsBody({ i, f, x, y }: { i: number; f: number; x: number; y: number }) {
  const pay = i === ID.payments;
  const cx = x + 16;
  const cw = TILE_W - 32;
  const top = y + 66;
  const ch = 110;
  const base = Math.floor(f / 2);
  const spikeAt = T.spike + 12; // when the spike sits in the middle of the chart
  const pts = Array.from({ length: SPARK }, (_, k) => {
    const g = base + k;
    let v = 0.12 + 0.12 * rnd(g + i * 31);
    if (pay) {
      // the spike enters from the right and scrolls left: it is at index `pos` of the chart
      const pos = (spikeAt - f) / 2 + SPARK / 2;
      v += 0.8 * Math.max(0, 1 - Math.abs(k - pos) / 3);
    }
    return `${cx + (k / (SPARK - 1)) * cw},${top + ch - v * ch}`;
  }).join(" ");
  const alert = pay ? out(f, T.spike, T.spike + 8) : 0;
  return (
    <g>
      {text(cx, y + 58, "errors / min", FAINT, 11)}
      <line x1={cx} y1={top + ch * 0.5} x2={cx + cw} y2={top + ch * 0.5} stroke={ORANGE} strokeOpacity={0.35} strokeDasharray="4 5" />
      <polyline points={pts} fill="none" stroke={alert > 0 ? RED : PINK} strokeOpacity={alert > 0 ? 1 : 0.7} strokeWidth={2} strokeLinejoin="round" />
      {alert > 0 && (
        <g opacity={alert}>
          <rect x={x + TILE_W - 176} y={y + 44} width={160} height={28} rx={14} fill={PANEL2} stroke={RED} strokeWidth={1.5} />
          {text(x + TILE_W - 164, y + 63, "⚠ 5xx spike", RED, 12.5, 800)}
        </g>
      )}
    </g>
  );
}

function TrendBody({ i, f, x, y }: { i: number; f: number; x: number; y: number }) {
  const n = 24;
  const grow = 0.85 + 0.15 * Math.sin(f / 20);
  const pts = Array.from({ length: n }, (_, k) => [x + 16 + (k / (n - 1)) * (TILE_W - 32), y + 180 - (k / n) * 90 * grow - 18 * rnd(k + i)] as const);
  return (
    <g>
      {text(x + 16, y + 58, "search trends · weekly", FAINT, 11)}
      <polygon points={`${x + 16},${y + 190} ${pts.map((p) => p.join(",")).join(" ")} ${x + TILE_W - 16},${y + 190}`} fill={PURPLE} opacity={0.12} />
      <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke={PURPLE} strokeWidth={2} />
    </g>
  );
}

function status(i: number, f: number): { text: string; color?: string; spin?: boolean } {
  const a = AGENTS[i];
  switch (a.kind) {
    case "support":
      return { text: `answering · ${(1180 + i * 37 + Math.floor(f / 6)).toLocaleString("en-US")} today`, spin: true };
    case "summary":
      if (i !== ID.summarizer) return { text: "weekly · Mon", color: DIM };
      if (f < T.summarize) return { text: "daily · 18:00", color: DIM };
      if (f < T.summarize + 40) return { text: "summarizing", spin: true };
      return { text: "✓ digest ready", color: GREEN };
    case "delivery":
      if (f < T.shipped) return { text: "daily · 18:00", color: DIM };
      if (f < T.toOracle1) return { text: "reading merged PRs", spin: true };
      return { text: "✓ knowledge base updated", color: GREEN };
    case "notes":
      if (f < T.notes) return { text: "after meetings", color: DIM };
      if (f < T.toOracle2) return { text: "reading notes", spin: true };
      return { text: "✓ 3 facts saved", color: GREEN };
    case "competitor":
      return FINDINGS[i] && f >= T.rivalChange ? { text: "✓ 1 change found", color: ORANGE } : { text: "every 6 h · scanning", spin: true };
    case "partner":
      return { text: "daily · 06:00 · syncing", spin: true };
    case "logs":
      return i === ID.payments && f >= T.spike ? { text: "⚠ alert sent", color: RED } : { text: "● watching", color: GREEN };
    default:
      return { text: "weekly · Mon", color: DIM };
  }
}

function AgentTile({ i, f }: { i: number; f: number }) {
  const b = born(i);
  if (f < b) return null;
  const o = out(f, b, b + 12);
  const { x, y, w, h } = tile(i);
  const a = AGENTS[i];
  const st = status(i, f);
  const hot = Math.max(
    i === 0 ? bump(f, T.chat, 260, 8) : 0,
    i === ID.summarizer ? bump(f, T.summarize - 10, 390, 8) : 0,
    i === ID.delivery ? bump(f, T.shipped - 10, 460, 8) : 0,
    i === ID.notes ? bump(f, T.notes - 10, 610, 8) : 0,
    i === ID.rival || i === ID.competitor ? bump(f, 700, 728, 6) : 0,
    i === ID.payments ? bump(f, T.spike, 830, 8) : 0,
  );
  let body: ReactNode;
  switch (a.kind) {
    case "support": body = <SupportBody i={i} f={f} x={x} y={y} />; break;
    case "summary": body = <SummaryBody i={i} f={f} x={x} y={y} />; break;
    case "delivery": body = <DeliveryBody f={f} x={x} y={y} />; break;
    case "notes": body = <NotesBody f={f} x={x} y={y} />; break;
    case "competitor": body = <CompetitorBody i={i} f={f} x={x} y={y} />; break;
    case "partner": body = <PartnerBody f={f} x={x} y={y} />; break;
    case "logs": body = <LogsBody i={i} f={f} x={x} y={y} />; break;
    default: body = <TrendBody i={i} f={f} x={x} y={y} />;
  }
  return (
    <g opacity={o} transform={`translate(${x + w / 2} ${y + h / 2}) scale(${0.9 + 0.1 * o}) translate(${-x - w / 2} ${-y - h / 2})`}>
      <Win x={x} y={y} w={w} h={h} title={a.name} badge={a.name[0].toUpperCase()} hot={hot}>
        {body}
        <text x={x + 16} y={y + h - 12} fill={st.color ?? ORANGE} style={{ fontFamily: MONO, fontSize: 12 }}>
          {st.spin ? `${SPIN[Math.floor((f + i * 2) / 3) % SPIN.length]} ` : ""}
          {st.text}
        </text>
      </Win>
      {/* link down to the row's bus */}
      <line x1={x + w / 2} y1={y + h} x2={x + w / 2} y2={busY(a.row)} stroke={PINK} strokeOpacity={0.25} strokeWidth={2} />
    </g>
  );
}

// ---------- the orchestrator ----------
function Hub({ f }: { f: number }) {
  const on = out(f, 20, 60);
  const hot = Math.max(bump(f, T.swarm, 990, 10), bump(f, T.toOracle1 + 10, T.toOracle1 + 40, 6), bump(f, T.toOracle2 + 10, T.toOracle2 + 40, 6), bump(f, T.dash, T.dash + 60, 8));
  const spin = f * 0.6;
  const agents = AGENTS.filter((_, i) => f >= born(i)).length;
  return (
    <g opacity={on}>
      <circle cx={HUB.x} cy={HUB.y} r={HUB_R + 40} fill={ORANGE} opacity={0.12 * hot} filter="url(#dp-blur)" />
      <circle cx={HUB.x} cy={HUB.y} r={HUB_R} fill={PANEL} stroke={ORANGE} strokeOpacity={0.4 + 0.6 * hot} strokeWidth={2.5} />
      {/* the schedule: a ring of ticks turning slowly, a few of them lit */}
      {Array.from({ length: 24 }, (_, k) => {
        const a = ((k * 15 + spin) * Math.PI) / 180;
        const lit = k % 5 === 0;
        return (
          <line
            key={k}
            x1={HUB.x + Math.cos(a) * (HUB_R - 14)}
            y1={HUB.y + Math.sin(a) * (HUB_R - 14)}
            x2={HUB.x + Math.cos(a) * (HUB_R - (lit ? 34 : 24))}
            y2={HUB.y + Math.sin(a) * (HUB_R - (lit ? 34 : 24))}
            stroke={lit ? ORANGE : PINK}
            strokeOpacity={lit ? 0.9 : 0.25}
            strokeWidth={lit ? 4 : 2}
            strokeLinecap="round"
          />
        );
      })}
      <text x={HUB.x} y={HUB.y - 8} textAnchor="middle" fill={PINK} style={{ fontFamily: DOTS, fontSize: 46, fontWeight: 700, fontVariationSettings: "'ROND' 100" }}>
        BB
      </text>
      <text x={HUB.x} y={HUB.y + 24} textAnchor="middle" fill={DIM} style={{ fontFamily: MONO, fontSize: 15 }}>
        orchestrator
      </text>
      <text x={HUB.x} y={HUB.y + 56} textAnchor="middle" fill={ORANGE} style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700 }}>
        {agents} agents
      </text>
    </g>
  );
}

/** Dots running along the buses: results going in, jobs going out. */
function BusTraffic({ f }: { f: number }) {
  const strength = Math.max(0.25, out(f, T.swarm, T.swarm + 30));
  if (f < 60) return null;
  const els: ReactNode[] = [];
  for (let r = 0; r < ROW_Y.length; r++) {
    for (let k = 0; k < 4; k++) {
      const speed = 0.006 + 0.002 * rnd(r * 7 + k);
      const inward = k % 2 === 0;
      let t = (f * speed + rnd(r * 13 + k)) % 1;
      if (!inward) t = 1 - t;
      const p = busPoint(r, t);
      els.push(<circle key={`${r}-${k}`} cx={p.x} cy={p.y} r={7} fill={inward ? ORANGE : PINK} opacity={strength * (inward ? 0.9 : 0.6)} />);
    }
  }
  return <>{els}</>;
}

// ---------- the knowledge base ----------
type Node = P & { born: number; label?: string };
const NODES: Node[] = (() => {
  const base: Node[] = Array.from({ length: 18 }, (_, k) => {
    const a = k * 2.399 + 0.3;
    const r = 30 + 140 * Math.sqrt((k + 0.5) / 18);
    return { x: ORACLE.x + Math.cos(a) * r, y: ORACLE.y + Math.sin(a) * r, born: -1 };
  });
  const labels: [number, string][] = [[3, "pricing"], [8, "refunds"], [13, "roadmap"]];
  for (const [k, l] of labels) base[k].label = l;
  const extra: Node[] = [
    { x: ORACLE.x + 120, y: ORACLE.y - 110, born: T.toOracle1 + 52, label: "price alerts: live" },
    { x: ORACLE.x + 160, y: ORACLE.y + 20, born: T.toOracle1 + 56 },
    { x: ORACLE.x - 150, y: ORACLE.y + 80, born: T.toOracle2 + 52, label: "free returns" },
    { x: ORACLE.x - 165, y: ORACLE.y - 30, born: T.toOracle2 + 56 },
    { x: ORACLE.x - 90, y: ORACLE.y - 140, born: T.toOracle2 + 60, label: "CH launch" },
  ];
  return [...base, ...extra];
})();
const EDGES: [number, number][] = NODES.flatMap((n, i) =>
  NODES.slice(0, i)
    .map((m, j) => ({ j, d: Math.hypot(m.x - n.x, m.y - n.y) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 2)
    .map(({ j }) => [j, i] as [number, number]),
);

function Oracle({ f }: { f: number }) {
  const grow = (n: Node) => (n.born < 0 ? 1 : out(f, n.born, n.born + 12));
  const hot = Math.max(bump(f, T.toOracle1 + 44, T.toOracle1 + 80, 8), bump(f, T.toOracle2 + 44, T.toOracle2 + 80, 8));
  const facts = 1284 + (f >= T.toOracle1 + 52 ? 3 : 0) + (f >= T.toOracle2 + 52 ? 3 : 0);
  return (
    <g>
      <circle cx={ORACLE.x} cy={ORACLE.y} r={ORACLE_R + 30} fill={ORANGE} opacity={0.12 * hot} filter="url(#dp-blur)" />
      <circle cx={ORACLE.x} cy={ORACLE.y} r={ORACLE_R} fill={PANEL} stroke={hot > 0.05 ? ORANGE : FAINT} strokeOpacity={0.4 + 0.6 * hot} strokeWidth={1.5} />
      {EDGES.map(([a, b], k) => {
        const o = Math.min(grow(NODES[a]), grow(NODES[b]));
        if (o <= 0) return null;
        const fresh = NODES[b].born >= 0 && f < NODES[b].born + 40;
        return <line key={k} x1={NODES[a].x} y1={NODES[a].y} x2={NODES[b].x} y2={NODES[b].y} stroke={fresh ? ORANGE : PINK} strokeOpacity={(fresh ? 0.7 : 0.18) * o} strokeWidth={1.5} />;
      })}
      {NODES.map((n, k) => {
        const g = grow(n);
        if (g <= 0) return null;
        const fresh = n.born >= 0 && f < n.born + 40;
        const c = fresh || n.born >= 0 ? ORANGE : PINK;
        return (
          <g key={k}>
            {fresh && <circle cx={n.x} cy={n.y} r={18 * g} fill={ORANGE} opacity={0.25} />}
            <circle cx={n.x} cy={n.y} r={(n.label ? 8 : 5) * g} fill={c} opacity={n.label || fresh ? 1 : 0.6} />
            {n.label && (
              <text x={n.x} y={n.y - 14} textAnchor="middle" fill={c} opacity={g * (n.born < 0 ? 0.7 : 1)} style={{ fontFamily: MONO, fontSize: 13 }}>
                {n.label}
              </text>
            )}
          </g>
        );
      })}
      <text x={ORACLE.x + ORACLE_R + 24} y={ORACLE.y + 6} fill={DIM} style={{ fontFamily: MONO, fontSize: 15 }}>
        {facts.toLocaleString("en-US")} facts
      </text>
    </g>
  );
}

// ---------- my dashboard ----------
const CARDS = [
  { title: "TOP ASKS", at: T.dash + 26 },
  { title: "SHIPPED TODAY", at: T.dash + 38 },
  { title: "ERRORS / MIN", at: T.dash + 50 },
  { title: "COMPETITORS", at: T.dash + 62 },
];
const card = (k: number) => ({ x: DASH.x + 20 + (k % 2) * 310, y: DASH.y + 54 + Math.floor(k / 2) * 300, w: 290, h: 284 });

function Dashboard({ f }: { f: number }) {
  return (
    <Win x={DASH.x} y={DASH.y} w={DASH.w} h={DASH.h} title="my dashboard" hot={bump(f, T.dash + 20, 1120, 8) * 0.6}>
      {CARDS.map((c, k) => {
        const { x, y, w, h } = card(k);
        const o = out(f, c.at, c.at + 10);
        return (
          <g key={c.title}>
            <rect x={x} y={y} width={w} height={h} rx={12} fill={o > 0 ? PANEL2 : "rgba(255,255,255,0.02)"} stroke={o > 0 ? FAINT : "rgba(255,221,255,0.08)"} strokeDasharray={o > 0 ? undefined : "5 6"} />
            {text(x + 18, y + 32, c.title, o > 0 ? DIM : FAINT, 12.5)}
            <g opacity={o}>{o > 0 && <CardBody k={k} f={f} x={x} y={y} w={w} />}</g>
          </g>
        );
      })}
    </Win>
  );
}

function CardBody({ k, f, x, y, w }: { k: number; f: number; x: number; y: number; w: number }) {
  if (k === 0)
    return (
      <g>
        {TOPICS.slice(0, 3).map((t, r) => (
          <g key={t.name}>
            {text(x + 18, y + 72 + r * 64, t.name, r === 0 ? ORANGE : PINK, 15, r === 0 ? 700 : 400)}
            {text(x + w - 54, y + 72 + r * 64, `×${t.n}`, r === 0 ? ORANGE : DIM, 15, 700)}
            <rect x={x + 18} y={y + 84 + r * 64} width={(w - 36) * (t.n / 37)} height={10} rx={5} fill={r === 0 ? ORANGE : PINK} opacity={r === 0 ? 1 : 0.45} />
          </g>
        ))}
      </g>
    );
  if (k === 1)
    return (
      <g>
        <text x={x + 18} y={y + 112} fill={GREEN} style={{ fontFamily: DOTS, fontSize: 70, fontWeight: 700, fontVariationSettings: "'ROND' 100" }}>
          3
        </text>
        {text(x + 74, y + 106, "features", DIM, 15)}
        {SHIPPED.map((s, r) => text(x + 18, y + 160 + r * 34, `✓ ${s.name}`, r === 0 ? ORANGE : PINK, 14))}
      </g>
    );
  if (k === 2) {
    const n = 30;
    const pts = Array.from({ length: n }, (_, i) => {
      const v = 0.1 + 0.1 * rnd(i + 3) + 0.75 * Math.max(0, 1 - Math.abs(i - 21) / 2.5);
      return `${x + 18 + (i / (n - 1)) * (w - 36)},${y + 210 - v * 140}`;
    }).join(" ");
    return (
      <g>
        <polyline points={pts} fill="none" stroke={RED} strokeWidth={2.5} strokeLinejoin="round" />
        <line x1={x + 18} y1={y + 140} x2={x + w - 18} y2={y + 140} stroke={ORANGE} strokeOpacity={0.4} strokeDasharray="4 5" />
        {text(x + 18, y + 250, "⚠ payments · 02:14", RED, 14, 700)}
      </g>
    );
  }
  return (
    <g>
      {text(x + 18, y + 76, "rival-shop.com", DIM, 13)}
      {text(x + 18, y + 102, "−10% on boots", ORANGE, 16, 700)}
      {text(x + 18, y + 150, "competitor.io", DIM, 13)}
      {text(x + 18, y + 176, "new loyalty plan", ORANGE, 16, 700)}
      <polyline points={`${x + 18},${y + 250} ${x + 90},${y + 236} ${x + 160},${y + 240} ${x + 230},${y + 214} ${x + w - 18},${y + 204}`} fill="none" stroke={PURPLE} strokeWidth={2.5} />
    </g>
  );
}

// ---------- things in flight ----------
/** A chip that goes agent → orchestrator → target. */
function ViaHub({ f, s, a, b, label, color = ORANGE, scale = 1.6 }: { f: number; s: number; a: P; b: P; label: string; color?: string; scale?: number }) {
  const hubIn = { x: HUB.x - HUB_R + 20, y: HUB.y };
  const leg1 = fly(f, s, s + 26, a, hubIn, 120);
  const leg2 = fly(f, s + 26, s + 50, { x: HUB.x, y: HUB.y - HUB_R + 10 }, b, 60);
  const p = leg1.on ? leg1 : leg2.on ? leg2 : null;
  if (!p) return null;
  return <Chip x={p.x} y={p.y} s={p.s * scale} text={label} color={color} />;
}

// ---------- the composition ----------
export const AutomationScene: React.FC = () => {
  const f = toSceneTime(useCurrentFrame());
  const cam = camera(f);
  const step = automationStepAt(f);
  const fade = 1 - lin(f, 0, 10);
  const stepEnd = AUTOMATION_STEPS[step + 1]?.at ?? SCENE_END;
  const hud = bump(f, AUTOMATION_STEPS[step].at + 4, stepEnd - 6, 6);
  const busO = 0.14 + 0.5 * bump(f, T.swarm, 990, 20);

  const labels: [number, number, string][] = [
    [780, 140, `AGENT SWARM · ${AGENTS.length} AGENTS`],
    [HUB.x, HUB.y - HUB_R - 30, "ORCHESTRATOR"],
    [ORACLE.x, ORACLE.y - ORACLE_R - 30, "ORACLE · KNOWLEDGE BASE"],
    [DASH.x + DASH.w / 2, DASH.y - 26, "WHAT I LOOK AT"],
  ];

  return (
    // plain div instead of <AbsoluteFill>: Remotion's version passes `ref` as a prop, which React 18 warns about
    <div style={{ position: "absolute", inset: 0, backgroundColor: BG }}>
      {AUTOMATION_AUDIO.map((a) => (
        <Sequence key={a.src} from={a.from} durationInFrames={a.frames} layout="none">
          <Audio src={a.src} />
        </Sequence>
      ))}
      <svg viewBox={`0 0 ${AUTOMATION.width} ${AUTOMATION.height}`} width="100%" height="100%">
        <defs>
          <SceneDefs />
        </defs>
        <rect width="100%" height="100%" fill="url(#dp-dots)" />

        {/* ---------- the world, seen through the camera ---------- */}
        <g transform={`translate(${AUTOMATION.width / 2} ${AUTOMATION.height / 2}) scale(${cam.z}) translate(${-cam.x} ${-cam.y})`}>
          {labels.map(([x, y, t]) => (
            <text key={t} x={x} y={y} textAnchor="middle" fill={DIM} style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 2 }}>
              {t}
            </text>
          ))}

          {/* buses from every row of agents into the orchestrator, and its links out */}
          {ROW_Y.map((_, r) => (
            <path key={r} d={busPath(r)} fill="none" stroke={ORANGE} strokeOpacity={busO} strokeWidth={4} strokeLinecap="round" />
          ))}
          {[
            `M ${HUB.x} ${HUB.y - HUB_R} V ${ORACLE.y + ORACLE_R}`,
            `M ${HUB.x + HUB_R} ${HUB.y} C ${HUB.x + HUB_R + 120} ${HUB.y} ${DASH.x - 140} ${DASH.y + 300} ${DASH.x} ${DASH.y + 300}`,
          ].map((d, k) => (
            <path key={k} d={d} fill="none" stroke={ORANGE} strokeOpacity={busO} strokeWidth={4} strokeDasharray="10 10" strokeDashoffset={-f * 1.5} />
          ))}
          <BusTraffic f={f} />

          {AGENTS.map((_, i) => (
            <AgentTile key={i} i={i} f={f} />
          ))}

          <Hub f={f} />
          <TechRow x={HUB.x} y={HUB.y + HUB_R + 46} tags={[{ text: "BB orchestrator" }]} s={1.4} />
          <Oracle f={f} />
          <TechRow x={ORACLE.x + ORACLE_R + 110} y={ORACLE.y + 50} tags={[{ text: "Graphify" }]} s={1.4} />
          <Dashboard f={f} />
          <Human x={HUMAN.x} y={HUMAN.y} s={0.9} glow={0.3 + 0.7 * bump(f, T.dash + 20, SCENE_END + 20, 10)} />

          {/* ---------- things in flight ---------- */}
          {/* every support chat feeds the summarizer */}
          {SUPPORT.map((i, k) => {
            const s = 262 + k * 7;
            const q = fly(f, s, s + 34, tileC(i), tileC(ID.summarizer), 90);
            if (!q.on) return null;
            return (
              <g key={i} transform={`translate(${q.x} ${q.y}) scale(${q.s * 1.4})`}>
                <rect x={-34} y={-16} width={68} height={32} rx={14} fill={PANEL2} stroke={k % 2 ? PINK : ORANGE} strokeWidth={1.5} />
                <Greek x={-22} y={-3} w={44} rows={1} seed={i + 400} o={0.6} />
              </g>
            );
          })}
          {/* knowledge goes in through the orchestrator */}
          <ViaHub f={f} s={T.toOracle1} a={tileC(ID.delivery)} b={ORACLE} label="+ shipped: price alerts" scale={2} />
          {["+ free returns", "+ refunds in 14 days", "+ CH launch"].map((l, k) => (
            <ViaHub key={l} f={f} s={T.toOracle2 + k * 5} a={tileC(ID.notes)} b={ORACLE} label={l} scale={2} />
          ))}
          {/* the swarm reports: summaries and charts go to my dashboard */}
          {[
            { from: ID.summarizer, label: "top asks" },
            { from: ID.delivery, label: "shipped" },
            { from: ID.payments, label: "⚠ errors", color: RED },
            { from: ID.rival, label: "competitors" },
          ].map((c, k) => {
            const s = CARDS[k].at - 50;
            const leg1 = fly(f, s, s + 26, tileC(c.from), { x: HUB.x - HUB_R + 20, y: HUB.y }, 160);
            const target = { x: card(k).x + card(k).w / 2, y: card(k).y + card(k).h / 2 };
            const leg2 = fly(f, s + 26, s + 50, { x: HUB.x + HUB_R - 10, y: HUB.y }, target, 80);
            const p = leg1.on ? leg1 : leg2.on ? leg2 : null;
            if (!p) return null;
            return <Chip key={c.label} x={p.x} y={p.y} s={p.s * 1.8} text={c.label} color={c.color ?? ORANGE} />;
          })}
        </g>

        <Punchline f={f} />

        {/* ---------- heads-up display ---------- */}
        <rect x={0} y={0} width={AUTOMATION.width} height={78} fill="url(#dp-hud)" />
        <text x={28} y={38} fill={PINK} opacity={hud} style={{ fontFamily: MONO, fontSize: 17, letterSpacing: 0.5 }}>
          <tspan fill={ORANGE}>[ 0{step + 1} ] </tspan>
          {AUTOMATION_STEPS[step].text.toUpperCase()}
        </text>
        {AUTOMATION_STEPS[step].tools.length > 0 && (
          <text x={28 + AUTOMATION_STEPS.length * 26 + 12} y={58} opacity={hud} style={{ fontFamily: MONO, fontSize: 13, letterSpacing: 1 }}>
            <tspan fill={DIM}>STACK </tspan>
            <tspan fill={PURPLE}>{AUTOMATION_STEPS[step].tools.join(" · ")}</tspan>
          </text>
        )}
        {AUTOMATION_STEPS.map((_, i) => (
          <rect key={i} x={28 + i * 26} y={52} width={20} height={3} rx={1.5} fill={i === step ? ORANGE : i < step ? PINK : FAINT} opacity={i === step ? 1 : 0.6} />
        ))}

        <rect width="100%" height="100%" fill={BG} opacity={fade} />
      </svg>
    </div>
  );
};

export default AutomationScene;
