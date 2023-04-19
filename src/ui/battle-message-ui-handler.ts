import BattleScene, { Button } from "../battle-scene";
import { addTextObject, TextStyle } from "../text";
import UI, { Mode } from "./ui";
import * as Utils from "../utils";
import MessageUiHandler from "./message-ui-handler";
import { getStatName, Stat } from "../pokemon-stat";

export default class BattleMessageUiHandler extends MessageUiHandler {
  private levelUpStatsContainer: Phaser.GameObjects.Container;
  private levelUpStatsIncrContent: Phaser.GameObjects.Text;
  private levelUpStatsValuesContent: Phaser.GameObjects.Text;

  public bg: Phaser.GameObjects.Image;

  constructor(scene: BattleScene) {
    super(scene, Mode.MESSAGE);
  }

  setup() {
    const ui = this.getUi();

    this.textTimer = null;
    this.textCallbackTimer = null;

    const bg = this.scene.add.image(0, 0, 'bg');
		bg.setOrigin(0, 1);
    ui.add(bg);

    this.bg = bg;

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

    const prompt = this.scene.add.sprite(0, 0, 'prompt');
    prompt.setVisible(false);
    prompt.setOrigin(0, 0);
    messageContainer.add(prompt);

    this.prompt = prompt;

    const levelUpStatsContainer = this.scene.add.container(0, 0);
    levelUpStatsContainer.setVisible(false);
    ui.add(levelUpStatsContainer);

    this.levelUpStatsContainer = levelUpStatsContainer;

    const levelUpStatsBg = this.scene.add.image((this.scene.game.canvas.width / 6), -100, 'level_up_stats');
    levelUpStatsBg.setOrigin(1, 0);
    levelUpStatsContainer.add(levelUpStatsBg);

    const levelUpStatsLabelsContent = addTextObject(this.scene, (this.scene.game.canvas.width / 6) - 111, -94, '', TextStyle.WINDOW, { maxLines: 6 });
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
    levelUpStatsContainer.add(levelUpStatsValuesContent);

    this.levelUpStatsValuesContent = levelUpStatsValuesContent;
  }

  show(args: any[]) {
    super.show(args);

    this.bg.setTexture('bg');
    this.message.setWordWrapWidth(1780);
  }

  processInput(button: Button) {
    const ui = this.getUi();
    if (this.awaitingActionInput) {
      if (button === Button.CANCEL || button === Button.ACTION) {
        if (this.onActionInput) {
          ui.playSelect();
          const originalOnActionInput = this.onActionInput;
          this.onActionInput = null;
          originalOnActionInput();
        }
      }
    }
  }

  clear() {
    super.clear();
  }

  promptLevelUpStats(partyMemberIndex: integer, prevStats: integer[], showTotals: boolean, callback?: Function) {
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
        this.promptLevelUpStats(partyMemberIndex, null, true, callback);
      else {
        this.levelUpStatsContainer.setVisible(false);
        if (callback)
          callback();
      }
    };
  }
}