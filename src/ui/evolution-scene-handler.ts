import BattleScene, { Button } from "../battle-scene";
import { Mode } from "./ui";
import UiHandler from "./uiHandler";

export default class EvolutionSceneHandler extends UiHandler {
    public evolutionContainer: Phaser.GameObjects.Container;
    public canCancel: boolean;
    public cancelled: boolean;

    constructor(scene: BattleScene) {
      super(scene, Mode.EVOLUTION_SCENE);
    }
  
    setup() {
      this.canCancel = false;
      this.cancelled = false;

      this.evolutionContainer = this.scene.add.container(0, -this.scene.game.canvas.height / 6);
      this.scene.fieldUI.add(this.evolutionContainer);
    }

    show(_args: any[]): void {
      super.show(_args);
      
      this.scene.fieldUI.bringToTop(this.evolutionContainer);
    }
  
    processInput(button: Button): boolean {
      if (this.canCancel && !this.cancelled && button === Button.CANCEL) {
        this.cancelled = true;
        return true;
      }

      return this.scene.ui.getMessageHandler().processInput(button);
    }
  
    setCursor(_cursor: integer): boolean {
      return false;
    }

    clear() {
      this.canCancel = false;
      this.cancelled = false;
      this.evolutionContainer.removeAll(true);
    }
  }  