import { globalScene } from "#app/global-scene";
import { allTrainerItems } from "#data/data-lists";
import { Stat, TEMP_BATTLE_STATS, type TempBattleStat } from "#enums/stat";
import type { TrainerItemId } from "#enums/trainer-item-id";
import { Reward, RewardGenerator } from "#items/reward";
import { tempStatToTrainerItem } from "#items/x-items";

/** A reward granting a single trainer item to the player. */
export class TrainerItemReward extends Reward<TrainerItemId> {
  constructor(itemId: TrainerItemId) {
    // Display strings and icon are sourced from the trainer item itself (see getters below)
    super(itemId, "", "", "se/restore");
  }

  /**
   * The {@linkcode TrainerItemId} granted by this reward.
   * @deprecated Alias of {@linkcode id}; kept until external callsites are migrated.
   */
  public get itemId(): TrainerItemId {
    return this.id;
  }

  override get name(): string {
    return allTrainerItems[this.id].name;
  }

  override get description(): string {
    return allTrainerItems[this.id].description;
  }

  override get iconName(): string {
    return allTrainerItems[this.id].iconName;
  }

  apply(): boolean {
    return globalScene.trainerItems.add(this.id);
  }
}

/** A trainer item reward granting a full stack (i.e. full duration) of a lapsing trainer item. */
// TODO: This probably shouldn't need to be its own class...
export class LapsingTrainerItemReward extends TrainerItemReward {
  override apply(): boolean {
    return globalScene.trainerItems.add(this.id, allTrainerItems[this.id].maxStackCount);
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
      return !exclusions?.has(Reward.getMatchKey(item)) && !globalScene.trainerItems.isMaxStack(item);
    });
  }

  override generateReward(stat: TempBattleStat): LapsingTrainerItemReward {
    return new LapsingTrainerItemReward(tempStatToTrainerItem[stat]);
  }
}
