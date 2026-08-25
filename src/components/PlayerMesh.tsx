import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * PlayerMesh: Visual humanoid survivor model.
 * Pure presentation component anchored at local origin (0, 0, 0) with feet at y=0.
 * Facing forward along -Z axis. World positioning & rotation are managed by parent playerRef.
 */
export function PlayerMesh() {
  const skinMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0xe8be9a, roughness: 0.6 }),
    [],
  );
  const jacketMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x3b6e8c, roughness: 0.7 }),
    [],
  );
  const pantsMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x2b3844, roughness: 0.8 }),
    [],
  );
  const bootsMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.9 }),
    [],
  );
  const hairMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x4a2912, roughness: 0.85 }),
    [],
  );
  const backpackMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x6b4c2b, roughness: 0.8 }),
    [],
  );
  const eyeMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x1a2634, roughness: 0.3 }),
    [],
  );
  const beltMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x1f1812, roughness: 0.7 }),
    [],
  );

  return (
    <group>
      {/* Head */}
      <mesh position={[0, 1.25, 0]} castShadow material={skinMat}>
        <boxGeometry args={[0.32, 0.32, 0.3]} />
      </mesh>

      {/* Hair Cap */}
      <mesh position={[0, 1.34, 0.02]} castShadow material={hairMat}>
        <boxGeometry args={[0.35, 0.18, 0.33]} />
      </mesh>

      {/* Hair Ponytail (Back +Z) */}
      <mesh position={[0, 1.26, 0.2]} rotation={[0.2, 0, 0]} castShadow material={hairMat}>
        <boxGeometry args={[0.12, 0.28, 0.12]} />
      </mesh>

      {/* Eyes (Front -Z) */}
      <mesh position={[-0.08, 1.26, -0.155]} material={eyeMat}>
        <boxGeometry args={[0.05, 0.05, 0.02]} />
      </mesh>
      <mesh position={[0.08, 1.26, -0.155]} material={eyeMat}>
        <boxGeometry args={[0.05, 0.05, 0.02]} />
      </mesh>

      {/* Torso / Jacket */}
      <mesh position={[0, 0.82, 0]} castShadow receiveShadow material={jacketMat}>
        <boxGeometry args={[0.46, 0.52, 0.28]} />
      </mesh>

      {/* Belt / Waist */}
      <mesh position={[0, 0.57, 0]} castShadow material={beltMat}>
        <boxGeometry args={[0.48, 0.08, 0.3]} />
      </mesh>

      {/* Backpack (Back +Z) */}
      <mesh position={[0, 0.84, 0.18]} castShadow material={backpackMat}>
        <boxGeometry args={[0.34, 0.36, 0.16]} />
      </mesh>

      {/* Arms & Hands */}
      {/* Left Arm */}
      <mesh position={[-0.31, 0.8, 0]} castShadow material={jacketMat}>
        <boxGeometry args={[0.14, 0.42, 0.14]} />
      </mesh>
      <mesh position={[-0.31, 0.55, 0]} castShadow material={skinMat}>
        <boxGeometry args={[0.12, 0.12, 0.12]} />
      </mesh>

      {/* Right Arm */}
      <mesh position={[0.31, 0.8, 0]} castShadow material={jacketMat}>
        <boxGeometry args={[0.14, 0.42, 0.14]} />
      </mesh>
      <mesh position={[0.31, 0.55, 0]} castShadow material={skinMat}>
        <boxGeometry args={[0.12, 0.12, 0.12]} />
      </mesh>

      {/* Legs */}
      {/* Left Leg */}
      <mesh position={[-0.13, 0.32, 0]} castShadow material={pantsMat}>
        <boxGeometry args={[0.16, 0.44, 0.16]} />
      </mesh>
      {/* Right Leg */}
      <mesh position={[0.13, 0.32, 0]} castShadow material={pantsMat}>
        <boxGeometry args={[0.16, 0.44, 0.16]} />
      </mesh>

      {/* Boots (slightly forward -Z) */}
      <mesh position={[-0.13, 0.07, -0.02]} castShadow material={bootsMat}>
        <boxGeometry args={[0.18, 0.14, 0.22]} />
      </mesh>
      <mesh position={[0.13, 0.07, -0.02]} castShadow material={bootsMat}>
        <boxGeometry args={[0.18, 0.14, 0.22]} />
      </mesh>
    </group>
  );
}
