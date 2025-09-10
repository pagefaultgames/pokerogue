import { globalScene } from "#app/global-scene";
import Overrides from "#app/overrides";
import type { MoveId } from "#enums/move-id";
import { RewardPoolType } from "#enums/reward-pool-type";
import type { RarityTier } from "#enums/reward-tier";
import { TrainerItemEffect } from "#enums/trainer-item-effect";
import { UiMode } from "#enums/ui-mode";
import {
  type PokemonMoveRecallRewardParams,
  type PokemonMoveReward,
  type PokemonMoveRewardParams,
  PokemonReward,
  type PokemonRewardParams,
  type Reward,
  type RewardOption,
} from "#items/reward";
import {
  type CustomRewardSettings,
  generatePlayerRewardOptions,
  generateRewardPoolWeights,
  getRewardPoolForType,
} from "#items/reward-pool-utils";
import { getPlayerShopRewardOptionsForWave, isMoveReward, isRememberMoveReward, isTmReward } from "#items/reward-utils";
import { FusePokemonReward } from "#items/rewards/fuse";
import { RememberMoveReward } from "#items/rewards/remember-move";
import { TmReward } from "#items/rewards/tm";
import { BattlePhase } from "#phases/battle-phase";
import { type RewardSelectUiHandler, SHOP_OPTIONS_ROW_LIMIT } from "#ui/handlers/reward-select-ui-handler";
import { PartyOption, PartyUiHandler, PartyUiMode, type PokemonMoveSelectFilter } from "#ui/party-ui-handler";
import { isNullOrUndefined, NumberHolder } from "#utils/common";
import i18next from "i18next";

export type RewardSelectCallback = (rowCursor: number, cursor: number) => boolean;

export class SelectRewardPhase extends BattlePhase {
  public readonly phaseName = "SelectRewardPhase";
  private rerollCount: number;
  private rarityTiers?: RarityTier[];
  private customRewardSettings?: CustomRewardSettings;
  private isCopy: boolean;

  private typeOptions: RewardOption[];

  constructor(
    rerollCount = 0,
    rarityTiers?: RarityTier[],
    customRewardSettings?: CustomRewardSettings,
    isCopy = false,
  ) {
    super();

    this.rerollCount = rerollCount;
    this.rarityTiers = rarityTiers;
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
      generateRewardPoolWeights(getRewardPoolForType(this.getPoolType()), party, this.rerollCount);
    }
    const rewardCount = this.getRewardCount();

    this.typeOptions = this.getRewardOptions(rewardCount);

    const rewardSelectCallback = (rowCursor: number, cursor: number) => {
      if (rowCursor < 0 || cursor < 0) {
        // Attempt to skip the item pickup
        globalScene.ui.showText(i18next.t("battle:skipItemQuestion"), null, () => {
          globalScene.ui.setOverlayMode(
            UiMode.CONFIRM,
            () => {
              globalScene.ui.revertMode();
              globalScene.ui.setMode(UiMode.MESSAGE);
              super.end();
            },
            () => this.resetRewardSelect(rewardSelectCallback),
          );
        });
        return false;
      }

      switch (rowCursor) {
        // Execute one of the options from the bottom row
        case 0:
          switch (cursor) {
            case 0:
              return this.rerollRewards();
            case 1:
              return this.openItemTransferScreen(rewardSelectCallback);
            // Check the party, pass a callback to restore the reward select screen.
            case 2:
              globalScene.ui.setModeWithoutClear(UiMode.PARTY, PartyUiMode.CHECK, -1, () => {
                this.resetRewardSelect(rewardSelectCallback);
              });
              return true;
            case 3:
              return this.toggleRerollLock();
            default:
              return false;
          }
        // Pick an option from the rewards
        case 1:
          return this.selectRewardOption(cursor, rewardSelectCallback);
        // Pick an option from the shop
        default: {
          return this.selectShopOption(rowCursor, cursor, rewardSelectCallback);
        }
      }
    };

    this.resetRewardSelect(rewardSelectCallback);
  }

  // Pick a reward from among the rewards and apply it
  private selectRewardOption(cursor: number, rewardSelectCallback: RewardSelectCallback): boolean {
    if (this.typeOptions.length === 0) {
      globalScene.ui.clearText();
      globalScene.ui.setMode(UiMode.MESSAGE);
      super.end();
      return true;
    }
    const reward = this.typeOptions[cursor].type;
    return this.applyReward(reward, -1, rewardSelectCallback);
  }

  // Pick a reward from the shop and apply it
  private selectShopOption(rowCursor: number, cursor: number, rewardSelectCallback: RewardSelectCallback): boolean {
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

    return this.applyReward(reward, cost, rewardSelectCallback);
  }

  // Apply a chosen reward: do an effect or open the party menu
  private applyReward(reward: Reward, cost: number, rewardSelectCallback: RewardSelectCallback): boolean {
    if (reward instanceof PokemonReward) {
      if (reward instanceof FusePokemonReward) {
        this.openFusionMenu(reward, cost, rewardSelectCallback);
      } else {
        this.openPokemonRewardMenu(reward, cost, rewardSelectCallback);
      }
    } else {
      globalScene.applyReward(reward, {}, true);
      globalScene.updateItems(true);
      globalScene.ui.clearText();
      globalScene.ui.setMode(UiMode.MESSAGE);
      super.end();
    }
    return cost === -1;
  }

  private rerollRewards() {
    const rerollCost = this.getRerollCost(globalScene.lockRarityTiers);
    if (rerollCost < 0 || globalScene.money < rerollCost) {
      globalScene.ui.playError();
      return false;
    }
    globalScene.reroll = true;
    globalScene.phaseManager.unshiftNew(
      "SelectRewardPhase",
      this.rerollCount + 1,
      this.typeOptions.map(o => o.type?.tier).filter(t => t !== undefined) as RarityTier[],
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

  // Transfer rewards among party pokemon
  private openItemTransferScreen(rewardSelectCallback: RewardSelectCallback) {
    const party = globalScene.getPlayerParty();
    globalScene.ui.setModeWithoutClear(
      UiMode.PARTY,
      PartyUiMode.ITEM_TRANSFER,
      -1,
      (fromSlotIndex: number, itemIndex: number, itemQuantity: number, toSlotIndex: number) => {
        if (
          toSlotIndex !== undefined
          && fromSlotIndex < 6
          && toSlotIndex < 6
          && fromSlotIndex !== toSlotIndex
          && itemIndex > -1
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
          this.resetRewardSelect(rewardSelectCallback);
        }
      },
      PartyUiHandler.FilterItemMaxStacks,
    );
    return true;
  }

  // Toggle reroll lock
  private toggleRerollLock() {
    const rerollCost = this.getRerollCost(globalScene.lockRarityTiers);
    if (rerollCost < 0) {
      // Reroll lock button is also disabled when reroll is disabled
      globalScene.ui.playError();
      return false;
    }
    globalScene.lockRarityTiers = !globalScene.lockRarityTiers;
    const uiHandler = globalScene.ui.getHandler() as RewardSelectUiHandler;
    uiHandler.setRerollCost(this.getRerollCost(globalScene.lockRarityTiers));
    uiHandler.updateLockRaritiesText();
    uiHandler.updateRerollCostText();
    return false;
  }

  // Opens the party menu specifically for fusions
  private openFusionMenu(reward: FusePokemonReward, _cost: number, rewardSelectCallback: RewardSelectCallback): void {
    const party = globalScene.getPlayerParty();
    globalScene.ui.setModeWithoutClear(
      UiMode.PARTY,
      PartyUiMode.SPLICE,
      -1,
      (fromSlotIndex: number, spliceSlotIndex: number) => {
        if (
          spliceSlotIndex !== undefined
          && fromSlotIndex < 6
          && spliceSlotIndex < 6
          && fromSlotIndex !== spliceSlotIndex
        ) {
          globalScene.ui.setMode(UiMode.REWARD_SELECT, this.isPlayer()).then(() => {
            reward.apply({ pokemon: party[fromSlotIndex], pokemon2: party[spliceSlotIndex] });
          });
        } else {
          this.resetRewardSelect(rewardSelectCallback);
        }
      },
      reward.selectFilter,
    );
  }

  // Opens the party menu to apply one of various Pokemon rewards. We pass the reward's filter to decide which Pokemon can be selected.
  // For MoveReward (e.g. PP UP or Ether) we also pass a filter to decide which moves can be selected.
  private openPokemonRewardMenu(reward: PokemonReward, cost: number, rewardSelectCallback: RewardSelectCallback): void {
    const party = globalScene.getPlayerParty();

    let partyUiMode = PartyUiMode.REWARD;
    let moveSelectFilter: PokemonMoveSelectFilter | undefined;
    let tmMoveId: MoveId | undefined;
    let isMove = false;
    let getParams = (slotIndex: number, _option: PartyOption) => {
      return { pokemon: party[slotIndex] } as PokemonRewardParams;
    };

    if (isMoveReward(reward)) {
      partyUiMode = PartyUiMode.MOVE_REWARD;
      moveSelectFilter = (reward as PokemonMoveReward).moveSelectFilter;
      isMove = true;
      getParams = (slotIndex: number, option: PartyOption) => {
        return { pokemon: party[slotIndex], moveIndex: option - PartyOption.MOVE_1 } as PokemonMoveRewardParams;
      };
    }
    if (isRememberMoveReward(reward)) {
      partyUiMode = PartyUiMode.REMEMBER_MOVE_REWARD;
      getParams = (slotIndex: number, option: PartyOption) => {
        return { pokemon: party[slotIndex], moveIndex: option, cost } as PokemonMoveRecallRewardParams;
      };
    }
    if (isTmReward(reward)) {
      partyUiMode = PartyUiMode.TM_REWARD;
      tmMoveId = reward.moveId;
    }

    globalScene.ui.setModeWithoutClear(
      UiMode.PARTY,
      partyUiMode,
      -1,
      (slotIndex: number, option: PartyOption) => {
        if (slotIndex < 6) {
          globalScene.ui.setMode(UiMode.REWARD_SELECT, this.isPlayer()).then(() => {
            const params = getParams(slotIndex, option);
            const result = globalScene.applyReward(reward, params, true);
            this.postApplyPokemonReward(reward, result, cost);
          });
        } else {
          this.resetRewardSelect(rewardSelectCallback);
        }
      },
      reward.selectFilter,
      moveSelectFilter,
      tmMoveId,
      isMove,
    );
  }

  // TODO: Rework this to work properly with rewards
  /**
   * Apply the effects of the chosen reward
   * @param reward - The reward to apply
   * @param cost - The cost of the reward if it was purchased, or -1 if selected as the reward reward
   * @param playSound - Whether the 'obtain reward' sound should be played when adding the reward.
   */
  private postApplyPokemonReward(reward: Reward, result = false, cost = -1): void {
    // Queue a copy of this phase when applying a TM or Memory Mushroom.
    // If the player selects either of these, then escapes out of consuming them,
    // they are returned to a shop in the same state.
    if (reward instanceof RememberMoveReward || reward instanceof TmReward) {
      globalScene.phaseManager.unshiftPhase(this.copy());
    }

    if (cost !== -1 && !(reward instanceof RememberMoveReward)) {
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

  // Function that determines how many reward slots are available
  private getRewardCount(): number {
    const rewardCountHolder = new NumberHolder(3);
    globalScene.applyPlayerItems(TrainerItemEffect.EXTRA_REWARD, { numberHolder: rewardCountHolder });

    // If custom rewards are specified, overrides default item count
    if (this.customRewardSettings) {
      const newItemCount =
        (this.customRewardSettings.guaranteedRarityTiers?.length ?? 0)
        + (this.customRewardSettings.guaranteedRewardOptions?.length ?? 0)
        + (this.customRewardSettings.guaranteedRewardSpecs?.length ?? 0);
      if (this.customRewardSettings.fillRemaining) {
        const originalCount = rewardCountHolder.value;
        rewardCountHolder.value = originalCount > newItemCount ? originalCount : newItemCount;
      } else {
        rewardCountHolder.value = newItemCount;
      }
    }

    return rewardCountHolder.value;
  }

  // Function that resets the reward selection screen,
  // e.g. after pressing cancel in the party ui or while learning a move
  private resetRewardSelect(rewardSelectCallback: RewardSelectCallback) {
    globalScene.ui.setMode(
      UiMode.REWARD_SELECT,
      this.isPlayer(),
      this.typeOptions,
      rewardSelectCallback,
      this.getRerollCost(globalScene.lockRarityTiers),
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

  getRewardOptions(rewardCount: number): RewardOption[] {
    return generatePlayerRewardOptions(
      rewardCount,
      globalScene.getPlayerParty(),
      globalScene.lockRarityTiers ? this.rarityTiers : undefined,
      this.customRewardSettings,
    );
  }

  copy(): SelectRewardPhase {
    return globalScene.phaseManager.create(
      "SelectRewardPhase",
      this.rerollCount,
      this.rarityTiers,
      {
        guaranteedRewardOptions: this.typeOptions,
        rerollMultiplier: this.customRewardSettings?.rerollMultiplier,
        allowLuckUpgrades: false,
      },
      true,
    );
  }
}
