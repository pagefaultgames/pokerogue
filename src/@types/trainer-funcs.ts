import type { PartyMemberStrength } from "#enums/party-member-strength";
import type { SpeciesId } from "#enums/species-id";
import type { EnemyPokemon } from "#field/pokemon";
import type { TrainerConfig } from "#trainers/trainer-config";
import type { TrainerPartyTemplate } from "#trainers/trainer-party-template";
import type { TrainerItemConfiguration } from "./trainer-item-data-types";

export type PartyTemplateFunc = () => TrainerPartyTemplate;
export type PartyMemberFunc = (level: number, strength: PartyMemberStrength) => EnemyPokemon;
export type GenTrainerItemsFunc = (party: readonly EnemyPokemon[]) => TrainerItemConfiguration;
export type GenAIFunc = (party: readonly EnemyPokemon[]) => void;

export interface TrainerTierPools {
  [key: number]: (SpeciesId | SpeciesId[])[];
}
export interface TrainerConfigs {
  [key: number]: TrainerConfig;
}

export interface PartyMemberFuncs {
  [key: number]: PartyMemberFunc;
}
