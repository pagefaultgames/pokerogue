import type { Ability } from "#abilities/ability";
import type { PokemonSpecies } from "#data/pokemon-species";
import type { HeldItemId } from "#enums/held-item-id";
import type { RewardId } from "#enums/reward-id";
import type { TrainerItemId } from "#enums/trainer-item-id";
import type { HeldItem } from "#items/held-item";
import type { Reward, RewardGenerator } from "#items/reward";
import type { TrainerItem } from "#items/trainer-item";
import type { Move } from "#moves/move";

export const allAbilities: Ability[] = [];
export const allMoves: Move[] = [];
export const allSpecies: PokemonSpecies[] = [];

export const allHeldItems: Record<HeldItemId, HeldItem> = {};
export const allTrainerItems: Record<TrainerItemId, TrainerItem> = {};
export const allRewards: Record<RewardId, Reward | RewardGenerator> = {};
