import { globalScene } from "#app/global-scene";
import { allTrainerItems } from "#data/data-lists";
import { Stat, TEMP_BATTLE_STATS, type TempBattleStat } from "#enums/stat";
import { TrainerItemId } from "#enums/trainer-item-id";
import { Reward, RewardGenerator } from "#items/reward";
import { tempStatToTrainerItem } from "#items/x-items";

/**
 * Trainer items that lapse over battles; rewarding one grants a full stack (i.e. its full duration).
 * TODO: Derive this from the trainer item definitions if they gain a "lapsing" flag
 */
const LAPSING_TRAINER_ITEMS: ReadonlySet<TrainerItemId> = new Set<TrainerItemId>([
  TrainerItemId.LURE,
  TrainerItemId.SUPER_LURE,
  TrainerItemId.MAX_LURE,
  TrainerItemId.X_ATTACK,
  TrainerItemId.X_DEFENSE,
  TrainerItemId.X_SP_ATK,
  TrainerItemId.X_SP_DEF,
  TrainerItemId.X_SPEED,
  TrainerItemId.X_ACCURACY,
  TrainerItemId.DIRE_HIT,
]);

/** A reward granting a trainer item to the player. */
export class TrainerItemReward extends Reward<TrainerItemId> {
  constructor(itemId: TrainerItemId) {
    super(itemId);
  }

  /**
   * The {@linkcode TrainerItemId} granted by this reward.
   * @deprecated Alias of {@linkcode id}, kept until external callsites are migrated.
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

  /** Lapsing items are granted as a full stack (i.e. full duration); all others add a single stack. */
  apply(): boolean {
    const count = LAPSING_TRAINER_ITEMS.has(this.id) ? allTrainerItems[this.id].maxStackCount : 1;
    return globalScene.trainerItems.add(this.id, count);
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

  public override getAllAvailableItems(): TempBattleStat[] {
    return TEMP_BATTLE_STATS.filter(stat => {
      const item = tempStatToTrainerItem[stat];
      return !globalScene.trainerItems.isMaxStack(item);
    });
  }

  protected override getEntry(reward: Reward): TempBattleStat | null {
    if (reward instanceof TrainerItemReward) {
      for (const [stat, item] of Object.entries(tempStatToTrainerItem)) {
        if (item === reward.id) {
          return Number(stat) as TempBattleStat;
        }
      }
    }
    return null;
  }

  override generateReward(stat: TempBattleStat): TrainerItemReward {
    return new TrainerItemReward(tempStatToTrainerItem[stat]);
  }
}
