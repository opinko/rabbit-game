import Phaser from 'phaser';
import { GAME_H, GAME_W } from '../config';
import { load, type RunCheckpoint } from '../storage';
import { drawPanel, makeButton, textStyle } from '../ui';

interface GameOverData {
  level: number;
  score: number;
  record: boolean;
  checkpoint: RunCheckpoint;
}

const TIPS = [
  'Tip: Zbieraj červené topánky – zajko bude rýchlejší!',
  'Tip: Kľúč pokazí kombajn na pár sekúnd.',
  'Tip: S turbom prerazíš aj kamene!',
  'Tip: Bublina ťa ochráni pred jednou prekážkou.',
  'Tip: Keď je kombajn blízko, hľadaj turbo blesk!',
  'Tip: Vyhýbaj sa prekážkam – každý náraz ťa spomalí.',
];

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  create(d: GameOverData): void {
    const data = load();
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x2a0a3d, 0.6).setOrigin(0).setInteractive();
    const panel = drawPanel(this, GAME_W / 2, GAME_H / 2, 760, 560, 0xf6ecff);
    panel.setScale(0.6).setAlpha(0);
    this.tweens.add({ targets: panel, scale: 1, alpha: 1, duration: 350, ease: 'Back.out' });

    const title = this.add.text(GAME_W / 2, GAME_H / 2 - 210, 'ŠPLECH!', textStyle(80, '#b35cff', '#3a0d5c', 10)).setOrigin(0.5);
    this.tweens.add({ targets: title, scale: { from: 0.3, to: 1 }, duration: 600, ease: 'Elastic.out' });
    this.add.text(GAME_W / 2, GAME_H / 2 - 140, 'Kombajn dobehol zajka!', textStyle(34, '#3b2412', '#ffffff', 0)).setOrigin(0.5);

    this.add.image(GAME_W / 2 - 160, GAME_H / 2 - 50, 'carrot').setScale(0.9);
    const scoreText = this.add.text(GAME_W / 2 - 110, GAME_H / 2 - 50, '0', textStyle(64, '#ff8c1a')).setOrigin(0, 0.5);
    this.tweens.addCounter({
      from: 0,
      to: d.score,
      duration: 900,
      onUpdate: (t) => scoreText.setText(`${Math.round(t.getValue()!)}`),
    });

    if (d.record && d.score > 0) {
      const rec = this.add.text(GAME_W / 2, GAME_H / 2 + 20, '🏆 NOVÝ REKORD! 🏆', textStyle(40, '#ffe14d')).setOrigin(0.5);
      this.tweens.add({ targets: rec, scale: { from: 0.9, to: 1.1 }, duration: 500, yoyo: true, repeat: -1 });
    } else {
      this.add.text(GAME_W / 2, GAME_H / 2 + 20, `Rekord: ${data.highScore}`, textStyle(32, '#3b2412', '#ffffff', 0)).setOrigin(0.5);
    }
    this.add.text(GAME_W / 2, GAME_H / 2 + 70, Phaser.Utils.Array.GetRandom(TIPS), textStyle(22, '#6a1bb5', '#ffffff', 0)).setOrigin(0.5);

    makeButton(this, GAME_W / 2 - 175, GAME_H / 2 + 175, `Znova level ${d.level}`, () => this.retry(d), {
      w: 320,
      fontSize: 30,
      color: 0xff9b1f,
      shade: 0xb35f00,
    });
    makeButton(this, GAME_W / 2 + 175, GAME_H / 2 + 175, 'Menu', () => this.menu(), { w: 300, fontSize: 30, color: 0x3fa9ff, shade: 0x1a6bb0 });

    this.input.keyboard?.once('keydown-ENTER', () => this.retry(d));
    this.input.keyboard?.once('keydown-SPACE', () => this.retry(d));
  }

  private retry(d: GameOverData): void {
    this.scene.stop('Game');
    this.scene.start('Game', { checkpoint: d.checkpoint });
  }

  private menu(): void {
    this.scene.stop('Game');
    this.scene.start('Menu');
  }
}
