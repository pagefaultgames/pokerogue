import { globalScene } from "#app/global-scene";
import { allTrainerItems } from "#data/data-lists";
import { RewardId } from "#enums/reward-id";
import { Stat, TEMP_BATTLE_STATS, type TempBattleStat } from "#enums/stat";
import type { TrainerItemId } from "#enums/trainer-item-id";
import { Reward, RewardGenerator } from "#items/reward";
import { tempStatToTrainerItem } from "#items/x-items";
import { randSeedItem } from "#utils/common";

export class TrainerItemReward extends Reward {
  public readonly itemId: TrainerItemId;
  constructor(id: RewardId, itemId: TrainerItemId) {
    super(id, "", "", "se/restore");
    this.itemId = itemId;
  }

  /**
   * Return the deduplication match key for a trainer item ID.
   * @param itemId - Trainer item ID
   * @returns Match key string
   */
  public static getItemMatchKey(itemId: TrainerItemId): string {
    return `trainer:${itemId}`;
  }

  override get matchKey(): string {
    return TrainerItemReward.getItemMatchKey(this.itemId);
  }

  get name(): string {
    return allTrainerItems[this.itemId].name;
  }

  get description(): string {
    return allTrainerItems[this.itemId].description;
  }

  get iconName(): string {
    return allTrainerItems[this.itemId].iconName;
  }

  apply(): boolean {
    return globalScene.trainerItems.add(this.itemId);
  }
}

// TODO: This probably shouldn't need to be its own class...
export class LapsingTrainerItemReward extends TrainerItemReward {
  apply(): boolean {
    return globalScene.trainerItems.add(this.itemId, allTrainerItems[this.itemId].maxStackCount);
  }
}

export class TempStatStageBoosterRewardGenerator extends RewardGenerator<TempBattleStat> {
  public static readonly items: Record<TempBattleStat, string> = {
    [Stat.ATK]: "x_attack",
    [Stat.DEF]: "x_defense",
    [Stat.SPATK]: "x_sp_atk",
    [Stat.SPDEF]: "x_sp_def",
    [Stat.SPD]: "x_speed",
    [Stat.ACC]: "x_accuracy",
  };

  override getAvailableItems(exclusions?: ReadonlySet<string>): TempBattleStat[] {
    return TEMP_BATTLE_STATS.filter(stat => {
      const item = tempStatToTrainerItem[stat];
      return !exclusions?.has(`trainer:${item}`) && !globalScene.trainerItems.isMaxStack(item);
    });
  }

  override generateReward(pregenArgs?: TempBattleStat): LapsingTrainerItemReward {
    if (pregenArgs !== undefined) {
      return new LapsingTrainerItemReward(RewardId.TEMP_STAT_STAGE_BOOSTER, tempStatToTrainerItem[pregenArgs]);
    }
    const variants = this.getAvailableItems();
    const stat = variants.length > 0 ? randSeedItem(variants) : randSeedItem(TEMP_BATTLE_STATS);
    return new LapsingTrainerItemReward(RewardId.TEMP_STAT_STAGE_BOOSTER, tempStatToTrainerItem[stat]);
  }
}
