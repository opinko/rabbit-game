import Phaser from 'phaser';
import {
  BALANCE,
  GAME_H,
  GAME_W,
  LANES,
  PX_PER_METER,
  RABBIT_X,
  SNEAKERS_PER_LEVEL,
  combineSpeedAt,
  combineStartSpeed,
  laneY,
  levelLength,
  rabbitSpeed,
  type Upgrades,
} from '../config';
import { sfx } from '../audio';
import { Scenery } from '../scenery';
import { load, save, type RunCheckpoint } from '../storage';
import { makeRoundButton, textStyle } from '../ui';

type ItemKind =
  | 'carrot'
  | 'gold'
  | 'rock'
  | 'mud'
  | 'hay'
  | 'hedgehog'
  | 'turbo'
  | 'magnet'
  | 'shield'
  | 'wrench'
  | 'sneaker';

const OBSTACLES: ItemKind[] = ['rock', 'mud', 'hay', 'hedgehog'];
const POWERUPS: ItemKind[] = ['turbo', 'magnet', 'shield', 'wrench'];

const TEXTURE: Record<ItemKind, string> = {
  carrot: 'carrot',
  gold: 'carrot_gold',
  rock: 'rock',
  mud: 'mud',
  hay: 'hay',
  hedgehog: 'hedgehog',
  turbo: 'pu_turbo',
  magnet: 'pu_magnet',
  shield: 'pu_shield',
  wrench: 'pu_wrench',
  sneaker: 'pu_sneaker',
};

/** Half-width of each item's hit box (px). */
const HIT_W: Record<ItemKind, number> = {
  carrot: 34,
  gold: 34,
  rock: 34,
  mud: 40,
  hay: 32,
  hedgehog: 30,
  turbo: 36,
  magnet: 36,
  shield: 36,
  wrench: 36,
  sneaker: 36,
};

interface Item {
  kind: ItemKind;
  wx: number; // world x
  y: number;
  baseY: number;
  sprite: Phaser.GameObjects.Image;
  shadow?: Phaser.GameObjects.Image;
  vy?: number; // hedgehog vertical speed
  magnet?: boolean;
  dead?: boolean;
  t: number;
}

type State = 'intro' | 'run' | 'finish' | 'caught';

export interface GameInit {
  checkpoint: RunCheckpoint;
}

export class GameScene extends Phaser.Scene {
  private scenery!: Scenery;
  private state: State = 'intro';
  private level = 1;
  private score = 0;
  private levelStartScore = 0;
  private upgrades!: Upgrades;
  private checkpoint!: RunCheckpoint;

  // Rabbit
  private rabbit!: Phaser.GameObjects.Sprite;
  private rabbitShadow!: Phaser.GameObjects.Image;
  private bubble!: Phaser.GameObjects.Image;
  private lane = 2;
  private rabbitY = laneY(2);
  private moveTween?: Phaser.Tweens.Tween;
  private stun = 0;
  private invuln = 0;
  private turbo = 0;
  private magnet = 0;
  private shields = 0;
  private scared = false;
  private sneakersThisLevel = 0;

  // Combine
  private combine!: Phaser.GameObjects.Container;
  private reel!: Phaser.GameObjects.TileSprite;
  private wheels: Phaser.GameObjects.Image[] = [];
  private combineSpeed = 0;
  private broken = 0;
  private gap: number = BALANCE.startGap;
  private elapsed = 0;

  // World
  private distance = 0;
  private length = 0;
  private items: Item[] = [];
  private spawnCursor = 0;
  private nextSneakerAt = 0;
  private sneakerIdx = 0;
  private nextPowerAt = 0;
  private barn!: Phaser.GameObjects.Image;
  private flag!: Phaser.GameObjects.Image;
  private finishText!: Phaser.GameObjects.Text;
  private carrotsThisLevel = 0;
  private combo = 0;
  private hits = 0;

  // FX
  private dust!: Phaser.GameObjects.Particles.ParticleEmitter;
  private sparks!: Phaser.GameObjects.Particles.ParticleEmitter;
  private strawFx!: Phaser.GameObjects.Particles.ParticleEmitter;
  private smokeFx!: Phaser.GameObjects.Particles.ParticleEmitter;
  private speedLines!: Phaser.GameObjects.Particles.ParticleEmitter;
  private vignette!: Phaser.GameObjects.Image;
  private warnCooldown = 0;

  // HUD
  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private progressRabbit!: Phaser.GameObjects.Image;
  private progressCombine!: Phaser.GameObjects.Rectangle;
  private dangerText!: Phaser.GameObjects.Text;
  private powerHud!: Phaser.GameObjects.Container;
  private speedText!: Phaser.GameObjects.Text;

  // Input
  private keys!: {
    up: Phaser.Input.Keyboard.Key[];
    down: Phaser.Input.Keyboard.Key[];
  };
  private holdDir = 0;
  private holdTimer = 0;
  private swipeStart: { x: number; y: number; moved: boolean } | null = null;

  constructor() {
    super('Game');
  }

  init(data: GameInit): void {
    this.checkpoint = data.checkpoint;
    this.level = data.checkpoint.level;
    this.score = data.checkpoint.score;
    this.levelStartScore = data.checkpoint.score;
    this.upgrades = { ...data.checkpoint.upgrades };
    this.state = 'intro';
    this.lane = 2;
    this.rabbitY = laneY(2);
    this.stun = 0;
    this.invuln = 0;
    this.turbo = 0;
    this.magnet = 0;
    this.shields = this.upgrades.shield;
    this.broken = 0;
    this.gap = BALANCE.startGap;
    this.elapsed = 0;
    this.distance = 0;
    this.length = levelLength(this.level);
    this.items = [];
    this.wheels = [];
    this.spawnCursor = 900;
    this.sneakerIdx = 0;
    this.nextSneakerAt = this.length * 0.22;
    this.nextPowerAt = 3200;
    this.carrotsThisLevel = 0;
    this.sneakersThisLevel = 0;
    this.combo = 0;
    this.hits = 0;
    this.scared = false;
    this.holdDir = 0;
    this.swipeStart = null;
    this.combineSpeed = combineStartSpeed(this.level);
  }

  create(): void {
    this.scenery = new Scenery(this);
    this.createFx();
    this.createBarn();
    this.createRabbit();
    this.createCombine();
    this.createHud();
    this.createInput();

    // Save checkpoint so the run can be continued after closing the browser.
    save({ run: this.checkpoint });

    sfx.startEngine();
    sfx.startMusic(1 + Math.min(this.level - 1, 8) * 0.03);

    const onHidden = () => this.pauseGame();
    this.game.events.on(Phaser.Core.Events.HIDDEN, onHidden);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(Phaser.Core.Events.HIDDEN, onHidden);
      sfx.stopEngine();
      sfx.stopMusic();
    });

    this.showIntro();
  }

  // ------------------------------------------------------------- setup ---

  private createFx(): void {
    this.dust = this.add.particles(0, 0, 'soft', {
      lifespan: 500,
      speedX: { min: -220, max: -120 },
      speedY: { min: -40, max: 0 },
      scale: { start: 0.35, end: 0.05 },
      alpha: { start: 0.55, end: 0 },
      tint: 0xd9c49a,
      frequency: 60,
      emitting: false,
    });
    this.sparks = this.add.particles(0, 0, 'spark', {
      lifespan: 600,
      speed: { min: 120, max: 320 },
      scale: { start: 0.8, end: 0 },
      rotate: { min: 0, max: 360 },
      tint: [0xffe14d, 0xffffff, 0xffa53a],
      emitting: false,
    }).setDepth(2000);
    this.strawFx = this.add.particles(0, 0, 'straw', {
      lifespan: 1200,
      speedX: { min: -260, max: -60 },
      speedY: { min: -260, max: -60 },
      gravityY: 500,
      rotate: { min: 0, max: 360 },
      scale: { min: 0.8, max: 1.4 },
      frequency: 70,
      quantity: 2,
      emitting: false,
    }).setDepth(1500);
    this.smokeFx = this.add.particles(0, 0, 'smoke', {
      lifespan: 1400,
      speedX: { min: -80, max: -30 },
      speedY: { min: -90, max: -50 },
      scale: { start: 0.35, end: 1.2 },
      alpha: { start: 0.55, end: 0 },
      tint: 0x777777,
      frequency: 110,
      emitting: false,
    }).setDepth(1490);
    this.speedLines = this.add.particles(0, 0, 'speedline', {
      x: GAME_W + 60,
      y: { min: 200, max: GAME_H - 20 },
      lifespan: 450,
      speedX: { min: -2600, max: -1800 },
      scaleX: { min: 0.6, max: 1.6 },
      alpha: { start: 0.7, end: 0 },
      frequency: 30,
      emitting: false,
    }).setDepth(1800);
    this.vignette = this.add.image(0, 0, 'vignette').setOrigin(0).setDisplaySize(GAME_W, GAME_H).setDepth(2500).setAlpha(0);
  }

  private createBarn(): void {
    this.barn = this.add.image(GAME_W + 500, laneY(0) + 10, 'barn').setOrigin(0.5, 1).setDepth(laneY(0) - 40).setVisible(false);
    this.flag = this.add.image(GAME_W + 500, laneY(LANES - 1) + 30, 'flag').setOrigin(0.1, 1).setDepth(3000).setVisible(false);
    this.finishText = this.add.text(0, 0, 'CIEĽ', textStyle(44, '#ffe14d')).setOrigin(0.5).setDepth(3001).setVisible(false);
  }

  private createRabbit(): void {
    this.rabbitShadow = this.add.image(RABBIT_X, this.rabbitY + 26, 'shadow').setScale(0.75, 0.8);
    this.rabbit = this.add.sprite(RABBIT_X, this.rabbitY, 'rabbit_0').setOrigin(0.5, 0.88).setScale(0.82);
    this.rabbit.play('run');
    this.bubble = this.add.image(RABBIT_X, this.rabbitY - 40, 'shield_bubble').setScale(0.8).setVisible(false);
    this.dust.startFollow(this.rabbit, -40, 0);
  }

  private createCombine(): void {
    const c = this.add.container(0, 0);
    const body = this.add.image(0, 0, 'combine').setOrigin(0, 0);
    const reel = this.add.tileSprite(282, 38, 86, 412, 'reel').setOrigin(0);
    const shade = this.add.image(282, 38, 'reel_shade').setOrigin(0);
    const wb = this.add.image(196, 400, 'wheel_big');
    const ws = this.add.image(70, 424, 'wheel_small');
    // Re-add teeth layer over reel: draw body twice is cheap and keeps the cutter on top.
    const teeth = this.add.image(0, 0, 'combine').setOrigin(0, 0).setCrop(370, 0, 50, 480);
    c.add([body, reel, shade, ws, wb, teeth]);
    this.reel = reel;
    this.wheels = [wb, ws];
    c.setDepth(1400);
    this.combine = c;
    this.placeCombine();
  }

  /** The combine's cutter edge sits `gap` px behind the rabbit. */
  private combineFrontX(): number {
    return RABBIT_X - 48 - this.gap;
  }

  private placeCombine(): void {
    const front = this.combineFrontX();
    this.combine.x = front - 404;
    this.combine.y = laneY(0) - 140 + Math.sin(this.elapsed * 22) * 1.5;
  }

  private createHud(): void {
    const top = 14;
    // Score
    const scoreBox = this.add.graphics().setDepth(3000);
    scoreBox.fillStyle(0xffffff, 0.85).fillRoundedRect(14, top, 250, 66, 20);
    scoreBox.lineStyle(4, 0x3b2412).strokeRoundedRect(14, top, 250, 66, 20);
    this.add.image(50, top + 33, 'carrot').setScale(0.62).setDepth(3001);
    this.scoreText = this.add.text(84, top + 33, `${this.score}`, textStyle(40, '#ff8c1a')).setOrigin(0, 0.5).setDepth(3001);
    this.comboText = this.add.text(140, top + 92, '', textStyle(28, '#ffe14d')).setOrigin(0.5).setDepth(3001);

    // Level + progress bar
    const px = 420;
    const pw = 440;
    this.add.text(GAME_W / 2, top + 4, `Level ${this.level}`, textStyle(30)).setOrigin(0.5, 0).setDepth(3001);
    const bar = this.add.graphics().setDepth(3000);
    bar.fillStyle(0xffffff, 0.85).fillRoundedRect(px - 6, top + 46, pw + 12, 22, 11);
    bar.lineStyle(4, 0x3b2412).strokeRoundedRect(px - 6, top + 46, pw + 12, 22, 11);
    this.add.image(px + pw + 26, top + 56, 'barn').setScale(0.13).setDepth(3001);
    this.progressCombine = this.add.rectangle(px, top + 57, 10, 14, 0xd93a2b).setOrigin(0, 0.5).setDepth(3001);
    this.progressRabbit = this.add.image(px, top + 52, 'rabbit_1').setScale(0.3).setDepth(3002);
    this.progressCombine.setData('x0', px);
    this.progressCombine.setData('w', pw);

    this.dangerText = this.add.text(GAME_W / 2, top + 84, '', textStyle(22, '#ffffff')).setOrigin(0.5, 0).setDepth(3001);
    this.speedText = this.add.text(20, GAME_H - 14, '', textStyle(20, '#ffffff')).setOrigin(0, 1).setDepth(3001);

    this.powerHud = this.add.container(GAME_W - 110, top + 6).setDepth(3001);

    const pauseBtn = makeRoundButton(this, GAME_W - 46, top + 34, 'II', () => this.pauseGame(), 60);
    pauseBtn.setDepth(3002);
  }

  private createInput(): void {
    const kb = this.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      up: [kb.addKey(K.UP), kb.addKey(K.W)],
      down: [kb.addKey(K.DOWN), kb.addKey(K.S)],
    };
    for (const k of this.keys.up) k.on('down', () => this.press(-1));
    for (const k of this.keys.down) k.on('down', () => this.press(1));
    kb.on('keyup', () => this.updateHoldFromKeys());
    kb.addKey(K.P).on('down', () => this.pauseGame());
    kb.addKey(K.ESC).on('down', () => this.pauseGame());

    // Touch / mouse: tap above or below the rabbit, or swipe.
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      sfx.unlock();
      this.swipeStart = { x: p.x, y: p.y, moved: false };
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      const s = this.swipeStart;
      if (!s || !p.isDown) return;
      const dy = p.y - s.y;
      if (Math.abs(dy) > 45) {
        this.press(dy < 0 ? -1 : 1);
        s.y = p.y;
        s.moved = true;
      }
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      const s = this.swipeStart;
      this.swipeStart = null;
      if (!s || s.moved) return;
      if (p.y < 100) return; // HUD area
      this.press(p.y < this.rabbitY - 20 ? -1 : 1);
    });
  }

  private updateHoldFromKeys(): void {
    const up = this.keys.up.some((k) => k.isDown);
    const down = this.keys.down.some((k) => k.isDown);
    this.holdDir = up && !down ? -1 : down && !up ? 1 : 0;
  }

  private press(dir: number): void {
    this.updateHoldFromKeys();
    this.holdTimer = 0.24;
    this.moveLane(dir);
  }

  private moveLane(dir: number): void {
    if (this.state !== 'run' && this.state !== 'intro') return;
    const target = Phaser.Math.Clamp(this.lane + dir, 0, LANES - 1);
    if (target === this.lane) return;
    this.lane = target;
    sfx.move();
    this.moveTween?.stop();
    this.moveTween = this.tweens.add({
      targets: this,
      rabbitY: laneY(target),
      duration: 130,
      ease: 'Sine.out',
    });
    this.tweens.add({ targets: this.rabbit, angle: dir * -12, duration: 70, yoyo: true });
  }

  // ------------------------------------------------------------- intro ---

  private showIntro(): void {
    const t = this.add.text(GAME_W / 2, GAME_H / 2 - 60, `Level ${this.level}`, textStyle(96, '#ffe14d')).setOrigin(0.5).setDepth(4000).setScale(0);
    const sub = this.add
      .text(GAME_W / 2, GAME_H / 2 + 30, this.level === 1 ? 'Uteč kombajnu a zbieraj mrkvičky!' : `Kombajn je rýchlejší! Dĺžka: ${Math.round(this.length / PX_PER_METER)} m`, textStyle(36))
      .setOrigin(0.5)
      .setDepth(4000)
      .setAlpha(0);
    this.tweens.add({ targets: t, scale: 1, duration: 500, ease: 'Back.out' });
    this.tweens.add({ targets: sub, alpha: 1, duration: 400, delay: 200 });
    const count = this.add.text(GAME_W / 2, GAME_H / 2 + 120, '', textStyle(72)).setOrigin(0.5).setDepth(4000);
    const steps = ['3', '2', '1', 'BEŽ!'];
    steps.forEach((s, i) => {
      this.time.delayedCall(700 + i * 550, () => {
        count.setText(s).setScale(1.6).setAlpha(1);
        this.tweens.add({ targets: count, scale: 1, duration: 300, ease: 'Back.out' });
        if (i < 3) sfx.click();
        else sfx.powerUp();
      });
    });
    this.time.delayedCall(700 + 3 * 550, () => {
      this.state = 'run';
      this.dust.start();
      this.tweens.add({ targets: [t, sub, count], alpha: 0, duration: 500, delay: 300, onComplete: () => [t, sub, count].forEach((o) => o.destroy()) });
    });
  }

  // ------------------------------------------------------------ update ---

  update(_time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs / 1000, 0.05);
    switch (this.state) {
      case 'intro':
        this.updateIntro(dt);
        break;
      case 'run':
        this.updateRun(dt);
        break;
      case 'finish':
      case 'caught':
        this.updateCombineVisuals(dt, 0.2);
        break;
    }
    this.rabbit.y = this.rabbitY;
    this.rabbit.setDepth(this.rabbitY + 1);
    this.rabbitShadow.setPosition(this.rabbit.x, this.rabbitY + 4).setDepth(this.rabbitY - 30);
    this.bubble.setPosition(this.rabbit.x, this.rabbitY - 48).setDepth(this.rabbitY + 2);
  }

  private updateIntro(dt: number): void {
    // Gentle idle scroll during the countdown so the scene feels alive.
    const v = 40;
    this.scenery.update(v * dt, dt, this.combineFrontX());
    this.updateCombineVisuals(dt, 0.3);
    this.placeCombine();
  }

  private rabbitVelocity(): number {
    let v = rabbitSpeed(this.upgrades);
    if (this.turbo > 0) v *= BALANCE.turboMul;
    if (this.stun > 0) v *= BALANCE.stunSpeedMul;
    return v;
  }

  private updateRun(dt: number): void {
    this.elapsed += dt;

    // Timers
    this.stun = Math.max(0, this.stun - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.turbo = Math.max(0, this.turbo - dt);
    this.magnet = Math.max(0, this.magnet - dt);
    this.broken = Math.max(0, this.broken - dt);
    this.warnCooldown = Math.max(0, this.warnCooldown - dt);

    // Holding a key keeps moving after a short delay.
    if (this.holdDir !== 0) {
      this.holdTimer -= dt;
      if (this.holdTimer <= 0) {
        this.holdTimer = 0.16;
        this.moveLane(this.holdDir);
      }
    }

    // Speeds
    const rv = this.rabbitVelocity();
    this.combineSpeed = combineSpeedAt(this.level, this.elapsed);
    let cv = this.combineSpeed;
    if (this.broken > 0) cv *= BALANCE.brokenSpeedMul;
    this.gap += (rv - cv) * dt;
    if (this.gap > BALANCE.softMaxGap) this.gap -= (this.gap - BALANCE.softMaxGap) * Math.min(1, 2.5 * dt);

    const dx = rv * dt;
    this.distance += dx;

    this.scenery.update(dx, dt, this.combineFrontX());
    this.spawnAhead();
    this.updateItems(dt);
    this.updateCombineVisuals(dt, cv / 300);
    this.placeCombine();
    this.updateRabbitVisuals(dt);
    this.updateHud();

    if (this.gap <= 0) {
      this.caught();
      return;
    }
    if (this.distance >= this.length) this.finishLevel();
  }

  private updateRabbitVisuals(dt: number): void {
    const scaredNow = this.gap < 170;
    if (scaredNow !== this.scared && this.stun <= 0) {
      this.scared = scaredNow;
      this.rabbit.play(scaredNow ? 'run_scared' : 'run', true);
    }
    if (this.stun > 0) {
      this.rabbit.anims.pause();
      this.rabbit.setTexture('rabbit_hurt');
    } else if (!this.rabbit.anims.isPlaying) {
      this.rabbit.play(this.scared ? 'run_scared' : 'run', true);
    }
    const speedRatio = this.rabbitVelocity() / BALANCE.rabbitBaseSpeed;
    this.rabbit.anims.timeScale = Phaser.Math.Clamp(speedRatio, 0.6, 2.2);
    this.rabbit.setAlpha(this.invuln > 0 && this.stun <= 0 ? (Math.floor(this.time.now / 80) % 2 ? 0.45 : 1) : 1);
    this.bubble.setVisible(this.shields > 0);
    if (this.shields > 0) this.bubble.setScale(0.8 + Math.sin(this.time.now / 200) * 0.03);

    // Turbo trail
    if (this.turbo > 0 && !this.speedLines.emitting) this.speedLines.start();
    if (this.turbo <= 0 && this.speedLines.emitting) this.speedLines.stop();
    this.rabbit.x = Phaser.Math.Linear(this.rabbit.x, RABBIT_X + (this.turbo > 0 ? 40 : 0), Math.min(1, dt * 4));

    // Danger feedback
    const danger = Phaser.Math.Clamp(1 - this.gap / 200, 0, 1);
    this.vignette.setAlpha(danger * (0.6 + Math.sin(this.time.now / 90) * 0.3));
    if (danger > 0.35 && this.warnCooldown <= 0) {
      sfx.warning();
      this.warnCooldown = 1.2;
    }
    sfx.setEngine(Phaser.Math.Clamp(1 - this.gap / 500, 0, 1), this.combineSpeed / 300);
  }

  private updateCombineVisuals(dt: number, rpm: number): void {
    const isBroken = this.broken > 0;
    const spin = isBroken ? 0.2 : rpm;
    this.reel.tilePositionX -= dt * 420 * spin;
    for (const w of this.wheels) w.rotation += dt * 6 * spin;
    const front = this.combineFrontX();
    this.strawFx.setPosition(front - 380, laneY(2));
    this.smokeFx.setPosition(this.combine.x + 66, this.combine.y + 20);
    if (this.state === 'run' && front > -200) {
      if (!this.strawFx.emitting) this.strawFx.start();
      if (!this.smokeFx.emitting) this.smokeFx.start();
      this.smokeFx.frequency = isBroken ? 40 : 110;
      this.smokeFx.particleTint = isBroken ? 0x222222 : 0x777777;
    } else {
      if (this.strawFx.emitting) this.strawFx.stop();
      if (this.smokeFx.emitting && this.state !== 'run') this.smokeFx.stop();
    }
  }

  // ------------------------------------------------------------- items ---

  private addItem(kind: ItemKind, wx: number, lane: number): Item {
    const y = laneY(lane);
    const sprite = this.add.image(0, y, TEXTURE[kind]);
    let shadow: Phaser.GameObjects.Image | undefined;
    switch (kind) {
      case 'carrot':
      case 'gold':
        sprite.setOrigin(0.5, 0.8).setScale(0.75);
        shadow = this.add.image(0, y + 8, 'shadow').setScale(0.32, 0.4);
        break;
      case 'rock':
        sprite.setOrigin(0.5, 0.92);
        break;
      case 'mud':
        sprite.setOrigin(0.5, 0.75);
        break;
      case 'hay':
        sprite.setOrigin(0.5, 0.94).setScale(0.95);
        break;
      case 'hedgehog':
        sprite.setOrigin(0.5, 0.92);
        break;
      default:
        sprite.setOrigin(0.5, 0.75).setScale(0.82);
        shadow = this.add.image(0, y + 8, 'shadow').setScale(0.4, 0.45);
        break;
    }
    const item: Item = { kind, wx, y, baseY: y, sprite, shadow, t: Math.random() * 10 };
    if (kind === 'hedgehog') item.vy = (Math.random() < 0.5 ? -1 : 1) * (45 + this.level * 4);
    this.items.push(item);
    return item;
  }

  private screenX(wx: number): number {
    return RABBIT_X + (wx - this.distance);
  }

  private updateItems(dt: number): void {
    const magnetR = BALANCE.magnetBaseRadius + BALANCE.magnetRadiusPerLevel * this.upgrades.magnet;
    for (const it of this.items) {
      if (it.dead) continue;
      it.t += dt;
      let sx = this.screenX(it.wx);

      if (it.kind === 'hedgehog' && it.vy) {
        it.y += it.vy * dt;
        if (it.y < laneY(0)) {
          it.y = laneY(0);
          it.vy = Math.abs(it.vy);
        } else if (it.y > laneY(LANES - 1)) {
          it.y = laneY(LANES - 1);
          it.vy = -Math.abs(it.vy);
        }
      }

      // Magnet pulls carrots and power-ups toward the rabbit.
      const pullable = it.kind === 'carrot' || it.kind === 'gold';
      if (pullable && (this.magnet > 0 || it.magnet)) {
        const ddx = this.rabbit.x - sx;
        const ddy = this.rabbitY - 30 - it.y;
        const d = Math.hypot(ddx, ddy);
        if (it.magnet || d < magnetR) {
          it.magnet = true;
          const pull = Math.min(1, dt * 9);
          it.wx += ddx * pull;
          it.y += ddy * pull;
          sx = this.screenX(it.wx);
        }
      }

      const bob = it.kind === 'carrot' || it.kind === 'gold' || POWERUPS.includes(it.kind) || it.kind === 'sneaker' ? Math.sin(it.t * 5) * 5 : 0;
      it.sprite.setPosition(sx, it.y + bob);
      it.sprite.setDepth(it.y);
      if (it.kind === 'gold' || it.kind === 'sneaker') it.sprite.setAngle(Math.sin(it.t * 4) * 10);
      if (it.shadow) it.shadow.setPosition(sx, it.y + 10).setDepth(it.y - 30);

      // Collision
      const dyHit = Math.abs(it.y - this.rabbitY);
      if (Math.abs(sx - this.rabbit.x) < HIT_W[it.kind] + 26 && dyHit < (it.magnet ? 80 : 34)) {
        this.collect(it);
      }

      // Combine destroys whatever it reaches.
      if (sx < this.combineFrontX() + 10 && !it.dead) {
        if (OBSTACLES.includes(it.kind)) this.sparks.explode(4, sx, it.y - 20);
        this.removeItem(it);
      } else if (sx < -150) {
        this.removeItem(it);
      }
    }
    if (this.items.some((i) => i.dead)) this.items = this.items.filter((i) => !i.dead);
  }

  private removeItem(it: Item): void {
    it.dead = true;
    it.sprite.destroy();
    it.shadow?.destroy();
  }

  private collect(it: Item): void {
    const x = it.sprite.x;
    const y = it.sprite.y - 30;
    switch (it.kind) {
      case 'carrot':
      case 'gold': {
        const prevMult = this.multiplier();
        this.combo++;
        const mult = this.multiplier();
        if (mult > prevMult) {
          sfx.combo();
          this.floatText(RABBIT_X, this.rabbitY - 140, `KOMBO x${mult}!`, '#ffe14d', 46);
        }
        const pts = (it.kind === 'gold' ? 10 : 1) * mult;
        this.score += pts;
        this.carrotsThisLevel += it.kind === 'gold' ? 10 : 1;
        if (it.kind === 'gold') sfx.golden();
        else sfx.carrot(this.combo);
        this.sparks.explode(it.kind === 'gold' ? 16 : 6, x, y);
        this.floatText(x, y - 20, `+${pts}`, it.kind === 'gold' ? '#ffe14d' : '#ffffff', it.kind === 'gold' ? 40 : 30);
        this.tweens.add({ targets: this.scoreText, scale: 1.25, duration: 80, yoyo: true });
        this.removeItem(it);
        return;
      }
      case 'rock':
      case 'mud':
      case 'hay':
      case 'hedgehog':
        this.hitObstacle(it);
        return;
      case 'turbo':
        this.turbo = BALANCE.turboBaseTime + BALANCE.turboPerLevel * this.upgrades.turbo;
        this.stun = 0;
        sfx.powerUp();
        this.floatText(x, y - 30, 'TURBO!', '#ffe14d', 48);
        this.cameras.main.flash(150, 255, 240, 120);
        break;
      case 'magnet':
        this.magnet = BALANCE.magnetBaseTime + BALANCE.magnetPerLevel * this.upgrades.magnet;
        sfx.powerUp();
        this.floatText(x, y - 30, 'MAGNET!', '#ff6b6b', 48);
        break;
      case 'shield':
        this.shields = Math.min(this.shields + 1, 3);
        sfx.powerUp();
        this.floatText(x, y - 30, 'BUBLINA!', '#7fd4ff', 48);
        break;
      case 'wrench':
        this.broken = BALANCE.brokenTime;
        sfx.broken();
        this.floatText(x, y - 30, 'Kombajn sa pokazil!', '#c5ced8', 40);
        this.time.delayedCall(200, () => this.sparks.explode(20, this.combineFrontX() - 150, laneY(1)));
        break;
      case 'sneaker':
        this.upgrades.speed++;
        this.sneakersThisLevel++;
        sfx.upgrade();
        this.floatText(x, y - 30, 'RÝCHLEJŠIE LABKY!', '#ff9b5a', 44);
        this.cameras.main.flash(120, 255, 200, 160);
        break;
    }
    this.sparks.explode(18, x, y);
    this.removeItem(it);
  }

  private hitObstacle(it: Item): void {
    if (this.turbo > 0) {
      // Turbo smashes through obstacles.
      this.sparks.explode(14, it.sprite.x, it.sprite.y - 20);
      this.tweens.add({ targets: it.sprite, y: it.sprite.y - 200, x: it.sprite.x + 300, angle: 360, alpha: 0, duration: 500 });
      it.dead = true;
      it.shadow?.destroy();
      this.time.delayedCall(520, () => it.sprite.destroy());
      sfx.shieldPop();
      return;
    }
    if (this.invuln > 0) return;
    if (this.shields > 0) {
      this.shields--;
      this.invuln = 0.8;
      sfx.shieldPop();
      this.sparks.explode(20, this.rabbit.x, this.rabbitY - 50);
      this.floatText(this.rabbit.x, this.rabbitY - 130, 'Bublina ťa ochránila!', '#7fd4ff', 32);
      return;
    }
    this.stun = BALANCE.stunTime;
    this.invuln = BALANCE.invulnTime;
    this.combo = 0;
    this.hits++;
    sfx.hit();
    this.cameras.main.shake(180, 0.008);
    this.floatText(this.rabbit.x, this.rabbitY - 130, it.kind === 'mud' ? 'Šmyk!' : 'Au!', '#ff6b6b', 40);
    this.tweens.add({ targets: this.rabbit, angle: { from: -15, to: 15 }, duration: 90, yoyo: true, repeat: 3, onComplete: () => this.rabbit.setAngle(0) });
  }

  private multiplier(): number {
    return Math.min(BALANCE.comboBaseMax + this.upgrades.combo, 1 + Math.floor(this.combo / BALANCE.comboStep));
  }

  private floatText(x: number, y: number, s: string, color: string, size: number): void {
    const t = this.add.text(x, y, s, textStyle(size, color)).setOrigin(0.5).setDepth(3500).setScale(0.4);
    this.tweens.add({ targets: t, scale: 1, duration: 200, ease: 'Back.out' });
    this.tweens.add({ targets: t, y: y - 70, alpha: 0, delay: 450, duration: 600, onComplete: () => t.destroy() });
  }

  // ----------------------------------------------------------- spawner ---

  private spawnAhead(): void {
    const ahead = this.distance + (GAME_W - RABBIT_X) + 200;
    const stopAt = this.length - 700;
    while (this.spawnCursor < ahead && this.spawnCursor < stopAt) {
      const len = this.spawnPattern(this.spawnCursor);
      const spacing = Phaser.Math.Between(260, 380) + Math.max(0, 120 - this.level * 10);
      this.spawnCursor += len + spacing;
    }
    // Barn at the end of the level
    const barnX = this.screenX(this.length + 140);
    if (barnX < GAME_W + 300) {
      this.barn.setVisible(true).setPosition(barnX, laneY(0) + 10);
      this.flag.setVisible(true).setPosition(this.screenX(this.length - 20), laneY(LANES - 1) + 34);
      this.finishText.setVisible(true).setPosition(this.flag.x + 40, this.flag.y - 230);
    }
  }

  private randomLane(exclude: number[] = []): number {
    const free = [...Array(LANES).keys()].filter((l) => !exclude.includes(l));
    return Phaser.Utils.Array.GetRandom(free);
  }

  private obstacleKind(): ItemKind {
    const pool: ItemKind[] = ['rock', 'rock', 'hay', 'mud'];
    if (this.level >= 2) pool.push('hay', 'mud');
    return Phaser.Utils.Array.GetRandom(pool);
  }

  /** Spawns a group of items starting at world x; returns its length. */
  private spawnPattern(wx: number): number {
    const L = this.level;
    const luck = this.upgrades.luck;

    // Persistent speed upgrade ("sneakers") appears regularly – the rabbit needs them!
    if (this.sneakerIdx < SNEAKERS_PER_LEVEL && wx >= this.nextSneakerAt) {
      this.sneakerIdx++;
      this.nextSneakerAt = this.length * (0.22 + this.sneakerIdx * (0.6 / (SNEAKERS_PER_LEVEL - 1)));
      const lane = this.randomLane();
      // Guard it with an obstacle in front from level 2 on: risk vs. reward.
      if (L >= 2 && Math.random() < 0.6) {
        const guardLane = Phaser.Math.Clamp(lane + (Math.random() < 0.5 ? -1 : 1), 0, LANES - 1);
        if (guardLane !== lane) this.addItem(this.obstacleKind(), wx + 60, guardLane);
      }
      this.addItem('carrot', wx, lane);
      this.addItem('carrot', wx + 70, lane);
      this.addItem('sneaker', wx + 160, lane);
      return 200;
    }

    // Temporary power-ups
    if (wx >= this.nextPowerAt) {
      this.nextPowerAt = wx + Phaser.Math.Between(2600, 3600) - luck * 200;
      const weights: [ItemKind, number][] = [
        ['turbo', 4],
        ['magnet', 4],
        ['shield', 3],
        ['wrench', L >= 2 ? 2 : 1],
      ];
      const total = weights.reduce((s, [, w]) => s + w, 0);
      let r = Math.random() * total;
      let kind: ItemKind = 'turbo';
      for (const [k, w] of weights) {
        r -= w;
        if (r <= 0) {
          kind = k;
          break;
        }
      }
      this.addItem(kind, wx, this.randomLane());
      return 100;
    }

    const patterns: [() => number, number][] = [
      [() => this.patLine(wx), 3],
      [() => this.patWave(wx), 2],
      [() => this.patWall(wx), 2 + Math.min(L, 6) * 0.5],
      [() => this.patSlalom(wx), L >= 2 ? 2 : 0.5],
      [() => this.patGoldenReward(wx), 1 + luck * 0.4],
      [() => this.patHedgehog(wx), L >= 3 ? 1.5 : 0],
      [() => this.patScatter(wx), 1 + Math.min(L, 6) * 0.3],
    ];
    const total = patterns.reduce((s, [, w]) => s + w, 0);
    let r = Math.random() * total;
    for (const [fn, w] of patterns) {
      r -= w;
      if (r <= 0) return fn();
    }
    return this.patLine(wx);
  }

  private patLine(wx: number): number {
    const lane = this.randomLane();
    const n = Phaser.Math.Between(5, 8);
    for (let i = 0; i < n; i++) this.addItem('carrot', wx + i * 72, lane);
    if (this.level >= 2 && Math.random() < 0.5) {
      this.addItem(this.obstacleKind(), wx + n * 72 + 40, lane);
      return n * 72 + 80;
    }
    return n * 72;
  }

  private patWave(wx: number): number {
    let lane = this.randomLane();
    let dir = Math.random() < 0.5 ? -1 : 1;
    const n = Phaser.Math.Between(8, 12);
    for (let i = 0; i < n; i++) {
      this.addItem('carrot', wx + i * 70, lane);
      if (i % 2 === 1) {
        if (lane + dir < 0 || lane + dir >= LANES) dir = -dir;
        lane += dir;
      }
    }
    return n * 70;
  }

  private patWall(wx: number): number {
    const L = this.level;
    const count = Math.min(L >= 5 ? 4 : 3, 1 + Math.floor(Math.random() * (1 + L * 0.6)));
    const lanes = Phaser.Utils.Array.Shuffle([...Array(LANES).keys()]);
    const blocked = lanes.slice(0, count);
    const free = lanes.slice(count);
    for (const l of blocked) this.addItem(this.obstacleKind(), wx + Phaser.Math.Between(-10, 10), l);
    const carrotLane = Phaser.Utils.Array.GetRandom(free);
    for (let i = 0; i < 4; i++) this.addItem('carrot', wx - 140 + i * 70, carrotLane);
    return 260;
  }

  private patSlalom(wx: number): number {
    const n = Phaser.Math.Between(3, 4);
    let lane = this.randomLane();
    for (let i = 0; i < n; i++) {
      this.addItem(this.obstacleKind(), wx + i * 300, lane);
      const next = Phaser.Math.Clamp(lane + (Math.random() < 0.5 ? -1 : 1) * Phaser.Math.Between(1, 2), 0, LANES - 1);
      for (let k = 0; k < 3; k++) this.addItem('carrot', wx + i * 300 + 90 + k * 60, next === lane ? (lane + 1) % LANES : next);
      lane = next === lane ? (lane + 2) % LANES : next;
    }
    return n * 300;
  }

  private patGoldenReward(wx: number): number {
    const lane = this.randomLane();
    const around = [lane - 1, lane + 1].filter((l) => l >= 0 && l < LANES);
    if (this.level >= 2) this.addItem(this.obstacleKind(), wx, lane);
    for (const l of around) for (let i = 0; i < 3; i++) this.addItem('carrot', wx + i * 70, l);
    this.addItem('gold', wx + 240, lane);
    return 300;
  }

  private patHedgehog(wx: number): number {
    const lane = this.randomLane();
    this.addItem('hedgehog', wx, lane);
    const cl = this.randomLane([lane]);
    for (let i = 0; i < 5; i++) this.addItem('carrot', wx + 200 + i * 70, cl);
    return 560;
  }

  private patScatter(wx: number): number {
    const n = Phaser.Math.Between(3, 5);
    let lastLane = -1;
    for (let i = 0; i < n; i++) {
      const lane = this.randomLane([lastLane]);
      lastLane = lane;
      const ox = wx + i * 220;
      if (Math.random() < 0.55) this.addItem(this.obstacleKind(), ox, lane);
      else for (let k = 0; k < 3; k++) this.addItem('carrot', ox + k * 60, lane);
    }
    return n * 220;
  }

  // --------------------------------------------------------------- HUD ---

  private updateHud(): void {
    this.scoreText.setText(`${this.score}`);
    const mult = this.multiplier();
    this.comboText.setText(mult > 1 ? `KOMBO x${mult}` : '');

    const x0 = this.progressCombine.getData('x0') as number;
    const w = this.progressCombine.getData('w') as number;
    const p = Phaser.Math.Clamp(this.distance / this.length, 0, 1);
    this.progressRabbit.x = x0 + p * w;
    const cp = Phaser.Math.Clamp((this.distance - this.gap) / this.length, 0, 1);
    this.progressCombine.width = Math.max(4, cp * w);

    const meters = Math.max(0, this.gap / PX_PER_METER);
    const close = this.gap < 200;
    this.dangerText.setText(close ? `POZOR! Kombajn je ${meters.toFixed(1)} m za tebou!` : `Kombajn: ${meters.toFixed(0)} m`);
    this.dangerText.setColor(close ? '#ff5a5a' : '#ffffff');
    this.dangerText.setScale(close ? 1 + Math.sin(this.time.now / 80) * 0.06 : 1);

    const rv = rabbitSpeed(this.upgrades);
    this.speedText.setText(`Zajko: ${(rv / PX_PER_METER * 3.6).toFixed(0)} km/h   Kombajn: ${((this.broken > 0 ? this.combineSpeed * BALANCE.brokenSpeedMul : this.combineSpeed) / PX_PER_METER * 3.6).toFixed(0)} km/h`);

    // Active power-ups
    this.powerHud.removeAll(true);
    const active: [string, number, number][] = [];
    if (this.turbo > 0) active.push(['pu_turbo', this.turbo, BALANCE.turboBaseTime + BALANCE.turboPerLevel * this.upgrades.turbo]);
    if (this.magnet > 0) active.push(['pu_magnet', this.magnet, BALANCE.magnetBaseTime + BALANCE.magnetPerLevel * this.upgrades.magnet]);
    if (this.broken > 0) active.push(['pu_wrench', this.broken, BALANCE.brokenTime]);
    for (let i = 0; i < this.shields; i++) active.push(['pu_shield', 1, 1]);
    active.forEach(([tex, t, max], i) => {
      const x = -i * 64;
      const img = this.add.image(x, 30, tex).setScale(0.62);
      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.35).fillRoundedRect(x - 26, 60, 52, 8, 4);
      g.fillStyle(0xffffff, 1).fillRoundedRect(x - 26, 60, 52 * Phaser.Math.Clamp(t / max, 0, 1), 8, 4);
      this.powerHud.add([img, g]);
    });
  }

  // ------------------------------------------------------- level end ---

  private finishLevel(): void {
    this.state = 'finish';
    this.dust.stop();
    this.speedLines.stop();
    this.vignette.setAlpha(0);
    sfx.stopEngine();
    sfx.levelUp();
    const bonus = 20 * this.level;
    this.score += bonus;
    this.scoreText.setText(`${this.score}`);
    this.floatText(GAME_W / 2, 200, `Bonus +${bonus}`, '#ffe14d', 48);

    // Combine stops, rabbit runs into the barn.
    this.tweens.add({ targets: this, gap: this.gap + 300, duration: 1500, ease: 'Sine.in', onUpdate: () => this.placeCombine() });
    this.rabbit.play('run', true);
    const door = this.barn.x;
    this.tweens.add({ targets: this, rabbitY: laneY(0) - 20, duration: 600, ease: 'Sine.inOut' });
    this.tweens.add({
      targets: this.rabbit,
      x: door,
      duration: 900,
      ease: 'Sine.in',
      onComplete: () => {
        this.rabbit.setVisible(false);
        this.rabbitShadow.setVisible(false);
        this.bubble.setVisible(false);
        this.confetti();
      },
    });
    for (const it of this.items) this.tweens.add({ targets: it.sprite, alpha: 0, duration: 400 });

    const data = load();
    save({
      bestLevel: Math.max(data.bestLevel, this.level),
      highScore: Math.max(data.highScore, this.score),
      totalCarrots: data.totalCarrots + this.carrotsThisLevel,
    });

    this.time.delayedCall(2200, () => {
      this.scene.pause();
      this.scene.launch('LevelComplete', {
        level: this.level,
        score: this.score,
        levelScore: this.score - this.levelStartScore,
        carrots: this.carrotsThisLevel,
        sneakers: this.sneakersThisLevel,
        hits: this.hits,
        upgrades: this.upgrades,
      });
    });
  }

  private confetti(): void {
    const e = this.add.particles(0, 0, 'confetti', {
      x: { min: 0, max: GAME_W },
      y: -20,
      lifespan: 3000,
      speedY: { min: 150, max: 350 },
      speedX: { min: -80, max: 80 },
      rotate: { start: 0, end: 720 },
      tint: [0xff4b8b, 0xffe14d, 0x4cc94f, 0x3fa9ff, 0xff8c1a, 0xa98bff],
      quantity: 3,
      frequency: 20,
    }).setDepth(3900);
    this.time.delayedCall(1500, () => e.stop());
  }

  private caught(): void {
    this.state = 'caught';
    this.gap = 0;
    this.placeCombine();
    this.dust.stop();
    this.speedLines.stop();
    sfx.stopMusic();
    sfx.splat();
    this.rabbit.anims.stop();
    this.rabbit.setTexture('rabbit_scared_1');
    this.bubble.setVisible(false);
    this.vignette.setAlpha(0);

    const rx = this.rabbit.x;
    const ry = this.rabbitY;
    // Rabbit gets squashed...
    this.tweens.add({
      targets: this.rabbit,
      scaleY: 0.1,
      scaleX: 1.3,
      duration: 160,
      ease: 'Quad.in',
      onComplete: () => {
        this.rabbit.setVisible(false);
        this.rabbitShadow.setVisible(false);
        // ...and a big purple splat appears!
        const splat = this.add.image(rx + 10, ry - 10, 'splat').setDepth(1450).setScale(0.1).setAngle(Phaser.Math.Between(-10, 10));
        this.tweens.add({ targets: splat, scale: 1.15, duration: 350, ease: 'Back.out' });
        const drops = this.add.particles(rx, ry - 30, 'drop', {
          speed: { min: 250, max: 650 },
          angle: { min: 180, max: 360 },
          gravityY: 900,
          lifespan: 1400,
          scale: { min: 0.6, max: 1.6 },
          tint: [0x8e2de2, 0xb35cff, 0x6a1bb5],
          rotate: { min: 0, max: 360 },
          emitting: false,
        }).setDepth(3000);
        drops.explode(60);
        const big = this.add.particles(rx, ry - 30, 'dot', {
          speed: { min: 100, max: 400 },
          lifespan: 900,
          scale: { start: 1.6, end: 0 },
          tint: [0x8e2de2, 0xb35cff],
          emitting: false,
        }).setDepth(3000);
        big.explode(30);
        // Purple splashes stick on the combine too.
        for (let i = 0; i < 6; i++) {
          const s = this.add.image(Phaser.Math.Between(260, 400), Phaser.Math.Between(80, 420), 'splat').setScale(Phaser.Math.FloatBetween(0.1, 0.22)).setAngle(Phaser.Math.Between(0, 360));
          this.combine.add(s);
        }
        this.cameras.main.shake(400, 0.02);
        this.cameras.main.flash(250, 180, 80, 255);
        // A little rabbit ghost floats away (cute, not scary).
        const ghost = this.add.image(rx, ry - 60, 'ghost').setDepth(3600).setAlpha(0).setScale(0.6);
        this.tweens.add({ targets: ghost, alpha: 0.95, scale: 0.9, duration: 500, delay: 400 });
        this.tweens.add({ targets: ghost, y: ry - 320, duration: 2600, delay: 400, ease: 'Sine.out' });
        this.tweens.add({ targets: ghost, x: rx + 30, duration: 600, yoyo: true, repeat: 3, ease: 'Sine.inOut', delay: 400 });
      },
    });
    // Combine rolls a bit further and stops.
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 1200,
      onUpdate: (tw) => {
        this.gap = -tw.getValue()! * 160;
        this.placeCombine();
      },
      onComplete: () => sfx.stopEngine(),
    });

    const data = load();
    const isRecord = this.score > data.highScore;
    save({
      highScore: Math.max(data.highScore, this.score),
      bestLevel: Math.max(data.bestLevel, this.level - 1),
      totalCarrots: data.totalCarrots + this.carrotsThisLevel,
      gamesPlayed: data.gamesPlayed + 1,
    });

    this.time.delayedCall(2600, () => {
      this.scene.pause();
      this.scene.launch('GameOver', { level: this.level, score: this.score, record: isRecord, checkpoint: this.checkpoint });
    });
  }

  // ------------------------------------------------------------- pause ---

  private pauseGame(): void {
    if (this.state !== 'run' && this.state !== 'intro') return;
    if (this.scene.isPaused()) return;
    this.scene.pause();
    sfx.stopMusic();
    sfx.setEngine(0, 0);
    this.scene.launch('Pause');
  }

  resumeGame(): void {
    this.holdDir = 0;
    sfx.startMusic(1 + Math.min(this.level - 1, 8) * 0.03);
    this.scene.resume();
  }
}
