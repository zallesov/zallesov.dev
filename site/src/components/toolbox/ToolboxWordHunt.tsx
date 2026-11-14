import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, TOOLS, type Category, type CategoryId } from "../../data/toolbox";

// Toolbox as a word search: a full-width letter wall with the whole toolbox hidden in it,
// horizontally, vertically or diagonally. Two words start out marked as examples. When every word
// is found, the leftover letters light up in reading order and spell a hidden phrase.
// The grid is sized to the container: desktop fits (almost) every tool, phones get the core ones.

const CELL = 28; // target cell size in px; columns = container width / CELL
const MAX_COLS = 40;
const MIN_COLS = 12;
const EXAMPLES = 2;
const HINTS = 3; // first letters lit at all times; finding a hinted word lights the next one
const PHRASE = "BOOKACALL";
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
// forward only (right, down, both diagonals), so a casual visitor isn't hunting for reversed words
const DIRS: [number, number][] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [-1, 1],
];

const CAT_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<CategoryId, Category>;

interface Entry {
  word: string; // letters as they sit in the grid
  label: string; // tool name as written in the toolbox
  cat: CategoryId;
  weight: number;
  cells: number[];
  dir: number; // index into DIRS
}

// tools that fit in the grid as letters and digits (GPT-5 -> GPT5): no abbreviations, at least 2 chars (BB)
const POOL = TOOLS.filter((t) => !/\.$/.test(t.name))
  .map((t) => ({ label: t.name, cat: t.cat, weight: t.weight ?? 1, word: t.name.toUpperCase().replace(/[^A-Z0-9]/g, "") }))
  .filter((t) => t.word.length >= 2);

const rand = (n: number) => Math.floor(Math.random() * n);
const shuffle = <T,>(a: T[]) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

function makeRound(cols: number) {
  const rows = cols >= 30 ? 26 : cols >= 20 ? 22 : 22;
  const grid: string[] = Array(cols * rows).fill("");
  const entries: Entry[] = [];
  // core tools first, so a small (phone) grid still gets the important ones; longer first inside a tier packs better
  const picks = shuffle(POOL)
    .filter((p) => p.word.length <= Math.max(cols, rows))
    .sort((a, b) => b.weight - a.weight || b.word.length - a.word.length);
  const budget = Math.floor(cols * rows * 0.8); // letters to spend on words, the rest is noise and the phrase
  let used = 0;

  for (const p of picks) {
    if (used + p.word.length > budget) continue;
    // a word hidden inside another (REACT in REACTTHREEFIBER) would be ambiguous: keep the one placed first
    if (entries.some((e) => e.word.includes(p.word) || p.word.includes(e.word))) continue;
    // collect every legal placement, prefer ones that cross an existing word so the wall stays dense
    const options: { cells: number[]; dir: number; overlap: number }[] = [];
    for (let d = 0; d < DIRS.length; d++) {
      const [dr, dc] = DIRS[d];
      for (let r0 = 0; r0 < rows; r0++)
        for (let c0 = 0; c0 < cols; c0++) {
          const cells: number[] = [];
          let overlap = 0;
          let ok = true;
          for (let i = 0; i < p.word.length; i++) {
            const r = r0 + dr * i;
            const c = c0 + dc * i;
            if (r < 0 || r >= rows || c < 0 || c >= cols) {
              ok = false;
              break;
            }
            const at = r * cols + c;
            if (grid[at]) {
              if (grid[at] !== p.word[i]) {
                ok = false;
                break;
              }
              overlap++;
            }
            cells.push(at);
          }
          if (ok && overlap < p.word.length) options.push({ cells, dir: d, overlap });
        }
    }
    if (!options.length) continue;
    const crossing = options.filter((o) => o.overlap > 0);
    const pool = crossing.length && Math.random() < 0.5 ? crossing : options;
    const pick = pool[rand(pool.length)];
    pick.cells.forEach((at, i) => (grid[at] = p.word[i]));
    used += p.word.length - pick.overlap;
    entries.push({ ...p, cells: pick.cells, dir: pick.dir });
  }

  // the phrase goes into the leftover cells, spread out in reading order; the rest is noise
  const free = grid.map((g, i) => (g ? -1 : i)).filter((i) => i >= 0);
  const phraseCells: number[] = [];
  if (free.length >= PHRASE.length) {
    const step = free.length / PHRASE.length;
    for (let k = 0; k < PHRASE.length; k++) {
      const at = free[Math.floor(k * step + rand(Math.max(1, Math.floor(step))))];
      grid[at] = PHRASE[k];
      phraseCells.push(at);
    }
  }
  for (let i = 0; i < grid.length; i++) if (!grid[i]) grid[i] = ALPHABET[rand(26)];

  // examples: one straight and one diagonal word, already marked so the rules explain themselves
  // picked at random each round, so the same words aren't given away every time
  const short = shuffle(entries.filter((e) => e.word.length <= 8));
  const straight = short.find((e) => e.dir < 2);
  const diagonal = short.find((e) => e.dir >= 2);
  const examples = [straight, diagonal, ...short].filter((e, i, a): e is Entry => !!e && a.indexOf(e) === i).slice(0, EXAMPLES);

  entries.sort((a, b) => a.label.localeCompare(b.label));
  return {
    cols,
    rows,
    grid,
    entries,
    phraseCells,
    examples: examples.map((e) => e.word),
    hintOrder: shuffle(entries.map((e) => e.word)), // which words get hinted, in turn
  };
}

function examplesFound(round: ReturnType<typeof makeRound>) {
  return new Map(round.entries.filter((e) => round.examples.includes(e.word)).map((e) => [e.word, e.cells]));
}

// straight line of cells from a to b, or null if a..b isn't horizontal, vertical or diagonal
function lineBetween(a: number, b: number, cols: number): number[] | null {
  const r0 = Math.floor(a / cols);
  const c0 = a % cols;
  const dr = Math.floor(b / cols) - r0;
  const dc = (b % cols) - c0;
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null;
  const n = Math.max(Math.abs(dr), Math.abs(dc));
  const sr = Math.sign(dr);
  const sc = Math.sign(dc);
  return Array.from({ length: n + 1 }, (_, i) => (r0 + sr * i) * cols + c0 + sc * i);
}

export default function ToolboxWordHunt() {
  const gridRef = useRef<HTMLDivElement>(null);
  const colsFor = () => {
    const w = gridRef.current?.clientWidth ?? window.innerWidth - 64;
    return Math.max(MIN_COLS, Math.min(MAX_COLS, Math.floor(w / CELL)));
  };
  const [round, setRound] = useState(() => makeRound(Math.max(MIN_COLS, Math.min(MAX_COLS, Math.floor((Math.min(window.innerWidth, 1152) - 96) / CELL)))));
  // word -> cells the visitor marked; a short word can also turn up by chance away from where it was placed
  const [found, setFound] = useState<Map<string, number[]>>(() => examplesFound(round));
  const [drag, setDrag] = useState<{ from: number; to: number } | null>(null);
  const [miss, setMiss] = useState(false);
  const [reveal, setReveal] = useState(false); // "Show answers": unfound words drawn as if found
  const [lit, setLit] = useState(0); // phrase letters lit after the win

  const { cols, grid, entries, phraseCells, hintOrder } = round;
  const done = found.size === entries.length && entries.length > 0;
  const hints = useMemo(() => {
    const first = new Map(entries.map((e) => [e.word, e.cells[0]]));
    return new Set(hintOrder.filter((w) => !found.has(w)).slice(0, HINTS).map((w) => first.get(w)!));
  }, [entries, hintOrder, found]);

  const selection = useMemo(() => (drag ? (lineBetween(drag.from, drag.to, cols) ?? [drag.from]) : []), [drag, cols]);
  const answerCells = useMemo(() => {
    const m = new Map<number, string>();
    if (reveal) entries.forEach((e) => !found.has(e.word) && e.cells.forEach((c) => m.set(c, CAT_BY_ID[e.cat].color)));
    return m;
  }, [reveal, entries, found]);
  const foundCells = useMemo(() => {
    const m = new Map<number, string>();
    entries.forEach((e) => found.get(e.word)?.forEach((c) => m.set(c, CAT_BY_ID[e.cat].color)));
    return m;
  }, [entries, found]);

  // after the win, light the hidden phrase letter by letter
  useEffect(() => {
    if (!done) return setLit(0);
    if (lit >= phraseCells.length) return;
    const t = setTimeout(() => setLit((n) => n + 1), lit === 0 ? 500 : 160);
    return () => clearTimeout(t);
  }, [done, lit, phraseCells.length]);

  const cellAt = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const i = el?.dataset.cell;
    return i === undefined ? null : Number(i);
  };

  const finish = useCallback(() => {
    if (!drag) return;
    const cells = lineBetween(drag.from, drag.to, cols);
    setDrag(null);
    if (!cells || cells.length < 2) return;
    // the letters under the drag, read either way, must spell a word that's still missing
    const text = cells.map((c) => grid[c]).join("");
    const back = [...text].reverse().join("");
    const hit = entries.find((e) => !found.has(e.word) && (e.word === text || e.word === back));
    if (hit) {
      setFound((f) => new Map(f).set(hit.word, cells));
    } else {
      setMiss(true);
      setTimeout(() => setMiss(false), 300);
    }
  }, [drag, entries, found, cols, grid]);

  const newRound = () => {
    const next = makeRound(colsFor());
    setRound(next);
    setFound(examplesFound(next));
    setReveal(false);
  };

  // the first grid is sized from the window; once the real width is known, resize if it's off
  useEffect(() => {
    if (colsFor() !== cols) newRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="rounded-3xl bg-[#140a18] p-5 ring-1 ring-white/10 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-white/40">[ toolbox ]</p>
          <h2 className="font-dots mt-2 text-3xl leading-tight sm:text-4xl">Find my tools</h2>
          <p className="mt-2 max-w-xl text-[15px] text-white/60">
            Everything I build with is hidden in this wall: across, down or diagonally. Drag over a word to mark it.
            Two are already marked to show you how, and the glowing letters are where three more begin.
          </p>
        </div>
        <div className="flex gap-2 font-mono text-xs uppercase tracking-widest">
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            disabled={done}
            className="rounded-full border border-white/20 px-4 py-2 text-white/70 transition hover:border-white/50 hover:text-white disabled:opacity-30"
          >
            {reveal ? "Hide answers" : "Show answers"}
          </button>
          <button
            type="button"
            onClick={newRound}
            className="rounded-full border border-white/20 px-4 py-2 text-white/70 transition hover:border-white/50 hover:text-white"
          >
            New grid
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <div
          ref={gridRef}
          role="grid"
          aria-label="Word search grid"
          className={`grid select-none touch-none gap-0.5 rounded-2xl bg-black/30 p-1.5 transition-transform ${miss ? "animate-[shake_0.3s]" : ""}`}
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          onPointerDown={(e) => {
            const i = cellAt(e.clientX, e.clientY);
            if (i === null || done) return;
            (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
            setDrag({ from: i, to: i });
          }}
          onPointerMove={(e) => {
            if (!drag) return;
            const i = cellAt(e.clientX, e.clientY);
            if (i !== null && i !== drag.to && lineBetween(drag.from, i, cols)) setDrag({ ...drag, to: i });
          }}
          onPointerUp={finish}
          onPointerLeave={finish}
        >
          {grid.map((ch, i) => {
            // once everything is found the words fade out, so only the hidden phrase is lit
            // revealed answers look exactly like found words: filled squares in the category colour
            const color = done ? undefined : (foundCells.get(i) ?? answerCells.get(i));
            const selected = selection.includes(i);
            const phraseIdx = phraseCells.indexOf(i);
            const phraseOn = done && phraseIdx >= 0 && phraseIdx < lit;
            return (
              <div
                key={i}
                data-cell={i}
                className={`font-dots flex aspect-square items-center justify-center rounded text-sm leading-none transition-colors sm:text-base ${
                  selected
                    ? "bg-white text-[#140a18]"
                    : phraseOn
                      ? "bg-[#F97316] text-[#1C0E21]"
                      : color
                        ? "text-[#1C0E21]"
                        : hints.has(i)
                          ? "animate-pulse bg-white/30 text-white"
                          : done
                            ? "text-white/15"
                            : "text-white/80"
                }`}
                style={{
                  fontWeight: 800,
                  background: !selected && !phraseOn && color ? color : undefined,
                }}
              >
                {ch}
              </div>
            );
          })}
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-white/40">
            {found.size} / {entries.length} found
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-xs">
            {entries.map((e) => {
              const got = found.has(e.word);
              // same look as the education line under Career; a found word lights up in its category colour
              return (
                <li
                  key={e.word}
                  className="transition-colors"
                  style={{ color: got ? CAT_BY_ID[e.cat].color : "rgba(255,255,255,0.4)" }}
                >
                  {e.label}
                </li>
              );
            })}
          </ul>
          {done && (
            <div className="mt-6">
              <p className="font-dots text-2xl text-[#F97316] sm:text-3xl" style={{ fontWeight: 800 }}>
                All found. Read the orange letters.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 font-mono text-xs uppercase tracking-widest">
                <a
                  href="#contact"
                  className="rounded-full bg-[#F97316] px-5 py-3 font-bold text-[#1C0E21] transition hover:opacity-90"
                >
                  Go to contact →
                </a>
                <button
                  type="button"
                  onClick={newRound}
                  className="rounded-full border border-white/20 px-5 py-3 text-white/70 transition hover:border-white/50 hover:text-white"
                >
                  Play again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}`}</style>
    </section>
  );
}
