import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Physics, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import {
  CATEGORIES,
  TOOLS,
  type Category,
  type CategoryId,
  type Tool,
} from "../../data/toolbox";
import { Pusher, Walls, makeLabelMaskMaterial, makeLabelTexture, pop, type FaceSpec } from "../cubes/engine";
import PostFX, { type FxMode } from "./PostFX";

const BG = "#140a18";
const FX_MODES: { id: FxMode; label: string }[] = [
  { id: "crt", label: "CRT" },
  { id: "led", label: "LED" },
  { id: "ascii", label: "ASCII" },
  { id: "glitch", label: "Glitch" },
  { id: "lens", label: "Lens" },
  { id: "dither", label: "Dither" },
  { id: "off", label: "Off" },
];

const CAT_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<
  CategoryId,
  Category
>;

const DEPTH = 2.6; // half-depth of the "box" the cubes live in
const SIZE_BY_WEIGHT = [1.45, 1.8, 2.2];

const faceOf = (tool: Tool): FaceSpec => ({
  text: tool.name,
  color: CAT_BY_ID[tool.cat].color,
  textColor: CAT_BY_ID[tool.cat].text,
});

// ---------- scene pieces ----------

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface CubesProps {
  bodies: React.MutableRefObject<(RapierRigidBody | null)[]>;
  order: Tool[];
  onHover: (t: Tool | null) => void;
}

function Cubes({ bodies, order, onHover }: CubesProps) {
  const { viewport } = useThree();
  // cube scale follows the canvas width so phones get smaller cubes
  // (narrow/portrait screens get relatively bigger cubes so labels stay legible)
  const narrow = viewport.width < viewport.height;
  const unit = THREE.MathUtils.clamp(viewport.width / (narrow ? 15 : 30), 0.5, 1.1);

  const geometries = useMemo(
    () =>
      SIZE_BY_WEIGHT.map((s) => new RoundedBoxGeometry(s * unit, s * unit, s * unit, 3, 0.14 * s * unit)),
    [unit],
  );

  const materials = useMemo(
    () =>
      order.map(
        (tool) =>
          new THREE.MeshStandardMaterial({
            map: makeLabelTexture(faceOf(tool)),
            roughness: 0.42,
            metalness: 0.05,
          }),
      ),
    [order],
  );

  const labelMaterials = useMemo(
    () => order.map((tool) => makeLabelMaskMaterial(makeLabelTexture(faceOf(tool), true))),
    [order],
  );

  useEffect(
    () => () => {
      labelMaterials.forEach((m) => m.uniforms.map.value.dispose());
      [...materials, ...labelMaterials].forEach((m) => {
        if ("map" in m) (m as THREE.MeshStandardMaterial).map?.dispose();
        m.dispose();
      });
    },
    [materials, labelMaterials],
  );
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);

  const spawn = useMemo(
    () =>
      order.map((_, i) => ({
        position: [
          (Math.random() - 0.5) * (viewport.width - 3),
          // staggered rain, always below the lid (h * 3)
          viewport.height / 2 + 2 + (i / order.length) * viewport.height * 2,
          (Math.random() - 0.5) * DEPTH,
        ] as [number, number, number],
        rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI] as [
          number,
          number,
          number,
        ],
      })),
    // spawn positions only matter for the first drop
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [order],
  );

  return (
    <>
      {order.map((tool, i) => (
        <RigidBody
          key={tool.name}
          ref={(b) => {
            bodies.current[i] = b;
          }}
          position={spawn[i].position}
          rotation={spawn[i].rotation}
          colliders="cuboid"
          restitution={0.25}
          friction={0.7}
          linearDamping={0.15}
          angularDamping={0.2}
        >
          <mesh
            geometry={geometries[(tool.weight ?? 1) - 1]}
            material={materials[i]}
            userData={{ labelMaterial: labelMaterials[i] }}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor = "pointer";
              onHover(tool);
            }}
            onPointerOut={() => {
              document.body.style.cursor = "";
              onHover(null);
            }}
            onClick={(e) => {
              e.stopPropagation();
              pop(bodies.current[i]);
            }}
          />
        </RigidBody>
      ))}
    </>
  );
}

// ---------- widget ----------

export default function ToolboxCubes() {
  const wrapper = useRef<HTMLDivElement>(null);
  const pointerInside = useRef(false);
  const bodies = useRef<(RapierRigidBody | null)[]>([]);
  const [inView, setInView] = useState(true);
  const [round, setRound] = useState(0);
  const [hovered, setHovered] = useState<Tool | null>(null);
  const [fx, setFx] = useState<FxMode>(() => {
    const q = new URLSearchParams(window.location.search).get("fx") as FxMode | null;
    return q && FX_MODES.some((m) => m.id === q) ? q : "crt";
  });

  const order = useMemo(() => shuffle(TOOLS), [round]);

  // pause rendering + physics when scrolled away
  useEffect(() => {
    const el = wrapper.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      rootMargin: "100px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const jumpCategory = (id: CategoryId) => {
    order.forEach((tool, i) => {
      if (tool.cat !== id) return;
      pop(bodies.current[i], 12 + Math.random() * 6);
    });
  };

  const hoveredCat = hovered ? CAT_BY_ID[hovered.cat] : null;

  return (
    <section
      className="relative w-full overflow-hidden rounded-3xl ring-1 ring-white/10"
      style={{ background: BG }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-3 p-4 sm:p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-bold tracking-tight text-[#FFDDFF] sm:text-2xl">Toolbox</h2>
          <button
            type="button"
            onClick={() => setRound((r) => r + 1)}
            className="pointer-events-auto rounded-full border border-white/20 px-3 py-1 text-xs text-[#FFDDFF]/80 transition hover:border-white/50 hover:text-[#FFDDFF]"
          >
            Drop again
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => jumpCategory(c.id)}
              className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs text-[#FFDDFF]/80 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-[#FFDDFF]"
            >
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c.color }} />
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={wrapper}
        className="h-[78vh] min-h-[480px] w-full touch-pan-y"
        onPointerEnter={() => (pointerInside.current = true)}
        onPointerLeave={() => (pointerInside.current = false)}
      >
        <Canvas
          frameloop={inView ? "always" : "never"}
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 30], fov: 35 }}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={1.4} />
          <directionalLight position={[8, 14, 12]} intensity={2.2} />
          <directionalLight position={[-10, -4, 6]} intensity={0.6} />
          <Suspense fallback={null}>
            <Physics gravity={[0, -30, 0]} paused={!inView}>
              <Walls depth={DEPTH} />
              <Pusher active={pointerInside} />
              <Cubes key={round} bodies={bodies} order={order} onHover={setHovered} />
            </Physics>
          </Suspense>
          <PostFX
            mode={fx}
            pointerInside={pointerInside}
            background={BG}
            isIdle={() =>
              !pointerInside.current && bodies.current.every((b) => !b || b.isSleeping())
            }
          />
        </Canvas>
      </div>

      <div className="absolute bottom-4 right-4 z-20 flex gap-1 rounded-full bg-black/40 p-1 backdrop-blur">
        {FX_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setFx(m.id)}
            className={`rounded-full px-2.5 py-1 text-xs transition ${
              fx === m.id ? "bg-[#FFDDFF] text-[#1C0E21]" : "text-[#FFDDFF]/70 hover:text-[#FFDDFF]"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-14 z-10 flex justify-center p-4 sm:bottom-0">
        <div
          className="rounded-full bg-black/40 px-4 py-1.5 text-sm text-[#FFDDFF] backdrop-blur transition-opacity"
          style={{ opacity: hovered ? 1 : 0 }}
        >
          {hovered && hoveredCat && (
            <>
              <span className="font-semibold">{hovered.name}</span>
              <span className="mx-2 opacity-40">·</span>
              <span style={{ color: hoveredCat.color }}>{hoveredCat.label}</span>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
