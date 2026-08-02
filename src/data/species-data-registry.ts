import { defaultStarterSpecies } from "#app/constants";
import { setSpeciesDataRegistry } from "#app/global-species-data-registry";
import { initGenerationOne } from "#balance/generation-01";
import { initGenerationTwo } from "#balance/generation-02";
import { initGenerationThree } from "#balance/generation-03";
import { initGenerationFour } from "#balance/generation-04";
import { initGenerationFive } from "#balance/generation-05";
import { initGenerationSix } from "#balance/generation-06";
import { initGenerationSeven } from "#balance/generation-07";
import { initGenerationEight } from "#balance/generation-08";
import { initGenerationNine } from "#balance/generation-09";
import type { SpeciesFormEvolution } from "#balance/pokemon-evolutions";
import type { StarterCost } from "#balance/starters";
import { SpeciesFormChangeItemTrigger } from "#data/form-change-triggers";
import { SpeciesFormChange } from "#data/pokemon-forms";
import type { PokemonSpecies, PokemonSpeciesForm } from "#data/pokemon-species";
import type { AbilityId } from "#enums/ability-id";
import { EggTier } from "#enums/egg-type";
import type { MoveId } from "#enums/move-id";
import { SpeciesFormKey } from "#enums/species-form-key";
import type { SpeciesId } from "#enums/species-id";
import type { LevelMoves, PokemonSpeciesData, SpeciesDataMap } from "#types/pokemon-species";

/**
 * The SpeciesDataRegistry is a singleton class responsible for managing and querying species-related information.
 */
export class SpeciesDataRegistry {
  private readonly _data: SpeciesDataMap;

  // TODO: this (and the other methods) should use `ReadonlyDeep<...>` from type-fest
  get data(): SpeciesDataMap {
    return this._data;
  }

  constructor() {
    this._data = Object.assign(
      {} as SpeciesDataMap,
      initGenerationOne(),
      initGenerationTwo(),
      initGenerationThree(),
      initGenerationFour(),
      initGenerationFive(),
      initGenerationSix(),
      initGenerationSeven(),
      initGenerationEight(),
      initGenerationNine(),
    );

    this.initPreEvolutions();
    this.initReverseFormChanges();
  }

  // #region Initialization

  /**
   * Initialize the `prevolution` field for all species.
   */
  private initPreEvolutions(): void {
    const megaFormKeys = [
      SpeciesFormKey.MEGA,
      SpeciesFormKey.MEGA_X,
      SpeciesFormKey.MEGA_Y,
      SpeciesFormKey.MEGA_Z,
      SpeciesFormKey.MEGA_ORIGINAL,
      SpeciesFormKey.MEGA_CURLY,
      SpeciesFormKey.MEGA_DROOPY,
      SpeciesFormKey.MEGA_STRETCHY,
    ];

    const setPrevo = (speciesId: SpeciesId): void => {
      const evolutions = this.getEvolutions(speciesId);
      for (const evolution of evolutions) {
        if (evolution.evoFormKey && megaFormKeys.includes(evolution.evoFormKey as SpeciesFormKey)) {
          continue;
        }

        this._data[evolution.speciesId].prevolution = speciesId;

        if (this.hasEvolutions(evolution.speciesId)) {
          setPrevo(evolution.speciesId);
        }
      }
    };

    for (const starterId of this.getAllStarters()) {
      this._data[starterId].prevolution = null;
      setPrevo(starterId);
    }
  }

  /**
   * Initialize reverse form changes for all species.
   */
  private initReverseFormChanges(): void {
    const allFormChanges = Object.values(this._data).flatMap(s => (s.formChanges ? [s.formChanges] : []));

    for (const speciesFormChanges of allFormChanges) {
      for (const formChange of speciesFormChanges) {
        const itemTrigger = formChange.findTrigger(SpeciesFormChangeItemTrigger) as SpeciesFormChangeItemTrigger;
        if (
          itemTrigger
          && !speciesFormChanges.find(c => formChange.formKey === c.preFormKey && formChange.preFormKey === c.formKey)
        ) {
          this._data[formChange.speciesId].formChanges?.push(
            new SpeciesFormChange({
              speciesId: formChange.speciesId,
              preFormKey: formChange.formKey,
              evoFormKey: formChange.preFormKey,
              trigger: new SpeciesFormChangeItemTrigger(itemTrigger.item, false),
            }),
          );
        }
      }
    }
  }

  // #endregion Initialization

  /**
   * Get the species data for a given species.
   * @param speciesId - The {@linkcode SpeciesId} of the species to get data for
   * @returns The {@linkcode PokemonSpeciesData}
   */
  public getSpeciesData(speciesId: SpeciesId): PokemonSpeciesData {
    return this._data[speciesId];
  }

  /**
   * Get the species data for a given species ID.
   * @param speciesId - The {@linkcode SpeciesId} of the species to get data for
   * @returns The {@linkcode PokemonSpecies}
   */
  public getSpecies(speciesId: SpeciesId): PokemonSpecies {
    return this.getSpeciesData(speciesId).species;
  }

  /**
   * Get all pokemon species in the registry.
   * @returns An array of all {@linkcode PokemonSpecies}
   */
  public getAllSpecies(): PokemonSpecies[] {
    return Object.values(this._data).map(s => s.species);
  }

  /**
   * Get either a pokemon species or a specific form of that species.
   * @param speciesId - The {@linkcode SpeciesId} of the species
   * @param form - The `formIndex` or `formKey` of the form to get.
   * @returns The {@linkcode PokemonSpeciesForm} or {@linkcode PokemonSpecies} if the form doesn't exist
   */
  public getPokemonSpeciesForm(speciesId: SpeciesId, form: string | number): PokemonSpeciesForm {
    const species: PokemonSpecies = this.getSpecies(speciesId);
    const formIndex = this.getFormIndex(speciesId, form);

    return species.forms[formIndex] ?? species;
  }

  /**
   * Get all available TMs for a given species and form.
   * @param speciesId - The {@linkcode SpeciesId} of the species to get TMs for
   * @param form - (Optional) The `formIndex` or `formKey` of the form to get TMs for.
   * Uses the base form if not specified.
   * @return An array of all TMs available
   */
  public getTms(speciesId: SpeciesId, form?: string | number): MoveId[] {
    const speciesData = this.getSpeciesData(speciesId);
    const formKey = this.getFormKey(speciesId, form);
    const tms = [...speciesData.tms, ...(speciesData.formTms?.[formKey] ?? [])];
    const prevo = this.getPrevolution(speciesId);
    if (prevo !== null) {
      const prevoTms = this.getTms(prevo, form ? formKey : undefined);
      tms.push(...prevoTms);
    }

    return Array.from(new Set(tms));
  }

  /**
   * Get all available level moves for a given species and form.
   * @param speciesId - The {@linkcode SpeciesId} of the species to get level moves for
   * @param form - (Optional) The `formIndex` or `formKey` of the form to get level moves for.
   * Uses the base form if not specified.
   * @return An array of all level moves available
   */
  public getLevelMoves(speciesId: SpeciesId, form?: string | number): LevelMoves {
    const speciesData = this.getSpeciesData(speciesId);
    const formKey = this.getFormKey(speciesId, form);
    const levelMoves = new Set([...speciesData.levelMoves, ...(speciesData.formLevelMoves?.[formKey] ?? [])]);
    return Array.from(levelMoves);
  }

  /**
   * Checks if a given species has any form specific level moves.
   * @param speciesId - The {@linkcode SpeciesId} of the species to check
   * @returns Whether the species has any form specific level moves
   */
  public hasFormLevelMoves(speciesId: SpeciesId): boolean {
    const speciesData = this.getSpeciesData(speciesId);
    return !!speciesData.formLevelMoves && Object.keys(speciesData.formLevelMoves).length > 0;
  }

  /**
   * Get the egg tier for a given species.
   * @param speciesId - The {@linkcode SpeciesId} of the species to get the egg tier for
   * @returns The {@linkcode EggTier} of the species.
   * Uses the "common" tier if the species doesn't have a defined egg tier (aka it isn't a starter).
   */
  public getEggTier(speciesId: SpeciesId): EggTier {
    const speciesData = this.getSpeciesData(speciesId);
    return speciesData.eggTier ?? EggTier.COMMON;
  }

  /**
   * Get all starter species that belong to a given egg tier.
   * @param tier - The {@linkcode EggTier} to get starter species for
   * @returns An array of all starter species that belong to the given egg tier
   */
  public getSpeciesForEggTier(tier: EggTier): PokemonSpecies[] {
    const ret: PokemonSpecies[] = [];
    for (const speciesData of Object.values(this._data)) {
      if (speciesData.eggTier === tier) {
        ret.push(speciesData.species);
      }
    }
    return ret;
  }

  /**
   * Get the passive ability for a given species and form.
   * @param speciesId - The {@linkcode SpeciesId} of the species to get the passive for
   * @param form - The `formIndex` or `formKey` of the form to get the passive for.
   * @returns the passive ability of the species and form
   */
  public getPassive(speciesId: SpeciesId, form: string | number): AbilityId {
    const speciesData = this.getSpeciesData(speciesId);
    // TODO: Should probably also use formkeys for passives to keep it consistent
    let formIndex = this.getFormIndex(speciesId, form);
    const passives = speciesData.passives;
    if (typeof passives === "object" && !(formIndex in passives)) {
      formIndex = 0;
    }
    return typeof passives === "object" ? passives[formIndex] : passives;
  }

  /**
   * Check if a given species is a starter.
   * @param speciesId - The {@linkcode SpeciesId} of the Species to check
   * @returns Whether the species is a starter
   */
  public isStarter(speciesId: SpeciesId): boolean {
    const speciesData = this.getSpeciesData(speciesId);
    return !!speciesData.starterCost;
  }

  /**
   * Retrieve the corresponding starter for a given species.
   * @param speciesId - The {@linkcode SpeciesId} to get the starter for
   * @param getSpecies - (Default `false`) Whether to return the {@linkcode PokemonSpecies} instead of a {@linkcode SpeciesId}.
   * @returns The starter {@linkcode SpeciesId} or {@linkcode PokemonSpecies}
   */
  public getStarter(speciesId: SpeciesId, getSpecies?: false): SpeciesId;
  public getStarter(speciesId: SpeciesId, getSpecies: true): PokemonSpecies;
  public getStarter(speciesId: SpeciesId, getSpecies = false): SpeciesId | PokemonSpecies {
    const speciesData = this.getSpeciesData(speciesId);
    // only need to check if the species is a starter because of pikachu :/
    if (getSpecies) {
      return this.isStarter(speciesId) ? speciesData.species : this.getSpecies(speciesData.starter);
    }
    return this.isStarter(speciesId) ? speciesId : speciesData.starter;
  }

  /**
   * Get the starter cost for a given species.
   * @param speciesId - The {@linkcode SpeciesId} of the species to get the starter cost for
   * @returns The starter cost of the species
   */
  // TODO: fix type safety issue (remove method?); this should probably only accept starters?
  public getStarterCost(speciesId: SpeciesId): StarterCost {
    const speciesData = this.getSpeciesData(speciesId);
    // We assume that the starter cost is set if it's a starter
    return speciesData.starterCost as StarterCost;
  }

  /**
   * Get all starters.
   * @param getSpecies - (Default `false`) Whether to return {@linkcode PokemonSpecies} instead of {@linkcode SpeciesId}.
   * @returns An array of all starter {@linkcode SpeciesId}s or {@linkcode PokemonSpecies}s
   */
  public getAllStarters(getSpecies?: false): SpeciesId[];
  public getAllStarters(getSpecies: true): PokemonSpecies[];
  public getAllStarters(getSpecies = false): SpeciesId[] | PokemonSpecies[] {
    const ret: (SpeciesId | PokemonSpecies)[] = [];
    for (const speciesData of Object.values(this._data)) {
      if (this.isStarter(speciesData.species.speciesId)) {
        ret.push(getSpecies ? speciesData.species : speciesData.species.speciesId);
      }
    }
    return ret as SpeciesId[] | PokemonSpecies[];
  }

  /**
   * Get all starters for a given starter cost.
   * @param starterCost - The starter cost
   * @returns An array of all starter species that have the given starter cost
   */
  public getStartersForCost(starterCost: number): SpeciesId[] {
    const ret: SpeciesId[] = [];
    for (const speciesData of Object.values(this._data)) {
      if (speciesData.starterCost === starterCost) {
        ret.push(speciesData.species.speciesId);
      }
    }
    return ret;
  }

  /**
   * Get the default starters and their evolution lines (e.g. the Bulbasaur line, etc)
   * @returns An array of {@linkcode SpeciesId}s
   */
  public getDefaultStartersAndEvolutions(): SpeciesId[] {
    return defaultStarterSpecies.flatMap(sId => [sId, ...this.getEvolutionChain(sId)]);
  }

  /**
   * Get the evolutions for a given species.
   * @param speciesId - The {@linkcode SpeciesId} of the species to get evolutions for
   * @returns An array of {@linkcode SpeciesFormEvolution}s
   */
  public getEvolutions(speciesId: SpeciesId): SpeciesFormEvolution[] {
    return this.getSpeciesData(speciesId).evolutions;
  }

  /**
   * Get all species in the evolution chain for a given species.
   * Does NOT include the given species itself.
   * @param speciesId - The {@linkcode SpeciesId} of the species to get the evolution chain for
   * @returns An array of {@linkcode SpeciesId}s representing the evolution chain
   */
  public getEvolutionChain(speciesId: SpeciesId): SpeciesId[] {
    const evoLine: SpeciesId[] = [];
    const evolutions = this.getEvolutions(speciesId);
    for (const evolution of evolutions) {
      evoLine.push(evolution.speciesId);
      evoLine.push(...this.getEvolutionChain(evolution.speciesId));
    }
    return [...new Set(evoLine)];
  }

  /**
   * Checks if a given species has any evolutions.
   * @param speciesId - The {@linkcode SpeciesId} of the species to check
   * @returns whether the species has any evolutions
   */
  public hasEvolutions(speciesId: SpeciesId): boolean {
    return this.getEvolutions(speciesId).length > 0;
  }

  /**
   * Get all {@linkcode SpeciesId}s that have evolutions.
   * @returns An array of all {@linkcode SpeciesId}s that have evolutions
   */
  public getSpeciesWithEvolutions(): SpeciesId[] {
    const ret: SpeciesId[] = [];
    for (const speciesData of Object.values(this._data)) {
      if (this.hasEvolutions(speciesData.species.speciesId)) {
        ret.push(speciesData.species.speciesId);
      }
    }
    return ret;
  }

  /**
   * Get the prevolution of a given species.
   * @param speciesId - The {@linkcode SpeciesId} of the species to get the prevolution for
   * @param getSpecies - (Default `false`) Whether to return the {@linkcode PokemonSpecies} instead of a {@linkcode SpeciesId}
   * @returns The prevolution {@linkcode SpeciesId} or {@linkcode PokemonSpecies}
   */
  public getPrevolution(speciesId: SpeciesId): SpeciesId | null;
  public getPrevolution(speciesId: SpeciesId, getSpecies: false): SpeciesId | null;
  public getPrevolution(speciesId: SpeciesId, getSpecies: true): PokemonSpecies | null;
  public getPrevolution(speciesId: SpeciesId, getSpecies = false): SpeciesId | PokemonSpecies | null {
    const speciesData = this.getSpeciesData(speciesId);
    const { prevolution } = speciesData;
    if (prevolution == null) {
      return null;
    }
    return getSpecies ? this.getSpecies(prevolution) : prevolution;
  }

  /**
   * Get all species in the prevolution chain for a given species.
   * Does NOT include the given species itself.
   * @param speciesId - The {@linkcode SpeciesId} of the species to get the prevolution chain for
   * @returns An array of {@linkcode SpeciesId}s representing the prevolution chain
   */
  public getPrevolutionChain(speciesId: SpeciesId): SpeciesId[] {
    const preEvoSpecies: SpeciesId[] = [];
    let preEvoSpeciesId = this.getPrevolution(speciesId);
    while (preEvoSpeciesId) {
      preEvoSpecies.push(preEvoSpeciesId);
      preEvoSpeciesId = this.getPrevolution(preEvoSpeciesId);
    }
    return preEvoSpecies;
  }

  /**
   * Check if a given species has a prevolution.
   * @param speciesId - The {@linkcode SpeciesId} of the species to check
   * @returns Whether the species has a prevolution
   */
  // TODO: once pikachu isn't a starter anymore, we can just check if it's not a starter
  public hasPrevolution(speciesId: SpeciesId): boolean {
    return this.getPrevolution(speciesId) !== null;
  }

  /**
   * Get the form changes for a given species.
   * @param speciesId - The {@linkcode SpeciesId} of the species to get form changes for
   * @returns An array of {@linkcode SpeciesFormChange}s
   */
  public getFormChanges(speciesId: SpeciesId): SpeciesFormChange[] {
    const speciesData = this.getSpeciesData(speciesId);
    return speciesData.formChanges ?? [];
  }

  /**
   * Checks if a given species has any form changes.
   * @param speciesId - The {@linkcode SpeciesId} of the species to check
   * @returns Whether the species has any form changes
   */
  public hasFormChanges(speciesId: SpeciesId): boolean {
    const speciesData = this.getSpeciesData(speciesId);
    return !!speciesData.formChanges && speciesData.formChanges.length > 0;
  }

  // #region Helpers

  /**
   * Helper to get the form key for a given species and formIndex or formKey. \
   * Also validates that the form exists and falls back to the base form if it doesn't.
   * @param speciesId - The {@linkcode SpeciesId} of the species to get the form key for
   * @param form - (Optional) The `formIndex` or `formKey` of the form to get the form key for.
   * Uses the base form if not specified.
   * @returns The formKey
   */
  private getFormKey(speciesId: SpeciesId, form?: string | number): string {
    const forms = this.getSpeciesData(speciesId).species.forms;

    if (forms.length === 0) {
      return "";
    }

    if (form == null) {
      return forms[0].formKey;
    }

    if (typeof form === "string" && forms.some(f => f.formKey === form)) {
      return form;
    }
    if (typeof form === "number" && form >= 0 && form < forms.length) {
      return forms[form].formKey;
    }

    console.warn(`Invalid form index ${form} for species ${speciesId}, falling back to base form`);
    return forms[0].formKey;
  }

  /**
   * Helper to validate a form index or retrieve the form index associated with a form key.
   * @param speciesId - The {@linkcode SpeciesId} of the species to get the form index for
   * @param form - The `formIndex` or `formKey` of the form to get the form index for.
   * @returns The form index
   */
  private getFormIndex(speciesId: SpeciesId, form: string | number): number {
    const forms = this.getSpeciesData(speciesId).species.forms;

    if (forms.length === 0) {
      return 0;
    }

    if (typeof form === "number" && form >= 0 && form < forms.length) {
      return form;
    }

    const formIndex = forms.findIndex(f => f.formKey === form);
    if (typeof form === "string" && formIndex !== -1) {
      return formIndex;
    }

    console.warn(`Invalid form ${form} for species ${speciesId}, falling back to base form`);
    return 0;
  }

  // #endregion Helpers
}

export function initSpeciesDataRegistry(): void {
  setSpeciesDataRegistry(new SpeciesDataRegistry());
}
