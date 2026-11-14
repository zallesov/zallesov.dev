// The page's bottomless footer: the cubes that fall out of the contact plate land in it and keep falling while
// you scroll. A screen-sized canvas sticks to the viewport inside a tall footer and looks into
// one physics world; the floor is the bottom edge of the screen at the deepest point you have scrolled to, so every bit
// of scroll drops the pile a bit further, until the real ground at the end of the footer.
//
// Same engine and LED rendering as the contact plate (ledCubeRain.ts), lit orange on dark.

import { drawLedCubes, FALL_OUT, loadRapier, type Body, type FallingCube, type Shade } from "./ledCubeRain";
import type { RGB } from "./ledCanvas";

const DARK: RGB = [20, 10, 24];
const ORANGE: RGB = [249, 115, 22];
// on the dark page the lit face is the brightest
const MAX = 160; // cubes kept in the footer; the oldest goes away
const ON_DARK: Shade = (l) => DARK.map((v, k) => Math.round(v + (ORANGE[k] - v) * l)) as RGB;

/**
 * `footer` is the tall element, `canvas` sits in its sticky screen-high child. Cubes arrive as
 * FALL_OUT events from the contact plate, at the same screen spot, speed and spin.
 */
export function cubeFall(footer: HTMLElement, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx || matchMedia("(prefers-reduced-motion: reduce)").matches) return null;

  type R = Awaited<ReturnType<typeof loadRapier>>;
  let R: R | null = null;
  let world: InstanceType<R["World"]> | null = null;
  let walls: Body | null = null;
  let floor: Body | null = null;
  const cubes: { body: Body; half: number }[] = [];
  const queue: FallingCube[] = []; // arrived before the engine loaded
  let loading = false;

  let pitch = 7, unit = 8, cols = 0, rows = 0, ox = 0, w = 0, h = 0;
  let raf = 0;
  let deepest = 0; // lowest the bottom of the screen has been, in px below the footer top
  let visible = false; // footer on screen

  /** px scrolled into the footer: 0 while its top is at the top of the screen or below. */
  const depth = () => Math.max(0, Math.min(footer.offsetHeight - innerHeight, -footer.getBoundingClientRect().top));
  const toUnits = (px: number) => px / (pitch * unit);
  /** World y of the top of the screen (y up, 0 = footer top). */
  const camTop = () => -toUnits(depth());
  /** px from the footer top down to the bottom of the screen, within the footer. */
  const screenBottom = () => Math.max(0, Math.min(footer.offsetHeight, innerHeight - footer.getBoundingClientRect().top));
  const floorY = () => -toUnits(deepest);

  const buildWalls = () => {
    if (!R || !world) return;
    if (walls) world.removeRigidBody(walls);
    const W = cols / unit;
    const H = toUnits(footer.offsetHeight) + 50;
    walls = world.createRigidBody(R.RigidBodyDesc.fixed());
    for (const x of [-1, W + 1]) world.createCollider(R.ColliderDesc.cuboid(1, H, 5).setTranslation(x, -H / 2 + 20, 0), walls);
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
    kick();
  };

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(ox, (h - rows * pitch) / 2);
    drawLedCubes(ctx, cubes, { cols, rows, unit, pitch, top: camTop() }, ON_DARK);
    ctx.restore();
  };

  /** A cube from the plate: client px → this world's units, at the same spot on screen. */
  const receive = (c: FallingCube) => {
    if (!R || !world) return void queue.push(c);
    const r = canvas.getBoundingClientRect();
    const px = pitch * unit;
    const half = c.half / px;
    const W = cols / unit;
    const x = Math.min(W - half, Math.max(half, (c.x - r.left - ox) / px));
    const y = camTop() - (c.y - r.top - (h - rows * pitch) / 2) / px;
    const body = world.createRigidBody(
      R.RigidBodyDesc.dynamic()
        .setTranslation(x, y, 0)
        .setRotation(c.rotation)
        .setLinvel(c.vx / px, -c.vy / px, 0)
        .setAngvel(c.angvel)
        .enabledTranslations(true, true, false)
        .setCcdEnabled(true),
    );
    world.createCollider(R.ColliderDesc.cuboid(half, half, half).setFriction(0.7).setRestitution(0.25).setDensity(1), body);
    cubes.push({ body, half });
    if (cubes.length > MAX) world.removeRigidBody(cubes.shift()!.body);
    kick();
  };

  const loop = () => {
    raf = 0;
    if (!world || !floor) return;
    // the floor only goes down: scrolling back up shows where the pile was left
    deepest = Math.max(deepest, screenBottom());
    floor.setNextKinematicTranslation({ x: 0, y: floorY() - 1, z: 0 });
    // stragglers left far above the screen (fast scroll) drop back in from its top edge
    const top = camTop();
    for (const c of cubes) {
      const t = c.body.translation();
      if (t.y > top + 6) c.body.setTranslation({ x: t.x, y: top + 1.5, z: 0 }, true);
    }
    world.step();
    draw();
    const busy = cubes.some((c) => !c.body.isSleeping());
    if (busy && visible) raf = requestAnimationFrame(loop);
  };
  const kick = () => {
    if (world && !raf && visible) raf = requestAnimationFrame(loop);
  };

  const start = async () => {
    if (loading) return;
    loading = true;
    R = await loadRapier();
    world = new R.World({ x: 0, y: -30, z: 0 });
    floor = world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased());
    world.createCollider(R.ColliderDesc.cuboid(500, 1, 5).setFriction(0.8), floor);
    resize();
    deepest = Math.max(deepest, screenBottom());
    floor.setTranslation({ x: 0, y: floorY() - 1, z: 0 }, true);
    queue.splice(0).forEach(receive);
  };

  new ResizeObserver(resize).observe(canvas);
  addEventListener("scroll", kick, { passive: true });
  document.addEventListener(FALL_OUT, (e) => receive((e as CustomEvent<FallingCube>).detail));
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    kick();
  }).observe(footer);

  return {
    /** Load the engine ahead of the first cube. Safe to call twice. */
    prepare: start,
    /** Deepest point scrolled to, as a fraction of the fall (0…1). */
    progress: () => deepest / Math.max(1, footer.offsetHeight),
  };
}
