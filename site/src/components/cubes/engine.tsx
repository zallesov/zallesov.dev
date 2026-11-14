// Shared pieces of the physics-cube widgets (hero name cubes, toolbox).
import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { BallCollider, CuboidCollider, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";

// ---------- textures ----------

function wrapWords(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export interface FaceSpec {
  text: string;
  color: string;
  textColor: string;
  /** CSS font-family list. */
  font?: string;
  fontWeight?: number;
  /** Largest font size tried, in px on a 256px face. */
  maxSize?: number;
}

const DEFAULT_FONT = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';

/**
 * Draws a cube face. `maskOnly` renders white text on black: used by the
 * post-processing pass to keep labels crisp on top of stylised effects.
 */
export function makeLabelTexture(face: FaceSpec, maskOnly = false): THREE.CanvasTexture {
  const S = 256;
  const pad = 26;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = maskOnly ? "#000" : face.color;
  ctx.fillRect(0, 0, S, S);

  if (!maskOnly) {
    // subtle inner frame so each face reads as a "tile"
    ctx.strokeStyle = "rgba(0,0,0,0.14)";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.roundRect(14, 14, S - 28, S - 28, 22);
    ctx.stroke();
  }

  if (face.text) {
    // fit text: shrink font until all lines fit
    const maxW = S - pad * 2;
    let size = face.maxSize ?? 64;
    let lines: string[] = [];
    for (; size >= 26; size -= 2) {
      ctx.font = `${face.fontWeight ?? 800} ${size}px ${face.font ?? DEFAULT_FONT}`;
      lines = wrapWords(ctx, face.text, maxW);
      const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
      if (widest <= maxW && lines.length * size * 1.05 <= maxW) break;
    }

    ctx.fillStyle = maskOnly ? "#fff" : face.textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const lh = size * 1.05;
    const top = S / 2 - ((lines.length - 1) * lh) / 2;
    // optical centring: cap-height glyphs sit slightly high with "middle" baseline
    lines.forEach((l, i) => ctx.fillText(l, S / 2, top + i * lh + size * 0.04));
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/**
 * Label + edge mask for the post-processing label pass (R = text, G = edges).
 * Fades out faces that are turned away from the camera, so labels seen
 * edge-on don't become streaks.
 */
export function makeLabelMaskMaterial(map: THREE.Texture): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { map: { value: map } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vN;
      void main() {
        vUv = uv;
        vN = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D map;
      varying vec2 vUv;
      varying vec3 vN;
      void main() {
        float facing = smoothstep(0.5, 0.75, normalize(vN).z);
        // G channel: cube edges, from the distance to the face border in UV space
        vec2 b = min(vUv, 1.0 - vUv);
        float edge = 1.0 - smoothstep(0.025, 0.05, min(b.x, b.y));
        gl_FragColor = vec4(texture2D(map, vUv).r * facing, edge, 0.0, 1.0);
      }
    `,
  });
}

// ---------- scene pieces ----------

/**
 * Size of the invisible box the cubes live in. Perspective: cubes at the
 * front (z = +depth) project further from centre, so the box is shrunk to
 * what is visible at the front plane, minus a small margin.
 */
export function useBox(depth: number): { w: number; h: number } {
  const { viewport, camera } = useThree();
  const k = (camera.position.z - depth) / camera.position.z;
  return { w: viewport.width * k - 0.4, h: viewport.height * k - 0.4 };
}

/** Floor, side walls, front/back panes and a far lid. `depth` is the half-depth of the box. */
export function Walls({ depth }: { depth: number }) {
  const { w, h } = useBox(depth);
  const t = 1; // wall half-thickness
  const tall = h * 3;
  return (
    <RigidBody type="fixed" key={`${w.toFixed(2)}x${h.toFixed(2)}x${depth.toFixed(2)}`}>
      {/* floor */}
      <CuboidCollider args={[w, t, depth + t]} position={[0, -h / 2 - t, 0]} />
      {/* left / right */}
      <CuboidCollider args={[t, tall, depth + t]} position={[-w / 2 - t, 0, 0]} />
      <CuboidCollider args={[t, tall, depth + t]} position={[w / 2 + t, 0, 0]} />
      {/* back / front */}
      <CuboidCollider args={[w, tall, t]} position={[0, 0, -depth - t]} />
      <CuboidCollider args={[w, tall, t]} position={[0, 0, depth + t]} />
      {/* lid, far above, so flung cubes always come back */}
      <CuboidCollider args={[w, t, depth + t]} position={[0, h * 3, 0]} />
    </RigidBody>
  );
}

/** Invisible kinematic ball that follows the cursor and shoves cubes around. */
export function Pusher({
  active,
  radius = 1.1,
}: {
  active: React.MutableRefObject<boolean>;
  radius?: number;
}) {
  const body = useRef<RapierRigidBody>(null);
  const { viewport, pointer } = useThree();
  useFrame(() => {
    if (!body.current) return;
    if (active.current) {
      body.current.setNextKinematicTranslation({
        x: (pointer.x * viewport.width) / 2,
        y: (pointer.y * viewport.height) / 2,
        z: 0,
      });
    } else {
      body.current.setNextKinematicTranslation({ x: 0, y: -viewport.height * 4, z: 0 });
    }
  });
  return (
    <RigidBody ref={body} type="kinematicPosition" colliders={false} ccd>
      <BallCollider args={[radius]} />
    </RigidBody>
  );
}

/** Kick a body upwards with a little random spin. */
export function pop(b: RapierRigidBody | null, strength = 14) {
  if (!b) return;
  const m = b.mass();
  b.applyImpulse({ x: (Math.random() - 0.5) * 4 * m, y: strength * m, z: 0 }, true);
  b.applyTorqueImpulse(
    { x: (Math.random() - 0.5) * m, y: (Math.random() - 0.5) * m, z: (Math.random() - 0.5) * m },
    true,
  );
}
