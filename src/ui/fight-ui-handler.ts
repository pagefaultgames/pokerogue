import BattleScene from "../battle-scene";
import { addTextObject, TextStyle } from "./text";
import { getTypeDamageMultiplierColor, Type } from "../data/type";
import { Command } from "./command-ui-handler";
import { Mode } from "./ui";
import UiHandler from "./ui-handler";
import * as Utils from "../utils";
import { MoveCategory } from "#app/data/move.js";
import i18next from "i18next";
import {Button} from "#enums/buttons";
import Pokemon, { PokemonMove } from "#app/field/pokemon.js";
import { CommandPhase } from "#app/phases/command-phase.js";

export default class FightUiHandler extends UiHandler {
  public static readonly MOVES_CONTAINER_NAME = "moves";

  private movesContainer: Phaser.GameObjects.Container;
  private moveInfoContainer: Phaser.GameObjects.Container;
  private typeIcon: Phaser.GameObjects.Sprite;
  private ppLabel: Phaser.GameObjects.Text;
  private ppText: Phaser.GameObjects.Text;
  private powerLabel: Phaser.GameObjects.Text;
  private powerText: Phaser.GameObjects.Text;
  private accuracyLabel: Phaser.GameObjects.Text;
  private accuracyText: Phaser.GameObjects.Text;
  private cursorObj: Phaser.GameObjects.Image | null;
  private moveCategoryIcon: Phaser.GameObjects.Sprite;

  protected fieldIndex: integer = 0;
  protected cursor2: integer = 0;

  constructor(scene: BattleScene) {
    super(scene, Mode.FIGHT);
  }

  setup() {
    const ui = this.getUi();

    this.movesContainer = this.scene.add.container(18, -38.7);
    this.movesContainer.setName(FightUiHandler.MOVES_CONTAINER_NAME);
    ui.add(this.movesContainer);

    this.moveInfoContainer = this.scene.add.container(1, 0);
    this.moveInfoContainer.setName("move-info");
    ui.add(this.moveInfoContainer);

    this.typeIcon = this.scene.add.sprite(this.scene.scaledCanvas.width - 57, -36, Utils.getLocalizedSpriteKey("types"), "unknown");
    this.typeIcon.setVisible(false);
    this.moveInfoContainer.add(this.typeIcon);

    this.moveCategoryIcon = this.scene.add.sprite(this.scene.scaledCanvas.width - 25, -36, "categories", "physical");
    this.moveCategoryIcon.setVisible(false);
    this.moveInfoContainer.add(this.moveCategoryIcon);

    this.ppLabel = addTextObject(this.scene, this.scene.scaledCanvas.width - 70, -26, "PP", TextStyle.MOVE_INFO_CONTENT);
    this.ppLabel.setOrigin(0.0, 0.5);
    this.ppLabel.setVisible(false);
    this.ppLabel.setText(i18next.t("fightUiHandler:pp"));
    this.moveInfoContainer.add(this.ppLabel);

    this.ppText = addTextObject(this.scene, this.scene.scaledCanvas.width - 12, -26, "--/--", TextStyle.MOVE_INFO_CONTENT);
    this.ppText.setOrigin(1, 0.5);
    this.ppText.setVisible(false);
    this.moveInfoContainer.add(this.ppText);

    this.powerLabel = addTextObject(this.scene, this.scene.scaledCanvas.width - 70, -18, "POWER", TextStyle.MOVE_INFO_CONTENT);
    this.powerLabel.setOrigin(0.0, 0.5);
    this.powerLabel.setVisible(false);
    this.powerLabel.setText(i18next.t("fightUiHandler:power"));
    this.moveInfoContainer.add(this.powerLabel);

    this.powerText = addTextObject(this.scene, this.scene.scaledCanvas.width - 12, -18, "---", TextStyle.MOVE_INFO_CONTENT);
    this.powerText.setOrigin(1, 0.5);
    this.powerText.setVisible(false);
    this.moveInfoContainer.add(this.powerText);

    this.accuracyLabel = addTextObject(this.scene, this.scene.scaledCanvas.width - 70, -10, "ACC", TextStyle.MOVE_INFO_CONTENT);
    this.accuracyLabel.setOrigin(0.0, 0.5);
    this.accuracyLabel.setVisible(false);
    this.accuracyLabel.setText(i18next.t("fightUiHandler:accuracy"));
    this.moveInfoContainer.add(this.accuracyLabel);

    this.accuracyText = addTextObject(this.scene, this.scene.scaledCanvas.width - 12, -10, "---", TextStyle.MOVE_INFO_CONTENT);
    this.accuracyText.setOrigin(1, 0.5);
    this.accuracyText.setVisible(false);
    this.moveInfoContainer.add(this.accuracyText);
  }

  show(args: any[]): boolean {
    super.show(args);

    this.fieldIndex = args.length ? args[0] as integer : 0;

    const messageHandler = this.getUi().getMessageHandler();
    messageHandler.bg.setVisible(false);
    messageHandler.commandWindow.setVisible(false);
    messageHandler.movesWindowContainer.setVisible(true);
    const pokemon = (this.scene.getCurrentPhase() as CommandPhase).getPokemon();
    if (pokemon.battleSummonData.turnCount <= 1) {
      this.setCursor(0);
    } else {
      this.setCursor(this.getCursor());
    }
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
      const pokemonMove = moveset[cursor]!; // TODO: is the bang correct?
      const moveType = pokemon.getMoveType(pokemonMove.getMove());
      const textureKey = Utils.getLocalizedSpriteKey("types");
      this.typeIcon.setTexture(textureKey, Type[moveType].toLowerCase()).setScale(0.8);

      const moveCategory = pokemonMove.getMove().category;
      this.moveCategoryIcon.setTexture("categories", MoveCategory[moveCategory].toLowerCase()).setScale(1.0);
      const power = pokemonMove.getMove().power;
      const accuracy = pokemonMove.getMove().accuracy;
      const maxPP = pokemonMove.getMovePp();
      const pp = maxPP - pokemonMove.ppUsed;

      const ppLeftStr = Utils.padInt(pp, 2, "  ");
      const ppMaxStr = Utils.padInt(maxPP, 2, "  ");
      this.ppText.setText(`${ppLeftStr}/${ppMaxStr}`);
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
    const effectiveness = opponent.getMoveEffectiveness(pokemon, pokemonMove.getMove(), !opponent.battleData?.abilityRevealed);
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
      moveText.setName("text-empty-move");

      if (moveIndex < moveset.length) {
        const pokemonMove = moveset[moveIndex]!; // TODO is the bang correct?
        moveText.setText(pokemonMove.getName());
        moveText.setName(pokemonMove.getName());
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

    const moveColors = opponents
      .map((opponent) => opponent.getMoveEffectiveness(pokemon, pokemonMove.getMove(), !opponent.battleData.abilityRevealed))
      .sort((a, b) => b - a)
      .map((effectiveness) => getTypeDamageMultiplierColor(effectiveness ?? 0, "offense"));

    return moveColors[0];
  }

  clear() {
    super.clear();
    const messageHandler = this.getUi().getMessageHandler();
    this.clearMoves();
    this.typeIcon.setVisible(false);
    this.ppLabel.setVisible(false);
    this.ppText.setVisible(false);
    this.powerLabel.setVisible(false);
    this.powerText.setVisible(false);
    this.accuracyLabel.setVisible(false);
    this.accuracyText.setVisible(false);
    this.moveCategoryIcon.setVisible(false);
    messageHandler.bg.setVisible(true);
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
