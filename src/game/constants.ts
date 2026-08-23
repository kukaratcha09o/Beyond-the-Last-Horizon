import * as THREE from 'three';

// ---------- Tunable gameplay constants ----------
export const PLAYER = {
  radius: 0.35,
  height: 1.4,
  baseSpeed: 5,
  baseJump: 7,
  gravity: 22,
  maxHealth: 100,
  maxHunger: 100,
  maxExhaustion: 100,
  attackRange: 2.2,
  attackCooldown: 0.45,
  invulnTime: 0.6,
};

export const SKILL = {
  visionCost: 1,
  hearingCost: 1,
  speedCost: 1,
  jumpCost: 1,
  speedPerLevel: 1.1,
  jumpPerLevel: 1.25,
};

export const ENEMY = {
  baseHealth: 40,
  baseDamage: 8,
  baseSpeed: 2.2,
  attackRange: 1.6,
  attackCooldown: 1.0,
  detectRange: 14,
};

export const CHICKEN = {
  speed: 2.5,
  fleeRange: 6,
  health: 12,
};

export const DAY_LENGTH = 300; // seconds (5 min)
export const NIGHT_LENGTH = 300; // seconds (5 min)
export const CYCLE_LENGTH = DAY_LENGTH + NIGHT_LENGTH;

export const HUNGER_DECAY = 100 / 180; // ~100 over 3 min
export const EXHAUSTION_DECAY = 100 / 240; // ~100 over 4 min
export const STARVE_DAMAGE = 4; // per tick
export const SLEEP_FADE_MS = 900;

export const BIOMES = [
  { id: 1, name: 'Green Zone', subtitle: 'Ruined City', sky: '#3a4a2a', ground: '#4a5a3a', fog: '#6a7a5a' },
  { id: 2, name: 'Desert', subtitle: 'Wasteland', sky: '#c9a86a', ground: '#d4a85a', fog: '#e0c890' },
  { id: 3, name: 'Mountains', subtitle: 'Frozen Peaks', sky: '#a0b8c8', ground: '#d0d8e0', fog: '#e8f0f8' },
  { id: 4, name: 'Ocean', subtitle: 'Drowned World', sky: '#2a5a8a', ground: '#3a7ab0', fog: '#5a9ac8' },
] as const;

export const MAX_LEVEL = 4;

// ---------- Helpers ----------
export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.4, level - 1));
}

export const KEYS = new Set<string>();
export const KEY_DOWN = (k: string) => KEYS.has(k.toLowerCase());

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export const ZERO = new THREE.Vector3();
export const UP = new THREE.Vector3(0, 1, 0);
