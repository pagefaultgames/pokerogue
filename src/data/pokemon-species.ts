import { Abilities } from "./enums/abilities";
import BattleScene, { AnySound } from "../battle-scene";
import { Variant, variantColorCache } from "./variant";
import { variantData } from "./variant";
import { GrowthRate } from "./exp";
import { SpeciesWildEvolutionDelay, pokemonEvolutions, pokemonPrevolutions } from "./pokemon-evolutions";
import { Species } from "./enums/species";
import { Type } from "./type";
import { LevelMoves, pokemonFormLevelMoves, pokemonFormLevelMoves as pokemonSpeciesFormLevelMoves, pokemonSpeciesLevelMoves } from "./pokemon-level-moves";
import { uncatchableSpecies } from "./biomes";
import * as Utils from "../utils";
import { StarterMoveset } from "../system/game-data";
import { speciesEggMoves } from "./egg-moves";
import { PartyMemberStrength } from "./enums/party-member-strength";
import { GameMode } from "../game-mode";
import { QuantizerCelebi, argbFromRgba, rgbaFromArgb } from "@material/material-color-utilities";
import { VariantSet } from "./variant";
import i18next, { Localizable } from "../plugins/i18n";
import { Stat } from "./pokemon-stat";

export enum Region {
  NORMAL,
  ALOLA,
  GALAR,
  HISUI,
  PALDEA
}

export function getPokemonSpecies(species: Species): PokemonSpecies {
  // If a special pool (named trainers) is used here it CAN happen that they have a array as species (which means choose one of those two). So we catch that with this code block
  if (Array.isArray(species)) {
    // Pick a random species from the list
    species = species[Math.floor(Math.random() * species.length)];
  }
  if (species >= 2000) {
    return allSpecies.find(s => s.speciesId === species);
  }
  return allSpecies[species - 1];
}

export function getPokemonSpeciesForm(species: Species, formIndex: integer): PokemonSpeciesForm {
  const retSpecies: PokemonSpecies = species >= 2000
    ? allSpecies.find(s => s.speciesId === species)
    : allSpecies[species - 1];
  if (formIndex < retSpecies.forms?.length) {
    return retSpecies.forms[formIndex];
  }
  return retSpecies;
}

export function getFusedSpeciesName(speciesAName: string, speciesBName: string): string {
  const fragAPattern = /([a-z]{2}.*?[aeiou(?:y$)\-\']+)(.*?)$/i;
  const fragBPattern = /([a-z]{2}.*?[aeiou(?:y$)\-\'])(.*?)$/i;

  const [ speciesAPrefixMatch, speciesBPrefixMatch ] = [ speciesAName, speciesBName ].map(n => /^(?:[^ ]+) /.exec(n));
  const [ speciesAPrefix, speciesBPrefix ] = [ speciesAPrefixMatch, speciesBPrefixMatch ].map(m => m ? m[0] : "");

  if (speciesAPrefix) {
    speciesAName = speciesAName.slice(speciesAPrefix.length);
  }
  if (speciesBPrefix) {
    speciesBName = speciesBName.slice(speciesBPrefix.length);
  }

  const [ speciesASuffixMatch, speciesBSuffixMatch ] = [ speciesAName, speciesBName ].map(n => / (?:[^ ]+)$/.exec(n));
  const [ speciesASuffix, speciesBSuffix ] = [ speciesASuffixMatch, speciesBSuffixMatch ].map(m => m ? m[0] : "");

  if (speciesASuffix) {
    speciesAName = speciesAName.slice(0, -speciesASuffix.length);
  }
  if (speciesBSuffix) {
    speciesBName = speciesBName.slice(0, -speciesBSuffix.length);
  }

  const splitNameA = speciesAName.split(/ /g);
  const splitNameB = speciesBName.split(/ /g);

  const fragAMatch = fragAPattern.exec(speciesAName);
  const fragBMatch = fragBPattern.exec(speciesBName);

  let fragA: string;
  let fragB: string;

  fragA = splitNameA.length === 1
    ? fragAMatch ? fragAMatch[1] : speciesAName
    : splitNameA[splitNameA.length - 1];

  if (splitNameB.length === 1) {
    if (fragBMatch) {
      const lastCharA = fragA.slice(fragA.length - 1);
      const prevCharB = fragBMatch[1].slice(fragBMatch.length - 1);
      fragB = (/[\-']/.test(prevCharB) ? prevCharB : "") + fragBMatch[2] || prevCharB;
      if (lastCharA === fragB[0]) {
        if (/[aiu]/.test(lastCharA)) {
          fragB = fragB.slice(1);
        } else {
          const newCharMatch = new RegExp(`[^${lastCharA}]`).exec(fragB);
          if (newCharMatch?.index > 0) {
            fragB = fragB.slice(newCharMatch.index);
          }
        }
      }
    } else {
      fragB = speciesBName;
    }
  } else {
    fragB = splitNameB[splitNameB.length - 1];
  }

  if (splitNameA.length > 1) {
    fragA = `${splitNameA.slice(0, splitNameA.length - 1).join(" ")} ${fragA}`;
  }

  fragB = `${fragB.slice(0, 1).toLowerCase()}${fragB.slice(1)}`;

  return `${speciesAPrefix || speciesBPrefix}${fragA}${fragB}${speciesBSuffix || speciesASuffix}`;
}

export type PokemonSpeciesFilter = (species: PokemonSpecies) => boolean;

export abstract class PokemonSpeciesForm {
  public speciesId: Species;
  public formIndex: integer;
  public generation: integer;
  public type1: Type;
  public type2: Type;
  public height: number;
  public weight: number;
  public ability1: Abilities;
  public ability2: Abilities;
  public abilityHidden: Abilities;
  public baseTotal: integer;
  public baseStats: integer[];
  public catchRate: integer;
  public baseFriendship: integer;
  public baseExp: integer;
  public genderDiffs: boolean;
  public isStarterSelectable: boolean;

  constructor(type1: Type, type2: Type, height: number, weight: number, ability1: Abilities, ability2: Abilities, abilityHidden: Abilities,
    baseTotal: integer, baseHp: integer, baseAtk: integer, baseDef: integer, baseSpatk: integer, baseSpdef: integer, baseSpd: integer,
    catchRate: integer, baseFriendship: integer, baseExp: integer, genderDiffs: boolean, isStarterSelectable: boolean) {
    this.type1 = type1;
    this.type2 = type2;
    this.height = height;
    this.weight = weight;
    this.ability1 = ability1;
    this.ability2 = ability2;
    this.abilityHidden = abilityHidden;
    this.baseTotal = baseTotal;
    this.baseStats = [ baseHp, baseAtk, baseDef, baseSpatk, baseSpdef, baseSpd ];
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
  getRootSpeciesId(forStarter: boolean = false): Species {
    let ret = this.speciesId;
    while (pokemonPrevolutions.hasOwnProperty(ret) && (!forStarter || !speciesStarters.hasOwnProperty(ret))) {
      ret = pokemonPrevolutions[ret];
    }
    return ret;
  }

  isOfType(type: integer): boolean {
    return this.type1 === type || (this.type2 !== null && this.type2 === type);
  }

  getAbilityCount(): integer {
    return this.ability2 ? this.abilityHidden ? 3 : 2 : this.abilityHidden ? 2 : 1;
  }

  getAbility(abilityIndex: integer): Abilities {
    return !abilityIndex ? this.ability1 : abilityIndex === 1 && this.ability2 ? this.ability2 : this.abilityHidden;
  }

  getLevelMoves(): LevelMoves {
    if (pokemonSpeciesFormLevelMoves.hasOwnProperty(this.speciesId) && pokemonSpeciesFormLevelMoves[this.speciesId].hasOwnProperty(this.formIndex)) {
      return pokemonSpeciesFormLevelMoves[this.speciesId][this.formIndex].slice(0);
    }
    return pokemonSpeciesLevelMoves[this.speciesId].slice(0);
  }

  getRegion(): Region {
    return Math.floor(this.speciesId / 2000) as Region;
  }

  isObtainable(): boolean {
    return (this.generation <= 9 || pokemonPrevolutions.hasOwnProperty(this.speciesId));
  }

  isCatchable(): boolean {
    return this.isObtainable() && uncatchableSpecies.indexOf(this.speciesId) === -1;
  }

  isRegional(): boolean {
    return this.getRegion() > Region.NORMAL;
  }

  isTrainerForbidden(): boolean {
    return [ Species.ETERNAL_FLOETTE, Species.BLOODMOON_URSALUNA ].includes(this.speciesId);
  }

  isRareRegional(): boolean {
    switch (this.getRegion()) {
    case Region.HISUI:
      return true;
    }

    return false;
  }

  /**
   * Gets the species' base stat amount for the given stat.
   * @param stat  The desired stat.
   * @returns The species' base stat amount.
   */
  getBaseStat(stat: Stat): integer {
    return this.baseStats[stat];
  }

  getBaseExp(): integer {
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

  getSpriteAtlasPath(female: boolean, formIndex?: integer, shiny?: boolean, variant?: integer): string {
    const spriteId = this.getSpriteId(female, formIndex, shiny, variant).replace(/\_{2}/g, "/");
    return `${/_[1-3]$/.test(spriteId) ? "variant/" : ""}${spriteId}`;
  }

  getSpriteId(female: boolean, formIndex?: integer, shiny?: boolean, variant?: integer, back?: boolean): string {
    if (formIndex === undefined || this instanceof PokemonForm) {
      formIndex = this.formIndex;
    }

    const formSpriteKey = this.getFormSpriteKey(formIndex);
    const showGenderDiffs = this.genderDiffs && female && ![ SpeciesFormKey.MEGA, SpeciesFormKey.GIGANTAMAX ].find(k => formSpriteKey === k);

    const baseSpriteKey = `${showGenderDiffs ? "female__" : ""}${this.speciesId}${formSpriteKey ? `-${formSpriteKey}` : ""}`;

    let config = variantData;
    `${back ? "back__" : ""}${baseSpriteKey}`.split("__").map(p => config ? config = config[p] : null);
    const variantSet = config as VariantSet;

    return `${back ? "back__" : ""}${shiny && (!variantSet || (!variant && !variantSet[variant || 0])) ? "shiny__" : ""}${baseSpriteKey}${shiny && variantSet && variantSet[variant || 0] === 2 ? `_${variant + 1}` : ""}`;
  }

  getSpriteKey(female: boolean, formIndex?: integer, shiny?: boolean, variant?: integer): string {
    return `pkmn__${this.getSpriteId(female, formIndex, shiny, variant)}`;
  }

  abstract getFormSpriteKey(formIndex?: integer): string;

  getIconAtlasKey(formIndex?: integer, shiny?: boolean, variant?: integer): string {
    const isVariant = shiny && variantData[this.speciesId] && variantData[this.speciesId][variant];
    return `pokemon_icons_${this.generation}${isVariant ? "v" : ""}`;
  }

  getIconId(female: boolean, formIndex?: integer, shiny?: boolean, variant?: integer): string {
    if (formIndex === undefined) {
      formIndex = this.formIndex;
    }

    let ret = this.speciesId.toString();

    const isVariant = shiny && variantData[this.speciesId] && variantData[this.speciesId][variant];

    if (shiny && !isVariant) {
      ret += "s";
    }

    switch (this.speciesId) {
    case Species.HIPPOPOTAS:
    case Species.HIPPOWDON:
    case Species.UNFEZANT:
    case Species.FRILLISH:
    case Species.JELLICENT:
      ret += female ? "-f" : "";
      break;
    }

    let formSpriteKey = this.getFormSpriteKey(formIndex);
    if (formSpriteKey) {
      switch (this.speciesId) {
      case Species.DUDUNSPARCE:
        break;
      case Species.ZACIAN:
      case Species.ZAMAZENTA:
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

  getCryKey(formIndex?: integer): string {
    let speciesId = this.speciesId;
    if (this.speciesId > 2000) {
      switch (this.speciesId) {
      case Species.GALAR_SLOWPOKE:
        break;
      case Species.ETERNAL_FLOETTE:
        break;
      case Species.BLOODMOON_URSALUNA:
        break;
      default:
        speciesId = speciesId % 2000;
        break;
      }
    }
    let ret = speciesId.toString();
    const forms = getPokemonSpecies(speciesId).forms;
    if (forms.length) {
      if (formIndex >= forms.length) {
        console.warn(`Attempted accessing form with index ${formIndex} of species ${getPokemonSpecies(speciesId).getName()} with only ${forms.length || 0} forms`);
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
      case "roaming":
      case "complete":
      case "10":
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
    return ret;
  }

  validateStarterMoveset(moveset: StarterMoveset, eggMoves: integer): boolean {
    const rootSpeciesId = this.getRootSpeciesId();
    for (const moveId of moveset) {
      if (speciesEggMoves.hasOwnProperty(rootSpeciesId)) {
        const eggMoveIndex = speciesEggMoves[rootSpeciesId].findIndex(m => m === moveId);
        if (eggMoveIndex > -1 && eggMoves & Math.pow(2, eggMoveIndex)) {
          continue;
        }
      }
      if (pokemonFormLevelMoves.hasOwnProperty(this.speciesId) && pokemonFormLevelMoves[this.speciesId].hasOwnProperty(this.formIndex)) {
        if (!pokemonFormLevelMoves[this.speciesId][this.formIndex].find(lm => lm[0] <= 5 && lm[1] === moveId)) {
          return false;
        }
      } else if (!pokemonSpeciesLevelMoves[this.speciesId].find(lm => lm[0] <= 5 && lm[1] === moveId)) {
        return false;
      }
    }

    return true;
  }

  loadAssets(scene: BattleScene, female: boolean, formIndex?: integer, shiny?: boolean, variant?: Variant, startLoad?: boolean): Promise<void> {
    return new Promise(resolve => {
      const spriteKey = this.getSpriteKey(female, formIndex, shiny, variant);
      scene.loadPokemonAtlas(spriteKey, this.getSpriteAtlasPath(female, formIndex, shiny, variant));
      scene.load.audio(this.getCryKey(formIndex), `audio/cry/${this.getCryKey(formIndex)}.m4a`);
      scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
        const originalWarn = console.warn;
        // Ignore warnings for missing frames, because there will be a lot
        console.warn = () => {};
        const frameNames = scene.anims.generateFrameNames(spriteKey, { zeroPad: 4, suffix: ".png", start: 1, end: 400 });
        console.warn = originalWarn;
        if (!(scene.anims.exists(spriteKey))) {
          scene.anims.create({
            key: this.getSpriteKey(female, formIndex, shiny, variant),
            frames: frameNames,
            frameRate: 12,
            repeat: -1
          });
        }
        let spritePath = this.getSpriteAtlasPath(female, formIndex, shiny, variant).replace("variant/", "").replace(/_[1-3]$/, "");
        const useExpSprite = scene.experimentalSprites && scene.hasExpSprite(spriteKey);
        if (useExpSprite) {
          spritePath = `exp/${spritePath}`;
        }
        let config = variantData;
        spritePath.split("/").map(p => config ? config = config[p] : null);
        const variantSet = config as VariantSet;
        if (variantSet && variantSet[variant] === 1) {
          const populateVariantColors = (key: string): Promise<void> => {
            return new Promise(resolve => {
              if (variantColorCache.hasOwnProperty(key)) {
                return resolve();
              }
              scene.cachedFetch(`./images/pokemon/variant/${spritePath}.json`).then(res => res.json()).then(c => {
                variantColorCache[key] = c;
                resolve();
              });
            });
          };
          populateVariantColors(spriteKey).then(() => resolve());
          return;
        }
        resolve();
      });
      if (startLoad) {
        if (!scene.load.isLoading()) {
          scene.load.start();
        }
      } else {
        resolve();
      }
    });
  }

  cry(scene: BattleScene, soundConfig?: Phaser.Types.Sound.SoundConfig, ignorePlay?: boolean): AnySound {
    const cryKey = this.getCryKey(this.formIndex);
    let cry = scene.sound.get(cryKey) as AnySound;
    if (cry?.pendingRemove) {
      cry = null;
    }
    cry = scene.playSound(cry || cryKey, soundConfig);
    if (ignorePlay) {
      cry.stop();
    }
    return cry;
  }

  generateCandyColors(scene: BattleScene): integer[][] {
    const sourceTexture = scene.textures.get(this.getSpriteKey(false));

    const sourceFrame = sourceTexture.frames[sourceTexture.firstFrame];
    const sourceImage = sourceTexture.getSourceImage() as HTMLImageElement;

    const canvas = document.createElement("canvas");

    const spriteColors: integer[][] = [];

    const context = canvas.getContext("2d");
    const frame = sourceFrame;
    canvas.width = frame.width;
    canvas.height = frame.height;
    context.drawImage(sourceImage, frame.cutX, frame.cutY, frame.width, frame.height, 0, 0, frame.width, frame.height);
    const imageData = context.getImageData(frame.cutX, frame.cutY, frame.width, frame.height);
    const pixelData = imageData.data;

    for (let i = 0; i < pixelData.length; i += 4) {
      if (pixelData[i + 3]) {
        const pixel = pixelData.slice(i, i + 4);
        const [ r, g, b, a ] = pixel;
        if (!spriteColors.find(c => c[0] === r && c[1] === g && c[2] === b)) {
          spriteColors.push([ r, g, b, a ]);
        }
      }
    }

    const pixelColors = [];
    for (let i = 0; i < pixelData.length; i += 4) {
      const total = pixelData.slice(i, i + 3).reduce((total: integer, value: integer) => total + value, 0);
      if (!total) {
        continue;
      }
      pixelColors.push(argbFromRgba({ r: pixelData[i], g: pixelData[i + 1], b: pixelData[i + 2], a: pixelData[i + 3] }));
    }

    let paletteColors: Map<number, number>;

    const originalRandom = Math.random;
    Math.random = () => Phaser.Math.RND.realInRange(0, 1);

    scene.executeWithSeedOffset(() => {
      paletteColors = QuantizerCelebi.quantize(pixelColors, 2);
    }, 0, "This result should not vary");

    Math.random = originalRandom;

    return Array.from(paletteColors.keys()).map(c => Object.values(rgbaFromArgb(c)) as integer[]);
  }
}

export default class PokemonSpecies extends PokemonSpeciesForm implements Localizable {
  public name: string;
  public subLegendary: boolean;
  public legendary: boolean;
  public mythical: boolean;
  public species: string;
  public growthRate: GrowthRate;
  public malePercent: number;
  public genderDiffs: boolean;
  public canChangeForm: boolean;
  public forms: PokemonForm[];

  constructor(id: Species, generation: integer, subLegendary: boolean, legendary: boolean, mythical: boolean, species: string,
    type1: Type, type2: Type, height: number, weight: number, ability1: Abilities, ability2: Abilities, abilityHidden: Abilities,
    baseTotal: integer, baseHp: integer, baseAtk: integer, baseDef: integer, baseSpatk: integer, baseSpdef: integer, baseSpd: integer,
    catchRate: integer, baseFriendship: integer, baseExp: integer, growthRate: GrowthRate, malePercent: number,
    genderDiffs: boolean, canChangeForm?: boolean, ...forms: PokemonForm[]) {
    super(type1, type2, height, weight, ability1, ability2, abilityHidden, baseTotal, baseHp, baseAtk, baseDef, baseSpatk, baseSpdef, baseSpd,
      catchRate, baseFriendship, baseExp, genderDiffs);
    this.speciesId = id;
    this.formIndex = 0;
    this.generation = generation;
    this.subLegendary = subLegendary;
    this.legendary = legendary;
    this.mythical = mythical;
    this.species = species;
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

  getName(formIndex?: integer): string {
    if (formIndex !== undefined && this.forms.length) {
      const form = this.forms[formIndex];
      switch (form.formKey) {
      case SpeciesFormKey.MEGA:
      case SpeciesFormKey.PRIMAL:
      case SpeciesFormKey.ETERNAMAX:
        return `${form.formName} ${this.name}`;
      case SpeciesFormKey.MEGA_X:
        return `Mega ${this.name} X`;
      case SpeciesFormKey.MEGA_Y:
        return `Mega ${this.name} Y`;
      default:
        if (form.formKey.indexOf(SpeciesFormKey.GIGANTAMAX) > -1) {
          return `G-Max ${this.name}`;
        }
      }
    }
    return this.name;
  }

  localize(): void {
    this.name = i18next.t(`pokemon:${Species[this.speciesId].toLowerCase()}`);
  }

  getWildSpeciesForLevel(level: integer, allowEvolving: boolean, isBoss: boolean, gameMode: GameMode): Species {
    return this.getSpeciesForLevel(level, allowEvolving, false, (isBoss ? PartyMemberStrength.WEAKER : PartyMemberStrength.AVERAGE) + (gameMode?.isEndless ? 1 : 0));
  }

  getTrainerSpeciesForLevel(level: integer, allowEvolving: boolean = false, strength: PartyMemberStrength): Species {
    return this.getSpeciesForLevel(level, allowEvolving, true, strength);
  }

  private getStrengthLevelDiff(strength: PartyMemberStrength): integer {
    switch (Math.min(strength, PartyMemberStrength.STRONGER)) {
    case PartyMemberStrength.WEAKEST:
      return 60;
    case PartyMemberStrength.WEAKER:
      return 40;
    case PartyMemberStrength.WEAK:
      return 20;
    case PartyMemberStrength.AVERAGE:
      return 10;
    case PartyMemberStrength.STRONG:
      return 5;
    default:
      return 0;
    }
  }

  getSpeciesForLevel(level: integer, allowEvolving: boolean = false, forTrainer: boolean = false, strength: PartyMemberStrength = PartyMemberStrength.WEAKER): Species {
    const prevolutionLevels = this.getPrevolutionLevels();

    if (prevolutionLevels.length) {
      for (let pl = prevolutionLevels.length - 1; pl >= 0; pl--) {
        const prevolutionLevel = prevolutionLevels[pl];
        if (level < prevolutionLevel[1]) {
          return prevolutionLevel[0];
        }
      }
    }

    if (!allowEvolving || !pokemonEvolutions.hasOwnProperty(this.speciesId)) {
      return this.speciesId;
    }

    const evolutions = pokemonEvolutions[this.speciesId];

    const easeInFunc = Phaser.Tweens.Builders.GetEaseFunction("Sine.easeIn");
    const easeOutFunc = Phaser.Tweens.Builders.GetEaseFunction("Sine.easeOut");

    const evolutionPool: Map<number, Species> = new Map();
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
      } else {
        if (ev.wildDelay === SpeciesWildEvolutionDelay.NONE) {
          if (strength === PartyMemberStrength.STRONGER) {
            evolutionChance = 1;
          } else {
            const maxLevelDiff = this.getStrengthLevelDiff(strength);
            const minChance: number = 0.875 - 0.125 * strength;

            evolutionChance = Math.min(minChance + easeInFunc(Math.min(level - ev.level, maxLevelDiff) / maxLevelDiff) * (1 - minChance), 1);
          }
        } else {
          const preferredMinLevel = Math.max((ev.level - 1) + ev.wildDelay * this.getStrengthLevelDiff(strength), 1);
          let evolutionLevel = Math.max(ev.level > 1 ? ev.level : Math.floor(preferredMinLevel / 2), 1);

          if (ev.level <= 1 && pokemonPrevolutions.hasOwnProperty(this.speciesId)) {
            const prevolutionLevel = pokemonEvolutions[pokemonPrevolutions[this.speciesId]].find(ev => ev.speciesId === this.speciesId).level;
            if (prevolutionLevel > 1) {
              evolutionLevel = prevolutionLevel;
            }
          }

          evolutionChance = Math.min(0.65 * easeInFunc(Math.min(Math.max(level - evolutionLevel, 0), preferredMinLevel) / preferredMinLevel) + 0.35 * easeOutFunc(Math.min(Math.max(level - evolutionLevel, 0), preferredMinLevel * 2.5) / (preferredMinLevel * 2.5)), 1);
        }
      }

      if (evolutionChance > 0) {
        if (isRegionalEvolution) {
          evolutionChance /= (evolutionSpecies.isRareRegional() ? 16 : 4);
        }

        totalWeight += evolutionChance;

        evolutionPool.set(totalWeight, ev.speciesId);

        if ((1 - evolutionChance) < noEvolutionChance) {
          noEvolutionChance = 1 - evolutionChance;
        }
      }
    }

    if (noEvolutionChance === 1 || Phaser.Math.RND.realInRange(0, 1) < noEvolutionChance) {
      return this.speciesId;
    }

    const randValue = evolutionPool.size === 1 ? 0 : Utils.randSeedInt(totalWeight);

    for (const weight of evolutionPool.keys()) {
      if (randValue < weight) {
        return getPokemonSpecies(evolutionPool.get(weight)).getSpeciesForLevel(level, true, forTrainer, strength);
      }
    }

    return this.speciesId;
  }

  getEvolutionLevels() {
    const evolutionLevels = [];

    //console.log(Species[this.speciesId], pokemonEvolutions[this.speciesId])

    if (pokemonEvolutions.hasOwnProperty(this.speciesId)) {
      for (const e of pokemonEvolutions[this.speciesId]) {
        const speciesId = e.speciesId;
        const level = e.level;
        evolutionLevels.push([ speciesId, level ]);
        //console.log(Species[speciesId], getPokemonSpecies(speciesId), getPokemonSpecies(speciesId).getEvolutionLevels());
        const nextEvolutionLevels = getPokemonSpecies(speciesId).getEvolutionLevels();
        for (const npl of nextEvolutionLevels) {
          evolutionLevels.push(npl);
        }
      }
    }

    return evolutionLevels;
  }

  getPrevolutionLevels() {
    const prevolutionLevels = [];

    const allEvolvingPokemon = Object.keys(pokemonEvolutions);
    for (const p of allEvolvingPokemon) {
      for (const e of pokemonEvolutions[p]) {
        if (e.speciesId === this.speciesId && (!this.forms.length || !e.evoFormKey || e.evoFormKey === this.forms[this.formIndex].formKey)) {
          const speciesId = parseInt(p) as Species;
          const level = e.level;
          prevolutionLevels.push([ speciesId, level ]);
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
  getSimulatedEvolutionChain(currentLevel: integer, forTrainer: boolean = false, isBoss: boolean = false, player: boolean = false) {
    const ret = [];
    if (pokemonPrevolutions.hasOwnProperty(this.speciesId)) {
      const prevolutionLevels = this.getPrevolutionLevels().reverse();
      const levelDiff = player ? 0 : forTrainer || isBoss ? forTrainer && isBoss ? 2.5 : 5 : 10;
      ret.push([ prevolutionLevels[0][0], 1 ]);
      for (let l = 1; l < prevolutionLevels.length; l++) {
        const evolution = pokemonEvolutions[prevolutionLevels[l - 1][0]].find(e => e.speciesId === prevolutionLevels[l][0]);
        ret.push([ prevolutionLevels[l][0], Math.min(Math.max(evolution.level + Math.round(Utils.randSeedGauss(0.5, 1 + levelDiff * 0.2) * Math.max(evolution.wildDelay, 0.5) * 5) - 1, 2, evolution.level), currentLevel - 1) ]);
      }
      const lastPrevolutionLevel = ret[prevolutionLevels.length - 1][1];
      const evolution = pokemonEvolutions[prevolutionLevels[prevolutionLevels.length - 1][0]].find(e => e.speciesId === this.speciesId);
      ret.push([ this.speciesId, Math.min(Math.max(lastPrevolutionLevel + Math.round(Utils.randSeedGauss(0.5, 1 + levelDiff * 0.2) * Math.max(evolution.wildDelay, 0.5) * 5), lastPrevolutionLevel + 1, evolution.level), currentLevel) ]);
    } else {
      ret.push([ this.speciesId, 1 ]);
    }

    return ret;
  }

  getCompatibleFusionSpeciesFilter(): PokemonSpeciesFilter {
    const hasEvolution = pokemonEvolutions.hasOwnProperty(this.speciesId);
    const hasPrevolution = pokemonPrevolutions.hasOwnProperty(this.speciesId);
    const pseudoLegendary = this.subLegendary;
    const legendary = this.legendary;
    const mythical = this.mythical;
    return species => {
      return (pseudoLegendary || legendary || mythical ||
        (pokemonEvolutions.hasOwnProperty(species.speciesId) === hasEvolution
        && pokemonPrevolutions.hasOwnProperty(species.speciesId) === hasPrevolution))
        && species.subLegendary === pseudoLegendary
        && species.legendary === legendary
        && species.mythical === mythical
        && (this.isTrainerForbidden() || !species.isTrainerForbidden());
    };
  }

  isObtainable() {
    return super.isObtainable();
  }

  getFormSpriteKey(formIndex?: integer) {
    if (this.forms.length && formIndex >= this.forms.length) {
      console.warn(`Attempted accessing form with index ${formIndex} of species ${this.getName()} with only ${this.forms.length || 0} forms`);
      formIndex = Math.min(formIndex, this.forms.length - 1);
    }
    return this.forms?.length
      ? this.forms[formIndex || 0].getFormSpriteKey()
      : "";
  }
}

export class PokemonForm extends PokemonSpeciesForm {
  public formName: string;
  public formKey: string;
  public formSpriteKey: string;

  // This is a collection of form keys that have in-run form changes, but should still be separately selectable from the start screen
  private starterSelectableKeys: string[] = ["10", "50", "10-pc", "50-pc", "red", "orange", "yellow", "green", "blue", "indigo", "violet"];

  constructor(formName: string, formKey: string, type1: Type, type2: Type, height: number, weight: number, ability1: Abilities, ability2: Abilities, abilityHidden: Abilities,
    baseTotal: integer, baseHp: integer, baseAtk: integer, baseDef: integer, baseSpatk: integer, baseSpdef: integer, baseSpd: integer,
    catchRate: integer, baseFriendship: integer, baseExp: integer, genderDiffs?: boolean, formSpriteKey?: string, isStarterSelectable?: boolean, ) {
    super(type1, type2, height, weight, ability1, ability2, abilityHidden, baseTotal, baseHp, baseAtk, baseDef, baseSpatk, baseSpdef, baseSpd,
      catchRate, baseFriendship, baseExp, !!genderDiffs, (!!isStarterSelectable || !formKey));
    this.formName = formName;
    this.formKey = formKey;
    this.formSpriteKey = formSpriteKey !== undefined ? formSpriteKey : null;
  }

  getFormSpriteKey(_formIndex?: integer) {
    return this.formSpriteKey !== null ? this.formSpriteKey : this.formKey;
  }
}

export enum SpeciesFormKey {
  MEGA = "mega",
  MEGA_X = "mega-x",
  MEGA_Y = "mega-y",
  PRIMAL = "primal",
  ORIGIN = "origin",
  INCARNATE = "incarnate",
  THERIAN = "therian",
  GIGANTAMAX = "gigantamax",
  GIGANTAMAX_SINGLE = "gigantamax-single",
  GIGANTAMAX_RAPID = "gigantamax-rapid",
  ETERNAMAX = "eternamax"
}

export const allSpecies: PokemonSpecies[] = [];

export function initSpecies() {
  allSpecies.push(
    new PokemonSpecies(Species.BULBASAUR, 1, false, false, false, "Seed Pokémon", Type.GRASS, Type.POISON, 0.7, 6.9, Abilities.OVERGROW, Abilities.NONE, Abilities.CHLOROPHYLL, 318, 45, 49, 49, 65, 65, 45, 45, 50, 64, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.IVYSAUR, 1, false, false, false, "Seed Pokémon", Type.GRASS, Type.POISON, 1, 13, Abilities.OVERGROW, Abilities.NONE, Abilities.CHLOROPHYLL, 405, 60, 62, 63, 80, 80, 60, 45, 50, 142, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.VENUSAUR, 1, false, false, false, "Seed Pokémon", Type.GRASS, Type.POISON, 2, 100, Abilities.OVERGROW, Abilities.NONE, Abilities.CHLOROPHYLL, 525, 80, 82, 83, 100, 100, 80, 45, 50, 263, GrowthRate.MEDIUM_SLOW, 87.5, true, true,
      new PokemonForm("Normal", "", Type.GRASS, Type.POISON, 2, 100, Abilities.OVERGROW, Abilities.NONE, Abilities.CHLOROPHYLL, 525, 80, 82, 83, 100, 100, 80, 45, 50, 263, true),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.GRASS, Type.POISON, 2.4, 155.5, Abilities.THICK_FAT, Abilities.THICK_FAT, Abilities.THICK_FAT, 625, 80, 100, 123, 122, 120, 80, 45, 50, 263, true),
      new PokemonForm("G-Max", SpeciesFormKey.GIGANTAMAX, Type.GRASS, Type.POISON, 24, 100, Abilities.OVERGROW, Abilities.NONE, Abilities.CHLOROPHYLL, 625, 100, 90, 120, 110, 130, 75, 45, 50, 263, true),
    ),
    new PokemonSpecies(Species.CHARMANDER, 1, false, false, false, "Lizard Pokémon", Type.FIRE, null, 0.6, 8.5, Abilities.BLAZE, Abilities.NONE, Abilities.SOLAR_POWER, 309, 39, 52, 43, 60, 50, 65, 45, 50, 62, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.CHARMELEON, 1, false, false, false, "Flame Pokémon", Type.FIRE, null, 1.1, 19, Abilities.BLAZE, Abilities.NONE, Abilities.SOLAR_POWER, 405, 58, 64, 58, 80, 65, 80, 45, 50, 142, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.CHARIZARD, 1, false, false, false, "Flame Pokémon", Type.FIRE, Type.FLYING, 1.7, 90.5, Abilities.BLAZE, Abilities.NONE, Abilities.SOLAR_POWER, 534, 78, 84, 78, 109, 85, 100, 45, 50, 267, GrowthRate.MEDIUM_SLOW, 87.5, false, true,
      new PokemonForm("Normal", "", Type.FIRE, Type.FLYING, 1.7, 90.5, Abilities.BLAZE, Abilities.NONE, Abilities.SOLAR_POWER, 534, 78, 84, 78, 109, 85, 100, 45, 50, 267),
      new PokemonForm("Mega X", SpeciesFormKey.MEGA_X, Type.FIRE, Type.DRAGON, 1.7, 110.5, Abilities.TOUGH_CLAWS, Abilities.NONE, Abilities.TOUGH_CLAWS, 634, 78, 130, 111, 130, 85, 100, 45, 50, 267),
      new PokemonForm("Mega Y", SpeciesFormKey.MEGA_Y, Type.FIRE, Type.FLYING, 1.7, 100.5, Abilities.DROUGHT, Abilities.NONE, Abilities.DROUGHT, 634, 78, 104, 78, 159, 115, 100, 45, 50, 267),
      new PokemonForm("G-Max", SpeciesFormKey.GIGANTAMAX, Type.FIRE, Type.FLYING, 28, 90.5, Abilities.BLAZE, Abilities.NONE, Abilities.SOLAR_POWER, 634, 98, 100, 96, 135, 110, 95, 45, 50, 267),
    ),
    new PokemonSpecies(Species.SQUIRTLE, 1, false, false, false, "Tiny Turtle Pokémon", Type.WATER, null, 0.5, 9, Abilities.TORRENT, Abilities.NONE, Abilities.RAIN_DISH, 314, 44, 48, 65, 50, 64, 43, 45, 50, 63, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.WARTORTLE, 1, false, false, false, "Turtle Pokémon", Type.WATER, null, 1, 22.5, Abilities.TORRENT, Abilities.NONE, Abilities.RAIN_DISH, 405, 59, 63, 80, 65, 80, 58, 45, 50, 142, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.BLASTOISE, 1, false, false, false, "Shellfish Pokémon", Type.WATER, null, 1.6, 85.5, Abilities.TORRENT, Abilities.NONE, Abilities.RAIN_DISH, 530, 79, 83, 100, 85, 105, 78, 45, 50, 265, GrowthRate.MEDIUM_SLOW, 87.5, false, true,
      new PokemonForm("Normal", "", Type.WATER, null, 1.6, 85.5, Abilities.TORRENT, Abilities.NONE, Abilities.RAIN_DISH, 530, 79, 83, 100, 85, 105, 78, 45, 50, 265),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.WATER, null, 1.6, 101.1, Abilities.MEGA_LAUNCHER, Abilities.NONE, Abilities.MEGA_LAUNCHER, 630, 79, 103, 120, 135, 115, 78, 45, 50, 265),
      new PokemonForm("G-Max", SpeciesFormKey.GIGANTAMAX, Type.WATER, null, 25, 85.5, Abilities.TORRENT, Abilities.NONE, Abilities.RAIN_DISH, 630, 100, 95, 130, 105, 125, 75, 45, 50, 265),
    ),
    new PokemonSpecies(Species.CATERPIE, 1, false, false, false, "Worm Pokémon", Type.BUG, null, 0.3, 2.9, Abilities.SHIELD_DUST, Abilities.NONE, Abilities.RUN_AWAY, 195, 45, 30, 35, 20, 20, 45, 255, 50, 39, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.METAPOD, 1, false, false, false, "Cocoon Pokémon", Type.BUG, null, 0.7, 9.9, Abilities.SHED_SKIN, Abilities.NONE, Abilities.SHED_SKIN, 205, 50, 20, 55, 25, 25, 30, 120, 50, 72, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.BUTTERFREE, 1, false, false, false, "Butterfly Pokémon", Type.BUG, Type.FLYING, 1.1, 32, Abilities.COMPOUND_EYES, Abilities.NONE, Abilities.TINTED_LENS, 395, 60, 45, 50, 90, 80, 70, 45, 50, 198, GrowthRate.MEDIUM_FAST, 50, true, true,
      new PokemonForm("Normal", "", Type.BUG, Type.FLYING, 1.1, 32, Abilities.COMPOUND_EYES, Abilities.NONE, Abilities.TINTED_LENS, 395, 60, 45, 50, 90, 80, 70, 45, 50, 198, true),
      new PokemonForm("G-Max", SpeciesFormKey.GIGANTAMAX, Type.BUG, Type.FLYING, 17, 32, Abilities.COMPOUND_EYES, Abilities.NONE, Abilities.TINTED_LENS, 495, 75, 50, 75, 120, 100, 75, 45, 50, 198, true),
    ),
    new PokemonSpecies(Species.WEEDLE, 1, false, false, false, "Hairy Bug Pokémon", Type.BUG, Type.POISON, 0.3, 3.2, Abilities.SHIELD_DUST, Abilities.NONE, Abilities.RUN_AWAY, 195, 40, 35, 30, 20, 20, 50, 255, 70, 39, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.KAKUNA, 1, false, false, false, "Cocoon Pokémon", Type.BUG, Type.POISON, 0.6, 10, Abilities.SHED_SKIN, Abilities.NONE, Abilities.SHED_SKIN, 205, 45, 25, 50, 25, 25, 35, 120, 70, 72, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.BEEDRILL, 1, false, false, false, "Poison Bee Pokémon", Type.BUG, Type.POISON, 1, 29.5, Abilities.SWARM, Abilities.NONE, Abilities.SNIPER, 395, 65, 90, 40, 45, 80, 75, 45, 70, 178, GrowthRate.MEDIUM_FAST, 50, false, true,
      new PokemonForm("Normal", "", Type.BUG, Type.POISON, 1, 29.5, Abilities.SWARM, Abilities.NONE, Abilities.SNIPER, 395, 65, 90, 40, 45, 80, 75, 45, 70, 178),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.BUG, Type.POISON, 1.4, 40.5, Abilities.ADAPTABILITY, Abilities.NONE, Abilities.ADAPTABILITY, 495, 65, 150, 40, 15, 80, 145, 45, 70, 178),
    ),
    new PokemonSpecies(Species.PIDGEY, 1, false, false, false, "Tiny Bird Pokémon", Type.NORMAL, Type.FLYING, 0.3, 1.8, Abilities.KEEN_EYE, Abilities.TANGLED_FEET, Abilities.BIG_PECKS, 251, 40, 45, 40, 35, 35, 56, 255, 70, 50, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.PIDGEOTTO, 1, false, false, false, "Bird Pokémon", Type.NORMAL, Type.FLYING, 1.1, 30, Abilities.KEEN_EYE, Abilities.TANGLED_FEET, Abilities.BIG_PECKS, 349, 63, 60, 55, 50, 50, 71, 120, 70, 122, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.PIDGEOT, 1, false, false, false, "Bird Pokémon", Type.NORMAL, Type.FLYING, 1.5, 39.5, Abilities.KEEN_EYE, Abilities.TANGLED_FEET, Abilities.BIG_PECKS, 479, 83, 80, 75, 70, 70, 101, 45, 70, 216, GrowthRate.MEDIUM_SLOW, 50, false, true,
      new PokemonForm("Normal", "", Type.NORMAL, Type.FLYING, 1.5, 39.5, Abilities.KEEN_EYE, Abilities.TANGLED_FEET, Abilities.BIG_PECKS, 479, 83, 80, 75, 70, 70, 101, 45, 70, 216),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.NORMAL, Type.FLYING, 2.2, 50.5, Abilities.NO_GUARD, Abilities.NO_GUARD, Abilities.NO_GUARD, 579, 83, 80, 80, 135, 80, 121, 45, 70, 216),
    ),
    new PokemonSpecies(Species.RATTATA, 1, false, false, false, "Mouse Pokémon", Type.NORMAL, null, 0.3, 3.5, Abilities.RUN_AWAY, Abilities.GUTS, Abilities.HUSTLE, 253, 30, 56, 35, 25, 35, 72, 255, 70, 51, GrowthRate.MEDIUM_FAST, 50, true),
    new PokemonSpecies(Species.RATICATE, 1, false, false, false, "Mouse Pokémon", Type.NORMAL, null, 0.7, 18.5, Abilities.RUN_AWAY, Abilities.GUTS, Abilities.HUSTLE, 413, 55, 81, 60, 50, 70, 97, 127, 70, 145, GrowthRate.MEDIUM_FAST, 50, true),
    new PokemonSpecies(Species.SPEAROW, 1, false, false, false, "Tiny Bird Pokémon", Type.NORMAL, Type.FLYING, 0.3, 2, Abilities.KEEN_EYE, Abilities.NONE, Abilities.SNIPER, 262, 40, 60, 30, 31, 31, 70, 255, 70, 52, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.FEAROW, 1, false, false, false, "Beak Pokémon", Type.NORMAL, Type.FLYING, 1.2, 38, Abilities.KEEN_EYE, Abilities.NONE, Abilities.SNIPER, 442, 65, 90, 65, 61, 61, 100, 90, 70, 155, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.EKANS, 1, false, false, false, "Snake Pokémon", Type.POISON, null, 2, 6.9, Abilities.INTIMIDATE, Abilities.SHED_SKIN, Abilities.UNNERVE, 288, 35, 60, 44, 40, 54, 55, 255, 70, 58, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.ARBOK, 1, false, false, false, "Cobra Pokémon", Type.POISON, null, 3.5, 65, Abilities.INTIMIDATE, Abilities.SHED_SKIN, Abilities.UNNERVE, 448, 60, 95, 69, 65, 79, 80, 90, 70, 157, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.PIKACHU, 1, false, false, false, "Mouse Pokémon", Type.ELECTRIC, null, 0.4, 6, Abilities.STATIC, Abilities.NONE, Abilities.LIGHTNING_ROD, 320, 35, 55, 40, 50, 50, 90, 190, 50, 112, GrowthRate.MEDIUM_FAST, 50, true, true,
      new PokemonForm("Normal", "", Type.ELECTRIC, null, 0.4, 6, Abilities.STATIC, Abilities.NONE, Abilities.LIGHTNING_ROD, 320, 35, 55, 40, 50, 50, 90, 190, 50, 112, true),
      new PokemonForm("G-Max", SpeciesFormKey.GIGANTAMAX, Type.ELECTRIC, null, 21, 6, Abilities.STATIC, Abilities.NONE, Abilities.LIGHTNING_ROD, 420, 45, 60, 65, 100, 75, 75, 190, 50, 112, true),
    ),
    new PokemonSpecies(Species.RAICHU, 1, false, false, false, "Mouse Pokémon", Type.ELECTRIC, null, 0.8, 30, Abilities.STATIC, Abilities.NONE, Abilities.LIGHTNING_ROD, 485, 60, 90, 55, 90, 80, 110, 75, 50, 243, GrowthRate.MEDIUM_FAST, 50, true),
    new PokemonSpecies(Species.SANDSHREW, 1, false, false, false, "Mouse Pokémon", Type.GROUND, null, 0.6, 12, Abilities.SAND_VEIL, Abilities.NONE, Abilities.SAND_RUSH, 300, 50, 75, 85, 20, 30, 40, 255, 50, 60, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.SANDSLASH, 1, false, false, false, "Mouse Pokémon", Type.GROUND, null, 1, 29.5, Abilities.SAND_VEIL, Abilities.NONE, Abilities.SAND_RUSH, 450, 75, 100, 110, 45, 55, 65, 90, 50, 158, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.NIDORAN_F, 1, false, false, false, "Poison Pin Pokémon", Type.POISON, null, 0.4, 7, Abilities.POISON_POINT, Abilities.RIVALRY, Abilities.HUSTLE, 275, 55, 47, 52, 40, 40, 41, 235, 50, 55, GrowthRate.MEDIUM_SLOW, 0, false),
    new PokemonSpecies(Species.NIDORINA, 1, false, false, false, "Poison Pin Pokémon", Type.POISON, null, 0.8, 20, Abilities.POISON_POINT, Abilities.RIVALRY, Abilities.HUSTLE, 365, 70, 62, 67, 55, 55, 56, 120, 50, 128, GrowthRate.MEDIUM_SLOW, 0, false),
    new PokemonSpecies(Species.NIDOQUEEN, 1, false, false, false, "Drill Pokémon", Type.POISON, Type.GROUND, 1.3, 60, Abilities.POISON_POINT, Abilities.RIVALRY, Abilities.SHEER_FORCE, 505, 90, 92, 87, 75, 85, 76, 45, 50, 253, GrowthRate.MEDIUM_SLOW, 0, false),
    new PokemonSpecies(Species.NIDORAN_M, 1, false, false, false, "Poison Pin Pokémon", Type.POISON, null, 0.5, 9, Abilities.POISON_POINT, Abilities.RIVALRY, Abilities.HUSTLE, 273, 46, 57, 40, 40, 40, 50, 235, 50, 55, GrowthRate.MEDIUM_SLOW, 100, false),
    new PokemonSpecies(Species.NIDORINO, 1, false, false, false, "Poison Pin Pokémon", Type.POISON, null, 0.9, 19.5, Abilities.POISON_POINT, Abilities.RIVALRY, Abilities.HUSTLE, 365, 61, 72, 57, 55, 55, 65, 120, 50, 128, GrowthRate.MEDIUM_SLOW, 100, false),
    new PokemonSpecies(Species.NIDOKING, 1, false, false, false, "Drill Pokémon", Type.POISON, Type.GROUND, 1.4, 62, Abilities.POISON_POINT, Abilities.RIVALRY, Abilities.SHEER_FORCE, 505, 81, 102, 77, 85, 75, 85, 45, 50, 253, GrowthRate.MEDIUM_SLOW, 100, false),
    new PokemonSpecies(Species.CLEFAIRY, 1, false, false, false, "Fairy Pokémon", Type.FAIRY, null, 0.6, 7.5, Abilities.CUTE_CHARM, Abilities.MAGIC_GUARD, Abilities.FRIEND_GUARD, 323, 70, 45, 48, 60, 65, 35, 150, 140, 113, GrowthRate.FAST, 25, false),
    new PokemonSpecies(Species.CLEFABLE, 1, false, false, false, "Fairy Pokémon", Type.FAIRY, null, 1.3, 40, Abilities.CUTE_CHARM, Abilities.MAGIC_GUARD, Abilities.UNAWARE, 483, 95, 70, 73, 95, 90, 60, 25, 140, 242, GrowthRate.FAST, 25, false),
    new PokemonSpecies(Species.VULPIX, 1, false, false, false, "Fox Pokémon", Type.FIRE, null, 0.6, 9.9, Abilities.FLASH_FIRE, Abilities.NONE, Abilities.DROUGHT, 299, 38, 41, 40, 50, 65, 65, 190, 50, 60, GrowthRate.MEDIUM_FAST, 25, false),
    new PokemonSpecies(Species.NINETALES, 1, false, false, false, "Fox Pokémon", Type.FIRE, null, 1.1, 19.9, Abilities.FLASH_FIRE, Abilities.NONE, Abilities.DROUGHT, 505, 73, 76, 75, 81, 100, 100, 75, 50, 177, GrowthRate.MEDIUM_FAST, 25, false),
    new PokemonSpecies(Species.JIGGLYPUFF, 1, false, false, false, "Balloon Pokémon", Type.NORMAL, Type.FAIRY, 0.5, 5.5, Abilities.CUTE_CHARM, Abilities.COMPETITIVE, Abilities.FRIEND_GUARD, 270, 115, 45, 20, 45, 25, 20, 170, 50, 95, GrowthRate.FAST, 25, false),
    new PokemonSpecies(Species.WIGGLYTUFF, 1, false, false, false, "Balloon Pokémon", Type.NORMAL, Type.FAIRY, 1, 12, Abilities.CUTE_CHARM, Abilities.COMPETITIVE, Abilities.FRISK, 435, 140, 70, 45, 85, 50, 45, 50, 50, 218, GrowthRate.FAST, 25, false),
    new PokemonSpecies(Species.ZUBAT, 1, false, false, false, "Bat Pokémon", Type.POISON, Type.FLYING, 0.8, 7.5, Abilities.INNER_FOCUS, Abilities.NONE, Abilities.INFILTRATOR, 245, 40, 45, 35, 30, 40, 55, 255, 50, 49, GrowthRate.MEDIUM_FAST, 50, true),
    new PokemonSpecies(Species.GOLBAT, 1, false, false, false, "Bat Pokémon", Type.POISON, Type.FLYING, 1.6, 55, Abilities.INNER_FOCUS, Abilities.NONE, Abilities.INFILTRATOR, 455, 75, 80, 70, 65, 75, 90, 90, 50, 159, GrowthRate.MEDIUM_FAST, 50, true),
    new PokemonSpecies(Species.ODDISH, 1, false, false, false, "Weed Pokémon", Type.GRASS, Type.POISON, 0.5, 5.4, Abilities.CHLOROPHYLL, Abilities.NONE, Abilities.RUN_AWAY, 320, 45, 50, 55, 75, 65, 30, 255, 50, 64, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.GLOOM, 1, false, false, false, "Weed Pokémon", Type.GRASS, Type.POISON, 0.8, 8.6, Abilities.CHLOROPHYLL, Abilities.NONE, Abilities.STENCH, 395, 60, 65, 70, 85, 75, 40, 120, 50, 138, GrowthRate.MEDIUM_SLOW, 50, true),
    new PokemonSpecies(Species.VILEPLUME, 1, false, false, false, "Flower Pokémon", Type.GRASS, Type.POISON, 1.2, 18.6, Abilities.CHLOROPHYLL, Abilities.NONE, Abilities.EFFECT_SPORE, 490, 75, 80, 85, 110, 90, 50, 45, 50, 245, GrowthRate.MEDIUM_SLOW, 50, true),
    new PokemonSpecies(Species.PARAS, 1, false, false, false, "Mushroom Pokémon", Type.BUG, Type.GRASS, 0.3, 5.4, Abilities.EFFECT_SPORE, Abilities.DRY_SKIN, Abilities.DAMP, 285, 35, 70, 55, 45, 55, 25, 190, 70, 57, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.PARASECT, 1, false, false, false, "Mushroom Pokémon", Type.BUG, Type.GRASS, 1, 29.5, Abilities.EFFECT_SPORE, Abilities.DRY_SKIN, Abilities.DAMP, 405, 60, 95, 80, 60, 80, 30, 75, 70, 142, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.VENONAT, 1, false, false, false, "Insect Pokémon", Type.BUG, Type.POISON, 1, 30, Abilities.COMPOUND_EYES, Abilities.TINTED_LENS, Abilities.RUN_AWAY, 305, 60, 55, 50, 40, 55, 45, 190, 70, 61, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.VENOMOTH, 1, false, false, false, "Poison Moth Pokémon", Type.BUG, Type.POISON, 1.5, 12.5, Abilities.SHIELD_DUST, Abilities.TINTED_LENS, Abilities.WONDER_SKIN, 450, 70, 65, 60, 90, 75, 90, 75, 70, 158, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.DIGLETT, 1, false, false, false, "Mole Pokémon", Type.GROUND, null, 0.2, 0.8, Abilities.SAND_VEIL, Abilities.ARENA_TRAP, Abilities.SAND_FORCE, 265, 10, 55, 25, 35, 45, 95, 255, 50, 53, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.DUGTRIO, 1, false, false, false, "Mole Pokémon", Type.GROUND, null, 0.7, 33.3, Abilities.SAND_VEIL, Abilities.ARENA_TRAP, Abilities.SAND_FORCE, 425, 35, 100, 50, 50, 70, 120, 50, 50, 149, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.MEOWTH, 1, false, false, false, "Scratch Cat Pokémon", Type.NORMAL, null, 0.4, 4.2, Abilities.PICKUP, Abilities.TECHNICIAN, Abilities.UNNERVE, 290, 40, 45, 35, 40, 40, 90, 255, 50, 58, GrowthRate.MEDIUM_FAST, 50, false, true,
      new PokemonForm("Normal", "", Type.NORMAL, null, 0.4, 4.2, Abilities.PICKUP, Abilities.TECHNICIAN, Abilities.UNNERVE, 290, 40, 45, 35, 40, 40, 90, 255, 50, 58),
      new PokemonForm("G-Max", SpeciesFormKey.GIGANTAMAX, Type.NORMAL, null, 33, 4.2, Abilities.PICKUP, Abilities.TECHNICIAN, Abilities.UNNERVE, 390, 50, 85, 60, 70, 50, 75, 255, 50, 58),
    ),
    new PokemonSpecies(Species.PERSIAN, 1, false, false, false, "Classy Cat Pokémon", Type.NORMAL, null, 1, 32, Abilities.LIMBER, Abilities.TECHNICIAN, Abilities.UNNERVE, 440, 65, 70, 60, 65, 65, 115, 90, 50, 154, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.PSYDUCK, 1, false, false, false, "Duck Pokémon", Type.WATER, null, 0.8, 19.6, Abilities.DAMP, Abilities.CLOUD_NINE, Abilities.SWIFT_SWIM, 320, 50, 52, 48, 65, 50, 55, 190, 50, 64, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.GOLDUCK, 1, false, false, false, "Duck Pokémon", Type.WATER, null, 1.7, 76.6, Abilities.DAMP, Abilities.CLOUD_NINE, Abilities.SWIFT_SWIM, 500, 80, 82, 78, 95, 80, 85, 75, 50, 175, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.MANKEY, 1, false, false, false, "Pig Monkey Pokémon", Type.FIGHTING, null, 0.5, 28, Abilities.VITAL_SPIRIT, Abilities.ANGER_POINT, Abilities.DEFIANT, 305, 40, 80, 35, 35, 45, 70, 190, 70, 61, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.PRIMEAPE, 1, false, false, false, "Pig Monkey Pokémon", Type.FIGHTING, null, 1, 32, Abilities.VITAL_SPIRIT, Abilities.ANGER_POINT, Abilities.DEFIANT, 455, 65, 105, 60, 60, 70, 95, 75, 70, 159, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.GROWLITHE, 1, false, false, false, "Puppy Pokémon", Type.FIRE, null, 0.7, 19, Abilities.INTIMIDATE, Abilities.FLASH_FIRE, Abilities.JUSTIFIED, 350, 55, 70, 45, 70, 50, 60, 190, 50, 70, GrowthRate.SLOW, 75, false),
    new PokemonSpecies(Species.ARCANINE, 1, false, false, false, "Legendary Pokémon", Type.FIRE, null, 1.9, 155, Abilities.INTIMIDATE, Abilities.FLASH_FIRE, Abilities.JUSTIFIED, 555, 90, 110, 80, 100, 80, 95, 75, 50, 194, GrowthRate.SLOW, 75, false),
    new PokemonSpecies(Species.POLIWAG, 1, false, false, false, "Tadpole Pokémon", Type.WATER, null, 0.6, 12.4, Abilities.WATER_ABSORB, Abilities.DAMP, Abilities.SWIFT_SWIM, 300, 40, 50, 40, 40, 40, 90, 255, 50, 60, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.POLIWHIRL, 1, false, false, false, "Tadpole Pokémon", Type.WATER, null, 1, 20, Abilities.WATER_ABSORB, Abilities.DAMP, Abilities.SWIFT_SWIM, 385, 65, 65, 65, 50, 50, 90, 120, 50, 135, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.POLIWRATH, 1, false, false, false, "Tadpole Pokémon", Type.WATER, Type.FIGHTING, 1.3, 54, Abilities.WATER_ABSORB, Abilities.DAMP, Abilities.SWIFT_SWIM, 510, 90, 95, 95, 70, 90, 70, 45, 50, 255, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.ABRA, 1, false, false, false, "Psi Pokémon", Type.PSYCHIC, null, 0.9, 19.5, Abilities.SYNCHRONIZE, Abilities.INNER_FOCUS, Abilities.MAGIC_GUARD, 310, 25, 20, 15, 105, 55, 90, 200, 50, 62, GrowthRate.MEDIUM_SLOW, 75, false),
    new PokemonSpecies(Species.KADABRA, 1, false, false, false, "Psi Pokémon", Type.PSYCHIC, null, 1.3, 56.5, Abilities.SYNCHRONIZE, Abilities.INNER_FOCUS, Abilities.MAGIC_GUARD, 400, 40, 35, 30, 120, 70, 105, 100, 50, 140, GrowthRate.MEDIUM_SLOW, 75, true),
    new PokemonSpecies(Species.ALAKAZAM, 1, false, false, false, "Psi Pokémon", Type.PSYCHIC, null, 1.5, 48, Abilities.SYNCHRONIZE, Abilities.INNER_FOCUS, Abilities.MAGIC_GUARD, 500, 55, 50, 45, 135, 95, 120, 50, 50, 250, GrowthRate.MEDIUM_SLOW, 75, true, true,
      new PokemonForm("Normal", "", Type.PSYCHIC, null, 1.5, 48, Abilities.SYNCHRONIZE, Abilities.INNER_FOCUS, Abilities.MAGIC_GUARD, 500, 55, 50, 45, 135, 95, 120, 50, 50, 250, true),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.PSYCHIC, null, 1.2, 48, Abilities.TRACE, Abilities.TRACE, Abilities.TRACE, 600, 55, 50, 65, 175, 105, 150, 50, 50, 250, true),
    ),
    new PokemonSpecies(Species.MACHOP, 1, false, false, false, "Superpower Pokémon", Type.FIGHTING, null, 0.8, 19.5, Abilities.GUTS, Abilities.NO_GUARD, Abilities.STEADFAST, 305, 70, 80, 50, 35, 35, 35, 180, 50, 61, GrowthRate.MEDIUM_SLOW, 75, false),
    new PokemonSpecies(Species.MACHOKE, 1, false, false, false, "Superpower Pokémon", Type.FIGHTING, null, 1.5, 70.5, Abilities.GUTS, Abilities.NO_GUARD, Abilities.STEADFAST, 405, 80, 100, 70, 50, 60, 45, 90, 50, 142, GrowthRate.MEDIUM_SLOW, 75, false),
    new PokemonSpecies(Species.MACHAMP, 1, false, false, false, "Superpower Pokémon", Type.FIGHTING, null, 1.6, 130, Abilities.GUTS, Abilities.NO_GUARD, Abilities.STEADFAST, 505, 90, 130, 80, 65, 85, 55, 45, 50, 253, GrowthRate.MEDIUM_SLOW, 75, false, true,
      new PokemonForm("Normal", "", Type.FIGHTING, null, 1.6, 130, Abilities.GUTS, Abilities.NO_GUARD, Abilities.STEADFAST, 505, 90, 130, 80, 65, 85, 55, 45, 50, 253),
      new PokemonForm("G-Max", SpeciesFormKey.GIGANTAMAX, Type.FIGHTING, null, 25, 130, Abilities.GUTS, Abilities.NO_GUARD, Abilities.STEADFAST, 605, 113, 170, 90, 70, 95, 67, 45, 50, 253),
    ),
    new PokemonSpecies(Species.BELLSPROUT, 1, false, false, false, "Flower Pokémon", Type.GRASS, Type.POISON, 0.7, 4, Abilities.CHLOROPHYLL, Abilities.NONE, Abilities.GLUTTONY, 300, 50, 75, 35, 70, 30, 40, 255, 70, 60, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.WEEPINBELL, 1, false, false, false, "Flycatcher Pokémon", Type.GRASS, Type.POISON, 1, 6.4, Abilities.CHLOROPHYLL, Abilities.NONE, Abilities.GLUTTONY, 390, 65, 90, 50, 85, 45, 55, 120, 70, 137, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.VICTREEBEL, 1, false, false, false, "Flycatcher Pokémon", Type.GRASS, Type.POISON, 1.7, 15.5, Abilities.CHLOROPHYLL, Abilities.NONE, Abilities.GLUTTONY, 490, 80, 105, 65, 100, 70, 70, 45, 70, 221, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.TENTACOOL, 1, false, false, false, "Jellyfish Pokémon", Type.WATER, Type.POISON, 0.9, 45.5, Abilities.CLEAR_BODY, Abilities.LIQUID_OOZE, Abilities.RAIN_DISH, 335, 40, 40, 35, 50, 100, 70, 190, 50, 67, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.TENTACRUEL, 1, false, false, false, "Jellyfish Pokémon", Type.WATER, Type.POISON, 1.6, 55, Abilities.CLEAR_BODY, Abilities.LIQUID_OOZE, Abilities.RAIN_DISH, 515, 80, 70, 65, 80, 120, 100, 60, 50, 180, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.GEODUDE, 1, false, false, false, "Rock Pokémon", Type.ROCK, Type.GROUND, 0.4, 20, Abilities.ROCK_HEAD, Abilities.STURDY, Abilities.SAND_VEIL, 300, 40, 80, 100, 30, 30, 20, 255, 70, 60, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.GRAVELER, 1, false, false, false, "Rock Pokémon", Type.ROCK, Type.GROUND, 1, 105, Abilities.ROCK_HEAD, Abilities.STURDY, Abilities.SAND_VEIL, 390, 55, 95, 115, 45, 45, 35, 120, 70, 137, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.GOLEM, 1, false, false, false, "Megaton Pokémon", Type.ROCK, Type.GROUND, 1.4, 300, Abilities.ROCK_HEAD, Abilities.STURDY, Abilities.SAND_VEIL, 495, 80, 120, 130, 55, 65, 45, 45, 70, 223, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.PONYTA, 1, false, false, false, "Fire Horse Pokémon", Type.FIRE, null, 1, 30, Abilities.RUN_AWAY, Abilities.FLASH_FIRE, Abilities.FLAME_BODY, 410, 50, 85, 55, 65, 65, 90, 190, 50, 82, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.RAPIDASH, 1, false, false, false, "Fire Horse Pokémon", Type.FIRE, null, 1.7, 95, Abilities.RUN_AWAY, Abilities.FLASH_FIRE, Abilities.FLAME_BODY, 500, 65, 100, 70, 80, 80, 105, 60, 50, 175, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.SLOWPOKE, 1, false, false, false, "Dopey Pokémon", Type.WATER, Type.PSYCHIC, 1.2, 36, Abilities.OBLIVIOUS, Abilities.OWN_TEMPO, Abilities.REGENERATOR, 315, 90, 65, 65, 40, 40, 15, 190, 50, 63, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.SLOWBRO, 1, false, false, false, "Hermit Crab Pokémon", Type.WATER, Type.PSYCHIC, 1.6, 78.5, Abilities.OBLIVIOUS, Abilities.OWN_TEMPO, Abilities.REGENERATOR, 490, 95, 75, 110, 100, 80, 30, 75, 50, 172, GrowthRate.MEDIUM_FAST, 50, false, true,
      new PokemonForm("Normal", "", Type.WATER, Type.PSYCHIC, 1.6, 78.5, Abilities.OBLIVIOUS, Abilities.OWN_TEMPO, Abilities.REGENERATOR, 490, 95, 75, 110, 100, 80, 30, 75, 50, 172),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.WATER, Type.PSYCHIC, 2, 120, Abilities.SHELL_ARMOR, Abilities.SHELL_ARMOR, Abilities.SHELL_ARMOR, 590, 95, 75, 180, 130, 80, 30, 75, 50, 172),
    ),
    new PokemonSpecies(Species.MAGNEMITE, 1, false, false, false, "Magnet Pokémon", Type.ELECTRIC, Type.STEEL, 0.3, 6, Abilities.MAGNET_PULL, Abilities.STURDY, Abilities.ANALYTIC, 325, 25, 35, 70, 95, 55, 45, 190, 50, 65, GrowthRate.MEDIUM_FAST, null, false),
    new PokemonSpecies(Species.MAGNETON, 1, false, false, false, "Magnet Pokémon", Type.ELECTRIC, Type.STEEL, 1, 60, Abilities.MAGNET_PULL, Abilities.STURDY, Abilities.ANALYTIC, 465, 50, 60, 95, 120, 70, 70, 60, 50, 163, GrowthRate.MEDIUM_FAST, null, false),
    new PokemonSpecies(Species.FARFETCHD, 1, false, false, false, "Wild Duck Pokémon", Type.NORMAL, Type.FLYING, 0.8, 15, Abilities.KEEN_EYE, Abilities.INNER_FOCUS, Abilities.DEFIANT, 377, 52, 90, 55, 58, 62, 60, 45, 50, 132, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.DODUO, 1, false, false, false, "Twin Bird Pokémon", Type.NORMAL, Type.FLYING, 1.4, 39.2, Abilities.RUN_AWAY, Abilities.EARLY_BIRD, Abilities.TANGLED_FEET, 310, 35, 85, 45, 35, 35, 75, 190, 70, 62, GrowthRate.MEDIUM_FAST, 50, true),
    new PokemonSpecies(Species.DODRIO, 1, false, false, false, "Triple Bird Pokémon", Type.NORMAL, Type.FLYING, 1.8, 85.2, Abilities.RUN_AWAY, Abilities.EARLY_BIRD, Abilities.TANGLED_FEET, 470, 60, 110, 70, 60, 60, 110, 45, 70, 165, GrowthRate.MEDIUM_FAST, 50, true),
    new PokemonSpecies(Species.SEEL, 1, false, false, false, "Sea Lion Pokémon", Type.WATER, null, 1.1, 90, Abilities.THICK_FAT, Abilities.HYDRATION, Abilities.ICE_BODY, 325, 65, 45, 55, 45, 70, 45, 190, 70, 65, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.DEWGONG, 1, false, false, false, "Sea Lion Pokémon", Type.WATER, Type.ICE, 1.7, 120, Abilities.THICK_FAT, Abilities.HYDRATION, Abilities.ICE_BODY, 475, 90, 70, 80, 70, 95, 70, 75, 70, 166, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.GRIMER, 1, false, false, false, "Sludge Pokémon", Type.POISON, null, 0.9, 30, Abilities.STENCH, Abilities.STICKY_HOLD, Abilities.POISON_TOUCH, 325, 80, 80, 50, 40, 50, 25, 190, 70, 65, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.MUK, 1, false, false, false, "Sludge Pokémon", Type.POISON, null, 1.2, 30, Abilities.STENCH, Abilities.STICKY_HOLD, Abilities.POISON_TOUCH, 500, 105, 105, 75, 65, 100, 50, 75, 70, 175, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.SHELLDER, 1, false, false, false, "Bivalve Pokémon", Type.WATER, null, 0.3, 4, Abilities.SHELL_ARMOR, Abilities.SKILL_LINK, Abilities.OVERCOAT, 305, 30, 65, 100, 45, 25, 40, 190, 50, 61, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.CLOYSTER, 1, false, false, false, "Bivalve Pokémon", Type.WATER, Type.ICE, 1.5, 132.5, Abilities.SHELL_ARMOR, Abilities.SKILL_LINK, Abilities.OVERCOAT, 525, 50, 95, 180, 85, 45, 70, 60, 50, 184, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.GASTLY, 1, false, false, false, "Gas Pokémon", Type.GHOST, Type.POISON, 1.3, 0.1, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 310, 30, 35, 30, 100, 35, 80, 190, 50, 62, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.HAUNTER, 1, false, false, false, "Gas Pokémon", Type.GHOST, Type.POISON, 1.6, 0.1, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 405, 45, 50, 45, 115, 55, 95, 90, 50, 142, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.GENGAR, 1, false, false, false, "Shadow Pokémon", Type.GHOST, Type.POISON, 1.5, 40.5, Abilities.CURSED_BODY, Abilities.NONE, Abilities.NONE, 500, 60, 65, 60, 130, 75, 110, 45, 50, 250, GrowthRate.MEDIUM_SLOW, 50, false, true,
      new PokemonForm("Normal", "", Type.GHOST, Type.POISON, 1.5, 40.5, Abilities.CURSED_BODY, Abilities.NONE, Abilities.NONE, 500, 60, 65, 60, 130, 75, 110, 45, 50, 250),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.GHOST, Type.POISON, 1.4, 40.5, Abilities.SHADOW_TAG, Abilities.NONE, Abilities.NONE, 600, 60, 65, 80, 170, 95, 130, 45, 50, 250),
      new PokemonForm("G-Max", SpeciesFormKey.GIGANTAMAX, Type.GHOST, Type.POISON, 20, 40.5, Abilities.CURSED_BODY, Abilities.NONE, Abilities.NONE, 600, 75, 95, 85, 160, 95, 90, 45, 50, 250),
    ),
    new PokemonSpecies(Species.ONIX, 1, false, false, false, "Rock Snake Pokémon", Type.ROCK, Type.GROUND, 8.8, 210, Abilities.ROCK_HEAD, Abilities.STURDY, Abilities.WEAK_ARMOR, 385, 35, 45, 160, 30, 45, 70, 45, 50, 77, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.DROWZEE, 1, false, false, false, "Hypnosis Pokémon", Type.PSYCHIC, null, 1, 32.4, Abilities.INSOMNIA, Abilities.FOREWARN, Abilities.INNER_FOCUS, 328, 60, 48, 45, 43, 90, 42, 190, 70, 66, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.HYPNO, 1, false, false, false, "Hypnosis Pokémon", Type.PSYCHIC, null, 1.6, 75.6, Abilities.INSOMNIA, Abilities.FOREWARN, Abilities.INNER_FOCUS, 483, 85, 73, 70, 73, 115, 67, 75, 70, 169, GrowthRate.MEDIUM_FAST, 50, true),
    new PokemonSpecies(Species.KRABBY, 1, false, false, false, "River Crab Pokémon", Type.WATER, null, 0.4, 6.5, Abilities.HYPER_CUTTER, Abilities.SHELL_ARMOR, Abilities.SHEER_FORCE, 325, 30, 105, 90, 25, 25, 50, 225, 50, 65, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.KINGLER, 1, false, false, false, "Pincer Pokémon", Type.WATER, null, 1.3, 60, Abilities.HYPER_CUTTER, Abilities.SHELL_ARMOR, Abilities.SHEER_FORCE, 475, 55, 130, 115, 50, 50, 75, 60, 50, 166, GrowthRate.MEDIUM_FAST, 50, false, true,
      new PokemonForm("Normal", "", Type.WATER, null, 1.3, 60, Abilities.HYPER_CUTTER, Abilities.SHELL_ARMOR, Abilities.SHEER_FORCE, 475, 55, 130, 115, 50, 50, 75, 60, 50, 166),
      new PokemonForm("G-Max", SpeciesFormKey.GIGANTAMAX, Type.WATER, null, 19, 60, Abilities.HYPER_CUTTER, Abilities.SHELL_ARMOR, Abilities.SHEER_FORCE, 575, 70, 165, 145, 60, 70, 65, 60, 50, 166),
    ),
    new PokemonSpecies(Species.VOLTORB, 1, false, false, false, "Ball Pokémon", Type.ELECTRIC, null, 0.5, 10.4, Abilities.SOUNDPROOF, Abilities.STATIC, Abilities.AFTERMATH, 330, 40, 30, 50, 55, 55, 100, 190, 70, 66, GrowthRate.MEDIUM_FAST, null, false),
    new PokemonSpecies(Species.ELECTRODE, 1, false, false, false, "Ball Pokémon", Type.ELECTRIC, null, 1.2, 66.6, Abilities.SOUNDPROOF, Abilities.STATIC, Abilities.AFTERMATH, 490, 60, 50, 70, 80, 80, 150, 60, 70, 172, GrowthRate.MEDIUM_FAST, null, false),
    new PokemonSpecies(Species.EXEGGCUTE, 1, false, false, false, "Egg Pokémon", Type.GRASS, Type.PSYCHIC, 0.4, 2.5, Abilities.CHLOROPHYLL, Abilities.NONE, Abilities.HARVEST, 325, 60, 40, 80, 60, 45, 40, 90, 50, 65, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.EXEGGUTOR, 1, false, false, false, "Coconut Pokémon", Type.GRASS, Type.PSYCHIC, 2, 120, Abilities.CHLOROPHYLL, Abilities.NONE, Abilities.HARVEST, 530, 95, 95, 85, 125, 75, 55, 45, 50, 186, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.CUBONE, 1, false, false, false, "Lonely Pokémon", Type.GROUND, null, 0.4, 6.5, Abilities.ROCK_HEAD, Abilities.LIGHTNING_ROD, Abilities.BATTLE_ARMOR, 320, 50, 50, 95, 40, 50, 35, 190, 50, 64, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.MAROWAK, 1, false, false, false, "Bone Keeper Pokémon", Type.GROUND, null, 1, 45, Abilities.ROCK_HEAD, Abilities.LIGHTNING_ROD, Abilities.BATTLE_ARMOR, 425, 60, 80, 110, 50, 80, 45, 75, 50, 149, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.HITMONLEE, 1, false, false, false, "Kicking Pokémon", Type.FIGHTING, null, 1.5, 49.8, Abilities.LIMBER, Abilities.RECKLESS, Abilities.UNBURDEN, 455, 50, 120, 53, 35, 110, 87, 45, 50, 159, GrowthRate.MEDIUM_FAST, 100, false),
    new PokemonSpecies(Species.HITMONCHAN, 1, false, false, false, "Punching Pokémon", Type.FIGHTING, null, 1.4, 50.2, Abilities.KEEN_EYE, Abilities.IRON_FIST, Abilities.INNER_FOCUS, 455, 50, 105, 79, 35, 110, 76, 45, 50, 159, GrowthRate.MEDIUM_FAST, 100, false),
    new PokemonSpecies(Species.LICKITUNG, 1, false, false, false, "Licking Pokémon", Type.NORMAL, null, 1.2, 65.5, Abilities.OWN_TEMPO, Abilities.OBLIVIOUS, Abilities.CLOUD_NINE, 385, 90, 55, 75, 60, 75, 30, 45, 50, 77, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.KOFFING, 1, false, false, false, "Poison Gas Pokémon", Type.POISON, null, 0.6, 1, Abilities.LEVITATE, Abilities.NEUTRALIZING_GAS, Abilities.STENCH, 340, 40, 65, 95, 60, 45, 35, 190, 50, 68, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.WEEZING, 1, false, false, false, "Poison Gas Pokémon", Type.POISON, null, 1.2, 9.5, Abilities.LEVITATE, Abilities.NEUTRALIZING_GAS, Abilities.STENCH, 490, 65, 90, 120, 85, 70, 60, 60, 50, 172, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.RHYHORN, 1, false, false, false, "Spikes Pokémon", Type.GROUND, Type.ROCK, 1, 115, Abilities.LIGHTNING_ROD, Abilities.ROCK_HEAD, Abilities.RECKLESS, 345, 80, 85, 95, 30, 30, 25, 120, 50, 69, GrowthRate.SLOW, 50, true),
    new PokemonSpecies(Species.RHYDON, 1, false, false, false, "Drill Pokémon", Type.GROUND, Type.ROCK, 1.9, 120, Abilities.LIGHTNING_ROD, Abilities.ROCK_HEAD, Abilities.RECKLESS, 485, 105, 130, 120, 45, 45, 40, 60, 50, 170, GrowthRate.SLOW, 50, true),
    new PokemonSpecies(Species.CHANSEY, 1, false, false, false, "Egg Pokémon", Type.NORMAL, null, 1.1, 34.6, Abilities.NATURAL_CURE, Abilities.SERENE_GRACE, Abilities.HEALER, 450, 250, 5, 5, 35, 105, 50, 30, 140, 395, GrowthRate.FAST, 0, false),
    new PokemonSpecies(Species.TANGELA, 1, false, false, false, "Vine Pokémon", Type.GRASS, null, 1, 35, Abilities.CHLOROPHYLL, Abilities.LEAF_GUARD, Abilities.REGENERATOR, 435, 65, 55, 115, 100, 40, 60, 45, 50, 87, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.KANGASKHAN, 1, false, false, false, "Parent Pokémon", Type.NORMAL, null, 2.2, 80, Abilities.EARLY_BIRD, Abilities.SCRAPPY, Abilities.INNER_FOCUS, 490, 105, 95, 80, 40, 80, 90, 45, 50, 172, GrowthRate.MEDIUM_FAST, 0, false, true,
      new PokemonForm("Normal", "", Type.NORMAL, null, 2.2, 80, Abilities.EARLY_BIRD, Abilities.SCRAPPY, Abilities.INNER_FOCUS, 490, 105, 95, 80, 40, 80, 90, 45, 50, 172),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.NORMAL, null, 2.2, 100, Abilities.PARENTAL_BOND, Abilities.PARENTAL_BOND, Abilities.PARENTAL_BOND, 590, 105, 125, 100, 60, 100, 100, 45, 50, 172),
    ),
    new PokemonSpecies(Species.HORSEA, 1, false, false, false, "Dragon Pokémon", Type.WATER, null, 0.4, 8, Abilities.SWIFT_SWIM, Abilities.SNIPER, Abilities.DAMP, 295, 30, 40, 70, 70, 25, 60, 225, 50, 59, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.SEADRA, 1, false, false, false, "Dragon Pokémon", Type.WATER, null, 1.2, 25, Abilities.POISON_POINT, Abilities.SNIPER, Abilities.DAMP, 440, 55, 65, 95, 95, 45, 85, 75, 50, 154, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.GOLDEEN, 1, false, false, false, "Goldfish Pokémon", Type.WATER, null, 0.6, 15, Abilities.SWIFT_SWIM, Abilities.WATER_VEIL, Abilities.LIGHTNING_ROD, 320, 45, 67, 60, 35, 50, 63, 225, 50, 64, GrowthRate.MEDIUM_FAST, 50, true),
    new PokemonSpecies(Species.SEAKING, 1, false, false, false, "Goldfish Pokémon", Type.WATER, null, 1.3, 39, Abilities.SWIFT_SWIM, Abilities.WATER_VEIL, Abilities.LIGHTNING_ROD, 450, 80, 92, 65, 65, 80, 68, 60, 50, 158, GrowthRate.MEDIUM_FAST, 50, true),
    new PokemonSpecies(Species.STARYU, 1, false, false, false, "Star Shape Pokémon", Type.WATER, null, 0.8, 34.5, Abilities.ILLUMINATE, Abilities.NATURAL_CURE, Abilities.ANALYTIC, 340, 30, 45, 55, 70, 55, 85, 225, 50, 68, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.STARMIE, 1, false, false, false, "Mysterious Pokémon", Type.WATER, Type.PSYCHIC, 1.1, 80, Abilities.ILLUMINATE, Abilities.NATURAL_CURE, Abilities.ANALYTIC, 520, 60, 75, 85, 100, 85, 115, 60, 50, 182, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.MR_MIME, 1, false, false, false, "Barrier Pokémon", Type.PSYCHIC, Type.FAIRY, 1.3, 54.5, Abilities.SOUNDPROOF, Abilities.FILTER, Abilities.TECHNICIAN, 460, 40, 45, 65, 100, 120, 90, 45, 50, 161, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.SCYTHER, 1, false, false, false, "Mantis Pokémon", Type.BUG, Type.FLYING, 1.5, 56, Abilities.SWARM, Abilities.TECHNICIAN, Abilities.STEADFAST, 500, 70, 110, 80, 55, 80, 105, 45, 50, 100, GrowthRate.MEDIUM_FAST, 50, true),
    new PokemonSpecies(Species.JYNX, 1, false, false, false, "Human Shape Pokémon", Type.ICE, Type.PSYCHIC, 1.4, 40.6, Abilities.OBLIVIOUS, Abilities.FOREWARN, Abilities.DRY_SKIN, 455, 65, 50, 35, 115, 95, 95, 45, 50, 159, GrowthRate.MEDIUM_FAST, 0, false),
    new PokemonSpecies(Species.ELECTABUZZ, 1, false, false, false, "Electric Pokémon", Type.ELECTRIC, null, 1.1, 30, Abilities.STATIC, Abilities.NONE, Abilities.VITAL_SPIRIT, 490, 65, 83, 57, 95, 85, 105, 45, 50, 172, GrowthRate.MEDIUM_FAST, 75, false),
    new PokemonSpecies(Species.MAGMAR, 1, false, false, false, "Spitfire Pokémon", Type.FIRE, null, 1.3, 44.5, Abilities.FLAME_BODY, Abilities.NONE, Abilities.VITAL_SPIRIT, 495, 65, 95, 57, 100, 85, 93, 45, 50, 173, GrowthRate.MEDIUM_FAST, 75, false),
    new PokemonSpecies(Species.PINSIR, 1, false, false, false, "Stag Beetle Pokémon", Type.BUG, null, 1.5, 55, Abilities.HYPER_CUTTER, Abilities.MOLD_BREAKER, Abilities.MOXIE, 500, 65, 125, 100, 55, 70, 85, 45, 50, 175, GrowthRate.SLOW, 50, false, true,
      new PokemonForm("Normal", "", Type.BUG, null, 1.5, 55, Abilities.HYPER_CUTTER, Abilities.MOLD_BREAKER, Abilities.MOXIE, 500, 65, 125, 100, 55, 70, 85, 45, 50, 175),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.BUG, Type.FLYING, 1.7, 59, Abilities.AERILATE, Abilities.AERILATE, Abilities.AERILATE, 600, 65, 155, 120, 65, 90, 105, 45, 50, 175),
    ),
    new PokemonSpecies(Species.TAUROS, 1, false, false, false, "Wild Bull Pokémon", Type.NORMAL, null, 1.4, 88.4, Abilities.INTIMIDATE, Abilities.ANGER_POINT, Abilities.SHEER_FORCE, 490, 75, 100, 95, 40, 70, 110, 45, 50, 172, GrowthRate.SLOW, 100, false),
    new PokemonSpecies(Species.MAGIKARP, 1, false, false, false, "Fish Pokémon", Type.WATER, null, 0.9, 10, Abilities.SWIFT_SWIM, Abilities.NONE, Abilities.RATTLED, 200, 20, 10, 55, 15, 20, 80, 255, 50, 40, GrowthRate.SLOW, 50, true),
    new PokemonSpecies(Species.GYARADOS, 1, false, false, false, "Atrocious Pokémon", Type.WATER, Type.FLYING, 6.5, 235, Abilities.INTIMIDATE, Abilities.NONE, Abilities.MOXIE, 540, 95, 125, 79, 60, 100, 81, 45, 50, 189, GrowthRate.SLOW, 50, true, true,
      new PokemonForm("Normal", "", Type.WATER, Type.FLYING, 6.5, 235, Abilities.INTIMIDATE, Abilities.NONE, Abilities.MOXIE, 540, 95, 125, 79, 60, 100, 81, 45, 50, 189, true),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.WATER, Type.DARK, 6.5, 305, Abilities.MOLD_BREAKER, Abilities.MOLD_BREAKER, Abilities.MOLD_BREAKER, 640, 95, 155, 109, 70, 130, 81, 45, 50, 189, true),
    ),
    new PokemonSpecies(Species.LAPRAS, 1, false, false, false, "Transport Pokémon", Type.WATER, Type.ICE, 2.5, 220, Abilities.WATER_ABSORB, Abilities.SHELL_ARMOR, Abilities.HYDRATION, 535, 130, 85, 80, 85, 95, 60, 45, 50, 187, GrowthRate.SLOW, 50, false, true,
      new PokemonForm("Normal", "", Type.WATER, Type.ICE, 2.5, 220, Abilities.WATER_ABSORB, Abilities.SHELL_ARMOR, Abilities.HYDRATION, 535, 130, 85, 80, 85, 95, 60, 45, 50, 187),
      new PokemonForm("G-Max", SpeciesFormKey.GIGANTAMAX, Type.WATER, Type.ICE, 24, 220, Abilities.WATER_ABSORB, Abilities.SHELL_ARMOR, Abilities.HYDRATION, 635, 160, 95, 110, 95, 125, 50, 45, 50, 187),
    ),
    new PokemonSpecies(Species.DITTO, 1, false, false, false, "Transform Pokémon", Type.NORMAL, null, 0.3, 4, Abilities.LIMBER, Abilities.NONE, Abilities.IMPOSTER, 288, 48, 48, 48, 48, 48, 48, 35, 50, 101, GrowthRate.MEDIUM_FAST, null, false),
    new PokemonSpecies(Species.EEVEE, 1, false, false, false, "Evolution Pokémon", Type.NORMAL, null, 0.3, 6.5, Abilities.RUN_AWAY, Abilities.ADAPTABILITY, Abilities.ANTICIPATION, 325, 55, 55, 50, 45, 65, 55, 45, 50, 65, GrowthRate.MEDIUM_FAST, 87.5, false, true,
      new PokemonForm("Normal", "", Type.NORMAL, null, 0.3, 6.5, Abilities.RUN_AWAY, Abilities.ADAPTABILITY, Abilities.ANTICIPATION, 325, 55, 55, 50, 45, 65, 55, 45, 50, 65),
      new PokemonForm("G-Max", SpeciesFormKey.GIGANTAMAX, Type.NORMAL, null, 18, 6.5, Abilities.RUN_AWAY, Abilities.ADAPTABILITY, Abilities.ANTICIPATION, 425, 70, 75, 80, 60, 95, 45, 45, 50, 65),
    ),
    new PokemonSpecies(Species.VAPOREON, 1, false, false, false, "Bubble Jet Pokémon", Type.WATER, null, 1, 29, Abilities.WATER_ABSORB, Abilities.NONE, Abilities.HYDRATION, 525, 130, 65, 60, 110, 95, 65, 45, 50, 184, GrowthRate.MEDIUM_FAST, 87.5, false),
    new PokemonSpecies(Species.JOLTEON, 1, false, false, false, "Lightning Pokémon", Type.ELECTRIC, null, 0.8, 24.5, Abilities.VOLT_ABSORB, Abilities.NONE, Abilities.QUICK_FEET, 525, 65, 65, 60, 110, 95, 130, 45, 50, 184, GrowthRate.MEDIUM_FAST, 87.5, false),
    new PokemonSpecies(Species.FLAREON, 1, false, false, false, "Flame Pokémon", Type.FIRE, null, 0.9, 25, Abilities.FLASH_FIRE, Abilities.NONE, Abilities.GUTS, 525, 65, 130, 60, 95, 110, 65, 45, 50, 184, GrowthRate.MEDIUM_FAST, 87.5, false),
    new PokemonSpecies(Species.PORYGON, 1, false, false, false, "Virtual Pokémon", Type.NORMAL, null, 0.8, 36.5, Abilities.TRACE, Abilities.DOWNLOAD, Abilities.ANALYTIC, 395, 65, 60, 70, 85, 75, 40, 45, 50, 79, GrowthRate.MEDIUM_FAST, null, false),
    new PokemonSpecies(Species.OMANYTE, 1, false, false, false, "Spiral Pokémon", Type.ROCK, Type.WATER, 0.4, 7.5, Abilities.SWIFT_SWIM, Abilities.SHELL_ARMOR, Abilities.WEAK_ARMOR, 355, 35, 40, 100, 90, 55, 35, 45, 50, 71, GrowthRate.MEDIUM_FAST, 87.5, false),
    new PokemonSpecies(Species.OMASTAR, 1, false, false, false, "Spiral Pokémon", Type.ROCK, Type.WATER, 1, 35, Abilities.SWIFT_SWIM, Abilities.SHELL_ARMOR, Abilities.WEAK_ARMOR, 495, 70, 60, 125, 115, 70, 55, 45, 50, 173, GrowthRate.MEDIUM_FAST, 87.5, false),
    new PokemonSpecies(Species.KABUTO, 1, false, false, false, "Shellfish Pokémon", Type.ROCK, Type.WATER, 0.5, 11.5, Abilities.SWIFT_SWIM, Abilities.BATTLE_ARMOR, Abilities.WEAK_ARMOR, 355, 30, 80, 90, 55, 45, 55, 45, 50, 71, GrowthRate.MEDIUM_FAST, 87.5, false),
    new PokemonSpecies(Species.KABUTOPS, 1, false, false, false, "Shellfish Pokémon", Type.ROCK, Type.WATER, 1.3, 40.5, Abilities.SWIFT_SWIM, Abilities.BATTLE_ARMOR, Abilities.WEAK_ARMOR, 495, 60, 115, 105, 65, 70, 80, 45, 50, 173, GrowthRate.MEDIUM_FAST, 87.5, false),
    new PokemonSpecies(Species.AERODACTYL, 1, false, false, false, "Fossil Pokémon", Type.ROCK, Type.FLYING, 1.8, 59, Abilities.ROCK_HEAD, Abilities.PRESSURE, Abilities.UNNERVE, 515, 80, 105, 65, 60, 75, 130, 45, 50, 180, GrowthRate.SLOW, 87.5, false, true,
      new PokemonForm("Normal", "", Type.ROCK, Type.FLYING, 1.8, 59, Abilities.ROCK_HEAD, Abilities.PRESSURE, Abilities.UNNERVE, 515, 80, 105, 65, 60, 75, 130, 45, 50, 180),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.ROCK, Type.FLYING, 2.1, 79, Abilities.TOUGH_CLAWS, Abilities.TOUGH_CLAWS, Abilities.TOUGH_CLAWS, 615, 80, 135, 85, 70, 95, 150, 45, 50, 180),
    ),
    new PokemonSpecies(Species.SNORLAX, 1, false, false, false, "Sleeping Pokémon", Type.NORMAL, null, 2.1, 460, Abilities.IMMUNITY, Abilities.THICK_FAT, Abilities.GLUTTONY, 540, 160, 110, 65, 65, 110, 30, 25, 50, 189, GrowthRate.SLOW, 87.5, false, true,
      new PokemonForm("Normal", "", Type.NORMAL, null, 2.1, 460, Abilities.IMMUNITY, Abilities.THICK_FAT, Abilities.GLUTTONY, 540, 160, 110, 65, 65, 110, 30, 25, 50, 189),
      new PokemonForm("G-Max", SpeciesFormKey.GIGANTAMAX, Type.NORMAL, null, 35, 460, Abilities.IMMUNITY, Abilities.THICK_FAT, Abilities.GLUTTONY, 640, 200, 130, 85, 75, 130, 20, 25, 50, 189),
    ),
    new PokemonSpecies(Species.ARTICUNO, 1, true, false, false, "Freeze Pokémon", Type.ICE, Type.FLYING, 1.7, 55.4, Abilities.PRESSURE, Abilities.NONE, Abilities.SNOW_CLOAK, 580, 90, 85, 100, 95, 125, 85, 3, 35, 290, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.ZAPDOS, 1, true, false, false, "Electric Pokémon", Type.ELECTRIC, Type.FLYING, 1.6, 52.6, Abilities.PRESSURE, Abilities.NONE, Abilities.STATIC, 580, 90, 90, 85, 125, 90, 100, 3, 35, 290, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.MOLTRES, 1, true, false, false, "Flame Pokémon", Type.FIRE, Type.FLYING, 2, 60, Abilities.PRESSURE, Abilities.NONE, Abilities.FLAME_BODY, 580, 90, 100, 90, 125, 85, 90, 3, 35, 290, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.DRATINI, 1, false, false, false, "Dragon Pokémon", Type.DRAGON, null, 1.8, 3.3, Abilities.SHED_SKIN, Abilities.NONE, Abilities.MARVEL_SCALE, 300, 41, 64, 45, 50, 50, 50, 45, 35, 60, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.DRAGONAIR, 1, false, false, false, "Dragon Pokémon", Type.DRAGON, null, 4, 16.5, Abilities.SHED_SKIN, Abilities.NONE, Abilities.MARVEL_SCALE, 420, 61, 84, 65, 70, 70, 70, 45, 35, 147, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.DRAGONITE, 1, false, false, false, "Dragon Pokémon", Type.DRAGON, Type.FLYING, 2.2, 210, Abilities.INNER_FOCUS, Abilities.NONE, Abilities.MULTISCALE, 600, 91, 134, 95, 100, 100, 80, 45, 35, 300, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.MEWTWO, 1, false, true, false, "Genetic Pokémon", Type.PSYCHIC, null, 2, 122, Abilities.PRESSURE, Abilities.NONE, Abilities.UNNERVE, 680, 106, 110, 90, 154, 90, 130, 3, 0, 340, GrowthRate.SLOW, null, false, true,
      new PokemonForm("Normal", "", Type.PSYCHIC, null, 2, 122, Abilities.PRESSURE, Abilities.NONE, Abilities.UNNERVE, 680, 106, 110, 90, 154, 90, 130, 3, 0, 340),
      new PokemonForm("Mega X", SpeciesFormKey.MEGA_X, Type.PSYCHIC, Type.FIGHTING, 2.3, 127, Abilities.STEADFAST, Abilities.NONE, Abilities.STEADFAST, 780, 106, 190, 100, 154, 100, 130, 3, 0, 340),
      new PokemonForm("Mega Y", SpeciesFormKey.MEGA_Y, Type.PSYCHIC, null, 1.5, 33, Abilities.INSOMNIA, Abilities.NONE, Abilities.INSOMNIA, 780, 106, 150, 70, 194, 120, 140, 3, 0, 340),
    ),
    new PokemonSpecies(Species.MEW, 1, false, false, true, "New Species Pokémon", Type.PSYCHIC, null, 0.4, 4, Abilities.SYNCHRONIZE, Abilities.NONE, Abilities.NONE, 600, 100, 100, 100, 100, 100, 100, 45, 100, 300, GrowthRate.MEDIUM_SLOW, null, false),
    new PokemonSpecies(Species.CHIKORITA, 2, false, false, false, "Leaf Pokémon", Type.GRASS, null, 0.9, 6.4, Abilities.OVERGROW, Abilities.NONE, Abilities.LEAF_GUARD, 318, 45, 49, 65, 49, 65, 45, 45, 70, 64, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.BAYLEEF, 2, false, false, false, "Leaf Pokémon", Type.GRASS, null, 1.2, 15.8, Abilities.OVERGROW, Abilities.NONE, Abilities.LEAF_GUARD, 405, 60, 62, 80, 63, 80, 60, 45, 70, 142, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.MEGANIUM, 2, false, false, false, "Herb Pokémon", Type.GRASS, null, 1.8, 100.5, Abilities.OVERGROW, Abilities.NONE, Abilities.LEAF_GUARD, 525, 80, 82, 100, 83, 100, 80, 45, 70, 236, GrowthRate.MEDIUM_SLOW, 87.5, true),
    new PokemonSpecies(Species.CYNDAQUIL, 2, false, false, false, "Fire Mouse Pokémon", Type.FIRE, null, 0.5, 7.9, Abilities.BLAZE, Abilities.NONE, Abilities.FLASH_FIRE, 309, 39, 52, 43, 60, 50, 65, 45, 70, 62, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.QUILAVA, 2, false, false, false, "Volcano Pokémon", Type.FIRE, null, 0.9, 19, Abilities.BLAZE, Abilities.NONE, Abilities.FLASH_FIRE, 405, 58, 64, 58, 80, 65, 80, 45, 70, 142, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.TYPHLOSION, 2, false, false, false, "Volcano Pokémon", Type.FIRE, null, 1.7, 79.5, Abilities.BLAZE, Abilities.NONE, Abilities.FLASH_FIRE, 534, 78, 84, 78, 109, 85, 100, 45, 70, 240, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.TOTODILE, 2, false, false, false, "Big Jaw Pokémon", Type.WATER, null, 0.6, 9.5, Abilities.TORRENT, Abilities.NONE, Abilities.SHEER_FORCE, 314, 50, 65, 64, 44, 48, 43, 45, 70, 63, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.CROCONAW, 2, false, false, false, "Big Jaw Pokémon", Type.WATER, null, 1.1, 25, Abilities.TORRENT, Abilities.NONE, Abilities.SHEER_FORCE, 405, 65, 80, 80, 59, 63, 58, 45, 70, 142, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.FERALIGATR, 2, false, false, false, "Big Jaw Pokémon", Type.WATER, null, 2.3, 88.8, Abilities.TORRENT, Abilities.NONE, Abilities.SHEER_FORCE, 530, 85, 105, 100, 79, 83, 78, 45, 70, 239, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.SENTRET, 2, false, false, false, "Scout Pokémon", Type.NORMAL, null, 0.8, 6, Abilities.RUN_AWAY, Abilities.KEEN_EYE, Abilities.FRISK, 215, 35, 46, 34, 35, 45, 20, 255, 70, 43, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.FURRET, 2, false, false, false, "Long Body Pokémon", Type.NORMAL, null, 1.8, 32.5, Abilities.RUN_AWAY, Abilities.KEEN_EYE, Abilities.FRISK, 415, 85, 76, 64, 45, 55, 90, 90, 70, 145, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.HOOTHOOT, 2, false, false, false, "Owl Pokémon", Type.NORMAL, Type.FLYING, 0.7, 21.2, Abilities.INSOMNIA, Abilities.KEEN_EYE, Abilities.TINTED_LENS, 262, 60, 30, 30, 36, 56, 50, 255, 50, 52, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.NOCTOWL, 2, false, false, false, "Owl Pokémon", Type.NORMAL, Type.FLYING, 1.6, 40.8, Abilities.INSOMNIA, Abilities.KEEN_EYE, Abilities.TINTED_LENS, 452, 100, 50, 50, 86, 96, 70, 90, 50, 158, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.LEDYBA, 2, false, false, false, "Five Star Pokémon", Type.BUG, Type.FLYING, 1, 10.8, Abilities.SWARM, Abilities.EARLY_BIRD, Abilities.RATTLED, 265, 40, 20, 30, 40, 80, 55, 255, 70, 53, GrowthRate.FAST, 50, true),
    new PokemonSpecies(Species.LEDIAN, 2, false, false, false, "Five Star Pokémon", Type.BUG, Type.FLYING, 1.4, 35.6, Abilities.SWARM, Abilities.EARLY_BIRD, Abilities.IRON_FIST, 390, 55, 35, 50, 55, 110, 85, 90, 70, 137, GrowthRate.FAST, 50, true),
    new PokemonSpecies(Species.SPINARAK, 2, false, false, false, "String Spit Pokémon", Type.BUG, Type.POISON, 0.5, 8.5, Abilities.SWARM, Abilities.INSOMNIA, Abilities.SNIPER, 250, 40, 60, 40, 40, 40, 30, 255, 70, 50, GrowthRate.FAST, 50, false),
    new PokemonSpecies(Species.ARIADOS, 2, false, false, false, "Long Leg Pokémon", Type.BUG, Type.POISON, 1.1, 33.5, Abilities.SWARM, Abilities.INSOMNIA, Abilities.SNIPER, 400, 70, 90, 70, 60, 70, 40, 90, 70, 140, GrowthRate.FAST, 50, false),
    new PokemonSpecies(Species.CROBAT, 2, false, false, false, "Bat Pokémon", Type.POISON, Type.FLYING, 1.8, 75, Abilities.INNER_FOCUS, Abilities.NONE, Abilities.INFILTRATOR, 535, 85, 90, 80, 70, 80, 130, 90, 50, 268, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.CHINCHOU, 2, false, false, false, "Angler Pokémon", Type.WATER, Type.ELECTRIC, 0.5, 12, Abilities.VOLT_ABSORB, Abilities.ILLUMINATE, Abilities.WATER_ABSORB, 330, 75, 38, 38, 56, 56, 67, 190, 50, 66, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.LANTURN, 2, false, false, false, "Light Pokémon", Type.WATER, Type.ELECTRIC, 1.2, 22.5, Abilities.VOLT_ABSORB, Abilities.ILLUMINATE, Abilities.WATER_ABSORB, 460, 125, 58, 58, 76, 76, 67, 75, 50, 161, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.PICHU, 2, false, false, false, "Tiny Mouse Pokémon", Type.ELECTRIC, null, 0.3, 2, Abilities.STATIC, Abilities.NONE, Abilities.LIGHTNING_ROD, 205, 20, 40, 15, 35, 35, 60, 190, 70, 41, GrowthRate.MEDIUM_FAST, 50, false, false,
      new PokemonForm("Normal", "", Type.ELECTRIC, null, 1.4, 61.5, Abilities.STATIC, Abilities.NONE, Abilities.LIGHTNING_ROD, 205, 20, 40, 15, 35, 35, 60, 190, 70, 41, false, null, true),
      new PokemonForm("Spiky-Eared", "spiky", Type.ELECTRIC, null, 1.4, 61.5, Abilities.STATIC, Abilities.NONE, Abilities.LIGHTNING_ROD, 205, 20, 40, 15, 35, 35, 60, 190, 70, 41, false, null, true),
    ),
    new PokemonSpecies(Species.CLEFFA, 2, false, false, false, "Star Shape Pokémon", Type.FAIRY, null, 0.3, 3, Abilities.CUTE_CHARM, Abilities.MAGIC_GUARD, Abilities.FRIEND_GUARD, 218, 50, 25, 28, 45, 55, 15, 150, 140, 44, GrowthRate.FAST, 25, false),
    new PokemonSpecies(Species.IGGLYBUFF, 2, false, false, false, "Balloon Pokémon", Type.NORMAL, Type.FAIRY, 0.3, 1, Abilities.CUTE_CHARM, Abilities.COMPETITIVE, Abilities.FRIEND_GUARD, 210, 90, 30, 15, 40, 20, 15, 170, 50, 42, GrowthRate.FAST, 25, false),
    new PokemonSpecies(Species.TOGEPI, 2, false, false, false, "Spike Ball Pokémon", Type.FAIRY, null, 0.3, 1.5, Abilities.HUSTLE, Abilities.SERENE_GRACE, Abilities.SUPER_LUCK, 245, 35, 20, 65, 40, 65, 20, 190, 50, 49, GrowthRate.FAST, 87.5, false),
    new PokemonSpecies(Species.TOGETIC, 2, false, false, false, "Happiness Pokémon", Type.FAIRY, Type.FLYING, 0.6, 3.2, Abilities.HUSTLE, Abilities.SERENE_GRACE, Abilities.SUPER_LUCK, 405, 55, 40, 85, 80, 105, 40, 75, 50, 142, GrowthRate.FAST, 87.5, false),
    new PokemonSpecies(Species.NATU, 2, false, false, false, "Tiny Bird Pokémon", Type.PSYCHIC, Type.FLYING, 0.2, 2, Abilities.SYNCHRONIZE, Abilities.EARLY_BIRD, Abilities.MAGIC_BOUNCE, 320, 40, 50, 45, 70, 45, 70, 190, 50, 64, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.XATU, 2, false, false, false, "Mystic Pokémon", Type.PSYCHIC, Type.FLYING, 1.5, 15, Abilities.SYNCHRONIZE, Abilities.EARLY_BIRD, Abilities.MAGIC_BOUNCE, 470, 65, 75, 70, 95, 70, 95, 75, 50, 165, GrowthRate.MEDIUM_FAST, 50, true),
    new PokemonSpecies(Species.MAREEP, 2, false, false, false, "Wool Pokémon", Type.ELECTRIC, null, 0.6, 7.8, Abilities.STATIC, Abilities.NONE, Abilities.PLUS, 280, 55, 40, 40, 65, 45, 35, 235, 70, 56, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.FLAAFFY, 2, false, false, false, "Wool Pokémon", Type.ELECTRIC, null, 0.8, 13.3, Abilities.STATIC, Abilities.NONE, Abilities.PLUS, 365, 70, 55, 55, 80, 60, 45, 120, 70, 128, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.AMPHAROS, 2, false, false, false, "Light Pokémon", Type.ELECTRIC, null, 1.4, 61.5, Abilities.STATIC, Abilities.NONE, Abilities.PLUS, 510, 90, 75, 85, 115, 90, 55, 45, 70, 230, GrowthRate.MEDIUM_SLOW, 50, false, true,
      new PokemonForm("Normal", "", Type.ELECTRIC, null, 1.4, 61.5, Abilities.STATIC, Abilities.NONE, Abilities.PLUS, 510, 90, 75, 85, 115, 90, 55, 45, 70, 230),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.ELECTRIC, Type.DRAGON, 1.4, 61.5, Abilities.MOLD_BREAKER, Abilities.NONE, Abilities.MOLD_BREAKER, 610, 90, 95, 105, 165, 110, 45, 45, 70, 230),
    ),
    new PokemonSpecies(Species.BELLOSSOM, 2, false, false, false, "Flower Pokémon", Type.GRASS, null, 0.4, 5.8, Abilities.CHLOROPHYLL, Abilities.NONE, Abilities.HEALER, 490, 75, 80, 95, 90, 100, 50, 45, 50, 245, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.MARILL, 2, false, false, false, "Aqua Mouse Pokémon", Type.WATER, Type.FAIRY, 0.4, 8.5, Abilities.THICK_FAT, Abilities.HUGE_POWER, Abilities.SAP_SIPPER, 250, 70, 20, 50, 20, 50, 40, 190, 50, 88, GrowthRate.FAST, 50, false),
    new PokemonSpecies(Species.AZUMARILL, 2, false, false, false, "Aqua Rabbit Pokémon", Type.WATER, Type.FAIRY, 0.8, 28.5, Abilities.THICK_FAT, Abilities.HUGE_POWER, Abilities.SAP_SIPPER, 420, 100, 50, 80, 60, 80, 50, 75, 50, 210, GrowthRate.FAST, 50, false),
    new PokemonSpecies(Species.SUDOWOODO, 2, false, false, false, "Imitation Pokémon", Type.ROCK, null, 1.2, 38, Abilities.STURDY, Abilities.ROCK_HEAD, Abilities.RATTLED, 410, 70, 100, 115, 30, 65, 30, 65, 50, 144, GrowthRate.MEDIUM_FAST, 50, true),
    new PokemonSpecies(Species.POLITOED, 2, false, false, false, "Frog Pokémon", Type.WATER, null, 1.1, 33.9, Abilities.WATER_ABSORB, Abilities.DAMP, Abilities.DRIZZLE, 500, 90, 75, 75, 90, 100, 70, 45, 50, 250, GrowthRate.MEDIUM_SLOW, 50, true),
    new PokemonSpecies(Species.HOPPIP, 2, false, false, false, "Cottonweed Pokémon", Type.GRASS, Type.FLYING, 0.4, 0.5, Abilities.CHLOROPHYLL, Abilities.LEAF_GUARD, Abilities.INFILTRATOR, 250, 35, 35, 40, 35, 55, 50, 255, 70, 50, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.SKIPLOOM, 2, false, false, false, "Cottonweed Pokémon", Type.GRASS, Type.FLYING, 0.6, 1, Abilities.CHLOROPHYLL, Abilities.LEAF_GUARD, Abilities.INFILTRATOR, 340, 55, 45, 50, 45, 65, 80, 120, 70, 119, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.JUMPLUFF, 2, false, false, false, "Cottonweed Pokémon", Type.GRASS, Type.FLYING, 0.8, 3, Abilities.CHLOROPHYLL, Abilities.LEAF_GUARD, Abilities.INFILTRATOR, 460, 75, 55, 70, 55, 95, 110, 45, 70, 207, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.AIPOM, 2, false, false, false, "Long Tail Pokémon", Type.NORMAL, null, 0.8, 11.5, Abilities.RUN_AWAY, Abilities.PICKUP, Abilities.SKILL_LINK, 360, 55, 70, 55, 40, 55, 85, 45, 70, 72, GrowthRate.FAST, 50, true),
    new PokemonSpecies(Species.SUNKERN, 2, false, false, false, "Seed Pokémon", Type.GRASS, null, 0.3, 1.8, Abilities.CHLOROPHYLL, Abilities.SOLAR_POWER, Abilities.EARLY_BIRD, 180, 30, 30, 30, 30, 30, 30, 235, 70, 36, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.SUNFLORA, 2, false, false, false, "Sun Pokémon", Type.GRASS, null, 0.8, 8.5, Abilities.CHLOROPHYLL, Abilities.SOLAR_POWER, Abilities.EARLY_BIRD, 425, 75, 75, 55, 105, 85, 30, 120, 70, 149, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.YANMA, 2, false, false, false, "Clear Wing Pokémon", Type.BUG, Type.FLYING, 1.2, 38, Abilities.SPEED_BOOST, Abilities.COMPOUND_EYES, Abilities.FRISK, 390, 65, 65, 45, 75, 45, 95, 75, 70, 78, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.WOOPER, 2, false, false, false, "Water Fish Pokémon", Type.WATER, Type.GROUND, 0.4, 8.5, Abilities.DAMP, Abilities.WATER_ABSORB, Abilities.UNAWARE, 210, 55, 45, 45, 25, 25, 15, 255, 50, 42, GrowthRate.MEDIUM_FAST, 50, true),
    new PokemonSpecies(Species.QUAGSIRE, 2, false, false, false, "Water Fish Pokémon", Type.WATER, Type.GROUND, 1.4, 75, Abilities.DAMP, Abilities.WATER_ABSORB, Abilities.UNAWARE, 430, 95, 85, 85, 65, 65, 35, 90, 50, 151, GrowthRate.MEDIUM_FAST, 50, true),
    new PokemonSpecies(Species.ESPEON, 2, false, false, false, "Sun Pokémon", Type.PSYCHIC, null, 0.9, 26.5, Abilities.SYNCHRONIZE, Abilities.NONE, Abilities.MAGIC_BOUNCE, 525, 65, 65, 60, 130, 95, 110, 45, 50, 184, GrowthRate.MEDIUM_FAST, 87.5, false),
    new PokemonSpecies(Species.UMBREON, 2, false, false, false, "Moonlight Pokémon", Type.DARK, null, 1, 27, Abilities.SYNCHRONIZE, Abilities.NONE, Abilities.INNER_FOCUS, 525, 95, 65, 110, 60, 130, 65, 45, 35, 184, GrowthRate.MEDIUM_FAST, 87.5, false),
    new PokemonSpecies(Species.MURKROW, 2, false, false, false, "Darkness Pokémon", Type.DARK, Type.FLYING, 0.5, 2.1, Abilities.INSOMNIA, Abilities.SUPER_LUCK, Abilities.PRANKSTER, 405, 60, 85, 42, 85, 42, 91, 30, 35, 81, GrowthRate.MEDIUM_SLOW, 50, true),
    new PokemonSpecies(Species.SLOWKING, 2, false, false, false, "Royal Pokémon", Type.WATER, Type.PSYCHIC, 2, 79.5, Abilities.OBLIVIOUS, Abilities.OWN_TEMPO, Abilities.REGENERATOR, 490, 95, 75, 80, 100, 110, 30, 70, 50, 172, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.MISDREAVUS, 2, false, false, false, "Screech Pokémon", Type.GHOST, null, 0.7, 1, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 435, 60, 60, 60, 85, 85, 85, 45, 35, 87, GrowthRate.FAST, 50, false),
    new PokemonSpecies(Species.UNOWN, 2, false, false, false, "Symbol Pokémon", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, GrowthRate.MEDIUM_FAST, null, false, false,
      new PokemonForm("A", "a", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, false, null, true),
      new PokemonForm("B", "b", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, false, null, true),
      new PokemonForm("C", "c", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, false, null, true),
      new PokemonForm("D", "d", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, false, null, true),
      new PokemonForm("E", "e", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, false, null, true),
      new PokemonForm("F", "f", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, false, null, true),
      new PokemonForm("G", "g", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, false, null, true),
      new PokemonForm("H", "h", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, false, null, true),
      new PokemonForm("I", "i", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, false, null, true),
      new PokemonForm("J", "j", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, false, null, true),
      new PokemonForm("K", "k", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, false, null, true),
      new PokemonForm("L", "l", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, false, null, true),
      new PokemonForm("M", "m", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, false, null, true),
      new PokemonForm("N", "n", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, false, null, true),
      new PokemonForm("O", "o", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, false, null, true),
      new PokemonForm("P", "p", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, false, null, true),
      new PokemonForm("Q", "q", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, false, null, true),
      new PokemonForm("R", "r", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, false, null, true),
      new PokemonForm("S", "s", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, false, null, true),
      new PokemonForm("T", "t", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, false, null, true),
      new PokemonForm("U", "u", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, false, null, true),
      new PokemonForm("V", "v", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, false, null, true),
      new PokemonForm("W", "w", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, false, null, true),
      new PokemonForm("X", "x", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, false, null, true),
      new PokemonForm("Y", "y", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, false, null, true),
      new PokemonForm("Z", "z", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, false, null, true),
      new PokemonForm("!", "exclamation", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, false, null, true),
      new PokemonForm("?", "question", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, false, null, true),
    ),
    new PokemonSpecies(Species.WOBBUFFET, 2, false, false, false, "Patient Pokémon", Type.PSYCHIC, null, 1.3, 28.5, Abilities.SHADOW_TAG, Abilities.NONE, Abilities.TELEPATHY, 405, 190, 33, 58, 33, 58, 33, 45, 50, 142, GrowthRate.MEDIUM_FAST, 50, true),
    new PokemonSpecies(Species.GIRAFARIG, 2, false, false, false, "Long Neck Pokémon", Type.NORMAL, Type.PSYCHIC, 1.5, 41.5, Abilities.INNER_FOCUS, Abilities.EARLY_BIRD, Abilities.SAP_SIPPER, 455, 70, 80, 65, 90, 65, 85, 60, 70, 159, GrowthRate.MEDIUM_FAST, 50, true),
    new PokemonSpecies(Species.PINECO, 2, false, false, false, "Bagworm Pokémon", Type.BUG, null, 0.6, 7.2, Abilities.STURDY, Abilities.NONE, Abilities.OVERCOAT, 290, 50, 65, 90, 35, 35, 15, 190, 70, 58, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.FORRETRESS, 2, false, false, false, "Bagworm Pokémon", Type.BUG, Type.STEEL, 1.2, 125.8, Abilities.STURDY, Abilities.NONE, Abilities.OVERCOAT, 465, 75, 90, 140, 60, 60, 40, 75, 70, 163, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.DUNSPARCE, 2, false, false, false, "Land Snake Pokémon", Type.NORMAL, null, 1.5, 14, Abilities.SERENE_GRACE, Abilities.RUN_AWAY, Abilities.RATTLED, 415, 100, 70, 70, 65, 65, 45, 190, 50, 145, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.GLIGAR, 2, false, false, false, "Fly Scorpion Pokémon", Type.GROUND, Type.FLYING, 1.1, 64.8, Abilities.HYPER_CUTTER, Abilities.SAND_VEIL, Abilities.IMMUNITY, 430, 65, 75, 105, 35, 65, 85, 60, 70, 86, GrowthRate.MEDIUM_SLOW, 50, true),
    new PokemonSpecies(Species.STEELIX, 2, false, false, false, "Iron Snake Pokémon", Type.STEEL, Type.GROUND, 9.2, 400, Abilities.ROCK_HEAD, Abilities.STURDY, Abilities.SHEER_FORCE, 510, 75, 85, 200, 55, 65, 30, 25, 50, 179, GrowthRate.MEDIUM_FAST, 50, true, true,
      new PokemonForm("Normal", "", Type.STEEL, Type.GROUND, 9.2, 400, Abilities.ROCK_HEAD, Abilities.STURDY, Abilities.SHEER_FORCE, 510, 75, 85, 200, 55, 65, 30, 25, 50, 179, true),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.STEEL, Type.GROUND, 10.5, 740, Abilities.SAND_FORCE, Abilities.SAND_FORCE, Abilities.SAND_FORCE, 610, 75, 125, 230, 55, 95, 30, 25, 50, 179, true),
    ),
    new PokemonSpecies(Species.SNUBBULL, 2, false, false, false, "Fairy Pokémon", Type.FAIRY, null, 0.6, 7.8, Abilities.INTIMIDATE, Abilities.RUN_AWAY, Abilities.RATTLED, 300, 60, 80, 50, 40, 40, 30, 190, 70, 60, GrowthRate.FAST, 25, false),
    new PokemonSpecies(Species.GRANBULL, 2, false, false, false, "Fairy Pokémon", Type.FAIRY, null, 1.4, 48.7, Abilities.INTIMIDATE, Abilities.QUICK_FEET, Abilities.RATTLED, 450, 90, 120, 75, 60, 60, 45, 75, 70, 158, GrowthRate.FAST, 25, false),
    new PokemonSpecies(Species.QWILFISH, 2, false, false, false, "Balloon Pokémon", Type.WATER, Type.POISON, 0.5, 3.9, Abilities.POISON_POINT, Abilities.SWIFT_SWIM, Abilities.INTIMIDATE, 440, 65, 95, 85, 55, 55, 85, 45, 50, 88, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.SCIZOR, 2, false, false, false, "Pincer Pokémon", Type.BUG, Type.STEEL, 1.8, 118, Abilities.SWARM, Abilities.TECHNICIAN, Abilities.LIGHT_METAL, 500, 70, 130, 100, 55, 80, 65, 25, 50, 175, GrowthRate.MEDIUM_FAST, 50, true, true,
      new PokemonForm("Normal", "", Type.BUG, Type.STEEL, 1.8, 118, Abilities.SWARM, Abilities.TECHNICIAN, Abilities.LIGHT_METAL, 500, 70, 130, 100, 55, 80, 65, 25, 50, 175, true),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.BUG, Type.STEEL, 2, 125, Abilities.TECHNICIAN, Abilities.TECHNICIAN, Abilities.TECHNICIAN, 600, 70, 150, 140, 65, 100, 75, 25, 50, 175, true),
    ),
    new PokemonSpecies(Species.SHUCKLE, 2, false, false, false, "Mold Pokémon", Type.BUG, Type.ROCK, 0.6, 20.5, Abilities.STURDY, Abilities.GLUTTONY, Abilities.CONTRARY, 505, 20, 10, 230, 10, 230, 5, 190, 50, 177, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.HERACROSS, 2, false, false, false, "Single Horn Pokémon", Type.BUG, Type.FIGHTING, 1.5, 54, Abilities.SWARM, Abilities.GUTS, Abilities.MOXIE, 500, 80, 125, 75, 40, 95, 85, 45, 50, 175, GrowthRate.SLOW, 50, true, true,
      new PokemonForm("Normal", "", Type.BUG, Type.FIGHTING, 1.5, 54, Abilities.SWARM, Abilities.GUTS, Abilities.MOXIE, 500, 80, 125, 75, 40, 95, 85, 45, 50, 175, true),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.BUG, Type.FIGHTING, 1.7, 62.5, Abilities.SKILL_LINK, Abilities.SKILL_LINK, Abilities.SKILL_LINK, 600, 80, 185, 115, 40, 105, 75, 45, 50, 175, true),
    ),
    new PokemonSpecies(Species.SNEASEL, 2, false, false, false, "Sharp Claw Pokémon", Type.DARK, Type.ICE, 0.9, 28, Abilities.INNER_FOCUS, Abilities.KEEN_EYE, Abilities.PICKPOCKET, 430, 55, 95, 55, 35, 75, 115, 60, 35, 86, GrowthRate.MEDIUM_SLOW, 50, true),
    new PokemonSpecies(Species.TEDDIURSA, 2, false, false, false, "Little Bear Pokémon", Type.NORMAL, null, 0.6, 8.8, Abilities.PICKUP, Abilities.QUICK_FEET, Abilities.HONEY_GATHER, 330, 60, 80, 50, 50, 50, 40, 120, 70, 66, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.URSARING, 2, false, false, false, "Hibernator Pokémon", Type.NORMAL, null, 1.8, 125.8, Abilities.GUTS, Abilities.QUICK_FEET, Abilities.UNNERVE, 500, 90, 130, 75, 75, 75, 55, 60, 70, 175, GrowthRate.MEDIUM_FAST, 50, true),
    new PokemonSpecies(Species.SLUGMA, 2, false, false, false, "Lava Pokémon", Type.FIRE, null, 0.7, 35, Abilities.MAGMA_ARMOR, Abilities.FLAME_BODY, Abilities.WEAK_ARMOR, 250, 40, 40, 40, 70, 40, 20, 190, 70, 50, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.MAGCARGO, 2, false, false, false, "Lava Pokémon", Type.FIRE, Type.ROCK, 0.8, 55, Abilities.MAGMA_ARMOR, Abilities.FLAME_BODY, Abilities.WEAK_ARMOR, 430, 60, 50, 120, 90, 80, 30, 75, 70, 151, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.SWINUB, 2, false, false, false, "Pig Pokémon", Type.ICE, Type.GROUND, 0.4, 6.5, Abilities.OBLIVIOUS, Abilities.SNOW_CLOAK, Abilities.THICK_FAT, 250, 50, 50, 40, 30, 30, 50, 225, 50, 50, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.PILOSWINE, 2, false, false, false, "Swine Pokémon", Type.ICE, Type.GROUND, 1.1, 55.8, Abilities.OBLIVIOUS, Abilities.SNOW_CLOAK, Abilities.THICK_FAT, 450, 100, 100, 80, 60, 60, 50, 75, 50, 158, GrowthRate.SLOW, 50, true),
    new PokemonSpecies(Species.CORSOLA, 2, false, false, false, "Coral Pokémon", Type.WATER, Type.ROCK, 0.6, 5, Abilities.HUSTLE, Abilities.NATURAL_CURE, Abilities.REGENERATOR, 410, 65, 55, 95, 65, 95, 35, 60, 50, 144, GrowthRate.FAST, 25, false),
    new PokemonSpecies(Species.REMORAID, 2, false, false, false, "Jet Pokémon", Type.WATER, null, 0.6, 12, Abilities.HUSTLE, Abilities.SNIPER, Abilities.MOODY, 300, 35, 65, 35, 65, 35, 65, 190, 50, 60, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.OCTILLERY, 2, false, false, false, "Jet Pokémon", Type.WATER, null, 0.9, 28.5, Abilities.SUCTION_CUPS, Abilities.SNIPER, Abilities.MOODY, 480, 75, 105, 75, 105, 75, 45, 75, 50, 168, GrowthRate.MEDIUM_FAST, 50, true),
    new PokemonSpecies(Species.DELIBIRD, 2, false, false, false, "Delivery Pokémon", Type.ICE, Type.FLYING, 0.9, 16, Abilities.VITAL_SPIRIT, Abilities.HUSTLE, Abilities.INSOMNIA, 330, 45, 55, 45, 65, 45, 75, 45, 50, 116, GrowthRate.FAST, 50, false),
    new PokemonSpecies(Species.MANTINE, 2, false, false, false, "Kite Pokémon", Type.WATER, Type.FLYING, 2.1, 220, Abilities.SWIFT_SWIM, Abilities.WATER_ABSORB, Abilities.WATER_VEIL, 485, 85, 40, 70, 80, 140, 70, 25, 50, 170, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.SKARMORY, 2, false, false, false, "Armor Bird Pokémon", Type.STEEL, Type.FLYING, 1.7, 50.5, Abilities.KEEN_EYE, Abilities.STURDY, Abilities.WEAK_ARMOR, 465, 65, 80, 140, 40, 70, 70, 25, 50, 163, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.HOUNDOUR, 2, false, false, false, "Dark Pokémon", Type.DARK, Type.FIRE, 0.6, 10.8, Abilities.EARLY_BIRD, Abilities.FLASH_FIRE, Abilities.UNNERVE, 330, 45, 60, 30, 80, 50, 65, 120, 35, 66, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.HOUNDOOM, 2, false, false, false, "Dark Pokémon", Type.DARK, Type.FIRE, 1.4, 35, Abilities.EARLY_BIRD, Abilities.FLASH_FIRE, Abilities.UNNERVE, 500, 75, 90, 50, 110, 80, 95, 45, 35, 175, GrowthRate.SLOW, 50, true, true,
      new PokemonForm("Normal", "", Type.DARK, Type.FIRE, 1.4, 35, Abilities.EARLY_BIRD, Abilities.FLASH_FIRE, Abilities.UNNERVE, 500, 75, 90, 50, 110, 80, 95, 45, 35, 175, true),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.DARK, Type.FIRE, 1.9, 49.5, Abilities.SOLAR_POWER, Abilities.SOLAR_POWER, Abilities.SOLAR_POWER, 600, 75, 90, 90, 140, 90, 115, 45, 35, 175, true),
    ),
    new PokemonSpecies(Species.KINGDRA, 2, false, false, false, "Dragon Pokémon", Type.WATER, Type.DRAGON, 1.8, 152, Abilities.SWIFT_SWIM, Abilities.SNIPER, Abilities.DAMP, 540, 75, 95, 95, 95, 95, 85, 45, 50, 270, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.PHANPY, 2, false, false, false, "Long Nose Pokémon", Type.GROUND, null, 0.5, 33.5, Abilities.PICKUP, Abilities.NONE, Abilities.SAND_VEIL, 330, 90, 60, 60, 40, 40, 40, 120, 70, 66, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.DONPHAN, 2, false, false, false, "Armor Pokémon", Type.GROUND, null, 1.1, 120, Abilities.STURDY, Abilities.NONE, Abilities.SAND_VEIL, 500, 90, 120, 120, 60, 60, 50, 60, 70, 175, GrowthRate.MEDIUM_FAST, 50, true),
    new PokemonSpecies(Species.PORYGON2, 2, false, false, false, "Virtual Pokémon", Type.NORMAL, null, 0.6, 32.5, Abilities.TRACE, Abilities.DOWNLOAD, Abilities.ANALYTIC, 515, 85, 80, 90, 105, 95, 60, 45, 50, 180, GrowthRate.MEDIUM_FAST, null, false),
    new PokemonSpecies(Species.STANTLER, 2, false, false, false, "Big Horn Pokémon", Type.NORMAL, null, 1.4, 71.2, Abilities.INTIMIDATE, Abilities.FRISK, Abilities.SAP_SIPPER, 465, 73, 95, 62, 85, 65, 85, 45, 70, 163, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.SMEARGLE, 2, false, false, false, "Painter Pokémon", Type.NORMAL, null, 1.2, 58, Abilities.OWN_TEMPO, Abilities.TECHNICIAN, Abilities.MOODY, 250, 55, 20, 35, 20, 45, 75, 45, 70, 88, GrowthRate.FAST, 50, false),
    new PokemonSpecies(Species.TYROGUE, 2, false, false, false, "Scuffle Pokémon", Type.FIGHTING, null, 0.7, 21, Abilities.GUTS, Abilities.STEADFAST, Abilities.VITAL_SPIRIT, 210, 35, 35, 35, 35, 35, 35, 75, 50, 42, GrowthRate.MEDIUM_FAST, 100, false),
    new PokemonSpecies(Species.HITMONTOP, 2, false, false, false, "Handstand Pokémon", Type.FIGHTING, null, 1.4, 48, Abilities.INTIMIDATE, Abilities.TECHNICIAN, Abilities.STEADFAST, 455, 50, 95, 95, 35, 110, 70, 45, 50, 159, GrowthRate.MEDIUM_FAST, 100, false),
    new PokemonSpecies(Species.SMOOCHUM, 2, false, false, false, "Kiss Pokémon", Type.ICE, Type.PSYCHIC, 0.4, 6, Abilities.OBLIVIOUS, Abilities.FOREWARN, Abilities.HYDRATION, 305, 45, 30, 15, 85, 65, 65, 45, 50, 61, GrowthRate.MEDIUM_FAST, 0, false),
    new PokemonSpecies(Species.ELEKID, 2, false, false, false, "Electric Pokémon", Type.ELECTRIC, null, 0.6, 23.5, Abilities.STATIC, Abilities.NONE, Abilities.VITAL_SPIRIT, 360, 45, 63, 37, 65, 55, 95, 45, 50, 72, GrowthRate.MEDIUM_FAST, 75, false),
    new PokemonSpecies(Species.MAGBY, 2, false, false, false, "Live Coal Pokémon", Type.FIRE, null, 0.7, 21.4, Abilities.FLAME_BODY, Abilities.NONE, Abilities.VITAL_SPIRIT, 365, 45, 75, 37, 70, 55, 83, 45, 50, 73, GrowthRate.MEDIUM_FAST, 75, false),
    new PokemonSpecies(Species.MILTANK, 2, false, false, false, "Milk Cow Pokémon", Type.NORMAL, null, 1.2, 75.5, Abilities.THICK_FAT, Abilities.SCRAPPY, Abilities.SAP_SIPPER, 490, 95, 80, 105, 40, 70, 100, 45, 50, 172, GrowthRate.SLOW, 0, false),
    new PokemonSpecies(Species.BLISSEY, 2, false, false, false, "Happiness Pokémon", Type.NORMAL, null, 1.5, 46.8, Abilities.NATURAL_CURE, Abilities.SERENE_GRACE, Abilities.HEALER, 540, 255, 10, 10, 75, 135, 55, 30, 140, 635, GrowthRate.FAST, 0, false),
    new PokemonSpecies(Species.RAIKOU, 2, true, false, false, "Thunder Pokémon", Type.ELECTRIC, null, 1.9, 178, Abilities.PRESSURE, Abilities.NONE, Abilities.INNER_FOCUS, 580, 90, 85, 75, 115, 100, 115, 3, 35, 290, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.ENTEI, 2, true, false, false, "Volcano Pokémon", Type.FIRE, null, 2.1, 198, Abilities.PRESSURE, Abilities.NONE, Abilities.INNER_FOCUS, 580, 115, 115, 85, 90, 75, 100, 3, 35, 290, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.SUICUNE, 2, true, false, false, "Aurora Pokémon", Type.WATER, null, 2, 187, Abilities.PRESSURE, Abilities.NONE, Abilities.INNER_FOCUS, 580, 100, 75, 115, 90, 115, 85, 3, 35, 290, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.LARVITAR, 2, false, false, false, "Rock Skin Pokémon", Type.ROCK, Type.GROUND, 0.6, 72, Abilities.GUTS, Abilities.NONE, Abilities.SAND_VEIL, 300, 50, 64, 50, 45, 50, 41, 45, 35, 60, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.PUPITAR, 2, false, false, false, "Hard Shell Pokémon", Type.ROCK, Type.GROUND, 1.2, 152, Abilities.SHED_SKIN, Abilities.NONE, Abilities.SHED_SKIN, 410, 70, 84, 70, 65, 70, 51, 45, 35, 144, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.TYRANITAR, 2, false, false, false, "Armor Pokémon", Type.ROCK, Type.DARK, 2, 202, Abilities.SAND_STREAM, Abilities.NONE, Abilities.UNNERVE, 600, 100, 134, 110, 95, 100, 61, 45, 35, 300, GrowthRate.SLOW, 50, false, true,
      new PokemonForm("Normal", "", Type.ROCK, Type.DARK, 2, 202, Abilities.SAND_STREAM, Abilities.NONE, Abilities.UNNERVE, 600, 100, 134, 110, 95, 100, 61, 45, 35, 300),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.ROCK, Type.DARK, 2.5, 255, Abilities.SAND_STREAM, Abilities.NONE, Abilities.SAND_STREAM, 700, 100, 164, 150, 95, 120, 71, 45, 35, 300),
    ),
    new PokemonSpecies(Species.LUGIA, 2, false, true, false, "Diving Pokémon", Type.PSYCHIC, Type.FLYING, 5.2, 216, Abilities.PRESSURE, Abilities.NONE, Abilities.MULTISCALE, 680, 106, 90, 130, 90, 154, 110, 3, 0, 340, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.HO_OH, 2, false, true, false, "Rainbow Pokémon", Type.FIRE, Type.FLYING, 3.8, 199, Abilities.PRESSURE, Abilities.NONE, Abilities.REGENERATOR, 680, 106, 130, 90, 110, 154, 90, 3, 0, 340, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.CELEBI, 2, false, false, true, "Time Travel Pokémon", Type.PSYCHIC, Type.GRASS, 0.6, 5, Abilities.NATURAL_CURE, Abilities.NONE, Abilities.NONE, 600, 100, 100, 100, 100, 100, 100, 45, 100, 300, GrowthRate.MEDIUM_SLOW, null, false),
    new PokemonSpecies(Species.TREECKO, 3, false, false, false, "Wood Gecko Pokémon", Type.GRASS, null, 0.5, 5, Abilities.OVERGROW, Abilities.NONE, Abilities.UNBURDEN, 310, 40, 45, 35, 65, 55, 70, 45, 50, 62, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.GROVYLE, 3, false, false, false, "Wood Gecko Pokémon", Type.GRASS, null, 0.9, 21.6, Abilities.OVERGROW, Abilities.NONE, Abilities.UNBURDEN, 405, 50, 65, 45, 85, 65, 95, 45, 50, 142, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.SCEPTILE, 3, false, false, false, "Forest Pokémon", Type.GRASS, null, 1.7, 52.2, Abilities.OVERGROW, Abilities.NONE, Abilities.UNBURDEN, 530, 70, 85, 65, 105, 85, 120, 45, 50, 265, GrowthRate.MEDIUM_SLOW, 87.5, false, true,
      new PokemonForm("Normal", "", Type.GRASS, null, 1.7, 52.2, Abilities.OVERGROW, Abilities.NONE, Abilities.UNBURDEN, 530, 70, 85, 65, 105, 85, 120, 45, 50, 265),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.GRASS, Type.DRAGON, 1.9, 55.2, Abilities.LIGHTNING_ROD, Abilities.NONE, Abilities.LIGHTNING_ROD, 630, 70, 110, 75, 145, 85, 145, 45, 50, 265),
    ),
    new PokemonSpecies(Species.TORCHIC, 3, false, false, false, "Chick Pokémon", Type.FIRE, null, 0.4, 2.5, Abilities.BLAZE, Abilities.NONE, Abilities.SPEED_BOOST, 310, 45, 60, 40, 70, 50, 45, 45, 50, 62, GrowthRate.MEDIUM_SLOW, 87.5, true),
    new PokemonSpecies(Species.COMBUSKEN, 3, false, false, false, "Young Fowl Pokémon", Type.FIRE, Type.FIGHTING, 0.9, 19.5, Abilities.BLAZE, Abilities.NONE, Abilities.SPEED_BOOST, 405, 60, 85, 60, 85, 60, 55, 45, 50, 142, GrowthRate.MEDIUM_SLOW, 87.5, true),
    new PokemonSpecies(Species.BLAZIKEN, 3, false, false, false, "Blaze Pokémon", Type.FIRE, Type.FIGHTING, 1.9, 52, Abilities.BLAZE, Abilities.NONE, Abilities.SPEED_BOOST, 530, 80, 120, 70, 110, 70, 80, 45, 50, 265, GrowthRate.MEDIUM_SLOW, 87.5, true, true,
      new PokemonForm("Normal", "", Type.FIRE, Type.FIGHTING, 1.9, 52, Abilities.BLAZE, Abilities.NONE, Abilities.SPEED_BOOST, 530, 80, 120, 70, 110, 70, 80, 45, 50, 265, true),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.FIRE, Type.FIGHTING, 1.9, 52, Abilities.SPEED_BOOST, Abilities.NONE, Abilities.SPEED_BOOST, 630, 80, 160, 80, 130, 80, 100, 45, 50, 265, true),
    ),
    new PokemonSpecies(Species.MUDKIP, 3, false, false, false, "Mud Fish Pokémon", Type.WATER, null, 0.4, 7.6, Abilities.TORRENT, Abilities.NONE, Abilities.DAMP, 310, 50, 70, 50, 50, 50, 40, 45, 50, 62, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.MARSHTOMP, 3, false, false, false, "Mud Fish Pokémon", Type.WATER, Type.GROUND, 0.7, 28, Abilities.TORRENT, Abilities.NONE, Abilities.DAMP, 405, 70, 85, 70, 60, 70, 50, 45, 50, 142, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.SWAMPERT, 3, false, false, false, "Mud Fish Pokémon", Type.WATER, Type.GROUND, 1.5, 81.9, Abilities.TORRENT, Abilities.NONE, Abilities.DAMP, 535, 100, 110, 90, 85, 90, 60, 45, 50, 268, GrowthRate.MEDIUM_SLOW, 87.5, false, true,
      new PokemonForm("Normal", "", Type.WATER, Type.GROUND, 1.5, 81.9, Abilities.TORRENT, Abilities.NONE, Abilities.DAMP, 535, 100, 110, 90, 85, 90, 60, 45, 50, 268),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.WATER, Type.GROUND, 1.9, 102, Abilities.SWIFT_SWIM, Abilities.NONE, Abilities.SWIFT_SWIM, 635, 100, 150, 110, 95, 110, 70, 45, 50, 268),
    ),
    new PokemonSpecies(Species.POOCHYENA, 3, false, false, false, "Bite Pokémon", Type.DARK, null, 0.5, 13.6, Abilities.RUN_AWAY, Abilities.QUICK_FEET, Abilities.RATTLED, 220, 35, 55, 35, 30, 30, 35, 255, 70, 56, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.MIGHTYENA, 3, false, false, false, "Bite Pokémon", Type.DARK, null, 1, 37, Abilities.INTIMIDATE, Abilities.QUICK_FEET, Abilities.MOXIE, 420, 70, 90, 70, 60, 60, 70, 127, 70, 147, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.ZIGZAGOON, 3, false, false, false, "Tiny Raccoon Pokémon", Type.NORMAL, null, 0.4, 17.5, Abilities.PICKUP, Abilities.GLUTTONY, Abilities.QUICK_FEET, 240, 38, 30, 41, 30, 41, 60, 255, 50, 56, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.LINOONE, 3, false, false, false, "Rushing Pokémon", Type.NORMAL, null, 0.5, 32.5, Abilities.PICKUP, Abilities.GLUTTONY, Abilities.QUICK_FEET, 420, 78, 70, 61, 50, 61, 100, 90, 50, 147, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.WURMPLE, 3, false, false, false, "Worm Pokémon", Type.BUG, null, 0.3, 3.6, Abilities.SHIELD_DUST, Abilities.NONE, Abilities.RUN_AWAY, 195, 45, 45, 35, 20, 30, 20, 255, 70, 56, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.SILCOON, 3, false, false, false, "Cocoon Pokémon", Type.BUG, null, 0.6, 10, Abilities.SHED_SKIN, Abilities.NONE, Abilities.SHED_SKIN, 205, 50, 35, 55, 25, 25, 15, 120, 70, 72, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.BEAUTIFLY, 3, false, false, false, "Butterfly Pokémon", Type.BUG, Type.FLYING, 1, 28.4, Abilities.SWARM, Abilities.NONE, Abilities.RIVALRY, 395, 60, 70, 50, 100, 50, 65, 45, 70, 178, GrowthRate.MEDIUM_FAST, 50, true),
    new PokemonSpecies(Species.CASCOON, 3, false, false, false, "Cocoon Pokémon", Type.BUG, null, 0.7, 11.5, Abilities.SHED_SKIN, Abilities.NONE, Abilities.SHED_SKIN, 205, 50, 35, 55, 25, 25, 15, 120, 70, 72, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.DUSTOX, 3, false, false, false, "Poison Moth Pokémon", Type.BUG, Type.POISON, 1.2, 31.6, Abilities.SHIELD_DUST, Abilities.NONE, Abilities.COMPOUND_EYES, 385, 60, 50, 70, 50, 90, 65, 45, 70, 173, GrowthRate.MEDIUM_FAST, 50, true),
    new PokemonSpecies(Species.LOTAD, 3, false, false, false, "Water Weed Pokémon", Type.WATER, Type.GRASS, 0.5, 2.6, Abilities.SWIFT_SWIM, Abilities.RAIN_DISH, Abilities.OWN_TEMPO, 220, 40, 30, 30, 40, 50, 30, 255, 50, 44, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.LOMBRE, 3, false, false, false, "Jolly Pokémon", Type.WATER, Type.GRASS, 1.2, 32.5, Abilities.SWIFT_SWIM, Abilities.RAIN_DISH, Abilities.OWN_TEMPO, 340, 60, 50, 50, 60, 70, 50, 120, 50, 119, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.LUDICOLO, 3, false, false, false, "Carefree Pokémon", Type.WATER, Type.GRASS, 1.5, 55, Abilities.SWIFT_SWIM, Abilities.RAIN_DISH, Abilities.OWN_TEMPO, 480, 80, 70, 70, 90, 100, 70, 45, 50, 240, GrowthRate.MEDIUM_SLOW, 50, true),
    new PokemonSpecies(Species.SEEDOT, 3, false, false, false, "Acorn Pokémon", Type.GRASS, null, 0.5, 4, Abilities.CHLOROPHYLL, Abilities.EARLY_BIRD, Abilities.PICKPOCKET, 220, 40, 40, 50, 30, 30, 30, 255, 50, 44, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.NUZLEAF, 3, false, false, false, "Wily Pokémon", Type.GRASS, Type.DARK, 1, 28, Abilities.CHLOROPHYLL, Abilities.EARLY_BIRD, Abilities.PICKPOCKET, 340, 70, 70, 40, 60, 40, 60, 120, 50, 119, GrowthRate.MEDIUM_SLOW, 50, true),
    new PokemonSpecies(Species.SHIFTRY, 3, false, false, false, "Wicked Pokémon", Type.GRASS, Type.DARK, 1.3, 59.6, Abilities.CHLOROPHYLL, Abilities.WIND_RIDER, Abilities.PICKPOCKET, 480, 90, 100, 60, 90, 60, 80, 45, 50, 240, GrowthRate.MEDIUM_SLOW, 50, true),
    new PokemonSpecies(Species.TAILLOW, 3, false, false, false, "Tiny Swallow Pokémon", Type.NORMAL, Type.FLYING, 0.3, 2.3, Abilities.GUTS, Abilities.NONE, Abilities.SCRAPPY, 270, 40, 55, 30, 30, 30, 85, 200, 70, 54, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.SWELLOW, 3, false, false, false, "Swallow Pokémon", Type.NORMAL, Type.FLYING, 0.7, 19.8, Abilities.GUTS, Abilities.NONE, Abilities.SCRAPPY, 455, 60, 85, 60, 75, 50, 125, 45, 70, 159, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.WINGULL, 3, false, false, false, "Seagull Pokémon", Type.WATER, Type.FLYING, 0.6, 9.5, Abilities.KEEN_EYE, Abilities.HYDRATION, Abilities.RAIN_DISH, 270, 40, 30, 30, 55, 30, 85, 190, 50, 54, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.PELIPPER, 3, false, false, false, "Water Bird Pokémon", Type.WATER, Type.FLYING, 1.2, 28, Abilities.KEEN_EYE, Abilities.DRIZZLE, Abilities.RAIN_DISH, 440, 60, 50, 100, 95, 70, 65, 45, 50, 154, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.RALTS, 3, false, false, false, "Feeling Pokémon", Type.PSYCHIC, Type.FAIRY, 0.4, 6.6, Abilities.SYNCHRONIZE, Abilities.TRACE, Abilities.TELEPATHY, 198, 28, 25, 25, 45, 35, 40, 235, 35, 40, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.KIRLIA, 3, false, false, false, "Emotion Pokémon", Type.PSYCHIC, Type.FAIRY, 0.8, 20.2, Abilities.SYNCHRONIZE, Abilities.TRACE, Abilities.TELEPATHY, 278, 38, 35, 35, 65, 55, 50, 120, 35, 97, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.GARDEVOIR, 3, false, false, false, "Embrace Pokémon", Type.PSYCHIC, Type.FAIRY, 1.6, 48.4, Abilities.SYNCHRONIZE, Abilities.TRACE, Abilities.TELEPATHY, 518, 68, 65, 65, 125, 115, 80, 45, 35, 259, GrowthRate.SLOW, 0, false, true,
      new PokemonForm("Normal", "", Type.PSYCHIC, Type.FAIRY, 1.6, 48.4, Abilities.SYNCHRONIZE, Abilities.TRACE, Abilities.TELEPATHY, 518, 68, 65, 65, 125, 115, 80, 45, 35, 259),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.PSYCHIC, Type.FAIRY, 1.6, 48.4, Abilities.PIXILATE, Abilities.PIXILATE, Abilities.PIXILATE, 618, 68, 85, 65, 165, 135, 100, 45, 35, 259),
    ),
    new PokemonSpecies(Species.SURSKIT, 3, false, false, false, "Pond Skater Pokémon", Type.BUG, Type.WATER, 0.5, 1.7, Abilities.SWIFT_SWIM, Abilities.NONE, Abilities.RAIN_DISH, 269, 40, 30, 32, 50, 52, 65, 200, 70, 54, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.MASQUERAIN, 3, false, false, false, "Eyeball Pokémon", Type.BUG, Type.FLYING, 0.8, 3.6, Abilities.INTIMIDATE, Abilities.NONE, Abilities.UNNERVE, 454, 70, 60, 62, 100, 82, 80, 75, 70, 159, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.SHROOMISH, 3, false, false, false, "Mushroom Pokémon", Type.GRASS, null, 0.4, 4.5, Abilities.EFFECT_SPORE, Abilities.POISON_HEAL, Abilities.QUICK_FEET, 295, 60, 40, 60, 40, 60, 35, 255, 70, 59, GrowthRate.FLUCTUATING, 50, false),
    new PokemonSpecies(Species.BRELOOM, 3, false, false, false, "Mushroom Pokémon", Type.GRASS, Type.FIGHTING, 1.2, 39.2, Abilities.EFFECT_SPORE, Abilities.POISON_HEAL, Abilities.TECHNICIAN, 460, 60, 130, 80, 60, 60, 70, 90, 70, 161, GrowthRate.FLUCTUATING, 50, false),
    new PokemonSpecies(Species.SLAKOTH, 3, false, false, false, "Slacker Pokémon", Type.NORMAL, null, 0.8, 24, Abilities.TRUANT, Abilities.NONE, Abilities.NONE, 280, 60, 60, 60, 35, 35, 30, 255, 70, 56, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.VIGOROTH, 3, false, false, false, "Wild Monkey Pokémon", Type.NORMAL, null, 1.4, 46.5, Abilities.VITAL_SPIRIT, Abilities.NONE, Abilities.NONE, 440, 80, 80, 80, 55, 55, 90, 120, 70, 154, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.SLAKING, 3, false, false, false, "Lazy Pokémon", Type.NORMAL, null, 2, 130.5, Abilities.TRUANT, Abilities.NONE, Abilities.NONE, 670, 150, 160, 100, 95, 65, 100, 45, 70, 252, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.NINCADA, 3, false, false, false, "Trainee Pokémon", Type.BUG, Type.GROUND, 0.5, 5.5, Abilities.COMPOUND_EYES, Abilities.NONE, Abilities.RUN_AWAY, 266, 31, 45, 90, 30, 30, 40, 255, 50, 53, GrowthRate.ERRATIC, 50, false),
    new PokemonSpecies(Species.NINJASK, 3, false, false, false, "Ninja Pokémon", Type.BUG, Type.FLYING, 0.8, 12, Abilities.SPEED_BOOST, Abilities.NONE, Abilities.INFILTRATOR, 456, 61, 90, 45, 50, 50, 160, 120, 50, 160, GrowthRate.ERRATIC, 50, false),
    new PokemonSpecies(Species.SHEDINJA, 3, false, false, false, "Shed Pokémon", Type.BUG, Type.GHOST, 0.8, 1.2, Abilities.WONDER_GUARD, Abilities.NONE, Abilities.NONE, 236, 1, 90, 45, 30, 30, 40, 45, 50, 83, GrowthRate.ERRATIC, null, false),
    new PokemonSpecies(Species.WHISMUR, 3, false, false, false, "Whisper Pokémon", Type.NORMAL, null, 0.6, 16.3, Abilities.SOUNDPROOF, Abilities.NONE, Abilities.RATTLED, 240, 64, 51, 23, 51, 23, 28, 190, 50, 48, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.LOUDRED, 3, false, false, false, "Big Voice Pokémon", Type.NORMAL, null, 1, 40.5, Abilities.SOUNDPROOF, Abilities.NONE, Abilities.SCRAPPY, 360, 84, 71, 43, 71, 43, 48, 120, 50, 126, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.EXPLOUD, 3, false, false, false, "Loud Noise Pokémon", Type.NORMAL, null, 1.5, 84, Abilities.SOUNDPROOF, Abilities.NONE, Abilities.SCRAPPY, 490, 104, 91, 63, 91, 73, 68, 45, 50, 245, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.MAKUHITA, 3, false, false, false, "Guts Pokémon", Type.FIGHTING, null, 1, 86.4, Abilities.THICK_FAT, Abilities.GUTS, Abilities.SHEER_FORCE, 237, 72, 60, 30, 20, 30, 25, 180, 70, 47, GrowthRate.FLUCTUATING, 75, false),
    new PokemonSpecies(Species.HARIYAMA, 3, false, false, false, "Arm Thrust Pokémon", Type.FIGHTING, null, 2.3, 253.8, Abilities.THICK_FAT, Abilities.GUTS, Abilities.SHEER_FORCE, 474, 144, 120, 60, 40, 60, 50, 200, 70, 166, GrowthRate.FLUCTUATING, 75, false),
    new PokemonSpecies(Species.AZURILL, 3, false, false, false, "Polka Dot Pokémon", Type.NORMAL, Type.FAIRY, 0.2, 2, Abilities.THICK_FAT, Abilities.HUGE_POWER, Abilities.SAP_SIPPER, 190, 50, 20, 40, 20, 40, 20, 150, 50, 38, GrowthRate.FAST, 25, false),
    new PokemonSpecies(Species.NOSEPASS, 3, false, false, false, "Compass Pokémon", Type.ROCK, null, 1, 97, Abilities.STURDY, Abilities.MAGNET_PULL, Abilities.SAND_FORCE, 375, 30, 45, 135, 45, 90, 30, 255, 70, 75, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.SKITTY, 3, false, false, false, "Kitten Pokémon", Type.NORMAL, null, 0.6, 11, Abilities.CUTE_CHARM, Abilities.NORMALIZE, Abilities.WONDER_SKIN, 260, 50, 45, 45, 35, 35, 50, 255, 70, 52, GrowthRate.FAST, 25, false),
    new PokemonSpecies(Species.DELCATTY, 3, false, false, false, "Prim Pokémon", Type.NORMAL, null, 1.1, 32.6, Abilities.CUTE_CHARM, Abilities.NORMALIZE, Abilities.WONDER_SKIN, 400, 70, 65, 65, 55, 55, 90, 60, 70, 140, GrowthRate.FAST, 25, false),
    new PokemonSpecies(Species.SABLEYE, 3, false, false, false, "Darkness Pokémon", Type.DARK, Type.GHOST, 0.5, 11, Abilities.KEEN_EYE, Abilities.STALL, Abilities.PRANKSTER, 380, 50, 75, 75, 65, 65, 50, 45, 35, 133, GrowthRate.MEDIUM_SLOW, 50, false, true,
      new PokemonForm("Normal", "", Type.DARK, Type.GHOST, 0.5, 11, Abilities.KEEN_EYE, Abilities.STALL, Abilities.PRANKSTER, 380, 50, 75, 75, 65, 65, 50, 45, 35, 133),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.DARK, Type.GHOST, 0.5, 161, Abilities.MAGIC_BOUNCE, Abilities.MAGIC_BOUNCE, Abilities.MAGIC_BOUNCE, 480, 50, 85, 125, 85, 115, 20, 45, 35, 133),
    ),
    new PokemonSpecies(Species.MAWILE, 3, false, false, false, "Deceiver Pokémon", Type.STEEL, Type.FAIRY, 0.6, 11.5, Abilities.HYPER_CUTTER, Abilities.INTIMIDATE, Abilities.SHEER_FORCE, 380, 50, 85, 85, 55, 55, 50, 45, 50, 133, GrowthRate.FAST, 50, false, true,
      new PokemonForm("Normal", "", Type.STEEL, Type.FAIRY, 0.6, 11.5, Abilities.HYPER_CUTTER, Abilities.INTIMIDATE, Abilities.SHEER_FORCE, 380, 50, 85, 85, 55, 55, 50, 45, 50, 133),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.STEEL, Type.FAIRY, 1, 23.5, Abilities.HUGE_POWER, Abilities.HUGE_POWER, Abilities.HUGE_POWER, 480, 50, 105, 125, 55, 95, 50, 45, 50, 133),
    ),
    new PokemonSpecies(Species.ARON, 3, false, false, false, "Iron Armor Pokémon", Type.STEEL, Type.ROCK, 0.4, 60, Abilities.STURDY, Abilities.ROCK_HEAD, Abilities.HEAVY_METAL, 330, 50, 70, 100, 40, 40, 30, 180, 35, 66, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.LAIRON, 3, false, false, false, "Iron Armor Pokémon", Type.STEEL, Type.ROCK, 0.9, 120, Abilities.STURDY, Abilities.ROCK_HEAD, Abilities.HEAVY_METAL, 430, 60, 90, 140, 50, 50, 40, 90, 35, 151, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.AGGRON, 3, false, false, false, "Iron Armor Pokémon", Type.STEEL, Type.ROCK, 2.1, 360, Abilities.STURDY, Abilities.ROCK_HEAD, Abilities.HEAVY_METAL, 530, 70, 110, 180, 60, 60, 50, 45, 35, 265, GrowthRate.SLOW, 50, false, true,
      new PokemonForm("Normal", "", Type.STEEL, Type.ROCK, 2.1, 360, Abilities.STURDY, Abilities.ROCK_HEAD, Abilities.HEAVY_METAL, 530, 70, 110, 180, 60, 60, 50, 45, 35, 265),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.STEEL, null, 2.2, 395, Abilities.FILTER, Abilities.FILTER, Abilities.FILTER, 630, 70, 140, 230, 60, 80, 50, 45, 35, 265),
    ),
    new PokemonSpecies(Species.MEDITITE, 3, false, false, false, "Meditate Pokémon", Type.FIGHTING, Type.PSYCHIC, 0.6, 11.2, Abilities.PURE_POWER, Abilities.NONE, Abilities.TELEPATHY, 280, 30, 40, 55, 40, 55, 60, 180, 70, 56, GrowthRate.MEDIUM_FAST, 50, true),
    new PokemonSpecies(Species.MEDICHAM, 3, false, false, false, "Meditate Pokémon", Type.FIGHTING, Type.PSYCHIC, 1.3, 31.5, Abilities.PURE_POWER, Abilities.NONE, Abilities.TELEPATHY, 410, 60, 60, 75, 60, 75, 80, 90, 70, 144, GrowthRate.MEDIUM_FAST, 50, true, true,
      new PokemonForm("Normal", "", Type.FIGHTING, Type.PSYCHIC, 1.3, 31.5, Abilities.PURE_POWER, Abilities.NONE, Abilities.TELEPATHY, 410, 60, 60, 75, 60, 75, 80, 90, 70, 144, true),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.FIGHTING, Type.PSYCHIC, 1.3, 31.5, Abilities.PURE_POWER, Abilities.NONE, Abilities.PURE_POWER, 510, 60, 100, 85, 80, 85, 100, 90, 70, 144, true),
    ),
    new PokemonSpecies(Species.ELECTRIKE, 3, false, false, false, "Lightning Pokémon", Type.ELECTRIC, null, 0.6, 15.2, Abilities.STATIC, Abilities.LIGHTNING_ROD, Abilities.MINUS, 295, 40, 45, 40, 65, 40, 65, 120, 50, 59, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.MANECTRIC, 3, false, false, false, "Discharge Pokémon", Type.ELECTRIC, null, 1.5, 40.2, Abilities.STATIC, Abilities.LIGHTNING_ROD, Abilities.MINUS, 475, 70, 75, 60, 105, 60, 105, 45, 50, 166, GrowthRate.SLOW, 50, false, true,
      new PokemonForm("Normal", "", Type.ELECTRIC, null, 1.5, 40.2, Abilities.STATIC, Abilities.LIGHTNING_ROD, Abilities.MINUS, 475, 70, 75, 60, 105, 60, 105, 45, 50, 166),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.ELECTRIC, null, 1.8, 44, Abilities.INTIMIDATE, Abilities.INTIMIDATE, Abilities.INTIMIDATE, 575, 70, 75, 80, 135, 80, 135, 45, 50, 166),
    ),
    new PokemonSpecies(Species.PLUSLE, 3, false, false, false, "Cheering Pokémon", Type.ELECTRIC, null, 0.4, 4.2, Abilities.PLUS, Abilities.NONE, Abilities.LIGHTNING_ROD, 405, 60, 50, 40, 85, 75, 95, 200, 70, 142, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.MINUN, 3, false, false, false, "Cheering Pokémon", Type.ELECTRIC, null, 0.4, 4.2, Abilities.MINUS, Abilities.NONE, Abilities.VOLT_ABSORB, 405, 60, 40, 50, 75, 85, 95, 200, 70, 142, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.VOLBEAT, 3, false, false, false, "Firefly Pokémon", Type.BUG, null, 0.7, 17.7, Abilities.ILLUMINATE, Abilities.SWARM, Abilities.PRANKSTER, 430, 65, 73, 75, 47, 85, 85, 150, 70, 151, GrowthRate.ERRATIC, 100, false),
    new PokemonSpecies(Species.ILLUMISE, 3, false, false, false, "Firefly Pokémon", Type.BUG, null, 0.6, 17.7, Abilities.OBLIVIOUS, Abilities.TINTED_LENS, Abilities.PRANKSTER, 430, 65, 47, 75, 73, 85, 85, 150, 70, 151, GrowthRate.FLUCTUATING, 0, false),
    new PokemonSpecies(Species.ROSELIA, 3, false, false, false, "Thorn Pokémon", Type.GRASS, Type.POISON, 0.3, 2, Abilities.NATURAL_CURE, Abilities.POISON_POINT, Abilities.LEAF_GUARD, 400, 50, 60, 45, 100, 80, 65, 150, 50, 140, GrowthRate.MEDIUM_SLOW, 50, true),
    new PokemonSpecies(Species.GULPIN, 3, false, false, false, "Stomach Pokémon", Type.POISON, null, 0.4, 10.3, Abilities.LIQUID_OOZE, Abilities.STICKY_HOLD, Abilities.GLUTTONY, 302, 70, 43, 53, 43, 53, 40, 225, 70, 60, GrowthRate.FLUCTUATING, 50, true),
    new PokemonSpecies(Species.SWALOT, 3, false, false, false, "Poison Bag Pokémon", Type.POISON, null, 1.7, 80, Abilities.LIQUID_OOZE, Abilities.STICKY_HOLD, Abilities.GLUTTONY, 467, 100, 73, 83, 73, 83, 55, 75, 70, 163, GrowthRate.FLUCTUATING, 50, true),
    new PokemonSpecies(Species.CARVANHA, 3, false, false, false, "Savage Pokémon", Type.WATER, Type.DARK, 0.8, 20.8, Abilities.ROUGH_SKIN, Abilities.NONE, Abilities.SPEED_BOOST, 305, 45, 90, 20, 65, 20, 65, 225, 35, 61, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.SHARPEDO, 3, false, false, false, "Brutal Pokémon", Type.WATER, Type.DARK, 1.8, 88.8, Abilities.ROUGH_SKIN, Abilities.NONE, Abilities.SPEED_BOOST, 460, 70, 120, 40, 95, 40, 95, 60, 35, 161, GrowthRate.SLOW, 50, false, true,
      new PokemonForm("Normal", "", Type.WATER, Type.DARK, 1.8, 88.8, Abilities.ROUGH_SKIN, Abilities.NONE, Abilities.SPEED_BOOST, 460, 70, 120, 40, 95, 40, 95, 60, 35, 161),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.WATER, Type.DARK, 2.5, 130.3, Abilities.STRONG_JAW, Abilities.NONE, Abilities.STRONG_JAW, 560, 70, 140, 70, 110, 65, 105, 60, 35, 161),
    ),
    new PokemonSpecies(Species.WAILMER, 3, false, false, false, "Ball Whale Pokémon", Type.WATER, null, 2, 130, Abilities.WATER_VEIL, Abilities.OBLIVIOUS, Abilities.PRESSURE, 400, 130, 70, 35, 70, 35, 60, 125, 50, 80, GrowthRate.FLUCTUATING, 50, false),
    new PokemonSpecies(Species.WAILORD, 3, false, false, false, "Float Whale Pokémon", Type.WATER, null, 14.5, 398, Abilities.WATER_VEIL, Abilities.OBLIVIOUS, Abilities.PRESSURE, 500, 170, 90, 45, 90, 45, 60, 60, 50, 175, GrowthRate.FLUCTUATING, 50, false),
    new PokemonSpecies(Species.NUMEL, 3, false, false, false, "Numb Pokémon", Type.FIRE, Type.GROUND, 0.7, 24, Abilities.OBLIVIOUS, Abilities.SIMPLE, Abilities.OWN_TEMPO, 305, 60, 60, 40, 65, 45, 35, 255, 70, 61, GrowthRate.MEDIUM_FAST, 50, true),
    new PokemonSpecies(Species.CAMERUPT, 3, false, false, false, "Eruption Pokémon", Type.FIRE, Type.GROUND, 1.9, 220, Abilities.MAGMA_ARMOR, Abilities.SOLID_ROCK, Abilities.ANGER_POINT, 460, 70, 100, 70, 105, 75, 40, 150, 70, 161, GrowthRate.MEDIUM_FAST, 50, true, true,
      new PokemonForm("Normal", "", Type.FIRE, Type.GROUND, 1.9, 220, Abilities.MAGMA_ARMOR, Abilities.SOLID_ROCK, Abilities.ANGER_POINT, 460, 70, 100, 70, 105, 75, 40, 150, 70, 161, true),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.FIRE, Type.GROUND, 2.5, 320.5, Abilities.SHEER_FORCE, Abilities.SHEER_FORCE, Abilities.SHEER_FORCE, 560, 70, 120, 100, 145, 105, 20, 150, 70, 161),
    ),
    new PokemonSpecies(Species.TORKOAL, 3, false, false, false, "Coal Pokémon", Type.FIRE, null, 0.5, 80.4, Abilities.WHITE_SMOKE, Abilities.DROUGHT, Abilities.SHELL_ARMOR, 470, 70, 85, 140, 85, 70, 20, 90, 50, 165, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.SPOINK, 3, false, false, false, "Bounce Pokémon", Type.PSYCHIC, null, 0.7, 30.6, Abilities.THICK_FAT, Abilities.OWN_TEMPO, Abilities.GLUTTONY, 330, 60, 25, 35, 70, 80, 60, 255, 70, 66, GrowthRate.FAST, 50, false),
    new PokemonSpecies(Species.GRUMPIG, 3, false, false, false, "Manipulate Pokémon", Type.PSYCHIC, null, 0.9, 71.5, Abilities.THICK_FAT, Abilities.OWN_TEMPO, Abilities.GLUTTONY, 470, 80, 45, 65, 90, 110, 80, 60, 70, 165, GrowthRate.FAST, 50, false),
    new PokemonSpecies(Species.SPINDA, 3, false, false, false, "Spot Panda Pokémon", Type.NORMAL, null, 1.1, 5, Abilities.OWN_TEMPO, Abilities.TANGLED_FEET, Abilities.CONTRARY, 360, 60, 60, 60, 60, 60, 60, 255, 70, 126, GrowthRate.FAST, 50, false),
    new PokemonSpecies(Species.TRAPINCH, 3, false, false, false, "Ant Pit Pokémon", Type.GROUND, null, 0.7, 15, Abilities.HYPER_CUTTER, Abilities.ARENA_TRAP, Abilities.SHEER_FORCE, 290, 45, 100, 45, 45, 45, 10, 255, 50, 58, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.VIBRAVA, 3, false, false, false, "Vibration Pokémon", Type.GROUND, Type.DRAGON, 1.1, 15.3, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 340, 50, 70, 50, 50, 50, 70, 120, 50, 119, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.FLYGON, 3, false, false, false, "Mystic Pokémon", Type.GROUND, Type.DRAGON, 2, 82, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 520, 80, 100, 80, 80, 80, 100, 45, 50, 260, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.CACNEA, 3, false, false, false, "Cactus Pokémon", Type.GRASS, null, 0.4, 51.3, Abilities.SAND_VEIL, Abilities.NONE, Abilities.WATER_ABSORB, 335, 50, 85, 40, 85, 40, 35, 190, 35, 67, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.CACTURNE, 3, false, false, false, "Scarecrow Pokémon", Type.GRASS, Type.DARK, 1.3, 77.4, Abilities.SAND_VEIL, Abilities.NONE, Abilities.WATER_ABSORB, 475, 70, 115, 60, 115, 60, 55, 60, 35, 166, GrowthRate.MEDIUM_SLOW, 50, true),
    new PokemonSpecies(Species.SWABLU, 3, false, false, false, "Cotton Bird Pokémon", Type.NORMAL, Type.FLYING, 0.4, 1.2, Abilities.NATURAL_CURE, Abilities.NONE, Abilities.CLOUD_NINE, 310, 45, 40, 60, 40, 75, 50, 255, 50, 62, GrowthRate.ERRATIC, 50, false),
    new PokemonSpecies(Species.ALTARIA, 3, false, false, false, "Humming Pokémon", Type.DRAGON, Type.FLYING, 1.1, 20.6, Abilities.NATURAL_CURE, Abilities.NONE, Abilities.CLOUD_NINE, 490, 75, 70, 90, 70, 105, 80, 45, 50, 172, GrowthRate.ERRATIC, 50, false, true,
      new PokemonForm("Normal", "", Type.DRAGON, Type.FLYING, 1.1, 20.6, Abilities.NATURAL_CURE, Abilities.NONE, Abilities.CLOUD_NINE, 490, 75, 70, 90, 70, 105, 80, 45, 50, 172),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.DRAGON, Type.FAIRY, 1.5, 20.6, Abilities.PIXILATE, Abilities.NONE, Abilities.PIXILATE, 590, 75, 110, 110, 110, 105, 80, 45, 50, 172),
    ),
    new PokemonSpecies(Species.ZANGOOSE, 3, false, false, false, "Cat Ferret Pokémon", Type.NORMAL, null, 1.3, 40.3, Abilities.IMMUNITY, Abilities.NONE, Abilities.TOXIC_BOOST, 458, 73, 115, 60, 60, 60, 90, 90, 70, 160, GrowthRate.ERRATIC, 50, false),
    new PokemonSpecies(Species.SEVIPER, 3, false, false, false, "Fang Snake Pokémon", Type.POISON, null, 2.7, 52.5, Abilities.SHED_SKIN, Abilities.NONE, Abilities.INFILTRATOR, 458, 73, 100, 60, 100, 60, 65, 90, 70, 160, GrowthRate.FLUCTUATING, 50, false),
    new PokemonSpecies(Species.LUNATONE, 3, false, false, false, "Meteorite Pokémon", Type.ROCK, Type.PSYCHIC, 1, 168, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 460, 90, 55, 65, 95, 85, 70, 45, 50, 161, GrowthRate.FAST, null, false),
    new PokemonSpecies(Species.SOLROCK, 3, false, false, false, "Meteorite Pokémon", Type.ROCK, Type.PSYCHIC, 1.2, 154, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 460, 90, 95, 85, 55, 65, 70, 45, 50, 161, GrowthRate.FAST, null, false),
    new PokemonSpecies(Species.BARBOACH, 3, false, false, false, "Whiskers Pokémon", Type.WATER, Type.GROUND, 0.4, 1.9, Abilities.OBLIVIOUS, Abilities.ANTICIPATION, Abilities.HYDRATION, 288, 50, 48, 43, 46, 41, 60, 190, 50, 58, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.WHISCASH, 3, false, false, false, "Whiskers Pokémon", Type.WATER, Type.GROUND, 0.9, 23.6, Abilities.OBLIVIOUS, Abilities.ANTICIPATION, Abilities.HYDRATION, 468, 110, 78, 73, 76, 71, 60, 75, 50, 164, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.CORPHISH, 3, false, false, false, "Ruffian Pokémon", Type.WATER, null, 0.6, 11.5, Abilities.HYPER_CUTTER, Abilities.SHELL_ARMOR, Abilities.ADAPTABILITY, 308, 43, 80, 65, 50, 35, 35, 205, 50, 62, GrowthRate.FLUCTUATING, 50, false),
    new PokemonSpecies(Species.CRAWDAUNT, 3, false, false, false, "Rogue Pokémon", Type.WATER, Type.DARK, 1.1, 32.8, Abilities.HYPER_CUTTER, Abilities.SHELL_ARMOR, Abilities.ADAPTABILITY, 468, 63, 120, 85, 90, 55, 55, 155, 50, 164, GrowthRate.FLUCTUATING, 50, false),
    new PokemonSpecies(Species.BALTOY, 3, false, false, false, "Clay Doll Pokémon", Type.GROUND, Type.PSYCHIC, 0.5, 21.5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 300, 40, 40, 55, 40, 70, 55, 255, 50, 60, GrowthRate.MEDIUM_FAST, null, false),
    new PokemonSpecies(Species.CLAYDOL, 3, false, false, false, "Clay Doll Pokémon", Type.GROUND, Type.PSYCHIC, 1.5, 108, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 500, 60, 70, 105, 70, 120, 75, 90, 50, 175, GrowthRate.MEDIUM_FAST, null, false),
    new PokemonSpecies(Species.LILEEP, 3, false, false, false, "Sea Lily Pokémon", Type.ROCK, Type.GRASS, 1, 23.8, Abilities.SUCTION_CUPS, Abilities.NONE, Abilities.STORM_DRAIN, 355, 66, 41, 77, 61, 87, 23, 45, 50, 71, GrowthRate.ERRATIC, 87.5, false),
    new PokemonSpecies(Species.CRADILY, 3, false, false, false, "Barnacle Pokémon", Type.ROCK, Type.GRASS, 1.5, 60.4, Abilities.SUCTION_CUPS, Abilities.NONE, Abilities.STORM_DRAIN, 495, 86, 81, 97, 81, 107, 43, 45, 50, 173, GrowthRate.ERRATIC, 87.5, false),
    new PokemonSpecies(Species.ANORITH, 3, false, false, false, "Old Shrimp Pokémon", Type.ROCK, Type.BUG, 0.7, 12.5, Abilities.BATTLE_ARMOR, Abilities.NONE, Abilities.SWIFT_SWIM, 355, 45, 95, 50, 40, 50, 75, 45, 50, 71, GrowthRate.ERRATIC, 87.5, false),
    new PokemonSpecies(Species.ARMALDO, 3, false, false, false, "Plate Pokémon", Type.ROCK, Type.BUG, 1.5, 68.2, Abilities.BATTLE_ARMOR, Abilities.NONE, Abilities.SWIFT_SWIM, 495, 75, 125, 100, 70, 80, 45, 45, 50, 173, GrowthRate.ERRATIC, 87.5, false),
    new PokemonSpecies(Species.FEEBAS, 3, false, false, false, "Fish Pokémon", Type.WATER, null, 0.6, 7.4, Abilities.SWIFT_SWIM, Abilities.OBLIVIOUS, Abilities.ADAPTABILITY, 200, 20, 15, 20, 10, 55, 80, 255, 50, 40, GrowthRate.ERRATIC, 50, false),
    new PokemonSpecies(Species.MILOTIC, 3, false, false, false, "Tender Pokémon", Type.WATER, null, 6.2, 162, Abilities.MARVEL_SCALE, Abilities.COMPETITIVE, Abilities.CUTE_CHARM, 540, 95, 60, 79, 100, 125, 81, 60, 50, 189, GrowthRate.ERRATIC, 50, true),
    new PokemonSpecies(Species.CASTFORM, 3, false, false, false, "Weather Pokémon", Type.NORMAL, null, 0.3, 0.8, Abilities.FORECAST, Abilities.NONE, Abilities.NONE, 420, 70, 70, 70, 70, 70, 70, 45, 70, 147, GrowthRate.MEDIUM_FAST, 50, false, true,
      new PokemonForm("Normal Form", "", Type.NORMAL, null, 0.3, 0.8, Abilities.FORECAST, Abilities.NONE, Abilities.NONE, 420, 70, 70, 70, 70, 70, 70, 45, 70, 147),
      new PokemonForm("Sunny Form", "sunny", Type.FIRE, null, 0.3, 0.8, Abilities.FORECAST, Abilities.NONE, Abilities.NONE, 420, 70, 70, 70, 70, 70, 70, 45, 70, 147),
      new PokemonForm("Rainy Form", "rainy", Type.WATER, null, 0.3, 0.8, Abilities.FORECAST, Abilities.NONE, Abilities.NONE, 420, 70, 70, 70, 70, 70, 70, 45, 70, 147),
      new PokemonForm("Snowy Form", "snowy", Type.ICE, null, 0.3, 0.8, Abilities.FORECAST, Abilities.NONE, Abilities.NONE, 420, 70, 70, 70, 70, 70, 70, 45, 70, 147),
    ),
    new PokemonSpecies(Species.KECLEON, 3, false, false, false, "Color Swap Pokémon", Type.NORMAL, null, 1, 22, Abilities.COLOR_CHANGE, Abilities.NONE, Abilities.PROTEAN, 440, 60, 90, 70, 60, 120, 40, 200, 70, 154, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.SHUPPET, 3, false, false, false, "Puppet Pokémon", Type.GHOST, null, 0.6, 2.3, Abilities.INSOMNIA, Abilities.FRISK, Abilities.CURSED_BODY, 295, 44, 75, 35, 63, 33, 45, 225, 35, 59, GrowthRate.FAST, 50, false),
    new PokemonSpecies(Species.BANETTE, 3, false, false, false, "Marionette Pokémon", Type.GHOST, null, 1.1, 12.5, Abilities.INSOMNIA, Abilities.FRISK, Abilities.CURSED_BODY, 455, 64, 115, 65, 83, 63, 65, 45, 35, 159, GrowthRate.FAST, 50, false, true,
      new PokemonForm("Normal", "", Type.GHOST, null, 1.1, 12.5, Abilities.INSOMNIA, Abilities.FRISK, Abilities.CURSED_BODY, 455, 64, 115, 65, 83, 63, 65, 45, 35, 159),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.GHOST, null, 1.2, 13, Abilities.PRANKSTER, Abilities.PRANKSTER, Abilities.PRANKSTER, 555, 64, 165, 75, 93, 83, 75, 45, 35, 159),
    ),
    new PokemonSpecies(Species.DUSKULL, 3, false, false, false, "Requiem Pokémon", Type.GHOST, null, 0.8, 15, Abilities.LEVITATE, Abilities.NONE, Abilities.FRISK, 295, 20, 40, 90, 30, 90, 25, 190, 35, 59, GrowthRate.FAST, 50, false),
    new PokemonSpecies(Species.DUSCLOPS, 3, false, false, false, "Beckon Pokémon", Type.GHOST, null, 1.6, 30.6, Abilities.PRESSURE, Abilities.NONE, Abilities.FRISK, 455, 40, 70, 130, 60, 130, 25, 90, 35, 159, GrowthRate.FAST, 50, false),
    new PokemonSpecies(Species.TROPIUS, 3, false, false, false, "Fruit Pokémon", Type.GRASS, Type.FLYING, 2, 100, Abilities.CHLOROPHYLL, Abilities.SOLAR_POWER, Abilities.HARVEST, 460, 99, 68, 83, 72, 87, 51, 200, 70, 161, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.CHIMECHO, 3, false, false, false, "Wind Chime Pokémon", Type.PSYCHIC, null, 0.6, 1, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 455, 75, 50, 80, 95, 90, 65, 45, 70, 159, GrowthRate.FAST, 50, false),
    new PokemonSpecies(Species.ABSOL, 3, false, false, false, "Disaster Pokémon", Type.DARK, null, 1.2, 47, Abilities.PRESSURE, Abilities.SUPER_LUCK, Abilities.JUSTIFIED, 465, 65, 130, 60, 75, 60, 75, 30, 35, 163, GrowthRate.MEDIUM_SLOW, 50, false, true,
      new PokemonForm("Normal", "", Type.DARK, null, 1.2, 47, Abilities.PRESSURE, Abilities.SUPER_LUCK, Abilities.JUSTIFIED, 465, 65, 130, 60, 75, 60, 75, 30, 35, 163),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.DARK, null, 1.2, 49, Abilities.MAGIC_BOUNCE, Abilities.MAGIC_BOUNCE, Abilities.MAGIC_BOUNCE, 565, 65, 150, 60, 115, 60, 115, 30, 35, 163),
    ),
    new PokemonSpecies(Species.WYNAUT, 3, false, false, false, "Bright Pokémon", Type.PSYCHIC, null, 0.6, 14, Abilities.SHADOW_TAG, Abilities.NONE, Abilities.TELEPATHY, 260, 95, 23, 48, 23, 48, 23, 125, 50, 52, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.SNORUNT, 3, false, false, false, "Snow Hat Pokémon", Type.ICE, null, 0.7, 16.8, Abilities.INNER_FOCUS, Abilities.ICE_BODY, Abilities.MOODY, 300, 50, 50, 50, 50, 50, 50, 190, 50, 60, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.GLALIE, 3, false, false, false, "Face Pokémon", Type.ICE, null, 1.5, 256.5, Abilities.INNER_FOCUS, Abilities.ICE_BODY, Abilities.MOODY, 480, 80, 80, 80, 80, 80, 80, 75, 50, 168, GrowthRate.MEDIUM_FAST, 50, false, true,
      new PokemonForm("Normal", "", Type.ICE, null, 1.5, 256.5, Abilities.INNER_FOCUS, Abilities.ICE_BODY, Abilities.MOODY, 480, 80, 80, 80, 80, 80, 80, 75, 50, 168),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.ICE, null, 2.1, 350.2, Abilities.REFRIGERATE, Abilities.REFRIGERATE, Abilities.REFRIGERATE, 580, 80, 120, 80, 120, 80, 100, 75, 50, 168),
    ),
    new PokemonSpecies(Species.SPHEAL, 3, false, false, false, "Clap Pokémon", Type.ICE, Type.WATER, 0.8, 39.5, Abilities.THICK_FAT, Abilities.ICE_BODY, Abilities.OBLIVIOUS, 290, 70, 40, 50, 55, 50, 25, 255, 50, 58, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.SEALEO, 3, false, false, false, "Ball Roll Pokémon", Type.ICE, Type.WATER, 1.1, 87.6, Abilities.THICK_FAT, Abilities.ICE_BODY, Abilities.OBLIVIOUS, 410, 90, 60, 70, 75, 70, 45, 120, 50, 144, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.WALREIN, 3, false, false, false, "Ice Break Pokémon", Type.ICE, Type.WATER, 1.4, 150.6, Abilities.THICK_FAT, Abilities.ICE_BODY, Abilities.OBLIVIOUS, 530, 110, 80, 90, 95, 90, 65, 45, 50, 265, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.CLAMPERL, 3, false, false, false, "Bivalve Pokémon", Type.WATER, null, 0.4, 52.5, Abilities.SHELL_ARMOR, Abilities.NONE, Abilities.RATTLED, 345, 35, 64, 85, 74, 55, 32, 255, 70, 69, GrowthRate.ERRATIC, 50, false),
    new PokemonSpecies(Species.HUNTAIL, 3, false, false, false, "Deep Sea Pokémon", Type.WATER, null, 1.7, 27, Abilities.SWIFT_SWIM, Abilities.NONE, Abilities.WATER_VEIL, 485, 55, 104, 105, 94, 75, 52, 60, 70, 170, GrowthRate.ERRATIC, 50, false),
    new PokemonSpecies(Species.GOREBYSS, 3, false, false, false, "South Sea Pokémon", Type.WATER, null, 1.8, 22.6, Abilities.SWIFT_SWIM, Abilities.NONE, Abilities.HYDRATION, 485, 55, 84, 105, 114, 75, 52, 60, 70, 170, GrowthRate.ERRATIC, 50, false),
    new PokemonSpecies(Species.RELICANTH, 3, false, false, false, "Longevity Pokémon", Type.WATER, Type.ROCK, 1, 23.4, Abilities.SWIFT_SWIM, Abilities.ROCK_HEAD, Abilities.STURDY, 485, 100, 90, 130, 45, 65, 55, 25, 50, 170, GrowthRate.SLOW, 87.5, true),
    new PokemonSpecies(Species.LUVDISC, 3, false, false, false, "Rendezvous Pokémon", Type.WATER, null, 0.6, 8.7, Abilities.SWIFT_SWIM, Abilities.NONE, Abilities.HYDRATION, 330, 43, 30, 55, 40, 65, 97, 225, 70, 116, GrowthRate.FAST, 25, false),
    new PokemonSpecies(Species.BAGON, 3, false, false, false, "Rock Head Pokémon", Type.DRAGON, null, 0.6, 42.1, Abilities.ROCK_HEAD, Abilities.NONE, Abilities.SHEER_FORCE, 300, 45, 75, 60, 40, 30, 50, 45, 35, 60, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.SHELGON, 3, false, false, false, "Endurance Pokémon", Type.DRAGON, null, 1.1, 110.5, Abilities.ROCK_HEAD, Abilities.NONE, Abilities.OVERCOAT, 420, 65, 95, 100, 60, 50, 50, 45, 35, 147, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.SALAMENCE, 3, false, false, false, "Dragon Pokémon", Type.DRAGON, Type.FLYING, 1.5, 102.6, Abilities.INTIMIDATE, Abilities.NONE, Abilities.MOXIE, 600, 95, 135, 80, 110, 80, 100, 45, 35, 300, GrowthRate.SLOW, 50, false, true,
      new PokemonForm("Normal", "", Type.DRAGON, Type.FLYING, 1.5, 102.6, Abilities.INTIMIDATE, Abilities.NONE, Abilities.MOXIE, 600, 95, 135, 80, 110, 80, 100, 45, 35, 300),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.DRAGON, Type.FLYING, 1.8, 112.6, Abilities.AERILATE, Abilities.NONE, Abilities.AERILATE, 700, 95, 145, 130, 120, 90, 120, 45, 35, 300),
    ),
    new PokemonSpecies(Species.BELDUM, 3, false, false, false, "Iron Ball Pokémon", Type.STEEL, Type.PSYCHIC, 0.6, 95.2, Abilities.CLEAR_BODY, Abilities.NONE, Abilities.LIGHT_METAL, 300, 40, 55, 80, 35, 60, 30, 3, 35, 60, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.METANG, 3, false, false, false, "Iron Claw Pokémon", Type.STEEL, Type.PSYCHIC, 1.2, 202.5, Abilities.CLEAR_BODY, Abilities.NONE, Abilities.LIGHT_METAL, 420, 60, 75, 100, 55, 80, 50, 3, 35, 147, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.METAGROSS, 3, false, false, false, "Iron Leg Pokémon", Type.STEEL, Type.PSYCHIC, 1.6, 550, Abilities.CLEAR_BODY, Abilities.NONE, Abilities.LIGHT_METAL, 600, 80, 135, 130, 95, 90, 70, 3, 35, 300, GrowthRate.SLOW, null, false, true,
      new PokemonForm("Normal", "", Type.STEEL, Type.PSYCHIC, 1.6, 550, Abilities.CLEAR_BODY, Abilities.NONE, Abilities.LIGHT_METAL, 600, 80, 135, 130, 95, 90, 70, 3, 35, 300),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.STEEL, Type.PSYCHIC, 2.5, 942.9, Abilities.TOUGH_CLAWS, Abilities.NONE, Abilities.TOUGH_CLAWS, 700, 80, 145, 150, 105, 110, 110, 3, 35, 300),
    ),
    new PokemonSpecies(Species.REGIROCK, 3, true, false, false, "Rock Peak Pokémon", Type.ROCK, null, 1.7, 230, Abilities.CLEAR_BODY, Abilities.NONE, Abilities.STURDY, 580, 80, 100, 200, 50, 100, 50, 3, 35, 290, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.REGICE, 3, true, false, false, "Iceberg Pokémon", Type.ICE, null, 1.8, 175, Abilities.CLEAR_BODY, Abilities.NONE, Abilities.ICE_BODY, 580, 80, 50, 100, 100, 200, 50, 3, 35, 290, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.REGISTEEL, 3, true, false, false, "Iron Pokémon", Type.STEEL, null, 1.9, 205, Abilities.CLEAR_BODY, Abilities.NONE, Abilities.LIGHT_METAL, 580, 80, 75, 150, 75, 150, 50, 3, 35, 290, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.LATIAS, 3, true, false, false, "Eon Pokémon", Type.DRAGON, Type.PSYCHIC, 1.4, 40, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 600, 80, 80, 90, 110, 130, 110, 3, 90, 300, GrowthRate.SLOW, 0, false, true,
      new PokemonForm("Normal", "", Type.DRAGON, Type.PSYCHIC, 1.4, 40, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 600, 80, 80, 90, 110, 130, 110, 3, 90, 300),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.DRAGON, Type.PSYCHIC, 1.8, 52, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 700, 80, 100, 120, 140, 150, 110, 3, 90, 300),
    ),
    new PokemonSpecies(Species.LATIOS, 3, true, false, false, "Eon Pokémon", Type.DRAGON, Type.PSYCHIC, 2, 60, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 600, 80, 90, 80, 130, 110, 110, 3, 90, 300, GrowthRate.SLOW, 100, false, true,
      new PokemonForm("Normal", "", Type.DRAGON, Type.PSYCHIC, 2, 60, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 600, 80, 90, 80, 130, 110, 110, 3, 90, 300),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.DRAGON, Type.PSYCHIC, 2.3, 70, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 700, 80, 130, 100, 160, 120, 110, 3, 90, 300),
    ),
    new PokemonSpecies(Species.KYOGRE, 3, false, true, false, "Sea Basin Pokémon", Type.WATER, null, 4.5, 352, Abilities.DRIZZLE, Abilities.NONE, Abilities.NONE, 670, 100, 100, 90, 150, 140, 90, 3, 0, 335, GrowthRate.SLOW, null, false, true,
      new PokemonForm("Normal", "", Type.WATER, null, 4.5, 352, Abilities.DRIZZLE, Abilities.NONE, Abilities.NONE, 670, 100, 100, 90, 150, 140, 90, 3, 0, 335),
      new PokemonForm("Primal", "primal", Type.WATER, null, 9.8, 430, Abilities.PRIMORDIAL_SEA, Abilities.NONE, Abilities.NONE, 770, 100, 150, 90, 180, 160, 90, 3, 0, 335),
    ),
    new PokemonSpecies(Species.GROUDON, 3, false, true, false, "Continent Pokémon", Type.GROUND, null, 3.5, 950, Abilities.DROUGHT, Abilities.NONE, Abilities.NONE, 670, 100, 150, 140, 100, 90, 90, 3, 0, 335, GrowthRate.SLOW, null, false, true,
      new PokemonForm("Normal", "", Type.GROUND, null, 3.5, 950, Abilities.DROUGHT, Abilities.NONE, Abilities.NONE, 670, 100, 150, 140, 100, 90, 90, 3, 0, 335),
      new PokemonForm("Primal", "primal", Type.GROUND, Type.FIRE, 5, 999.7, Abilities.DESOLATE_LAND, Abilities.NONE, Abilities.NONE, 770, 100, 180, 160, 150, 90, 90, 3, 0, 335),
    ),
    new PokemonSpecies(Species.RAYQUAZA, 3, false, true, false, "Sky High Pokémon", Type.DRAGON, Type.FLYING, 7, 206.5, Abilities.AIR_LOCK, Abilities.NONE, Abilities.NONE, 680, 105, 150, 90, 150, 90, 95, 45, 0, 340, GrowthRate.SLOW, null, false, true,
      new PokemonForm("Normal", "", Type.DRAGON, Type.FLYING, 7, 206.5, Abilities.AIR_LOCK, Abilities.NONE, Abilities.NONE, 680, 105, 150, 90, 150, 90, 95, 45, 0, 340),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.DRAGON, Type.FLYING, 10.8, 392, Abilities.DELTA_STREAM, Abilities.NONE, Abilities.NONE, 780, 105, 180, 100, 180, 100, 115, 45, 0, 340),
    ),
    new PokemonSpecies(Species.JIRACHI, 3, false, false, true, "Wish Pokémon", Type.STEEL, Type.PSYCHIC, 0.3, 1.1, Abilities.SERENE_GRACE, Abilities.NONE, Abilities.NONE, 600, 100, 100, 100, 100, 100, 100, 3, 100, 300, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.DEOXYS, 3, false, false, true, "DNA Pokémon", Type.PSYCHIC, null, 1.7, 60.8, Abilities.PRESSURE, Abilities.NONE, Abilities.NONE, 600, 50, 150, 50, 150, 50, 150, 3, 0, 270, GrowthRate.SLOW, null, false, true,
      new PokemonForm("Normal Forme", "normal", Type.PSYCHIC, null, 1.7, 60.8, Abilities.PRESSURE, Abilities.NONE, Abilities.NONE, 600, 50, 150, 50, 150, 50, 150, 3, 0, 270, false, ""),
      new PokemonForm("Attack Forme", "attack", Type.PSYCHIC, null, 1.7, 60.8, Abilities.PRESSURE, Abilities.NONE, Abilities.NONE, 600, 50, 180, 20, 180, 20, 150, 3, 0, 270),
      new PokemonForm("Defense Forme", "defense", Type.PSYCHIC, null, 1.7, 60.8, Abilities.PRESSURE, Abilities.NONE, Abilities.NONE, 600, 50, 70, 160, 70, 160, 90, 3, 0, 270),
      new PokemonForm("Speed Forme", "speed", Type.PSYCHIC, null, 1.7, 60.8, Abilities.PRESSURE, Abilities.NONE, Abilities.NONE, 600, 50, 95, 90, 95, 90, 180, 3, 0, 270),
    ),
    new PokemonSpecies(Species.TURTWIG, 4, false, false, false, "Tiny Leaf Pokémon", Type.GRASS, null, 0.4, 10.2, Abilities.OVERGROW, Abilities.NONE, Abilities.SHELL_ARMOR, 318, 55, 68, 64, 45, 55, 31, 45, 70, 64, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.GROTLE, 4, false, false, false, "Grove Pokémon", Type.GRASS, null, 1.1, 97, Abilities.OVERGROW, Abilities.NONE, Abilities.SHELL_ARMOR, 405, 75, 89, 85, 55, 65, 36, 45, 70, 142, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.TORTERRA, 4, false, false, false, "Continent Pokémon", Type.GRASS, Type.GROUND, 2.2, 310, Abilities.OVERGROW, Abilities.NONE, Abilities.SHELL_ARMOR, 525, 95, 109, 105, 75, 85, 56, 45, 70, 236, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.CHIMCHAR, 4, false, false, false, "Chimp Pokémon", Type.FIRE, null, 0.5, 6.2, Abilities.BLAZE, Abilities.NONE, Abilities.IRON_FIST, 309, 44, 58, 44, 58, 44, 61, 45, 70, 62, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.MONFERNO, 4, false, false, false, "Playful Pokémon", Type.FIRE, Type.FIGHTING, 0.9, 22, Abilities.BLAZE, Abilities.NONE, Abilities.IRON_FIST, 405, 64, 78, 52, 78, 52, 81, 45, 70, 142, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.INFERNAPE, 4, false, false, false, "Flame Pokémon", Type.FIRE, Type.FIGHTING, 1.2, 55, Abilities.BLAZE, Abilities.NONE, Abilities.IRON_FIST, 534, 76, 104, 71, 104, 71, 108, 45, 70, 240, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.PIPLUP, 4, false, false, false, "Penguin Pokémon", Type.WATER, null, 0.4, 5.2, Abilities.TORRENT, Abilities.NONE, Abilities.COMPETITIVE, 314, 53, 51, 53, 61, 56, 40, 45, 70, 63, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.PRINPLUP, 4, false, false, false, "Penguin Pokémon", Type.WATER, null, 0.8, 23, Abilities.TORRENT, Abilities.NONE, Abilities.COMPETITIVE, 405, 64, 66, 68, 81, 76, 50, 45, 70, 142, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.EMPOLEON, 4, false, false, false, "Emperor Pokémon", Type.WATER, Type.STEEL, 1.7, 84.5, Abilities.TORRENT, Abilities.NONE, Abilities.COMPETITIVE, 530, 84, 86, 88, 111, 101, 60, 45, 70, 239, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.STARLY, 4, false, false, false, "Starling Pokémon", Type.NORMAL, Type.FLYING, 0.3, 2, Abilities.KEEN_EYE, Abilities.NONE, Abilities.RECKLESS, 245, 40, 55, 30, 30, 30, 60, 255, 70, 49, GrowthRate.MEDIUM_SLOW, 50, true),
    new PokemonSpecies(Species.STARAVIA, 4, false, false, false, "Starling Pokémon", Type.NORMAL, Type.FLYING, 0.6, 15.5, Abilities.INTIMIDATE, Abilities.NONE, Abilities.RECKLESS, 340, 55, 75, 50, 40, 40, 80, 120, 70, 119, GrowthRate.MEDIUM_SLOW, 50, true),
    new PokemonSpecies(Species.STARAPTOR, 4, false, false, false, "Predator Pokémon", Type.NORMAL, Type.FLYING, 1.2, 24.9, Abilities.INTIMIDATE, Abilities.NONE, Abilities.RECKLESS, 485, 85, 120, 70, 50, 60, 100, 45, 70, 218, GrowthRate.MEDIUM_SLOW, 50, true),
    new PokemonSpecies(Species.BIDOOF, 4, false, false, false, "Plump Mouse Pokémon", Type.NORMAL, null, 0.5, 20, Abilities.SIMPLE, Abilities.UNAWARE, Abilities.MOODY, 250, 59, 45, 40, 35, 40, 31, 255, 70, 50, GrowthRate.MEDIUM_FAST, 50, true),
    new PokemonSpecies(Species.BIBAREL, 4, false, false, false, "Beaver Pokémon", Type.NORMAL, Type.WATER, 1, 31.5, Abilities.SIMPLE, Abilities.UNAWARE, Abilities.MOODY, 410, 79, 85, 60, 55, 60, 71, 127, 70, 144, GrowthRate.MEDIUM_FAST, 50, true),
    new PokemonSpecies(Species.KRICKETOT, 4, false, false, false, "Cricket Pokémon", Type.BUG, null, 0.3, 2.2, Abilities.SHED_SKIN, Abilities.NONE, Abilities.RUN_AWAY, 194, 37, 25, 41, 25, 41, 25, 255, 70, 39, GrowthRate.MEDIUM_SLOW, 50, true),
    new PokemonSpecies(Species.KRICKETUNE, 4, false, false, false, "Cricket Pokémon", Type.BUG, null, 1, 25.5, Abilities.SWARM, Abilities.NONE, Abilities.TECHNICIAN, 384, 77, 85, 51, 55, 51, 65, 45, 70, 134, GrowthRate.MEDIUM_SLOW, 50, true),
    new PokemonSpecies(Species.SHINX, 4, false, false, false, "Flash Pokémon", Type.ELECTRIC, null, 0.5, 9.5, Abilities.RIVALRY, Abilities.INTIMIDATE, Abilities.GUTS, 263, 45, 65, 34, 40, 34, 45, 235, 50, 53, GrowthRate.MEDIUM_SLOW, 50, true),
    new PokemonSpecies(Species.LUXIO, 4, false, false, false, "Spark Pokémon", Type.ELECTRIC, null, 0.9, 30.5, Abilities.RIVALRY, Abilities.INTIMIDATE, Abilities.GUTS, 363, 60, 85, 49, 60, 49, 60, 120, 100, 127, GrowthRate.MEDIUM_SLOW, 50, true),
    new PokemonSpecies(Species.LUXRAY, 4, false, false, false, "Gleam Eyes Pokémon", Type.ELECTRIC, null, 1.4, 42, Abilities.RIVALRY, Abilities.INTIMIDATE, Abilities.GUTS, 523, 80, 120, 79, 95, 79, 70, 45, 50, 262, GrowthRate.MEDIUM_SLOW, 50, true),
    new PokemonSpecies(Species.BUDEW, 4, false, false, false, "Bud Pokémon", Type.GRASS, Type.POISON, 0.2, 1.2, Abilities.NATURAL_CURE, Abilities.POISON_POINT, Abilities.LEAF_GUARD, 280, 40, 30, 35, 50, 70, 55, 255, 50, 56, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.ROSERADE, 4, false, false, false, "Bouquet Pokémon", Type.GRASS, Type.POISON, 0.9, 14.5, Abilities.NATURAL_CURE, Abilities.POISON_POINT, Abilities.TECHNICIAN, 515, 60, 70, 65, 125, 105, 90, 75, 50, 258, GrowthRate.MEDIUM_SLOW, 50, true),
    new PokemonSpecies(Species.CRANIDOS, 4, false, false, false, "Head Butt Pokémon", Type.ROCK, null, 0.9, 31.5, Abilities.MOLD_BREAKER, Abilities.NONE, Abilities.SHEER_FORCE, 350, 67, 125, 40, 30, 30, 58, 45, 70, 70, GrowthRate.ERRATIC, 87.5, false),
    new PokemonSpecies(Species.RAMPARDOS, 4, false, false, false, "Head Butt Pokémon", Type.ROCK, null, 1.6, 102.5, Abilities.MOLD_BREAKER, Abilities.NONE, Abilities.SHEER_FORCE, 495, 97, 165, 60, 65, 50, 58, 45, 70, 173, GrowthRate.ERRATIC, 87.5, false),
    new PokemonSpecies(Species.SHIELDON, 4, false, false, false, "Shield Pokémon", Type.ROCK, Type.STEEL, 0.5, 57, Abilities.STURDY, Abilities.NONE, Abilities.SOUNDPROOF, 350, 30, 42, 118, 42, 88, 30, 45, 70, 70, GrowthRate.ERRATIC, 87.5, false),
    new PokemonSpecies(Species.BASTIODON, 4, false, false, false, "Shield Pokémon", Type.ROCK, Type.STEEL, 1.3, 149.5, Abilities.STURDY, Abilities.NONE, Abilities.SOUNDPROOF, 495, 60, 52, 168, 47, 138, 30, 45, 70, 173, GrowthRate.ERRATIC, 87.5, false),
    new PokemonSpecies(Species.BURMY, 4, false, false, false, "Bagworm Pokémon", Type.BUG, null, 0.2, 3.4, Abilities.SHED_SKIN, Abilities.NONE, Abilities.OVERCOAT, 224, 40, 29, 45, 29, 45, 36, 120, 70, 45, GrowthRate.MEDIUM_FAST, 50, false, true,
      new PokemonForm("Plant Cloak", "plant", Type.BUG, null, 0.2, 3.4, Abilities.SHED_SKIN, Abilities.NONE, Abilities.OVERCOAT, 224, 40, 29, 45, 29, 45, 36, 120, 70, 45, false, null, true),
      new PokemonForm("Sandy Cloak", "sandy", Type.BUG, null, 0.2, 3.4, Abilities.SHED_SKIN, Abilities.NONE, Abilities.OVERCOAT, 224, 40, 29, 45, 29, 45, 36, 120, 70, 45, false, null, true),
      new PokemonForm("Trash Cloak", "trash", Type.BUG, null, 0.2, 3.4, Abilities.SHED_SKIN, Abilities.NONE, Abilities.OVERCOAT, 224, 40, 29, 45, 29, 45, 36, 120, 70, 45, false, null, true),
    ),
    new PokemonSpecies(Species.WORMADAM, 4, false, false, false, "Bagworm Pokémon", Type.BUG, Type.GRASS, 0.5, 6.5, Abilities.ANTICIPATION, Abilities.NONE, Abilities.OVERCOAT, 424, 60, 59, 85, 79, 105, 36, 45, 70, 148, GrowthRate.MEDIUM_FAST, 0, false, false,
      new PokemonForm("Plant Cloak", "plant", Type.BUG, Type.GRASS, 0.5, 6.5, Abilities.ANTICIPATION, Abilities.NONE, Abilities.OVERCOAT, 424, 60, 59, 85, 79, 105, 36, 45, 70, 148),
      new PokemonForm("Sandy Cloak", "sandy", Type.BUG, Type.GROUND, 0.5, 6.5, Abilities.ANTICIPATION, Abilities.NONE, Abilities.OVERCOAT, 424, 60, 79, 105, 59, 85, 36, 45, 70, 148),
      new PokemonForm("Trash Cloak", "trash", Type.BUG, Type.STEEL, 0.5, 6.5, Abilities.ANTICIPATION, Abilities.NONE, Abilities.OVERCOAT, 424, 60, 69, 95, 69, 95, 36, 45, 70, 148),
    ),
    new PokemonSpecies(Species.MOTHIM, 4, false, false, false, "Moth Pokémon", Type.BUG, Type.FLYING, 0.9, 23.3, Abilities.SWARM, Abilities.NONE, Abilities.TINTED_LENS, 424, 70, 94, 50, 94, 50, 66, 45, 70, 148, GrowthRate.MEDIUM_FAST, 100, false),
    new PokemonSpecies(Species.COMBEE, 4, false, false, false, "Tiny Bee Pokémon", Type.BUG, Type.FLYING, 0.3, 5.5, Abilities.HONEY_GATHER, Abilities.NONE, Abilities.HUSTLE, 244, 30, 30, 42, 30, 42, 70, 120, 50, 49, GrowthRate.MEDIUM_SLOW, 87.5, true),
    new PokemonSpecies(Species.VESPIQUEN, 4, false, false, false, "Beehive Pokémon", Type.BUG, Type.FLYING, 1.2, 38.5, Abilities.PRESSURE, Abilities.NONE, Abilities.UNNERVE, 474, 70, 80, 102, 80, 102, 40, 45, 50, 166, GrowthRate.MEDIUM_SLOW, 0, false),
    new PokemonSpecies(Species.PACHIRISU, 4, false, false, false, "EleSquirrel Pokémon", Type.ELECTRIC, null, 0.4, 3.9, Abilities.RUN_AWAY, Abilities.PICKUP, Abilities.VOLT_ABSORB, 405, 60, 45, 70, 45, 90, 95, 200, 100, 142, GrowthRate.MEDIUM_FAST, 50, true),
    new PokemonSpecies(Species.BUIZEL, 4, false, false, false, "Sea Weasel Pokémon", Type.WATER, null, 0.7, 29.5, Abilities.SWIFT_SWIM, Abilities.NONE, Abilities.WATER_VEIL, 330, 55, 65, 35, 60, 30, 85, 190, 70, 66, GrowthRate.MEDIUM_FAST, 50, true),
    new PokemonSpecies(Species.FLOATZEL, 4, false, false, false, "Sea Weasel Pokémon", Type.WATER, null, 1.1, 33.5, Abilities.SWIFT_SWIM, Abilities.NONE, Abilities.WATER_VEIL, 495, 85, 105, 55, 85, 50, 115, 75, 70, 173, GrowthRate.MEDIUM_FAST, 50, true),
    new PokemonSpecies(Species.CHERUBI, 4, false, false, false, "Cherry Pokémon", Type.GRASS, null, 0.4, 3.3, Abilities.CHLOROPHYLL, Abilities.NONE, Abilities.NONE, 275, 45, 35, 45, 62, 53, 35, 190, 50, 55, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.CHERRIM, 4, false, false, false, "Blossom Pokémon", Type.GRASS, null, 0.5, 9.3, Abilities.FLOWER_GIFT, Abilities.NONE, Abilities.NONE, 450, 70, 60, 70, 87, 78, 85, 75, 50, 158, GrowthRate.MEDIUM_FAST, 50, false, true,
      new PokemonForm("Overcast Form", "overcast", Type.GRASS, null, 0.5, 9.3, Abilities.FLOWER_GIFT, Abilities.NONE, Abilities.NONE, 450, 70, 60, 70, 87, 78, 85, 75, 50, 158),
      new PokemonForm("Sunshine Form", "sunshine", Type.GRASS, null, 0.5, 9.3, Abilities.FLOWER_GIFT, Abilities.NONE, Abilities.NONE, 450, 70, 60, 70, 87, 78, 85, 75, 50, 158),
    ),
    new PokemonSpecies(Species.SHELLOS, 4, false, false, false, "Sea Slug Pokémon", Type.WATER, null, 0.3, 6.3, Abilities.STICKY_HOLD, Abilities.STORM_DRAIN, Abilities.SAND_FORCE, 325, 76, 48, 48, 57, 62, 34, 190, 50, 65, GrowthRate.MEDIUM_FAST, 50, false, false,
      new PokemonForm("East Sea", "east", Type.WATER, null, 0.3, 6.3, Abilities.STICKY_HOLD, Abilities.STORM_DRAIN, Abilities.SAND_FORCE, 325, 76, 48, 48, 57, 62, 34, 190, 50, 65, false, null, true),
      new PokemonForm("West Sea", "west", Type.WATER, null, 0.3, 6.3, Abilities.STICKY_HOLD, Abilities.STORM_DRAIN, Abilities.SAND_FORCE, 325, 76, 48, 48, 57, 62, 34, 190, 50, 65, false, null, true),
    ),
    new PokemonSpecies(Species.GASTRODON, 4, false, false, false, "Sea Slug Pokémon", Type.WATER, Type.GROUND, 0.9, 29.9, Abilities.STICKY_HOLD, Abilities.STORM_DRAIN, Abilities.SAND_FORCE, 475, 111, 83, 68, 92, 82, 39, 75, 50, 166, GrowthRate.MEDIUM_FAST, 50, false, false,
      new PokemonForm("East Sea", "east", Type.WATER, Type.GROUND, 0.9, 29.9, Abilities.STICKY_HOLD, Abilities.STORM_DRAIN, Abilities.SAND_FORCE, 475, 111, 83, 68, 92, 82, 39, 75, 50, 166),
      new PokemonForm("West Sea", "west", Type.WATER, Type.GROUND, 0.9, 29.9, Abilities.STICKY_HOLD, Abilities.STORM_DRAIN, Abilities.SAND_FORCE, 475, 111, 83, 68, 92, 82, 39, 75, 50, 166),
    ),
    new PokemonSpecies(Species.AMBIPOM, 4, false, false, false, "Long Tail Pokémon", Type.NORMAL, null, 1.2, 20.3, Abilities.TECHNICIAN, Abilities.PICKUP, Abilities.SKILL_LINK, 482, 75, 100, 66, 60, 66, 115, 45, 100, 169, GrowthRate.FAST, 50, true),
    new PokemonSpecies(Species.DRIFLOON, 4, false, false, false, "Balloon Pokémon", Type.GHOST, Type.FLYING, 0.4, 1.2, Abilities.AFTERMATH, Abilities.UNBURDEN, Abilities.FLARE_BOOST, 348, 90, 50, 34, 60, 44, 70, 125, 50, 70, GrowthRate.FLUCTUATING, 50, false),
    new PokemonSpecies(Species.DRIFBLIM, 4, false, false, false, "Blimp Pokémon", Type.GHOST, Type.FLYING, 1.2, 15, Abilities.AFTERMATH, Abilities.UNBURDEN, Abilities.FLARE_BOOST, 498, 150, 80, 44, 90, 54, 80, 60, 50, 174, GrowthRate.FLUCTUATING, 50, false),
    new PokemonSpecies(Species.BUNEARY, 4, false, false, false, "Rabbit Pokémon", Type.NORMAL, null, 0.4, 5.5, Abilities.RUN_AWAY, Abilities.KLUTZ, Abilities.LIMBER, 350, 55, 66, 44, 44, 56, 85, 190, 0, 70, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.LOPUNNY, 4, false, false, false, "Rabbit Pokémon", Type.NORMAL, null, 1.2, 33.3, Abilities.CUTE_CHARM, Abilities.KLUTZ, Abilities.LIMBER, 480, 65, 76, 84, 54, 96, 105, 60, 140, 168, GrowthRate.MEDIUM_FAST, 50, false, true,
      new PokemonForm("Normal", "", Type.NORMAL, null, 1.2, 33.3, Abilities.CUTE_CHARM, Abilities.KLUTZ, Abilities.LIMBER, 480, 65, 76, 84, 54, 96, 105, 60, 140, 168),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.NORMAL, Type.FIGHTING, 1.3, 28.3, Abilities.SCRAPPY, Abilities.SCRAPPY, Abilities.SCRAPPY, 580, 65, 136, 94, 54, 96, 135, 60, 140, 168),
    ),
    new PokemonSpecies(Species.MISMAGIUS, 4, false, false, false, "Magical Pokémon", Type.GHOST, null, 0.9, 4.4, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 495, 60, 60, 60, 105, 105, 105, 45, 35, 173, GrowthRate.FAST, 50, false),
    new PokemonSpecies(Species.HONCHKROW, 4, false, false, false, "Big Boss Pokémon", Type.DARK, Type.FLYING, 0.9, 27.3, Abilities.INSOMNIA, Abilities.SUPER_LUCK, Abilities.MOXIE, 505, 100, 125, 52, 105, 52, 71, 30, 35, 177, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.GLAMEOW, 4, false, false, false, "Catty Pokémon", Type.NORMAL, null, 0.5, 3.9, Abilities.LIMBER, Abilities.OWN_TEMPO, Abilities.KEEN_EYE, 310, 49, 55, 42, 42, 37, 85, 190, 70, 62, GrowthRate.FAST, 25, false),
    new PokemonSpecies(Species.PURUGLY, 4, false, false, false, "Tiger Cat Pokémon", Type.NORMAL, null, 1, 43.8, Abilities.THICK_FAT, Abilities.OWN_TEMPO, Abilities.DEFIANT, 452, 71, 82, 64, 64, 59, 112, 75, 70, 158, GrowthRate.FAST, 25, false),
    new PokemonSpecies(Species.CHINGLING, 4, false, false, false, "Bell Pokémon", Type.PSYCHIC, null, 0.2, 0.6, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 285, 45, 30, 50, 65, 50, 45, 120, 70, 57, GrowthRate.FAST, 50, false),
    new PokemonSpecies(Species.STUNKY, 4, false, false, false, "Skunk Pokémon", Type.POISON, Type.DARK, 0.4, 19.2, Abilities.STENCH, Abilities.AFTERMATH, Abilities.KEEN_EYE, 329, 63, 63, 47, 41, 41, 74, 225, 50, 66, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.SKUNTANK, 4, false, false, false, "Skunk Pokémon", Type.POISON, Type.DARK, 1, 38, Abilities.STENCH, Abilities.AFTERMATH, Abilities.KEEN_EYE, 479, 103, 93, 67, 71, 61, 84, 60, 50, 168, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.BRONZOR, 4, false, false, false, "Bronze Pokémon", Type.STEEL, Type.PSYCHIC, 0.5, 60.5, Abilities.LEVITATE, Abilities.HEATPROOF, Abilities.HEAVY_METAL, 300, 57, 24, 86, 24, 86, 23, 255, 50, 60, GrowthRate.MEDIUM_FAST, null, false),
    new PokemonSpecies(Species.BRONZONG, 4, false, false, false, "Bronze Bell Pokémon", Type.STEEL, Type.PSYCHIC, 1.3, 187, Abilities.LEVITATE, Abilities.HEATPROOF, Abilities.HEAVY_METAL, 500, 67, 89, 116, 79, 116, 33, 90, 50, 175, GrowthRate.MEDIUM_FAST, null, false),
    new PokemonSpecies(Species.BONSLY, 4, false, false, false, "Bonsai Pokémon", Type.ROCK, null, 0.5, 15, Abilities.STURDY, Abilities.ROCK_HEAD, Abilities.RATTLED, 290, 50, 80, 95, 10, 45, 10, 255, 50, 58, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.MIME_JR, 4, false, false, false, "Mime Pokémon", Type.PSYCHIC, Type.FAIRY, 0.6, 13, Abilities.SOUNDPROOF, Abilities.FILTER, Abilities.TECHNICIAN, 310, 20, 25, 45, 70, 90, 60, 145, 50, 62, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.HAPPINY, 4, false, false, false, "Playhouse Pokémon", Type.NORMAL, null, 0.6, 24.4, Abilities.NATURAL_CURE, Abilities.SERENE_GRACE, Abilities.FRIEND_GUARD, 220, 100, 5, 5, 15, 65, 30, 130, 140, 110, GrowthRate.FAST, 0, false),
    new PokemonSpecies(Species.CHATOT, 4, false, false, false, "Music Note Pokémon", Type.NORMAL, Type.FLYING, 0.5, 1.9, Abilities.KEEN_EYE, Abilities.TANGLED_FEET, Abilities.BIG_PECKS, 411, 76, 65, 45, 92, 42, 91, 30, 35, 144, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.SPIRITOMB, 4, false, false, false, "Forbidden Pokémon", Type.GHOST, Type.DARK, 1, 108, Abilities.PRESSURE, Abilities.NONE, Abilities.INFILTRATOR, 485, 50, 92, 108, 92, 108, 35, 100, 50, 170, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.GIBLE, 4, false, false, false, "Land Shark Pokémon", Type.DRAGON, Type.GROUND, 0.7, 20.5, Abilities.SAND_VEIL, Abilities.NONE, Abilities.ROUGH_SKIN, 300, 58, 70, 45, 40, 45, 42, 45, 50, 60, GrowthRate.SLOW, 50, true),
    new PokemonSpecies(Species.GABITE, 4, false, false, false, "Cave Pokémon", Type.DRAGON, Type.GROUND, 1.4, 56, Abilities.SAND_VEIL, Abilities.NONE, Abilities.ROUGH_SKIN, 410, 68, 90, 65, 50, 55, 82, 45, 50, 144, GrowthRate.SLOW, 50, true),
    new PokemonSpecies(Species.GARCHOMP, 4, false, false, false, "Mach Pokémon", Type.DRAGON, Type.GROUND, 1.9, 95, Abilities.SAND_VEIL, Abilities.NONE, Abilities.ROUGH_SKIN, 600, 108, 130, 95, 80, 85, 102, 45, 50, 300, GrowthRate.SLOW, 50, true, true,
      new PokemonForm("Normal", "", Type.DRAGON, Type.GROUND, 1.9, 95, Abilities.SAND_VEIL, Abilities.NONE, Abilities.ROUGH_SKIN, 600, 108, 130, 95, 80, 85, 102, 45, 50, 300, true),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.DRAGON, Type.GROUND, 1.9, 95, Abilities.SAND_FORCE, Abilities.NONE, Abilities.SAND_FORCE, 700, 108, 170, 115, 120, 95, 92, 45, 50, 300, true),
    ),
    new PokemonSpecies(Species.MUNCHLAX, 4, false, false, false, "Big Eater Pokémon", Type.NORMAL, null, 0.6, 105, Abilities.PICKUP, Abilities.THICK_FAT, Abilities.GLUTTONY, 390, 135, 85, 40, 40, 85, 5, 50, 50, 78, GrowthRate.SLOW, 87.5, false),
    new PokemonSpecies(Species.RIOLU, 4, false, false, false, "Emanation Pokémon", Type.FIGHTING, null, 0.7, 20.2, Abilities.STEADFAST, Abilities.INNER_FOCUS, Abilities.PRANKSTER, 285, 40, 70, 40, 35, 40, 60, 75, 50, 57, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.LUCARIO, 4, false, false, false, "Aura Pokémon", Type.FIGHTING, Type.STEEL, 1.2, 54, Abilities.STEADFAST, Abilities.INNER_FOCUS, Abilities.JUSTIFIED, 525, 70, 110, 70, 115, 70, 90, 45, 50, 184, GrowthRate.MEDIUM_SLOW, 87.5, false, true,
      new PokemonForm("Normal", "", Type.FIGHTING, Type.STEEL, 1.2, 54, Abilities.STEADFAST, Abilities.INNER_FOCUS, Abilities.JUSTIFIED, 525, 70, 110, 70, 115, 70, 90, 45, 50, 184),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.FIGHTING, Type.STEEL, 1.3, 57.5, Abilities.ADAPTABILITY, Abilities.ADAPTABILITY, Abilities.ADAPTABILITY, 625, 70, 145, 88, 140, 70, 112, 45, 50, 184),
    ),
    new PokemonSpecies(Species.HIPPOPOTAS, 4, false, false, false, "Hippo Pokémon", Type.GROUND, null, 0.8, 49.5, Abilities.SAND_STREAM, Abilities.NONE, Abilities.SAND_FORCE, 330, 68, 72, 78, 38, 42, 32, 140, 50, 66, GrowthRate.SLOW, 50, true),
    new PokemonSpecies(Species.HIPPOWDON, 4, false, false, false, "Heavyweight Pokémon", Type.GROUND, null, 2, 300, Abilities.SAND_STREAM, Abilities.NONE, Abilities.SAND_FORCE, 525, 108, 112, 118, 68, 72, 47, 60, 50, 184, GrowthRate.SLOW, 50, true),
    new PokemonSpecies(Species.SKORUPI, 4, false, false, false, "Scorpion Pokémon", Type.POISON, Type.BUG, 0.8, 12, Abilities.BATTLE_ARMOR, Abilities.SNIPER, Abilities.KEEN_EYE, 330, 40, 50, 90, 30, 55, 65, 120, 50, 66, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.DRAPION, 4, false, false, false, "Ogre Scorpion Pokémon", Type.POISON, Type.DARK, 1.3, 61.5, Abilities.BATTLE_ARMOR, Abilities.SNIPER, Abilities.KEEN_EYE, 500, 70, 90, 110, 60, 75, 95, 45, 50, 175, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.CROAGUNK, 4, false, false, false, "Toxic Mouth Pokémon", Type.POISON, Type.FIGHTING, 0.7, 23, Abilities.ANTICIPATION, Abilities.DRY_SKIN, Abilities.POISON_TOUCH, 300, 48, 61, 40, 61, 40, 50, 140, 100, 60, GrowthRate.MEDIUM_FAST, 50, true),
    new PokemonSpecies(Species.TOXICROAK, 4, false, false, false, "Toxic Mouth Pokémon", Type.POISON, Type.FIGHTING, 1.3, 44.4, Abilities.ANTICIPATION, Abilities.DRY_SKIN, Abilities.POISON_TOUCH, 490, 83, 106, 65, 86, 65, 85, 75, 50, 172, GrowthRate.MEDIUM_FAST, 50, true),
    new PokemonSpecies(Species.CARNIVINE, 4, false, false, false, "Bug Catcher Pokémon", Type.GRASS, null, 1.4, 27, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 454, 74, 100, 72, 90, 72, 46, 200, 70, 159, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.FINNEON, 4, false, false, false, "Wing Fish Pokémon", Type.WATER, null, 0.4, 7, Abilities.SWIFT_SWIM, Abilities.STORM_DRAIN, Abilities.WATER_VEIL, 330, 49, 49, 56, 49, 61, 66, 190, 70, 66, GrowthRate.ERRATIC, 50, true),
    new PokemonSpecies(Species.LUMINEON, 4, false, false, false, "Neon Pokémon", Type.WATER, null, 1.2, 24, Abilities.SWIFT_SWIM, Abilities.STORM_DRAIN, Abilities.WATER_VEIL, 460, 69, 69, 76, 69, 86, 91, 75, 70, 161, GrowthRate.ERRATIC, 50, true),
    new PokemonSpecies(Species.MANTYKE, 4, false, false, false, "Kite Pokémon", Type.WATER, Type.FLYING, 1, 65, Abilities.SWIFT_SWIM, Abilities.WATER_ABSORB, Abilities.WATER_VEIL, 345, 45, 20, 50, 60, 120, 50, 25, 50, 69, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.SNOVER, 4, false, false, false, "Frost Tree Pokémon", Type.GRASS, Type.ICE, 1, 50.5, Abilities.SNOW_WARNING, Abilities.NONE, Abilities.SOUNDPROOF, 334, 60, 62, 50, 62, 60, 40, 120, 50, 67, GrowthRate.SLOW, 50, true),
    new PokemonSpecies(Species.ABOMASNOW, 4, false, false, false, "Frost Tree Pokémon", Type.GRASS, Type.ICE, 2.2, 135.5, Abilities.SNOW_WARNING, Abilities.NONE, Abilities.SOUNDPROOF, 494, 90, 92, 75, 92, 85, 60, 60, 50, 173, GrowthRate.SLOW, 50, true, true,
      new PokemonForm("Normal", "", Type.GRASS, Type.ICE, 2.2, 135.5, Abilities.SNOW_WARNING, Abilities.NONE, Abilities.SOUNDPROOF, 494, 90, 92, 75, 92, 85, 60, 60, 50, 173, true),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.GRASS, Type.ICE, 2.7, 185, Abilities.SNOW_WARNING, Abilities.NONE, Abilities.SNOW_WARNING, 594, 90, 132, 105, 132, 105, 30, 60, 50, 173, true),
    ),
    new PokemonSpecies(Species.WEAVILE, 4, false, false, false, "Sharp Claw Pokémon", Type.DARK, Type.ICE, 1.1, 34, Abilities.PRESSURE, Abilities.NONE, Abilities.PICKPOCKET, 510, 70, 120, 65, 45, 85, 125, 45, 35, 179, GrowthRate.MEDIUM_SLOW, 50, true),
    new PokemonSpecies(Species.MAGNEZONE, 4, false, false, false, "Magnet Area Pokémon", Type.ELECTRIC, Type.STEEL, 1.2, 180, Abilities.MAGNET_PULL, Abilities.STURDY, Abilities.ANALYTIC, 535, 70, 70, 115, 130, 90, 60, 30, 50, 268, GrowthRate.MEDIUM_FAST, null, false),
    new PokemonSpecies(Species.LICKILICKY, 4, false, false, false, "Licking Pokémon", Type.NORMAL, null, 1.7, 140, Abilities.OWN_TEMPO, Abilities.OBLIVIOUS, Abilities.CLOUD_NINE, 515, 110, 85, 95, 80, 95, 50, 30, 50, 180, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.RHYPERIOR, 4, false, false, false, "Drill Pokémon", Type.GROUND, Type.ROCK, 2.4, 282.8, Abilities.LIGHTNING_ROD, Abilities.SOLID_ROCK, Abilities.RECKLESS, 535, 115, 140, 130, 55, 55, 40, 30, 50, 268, GrowthRate.SLOW, 50, true),
    new PokemonSpecies(Species.TANGROWTH, 4, false, false, false, "Vine Pokémon", Type.GRASS, null, 2, 128.6, Abilities.CHLOROPHYLL, Abilities.LEAF_GUARD, Abilities.REGENERATOR, 535, 100, 100, 125, 110, 50, 50, 30, 50, 187, GrowthRate.MEDIUM_FAST, 50, true),
    new PokemonSpecies(Species.ELECTIVIRE, 4, false, false, false, "Thunderbolt Pokémon", Type.ELECTRIC, null, 1.8, 138.6, Abilities.MOTOR_DRIVE, Abilities.NONE, Abilities.VITAL_SPIRIT, 540, 75, 123, 67, 95, 85, 95, 30, 50, 270, GrowthRate.MEDIUM_FAST, 75, false),
    new PokemonSpecies(Species.MAGMORTAR, 4, false, false, false, "Blast Pokémon", Type.FIRE, null, 1.6, 68, Abilities.FLAME_BODY, Abilities.NONE, Abilities.VITAL_SPIRIT, 540, 75, 95, 67, 125, 95, 83, 30, 50, 270, GrowthRate.MEDIUM_FAST, 75, false),
    new PokemonSpecies(Species.TOGEKISS, 4, false, false, false, "Jubilee Pokémon", Type.FAIRY, Type.FLYING, 1.5, 38, Abilities.HUSTLE, Abilities.SERENE_GRACE, Abilities.SUPER_LUCK, 545, 85, 50, 95, 120, 115, 80, 30, 50, 273, GrowthRate.FAST, 87.5, false),
    new PokemonSpecies(Species.YANMEGA, 4, false, false, false, "Ogre Darner Pokémon", Type.BUG, Type.FLYING, 1.9, 51.5, Abilities.SPEED_BOOST, Abilities.TINTED_LENS, Abilities.FRISK, 515, 86, 76, 86, 116, 56, 95, 30, 70, 180, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.LEAFEON, 4, false, false, false, "Verdant Pokémon", Type.GRASS, null, 1, 25.5, Abilities.LEAF_GUARD, Abilities.NONE, Abilities.CHLOROPHYLL, 525, 65, 110, 130, 60, 65, 95, 45, 35, 184, GrowthRate.MEDIUM_FAST, 87.5, false),
    new PokemonSpecies(Species.GLACEON, 4, false, false, false, "Fresh Snow Pokémon", Type.ICE, null, 0.8, 25.9, Abilities.SNOW_CLOAK, Abilities.NONE, Abilities.ICE_BODY, 525, 65, 60, 110, 130, 95, 65, 45, 35, 184, GrowthRate.MEDIUM_FAST, 87.5, false),
    new PokemonSpecies(Species.GLISCOR, 4, false, false, false, "Fang Scorpion Pokémon", Type.GROUND, Type.FLYING, 2, 42.5, Abilities.HYPER_CUTTER, Abilities.SAND_VEIL, Abilities.POISON_HEAL, 510, 75, 95, 125, 45, 75, 95, 30, 70, 179, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.MAMOSWINE, 4, false, false, false, "Twin Tusk Pokémon", Type.ICE, Type.GROUND, 2.5, 291, Abilities.OBLIVIOUS, Abilities.SNOW_CLOAK, Abilities.THICK_FAT, 530, 110, 130, 80, 70, 60, 80, 50, 50, 265, GrowthRate.SLOW, 50, true),
    new PokemonSpecies(Species.PORYGON_Z, 4, false, false, false, "Virtual Pokémon", Type.NORMAL, null, 0.9, 34, Abilities.ADAPTABILITY, Abilities.DOWNLOAD, Abilities.ANALYTIC, 535, 85, 80, 70, 135, 75, 90, 30, 50, 268, GrowthRate.MEDIUM_FAST, null, false),
    new PokemonSpecies(Species.GALLADE, 4, false, false, false, "Blade Pokémon", Type.PSYCHIC, Type.FIGHTING, 1.6, 52, Abilities.STEADFAST, Abilities.SHARPNESS, Abilities.JUSTIFIED, 518, 68, 125, 65, 65, 115, 80, 45, 35, 259, GrowthRate.SLOW, 100, false, true,
      new PokemonForm("Normal", "", Type.PSYCHIC, Type.FIGHTING, 1.6, 52, Abilities.STEADFAST, Abilities.SHARPNESS, Abilities.JUSTIFIED, 518, 68, 125, 65, 65, 115, 80, 45, 35, 259),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.PSYCHIC, Type.FIGHTING, 1.6, 56.4, Abilities.SHARPNESS, Abilities.SHARPNESS, Abilities.SHARPNESS, 618, 68, 165, 95, 65, 115, 110, 45, 35, 259),
    ),
    new PokemonSpecies(Species.PROBOPASS, 4, false, false, false, "Compass Pokémon", Type.ROCK, Type.STEEL, 1.4, 340, Abilities.STURDY, Abilities.MAGNET_PULL, Abilities.SAND_FORCE, 525, 60, 55, 145, 75, 150, 40, 60, 70, 184, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.DUSKNOIR, 4, false, false, false, "Gripper Pokémon", Type.GHOST, null, 2.2, 106.6, Abilities.PRESSURE, Abilities.NONE, Abilities.FRISK, 525, 45, 100, 135, 65, 135, 45, 45, 35, 263, GrowthRate.FAST, 50, false),
    new PokemonSpecies(Species.FROSLASS, 4, false, false, false, "Snow Land Pokémon", Type.ICE, Type.GHOST, 1.3, 26.6, Abilities.SNOW_CLOAK, Abilities.NONE, Abilities.CURSED_BODY, 480, 70, 80, 70, 80, 70, 110, 75, 50, 168, GrowthRate.MEDIUM_FAST, 0, false),
    new PokemonSpecies(Species.ROTOM, 4, false, false, false, "Plasma Pokémon", Type.ELECTRIC, Type.GHOST, 0.3, 0.3, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 440, 50, 50, 77, 95, 77, 91, 45, 50, 154, GrowthRate.MEDIUM_FAST, null, false, false,
      new PokemonForm("Normal", "", Type.ELECTRIC, Type.GHOST, 0.3, 0.3, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 440, 50, 50, 77, 95, 77, 91, 45, 50, 154, false, null, true),
      new PokemonForm("Heat", "heat", Type.ELECTRIC, Type.FIRE, 0.3, 0.3, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 520, 50, 65, 107, 105, 107, 86, 45, 50, 154, false, null, true),
      new PokemonForm("Wash", "wash", Type.ELECTRIC, Type.WATER, 0.3, 0.3, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 520, 50, 65, 107, 105, 107, 86, 45, 50, 154, false, null, true),
      new PokemonForm("Frost", "frost", Type.ELECTRIC, Type.ICE, 0.3, 0.3, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 520, 50, 65, 107, 105, 107, 86, 45, 50, 154, false, null, true),
      new PokemonForm("Fan", "fan", Type.ELECTRIC, Type.FLYING, 0.3, 0.3, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 520, 50, 65, 107, 105, 107, 86, 45, 50, 154, false, null, true),
      new PokemonForm("Mow", "mow", Type.ELECTRIC, Type.GRASS, 0.3, 0.3, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 520, 50, 65, 107, 105, 107, 86, 45, 50, 154, false, null, true),
    ),
    new PokemonSpecies(Species.UXIE, 4, true, false, false, "Knowledge Pokémon", Type.PSYCHIC, null, 0.3, 0.3, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 580, 75, 75, 130, 75, 130, 95, 3, 140, 290, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.MESPRIT, 4, true, false, false, "Emotion Pokémon", Type.PSYCHIC, null, 0.3, 0.3, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 580, 80, 105, 105, 105, 105, 80, 3, 140, 290, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.AZELF, 4, true, false, false, "Willpower Pokémon", Type.PSYCHIC, null, 0.3, 0.3, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 580, 75, 125, 70, 125, 70, 115, 3, 140, 290, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.DIALGA, 4, false, true, false, "Temporal Pokémon", Type.STEEL, Type.DRAGON, 5.4, 683, Abilities.PRESSURE, Abilities.NONE, Abilities.TELEPATHY, 680, 100, 120, 120, 150, 100, 90, 3, 0, 340, GrowthRate.SLOW, null, false, false,
      new PokemonForm("Normal", "", Type.STEEL, Type.DRAGON, 5.4, 683, Abilities.PRESSURE, Abilities.NONE, Abilities.TELEPATHY, 680, 100, 120, 120, 150, 100, 90, 3, 0, 340),
      new PokemonForm("Origin Forme", "origin", Type.STEEL, Type.DRAGON, 7, 848.7, Abilities.PRESSURE, Abilities.NONE, Abilities.TELEPATHY, 680, 100, 100, 120, 150, 120, 90, 3, 0, 340),
    ),
    new PokemonSpecies(Species.PALKIA, 4, false, true, false, "Spatial Pokémon", Type.WATER, Type.DRAGON, 4.2, 336, Abilities.PRESSURE, Abilities.NONE, Abilities.TELEPATHY, 680, 90, 120, 100, 150, 120, 100, 3, 0, 340, GrowthRate.SLOW, null, false, false,
      new PokemonForm("Normal", "", Type.WATER, Type.DRAGON, 4.2, 336, Abilities.PRESSURE, Abilities.NONE, Abilities.TELEPATHY, 680, 90, 120, 100, 150, 120, 100, 3, 0, 340),
      new PokemonForm("Origin Forme", "origin", Type.WATER, Type.DRAGON, 6.3, 659, Abilities.PRESSURE, Abilities.NONE, Abilities.TELEPATHY, 680, 90, 100, 100, 150, 120, 120, 3, 0, 340),
    ),
    new PokemonSpecies(Species.HEATRAN, 4, true, false, false, "Lava Dome Pokémon", Type.FIRE, Type.STEEL, 1.7, 430, Abilities.FLASH_FIRE, Abilities.NONE, Abilities.FLAME_BODY, 600, 91, 90, 106, 130, 106, 77, 3, 100, 300, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.REGIGIGAS, 4, true, false, false, "Colossal Pokémon", Type.NORMAL, null, 3.7, 420, Abilities.SLOW_START, Abilities.NONE, Abilities.NORMALIZE, 670, 110, 160, 110, 80, 110, 100, 3, 0, 335, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.GIRATINA, 4, false, true, false, "Renegade Pokémon", Type.GHOST, Type.DRAGON, 4.5, 750, Abilities.PRESSURE, Abilities.NONE, Abilities.TELEPATHY, 680, 150, 100, 120, 100, 120, 90, 3, 0, 340, GrowthRate.SLOW, null, false, true,
      new PokemonForm("Altered Forme", "altered", Type.GHOST, Type.DRAGON, 4.5, 750, Abilities.PRESSURE, Abilities.NONE, Abilities.TELEPATHY, 680, 150, 100, 120, 100, 120, 90, 3, 0, 340, false, null, true),
      new PokemonForm("Origin Forme", "origin", Type.GHOST, Type.DRAGON, 6.9, 650, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 680, 150, 120, 100, 120, 100, 90, 3, 0, 340),
    ),
    new PokemonSpecies(Species.CRESSELIA, 4, true, false, false, "Lunar Pokémon", Type.PSYCHIC, null, 1.5, 85.6, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 580, 120, 70, 110, 75, 120, 85, 3, 100, 300, GrowthRate.SLOW, 0, false),
    new PokemonSpecies(Species.PHIONE, 4, false, false, true, "Sea Drifter Pokémon", Type.WATER, null, 0.4, 3.1, Abilities.HYDRATION, Abilities.NONE, Abilities.NONE, 480, 80, 80, 80, 80, 80, 80, 30, 70, 216, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.MANAPHY, 4, false, false, true, "Seafaring Pokémon", Type.WATER, null, 0.3, 1.4, Abilities.HYDRATION, Abilities.NONE, Abilities.NONE, 600, 100, 100, 100, 100, 100, 100, 3, 70, 270, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.DARKRAI, 4, false, false, true, "Pitch-Black Pokémon", Type.DARK, null, 1.5, 50.5, Abilities.BAD_DREAMS, Abilities.NONE, Abilities.NONE, 600, 70, 90, 90, 135, 90, 125, 3, 0, 270, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.SHAYMIN, 4, false, false, true, "Gratitude Pokémon", Type.GRASS, null, 0.2, 2.1, Abilities.NATURAL_CURE, Abilities.NONE, Abilities.NONE, 600, 100, 100, 100, 100, 100, 100, 45, 100, 270, GrowthRate.MEDIUM_SLOW, null, false, true,
      new PokemonForm("Land Forme", "land", Type.GRASS, null, 0.2, 2.1, Abilities.NATURAL_CURE, Abilities.NONE, Abilities.NONE, 600, 100, 100, 100, 100, 100, 100, 45, 100, 270, false, null, true),
      new PokemonForm("Sky Forme", "sky", Type.GRASS, Type.FLYING, 0.4, 5.2, Abilities.SERENE_GRACE, Abilities.NONE, Abilities.NONE, 600, 100, 103, 75, 120, 75, 127, 45, 100, 270),
    ),
    new PokemonSpecies(Species.ARCEUS, 4, false, false, true, "Alpha Pokémon", Type.NORMAL, null, 3.2, 320, Abilities.MULTITYPE, Abilities.NONE, Abilities.NONE, 720, 120, 120, 120, 120, 120, 120, 3, 0, 324, GrowthRate.SLOW, null, false, true,
      new PokemonForm("Normal", "normal", Type.NORMAL, null, 3.2, 320, Abilities.MULTITYPE, Abilities.NONE, Abilities.NONE, 720, 120, 120, 120, 120, 120, 120, 3, 0, 324),
      new PokemonForm("Fighting", "fighting", Type.FIGHTING, null, 3.2, 320, Abilities.MULTITYPE, Abilities.NONE, Abilities.NONE, 720, 120, 120, 120, 120, 120, 120, 3, 0, 324),
      new PokemonForm("Flying", "flying", Type.FLYING, null, 3.2, 320, Abilities.MULTITYPE, Abilities.NONE, Abilities.NONE, 720, 120, 120, 120, 120, 120, 120, 3, 0, 324),
      new PokemonForm("Poison", "poison", Type.POISON, null, 3.2, 320, Abilities.MULTITYPE, Abilities.NONE, Abilities.NONE, 720, 120, 120, 120, 120, 120, 120, 3, 0, 324),
      new PokemonForm("Ground", "ground", Type.GROUND, null, 3.2, 320, Abilities.MULTITYPE, Abilities.NONE, Abilities.NONE, 720, 120, 120, 120, 120, 120, 120, 3, 0, 324),
      new PokemonForm("Rock", "rock", Type.ROCK, null, 3.2, 320, Abilities.MULTITYPE, Abilities.NONE, Abilities.NONE, 720, 120, 120, 120, 120, 120, 120, 3, 0, 324),
      new PokemonForm("Bug", "bug", Type.BUG, null, 3.2, 320, Abilities.MULTITYPE, Abilities.NONE, Abilities.NONE, 720, 120, 120, 120, 120, 120, 120, 3, 0, 324),
      new PokemonForm("Ghost", "ghost", Type.GHOST, null, 3.2, 320, Abilities.MULTITYPE, Abilities.NONE, Abilities.NONE, 720, 120, 120, 120, 120, 120, 120, 3, 0, 324),
      new PokemonForm("Steel", "steel", Type.STEEL, null, 3.2, 320, Abilities.MULTITYPE, Abilities.NONE, Abilities.NONE, 720, 120, 120, 120, 120, 120, 120, 3, 0, 324),
      new PokemonForm("Fire", "fire", Type.FIRE, null, 3.2, 320, Abilities.MULTITYPE, Abilities.NONE, Abilities.NONE, 720, 120, 120, 120, 120, 120, 120, 3, 0, 324),
      new PokemonForm("Water", "water", Type.WATER, null, 3.2, 320, Abilities.MULTITYPE, Abilities.NONE, Abilities.NONE, 720, 120, 120, 120, 120, 120, 120, 3, 0, 324),
      new PokemonForm("Grass", "grass", Type.GRASS, null, 3.2, 320, Abilities.MULTITYPE, Abilities.NONE, Abilities.NONE, 720, 120, 120, 120, 120, 120, 120, 3, 0, 324),
      new PokemonForm("Electric", "electric", Type.ELECTRIC, null, 3.2, 320, Abilities.MULTITYPE, Abilities.NONE, Abilities.NONE, 720, 120, 120, 120, 120, 120, 120, 3, 0, 324),
      new PokemonForm("Psychic", "psychic", Type.PSYCHIC, null, 3.2, 320, Abilities.MULTITYPE, Abilities.NONE, Abilities.NONE, 720, 120, 120, 120, 120, 120, 120, 3, 0, 324),
      new PokemonForm("Ice", "ice", Type.ICE, null, 3.2, 320, Abilities.MULTITYPE, Abilities.NONE, Abilities.NONE, 720, 120, 120, 120, 120, 120, 120, 3, 0, 324),
      new PokemonForm("Dragon", "dragon", Type.DRAGON, null, 3.2, 320, Abilities.MULTITYPE, Abilities.NONE, Abilities.NONE, 720, 120, 120, 120, 120, 120, 120, 3, 0, 324),
      new PokemonForm("Dark", "dark", Type.DARK, null, 3.2, 320, Abilities.MULTITYPE, Abilities.NONE, Abilities.NONE, 720, 120, 120, 120, 120, 120, 120, 3, 0, 324),
      new PokemonForm("Fairy", "fairy", Type.FAIRY, null, 3.2, 320, Abilities.MULTITYPE, Abilities.NONE, Abilities.NONE, 720, 120, 120, 120, 120, 120, 120, 3, 0, 324),
      new PokemonForm("???", "unknown", Type.UNKNOWN, null, 3.2, 320, Abilities.MULTITYPE, Abilities.NONE, Abilities.NONE, 720, 120, 120, 120, 120, 120, 120, 3, 0, 324),
    ),
    new PokemonSpecies(Species.VICTINI, 4, false, false, true, "Victory Pokémon", Type.PSYCHIC, Type.FIRE, 0.4, 4, Abilities.VICTORY_STAR, Abilities.NONE, Abilities.NONE, 600, 100, 100, 100, 100, 100, 100, 3, 100, 300, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.SNIVY, 5, false, false, false, "Grass Snake Pokémon", Type.GRASS, null, 0.6, 8.1, Abilities.OVERGROW, Abilities.NONE, Abilities.CONTRARY, 308, 45, 45, 55, 45, 55, 63, 45, 70, 62, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.SERVINE, 5, false, false, false, "Grass Snake Pokémon", Type.GRASS, null, 0.8, 16, Abilities.OVERGROW, Abilities.NONE, Abilities.CONTRARY, 413, 60, 60, 75, 60, 75, 83, 45, 70, 145, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.SERPERIOR, 5, false, false, false, "Regal Pokémon", Type.GRASS, null, 3.3, 63, Abilities.OVERGROW, Abilities.NONE, Abilities.CONTRARY, 528, 75, 75, 95, 75, 95, 113, 45, 70, 238, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.TEPIG, 5, false, false, false, "Fire Pig Pokémon", Type.FIRE, null, 0.5, 9.9, Abilities.BLAZE, Abilities.NONE, Abilities.THICK_FAT, 308, 65, 63, 45, 45, 45, 45, 45, 70, 62, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.PIGNITE, 5, false, false, false, "Fire Pig Pokémon", Type.FIRE, Type.FIGHTING, 1, 55.5, Abilities.BLAZE, Abilities.NONE, Abilities.THICK_FAT, 418, 90, 93, 55, 70, 55, 55, 45, 70, 146, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.EMBOAR, 5, false, false, false, "Mega Fire Pig Pokémon", Type.FIRE, Type.FIGHTING, 1.6, 150, Abilities.BLAZE, Abilities.NONE, Abilities.RECKLESS, 528, 110, 123, 65, 100, 65, 65, 45, 70, 238, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.OSHAWOTT, 5, false, false, false, "Sea Otter Pokémon", Type.WATER, null, 0.5, 5.9, Abilities.TORRENT, Abilities.NONE, Abilities.SHELL_ARMOR, 308, 55, 55, 45, 63, 45, 45, 45, 70, 62, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.DEWOTT, 5, false, false, false, "Discipline Pokémon", Type.WATER, null, 0.8, 24.5, Abilities.TORRENT, Abilities.NONE, Abilities.SHELL_ARMOR, 413, 75, 75, 60, 83, 60, 60, 45, 70, 145, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.SAMUROTT, 5, false, false, false, "Formidable Pokémon", Type.WATER, null, 1.5, 94.6, Abilities.TORRENT, Abilities.NONE, Abilities.SHELL_ARMOR, 528, 95, 100, 85, 108, 70, 70, 45, 70, 238, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.PATRAT, 5, false, false, false, "Scout Pokémon", Type.NORMAL, null, 0.5, 11.6, Abilities.RUN_AWAY, Abilities.KEEN_EYE, Abilities.ANALYTIC, 255, 45, 55, 39, 35, 39, 42, 255, 70, 51, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.WATCHOG, 5, false, false, false, "Lookout Pokémon", Type.NORMAL, null, 1.1, 27, Abilities.ILLUMINATE, Abilities.KEEN_EYE, Abilities.ANALYTIC, 420, 60, 85, 69, 60, 69, 77, 255, 70, 147, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.LILLIPUP, 5, false, false, false, "Puppy Pokémon", Type.NORMAL, null, 0.4, 4.1, Abilities.VITAL_SPIRIT, Abilities.PICKUP, Abilities.RUN_AWAY, 275, 45, 60, 45, 25, 45, 55, 255, 50, 55, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.HERDIER, 5, false, false, false, "Loyal Dog Pokémon", Type.NORMAL, null, 0.9, 14.7, Abilities.INTIMIDATE, Abilities.SAND_RUSH, Abilities.SCRAPPY, 370, 65, 80, 65, 35, 65, 60, 120, 50, 130, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.STOUTLAND, 5, false, false, false, "Big-Hearted Pokémon", Type.NORMAL, null, 1.2, 61, Abilities.INTIMIDATE, Abilities.SAND_RUSH, Abilities.SCRAPPY, 500, 85, 110, 90, 45, 90, 80, 45, 50, 250, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.PURRLOIN, 5, false, false, false, "Devious Pokémon", Type.DARK, null, 0.4, 10.1, Abilities.LIMBER, Abilities.UNBURDEN, Abilities.PRANKSTER, 281, 41, 50, 37, 50, 37, 66, 255, 50, 56, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.LIEPARD, 5, false, false, false, "Cruel Pokémon", Type.DARK, null, 1.1, 37.5, Abilities.LIMBER, Abilities.UNBURDEN, Abilities.PRANKSTER, 446, 64, 88, 50, 88, 50, 106, 90, 50, 156, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.PANSAGE, 5, false, false, false, "Grass Monkey Pokémon", Type.GRASS, null, 0.6, 10.5, Abilities.GLUTTONY, Abilities.NONE, Abilities.OVERGROW, 316, 50, 53, 48, 53, 48, 64, 190, 70, 63, GrowthRate.MEDIUM_FAST, 87.5, false),
    new PokemonSpecies(Species.SIMISAGE, 5, false, false, false, "Thorn Monkey Pokémon", Type.GRASS, null, 1.1, 30.5, Abilities.GLUTTONY, Abilities.NONE, Abilities.OVERGROW, 498, 75, 98, 63, 98, 63, 101, 75, 70, 174, GrowthRate.MEDIUM_FAST, 87.5, false),
    new PokemonSpecies(Species.PANSEAR, 5, false, false, false, "High Temp Pokémon", Type.FIRE, null, 0.6, 11, Abilities.GLUTTONY, Abilities.NONE, Abilities.BLAZE, 316, 50, 53, 48, 53, 48, 64, 190, 70, 63, GrowthRate.MEDIUM_FAST, 87.5, false),
    new PokemonSpecies(Species.SIMISEAR, 5, false, false, false, "Ember Pokémon", Type.FIRE, null, 1, 28, Abilities.GLUTTONY, Abilities.NONE, Abilities.BLAZE, 498, 75, 98, 63, 98, 63, 101, 75, 70, 174, GrowthRate.MEDIUM_FAST, 87.5, false),
    new PokemonSpecies(Species.PANPOUR, 5, false, false, false, "Spray Pokémon", Type.WATER, null, 0.6, 13.5, Abilities.GLUTTONY, Abilities.NONE, Abilities.TORRENT, 316, 50, 53, 48, 53, 48, 64, 190, 70, 63, GrowthRate.MEDIUM_FAST, 87.5, false),
    new PokemonSpecies(Species.SIMIPOUR, 5, false, false, false, "Geyser Pokémon", Type.WATER, null, 1, 29, Abilities.GLUTTONY, Abilities.NONE, Abilities.TORRENT, 498, 75, 98, 63, 98, 63, 101, 75, 70, 174, GrowthRate.MEDIUM_FAST, 87.5, false),
    new PokemonSpecies(Species.MUNNA, 5, false, false, false, "Dream Eater Pokémon", Type.PSYCHIC, null, 0.6, 23.3, Abilities.FOREWARN, Abilities.SYNCHRONIZE, Abilities.TELEPATHY, 292, 76, 25, 45, 67, 55, 24, 190, 50, 58, GrowthRate.FAST, 50, false),
    new PokemonSpecies(Species.MUSHARNA, 5, false, false, false, "Drowsing Pokémon", Type.PSYCHIC, null, 1.1, 60.5, Abilities.FOREWARN, Abilities.SYNCHRONIZE, Abilities.TELEPATHY, 487, 116, 55, 85, 107, 95, 29, 75, 50, 170, GrowthRate.FAST, 50, false),
    new PokemonSpecies(Species.PIDOVE, 5, false, false, false, "Tiny Pigeon Pokémon", Type.NORMAL, Type.FLYING, 0.3, 2.1, Abilities.BIG_PECKS, Abilities.SUPER_LUCK, Abilities.RIVALRY, 264, 50, 55, 50, 36, 30, 43, 255, 50, 53, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.TRANQUILL, 5, false, false, false, "Wild Pigeon Pokémon", Type.NORMAL, Type.FLYING, 0.6, 15, Abilities.BIG_PECKS, Abilities.SUPER_LUCK, Abilities.RIVALRY, 358, 62, 77, 62, 50, 42, 65, 120, 50, 125, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.UNFEZANT, 5, false, false, false, "Proud Pokémon", Type.NORMAL, Type.FLYING, 1.2, 29, Abilities.BIG_PECKS, Abilities.SUPER_LUCK, Abilities.RIVALRY, 488, 80, 115, 80, 65, 55, 93, 45, 50, 244, GrowthRate.MEDIUM_SLOW, 50, true),
    new PokemonSpecies(Species.BLITZLE, 5, false, false, false, "Electrified Pokémon", Type.ELECTRIC, null, 0.8, 29.8, Abilities.LIGHTNING_ROD, Abilities.MOTOR_DRIVE, Abilities.SAP_SIPPER, 295, 45, 60, 32, 50, 32, 76, 190, 70, 59, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.ZEBSTRIKA, 5, false, false, false, "Thunderbolt Pokémon", Type.ELECTRIC, null, 1.6, 79.5, Abilities.LIGHTNING_ROD, Abilities.MOTOR_DRIVE, Abilities.SAP_SIPPER, 497, 75, 100, 63, 80, 63, 116, 75, 70, 174, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.ROGGENROLA, 5, false, false, false, "Mantle Pokémon", Type.ROCK, null, 0.4, 18, Abilities.STURDY, Abilities.WEAK_ARMOR, Abilities.SAND_FORCE, 280, 55, 75, 85, 25, 25, 15, 255, 50, 56, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.BOLDORE, 5, false, false, false, "Ore Pokémon", Type.ROCK, null, 0.9, 102, Abilities.STURDY, Abilities.WEAK_ARMOR, Abilities.SAND_FORCE, 390, 70, 105, 105, 50, 40, 20, 120, 50, 137, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.GIGALITH, 5, false, false, false, "Compressed Pokémon", Type.ROCK, null, 1.7, 260, Abilities.STURDY, Abilities.SAND_STREAM, Abilities.SAND_FORCE, 515, 85, 135, 130, 60, 80, 25, 45, 50, 258, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.WOOBAT, 5, false, false, false, "Bat Pokémon", Type.PSYCHIC, Type.FLYING, 0.4, 2.1, Abilities.UNAWARE, Abilities.KLUTZ, Abilities.SIMPLE, 323, 65, 45, 43, 55, 43, 72, 190, 50, 65, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.SWOOBAT, 5, false, false, false, "Courting Pokémon", Type.PSYCHIC, Type.FLYING, 0.9, 10.5, Abilities.UNAWARE, Abilities.KLUTZ, Abilities.SIMPLE, 425, 67, 57, 55, 77, 55, 114, 45, 50, 149, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.DRILBUR, 5, false, false, false, "Mole Pokémon", Type.GROUND, null, 0.3, 8.5, Abilities.SAND_RUSH, Abilities.SAND_FORCE, Abilities.MOLD_BREAKER, 328, 60, 85, 40, 30, 45, 68, 120, 50, 66, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.EXCADRILL, 5, false, false, false, "Subterrene Pokémon", Type.GROUND, Type.STEEL, 0.7, 40.4, Abilities.SAND_RUSH, Abilities.SAND_FORCE, Abilities.MOLD_BREAKER, 508, 110, 135, 60, 50, 65, 88, 60, 50, 178, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.AUDINO, 5, false, false, false, "Hearing Pokémon", Type.NORMAL, null, 1.1, 31, Abilities.HEALER, Abilities.REGENERATOR, Abilities.KLUTZ, 445, 103, 60, 86, 60, 86, 50, 255, 50, 390, GrowthRate.FAST, 50, false, true,
      new PokemonForm("Normal", "", Type.NORMAL, null, 1.1, 31, Abilities.HEALER, Abilities.REGENERATOR, Abilities.KLUTZ, 445, 103, 60, 86, 60, 86, 50, 255, 50, 390),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.NORMAL, Type.FAIRY, 1.5, 32, Abilities.HEALER, Abilities.HEALER, Abilities.HEALER, 545, 103, 60, 126, 80, 126, 50, 255, 50, 390),
    ),
    new PokemonSpecies(Species.TIMBURR, 5, false, false, false, "Muscular Pokémon", Type.FIGHTING, null, 0.6, 12.5, Abilities.GUTS, Abilities.SHEER_FORCE, Abilities.IRON_FIST, 305, 75, 80, 55, 25, 35, 35, 180, 70, 61, GrowthRate.MEDIUM_SLOW, 75, false),
    new PokemonSpecies(Species.GURDURR, 5, false, false, false, "Muscular Pokémon", Type.FIGHTING, null, 1.2, 40, Abilities.GUTS, Abilities.SHEER_FORCE, Abilities.IRON_FIST, 405, 85, 105, 85, 40, 50, 40, 90, 50, 142, GrowthRate.MEDIUM_SLOW, 75, false),
    new PokemonSpecies(Species.CONKELDURR, 5, false, false, false, "Muscular Pokémon", Type.FIGHTING, null, 1.4, 87, Abilities.GUTS, Abilities.SHEER_FORCE, Abilities.IRON_FIST, 505, 105, 140, 95, 55, 65, 45, 45, 50, 253, GrowthRate.MEDIUM_SLOW, 75, false),
    new PokemonSpecies(Species.TYMPOLE, 5, false, false, false, "Tadpole Pokémon", Type.WATER, null, 0.5, 4.5, Abilities.SWIFT_SWIM, Abilities.HYDRATION, Abilities.WATER_ABSORB, 294, 50, 50, 40, 50, 40, 64, 255, 50, 59, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.PALPITOAD, 5, false, false, false, "Vibration Pokémon", Type.WATER, Type.GROUND, 0.8, 17, Abilities.SWIFT_SWIM, Abilities.HYDRATION, Abilities.WATER_ABSORB, 384, 75, 65, 55, 65, 55, 69, 120, 50, 134, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.SEISMITOAD, 5, false, false, false, "Vibration Pokémon", Type.WATER, Type.GROUND, 1.5, 62, Abilities.SWIFT_SWIM, Abilities.POISON_TOUCH, Abilities.WATER_ABSORB, 509, 105, 95, 75, 85, 75, 74, 45, 50, 255, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.THROH, 5, false, false, false, "Judo Pokémon", Type.FIGHTING, null, 1.3, 55.5, Abilities.GUTS, Abilities.INNER_FOCUS, Abilities.MOLD_BREAKER, 465, 120, 100, 85, 30, 85, 45, 45, 50, 163, GrowthRate.MEDIUM_FAST, 100, false),
    new PokemonSpecies(Species.SAWK, 5, false, false, false, "Karate Pokémon", Type.FIGHTING, null, 1.4, 51, Abilities.STURDY, Abilities.INNER_FOCUS, Abilities.MOLD_BREAKER, 465, 75, 125, 75, 30, 75, 85, 45, 50, 163, GrowthRate.MEDIUM_FAST, 100, false),
    new PokemonSpecies(Species.SEWADDLE, 5, false, false, false, "Sewing Pokémon", Type.BUG, Type.GRASS, 0.3, 2.5, Abilities.SWARM, Abilities.CHLOROPHYLL, Abilities.OVERCOAT, 310, 45, 53, 70, 40, 60, 42, 255, 70, 62, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.SWADLOON, 5, false, false, false, "Leaf-Wrapped Pokémon", Type.BUG, Type.GRASS, 0.5, 7.3, Abilities.LEAF_GUARD, Abilities.CHLOROPHYLL, Abilities.OVERCOAT, 380, 55, 63, 90, 50, 80, 42, 120, 70, 133, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.LEAVANNY, 5, false, false, false, "Nurturing Pokémon", Type.BUG, Type.GRASS, 1.2, 20.5, Abilities.SWARM, Abilities.CHLOROPHYLL, Abilities.OVERCOAT, 500, 75, 103, 80, 70, 80, 92, 45, 70, 225, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.VENIPEDE, 5, false, false, false, "Centipede Pokémon", Type.BUG, Type.POISON, 0.4, 5.3, Abilities.POISON_POINT, Abilities.SWARM, Abilities.SPEED_BOOST, 260, 30, 45, 59, 30, 39, 57, 255, 50, 52, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.WHIRLIPEDE, 5, false, false, false, "Curlipede Pokémon", Type.BUG, Type.POISON, 1.2, 58.5, Abilities.POISON_POINT, Abilities.SWARM, Abilities.SPEED_BOOST, 360, 40, 55, 99, 40, 79, 47, 120, 50, 126, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.SCOLIPEDE, 5, false, false, false, "Megapede Pokémon", Type.BUG, Type.POISON, 2.5, 200.5, Abilities.POISON_POINT, Abilities.SWARM, Abilities.SPEED_BOOST, 485, 60, 100, 89, 55, 69, 112, 45, 50, 243, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.COTTONEE, 5, false, false, false, "Cotton Puff Pokémon", Type.GRASS, Type.FAIRY, 0.3, 0.6, Abilities.PRANKSTER, Abilities.INFILTRATOR, Abilities.CHLOROPHYLL, 280, 40, 27, 60, 37, 50, 66, 190, 50, 56, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.WHIMSICOTT, 5, false, false, false, "Windveiled Pokémon", Type.GRASS, Type.FAIRY, 0.7, 6.6, Abilities.PRANKSTER, Abilities.INFILTRATOR, Abilities.CHLOROPHYLL, 480, 60, 67, 85, 77, 75, 116, 75, 50, 168, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.PETILIL, 5, false, false, false, "Bulb Pokémon", Type.GRASS, null, 0.5, 6.6, Abilities.CHLOROPHYLL, Abilities.OWN_TEMPO, Abilities.LEAF_GUARD, 280, 45, 35, 50, 70, 50, 30, 190, 50, 56, GrowthRate.MEDIUM_FAST, 0, false),
    new PokemonSpecies(Species.LILLIGANT, 5, false, false, false, "Flowering Pokémon", Type.GRASS, null, 1.1, 16.3, Abilities.CHLOROPHYLL, Abilities.OWN_TEMPO, Abilities.LEAF_GUARD, 480, 70, 60, 75, 110, 75, 90, 75, 50, 168, GrowthRate.MEDIUM_FAST, 0, false),
    new PokemonSpecies(Species.BASCULIN, 5, false, false, false, "Hostile Pokémon", Type.WATER, null, 1, 18, Abilities.RECKLESS, Abilities.ADAPTABILITY, Abilities.MOLD_BREAKER, 460, 70, 92, 65, 80, 55, 98, 25, 50, 161, GrowthRate.MEDIUM_FAST, 50, false, false,
      new PokemonForm("Red-Striped Form", "red-striped", Type.WATER, null, 1, 18, Abilities.RECKLESS, Abilities.ADAPTABILITY, Abilities.MOLD_BREAKER, 460, 70, 92, 65, 80, 55, 98, 25, 50, 161, false, null, true),
      new PokemonForm("Blue-Striped Form", "blue-striped", Type.WATER, null, 1, 18, Abilities.ROCK_HEAD, Abilities.ADAPTABILITY, Abilities.MOLD_BREAKER, 460, 70, 92, 65, 80, 55, 98, 25, 50, 161, false, null, true),
      new PokemonForm("White-Striped Form", "white-striped", Type.WATER, null, 1, 18, Abilities.RATTLED, Abilities.ADAPTABILITY, Abilities.MOLD_BREAKER, 460, 70, 92, 65, 80, 55, 98, 25, 50, 161, false, null, true),
    ),
    new PokemonSpecies(Species.SANDILE, 5, false, false, false, "Desert Croc Pokémon", Type.GROUND, Type.DARK, 0.7, 15.2, Abilities.INTIMIDATE, Abilities.MOXIE, Abilities.ANGER_POINT, 292, 50, 72, 35, 35, 35, 65, 180, 50, 58, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.KROKOROK, 5, false, false, false, "Desert Croc Pokémon", Type.GROUND, Type.DARK, 1, 33.4, Abilities.INTIMIDATE, Abilities.MOXIE, Abilities.ANGER_POINT, 351, 60, 82, 45, 45, 45, 74, 90, 50, 123, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.KROOKODILE, 5, false, false, false, "Intimidation Pokémon", Type.GROUND, Type.DARK, 1.5, 96.3, Abilities.INTIMIDATE, Abilities.MOXIE, Abilities.ANGER_POINT, 519, 95, 117, 80, 65, 70, 92, 45, 50, 260, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.DARUMAKA, 5, false, false, false, "Zen Charm Pokémon", Type.FIRE, null, 0.6, 37.5, Abilities.HUSTLE, Abilities.NONE, Abilities.INNER_FOCUS, 315, 70, 90, 45, 15, 45, 50, 120, 50, 63, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.DARMANITAN, 5, false, false, false, "Blazing Pokémon", Type.FIRE, null, 1.3, 92.9, Abilities.SHEER_FORCE, Abilities.NONE, Abilities.ZEN_MODE, 480, 105, 140, 55, 30, 55, 95, 60, 50, 168, GrowthRate.MEDIUM_SLOW, 50, false, true,
      new PokemonForm("Standard Mode", "", Type.FIRE, null, 1.3, 92.9, Abilities.SHEER_FORCE, Abilities.NONE, Abilities.ZEN_MODE, 480, 105, 140, 55, 30, 55, 95, 60, 50, 168),
      new PokemonForm("Zen Mode", "zen", Type.FIRE, Type.PSYCHIC, 1.3, 92.9, Abilities.SHEER_FORCE, Abilities.NONE, Abilities.ZEN_MODE, 540, 105, 30, 105, 140, 105, 55, 60, 50, 168),
    ),
    new PokemonSpecies(Species.MARACTUS, 5, false, false, false, "Cactus Pokémon", Type.GRASS, null, 1, 28, Abilities.WATER_ABSORB, Abilities.CHLOROPHYLL, Abilities.STORM_DRAIN, 461, 75, 86, 67, 106, 67, 60, 255, 50, 161, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.DWEBBLE, 5, false, false, false, "Rock Inn Pokémon", Type.BUG, Type.ROCK, 0.3, 14.5, Abilities.STURDY, Abilities.SHELL_ARMOR, Abilities.WEAK_ARMOR, 325, 50, 65, 85, 35, 35, 55, 190, 50, 65, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.CRUSTLE, 5, false, false, false, "Stone Home Pokémon", Type.BUG, Type.ROCK, 1.4, 200, Abilities.STURDY, Abilities.SHELL_ARMOR, Abilities.WEAK_ARMOR, 485, 70, 105, 125, 65, 75, 45, 75, 50, 170, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.SCRAGGY, 5, false, false, false, "Shedding Pokémon", Type.DARK, Type.FIGHTING, 0.6, 11.8, Abilities.SHED_SKIN, Abilities.MOXIE, Abilities.INTIMIDATE, 348, 50, 75, 70, 35, 70, 48, 180, 35, 70, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.SCRAFTY, 5, false, false, false, "Hoodlum Pokémon", Type.DARK, Type.FIGHTING, 1.1, 30, Abilities.SHED_SKIN, Abilities.MOXIE, Abilities.INTIMIDATE, 488, 65, 90, 115, 45, 115, 58, 90, 50, 171, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.SIGILYPH, 5, false, false, false, "Avianoid Pokémon", Type.PSYCHIC, Type.FLYING, 1.4, 14, Abilities.WONDER_SKIN, Abilities.MAGIC_GUARD, Abilities.TINTED_LENS, 490, 72, 58, 80, 103, 80, 97, 45, 50, 172, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.YAMASK, 5, false, false, false, "Spirit Pokémon", Type.GHOST, null, 0.5, 1.5, Abilities.MUMMY, Abilities.NONE, Abilities.NONE, 303, 38, 30, 85, 55, 65, 30, 190, 50, 61, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.COFAGRIGUS, 5, false, false, false, "Coffin Pokémon", Type.GHOST, null, 1.7, 76.5, Abilities.MUMMY, Abilities.NONE, Abilities.NONE, 483, 58, 50, 145, 95, 105, 30, 90, 50, 169, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.TIRTOUGA, 5, false, false, false, "Prototurtle Pokémon", Type.WATER, Type.ROCK, 0.7, 16.5, Abilities.SOLID_ROCK, Abilities.STURDY, Abilities.SWIFT_SWIM, 355, 54, 78, 103, 53, 45, 22, 45, 50, 71, GrowthRate.MEDIUM_FAST, 87.5, false),
    new PokemonSpecies(Species.CARRACOSTA, 5, false, false, false, "Prototurtle Pokémon", Type.WATER, Type.ROCK, 1.2, 81, Abilities.SOLID_ROCK, Abilities.STURDY, Abilities.SWIFT_SWIM, 495, 74, 108, 133, 83, 65, 32, 45, 50, 173, GrowthRate.MEDIUM_FAST, 87.5, false),
    new PokemonSpecies(Species.ARCHEN, 5, false, false, false, "First Bird Pokémon", Type.ROCK, Type.FLYING, 0.5, 9.5, Abilities.DEFEATIST, Abilities.NONE, Abilities.NONE, 401, 55, 112, 45, 74, 45, 70, 45, 50, 71, GrowthRate.MEDIUM_FAST, 87.5, false),
    new PokemonSpecies(Species.ARCHEOPS, 5, false, false, false, "First Bird Pokémon", Type.ROCK, Type.FLYING, 1.4, 32, Abilities.DEFEATIST, Abilities.NONE, Abilities.NONE, 567, 75, 140, 65, 112, 65, 110, 45, 50, 177, GrowthRate.MEDIUM_FAST, 87.5, false),
    new PokemonSpecies(Species.TRUBBISH, 5, false, false, false, "Trash Bag Pokémon", Type.POISON, null, 0.6, 31, Abilities.STENCH, Abilities.STICKY_HOLD, Abilities.AFTERMATH, 329, 50, 50, 62, 40, 62, 65, 190, 50, 66, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.GARBODOR, 5, false, false, false, "Trash Heap Pokémon", Type.POISON, null, 1.9, 107.3, Abilities.STENCH, Abilities.WEAK_ARMOR, Abilities.AFTERMATH, 474, 80, 95, 82, 60, 82, 75, 60, 50, 166, GrowthRate.MEDIUM_FAST, 50, false, true,
      new PokemonForm("Normal", "", Type.POISON, null, 1.9, 107.3, Abilities.STENCH, Abilities.WEAK_ARMOR, Abilities.AFTERMATH, 474, 80, 95, 82, 60, 82, 75, 60, 50, 166),
      new PokemonForm("G-Max", SpeciesFormKey.GIGANTAMAX, Type.POISON, null, 21, 107.3, Abilities.STENCH, Abilities.WEAK_ARMOR, Abilities.AFTERMATH, 574, 100, 125, 102, 80, 102, 65, 60, 50, 166),
    ),
    new PokemonSpecies(Species.ZORUA, 5, false, false, false, "Tricky Fox Pokémon", Type.DARK, null, 0.7, 12.5, Abilities.ILLUSION, Abilities.NONE, Abilities.NONE, 330, 40, 65, 40, 80, 40, 65, 75, 50, 66, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.ZOROARK, 5, false, false, false, "Illusion Fox Pokémon", Type.DARK, null, 1.6, 81.1, Abilities.ILLUSION, Abilities.NONE, Abilities.NONE, 510, 60, 105, 60, 120, 60, 105, 45, 50, 179, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.MINCCINO, 5, false, false, false, "Chinchilla Pokémon", Type.NORMAL, null, 0.4, 5.8, Abilities.CUTE_CHARM, Abilities.TECHNICIAN, Abilities.SKILL_LINK, 300, 55, 50, 40, 40, 40, 75, 255, 50, 60, GrowthRate.FAST, 25, false),
    new PokemonSpecies(Species.CINCCINO, 5, false, false, false, "Scarf Pokémon", Type.NORMAL, null, 0.5, 7.5, Abilities.CUTE_CHARM, Abilities.TECHNICIAN, Abilities.SKILL_LINK, 470, 75, 95, 60, 65, 60, 115, 60, 50, 165, GrowthRate.FAST, 25, false),
    new PokemonSpecies(Species.GOTHITA, 5, false, false, false, "Fixation Pokémon", Type.PSYCHIC, null, 0.4, 5.8, Abilities.FRISK, Abilities.COMPETITIVE, Abilities.SHADOW_TAG, 290, 45, 30, 50, 55, 65, 45, 200, 50, 58, GrowthRate.MEDIUM_SLOW, 25, false),
    new PokemonSpecies(Species.GOTHORITA, 5, false, false, false, "Manipulate Pokémon", Type.PSYCHIC, null, 0.7, 18, Abilities.FRISK, Abilities.COMPETITIVE, Abilities.SHADOW_TAG, 390, 60, 45, 70, 75, 85, 55, 100, 50, 137, GrowthRate.MEDIUM_SLOW, 25, false),
    new PokemonSpecies(Species.GOTHITELLE, 5, false, false, false, "Astral Body Pokémon", Type.PSYCHIC, null, 1.5, 44, Abilities.FRISK, Abilities.COMPETITIVE, Abilities.SHADOW_TAG, 490, 70, 55, 95, 95, 110, 65, 50, 50, 245, GrowthRate.MEDIUM_SLOW, 25, false),
    new PokemonSpecies(Species.SOLOSIS, 5, false, false, false, "Cell Pokémon", Type.PSYCHIC, null, 0.3, 1, Abilities.OVERCOAT, Abilities.MAGIC_GUARD, Abilities.REGENERATOR, 290, 45, 30, 40, 105, 50, 20, 200, 50, 58, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.DUOSION, 5, false, false, false, "Mitosis Pokémon", Type.PSYCHIC, null, 0.6, 8, Abilities.OVERCOAT, Abilities.MAGIC_GUARD, Abilities.REGENERATOR, 370, 65, 40, 50, 125, 60, 30, 100, 50, 130, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.REUNICLUS, 5, false, false, false, "Multiplying Pokémon", Type.PSYCHIC, null, 1, 20.1, Abilities.OVERCOAT, Abilities.MAGIC_GUARD, Abilities.REGENERATOR, 490, 110, 65, 75, 125, 85, 30, 50, 50, 245, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.DUCKLETT, 5, false, false, false, "Water Bird Pokémon", Type.WATER, Type.FLYING, 0.5, 5.5, Abilities.KEEN_EYE, Abilities.BIG_PECKS, Abilities.HYDRATION, 305, 62, 44, 50, 44, 50, 55, 190, 70, 61, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.SWANNA, 5, false, false, false, "White Bird Pokémon", Type.WATER, Type.FLYING, 1.3, 24.2, Abilities.KEEN_EYE, Abilities.BIG_PECKS, Abilities.HYDRATION, 473, 75, 87, 63, 87, 63, 98, 45, 70, 166, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.VANILLITE, 5, false, false, false, "Fresh Snow Pokémon", Type.ICE, null, 0.4, 5.7, Abilities.ICE_BODY, Abilities.SNOW_CLOAK, Abilities.WEAK_ARMOR, 305, 36, 50, 50, 65, 60, 44, 255, 50, 61, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.VANILLISH, 5, false, false, false, "Icy Snow Pokémon", Type.ICE, null, 1.1, 41, Abilities.ICE_BODY, Abilities.SNOW_CLOAK, Abilities.WEAK_ARMOR, 395, 51, 65, 65, 80, 75, 59, 120, 50, 138, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.VANILLUXE, 5, false, false, false, "Snowstorm Pokémon", Type.ICE, null, 1.3, 57.5, Abilities.ICE_BODY, Abilities.SNOW_WARNING, Abilities.WEAK_ARMOR, 535, 71, 95, 85, 110, 95, 79, 45, 50, 268, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.DEERLING, 5, false, false, false, "Season Pokémon", Type.NORMAL, Type.GRASS, 0.6, 19.5, Abilities.CHLOROPHYLL, Abilities.SAP_SIPPER, Abilities.SERENE_GRACE, 335, 60, 60, 50, 40, 50, 75, 190, 70, 67, GrowthRate.MEDIUM_FAST, 50, false, true,
      new PokemonForm("Spring Form", "spring", Type.NORMAL, Type.GRASS, 0.6, 19.5, Abilities.CHLOROPHYLL, Abilities.SAP_SIPPER, Abilities.SERENE_GRACE, 335, 60, 60, 50, 40, 50, 75, 190, 70, 67, false, null, true),
      new PokemonForm("Summer Form", "summer", Type.NORMAL, Type.GRASS, 0.6, 19.5, Abilities.CHLOROPHYLL, Abilities.SAP_SIPPER, Abilities.SERENE_GRACE, 335, 60, 60, 50, 40, 50, 75, 190, 70, 67, false, null, true),
      new PokemonForm("Autumn Form", "autumn", Type.NORMAL, Type.GRASS, 0.6, 19.5, Abilities.CHLOROPHYLL, Abilities.SAP_SIPPER, Abilities.SERENE_GRACE, 335, 60, 60, 50, 40, 50, 75, 190, 70, 67, false, null, true),
      new PokemonForm("Winter Form", "winter", Type.NORMAL, Type.GRASS, 0.6, 19.5, Abilities.CHLOROPHYLL, Abilities.SAP_SIPPER, Abilities.SERENE_GRACE, 335, 60, 60, 50, 40, 50, 75, 190, 70, 67, false, null, true),
    ),
    new PokemonSpecies(Species.SAWSBUCK, 5, false, false, false, "Season Pokémon", Type.NORMAL, Type.GRASS, 1.9, 92.5, Abilities.CHLOROPHYLL, Abilities.SAP_SIPPER, Abilities.SERENE_GRACE, 475, 80, 100, 70, 60, 70, 95, 75, 70, 166, GrowthRate.MEDIUM_FAST, 50, false, true,
      new PokemonForm("Spring Form", "spring", Type.NORMAL, Type.GRASS, 1.9, 92.5, Abilities.CHLOROPHYLL, Abilities.SAP_SIPPER, Abilities.SERENE_GRACE, 475, 80, 100, 70, 60, 70, 95, 75, 70, 166),
      new PokemonForm("Summer Form", "summer", Type.NORMAL, Type.GRASS, 1.9, 92.5, Abilities.CHLOROPHYLL, Abilities.SAP_SIPPER, Abilities.SERENE_GRACE, 475, 80, 100, 70, 60, 70, 95, 75, 70, 166),
      new PokemonForm("Autumn Form", "autumn", Type.NORMAL, Type.GRASS, 1.9, 92.5, Abilities.CHLOROPHYLL, Abilities.SAP_SIPPER, Abilities.SERENE_GRACE, 475, 80, 100, 70, 60, 70, 95, 75, 70, 166),
      new PokemonForm("Winter Form", "winter", Type.NORMAL, Type.GRASS, 1.9, 92.5, Abilities.CHLOROPHYLL, Abilities.SAP_SIPPER, Abilities.SERENE_GRACE, 475, 80, 100, 70, 60, 70, 95, 75, 70, 166),
    ),
    new PokemonSpecies(Species.EMOLGA, 5, false, false, false, "Sky Squirrel Pokémon", Type.ELECTRIC, Type.FLYING, 0.4, 5, Abilities.STATIC, Abilities.NONE, Abilities.MOTOR_DRIVE, 428, 55, 75, 60, 75, 60, 103, 200, 50, 150, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.KARRABLAST, 5, false, false, false, "Clamping Pokémon", Type.BUG, null, 0.5, 5.9, Abilities.SWARM, Abilities.SHED_SKIN, Abilities.NO_GUARD, 315, 50, 75, 45, 40, 45, 60, 200, 50, 63, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.ESCAVALIER, 5, false, false, false, "Cavalry Pokémon", Type.BUG, Type.STEEL, 1, 33, Abilities.SWARM, Abilities.SHELL_ARMOR, Abilities.OVERCOAT, 495, 70, 135, 105, 60, 105, 20, 75, 50, 173, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.FOONGUS, 5, false, false, false, "Mushroom Pokémon", Type.GRASS, Type.POISON, 0.2, 1, Abilities.EFFECT_SPORE, Abilities.NONE, Abilities.REGENERATOR, 294, 69, 55, 45, 55, 55, 15, 190, 50, 59, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.AMOONGUSS, 5, false, false, false, "Mushroom Pokémon", Type.GRASS, Type.POISON, 0.6, 10.5, Abilities.EFFECT_SPORE, Abilities.NONE, Abilities.REGENERATOR, 464, 114, 85, 70, 85, 80, 30, 75, 50, 162, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.FRILLISH, 5, false, false, false, "Floating Pokémon", Type.WATER, Type.GHOST, 1.2, 33, Abilities.WATER_ABSORB, Abilities.CURSED_BODY, Abilities.DAMP, 335, 55, 40, 50, 65, 85, 40, 190, 50, 67, GrowthRate.MEDIUM_FAST, 50, true),
    new PokemonSpecies(Species.JELLICENT, 5, false, false, false, "Floating Pokémon", Type.WATER, Type.GHOST, 2.2, 135, Abilities.WATER_ABSORB, Abilities.CURSED_BODY, Abilities.DAMP, 480, 100, 60, 70, 85, 105, 60, 60, 50, 168, GrowthRate.MEDIUM_FAST, 50, true),
    new PokemonSpecies(Species.ALOMOMOLA, 5, false, false, false, "Caring Pokémon", Type.WATER, null, 1.2, 31.6, Abilities.HEALER, Abilities.HYDRATION, Abilities.REGENERATOR, 470, 165, 75, 80, 40, 45, 65, 75, 70, 165, GrowthRate.FAST, 50, false),
    new PokemonSpecies(Species.JOLTIK, 5, false, false, false, "Attaching Pokémon", Type.BUG, Type.ELECTRIC, 0.1, 0.6, Abilities.COMPOUND_EYES, Abilities.UNNERVE, Abilities.SWARM, 319, 50, 47, 50, 57, 50, 65, 190, 50, 64, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.GALVANTULA, 5, false, false, false, "EleSpider Pokémon", Type.BUG, Type.ELECTRIC, 0.8, 14.3, Abilities.COMPOUND_EYES, Abilities.UNNERVE, Abilities.SWARM, 472, 70, 77, 60, 97, 60, 108, 75, 50, 165, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.FERROSEED, 5, false, false, false, "Thorn Seed Pokémon", Type.GRASS, Type.STEEL, 0.6, 18.8, Abilities.IRON_BARBS, Abilities.NONE, Abilities.IRON_BARBS, 305, 44, 50, 91, 24, 86, 10, 255, 50, 61, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.FERROTHORN, 5, false, false, false, "Thorn Pod Pokémon", Type.GRASS, Type.STEEL, 1, 110, Abilities.IRON_BARBS, Abilities.NONE, Abilities.ANTICIPATION, 489, 74, 94, 131, 54, 116, 20, 90, 50, 171, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.KLINK, 5, false, false, false, "Gear Pokémon", Type.STEEL, null, 0.3, 21, Abilities.PLUS, Abilities.MINUS, Abilities.CLEAR_BODY, 300, 40, 55, 70, 45, 60, 30, 130, 50, 60, GrowthRate.MEDIUM_SLOW, null, false),
    new PokemonSpecies(Species.KLANG, 5, false, false, false, "Gear Pokémon", Type.STEEL, null, 0.6, 51, Abilities.PLUS, Abilities.MINUS, Abilities.CLEAR_BODY, 440, 60, 80, 95, 70, 85, 50, 60, 50, 154, GrowthRate.MEDIUM_SLOW, null, false),
    new PokemonSpecies(Species.KLINKLANG, 5, false, false, false, "Gear Pokémon", Type.STEEL, null, 0.6, 81, Abilities.PLUS, Abilities.MINUS, Abilities.CLEAR_BODY, 520, 60, 100, 115, 70, 85, 90, 30, 50, 260, GrowthRate.MEDIUM_SLOW, null, false),
    new PokemonSpecies(Species.TYNAMO, 5, false, false, false, "EleFish Pokémon", Type.ELECTRIC, null, 0.2, 0.3, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 275, 35, 55, 40, 45, 40, 60, 190, 70, 55, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.EELEKTRIK, 5, false, false, false, "EleFish Pokémon", Type.ELECTRIC, null, 1.2, 22, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 405, 65, 85, 70, 75, 70, 40, 60, 70, 142, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.EELEKTROSS, 5, false, false, false, "EleFish Pokémon", Type.ELECTRIC, null, 2.1, 80.5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 515, 85, 115, 80, 105, 80, 50, 30, 70, 232, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.ELGYEM, 5, false, false, false, "Cerebral Pokémon", Type.PSYCHIC, null, 0.5, 9, Abilities.TELEPATHY, Abilities.SYNCHRONIZE, Abilities.ANALYTIC, 335, 55, 55, 55, 85, 55, 30, 255, 50, 67, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.BEHEEYEM, 5, false, false, false, "Cerebral Pokémon", Type.PSYCHIC, null, 1, 34.5, Abilities.TELEPATHY, Abilities.SYNCHRONIZE, Abilities.ANALYTIC, 485, 75, 75, 75, 125, 95, 40, 90, 50, 170, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.LITWICK, 5, false, false, false, "Candle Pokémon", Type.GHOST, Type.FIRE, 0.3, 3.1, Abilities.FLASH_FIRE, Abilities.FLAME_BODY, Abilities.INFILTRATOR, 275, 50, 30, 55, 65, 55, 20, 190, 50, 55, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.LAMPENT, 5, false, false, false, "Lamp Pokémon", Type.GHOST, Type.FIRE, 0.6, 13, Abilities.FLASH_FIRE, Abilities.FLAME_BODY, Abilities.INFILTRATOR, 370, 60, 40, 60, 95, 60, 55, 90, 50, 130, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.CHANDELURE, 5, false, false, false, "Luring Pokémon", Type.GHOST, Type.FIRE, 1, 34.3, Abilities.FLASH_FIRE, Abilities.FLAME_BODY, Abilities.INFILTRATOR, 520, 60, 55, 90, 145, 90, 80, 45, 50, 260, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.AXEW, 5, false, false, false, "Tusk Pokémon", Type.DRAGON, null, 0.6, 18, Abilities.RIVALRY, Abilities.MOLD_BREAKER, Abilities.UNNERVE, 320, 46, 87, 60, 30, 40, 57, 75, 35, 64, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.FRAXURE, 5, false, false, false, "Axe Jaw Pokémon", Type.DRAGON, null, 1, 36, Abilities.RIVALRY, Abilities.MOLD_BREAKER, Abilities.UNNERVE, 410, 66, 117, 70, 40, 50, 67, 60, 35, 144, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.HAXORUS, 5, false, false, false, "Axe Jaw Pokémon", Type.DRAGON, null, 1.8, 105.5, Abilities.RIVALRY, Abilities.MOLD_BREAKER, Abilities.UNNERVE, 540, 76, 147, 90, 60, 70, 97, 45, 35, 270, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.CUBCHOO, 5, false, false, false, "Chill Pokémon", Type.ICE, null, 0.5, 8.5, Abilities.SNOW_CLOAK, Abilities.SLUSH_RUSH, Abilities.RATTLED, 305, 55, 70, 40, 60, 40, 40, 120, 50, 61, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.BEARTIC, 5, false, false, false, "Freezing Pokémon", Type.ICE, null, 2.6, 260, Abilities.SNOW_CLOAK, Abilities.SLUSH_RUSH, Abilities.SWIFT_SWIM, 505, 95, 130, 80, 70, 80, 50, 60, 50, 177, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.CRYOGONAL, 5, false, false, false, "Crystallizing Pokémon", Type.ICE, null, 1.1, 148, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 515, 80, 50, 50, 95, 135, 105, 25, 50, 180, GrowthRate.MEDIUM_FAST, null, false),
    new PokemonSpecies(Species.SHELMET, 5, false, false, false, "Snail Pokémon", Type.BUG, null, 0.4, 7.7, Abilities.HYDRATION, Abilities.SHELL_ARMOR, Abilities.OVERCOAT, 305, 50, 40, 85, 40, 65, 25, 200, 50, 61, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.ACCELGOR, 5, false, false, false, "Shell Out Pokémon", Type.BUG, null, 0.8, 25.3, Abilities.HYDRATION, Abilities.STICKY_HOLD, Abilities.UNBURDEN, 495, 80, 70, 40, 100, 60, 145, 75, 50, 173, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.STUNFISK, 5, false, false, false, "Trap Pokémon", Type.GROUND, Type.ELECTRIC, 0.7, 11, Abilities.STATIC, Abilities.LIMBER, Abilities.SAND_VEIL, 471, 109, 66, 84, 81, 99, 32, 75, 70, 165, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.MIENFOO, 5, false, false, false, "Martial Arts Pokémon", Type.FIGHTING, null, 0.9, 20, Abilities.INNER_FOCUS, Abilities.REGENERATOR, Abilities.RECKLESS, 350, 45, 85, 50, 55, 50, 65, 180, 50, 70, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.MIENSHAO, 5, false, false, false, "Martial Arts Pokémon", Type.FIGHTING, null, 1.4, 35.5, Abilities.INNER_FOCUS, Abilities.REGENERATOR, Abilities.RECKLESS, 510, 65, 125, 60, 95, 60, 105, 45, 50, 179, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.DRUDDIGON, 5, false, false, false, "Cave Pokémon", Type.DRAGON, null, 1.6, 139, Abilities.ROUGH_SKIN, Abilities.SHEER_FORCE, Abilities.MOLD_BREAKER, 485, 77, 120, 90, 60, 90, 48, 45, 50, 170, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.GOLETT, 5, false, false, false, "Automaton Pokémon", Type.GROUND, Type.GHOST, 1, 92, Abilities.IRON_FIST, Abilities.KLUTZ, Abilities.NO_GUARD, 303, 59, 74, 50, 35, 50, 35, 190, 50, 61, GrowthRate.MEDIUM_FAST, null, false),
    new PokemonSpecies(Species.GOLURK, 5, false, false, false, "Automaton Pokémon", Type.GROUND, Type.GHOST, 2.8, 330, Abilities.IRON_FIST, Abilities.KLUTZ, Abilities.NO_GUARD, 483, 89, 124, 80, 55, 80, 55, 90, 50, 169, GrowthRate.MEDIUM_FAST, null, false),
    new PokemonSpecies(Species.PAWNIARD, 5, false, false, false, "Sharp Blade Pokémon", Type.DARK, Type.STEEL, 0.5, 10.2, Abilities.DEFIANT, Abilities.INNER_FOCUS, Abilities.PRESSURE, 340, 45, 85, 70, 40, 40, 60, 120, 35, 68, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.BISHARP, 5, false, false, false, "Sword Blade Pokémon", Type.DARK, Type.STEEL, 1.6, 70, Abilities.DEFIANT, Abilities.INNER_FOCUS, Abilities.PRESSURE, 490, 65, 125, 100, 60, 70, 70, 45, 35, 172, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.BOUFFALANT, 5, false, false, false, "Bash Buffalo Pokémon", Type.NORMAL, null, 1.6, 94.6, Abilities.RECKLESS, Abilities.SAP_SIPPER, Abilities.SOUNDPROOF, 490, 95, 110, 95, 40, 95, 55, 45, 50, 172, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.RUFFLET, 5, false, false, false, "Eaglet Pokémon", Type.NORMAL, Type.FLYING, 0.5, 10.5, Abilities.KEEN_EYE, Abilities.SHEER_FORCE, Abilities.HUSTLE, 350, 70, 83, 50, 37, 50, 60, 190, 50, 70, GrowthRate.SLOW, 100, false),
    new PokemonSpecies(Species.BRAVIARY, 5, false, false, false, "Valiant Pokémon", Type.NORMAL, Type.FLYING, 1.5, 41, Abilities.KEEN_EYE, Abilities.SHEER_FORCE, Abilities.DEFIANT, 510, 100, 123, 75, 57, 75, 80, 60, 50, 179, GrowthRate.SLOW, 100, false),
    new PokemonSpecies(Species.VULLABY, 5, false, false, false, "Diapered Pokémon", Type.DARK, Type.FLYING, 0.5, 9, Abilities.BIG_PECKS, Abilities.OVERCOAT, Abilities.WEAK_ARMOR, 370, 70, 55, 75, 45, 65, 60, 190, 35, 74, GrowthRate.SLOW, 0, false),
    new PokemonSpecies(Species.MANDIBUZZ, 5, false, false, false, "Bone Vulture Pokémon", Type.DARK, Type.FLYING, 1.2, 39.5, Abilities.BIG_PECKS, Abilities.OVERCOAT, Abilities.WEAK_ARMOR, 510, 110, 65, 105, 55, 95, 80, 60, 35, 179, GrowthRate.SLOW, 0, false),
    new PokemonSpecies(Species.HEATMOR, 5, false, false, false, "Anteater Pokémon", Type.FIRE, null, 1.4, 58, Abilities.GLUTTONY, Abilities.FLASH_FIRE, Abilities.WHITE_SMOKE, 484, 85, 97, 66, 105, 66, 65, 90, 50, 169, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.DURANT, 5, false, false, false, "Iron Ant Pokémon", Type.BUG, Type.STEEL, 0.3, 33, Abilities.SWARM, Abilities.HUSTLE, Abilities.TRUANT, 484, 58, 109, 112, 48, 48, 109, 90, 50, 169, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.DEINO, 5, false, false, false, "Irate Pokémon", Type.DARK, Type.DRAGON, 0.8, 17.3, Abilities.HUSTLE, Abilities.NONE, Abilities.NONE, 300, 52, 65, 50, 45, 50, 38, 45, 35, 60, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.ZWEILOUS, 5, false, false, false, "Hostile Pokémon", Type.DARK, Type.DRAGON, 1.4, 50, Abilities.HUSTLE, Abilities.NONE, Abilities.NONE, 420, 72, 85, 70, 65, 70, 58, 45, 35, 147, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.HYDREIGON, 5, false, false, false, "Brutal Pokémon", Type.DARK, Type.DRAGON, 1.8, 160, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 600, 92, 105, 90, 125, 90, 98, 45, 35, 300, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.LARVESTA, 5, false, false, false, "Torch Pokémon", Type.BUG, Type.FIRE, 1.1, 28.8, Abilities.FLAME_BODY, Abilities.NONE, Abilities.SWARM, 360, 55, 85, 55, 50, 55, 60, 45, 50, 72, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.VOLCARONA, 5, false, false, false, "Sun Pokémon", Type.BUG, Type.FIRE, 1.6, 46, Abilities.FLAME_BODY, Abilities.NONE, Abilities.SWARM, 550, 85, 60, 65, 135, 105, 100, 15, 50, 275, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.COBALION, 5, true, false, false, "Iron Will Pokémon", Type.STEEL, Type.FIGHTING, 2.1, 250, Abilities.JUSTIFIED, Abilities.NONE, Abilities.NONE, 580, 91, 90, 129, 90, 72, 108, 3, 35, 290, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.TERRAKION, 5, true, false, false, "Cavern Pokémon", Type.ROCK, Type.FIGHTING, 1.9, 260, Abilities.JUSTIFIED, Abilities.NONE, Abilities.NONE, 580, 91, 129, 90, 72, 90, 108, 3, 35, 290, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.VIRIZION, 5, true, false, false, "Grassland Pokémon", Type.GRASS, Type.FIGHTING, 2, 200, Abilities.JUSTIFIED, Abilities.NONE, Abilities.NONE, 580, 91, 90, 72, 90, 129, 108, 3, 35, 290, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.TORNADUS, 5, true, false, false, "Cyclone Pokémon", Type.FLYING, null, 1.5, 63, Abilities.PRANKSTER, Abilities.NONE, Abilities.DEFIANT, 580, 79, 115, 70, 125, 80, 111, 3, 90, 290, GrowthRate.SLOW, 100, false, true,
      new PokemonForm("Incarnate Forme", "incarnate", Type.FLYING, null, 1.5, 63, Abilities.PRANKSTER, Abilities.NONE, Abilities.DEFIANT, 580, 79, 115, 70, 125, 80, 111, 3, 90, 290, false, null, true),
      new PokemonForm("Therian Forme", "therian", Type.FLYING, null, 1.4, 63, Abilities.REGENERATOR, Abilities.NONE, Abilities.REGENERATOR, 580, 79, 100, 80, 110, 90, 121, 3, 90, 290),
    ),
    new PokemonSpecies(Species.THUNDURUS, 5, true, false, false, "Bolt Strike Pokémon", Type.ELECTRIC, Type.FLYING, 1.5, 61, Abilities.PRANKSTER, Abilities.NONE, Abilities.DEFIANT, 580, 79, 115, 70, 125, 80, 111, 3, 90, 290, GrowthRate.SLOW, 100, false, true,
      new PokemonForm("Incarnate Forme", "incarnate", Type.ELECTRIC, Type.FLYING, 1.5, 61, Abilities.PRANKSTER, Abilities.NONE, Abilities.DEFIANT, 580, 79, 115, 70, 125, 80, 111, 3, 90, 290, false, null, true),
      new PokemonForm("Therian Forme", "therian", Type.ELECTRIC, Type.FLYING, 3, 61, Abilities.VOLT_ABSORB, Abilities.NONE, Abilities.VOLT_ABSORB, 580, 79, 105, 70, 145, 80, 101, 3, 90, 290),
    ),
    new PokemonSpecies(Species.RESHIRAM, 5, false, true, false, "Vast White Pokémon", Type.DRAGON, Type.FIRE, 3.2, 330, Abilities.TURBOBLAZE, Abilities.NONE, Abilities.NONE, 680, 100, 120, 100, 150, 120, 90, 3, 0, 340, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.ZEKROM, 5, false, true, false, "Deep Black Pokémon", Type.DRAGON, Type.ELECTRIC, 2.9, 345, Abilities.TERAVOLT, Abilities.NONE, Abilities.NONE, 680, 100, 150, 120, 120, 100, 90, 3, 0, 340, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.LANDORUS, 5, true, false, false, "Abundance Pokémon", Type.GROUND, Type.FLYING, 1.5, 68, Abilities.SAND_FORCE, Abilities.NONE, Abilities.SHEER_FORCE, 600, 89, 125, 90, 115, 80, 101, 3, 90, 300, GrowthRate.SLOW, 100, false, true,
      new PokemonForm("Incarnate Forme", "incarnate", Type.GROUND, Type.FLYING, 1.5, 68, Abilities.SAND_FORCE, Abilities.NONE, Abilities.SHEER_FORCE, 600, 89, 125, 90, 115, 80, 101, 3, 90, 300, false, null, true),
      new PokemonForm("Therian Forme", "therian", Type.GROUND, Type.FLYING, 1.3, 68, Abilities.INTIMIDATE, Abilities.NONE, Abilities.INTIMIDATE, 600, 89, 145, 90, 105, 80, 91, 3, 90, 300),
    ),
    new PokemonSpecies(Species.KYUREM, 5, false, true, false, "Boundary Pokémon", Type.DRAGON, Type.ICE, 3, 325, Abilities.PRESSURE, Abilities.NONE, Abilities.NONE, 660, 125, 130, 90, 130, 90, 95, 3, 0, 330, GrowthRate.SLOW, null, false, true,
      new PokemonForm("Normal", "", Type.DRAGON, Type.ICE, 3, 325, Abilities.PRESSURE, Abilities.NONE, Abilities.NONE, 660, 125, 130, 90, 130, 90, 95, 3, 0, 330),
      new PokemonForm("Black", "black", Type.DRAGON, Type.ICE, 3.3, 325, Abilities.TERAVOLT, Abilities.NONE, Abilities.NONE, 700, 125, 170, 100, 120, 90, 95, 3, 0, 330),
      new PokemonForm("White", "white", Type.DRAGON, Type.ICE, 3.6, 325, Abilities.TURBOBLAZE, Abilities.NONE, Abilities.NONE, 700, 125, 120, 90, 170, 100, 95, 3, 0, 330),
    ),
    new PokemonSpecies(Species.KELDEO, 5, false, false, true, "Colt Pokémon", Type.WATER, Type.FIGHTING, 1.4, 48.5, Abilities.JUSTIFIED, Abilities.NONE, Abilities.NONE, 580, 91, 72, 90, 129, 90, 108, 3, 35, 290, GrowthRate.SLOW, null, false, true,
      new PokemonForm("Ordinary Form", "ordinary", Type.WATER, Type.FIGHTING, 1.4, 48.5, Abilities.JUSTIFIED, Abilities.NONE, Abilities.NONE, 580, 91, 72, 90, 129, 90, 108, 3, 35, 290),
      new PokemonForm("Resolute", "resolute", Type.WATER, Type.FIGHTING, 1.4, 48.5, Abilities.JUSTIFIED, Abilities.NONE, Abilities.NONE, 580, 91, 72, 90, 129, 90, 108, 3, 35, 290),
    ),
    new PokemonSpecies(Species.MELOETTA, 5, false, false, true, "Melody Pokémon", Type.NORMAL, Type.PSYCHIC, 0.6, 6.5, Abilities.SERENE_GRACE, Abilities.NONE, Abilities.NONE, 600, 100, 77, 77, 128, 128, 90, 3, 100, 270, GrowthRate.SLOW, 0, false, true,
      new PokemonForm("Aria Forme", "aria", Type.NORMAL, Type.PSYCHIC, 0.6, 6.5, Abilities.SERENE_GRACE, Abilities.NONE, Abilities.NONE, 600, 100, 77, 77, 128, 128, 90, 3, 100, 270, false, null, true),
      new PokemonForm("Pirouette Forme", "pirouette", Type.NORMAL, Type.FIGHTING, 0.6, 6.5, Abilities.SERENE_GRACE, Abilities.NONE, Abilities.NONE, 600, 100, 128, 90, 77, 77, 128, 3, 100, 270),
    ),
    new PokemonSpecies(Species.GENESECT, 5, false, false, true, "Paleozoic Pokémon", Type.BUG, Type.STEEL, 1.5, 82.5, Abilities.DOWNLOAD, Abilities.NONE, Abilities.NONE, 600, 71, 120, 95, 120, 95, 99, 3, 0, 300, GrowthRate.SLOW, null, false, true,
      new PokemonForm("Normal", "", Type.BUG, Type.STEEL, 1.5, 82.5, Abilities.DOWNLOAD, Abilities.NONE, Abilities.NONE, 600, 71, 120, 95, 120, 95, 99, 3, 0, 300),
      new PokemonForm("Shock Drive", "shock", Type.BUG, Type.STEEL, 1.5, 82.5, Abilities.DOWNLOAD, Abilities.NONE, Abilities.NONE, 600, 71, 120, 95, 120, 95, 99, 3, 0, 300),
      new PokemonForm("Burn Drive", "burn", Type.BUG, Type.STEEL, 1.5, 82.5, Abilities.DOWNLOAD, Abilities.NONE, Abilities.NONE, 600, 71, 120, 95, 120, 95, 99, 3, 0, 300),
      new PokemonForm("Chill Drive", "chill", Type.BUG, Type.STEEL, 1.5, 82.5, Abilities.DOWNLOAD, Abilities.NONE, Abilities.NONE, 600, 71, 120, 95, 120, 95, 99, 3, 0, 300),
      new PokemonForm("Douse Drive", "douse", Type.BUG, Type.STEEL, 1.5, 82.5, Abilities.DOWNLOAD, Abilities.NONE, Abilities.NONE, 600, 71, 120, 95, 120, 95, 99, 3, 0, 300),
    ),
    new PokemonSpecies(Species.CHESPIN, 6, false, false, false, "Spiny Nut Pokémon", Type.GRASS, null, 0.4, 9, Abilities.OVERGROW, Abilities.NONE, Abilities.BULLETPROOF, 313, 56, 61, 65, 48, 45, 38, 45, 70, 63, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.QUILLADIN, 6, false, false, false, "Spiny Armor Pokémon", Type.GRASS, null, 0.7, 29, Abilities.OVERGROW, Abilities.NONE, Abilities.BULLETPROOF, 405, 61, 78, 95, 56, 58, 57, 45, 70, 142, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.CHESNAUGHT, 6, false, false, false, "Spiny Armor Pokémon", Type.GRASS, Type.FIGHTING, 1.6, 90, Abilities.OVERGROW, Abilities.NONE, Abilities.BULLETPROOF, 530, 88, 107, 122, 74, 75, 64, 45, 70, 239, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.FENNEKIN, 6, false, false, false, "Fox Pokémon", Type.FIRE, null, 0.4, 9.4, Abilities.BLAZE, Abilities.NONE, Abilities.MAGICIAN, 307, 40, 45, 40, 62, 60, 60, 45, 70, 61, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.BRAIXEN, 6, false, false, false, "Fox Pokémon", Type.FIRE, null, 1, 14.5, Abilities.BLAZE, Abilities.NONE, Abilities.MAGICIAN, 409, 59, 59, 58, 90, 70, 73, 45, 70, 143, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.DELPHOX, 6, false, false, false, "Fox Pokémon", Type.FIRE, Type.PSYCHIC, 1.5, 39, Abilities.BLAZE, Abilities.NONE, Abilities.MAGICIAN, 534, 75, 69, 72, 114, 100, 104, 45, 70, 240, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.FROAKIE, 6, false, false, false, "Bubble Frog Pokémon", Type.WATER, null, 0.3, 7, Abilities.TORRENT, Abilities.NONE, Abilities.PROTEAN, 314, 41, 56, 40, 62, 44, 71, 45, 70, 63, GrowthRate.MEDIUM_SLOW, 87.5, false, false,
      new PokemonForm("Normal", "", Type.WATER, null, 0.3, 7, Abilities.TORRENT, Abilities.NONE, Abilities.PROTEAN, 314, 41, 56, 40, 62, 44, 71, 45, 70, 63, false, null, true),
      new PokemonForm("Battle Bond", "battle-bond", Type.WATER, null, 0.3, 7, Abilities.TORRENT, Abilities.NONE, Abilities.PROTEAN, 314, 41, 56, 40, 62, 44, 71, 45, 70, 63, false, "", true),
    ),
    new PokemonSpecies(Species.FROGADIER, 6, false, false, false, "Bubble Frog Pokémon", Type.WATER, null, 0.6, 10.9, Abilities.TORRENT, Abilities.NONE, Abilities.PROTEAN, 405, 54, 63, 52, 83, 56, 97, 45, 70, 142, GrowthRate.MEDIUM_SLOW, 87.5, false, false,
      new PokemonForm("Normal", "", Type.WATER, null, 0.6, 10.9, Abilities.TORRENT, Abilities.NONE, Abilities.PROTEAN, 405, 54, 63, 52, 83, 56, 97, 45, 70, 142),
      new PokemonForm("Battle Bond", "battle-bond", Type.WATER, null, 0.6, 10.9, Abilities.TORRENT, Abilities.NONE, Abilities.PROTEAN, 405, 54, 63, 52, 83, 56, 97, 45, 70, 142, false, ""),
    ),
    new PokemonSpecies(Species.GRENINJA, 6, false, false, false, "Ninja Pokémon", Type.WATER, Type.DARK, 1.5, 40, Abilities.TORRENT, Abilities.NONE, Abilities.PROTEAN, 530, 72, 95, 67, 103, 71, 122, 45, 70, 239, GrowthRate.MEDIUM_SLOW, 87.5, false, false,
      new PokemonForm("Normal", "", Type.WATER, Type.DARK, 1.5, 40, Abilities.TORRENT, Abilities.NONE, Abilities.PROTEAN, 530, 72, 95, 67, 103, 71, 122, 45, 70, 239),
      new PokemonForm("Battle Bond", "battle-bond", Type.WATER, Type.DARK, 1.5, 40, Abilities.BATTLE_BOND, Abilities.NONE, Abilities.BATTLE_BOND, 530, 72, 95, 67, 103, 71, 122, 45, 70, 239, false, ""),
      new PokemonForm("Ash", "ash", Type.WATER, Type.DARK, 1.5, 40, Abilities.BATTLE_BOND, Abilities.NONE, Abilities.BATTLE_BOND, 640, 72, 145, 67, 153, 71, 132, 45, 70, 239),
    ),
    new PokemonSpecies(Species.BUNNELBY, 6, false, false, false, "Digging Pokémon", Type.NORMAL, null, 0.4, 5, Abilities.PICKUP, Abilities.CHEEK_POUCH, Abilities.HUGE_POWER, 237, 38, 36, 38, 32, 36, 57, 255, 50, 47, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.DIGGERSBY, 6, false, false, false, "Digging Pokémon", Type.NORMAL, Type.GROUND, 1, 42.4, Abilities.PICKUP, Abilities.CHEEK_POUCH, Abilities.HUGE_POWER, 423, 85, 56, 77, 50, 77, 78, 127, 50, 148, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.FLETCHLING, 6, false, false, false, "Tiny Robin Pokémon", Type.NORMAL, Type.FLYING, 0.3, 1.7, Abilities.BIG_PECKS, Abilities.NONE, Abilities.GALE_WINGS, 278, 45, 50, 43, 40, 38, 62, 255, 50, 56, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.FLETCHINDER, 6, false, false, false, "Ember Pokémon", Type.FIRE, Type.FLYING, 0.7, 16, Abilities.FLAME_BODY, Abilities.NONE, Abilities.GALE_WINGS, 382, 62, 73, 55, 56, 52, 84, 120, 50, 134, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.TALONFLAME, 6, false, false, false, "Scorching Pokémon", Type.FIRE, Type.FLYING, 1.2, 24.5, Abilities.FLAME_BODY, Abilities.NONE, Abilities.GALE_WINGS, 499, 78, 81, 71, 74, 69, 126, 45, 50, 175, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.SCATTERBUG, 6, false, false, false, "Scatterdust Pokémon", Type.BUG, null, 0.3, 2.5, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 200, 38, 35, 40, 27, 25, 35, 255, 70, 40, GrowthRate.MEDIUM_FAST, 50, false, false,
      new PokemonForm("Meadow Pattern", "meadow", Type.BUG, null, 0.3, 2.5, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 200, 38, 35, 40, 27, 25, 35, 255, 70, 40, false, "", true),
      new PokemonForm("Icy Snow Pattern", "icy-snow", Type.BUG, null, 0.3, 2.5, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 200, 38, 35, 40, 27, 25, 35, 255, 70, 40, false, "", true),
      new PokemonForm("Polar Pattern", "polar", Type.BUG, null, 0.3, 2.5, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 200, 38, 35, 40, 27, 25, 35, 255, 70, 40, false, "", true),
      new PokemonForm("Tundra Pattern", "tundra", Type.BUG, null, 0.3, 2.5, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 200, 38, 35, 40, 27, 25, 35, 255, 70, 40, false, "", true),
      new PokemonForm("Continental Pattern", "continental", Type.BUG, null, 0.3, 2.5, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 200, 38, 35, 40, 27, 25, 35, 255, 70, 40, false, "", true),
      new PokemonForm("Garden Pattern", "garden", Type.BUG, null, 0.3, 2.5, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 200, 38, 35, 40, 27, 25, 35, 255, 70, 40, false, "", true),
      new PokemonForm("Elegant Pattern", "elegant", Type.BUG, null, 0.3, 2.5, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 200, 38, 35, 40, 27, 25, 35, 255, 70, 40, false, "", true),
      new PokemonForm("Modern Pattern", "modern", Type.BUG, null, 0.3, 2.5, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 200, 38, 35, 40, 27, 25, 35, 255, 70, 40, false, "", true),
      new PokemonForm("Marine Pattern", "marine", Type.BUG, null, 0.3, 2.5, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 200, 38, 35, 40, 27, 25, 35, 255, 70, 40, false, "", true),
      new PokemonForm("Archipelago Pattern", "archipelago", Type.BUG, null, 0.3, 2.5, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 200, 38, 35, 40, 27, 25, 35, 255, 70, 40, false, "", true),
      new PokemonForm("High Plains Pattern", "high-plains", Type.BUG, null, 0.3, 2.5, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 200, 38, 35, 40, 27, 25, 35, 255, 70, 40, false, "", true),
      new PokemonForm("Sandstorm Pattern", "sandstorm", Type.BUG, null, 0.3, 2.5, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 200, 38, 35, 40, 27, 25, 35, 255, 70, 40, false, "", true),
      new PokemonForm("River Pattern", "river", Type.BUG, null, 0.3, 2.5, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 200, 38, 35, 40, 27, 25, 35, 255, 70, 40, false, "", true),
      new PokemonForm("Monsoon Pattern", "monsoon", Type.BUG, null, 0.3, 2.5, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 200, 38, 35, 40, 27, 25, 35, 255, 70, 40, false, "", true),
      new PokemonForm("Savanna Pattern", "savanna", Type.BUG, null, 0.3, 2.5, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 200, 38, 35, 40, 27, 25, 35, 255, 70, 40, false, "", true),
      new PokemonForm("Sun Pattern", "sun", Type.BUG, null, 0.3, 2.5, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 200, 38, 35, 40, 27, 25, 35, 255, 70, 40, false, "", true),
      new PokemonForm("Ocean Pattern", "ocean", Type.BUG, null, 0.3, 2.5, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 200, 38, 35, 40, 27, 25, 35, 255, 70, 40, false, "", true),
      new PokemonForm("Jungle Pattern", "jungle", Type.BUG, null, 0.3, 2.5, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 200, 38, 35, 40, 27, 25, 35, 255, 70, 40, false, "", true),
      new PokemonForm("Fancy Pattern", "fancy", Type.BUG, null, 0.3, 2.5, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 200, 38, 35, 40, 27, 25, 35, 255, 70, 40, false, "", true),
      new PokemonForm("Poké Ball Pattern", "poke-ball", Type.BUG, null, 0.3, 2.5, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 200, 38, 35, 40, 27, 25, 35, 255, 70, 40, false, "", true),
    ),
    new PokemonSpecies(Species.SPEWPA, 6, false, false, false, "Scatterdust Pokémon", Type.BUG, null, 0.3, 8.4, Abilities.SHED_SKIN, Abilities.SHED_SKIN, Abilities.FRIEND_GUARD, 213, 45, 22, 60, 27, 30, 29, 120, 70, 75, GrowthRate.MEDIUM_FAST, 50, false, false,
      new PokemonForm("Meadow Pattern", "meadow", Type.BUG, null, 0.3, 8.4, Abilities.SHED_SKIN, Abilities.NONE, Abilities.FRIEND_GUARD, 213, 45, 22, 60, 27, 30, 29, 120, 70, 75, false, ""),
      new PokemonForm("Icy Snow Pattern", "icy-snow", Type.BUG, null, 0.3, 8.4, Abilities.SHED_SKIN, Abilities.NONE, Abilities.FRIEND_GUARD, 213, 45, 22, 60, 27, 30, 29, 120, 70, 75, false, ""),
      new PokemonForm("Polar Pattern", "polar", Type.BUG, null, 0.3, 8.4, Abilities.SHED_SKIN, Abilities.NONE, Abilities.FRIEND_GUARD, 213, 45, 22, 60, 27, 30, 29, 120, 70, 75, false, ""),
      new PokemonForm("Tundra Pattern", "tundra", Type.BUG, null, 0.3, 8.4, Abilities.SHED_SKIN, Abilities.NONE, Abilities.FRIEND_GUARD, 213, 45, 22, 60, 27, 30, 29, 120, 70, 75, false, ""),
      new PokemonForm("Continental Pattern", "continental", Type.BUG, null, 0.3, 8.4, Abilities.SHED_SKIN, Abilities.NONE, Abilities.FRIEND_GUARD, 213, 45, 22, 60, 27, 30, 29, 120, 70, 75, false, ""),
      new PokemonForm("Garden Pattern", "garden", Type.BUG, null, 0.3, 8.4, Abilities.SHED_SKIN, Abilities.NONE, Abilities.FRIEND_GUARD, 213, 45, 22, 60, 27, 30, 29, 120, 70, 75, false, ""),
      new PokemonForm("Elegant Pattern", "elegant", Type.BUG, null, 0.3, 8.4, Abilities.SHED_SKIN, Abilities.NONE, Abilities.FRIEND_GUARD, 213, 45, 22, 60, 27, 30, 29, 120, 70, 75, false, ""),
      new PokemonForm("Modern Pattern", "modern", Type.BUG, null, 0.3, 8.4, Abilities.SHED_SKIN, Abilities.NONE, Abilities.FRIEND_GUARD, 213, 45, 22, 60, 27, 30, 29, 120, 70, 75, false, ""),
      new PokemonForm("Marine Pattern", "marine", Type.BUG, null, 0.3, 8.4, Abilities.SHED_SKIN, Abilities.NONE, Abilities.FRIEND_GUARD, 213, 45, 22, 60, 27, 30, 29, 120, 70, 75, false, ""),
      new PokemonForm("Archipelago Pattern", "archipelago", Type.BUG, null, 0.3, 8.4, Abilities.SHED_SKIN, Abilities.NONE, Abilities.FRIEND_GUARD, 213, 45, 22, 60, 27, 30, 29, 120, 70, 75, false, ""),
      new PokemonForm("High Plains Pattern", "high-plains", Type.BUG, null, 0.3, 8.4, Abilities.SHED_SKIN, Abilities.NONE, Abilities.FRIEND_GUARD, 213, 45, 22, 60, 27, 30, 29, 120, 70, 75, false, ""),
      new PokemonForm("Sandstorm Pattern", "sandstorm", Type.BUG, null, 0.3, 8.4, Abilities.SHED_SKIN, Abilities.NONE, Abilities.FRIEND_GUARD, 213, 45, 22, 60, 27, 30, 29, 120, 70, 75, false, ""),
      new PokemonForm("River Pattern", "river", Type.BUG, null, 0.3, 8.4, Abilities.SHED_SKIN, Abilities.NONE, Abilities.FRIEND_GUARD, 213, 45, 22, 60, 27, 30, 29, 120, 70, 75, false, ""),
      new PokemonForm("Monsoon Pattern", "monsoon", Type.BUG, null, 0.3, 8.4, Abilities.SHED_SKIN, Abilities.NONE, Abilities.FRIEND_GUARD, 213, 45, 22, 60, 27, 30, 29, 120, 70, 75, false, ""),
      new PokemonForm("Savanna Pattern", "savanna", Type.BUG, null, 0.3, 8.4, Abilities.SHED_SKIN, Abilities.NONE, Abilities.FRIEND_GUARD, 213, 45, 22, 60, 27, 30, 29, 120, 70, 75, false, ""),
      new PokemonForm("Sun Pattern", "sun", Type.BUG, null, 0.3, 8.4, Abilities.SHED_SKIN, Abilities.NONE, Abilities.FRIEND_GUARD, 213, 45, 22, 60, 27, 30, 29, 120, 70, 75, false, ""),
      new PokemonForm("Ocean Pattern", "ocean", Type.BUG, null, 0.3, 8.4, Abilities.SHED_SKIN, Abilities.NONE, Abilities.FRIEND_GUARD, 213, 45, 22, 60, 27, 30, 29, 120, 70, 75, false, ""),
      new PokemonForm("Jungle Pattern", "jungle", Type.BUG, null, 0.3, 8.4, Abilities.SHED_SKIN, Abilities.NONE, Abilities.FRIEND_GUARD, 213, 45, 22, 60, 27, 30, 29, 120, 70, 75, false, ""),
      new PokemonForm("Fancy Pattern", "fancy", Type.BUG, null, 0.3, 8.4, Abilities.SHED_SKIN, Abilities.NONE, Abilities.FRIEND_GUARD, 213, 45, 22, 60, 27, 30, 29, 120, 70, 75, false, ""),
      new PokemonForm("Poké Ball Pattern", "poke-ball", Type.BUG, null, 0.3, 8.4, Abilities.SHED_SKIN, Abilities.NONE, Abilities.FRIEND_GUARD, 213, 45, 22, 60, 27, 30, 29, 120, 70, 75, false, ""),
    ),
    new PokemonSpecies(Species.VIVILLON, 6, false, false, false, "Scale Pokémon", Type.BUG, Type.FLYING, 1.2, 17, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 411, 80, 52, 50, 90, 50, 89, 45, 70, 185, GrowthRate.MEDIUM_FAST, 50, false, false,
      new PokemonForm("Meadow Pattern", "meadow", Type.BUG, Type.FLYING, 1.2, 17, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 411, 80, 52, 50, 90, 50, 89, 45, 70, 185),
      new PokemonForm("Icy Snow Pattern", "icy-snow", Type.BUG, Type.FLYING, 1.2, 17, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 411, 80, 52, 50, 90, 50, 89, 45, 70, 185),
      new PokemonForm("Polar Pattern", "polar", Type.BUG, Type.FLYING, 1.2, 17, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 411, 80, 52, 50, 90, 50, 89, 45, 70, 185),
      new PokemonForm("Tundra Pattern", "tundra", Type.BUG, Type.FLYING, 1.2, 17, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 411, 80, 52, 50, 90, 50, 89, 45, 70, 185),
      new PokemonForm("Continental Pattern", "continental", Type.BUG, Type.FLYING, 1.2, 17, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 411, 80, 52, 50, 90, 50, 89, 45, 70, 185),
      new PokemonForm("Garden Pattern", "garden", Type.BUG, Type.FLYING, 1.2, 17, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 411, 80, 52, 50, 90, 50, 89, 45, 70, 185),
      new PokemonForm("Elegant Pattern", "elegant", Type.BUG, Type.FLYING, 1.2, 17, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 411, 80, 52, 50, 90, 50, 89, 45, 70, 185),
      new PokemonForm("Modern Pattern", "modern", Type.BUG, Type.FLYING, 1.2, 17, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 411, 80, 52, 50, 90, 50, 89, 45, 70, 185),
      new PokemonForm("Marine Pattern", "marine", Type.BUG, Type.FLYING, 1.2, 17, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 411, 80, 52, 50, 90, 50, 89, 45, 70, 185),
      new PokemonForm("Archipelago Pattern", "archipelago", Type.BUG, Type.FLYING, 1.2, 17, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 411, 80, 52, 50, 90, 50, 89, 45, 70, 185),
      new PokemonForm("High Plains Pattern", "high-plains", Type.BUG, Type.FLYING, 1.2, 17, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 411, 80, 52, 50, 90, 50, 89, 45, 70, 185),
      new PokemonForm("Sandstorm Pattern", "sandstorm", Type.BUG, Type.FLYING, 1.2, 17, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 411, 80, 52, 50, 90, 50, 89, 45, 70, 185),
      new PokemonForm("River Pattern", "river", Type.BUG, Type.FLYING, 1.2, 17, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 411, 80, 52, 50, 90, 50, 89, 45, 70, 185),
      new PokemonForm("Monsoon Pattern", "monsoon", Type.BUG, Type.FLYING, 1.2, 17, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 411, 80, 52, 50, 90, 50, 89, 45, 70, 185),
      new PokemonForm("Savanna Pattern", "savanna", Type.BUG, Type.FLYING, 1.2, 17, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 411, 80, 52, 50, 90, 50, 89, 45, 70, 185),
      new PokemonForm("Sun Pattern", "sun", Type.BUG, Type.FLYING, 1.2, 17, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 411, 80, 52, 50, 90, 50, 89, 45, 70, 185),
      new PokemonForm("Ocean Pattern", "ocean", Type.BUG, Type.FLYING, 1.2, 17, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 411, 80, 52, 50, 90, 50, 89, 45, 70, 185),
      new PokemonForm("Jungle Pattern", "jungle", Type.BUG, Type.FLYING, 1.2, 17, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 411, 80, 52, 50, 90, 50, 89, 45, 70, 185),
      new PokemonForm("Fancy Pattern", "fancy", Type.BUG, Type.FLYING, 1.2, 17, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 411, 80, 52, 50, 90, 50, 89, 45, 70, 185),
      new PokemonForm("Poké Ball Pattern", "poke-ball", Type.BUG, Type.FLYING, 1.2, 17, Abilities.SHIELD_DUST, Abilities.COMPOUND_EYES, Abilities.FRIEND_GUARD, 411, 80, 52, 50, 90, 50, 89, 45, 70, 185),
    ),
    new PokemonSpecies(Species.LITLEO, 6, false, false, false, "Lion Cub Pokémon", Type.FIRE, Type.NORMAL, 0.6, 13.5, Abilities.RIVALRY, Abilities.UNNERVE, Abilities.MOXIE, 369, 62, 50, 58, 73, 54, 72, 220, 70, 74, GrowthRate.MEDIUM_SLOW, 12.5, false),
    new PokemonSpecies(Species.PYROAR, 6, false, false, false, "Royal Pokémon", Type.FIRE, Type.NORMAL, 1.5, 81.5, Abilities.RIVALRY, Abilities.UNNERVE, Abilities.MOXIE, 507, 86, 68, 72, 109, 66, 106, 65, 70, 177, GrowthRate.MEDIUM_SLOW, 12.5, true),
    new PokemonSpecies(Species.FLABEBE, 6, false, false, false, "Single Bloom Pokémon", Type.FAIRY, null, 0.1, 0.1, Abilities.FLOWER_VEIL, Abilities.NONE, Abilities.SYMBIOSIS, 303, 44, 38, 39, 61, 79, 42, 225, 70, 61, GrowthRate.MEDIUM_FAST, 0, false, false,
      new PokemonForm("Red Flower", "red", Type.FAIRY, null, 0.1, 0.1, Abilities.FLOWER_VEIL, Abilities.NONE, Abilities.SYMBIOSIS, 303, 44, 38, 39, 61, 79, 42, 225, 70, 61, false, null, true),
      new PokemonForm("Yellow Flower", "yellow", Type.FAIRY, null, 0.1, 0.1, Abilities.FLOWER_VEIL, Abilities.NONE, Abilities.SYMBIOSIS, 303, 44, 38, 39, 61, 79, 42, 225, 70, 61, false, null, true),
      new PokemonForm("Orange Flower", "orange", Type.FAIRY, null, 0.1, 0.1, Abilities.FLOWER_VEIL, Abilities.NONE, Abilities.SYMBIOSIS, 303, 44, 38, 39, 61, 79, 42, 225, 70, 61, false, null, true),
      new PokemonForm("Blue Flower", "blue", Type.FAIRY, null, 0.1, 0.1, Abilities.FLOWER_VEIL, Abilities.NONE, Abilities.SYMBIOSIS, 303, 44, 38, 39, 61, 79, 42, 225, 70, 61, false, null, true),
      new PokemonForm("White Flower", "white", Type.FAIRY, null, 0.1, 0.1, Abilities.FLOWER_VEIL, Abilities.NONE, Abilities.SYMBIOSIS, 303, 44, 38, 39, 61, 79, 42, 225, 70, 61, false, null, true),
    ),
    new PokemonSpecies(Species.FLOETTE, 6, false, false, false, "Single Bloom Pokémon", Type.FAIRY, null, 0.2, 0.9, Abilities.FLOWER_VEIL, Abilities.NONE, Abilities.SYMBIOSIS, 371, 54, 45, 47, 75, 98, 52, 120, 70, 130, GrowthRate.MEDIUM_FAST, 0, false, false,
      new PokemonForm("Red Flower", "red", Type.FAIRY, null, 0.2, 0.9, Abilities.FLOWER_VEIL, Abilities.NONE, Abilities.SYMBIOSIS, 371, 54, 45, 47, 75, 98, 52, 120, 70, 130),
      new PokemonForm("Yellow Flower", "yellow", Type.FAIRY, null, 0.2, 0.9, Abilities.FLOWER_VEIL, Abilities.NONE, Abilities.SYMBIOSIS, 371, 54, 45, 47, 75, 98, 52, 120, 70, 130),
      new PokemonForm("Orange Flower", "orange", Type.FAIRY, null, 0.2, 0.9, Abilities.FLOWER_VEIL, Abilities.NONE, Abilities.SYMBIOSIS, 371, 54, 45, 47, 75, 98, 52, 120, 70, 130),
      new PokemonForm("Blue Flower", "blue", Type.FAIRY, null, 0.2, 0.9, Abilities.FLOWER_VEIL, Abilities.NONE, Abilities.SYMBIOSIS, 371, 54, 45, 47, 75, 98, 52, 120, 70, 130),
      new PokemonForm("White Flower", "white", Type.FAIRY, null, 0.2, 0.9, Abilities.FLOWER_VEIL, Abilities.NONE, Abilities.SYMBIOSIS, 371, 54, 45, 47, 75, 98, 52, 120, 70, 130),
    ),
    new PokemonSpecies(Species.FLORGES, 6, false, false, false, "Garden Pokémon", Type.FAIRY, null, 1.1, 10, Abilities.FLOWER_VEIL, Abilities.NONE, Abilities.SYMBIOSIS, 552, 78, 65, 68, 112, 154, 75, 45, 70, 248, GrowthRate.MEDIUM_FAST, 0, false, false,
      new PokemonForm("Red Flower", "red", Type.FAIRY, null, 1.1, 10, Abilities.FLOWER_VEIL, Abilities.NONE, Abilities.SYMBIOSIS, 552, 78, 65, 68, 112, 154, 75, 45, 70, 248),
      new PokemonForm("Yellow Flower", "yellow", Type.FAIRY, null, 1.1, 10, Abilities.FLOWER_VEIL, Abilities.NONE, Abilities.SYMBIOSIS, 552, 78, 65, 68, 112, 154, 75, 45, 70, 248),
      new PokemonForm("Orange Flower", "orange", Type.FAIRY, null, 1.1, 10, Abilities.FLOWER_VEIL, Abilities.NONE, Abilities.SYMBIOSIS, 552, 78, 65, 68, 112, 154, 75, 45, 70, 248),
      new PokemonForm("Blue Flower", "blue", Type.FAIRY, null, 1.1, 10, Abilities.FLOWER_VEIL, Abilities.NONE, Abilities.SYMBIOSIS, 552, 78, 65, 68, 112, 154, 75, 45, 70, 248),
      new PokemonForm("White Flower", "white", Type.FAIRY, null, 1.1, 10, Abilities.FLOWER_VEIL, Abilities.NONE, Abilities.SYMBIOSIS, 552, 78, 65, 68, 112, 154, 75, 45, 70, 248),
    ),
    new PokemonSpecies(Species.SKIDDO, 6, false, false, false, "Mount Pokémon", Type.GRASS, null, 0.9, 31, Abilities.SAP_SIPPER, Abilities.NONE, Abilities.GRASS_PELT, 350, 66, 65, 48, 62, 57, 52, 200, 70, 70, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.GOGOAT, 6, false, false, false, "Mount Pokémon", Type.GRASS, null, 1.7, 91, Abilities.SAP_SIPPER, Abilities.NONE, Abilities.GRASS_PELT, 531, 123, 100, 62, 97, 81, 68, 45, 70, 186, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.PANCHAM, 6, false, false, false, "Playful Pokémon", Type.FIGHTING, null, 0.6, 8, Abilities.IRON_FIST, Abilities.MOLD_BREAKER, Abilities.SCRAPPY, 348, 67, 82, 62, 46, 48, 43, 220, 50, 70, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.PANGORO, 6, false, false, false, "Daunting Pokémon", Type.FIGHTING, Type.DARK, 2.1, 136, Abilities.IRON_FIST, Abilities.MOLD_BREAKER, Abilities.SCRAPPY, 495, 95, 124, 78, 69, 71, 58, 65, 50, 173, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.FURFROU, 6, false, false, false, "Poodle Pokémon", Type.NORMAL, null, 1.2, 28, Abilities.FUR_COAT, Abilities.NONE, Abilities.NONE, 472, 75, 80, 60, 65, 90, 102, 160, 70, 165, GrowthRate.MEDIUM_FAST, 50, false, true,
      new PokemonForm("Natural Form", "", Type.NORMAL, null, 1.2, 28, Abilities.FUR_COAT, Abilities.NONE, Abilities.NONE, 472, 75, 80, 60, 65, 90, 102, 160, 70, 165, false, null, true),
      new PokemonForm("Heart Trim", "heart", Type.NORMAL, null, 1.2, 28, Abilities.FUR_COAT, Abilities.NONE, Abilities.NONE, 472, 75, 80, 60, 65, 90, 102, 160, 70, 165, false, null, true),
      new PokemonForm("Star Trim", "star", Type.NORMAL, null, 1.2, 28, Abilities.FUR_COAT, Abilities.NONE, Abilities.NONE, 472, 75, 80, 60, 65, 90, 102, 160, 70, 165, false, null, true),
      new PokemonForm("Diamond Trim", "diamond", Type.NORMAL, null, 1.2, 28, Abilities.FUR_COAT, Abilities.NONE, Abilities.NONE, 472, 75, 80, 60, 65, 90, 102, 160, 70, 165, false, null, true),
      new PokemonForm("Debutante Trim", "debutante", Type.NORMAL, null, 1.2, 28, Abilities.FUR_COAT, Abilities.NONE, Abilities.NONE, 472, 75, 80, 60, 65, 90, 102, 160, 70, 165, false, null, true),
      new PokemonForm("Matron Trim", "matron", Type.NORMAL, null, 1.2, 28, Abilities.FUR_COAT, Abilities.NONE, Abilities.NONE, 472, 75, 80, 60, 65, 90, 102, 160, 70, 165, false, null, true),
      new PokemonForm("Dandy Trim", "dandy", Type.NORMAL, null, 1.2, 28, Abilities.FUR_COAT, Abilities.NONE, Abilities.NONE, 472, 75, 80, 60, 65, 90, 102, 160, 70, 165, false, null, true),
      new PokemonForm("La Reine Trim", "la-reine", Type.NORMAL, null, 1.2, 28, Abilities.FUR_COAT, Abilities.NONE, Abilities.NONE, 472, 75, 80, 60, 65, 90, 102, 160, 70, 165, false, null, true),
      new PokemonForm("Kabuki Trim", "kabuki", Type.NORMAL, null, 1.2, 28, Abilities.FUR_COAT, Abilities.NONE, Abilities.NONE, 472, 75, 80, 60, 65, 90, 102, 160, 70, 165, false, null, true),
      new PokemonForm("Pharaoh Trim", "pharaoh", Type.NORMAL, null, 1.2, 28, Abilities.FUR_COAT, Abilities.NONE, Abilities.NONE, 472, 75, 80, 60, 65, 90, 102, 160, 70, 165, false, null, true),
    ),
    new PokemonSpecies(Species.ESPURR, 6, false, false, false, "Restraint Pokémon", Type.PSYCHIC, null, 0.3, 3.5, Abilities.KEEN_EYE, Abilities.INFILTRATOR, Abilities.OWN_TEMPO, 355, 62, 48, 54, 63, 60, 68, 190, 50, 71, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.MEOWSTIC, 6, false, false, false, "Constraint Pokémon", Type.PSYCHIC, null, 0.6, 8.5, Abilities.KEEN_EYE, Abilities.INFILTRATOR, Abilities.PRANKSTER, 466, 74, 48, 76, 83, 81, 104, 75, 50, 163, GrowthRate.MEDIUM_FAST, 50, false, false,
      new PokemonForm("Male", "male", Type.PSYCHIC, null, 0.6, 8.5, Abilities.KEEN_EYE, Abilities.INFILTRATOR, Abilities.PRANKSTER, 466, 74, 48, 76, 83, 81, 104, 75, 50, 163, false, "", true),
      new PokemonForm("Female", "female", Type.PSYCHIC, null, 0.6, 8.5, Abilities.KEEN_EYE, Abilities.INFILTRATOR, Abilities.COMPETITIVE, 466, 74, 48, 76, 83, 81, 104, 75, 50, 163, false, null, true),
    ),
    new PokemonSpecies(Species.HONEDGE, 6, false, false, false, "Sword Pokémon", Type.STEEL, Type.GHOST, 0.8, 2, Abilities.NO_GUARD, Abilities.NONE, Abilities.NONE, 325, 45, 80, 100, 35, 37, 28, 180, 50, 65, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.DOUBLADE, 6, false, false, false, "Sword Pokémon", Type.STEEL, Type.GHOST, 0.8, 4.5, Abilities.NO_GUARD, Abilities.NONE, Abilities.NONE, 448, 59, 110, 150, 45, 49, 35, 90, 50, 157, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.AEGISLASH, 6, false, false, false, "Royal Sword Pokémon", Type.STEEL, Type.GHOST, 1.7, 53, Abilities.STANCE_CHANGE, Abilities.NONE, Abilities.NONE, 500, 60, 50, 140, 50, 140, 60, 45, 50, 250, GrowthRate.MEDIUM_FAST, 50, false, true,
      new PokemonForm("Shield Forme", "shield", Type.STEEL, Type.GHOST, 1.7, 53, Abilities.STANCE_CHANGE, Abilities.NONE, Abilities.NONE, 500, 60, 50, 140, 50, 140, 60, 45, 50, 250, false, "", true),
      new PokemonForm("Blade Forme", "blade", Type.STEEL, Type.GHOST, 1.7, 53, Abilities.STANCE_CHANGE, Abilities.NONE, Abilities.NONE, 500, 60, 140, 50, 140, 50, 60, 45, 50, 250, false, null, true),
    ),
    new PokemonSpecies(Species.SPRITZEE, 6, false, false, false, "Perfume Pokémon", Type.FAIRY, null, 0.2, 0.5, Abilities.HEALER, Abilities.NONE, Abilities.AROMA_VEIL, 341, 78, 52, 60, 63, 65, 23, 200, 50, 68, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.AROMATISSE, 6, false, false, false, "Fragrance Pokémon", Type.FAIRY, null, 0.8, 15.5, Abilities.HEALER, Abilities.NONE, Abilities.AROMA_VEIL, 462, 101, 72, 72, 99, 89, 29, 140, 50, 162, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.SWIRLIX, 6, false, false, false, "Cotton Candy Pokémon", Type.FAIRY, null, 0.4, 3.5, Abilities.SWEET_VEIL, Abilities.NONE, Abilities.UNBURDEN, 341, 62, 48, 66, 59, 57, 49, 200, 50, 68, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.SLURPUFF, 6, false, false, false, "Meringue Pokémon", Type.FAIRY, null, 0.8, 5, Abilities.SWEET_VEIL, Abilities.NONE, Abilities.UNBURDEN, 480, 82, 80, 86, 85, 75, 72, 140, 50, 168, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.INKAY, 6, false, false, false, "Revolving Pokémon", Type.DARK, Type.PSYCHIC, 0.4, 3.5, Abilities.CONTRARY, Abilities.SUCTION_CUPS, Abilities.INFILTRATOR, 288, 53, 54, 53, 37, 46, 45, 190, 50, 58, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.MALAMAR, 6, false, false, false, "Overturning Pokémon", Type.DARK, Type.PSYCHIC, 1.5, 47, Abilities.CONTRARY, Abilities.SUCTION_CUPS, Abilities.INFILTRATOR, 482, 86, 92, 88, 68, 75, 73, 80, 50, 169, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.BINACLE, 6, false, false, false, "Two-Handed Pokémon", Type.ROCK, Type.WATER, 0.5, 31, Abilities.TOUGH_CLAWS, Abilities.SNIPER, Abilities.PICKPOCKET, 306, 42, 52, 67, 39, 56, 50, 120, 50, 61, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.BARBARACLE, 6, false, false, false, "Collective Pokémon", Type.ROCK, Type.WATER, 1.3, 96, Abilities.TOUGH_CLAWS, Abilities.SNIPER, Abilities.PICKPOCKET, 500, 72, 105, 115, 54, 86, 68, 45, 50, 175, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.SKRELP, 6, false, false, false, "Mock Kelp Pokémon", Type.POISON, Type.WATER, 0.5, 7.3, Abilities.POISON_POINT, Abilities.POISON_TOUCH, Abilities.ADAPTABILITY, 320, 50, 60, 60, 60, 60, 30, 225, 50, 64, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.DRAGALGE, 6, false, false, false, "Mock Kelp Pokémon", Type.POISON, Type.DRAGON, 1.8, 81.5, Abilities.POISON_POINT, Abilities.POISON_TOUCH, Abilities.ADAPTABILITY, 494, 65, 75, 90, 97, 123, 44, 55, 50, 173, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.CLAUNCHER, 6, false, false, false, "Water Gun Pokémon", Type.WATER, null, 0.5, 8.3, Abilities.MEGA_LAUNCHER, Abilities.NONE, Abilities.NONE, 330, 50, 53, 62, 58, 63, 44, 225, 50, 66, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.CLAWITZER, 6, false, false, false, "Howitzer Pokémon", Type.WATER, null, 1.3, 35.3, Abilities.MEGA_LAUNCHER, Abilities.NONE, Abilities.NONE, 500, 71, 73, 88, 120, 89, 59, 55, 50, 100, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.HELIOPTILE, 6, false, false, false, "Generator Pokémon", Type.ELECTRIC, Type.NORMAL, 0.5, 6, Abilities.DRY_SKIN, Abilities.SAND_VEIL, Abilities.SOLAR_POWER, 289, 44, 38, 33, 61, 43, 70, 190, 50, 58, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.HELIOLISK, 6, false, false, false, "Generator Pokémon", Type.ELECTRIC, Type.NORMAL, 1, 21, Abilities.DRY_SKIN, Abilities.SAND_VEIL, Abilities.SOLAR_POWER, 481, 62, 55, 52, 109, 94, 109, 75, 50, 168, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.TYRUNT, 6, false, false, false, "Royal Heir Pokémon", Type.ROCK, Type.DRAGON, 0.8, 26, Abilities.STRONG_JAW, Abilities.NONE, Abilities.STURDY, 362, 58, 89, 77, 45, 45, 48, 45, 50, 72, GrowthRate.MEDIUM_FAST, 87.5, false),
    new PokemonSpecies(Species.TYRANTRUM, 6, false, false, false, "Despot Pokémon", Type.ROCK, Type.DRAGON, 2.5, 270, Abilities.STRONG_JAW, Abilities.NONE, Abilities.ROCK_HEAD, 521, 82, 121, 119, 69, 59, 71, 45, 50, 182, GrowthRate.MEDIUM_FAST, 87.5, false),
    new PokemonSpecies(Species.AMAURA, 6, false, false, false, "Tundra Pokémon", Type.ROCK, Type.ICE, 1.3, 25.2, Abilities.REFRIGERATE, Abilities.NONE, Abilities.SNOW_WARNING, 362, 77, 59, 50, 67, 63, 46, 45, 50, 72, GrowthRate.MEDIUM_FAST, 87.5, false),
    new PokemonSpecies(Species.AURORUS, 6, false, false, false, "Tundra Pokémon", Type.ROCK, Type.ICE, 2.7, 225, Abilities.REFRIGERATE, Abilities.NONE, Abilities.SNOW_WARNING, 521, 123, 77, 72, 99, 92, 58, 45, 50, 104, GrowthRate.MEDIUM_FAST, 87.5, false),
    new PokemonSpecies(Species.SYLVEON, 6, false, false, false, "Intertwining Pokémon", Type.FAIRY, null, 1, 23.5, Abilities.CUTE_CHARM, Abilities.NONE, Abilities.PIXILATE, 525, 95, 65, 65, 110, 130, 60, 45, 50, 184, GrowthRate.MEDIUM_FAST, 87.5, false),
    new PokemonSpecies(Species.HAWLUCHA, 6, false, false, false, "Wrestling Pokémon", Type.FIGHTING, Type.FLYING, 0.8, 21.5, Abilities.LIMBER, Abilities.UNBURDEN, Abilities.MOLD_BREAKER, 500, 78, 92, 75, 74, 63, 118, 100, 50, 175, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.DEDENNE, 6, false, false, false, "Antenna Pokémon", Type.ELECTRIC, Type.FAIRY, 0.2, 2.2, Abilities.CHEEK_POUCH, Abilities.PICKUP, Abilities.PLUS, 431, 67, 58, 57, 81, 67, 101, 180, 50, 151, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.CARBINK, 6, false, false, false, "Jewel Pokémon", Type.ROCK, Type.FAIRY, 0.3, 5.7, Abilities.CLEAR_BODY, Abilities.NONE, Abilities.STURDY, 500, 50, 50, 150, 50, 150, 50, 60, 50, 100, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.GOOMY, 6, false, false, false, "Soft Tissue Pokémon", Type.DRAGON, null, 0.3, 2.8, Abilities.SAP_SIPPER, Abilities.HYDRATION, Abilities.GOOEY, 300, 45, 50, 35, 55, 75, 40, 45, 35, 60, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.SLIGGOO, 6, false, false, false, "Soft Tissue Pokémon", Type.DRAGON, null, 0.8, 17.5, Abilities.SAP_SIPPER, Abilities.HYDRATION, Abilities.GOOEY, 452, 68, 75, 53, 83, 113, 60, 45, 35, 158, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.GOODRA, 6, false, false, false, "Dragon Pokémon", Type.DRAGON, null, 2, 150.5, Abilities.SAP_SIPPER, Abilities.HYDRATION, Abilities.GOOEY, 600, 90, 100, 70, 110, 150, 80, 45, 35, 300, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.KLEFKI, 6, false, false, false, "Key Ring Pokémon", Type.STEEL, Type.FAIRY, 0.2, 3, Abilities.PRANKSTER, Abilities.NONE, Abilities.MAGICIAN, 470, 57, 80, 91, 80, 87, 75, 75, 50, 165, GrowthRate.FAST, 50, false),
    new PokemonSpecies(Species.PHANTUMP, 6, false, false, false, "Stump Pokémon", Type.GHOST, Type.GRASS, 0.4, 7, Abilities.NATURAL_CURE, Abilities.FRISK, Abilities.HARVEST, 309, 43, 70, 48, 50, 60, 38, 120, 50, 62, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.TREVENANT, 6, false, false, false, "Elder Tree Pokémon", Type.GHOST, Type.GRASS, 1.5, 71, Abilities.NATURAL_CURE, Abilities.FRISK, Abilities.HARVEST, 474, 85, 110, 76, 65, 82, 56, 60, 50, 166, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.PUMPKABOO, 6, false, false, false, "Pumpkin Pokémon", Type.GHOST, Type.GRASS, 0.4, 5, Abilities.PICKUP, Abilities.FRISK, Abilities.INSOMNIA, 335, 49, 66, 70, 44, 55, 51, 120, 50, 67, GrowthRate.MEDIUM_FAST, 50, false, false,
      new PokemonForm("Average Size", "", Type.GHOST, Type.GRASS, 0.4, 5, Abilities.PICKUP, Abilities.FRISK, Abilities.INSOMNIA, 335, 49, 66, 70, 44, 55, 51, 120, 50, 67, false, null, true),
      new PokemonForm("Small Size", "small", Type.GHOST, Type.GRASS, 0.3, 3.5, Abilities.PICKUP, Abilities.FRISK, Abilities.INSOMNIA, 335, 44, 66, 70, 44, 55, 56, 120, 50, 67, false, null, true),
      new PokemonForm("Large Size", "large", Type.GHOST, Type.GRASS, 0.5, 7.5, Abilities.PICKUP, Abilities.FRISK, Abilities.INSOMNIA, 335, 54, 66, 70, 44, 55, 46, 120, 50, 67, false, null, true),
      new PokemonForm("Super Size", "super", Type.GHOST, Type.GRASS, 0.8, 15, Abilities.PICKUP, Abilities.FRISK, Abilities.INSOMNIA, 335, 59, 66, 70, 44, 55, 41, 120, 50, 67, false, null, true),
    ),
    new PokemonSpecies(Species.GOURGEIST, 6, false, false, false, "Pumpkin Pokémon", Type.GHOST, Type.GRASS, 0.9, 12.5, Abilities.PICKUP, Abilities.FRISK, Abilities.INSOMNIA, 494, 65, 90, 122, 58, 75, 84, 60, 50, 173, GrowthRate.MEDIUM_FAST, 50, false, false,
      new PokemonForm("Average Size", "", Type.GHOST, Type.GRASS, 0.9, 12.5, Abilities.PICKUP, Abilities.FRISK, Abilities.INSOMNIA, 494, 65, 90, 122, 58, 75, 84, 60, 50, 173),
      new PokemonForm("Small Size", "small", Type.GHOST, Type.GRASS, 0.7, 9.5, Abilities.PICKUP, Abilities.FRISK, Abilities.INSOMNIA, 494, 55, 85, 122, 58, 75, 99, 60, 50, 173),
      new PokemonForm("Large Size", "large", Type.GHOST, Type.GRASS, 1.1, 14, Abilities.PICKUP, Abilities.FRISK, Abilities.INSOMNIA, 494, 75, 95, 122, 58, 75, 69, 60, 50, 173),
      new PokemonForm("Super Size", "super", Type.GHOST, Type.GRASS, 1.7, 39, Abilities.PICKUP, Abilities.FRISK, Abilities.INSOMNIA, 494, 85, 100, 122, 58, 75, 54, 60, 50, 173),
    ),
    new PokemonSpecies(Species.BERGMITE, 6, false, false, false, "Ice Chunk Pokémon", Type.ICE, null, 1, 99.5, Abilities.OWN_TEMPO, Abilities.ICE_BODY, Abilities.STURDY, 304, 55, 69, 85, 32, 35, 28, 190, 50, 61, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.AVALUGG, 6, false, false, false, "Iceberg Pokémon", Type.ICE, null, 2, 505, Abilities.OWN_TEMPO, Abilities.ICE_BODY, Abilities.STURDY, 514, 95, 117, 184, 44, 46, 28, 55, 50, 180, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.NOIBAT, 6, false, false, false, "Sound Wave Pokémon", Type.FLYING, Type.DRAGON, 0.5, 8, Abilities.FRISK, Abilities.INFILTRATOR, Abilities.TELEPATHY, 245, 40, 30, 35, 45, 40, 55, 190, 50, 49, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.NOIVERN, 6, false, false, false, "Sound Wave Pokémon", Type.FLYING, Type.DRAGON, 1.5, 85, Abilities.FRISK, Abilities.INFILTRATOR, Abilities.TELEPATHY, 535, 85, 70, 80, 97, 80, 123, 45, 50, 187, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.XERNEAS, 6, false, true, false, "Life Pokémon", Type.FAIRY, null, 3, 215, Abilities.FAIRY_AURA, Abilities.NONE, Abilities.NONE, 680, 126, 131, 95, 131, 98, 99, 45, 0, 340, GrowthRate.SLOW, null, false, true,
      new PokemonForm("Neutral Mode", "neutral", Type.FAIRY, null, 3, 215, Abilities.FAIRY_AURA, Abilities.NONE, Abilities.NONE, 680, 126, 131, 95, 131, 98, 99, 45, 0, 340, false, null, true),
      new PokemonForm("Active Mode", "active", Type.FAIRY, null, 3, 215, Abilities.FAIRY_AURA, Abilities.NONE, Abilities.NONE, 680, 126, 131, 95, 131, 98, 99, 45, 0, 340)
    ),
    new PokemonSpecies(Species.YVELTAL, 6, false, true, false, "Destruction Pokémon", Type.DARK, Type.FLYING, 5.8, 203, Abilities.DARK_AURA, Abilities.NONE, Abilities.NONE, 680, 126, 131, 95, 131, 98, 99, 45, 0, 340, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.ZYGARDE, 6, false, true, false, "Order Pokémon", Type.DRAGON, Type.GROUND, 5, 305, Abilities.AURA_BREAK, Abilities.NONE, Abilities.NONE, 600, 108, 100, 121, 81, 95, 95, 3, 0, 300, GrowthRate.SLOW, null, false, false,
      new PokemonForm("50% Forme", "50", Type.DRAGON, Type.GROUND, 5, 305, Abilities.AURA_BREAK, Abilities.NONE, Abilities.NONE, 600, 108, 100, 121, 81, 95, 95, 3, 0, 300, false, "", true),
      new PokemonForm("10% Forme", "10", Type.DRAGON, Type.GROUND, 1.2, 33.5, Abilities.AURA_BREAK, Abilities.NONE, Abilities.NONE, 486, 54, 100, 71, 61, 85, 115, 3, 0, 300, false, null, true),
      new PokemonForm("50% Forme Power Construct", "50-pc", Type.DRAGON, Type.GROUND, 5, 305, Abilities.POWER_CONSTRUCT, Abilities.NONE, Abilities.NONE, 600, 108, 100, 121, 81, 95, 95, 3, 0, 300, false, "", true),
      new PokemonForm("10% Forme Power Construct", "10-pc", Type.DRAGON, Type.GROUND, 1.2, 33.5, Abilities.POWER_CONSTRUCT, Abilities.NONE, Abilities.NONE, 486, 54, 100, 71, 61, 85, 115, 3, 0, 300, false, "10", true),
      new PokemonForm("Complete Forme", "complete", Type.DRAGON, Type.GROUND, 4.5, 610, Abilities.POWER_CONSTRUCT, Abilities.NONE, Abilities.NONE, 708, 216, 100, 121, 91, 95, 85, 3, 0, 300),
    ),
    new PokemonSpecies(Species.DIANCIE, 6, false, false, true, "Jewel Pokémon", Type.ROCK, Type.FAIRY, 0.7, 8.8, Abilities.CLEAR_BODY, Abilities.NONE, Abilities.NONE, 600, 50, 100, 150, 100, 150, 50, 3, 50, 300, GrowthRate.SLOW, null, false, true,
      new PokemonForm("Normal", "", Type.ROCK, Type.FAIRY, 0.7, 8.8, Abilities.CLEAR_BODY, Abilities.NONE, Abilities.NONE, 600, 50, 100, 150, 100, 150, 50, 3, 50, 300),
      new PokemonForm("Mega", SpeciesFormKey.MEGA, Type.ROCK, Type.FAIRY, 1.1, 27.8, Abilities.MAGIC_BOUNCE, Abilities.NONE, Abilities.NONE, 700, 50, 160, 110, 160, 110, 110, 3, 50, 300),
    ),
    new PokemonSpecies(Species.HOOPA, 6, false, false, true, "Mischief Pokémon", Type.PSYCHIC, Type.GHOST, 0.5, 9, Abilities.MAGICIAN, Abilities.NONE, Abilities.NONE, 600, 80, 110, 60, 150, 130, 70, 3, 100, 270, GrowthRate.SLOW, null, false, false,
      new PokemonForm("Hoopa Confined", "", Type.PSYCHIC, Type.GHOST, 0.5, 9, Abilities.MAGICIAN, Abilities.NONE, Abilities.NONE, 600, 80, 110, 60, 150, 130, 70, 3, 100, 270),
      new PokemonForm("Hoopa Unbound", "unbound", Type.PSYCHIC, Type.DARK, 6.5, 490, Abilities.MAGICIAN, Abilities.NONE, Abilities.NONE, 680, 80, 160, 60, 170, 130, 80, 3, 100, 270),
    ),
    new PokemonSpecies(Species.VOLCANION, 6, false, false, true, "Steam Pokémon", Type.FIRE, Type.WATER, 1.7, 195, Abilities.WATER_ABSORB, Abilities.NONE, Abilities.NONE, 600, 80, 110, 120, 130, 90, 70, 3, 100, 300, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.ROWLET, 7, false, false, false, "Grass Quill Pokémon", Type.GRASS, Type.FLYING, 0.3, 1.5, Abilities.OVERGROW, Abilities.NONE, Abilities.LONG_REACH, 320, 68, 55, 55, 50, 50, 42, 45, 50, 64, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.DARTRIX, 7, false, false, false, "Blade Quill Pokémon", Type.GRASS, Type.FLYING, 0.7, 16, Abilities.OVERGROW, Abilities.NONE, Abilities.LONG_REACH, 420, 78, 75, 75, 70, 70, 52, 45, 50, 147, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.DECIDUEYE, 7, false, false, false, "Arrow Quill Pokémon", Type.GRASS, Type.GHOST, 1.6, 36.6, Abilities.OVERGROW, Abilities.NONE, Abilities.LONG_REACH, 530, 78, 107, 75, 100, 100, 70, 45, 50, 265, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.LITTEN, 7, false, false, false, "Fire Cat Pokémon", Type.FIRE, null, 0.4, 4.3, Abilities.BLAZE, Abilities.NONE, Abilities.INTIMIDATE, 320, 45, 65, 40, 60, 40, 70, 45, 50, 64, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.TORRACAT, 7, false, false, false, "Fire Cat Pokémon", Type.FIRE, null, 0.7, 25, Abilities.BLAZE, Abilities.NONE, Abilities.INTIMIDATE, 420, 65, 85, 50, 80, 50, 90, 45, 50, 147, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.INCINEROAR, 7, false, false, false, "Heel Pokémon", Type.FIRE, Type.DARK, 1.8, 83, Abilities.BLAZE, Abilities.NONE, Abilities.INTIMIDATE, 530, 95, 115, 90, 80, 90, 60, 45, 50, 265, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.POPPLIO, 7, false, false, false, "Sea Lion Pokémon", Type.WATER, null, 0.4, 7.5, Abilities.TORRENT, Abilities.NONE, Abilities.LIQUID_VOICE, 320, 50, 54, 54, 66, 56, 40, 45, 50, 64, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.BRIONNE, 7, false, false, false, "Pop Star Pokémon", Type.WATER, null, 0.6, 17.5, Abilities.TORRENT, Abilities.NONE, Abilities.LIQUID_VOICE, 420, 60, 69, 69, 91, 81, 50, 45, 50, 147, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.PRIMARINA, 7, false, false, false, "Soloist Pokémon", Type.WATER, Type.FAIRY, 1.8, 44, Abilities.TORRENT, Abilities.NONE, Abilities.LIQUID_VOICE, 530, 80, 74, 74, 126, 116, 60, 45, 50, 265, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.PIKIPEK, 7, false, false, false, "Woodpecker Pokémon", Type.NORMAL, Type.FLYING, 0.3, 1.2, Abilities.KEEN_EYE, Abilities.SKILL_LINK, Abilities.PICKUP, 265, 35, 75, 30, 30, 30, 65, 255, 70, 53, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.TRUMBEAK, 7, false, false, false, "Bugle Beak Pokémon", Type.NORMAL, Type.FLYING, 0.6, 14.8, Abilities.KEEN_EYE, Abilities.SKILL_LINK, Abilities.PICKUP, 355, 55, 85, 50, 40, 50, 75, 120, 70, 124, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.TOUCANNON, 7, false, false, false, "Cannon Pokémon", Type.NORMAL, Type.FLYING, 1.1, 26, Abilities.KEEN_EYE, Abilities.SKILL_LINK, Abilities.SHEER_FORCE, 485, 80, 120, 75, 75, 75, 60, 45, 70, 218, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.YUNGOOS, 7, false, false, false, "Loitering Pokémon", Type.NORMAL, null, 0.4, 6, Abilities.STAKEOUT, Abilities.STRONG_JAW, Abilities.ADAPTABILITY, 253, 48, 70, 30, 30, 30, 45, 255, 70, 51, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.GUMSHOOS, 7, false, false, false, "Stakeout Pokémon", Type.NORMAL, null, 0.7, 14.2, Abilities.STAKEOUT, Abilities.STRONG_JAW, Abilities.ADAPTABILITY, 418, 88, 110, 60, 55, 60, 45, 127, 70, 146, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.GRUBBIN, 7, false, false, false, "Larva Pokémon", Type.BUG, null, 0.4, 4.4, Abilities.SWARM, Abilities.NONE, Abilities.NONE, 300, 47, 62, 45, 55, 45, 46, 255, 50, 60, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.CHARJABUG, 7, false, false, false, "Battery Pokémon", Type.BUG, Type.ELECTRIC, 0.5, 10.5, Abilities.BATTERY, Abilities.NONE, Abilities.NONE, 400, 57, 82, 95, 55, 75, 36, 120, 50, 140, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.VIKAVOLT, 7, false, false, false, "Stag Beetle Pokémon", Type.BUG, Type.ELECTRIC, 1.5, 45, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 500, 77, 70, 90, 145, 75, 43, 45, 50, 250, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.CRABRAWLER, 7, false, false, false, "Boxing Pokémon", Type.FIGHTING, null, 0.6, 7, Abilities.HYPER_CUTTER, Abilities.IRON_FIST, Abilities.ANGER_POINT, 338, 47, 82, 57, 42, 47, 63, 225, 70, 68, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.CRABOMINABLE, 7, false, false, false, "Woolly Crab Pokémon", Type.FIGHTING, Type.ICE, 1.7, 180, Abilities.HYPER_CUTTER, Abilities.IRON_FIST, Abilities.ANGER_POINT, 478, 97, 132, 77, 62, 67, 43, 60, 70, 167, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.ORICORIO, 7, false, false, false, "Dancing Pokémon", Type.FIRE, Type.FLYING, 0.6, 3.4, Abilities.DANCER, Abilities.NONE, Abilities.NONE, 476, 75, 70, 70, 98, 70, 93, 45, 70, 167, GrowthRate.MEDIUM_FAST, 25, false, false,
      new PokemonForm("Baile Style", "baile", Type.FIRE, Type.FLYING, 0.6, 3.4, Abilities.DANCER, Abilities.NONE, Abilities.NONE, 476, 75, 70, 70, 98, 70, 93, 45, 70, 167, false, "", true),
      new PokemonForm("Pom-Pom Style", "pompom", Type.ELECTRIC, Type.FLYING, 0.6, 3.4, Abilities.DANCER, Abilities.NONE, Abilities.NONE, 476, 75, 70, 70, 98, 70, 93, 45, 70, 167, false, null, true),
      new PokemonForm("Pau Style", "pau", Type.PSYCHIC, Type.FLYING, 0.6, 3.4, Abilities.DANCER, Abilities.NONE, Abilities.NONE, 476, 75, 70, 70, 98, 70, 93, 45, 70, 167, false, null, true),
      new PokemonForm("Sensu Style", "sensu", Type.GHOST, Type.FLYING, 0.6, 3.4, Abilities.DANCER, Abilities.NONE, Abilities.NONE, 476, 75, 70, 70, 98, 70, 93, 45, 70, 167, false, null, true),
    ),
    new PokemonSpecies(Species.CUTIEFLY, 7, false, false, false, "Bee Fly Pokémon", Type.BUG, Type.FAIRY, 0.1, 0.2, Abilities.HONEY_GATHER, Abilities.SHIELD_DUST, Abilities.SWEET_VEIL, 304, 40, 45, 40, 55, 40, 84, 190, 50, 61, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.RIBOMBEE, 7, false, false, false, "Bee Fly Pokémon", Type.BUG, Type.FAIRY, 0.2, 0.5, Abilities.HONEY_GATHER, Abilities.SHIELD_DUST, Abilities.SWEET_VEIL, 464, 60, 55, 60, 95, 70, 124, 75, 50, 162, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.ROCKRUFF, 7, false, false, false, "Puppy Pokémon", Type.ROCK, null, 0.5, 9.2, Abilities.KEEN_EYE, Abilities.VITAL_SPIRIT, Abilities.STEADFAST, 280, 45, 65, 40, 30, 40, 60, 190, 50, 56, GrowthRate.MEDIUM_FAST, 50, false, false,
      new PokemonForm("Normal", "", Type.ROCK, null, 0.5, 9.2, Abilities.KEEN_EYE, Abilities.VITAL_SPIRIT, Abilities.STEADFAST, 280, 45, 65, 40, 30, 40, 60, 190, 50, 56, false, null, true),
      new PokemonForm("Own Tempo", "own-tempo", Type.ROCK, null, 0.5, 9.2, Abilities.OWN_TEMPO, Abilities.NONE, Abilities.OWN_TEMPO, 280, 45, 65, 40, 30, 40, 60, 190, 50, 56, false, "", true),
    ),
    new PokemonSpecies(Species.LYCANROC, 7, false, false, false, "Wolf Pokémon", Type.ROCK, null, 0.8, 25, Abilities.KEEN_EYE, Abilities.SAND_RUSH, Abilities.STEADFAST, 487, 75, 115, 65, 55, 65, 112, 90, 50, 170, GrowthRate.MEDIUM_FAST, 50, false, false,
      new PokemonForm("Midday Form", "midday", Type.ROCK, null, 0.8, 25, Abilities.KEEN_EYE, Abilities.SAND_RUSH, Abilities.STEADFAST, 487, 75, 115, 65, 55, 65, 112, 90, 50, 170, false, ""),
      new PokemonForm("Midnight Form", "midnight", Type.ROCK, null, 1.1, 25, Abilities.KEEN_EYE, Abilities.VITAL_SPIRIT, Abilities.NO_GUARD, 487, 85, 115, 75, 55, 75, 82, 90, 50, 170),
      new PokemonForm("Dusk Form", "dusk", Type.ROCK, null, 0.8, 25, Abilities.TOUGH_CLAWS, Abilities.TOUGH_CLAWS, Abilities.TOUGH_CLAWS, 487, 75, 117, 65, 55, 65, 110, 90, 50, 170),
    ),
    new PokemonSpecies(Species.WISHIWASHI, 7, false, false, false, "Small Fry Pokémon", Type.WATER, null, 0.2, 0.3, Abilities.SCHOOLING, Abilities.NONE, Abilities.NONE, 175, 45, 20, 20, 25, 25, 40, 60, 50, 61, GrowthRate.FAST, 50, false, false,
      new PokemonForm("Solo Form", "", Type.WATER, null, 0.2, 0.3, Abilities.SCHOOLING, Abilities.NONE, Abilities.NONE, 175, 45, 20, 20, 25, 25, 40, 60, 50, 61),
      new PokemonForm("School", "school", Type.WATER, null, 8.2, 78.6, Abilities.SCHOOLING, Abilities.NONE, Abilities.NONE, 620, 45, 140, 130, 140, 135, 30, 60, 50, 61),
    ),
    new PokemonSpecies(Species.MAREANIE, 7, false, false, false, "Brutal Star Pokémon", Type.POISON, Type.WATER, 0.4, 8, Abilities.MERCILESS, Abilities.LIMBER, Abilities.REGENERATOR, 305, 50, 53, 62, 43, 52, 45, 190, 50, 61, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.TOXAPEX, 7, false, false, false, "Brutal Star Pokémon", Type.POISON, Type.WATER, 0.7, 14.5, Abilities.MERCILESS, Abilities.LIMBER, Abilities.REGENERATOR, 495, 50, 63, 152, 53, 142, 35, 75, 50, 173, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.MUDBRAY, 7, false, false, false, "Donkey Pokémon", Type.GROUND, null, 1, 110, Abilities.OWN_TEMPO, Abilities.STAMINA, Abilities.INNER_FOCUS, 385, 70, 100, 70, 45, 55, 45, 190, 50, 77, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.MUDSDALE, 7, false, false, false, "Draft Horse Pokémon", Type.GROUND, null, 2.5, 920, Abilities.OWN_TEMPO, Abilities.STAMINA, Abilities.INNER_FOCUS, 500, 100, 125, 100, 55, 85, 35, 60, 50, 175, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.DEWPIDER, 7, false, false, false, "Water Bubble Pokémon", Type.WATER, Type.BUG, 0.3, 4, Abilities.WATER_BUBBLE, Abilities.NONE, Abilities.WATER_ABSORB, 269, 38, 40, 52, 40, 72, 27, 200, 50, 54, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.ARAQUANID, 7, false, false, false, "Water Bubble Pokémon", Type.WATER, Type.BUG, 1.8, 82, Abilities.WATER_BUBBLE, Abilities.NONE, Abilities.WATER_ABSORB, 454, 68, 70, 92, 50, 132, 42, 100, 50, 159, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.FOMANTIS, 7, false, false, false, "Sickle Grass Pokémon", Type.GRASS, null, 0.3, 1.5, Abilities.LEAF_GUARD, Abilities.NONE, Abilities.CONTRARY, 250, 40, 55, 35, 50, 35, 35, 190, 50, 50, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.LURANTIS, 7, false, false, false, "Bloom Sickle Pokémon", Type.GRASS, null, 0.9, 18.5, Abilities.LEAF_GUARD, Abilities.NONE, Abilities.CONTRARY, 480, 70, 105, 90, 80, 90, 45, 75, 50, 168, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.MORELULL, 7, false, false, false, "Illuminating Pokémon", Type.GRASS, Type.FAIRY, 0.2, 1.5, Abilities.ILLUMINATE, Abilities.EFFECT_SPORE, Abilities.RAIN_DISH, 285, 40, 35, 55, 65, 75, 15, 190, 50, 57, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.SHIINOTIC, 7, false, false, false, "Illuminating Pokémon", Type.GRASS, Type.FAIRY, 1, 11.5, Abilities.ILLUMINATE, Abilities.EFFECT_SPORE, Abilities.RAIN_DISH, 405, 60, 45, 80, 90, 100, 30, 75, 50, 142, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.SALANDIT, 7, false, false, false, "Toxic Lizard Pokémon", Type.POISON, Type.FIRE, 0.6, 4.8, Abilities.CORROSION, Abilities.NONE, Abilities.OBLIVIOUS, 320, 48, 44, 40, 71, 40, 77, 120, 50, 64, GrowthRate.MEDIUM_FAST, 87.5, false),
    new PokemonSpecies(Species.SALAZZLE, 7, false, false, false, "Toxic Lizard Pokémon", Type.POISON, Type.FIRE, 1.2, 22.2, Abilities.CORROSION, Abilities.NONE, Abilities.OBLIVIOUS, 480, 68, 64, 60, 111, 60, 117, 45, 50, 168, GrowthRate.MEDIUM_FAST, 0, false),
    new PokemonSpecies(Species.STUFFUL, 7, false, false, false, "Flailing Pokémon", Type.NORMAL, Type.FIGHTING, 0.5, 6.8, Abilities.FLUFFY, Abilities.KLUTZ, Abilities.CUTE_CHARM, 340, 70, 75, 50, 45, 50, 50, 140, 50, 68, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.BEWEAR, 7, false, false, false, "Strong Arm Pokémon", Type.NORMAL, Type.FIGHTING, 2.1, 135, Abilities.FLUFFY, Abilities.KLUTZ, Abilities.UNNERVE, 500, 120, 125, 80, 55, 60, 60, 70, 50, 175, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.BOUNSWEET, 7, false, false, false, "Fruit Pokémon", Type.GRASS, null, 0.3, 3.2, Abilities.LEAF_GUARD, Abilities.OBLIVIOUS, Abilities.SWEET_VEIL, 210, 42, 30, 38, 30, 38, 32, 235, 50, 42, GrowthRate.MEDIUM_SLOW, 0, false),
    new PokemonSpecies(Species.STEENEE, 7, false, false, false, "Fruit Pokémon", Type.GRASS, null, 0.7, 8.2, Abilities.LEAF_GUARD, Abilities.OBLIVIOUS, Abilities.SWEET_VEIL, 290, 52, 40, 48, 40, 48, 62, 120, 50, 102, GrowthRate.MEDIUM_SLOW, 0, false),
    new PokemonSpecies(Species.TSAREENA, 7, false, false, false, "Fruit Pokémon", Type.GRASS, null, 1.2, 21.4, Abilities.LEAF_GUARD, Abilities.QUEENLY_MAJESTY, Abilities.SWEET_VEIL, 510, 72, 120, 98, 50, 98, 72, 45, 50, 255, GrowthRate.MEDIUM_SLOW, 0, false),
    new PokemonSpecies(Species.COMFEY, 7, false, false, false, "Posy Picker Pokémon", Type.FAIRY, null, 0.1, 0.3, Abilities.FLOWER_VEIL, Abilities.TRIAGE, Abilities.NATURAL_CURE, 485, 51, 52, 90, 82, 110, 100, 60, 50, 170, GrowthRate.FAST, 25, false),
    new PokemonSpecies(Species.ORANGURU, 7, false, false, false, "Sage Pokémon", Type.NORMAL, Type.PSYCHIC, 1.5, 76, Abilities.INNER_FOCUS, Abilities.TELEPATHY, Abilities.SYMBIOSIS, 490, 90, 60, 80, 90, 110, 60, 45, 50, 172, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.PASSIMIAN, 7, false, false, false, "Teamwork Pokémon", Type.FIGHTING, null, 2, 82.8, Abilities.RECEIVER, Abilities.NONE, Abilities.DEFIANT, 490, 100, 120, 90, 40, 60, 80, 45, 50, 172, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.WIMPOD, 7, false, false, false, "Turn Tail Pokémon", Type.BUG, Type.WATER, 0.5, 12, Abilities.WIMP_OUT, Abilities.NONE, Abilities.NONE, 230, 25, 35, 40, 20, 30, 80, 90, 50, 46, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.GOLISOPOD, 7, false, false, false, "Hard Scale Pokémon", Type.BUG, Type.WATER, 2, 108, Abilities.EMERGENCY_EXIT, Abilities.NONE, Abilities.NONE, 530, 75, 125, 140, 60, 90, 40, 45, 50, 186, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.SANDYGAST, 7, false, false, false, "Sand Heap Pokémon", Type.GHOST, Type.GROUND, 0.5, 70, Abilities.WATER_COMPACTION, Abilities.NONE, Abilities.SAND_VEIL, 320, 55, 55, 80, 70, 45, 15, 140, 50, 64, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.PALOSSAND, 7, false, false, false, "Sand Castle Pokémon", Type.GHOST, Type.GROUND, 1.3, 250, Abilities.WATER_COMPACTION, Abilities.NONE, Abilities.SAND_VEIL, 480, 85, 75, 110, 100, 75, 35, 60, 50, 168, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.PYUKUMUKU, 7, false, false, false, "Sea Cucumber Pokémon", Type.WATER, null, 0.3, 1.2, Abilities.INNARDS_OUT, Abilities.NONE, Abilities.UNAWARE, 410, 55, 60, 130, 30, 130, 5, 60, 50, 144, GrowthRate.FAST, 50, false),
    new PokemonSpecies(Species.TYPE_NULL, 7, true, false, false, "Synthetic Pokémon", Type.NORMAL, null, 1.9, 120.5, Abilities.BATTLE_ARMOR, Abilities.NONE, Abilities.NONE, 534, 95, 95, 95, 95, 95, 59, 3, 0, 107, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.SILVALLY, 7, true, false, false, "Synthetic Pokémon", Type.NORMAL, null, 2.3, 100.5, Abilities.RKS_SYSTEM, Abilities.NONE, Abilities.NONE, 570, 95, 95, 95, 95, 95, 95, 3, 0, 285, GrowthRate.SLOW, null, false, false,
      new PokemonForm("Type: Normal", "normal", Type.NORMAL, null, 2.3, 100.5, Abilities.RKS_SYSTEM, Abilities.NONE, Abilities.NONE, 570, 95, 95, 95, 95, 95, 95, 3, 0, 285, false, ""),
      new PokemonForm("Type: Fighting", "fighting", Type.FIGHTING, null, 2.3, 100.5, Abilities.RKS_SYSTEM, Abilities.NONE, Abilities.NONE, 570, 95, 95, 95, 95, 95, 95, 3, 0, 285),
      new PokemonForm("Type: Flying", "flying", Type.FLYING, null, 2.3, 100.5, Abilities.RKS_SYSTEM, Abilities.NONE, Abilities.NONE, 570, 95, 95, 95, 95, 95, 95, 3, 0, 285),
      new PokemonForm("Type: Poison", "poison", Type.POISON, null, 2.3, 100.5, Abilities.RKS_SYSTEM, Abilities.NONE, Abilities.NONE, 570, 95, 95, 95, 95, 95, 95, 3, 0, 285),
      new PokemonForm("Type: Ground", "ground", Type.GROUND, null, 2.3, 100.5, Abilities.RKS_SYSTEM, Abilities.NONE, Abilities.NONE, 570, 95, 95, 95, 95, 95, 95, 3, 0, 285),
      new PokemonForm("Type: Rock", "rock", Type.ROCK, null, 2.3, 100.5, Abilities.RKS_SYSTEM, Abilities.NONE, Abilities.NONE, 570, 95, 95, 95, 95, 95, 95, 3, 0, 285),
      new PokemonForm("Type: Bug", "bug", Type.BUG, null, 2.3, 100.5, Abilities.RKS_SYSTEM, Abilities.NONE, Abilities.NONE, 570, 95, 95, 95, 95, 95, 95, 3, 0, 285),
      new PokemonForm("Type: Ghost", "ghost", Type.GHOST, null, 2.3, 100.5, Abilities.RKS_SYSTEM, Abilities.NONE, Abilities.NONE, 570, 95, 95, 95, 95, 95, 95, 3, 0, 285),
      new PokemonForm("Type: Steel", "steel", Type.STEEL, null, 2.3, 100.5, Abilities.RKS_SYSTEM, Abilities.NONE, Abilities.NONE, 570, 95, 95, 95, 95, 95, 95, 3, 0, 285),
      new PokemonForm("Type: Fire", "fire", Type.FIRE, null, 2.3, 100.5, Abilities.RKS_SYSTEM, Abilities.NONE, Abilities.NONE, 570, 95, 95, 95, 95, 95, 95, 3, 0, 285),
      new PokemonForm("Type: Water", "water", Type.WATER, null, 2.3, 100.5, Abilities.RKS_SYSTEM, Abilities.NONE, Abilities.NONE, 570, 95, 95, 95, 95, 95, 95, 3, 0, 285),
      new PokemonForm("Type: Grass", "grass", Type.GRASS, null, 2.3, 100.5, Abilities.RKS_SYSTEM, Abilities.NONE, Abilities.NONE, 570, 95, 95, 95, 95, 95, 95, 3, 0, 285),
      new PokemonForm("Type: Electric", "electric", Type.ELECTRIC, null, 2.3, 100.5, Abilities.RKS_SYSTEM, Abilities.NONE, Abilities.NONE, 570, 95, 95, 95, 95, 95, 95, 3, 0, 285),
      new PokemonForm("Type: Psychic", "psychic", Type.PSYCHIC, null, 2.3, 100.5, Abilities.RKS_SYSTEM, Abilities.NONE, Abilities.NONE, 570, 95, 95, 95, 95, 95, 95, 3, 0, 285),
      new PokemonForm("Type: Ice", "ice", Type.ICE, null, 2.3, 100.5, Abilities.RKS_SYSTEM, Abilities.NONE, Abilities.NONE, 570, 95, 95, 95, 95, 95, 95, 3, 0, 285),
      new PokemonForm("Type: Dragon", "dragon", Type.DRAGON, null, 2.3, 100.5, Abilities.RKS_SYSTEM, Abilities.NONE, Abilities.NONE, 570, 95, 95, 95, 95, 95, 95, 3, 0, 285),
      new PokemonForm("Type: Dark", "dark", Type.DARK, null, 2.3, 100.5, Abilities.RKS_SYSTEM, Abilities.NONE, Abilities.NONE, 570, 95, 95, 95, 95, 95, 95, 3, 0, 285),
      new PokemonForm("Type: Fairy", "fairy", Type.FAIRY, null, 2.3, 100.5, Abilities.RKS_SYSTEM, Abilities.NONE, Abilities.NONE, 570, 95, 95, 95, 95, 95, 95, 3, 0, 285),
    ),
    new PokemonSpecies(Species.MINIOR, 7, false, false, false, "Meteor Pokémon", Type.ROCK, Type.FLYING, 0.3, 40, Abilities.SHIELDS_DOWN, Abilities.NONE, Abilities.NONE, 440, 60, 60, 100, 60, 100, 60, 30, 70, 154, GrowthRate.MEDIUM_SLOW, null, false, false,
      new PokemonForm("Red Meteor Form", "red-meteor", Type.ROCK, Type.FLYING, 0.3, 40, Abilities.SHIELDS_DOWN, Abilities.NONE, Abilities.NONE, 440, 60, 60, 100, 60, 100, 60, 30, 70, 154, false, "", true),
      new PokemonForm("Orange Meteor Form", "orange-meteor", Type.ROCK, Type.FLYING, 0.3, 40, Abilities.SHIELDS_DOWN, Abilities.NONE, Abilities.NONE, 440, 60, 60, 100, 60, 100, 60, 30, 70, 154, false, "", true),
      new PokemonForm("Yellow Meteor Form", "yellow-meteor", Type.ROCK, Type.FLYING, 0.3, 40, Abilities.SHIELDS_DOWN, Abilities.NONE, Abilities.NONE, 440, 60, 60, 100, 60, 100, 60, 30, 70, 154, false, "", true),
      new PokemonForm("Green Meteor Form", "green-meteor", Type.ROCK, Type.FLYING, 0.3, 40, Abilities.SHIELDS_DOWN, Abilities.NONE, Abilities.NONE, 440, 60, 60, 100, 60, 100, 60, 30, 70, 154, false, "", true),
      new PokemonForm("Blue Meteor Form", "blue-meteor", Type.ROCK, Type.FLYING, 0.3, 40, Abilities.SHIELDS_DOWN, Abilities.NONE, Abilities.NONE, 440, 60, 60, 100, 60, 100, 60, 30, 70, 154, false, "", true),
      new PokemonForm("Indigo Meteor Form", "indigo-meteor", Type.ROCK, Type.FLYING, 0.3, 40, Abilities.SHIELDS_DOWN, Abilities.NONE, Abilities.NONE, 440, 60, 60, 100, 60, 100, 60, 30, 70, 154, false, "", true),
      new PokemonForm("Violet Meteor Form", "violet-meteor", Type.ROCK, Type.FLYING, 0.3, 40, Abilities.SHIELDS_DOWN, Abilities.NONE, Abilities.NONE, 440, 60, 60, 100, 60, 100, 60, 30, 70, 154, false, "", true),
      new PokemonForm("Red Core Form", "red", Type.ROCK, Type.FLYING, 0.3, 0.3, Abilities.SHIELDS_DOWN, Abilities.NONE, Abilities.NONE, 500, 60, 100, 60, 100, 60, 120, 30, 70, 154, false, null, true),
      new PokemonForm("Orange Core Form", "orange", Type.ROCK, Type.FLYING, 0.3, 0.3, Abilities.SHIELDS_DOWN, Abilities.NONE, Abilities.NONE, 500, 60, 100, 60, 100, 60, 120, 30, 70, 154, false, null, true),
      new PokemonForm("Yellow Core Form", "yellow", Type.ROCK, Type.FLYING, 0.3, 0.3, Abilities.SHIELDS_DOWN, Abilities.NONE, Abilities.NONE, 500, 60, 100, 60, 100, 60, 120, 30, 70, 154, false, null, true),
      new PokemonForm("Green Core Form", "green", Type.ROCK, Type.FLYING, 0.3, 0.3, Abilities.SHIELDS_DOWN, Abilities.NONE, Abilities.NONE, 500, 60, 100, 60, 100, 60, 120, 30, 70, 154, false, null, true),
      new PokemonForm("Blue Core Form", "blue", Type.ROCK, Type.FLYING, 0.3, 0.3, Abilities.SHIELDS_DOWN, Abilities.NONE, Abilities.NONE, 500, 60, 100, 60, 100, 60, 120, 30, 70, 154, false, null, true),
      new PokemonForm("Indigo Core Form", "indigo", Type.ROCK, Type.FLYING, 0.3, 0.3, Abilities.SHIELDS_DOWN, Abilities.NONE, Abilities.NONE, 500, 60, 100, 60, 100, 60, 120, 30, 70, 154, false, null, true),
      new PokemonForm("Violet Core Form", "violet", Type.ROCK, Type.FLYING, 0.3, 0.3, Abilities.SHIELDS_DOWN, Abilities.NONE, Abilities.NONE, 500, 60, 100, 60, 100, 60, 120, 30, 70, 154, false, null, true),
    ),
    new PokemonSpecies(Species.KOMALA, 7, false, false, false, "Drowsing Pokémon", Type.NORMAL, null, 0.4, 19.9, Abilities.COMATOSE, Abilities.NONE, Abilities.NONE, 480, 65, 115, 65, 75, 95, 65, 45, 70, 168, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.TURTONATOR, 7, false, false, false, "Blast Turtle Pokémon", Type.FIRE, Type.DRAGON, 2, 212, Abilities.SHELL_ARMOR, Abilities.NONE, Abilities.NONE, 485, 60, 78, 135, 91, 85, 36, 70, 50, 170, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.TOGEDEMARU, 7, false, false, false, "Roly-Poly Pokémon", Type.ELECTRIC, Type.STEEL, 0.3, 3.3, Abilities.IRON_BARBS, Abilities.LIGHTNING_ROD, Abilities.STURDY, 435, 65, 98, 63, 40, 73, 96, 180, 50, 152, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.MIMIKYU, 7, false, false, false, "Disguise Pokémon", Type.GHOST, Type.FAIRY, 0.2, 0.7, Abilities.DISGUISE, Abilities.NONE, Abilities.NONE, 476, 55, 90, 80, 50, 105, 96, 45, 50, 167, GrowthRate.MEDIUM_FAST, 50, false, false,
      new PokemonForm("Disguised Form", "disguised", Type.GHOST, Type.FAIRY, 0.2, 0.7, Abilities.DISGUISE, Abilities.NONE, Abilities.NONE, 476, 55, 90, 80, 50, 105, 96, 45, 50, 167, false, "", true),
      new PokemonForm("Busted Form", "busted", Type.GHOST, Type.FAIRY, 0.2, 0.7, Abilities.DISGUISE, Abilities.NONE, Abilities.NONE, 476, 55, 90, 80, 50, 105, 96, 45, 50, 167),
    ),
    new PokemonSpecies(Species.BRUXISH, 7, false, false, false, "Gnash Teeth Pokémon", Type.WATER, Type.PSYCHIC, 0.9, 19, Abilities.DAZZLING, Abilities.STRONG_JAW, Abilities.WONDER_SKIN, 475, 68, 105, 70, 70, 70, 92, 80, 70, 166, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.DRAMPA, 7, false, false, false, "Placid Pokémon", Type.NORMAL, Type.DRAGON, 3, 185, Abilities.BERSERK, Abilities.SAP_SIPPER, Abilities.CLOUD_NINE, 485, 78, 60, 85, 135, 91, 36, 70, 50, 170, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.DHELMISE, 7, false, false, false, "Sea Creeper Pokémon", Type.GHOST, Type.GRASS, 3.9, 210, Abilities.STEELWORKER, Abilities.NONE, Abilities.NONE, 517, 70, 131, 100, 86, 90, 40, 25, 50, 181, GrowthRate.MEDIUM_FAST, null, false),
    new PokemonSpecies(Species.JANGMO_O, 7, false, false, false, "Scaly Pokémon", Type.DRAGON, null, 0.6, 29.7, Abilities.BULLETPROOF, Abilities.SOUNDPROOF, Abilities.OVERCOAT, 300, 45, 55, 65, 45, 45, 45, 45, 50, 60, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.HAKAMO_O, 7, false, false, false, "Scaly Pokémon", Type.DRAGON, Type.FIGHTING, 1.2, 47, Abilities.BULLETPROOF, Abilities.SOUNDPROOF, Abilities.OVERCOAT, 420, 55, 75, 90, 65, 70, 65, 45, 50, 147, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.KOMMO_O, 7, false, false, false, "Scaly Pokémon", Type.DRAGON, Type.FIGHTING, 1.6, 78.2, Abilities.BULLETPROOF, Abilities.SOUNDPROOF, Abilities.OVERCOAT, 600, 75, 110, 125, 100, 105, 85, 45, 50, 300, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.TAPU_KOKO, 7, true, false, false, "Land Spirit Pokémon", Type.ELECTRIC, Type.FAIRY, 1.8, 20.5, Abilities.ELECTRIC_SURGE, Abilities.NONE, Abilities.TELEPATHY, 570, 70, 115, 85, 95, 75, 130, 3, 50, 285, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.TAPU_LELE, 7, true, false, false, "Land Spirit Pokémon", Type.PSYCHIC, Type.FAIRY, 1.2, 18.6, Abilities.PSYCHIC_SURGE, Abilities.NONE, Abilities.TELEPATHY, 570, 70, 85, 75, 130, 115, 95, 3, 50, 285, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.TAPU_BULU, 7, true, false, false, "Land Spirit Pokémon", Type.GRASS, Type.FAIRY, 1.9, 45.5, Abilities.GRASSY_SURGE, Abilities.NONE, Abilities.TELEPATHY, 570, 70, 130, 115, 85, 95, 75, 3, 50, 285, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.TAPU_FINI, 7, true, false, false, "Land Spirit Pokémon", Type.WATER, Type.FAIRY, 1.3, 21.2, Abilities.MISTY_SURGE, Abilities.NONE, Abilities.TELEPATHY, 570, 70, 75, 115, 95, 130, 85, 3, 50, 285, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.COSMOG, 7, true, false, false, "Nebula Pokémon", Type.PSYCHIC, null, 0.2, 0.1, Abilities.UNAWARE, Abilities.NONE, Abilities.NONE, 200, 43, 29, 31, 29, 31, 37, 45, 0, 40, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.COSMOEM, 7, true, false, false, "Protostar Pokémon", Type.PSYCHIC, null, 0.1, 999.9, Abilities.STURDY, Abilities.NONE, Abilities.NONE, 400, 43, 29, 131, 29, 131, 37, 45, 0, 140, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.SOLGALEO, 7, false, true, false, "Sunne Pokémon", Type.PSYCHIC, Type.STEEL, 3.4, 230, Abilities.FULL_METAL_BODY, Abilities.NONE, Abilities.NONE, 680, 137, 137, 107, 113, 89, 97, 45, 0, 340, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.LUNALA, 7, false, true, false, "Moone Pokémon", Type.PSYCHIC, Type.GHOST, 4, 120, Abilities.SHADOW_SHIELD, Abilities.NONE, Abilities.NONE, 680, 137, 113, 89, 137, 107, 97, 45, 0, 340, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.NIHILEGO, 7, true, false, false, "Parasite Pokémon", Type.ROCK, Type.POISON, 1.2, 55.5, Abilities.BEAST_BOOST, Abilities.NONE, Abilities.NONE, 570, 109, 53, 47, 127, 131, 103, 45, 0, 285, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.BUZZWOLE, 7, true, false, false, "Swollen Pokémon", Type.BUG, Type.FIGHTING, 2.4, 333.6, Abilities.BEAST_BOOST, Abilities.NONE, Abilities.NONE, 570, 107, 139, 139, 53, 53, 79, 45, 0, 285, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.PHEROMOSA, 7, true, false, false, "Lissome Pokémon", Type.BUG, Type.FIGHTING, 1.8, 25, Abilities.BEAST_BOOST, Abilities.NONE, Abilities.NONE, 570, 71, 137, 37, 137, 37, 151, 45, 0, 285, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.XURKITREE, 7, true, false, false, "Glowing Pokémon", Type.ELECTRIC, null, 3.8, 100, Abilities.BEAST_BOOST, Abilities.NONE, Abilities.NONE, 570, 83, 89, 71, 173, 71, 83, 45, 0, 285, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.CELESTEELA, 7, true, false, false, "Launch Pokémon", Type.STEEL, Type.FLYING, 9.2, 999.9, Abilities.BEAST_BOOST, Abilities.NONE, Abilities.NONE, 570, 97, 101, 103, 107, 101, 61, 45, 0, 285, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.KARTANA, 7, true, false, false, "Drawn Sword Pokémon", Type.GRASS, Type.STEEL, 0.3, 0.1, Abilities.BEAST_BOOST, Abilities.NONE, Abilities.NONE, 570, 59, 181, 131, 59, 31, 109, 45, 0, 285, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.GUZZLORD, 7, true, false, false, "Junkivore Pokémon", Type.DARK, Type.DRAGON, 5.5, 888, Abilities.BEAST_BOOST, Abilities.NONE, Abilities.NONE, 570, 223, 101, 53, 97, 53, 43, 45, 0, 285, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.NECROZMA, 7, false, true, false, "Prism Pokémon", Type.PSYCHIC, null, 2.4, 230, Abilities.PRISM_ARMOR, Abilities.NONE, Abilities.NONE, 600, 97, 107, 101, 127, 89, 79, 255, 0, 300, GrowthRate.SLOW, null, false, false,
      new PokemonForm("Normal", "", Type.PSYCHIC, null, 2.4, 230, Abilities.PRISM_ARMOR, Abilities.NONE, Abilities.NONE, 600, 97, 107, 101, 127, 89, 79, 255, 0, 300),
      new PokemonForm("Dusk Mane", "dusk-mane", Type.PSYCHIC, Type.STEEL, 3.8, 460, Abilities.PRISM_ARMOR, Abilities.NONE, Abilities.NONE, 680, 97, 157, 127, 113, 109, 77, 255, 0, 300),
      new PokemonForm("Dawn Wings", "dawn-wings", Type.PSYCHIC, Type.GHOST, 4.2, 350, Abilities.PRISM_ARMOR, Abilities.NONE, Abilities.NONE, 680, 97, 113, 109, 157, 127, 77, 255, 0, 300),
      new PokemonForm("Ultra", "ultra", Type.PSYCHIC, Type.DRAGON, 7.5, 230, Abilities.NEUROFORCE, Abilities.NONE, Abilities.NONE, 754, 97, 167, 97, 167, 97, 129, 255, 0, 300),
    ),
    new PokemonSpecies(Species.MAGEARNA, 7, false, false, true, "Artificial Pokémon", Type.STEEL, Type.FAIRY, 1, 80.5, Abilities.SOUL_HEART, Abilities.NONE, Abilities.NONE, 600, 80, 95, 115, 130, 115, 65, 3, 0, 300, GrowthRate.SLOW, null, false, false,
      new PokemonForm("Normal", "", Type.STEEL, Type.FAIRY, 1, 80.5, Abilities.SOUL_HEART, Abilities.NONE, Abilities.NONE, 600, 80, 95, 115, 130, 115, 65, 3, 0, 300, false, null, true),
      new PokemonForm("Original", "original", Type.STEEL, Type.FAIRY, 1, 80.5, Abilities.SOUL_HEART, Abilities.NONE, Abilities.NONE, 600, 80, 95, 115, 130, 115, 65, 3, 0, 300, false, null, true),
    ),
    new PokemonSpecies(Species.MARSHADOW, 7, false, false, true, "Gloomdweller Pokémon", Type.FIGHTING, Type.GHOST, 0.7, 22.2, Abilities.TECHNICIAN, Abilities.NONE, Abilities.NONE, 600, 90, 125, 80, 90, 90, 125, 3, 0, 300, GrowthRate.SLOW, null, false, true,
      new PokemonForm("Normal", "", Type.FIGHTING, Type.GHOST, 0.7, 22.2, Abilities.TECHNICIAN, Abilities.NONE, Abilities.NONE, 600, 90, 125, 80, 90, 90, 125, 3, 0, 300),
      new PokemonForm("Zenith", "zenith", Type.FIGHTING, Type.GHOST, 0.7, 22.2, Abilities.TECHNICIAN, Abilities.NONE, Abilities.NONE, 600, 90, 125, 80, 90, 90, 125, 3, 0, 300)
    ),
    new PokemonSpecies(Species.POIPOLE, 7, true, false, false, "Poison Pin Pokémon", Type.POISON, null, 0.6, 1.8, Abilities.BEAST_BOOST, Abilities.NONE, Abilities.NONE, 420, 67, 73, 67, 73, 67, 73, 45, 0, 210, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.NAGANADEL, 7, true, false, false, "Poison Pin Pokémon", Type.POISON, Type.DRAGON, 3.6, 150, Abilities.BEAST_BOOST, Abilities.NONE, Abilities.NONE, 540, 73, 73, 73, 127, 73, 121, 45, 0, 270, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.STAKATAKA, 7, true, false, false, "Rampart Pokémon", Type.ROCK, Type.STEEL, 5.5, 820, Abilities.BEAST_BOOST, Abilities.NONE, Abilities.NONE, 570, 61, 131, 211, 53, 101, 13, 30, 0, 285, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.BLACEPHALON, 7, true, false, false, "Fireworks Pokémon", Type.FIRE, Type.GHOST, 1.8, 13, Abilities.BEAST_BOOST, Abilities.NONE, Abilities.NONE, 570, 53, 127, 53, 151, 79, 107, 30, 0, 285, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.ZERAORA, 7, false, false, true, "Thunderclap Pokémon", Type.ELECTRIC, null, 1.5, 44.5, Abilities.VOLT_ABSORB, Abilities.NONE, Abilities.NONE, 600, 88, 112, 75, 102, 80, 143, 3, 0, 300, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.MELTAN, 7, false, false, true, "Hex Nut Pokémon", Type.STEEL, null, 0.2, 8, Abilities.MAGNET_PULL, Abilities.NONE, Abilities.NONE, 300, 46, 65, 65, 55, 35, 34, 3, 0, 150, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.MELMETAL, 7, false, false, true, "Hex Nut Pokémon", Type.STEEL, null, 2.5, 800, Abilities.IRON_FIST, Abilities.NONE, Abilities.NONE, 600, 135, 143, 143, 80, 65, 34, 3, 0, 300, GrowthRate.SLOW, null, false, true,
      new PokemonForm("Normal", "", Type.STEEL, null, 2.5, 800, Abilities.IRON_FIST, Abilities.NONE, Abilities.NONE, 600, 135, 143, 143, 80, 65, 34, 3, 0, 300),
      new PokemonForm("G-Max", SpeciesFormKey.GIGANTAMAX, Type.STEEL, null, 25, 800, Abilities.IRON_FIST, Abilities.NONE, Abilities.NONE, 700, 170, 165, 165, 95, 75, 30, 3, 0, 300),
    ),
    new PokemonSpecies(Species.GROOKEY, 8, false, false, false, "Chimp Pokémon", Type.GRASS, null, 0.3, 5, Abilities.OVERGROW, Abilities.NONE, Abilities.GRASSY_SURGE, 310, 50, 65, 50, 40, 40, 65, 45, 50, 62, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.THWACKEY, 8, false, false, false, "Beat Pokémon", Type.GRASS, null, 0.7, 14, Abilities.OVERGROW, Abilities.NONE, Abilities.GRASSY_SURGE, 420, 70, 85, 70, 55, 60, 80, 45, 50, 147, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.RILLABOOM, 8, false, false, false, "Drummer Pokémon", Type.GRASS, null, 2.1, 90, Abilities.OVERGROW, Abilities.NONE, Abilities.GRASSY_SURGE, 530, 100, 125, 90, 60, 70, 85, 45, 50, 265, GrowthRate.MEDIUM_SLOW, 87.5, false, true,
      new PokemonForm("Normal", "", Type.GRASS, null, 2.1, 90, Abilities.OVERGROW, Abilities.NONE, Abilities.GRASSY_SURGE, 530, 100, 125, 90, 60, 70, 85, 45, 50, 265),
      new PokemonForm("G-Max", SpeciesFormKey.GIGANTAMAX, Type.GRASS, null, 28, 90, Abilities.OVERGROW, Abilities.NONE, Abilities.GRASSY_SURGE, 630, 125, 150, 115, 75, 90, 75, 45, 50, 265),
    ),
    new PokemonSpecies(Species.SCORBUNNY, 8, false, false, false, "Rabbit Pokémon", Type.FIRE, null, 0.3, 4.5, Abilities.BLAZE, Abilities.NONE, Abilities.LIBERO, 310, 50, 71, 40, 40, 40, 69, 45, 50, 62, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.RABOOT, 8, false, false, false, "Rabbit Pokémon", Type.FIRE, null, 0.6, 9, Abilities.BLAZE, Abilities.NONE, Abilities.LIBERO, 420, 65, 86, 60, 55, 60, 94, 45, 50, 147, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.CINDERACE, 8, false, false, false, "Striker Pokémon", Type.FIRE, null, 1.4, 33, Abilities.BLAZE, Abilities.NONE, Abilities.LIBERO, 530, 80, 116, 75, 65, 75, 119, 45, 50, 265, GrowthRate.MEDIUM_SLOW, 87.5, false, true,
      new PokemonForm("Normal", "", Type.FIRE, null, 1.4, 33, Abilities.BLAZE, Abilities.NONE, Abilities.LIBERO, 530, 80, 116, 75, 65, 75, 119, 45, 50, 265),
      new PokemonForm("G-Max", SpeciesFormKey.GIGANTAMAX, Type.FIRE, null, 27, 33, Abilities.BLAZE, Abilities.NONE, Abilities.LIBERO, 630, 100, 145, 90, 75, 90, 130, 45, 50, 265),
    ),
    new PokemonSpecies(Species.SOBBLE, 8, false, false, false, "Water Lizard Pokémon", Type.WATER, null, 0.3, 4, Abilities.TORRENT, Abilities.NONE, Abilities.SNIPER, 310, 50, 40, 40, 70, 40, 70, 45, 50, 62, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.DRIZZILE, 8, false, false, false, "Water Lizard Pokémon", Type.WATER, null, 0.7, 11.5, Abilities.TORRENT, Abilities.NONE, Abilities.SNIPER, 420, 65, 60, 55, 95, 55, 90, 45, 50, 147, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.INTELEON, 8, false, false, false, "Secret Agent Pokémon", Type.WATER, null, 1.9, 45.2, Abilities.TORRENT, Abilities.NONE, Abilities.SNIPER, 530, 70, 85, 65, 125, 65, 120, 45, 50, 265, GrowthRate.MEDIUM_SLOW, 87.5, false, true,
      new PokemonForm("Normal", "", Type.WATER, null, 1.9, 45.2, Abilities.TORRENT, Abilities.NONE, Abilities.SNIPER, 530, 70, 85, 65, 125, 65, 120, 45, 50, 265),
      new PokemonForm("G-Max", SpeciesFormKey.GIGANTAMAX, Type.WATER, null, 40, 45.2, Abilities.TORRENT, Abilities.NONE, Abilities.SNIPER, 630, 90, 100, 90, 150, 90, 110, 45, 50, 265),
    ),
    new PokemonSpecies(Species.SKWOVET, 8, false, false, false, "Cheeky Pokémon", Type.NORMAL, null, 0.3, 2.5, Abilities.CHEEK_POUCH, Abilities.NONE, Abilities.GLUTTONY, 275, 70, 55, 55, 35, 35, 25, 255, 50, 55, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.GREEDENT, 8, false, false, false, "Greedy Pokémon", Type.NORMAL, null, 0.6, 6, Abilities.CHEEK_POUCH, Abilities.NONE, Abilities.GLUTTONY, 460, 120, 95, 95, 55, 75, 20, 90, 50, 161, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.ROOKIDEE, 8, false, false, false, "Tiny Bird Pokémon", Type.FLYING, null, 0.2, 1.8, Abilities.KEEN_EYE, Abilities.UNNERVE, Abilities.BIG_PECKS, 245, 38, 47, 35, 33, 35, 57, 255, 50, 49, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.CORVISQUIRE, 8, false, false, false, "Raven Pokémon", Type.FLYING, null, 0.8, 16, Abilities.KEEN_EYE, Abilities.UNNERVE, Abilities.BIG_PECKS, 365, 68, 67, 55, 43, 55, 77, 120, 50, 128, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.CORVIKNIGHT, 8, false, false, false, "Raven Pokémon", Type.FLYING, Type.STEEL, 2.2, 75, Abilities.PRESSURE, Abilities.UNNERVE, Abilities.MIRROR_ARMOR, 495, 98, 87, 105, 53, 85, 67, 45, 50, 248, GrowthRate.MEDIUM_SLOW, 50, false, true,
      new PokemonForm("Normal", "", Type.FLYING, Type.STEEL, 2.2, 75, Abilities.PRESSURE, Abilities.UNNERVE, Abilities.MIRROR_ARMOR, 495, 98, 87, 105, 53, 85, 67, 45, 50, 248),
      new PokemonForm("G-Max", SpeciesFormKey.GIGANTAMAX, Type.FLYING, Type.STEEL, 14, 75, Abilities.PRESSURE, Abilities.UNNERVE, Abilities.MIRROR_ARMOR, 595, 125, 100, 135, 60, 95, 80, 45, 50, 248),
    ),
    new PokemonSpecies(Species.BLIPBUG, 8, false, false, false, "Larva Pokémon", Type.BUG, null, 0.4, 8, Abilities.SWARM, Abilities.COMPOUND_EYES, Abilities.TELEPATHY, 180, 25, 20, 20, 25, 45, 45, 255, 50, 36, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.DOTTLER, 8, false, false, false, "Radome Pokémon", Type.BUG, Type.PSYCHIC, 0.4, 19.5, Abilities.SWARM, Abilities.COMPOUND_EYES, Abilities.TELEPATHY, 335, 50, 35, 80, 50, 90, 30, 120, 50, 117, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.ORBEETLE, 8, false, false, false, "Seven Spot Pokémon", Type.BUG, Type.PSYCHIC, 0.4, 40.8, Abilities.SWARM, Abilities.FRISK, Abilities.TELEPATHY, 505, 60, 45, 110, 80, 120, 90, 45, 50, 253, GrowthRate.MEDIUM_FAST, 50, false, true,
      new PokemonForm("Normal", "", Type.BUG, Type.PSYCHIC, 0.4, 40.8, Abilities.SWARM, Abilities.FRISK, Abilities.TELEPATHY, 505, 60, 45, 110, 80, 120, 90, 45, 50, 253),
      new PokemonForm("G-Max", SpeciesFormKey.GIGANTAMAX, Type.BUG, Type.PSYCHIC, 14, 40.8, Abilities.SWARM, Abilities.FRISK, Abilities.TELEPATHY, 605, 75, 50, 140, 90, 150, 100, 45, 50, 253),
    ),
    new PokemonSpecies(Species.NICKIT, 8, false, false, false, "Fox Pokémon", Type.DARK, null, 0.6, 8.9, Abilities.RUN_AWAY, Abilities.UNBURDEN, Abilities.STAKEOUT, 245, 40, 28, 28, 47, 52, 50, 255, 50, 49, GrowthRate.FAST, 50, false),
    new PokemonSpecies(Species.THIEVUL, 8, false, false, false, "Fox Pokémon", Type.DARK, null, 1.2, 19.9, Abilities.RUN_AWAY, Abilities.UNBURDEN, Abilities.STAKEOUT, 455, 70, 58, 58, 87, 92, 90, 127, 50, 159, GrowthRate.FAST, 50, false),
    new PokemonSpecies(Species.GOSSIFLEUR, 8, false, false, false, "Flowering Pokémon", Type.GRASS, null, 0.4, 2.2, Abilities.COTTON_DOWN, Abilities.REGENERATOR, Abilities.EFFECT_SPORE, 250, 40, 40, 60, 40, 60, 10, 190, 50, 50, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.ELDEGOSS, 8, false, false, false, "Cotton Bloom Pokémon", Type.GRASS, null, 0.5, 2.5, Abilities.COTTON_DOWN, Abilities.REGENERATOR, Abilities.EFFECT_SPORE, 460, 60, 50, 90, 80, 120, 60, 75, 50, 161, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.WOOLOO, 8, false, false, false, "Sheep Pokémon", Type.NORMAL, null, 0.6, 6, Abilities.FLUFFY, Abilities.RUN_AWAY, Abilities.BULLETPROOF, 270, 42, 40, 55, 40, 45, 48, 255, 50, 122, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.DUBWOOL, 8, false, false, false, "Sheep Pokémon", Type.NORMAL, null, 1.3, 43, Abilities.FLUFFY, Abilities.STEADFAST, Abilities.BULLETPROOF, 490, 72, 80, 100, 60, 90, 88, 127, 50, 172, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.CHEWTLE, 8, false, false, false, "Snapping Pokémon", Type.WATER, null, 0.3, 8.5, Abilities.STRONG_JAW, Abilities.SHELL_ARMOR, Abilities.SWIFT_SWIM, 284, 50, 64, 50, 38, 38, 44, 255, 50, 57, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.DREDNAW, 8, false, false, false, "Bite Pokémon", Type.WATER, Type.ROCK, 1, 115.5, Abilities.STRONG_JAW, Abilities.SHELL_ARMOR, Abilities.SWIFT_SWIM, 485, 90, 115, 90, 48, 68, 74, 75, 50, 170, GrowthRate.MEDIUM_FAST, 50, false, true,
      new PokemonForm("Normal", "", Type.WATER, Type.ROCK, 1, 115.5, Abilities.STRONG_JAW, Abilities.SHELL_ARMOR, Abilities.SWIFT_SWIM, 485, 90, 115, 90, 48, 68, 74, 75, 50, 170),
      new PokemonForm("G-Max", SpeciesFormKey.GIGANTAMAX, Type.WATER, Type.ROCK, 24, 115.5, Abilities.STRONG_JAW, Abilities.SHELL_ARMOR, Abilities.SWIFT_SWIM, 585, 115, 150, 110, 55, 85, 70, 75, 50, 170),
    ),
    new PokemonSpecies(Species.YAMPER, 8, false, false, false, "Puppy Pokémon", Type.ELECTRIC, null, 0.3, 13.5, Abilities.BALL_FETCH, Abilities.NONE, Abilities.RATTLED, 270, 59, 45, 50, 40, 50, 26, 255, 50, 54, GrowthRate.FAST, 50, false),
    new PokemonSpecies(Species.BOLTUND, 8, false, false, false, "Dog Pokémon", Type.ELECTRIC, null, 1, 34, Abilities.STRONG_JAW, Abilities.NONE, Abilities.COMPETITIVE, 490, 69, 90, 60, 90, 60, 121, 45, 50, 172, GrowthRate.FAST, 50, false),
    new PokemonSpecies(Species.ROLYCOLY, 8, false, false, false, "Coal Pokémon", Type.ROCK, null, 0.3, 12, Abilities.STEAM_ENGINE, Abilities.HEATPROOF, Abilities.FLASH_FIRE, 240, 30, 40, 50, 40, 50, 30, 255, 50, 48, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.CARKOL, 8, false, false, false, "Coal Pokémon", Type.ROCK, Type.FIRE, 1.1, 78, Abilities.STEAM_ENGINE, Abilities.FLAME_BODY, Abilities.FLASH_FIRE, 410, 80, 60, 90, 60, 70, 50, 120, 50, 144, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.COALOSSAL, 8, false, false, false, "Coal Pokémon", Type.ROCK, Type.FIRE, 2.8, 310.5, Abilities.STEAM_ENGINE, Abilities.FLAME_BODY, Abilities.FLASH_FIRE, 510, 110, 80, 120, 80, 90, 30, 45, 50, 255, GrowthRate.MEDIUM_SLOW, 50, false, true,
      new PokemonForm("Normal", "", Type.ROCK, Type.FIRE, 2.8, 310.5, Abilities.STEAM_ENGINE, Abilities.FLAME_BODY, Abilities.FLASH_FIRE, 510, 110, 80, 120, 80, 90, 30, 45, 50, 255),
      new PokemonForm("G-Max", SpeciesFormKey.GIGANTAMAX, Type.ROCK, Type.FIRE, 42, 310.5, Abilities.STEAM_ENGINE, Abilities.FLAME_BODY, Abilities.FLASH_FIRE, 610, 140, 95, 150, 95, 105, 25, 45, 50, 255),
    ),
    new PokemonSpecies(Species.APPLIN, 8, false, false, false, "Apple Core Pokémon", Type.GRASS, Type.DRAGON, 0.2, 0.5, Abilities.RIPEN, Abilities.GLUTTONY, Abilities.BULLETPROOF, 260, 40, 40, 80, 40, 40, 20, 255, 50, 52, GrowthRate.ERRATIC, 50, false),
    new PokemonSpecies(Species.FLAPPLE, 8, false, false, false, "Apple Wing Pokémon", Type.GRASS, Type.DRAGON, 0.3, 1, Abilities.RIPEN, Abilities.GLUTTONY, Abilities.HUSTLE, 485, 70, 110, 80, 95, 60, 70, 45, 50, 170, GrowthRate.ERRATIC, 50, false, true,
      new PokemonForm("Normal", "", Type.GRASS, Type.DRAGON, 0.3, 1, Abilities.RIPEN, Abilities.GLUTTONY, Abilities.HUSTLE, 485, 70, 110, 80, 95, 60, 70, 45, 50, 170),
      new PokemonForm("G-Max", SpeciesFormKey.GIGANTAMAX, Type.GRASS, Type.DRAGON, 24, 1, Abilities.RIPEN, Abilities.GLUTTONY, Abilities.HUSTLE, 585, 90, 140, 90, 120, 75, 70, 45, 50, 170),
    ),
    new PokemonSpecies(Species.APPLETUN, 8, false, false, false, "Apple Nectar Pokémon", Type.GRASS, Type.DRAGON, 0.4, 13, Abilities.RIPEN, Abilities.GLUTTONY, Abilities.THICK_FAT, 485, 110, 85, 80, 100, 80, 30, 45, 50, 170, GrowthRate.ERRATIC, 50, false, true,
      new PokemonForm("Normal", "", Type.GRASS, Type.DRAGON, 0.4, 13, Abilities.RIPEN, Abilities.GLUTTONY, Abilities.THICK_FAT, 485, 110, 85, 80, 100, 80, 30, 45, 50, 170),
      new PokemonForm("G-Max", SpeciesFormKey.GIGANTAMAX, Type.GRASS, Type.DRAGON, 24, 13, Abilities.RIPEN, Abilities.GLUTTONY, Abilities.THICK_FAT, 585, 140, 95, 95, 135, 95, 25, 45, 50, 170),
    ),
    new PokemonSpecies(Species.SILICOBRA, 8, false, false, false, "Sand Snake Pokémon", Type.GROUND, null, 2.2, 7.6, Abilities.SAND_SPIT, Abilities.SHED_SKIN, Abilities.SAND_VEIL, 315, 52, 57, 75, 35, 50, 46, 255, 50, 63, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.SANDACONDA, 8, false, false, false, "Sand Snake Pokémon", Type.GROUND, null, 3.8, 65.5, Abilities.SAND_SPIT, Abilities.SHED_SKIN, Abilities.SAND_VEIL, 510, 72, 107, 125, 65, 70, 71, 120, 50, 179, GrowthRate.MEDIUM_FAST, 50, false, true,
      new PokemonForm("Normal", "", Type.GROUND, null, 3.8, 65.5, Abilities.SAND_SPIT, Abilities.SHED_SKIN, Abilities.SAND_VEIL, 510, 72, 107, 125, 65, 70, 71, 120, 50, 179),
      new PokemonForm("G-Max", SpeciesFormKey.GIGANTAMAX, Type.GROUND, null, 22, 65.5, Abilities.SAND_SPIT, Abilities.SHED_SKIN, Abilities.SAND_VEIL, 610, 90, 135, 150, 75, 80, 80, 120, 50, 179),
    ),
    new PokemonSpecies(Species.CRAMORANT, 8, false, false, false, "Gulp Pokémon", Type.FLYING, Type.WATER, 0.8, 18, Abilities.GULP_MISSILE, Abilities.NONE, Abilities.NONE, 475, 70, 85, 55, 85, 95, 85, 45, 50, 166, GrowthRate.MEDIUM_FAST, 50, false, false,
      new PokemonForm("Normal", "", Type.FLYING, Type.WATER, 0.8, 18, Abilities.GULP_MISSILE, Abilities.NONE, Abilities.NONE, 475, 70, 85, 55, 85, 95, 85, 45, 50, 166),
      new PokemonForm("Gulping Form", "gulping", Type.FLYING, Type.WATER, 0.8, 18, Abilities.GULP_MISSILE, Abilities.NONE, Abilities.NONE, 475, 70, 85, 55, 85, 95, 85, 45, 50, 166),
      new PokemonForm("Gorging Form", "gorging", Type.FLYING, Type.WATER, 0.8, 18, Abilities.GULP_MISSILE, Abilities.NONE, Abilities.NONE, 475, 70, 85, 55, 85, 95, 85, 45, 50, 166),
    ),
    new PokemonSpecies(Species.ARROKUDA, 8, false, false, false, "Rush Pokémon", Type.WATER, null, 0.5, 1, Abilities.SWIFT_SWIM, Abilities.NONE, Abilities.PROPELLER_TAIL, 280, 41, 63, 40, 40, 30, 66, 255, 50, 56, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.BARRASKEWDA, 8, false, false, false, "Skewer Pokémon", Type.WATER, null, 1.3, 30, Abilities.SWIFT_SWIM, Abilities.NONE, Abilities.PROPELLER_TAIL, 490, 61, 123, 60, 60, 50, 136, 60, 50, 172, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.TOXEL, 8, false, false, false, "Baby Pokémon", Type.ELECTRIC, Type.POISON, 0.4, 11, Abilities.RATTLED, Abilities.STATIC, Abilities.KLUTZ, 242, 40, 38, 35, 54, 35, 40, 75, 50, 48, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.TOXTRICITY, 8, false, false, false, "Punk Pokémon", Type.ELECTRIC, Type.POISON, 1.6, 40, Abilities.PUNK_ROCK, Abilities.PLUS, Abilities.TECHNICIAN, 502, 75, 98, 70, 114, 70, 75, 45, 50, 176, GrowthRate.MEDIUM_SLOW, 50, false, true,
      new PokemonForm("Amped Form", "amped", Type.ELECTRIC, Type.POISON, 1.6, 40, Abilities.PUNK_ROCK, Abilities.PLUS, Abilities.TECHNICIAN, 502, 75, 98, 70, 114, 70, 75, 45, 50, 176, false, ""),
      new PokemonForm("Low-Key Form", "lowkey", Type.ELECTRIC, Type.POISON, 1.6, 40, Abilities.PUNK_ROCK, Abilities.MINUS, Abilities.TECHNICIAN, 502, 75, 98, 70, 114, 70, 75, 45, 50, 176),
      new PokemonForm("G-Max", SpeciesFormKey.GIGANTAMAX, Type.ELECTRIC, Type.POISON, 24, 40, Abilities.PUNK_ROCK, Abilities.MINUS, Abilities.TECHNICIAN, 602, 95, 118, 80, 144, 80, 85, 45, 50, 176),
    ),
    new PokemonSpecies(Species.SIZZLIPEDE, 8, false, false, false, "Radiator Pokémon", Type.FIRE, Type.BUG, 0.7, 1, Abilities.FLASH_FIRE, Abilities.WHITE_SMOKE, Abilities.FLAME_BODY, 305, 50, 65, 45, 50, 50, 45, 190, 50, 61, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.CENTISKORCH, 8, false, false, false, "Radiator Pokémon", Type.FIRE, Type.BUG, 3, 120, Abilities.FLASH_FIRE, Abilities.WHITE_SMOKE, Abilities.FLAME_BODY, 525, 100, 115, 65, 90, 90, 65, 75, 50, 184, GrowthRate.MEDIUM_FAST, 50, false, true,
      new PokemonForm("Normal", "", Type.FIRE, Type.BUG, 3, 120, Abilities.FLASH_FIRE, Abilities.WHITE_SMOKE, Abilities.FLAME_BODY, 525, 100, 115, 65, 90, 90, 65, 75, 50, 184),
      new PokemonForm("G-Max", SpeciesFormKey.GIGANTAMAX, Type.FIRE, Type.BUG, 75, 120, Abilities.FLASH_FIRE, Abilities.WHITE_SMOKE, Abilities.FLAME_BODY, 625, 125, 145, 75, 105, 105, 70, 75, 50, 184),
    ),
    new PokemonSpecies(Species.CLOBBOPUS, 8, false, false, false, "Tantrum Pokémon", Type.FIGHTING, null, 0.6, 4, Abilities.LIMBER, Abilities.NONE, Abilities.TECHNICIAN, 310, 50, 68, 60, 50, 50, 32, 180, 50, 62, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.GRAPPLOCT, 8, false, false, false, "Jujitsu Pokémon", Type.FIGHTING, null, 1.6, 39, Abilities.LIMBER, Abilities.NONE, Abilities.TECHNICIAN, 480, 80, 118, 90, 70, 80, 42, 45, 50, 168, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.SINISTEA, 8, false, false, false, "Black Tea Pokémon", Type.GHOST, null, 0.1, 0.2, Abilities.WEAK_ARMOR, Abilities.NONE, Abilities.CURSED_BODY, 308, 40, 45, 45, 74, 54, 50, 120, 50, 62, GrowthRate.MEDIUM_FAST, null, false, false,
      new PokemonForm("Phony Form", "phony", Type.GHOST, null, 0.1, 0.2, Abilities.WEAK_ARMOR, Abilities.NONE, Abilities.CURSED_BODY, 308, 40, 45, 45, 74, 54, 50, 120, 50, 62, false, "", true),
      new PokemonForm("Antique Form", "antique", Type.GHOST, null, 0.1, 0.2, Abilities.WEAK_ARMOR, Abilities.NONE, Abilities.CURSED_BODY, 308, 40, 45, 45, 74, 54, 50, 120, 50, 62, false, "", true),
    ),
    new PokemonSpecies(Species.POLTEAGEIST, 8, false, false, false, "Black Tea Pokémon", Type.GHOST, null, 0.2, 0.4, Abilities.WEAK_ARMOR, Abilities.NONE, Abilities.CURSED_BODY, 508, 60, 65, 65, 134, 114, 70, 60, 50, 178, GrowthRate.MEDIUM_FAST, null, false, false,
      new PokemonForm("Phony Form", "phony", Type.GHOST, null, 0.2, 0.4, Abilities.WEAK_ARMOR, Abilities.NONE, Abilities.CURSED_BODY, 508, 60, 65, 65, 134, 114, 70, 60, 50, 178, false, ""),
      new PokemonForm("Antique Form", "antique", Type.GHOST, null, 0.2, 0.4, Abilities.WEAK_ARMOR, Abilities.NONE, Abilities.CURSED_BODY, 508, 60, 65, 65, 134, 114, 70, 60, 50, 178, false, ""),
    ),
    new PokemonSpecies(Species.HATENNA, 8, false, false, false, "Calm Pokémon", Type.PSYCHIC, null, 0.4, 3.4, Abilities.HEALER, Abilities.ANTICIPATION, Abilities.MAGIC_BOUNCE, 265, 42, 30, 45, 56, 53, 39, 235, 50, 53, GrowthRate.SLOW, 0, false),
    new PokemonSpecies(Species.HATTREM, 8, false, false, false, "Serene Pokémon", Type.PSYCHIC, null, 0.6, 4.8, Abilities.HEALER, Abilities.ANTICIPATION, Abilities.MAGIC_BOUNCE, 370, 57, 40, 65, 86, 73, 49, 120, 50, 130, GrowthRate.SLOW, 0, false),
    new PokemonSpecies(Species.HATTERENE, 8, false, false, false, "Silent Pokémon", Type.PSYCHIC, Type.FAIRY, 2.1, 5.1, Abilities.HEALER, Abilities.ANTICIPATION, Abilities.MAGIC_BOUNCE, 510, 57, 90, 95, 136, 103, 29, 45, 50, 255, GrowthRate.SLOW, 0, false, true,
      new PokemonForm("Normal", "", Type.PSYCHIC, Type.FAIRY, 2.1, 5.1, Abilities.HEALER, Abilities.ANTICIPATION, Abilities.MAGIC_BOUNCE, 510, 57, 90, 95, 136, 103, 29, 45, 50, 255),
      new PokemonForm("G-Max", SpeciesFormKey.GIGANTAMAX, Type.PSYCHIC, Type.FAIRY, 26, 5.1, Abilities.HEALER, Abilities.ANTICIPATION, Abilities.MAGIC_BOUNCE, 610, 70, 105, 110, 160, 125, 40, 45, 50, 255),
    ),
    new PokemonSpecies(Species.IMPIDIMP, 8, false, false, false, "Wily Pokémon", Type.DARK, Type.FAIRY, 0.4, 5.5, Abilities.PRANKSTER, Abilities.FRISK, Abilities.PICKPOCKET, 265, 45, 45, 30, 55, 40, 50, 255, 50, 53, GrowthRate.MEDIUM_FAST, 100, false),
    new PokemonSpecies(Species.MORGREM, 8, false, false, false, "Devious Pokémon", Type.DARK, Type.FAIRY, 0.8, 12.5, Abilities.PRANKSTER, Abilities.FRISK, Abilities.PICKPOCKET, 370, 65, 60, 45, 75, 55, 70, 120, 50, 130, GrowthRate.MEDIUM_FAST, 100, false),
    new PokemonSpecies(Species.GRIMMSNARL, 8, false, false, false, "Bulk Up Pokémon", Type.DARK, Type.FAIRY, 1.5, 61, Abilities.PRANKSTER, Abilities.FRISK, Abilities.PICKPOCKET, 510, 95, 120, 65, 95, 75, 60, 45, 50, 255, GrowthRate.MEDIUM_FAST, 100, false, true,
      new PokemonForm("Normal", "", Type.DARK, Type.FAIRY, 1.5, 61, Abilities.PRANKSTER, Abilities.FRISK, Abilities.PICKPOCKET, 510, 95, 120, 65, 95, 75, 60, 45, 50, 255),
      new PokemonForm("G-Max", SpeciesFormKey.GIGANTAMAX, Type.DARK, Type.FAIRY, 32, 61, Abilities.PRANKSTER, Abilities.FRISK, Abilities.PICKPOCKET, 610, 120, 155, 75, 110, 85, 65, 45, 50, 255),
    ),
    new PokemonSpecies(Species.OBSTAGOON, 8, false, false, false, "Blocking Pokémon", Type.DARK, Type.NORMAL, 1.6, 46, Abilities.RECKLESS, Abilities.GUTS, Abilities.DEFIANT, 520, 93, 90, 101, 60, 81, 95, 45, 50, 260, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.PERRSERKER, 8, false, false, false, "Viking Pokémon", Type.STEEL, null, 0.8, 28, Abilities.BATTLE_ARMOR, Abilities.TOUGH_CLAWS, Abilities.STEELY_SPIRIT, 440, 70, 110, 100, 50, 60, 50, 90, 50, 154, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.CURSOLA, 8, false, false, false, "Coral Pokémon", Type.GHOST, null, 1, 0.4, Abilities.WEAK_ARMOR, Abilities.NONE, Abilities.PERISH_BODY, 510, 60, 95, 50, 145, 130, 30, 30, 50, 179, GrowthRate.FAST, 25, false),
    new PokemonSpecies(Species.SIRFETCHD, 8, false, false, false, "Wild Duck Pokémon", Type.FIGHTING, null, 0.8, 117, Abilities.STEADFAST, Abilities.NONE, Abilities.SCRAPPY, 507, 62, 135, 95, 68, 82, 65, 45, 50, 177, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.MR_RIME, 8, false, false, false, "Comedian Pokémon", Type.ICE, Type.PSYCHIC, 1.5, 58.2, Abilities.TANGLED_FEET, Abilities.SCREEN_CLEANER, Abilities.ICE_BODY, 520, 80, 85, 75, 110, 100, 70, 45, 50, 182, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.RUNERIGUS, 8, false, false, false, "Grudge Pokémon", Type.GROUND, Type.GHOST, 1.6, 66.6, Abilities.WANDERING_SPIRIT, Abilities.NONE, Abilities.NONE, 483, 58, 95, 145, 50, 105, 30, 90, 50, 169, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.MILCERY, 8, false, false, false, "Cream Pokémon", Type.FAIRY, null, 0.2, 0.3, Abilities.SWEET_VEIL, Abilities.NONE, Abilities.AROMA_VEIL, 270, 45, 40, 40, 50, 61, 34, 200, 50, 54, GrowthRate.MEDIUM_FAST, 0, false),
    new PokemonSpecies(Species.ALCREMIE, 8, false, false, false, "Cream Pokémon", Type.FAIRY, null, 0.3, 0.5, Abilities.SWEET_VEIL, Abilities.NONE, Abilities.AROMA_VEIL, 495, 65, 60, 75, 110, 121, 64, 100, 50, 173, GrowthRate.MEDIUM_FAST, 0, false, true,
      new PokemonForm("Vanilla Cream", "vanilla-cream", Type.FAIRY, null, 0.3, 0.5, Abilities.SWEET_VEIL, Abilities.NONE, Abilities.AROMA_VEIL, 495, 65, 60, 75, 110, 121, 64, 100, 50, 173, false, "", true),
      new PokemonForm("Ruby Cream", "ruby-cream", Type.FAIRY, null, 0.3, 0.5, Abilities.SWEET_VEIL, Abilities.NONE, Abilities.AROMA_VEIL, 495, 65, 60, 75, 110, 121, 64, 100, 50, 173, false, null, true),
      new PokemonForm("Matcha Cream", "matcha-cream", Type.FAIRY, null, 0.3, 0.5, Abilities.SWEET_VEIL, Abilities.NONE, Abilities.AROMA_VEIL, 495, 65, 60, 75, 110, 121, 64, 100, 50, 173, false, null, true),
      new PokemonForm("Mint Cream", "mint-cream", Type.FAIRY, null, 0.3, 0.5, Abilities.SWEET_VEIL, Abilities.NONE, Abilities.AROMA_VEIL, 495, 65, 60, 75, 110, 121, 64, 100, 50, 173, false, null, true),
      new PokemonForm("Lemon Cream", "lemon-cream", Type.FAIRY, null, 0.3, 0.5, Abilities.SWEET_VEIL, Abilities.NONE, Abilities.AROMA_VEIL, 495, 65, 60, 75, 110, 121, 64, 100, 50, 173, false, null, true),
      new PokemonForm("Salted Cream", "salted-cream", Type.FAIRY, null, 0.3, 0.5, Abilities.SWEET_VEIL, Abilities.NONE, Abilities.AROMA_VEIL, 495, 65, 60, 75, 110, 121, 64, 100, 50, 173, false, null, true),
      new PokemonForm("Ruby Swirl", "ruby-swirl", Type.FAIRY, null, 0.3, 0.5, Abilities.SWEET_VEIL, Abilities.NONE, Abilities.AROMA_VEIL, 495, 65, 60, 75, 110, 121, 64, 100, 50, 173, false, null, true),
      new PokemonForm("Caramel Swirl", "caramel-swirl", Type.FAIRY, null, 0.3, 0.5, Abilities.SWEET_VEIL, Abilities.NONE, Abilities.AROMA_VEIL, 495, 65, 60, 75, 110, 121, 64, 100, 50, 173, false, null, true),
      new PokemonForm("Rainbow Swirl", "rainbow-swirl", Type.FAIRY, null, 0.3, 0.5, Abilities.SWEET_VEIL, Abilities.NONE, Abilities.AROMA_VEIL, 495, 65, 60, 75, 110, 121, 64, 100, 50, 173, false, null, true),
      new PokemonForm("G-Max", SpeciesFormKey.GIGANTAMAX, Type.FAIRY, null, 30, 0.5, Abilities.SWEET_VEIL, Abilities.NONE, Abilities.AROMA_VEIL, 595, 80, 70, 85, 140, 150, 65, 100, 50, 173),
    ),
    new PokemonSpecies(Species.FALINKS, 8, false, false, false, "Formation Pokémon", Type.FIGHTING, null, 3, 62, Abilities.BATTLE_ARMOR, Abilities.NONE, Abilities.DEFIANT, 470, 65, 100, 100, 70, 60, 75, 45, 50, 165, GrowthRate.MEDIUM_FAST, null, false),
    new PokemonSpecies(Species.PINCURCHIN, 8, false, false, false, "Sea Urchin Pokémon", Type.ELECTRIC, null, 0.3, 1, Abilities.LIGHTNING_ROD, Abilities.NONE, Abilities.ELECTRIC_SURGE, 435, 48, 101, 95, 91, 85, 15, 75, 50, 152, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.SNOM, 8, false, false, false, "Worm Pokémon", Type.ICE, Type.BUG, 0.3, 3.8, Abilities.SHIELD_DUST, Abilities.NONE, Abilities.ICE_SCALES, 185, 30, 25, 35, 45, 30, 20, 190, 50, 37, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.FROSMOTH, 8, false, false, false, "Frost Moth Pokémon", Type.ICE, Type.BUG, 1.3, 42, Abilities.SHIELD_DUST, Abilities.NONE, Abilities.ICE_SCALES, 475, 70, 65, 60, 125, 90, 65, 75, 50, 166, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.STONJOURNER, 8, false, false, false, "Big Rock Pokémon", Type.ROCK, null, 2.5, 520, Abilities.POWER_SPOT, Abilities.NONE, Abilities.NONE, 470, 100, 125, 135, 20, 20, 70, 60, 50, 165, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.EISCUE, 8, false, false, false, "Penguin Pokémon", Type.ICE, null, 1.4, 89, Abilities.ICE_FACE, Abilities.NONE, Abilities.NONE, 470, 75, 80, 110, 65, 90, 50, 60, 50, 165, GrowthRate.SLOW, 50, false, false,
      new PokemonForm("Ice Face", "", Type.ICE, null, 1.4, 89, Abilities.ICE_FACE, Abilities.NONE, Abilities.NONE, 470, 75, 80, 110, 65, 90, 50, 60, 50, 165),
      new PokemonForm("No Ice", "no-ice", Type.ICE, null, 1.4, 89, Abilities.ICE_FACE, Abilities.NONE, Abilities.NONE, 470, 75, 80, 70, 65, 50, 130, 60, 50, 165),
    ),
    new PokemonSpecies(Species.INDEEDEE, 8, false, false, false, "Emotion Pokémon", Type.PSYCHIC, Type.NORMAL, 0.9, 28, Abilities.INNER_FOCUS, Abilities.SYNCHRONIZE, Abilities.PSYCHIC_SURGE, 475, 60, 65, 55, 105, 95, 95, 30, 140, 166, GrowthRate.FAST, 50, false, false,
      new PokemonForm("Male", "male", Type.PSYCHIC, Type.NORMAL, 0.9, 28, Abilities.INNER_FOCUS, Abilities.SYNCHRONIZE, Abilities.PSYCHIC_SURGE, 475, 60, 65, 55, 105, 95, 95, 30, 140, 166, false, "", true),
      new PokemonForm("Female", "female", Type.PSYCHIC, Type.NORMAL, 0.9, 28, Abilities.OWN_TEMPO, Abilities.SYNCHRONIZE, Abilities.PSYCHIC_SURGE, 475, 70, 55, 65, 95, 105, 85, 30, 140, 166, false, null, true),
    ),
    new PokemonSpecies(Species.MORPEKO, 8, false, false, false, "Two-Sided Pokémon", Type.ELECTRIC, Type.DARK, 0.3, 3, Abilities.HUNGER_SWITCH, Abilities.NONE, Abilities.NONE, 436, 58, 95, 58, 70, 58, 97, 180, 50, 153, GrowthRate.MEDIUM_FAST, 50, false, false,
      new PokemonForm("Full Belly Mode", "full-belly", Type.ELECTRIC, Type.DARK, 0.3, 3, Abilities.HUNGER_SWITCH, Abilities.NONE, Abilities.NONE, 436, 58, 95, 58, 70, 58, 97, 180, 50, 153, false, ""),
      new PokemonForm("Hangry Mode", "hangry", Type.ELECTRIC, Type.DARK, 0.3, 3, Abilities.HUNGER_SWITCH, Abilities.NONE, Abilities.NONE, 436, 58, 95, 58, 70, 58, 97, 180, 50, 153),
    ),
    new PokemonSpecies(Species.CUFANT, 8, false, false, false, "Copperderm Pokémon", Type.STEEL, null, 1.2, 100, Abilities.SHEER_FORCE, Abilities.NONE, Abilities.HEAVY_METAL, 330, 72, 80, 49, 40, 49, 40, 190, 50, 66, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.COPPERAJAH, 8, false, false, false, "Copperderm Pokémon", Type.STEEL, null, 3, 650, Abilities.SHEER_FORCE, Abilities.NONE, Abilities.HEAVY_METAL, 500, 122, 130, 69, 80, 69, 30, 90, 50, 175, GrowthRate.MEDIUM_FAST, 50, false, true,
      new PokemonForm("Normal", "", Type.STEEL, null, 3, 650, Abilities.SHEER_FORCE, Abilities.NONE, Abilities.HEAVY_METAL, 500, 122, 130, 69, 80, 69, 30, 90, 50, 175),
      new PokemonForm("G-Max", SpeciesFormKey.GIGANTAMAX, Type.STEEL, null, 23, 650, Abilities.SHEER_FORCE, Abilities.NONE, Abilities.HEAVY_METAL, 600, 150, 160, 80, 90, 80, 40, 90, 50, 175),
    ),
    new PokemonSpecies(Species.DRACOZOLT, 8, false, false, false, "Fossil Pokémon", Type.ELECTRIC, Type.DRAGON, 1.8, 190, Abilities.VOLT_ABSORB, Abilities.HUSTLE, Abilities.SAND_RUSH, 505, 90, 100, 90, 80, 70, 75, 45, 50, 177, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.ARCTOZOLT, 8, false, false, false, "Fossil Pokémon", Type.ELECTRIC, Type.ICE, 2.3, 150, Abilities.VOLT_ABSORB, Abilities.STATIC, Abilities.SLUSH_RUSH, 505, 90, 100, 90, 90, 80, 55, 45, 50, 177, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.DRACOVISH, 8, false, false, false, "Fossil Pokémon", Type.WATER, Type.DRAGON, 2.3, 215, Abilities.WATER_ABSORB, Abilities.STRONG_JAW, Abilities.SAND_RUSH, 505, 90, 90, 100, 70, 80, 75, 45, 50, 177, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.ARCTOVISH, 8, false, false, false, "Fossil Pokémon", Type.WATER, Type.ICE, 2, 175, Abilities.WATER_ABSORB, Abilities.ICE_BODY, Abilities.SLUSH_RUSH, 505, 90, 90, 100, 80, 90, 55, 45, 50, 177, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.DURALUDON, 8, false, false, false, "Alloy Pokémon", Type.STEEL, Type.DRAGON, 1.8, 40, Abilities.LIGHT_METAL, Abilities.HEAVY_METAL, Abilities.STALWART, 535, 70, 95, 115, 120, 50, 85, 45, 50, 187, GrowthRate.MEDIUM_FAST, 50, false, true,
      new PokemonForm("Normal", "", Type.STEEL, Type.DRAGON, 1.8, 40, Abilities.LIGHT_METAL, Abilities.HEAVY_METAL, Abilities.STALWART, 535, 70, 95, 115, 120, 50, 85, 45, 50, 187),
      new PokemonForm("G-Max", SpeciesFormKey.GIGANTAMAX, Type.STEEL, Type.DRAGON, 43, 40, Abilities.LIGHT_METAL, Abilities.HEAVY_METAL, Abilities.STALWART, 635, 90, 110, 145, 140, 60, 90, 45, 50, 187),
    ),
    new PokemonSpecies(Species.DREEPY, 8, false, false, false, "Lingering Pokémon", Type.DRAGON, Type.GHOST, 0.5, 2, Abilities.CLEAR_BODY, Abilities.INFILTRATOR, Abilities.CURSED_BODY, 270, 28, 60, 30, 40, 30, 82, 45, 50, 54, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.DRAKLOAK, 8, false, false, false, "Caretaker Pokémon", Type.DRAGON, Type.GHOST, 1.4, 11, Abilities.CLEAR_BODY, Abilities.INFILTRATOR, Abilities.CURSED_BODY, 410, 68, 80, 50, 60, 50, 102, 45, 50, 144, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.DRAGAPULT, 8, false, false, false, "Stealth Pokémon", Type.DRAGON, Type.GHOST, 3, 50, Abilities.CLEAR_BODY, Abilities.INFILTRATOR, Abilities.CURSED_BODY, 600, 88, 120, 75, 100, 75, 142, 45, 50, 300, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.ZACIAN, 8, false, true, false, "Warrior Pokémon", Type.FAIRY, null, 2.8, 110, Abilities.INTREPID_SWORD, Abilities.NONE, Abilities.NONE, 660, 92, 120, 115, 80, 115, 138, 10, 0, 335, GrowthRate.SLOW, null, false, false,
      new PokemonForm("Hero of Many Battles", "hero", Type.FAIRY, null, 2.8, 110, Abilities.INTREPID_SWORD, Abilities.NONE, Abilities.NONE, 660, 92, 120, 115, 80, 115, 138, 10, 0, 335, false, "", true),
      new PokemonForm("Crowned", "crowned", Type.FAIRY, Type.STEEL, 2.8, 355, Abilities.INTREPID_SWORD, Abilities.NONE, Abilities.NONE, 700, 92, 150, 115, 80, 115, 148, 10, 0, 335),
    ),
    new PokemonSpecies(Species.ZAMAZENTA, 8, false, true, false, "Warrior Pokémon", Type.FIGHTING, null, 2.9, 210, Abilities.DAUNTLESS_SHIELD, Abilities.NONE, Abilities.NONE, 660, 92, 120, 115, 80, 115, 138, 10, 0, 335, GrowthRate.SLOW, null, false, false,
      new PokemonForm("Hero of Many Battles", "hero", Type.FIGHTING, null, 2.9, 210, Abilities.DAUNTLESS_SHIELD, Abilities.NONE, Abilities.NONE, 660, 92, 120, 115, 80, 115, 138, 10, 0, 335, false, "", true),
      new PokemonForm("Crowned", "crowned", Type.FIGHTING, Type.STEEL, 2.9, 785, Abilities.DAUNTLESS_SHIELD, Abilities.NONE, Abilities.NONE, 700, 92, 120, 140, 80, 140, 128, 10, 0, 335),
    ),
    new PokemonSpecies(Species.ETERNATUS, 8, false, true, false, "Gigantic Pokémon", Type.POISON, Type.DRAGON, 20, 950, Abilities.PRESSURE, Abilities.NONE, Abilities.NONE, 690, 140, 85, 95, 145, 95, 130, 255, 0, 345, GrowthRate.SLOW, null, false, true,
      new PokemonForm("Normal", "", Type.POISON, Type.DRAGON, 20, 950, Abilities.PRESSURE, Abilities.NONE, Abilities.NONE, 690, 140, 85, 95, 145, 95, 130, 255, 0, 345),
      new PokemonForm("E-Max", "eternamax", Type.POISON, Type.DRAGON, 100, 0, Abilities.PRESSURE, Abilities.NONE, Abilities.NONE, 1125, 255, 115, 250, 125, 250, 130, 255, 0, 345),
    ),
    new PokemonSpecies(Species.KUBFU, 8, true, false, false, "Wushu Pokémon", Type.FIGHTING, null, 0.6, 12, Abilities.INNER_FOCUS, Abilities.NONE, Abilities.NONE, 385, 60, 90, 60, 53, 50, 72, 3, 50, 77, GrowthRate.SLOW, 87.5, false),
    new PokemonSpecies(Species.URSHIFU, 8, true, false, false, "Wushu Pokémon", Type.FIGHTING, Type.DARK, 1.9, 105, Abilities.UNSEEN_FIST, Abilities.NONE, Abilities.NONE, 550, 100, 130, 100, 63, 60, 97, 3, 50, 275, GrowthRate.SLOW, 87.5, false, true,
      new PokemonForm("Single Strike Style", "single-strike", Type.FIGHTING, Type.DARK, 1.9, 105, Abilities.UNSEEN_FIST, Abilities.NONE, Abilities.NONE, 550, 100, 130, 100, 63, 60, 97, 3, 50, 275, false, ""),
      new PokemonForm("Rapid Strike Style", "rapid-strike", Type.FIGHTING, Type.WATER, 1.9, 105, Abilities.UNSEEN_FIST, Abilities.NONE, Abilities.NONE, 550, 100, 130, 100, 63, 60, 97, 3, 50, 275),
      new PokemonForm("G-Max Single Strike Style", SpeciesFormKey.GIGANTAMAX_SINGLE, Type.FIGHTING, Type.DARK, 29, 105, Abilities.UNSEEN_FIST, Abilities.NONE, Abilities.NONE, 650, 125, 160, 120, 75, 70, 100, 3, 50, 275),
      new PokemonForm("G-Max Rapid Strike Style", SpeciesFormKey.GIGANTAMAX_RAPID, Type.FIGHTING, Type.WATER, 26, 105, Abilities.UNSEEN_FIST, Abilities.NONE, Abilities.NONE, 650, 125, 160, 120, 75, 70, 100, 3, 50, 275),
    ),
    new PokemonSpecies(Species.ZARUDE, 8, false, false, true, "Rogue Monkey Pokémon", Type.DARK, Type.GRASS, 1.8, 70, Abilities.LEAF_GUARD, Abilities.NONE, Abilities.NONE, 600, 105, 120, 105, 70, 95, 105, 3, 0, 300, GrowthRate.SLOW, null, false, false,
      new PokemonForm("Normal", "", Type.DARK, Type.GRASS, 1.8, 70, Abilities.LEAF_GUARD, Abilities.NONE, Abilities.NONE, 600, 105, 120, 105, 70, 95, 105, 3, 0, 300, false, null, true),
      new PokemonForm("Dada", "dada", Type.DARK, Type.GRASS, 1.8, 70, Abilities.LEAF_GUARD, Abilities.NONE, Abilities.NONE, 600, 105, 120, 105, 70, 95, 105, 3, 0, 300, false, null, true),
    ),
    new PokemonSpecies(Species.REGIELEKI, 8, true, false, false, "Electron Pokémon", Type.ELECTRIC, null, 1.2, 145, Abilities.TRANSISTOR, Abilities.NONE, Abilities.NONE, 580, 80, 100, 50, 100, 50, 200, 3, 35, 290, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.REGIDRAGO, 8, true, false, false, "Dragon Orb Pokémon", Type.DRAGON, null, 2.1, 200, Abilities.DRAGONS_MAW, Abilities.NONE, Abilities.NONE, 580, 200, 100, 50, 100, 50, 80, 3, 35, 290, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.GLASTRIER, 8, true, false, false, "Wild Horse Pokémon", Type.ICE, null, 2.2, 800, Abilities.CHILLING_NEIGH, Abilities.NONE, Abilities.NONE, 580, 100, 145, 130, 65, 110, 30, 3, 35, 290, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.SPECTRIER, 8, true, false, false, "Swift Horse Pokémon", Type.GHOST, null, 2, 44.5, Abilities.GRIM_NEIGH, Abilities.NONE, Abilities.NONE, 580, 100, 65, 60, 145, 80, 130, 3, 35, 290, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.CALYREX, 8, false, true, false, "King Pokémon", Type.PSYCHIC, Type.GRASS, 1.1, 7.7, Abilities.UNNERVE, Abilities.NONE, Abilities.NONE, 500, 100, 80, 80, 80, 80, 80, 3, 100, 250, GrowthRate.SLOW, null, false, true,
      new PokemonForm("Normal", "", Type.PSYCHIC, Type.GRASS, 1.1, 7.7, Abilities.UNNERVE, Abilities.NONE, Abilities.NONE, 500, 100, 80, 80, 80, 80, 80, 3, 100, 250),
      new PokemonForm("Ice", "ice", Type.PSYCHIC, Type.ICE, 2.4, 809.1, Abilities.AS_ONE_GLASTRIER, Abilities.NONE, Abilities.NONE, 680, 100, 165, 150, 85, 130, 50, 3, 100, 250),
      new PokemonForm("Shadow", "shadow", Type.PSYCHIC, Type.GHOST, 2.4, 53.6, Abilities.AS_ONE_SPECTRIER, Abilities.NONE, Abilities.NONE, 680, 100, 85, 80, 165, 100, 150, 3, 100, 250),
    ),
    new PokemonSpecies(Species.WYRDEER, 8, false, false, false, "Big Horn Pokémon", Type.NORMAL, Type.PSYCHIC, 1.8, 95.1, Abilities.INTIMIDATE, Abilities.FRISK, Abilities.SAP_SIPPER, 525, 103, 105, 72, 105, 75, 65, 135, 50, 263, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.KLEAVOR, 8, false, false, false, "Axe Pokémon", Type.BUG, Type.ROCK, 1.8, 89, Abilities.SWARM, Abilities.SHEER_FORCE, Abilities.SHARPNESS, 500, 70, 135, 95, 45, 70, 85, 115, 50, 175, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.URSALUNA, 8, false, false, false, "Peat Pokémon", Type.GROUND, Type.NORMAL, 2.4, 290, Abilities.GUTS, Abilities.BULLETPROOF, Abilities.UNNERVE, 550, 130, 140, 105, 45, 80, 50, 75, 50, 275, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.BASCULEGION, 8, false, false, false, "Big Fish Pokémon", Type.WATER, Type.GHOST, 3, 110, Abilities.SWIFT_SWIM, Abilities.ADAPTABILITY, Abilities.MOLD_BREAKER, 530, 120, 112, 65, 80, 75, 78, 135, 50, 265, GrowthRate.MEDIUM_FAST, 50, false, false,
      new PokemonForm("Male", "male", Type.WATER, Type.GHOST, 3, 110, Abilities.SWIFT_SWIM, Abilities.ADAPTABILITY, Abilities.MOLD_BREAKER, 530, 120, 112, 65, 80, 75, 78, 135, 50, 265, false, "", true),
      new PokemonForm("Female", "female", Type.WATER, Type.GHOST, 3, 110, Abilities.SWIFT_SWIM, Abilities.ADAPTABILITY, Abilities.MOLD_BREAKER, 530, 120, 92, 65, 100, 75, 78, 135, 50, 265, false, null, true),
    ),
    new PokemonSpecies(Species.SNEASLER, 8, false, false, false, "Free Climb Pokémon", Type.FIGHTING, Type.POISON, 1.3, 43, Abilities.PRESSURE, Abilities.UNBURDEN, Abilities.POISON_TOUCH, 510, 80, 130, 60, 40, 80, 120, 135, 50, 102, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.OVERQWIL, 8, false, false, false, "Pin Cluster Pokémon", Type.DARK, Type.POISON, 2.5, 60.5, Abilities.POISON_POINT, Abilities.SWIFT_SWIM, Abilities.INTIMIDATE, 510, 85, 115, 95, 65, 65, 85, 135, 50, 179, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.ENAMORUS, 8, true, false, false, "Love-Hate Pokémon", Type.FAIRY, Type.FLYING, 1.6, 48, Abilities.CUTE_CHARM, Abilities.NONE, Abilities.CONTRARY, 580, 74, 115, 70, 135, 80, 106, 3, 50, 116, GrowthRate.SLOW, 0, false, true,
      new PokemonForm("Incarnate Forme", "incarnate", Type.FAIRY, Type.FLYING, 1.6, 48, Abilities.CUTE_CHARM, Abilities.NONE, Abilities.CONTRARY, 580, 74, 115, 70, 135, 80, 106, 3, 50, 116, false, null, true),
      new PokemonForm("Therian Forme", "therian", Type.FAIRY, Type.FLYING, 1.6, 48, Abilities.OVERCOAT, Abilities.NONE, Abilities.OVERCOAT, 580, 74, 115, 110, 135, 100, 46, 3, 50, 116),
    ),
    new PokemonSpecies(Species.SPRIGATITO, 9, false, false, false, "Grass Cat Pokémon", Type.GRASS, null, 0.4, 4.1, Abilities.OVERGROW, Abilities.NONE, Abilities.PROTEAN, 310, 40, 61, 54, 45, 45, 65, 45, 50, 62, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.FLORAGATO, 9, false, false, false, "Grass Cat Pokémon", Type.GRASS, null, 0.9, 12.2, Abilities.OVERGROW, Abilities.NONE, Abilities.PROTEAN, 410, 61, 80, 63, 60, 63, 83, 45, 50, 144, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.MEOWSCARADA, 9, false, false, false, "Magician Pokémon", Type.GRASS, Type.DARK, 1.5, 31.2, Abilities.OVERGROW, Abilities.NONE, Abilities.PROTEAN, 530, 76, 110, 70, 81, 70, 123, 45, 50, 265, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.FUECOCO, 9, false, false, false, "Fire Croc Pokémon", Type.FIRE, null, 0.4, 9.8, Abilities.BLAZE, Abilities.NONE, Abilities.UNAWARE, 310, 67, 45, 59, 63, 40, 36, 45, 50, 62, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.CROCALOR, 9, false, false, false, "Fire Croc Pokémon", Type.FIRE, null, 1, 30.7, Abilities.BLAZE, Abilities.NONE, Abilities.UNAWARE, 411, 81, 55, 78, 90, 58, 49, 45, 50, 144, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.SKELEDIRGE, 9, false, false, false, "Singer Pokémon", Type.FIRE, Type.GHOST, 1.6, 326.5, Abilities.BLAZE, Abilities.NONE, Abilities.UNAWARE, 530, 104, 75, 100, 110, 75, 66, 45, 50, 265, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.QUAXLY, 9, false, false, false, "Duckling Pokémon", Type.WATER, null, 0.5, 6.1, Abilities.TORRENT, Abilities.NONE, Abilities.MOXIE, 310, 55, 65, 45, 50, 45, 50, 45, 50, 62, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.QUAXWELL, 9, false, false, false, "Practicing Pokémon", Type.WATER, null, 1.2, 21.5, Abilities.TORRENT, Abilities.NONE, Abilities.MOXIE, 410, 70, 85, 65, 65, 60, 65, 45, 50, 144, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.QUAQUAVAL, 9, false, false, false, "Dancer Pokémon", Type.WATER, Type.FIGHTING, 1.8, 61.9, Abilities.TORRENT, Abilities.NONE, Abilities.MOXIE, 530, 85, 120, 80, 85, 75, 85, 45, 50, 265, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.LECHONK, 9, false, false, false, "Hog Pokémon", Type.NORMAL, null, 0.5, 10.2, Abilities.AROMA_VEIL, Abilities.GLUTTONY, Abilities.THICK_FAT, 254, 54, 45, 40, 35, 45, 35, 255, 50, 51, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.OINKOLOGNE, 9, false, false, false, "Hog Pokémon", Type.NORMAL, null, 1, 120, Abilities.LINGERING_AROMA, Abilities.GLUTTONY, Abilities.THICK_FAT, 489, 110, 100, 75, 59, 80, 65, 100, 50, 171, GrowthRate.MEDIUM_FAST, 50, false, false,
      new PokemonForm("Male", "male", Type.NORMAL, null, 1, 120, Abilities.LINGERING_AROMA, Abilities.GLUTTONY, Abilities.THICK_FAT, 489, 110, 100, 75, 59, 80, 65, 100, 50, 171, false, ""),
      new PokemonForm("Female", "female", Type.NORMAL, null, 1, 120, Abilities.AROMA_VEIL, Abilities.GLUTTONY, Abilities.THICK_FAT, 489, 115, 90, 70, 59, 90, 65, 100, 50, 171),
    ),
    new PokemonSpecies(Species.TAROUNTULA, 9, false, false, false, "String Ball Pokémon", Type.BUG, null, 0.3, 4, Abilities.INSOMNIA, Abilities.NONE, Abilities.STAKEOUT, 210, 35, 41, 45, 29, 40, 20, 255, 50, 42, GrowthRate.ERRATIC, 50, false),
    new PokemonSpecies(Species.SPIDOPS, 9, false, false, false, "Trap Pokémon", Type.BUG, null, 1, 16.5, Abilities.INSOMNIA, Abilities.NONE, Abilities.STAKEOUT, 404, 60, 79, 92, 52, 86, 35, 120, 50, 141, GrowthRate.ERRATIC, 50, false),
    new PokemonSpecies(Species.NYMBLE, 9, false, false, false, "Grasshopper Pokémon", Type.BUG, null, 0.2, 1, Abilities.SWARM, Abilities.NONE, Abilities.TINTED_LENS, 210, 33, 46, 40, 21, 25, 45, 190, 20, 42, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.LOKIX, 9, false, false, false, "Grasshopper Pokémon", Type.BUG, Type.DARK, 1, 17.5, Abilities.SWARM, Abilities.NONE, Abilities.TINTED_LENS, 450, 71, 102, 78, 52, 55, 92, 30, 0, 158, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.PAWMI, 9, false, false, false, "Mouse Pokémon", Type.ELECTRIC, null, 0.3, 2.5, Abilities.STATIC, Abilities.NATURAL_CURE, Abilities.IRON_FIST, 240, 45, 50, 20, 40, 25, 60, 190, 50, 48, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.PAWMO, 9, false, false, false, "Mouse Pokémon", Type.ELECTRIC, Type.FIGHTING, 0.4, 6.5, Abilities.VOLT_ABSORB, Abilities.NATURAL_CURE, Abilities.IRON_FIST, 350, 60, 75, 40, 50, 40, 85, 80, 50, 123, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.PAWMOT, 9, false, false, false, "Hands-On Pokémon", Type.ELECTRIC, Type.FIGHTING, 0.9, 41, Abilities.VOLT_ABSORB, Abilities.NATURAL_CURE, Abilities.IRON_FIST, 490, 70, 115, 70, 70, 60, 105, 45, 50, 245, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.TANDEMAUS, 9, false, false, false, "Couple Pokémon", Type.NORMAL, null, 0.3, 1.8, Abilities.RUN_AWAY, Abilities.PICKUP, Abilities.OWN_TEMPO, 305, 50, 50, 45, 40, 45, 75, 150, 50, 61, GrowthRate.FAST, null, false),
    new PokemonSpecies(Species.MAUSHOLD, 9, false, false, false, "Family Pokémon", Type.NORMAL, null, 0.3, 2.3, Abilities.FRIEND_GUARD, Abilities.CHEEK_POUCH, Abilities.TECHNICIAN, 470, 74, 75, 70, 65, 75, 111, 75, 50, 165, GrowthRate.FAST, null, false, false,
      new PokemonForm("Family of Four", "four", Type.NORMAL, null, 0.3, 2.3, Abilities.FRIEND_GUARD, Abilities.CHEEK_POUCH, Abilities.TECHNICIAN, 470, 74, 75, 70, 65, 75, 111, 75, 50, 165),
      new PokemonForm("Family of Three", "three", Type.NORMAL, null, 0.3, 2.8, Abilities.FRIEND_GUARD, Abilities.CHEEK_POUCH, Abilities.TECHNICIAN, 470, 74, 75, 70, 65, 75, 111, 75, 50, 165),
    ),
    new PokemonSpecies(Species.FIDOUGH, 9, false, false, false, "Puppy Pokémon", Type.FAIRY, null, 0.3, 10.9, Abilities.OWN_TEMPO, Abilities.NONE, Abilities.KLUTZ, 312, 37, 55, 70, 30, 55, 65, 190, 50, 62, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.DACHSBUN, 9, false, false, false, "Dog Pokémon", Type.FAIRY, null, 0.5, 14.9, Abilities.WELL_BAKED_BODY, Abilities.NONE, Abilities.AROMA_VEIL, 477, 57, 80, 115, 50, 80, 95, 90, 50, 167, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.SMOLIV, 9, false, false, false, "Olive Pokémon", Type.GRASS, Type.NORMAL, 0.3, 6.5, Abilities.EARLY_BIRD, Abilities.NONE, Abilities.HARVEST, 260, 41, 35, 45, 58, 51, 30, 255, 50, 52, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.DOLLIV, 9, false, false, false, "Olive Pokémon", Type.GRASS, Type.NORMAL, 0.6, 11.9, Abilities.EARLY_BIRD, Abilities.NONE, Abilities.HARVEST, 354, 52, 53, 60, 78, 78, 33, 120, 50, 124, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.ARBOLIVA, 9, false, false, false, "Olive Pokémon", Type.GRASS, Type.NORMAL, 1.4, 48.2, Abilities.SEED_SOWER, Abilities.NONE, Abilities.HARVEST, 510, 78, 69, 90, 125, 109, 39, 45, 50, 255, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.SQUAWKABILLY, 9, false, false, false, "Parrot Pokémon", Type.NORMAL, Type.FLYING, 0.6, 2.4, Abilities.INTIMIDATE, Abilities.HUSTLE, Abilities.GUTS, 417, 82, 96, 51, 45, 51, 92, 190, 50, 146, GrowthRate.ERRATIC, 50, false, false,
      new PokemonForm("Green Plumage", "green-plumage", Type.NORMAL, Type.FLYING, 0.6, 2.4, Abilities.INTIMIDATE, Abilities.HUSTLE, Abilities.GUTS, 417, 82, 96, 51, 45, 51, 92, 190, 50, 146, false, null, true),
      new PokemonForm("Blue Plumage", "blue-plumage", Type.NORMAL, Type.FLYING, 0.6, 2.4, Abilities.INTIMIDATE, Abilities.HUSTLE, Abilities.GUTS, 417, 82, 96, 51, 45, 51, 92, 190, 50, 146, false, null, true),
      new PokemonForm("Yellow Plumage", "yellow-plumage", Type.NORMAL, Type.FLYING, 0.6, 2.4, Abilities.INTIMIDATE, Abilities.HUSTLE, Abilities.SHEER_FORCE, 417, 82, 96, 51, 45, 51, 92, 190, 50, 146, false, null, true),
      new PokemonForm("White Plumage", "white-plumage", Type.NORMAL, Type.FLYING, 0.6, 2.4, Abilities.INTIMIDATE, Abilities.HUSTLE, Abilities.SHEER_FORCE, 417, 82, 96, 51, 45, 51, 92, 190, 50, 146, false, null, true),
    ),
    new PokemonSpecies(Species.NACLI, 9, false, false, false, "Rock Salt Pokémon", Type.ROCK, null, 0.4, 16, Abilities.PURIFYING_SALT, Abilities.STURDY, Abilities.CLEAR_BODY, 280, 55, 55, 75, 35, 35, 25, 255, 50, 56, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.NACLSTACK, 9, false, false, false, "Rock Salt Pokémon", Type.ROCK, null, 0.6, 105, Abilities.PURIFYING_SALT, Abilities.STURDY, Abilities.CLEAR_BODY, 355, 60, 60, 100, 35, 65, 35, 120, 50, 124, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.GARGANACL, 9, false, false, false, "Rock Salt Pokémon", Type.ROCK, null, 2.3, 240, Abilities.PURIFYING_SALT, Abilities.STURDY, Abilities.CLEAR_BODY, 500, 100, 100, 130, 45, 90, 35, 45, 50, 250, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.CHARCADET, 9, false, false, false, "Fire Child Pokémon", Type.FIRE, null, 0.6, 10.5, Abilities.FLASH_FIRE, Abilities.NONE, Abilities.FLAME_BODY, 255, 40, 50, 40, 50, 40, 35, 90, 50, 51, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.ARMAROUGE, 9, false, false, false, "Fire Warrior Pokémon", Type.FIRE, Type.PSYCHIC, 1.5, 85, Abilities.FLASH_FIRE, Abilities.NONE, Abilities.WEAK_ARMOR, 525, 85, 60, 100, 125, 80, 75, 25, 20, 263, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.CERULEDGE, 9, false, false, false, "Fire Blades Pokémon", Type.FIRE, Type.GHOST, 1.6, 62, Abilities.FLASH_FIRE, Abilities.NONE, Abilities.WEAK_ARMOR, 525, 75, 125, 80, 60, 100, 85, 25, 20, 263, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.TADBULB, 9, false, false, false, "EleTadpole Pokémon", Type.ELECTRIC, null, 0.3, 0.4, Abilities.OWN_TEMPO, Abilities.STATIC, Abilities.DAMP, 272, 61, 31, 41, 59, 35, 45, 190, 50, 54, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.BELLIBOLT, 9, false, false, false, "EleFrog Pokémon", Type.ELECTRIC, null, 1.2, 113, Abilities.ELECTROMORPHOSIS, Abilities.STATIC, Abilities.DAMP, 495, 109, 64, 91, 103, 83, 45, 50, 50, 173, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.WATTREL, 9, false, false, false, "Storm Petrel Pokémon", Type.ELECTRIC, Type.FLYING, 0.4, 3.6, Abilities.WIND_POWER, Abilities.VOLT_ABSORB, Abilities.COMPETITIVE, 280, 40, 40, 35, 55, 40, 70, 180, 50, 56, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.KILOWATTREL, 9, false, false, false, "Frigatebird Pokémon", Type.ELECTRIC, Type.FLYING, 1.4, 38.6, Abilities.WIND_POWER, Abilities.VOLT_ABSORB, Abilities.COMPETITIVE, 490, 70, 70, 60, 105, 60, 125, 90, 50, 172, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.MASCHIFF, 9, false, false, false, "Rascal Pokémon", Type.DARK, null, 0.5, 16, Abilities.INTIMIDATE, Abilities.RUN_AWAY, Abilities.STAKEOUT, 340, 60, 78, 60, 40, 51, 51, 150, 50, 68, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.MABOSSTIFF, 9, false, false, false, "Boss Pokémon", Type.DARK, null, 1.1, 61, Abilities.INTIMIDATE, Abilities.GUARD_DOG, Abilities.STAKEOUT, 505, 80, 120, 90, 60, 70, 85, 75, 50, 177, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.SHROODLE, 9, false, false, false, "Toxic Mouse Pokémon", Type.POISON, Type.NORMAL, 0.2, 0.7, Abilities.UNBURDEN, Abilities.PICKPOCKET, Abilities.PRANKSTER, 290, 40, 65, 35, 40, 35, 75, 190, 50, 58, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.GRAFAIAI, 9, false, false, false, "Toxic Monkey Pokémon", Type.POISON, Type.NORMAL, 0.7, 27.2, Abilities.UNBURDEN, Abilities.POISON_TOUCH, Abilities.PRANKSTER, 485, 63, 95, 65, 80, 72, 110, 90, 50, 170, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.BRAMBLIN, 9, false, false, false, "Tumbleweed Pokémon", Type.GRASS, Type.GHOST, 0.6, 0.6, Abilities.WIND_RIDER, Abilities.NONE, Abilities.INFILTRATOR, 275, 40, 65, 30, 45, 35, 60, 190, 50, 55, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.BRAMBLEGHAST, 9, false, false, false, "Tumbleweed Pokémon", Type.GRASS, Type.GHOST, 1.2, 6, Abilities.WIND_RIDER, Abilities.NONE, Abilities.INFILTRATOR, 480, 55, 115, 70, 80, 70, 90, 45, 50, 168, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.TOEDSCOOL, 9, false, false, false, "Woodear Pokémon", Type.GROUND, Type.GRASS, 0.9, 33, Abilities.MYCELIUM_MIGHT, Abilities.NONE, Abilities.NONE, 335, 40, 40, 35, 50, 100, 70, 190, 50, 67, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.TOEDSCRUEL, 9, false, false, false, "Woodear Pokémon", Type.GROUND, Type.GRASS, 1.9, 58, Abilities.MYCELIUM_MIGHT, Abilities.NONE, Abilities.NONE, 515, 80, 70, 65, 80, 120, 100, 90, 50, 180, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.KLAWF, 9, false, false, false, "Ambush Pokémon", Type.ROCK, null, 1.3, 79, Abilities.ANGER_SHELL, Abilities.SHELL_ARMOR, Abilities.REGENERATOR, 450, 70, 100, 115, 35, 55, 75, 120, 50, 158, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.CAPSAKID, 9, false, false, false, "Spicy Pepper Pokémon", Type.GRASS, null, 0.3, 3, Abilities.CHLOROPHYLL, Abilities.INSOMNIA, Abilities.KLUTZ, 304, 50, 62, 40, 62, 40, 50, 190, 50, 61, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.SCOVILLAIN, 9, false, false, false, "Spicy Pepper Pokémon", Type.GRASS, Type.FIRE, 0.9, 15, Abilities.CHLOROPHYLL, Abilities.INSOMNIA, Abilities.MOODY, 486, 65, 108, 65, 108, 65, 75, 75, 50, 170, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.RELLOR, 9, false, false, false, "Rolling Pokémon", Type.BUG, null, 0.2, 1, Abilities.COMPOUND_EYES, Abilities.NONE, Abilities.SHED_SKIN, 270, 41, 50, 60, 31, 58, 30, 190, 50, 54, GrowthRate.FAST, 50, false),
    new PokemonSpecies(Species.RABSCA, 9, false, false, false, "Rolling Pokémon", Type.BUG, Type.PSYCHIC, 0.3, 3.5, Abilities.SYNCHRONIZE, Abilities.NONE, Abilities.TELEPATHY, 470, 75, 50, 85, 115, 100, 45, 45, 50, 165, GrowthRate.FAST, 50, false),
    new PokemonSpecies(Species.FLITTLE, 9, false, false, false, "Frill Pokémon", Type.PSYCHIC, null, 0.2, 1.5, Abilities.ANTICIPATION, Abilities.FRISK, Abilities.SPEED_BOOST, 255, 30, 35, 30, 55, 30, 75, 120, 50, 51, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.ESPATHRA, 9, false, false, false, "Ostrich Pokémon", Type.PSYCHIC, null, 1.9, 90, Abilities.OPPORTUNIST, Abilities.FRISK, Abilities.SPEED_BOOST, 481, 95, 60, 60, 101, 60, 105, 60, 50, 168, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.TINKATINK, 9, false, false, false, "Metalsmith Pokémon", Type.FAIRY, Type.STEEL, 0.4, 8.9, Abilities.MOLD_BREAKER, Abilities.OWN_TEMPO, Abilities.PICKPOCKET, 297, 50, 45, 45, 35, 64, 58, 190, 50, 59, GrowthRate.MEDIUM_SLOW, 0, false),
    new PokemonSpecies(Species.TINKATUFF, 9, false, false, false, "Hammer Pokémon", Type.FAIRY, Type.STEEL, 0.7, 59.1, Abilities.MOLD_BREAKER, Abilities.OWN_TEMPO, Abilities.PICKPOCKET, 380, 65, 55, 55, 45, 82, 78, 90, 50, 133, GrowthRate.MEDIUM_SLOW, 0, false),
    new PokemonSpecies(Species.TINKATON, 9, false, false, false, "Hammer Pokémon", Type.FAIRY, Type.STEEL, 0.7, 112.8, Abilities.MOLD_BREAKER, Abilities.OWN_TEMPO, Abilities.PICKPOCKET, 506, 85, 75, 77, 70, 105, 94, 45, 50, 253, GrowthRate.MEDIUM_SLOW, 0, false),
    new PokemonSpecies(Species.WIGLETT, 9, false, false, false, "Garden Eel Pokémon", Type.WATER, null, 1.2, 1.8, Abilities.GOOEY, Abilities.RATTLED, Abilities.SAND_VEIL, 245, 10, 55, 25, 35, 25, 95, 255, 50, 49, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.WUGTRIO, 9, false, false, false, "Garden Eel Pokémon", Type.WATER, null, 1.2, 5.4, Abilities.GOOEY, Abilities.RATTLED, Abilities.SAND_VEIL, 425, 35, 100, 50, 50, 70, 120, 50, 50, 149, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.BOMBIRDIER, 9, false, false, false, "Item Drop Pokémon", Type.FLYING, Type.DARK, 1.5, 42.9, Abilities.BIG_PECKS, Abilities.KEEN_EYE, Abilities.ROCKY_PAYLOAD, 485, 70, 103, 85, 60, 85, 82, 25, 50, 243, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.FINIZEN, 9, false, false, false, "Dolphin Pokémon", Type.WATER, null, 1.3, 60.2, Abilities.WATER_VEIL, Abilities.NONE, Abilities.NONE, 315, 70, 45, 40, 45, 40, 75, 200, 50, 63, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.PALAFIN, 9, false, false, false, "Dolphin Pokémon", Type.WATER, null, 1.3, 60.2, Abilities.ZERO_TO_HERO, Abilities.NONE, Abilities.NONE, 457, 100, 70, 72, 53, 62, 100, 45, 50, 160, GrowthRate.SLOW, 50, false, false,
      new PokemonForm("Zero Form", "zero", Type.WATER, null, 1.3, 60.2, Abilities.ZERO_TO_HERO, Abilities.NONE, Abilities.ZERO_TO_HERO, 457, 100, 70, 72, 53, 62, 100, 45, 50, 160, false, null, true),
      new PokemonForm("Hero Form", "hero", Type.WATER, null, 1.8, 97.4, Abilities.ZERO_TO_HERO, Abilities.NONE, Abilities.ZERO_TO_HERO, 650, 100, 160, 97, 106, 87, 100, 45, 50, 160, false, null, true),
    ),
    new PokemonSpecies(Species.VAROOM, 9, false, false, false, "Single-Cyl Pokémon", Type.STEEL, Type.POISON, 1, 35, Abilities.OVERCOAT, Abilities.NONE, Abilities.SLOW_START, 300, 45, 70, 63, 30, 45, 47, 190, 50, 60, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.REVAVROOM, 9, false, false, false, "Multi-Cyl Pokémon", Type.STEEL, Type.POISON, 1.8, 120, Abilities.OVERCOAT, Abilities.NONE, Abilities.FILTER, 500, 80, 119, 90, 54, 67, 90, 75, 50, 175, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.CYCLIZAR, 9, false, false, false, "Mount Pokémon", Type.DRAGON, Type.NORMAL, 1.6, 63, Abilities.SHED_SKIN, Abilities.NONE, Abilities.REGENERATOR, 501, 70, 95, 65, 85, 65, 121, 190, 50, 175, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.ORTHWORM, 9, false, false, false, "Earthworm Pokémon", Type.STEEL, null, 2.5, 310, Abilities.EARTH_EATER, Abilities.NONE, Abilities.SAND_VEIL, 480, 70, 85, 145, 60, 55, 65, 25, 50, 240, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.GLIMMET, 9, false, false, false, "Ore Pokémon", Type.ROCK, Type.POISON, 0.7, 8, Abilities.TOXIC_DEBRIS, Abilities.NONE, Abilities.CORROSION, 350, 48, 35, 42, 105, 60, 60, 70, 50, 70, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.GLIMMORA, 9, false, false, false, "Ore Pokémon", Type.ROCK, Type.POISON, 1.5, 45, Abilities.TOXIC_DEBRIS, Abilities.NONE, Abilities.CORROSION, 525, 83, 55, 90, 130, 81, 86, 25, 50, 184, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.GREAVARD, 9, false, false, false, "Ghost Dog Pokémon", Type.GHOST, null, 0.6, 35, Abilities.PICKUP, Abilities.NONE, Abilities.FLUFFY, 290, 50, 61, 60, 30, 55, 34, 120, 50, 58, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.HOUNDSTONE, 9, false, false, false, "Ghost Dog Pokémon", Type.GHOST, null, 2, 15, Abilities.SAND_RUSH, Abilities.NONE, Abilities.FLUFFY, 488, 72, 101, 100, 50, 97, 68, 60, 50, 171, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.FLAMIGO, 9, false, false, false, "Synchronize Pokémon", Type.FLYING, Type.FIGHTING, 1.6, 37, Abilities.SCRAPPY, Abilities.TANGLED_FEET, Abilities.COSTAR, 500, 82, 115, 74, 75, 64, 90, 100, 50, 175, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.CETODDLE, 9, false, false, false, "Terra Whale Pokémon", Type.ICE, null, 1.2, 45, Abilities.THICK_FAT, Abilities.SNOW_CLOAK, Abilities.SHEER_FORCE, 334, 108, 68, 45, 30, 40, 43, 150, 50, 67, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.CETITAN, 9, false, false, false, "Terra Whale Pokémon", Type.ICE, null, 4.5, 700, Abilities.THICK_FAT, Abilities.SLUSH_RUSH, Abilities.SHEER_FORCE, 521, 170, 113, 65, 45, 55, 73, 50, 50, 182, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.VELUZA, 9, false, false, false, "Jettison Pokémon", Type.WATER, Type.PSYCHIC, 2.5, 90, Abilities.MOLD_BREAKER, Abilities.NONE, Abilities.SHARPNESS, 478, 90, 102, 73, 78, 65, 70, 100, 50, 167, GrowthRate.FAST, 50, false),
    new PokemonSpecies(Species.DONDOZO, 9, false, false, false, "Big Catfish Pokémon", Type.WATER, null, 12, 220, Abilities.UNAWARE, Abilities.OBLIVIOUS, Abilities.WATER_VEIL, 530, 150, 100, 115, 65, 65, 35, 25, 50, 265, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.TATSUGIRI, 9, false, false, false, "Mimicry Pokémon", Type.DRAGON, Type.WATER, 0.3, 8, Abilities.COMMANDER, Abilities.NONE, Abilities.STORM_DRAIN, 475, 68, 50, 60, 120, 95, 82, 100, 50, 166, GrowthRate.MEDIUM_SLOW, 50, false, false,
      new PokemonForm("Curly Form", "curly", Type.DRAGON, Type.WATER, 0.3, 8, Abilities.COMMANDER, Abilities.NONE, Abilities.STORM_DRAIN, 475, 68, 50, 60, 120, 95, 82, 100, 50, 166, false, null, true),
      new PokemonForm("Droopy Form", "droopy", Type.DRAGON, Type.WATER, 0.3, 8, Abilities.COMMANDER, Abilities.NONE, Abilities.STORM_DRAIN, 475, 68, 50, 60, 120, 95, 82, 100, 50, 166, false, null, true),
      new PokemonForm("Stretchy Form", "stretchy", Type.DRAGON, Type.WATER, 0.3, 8, Abilities.COMMANDER, Abilities.NONE, Abilities.STORM_DRAIN, 475, 68, 50, 60, 120, 95, 82, 100, 50, 166, false, null, true),
    ),
    new PokemonSpecies(Species.ANNIHILAPE, 9, false, false, false, "Rage Monkey Pokémon", Type.FIGHTING, Type.GHOST, 1.2, 56, Abilities.VITAL_SPIRIT, Abilities.INNER_FOCUS, Abilities.DEFIANT, 535, 110, 115, 80, 50, 90, 90, 45, 50, 268, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.CLODSIRE, 9, false, false, false, "Spiny Fish Pokémon", Type.POISON, Type.GROUND, 1.8, 223, Abilities.POISON_POINT, Abilities.WATER_ABSORB, Abilities.UNAWARE, 430, 130, 75, 60, 45, 100, 20, 90, 50, 151, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.FARIGIRAF, 9, false, false, false, "Long Neck Pokémon", Type.NORMAL, Type.PSYCHIC, 3.2, 160, Abilities.CUD_CHEW, Abilities.ARMOR_TAIL, Abilities.SAP_SIPPER, 520, 120, 90, 70, 110, 70, 60, 45, 50, 260, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.DUDUNSPARCE, 9, false, false, false, "Land Snake Pokémon", Type.NORMAL, null, 3.6, 39.2, Abilities.SERENE_GRACE, Abilities.RUN_AWAY, Abilities.RATTLED, 520, 125, 100, 80, 85, 75, 55, 45, 50, 182, GrowthRate.MEDIUM_FAST, 50, false, false,
      new PokemonForm("Two-Segment Form", "two-segment", Type.NORMAL, null, 3.6, 39.2, Abilities.SERENE_GRACE, Abilities.RUN_AWAY, Abilities.RATTLED, 520, 125, 100, 80, 85, 75, 55, 45, 50, 182, false, ""),
      new PokemonForm("Three-Segment Form", "three-segment", Type.NORMAL, null, 4.5, 47.4, Abilities.SERENE_GRACE, Abilities.RUN_AWAY, Abilities.RATTLED, 520, 125, 100, 80, 85, 75, 55, 45, 50, 182),
    ),
    new PokemonSpecies(Species.KINGAMBIT, 9, false, false, false, "Big Blade Pokémon", Type.DARK, Type.STEEL, 2, 120, Abilities.DEFIANT, Abilities.SUPREME_OVERLORD, Abilities.PRESSURE, 550, 100, 135, 120, 60, 85, 50, 25, 50, 275, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.GREAT_TUSK, 9, false, false, false, "Paradox Pokémon", Type.GROUND, Type.FIGHTING, 2.2, 320, Abilities.PROTOSYNTHESIS, Abilities.NONE, Abilities.NONE, 570, 115, 131, 131, 53, 53, 87, 30, 0, 285, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.SCREAM_TAIL, 9, false, false, false, "Paradox Pokémon", Type.FAIRY, Type.PSYCHIC, 1.2, 8, Abilities.PROTOSYNTHESIS, Abilities.NONE, Abilities.NONE, 570, 115, 65, 99, 65, 115, 111, 50, 0, 285, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.BRUTE_BONNET, 9, false, false, false, "Paradox Pokémon", Type.GRASS, Type.DARK, 1.2, 21, Abilities.PROTOSYNTHESIS, Abilities.NONE, Abilities.NONE, 570, 111, 127, 99, 79, 99, 55, 50, 0, 285, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.FLUTTER_MANE, 9, false, false, false, "Paradox Pokémon", Type.GHOST, Type.FAIRY, 1.4, 4, Abilities.PROTOSYNTHESIS, Abilities.NONE, Abilities.NONE, 570, 55, 55, 55, 135, 135, 135, 30, 0, 285, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.SLITHER_WING, 9, false, false, false, "Paradox Pokémon", Type.BUG, Type.FIGHTING, 3.2, 92, Abilities.PROTOSYNTHESIS, Abilities.NONE, Abilities.NONE, 570, 85, 135, 79, 85, 105, 81, 30, 0, 285, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.SANDY_SHOCKS, 9, false, false, false, "Paradox Pokémon", Type.ELECTRIC, Type.GROUND, 2.3, 60, Abilities.PROTOSYNTHESIS, Abilities.NONE, Abilities.NONE, 570, 85, 81, 97, 121, 85, 101, 30, 0, 285, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.IRON_TREADS, 9, false, false, false, "Paradox Pokémon", Type.GROUND, Type.STEEL, 0.9, 240, Abilities.QUARK_DRIVE, Abilities.NONE, Abilities.NONE, 570, 90, 112, 120, 72, 70, 106, 30, 0, 285, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.IRON_BUNDLE, 9, false, false, false, "Paradox Pokémon", Type.ICE, Type.WATER, 0.6, 11, Abilities.QUARK_DRIVE, Abilities.NONE, Abilities.NONE, 570, 56, 80, 114, 124, 60, 136, 50, 0, 285, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.IRON_HANDS, 9, false, false, false, "Paradox Pokémon", Type.FIGHTING, Type.ELECTRIC, 1.8, 380.7, Abilities.QUARK_DRIVE, Abilities.NONE, Abilities.NONE, 570, 154, 140, 108, 50, 68, 50, 50, 0, 285, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.IRON_JUGULIS, 9, false, false, false, "Paradox Pokémon", Type.DARK, Type.FLYING, 1.3, 111, Abilities.QUARK_DRIVE, Abilities.NONE, Abilities.NONE, 570, 94, 80, 86, 122, 80, 108, 30, 0, 285, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.IRON_MOTH, 9, false, false, false, "Paradox Pokémon", Type.FIRE, Type.POISON, 1.2, 36, Abilities.QUARK_DRIVE, Abilities.NONE, Abilities.NONE, 570, 80, 70, 60, 140, 110, 110, 30, 0, 285, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.IRON_THORNS, 9, false, false, false, "Paradox Pokémon", Type.ROCK, Type.ELECTRIC, 1.6, 303, Abilities.QUARK_DRIVE, Abilities.NONE, Abilities.NONE, 570, 100, 134, 110, 70, 84, 72, 30, 0, 285, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.FRIGIBAX, 9, false, false, false, "Ice Fin Pokémon", Type.DRAGON, Type.ICE, 0.5, 17, Abilities.THERMAL_EXCHANGE, Abilities.NONE, Abilities.ICE_BODY, 320, 65, 75, 45, 35, 45, 55, 45, 50, 64, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.ARCTIBAX, 9, false, false, false, "Ice Fin Pokémon", Type.DRAGON, Type.ICE, 0.8, 30, Abilities.THERMAL_EXCHANGE, Abilities.NONE, Abilities.ICE_BODY, 423, 90, 95, 66, 45, 65, 62, 25, 50, 148, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.BAXCALIBUR, 9, false, false, false, "Ice Dragon Pokémon", Type.DRAGON, Type.ICE, 2.1, 210, Abilities.THERMAL_EXCHANGE, Abilities.NONE, Abilities.ICE_BODY, 600, 115, 145, 92, 75, 86, 87, 10, 50, 300, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.GIMMIGHOUL, 9, false, false, false, "Coin Chest Pokémon", Type.GHOST, null, 0.3, 5, Abilities.RATTLED, Abilities.NONE, Abilities.NONE, 300, 45, 30, 70, 75, 70, 10, 45, 50, 60, GrowthRate.SLOW, null, false, false,
      new PokemonForm("Chest Form", "chest", Type.GHOST, null, 0.3, 5, Abilities.RATTLED, Abilities.NONE, Abilities.NONE, 300, 45, 30, 70, 75, 70, 10, 45, 50, 60, false, "", true),
      new PokemonForm("Roaming Form", "roaming", Type.GHOST, null, 0.1, 1, Abilities.RUN_AWAY, Abilities.NONE, Abilities.NONE, 300, 45, 30, 25, 75, 45, 80, 45, 50, 60, false, null, true),
    ),
    new PokemonSpecies(Species.GHOLDENGO, 9, false, false, false, "Coin Entity Pokémon", Type.STEEL, Type.GHOST, 1.2, 30, Abilities.GOOD_AS_GOLD, Abilities.NONE, Abilities.NONE, 550, 87, 60, 95, 133, 91, 84, 45, 50, 275, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.WO_CHIEN, 9, true, false, false, "Ruinous Pokémon", Type.DARK, Type.GRASS, 1.5, 74.2, Abilities.TABLETS_OF_RUIN, Abilities.NONE, Abilities.NONE, 570, 85, 85, 100, 95, 135, 70, 6, 0, 285, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.CHIEN_PAO, 9, true, false, false, "Ruinous Pokémon", Type.DARK, Type.ICE, 1.9, 152.2, Abilities.SWORD_OF_RUIN, Abilities.NONE, Abilities.NONE, 570, 80, 120, 80, 90, 65, 135, 6, 0, 285, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.TING_LU, 9, true, false, false, "Ruinous Pokémon", Type.DARK, Type.GROUND, 2.7, 699.7, Abilities.VESSEL_OF_RUIN, Abilities.NONE, Abilities.NONE, 570, 155, 110, 125, 55, 80, 45, 6, 0, 285, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.CHI_YU, 9, true, false, false, "Ruinous Pokémon", Type.DARK, Type.FIRE, 0.4, 4.9, Abilities.BEADS_OF_RUIN, Abilities.NONE, Abilities.NONE, 570, 55, 80, 80, 135, 120, 100, 6, 0, 285, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.ROARING_MOON, 9, false, false, false, "Paradox Pokémon", Type.DRAGON, Type.DARK, 2, 380, Abilities.PROTOSYNTHESIS, Abilities.NONE, Abilities.NONE, 590, 105, 139, 71, 55, 101, 119, 10, 0, 295, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.IRON_VALIANT, 9, false, false, false, "Paradox Pokémon", Type.FAIRY, Type.FIGHTING, 1.4, 35, Abilities.QUARK_DRIVE, Abilities.NONE, Abilities.NONE, 590, 74, 130, 90, 120, 60, 116, 10, 0, 295, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.KORAIDON, 9, false, true, false, "Paradox Pokémon", Type.FIGHTING, Type.DRAGON, 2.5, 303, Abilities.ORICHALCUM_PULSE, Abilities.NONE, Abilities.NONE, 670, 100, 135, 115, 85, 100, 135, 3, 0, 335, GrowthRate.SLOW, null, false, false,
      new PokemonForm("Apex Build", "apex-build", Type.FIGHTING, Type.DRAGON, 2.5, 303, Abilities.ORICHALCUM_PULSE, Abilities.NONE, Abilities.NONE, 670, 100, 135, 115, 85, 100, 135, 3, 0, 335, false, null, true),
      new PokemonForm("Limited Build", "limited-build", Type.FIGHTING, Type.DRAGON, 3.5, 303, Abilities.ORICHALCUM_PULSE, Abilities.NONE, Abilities.NONE, 670, 100, 135, 115, 85, 100, 135, 3, 0, 335, false, null, true),
      new PokemonForm("Sprinting Build", "sprinting-build", Type.FIGHTING, Type.DRAGON, 3.5, 303, Abilities.ORICHALCUM_PULSE, Abilities.NONE, Abilities.NONE, 670, 100, 135, 115, 85, 100, 135, 3, 0, 335, false, null, true),
      new PokemonForm("Swimming Build", "swimming-build", Type.FIGHTING, Type.DRAGON, 3.5, 303, Abilities.ORICHALCUM_PULSE, Abilities.NONE, Abilities.NONE, 670, 100, 135, 115, 85, 100, 135, 3, 0, 335, false, null, true),
      new PokemonForm("Gliding Build", "gliding-build", Type.FIGHTING, Type.DRAGON, 3.5, 303, Abilities.ORICHALCUM_PULSE, Abilities.NONE, Abilities.NONE, 670, 100, 135, 115, 85, 100, 135, 3, 0, 335, false, null, true),
    ),
    new PokemonSpecies(Species.MIRAIDON, 9, false, true, false, "Paradox Pokémon", Type.ELECTRIC, Type.DRAGON, 3.5, 240, Abilities.HADRON_ENGINE, Abilities.NONE, Abilities.NONE, 670, 100, 85, 100, 135, 115, 135, 3, 0, 335, GrowthRate.SLOW, null, false, false,
      new PokemonForm("Ultimate Mode", "ultimate-mode", Type.ELECTRIC, Type.DRAGON, 3.5, 240, Abilities.HADRON_ENGINE, Abilities.NONE, Abilities.NONE, 670, 100, 85, 100, 135, 115, 135, 3, 0, 335, false, null, true),
      new PokemonForm("Low-Power Mode", "low-power-mode", Type.ELECTRIC, Type.DRAGON, 2.8, 240, Abilities.HADRON_ENGINE, Abilities.NONE, Abilities.NONE, 670, 100, 85, 100, 135, 115, 135, 3, 0, 335, false, null, true),
      new PokemonForm("Drive Mode", "drive-mode", Type.ELECTRIC, Type.DRAGON, 2.8, 240, Abilities.HADRON_ENGINE, Abilities.NONE, Abilities.NONE, 670, 100, 85, 100, 135, 115, 135, 3, 0, 335, false, null, true),
      new PokemonForm("Aquatic Mode", "aquatic-mode", Type.ELECTRIC, Type.DRAGON, 2.8, 240, Abilities.HADRON_ENGINE, Abilities.NONE, Abilities.NONE, 670, 100, 85, 100, 135, 115, 135, 3, 0, 335, false, null, true),
      new PokemonForm("Glide Mode", "glide-mode", Type.ELECTRIC, Type.DRAGON, 2.8, 240, Abilities.HADRON_ENGINE, Abilities.NONE, Abilities.NONE, 670, 100, 85, 100, 135, 115, 135, 3, 0, 335, false, null, true),
    ),
    new PokemonSpecies(Species.WALKING_WAKE, 9, false, false, false, "Paradox Pokémon", Type.WATER, Type.DRAGON, 3.5, 280, Abilities.PROTOSYNTHESIS, Abilities.NONE, Abilities.NONE, 590, 99, 83, 91, 125, 83, 109, 5, 0, 295, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.IRON_LEAVES, 9, false, false, false, "Paradox Pokémon", Type.GRASS, Type.PSYCHIC, 1.5, 125, Abilities.QUARK_DRIVE, Abilities.NONE, Abilities.NONE, 590, 90, 130, 88, 70, 108, 104, 5, 0, 295, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.DIPPLIN, 9, false, false, false, "Candy Apple Pokémon", Type.GRASS, Type.DRAGON, 0.4, 9.7, Abilities.SUPERSWEET_SYRUP, Abilities.GLUTTONY, Abilities.STICKY_HOLD, 485, 80, 80, 110, 95, 80, 40, 45, 50, 170, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.POLTCHAGEIST, 9, false, false, false, "Matcha Pokémon", Type.GRASS, Type.GHOST, 0.1, 1.1, Abilities.HOSPITALITY, Abilities.NONE, Abilities.HEATPROOF, 308, 40, 45, 45, 74, 54, 50, 120, 50, 62, GrowthRate.SLOW, null, false, false,
      new PokemonForm("Counterfeit Form", "counterfeit", Type.GRASS, Type.GHOST, 0.1, 1.1, Abilities.HOSPITALITY, Abilities.NONE, Abilities.HEATPROOF, 308, 40, 45, 45, 74, 54, 50, 120, 50, 62, false, null, true),
      new PokemonForm("Artisan Form", "artisan", Type.GRASS, Type.GHOST, 0.1, 1.1, Abilities.HOSPITALITY, Abilities.NONE, Abilities.HEATPROOF, 308, 40, 45, 45, 74, 54, 50, 120, 50, 62, false, null, true),
    ),
    new PokemonSpecies(Species.SINISTCHA, 9, false, false, false, "Matcha Pokémon", Type.GRASS, Type.GHOST, 0.2, 2.2, Abilities.HOSPITALITY, Abilities.NONE, Abilities.HEATPROOF, 508, 71, 60, 106, 121, 80, 70, 60, 50, 178, GrowthRate.SLOW, null, false, false,
      new PokemonForm("Unremarkable Form", "unremarkable", Type.GRASS, Type.GHOST, 0.2, 2.2, Abilities.HOSPITALITY, Abilities.NONE, Abilities.HEATPROOF, 508, 71, 60, 106, 121, 80, 70, 60, 50, 178),
      new PokemonForm("Masterpiece Form", "masterpiece", Type.GRASS, Type.GHOST, 0.2, 2.2, Abilities.HOSPITALITY, Abilities.NONE, Abilities.HEATPROOF, 508, 71, 60, 106, 121, 80, 70, 60, 50, 178),
    ),
    new PokemonSpecies(Species.OKIDOGI, 9, true, false, false, "Retainer Pokémon", Type.POISON, Type.FIGHTING, 1.8, 92.2, Abilities.TOXIC_CHAIN, Abilities.NONE, Abilities.GUARD_DOG, 555, 88, 128, 115, 58, 86, 80, 3, 0, 276, GrowthRate.SLOW, 100, false),
    new PokemonSpecies(Species.MUNKIDORI, 9, true, false, false, "Retainer Pokémon", Type.POISON, Type.PSYCHIC, 1, 12.2, Abilities.TOXIC_CHAIN, Abilities.NONE, Abilities.FRISK, 555, 88, 75, 66, 130, 90, 106, 3, 0, 276, GrowthRate.SLOW, 100, false),
    new PokemonSpecies(Species.FEZANDIPITI, 9, true, false, false, "Retainer Pokémon", Type.POISON, Type.FAIRY, 1.4, 30.1, Abilities.TOXIC_CHAIN, Abilities.NONE, Abilities.TECHNICIAN, 555, 88, 91, 82, 70, 125, 99, 3, 0, 276, GrowthRate.SLOW, 100, false),
    new PokemonSpecies(Species.OGERPON, 9, true, false, false, "Mask Pokémon", Type.GRASS, null, 1.2, 39.8, Abilities.DEFIANT, Abilities.NONE, Abilities.NONE, 550, 80, 120, 84, 60, 96, 110, 5, 50, 275, GrowthRate.SLOW, 0, false, false,
      new PokemonForm("Teal Mask", "teal-mask", Type.GRASS, null, 1.2, 39.8, Abilities.DEFIANT, Abilities.NONE, Abilities.NONE, 550, 80, 120, 84, 60, 96, 110, 5, 50, 275, false, null, true),
      new PokemonForm("Wellspring Mask", "wellspring-mask", Type.GRASS, Type.WATER, 1.2, 39.8, Abilities.WATER_ABSORB, Abilities.NONE, Abilities.NONE, 550, 80, 120, 84, 60, 96, 110, 5, 50, 275),
      new PokemonForm("Hearthflame Mask", "hearthflame-mask", Type.GRASS, Type.FIRE, 1.2, 39.8, Abilities.MOLD_BREAKER, Abilities.NONE, Abilities.NONE, 550, 80, 120, 84, 60, 96, 110, 5, 50, 275),
      new PokemonForm("Cornerstone Mask", "cornerstone-mask", Type.GRASS, Type.ROCK, 1.2, 39.8, Abilities.STURDY, Abilities.NONE, Abilities.NONE, 550, 80, 120, 84, 60, 96, 110, 5, 50, 275),
      new PokemonForm("Teal Mask Terastallized", "teal-mask-tera", Type.GRASS, null, 1.2, 39.8, Abilities.EMBODY_ASPECT_TEAL, Abilities.NONE, Abilities.NONE, 550, 80, 120, 84, 60, 96, 110, 5, 50, 275),
      new PokemonForm("Wellspring Mask Terastallized", "wellspring-mask-tera", Type.GRASS, Type.WATER, 1.2, 39.8, Abilities.EMBODY_ASPECT_WELLSPRING, Abilities.NONE, Abilities.NONE, 550, 80, 120, 84, 60, 96, 110, 5, 50, 275),
      new PokemonForm("Hearthflame Mask Terastallized", "hearthflame-mask-tera", Type.GRASS, Type.FIRE, 1.2, 39.8, Abilities.EMBODY_ASPECT_HEARTHFLAME, Abilities.NONE, Abilities.NONE, 550, 80, 120, 84, 60, 96, 110, 5, 50, 275),
      new PokemonForm("Cornerstone Mask Terastallized", "cornerstone-mask-tera", Type.GRASS, Type.ROCK, 1.2, 39.8, Abilities.EMBODY_ASPECT_CORNERSTONE, Abilities.NONE, Abilities.NONE, 550, 80, 120, 84, 60, 96, 110, 5, 50, 275),
    ),
    new PokemonSpecies(Species.ARCHALUDON, 9, false, false, false, "Alloy Pokémon", Type.STEEL, Type.DRAGON, 2, 60, Abilities.STAMINA, Abilities.STURDY, Abilities.STALWART, 600, 90, 105, 130, 125, 65, 85, 10, 50, 300, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.HYDRAPPLE, 9, false, false, false, "Apple Hydra Pokémon", Type.GRASS, Type.DRAGON, 1.8, 93, Abilities.SUPERSWEET_SYRUP, Abilities.REGENERATOR, Abilities.STICKY_HOLD, 540, 106, 80, 110, 120, 80, 44, 10, 50, 270, GrowthRate.ERRATIC, 50, false),
    new PokemonSpecies(Species.GOUGING_FIRE, 9, false, false, false, "Paradox Pokémon", Type.FIRE, Type.DRAGON, 3.5, 590, Abilities.PROTOSYNTHESIS, Abilities.NONE, Abilities.NONE, 590, 105, 115, 121, 65, 93, 91, 10, 0, 295, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.RAGING_BOLT, 9, false, false, false, "Paradox Pokémon", Type.ELECTRIC, Type.DRAGON, 5.2, 480, Abilities.PROTOSYNTHESIS, Abilities.NONE, Abilities.NONE, 590, 125, 73, 91, 137, 89, 75, 10, 0, 295, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.IRON_BOULDER, 9, false, false, false, "Paradox Pokémon", Type.ROCK, Type.PSYCHIC, 1.5, 162.5, Abilities.QUARK_DRIVE, Abilities.NONE, Abilities.NONE, 590, 90, 120, 80, 68, 108, 124, 10, 0, 295, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.IRON_CROWN, 9, false, false, false, "Paradox Pokémon", Type.STEEL, Type.PSYCHIC, 1.6, 156, Abilities.QUARK_DRIVE, Abilities.NONE, Abilities.NONE, 590, 90, 72, 100, 122, 108, 98, 10, 0, 295, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.TERAPAGOS, 9, false, true, false, "Tera Pokémon", Type.NORMAL, null, 0.2, 6.5, Abilities.TERA_SHIFT, Abilities.NONE, Abilities.NONE, 450, 90, 65, 85, 65, 85, 60, 5, 50, 90, GrowthRate.SLOW, 50, false, false,
      new PokemonForm("Normal Form", "", Type.NORMAL, null, 0.2, 6.5, Abilities.TERA_SHIFT, Abilities.NONE, Abilities.NONE, 450, 90, 65, 85, 65, 85, 60, 5, 50, 90),
      new PokemonForm("Terastal Form", "terastal", Type.NORMAL, null, 0.3, 16, Abilities.TERA_SHELL, Abilities.NONE, Abilities.NONE, 600, 95, 95, 110, 105, 110, 85, 5, 50, 90),
      new PokemonForm("Stellar Form", "stellar", Type.NORMAL, null, 1.7, 77, Abilities.TERAFORM_ZERO, Abilities.NONE, Abilities.NONE, 700, 160, 105, 110, 130, 110, 85, 5, 50, 90),
    ),
    new PokemonSpecies(Species.PECHARUNT, 9, false, false, true, "Subjugation Pokémon", Type.POISON, Type.GHOST, 0.3, 0.3, Abilities.POISON_PUPPETEER, Abilities.NONE, Abilities.NONE, 600, 88, 88, 160, 88, 88, 88, 3, 0, 300, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.ALOLA_RATTATA, 7, false, false, false, "Mouse Pokémon", Type.DARK, Type.NORMAL, 0.3, 3.8, Abilities.GLUTTONY, Abilities.HUSTLE, Abilities.THICK_FAT, 253, 30, 56, 35, 25, 35, 72, 255, 70, 51, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.ALOLA_RATICATE, 7, false, false, false, "Mouse Pokémon", Type.DARK, Type.NORMAL, 0.7, 25.5, Abilities.GLUTTONY, Abilities.HUSTLE, Abilities.THICK_FAT, 413, 75, 71, 70, 40, 80, 77, 127, 70, 145, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.ALOLA_RAICHU, 7, false, false, false, "Mouse Pokémon", Type.ELECTRIC, Type.PSYCHIC, 0.7, 21, Abilities.SURGE_SURFER, Abilities.NONE, Abilities.NONE, 485, 60, 85, 50, 95, 85, 110, 75, 50, 243, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.ALOLA_SANDSHREW, 7, false, false, false, "Mouse Pokémon", Type.ICE, Type.STEEL, 0.7, 40, Abilities.SNOW_CLOAK, Abilities.NONE, Abilities.SLUSH_RUSH, 300, 50, 75, 90, 10, 35, 40, 255, 50, 60, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.ALOLA_SANDSLASH, 7, false, false, false, "Mouse Pokémon", Type.ICE, Type.STEEL, 1.2, 55, Abilities.SNOW_CLOAK, Abilities.NONE, Abilities.SLUSH_RUSH, 450, 75, 100, 120, 25, 65, 65, 90, 50, 158, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.ALOLA_VULPIX, 7, false, false, false, "Fox Pokémon", Type.ICE, null, 0.6, 9.9, Abilities.SNOW_CLOAK, Abilities.NONE, Abilities.SNOW_WARNING, 299, 38, 41, 40, 50, 65, 65, 190, 50, 60, GrowthRate.MEDIUM_FAST, 25, false),
    new PokemonSpecies(Species.ALOLA_NINETALES, 7, false, false, false, "Fox Pokémon", Type.ICE, Type.FAIRY, 1.1, 19.9, Abilities.SNOW_CLOAK, Abilities.NONE, Abilities.SNOW_WARNING, 505, 73, 67, 75, 81, 100, 109, 75, 50, 177, GrowthRate.MEDIUM_FAST, 25, false),
    new PokemonSpecies(Species.ALOLA_DIGLETT, 7, false, false, false, "Mole Pokémon", Type.GROUND, Type.STEEL, 0.2, 1, Abilities.SAND_VEIL, Abilities.TANGLING_HAIR, Abilities.SAND_FORCE, 265, 10, 55, 30, 35, 45, 90, 255, 50, 53, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.ALOLA_DUGTRIO, 7, false, false, false, "Mole Pokémon", Type.GROUND, Type.STEEL, 0.7, 66.6, Abilities.SAND_VEIL, Abilities.TANGLING_HAIR, Abilities.SAND_FORCE, 425, 35, 100, 60, 50, 70, 110, 50, 50, 149, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.ALOLA_MEOWTH, 7, false, false, false, "Scratch Cat Pokémon", Type.DARK, null, 0.4, 4.2, Abilities.PICKUP, Abilities.TECHNICIAN, Abilities.RATTLED, 290, 40, 35, 35, 50, 40, 90, 255, 50, 58, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.ALOLA_PERSIAN, 7, false, false, false, "Classy Cat Pokémon", Type.DARK, null, 1.1, 33, Abilities.FUR_COAT, Abilities.TECHNICIAN, Abilities.RATTLED, 440, 65, 60, 60, 75, 65, 115, 90, 50, 154, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.ALOLA_GEODUDE, 7, false, false, false, "Rock Pokémon", Type.ROCK, Type.ELECTRIC, 0.4, 20.3, Abilities.MAGNET_PULL, Abilities.STURDY, Abilities.GALVANIZE, 300, 40, 80, 100, 30, 30, 20, 255, 70, 60, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.ALOLA_GRAVELER, 7, false, false, false, "Rock Pokémon", Type.ROCK, Type.ELECTRIC, 1, 110, Abilities.MAGNET_PULL, Abilities.STURDY, Abilities.GALVANIZE, 390, 55, 95, 115, 45, 45, 35, 120, 70, 137, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.ALOLA_GOLEM, 7, false, false, false, "Megaton Pokémon", Type.ROCK, Type.ELECTRIC, 1.7, 316, Abilities.MAGNET_PULL, Abilities.STURDY, Abilities.GALVANIZE, 495, 80, 120, 130, 55, 65, 45, 45, 70, 223, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.ALOLA_GRIMER, 7, false, false, false, "Sludge Pokémon", Type.POISON, Type.DARK, 0.7, 42, Abilities.POISON_TOUCH, Abilities.GLUTTONY, Abilities.POWER_OF_ALCHEMY, 325, 80, 80, 50, 40, 50, 25, 190, 70, 65, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.ALOLA_MUK, 7, false, false, false, "Sludge Pokémon", Type.POISON, Type.DARK, 1, 52, Abilities.POISON_TOUCH, Abilities.GLUTTONY, Abilities.POWER_OF_ALCHEMY, 500, 105, 105, 75, 65, 100, 50, 75, 70, 175, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.ALOLA_EXEGGUTOR, 7, false, false, false, "Coconut Pokémon", Type.GRASS, Type.DRAGON, 10.9, 415.6, Abilities.FRISK, Abilities.NONE, Abilities.HARVEST, 530, 95, 105, 85, 125, 75, 45, 45, 50, 186, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.ALOLA_MAROWAK, 7, false, false, false, "Bone Keeper Pokémon", Type.FIRE, Type.GHOST, 1, 34, Abilities.CURSED_BODY, Abilities.LIGHTNING_ROD, Abilities.ROCK_HEAD, 425, 60, 80, 110, 50, 80, 45, 75, 50, 149, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.ETERNAL_FLOETTE, 6, false, false, false, "Single Bloom Pokémon", Type.FAIRY, null, 0.2, 0.9, Abilities.FLOWER_VEIL, Abilities.NONE, Abilities.SYMBIOSIS, 551, 74, 65, 67, 125, 128, 92, 120, 70, 130, GrowthRate.MEDIUM_FAST, 0, false),
    new PokemonSpecies(Species.GALAR_MEOWTH, 8, false, false, false, "Scratch Cat Pokémon", Type.STEEL, null, 0.4, 7.5, Abilities.PICKUP, Abilities.TOUGH_CLAWS, Abilities.UNNERVE, 290, 50, 65, 55, 40, 40, 40, 255, 50, 58, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.GALAR_PONYTA, 8, false, false, false, "Fire Horse Pokémon", Type.PSYCHIC, null, 0.8, 24, Abilities.RUN_AWAY, Abilities.PASTEL_VEIL, Abilities.ANTICIPATION, 410, 50, 85, 55, 65, 65, 90, 190, 50, 82, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.GALAR_RAPIDASH, 8, false, false, false, "Fire Horse Pokémon", Type.PSYCHIC, Type.FAIRY, 1.7, 80, Abilities.RUN_AWAY, Abilities.PASTEL_VEIL, Abilities.ANTICIPATION, 500, 65, 100, 70, 80, 80, 105, 60, 50, 175, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.GALAR_SLOWPOKE, 8, false, false, false, "Dopey Pokémon", Type.PSYCHIC, null, 1.2, 36, Abilities.GLUTTONY, Abilities.OWN_TEMPO, Abilities.REGENERATOR, 315, 90, 65, 65, 40, 40, 15, 190, 50, 63, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.GALAR_SLOWBRO, 8, false, false, false, "Hermit Crab Pokémon", Type.POISON, Type.PSYCHIC, 1.6, 70.5, Abilities.QUICK_DRAW, Abilities.OWN_TEMPO, Abilities.REGENERATOR, 490, 95, 100, 95, 100, 70, 30, 75, 50, 172, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.GALAR_FARFETCHD, 8, false, false, false, "Wild Duck Pokémon", Type.FIGHTING, null, 0.8, 42, Abilities.STEADFAST, Abilities.NONE, Abilities.SCRAPPY, 377, 52, 95, 55, 58, 62, 55, 45, 50, 132, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.GALAR_WEEZING, 8, false, false, false, "Poison Gas Pokémon", Type.POISON, Type.FAIRY, 3, 16, Abilities.LEVITATE, Abilities.NEUTRALIZING_GAS, Abilities.MISTY_SURGE, 490, 65, 90, 120, 85, 70, 60, 60, 50, 172, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.GALAR_MR_MIME, 8, false, false, false, "Barrier Pokémon", Type.ICE, Type.PSYCHIC, 1.4, 56.8, Abilities.VITAL_SPIRIT, Abilities.SCREEN_CLEANER, Abilities.ICE_BODY, 460, 50, 65, 65, 90, 90, 100, 45, 50, 161, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.GALAR_ARTICUNO, 8, true, false, false, "Freeze Pokémon", Type.PSYCHIC, Type.FLYING, 1.7, 50.9, Abilities.COMPETITIVE, Abilities.NONE, Abilities.NONE, 580, 90, 85, 85, 125, 100, 95, 3, 35, 290, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.GALAR_ZAPDOS, 8, true, false, false, "Electric Pokémon", Type.FIGHTING, Type.FLYING, 1.6, 58.2, Abilities.DEFIANT, Abilities.NONE, Abilities.NONE, 580, 90, 125, 90, 85, 90, 100, 3, 35, 290, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.GALAR_MOLTRES, 8, true, false, false, "Flame Pokémon", Type.DARK, Type.FLYING, 2, 66, Abilities.BERSERK, Abilities.NONE, Abilities.NONE, 580, 90, 85, 90, 100, 125, 90, 3, 35, 290, GrowthRate.SLOW, null, false),
    new PokemonSpecies(Species.GALAR_SLOWKING, 8, false, false, false, "Royal Pokémon", Type.POISON, Type.PSYCHIC, 1.8, 79.5, Abilities.CURIOUS_MEDICINE, Abilities.OWN_TEMPO, Abilities.REGENERATOR, 490, 95, 65, 80, 110, 110, 30, 70, 50, 172, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.GALAR_CORSOLA, 8, false, false, false, "Coral Pokémon", Type.GHOST, null, 0.6, 0.5, Abilities.WEAK_ARMOR, Abilities.NONE, Abilities.CURSED_BODY, 410, 60, 55, 100, 65, 100, 30, 60, 50, 144, GrowthRate.FAST, 25, false),
    new PokemonSpecies(Species.GALAR_ZIGZAGOON, 8, false, false, false, "Tiny Raccoon Pokémon", Type.DARK, Type.NORMAL, 0.4, 17.5, Abilities.PICKUP, Abilities.GLUTTONY, Abilities.QUICK_FEET, 240, 38, 30, 41, 30, 41, 60, 255, 50, 56, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.GALAR_LINOONE, 8, false, false, false, "Rushing Pokémon", Type.DARK, Type.NORMAL, 0.5, 32.5, Abilities.PICKUP, Abilities.GLUTTONY, Abilities.QUICK_FEET, 420, 78, 70, 61, 50, 61, 100, 90, 50, 147, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.GALAR_DARUMAKA, 8, false, false, false, "Zen Charm Pokémon", Type.ICE, null, 0.7, 40, Abilities.HUSTLE, Abilities.NONE, Abilities.INNER_FOCUS, 315, 70, 90, 45, 15, 45, 50, 120, 50, 63, GrowthRate.MEDIUM_SLOW, 50, false),
    new PokemonSpecies(Species.GALAR_DARMANITAN, 8, false, false, false, "Blazing Pokémon", Type.ICE, null, 1.7, 120, Abilities.GORILLA_TACTICS, Abilities.NONE, Abilities.ZEN_MODE, 480, 105, 140, 55, 30, 55, 95, 60, 50, 168, GrowthRate.MEDIUM_SLOW, 50, false, true,
      new PokemonForm("Standard Mode", "", Type.ICE, null, 1.7, 120, Abilities.GORILLA_TACTICS, Abilities.NONE, Abilities.ZEN_MODE, 480, 105, 140, 55, 30, 55, 95, 60, 50, 168),
      new PokemonForm("Zen Mode", "zen", Type.ICE, Type.FIRE, 1.7, 120, Abilities.GORILLA_TACTICS, Abilities.NONE, Abilities.ZEN_MODE, 540, 105, 160, 55, 30, 55, 135, 60, 50, 189),
    ),
    new PokemonSpecies(Species.GALAR_YAMASK, 8, false, false, false, "Spirit Pokémon", Type.GROUND, Type.GHOST, 0.5, 1.5, Abilities.WANDERING_SPIRIT, Abilities.NONE, Abilities.NONE, 303, 38, 55, 85, 30, 65, 30, 190, 50, 61, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.GALAR_STUNFISK, 8, false, false, false, "Trap Pokémon", Type.GROUND, Type.STEEL, 0.7, 20.5, Abilities.MIMICRY, Abilities.NONE, Abilities.NONE, 471, 109, 81, 99, 66, 84, 32, 75, 70, 165, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.HISUI_GROWLITHE, 8, false, false, false, "Puppy Pokémon", Type.FIRE, Type.ROCK, 0.8, 22.7, Abilities.INTIMIDATE, Abilities.FLASH_FIRE, Abilities.ROCK_HEAD, 350, 60, 85, 45, 65, 50, 55, 190, 50, 70, GrowthRate.SLOW, 75, false),
    new PokemonSpecies(Species.HISUI_ARCANINE, 8, false, false, false, "Legendary Pokémon", Type.FIRE, Type.ROCK, 2, 168, Abilities.INTIMIDATE, Abilities.FLASH_FIRE, Abilities.ROCK_HEAD, 555, 95, 115, 80, 95, 80, 90, 85, 50, 194, GrowthRate.SLOW, 75, false),
    new PokemonSpecies(Species.HISUI_VOLTORB, 8, false, false, false, "Ball Pokémon", Type.ELECTRIC, Type.GRASS, 0.5, 13, Abilities.SOUNDPROOF, Abilities.STATIC, Abilities.AFTERMATH, 330, 40, 30, 50, 55, 55, 100, 190, 80, 66, GrowthRate.MEDIUM_FAST, null, false),
    new PokemonSpecies(Species.HISUI_ELECTRODE, 8, false, false, false, "Ball Pokémon", Type.ELECTRIC, Type.GRASS, 1.2, 81, Abilities.SOUNDPROOF, Abilities.STATIC, Abilities.AFTERMATH, 490, 60, 50, 70, 80, 80, 150, 60, 70, 172, GrowthRate.MEDIUM_FAST, null, false),
    new PokemonSpecies(Species.HISUI_TYPHLOSION, 8, false, false, false, "Volcano Pokémon", Type.FIRE, Type.GHOST, 1.6, 69.8, Abilities.BLAZE, Abilities.NONE, Abilities.FRISK, 534, 83, 84, 78, 119, 85, 95, 45, 70, 240, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.HISUI_QWILFISH, 8, false, false, false, "Balloon Pokémon", Type.DARK, Type.POISON, 0.5, 3.9, Abilities.POISON_POINT, Abilities.SWIFT_SWIM, Abilities.INTIMIDATE, 440, 65, 95, 85, 55, 55, 85, 45, 50, 88, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.HISUI_SNEASEL, 8, false, false, false, "Sharp Claw Pokémon", Type.FIGHTING, Type.POISON, 0.9, 27, Abilities.INNER_FOCUS, Abilities.KEEN_EYE, Abilities.PICKPOCKET, 430, 55, 95, 55, 35, 85, 115, 60, 35, 86, GrowthRate.MEDIUM_SLOW, 50, true),
    new PokemonSpecies(Species.HISUI_SAMUROTT, 8, false, false, false, "Formidable Pokémon", Type.WATER, Type.DARK, 1.5, 58.2, Abilities.TORRENT, Abilities.NONE, Abilities.SHARPNESS, 528, 90, 108, 80, 100, 65, 85, 45, 80, 238, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.HISUI_LILLIGANT, 8, false, false, false, "Flowering Pokémon", Type.GRASS, Type.FIGHTING, 1.2, 19.2, Abilities.CHLOROPHYLL, Abilities.HUSTLE, Abilities.LEAF_GUARD, 480, 80, 105, 75, 50, 75, 105, 75, 50, 168, GrowthRate.MEDIUM_FAST, 0, false),
    new PokemonSpecies(Species.HISUI_ZORUA, 8, false, false, false, "Tricky Fox Pokémon", Type.NORMAL, Type.GHOST, 0.7, 12.5, Abilities.ILLUSION, Abilities.NONE, Abilities.NONE, 330, 35, 60, 40, 85, 40, 80, 75, 50, 66, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.HISUI_ZOROARK, 8, false, false, false, "Illusion Fox Pokémon", Type.NORMAL, Type.GHOST, 1.6, 83, Abilities.ILLUSION, Abilities.NONE, Abilities.NONE, 510, 55, 100, 60, 125, 60, 110, 45, 50, 179, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.HISUI_BRAVIARY, 8, false, false, false, "Valiant Pokémon", Type.PSYCHIC, Type.FLYING, 1.7, 43.4, Abilities.KEEN_EYE, Abilities.SHEER_FORCE, Abilities.TINTED_LENS, 510, 110, 83, 80, 112, 70, 65, 60, 50, 179, GrowthRate.SLOW, 100, false),
    new PokemonSpecies(Species.HISUI_SLIGGOO, 8, false, false, false, "Soft Tissue Pokémon", Type.STEEL, Type.DRAGON, 0.7, 68.5, Abilities.SAP_SIPPER, Abilities.SHELL_ARMOR, Abilities.GOOEY, 452, 58, 85, 83, 83, 113, 40, 45, 35, 158, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.HISUI_GOODRA, 8, false, false, false, "Dragon Pokémon", Type.STEEL, Type.DRAGON, 1.7, 334.1, Abilities.SAP_SIPPER, Abilities.SHELL_ARMOR, Abilities.GOOEY, 600, 80, 100, 100, 110, 150, 60, 45, 35, 270, GrowthRate.SLOW, 50, false),
    new PokemonSpecies(Species.HISUI_AVALUGG, 8, false, false, false, "Iceberg Pokémon", Type.ICE, Type.ROCK, 1.4, 262.4, Abilities.STRONG_JAW, Abilities.ICE_BODY, Abilities.STURDY, 514, 95, 127, 184, 34, 36, 38, 55, 50, 180, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.HISUI_DECIDUEYE, 8, false, false, false, "Arrow Quill Pokémon", Type.GRASS, Type.FIGHTING, 1.6, 37, Abilities.OVERGROW, Abilities.NONE, Abilities.SCRAPPY, 530, 88, 112, 80, 95, 95, 60, 45, 50, 239, GrowthRate.MEDIUM_SLOW, 87.5, false),
    new PokemonSpecies(Species.PALDEA_TAUROS, 9, false, false, false, "Wild Bull Pokémon", Type.FIGHTING, null, 1.4, 115, Abilities.INTIMIDATE, Abilities.ANGER_POINT, Abilities.CUD_CHEW, 490, 75, 110, 105, 30, 70, 100, 45, 50, 172, GrowthRate.SLOW, 100, false, false,
      new PokemonForm("Combat Breed", "combat", Type.FIGHTING, null, 1.4, 115, Abilities.INTIMIDATE, Abilities.ANGER_POINT, Abilities.CUD_CHEW, 490, 75, 110, 105, 30, 70, 100, 45, 50, 172, false, "", true),
      new PokemonForm("Blaze Breed", "blaze", Type.FIGHTING, Type.FIRE, 1.4, 85, Abilities.INTIMIDATE, Abilities.ANGER_POINT, Abilities.CUD_CHEW, 490, 75, 110, 105, 30, 70, 100, 45, 50, 172, false, null, true),
      new PokemonForm("Aqua Breed", "aqua", Type.FIGHTING, Type.WATER, 1.4, 110, Abilities.INTIMIDATE, Abilities.ANGER_POINT, Abilities.CUD_CHEW, 490, 75, 110, 105, 30, 70, 100, 45, 50, 172, false, null, true),
    ),
    new PokemonSpecies(Species.PALDEA_WOOPER, 9, false, false, false, "Water Fish Pokémon", Type.POISON, Type.GROUND, 0.4, 11, Abilities.POISON_POINT, Abilities.WATER_ABSORB, Abilities.UNAWARE, 210, 55, 45, 45, 25, 25, 15, 255, 50, 42, GrowthRate.MEDIUM_FAST, 50, false),
    new PokemonSpecies(Species.BLOODMOON_URSALUNA, 9, false, false, false, "Peat Pokémon", Type.GROUND, Type.NORMAL, 2.7, 333, Abilities.MINDS_EYE, Abilities.NONE, Abilities.NONE, 555, 113, 70, 120, 135, 65, 52, 75, 50, 275, GrowthRate.MEDIUM_FAST, 50, false),
  );
}

export const speciesStarters = {
  [Species.BULBASAUR]: 3,
  [Species.CHARMANDER]: 3,
  [Species.SQUIRTLE]: 3,
  [Species.CATERPIE]: 1,
  [Species.WEEDLE]: 1,
  [Species.PIDGEY]: 2,
  [Species.RATTATA]: 1,
  [Species.SPEAROW]: 2,
  [Species.EKANS]: 2,
  [Species.PIKACHU]: 4,
  [Species.SANDSHREW]: 2,
  [Species.NIDORAN_F]: 3,
  [Species.NIDORAN_M]: 3,
  [Species.CLEFAIRY]: 4,
  [Species.VULPIX]: 3,
  [Species.JIGGLYPUFF]: 4,
  [Species.ZUBAT]: 2,
  [Species.ODDISH]: 2,
  [Species.PARAS]: 1,
  [Species.VENONAT]: 2,
  [Species.DIGLETT]: 3,
  [Species.MEOWTH]: 4,
  [Species.PSYDUCK]: 2,
  [Species.MANKEY]: 4,
  [Species.GROWLITHE]: 4,
  [Species.POLIWAG]: 3,
  [Species.ABRA]: 3,
  [Species.MACHOP]: 3,
  [Species.BELLSPROUT]: 3,
  [Species.TENTACOOL]: 3,
  [Species.GEODUDE]: 3,
  [Species.PONYTA]: 3,
  [Species.SLOWPOKE]: 3,
  [Species.MAGNEMITE]: 3,
  [Species.FARFETCHD]: 4,
  [Species.DODUO]: 4,
  [Species.SEEL]: 3,
  [Species.GRIMER]: 3,
  [Species.SHELLDER]: 4,
  [Species.GASTLY]: 3,
  [Species.ONIX]: 4,
  [Species.DROWZEE]: 3,
  [Species.KRABBY]: 2,
  [Species.VOLTORB]: 2,
  [Species.EXEGGCUTE]: 4,
  [Species.CUBONE]: 3,
  [Species.HITMONLEE]: 5,
  [Species.HITMONCHAN]: 5,
  [Species.LICKITUNG]: 5,
  [Species.KOFFING]: 3,
  [Species.RHYHORN]: 3,
  [Species.CHANSEY]: 5,
  [Species.TANGELA]: 3,
  [Species.KANGASKHAN]: 5,
  [Species.HORSEA]: 4,
  [Species.GOLDEEN]: 3,
  [Species.STARYU]: 4,
  [Species.MR_MIME]: 4,
  [Species.SCYTHER]: 5,
  [Species.JYNX]: 4,
  [Species.ELECTABUZZ]: 5,
  [Species.MAGMAR]: 5,
  [Species.PINSIR]: 4,
  [Species.TAUROS]: 5,
  [Species.MAGIKARP]: 3,
  [Species.LAPRAS]: 5,
  [Species.DITTO]: 2,
  [Species.EEVEE]: 4,
  [Species.PORYGON]: 4,
  [Species.OMANYTE]: 3,
  [Species.KABUTO]: 3,
  [Species.AERODACTYL]: 5,
  [Species.SNORLAX]: 5,
  [Species.ARTICUNO]: 6,
  [Species.ZAPDOS]: 6,
  [Species.MOLTRES]: 6,
  [Species.DRATINI]: 4,
  [Species.MEWTWO]: 8,
  [Species.MEW]: 6,

  [Species.CHIKORITA]: 3,
  [Species.CYNDAQUIL]: 3,
  [Species.TOTODILE]: 3,
  [Species.SENTRET]: 1,
  [Species.HOOTHOOT]: 1,
  [Species.LEDYBA]: 1,
  [Species.SPINARAK]: 1,
  [Species.CHINCHOU]: 3,
  [Species.PICHU]: 3,
  [Species.CLEFFA]: 3,
  [Species.IGGLYBUFF]: 3,
  [Species.TOGEPI]: 3,
  [Species.NATU]: 2,
  [Species.MAREEP]: 3,
  [Species.MARILL]: 4,
  [Species.SUDOWOODO]: 5,
  [Species.HOPPIP]: 1,
  [Species.AIPOM]: 3,
  [Species.SUNKERN]: 1,
  [Species.YANMA]: 3,
  [Species.WOOPER]: 2,
  [Species.MURKROW]: 4,
  [Species.MISDREAVUS]: 3,
  [Species.UNOWN]: 1,
  [Species.WOBBUFFET]: 4,
  [Species.GIRAFARIG]: 4,
  [Species.PINECO]: 2,
  [Species.DUNSPARCE]: 4,
  [Species.GLIGAR]: 4,
  [Species.SNUBBULL]: 3,
  [Species.QWILFISH]: 3,
  [Species.SHUCKLE]: 4,
  [Species.HERACROSS]: 5,
  [Species.SNEASEL]: 4,
  [Species.TEDDIURSA]: 4,
  [Species.SLUGMA]: 2,
  [Species.SWINUB]: 3,
  [Species.CORSOLA]: 3,
  [Species.REMORAID]: 3,
  [Species.DELIBIRD]: 3,
  [Species.MANTINE]: 4,
  [Species.SKARMORY]: 5,
  [Species.HOUNDOUR]: 4,
  [Species.PHANPY]: 3,
  [Species.STANTLER]: 4,
  [Species.SMEARGLE]: 3,
  [Species.TYROGUE]: 4,
  [Species.SMOOCHUM]: 3,
  [Species.ELEKID]: 4,
  [Species.MAGBY]: 4,
  [Species.MILTANK]: 5,
  [Species.RAIKOU]: 6,
  [Species.ENTEI]: 6,
  [Species.SUICUNE]: 6,
  [Species.LARVITAR]: 4,
  [Species.LUGIA]: 8,
  [Species.HO_OH]: 8,
  [Species.CELEBI]: 6,

  [Species.TREECKO]: 3,
  [Species.TORCHIC]: 3,
  [Species.MUDKIP]: 3,
  [Species.POOCHYENA]: 2,
  [Species.ZIGZAGOON]: 2,
  [Species.WURMPLE]: 1,
  [Species.LOTAD]: 3,
  [Species.SEEDOT]: 3,
  [Species.TAILLOW]: 3,
  [Species.WINGULL]: 3,
  [Species.RALTS]: 3,
  [Species.SURSKIT]: 2,
  [Species.SHROOMISH]: 3,
  [Species.SLAKOTH]: 4,
  [Species.NINCADA]: 4,
  [Species.WHISMUR]: 3,
  [Species.MAKUHITA]: 3,
  [Species.AZURILL]: 3,
  [Species.NOSEPASS]: 3,
  [Species.SKITTY]: 3,
  [Species.SABLEYE]: 3,
  [Species.MAWILE]: 5,
  [Species.ARON]: 3,
  [Species.MEDITITE]: 4,
  [Species.ELECTRIKE]: 3,
  [Species.PLUSLE]: 2,
  [Species.MINUN]: 2,
  [Species.VOLBEAT]: 2,
  [Species.ILLUMISE]: 2,
  [Species.ROSELIA]: 4,
  [Species.GULPIN]: 3,
  [Species.CARVANHA]: 3,
  [Species.WAILMER]: 3,
  [Species.NUMEL]: 3,
  [Species.TORKOAL]: 4,
  [Species.SPOINK]: 3,
  [Species.SPINDA]: 2,
  [Species.TRAPINCH]: 4,
  [Species.CACNEA]: 3,
  [Species.SWABLU]: 3,
  [Species.ZANGOOSE]: 5,
  [Species.SEVIPER]: 4,
  [Species.LUNATONE]: 4,
  [Species.SOLROCK]: 4,
  [Species.BARBOACH]: 3,
  [Species.CORPHISH]: 3,
  [Species.BALTOY]: 3,
  [Species.LILEEP]: 3,
  [Species.ANORITH]: 3,
  [Species.FEEBAS]: 4,
  [Species.CASTFORM]: 2,
  [Species.KECLEON]: 4,
  [Species.SHUPPET]: 3,
  [Species.DUSKULL]: 3,
  [Species.TROPIUS]: 5,
  [Species.CHIMECHO]: 4,
  [Species.ABSOL]: 5,
  [Species.WYNAUT]: 3,
  [Species.SNORUNT]: 3,
  [Species.SPHEAL]: 3,
  [Species.CLAMPERL]: 3,
  [Species.RELICANTH]: 4,
  [Species.LUVDISC]: 2,
  [Species.BAGON]: 4,
  [Species.BELDUM]: 4,
  [Species.REGIROCK]: 6,
  [Species.REGICE]: 6,
  [Species.REGISTEEL]: 6,
  [Species.LATIAS]: 7,
  [Species.LATIOS]: 7,
  [Species.KYOGRE]: 9,
  [Species.GROUDON]: 9,
  [Species.RAYQUAZA]: 9,
  [Species.JIRACHI]: 7,
  [Species.DEOXYS]: 7,

  [Species.TURTWIG]: 3,
  [Species.CHIMCHAR]: 3,
  [Species.PIPLUP]: 3,
  [Species.STARLY]: 3,
  [Species.BIDOOF]: 2,
  [Species.KRICKETOT]: 1,
  [Species.SHINX]: 3,
  [Species.BUDEW]: 3,
  [Species.CRANIDOS]: 3,
  [Species.SHIELDON]: 3,
  [Species.BURMY]: 1,
  [Species.COMBEE]: 2,
  [Species.PACHIRISU]: 3,
  [Species.BUIZEL]: 3,
  [Species.CHERUBI]: 3,
  [Species.SHELLOS]: 3,
  [Species.DRIFLOON]: 3,
  [Species.BUNEARY]: 3,
  [Species.GLAMEOW]: 3,
  [Species.CHINGLING]: 3,
  [Species.STUNKY]: 3,
  [Species.BRONZOR]: 3,
  [Species.BONSLY]: 4,
  [Species.MIME_JR]: 3,
  [Species.HAPPINY]: 4,
  [Species.CHATOT]: 4,
  [Species.SPIRITOMB]: 5,
  [Species.GIBLE]: 4,
  [Species.MUNCHLAX]: 4,
  [Species.RIOLU]: 4,
  [Species.HIPPOPOTAS]: 3,
  [Species.SKORUPI]: 3,
  [Species.CROAGUNK]: 3,
  [Species.CARNIVINE]: 4,
  [Species.FINNEON]: 3,
  [Species.MANTYKE]: 3,
  [Species.SNOVER]: 3,
  [Species.ROTOM]: 5,
  [Species.UXIE]: 6,
  [Species.MESPRIT]: 6,
  [Species.AZELF]: 6,
  [Species.DIALGA]: 8,
  [Species.PALKIA]: 8,
  [Species.HEATRAN]: 6,
  [Species.REGIGIGAS]: 7,
  [Species.GIRATINA]: 8,
  [Species.CRESSELIA]: 6,
  [Species.PHIONE]: 4,
  [Species.MANAPHY]: 7,
  [Species.DARKRAI]: 6,
  [Species.SHAYMIN]: 6,
  [Species.ARCEUS]: 9,
  [Species.VICTINI]: 7,

  [Species.SNIVY]: 3,
  [Species.TEPIG]: 3,
  [Species.OSHAWOTT]: 3,
  [Species.PATRAT]: 2,
  [Species.LILLIPUP]: 3,
  [Species.PURRLOIN]: 3,
  [Species.PANSAGE]: 3,
  [Species.PANSEAR]: 3,
  [Species.PANPOUR]: 3,
  [Species.MUNNA]: 3,
  [Species.PIDOVE]: 2,
  [Species.BLITZLE]: 3,
  [Species.ROGGENROLA]: 3,
  [Species.WOOBAT]: 3,
  [Species.DRILBUR]: 4,
  [Species.AUDINO]: 4,
  [Species.TIMBURR]: 3,
  [Species.TYMPOLE]: 3,
  [Species.THROH]: 5,
  [Species.SAWK]: 5,
  [Species.SEWADDLE]: 3,
  [Species.VENIPEDE]: 3,
  [Species.COTTONEE]: 3,
  [Species.PETILIL]: 3,
  [Species.BASCULIN]: 4,
  [Species.SANDILE]: 3,
  [Species.DARUMAKA]: 4,
  [Species.MARACTUS]: 4,
  [Species.DWEBBLE]: 3,
  [Species.SCRAGGY]: 3,
  [Species.SIGILYPH]: 5,
  [Species.YAMASK]: 3,
  [Species.TIRTOUGA]: 4,
  [Species.ARCHEN]: 4,
  [Species.TRUBBISH]: 3,
  [Species.ZORUA]: 3,
  [Species.MINCCINO]: 3,
  [Species.GOTHITA]: 3,
  [Species.SOLOSIS]: 3,
  [Species.DUCKLETT]: 3,
  [Species.VANILLITE]: 3,
  [Species.DEERLING]: 3,
  [Species.EMOLGA]: 3,
  [Species.KARRABLAST]: 3,
  [Species.FOONGUS]: 3,
  [Species.FRILLISH]: 3,
  [Species.ALOMOMOLA]: 4,
  [Species.JOLTIK]: 3,
  [Species.FERROSEED]: 3,
  [Species.KLINK]: 3,
  [Species.TYNAMO]: 3,
  [Species.ELGYEM]: 3,
  [Species.LITWICK]: 3,
  [Species.AXEW]: 4,
  [Species.CUBCHOO]: 3,
  [Species.CRYOGONAL]: 5,
  [Species.SHELMET]: 3,
  [Species.STUNFISK]: 4,
  [Species.MIENFOO]: 3,
  [Species.DRUDDIGON]: 5,
  [Species.GOLETT]: 3,
  [Species.PAWNIARD]: 4,
  [Species.BOUFFALANT]: 5,
  [Species.RUFFLET]: 3,
  [Species.VULLABY]: 3,
  [Species.HEATMOR]: 5,
  [Species.DURANT]: 5,
  [Species.DEINO]: 4,
  [Species.LARVESTA]: 4,
  [Species.COBALION]: 6,
  [Species.TERRAKION]: 6,
  [Species.VIRIZION]: 6,
  [Species.TORNADUS]: 7,
  [Species.THUNDURUS]: 7,
  [Species.RESHIRAM]: 8,
  [Species.ZEKROM]: 8,
  [Species.LANDORUS]: 7,
  [Species.KYUREM]: 8,
  [Species.KELDEO]: 6,
  [Species.MELOETTA]: 6,
  [Species.GENESECT]: 6,

  [Species.CHESPIN]: 3,
  [Species.FENNEKIN]: 3,
  [Species.FROAKIE]: 3,
  [Species.BUNNELBY]: 2,
  [Species.FLETCHLING]: 3,
  [Species.SCATTERBUG]: 1,
  [Species.LITLEO]: 3,
  [Species.FLABEBE]: 3,
  [Species.SKIDDO]: 3,
  [Species.PANCHAM]: 3,
  [Species.FURFROU]: 4,
  [Species.ESPURR]: 3,
  [Species.HONEDGE]: 4,
  [Species.SPRITZEE]: 3,
  [Species.SWIRLIX]: 3,
  [Species.INKAY]: 3,
  [Species.BINACLE]: 3,
  [Species.SKRELP]: 3,
  [Species.CLAUNCHER]: 3,
  [Species.HELIOPTILE]: 3,
  [Species.TYRUNT]: 3,
  [Species.AMAURA]: 3,
  [Species.HAWLUCHA]: 4,
  [Species.DEDENNE]: 4,
  [Species.CARBINK]: 4,
  [Species.GOOMY]: 4,
  [Species.KLEFKI]: 4,
  [Species.PHANTUMP]: 3,
  [Species.PUMPKABOO]: 3,
  [Species.BERGMITE]: 3,
  [Species.NOIBAT]: 4,
  [Species.XERNEAS]: 8,
  [Species.YVELTAL]: 8,
  [Species.ZYGARDE]: 8,
  [Species.DIANCIE]: 7,
  [Species.HOOPA]: 7,
  [Species.VOLCANION]: 6,
  [Species.ETERNAL_FLOETTE]: 5,

  [Species.ROWLET]: 3,
  [Species.LITTEN]: 3,
  [Species.POPPLIO]: 3,
  [Species.PIKIPEK]: 3,
  [Species.YUNGOOS]: 2,
  [Species.GRUBBIN]: 2,
  [Species.CRABRAWLER]: 4,
  [Species.ORICORIO]: 3,
  [Species.CUTIEFLY]: 3,
  [Species.ROCKRUFF]: 3,
  [Species.WISHIWASHI]: 3,
  [Species.MAREANIE]: 3,
  [Species.MUDBRAY]: 3,
  [Species.DEWPIDER]: 3,
  [Species.FOMANTIS]: 3,
  [Species.MORELULL]: 3,
  [Species.SALANDIT]: 3,
  [Species.STUFFUL]: 3,
  [Species.BOUNSWEET]: 3,
  [Species.COMFEY]: 4,
  [Species.ORANGURU]: 5,
  [Species.PASSIMIAN]: 5,
  [Species.WIMPOD]: 3,
  [Species.SANDYGAST]: 3,
  [Species.PYUKUMUKU]: 3,
  [Species.TYPE_NULL]: 5,
  [Species.MINIOR]: 5,
  [Species.KOMALA]: 5,
  [Species.TURTONATOR]: 5,
  [Species.TOGEDEMARU]: 4,
  [Species.MIMIKYU]: 5,
  [Species.BRUXISH]: 5,
  [Species.DRAMPA]: 5,
  [Species.DHELMISE]: 5,
  [Species.JANGMO_O]: 4,
  [Species.TAPU_KOKO]: 6,
  [Species.TAPU_LELE]: 6,
  [Species.TAPU_BULU]: 6,
  [Species.TAPU_FINI]: 6,
  [Species.COSMOG]: 6,
  [Species.NIHILEGO]: 6,
  [Species.BUZZWOLE]: 6,
  [Species.PHEROMOSA]: 7,
  [Species.XURKITREE]: 6,
  [Species.CELESTEELA]: 6,
  [Species.KARTANA]: 7,
  [Species.GUZZLORD]: 6,
  [Species.NECROZMA]: 8,
  [Species.MAGEARNA]: 7,
  [Species.MARSHADOW]: 7,
  [Species.POIPOLE]: 7,
  [Species.STAKATAKA]: 6,
  [Species.BLACEPHALON]: 7,
  [Species.ZERAORA]: 6,
  [Species.MELTAN]: 6,
  [Species.ALOLA_RATTATA]: 2,
  [Species.ALOLA_SANDSHREW]: 4,
  [Species.ALOLA_VULPIX]: 4,
  [Species.ALOLA_DIGLETT]: 3,
  [Species.ALOLA_MEOWTH]: 4,
  [Species.ALOLA_GEODUDE]: 3,
  [Species.ALOLA_GRIMER]: 3,

  [Species.GROOKEY]: 3,
  [Species.SCORBUNNY]: 3,
  [Species.SOBBLE]: 3,
  [Species.SKWOVET]: 2,
  [Species.ROOKIDEE]: 4,
  [Species.BLIPBUG]: 2,
  [Species.NICKIT]: 3,
  [Species.GOSSIFLEUR]: 3,
  [Species.WOOLOO]: 3,
  [Species.CHEWTLE]: 3,
  [Species.YAMPER]: 3,
  [Species.ROLYCOLY]: 3,
  [Species.APPLIN]: 4,
  [Species.SILICOBRA]: 3,
  [Species.CRAMORANT]: 3,
  [Species.ARROKUDA]: 3,
  [Species.TOXEL]: 3,
  [Species.SIZZLIPEDE]: 3,
  [Species.CLOBBOPUS]: 3,
  [Species.SINISTEA]: 3,
  [Species.HATENNA]: 4,
  [Species.IMPIDIMP]: 3,
  [Species.MILCERY]: 3,
  [Species.FALINKS]: 4,
  [Species.PINCURCHIN]: 3,
  [Species.SNOM]: 3,
  [Species.STONJOURNER]: 4,
  [Species.EISCUE]: 4,
  [Species.INDEEDEE]: 3,
  [Species.MORPEKO]: 3,
  [Species.CUFANT]: 4,
  [Species.DRACOZOLT]: 5,
  [Species.ARCTOZOLT]: 5,
  [Species.DRACOVISH]: 5,
  [Species.ARCTOVISH]: 5,
  [Species.DURALUDON]: 5,
  [Species.DREEPY]: 4,
  [Species.ZACIAN]: 9,
  [Species.ZAMAZENTA]: 8,
  [Species.ETERNATUS]: 10,
  [Species.KUBFU]: 6,
  [Species.ZARUDE]: 6,
  [Species.REGIELEKI]: 6,
  [Species.REGIDRAGO]: 6,
  [Species.GLASTRIER]: 6,
  [Species.SPECTRIER]: 7,
  [Species.CALYREX]: 8,
  [Species.GALAR_MEOWTH]: 4,
  [Species.GALAR_PONYTA]: 4,
  [Species.GALAR_SLOWPOKE]: 3,
  [Species.GALAR_FARFETCHD]: 5,
  [Species.GALAR_CORSOLA]: 4,
  [Species.GALAR_ZIGZAGOON]: 3,
  [Species.GALAR_DARUMAKA]: 4,
  [Species.GALAR_YAMASK]: 3,
  [Species.GALAR_STUNFISK]: 4,
  [Species.GALAR_MR_MIME]: 5,
  [Species.GALAR_ARTICUNO]: 6,
  [Species.GALAR_ZAPDOS]: 6,
  [Species.GALAR_MOLTRES]: 6,
  [Species.HISUI_GROWLITHE]: 4,
  [Species.HISUI_VOLTORB]: 3,
  [Species.HISUI_QWILFISH]: 4,
  [Species.HISUI_SNEASEL]: 4,
  [Species.HISUI_ZORUA]: 4,
  [Species.ENAMORUS]: 7,

  [Species.SPRIGATITO]: 3,
  [Species.FUECOCO]: 3,
  [Species.QUAXLY]: 3,
  [Species.LECHONK]: 2,
  [Species.TAROUNTULA]: 1,
  [Species.NYMBLE]: 3,
  [Species.PAWMI]: 3,
  [Species.TANDEMAUS]: 4,
  [Species.FIDOUGH]: 3,
  [Species.SMOLIV]: 3,
  [Species.SQUAWKABILLY]: 3,
  [Species.NACLI]: 4,
  [Species.CHARCADET]: 4,
  [Species.TADBULB]: 3,
  [Species.WATTREL]: 3,
  [Species.MASCHIFF]: 3,
  [Species.SHROODLE]: 3,
  [Species.BRAMBLIN]: 3,
  [Species.TOEDSCOOL]: 3,
  [Species.KLAWF]: 4,
  [Species.CAPSAKID]: 3,
  [Species.RELLOR]: 3,
  [Species.FLITTLE]: 3,
  [Species.TINKATINK]: 4,
  [Species.WIGLETT]: 3,
  [Species.BOMBIRDIER]: 3,
  [Species.FINIZEN]: 4,
  [Species.VAROOM]: 4,
  [Species.CYCLIZAR]: 5,
  [Species.ORTHWORM]: 4,
  [Species.GLIMMET]: 4,
  [Species.GREAVARD]: 4,
  [Species.FLAMIGO]: 4,
  [Species.CETODDLE]: 4,
  [Species.VELUZA]: 4,
  [Species.DONDOZO]: 5,
  [Species.TATSUGIRI]: 5,
  [Species.GREAT_TUSK]: 6,
  [Species.SCREAM_TAIL]: 6,
  [Species.BRUTE_BONNET]: 6,
  [Species.FLUTTER_MANE]: 6,
  [Species.SLITHER_WING]: 6,
  [Species.SANDY_SHOCKS]: 6,
  [Species.IRON_TREADS]: 6,
  [Species.IRON_BUNDLE]: 6,
  [Species.IRON_HANDS]: 6,
  [Species.IRON_JUGULIS]: 6,
  [Species.IRON_MOTH]: 6,
  [Species.IRON_THORNS]: 6,
  [Species.FRIGIBAX]: 4,
  [Species.GIMMIGHOUL]: 5,
  [Species.WO_CHIEN]: 6,
  [Species.CHIEN_PAO]: 7,
  [Species.TING_LU]: 6,
  [Species.CHI_YU]: 7,
  [Species.ROARING_MOON]: 6,
  [Species.IRON_VALIANT]: 6,
  [Species.KORAIDON]: 9,
  [Species.MIRAIDON]: 9,
  [Species.WALKING_WAKE]: 6,
  [Species.IRON_LEAVES]: 6,
  [Species.POLTCHAGEIST]: 4,
  [Species.OKIDOGI]: 6,
  [Species.MUNKIDORI]: 6,
  [Species.FEZANDIPITI]: 6,
  [Species.OGERPON]: 7,
  [Species.GOUGING_FIRE]: 7,
  [Species.RAGING_BOLT]: 6,
  [Species.IRON_BOULDER]: 7,
  [Species.IRON_CROWN]: 6,
  [Species.TERAPAGOS]: 8,
  [Species.PECHARUNT]: 6,
  [Species.PALDEA_TAUROS]: 5,
  [Species.PALDEA_WOOPER]: 3,
  [Species.BLOODMOON_URSALUNA]: 7,
};

export const noStarterFormKeys: string[] = [
  SpeciesFormKey.MEGA,
  SpeciesFormKey.MEGA_X,
  SpeciesFormKey.MEGA_Y,
  SpeciesFormKey.PRIMAL,
  SpeciesFormKey.ORIGIN,
  SpeciesFormKey.THERIAN,
  SpeciesFormKey.GIGANTAMAX,
  SpeciesFormKey.GIGANTAMAX_RAPID,
  SpeciesFormKey.GIGANTAMAX_SINGLE,
  SpeciesFormKey.ETERNAMAX
].map(k => k.toString());

export function getStarterValueFriendshipCap(value: integer): integer {
  switch (value) {
  case 1:
    return 20;
  case 2:
    return 40;
  case 3:
    return 60;
  case 4:
    return 100;
  case 5:
    return 140;
  case 6:
    return 200;
  case 7:
    return 280;
  case 8:
  case 9:
    return 450;
  default:
    return 600;
  }
}

export const starterPassiveAbilities = {
  [Species.BULBASAUR]: Abilities.GRASSY_SURGE,
  [Species.CHARMANDER]: Abilities.SHEER_FORCE,
  [Species.SQUIRTLE]: Abilities.STURDY,
  [Species.CATERPIE]: Abilities.MAGICIAN,
  [Species.WEEDLE]: Abilities.TECHNICIAN,
  [Species.PIDGEY]: Abilities.GALE_WINGS,
  [Species.RATTATA]: Abilities.STRONG_JAW,
  [Species.SPEAROW]: Abilities.MOXIE,
  [Species.EKANS]: Abilities.ROUGH_SKIN,
  [Species.SANDSHREW]: Abilities.IRON_BARBS,
  [Species.NIDORAN_F]: Abilities.QUEENLY_MAJESTY,
  [Species.NIDORAN_M]: Abilities.SUPREME_OVERLORD,
  [Species.VULPIX]: Abilities.CURSED_BODY,
  [Species.ZUBAT]: Abilities.WIND_RIDER,
  [Species.ODDISH]: Abilities.LINGERING_AROMA,
  [Species.PARAS]: Abilities.POISON_HEAL,
  [Species.VENONAT]: Abilities.SWARM,
  [Species.DIGLETT]: Abilities.STURDY,
  [Species.MEOWTH]: Abilities.NORMALIZE,
  [Species.PSYDUCK]: Abilities.SIMPLE,
  [Species.MANKEY]: Abilities.IRON_FIST,
  [Species.GROWLITHE]: Abilities.SPEED_BOOST,
  [Species.POLIWAG]: Abilities.WATER_BUBBLE,
  [Species.ABRA]: Abilities.OPPORTUNIST,
  [Species.MACHOP]: Abilities.IRON_FIST,
  [Species.BELLSPROUT]: Abilities.CORROSION,
  [Species.TENTACOOL]: Abilities.INNARDS_OUT,
  [Species.GEODUDE]: Abilities.ROCKY_PAYLOAD,
  [Species.PONYTA]: Abilities.MAGIC_GUARD,
  [Species.SLOWPOKE]: Abilities.UNAWARE,
  [Species.MAGNEMITE]: Abilities.MOTOR_DRIVE,
  [Species.FARFETCHD]: Abilities.PURE_POWER,
  [Species.DODUO]: Abilities.RECKLESS,
  [Species.SEEL]: Abilities.REGENERATOR,
  [Species.GRIMER]: Abilities.GOOEY,
  [Species.SHELLDER]: Abilities.MOXIE,
  [Species.GASTLY]: Abilities.PERISH_BODY,
  [Species.ONIX]: Abilities.ROCKY_PAYLOAD,
  [Species.DROWZEE]: Abilities.BAD_DREAMS,
  [Species.KRABBY]: Abilities.ANGER_SHELL,
  [Species.VOLTORB]: Abilities.GALVANIZE,
  [Species.EXEGGCUTE]: Abilities.PARENTAL_BOND,
  [Species.CUBONE]: Abilities.MOODY,
  [Species.LICKITUNG]: Abilities.EARTH_EATER,
  [Species.KOFFING]: Abilities.FLARE_BOOST,
  [Species.RHYHORN]: Abilities.FILTER,
  [Species.TANGELA]: Abilities.TANGLING_HAIR,
  [Species.KANGASKHAN]: Abilities.IRON_FIST,
  [Species.HORSEA]: Abilities.DRIZZLE,
  [Species.GOLDEEN]: Abilities.MULTISCALE,
  [Species.STARYU]: Abilities.REGENERATOR,
  [Species.SCYTHER]: Abilities.SPEED_BOOST,
  [Species.PINSIR]: Abilities.SAP_SIPPER,
  [Species.TAUROS]: Abilities.ROCK_HEAD,
  [Species.MAGIKARP]: Abilities.MULTISCALE,
  [Species.LAPRAS]: Abilities.LIQUID_VOICE,
  [Species.DITTO]: Abilities.GOOEY,
  [Species.EEVEE]: Abilities.SIMPLE,
  [Species.PORYGON]: Abilities.QUARK_DRIVE,
  [Species.OMANYTE]: Abilities.ANGER_SHELL,
  [Species.KABUTO]: Abilities.SHARPNESS,
  [Species.AERODACTYL]: Abilities.PROTOSYNTHESIS,
  [Species.ARTICUNO]: Abilities.SNOW_WARNING,
  [Species.ZAPDOS]: Abilities.DRIZZLE,
  [Species.MOLTRES]: Abilities.DROUGHT,
  [Species.DRATINI]: Abilities.AERILATE,
  [Species.MEWTWO]: Abilities.NEUROFORCE,
  [Species.MEW]: Abilities.PROTEAN,
  [Species.CHIKORITA]: Abilities.THICK_FAT,
  [Species.CYNDAQUIL]: Abilities.DROUGHT,
  [Species.TOTODILE]: Abilities.TOUGH_CLAWS,
  [Species.SENTRET]: Abilities.FLUFFY,
  [Species.HOOTHOOT]: Abilities.CURSED_BODY,
  [Species.LEDYBA]: Abilities.PRANKSTER,
  [Species.SPINARAK]: Abilities.PRANKSTER,
  [Species.CHINCHOU]: Abilities.REGENERATOR,
  [Species.PICHU]: Abilities.ELECTRIC_SURGE,
  [Species.CLEFFA]: Abilities.MAGIC_BOUNCE,
  [Species.IGGLYBUFF]: Abilities.SERENE_GRACE,
  [Species.TOGEPI]: Abilities.OPPORTUNIST,
  [Species.NATU]: Abilities.TINTED_LENS,
  [Species.MAREEP]: Abilities.FLUFFY,
  [Species.HOPPIP]: Abilities.PRANKSTER,
  [Species.AIPOM]: Abilities.SCRAPPY,
  [Species.SUNKERN]: Abilities.DROUGHT,
  [Species.YANMA]: Abilities.INFILTRATOR,
  [Species.WOOPER]: Abilities.SIMPLE,
  [Species.MURKROW]: Abilities.DEFIANT,
  [Species.MISDREAVUS]: Abilities.DAZZLING,
  [Species.UNOWN]: Abilities.PICKUP,
  [Species.GIRAFARIG]: Abilities.PARENTAL_BOND,
  [Species.PINECO]: Abilities.IRON_BARBS,
  [Species.DUNSPARCE]: Abilities.MARVEL_SCALE,
  [Species.GLIGAR]: Abilities.MERCILESS,
  [Species.SNUBBULL]: Abilities.BALL_FETCH,
  [Species.QWILFISH]: Abilities.TOXIC_DEBRIS,
  [Species.SHUCKLE]: Abilities.WELL_BAKED_BODY,
  [Species.HERACROSS]: Abilities.QUICK_FEET,
  [Species.SNEASEL]: Abilities.MOXIE,
  [Species.TEDDIURSA]: Abilities.GLUTTONY,
  [Species.SLUGMA]: Abilities.DROUGHT,
  [Species.SWINUB]: Abilities.SLUSH_RUSH,
  [Species.CORSOLA]: Abilities.STORM_DRAIN,
  [Species.REMORAID]: Abilities.SKILL_LINK,
  [Species.DELIBIRD]: Abilities.PRANKSTER,
  [Species.SKARMORY]: Abilities.OBLIVIOUS,
  [Species.HOUNDOUR]: Abilities.INTIMIDATE,
  [Species.PHANPY]: Abilities.ROCK_HEAD,
  [Species.STANTLER]: Abilities.MAGIC_GUARD,
  [Species.SMEARGLE]: Abilities.QUICK_DRAW,
  [Species.TYROGUE]: Abilities.STAMINA,
  [Species.SMOOCHUM]: Abilities.DAZZLING,
  [Species.ELEKID]: Abilities.IRON_FIST,
  [Species.MAGBY]: Abilities.CONTRARY,
  [Species.MILTANK]: Abilities.GLUTTONY,
  [Species.RAIKOU]: Abilities.TRANSISTOR,
  [Species.ENTEI]: Abilities.MOXIE,
  [Species.SUICUNE]: Abilities.UNAWARE,
  [Species.LARVITAR]: Abilities.SAND_RUSH,
  [Species.LUGIA]: Abilities.DELTA_STREAM,
  [Species.HO_OH]: Abilities.MAGIC_GUARD,
  [Species.CELEBI]: Abilities.GRASSY_SURGE,
  [Species.TREECKO]: Abilities.TINTED_LENS,
  [Species.TORCHIC]: Abilities.RECKLESS,
  [Species.MUDKIP]: Abilities.REGENERATOR,
  [Species.POOCHYENA]: Abilities.STRONG_JAW,
  [Species.ZIGZAGOON]: Abilities.PICKPOCKET,
  [Species.WURMPLE]: Abilities.TINTED_LENS,
  [Species.LOTAD]: Abilities.DRIZZLE,
  [Species.SEEDOT]: Abilities.LEAF_GUARD,
  [Species.TAILLOW]: Abilities.KEEN_EYE,
  [Species.WINGULL]: Abilities.STORM_DRAIN,
  [Species.RALTS]: Abilities.PSYCHIC_SURGE,
  [Species.SURSKIT]: Abilities.WATER_ABSORB,
  [Species.SHROOMISH]: Abilities.GUTS,
  [Species.SLAKOTH]: Abilities.GUTS,
  [Species.NINCADA]: Abilities.OVERCOAT,
  [Species.WHISMUR]: Abilities.PUNK_ROCK,
  [Species.MAKUHITA]: Abilities.STAMINA,
  [Species.AZURILL]: Abilities.MISTY_SURGE,
  [Species.NOSEPASS]: Abilities.LEVITATE,
  [Species.SKITTY]: Abilities.SCRAPPY,
  [Species.SABLEYE]: Abilities.UNNERVE,
  [Species.MAWILE]: Abilities.MOLD_BREAKER,
  [Species.ARON]: Abilities.SOLID_ROCK,
  [Species.MEDITITE]: Abilities.OWN_TEMPO,
  [Species.ELECTRIKE]: Abilities.ELECTRIC_SURGE,
  [Species.PLUSLE]: Abilities.MINUS,
  [Species.MINUN]: Abilities.PLUS,
  [Species.VOLBEAT]: Abilities.TINTED_LENS,
  [Species.ILLUMISE]: Abilities.SWARM,
  [Species.GULPIN]: Abilities.POISON_TOUCH,
  [Species.CARVANHA]: Abilities.STAKEOUT,
  [Species.WAILMER]: Abilities.LEVITATE,
  [Species.NUMEL]: Abilities.TURBOBLAZE,
  [Species.TORKOAL]: Abilities.PROTOSYNTHESIS,
  [Species.SPOINK]: Abilities.PSYCHIC_SURGE,
  [Species.SPINDA]: Abilities.SIMPLE,
  [Species.TRAPINCH]: Abilities.ADAPTABILITY,
  [Species.CACNEA]: Abilities.SAND_RUSH,
  [Species.SWABLU]: Abilities.WHITE_SMOKE,
  [Species.ZANGOOSE]: Abilities.TOUGH_CLAWS,
  [Species.SEVIPER]: Abilities.MOLD_BREAKER,
  [Species.LUNATONE]: Abilities.FAIRY_AURA,
  [Species.SOLROCK]: Abilities.DROUGHT,
  [Species.BARBOACH]: Abilities.BALL_FETCH,
  [Species.CORPHISH]: Abilities.TOUGH_CLAWS,
  [Species.BALTOY]: Abilities.OWN_TEMPO,
  [Species.LILEEP]: Abilities.WATER_ABSORB,
  [Species.ANORITH]: Abilities.WATER_ABSORB,
  [Species.FEEBAS]: Abilities.MAGIC_GUARD,
  [Species.CASTFORM]: Abilities.ADAPTABILITY,
  [Species.KECLEON]: Abilities.ADAPTABILITY,
  [Species.SHUPPET]: Abilities.MUMMY,
  [Species.DUSKULL]: Abilities.UNNERVE,
  [Species.TROPIUS]: Abilities.CUD_CHEW,
  [Species.ABSOL]: Abilities.DARK_AURA,
  [Species.WYNAUT]: Abilities.STAMINA,
  [Species.SNORUNT]: Abilities.SNOW_WARNING,
  [Species.SPHEAL]: Abilities.SLUSH_RUSH,
  [Species.CLAMPERL]: Abilities.SIMPLE,
  [Species.RELICANTH]: Abilities.SOLID_ROCK,
  [Species.LUVDISC]: Abilities.PICKUP,
  [Species.BAGON]: Abilities.ADAPTABILITY,
  [Species.BELDUM]: Abilities.LEVITATE,
  [Species.REGIROCK]: Abilities.SAND_STREAM,
  [Species.REGICE]: Abilities.SNOW_WARNING,
  [Species.REGISTEEL]: Abilities.FILTER,
  [Species.LATIAS]: Abilities.SOUL_HEART,
  [Species.LATIOS]: Abilities.TINTED_LENS,
  [Species.KYOGRE]: Abilities.HYDRATION,
  [Species.GROUDON]: Abilities.PROTOSYNTHESIS,
  [Species.RAYQUAZA]: Abilities.UNNERVE,
  [Species.JIRACHI]: Abilities.COMATOSE,
  [Species.DEOXYS]: Abilities.PROTEAN,
  [Species.TURTWIG]: Abilities.THICK_FAT,
  [Species.CHIMCHAR]: Abilities.MOXIE,
  [Species.PIPLUP]: Abilities.LIGHTNING_ROD,
  [Species.STARLY]: Abilities.ROCK_HEAD,
  [Species.BIDOOF]: Abilities.NEUROFORCE,
  [Species.KRICKETOT]: Abilities.SOUNDPROOF,
  [Species.SHINX]: Abilities.VOLT_ABSORB,
  [Species.BUDEW]: Abilities.CUTE_CHARM,
  [Species.CRANIDOS]: Abilities.ROCK_HEAD,
  [Species.SHIELDON]: Abilities.SOLID_ROCK,
  [Species.BURMY]: Abilities.STURDY,
  [Species.COMBEE]: Abilities.QUEENLY_MAJESTY,
  [Species.PACHIRISU]: Abilities.BALL_FETCH,
  [Species.BUIZEL]: Abilities.HYDRATION,
  [Species.CHERUBI]: Abilities.DROUGHT,
  [Species.SHELLOS]: Abilities.SHELL_ARMOR,
  [Species.DRIFLOON]: Abilities.PICKPOCKET,
  [Species.BUNEARY]: Abilities.OBLIVIOUS,
  [Species.GLAMEOW]: Abilities.PICKUP,
  [Species.CHINGLING]: Abilities.VICTORY_STAR,
  [Species.STUNKY]: Abilities.MERCILESS,
  [Species.BRONZOR]: Abilities.SOUNDPROOF,
  [Species.BONSLY]: Abilities.SAP_SIPPER,
  [Species.MIME_JR]: Abilities.MAGIC_BOUNCE,
  [Species.HAPPINY]: Abilities.TRIAGE,
  [Species.CHATOT]: Abilities.PUNK_ROCK,
  [Species.SPIRITOMB]: Abilities.REGENERATOR,
  [Species.GIBLE]: Abilities.SAND_STREAM,
  [Species.MUNCHLAX]: Abilities.CUD_CHEW,
  [Species.RIOLU]: Abilities.MINDS_EYE,
  [Species.HIPPOPOTAS]: Abilities.SAND_VEIL,
  [Species.SKORUPI]: Abilities.SUPER_LUCK,
  [Species.CROAGUNK]: Abilities.PICKPOCKET,
  [Species.CARNIVINE]: Abilities.EFFECT_SPORE,
  [Species.FINNEON]: Abilities.DRIZZLE,
  [Species.MANTYKE]: Abilities.STORM_DRAIN,
  [Species.SNOVER]: Abilities.SNOW_CLOAK,
  [Species.ROTOM]: Abilities.HADRON_ENGINE,
  [Species.UXIE]: Abilities.UNAWARE,
  [Species.MESPRIT]: Abilities.MOODY,
  [Species.AZELF]: Abilities.NEUROFORCE,
  [Species.DIALGA]: Abilities.SPEED_BOOST,
  [Species.PALKIA]: Abilities.MULTISCALE,
  [Species.HEATRAN]: Abilities.FILTER,
  [Species.REGIGIGAS]: Abilities.MINDS_EYE,
  [Species.GIRATINA]: Abilities.SHADOW_SHIELD,
  [Species.CRESSELIA]: Abilities.MAGIC_BOUNCE,
  [Species.PHIONE]: Abilities.SIMPLE,
  [Species.MANAPHY]: Abilities.SIMPLE,
  [Species.DARKRAI]: Abilities.UNNERVE,
  [Species.SHAYMIN]: Abilities.FLOWER_VEIL,
  [Species.ARCEUS]: Abilities.ADAPTABILITY,
  [Species.VICTINI]: Abilities.SUPER_LUCK,
  [Species.SNIVY]: Abilities.MULTISCALE,
  [Species.TEPIG]: Abilities.ROCK_HEAD,
  [Species.OSHAWOTT]: Abilities.INTREPID_SWORD,
  [Species.PATRAT]: Abilities.STAKEOUT,
  [Species.LILLIPUP]: Abilities.BALL_FETCH,
  [Species.PURRLOIN]: Abilities.DEFIANT,
  [Species.PANSAGE]: Abilities.SAP_SIPPER,
  [Species.PANSEAR]: Abilities.FLASH_FIRE,
  [Species.PANPOUR]: Abilities.STORM_DRAIN,
  [Species.MUNNA]: Abilities.NEUTRALIZING_GAS,
  [Species.PIDOVE]: Abilities.OPPORTUNIST,
  [Species.BLITZLE]: Abilities.FLARE_BOOST,
  [Species.ROGGENROLA]: Abilities.SOLID_ROCK,
  [Species.WOOBAT]: Abilities.SOUL_HEART,
  [Species.DRILBUR]: Abilities.SAND_STREAM,
  [Species.AUDINO]: Abilities.FRIEND_GUARD,
  [Species.TIMBURR]: Abilities.STAMINA,
  [Species.TYMPOLE]: Abilities.MOODY,
  [Species.THROH]: Abilities.SIMPLE,
  [Species.SAWK]: Abilities.DEFIANT,
  [Species.SEWADDLE]: Abilities.SHARPNESS,
  [Species.VENIPEDE]: Abilities.INTIMIDATE,
  [Species.COTTONEE]: Abilities.FLUFFY,
  [Species.PETILIL]: Abilities.DANCER,
  [Species.BASCULIN]: Abilities.OPPORTUNIST,
  [Species.SANDILE]: Abilities.STRONG_JAW,
  [Species.DARUMAKA]: Abilities.IRON_FIST,
  [Species.MARACTUS]: Abilities.IRON_BARBS,
  [Species.DWEBBLE]: Abilities.STAMINA,
  [Species.SCRAGGY]: Abilities.ROCK_HEAD,
  [Species.SIGILYPH]: Abilities.MAGICIAN,
  [Species.YAMASK]: Abilities.PURIFYING_SALT,
  [Species.TIRTOUGA]: Abilities.SHELL_ARMOR,
  [Species.ARCHEN]: Abilities.ROCKY_PAYLOAD,
  [Species.TRUBBISH]: Abilities.GOOEY,
  [Species.ZORUA]: Abilities.DARK_AURA,
  [Species.MINCCINO]: Abilities.SCRAPPY,
  [Species.GOTHITA]: Abilities.PRESSURE,
  [Species.SOLOSIS]: Abilities.GOOEY,
  [Species.DUCKLETT]: Abilities.GALE_WINGS,
  [Species.VANILLITE]: Abilities.REFRIGERATE,
  [Species.DEERLING]: Abilities.JUSTIFIED,
  [Species.EMOLGA]: Abilities.WIND_POWER,
  [Species.KARRABLAST]: Abilities.MIRROR_ARMOR,
  [Species.FOONGUS]: Abilities.MYCELIUM_MIGHT,
  [Species.FRILLISH]: Abilities.MUMMY,
  [Species.ALOMOMOLA]: Abilities.MULTISCALE,
  [Species.JOLTIK]: Abilities.VOLT_ABSORB,
  [Species.FERROSEED]: Abilities.ROUGH_SKIN,
  [Species.KLINK]: Abilities.STEELWORKER,
  [Species.TYNAMO]: Abilities.SWIFT_SWIM,
  [Species.ELGYEM]: Abilities.SHADOW_TAG,
  [Species.LITWICK]: Abilities.SOUL_HEART,
  [Species.AXEW]: Abilities.DRAGONS_MAW,
  [Species.CUBCHOO]: Abilities.INTIMIDATE,
  [Species.CRYOGONAL]: Abilities.DAZZLING,
  [Species.SHELMET]: Abilities.SHED_SKIN,
  [Species.STUNFISK]: Abilities.STORM_DRAIN,
  [Species.MIENFOO]: Abilities.NO_GUARD,
  [Species.DRUDDIGON]: Abilities.INTIMIDATE,
  [Species.GOLETT]: Abilities.SHADOW_SHIELD,
  [Species.PAWNIARD]: Abilities.SHARPNESS,
  [Species.BOUFFALANT]: Abilities.THICK_FAT,
  [Species.RUFFLET]: Abilities.RECKLESS,
  [Species.VULLABY]: Abilities.THICK_FAT,
  [Species.HEATMOR]: Abilities.CONTRARY,
  [Species.DURANT]: Abilities.TOUGH_CLAWS,
  [Species.DEINO]: Abilities.PARENTAL_BOND,
  [Species.LARVESTA]: Abilities.DROUGHT,
  [Species.COBALION]: Abilities.INTREPID_SWORD,
  [Species.TERRAKION]: Abilities.ROCKY_PAYLOAD,
  [Species.VIRIZION]: Abilities.SHARPNESS,
  [Species.TORNADUS]: Abilities.DRIZZLE,
  [Species.THUNDURUS]: Abilities.DRIZZLE,
  [Species.RESHIRAM]: Abilities.ORICHALCUM_PULSE,
  [Species.ZEKROM]: Abilities.HADRON_ENGINE,
  [Species.LANDORUS]: Abilities.STORM_DRAIN,
  [Species.KYUREM]: Abilities.SNOW_WARNING,
  [Species.KELDEO]: Abilities.GRIM_NEIGH,
  [Species.MELOETTA]: Abilities.MINDS_EYE,
  [Species.GENESECT]: Abilities.REGENERATOR,
  [Species.CHESPIN]: Abilities.DAUNTLESS_SHIELD,
  [Species.FENNEKIN]: Abilities.PSYCHIC_SURGE,
  [Species.FROAKIE]: Abilities.ADAPTABILITY,
  [Species.BUNNELBY]: Abilities.GUTS,
  [Species.FLETCHLING]: Abilities.RECKLESS,
  [Species.SCATTERBUG]: Abilities.PRANKSTER,
  [Species.LITLEO]: Abilities.INTIMIDATE,
  [Species.FLABEBE]: Abilities.GRASSY_SURGE,
  [Species.SKIDDO]: Abilities.GRASSY_SURGE,
  [Species.PANCHAM]: Abilities.FLUFFY,
  [Species.FURFROU]: Abilities.BALL_FETCH,
  [Species.ESPURR]: Abilities.FUR_COAT,
  [Species.HONEDGE]: Abilities.SHARPNESS,
  [Species.SPRITZEE]: Abilities.MISTY_SURGE,
  [Species.SWIRLIX]: Abilities.WELL_BAKED_BODY,
  [Species.INKAY]: Abilities.SUPREME_OVERLORD,
  [Species.BINACLE]: Abilities.SOLID_ROCK,
  [Species.SKRELP]: Abilities.DRAGONS_MAW,
  [Species.CLAUNCHER]: Abilities.SWIFT_SWIM,
  [Species.HELIOPTILE]: Abilities.NO_GUARD,
  [Species.TYRUNT]: Abilities.RECKLESS,
  [Species.AMAURA]: Abilities.SERENE_GRACE,
  [Species.HAWLUCHA]: Abilities.RECKLESS,
  [Species.DEDENNE]: Abilities.SIMPLE,
  [Species.CARBINK]: Abilities.SOLID_ROCK,
  [Species.GOOMY]: Abilities.DRIZZLE,
  [Species.KLEFKI]: Abilities.TRIAGE,
  [Species.PHANTUMP]: Abilities.UNNERVE,
  [Species.PUMPKABOO]: Abilities.FLASH_FIRE,
  [Species.BERGMITE]: Abilities.MIRROR_ARMOR,
  [Species.NOIBAT]: Abilities.PUNK_ROCK,
  [Species.XERNEAS]: Abilities.MISTY_SURGE,
  [Species.YVELTAL]: Abilities.SOUL_HEART,
  [Species.ZYGARDE]: Abilities.HUGE_POWER,
  [Species.DIANCIE]: Abilities.LEVITATE,
  [Species.HOOPA]: Abilities.OPPORTUNIST,
  [Species.VOLCANION]: Abilities.FILTER,
  [Species.ROWLET]: Abilities.SNIPER,
  [Species.LITTEN]: Abilities.FUR_COAT,
  [Species.POPPLIO]: Abilities.PUNK_ROCK,
  [Species.PIKIPEK]: Abilities.ANGER_POINT,
  [Species.YUNGOOS]: Abilities.HUGE_POWER,
  [Species.GRUBBIN]: Abilities.SPEED_BOOST,
  [Species.CRABRAWLER]: Abilities.REFRIGERATE,
  [Species.ORICORIO]: Abilities.ADAPTABILITY,
  [Species.CUTIEFLY]: Abilities.FRIEND_GUARD,
  [Species.ROCKRUFF]: Abilities.ROCKY_PAYLOAD,
  [Species.WISHIWASHI]: Abilities.PARENTAL_BOND,
  [Species.MAREANIE]: Abilities.TOXIC_DEBRIS,
  [Species.MUDBRAY]: Abilities.CUD_CHEW,
  [Species.DEWPIDER]: Abilities.UNNERVE,
  [Species.FOMANTIS]: Abilities.SHARPNESS,
  [Species.MORELULL]: Abilities.PERISH_BODY,
  [Species.SALANDIT]: Abilities.DAZZLING,
  [Species.STUFFUL]: Abilities.HOSPITALITY,
  [Species.BOUNSWEET]: Abilities.RIPEN,
  [Species.COMFEY]: Abilities.FRIEND_GUARD,
  [Species.ORANGURU]: Abilities.HOSPITALITY,
  [Species.PASSIMIAN]: Abilities.COSTAR,
  [Species.WIMPOD]: Abilities.TINTED_LENS,
  [Species.SANDYGAST]: Abilities.SAND_STREAM,
  [Species.PYUKUMUKU]: Abilities.IRON_BARBS,
  [Species.TYPE_NULL]: Abilities.ADAPTABILITY,
  [Species.MINIOR]: Abilities.ANGER_SHELL,
  [Species.KOMALA]: Abilities.GUTS,
  [Species.TURTONATOR]: Abilities.ANGER_SHELL,
  [Species.TOGEDEMARU]: Abilities.STATIC,
  [Species.MIMIKYU]: Abilities.TOUGH_CLAWS,
  [Species.BRUXISH]: Abilities.MULTISCALE,
  [Species.DRAMPA]: Abilities.FLASH_FIRE,
  [Species.DHELMISE]: Abilities.INFILTRATOR,
  [Species.JANGMO_O]: Abilities.PUNK_ROCK,
  [Species.TAPU_KOKO]: Abilities.TRANSISTOR,
  [Species.TAPU_LELE]: Abilities.SHEER_FORCE,
  [Species.TAPU_BULU]: Abilities.GRASS_PELT,
  [Species.TAPU_FINI]: Abilities.FAIRY_AURA,
  [Species.COSMOG]: Abilities.BEAST_BOOST,
  [Species.NIHILEGO]: Abilities.LEVITATE,
  [Species.BUZZWOLE]: Abilities.MOXIE,
  [Species.PHEROMOSA]: Abilities.TINTED_LENS,
  [Species.XURKITREE]: Abilities.TRANSISTOR,
  [Species.CELESTEELA]: Abilities.HEATPROOF,
  [Species.KARTANA]: Abilities.SHARPNESS,
  [Species.GUZZLORD]: Abilities.INNARDS_OUT,
  [Species.NECROZMA]: Abilities.BEAST_BOOST,
  [Species.MAGEARNA]: Abilities.STEELY_SPIRIT,
  [Species.MARSHADOW]: Abilities.IRON_FIST,
  [Species.POIPOLE]: Abilities.SHEER_FORCE,
  [Species.STAKATAKA]: Abilities.SOLID_ROCK,
  [Species.BLACEPHALON]: Abilities.MAGIC_GUARD,
  [Species.ZERAORA]: Abilities.TOUGH_CLAWS,
  [Species.MELTAN]: Abilities.STEELY_SPIRIT,
  [Species.GROOKEY]: Abilities.GRASS_PELT,
  [Species.SCORBUNNY]: Abilities.VICTORY_STAR,
  [Species.SOBBLE]: Abilities.SUPER_LUCK,
  [Species.SKWOVET]: Abilities.HONEY_GATHER,
  [Species.ROOKIDEE]: Abilities.IRON_BARBS,
  [Species.BLIPBUG]: Abilities.PSYCHIC_SURGE,
  [Species.NICKIT]: Abilities.INTIMIDATE,
  [Species.GOSSIFLEUR]: Abilities.GRASSY_SURGE,
  [Species.WOOLOO]: Abilities.ROCK_HEAD,
  [Species.CHEWTLE]: Abilities.ROCK_HEAD,
  [Species.YAMPER]: Abilities.STAKEOUT,
  [Species.ROLYCOLY]: Abilities.EARTH_EATER,
  [Species.APPLIN]: Abilities.DRAGONS_MAW,
  [Species.SILICOBRA]: Abilities.SAND_RUSH,
  [Species.CRAMORANT]: Abilities.STORM_DRAIN,
  [Species.ARROKUDA]: Abilities.STRONG_JAW,
  [Species.TOXEL]: Abilities.GALVANIZE,
  [Species.SIZZLIPEDE]: Abilities.DEFIANT,
  [Species.CLOBBOPUS]: Abilities.SWIFT_SWIM,
  [Species.SINISTEA]: Abilities.WATER_ABSORB,
  [Species.HATENNA]: Abilities.MAGIC_GUARD,
  [Species.IMPIDIMP]: Abilities.TANGLING_HAIR,
  [Species.MILCERY]: Abilities.MISTY_SURGE,
  [Species.FALINKS]: Abilities.MOXIE,
  [Species.PINCURCHIN]: Abilities.IRON_BARBS,
  [Species.SNOM]: Abilities.SNOW_WARNING,
  [Species.STONJOURNER]: Abilities.SOLID_ROCK,
  [Species.EISCUE]: Abilities.SLUSH_RUSH,
  [Species.INDEEDEE]: Abilities.MAGIC_BOUNCE,
  [Species.MORPEKO]: Abilities.GLUTTONY,
  [Species.CUFANT]: Abilities.HEATPROOF,
  [Species.DRACOZOLT]: Abilities.SLUSH_RUSH,
  [Species.ARCTOZOLT]: Abilities.SAND_RUSH,
  [Species.DRACOVISH]: Abilities.HUSTLE,
  [Species.ARCTOVISH]: Abilities.STRONG_JAW,
  [Species.DURALUDON]: Abilities.DOWNLOAD,
  [Species.DREEPY]: Abilities.PARENTAL_BOND,
  [Species.ZACIAN]: Abilities.UNNERVE,
  [Species.ZAMAZENTA]: Abilities.STAMINA,
  [Species.ETERNATUS]: Abilities.SUPREME_OVERLORD,
  [Species.KUBFU]: Abilities.IRON_FIST,
  [Species.ZARUDE]: Abilities.GRASSY_SURGE,
  [Species.REGIELEKI]: Abilities.ELECTRIC_SURGE,
  [Species.REGIDRAGO]: Abilities.MULTISCALE,
  [Species.GLASTRIER]: Abilities.FILTER,
  [Species.SPECTRIER]: Abilities.SHADOW_SHIELD,
  [Species.CALYREX]: Abilities.HARVEST,
  [Species.ENAMORUS]: Abilities.FAIRY_AURA,
  [Species.SPRIGATITO]: Abilities.MAGICIAN,
  [Species.FUECOCO]: Abilities.PUNK_ROCK,
  [Species.QUAXLY]: Abilities.DEFIANT,
  [Species.LECHONK]: Abilities.SIMPLE,
  [Species.TAROUNTULA]: Abilities.PICKUP,
  [Species.NYMBLE]: Abilities.TECHNICIAN,
  [Species.PAWMI]: Abilities.FLUFFY,
  [Species.TANDEMAUS]: Abilities.PARENTAL_BOND,
  [Species.FIDOUGH]: Abilities.WATER_ABSORB,
  [Species.SMOLIV]: Abilities.RIPEN,
  [Species.SQUAWKABILLY]: Abilities.GALE_WINGS,
  [Species.NACLI]: Abilities.EARTH_EATER,
  [Species.CHARCADET]: Abilities.MIRROR_ARMOR,
  [Species.TADBULB]: Abilities.TRANSISTOR,
  [Species.WATTREL]: Abilities.GALE_WINGS,
  [Species.MASCHIFF]: Abilities.STRONG_JAW,
  [Species.SHROODLE]: Abilities.CORROSION,
  [Species.BRAMBLIN]: Abilities.WANDERING_SPIRIT,
  [Species.TOEDSCOOL]: Abilities.PRANKSTER,
  [Species.KLAWF]: Abilities.WATER_ABSORB,
  [Species.CAPSAKID]: Abilities.PARENTAL_BOND,
  [Species.RELLOR]: Abilities.MAGIC_GUARD,
  [Species.FLITTLE]: Abilities.COMPETITIVE,
  [Species.TINKATINK]: Abilities.HUGE_POWER,
  [Species.WIGLETT]: Abilities.STURDY,
  [Species.BOMBIRDIER]: Abilities.UNAWARE,
  [Species.FINIZEN]: Abilities.IRON_FIST,
  [Species.VAROOM]: Abilities.SPEED_BOOST,
  [Species.CYCLIZAR]: Abilities.PROTEAN,
  [Species.ORTHWORM]: Abilities.HEATPROOF,
  [Species.GLIMMET]: Abilities.SYMBIOSIS,
  [Species.GREAVARD]: Abilities.FUR_COAT,
  [Species.FLAMIGO]: Abilities.MOXIE,
  [Species.CETODDLE]: Abilities.GLUTTONY,
  [Species.VELUZA]: Abilities.SIMPLE,
  [Species.DONDOZO]: Abilities.GLUTTONY,
  [Species.TATSUGIRI]: Abilities.WATER_BUBBLE,
  [Species.GREAT_TUSK]: Abilities.INTIMIDATE,
  [Species.SCREAM_TAIL]: Abilities.UNAWARE,
  [Species.BRUTE_BONNET]: Abilities.BEAST_BOOST,
  [Species.FLUTTER_MANE]: Abilities.DAZZLING,
  [Species.SLITHER_WING]: Abilities.SCRAPPY,
  [Species.SANDY_SHOCKS]: Abilities.EARTH_EATER,
  [Species.IRON_TREADS]: Abilities.STEELY_SPIRIT,
  [Species.IRON_BUNDLE]: Abilities.SNOW_WARNING,
  [Species.IRON_HANDS]: Abilities.IRON_FIST,
  [Species.IRON_JUGULIS]: Abilities.AERILATE,
  [Species.IRON_MOTH]: Abilities.LEVITATE,
  [Species.IRON_THORNS]: Abilities.SAND_STREAM,
  [Species.FRIGIBAX]: Abilities.SNOW_WARNING,
  [Species.GIMMIGHOUL]: Abilities.SUPER_LUCK,
  [Species.WO_CHIEN]: Abilities.GRASSY_SURGE,
  [Species.CHIEN_PAO]: Abilities.INTREPID_SWORD,
  [Species.TING_LU]: Abilities.STAMINA,
  [Species.CHI_YU]: Abilities.DROUGHT,
  [Species.ROARING_MOON]: Abilities.TOUGH_CLAWS,
  [Species.IRON_VALIANT]: Abilities.DOWNLOAD,
  [Species.KORAIDON]: Abilities.PROTOSYNTHESIS,
  [Species.MIRAIDON]: Abilities.QUARK_DRIVE,
  [Species.WALKING_WAKE]: Abilities.BEAST_BOOST,
  [Species.IRON_LEAVES]: Abilities.SHARPNESS,
  [Species.POLTCHAGEIST]: Abilities.FLAME_BODY,
  [Species.OKIDOGI]: Abilities.FUR_COAT,
  [Species.MUNKIDORI]: Abilities.NEUROFORCE,
  [Species.FEZANDIPITI]: Abilities.LEVITATE,
  [Species.OGERPON]: Abilities.OPPORTUNIST,
  [Species.GOUGING_FIRE]: Abilities.BEAST_BOOST,
  [Species.RAGING_BOLT]: Abilities.BEAST_BOOST,
  [Species.IRON_BOULDER]: Abilities.SHARPNESS,
  [Species.IRON_CROWN]: Abilities.SHARPNESS,
  [Species.TERAPAGOS]: Abilities.REGENERATOR,
  [Species.PECHARUNT]: Abilities.TOXIC_CHAIN,
  [Species.ALOLA_RATTATA]: Abilities.CHEEK_POUCH,
  [Species.ALOLA_SANDSHREW]: Abilities.ICE_BODY,
  [Species.ALOLA_VULPIX]: Abilities.ICE_BODY,
  [Species.ALOLA_DIGLETT]: Abilities.STURDY,
  [Species.ALOLA_MEOWTH]: Abilities.UNNERVE,
  [Species.ALOLA_GEODUDE]: Abilities.ELECTROMORPHOSIS,
  [Species.ALOLA_GRIMER]: Abilities.MERCILESS,
  [Species.ETERNAL_FLOETTE]: Abilities.MAGIC_GUARD,
  [Species.GALAR_MEOWTH]: Abilities.SUPER_LUCK,
  [Species.GALAR_PONYTA]: Abilities.PIXILATE,
  [Species.GALAR_SLOWPOKE]: Abilities.POISON_TOUCH,
  [Species.GALAR_FARFETCHD]: Abilities.SUPER_LUCK,
  [Species.GALAR_ARTICUNO]: Abilities.SERENE_GRACE,
  [Species.GALAR_ZAPDOS]: Abilities.TOUGH_CLAWS,
  [Species.GALAR_MOLTRES]: Abilities.DARK_AURA,
  [Species.GALAR_CORSOLA]: Abilities.SHADOW_TAG,
  [Species.GALAR_ZIGZAGOON]: Abilities.PICKPOCKET,
  [Species.GALAR_DARUMAKA]: Abilities.FLASH_FIRE,
  [Species.GALAR_YAMASK]: Abilities.SOLID_ROCK,
  [Species.GALAR_STUNFISK]: Abilities.IRON_BARBS,
  [Species.HISUI_GROWLITHE]: Abilities.STRONG_JAW,
  [Species.HISUI_VOLTORB]: Abilities.HADRON_ENGINE,
  [Species.HISUI_QWILFISH]: Abilities.MERCILESS,
  [Species.HISUI_SNEASEL]: Abilities.SCRAPPY,
  [Species.HISUI_ZORUA]: Abilities.ADAPTABILITY,
  [Species.PALDEA_TAUROS]: Abilities.RATTLED,
  [Species.PALDEA_WOOPER]: Abilities.THICK_FAT,
  [Species.BLOODMOON_URSALUNA]: Abilities.BERSERK
};

// TODO: Remove
{
  //setTimeout(() => {
  /*for (let tc of Object.keys(trainerConfigs)) {
      console.log(TrainerType[tc], !trainerConfigs[tc].speciesFilter ? 'all' : [...new Set(allSpecies.filter(s => s.generation <= 9).filter(trainerConfigs[tc].speciesFilter).map(s => {
        while (pokemonPrevolutions.hasOwnProperty(s.speciesId))
				  s = getPokemonSpecies(pokemonPrevolutions[s.speciesId]);
        return s;
      }))].map(s => s.name));
    }

    const speciesFilter = (species: PokemonSpecies) => !species.legendary && !species.pseudoLegendary && !species.mythical && species.baseTotal >= 540;
    console.log(!speciesFilter ? 'all' : [...new Set(allSpecies.filter(s => s.generation <= 9).filter(speciesFilter).map(s => {
      while (pokemonPrevolutions.hasOwnProperty(s.speciesId))
        s = getPokemonSpecies(pokemonPrevolutions[s.speciesId]);
      return s;
    }))].map(s => s.name));*/
  //}, 1000);
}
