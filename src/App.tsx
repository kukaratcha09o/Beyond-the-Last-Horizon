import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { GameScene } from './components/GameScene';
import { HUD } from './components/HUD';
import { StartScreen, DeathScreen, VictoryScreen } from './components/Screens';
import { useGame } from './game/store';
import { BIOMES } from './game/constants';

function App() {
  const level = useGame((s) => s.level);
  const biome = BIOMES[Math.min(level - 1, BIOMES.length - 1)];

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <Canvas
        shadows
        camera={{ fov: 70, near: 0.1, far: 200, position: [0, 8, 8] }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        onCreated={({ scene, gl }) => {
          scene.background = new THREE.Color(biome.sky);
          scene.fog = new THREE.Fog(biome.fog, 30, 90);
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <GameScene />
      </Canvas>

      <HUD />
      <StartScreen />
      <DeathScreen />
      <VictoryScreen />
    </div>
  );
}

export default App;
