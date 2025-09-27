import { globalScene } from "#app/global-scene";
import { HeldItemId } from "#enums/held-item-id";
import type { RewardId } from "#enums/reward-id";
import { SpeciesId } from "#enums/species-id";
import { TrainerItemEffect } from "#enums/trainer-item-effect";
import { Reward } from "#items/reward";
import { formatMoney, NumberHolder } from "#utils/common";
import i18next from "i18next";

export class AddMoneyReward extends Reward {
  private moneyMultiplier: number;
  private moneyMultiplierDescriptorKey: string;

  constructor(
    localeKey: string,
    iconImage: string,
    moneyMultiplier: number,
    moneyMultiplierDescriptorKey: string,
    id: RewardId,
  ) {
    super(localeKey, iconImage, "money", "se/buy");

    this.moneyMultiplier = moneyMultiplier;
    this.moneyMultiplierDescriptorKey = moneyMultiplierDescriptorKey;
    this.id = id;
  }

  get description(): string {
    const moneyAmount = new NumberHolder(globalScene.getWaveMoneyAmount(this.moneyMultiplier));
    globalScene.applyPlayerItems(TrainerItemEffect.MONEY_MULTIPLIER, { numberHolder: moneyAmount });
    const formattedMoney = formatMoney(globalScene.moneyFormat, moneyAmount.value);

    return i18next.t("modifierType:ModifierType.MoneyRewardModifierType.description", {
      moneyMultiplier: i18next.t(this.moneyMultiplierDescriptorKey as any),
      moneyAmount: formattedMoney,
    });
  }

  /**
   * Applies {@linkcode AddMoneyReward}
   * @returns always `true`
   */
  apply(): boolean {
    const moneyAmount = new NumberHolder(globalScene.getWaveMoneyAmount(this.moneyMultiplier));

    globalScene.applyPlayerItems(TrainerItemEffect.MONEY_MULTIPLIER, { numberHolder: moneyAmount });

    globalScene.addMoney(moneyAmount.value);

    for (const p of globalScene.getPlayerParty()) {
      if (p.hasSpecies(SpeciesId.GIMMIGHOUL)) {
        const factor = Math.min(Math.floor(this.moneyMultiplier), 3);
        p.heldItemManager.add(HeldItemId.GIMMIGHOUL_EVO_TRACKER, factor);
      }
    }

    return true;
  }
}
