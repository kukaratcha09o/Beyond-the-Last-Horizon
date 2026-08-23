import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gameRefs } from '../game/refs';

export function PlayerMesh() {
  const groupRef = useRef<THREE.Group>(null);

  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({ color: 0x4488cc, roughness: 0.5 }), []);
  const headMat = useMemo(() => new THREE.MeshStandardMaterial({ color: 0xddccaa, roughness: 0.6 }), []);
  const limbMat = useMemo(() => new THREE.MeshStandardMaterial({ color: 0x336699, roughness: 0.5 }), []);

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    g.position.copy(gameRefs.playerPos);
    // pos.y is feet; group origin is at feet
  });

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh position={[0, 0.7, 0]} castShadow material={bodyMat}>
        <boxGeometry args={[0.6, 0.9, 0.4]} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.35, 0]} castShadow material={headMat}>
        <boxGeometry args={[0.35, 0.35, 0.35]} />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.42, 0.7, 0]} castShadow material={limbMat}>
        <boxGeometry args={[0.18, 0.7, 0.18]} />
      </mesh>
      <mesh position={[0.42, 0.7, 0]} castShadow material={limbMat}>
        <boxGeometry args={[0.18, 0.7, 0.18]} />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.15, 0.25, 0]} castShadow material={limbMat}>
        <boxGeometry args={[0.2, 0.5, 0.2]} />
      </mesh>
      <mesh position={[0.15, 0.25, 0]} castShadow material={limbMat}>
        <boxGeometry args={[0.2, 0.5, 0.2]} />
      </mesh>
      {/* Vision glow (visible at night if skill upgraded) */}
      <pointLight
        position={[0, 1, 0]}
        color={0x88ccff}
        intensity={0}
        distance={8 + gameRefs.playerSkills.vision * 4}
        decay={2}
      />
    </group>
  );
}
