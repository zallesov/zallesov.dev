import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import PostFX, { type FxMode, type LedTextBitmap } from "../toolbox/PostFX";
import {
  CH,
  charStart,
  drawLedLine,
  fillLamps,
  fixedLedText,
  layoutLedText,
  makeLedTextBitmap,
  wrap,
  type LedGrid,
  type PlacedLedText,
} from "../led/ledText";
import { LED_FONTS, textWidth, type LedFont, type LedFontId } from "../led/font5x7";
import { runTyper, type TyperState, type TyperStep } from "../led/typer";

// Dev only: this module holds live WebGL/animation state that React Fast Refresh can't hot-swap
// cleanly (it left frozen beams and a lost LED layer). Reload the whole page instead.
if (import.meta.hot) import.meta.hot.accept(() => window.location.reload());

const BG = "#140a18";
const ORANGE = "#F97316";
const PURPLES = ["#3a2447", "#4c2f5d", "#5f3b73", "#7a4a94"];
const CAMERA_Z = 10;
const FOV = 45;
const LED_PITCH = 5; // css px between lamps

interface Spec {
  position: [number, number, number];
  size: number;
  color: string;
  /** rotation speed around x/y/z, rad/s */
  spin: [number, number, number];
  /** start rotation */
  rotation: [number, number, number];
}

/** Small deterministic PRNG so the layout is the same on every load. */
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

/** Half-width / half-height of the view at distance `d` from the camera. */
function frustumAt(d: number, aspect: number) {
  const halfH = d * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  return { halfW: halfH * aspect, halfH };
}

function useCubes(): Spec[] {
  const { size } = useThree();
  const aspect = size.width / size.height;
  return useMemo(() => {
    const r = rng(7);
    const cubes: Spec[] = [];
    const spinOf = (k: number): [number, number, number] => [
      (r() - 0.5) * k,
      (r() - 0.5) * k * 1.4,
      (r() - 0.5) * k * 0.6,
    ];
    const rotOf = (): [number, number, number] => [r() * Math.PI, r() * Math.PI, r() * Math.PI];

    // the hero cube: on the right, very close to the camera
    const heroDist = 4.2;
    const near = frustumAt(heroDist, aspect);
    const heroSize = Math.min(2.1, near.halfH * 0.9);
    cubes.push({
      position: [near.halfW * 0.62, -near.halfH * 0.08, CAMERA_Z - heroDist],
      size: heroSize,
      color: ORANGE,
      spin: [0.18, 0.32, 0.06],
      rotation: [0.5, 0.6, 0.1],
    });

    // the rest: scattered through the depth, spread to fill the frame at their own distance
    const count = 34;
    for (let i = 0; i < count; i++) {
      const dist = 7 + r() * 30; // distance from camera
      const f = frustumAt(dist, aspect);
      cubes.push({
        position: [(r() * 2 - 1) * f.halfW * 1.05, (r() * 2 - 1) * f.halfH * 1.05, CAMERA_Z - dist],
        size: 0.35 + r() * 0.9,
        color: r() < 0.14 ? ORANGE : PURPLES[Math.floor(r() * PURPLES.length)],
        spin: spinOf(0.9),
        rotation: rotOf(),
      });
    }
    return cubes;
  }, [aspect]);
}

// ---------- chain reaction: a cube charges up, shoots a beam into the next, and so on ----------

const GLOW = new THREE.Color("#FF8A2A");
const BEAM_COLOR = new THREE.Color("#FFD9A8");
const BEAMS = 40; // pooled beam meshes (a clicked cascade can have many in flight)
const CHAIN = {
  firstDelay: 1.5, // s after load before the first chain
  gapMin: 2, // s between chains
  gapMax: 4,
  charge: 1.3, // s the first cube glows and shakes before firing
  relay: 0.07, // s a hit cube charges before firing on
  travel: 0.09, // s for a beam to reach its target
  fade: 0.35, // s for a beam to fade after arrival
  cool: 0.7, // s for a cube's glow to die down after firing
  maxHops: 7,
};

// clicking a cube sets off a cascade: it fires at its nearest neighbours, each of them fires on
const CASCADE = {
  first: 3, // beams from the clicked cube
  next: 2, // beams from every cube it hits
  waves: 5, // how far it spreads
  delay: 0.22, // s between a hit and that cube firing on
  reach: 0.9, // max screen distance to a neighbour (NDC, x scaled by aspect)
};

interface Beam {
  from: THREE.Vector3;
  /** Target node: a cube index, or cubes.length + k for virtual node k; -1 = `exit`. */
  to: number;
  exit: THREE.Vector3;
  start: number;
}

const VIRTUAL_NODES = 16;

// a beam hitting a cube knocks it along the beam's direction; the push dies out slowly
const KNOCK = {
  speed: 1.1, // units/s given to a cube of size 1 (smaller cubes fly further)
  spin: 1.4, // rad/s of extra spin
  damping: 1.1, // 1/s, how fast the push dies out
  home: 0.35, // 1/s², pull back to the cube's place: hits must not pile up and carry cubes away
  maxOffset: 2.2, // units a cube may be pushed from its place at most
  depth: 0.2, // share of the push along the view axis: cubes mostly move across the screen, not at the camera
  nearest: 5, // a small cube never comes closer to the camera than this (the big one keeps its own place)
  recoil: 1.3, // the cube that starts a chain kicks back this much harder than a hit
};

// beams light up the cubes around them: a few point lights ride along the newest beams
const LIGHT_COLOR = new THREE.Color("#FFB070");
const BEAM_LIGHTS = 4; // 2 beams × (head + middle)
const BEAM_LIGHT = { intensity: 300, distance: 22, decay: 2 };
const CHARGE_LIGHT = { intensity: 140, distance: 16, decay: 2 };

/**
 * Invisible nodes just outside the frame, at assorted depths. Chains can start
 * from them (a beam flies in from off-screen) and end in them.
 */
function useVirtualNodes(): THREE.Vector3[] {
  const { size } = useThree();
  const aspect = size.width / size.height;
  return useMemo(() => {
    const r = rng(11);
    return Array.from({ length: VIRTUAL_NODES }, (_, k) => {
      const dist = 8 + r() * 24;
      const f = frustumAt(dist, aspect);
      // spread evenly around the frame, pushed ~25% beyond its edge
      const a = (k / VIRTUAL_NODES) * Math.PI * 2 + (r() - 0.5) * 0.3;
      const ex = Math.cos(a);
      const ey = Math.sin(a);
      const k2 = 1.25 / Math.max(Math.abs(ex), Math.abs(ey));
      return new THREE.Vector3(ex * k2 * f.halfW, ey * k2 * f.halfH, CAMERA_Z - dist);
    });
  }, [aspect]);
}

interface Hit {
  cube: number;
  at: number;
  dir: THREE.Vector3;
}

interface ChainState {
  /** beams still in flight that will knock their target on arrival */
  hits: Hit[];
  /** the next shot is the chain's first: its cube recoils */
  firstShot: boolean;
  nextAt: number;
  /** cube currently charging, -1 when idle */
  cur: number;
  chargeStart: number;
  chargeDur: number;
  dir: THREE.Vector2;
  hops: number;
  visited: Set<number>;
  /** per-cube time it fired, for the cool-down glow */
  firedAt: Map<number, number>;
  beams: Beam[];
}

function Cubes({ animate }: { animate: boolean }) {
  const cubes = useCubes();
  const virtual = useVirtualNodes();
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const beamRefs = useRef<(THREE.Mesh | null)[]>([]);
  // fixed set of lights whose intensity we animate; never added/removed, so shaders don't recompile
  const beamLights = useRef<(THREE.PointLight | null)[]>([]);
  const chargeLight = useRef<THREE.PointLight>(null);
  const { camera, size, gl } = useThree();

  const geometry = useMemo(() => new RoundedBoxGeometry(1, 1, 1, 3, 0.12), []);
  const beamGeometry = useMemo(() => new THREE.CylinderGeometry(1, 1, 1, 6, 1, true), []);
  // one material per cube so each can glow on its own; a faint emissive base keeps
  // the shaded sides from sinking into the background
  const materials = useMemo(
    () =>
      cubes.map(
        (c) =>
          new THREE.MeshStandardMaterial({
            color: c.color,
            roughness: 0.45,
            metalness: 0.05,
            emissive: new THREE.Color(c.color),
            emissiveIntensity: 0.22,
          }),
      ),
    [cubes],
  );
  const beamMaterials = useMemo(
    () =>
      Array.from(
        { length: BEAMS },
        () =>
          new THREE.MeshBasicMaterial({
            color: BEAM_COLOR,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            toneMapped: false,
          }),
      ),
    [],
  );
  useEffect(
    () => () => {
      geometry.dispose();
      beamGeometry.dispose();
      materials.forEach((m) => m.dispose());
      beamMaterials.forEach((m) => m.dispose());
    },
    [geometry, beamGeometry, materials, beamMaterials],
  );

  const simTime = useRef(0);
  // clicked cascades: cubes due to fire, and every cube already in the current cascade
  const cascade = useRef({ due: [] as { cube: number; at: number; wave: number }[], visited: new Set<number>() });
  const chain = useRef<ChainState>({
    nextAt: CHAIN.firstDelay,
    cur: -1,
    chargeStart: 0,
    chargeDur: 0,
    dir: new THREE.Vector2(),
    hops: 0,
    visited: new Set(),
    firedAt: new Map(),
    beams: [],
    hits: [],
    firstShot: false,
  });

  // per-cube knock-back state: offset from the home position, velocity, extra spin
  const knock = useMemo(
    () =>
      cubes.map(() => ({
        offset: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        spin: new THREE.Vector3(),
      })),
    [cubes],
  );

  // scratch objects, reused every frame
  const tmp = useMemo(
    () => ({
      v: new THREE.Vector3(),
      a: new THREE.Vector3(),
      b: new THREE.Vector3(),
      up: new THREE.Vector3(0, 1, 0),
      q: new THREE.Quaternion(),
    }),
    [],
  );

  /** World position of a node: a cube, or a virtual off-screen point. */
  const posOf = (i: number): THREE.Vector3 | null =>
    i >= cubes.length ? virtual[i - cubes.length] : (refs.current[i]?.position ?? null);

  /** Screen position in NDC with x scaled by aspect, so distances are isotropic. */
  const screenOf = (i: number, out: THREE.Vector2) => {
    const pos = posOf(i);
    if (!pos) return null;
    tmp.v.copy(pos).project(camera);
    if (tmp.v.z > 1) return null;
    return out.set(tmp.v.x * (size.width / size.height), tmp.v.y);
  };
  const onScreen = (i: number) => {
    const m = refs.current[i];
    if (!m) return false;
    tmp.v.copy(m.position).project(camera);
    return Math.abs(tmp.v.x) < 0.85 && Math.abs(tmp.v.y) < 0.85 && tmp.v.z < 1;
  };

  // click (or tap) on a cube: raycast from the camera, start a cascade from the cube hit
  useEffect(() => {
    if (!animate) return;
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const hero = gl.domElement.closest("section");
    const cubeAt = (e: PointerEvent) => {
      if ((e.target as Element | null)?.closest?.("a,button,input,textarea")) return -1;
      const r = gl.domElement.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return -1;
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const meshes = refs.current.filter((m): m is THREE.Mesh => !!m);
      const hit = ray.intersectObjects(meshes, false)[0];
      return hit ? refs.current.indexOf(hit.object as THREE.Mesh) : -1;
    };
    const onDown = (e: PointerEvent) => {
      const i = cubeAt(e);
      if (i < 0) return;
      const cas = cascade.current;
      if (!cas.due.length) cas.visited.clear(); // a fresh cascade; a click mid-cascade joins it
      cas.visited.add(i);
      cas.due.push({ cube: i, at: simTime.current, wave: 0 });
      // the clicked cube jolts back a little
      const kb = knock[i];
      kb.vel.add(new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, -0.6).multiplyScalar(KNOCK.speed));
      kb.spin.addScalar((Math.random() - 0.5) * KNOCK.spin);
    };
    // the cursor says the cubes are clickable
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && hero) hero.style.cursor = cubeAt(e) >= 0 ? "pointer" : "";
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      if (hero) hero.style.cursor = "";
    };
  }, [animate, camera, gl, knock]);

  useFrame((_, delta) => {
    if (!animate) return;
    // own clock, not state.clock: R3F resets that one to 0 whenever the frameloop changes (the hero
    // pauses off screen), and beams/charges stamped with the old time then hang on screen for minutes
    const dt = Math.min(delta, 0.1);
    const t = (simTime.current += dt);
    const ch = chain.current;

    // ---- chain logic ----
    /** The cube that starts a chain kicks back, away from where it shot. */
    const recoil = (from: number, toward: THREE.Vector3) => {
      if (!ch.firstShot) return;
      ch.firstShot = false;
      if (from >= cubes.length) return; // virtual nodes have nothing to push
      const c = cubes[from];
      const kb = knock[from];
      const mass = Math.max(0.6, c.size);
      const dir = posOf(from)!.clone().sub(toward).normalize();
      dir.z *= KNOCK.depth;
      kb.vel.addScaledVector(dir, (KNOCK.speed * KNOCK.recoil) / mass);
      kb.spin.x += ((Math.random() - 0.5) * KNOCK.spin) / mass;
      kb.spin.y += ((Math.random() - 0.5) * KNOCK.spin) / mass;
    };
    const fire = (from: number) => {
      ch.firedAt.set(from, t);
      ch.visited.add(from);
      const src = { position: posOf(from)! };
      const p0 = new THREE.Vector2();
      screenOf(from, p0);
      // next target: an unvisited on-screen cube roughly ahead, not too far
      let best = -1;
      let bestScore = Infinity;
      const p = new THREE.Vector2();
      if (ch.hops < CHAIN.maxHops) {
        cubes.forEach((_, k) => {
          if (ch.visited.has(k) || !onScreen(k) || !screenOf(k, p)) return;
          p.sub(p0);
          const d = p.length();
          if (d < 0.15 || d > 1.1) return;
          const ahead = p.dot(ch.dir) / d;
          if (ahead < 0.55) return;
          const score = d * (1.6 - ahead) * (0.8 + Math.random() * 0.4);
          if (score < bestScore) {
            bestScore = score;
            best = k;
          }
        });
      }
      // nothing on screen ahead (or the chain is long enough): leave through the virtual node most ahead
      if (best < 0 && from < cubes.length) {
        let bestAhead = 0.3;
        virtual.forEach((_, v) => {
          const k = cubes.length + v;
          if (!screenOf(k, p)) return;
          p.sub(p0);
          const ahead = p.dot(ch.dir) / Math.max(p.length(), 1e-3);
          if (ahead > bestAhead) {
            bestAhead = ahead;
            best = k;
          }
        });
        if (best >= 0) {
          recoil(from, posOf(best)!);
          const beam: Beam = { from: src.position.clone(), to: best, exit: new THREE.Vector3(), start: t };
          ch.beams.push(beam);
          if (ch.beams.length > BEAMS) ch.beams.shift();
          ch.cur = -1;
          ch.nextAt = t + CHAIN.gapMin + Math.random() * (CHAIN.gapMax - CHAIN.gapMin);
          return;
        }
      }
      const beam: Beam = { from: src.position.clone(), to: best, exit: new THREE.Vector3(), start: t };
      if (best >= 0) {
        recoil(from, posOf(best)!);
        // the target gets knocked along the beam when it arrives
        ch.hits.push({ cube: best, at: t + CHAIN.travel, dir: posOf(best)!.clone().sub(src.position).normalize() });
        screenOf(best, p);
        // bend the heading a little towards where we actually went, so the chain wanders
        ch.dir.lerp(p.sub(p0).normalize(), 0.5).normalize();
        ch.cur = best;
        ch.chargeStart = t + CHAIN.travel;
        ch.chargeDur = CHAIN.relay;
        ch.hops++;
      } else {
        // nothing ahead: shoot off the screen along the heading, at the source's depth
        const dist = camera.position.z - src.position.z;
        const f = frustumAt(dist, size.width / size.height);
        beam.exit.set(
          src.position.x + ch.dir.x * f.halfW * 3,
          src.position.y + ch.dir.y * f.halfH * 3,
          src.position.z,
        );
        recoil(from, beam.exit);
        ch.cur = -1;
        ch.nextAt = t + CHAIN.gapMin + Math.random() * (CHAIN.gapMax - CHAIN.gapMin);
      }
      ch.beams.push(beam);
      if (ch.beams.length > BEAMS) ch.beams.shift();
    };

    if (ch.cur < 0 && t >= ch.nextAt) {
      // start a new chain: half the time from an off-screen virtual node (the beam flies in),
      // otherwise from a random on-screen cube that first charges up; either way heading across
      const fromVirtual = Math.random() < 0.5;
      const candidates = fromVirtual
        ? virtual.map((_, v) => cubes.length + v)
        : cubes.map((_, k) => k).filter((k) => onScreen(k));
      if (candidates.length) {
        const start = candidates[Math.floor(Math.random() * candidates.length)];
        const p = new THREE.Vector2();
        screenOf(start, p);
        const toward = p.clone().multiplyScalar(-1);
        if (toward.lengthSq() < 0.01) toward.set(Math.random() - 0.5, Math.random() - 0.5);
        toward.normalize().add(new THREE.Vector2(Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.8));
        ch.dir.copy(toward.normalize());
        ch.cur = start;
        ch.chargeStart = t;
        ch.chargeDur = fromVirtual ? 0 : CHAIN.charge;
        ch.hops = 0;
        ch.visited.clear();
        ch.firstShot = true;
      } else {
        ch.nextAt = t + 1;
      }
    }
    if (ch.cur >= 0 && t >= ch.chargeStart + ch.chargeDur) fire(ch.cur);

    // ---- clicked cascades: every due cube fires at its nearest untouched neighbours ----
    const cas = cascade.current;
    if (cas.due.length) {
      const now = cas.due.filter((d) => d.at <= t);
      cas.due = cas.due.filter((d) => d.at > t);
      for (const { cube: from, wave } of now) {
        ch.firedAt.set(from, t);
        const p0 = new THREE.Vector2();
        if (!screenOf(from, p0)) continue;
        const p = new THREE.Vector2();
        const near = cubes
          .map((_, k) => k)
          .filter((k) => !cas.visited.has(k) && onScreen(k) && screenOf(k, p))
          .map((k) => ({ k, d: screenOf(k, p)!.distanceTo(p0) }))
          .filter((n) => n.d < CASCADE.reach)
          .sort((a, b) => a.d - b.d)
          .slice(0, wave === 0 ? CASCADE.first : CASCADE.next);
        const src = posOf(from)!.clone();
        for (const { k } of near) {
          cas.visited.add(k);
          ch.beams.push({ from: src.clone(), to: k, exit: new THREE.Vector3(), start: t });
          if (ch.beams.length > BEAMS) ch.beams.shift();
          ch.hits.push({ cube: k, at: t + CHAIN.travel, dir: posOf(k)!.clone().sub(src).normalize() });
          if (wave + 1 < CASCADE.waves) cas.due.push({ cube: k, at: t + CHAIN.travel + CASCADE.delay, wave: wave + 1 });
        }
      }
    }

    // ---- knock-back: apply arrived hits, then integrate ----
    ch.hits = ch.hits.filter((h) => {
      if (t < h.at) return true;
      const c = cubes[h.cube];
      const kb = knock[h.cube];
      const mass = Math.max(0.6, c.size); // the big cube barely moves
      tmp.v.copy(h.dir);
      tmp.v.z *= KNOCK.depth;
      kb.vel.addScaledVector(tmp.v, KNOCK.speed / mass);
      kb.spin.set(
        kb.spin.x + (Math.random() - 0.5) * KNOCK.spin / mass,
        kb.spin.y + (Math.random() - 0.5) * KNOCK.spin / mass,
        kb.spin.z + (Math.random() - 0.5) * KNOCK.spin / mass,
      );
      return false;
    });
    const damp = Math.exp(-KNOCK.damping * dt);
    knock.forEach((kb) => {
      kb.vel.addScaledVector(kb.offset, -KNOCK.home * dt);
      kb.offset.addScaledVector(kb.vel, dt);
      if (kb.offset.length() > KNOCK.maxOffset) {
        kb.offset.setLength(KNOCK.maxOffset);
        kb.vel.multiplyScalar(0.5);
      }
      kb.vel.multiplyScalar(damp);
      kb.spin.multiplyScalar(damp);
    });

    // ---- cubes: spin, bob, glow, shake ----
    cubes.forEach((c, i) => {
      const m = refs.current[i];
      if (!m) return;
      const kb = knock[i];
      m.rotation.x += (c.spin[0] + kb.spin.x) * dt;
      m.rotation.y += (c.spin[1] + kb.spin.y) * dt;
      m.rotation.z += (c.spin[2] + kb.spin.z) * dt;
      let x = c.position[0] + kb.offset.x;
      // slow drift up and down, out of phase per cube
      let y = c.position[1] + kb.offset.y + Math.sin(t * 0.35 + i * 1.7) * 0.12 * (1 + c.size);
      // never let a cube come at the camera: up close it would fill the screen and beams would turn into slabs
      let z = Math.min(c.position[2] + kb.offset.z, i === 0 ? c.position[2] : camera.position.z - KNOCK.nearest);

      let glow = 0;
      if (i === ch.cur && t >= ch.chargeStart) glow = Math.pow((t - ch.chargeStart) / ch.chargeDur, 2);
      const fired = ch.firedAt.get(i);
      if (fired !== undefined) {
        const k = (t - fired) / CHAIN.cool;
        if (k < 1) glow = Math.max(glow, 1 - k);
        else ch.firedAt.delete(i);
      }
      if (glow > 0) {
        // the cube that starts a chain shakes harder while it charges
        const starting = i === ch.cur && ch.hops === 0 && t >= ch.chargeStart;
        // capped by size, or the big cube next to the camera would shake across half the screen
        const amp = glow * (starting ? 0.13 : 0.06) * (0.6 + Math.min(c.size, 1.1));
        x += (Math.random() - 0.5) * amp;
        y += (Math.random() - 0.5) * amp;
        z += (Math.random() - 0.5) * amp;
      }
      m.position.set(x, y, z);
      const mat = materials[i];
      mat.emissive.set(c.color).lerp(GLOW, Math.min(1, glow * 1.4));
      mat.emissiveIntensity = 0.22 + glow * 2.6;
    });

    // ---- beams ----
    const lit: { head: THREE.Vector3; mid: THREE.Vector3; fade: number; start: number }[] = [];
    for (let k = 0; k < BEAMS; k++) {
      const mesh = beamRefs.current[k];
      const b = ch.beams[k];
      if (!mesh) continue;
      const age = b ? t - b.start : Infinity;
      if (!b || age > CHAIN.travel + CHAIN.fade) {
        mesh.visible = false;
        continue;
      }
      const target = b.to >= 0 ? posOf(b.to)! : b.exit;
      const offscreen = b.to < 0 || b.to >= cubes.length;
      const head = Math.min(1, age / (offscreen ? CHAIN.travel * 2.5 : CHAIN.travel));
      tmp.a.copy(b.from);
      tmp.b.copy(b.from).lerp(target, head);
      const len = tmp.a.distanceTo(tmp.b);
      if (len < 1e-3) {
        mesh.visible = false;
        continue;
      }
      // keep a roughly constant on-screen thickness at any depth
      const mid = tmp.v.copy(tmp.a).add(tmp.b).multiplyScalar(0.5);
      const radius = 0.009 * Math.max(1, camera.position.z - mid.z);
      mesh.visible = true;
      mesh.position.copy(mid);
      mesh.quaternion.setFromUnitVectors(tmp.up, tmp.b.sub(tmp.a).normalize());
      mesh.scale.set(radius, len, radius);
      const fade = age <= CHAIN.travel ? 1 : 1 - (age - CHAIN.travel) / CHAIN.fade;
      beamMaterials[k].opacity = Math.max(0, fade);
      lit.push({ head: tmp.a.clone().add(tmp.b.multiplyScalar(len)), mid: mesh.position.clone(), fade, start: b.start });
    }

    // ---- light: the newest beams light their surroundings, the charging cube glows on its neighbours ----
    lit.sort((p, q) => q.start - p.start);
    for (let k = 0; k < BEAM_LIGHTS; k++) {
      const light = beamLights.current[k];
      if (!light) continue;
      const src = lit[k >> 1];
      if (!src || src.fade <= 0) {
        light.intensity = 0;
        continue;
      }
      light.position.copy(k % 2 === 0 ? src.head : src.mid);
      // ease out so the light dies a bit before the beam does
      light.intensity = BEAM_LIGHT.intensity * src.fade * src.fade;
    }
    const cl = chargeLight.current;
    if (cl) {
      const curPos = ch.cur >= 0 && ch.cur < cubes.length ? refs.current[ch.cur]?.position : null;
      const charging = curPos && t >= ch.chargeStart ? Math.min(1, (t - ch.chargeStart) / Math.max(ch.chargeDur, 1e-3)) : 0;
      if (curPos && charging > 0) {
        cl.position.copy(curPos);
        cl.intensity = CHARGE_LIGHT.intensity * charging * charging;
      } else cl.intensity = 0;
    }
  });

  return (
    <>
      {cubes.map((c, i) => (
        <mesh
          key={i}
          ref={(m) => {
            refs.current[i] = m;
          }}
          geometry={geometry}
          material={materials[i]}
          position={c.position}
          rotation={c.rotation}
          scale={c.size}
        />
      ))}
      {Array.from({ length: BEAM_LIGHTS }, (_, k) => (
        <pointLight
          key={`beam-light-${k}`}
          ref={(l) => {
            beamLights.current[k] = l;
          }}
          color={LIGHT_COLOR}
          intensity={0}
          distance={BEAM_LIGHT.distance}
          decay={BEAM_LIGHT.decay}
        />
      ))}
      <pointLight
        ref={chargeLight}
        color={GLOW}
        intensity={0}
        distance={CHARGE_LIGHT.distance}
        decay={CHARGE_LIGHT.decay}
      />
      {beamMaterials.map((mat, k) => (
        <mesh
          key={`beam-${k}`}
          ref={(m) => {
            beamRefs.current[k] = m;
          }}
          geometry={beamGeometry}
          material={mat}
          visible={false}
          frustumCulled={false}
        />
      ))}
    </>
  );
}

export interface TyperLineSpec {
  /** CSS selector of the element whose box the line occupies (sized by the scene). */
  target: string;
  /** The longest text this line ever shows; sizes the font so it always fits. */
  widest: string;
  /** "large" picks the biggest font that fits; "small" stays at body size. */
  size: "small" | "large";
  /** Every text this line may show. Makes the line word-wrap, and sizes its box for the tallest one. */
  candidates?: string[];
}

export interface TyperSpec {
  lines: TyperLineSpec[];
  script: TyperStep[];
  /** After the script, type one of this line's `candidates`, picked at random on every load. */
  outro?: { line: number };
}

export interface LedTextSpec {
  /** CSS selector of the element whose box the text occupies. */
  target: string;
  /** Uppercase-only; "\n" breaks lines when `scale` is set. */
  text: string;
  font?: LedFontId;
  /** Lamps per font pixel. Omit to auto-fit the target width (5×7 font). */
  scale?: number;
  /** Word-wrap to the target's width (with `scale`). */
  wrap?: boolean;
  /** Font to use when the target is narrower than 640px (phones). */
  narrowFont?: LedFontId;
}

/**
 * Hero background: cubes slowly spinning at different depths of a 3D space,
 * one big one on the right, close to the camera, shown through a fine LED
 * dot-matrix screen. Fills its positioned parent.
 */
export default function HeroSpace({
  fx = "led",
  ledPitch = LED_PITCH,
  texts,
  typer,
  textColor = "#F97316",
}: {
  /** A line that types itself (caret, deletes, select-all) in the LED matrix. */
  typer?: TyperSpec;
  textColor?: string;
  fx?: FxMode;
  ledPitch?: number;
  /** Text written into the LED matrix, each block placed at the box of its `target` element (which gets sized to fit). */
  texts?: LedTextSpec[];
}) {
  const root = useRef<HTMLDivElement>(null);
  const pointerInside = useRef(false);
  // ?led=3 / ?fx=off on the URL, for quick tuning in the browser
  const [tuning] = useState(() => {
    const q = new URLSearchParams(window.location.search);
    const led = Number(q.get("led"));
    return { fx: (q.get("fx") as FxMode | null) ?? fx, pitch: led > 0 ? led : ledPitch };
  });
  const [inView, setInView] = useState(true);
  const [animate] = useState(() => !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [ledText, setLedText] = useState<LedTextBitmap | null>(null);

  // ---- typed lines: where each sits on the grid, and the latest typing state ----
  const typerLayout = useRef<{
    grid: LedGrid;
    base: Uint8Array;
    lines: { col0: number; row0: number; font: LedFont; scale: number; maxCols?: number }[];
  } | null>(null);
  const typerState = useRef<TyperState | null>(null);

  /** Redraws the typed lines on top of the static text. */
  const paintTyper = () => {
    const L = typerLayout.current;
    const st = typerState.current;
    if (!L || !st) return;
    const g = L.grid;
    g.data.set(L.base);
    L.lines.forEach(({ col0, row0, font, scale: s, maxCols }, li) => {
      const text = st.lines[li] ?? "";
      if (maxCols) {
        // word-wrapped line: only ever typed at its end, so the caret sits after the last row
        const rows = wrap(text, maxCols, font);
        const pitchRows = (font.h + font.leading) * s;
        rows.forEach((row, r) => drawLedLine(g, row, font, s, col0, row0 + r * pitchRows, CH.text));
        if (li === st.line && st.caretOn) {
          const last = rows[rows.length - 1] ?? "";
          const cx = last ? textWidth(last, font) + font.tracking : 0;
          fillLamps(g, col0 + cx * s, row0 + (rows.length - 1) * pitchRows, font.w * s, font.h * s, CH.cursor);
        }
        return;
      }
      drawLedLine(g, text, font, s, col0, row0, CH.text);
      if (li !== st.line) return;
      if (st.sel && st.sel[1] > st.sel[0]) {
        const x0 = charStart(text, st.sel[0], font);
        const x1 = textWidth(text.slice(0, st.sel[1]), font);
        fillLamps(g, col0 + (x0 - 1) * s, row0 - s, (x1 - x0 + 2) * s, (font.h + 2) * s, CH.select);
      }
      if (st.caretOn) {
        const cx =
          st.caret < text.length ? charStart(text, st.caret, font) : text ? textWidth(text, font) + font.tracking : 0;
        fillLamps(g, col0 + cx * s, row0, font.w * s, font.h * s, CH.cursor);
      }
    });
    g.texture.needsUpdate = true;
  };

  const typerKey = JSON.stringify(typer ?? null);
  useEffect(() => {
    const spec: TyperSpec | null = JSON.parse(typerKey);
    if (!spec || tuning.fx !== "led") return;
    const script = [...spec.script];
    const options = spec.outro ? (spec.lines[spec.outro.line]?.candidates ?? []) : [];
    if (spec.outro && options.length) {
      const pick = options[Math.floor(Math.random() * options.length)];
      script.push({ blink: 1 }, { line: spec.outro.line }, { type: pick });
    }
    return runTyper(
      script,
      (st) => {
        typerState.current = st;
        paintTyper();
      },
      { startDelay: 900, reducedMotion: !animate },
    );
  }, [typerKey, tuning, animate]);

  // lay the text out on the lamp grid wherever the target elements sit in the page
  const textsKey = JSON.stringify(texts ?? []);
  useEffect(() => {
    const el = root.current;
    const specs: LedTextSpec[] = JSON.parse(textsKey);
    const typerSpec: TyperSpec | null = JSON.parse(typerKey);
    if (!el || (!specs.length && !typerSpec) || tuning.fx !== "led") return;
    const pitch = tuning.pitch;
    let current: LedTextBitmap | null = null;
    const build = () => {
      const targets = specs.map((t) => document.querySelector<HTMLElement>(t.target));
      const layouts = specs.map((t, k) => {
        const width = targets[k]?.getBoundingClientRect().width ?? 0;
        const font = t.narrowFont && width < 640 ? t.narrowFont : t.font;
        return t.scale
          ? fixedLedText(t.text, pitch, t.scale, font, t.wrap ? width : undefined)
          : layoutLedText(t.text, width, pitch);
      });
      layouts.forEach((l, k) => targets[k] && (targets[k]!.style.height = `${l.height}px`));
      // typed lines: pick each line's font, size its box (room above/below for the highlight)
      const typerLines = (typerSpec?.lines ?? []).map((line) => {
        const el2 = document.querySelector<HTMLElement>(line.target);
        if (!el2) return null;
        const width = el2.getBoundingClientRect().width;
        const options: [LedFontId, number][] =
          line.size === "large" ? [["5x7", 2], ["5x7", 1], ["3x5", 1]] : [["5x7", 1], ["3x5", 1]];
        const fits = ([f, sc]: [LedFontId, number]) => textWidth(line.widest, LED_FONTS[f]) * sc * pitch <= width;
        // on phones the small line follows the static text and drops to 3×5
        const [fontId, scale] =
          line.size === "small" && width < 640
            ? (["3x5", 1] as [LedFontId, number])
            : line.candidates?.length
              ? options[0] // wraps instead of shrinking
              : (options.find(fits) ?? ["3x5", 1]);
        const font = LED_FONTS[fontId];
        if (line.candidates?.length) {
          const maxCols = Math.floor(width / (pitch * scale));
          const rows = Math.max(...line.candidates.map((c) => wrap(c, maxCols, font).length));
          el2.style.height = `${(rows * font.h + (rows - 1) * font.leading + 2) * scale * pitch}px`;
          return { el: el2, font, scale, widest: line.widest, maxCols };
        }
        el2.style.height = `${(font.h + 2) * scale * pitch}px`;
        return { el: el2, font, scale, widest: line.widest, maxCols: undefined };
      });
      // reading rects after the height changes forces the new layout first
      const box = el.getBoundingClientRect();
      const blocks: PlacedLedText[] = [];
      targets.forEach((t, k) => {
        if (!t) return;
        const r = t.getBoundingClientRect();
        blocks.push({ layout: layouts[k], left: r.left - box.left, top: r.top - box.top });
      });
      const next = makeLedTextBitmap(blocks, { gridW: box.width, gridH: box.height, pitch });

      typerLayout.current = null;
      if (typerLines.length) {
        const lines = typerLines.map((t) => {
          if (!t) return { col0: -1e4, row0: -1e4, font: LED_FONTS["3x5"], scale: 1 };
          const r = t.el.getBoundingClientRect();
          const col0 = Math.round((r.left - box.left) / pitch);
          const row0 = Math.round((r.top - box.top) / pitch) + t.scale;
          next.firstCol = Math.min(next.firstCol, col0);
          next.lastCol = Math.max(next.lastCol, col0 + (t.maxCols ?? textWidth(t.widest, t.font)) * t.scale);
          return { col0, row0, font: t.font, scale: t.scale, maxCols: t.maxCols };
        });
        typerLayout.current = { grid: next, base: next.data.slice(), lines };
        paintTyper();
      }

      current?.texture.dispose();
      current = next;
      setLedText(next);
      el.closest("section")?.setAttribute("data-led-text", "on");
    };
    build();
    const ro = new ResizeObserver(() => build());
    ro.observe(el);
    return () => {
      ro.disconnect();
      current?.texture.dispose();
    };
  }, [textsKey, typerKey, tuning]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={root} aria-hidden="true" className="pointer-events-none absolute inset-0">
      <Canvas
        frameloop={inView && animate ? "always" : "demand"}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, CAMERA_Z], fov: FOV, near: 0.1, far: 60 }}
        gl={{ antialias: true, alpha: true }}
      >
        {/* far cubes fade into the background colour, which sells the depth */}
        <fog attach="fog" args={[BG, 9, 42]} />
        <ambientLight intensity={1.1} />
        <directionalLight position={[6, 8, 10]} intensity={2.4} />
        <directionalLight position={[-8, -3, 4]} intensity={0.5} />
        <Cubes animate={animate} />
        <PostFX
          mode={tuning.fx}
          pointerInside={pointerInside}
          background={BG}
          ledCell={tuning.pitch}
          ledText={ledText}
          ledTextColor={textColor}
        />
      </Canvas>
    </div>
  );
}
