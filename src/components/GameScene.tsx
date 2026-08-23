import { useRef, useEffect, useReducer } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { gameRefs } from '../game/refs';
import { useGame } from '../game/store';
import {
  buildWorld, disposeWorld, updateGame, playerAttack, playerInteract, playerSleep,
  type GameWorld,
} from '../game/engine';
import { KEYS } from '../game/constants';
import { PlayerMesh } from './PlayerMesh';

export function GameScene() {
  const { camera } = useThree();
  const level = useGame((s) => s.level);
  const phase = useGame((s) => s.phase);
  const setLevelData = useGame((s) => s.setLevelData);
  const skillMenuOpen = useGame((s) => s.skillMenuOpen);

  const parentRef = useRef<THREE.Group>(null);
  const playerRef = useRef<THREE.Group>(null);
  const worldRef = useRef<GameWorld | null>(null);
  const elapsedRef = useRef(0);
  const visionLightRef = useRef<THREE.PointLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const [, forceTick] = useReducer((n: number) => n + 1, 0);

  // Build world when level changes
  useEffect(() => {
    if (phase !== 'playing' && phase !== 'dead') return;
    if (!parentRef.current) return;

    if (worldRef.current) {
      disposeWorld(worldRef.current, parentRef.current);
      worldRef.current = null;
    }

    const world = buildWorld(level, parentRef.current);
    worldRef.current = world;
    setLevelData(world.data);

    gameRefs.playerPos.copy(world.spawnPoint);
    gameRefs.playerVel.set(0, 0, 0);
    gameRefs.currentLevel = level;
    gameRefs.currentBiome = ['Green Zone', 'Desert', 'Mountains', 'Ocean'][level - 1] ?? 'Green Zone';

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, phase]);

  // Main frame loop
  useFrame((_, dt) => {
    const world = worldRef.current;
    if (!world || !playerRef.current) return;
    const clampedDt = Math.min(dt, 0.05);
    elapsedRef.current += clampedDt;

    updateGame(world, camera as THREE.PerspectiveCamera, playerRef.current, clampedDt, elapsedRef.current);

    // Day/night lighting
    const cycleTime = elapsedRef.current % 600;
    const isNight = cycleTime >= 300;
    const nightTransition = isNight
      ? Math.min(1, (cycleTime - 300) / 30)
      : Math.max(0, 1 - cycleTime / 30);

    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(0.6, 0.08, nightTransition);
    }
    if (sunRef.current) {
      sunRef.current.intensity = THREE.MathUtils.lerp(1.2, 0.05, nightTransition);
    }
    if (hemiRef.current) {
      hemiRef.current.intensity = THREE.MathUtils.lerp(0.4, 0.1, nightTransition);
    }

    if (visionLightRef.current) {
      const visionLevel = gameRefs.playerSkills.vision;
      if (isNight && visionLevel > 0) {
        visionLightRef.current.intensity = 2 + visionLevel * 1.5;
        visionLightRef.current.distance = 6 + visionLevel * 4;
      } else {
        visionLightRef.current.intensity = 0;
      }
    }

    // Sync HUD ~10fps
    if (Math.floor(elapsedRef.current * 10) !== Math.floor((elapsedRef.current - clampedDt) * 10)) {
      useGame.getState().syncHUD();
    }

    // Force label re-render ~5fps
    if (Math.floor(elapsedRef.current * 5) !== Math.floor((elapsedRef.current - clampedDt) * 5)) {
      forceTick();
    }
  });

  // Keyboard
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      KEYS.add(key);
      if (e.key === ' ') { KEYS.add(' '); e.preventDefault(); }

      if (gameRefs.paused && key !== 'k' && key !== 'tab') return;

      if (key === 'k' || key === 'tab') {
        e.preventDefault();
        const s = useGame.getState();
        if (s.phase === 'playing') {
          s.setSkillMenu(!s.skillMenuOpen);
        }
      }
      if (key === 'f') {
        if (worldRef.current) playerInteract(worldRef.current);
      }
      if (key === 'r') {
        playerSleep();
      }
      if (key === 'e') {
        if (worldRef.current) playerAttack(worldRef.current, elapsedRef.current);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      KEYS.delete(e.key.toLowerCase());
      if (e.key === ' ') KEYS.delete(' ');
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Mouse + pointer lock
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (gameRefs.paused) return;
      if (e.button === 0) {
        if (worldRef.current) playerAttack(worldRef.current, elapsedRef.current);
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!gameRefs.pointerLocked) return;
      const sens = 0.0025;
      gameRefs.cameraYaw -= e.movementX * sens;
      gameRefs.cameraPitch -= e.movementY * sens;
      gameRefs.cameraPitch = Math.max(-0.8, Math.min(0.6, gameRefs.cameraPitch));
    };

    const onPointerLockChange = () => {
      gameRefs.pointerLocked = document.pointerLockElement !== null;
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('pointerlockchange', onPointerLockChange);

    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
    };
  }, []);

  // Canvas click to lock pointer
  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const onClick = () => {
      if (gameRefs.paused) return;
      if (!gameRefs.pointerLocked) {
        canvas.requestPointerLock?.();
      }
    };
    canvas.addEventListener('click', onClick);
    return () => canvas.removeEventListener('click', onClick);
  }, [phase, level]);

  // Re-lock when menu closes
  useEffect(() => {
    if (!skillMenuOpen && phase === 'playing') {
      const canvas = document.querySelector('canvas');
      const t = setTimeout(() => canvas?.requestPointerLock?.(), 100);
      return () => clearTimeout(t);
    }
  }, [skillMenuOpen, phase]);

  const world = worldRef.current;

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.6} />
      <hemisphereLight ref={hemiRef} intensity={0.4} groundColor="#333333" color="#aabbcc" />
      <directionalLight
        ref={sunRef}
        position={[20, 30, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-camera-near={0.5}
        shadow-camera-far={100}
      />

      <group ref={parentRef} />

      <group ref={playerRef}>
        <PlayerMesh />
        <pointLight
          ref={visionLightRef}
          position={[0, 1, 0]}
          color={0x88ccff}
          intensity={0}
          distance={10}
          decay={2}
        />
      </group>

      {/* Enemy labels */}
      {world && (
        <>
          {world.enemies.filter((e) => e.alive).map((e) => (
            <Html
              key={`e${e.id}`}
              position={[e.mesh.position.x, e.mesh.position.y + 1.8, e.mesh.position.z]}
              center
              distanceFactor={10}
              occlude={false}
            >
              <div className="pointer-events-none whitespace-nowrap rounded bg-black/75 px-2 py-0.5 text-xs font-bold text-red-400 shadow-lg">
                {cap(e.kind)} Lvl {e.level}
              </div>
            </Html>
          ))}
          {world.chickens.filter((c) => c.alive).map((c) => (
            <Html
              key={`ch${c.id}`}
              position={[c.mesh.position.x, c.mesh.position.y + 0.7, c.mesh.position.z]}
              center
              distanceFactor={12}
            >
              <div className="pointer-events-none whitespace-nowrap rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-yellow-200">
                Chicken
              </div>
            </Html>
          ))}
        </>
      )}
    </>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
