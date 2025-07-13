import { globalScene } from "#app/global-scene";
import Overrides from "#app/overrides";
import { RewardPoolType } from "#enums/reward-pool-type";
import type { RewardTier } from "#enums/reward-tier";
import { UiMode } from "#enums/ui-mode";
import type { Modifier } from "#items/modifier";
import type { CustomRewardSettings, Reward, RewardOption } from "#items/reward";
import {
  FormChangeItemReward,
  FusePokemonReward,
  getPlayerRewardOptions,
  getPlayerShopRewardOptionsForWave,
  HeldItemReward,
  PokemonMoveReward,
  PokemonPpRestoreReward,
  PokemonPpUpReward,
  PokemonReward,
  RememberMoveReward,
  regenerateRewardPoolThresholds,
  TmReward,
  TrainerItemReward,
} from "#items/reward";
import { TrainerItemEffect } from "#items/trainer-item";
import { BattlePhase } from "#phases/battle-phase";
import { PartyOption, PartyUiHandler, PartyUiMode } from "#ui/party-ui-handler";
import { type RewardSelectUiHandler, SHOP_OPTIONS_ROW_LIMIT } from "#ui/reward-select-ui-handler";
import { isNullOrUndefined, NumberHolder } from "#utils/common";
import i18next from "i18next";

export type ModifierSelectCallback = (rowCursor: number, cursor: number) => boolean;

export class SelectRewardPhase extends BattlePhase {
  public readonly phaseName = "SelectRewardPhase";
  private rerollCount: number;
  private rewardTiers?: RewardTier[];
  private customRewardSettings?: CustomRewardSettings;
  private isCopy: boolean;

  private typeOptions: RewardOption[];

  constructor(
    rerollCount = 0,
    rewardTiers?: RewardTier[],
    customRewardSettings?: CustomRewardSettings,
    isCopy = false,
  ) {
    super();

    this.rerollCount = rerollCount;
    this.rewardTiers = rewardTiers;
    this.customRewardSettings = customRewardSettings;
    this.isCopy = isCopy;
  }

  start() {
    super.start();

    if (!this.isPlayer()) {
      return false;
    }

    if (!this.rerollCount && !this.isCopy) {
      this.updateSeed();
    } else if (this.rerollCount) {
      globalScene.reroll = false;
    }

    const party = globalScene.getPlayerParty();
    if (!this.isCopy) {
      regenerateRewardPoolThresholds(party, this.getPoolType(), this.rerollCount);
    }
    const modifierCount = this.getModifierCount();

    this.typeOptions = this.getRewardOptions(modifierCount);

    const modifierSelectCallback = (rowCursor: number, cursor: number) => {
      if (rowCursor < 0 || cursor < 0) {
        globalScene.ui.showText(i18next.t("battle:skipItemQuestion"), null, () => {
          globalScene.ui.setOverlayMode(
            UiMode.CONFIRM,
            () => {
              globalScene.ui.revertMode();
              globalScene.ui.setMode(UiMode.MESSAGE);
              super.end();
            },
            () => this.resetModifierSelect(modifierSelectCallback),
          );
        });
        return false;
      }

      switch (rowCursor) {
        // Execute one of the options from the bottom row
        case 0:
          switch (cursor) {
            case 0:
              return this.rerollModifiers();
            case 1:
              return this.openModifierTransferScreen(modifierSelectCallback);
            // Check the party, pass a callback to restore the modifier select screen.
            case 2:
              globalScene.ui.setModeWithoutClear(UiMode.PARTY, PartyUiMode.CHECK, -1, () => {
                this.resetModifierSelect(modifierSelectCallback);
              });
              return true;
            case 3:
              return this.toggleRerollLock();
            default:
              return false;
          }
        // Pick an option from the rewards
        case 1:
          return this.selectRewardModifierOption(cursor, modifierSelectCallback);
        // Pick an option from the shop
        default: {
          return this.selectShopModifierOption(rowCursor, cursor, modifierSelectCallback);
        }
      }
    };

    this.resetModifierSelect(modifierSelectCallback);
  }

  // Pick a modifier from among the rewards and apply it
  private selectRewardModifierOption(cursor: number, modifierSelectCallback: ModifierSelectCallback): boolean {
    if (this.typeOptions.length === 0) {
      globalScene.ui.clearText();
      globalScene.ui.setMode(UiMode.MESSAGE);
      super.end();
      return true;
    }
    const reward = this.typeOptions[cursor].type;
    return this.applyChosenModifier(reward, -1, modifierSelectCallback);
  }

  // Pick a modifier from the shop and apply it
  private selectShopModifierOption(
    rowCursor: number,
    cursor: number,
    modifierSelectCallback: ModifierSelectCallback,
  ): boolean {
    const shopOptions = getPlayerShopRewardOptionsForWave(
      globalScene.currentBattle.waveIndex,
      globalScene.getWaveMoneyAmount(1),
    );
    const shopOption =
      shopOptions[
        rowCursor > 2 || shopOptions.length <= SHOP_OPTIONS_ROW_LIMIT ? cursor : cursor + SHOP_OPTIONS_ROW_LIMIT
      ];
    const reward = shopOption.type;
    // Apply Black Sludge to healing item cost
    const healingItemCost = new NumberHolder(shopOption.cost);
    globalScene.applyPlayerItems(TrainerItemEffect.HEAL_SHOP_COST, { numberHolder: healingItemCost });
    const cost = healingItemCost.value;

    if (globalScene.money < cost && !Overrides.WAIVE_ROLL_FEE_OVERRIDE) {
      globalScene.ui.playError();
      return false;
    }

    return this.applyChosenModifier(reward, cost, modifierSelectCallback);
  }

  // Apply a chosen modifier: do an effect or open the party menu
  private applyChosenModifier(reward: Reward, cost: number, modifierSelectCallback: ModifierSelectCallback): boolean {
    if (reward instanceof PokemonReward) {
      if (reward instanceof HeldItemReward || reward instanceof FormChangeItemReward) {
        this.openGiveHeldItemMenu(reward, modifierSelectCallback);
      } else if (reward instanceof FusePokemonReward) {
        this.openFusionMenu(reward, cost, modifierSelectCallback);
      } else {
        this.openModifierMenu(reward, cost, modifierSelectCallback);
      }
    } else if (reward instanceof TrainerItemReward) {
      console.log("WE GOT HERE");
      reward.apply();
      globalScene.updateItems(true);
      globalScene.ui.clearText();
      globalScene.ui.setMode(UiMode.MESSAGE);
      super.end();
    } else {
      this.applyModifier(reward.newModifier()!);
    }
    return !cost;
  }

  // Reroll rewards
  private rerollModifiers() {
    const rerollCost = this.getRerollCost(globalScene.lockRewardTiers);
    if (rerollCost < 0 || globalScene.money < rerollCost) {
      globalScene.ui.playError();
      return false;
    }
    globalScene.reroll = true;
    globalScene.phaseManager.unshiftNew(
      "SelectRewardPhase",
      this.rerollCount + 1,
      this.typeOptions.map(o => o.type?.tier).filter(t => t !== undefined) as RewardTier[],
    );
    globalScene.ui.clearText();
    globalScene.ui.setMode(UiMode.MESSAGE).then(() => super.end());
    if (!Overrides.WAIVE_ROLL_FEE_OVERRIDE) {
      globalScene.money -= rerollCost;
      globalScene.updateMoneyText();
      globalScene.animateMoneyChanged(false);
    }
    globalScene.playSound("se/buy");
    return true;
  }

  // Transfer modifiers among party pokemon
  private openModifierTransferScreen(modifierSelectCallback: ModifierSelectCallback) {
    const party = globalScene.getPlayerParty();
    globalScene.ui.setModeWithoutClear(
      UiMode.PARTY,
      PartyUiMode.MODIFIER_TRANSFER,
      -1,
      (fromSlotIndex: number, itemIndex: number, itemQuantity: number, toSlotIndex: number) => {
        if (
          toSlotIndex !== undefined &&
          fromSlotIndex < 6 &&
          toSlotIndex < 6 &&
          fromSlotIndex !== toSlotIndex &&
          itemIndex > -1
        ) {
          const items = party[fromSlotIndex].heldItemManager.getTransferableHeldItems();
          const item = items[itemIndex];
          globalScene.tryTransferHeldItem(
            item,
            party[fromSlotIndex],
            party[toSlotIndex],
            true,
            itemQuantity,
            undefined,
            false,
          );
        } else {
          this.resetModifierSelect(modifierSelectCallback);
        }
      },
      PartyUiHandler.FilterItemMaxStacks,
    );
    return true;
  }

  // Toggle reroll lock
  private toggleRerollLock() {
    const rerollCost = this.getRerollCost(globalScene.lockRewardTiers);
    if (rerollCost < 0) {
      // Reroll lock button is also disabled when reroll is disabled
      globalScene.ui.playError();
      return false;
    }
    globalScene.lockRewardTiers = !globalScene.lockRewardTiers;
    const uiHandler = globalScene.ui.getHandler() as RewardSelectUiHandler;
    uiHandler.setRerollCost(this.getRerollCost(globalScene.lockRewardTiers));
    uiHandler.updateLockRaritiesText();
    uiHandler.updateRerollCostText();
    return false;
  }

  /**
   * Apply the effects of the chosen modifier
   * @param modifier - The modifier to apply
   * @param cost - The cost of the modifier if it was purchased, or -1 if selected as the modifier reward
   * @param playSound - Whether the 'obtain modifier' sound should be played when adding the modifier.
   */
  private applyModifier(modifier: Modifier, cost = -1, playSound = false): void {
    const result = globalScene.addModifier(modifier, playSound, undefined, cost);
    // Queue a copy of this phase when applying a TM or Memory Mushroom.
    // If the player selects either of these, then escapes out of consuming them,
    // they are returned to a shop in the same state.
    if (modifier.type instanceof RememberMoveReward || modifier.type instanceof TmReward) {
      globalScene.phaseManager.unshiftPhase(this.copy());
    }

    if (cost !== -1 && !(modifier.type instanceof RememberMoveReward)) {
      if (result) {
        if (!Overrides.WAIVE_ROLL_FEE_OVERRIDE) {
          globalScene.money -= cost;
          globalScene.updateMoneyText();
          globalScene.animateMoneyChanged(false);
        }
        globalScene.playSound("se/buy");
        (globalScene.ui.getHandler() as RewardSelectUiHandler).updateCostText();
      } else {
        globalScene.ui.playError();
      }
    } else {
      globalScene.ui.clearText();
      globalScene.ui.setMode(UiMode.MESSAGE);
      super.end();
    }
  }

  // Opens the party menu specifically for fusions
  private openFusionMenu(reward: PokemonReward, cost: number, modifierSelectCallback: ModifierSelectCallback): void {
    const party = globalScene.getPlayerParty();
    globalScene.ui.setModeWithoutClear(
      UiMode.PARTY,
      PartyUiMode.SPLICE,
      -1,
      (fromSlotIndex: number, spliceSlotIndex: number) => {
        if (
          spliceSlotIndex !== undefined &&
          fromSlotIndex < 6 &&
          spliceSlotIndex < 6 &&
          fromSlotIndex !== spliceSlotIndex
        ) {
          globalScene.ui.setMode(UiMode.MODIFIER_SELECT, this.isPlayer()).then(() => {
            const modifier = reward.newModifier(party[fromSlotIndex], party[spliceSlotIndex])!; //TODO: is the bang correct?
            this.applyModifier(modifier, cost, true);
          });
        } else {
          this.resetModifierSelect(modifierSelectCallback);
        }
      },
      reward.selectFilter,
    );
  }

  // Opens the party menu to apply one of various modifiers
  private openModifierMenu(reward: PokemonReward, cost: number, modifierSelectCallback: ModifierSelectCallback): void {
    const party = globalScene.getPlayerParty();
    const pokemonReward = reward as PokemonReward;
    const isMoveModifier = reward instanceof PokemonMoveReward;
    const isTmModifier = reward instanceof TmReward;
    const isRememberMoveModifier = reward instanceof RememberMoveReward;
    const isPpRestoreModifier = reward instanceof PokemonPpRestoreReward || reward instanceof PokemonPpUpReward;
    const partyUiMode = isMoveModifier
      ? PartyUiMode.MOVE_MODIFIER
      : isTmModifier
        ? PartyUiMode.TM_MODIFIER
        : isRememberMoveModifier
          ? PartyUiMode.REMEMBER_MOVE_MODIFIER
          : PartyUiMode.MODIFIER;
    const tmMoveId = isTmModifier ? (reward as TmReward).moveId : undefined;
    globalScene.ui.setModeWithoutClear(
      UiMode.PARTY,
      partyUiMode,
      -1,
      (slotIndex: number, option: PartyOption) => {
        if (slotIndex < 6) {
          globalScene.ui.setMode(UiMode.MODIFIER_SELECT, this.isPlayer()).then(() => {
            const modifier = !isMoveModifier
              ? !isRememberMoveModifier
                ? reward.newModifier(party[slotIndex])
                : reward.newModifier(party[slotIndex], option as number)
              : reward.newModifier(party[slotIndex], option - PartyOption.MOVE_1);
            this.applyModifier(modifier!, cost, true); // TODO: is the bang correct?
          });
        } else {
          this.resetModifierSelect(modifierSelectCallback);
        }
      },
      pokemonReward.selectFilter,
      reward instanceof PokemonMoveReward ? (reward as PokemonMoveReward).moveSelectFilter : undefined,
      tmMoveId,
      isPpRestoreModifier,
    );
  }

  private openGiveHeldItemMenu(reward, modifierSelectCallback) {
    const party = globalScene.getPlayerParty();
    const partyUiMode = PartyUiMode.MODIFIER;
    globalScene.ui.setModeWithoutClear(
      UiMode.PARTY,
      partyUiMode,
      -1,
      (slotIndex: number, _option: PartyOption) => {
        if (slotIndex < 6) {
          globalScene.ui.setMode(UiMode.MODIFIER_SELECT, this.isPlayer()).then(() => {
            reward.apply(party[slotIndex]);
            globalScene.ui.clearText();
            globalScene.ui.setMode(UiMode.MESSAGE);
            super.end();
          });
        } else {
          this.resetModifierSelect(modifierSelectCallback);
        }
      },
      reward.selectFilter,
    );
  }

  // Function that determines how many reward slots are available
  private getModifierCount(): number {
    const modifierCountHolder = new NumberHolder(3);
    globalScene.applyPlayerItems(TrainerItemEffect.EXTRA_REWARD, { numberHolder: modifierCountHolder });

    // If custom modifiers are specified, overrides default item count
    if (this.customRewardSettings) {
      const newItemCount =
        (this.customRewardSettings.guaranteedRewardTiers?.length ?? 0) +
        (this.customRewardSettings.guaranteedRewardOptions?.length ?? 0) +
        (this.customRewardSettings.guaranteedRewardFuncs?.length ?? 0);
      if (this.customRewardSettings.fillRemaining) {
        const originalCount = modifierCountHolder.value;
        modifierCountHolder.value = originalCount > newItemCount ? originalCount : newItemCount;
      } else {
        modifierCountHolder.value = newItemCount;
      }
    }

    return modifierCountHolder.value;
  }

  // Function that resets the reward selection screen,
  // e.g. after pressing cancel in the party ui or while learning a move
  private resetModifierSelect(modifierSelectCallback: ModifierSelectCallback) {
    globalScene.ui.setMode(
      UiMode.MODIFIER_SELECT,
      this.isPlayer(),
      this.typeOptions,
      modifierSelectCallback,
      this.getRerollCost(globalScene.lockRewardTiers),
    );
  }

  updateSeed(): void {
    globalScene.resetSeed();
  }

  isPlayer(): boolean {
    return true;
  }

  getRerollCost(lockRarities: boolean): number {
    let baseValue = 0;
    if (Overrides.WAIVE_ROLL_FEE_OVERRIDE) {
      return baseValue;
    }
    if (lockRarities) {
      const tierValues = [50, 125, 300, 750, 2000];
      for (const opt of this.typeOptions) {
        baseValue += tierValues[opt.type.tier ?? 0];
      }
    } else {
      baseValue = 250;
    }

    let multiplier = 1;
    if (!isNullOrUndefined(this.customRewardSettings?.rerollMultiplier)) {
      if (this.customRewardSettings.rerollMultiplier < 0) {
        // Completely overrides reroll cost to -1 and early exits
        return -1;
      }

      // Otherwise, continue with custom multiplier
      multiplier = this.customRewardSettings.rerollMultiplier;
    }

    const baseMultiplier = Math.min(
      Math.ceil(globalScene.currentBattle.waveIndex / 10) * baseValue * 2 ** this.rerollCount * multiplier,
      Number.MAX_SAFE_INTEGER,
    );

    // Apply Black Sludge to reroll cost
    const modifiedRerollCost = new NumberHolder(baseMultiplier);
    globalScene.applyPlayerItems(TrainerItemEffect.HEAL_SHOP_COST, { numberHolder: modifiedRerollCost });
    return modifiedRerollCost.value;
  }

  getPoolType(): RewardPoolType {
    return RewardPoolType.PLAYER;
  }

  getRewardOptions(modifierCount: number): RewardOption[] {
    return getPlayerRewardOptions(
      modifierCount,
      globalScene.getPlayerParty(),
      globalScene.lockRewardTiers ? this.rewardTiers : undefined,
      this.customRewardSettings,
    );
  }

  copy(): SelectRewardPhase {
    return globalScene.phaseManager.create(
      "SelectRewardPhase",
      this.rerollCount,
      this.rewardTiers,
      {
        guaranteedRewardOptions: this.typeOptions,
        rerollMultiplier: this.customRewardSettings?.rerollMultiplier,
        allowLuckUpgrades: false,
      },
      true,
    );
  }

  addModifier(modifier: Modifier): boolean {
    return globalScene.addModifier(modifier, false, true);
  }
}
