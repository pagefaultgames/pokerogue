import { MAX_TERAS_PER_ARENA } from "#app/constants";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { getPokeballName } from "#data/pokeball";
import { getTypeRgb } from "#data/type";
import { BattleType } from "#enums/battle-type";
import { Button } from "#enums/buttons";
import { Command } from "#enums/command";
import { PokemonType } from "#enums/pokemon-type";
import { TextStyle } from "#enums/text-style";
import { UiMode } from "#enums/ui-mode";
import type { CommandPhase } from "#phases/command-phase";
import { SettingKeyboard } from "#system/settings-keyboard";
import { PartyUiHandler, PartyUiMode } from "#ui/party-ui-handler";
import { addTextObject } from "#ui/text";
import { UiHandler } from "#ui/ui-handler";
import { canTerastallize } from "#utils/pokemon-utils";
import i18next from "i18next";

const OPTION_BUTTON_YPOSITION = -62;

export class CommandUiHandler extends UiHandler {
  private throwBallTextContainer: Phaser.GameObjects.Container;
  private throwBallText: Phaser.GameObjects.Text;
  private restartBattleTextContainer: Phaser.GameObjects.Container;
  private restartBattleText: Phaser.GameObjects.Text;
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
    this.teraButton.setName("terastallize-button");
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
      const commandText = addTextObject(
        c % 2 === 0 ? 0 : 55.8,
        c < 2 ? 0 : 16,
        commands[c],
        TextStyle.WINDOW_BATTLE_COMMAND,
      );
      commandText.setName(commands[c]);
      this.commandsContainer.add(commandText);
    }

    this.throwBallTextContainer = globalScene.add.container(16, OPTION_BUTTON_YPOSITION);
    this.throwBallTextContainer.setName("throwBall-txt");
    this.throwBallTextContainer.setVisible(false);
    ui.add(this.throwBallTextContainer);

    const throwBallKey = globalScene.enableHotkeyTips
      ? ""
      : globalScene.inputController?.getKeyForLatestInputRecorded(SettingKeyboard.Button_Cycle_Shiny)
        ? `(${globalScene.inputController?.getKeyForLatestInputRecorded(SettingKeyboard.Button_Cycle_Shiny)}) `
        : "";
    const lastPokeball =
      " "
      + getPokeballName(globalScene.lastPokeballType)
      + " x"
      + globalScene.pokeballCounts[globalScene.lastPokeballType];
    this.throwBallText = addTextObject(
      -4,
      -2,
      i18next.t("commandUiHandler:throwBall", { throwBallKey, lastPokeball }),
      TextStyle.PARTY,
    );
    this.throwBallText.setName("text-reroll-btn");
    this.throwBallText.setOrigin(0, 0);
    this.throwBallTextContainer.add(this.throwBallText);

    this.restartBattleTextContainer = globalScene.add.container(16, OPTION_BUTTON_YPOSITION);
    this.restartBattleTextContainer.setVisible(false);
    ui.add(this.restartBattleTextContainer);

    const retryBattleKey = globalScene.enableHotkeyTips
      ? ""
      : globalScene.inputController?.getKeyForLatestInputRecorded(SettingKeyboard.Button_Cycle_Ability)
        ? `(${globalScene.inputController?.getKeyForLatestInputRecorded(SettingKeyboard.Button_Cycle_Ability)}) `
        : "";
    this.restartBattleText = addTextObject(
      -4,
      -2,
      i18next.t("commandUiHandler:retryBattle", { retryBattleKey }),
      TextStyle.PARTY,
    );
    this.restartBattleText.setOrigin(0, 0);
    this.restartBattleTextContainer.add(this.restartBattleText);
  }

  show(args: any[]): boolean {
    super.show(args);
    this.fieldIndex = args.length > 0 ? (args[0] as number) : 0;

    this.commandsContainer.setVisible(true);
    this.updateTipsText();

    let commandPhase: CommandPhase;
    const currentPhase = globalScene.phaseManager.getCurrentPhase();
    if (currentPhase.is("CommandPhase")) {
      commandPhase = currentPhase;
    } else {
      commandPhase = globalScene.phaseManager.getStandbyPhase() as CommandPhase;
    }

    if (this.canTera()) {
      this.teraButton.setVisible(true);
      this.teraButton.setFrame(PokemonType[globalScene.getField()[this.fieldIndex].getTeraType()].toLowerCase());
    } else {
      this.teraButton.setVisible(false);
      if (this.getCursor() === Command.TERA) {
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
            ui.setMode(UiMode.FIGHT, (globalScene.phaseManager.getCurrentPhase() as CommandPhase).getFieldIndex());
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
              (globalScene.phaseManager.getCurrentPhase() as CommandPhase).getPokemon().getFieldIndex(),
              null,
              PartyUiHandler.FilterNonFainted,
            );
            success = true;
            break;
          // Run
          case Command.RUN:
            (globalScene.phaseManager.getCurrentPhase() as CommandPhase).handleCommand(Command.RUN, 0);
            success = true;
            break;
          case Command.TERA:
            ui.setMode(
              UiMode.FIGHT,
              (globalScene.phaseManager.getCurrentPhase() as CommandPhase).getFieldIndex(),
              Command.TERA,
            );
            success = true;
            break;
        }
      } else {
        (globalScene.phaseManager.getCurrentPhase() as CommandPhase).cancel();
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
        case Button.CYCLE_SHINY: {
          /**
           * When the Cycle Shiny button is pressed,
           * the last pokeball will be thrown.
           * This can only be used in the UiMode.COMMAND.
           */
          const commandPhase = globalScene.phaseManager.getCurrentPhase() as CommandPhase;
          if (
            globalScene.currentBattle.battleType === BattleType.WILD
            && globalScene.pokeballCounts[globalScene.lastPokeballType]
            && commandPhase.handleCommand(Command.BALL, globalScene.lastPokeballType)
          ) {
            globalScene.ui.setMode(UiMode.COMMAND, commandPhase.getFieldIndex());
            globalScene.ui.setMode(UiMode.MESSAGE);
            success = true;
          } else {
            ui.playError();
          }
          break;
        }
        case Button.CYCLE_ABILITY:
          /**
           * When the Cycle Ability button is pressed,
           * the UI will request the user if they would like
           * to restart the battle. This can only be used in
           * the UiMode.COMMAND.
           */
          if (!globalScene.enableRetries) {
            break;
          }
          globalScene.ui.setMode(UiMode.MESSAGE);
          globalScene.ui.showText(i18next.t("battle:retryBattle"), null, () => {
            globalScene.ui.setMode(
              UiMode.CONFIRM,
              () => {
                globalScene.ui.fadeOut(1250).then(() => {
                  globalScene.reset();
                  globalScene.phaseManager.clearPhaseQueue();
                  globalScene.gameData.loadSession(globalScene.sessionSlotId).then(() => {
                    globalScene.phaseManager.pushNew("EncounterPhase", true);

                    const availablePartyMembers = globalScene.getPokemonAllowedInBattle().length;

                    globalScene.phaseManager.pushNew("SummonPhase", 0);
                    if (globalScene.currentBattle.double && availablePartyMembers > 1) {
                      globalScene.phaseManager.pushNew("SummonPhase", 1);
                    }
                    if (
                      globalScene.currentBattle.waveIndex > 1
                      && globalScene.currentBattle.battleType !== BattleType.TRAINER
                    ) {
                      globalScene.phaseManager.pushNew("CheckSwitchPhase", 0, globalScene.currentBattle.double);
                      if (globalScene.currentBattle.double && availablePartyMembers > 1) {
                        globalScene.phaseManager.pushNew("CheckSwitchPhase", 1, globalScene.currentBattle.double);
                      }
                    }
                    globalScene.ui.fadeIn(1250);
                    globalScene.phaseManager.shiftPhase();
                  });
                });
              },
              () => {
                globalScene.ui.setMode(UiMode.COMMAND);
              },
              false,
              0,
              0,
              1000,
            );
          });
          break;
      }
    }

    if (success) {
      ui.playSelect();
    }

    return success;
  }

  canTera(): boolean {
    const activePokemon = globalScene.getField()[this.fieldIndex];
    const currentTeras = globalScene.arena.playerTerasUsed;
    const canTera = activePokemon.isPlayer() && canTerastallize(activePokemon);
    const plannedTera = +(
      globalScene.currentBattle.preTurnCommands[0]?.command === Command.TERA && this.fieldIndex > 0
    );
    return canTera && currentTeras + plannedTera < MAX_TERAS_PER_ARENA;
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
    return this.fieldIndex ? this.cursor2 : this.cursor;
  }

  setCursor(cursor: number): boolean {
    const changed = this.getCursor() !== cursor;
    if (changed) {
      if (this.fieldIndex) {
        this.cursor2 = cursor;
      } else {
        this.cursor = cursor;
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
    this.throwBallTextContainer.setVisible(false);
    this.restartBattleTextContainer.setVisible(false);
    this.getUi().getMessageHandler().clearText();
    this.eraseCursor();
  }

  eraseCursor(): void {
    if (this.cursorObj) {
      this.cursorObj.destroy();
    }
    this.cursorObj = null;
  }

  /**
   * To update text in the command when globalScene.enableHotkeyTips
   * is turned off or when action keys are changed.
   */
  updateTipsText(): void {
    const throwBallKey = globalScene.enableHotkeyTips
      ? ""
      : globalScene.inputController?.getKeyForLatestInputRecorded(SettingKeyboard.Button_Cycle_Shiny)
        ? `(${globalScene.inputController?.getKeyForLatestInputRecorded(SettingKeyboard.Button_Cycle_Shiny)}) `
        : "";
    const lastPokeball =
      " "
      + getPokeballName(globalScene.lastPokeballType)
      + " x"
      + globalScene.pokeballCounts[globalScene.lastPokeballType];
    this.throwBallText.setText(i18next.t("commandUiHandler:throwBall", { throwBallKey, lastPokeball }));
    const retryBattleKey = globalScene.enableHotkeyTips
      ? ""
      : globalScene.inputController?.getKeyForLatestInputRecorded(SettingKeyboard.Button_Cycle_Ability)
        ? `(${globalScene.inputController?.getKeyForLatestInputRecorded(SettingKeyboard.Button_Cycle_Ability)}) `
        : "";
    this.restartBattleText.setText(i18next.t("commandUiHandler:retryBattle", { retryBattleKey }));
    this.throwBallTextContainer.setVisible(
      !globalScene.enableHotkeyTips && globalScene.currentBattle.battleType === BattleType.WILD,
    );
    this.restartBattleTextContainer.setVisible(!globalScene.enableHotkeyTips);
    this.restartBattleTextContainer.setPositionRelative(
      this.throwBallTextContainer,
      0,
      globalScene.currentBattle.battleType === BattleType.WILD ? -12 : 0,
    );
  }
}
