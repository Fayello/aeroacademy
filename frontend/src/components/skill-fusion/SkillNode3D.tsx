'use client';

import { useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import type { SkillNode } from './data';

interface SkillNode3DProps {
  skill: SkillNode;
  isSelected: boolean;
  isDragging: boolean;
  onSelect: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: (id: string) => void;
  onDragMove: (id: string, position: THREE.Vector3) => void;
}

export default function SkillNode3D({
  skill,
  isSelected,
  isDragging,
  onSelect,
  onDragStart,
  onDragEnd,
  onDragMove,
}: SkillNode3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const baseScale = 0.3 + (skill.mastery / 100) * 0.4;
  const targetScale = hovered ? baseScale * 1.2 : baseScale;

  useFrame((state) => {
    if (!meshRef.current) return;

    // Smooth scale
    const current = meshRef.current.scale.x;
    const next = THREE.MathUtils.lerp(current, targetScale, 0.1);
    meshRef.current.scale.setScalar(next);

    // Gentle float
    const t = state.clock.elapsedTime;
    const idx = ['linux', 'networking', 'devops', 'security', 'cloud', 'databases'].indexOf(skill.id);
    meshRef.current.position.y =
      skill.position[1] + Math.sin(t * 0.5 + idx * 1.2) * 0.08;

    // Glow pulse
    if (glowRef.current) {
      const glowScale = next * (1.6 + Math.sin(t * 1.5 + idx) * 0.15);
      glowRef.current.scale.setScalar(glowScale);
    }
  });

  const handlePointerDown = useCallback(
    (e: any) => {
      e.stopPropagation();
      onSelect(skill.id);
      onDragStart(skill.id);
      (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
    },
    [skill.id, onSelect, onDragStart],
  );

  const handlePointerUp = useCallback(
    (e: any) => {
      e.stopPropagation();
      onDragEnd(skill.id);
    },
    [skill.id, onDragEnd],
  );

  const handlePointerMove = useCallback(
    (e: any) => {
      if (!isDragging) return;
      e.stopPropagation();
      // Project mouse to 3D plane
      const vec = new THREE.Vector3(
        e.point.x,
        e.point.y,
        skill.position[2],
      );
      onDragMove(skill.id, vec);
    },
    [isDragging, skill.id, skill.position, onDragMove],
  );

  const color = new THREE.Color(skill.color);
  const glowOpacity = 0.08 + (skill.mastery / 100) * 0.15;

  return (
    <group position={skill.position}>
      {/* Glow sphere */}
      <Sphere ref={glowRef} args={[1, 16, 16]}>
        <meshBasicMaterial
          color={skill.color}
          transparent
          opacity={isSelected ? 0.25 : glowOpacity}
          depthWrite={false}
        />
      </Sphere>

      {/* Main sphere */}
      <Sphere
        ref={meshRef}
        args={[1, 32, 32]}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onPointerOver={() => {
          setHovered(true);
          document.body.style.cursor = 'grab';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
      >
        <MeshDistortMaterial
          color={skill.color}
          emissive={skill.color}
          emissiveIntensity={isSelected ? 0.6 : 0.3}
          roughness={0.3}
          metalness={0.1}
          distort={isDragging ? 0.3 : 0.1}
          speed={2}
          transparent
          opacity={0.9}
        />
      </Sphere>

      {/* Skill name */}
      <Text
        position={[0, -0.6, 0]}
        fontSize={0.18}
        color="white"
        anchorX="center"
        anchorY="top"
        font="/fonts/inter-bold.woff"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {skill.name}
      </Text>

      {/* Mastery % */}
      <Text
        position={[0, -0.85, 0]}
        fontSize={0.12}
        color={skill.color}
        anchorX="center"
        anchorY="top"
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        {skill.mastery}% mastery
      </Text>

      {/* Domain tag */}
      <Text
        position={[0, 0.7, 0]}
        fontSize={0.09}
        color="#94a3b8"
        anchorX="center"
        anchorY="bottom"
      >
        {skill.domain}
      </Text>
    </group>
  );
}
