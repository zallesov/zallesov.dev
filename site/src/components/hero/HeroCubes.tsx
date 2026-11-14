import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { CuboidCollider, Physics, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Pusher, Walls, makeLabelMaskMaterial, makeLabelTexture, pop, useBox } from "../cubes/engine";
import PostFX, { type FxMode } from "../toolbox/PostFX";

const BG = "#140a18";
const WORDS = ["ALEX", "ZALL"];
const LETTER_COLOR = "#F97316";
const LETTER_TEXT = "#1C0E21";
const LETTER_FONT = '"Black Ops One", system-ui, sans-serif';
const FILLER_COLORS = ["#3a2447", "#4c2f5d", "#5f3b73"];
const FILLER_SIZES = [1.0, 1.3, 1.6];
const FX_IDS: FxMode[] = ["ascii", "crt", "led", "glitch", "lens", "dither", "off"];

const GAP = 0.08; // gap between letters, in cube sizes
const WORD_GAP = 0.6; // extra gap between the two words, in cube sizes
const MAX_SIZE = 2.8;
const LETTER_DROP = 4; // height the first letter falls from
const LETTER_STAGGER = 1.6; // extra height per following letter, so they land one by one

interface Layout {
  size: number;
  /** Half-depth of the box: just deeper than a letter, so nothing can land in front of the name. */
  depth: number;
  /** Rest position of each letter (x, level), in reading order. */
  slots: { ch: string; x: number; level: number }[];
}

/** One row on wide screens, two stacked rows (ALEX over ZALL) on narrow ones. */
function useLayout(): Layout {
  const { viewport } = useThree();
  return useMemo(() => {
    const usable = viewport.width * 0.82;
    const n = WORDS[0].length + WORDS[1].length;
    const oneRowUnits = n + (n - 1) * GAP + WORD_GAP;
    const twoRowUnits = WORDS[0].length + (WORDS[0].length - 1) * GAP;
    const s1 = Math.min(MAX_SIZE, usable / oneRowUnits);
    const s2 = Math.min(MAX_SIZE, usable / twoRowUnits);
    const stacked = s2 > s1 * 1.5;
    const size = stacked ? s2 : s1;

    const row = (word: string, startX: number, level: number) =>
      [...word].map((ch, i) => ({ ch, x: startX + i * size * (1 + GAP), level }));

    let slots: Layout["slots"];
    if (stacked) {
      const startX = (-(twoRowUnits - 1) * size) / 2;
      slots = [...row(WORDS[0], startX, 1), ...row(WORDS[1], startX, 0)];
    } else {
      const startX = (-(oneRowUnits - 1) * size) / 2;
      const second = startX + WORDS[0].length * size * (1 + GAP) + WORD_GAP * size;
      slots = [...row(WORDS[0], startX, 0), ...row(WORDS[1], second, 0)];
    }
    return { size, depth: size / 2 + 0.35, slots };
  }, [viewport.width]);
}

function Scene({
  bodies,
  pointerInside,
}: {
  bodies: React.MutableRefObject<(RapierRigidBody | null)[]>;
  pointerInside: React.MutableRefObject<boolean>;
}) {
  const layout = useLayout();
  const { size, depth, slots } = layout;
  const { w, h } = useBox(depth);
  const unit = THREE.MathUtils.clamp(size / MAX_SIZE, 0.6, 1);

  // ---- letters ----
  const letterGeometry = useMemo(() => new RoundedBoxGeometry(size, size, size, 3, 0.12 * size), [size]);
  const letterMaterials = useMemo(() => {
    const byChar = new Map<string, { lit: THREE.MeshStandardMaterial; mask: THREE.ShaderMaterial }>();
    for (const { ch } of slots) {
      if (byChar.has(ch)) continue;
      const face = { text: ch, color: LETTER_COLOR, textColor: LETTER_TEXT, font: LETTER_FONT, fontWeight: 400, maxSize: 170 };
      byChar.set(ch, {
        lit: new THREE.MeshStandardMaterial({ map: makeLabelTexture(face), roughness: 0.42, metalness: 0.05 }),
        mask: makeLabelMaskMaterial(makeLabelTexture(face, true)),
      });
    }
    return byChar;
  }, [slots]);

  // ---- fillers: plain, muted cubes so the name stays the only loud thing ----
  const fillerGeometries = useMemo(
    () => FILLER_SIZES.map((s) => new RoundedBoxGeometry(s * unit, s * unit, s * unit, 3, 0.14 * s * unit)),
    [unit],
  );
  const fillerMaterials = useMemo(
    () => FILLER_COLORS.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, metalness: 0.05 })),
    [],
  );
  const blankMask = useMemo(() => {
    const tex = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
    tex.needsUpdate = true;
    return makeLabelMaskMaterial(tex);
  }, []);

  const fillers = useMemo(() => {
    const count = Math.round(THREE.MathUtils.clamp(w * 1.1, 14, 46));
    const levels = slots.some((s) => s.level === 1) ? 2 : 1;
    const fillerStart = -h / 2 + levels * size + LETTER_DROP + slots.length * LETTER_STAGGER + 10;
    return Array.from({ length: count }, (_, i) => {
      const kind = i % FILLER_SIZES.length;
      const half = (FILLER_SIZES[kind] * unit) / 2;
      return {
        kind,
        color: Math.floor(Math.random() * FILLER_COLORS.length),
        position: [
          (Math.random() - 0.5) * (w - 2),
          // start above every letter's spawn point so the name has landed and settled
          // before anything hits it; always below the lid (h * 3)
          fillerStart + (i / count) * Math.max(4, Math.min(h * 1.6, h * 3 - fillerStart - 4)),
          (Math.random() - 0.5) * 2 * Math.max(0, depth - half - 0.05),
        ] as [number, number, number],
        rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI] as [number, number, number],
      };
    });
  }, [w, h, depth, unit, size, slots]);

  useEffect(
    () => () => {
      letterMaterials.forEach(({ lit, mask }) => {
        lit.map?.dispose();
        lit.dispose();
        mask.uniforms.map.value.dispose();
        mask.dispose();
      });
    },
    [letterMaterials],
  );
  useEffect(() => () => letterGeometry.dispose(), [letterGeometry]);
  useEffect(() => () => fillerGeometries.forEach((g) => g.dispose()), [fillerGeometries]);

  const floor = -h / 2;
  const stacked = slots.some((sl) => sl.level === 1);
  const hover = {
    onPointerOver: (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      document.body.style.cursor = "pointer";
    },
    onPointerOut: () => {
      document.body.style.cursor = "";
    },
  };

  return (
    <>
      <Walls depth={depth} />
      <Pusher active={pointerInside} radius={Math.max(0.8, size * 0.42)} />

      {slots.map((slot, i) => {
        const mats = letterMaterials.get(slot.ch)!;
        const restY = floor + size / 2 + slot.level * size;
        // bottom row lands first; letters arrive one after another, like typing
        const order = slot.level === 0 ? i % WORDS[0].length : WORDS[0].length + (i % WORDS[0].length);
        const dropFrom = slots.some((s) => s.level === 1) ? order : i;
        return (
          <RigidBody
            key={`letter-${i}-${size.toFixed(2)}`}
            ref={(b) => {
              bodies.current[i] = b;
            }}
            // a stacked wall is placed already built: letters landing on letters tumble
            position={[slot.x, stacked ? restY + 0.02 * (slot.level + 1) : restY + LETTER_DROP + dropFrom * LETTER_STAGGER, 0]}
            colliders={false}
            linearDamping={0.1}
            angularDamping={0.3}
          >
            {/* heavy, so falling fillers don't shove the name around */}
            <CuboidCollider args={[size / 2, size / 2, size / 2]} density={4} friction={0.9} restitution={0.05} />
            <mesh
              geometry={letterGeometry}
              material={mats.lit}
              userData={{ labelMaterial: mats.mask }}
              {...hover}
              onClick={(e) => {
                e.stopPropagation();
                pop(bodies.current[i], 11);
              }}
            />
          </RigidBody>
        );
      })}

      {fillers.map((f, i) => {
        const idx = slots.length + i;
        return (
          <RigidBody
            key={`filler-${i}-${fillers.length}-${size.toFixed(2)}`}
            ref={(b) => {
              bodies.current[idx] = b;
            }}
            position={f.position}
            rotation={f.rotation}
            colliders="cuboid"
            restitution={0.2}
            friction={0.6}
            linearDamping={0.15}
            angularDamping={0.2}
          >
            <mesh
              geometry={fillerGeometries[f.kind]}
              material={fillerMaterials[f.color]}
              userData={{ labelMaterial: blankMask }}
              {...hover}
              onClick={(e) => {
                e.stopPropagation();
                pop(bodies.current[idx]);
              }}
            />
          </RigidBody>
        );
      })}
    </>
  );
}

/**
 * Hero: the name as heavy letter cubes that drop into place, buried in a
 * rain of plain cubes. The cursor shoves everything around.
 * Fills its positioned parent; marks the closest <section> with
 * data-cubes="on" once running so the static fallback can be hidden.
 */
export default function HeroCubes({ fx: fxProp = "ascii" }: { fx?: FxMode }) {
  const root = useRef<HTMLDivElement>(null);
  const pointerInside = useRef(false);
  const bodies = useRef<(RapierRigidBody | null)[]>([]);
  const [inView, setInView] = useState(true);
  const [round, setRound] = useState(0);
  const [fontReady, setFontReady] = useState(false);
  const [enabled] = useState(() => !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [fx] = useState<FxMode>(() => {
    const q = new URLSearchParams(window.location.search).get("fx") as FxMode | null;
    return q && FX_IDS.includes(q) ? q : fxProp;
  });

  // the page's own "rebuild" control lives outside this component
  useEffect(() => {
    const rebuild = () => setRound((r) => r + 1);
    window.addEventListener("hero:rebuild", rebuild);
    return () => window.removeEventListener("hero:rebuild", rebuild);
  }, []);

  // the letter textures are drawn on a 2D canvas, which needs the display font loaded first
  useEffect(() => {
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        setFontReady(true);
      }
    };
    document.fonts.load(`170px ${LETTER_FONT}`).then(finish, finish);
    const t = window.setTimeout(finish, 2000);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (!enabled) return null;

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="absolute inset-0 touch-pan-y"
      onPointerEnter={() => (pointerInside.current = true)}
      onPointerLeave={() => (pointerInside.current = false)}
    >
      {fontReady && (
        <Canvas
          frameloop={inView ? "always" : "never"}
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 30], fov: 35 }}
          gl={{ antialias: true, alpha: true }}
          onCreated={() => {
            const section = root.current?.closest("section");
            section?.setAttribute("data-cubes", "on");
            section?.querySelector(".hero-rebuild")?.classList.remove("hidden");
          }}
        >
          <ambientLight intensity={1.4} />
          <directionalLight position={[8, 14, 12]} intensity={2.2} />
          <directionalLight position={[-10, -4, 6]} intensity={0.6} />
          <Suspense fallback={null}>
            <Physics gravity={[0, -30, 0]} paused={!inView}>
              <Scene key={round} bodies={bodies} pointerInside={pointerInside} />
            </Physics>
          </Suspense>
          <PostFX
            mode={fx}
            pointerInside={pointerInside}
            background={BG}
            isIdle={() => !pointerInside.current && bodies.current.every((b) => !b || b.isSleeping())}
          />
        </Canvas>
      )}
    </div>
  );
}
