'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import type { FusionRule } from './data';

interface FusionResultProps {
  fusion: FusionRule;
  position: [number, number, number];
  onComplete: () => void;
}

export default function FusionResult({ fusion, position, onComplete }: FusionResultProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [phase, setPhase] = useState<'burst' | 'reveal' | 'settle'>('burst');
  const startTime = useRef(Date.now());

  useFrame(() => {
    if (!groupRef.current) return;
    const elapsed = (Date.now() - startTime.current) / 1000;

    if (phase === 'burst' && elapsed > 0.5) setPhase('reveal');
    if (phase === 'reveal' && elapsed > 2) setPhase('settle');
    if (phase === 'settle' && elapsed > 3) {
      onComplete();
      return;
    }

    // Scale animation
    if (phase === 'burst') {
      const s = Math.min(1, elapsed * 4);
      groupRef.current.scale.setScalar(s * 1.5);
    } else if (phase === 'reveal') {
      const s = 1 + Math.sin(elapsed * 3) * 0.1;
      groupRef.current.scale.setScalar(s);
    } else {
      const s = THREE.MathUtils.lerp(groupRef.current.scale.x, 0, 0.05);
      groupRef.current.scale.setScalar(s);
    }

    // Rotation
    groupRef.current.rotation.y = elapsed * 0.5;
  });

  const color = new THREE.Color(fusion.resultColor);

  return (
    <group ref={groupRef} position={position}>
      {/* Burst sphere */}
      <Sphere args={[0.5, 32, 32]}>
        <meshBasicMaterial
          color={fusion.resultColor}
          transparent
          opacity={phase === 'burst' ? 0.8 : 0.3}
          depthWrite={false}
        />
      </Sphere>

      {/* Outer glow */}
      <Sphere args={[1.2, 16, 16]}>
        <meshBasicMaterial
          color={fusion.resultColor}
          transparent
          opacity={0.1}
          depthWrite={false}
        />
      </Sphere>

      {/* Result name */}
      <Text
        position={[0, 0.8, 0]}
        fontSize={0.22}
        color="white"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.02}
        outlineColor="#000"
      >
        {fusion.result}
      </Text>

      {/* Description */}
      <Text
        position={[0, -0.8, 0]}
        fontSize={0.1}
        color={fusion.resultColor}
        anchorX="center"
        anchorY="top"
      >
        {fusion.description}
      </Text>
    </group>
  );
}
