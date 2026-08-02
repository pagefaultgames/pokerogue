import { determineEnemySpecies } from "#app/ai/ai-species-gen";
import type { GameMode } from "#app/game-mode";
import { audioManager } from "#app/global-audio-manager";
import { timedEventManager } from "#app/global-event-manager";
import { globalScene } from "#app/global-scene";
import { speciesDataRegistry } from "#app/global-species-data-registry";
import type { AnySound } from "#audio/audio-manager";
import { speciesEggMoves } from "#balance/moves/egg-moves";
import type { GrowthRate } from "#data/exp";
import { Gender } from "#data/gender";
import { AbilityId } from "#enums/ability-id";
import { DexAttr } from "#enums/dex-attr";
import { EvoLevelThresholdKind } from "#enums/evo-level-threshold-kind";
import type { MoveId } from "#enums/move-id";
import { PartyMemberStrength } from "#enums/party-member-strength";
import type { RegularPokemonType } from "#enums/pokemon-type";
import { SpeciesFormKey } from "#enums/species-form-key";
import { SpeciesId } from "#enums/species-id";
import type { Stat } from "#enums/stat";
import type { Pokemon } from "#field/pokemon";
import { loadPokemonVariantAssets } from "#sprites/pokemon-sprite";
import { hasExpSprite } from "#sprites/sprite-utils";
import type { Variant, VariantSet } from "#sprites/variant";
import { populateVariantColorCache, variantColorCache, variantData } from "#sprites/variant";
import type { Localizable } from "#types/locales";
import type { LevelMoves } from "#types/pokemon-species";
import type { StarterMoveset } from "#types/save-data";
import type { EvolutionLevel, EvolutionLevelWithThreshold } from "#types/species-gen-types";
import { argbFromRgba, rgbaFromArgb } from "#utils/color-utils";
import { randSeedFloat } from "#utils/common";
import { toCamelCase, toPascalCase } from "#utils/strings";
import { QuantizerCelebi } from "@material/material-color-utilities";
import i18next from "i18next";

export enum Region {
  NORMAL,
  ALOLA,
  GALAR,
  HISUI,
  PALDEA,
}

// TODO: this is horrible and will need to be removed once a refactor/cleanup of forms is executed.
export const normalForm: SpeciesId[] = [
  SpeciesId.PIKACHU,
  SpeciesId.RAICHU,
  SpeciesId.EEVEE,
  SpeciesId.JOLTEON,
  SpeciesId.FLAREON,
  SpeciesId.VAPOREON,
  SpeciesId.ESPEON,
  SpeciesId.UMBREON,
  SpeciesId.LEAFEON,
  SpeciesId.GLACEON,
  SpeciesId.SYLVEON,
  SpeciesId.PICHU,
  SpeciesId.ROTOM,
  SpeciesId.DIALGA,
  SpeciesId.PALKIA,
  SpeciesId.KYUREM,
  SpeciesId.GENESECT,
  SpeciesId.BATTLE_BOND_GRENINJA,
  SpeciesId.ROCKRUFF,
  SpeciesId.NECROZMA,
  SpeciesId.MAGEARNA,
  SpeciesId.MARSHADOW,
  SpeciesId.CRAMORANT,
  SpeciesId.ZARUDE,
  SpeciesId.CALYREX,
];

export type PokemonSpeciesFilter = (species: PokemonSpecies) => boolean;

interface PokemonSpeciesFormConstructor {
  type1: RegularPokemonType;
  type2: RegularPokemonType | null;
  height: number;
  weight: number;
  ability1: AbilityId;
  ability2: AbilityId;
  abilityHidden: AbilityId;
  baseTotal: number;
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  baseSpatk: number;
  baseSpdef: number;
  baseSpd: number;
  catchRate: number;
  baseFriendship: number;
  baseExp: number;
  genderDiffs: boolean;
  isStarterSelectable: boolean;
}

/**
 * Overrides the local key for species with "fake" forms.
 */
const CUSTOM_FORM_NAMES: Partial<Record<SpeciesId, string>> = {
  [SpeciesId.BLOODMOON_URSALUNA]: "ursalunaBloodmoon",
  [SpeciesId.ETERNAL_FLOETTE]: "floetteEternalFlower",
  [SpeciesId.BATTLE_BOND_GRENINJA]: "battleBondGreninja",
  [SpeciesId.HISUI_BASCULIN]: "basculinWhiteStriped",
};

export abstract class PokemonSpeciesForm {
  public speciesId: SpeciesId;
  protected _formIndex: number;
  protected _generation: number;
  // TODO: Make these not accept UNKNOWN or STELLAR
  readonly type1: RegularPokemonType;
  readonly type2: RegularPokemonType | null;
  readonly height: number;
  readonly weight: number;
  readonly ability1: AbilityId;
  readonly ability2: AbilityId;
  readonly abilityHidden: AbilityId;
  readonly baseTotal: number;
  readonly baseStats: readonly number[];
  readonly catchRate: number;
  /** The base amount of friendship this species has when caught, as an integer from 0-255. */
  readonly baseFriendship: number;
  readonly baseExp: number;
  readonly genderDiffs: boolean;
  readonly isStarterSelectable: boolean;

  constructor(data: PokemonSpeciesFormConstructor) {
    this.type1 = data.type1;
    this.type2 = data.type2;
    this.height = data.height;
    this.weight = data.weight;
    this.ability1 = data.ability1;
    this.ability2 = data.ability2 === AbilityId.NONE ? data.ability1 : data.ability2;
    this.abilityHidden = data.abilityHidden;
    this.baseTotal = data.baseTotal;
    this.baseStats = [data.baseHp, data.baseAtk, data.baseDef, data.baseSpatk, data.baseSpdef, data.baseSpd];
    this.catchRate = data.catchRate;
    this.baseFriendship = data.baseFriendship;
    this.baseExp = data.baseExp;
    this.genderDiffs = data.genderDiffs;
    this.isStarterSelectable = data.isStarterSelectable;
  }

  /**
   * Method to get the root species id of a Pokemon.
   * Pikachu.getRootSpeciesId(true) => Pichu
   * Pikachu.getRootSpeciesId(false) => Pikachu
   * @param forStarter boolean to get the nonbaby form of a starter
   * @returns The species
   */
  // TODO: once we don't have later stage starters anymore (pikachu) we can simplify this or even remove and replace with a direct call to speciesDataRegistry.getStarter
  getRootSpeciesId(forStarter = false): SpeciesId {
    let ret = this.speciesId;
    while (speciesDataRegistry.hasPrevolution(ret) && (!forStarter || !speciesDataRegistry.isStarter(ret))) {
      ret = speciesDataRegistry.getPrevolution(ret)!;
    }
    return ret;
  }

  get generation(): number {
    return this._generation;
  }

  set generation(generation: number) {
    this._generation = generation;
  }

  get formIndex(): number {
    return this._formIndex;
  }

  set formIndex(formIndex: number) {
    this._formIndex = formIndex;
  }

  isOfType(type: number): boolean {
    return this.type1 === type || (this.type2 !== null && this.type2 === type);
  }

  /**
   * Method to get the total number of abilities a Pokemon species has.
   * @returns Number of abilities
   */
  getAbilityCount(): number {
    return this.abilityHidden === AbilityId.NONE ? 2 : 3;
  }

  /**
   * Method to get the ability of a Pokemon species.
   * @param abilityIndex Which ability to get (should only be 0-2)
   * @returns The id of the Ability
   */
  getAbility(abilityIndex: number): AbilityId {
    let ret: AbilityId;
    if (abilityIndex === 0) {
      ret = this.ability1;
    } else if (abilityIndex === 1) {
      ret = this.ability2;
    } else {
      ret = this.abilityHidden;
    }
    return ret;
  }

  /**
   * Method to get the passive ability of a Pokemon species
   * @param formIndex The form index to use, defaults to form for this species instance
   * @returns The id of the ability
   */
  getPassiveAbility(formIndex = this.formIndex): AbilityId {
    return speciesDataRegistry.getPassive(this.speciesId, formIndex);
  }

  /**
   * Get a list of all level moves for this species, including form specific moves.
   * @param formKey - (Optional) The key for the form to be checked. Uses the base form if not specified
   * @returns A list of all level moves that can be learned by this species
   */
  public getLevelMoves(formKey?: string): LevelMoves {
    const levelMoves = speciesDataRegistry.getLevelMoves(this.speciesId, formKey);
    return levelMoves.sort((a, b) => a[0] - b[0]);
  }

  /**
   * Get al list of all TMs that can be learned by this species.
   * @param form - the formIndex or formKey of the form to get TMs for. (default: base form)
   * @returns A list of all TM {@linkcode MoveId}s that can be learned by this species
   */
  getTms(form?: string | number): MoveId[] {
    return speciesDataRegistry.getTms(this.speciesId, form);
  }

  /**
   * Checks whether this species can learn a specific TM.
   * @param moveId - The TM to check for.
   * @param formKey - (Optional) The key for the form to be checked. Uses the base form if not specified.
   * @returns whether this species can learn the TM
   */
  canLearnTm(moveId: MoveId, formKey?: string): boolean {
    return this.getTms(formKey).includes(moveId);
  }

  getRegion(): Region {
    return Math.floor(this.speciesId / 2000) as Region;
  }

  // TODO: this is primarily used for preventing certain pokemon from generating on trainers, rename?
  public isCatchable(): boolean {
    const blockedSpecies = [
      SpeciesId.MEW,
      SpeciesId.CELEBI,
      SpeciesId.JIRACHI,
      SpeciesId.DEOXYS,
      SpeciesId.PHIONE,
      SpeciesId.MANAPHY,
      SpeciesId.ARCEUS,
      SpeciesId.VICTINI,
      SpeciesId.MELTAN,
      SpeciesId.MELMETAL,
      SpeciesId.ETERNATUS,
      SpeciesId.GREAT_TUSK,
      SpeciesId.SCREAM_TAIL,
      SpeciesId.BRUTE_BONNET,
      SpeciesId.FLUTTER_MANE,
      SpeciesId.SLITHER_WING,
      SpeciesId.SANDY_SHOCKS,
      SpeciesId.IRON_TREADS,
      SpeciesId.IRON_BUNDLE,
      SpeciesId.IRON_HANDS,
      SpeciesId.IRON_JUGULIS,
      SpeciesId.IRON_MOTH,
      SpeciesId.IRON_THORNS,
      SpeciesId.ROARING_MOON,
      SpeciesId.IRON_VALIANT,
      SpeciesId.WALKING_WAKE,
      SpeciesId.IRON_LEAVES,
      SpeciesId.GOUGING_FIRE,
      SpeciesId.RAGING_BOLT,
      SpeciesId.IRON_BOULDER,
      SpeciesId.IRON_CROWN,
      SpeciesId.PECHARUNT,
    ];
    return !blockedSpecies.includes(this.speciesId);
  }

  isRegional(): boolean {
    return this.getRegion() > Region.NORMAL;
  }

  isTrainerForbidden(): boolean {
    return [SpeciesId.ETERNAL_FLOETTE, SpeciesId.BLOODMOON_URSALUNA, SpeciesId.BATTLE_BOND_GRENINJA].includes(
      this.speciesId,
    );
  }

  isRareRegional(): boolean {
    switch (this.getRegion()) {
      case Region.HISUI:
        return true;
    }

    return false;
  }

  /**
   * Gets the BST for the species
   * @returns The species' BST.
   */
  getBaseStatTotal(): number {
    return this.baseStats.reduce((i, n) => n + i);
  }

  /**
   * Gets the species' base stat amount for the given stat.
   * @param stat  The desired stat.
   * @returns The species' base stat amount.
   */
  getBaseStat(stat: Stat): number {
    return this.baseStats[stat];
  }

  getBaseExp(): number {
    let ret = this.baseExp;
    switch (this.getFormSpriteKey()) {
      case SpeciesFormKey.MEGA:
      case SpeciesFormKey.MEGA_X:
      case SpeciesFormKey.MEGA_Y:
      case SpeciesFormKey.MEGA_Z:
      case SpeciesFormKey.MEGA_ORIGINAL:
      case SpeciesFormKey.MEGA_CURLY:
      case SpeciesFormKey.MEGA_DROOPY:
      case SpeciesFormKey.MEGA_STRETCHY:
      case SpeciesFormKey.PRIMAL:
      case SpeciesFormKey.GIGANTAMAX:
      case SpeciesFormKey.ETERNAMAX:
        ret *= 1.5;
        break;
    }
    return ret;
  }

  abstract getFormKey(formIndex?: number): string;

  getSpriteAtlasPath(female: boolean, formIndex?: number, shiny?: boolean, variant?: number, back?: boolean): string {
    const spriteId = this.getSpriteId(female, formIndex, shiny, variant, back).replace(/_{2}/g, "/");
    return `${/_[1-3]$/.test(spriteId) ? "variant/" : ""}${spriteId}`;
  }

  getBaseSpriteKey(female: boolean, formIndex?: number): string {
    if (formIndex === undefined || this instanceof PokemonForm) {
      formIndex = this.formIndex;
    }

    const formSpriteKey = this.getFormSpriteKey(formIndex);
    const showGenderDiffs =
      this.genderDiffs
      && female
      && ![
        SpeciesFormKey.MEGA,
        SpeciesFormKey.MEGA_X,
        SpeciesFormKey.MEGA_Y,
        SpeciesFormKey.MEGA_Z,
        SpeciesFormKey.MEGA_ORIGINAL,
        SpeciesFormKey.MEGA_CURLY,
        SpeciesFormKey.MEGA_DROOPY,
        SpeciesFormKey.MEGA_STRETCHY,
        SpeciesFormKey.PRIMAL,
        SpeciesFormKey.GIGANTAMAX,
      ].includes(formSpriteKey as SpeciesFormKey);

    let spriteKey = `${showGenderDiffs ? "female__" : ""}${this.speciesId}${formSpriteKey ? `-${formSpriteKey}` : ""}`;

    const replacement = timedEventManager.getEventPokemonSpriteReplacement(this.speciesId, formIndex);
    if (replacement) {
      const replacementFormSpriteKey = speciesDataRegistry
        .getSpecies(replacement.speciesId)
        .forms[replacement.formIndex]?.getFormSpriteKey(replacement.formIndex);

      const replacementShowGenderDiffs =
        speciesDataRegistry.getSpecies(replacement.speciesId).genderDiffs
        && female
        && ![
          SpeciesFormKey.MEGA,
          SpeciesFormKey.MEGA_X,
          SpeciesFormKey.MEGA_Y,
          SpeciesFormKey.MEGA_Z,
          SpeciesFormKey.MEGA_ORIGINAL,
          SpeciesFormKey.MEGA_CURLY,
          SpeciesFormKey.MEGA_DROOPY,
          SpeciesFormKey.MEGA_STRETCHY,
          SpeciesFormKey.PRIMAL,
          SpeciesFormKey.GIGANTAMAX,
        ].includes(replacementFormSpriteKey as SpeciesFormKey);

      spriteKey = `${replacementShowGenderDiffs ? "female__" : ""}${replacement.speciesId}${replacementFormSpriteKey ? `-${replacementFormSpriteKey}` : ""}`;
    }

    return spriteKey;
  }

  /** Compute the sprite ID of the pokemon form. */
  getSpriteId(female: boolean, formIndex?: number, shiny?: boolean, variant = 0, back = false): string {
    const baseSpriteKey = this.getBaseSpriteKey(female, formIndex);

    let config = variantData;
    `${back ? "back__" : ""}${baseSpriteKey}`.split("__").map(p => (config ? (config = config[p]) : null));
    const variantSet = config as VariantSet;

    return `${back ? "back__" : ""}${shiny && (!variantSet || (!variant && !variantSet[variant || 0])) ? "shiny__" : ""}${baseSpriteKey}${shiny && variantSet && variantSet[variant] === 2 ? `_${variant + 1}` : ""}`;
  }

  getSpriteKey(female: boolean, formIndex?: number, shiny?: boolean, variant?: number, back?: boolean): string {
    return `pkmn__${this.getSpriteId(female, formIndex, shiny, variant, back)}`;
  }

  abstract getFormSpriteKey(formIndex?: number): string;

  /**
   * Variant Data key/index is either species id or species id followed by -formkey
   * @param formIndex optional form index for pokemon with different forms
   * @returns species id if no additional forms, index with formkey if a pokemon with a form
   */
  getVariantDataIndex(formIndex?: number): string | number {
    let formkey: string | null = null;
    let variantDataIndex: number | string = this.speciesId;
    const species = speciesDataRegistry.getSpecies(this.speciesId);
    if (species.forms.length > 0 && formIndex !== undefined) {
      formkey = species.forms[formIndex]?.getFormSpriteKey(formIndex);
      if (formkey) {
        variantDataIndex = `${this.speciesId}-${formkey}`;
      }
    }

    const replacement = timedEventManager.getEventPokemonSpriteReplacement(this.speciesId, formIndex);
    if (replacement) {
      formkey = species.forms[replacement.formIndex]?.getFormSpriteKey(replacement.formIndex);
      if (formkey) {
        variantDataIndex = `${replacement.speciesId}-${formkey}`;
      } else {
        variantDataIndex = replacement.speciesId;
      }
    }

    return variantDataIndex;
  }

  getIconAtlasKey(formIndex?: number, shiny?: boolean, variant?: number): string {
    const variantDataIndex = this.getVariantDataIndex(formIndex);
    const isVariant =
      shiny && variantData[variantDataIndex] && variant !== undefined && variantData[variantDataIndex][variant];

    const replacementSpecies = timedEventManager.getEventPokemonSpriteReplacement(this.speciesId, formIndex);
    const generation = replacementSpecies
      ? speciesDataRegistry.getPokemonSpeciesForm(replacementSpecies.speciesId, replacementSpecies.formIndex).generation
      : this.generation;
    return `pokemon_icons_${generation}${isVariant ? "v" : ""}`;
  }

  getIconId(female: boolean, formIndex?: number, shiny?: boolean, variant?: number): string {
    if (formIndex === undefined) {
      formIndex = this.formIndex;
    }

    const variantDataIndex = this.getVariantDataIndex(formIndex);
    const replacement = timedEventManager.getEventPokemonSpriteReplacement(this.speciesId, formIndex);

    let ret: string = this.speciesId.toString();

    if (replacement) {
      ret = replacement.speciesId.toString();
    }

    const isVariant =
      shiny && variantData[variantDataIndex] && variant !== undefined && variantData[variantDataIndex][variant];

    if (shiny && !isVariant) {
      ret += "s";
    }

    switch (this.speciesId) {
      case SpeciesId.DODUO:
      case SpeciesId.DODRIO:
      case SpeciesId.TORCHIC:
      case SpeciesId.COMBUSKEN:
      case SpeciesId.GIBLE:
      case SpeciesId.GABITE:
      case SpeciesId.HIPPOPOTAS:
      case SpeciesId.HIPPOWDON:
      case SpeciesId.UNFEZANT:
      case SpeciesId.FRILLISH:
      case SpeciesId.JELLICENT:
        ret += female ? "-f" : "";
        break;
      case SpeciesId.MEGANIUM:
      case SpeciesId.BLAZIKEN:
      case SpeciesId.GARCHOMP:
      case SpeciesId.PYROAR: {
        const formKey = this.getFormKey();
        if (formKey !== SpeciesFormKey.MEGA && formKey !== SpeciesFormKey.MEGA_Z) {
          ret += female ? "-f" : "";
        }
        break;
      }
    }

    let formSpriteKey = this.getFormSpriteKey(formIndex);
    if (replacement) {
      formSpriteKey = speciesDataRegistry
        .getPokemonSpeciesForm(replacement.speciesId, replacement.formIndex)
        .getFormSpriteKey(replacement.formIndex);
    }
    if (formSpriteKey) {
      switch (this.speciesId) {
        case SpeciesId.DUDUNSPARCE:
          break;
        case SpeciesId.ZACIAN:
        // biome-ignore lint/suspicious/noFallthroughSwitchClause: Intentionally falls through
        case SpeciesId.ZAMAZENTA:
          if (formSpriteKey.startsWith("behemoth")) {
            formSpriteKey = "crowned";
          }
        default:
          ret += `-${formSpriteKey}`;
          break;
      }
    }

    if (isVariant) {
      ret += `_${variant + 1}`;
    }

    return ret;
  }

  getCryKey(formIndex?: number): string {
    let speciesId = this.speciesId;

    const override = timedEventManager.getEventPokemonSpriteReplacement(this.speciesId, formIndex);
    if (override) {
      speciesId = override.speciesId;
      formIndex = override.formIndex;
    }

    if (speciesId >= 2000) {
      switch (speciesId) {
        case SpeciesId.GALAR_SLOWPOKE:
          break;
        case SpeciesId.ETERNAL_FLOETTE:
          break;
        case SpeciesId.BLOODMOON_URSALUNA:
          break;
        default:
          speciesId %= 2000;
          break;
      }
    }
    let ret: string = speciesId.toString();
    const forms = speciesDataRegistry.getSpecies(speciesId).forms;
    if (forms.length > 0) {
      if (formIndex !== undefined && formIndex >= forms.length) {
        console.warn(
          `Attempted accessing form with index ${formIndex} of species ${speciesDataRegistry.getSpecies(speciesId).getName()} with only ${forms.length || 0} forms`,
        );
        formIndex = Math.min(formIndex, forms.length - 1);
      }
      const formKey = forms[formIndex || 0].formKey;
      switch (formKey) {
        case SpeciesFormKey.MEGA:
        case SpeciesFormKey.MEGA_X:
        case SpeciesFormKey.MEGA_Y:
        case SpeciesFormKey.MEGA_Z:
        case SpeciesFormKey.PRIMAL:
        case SpeciesFormKey.GIGANTAMAX:
        case SpeciesFormKey.GIGANTAMAX_SINGLE:
        case SpeciesFormKey.GIGANTAMAX_RAPID:
        case SpeciesFormKey.ETERNAMAX:
        case "white":
        case "black":
        case "therian":
        case "sky":
        case "gorging":
        case "gulping":
        case "lowkey":
        case "no-ice":
        case "hangry":
        case "crowned":
        case "rapid-strike":
        case "four":
        case "droopy":
        case "stretchy":
        case "hero":
        case "roaming":
        case "complete":
        case "10-complete":
        case "10":
        case "10-pc":
        case "super":
        case "unbound":
        case "pau":
        case "pompom":
        case "sensu":
        case "dusk":
        case "midnight":
        case "school":
        case "dawn-wings":
        case "dusk-mane":
        case "ultra":
          ret += `-${formKey}`;
          break;
        case SpeciesFormKey.MEGA_ORIGINAL:
        case SpeciesFormKey.MEGA_CURLY:
        case SpeciesFormKey.MEGA_DROOPY:
        case SpeciesFormKey.MEGA_STRETCHY:
          ret += `-${SpeciesFormKey.MEGA}`;
          break;
      }
      switch (this.speciesId) {
        case SpeciesId.INDEEDEE:
        case SpeciesId.OINKOLOGNE:
          if (formKey === "female") {
            ret += `-${formKey}`;
          }
          break;
        case SpeciesId.CALYREX:
          if (formKey === "ice" || formKey === "shadow") {
            ret += `-${formKey}`;
          }
          break;
      }
    }
    return `cry/${ret}`;
  }

  validateStarterMoveset(moveset: StarterMoveset, eggMoves: number): boolean {
    const rootSpeciesId = this.getRootSpeciesId();
    for (const moveId of moveset) {
      if (Object.hasOwn(speciesEggMoves, rootSpeciesId)) {
        // TODO: Review typing of `speciesEggMoves` - asserting `rootSpeciesId` is `keyof typeof speciesEggMoves` results in `never[]`
        // due to incompatible tuple intersections
        const eggMoveIndex = speciesEggMoves[rootSpeciesId].indexOf(moveId);
        if (eggMoveIndex > -1 && eggMoves & (1 << eggMoveIndex)) {
          continue;
        }
      }
      const levelMoves = this.getLevelMoves();
      if (!levelMoves.some(([l, m]) => m === moveId && l <= 5)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Load the variant colors for the species into the variant color cache
   *
   * @param spriteKey - The sprite key to use
   * @param female - Whether to load female instead of male
   * @param back - Whether the back sprite is being loaded
   *
   */
  async loadVariantColors(
    spriteKey: string,
    female: boolean,
    variant: Variant,
    back = false,
    formIndex?: number,
  ): Promise<void> {
    let baseSpriteKey = this.getBaseSpriteKey(female, formIndex);
    if (back) {
      baseSpriteKey = "back__" + baseSpriteKey;
    }

    if (Object.hasOwn(variantColorCache, baseSpriteKey)) {
      // Variant colors have already been loaded
      return;
    }

    const variantInfo = variantData[this.getVariantDataIndex(formIndex)];
    // Do nothing if there is no variant information or the variant does not have color replacements
    if (!variantInfo || variantInfo[variant] !== 1) {
      return;
    }

    await populateVariantColorCache(
      "pkmn__" + baseSpriteKey,
      globalScene.experimentalSprites && hasExpSprite(spriteKey),
      baseSpriteKey.replace("__", "/"),
    );
  }

  async loadAssets(
    female: boolean,
    formIndex?: number,
    shiny = false,
    variant?: Variant,
    startLoad = false,
    back = false,
  ): Promise<void> {
    // We need to populate the color cache for this species' variant
    const spriteKey = this.getSpriteKey(female, formIndex, shiny, variant, back);
    globalScene.loadPokemonAtlas(spriteKey, this.getSpriteAtlasPath(female, formIndex, shiny, variant, back));
    globalScene.load.audio(this.getCryKey(formIndex), `audio/${this.getCryKey(formIndex)}.m4a`);
    if (variant != null) {
      await this.loadVariantColors(spriteKey, female, variant, back, formIndex);
    }
    return new Promise<void>(resolve => {
      globalScene.load.once(Phaser.Loader.Events.COMPLETE, () => {
        const originalWarn = console.warn;
        // Ignore warnings for missing frames, because there will be a lot
        console.warn = () => {};
        const frameNames = globalScene.anims.generateFrameNames(spriteKey, {
          zeroPad: 4,
          suffix: ".png",
          start: 1,
          end: 400,
        });
        console.warn = originalWarn;
        if (globalScene.anims.exists(spriteKey)) {
          globalScene.anims.get(spriteKey).frameRate = 10;
        } else {
          globalScene.anims.create({
            key: this.getSpriteKey(female, formIndex, shiny, variant, back),
            frames: frameNames,
            frameRate: 10,
            repeat: -1,
          });
        }
        const spritePath = this.getSpriteAtlasPath(female, formIndex, shiny, variant, back)
          .replace("variant/", "")
          .replace(/_[1-3]$/, "");
        if (variant != null) {
          loadPokemonVariantAssets(spriteKey, spritePath, variant).then(() => resolve());
        }
      });
      if (startLoad) {
        if (!globalScene.load.isLoading()) {
          globalScene.load.start();
        }
      } else {
        resolve();
      }
    });
  }

  cry(soundConfig?: Phaser.Types.Sound.SoundConfig, ignorePlay?: boolean): AnySound | null {
    const cryKey = this.getCryKey(this.formIndex);
    let cry: AnySound | null = globalScene.sound.get(cryKey) as AnySound;
    if (cry?.pendingRemove) {
      cry = null;
    }
    cry = audioManager.playSound(cry ?? cryKey, soundConfig);
    if (cry && ignorePlay) {
      cry.stop();
    }
    return cry;
  }

  generateCandyColors(): number[][] {
    const sourceTexture = globalScene.textures.get(this.getSpriteKey(false));

    const sourceFrame = sourceTexture.frames[sourceTexture.firstFrame];
    const sourceImage = sourceTexture.getSourceImage() as HTMLImageElement;

    const canvas = document.createElement("canvas");

    const spriteColors: number[][] = [];

    const context = canvas.getContext("2d");
    const frame = sourceFrame;
    canvas.width = frame.width;
    canvas.height = frame.height;
    context?.drawImage(sourceImage, frame.cutX, frame.cutY, frame.width, frame.height, 0, 0, frame.width, frame.height);
    const imageData = context?.getImageData(frame.cutX, frame.cutY, frame.width, frame.height);
    const pixelData = imageData?.data;
    const pixelColors: number[] = [];

    if (pixelData?.length !== undefined) {
      for (let i = 0; i < pixelData.length; i += 4) {
        if (pixelData[i + 3]) {
          const pixel = pixelData.slice(i, i + 4);
          const [r, g, b, a] = pixel;
          if (!spriteColors.find(c => c[0] === r && c[1] === g && c[2] === b)) {
            spriteColors.push([r, g, b, a]);
          }
        }
      }

      for (let i = 0; i < pixelData.length; i += 4) {
        const total = pixelData.slice(i, i + 3).reduce((total: number, value: number) => total + value, 0);
        if (!total) {
          continue;
        }
        pixelColors.push(
          argbFromRgba({
            r: pixelData[i],
            g: pixelData[i + 1],
            b: pixelData[i + 2],
            a: pixelData[i + 3],
          }),
        );
      }
    }

    let paletteColors: Map<number, number> = new Map();

    const originalRandom = Math.random;
    Math.random = randSeedFloat;

    globalScene.executeWithSeedOffset(
      () => {
        paletteColors = QuantizerCelebi.quantize(pixelColors, 2);
      },
      0,
      "This result should not vary",
    );

    Math.random = originalRandom;

    return Array.from(paletteColors.keys()).map(c => Object.values(rgbaFromArgb(c)) as number[]);
  }
}

interface PokemonSpeciesConstructor {
  id: SpeciesId;
  generation: number;
  subLegendary?: boolean;
  legendary?: boolean;
  mythical?: boolean;
  category: string;
  type1: RegularPokemonType;
  type2: RegularPokemonType | null;
  height: number;
  weight: number;
  ability1: AbilityId;
  ability2: AbilityId;
  abilityHidden: AbilityId;
  baseTotal: number;
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  baseSpatk: number;
  baseSpdef: number;
  baseSpd: number;
  catchRate: number;
  baseFriendship: number;
  baseExp: number;
  growthRate: GrowthRate;
  malePercent: number | null;
  genderDiffs: boolean;
  canChangeForm?: boolean;
  forms?: PokemonForm[];
}

export class PokemonSpecies extends PokemonSpeciesForm implements Localizable {
  public name: string;
  readonly subLegendary: boolean;
  readonly legendary: boolean;
  readonly mythical: boolean;
  public category: string;
  readonly growthRate: GrowthRate;
  /** The chance (as a decimal) for this Species to be male, or `null` for genderless species */
  readonly malePercent: number | null;
  readonly genderDiffs: boolean;
  readonly canChangeForm: boolean;
  readonly forms: PokemonForm[];

  constructor(data: PokemonSpeciesConstructor) {
    super({
      type1: data.type1,
      type2: data.type2,
      height: data.height,
      weight: data.weight,
      ability1: data.ability1,
      ability2: data.ability2,
      abilityHidden: data.abilityHidden,
      baseTotal: data.baseTotal,
      baseHp: data.baseHp,
      baseAtk: data.baseAtk,
      baseDef: data.baseDef,
      baseSpatk: data.baseSpatk,
      baseSpdef: data.baseSpdef,
      baseSpd: data.baseSpd,
      catchRate: data.catchRate,
      baseFriendship: data.baseFriendship,
      baseExp: data.baseExp,
      genderDiffs: data.genderDiffs,
      isStarterSelectable: false,
    });
    this.speciesId = data.id;
    this.formIndex = 0;
    this.generation = data.generation;
    this.subLegendary = data.subLegendary ?? false;
    this.legendary = data.legendary ?? false;
    this.mythical = data.mythical ?? false;
    this.category = data.category;
    this.growthRate = data.growthRate;
    this.malePercent = data.malePercent;
    this.genderDiffs = data.genderDiffs;
    this.canChangeForm = !!data.canChangeForm;
    this.forms = data.forms || [];

    this.localize();

    this.forms.forEach((form, f) => {
      form.speciesId = data.id;
      form.formIndex = f;
      form.generation = data.generation;
    });
  }

  getName(formIndex?: number): string {
    if (formIndex !== undefined && this.forms.length > 0) {
      const form = this.forms[formIndex];
      let key: string | undefined;
      switch (form.formKey) {
        case SpeciesFormKey.MEGA:
        case SpeciesFormKey.PRIMAL:
        case SpeciesFormKey.ETERNAMAX:
        case SpeciesFormKey.MEGA_X:
        case SpeciesFormKey.MEGA_Y:
        case SpeciesFormKey.MEGA_Z:
          key = form.formKey;
          break;
        case SpeciesFormKey.MEGA_ORIGINAL:
        case SpeciesFormKey.MEGA_CURLY:
        case SpeciesFormKey.MEGA_DROOPY:
        case SpeciesFormKey.MEGA_STRETCHY:
          key = "mega";
          break;
        default:
          if (form.formKey.indexOf(SpeciesFormKey.GIGANTAMAX) > -1) {
            key = "gigantamax";
          }
      }

      if (key) {
        return i18next.t(`battlePokemonForm:${toCamelCase(key)}`, { pokemonName: this.name });
      }
    }
    return this.name;
  }

  /**
   * Pick and return a random {@linkcode Gender} for a {@linkcode Pokemon}.
   * @returns A randomly rolled gender based on this Species' {@linkcode malePercent}.
   */
  generateGender(): Gender {
    if (this.malePercent == null) {
      return Gender.GENDERLESS;
    }

    if (randSeedFloat() * 100 <= this.malePercent) {
      return Gender.MALE;
    }
    return Gender.FEMALE;
  }

  /**
   * Find the name of species with proper attachments for regionals and separate starter forms (Floette, Ursaluna)
   * @returns a string with the region name or other form name attached
   */
  getExpandedSpeciesName(): string {
    if (this.speciesId < 2000) {
      return this.name; // Other special cases could be put here too
    }
    // Everything beyond this point essentially follows the pattern of FORMNAME_SPECIES
    return i18next.t(`pokemonForm:appendForm.${toCamelCase(SpeciesId[this.speciesId].split("_")[0])}`, {
      pokemonName: this.name,
    });
  }

  getFormKey(formIndex = this.formIndex): string {
    return this.forms[formIndex].formKey ?? "";
  }

  /**
   * Find the form name for species with just one form (regional variants, Floette, Ursaluna)
   * @param formIndex The form index to check (defaults to 0)
   * @param append Whether to append the species name to the end (defaults to false)
   * @returns the pokemon-form locale key for the single form name ("Alolan Form", "Eternal Flower" etc)
   */
  getFormNameToDisplay(formIndex = 0, append = false): string {
    const formKey = this.forms[formIndex]?.formKey ?? "";
    const formText = toPascalCase(formKey);
    const speciesName = toCamelCase(SpeciesId[this.speciesId]);
    let ret = "";

    const region = this.getRegion();
    if (this.speciesId === SpeciesId.ARCEUS) {
      ret = i18next.t(`pokemonInfo:type.${toCamelCase(formText)}`);
    } else if (
      [
        SpeciesFormKey.MEGA,
        SpeciesFormKey.MEGA_X,
        SpeciesFormKey.MEGA_Y,
        SpeciesFormKey.MEGA_Z,
        SpeciesFormKey.PRIMAL,
        SpeciesFormKey.GIGANTAMAX,
        SpeciesFormKey.GIGANTAMAX_RAPID,
        SpeciesFormKey.GIGANTAMAX_SINGLE,
        SpeciesFormKey.ETERNAMAX,
      ].includes(formKey as SpeciesFormKey)
    ) {
      return append
        ? i18next.t(`battlePokemonForm:${toCamelCase(formKey)}`, { pokemonName: this.name })
        : i18next.t(`pokemonForm:battleForm.${toCamelCase(formKey)}`);
    } else if (
      [
        SpeciesFormKey.MEGA_ORIGINAL,
        SpeciesFormKey.MEGA_CURLY,
        SpeciesFormKey.MEGA_DROOPY,
        SpeciesFormKey.MEGA_STRETCHY,
      ].includes(formKey as SpeciesFormKey)
    ) {
      return append
        ? i18next.t(`battlePokemonForm:${toCamelCase(SpeciesFormKey.MEGA)}`, { pokemonName: this.name })
        : i18next.t(`pokemonForm:battleForm.${toCamelCase(SpeciesFormKey.MEGA)}`);
    } else if (
      region === Region.NORMAL
      || (this.speciesId === SpeciesId.GALAR_DARMANITAN && formIndex > 0)
      || this.speciesId === SpeciesId.PALDEA_TAUROS
    ) {
      // More special cases can be added here
      const i18key = `pokemonForm:${speciesName}${formText}`;
      if (i18next.exists(i18key)) {
        ret = i18next.t(i18key);
      } else {
        const rootSpeciesName = toCamelCase(SpeciesId[this.getRootSpeciesId()]);
        const i18RootKey = `pokemonForm:${rootSpeciesName}${formText}`;
        ret = i18next.exists(i18RootKey) ? i18next.t(i18RootKey) : formText;
      }
    } else if (append) {
      // Everything beyond this has an expanded name
      return this.getExpandedSpeciesName();
    } else if (CUSTOM_FORM_NAMES[this.speciesId]) {
      return i18next.t(`pokemonForm:${CUSTOM_FORM_NAMES[this.speciesId]}`);
    } else {
      // Only regional forms should be left at this point
      return i18next.t(`pokemonForm:regionalForm.${toCamelCase(Region[region])}`);
    }
    return append
      ? i18next.t("pokemonForm:appendForm.generic", {
          pokemonName: this.name,
          formName: ret,
        })
      : ret;
  }

  localize(): void {
    this.name = i18next.t(`pokemon:${toCamelCase(SpeciesId[this.speciesId])}`);
    this.category = i18next.t(`pokemonCategory:${toCamelCase(SpeciesId[this.speciesId])}Category`);
  }

  getWildSpeciesForLevel(level: number, allowEvolving: boolean, isBoss: boolean, gameMode: GameMode): SpeciesId {
    return this.getSpeciesForLevel(
      level,
      allowEvolving,
      false,
      (isBoss ? PartyMemberStrength.WEAKER : PartyMemberStrength.AVERAGE) + (gameMode?.isEndless ? 1 : 0),
      isBoss ? EvoLevelThresholdKind.NORMAL : EvoLevelThresholdKind.WILD,
    );
  }

  /**
   * Determine which species of Pokémon to use for a given level in a trainer battle.
   *
   * @see {@linkcode getSpeciesForLevel}
   */
  getTrainerSpeciesForLevel(
    level: number,
    allowEvolving = false,
    strength: PartyMemberStrength = PartyMemberStrength.WEAKER,
    encounterKind: EvoLevelThresholdKind = EvoLevelThresholdKind.NORMAL,
  ): SpeciesId {
    return this.getSpeciesForLevel(level, allowEvolving, true, strength, encounterKind);
  }

  /**
   * Determine which species of Pokémon to use for a given level
   * @see {@linkcode determineEnemySpecies}
   */
  getSpeciesForLevel(
    level: number,
    allowEvolving = false,
    forTrainer = false,
    strength: PartyMemberStrength = PartyMemberStrength.WEAKER,
    encounterKind: EvoLevelThresholdKind = EvoLevelThresholdKind.NORMAL,
  ): SpeciesId {
    return determineEnemySpecies(this, level, allowEvolving, forTrainer, strength, encounterKind);
  }

  getEvolutionLevels(): EvolutionLevel[] {
    const evolutionLevels: EvolutionLevel[] = [];
    const { speciesId } = this;

    if (speciesDataRegistry.hasEvolutions(speciesId)) {
      for (const e of speciesDataRegistry.getEvolutions(speciesId)) {
        const sId = e.speciesId;
        const level = e.level;
        evolutionLevels.push([sId, level]);
        const nextEvolutionLevels = speciesDataRegistry.getSpecies(sId).getEvolutionLevels();
        for (const npl of nextEvolutionLevels) {
          evolutionLevels.push(npl);
        }
      }
    }

    return evolutionLevels;
  }

  /**
   * Get all prevolution levels for this species
   *
   * @remarks
   * `withThresholds` is used to return the evolution level thresholds for the species, to be used
   * when generating
   *
   * @param withThresholds - Whether to include evolution level thresholds in the returned data; default `false`
   */
  getPrevolutionLevels(withThresholds: true): EvolutionLevelWithThreshold[];
  getPrevolutionLevels(withThresholds: false): EvolutionLevel[];
  getPrevolutionLevels(
    withThresholds?: boolean,
  ): typeof withThresholds extends false ? EvolutionLevel[] : EvolutionLevelWithThreshold[];
  getPrevolutionLevels(withThresholds = false): EvolutionLevelWithThreshold[] | EvolutionLevel[] {
    const prevolutionLevels: (EvolutionLevel | EvolutionLevelWithThreshold)[] = [];

    const allEvolvingPokemon = speciesDataRegistry.getSpeciesWithEvolutions();
    for (const speciesId of allEvolvingPokemon) {
      for (const e of speciesDataRegistry.getEvolutions(speciesId)) {
        if (
          e.speciesId === this.speciesId
          && (this.forms.length === 0 || !e.evoFormKey || e.evoFormKey === this.forms[this.formIndex].formKey)
          && prevolutionLevels.every(pe => pe[0] !== speciesId)
        ) {
          const level = e.level;
          if (withThresholds && e.evoLevelThreshold) {
            prevolutionLevels.push([speciesId, level, e.evoLevelThreshold]);
          } else {
            prevolutionLevels.push([speciesId, level]);
          }
          const subPrevolutionLevels = speciesDataRegistry.getSpecies(speciesId).getPrevolutionLevels(withThresholds);
          for (const spl of subPrevolutionLevels) {
            prevolutionLevels.push(spl);
          }
        }
      }
    }

    return prevolutionLevels;
  }

  getCompatibleFusionSpeciesFilter(): PokemonSpeciesFilter {
    const hasEvolution = speciesDataRegistry.hasEvolutions(this.speciesId);
    const hasPrevolution = speciesDataRegistry.hasPrevolution(this.speciesId);
    const subLegendary = this.subLegendary;
    const legendary = this.legendary;
    const mythical = this.mythical;
    return species => {
      return (
        (subLegendary
          || legendary
          || mythical
          || (speciesDataRegistry.hasEvolutions(species.speciesId) === hasEvolution
            && speciesDataRegistry.hasPrevolution(species.speciesId) === hasPrevolution))
        && species.subLegendary === subLegendary
        && species.legendary === legendary
        && species.mythical === mythical
        && (this.isTrainerForbidden() || !species.isTrainerForbidden())
        && species.speciesId !== SpeciesId.DITTO
      );
    };
  }

  hasVariants() {
    let variantDataIndex: string | number = this.speciesId;
    if (this.forms.length > 0) {
      const formKey = this.forms[this.formIndex]?.formKey;
      if (formKey) {
        variantDataIndex = `${variantDataIndex}-${formKey}`;
      }
    }
    return Object.hasOwn(variantData, variantDataIndex) || Object.hasOwn(variantData, this.speciesId);
  }

  getFormSpriteKey(formIndex?: number) {
    if (this.forms.length > 0 && formIndex !== undefined && formIndex >= this.forms.length) {
      console.warn(
        `Attempted accessing form with index ${formIndex} of species ${this.getName()} with only ${this.forms.length || 0} forms`,
      );
      formIndex = Math.min(formIndex, this.forms.length - 1);
    }
    return this.forms?.length > 0 ? this.forms[formIndex || 0].getFormSpriteKey() : "";
  }

  /**
   * Generates a {@linkcode BigInt} corresponding to the maximum unlocks possible for this species,
   * taking into account if the species has a male/female gender, and which variants are implemented.
   * @returns The maximum unlocks for the species as a `BigInt`; can be compared with {@linkcode DexEntry.caughtAttr}.
   */
  getFullUnlocksData(): bigint {
    let caughtAttr = 0n;
    caughtAttr += DexAttr.NON_SHINY;
    caughtAttr += DexAttr.SHINY;
    if (this.malePercent !== null) {
      if (this.malePercent > 0) {
        caughtAttr += DexAttr.MALE;
      }
      if (this.malePercent < 100) {
        caughtAttr += DexAttr.FEMALE;
      }
    }
    caughtAttr += DexAttr.DEFAULT_VARIANT;
    if (this.hasVariants()) {
      caughtAttr += DexAttr.VARIANT_2;
      caughtAttr += DexAttr.VARIANT_3;
    }

    // Summing successive bigints for each obtainable form
    caughtAttr +=
      this?.forms?.length > 1
        ? this.forms
            .map((f, index) => (f.isUnobtainable ? 0n : 128n * 2n ** BigInt(index)))
            .reduce((acc, val) => acc + val, 0n)
        : DexAttr.DEFAULT_FORM;

    return caughtAttr;
  }
}

interface PokemonFormConstructor {
  formName: string;
  formKey: string;
  type1: RegularPokemonType;
  type2: RegularPokemonType | null;
  height: number;
  weight: number;
  ability1: AbilityId;
  ability2: AbilityId;
  abilityHidden: AbilityId;
  baseTotal: number;
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  baseSpatk: number;
  baseSpdef: number;
  baseSpd: number;
  catchRate: number;
  baseFriendship: number;
  baseExp: number;
  genderDiffs?: boolean;
  formSpriteKey?: string | null;
  isStarterSelectable?: boolean;
  isUnobtainable?: boolean;
}

export class PokemonForm extends PokemonSpeciesForm {
  public formName: string;
  public formKey: string;
  public formSpriteKey: string | null;
  public isUnobtainable: boolean;

  // This is a collection of form keys that have in-run form changes, but should still be separately selectable from the start screen
  private starterSelectableKeys: string[] = [
    "10",
    "50",
    "10-pc",
    "50-pc",
    "red",
    "orange",
    "yellow",
    "green",
    "blue",
    "indigo",
    "violet",
  ];

  constructor(data: PokemonFormConstructor) {
    super({
      type1: data.type1,
      type2: data.type2,
      height: data.height,
      weight: data.weight,
      ability1: data.ability1,
      ability2: data.ability2,
      abilityHidden: data.abilityHidden,
      baseTotal: data.baseTotal,
      baseHp: data.baseHp,
      baseAtk: data.baseAtk,
      baseDef: data.baseDef,
      baseSpatk: data.baseSpatk,
      baseSpdef: data.baseSpdef,
      baseSpd: data.baseSpd,
      catchRate: data.catchRate,
      baseFriendship: data.baseFriendship,
      baseExp: data.baseExp,
      genderDiffs: data.genderDiffs ?? false,
      isStarterSelectable: data.isStarterSelectable ?? !data.formKey,
    });
    this.formName = data.formName;
    this.formKey = data.formKey;
    this.formSpriteKey = data.formSpriteKey ?? null;
    this.isUnobtainable = data.isUnobtainable ?? false;
  }

  getFormSpriteKey(_formIndex?: number) {
    return this.formSpriteKey === null ? this.formKey : this.formSpriteKey;
  }

  getFormKey(): string {
    return this.formKey;
  }

  /**
   * Get a list of all level moves for this species, including form specific moves.
   * @param formKey - (Optional) The key for the form to be checked. Uses this form if not specified
   * @returns A list of all level moves that can be learned by this species
   */
  public override getLevelMoves(formKey?: string): LevelMoves {
    return super.getLevelMoves(formKey ?? this.getFormKey());
  }
}
