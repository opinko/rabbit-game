import { emptyUpgrades, type Upgrades } from './config';

const KEY = 'zajko-utekajko-save-v1';

/** Checkpoint saved at the start of each level so a run can be continued. */
export interface RunCheckpoint {
  level: number;
  score: number;
  upgrades: Upgrades;
}

export interface SaveData {
  highScore: number;
  bestLevel: number;
  totalCarrots: number;
  gamesPlayed: number;
  muted: boolean;
  music: boolean;
  run: RunCheckpoint | null;
}

const defaults = (): SaveData => ({
  highScore: 0,
  bestLevel: 0,
  totalCarrots: 0,
  gamesPlayed: 0,
  muted: false,
  music: true,
  run: null,
});

let cache: SaveData | null = null;

export function load(): SaveData {
  if (cache) return cache;
  let data = defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      data = { ...data, ...parsed };
      if (data.run) data.run.upgrades = { ...emptyUpgrades(), ...data.run.upgrades };
    }
  } catch {
    // Storage unavailable or corrupted: start fresh.
  }
  cache = data;
  return data;
}

export function save(patch: Partial<SaveData> = {}): SaveData {
  const data = { ...load(), ...patch };
  cache = data;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Ignore quota / private mode errors; the game still works this session.
  }
  return data;
}

export function newRun(): RunCheckpoint {
  return { level: 1, score: 0, upgrades: emptyUpgrades() };
}
