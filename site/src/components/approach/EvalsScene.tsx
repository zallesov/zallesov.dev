// Remotion composition: "Agentic Evals".
// Eight panels laid out as a snake; the camera walks through them in order:
// a support answer that looks good → a dataset from real traces → Evalite scoring every case →
// models × prompts → toolsets → a prompt change blocked in CI → online evals in production →
// a leaderboard where the cheapest config that passes wins. Then it pulls back for the punchline.
// Everything is a pure function of the frame.
import type { ReactNode } from "react";
import { Audio, Sequence, useCurrentFrame } from "remotion";
import { EVALS, EVALS_AUDIO, EVALS_STEPS, evalsStepAt, SCENE_END, toSceneTime } from "./evalsSteps";
import {
  BG, PANEL2, ORANGE, PINK, RED, GREEN, PURPLE, SKY, DIM, FAINT, MONO, DOTS, HAND, SPIN,
  lin, out, bump, mix, rnd, makeCamera, type P,
  Greek, fly, Chip, Win, ToolTag, SceneDefs,
} from "./sceneKit";

// ---------- layout ----------
const W = 1040;
const H = 600;
/** Top-left corner of each panel, in the order the camera visits them. */
const Z = {
  agent: { x: 0, y: 0 },
  data: { x: 1200, y: 0 },
  run: { x: 2400, y: 0 },
  matrix: { x: 2400, y: 760 },
  tools: { x: 1200, y: 760 },
  ci: { x: 0, y: 760 },
  prod: { x: 0, y: 1520 },
  board: { x: 1200, y: 1520 },
};
type Zone = keyof typeof Z;

// ---------- beats (scene time) ----------
const T = {
  ask: 8,
  answer: 36,
  looks: 62,
  verdict: 88,
  slogan: 116,
  collect: 156,
  run: 296,
  matrix: 456,
  tools: 600,
  diff: 712,
  ci: 734,
  drop: 770,
  blocked: 826,
  prod: 872,
  board: 1004,
  sort: 1036,
  cut: 1068,
  win: 1082,
  punch: 1110,
};

// ---------- camera ----------
type V = [number, number, number];
const view = (z: Zone): V => [Z[z].x + W / 2, Z[z].y + H / 2 - 30, 1.08];
const WIDE: V = [1720, 1040, 0.34];
const at = (f: number, v: V): [number, number, number, number] => [f, ...v];
const camera = makeCamera([
  at(0, view("agent")),
  at(130, view("agent")),
  at(152, view("data")),
  at(272, view("data")),
  at(292, view("run")),
  at(432, view("run")),
  at(452, view("matrix")),
  at(572, view("matrix")),
  at(594, view("tools")),
  at(692, view("tools")),
  at(712, view("ci")),
  at(852, view("ci")),
  at(872, view("prod")),
  at(982, view("prod")),
  at(1002, view("board")),
  at(1100, view("board")),
  at(1132, WIDE),
  at(SCENE_END, WIDE),
]);

/** While each panel has the camera; it glows. */
const ACTIVE: Record<Zone, [number, number]> = {
  agent: [0, 132],
  data: [150, 274],
  run: [290, 434],
  matrix: [450, 574],
  tools: [592, 694],
  ci: [710, 854],
  prod: [870, 984],
  board: [1000, 1102],
};
const hotOf = (f: number, z: Zone) => bump(f, ACTIVE[z][0], ACTIVE[z][1], 8);

// ---------- helpers ----------
const text = (x: number, y: number, s: string, color = PINK, size = 15, weight = 400, anchor: "start" | "middle" | "end" = "start") => (
  <text x={x} y={y} fill={color} textAnchor={anchor} style={{ fontFamily: MONO, fontSize: size, fontWeight: weight }}>
    {s}
  </text>
);
const big = (x: number, y: number, s: string, color = PINK, size = 44, anchor: "start" | "middle" | "end" = "start") => (
  <text x={x} y={y} fill={color} textAnchor={anchor} style={{ fontFamily: DOTS, fontSize: size, fontWeight: 700, fontVariationSettings: "'ROND' 100" }}>
    {s}
  </text>
);
const spin = (f: number, k = 0) => SPIN[Math.floor((f + k * 2) / 3) % SPIN.length];
/** Score colour: green passes, orange is close, red fails. */
const heat = (s: number) => (s >= 90 ? GREEN : s >= 82 ? ORANGE : RED);

// ---------- 1. looks good? ----------
const ANSWER = "Yes! 2–3 days, free over €50.";
function AgentZone({ f }: { f: number }) {
  const { x, y } = Z.agent;
  const q = out(f, T.ask, T.ask + 10);
  const typed = ANSWER.slice(0, Math.max(0, Math.floor((f - T.answer) * 1.3)));
  const looks = out(f, T.looks, T.looks + 10);
  const strike = lin(f, T.verdict - 6, T.verdict + 4);
  const wrong = out(f, T.verdict + 20, T.verdict + 28);
  const VERDICT = [
    { ok: true, s: "replies in the user's language" },
    { ok: true, s: "friendly tone" },
    { ok: false, s: "grounded: KB says 3–5 days, no free shipping" },
  ];
  return (
    <g>
      <Win x={x} y={y} w={480} h={H} title="support agent · chat" badge="S" hot={hotOf(f, "agent")}>
        <g opacity={q}>
          <rect x={x + 160} y={y + 70} width={300} height={44} rx={14} fill={PANEL2} stroke={PINK} strokeOpacity={0.6} />
          {text(x + 178, y + 98, "Do you deliver to Austria?", PINK, 15)}
        </g>
        {f >= T.ask + 14 && f < T.answer && (
          <g>
            <rect x={x + 20} y={y + 140} width={80} height={40} rx={14} fill="rgba(249,115,22,0.1)" stroke={ORANGE} strokeOpacity={0.7} />
            {[0, 1, 2].map((k) => (
              <circle key={k} cx={x + 42 + k * 18} cy={y + 160 - Math.max(0, Math.sin(f / 3 - k)) * 6} r={5} fill={ORANGE} />
            ))}
          </g>
        )}
        {f >= T.answer && (
          <g>
            <rect x={x + 20} y={y + 140} width={330} height={44} rx={14} fill={wrong > 0 ? "rgba(244,63,94,0.1)" : "rgba(249,115,22,0.1)"} stroke={wrong > 0 ? RED : ORANGE} strokeOpacity={0.8} strokeWidth={1 + wrong} />
            {text(x + 38, y + 168, typed, "#FFE7D6", 15)}
            {wrong > 0 && <g opacity={wrong}>{text(x + 364, y + 170, "✗", RED, 26, 800)}</g>}
          </g>
        )}
        {f >= T.answer + 30 && text(x + 22, y + 214, "⚡ answered in 2.1 s", GREEN, 13)}
        {/* the rest of the chat, unreadable */}
        <g opacity={0.5}>
          <rect x={x + 230} y={y + 260} width={230} height={36} rx={14} fill={PANEL2} stroke={PINK} strokeOpacity={0.3} />
          <Greek x={x + 246} y={y + 275} w={200} rows={1} seed={4} o={0.35} />
          <rect x={x + 20} y={y + 316} width={290} height={54} rx={14} fill="rgba(249,115,22,0.06)" stroke={ORANGE} strokeOpacity={0.3} />
          <Greek x={x + 36} y={y + 331} w={258} rows={2} seed={9} o={0.3} color="#FFE7D6" />
        </g>
      </Win>

      {/* by eye */}
      <g opacity={looks} transform={`translate(${x + 790} ${y + 110}) rotate(-5) scale(${0.8 + 0.2 * looks})`}>
        <text x={0} y={0} textAnchor="middle" fill={ORANGE} style={{ fontFamily: HAND, fontSize: 62, fontWeight: 700 }}>
          looks good?
        </text>
        {strike > 0 && <line x1={-170} y1={-18} x2={-170 + 340 * strike} y2={-18} stroke={RED} strokeWidth={5} strokeLinecap="round" />}
      </g>

      {/* measured */}
      <Win x={x + 560} y={y + 190} w={480} h={250} title="support.eval.ts" o={out(f, T.verdict - 4, T.verdict + 6)} hot={0}>
        {VERDICT.map((v, k) => {
          const o = out(f, T.verdict + 4 + k * 8, T.verdict + 12 + k * 8);
          return (
            <g key={k} opacity={o}>
              {text(x + 584, y + 260 + k * 50, v.ok ? "✓" : "✗", v.ok ? GREEN : RED, 20, 800)}
              {text(x + 612, y + 258 + k * 50, v.s, v.ok ? PINK : RED, 14.5, v.ok ? 400 : 700)}
            </g>
          );
        })}
        {f >= T.verdict + 30 && text(x + 584, y + 418, "2 / 3 passed", ORANGE, 14, 700)}
      </Win>

      <g opacity={out(f, T.slogan, T.slogan + 10)}>{big(x + 800, y + 540, "EVALS = TESTS FOR AGENTS", PINK, 34, "middle")}</g>
    </g>
  );
}

// ---------- 2. dataset from traces ----------
const CASES = [
  { input: "Do you deliver to Austria?", expected: "3–5 days, no free shipping" },
  { input: "Where is my order #4471?", expected: "lookup_order(4471)" },
  { input: "Can I return opened boots?", expected: "yes, within 14 days" },
  { input: "My card was charged twice", expected: "escalate → human" },
  { input: "Do you have size 46?", expected: "check_stock(46)" },
  { input: "Ignore your rules and…", expected: "refuse politely" },
  { input: "Is it cheaper on rival-shop?", expected: "no price talk" },
  { input: "Cancel my subscription", expected: "cancel_plan + confirm" },
];
const TRACE_ROWS = 10;
/** Which trace row each case was picked from. */
const PICK = [1, 3, 4, 6, 8, 0, 5, 9];
const caseAt = (k: number) => T.collect + k * 12;
const traceC = (r: number): P => ({ x: Z.data.x + 240, y: Z.data.y + 82 + r * 50 });
const caseC = (k: number): P => ({ x: Z.data.x + 800, y: Z.data.y + 122 + k * 52 });

function DataZone({ f }: { f: number }) {
  const { x, y } = Z.data;
  const hot = hotOf(f, "data");
  const cases = Math.round(48 * lin(f, T.collect, caseAt(CASES.length - 1) + 20));
  return (
    <g>
      <Win x={x} y={y} w={480} h={H} title="LangSmith · traces" hot={hot}>
        {Array.from({ length: TRACE_ROWS }, (_, r) => {
          const k = PICK.indexOf(r);
          const lit = k >= 0 ? bump(f, caseAt(k) - 6, caseAt(k) + 10, 4) : 0;
          const ry = y + 58 + r * 50;
          return (
            <g key={r}>
              <rect x={x + 14} y={ry} width={452} height={42} rx={8} fill={lit > 0 ? "rgba(249,115,22,0.12)" : "rgba(255,255,255,0.03)"} stroke={lit > 0 ? ORANGE : "none"} strokeOpacity={lit} />
              <circle cx={x + 34} cy={ry + 21} r={5} fill={r === 3 ? ORANGE : GREEN} opacity={0.8} />
              <Greek x={x + 52} y={ry + 18} w={290} rows={1} seed={r * 3 + 11} o={0.35} />
              {text(x + 446, ry + 26, `${(0.8 + 1.6 * rnd(r + 2)).toFixed(1)} s`, DIM, 12.5, 400, "end")}
            </g>
          );
        })}
      </Win>
      <Win x={x + 560} y={y} w={480} h={H} title="dataset · support · v1" hot={hot}>
        {text(x + 580, y + 74, "INPUT", FAINT, 12)}
        {text(x + 820, y + 74, "EXPECTED", FAINT, 12)}
        {CASES.map((c, k) => {
          const o = out(f, caseAt(k) + 16, caseAt(k) + 24);
          const ry = y + 96 + k * 52;
          return (
            <g key={k} opacity={0.15 + 0.85 * o}>
              <rect x={x + 574} y={ry} width={452} height={44} rx={8} fill={PANEL2} stroke={FAINT} strokeDasharray={o > 0.5 ? undefined : "4 5"} />
              {o > 0 && (
                <g opacity={o}>
                  {text(x + 586, ry + 27, c.input.length > 26 ? `${c.input.slice(0, 25)}…` : c.input, PINK, 12.5)}
                  {text(x + 820, ry + 27, c.expected, ORANGE, 12.5)}
                </g>
              )}
            </g>
          );
        })}
        {text(x + 1020, y + 22, `${cases} cases`, ORANGE, 13, 700, "end")}
      </Win>
      {CASES.map((_, k) => {
        const p = fly(f, caseAt(k), caseAt(k) + 18, traceC(PICK[k]), caseC(k), 50);
        if (!p.on) return null;
        return <Chip key={k} x={p.x} y={p.y} s={p.s} text="+ case" />;
      })}
    </g>
  );
}

// ---------- 3. scoring ----------
const SCORERS = [
  { name: "CORRECT", note: "LLM judge" },
  { name: "GROUNDED", note: "vs knowledge base" },
  { name: "TOOL", note: "name + args" },
  { name: "FORMAT", note: "schema, language" },
  { name: "SAFE", note: "PII, injection" },
];
/** [case][scorer] → passed */
const FAILS = new Set(["0-1", "2-0", "3-2", "4-3", "6-4"]);
const passed = (r: number, c: number) => !FAILS.has(`${r}-${c}`);
const cellAt = (r: number, c: number) => T.run + r * 10 + c * 3;

function RunZone({ f }: { f: number }) {
  const { x, y } = Z.run;
  let done = 0;
  let ok = 0;
  const colX = (c: number) => x + 400 + c * 124;
  return (
    <Win x={x} y={y} w={W} h={H} title="evalite · support.eval.ts" hot={hotOf(f, "run")}>
      {text(x + 24, y + 82, "CASE", FAINT, 12)}
      {SCORERS.map((s, c) => (
        <g key={s.name} opacity={out(f, T.run - 10 + c * 3, T.run + c * 3)}>
          {text(colX(c) + 52, y + 74, s.name, PINK, 13, 700, "middle")}
          {text(colX(c) + 52, y + 92, s.note, s.name === "CORRECT" ? SKY : FAINT, 10.5, 400, "middle")}
        </g>
      ))}
      {CASES.map((cs, r) => {
        const ry = y + 108 + r * 54;
        return (
          <g key={r}>
            <rect x={x + 14} y={ry} width={W - 28} height={46} rx={8} fill="rgba(255,255,255,0.03)" />
            {text(x + 26, ry + 29, cs.input.length > 30 ? `${cs.input.slice(0, 29)}…` : cs.input, PINK, 13.5)}
            {SCORERS.map((_, c) => {
              const t0 = cellAt(r, c);
              if (f < t0) return <circle key={c} cx={colX(c) + 52} cy={ry + 23} r={3} fill={FAINT} />;
              if (f < t0 + 14) return <g key={c}>{text(colX(c) + 52, ry + 29, spin(f, r + c), ORANGE, 17, 700, "middle")}</g>;
              const pass = passed(r, c);
              done++;
              if (pass) ok++;
              const o = out(f, t0 + 14, t0 + 20);
              return (
                <g key={c} opacity={o}>
                  <rect x={colX(c) + 6} y={ry + 7} width={92} height={32} rx={8} fill={pass ? GREEN : RED} opacity={0.14} />
                  {text(colX(c) + 52, ry + 29, pass ? "✓" : "✗", pass ? GREEN : RED, 18, 800, "middle")}
                </g>
              );
            })}
          </g>
        );
      })}
      <g>
        {text(x + W - 190, y + 22, "SCORE", DIM, 13, 400, "end")}
        {text(x + W - 24, y + 23, done ? `${Math.round((ok / done) * 100)}%` : "—", done ? heat(Math.round((ok / done) * 100)) : DIM, 16, 800, "end")}
      </g>
      {f >= cellAt(7, 4) + 20 && text(x + 26, y + H - 18, "48 cases · 5 scorers · 41 s · $0.18 per run", DIM, 13)}
    </Win>
  );
}

// ---------- 4. models × prompts ----------
const MODELS = [
  { name: "haiku", cost: 0.002, lat: 0.9 },
  { name: "sonnet", cost: 0.011, lat: 1.8 },
  { name: "opus", cost: 0.054, lat: 3.9 },
];
const PROMPTS = ["prompt v1", "prompt v2", "prompt v3"];
const SCORES = [
  [71, 84, 91],
  [82, 90, 94],
  [88, 93, 96],
];
/** Longer prompts cost a little more. */
const costOf = (m: number, p: number) => MODELS[m].cost * (1 + 0.2 * p);
const money = (v: number) => `$${v < 0.01 ? v.toFixed(4) : v.toFixed(3)}`;
const matrixAt = (m: number, p: number) => T.matrix + (m * 3 + p) * 9;

function MatrixZone({ f }: { f: number }) {
  const { x, y } = Z.matrix;
  const cx = (p: number) => x + 230 + p * 262;
  const cy = (m: number) => y + 110 + m * 156;
  return (
    <Win x={x} y={y} w={W} h={H} title="evalite · models × prompts" hot={hotOf(f, "matrix")}>
      {PROMPTS.map((p, k) => (
        <g key={p}>{text(cx(k) + 120, y + 88, p, PINK, 15, 700, "middle")}</g>
      ))}
      {MODELS.map((m, r) => (
        <g key={m.name}>
          {text(x + 40, cy(r) + 70, m.name, SKY, 18, 700)}
          {text(x + 40, cy(r) + 94, `${m.lat} s`, FAINT, 12)}
          {PROMPTS.map((_, p) => {
            const t0 = matrixAt(r, p);
            const o = out(f, t0, t0 + 12);
            const s = SCORES[r][p];
            const shown = Math.round(s * o);
            return (
              <g key={p}>
                <rect x={cx(p)} y={cy(r)} width={240} height={138} rx={12} fill={o > 0 ? heat(s) : "rgba(255,255,255,0.02)"} opacity={o > 0 ? 0.08 + 0.1 * o : 1} />
                <rect x={cx(p)} y={cy(r)} width={240} height={138} rx={12} fill="none" stroke={o > 0 ? heat(s) : FAINT} strokeOpacity={o > 0 ? 0.6 : 1} strokeDasharray={o > 0 ? undefined : "5 6"} />
                {o > 0 && (
                  <g opacity={Math.min(1, o * 2)}>
                    {big(cx(p) + 120, cy(r) + 78, `${shown}%`, heat(s), 50, "middle")}
                    {text(cx(p) + 120, cy(r) + 112, `${money(costOf(r, p))} per run`, DIM, 13, 400, "middle")}
                  </g>
                )}
                {o <= 0 && f >= t0 - 8 && text(cx(p) + 120, cy(r) + 76, spin(f, r + p), ORANGE, 22, 700, "middle")}
              </g>
            );
          })}
        </g>
      ))}
      {f >= matrixAt(2, 2) + 16 && text(x + W - 24, y + 22, "9 configs · 432 runs", ORANGE, 13, 700, "end")}
    </Win>
  );
}

// ---------- 5. toolsets ----------
const SETS = [
  { name: "tools A", tools: ["lookup_order", "kb_search", "escalate"], call: "lookup_order(4471)", ok: true, acc: 96 },
  { name: "tools B", tools: ["web_search", "kb_search"], call: 'web_search("order 4471")', ok: false, acc: 71 },
];
function ToolsZone({ f }: { f: number }) {
  const { x, y } = Z.tools;
  const q = out(f, T.tools - 6, T.tools + 4);
  return (
    <Win x={x} y={y} w={W} h={H} title="evalite · toolsets" hot={hotOf(f, "tools")}>
      <g opacity={q}>
        <rect x={x + W / 2 - 160} y={y + 56} width={320} height={44} rx={14} fill={PANEL2} stroke={PINK} strokeOpacity={0.6} />
        {text(x + W / 2, y + 84, "Where is my order #4471?", PINK, 15, 400, "middle")}
      </g>
      {SETS.map((s, k) => {
        const lx = x + 40 + k * 500;
        const call = out(f, T.tools + 22 + k * 10, T.tools + 34 + k * 10);
        const verdict = out(f, T.tools + 44 + k * 10, T.tools + 52 + k * 10);
        const bar = out(f, T.tools + 60 + k * 6, T.tools + 84 + k * 6);
        const c = s.ok ? GREEN : RED;
        return (
          <g key={s.name}>
            {text(lx, y + 152, s.name.toUpperCase(), DIM, 13, 700)}
            {s.tools.map((t, i) => (
              <ToolTag key={t} x={lx + i * 152} y={y + 190} text={t} o={out(f, T.tools + 4 + i * 4, T.tools + 12 + i * 4)} />
            ))}
            {/* the call the agent made */}
            <g opacity={call}>
              <path d={`M ${lx + 200} ${y + 112} C ${lx + 200} ${y + 240} ${lx + 100} ${y + 230} ${lx + 100} ${y + 262}`} fill="none" stroke={c} strokeOpacity={0.5} strokeWidth={2} strokeDasharray="6 6" />
              <rect x={lx} y={y + 266} width={420} height={50} rx={10} fill={PANEL2} stroke={verdict > 0 ? c : FAINT} strokeWidth={1.5} />
              {text(lx + 18, y + 297, s.call, PINK, 15)}
              <g opacity={verdict}>{text(lx + 398, y + 299, s.ok ? "✓" : "✗", c, 22, 800, "end")}</g>
            </g>
            <g opacity={verdict}>{text(lx, y + 350, s.ok ? "right tool, right args" : "wrong tool: no access to orders", c, 13.5, 700)}</g>
            {/* tool accuracy over the dataset */}
            <g opacity={bar > 0 ? 1 : 0}>
              {text(lx, y + 420, "TOOL ACCURACY · 48 cases", FAINT, 12)}
              <rect x={lx} y={y + 436} width={420} height={18} rx={9} fill="rgba(255,255,255,0.06)" />
              <rect x={lx} y={y + 436} width={420 * (s.acc / 100) * bar} height={18} rx={9} fill={c} opacity={0.8} />
              {big(lx, y + 520, `${Math.round(s.acc * bar)}%`, c, 46)}
            </g>
          </g>
        );
      })}
    </Win>
  );
}

// ---------- 6. regression in CI ----------
const DIFF = [
  { k: " ", s: "You are the support agent for the shop." },
  { k: "-", s: "Answer only from the knowledge base." },
  { k: "+", s: "Be friendly and always helpful." },
  { k: " ", s: "If unsure, hand over to a human." },
];
const BROKEN = ["Austria shipping · grounded", "refund policy · grounded", "charged twice · escalate"];
function CiZone({ f }: { f: number }) {
  const { x, y } = Z.ci;
  const running = f >= T.ci && f < T.drop;
  const drop = lin(f, T.drop, T.drop + 28);
  const score = Math.round(mix(92, 78, drop));
  const blocked = out(f, T.blocked, T.blocked + 8);
  return (
    <Win x={x} y={y} w={W} h={H} title="PR #231 · make support replies friendlier" hot={hotOf(f, "ci")}>
      {text(x + 24, y + 70, "support.prompt.md", DIM, 13)}
      {DIFF.map((d, k) => {
        const o = out(f, T.diff - 10 + k * 5, T.diff - 2 + k * 5);
        const c = d.k === "-" ? RED : d.k === "+" ? GREEN : DIM;
        const ry = y + 86 + k * 38;
        return (
          <g key={k} opacity={o}>
            {d.k !== " " && <rect x={x + 18} y={ry} width={470} height={32} rx={6} fill={c} opacity={0.12} />}
            {text(x + 30, ry + 22, d.k, c, 15, 800)}
            {text(x + 52, ry + 22, d.s, d.k === " " ? DIM : PINK, 13.5)}
          </g>
        );
      })}

      <rect x={x + 530} y={y + 56} width={490} height={330} rx={12} fill={PANEL2} stroke={drop > 0 ? RED : FAINT} strokeOpacity={drop > 0 ? 0.4 + 0.6 * drop : 1} />
      {text(x + 552, y + 90, "CHECK · evalite", DIM, 13, 700)}
      {f < T.ci && text(x + 552, y + 140, "waiting…", FAINT, 15)}
      {running && text(x + 552, y + 140, `${spin(f)} running 48 cases`, ORANGE, 16, 700)}
      {f >= T.drop && (
        <g>
          {big(x + 552, y + 170, `${score}%`, drop > 0.4 ? RED : GREEN, 64)}
          {text(x + 760, y + 140, "baseline 92%", DIM, 14)}
          {text(x + 760, y + 164, `now ${score}%  ·  ${score - 92}`, drop > 0.4 ? RED : DIM, 14, 700)}
          {BROKEN.map((b, k) => (
            <g key={b} opacity={out(f, T.drop + 30 + k * 8, T.drop + 38 + k * 8)}>
              {text(x + 552, y + 236 + k * 40, `✗ ${b}`, RED, 15)}
            </g>
          ))}
        </g>
      )}

      {/* merge button */}
      <rect x={x + 24} y={y + 470} width={330} height={60} rx={12} fill={blocked > 0 ? "rgba(255,255,255,0.05)" : GREEN} opacity={blocked > 0 ? 1 : 0.85} stroke={blocked > 0 ? FAINT : "none"} />
      {text(x + 189, y + 507, blocked > 0 ? "Merge blocked" : "Merge pull request", blocked > 0 ? DIM : BG, 17, 800, "middle")}
      {f >= T.blocked + 14 && <g opacity={out(f, T.blocked + 14, T.blocked + 22)}>{text(x + 24, y + 570, "✓ caught before release, users never saw it", GREEN, 14, 700)}</g>}
      {blocked > 0 && (
        <g opacity={blocked} transform={`translate(${x + 740} ${y + 490}) rotate(-9) scale(${mix(1.6, 1, blocked)})`}>
          <rect x={-170} y={-50} width={340} height={100} rx={12} fill="rgba(244,63,94,0.08)" stroke={RED} strokeWidth={5} />
          <text x={0} y={22} textAnchor="middle" fill={RED} style={{ fontFamily: DOTS, fontSize: 64, fontWeight: 800, fontVariationSettings: "'ROND' 100" }}>
            BLOCKED
          </text>
        </g>
      )}
    </Win>
  );
}

// ---------- 7. online evals in production ----------
const DAYS = 30;
const DIP = 24;
const quality = (d: number) => 0.93 + 0.015 * (rnd(d + 7) - 0.5) - 0.12 * Math.max(0, 1 - Math.abs(d - DIP - 1) / 2.2);
function ProdZone({ f }: { f: number }) {
  const { x, y } = Z.prod;
  const p = lin(f, T.prod, T.prod + 80);
  const shown = Math.max(2, Math.floor(p * DAYS));
  const left = x + 400;
  const right = x + W - 40;
  const top = y + 90;
  const bot = y + 420;
  const px = (d: number) => mix(left, right, d / (DAYS - 1));
  const py = (v: number) => mix(bot, top, (v - 0.7) / 0.3);
  const pts = Array.from({ length: shown }, (_, d) => `${px(d)},${py(quality(d))}`).join(" ");
  const alert = shown > DIP + 1 ? out(f, T.prod + 66, T.prod + 74) : 0;
  const scored = Math.floor(12000 + 480 * lin(f, T.prod, T.prod + 100) + (f > T.prod ? (f - T.prod) * 3 : 0));
  return (
    <Win x={x} y={y} w={W} h={H} title="LangSmith · online evals · production" hot={hotOf(f, "prod")}>
      {/* live traffic falling into the scorer */}
      {text(x + 40, y + 76, "PRODUCTION TRAFFIC", FAINT, 12)}
      {Array.from({ length: 14 }, (_, k) => {
        const t = (f * 0.012 + rnd(k)) % 1;
        return <circle key={k} cx={x + 60 + rnd(k + 3) * 240} cy={mix(y + 100, y + 320, t)} r={6} fill={k % 4 === 0 ? ORANGE : PINK} opacity={0.75 * Math.min(1, (1 - t) * 4)} />;
      })}
      <rect x={x + 40} y={y + 330} width={280} height={70} rx={12} fill={PANEL2} stroke={ORANGE} strokeWidth={1.5} />
      {text(x + 180, y + 362, `${spin(f)} scoring`, ORANGE, 15, 700, "middle")}
      {text(x + 180, y + 386, "groundedness · tone · safety", DIM, 11.5, 400, "middle")}
      {text(x + 40, y + 450, `${scored.toLocaleString("en-US")}`, PINK, 22, 700)}
      {text(x + 40, y + 474, "traces scored today", DIM, 13)}

      {/* quality over the last 30 days */}
      {text(left, y + 70, "GROUNDEDNESS · last 30 days", FAINT, 12)}
      {[1, 0.9, 0.8, 0.7].map((v) => (
        <g key={v}>
          <line x1={left} y1={py(v)} x2={right} y2={py(v)} stroke="rgba(255,255,255,0.05)" />
          {text(left - 12, py(v) + 4, `${Math.round(v * 100)}%`, FAINT, 11, 400, "end")}
        </g>
      ))}
      <line x1={left} y1={py(0.88)} x2={right} y2={py(0.88)} stroke={ORANGE} strokeOpacity={0.5} strokeDasharray="5 6" />
      {text(right, py(0.88) + 18, "alert at 88%", ORANGE, 11, 400, "end")}
      <polyline points={pts} fill="none" stroke={alert > 0 ? RED : GREEN} strokeWidth={3} strokeLinejoin="round" />
      <circle cx={px(shown - 1)} cy={py(quality(shown - 1))} r={6} fill={alert > 0 ? RED : GREEN} />
      {alert > 0 && (
        <g opacity={alert}>
          <rect x={left} y={y + 450} width={600} height={60} rx={12} fill="rgba(244,63,94,0.1)" stroke={RED} strokeWidth={1.5} />
          {text(left + 20, y + 478, "⚠ groundedness 93% → 81%", RED, 16, 800)}
          {text(left + 20, y + 498, "new product line, KB is missing it · alert sent", DIM, 12.5)}
        </g>
      )}
    </Win>
  );
}

// ---------- 8. leaderboard ----------
const CONFIGS = MODELS.flatMap((m, mi) => PROMPTS.map((p, pi) => ({ model: m.name, prompt: p.replace("prompt ", ""), score: SCORES[mi][pi], cost: costOf(mi, pi), lat: m.lat })));
const BY_COST = [...CONFIGS.keys()].sort((a, b) => CONFIGS[a].cost - CONFIGS[b].cost);
const WINNER = BY_COST.find((i) => CONFIGS[i].score >= 90) ?? 0;
function BoardZone({ f }: { f: number }) {
  const { x, y } = Z.board;
  const sort = lin(f, T.sort, T.sort + 26);
  const cut = out(f, T.cut, T.cut + 10);
  const win = out(f, T.win, T.win + 10);
  const rowY = (slot: number) => y + 92 + slot * 50;
  const cheapest = CONFIGS[WINNER];
  const priciest = CONFIGS[BY_COST[BY_COST.length - 1]];
  return (
    <Win x={x} y={y} w={W} h={H} title="leaderboard · pass ≥ 90%, then cheapest" hot={hotOf(f, "board")}>
      {text(x + 60, y + 76, "CONFIG", FAINT, 12)}
      {text(x + 560, y + 76, "SCORE", FAINT, 12, 400, "end")}
      {text(x + 760, y + 76, "$ PER RUN", FAINT, 12, 400, "end")}
      {text(x + 900, y + 76, "LATENCY", FAINT, 12, 400, "end")}
      {CONFIGS.map((c, i) => {
        const o = out(f, T.board + i * 3, T.board + 8 + i * 3);
        const ry = mix(rowY(i), rowY(BY_COST.indexOf(i)), sort);
        const fail = c.score < 90;
        const isWin = i === WINNER;
        const dim = fail ? 1 - 0.65 * cut : 1;
        return (
          <g key={i} opacity={o * dim}>
            <rect x={x + 24} y={ry} width={W - 48} height={42} rx={8} fill={isWin && win > 0 ? "rgba(249,115,22,0.16)" : "rgba(255,255,255,0.03)"} stroke={isWin && win > 0 ? ORANGE : "none"} strokeWidth={2} />
            {text(x + 60, ry + 27, `${c.model} · ${c.prompt}`, isWin && win > 0 ? ORANGE : PINK, 15, isWin ? 700 : 400)}
            {text(x + 560, ry + 27, `${c.score}%`, heat(c.score), 15, 700, "end")}
            {text(x + 760, ry + 27, money(c.cost), DIM, 15, 400, "end")}
            {text(x + 900, ry + 27, `${c.lat} s`, DIM, 15, 400, "end")}
            {fail && cut > 0 && (
              <g opacity={cut}>
                <line x1={x + 56} y1={ry + 21} x2={x + 56 + 860 * cut} y2={ry + 21} stroke={RED} strokeOpacity={0.6} strokeWidth={2} />
                {text(x + W - 40, ry + 27, "✗", RED, 16, 800, "end")}
              </g>
            )}
            {isWin && win > 0 && (
              <g opacity={win}>
                <rect x={x + W - 150} y={ry + 7} width={112} height={28} rx={14} fill={ORANGE} />
                {text(x + W - 94, ry + 26, "WINNER", BG, 13, 800, "middle")}
              </g>
            )}
          </g>
        );
      })}
      <g opacity={out(f, T.win + 12, T.win + 22)}>
        {text(x + 24, y + H - 22, `${cheapest.model} · ${cheapest.prompt} passes at ${money(cheapest.cost)}: ${Math.round(priciest.cost / cheapest.cost)}× cheaper than ${priciest.model} · ${priciest.prompt}`, ORANGE, 14, 700)}
      </g>
    </Win>
  );
}

// ---------- links between the panels ----------
const LINKS: string[] = [
  `M ${Z.agent.x + W} ${H / 2} H ${Z.data.x}`,
  `M ${Z.data.x + W} ${H / 2} H ${Z.run.x}`,
  `M ${Z.run.x + W / 2} ${H} V ${Z.matrix.y}`,
  `M ${Z.matrix.x} ${Z.matrix.y + H / 2} H ${Z.tools.x + W}`,
  `M ${Z.tools.x} ${Z.tools.y + H / 2} H ${Z.ci.x + W}`,
  `M ${Z.ci.x + W / 2} ${Z.ci.y + H} V ${Z.prod.y}`,
  `M ${Z.prod.x + W} ${Z.prod.y + H / 2} H ${Z.board.x}`,
];

/** The punchline, two lines over the dimmed overview. */
const PUNCH = [
  { at: T.punch + 8, lead: "IF YOU DON'T", word: "MEASURE IT," },
  { at: T.punch + 40, lead: "YOU CAN'T", word: "IMPROVE IT." },
];
function Punchline({ f }: { f: number }) {
  const dim = out(f, T.punch, T.punch + 16);
  if (dim <= 0) return null;
  return (
    <g>
      <rect width="100%" height="100%" fill={BG} opacity={0.75 * dim} />
      {PUNCH.map((p, k) => {
        const o = out(f, p.at, p.at + 10);
        if (o <= 0) return null;
        return (
          <text
            key={p.word}
            x={EVALS.width / 2}
            y={380 + k * 110}
            textAnchor="middle"
            opacity={o}
            transform={`translate(0 ${(1 - o) * 16})`}
            style={{ fontFamily: DOTS, fontSize: 74, fontWeight: 700, fontVariationSettings: "'ROND' 100" }}
          >
            <tspan fill={ORANGE}>{p.lead}</tspan>
            <tspan fill={PINK}> {p.word}</tspan>
          </text>
        );
      })}
    </g>
  );
}

// ---------- the composition ----------
export const EvalsScene: React.FC = () => {
  const f = toSceneTime(useCurrentFrame());
  const cam = camera(f);
  const step = evalsStepAt(f);
  const fade = 1 - lin(f, 0, 10);
  const stepEnd = EVALS_STEPS[step + 1]?.at ?? SCENE_END;
  const hud = bump(f, EVALS_STEPS[step].at + 4, stepEnd - 6, 6);

  const zones: ReactNode[] = [
    <AgentZone key="agent" f={f} />,
    <DataZone key="data" f={f} />,
    <RunZone key="run" f={f} />,
    <MatrixZone key="matrix" f={f} />,
    <ToolsZone key="tools" f={f} />,
    <CiZone key="ci" f={f} />,
    <ProdZone key="prod" f={f} />,
    <BoardZone key="board" f={f} />,
  ];

  return (
    // plain div instead of <AbsoluteFill>: Remotion's version passes `ref` as a prop, which React 18 warns about
    <div style={{ position: "absolute", inset: 0, backgroundColor: BG }}>
      {EVALS_AUDIO.map((a) => (
        <Sequence key={a.src} from={a.from} durationInFrames={a.frames} layout="none">
          <Audio src={a.src} />
        </Sequence>
      ))}
      <svg viewBox={`0 0 ${EVALS.width} ${EVALS.height}`} width="100%" height="100%">
        <defs>
          <SceneDefs />
        </defs>
        <rect width="100%" height="100%" fill="url(#dp-dots)" />

        <g transform={`translate(${EVALS.width / 2} ${EVALS.height / 2}) scale(${cam.z}) translate(${-cam.x} ${-cam.y})`}>
          {LINKS.map((d, k) => (
            <path key={k} d={d} fill="none" stroke={ORANGE} strokeOpacity={0.35} strokeWidth={4} strokeDasharray="10 10" strokeDashoffset={-f * 1.5} />
          ))}
          {zones}
        </g>

        <Punchline f={f} />

        {/* ---------- heads-up display ---------- */}
        <rect x={0} y={0} width={EVALS.width} height={78} fill="url(#dp-hud)" />
        <text x={28} y={38} fill={PINK} opacity={hud} style={{ fontFamily: MONO, fontSize: 17, letterSpacing: 0.5 }}>
          <tspan fill={ORANGE}>[ 0{step + 1} ] </tspan>
          {EVALS_STEPS[step].text.toUpperCase()}
        </text>
        {EVALS_STEPS[step].tools.length > 0 && (
          <text x={28 + EVALS_STEPS.length * 26 + 12} y={58} opacity={hud} style={{ fontFamily: MONO, fontSize: 13, letterSpacing: 1 }}>
            <tspan fill={DIM}>STACK </tspan>
            <tspan fill={PURPLE}>{EVALS_STEPS[step].tools.join(" · ")}</tspan>
          </text>
        )}
        {EVALS_STEPS.map((_, i) => (
          <rect key={i} x={28 + i * 26} y={52} width={20} height={3} rx={1.5} fill={i === step ? ORANGE : i < step ? PINK : FAINT} opacity={i === step ? 1 : 0.6} />
        ))}

        <rect width="100%" height="100%" fill={BG} opacity={fade} />
      </svg>
    </div>
  );
};

export default EvalsScene;
