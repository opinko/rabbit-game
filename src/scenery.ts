import Phaser from 'phaser';
import { FIELD_TOP, GAME_H, GAME_W } from './config';

/** Parallax farm background shared by the menu and the game. */
export class Scenery {
  private sun: Phaser.GameObjects.Image;
  private clouds: Phaser.GameObjects.Image[] = [];
  private hillsFar: Phaser.GameObjects.TileSprite;
  private hillsNear: Phaser.GameObjects.TileSprite;
  private wheat: Phaser.GameObjects.TileSprite;
  private stubble: Phaser.GameObjects.TileSprite;
  private field: Phaser.GameObjects.TileSprite;
  private scroll = 0;

  constructor(scene: Phaser.Scene) {
    scene.add.image(0, 0, 'sky').setOrigin(0).setDisplaySize(GAME_W, GAME_H).setDepth(-100);
    this.sun = scene.add.image(1080, 100, 'sun_rays').setDepth(-95).setScale(0.85);
    scene.add.image(1080, 100, 'sun').setDepth(-95).setScale(0.85);
    for (let i = 0; i < 5; i++) {
      const c = scene.add
        .image(Phaser.Math.Between(0, GAME_W), Phaser.Math.Between(40, 170), 'cloud')
        .setScale(Phaser.Math.FloatBetween(0.45, 0.9))
        .setAlpha(0.95)
        .setDepth(-94);
      c.setData('speed', Phaser.Math.FloatBetween(0.03, 0.08));
      this.clouds.push(c);
    }
    this.hillsFar = scene.add.tileSprite(0, FIELD_TOP - 240 + 40, GAME_W, 240, 'hills_far').setOrigin(0).setDepth(-90);
    this.hillsNear = scene.add.tileSprite(0, FIELD_TOP - 200 + 30, GAME_W, 200, 'hills_near').setOrigin(0).setDepth(-85);
    this.field = scene.add.tileSprite(0, FIELD_TOP, GAME_W, GAME_H - FIELD_TOP, 'field').setOrigin(0).setDepth(-80);
    this.stubble = scene.add.tileSprite(0, FIELD_TOP - 78, GAME_W, 100, 'stubble').setOrigin(0).setDepth(-79);
    this.wheat = scene.add.tileSprite(0, FIELD_TOP - 78, GAME_W, 100, 'wheat').setOrigin(0).setDepth(-78);
  }

  /**
   * @param dx world pixels scrolled this frame
   * @param cutX screen x left of which the wheat is already harvested
   */
  update(dx: number, dt: number, cutX: number): void {
    this.scroll += dx;
    this.field.tilePositionX = this.scroll;
    this.stubble.tilePositionX = this.scroll;
    this.hillsNear.tilePositionX = this.scroll * 0.3;
    this.hillsFar.tilePositionX = this.scroll * 0.12;
    this.sun.rotation += dt * 0.1;
    const cx = Phaser.Math.Clamp(cutX, 0, GAME_W);
    this.wheat.x = cx;
    this.wheat.setSize(Math.max(1, GAME_W - cx), 100);
    this.wheat.tilePositionX = this.scroll + cx;
    this.wheat.setVisible(cx < GAME_W);
    for (const c of this.clouds) {
      c.x -= (dx * c.getData('speed') + dt * 8);
      if (c.x < -150) {
        c.x = GAME_W + 150;
        c.y = Phaser.Math.Between(40, 170);
      }
    }
  }
}
