import Phaser from 'phaser';
import { GAME_H, GAME_W, SNEAKERS_PER_LEVEL, UPGRADES, type UpgradeDef, type Upgrades } from '../config';
import { sfx } from '../audio';
import { save } from '../storage';
import { drawPanel, makeButton, textStyle } from '../ui';

interface LevelCompleteData {
  level: number;
  score: number;
  levelScore: number;
  carrots: number;
  sneakers: number;
  hits: number;
  upgrades: Upgrades;
}

export class LevelCompleteScene extends Phaser.Scene {
  private picked = false;

  constructor() {
    super('LevelComplete');
  }

  create(d: LevelCompleteData): void {
    this.picked = false;
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x1d3b1a, 0.55).setOrigin(0).setInteractive();
    const panel = drawPanel(this, GAME_W / 2, GAME_H / 2 + 10, 1120, 660);
    panel.setScale(0.6).setAlpha(0);
    this.tweens.add({ targets: panel, scale: 1, alpha: 1, duration: 350, ease: 'Back.out' });

    const title = this.add.text(GAME_W / 2, 78, `Level ${d.level} hotový!`, textStyle(58, '#4cc94f')).setOrigin(0.5);
    this.tweens.add({ targets: title, scale: { from: 0.4, to: 1 }, duration: 500, ease: 'Back.out' });
    this.add.image(GAME_W / 2 - 300, 78, 'rabbit_happy').setScale(0.55);
    this.add.image(GAME_W / 2 + 300, 78, 'carrot_gold').setScale(0.8);

    const line = (y: number, label: string, value: string, delay: number) => {
      const a = this.add.text(GAME_W / 2 - 230, y, label, { ...textStyle(28, '#3b2412', '#ffffff', 0), align: 'left' }).setOrigin(0, 0.5).setAlpha(0);
      const b = this.add.text(GAME_W / 2 + 230, y, value, textStyle(30, '#ff8c1a')).setOrigin(1, 0.5).setAlpha(0);
      this.tweens.add({ targets: [a, b], alpha: 1, duration: 250, delay });
    };
    line(150, '🥕 Mrkvy v tomto leveli:', `${d.carrots}`, 200);
    line(192, '⭐ Body za level:', `+${d.levelScore}`, 350);
    line(234, '👟 Rýchle topánky:', `${d.sneakers} / ${SNEAKERS_PER_LEVEL}`, 500);
    line(276, '🏆 Spolu bodov:', `${d.score}`, 650);

    const sub = this.add.text(GAME_W / 2, 335, 'Vyber si odmenu – vylepšenie zostane navždy!', textStyle(30, '#ffffff', '#3b2412')).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: sub, alpha: 1, duration: 300, delay: 800 });

    // Offer 3 random upgrades that are not maxed yet. Speed is always offered
    // if the rabbit is falling behind the combine's pace.
    const available = UPGRADES.filter((u) => d.upgrades[u.id] < u.max);
    const shuffled = Phaser.Utils.Array.Shuffle([...available]);
    const choice: UpgradeDef[] = [];
    const speed = available.find((u) => u.id === 'speed');
    if (speed && d.upgrades.speed < d.level * 2) choice.push(speed);
    for (const u of shuffled) if (choice.length < 3 && !choice.includes(u)) choice.push(u);

    choice.forEach((u, i) => {
      const x = GAME_W / 2 + (i - (choice.length - 1) / 2) * 340;
      this.card(x, 505, u, d, 900 + i * 150);
    });
    if (choice.length === 0) {
      makeButton(this, GAME_W / 2, 500, 'Ďalší level', () => this.next(d, null), { w: 360 });
    }
  }

  private card(x: number, y: number, u: UpgradeDef, d: LevelCompleteData, delay: number): void {
    const w = 300;
    const h = 250;
    const c = this.add.container(x, y).setAlpha(0).setScale(0.5);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.25).fillRoundedRect(-w / 2 + 5, -h / 2 + 8, w, h, 24);
    g.fillStyle(0xffffff, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 24);
    g.fillStyle(0xffe9b0, 1).fillRoundedRect(-w / 2, -h / 2, w, 92, { tl: 24, tr: 24, bl: 0, br: 0 });
    g.lineStyle(5, 0x3b2412, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 24);
    const icon = this.add.image(0, -h / 2 + 50, u.icon).setScale(1.05);
    const name = this.add.text(0, -12, u.name, textStyle(30, '#ff8c1a')).setOrigin(0.5);
    const desc = this.add
      .text(0, 40, u.desc, { ...textStyle(20, '#3b2412', '#ffffff', 0), wordWrap: { width: w - 40 } })
      .setOrigin(0.5);
    const lvl = d.upgrades[u.id];
    const dots: Phaser.GameObjects.GameObject[] = [];
    if (u.max > 10) {
      dots.push(this.add.text(0, h / 2 - 32, `úroveň ${lvl} → ${lvl + 1}`, textStyle(22, '#4cc94f')).setOrigin(0.5));
    } else {
      for (let i = 0; i < u.max; i++) {
        const color = i < lvl ? 0xff8c1a : i === lvl ? 0x4cc94f : 0xdddddd;
        dots.push(this.add.circle((i - (u.max - 1) / 2) * 22, h / 2 - 28, 8, color).setStrokeStyle(2, 0x3b2412));
      }
    }
    c.add([g, icon, name, desc, ...dots]);
    c.setSize(w, h);
    this.tweens.add({ targets: c, alpha: 1, scale: 1, duration: 350, delay, ease: 'Back.out' });
    this.tweens.add({ targets: icon, angle: { from: -8, to: 8 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.time.delayedCall(delay + 350, () => {
      c.setInteractive({ useHandCursor: true });
      c.on('pointerover', () => this.tweens.add({ targets: c, scale: 1.07, duration: 120 }));
      c.on('pointerout', () => this.tweens.add({ targets: c, scale: 1, duration: 120 }));
      c.on('pointerdown', () => {
        if (this.picked) return;
        this.picked = true;
        sfx.unlock();
        sfx.upgrade();
        this.tweens.add({ targets: c, scale: 1.2, duration: 200, yoyo: true });
        const fx = this.add.particles(x, y, 'spark', {
          speed: { min: 150, max: 400 },
          lifespan: 700,
          scale: { start: 1, end: 0 },
          tint: [0xffe14d, 0xff8c1a, 0xffffff],
          emitting: false,
        });
        fx.explode(30);
        this.time.delayedCall(700, () => this.next(d, u));
      });
    });
  }

  private next(d: LevelCompleteData, u: UpgradeDef | null): void {
    const upgrades = { ...d.upgrades };
    if (u) upgrades[u.id] = Math.min(u.max, upgrades[u.id] + 1);
    const checkpoint = { level: d.level + 1, score: d.score, upgrades };
    save({ run: checkpoint });
    this.cameras.main.fadeOut(250, 255, 255, 255);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.stop('Game');
      this.scene.start('Game', { checkpoint });
    });
  }
}
