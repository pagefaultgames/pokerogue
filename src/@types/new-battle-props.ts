// biome-ignore lint/correctness/noUnusedImports: TSDoc
import type { BattleScene } from "#app/battle-scene";
import type { BattleType } from "#enums/battle-type";
import type { MysteryEncounterType } from "#enums/mystery-encounter-type";
import type { Trainer } from "#field/trainer";
import type { TrainerData } from "#system/trainer-data";

/** Interface representing the base type of a new battle config, used for DRY. */
interface NewBattleBaseProps {
  battleType: BattleType;
  trainer?: Trainer;
  trainerData?: TrainerData;
  mysteryEncounterType?: MysteryEncounterType;
  waveIndex: number;
  double?: boolean;
}

/**
 * Interface representing the resolved type of a new battle config, used after creating a new Battle.
 * @interface
 */
export type NewBattleResolvedProps = Omit<NewBattleBaseProps, "trainerConfig" | "trainerData" | "mysteryEncounterType">;

/**
 * Interface representing the return type of {@linkcode BattleScene.getNewBattleProps}, used
 * while creating a new battle.
 * @interface
 */
export type NewBattleProps = Omit<NewBattleBaseProps, "trainer">;
