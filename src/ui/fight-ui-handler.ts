import BattleScene from "../battle-scene";
import { addTextObject, TextStyle } from "./text";
import { getTypeDamageMultiplierColor, Type } from "../data/type";
import { Command } from "./command-ui-handler";
import { Mode } from "./ui";
import UiHandler from "./ui-handler";
import * as Utils from "../utils";
import { CommandPhase } from "../phases";
import { MoveCategory } from "#app/data/move.js";
import i18next from "../plugins/i18n";
import {Button} from "../enums/buttons";
import Pokemon, { PokemonMove } from "#app/field/pokemon.js";

export default class FightUiHandler extends UiHandler {
  private movesContainer: Phaser.GameObjects.Container;
  private typeIcon: Phaser.GameObjects.Sprite;
  private ppLabel: Phaser.GameObjects.Text;
  private ppText: Phaser.GameObjects.Text;
  private powerLabel: Phaser.GameObjects.Text;
  private powerText: Phaser.GameObjects.Text;
  private accuracyLabel: Phaser.GameObjects.Text;
  private accuracyText: Phaser.GameObjects.Text;
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

    this.typeIcon = this.scene.add.sprite((this.scene.game.canvas.width / 6) - 57, -36,`types${Utils.verifyLang(i18next.resolvedLanguage) ? `_${i18next.resolvedLanguage}` : ""}` , "unknown");
    this.typeIcon.setVisible(false);
    ui.add(this.typeIcon);

    this.moveCategoryIcon = this.scene.add.sprite((this.scene.game.canvas.width / 6) - 25, -36, "categories", "physical");
    this.moveCategoryIcon.setVisible(false);
    ui.add(this.moveCategoryIcon);

    this.ppLabel = addTextObject(this.scene, (this.scene.game.canvas.width / 6) - 70, -26, "PP", TextStyle.MOVE_INFO_CONTENT);
    this.ppLabel.setOrigin(0.0, 0.5);
    this.ppLabel.setVisible(false);
    this.ppLabel.setText(i18next.t("fightUiHandler:pp"));
    ui.add(this.ppLabel);

    this.ppText = addTextObject(this.scene, (this.scene.game.canvas.width / 6) - 12, -26, "--/--", TextStyle.MOVE_INFO_CONTENT);
    this.ppText.setOrigin(1, 0.5);
    this.ppText.setVisible(false);
    ui.add(this.ppText);

    this.powerLabel = addTextObject(this.scene, (this.scene.game.canvas.width / 6) - 70, -18, "POWER", TextStyle.MOVE_INFO_CONTENT);
    this.powerLabel.setOrigin(0.0, 0.5);
    this.powerLabel.setVisible(false);
    this.powerLabel.setText(i18next.t("fightUiHandler:power"));
    ui.add(this.powerLabel);

    this.powerText = addTextObject(this.scene, (this.scene.game.canvas.width / 6) - 12, -18, "---", TextStyle.MOVE_INFO_CONTENT);
    this.powerText.setOrigin(1, 0.5);
    this.powerText.setVisible(false);
    ui.add(this.powerText);

    this.accuracyLabel = addTextObject(this.scene, (this.scene.game.canvas.width / 6) - 70, -10, "ACC", TextStyle.MOVE_INFO_CONTENT);
    this.accuracyLabel.setOrigin(0.0, 0.5);
    this.accuracyLabel.setVisible(false);
    this.accuracyLabel.setText(i18next.t("fightUiHandler:accuracy"));
    ui.add(this.accuracyLabel);

    this.accuracyText = addTextObject(this.scene, (this.scene.game.canvas.width / 6) - 12, -10, "---", TextStyle.MOVE_INFO_CONTENT);
    this.accuracyText.setOrigin(1, 0.5);
    this.accuracyText.setVisible(false);
    ui.add(this.accuracyText);
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
        if ((this.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, cursor, false)) {
          success = true;
        } else {
          ui.playError();
        }
      } else {
        ui.setMode(Mode.COMMAND, this.fieldIndex);
        success = true;
      }
    } else {
      switch (button) {
      case Button.UP:
        if (cursor >= 2) {
          success = this.setCursor(cursor - 2);
        }
        break;
      case Button.DOWN:
        if (cursor < 2) {
          success = this.setCursor(cursor + 2);
        }
        break;
      case Button.LEFT:
        if (cursor % 2 === 1) {
          success = this.setCursor(cursor - 1);
        }
        break;
      case Button.RIGHT:
        if (cursor % 2 === 0) {
          success = this.setCursor(cursor + 1);
        }
        break;
      }
    }

    if (success) {
      ui.playSelect();
    }

    return success;
  }

  getCursor(): integer {
    return !this.fieldIndex ? this.cursor : this.cursor2;
  }

  setCursor(cursor: integer): boolean {
    const ui = this.getUi();

    const changed = this.getCursor() !== cursor;
    if (changed) {
      if (!this.fieldIndex) {
        this.cursor = cursor;
      } else {
        this.cursor2 = cursor;
      }
    }

    if (!this.cursorObj) {
      this.cursorObj = this.scene.add.image(0, 0, "cursor");
      ui.add(this.cursorObj);
    }

    const pokemon = (this.scene.getCurrentPhase() as CommandPhase).getPokemon();
    const moveset = pokemon.getMoveset();

    const hasMove = cursor < moveset.length;

    if (hasMove) {
      const pokemonMove = moveset[cursor];
      this.typeIcon.setTexture(`types${Utils.verifyLang(i18next.resolvedLanguage) ? `_${i18next.resolvedLanguage}` : ""}`, Type[pokemonMove.getMove().type].toLowerCase()).setScale(0.8);
      this.moveCategoryIcon.setTexture("categories", MoveCategory[pokemonMove.getMove().category].toLowerCase()).setScale(1.0);

      const power = pokemonMove.getMove().power;
      const accuracy = pokemonMove.getMove().accuracy;
      const maxPP = pokemonMove.getMovePp();
      const pp = maxPP - pokemonMove.ppUsed;

      this.ppText.setText(`${Utils.padInt(pp, 2, "  ")}/${Utils.padInt(maxPP, 2, "  ")}`);
      this.powerText.setText(`${power >= 0 ? power : "---"}`);
      this.accuracyText.setText(`${accuracy >= 0 ? accuracy : "---"}`);

      const ppPercentLeft = pp / maxPP;

      //** Determines TextStyle according to percentage of PP remaining */
      let ppColorStyle = TextStyle.MOVE_PP_FULL;
      if (ppPercentLeft > 0.25 && ppPercentLeft <= 0.5) {
        ppColorStyle = TextStyle.MOVE_PP_HALF_FULL;
      } else if (ppPercentLeft > 0 && ppPercentLeft <= 0.25) {
        ppColorStyle = TextStyle.MOVE_PP_NEAR_EMPTY;
      } else if (ppPercentLeft === 0) {
        ppColorStyle = TextStyle.MOVE_PP_EMPTY;
      }

      //** Changes the text color and shadow according to the determined TextStyle */
      this.ppText.setColor(this.getTextColor(ppColorStyle, false));
      this.ppText.setShadowColor(this.getTextColor(ppColorStyle, true));

      pokemon.getOpponents().forEach((opponent) => {
        opponent.updateEffectiveness(this.getEffectivenessText(pokemon, opponent, pokemonMove));
      });
    }

    this.typeIcon.setVisible(hasMove);
    this.ppLabel.setVisible(hasMove);
    this.ppText.setVisible(hasMove);
    this.powerLabel.setVisible(hasMove);
    this.powerText.setVisible(hasMove);
    this.accuracyLabel.setVisible(hasMove);
    this.accuracyText.setVisible(hasMove);
    this.moveCategoryIcon.setVisible(hasMove);

    this.cursorObj.setPosition(13 + (cursor % 2 === 1 ? 100 : 0), -31 + (cursor >= 2 ? 15 : 0));

    return changed;
  }

  /**
   * Gets multiplier text for a pokemon's move against a specific opponent
   * Returns undefined if it's a status move
   */
  private getEffectivenessText(pokemon: Pokemon, opponent: Pokemon, pokemonMove: PokemonMove): string | undefined {
    const effectiveness = opponent.getMoveEffectiveness(pokemon, pokemonMove);
    if (effectiveness === undefined) {
      return undefined;
    }

    return `${effectiveness}x`;
  }

  displayMoves() {
    const pokemon = (this.scene.getCurrentPhase() as CommandPhase).getPokemon();
    const moveset = pokemon.getMoveset();

    for (let moveIndex = 0; moveIndex < 4; moveIndex++) {
      const moveText = addTextObject(this.scene, moveIndex % 2 === 0 ? 0 : 100, moveIndex < 2 ? 0 : 16, "-", TextStyle.WINDOW);

      if (moveIndex < moveset.length) {
        const pokemonMove = moveset[moveIndex];
        moveText.setText(pokemonMove.getName());
        moveText.setColor(this.getMoveColor(pokemon, pokemonMove) ?? moveText.style.color);
      }

      this.movesContainer.add(moveText);
    }
  }

  /**
   * Returns a specific move's color based on its type effectiveness against opponents
   * If there are multiple opponents, the highest effectiveness' color is returned
   * @returns A color or undefined if the default color should be used
   */
  private getMoveColor(pokemon: Pokemon, pokemonMove: PokemonMove): string | undefined {
    if (!this.scene.typeHints) {
      return undefined;
    }

    const opponents = pokemon.getOpponents();
    if (opponents.length <= 0) {
      return undefined;
    }

    const moveColors = opponents.map((opponent) => {
      return opponent.getMoveEffectiveness(pokemon, pokemonMove);
    }).sort((a, b) => b - a).map((effectiveness) => {
      return getTypeDamageMultiplierColor(effectiveness, "offense");
    });

    return moveColors[0];
  }

  clear() {
    super.clear();
    this.clearMoves();
    this.typeIcon.setVisible(false);
    this.ppLabel.setVisible(false);
    this.ppText.setVisible(false);
    this.powerLabel.setVisible(false);
    this.powerText.setVisible(false);
    this.accuracyLabel.setVisible(false);
    this.accuracyText.setVisible(false);
    this.moveCategoryIcon.setVisible(false);
    this.eraseCursor();
  }

  clearMoves() {
    this.movesContainer.removeAll(true);

    const opponents = (this.scene.getCurrentPhase() as CommandPhase).getPokemon().getOpponents();
    opponents.forEach((opponent) => {
      opponent.updateEffectiveness(undefined);
    });
  }

  eraseCursor() {
    if (this.cursorObj) {
      this.cursorObj.destroy();
    }
    this.cursorObj = null;
  }
}
