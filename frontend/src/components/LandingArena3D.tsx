'use client';

import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';

interface SkillData {
  id: string;
  label: string;
  color: string;
  category: string;
}

interface NodeState {
  skill: SkillData;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  isDragging: boolean;
  radius: number;
}

interface LandingArena3DProps {
  skills: SkillData[];
  onFusion: (a: string, b: string) => void;
}

const FUSION_DISTANCE = 0.9;

function SkillNode({
  node,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  isFusing,
}: {
  node: NodeState;
  onSelect: () => void;
  onDragStart: () => void;
  onDragMove: (worldPos: THREE.Vector3) => void;
  onDragEnd: () => void;
  isFusing: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { camera, gl, raycaster, pointer } = useThree();
  const dragging = useRef(false);
  const dragPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const dragIntersect = useMemo(() => new THREE.Vector3(), []);

  const color = useMemo(() => new THREE.Color(node.skill.color), [node.skill.color]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;

    // Smooth position
    meshRef.current.position.lerp(node.position, 0.15);

    // Bob
    const bob = Math.sin(t * 1.2 + node.position.x * 3) * 0.06;
    meshRef.current.position.y = node.position.y + bob;

    // Glow pulse
    if (glowRef.current) {
      const s = 1 + Math.sin(t * 2 + node.position.x) * 0.12;
      glowRef.current.scale.setScalar(s);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = hovered ? 0.25 : 0.1;
    }

    // Ring rotation
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.4;
      ringRef.current.rotation.x = Math.sin(t * 0.3) * 0.15;
    }

    // Fusing scale pulse
    if (isFusing && meshRef.current) {
      const fs = 1 + Math.sin(t * 10) * 0.3;
      meshRef.current.scale.setScalar(fs);
    } else if (meshRef.current) {
      meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }
  });

  const handlePointerDown = useCallback((e: any) => {
    e.stopPropagation();
    dragging.current = true;
    onDragStart();
    gl.domElement.style.cursor = 'grabbing';
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [gl, onDragStart]);

  const handlePointerMove = useCallback((e: any) => {
    if (!dragging.current) return;
    e.stopPropagation();
    const rect = gl.domElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
    raycaster.ray.intersectPlane(dragPlane, dragIntersect);
    onDragMove(dragIntersect.clone());
  }, [dragging, camera, gl, raycaster, dragPlane, dragIntersect, onDragMove]);

  const handlePointerUp = useCallback((e: any) => {
    if (!dragging.current) return;
    dragging.current = false;
    onDragEnd();
    gl.domElement.style.cursor = hovered ? 'grab' : 'default';
  }, [gl, hovered, onDragEnd]);

  return (
    <group
      ref={meshRef}
      position={node.position.toArray()}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerOver={() => { setHovered(true); if (!dragging.current) gl.domElement.style.cursor = 'grab'; }}
      onPointerOut={() => { setHovered(false); gl.domElement.style.cursor = 'default'; }}
    >
      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.1} />
      </mesh>

      {/* Main sphere */}
      <mesh>
        <sphereGeometry args={[0.38, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.4 : 0.2}
          roughness={0.3}
          metalness={0.5}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* First letter */}
      <Billboard>
        <Text fontSize={0.28} color="white" anchorX="center" anchorY="middle" fontWeight="bold">
          {node.skill.label.charAt(0)}
        </Text>
      </Billboard>

      {/* Rotating ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.48, 0.012, 16, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>

      {/* Label */}
      <Billboard position={[0, -0.6, 0]}>
        <Text fontSize={0.1} color="white" anchorX="center" anchorY="middle">
          {node.skill.label}
        </Text>
      </Billboard>
    </group>
  );
}

function ArenaScene({
  skills,
  onFusion,
}: {
  skills: SkillData[];
  onFusion: (a: string, b: string) => void;
}) {
  const [nodes, setNodes] = useState<NodeState[]>([]);
  const [fusingPair, setFusingPair] = useState<string | null>(null);
  const discoveredRef = useRef(new Set<string>());

  // Sync nodes when skills change
  useEffect(() => {
    setNodes((prev) => {
      const existingIds = new Set(prev.map((n) => n.skill.id));
      const newNodes = skills
        .filter((s) => !existingIds.has(s.id))
        .map((skill, i) => {
          const angle = ((prev.length + i) / Math.max(skills.length, 1)) * Math.PI * 2;
          const r = 1.8 + Math.random() * 0.5;
          return {
            skill,
            position: new THREE.Vector3(Math.cos(angle) * r, Math.sin(angle) * r, 0),
            velocity: new THREE.Vector3((Math.random() - 0.5) * 0.01, (Math.random() - 0.5) * 0.01, 0),
            isDragging: false,
            radius: 0.38,
          };
        });
      return [...prev, ...newNodes];
    });
  }, [skills]);

  // Gentle floating animation
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    setNodes((prev) =>
      prev.map((n) => {
        if (n.isDragging) return n;
        const vx = n.velocity.x + Math.sin(t * 0.5 + n.position.x * 2) * 0.0003;
        const vy = n.velocity.y + Math.cos(t * 0.4 + n.position.y * 3) * 0.0003;
        let nx = n.position.x + vx;
        let ny = n.position.y + vy;
        // Boundary bounce
        if (Math.abs(nx) > 3.5) nx *= 0.98;
        if (Math.abs(ny) > 2.2) ny *= 0.98;
        return { ...n, position: new THREE.Vector3(nx, ny, 0), velocity: new THREE.Vector3(vx * 0.999, vy * 0.999, 0) };
      }),
    );
  });

  // Fusion detection
  useEffect(() => {
    if (nodes.length < 2) return;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (!nodes[i].isDragging && !nodes[j].isDragging) continue;
        const dist = nodes[i].position.distanceTo(nodes[j].position);
        if (dist > FUSION_DISTANCE) continue;

        const a = nodes[i].skill.id;
        const b = nodes[j].skill.id;
        const key = [a, b].sort().join('+');
        if (discoveredRef.current.has(key)) continue;
        discoveredRef.current.add(key);

        setFusingPair(key);
        setTimeout(() => {
          onFusion(a, b);
          setNodes((prev) => prev.filter((n) => n.skill.id !== nodes[j].skill.id));
          setFusingPair(null);
        }, 800);
        return;
      }
    }
  }, [nodes, onFusion]);

  const handleDragStart = useCallback((skillId: string) => {
    setNodes((prev) => prev.map((n) => (n.skill.id === skillId ? { ...n, isDragging: true } : n)));
  }, []);

  const handleDragMove = useCallback((skillId: string, worldPos: THREE.Vector3) => {
    setNodes((prev) =>
      prev.map((n) =>
        n.skill.id === skillId
          ? { ...n, position: worldPos, velocity: new THREE.Vector3(0, 0, 0) }
          : n,
      ),
    );
  }, []);

  const handleDragEnd = useCallback((skillId: string) => {
    setNodes((prev) => prev.map((n) => (n.skill.id === skillId ? { ...n, isDragging: false } : n)));
  }, []);

  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[3, 3, 5]} intensity={0.6} color="#7AD62A" />
      <pointLight position={[-3, -2, 3]} intensity={0.3} color="#3b82f6" />
      <pointLight position={[0, 0, -3]} intensity={0.15} color="#a855f7" />

      {/* Subtle grid */}
      <gridHelper args={[16, 32, '#1e3a5f', '#0f172a']} position={[0, 0, -0.5]} />

      {nodes.map((node) => (
        <SkillNode
          key={node.skill.id}
          node={node}
          onSelect={() => {}}
          onDragStart={() => handleDragStart(node.skill.id)}
          onDragMove={(pos) => handleDragMove(node.skill.id, pos)}
          onDragEnd={() => handleDragEnd(node.skill.id)}
          isFusing={fusingPair !== null && fusingPair.includes(node.skill.id)}
        />
      ))}
    </>
  );
}

export default function LandingArena3D({ skills, onFusion }: LandingArena3DProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <ArenaScene skills={skills} onFusion={onFusion} />
    </Canvas>
  );
}
