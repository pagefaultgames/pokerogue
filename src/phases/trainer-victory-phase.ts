import BattleScene from "#app/battle-scene.js";
import { getCharVariantFromDialogue } from "#app/data/dialogue.js";
import { TrainerType } from "#app/enums/trainer-type.js";
import { modifierTypes } from "#app/modifier/modifier-type.js";
import { vouchers } from "#app/system/voucher.js";
import i18next from "i18next";
import * as Utils from "#app/utils.js";
import { BattlePhase } from "./battle-phase";
import { ModifierRewardPhase } from "./modifier-reward-phase";
import { MoneyRewardPhase } from "./money-reward-phase";
import { TrainerSlot } from "#app/data/trainer-config";

export class TrainerVictoryPhase extends BattlePhase {
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    this.scene.disableMenu = true;

    this.scene.playBgm(this.scene.currentBattle.trainer?.config.victoryBgm);

    this.scene.unshiftPhase(new MoneyRewardPhase(this.scene, this.scene.currentBattle.trainer?.config.moneyMultiplier!)); // TODO: is this bang correct?

    const modifierRewardFuncs = this.scene.currentBattle.trainer?.config.modifierRewardFuncs!; // TODO: is this bang correct?
    for (const modifierRewardFunc of modifierRewardFuncs) {
      this.scene.unshiftPhase(new ModifierRewardPhase(this.scene, modifierRewardFunc));
    }

    const trainerType = this.scene.currentBattle.trainer?.config.trainerType!; // TODO: is this bang correct?
    if (vouchers.hasOwnProperty(TrainerType[trainerType])) {
      if (!this.scene.validateVoucher(vouchers[TrainerType[trainerType]]) && this.scene.currentBattle.trainer?.config.isBoss) {
        this.scene.unshiftPhase(new ModifierRewardPhase(this.scene, [modifierTypes.VOUCHER, modifierTypes.VOUCHER, modifierTypes.VOUCHER_PLUS, modifierTypes.VOUCHER_PREMIUM][vouchers[TrainerType[trainerType]].voucherType]));
      }
    }

    this.scene.ui.showText(i18next.t("battle:trainerDefeated", { trainerName: this.scene.currentBattle.trainer?.getName(TrainerSlot.NONE, true) }), null, () => {
      const victoryMessages = this.scene.currentBattle.trainer?.getVictoryMessages()!; // TODO: is this bang correct?
      let message: string;
      this.scene.executeWithSeedOffset(() => message = Utils.randSeedItem(victoryMessages), this.scene.currentBattle.waveIndex);
      message = message!; // tell TS compiler it's defined now

      const showMessage = () => {
        const originalFunc = showMessageOrEnd;
        showMessageOrEnd = () => this.scene.ui.showDialogue(message, this.scene.currentBattle.trainer?.getName(TrainerSlot.TRAINER, true), null, originalFunc);

        showMessageOrEnd();
      };
      let showMessageOrEnd = () => this.end();
      if (victoryMessages?.length) {
        if (this.scene.currentBattle.trainer?.config.hasCharSprite && !this.scene.ui.shouldSkipDialogue(message)) {
          const originalFunc = showMessageOrEnd;
          showMessageOrEnd = () => this.scene.charSprite.hide().then(() => this.scene.hideFieldOverlay(250).then(() => originalFunc()));
          this.scene.showFieldOverlay(500).then(() => this.scene.charSprite.showCharacter(this.scene.currentBattle.trainer?.getKey()!, getCharVariantFromDialogue(victoryMessages[0])).then(() => showMessage())); // TODO: is this bang correct?
        } else {
          showMessage();
        }
      } else {
        showMessageOrEnd();
      }
    }, null, true);

    this.showEnemyTrainer();
  }
}
