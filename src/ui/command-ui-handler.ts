import { CommandPhase } from "../battle-phases";
import BattleScene, { Button } from "../battle-scene";
import { addTextObject, TextStyle } from "./text";
import PartyUiHandler, { PartyUiMode } from "./party-ui-handler";
import UI, { Mode } from "./ui";
import UiHandler from "./uiHandler";

export enum Command {
  FIGHT = 0,
  BALL,
  POKEMON,
  RUN
};

export default class CommandUiHandler extends UiHandler {
  private commandsContainer: Phaser.GameObjects.Container;
  private cursorObj: Phaser.GameObjects.Image;

  constructor(scene: BattleScene) {
    super(scene, Mode.COMMAND);
  }

  setup() {
    const ui = this.getUi();
    const commands = [ 'Fight', 'Ball', 'Pokémon', 'Run' ];

    this.commandsContainer = this.scene.add.container(216, -38.7);
    this.commandsContainer.setVisible(false);
    ui.add(this.commandsContainer);

    for (let c = 0; c < commands.length; c++) {
      const commandText = addTextObject(this.scene, c % 2 === 0 ? 0 : 55.8, c < 2 ? 0 : 16, commands[c], TextStyle.WINDOW);
      this.commandsContainer.add(commandText);
    }
  }

  show(args: any[]) {
    super.show(args);

    this.commandsContainer.setVisible(true);

    const messageHandler = this.getUi().getMessageHandler();
    messageHandler.bg.setTexture('bg_command');
    messageHandler.message.setWordWrapWidth(1110);
    messageHandler.showText(`What will\n${(this.scene.getCurrentPhase() as CommandPhase).getPokemon().name} do?`, 0);
    this.setCursor(this.cursor);
  }

  processInput(button: Button) {
    const ui = this.getUi();

    let success = false;

    if (button === Button.CANCEL || button === Button.ACTION) {
      
      if (button === Button.ACTION) {
        switch (this.cursor) {
          case 0:
            ui.setMode(Mode.FIGHT);
            success = true;
            break;
          case 1:
            ui.setModeWithoutClear(Mode.BALL);
            success = true;
            break;
          case 2:
            ui.setMode(Mode.PARTY, PartyUiMode.SWITCH, (this.scene.getCurrentPhase() as CommandPhase).getPokemon().getFieldIndex(), null, PartyUiHandler.FilterNonFainted);
            success = true;
            break;
          case 3:
            (this.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.RUN, 0);
            success = true;
            break;
        }
      }
    } else {
      switch (button) {
        case Button.UP:
          if (this.cursor >= 2)
            success = this.setCursor(this.cursor - 2);
          break;
        case Button.DOWN:
          if (this.cursor < 2)
            success = this.setCursor(this.cursor + 2);
          break;
        case Button.LEFT:
          if (this.cursor % 2 === 1)
            success = this.setCursor(this.cursor - 1);
          break;
        case Button.RIGHT:
          if (this.cursor % 2 === 0)
            success = this.setCursor(this.cursor + 1);
          break;
      }
    }

    if (success)
      ui.playSelect();
  }

  setCursor(cursor: integer): boolean {
    const ui = this.getUi();
    const ret = super.setCursor(cursor);

    if (!this.cursorObj) {
      this.cursorObj = this.scene.add.image(0, 0, 'cursor');
      ui.add(this.cursorObj);
    }

    this.cursorObj.setPosition(211 + (cursor % 2 === 1 ? 56 : 0), -31 + (cursor >= 2 ? 16 : 0));

    return ret;
  }

  clear(): void {
    super.clear();
    this.commandsContainer.setVisible(false);
    this.getUi().getMessageHandler().clearText();
    this.eraseCursor();
  }

  eraseCursor(): void {
    if (this.cursorObj)
      this.cursorObj.destroy();
    this.cursorObj = null;
  }
}