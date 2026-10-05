import Phaser from 'phaser';
import { FONT } from './config';
import { sfx } from './audio';

export function textStyle(size: number, color = '#ffffff', stroke = '#3b2412', strokeThickness = Math.max(3, Math.round(size / 7))): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: FONT,
    fontSize: `${size}px`,
    fontStyle: 'bold',
    color,
    stroke,
    strokeThickness,
    align: 'center',
  };
}

export interface ButtonOpts {
  w?: number;
  h?: number;
  color?: number;
  shade?: number;
  fontSize?: number;
  icon?: string;
}

export function makeButton(scene: Phaser.Scene, x: number, y: number, label: string, onClick: () => void, opts: ButtonOpts = {}): Phaser.GameObjects.Container {
  const w = opts.w ?? 320;
  const h = opts.h ?? 76;
  const color = opts.color ?? 0x4cc94f;
  const shade = opts.shade ?? 0x2a8a2d;
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.25).fillRoundedRect(-w / 2 + 4, -h / 2 + 8, w, h, 22);
  g.fillStyle(shade, 1).fillRoundedRect(-w / 2, -h / 2 + 6, w, h, 22);
  g.fillStyle(color, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 22);
  g.fillStyle(0xffffff, 0.25).fillRoundedRect(-w / 2 + 10, -h / 2 + 6, w - 20, h * 0.35, 14);
  g.lineStyle(4, 0x3b2412, 1).strokeRoundedRect(-w / 2, -h / 2, w, h + 6, 22);
  c.add(g);
  let tx = 0;
  if (opts.icon) {
    const icon = scene.add.image(-w / 2 + h / 2 + 4, 0, opts.icon).setDisplaySize(h * 0.75, h * 0.75);
    c.add(icon);
    tx = h / 4;
  }
  const t = scene.add.text(tx, 0, label, textStyle(opts.fontSize ?? 34)).setOrigin(0.5);
  c.add(t);
  c.setSize(w, h + 6);
  c.setInteractive({ useHandCursor: true });
  c.on('pointerover', () => scene.tweens.add({ targets: c, scale: 1.06, duration: 120, ease: 'Back.out' }));
  c.on('pointerout', () => scene.tweens.add({ targets: c, scale: 1, duration: 120 }));
  c.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
    e?.stopPropagation();
    sfx.unlock();
    sfx.click();
    scene.tweens.add({ targets: c, scale: 0.94, duration: 70, yoyo: true, onComplete: onClick });
  });
  return c;
}

export function makeRoundButton(scene: Phaser.Scene, x: number, y: number, label: string, onClick: () => void, size = 64): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.25).fillCircle(3, 5, size / 2);
  g.fillStyle(0xffffff, 0.92).fillCircle(0, 0, size / 2);
  g.lineStyle(4, 0x3b2412, 1).strokeCircle(0, 0, size / 2);
  const t = scene.add.text(0, 1, label, { fontFamily: FONT, fontSize: `${Math.round(size * 0.5)}px`, color: '#3b2412' }).setOrigin(0.5);
  c.add([g, t]);
  c.setSize(size, size);
  c.setInteractive({ useHandCursor: true });
  c.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
    e?.stopPropagation();
    sfx.unlock();
    sfx.click();
    onClick();
  });
  c.setData('label', t);
  return c;
}

export function drawPanel(scene: Phaser.Scene, x: number, y: number, w: number, h: number, color = 0xfff6dc): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics({ x, y });
  g.fillStyle(0x000000, 0.3).fillRoundedRect(-w / 2 + 6, -h / 2 + 10, w, h, 30);
  g.fillStyle(color, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 30);
  g.lineStyle(6, 0x3b2412, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 30);
  g.lineStyle(3, 0xffffff, 0.6).strokeRoundedRect(-w / 2 + 10, -h / 2 + 10, w - 20, h - 20, 22);
  return g;
}
