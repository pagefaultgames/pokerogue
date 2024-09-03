import MockContainer from "#test/utils/mocks/mocksContainer/mockContainer";
import MockImage from "#test/utils/mocks/mocksContainer/mockImage";
import MockNineslice from "#test/utils/mocks/mocksContainer/mockNineslice";
import MockPolygon from "#test/utils/mocks/mocksContainer/mockPolygon";
import MockRectangle from "#test/utils/mocks/mocksContainer/mockRectangle";
import MockSprite from "#test/utils/mocks/mocksContainer/mockSprite";
import MockText from "#test/utils/mocks/mocksContainer/mockText";
import MockTexture from "#test/utils/mocks/mocksContainer/mockTexture";
import { MockGameObject } from "./mockGameObject";
import { vi } from "vitest";
import { MockVideoGameObject } from "./mockVideoGameObject";

/**
 * Stub class for Phaser.Textures.TextureManager
 */
export default class MockTextureManager {
  private textures: Map<string, any>;
  private scene;
  public add;
  public displayList;
  public list: MockGameObject[] = [];

  constructor(scene) {
    this.scene = scene;
    this.textures = new Map();
    this.displayList = new Phaser.GameObjects.DisplayList(scene);
    this.add = {
      container: this.container.bind(this),
      sprite: this.sprite.bind(this),
      tileSprite: this.sprite.bind(this),
      existing: this.existing.bind(this),
      rectangle: this.rectangle.bind(this),
      nineslice: this.nineslice.bind(this),
      image: this.image.bind(this),
      polygon: this.polygon.bind(this),
      text: this.text.bind(this),
      bitmapText: this.text.bind(this),
      displayList: this.displayList,
      video: vi.fn(() => new MockVideoGameObject()),
    };
  }

  container(x, y) {
    const container = new MockContainer(this, x, y);
    this.list.push(container);
    return container;
  }

  sprite(x, y, texture) {
    const sprite = new MockSprite(this, x, y, texture);
    this.list.push(sprite);
    return sprite;
  }

  existing(obj) {
    // const whitelist = ["ArenaBase", "PlayerPokemon", "EnemyPokemon"];
    // const key = obj.constructor.name;
    // if (whitelist.includes(key) || obj.texture?.key?.includes("trainer_")) {
    //   this.containers.push(obj);
    // }
  }

  /**
   * Returns a mock texture
   * @param key
   */
  get(key) {
    return new MockTexture(this, key, null);
  }

  rectangle(x, y, width, height, fillColor) {
    const rectangle = new MockRectangle(this, x, y, width, height, fillColor);
    this.list.push(rectangle);
    return rectangle;
  }

  nineslice(x, y, texture, frame, width, height, leftWidth, rightWidth, topHeight, bottomHeight) {
    const nineSlice = new MockNineslice(this, x, y, texture, frame, width, height, leftWidth, rightWidth, topHeight, bottomHeight);
    this.list.push(nineSlice);
    return nineSlice;
  }

  image(x, y, texture) {
    const image = new MockImage(this, x, y, texture);
    this.list.push(image);
    return image;
  }

  text(x, y, content, styleOptions) {
    const text = new MockText(this, x, y, content, styleOptions);
    this.list.push(text);
    return text;
  }

  polygon(x, y, content, fillColor, fillAlpha) {
    const polygon = new MockPolygon(this, x, y, content, fillColor, fillAlpha);
    this.list.push(polygon);
    return polygon;
  }
}
