import MockContainer from "#app/test/essentials/mocksContainer/mockContainer";


export default class MockText extends MockContainer {
  constructor(scene, x, y, content, styleOptions) {
    super(scene, x, y);
  }

  runWordWrap(text) {
    // Runs word wrap logic on the given text.
    return new Phaser.GameObjects.Text(this.scene, 0, 0, text, this.style).runWordWrap(text);
  }

}
