// Career descriptions start out as AI buzzword noise ("blah bla Agentic blah MCP...") laid over
// the real text, word for word with the same lengths, so the layout doesn't move. Hovering an
// item morphs the noise into the real text letter by letter; leaving morphs it back.
//
// The real text stays in the DOM the whole time (only made transparent), so screen readers,
// search engines and no-JS visitors always get it. The noise lives in an aria-hidden overlay.

// buzzwords by length; "blah" fillers repeat so they show up more often than the brand names
const WORDS: Record<number, string[]> = {
  2: ["AI", "AI", "bl"],
  3: ["bla", "bla", "bla", "bla", "LLM", "MCP"],
  4: ["blah", "blah", "blah", "blah", "LLMs"],
  5: ["Agent", "Codex", "blahh"],
  6: ["blabla", "blabla", "Gemini", "agents", "Claude"],
  7: ["blahbla", "blahbla", "Agentic", "agentic"],
  8: ["bla-blah", "bla-blah", "LLM-blah"],
  9: ["blah-blah", "blah-blah", "AI-agents"],
  13: ["Orchestration", "orchestration"],
};
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

// noise word of exactly n characters; long ones are glued from shorter ones with hyphens
const fake = (n: number): string => {
  if (n <= 1) return "b".slice(0, n);
  if (WORDS[n]) return pick(WORDS[n]);
  const parts = Object.keys(WORDS).map(Number).filter((a) => n - 1 - a >= 2);
  const a = pick(parts);
  return `${fake(a)}-${fake(n - 1 - a)}`;
};

// replace every word with noise of the same length, keeping spaces and punctuation around it
const noise = (text: string) => {
  const tokens = text.split(/(\s+)/);
  for (let i = 0; i < tokens.length; i += 2) {
    const m = tokens[i].match(/^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u);
    if (!m || m[2].length < 2) continue; // "a", "I" stay as they are
    const [, pre, core, post] = m;
    // non-breaking hyphens, so a noise word wraps as one piece like the real word under it
    let word = fake(core.length).replace(/-/g, "‑");
    // "Claude Code" needs two neighbouring words of 6 and 4 letters
    const next = tokens[i + 2]?.match(/^(\p{L}{4})([^\p{L}\p{N}]*)$/u);
    const pair = core.length === 6 && !post && !!next && tokens[i + 1] === " " && Math.random() < 0.6;
    if (pair) {
      tokens[i + 2] = "Code" + next![2];
      word = "Claude";
    }
    if (/^\p{Lu}/u.test(core)) word = word[0].toUpperCase() + word.slice(1);
    tokens[i] = pre + word + post;
    if (pair) i += 2;
  }
  return tokens.join("");
};

const GLYPHS = "abcdeghilmnorstAGILMCX";
const isLetter = (c: string) => /[\p{L}\p{N}]/u.test(c);

function setup(wrap: HTMLElement) {
  const overlay = document.createElement("div");
  overlay.className = "blah-overlay";
  overlay.setAttribute("aria-hidden", "true");
  for (const child of [...wrap.children]) overlay.appendChild(child.cloneNode(true));
  overlay.querySelectorAll("a").forEach((a) => a.removeAttribute("href"));
  wrap.appendChild(overlay);

  const texts: { node: Text; real: string; fake: string }[] = [];
  const walker = document.createTreeWalker(overlay, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const node = n as Text;
    if (!node.data.trim()) continue;
    const real = node.data;
    texts.push({ node, real, fake: noise(real) });
    node.data = texts[texts.length - 1].fake;
  }
  wrap.dataset.blah = "fake";

  const total = texts.reduce((s, t) => s + t.real.length, 0);
  let raf = 0;

  // noise can wrap onto an extra line and spill over what comes next: roll new noise until it
  // fits the real text's box (checked whenever the box changes size: opening, resizing)
  // each paragraph / list item of the noise is matched against the same one in the real text
  const SEL = "p, li";
  const realBoxes = [...wrap.querySelectorAll<HTMLElement>(SEL)].filter((el) => !overlay.contains(el));
  const fakeBoxes = [...overlay.querySelectorAll<HTMLElement>(SEL)];
  const fit = () => {
    if (raf || wrap.dataset.blah !== "fake" || !overlay.clientHeight) return;
    fakeBoxes.forEach((box, k) => {
      const limit = realBoxes[k]?.offsetHeight ?? Infinity;
      const own = texts.filter((t) => box.contains(t.node));
      for (let i = 0; i < 30 && box.offsetHeight > limit; i++) {
        for (const t of own) t.node.data = t.fake = noise(t.real);
      }
    });
  };
  new ResizeObserver(fit).observe(wrap);

  const morph = (to: "real" | "fake") => {
    cancelAnimationFrame(raf);
    wrap.dataset.blah = "fake"; // the overlay does the animation
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      for (const t of texts) t.node.data = t[to];
      wrap.dataset.blah = to;
      return;
    }
    // each letter starts flickering a bit after the one before it, then lands on its target
    const spread = Math.min(700, 120 + total * 2.5);
    const from = texts.map((t) => t.node.data);
    const starts = texts.map((t, k) => {
      const offset = texts.slice(0, k).reduce((s, x) => s + x.real.length, 0);
      return [...t.real].map((_, i) => ((offset + i) / total) * spread + Math.random() * 60);
    });
    const FLICKER = 90;
    const t0 = performance.now();
    const frame = (now: number) => {
      const el = now - t0;
      let done = true;
      texts.forEach((t, k) => {
        const src = from[k], dst = t[to];
        let s = "";
        for (let i = 0; i < dst.length; i++) {
          const a = src[i], b = dst[i];
          const st = starts[k][i];
          if (a === b || el >= st + FLICKER) s += b;
          else {
            done = false;
            s += el < st ? a : isLetter(b) ? GLYPHS[Math.floor(Math.random() * GLYPHS.length)] : b;
          }
        }
        t.node.data = s;
      });
      if (done) {
        wrap.dataset.blah = to; // real: hand back to the original text, so links work
        raf = 0;
      } else raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  };
  return morph;
}

/** Turn every `[data-blah]` block into noise; hovering its `[data-blah-item]` reveals it. */
export function blahText(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>("[data-blah-item]").forEach((item) => {
    const morphs = [...item.querySelectorAll<HTMLElement>("[data-blah]")].map(setup);
    if (!morphs.length) return;
    let shown = false;
    const show = (v: boolean) => {
      if (v === shown) return;
      shown = v;
      morphs.forEach((m) => m(v ? "real" : "fake"));
    };
    item.addEventListener("pointerenter", () => show(true));
    // a finger "leaves" right after the tap, so on touch the text stays revealed
    item.addEventListener("pointerleave", (e) => e.pointerType === "mouse" && show(false));
    item.addEventListener("focusin", () => show(true));
    item.addEventListener("focusout", (e) => !item.contains(e.relatedTarget as Node) && show(false));
  });
}
