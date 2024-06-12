import MockContainer from "#app/test/utils/mocks/mocksContainer/mockContainer";
import MockSprite from "#app/test/utils/mocks/mocksContainer/mockSprite";
import MockRectangle from "#app/test/utils/mocks/mocksContainer/mockRectangle";
import MockNineslice from "#app/test/utils/mocks/mocksContainer/mockNineslice";
import MockImage from "#app/test/utils/mocks/mocksContainer/mockImage";
import MockText from "#app/test/utils/mocks/mocksContainer/mockText";
import MockPolygon from "#app/test/utils/mocks/mocksContainer/mockPolygon";


export default class MockTextureManager {
  private textures: Map<string, any>;
  private scene;
  public add;
  public displayList;
  public list = [];

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
    };
  }

  container(x, y) {
    const container = new MockContainer(this, x, y);
    this.list.push(container);
    return container;
  }

  sprite(x,y, texture) {
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
