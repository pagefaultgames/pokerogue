import { PlayerPokemon } from "#app/field/pokemon";
import * as Utils from "../utils";
import BattleScene from "../battle-scene";
import { EncounterPokemonRequirement, EncounterSceneRequirement } from "./mystery-encounter-requirements";
import {OptionTextDisplay} from "#app/data/mystery-encounters/dialogue/mystery-encounter-dialogue";

export default interface MysteryEncounterOption {
  requirements?: EncounterSceneRequirement[];
  primaryPokemonRequirements?: EncounterPokemonRequirement[];
  secondaryPokemonRequirements ?: EncounterPokemonRequirement[];
  primaryPokemon?: PlayerPokemon;
  secondaryPokemon?: PlayerPokemon[];
  excludePrimaryFromSecondaryRequirements?: boolean;

  /**
   * Dialogue object containing all the dialogue, messages, tooltips, etc. for this option
   * Will be populated on MysteryEncounter initialization
   */
  dialogue?: OptionTextDisplay;

  // Executes before any following dialogue or business logic from option. Usually this will be for calculating dialogueTokens or performing scene/data updates
  onPreOptionPhase?: (scene: BattleScene) => Promise<void | boolean>;
  // Business logic for option
  onOptionPhase?: (scene: BattleScene) => Promise<void | boolean>;
  // Executes after the encounter is over. Usually this will be for calculating dialogueTokens or performing data updates
  onPostOptionPhase?: (scene: BattleScene) => Promise<void | boolean>;
}

export default class MysteryEncounterOption implements MysteryEncounterOption {
  constructor(option: MysteryEncounterOption) {
    Object.assign(this, option);
    this.requirements = this.requirements ? this.requirements : [];
  }

  meetsRequirements?(scene: BattleScene) {
    return !this.requirements.some(requirement => !requirement.meetsRequirement(scene)) &&
      this.meetsPrimaryRequirementAndPrimaryPokemonSelected(scene) &&
      this.meetsSupportingRequirementAndSupportingPokemonSelected(scene);
  }
  meetsPrimaryRequirementAndPrimaryPokemonSelected?(scene: BattleScene) {
    if (!this.primaryPokemonRequirements) {
      return true;
    }
    let qualified:PlayerPokemon[] = scene.getParty();
    for (const req of this.primaryPokemonRequirements) {
      console.log(req);
      if (req.meetsRequirement(scene)) {
        if (req instanceof EncounterPokemonRequirement)  {
          qualified = qualified.filter(pkmn => req.queryParty(scene.getParty()).includes(pkmn));
        }
      } else {
        this.primaryPokemon = null;
        return false;
      }
    }

    if (qualified.length === 0) {
      return false;
    }

    if (this.excludePrimaryFromSecondaryRequirements && this.secondaryPokemon) {
      const truePrimaryPool = [];
      const overlap = [];
      for (const qp of qualified) {
        if (!this.secondaryPokemon.includes(qp)) {
          truePrimaryPool.push(qp);
        } else {
          overlap.push(qp);
        }

      }
      if (truePrimaryPool.length > 0) {
        // always choose from the non-overlapping pokemon first
        this.primaryPokemon =  truePrimaryPool[Utils.randSeedInt(truePrimaryPool.length, 0)];
        return true;
      } else {
        // if there are multiple overlapping pokemon, we're okay - just choose one and take it out of the supporting pokemon pool
        if (overlap.length > 1 || (this.secondaryPokemon.length - overlap.length >= 1)) {
          // is this working?
          this.primaryPokemon = overlap[Utils.randSeedInt(overlap.length, 0)];
          this.secondaryPokemon = this.secondaryPokemon.filter((supp)=> supp !== this.primaryPokemon);
          return true;
        }
        console.log("Mystery Encounter Edge Case: Requirement not met due to primay pokemon overlapping with support pokemon. There's no valid primary pokemon left.");
        return false;
      }
    } else {
      // this means we CAN have the same pokemon be a primary and secondary pokemon, so just choose any qualifying one randomly.
      this.primaryPokemon = qualified[Utils.randSeedInt(qualified.length, 0)];
      return true;
    }
  }

  meetsSupportingRequirementAndSupportingPokemonSelected?(scene: BattleScene) {
    if (!this.secondaryPokemonRequirements) {
      this.secondaryPokemon = [];
      return true;
    }

    let qualified:PlayerPokemon[] = scene.getParty();
    for (const req of this.secondaryPokemonRequirements) {
      if (req.meetsRequirement(scene)) {
        if (req instanceof EncounterPokemonRequirement)  {
          qualified = qualified.filter(pkmn => req.queryParty(scene.getParty()).includes(pkmn));

        }
      } else {
        this.secondaryPokemon = [];
        return false;
      }
    }
    this.secondaryPokemon = qualified;
    return true;
  }
}


export class MysteryEncounterOptionBuilder implements Partial<MysteryEncounterOption> {
  requirements?: EncounterSceneRequirement[] = [];
  primaryPokemonRequirements?: EncounterPokemonRequirement[] = [];
  secondaryPokemonRequirements ?: EncounterPokemonRequirement[] = [];
  excludePrimaryFromSecondaryRequirements?: boolean;
  onPreOptionPhase?: (scene: BattleScene) => Promise<void | boolean>;
  onOptionPhase?: (scene: BattleScene) => Promise<void | boolean>;
  onPostOptionPhase?: (scene: BattleScene) => Promise<void | boolean>;

  withSceneRequirement(requirement: EncounterSceneRequirement): this & Required<Pick<MysteryEncounterOption, "requirements">> {
    this.requirements.push(requirement);
    return Object.assign(this, { requirements: this.requirements });
  }

  withPreOptionPhase(onPreOptionPhase: (scene: BattleScene) => Promise<void | boolean>): this & Required<Pick<MysteryEncounterOption, "onPreOptionPhase">> {
    return Object.assign(this, { onPreOptionPhase: onPreOptionPhase });
  }

  withOptionPhase(onOptionPhase: (scene: BattleScene) => Promise<void | boolean>): this & Required<Pick<MysteryEncounterOption, "onOptionPhase">> {
    return Object.assign(this, { onOptionPhase: onOptionPhase });
  }

  withPostOptionPhase(onPostOptionPhase: (scene: BattleScene) => Promise<void | boolean>): this & Required<Pick<MysteryEncounterOption, "onPostOptionPhase">> {
    return Object.assign(this, { onPostOptionPhase: onPostOptionPhase });
  }

  build(this: MysteryEncounterOption) {
    return new MysteryEncounterOption(this);
  }

  withPrimaryPokemonRequirement(requirement: EncounterPokemonRequirement): this & Required<Pick<MysteryEncounterOption, "primaryPokemonRequirements">> {
    this.primaryPokemonRequirements.push(requirement);
    return Object.assign(this, { primaryPokemonRequirements: this.primaryPokemonRequirements });
  }

  withSecondaryPokemonRequirement(requirement: EncounterPokemonRequirement,   excludePrimaryFromSecondaryRequirements?: boolean): this & Required<Pick<MysteryEncounterOption, "secondaryPokemonRequirements">> {
    this.secondaryPokemonRequirements.push(requirement);
    this.excludePrimaryFromSecondaryRequirements = excludePrimaryFromSecondaryRequirements;
    return Object.assign(this, { secondaryPokemonRequirements: this.secondaryPokemonRequirements });
  }
}
