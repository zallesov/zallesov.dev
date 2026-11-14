import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ASCII_RAMP, makeAsciiAtlas } from "../toolbox/PostFX";

const BG = "#140a18";

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D tPhoto;
  uniform sampler2D tAscii;
  uniform vec2  uRes;        // canvas size in device px
  uniform float uDpr;
  uniform float uPhotoAspect;
  uniform vec2  uAnchor;     // 0..1, the grabbed point
  uniform vec2  uPull;       // uv offset the grabbed point is dragged by
  uniform float uTime;
  uniform float uIntro;      // 0..1 decode-in progress
  uniform float uCell;       // css px per character
  uniform vec3  uBg;
  varying vec2 vUv;
  #define ASCII_N ${ASCII_RAMP.length}.0

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  // object-fit: cover
  vec2 cover(vec2 uv, float imgAspect) {
    float canvasAspect = uRes.x / uRes.y;
    vec2 s = canvasAspect > imgAspect
      ? vec2(1.0, imgAspect / canvasAspect)
      : vec2(canvasAspect / imgAspect, 1.0);
    return (uv - 0.5) * s + 0.5;
  }

  // Rubber-sheet warp: the point at uAnchor ends up at uAnchor + uPull,
  // with a soft falloff. The radius grows with the pull so the sheet never folds.
  vec2 stretch(vec2 uv) {
    float aspect = uRes.x / uRes.y;
    vec2 d = uv - (uAnchor + uPull);
    d.x *= aspect;
    float r = 0.14 + 0.6 * length(uPull);
    return uv - uPull * exp(-dot(d, d) / (r * r));
  }

  void main() {
    float cell = uCell * uDpr;
    vec2 id = floor(gl_FragCoord.xy / cell);
    vec2 cuv = stretch((id + 0.5) * cell / uRes);
    vec3 c = texture2D(tPhoto, cover(cuv, uPhotoAspect)).rgb;
    float lum = pow(dot(c, vec3(0.299, 0.587, 0.114)), 1.0 / 2.2);
    lum = smoothstep(0.16, 0.85, lum);               // crush the dark backdrop to blank
    float idx = floor(clamp(lum, 0.0, 0.999) * ASCII_N);

    // decode-in: cells resolve from random glyphs, plus a little idle shimmer
    float h = hash(id);
    float settled = step(h, uIntro);
    float shimmer = step(0.997, hash(id + floor(uTime * 6.0)));
    float rnd = floor(hash(id + floor(uTime * 20.0)) * ASCII_N);
    if (settled < 0.5 || (shimmer > 0.5 && idx > 0.0)) idx = max(rnd, 1.0) * step(0.5, settled + 0.5 * step(0.4, lum));
    if (settled < 0.5 && hash(id * 1.7) > 0.35) idx = 0.0;

    vec2 local = fract(gl_FragCoord.xy / cell);
    float glyph = texture2D(tAscii, vec2((idx + local.x) / ASCII_N, local.y)).r;
    // glyphs keep the photo's own colour (linear space; output is encoded once at the end)
    vec3 tint = c * (1.3 / max(max(c.r, max(c.g, c.b)), 0.05)) * mix(0.55, 1.0, lum);
    gl_FragColor = vec4(mix(uBg, tint, glyph), 1.0);
    #include <colorspace_fragment>
  }
`;

export interface PointerState {
  x: number; // 0..1, uv space (y up)
  y: number;
  inside: boolean;
  down: boolean;
}

const MAX_PULL = 0.3;
const STIFFNESS = 170;
const DAMPING = 8; // well under critical (≈26) → jelly wobble on release

function PortraitPlane({
  src,
  cell,
  pointer,
}: {
  src: string;
  cell: number;
  pointer: React.MutableRefObject<PointerState>;
}) {
  const photo = useLoader(THREE.TextureLoader, src);
  const { gl, size } = useThree();
  const lastRender = useRef(0);
  const sim = useRef({ ax: 0.5, ay: 0.5, px: 0, py: 0, vx: 0, vy: 0, wasDown: false, releasing: false });

  const material = useMemo(() => {
    photo.colorSpace = THREE.SRGBColorSpace;
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tPhoto: { value: photo },
        tAscii: { value: makeAsciiAtlas() },
        uRes: { value: new THREE.Vector2(1, 1) },
        uDpr: { value: 1 },
        uPhotoAspect: { value: photo.image.width / photo.image.height },
        uAnchor: { value: new THREE.Vector2(0.5, 0.5) },
        uPull: { value: new THREE.Vector2(0, 0) },
        uTime: { value: 0 },
        uIntro: { value: 0 },
        uCell: { value: cell },
        uBg: { value: new THREE.Color(BG) },
      },
    });
  }, [photo, cell]);

  useEffect(() => {
    const dpr = gl.getPixelRatio();
    material.uniforms.uRes.value.set(size.width * dpr, size.height * dpr);
    material.uniforms.uDpr.value = dpr;
  }, [gl, size, material]);

  useEffect(
    () => () => {
      material.uniforms.tAscii.value.dispose();
      material.dispose();
    },
    [material],
  );

  useFrame((state) => {
    const u = material.uniforms;
    const s = sim.current;
    const p = pointer.current;
    const now = state.clock.elapsedTime;

    const moving = Math.hypot(s.px, s.py) > 0.0015 || Math.hypot(s.vx, s.vy) > 0.01;
    // idle (intro done, nothing stretched, no cursor): ~15 fps is plenty for the shimmer
    const idle = u.uIntro.value >= 1 && !p.inside && !p.down && !moving;
    if (idle && now - lastRender.current < 1 / 15) return;
    const delta = Math.min(now - lastRender.current, 0.05);
    lastRender.current = now;

    u.uTime.value = now;
    u.uIntro.value = Math.min(1, u.uIntro.value + delta / 1.6);

    // --- stretch simulation ---
    let tx = 0;
    let ty = 0;
    if (p.down) {
      if (!s.wasDown) {
        // grab: keep whatever is currently under the finger in place
        s.ax = p.x - s.px;
        s.ay = p.y - s.py;
      }
      tx = p.x - s.ax;
      ty = p.y - s.ay;
      const len = Math.hypot(tx, ty);
      if (len > MAX_PULL) {
        tx *= MAX_PULL / len;
        ty *= MAX_PULL / len;
      }
      const k = Math.min(1, delta * 25);
      s.px += (tx - s.px) * k;
      s.py += (ty - s.py) * k;
      s.vx = s.vy = 0;
      s.releasing = false;
    } else {
      if (s.wasDown) s.releasing = true;
      if (s.releasing && !moving) s.releasing = false;
      if (p.inside && !s.releasing) {
        // hover: the sheet lags behind the cursor, so moving the mouse tugs the face along
        const k = Math.min(1, delta * 4);
        s.ax += (p.x - s.ax) * k;
        s.ay += (p.y - s.ay) * k;
        tx = (p.x - s.ax) * 0.6;
        ty = (p.y - s.ay) * 0.6;
      }
      // underdamped spring towards the target, sub-stepped for stability
      const steps = 4;
      const dt = delta / steps;
      for (let i = 0; i < steps; i++) {
        s.vx += ((tx - s.px) * STIFFNESS - s.vx * DAMPING) * dt;
        s.vy += ((ty - s.py) * STIFFNESS - s.vy * DAMPING) * dt;
        s.px += s.vx * dt;
        s.py += s.vy * dt;
      }
    }
    s.wasDown = p.down;
    u.uAnchor.value.set(s.ax, s.ay);
    u.uPull.value.set(s.px, s.py);

    state.gl.render(state.scene, state.camera);
  }, 1);

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

/**
 * Portrait rendered as coloured ASCII on a rubber sheet: moving the cursor
 * tugs the face along, press-and-drag stretches it, release snaps it back
 * with a jelly wobble.
 */
export default function AsciiPortrait({
  src = "/photos/ava1-1000.jpg",
  cell = 9,
  alt = "Portrait of Alex Zall",
  className = "",
}: {
  src?: string;
  cell?: number;
  alt?: string;
  className?: string;
}) {
  const pointer = useRef<PointerState>({ x: 0.5, y: 0.5, inside: false, down: false });
  const wrapper = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [grabbing, setGrabbing] = useState(false);

  useEffect(() => {
    const el = wrapper.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const track = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    pointer.current.x = (e.clientX - r.left) / r.width;
    pointer.current.y = 1 - (e.clientY - r.top) / r.height;
  };
  const release = () => {
    pointer.current.down = false;
    setGrabbing(false);
  };

  return (
    <div
      ref={wrapper}
      role="img"
      aria-label={alt}
      className={`relative aspect-square w-full touch-pan-y select-none overflow-hidden rounded-3xl ring-1 ring-white/10 ${
        grabbing ? "cursor-grabbing" : "cursor-grab"
      } ${className}`}
      style={{ background: BG }}
      onPointerEnter={(e) => {
        track(e);
        pointer.current.inside = true;
      }}
      onPointerMove={track}
      onPointerLeave={() => (pointer.current.inside = false)}
      onPointerDown={(e) => {
        track(e);
        e.currentTarget.setPointerCapture(e.pointerId);
        pointer.current.down = true;
        setGrabbing(true);
      }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: false }}
        flat
        frameloop={inView ? "always" : "never"}
        style={{ pointerEvents: "none" }}
      >
        <Suspense fallback={null}>
          <PortraitPlane src={src} cell={cell} pointer={pointer} />
        </Suspense>
      </Canvas>
    </div>
  );
}
