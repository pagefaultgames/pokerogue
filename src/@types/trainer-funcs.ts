import type { PartyMemberStrength } from "#enums/party-member-strength";
import type { SpeciesId } from "#enums/species-id";
import type { EnemyPokemon } from "#field/pokemon";
import type { PersistentModifier } from "#modifiers/modifier";
import type { TrainerConfig } from "#trainers/trainer-config";
import type { TrainerPartyTemplate } from "#trainers/trainer-party-template";

export type PartyTemplateFunc = () => TrainerPartyTemplate;
export type PartyMemberFunc = (level: number, strength: PartyMemberStrength) => EnemyPokemon;
export type GenModifiersFunc = (party: EnemyPokemon[]) => PersistentModifier[];
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
