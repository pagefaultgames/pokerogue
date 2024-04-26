import { BattlerIndex } from "../battle";
import BattleScene, { Button } from "../battle-scene";
import { Moves } from "../data/enums/moves";
import { Mode } from "./ui";
import UiHandler from "./ui-handler";
import * as Utils from "../utils";
import { getMoveTargets } from "../data/move";
import FightUiHandler from "./fight-ui-handler";
import { CommandPhase } from "../phases.js";
import Pokemon from "../field/pokemon.js";

export type TargetSelectCallback = (cursor: integer) => void;

export default class TargetSelectUiHandler extends UiHandler {
  private move: Moves;
  private targetSelectCallback: TargetSelectCallback;
  private fightUiHandler: FightUiHandler;
  private cursorObj: Phaser.GameObjects.Image;
  protected fieldIndex: integer;
  protected cursor2: integer;

  private targets: BattlerIndex[];
  private targetFlashTween: Phaser.Tweens.Tween;

  constructor(scene: BattleScene) {
    super(scene, Mode.TARGET_SELECT);
    this.cursor = -1;
  }

  setup(): void {
    const ui = this.getUi();

    if (!this.cursorObj) {
      this.cursorObj = this.scene.add.image(0, 0, 'cursor');
      this.cursorObj.setVisible(false)
      ui.add(this.cursorObj);
    }
   }

  show(args: any[]): boolean {
    if (args.length < 3)
      return false;

    super.show(args);

    this.fieldIndex = args[0] as integer;
    this.move = args[1] as Moves;
    this.targetSelectCallback = args[2];

    if (this.scene.newEncounter===true){
      this.cursor=-1
    }

    this.targets = getMoveTargets(this.scene.getPlayerField()[this.fieldIndex], this.move).targets;

    const messageHandler = this.getUi().getMessageHandler();
    messageHandler.movesWindowContainer.setVisible(true); 

    this.fightUiHandler = this.getUi().getFightUiHandler();
    this.fightUiHandler.setVisible();
    this.displayCursor()

    if (!this.targets.length)
      return false;

    this.setCursor(this.targets.indexOf(this.cursor) > -1 ? this.cursor : this.targets[0]);
    const target = this.scene.getField()[this.cursor]
    this.showTargetEffectiveness(target);

    return true;
  }

  showTargetEffectiveness(target:Pokemon){
    const fieldPokemon = this.scene.getField();
    // Create a mapping from Pokemon name to action
    const actionMap = fieldPokemon.reduce((map, pokemon, index) => {
      map[pokemon.name] = () => {
        this.clearMoves();
        this.scene.selectedTarget = fieldPokemon[index];
        this.fightUiHandler.displayMoves(fieldPokemon[index], this.move);
      };
      return map;
    }, {});

    if (actionMap[target.name]) {
      actionMap[target.name]();
    }
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;
    
    if (button === Button.ACTION || button === Button.CANCEL) {
      this.targetSelectCallback(button === Button.ACTION ? this.cursor : -1);
      success = true;
    } else {
      switch (button) {
        case Button.UP:
          if (this.cursor < BattlerIndex.ENEMY && this.targets.findIndex(t => t >= BattlerIndex.ENEMY) > -1)
            success = this.setCursor(this.targets.find(t => t >= BattlerIndex.ENEMY));
          break;
        case Button.DOWN:
          if (this.cursor >= BattlerIndex.ENEMY && this.targets.findIndex(t => t < BattlerIndex.ENEMY) > -1)
            success = this.setCursor(this.targets.find(t => t < BattlerIndex.ENEMY));
          break;
        case Button.LEFT:
          if (this.cursor % 2 && this.targets.findIndex(t => t === this.cursor - 1) > -1)
            success = this.setCursor(this.cursor - 1);
          break;
        case Button.RIGHT:
          if (!(this.cursor % 2) && this.targets.findIndex(t => t === this.cursor + 1) > -1)
            success = this.setCursor(this.cursor + 1);
          break;
      }
    }

    if (success)
      ui.playSelect();

    return success;
  }

  setCursor(cursor: integer): boolean {
    const lastCursor = this.cursor;
    
    const ret = super.setCursor(cursor);

    if (this.targetFlashTween) {
      this.targetFlashTween.stop();
      const lastTarget = this.scene.getField()[lastCursor];
      if (lastTarget)
        lastTarget.setAlpha(1);
    }

    const target = this.scene.getField()[cursor];
    this.showTargetEffectiveness(target);
    
    this.targetFlashTween = this.scene.tweens.add({
      targets: [ target ],
      alpha: 0,
      loop: -1,
      duration: Utils.fixedInt(250),
      ease: 'Sine.easeIn',
      yoyo: true,
      onUpdate: t => {
        if (target)
          target.setAlpha(t.getValue());
      }
    });

    return ret;
  }

  eraseCursor() {
    const target = this.scene.getField()[this.cursor];
    if (this.targetFlashTween) {
      this.targetFlashTween.stop();
      this.targetFlashTween = null;
    }
    if (target)
      target.setAlpha(1);
  }

  clear() {
    super.clear();
    this.eraseCursor();
    this.clearMoves();
    this.fightUiHandler.clear()
    this.cursorObj.setVisible(false)
  }

  displayCursor() {
    const moveset = (this.scene.getCurrentPhase() as CommandPhase).getPokemon().getMoveset();

    for (let m = 0; m < moveset.length; m++) {
      const pokemonMove = moveset[m];
      if (pokemonMove.moveId===this.move) {
        this.cursorObj.setPosition(13 + (m % 2 === 1 ? 100 : 0), -31 + (m >= 2 ? 15 : 0));
        this.cursorObj.setVisible(true)
      }
    }
  }

  clearMoves() {
    this.fightUiHandler.clearMoves()
  }
}