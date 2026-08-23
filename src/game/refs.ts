import * as THREE from 'three';

/**
 * Mutable refs shared between the imperative game systems and React UI.
 * Updated every frame by the game loop; read by HUD overlays.
 */
export const gameRefs = {
  playerPos: new THREE.Vector3(0, 5, 0),
  playerVel: new THREE.Vector3(),
  playerHealth: 100,
  playerHunger: 100,
  playerExhaustion: 100,
  playerLevel: 1,
  playerXP: 0,
  playerXPMax: 100,
  playerSkillPoints: 0,
  playerSkills: { vision: 0, hearing: 0, speed: 0, jump: 0 },
  currentLevel: 1,
  currentBiome: 'Green Zone',
  isNight: false,
  dayProgress: 0, // 0..1 through full cycle
  nearbyEntity: null as null | { kind: 'enemy' | 'chicken' | 'bush'; name: string; distance: number },
  hitFlash: 0, // timestamp of last damage taken
  attackSwing: 0, // timestamp of last attack
  sleepFade: 0, // 0..1 active fade
  earthquakeActive: false,
  cameraYaw: 0,
  cameraPitch: 0,
  pointerLocked: false,
  paused: false,
};

export function resetPlayerStats() {
  gameRefs.playerHealth = 100;
  gameRefs.playerHunger = 100;
  gameRefs.playerExhaustion = 100;
  gameRefs.playerLevel = 1;
  gameRefs.playerXP = 0;
  gameRefs.playerXPMax = 100;
  gameRefs.playerSkillPoints = 0;
  gameRefs.playerSkills = { vision: 0, hearing: 0, speed: 0, jump: 0 };
}
