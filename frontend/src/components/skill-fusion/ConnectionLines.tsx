'use client';

import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { SKILLS, FUSIONS } from './data';

interface ConnectionLinesProps {
  activeFusion: { a: string; b: string } | null;
}

export default function ConnectionLines({ activeFusion }: ConnectionLinesProps) {
  const connections = useMemo(() => {
    const pairs: {
      points: [THREE.Vector3, THREE.Vector3];
      color: string;
      active: boolean;
    }[] = [];
    const seen = new Set<string>();

    for (const fusion of FUSIONS) {
      const skillA = SKILLS.find((s) => s.id === fusion.a);
      const skillB = SKILLS.find((s) => s.id === fusion.b);
      if (!skillA || !skillB) continue;

      const key = [fusion.a, fusion.b].sort().join('-');
      if (seen.has(key)) continue;
      seen.add(key);

      const isActive =
        activeFusion &&
        ((activeFusion.a === fusion.a && activeFusion.b === fusion.b) ||
          (activeFusion.a === fusion.b && activeFusion.b === fusion.a));

      pairs.push({
        points: [
          new THREE.Vector3(...skillA.position),
          new THREE.Vector3(...skillB.position),
        ],
        color: isActive ? '#7AD62A' : '#1e3a5f',
        active: !!isActive,
      });
    }
    return pairs;
  }, [activeFusion]);

  return (
    <group>
      {connections.map((conn, i) => (
        <Line
          key={i}
          points={conn.points}
          color={conn.color}
          lineWidth={conn.active ? 2 : 0.5}
          transparent
          opacity={conn.active ? 0.8 : 0.2}
          dashed={!conn.active}
          dashScale={5}
          dashSize={0.5}
          gapSize={0.5}
        />
      ))}
    </group>
  );
}
