import BattleScene, { Button } from "../battle-scene";
import { addTextObject, TextStyle } from "./text";
import UI, { Mode } from "./ui";
import * as Utils from "../utils";
import MessageUiHandler from "./message-ui-handler";
import { getStatName, Stat } from "../data/pokemon-stat";
import { addWindow } from "./window";

export default class BattleMessageUiHandler extends MessageUiHandler {
  private levelUpStatsContainer: Phaser.GameObjects.Container;
  private levelUpStatsIncrContent: Phaser.GameObjects.Text;
  private levelUpStatsValuesContent: Phaser.GameObjects.Text;
  private nameText: Phaser.GameObjects.Text;

  public bg: Phaser.GameObjects.Image;
  public commandWindow: Phaser.GameObjects.NineSlice;
  public movesWindowContainer: Phaser.GameObjects.Container;
  public nameBoxContainer: Phaser.GameObjects.Container;

  constructor(scene: BattleScene) {
    super(scene, Mode.MESSAGE);
  }

  setup(): void {
    const ui = this.getUi();

    this.textTimer = null;
    this.textCallbackTimer = null;

    const bg = this.scene.add.image(0, 0, 'bg');
		bg.setOrigin(0, 1);
    ui.add(bg);

    this.bg = bg;

    this.commandWindow = addWindow(this.scene, 201, -1, 118, 46);
    this.commandWindow.setOrigin(0, 1);
    this.commandWindow.setVisible(false);
    ui.add(this.commandWindow);

    this.movesWindowContainer = this.scene.add.container(1, -1);
    this.movesWindowContainer.setVisible(false);

    const movesWindow = addWindow(this.scene, 0, 0, 243, 46);
    movesWindow.setOrigin(0, 1);
    this.movesWindowContainer.add(movesWindow);

    const moveDetailsWindow = addWindow(this.scene, 238, 0, 80, 46, false, true, 2, 133);
    moveDetailsWindow.setOrigin(0, 1);
    this.movesWindowContainer.add(moveDetailsWindow);

    const commandFightLabels = this.scene.add.image(246, -10, 'command_fight_labels');
    commandFightLabels.setOrigin(0, 1);
    this.movesWindowContainer.add(commandFightLabels);

    ui.add(this.movesWindowContainer);

    const messageContainer = this.scene.add.container(12, -39);
    ui.add(messageContainer);

    const message = addTextObject(this.scene, 0, 0, '', TextStyle.MESSAGE, {
      maxLines: 2,
      wordWrap: {
        width: 1780
      }
    });
    messageContainer.add(message);

    this.message = message;

    this.nameBoxContainer = this.scene.add.container(0, -16);
    this.nameBoxContainer.setVisible(false);

    const nameBox = this.scene.add.nineslice(0, 0, 'namebox', null, 72, 16, 8, 8, 5, 5);
    nameBox.setOrigin(0, 0);

    this.nameText = addTextObject(this.scene, 8, 0, 'Rival', TextStyle.MESSAGE, { maxLines: 1 });

    this.nameBoxContainer.add(nameBox);
    this.nameBoxContainer.add(this.nameText);
    messageContainer.add(this.nameBoxContainer);

    const prompt = this.scene.add.sprite(0, 0, 'prompt');
    prompt.setVisible(false);
    prompt.setOrigin(0, 0);
    messageContainer.add(prompt);

    this.prompt = prompt;

    const levelUpStatsContainer = this.scene.add.container(0, 0);
    levelUpStatsContainer.setVisible(false);
    ui.add(levelUpStatsContainer);

    this.levelUpStatsContainer = levelUpStatsContainer;

    const levelUpStatsBg = addWindow(this.scene, (this.scene.game.canvas.width / 6), -100, 128, 100);
    levelUpStatsBg.setOrigin(1, 0);
    levelUpStatsContainer.add(levelUpStatsBg);

    const levelUpStatsLabelsContent = addTextObject(this.scene, (this.scene.game.canvas.width / 6) - 121, -94, '', TextStyle.WINDOW, { maxLines: 6 });
    let levelUpStatsLabelText = '';

    const stats = Utils.getEnumValues(Stat);
    for (let s of stats)
      levelUpStatsLabelText += `${getStatName(s)}\n`;

    levelUpStatsLabelsContent.text = levelUpStatsLabelText;
    levelUpStatsContainer.add(levelUpStatsLabelsContent);

    const levelUpStatsIncrContent = addTextObject(this.scene, (this.scene.game.canvas.width / 6) - 50, -94, '+\n+\n+\n+\n+\n+', TextStyle.WINDOW, { maxLines: 6 });
    levelUpStatsContainer.add(levelUpStatsIncrContent);

    this.levelUpStatsIncrContent = levelUpStatsIncrContent;

    const levelUpStatsValuesContent = addTextObject(this.scene, (this.scene.game.canvas.width / 6) - 7, -94, '', TextStyle.WINDOW, { maxLines: 6 });
    levelUpStatsValuesContent.setOrigin(1, 0);
    levelUpStatsValuesContent.setAlign('right');
    levelUpStatsContainer.add(levelUpStatsValuesContent);

    this.levelUpStatsValuesContent = levelUpStatsValuesContent;
  }

  show(args: any[]): void {
    super.show(args);

    this.commandWindow.setVisible(false);
    this.movesWindowContainer.setVisible(false);
    this.message.setWordWrapWidth(1780);
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();
    if (this.awaitingActionInput) {
      if (button === Button.CANCEL || button === Button.ACTION) {
        if (this.onActionInput) {
          ui.playSelect();
          const originalOnActionInput = this.onActionInput;
          this.onActionInput = null;
          originalOnActionInput();
          return true;
        }
      }
    }
  }

  clear() {
    super.clear();
  }

  showText(text: string, delay?: integer, callback?: Function, callbackDelay?: integer, prompt?: boolean, promptDelay?: integer) {
    this.hideNameText();
    super.showText(text, delay, callback, callbackDelay, prompt, promptDelay);
  }

  showDialogue(text: string, name: string, delay?: integer, callback?: Function, callbackDelay?: integer, prompt?: boolean, promptDelay?: integer) {
    this.showNameText(name);
    super.showDialogue(text, name, delay, callback, callbackDelay, prompt, promptDelay);
  }

  promptLevelUpStats(partyMemberIndex: integer, prevStats: integer[], showTotals: boolean): Promise<void> {
    return new Promise(resolve => {
      if (!this.scene.showLevelUpStats)
        return resolve();
      const newStats = (this.scene as BattleScene).getParty()[partyMemberIndex].stats;
      let levelUpStatsValuesText = '';
      const stats = Utils.getEnumValues(Stat);
      for (let s of stats)
        levelUpStatsValuesText += `${showTotals ? newStats[s] : newStats[s] - prevStats[s]}\n`;
      this.levelUpStatsValuesContent.text = levelUpStatsValuesText;
      this.levelUpStatsIncrContent.setVisible(!showTotals);
      this.levelUpStatsContainer.setVisible(true);
      this.awaitingActionInput = true;
      this.onActionInput = () => {
        if (!showTotals)
          return this.promptLevelUpStats(partyMemberIndex, null, true).then(() => resolve());
        else {
          this.levelUpStatsContainer.setVisible(false);
          resolve();
        }
      };
    });
  }

  promptIvs(pokemonId: integer, ivs: integer[], shownIvsCount: integer): Promise<void> {
    return new Promise(resolve => {
      this.scene.executeWithSeedOffset(() => {
        let levelUpStatsValuesText = '';
        const stats = Utils.getEnumValues(Stat);
        let shownStats: Stat[] = [];
        if (shownIvsCount < 6) {
          let statsPool = stats.slice(0);
          for (let i = 0; i < shownIvsCount; i++) {
            const shownStat = Phaser.Math.RND.pick(statsPool);
            shownStats.push(shownStat);
            statsPool.splice(statsPool.indexOf(shownStat), 1);
          }
        } else
          shownStats = stats;
        for (let s of stats)
          levelUpStatsValuesText += `${shownStats.indexOf(s) > -1 ? this.getIvDescriptor(ivs[s]) : '???'}\n`;
        this.levelUpStatsValuesContent.text = levelUpStatsValuesText;
        this.levelUpStatsIncrContent.setVisible(false);
        this.levelUpStatsContainer.setVisible(true);
        this.awaitingActionInput = true;
        this.onActionInput = () => {
          this.levelUpStatsContainer.setVisible(false);
          resolve();
        };
      }, pokemonId);
    });
  }

  getIvDescriptor(value: integer): string {
    if (value > 30)
      return 'Best';
    if (value === 30)
      return 'Fantastic';
    if (value > 20)
      return 'Very Good';
    if (value > 10)
      return 'Pretty Good';
    if (value)
      return 'Decent';
    return 'No Good';
  }

  showNameText(name: string): void {
    this.nameBoxContainer.setVisible(true);
    this.nameText.setText(name);
  }

  hideNameText(): void {
    this.nameBoxContainer.setVisible(false);
  }
}