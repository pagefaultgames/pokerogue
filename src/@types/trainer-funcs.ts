import type { PartyMemberStrength } from "#enums/party-member-strength";
import type { SpeciesId } from "#enums/species-id";
import type { EnemyPokemon } from "#field/pokemon";
import type { TrainerItemConfiguration } from "#items/trainer-item-data-types";
import type { TrainerPartyTemplate } from "#trainers/TrainerPartyTemplate";
import type { TrainerConfig } from "#trainers/trainer-config";

export type PartyTemplateFunc = () => TrainerPartyTemplate;
export type PartyMemberFunc = (level: number, strength: PartyMemberStrength) => EnemyPokemon;
export type GenTrainerItemsFunc = (party: EnemyPokemon[]) => TrainerItemConfiguration;
export type GenAIFunc = (party: EnemyPokemon[]) => void;

export interface TrainerTierPools {
  [key: number]: SpeciesId[];
}
export interface TrainerConfigs {
  [key: number]: TrainerConfig;
}

export interface PartyMemberFuncs {
  [key: number]: PartyMemberFunc;
}
