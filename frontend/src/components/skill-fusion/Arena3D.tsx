'use client';

import { useRef, useState, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import type { Skill } from './data';

interface ArenaSkill {
  skill: Skill;
  position: THREE.Vector3;
  targetPosition: THREE.Vector3;
}

interface SkillNodeProps {
  arenaSkill: ArenaSkill;
  isSelected: boolean;
  isFusing: boolean;
  onClick: () => void;
  onDrag: (pos: THREE.Vector3) => void;
  onDragEnd: () => void;
}

function SkillNode({ arenaSkill, isSelected, isFusing, onClick, onDrag, onDragEnd }: SkillNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const { camera, gl } = useThree();

  const color = useMemo(() => new THREE.Color(arenaSkill.skill.color), [arenaSkill.skill.color]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;

    // Smooth position interpolation
    meshRef.current.position.lerp(arenaSkill.targetPosition, 0.08);

    // Floating bob
    const bob = Math.sin(t * 1.5 + arenaSkill.position.x * 2) * 0.08;
    meshRef.current.position.y = arenaSkill.targetPosition.y + bob;

    // Glow pulse
    if (glowRef.current) {
      const scale = 1 + Math.sin(t * 2) * 0.1;
      glowRef.current.scale.setScalar(scale);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = isSelected ? 0.2 : 0.08;
    }

    // Ring rotation
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.5;
      ringRef.current.rotation.x = Math.sin(t * 0.3) * 0.2;
    }

    // Fusing animation
    if (isFusing) {
      const fuseScale = 1 + Math.sin(t * 8) * 0.2;
      meshRef.current.scale.setScalar(fuseScale);
    } else {
      meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }
  });

  const handlePointerDown = useCallback((e: any) => {
    e.stopPropagation();
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: any) => {
    if (!dragging) return;
    e.stopPropagation();
    const rect = gl.domElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    const vec = new THREE.Vector3(x, y, 0.5);
    vec.unproject(camera);
    vec.sub(camera.position).normalize();
    const dist = -camera.position.z / vec.z;
    const pos = camera.position.clone().add(vec.multiplyScalar(dist));
    onDrag(pos);
  }, [dragging, camera, gl, onDrag]);

  const handlePointerUp = useCallback((e: any) => {
    setDragging(false);
    onDragEnd();
  }, [onDragEnd]);

  return (
    <group
      ref={meshRef}
      position={arenaSkill.position.toArray()}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerOver={() => { setHovered(true); gl.domElement.style.cursor = 'grab'; }}
      onPointerOut={() => { setHovered(false); setDragging(false); gl.domElement.style.cursor = 'default'; }}
    >
      {/* Outer glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.65, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.08} />
      </mesh>

      {/* Main sphere */}
      <mesh>
        <sphereGeometry args={[0.45, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 0.5 : hovered ? 0.3 : 0.15}
          roughness={0.3}
          metalness={0.6}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Inner letter */}
      <Billboard>
        <Text
          fontSize={0.35}
          color="white"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {arenaSkill.skill.name.charAt(0)}
        </Text>
      </Billboard>

      {/* Rotating ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.58, 0.015, 16, 64]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isSelected ? 0.8 : 0.4}
        />
      </mesh>

      {/* Selection indicator */}
      {isSelected && (
        <mesh>
          <torusGeometry args={[0.72, 0.01, 8, 64]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
        </mesh>
      )}

      {/* Label below */}
      <Billboard position={[0, -0.7, 0]}>
        <Text fontSize={0.12} color="white" anchorX="center" anchorY="middle">
          {arenaSkill.skill.name}
        </Text>
      </Billboard>
    </group>
  );
}

function FusionIndicator({ a, b, opacity }: { a: THREE.Vector3; b: THREE.Vector3; opacity: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const mid = useMemo(() => a.clone().add(b).multiplyScalar(0.5), [a, b]);
  const dist = useMemo(() => a.distanceTo(b), [a, b]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.copy(mid);
    ref.current.lookAt(state.camera.position);
    const s = Math.max(0, 1 - dist / 3);
    ref.current.scale.setScalar(s);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = opacity * s * 0.3;
  });

  return (
    <mesh ref={ref}>
      <planeGeometry args={[1.2, 1.2]} />
      <meshBasicMaterial color="#7AD62A" transparent opacity={0} side={THREE.DoubleSide} />
    </mesh>
  );
}

interface ArenaSceneProps {
  arenaSkills: Skill[];
  onSkillMove: (skillId: string, position: THREE.Vector3) => void;
  onSelect: (skillId: string) => void;
  selectedId: string | null;
  isFusing: boolean;
}

function ArenaScene({ arenaSkills, onSkillMove, onSelect, selectedId, isFusing }: ArenaSceneProps) {
  const [positions, setPositions] = useState<Map<string, THREE.Vector3>>(new Map());
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Initialize positions in a spread layout
  useMemo(() => {
    const newPositions = new Map<string, THREE.Vector3>();
    arenaSkills.forEach((skill, i) => {
      const existing = positions.get(skill.id);
      if (existing) {
        newPositions.set(skill.id, existing);
      } else {
        const angle = (i / Math.max(arenaSkills.length, 2)) * Math.PI * 2 - Math.PI / 2;
        const radius = arenaSkills.length === 2 ? 1.5 : 1.8;
        newPositions.set(
          skill.id,
          new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0),
        );
      }
    });
    setPositions(newPositions);
  }, [arenaSkills.length]);

  const handleDrag = useCallback(
    (skillId: string, pos: THREE.Vector3) => {
      setPositions((prev) => new Map(prev).set(skillId, pos));
      onSkillMove(skillId, pos);
    },
    [onSkillMove],
  );

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[3, 3, 5]} intensity={0.6} color="#7AD62A" />
      <pointLight position={[-3, -2, 3]} intensity={0.3} color="#3b82f6" />
      <pointLight position={[0, 0, -3]} intensity={0.2} color="#a855f7" />

      {/* Background grid */}
      <gridHelper args={[20, 40, '#1e3a5f', '#0f172a']} position={[0, 0, -1]} />

      {/* Arena skills */}
      {arenaSkills.map((skill) => (
        <SkillNode
          key={skill.id}
          arenaSkill={{
            skill,
            position: positions.get(skill.id) || new THREE.Vector3(),
            targetPosition: positions.get(skill.id) || new THREE.Vector3(),
          }}
          isSelected={selectedId === skill.id}
          isFusing={isFusing}
          onClick={() => onSelect(skill.id)}
          onDrag={(pos) => handleDrag(skill.id, pos)}
          onDragEnd={() => setDraggingId(null)}
        />
      ))}

      {/* Fusion indicator line between two skills */}
      {arenaSkills.length === 2 && positions.size === 2 && (
        <FusionIndicator
          a={positions.get(arenaSkills[0].id) || new THREE.Vector3()}
          b={positions.get(arenaSkills[1].id) || new THREE.Vector3()}
          opacity={1}
        />
      )}
    </>
  );
}

interface Arena3DProps {
  arenaSkills: Skill[];
  onSkillMove: (skillId: string, position: THREE.Vector3) => void;
  onSelect: (skillId: string) => void;
  selectedId: string | null;
  isFusing: boolean;
}

export default function Arena3D({ arenaSkills, onSkillMove, onSelect, selectedId, isFusing }: Arena3DProps) {
  return (
    <div className="w-full h-full min-h-[300px]">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ArenaScene
          arenaSkills={arenaSkills}
          onSkillMove={onSkillMove}
          onSelect={onSelect}
          selectedId={selectedId}
          isFusing={isFusing}
        />
      </Canvas>
    </div>
  );
}
