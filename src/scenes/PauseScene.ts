import Phaser from 'phaser';
import { GAME_H, GAME_W } from '../config';
import { sfx } from '../audio';
import { load } from '../storage';
import { drawPanel, makeButton, textStyle } from '../ui';
import type { GameScene } from './GameScene';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  create(): void {
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x000000, 0.5).setOrigin(0).setInteractive();
    drawPanel(this, GAME_W / 2, GAME_H / 2, 560, 520);
    this.add.text(GAME_W / 2, GAME_H / 2 - 190, 'Prestávka', textStyle(56, '#ff8c1a')).setOrigin(0.5);
    this.add.image(GAME_W / 2, GAME_H / 2 - 105, 'rabbit_happy').setScale(0.6);

    makeButton(this, GAME_W / 2, GAME_H / 2 + 0, 'Pokračovať', () => this.resume(), { w: 380 });
    const soundBtn = makeButton(this, GAME_W / 2, GAME_H / 2 + 95, load().muted ? 'Zvuk: VYP' : 'Zvuk: ZAP', () => {
      const m = sfx.toggleMute();
      (soundBtn.list[1] as Phaser.GameObjects.Text).setText(m ? 'Zvuk: VYP' : 'Zvuk: ZAP');
    }, { w: 380, color: 0x3fa9ff, shade: 0x1a6bb0 });
    makeButton(this, GAME_W / 2, GAME_H / 2 + 190, 'Do menu', () => {
      this.scene.stop('Game');
      this.scene.start('Menu');
    }, { w: 380, color: 0xd9534f, shade: 0x8a2a27 });

    const kb = this.input.keyboard!;
    kb.once('keydown-ESC', () => this.resume());
    kb.once('keydown-P', () => this.resume());
  }

  private resume(): void {
    this.scene.stop();
    (this.scene.get('Game') as GameScene).resumeGame();
  }
}
