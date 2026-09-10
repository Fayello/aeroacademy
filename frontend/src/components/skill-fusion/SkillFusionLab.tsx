'use client';

import { useState, useCallback, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import SkillNode3D from './SkillNode3D';
import ConnectionLines from './ConnectionLines';
import FusionResult from './FusionResult';
import Particles from './Particles';
import { SKILLS, FUSIONS } from './data';
import type { SkillNode, FusionRule } from './data';

const FUSION_DISTANCE = 1.8;

interface ActiveFusion {
  a: string;
  b: string;
}

interface FusionCelebration {
  fusion: FusionRule;
  position: [number, number, number];
}

function Scene({
  skills,
  setSkills,
  selectedId,
  setSelectedId,
  draggingId,
  setDraggingId,
  activeFusion,
  setActiveFusion,
  celebration,
  setCelebration,
}: {
  skills: SkillNode[];
  setSkills: React.Dispatch<React.SetStateAction<SkillNode[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  draggingId: string | null;
  setDraggingId: (id: string | null) => void;
  activeFusion: ActiveFusion | null;
  setActiveFusion: (f: ActiveFusion | null) => void;
  celebration: FusionCelebration | null;
  setCelebration: (c: FusionCelebration | null) => void;
}) {
  const [discovered, setDiscovered] = useState<Set<string>>(new Set());

  const handleSelect = useCallback(
    (id: string) => {
      if (draggingId) return;

      if (selectedId && selectedId !== id) {
        // Check for fusion
        const fusion = FUSIONS.find(
          (f) =>
            (f.a === selectedId && f.b === id) ||
            (f.a === id && f.b === selectedId),
        );

        if (fusion && !discovered.has(fusion.result)) {
          const skillA = skills.find((s) => s.id === selectedId);
          const skillB = skills.find((s) => s.id === id);
          if (skillA && skillB) {
            const midPos: [number, number, number] = [
              (skillA.position[0] + skillB.position[0]) / 2,
              (skillA.position[1] + skillB.position[1]) / 2,
              0.5,
            ];
            setCelebration({ fusion, position: midPos });
            setDiscovered((prev) => new Set(prev).add(fusion.result));
          }
        }
        setSelectedId(null);
        setActiveFusion(null);
      } else {
        setSelectedId(id === selectedId ? null : id);
        setActiveFusion(null);
      }
    },
    [selectedId, draggingId, skills, discovered, setSelectedId, setActiveFusion, setCelebration],
  );

  const handleDragStart = useCallback(
    (id: string) => {
      setDraggingId(id);
    },
    [setDraggingId],
  );

  const handleDragEnd = useCallback(
    (id: string) => {
      setDraggingId(null);
      setActiveFusion(null);
    },
    [setDraggingId, setActiveFusion],
  );

  const handleDragMove = useCallback(
    (id: string, position: THREE.Vector3) => {
      setSkills((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, position: [position.x, position.y, s.position[2]] as [number, number, number] } : s,
        ),
      );

      // Check proximity to other nodes for fusion preview
      const dragged = skills.find((s) => s.id === id);
      if (!dragged) return;

      for (const other of skills) {
        if (other.id === id) continue;
        const dist = new THREE.Vector3(...dragged.position).distanceTo(
          new THREE.Vector3(...other.position),
        );
        if (dist < FUSION_DISTANCE) {
          const fusion = FUSIONS.find(
            (f) =>
              (f.a === id && f.b === other.id) ||
              (f.a === other.id && f.b === id),
          );
          if (fusion) {
            setActiveFusion({ a: id, b: other.id });
            return;
          }
        }
      }
      setActiveFusion(null);
    },
    [skills, setActiveFusion, setSkills],
  );

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={0.8} color="#7AD62A" />
      <pointLight position={[-5, -3, 3]} intensity={0.4} color="#3b82f6" />

      {/* Particles */}
      <Particles />

      {/* Connection lines */}
      <ConnectionLines activeFusion={activeFusion} />

      {/* Skill nodes */}
      {skills.map((skill) => (
        <SkillNode3D
          key={skill.id}
          skill={skill}
          isSelected={selectedId === skill.id}
          isDragging={draggingId === skill.id}
          onSelect={handleSelect}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragMove={handleDragMove}
        />
      ))}

      {/* Fusion celebration */}
      {celebration && (
        <FusionResult
          key={celebration.fusion.result}
          fusion={celebration.fusion}
          position={celebration.position}
          onComplete={() => setCelebration(null)}
        />
      )}

      {/* Camera controls */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={4}
        maxDistance={12}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </>
  );
}

export default function SkillFusionLab() {
  const [skills, setSkills] = useState<SkillNode[]>(SKILLS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [activeFusion, setActiveFusion] = useState<ActiveFusion | null>(null);
  const [celebration, setCelebration] = useState<FusionCelebration | null>(null);
  const [discovered, setDiscovered] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // Track discovered fusions from celebration state
  useEffect(() => {
    if (celebration) {
      setDiscovered((prev) => new Set(prev).add(celebration.fusion.result));
    }
  }, [celebration]);

  const selectedSkill = skills.find((s) => s.id === selectedId);
  const activeFusionRule = activeFusion
    ? FUSIONS.find(
        (f) =>
          (f.a === activeFusion.a && f.b === activeFusion.b) ||
          (f.a === activeFusion.b && f.b === activeFusion.a),
      )
    : null;

  // Static fallback for mobile/reduced-motion
  if (isMobile || reducedMotion) {
    return (
      <div className="w-full bg-[#0a0f1a] rounded-2xl border border-white/10 p-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-white mb-2">Skill Fusion Lab</h3>
          <p className="text-sm text-gray-400">
            Drag two skills together to discover specializations
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className="rounded-xl border border-white/10 p-4 text-center"
              style={{ borderColor: skill.color + '40' }}
            >
              <div
                className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: skill.color + '30', color: skill.color }}
              >
                {skill.mastery}
              </div>
              <div className="text-sm font-medium text-white">{skill.name}</div>
              <div className="text-xs text-gray-500">{skill.domain}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 space-y-2">
          <h4 className="text-sm font-semibold text-gray-400">Discoverable Fusions</h4>
          {FUSIONS.map((f) => {
            const a = skills.find((s) => s.id === f.a);
            const b = skills.find((s) => s.id === f.b);
            return (
              <div
                key={f.result}
                className="flex items-center gap-2 text-xs text-gray-500"
              >
                <span style={{ color: a?.color }}>{a?.name}</span>
                <span>+</span>
                <span style={{ color: b?.color }}>{b?.name}</span>
                <span>=</span>
                <span className="text-white font-medium">{f.result}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] lg:h-[600px] bg-[#0a0f1a] rounded-2xl border border-white/10 overflow-hidden relative">
      {/* Title overlay */}
      <div className="absolute top-4 left-4 z-10">
        <h3 className="text-lg font-bold text-white">Skill Fusion Lab</h3>
        <p className="text-xs text-gray-400">
          Drag skills together to discover specializations
        </p>
      </div>

      {/* Discovered count */}
      <div className="absolute top-4 right-4 z-10 bg-[#0f172a]/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10">
        <span className="text-xs text-gray-400">Discovered: </span>
        <span className="text-sm font-bold text-[#7AD62A]">
          {discovered.size}
        </span>
        <span className="text-xs text-gray-500">/{FUSIONS.length}</span>
      </div>

      {/* Selected skill info */}
      {selectedSkill && !draggingId && (
        <div className="absolute bottom-4 left-4 z-10 bg-[#0f172a]/90 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10 max-w-[200px]">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: selectedSkill.color }}
            />
            <span className="text-sm font-semibold text-white">
              {selectedSkill.name}
            </span>
          </div>
          <div className="text-xs text-gray-400">{selectedSkill.domain}</div>
          <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${selectedSkill.mastery}%`,
                backgroundColor: selectedSkill.color,
              }}
            />
          </div>
          <div className="text-[10px] text-gray-500 mt-1">
            {selectedSkill.mastery}% mastery
          </div>
        </div>
      )}

      {/* Active fusion preview */}
      {activeFusionRule && draggingId && (
        <div className="absolute bottom-4 right-4 z-10 bg-[#7AD62A]/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-[#7AD62A]/30">
          <div className="text-xs text-[#7AD62A] font-medium">
            Fusion Available
          </div>
          <div className="text-sm font-bold text-white mt-1">
            {activeFusionRule.result}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">
            {activeFusionRule.description}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-[10px] text-gray-600">
        Click to select &middot; Drag to move &middot; Combine two skills
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 7], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Scene
            skills={skills}
            setSkills={setSkills}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            draggingId={draggingId}
            setDraggingId={setDraggingId}
            activeFusion={activeFusion}
            setActiveFusion={setActiveFusion}
            celebration={celebration}
            setCelebration={setCelebration}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
