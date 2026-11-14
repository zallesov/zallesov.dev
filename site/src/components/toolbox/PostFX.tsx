import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Dev only: this module holds live WebGL/animation state that React Fast Refresh can't hot-swap
// cleanly (it left frozen beams and a lost LED layer). Reload the whole page instead.
if (import.meta.hot) import.meta.hot.accept(() => window.location.reload());

export interface LedTextBitmap {
  texture: THREE.Texture;
  cols: number;
  rows: number;
  firstCol: number;
  lastCol: number;
}

export type FxMode = "lens" | "crt" | "dither" | "led" | "ascii" | "glitch" | "off";
const MODE_INDEX: Record<FxMode, number> = {
  off: 0,
  lens: 1,
  crt: 2,
  dither: 3,
  led: 4,
  ascii: 5,
  glitch: 6,
};

// ASCII ramp, darkest → brightest; index 0 (space) is used for the background
export const ASCII_RAMP = " .:-=+*#%@";

export function makeAsciiAtlas(): THREE.CanvasTexture {
  const cell = 64;
  const canvas = document.createElement("canvas");
  canvas.width = cell * ASCII_RAMP.length;
  canvas.height = cell;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.font = `700 ${cell * 0.9}px ui-monospace, "SF Mono", Menlo, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  [...ASCII_RAMP].forEach((ch, i) => ctx.fillText(ch, i * cell + cell / 2, cell / 2 + 2));
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return tex;
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D tScene;
  uniform vec2  uRes;      // render target size in px
  uniform vec2  uMouse;    // 0..1 uv
  uniform float uActive;   // 0..1, smoothed "pointer is inside"
  uniform float uTime;
  uniform int   uMode;
  uniform vec3  uBg;
  uniform float uDpr;
  uniform float uLedCell;  // LED pitch, css px
  uniform sampler2D tText;  // LED mode: one texel per lamp, R = lamp is part of the text
  uniform vec2  uTextGrid;  // lamp columns / rows of tText
  uniform vec2  uTextSpan;  // first / last lamp column that holds text (for the reveal)
  uniform float uTextOn;
  uniform float uTextReveal; // 0..1, sweeps the text in from the left
  uniform vec3  uTextColor;
  uniform vec3  uSelColor;   // selection highlight
  uniform sampler2D tAscii;
  uniform sampler2D tLabels; // white-on-black text mask of the cube labels
  varying vec2 vUv;
  #define PI 3.14159265
  #define ASCII_N ${ASCII_RAMP.length}.0

  // tone-map the scene only, so the flat background keeps its exact colour
  vec3 tm(vec3 c) {
    #ifdef TONE_MAPPING
      return toneMapping(c);
    #else
      return c;
    #endif
  }

  vec3 sceneAt(vec2 uv) {
    vec4 c = texture2D(tScene, clamp(uv, 0.0, 1.0));
    return mix(uBg, tm(c.rgb), c.a);
  }

  float alphaAt(vec2 uv) { return texture2D(tScene, clamp(uv, 0.0, 1.0)).a; }

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  // ordered dithering thresholds via the recursive Bayer trick
  float bayer2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
  float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
  float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }

  void main() {
    vec2 uv = vUv;
    float aspect = uRes.x / uRes.y;
    vec3 col;

    if (uMode == 1) {
      // ---- glass lens following the cursor ----
      vec2 d = uv - uMouse;
      d.x *= aspect;
      float len = length(d);
      float r = 0.17 * smoothstep(0.0, 1.0, uActive);
      float inside = 1.0 - smoothstep(r - 0.004, r, len);
      float t = clamp(len / max(r, 1e-4), 0.0, 1.0);
      // magnify the centre, compress towards the rim (spherical-ish profile)
      float zoom = mix(0.55, 1.0, t * t);
      float edge = smoothstep(0.55, 1.0, t) * inside;
      vec2 dir = (uv - uMouse);
      vec2 base = uMouse + dir * zoom;
      float ca = 0.018 * edge;
      vec3 lensCol = vec3(
        sceneAt(uMouse + dir * zoom * (1.0 + ca)).r,
        sceneAt(base).g,
        sceneAt(uMouse + dir * zoom * (1.0 - ca)).b
      );
      // fresnel-ish rim + soft specular
      float rim = smoothstep(r - 0.012, r - 0.002, len) * inside;
      vec2 hl = d / max(r, 1e-4) - vec2(-0.35, 0.35);
      float spec = exp(-dot(hl, hl) * 60.0) * inside;
      lensCol += rim * 0.3 + spec * 0.12;
      lensCol *= 1.0 + 0.08 * inside;
      // drop shadow ring outside the lens
      float shadow = (1.0 - inside) * exp(-pow(max(len - r, 0.0) * 40.0, 2.0)) * uActive;
      col = mix(sceneAt(uv) * (1.0 - 0.35 * shadow), lensCol, inside);

    } else if (uMode == 2) {
      // ---- CRT monitor (heavy) ----
      vec2 cc = uv * 2.0 - 1.0;
      cc.x *= 1.0 + 0.22 * cc.y * cc.y;               // barrel curvature
      cc.y *= 1.0 + 0.28 * cc.x * cc.x;
      vec2 cuv = cc * 0.5 + 0.5;
      // horizontal wobble + occasional tracking tear
      float tear = step(0.992, hash(vec2(floor(uTime * 10.0), floor(cuv.y * 40.0))));
      cuv.x += sin(cuv.y * 50.0 + uTime * 4.0) * 0.0009 + tear * 0.02;
      if (any(lessThan(cuv, vec2(0.0))) || any(greaterThan(cuv, vec2(1.0)))) {
        col = vec3(0.0);
      } else {
        float off = 0.003 + 0.009 * dot(cc, cc);
        col = vec3(sceneAt(cuv + vec2(off, 0.0)).r, sceneAt(cuv).g, sceneAt(cuv - vec2(off, 0.0)).b);
        // cheap phosphor bloom
        vec2 o = 5.0 * uDpr / uRes;
        vec3 glow = (sceneAt(cuv + vec2(o.x, 0.0)) + sceneAt(cuv - vec2(o.x, 0.0))
                   + sceneAt(cuv + vec2(0.0, o.y)) + sceneAt(cuv - vec2(0.0, o.y))) * 0.25;
        col += max(glow - uBg, 0.0) * 0.45;
        // thick scanlines (period ~3 css px), curved with the screen
        float yCss = cuv.y * uRes.y / uDpr;
        float scan = 0.45 + 0.55 * pow(abs(sin(PI * yCss / 3.0)), 1.4);
        // aperture-grille RGB mask
        float px = mod(floor(gl_FragCoord.x / max(1.0, floor(uDpr))), 3.0);
        vec3 mask = vec3(px == 0.0 ? 1.0 : 0.6, px == 1.0 ? 1.0 : 0.6, px == 2.0 ? 1.0 : 0.6);
        col *= scan * mask * 1.75;
        col *= 0.93 + 0.07 * sin(uTime * 60.0);       // flicker
        col += 0.02 * exp(-pow((fract(cuv.y - uTime * 0.15) - 0.5) * 45.0, 2.0)); // rolling bar
        // dark rounded tube corners
        vec2 e = cuv * (1.0 - cuv);
        col *= pow(clamp(e.x * e.y * 18.0, 0.0, 1.0), 0.35);
      }

    } else if (uMode == 3) {
      // ---- 8-bit ordered dither ----
      float px = 2.0;                                 // pixel size in device px
      vec2 cell = floor(gl_FragCoord.xy / px);
      vec2 suv = (cell + 0.5) * px / uRes;
      vec3 c = sceneAt(suv);
      float th = bayer8(cell) - 0.5;
      float levels = 4.0;
      vec3 q = floor(c * levels + th + 0.5) / levels;
      col = mix(uBg, q, step(0.5, alphaAt(suv)));     // dither the cubes, keep the background flat

    } else if (uMode == 4) {
      // ---- LED dot-matrix panel: every pixel of the scene becomes one round lamp ----
      float cell = uLedCell * uDpr;
      vec2 id = floor(gl_FragCoord.xy / cell);
      vec2 cuv = (id + 0.5) * cell / uRes;
      // a few brightness steps, like real LEDs; quantise brightness only so hues survive
      vec3 c0 = sceneAt(cuv);
      float l = max(c0.r, max(c0.g, c0.b));
      vec3 c = l > 0.001 ? c0 * (floor(l * 8.0 + 0.5) / 8.0) / l : vec3(0.0);
      float a = alphaAt(cuv);
      float d = length(fract(gl_FragCoord.xy / cell) - 0.5);
      float aa = 1.0 / cell;                           // ~1 device px soft edge at any pitch
      float dotMask = 1.0 - smoothstep(0.36 - aa, 0.36 + aa, d);
      float glow = exp(-d * d * 9.0) * 0.3;
      vec3 unlit = uBg * 1.6 + 0.008;                  // switched-off lamps stay faintly visible
      col = mix(uBg * 0.7, unlit, dotMask);
      // a lit lamp is never darker than a switched-off one (no black holes for fogged cubes)
      // a lamp behind a cube is always a touch brighter than an empty one, so dark faces still read
      col = mix(col, max(c * 1.25, unlit * 1.5 + 0.018), dotMask * a) + c * glow * a;

      // text written straight into the lamp grid: one texel per lamp, so it always lands on lamps
      if (uTextOn > 0.5) {
        // one texel per lamp: R = text, G = selection, B = cursor
        vec2 tuv = (id + 0.5) / uTextGrid;
        float inside = step(tuv.x, 1.0) * step(tuv.y, 1.0);
        vec4 tx = texture2D(tText, tuv) * inside;
        float head = uTextReveal >= 1.0 ? 1e6 : mix(uTextSpan.x - 2.0, uTextSpan.y + 2.0, uTextReveal);
        float shown = step(id.x, head);
        float t = tx.r * shown;
        float hl = max(tx.g, tx.b) * shown;
        // the freshly written column flickers brighter, like a sign being drawn
        float hot = (1.0 - smoothstep(0.0, 3.0, head - id.x)) * (1.0 - step(1.0, uTextReveal));
        vec3 tc = uTextColor * (1.35 + 0.8 * hot);
        vec3 hc = tx.g > 0.5 ? uSelColor * 1.3 : uTextColor * 1.4;
        // switch off a one-lamp ring around everything lit, so it reads over any scene colour
        float ring = 0.0;
        for (int dx = -1; dx <= 1; dx++)
          for (int dy = -1; dy <= 1; dy++) {
            vec4 n = texture2D(tText, (id + vec2(float(dx), float(dy)) + 0.5) / uTextGrid);
            ring = max(ring, max(n.r, max(n.g, n.b)) * step(id.x + float(dx), head));
          }
        vec3 offLamp = mix(uBg * 0.7, uBg * 1.6 + 0.008, dotMask);
        col = mix(col, offLamp, ring * (1.0 - max(t, hl)));
        // text lamps; under a highlight the letters are cut out of the bar instead (inverted)
        col = mix(col, tc, dotMask * t * (1.0 - hl)) + uTextColor * glow * t * (1.0 - hl) * 1.4;
        col = mix(col, hc, dotMask * hl * (1.0 - t)) + hc * glow * hl * (1.0 - t);
        col = mix(col, offLamp, t * hl);
      }

    } else if (uMode == 5) {
      // ---- ASCII terminal ----
      float cell = 9.0 * uDpr;
      vec2 id = floor(gl_FragCoord.xy / cell);
      vec2 cuv = (id + 0.5) * cell / uRes;
      vec3 c = sceneAt(cuv);
      float a = alphaAt(cuv);
      float lum = dot(c, vec3(0.299, 0.587, 0.114));
      float idx = a < 0.5 ? 0.0 : 1.0 + floor(clamp(lum * 1.4, 0.0, 0.999) * (ASCII_N - 1.0));
      vec2 local = fract(gl_FragCoord.xy / cell);
      float glyph = texture2D(tAscii, vec2((idx + local.x) / ASCII_N, local.y)).r;
      col = mix(uBg, c * 1.35, glyph);
      // glowing cube edges
      float e = texture2D(tLabels, uv).g;
      col = mix(col, sceneAt(uv) * 1.6 + 0.04, e);
      // overlay crisp labels: dark halo for contrast, then light text
      float m = texture2D(tLabels, uv).r;
      vec2 o = 2.0 * uDpr / uRes;
      float halo = 0.0;
      for (int k = 0; k < 8; k++) {
        float ang = float(k) * PI * 0.25;
        halo = max(halo, texture2D(tLabels, uv + o * vec2(cos(ang), sin(ang))).r);
      }
      col = mix(col, uBg * 0.5, halo * 0.9);
      col = mix(col, mix(vec3(1.0, 0.92, 1.0), c, 0.25), m);

    } else if (uMode == 6) {
      // ---- digital glitch ----
      float t = floor(uTime * 9.0);
      float burst = step(0.72, hash(vec2(t, 7.0)));
      float band = floor(uv.y * 28.0);
      float shift = step(0.8, hash(vec2(band, t))) * (hash(vec2(t, band + 3.0)) - 0.5) * (0.02 + 0.09 * burst);
      vec2 guv = vec2(uv.x + shift, uv.y);
      float split = 0.002 + 0.012 * burst;
      col = vec3(sceneAt(guv + vec2(split, 0.0)).r, sceneAt(guv).g, sceneAt(guv - vec2(split, 0.0)).b);
      vec2 block = floor(uv * vec2(16.0, 10.0));
      if (burst > 0.5 && hash(block + t) > 0.96) col = vec3(1.0) - col.gbr;
      col *= 0.9 + 0.1 * sin(gl_FragCoord.y * PI / uDpr);

    } else {
      col = sceneAt(uv);
    }

    // shared finishing: film grain + vignette
    vec2 vc = uv - 0.5;
    col *= 1.0 - 0.45 * dot(vc, vc);
    col += (hash(gl_FragCoord.xy + fract(uTime) * 100.0) - 0.5) * 0.018;

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

/**
 * Full-screen post-processing pass: renders the scene into a render target,
 * then draws it through a custom shader. Takes over R3F's render loop (priority 1).
 */
export default function PostFX({
  mode,
  pointerInside,
  background,
  isIdle,
  idleFps = 20,
  ledCell = 7,
  ledText = null,
  ledTextColor = "#F97316",
}: {
  mode: FxMode;
  pointerInside: React.MutableRefObject<boolean>;
  background: string;
  /** When this returns true the pass is throttled to `idleFps` to save GPU/battery. */
  isIdle?: () => boolean;
  /** LED mode: lamp pitch in CSS px. */
  ledCell?: number;
  /** LED mode: text bitmap, one texel per lamp (see led/ledText). */
  ledText?: LedTextBitmap | null;
  ledTextColor?: string;
  idleFps?: number;
}) {
  const lastRender = useRef(0);
  const { gl, size } = useThree();

  const target = useMemo(
    () => new THREE.WebGLRenderTarget(1, 1, { samples: 4, type: THREE.HalfFloatType }),
    [],
  );
  const labelTarget = useMemo(() => new THREE.WebGLRenderTarget(1, 1, { samples: 4 }), []);
  const [postScene, postCam, material] = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tScene: { value: target.texture },
        uRes: { value: new THREE.Vector2(1, 1) },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uActive: { value: 0 },
        uTime: { value: 0 },
        uMode: { value: 1 },
        uBg: { value: new THREE.Color(background) },
        uDpr: { value: 1 },
        uLedCell: { value: 7 },
        tText: { value: null as THREE.Texture | null },
        uTextGrid: { value: new THREE.Vector2(1, 1) },
        uTextSpan: { value: new THREE.Vector2(0, 0) },
        uTextOn: { value: 0 },
        uTextReveal: { value: 0 },
        uTextColor: { value: new THREE.Color("#F97316") },
        uSelColor: { value: new THREE.Color("#F97316") },
        tAscii: { value: makeAsciiAtlas() },
        tLabels: { value: labelTarget.texture },
      },
    });
    const s = new THREE.Scene();
    s.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
    return [s, new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), mat] as const;
  }, [target, labelTarget, background]);

  useEffect(() => {
    const dpr = gl.getPixelRatio();
    target.setSize(Math.round(size.width * dpr), Math.round(size.height * dpr));
    labelTarget.setSize(Math.round(size.width * dpr), Math.round(size.height * dpr));
    material.uniforms.uRes.value.set(size.width * dpr, size.height * dpr);
    material.uniforms.uDpr.value = dpr;
  }, [gl, size, target, labelTarget, material]);

  useEffect(
    () => () => {
      target.dispose();
      labelTarget.dispose();
      material.uniforms.tAscii.value.dispose();
      material.dispose();
    },
    [target, labelTarget, material],
  );

  useFrame((state, delta) => {
    const now = state.clock.elapsedTime;
    if (isIdle?.() && now - lastRender.current < 1 / idleFps) return;
    delta = Math.min(now - lastRender.current, 0.1);
    lastRender.current = now;
    const u = material.uniforms;
    u.uMode.value = MODE_INDEX[mode];
    u.uLedCell.value = ledCell;
    if (ledText) {
      if (u.tText.value !== ledText.texture) {
        u.tText.value = ledText.texture;
        u.uTextGrid.value.set(ledText.cols, ledText.rows);
        u.uTextSpan.value.set(ledText.firstCol, ledText.lastCol);
      }
      u.uTextOn.value = 1;
      u.uTextReveal.value = Math.min(1, u.uTextReveal.value + delta / 1.1);
      u.uTextColor.value.set(ledTextColor);
    } else {
      u.uTextOn.value = 0;
    }
    u.uTime.value = state.clock.elapsedTime;
    // ease the lens in/out and let it trail the cursor slightly
    const want = pointerInside.current ? 1 : 0;
    u.uActive.value += (want - u.uActive.value) * Math.min(1, delta * 6);
    const mx = state.pointer.x * 0.5 + 0.5;
    const my = state.pointer.y * 0.5 + 0.5;
    const k = Math.min(1, delta * 14);
    u.uMouse.value.x += (mx - u.uMouse.value.x) * k;
    u.uMouse.value.y += (my - u.uMouse.value.y) * k;

    gl.setRenderTarget(target);
    gl.clear();
    gl.render(state.scene, state.camera);

    // label pass: swap every cube to its text-mask material, render, swap back
    if (mode === "ascii") {
      const swapped: [THREE.Mesh, THREE.Material | THREE.Material[]][] = [];
      state.scene.traverse((o) => {
        const lm = (o as THREE.Mesh).userData?.labelMaterial as THREE.Material | undefined;
        if ((o as THREE.Mesh).isMesh && lm) {
          const mesh = o as THREE.Mesh;
          swapped.push([mesh, mesh.material]);
          mesh.material = lm;
        }
      });
      gl.setRenderTarget(labelTarget);
      gl.clear();
      gl.render(state.scene, state.camera);
      swapped.forEach(([mesh, m]) => (mesh.material = m));
    }
    gl.setRenderTarget(null);
    gl.render(postScene, postCam);
  }, 1);

  return null;
}
