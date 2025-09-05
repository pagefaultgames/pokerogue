import type { AnySound } from "#app/battle-scene";
import type { GameMode } from "#app/game-mode";
import { globalScene } from "#app/global-scene";
import { uncatchableSpecies } from "#balance/biomes";
import { speciesEggMoves } from "#balance/egg-moves";
import { starterPassiveAbilities } from "#balance/passives";
import type { EvolutionLevel } from "#balance/pokemon-evolutions";
import { pokemonEvolutions, pokemonPrevolutions, SpeciesWildEvolutionDelay } from "#balance/pokemon-evolutions";
import type { LevelMoves } from "#balance/pokemon-level-moves";
import {
  pokemonFormLevelMoves,
  pokemonFormLevelMoves as pokemonSpeciesFormLevelMoves,
  pokemonSpeciesLevelMoves,
} from "#balance/pokemon-level-moves";
import { speciesStarterCosts } from "#balance/starters";
import type { GrowthRate } from "#data/exp";
import { Gender } from "#data/gender";
import { AbilityId } from "#enums/ability-id";
import { DexAttr } from "#enums/dex-attr";
import { PartyMemberStrength } from "#enums/party-member-strength";
import type { PokemonType } from "#enums/pokemon-type";
import { SpeciesFormKey } from "#enums/species-form-key";
import { SpeciesId } from "#enums/species-id";
import type { Stat } from "#enums/stat";
import { loadPokemonVariantAssets } from "#sprites/pokemon-sprite";
import { hasExpSprite } from "#sprites/sprite-utils";
import type { Variant, VariantSet } from "#sprites/variant";
import { populateVariantColorCache, variantColorCache, variantData } from "#sprites/variant";
import type { StarterMoveset } from "#system/game-data";
import type { Localizable } from "#types/locales";
import { isNullOrUndefined, randSeedFloat, randSeedGauss, randSeedInt } from "#utils/common";
import { getPokemonSpecies } from "#utils/pokemon-utils";
import { toCamelCase, toPascalCase } from "#utils/strings";
import { argbFromRgba, QuantizerCelebi, rgbaFromArgb } from "@material/material-color-utilities";
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
  SpeciesId.FROAKIE,
  SpeciesId.FROGADIER,
  SpeciesId.GRENINJA,
  SpeciesId.ROCKRUFF,
  SpeciesId.NECROZMA,
  SpeciesId.MAGEARNA,
  SpeciesId.MARSHADOW,
  SpeciesId.CRAMORANT,
  SpeciesId.ZARUDE,
  SpeciesId.CALYREX,
];

export type PokemonSpeciesFilter = (species: PokemonSpecies) => boolean;

export abstract class PokemonSpeciesForm {
  public speciesId: SpeciesId;
  protected _formIndex: number;
  protected _generation: number;
  readonly type1: PokemonType;
  readonly type2: PokemonType | null;
  readonly height: number;
  readonly weight: number;
  readonly ability1: AbilityId;
  readonly ability2: AbilityId;
  readonly abilityHidden: AbilityId;
  readonly baseTotal: number;
  readonly baseStats: number[];
  readonly catchRate: number;
  readonly baseFriendship: number;
  readonly baseExp: number;
  readonly genderDiffs: boolean;
  readonly isStarterSelectable: boolean;

  constructor(
    type1: PokemonType,
    type2: PokemonType | null,
    height: number,
    weight: number,
    ability1: AbilityId,
    ability2: AbilityId,
    abilityHidden: AbilityId,
    baseTotal: number,
    baseHp: number,
    baseAtk: number,
    baseDef: number,
    baseSpatk: number,
    baseSpdef: number,
    baseSpd: number,
    catchRate: number,
    baseFriendship: number,
    baseExp: number,
    genderDiffs: boolean,
    isStarterSelectable: boolean,
  ) {
    this.type1 = type1;
    this.type2 = type2;
    this.height = height;
    this.weight = weight;
    this.ability1 = ability1;
    this.ability2 = ability2 === AbilityId.NONE ? ability1 : ability2;
    this.abilityHidden = abilityHidden;
    this.baseTotal = baseTotal;
    this.baseStats = [baseHp, baseAtk, baseDef, baseSpatk, baseSpdef, baseSpd];
    this.catchRate = catchRate;
    this.baseFriendship = baseFriendship;
    this.baseExp = baseExp;
    this.genderDiffs = genderDiffs;
    this.isStarterSelectable = isStarterSelectable;
  }

  /**
   * Method to get the root species id of a Pokemon.
   * Magmortar.getRootSpeciesId(true) => Magmar
   * Magmortar.getRootSpeciesId(false) => Magby
   * @param forStarter boolean to get the nonbaby form of a starter
   * @returns The species
   */
  getRootSpeciesId(forStarter = false): SpeciesId {
    let ret = this.speciesId;
    while (pokemonPrevolutions.hasOwnProperty(ret) && (!forStarter || !speciesStarterCosts.hasOwnProperty(ret))) {
      ret = pokemonPrevolutions[ret];
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
    return this.abilityHidden !== AbilityId.NONE ? 3 : 2;
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
  getPassiveAbility(formIndex?: number): AbilityId {
    if (isNullOrUndefined(formIndex)) {
      formIndex = this.formIndex;
    }
    let starterSpeciesId = this.speciesId;
    while (
      !(starterSpeciesId in starterPassiveAbilities)
      || !(formIndex in starterPassiveAbilities[starterSpeciesId])
    ) {
      if (pokemonPrevolutions.hasOwnProperty(starterSpeciesId)) {
        starterSpeciesId = pokemonPrevolutions[starterSpeciesId];
      } else {
        // If we've reached the base species and still haven't found a matching ability, use form 0 if possible
        if (0 in starterPassiveAbilities[starterSpeciesId]) {
          return starterPassiveAbilities[starterSpeciesId][0];
        }
        console.log("No passive ability found for %s, using run away", this.speciesId);
        return AbilityId.RUN_AWAY;
      }
    }
    return starterPassiveAbilities[starterSpeciesId][formIndex];
  }

  getLevelMoves(): LevelMoves {
    if (
      pokemonSpeciesFormLevelMoves.hasOwnProperty(this.speciesId)
      && pokemonSpeciesFormLevelMoves[this.speciesId].hasOwnProperty(this.formIndex)
    ) {
      return pokemonSpeciesFormLevelMoves[this.speciesId][this.formIndex].slice(0);
    }
    return pokemonSpeciesLevelMoves[this.speciesId].slice(0);
  }

  getRegion(): Region {
    return Math.floor(this.speciesId / 2000) as Region;
  }

  isObtainable(): boolean {
    return this.generation <= 9 || pokemonPrevolutions.hasOwnProperty(this.speciesId);
  }

  isCatchable(): boolean {
    return this.isObtainable() && uncatchableSpecies.indexOf(this.speciesId) === -1;
  }

  isRegional(): boolean {
    return this.getRegion() > Region.NORMAL;
  }

  isTrainerForbidden(): boolean {
    return [SpeciesId.ETERNAL_FLOETTE, SpeciesId.BLOODMOON_URSALUNA].includes(this.speciesId);
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
      case SpeciesFormKey.PRIMAL:
      case SpeciesFormKey.GIGANTAMAX:
      case SpeciesFormKey.ETERNAMAX:
        ret *= 1.5;
        break;
    }
    return ret;
  }

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
      && ![SpeciesFormKey.MEGA, SpeciesFormKey.GIGANTAMAX].includes(formSpriteKey as SpeciesFormKey);

    return `${showGenderDiffs ? "female__" : ""}${this.speciesId}${formSpriteKey ? `-${formSpriteKey}` : ""}`;
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
  getVariantDataIndex(formIndex?: number) {
    let formkey: string | null = null;
    let variantDataIndex: number | string = this.speciesId;
    const species = getPokemonSpecies(this.speciesId);
    if (species.forms.length > 0 && formIndex !== undefined) {
      formkey = species.forms[formIndex]?.getFormSpriteKey(formIndex);
      if (formkey) {
        variantDataIndex = `${this.speciesId}-${formkey}`;
      }
    }
    return variantDataIndex;
  }

  getIconAtlasKey(formIndex?: number, shiny?: boolean, variant?: number): string {
    const variantDataIndex = this.getVariantDataIndex(formIndex);
    const isVariant =
      shiny && variantData[variantDataIndex] && variant !== undefined && variantData[variantDataIndex][variant];
    return `pokemon_icons_${this.generation}${isVariant ? "v" : ""}`;
  }

  getIconId(female: boolean, formIndex?: number, shiny?: boolean, variant?: number): string {
    if (formIndex === undefined) {
      formIndex = this.formIndex;
    }

    const variantDataIndex = this.getVariantDataIndex(formIndex);

    let ret = this.speciesId.toString();

    const isVariant =
      shiny && variantData[variantDataIndex] && variant !== undefined && variantData[variantDataIndex][variant];

    if (shiny && !isVariant) {
      ret += "s";
    }

    switch (this.speciesId) {
      case SpeciesId.DODUO:
      case SpeciesId.DODRIO:
      case SpeciesId.MEGANIUM:
      case SpeciesId.TORCHIC:
      case SpeciesId.COMBUSKEN:
      case SpeciesId.BLAZIKEN:
      case SpeciesId.HIPPOPOTAS:
      case SpeciesId.HIPPOWDON:
      case SpeciesId.UNFEZANT:
      case SpeciesId.FRILLISH:
      case SpeciesId.JELLICENT:
      case SpeciesId.PYROAR:
        ret += female ? "-f" : "";
        break;
    }

    let formSpriteKey = this.getFormSpriteKey(formIndex);
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
    if (this.speciesId > 2000) {
      switch (this.speciesId) {
        case SpeciesId.GALAR_SLOWPOKE:
          break;
        case SpeciesId.ETERNAL_FLOETTE:
          break;
        case SpeciesId.BLOODMOON_URSALUNA:
          break;
        default:
          speciesId = speciesId % 2000;
          break;
      }
    }
    let ret = speciesId.toString();
    const forms = getPokemonSpecies(speciesId).forms;
    if (forms.length > 0) {
      if (formIndex !== undefined && formIndex >= forms.length) {
        console.warn(
          `Attempted accessing form with index ${formIndex} of species ${getPokemonSpecies(speciesId).getName()} with only ${forms.length || 0} forms`,
        );
        formIndex = Math.min(formIndex, forms.length - 1);
      }
      const formKey = forms[formIndex || 0].formKey;
      switch (formKey) {
        case SpeciesFormKey.MEGA:
        case SpeciesFormKey.MEGA_X:
        case SpeciesFormKey.MEGA_Y:
        case SpeciesFormKey.GIGANTAMAX:
        case SpeciesFormKey.GIGANTAMAX_SINGLE:
        case SpeciesFormKey.GIGANTAMAX_RAPID:
        case "white":
        case "black":
        case "therian":
        case "sky":
        case "gorging":
        case "gulping":
        case "no-ice":
        case "hangry":
        case "crowned":
        case "eternamax":
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
      }
    }
    return `cry/${ret}`;
  }

  validateStarterMoveset(moveset: StarterMoveset, eggMoves: number): boolean {
    const rootSpeciesId = this.getRootSpeciesId();
    for (const moveId of moveset) {
      if (speciesEggMoves.hasOwnProperty(rootSpeciesId)) {
        const eggMoveIndex = speciesEggMoves[rootSpeciesId].indexOf(moveId);
        if (eggMoveIndex > -1 && eggMoves & (1 << eggMoveIndex)) {
          continue;
        }
      }
      if (
        pokemonFormLevelMoves.hasOwnProperty(this.speciesId)
        && pokemonFormLevelMoves[this.speciesId].hasOwnProperty(this.formIndex)
      ) {
        if (!pokemonFormLevelMoves[this.speciesId][this.formIndex].find(lm => lm[0] <= 5 && lm[1] === moveId)) {
          return false;
        }
      } else if (!pokemonSpeciesLevelMoves[this.speciesId].find(lm => lm[0] <= 5 && lm[1] === moveId)) {
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

    if (variantColorCache.hasOwnProperty(baseSpriteKey)) {
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
    if (!isNullOrUndefined(variant)) {
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
        if (!globalScene.anims.exists(spriteKey)) {
          globalScene.anims.create({
            key: this.getSpriteKey(female, formIndex, shiny, variant, back),
            frames: frameNames,
            frameRate: 10,
            repeat: -1,
          });
        } else {
          globalScene.anims.get(spriteKey).frameRate = 10;
        }
        const spritePath = this.getSpriteAtlasPath(female, formIndex, shiny, variant, back)
          .replace("variant/", "")
          .replace(/_[1-3]$/, "");
        if (!isNullOrUndefined(variant)) {
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
    cry = globalScene.playSound(cry ?? cryKey, soundConfig);
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

  constructor(
    id: SpeciesId,
    generation: number,
    subLegendary: boolean,
    legendary: boolean,
    mythical: boolean,
    category: string,
    type1: PokemonType,
    type2: PokemonType | null,
    height: number,
    weight: number,
    ability1: AbilityId,
    ability2: AbilityId,
    abilityHidden: AbilityId,
    baseTotal: number,
    baseHp: number,
    baseAtk: number,
    baseDef: number,
    baseSpatk: number,
    baseSpdef: number,
    baseSpd: number,
    catchRate: number,
    baseFriendship: number,
    baseExp: number,
    growthRate: GrowthRate,
    malePercent: number | null,
    genderDiffs: boolean,
    canChangeForm?: boolean,
    ...forms: PokemonForm[]
  ) {
    super(
      type1,
      type2,
      height,
      weight,
      ability1,
      ability2,
      abilityHidden,
      baseTotal,
      baseHp,
      baseAtk,
      baseDef,
      baseSpatk,
      baseSpdef,
      baseSpd,
      catchRate,
      baseFriendship,
      baseExp,
      genderDiffs,
      false,
    );
    this.speciesId = id;
    this.formIndex = 0;
    this.generation = generation;
    this.subLegendary = subLegendary;
    this.legendary = legendary;
    this.mythical = mythical;
    this.category = category;
    this.growthRate = growthRate;
    this.malePercent = malePercent;
    this.genderDiffs = genderDiffs;
    this.canChangeForm = !!canChangeForm;
    this.forms = forms;

    this.localize();

    forms.forEach((form, f) => {
      form.speciesId = id;
      form.formIndex = f;
      form.generation = generation;
    });
  }

  getName(formIndex?: number): string {
    if (formIndex !== undefined && this.forms.length > 0) {
      const form = this.forms[formIndex];
      let key: string | null;
      switch (form.formKey) {
        case SpeciesFormKey.MEGA:
        case SpeciesFormKey.PRIMAL:
        case SpeciesFormKey.ETERNAMAX:
        case SpeciesFormKey.MEGA_X:
        case SpeciesFormKey.MEGA_Y:
          key = form.formKey;
          break;
        default:
          if (form.formKey.indexOf(SpeciesFormKey.GIGANTAMAX) > -1) {
            key = "gigantamax";
          } else {
            key = null;
          }
      }

      if (key) {
        return i18next.t(`battlePokemonForm:${toCamelCase(key)}`, {
          pokemonName: this.name,
        });
      }
    }
    return this.name;
  }

  /**
   * Pick and return a random {@linkcode Gender} for a {@linkcode Pokemon}.
   * @returns A randomly rolled gender based on this Species' {@linkcode malePercent}.
   */
  generateGender(): Gender {
    if (isNullOrUndefined(this.malePercent)) {
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
    } else if (this.speciesId === SpeciesId.ETERNAL_FLOETTE) {
      // Not a real form, so the key is made up
      return i18next.t("pokemonForm:floetteEternalFlower");
    } else if (this.speciesId === SpeciesId.BLOODMOON_URSALUNA) {
      // Not a real form, so the key is made up
      return i18next.t("pokemonForm:ursalunaBloodmoon");
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
    );
  }

  getTrainerSpeciesForLevel(
    level: number,
    allowEvolving = false,
    strength: PartyMemberStrength,
    currentWave = 0,
  ): SpeciesId {
    return this.getSpeciesForLevel(level, allowEvolving, true, strength, currentWave);
  }

  /**
   * @see {@linkcode getSpeciesForLevel} uses an ease in and ease out sine function:
   * @see {@link https://easings.net/#easeInSine}
   * @see {@link https://easings.net/#easeOutSine}
   * Ease in is similar to an exponential function with slower growth, as in, x is directly related to y, and increase in y is higher for higher x.
   * Ease out looks more similar to a logarithmic function shifted to the left. It's still a direct relation but it plateaus instead of increasing in growth.
   *
   * This function is used to calculate the x given to these functions, which is used for evolution chance.
   *
   * First is maxLevelDiff, which is a denominator for evolution chance for mons without wild evolution delay.
   * This means a lower value of x will lead to a higher evolution chance.
   *
   * It's also used for preferredMinLevel, which is used when an evolution delay exists.
   * The calculation with evolution delay is a weighted average of the easeIn and easeOut functions where preferredMinLevel is the denominator.
   * This also means a lower value of x will lead to a higher evolution chance.
   * @param strength {@linkcode PartyMemberStrength} The strength of the party member in question
   * @returns {@linkcode number} The level difference from expected evolution level tolerated for a mon to be unevolved. Lower value = higher evolution chance.
   */
  private getStrengthLevelDiff(strength: PartyMemberStrength): number {
    switch (Math.min(strength, PartyMemberStrength.STRONGER)) {
      case PartyMemberStrength.WEAKEST:
        return 60;
      case PartyMemberStrength.WEAKER:
        return 40;
      case PartyMemberStrength.WEAK:
        return 20;
      case PartyMemberStrength.AVERAGE:
        return 8;
      case PartyMemberStrength.STRONG:
        return 4;
      default:
        return 0;
    }
  }

  getSpeciesForLevel(
    level: number,
    allowEvolving = false,
    forTrainer = false,
    strength: PartyMemberStrength = PartyMemberStrength.WEAKER,
    currentWave = 0,
  ): SpeciesId {
    const prevolutionLevels = this.getPrevolutionLevels();

    if (prevolutionLevels.length > 0) {
      for (let pl = prevolutionLevels.length - 1; pl >= 0; pl--) {
        const prevolutionLevel = prevolutionLevels[pl];
        if (level < prevolutionLevel[1]) {
          return prevolutionLevel[0];
        }
      }
    }

    if (
      // If evolutions shouldn't happen, add more cases here :)
      !allowEvolving
      || !pokemonEvolutions.hasOwnProperty(this.speciesId)
      || (globalScene.currentBattle?.waveIndex === 20
        && globalScene.gameMode.isClassic
        && globalScene.currentBattle.trainer)
    ) {
      return this.speciesId;
    }

    const evolutions = pokemonEvolutions[this.speciesId];

    const easeInFunc = Phaser.Tweens.Builders.GetEaseFunction("Sine.easeIn");
    const easeOutFunc = Phaser.Tweens.Builders.GetEaseFunction("Sine.easeOut");

    const evolutionPool: Map<number, SpeciesId> = new Map();
    let totalWeight = 0;
    let noEvolutionChance = 1;

    for (const ev of evolutions) {
      if (ev.level > level) {
        continue;
      }

      let evolutionChance: number;

      const evolutionSpecies = getPokemonSpecies(ev.speciesId);
      const isRegionalEvolution = !this.isRegional() && evolutionSpecies.isRegional();

      if (!forTrainer && isRegionalEvolution) {
        evolutionChance = 0;
      } else if (ev.wildDelay === SpeciesWildEvolutionDelay.NONE) {
        if (strength === PartyMemberStrength.STRONGER) {
          evolutionChance = 1;
        } else {
          const maxLevelDiff = this.getStrengthLevelDiff(strength); //The maximum distance from the evolution level tolerated for the mon to not evolve
          const minChance: number = 0.875 - 0.125 * strength;

          evolutionChance = Math.min(
            minChance + easeInFunc(Math.min(level - ev.level, maxLevelDiff) / maxLevelDiff) * (1 - minChance),
            1,
          );
        }
      } else {
        const preferredMinLevel = Math.max(ev.level - 1 + ev.wildDelay! * this.getStrengthLevelDiff(strength), 1); // TODO: is the bang correct?
        let evolutionLevel = Math.max(ev.level > 1 ? ev.level : Math.floor(preferredMinLevel / 2), 1);

        if (ev.level <= 1 && pokemonPrevolutions.hasOwnProperty(this.speciesId)) {
          const prevolutionLevel = pokemonEvolutions[pokemonPrevolutions[this.speciesId]].find(
            ev => ev.speciesId === this.speciesId,
          )!.level; // TODO: is the bang correct?
          if (prevolutionLevel > 1) {
            evolutionLevel = prevolutionLevel;
          }
        }

        evolutionChance = Math.min(
          0.65 * easeInFunc(Math.min(Math.max(level - evolutionLevel, 0), preferredMinLevel) / preferredMinLevel)
            + 0.35
              * easeOutFunc(
                Math.min(Math.max(level - evolutionLevel, 0), preferredMinLevel * 2.5) / (preferredMinLevel * 2.5),
              ),
          1,
        );
      }

      //TODO: Adjust templates and delays so we don't have to hardcode it
      /* TEMPORARY! (Most) Trainers shouldn't be using unevolved Pokemon by the third gym leader / wave 80. Exceptions to this include Breeders, whose large teams are balanced by the use of weaker pokemon */
      if (currentWave >= 80 && forTrainer && strength > PartyMemberStrength.WEAKER) {
        evolutionChance = 1;
        noEvolutionChance = 0;
      }

      if (evolutionChance > 0) {
        if (isRegionalEvolution) {
          evolutionChance /= evolutionSpecies.isRareRegional() ? 16 : 4;
        }

        totalWeight += evolutionChance;

        evolutionPool.set(totalWeight, ev.speciesId);

        if (1 - evolutionChance < noEvolutionChance) {
          noEvolutionChance = 1 - evolutionChance;
        }
      }
    }

    if (noEvolutionChance === 1 || randSeedFloat() <= noEvolutionChance) {
      return this.speciesId;
    }

    const randValue = evolutionPool.size === 1 ? 0 : randSeedInt(totalWeight);

    for (const weight of evolutionPool.keys()) {
      if (randValue < weight) {
        // TODO: this entire function is dumb and should be changed, adding a `!` here for now until then
        return getPokemonSpecies(evolutionPool.get(weight)!).getSpeciesForLevel(
          level,
          true,
          forTrainer,
          strength,
          currentWave,
        );
      }
    }

    return this.speciesId;
  }

  getEvolutionLevels(): EvolutionLevel[] {
    const evolutionLevels: EvolutionLevel[] = [];

    //console.log(Species[this.speciesId], pokemonEvolutions[this.speciesId])

    if (pokemonEvolutions.hasOwnProperty(this.speciesId)) {
      for (const e of pokemonEvolutions[this.speciesId]) {
        const speciesId = e.speciesId;
        const level = e.level;
        evolutionLevels.push([speciesId, level]);
        //console.log(Species[speciesId], getPokemonSpecies(speciesId), getPokemonSpecies(speciesId).getEvolutionLevels());
        const nextEvolutionLevels = getPokemonSpecies(speciesId).getEvolutionLevels();
        for (const npl of nextEvolutionLevels) {
          evolutionLevels.push(npl);
        }
      }
    }

    return evolutionLevels;
  }

  getPrevolutionLevels(): EvolutionLevel[] {
    const prevolutionLevels: EvolutionLevel[] = [];

    const allEvolvingPokemon = Object.keys(pokemonEvolutions);
    for (const p of allEvolvingPokemon) {
      for (const e of pokemonEvolutions[p]) {
        if (
          e.speciesId === this.speciesId
          && (this.forms.length === 0 || !e.evoFormKey || e.evoFormKey === this.forms[this.formIndex].formKey)
          && prevolutionLevels.every(pe => pe[0] !== Number.parseInt(p))
        ) {
          const speciesId = Number.parseInt(p) as SpeciesId;
          const level = e.level;
          prevolutionLevels.push([speciesId, level]);
          const subPrevolutionLevels = getPokemonSpecies(speciesId).getPrevolutionLevels();
          for (const spl of subPrevolutionLevels) {
            prevolutionLevels.push(spl);
          }
        }
      }
    }

    return prevolutionLevels;
  }

  // This could definitely be written better and more accurate to the getSpeciesForLevel logic, but it is only for generating movesets for evolved Pokemon
  getSimulatedEvolutionChain(
    currentLevel: number,
    forTrainer = false,
    isBoss = false,
    player = false,
  ): EvolutionLevel[] {
    const ret: EvolutionLevel[] = [];
    if (pokemonPrevolutions.hasOwnProperty(this.speciesId)) {
      const prevolutionLevels = this.getPrevolutionLevels().reverse();
      const levelDiff = player ? 0 : forTrainer || isBoss ? (forTrainer && isBoss ? 2.5 : 5) : 10;
      ret.push([prevolutionLevels[0][0], 1]);
      for (let l = 1; l < prevolutionLevels.length; l++) {
        const evolution = pokemonEvolutions[prevolutionLevels[l - 1][0]].find(
          e => e.speciesId === prevolutionLevels[l][0],
        );
        ret.push([
          prevolutionLevels[l][0],
          Math.min(
            Math.max(
              evolution?.level!
                + Math.round(randSeedGauss(0.5, 1 + levelDiff * 0.2) * Math.max(evolution?.wildDelay!, 0.5) * 5)
                - 1,
              2,
              evolution?.level!,
            ),
            currentLevel - 1,
          ),
        ]); // TODO: are those bangs correct?
      }
      const lastPrevolutionLevel = ret[prevolutionLevels.length - 1][1];
      const evolution = pokemonEvolutions[prevolutionLevels.at(-1)![0]].find(e => e.speciesId === this.speciesId);
      ret.push([
        this.speciesId,
        Math.min(
          Math.max(
            lastPrevolutionLevel
              + Math.round(randSeedGauss(0.5, 1 + levelDiff * 0.2) * Math.max(evolution?.wildDelay!, 0.5) * 5),
            lastPrevolutionLevel + 1,
            evolution?.level!,
          ),
          currentLevel,
        ),
      ]); // TODO: are those bangs correct?
    } else {
      ret.push([this.speciesId, 1]);
    }

    return ret;
  }

  getCompatibleFusionSpeciesFilter(): PokemonSpeciesFilter {
    const hasEvolution = pokemonEvolutions.hasOwnProperty(this.speciesId);
    const hasPrevolution = pokemonPrevolutions.hasOwnProperty(this.speciesId);
    const subLegendary = this.subLegendary;
    const legendary = this.legendary;
    const mythical = this.mythical;
    return species => {
      return (
        (subLegendary
          || legendary
          || mythical
          || (pokemonEvolutions.hasOwnProperty(species.speciesId) === hasEvolution
            && pokemonPrevolutions.hasOwnProperty(species.speciesId) === hasPrevolution))
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
    return variantData.hasOwnProperty(variantDataIndex) || variantData.hasOwnProperty(this.speciesId);
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

  constructor(
    formName: string,
    formKey: string,
    type1: PokemonType,
    type2: PokemonType | null,
    height: number,
    weight: number,
    ability1: AbilityId,
    ability2: AbilityId,
    abilityHidden: AbilityId,
    baseTotal: number,
    baseHp: number,
    baseAtk: number,
    baseDef: number,
    baseSpatk: number,
    baseSpdef: number,
    baseSpd: number,
    catchRate: number,
    baseFriendship: number,
    baseExp: number,
    genderDiffs = false,
    formSpriteKey: string | null = null,
    isStarterSelectable = false,
    isUnobtainable = false,
  ) {
    super(
      type1,
      type2,
      height,
      weight,
      ability1,
      ability2,
      abilityHidden,
      baseTotal,
      baseHp,
      baseAtk,
      baseDef,
      baseSpatk,
      baseSpdef,
      baseSpd,
      catchRate,
      baseFriendship,
      baseExp,
      genderDiffs,
      isStarterSelectable || !formKey,
    );
    this.formName = formName;
    this.formKey = formKey;
    this.formSpriteKey = formSpriteKey;
    this.isUnobtainable = isUnobtainable;
  }

  getFormSpriteKey(_formIndex?: number) {
    return this.formSpriteKey !== null ? this.formSpriteKey : this.formKey;
  }
}
