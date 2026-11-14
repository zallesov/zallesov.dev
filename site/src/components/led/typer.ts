// A tiny "someone is typing" engine: plays a script of editor actions over one
// or more lines and reports the text, caret and selection after each one.

export type TyperStep =
  | { type: string; fast?: boolean } // type characters at the caret
  | { line: number } // move the caret to the end of another line
  | { blink: number } // idle with a blinking caret, n blinks
  | { caret: "start" | "end" | number } // move the caret within the line
  | { del: number } // delete n characters after the caret
  | { back: number } // backspace n characters
  | { selectAll: number } // highlight the whole line, hold for n ms
  | { clear: true } // empty the line (e.g. after select all)
  | { wait: number }; // pause, caret steady

export interface TyperState {
  lines: string[];
  /** line the caret is on */
  line: number;
  caret: number;
  /** [from, to) of the highlighted range on the caret's line, or null */
  sel: [number, number] | null;
  caretOn: boolean;
}

const BLINK = 480; // ms per half-blink
const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("aborted", "AbortError"));
    });
  });

function apply(s: TyperState, step: TyperStep): void {
  const text = s.lines[s.line] ?? "";
  const set = (t: string) => (s.lines[s.line] = t);
  if ("type" in step) {
    set(text.slice(0, s.caret) + step.type + text.slice(s.caret));
    s.caret += step.type.length;
  } else if ("line" in step) {
    s.line = step.line;
    while (s.lines.length <= s.line) s.lines.push("");
    s.caret = s.lines[s.line].length;
    s.sel = null;
  } else if ("caret" in step) {
    s.caret = step.caret === "start" ? 0 : step.caret === "end" ? text.length : step.caret;
  } else if ("del" in step) {
    set(text.slice(0, s.caret) + text.slice(s.caret + step.del));
  } else if ("back" in step) {
    const n = Math.min(step.back, s.caret);
    set(text.slice(0, s.caret - n) + text.slice(s.caret));
    s.caret -= n;
  } else if ("clear" in step) {
    set("");
    s.caret = 0;
    s.sel = null;
  }
}

/** The lines the script ends with (for reduced motion and for search engines). */
export function finalLines(script: TyperStep[]): string[] {
  const s: TyperState = { lines: [""], line: 0, caret: 0, sel: null, caretOn: false };
  script.forEach((step) => apply(s, step));
  return s.lines;
}

/**
 * Plays `script`, calling `emit` after every visible change, then keeps the
 * caret blinking. Returns a cancel function.
 */
export function runTyper(
  script: TyperStep[],
  emit: (s: Readonly<TyperState>) => void,
  opts: { startDelay?: number; reducedMotion?: boolean } = {},
): () => void {
  const ctl = new AbortController();
  const s: TyperState = { lines: [""], line: 0, caret: 0, sel: null, caretOn: true };
  const out = () => emit({ ...s, lines: [...s.lines], sel: s.sel ? [...s.sel] : null });

  if (opts.reducedMotion) {
    script.forEach((step) => apply(s, step));
    s.caretOn = false;
    out();
    return () => ctl.abort();
  }

  (async () => {
    const sig = ctl.signal;
    const blink = async (n: number) => {
      for (let i = 0; i < n; i++) {
        s.caretOn = false;
        out();
        await sleep(BLINK, sig);
        s.caretOn = true;
        out();
        await sleep(BLINK, sig);
      }
    };
    out();
    await sleep(opts.startDelay ?? 0, sig);
    for (const step of script) {
      s.caretOn = true;
      if ("type" in step) {
        for (const ch of step.type) {
          apply(s, { type: ch });
          out();
          // human rhythm: a bit slower after spaces; "fast" for the quick lead-in
          const base = step.fast ? 28 : ch === " " ? 120 : 55;
          await sleep(base + Math.random() * (step.fast ? 20 : 70), sig);
        }
      } else if ("del" in step || "back" in step) {
        // like shift+← from the word's end: the highlight grows right to left, then one keypress wipes it
        const text = s.lines[s.line];
        const end = "del" in step ? Math.min(s.caret + step.del, text.length) : s.caret;
        const start = Math.max(0, end - ("del" in step ? step.del : step.back));
        s.caret = end;
        out();
        await sleep(90, sig);
        s.caretOn = false; // the block caret would hide the first highlighted letter
        for (let c = end - 1; c >= start; c--) {
          s.caret = c;
          s.sel = [c, end];
          out();
          await sleep(45 + Math.random() * 30, sig);
        }
        await sleep(260, sig);
        s.lines[s.line] = text.slice(0, start) + text.slice(end);
        s.caret = start;
        s.sel = null;
        s.caretOn = true;
        out();
        await sleep(120, sig);
      } else if ("blink" in step) {
        await blink(step.blink);
      } else if ("selectAll" in step) {
        s.sel = [0, s.lines[s.line].length];
        s.caretOn = false;
        out();
        await sleep(step.selectAll, sig);
      } else if ("wait" in step) {
        out();
        await sleep(step.wait, sig);
      } else {
        apply(s, step);
        out();
        await sleep("line" in step ? 120 : 180, sig);
      }
    }
    // idle: the caret keeps blinking at the end
    for (;;) await blink(1);
  })().catch((e) => {
    if ((e as Error).name !== "AbortError") throw e;
  });

  return () => ctl.abort();
}
