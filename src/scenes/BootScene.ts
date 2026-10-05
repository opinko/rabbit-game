import Phaser from 'phaser';
import { buildArt } from '../art';
import { FONT, GAME_H, GAME_W } from '../config';

export class BootScene extends Phaser.Scene {
  private urls: string[] = [];

  constructor() {
    super('Boot');
  }

  preload(): void {
    this.cameras.main.setBackgroundColor('#9ed8ff');
    const barBg = this.add.rectangle(GAME_W / 2, GAME_H / 2 + 40, 500, 30, 0xffffff, 0.6).setStrokeStyle(4, 0x3b2412);
    const bar = this.add.rectangle(GAME_W / 2 - 246, GAME_H / 2 + 40, 0, 22, 0xff8c1a).setOrigin(0, 0.5);
    this.add.text(GAME_W / 2, GAME_H / 2 - 30, 'Načítavam...', { fontFamily: FONT, fontSize: '42px', color: '#3b2412' }).setOrigin(0.5);
    this.load.on('progress', (p: number) => {
      bar.width = 492 * p;
    });
    this.load.on('complete', () => barBg.destroy());

    for (const a of buildArt()) {
      const url = URL.createObjectURL(new Blob([a.svg], { type: 'image/svg+xml' }));
      this.urls.push(url);
      this.load.svg(a.key, url, { width: a.w, height: a.h });
    }
  }

  async create(): Promise<void> {
    for (const u of this.urls) URL.revokeObjectURL(u);
    this.urls = [];

    this.anims.create({
      key: 'run',
      frames: [0, 1, 2, 3].map((i) => ({ key: `rabbit_${i}` })),
      frameRate: 12,
      repeat: -1,
    });
    this.anims.create({
      key: 'run_scared',
      frames: [0, 1, 2, 3].map((i) => ({ key: `rabbit_scared_${i}` })),
      frameRate: 14,
      repeat: -1,
    });

    // Wait (briefly) for the web font so texts don't render in a fallback font.
    try {
      await Promise.race([
        Promise.all([document.fonts.load('700 32px "Fredoka"'), document.fonts.load('400 32px "Fredoka"')]),
        new Promise((r) => setTimeout(r, 2500)),
      ]);
    } catch {
      // Font loading failed: fall back to system fonts.
    }
    this.scene.start('Menu');
  }
}
