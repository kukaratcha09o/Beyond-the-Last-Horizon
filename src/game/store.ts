import { create } from 'zustand';
import { gameRefs, resetPlayerStats } from './refs';
import { MAX_LEVEL } from './constants';
import type { GamePhase, LevelData, Skills } from './types';

interface GameState {
  phase: GamePhase;
  level: number;
  levelData: LevelData | null;
  // UI-facing mirrors of refs (updated by HUD poll)
  hud: {
    health: number;
    hunger: number;
    exhaustion: number;
    xp: number;
    xpMax: number;
    pLevel: number;
    skillPoints: number;
    skills: Skills;
    biome: string;
    isNight: boolean;
    nearby: string | null;
    earthquake: boolean;
  };
  skillMenuOpen: boolean;
  deathCause: string;
  // actions
  startGame: () => void;
  setLevelData: (d: LevelData) => void;
  advanceLevel: () => void;
  die: (cause: string) => void;
  respawn: () => void;
  setSkillMenu: (open: boolean) => void;
  upgradeSkill: (k: keyof Skills) => void;
  syncHUD: () => void;
  setDeathCause: (c: string) => void;
}

export const useGame = create<GameState>((set, get) => ({
  phase: 'start',
  level: 1,
  levelData: null,
  hud: {
    health: 100, hunger: 100, exhaustion: 100, xp: 0, xpMax: 100,
    pLevel: 1, skillPoints: 0,
    skills: { vision: 0, hearing: 0, speed: 0, jump: 0 },
    biome: 'Green Zone', isNight: false, nearby: null, earthquake: false,
  },
  skillMenuOpen: false,
  deathCause: '',

  startGame: () => {
    resetPlayerStats();
    gameRefs.currentLevel = 1;
    gameRefs.paused = false;
    set({ phase: 'playing', level: 1, skillMenuOpen: false, deathCause: '' });
  },

  setLevelData: (d) => set({ levelData: d }),

  advanceLevel: () => {
    const next = get().level + 1;
    if (next > MAX_LEVEL) {
      set({ phase: 'victory' });
      gameRefs.paused = true;
      return;
    }
    gameRefs.currentLevel = next;
    gameRefs.playerHealth = Math.min(gameRefs.playerHealth + 30, 100);
    set({ level: next });
  },

  die: (cause) => {
    if (gameRefs.paused) return;
    gameRefs.paused = true;
    set({ phase: 'dead', deathCause: cause, skillMenuOpen: false });
  },

  respawn: () => {
    gameRefs.playerHealth = 100;
    gameRefs.playerHunger = 100;
    gameRefs.playerExhaustion = 100;
    gameRefs.playerVel.set(0, 0, 0);
    gameRefs.paused = false;
    set({ phase: 'playing', skillMenuOpen: false });
  },

  setSkillMenu: (open) => {
    gameRefs.paused = open;
    if (!open) {
      // exiting pointer lock context handled by component; re-lock on close
    }
    set({ skillMenuOpen: open });
  },

  upgradeSkill: (k) => {
    if (gameRefs.playerSkillPoints <= 0) return;
    gameRefs.playerSkillPoints -= 1;
    gameRefs.playerSkills[k] += 1;
    set({}); // trigger re-render
  },

  syncHUD: () => {
    set({
      hud: {
        health: gameRefs.playerHealth,
        hunger: gameRefs.playerHunger,
        exhaustion: gameRefs.playerExhaustion,
        xp: gameRefs.playerXP,
        xpMax: gameRefs.playerXPMax,
        pLevel: gameRefs.playerLevel,
        skillPoints: gameRefs.playerSkillPoints,
        skills: { ...gameRefs.playerSkills },
        biome: gameRefs.currentBiome,
        isNight: gameRefs.isNight,
        nearby: gameRefs.nearbyEntity?.name ?? null,
        earthquake: gameRefs.earthquakeActive,
      },
    });
  },

  setDeathCause: (c) => set({ deathCause: c }),
}));
