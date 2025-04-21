import { addTextObject, TextStyle } from "./text";
import PartyUiHandler, { PartyUiMode } from "./party-ui-handler";
import { UiMode } from "#enums/ui-mode";
import UiHandler from "./ui-handler";
import i18next from "i18next";
import { Button } from "#enums/buttons";
import { getPokemonNameWithAffix } from "#app/messages";
import { CommandPhase } from "#app/phases/command-phase";
import { globalScene } from "#app/global-scene";
import { TerastallizeAccessModifier } from "#app/modifier/modifier";
import { PokemonType } from "#enums/pokemon-type";
import { getTypeRgb } from "#app/data/type";
import { Species } from "#enums/species";

export enum Command {
  FIGHT = 0,
  BALL,
  POKEMON,
  RUN,
  TERA,
}

export default class CommandUiHandler extends UiHandler {
  private commandsContainer: Phaser.GameObjects.Container;
  private cursorObj: Phaser.GameObjects.Image | null;

  private teraButton: Phaser.GameObjects.Sprite;

  protected fieldIndex = 0;
  protected cursor2 = 0;

  constructor() {
    super(UiMode.COMMAND);
  }

  setup() {
    const ui = this.getUi();
    const commands = [
      i18next.t("commandUiHandler:fight"),
      i18next.t("commandUiHandler:ball"),
      i18next.t("commandUiHandler:pokemon"),
      i18next.t("commandUiHandler:run"),
    ];

    this.commandsContainer = globalScene.add.container(217, -38.7);
    this.commandsContainer.setName("commands");
    this.commandsContainer.setVisible(false);
    ui.add(this.commandsContainer);

    this.teraButton = globalScene.add.sprite(-32, 15, "button_tera");
    this.teraButton.setName("terrastallize-button");
    this.teraButton.setScale(1.3);
    this.teraButton.setFrame("fire");
    this.teraButton.setPipeline(globalScene.spritePipeline, {
      tone: [0.0, 0.0, 0.0, 0.0],
      ignoreTimeTint: true,
      teraColor: getTypeRgb(PokemonType.FIRE),
      isTerastallized: false,
    });
    this.commandsContainer.add(this.teraButton);

    for (let c = 0; c < commands.length; c++) {
      const commandText = addTextObject(c % 2 === 0 ? 0 : 55.8, c < 2 ? 0 : 16, commands[c], TextStyle.WINDOW);
      commandText.setName(commands[c]);
      this.commandsContainer.add(commandText);
    }
  }

  show(args: any[]): boolean {
    super.show(args);

    this.fieldIndex = args.length ? (args[0] as number) : 0;

    this.commandsContainer.setVisible(true);

    let commandPhase: CommandPhase;
    const currentPhase = globalScene.getCurrentPhase();
    if (currentPhase instanceof CommandPhase) {
      commandPhase = currentPhase;
    } else {
      commandPhase = globalScene.getStandbyPhase() as CommandPhase;
    }

    if (this.canTera()) {
      this.teraButton.setVisible(true);
      this.teraButton.setFrame(PokemonType[globalScene.getField()[this.fieldIndex].getTeraType()].toLowerCase());
    } else {
      this.teraButton.setVisible(false);
      if (this.cursor === Command.TERA) {
        this.setCursor(Command.FIGHT);
      }
    }
    this.toggleTeraButton();

    const messageHandler = this.getUi().getMessageHandler();
    messageHandler.bg.setVisible(true);
    messageHandler.commandWindow.setVisible(true);
    messageHandler.movesWindowContainer.setVisible(false);
    messageHandler.message.setWordWrapWidth(this.canTera() ? 910 : 1110);
    messageHandler.showText(
      i18next.t("commandUiHandler:actionMessage", {
        pokemonName: getPokemonNameWithAffix(commandPhase.getPokemon()),
      }),
      0,
    );
    if (this.getCursor() === Command.POKEMON) {
      this.setCursor(Command.FIGHT);
    } else {
      this.setCursor(this.getCursor());
    }

    return true;
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;

    const cursor = this.getCursor();

    if (button === Button.CANCEL || button === Button.ACTION) {
      if (button === Button.ACTION) {
        switch (cursor) {
          // Fight
          case Command.FIGHT:
            ui.setMode(UiMode.FIGHT, (globalScene.getCurrentPhase() as CommandPhase).getFieldIndex());
            success = true;
            break;
          // Ball
          case Command.BALL:
            ui.setModeWithoutClear(UiMode.BALL);
            success = true;
            break;
          // Pokemon
          case Command.POKEMON:
            ui.setMode(
              UiMode.PARTY,
              PartyUiMode.SWITCH,
              (globalScene.getCurrentPhase() as CommandPhase).getPokemon().getFieldIndex(),
              null,
              PartyUiHandler.FilterNonFainted,
            );
            success = true;
            break;
          // Run
          case Command.RUN:
            (globalScene.getCurrentPhase() as CommandPhase).handleCommand(Command.RUN, 0);
            success = true;
            break;
          case Command.TERA:
            ui.setMode(UiMode.FIGHT, (globalScene.getCurrentPhase() as CommandPhase).getFieldIndex(), Command.TERA);
            success = true;
            break;
        }
      } else {
        (globalScene.getCurrentPhase() as CommandPhase).cancel();
      }
    } else {
      switch (button) {
        case Button.UP:
          if (cursor === Command.POKEMON || cursor === Command.RUN) {
            success = this.setCursor(cursor - 2);
          }
          break;
        case Button.DOWN:
          if (cursor === Command.FIGHT || cursor === Command.BALL) {
            success = this.setCursor(cursor + 2);
          }
          break;
        case Button.LEFT:
          if (cursor === Command.BALL || cursor === Command.RUN) {
            success = this.setCursor(cursor - 1);
          } else if ((cursor === Command.FIGHT || cursor === Command.POKEMON) && this.canTera()) {
            success = this.setCursor(Command.TERA);
            this.toggleTeraButton();
          }
          break;
        case Button.RIGHT:
          if (cursor === Command.FIGHT || cursor === Command.POKEMON) {
            success = this.setCursor(cursor + 1);
          } else if (cursor === Command.TERA) {
            success = this.setCursor(Command.FIGHT);
            this.toggleTeraButton();
          }
          break;
      }
    }

    if (success) {
      ui.playSelect();
    }

    return success;
  }

  canTera(): boolean {
    const hasTeraMod = !!globalScene.getModifiers(TerastallizeAccessModifier).length;
    const activePokemon = globalScene.getField()[this.fieldIndex];
    const isBlockedForm =
      activePokemon.isMega() || activePokemon.isMax() || activePokemon.hasSpecies(Species.NECROZMA, "ultra");
    const currentTeras = globalScene.arena.playerTerasUsed;
    const plannedTera =
      globalScene.currentBattle.preTurnCommands[0]?.command === Command.TERA && this.fieldIndex > 0 ? 1 : 0;
    return hasTeraMod && !isBlockedForm && currentTeras + plannedTera < 1;
  }

  toggleTeraButton() {
    this.teraButton.setPipeline(globalScene.spritePipeline, {
      tone: [0.0, 0.0, 0.0, 0.0],
      ignoreTimeTint: true,
      teraColor: getTypeRgb(globalScene.getField()[this.fieldIndex].getTeraType()),
      isTerastallized: this.getCursor() === Command.TERA,
    });
  }

  getCursor(): number {
    return !this.fieldIndex ? this.cursor : this.cursor2;
  }

  setCursor(cursor: number): boolean {
    const changed = this.getCursor() !== cursor;
    if (changed) {
      if (!this.fieldIndex) {
        this.cursor = cursor;
      } else {
        this.cursor2 = cursor;
      }
    }

    if (!this.cursorObj) {
      this.cursorObj = globalScene.add.image(0, 0, "cursor");
      this.commandsContainer.add(this.cursorObj);
    }

    if (cursor === Command.TERA) {
      this.cursorObj.setVisible(false);
    } else {
      this.cursorObj.setPosition(-5 + (cursor % 2 === 1 ? 56 : 0), 8 + (cursor >= 2 ? 16 : 0));
      this.cursorObj.setVisible(true);
    }

    return changed;
  }

  clear(): void {
    super.clear();
    this.getUi().getMessageHandler().commandWindow.setVisible(false);
    this.commandsContainer.setVisible(false);
    this.getUi().getMessageHandler().clearText();
    this.eraseCursor();
  }

  eraseCursor(): void {
    if (this.cursorObj) {
      this.cursorObj.destroy();
    }
    this.cursorObj = null;
  }
}
