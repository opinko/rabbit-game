// Game-wide constants and balance values.

export const GAME_W = 1280;
export const GAME_H = 720;

export const FONT = '"Fredoka", "Trebuchet MS", "Segoe UI", sans-serif';

// Field lanes (the rabbit can only move up/down between them).
export const LANES = 5;
export const LANE_TOP = 340;
export const LANE_STEP = 78;
export const laneY = (lane: number): number => LANE_TOP + lane * LANE_STEP;
export const FIELD_TOP = 280;

// Horizontal screen position of the rabbit; the world scrolls past it.
export const RABBIT_X = 620;

// px of world distance per displayed meter.
export const PX_PER_METER = 40;

export const BALANCE = {
  rabbitBaseSpeed: 300,
  /** Speed gained per level of the "speed" upgrade. */
  speedPerLevel: 12,
  /** Gap (px) between the combine's cutter and the rabbit at level start. */
  startGap: 420,
  /** Beyond this gap the combine catches up quickly (it never gets lost). */
  softMaxGap: 560,
  stunTime: 0.6,
  stunSpeedMul: 0.55,
  invulnTime: 1.4,
  turboMul: 1.65,
  turboBaseTime: 3,
  turboPerLevel: 0.7,
  magnetBaseTime: 6,
  magnetPerLevel: 1.5,
  magnetBaseRadius: 230,
  magnetRadiusPerLevel: 35,
  brokenTime: 2.6,
  brokenSpeedMul: 0.35,
  comboStep: 8,
  comboBaseMax: 3,
};

/** Combine speed at the start of a level (level 1 = same as the base rabbit). */
export function combineStartSpeed(level: number): number {
  const l = level - 1;
  return BALANCE.rabbitBaseSpeed + 14 * l + 1.2 * l * l;
}

/**
 * Combine speed `t` seconds into a level: it keeps accelerating for a while
 * and every level starts faster, so the rabbit needs speed upgrades to survive.
 * (Tuned with a Monte Carlo sim: a careful kid reaches level ~9, a great one ~17.)
 */
export function combineSpeedAt(level: number, t: number): number {
  return combineStartSpeed(level) + Math.min(1.0 * t, 8 + 3 * (level - 1));
}

/** Speed sneakers placed in every level (at fixed fractions of its length). */
export const SNEAKERS_PER_LEVEL = 3;

/** Length of a level in world px. */
export function levelLength(level: number): number {
  return Math.round((240 + 40 * Math.min(level, 12)) * PX_PER_METER);
}

export type UpgradeId = 'speed' | 'magnet' | 'shield' | 'turbo' | 'luck' | 'combo';

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  desc: string;
  icon: string;
  max: number;
}

export const UPGRADES: UpgradeDef[] = [
  { id: 'speed', name: 'Rýchle labky', desc: 'Zajko beží rýchlejšie', icon: 'icon_speed', max: 99 },
  { id: 'magnet', name: 'Silný magnet', desc: 'Magnet ťahá mrkvy dlhšie a z väčšej diaľky', icon: 'pu_magnet', max: 5 },
  { id: 'shield', name: 'Bublina na štart', desc: 'Každý level začneš s ochrannou bublinou', icon: 'pu_shield', max: 3 },
  { id: 'turbo', name: 'Dlhšie turbo', desc: 'Turbo blesk vydrží dlhšie', icon: 'pu_turbo', max: 5 },
  { id: 'luck', name: 'Štvorlístok', desc: 'Viac zlatých mrkiev a vylepšení na poli', icon: 'icon_luck', max: 5 },
  { id: 'combo', name: 'Kombo majster', desc: 'Vyšší násobič bodov za mrkvy', icon: 'icon_combo', max: 5 },
];

export type Upgrades = Record<UpgradeId, number>;

export const emptyUpgrades = (): Upgrades => ({
  speed: 0,
  magnet: 0,
  shield: 0,
  turbo: 0,
  luck: 0,
  combo: 0,
});

export const rabbitSpeed = (u: Upgrades): number =>
  BALANCE.rabbitBaseSpeed + BALANCE.speedPerLevel * u.speed;
