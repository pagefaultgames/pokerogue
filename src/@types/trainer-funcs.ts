import type { EnemyPokemon } from "#app/field/pokemon";
import type { TrainerItemConfiguration } from "#app/items/trainer-item-data-types";
import type { PartyMemberStrength } from "#enums/party-member-strength";
import type { SpeciesId } from "#enums/species-id";
import type { TrainerConfig } from "../data/trainers/trainer-config";
import type { TrainerPartyTemplate } from "../data/trainers/TrainerPartyTemplate";

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
