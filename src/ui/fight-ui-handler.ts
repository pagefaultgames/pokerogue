import BattleScene from "../battle-scene";
import { addTextObject, TEXT_SCALE, TextStyle } from "./text";
import { Type, TypeDamageMultiplier } from "../data/type";
import { Command } from "./command-ui-handler";
import { Mode } from "./ui";
import UiHandler from "./ui-handler";
import * as Utils from "../utils";
import { CommandPhase } from "../phases";
import { MoveCategory } from "#app/data/move.js";
import i18next from '../plugins/i18n';
import {Button} from "../enums/buttons";
import Pokemon, { PokemonMove } from "#app/field/pokemon.js";

const rowSpacing = 8;

export default class FightUiHandler extends UiHandler {
  private movesContainer: Phaser.GameObjects.Container;
  private moveInfoContainer: Phaser.GameObjects.Container;
  private typeIcon: Phaser.GameObjects.Sprite;
  private ppText: Phaser.GameObjects.Text;
  private powerText: Phaser.GameObjects.Text;
  private accuracyText: Phaser.GameObjects.Text;
  private effectivenessLabel: Phaser.GameObjects.Text;
  private effectivenessText: Phaser.GameObjects.Text;
  private cursorObj: Phaser.GameObjects.Image;
  private moveCategoryIcon: Phaser.GameObjects.Sprite;

  protected fieldIndex: integer = 0;
  protected cursor2: integer = 0;

  constructor(scene: BattleScene) {
    super(scene, Mode.FIGHT);
  }

  setup() {
    const ui = this.getUi();

    this.movesContainer = this.scene.add.container(18, -38.7);
    ui.add(this.movesContainer);

    this.typeIcon = this.scene.add.sprite((this.scene.game.canvas.width / 6) - 57, -36, 'types', 'unknown');
    this.typeIcon.setVisible(false);
    ui.add(this.typeIcon);

    this.moveCategoryIcon = this.scene.add.sprite((this.scene.game.canvas.width / 6) - 25, -36, 'categories', 'physical');
    this.moveCategoryIcon.setVisible(false);
    ui.add(this.moveCategoryIcon);

    this.moveInfoContainer = this.scene.add.container((this.scene.game.canvas.width / 6) - 70, -26);
    this.moveInfoContainer.setVisible(false);
    ui.add(this.moveInfoContainer);

    const ppLabel = addTextObject(this.scene, 0, 0, 'PP', TextStyle.MOVE_INFO_CONTENT);
    ppLabel.setOrigin(0.0, 0.5);
    ppLabel.setText(i18next.t('fightUiHandler:pp'));
    this.moveInfoContainer.add(ppLabel);

    this.ppText = addTextObject(this.scene, 58, 0, '--/--', TextStyle.MOVE_INFO_CONTENT);
    this.ppText.setOrigin(1, 0.5);
    this.moveInfoContainer.add(this.ppText);

    const powerLabel = addTextObject(this.scene, 0, rowSpacing, 'POWER', TextStyle.MOVE_INFO_CONTENT);
    powerLabel.setOrigin(0.0, 0.5);
    powerLabel.setText(i18next.t('fightUiHandler:power'));
    this.moveInfoContainer.add(powerLabel);

    this.powerText = addTextObject(this.scene, 58, rowSpacing, '---', TextStyle.MOVE_INFO_CONTENT);
    this.powerText.setOrigin(1, 0.5);
    this.moveInfoContainer.add(this.powerText);

    const accuracyLabel = addTextObject(this.scene, 0, rowSpacing * 2, 'ACC', TextStyle.MOVE_INFO_CONTENT);
    accuracyLabel.setOrigin(0.0, 0.5);
    accuracyLabel.setText(i18next.t('fightUiHandler:accuracy'))
    this.moveInfoContainer.add(accuracyLabel);

    this.accuracyText = addTextObject(this.scene, 58, rowSpacing * 2, '---', TextStyle.MOVE_INFO_CONTENT);
    this.accuracyText.setOrigin(1, 0.5);
    this.moveInfoContainer.add(this.accuracyText);

    this.effectivenessLabel = addTextObject(this.scene, 0, rowSpacing * 3, 'EFFECT', TextStyle.MOVE_INFO_CONTENT);
    this.effectivenessLabel.setOrigin(0.0, 0.5);
    this.effectivenessLabel.setVisible(false);
    this.effectivenessLabel.setText(i18next.t('fightUiHandler:effect'))
    this.moveInfoContainer.add(this.effectivenessLabel);

    this.effectivenessText = addTextObject(this.scene, 58, rowSpacing * 3, '---', TextStyle.MOVE_INFO_CONTENT);
    this.effectivenessText.setOrigin(1, 0.5);
    this.effectivenessText.setVisible(false);
    this.moveInfoContainer.add(this.effectivenessText);
  }

  show(args: any[]): boolean {
    super.show(args);

    this.fieldIndex = args.length ? args[0] as integer : 0;

    const messageHandler = this.getUi().getMessageHandler();
    messageHandler.commandWindow.setVisible(false);
    messageHandler.movesWindowContainer.setVisible(true);
    this.setCursor(this.getCursor());
    this.displayMoves();

    return true;
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;

    const cursor = this.getCursor();

    if (button === Button.CANCEL || button === Button.ACTION) {
      if (button === Button.ACTION) {
        if ((this.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, cursor, false))
          success = true;
        else
          ui.playError();
      } else {
        ui.setMode(Mode.COMMAND, this.fieldIndex);
        success = true;
      }
    } else {
      switch (button) {
        case Button.UP:
          if (cursor >= 2)
            success = this.setCursor(cursor - 2);
          break;
        case Button.DOWN:
          if (cursor < 2)
            success = this.setCursor(cursor + 2);
          break;
        case Button.LEFT:
          if (cursor % 2 === 1)
            success = this.setCursor(cursor - 1);
          break;
        case Button.RIGHT:
          if (cursor % 2 === 0)
            success = this.setCursor(cursor + 1);
          break;
      }
    }

    if (success)
      ui.playSelect();

    return success;
  }

  getCursor(): integer {
    return !this.fieldIndex ? this.cursor : this.cursor2;
  }

  setCursor(cursor: integer): boolean {
    const ui = this.getUi();

    const changed = this.getCursor() !== cursor;
    if (changed) {
      if (!this.fieldIndex)
        this.cursor = cursor;
      else
        this.cursor2 = cursor;
    }

    if (!this.cursorObj) {
      this.cursorObj = this.scene.add.image(0, 0, 'cursor');
      ui.add(this.cursorObj);
    }

    const pokemon = (this.scene.getCurrentPhase() as CommandPhase).getPokemon();
    const moveset = pokemon.getMoveset();

    const hasMove = cursor < moveset.length;

    if (hasMove) {
      this.updateMoveInfoSize();

      const pokemonMove = moveset[cursor];
      this.typeIcon.setTexture('types', Type[pokemonMove.getMove().type].toLowerCase()).setScale(0.8);
      this.moveCategoryIcon.setTexture('categories', MoveCategory[pokemonMove.getMove().category].toLowerCase()).setScale(1.0);

      const power = pokemonMove.getMove().power;
      const accuracy = pokemonMove.getMove().accuracy;
      const maxPP = pokemonMove.getMovePp();
      const pp = maxPP - pokemonMove.ppUsed;
      const effectiveness = this.getEffectivenessText(pokemon, pokemonMove);

      this.ppText.setText(`${Utils.padInt(pp, 2, '  ')}/${Utils.padInt(maxPP, 2, '  ')}`);
      this.powerText.setText(`${power >= 0 ? power : '---'}`);
      this.accuracyText.setText(`${accuracy >= 0 ? accuracy : '---'}`);
      this.effectivenessText.setText(`${effectiveness ? effectiveness : '---'}`);
    }

    this.typeIcon.setVisible(hasMove);
    this.moveInfoContainer.setVisible(hasMove);
    this.effectivenessLabel.setVisible(this.scene.typeHints > 0);
    this.effectivenessText.setVisible(this.scene.typeHints > 0);
    this.moveCategoryIcon.setVisible(hasMove);

    this.cursorObj.setPosition(13 + (cursor % 2 === 1 ? 100 : 0), -31 + (cursor >= 2 ? 15 : 0));

    return changed;
  }

  private updateMoveInfoSize() {
    const typeHints = this.scene.typeHints > 0;
    const spacing = typeHints ? rowSpacing * 0.75 : rowSpacing;
    const scale = typeHints ? TEXT_SCALE * 0.75 : TEXT_SCALE;

    let row = 0;
    this.moveInfoContainer.getAll().forEach((object, index) => {
      const text = object as Phaser.GameObjects.Text;
      text.y = row * spacing;
      text.setScale(scale);

      if (index % 2 !== 0) row++;
    });
  }

  private getEffectivenessText(pokemon: Pokemon, pokemonMove: PokemonMove): string {
    const opponents = pokemon.getOpponents();
    if (opponents.length <= 0) return '';

    const text = opponents.map((opponent) => {
      return opponent.getMoveEffectiveness(pokemon, pokemonMove);
    }).filter((effectiveness) => effectiveness !== undefined).map((effectiveness) => {
      return `${effectiveness}x`;
    }).join('/');

    return text;
  }

  displayMoves() {
    const pokemon = (this.scene.getCurrentPhase() as CommandPhase).getPokemon();
    const moveset = pokemon.getMoveset();

    for (let moveIndex = 0; moveIndex < 4; moveIndex++) {
      const moveText = addTextObject(this.scene, moveIndex % 2 === 0 ? 0 : 100, moveIndex < 2 ? 0 : 16, '-', TextStyle.WINDOW);

      if (moveIndex < moveset.length) {
        const pokemonMove = moveset[moveIndex];
        moveText.setText(pokemonMove.getName());
        moveText.setColor(this.getMoveColor(pokemon, pokemonMove));
      }

      this.movesContainer.add(moveText);
    }
  }

  private getMoveColor(pokemon: Pokemon, pokemonMove: PokemonMove): string {
    if (this.scene.typeHints === 0) return 'white';

    const opponents = pokemon.getOpponents();
    if (opponents.length <= 0) return 'white';

    const moveColors = opponents.map((opponent) => {
      return opponent.getMoveEffectiveness(pokemon, pokemonMove);
    }).sort((a, b) => b - a).map((effectiveness) => {
      return this.getMoveEffectivenessColor(effectiveness);
    });

    return moveColors[0] ?? 'white';
  }

  private getMoveEffectivenessColor(moveEffectiveness?: TypeDamageMultiplier): string | undefined {
    switch (moveEffectiveness) {
      case 0:
        return 'black';
      case 0.125:
        return 'darkred';
      case 0.25:
        return 'red';
      case 0.5:
        return 'crimson';
      case 1:
        return 'white';
      case 2:
        return 'lightgreen';
      case 4:
        return 'green';
      case 8:
        return 'darkgreen';
    }
  }

  clear() {
    super.clear();
    this.clearMoves();
    this.typeIcon.setVisible(false);
    this.moveInfoContainer.setVisible(false);
    this.moveCategoryIcon.setVisible(false);
    this.eraseCursor();
  }

  clearMoves() {
    this.movesContainer.removeAll(true);
  }

  eraseCursor() {
    if (this.cursorObj)
      this.cursorObj.destroy();
    this.cursorObj = null;
  }
}