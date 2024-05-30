import MockContainer from "#app/test/essentials/mocksContainer/mockContainer";
import MockSprite from "#app/test/essentials/mocksContainer/mockSprite";
import MockRectangle from "#app/test/essentials/mocksContainer/mockRectangle";
import MockNineslice from "#app/test/essentials/mocksContainer/mockNineslice";
import MockImage from "#app/test/essentials/mocksContainer/mockImage";
import MockText from "#app/test/essentials/mocksContainer/mockText";
import MockPolygon from "#app/test/essentials/mocksContainer/mockPolygon";


export default class MockTextureManager {
  private textures: Map<string, any>;
  private scene;
  public add;
  public displayList;
  public containers = [];

  constructor(scene) {
    this.scene = scene;
    this.textures = new Map();
    this.displayList = new Phaser.GameObjects.DisplayList(scene);
    this.add = {
      container: this.container.bind(this),
      sprite: this.sprite.bind(this),
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
    return new MockContainer(this, x, y);
  }

  sprite(x,y, texture) {
    return new MockSprite(this, x, y, texture);
  }

  existing(obj) {
    // const whitelist = ["ArenaBase", "PlayerPokemon", "EnemyPokemon"];
    // const key = obj.constructor.name;
    // if (whitelist.includes(key) || obj.texture?.key?.includes("trainer_")) {
    //   this.containers.push(obj);
    // }
  }

  rectangle(x, y, width, height, fillColor) {
    return new MockRectangle(this, x, y, width, height, fillColor);
  }

  nineslice(x, y, texture, frame, width, height, leftWidth, rightWidth, topHeight, bottomHeight) {
    return new MockNineslice(this, x, y, texture, frame, width, height, leftWidth, rightWidth, topHeight, bottomHeight);
  }

  image(x, y, texture) {
    return new MockImage(this, x, y, texture);
  }

  text(x, y, content, styleOptions) {
    return new MockText(this, x, y, content, styleOptions);
  }

  polygon(x, y, content, fillColor, fillAlpha) {
    return new MockPolygon(this, x, y, content, fillColor, fillAlpha);
  }
}
