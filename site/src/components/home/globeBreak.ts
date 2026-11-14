// The breakable globe in the Location block. The page ships the globe as an SVG (one <path> of
// zero-length round strokes per depth tier, plus the two cities); this reads the dots back out
// of it, hides it and redraws the same picture on a canvas. A fast pointer (mouse, or a finger
// dragged sideways) knocks the dots it touches off: they fly, fall to the bottom of the block
// and stay there. The line under the address blames the visitor; "Glue it back" restores it.

const CITY = "249,115,22";
/** Shown as the damage grows: [share of dots knocked off, line]. */
const BLAME: [number, string][] = [
  [0, "Hey! Careful, that's a planet."],
  [0.03, "Wow. Clumsy much?"],
  [0.12, "Great. Who's going to put that back?"],
  [0.3, "This is why we can't have nice things."],
  [0.55, "Congratulations. You broke the world."],
  [0.85, "There's nothing left. I hope you're proud."],
];
const GLUED = "Good as new. Don't touch it again.";

export function globeBreak(root: HTMLElement) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const svg = root.querySelector<SVGSVGElement>("[data-globe-svg]")!;
  const canvas = root.querySelector<HTMLCanvasElement>("[data-globe-canvas]")!;
  const blame = root.querySelector<HTMLElement>("[data-globe-blame]")!;
  const glue = root.querySelector<HTMLButtonElement>("[data-globe-glue]")!;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // ---- the dots, in SVG units (viewBox 0 0 600 600) ----
  const VIEW = svg.viewBox.baseVal.width || 600;
  const tiers: { r: number; alpha: number }[] = [];
  const hx: number[] = [], hy: number[] = [], tier: number[] = [];
  svg.querySelectorAll("path").forEach((p) => {
    const t = tiers.push({ r: Number(p.getAttribute("stroke-width")) / 2, alpha: Number(p.getAttribute("stroke-opacity")) }) - 1;
    for (const m of (p.getAttribute("d") ?? "").matchAll(/M(-?[\d.]+) (-?[\d.]+)h0/g)) {
      hx.push(Number(m[1]));
      hy.push(Number(m[2]));
      tier.push(t);
    }
  });
  const cities = [...svg.querySelectorAll<SVGGElement>("[data-city]")].map((g) => {
    const c = g.querySelector("circle")!;
    return { name: g.dataset.city!, x: Number(c.getAttribute("cx")), y: Number(c.getAttribute("cy")) };
  });
  // cities are dots too (the last ones), drawn in orange
  const firstCity = hx.length;
  cities.forEach((c) => (hx.push(c.x), hy.push(c.y), tier.push(-1)));
  const N = hx.length;
  const x = Float32Array.from(hx), y = Float32Array.from(hy);
  const vx = new Float32Array(N), vy = new Float32Array(N);
  const loose = new Uint8Array(N); // knocked off
  const still = new Uint8Array(N); // knocked off and lying on the floor
  let broken = 0;
  const named = new Set<string>(); // cities already blamed on the visitor

  // ---- geometry: the canvas covers the block, the globe sits where the SVG was ----
  let scale = 1, offX = 0, offY = 0, floor = 0, left = 0, right = 0, alpha = 1, w = 0, h = 0;
  const layout = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const box = root.getBoundingClientRect();
    svg.style.visibility = ""; // measure the real box, then hide it again
    const g = svg.getBoundingClientRect();
    alpha = Number(getComputedStyle(svg).opacity) || 1;
    svg.style.visibility = "hidden";
    w = box.width;
    h = box.height;
    Object.assign(canvas.style, { left: "0", top: "0", width: `${w}px`, height: `${h}px` });
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    scale = g.width / VIEW;
    offX = g.left - box.left;
    offY = g.top - box.top;
    // the block's edges in globe units
    floor = (h - offY) / scale;
    left = -offX / scale;
    right = (w - offX) / scale;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  };

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(offX, offY);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath();
    ctx.arc(VIEW / 2, VIEW / 2, VIEW / 2 - 1, 0, Math.PI * 2);
    ctx.stroke();
    tiers.forEach((t, k) => {
      ctx.fillStyle = `rgba(255,255,255,${t.alpha})`;
      ctx.beginPath();
      for (let i = 0; i < firstCity; i++) {
        if (tier[i] !== k) continue;
        ctx.moveTo(x[i] + t.r, y[i]);
        ctx.arc(x[i], y[i], t.r, 0, Math.PI * 2);
      }
      ctx.fill();
    });
    for (let i = firstCity; i < N; i++) {
      ctx.fillStyle = `rgba(${CITY},0.25)`;
      ctx.beginPath();
      ctx.arc(x[i], y[i], 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgb(${CITY})`;
      ctx.beginPath();
      ctx.arc(x[i], y[i], 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  // ---- physics: only knocked-off dots move ----
  const G = 1500; // units/s²
  let raf = 0, last = 0, gluing = false;
  const step = (now: number) => {
    const dt = Math.min(0.033, (now - last) / 1000 || 0.016);
    last = now;
    let moving = false;
    if (gluing) {
      // everything flies home
      const k = 1 - Math.exp(-dt * 7);
      let far = false;
      for (let i = 0; i < N; i++) {
        if (!loose[i]) continue;
        x[i] += (hx[i] - x[i]) * k;
        y[i] += (hy[i] - y[i]) * k;
        if (Math.abs(hx[i] - x[i]) + Math.abs(hy[i] - y[i]) > 0.3) far = true;
      }
      if (!far) {
        x.set(hx);
        y.set(hy);
        loose.fill(0);
        still.fill(0);
        broken = 0;
        named.clear();
        gluing = false;
        blame.textContent = GLUED;
        glue.classList.add("invisible");
      }
      moving = far;
    } else {
      for (let i = 0; i < N; i++) {
        if (!loose[i] || still[i]) continue;
        moving = true;
        vy[i] += G * dt;
        x[i] += vx[i] * dt;
        y[i] += vy[i] * dt;
        const r = 3;
        if (y[i] > floor - r) {
          // land: a small bounce, then lie still
          y[i] = floor - r;
          vy[i] *= -0.3;
          vx[i] *= 0.6;
          if (Math.abs(vy[i]) < 40) {
            vy[i] = 0;
            if (Math.abs(vx[i]) < 15) still[i] = 1;
          }
        }
        if (x[i] < left + r || x[i] > right - r) {
          x[i] = Math.min(right - r, Math.max(left + r, x[i]));
          vx[i] *= -0.4;
        }
      }
    }
    draw();
    raf = moving ? requestAnimationFrame(step) : 0;
  };
  const run = () => {
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(step);
    }
  };

  // ---- the pointer: a quick swipe knocks off what it touches ----
  let prev: { x: number; y: number; t: number } | null = null;
  const onMove = (e: PointerEvent) => {
    if (gluing) return;
    const g = svg.getBoundingClientRect();
    const p = { x: (e.clientX - g.left) / scale, y: (e.clientY - g.top) / scale, t: e.timeStamp };
    const before = prev;
    prev = p;
    if (!before) return;
    const dt = Math.max(1, p.t - before.t) / 1000;
    const pvx = (p.x - before.x) / dt, pvy = (p.y - before.y) / dt;
    const speed = Math.hypot(pvx, pvy);
    if (speed < 120) return; // resting or creeping: no harm done
    const reach = 26 / scale; // ~26 px around the pointer, whatever the globe's size
    let hit = 0;
    let city = "";
    for (let i = 0; i < N; i++) {
      if (loose[i]) continue;
      const dx = x[i] - p.x, dy = y[i] - p.y;
      const d = Math.hypot(dx, dy);
      if (d > reach) continue;
      loose[i] = 1;
      hit++;
      // carried along by the swipe, flung a bit outwards, with some scatter
      vx[i] = pvx * 0.45 + (dx / (d || 1)) * 140 + (Math.random() - 0.5) * 120;
      vy[i] = pvy * 0.45 + (dy / (d || 1)) * 140 - 120 - Math.random() * 160;
      if (i >= firstCity && !named.has(cities[i - firstCity].name)) city = cities[i - firstCity].name;
    }
    if (!hit) return;
    broken += hit;
    // knocking a city off beats everything else, once per city
    if (city) named.add(city);
    blame.textContent = city
      ? `You knocked ${city} off the map. I live there!`
      : BLAME.filter(([at]) => broken / N > at).pop()![1];
    glue.classList.remove("invisible");
    run();
  };

  root.addEventListener("pointermove", onMove);
  root.addEventListener("pointerleave", () => (prev = null));
  root.addEventListener("pointerdown", () => (prev = null)); // a new touch starts fresh
  glue.addEventListener("click", () => {
    gluing = true;
    blame.textContent = "Fine, fine. Gluing it back…";
    run();
  });

  new ResizeObserver(() => {
    layout();
    // after a resize, fallen dots land on the new floor
    still.fill(0);
    if (broken) run();
  }).observe(root);
}
