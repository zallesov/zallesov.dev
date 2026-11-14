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
import { Pusher, Walls, makeLabelTexture, pop, type FaceSpec } from "../cubes/engine";

const BG = "#140a18";

const CAT_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<
  CategoryId,
  Category
>;

const DEPTH = 2.6; // half-depth of the "box" the cubes live in
const SIZE_BY_WEIGHT = [1.45, 1.85, 2.6];

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
  const unit = THREE.MathUtils.clamp(viewport.width / (narrow ? 14 : 25), 0.5, 1.3);

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

  useEffect(
    () => () => {
      materials.forEach((m) => {
        m.map?.dispose();
        m.dispose();
      });
    },
    [materials],
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
        </Canvas>
      </div>


      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center p-4">
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
