import type {
  LevelData, PlatformData, EnemySpawn, BushData, ChickenData, NPCData, EnemyKind,
} from './types';
import { BIOMES } from './constants';

// Deterministic PRNG so layouts are stable per level
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const ENEMY_KINDS: EnemyKind[] = ['scavenger', 'beast', 'brute', 'leviathan'];

interface LevelConfig {
  groundColor: string;
  platformColors: string[];
  vegetationColor: string;
  enemyLevelMin: number;
  enemyLevelMax: number;
  enemyCount: number;
  bushCount: number;
  chickenCount: number;
  hasNPCs: boolean;
  hasEarthquake: boolean;
  layout: 'city' | 'desert' | 'mountain' | 'ocean';
  groundY: number;
}

const CONFIGS: LevelConfig[] = [
  {
    groundColor: '#4a5a3a',
    platformColors: ['#555555', '#666666', '#777777', '#5a5a5a'],
    vegetationColor: '#4a7a3a',
    enemyLevelMin: 1, enemyLevelMax: 2, enemyCount: 5,
    bushCount: 6, chickenCount: 4, hasNPCs: true, hasEarthquake: true,
    layout: 'city', groundY: 0,
  },
  {
    groundColor: '#d4a85a',
    platformColors: ['#e0b86a', '#c89848', '#d4a85a', '#b88838'],
    vegetationColor: '#8a6a2a',
    enemyLevelMin: 2, enemyLevelMax: 4, enemyCount: 7,
    bushCount: 4, chickenCount: 3, hasNPCs: false, hasEarthquake: false,
    layout: 'desert', groundY: 0,
  },
  {
    groundColor: '#d0d8e0',
    platformColors: ['#e0e8f0', '#c0c8d0', '#b0b8c0', '#d8e0e8'],
    vegetationColor: '#8a9a8a',
    enemyLevelMin: 4, enemyLevelMax: 6, enemyCount: 9,
    bushCount: 5, chickenCount: 2, hasNPCs: false, hasEarthquake: false,
    layout: 'mountain', groundY: 0,
  },
  {
    groundColor: '#3a7ab0',
    platformColors: ['#4a8ac0', '#3a7ab0', '#5a9ad0', '#2a6aa0'],
    vegetationColor: '#2a5a8a',
    enemyLevelMin: 6, enemyLevelMax: 9, enemyCount: 11,
    bushCount: 3, chickenCount: 2, hasNPCs: false, hasEarthquake: false,
    layout: 'ocean', groundY: -0.5,
  },
];

function generatePlatforms(cfg: LevelConfig, rand: () => number): PlatformData[] {
  const platforms: PlatformData[] = [];
  let id = 0;

  // Large ground platform
  platforms.push({
    id: id++, position: [0, cfg.groundY, 0], size: [80, 1, 80],
    color: cfg.groundColor, isWater: cfg.layout === 'ocean',
  });

  if (cfg.layout === 'city') {
    // Collapsed structures - towers and blocks at varying heights
    const structures = 22;
    for (let i = 0; i < structures; i++) {
      const x = (rand() - 0.5) * 60;
      const z = (rand() - 0.5) * 60;
      // Keep starting area clear
      if (Math.abs(x) < 8 && Math.abs(z) < 8) continue;
      const h = 2 + rand() * 8;
      const w = 2 + rand() * 3;
      const d = 2 + rand() * 3;
      const y = cfg.groundY + h / 2 + 0.5;
      platforms.push({
        id: id++, position: [x, y, z], size: [w, h, d],
        color: cfg.platformColors[Math.floor(rand() * cfg.platformColors.length)],
      });
      // Top platform (walkable surface)
      platforms.push({
        id: id++, position: [x, y + h / 2 + 0.25, z], size: [w, 0.5, d],
        color: cfg.platformColors[Math.floor(rand() * cfg.platformColors.length)],
      });
      // Vegetation on some
      if (rand() < 0.35) {
        platforms.push({
          id: id++, position: [x + (rand() - 0.5) * w, y + h / 2 + 0.8, z + (rand() - 0.5) * d],
          size: [0.8, 1.2, 0.8], color: cfg.vegetationColor, isVegetation: true,
        });
      }
    }
    // Stepping platforms
    for (let i = 0; i < 8; i++) {
      const x = (rand() - 0.5) * 50;
      const z = (rand() - 0.5) * 50;
      const y = 1.5 + rand() * 3;
      platforms.push({
        id: id++, position: [x, y, z], size: [3, 0.5, 3],
        color: cfg.platformColors[0],
        earthquake: rand() < 0.4,
      });
    }
  } else if (cfg.layout === 'desert') {
    // Dunes - wide low platforms and mesas
    for (let i = 0; i < 16; i++) {
      const x = (rand() - 0.5) * 70;
      const z = (rand() - 0.5) * 70;
      if (Math.abs(x) < 6 && Math.abs(z) < 6) continue;
      const h = 1 + rand() * 4;
      const w = 3 + rand() * 5;
      const d = 3 + rand() * 5;
      platforms.push({
        id: id++, position: [x, cfg.groundY + h / 2 + 0.5, z], size: [w, h, d],
        color: cfg.platformColors[Math.floor(rand() * cfg.platformColors.length)],
      });
      platforms.push({
        id: id++, position: [x, cfg.groundY + h + 0.75, z], size: [w, 0.5, d],
        color: cfg.platformColors[Math.floor(rand() * cfg.platformColors.length)],
      });
    }
    // Stepping stones
    for (let i = 0; i < 10; i++) {
      const x = (rand() - 0.5) * 60;
      const z = (rand() - 0.5) * 60;
      const y = 1 + rand() * 2.5;
      platforms.push({
        id: id++, position: [x, y, z], size: [2.5, 0.5, 2.5],
        color: cfg.platformColors[1],
      });
    }
  } else if (cfg.layout === 'mountain') {
    // Steep peaks - tall narrow blocks
    for (let i = 0; i < 20; i++) {
      const x = (rand() - 0.5) * 65;
      const z = (rand() - 0.5) * 65;
      if (Math.abs(x) < 6 && Math.abs(z) < 6) continue;
      const h = 4 + rand() * 10;
      const w = 2.5 + rand() * 3;
      const d = 2.5 + rand() * 3;
      platforms.push({
        id: id++, position: [x, cfg.groundY + h / 2 + 0.5, z], size: [w, h, d],
        color: cfg.platformColors[Math.floor(rand() * cfg.platformColors.length)],
      });
      platforms.push({
        id: id++, position: [x, cfg.groundY + h + 0.75, z], size: [w, 0.5, d],
        color: cfg.platformColors[Math.floor(rand() * cfg.platformColors.length)],
      });
    }
    // Ledges
    for (let i = 0; i < 12; i++) {
      const x = (rand() - 0.5) * 55;
      const z = (rand() - 0.5) * 55;
      const y = 2 + rand() * 5;
      platforms.push({
        id: id++, position: [x, y, z], size: [3, 0.5, 3],
        color: cfg.platformColors[2],
      });
    }
  } else {
    // Ocean - floating platforms on water
    for (let i = 0; i < 18; i++) {
      const x = (rand() - 0.5) * 70;
      const z = (rand() - 0.5) * 70;
      if (Math.abs(x) < 6 && Math.abs(z) < 6) continue;
      const w = 3 + rand() * 4;
      const d = 3 + rand() * 4;
      platforms.push({
        id: id++, position: [x, 0.5, z], size: [w, 1, d],
        color: cfg.platformColors[Math.floor(rand() * cfg.platformColors.length)],
      });
    }
    for (let i = 0; i < 10; i++) {
      const x = (rand() - 0.5) * 60;
      const z = (rand() - 0.5) * 60;
      platforms.push({
        id: id++, position: [x, 1.5 + rand() * 2, z], size: [2.5, 0.5, 2.5],
        color: cfg.platformColors[1],
      });
    }
  }

  return platforms;
}

function topSurface(p: PlatformData): { x: number; y: number; z: number; w: number; d: number } {
  return {
    x: p.position[0], y: p.position[1] + p.size[1] / 2,
    z: p.position[2], w: p.size[0], d: p.size[2],
  };
}

export function generateLevel(level: number): LevelData {
  const cfg = CONFIGS[Math.min(level - 1, CONFIGS.length - 1)];
  const rand = mulberry32(level * 1337 + 42);
  const platforms = generatePlatforms(cfg, rand);

  // Walkable surfaces (for placing enemies/chickens/bushes)
  const walkable = platforms.filter(
    (p) => !p.isVegetation && !p.isNPC && p.size[1] <= 1 && !p.isWater,
  );
  const ground = walkable[0];
  const spawnPoint: [number, number, number] = [0, (ground ? ground.position[1] + ground.size[1] / 2 : 1) + 2, 0];

  // Portal at far corner
  const portalX = 32 + rand() * 6;
  const portalZ = 32 + rand() * 6;
  const portalPlatform = walkable.find(
    (p) => Math.abs(p.position[0] - portalX) < 10 && Math.abs(p.position[2] - portalZ) < 10,
  ) ?? ground;
  const portalY = portalPlatform ? portalPlatform.position[1] + portalPlatform.size[1] / 2 : 1;
  const portalPosition: [number, number, number] = [portalX, portalY, portalZ];

  // Enemies
  const enemies: EnemySpawn[] = [];
  let eid = 0;
  const enemyPlatforms = walkable.slice(1); // exclude ground for some variety
  for (let i = 0; i < cfg.enemyCount; i++) {
    const pool = enemyPlatforms.length > 0 && rand() < 0.5 ? enemyPlatforms : walkable;
    const p = pool[Math.floor(rand() * pool.length)] ?? ground;
    if (!p) continue;
    const s = topSurface(p);
    const ex = s.x + (rand() - 0.5) * (s.w - 1);
    const ez = s.z + (rand() - 0.5) * (s.d - 1);
    const lvl = cfg.enemyLevelMin + Math.floor(rand() * (cfg.enemyLevelMax - cfg.enemyLevelMin + 1));
    enemies.push({
      id: eid++, kind: ENEMY_KINDS[Math.min(level - 1, 3)],
      level: lvl, position: [ex, s.y + 0.8, ez], platformIndex: p.id,
    });
  }

  // Berry bushes
  const bushes: BushData[] = [];
  let bid = 0;
  for (let i = 0; i < cfg.bushCount; i++) {
    const p = walkable[Math.floor(rand() * walkable.length)] ?? ground;
    if (!p) continue;
    const s = topSurface(p);
    bushes.push({
      id: bid++,
      position: [s.x + (rand() - 0.5) * (s.w - 1), s.y, s.z + (rand() - 0.5) * (s.d - 1)],
      berries: 3,
    });
  }

  // Chickens
  const chickens: ChickenData[] = [];
  let cid = 0;
  for (let i = 0; i < cfg.chickenCount; i++) {
    const p = walkable[Math.floor(rand() * walkable.length)] ?? ground;
    if (!p) continue;
    const s = topSurface(p);
    chickens.push({
      id: cid++,
      position: [s.x + (rand() - 0.5) * (s.w - 1), s.y, s.z + (rand() - 0.5) * (s.d - 1)],
      platformIndex: p.id,
    });
  }

  // NPCs (Level 1 only)
  const npcs: NPCData[] = [];
  if (cfg.hasNPCs) {
    const npcColors = ['#3a8a5a', '#2a6a4a', '#4a9a6a', '#3a7a5a', '#2a8a6a'];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const r = 4;
      npcs.push({
        id: i,
        position: [Math.cos(angle) * r, ground.position[1] + ground.size[1] / 2, Math.sin(angle) * r - 2],
        color: npcColors[i % npcColors.length],
      });
    }
  }

  return {
    level, platforms, enemies, bushes, chickens, npcs,
    spawnPoint, portalPosition, groundY: cfg.groundY,
  };
}

export function biomeName(level: number): string {
  return BIOMES[Math.min(level - 1, BIOMES.length - 1)].name;
}
