import { Abilities } from './ability';
import BattleScene from '../battle-scene';
import { GrowthRate } from './exp';
import { SpeciesWildEvolutionDelay, pokemonEvolutions, pokemonPrevolutions } from './pokemon-evolutions';
import { Species } from './species';
import { Type } from './type';
import * as Utils from '../utils';
import { TrainerType, trainerConfigs } from './trainer-type';

export function getPokemonSpecies(species: Species): PokemonSpecies {
  if (species >= Species.XERNEAS)
    return allSpecies.find(s => s.speciesId === species);
  return allSpecies[species - 1];
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
  public growthRate: GrowthRate;
  public eggType1: string;
  public eggType2: string;
  public malePercent: number;
  public eggCycles: integer;
  public genderDiffs: boolean;

  constructor(type1: Type, type2: Type, height: number, weight: number, ability1: Abilities, ability2: Abilities, abilityHidden: Abilities,
    baseTotal: integer, baseHp: integer, baseAtk: integer, baseDef: integer, baseSpatk: integer, baseSpdef: integer, baseSpd: integer,
    catchRate: integer, baseFriendship: integer, baseExp: integer, growthRate: GrowthRate, eggType1: string, eggType2: string, malePercent: number,
    eggCycles: integer, genderDiffs: boolean) {
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
      this.growthRate = growthRate;
      this.eggType1 = eggType1;
      this.eggType2 = eggType2;
      this.malePercent = malePercent;
      this.eggCycles = eggCycles;
      this.genderDiffs = genderDiffs;
  }

  isOfType(type: integer): boolean {
    return this.type1 === type || (this.type2 !== null && this.type2 === type);
  }

  getAbilityCount(): integer {
    return this.ability2 ? this.abilityHidden ? 3 : 2 : this.abilityHidden ? 2 : 1;
  }

  getAbility(abilityIndex: integer): Abilities {
    return !abilityIndex ? this.ability1 : abilityIndex === 1 && this.ability2 ? this.ability2 : this.abilityHidden
  }

  isObtainable() {
    return this.generation <= 5;
  }

  getSpriteAtlasPath(female: boolean, formIndex?: integer, shiny?: boolean): string {
    return this.getSpriteId(female, formIndex, shiny).replace(/\_{2}/g, '/');
  }

  getSpriteId(female: boolean, formIndex?: integer, shiny?: boolean): string {
    if (formIndex === undefined || this instanceof PokemonForm)
      formIndex = this.formIndex;

    const formSpriteKey = this.getFormSpriteKey(formIndex);
    return `${shiny ? 'shiny__' : ''}${this.genderDiffs && female ? 'female__' : ''}${this.speciesId}${formSpriteKey ? `-${formSpriteKey}` : ''}`;
  }

  getSpriteKey(female: boolean, formIndex?: integer, shiny?: boolean): string {
    return `pkmn__${this.getSpriteId(female, formIndex, shiny)}`;
  }

  abstract getFormSpriteKey(formIndex?: integer): string;

  getIconAtlasKey(): string {
    return `pokemon_icons_${Math.min(this.generation, 6)}`;
  }

  getIconId(female: boolean, formIndex?: integer): string {
    if (formIndex === undefined)
      formIndex = this.formIndex;

    let ret = `${Utils.padInt(this.speciesId, 3)}`;
    
    switch (this.speciesId) {
      case Species.UNOWN:
      case Species.BURMY:
      case Species.WORMADAM:
      case Species.SHELLOS:
      case Species.GASTRODON:
      case Species.GIRATINA:
      case Species.SHAYMIN:
      case Species.BASCULIN:
      case Species.DEERLING:
      case Species.SAWSBUCK:
      case Species.TORNADUS:
      case Species.THUNDURUS:
      case Species.LANDORUS:
      case Species.KELDEO:
      case Species.MELOETTA:
        ret += this.getFormSpriteKey(formIndex).replace(/-/g, '');
        break;
      case Species.UNFEZANT:
      case Species.FRILLISH:
      case Species.JELLICENT:
        ret += !female ? 'm' : 'f';
        break;
      
    }

    return ret;
  }

  getIconKey(female: boolean, formIndex?: integer): string {
    return `pkmn_icon__${this.getIconId(female, formIndex)}`;
  }

  getCryKey(formIndex?: integer): string {
    let ret = this.speciesId.toString();
    const forms = getPokemonSpecies(this.speciesId).forms;
    if (forms.length && forms[formIndex || 0].formKey === 'mega')
      ret += '-mega';
    return ret;
  }

  loadAssets(scene: BattleScene, female: boolean, formIndex?: integer, shiny?: boolean, startLoad?: boolean): Promise<void> {
    return new Promise(resolve => {
      scene.load.audio(this.speciesId.toString(), `audio/cry/${this.getCryKey(formIndex)}.mp3`);
      scene.loadAtlas(this.getSpriteKey(female, formIndex, shiny), 'pokemon', this.getSpriteAtlasPath(female, formIndex, shiny));
      scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
        const originalWarn = console.warn;
        // Ignore warnings for missing frames, because there will be a lot
        console.warn = () => {};
        const frameNames = scene.anims.generateFrameNames(this.getSpriteKey(female, formIndex, shiny), { zeroPad: 4, suffix: ".png", start: 1, end: 256 });
        console.warn = originalWarn;
        scene.anims.create({
          key: this.getSpriteKey(female, formIndex, shiny),
          frames: frameNames,
          frameRate: 12,
          repeat: -1
        });
        resolve();
      });
      if (startLoad) {
        if (!scene.load.isLoading())
          scene.load.start();
      } else
        resolve();
    });
  }

  generateIconAnim(scene: BattleScene, female: boolean, formIndex: integer): void {
    const frameNames = scene.anims.generateFrameNames(this.getIconAtlasKey(), { prefix: `${this.getIconId(female, formIndex)}_`, zeroPad: 2, suffix: '.png', start: 1, end: 34 });
    scene.anims.create({
      key: this.getIconKey(female, formIndex),
      frames: frameNames,
      frameRate: 128,
      repeat: -1
    });
  }

  cry(scene: BattleScene, soundConfig?: Phaser.Types.Sound.SoundConfig): integer {
    scene.sound.play(this.speciesId.toString(), soundConfig);
    return scene.sound.get(this.speciesId.toString()).totalDuration * 1000;
  }
}

export default class PokemonSpecies extends PokemonSpeciesForm {
  public name: string;
  public pseudoLegendary: boolean;
  public legendary: boolean;
  public mythical: boolean;
  public species: string;
  public canChangeForm: boolean;
  public forms: PokemonForm[];

  constructor(id: Species, name: string, generation: integer, pseudoLegendary: boolean, legendary: boolean, mythical: boolean, species: string,
    type1: Type, type2: Type, height: number, weight: number, ability1: Abilities, ability2: Abilities, abilityHidden: Abilities,
    baseTotal: integer, baseHp: integer, baseAtk: integer, baseDef: integer, baseSpatk: integer, baseSpdef: integer, baseSpd: integer,
    catchRate: integer, baseFriendship: integer, baseExp: integer, growthRate: GrowthRate, eggType1: string, eggType2: string, malePercent: number,
    eggCycles: integer, genderDiffs: boolean, canChangeForm?: boolean, ...forms: PokemonForm[]) {
    super(type1, type2, height, weight, ability1, ability2, abilityHidden, baseTotal, baseHp, baseAtk, baseDef, baseSpatk, baseSpdef, baseSpd,
      catchRate, baseFriendship, baseExp, growthRate, eggType1, eggType2, malePercent, eggCycles, genderDiffs);
    this.speciesId = id;
    this.formIndex = 0;
    this.name = name;
    this.generation = generation;
    this.pseudoLegendary = pseudoLegendary;
    this.legendary = legendary;
    this.mythical = mythical;
    this.species = species;
    this.canChangeForm = !!canChangeForm;
    this.forms = forms;

    forms.forEach((form, f) => {
      form.speciesId = id;
      form.formIndex = f;
      form.generation = generation;
    });
  }

  getSpeciesForLevel(level: integer, allowEvolving?: boolean): Species {
    const prevolutionLevels = this.getPrevolutionLevels();

    if (prevolutionLevels.length) {
      for (let pl = prevolutionLevels.length - 1; pl >= 0; pl--) {
        const prevolutionLevel = prevolutionLevels[pl];
        if (level < prevolutionLevel[1])
          return prevolutionLevel[0];
      }
    }

    if (!allowEvolving || !pokemonEvolutions.hasOwnProperty(this.speciesId))
      return this.speciesId;

    const evolutions = pokemonEvolutions[this.speciesId];

    const easeInFunc = Phaser.Tweens.Builders.GetEaseFunction('Sine.easeIn');
    const easeOutFunc = Phaser.Tweens.Builders.GetEaseFunction('Sine.easeOut');

    const evolutionPool: Map<number, Species> = new Map();
    let totalWeight = 0;
    let noEvolutionChance = 1;

    for (let ev of evolutions) {
      if (ev.level > level)
        continue;

      let evolutionChance: number;
      
      if (ev.wildDelay === SpeciesWildEvolutionDelay.NONE)
        evolutionChance = Math.min(0.5 + easeInFunc((level - ev.level) / 40) / 2, 1);
      else {
        let preferredMinLevel = ev.wildDelay * 10;
        let evolutionLevel = ev.level > 1 ? ev.level : 0;

        if (!evolutionLevel && pokemonPrevolutions.hasOwnProperty(this.speciesId)) {
          const prevolutionLevel = pokemonEvolutions[pokemonPrevolutions[this.speciesId]].find(ev => ev.speciesId === this.speciesId).level;
          if (prevolutionLevel > 1)
            evolutionLevel = prevolutionLevel;
        }

        evolutionChance = Math.min(0.65 * easeInFunc((Math.min(Math.max(level - evolutionLevel, 0), preferredMinLevel) / preferredMinLevel)) + 0.35 * easeOutFunc(Math.min(level - evolutionLevel, preferredMinLevel * 2.5) / (preferredMinLevel * 2.5)), 1);
      }

      if (evolutionChance > 0) {
        totalWeight += evolutionChance;

        evolutionPool.set(totalWeight, ev.speciesId);
        
        if ((1 - evolutionChance) < noEvolutionChance)
          noEvolutionChance = 1 - evolutionChance;
      }
    }

    if (noEvolutionChance === 1 || Math.random() < noEvolutionChance)
      return this.speciesId;
      
    const randValue = evolutionPool.size === 1 ? 0 : Math.random() * totalWeight;

    for (let weight of evolutionPool.keys()) {
      if (randValue < weight)
        return getPokemonSpecies(evolutionPool.get(weight)).getSpeciesForLevel(level, true);
    }

    return this.speciesId;
  }

  getEvolutionLevels() {
    const evolutionLevels = [];

    //console.log(Species[this.speciesId], pokemonEvolutions[this.speciesId])

    if (pokemonEvolutions.hasOwnProperty(this.speciesId)) {
      for (let e of pokemonEvolutions[this.speciesId]) {
        const speciesId = e.speciesId;
        const level = e.level;
        evolutionLevels.push([ speciesId, level ]);
        //console.log(Species[speciesId], getPokemonSpecies(speciesId), getPokemonSpecies(speciesId).getEvolutionLevels());
        const nextEvolutionLevels = getPokemonSpecies(speciesId).getEvolutionLevels();
        for (let npl of nextEvolutionLevels)
          evolutionLevels.push(npl);
      }
    }

    return evolutionLevels;
  }

  getPrevolutionLevels() {
    const prevolutionLevels = [];

    const allEvolvingPokemon = Object.keys(pokemonEvolutions);
    for (let p of allEvolvingPokemon) {
      for (let e of pokemonEvolutions[p]) {
        if (e.speciesId === this.speciesId) {
          const speciesId = parseInt(p) as Species;
          let level = e.level;
          prevolutionLevels.push([ speciesId, level ]);
          const subPrevolutionLevels = getPokemonSpecies(speciesId).getPrevolutionLevels();
          for (let spl of subPrevolutionLevels)
            prevolutionLevels.push(spl);
        }
      }
    }

    return prevolutionLevels;
  }

  getFormSpriteKey(formIndex?: integer) {
    return this.forms?.length
      ? this.forms[formIndex || 0].formKey
      : '';
  }
}

class PokemonForm extends PokemonSpeciesForm {
  public formName: string;
  public formKey: string;

  constructor(formName: string, formKey: string, type1: Type, type2: Type, height: number, weight: number, ability1: Abilities, ability2: Abilities, abilityHidden: Abilities,
    baseTotal: integer, baseHp: integer, baseAtk: integer, baseDef: integer, baseSpatk: integer, baseSpdef: integer, baseSpd: integer,
    catchRate: integer, baseFriendship: integer, baseExp: integer, growthRate: GrowthRate, eggType1: string, eggType2: string, malePercent: number,
    eggCycles: integer, genderDiffs: boolean, canChangeForm?: boolean, ...forms: PokemonForm[]) {
    super(type1, type2, height, weight, ability1, ability2, abilityHidden, baseTotal, baseHp, baseAtk, baseDef, baseSpatk, baseSpdef, baseSpd,
      catchRate, baseFriendship, baseExp, growthRate, eggType1, eggType2, malePercent, eggCycles, genderDiffs);
    this.formName = formName;
    this.formKey = formKey;
  }

  getFormSpriteKey(_formIndex?: integer) {
    return this.formKey;
  }
}

export const allSpecies: PokemonSpecies[] = [];

export function initSpecies() {
  allSpecies.push(
    new PokemonSpecies(Species.BULBASAUR, "Bulbasaur", 1, false, false, false, "Seed Pokémon", Type.GRASS, Type.POISON, 0.7, 6.9, Abilities.OVERGROW, Abilities.NONE, Abilities.CHLOROPHYLL, 318, 45, 49, 49, 65, 65, 45, 45, 70, 64, GrowthRate.MEDIUM_SLOW, "Grass", "Monster", 87.5, 20, false),
    new PokemonSpecies(Species.IVYSAUR, "Ivysaur", 1, false, false, false, "Seed Pokémon", Type.GRASS, Type.POISON, 1, 13, Abilities.OVERGROW, Abilities.NONE, Abilities.CHLOROPHYLL, 405, 60, 62, 63, 80, 80, 60, 45, 70, 142, GrowthRate.MEDIUM_SLOW, "Grass", "Monster", 87.5, 20, false),
    new PokemonSpecies(Species.VENUSAUR, "Venusaur", 1, false, false, false, "Seed Pokémon", Type.GRASS, Type.POISON, 2, 100, Abilities.OVERGROW, Abilities.NONE, Abilities.CHLOROPHYLL, 525, 80, 82, 83, 100, 100, 80, 45, 70, 236, GrowthRate.MEDIUM_SLOW, "Grass", "Monster", 87.5, 20, false),
    new PokemonSpecies(Species.CHARMANDER, "Charmander", 1, false, false, false, "Lizard Pokémon", Type.FIRE, null, 0.6, 8.5, Abilities.BLAZE, Abilities.NONE, Abilities.SOLAR_POWER, 309, 39, 52, 43, 60, 50, 65, 45, 70, 62, GrowthRate.MEDIUM_SLOW, "Dragon", "Monster", 87.5, 20, false),
    new PokemonSpecies(Species.CHARMELEON, "Charmeleon", 1, false, false, false, "Flame Pokémon", Type.FIRE, null, 1.1, 19, Abilities.BLAZE, Abilities.NONE, Abilities.SOLAR_POWER, 405, 58, 64, 58, 80, 65, 80, 45, 70, 142, GrowthRate.MEDIUM_SLOW, "Dragon", "Monster", 87.5, 20, false),
    new PokemonSpecies(Species.CHARIZARD, "Charizard", 1, false, false, false, "Flame Pokémon", Type.FIRE, Type.FLYING, 1.7, 90.5, Abilities.BLAZE, Abilities.NONE, Abilities.SOLAR_POWER, 534, 78, 84, 78, 109, 85, 100, 45, 70, 240, GrowthRate.MEDIUM_SLOW, "Dragon", "Monster", 87.5, 20, false),
    new PokemonSpecies(Species.SQUIRTLE, "Squirtle", 1, false, false, false, "Tiny Turtle Pokémon", Type.WATER, null, 0.5, 9, Abilities.TORRENT, Abilities.NONE, Abilities.RAIN_DISH, 314, 44, 48, 65, 50, 64, 43, 45, 70, 63, GrowthRate.MEDIUM_SLOW, "Monster", "Water 1", 87.5, 20, false),
    new PokemonSpecies(Species.WARTORTLE, "Wartortle", 1, false, false, false, "Turtle Pokémon", Type.WATER, null, 1, 22.5, Abilities.TORRENT, Abilities.NONE, Abilities.RAIN_DISH, 405, 59, 63, 80, 65, 80, 58, 45, 70, 142, GrowthRate.MEDIUM_SLOW, "Monster", "Water 1", 87.5, 20, false),
    new PokemonSpecies(Species.BLASTOISE, "Blastoise", 1, false, false, false, "Shellfish Pokémon", Type.WATER, null, 1.6, 85.5, Abilities.TORRENT, Abilities.NONE, Abilities.RAIN_DISH, 530, 79, 83, 100, 85, 105, 78, 45, 70, 239, GrowthRate.MEDIUM_SLOW, "Monster", "Water 1", 87.5, 20, false),
    new PokemonSpecies(Species.CATERPIE, "Caterpie", 1, false, false, false, "Worm Pokémon", Type.BUG, null, 0.3, 2.9, Abilities.SHIELD_DUST, Abilities.NONE, Abilities.RUN_AWAY, 195, 45, 30, 35, 20, 20, 45, 255, 70, 39, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 15, false),
    new PokemonSpecies(Species.METAPOD, "Metapod", 1, false, false, false, "Cocoon Pokémon", Type.BUG, null, 0.7, 9.9, Abilities.SHED_SKIN, Abilities.NONE, Abilities.NONE, 205, 50, 20, 55, 25, 25, 30, 120, 70, 72, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 15, false),
    new PokemonSpecies(Species.BUTTERFREE, "Butterfree", 1, false, false, false, "Butterfly Pokémon", Type.BUG, Type.FLYING, 1.1, 32, Abilities.COMPOUND_EYES, Abilities.NONE, Abilities.TINTED_LENS, 395, 60, 45, 50, 90, 80, 70, 45, 70, 178, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 15, true),
    new PokemonSpecies(Species.WEEDLE, "Weedle", 1, false, false, false, "Hairy Bug Pokémon", Type.BUG, Type.POISON, 0.3, 3.2, Abilities.SHIELD_DUST, Abilities.NONE, Abilities.RUN_AWAY, 195, 40, 35, 30, 20, 20, 50, 255, 70, 39, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 15, false),
    new PokemonSpecies(Species.KAKUNA, "Kakuna", 1, false, false, false, "Cocoon Pokémon", Type.BUG, Type.POISON, 0.6, 10, Abilities.SHED_SKIN, Abilities.NONE, Abilities.NONE, 205, 45, 25, 50, 25, 25, 35, 120, 70, 72, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 15, false),
    new PokemonSpecies(Species.BEEDRILL, "Beedrill", 1, false, false, false, "Poison Bee Pokémon", Type.BUG, Type.POISON, 1, 29.5, Abilities.SWARM, Abilities.NONE, Abilities.SNIPER, 395, 65, 90, 40, 45, 80, 75, 45, 70, 178, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 15, false),
    new PokemonSpecies(Species.PIDGEY, "Pidgey", 1, false, false, false, "Tiny Bird Pokémon", Type.NORMAL, Type.FLYING, 0.3, 1.8, Abilities.KEEN_EYE, Abilities.TANGLED_FEET, Abilities.BIG_PECKS, 251, 40, 45, 40, 35, 35, 56, 255, 70, 50, GrowthRate.MEDIUM_SLOW, "Flying", null, 50, 15, false),
    new PokemonSpecies(Species.PIDGEOTTO, "Pidgeotto", 1, false, false, false, "Bird Pokémon", Type.NORMAL, Type.FLYING, 1.1, 30, Abilities.KEEN_EYE, Abilities.TANGLED_FEET, Abilities.BIG_PECKS, 349, 63, 60, 55, 50, 50, 71, 120, 70, 122, GrowthRate.MEDIUM_SLOW, "Flying", null, 50, 15, false),
    new PokemonSpecies(Species.PIDGEOT, "Pidgeot", 1, false, false, false, "Bird Pokémon", Type.NORMAL, Type.FLYING, 1.5, 39.5, Abilities.KEEN_EYE, Abilities.TANGLED_FEET, Abilities.BIG_PECKS, 479, 83, 80, 75, 70, 70, 101, 45, 70, 216, GrowthRate.MEDIUM_SLOW, "Flying", null, 50, 15, false),
    new PokemonSpecies(Species.RATTATA, "Rattata", 1, false, false, false, "Mouse Pokémon", Type.NORMAL, null, 0.3, 3.5, Abilities.RUN_AWAY, Abilities.GUTS, Abilities.HUSTLE, 253, 30, 56, 35, 25, 35, 72, 255, 70, 51, GrowthRate.MEDIUM_FAST, "Field", null, 50, 15, true),
    new PokemonSpecies(Species.RATICATE, "Raticate", 1, false, false, false, "Mouse Pokémon", Type.NORMAL, null, 0.7, 18.5, Abilities.RUN_AWAY, Abilities.GUTS, Abilities.HUSTLE, 413, 55, 81, 60, 50, 70, 97, 127, 70, 145, GrowthRate.MEDIUM_FAST, "Field", null, 50, 15, true),
    new PokemonSpecies(Species.SPEAROW, "Spearow", 1, false, false, false, "Tiny Bird Pokémon", Type.NORMAL, Type.FLYING, 0.3, 2, Abilities.KEEN_EYE, Abilities.NONE, Abilities.SNIPER, 262, 40, 60, 30, 31, 31, 70, 255, 70, 52, GrowthRate.MEDIUM_FAST, "Flying", null, 50, 15, false),
    new PokemonSpecies(Species.FEAROW, "Fearow", 1, false, false, false, "Beak Pokémon", Type.NORMAL, Type.FLYING, 1.2, 38, Abilities.KEEN_EYE, Abilities.NONE, Abilities.SNIPER, 442, 65, 90, 65, 61, 61, 100, 90, 70, 155, GrowthRate.MEDIUM_FAST, "Flying", null, 50, 15, false),
    new PokemonSpecies(Species.EKANS, "Ekans", 1, false, false, false, "Snake Pokémon", Type.POISON, null, 2, 6.9, Abilities.INTIMIDATE, Abilities.SHED_SKIN, Abilities.UNNERVE, 288, 35, 60, 44, 40, 54, 55, 255, 70, 58, GrowthRate.MEDIUM_FAST, "Dragon", "Field", 50, 20, false),
    new PokemonSpecies(Species.ARBOK, "Arbok", 1, false, false, false, "Cobra Pokémon", Type.POISON, null, 3.5, 65, Abilities.INTIMIDATE, Abilities.SHED_SKIN, Abilities.UNNERVE, 448, 60, 95, 69, 65, 79, 80, 90, 70, 157, GrowthRate.MEDIUM_FAST, "Dragon", "Field", 50, 20, false),
    new PokemonSpecies(Species.PIKACHU, "Pikachu", 1, false, false, false, "Mouse Pokémon", Type.ELECTRIC, null, 0.4, 6, Abilities.STATIC, Abilities.NONE, Abilities.LIGHTNING_ROD, 320, 35, 55, 40, 50, 50, 90, 190, 70, 112, GrowthRate.MEDIUM_FAST, "Fairy", "Field", 50, 10, true),
    new PokemonSpecies(Species.RAICHU, "Raichu", 1, false, false, false, "Mouse Pokémon", Type.ELECTRIC, null, 0.8, 30, Abilities.STATIC, Abilities.NONE, Abilities.LIGHTNING_ROD, 485, 60, 90, 55, 90, 80, 110, 75, 70, 218, GrowthRate.MEDIUM_FAST, "Fairy", "Field", 50, 10, true),
    new PokemonSpecies(Species.SANDSHREW, "Sandshrew", 1, false, false, false, "Mouse Pokémon", Type.GROUND, null, 0.6, 12, Abilities.SAND_VEIL, Abilities.NONE, Abilities.SAND_RUSH, 300, 50, 75, 85, 20, 30, 40, 255, 70, 60, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.SANDSLASH, "Sandslash", 1, false, false, false, "Mouse Pokémon", Type.GROUND, null, 1, 29.5, Abilities.SAND_VEIL, Abilities.NONE, Abilities.SAND_RUSH, 450, 75, 100, 110, 45, 55, 65, 90, 70, 158, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.NIDORAN_F, "Nidoran♀", 1, false, false, false, "Poison Pin Pokémon", Type.POISON, null, 0.4, 7, Abilities.POISON_POINT, Abilities.RIVALRY, Abilities.HUSTLE, 275, 55, 47, 52, 40, 40, 41, 235, 70, 55, GrowthRate.MEDIUM_SLOW, "Field", "Monster", 0, 20, false),
    new PokemonSpecies(Species.NIDORINA, "Nidorina", 1, false, false, false, "Poison Pin Pokémon", Type.POISON, null, 0.8, 20, Abilities.POISON_POINT, Abilities.RIVALRY, Abilities.HUSTLE, 365, 70, 62, 67, 55, 55, 56, 120, 70, 128, GrowthRate.MEDIUM_SLOW, "Undiscovered", null, 0, 20, false),
    new PokemonSpecies(Species.NIDOQUEEN, "Nidoqueen", 1, false, false, false, "Drill Pokémon", Type.POISON, Type.GROUND, 1.3, 60, Abilities.POISON_POINT, Abilities.RIVALRY, Abilities.SHEER_FORCE, 505, 90, 92, 87, 75, 85, 76, 45, 70, 227, GrowthRate.MEDIUM_SLOW, "Undiscovered", null, 0, 20, false),
    new PokemonSpecies(Species.NIDORAN_M, "Nidoran♂", 1, false, false, false, "Poison Pin Pokémon", Type.POISON, null, 0.5, 9, Abilities.POISON_POINT, Abilities.RIVALRY, Abilities.HUSTLE, 273, 46, 57, 40, 40, 40, 50, 235, 70, 55, GrowthRate.MEDIUM_SLOW, "Field", "Monster", 100, 20, false),
    new PokemonSpecies(Species.NIDORINO, "Nidorino", 1, false, false, false, "Poison Pin Pokémon", Type.POISON, null, 0.9, 19.5, Abilities.POISON_POINT, Abilities.RIVALRY, Abilities.HUSTLE, 365, 61, 72, 57, 55, 55, 65, 120, 70, 128, GrowthRate.MEDIUM_SLOW, "Field", "Monster", 100, 20, false),
    new PokemonSpecies(Species.NIDOKING, "Nidoking", 1, false, false, false, "Drill Pokémon", Type.POISON, Type.GROUND, 1.4, 62, Abilities.POISON_POINT, Abilities.RIVALRY, Abilities.SHEER_FORCE, 505, 81, 102, 77, 85, 75, 85, 45, 70, 227, GrowthRate.MEDIUM_SLOW, "Field", "Monster", 100, 20, false),
    new PokemonSpecies(Species.CLEFAIRY, "Clefairy", 1, false, false, false, "Fairy Pokémon", Type.FAIRY, null, 0.6, 7.5, Abilities.CUTE_CHARM, Abilities.MAGIC_GUARD, Abilities.FRIEND_GUARD, 323, 70, 45, 48, 60, 65, 35, 150, 140, 113, GrowthRate.FAST, "Fairy", null, 25, 10, false),
    new PokemonSpecies(Species.CLEFABLE, "Clefable", 1, false, false, false, "Fairy Pokémon", Type.FAIRY, null, 1.3, 40, Abilities.CUTE_CHARM, Abilities.MAGIC_GUARD, Abilities.UNAWARE, 483, 95, 70, 73, 95, 90, 60, 25, 140, 217, GrowthRate.FAST, "Fairy", null, 25, 10, false),
    new PokemonSpecies(Species.VULPIX, "Vulpix", 1, false, false, false, "Fox Pokémon", Type.FIRE, null, 0.6, 9.9, Abilities.FLASH_FIRE, Abilities.NONE, Abilities.DROUGHT, 299, 38, 41, 40, 50, 65, 65, 190, 70, 60, GrowthRate.MEDIUM_FAST, "Field", null, 25, 20, false),
    new PokemonSpecies(Species.NINETALES, "Ninetales", 1, false, false, false, "Fox Pokémon", Type.FIRE, null, 1.1, 19.9, Abilities.FLASH_FIRE, Abilities.NONE, Abilities.DROUGHT, 505, 73, 76, 75, 81, 100, 100, 75, 70, 177, GrowthRate.MEDIUM_FAST, "Field", null, 25, 20, false),
    new PokemonSpecies(Species.JIGGLYPUFF, "Jigglypuff", 1, false, false, false, "Balloon Pokémon", Type.NORMAL, Type.FAIRY, 0.5, 5.5, Abilities.CUTE_CHARM, Abilities.COMPETITIVE, Abilities.FRIEND_GUARD, 270, 115, 45, 20, 45, 25, 20, 170, 70, 95, GrowthRate.FAST, "Fairy", null, 25, 10, false),
    new PokemonSpecies(Species.WIGGLYTUFF, "Wigglytuff", 1, false, false, false, "Balloon Pokémon", Type.NORMAL, Type.FAIRY, 1, 12, Abilities.CUTE_CHARM, Abilities.COMPETITIVE, Abilities.FRISK, 435, 140, 70, 45, 85, 50, 45, 50, 70, 196, GrowthRate.FAST, "Fairy", null, 25, 10, false),
    new PokemonSpecies(Species.ZUBAT, "Zubat", 1, false, false, false, "Bat Pokémon", Type.POISON, Type.FLYING, 0.8, 7.5, Abilities.INNER_FOCUS, Abilities.NONE, Abilities.INFILTRATOR, 245, 40, 45, 35, 30, 40, 55, 255, 70, 49, GrowthRate.MEDIUM_FAST, "Flying", null, 50, 15, true),
    new PokemonSpecies(Species.GOLBAT, "Golbat", 1, false, false, false, "Bat Pokémon", Type.POISON, Type.FLYING, 1.6, 55, Abilities.INNER_FOCUS, Abilities.NONE, Abilities.INFILTRATOR, 455, 75, 80, 70, 65, 75, 90, 90, 70, 159, GrowthRate.MEDIUM_FAST, "Flying", null, 50, 15, true),
    new PokemonSpecies(Species.ODDISH, "Oddish", 1, false, false, false, "Weed Pokémon", Type.GRASS, Type.POISON, 0.5, 5.4, Abilities.CHLOROPHYLL, Abilities.NONE, Abilities.RUN_AWAY, 320, 45, 50, 55, 75, 65, 30, 255, 70, 64, GrowthRate.MEDIUM_SLOW, "Grass", null, 50, 20, false),
    new PokemonSpecies(Species.GLOOM, "Gloom", 1, false, false, false, "Weed Pokémon", Type.GRASS, Type.POISON, 0.8, 8.6, Abilities.CHLOROPHYLL, Abilities.NONE, Abilities.STENCH, 395, 60, 65, 70, 85, 75, 40, 120, 70, 138, GrowthRate.MEDIUM_SLOW, "Grass", null, 50, 20, true),
    new PokemonSpecies(Species.VILEPLUME, "Vileplume", 1, false, false, false, "Flower Pokémon", Type.GRASS, Type.POISON, 1.2, 18.6, Abilities.CHLOROPHYLL, Abilities.NONE, Abilities.EFFECT_SPORE, 490, 75, 80, 85, 110, 90, 50, 45, 70, 221, GrowthRate.MEDIUM_SLOW, "Grass", null, 50, 20, true),
    new PokemonSpecies(Species.PARAS, "Paras", 1, false, false, false, "Mushroom Pokémon", Type.BUG, Type.GRASS, 0.3, 5.4, Abilities.EFFECT_SPORE, Abilities.DRY_SKIN, Abilities.DAMP, 285, 35, 70, 55, 45, 55, 25, 190, 70, 57, GrowthRate.MEDIUM_FAST, "Bug", "Grass", 50, 20, false),
    new PokemonSpecies(Species.PARASECT, "Parasect", 1, false, false, false, "Mushroom Pokémon", Type.BUG, Type.GRASS, 1, 29.5, Abilities.EFFECT_SPORE, Abilities.DRY_SKIN, Abilities.DAMP, 405, 60, 95, 80, 60, 80, 30, 75, 70, 142, GrowthRate.MEDIUM_FAST, "Bug", "Grass", 50, 20, false),
    new PokemonSpecies(Species.VENONAT, "Venonat", 1, false, false, false, "Insect Pokémon", Type.BUG, Type.POISON, 1, 30, Abilities.COMPOUND_EYES, Abilities.TINTED_LENS, Abilities.RUN_AWAY, 305, 60, 55, 50, 40, 55, 45, 190, 70, 61, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 20, false),
    new PokemonSpecies(Species.VENOMOTH, "Venomoth", 1, false, false, false, "Poison Moth Pokémon", Type.BUG, Type.POISON, 1.5, 12.5, Abilities.SHIELD_DUST, Abilities.TINTED_LENS, Abilities.WONDER_SKIN, 450, 70, 65, 60, 90, 75, 90, 75, 70, 158, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 20, false),
    new PokemonSpecies(Species.DIGLETT, "Diglett", 1, false, false, false, "Mole Pokémon", Type.GROUND, null, 0.2, 0.8, Abilities.SAND_VEIL, Abilities.ARENA_TRAP, Abilities.SAND_FORCE, 265, 10, 55, 25, 35, 45, 95, 255, 70, 53, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.DUGTRIO, "Dugtrio", 1, false, false, false, "Mole Pokémon", Type.GROUND, null, 0.7, 33.3, Abilities.SAND_VEIL, Abilities.ARENA_TRAP, Abilities.SAND_FORCE, 425, 35, 100, 50, 50, 70, 120, 50, 70, 149, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.MEOWTH, "Meowth", 1, false, false, false, "Scratch Cat Pokémon", Type.NORMAL, null, 0.4, 4.2, Abilities.PICKUP, Abilities.TECHNICIAN, Abilities.UNNERVE, 290, 40, 45, 35, 40, 40, 90, 255, 70, 58, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.PERSIAN, "Persian", 1, false, false, false, "Classy Cat Pokémon", Type.NORMAL, null, 1, 32, Abilities.LIMBER, Abilities.TECHNICIAN, Abilities.UNNERVE, 440, 65, 70, 60, 65, 65, 115, 90, 70, 154, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.PSYDUCK, "Psyduck", 1, false, false, false, "Duck Pokémon", Type.WATER, null, 0.8, 19.6, Abilities.DAMP, Abilities.CLOUD_NINE, Abilities.SWIFT_SWIM, 320, 50, 52, 48, 65, 50, 55, 190, 70, 64, GrowthRate.MEDIUM_FAST, "Field", "Water 1", 50, 20, false),
    new PokemonSpecies(Species.GOLDUCK, "Golduck", 1, false, false, false, "Duck Pokémon", Type.WATER, null, 1.7, 76.6, Abilities.DAMP, Abilities.CLOUD_NINE, Abilities.SWIFT_SWIM, 500, 80, 82, 78, 95, 80, 85, 75, 70, 175, GrowthRate.MEDIUM_FAST, "Field", "Water 1", 50, 20, false),
    new PokemonSpecies(Species.MANKEY, "Mankey", 1, false, false, false, "Pig Monkey Pokémon", Type.FIGHTING, null, 0.5, 28, Abilities.VITAL_SPIRIT, Abilities.ANGER_POINT, Abilities.DEFIANT, 305, 40, 80, 35, 35, 45, 70, 190, 70, 61, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.PRIMEAPE, "Primeape", 1, false, false, false, "Pig Monkey Pokémon", Type.FIGHTING, null, 1, 32, Abilities.VITAL_SPIRIT, Abilities.ANGER_POINT, Abilities.DEFIANT, 455, 65, 105, 60, 60, 70, 95, 75, 70, 159, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.GROWLITHE, "Growlithe", 1, false, false, false, "Puppy Pokémon", Type.FIRE, null, 0.7, 19, Abilities.INTIMIDATE, Abilities.FLASH_FIRE, Abilities.JUSTIFIED, 350, 55, 70, 45, 70, 50, 60, 190, 70, 70, GrowthRate.SLOW, "Field", null, 75, 20, false),
    new PokemonSpecies(Species.ARCANINE, "Arcanine", 1, false, false, false, "Legendary Pokémon", Type.FIRE, null, 1.9, 155, Abilities.INTIMIDATE, Abilities.FLASH_FIRE, Abilities.JUSTIFIED, 555, 90, 110, 80, 100, 80, 95, 75, 70, 194, GrowthRate.SLOW, "Field", null, 75, 20, false),
    new PokemonSpecies(Species.POLIWAG, "Poliwag", 1, false, false, false, "Tadpole Pokémon", Type.WATER, null, 0.6, 12.4, Abilities.WATER_ABSORB, Abilities.DAMP, Abilities.SWIFT_SWIM, 300, 40, 50, 40, 40, 40, 90, 255, 70, 60, GrowthRate.MEDIUM_SLOW, "Water 1", null, 50, 20, false),
    new PokemonSpecies(Species.POLIWHIRL, "Poliwhirl", 1, false, false, false, "Tadpole Pokémon", Type.WATER, null, 1, 20, Abilities.WATER_ABSORB, Abilities.DAMP, Abilities.SWIFT_SWIM, 385, 65, 65, 65, 50, 50, 90, 120, 70, 135, GrowthRate.MEDIUM_SLOW, "Water 1", null, 50, 20, false),
    new PokemonSpecies(Species.POLIWRATH, "Poliwrath", 1, false, false, false, "Tadpole Pokémon", Type.WATER, Type.FIGHTING, 1.3, 54, Abilities.WATER_ABSORB, Abilities.DAMP, Abilities.SWIFT_SWIM, 510, 90, 95, 95, 70, 90, 70, 45, 70, 230, GrowthRate.MEDIUM_SLOW, "Water 1", null, 50, 20, false),
    new PokemonSpecies(Species.ABRA, "Abra", 1, false, false, false, "Psi Pokémon", Type.PSYCHIC, null, 0.9, 19.5, Abilities.SYNCHRONIZE, Abilities.INNER_FOCUS, Abilities.MAGIC_GUARD, 310, 25, 20, 15, 105, 55, 90, 200, 70, 62, GrowthRate.MEDIUM_SLOW, "Human-Like", null, 75, 20, false),
    new PokemonSpecies(Species.KADABRA, "Kadabra", 1, false, false, false, "Psi Pokémon", Type.PSYCHIC, null, 1.3, 56.5, Abilities.SYNCHRONIZE, Abilities.INNER_FOCUS, Abilities.MAGIC_GUARD, 400, 40, 35, 30, 120, 70, 105, 100, 70, 140, GrowthRate.MEDIUM_SLOW, "Human-Like", null, 75, 20, true),
    new PokemonSpecies(Species.ALAKAZAM, "Alakazam", 1, false, false, false, "Psi Pokémon", Type.PSYCHIC, null, 1.5, 48, Abilities.SYNCHRONIZE, Abilities.INNER_FOCUS, Abilities.MAGIC_GUARD, 500, 55, 50, 45, 135, 95, 120, 50, 70, 225, GrowthRate.MEDIUM_SLOW, "Human-Like", null, 75, 20, true),
    new PokemonSpecies(Species.MACHOP, "Machop", 1, false, false, false, "Superpower Pokémon", Type.FIGHTING, null, 0.8, 19.5, Abilities.GUTS, Abilities.NO_GUARD, Abilities.STEADFAST, 305, 70, 80, 50, 35, 35, 35, 180, 70, 61, GrowthRate.MEDIUM_SLOW, "Human-Like", null, 75, 20, false),
    new PokemonSpecies(Species.MACHOKE, "Machoke", 1, false, false, false, "Superpower Pokémon", Type.FIGHTING, null, 1.5, 70.5, Abilities.GUTS, Abilities.NO_GUARD, Abilities.STEADFAST, 405, 80, 100, 70, 50, 60, 45, 90, 70, 142, GrowthRate.MEDIUM_SLOW, "Human-Like", null, 75, 20, false),
    new PokemonSpecies(Species.MACHAMP, "Machamp", 1, false, false, false, "Superpower Pokémon", Type.FIGHTING, null, 1.6, 130, Abilities.GUTS, Abilities.NO_GUARD, Abilities.STEADFAST, 505, 90, 130, 80, 65, 85, 55, 45, 70, 227, GrowthRate.MEDIUM_SLOW, "Human-Like", null, 75, 20, false),
    new PokemonSpecies(Species.BELLSPROUT, "Bellsprout", 1, false, false, false, "Flower Pokémon", Type.GRASS, Type.POISON, 0.7, 4, Abilities.CHLOROPHYLL, Abilities.NONE, Abilities.GLUTTONY, 300, 50, 75, 35, 70, 30, 40, 255, 70, 60, GrowthRate.MEDIUM_SLOW, "Grass", null, 50, 20, false),
    new PokemonSpecies(Species.WEEPINBELL, "Weepinbell", 1, false, false, false, "Flycatcher Pokémon", Type.GRASS, Type.POISON, 1, 6.4, Abilities.CHLOROPHYLL, Abilities.NONE, Abilities.GLUTTONY, 390, 65, 90, 50, 85, 45, 55, 120, 70, 137, GrowthRate.MEDIUM_SLOW, "Grass", null, 50, 20, false),
    new PokemonSpecies(Species.VICTREEBEL, "Victreebel", 1, false, false, false, "Flycatcher Pokémon", Type.GRASS, Type.POISON, 1.7, 15.5, Abilities.CHLOROPHYLL, Abilities.NONE, Abilities.GLUTTONY, 490, 80, 105, 65, 100, 70, 70, 45, 70, 221, GrowthRate.MEDIUM_SLOW, "Grass", null, 50, 20, false),
    new PokemonSpecies(Species.TENTACOOL, "Tentacool", 1, false, false, false, "Jellyfish Pokémon", Type.WATER, Type.POISON, 0.9, 45.5, Abilities.CLEAR_BODY, Abilities.LIQUID_OOZE, Abilities.RAIN_DISH, 335, 40, 40, 35, 50, 100, 70, 190, 70, 67, GrowthRate.SLOW, "Water 3", null, 50, 20, false),
    new PokemonSpecies(Species.TENTACRUEL, "Tentacruel", 1, false, false, false, "Jellyfish Pokémon", Type.WATER, Type.POISON, 1.6, 55, Abilities.CLEAR_BODY, Abilities.LIQUID_OOZE, Abilities.RAIN_DISH, 515, 80, 70, 65, 80, 120, 100, 60, 70, 180, GrowthRate.SLOW, "Water 3", null, 50, 20, false),
    new PokemonSpecies(Species.GEODUDE, "Geodude", 1, false, false, false, "Rock Pokémon", Type.ROCK, Type.GROUND, 0.4, 20, Abilities.ROCK_HEAD, Abilities.STURDY, Abilities.SAND_VEIL, 300, 40, 80, 100, 30, 30, 20, 255, 70, 60, GrowthRate.MEDIUM_SLOW, "Mineral", null, 50, 15, false),
    new PokemonSpecies(Species.GRAVELER, "Graveler", 1, false, false, false, "Rock Pokémon", Type.ROCK, Type.GROUND, 1, 105, Abilities.ROCK_HEAD, Abilities.STURDY, Abilities.SAND_VEIL, 390, 55, 95, 115, 45, 45, 35, 120, 70, 137, GrowthRate.MEDIUM_SLOW, "Mineral", null, 50, 15, false),
    new PokemonSpecies(Species.GOLEM, "Golem", 1, false, false, false, "Megaton Pokémon", Type.ROCK, Type.GROUND, 1.4, 300, Abilities.ROCK_HEAD, Abilities.STURDY, Abilities.SAND_VEIL, 495, 80, 120, 130, 55, 65, 45, 45, 70, 223, GrowthRate.MEDIUM_SLOW, "Mineral", null, 50, 15, false),
    new PokemonSpecies(Species.PONYTA, "Ponyta", 1, false, false, false, "Fire Horse Pokémon", Type.FIRE, null, 1, 30, Abilities.RUN_AWAY, Abilities.FLASH_FIRE, Abilities.FLAME_BODY, 410, 50, 85, 55, 65, 65, 90, 190, 70, 82, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.RAPIDASH, "Rapidash", 1, false, false, false, "Fire Horse Pokémon", Type.FIRE, null, 1.7, 95, Abilities.RUN_AWAY, Abilities.FLASH_FIRE, Abilities.FLAME_BODY, 500, 65, 100, 70, 80, 80, 105, 60, 70, 175, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.SLOWPOKE, "Slowpoke", 1, false, false, false, "Dopey Pokémon", Type.WATER, Type.PSYCHIC, 1.2, 36, Abilities.OBLIVIOUS, Abilities.OWN_TEMPO, Abilities.REGENERATOR, 315, 90, 65, 65, 40, 40, 15, 190, 70, 63, GrowthRate.MEDIUM_FAST, "Monster", "Water 1", 50, 20, false),
    new PokemonSpecies(Species.SLOWBRO, "Slowbro", 1, false, false, false, "Hermit Crab Pokémon", Type.WATER, Type.PSYCHIC, 1.6, 78.5, Abilities.OBLIVIOUS, Abilities.OWN_TEMPO, Abilities.REGENERATOR, 490, 95, 75, 110, 100, 80, 30, 75, 70, 172, GrowthRate.MEDIUM_FAST, "Monster", "Water 1", 50, 20, false),
    new PokemonSpecies(Species.MAGNEMITE, "Magnemite", 1, false, false, false, "Magnet Pokémon", Type.ELECTRIC, Type.STEEL, 0.3, 6, Abilities.MAGNET_PULL, Abilities.STURDY, Abilities.ANALYTIC, 325, 25, 35, 70, 95, 55, 45, 190, 70, 65, GrowthRate.MEDIUM_FAST, "Mineral", null, null, 20, false),
    new PokemonSpecies(Species.MAGNETON, "Magneton", 1, false, false, false, "Magnet Pokémon", Type.ELECTRIC, Type.STEEL, 1, 60, Abilities.MAGNET_PULL, Abilities.STURDY, Abilities.ANALYTIC, 465, 50, 60, 95, 120, 70, 70, 60, 70, 163, GrowthRate.MEDIUM_FAST, "Mineral", null, null, 20, false),
    new PokemonSpecies(Species.FARFETCHD, "Farfetch'd", 1, false, false, false, "Wild Duck Pokémon", Type.NORMAL, Type.FLYING, 0.8, 15, Abilities.KEEN_EYE, Abilities.INNER_FOCUS, Abilities.DEFIANT, 377, 52, 90, 55, 58, 62, 60, 45, 70, 132, GrowthRate.MEDIUM_FAST, "Field", "Flying", 50, 20, false),
    new PokemonSpecies(Species.DODUO, "Doduo", 1, false, false, false, "Twin Bird Pokémon", Type.NORMAL, Type.FLYING, 1.4, 39.2, Abilities.RUN_AWAY, Abilities.EARLY_BIRD, Abilities.TANGLED_FEET, 310, 35, 85, 45, 35, 35, 75, 190, 70, 62, GrowthRate.MEDIUM_FAST, "Flying", null, 50, 20, true),
    new PokemonSpecies(Species.DODRIO, "Dodrio", 1, false, false, false, "Triple Bird Pokémon", Type.NORMAL, Type.FLYING, 1.8, 85.2, Abilities.RUN_AWAY, Abilities.EARLY_BIRD, Abilities.TANGLED_FEET, 470, 60, 110, 70, 60, 60, 110, 45, 70, 165, GrowthRate.MEDIUM_FAST, "Flying", null, 50, 20, true),
    new PokemonSpecies(Species.SEEL, "Seel", 1, false, false, false, "Sea Lion Pokémon", Type.WATER, null, 1.1, 90, Abilities.THICK_FAT, Abilities.HYDRATION, Abilities.ICE_BODY, 325, 65, 45, 55, 45, 70, 45, 190, 70, 65, GrowthRate.MEDIUM_FAST, "Field", "Water 1", 50, 20, false),
    new PokemonSpecies(Species.DEWGONG, "Dewgong", 1, false, false, false, "Sea Lion Pokémon", Type.WATER, Type.ICE, 1.7, 120, Abilities.THICK_FAT, Abilities.HYDRATION, Abilities.ICE_BODY, 475, 90, 70, 80, 70, 95, 70, 75, 70, 166, GrowthRate.MEDIUM_FAST, "Field", "Water 1", 50, 20, false),
    new PokemonSpecies(Species.GRIMER, "Grimer", 1, false, false, false, "Sludge Pokémon", Type.POISON, null, 0.9, 30, Abilities.STENCH, Abilities.STICKY_HOLD, Abilities.POISON_TOUCH, 325, 80, 80, 50, 40, 50, 25, 190, 70, 65, GrowthRate.MEDIUM_FAST, "Amorphous", null, 50, 20, false),
    new PokemonSpecies(Species.MUK, "Muk", 1, false, false, false, "Sludge Pokémon", Type.POISON, null, 1.2, 30, Abilities.STENCH, Abilities.STICKY_HOLD, Abilities.POISON_TOUCH, 500, 105, 105, 75, 65, 100, 50, 75, 70, 175, GrowthRate.MEDIUM_FAST, "Amorphous", null, 50, 20, false),
    new PokemonSpecies(Species.SHELLDER, "Shellder", 1, false, false, false, "Bivalve Pokémon", Type.WATER, null, 0.3, 4, Abilities.SHELL_ARMOR, Abilities.SKILL_LINK, Abilities.OVERCOAT, 305, 30, 65, 100, 45, 25, 40, 190, 70, 61, GrowthRate.SLOW, "Water 3", null, 50, 20, false),
    new PokemonSpecies(Species.CLOYSTER, "Cloyster", 1, false, false, false, "Bivalve Pokémon", Type.WATER, Type.ICE, 1.5, 132.5, Abilities.SHELL_ARMOR, Abilities.SKILL_LINK, Abilities.OVERCOAT, 525, 50, 95, 180, 85, 45, 70, 60, 70, 184, GrowthRate.SLOW, "Water 3", null, 50, 20, false),
    new PokemonSpecies(Species.GASTLY, "Gastly", 1, false, false, false, "Gas Pokémon", Type.GHOST, Type.POISON, 1.3, 0.1, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 310, 30, 35, 30, 100, 35, 80, 190, 70, 62, GrowthRate.MEDIUM_SLOW, "Amorphous", null, 50, 20, false),
    new PokemonSpecies(Species.HAUNTER, "Haunter", 1, false, false, false, "Gas Pokémon", Type.GHOST, Type.POISON, 1.6, 0.1, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 405, 45, 50, 45, 115, 55, 95, 90, 70, 142, GrowthRate.MEDIUM_SLOW, "Amorphous", null, 50, 20, false),
    new PokemonSpecies(Species.GENGAR, "Gengar", 1, false, false, false, "Shadow Pokémon", Type.GHOST, Type.POISON, 1.5, 40.5, Abilities.CURSED_BODY, Abilities.NONE, Abilities.NONE, 500, 60, 65, 60, 130, 75, 110, 45, 70, 225, GrowthRate.MEDIUM_SLOW, "Amorphous", null, 50, 20, false),
    new PokemonSpecies(Species.ONIX, "Onix", 1, false, false, false, "Rock Snake Pokémon", Type.ROCK, Type.GROUND, 8.8, 210, Abilities.ROCK_HEAD, Abilities.STURDY, Abilities.WEAK_ARMOR, 385, 35, 45, 160, 30, 45, 70, 45, 70, 77, GrowthRate.MEDIUM_FAST, "Mineral", null, 50, 25, false),
    new PokemonSpecies(Species.DROWZEE, "Drowzee", 1, false, false, false, "Hypnosis Pokémon", Type.PSYCHIC, null, 1, 32.4, Abilities.INSOMNIA, Abilities.FOREWARN, Abilities.INNER_FOCUS, 328, 60, 48, 45, 43, 90, 42, 190, 70, 66, GrowthRate.MEDIUM_FAST, "Human-Like", null, 50, 20, false),
    new PokemonSpecies(Species.HYPNO, "Hypno", 1, false, false, false, "Hypnosis Pokémon", Type.PSYCHIC, null, 1.6, 75.6, Abilities.INSOMNIA, Abilities.FOREWARN, Abilities.INNER_FOCUS, 483, 85, 73, 70, 73, 115, 67, 75, 70, 169, GrowthRate.MEDIUM_FAST, "Human-Like", null, 50, 20, true),
    new PokemonSpecies(Species.KRABBY, "Krabby", 1, false, false, false, "River Crab Pokémon", Type.WATER, null, 0.4, 6.5, Abilities.HYPER_CUTTER, Abilities.SHELL_ARMOR, Abilities.SHEER_FORCE, 325, 30, 105, 90, 25, 25, 50, 225, 70, 65, GrowthRate.MEDIUM_FAST, "Water 3", null, 50, 20, false),
    new PokemonSpecies(Species.KINGLER, "Kingler", 1, false, false, false, "Pincer Pokémon", Type.WATER, null, 1.3, 60, Abilities.HYPER_CUTTER, Abilities.SHELL_ARMOR, Abilities.SHEER_FORCE, 475, 55, 130, 115, 50, 50, 75, 60, 70, 166, GrowthRate.MEDIUM_FAST, "Water 3", null, 50, 20, false),
    new PokemonSpecies(Species.VOLTORB, "Voltorb", 1, false, false, false, "Ball Pokémon", Type.ELECTRIC, null, 0.5, 10.4, Abilities.SOUNDPROOF, Abilities.STATIC, Abilities.AFTERMATH, 330, 40, 30, 50, 55, 55, 100, 190, 70, 66, GrowthRate.MEDIUM_FAST, "Mineral", null, null, 20, false),
    new PokemonSpecies(Species.ELECTRODE, "Electrode", 1, false, false, false, "Ball Pokémon", Type.ELECTRIC, null, 1.2, 66.6, Abilities.SOUNDPROOF, Abilities.STATIC, Abilities.AFTERMATH, 490, 60, 50, 70, 80, 80, 150, 60, 70, 172, GrowthRate.MEDIUM_FAST, "Mineral", null, null, 20, false),
    new PokemonSpecies(Species.EXEGGCUTE, "Exeggcute", 1, false, false, false, "Egg Pokémon", Type.GRASS, Type.PSYCHIC, 0.4, 2.5, Abilities.CHLOROPHYLL, Abilities.NONE, Abilities.HARVEST, 325, 60, 40, 80, 60, 45, 40, 90, 70, 65, GrowthRate.SLOW, "Grass", null, 50, 20, false),
    new PokemonSpecies(Species.EXEGGUTOR, "Exeggutor", 1, false, false, false, "Coconut Pokémon", Type.GRASS, Type.PSYCHIC, 2, 120, Abilities.CHLOROPHYLL, Abilities.NONE, Abilities.HARVEST, 530, 95, 95, 85, 125, 75, 55, 45, 70, 186, GrowthRate.SLOW, "Grass", null, 50, 20, false),
    new PokemonSpecies(Species.CUBONE, "Cubone", 1, false, false, false, "Lonely Pokémon", Type.GROUND, null, 0.4, 6.5, Abilities.ROCK_HEAD, Abilities.LIGHTNING_ROD, Abilities.BATTLE_ARMOR, 320, 50, 50, 95, 40, 50, 35, 190, 70, 64, GrowthRate.MEDIUM_FAST, "Monster", null, 50, 20, false),
    new PokemonSpecies(Species.MAROWAK, "Marowak", 1, false, false, false, "Bone Keeper Pokémon", Type.GROUND, null, 1, 45, Abilities.ROCK_HEAD, Abilities.LIGHTNING_ROD, Abilities.BATTLE_ARMOR, 425, 60, 80, 110, 50, 80, 45, 75, 70, 149, GrowthRate.MEDIUM_FAST, "Monster", null, 50, 20, false),
    new PokemonSpecies(Species.HITMONLEE, "Hitmonlee", 1, false, false, false, "Kicking Pokémon", Type.FIGHTING, null, 1.5, 49.8, Abilities.LIMBER, Abilities.RECKLESS, Abilities.UNBURDEN, 455, 50, 120, 53, 35, 110, 87, 45, 70, 159, GrowthRate.MEDIUM_FAST, "Human-Like", null, 100, 25, false),
    new PokemonSpecies(Species.HITMONCHAN, "Hitmonchan", 1, false, false, false, "Punching Pokémon", Type.FIGHTING, null, 1.4, 50.2, Abilities.KEEN_EYE, Abilities.IRON_FIST, Abilities.INNER_FOCUS, 455, 50, 105, 79, 35, 110, 76, 45, 70, 159, GrowthRate.MEDIUM_FAST, "Human-Like", null, 100, 25, false),
    new PokemonSpecies(Species.LICKITUNG, "Lickitung", 1, false, false, false, "Licking Pokémon", Type.NORMAL, null, 1.2, 65.5, Abilities.OWN_TEMPO, Abilities.OBLIVIOUS, Abilities.CLOUD_NINE, 385, 90, 55, 75, 60, 75, 30, 45, 70, 77, GrowthRate.MEDIUM_FAST, "Monster", null, 50, 20, false),
    new PokemonSpecies(Species.KOFFING, "Koffing", 1, false, false, false, "Poison Gas Pokémon", Type.POISON, null, 0.6, 1, Abilities.LEVITATE, Abilities.NEUTRALIZING_GAS, Abilities.STENCH, 340, 40, 65, 95, 60, 45, 35, 190, 70, 68, GrowthRate.MEDIUM_FAST, "Amorphous", null, 50, 20, false),
    new PokemonSpecies(Species.WEEZING, "Weezing", 1, false, false, false, "Poison Gas Pokémon", Type.POISON, null, 1.2, 9.5, Abilities.LEVITATE, Abilities.NEUTRALIZING_GAS, Abilities.STENCH, 490, 65, 90, 120, 85, 70, 60, 60, 70, 172, GrowthRate.MEDIUM_FAST, "Amorphous", null, 50, 20, false),
    new PokemonSpecies(Species.RHYHORN, "Rhyhorn", 1, false, false, false, "Spikes Pokémon", Type.GROUND, Type.ROCK, 1, 115, Abilities.LIGHTNING_ROD, Abilities.ROCK_HEAD, Abilities.RECKLESS, 345, 80, 85, 95, 30, 30, 25, 120, 70, 69, GrowthRate.SLOW, "Field", "Monster", 50, 20, true),
    new PokemonSpecies(Species.RHYDON, "Rhydon", 1, false, false, false, "Drill Pokémon", Type.GROUND, Type.ROCK, 1.9, 120, Abilities.LIGHTNING_ROD, Abilities.ROCK_HEAD, Abilities.RECKLESS, 485, 105, 130, 120, 45, 45, 40, 60, 70, 170, GrowthRate.SLOW, "Field", "Monster", 50, 20, true),
    new PokemonSpecies(Species.CHANSEY, "Chansey", 1, false, false, false, "Egg Pokémon", Type.NORMAL, null, 1.1, 34.6, Abilities.NATURAL_CURE, Abilities.SERENE_GRACE, Abilities.HEALER, 450, 250, 5, 5, 35, 105, 50, 30, 140, 395, GrowthRate.FAST, "Fairy", null, 0, 40, false),
    new PokemonSpecies(Species.TANGELA, "Tangela", 1, false, false, false, "Vine Pokémon", Type.GRASS, null, 1, 35, Abilities.CHLOROPHYLL, Abilities.LEAF_GUARD, Abilities.REGENERATOR, 435, 65, 55, 115, 100, 40, 60, 45, 70, 87, GrowthRate.MEDIUM_FAST, "Grass", null, 50, 20, false),
    new PokemonSpecies(Species.KANGASKHAN, "Kangaskhan", 1, false, false, false, "Parent Pokémon", Type.NORMAL, null, 2.2, 80, Abilities.EARLY_BIRD, Abilities.SCRAPPY, Abilities.INNER_FOCUS, 490, 105, 95, 80, 40, 80, 90, 45, 70, 172, GrowthRate.MEDIUM_FAST, "Monster", null, 0, 20, false),
    new PokemonSpecies(Species.HORSEA, "Horsea", 1, false, false, false, "Dragon Pokémon", Type.WATER, null, 0.4, 8, Abilities.SWIFT_SWIM, Abilities.SNIPER, Abilities.DAMP, 295, 30, 40, 70, 70, 25, 60, 225, 70, 59, GrowthRate.MEDIUM_FAST, "Dragon", "Water 1", 50, 20, false),
    new PokemonSpecies(Species.SEADRA, "Seadra", 1, false, false, false, "Dragon Pokémon", Type.WATER, null, 1.2, 25, Abilities.POISON_POINT, Abilities.SNIPER, Abilities.DAMP, 440, 55, 65, 95, 95, 45, 85, 75, 70, 154, GrowthRate.MEDIUM_FAST, "Dragon", "Water 1", 50, 20, false),
    new PokemonSpecies(Species.GOLDEEN, "Goldeen", 1, false, false, false, "Goldfish Pokémon", Type.WATER, null, 0.6, 15, Abilities.SWIFT_SWIM, Abilities.WATER_VEIL, Abilities.LIGHTNING_ROD, 320, 45, 67, 60, 35, 50, 63, 225, 70, 64, GrowthRate.MEDIUM_FAST, "Water 2", null, 50, 20, true),
    new PokemonSpecies(Species.SEAKING, "Seaking", 1, false, false, false, "Goldfish Pokémon", Type.WATER, null, 1.3, 39, Abilities.SWIFT_SWIM, Abilities.WATER_VEIL, Abilities.LIGHTNING_ROD, 450, 80, 92, 65, 65, 80, 68, 60, 70, 158, GrowthRate.MEDIUM_FAST, "Water 2", null, 50, 20, true),
    new PokemonSpecies(Species.STARYU, "Staryu", 1, false, false, false, "Star Shape Pokémon", Type.WATER, null, 0.8, 34.5, Abilities.ILLUMINATE, Abilities.NATURAL_CURE, Abilities.ANALYTIC, 340, 30, 45, 55, 70, 55, 85, 225, 70, 68, GrowthRate.SLOW, "Water 3", null, null, 20, false),
    new PokemonSpecies(Species.STARMIE, "Starmie", 1, false, false, false, "Mysterious Pokémon", Type.WATER, Type.PSYCHIC, 1.1, 80, Abilities.ILLUMINATE, Abilities.NATURAL_CURE, Abilities.ANALYTIC, 520, 60, 75, 85, 100, 85, 115, 60, 70, 182, GrowthRate.SLOW, "Water 3", null, null, 20, false),
    new PokemonSpecies(Species.MR_MIME, "Mr. Mime", 1, false, false, false, "Barrier Pokémon", Type.PSYCHIC, Type.FAIRY, 1.3, 54.5, Abilities.SOUNDPROOF, Abilities.FILTER, Abilities.TECHNICIAN, 460, 40, 45, 65, 100, 120, 90, 45, 70, 161, GrowthRate.MEDIUM_FAST, "Human-Like", null, 50, 25, false),
    new PokemonSpecies(Species.SCYTHER, "Scyther", 1, false, false, false, "Mantis Pokémon", Type.BUG, Type.FLYING, 1.5, 56, Abilities.SWARM, Abilities.TECHNICIAN, Abilities.STEADFAST, 500, 70, 110, 80, 55, 80, 105, 45, 70, 100, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 25, true),
    new PokemonSpecies(Species.JYNX, "Jynx", 1, false, false, false, "Human Shape Pokémon", Type.ICE, Type.PSYCHIC, 1.4, 40.6, Abilities.OBLIVIOUS, Abilities.FOREWARN, Abilities.DRY_SKIN, 455, 65, 50, 35, 115, 95, 95, 45, 70, 159, GrowthRate.MEDIUM_FAST, "Human-Like", null, 0, 25, false),
    new PokemonSpecies(Species.ELECTABUZZ, "Electabuzz", 1, false, false, false, "Electric Pokémon", Type.ELECTRIC, null, 1.1, 30, Abilities.STATIC, Abilities.NONE, Abilities.VITAL_SPIRIT, 490, 65, 83, 57, 95, 85, 105, 45, 70, 172, GrowthRate.MEDIUM_FAST, "Human-Like", null, 75, 25, false),
    new PokemonSpecies(Species.MAGMAR, "Magmar", 1, false, false, false, "Spitfire Pokémon", Type.FIRE, null, 1.3, 44.5, Abilities.FLAME_BODY, Abilities.NONE, Abilities.VITAL_SPIRIT, 495, 65, 95, 57, 100, 85, 93, 45, 70, 173, GrowthRate.MEDIUM_FAST, "Human-Like", null, 75, 25, false),
    new PokemonSpecies(Species.PINSIR, "Pinsir", 1, false, false, false, "Stag Beetle Pokémon", Type.BUG, null, 1.5, 55, Abilities.HYPER_CUTTER, Abilities.MOLD_BREAKER, Abilities.MOXIE, 500, 65, 125, 100, 55, 70, 85, 45, 70, 175, GrowthRate.SLOW, "Bug", null, 50, 25, false),
    new PokemonSpecies(Species.TAUROS, "Tauros", 1, false, false, false, "Wild Bull Pokémon", Type.NORMAL, null, 1.4, 88.4, Abilities.INTIMIDATE, Abilities.ANGER_POINT, Abilities.SHEER_FORCE, 490, 75, 100, 95, 40, 70, 110, 45, 70, 172, GrowthRate.SLOW, "Field", null, 100, 20, false),
    new PokemonSpecies(Species.MAGIKARP, "Magikarp", 1, false, false, false, "Fish Pokémon", Type.WATER, null, 0.9, 10, Abilities.SWIFT_SWIM, Abilities.NONE, Abilities.RATTLED, 200, 20, 10, 55, 15, 20, 80, 255, 70, 40, GrowthRate.SLOW, "Dragon", "Water 2", 50, 5, true),
    new PokemonSpecies(Species.GYARADOS, "Gyarados", 1, false, false, false, "Atrocious Pokémon", Type.WATER, Type.FLYING, 6.5, 235, Abilities.INTIMIDATE, Abilities.NONE, Abilities.MOXIE, 540, 95, 125, 79, 60, 100, 81, 45, 70, 189, GrowthRate.SLOW, "Dragon", "Water 2", 50, 5, true),
    new PokemonSpecies(Species.LAPRAS, "Lapras", 1, false, false, false, "Transport Pokémon", Type.WATER, Type.ICE, 2.5, 220, Abilities.WATER_ABSORB, Abilities.SHELL_ARMOR, Abilities.HYDRATION, 535, 130, 85, 80, 85, 95, 60, 45, 70, 187, GrowthRate.SLOW, "Monster", "Water 1", 50, 40, false),
    new PokemonSpecies(Species.DITTO, "Ditto", 1, false, false, false, "Transform Pokémon", Type.NORMAL, null, 0.3, 4, Abilities.LIMBER, Abilities.NONE, Abilities.IMPOSTER, 288, 48, 48, 48, 48, 48, 48, 35, 70, 101, GrowthRate.MEDIUM_FAST, "Ditto", null, null, 20, false),
    new PokemonSpecies(Species.EEVEE, "Eevee", 1, false, false, false, "Evolution Pokémon", Type.NORMAL, null, 0.3, 6.5, Abilities.RUN_AWAY, Abilities.ADAPTABILITY, Abilities.ANTICIPATION, 325, 55, 55, 50, 45, 65, 55, 45, 70, 65, GrowthRate.MEDIUM_FAST, "Field", null, 87.5, 35, false),
    new PokemonSpecies(Species.VAPOREON, "Vaporeon", 1, false, false, false, "Bubble Jet Pokémon", Type.WATER, null, 1, 29, Abilities.WATER_ABSORB, Abilities.NONE, Abilities.HYDRATION, 525, 130, 65, 60, 110, 95, 65, 45, 70, 184, GrowthRate.MEDIUM_FAST, "Field", null, 87.5, 35, false),
    new PokemonSpecies(Species.JOLTEON, "Jolteon", 1, false, false, false, "Lightning Pokémon", Type.ELECTRIC, null, 0.8, 24.5, Abilities.VOLT_ABSORB, Abilities.NONE, Abilities.QUICK_FEET, 525, 65, 65, 60, 110, 95, 130, 45, 70, 184, GrowthRate.MEDIUM_FAST, "Field", null, 87.5, 35, false),
    new PokemonSpecies(Species.FLAREON, "Flareon", 1, false, false, false, "Flame Pokémon", Type.FIRE, null, 0.9, 25, Abilities.FLASH_FIRE, Abilities.NONE, Abilities.GUTS, 525, 65, 130, 60, 95, 110, 65, 45, 70, 184, GrowthRate.MEDIUM_FAST, "Field", null, 87.5, 35, false),
    new PokemonSpecies(Species.PORYGON, "Porygon", 1, false, false, false, "Virtual Pokémon", Type.NORMAL, null, 0.8, 36.5, Abilities.TRACE, Abilities.DOWNLOAD, Abilities.ANALYTIC, 395, 65, 60, 70, 85, 75, 40, 45, 70, 79, GrowthRate.MEDIUM_FAST, "Mineral", null, null, 20, false),
    new PokemonSpecies(Species.OMANYTE, "Omanyte", 1, false, false, false, "Spiral Pokémon", Type.ROCK, Type.WATER, 0.4, 7.5, Abilities.SWIFT_SWIM, Abilities.SHELL_ARMOR, Abilities.WEAK_ARMOR, 355, 35, 40, 100, 90, 55, 35, 45, 70, 71, GrowthRate.MEDIUM_FAST, "Water 1", "Water 3", 87.5, 30, false),
    new PokemonSpecies(Species.OMASTAR, "Omastar", 1, false, false, false, "Spiral Pokémon", Type.ROCK, Type.WATER, 1, 35, Abilities.SWIFT_SWIM, Abilities.SHELL_ARMOR, Abilities.WEAK_ARMOR, 495, 70, 60, 125, 115, 70, 55, 45, 70, 173, GrowthRate.MEDIUM_FAST, "Water 1", "Water 3", 87.5, 30, false),
    new PokemonSpecies(Species.KABUTO, "Kabuto", 1, false, false, false, "Shellfish Pokémon", Type.ROCK, Type.WATER, 0.5, 11.5, Abilities.SWIFT_SWIM, Abilities.BATTLE_ARMOR, Abilities.WEAK_ARMOR, 355, 30, 80, 90, 55, 45, 55, 45, 70, 71, GrowthRate.MEDIUM_FAST, "Water 1", "Water 3", 87.5, 30, false),
    new PokemonSpecies(Species.KABUTOPS, "Kabutops", 1, false, false, false, "Shellfish Pokémon", Type.ROCK, Type.WATER, 1.3, 40.5, Abilities.SWIFT_SWIM, Abilities.BATTLE_ARMOR, Abilities.WEAK_ARMOR, 495, 60, 115, 105, 65, 70, 80, 45, 70, 173, GrowthRate.MEDIUM_FAST, "Water 1", "Water 3", 87.5, 30, false),
    new PokemonSpecies(Species.AERODACTYL, "Aerodactyl", 1, false, false, false, "Fossil Pokémon", Type.ROCK, Type.FLYING, 1.8, 59, Abilities.ROCK_HEAD, Abilities.PRESSURE, Abilities.UNNERVE, 515, 80, 105, 65, 60, 75, 130, 45, 70, 180, GrowthRate.SLOW, "Flying", null, 87.5, 35, false),
    new PokemonSpecies(Species.SNORLAX, "Snorlax", 1, false, false, false, "Sleeping Pokémon", Type.NORMAL, null, 2.1, 460, Abilities.IMMUNITY, Abilities.THICK_FAT, Abilities.GLUTTONY, 540, 160, 110, 65, 65, 110, 30, 25, 70, 189, GrowthRate.SLOW, "Monster", null, 87.5, 40, false),
    new PokemonSpecies(Species.ARTICUNO, "Articuno", 1, true, false, false, "Freeze Pokémon", Type.ICE, Type.FLYING, 1.7, 55.4, Abilities.PRESSURE, Abilities.NONE, Abilities.SNOW_CLOAK, 580, 90, 85, 100, 95, 125, 85, 3, 35, 261, GrowthRate.SLOW, "Undiscovered", null, null, 80, false),
    new PokemonSpecies(Species.ZAPDOS, "Zapdos", 1, true, false, false, "Electric Pokémon", Type.ELECTRIC, Type.FLYING, 1.6, 52.6, Abilities.PRESSURE, Abilities.NONE, Abilities.STATIC, 580, 90, 90, 85, 125, 90, 100, 3, 35, 261, GrowthRate.SLOW, "Undiscovered", null, null, 80, false),
    new PokemonSpecies(Species.MOLTRES, "Moltres", 1, true, false, false, "Flame Pokémon", Type.FIRE, Type.FLYING, 2, 60, Abilities.PRESSURE, Abilities.NONE, Abilities.FLAME_BODY, 580, 90, 100, 90, 125, 85, 90, 3, 35, 261, GrowthRate.SLOW, "Undiscovered", null, null, 80, false),
    new PokemonSpecies(Species.DRATINI, "Dratini", 1, false, false, false, "Dragon Pokémon", Type.DRAGON, null, 1.8, 3.3, Abilities.SHED_SKIN, Abilities.NONE, Abilities.MARVEL_SCALE, 300, 41, 64, 45, 50, 50, 50, 45, 35, 60, GrowthRate.SLOW, "Dragon", "Water 1", 50, 40, false),
    new PokemonSpecies(Species.DRAGONAIR, "Dragonair", 1, false, false, false, "Dragon Pokémon", Type.DRAGON, null, 4, 16.5, Abilities.SHED_SKIN, Abilities.NONE, Abilities.MARVEL_SCALE, 420, 61, 84, 65, 70, 70, 70, 45, 35, 147, GrowthRate.SLOW, "Dragon", "Water 1", 50, 40, false),
    new PokemonSpecies(Species.DRAGONITE, "Dragonite", 1, false, false, false, "Dragon Pokémon", Type.DRAGON, Type.FLYING, 2.2, 210, Abilities.INNER_FOCUS, Abilities.NONE, Abilities.MULTISCALE, 600, 91, 134, 95, 100, 100, 80, 45, 35, 270, GrowthRate.SLOW, "Dragon", "Water 1", 50, 40, false),
    new PokemonSpecies(Species.MEWTWO, "Mewtwo", 1, false, true, false, "Genetic Pokémon", Type.PSYCHIC, null, 2, 122, Abilities.PRESSURE, Abilities.NONE, Abilities.UNNERVE, 680, 106, 110, 90, 154, 90, 130, 3, 0, 306, GrowthRate.SLOW, "Undiscovered", null, null, 120, false),
    new PokemonSpecies(Species.MEW, "Mew", 1, false, false, true, "New Species Pokémon", Type.PSYCHIC, null, 0.4, 4, Abilities.SYNCHRONIZE, Abilities.NONE, Abilities.NONE, 600, 100, 100, 100, 100, 100, 100, 45, 100, 270, GrowthRate.MEDIUM_SLOW, "Undiscovered", null, null, 120, false),
    new PokemonSpecies(Species.CHIKORITA, "Chikorita", 2, false, false, false, "Leaf Pokémon", Type.GRASS, null, 0.9, 6.4, Abilities.OVERGROW, Abilities.NONE, Abilities.LEAF_GUARD, 318, 45, 49, 65, 49, 65, 45, 45, 70, 64, GrowthRate.MEDIUM_SLOW, "Grass", "Monster", 87.5, 20, false),
    new PokemonSpecies(Species.BAYLEEF, "Bayleef", 2, false, false, false, "Leaf Pokémon", Type.GRASS, null, 1.2, 15.8, Abilities.OVERGROW, Abilities.NONE, Abilities.LEAF_GUARD, 405, 60, 62, 80, 63, 80, 60, 45, 70, 142, GrowthRate.MEDIUM_SLOW, "Grass", "Monster", 87.5, 20, false),
    new PokemonSpecies(Species.MEGANIUM, "Meganium", 2, false, false, false, "Herb Pokémon", Type.GRASS, null, 1.8, 100.5, Abilities.OVERGROW, Abilities.NONE, Abilities.LEAF_GUARD, 525, 80, 82, 100, 83, 100, 80, 45, 70, 236, GrowthRate.MEDIUM_SLOW, "Grass", "Monster", 87.5, 20, true),
    new PokemonSpecies(Species.CYNDAQUIL, "Cyndaquil", 2, false, false, false, "Fire Mouse Pokémon", Type.FIRE, null, 0.5, 7.9, Abilities.BLAZE, Abilities.NONE, Abilities.FLASH_FIRE, 309, 39, 52, 43, 60, 50, 65, 45, 70, 62, GrowthRate.MEDIUM_SLOW, "Field", null, 87.5, 20, false),
    new PokemonSpecies(Species.QUILAVA, "Quilava", 2, false, false, false, "Volcano Pokémon", Type.FIRE, null, 0.9, 19, Abilities.BLAZE, Abilities.NONE, Abilities.FLASH_FIRE, 405, 58, 64, 58, 80, 65, 80, 45, 70, 142, GrowthRate.MEDIUM_SLOW, "Field", null, 87.5, 20, false),
    new PokemonSpecies(Species.TYPHLOSION, "Typhlosion", 2, false, false, false, "Volcano Pokémon", Type.FIRE, null, 1.7, 79.5, Abilities.BLAZE, Abilities.NONE, Abilities.FLASH_FIRE, 534, 78, 84, 78, 109, 85, 100, 45, 70, 240, GrowthRate.MEDIUM_SLOW, "Field", null, 87.5, 20, false),
    new PokemonSpecies(Species.TOTODILE, "Totodile", 2, false, false, false, "Big Jaw Pokémon", Type.WATER, null, 0.6, 9.5, Abilities.TORRENT, Abilities.NONE, Abilities.SHEER_FORCE, 314, 50, 65, 64, 44, 48, 43, 45, 70, 63, GrowthRate.MEDIUM_SLOW, "Monster", "Water 1", 87.5, 20, false),
    new PokemonSpecies(Species.CROCONAW, "Croconaw", 2, false, false, false, "Big Jaw Pokémon", Type.WATER, null, 1.1, 25, Abilities.TORRENT, Abilities.NONE, Abilities.SHEER_FORCE, 405, 65, 80, 80, 59, 63, 58, 45, 70, 142, GrowthRate.MEDIUM_SLOW, "Monster", "Water 1", 87.5, 20, false),
    new PokemonSpecies(Species.FERALIGATR, "Feraligatr", 2, false, false, false, "Big Jaw Pokémon", Type.WATER, null, 2.3, 88.8, Abilities.TORRENT, Abilities.NONE, Abilities.SHEER_FORCE, 530, 85, 105, 100, 79, 83, 78, 45, 70, 239, GrowthRate.MEDIUM_SLOW, "Monster", "Water 1", 87.5, 20, false),
    new PokemonSpecies(Species.SENTRET, "Sentret", 2, false, false, false, "Scout Pokémon", Type.NORMAL, null, 0.8, 6, Abilities.RUN_AWAY, Abilities.KEEN_EYE, Abilities.FRISK, 215, 35, 46, 34, 35, 45, 20, 255, 70, 43, GrowthRate.MEDIUM_FAST, "Field", null, 50, 15, false),
    new PokemonSpecies(Species.FURRET, "Furret", 2, false, false, false, "Long Body Pokémon", Type.NORMAL, null, 1.8, 32.5, Abilities.RUN_AWAY, Abilities.KEEN_EYE, Abilities.FRISK, 415, 85, 76, 64, 45, 55, 90, 90, 70, 145, GrowthRate.MEDIUM_FAST, "Field", null, 50, 15, false),
    new PokemonSpecies(Species.HOOTHOOT, "Hoothoot", 2, false, false, false, "Owl Pokémon", Type.NORMAL, Type.FLYING, 0.7, 21.2, Abilities.INSOMNIA, Abilities.KEEN_EYE, Abilities.TINTED_LENS, 262, 60, 30, 30, 36, 56, 50, 255, 70, 52, GrowthRate.MEDIUM_FAST, "Flying", null, 50, 15, false),
    new PokemonSpecies(Species.NOCTOWL, "Noctowl", 2, false, false, false, "Owl Pokémon", Type.NORMAL, Type.FLYING, 1.6, 40.8, Abilities.INSOMNIA, Abilities.KEEN_EYE, Abilities.TINTED_LENS, 452, 100, 50, 50, 86, 96, 70, 90, 70, 158, GrowthRate.MEDIUM_FAST, "Flying", null, 50, 15, false),
    new PokemonSpecies(Species.LEDYBA, "Ledyba", 2, false, false, false, "Five Star Pokémon", Type.BUG, Type.FLYING, 1, 10.8, Abilities.SWARM, Abilities.EARLY_BIRD, Abilities.RATTLED, 265, 40, 20, 30, 40, 80, 55, 255, 70, 53, GrowthRate.FAST, "Bug", null, 50, 15, true),
    new PokemonSpecies(Species.LEDIAN, "Ledian", 2, false, false, false, "Five Star Pokémon", Type.BUG, Type.FLYING, 1.4, 35.6, Abilities.SWARM, Abilities.EARLY_BIRD, Abilities.IRON_FIST, 390, 55, 35, 50, 55, 110, 85, 90, 70, 137, GrowthRate.FAST, "Bug", null, 50, 15, true),
    new PokemonSpecies(Species.SPINARAK, "Spinarak", 2, false, false, false, "String Spit Pokémon", Type.BUG, Type.POISON, 0.5, 8.5, Abilities.SWARM, Abilities.INSOMNIA, Abilities.SNIPER, 250, 40, 60, 40, 40, 40, 30, 255, 70, 50, GrowthRate.FAST, "Bug", null, 50, 15, false),
    new PokemonSpecies(Species.ARIADOS, "Ariados", 2, false, false, false, "Long Leg Pokémon", Type.BUG, Type.POISON, 1.1, 33.5, Abilities.SWARM, Abilities.INSOMNIA, Abilities.SNIPER, 400, 70, 90, 70, 60, 70, 40, 90, 70, 140, GrowthRate.FAST, "Bug", null, 50, 15, false),
    new PokemonSpecies(Species.CROBAT, "Crobat", 2, false, false, false, "Bat Pokémon", Type.POISON, Type.FLYING, 1.8, 75, Abilities.INNER_FOCUS, Abilities.NONE, Abilities.INFILTRATOR, 535, 85, 90, 80, 70, 80, 130, 90, 70, 241, GrowthRate.MEDIUM_FAST, "Flying", null, 50, 15, false),
    new PokemonSpecies(Species.CHINCHOU, "Chinchou", 2, false, false, false, "Angler Pokémon", Type.WATER, Type.ELECTRIC, 0.5, 12, Abilities.VOLT_ABSORB, Abilities.ILLUMINATE, Abilities.WATER_ABSORB, 330, 75, 38, 38, 56, 56, 67, 190, 70, 66, GrowthRate.SLOW, "Water 2", null, 50, 20, false),
    new PokemonSpecies(Species.LANTURN, "Lanturn", 2, false, false, false, "Light Pokémon", Type.WATER, Type.ELECTRIC, 1.2, 22.5, Abilities.VOLT_ABSORB, Abilities.ILLUMINATE, Abilities.WATER_ABSORB, 460, 125, 58, 58, 76, 76, 67, 75, 70, 161, GrowthRate.SLOW, "Water 2", null, 50, 20, false),
    new PokemonSpecies(Species.PICHU, "Pichu", 2, false, false, false, "Tiny Mouse Pokémon", Type.ELECTRIC, null, 0.3, 2, Abilities.STATIC, Abilities.NONE, Abilities.LIGHTNING_ROD, 205, 20, 40, 15, 35, 35, 60, 190, 70, 41, GrowthRate.MEDIUM_FAST, "Undiscovered", null, 50, 10, false),
    new PokemonSpecies(Species.CLEFFA, "Cleffa", 2, false, false, false, "Star Shape Pokémon", Type.FAIRY, null, 0.3, 3, Abilities.CUTE_CHARM, Abilities.MAGIC_GUARD, Abilities.FRIEND_GUARD, 218, 50, 25, 28, 45, 55, 15, 150, 140, 44, GrowthRate.FAST, "Undiscovered", null, 25, 10, false),
    new PokemonSpecies(Species.IGGLYBUFF, "Igglybuff", 2, false, false, false, "Balloon Pokémon", Type.NORMAL, Type.FAIRY, 0.3, 1, Abilities.CUTE_CHARM, Abilities.COMPETITIVE, Abilities.FRIEND_GUARD, 210, 90, 30, 15, 40, 20, 15, 170, 70, 42, GrowthRate.FAST, "Undiscovered", null, 25, 10, false),
    new PokemonSpecies(Species.TOGEPI, "Togepi", 2, false, false, false, "Spike Ball Pokémon", Type.FAIRY, null, 0.3, 1.5, Abilities.HUSTLE, Abilities.SERENE_GRACE, Abilities.SUPER_LUCK, 245, 35, 20, 65, 40, 65, 20, 190, 70, 49, GrowthRate.FAST, "Undiscovered", null, 87.5, 10, false),
    new PokemonSpecies(Species.TOGETIC, "Togetic", 2, false, false, false, "Happiness Pokémon", Type.FAIRY, Type.FLYING, 0.6, 3.2, Abilities.HUSTLE, Abilities.SERENE_GRACE, Abilities.SUPER_LUCK, 405, 55, 40, 85, 80, 105, 40, 75, 70, 142, GrowthRate.FAST, "Fairy", "Flying", 87.5, 10, false),
    new PokemonSpecies(Species.NATU, "Natu", 2, false, false, false, "Tiny Bird Pokémon", Type.PSYCHIC, Type.FLYING, 0.2, 2, Abilities.SYNCHRONIZE, Abilities.EARLY_BIRD, Abilities.MAGIC_BOUNCE, 320, 40, 50, 45, 70, 45, 70, 190, 70, 64, GrowthRate.MEDIUM_FAST, "Flying", null, 50, 20, false),
    new PokemonSpecies(Species.XATU, "Xatu", 2, false, false, false, "Mystic Pokémon", Type.PSYCHIC, Type.FLYING, 1.5, 15, Abilities.SYNCHRONIZE, Abilities.EARLY_BIRD, Abilities.MAGIC_BOUNCE, 470, 65, 75, 70, 95, 70, 95, 75, 70, 165, GrowthRate.MEDIUM_FAST, "Flying", null, 50, 20, true),
    new PokemonSpecies(Species.MAREEP, "Mareep", 2, false, false, false, "Wool Pokémon", Type.ELECTRIC, null, 0.6, 7.8, Abilities.STATIC, Abilities.NONE, Abilities.PLUS, 280, 55, 40, 40, 65, 45, 35, 235, 70, 56, GrowthRate.MEDIUM_SLOW, "Field", "Monster", 50, 20, false),
    new PokemonSpecies(Species.FLAAFFY, "Flaaffy", 2, false, false, false, "Wool Pokémon", Type.ELECTRIC, null, 0.8, 13.3, Abilities.STATIC, Abilities.NONE, Abilities.PLUS, 365, 70, 55, 55, 80, 60, 45, 120, 70, 128, GrowthRate.MEDIUM_SLOW, "Field", "Monster", 50, 20, false),
    new PokemonSpecies(Species.AMPHAROS, "Ampharos", 2, false, false, false, "Light Pokémon", Type.ELECTRIC, null, 1.4, 61.5, Abilities.STATIC, Abilities.NONE, Abilities.PLUS, 510, 90, 75, 85, 115, 90, 55, 45, 70, 230, GrowthRate.MEDIUM_SLOW, "Field", "Monster", 50, 20, false),
    new PokemonSpecies(Species.BELLOSSOM, "Bellossom", 2, false, false, false, "Flower Pokémon", Type.GRASS, null, 0.4, 5.8, Abilities.CHLOROPHYLL, Abilities.NONE, Abilities.HEALER, 490, 75, 80, 95, 90, 100, 50, 45, 70, 221, GrowthRate.MEDIUM_SLOW, "Grass", null, 50, 20, false),
    new PokemonSpecies(Species.MARILL, "Marill", 2, false, false, false, "Aqua Mouse Pokémon", Type.WATER, Type.FAIRY, 0.4, 8.5, Abilities.THICK_FAT, Abilities.HUGE_POWER, Abilities.SAP_SIPPER, 250, 70, 20, 50, 20, 50, 40, 190, 70, 88, GrowthRate.FAST, "Fairy", "Water 1", 50, 10, false),
    new PokemonSpecies(Species.AZUMARILL, "Azumarill", 2, false, false, false, "Aqua Rabbit Pokémon", Type.WATER, Type.FAIRY, 0.8, 28.5, Abilities.THICK_FAT, Abilities.HUGE_POWER, Abilities.SAP_SIPPER, 420, 100, 50, 80, 60, 80, 50, 75, 70, 189, GrowthRate.FAST, "Fairy", "Water 1", 50, 10, false),
    new PokemonSpecies(Species.SUDOWOODO, "Sudowoodo", 2, false, false, false, "Imitation Pokémon", Type.ROCK, null, 1.2, 38, Abilities.STURDY, Abilities.ROCK_HEAD, Abilities.RATTLED, 410, 70, 100, 115, 30, 65, 30, 65, 70, 144, GrowthRate.MEDIUM_FAST, "Mineral", null, 50, 20, true),
    new PokemonSpecies(Species.POLITOED, "Politoed", 2, false, false, false, "Frog Pokémon", Type.WATER, null, 1.1, 33.9, Abilities.WATER_ABSORB, Abilities.DAMP, Abilities.DRIZZLE, 500, 90, 75, 75, 90, 100, 70, 45, 70, 225, GrowthRate.MEDIUM_SLOW, "Water 1", null, 50, 20, true),
    new PokemonSpecies(Species.HOPPIP, "Hoppip", 2, false, false, false, "Cottonweed Pokémon", Type.GRASS, Type.FLYING, 0.4, 0.5, Abilities.CHLOROPHYLL, Abilities.LEAF_GUARD, Abilities.INFILTRATOR, 250, 35, 35, 40, 35, 55, 50, 255, 70, 50, GrowthRate.MEDIUM_SLOW, "Fairy", "Grass", 50, 20, false),
    new PokemonSpecies(Species.SKIPLOOM, "Skiploom", 2, false, false, false, "Cottonweed Pokémon", Type.GRASS, Type.FLYING, 0.6, 1, Abilities.CHLOROPHYLL, Abilities.LEAF_GUARD, Abilities.INFILTRATOR, 340, 55, 45, 50, 45, 65, 80, 120, 70, 119, GrowthRate.MEDIUM_SLOW, "Fairy", "Grass", 50, 20, false),
    new PokemonSpecies(Species.JUMPLUFF, "Jumpluff", 2, false, false, false, "Cottonweed Pokémon", Type.GRASS, Type.FLYING, 0.8, 3, Abilities.CHLOROPHYLL, Abilities.LEAF_GUARD, Abilities.INFILTRATOR, 460, 75, 55, 70, 55, 95, 110, 45, 70, 207, GrowthRate.MEDIUM_SLOW, "Fairy", "Grass", 50, 20, false),
    new PokemonSpecies(Species.AIPOM, "Aipom", 2, false, false, false, "Long Tail Pokémon", Type.NORMAL, null, 0.8, 11.5, Abilities.RUN_AWAY, Abilities.PICKUP, Abilities.SKILL_LINK, 360, 55, 70, 55, 40, 55, 85, 45, 70, 72, GrowthRate.FAST, "Field", null, 50, 20, true),
    new PokemonSpecies(Species.SUNKERN, "Sunkern", 2, false, false, false, "Seed Pokémon", Type.GRASS, null, 0.3, 1.8, Abilities.CHLOROPHYLL, Abilities.SOLAR_POWER, Abilities.EARLY_BIRD, 180, 30, 30, 30, 30, 30, 30, 235, 70, 36, GrowthRate.MEDIUM_SLOW, "Grass", null, 50, 20, false),
    new PokemonSpecies(Species.SUNFLORA, "Sunflora", 2, false, false, false, "Sun Pokémon", Type.GRASS, null, 0.8, 8.5, Abilities.CHLOROPHYLL, Abilities.SOLAR_POWER, Abilities.EARLY_BIRD, 425, 75, 75, 55, 105, 85, 30, 120, 70, 149, GrowthRate.MEDIUM_SLOW, "Grass", null, 50, 20, false),
    new PokemonSpecies(Species.YANMA, "Yanma", 2, false, false, false, "Clear Wing Pokémon", Type.BUG, Type.FLYING, 1.2, 38, Abilities.SPEED_BOOST, Abilities.COMPOUND_EYES, Abilities.FRISK, 390, 65, 65, 45, 75, 45, 95, 75, 70, 78, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 20, false),
    new PokemonSpecies(Species.WOOPER, "Wooper", 2, false, false, false, "Water Fish Pokémon", Type.WATER, Type.GROUND, 0.4, 8.5, Abilities.DAMP, Abilities.WATER_ABSORB, Abilities.UNAWARE, 210, 55, 45, 45, 25, 25, 15, 255, 70, 42, GrowthRate.MEDIUM_FAST, "Field", "Water 1", 50, 20, true),
    new PokemonSpecies(Species.QUAGSIRE, "Quagsire", 2, false, false, false, "Water Fish Pokémon", Type.WATER, Type.GROUND, 1.4, 75, Abilities.DAMP, Abilities.WATER_ABSORB, Abilities.UNAWARE, 430, 95, 85, 85, 65, 65, 35, 90, 70, 151, GrowthRate.MEDIUM_FAST, "Field", "Water 1", 50, 20, true),
    new PokemonSpecies(Species.ESPEON, "Espeon", 2, false, false, false, "Sun Pokémon", Type.PSYCHIC, null, 0.9, 26.5, Abilities.SYNCHRONIZE, Abilities.NONE, Abilities.MAGIC_BOUNCE, 525, 65, 65, 60, 130, 95, 110, 45, 70, 184, GrowthRate.MEDIUM_FAST, "Field", null, 87.5, 35, false),
    new PokemonSpecies(Species.UMBREON, "Umbreon", 2, false, false, false, "Moonlight Pokémon", Type.DARK, null, 1, 27, Abilities.SYNCHRONIZE, Abilities.NONE, Abilities.INNER_FOCUS, 525, 95, 65, 110, 60, 130, 65, 45, 35, 184, GrowthRate.MEDIUM_FAST, "Field", null, 87.5, 35, false),
    new PokemonSpecies(Species.MURKROW, "Murkrow", 2, false, false, false, "Darkness Pokémon", Type.DARK, Type.FLYING, 0.5, 2.1, Abilities.INSOMNIA, Abilities.SUPER_LUCK, Abilities.PRANKSTER, 405, 60, 85, 42, 85, 32, 91, 30, 35, 81, GrowthRate.MEDIUM_SLOW, "Flying", null, 50, 20, true),
    new PokemonSpecies(Species.SLOWKING, "Slowking", 2, false, false, false, "Royal Pokémon", Type.WATER, Type.PSYCHIC, 2, 79.5, Abilities.OBLIVIOUS, Abilities.OWN_TEMPO, Abilities.REGENERATOR, 490, 95, 75, 80, 100, 110, 30, 70, 70, 172, GrowthRate.MEDIUM_FAST, "Monster", "Water 1", 50, 20, false),
    new PokemonSpecies(Species.MISDREAVUS, "Misdreavus", 2, false, false, false, "Screech Pokémon", Type.GHOST, null, 0.7, 1, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 435, 60, 60, 60, 85, 85, 85, 45, 35, 87, GrowthRate.FAST, "Amorphous", null, 50, 25, false),
    new PokemonSpecies(Species.UNOWN, "Unown", 2, false, false, false, "Symbol Pokémon", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, GrowthRate.MEDIUM_FAST, "Undiscovered", null, null, 40, true, false,
      new PokemonForm("A", "a", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, GrowthRate.MEDIUM_FAST, "Undiscovered", null, null, 40, true),
      new PokemonForm("B", "b", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, GrowthRate.MEDIUM_FAST, "Undiscovered", null, null, 40, true),
      new PokemonForm("C", "c", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, GrowthRate.MEDIUM_FAST, "Undiscovered", null, null, 40, true),
      new PokemonForm("D", "d", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, GrowthRate.MEDIUM_FAST, "Undiscovered", null, null, 40, true),
      new PokemonForm("E", "e", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, GrowthRate.MEDIUM_FAST, "Undiscovered", null, null, 40, true),
      new PokemonForm("F", "f", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, GrowthRate.MEDIUM_FAST, "Undiscovered", null, null, 40, true),
      new PokemonForm("G", "g", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, GrowthRate.MEDIUM_FAST, "Undiscovered", null, null, 40, true),
      new PokemonForm("H", "h", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, GrowthRate.MEDIUM_FAST, "Undiscovered", null, null, 40, true),
      new PokemonForm("I", "i", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, GrowthRate.MEDIUM_FAST, "Undiscovered", null, null, 40, true),
      new PokemonForm("J", "j", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, GrowthRate.MEDIUM_FAST, "Undiscovered", null, null, 40, true),
      new PokemonForm("K", "k", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, GrowthRate.MEDIUM_FAST, "Undiscovered", null, null, 40, true),
      new PokemonForm("L", "l", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, GrowthRate.MEDIUM_FAST, "Undiscovered", null, null, 40, true),
      new PokemonForm("M", "m", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, GrowthRate.MEDIUM_FAST, "Undiscovered", null, null, 40, true),
      new PokemonForm("N", "n", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, GrowthRate.MEDIUM_FAST, "Undiscovered", null, null, 40, true),
      new PokemonForm("O", "o", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, GrowthRate.MEDIUM_FAST, "Undiscovered", null, null, 40, true),
      new PokemonForm("P", "p", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, GrowthRate.MEDIUM_FAST, "Undiscovered", null, null, 40, true),
      new PokemonForm("Q", "q", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, GrowthRate.MEDIUM_FAST, "Undiscovered", null, null, 40, true),
      new PokemonForm("R", "r", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, GrowthRate.MEDIUM_FAST, "Undiscovered", null, null, 40, true),
      new PokemonForm("S", "s", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, GrowthRate.MEDIUM_FAST, "Undiscovered", null, null, 40, true),
      new PokemonForm("T", "t", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, GrowthRate.MEDIUM_FAST, "Undiscovered", null, null, 40, true),
      new PokemonForm("U", "u", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, GrowthRate.MEDIUM_FAST, "Undiscovered", null, null, 40, true),
      new PokemonForm("V", "v", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, GrowthRate.MEDIUM_FAST, "Undiscovered", null, null, 40, true),
      new PokemonForm("W", "w", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, GrowthRate.MEDIUM_FAST, "Undiscovered", null, null, 40, true),
      new PokemonForm("X", "x", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, GrowthRate.MEDIUM_FAST, "Undiscovered", null, null, 40, true),
      new PokemonForm("Y", "y", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, GrowthRate.MEDIUM_FAST, "Undiscovered", null, null, 40, true),
      new PokemonForm("Z", "z", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, GrowthRate.MEDIUM_FAST, "Undiscovered", null, null, 40, true),
      new PokemonForm("Exclamation", "exclamation", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, GrowthRate.MEDIUM_FAST, "Undiscovered", null, null, 40, true),
      new PokemonForm("Question", "question", Type.PSYCHIC, null, 0.5, 5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 336, 48, 72, 48, 72, 48, 48, 225, 70, 118, GrowthRate.MEDIUM_FAST, "Undiscovered", null, null, 40, true),
    ),
    new PokemonSpecies(Species.WOBBUFFET, "Wobbuffet", 2, false, false, false, "Patient Pokémon", Type.PSYCHIC, null, 1.3, 28.5, Abilities.SHADOW_TAG, Abilities.NONE, Abilities.TELEPATHY, 405, 190, 33, 58, 33, 58, 33, 45, 70, 142, GrowthRate.MEDIUM_FAST, "Amorphous", null, 50, 20, true),
    new PokemonSpecies(Species.GIRAFARIG, "Girafarig", 2, false, false, false, "Long Neck Pokémon", Type.NORMAL, Type.PSYCHIC, 1.5, 41.5, Abilities.INNER_FOCUS, Abilities.EARLY_BIRD, Abilities.SAP_SIPPER, 455, 70, 80, 65, 90, 65, 85, 60, 70, 159, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, true),
    new PokemonSpecies(Species.PINECO, "Pineco", 2, false, false, false, "Bagworm Pokémon", Type.BUG, null, 0.6, 7.2, Abilities.STURDY, Abilities.NONE, Abilities.OVERCOAT, 290, 50, 65, 90, 35, 35, 15, 190, 70, 58, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 20, false),
    new PokemonSpecies(Species.FORRETRESS, "Forretress", 2, false, false, false, "Bagworm Pokémon", Type.BUG, Type.STEEL, 1.2, 125.8, Abilities.STURDY, Abilities.NONE, Abilities.OVERCOAT, 465, 75, 90, 140, 60, 60, 40, 75, 70, 163, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 20, false),
    new PokemonSpecies(Species.DUNSPARCE, "Dunsparce", 2, false, false, false, "Land Snake Pokémon", Type.NORMAL, null, 1.5, 14, Abilities.SERENE_GRACE, Abilities.RUN_AWAY, Abilities.RATTLED, 415, 100, 70, 70, 65, 65, 45, 190, 70, 145, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.GLIGAR, "Gligar", 2, false, false, false, "FlyScorpion Pokémon", Type.GROUND, Type.FLYING, 1.1, 64.8, Abilities.HYPER_CUTTER, Abilities.SAND_VEIL, Abilities.IMMUNITY, 430, 65, 75, 105, 35, 65, 85, 60, 70, 86, GrowthRate.MEDIUM_SLOW, "Bug", null, 50, 20, true),
    new PokemonSpecies(Species.STEELIX, "Steelix", 2, false, false, false, "Iron Snake Pokémon", Type.STEEL, Type.GROUND, 9.2, 400, Abilities.ROCK_HEAD, Abilities.STURDY, Abilities.SHEER_FORCE, 510, 75, 85, 200, 55, 65, 30, 25, 70, 179, GrowthRate.MEDIUM_FAST, "Mineral", null, 50, 25, true),
    new PokemonSpecies(Species.SNUBBULL, "Snubbull", 2, false, false, false, "Fairy Pokémon", Type.FAIRY, null, 0.6, 7.8, Abilities.INTIMIDATE, Abilities.RUN_AWAY, Abilities.RATTLED, 300, 60, 80, 50, 40, 40, 30, 190, 70, 60, GrowthRate.FAST, "Fairy", "Field", 25, 20, false),
    new PokemonSpecies(Species.GRANBULL, "Granbull", 2, false, false, false, "Fairy Pokémon", Type.FAIRY, null, 1.4, 48.7, Abilities.INTIMIDATE, Abilities.QUICK_FEET, Abilities.RATTLED, 450, 90, 120, 75, 60, 60, 45, 75, 70, 158, GrowthRate.FAST, "Fairy", "Field", 25, 20, false),
    new PokemonSpecies(Species.QWILFISH, "Qwilfish", 2, false, false, false, "Balloon Pokémon", Type.WATER, Type.POISON, 0.5, 3.9, Abilities.POISON_POINT, Abilities.SWIFT_SWIM, Abilities.INTIMIDATE, 440, 65, 95, 85, 55, 55, 85, 45, 70, 88, GrowthRate.MEDIUM_FAST, "Water 2", null, 50, 20, false),
    new PokemonSpecies(Species.SCIZOR, "Scizor", 2, false, false, false, "Pincer Pokémon", Type.BUG, Type.STEEL, 1.8, 118, Abilities.SWARM, Abilities.TECHNICIAN, Abilities.LIGHT_METAL, 500, 70, 130, 100, 55, 80, 65, 25, 70, 175, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 25, true),
    new PokemonSpecies(Species.SHUCKLE, "Shuckle", 2, false, false, false, "Mold Pokémon", Type.BUG, Type.ROCK, 0.6, 20.5, Abilities.STURDY, Abilities.GLUTTONY, Abilities.CONTRARY, 505, 20, 10, 230, 10, 230, 5, 190, 70, 177, GrowthRate.MEDIUM_SLOW, "Bug", null, 50, 20, false),
    new PokemonSpecies(Species.HERACROSS, "Heracross", 2, false, false, false, "Single Horn Pokémon", Type.BUG, Type.FIGHTING, 1.5, 54, Abilities.SWARM, Abilities.GUTS, Abilities.MOXIE, 500, 80, 125, 75, 40, 95, 85, 45, 70, 175, GrowthRate.SLOW, "Bug", null, 50, 25, true),
    new PokemonSpecies(Species.SNEASEL, "Sneasel", 2, false, false, false, "Sharp Claw Pokémon", Type.DARK, Type.ICE, 0.9, 28, Abilities.INNER_FOCUS, Abilities.KEEN_EYE, Abilities.PICKPOCKET, 430, 55, 95, 55, 35, 75, 115, 60, 35, 86, GrowthRate.MEDIUM_SLOW, "Field", null, 50, 20, true),
    new PokemonSpecies(Species.TEDDIURSA, "Teddiursa", 2, false, false, false, "Little Bear Pokémon", Type.NORMAL, null, 0.6, 8.8, Abilities.PICKUP, Abilities.QUICK_FEET, Abilities.HONEY_GATHER, 330, 60, 80, 50, 50, 50, 40, 120, 70, 66, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.URSARING, "Ursaring", 2, false, false, false, "Hibernator Pokémon", Type.NORMAL, null, 1.8, 125.8, Abilities.GUTS, Abilities.QUICK_FEET, Abilities.UNNERVE, 500, 90, 130, 75, 75, 75, 55, 60, 70, 175, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, true),
    new PokemonSpecies(Species.SLUGMA, "Slugma", 2, false, false, false, "Lava Pokémon", Type.FIRE, null, 0.7, 35, Abilities.MAGMA_ARMOR, Abilities.FLAME_BODY, Abilities.WEAK_ARMOR, 250, 40, 40, 40, 70, 40, 20, 190, 70, 50, GrowthRate.MEDIUM_FAST, "Amorphous", null, 50, 20, false),
    new PokemonSpecies(Species.MAGCARGO, "Magcargo", 2, false, false, false, "Lava Pokémon", Type.FIRE, Type.ROCK, 0.8, 55, Abilities.MAGMA_ARMOR, Abilities.FLAME_BODY, Abilities.WEAK_ARMOR, 430, 60, 50, 120, 90, 80, 30, 75, 70, 151, GrowthRate.MEDIUM_FAST, "Amorphous", null, 50, 20, false),
    new PokemonSpecies(Species.SWINUB, "Swinub", 2, false, false, false, "Pig Pokémon", Type.ICE, Type.GROUND, 0.4, 6.5, Abilities.OBLIVIOUS, Abilities.SNOW_CLOAK, Abilities.THICK_FAT, 250, 50, 50, 40, 30, 30, 50, 225, 70, 50, GrowthRate.SLOW, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.PILOSWINE, "Piloswine", 2, false, false, false, "Swine Pokémon", Type.ICE, Type.GROUND, 1.1, 55.8, Abilities.OBLIVIOUS, Abilities.SNOW_CLOAK, Abilities.THICK_FAT, 450, 100, 100, 80, 60, 60, 50, 75, 70, 158, GrowthRate.SLOW, "Field", null, 50, 20, true),
    new PokemonSpecies(Species.CORSOLA, "Corsola", 2, false, false, false, "Coral Pokémon", Type.WATER, Type.ROCK, 0.6, 5, Abilities.HUSTLE, Abilities.NATURAL_CURE, Abilities.REGENERATOR, 410, 65, 55, 95, 65, 95, 35, 60, 70, 144, GrowthRate.FAST, "Water 1", "Water 3", 25, 20, false),
    new PokemonSpecies(Species.REMORAID, "Remoraid", 2, false, false, false, "Jet Pokémon", Type.WATER, null, 0.6, 12, Abilities.HUSTLE, Abilities.SNIPER, Abilities.MOODY, 300, 35, 65, 35, 65, 35, 65, 190, 70, 60, GrowthRate.MEDIUM_FAST, "Water 1", "Water 2", 50, 20, false),
    new PokemonSpecies(Species.OCTILLERY, "Octillery", 2, false, false, false, "Jet Pokémon", Type.WATER, null, 0.9, 28.5, Abilities.SUCTION_CUPS, Abilities.SNIPER, Abilities.MOODY, 480, 75, 105, 75, 105, 75, 45, 75, 70, 168, GrowthRate.MEDIUM_FAST, "Water 1", "Water 2", 50, 20, true),
    new PokemonSpecies(Species.DELIBIRD, "Delibird", 2, false, false, false, "Delivery Pokémon", Type.ICE, Type.FLYING, 0.9, 16, Abilities.VITAL_SPIRIT, Abilities.HUSTLE, Abilities.INSOMNIA, 330, 45, 55, 45, 65, 45, 75, 45, 70, 116, GrowthRate.FAST, "Field", "Water 1", 50, 20, false),
    new PokemonSpecies(Species.MANTINE, "Mantine", 2, false, false, false, "Kite Pokémon", Type.WATER, Type.FLYING, 2.1, 220, Abilities.SWIFT_SWIM, Abilities.WATER_ABSORB, Abilities.WATER_VEIL, 485, 85, 40, 70, 80, 140, 70, 25, 70, 170, GrowthRate.SLOW, "Water 1", null, 50, 25, false),
    new PokemonSpecies(Species.SKARMORY, "Skarmory", 2, false, false, false, "Armor Bird Pokémon", Type.STEEL, Type.FLYING, 1.7, 50.5, Abilities.KEEN_EYE, Abilities.STURDY, Abilities.WEAK_ARMOR, 465, 65, 80, 140, 40, 70, 70, 25, 70, 163, GrowthRate.SLOW, "Flying", null, 50, 25, false),
    new PokemonSpecies(Species.HOUNDOUR, "Houndour", 2, false, false, false, "Dark Pokémon", Type.DARK, Type.FIRE, 0.6, 10.8, Abilities.EARLY_BIRD, Abilities.FLASH_FIRE, Abilities.UNNERVE, 330, 45, 60, 30, 80, 50, 65, 120, 35, 66, GrowthRate.SLOW, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.HOUNDOOM, "Houndoom", 2, false, false, false, "Dark Pokémon", Type.DARK, Type.FIRE, 1.4, 35, Abilities.EARLY_BIRD, Abilities.FLASH_FIRE, Abilities.UNNERVE, 500, 75, 90, 50, 110, 80, 95, 45, 35, 175, GrowthRate.SLOW, "Field", null, 50, 20, true),
    new PokemonSpecies(Species.KINGDRA, "Kingdra", 2, false, false, false, "Dragon Pokémon", Type.WATER, Type.DRAGON, 1.8, 152, Abilities.SWIFT_SWIM, Abilities.SNIPER, Abilities.DAMP, 540, 75, 95, 95, 95, 95, 85, 45, 70, 243, GrowthRate.MEDIUM_FAST, "Dragon", "Water 1", 50, 20, false),
    new PokemonSpecies(Species.PHANPY, "Phanpy", 2, false, false, false, "Long Nose Pokémon", Type.GROUND, null, 0.5, 33.5, Abilities.PICKUP, Abilities.NONE, Abilities.SAND_VEIL, 330, 90, 60, 60, 40, 40, 40, 120, 70, 66, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.DONPHAN, "Donphan", 2, false, false, false, "Armor Pokémon", Type.GROUND, null, 1.1, 120, Abilities.STURDY, Abilities.NONE, Abilities.SAND_VEIL, 500, 90, 120, 120, 60, 60, 50, 60, 70, 175, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, true),
    new PokemonSpecies(Species.PORYGON2, "Porygon2", 2, false, false, false, "Virtual Pokémon", Type.NORMAL, null, 0.6, 32.5, Abilities.TRACE, Abilities.DOWNLOAD, Abilities.ANALYTIC, 515, 85, 80, 90, 105, 95, 60, 45, 70, 180, GrowthRate.MEDIUM_FAST, "Mineral", null, null, 20, false),
    new PokemonSpecies(Species.STANTLER, "Stantler", 2, false, false, false, "Big Horn Pokémon", Type.NORMAL, null, 1.4, 71.2, Abilities.INTIMIDATE, Abilities.FRISK, Abilities.SAP_SIPPER, 465, 73, 95, 62, 85, 65, 85, 45, 70, 163, GrowthRate.SLOW, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.SMEARGLE, "Smeargle", 2, false, false, false, "Painter Pokémon", Type.NORMAL, null, 1.2, 58, Abilities.OWN_TEMPO, Abilities.TECHNICIAN, Abilities.MOODY, 250, 55, 20, 35, 20, 45, 75, 45, 70, 88, GrowthRate.FAST, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.TYROGUE, "Tyrogue", 2, false, false, false, "Scuffle Pokémon", Type.FIGHTING, null, 0.7, 21, Abilities.GUTS, Abilities.STEADFAST, Abilities.VITAL_SPIRIT, 210, 35, 35, 35, 35, 35, 35, 75, 70, 42, GrowthRate.MEDIUM_FAST, "Undiscovered", null, 100, 25, false),
    new PokemonSpecies(Species.HITMONTOP, "Hitmontop", 2, false, false, false, "Handstand Pokémon", Type.FIGHTING, null, 1.4, 48, Abilities.INTIMIDATE, Abilities.TECHNICIAN, Abilities.STEADFAST, 455, 50, 95, 95, 35, 110, 70, 45, 70, 159, GrowthRate.MEDIUM_FAST, "Human-Like", null, 100, 25, false),
    new PokemonSpecies(Species.SMOOCHUM, "Smoochum", 2, false, false, false, "Kiss Pokémon", Type.ICE, Type.PSYCHIC, 0.4, 6, Abilities.OBLIVIOUS, Abilities.FOREWARN, Abilities.HYDRATION, 305, 45, 30, 15, 85, 65, 65, 45, 70, 61, GrowthRate.MEDIUM_FAST, "Undiscovered", null, 0, 25, false),
    new PokemonSpecies(Species.ELEKID, "Elekid", 2, false, false, false, "Electric Pokémon", Type.ELECTRIC, null, 0.6, 23.5, Abilities.STATIC, Abilities.NONE, Abilities.VITAL_SPIRIT, 360, 45, 63, 37, 65, 55, 95, 45, 70, 72, GrowthRate.MEDIUM_FAST, "Undiscovered", null, 75, 25, false),
    new PokemonSpecies(Species.MAGBY, "Magby", 2, false, false, false, "Live Coal Pokémon", Type.FIRE, null, 0.7, 21.4, Abilities.FLAME_BODY, Abilities.NONE, Abilities.VITAL_SPIRIT, 365, 45, 75, 37, 70, 55, 83, 45, 70, 73, GrowthRate.MEDIUM_FAST, "Undiscovered", null, 75, 25, false),
    new PokemonSpecies(Species.MILTANK, "Miltank", 2, false, false, false, "Milk Cow Pokémon", Type.NORMAL, null, 1.2, 75.5, Abilities.THICK_FAT, Abilities.SCRAPPY, Abilities.SAP_SIPPER, 490, 95, 80, 105, 40, 70, 100, 45, 70, 172, GrowthRate.SLOW, "Field", null, 0, 20, false),
    new PokemonSpecies(Species.BLISSEY, "Blissey", 2, false, false, false, "Happiness Pokémon", Type.NORMAL, null, 1.5, 46.8, Abilities.NATURAL_CURE, Abilities.SERENE_GRACE, Abilities.HEALER, 540, 255, 10, 10, 75, 135, 55, 30, 140, 608, GrowthRate.FAST, "Fairy", null, 0, 40, false),
    new PokemonSpecies(Species.RAIKOU, "Raikou", 2, true, false, false, "Thunder Pokémon", Type.ELECTRIC, null, 1.9, 178, Abilities.PRESSURE, Abilities.NONE, Abilities.INNER_FOCUS, 580, 90, 85, 75, 115, 100, 115, 3, 35, 261, GrowthRate.SLOW, "Undiscovered", null, null, 80, false),
    new PokemonSpecies(Species.ENTEI, "Entei", 2, true, false, false, "Volcano Pokémon", Type.FIRE, null, 2.1, 198, Abilities.PRESSURE, Abilities.NONE, Abilities.INNER_FOCUS, 580, 115, 115, 85, 90, 75, 100, 3, 35, 261, GrowthRate.SLOW, "Undiscovered", null, null, 80, false),
    new PokemonSpecies(Species.SUICUNE, "Suicune", 2, true, false, false, "Aurora Pokémon", Type.WATER, null, 2, 187, Abilities.PRESSURE, Abilities.NONE, Abilities.INNER_FOCUS, 580, 100, 75, 115, 90, 115, 85, 3, 35, 261, GrowthRate.SLOW, "Undiscovered", null, null, 80, false),
    new PokemonSpecies(Species.LARVITAR, "Larvitar", 2, false, false, false, "Rock Skin Pokémon", Type.ROCK, Type.GROUND, 0.6, 72, Abilities.GUTS, Abilities.NONE, Abilities.SAND_VEIL, 300, 50, 64, 50, 45, 50, 41, 45, 35, 60, GrowthRate.SLOW, "Monster", null, 50, 40, false),
    new PokemonSpecies(Species.PUPITAR, "Pupitar", 2, false, false, false, "Hard Shell Pokémon", Type.ROCK, Type.GROUND, 1.2, 152, Abilities.SHED_SKIN, Abilities.NONE, Abilities.NONE, 410, 70, 84, 70, 65, 70, 51, 45, 35, 144, GrowthRate.SLOW, "Monster", null, 50, 40, false),
    new PokemonSpecies(Species.TYRANITAR, "Tyranitar", 2, false, false, false, "Armor Pokémon", Type.ROCK, Type.DARK, 2, 202, Abilities.SAND_STREAM, Abilities.NONE, Abilities.UNNERVE, 600, 100, 134, 110, 95, 100, 61, 45, 35, 270, GrowthRate.SLOW, "Monster", null, 50, 40, false),
    new PokemonSpecies(Species.LUGIA, "Lugia", 2, false, true, false, "Diving Pokémon", Type.PSYCHIC, Type.FLYING, 5.2, 216, Abilities.PRESSURE, Abilities.NONE, Abilities.MULTISCALE, 680, 106, 90, 130, 90, 154, 110, 3, 0, 306, GrowthRate.SLOW, "Undiscovered", null, null, 120, false),
    new PokemonSpecies(Species.HO_OH, "Ho-oh", 2, false, true, false, "Rainbow Pokémon", Type.FIRE, Type.FLYING, 3.8, 199, Abilities.PRESSURE, Abilities.NONE, Abilities.REGENERATOR, 680, 106, 130, 90, 110, 154, 90, 3, 0, 306, GrowthRate.SLOW, "Undiscovered", null, null, 120, false),
    new PokemonSpecies(Species.CELEBI, "Celebi", 2, false, false, true, "Time Travel Pokémon", Type.PSYCHIC, Type.GRASS, 0.6, 5, Abilities.NATURAL_CURE, Abilities.NONE, Abilities.NONE, 600, 100, 100, 100, 100, 100, 100, 45, 100, 270, GrowthRate.MEDIUM_SLOW, "Undiscovered", null, null, 120, false),
    new PokemonSpecies(Species.TREECKO, "Treecko", 3, false, false, false, "Wood Gecko Pokémon", Type.GRASS, null, 0.5, 5, Abilities.OVERGROW, Abilities.NONE, Abilities.UNBURDEN, 310, 40, 45, 35, 65, 55, 70, 45, 70, 62, GrowthRate.MEDIUM_SLOW, "Dragon", "Monster", 87.5, 20, false),
    new PokemonSpecies(Species.GROVYLE, "Grovyle", 3, false, false, false, "Wood Gecko Pokémon", Type.GRASS, null, 0.9, 21.6, Abilities.OVERGROW, Abilities.NONE, Abilities.UNBURDEN, 405, 50, 65, 45, 85, 65, 95, 45, 70, 142, GrowthRate.MEDIUM_SLOW, "Dragon", "Monster", 87.5, 20, false),
    new PokemonSpecies(Species.SCEPTILE, "Sceptile", 3, false, false, false, "Forest Pokémon", Type.GRASS, null, 1.7, 52.2, Abilities.OVERGROW, Abilities.NONE, Abilities.UNBURDEN, 530, 70, 85, 65, 105, 85, 120, 45, 70, 239, GrowthRate.MEDIUM_SLOW, "Dragon", "Monster", 87.5, 20, false),
    new PokemonSpecies(Species.TORCHIC, "Torchic", 3, false, false, false, "Chick Pokémon", Type.FIRE, null, 0.4, 2.5, Abilities.BLAZE, Abilities.NONE, Abilities.SPEED_BOOST, 310, 45, 60, 40, 70, 50, 45, 45, 70, 62, GrowthRate.MEDIUM_SLOW, "Field", null, 87.5, 20, true),
    new PokemonSpecies(Species.COMBUSKEN, "Combusken", 3, false, false, false, "Young Fowl Pokémon", Type.FIRE, Type.FIGHTING, 0.9, 19.5, Abilities.BLAZE, Abilities.NONE, Abilities.SPEED_BOOST, 405, 60, 85, 60, 85, 60, 55, 45, 70, 142, GrowthRate.MEDIUM_SLOW, "Field", null, 87.5, 20, true),
    new PokemonSpecies(Species.BLAZIKEN, "Blaziken", 3, false, false, false, "Blaze Pokémon", Type.FIRE, Type.FIGHTING, 1.9, 52, Abilities.BLAZE, Abilities.NONE, Abilities.SPEED_BOOST, 530, 80, 120, 70, 110, 70, 80, 45, 70, 239, GrowthRate.MEDIUM_SLOW, "Field", null, 87.5, 20, true),
    new PokemonSpecies(Species.MUDKIP, "Mudkip", 3, false, false, false, "Mud Fish Pokémon", Type.WATER, null, 0.4, 7.6, Abilities.TORRENT, Abilities.NONE, Abilities.DAMP, 310, 50, 70, 50, 50, 50, 40, 45, 70, 62, GrowthRate.MEDIUM_SLOW, "Monster", "Water 1", 87.5, 20, false),
    new PokemonSpecies(Species.MARSHTOMP, "Marshtomp", 3, false, false, false, "Mud Fish Pokémon", Type.WATER, Type.GROUND, 0.7, 28, Abilities.TORRENT, Abilities.NONE, Abilities.DAMP, 405, 70, 85, 70, 60, 70, 50, 45, 70, 142, GrowthRate.MEDIUM_SLOW, "Monster", "Water 1", 87.5, 20, false),
    new PokemonSpecies(Species.SWAMPERT, "Swampert", 3, false, false, false, "Mud Fish Pokémon", Type.WATER, Type.GROUND, 1.5, 81.9, Abilities.TORRENT, Abilities.NONE, Abilities.DAMP, 535, 100, 110, 90, 85, 90, 60, 45, 70, 241, GrowthRate.MEDIUM_SLOW, "Monster", "Water 1", 87.5, 20, false),
    new PokemonSpecies(Species.POOCHYENA, "Poochyena", 3, false, false, false, "Bite Pokémon", Type.DARK, null, 0.5, 13.6, Abilities.RUN_AWAY, Abilities.QUICK_FEET, Abilities.RATTLED, 220, 35, 55, 35, 30, 30, 35, 255, 70, 56, GrowthRate.MEDIUM_FAST, "Field", null, 50, 15, false),
    new PokemonSpecies(Species.MIGHTYENA, "Mightyena", 3, false, false, false, "Bite Pokémon", Type.DARK, null, 1, 37, Abilities.INTIMIDATE, Abilities.QUICK_FEET, Abilities.MOXIE, 420, 70, 90, 70, 60, 60, 70, 127, 70, 147, GrowthRate.MEDIUM_FAST, "Field", null, 50, 15, false),
    new PokemonSpecies(Species.ZIGZAGOON, "Zigzagoon", 3, false, false, false, "TinyRaccoon Pokémon", Type.NORMAL, null, 0.4, 17.5, Abilities.PICKUP, Abilities.GLUTTONY, Abilities.QUICK_FEET, 240, 38, 30, 41, 30, 41, 60, 255, 70, 56, GrowthRate.MEDIUM_FAST, "Field", null, 50, 15, false),
    new PokemonSpecies(Species.LINOONE, "Linoone", 3, false, false, false, "Rushing Pokémon", Type.NORMAL, null, 0.5, 32.5, Abilities.PICKUP, Abilities.GLUTTONY, Abilities.QUICK_FEET, 420, 78, 70, 61, 50, 61, 100, 90, 70, 147, GrowthRate.MEDIUM_FAST, "Field", null, 50, 15, false),
    new PokemonSpecies(Species.WURMPLE, "Wurmple", 3, false, false, false, "Worm Pokémon", Type.BUG, null, 0.3, 3.6, Abilities.SHIELD_DUST, Abilities.NONE, Abilities.RUN_AWAY, 195, 45, 45, 35, 20, 30, 20, 255, 70, 56, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 15, false),
    new PokemonSpecies(Species.SILCOON, "Silcoon", 3, false, false, false, "Cocoon Pokémon", Type.BUG, null, 0.6, 10, Abilities.SHED_SKIN, Abilities.NONE, Abilities.NONE, 205, 50, 35, 55, 25, 25, 15, 120, 70, 72, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 15, false),
    new PokemonSpecies(Species.BEAUTIFLY, "Beautifly", 3, false, false, false, "Butterfly Pokémon", Type.BUG, Type.FLYING, 1, 28.4, Abilities.SWARM, Abilities.NONE, Abilities.RIVALRY, 395, 60, 70, 50, 100, 50, 65, 45, 70, 178, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 15, true),
    new PokemonSpecies(Species.CASCOON, "Cascoon", 3, false, false, false, "Cocoon Pokémon", Type.BUG, null, 0.7, 11.5, Abilities.SHED_SKIN, Abilities.NONE, Abilities.NONE, 205, 50, 35, 55, 25, 25, 15, 120, 70, 72, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 15, false),
    new PokemonSpecies(Species.DUSTOX, "Dustox", 3, false, false, false, "Poison Moth Pokémon", Type.BUG, Type.POISON, 1.2, 31.6, Abilities.SHIELD_DUST, Abilities.NONE, Abilities.COMPOUND_EYES, 385, 60, 50, 70, 50, 90, 65, 45, 70, 173, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 15, true),
    new PokemonSpecies(Species.LOTAD, "Lotad", 3, false, false, false, "Water Weed Pokémon", Type.WATER, Type.GRASS, 0.5, 2.6, Abilities.SWIFT_SWIM, Abilities.RAIN_DISH, Abilities.OWN_TEMPO, 220, 40, 30, 30, 40, 50, 30, 255, 70, 44, GrowthRate.MEDIUM_SLOW, "Grass", "Water 1", 50, 15, false),
    new PokemonSpecies(Species.LOMBRE, "Lombre", 3, false, false, false, "Jolly Pokémon", Type.WATER, Type.GRASS, 1.2, 32.5, Abilities.SWIFT_SWIM, Abilities.RAIN_DISH, Abilities.OWN_TEMPO, 340, 60, 50, 50, 60, 70, 50, 120, 70, 119, GrowthRate.MEDIUM_SLOW, "Grass", "Water 1", 50, 15, false),
    new PokemonSpecies(Species.LUDICOLO, "Ludicolo", 3, false, false, false, "Carefree Pokémon", Type.WATER, Type.GRASS, 1.5, 55, Abilities.SWIFT_SWIM, Abilities.RAIN_DISH, Abilities.OWN_TEMPO, 480, 80, 70, 70, 90, 100, 70, 45, 70, 216, GrowthRate.MEDIUM_SLOW, "Grass", "Water 1", 50, 15, true),
    new PokemonSpecies(Species.SEEDOT, "Seedot", 3, false, false, false, "Acorn Pokémon", Type.GRASS, null, 0.5, 4, Abilities.CHLOROPHYLL, Abilities.EARLY_BIRD, Abilities.PICKPOCKET, 220, 40, 40, 50, 30, 30, 30, 255, 70, 44, GrowthRate.MEDIUM_SLOW, "Field", "Grass", 50, 15, false),
    new PokemonSpecies(Species.NUZLEAF, "Nuzleaf", 3, false, false, false, "Wily Pokémon", Type.GRASS, Type.DARK, 1, 28, Abilities.CHLOROPHYLL, Abilities.EARLY_BIRD, Abilities.PICKPOCKET, 340, 70, 70, 40, 60, 40, 60, 120, 70, 119, GrowthRate.MEDIUM_SLOW, "Field", "Grass", 50, 15, true),
    new PokemonSpecies(Species.SHIFTRY, "Shiftry", 3, false, false, false, "Wicked Pokémon", Type.GRASS, Type.DARK, 1.3, 59.6, Abilities.CHLOROPHYLL, Abilities.EARLY_BIRD, Abilities.PICKPOCKET, 480, 90, 100, 60, 90, 60, 80, 45, 70, 216, GrowthRate.MEDIUM_SLOW, "Field", "Grass", 50, 15, true),
    new PokemonSpecies(Species.TAILLOW, "Taillow", 3, false, false, false, "TinySwallow Pokémon", Type.NORMAL, Type.FLYING, 0.3, 2.3, Abilities.GUTS, Abilities.NONE, Abilities.SCRAPPY, 270, 40, 55, 30, 30, 30, 85, 200, 70, 54, GrowthRate.MEDIUM_SLOW, "Flying", null, 50, 15, false),
    new PokemonSpecies(Species.SWELLOW, "Swellow", 3, false, false, false, "Swallow Pokémon", Type.NORMAL, Type.FLYING, 0.7, 19.8, Abilities.GUTS, Abilities.NONE, Abilities.SCRAPPY, 455, 60, 85, 60, 75, 50, 125, 45, 70, 159, GrowthRate.MEDIUM_SLOW, "Flying", null, 50, 15, false),
    new PokemonSpecies(Species.WINGULL, "Wingull", 3, false, false, false, "Seagull Pokémon", Type.WATER, Type.FLYING, 0.6, 9.5, Abilities.KEEN_EYE, Abilities.HYDRATION, Abilities.RAIN_DISH, 270, 40, 30, 30, 55, 30, 85, 190, 70, 54, GrowthRate.MEDIUM_FAST, "Flying", "Water 1", 50, 20, false),
    new PokemonSpecies(Species.PELIPPER, "Pelipper", 3, false, false, false, "Water Bird Pokémon", Type.WATER, Type.FLYING, 1.2, 28, Abilities.KEEN_EYE, Abilities.DRIZZLE, Abilities.RAIN_DISH, 440, 60, 50, 100, 95, 70, 65, 45, 70, 154, GrowthRate.MEDIUM_FAST, "Flying", "Water 1", 50, 20, false),
    new PokemonSpecies(Species.RALTS, "Ralts", 3, false, false, false, "Feeling Pokémon", Type.PSYCHIC, Type.FAIRY, 0.4, 6.6, Abilities.SYNCHRONIZE, Abilities.TRACE, Abilities.TELEPATHY, 198, 28, 25, 25, 45, 35, 40, 235, 35, 40, GrowthRate.SLOW, "Amorphous", "Human-Like", 50, 20, false),
    new PokemonSpecies(Species.KIRLIA, "Kirlia", 3, false, false, false, "Emotion Pokémon", Type.PSYCHIC, Type.FAIRY, 0.8, 20.2, Abilities.SYNCHRONIZE, Abilities.TRACE, Abilities.TELEPATHY, 278, 38, 35, 35, 65, 55, 50, 120, 35, 97, GrowthRate.SLOW, "Amorphous", "Human-Like", 50, 20, false),
    new PokemonSpecies(Species.GARDEVOIR, "Gardevoir", 3, false, false, false, "Embrace Pokémon", Type.PSYCHIC, Type.FAIRY, 1.6, 48.4, Abilities.SYNCHRONIZE, Abilities.TRACE, Abilities.TELEPATHY, 518, 68, 65, 65, 125, 115, 80, 45, 35, 233, GrowthRate.SLOW, "Amorphous", "Human-Like", 50, 20, false),
    new PokemonSpecies(Species.SURSKIT, "Surskit", 3, false, false, false, "Pond Skater Pokémon", Type.BUG, Type.WATER, 0.5, 1.7, Abilities.SWIFT_SWIM, Abilities.NONE, Abilities.RAIN_DISH, 269, 40, 30, 32, 50, 52, 65, 200, 70, 54, GrowthRate.MEDIUM_FAST, "Bug", "Water 1", 50, 15, false),
    new PokemonSpecies(Species.MASQUERAIN, "Masquerain", 3, false, false, false, "Eyeball Pokémon", Type.BUG, Type.FLYING, 0.8, 3.6, Abilities.INTIMIDATE, Abilities.NONE, Abilities.UNNERVE, 454, 70, 60, 62, 100, 82, 80, 75, 70, 159, GrowthRate.MEDIUM_FAST, "Bug", "Water 1", 50, 15, false),
    new PokemonSpecies(Species.SHROOMISH, "Shroomish", 3, false, false, false, "Mushroom Pokémon", Type.GRASS, null, 0.4, 4.5, Abilities.EFFECT_SPORE, Abilities.POISON_HEAL, Abilities.QUICK_FEET, 295, 60, 40, 60, 40, 60, 35, 255, 70, 59, GrowthRate.FLUCTUATING, "Fairy", "Grass", 50, 15, false),
    new PokemonSpecies(Species.BRELOOM, "Breloom", 3, false, false, false, "Mushroom Pokémon", Type.GRASS, Type.FIGHTING, 1.2, 39.2, Abilities.EFFECT_SPORE, Abilities.POISON_HEAL, Abilities.TECHNICIAN, 460, 60, 130, 80, 60, 60, 70, 90, 70, 161, GrowthRate.FLUCTUATING, "Fairy", "Grass", 50, 15, false),
    new PokemonSpecies(Species.SLAKOTH, "Slakoth", 3, false, false, false, "Slacker Pokémon", Type.NORMAL, null, 0.8, 24, Abilities.TRUANT, Abilities.NONE, Abilities.NONE, 280, 60, 60, 60, 35, 35, 30, 255, 70, 56, GrowthRate.SLOW, "Field", null, 50, 15, false),
    new PokemonSpecies(Species.VIGOROTH, "Vigoroth", 3, false, false, false, "Wild Monkey Pokémon", Type.NORMAL, null, 1.4, 46.5, Abilities.VITAL_SPIRIT, Abilities.NONE, Abilities.NONE, 440, 80, 80, 80, 55, 55, 90, 120, 70, 154, GrowthRate.SLOW, "Field", null, 50, 15, false),
    new PokemonSpecies(Species.SLAKING, "Slaking", 3, false, false, false, "Lazy Pokémon", Type.NORMAL, null, 2, 130.5, Abilities.TRUANT, Abilities.NONE, Abilities.NONE, 670, 150, 160, 100, 95, 65, 100, 45, 70, 252, GrowthRate.SLOW, "Field", null, 50, 15, false),
    new PokemonSpecies(Species.NINCADA, "Nincada", 3, false, false, false, "Trainee Pokémon", Type.BUG, Type.GROUND, 0.5, 5.5, Abilities.COMPOUND_EYES, Abilities.NONE, Abilities.RUN_AWAY, 266, 31, 45, 90, 30, 30, 40, 255, 70, 53, GrowthRate.ERRATIC, "Bug", null, 50, 15, false),
    new PokemonSpecies(Species.NINJASK, "Ninjask", 3, false, false, false, "Ninja Pokémon", Type.BUG, Type.FLYING, 0.8, 12, Abilities.SPEED_BOOST, Abilities.NONE, Abilities.INFILTRATOR, 456, 61, 90, 45, 50, 50, 160, 120, 70, 160, GrowthRate.ERRATIC, "Bug", null, 50, 15, false),
    new PokemonSpecies(Species.SHEDINJA, "Shedinja", 3, false, false, false, "Shed Pokémon", Type.BUG, Type.GHOST, 0.8, 1.2, Abilities.WONDER_GUARD, Abilities.NONE, Abilities.NONE, 236, 1, 90, 45, 30, 30, 40, 45, 70, 83, GrowthRate.ERRATIC, "Mineral", null, null, 15, false),
    new PokemonSpecies(Species.WHISMUR, "Whismur", 3, false, false, false, "Whisper Pokémon", Type.NORMAL, null, 0.6, 16.3, Abilities.SOUNDPROOF, Abilities.NONE, Abilities.RATTLED, 240, 64, 51, 23, 51, 23, 28, 190, 70, 48, GrowthRate.MEDIUM_SLOW, "Field", "Monster", 50, 20, false),
    new PokemonSpecies(Species.LOUDRED, "Loudred", 3, false, false, false, "Big Voice Pokémon", Type.NORMAL, null, 1, 40.5, Abilities.SOUNDPROOF, Abilities.NONE, Abilities.SCRAPPY, 360, 84, 71, 43, 71, 43, 48, 120, 70, 126, GrowthRate.MEDIUM_SLOW, "Field", "Monster", 50, 20, false),
    new PokemonSpecies(Species.EXPLOUD, "Exploud", 3, false, false, false, "Loud Noise Pokémon", Type.NORMAL, null, 1.5, 84, Abilities.SOUNDPROOF, Abilities.NONE, Abilities.SCRAPPY, 490, 104, 91, 63, 91, 73, 68, 45, 70, 221, GrowthRate.MEDIUM_SLOW, "Field", "Monster", 50, 20, false),
    new PokemonSpecies(Species.MAKUHITA, "Makuhita", 3, false, false, false, "Guts Pokémon", Type.FIGHTING, null, 1, 86.4, Abilities.THICK_FAT, Abilities.GUTS, Abilities.SHEER_FORCE, 237, 72, 60, 30, 20, 30, 25, 180, 70, 47, GrowthRate.FLUCTUATING, "Human-Like", null, 75, 20, false),
    new PokemonSpecies(Species.HARIYAMA, "Hariyama", 3, false, false, false, "Arm Thrust Pokémon", Type.FIGHTING, null, 2.3, 253.8, Abilities.THICK_FAT, Abilities.GUTS, Abilities.SHEER_FORCE, 474, 144, 120, 60, 40, 60, 50, 200, 70, 166, GrowthRate.FLUCTUATING, "Human-Like", null, 75, 20, false),
    new PokemonSpecies(Species.AZURILL, "Azurill", 3, false, false, false, "Polka Dot Pokémon", Type.NORMAL, Type.FAIRY, 0.2, 2, Abilities.THICK_FAT, Abilities.HUGE_POWER, Abilities.SAP_SIPPER, 190, 50, 20, 40, 20, 40, 20, 150, 70, 38, GrowthRate.FAST, "Undiscovered", null, 25, 10, false),
    new PokemonSpecies(Species.NOSEPASS, "Nosepass", 3, false, false, false, "Compass Pokémon", Type.ROCK, null, 1, 97, Abilities.STURDY, Abilities.MAGNET_PULL, Abilities.SAND_FORCE, 375, 30, 45, 135, 45, 90, 30, 255, 70, 75, GrowthRate.MEDIUM_FAST, "Mineral", null, 50, 20, false),
    new PokemonSpecies(Species.SKITTY, "Skitty", 3, false, false, false, "Kitten Pokémon", Type.NORMAL, null, 0.6, 11, Abilities.CUTE_CHARM, Abilities.NORMALIZE, Abilities.WONDER_SKIN, 260, 50, 45, 45, 35, 35, 50, 255, 70, 52, GrowthRate.FAST, "Fairy", "Field", 25, 15, false),
    new PokemonSpecies(Species.DELCATTY, "Delcatty", 3, false, false, false, "Prim Pokémon", Type.NORMAL, null, 1.1, 32.6, Abilities.CUTE_CHARM, Abilities.NORMALIZE, Abilities.WONDER_SKIN, 400, 70, 65, 65, 55, 55, 90, 60, 70, 140, GrowthRate.FAST, "Fairy", "Field", 25, 15, false),
    new PokemonSpecies(Species.SABLEYE, "Sableye", 3, false, false, false, "Darkness Pokémon", Type.DARK, Type.GHOST, 0.5, 11, Abilities.KEEN_EYE, Abilities.STALL, Abilities.PRANKSTER, 380, 50, 75, 75, 65, 65, 50, 45, 35, 133, GrowthRate.MEDIUM_SLOW, "Human-Like", null, 50, 25, false),
    new PokemonSpecies(Species.MAWILE, "Mawile", 3, false, false, false, "Deceiver Pokémon", Type.STEEL, Type.FAIRY, 0.6, 11.5, Abilities.HYPER_CUTTER, Abilities.INTIMIDATE, Abilities.SHEER_FORCE, 380, 50, 85, 85, 55, 55, 50, 45, 70, 133, GrowthRate.FAST, "Fairy", "Field", 50, 20, false),
    new PokemonSpecies(Species.ARON, "Aron", 3, false, false, false, "Iron Armor Pokémon", Type.STEEL, Type.ROCK, 0.4, 60, Abilities.STURDY, Abilities.ROCK_HEAD, Abilities.HEAVY_METAL, 330, 50, 70, 100, 40, 40, 30, 180, 35, 66, GrowthRate.SLOW, "Monster", null, 50, 35, false),
    new PokemonSpecies(Species.LAIRON, "Lairon", 3, false, false, false, "Iron Armor Pokémon", Type.STEEL, Type.ROCK, 0.9, 120, Abilities.STURDY, Abilities.ROCK_HEAD, Abilities.HEAVY_METAL, 430, 60, 90, 140, 50, 50, 40, 90, 35, 151, GrowthRate.SLOW, "Monster", null, 50, 35, false),
    new PokemonSpecies(Species.AGGRON, "Aggron", 3, false, false, false, "Iron Armor Pokémon", Type.STEEL, Type.ROCK, 2.1, 360, Abilities.STURDY, Abilities.ROCK_HEAD, Abilities.HEAVY_METAL, 530, 70, 110, 180, 60, 60, 50, 45, 35, 239, GrowthRate.SLOW, "Monster", null, 50, 35, false),
    new PokemonSpecies(Species.MEDITITE, "Meditite", 3, false, false, false, "Meditate Pokémon", Type.FIGHTING, Type.PSYCHIC, 0.6, 11.2, Abilities.PURE_POWER, Abilities.NONE, Abilities.TELEPATHY, 280, 30, 40, 55, 40, 55, 60, 180, 70, 56, GrowthRate.MEDIUM_FAST, "Human-Like", null, 50, 20, true),
    new PokemonSpecies(Species.MEDICHAM, "Medicham", 3, false, false, false, "Meditate Pokémon", Type.FIGHTING, Type.PSYCHIC, 1.3, 31.5, Abilities.PURE_POWER, Abilities.NONE, Abilities.TELEPATHY, 410, 60, 60, 75, 60, 75, 80, 90, 70, 144, GrowthRate.MEDIUM_FAST, "Human-Like", null, 50, 20, true),
    new PokemonSpecies(Species.ELECTRIKE, "Electrike", 3, false, false, false, "Lightning Pokémon", Type.ELECTRIC, null, 0.6, 15.2, Abilities.STATIC, Abilities.LIGHTNING_ROD, Abilities.MINUS, 295, 40, 45, 40, 65, 40, 65, 120, 70, 59, GrowthRate.SLOW, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.MANECTRIC, "Manectric", 3, false, false, false, "Discharge Pokémon", Type.ELECTRIC, null, 1.5, 40.2, Abilities.STATIC, Abilities.LIGHTNING_ROD, Abilities.MINUS, 475, 70, 75, 60, 105, 60, 105, 45, 70, 166, GrowthRate.SLOW, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.PLUSLE, "Plusle", 3, false, false, false, "Cheering Pokémon", Type.ELECTRIC, null, 0.4, 4.2, Abilities.PLUS, Abilities.NONE, Abilities.LIGHTNING_ROD, 405, 60, 50, 40, 85, 75, 95, 200, 70, 142, GrowthRate.MEDIUM_FAST, "Fairy", null, 50, 20, false),
    new PokemonSpecies(Species.MINUN, "Minun", 3, false, false, false, "Cheering Pokémon", Type.ELECTRIC, null, 0.4, 4.2, Abilities.MINUS, Abilities.NONE, Abilities.VOLT_ABSORB, 405, 60, 40, 50, 75, 85, 95, 200, 70, 142, GrowthRate.MEDIUM_FAST, "Fairy", null, 50, 20, false),
    new PokemonSpecies(Species.VOLBEAT, "Volbeat", 3, false, false, false, "Firefly Pokémon", Type.BUG, null, 0.7, 17.7, Abilities.ILLUMINATE, Abilities.SWARM, Abilities.PRANKSTER, 430, 65, 73, 75, 47, 85, 85, 150, 70, 151, GrowthRate.ERRATIC, "Bug", "Human-Like", 100, 15, false),
    new PokemonSpecies(Species.ILLUMISE, "Illumise", 3, false, false, false, "Firefly Pokémon", Type.BUG, null, 0.6, 17.7, Abilities.OBLIVIOUS, Abilities.TINTED_LENS, Abilities.PRANKSTER, 430, 65, 47, 75, 73, 85, 85, 150, 70, 151, GrowthRate.FLUCTUATING, "Bug", "Human-Like", 0, 15, false),
    new PokemonSpecies(Species.ROSELIA, "Roselia", 3, false, false, false, "Thorn Pokémon", Type.GRASS, Type.POISON, 0.3, 2, Abilities.NATURAL_CURE, Abilities.POISON_POINT, Abilities.LEAF_GUARD, 400, 50, 60, 45, 100, 80, 65, 150, 70, 140, GrowthRate.MEDIUM_SLOW, "Fairy", "Grass", 50, 20, true),
    new PokemonSpecies(Species.GULPIN, "Gulpin", 3, false, false, false, "Stomach Pokémon", Type.POISON, null, 0.4, 10.3, Abilities.LIQUID_OOZE, Abilities.STICKY_HOLD, Abilities.GLUTTONY, 302, 70, 43, 53, 43, 53, 40, 225, 70, 60, GrowthRate.FLUCTUATING, "Amorphous", null, 50, 20, true),
    new PokemonSpecies(Species.SWALOT, "Swalot", 3, false, false, false, "Poison Bag Pokémon", Type.POISON, null, 1.7, 80, Abilities.LIQUID_OOZE, Abilities.STICKY_HOLD, Abilities.GLUTTONY, 467, 100, 73, 83, 73, 83, 55, 75, 70, 163, GrowthRate.FLUCTUATING, "Amorphous", null, 50, 20, true),
    new PokemonSpecies(Species.CARVANHA, "Carvanha", 3, false, false, false, "Savage Pokémon", Type.WATER, Type.DARK, 0.8, 20.8, Abilities.ROUGH_SKIN, Abilities.NONE, Abilities.SPEED_BOOST, 305, 45, 90, 20, 65, 20, 65, 225, 35, 61, GrowthRate.SLOW, "Water 2", null, 50, 20, false),
    new PokemonSpecies(Species.SHARPEDO, "Sharpedo", 3, false, false, false, "Brutal Pokémon", Type.WATER, Type.DARK, 1.8, 88.8, Abilities.ROUGH_SKIN, Abilities.NONE, Abilities.SPEED_BOOST, 460, 70, 120, 40, 95, 40, 95, 60, 35, 161, GrowthRate.SLOW, "Water 2", null, 50, 20, false),
    new PokemonSpecies(Species.WAILMER, "Wailmer", 3, false, false, false, "Ball Whale Pokémon", Type.WATER, null, 2, 130, Abilities.WATER_VEIL, Abilities.OBLIVIOUS, Abilities.PRESSURE, 400, 130, 70, 35, 70, 35, 60, 125, 70, 80, GrowthRate.FLUCTUATING, "Field", "Water 2", 50, 40, false),
    new PokemonSpecies(Species.WAILORD, "Wailord", 3, false, false, false, "Float Whale Pokémon", Type.WATER, null, 14.5, 398, Abilities.WATER_VEIL, Abilities.OBLIVIOUS, Abilities.PRESSURE, 500, 170, 90, 45, 90, 45, 60, 60, 70, 175, GrowthRate.FLUCTUATING, "Field", "Water 2", 50, 40, false),
    new PokemonSpecies(Species.NUMEL, "Numel", 3, false, false, false, "Numb Pokémon", Type.FIRE, Type.GROUND, 0.7, 24, Abilities.OBLIVIOUS, Abilities.SIMPLE, Abilities.OWN_TEMPO, 305, 60, 60, 40, 65, 45, 35, 255, 70, 61, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, true),
    new PokemonSpecies(Species.CAMERUPT, "Camerupt", 3, false, false, false, "Eruption Pokémon", Type.FIRE, Type.GROUND, 1.9, 220, Abilities.MAGMA_ARMOR, Abilities.SOLID_ROCK, Abilities.ANGER_POINT, 460, 70, 100, 70, 105, 75, 40, 150, 70, 161, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, true),
    new PokemonSpecies(Species.TORKOAL, "Torkoal", 3, false, false, false, "Coal Pokémon", Type.FIRE, null, 0.5, 80.4, Abilities.WHITE_SMOKE, Abilities.DROUGHT, Abilities.SHELL_ARMOR, 470, 70, 85, 140, 85, 70, 20, 90, 70, 165, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.SPOINK, "Spoink", 3, false, false, false, "Bounce Pokémon", Type.PSYCHIC, null, 0.7, 30.6, Abilities.THICK_FAT, Abilities.OWN_TEMPO, Abilities.GLUTTONY, 330, 60, 25, 35, 70, 80, 60, 255, 70, 66, GrowthRate.FAST, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.GRUMPIG, "Grumpig", 3, false, false, false, "Manipulate Pokémon", Type.PSYCHIC, null, 0.9, 71.5, Abilities.THICK_FAT, Abilities.OWN_TEMPO, Abilities.GLUTTONY, 470, 80, 45, 65, 90, 110, 80, 60, 70, 165, GrowthRate.FAST, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.SPINDA, "Spinda", 3, false, false, false, "Spot Panda Pokémon", Type.NORMAL, null, 1.1, 5, Abilities.OWN_TEMPO, Abilities.TANGLED_FEET, Abilities.CONTRARY, 360, 60, 60, 60, 60, 60, 60, 255, 70, 126, GrowthRate.FAST, "Field", "Human-Like", 50, 15, false),
    new PokemonSpecies(Species.TRAPINCH, "Trapinch", 3, false, false, false, "Ant Pit Pokémon", Type.GROUND, null, 0.7, 15, Abilities.HYPER_CUTTER, Abilities.ARENA_TRAP, Abilities.SHEER_FORCE, 290, 45, 100, 45, 45, 45, 10, 255, 70, 58, GrowthRate.MEDIUM_SLOW, "Bug", "Dragon", 50, 20, false),
    new PokemonSpecies(Species.VIBRAVA, "Vibrava", 3, false, false, false, "Vibration Pokémon", Type.GROUND, Type.DRAGON, 1.1, 15.3, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 340, 50, 70, 50, 50, 50, 70, 120, 70, 119, GrowthRate.MEDIUM_SLOW, "Bug", "Dragon", 50, 20, false),
    new PokemonSpecies(Species.FLYGON, "Flygon", 3, false, false, false, "Mystic Pokémon", Type.GROUND, Type.DRAGON, 2, 82, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 520, 80, 100, 80, 80, 80, 100, 45, 70, 234, GrowthRate.MEDIUM_SLOW, "Bug", "Dragon", 50, 20, false),
    new PokemonSpecies(Species.CACNEA, "Cacnea", 3, false, false, false, "Cactus Pokémon", Type.GRASS, null, 0.4, 51.3, Abilities.SAND_VEIL, Abilities.NONE, Abilities.WATER_ABSORB, 335, 50, 85, 40, 85, 40, 35, 190, 35, 67, GrowthRate.MEDIUM_SLOW, "Grass", "Human-Like", 50, 20, false),
    new PokemonSpecies(Species.CACTURNE, "Cacturne", 3, false, false, false, "Scarecrow Pokémon", Type.GRASS, Type.DARK, 1.3, 77.4, Abilities.SAND_VEIL, Abilities.NONE, Abilities.WATER_ABSORB, 475, 70, 115, 60, 115, 60, 55, 60, 35, 166, GrowthRate.MEDIUM_SLOW, "Grass", "Human-Like", 50, 20, true),
    new PokemonSpecies(Species.SWABLU, "Swablu", 3, false, false, false, "Cotton Bird Pokémon", Type.NORMAL, Type.FLYING, 0.4, 1.2, Abilities.NATURAL_CURE, Abilities.NONE, Abilities.CLOUD_NINE, 310, 45, 40, 60, 40, 75, 50, 255, 70, 62, GrowthRate.ERRATIC, "Dragon", "Flying", 50, 20, false),
    new PokemonSpecies(Species.ALTARIA, "Altaria", 3, false, false, false, "Humming Pokémon", Type.DRAGON, Type.FLYING, 1.1, 20.6, Abilities.NATURAL_CURE, Abilities.NONE, Abilities.CLOUD_NINE, 490, 75, 70, 90, 70, 105, 80, 45, 70, 172, GrowthRate.ERRATIC, "Dragon", "Flying", 50, 20, false),
    new PokemonSpecies(Species.ZANGOOSE, "Zangoose", 3, false, false, false, "Cat Ferret Pokémon", Type.NORMAL, null, 1.3, 40.3, Abilities.IMMUNITY, Abilities.NONE, Abilities.TOXIC_BOOST, 458, 73, 115, 60, 60, 60, 90, 90, 70, 160, GrowthRate.ERRATIC, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.SEVIPER, "Seviper", 3, false, false, false, "Fang Snake Pokémon", Type.POISON, null, 2.7, 52.5, Abilities.SHED_SKIN, Abilities.NONE, Abilities.INFILTRATOR, 458, 73, 100, 60, 100, 60, 65, 90, 70, 160, GrowthRate.FLUCTUATING, "Dragon", "Field", 50, 20, false),
    new PokemonSpecies(Species.LUNATONE, "Lunatone", 3, false, false, false, "Meteorite Pokémon", Type.ROCK, Type.PSYCHIC, 1, 168, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 460, 90, 55, 65, 95, 85, 70, 45, 70, 161, GrowthRate.FAST, "Mineral", null, null, 25, false),
    new PokemonSpecies(Species.SOLROCK, "Solrock", 3, false, false, false, "Meteorite Pokémon", Type.ROCK, Type.PSYCHIC, 1.2, 154, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 460, 90, 95, 85, 55, 65, 70, 45, 70, 161, GrowthRate.FAST, "Mineral", null, null, 25, false),
    new PokemonSpecies(Species.BARBOACH, "Barboach", 3, false, false, false, "Whiskers Pokémon", Type.WATER, Type.GROUND, 0.4, 1.9, Abilities.OBLIVIOUS, Abilities.ANTICIPATION, Abilities.HYDRATION, 288, 50, 48, 43, 46, 41, 60, 190, 70, 58, GrowthRate.MEDIUM_FAST, "Water 2", null, 50, 20, false),
    new PokemonSpecies(Species.WHISCASH, "Whiscash", 3, false, false, false, "Whiskers Pokémon", Type.WATER, Type.GROUND, 0.9, 23.6, Abilities.OBLIVIOUS, Abilities.ANTICIPATION, Abilities.HYDRATION, 468, 110, 78, 73, 76, 71, 60, 75, 70, 164, GrowthRate.MEDIUM_FAST, "Water 2", null, 50, 20, false),
    new PokemonSpecies(Species.CORPHISH, "Corphish", 3, false, false, false, "Ruffian Pokémon", Type.WATER, null, 0.6, 11.5, Abilities.HYPER_CUTTER, Abilities.SHELL_ARMOR, Abilities.ADAPTABILITY, 308, 43, 80, 65, 50, 35, 35, 205, 70, 62, GrowthRate.FLUCTUATING, "Water 1", "Water 3", 50, 15, false),
    new PokemonSpecies(Species.CRAWDAUNT, "Crawdaunt", 3, false, false, false, "Rogue Pokémon", Type.WATER, Type.DARK, 1.1, 32.8, Abilities.HYPER_CUTTER, Abilities.SHELL_ARMOR, Abilities.ADAPTABILITY, 468, 63, 120, 85, 90, 55, 55, 155, 70, 164, GrowthRate.FLUCTUATING, "Water 1", "Water 3", 50, 15, false),
    new PokemonSpecies(Species.BALTOY, "Baltoy", 3, false, false, false, "Clay Doll Pokémon", Type.GROUND, Type.PSYCHIC, 0.5, 21.5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 300, 40, 40, 55, 40, 70, 55, 255, 70, 60, GrowthRate.MEDIUM_FAST, "Mineral", null, null, 20, false),
    new PokemonSpecies(Species.CLAYDOL, "Claydol", 3, false, false, false, "Clay Doll Pokémon", Type.GROUND, Type.PSYCHIC, 1.5, 108, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 500, 60, 70, 105, 70, 120, 75, 90, 70, 175, GrowthRate.MEDIUM_FAST, "Mineral", null, null, 20, false),
    new PokemonSpecies(Species.LILEEP, "Lileep", 3, false, false, false, "Sea Lily Pokémon", Type.ROCK, Type.GRASS, 1, 23.8, Abilities.SUCTION_CUPS, Abilities.NONE, Abilities.STORM_DRAIN, 355, 66, 41, 77, 61, 87, 23, 45, 70, 71, GrowthRate.ERRATIC, "Water 3", null, 87.5, 30, false),
    new PokemonSpecies(Species.CRADILY, "Cradily", 3, false, false, false, "Barnacle Pokémon", Type.ROCK, Type.GRASS, 1.5, 60.4, Abilities.SUCTION_CUPS, Abilities.NONE, Abilities.STORM_DRAIN, 495, 86, 81, 97, 81, 107, 43, 45, 70, 173, GrowthRate.ERRATIC, "Water 3", null, 87.5, 30, false),
    new PokemonSpecies(Species.ANORITH, "Anorith", 3, false, false, false, "Old Shrimp Pokémon", Type.ROCK, Type.BUG, 0.7, 12.5, Abilities.BATTLE_ARMOR, Abilities.NONE, Abilities.SWIFT_SWIM, 355, 45, 95, 50, 40, 50, 75, 45, 70, 71, GrowthRate.ERRATIC, "Water 3", null, 87.5, 30, false),
    new PokemonSpecies(Species.ARMALDO, "Armaldo", 3, false, false, false, "Plate Pokémon", Type.ROCK, Type.BUG, 1.5, 68.2, Abilities.BATTLE_ARMOR, Abilities.NONE, Abilities.SWIFT_SWIM, 495, 75, 125, 100, 70, 80, 45, 45, 70, 173, GrowthRate.ERRATIC, "Water 3", null, 87.5, 30, false),
    new PokemonSpecies(Species.FEEBAS, "Feebas", 3, false, false, false, "Fish Pokémon", Type.WATER, null, 0.6, 7.4, Abilities.SWIFT_SWIM, Abilities.OBLIVIOUS, Abilities.ADAPTABILITY, 200, 20, 15, 20, 10, 55, 80, 255, 70, 40, GrowthRate.ERRATIC, "Dragon", "Water 1", 50, 20, false),
    new PokemonSpecies(Species.MILOTIC, "Milotic", 3, false, false, false, "Tender Pokémon", Type.WATER, null, 6.2, 162, Abilities.MARVEL_SCALE, Abilities.COMPETITIVE, Abilities.CUTE_CHARM, 540, 95, 60, 79, 100, 125, 81, 60, 70, 189, GrowthRate.ERRATIC, "Dragon", "Water 1", 50, 20, true),
    new PokemonSpecies(Species.CASTFORM, "Castform", 3, false, false, false, "Weather Pokémon", Type.NORMAL, null, 0.3, 0.8, Abilities.FORECAST, Abilities.NONE, Abilities.NONE, 420, 70, 70, 70, 70, 70, 70, 45, 70, 147, GrowthRate.MEDIUM_FAST, "Amorphous", "Fairy", 50, 25, false, true,
      new PokemonForm("Normal Form", "", Type.NORMAL, null, 0.3, 0.8, Abilities.FORECAST, Abilities.NONE, Abilities.NONE, 420, 70, 70, 70, 70, 70, 70, 45, 70, 147, GrowthRate.MEDIUM_FAST, "Amorphous", "Fairy", 50, 25, false),
      new PokemonForm("Sunny Form", "sunny", Type.FIRE, null, 0.3, 0.8, Abilities.FORECAST, Abilities.NONE, Abilities.NONE, 420, 70, 70, 70, 70, 70, 70, 45, 70, 147, GrowthRate.MEDIUM_FAST, "Amorphous", "Fairy", 50, 25, false),
      new PokemonForm("Rainy Form", "rainy", Type.WATER, null, 0.3, 0.8, Abilities.FORECAST, Abilities.NONE, Abilities.NONE, 420, 70, 70, 70, 70, 70, 70, 45, 70, 147, GrowthRate.MEDIUM_FAST, "Amorphous", "Fairy", 50, 25, false),
      new PokemonForm("Snowy Form", "snowy", Type.ICE, null, 0.3, 0.8, Abilities.FORECAST, Abilities.NONE, Abilities.NONE, 420, 70, 70, 70, 70, 70, 70, 45, 70, 147, GrowthRate.MEDIUM_FAST, "Amorphous", "Fairy", 50, 25, false)
    ),
    new PokemonSpecies(Species.KECLEON, "Kecleon", 3, false, false, false, "Color Swap Pokémon", Type.NORMAL, null, 1, 22, Abilities.COLOR_CHANGE, Abilities.NONE, Abilities.PROTEAN, 440, 60, 90, 70, 60, 120, 40, 200, 70, 154, GrowthRate.MEDIUM_SLOW, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.SHUPPET, "Shuppet", 3, false, false, false, "Puppet Pokémon", Type.GHOST, null, 0.6, 2.3, Abilities.INSOMNIA, Abilities.FRISK, Abilities.CURSED_BODY, 295, 44, 75, 35, 63, 33, 45, 225, 35, 59, GrowthRate.FAST, "Amorphous", null, 50, 25, false),
    new PokemonSpecies(Species.BANETTE, "Banette", 3, false, false, false, "Marionette Pokémon", Type.GHOST, null, 1.1, 12.5, Abilities.INSOMNIA, Abilities.FRISK, Abilities.CURSED_BODY, 455, 64, 115, 65, 83, 63, 65, 45, 35, 159, GrowthRate.FAST, "Amorphous", null, 50, 25, false),
    new PokemonSpecies(Species.DUSKULL, "Duskull", 3, false, false, false, "Requiem Pokémon", Type.GHOST, null, 0.8, 15, Abilities.LEVITATE, Abilities.NONE, Abilities.FRISK, 295, 20, 40, 90, 30, 90, 25, 190, 35, 59, GrowthRate.FAST, "Amorphous", null, 50, 25, false),
    new PokemonSpecies(Species.DUSCLOPS, "Dusclops", 3, false, false, false, "Beckon Pokémon", Type.GHOST, null, 1.6, 30.6, Abilities.PRESSURE, Abilities.NONE, Abilities.FRISK, 455, 40, 70, 130, 60, 130, 25, 90, 35, 159, GrowthRate.FAST, "Amorphous", null, 50, 25, false),
    new PokemonSpecies(Species.TROPIUS, "Tropius", 3, false, false, false, "Fruit Pokémon", Type.GRASS, Type.FLYING, 2, 100, Abilities.CHLOROPHYLL, Abilities.SOLAR_POWER, Abilities.HARVEST, 460, 99, 68, 83, 72, 87, 51, 200, 70, 161, GrowthRate.SLOW, "Grass", "Monster", 50, 25, false),
    new PokemonSpecies(Species.CHIMECHO, "Chimecho", 3, false, false, false, "Wind Chime Pokémon", Type.PSYCHIC, null, 0.6, 1, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 455, 75, 50, 80, 95, 90, 65, 45, 70, 159, GrowthRate.FAST, "Amorphous", null, 50, 25, false),
    new PokemonSpecies(Species.ABSOL, "Absol", 3, false, false, false, "Disaster Pokémon", Type.DARK, null, 1.2, 47, Abilities.PRESSURE, Abilities.SUPER_LUCK, Abilities.JUSTIFIED, 465, 65, 130, 60, 75, 60, 75, 30, 35, 163, GrowthRate.MEDIUM_SLOW, "Field", null, 50, 25, false),
    new PokemonSpecies(Species.WYNAUT, "Wynaut", 3, false, false, false, "Bright Pokémon", Type.PSYCHIC, null, 0.6, 14, Abilities.SHADOW_TAG, Abilities.NONE, Abilities.TELEPATHY, 260, 95, 23, 48, 23, 48, 23, 125, 70, 52, GrowthRate.MEDIUM_FAST, "Undiscovered", null, 50, 20, false),
    new PokemonSpecies(Species.SNORUNT, "Snorunt", 3, false, false, false, "Snow Hat Pokémon", Type.ICE, null, 0.7, 16.8, Abilities.INNER_FOCUS, Abilities.ICE_BODY, Abilities.MOODY, 300, 50, 50, 50, 50, 50, 50, 190, 70, 60, GrowthRate.MEDIUM_FAST, "Fairy", "Mineral", 50, 20, false),
    new PokemonSpecies(Species.GLALIE, "Glalie", 3, false, false, false, "Face Pokémon", Type.ICE, null, 1.5, 256.5, Abilities.INNER_FOCUS, Abilities.ICE_BODY, Abilities.MOODY, 480, 80, 80, 80, 80, 80, 80, 75, 70, 168, GrowthRate.MEDIUM_FAST, "Fairy", "Mineral", 50, 20, false),
    new PokemonSpecies(Species.SPHEAL, "Spheal", 3, false, false, false, "Clap Pokémon", Type.ICE, Type.WATER, 0.8, 39.5, Abilities.THICK_FAT, Abilities.ICE_BODY, Abilities.OBLIVIOUS, 290, 70, 40, 50, 55, 50, 25, 255, 70, 58, GrowthRate.MEDIUM_SLOW, "Field", "Water 1", 50, 20, false),
    new PokemonSpecies(Species.SEALEO, "Sealeo", 3, false, false, false, "Ball Roll Pokémon", Type.ICE, Type.WATER, 1.1, 87.6, Abilities.THICK_FAT, Abilities.ICE_BODY, Abilities.OBLIVIOUS, 410, 90, 60, 70, 75, 70, 45, 120, 70, 144, GrowthRate.MEDIUM_SLOW, "Field", "Water 1", 50, 20, false),
    new PokemonSpecies(Species.WALREIN, "Walrein", 3, false, false, false, "Ice Break Pokémon", Type.ICE, Type.WATER, 1.4, 150.6, Abilities.THICK_FAT, Abilities.ICE_BODY, Abilities.OBLIVIOUS, 530, 110, 80, 90, 95, 90, 65, 45, 70, 239, GrowthRate.MEDIUM_SLOW, "Field", "Water 1", 50, 20, false),
    new PokemonSpecies(Species.CLAMPERL, "Clamperl", 3, false, false, false, "Bivalve Pokémon", Type.WATER, null, 0.4, 52.5, Abilities.SHELL_ARMOR, Abilities.NONE, Abilities.RATTLED, 345, 35, 64, 85, 74, 55, 32, 255, 70, 69, GrowthRate.ERRATIC, "Water 1", null, 50, 20, false),
    new PokemonSpecies(Species.HUNTAIL, "Huntail", 3, false, false, false, "Deep Sea Pokémon", Type.WATER, null, 1.7, 27, Abilities.SWIFT_SWIM, Abilities.NONE, Abilities.WATER_VEIL, 485, 55, 104, 105, 94, 75, 52, 60, 70, 170, GrowthRate.ERRATIC, "Water 1", null, 50, 20, false),
    new PokemonSpecies(Species.GOREBYSS, "Gorebyss", 3, false, false, false, "South Sea Pokémon", Type.WATER, null, 1.8, 22.6, Abilities.SWIFT_SWIM, Abilities.NONE, Abilities.HYDRATION, 485, 55, 84, 105, 114, 75, 52, 60, 70, 170, GrowthRate.ERRATIC, "Water 1", null, 50, 20, false),
    new PokemonSpecies(Species.RELICANTH, "Relicanth", 3, false, false, false, "Longevity Pokémon", Type.WATER, Type.ROCK, 1, 23.4, Abilities.SWIFT_SWIM, Abilities.ROCK_HEAD, Abilities.STURDY, 485, 100, 90, 130, 45, 65, 55, 25, 70, 170, GrowthRate.SLOW, "Water 1", "Water 2", 87.5, 40, true),
    new PokemonSpecies(Species.LUVDISC, "Luvdisc", 3, false, false, false, "Rendezvous Pokémon", Type.WATER, null, 0.6, 8.7, Abilities.SWIFT_SWIM, Abilities.NONE, Abilities.HYDRATION, 330, 43, 30, 55, 40, 65, 97, 225, 70, 116, GrowthRate.FAST, "Water 2", null, 25, 20, false),
    new PokemonSpecies(Species.BAGON, "Bagon", 3, false, false, false, "Rock Head Pokémon", Type.DRAGON, null, 0.6, 42.1, Abilities.ROCK_HEAD, Abilities.NONE, Abilities.SHEER_FORCE, 300, 45, 75, 60, 40, 30, 50, 45, 35, 60, GrowthRate.SLOW, "Dragon", null, 50, 40, false),
    new PokemonSpecies(Species.SHELGON, "Shelgon", 3, false, false, false, "Endurance Pokémon", Type.DRAGON, null, 1.1, 110.5, Abilities.ROCK_HEAD, Abilities.NONE, Abilities.OVERCOAT, 420, 65, 95, 100, 60, 50, 50, 45, 35, 147, GrowthRate.SLOW, "Dragon", null, 50, 40, false),
    new PokemonSpecies(Species.SALAMENCE, "Salamence", 3, false, false, false, "Dragon Pokémon", Type.DRAGON, Type.FLYING, 1.5, 102.6, Abilities.INTIMIDATE, Abilities.NONE, Abilities.MOXIE, 600, 95, 135, 80, 110, 80, 100, 45, 35, 270, GrowthRate.SLOW, "Dragon", null, 50, 40, false),
    new PokemonSpecies(Species.BELDUM, "Beldum", 3, false, false, false, "Iron Ball Pokémon", Type.STEEL, Type.PSYCHIC, 0.6, 95.2, Abilities.CLEAR_BODY, Abilities.NONE, Abilities.LIGHT_METAL, 300, 40, 55, 80, 35, 60, 30, 3, 35, 60, GrowthRate.SLOW, "Mineral", null, null, 40, false),
    new PokemonSpecies(Species.METANG, "Metang", 3, false, false, false, "Iron Claw Pokémon", Type.STEEL, Type.PSYCHIC, 1.2, 202.5, Abilities.CLEAR_BODY, Abilities.NONE, Abilities.LIGHT_METAL, 420, 60, 75, 100, 55, 80, 50, 3, 35, 147, GrowthRate.SLOW, "Mineral", null, null, 40, false),
    new PokemonSpecies(Species.METAGROSS, "Metagross", 3, false, false, false, "Iron Leg Pokémon", Type.STEEL, Type.PSYCHIC, 1.6, 550, Abilities.CLEAR_BODY, Abilities.NONE, Abilities.LIGHT_METAL, 600, 80, 135, 130, 95, 90, 70, 3, 35, 270, GrowthRate.SLOW, "Mineral", null, null, 40, false),
    new PokemonSpecies(Species.REGIROCK, "Regirock", 3, true, false, false, "Rock Peak Pokémon", Type.ROCK, null, 1.7, 230, Abilities.CLEAR_BODY, Abilities.NONE, Abilities.STURDY, 580, 80, 100, 200, 50, 100, 50, 3, 35, 261, GrowthRate.SLOW, "Undiscovered", null, null, 80, false),
    new PokemonSpecies(Species.REGICE, "Regice", 3, true, false, false, "Iceberg Pokémon", Type.ICE, null, 1.8, 175, Abilities.CLEAR_BODY, Abilities.NONE, Abilities.ICE_BODY, 580, 80, 50, 100, 100, 200, 50, 3, 35, 261, GrowthRate.SLOW, "Undiscovered", null, null, 80, false),
    new PokemonSpecies(Species.REGISTEEL, "Registeel", 3, true, false, false, "Iron Pokémon", Type.STEEL, null, 1.9, 205, Abilities.CLEAR_BODY, Abilities.NONE, Abilities.LIGHT_METAL, 580, 80, 75, 150, 75, 150, 50, 3, 35, 261, GrowthRate.SLOW, "Undiscovered", null, null, 80, false),
    new PokemonSpecies(Species.LATIAS, "Latias", 3, true, false, false, "Eon Pokémon", Type.DRAGON, Type.PSYCHIC, 1.4, 40, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 600, 80, 80, 90, 110, 130, 110, 3, 90, 270, GrowthRate.SLOW, "Undiscovered", null, 0, 120, false),
    new PokemonSpecies(Species.LATIOS, "Latios", 3, true, false, false, "Eon Pokémon", Type.DRAGON, Type.PSYCHIC, 2, 60, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 600, 80, 90, 80, 130, 110, 110, 3, 90, 270, GrowthRate.SLOW, "Undiscovered", null, 100, 120, false),
    new PokemonSpecies(Species.KYOGRE, "Kyogre", 3, false, true, false, "Sea Basin Pokémon", Type.WATER, null, 4.5, 352, Abilities.DRIZZLE, Abilities.NONE, Abilities.NONE, 670, 100, 100, 90, 150, 140, 90, 3, 0, 302, GrowthRate.SLOW, "Undiscovered", null, null, 120, false),
    new PokemonSpecies(Species.GROUDON, "Groudon", 3, false, true, false, "Continent Pokémon", Type.GROUND, null, 3.5, 950, Abilities.DROUGHT, Abilities.NONE, Abilities.NONE, 670, 100, 150, 140, 100, 90, 90, 3, 0, 302, GrowthRate.SLOW, "Undiscovered", null, null, 120, false),
    new PokemonSpecies(Species.RAYQUAZA, "Rayquaza", 3, false, true, false, "Sky High Pokémon", Type.DRAGON, Type.FLYING, 7, 206.5, Abilities.AIR_LOCK, Abilities.NONE, Abilities.NONE, 680, 105, 150, 90, 150, 90, 95, 45, 0, 306, GrowthRate.SLOW, "Undiscovered", null, null, 120, false, false,
      new PokemonForm("Normal", "", Type.DRAGON, Type.FLYING, 7, 206.5, Abilities.AIR_LOCK, Abilities.NONE, Abilities.NONE, 680, 105, 150, 90, 150, 90, 95, 45, 0, 306, GrowthRate.SLOW, "Undiscovered", null, null, 120, false),
      new PokemonForm("Mega", "mega", Type.DRAGON, Type.FLYING, 7, 206.5, Abilities.DELTA_STREAM, Abilities.NONE, Abilities.NONE, 780, 105, 180, 100, 180, 100, 115, 45, 0, 306, GrowthRate.SLOW, "Undiscovered", null, null, 120, false)
    ),
    new PokemonSpecies(Species.JIRACHI, "Jirachi", 3, false, false, true, "Wish Pokémon", Type.STEEL, Type.PSYCHIC, 0.3, 1.1, Abilities.SERENE_GRACE, Abilities.NONE, Abilities.NONE, 600, 100, 100, 100, 100, 100, 100, 3, 100, 270, GrowthRate.SLOW, "Undiscovered", null, null, 120, false),
    new PokemonSpecies(Species.DEOXYS, "Deoxys", 3, false, false, true, "DNA Pokémon", Type.PSYCHIC, null, 1.7, 60.8, Abilities.PRESSURE, Abilities.NONE, Abilities.NONE, 600, 50, 150, 50, 150, 50, 150, 3, 0, 270, GrowthRate.SLOW, "Undiscovered", null, null, 120, false, true,
      new PokemonForm("Normal Forme", "normal", Type.PSYCHIC, null, 1.7, 60.8, Abilities.PRESSURE, Abilities.NONE, Abilities.NONE, 600, 50, 150, 50, 150, 50, 150, 3, 0, 270, GrowthRate.SLOW, "Undiscovered", null, null, 120, false),
      new PokemonForm("Attack Forme", "attack", Type.PSYCHIC, null, 1.7, 60.8, Abilities.PRESSURE, Abilities.NONE, Abilities.NONE, 600, 50, 180, 20, 180, 20, 150, 3, 0, 270, GrowthRate.SLOW, "Undiscovered", null, null, 120, false),
      new PokemonForm("Defense Forme", "defense", Type.PSYCHIC, null, 1.7, 60.8, Abilities.PRESSURE, Abilities.NONE, Abilities.NONE, 600, 50, 70, 160, 70, 160, 90, 3, 0, 270, GrowthRate.SLOW, "Undiscovered", null, null, 120, false),
      new PokemonForm("Speed Forme", "speed", Type.PSYCHIC, null, 1.7, 60.8, Abilities.PRESSURE, Abilities.NONE, Abilities.NONE, 600, 50, 95, 90, 95, 90, 180, 3, 0, 270, GrowthRate.SLOW, "Undiscovered", null, null, 120, false)
    ),
    new PokemonSpecies(Species.TURTWIG, "Turtwig", 4, false, false, false, "Tiny Leaf Pokémon", Type.GRASS, null, 0.4, 10.2, Abilities.OVERGROW, Abilities.NONE, Abilities.SHELL_ARMOR, 318, 55, 68, 64, 45, 55, 31, 45, 70, 64, GrowthRate.MEDIUM_SLOW, "Grass", "Monster", 87.5, 20, false),
    new PokemonSpecies(Species.GROTLE, "Grotle", 4, false, false, false, "Grove Pokémon", Type.GRASS, null, 1.1, 97, Abilities.OVERGROW, Abilities.NONE, Abilities.SHELL_ARMOR, 405, 75, 89, 85, 55, 65, 36, 45, 70, 142, GrowthRate.MEDIUM_SLOW, "Grass", "Monster", 87.5, 20, false),
    new PokemonSpecies(Species.TORTERRA, "Torterra", 4, false, false, false, "Continent Pokémon", Type.GRASS, Type.GROUND, 2.2, 310, Abilities.OVERGROW, Abilities.NONE, Abilities.SHELL_ARMOR, 525, 95, 109, 105, 75, 85, 56, 45, 70, 236, GrowthRate.MEDIUM_SLOW, "Grass", "Monster", 87.5, 20, false),
    new PokemonSpecies(Species.CHIMCHAR, "Chimchar", 4, false, false, false, "Chimp Pokémon", Type.FIRE, null, 0.5, 6.2, Abilities.BLAZE, Abilities.NONE, Abilities.IRON_FIST, 309, 44, 58, 44, 58, 44, 61, 45, 70, 62, GrowthRate.MEDIUM_SLOW, "Field", "Human-Like", 87.5, 20, false),
    new PokemonSpecies(Species.MONFERNO, "Monferno", 4, false, false, false, "Playful Pokémon", Type.FIRE, Type.FIGHTING, 0.9, 22, Abilities.BLAZE, Abilities.NONE, Abilities.IRON_FIST, 405, 64, 78, 52, 78, 52, 81, 45, 70, 142, GrowthRate.MEDIUM_SLOW, "Field", "Human-Like", 87.5, 20, false),
    new PokemonSpecies(Species.INFERNAPE, "Infernape", 4, false, false, false, "Flame Pokémon", Type.FIRE, Type.FIGHTING, 1.2, 55, Abilities.BLAZE, Abilities.NONE, Abilities.IRON_FIST, 534, 76, 104, 71, 104, 71, 108, 45, 70, 240, GrowthRate.MEDIUM_SLOW, "Field", "Human-Like", 87.5, 20, false),
    new PokemonSpecies(Species.PIPLUP, "Piplup", 4, false, false, false, "Penguin Pokémon", Type.WATER, null, 0.4, 5.2, Abilities.TORRENT, Abilities.NONE, Abilities.DEFIANT, 314, 53, 51, 53, 61, 56, 40, 45, 70, 63, GrowthRate.MEDIUM_SLOW, "Field", "Water 1", 87.5, 20, false),
    new PokemonSpecies(Species.PRINPLUP, "Prinplup", 4, false, false, false, "Penguin Pokémon", Type.WATER, null, 0.8, 23, Abilities.TORRENT, Abilities.NONE, Abilities.DEFIANT, 405, 64, 66, 68, 81, 76, 50, 45, 70, 142, GrowthRate.MEDIUM_SLOW, "Field", "Water 1", 87.5, 20, false),
    new PokemonSpecies(Species.EMPOLEON, "Empoleon", 4, false, false, false, "Emperor Pokémon", Type.WATER, Type.STEEL, 1.7, 84.5, Abilities.TORRENT, Abilities.NONE, Abilities.DEFIANT, 530, 84, 86, 88, 111, 101, 60, 45, 70, 239, GrowthRate.MEDIUM_SLOW, "Field", "Water 1", 87.5, 20, false),
    new PokemonSpecies(Species.STARLY, "Starly", 4, false, false, false, "Starling Pokémon", Type.NORMAL, Type.FLYING, 0.3, 2, Abilities.KEEN_EYE, Abilities.NONE, Abilities.RECKLESS, 245, 40, 55, 30, 30, 30, 60, 255, 70, 49, GrowthRate.MEDIUM_SLOW, "Flying", null, 50, 15, true),
    new PokemonSpecies(Species.STARAVIA, "Staravia", 4, false, false, false, "Starling Pokémon", Type.NORMAL, Type.FLYING, 0.6, 15.5, Abilities.INTIMIDATE, Abilities.NONE, Abilities.RECKLESS, 340, 55, 75, 50, 40, 40, 80, 120, 70, 119, GrowthRate.MEDIUM_SLOW, "Flying", null, 50, 15, true),
    new PokemonSpecies(Species.STARAPTOR, "Staraptor", 4, false, false, false, "Predator Pokémon", Type.NORMAL, Type.FLYING, 1.2, 24.9, Abilities.INTIMIDATE, Abilities.NONE, Abilities.RECKLESS, 485, 85, 120, 70, 50, 60, 100, 45, 70, 218, GrowthRate.MEDIUM_SLOW, "Flying", null, 50, 15, true),
    new PokemonSpecies(Species.BIDOOF, "Bidoof", 4, false, false, false, "Plump Mouse Pokémon", Type.NORMAL, null, 0.5, 20, Abilities.SIMPLE, Abilities.UNAWARE, Abilities.MOODY, 250, 59, 45, 40, 35, 40, 31, 255, 70, 50, GrowthRate.MEDIUM_FAST, "Field", "Water 1", 50, 15, true),
    new PokemonSpecies(Species.BIBAREL, "Bibarel", 4, false, false, false, "Beaver Pokémon", Type.NORMAL, Type.WATER, 1, 31.5, Abilities.SIMPLE, Abilities.UNAWARE, Abilities.MOODY, 410, 79, 85, 60, 55, 60, 71, 127, 70, 144, GrowthRate.MEDIUM_FAST, "Field", "Water 1", 50, 15, true),
    new PokemonSpecies(Species.KRICKETOT, "Kricketot", 4, false, false, false, "Cricket Pokémon", Type.BUG, null, 0.3, 2.2, Abilities.SHED_SKIN, Abilities.NONE, Abilities.RUN_AWAY, 194, 37, 25, 41, 25, 41, 25, 255, 70, 39, GrowthRate.MEDIUM_SLOW, "Bug", null, 50, 15, true),
    new PokemonSpecies(Species.KRICKETUNE, "Kricketune", 4, false, false, false, "Cricket Pokémon", Type.BUG, null, 1, 25.5, Abilities.SWARM, Abilities.NONE, Abilities.TECHNICIAN, 384, 77, 85, 51, 55, 51, 65, 45, 70, 134, GrowthRate.MEDIUM_SLOW, "Bug", null, 50, 15, true),
    new PokemonSpecies(Species.SHINX, "Shinx", 4, false, false, false, "Flash Pokémon", Type.ELECTRIC, null, 0.5, 9.5, Abilities.RIVALRY, Abilities.INTIMIDATE, Abilities.GUTS, 263, 45, 65, 34, 40, 34, 45, 235, 70, 53, GrowthRate.MEDIUM_SLOW, "Field", null, 50, 20, true),
    new PokemonSpecies(Species.LUXIO, "Luxio", 4, false, false, false, "Spark Pokémon", Type.ELECTRIC, null, 0.9, 30.5, Abilities.RIVALRY, Abilities.INTIMIDATE, Abilities.GUTS, 363, 60, 85, 49, 60, 49, 60, 120, 100, 127, GrowthRate.MEDIUM_SLOW, "Field", null, 50, 20, true),
    new PokemonSpecies(Species.LUXRAY, "Luxray", 4, false, false, false, "Gleam Eyes Pokémon", Type.ELECTRIC, null, 1.4, 42, Abilities.RIVALRY, Abilities.INTIMIDATE, Abilities.GUTS, 523, 80, 120, 79, 95, 79, 70, 45, 70, 235, GrowthRate.MEDIUM_SLOW, "Field", null, 50, 20, true),
    new PokemonSpecies(Species.BUDEW, "Budew", 4, false, false, false, "Bud Pokémon", Type.GRASS, Type.POISON, 0.2, 1.2, Abilities.NATURAL_CURE, Abilities.POISON_POINT, Abilities.LEAF_GUARD, 280, 40, 30, 35, 50, 70, 55, 255, 70, 56, GrowthRate.MEDIUM_SLOW, "Undiscovered", null, 50, 20, false),
    new PokemonSpecies(Species.ROSERADE, "Roserade", 4, false, false, false, "Bouquet Pokémon", Type.GRASS, Type.POISON, 0.9, 14.5, Abilities.NATURAL_CURE, Abilities.POISON_POINT, Abilities.TECHNICIAN, 515, 60, 70, 65, 125, 105, 90, 75, 70, 232, GrowthRate.MEDIUM_SLOW, "Fairy", "Grass", 50, 20, true),
    new PokemonSpecies(Species.CRANIDOS, "Cranidos", 4, false, false, false, "Head Butt Pokémon", Type.ROCK, null, 0.9, 31.5, Abilities.MOLD_BREAKER, Abilities.NONE, Abilities.SHEER_FORCE, 350, 67, 125, 40, 30, 30, 58, 45, 70, 70, GrowthRate.ERRATIC, "Monster", null, 87.5, 30, false),
    new PokemonSpecies(Species.RAMPARDOS, "Rampardos", 4, false, false, false, "Head Butt Pokémon", Type.ROCK, null, 1.6, 102.5, Abilities.MOLD_BREAKER, Abilities.NONE, Abilities.SHEER_FORCE, 495, 97, 165, 60, 65, 50, 58, 45, 70, 173, GrowthRate.ERRATIC, "Monster", null, 87.5, 30, false),
    new PokemonSpecies(Species.SHIELDON, "Shieldon", 4, false, false, false, "Shield Pokémon", Type.ROCK, Type.STEEL, 0.5, 57, Abilities.STURDY, Abilities.NONE, Abilities.SOUNDPROOF, 350, 30, 42, 118, 42, 88, 30, 45, 70, 70, GrowthRate.ERRATIC, "Monster", null, 87.5, 30, false),
    new PokemonSpecies(Species.BASTIODON, "Bastiodon", 4, false, false, false, "Shield Pokémon", Type.ROCK, Type.STEEL, 1.3, 149.5, Abilities.STURDY, Abilities.NONE, Abilities.SOUNDPROOF, 495, 60, 52, 168, 47, 138, 30, 45, 70, 173, GrowthRate.ERRATIC, "Monster", null, 87.5, 30, false),
    new PokemonSpecies(Species.BURMY, "Burmy", 4, false, false, false, "Bagworm Pokémon", Type.BUG, null, 0.2, 3.4, Abilities.SHED_SKIN, Abilities.NONE, Abilities.OVERCOAT, 224, 40, 29, 45, 29, 45, 36, 120, 70, 45, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 15, false, false,
      new PokemonForm("Plant Cloak", "plant", Type.BUG, null, 0.2, 3.4, Abilities.SHED_SKIN, Abilities.NONE, Abilities.OVERCOAT, 224, 40, 29, 45, 29, 45, 36, 120, 70, 45, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 15, false),
      new PokemonForm("Sandy Cloak", "sandy", Type.BUG, null, 0.2, 3.4, Abilities.SHED_SKIN, Abilities.NONE, Abilities.OVERCOAT, 224, 40, 29, 45, 29, 45, 36, 120, 70, 45, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 15, false),
      new PokemonForm("Trash Cloak", "trash", Type.BUG, null, 0.2, 3.4, Abilities.SHED_SKIN, Abilities.NONE, Abilities.OVERCOAT, 224, 40, 29, 45, 29, 45, 36, 120, 70, 45, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 15, false)
    ),
    new PokemonSpecies(Species.WORMADAM, "Wormadam", 4, false, false, false, "Bagworm Pokémon", Type.BUG, Type.GRASS, 0.5, 6.5, Abilities.ANTICIPATION, Abilities.NONE, Abilities.OVERCOAT, 424, 60, 59, 85, 79, 105, 36, 45, 70, 148, GrowthRate.MEDIUM_FAST, "Bug", null, 0, 15, false, false,
      new PokemonForm("Plant Cloak", "plant", Type.BUG, Type.GRASS, 0.5, 6.5, Abilities.ANTICIPATION, Abilities.NONE, Abilities.OVERCOAT, 424, 60, 59, 85, 79, 105, 36, 45, 70, 148, GrowthRate.MEDIUM_FAST, "Bug", null, 0, 15, false),
      new PokemonForm("Sandy Cloak", "sandy", Type.BUG, Type.GROUND, 0.5, 6.5, Abilities.ANTICIPATION, Abilities.NONE, Abilities.OVERCOAT, 424, 60, 79, 105, 59, 85, 36, 45, 70, 148, GrowthRate.MEDIUM_FAST, "Bug", null, 0, 15, false),
      new PokemonForm("Trash Cloak", "trash", Type.BUG, Type.STEEL, 0.5, 6.5, Abilities.ANTICIPATION, Abilities.NONE, Abilities.OVERCOAT, 424, 60, 69, 95, 69, 95, 36, 45, 70, 148, GrowthRate.MEDIUM_FAST, "Bug", null, 0, 15, false)
    ),
    new PokemonSpecies(Species.MOTHIM, "Mothim", 4, false, false, false, "Moth Pokémon", Type.BUG, Type.FLYING, 0.9, 23.3, Abilities.SWARM, Abilities.NONE, Abilities.TINTED_LENS, 424, 70, 94, 50, 94, 50, 66, 45, 70, 148, GrowthRate.MEDIUM_FAST, "Bug", null, 100, 15, false),
    new PokemonSpecies(Species.COMBEE, "Combee", 4, false, false, false, "Tiny Bee Pokémon", Type.BUG, Type.FLYING, 0.3, 5.5, Abilities.HONEY_GATHER, Abilities.NONE, Abilities.HUSTLE, 244, 30, 30, 42, 30, 42, 70, 120, 70, 49, GrowthRate.MEDIUM_SLOW, "Bug", null, 87.5, 15, true),
    new PokemonSpecies(Species.VESPIQUEN, "Vespiquen", 4, false, false, false, "Beehive Pokémon", Type.BUG, Type.FLYING, 1.2, 38.5, Abilities.PRESSURE, Abilities.NONE, Abilities.UNNERVE, 474, 70, 80, 102, 80, 102, 40, 45, 70, 166, GrowthRate.MEDIUM_SLOW, "Bug", null, 0, 15, false),
    new PokemonSpecies(Species.PACHIRISU, "Pachirisu", 4, false, false, false, "EleSquirrel Pokémon", Type.ELECTRIC, null, 0.4, 3.9, Abilities.RUN_AWAY, Abilities.PICKUP, Abilities.VOLT_ABSORB, 405, 60, 45, 70, 45, 90, 95, 200, 100, 142, GrowthRate.MEDIUM_FAST, "Fairy", "Field", 50, 10, true),
    new PokemonSpecies(Species.BUIZEL, "Buizel", 4, false, false, false, "Sea Weasel Pokémon", Type.WATER, null, 0.7, 29.5, Abilities.SWIFT_SWIM, Abilities.NONE, Abilities.WATER_VEIL, 330, 55, 65, 35, 60, 30, 85, 190, 70, 66, GrowthRate.MEDIUM_FAST, "Field", "Water 1", 50, 20, true),
    new PokemonSpecies(Species.FLOATZEL, "Floatzel", 4, false, false, false, "Sea Weasel Pokémon", Type.WATER, null, 1.1, 33.5, Abilities.SWIFT_SWIM, Abilities.NONE, Abilities.WATER_VEIL, 495, 85, 105, 55, 85, 50, 115, 75, 70, 173, GrowthRate.MEDIUM_FAST, "Field", "Water 1", 50, 20, true),
    new PokemonSpecies(Species.CHERUBI, "Cherubi", 4, false, false, false, "Cherry Pokémon", Type.GRASS, null, 0.4, 3.3, Abilities.CHLOROPHYLL, Abilities.NONE, Abilities.NONE, 275, 45, 35, 45, 62, 53, 35, 190, 70, 55, GrowthRate.MEDIUM_FAST, "Fairy", "Grass", 50, 20, false),
    new PokemonSpecies(Species.CHERRIM, "Cherrim", 4, false, false, false, "Blossom Pokémon", Type.GRASS, null, 0.5, 9.3, Abilities.FLOWER_GIFT, Abilities.NONE, Abilities.NONE, 450, 70, 60, 70, 87, 78, 85, 75, 70, 158, GrowthRate.MEDIUM_FAST, "Fairy", "Grass", 50, 20, false),
    new PokemonSpecies(Species.SHELLOS, "Shellos", 4, false, false, false, "Sea Slug Pokémon", Type.WATER, null, 0.3, 6.3, Abilities.STICKY_HOLD, Abilities.STORM_DRAIN, Abilities.SAND_FORCE, 325, 76, 48, 48, 57, 62, 34, 190, 70, 65, GrowthRate.MEDIUM_FAST, "Amorphous", "Water 1", 50, 20, false, false,
      new PokemonForm("East", "east", Type.WATER, null, 0.3, 6.3, Abilities.STICKY_HOLD, Abilities.STORM_DRAIN, Abilities.SAND_FORCE, 325, 76, 48, 48, 57, 62, 34, 190, 70, 65, GrowthRate.MEDIUM_FAST, "Amorphous", "Water 1", 50, 20, false),
      new PokemonForm("West", "west", Type.WATER, null, 0.3, 6.3, Abilities.STICKY_HOLD, Abilities.STORM_DRAIN, Abilities.SAND_FORCE, 325, 76, 48, 48, 57, 62, 34, 190, 70, 65, GrowthRate.MEDIUM_FAST, "Amorphous", "Water 1", 50, 20, false)
    ),
    new PokemonSpecies(Species.GASTRODON, "Gastrodon", 4, false, false, false, "Sea Slug Pokémon", Type.WATER, Type.GROUND, 0.9, 29.9, Abilities.STICKY_HOLD, Abilities.STORM_DRAIN, Abilities.SAND_FORCE, 475, 111, 83, 68, 92, 82, 39, 75, 70, 166, GrowthRate.MEDIUM_FAST, "Amorphous", "Water 1", 50, 20, false, false,
      new PokemonForm("East", "east", Type.WATER, Type.GROUND, 0.9, 29.9, Abilities.STICKY_HOLD, Abilities.STORM_DRAIN, Abilities.SAND_FORCE, 475, 111, 83, 68, 92, 82, 39, 75, 70, 166, GrowthRate.MEDIUM_FAST, "Amorphous", "Water 1", 50, 20, false),
      new PokemonForm("West", "west", Type.WATER, Type.GROUND, 0.9, 29.9, Abilities.STICKY_HOLD, Abilities.STORM_DRAIN, Abilities.SAND_FORCE, 475, 111, 83, 68, 92, 82, 39, 75, 70, 166, GrowthRate.MEDIUM_FAST, "Amorphous", "Water 1", 50, 20, false)
    ),
    new PokemonSpecies(Species.AMBIPOM, "Ambipom", 4, false, false, false, "Long Tail Pokémon", Type.NORMAL, null, 1.2, 20.3, Abilities.TECHNICIAN, Abilities.PICKUP, Abilities.SKILL_LINK, 482, 75, 100, 66, 60, 66, 115, 45, 100, 169, GrowthRate.FAST, "Field", null, 50, 20, true),
    new PokemonSpecies(Species.DRIFLOON, "Drifloon", 4, false, false, false, "Balloon Pokémon", Type.GHOST, Type.FLYING, 0.4, 1.2, Abilities.AFTERMATH, Abilities.UNBURDEN, Abilities.FLARE_BOOST, 348, 90, 50, 34, 60, 44, 70, 125, 70, 70, GrowthRate.FLUCTUATING, "Amorphous", null, 50, 30, false),
    new PokemonSpecies(Species.DRIFBLIM, "Drifblim", 4, false, false, false, "Blimp Pokémon", Type.GHOST, Type.FLYING, 1.2, 15, Abilities.AFTERMATH, Abilities.UNBURDEN, Abilities.FLARE_BOOST, 498, 150, 80, 44, 90, 54, 80, 60, 70, 174, GrowthRate.FLUCTUATING, "Amorphous", null, 50, 30, false),
    new PokemonSpecies(Species.BUNEARY, "Buneary", 4, false, false, false, "Rabbit Pokémon", Type.NORMAL, null, 0.4, 5.5, Abilities.RUN_AWAY, Abilities.KLUTZ, Abilities.LIMBER, 350, 55, 66, 44, 44, 56, 85, 190, 0, 70, GrowthRate.MEDIUM_FAST, "Field", "Human-Like", 50, 20, false),
    new PokemonSpecies(Species.LOPUNNY, "Lopunny", 4, false, false, false, "Rabbit Pokémon", Type.NORMAL, null, 1.2, 33.3, Abilities.CUTE_CHARM, Abilities.KLUTZ, Abilities.LIMBER, 480, 65, 76, 84, 54, 96, 105, 60, 140, 168, GrowthRate.MEDIUM_FAST, "Field", "Human-Like", 50, 20, false),
    new PokemonSpecies(Species.MISMAGIUS, "Mismagius", 4, false, false, false, "Magical Pokémon", Type.GHOST, null, 0.9, 4.4, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 495, 60, 60, 60, 105, 105, 105, 45, 35, 173, GrowthRate.FAST, "Amorphous", null, 50, 25, false),
    new PokemonSpecies(Species.HONCHKROW, "Honchkrow", 4, false, false, false, "Big Boss Pokémon", Type.DARK, Type.FLYING, 0.9, 27.3, Abilities.INSOMNIA, Abilities.SUPER_LUCK, Abilities.MOXIE, 505, 100, 125, 52, 105, 52, 71, 30, 35, 177, GrowthRate.MEDIUM_SLOW, "Flying", null, 50, 20, false),
    new PokemonSpecies(Species.GLAMEOW, "Glameow", 4, false, false, false, "Catty Pokémon", Type.NORMAL, null, 0.5, 3.9, Abilities.LIMBER, Abilities.OWN_TEMPO, Abilities.KEEN_EYE, 310, 49, 55, 42, 42, 37, 85, 190, 70, 62, GrowthRate.FAST, "Field", null, 25, 20, false),
    new PokemonSpecies(Species.PURUGLY, "Purugly", 4, false, false, false, "Tiger Cat Pokémon", Type.NORMAL, null, 1, 43.8, Abilities.THICK_FAT, Abilities.OWN_TEMPO, Abilities.DEFIANT, 452, 71, 82, 64, 64, 59, 112, 75, 70, 158, GrowthRate.FAST, "Field", null, 25, 20, false),
    new PokemonSpecies(Species.CHINGLING, "Chingling", 4, false, false, false, "Bell Pokémon", Type.PSYCHIC, null, 0.2, 0.6, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 285, 45, 30, 50, 65, 50, 45, 120, 70, 57, GrowthRate.FAST, "Undiscovered", null, 50, 25, false),
    new PokemonSpecies(Species.STUNKY, "Stunky", 4, false, false, false, "Skunk Pokémon", Type.POISON, Type.DARK, 0.4, 19.2, Abilities.STENCH, Abilities.AFTERMATH, Abilities.KEEN_EYE, 329, 63, 63, 47, 41, 41, 74, 225, 70, 66, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.SKUNTANK, "Skuntank", 4, false, false, false, "Skunk Pokémon", Type.POISON, Type.DARK, 1, 38, Abilities.STENCH, Abilities.AFTERMATH, Abilities.KEEN_EYE, 479, 103, 93, 67, 71, 61, 84, 60, 70, 168, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.BRONZOR, "Bronzor", 4, false, false, false, "Bronze Pokémon", Type.STEEL, Type.PSYCHIC, 0.5, 60.5, Abilities.LEVITATE, Abilities.HEATPROOF, Abilities.HEAVY_METAL, 300, 57, 24, 86, 24, 86, 23, 255, 70, 60, GrowthRate.MEDIUM_FAST, "Mineral", null, null, 20, false),
    new PokemonSpecies(Species.BRONZONG, "Bronzong", 4, false, false, false, "Bronze Bell Pokémon", Type.STEEL, Type.PSYCHIC, 1.3, 187, Abilities.LEVITATE, Abilities.HEATPROOF, Abilities.HEAVY_METAL, 500, 67, 89, 116, 79, 116, 33, 90, 70, 175, GrowthRate.MEDIUM_FAST, "Mineral", null, null, 20, false),
    new PokemonSpecies(Species.BONSLY, "Bonsly", 4, false, false, false, "Bonsai Pokémon", Type.ROCK, null, 0.5, 15, Abilities.STURDY, Abilities.ROCK_HEAD, Abilities.RATTLED, 290, 50, 80, 95, 10, 45, 10, 255, 70, 58, GrowthRate.MEDIUM_FAST, "Undiscovered", null, 50, 20, false),
    new PokemonSpecies(Species.MIME_JR, "Mime Jr.", 4, false, false, false, "Mime Pokémon", Type.PSYCHIC, Type.FAIRY, 0.6, 13, Abilities.SOUNDPROOF, Abilities.FILTER, Abilities.TECHNICIAN, 310, 20, 25, 45, 70, 90, 60, 145, 70, 62, GrowthRate.MEDIUM_FAST, "Undiscovered", null, 50, 25, false),
    new PokemonSpecies(Species.HAPPINY, "Happiny", 4, false, false, false, "Playhouse Pokémon", Type.NORMAL, null, 0.6, 24.4, Abilities.NATURAL_CURE, Abilities.SERENE_GRACE, Abilities.FRIEND_GUARD, 220, 100, 5, 5, 15, 65, 30, 130, 140, 110, GrowthRate.FAST, "Undiscovered", null, 0, 40, false),
    new PokemonSpecies(Species.CHATOT, "Chatot", 4, false, false, false, "Music Note Pokémon", Type.NORMAL, Type.FLYING, 0.5, 1.9, Abilities.KEEN_EYE, Abilities.TANGLED_FEET, Abilities.BIG_PECKS, 411, 76, 65, 45, 92, 42, 91, 30, 35, 144, GrowthRate.MEDIUM_SLOW, "Flying", null, 50, 20, false),
    new PokemonSpecies(Species.SPIRITOMB, "Spiritomb", 4, false, false, false, "Forbidden Pokémon", Type.GHOST, Type.DARK, 1, 108, Abilities.PRESSURE, Abilities.NONE, Abilities.INFILTRATOR, 485, 50, 92, 108, 92, 108, 35, 100, 70, 170, GrowthRate.MEDIUM_FAST, "Amorphous", null, 50, 30, false),
    new PokemonSpecies(Species.GIBLE, "Gible", 4, false, false, false, "Land Shark Pokémon", Type.DRAGON, Type.GROUND, 0.7, 20.5, Abilities.SAND_VEIL, Abilities.NONE, Abilities.ROUGH_SKIN, 300, 58, 70, 45, 40, 45, 42, 45, 70, 60, GrowthRate.SLOW, "Dragon", "Monster", 50, 40, true),
    new PokemonSpecies(Species.GABITE, "Gabite", 4, false, false, false, "Cave Pokémon", Type.DRAGON, Type.GROUND, 1.4, 56, Abilities.SAND_VEIL, Abilities.NONE, Abilities.ROUGH_SKIN, 410, 68, 90, 65, 50, 55, 82, 45, 70, 144, GrowthRate.SLOW, "Dragon", "Monster", 50, 40, true),
    new PokemonSpecies(Species.GARCHOMP, "Garchomp", 4, false, false, false, "Mach Pokémon", Type.DRAGON, Type.GROUND, 1.9, 95, Abilities.SAND_VEIL, Abilities.NONE, Abilities.ROUGH_SKIN, 600, 108, 130, 95, 80, 85, 102, 45, 70, 270, GrowthRate.SLOW, "Dragon", "Monster", 50, 40, true),
    new PokemonSpecies(Species.MUNCHLAX, "Munchlax", 4, false, false, false, "Big Eater Pokémon", Type.NORMAL, null, 0.6, 105, Abilities.PICKUP, Abilities.THICK_FAT, Abilities.GLUTTONY, 390, 135, 85, 40, 40, 85, 5, 50, 70, 78, GrowthRate.SLOW, "Undiscovered", null, 87.5, 40, false),
    new PokemonSpecies(Species.RIOLU, "Riolu", 4, false, false, false, "Emanation Pokémon", Type.FIGHTING, null, 0.7, 20.2, Abilities.STEADFAST, Abilities.INNER_FOCUS, Abilities.PRANKSTER, 285, 40, 70, 40, 35, 40, 60, 75, 70, 57, GrowthRate.MEDIUM_SLOW, "Undiscovered", null, 87.5, 25, false),
    new PokemonSpecies(Species.LUCARIO, "Lucario", 4, false, false, false, "Aura Pokémon", Type.FIGHTING, Type.STEEL, 1.2, 54, Abilities.STEADFAST, Abilities.INNER_FOCUS, Abilities.JUSTIFIED, 525, 70, 110, 70, 115, 70, 90, 45, 70, 184, GrowthRate.MEDIUM_SLOW, "Field", "Human-Like", 87.5, 25, false),
    new PokemonSpecies(Species.HIPPOPOTAS, "Hippopotas", 4, false, false, false, "Hippo Pokémon", Type.GROUND, null, 0.8, 49.5, Abilities.SAND_STREAM, Abilities.NONE, Abilities.SAND_FORCE, 330, 68, 72, 78, 38, 42, 32, 140, 70, 66, GrowthRate.SLOW, "Field", null, 50, 30, true),
    new PokemonSpecies(Species.HIPPOWDON, "Hippowdon", 4, false, false, false, "Heavyweight Pokémon", Type.GROUND, null, 2, 300, Abilities.SAND_STREAM, Abilities.NONE, Abilities.SAND_FORCE, 525, 108, 112, 118, 68, 72, 47, 60, 70, 184, GrowthRate.SLOW, "Field", null, 50, 30, true),
    new PokemonSpecies(Species.SKORUPI, "Skorupi", 4, false, false, false, "Scorpion Pokémon", Type.POISON, Type.BUG, 0.8, 12, Abilities.BATTLE_ARMOR, Abilities.SNIPER, Abilities.KEEN_EYE, 330, 40, 50, 90, 30, 55, 65, 120, 70, 66, GrowthRate.SLOW, "Bug", "Water 3", 50, 20, false),
    new PokemonSpecies(Species.DRAPION, "Drapion", 4, false, false, false, "Ogre Scorp Pokémon", Type.POISON, Type.DARK, 1.3, 61.5, Abilities.BATTLE_ARMOR, Abilities.SNIPER, Abilities.KEEN_EYE, 500, 70, 90, 110, 60, 75, 95, 45, 70, 175, GrowthRate.SLOW, "Bug", "Water 3", 50, 20, false),
    new PokemonSpecies(Species.CROAGUNK, "Croagunk", 4, false, false, false, "Toxic Mouth Pokémon", Type.POISON, Type.FIGHTING, 0.7, 23, Abilities.ANTICIPATION, Abilities.DRY_SKIN, Abilities.POISON_TOUCH, 300, 48, 61, 40, 61, 40, 50, 140, 100, 60, GrowthRate.MEDIUM_FAST, "Human-Like", null, 50, 10, true),
    new PokemonSpecies(Species.TOXICROAK, "Toxicroak", 4, false, false, false, "Toxic Mouth Pokémon", Type.POISON, Type.FIGHTING, 1.3, 44.4, Abilities.ANTICIPATION, Abilities.DRY_SKIN, Abilities.POISON_TOUCH, 490, 83, 106, 65, 86, 65, 85, 75, 70, 172, GrowthRate.MEDIUM_FAST, "Human-Like", null, 50, 20, true),
    new PokemonSpecies(Species.CARNIVINE, "Carnivine", 4, false, false, false, "Bug Catcher Pokémon", Type.GRASS, null, 1.4, 27, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 454, 74, 100, 72, 90, 72, 46, 200, 70, 159, GrowthRate.SLOW, "Grass", null, 50, 25, false),
    new PokemonSpecies(Species.FINNEON, "Finneon", 4, false, false, false, "Wing Fish Pokémon", Type.WATER, null, 0.4, 7, Abilities.SWIFT_SWIM, Abilities.STORM_DRAIN, Abilities.WATER_VEIL, 330, 49, 49, 56, 49, 61, 66, 190, 70, 66, GrowthRate.ERRATIC, "Water 2", null, 50, 20, true),
    new PokemonSpecies(Species.LUMINEON, "Lumineon", 4, false, false, false, "Neon Pokémon", Type.WATER, null, 1.2, 24, Abilities.SWIFT_SWIM, Abilities.STORM_DRAIN, Abilities.WATER_VEIL, 460, 69, 69, 76, 69, 86, 91, 75, 70, 161, GrowthRate.ERRATIC, "Water 2", null, 50, 20, true),
    new PokemonSpecies(Species.MANTYKE, "Mantyke", 4, false, false, false, "Kite Pokémon", Type.WATER, Type.FLYING, 1, 65, Abilities.SWIFT_SWIM, Abilities.WATER_ABSORB, Abilities.WATER_VEIL, 345, 45, 20, 50, 60, 120, 50, 25, 70, 69, GrowthRate.SLOW, "Undiscovered", null, 50, 25, false),
    new PokemonSpecies(Species.SNOVER, "Snover", 4, false, false, false, "Frost Tree Pokémon", Type.GRASS, Type.ICE, 1, 50.5, Abilities.SNOW_WARNING, Abilities.NONE, Abilities.SOUNDPROOF, 334, 60, 62, 50, 62, 60, 40, 120, 70, 67, GrowthRate.SLOW, "Grass", "Monster", 50, 20, true),
    new PokemonSpecies(Species.ABOMASNOW, "Abomasnow", 4, false, false, false, "Frost Tree Pokémon", Type.GRASS, Type.ICE, 2.2, 135.5, Abilities.SNOW_WARNING, Abilities.NONE, Abilities.SOUNDPROOF, 494, 90, 92, 75, 92, 85, 60, 60, 70, 173, GrowthRate.SLOW, "Grass", "Monster", 50, 20, true),
    new PokemonSpecies(Species.WEAVILE, "Weavile", 4, false, false, false, "Sharp Claw Pokémon", Type.DARK, Type.ICE, 1.1, 34, Abilities.PRESSURE, Abilities.NONE, Abilities.PICKPOCKET, 510, 70, 120, 65, 45, 85, 125, 45, 35, 179, GrowthRate.MEDIUM_SLOW, "Field", null, 50, 20, true),
    new PokemonSpecies(Species.MAGNEZONE, "Magnezone", 4, false, false, false, "Magnet Area Pokémon", Type.ELECTRIC, Type.STEEL, 1.2, 180, Abilities.MAGNET_PULL, Abilities.STURDY, Abilities.ANALYTIC, 535, 70, 70, 115, 130, 90, 60, 30, 70, 241, GrowthRate.MEDIUM_FAST, "Mineral", null, null, 20, false),
    new PokemonSpecies(Species.LICKILICKY, "Lickilicky", 4, false, false, false, "Licking Pokémon", Type.NORMAL, null, 1.7, 140, Abilities.OWN_TEMPO, Abilities.OBLIVIOUS, Abilities.CLOUD_NINE, 515, 110, 85, 95, 80, 95, 50, 30, 70, 180, GrowthRate.MEDIUM_FAST, "Monster", null, 50, 20, false),
    new PokemonSpecies(Species.RHYPERIOR, "Rhyperior", 4, false, false, false, "Drill Pokémon", Type.GROUND, Type.ROCK, 2.4, 282.8, Abilities.LIGHTNING_ROD, Abilities.SOLID_ROCK, Abilities.RECKLESS, 535, 115, 140, 130, 55, 55, 40, 30, 70, 241, GrowthRate.SLOW, "Field", "Monster", 50, 20, true),
    new PokemonSpecies(Species.TANGROWTH, "Tangrowth", 4, false, false, false, "Vine Pokémon", Type.GRASS, null, 2, 128.6, Abilities.CHLOROPHYLL, Abilities.LEAF_GUARD, Abilities.REGENERATOR, 535, 100, 100, 125, 110, 50, 50, 30, 70, 187, GrowthRate.MEDIUM_FAST, "Grass", null, 50, 20, true),
    new PokemonSpecies(Species.ELECTIVIRE, "Electivire", 4, false, false, false, "Thunderbolt Pokémon", Type.ELECTRIC, null, 1.8, 138.6, Abilities.MOTOR_DRIVE, Abilities.NONE, Abilities.VITAL_SPIRIT, 540, 75, 123, 67, 95, 85, 95, 30, 70, 243, GrowthRate.MEDIUM_FAST, "Human-Like", null, 75, 25, false),
    new PokemonSpecies(Species.MAGMORTAR, "Magmortar", 4, false, false, false, "Blast Pokémon", Type.FIRE, null, 1.6, 68, Abilities.FLAME_BODY, Abilities.NONE, Abilities.VITAL_SPIRIT, 540, 75, 95, 67, 125, 95, 83, 30, 70, 243, GrowthRate.MEDIUM_FAST, "Human-Like", null, 75, 25, false),
    new PokemonSpecies(Species.TOGEKISS, "Togekiss", 4, false, false, false, "Jubilee Pokémon", Type.FAIRY, Type.FLYING, 1.5, 38, Abilities.HUSTLE, Abilities.SERENE_GRACE, Abilities.SUPER_LUCK, 545, 85, 50, 95, 120, 115, 80, 30, 70, 245, GrowthRate.FAST, "Fairy", "Flying", 87.5, 10, false),
    new PokemonSpecies(Species.YANMEGA, "Yanmega", 4, false, false, false, "Ogre Darner Pokémon", Type.BUG, Type.FLYING, 1.9, 51.5, Abilities.SPEED_BOOST, Abilities.TINTED_LENS, Abilities.FRISK, 515, 86, 76, 86, 116, 56, 95, 30, 70, 180, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 20, false),
    new PokemonSpecies(Species.LEAFEON, "Leafeon", 4, false, false, false, "Verdant Pokémon", Type.GRASS, null, 1, 25.5, Abilities.LEAF_GUARD, Abilities.NONE, Abilities.CHLOROPHYLL, 525, 65, 110, 130, 60, 65, 95, 45, 35, 184, GrowthRate.MEDIUM_FAST, "Field", null, 87.5, 35, false),
    new PokemonSpecies(Species.GLACEON, "Glaceon", 4, false, false, false, "Fresh Snow Pokémon", Type.ICE, null, 0.8, 25.9, Abilities.SNOW_CLOAK, Abilities.NONE, Abilities.ICE_BODY, 525, 65, 60, 110, 130, 95, 65, 45, 35, 184, GrowthRate.MEDIUM_FAST, "Field", null, 87.5, 35, false),
    new PokemonSpecies(Species.GLISCOR, "Gliscor", 4, false, false, false, "Fang Scorp Pokémon", Type.GROUND, Type.FLYING, 2, 42.5, Abilities.HYPER_CUTTER, Abilities.SAND_VEIL, Abilities.POISON_HEAL, 510, 75, 95, 125, 45, 75, 95, 30, 70, 179, GrowthRate.MEDIUM_SLOW, "Bug", null, 50, 20, false),
    new PokemonSpecies(Species.MAMOSWINE, "Mamoswine", 4, false, false, false, "Twin Tusk Pokémon", Type.ICE, Type.GROUND, 2.5, 291, Abilities.OBLIVIOUS, Abilities.SNOW_CLOAK, Abilities.THICK_FAT, 530, 110, 130, 80, 70, 60, 80, 50, 70, 239, GrowthRate.SLOW, "Field", null, 50, 20, true),
    new PokemonSpecies(Species.PORYGON_Z, "Porygon-Z", 4, false, false, false, "Virtual Pokémon", Type.NORMAL, null, 0.9, 34, Abilities.ADAPTABILITY, Abilities.DOWNLOAD, Abilities.ANALYTIC, 535, 85, 80, 70, 135, 75, 90, 30, 70, 241, GrowthRate.MEDIUM_FAST, "Mineral", null, null, 20, false),
    new PokemonSpecies(Species.GALLADE, "Gallade", 4, false, false, false, "Blade Pokémon", Type.PSYCHIC, Type.FIGHTING, 1.6, 52, Abilities.STEADFAST, Abilities.NONE, Abilities.JUSTIFIED, 518, 68, 125, 65, 65, 115, 80, 45, 35, 233, GrowthRate.SLOW, "Amorphous", "Human-Like", 100, 20, false),
    new PokemonSpecies(Species.PROBOPASS, "Probopass", 4, false, false, false, "Compass Pokémon", Type.ROCK, Type.STEEL, 1.4, 340, Abilities.STURDY, Abilities.MAGNET_PULL, Abilities.SAND_FORCE, 525, 60, 55, 145, 75, 150, 40, 60, 70, 184, GrowthRate.MEDIUM_FAST, "Mineral", null, 50, 20, false),
    new PokemonSpecies(Species.DUSKNOIR, "Dusknoir", 4, false, false, false, "Gripper Pokémon", Type.GHOST, null, 2.2, 106.6, Abilities.PRESSURE, Abilities.NONE, Abilities.FRISK, 525, 45, 100, 135, 65, 135, 45, 45, 35, 236, GrowthRate.FAST, "Amorphous", null, 50, 25, false),
    new PokemonSpecies(Species.FROSLASS, "Froslass", 4, false, false, false, "Snow Land Pokémon", Type.ICE, Type.GHOST, 1.3, 26.6, Abilities.SNOW_CLOAK, Abilities.NONE, Abilities.CURSED_BODY, 480, 70, 80, 70, 80, 70, 110, 75, 70, 168, GrowthRate.MEDIUM_FAST, "Fairy", "Mineral", 0, 20, false),
    new PokemonSpecies(Species.ROTOM, "Rotom", 4, false, false, false, "Plasma Pokémon", Type.ELECTRIC, Type.GHOST, 0.3, 0.3, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 440, 50, 50, 77, 95, 77, 91, 45, 70, 154, GrowthRate.MEDIUM_FAST, "Amorphous", null, null, 20, false, true,
      new PokemonForm("Normal", "", Type.ELECTRIC, Type.GHOST, 0.3, 0.3, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 440, 50, 50, 77, 95, 77, 91, 45, 70, 154, GrowthRate.MEDIUM_FAST, "Amorphous", null, null, 20, false),
      new PokemonForm("Heat", "heat", Type.ELECTRIC, Type.FIRE, 0.3, 0.3, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 520, 50, 65, 107, 105, 107, 86, 45, 70, 182, GrowthRate.MEDIUM_FAST, "Amorphous", null, null, 20, false),
      new PokemonForm("Wash", "wash", Type.ELECTRIC, Type.WATER, 0.3, 0.3, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 520, 50, 65, 107, 105, 107, 86, 45, 70, 182, GrowthRate.MEDIUM_FAST, "Amorphous", null, null, 20, false),
      new PokemonForm("Frost", "frost", Type.ELECTRIC, Type.ICE, 0.3, 0.3, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 520, 50, 65, 107, 105, 107, 86, 45, 70, 182, GrowthRate.MEDIUM_FAST, "Amorphous", null, null, 20, false),
      new PokemonForm("Fan", "fan", Type.ELECTRIC, Type.FLYING, 0.3, 0.3, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 520, 50, 65, 107, 105, 107, 86, 45, 70, 182, GrowthRate.MEDIUM_FAST, "Amorphous", null, null, 20, false),
      new PokemonForm("Mow", "mow", Type.ELECTRIC, Type.GRASS, 0.3, 0.3, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 520, 50, 65, 107, 105, 107, 86, 45, 70, 182, GrowthRate.MEDIUM_FAST, "Amorphous", null, null, 20, false)
    ),
    new PokemonSpecies(Species.UXIE, "Uxie", 4, true, false, false, "Knowledge Pokémon", Type.PSYCHIC, null, 0.3, 0.3, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 580, 75, 75, 130, 75, 130, 95, 3, 140, 261, GrowthRate.SLOW, "Undiscovered", null, null, 80, false),
    new PokemonSpecies(Species.MESPRIT, "Mesprit", 4, true, false, false, "Emotion Pokémon", Type.PSYCHIC, null, 0.3, 0.3, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 580, 80, 105, 105, 105, 105, 80, 3, 140, 261, GrowthRate.SLOW, "Undiscovered", null, null, 80, false),
    new PokemonSpecies(Species.AZELF, "Azelf", 4, true, false, false, "Willpower Pokémon", Type.PSYCHIC, null, 0.3, 0.3, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 580, 75, 125, 70, 125, 70, 115, 3, 140, 261, GrowthRate.SLOW, "Undiscovered", null, null, 80, false),
    new PokemonSpecies(Species.DIALGA, "Dialga", 4, false, true, false, "Temporal Pokémon", Type.STEEL, Type.DRAGON, 5.4, 683, Abilities.PRESSURE, Abilities.NONE, Abilities.TELEPATHY, 680, 100, 120, 120, 150, 100, 90, 3, 0, 306, GrowthRate.SLOW, "Undiscovered", null, null, 120, false),
    new PokemonSpecies(Species.PALKIA, "Palkia", 4, false, true, false, "Spatial Pokémon", Type.WATER, Type.DRAGON, 4.2, 336, Abilities.PRESSURE, Abilities.NONE, Abilities.TELEPATHY, 680, 90, 120, 100, 150, 120, 100, 3, 0, 306, GrowthRate.SLOW, "Undiscovered", null, null, 120, false),
    new PokemonSpecies(Species.HEATRAN, "Heatran", 4, true, false, false, "Lava Dome Pokémon", Type.FIRE, Type.STEEL, 1.7, 430, Abilities.FLASH_FIRE, Abilities.NONE, Abilities.FLAME_BODY, 600, 91, 90, 106, 130, 106, 77, 3, 100, 270, GrowthRate.SLOW, "Undiscovered", null, 50, 10, false),
    new PokemonSpecies(Species.REGIGIGAS, "Regigigas", 4, true, false, false, "Colossal Pokémon", Type.NORMAL, null, 3.7, 420, Abilities.SLOW_START, Abilities.NONE, Abilities.NONE, 670, 110, 160, 110, 80, 110, 100, 3, 0, 302, GrowthRate.SLOW, "Undiscovered", null, null, 120, false),
    new PokemonSpecies(Species.GIRATINA, "Giratina", 4, false, true, false, "Renegade Pokémon", Type.GHOST, Type.DRAGON, 4.5, 750, Abilities.PRESSURE, Abilities.NONE, Abilities.TELEPATHY, 680, 150, 100, 120, 100, 120, 90, 3, 0, 306, GrowthRate.SLOW, "Undiscovered", null, null, 120, false, true,
      new PokemonForm("Altered Forme", "altered", Type.GHOST, Type.DRAGON, 4.5, 750, Abilities.PRESSURE, Abilities.NONE, Abilities.TELEPATHY, 680, 150, 100, 120, 100, 120, 90, 3, 0, 306, GrowthRate.SLOW, "Undiscovered", null, null, 120, false),
      new PokemonForm("Origin Forme", "origin", Type.GHOST, Type.DRAGON, 6.9, 650, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 680, 150, 120, 100, 120, 100, 90, 3, 0, 306, GrowthRate.SLOW, "Undiscovered", null, null, 120, false)
    ),
    new PokemonSpecies(Species.CRESSELIA, "Cresselia", 4, true, false, false, "Lunar Pokémon", Type.PSYCHIC, null, 1.5, 85.6, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 600, 120, 70, 120, 75, 130, 85, 3, 100, 270, GrowthRate.SLOW, "Undiscovered", null, 0, 120, false),
    new PokemonSpecies(Species.PHIONE, "Phione", 4, false, false, false, "Sea Drifter Pokémon", Type.WATER, null, 0.4, 3.1, Abilities.HYDRATION, Abilities.NONE, Abilities.NONE, 480, 80, 80, 80, 80, 80, 80, 30, 70, 216, GrowthRate.SLOW, "Fairy", "Water 1", null, 40, false),
    new PokemonSpecies(Species.MANAPHY, "Manaphy", 4, false, false, true, "Seafaring Pokémon", Type.WATER, null, 0.3, 1.4, Abilities.HYDRATION, Abilities.NONE, Abilities.NONE, 600, 100, 100, 100, 100, 100, 100, 3, 70, 270, GrowthRate.SLOW, "Fairy", "Water 1", null, 10, false),
    new PokemonSpecies(Species.DARKRAI, "Darkrai", 4, false, false, true, "Pitch-Black Pokémon", Type.DARK, null, 1.5, 50.5, Abilities.BAD_DREAMS, Abilities.NONE, Abilities.NONE, 600, 70, 90, 90, 135, 90, 125, 3, 0, 270, GrowthRate.SLOW, "Undiscovered", null, null, 120, false),
    new PokemonSpecies(Species.SHAYMIN, "Shaymin", 4, false, false, true, "Gratitude Pokémon", Type.GRASS, null, 0.2, 2.1, Abilities.NATURAL_CURE, Abilities.NONE, Abilities.NONE, 600, 100, 100, 100, 100, 100, 100, 45, 100, 270, GrowthRate.MEDIUM_SLOW, "Undiscovered", null, null, 120, false, true,
      new PokemonForm("Land Forme", "land", Type.GRASS, null, 0.2, 2.1, Abilities.NATURAL_CURE, Abilities.NONE, Abilities.NONE, 600, 100, 100, 100, 100, 100, 100, 45, 100, 270, GrowthRate.MEDIUM_SLOW, "Undiscovered", null, null, 120, false),
      new PokemonForm("Sky Forme", "sky", Type.GRASS, Type.FLYING, 0.4, 5.2, Abilities.SERENE_GRACE, Abilities.NONE, Abilities.NONE, 600, 100, 103, 75, 120, 75, 127, 45, 100, 270, GrowthRate.MEDIUM_SLOW, "Undiscovered", null, null, 120, false)
    ),
    new PokemonSpecies(Species.ARCEUS, "Arceus", 4, false, false, true, "Alpha Pokémon", Type.NORMAL, null, 3.2, 320, Abilities.MULTITYPE, Abilities.NONE, Abilities.NONE, 720, 120, 120, 120, 120, 120, 120, 3, 0, 324, GrowthRate.SLOW, "Undiscovered", null, null, 120, false),
    new PokemonSpecies(Species.VICTINI, "Victini", 4, false, false, true, "Victory Pokémon", Type.PSYCHIC, Type.FIRE, 0.4, 4, Abilities.VICTORY_STAR, Abilities.NONE, Abilities.NONE, 600, 100, 100, 100, 100, 100, 100, 3, 100, 270, GrowthRate.SLOW, "Undiscovered", null, null, 120, false),
    new PokemonSpecies(Species.SNIVY, "Snivy", 5, false, false, false, "Grass Snake Pokémon", Type.GRASS, null, 0.6, 8.1, Abilities.OVERGROW, Abilities.NONE, Abilities.CONTRARY, 308, 45, 45, 55, 45, 55, 63, 45, 70, 62, GrowthRate.MEDIUM_SLOW, "Field", "Grass", 87.5, 20, false),
    new PokemonSpecies(Species.SERVINE, "Servine", 5, false, false, false, "Grass Snake Pokémon", Type.GRASS, null, 0.8, 16, Abilities.OVERGROW, Abilities.NONE, Abilities.CONTRARY, 413, 60, 60, 75, 60, 75, 83, 45, 70, 145, GrowthRate.MEDIUM_SLOW, "Field", "Grass", 87.5, 20, false),
    new PokemonSpecies(Species.SERPERIOR, "Serperior", 5, false, false, false, "Regal Pokémon", Type.GRASS, null, 3.3, 63, Abilities.OVERGROW, Abilities.NONE, Abilities.CONTRARY, 528, 75, 75, 95, 75, 95, 113, 45, 70, 238, GrowthRate.MEDIUM_SLOW, "Field", "Grass", 87.5, 20, false),
    new PokemonSpecies(Species.TEPIG, "Tepig", 5, false, false, false, "Fire Pig Pokémon", Type.FIRE, null, 0.5, 9.9, Abilities.BLAZE, Abilities.NONE, Abilities.THICK_FAT, 308, 65, 63, 45, 45, 45, 45, 45, 70, 62, GrowthRate.MEDIUM_SLOW, "Field", null, 87.5, 20, false),
    new PokemonSpecies(Species.PIGNITE, "Pignite", 5, false, false, false, "Fire Pig Pokémon", Type.FIRE, Type.FIGHTING, 1, 55.5, Abilities.BLAZE, Abilities.NONE, Abilities.THICK_FAT, 418, 90, 93, 55, 70, 55, 55, 45, 70, 146, GrowthRate.MEDIUM_SLOW, "Field", null, 87.5, 20, false),
    new PokemonSpecies(Species.EMBOAR, "Emboar", 5, false, false, false, "Mega Fire Pig Pokémon", Type.FIRE, Type.FIGHTING, 1.6, 150, Abilities.BLAZE, Abilities.NONE, Abilities.RECKLESS, 528, 110, 123, 65, 100, 65, 65, 45, 70, 238, GrowthRate.MEDIUM_SLOW, "Field", null, 87.5, 20, false),
    new PokemonSpecies(Species.OSHAWOTT, "Oshawott", 5, false, false, false, "Sea Otter Pokémon", Type.WATER, null, 0.5, 5.9, Abilities.TORRENT, Abilities.NONE, Abilities.SHELL_ARMOR, 308, 55, 55, 45, 63, 45, 45, 45, 70, 62, GrowthRate.MEDIUM_SLOW, "Field", null, 87.5, 20, false),
    new PokemonSpecies(Species.DEWOTT, "Dewott", 5, false, false, false, "Discipline Pokémon", Type.WATER, null, 0.8, 24.5, Abilities.TORRENT, Abilities.NONE, Abilities.SHELL_ARMOR, 413, 75, 75, 60, 83, 60, 60, 45, 70, 145, GrowthRate.MEDIUM_SLOW, "Field", null, 87.5, 20, false),
    new PokemonSpecies(Species.SAMUROTT, "Samurott", 5, false, false, false, "Formidable Pokémon", Type.WATER, null, 1.5, 94.6, Abilities.TORRENT, Abilities.NONE, Abilities.SHELL_ARMOR, 528, 95, 100, 85, 108, 70, 70, 45, 70, 238, GrowthRate.MEDIUM_SLOW, "Field", null, 87.5, 20, false),
    new PokemonSpecies(Species.PATRAT, "Patrat", 5, false, false, false, "Scout Pokémon", Type.NORMAL, null, 0.5, 11.6, Abilities.RUN_AWAY, Abilities.KEEN_EYE, Abilities.ANALYTIC, 255, 45, 55, 39, 35, 39, 42, 255, 70, 51, GrowthRate.MEDIUM_FAST, "Field", null, 50, 15, false),
    new PokemonSpecies(Species.WATCHOG, "Watchog", 5, false, false, false, "Lookout Pokémon", Type.NORMAL, null, 1.1, 27, Abilities.ILLUMINATE, Abilities.KEEN_EYE, Abilities.ANALYTIC, 420, 60, 85, 69, 60, 69, 77, 255, 70, 147, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.LILLIPUP, "Lillipup", 5, false, false, false, "Puppy Pokémon", Type.NORMAL, null, 0.4, 4.1, Abilities.VITAL_SPIRIT, Abilities.PICKUP, Abilities.RUN_AWAY, 275, 45, 60, 45, 25, 45, 55, 255, 70, 55, GrowthRate.MEDIUM_SLOW, "Field", null, 50, 15, false),
    new PokemonSpecies(Species.HERDIER, "Herdier", 5, false, false, false, "Loyal Dog Pokémon", Type.NORMAL, null, 0.9, 14.7, Abilities.INTIMIDATE, Abilities.SAND_RUSH, Abilities.SCRAPPY, 370, 65, 80, 65, 35, 65, 60, 120, 70, 130, GrowthRate.MEDIUM_SLOW, "Field", null, 50, 15, false),
    new PokemonSpecies(Species.STOUTLAND, "Stoutland", 5, false, false, false, "Big-Hearted Pokémon", Type.NORMAL, null, 1.2, 61, Abilities.INTIMIDATE, Abilities.SAND_RUSH, Abilities.SCRAPPY, 500, 85, 110, 90, 45, 90, 80, 45, 70, 225, GrowthRate.MEDIUM_SLOW, "Field", null, 50, 15, false),
    new PokemonSpecies(Species.PURRLOIN, "Purrloin", 5, false, false, false, "Devious Pokémon", Type.DARK, null, 0.4, 10.1, Abilities.LIMBER, Abilities.UNBURDEN, Abilities.PRANKSTER, 281, 41, 50, 37, 50, 37, 66, 255, 70, 56, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.LIEPARD, "Liepard", 5, false, false, false, "Cruel Pokémon", Type.DARK, null, 1.1, 37.5, Abilities.LIMBER, Abilities.UNBURDEN, Abilities.PRANKSTER, 446, 64, 88, 50, 88, 50, 106, 90, 70, 156, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.PANSAGE, "Pansage", 5, false, false, false, "Grass Monkey Pokémon", Type.GRASS, null, 0.6, 10.5, Abilities.GLUTTONY, Abilities.NONE, Abilities.OVERGROW, 316, 50, 53, 48, 53, 48, 64, 190, 70, 63, GrowthRate.MEDIUM_FAST, "Field", null, 87.5, 20, false),
    new PokemonSpecies(Species.SIMISAGE, "Simisage", 5, false, false, false, "Thorn Monkey Pokémon", Type.GRASS, null, 1.1, 30.5, Abilities.GLUTTONY, Abilities.NONE, Abilities.OVERGROW, 498, 75, 98, 63, 98, 63, 101, 75, 70, 174, GrowthRate.MEDIUM_FAST, "Field", null, 87.5, 20, false),
    new PokemonSpecies(Species.PANSEAR, "Pansear", 5, false, false, false, "High Temp Pokémon", Type.FIRE, null, 0.6, 11, Abilities.GLUTTONY, Abilities.NONE, Abilities.BLAZE, 316, 50, 53, 48, 53, 48, 64, 190, 70, 63, GrowthRate.MEDIUM_FAST, "Field", null, 87.5, 20, false),
    new PokemonSpecies(Species.SIMISEAR, "Simisear", 5, false, false, false, "Ember Pokémon", Type.FIRE, null, 1, 28, Abilities.GLUTTONY, Abilities.NONE, Abilities.BLAZE, 498, 75, 98, 63, 98, 63, 101, 75, 70, 174, GrowthRate.MEDIUM_FAST, "Field", null, 87.5, 20, false),
    new PokemonSpecies(Species.PANPOUR, "Panpour", 5, false, false, false, "Spray Pokémon", Type.WATER, null, 0.6, 13.5, Abilities.GLUTTONY, Abilities.NONE, Abilities.TORRENT, 316, 50, 53, 48, 53, 48, 64, 190, 70, 63, GrowthRate.MEDIUM_FAST, "Field", null, 87.5, 20, false),
    new PokemonSpecies(Species.SIMIPOUR, "Simipour", 5, false, false, false, "Geyser Pokémon", Type.WATER, null, 1, 29, Abilities.GLUTTONY, Abilities.NONE, Abilities.TORRENT, 498, 75, 98, 63, 98, 63, 101, 75, 70, 174, GrowthRate.MEDIUM_FAST, "Field", null, 87.5, 20, false),
    new PokemonSpecies(Species.MUNNA, "Munna", 5, false, false, false, "Dream Eater Pokémon", Type.PSYCHIC, null, 0.6, 23.3, Abilities.FOREWARN, Abilities.SYNCHRONIZE, Abilities.TELEPATHY, 292, 76, 25, 45, 67, 55, 24, 190, 70, 58, GrowthRate.FAST, "Field", null, 50, 10, false),
    new PokemonSpecies(Species.MUSHARNA, "Musharna", 5, false, false, false, "Drowsing Pokémon", Type.PSYCHIC, null, 1.1, 60.5, Abilities.FOREWARN, Abilities.SYNCHRONIZE, Abilities.TELEPATHY, 487, 116, 55, 85, 107, 95, 29, 75, 70, 170, GrowthRate.FAST, "Field", null, 50, 10, false),
    new PokemonSpecies(Species.PIDOVE, "Pidove", 5, false, false, false, "Tiny Pigeon Pokémon", Type.NORMAL, Type.FLYING, 0.3, 2.1, Abilities.BIG_PECKS, Abilities.SUPER_LUCK, Abilities.RIVALRY, 264, 50, 55, 50, 36, 30, 43, 255, 70, 53, GrowthRate.MEDIUM_SLOW, "Flying", null, 50, 15, false),
    new PokemonSpecies(Species.TRANQUILL, "Tranquill", 5, false, false, false, "Wild Pigeon Pokémon", Type.NORMAL, Type.FLYING, 0.6, 15, Abilities.BIG_PECKS, Abilities.SUPER_LUCK, Abilities.RIVALRY, 358, 62, 77, 62, 50, 42, 65, 120, 70, 125, GrowthRate.MEDIUM_SLOW, "Flying", null, 50, 15, false),
    new PokemonSpecies(Species.UNFEZANT, "Unfezant", 5, false, false, false, "Proud Pokémon", Type.NORMAL, Type.FLYING, 1.2, 29, Abilities.BIG_PECKS, Abilities.SUPER_LUCK, Abilities.RIVALRY, 488, 80, 115, 80, 65, 55, 93, 45, 70, 220, GrowthRate.MEDIUM_SLOW, "Flying", null, 50, 15, true),
    new PokemonSpecies(Species.BLITZLE, "Blitzle", 5, false, false, false, "Electrified Pokémon", Type.ELECTRIC, null, 0.8, 29.8, Abilities.LIGHTNING_ROD, Abilities.MOTOR_DRIVE, Abilities.SAP_SIPPER, 295, 45, 60, 32, 50, 32, 76, 190, 70, 59, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.ZEBSTRIKA, "Zebstrika", 5, false, false, false, "Thunderbolt Pokémon", Type.ELECTRIC, null, 1.6, 79.5, Abilities.LIGHTNING_ROD, Abilities.MOTOR_DRIVE, Abilities.SAP_SIPPER, 497, 75, 100, 63, 80, 63, 116, 75, 70, 174, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.ROGGENROLA, "Roggenrola", 5, false, false, false, "Mantle Pokémon", Type.ROCK, null, 0.4, 18, Abilities.STURDY, Abilities.WEAK_ARMOR, Abilities.SAND_FORCE, 280, 55, 75, 85, 25, 25, 15, 255, 70, 56, GrowthRate.MEDIUM_SLOW, "Mineral", null, 50, 15, false),
    new PokemonSpecies(Species.BOLDORE, "Boldore", 5, false, false, false, "Ore Pokémon", Type.ROCK, null, 0.9, 102, Abilities.STURDY, Abilities.WEAK_ARMOR, Abilities.SAND_FORCE, 390, 70, 105, 105, 50, 40, 20, 120, 70, 137, GrowthRate.MEDIUM_SLOW, "Mineral", null, 50, 15, false),
    new PokemonSpecies(Species.GIGALITH, "Gigalith", 5, false, false, false, "Compressed Pokémon", Type.ROCK, null, 1.7, 260, Abilities.STURDY, Abilities.SAND_STREAM, Abilities.SAND_FORCE, 515, 85, 135, 130, 60, 80, 25, 45, 70, 232, GrowthRate.MEDIUM_SLOW, "Mineral", null, 50, 15, false),
    new PokemonSpecies(Species.WOOBAT, "Woobat", 5, false, false, false, "Bat Pokémon", Type.PSYCHIC, Type.FLYING, 0.4, 2.1, Abilities.UNAWARE, Abilities.KLUTZ, Abilities.SIMPLE, 323, 65, 45, 43, 55, 43, 72, 190, 70, 65, GrowthRate.MEDIUM_FAST, "Field", "Flying", 50, 15, false),
    new PokemonSpecies(Species.SWOOBAT, "Swoobat", 5, false, false, false, "Courting Pokémon", Type.PSYCHIC, Type.FLYING, 0.9, 10.5, Abilities.UNAWARE, Abilities.KLUTZ, Abilities.SIMPLE, 425, 67, 57, 55, 77, 55, 114, 45, 70, 149, GrowthRate.MEDIUM_FAST, "Field", "Flying", 50, 15, false),
    new PokemonSpecies(Species.DRILBUR, "Drilbur", 5, false, false, false, "Mole Pokémon", Type.GROUND, null, 0.3, 8.5, Abilities.SAND_RUSH, Abilities.SAND_FORCE, Abilities.MOLD_BREAKER, 328, 60, 85, 40, 30, 45, 68, 120, 70, 66, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.EXCADRILL, "Excadrill", 5, false, false, false, "Subterrene Pokémon", Type.GROUND, Type.STEEL, 0.7, 40.4, Abilities.SAND_RUSH, Abilities.SAND_FORCE, Abilities.MOLD_BREAKER, 508, 110, 135, 60, 50, 65, 88, 60, 70, 178, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.AUDINO, "Audino", 5, false, false, false, "Hearing Pokémon", Type.NORMAL, null, 1.1, 31, Abilities.HEALER, Abilities.REGENERATOR, Abilities.KLUTZ, 445, 103, 60, 86, 60, 86, 50, 255, 70, 390, GrowthRate.FAST, "Fairy", null, 50, 20, false),
    new PokemonSpecies(Species.TIMBURR, "Timburr", 5, false, false, false, "Muscular Pokémon", Type.FIGHTING, null, 0.6, 12.5, Abilities.GUTS, Abilities.SHEER_FORCE, Abilities.IRON_FIST, 305, 75, 80, 55, 25, 35, 35, 180, 70, 61, GrowthRate.MEDIUM_SLOW, "Human-Like", null, 75, 20, false),
    new PokemonSpecies(Species.GURDURR, "Gurdurr", 5, false, false, false, "Muscular Pokémon", Type.FIGHTING, null, 1.2, 40, Abilities.GUTS, Abilities.SHEER_FORCE, Abilities.IRON_FIST, 405, 85, 105, 85, 40, 50, 40, 90, 70, 142, GrowthRate.MEDIUM_SLOW, "Human-Like", null, 75, 20, false),
    new PokemonSpecies(Species.CONKELDURR, "Conkeldurr", 5, false, false, false, "Muscular Pokémon", Type.FIGHTING, null, 1.4, 87, Abilities.GUTS, Abilities.SHEER_FORCE, Abilities.IRON_FIST, 505, 105, 140, 95, 55, 65, 45, 45, 70, 227, GrowthRate.MEDIUM_SLOW, "Human-Like", null, 75, 20, false),
    new PokemonSpecies(Species.TYMPOLE, "Tympole", 5, false, false, false, "Tadpole Pokémon", Type.WATER, null, 0.5, 4.5, Abilities.SWIFT_SWIM, Abilities.HYDRATION, Abilities.WATER_ABSORB, 294, 50, 50, 40, 50, 40, 64, 255, 70, 59, GrowthRate.MEDIUM_SLOW, "Water 1", null, 50, 20, false),
    new PokemonSpecies(Species.PALPITOAD, "Palpitoad", 5, false, false, false, "Vibration Pokémon", Type.WATER, Type.GROUND, 0.8, 17, Abilities.SWIFT_SWIM, Abilities.HYDRATION, Abilities.WATER_ABSORB, 384, 75, 65, 55, 65, 55, 69, 120, 70, 134, GrowthRate.MEDIUM_SLOW, "Water 1", null, 50, 20, false),
    new PokemonSpecies(Species.SEISMITOAD, "Seismitoad", 5, false, false, false, "Vibration Pokémon", Type.WATER, Type.GROUND, 1.5, 62, Abilities.SWIFT_SWIM, Abilities.POISON_TOUCH, Abilities.WATER_ABSORB, 509, 105, 95, 75, 85, 75, 74, 45, 70, 229, GrowthRate.MEDIUM_SLOW, "Water 1", null, 50, 20, false),
    new PokemonSpecies(Species.THROH, "Throh", 5, false, false, false, "Judo Pokémon", Type.FIGHTING, null, 1.3, 55.5, Abilities.GUTS, Abilities.INNER_FOCUS, Abilities.MOLD_BREAKER, 465, 120, 100, 85, 30, 85, 45, 45, 70, 163, GrowthRate.MEDIUM_FAST, "Human-Like", null, 100, 20, false),
    new PokemonSpecies(Species.SAWK, "Sawk", 5, false, false, false, "Karate Pokémon", Type.FIGHTING, null, 1.4, 51, Abilities.STURDY, Abilities.INNER_FOCUS, Abilities.MOLD_BREAKER, 465, 75, 125, 75, 30, 75, 85, 45, 70, 163, GrowthRate.MEDIUM_FAST, "Human-Like", null, 100, 20, false),
    new PokemonSpecies(Species.SEWADDLE, "Sewaddle", 5, false, false, false, "Sewing Pokémon", Type.BUG, Type.GRASS, 0.3, 2.5, Abilities.SWARM, Abilities.CHLOROPHYLL, Abilities.OVERCOAT, 310, 45, 53, 70, 40, 60, 42, 255, 70, 62, GrowthRate.MEDIUM_SLOW, "Bug", null, 50, 15, false),
    new PokemonSpecies(Species.SWADLOON, "Swadloon", 5, false, false, false, "Leaf-Wrapped Pokémon", Type.BUG, Type.GRASS, 0.5, 7.3, Abilities.LEAF_GUARD, Abilities.CHLOROPHYLL, Abilities.OVERCOAT, 380, 55, 63, 90, 50, 80, 42, 120, 70, 133, GrowthRate.MEDIUM_SLOW, "Bug", null, 50, 15, false),
    new PokemonSpecies(Species.LEAVANNY, "Leavanny", 5, false, false, false, "Nurturing Pokémon", Type.BUG, Type.GRASS, 1.2, 20.5, Abilities.SWARM, Abilities.CHLOROPHYLL, Abilities.OVERCOAT, 500, 75, 103, 80, 70, 80, 92, 45, 70, 225, GrowthRate.MEDIUM_SLOW, "Bug", null, 50, 15, false),
    new PokemonSpecies(Species.VENIPEDE, "Venipede", 5, false, false, false, "Centipede Pokémon", Type.BUG, Type.POISON, 0.4, 5.3, Abilities.POISON_POINT, Abilities.SWARM, Abilities.SPEED_BOOST, 260, 30, 45, 59, 30, 39, 57, 255, 70, 52, GrowthRate.MEDIUM_SLOW, "Bug", null, 50, 15, false),
    new PokemonSpecies(Species.WHIRLIPEDE, "Whirlipede", 5, false, false, false, "Curlipede Pokémon", Type.BUG, Type.POISON, 1.2, 58.5, Abilities.POISON_POINT, Abilities.SWARM, Abilities.SPEED_BOOST, 360, 40, 55, 99, 40, 79, 47, 120, 70, 126, GrowthRate.MEDIUM_SLOW, "Bug", null, 50, 15, false),
    new PokemonSpecies(Species.SCOLIPEDE, "Scolipede", 5, false, false, false, "Megapede Pokémon", Type.BUG, Type.POISON, 2.5, 200.5, Abilities.POISON_POINT, Abilities.SWARM, Abilities.SPEED_BOOST, 485, 60, 100, 89, 55, 69, 112, 45, 70, 218, GrowthRate.MEDIUM_SLOW, "Bug", null, 50, 20, false),
    new PokemonSpecies(Species.COTTONEE, "Cottonee", 5, false, false, false, "Cotton Puff Pokémon", Type.GRASS, Type.FAIRY, 0.3, 0.6, Abilities.PRANKSTER, Abilities.INFILTRATOR, Abilities.CHLOROPHYLL, 280, 40, 27, 60, 37, 50, 66, 190, 70, 56, GrowthRate.MEDIUM_FAST, "Fairy", "Grass", 50, 20, false),
    new PokemonSpecies(Species.WHIMSICOTT, "Whimsicott", 5, false, false, false, "Windveiled Pokémon", Type.GRASS, Type.FAIRY, 0.7, 6.6, Abilities.PRANKSTER, Abilities.INFILTRATOR, Abilities.CHLOROPHYLL, 480, 60, 67, 85, 77, 75, 116, 75, 70, 168, GrowthRate.MEDIUM_FAST, "Fairy", "Grass", 50, 20, false),
    new PokemonSpecies(Species.PETILIL, "Petilil", 5, false, false, false, "Bulb Pokémon", Type.GRASS, null, 0.5, 6.6, Abilities.CHLOROPHYLL, Abilities.OWN_TEMPO, Abilities.LEAF_GUARD, 280, 45, 35, 50, 70, 50, 30, 190, 70, 56, GrowthRate.MEDIUM_FAST, "Grass", null, 0, 20, false),
    new PokemonSpecies(Species.LILLIGANT, "Lilligant", 5, false, false, false, "Flowering Pokémon", Type.GRASS, null, 1.1, 16.3, Abilities.CHLOROPHYLL, Abilities.OWN_TEMPO, Abilities.LEAF_GUARD, 480, 70, 60, 75, 110, 75, 90, 75, 70, 168, GrowthRate.MEDIUM_FAST, "Grass", null, 0, 20, false),
    new PokemonSpecies(Species.BASCULIN, "Basculin", 5, false, false, false, "Hostile Pokémon", Type.WATER, null, 1, 18, Abilities.RECKLESS, Abilities.ADAPTABILITY, Abilities.MOLD_BREAKER, 460, 70, 92, 65, 80, 55, 98, 25, 70, 161, GrowthRate.MEDIUM_FAST, "Water 2", null, 50, 40, false, false,
      new PokemonForm("Red-Striped Form", "red-striped", Type.WATER, null, 1, 18, Abilities.RECKLESS, Abilities.ADAPTABILITY, Abilities.MOLD_BREAKER, 460, 70, 92, 65, 80, 55, 98, 25, 70, 161, GrowthRate.MEDIUM_FAST, "Water 2", null, 50, 40, false),
      new PokemonForm("Blue-Striped Form", "blue-striped", Type.WATER, null, 1, 18, Abilities.ROCK_HEAD, Abilities.ADAPTABILITY, Abilities.MOLD_BREAKER, 460, 70, 92, 65, 80, 55, 98, 25, 70, 161, GrowthRate.MEDIUM_FAST, "Water 2", null, 50, 40, false)
    ),
    new PokemonSpecies(Species.SANDILE, "Sandile", 5, false, false, false, "Desert Croc Pokémon", Type.GROUND, Type.DARK, 0.7, 15.2, Abilities.INTIMIDATE, Abilities.MOXIE, Abilities.ANGER_POINT, 292, 50, 72, 35, 35, 35, 65, 180, 70, 58, GrowthRate.MEDIUM_SLOW, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.KROKOROK, "Krokorok", 5, false, false, false, "Desert Croc Pokémon", Type.GROUND, Type.DARK, 1, 33.4, Abilities.INTIMIDATE, Abilities.MOXIE, Abilities.ANGER_POINT, 351, 60, 82, 45, 45, 45, 74, 90, 70, 123, GrowthRate.MEDIUM_SLOW, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.KROOKODILE, "Krookodile", 5, false, false, false, "Intimidation Pokémon", Type.GROUND, Type.DARK, 1.5, 96.3, Abilities.INTIMIDATE, Abilities.MOXIE, Abilities.ANGER_POINT, 519, 95, 117, 80, 65, 70, 92, 45, 70, 234, GrowthRate.MEDIUM_SLOW, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.DARUMAKA, "Darumaka", 5, false, false, false, "Zen Charm Pokémon", Type.FIRE, null, 0.6, 37.5, Abilities.HUSTLE, Abilities.NONE, Abilities.INNER_FOCUS, 315, 70, 90, 45, 15, 45, 50, 120, 70, 63, GrowthRate.MEDIUM_SLOW, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.DARMANITAN, "Darmanitan", 5, false, false, false, "Blazing Pokémon", Type.FIRE, null, 1.3, 92.9, Abilities.SHEER_FORCE, Abilities.NONE, Abilities.ZEN_MODE, 480, 105, 140, 55, 30, 55, 95, 60, 70, 168, GrowthRate.MEDIUM_SLOW, "Field", null, 50, 20, false, true,
      new PokemonForm("Standard Mode", "", Type.FIRE, null, 1.3, 92.9, Abilities.SHEER_FORCE, Abilities.NONE, Abilities.ZEN_MODE, 480, 105, 140, 55, 30, 55, 95, 60, 70, 168, GrowthRate.MEDIUM_SLOW, "Field", null, 50, 20, false),
      new PokemonForm("Zen Mode", "zen", Type.FIRE, Type.PSYCHIC, 1.3, 92.9, Abilities.SHEER_FORCE, Abilities.NONE, Abilities.ZEN_MODE, 540, 105, 30, 105, 140, 105, 55, 60, 70, 189, GrowthRate.MEDIUM_SLOW, "Field", null, 50, 20, false)
    ),
    new PokemonSpecies(Species.MARACTUS, "Maractus", 5, false, false, false, "Cactus Pokémon", Type.GRASS, null, 1, 28, Abilities.WATER_ABSORB, Abilities.CHLOROPHYLL, Abilities.STORM_DRAIN, 461, 75, 86, 67, 106, 67, 60, 255, 70, 161, GrowthRate.MEDIUM_FAST, "Grass", null, 50, 20, false),
    new PokemonSpecies(Species.DWEBBLE, "Dwebble", 5, false, false, false, "Rock Inn Pokémon", Type.BUG, Type.ROCK, 0.3, 14.5, Abilities.STURDY, Abilities.SHELL_ARMOR, Abilities.WEAK_ARMOR, 325, 50, 65, 85, 35, 35, 55, 190, 70, 65, GrowthRate.MEDIUM_FAST, "Bug", "Mineral", 50, 20, false),
    new PokemonSpecies(Species.CRUSTLE, "Crustle", 5, false, false, false, "Stone Home Pokémon", Type.BUG, Type.ROCK, 1.4, 200, Abilities.STURDY, Abilities.SHELL_ARMOR, Abilities.WEAK_ARMOR, 485, 70, 105, 125, 65, 75, 45, 75, 70, 170, GrowthRate.MEDIUM_FAST, "Bug", "Mineral", 50, 20, false),
    new PokemonSpecies(Species.SCRAGGY, "Scraggy", 5, false, false, false, "Shedding Pokémon", Type.DARK, Type.FIGHTING, 0.6, 11.8, Abilities.SHED_SKIN, Abilities.MOXIE, Abilities.INTIMIDATE, 348, 50, 75, 70, 35, 70, 48, 180, 35, 70, GrowthRate.MEDIUM_FAST, "Dragon", "Field", 50, 15, false),
    new PokemonSpecies(Species.SCRAFTY, "Scrafty", 5, false, false, false, "Hoodlum Pokémon", Type.DARK, Type.FIGHTING, 1.1, 30, Abilities.SHED_SKIN, Abilities.MOXIE, Abilities.INTIMIDATE, 488, 65, 90, 115, 45, 115, 58, 90, 70, 171, GrowthRate.MEDIUM_FAST, "Dragon", "Field", 50, 15, false),
    new PokemonSpecies(Species.SIGILYPH, "Sigilyph", 5, false, false, false, "Avianoid Pokémon", Type.PSYCHIC, Type.FLYING, 1.4, 14, Abilities.WONDER_SKIN, Abilities.MAGIC_GUARD, Abilities.TINTED_LENS, 490, 72, 58, 80, 103, 80, 97, 45, 70, 172, GrowthRate.MEDIUM_FAST, "Flying", null, 50, 20, false),
    new PokemonSpecies(Species.YAMASK, "Yamask", 5, false, false, false, "Spirit Pokémon", Type.GHOST, null, 0.5, 1.5, Abilities.MUMMY, Abilities.NONE, Abilities.NONE, 303, 38, 30, 85, 55, 65, 30, 190, 70, 61, GrowthRate.MEDIUM_FAST, "Amorphous", "Mineral", 50, 25, false),
    new PokemonSpecies(Species.COFAGRIGUS, "Cofagrigus", 5, false, false, false, "Coffin Pokémon", Type.GHOST, null, 1.7, 76.5, Abilities.MUMMY, Abilities.NONE, Abilities.NONE, 483, 58, 50, 145, 95, 105, 30, 90, 70, 169, GrowthRate.MEDIUM_FAST, "Amorphous", "Mineral", 50, 25, false),
    new PokemonSpecies(Species.TIRTOUGA, "Tirtouga", 5, false, false, false, "Prototurtle Pokémon", Type.WATER, Type.ROCK, 0.7, 16.5, Abilities.SOLID_ROCK, Abilities.STURDY, Abilities.SWIFT_SWIM, 355, 54, 78, 103, 53, 45, 22, 45, 70, 71, GrowthRate.MEDIUM_FAST, "Water 1", "Water 3", 87.5, 30, false),
    new PokemonSpecies(Species.CARRACOSTA, "Carracosta", 5, false, false, false, "Prototurtle Pokémon", Type.WATER, Type.ROCK, 1.2, 81, Abilities.SOLID_ROCK, Abilities.STURDY, Abilities.SWIFT_SWIM, 495, 74, 108, 133, 83, 65, 32, 45, 70, 173, GrowthRate.MEDIUM_FAST, "Water 1", "Water 3", 87.5, 30, false),
    new PokemonSpecies(Species.ARCHEN, "Archen", 5, false, false, false, "First Bird Pokémon", Type.ROCK, Type.FLYING, 0.5, 9.5, Abilities.DEFEATIST, Abilities.NONE, Abilities.NONE, 401, 55, 112, 45, 74, 45, 70, 45, 70, 71, GrowthRate.MEDIUM_FAST, "Flying", "Water 3", 87.5, 30, false),
    new PokemonSpecies(Species.ARCHEOPS, "Archeops", 5, false, false, false, "First Bird Pokémon", Type.ROCK, Type.FLYING, 1.4, 32, Abilities.DEFEATIST, Abilities.NONE, Abilities.NONE, 567, 75, 140, 65, 112, 65, 110, 45, 70, 177, GrowthRate.MEDIUM_FAST, "Flying", "Water 3", 87.5, 30, false),
    new PokemonSpecies(Species.TRUBBISH, "Trubbish", 5, false, false, false, "Trash Bag Pokémon", Type.POISON, null, 0.6, 31, Abilities.STENCH, Abilities.STICKY_HOLD, Abilities.AFTERMATH, 329, 50, 50, 62, 40, 62, 65, 190, 70, 66, GrowthRate.MEDIUM_FAST, "Mineral", null, 50, 20, false),
    new PokemonSpecies(Species.GARBODOR, "Garbodor", 5, false, false, false, "Trash Heap Pokémon", Type.POISON, null, 1.9, 107.3, Abilities.STENCH, Abilities.WEAK_ARMOR, Abilities.AFTERMATH, 474, 80, 95, 82, 60, 82, 75, 60, 70, 166, GrowthRate.MEDIUM_FAST, "Mineral", null, 50, 20, false),
    new PokemonSpecies(Species.ZORUA, "Zorua", 5, false, false, false, "Tricky Fox Pokémon", Type.DARK, null, 0.7, 12.5, Abilities.ILLUSION, Abilities.NONE, Abilities.NONE, 330, 40, 65, 40, 80, 40, 65, 75, 70, 66, GrowthRate.MEDIUM_SLOW, "Field", null, 87.5, 25, false),
    new PokemonSpecies(Species.ZOROARK, "Zoroark", 5, false, false, false, "Illusion Fox Pokémon", Type.DARK, null, 1.6, 81.1, Abilities.ILLUSION, Abilities.NONE, Abilities.NONE, 510, 60, 105, 60, 120, 60, 105, 45, 70, 179, GrowthRate.MEDIUM_SLOW, "Field", null, 87.5, 20, false),
    new PokemonSpecies(Species.MINCCINO, "Minccino", 5, false, false, false, "Chinchilla Pokémon", Type.NORMAL, null, 0.4, 5.8, Abilities.CUTE_CHARM, Abilities.TECHNICIAN, Abilities.SKILL_LINK, 300, 55, 50, 40, 40, 40, 75, 255, 70, 60, GrowthRate.FAST, "Field", null, 25, 15, false),
    new PokemonSpecies(Species.CINCCINO, "Cinccino", 5, false, false, false, "Scarf Pokémon", Type.NORMAL, null, 0.5, 7.5, Abilities.CUTE_CHARM, Abilities.TECHNICIAN, Abilities.SKILL_LINK, 470, 75, 95, 60, 65, 60, 115, 60, 70, 165, GrowthRate.FAST, "Field", null, 25, 15, false),
    new PokemonSpecies(Species.GOTHITA, "Gothita", 5, false, false, false, "Fixation Pokémon", Type.PSYCHIC, null, 0.4, 5.8, Abilities.FRISK, Abilities.COMPETITIVE, Abilities.SHADOW_TAG, 290, 45, 30, 50, 55, 65, 45, 200, 70, 58, GrowthRate.MEDIUM_SLOW, "Human-Like", null, 25, 20, false),
    new PokemonSpecies(Species.GOTHORITA, "Gothorita", 5, false, false, false, "Manipulate Pokémon", Type.PSYCHIC, null, 0.7, 18, Abilities.FRISK, Abilities.COMPETITIVE, Abilities.SHADOW_TAG, 390, 60, 45, 70, 75, 85, 55, 100, 70, 137, GrowthRate.MEDIUM_SLOW, "Human-Like", null, 25, 20, false),
    new PokemonSpecies(Species.GOTHITELLE, "Gothitelle", 5, false, false, false, "Astral Body Pokémon", Type.PSYCHIC, null, 1.5, 44, Abilities.FRISK, Abilities.COMPETITIVE, Abilities.SHADOW_TAG, 490, 70, 55, 95, 95, 110, 65, 50, 70, 221, GrowthRate.MEDIUM_SLOW, "Human-Like", null, 25, 20, false),
    new PokemonSpecies(Species.SOLOSIS, "Solosis", 5, false, false, false, "Cell Pokémon", Type.PSYCHIC, null, 0.3, 1, Abilities.OVERCOAT, Abilities.MAGIC_GUARD, Abilities.REGENERATOR, 290, 45, 30, 40, 105, 50, 20, 200, 70, 58, GrowthRate.MEDIUM_SLOW, "Amorphous", null, 50, 20, false),
    new PokemonSpecies(Species.DUOSION, "Duosion", 5, false, false, false, "Mitosis Pokémon", Type.PSYCHIC, null, 0.6, 8, Abilities.OVERCOAT, Abilities.MAGIC_GUARD, Abilities.REGENERATOR, 370, 65, 40, 50, 125, 60, 30, 100, 70, 130, GrowthRate.MEDIUM_SLOW, "Amorphous", null, 50, 20, false),
    new PokemonSpecies(Species.REUNICLUS, "Reuniclus", 5, false, false, false, "Multiplying Pokémon", Type.PSYCHIC, null, 1, 20.1, Abilities.OVERCOAT, Abilities.MAGIC_GUARD, Abilities.REGENERATOR, 490, 110, 65, 75, 125, 85, 30, 50, 70, 221, GrowthRate.MEDIUM_SLOW, "Amorphous", null, 50, 20, false),
    new PokemonSpecies(Species.DUCKLETT, "Ducklett", 5, false, false, false, "Water Bird Pokémon", Type.WATER, Type.FLYING, 0.5, 5.5, Abilities.KEEN_EYE, Abilities.BIG_PECKS, Abilities.HYDRATION, 305, 62, 44, 50, 44, 50, 55, 190, 70, 61, GrowthRate.MEDIUM_FAST, "Flying", "Water 1", 50, 20, false),
    new PokemonSpecies(Species.SWANNA, "Swanna", 5, false, false, false, "White Bird Pokémon", Type.WATER, Type.FLYING, 1.3, 24.2, Abilities.KEEN_EYE, Abilities.BIG_PECKS, Abilities.HYDRATION, 473, 75, 87, 63, 87, 63, 98, 45, 70, 166, GrowthRate.MEDIUM_FAST, "Flying", "Water 1", 50, 20, false),
    new PokemonSpecies(Species.VANILLITE, "Vanillite", 5, false, false, false, "Fresh Snow Pokémon", Type.ICE, null, 0.4, 5.7, Abilities.ICE_BODY, Abilities.SNOW_CLOAK, Abilities.WEAK_ARMOR, 305, 36, 50, 50, 65, 60, 44, 255, 70, 61, GrowthRate.SLOW, "Mineral", null, 50, 20, false),
    new PokemonSpecies(Species.VANILLISH, "Vanillish", 5, false, false, false, "Icy Snow Pokémon", Type.ICE, null, 1.1, 41, Abilities.ICE_BODY, Abilities.SNOW_CLOAK, Abilities.WEAK_ARMOR, 395, 51, 65, 65, 80, 75, 59, 120, 70, 138, GrowthRate.SLOW, "Mineral", null, 50, 20, false),
    new PokemonSpecies(Species.VANILLUXE, "Vanilluxe", 5, false, false, false, "Snowstorm Pokémon", Type.ICE, null, 1.3, 57.5, Abilities.ICE_BODY, Abilities.SNOW_WARNING, Abilities.WEAK_ARMOR, 535, 71, 95, 85, 110, 95, 79, 45, 70, 241, GrowthRate.SLOW, "Mineral", null, 50, 20, false),
    new PokemonSpecies(Species.DEERLING, "Deerling", 5, false, false, false, "Season Pokémon", Type.NORMAL, Type.GRASS, 0.6, 19.5, Abilities.CHLOROPHYLL, Abilities.SAP_SIPPER, Abilities.SERENE_GRACE, 335, 60, 60, 50, 40, 50, 75, 190, 70, 67, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false, true,
      new PokemonForm("Spring", "spring", Type.NORMAL, Type.GRASS, 0.6, 19.5, Abilities.CHLOROPHYLL, Abilities.SAP_SIPPER, Abilities.SERENE_GRACE, 335, 60, 60, 50, 40, 50, 75, 190, 70, 67, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false),
      new PokemonForm("Summer", "summer", Type.NORMAL, Type.GRASS, 0.6, 19.5, Abilities.CHLOROPHYLL, Abilities.SAP_SIPPER, Abilities.SERENE_GRACE, 335, 60, 60, 50, 40, 50, 75, 190, 70, 67, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false),
      new PokemonForm("Autumn", "autumn", Type.NORMAL, Type.GRASS, 0.6, 19.5, Abilities.CHLOROPHYLL, Abilities.SAP_SIPPER, Abilities.SERENE_GRACE, 335, 60, 60, 50, 40, 50, 75, 190, 70, 67, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false),
      new PokemonForm("Winter", "winter", Type.NORMAL, Type.GRASS, 0.6, 19.5, Abilities.CHLOROPHYLL, Abilities.SAP_SIPPER, Abilities.SERENE_GRACE, 335, 60, 60, 50, 40, 50, 75, 190, 70, 67, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false)
    ),
    new PokemonSpecies(Species.SAWSBUCK, "Sawsbuck", 5, false, false, false, "Season Pokémon", Type.NORMAL, Type.GRASS, 1.9, 92.5, Abilities.CHLOROPHYLL, Abilities.SAP_SIPPER, Abilities.SERENE_GRACE, 475, 80, 100, 70, 60, 70, 95, 75, 70, 166, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false, true,
      new PokemonForm("Spring", "spring", Type.NORMAL, Type.GRASS, 1.9, 92.5, Abilities.CHLOROPHYLL, Abilities.SAP_SIPPER, Abilities.SERENE_GRACE, 475, 80, 100, 70, 60, 70, 95, 75, 70, 166, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false),
      new PokemonForm("Summer", "summer", Type.NORMAL, Type.GRASS, 1.9, 92.5, Abilities.CHLOROPHYLL, Abilities.SAP_SIPPER, Abilities.SERENE_GRACE, 475, 80, 100, 70, 60, 70, 95, 75, 70, 166, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false),
      new PokemonForm("Autumn", "autumn", Type.NORMAL, Type.GRASS, 1.9, 92.5, Abilities.CHLOROPHYLL, Abilities.SAP_SIPPER, Abilities.SERENE_GRACE, 475, 80, 100, 70, 60, 70, 95, 75, 70, 166, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false),
      new PokemonForm("Winter", "winter", Type.NORMAL, Type.GRASS, 1.9, 92.5, Abilities.CHLOROPHYLL, Abilities.SAP_SIPPER, Abilities.SERENE_GRACE, 475, 80, 100, 70, 60, 70, 95, 75, 70, 166, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false)
    ),
    new PokemonSpecies(Species.EMOLGA, "Emolga", 5, false, false, false, "Sky Squirrel Pokémon", Type.ELECTRIC, Type.FLYING, 0.4, 5, Abilities.STATIC, Abilities.NONE, Abilities.MOTOR_DRIVE, 428, 55, 75, 60, 75, 60, 103, 200, 70, 150, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.KARRABLAST, "Karrablast", 5, false, false, false, "Clamping Pokémon", Type.BUG, null, 0.5, 5.9, Abilities.SWARM, Abilities.SHED_SKIN, Abilities.NO_GUARD, 315, 50, 75, 45, 40, 45, 60, 200, 70, 63, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 15, false),
    new PokemonSpecies(Species.ESCAVALIER, "Escavalier", 5, false, false, false, "Cavalry Pokémon", Type.BUG, Type.STEEL, 1, 33, Abilities.SWARM, Abilities.SHELL_ARMOR, Abilities.OVERCOAT, 495, 70, 135, 105, 60, 105, 20, 75, 70, 173, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 15, false),
    new PokemonSpecies(Species.FOONGUS, "Foongus", 5, false, false, false, "Mushroom Pokémon", Type.GRASS, Type.POISON, 0.2, 1, Abilities.EFFECT_SPORE, Abilities.NONE, Abilities.REGENERATOR, 294, 69, 55, 45, 55, 55, 15, 190, 70, 59, GrowthRate.MEDIUM_FAST, "Grass", null, 50, 20, false),
    new PokemonSpecies(Species.AMOONGUSS, "Amoonguss", 5, false, false, false, "Mushroom Pokémon", Type.GRASS, Type.POISON, 0.6, 10.5, Abilities.EFFECT_SPORE, Abilities.NONE, Abilities.REGENERATOR, 464, 114, 85, 70, 85, 80, 30, 75, 70, 162, GrowthRate.MEDIUM_FAST, "Grass", null, 50, 20, false),
    new PokemonSpecies(Species.FRILLISH, "Frillish", 5, false, false, false, "Floating Pokémon", Type.WATER, Type.GHOST, 1.2, 33, Abilities.WATER_ABSORB, Abilities.CURSED_BODY, Abilities.DAMP, 335, 55, 40, 50, 65, 85, 40, 190, 70, 67, GrowthRate.MEDIUM_FAST, "Amorphous", null, 50, 20, true),
    new PokemonSpecies(Species.JELLICENT, "Jellicent", 5, false, false, false, "Floating Pokémon", Type.WATER, Type.GHOST, 2.2, 135, Abilities.WATER_ABSORB, Abilities.CURSED_BODY, Abilities.DAMP, 480, 100, 60, 70, 85, 105, 60, 60, 70, 168, GrowthRate.MEDIUM_FAST, "Amorphous", null, 50, 20, true),
    new PokemonSpecies(Species.ALOMOMOLA, "Alomomola", 5, false, false, false, "Caring Pokémon", Type.WATER, null, 1.2, 31.6, Abilities.HEALER, Abilities.HYDRATION, Abilities.REGENERATOR, 470, 165, 75, 80, 40, 45, 65, 75, 70, 165, GrowthRate.FAST, "Water 1", "Water 2", 50, 40, false),
    new PokemonSpecies(Species.JOLTIK, "Joltik", 5, false, false, false, "Attaching Pokémon", Type.BUG, Type.ELECTRIC, 0.1, 0.6, Abilities.COMPOUND_EYES, Abilities.UNNERVE, Abilities.SWARM, 319, 50, 47, 50, 57, 50, 65, 190, 70, 64, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 20, false),
    new PokemonSpecies(Species.GALVANTULA, "Galvantula", 5, false, false, false, "EleSpider Pokémon", Type.BUG, Type.ELECTRIC, 0.8, 14.3, Abilities.COMPOUND_EYES, Abilities.UNNERVE, Abilities.SWARM, 472, 70, 77, 60, 97, 60, 108, 75, 70, 165, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 20, false),
    new PokemonSpecies(Species.FERROSEED, "Ferroseed", 5, false, false, false, "Thorn Seed Pokémon", Type.GRASS, Type.STEEL, 0.6, 18.8, Abilities.IRON_BARBS, Abilities.NONE, Abilities.ANTICIPATION, 305, 44, 50, 91, 24, 86, 10, 255, 70, 61, GrowthRate.MEDIUM_FAST, "Grass", "Mineral", 50, 20, false),
    new PokemonSpecies(Species.FERROTHORN, "Ferrothorn", 5, false, false, false, "Thorn Pod Pokémon", Type.GRASS, Type.STEEL, 1, 110, Abilities.IRON_BARBS, Abilities.NONE, Abilities.ANTICIPATION, 489, 74, 94, 131, 54, 116, 20, 90, 70, 171, GrowthRate.MEDIUM_FAST, "Grass", "Mineral", 50, 20, false),
    new PokemonSpecies(Species.KLINK, "Klink", 5, false, false, false, "Gear Pokémon", Type.STEEL, null, 0.3, 21, Abilities.PLUS, Abilities.MINUS, Abilities.CLEAR_BODY, 300, 40, 55, 70, 45, 60, 30, 130, 70, 60, GrowthRate.MEDIUM_SLOW, "Mineral", null, null, 20, false),
    new PokemonSpecies(Species.KLANG, "Klang", 5, false, false, false, "Gear Pokémon", Type.STEEL, null, 0.6, 51, Abilities.PLUS, Abilities.MINUS, Abilities.CLEAR_BODY, 440, 60, 80, 95, 70, 85, 50, 60, 70, 154, GrowthRate.MEDIUM_SLOW, "Mineral", null, null, 20, false),
    new PokemonSpecies(Species.KLINKLANG, "Klinklang", 5, false, false, false, "Gear Pokémon", Type.STEEL, null, 0.6, 81, Abilities.PLUS, Abilities.MINUS, Abilities.CLEAR_BODY, 520, 60, 100, 115, 70, 85, 90, 30, 70, 234, GrowthRate.MEDIUM_SLOW, "Mineral", null, null, 20, false),
    new PokemonSpecies(Species.TYNAMO, "Tynamo", 5, false, false, false, "EleFish Pokémon", Type.ELECTRIC, null, 0.2, 0.3, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 275, 35, 55, 40, 45, 40, 60, 190, 70, 55, GrowthRate.SLOW, "Amorphous", null, 50, 20, false),
    new PokemonSpecies(Species.EELEKTRIK, "Eelektrik", 5, false, false, false, "EleFish Pokémon", Type.ELECTRIC, null, 1.2, 22, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 405, 65, 85, 70, 75, 70, 40, 60, 70, 142, GrowthRate.SLOW, "Amorphous", null, 50, 20, false),
    new PokemonSpecies(Species.EELEKTROSS, "Eelektross", 5, false, false, false, "EleFish Pokémon", Type.ELECTRIC, null, 2.1, 80.5, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 515, 85, 115, 80, 105, 80, 50, 30, 70, 232, GrowthRate.SLOW, "Amorphous", null, 50, 20, false),
    new PokemonSpecies(Species.ELGYEM, "Elgyem", 5, false, false, false, "Cerebral Pokémon", Type.PSYCHIC, null, 0.5, 9, Abilities.TELEPATHY, Abilities.SYNCHRONIZE, Abilities.ANALYTIC, 335, 55, 55, 55, 85, 55, 30, 255, 70, 67, GrowthRate.MEDIUM_FAST, "Human-Like", null, 50, 20, false),
    new PokemonSpecies(Species.BEHEEYEM, "Beheeyem", 5, false, false, false, "Cerebral Pokémon", Type.PSYCHIC, null, 1, 34.5, Abilities.TELEPATHY, Abilities.SYNCHRONIZE, Abilities.ANALYTIC, 485, 75, 75, 75, 125, 95, 40, 90, 70, 170, GrowthRate.MEDIUM_FAST, "Human-Like", null, 50, 20, false),
    new PokemonSpecies(Species.LITWICK, "Litwick", 5, false, false, false, "Candle Pokémon", Type.GHOST, Type.FIRE, 0.3, 3.1, Abilities.FLASH_FIRE, Abilities.FLAME_BODY, Abilities.INFILTRATOR, 275, 50, 30, 55, 65, 55, 20, 190, 70, 55, GrowthRate.MEDIUM_SLOW, "Amorphous", null, 50, 20, false),
    new PokemonSpecies(Species.LAMPENT, "Lampent", 5, false, false, false, "Lamp Pokémon", Type.GHOST, Type.FIRE, 0.6, 13, Abilities.FLASH_FIRE, Abilities.FLAME_BODY, Abilities.INFILTRATOR, 370, 60, 40, 60, 95, 60, 55, 90, 70, 130, GrowthRate.MEDIUM_SLOW, "Amorphous", null, 50, 20, false),
    new PokemonSpecies(Species.CHANDELURE, "Chandelure", 5, false, false, false, "Luring Pokémon", Type.GHOST, Type.FIRE, 1, 34.3, Abilities.FLASH_FIRE, Abilities.FLAME_BODY, Abilities.INFILTRATOR, 520, 60, 55, 90, 145, 90, 80, 45, 70, 234, GrowthRate.MEDIUM_SLOW, "Amorphous", null, 50, 20, false),
    new PokemonSpecies(Species.AXEW, "Axew", 5, false, false, false, "Tusk Pokémon", Type.DRAGON, null, 0.6, 18, Abilities.RIVALRY, Abilities.MOLD_BREAKER, Abilities.UNNERVE, 320, 46, 87, 60, 30, 40, 57, 75, 35, 64, GrowthRate.SLOW, "Dragon", "Monster", 50, 40, false),
    new PokemonSpecies(Species.FRAXURE, "Fraxure", 5, false, false, false, "Axe Jaw Pokémon", Type.DRAGON, null, 1, 36, Abilities.RIVALRY, Abilities.MOLD_BREAKER, Abilities.UNNERVE, 410, 66, 117, 70, 40, 50, 67, 60, 35, 144, GrowthRate.SLOW, "Dragon", "Monster", 50, 40, false),
    new PokemonSpecies(Species.HAXORUS, "Haxorus", 5, false, false, false, "Axe Jaw Pokémon", Type.DRAGON, null, 1.8, 105.5, Abilities.RIVALRY, Abilities.MOLD_BREAKER, Abilities.UNNERVE, 540, 76, 147, 90, 60, 70, 97, 45, 35, 243, GrowthRate.SLOW, "Dragon", "Monster", 50, 40, false),
    new PokemonSpecies(Species.CUBCHOO, "Cubchoo", 5, false, false, false, "Chill Pokémon", Type.ICE, null, 0.5, 8.5, Abilities.SNOW_CLOAK, Abilities.SLUSH_RUSH, Abilities.RATTLED, 305, 55, 70, 40, 60, 40, 40, 120, 70, 61, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.BEARTIC, "Beartic", 5, false, false, false, "Freezing Pokémon", Type.ICE, null, 2.6, 260, Abilities.SNOW_CLOAK, Abilities.SLUSH_RUSH, Abilities.SWIFT_SWIM, 505, 95, 130, 80, 70, 80, 50, 60, 70, 177, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.CRYOGONAL, "Cryogonal", 5, false, false, false, "Crystallizing Pokémon", Type.ICE, null, 1.1, 148, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 515, 80, 50, 50, 95, 135, 105, 25, 70, 180, GrowthRate.MEDIUM_FAST, "Mineral", null, null, 25, false),
    new PokemonSpecies(Species.SHELMET, "Shelmet", 5, false, false, false, "Snail Pokémon", Type.BUG, null, 0.4, 7.7, Abilities.HYDRATION, Abilities.SHELL_ARMOR, Abilities.OVERCOAT, 305, 50, 40, 85, 40, 65, 25, 200, 70, 61, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 15, false),
    new PokemonSpecies(Species.ACCELGOR, "Accelgor", 5, false, false, false, "Shell Out Pokémon", Type.BUG, null, 0.8, 25.3, Abilities.HYDRATION, Abilities.STICKY_HOLD, Abilities.UNBURDEN, 495, 80, 70, 40, 100, 60, 145, 75, 70, 173, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 15, false),
    new PokemonSpecies(Species.STUNFISK, "Stunfisk", 5, false, false, false, "Trap Pokémon", Type.GROUND, Type.ELECTRIC, 0.7, 11, Abilities.STATIC, Abilities.LIMBER, Abilities.SAND_VEIL, 471, 109, 66, 84, 81, 99, 32, 75, 70, 165, GrowthRate.MEDIUM_FAST, "Amorphous", "Water 1", 50, 20, false),
    new PokemonSpecies(Species.MIENFOO, "Mienfoo", 5, false, false, false, "Martial Arts Pokémon", Type.FIGHTING, null, 0.9, 20, Abilities.INNER_FOCUS, Abilities.REGENERATOR, Abilities.RECKLESS, 350, 45, 85, 50, 55, 50, 65, 180, 70, 70, GrowthRate.MEDIUM_SLOW, "Field", "Human-Like", 50, 25, false),
    new PokemonSpecies(Species.MIENSHAO, "Mienshao", 5, false, false, false, "Martial Arts Pokémon", Type.FIGHTING, null, 1.4, 35.5, Abilities.INNER_FOCUS, Abilities.REGENERATOR, Abilities.RECKLESS, 510, 65, 125, 60, 95, 60, 105, 45, 70, 179, GrowthRate.MEDIUM_SLOW, "Field", "Human-Like", 50, 25, false),
    new PokemonSpecies(Species.DRUDDIGON, "Druddigon", 5, false, false, false, "Cave Pokémon", Type.DRAGON, null, 1.6, 139, Abilities.ROUGH_SKIN, Abilities.SHEER_FORCE, Abilities.MOLD_BREAKER, 485, 77, 120, 90, 60, 90, 48, 45, 70, 170, GrowthRate.MEDIUM_FAST, "Dragon", "Monster", 50, 30, false),
    new PokemonSpecies(Species.GOLETT, "Golett", 5, false, false, false, "Automaton Pokémon", Type.GROUND, Type.GHOST, 1, 92, Abilities.IRON_FIST, Abilities.KLUTZ, Abilities.NO_GUARD, 303, 59, 74, 50, 35, 50, 35, 190, 70, 61, GrowthRate.MEDIUM_FAST, "Mineral", null, null, 25, false),
    new PokemonSpecies(Species.GOLURK, "Golurk", 5, false, false, false, "Automaton Pokémon", Type.GROUND, Type.GHOST, 2.8, 330, Abilities.IRON_FIST, Abilities.KLUTZ, Abilities.NO_GUARD, 483, 89, 124, 80, 55, 80, 55, 90, 70, 169, GrowthRate.MEDIUM_FAST, "Mineral", null, null, 25, false),
    new PokemonSpecies(Species.PAWNIARD, "Pawniard", 5, false, false, false, "Sharp Blade Pokémon", Type.DARK, Type.STEEL, 0.5, 10.2, Abilities.DEFIANT, Abilities.INNER_FOCUS, Abilities.PRESSURE, 340, 45, 85, 70, 40, 40, 60, 120, 35, 68, GrowthRate.MEDIUM_FAST, "Human-Like", null, 50, 20, false),
    new PokemonSpecies(Species.BISHARP, "Bisharp", 5, false, false, false, "Sword Blade Pokémon", Type.DARK, Type.STEEL, 1.6, 70, Abilities.DEFIANT, Abilities.INNER_FOCUS, Abilities.PRESSURE, 490, 65, 125, 100, 60, 70, 70, 45, 35, 172, GrowthRate.MEDIUM_FAST, "Human-Like", null, 50, 20, false),
    new PokemonSpecies(Species.BOUFFALANT, "Bouffalant", 5, false, false, false, "Bash Buffalo Pokémon", Type.NORMAL, null, 1.6, 94.6, Abilities.RECKLESS, Abilities.SAP_SIPPER, Abilities.SOUNDPROOF, 490, 95, 110, 95, 40, 95, 55, 45, 70, 172, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.RUFFLET, "Rufflet", 5, false, false, false, "Eaglet Pokémon", Type.NORMAL, Type.FLYING, 0.5, 10.5, Abilities.KEEN_EYE, Abilities.SHEER_FORCE, Abilities.HUSTLE, 350, 70, 83, 50, 37, 50, 60, 190, 70, 70, GrowthRate.SLOW, "Flying", null, 100, 20, false),
    new PokemonSpecies(Species.BRAVIARY, "Braviary", 5, false, false, false, "Valiant Pokémon", Type.NORMAL, Type.FLYING, 1.5, 41, Abilities.KEEN_EYE, Abilities.SHEER_FORCE, Abilities.DEFIANT, 510, 100, 123, 75, 57, 75, 80, 60, 70, 179, GrowthRate.SLOW, "Flying", null, 100, 20, false),
    new PokemonSpecies(Species.VULLABY, "Vullaby", 5, false, false, false, "Diapered Pokémon", Type.DARK, Type.FLYING, 0.5, 9, Abilities.BIG_PECKS, Abilities.OVERCOAT, Abilities.WEAK_ARMOR, 370, 70, 55, 75, 45, 65, 60, 190, 35, 74, GrowthRate.SLOW, "Flying", null, 0, 20, false),
    new PokemonSpecies(Species.MANDIBUZZ, "Mandibuzz", 5, false, false, false, "Bone Vulture Pokémon", Type.DARK, Type.FLYING, 1.2, 39.5, Abilities.BIG_PECKS, Abilities.OVERCOAT, Abilities.WEAK_ARMOR, 510, 110, 65, 105, 55, 95, 80, 60, 35, 179, GrowthRate.SLOW, "Flying", null, 0, 20, false),
    new PokemonSpecies(Species.HEATMOR, "Heatmor", 5, false, false, false, "Anteater Pokémon", Type.FIRE, null, 1.4, 58, Abilities.GLUTTONY, Abilities.FLASH_FIRE, Abilities.WHITE_SMOKE, 484, 85, 97, 66, 105, 66, 65, 90, 70, 169, GrowthRate.MEDIUM_FAST, "Field", null, 50, 20, false),
    new PokemonSpecies(Species.DURANT, "Durant", 5, false, false, false, "Iron Ant Pokémon", Type.BUG, Type.STEEL, 0.3, 33, Abilities.SWARM, Abilities.HUSTLE, Abilities.TRUANT, 484, 58, 109, 112, 48, 48, 109, 90, 70, 169, GrowthRate.MEDIUM_FAST, "Bug", null, 50, 20, false),
    new PokemonSpecies(Species.DEINO, "Deino", 5, false, false, false, "Irate Pokémon", Type.DARK, Type.DRAGON, 0.8, 17.3, Abilities.HUSTLE, Abilities.NONE, Abilities.NONE, 300, 52, 65, 50, 45, 50, 38, 45, 35, 60, GrowthRate.SLOW, "Dragon", null, 50, 40, false),
    new PokemonSpecies(Species.ZWEILOUS, "Zweilous", 5, false, false, false, "Hostile Pokémon", Type.DARK, Type.DRAGON, 1.4, 50, Abilities.HUSTLE, Abilities.NONE, Abilities.NONE, 420, 72, 85, 70, 65, 70, 58, 45, 35, 147, GrowthRate.SLOW, "Dragon", null, 50, 40, false),
    new PokemonSpecies(Species.HYDREIGON, "Hydreigon", 5, false, false, false, "Brutal Pokémon", Type.DARK, Type.DRAGON, 1.8, 160, Abilities.LEVITATE, Abilities.NONE, Abilities.NONE, 600, 92, 105, 90, 125, 90, 98, 45, 35, 270, GrowthRate.SLOW, "Dragon", null, 50, 40, false),
    new PokemonSpecies(Species.LARVESTA, "Larvesta", 5, false, false, false, "Torch Pokémon", Type.BUG, Type.FIRE, 1.1, 28.8, Abilities.FLAME_BODY, Abilities.NONE, Abilities.SWARM, 360, 55, 85, 55, 50, 55, 60, 45, 70, 72, GrowthRate.SLOW, "Bug", null, 50, 40, false),
    new PokemonSpecies(Species.VOLCARONA, "Volcarona", 5, false, false, false, "Sun Pokémon", Type.BUG, Type.FIRE, 1.6, 46, Abilities.FLAME_BODY, Abilities.NONE, Abilities.SWARM, 550, 85, 60, 65, 135, 105, 100, 15, 70, 248, GrowthRate.SLOW, "Bug", null, 50, 40, false),
    new PokemonSpecies(Species.COBALION, "Cobalion", 5, true, false, false, "Iron Will Pokémon", Type.STEEL, Type.FIGHTING, 2.1, 250, Abilities.JUSTIFIED, Abilities.NONE, Abilities.NONE, 580, 91, 90, 129, 90, 72, 108, 3, 35, 261, GrowthRate.SLOW, "Undiscovered", null, null, 80, false),
    new PokemonSpecies(Species.TERRAKION, "Terrakion", 5, true, false, false, "Cavern Pokémon", Type.ROCK, Type.FIGHTING, 1.9, 260, Abilities.JUSTIFIED, Abilities.NONE, Abilities.NONE, 580, 91, 129, 90, 72, 90, 108, 3, 35, 261, GrowthRate.SLOW, "Undiscovered", null, null, 80, false),
    new PokemonSpecies(Species.VIRIZION, "Virizion", 5, true, false, false, "Grassland Pokémon", Type.GRASS, Type.FIGHTING, 2, 200, Abilities.JUSTIFIED, Abilities.NONE, Abilities.NONE, 580, 91, 90, 72, 90, 129, 108, 3, 35, 261, GrowthRate.SLOW, "Undiscovered", null, null, 80, false),
    new PokemonSpecies(Species.TORNADUS, "Tornadus", 5, true, false, false, "Cyclone Pokémon", Type.FLYING, null, 1.5, 63, Abilities.PRANKSTER, Abilities.NONE, Abilities.DEFIANT, 580, 79, 115, 70, 125, 80, 111, 3, 90, 261, GrowthRate.SLOW, "Undiscovered", null, 100, 120, false, true,
      new PokemonForm("Incarnate Forme", "incarnate", Type.FLYING, null, 1.5, 63, Abilities.PRANKSTER, Abilities.NONE, Abilities.DEFIANT, 580, 79, 115, 70, 125, 80, 111, 3, 90, 261, GrowthRate.SLOW, "Undiscovered", null, 100, 120, false),
      new PokemonForm("Therian Forme", "therian", Type.FLYING, null, 1.4, 63, Abilities.REGENERATOR, Abilities.NONE, Abilities.NONE, 580, 79, 100, 80, 110, 90, 121, 3, 90, 261, GrowthRate.SLOW, "Undiscovered", null, 100, 120, false)
    ),
    new PokemonSpecies(Species.THUNDURUS, "Thundurus", 5, true, false, false, "Bolt Strike Pokémon", Type.ELECTRIC, Type.FLYING, 1.5, 61, Abilities.PRANKSTER, Abilities.NONE, Abilities.DEFIANT, 580, 79, 115, 70, 125, 80, 111, 3, 90, 261, GrowthRate.SLOW, "Undiscovered", null, 100, 120, false, true,
      new PokemonForm("Incarnate Forme", "incarnate", Type.ELECTRIC, Type.FLYING, 1.5, 61, Abilities.PRANKSTER, Abilities.NONE, Abilities.DEFIANT, 580, 79, 115, 70, 125, 80, 111, 3, 90, 261, GrowthRate.SLOW, "Undiscovered", null, 100, 120, false),
      new PokemonForm("Therian Forme", "therian", Type.ELECTRIC, Type.FLYING, 3, 61, Abilities.VOLT_ABSORB, Abilities.NONE, Abilities.NONE, 580, 79, 105, 70, 145, 80, 101, 3, 90, 261, GrowthRate.SLOW, "Undiscovered", null, 100, 120, false)
    ),
    new PokemonSpecies(Species.RESHIRAM, "Reshiram", 5, false, true, false, "Vast White Pokémon", Type.DRAGON, Type.FIRE, 3.2, 330, Abilities.TURBOBLAZE, Abilities.NONE, Abilities.NONE, 680, 100, 120, 100, 150, 120, 90, 3, 0, 306, GrowthRate.SLOW, "Undiscovered", null, null, 120, false),
    new PokemonSpecies(Species.ZEKROM, "Zekrom", 5, false, true, false, "Deep Black Pokémon", Type.DRAGON, Type.ELECTRIC, 2.9, 345, Abilities.TERAVOLT, Abilities.NONE, Abilities.NONE, 680, 100, 150, 120, 120, 100, 90, 3, 0, 306, GrowthRate.SLOW, "Undiscovered", null, null, 120, false),
    new PokemonSpecies(Species.LANDORUS, "Landorus", 5, true, false, false, "Abundance Pokémon", Type.GROUND, Type.FLYING, 1.5, 68, Abilities.SAND_FORCE, Abilities.NONE, Abilities.SHEER_FORCE, 600, 89, 125, 90, 115, 80, 101, 3, 90, 270, GrowthRate.SLOW, "Undiscovered", null, 100, 120, false, true,
      new PokemonForm("Incarnate Forme", "incarnate", Type.GROUND, Type.FLYING, 1.5, 68, Abilities.SAND_FORCE, Abilities.NONE, Abilities.SHEER_FORCE, 600, 89, 125, 90, 115, 80, 101, 3, 90, 270, GrowthRate.SLOW, "Undiscovered", null, 100, 120, false),
      new PokemonForm("Therian Forme", "therian", Type.GROUND, Type.FLYING, 1.3, 68, Abilities.INTIMIDATE, Abilities.NONE, Abilities.NONE, 600, 89, 145, 90, 105, 80, 91, 3, 90, 270, GrowthRate.SLOW, "Undiscovered", null, 100, 120, false)
    ),
    new PokemonSpecies(Species.KYUREM, "Kyurem", 5, false, true, false, "Boundary Pokémon", Type.DRAGON, Type.ICE, 3, 325, Abilities.PRESSURE, Abilities.NONE, Abilities.NONE, 660, 125, 130, 90, 130, 90, 95, 3, 0, 297, GrowthRate.SLOW, "Undiscovered", null, null, 120, false, true,
      new PokemonForm("Normal", "", Type.DRAGON, Type.ICE, 3, 325, Abilities.PRESSURE, Abilities.NONE, Abilities.NONE, 660, 125, 130, 90, 130, 90, 95, 3, 0, 297, GrowthRate.SLOW, "Undiscovered", null, null, 120, false),
      new PokemonForm("Black", "black", Type.DRAGON, Type.ICE, 3.3, 325, Abilities.TERAVOLT, Abilities.NONE, Abilities.NONE, 700, 125, 170, 100, 120, 90, 95, 3, 0, 315, GrowthRate.SLOW, "Undiscovered", null, null, 120, false),
      new PokemonForm("White", "white", Type.DRAGON, Type.ICE, 3.6, 325, Abilities.TURBOBLAZE, Abilities.NONE, Abilities.NONE, 700, 125, 120, 90, 170, 100, 95, 3, 0, 315, GrowthRate.SLOW, "Undiscovered", null, null, 120, false)
    ),
    new PokemonSpecies(Species.KELDEO, "Keldeo", 5, false, false, true, "Colt Pokémon", Type.WATER, Type.FIGHTING, 1.4, 48.5, Abilities.JUSTIFIED, Abilities.NONE, Abilities.NONE, 580, 91, 72, 90, 129, 90, 108, 3, 35, 261, GrowthRate.SLOW, "Undiscovered", null, null, 80, false, true,
      new PokemonForm("Ordinary Forme", "ordinary", Type.WATER, Type.FIGHTING, 1.4, 48.5, Abilities.JUSTIFIED, Abilities.NONE, Abilities.NONE, 580, 91, 72, 90, 129, 90, 108, 3, 35, 261, GrowthRate.SLOW, "Undiscovered", null, null, 80, false),
      new PokemonForm("Resolute Forme", "resolute", Type.WATER, Type.FIGHTING, 1.4, 48.5, Abilities.JUSTIFIED, Abilities.NONE, Abilities.NONE, 580, 91, 72, 90, 129, 90, 108, 3, 35, 261, GrowthRate.SLOW, "Undiscovered", null, null, 80, false)
    ),
    new PokemonSpecies(Species.MELOETTA, "Meloetta", 5, false, false, true, "Melody Pokémon", Type.NORMAL, Type.PSYCHIC, 0.6, 6.5, Abilities.SERENE_GRACE, Abilities.NONE, Abilities.NONE, 600, 100, 77, 77, 128, 128, 90, 3, 100, 270, GrowthRate.SLOW, "Undiscovered", null, null, 120, false, true,
      new PokemonForm("Aria Forme", "aria", Type.NORMAL, Type.PSYCHIC, 0.6, 6.5, Abilities.SERENE_GRACE, Abilities.NONE, Abilities.NONE, 600, 100, 77, 77, 128, 128, 90, 3, 100, 270, GrowthRate.SLOW, "Undiscovered", null, null, 120, false),
      new PokemonForm("Pirouette Forme", "pirouette", Type.NORMAL, Type.FIGHTING, 0.6, 6.5, Abilities.SERENE_GRACE, Abilities.NONE, Abilities.NONE, 600, 100, 128, 90, 77, 77, 128, 3, 100, 270, GrowthRate.SLOW, "Undiscovered", null, null, 120, false)
    ),
    new PokemonSpecies(Species.GENESECT, "Genesect", 5, false, false, true, "Paleozoic Pokémon", Type.BUG, Type.STEEL, 1.5, 82.5, Abilities.DOWNLOAD, Abilities.NONE, Abilities.NONE, 600, 71, 120, 95, 120, 95, 99, 3, 0, 270, GrowthRate.SLOW, "Undiscovered", null, null, 120, false),
    new PokemonSpecies(Species.XERNEAS, "Xerneas", 6, false, true, false, "Life Pokémon", Type.FAIRY, null, 3, 215, Abilities.FAIRY_AURA, Abilities.NONE, Abilities.NONE, 680, 126, 131, 95, 131, 98, 99, 45, 0, 306, GrowthRate.SLOW, "Undiscovered", null, null, 120, false),
    new PokemonSpecies(Species.YVELTAL, "Yveltal", 6, false, true, false, "Destruction Pokémon", Type.DARK, Type.FLYING, 5.8, 203, Abilities.DARK_AURA, Abilities.NONE, Abilities.NONE, 680, 126, 131, 95, 131, 98, 99, 45, 0, 306, GrowthRate.SLOW, "Undiscovered", null, null, 120, false),
    new PokemonSpecies(Species.ETERNATUS, 'Eternatus', 8, false, true, false, 'Gigantic Pokemon', Type.POISON, Type.DRAGON, 20, 950, Abilities.PRESSURE, Abilities.NONE, Abilities.NONE, 690, 140, 85, 95, 145, 95, 130, 255, 0, 345, GrowthRate.SLOW, "Undiscovered", null, null, 120, false, false)
  );
}

// TODO: Remove
/*{
  setTimeout(() => {
    for (let tc of Object.keys(trainerConfigs)) {
      console.log(TrainerType[tc], !trainerConfigs[tc].speciesFilter ? 'all' : [...new Set(allSpecies.slice(0, -1).filter(trainerConfigs[tc].speciesFilter).map(s => {
        while (pokemonPrevolutions.hasOwnProperty(s.speciesId))
				  s = getPokemonSpecies(pokemonPrevolutions[s.speciesId]);
        return s;
      }))].map(s => s.name));
    }

    const speciesFilter = (species: PokemonSpecies) => !species.legendary && !species.pseudoLegendary && !species.mythical && species.baseTotal >= 540;
    console.log(!speciesFilter ? 'all' : [...new Set(allSpecies.slice(0, -1).filter(speciesFilter).map(s => {
      while (pokemonPrevolutions.hasOwnProperty(s.speciesId))
        s = getPokemonSpecies(pokemonPrevolutions[s.speciesId]);
      return s;
    }))].map(s => s.name));
  }, 1000);
}*/