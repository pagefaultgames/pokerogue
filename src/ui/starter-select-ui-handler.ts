import BattleScene, { Button } from "../battle-scene";
import { allSpecies } from "../pokemon-species";
import { Mode } from "./ui";
import UiHandler from "./uiHandler";

export default class StarterSelectUiHandler extends UiHandler {
    private starterSelectContainer: Phaser.GameObjects.Container;
  
    constructor(scene: BattleScene) {
      super(scene, Mode.STARTER_SELECT);
    }
  
    setup() {
      const ui = this.getUi();
  
      this.starterSelectContainer = this.scene.add.container(0, -this.scene.game.canvas.height / 6);
      this.starterSelectContainer.setVisible(false);
      ui.add(this.starterSelectContainer);

      let s = 0;

      for (let species of allSpecies) {
        if (species.getSpeciesForLevel(1) !== species.speciesId || species.generation >= 6)
          continue;
        species.generateIconAnim(this.scene);
        const x = (s % 24) * 13;
        const y = Math.floor(s / 24) * 13;
        const icon = this.scene.add.sprite(x, y, species.getIconAtlasKey());
        icon.setScale(0.5);
        icon.setOrigin(0, 0);
        icon.play(species.getIconKey()).stop();
        this.starterSelectContainer.add(icon);
        s++;
      }
    }
  
    show(args: any[]) {
      super.show(args);

      this.starterSelectContainer.setVisible(true);
      this.setCursor(0);
    }
  
    processInput(button: Button) {
      const ui = this.getUi();

      let success = false;
  
      if (button === Button.ACTION) {
      } else if (button === Button.CANCEL) {
      } else {
      }
    
      if (success)
        ui.playSelect();
    }
  
    setCursor(cursor: integer): boolean {
      let changed: boolean = this.cursor !== cursor;

      if (changed) {
        const forward = this.cursor < cursor;
        this.cursor = cursor;
      }
  
      return changed;
    }
  
    clear() {
      super.clear();
      this.cursor = -1;
      this.starterSelectContainer.setVisible(false);
    }
  }  