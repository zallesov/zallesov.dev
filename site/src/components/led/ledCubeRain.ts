// Cubes that fall into the contact plate, one per push, with real physics (Rapier, the same
// engine the old 3D toolbox used), drawn on an inverted LED grid: the plate stays orange and
// only the lamps a cube covers light up, dark on orange.
//
// Physics runs in "cube units" (a cube is about 1 unit across), the picture is a ray cast
// straight into the scene through every lamp. The bodies live in a thin slab: they can tumble
// in all three axes but cannot move in depth, so they pile up like a 2D stack.

import { lamp, type RGB } from "./ledCanvas";

type Rapier = typeof import("@dimforge/rapier3d-compat");
type World = InstanceType<Rapier["World"]>;
export type Body = ReturnType<World["createRigidBody"]>;

const DARK: RGB = [28, 14, 33];
const ORANGE: RGB = [249, 115, 22];
const LIGHT = (() => {
  const v = [-0.75, 0.5, -0.35]; // towards the light, same as the section-title cubes
  const l = Math.hypot(v[0], v[1], v[2]);
  return v.map((c) => c / l);
})();
const MAX_CUBES = 160;

/** document event: a cube left the contact plate through its open floor. detail: FallingCube */
export const FALL_OUT = "cubes:fall-out";
/** A cube in flight between two canvases, in client px (y down), px/s and the body's rotation. */
export interface FallingCube {
  x: number;
  y: number;
  vx: number;
  vy: number;
  half: number;
  rotation: { x: number; y: number; z: number; w: number };
  angvel: { x: number; y: number; z: number };
}

/** Lamp colour for a face lit `l` (0.45 dark side … 1 facing the light). */
export type Shade = (l: number) => RGB;
// on the orange plate the cubes are dark: the lit face is the darkest, the shadow side leans to orange
const ON_ORANGE: Shade = (l) => ORANGE.map((v, k) => Math.round(v + (DARK[k] - v) * l)) as RGB;

/** Lamp grid in cube units: `top` is the world y of the top edge of lamp row 0. */
export interface LedView {
  cols: number;
  rows: number;
  unit: number;
  pitch: number;
  top: number;
}

/**
 * Draws physics cubes into an LED grid: a ray straight into the scene through every lamp,
 * lit by face. The context must already be translated to lamp (0, 0).
 */
export function drawLedCubes(
  ctx: CanvasRenderingContext2D,
  cubes: { body: Body; half: number }[],
  { cols, rows, unit, pitch, top }: LedView,
  shade: Shade,
) {
  for (const { body, half } of cubes) {
    const t = body.translation();
    const reach = half * 1.75; // > half-diagonal of the cube
    const r0 = Math.max(0, Math.floor((top - t.y - reach) * unit));
    const r1 = Math.min(rows - 1, Math.ceil((top - t.y + reach) * unit));
    if (r0 > r1) continue; // off screen
    const c0 = Math.max(0, Math.floor((t.x - reach) * unit));
    const c1 = Math.min(cols - 1, Math.ceil((t.x + reach) * unit));
    // rotation matrix body → world from the quaternion
    const { x: qx, y: qy, z: qz, w: qw } = body.rotation();
    const m = [
      [1 - 2 * (qy * qy + qz * qz), 2 * (qx * qy - qz * qw), 2 * (qx * qz + qy * qw)],
      [2 * (qx * qy + qz * qw), 1 - 2 * (qx * qx + qz * qz), 2 * (qy * qz - qx * qw)],
      [2 * (qx * qz - qy * qw), 2 * (qy * qz + qx * qw), 1 - 2 * (qx * qx + qy * qy)],
    ];
    // view ray (0,0,1) in body space is the third row of m
    const d = [m[2][0], m[2][1], m[2][2]];
    for (let row = r0; row <= r1; row++) {
      const py = top - (row + 0.5) / unit - t.y;
      for (let col = c0; col <= c1; col++) {
        const px = (col + 0.5) / unit - t.x;
        // ray origin in body space: m^T * (px, py, -10)
        const o = [
          m[0][0] * px + m[1][0] * py + m[2][0] * -10,
          m[0][1] * px + m[1][1] * py + m[2][1] * -10,
          m[0][2] * px + m[1][2] * py + m[2][2] * -10,
        ];
        let tmin = -Infinity, tmax = Infinity, axis = 0, sign = 1;
        for (let a = 0; a < 3; a++) {
          const t1 = (-half - o[a]) / d[a];
          const t2 = (half - o[a]) / d[a];
          const near = Math.min(t1, t2), far = Math.max(t1, t2);
          if (near > tmin) { tmin = near; axis = a; sign = d[a] > 0 ? -1 : 1; }
          tmax = Math.min(tmax, far);
        }
        if (tmin > tmax) continue;
        // face normal in world space: column `axis` of m
        const diffuse = Math.max(0, sign * (m[0][axis] * LIGHT[0] + m[1][axis] * LIGHT[1] + m[2][axis] * LIGHT[2]));
        // a few steps like real LEDs
        lamp(ctx, col, row, pitch, shade(Math.max(0.45, Math.round((0.36 + 0.64 * diffuse) * 6) / 6)));
      }
    }
  }
}

let rapier: Promise<Rapier> | null = null;
export const loadRapier = () =>
  (rapier ??= import("@dimforge/rapier3d-compat").then(async (R) => {
    await R.init();
    return R;
  }));

/** `area` is the element whose pointer moves push the cubes around (the whole plate). */
export function cubeRain(canvas: HTMLCanvasElement, area: HTMLElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  let R: Rapier | null = null;
  let world: World | null = null;
  let walls: Body | null = null;
  let pusher: Body | null = null; // kinematic ball that follows the pointer, like the old toolbox
  let mouse: { x: number; y: number } | null = null; // pointer in cube units, null when outside
  const cubes: { body: Body; half: number }[] = [];
  let pending = 0; // pushes that came before the engine loaded
  let open = false; // the floor is gone: the pile falls out of the plate (into the footer)

  // grid: pitch px between lamps, `unit` lamps per cube unit
  let pitch = 7, unit = 8, cols = 0, rows = 0, ox = 0, w = 0, h = 0;
  let raf = 0;

  // floor and side walls follow the plate size
  const buildWalls = () => {
    if (!R || !world) return;
    if (walls) world.removeRigidBody(walls);
    const W = cols / unit, H = rows / unit;
    walls = world.createRigidBody(R.RigidBodyDesc.fixed());
    const box = (x: number, y: number, hx: number, hy: number) =>
      world!.createCollider(R!.ColliderDesc.cuboid(hx, hy, 5).setTranslation(x, y, 0).setFriction(0.8), walls!);
    if (!open) box(W / 2, -1, W, 1); // floor, its top at y = 0
    box(-1, H * 4, 1, H * 5); // left
    box(W + 1, H * 4, 1, H * 5); // right
    // cubes that ended up outside after a resize come back in
    for (const c of cubes) {
      const t = c.body.translation();
      const x = Math.min(W - c.half, Math.max(c.half, t.x));
      if (x !== t.x) c.body.setTranslation({ x, y: t.y + 1, z: 0 }, true);
    }
  };

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    if (!w || !h) return;
    pitch = w < 640 ? 5 : 7;
    unit = w < 640 ? 7 : 8;
    cols = Math.floor(w / pitch);
    rows = Math.floor(h / pitch);
    ox = (w - cols * pitch) / 2;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildWalls();
    wake();
    draw();
  };

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    // lamp rows count from the bottom edge, where the floor is
    ctx.translate(ox, h - rows * pitch);
    drawLedCubes(ctx, cubes, { cols, rows, unit, pitch, top: rows / unit }, ON_ORANGE);
    ctx.restore();
  };

  const awake = () => cubes.some((c) => !c.body.isSleeping());
  const loop = () => {
    pusher?.setNextKinematicTranslation(mouse ? { x: mouse.x, y: mouse.y, z: 0 } : { x: -50, y: -50, z: 0 });
    world!.step();
    if (open) {
      // fallen out of the bottom edge: handed over to the footer (ledCubeFall.ts) in screen pixels
      const r = canvas.getBoundingClientRect();
      const px = pitch * unit; // px per cube unit
      for (let i = cubes.length - 1; i >= 0; i--) {
        const { body, half } = cubes[i];
        const t = body.translation();
        if (t.y > -half) continue;
        const v = body.linvel();
        const detail: FallingCube = {
          x: r.left + ox + t.x * px,
          y: r.bottom - t.y * px,
          vx: v.x * px,
          vy: -v.y * px,
          half: half * px,
          rotation: body.rotation(),
          angvel: body.angvel(),
        };
        document.dispatchEvent(new CustomEvent(FALL_OUT, { detail }));
        world!.removeRigidBody(body);
        cubes.splice(i, 1);
      }
    }
    draw();
    // keep stepping while the pointer is over the plate, so it can shove the pile
    raf = awake() || mouse ? requestAnimationFrame(loop) : 0;
  };
  function wake() {
    if (!world || !cubes.length) return;
    if (reduced()) {
      // no animation: let the pile settle off screen and show where it ends up
      for (let i = 0; i < 600 && awake(); i++) world.step();
      draw();
    } else if (!raf) raf = requestAnimationFrame(loop);
  }

  const spawn = () => {
    if (!R || !world || !cols) return;
    const W = cols / unit, H = rows / unit;
    const half = 0.42 + Math.random() * 0.2;
    const x = half + Math.random() * (W - 2 * half);
    const rnd = () => Math.random() - 0.5;
    const q = { x: rnd(), y: rnd(), z: rnd(), w: rnd() };
    const ql = Math.hypot(q.x, q.y, q.z, q.w) || 1;
    const body = world.createRigidBody(
      R.RigidBodyDesc.dynamic()
        .setTranslation(x, H + half * 2, 0)
        .setRotation({ x: q.x / ql, y: q.y / ql, z: q.z / ql, w: q.w / ql })
        .setLinvel(rnd() * 3, -2, 0)
        .setAngvel({ x: rnd() * 8, y: rnd() * 8, z: rnd() * 8 })
        .enabledTranslations(true, true, false),
    );
    world.createCollider(R.ColliderDesc.cuboid(half, half, half).setFriction(0.7).setRestitution(0.25).setDensity(1), body);
    cubes.push({ body, half });
    // keep the pile bounded: the oldest cube goes away
    if (cubes.length > MAX_CUBES) world.removeRigidBody(cubes.shift()!.body);
    wake();
  };

  const start = () =>
    loadRapier().then((r) => {
      if (world) return;
      R = r;
      world = new r.World({ x: 0, y: -30, z: 0 });
      pusher = world.createRigidBody(
        r.RigidBodyDesc.kinematicPositionBased().setTranslation(-50, -50, 0).setCcdEnabled(true),
      );
      world.createCollider(r.ColliderDesc.ball(0.55), pusher);
      resize();
      for (; pending > 0; pending--) spawn();
    });

  // pointer → cube units (x from the left lamp column, y up from the floor)
  const toUnits = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left - ox) / (pitch * unit), y: (r.bottom - e.clientY) / (pitch * unit) };
  };
  if (!reduced()) {
    area.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return; // on touch a finger would sweep the pile on every scroll
      mouse = toUnits(e);
      if (world && cubes.length && !raf) raf = requestAnimationFrame(loop);
    });
    area.addEventListener("pointerleave", () => (mouse = null));
  }
  // clicking a cube kicks it up with a little spin
  area.addEventListener("click", (e) => {
    if (!world || (e.target as HTMLElement).closest("a,button")) return;
    const p = toUnits(e as PointerEvent);
    let hit: Body | null = null, best = Infinity;
    for (const c of cubes) {
      const t = c.body.translation();
      const dist = Math.hypot(t.x - p.x, t.y - p.y);
      if (dist < c.half * 1.4 && dist < best) { best = dist; hit = c.body; }
    }
    if (!hit) return;
    const m = hit.mass();
    hit.applyImpulse({ x: (Math.random() - 0.5) * 4 * m, y: 12 * m, z: 0 }, true);
    hit.applyTorqueImpulse({ x: (Math.random() - 0.5) * m, y: (Math.random() - 0.5) * m, z: (Math.random() - 0.5) * m }, true);
    wake();
  });

  new ResizeObserver(resize).observe(canvas);
  // fetch the engine (wasm) once the plate comes close, so the first push is instant
  new IntersectionObserver(
    ([e], io) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      start();
    },
    { rootMargin: "600px" },
  ).observe(canvas);

  return {
    /** Cubes in the plate now (and still to come once the engine loads). */
    count: () => cubes.length + pending,
    /** Opens the floor: the pile drops out of the bottom of the plate. */
    openFloor() {
      if (open) return;
      open = true;
      buildWalls();
      for (const c of cubes) c.body.wakeUp();
      wake();
    },
    drop() {
      if (world) spawn();
      else {
        pending++;
        start();
      }
    },
  };
}
