import { OptionTextDisplay } from "#app/data/mystery-encounters/mystery-encounter-dialogue";
import { Moves } from "#app/enums/moves";
import Pokemon, { PlayerPokemon } from "#app/field/pokemon";
import BattleScene from "#app/battle-scene";
import { Type } from "../type";
import { EncounterPokemonRequirement, EncounterSceneRequirement, MoneyRequirement, TypeRequirement } from "#app/data/mystery-encounters/mystery-encounter-requirements";
import { CanLearnMoveRequirement, CanLearnMoveRequirementOptions } from "./requirements/can-learn-move-requirement";
import { isNullOrUndefined, randSeedInt } from "#app/utils";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";


export type OptionPhaseCallback = (scene: BattleScene) => Promise<void | boolean>;

/**
 * Used by {@linkcode MysteryEncounterOptionBuilder} class to define required/optional properties on the {@linkcode MysteryEncounterOption} class when building.
 *
 * Should ONLY contain properties that are necessary for {@linkcode MysteryEncounterOption} construction.
 * Post-construct and flag data properties are defined in the {@linkcode MysteryEncounterOption} class itself.
 */
export interface IMysteryEncounterOption {
  optionMode: MysteryEncounterOptionMode;
  hasDexProgress: boolean;
  requirements: EncounterSceneRequirement[];
  primaryPokemonRequirements: EncounterPokemonRequirement[];
  secondaryPokemonRequirements: EncounterPokemonRequirement[];
  excludePrimaryFromSecondaryRequirements: boolean;

  dialogue?: OptionTextDisplay;

  onPreOptionPhase?: OptionPhaseCallback;
  onOptionPhase: OptionPhaseCallback;
  onPostOptionPhase?: OptionPhaseCallback;
}

export default class MysteryEncounterOption implements IMysteryEncounterOption {
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
   * Will be populated on {@linkcode MysteryEncounter} initialization
   */
  dialogue?: OptionTextDisplay;

  /** Executes before any following dialogue or business logic from option. Usually this will be for calculating dialogueTokens or performing scene/data updates */
  onPreOptionPhase?: OptionPhaseCallback;
  /** Business logic function for option */
  onOptionPhase: OptionPhaseCallback;
  /** Executes after the encounter is over. Usually this will be for calculating dialogueTokens or performing data updates */
  onPostOptionPhase?: OptionPhaseCallback;

  constructor(option: IMysteryEncounterOption | null) {
    if (!isNullOrUndefined(option)) {
      Object.assign(this, option);
    }
    this.hasDexProgress = this.hasDexProgress ?? false;
    this.requirements = this.requirements ?? [];
    this.primaryPokemonRequirements = this.primaryPokemonRequirements ?? [];
    this.secondaryPokemonRequirements = this.secondaryPokemonRequirements ?? [];
  }

  /**
   * Returns true if option contains any {@linkcode EncounterRequirement}s, false otherwise.
   */
  hasRequirements(): boolean {
    return this.requirements.length > 0 || this.primaryPokemonRequirements.length > 0 || this.secondaryPokemonRequirements.length > 0;
  }

  /**
   * Returns true if all {@linkcode EncounterRequirement}s for the option are met
   * @param scene
   */
  meetsRequirements(scene: BattleScene): boolean {
    return !this.requirements.some(requirement => !requirement.meetsRequirement(scene))
      && this.meetsSupportingRequirementAndSupportingPokemonSelected(scene)
      && this.meetsPrimaryRequirementAndPrimaryPokemonSelected(scene);
  }

  /**
   * Returns true if all PRIMARY {@linkcode EncounterRequirement}s for the option are met
   * @param scene
   * @param pokemon
   */
  pokemonMeetsPrimaryRequirements(scene: BattleScene, pokemon: Pokemon): boolean {
    return !this.primaryPokemonRequirements.some(req => !req.queryParty(scene.getParty()).map(p => p.id).includes(pokemon.id));
  }

  /**
   * Returns true if all PRIMARY {@linkcode EncounterRequirement}s for the option are met,
   * AND there is a valid Pokemon assigned to {@linkcode primaryPokemon}.
   * If both {@linkcode primaryPokemonRequirements} and {@linkcode secondaryPokemonRequirements} are defined,
   * can cause scenarios where there are not enough Pokemon that are sufficient for all requirements.
   * @param scene
   */
  meetsPrimaryRequirementAndPrimaryPokemonSelected(scene: BattleScene): boolean {
    if (!this.primaryPokemonRequirements || this.primaryPokemonRequirements.length === 0) {
      return true;
    }
    let qualified: PlayerPokemon[] = scene.getParty();
    for (const req of this.primaryPokemonRequirements) {
      if (req.meetsRequirement(scene)) {
        const queryParty = req.queryParty(scene.getParty());
        qualified = qualified.filter(pkmn => queryParty.includes(pkmn));
      } else {
        this.primaryPokemon = undefined;
        return false;
      }
    }

    if (qualified.length === 0) {
      return false;
    }

    if (this.excludePrimaryFromSecondaryRequirements && this.secondaryPokemon && this.secondaryPokemon.length > 0) {
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
        this.primaryPokemon = truePrimaryPool[randSeedInt(truePrimaryPool.length)];
        return true;
      } else {
        // if there are multiple overlapping pokemon, we're okay - just choose one and take it out of the supporting pokemon pool
        if (overlap.length > 1 || (this.secondaryPokemon.length - overlap.length >= 1)) {
          this.primaryPokemon = overlap[randSeedInt(overlap.length)];
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

  /**
   * Returns true if all SECONDARY {@linkcode EncounterRequirement}s for the option are met,
   * AND there is a valid Pokemon assigned to {@linkcode secondaryPokemon} (if applicable).
   * If both {@linkcode primaryPokemonRequirements} and {@linkcode secondaryPokemonRequirements} are defined,
   * can cause scenarios where there are not enough Pokemon that are sufficient for all requirements.
   * @param scene
   */
  meetsSupportingRequirementAndSupportingPokemonSelected(scene: BattleScene): boolean {
    if (!this.secondaryPokemonRequirements || this.secondaryPokemonRequirements.length === 0) {
      this.secondaryPokemon = [];
      return true;
    }

    let qualified: PlayerPokemon[] = scene.getParty();
    for (const req of this.secondaryPokemonRequirements) {
      if (req.meetsRequirement(scene)) {
        const queryParty = req.queryParty(scene.getParty());
        qualified = qualified.filter(pkmn => queryParty.includes(pkmn));
      } else {
        this.secondaryPokemon = [];
        return false;
      }
    }
    this.secondaryPokemon = qualified;
    return true;
  }
}

export class MysteryEncounterOptionBuilder implements Partial<IMysteryEncounterOption> {
  optionMode: MysteryEncounterOptionMode = MysteryEncounterOptionMode.DEFAULT;
  requirements: EncounterSceneRequirement[] = [];
  primaryPokemonRequirements: EncounterPokemonRequirement[] = [];
  secondaryPokemonRequirements: EncounterPokemonRequirement[] = [];
  excludePrimaryFromSecondaryRequirements: boolean = false;
  isDisabledOnRequirementsNotMet: boolean = true;
  hasDexProgress: boolean = false;
  dialogue?: OptionTextDisplay;

  static newOptionWithMode(optionMode: MysteryEncounterOptionMode): MysteryEncounterOptionBuilder & Pick<IMysteryEncounterOption, "optionMode"> {
    return Object.assign(new MysteryEncounterOptionBuilder(), { optionMode });
  }

  withHasDexProgress(hasDexProgress: boolean): this & Required<Pick<IMysteryEncounterOption, "hasDexProgress">> {
    return Object.assign(this, { hasDexProgress: hasDexProgress });
  }

  /**
   * Adds a {@linkcode EncounterSceneRequirement} to {@linkcode requirements}
   * @param requirement
   */
  withSceneRequirement(requirement: EncounterSceneRequirement): this & Required<Pick<IMysteryEncounterOption, "requirements">> {
    if (requirement instanceof EncounterPokemonRequirement) {
      Error("Incorrectly added pokemon requirement as scene requirement.");
    }

    this.requirements.push(requirement);
    return Object.assign(this, { requirements: this.requirements });
  }

  withSceneMoneyRequirement(requiredMoney: number, scalingMultiplier?: number) {
    return this.withSceneRequirement(new MoneyRequirement(requiredMoney, scalingMultiplier));
  }

  /**
   * Defines logic that runs immediately when an option is selected, but before the Encounter continues.
   * Can determine whether or not the Encounter *should* continue.
   * If there are scenarios where the Encounter should NOT continue, should return boolean instead of void.
   * @param onPreOptionPhase
   */
  withPreOptionPhase(onPreOptionPhase: OptionPhaseCallback): this & Required<Pick<IMysteryEncounterOption, "onPreOptionPhase">> {
    return Object.assign(this, { onPreOptionPhase: onPreOptionPhase });
  }

  /**
   * MUST be defined by every {@linkcode MysteryEncounterOption}
   * @param onOptionPhase
   */
  withOptionPhase(onOptionPhase: OptionPhaseCallback): this & Required<Pick<IMysteryEncounterOption, "onOptionPhase">> {
    return Object.assign(this, { onOptionPhase: onOptionPhase });
  }

  withPostOptionPhase(onPostOptionPhase: OptionPhaseCallback): this & Required<Pick<IMysteryEncounterOption, "onPostOptionPhase">> {
    return Object.assign(this, { onPostOptionPhase: onPostOptionPhase });
  }

  /**
   * Adds a {@linkcode EncounterPokemonRequirement} to {@linkcode primaryPokemonRequirements}
   * @param requirement
   */
  withPrimaryPokemonRequirement(requirement: EncounterPokemonRequirement): this & Required<Pick<IMysteryEncounterOption, "primaryPokemonRequirements">> {
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

  /**
   * Adds a {@linkcode EncounterPokemonRequirement} to {@linkcode secondaryPokemonRequirements}
   * @param requirement
   * @param excludePrimaryFromSecondaryRequirements
   */
  withSecondaryPokemonRequirement(requirement: EncounterPokemonRequirement, excludePrimaryFromSecondaryRequirements: boolean = true): this & Required<Pick<IMysteryEncounterOption, "secondaryPokemonRequirements">> {
    if (requirement instanceof EncounterSceneRequirement) {
      Error("Incorrectly added scene requirement as pokemon requirement.");
    }

    this.secondaryPokemonRequirements.push(requirement);
    this.excludePrimaryFromSecondaryRequirements = excludePrimaryFromSecondaryRequirements;
    return Object.assign(this, { secondaryPokemonRequirements: this.secondaryPokemonRequirements });
  }

  /**
   * Set the full dialogue object to the option. Will override anything already set
   *
   * @param dialogue see {@linkcode OptionTextDisplay}
   * @returns
   */
  withDialogue(dialogue: OptionTextDisplay) {
    this.dialogue = dialogue;
    return this;
  }

  build(this: IMysteryEncounterOption) {
    return new MysteryEncounterOption(this);
  }
}
