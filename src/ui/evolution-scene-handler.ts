import BattleScene from "../battle-scene";
import { Mode } from "./ui";
import UiHandler from "./uiHandler";

export default class EvolutionSceneHandler extends UiHandler {
    public evolutionContainer: Phaser.GameObjects.Container;

    constructor(scene: BattleScene) {
      super(scene, Mode.EVOLUTION_SCENE);
    }
  
    setup() {
      this.evolutionContainer = this.scene.add.container(0, -this.scene.game.canvas.height / 6);
      this.scene.fieldUI.add(this.evolutionContainer);
    }
  
    processInput(keyCode: integer) {
      this.scene.ui.getMessageHandler().processInput(keyCode);
    }
  
    setCursor(_cursor: integer): boolean {
      return false;
    }

    clear() {
      this.evolutionContainer.removeAll(true);
    }
  }  