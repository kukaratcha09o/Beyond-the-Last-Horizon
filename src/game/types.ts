export type EnemyKind = 'scavenger' | 'beast' | 'brute' | 'leviathan';

export interface EnemySpawn {
  id: number;
  kind: EnemyKind;
  level: number;
  position: [number, number, number];
  platformIndex: number;
}

export interface PlatformData {
  id: number;
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  isVegetation?: boolean;
  isNPC?: boolean;
  isWater?: boolean;
  earthquake?: boolean;
}

export interface BushData {
  id: number;
  position: [number, number, number];
  berries: number;
}

export interface ChickenData {
  id: number;
  position: [number, number, number];
  platformIndex: number;
}

export interface NPCData {
  id: number;
  position: [number, number, number];
  color: string;
}

export interface LevelData {
  level: number;
  platforms: PlatformData[];
  enemies: EnemySpawn[];
  bushes: BushData[];
  chickens: ChickenData[];
  npcs: NPCData[];
  spawnPoint: [number, number, number];
  portalPosition: [number, number, number];
  groundY: number;
}

export interface Skills {
  vision: number;
  hearing: number;
  speed: number;
  jump: number;
}

export type GamePhase = 'start' | 'playing' | 'dead' | 'victory';
