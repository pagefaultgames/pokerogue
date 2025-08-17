import type { MockGameObject } from "#test/test-utils/mocks/mock-game-object";
import { coerceArray } from "#utils/common";

export class MockRectangle implements MockGameObject {
  private fillColor;
  private scene;
  public list: MockGameObject[] = [];
  public name: string;
  public active = true;

  constructor(textureManager, _x, _y, _width, _height, fillColor) {
    this.fillColor = fillColor;
    this.scene = textureManager.scene;
  }
  setOrigin(_x, _y): this {
    return this;
  }

  setAlpha(_alpha): this {
    return this;
  }
  setVisible(_visible): this {
    return this;
  }

  setName(_name): this {
    return this;
  }

  once(_event, _callback, _source): this {
    return this;
  }

  removeFromDisplayList(): this {
    // same as remove or destroy
    return this;
  }

  addedToScene() {
    // This callback is invoked when this Game Object is added to a Scene.
  }

  setPositionRelative(_source, _x, _y): this {
    /// Sets the position of this Game Object to be a relative position from the source Game Object.
    return this;
  }

  destroy() {
    this.list = [];
  }

  add(obj: MockGameObject | MockGameObject[]): this {
    // Adds a child to this Game Object.
    this.list.push(...coerceArray(obj));
    return this;
  }

  removeAll() {
    // Removes all Game Objects from this Container.
    this.list = [];
  }

  addAt(obj, index): this {
    // Adds a Game Object to this Container at the given index.
    this.list.splice(index, 0, obj);
    return this;
  }

  remove(obj): this {
    const index = this.list.indexOf(obj);
    if (index !== -1) {
      this.list.splice(index, 1);
    }
    return this;
  }

  getIndex(obj) {
    const index = this.list.indexOf(obj);
    return index || -1;
  }

  getAt(index) {
    return this.list[index];
  }

  getAll() {
    return this.list;
  }
  setScale(_scale): this {
    // return this.phaserText.setScale(scale);
    return this;
  }

  off(): this {
    return this;
  }

  setActive(active: boolean): this {
    this.active = active;
    return this;
  }
}
