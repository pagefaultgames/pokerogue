import type { EnemyPokemon } from "#app/field/pokemon";
import type { PersistentModifier } from "#app/modifier/modifier";
import type { PartyMemberStrength } from "#enums/party-member-strength";
import type { Species } from "#enums/species";

export type PartyTemplateFunc = () => TrainerPartyTemplate;
export type PartyMemberFunc = (level: number, strength: PartyMemberStrength) => EnemyPokemon;
export type GenModifiersFunc = (party: EnemyPokemon[]) => PersistentModifier[];
export type GenAIFunc = (party: EnemyPokemon[]) => void;

export interface TrainerTierPools {
  [key: number]: Species[];
}

export interface PartyMemberFuncs {
  [key: number]: PartyMemberFunc;
}

export class TrainerPartyTemplate {
  public size: number;
  public strength: PartyMemberStrength;
  public sameSpecies: boolean;
  public balanced: boolean;

  constructor(size: number, strength: PartyMemberStrength, sameSpecies?: boolean, balanced?: boolean) {
    this.size = size;
    this.strength = strength;
    this.sameSpecies = !!sameSpecies;
    this.balanced = !!balanced;
  }

  getStrength(_index: number): PartyMemberStrength {
    return this.strength;
  }

  isSameSpecies(_index: number): boolean {
    return this.sameSpecies;
  }

  isBalanced(_index: number): boolean {
    return this.balanced;
  }
}
