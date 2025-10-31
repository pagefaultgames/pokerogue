import { globalScene } from "#app/global-scene";
import { allTrainerItems } from "#data/data-lists";
import { Stat, TEMP_BATTLE_STATS, type TempBattleStat } from "#enums/stat";
import type { TrainerItemId } from "#enums/trainer-item-id";
import { Reward, RewardGenerator } from "#items/reward";
import { tempStatToTrainerItem } from "#items/x-items";
import { randSeedItem } from "#utils/common";

export class TrainerItemReward extends Reward {
  // TODO: This should not be public
  public itemId: TrainerItemId;
  constructor(itemId: TrainerItemId, group?: string) {
    super("", "", group, "se/restore");
    this.itemId = itemId;
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

export class LapsingTrainerItemReward extends TrainerItemReward {
  apply(): boolean {
    return globalScene.trainerItems.add(this.itemId, allTrainerItems[this.itemId].getMaxStackCount());
  }
}

export class TempStatStageBoosterRewardGenerator extends RewardGenerator {
  public static readonly items: Record<TempBattleStat, string> = {
    [Stat.ATK]: "x_attack",
    [Stat.DEF]: "x_defense",
    [Stat.SPATK]: "x_sp_atk",
    [Stat.SPDEF]: "x_sp_def",
    [Stat.SPD]: "x_speed",
    [Stat.ACC]: "x_accuracy",
  };

  override generateReward(pregenArgs?: TempBattleStat) {
    return new LapsingTrainerItemReward(tempStatToTrainerItem[pregenArgs ?? randSeedItem(TEMP_BATTLE_STATS)]);
  }
}
