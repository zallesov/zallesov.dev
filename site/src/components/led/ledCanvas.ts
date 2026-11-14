// Small LED-lamp animations on a 2D canvas: a spinning cube made of lamps, used by the
// header logo and the section titles. No WebGL context, no library, no GIF.

export type RGB = [number, number, number];

/** The cube is drawn in a CUBE_ROWS × CUBE_ROWS window of lamps. */
export const CUBE_ROWS = 14;

const S = 0.5; // cube half-size
const VIEW = 0.98; // half of the view window; the cube's corner reaches 0.87
const LIGHT = norm([-0.75, 0.5, -0.35]); // towards the light, view space

function norm(v: number[]) {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
}

// rotation: yaw (spin) about Y, then a fixed tilt about X
function matrix(yaw: number, tilt: number) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cx = Math.cos(tilt), sx = Math.sin(tilt);
  return [
    [cy, 0, sy],
    [sx * sy, cx, -sx * cy],
    [-cx * sy, sx, cx * cy],
  ];
}
const mulT = (m: number[][], v: number[]) => [
  m[0][0] * v[0] + m[1][0] * v[1] + m[2][0] * v[2],
  m[0][1] * v[0] + m[1][1] * v[1] + m[2][1] * v[2],
  m[0][2] * v[0] + m[1][2] * v[1] + m[2][2] * v[2],
];
const mul = (m: number[][], v: number[]) => [
  m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
  m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
  m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
];

/** Brightness 0..1 of the cube seen through lamp (i, j), or -1 where there is no cube. */
function sample(m: number[][], i: number, j: number): number {
  const x = ((i + 0.5) / CUBE_ROWS * 2 - 1) * VIEW;
  const y = (1 - (j + 0.5) / CUBE_ROWS * 2) * VIEW;
  // orthographic ray along +z in view space, taken into cube space
  const o = mulT(m, [x, y, -3]);
  const d = mulT(m, [0, 0, 1]);
  let tmin = -Infinity, tmax = Infinity, axis = 0, sign = 1;
  for (let a = 0; a < 3; a++) {
    const t1 = (-S - o[a]) / d[a];
    const t2 = (S - o[a]) / d[a];
    const near = Math.min(t1, t2), far = Math.max(t1, t2);
    if (near > tmin) { tmin = near; axis = a; sign = d[a] > 0 ? -1 : 1; }
    tmax = Math.min(tmax, far);
  }
  if (tmin > tmax) return -1;
  const n = [0, 0, 0];
  n[axis] = sign;
  const nv = mul(m, n);
  const diffuse = Math.max(0, nv[0] * LIGHT[0] + nv[1] * LIGHT[1] + nv[2] * LIGHT[2]);
  return 0.36 + 0.64 * diffuse;
}

/** One lamp: a soft glow and a round core, sized from the pitch. */
export function lamp(ctx: CanvasRenderingContext2D, col: number, row: number, pitch: number, [r, g, b]: RGB) {
  const cx = (col + 0.5) * pitch, cy = (row + 0.5) * pitch;
  ctx.fillStyle = `rgba(${r},${g},${b},0.22)`;
  ctx.beginPath();
  ctx.arc(cx, cy, pitch * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.beginPath();
  ctx.arc(cx, cy, pitch * 0.367, 0, Math.PI * 2);
  ctx.fill();
}

/** Draws the spinning cube at the top-left of the canvas, in `color`. Only lit lamps are drawn. */
export function drawCube(ctx: CanvasRenderingContext2D, time: number, pitch: number, color: RGB, minLevel = 0.3) {
  const m = matrix(time * 0.0009, 0.62 + 0.12 * Math.sin(time * 0.0007));
  for (let j = 0; j < CUBE_ROWS; j++) {
    for (let i = 0; i < CUBE_ROWS; i++) {
      const b = sample(m, i, j);
      if (b < 0) continue;
      const l = Math.max(minLevel, Math.round(b * 6) / 6); // a few brightness steps, like real LEDs
      lamp(ctx, i, j, pitch, color.map((c) => Math.round(c * l)) as RGB);
    }
  }
}

/**
 * Sizes the canvas for `cols × rows` lamps and calls `draw(ctx, time)` every frame while it is
 * on screen. With reduced motion it draws one still frame.
 */
export function runLedCanvas(
  canvas: HTMLCanvasElement,
  cols: number,
  rows: number,
  pitch: number,
  draw: (ctx: CanvasRenderingContext2D, time: number) => void,
  animate = true,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const w = cols * pitch, h = rows * pitch;
  canvas.style.width = `${w}px`; // css max-width and height:auto may shrink it on narrow screens
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);

  const frame = (time: number) => {
    ctx.setTransform(canvas.width / w, 0, 0, canvas.height / h, 0, 0);
    ctx.clearRect(0, 0, w, h);
    draw(ctx, time);
  };

  // one still frame (also for reduced motion): 900 ms shows the cube at a good angle, three faces
  if (!animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    frame(900);
    return;
  }
  let raf = 0;
  const loop = (t: number) => {
    frame(t);
    raf = requestAnimationFrame(loop);
  };
  // animate only while visible
  new IntersectionObserver(([entry]) => {
    cancelAnimationFrame(raf);
    if (entry.isIntersecting) raf = requestAnimationFrame(loop);
  }).observe(canvas);
}
