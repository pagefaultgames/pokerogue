import { getCharVariantFromDialogue } from "#app/data/dialogue";
import { TrainerType } from "#app/enums/trainer-type";
import { modifierTypes } from "#app/modifier/modifier-type";
import { vouchers } from "#app/system/voucher";
import i18next from "i18next";
import * as Utils from "#app/utils";
import { BattlePhase } from "./battle-phase";
import { ModifierRewardPhase } from "./modifier-reward-phase";
import { MoneyRewardPhase } from "./money-reward-phase";
import { TrainerSlot } from "#app/data/trainer-config";
import { gScene } from "#app/battle-scene";

export class TrainerVictoryPhase extends BattlePhase {
  constructor() {
    super();
  }

  start() {
    gScene.disableMenu = true;

    gScene.playBgm(gScene.currentBattle.trainer?.config.victoryBgm);

    gScene.unshiftPhase(new MoneyRewardPhase(gScene.currentBattle.trainer?.config.moneyMultiplier!)); // TODO: is this bang correct?

    const modifierRewardFuncs = gScene.currentBattle.trainer?.config.modifierRewardFuncs!; // TODO: is this bang correct?
    for (const modifierRewardFunc of modifierRewardFuncs) {
      gScene.unshiftPhase(new ModifierRewardPhase(modifierRewardFunc));
    }

    if (gScene.eventManager.isEventActive()) {
      for (const rewardFunc of gScene.currentBattle.trainer?.config.eventRewardFuncs!) {
        gScene.unshiftPhase(new ModifierRewardPhase(rewardFunc));
      }
    }

    const trainerType = gScene.currentBattle.trainer?.config.trainerType!; // TODO: is this bang correct?
    if (vouchers.hasOwnProperty(TrainerType[trainerType])) {
      if (!gScene.validateVoucher(vouchers[TrainerType[trainerType]]) && gScene.currentBattle.trainer?.config.isBoss) {
        gScene.unshiftPhase(new ModifierRewardPhase([ modifierTypes.VOUCHER, modifierTypes.VOUCHER, modifierTypes.VOUCHER_PLUS, modifierTypes.VOUCHER_PREMIUM ][vouchers[TrainerType[trainerType]].voucherType]));
      }
    }

    gScene.ui.showText(i18next.t("battle:trainerDefeated", { trainerName: gScene.currentBattle.trainer?.getName(TrainerSlot.NONE, true) }), null, () => {
      const victoryMessages = gScene.currentBattle.trainer?.getVictoryMessages()!; // TODO: is this bang correct?
      let message: string;
      gScene.executeWithSeedOffset(() => message = Utils.randSeedItem(victoryMessages), gScene.currentBattle.waveIndex);
      message = message!; // tell TS compiler it's defined now

      const showMessage = () => {
        const originalFunc = showMessageOrEnd;
        showMessageOrEnd = () => gScene.ui.showDialogue(message, gScene.currentBattle.trainer?.getName(TrainerSlot.TRAINER, true), null, originalFunc);

        showMessageOrEnd();
      };
      let showMessageOrEnd = () => this.end();
      if (victoryMessages?.length) {
        if (gScene.currentBattle.trainer?.config.hasCharSprite && !gScene.ui.shouldSkipDialogue(message)) {
          const originalFunc = showMessageOrEnd;
          showMessageOrEnd = () => gScene.charSprite.hide().then(() => gScene.hideFieldOverlay(250).then(() => originalFunc()));
          gScene.showFieldOverlay(500).then(() => gScene.charSprite.showCharacter(gScene.currentBattle.trainer?.getKey()!, getCharVariantFromDialogue(victoryMessages[0])).then(() => showMessage())); // TODO: is this bang correct?
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
