import type { PokeballCounts } from "#app/battle-scene";
import type { Tutorial } from "#app/tutorial";
import type { BattleType } from "#enums/battle-type";
import type { GameModes } from "#enums/game-modes";
import type { MoveId } from "#enums/move-id";
import type { MysteryEncounterType } from "#enums/mystery-encounter-type";
import type { Nature } from "#enums/nature";
import type { PlayerGender } from "#enums/player-gender";
import type { PokemonType } from "#enums/pokemon-type";
import type { SpeciesId } from "#enums/species-id";
import type { MysteryEncounterSaveData } from "#mystery-encounters/mystery-encounter-save-data";
import type { Variant } from "#sprites/variant";
import type { ArenaData } from "#system/arena-data";
import type { ChallengeData } from "#system/challenge-data";
import type { EggData } from "#system/egg-data";
import type { GameStats } from "#system/game-stats";
import type { ModifierData } from "#system/modifier-data";
import type { PokemonData } from "#system/pokemon-data";
import type { TrainerData } from "#system/trainer-data";
import type { DexData } from "./dex-data";

export interface SystemSaveData {
  trainerId: number;
  secretId: number;
  gender: PlayerGender;
  dexData: DexData;
  starterData: StarterData;
  gameStats: GameStats;
  unlocks: Unlocks;
  achvUnlocks: AchvUnlocks;
  voucherUnlocks: VoucherUnlocks;
  voucherCounts: VoucherCounts;
  eggs: EggData[];
  gameVersion: string;
  timestamp: number;
  eggPity: number[];
  unlockPity: number[];
}

export interface SessionSaveData {
  seed: string;
  playTime: number;
  gameMode: GameModes;
  party: PokemonData[];
  enemyParty: PokemonData[];
  modifiers: ModifierData[];
  enemyModifiers: ModifierData[];
  arena: ArenaData;
  pokeballCounts: PokeballCounts;
  money: number;
  score: number;
  waveIndex: number;
  battleType: BattleType;
  trainer: TrainerData;
  gameVersion: string;
  /** The player-chosen name of the run */
  name: string;
  timestamp: number;
  challenges: ChallengeData[];
  mysteryEncounterType: MysteryEncounterType | -1; // Only defined when current wave is ME,
  mysteryEncounterSaveData: MysteryEncounterSaveData;
  /**
   * Counts the amount of pokemon fainted in your party during the current arena encounter.
   */
  playerFaints: number;
}

export interface Unlocks {
  [key: number]: boolean;
}

export interface AchvUnlocks {
  [key: string]: number;
}

export interface VoucherUnlocks {
  [key: string]: number;
}

export interface VoucherCounts {
  [type: string]: number;
}

export type StarterMoveset = [MoveId] | [MoveId, MoveId] | [MoveId, MoveId, MoveId] | [MoveId, MoveId, MoveId, MoveId];

export interface StarterFormMoveData {
  [key: number]: StarterMoveset;
}

export interface StarterMoveData {
  [key: number]: StarterMoveset | StarterFormMoveData;
}

export interface StarterAttributes {
  nature?: number;
  ability?: number;
  variant?: number;
  form?: number;
  female?: boolean;
  shiny?: boolean;
  favorite?: boolean;
  nickname?: string;
  tera?: PokemonType;
}

export interface DexAttrProps {
  shiny: boolean;
  female: boolean;
  variant: Variant;
  formIndex: number;
}

export interface Starter {
  speciesId: SpeciesId;
  shiny: boolean;
  variant: Variant;
  formIndex: number;
  female?: boolean;
  abilityIndex: number;
  passive: boolean;
  nature: Nature;
  moveset?: StarterMoveset;
  pokerus: boolean;
  nickname?: string;
  teraType?: PokemonType;
  ivs: number[];
}

export type RunHistoryData = Record<number, RunEntry>;

export interface RunEntry {
  entry: SessionSaveData;
  isVictory: boolean;
  /*Automatically set to false at the moment - implementation TBD*/
  isFavorite: boolean;
}

export interface StarterDataEntry {
  moveset: StarterMoveset | StarterFormMoveData | null;
  eggMoves: number;
  candyCount: number;
  friendship: number;
  abilityAttr: number;
  passiveAttr: number;
  valueReduction: number;
  classicWinCount: number;
}

export interface StarterData {
  [key: number]: StarterDataEntry;
}

// TODO: Rework into a bitmask
export type TutorialFlags = {
  [key in Tutorial]: boolean;
};

// TODO: Rework into a bitmask
export interface SeenDialogues {
  [key: string]: boolean;
}
