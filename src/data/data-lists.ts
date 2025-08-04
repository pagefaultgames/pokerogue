import type { Ability } from "#abilities/ability";
import type { PokemonSpecies } from "#data/pokemon-species";
import type { HeldItemId } from "#enums/held-item-id";
import type { TrainerItemId } from "#enums/trainer-item-id";
import type { HeldItem } from "#items/held-item";
import type { TrainerItem } from "#items/trainer-item";
import type { Move } from "#moves/move";
import type { allRewardsType } from "#types/all-reward-type";

export const allAbilities: Ability[] = [];
export const allMoves: Move[] = [];
export const allSpecies: PokemonSpecies[] = [];

export const allHeldItems: Record<HeldItemId, HeldItem> = {};
export const allTrainerItems: Record<TrainerItemId, TrainerItem> = {};
// TODO: Consider moving into `all-rewards.ts` as a const object - files should not be importing this
export const allRewards: allRewardsType = {};
