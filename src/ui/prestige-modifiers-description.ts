import BattleScene from "../battle-scene";
import { TextStyle, addTextObject } from "./text";
import { WindowVariant, addWindow } from "./ui-theme";
import { Prestige } from "#app/system/prestige";


export class PrestigeModifiersDescription extends Phaser.GameObjects.Container {
  private descriptionContainer: Phaser.GameObjects.Container;
  private prestigeLevel: number;

  constructor(scene: BattleScene, x: number, y: number) {
    super(scene, x, y);

    this.setup();
  }

  setup() {
    const window = addWindow(this.scene, 5, 5, 200, 118, false, false, null, null, WindowVariant.THIN);
    this.add(window);

    this.descriptionContainer = this.scene.add.container(15, 15);
    this.add(this.descriptionContainer);
  }

  updateContent(prestigeLevel: number): void {
    if (prestigeLevel === undefined) {
      return;
    }
    this.prestigeLevel = prestigeLevel;
    if (this.prestigeLevel === 0) {
      this.descriptionContainer.removeAll(true);
      this.descriptionContainer.add(addTextObject(this.scene, 0, 0, "No modifiers", TextStyle.WINDOW, { fontSize: "74px" }));
      return;
    }
    const descriptions = Prestige.getLevelDescriptionsUntil(prestigeLevel);
    this.descriptionContainer.removeAll(true);
    if (descriptions.length === 0) {
      this.descriptionContainer.add(addTextObject(this.scene, 0, 0, "No modifiers", TextStyle.WINDOW, { fontSize: "74px" }));
      return;
    }
    descriptions.forEach((d: string, i: integer) => {
      const text = addTextObject(this.scene, 0, i * 9, d, TextStyle.WINDOW, { fontSize: "74px" });
      this.descriptionContainer.add(text);
    });
  }
}

export interface PrestigeModifiersDescription {
  scene: BattleScene
}
