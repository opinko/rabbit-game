import Phaser from 'phaser';
import { GAME_H, GAME_W, UPGRADES, laneY } from '../config';
import { sfx } from '../audio';
import { Scenery } from '../scenery';
import { load, newRun, save } from '../storage';
import { drawPanel, makeButton, makeRoundButton, textStyle } from '../ui';

export class MenuScene extends Phaser.Scene {
  private scenery!: Scenery;
  private rabbit!: Phaser.GameObjects.Sprite;
  private combine!: Phaser.GameObjects.Image;
  private t = 0;
  private overlay: Phaser.GameObjects.Container | null = null;

  constructor() {
    super('Menu');
  }

  create(): void {
    this.overlay = null;
    this.scenery = new Scenery(this);
    const data = load();

    this.add.image(680, laneY(4) + 4, 'shadow').setScale(0.75, 0.8).setDepth(10);
    this.rabbit = this.add.sprite(680, laneY(4), 'rabbit_0').setOrigin(0.5, 0.88).setScale(1).setDepth(11);
    this.rabbit.play('run');
    this.combine = this.add.image(-250, laneY(0) - 140, 'combine').setOrigin(0, 0).setScale(0.8).setDepth(5);
    for (let i = 0; i < 6; i++) {
      const c = this.add.image(800 + i * 80, laneY(4) - 6, 'carrot').setScale(0.7).setDepth(12);
      this.tweens.add({ targets: c, y: c.y - 10, duration: 500 + i * 40, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }

    // Title
    const title = this.add.text(GAME_W / 2 + 120, 120, 'Zajko Utekajko', textStyle(96, '#ffffff', '#3b2412', 12)).setOrigin(0.5).setDepth(100);
    title.setShadow(0, 8, '#00000055', 0, true, true);
    this.tweens.add({ targets: title, angle: { from: -2, to: 2 }, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.add.text(GAME_W / 2 + 120, 200, 'Zbieraj mrkvičky a uteč kombajnu!', textStyle(34, '#ffe14d')).setOrigin(0.5).setDepth(100);

    // Stats panel
    const panelX = GAME_W - 250;
    const panelY = 430;
    drawPanel(this, panelX, panelY, 400, 300).setDepth(100);
    const stats = [
      `🏆 Rekord: ${data.highScore}`,
      `⭐ Najlepší level: ${data.bestLevel}`,
      `🥕 Mrkvy spolu: ${data.totalCarrots}`,
    ];
    this.add.text(panelX, panelY - 112, 'Tvoje skóre', textStyle(32, '#ff8c1a')).setOrigin(0.5).setDepth(101);
    stats.forEach((s, i) =>
      this.add.text(panelX - 165, panelY - 62 + i * 46, s, { ...textStyle(28, '#3b2412', '#ffffff', 0), align: 'left' }).setOrigin(0, 0.5).setDepth(101),
    );
    if (data.run && data.run.level > 1) {
      const u = data.run.upgrades;
      this.add.text(panelX, panelY + 80, 'Vylepšenia v aktuálnej hre:', { ...textStyle(20, '#3b2412', '#ffffff', 0) }).setOrigin(0.5).setDepth(101);
      UPGRADES.forEach((def, i) => {
        const x = panelX - 150 + i * 60;
        this.add.image(x, panelY + 118, def.icon).setScale(0.5).setDepth(101).setAlpha(u[def.id] > 0 ? 1 : 0.35);
        this.add.text(x + 14, panelY + 132, `${u[def.id]}`, textStyle(18)).setOrigin(0.5).setDepth(102);
      });
    }

    // Buttons
    const bx = 330;
    let by = 330;
    if (data.run && (data.run.level > 1 || data.run.score > 0)) {
      makeButton(this, bx, by, `Pokračovať – Level ${data.run.level}`, () => this.startGame(false), { w: 440, fontSize: 32, color: 0xff9b1f, shade: 0xb35f00 }).setDepth(200);
      by += 96;
      makeButton(this, bx, by, 'Nová hra', () => this.confirmNewGame(), { w: 440, fontSize: 32 }).setDepth(200);
    } else {
      makeButton(this, bx, by, 'HRAŤ!', () => this.startGame(true), { w: 440, h: 96, fontSize: 52, color: 0xff9b1f, shade: 0xb35f00 }).setDepth(200);
      by += 10;
    }
    by += 96;
    makeButton(this, bx, by, 'Ako sa hrá?', () => this.showHelp(), { w: 440, fontSize: 30, color: 0x3fa9ff, shade: 0x1a6bb0 }).setDepth(200);

    const mute = makeRoundButton(this, GAME_W - 46, GAME_H - 46, data.muted ? '🔇' : '🔊', () => {
      const m = sfx.toggleMute();
      (mute.getData('label') as Phaser.GameObjects.Text).setText(m ? '🔇' : '🔊');
    });
    mute.setDepth(200);
    const music = makeRoundButton(this, GAME_W - 120, GAME_H - 46, '🎵', () => {
      const on = sfx.toggleMusic();
      music.setAlpha(on ? 1 : 0.45);
    });
    music.setDepth(200).setAlpha(data.music ? 1 : 0.45);

    this.input.keyboard?.on('keydown-ENTER', () => {
      if (!this.overlay) this.startGame(!(data.run && (data.run.level > 1 || data.run.score > 0)));
    });
    this.input.keyboard?.on('keydown-SPACE', () => {
      if (!this.overlay) this.startGame(!(data.run && (data.run.level > 1 || data.run.score > 0)));
    });
  }

  update(_t: number, dms: number): void {
    const dt = dms / 1000;
    this.t += dt;
    this.scenery.update(220 * dt, dt, this.combine.x + 400 * 0.8);
    this.combine.x = -235 + Math.sin(this.t * 0.6) * 25;
    this.combine.y = laneY(0) - 130 + Math.sin(this.t * 20) * 1.2;
    this.rabbit.x = 680 + Math.sin(this.t * 0.9) * 20;
  }

  private startGame(fresh: boolean): void {
    sfx.unlock();
    const data = load();
    const checkpoint = fresh || !data.run ? newRun() : data.run;
    if (fresh) save({ run: checkpoint });
    this.cameras.main.fadeOut(250, 255, 255, 255);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('Game', { checkpoint });
    });
  }

  private confirmNewGame(): void {
    if (this.overlay) return;
    const c = this.add.container(0, 0).setDepth(1000);
    const dim = this.add.rectangle(0, 0, GAME_W, GAME_H, 0x000000, 0.5).setOrigin(0).setInteractive();
    c.add(dim);
    c.add(drawPanel(this, GAME_W / 2, GAME_H / 2, 640, 340));
    c.add(this.add.text(GAME_W / 2, GAME_H / 2 - 90, 'Začať odznova?', textStyle(44, '#ff8c1a')).setOrigin(0.5));
    c.add(this.add.text(GAME_W / 2, GAME_H / 2 - 25, 'Rozohratá hra a jej vylepšenia sa stratia.\nRekord ostane uložený.', { ...textStyle(24, '#3b2412', '#ffffff', 0) }).setOrigin(0.5));
    c.add(makeButton(this, GAME_W / 2 - 150, GAME_H / 2 + 90, 'Áno', () => this.startGame(true), { w: 240 }));
    c.add(
      makeButton(this, GAME_W / 2 + 150, GAME_H / 2 + 90, 'Nie', () => {
        c.destroy();
        this.overlay = null;
      }, { w: 240, color: 0xd9534f, shade: 0x8a2a27 }),
    );
    this.overlay = c;
  }

  private showHelp(): void {
    if (this.overlay) return;
    const c = this.add.container(0, 0).setDepth(1000);
    const dim = this.add.rectangle(0, 0, GAME_W, GAME_H, 0x000000, 0.5).setOrigin(0).setInteractive();
    c.add(dim);
    c.add(drawPanel(this, GAME_W / 2, GAME_H / 2, 1060, 640));
    c.add(this.add.text(GAME_W / 2, 80, 'Ako sa hrá?', textStyle(48, '#ff8c1a')).setOrigin(0.5));
    const lines: [string, string][] = [
      ['rabbit_1', 'Zajko beží sám. Ty ho ovládaš len HORE a DOLE:\nšípky ↑ ↓ (alebo W / S), alebo ťukni nad / pod zajka, alebo potiahni prstom.'],
      ['carrot', 'Zbieraj mrkvičky – sú to body! Veľa mrkiev za sebou = KOMBO a viac bodov.'],
      ['carrot_gold', 'Zlatá mrkva má hodnotu 10 mrkiev!'],
      ['pu_sneaker', 'Rýchle topánky = zajko je navždy rýchlejší. Kombajn stále zrýchľuje, tak ich zbieraj!'],
      ['pu_turbo', 'Turbo: chvíľu letíš a prerazíš prekážky.   Magnet: priťahuje mrkvy.'],
      ['pu_shield', 'Bublina ťa ochráni pred jednou prekážkou.   Kľúč pokazí kombajn!'],
      ['rock', 'Kamene, bahno, balíky sena a ježkovia ťa spomalia. Vyhni sa im!'],
    ];
    lines.forEach(([icon, text], i) => {
      const y = 160 + i * 68;
      const img = this.add.image(170, y, icon);
      img.setScale(Math.min(60 / img.width, 60 / img.height));
      c.add(img);
      c.add(this.add.text(220, y, text, { ...textStyle(21, '#3b2412', '#ffffff', 0), align: 'left', wordWrap: { width: 840 } }).setOrigin(0, 0.5));
    });
    c.add(
      makeButton(this, GAME_W / 2, GAME_H - 70, 'Rozumiem!', () => {
        c.destroy();
        this.overlay = null;
      }, { w: 300 }),
    );
    this.overlay = c;
  }
}
