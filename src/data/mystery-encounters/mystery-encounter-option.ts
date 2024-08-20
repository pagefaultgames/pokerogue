import { OptionTextDisplay } from "#app/data/mystery-encounters/mystery-encounter-dialogue";
import { Moves } from "#app/enums/moves";
import Pokemon, { PlayerPokemon } from "#app/field/pokemon";
import BattleScene from "#app/battle-scene";
import * as Utils from "#app/utils";
import { Type } from "../type";
import { EncounterPokemonRequirement, EncounterSceneRequirement, MoneyRequirement, TypeRequirement } from "./mystery-encounter-requirements";
import { CanLearnMoveRequirement, CanLearnMoveRequirementOptions } from "./requirements/can-learn-move-requirement";
import { isNullOrUndefined } from "#app/utils";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";


export type OptionPhaseCallback = (scene: BattleScene) => Promise<void | boolean>;

// export default interface MysteryEncounterOption {
//
// }

export default class MysteryEncounterOption {
  optionMode: MysteryEncounterOptionMode;
  hasDexProgress: boolean;
  requirements: EncounterSceneRequirement[];
  primaryPokemonRequirements: EncounterPokemonRequirement[];
  secondaryPokemonRequirements: EncounterPokemonRequirement[];
  primaryPokemon?: PlayerPokemon;
  secondaryPokemon?: PlayerPokemon[];
  excludePrimaryFromSecondaryRequirements: boolean;

  /**
   * Dialogue object containing all the dialogue, messages, tooltips, etc. for this option
   * Will be populated on MysteryEncounter initialization
   */
  dialogue?: OptionTextDisplay;

  /** Executes before any following dialogue or business logic from option. Usually this will be for calculating dialogueTokens or performing scene/data updates */
  onPreOptionPhase?: OptionPhaseCallback;
  /** Business logic function for option */
  onOptionPhase: OptionPhaseCallback;
  /** Executes after the encounter is over. Usually this will be for calculating dialogueTokens or performing data updates */
  onPostOptionPhase?: OptionPhaseCallback;

  constructor(option: MysteryEncounterOption) {
    Object.assign(this, option);
    this.hasDexProgress = !isNullOrUndefined(this.hasDexProgress) ? this.hasDexProgress : false;
    this.requirements = this.requirements ? this.requirements : [];
    this.primaryPokemonRequirements = this.primaryPokemonRequirements ? this.primaryPokemonRequirements : [];
    this.secondaryPokemonRequirements = this.secondaryPokemonRequirements ? this.secondaryPokemonRequirements : [];
  }

  hasRequirements() {
    return this.requirements.length > 0 || this.primaryPokemonRequirements.length > 0 || this.secondaryPokemonRequirements.length > 0;
  }

  meetsRequirements(scene: BattleScene) {
    return !this.requirements.some(requirement => !requirement.meetsRequirement(scene)) &&
      this.meetsSupportingRequirementAndSupportingPokemonSelected(scene) &&
      this.meetsPrimaryRequirementAndPrimaryPokemonSelected(scene);
  }

  pokemonMeetsPrimaryRequirements(scene: BattleScene, pokemon: Pokemon) {
    return !this.primaryPokemonRequirements.some(req => !req.queryParty(scene.getParty()).map(p => p.id).includes(pokemon.id));
  }

  meetsPrimaryRequirementAndPrimaryPokemonSelected(scene: BattleScene) {
    if (!this.primaryPokemonRequirements) {
      return true;
    }
    let qualified: PlayerPokemon[] = scene.getParty();
    for (const req of this.primaryPokemonRequirements) {
      if (req.meetsRequirement(scene)) {
        if (req instanceof EncounterPokemonRequirement) {
          qualified = qualified.filter(pkmn => req.queryParty(scene.getParty()).includes(pkmn));
        }
      } else {
        this.primaryPokemon = undefined;
        return false;
      }
    }

    if (qualified.length === 0) {
      return false;
    }

    if (this.excludePrimaryFromSecondaryRequirements && this.secondaryPokemon) {
      const truePrimaryPool: PlayerPokemon[] = [];
      const overlap: PlayerPokemon[] = [];
      for (const qp of qualified) {
        if (!this.secondaryPokemon.includes(qp)) {
          truePrimaryPool.push(qp);
        } else {
          overlap.push(qp);
        }

      }
      if (truePrimaryPool.length > 0) {
        // always choose from the non-overlapping pokemon first
        this.primaryPokemon = truePrimaryPool[Utils.randSeedInt(truePrimaryPool.length, 0)];
        return true;
      } else {
        // if there are multiple overlapping pokemon, we're okay - just choose one and take it out of the supporting pokemon pool
        if (overlap.length > 1 || (this.secondaryPokemon.length - overlap.length >= 1)) {
          // is this working?
          this.primaryPokemon = overlap[Utils.randSeedInt(overlap.length, 0)];
          this.secondaryPokemon = this.secondaryPokemon.filter((supp) => supp !== this.primaryPokemon);
          return true;
        }
        console.log("Mystery Encounter Edge Case: Requirement not met due to primay pokemon overlapping with support pokemon. There's no valid primary pokemon left.");
        return false;
      }
    } else {
      // Just pick the first qualifying Pokemon
      this.primaryPokemon = qualified[0];
      return true;
    }
  }

  meetsSupportingRequirementAndSupportingPokemonSelected(scene: BattleScene) {
    if (!this.secondaryPokemonRequirements) {
      this.secondaryPokemon = [];
      return true;
    }

    let qualified: PlayerPokemon[] = scene.getParty();
    for (const req of this.secondaryPokemonRequirements) {
      if (req.meetsRequirement(scene)) {
        if (req instanceof EncounterPokemonRequirement) {
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

const baseOption = {
  optionMode: MysteryEncounterOptionMode.DEFAULT,
  hasDexProgress: false,
  requirements: [],
  primaryPokemonRequirements: [],
  secondaryPokemonRequirements: [],
  excludePrimaryFromSecondaryRequirements: true,
};

/* Picks non-optional fields from an "object" type alias and returns a union of literal types (keys) */
type PickNonOptionalFieldsKeys<T> = Exclude<{ [K in Keys<T>]: T extends Record<K, T[K]> ? K : never; }[Keys<T>], undefined>;
// type NonFunctionFieldsKeys<T> = { [K in Keys<T>]: T[K] extends Function ? never : K; }[Keys<T>];
// type FunctionPropertyKeys<T> = { [K in Keys<T>]: T[K] extends Function ? K : never; }[Keys<T>];
/* Extracts keys from T */
type Keys<T> = keyof T;
/* Filters out all optional fields from an "object" type alias, and all function fields */
type PickNonOptionalFields<T> = Pick<T, PickNonOptionalFieldsKeys<T>>;
/* Omits keys that exist in the base object and optional keys on MysteryEncounter, as well as functions on MysteryEncounter */
type OmitBaseAndOptionalKeys<T, B> = Omit<PickNonOptionalFields<T>, Keys<B>>;

export class MysteryEncounterOptionBuilder implements Partial<MysteryEncounterOption> {
  optionMode: MysteryEncounterOptionMode;
  requirements: EncounterSceneRequirement[] = [];
  primaryPokemonRequirements: EncounterPokemonRequirement[] = [];
  secondaryPokemonRequirements: EncounterPokemonRequirement[] = [];
  excludePrimaryFromSecondaryRequirements: boolean;
  isDisabledOnRequirementsNotMet: boolean;
  hasDexProgress: boolean;
  onPreOptionPhase?: OptionPhaseCallback;
  onOptionPhase: OptionPhaseCallback;
  onPostOptionPhase?: OptionPhaseCallback;
  dialogue: OptionTextDisplay;

  static newOptionWithMode(optionMode: MysteryEncounterOptionMode): MysteryEncounterOptionBuilder & OmitBaseAndOptionalKeys<MysteryEncounterOption, typeof baseOption> & Pick<MysteryEncounterOption, "optionMode"> {
    return Object.assign(new MysteryEncounterOptionBuilder(), { ...baseOption, optionMode });
  }

  withHasDexProgress(hasDexProgress: boolean): this & Required<Pick<MysteryEncounterOption, "hasDexProgress">> {
    return Object.assign(this, { hasDexProgress: hasDexProgress });
  }

  withSceneRequirement(requirement: EncounterSceneRequirement): this & Required<Pick<MysteryEncounterOption, "requirements">> {
    if (requirement instanceof EncounterPokemonRequirement) {
      Error("Incorrectly added pokemon requirement as scene requirement.");
    }

    this.requirements.push(requirement);
    return Object.assign(this, { requirements: this.requirements });
  }

  withSceneMoneyRequirement(requiredMoney: number, scalingMultiplier?: number) {
    return this.withSceneRequirement(new MoneyRequirement(requiredMoney, scalingMultiplier));
  }

  withPreOptionPhase(onPreOptionPhase: OptionPhaseCallback): this & Required<Pick<MysteryEncounterOption, "onPreOptionPhase">> {
    return Object.assign(this, { onPreOptionPhase: onPreOptionPhase });
  }

  withOptionPhase(onOptionPhase: OptionPhaseCallback): this & Required<Pick<MysteryEncounterOption, "onOptionPhase">> {
    return Object.assign(this, { onOptionPhase: onOptionPhase });
  }

  withPostOptionPhase(onPostOptionPhase: OptionPhaseCallback): this & Required<Pick<MysteryEncounterOption, "onPostOptionPhase">> {
    return Object.assign(this, { onPostOptionPhase: onPostOptionPhase });
  }

  withPrimaryPokemonRequirement(requirement: EncounterPokemonRequirement): this & Required<Pick<MysteryEncounterOption, "primaryPokemonRequirements">> {
    if (requirement instanceof EncounterSceneRequirement) {
      Error("Incorrectly added scene requirement as pokemon requirement.");
    }

    this.primaryPokemonRequirements.push(requirement);
    return Object.assign(this, { primaryPokemonRequirements: this.primaryPokemonRequirements });
  }

  /**
   * Player is required to have certain type/s of pokemon in his party (with optional min number of pokemons with that type)
   *
   * @param type the required type/s
   * @param excludeFainted whether to exclude fainted pokemon
   * @param minNumberOfPokemon number of pokemons to have that type
   * @param invertQuery
   * @returns
   */
  withPokemonTypeRequirement(type: Type | Type[], excludeFainted?: boolean, minNumberOfPokemon?: number, invertQuery?: boolean) {
    return this.withPrimaryPokemonRequirement(new TypeRequirement(type, excludeFainted, minNumberOfPokemon, invertQuery));
  }

  /**
   * Player is required to have a pokemon that can learn a certain move/moveset
   *
   * @param move the required move/moves
   * @param options see {@linkcode CanLearnMoveRequirementOptions}
   * @returns
   */
  withPokemonCanLearnMoveRequirement(move: Moves | Moves[], options?: CanLearnMoveRequirementOptions) {
    return this.withPrimaryPokemonRequirement(new CanLearnMoveRequirement(move, options));
  }

  withSecondaryPokemonRequirement(requirement: EncounterPokemonRequirement, excludePrimaryFromSecondaryRequirements: boolean = true): this & Required<Pick<MysteryEncounterOption, "secondaryPokemonRequirements">> {
    if (requirement instanceof EncounterSceneRequirement) {
      Error("Incorrectly added scene requirement as pokemon requirement.");
    }

    this.secondaryPokemonRequirements.push(requirement);
    this.excludePrimaryFromSecondaryRequirements = excludePrimaryFromSecondaryRequirements;
    return Object.assign(this, { secondaryPokemonRequirements: this.secondaryPokemonRequirements });
  }

  /**
   * Se the full dialogue object to the option. Will override anything already set
   *
   * @param dialogue see {@linkcode OptionTextDisplay}
   * @returns
   */
  withDialogue(dialogue: OptionTextDisplay) {
    this.dialogue = dialogue;
    return this;
  }

  build(this: MysteryEncounterOption) {
    return new MysteryEncounterOption(this);
  }
}
