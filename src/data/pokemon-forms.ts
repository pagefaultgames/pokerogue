import { TimeOfDay } from "./enums/time-of-day";
import { PokemonFormChangeItemModifier } from "../modifier/modifier";
import Pokemon from "../field/pokemon";
import { Moves } from "./enums/moves";
import { SpeciesFormKey } from "./pokemon-species";
import { Species } from "./enums/species";
import { StatusEffect } from "./status-effect";
import { MoveCategory, allMoves } from "./move";
import { Abilities } from "./enums/abilities";

export enum FormChangeItem {
  NONE,

  ABOMASITE,
  ABSOLITE,
  AERODACTYLITE,
  AGGRONITE,
  ALAKAZITE,
  ALTARIANITE,
  AMPHAROSITE,
  AUDINITE,
  BANETTITE,
  BEEDRILLITE,
  BLASTOISINITE,
  BLAZIKENITE,
  CAMERUPTITE,
  CHARIZARDITE_X,
  CHARIZARDITE_Y,
  DIANCITE,
  GALLADITE,
  GARCHOMPITE,
  GARDEVOIRITE,
  GENGARITE,
  GLALITITE,
  GYARADOSITE,
  HERACRONITE,
  HOUNDOOMINITE,
  KANGASKHANITE,
  LATIASITE,
  LATIOSITE,
  LOPUNNITE,
  LUCARIONITE,
  MANECTITE,
  MAWILITE,
  MEDICHAMITE,
  METAGROSSITE,
  MEWTWONITE_X,
  MEWTWONITE_Y,
  PIDGEOTITE,
  PINSIRITE,
  RAYQUAZITE,
  SABLENITE,
  SALAMENCITE,
  SCEPTILITE,
  SCIZORITE,
  SHARPEDONITE,
  SLOWBRONITE,
  STEELIXITE,
  SWAMPERTITE,
  TYRANITARITE,
  VENUSAURITE,

  BLUE_ORB = 50,
  RED_ORB,
  SHARP_METEORITE,
  HARD_METEORITE,
  SMOOTH_METEORITE,
  ADAMANT_CRYSTAL,
  LUSTROUS_GLOBE,
  GRISEOUS_CORE,
  REVEAL_GLASS,
  GRACIDEA,
  MAX_MUSHROOMS,
  DARK_STONE,
  LIGHT_STONE,
  PRISON_BOTTLE,
  N_LUNARIZER,
  N_SOLARIZER,
  RUSTED_SWORD,
  RUSTED_SHIELD,
  ICY_REINS_OF_UNITY,
  SHADOW_REINS_OF_UNITY,
  WELLSPRING_MASK,
  HEARTHFLAME_MASK,
  CORNERSTONE_MASK,
  SHOCK_DRIVE,
  BURN_DRIVE,
  CHILL_DRIVE,
  DOUSE_DRIVE,

  FIST_PLATE = 100,
  SKY_PLATE,
  TOXIC_PLATE,
  EARTH_PLATE,
  STONE_PLATE,
  INSECT_PLATE,
  SPOOKY_PLATE,
  IRON_PLATE,
  FLAME_PLATE,
  SPLASH_PLATE,
  MEADOW_PLATE,
  ZAP_PLATE,
  MIND_PLATE,
  ICICLE_PLATE,
  DRACO_PLATE,
  DREAD_PLATE,
  PIXIE_PLATE,
  BLANK_PLATE,  // TODO: Find a potential use for this
  LEGEND_PLATE, // TODO: Find a potential use for this
  FIGHTING_MEMORY,
  FLYING_MEMORY,
  POISON_MEMORY,
  GROUND_MEMORY,
  ROCK_MEMORY,
  BUG_MEMORY,
  GHOST_MEMORY,
  STEEL_MEMORY,
  FIRE_MEMORY,
  WATER_MEMORY,
  GRASS_MEMORY,
  ELECTRIC_MEMORY,
  PSYCHIC_MEMORY,
  ICE_MEMORY,
  DRAGON_MEMORY,
  DARK_MEMORY,
  FAIRY_MEMORY,
  BLANK_MEMORY  // TODO: Find a potential use for this
}

export type SpeciesFormChangeConditionPredicate = (p: Pokemon) => boolean;
export type SpeciesFormChangeConditionEnforceFunc = (p: Pokemon) => void;

export class SpeciesFormChange {
  public speciesId: Species;
  public preFormKey: string;
  public formKey: string;
  public trigger: SpeciesFormChangeTrigger;
  public quiet: boolean;
  private conditions: SpeciesFormChangeCondition[];

  constructor(speciesId: Species, preFormKey: string, evoFormKey: string, trigger: SpeciesFormChangeTrigger, quiet: boolean = false, ...conditions: SpeciesFormChangeCondition[]) {
    this.speciesId = speciesId;
    this.preFormKey = preFormKey;
    this.formKey = evoFormKey;
    this.trigger = trigger;
    this.quiet = quiet;
    this.conditions = conditions;
  }

  canChange(pokemon: Pokemon): boolean {
    if (pokemon.species.speciesId !== this.speciesId) {
      return false;
    }

    if (!pokemon.species.forms.length) {
      return false;
    }

    const formKeys = pokemon.species.forms.map(f => f.formKey);
    if (formKeys[pokemon.formIndex] !== this.preFormKey) {
      return false;
    }

    if (formKeys[pokemon.formIndex] === this.formKey) {
      return false;
    }

    for (const condition of this.conditions) {
      if (!condition.predicate(pokemon)) {
        return false;
      }
    }

    if (!this.trigger.canChange(pokemon)) {
      return false;
    }

    return true;
  }

  findTrigger(triggerType: { new(...args: any[]): SpeciesFormChangeTrigger }): SpeciesFormChangeTrigger {
    if (!this.trigger.hasTriggerType(triggerType)) {
      return null;
    }

    const trigger = this.trigger;

    if (trigger instanceof SpeciesFormChangeCompoundTrigger) {
      return trigger.triggers.find(t => t.hasTriggerType(triggerType));
    }

    return trigger;
  }
}

export class SpeciesFormChangeCondition {
  public predicate: SpeciesFormChangeConditionPredicate;
  public enforceFunc: SpeciesFormChangeConditionEnforceFunc;

  constructor(predicate: SpeciesFormChangeConditionPredicate, enforceFunc?: SpeciesFormChangeConditionEnforceFunc) {
    this.predicate = predicate;
    this.enforceFunc = enforceFunc;
  }
}

export abstract class SpeciesFormChangeTrigger {
  canChange(pokemon: Pokemon): boolean {
    return true;
  }

  hasTriggerType(triggerType: { new(...args: any[]): SpeciesFormChangeTrigger }): boolean {
    return this instanceof triggerType;
  }
}

export class SpeciesFormChangeManualTrigger extends SpeciesFormChangeTrigger {
  canChange(pokemon: Pokemon): boolean {
    return true;
  }
}

export class SpeciesFormChangeCompoundTrigger {
  public triggers: SpeciesFormChangeTrigger[];

  constructor(...triggers: SpeciesFormChangeTrigger[]) {
    this.triggers = triggers;
  }

  canChange(pokemon: Pokemon): boolean {
    for (const trigger of this.triggers) {
      if (!trigger.canChange(pokemon)) {
        return false;
      }
    }

    return true;
  }

  hasTriggerType(triggerType: { new(...args: any[]): SpeciesFormChangeTrigger }): boolean {
    return !!this.triggers.find(t => t.hasTriggerType(triggerType));
  }
}

export class SpeciesFormChangeItemTrigger extends SpeciesFormChangeTrigger {
  public item: FormChangeItem;
  public active: boolean;

  constructor(item: FormChangeItem, active: boolean = true) {
    super();
    this.item = item;
    this.active = active;
  }

  canChange(pokemon: Pokemon): boolean {
    return !!pokemon.scene.findModifier(m => m instanceof PokemonFormChangeItemModifier && m.pokemonId === pokemon.id && m.formChangeItem === this.item && m.active === this.active);
  }
}

export class SpeciesFormChangeTimeOfDayTrigger extends SpeciesFormChangeTrigger {
  public timesOfDay: TimeOfDay[];

  constructor(...timesOfDay: TimeOfDay[]) {
    super();
    this.timesOfDay = timesOfDay;
  }

  canChange(pokemon: Pokemon): boolean {
    return this.timesOfDay.indexOf(pokemon.scene.arena.getTimeOfDay()) > -1;
  }
}

export class SpeciesFormChangeActiveTrigger extends SpeciesFormChangeTrigger {
  public active: boolean;

  constructor(active: boolean = false) {
    super();
    this.active = active;
  }

  canChange(pokemon: Pokemon): boolean {
    return pokemon.isActive(true) === this.active;
  }
}

export class SpeciesFormChangeStatusEffectTrigger extends SpeciesFormChangeTrigger {
  public statusEffects: StatusEffect[];
  public invert: boolean;

  constructor(statusEffects: StatusEffect | StatusEffect[], invert: boolean = false) {
    super();
    if (!Array.isArray(statusEffects)) {
      statusEffects = [ statusEffects ];
    }
    this.statusEffects = statusEffects;
    this.invert = invert;
  }

  canChange(pokemon: Pokemon): boolean {
    return (this.statusEffects.indexOf(pokemon.status?.effect || StatusEffect.NONE) > -1) !== this.invert;
  }
}

export class SpeciesFormChangeMoveLearnedTrigger extends SpeciesFormChangeTrigger {
  public move: Moves;
  public known: boolean;

  constructor(move: Moves, known: boolean = true) {
    super();
    this.move = move;
    this.known = known;
  }

  canChange(pokemon: Pokemon): boolean {
    return (!!pokemon.moveset.filter(m => m.moveId === this.move).length) === this.known;
  }
}

export abstract class SpeciesFormChangeMoveTrigger extends SpeciesFormChangeTrigger {
  public movePredicate: (m: Moves) => boolean;
  public used: boolean;

  constructor(move: Moves | ((m: Moves) => boolean), used: boolean = true) {
    super();
    this.movePredicate = typeof move === "function" ? move : (m: Moves) => m === move;
    this.used = used;
  }
}

export class SpeciesFormChangePreMoveTrigger extends SpeciesFormChangeMoveTrigger {
  canChange(pokemon: Pokemon): boolean {
    const command = pokemon.scene.currentBattle.turnCommands[pokemon.getBattlerIndex()];
    return command?.move && this.movePredicate(command.move.move) === this.used;
  }
}

export class SpeciesFormChangePostMoveTrigger extends SpeciesFormChangeMoveTrigger {
  canChange(pokemon: Pokemon): boolean {
    return pokemon.summonData && !!pokemon.getLastXMoves(1).filter(m => this.movePredicate(m.move)).length === this.used;
  }
}

export class SpeciesDefaultFormMatchTrigger extends SpeciesFormChangeTrigger {
  private formKey: string;

  constructor(formKey: string) {
    super();
    this.formKey = formKey;
  }

  canChange(pokemon: Pokemon): boolean {
    return this.formKey === pokemon.species.forms[pokemon.scene.getSpeciesFormIndex(pokemon.species, pokemon.gender, pokemon.getNature(), true)].formKey;
  }
}

export function getSpeciesFormChangeMessage(pokemon: Pokemon, formChange: SpeciesFormChange, preName: string): string {
  const isMega = formChange.formKey.indexOf(SpeciesFormKey.MEGA) > -1;
  const isGmax = formChange.formKey.indexOf(SpeciesFormKey.GIGANTAMAX) > -1;
  const isEmax = formChange.formKey.indexOf("eternamax") > -1;
  const isRevert = !isMega && formChange.formKey === pokemon.species.forms[0].formKey;
  const prefix = !pokemon.isPlayer() ? pokemon.hasTrainer() ? "Foe " : "Wild " : "Your ";
  if (isMega) {
    return `${prefix}${preName} Mega Evolved\ninto ${pokemon.name}!`;
  }
  if (isGmax) {
    return `${prefix}${preName} Gigantamaxed\ninto ${pokemon.name}!`;
  }
  if (isEmax) {
    return `${prefix}${preName} Eternamaxed\ninto ${pokemon.name}!`;
  }
  if (isRevert) {
    return `${prefix}${pokemon.name} reverted\nto its original form!`;
  }
  return `${prefix}${preName} changed form!`;
}

interface PokemonFormChanges {
  [key: string]: SpeciesFormChange[]
}

export const pokemonFormChanges: PokemonFormChanges = {
  [Species.VENUSAUR]: [
    new SpeciesFormChange(Species.VENUSAUR, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.VENUSAURITE)),
    new SpeciesFormChange(Species.VENUSAUR, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.BLASTOISE]: [
    new SpeciesFormChange(Species.BLASTOISE, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.BLASTOISINITE)),
    new SpeciesFormChange(Species.BLASTOISE, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.CHARIZARD]: [
    new SpeciesFormChange(Species.CHARIZARD, "", SpeciesFormKey.MEGA_X, new SpeciesFormChangeItemTrigger(FormChangeItem.CHARIZARDITE_X)),
    new SpeciesFormChange(Species.CHARIZARD, "", SpeciesFormKey.MEGA_Y, new SpeciesFormChangeItemTrigger(FormChangeItem.CHARIZARDITE_Y)),
    new SpeciesFormChange(Species.CHARIZARD, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.BUTTERFREE]: [
    new SpeciesFormChange(Species.BUTTERFREE, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.BEEDRILL]: [
    new SpeciesFormChange(Species.BEEDRILL, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.BEEDRILLITE))
  ],
  [Species.PIDGEOT]: [
    new SpeciesFormChange(Species.PIDGEOT, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.PIDGEOTITE))
  ],
  [Species.PIKACHU]: [
    new SpeciesFormChange(Species.PIKACHU, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(Species.PIKACHU, "partner", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.MEOWTH]: [
    new SpeciesFormChange(Species.MEOWTH, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.ALAKAZAM]: [
    new SpeciesFormChange(Species.ALAKAZAM, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.ALAKAZITE))
  ],
  [Species.MACHAMP]: [
    new SpeciesFormChange(Species.MACHAMP, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.SLOWBRO]: [
    new SpeciesFormChange(Species.SLOWBRO, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.SLOWBRONITE))
  ],
  [Species.GENGAR]: [
    new SpeciesFormChange(Species.GENGAR, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.GENGARITE)),
    new SpeciesFormChange(Species.GENGAR, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.KINGLER]: [
    new SpeciesFormChange(Species.KINGLER, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.KANGASKHAN]: [
    new SpeciesFormChange(Species.KANGASKHAN, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.KANGASKHANITE))
  ],
  [Species.PINSIR]: [
    new SpeciesFormChange(Species.PINSIR, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.PINSIRITE))
  ],
  [Species.GYARADOS]: [
    new SpeciesFormChange(Species.GYARADOS, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.GYARADOSITE))
  ],
  [Species.LAPRAS]: [
    new SpeciesFormChange(Species.LAPRAS, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.EEVEE]: [
    new SpeciesFormChange(Species.EEVEE, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(Species.EEVEE, "partner", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.SNORLAX]: [
    new SpeciesFormChange(Species.SNORLAX, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.AERODACTYL]: [
    new SpeciesFormChange(Species.AERODACTYL, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.AERODACTYLITE))
  ],
  [Species.MEWTWO]: [
    new SpeciesFormChange(Species.MEWTWO, "", SpeciesFormKey.MEGA_X, new SpeciesFormChangeItemTrigger(FormChangeItem.MEWTWONITE_X)),
    new SpeciesFormChange(Species.MEWTWO, "", SpeciesFormKey.MEGA_Y, new SpeciesFormChangeItemTrigger(FormChangeItem.MEWTWONITE_Y))
  ],
  [Species.AMPHAROS]: [
    new SpeciesFormChange(Species.AMPHAROS, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.AMPHAROSITE))
  ],
  [Species.STEELIX]: [
    new SpeciesFormChange(Species.STEELIX, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.STEELIXITE))
  ],
  [Species.SCIZOR]: [
    new SpeciesFormChange(Species.SCIZOR, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.SCIZORITE))
  ],
  [Species.HERACROSS]: [
    new SpeciesFormChange(Species.HERACROSS, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.HERACRONITE))
  ],
  [Species.HOUNDOOM]: [
    new SpeciesFormChange(Species.HOUNDOOM, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.HOUNDOOMINITE))
  ],
  [Species.TYRANITAR]: [
    new SpeciesFormChange(Species.TYRANITAR, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.TYRANITARITE))
  ],
  [Species.SCEPTILE]: [
    new SpeciesFormChange(Species.SCEPTILE, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.SCEPTILITE))
  ],
  [Species.BLAZIKEN]: [
    new SpeciesFormChange(Species.BLAZIKEN, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.BLAZIKENITE))
  ],
  [Species.SWAMPERT]: [
    new SpeciesFormChange(Species.SWAMPERT, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.SWAMPERTITE))
  ],
  [Species.GARDEVOIR]: [
    new SpeciesFormChange(Species.GARDEVOIR, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.GARDEVOIRITE))
  ],
  [Species.SABLEYE]: [
    new SpeciesFormChange(Species.SABLEYE, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.SABLENITE))
  ],
  [Species.MAWILE]: [
    new SpeciesFormChange(Species.MAWILE, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.MAWILITE))
  ],
  [Species.AGGRON]: [
    new SpeciesFormChange(Species.AGGRON, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.AGGRONITE))
  ],
  [Species.MEDICHAM]: [
    new SpeciesFormChange(Species.MEDICHAM, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.MEDICHAMITE))
  ],
  [Species.MANECTRIC]: [
    new SpeciesFormChange(Species.MANECTRIC, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.MANECTITE))
  ],
  [Species.SHARPEDO]: [
    new SpeciesFormChange(Species.SHARPEDO, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.SHARPEDONITE))
  ],
  [Species.CAMERUPT]: [
    new SpeciesFormChange(Species.CAMERUPT, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.CAMERUPTITE))
  ],
  [Species.ALTARIA]: [
    new SpeciesFormChange(Species.ALTARIA, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.ALTARIANITE))
  ],
  [Species.BANETTE]: [
    new SpeciesFormChange(Species.BANETTE, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.BANETTITE))
  ],
  [Species.ABSOL]: [
    new SpeciesFormChange(Species.ABSOL, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.ABSOLITE))
  ],
  [Species.GLALIE]: [
    new SpeciesFormChange(Species.GLALIE, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.GLALITITE))
  ],
  [Species.SALAMENCE]: [
    new SpeciesFormChange(Species.SALAMENCE, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.SALAMENCITE))
  ],
  [Species.METAGROSS]: [
    new SpeciesFormChange(Species.METAGROSS, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.METAGROSSITE))
  ],
  [Species.LATIAS]: [
    new SpeciesFormChange(Species.LATIAS, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.LATIASITE))
  ],
  [Species.LATIOS]: [
    new SpeciesFormChange(Species.LATIOS, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.LATIOSITE))
  ],
  [Species.KYOGRE]: [
    new SpeciesFormChange(Species.KYOGRE, "", SpeciesFormKey.PRIMAL, new SpeciesFormChangeItemTrigger(FormChangeItem.BLUE_ORB))
  ],
  [Species.GROUDON]: [
    new SpeciesFormChange(Species.GROUDON, "", SpeciesFormKey.PRIMAL, new SpeciesFormChangeItemTrigger(FormChangeItem.RED_ORB))
  ],
  [Species.RAYQUAZA]: [
    new SpeciesFormChange(Species.RAYQUAZA, "", SpeciesFormKey.MEGA, new SpeciesFormChangeCompoundTrigger(new SpeciesFormChangeItemTrigger(FormChangeItem.RAYQUAZITE), new SpeciesFormChangeMoveLearnedTrigger(Moves.DRAGON_ASCENT)))
  ],
  [Species.DEOXYS]: [
    new SpeciesFormChange(Species.DEOXYS, "normal", "attack", new SpeciesFormChangeItemTrigger(FormChangeItem.SHARP_METEORITE)),
    new SpeciesFormChange(Species.DEOXYS, "normal", "defense", new SpeciesFormChangeItemTrigger(FormChangeItem.HARD_METEORITE)),
    new SpeciesFormChange(Species.DEOXYS, "normal", "speed", new SpeciesFormChangeItemTrigger(FormChangeItem.SMOOTH_METEORITE))
  ],
  [Species.LOPUNNY]: [
    new SpeciesFormChange(Species.LOPUNNY, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.LOPUNNITE))
  ],
  [Species.GARCHOMP]: [
    new SpeciesFormChange(Species.GARCHOMP, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.GARCHOMPITE))
  ],
  [Species.LUCARIO]: [
    new SpeciesFormChange(Species.LUCARIO, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.LUCARIONITE))
  ],
  [Species.ABOMASNOW]: [
    new SpeciesFormChange(Species.ABOMASNOW, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.ABOMASITE))
  ],
  [Species.GALLADE]: [
    new SpeciesFormChange(Species.GALLADE, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.GALLADITE))
  ],
  [Species.AUDINO]: [
    new SpeciesFormChange(Species.AUDINO, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.AUDINITE))
  ],
  [Species.DIALGA]: [
    new SpeciesFormChange(Species.DIALGA, "", SpeciesFormKey.ORIGIN, new SpeciesFormChangeItemTrigger(FormChangeItem.ADAMANT_CRYSTAL))
  ],
  [Species.PALKIA]: [
    new SpeciesFormChange(Species.PALKIA, "", SpeciesFormKey.ORIGIN, new SpeciesFormChangeItemTrigger(FormChangeItem.LUSTROUS_GLOBE))
  ],
  [Species.GIRATINA]: [
    new SpeciesFormChange(Species.GIRATINA, "altered", SpeciesFormKey.ORIGIN, new SpeciesFormChangeItemTrigger(FormChangeItem.GRISEOUS_CORE))
  ],
  [Species.SHAYMIN]: [
    new SpeciesFormChange(Species.SHAYMIN, "land", "sky", new SpeciesFormChangeCompoundTrigger(new SpeciesFormChangeTimeOfDayTrigger(TimeOfDay.DAY, TimeOfDay.DUSK),
      new SpeciesFormChangeItemTrigger(FormChangeItem.GRACIDEA), new SpeciesFormChangeStatusEffectTrigger(StatusEffect.FREEZE, true))),
    new SpeciesFormChange(Species.SHAYMIN, "sky", "land", new SpeciesFormChangeTimeOfDayTrigger(TimeOfDay.DAWN, TimeOfDay.NIGHT)),
    new SpeciesFormChange(Species.SHAYMIN, "sky", "land", new SpeciesFormChangeStatusEffectTrigger(StatusEffect.FREEZE))
  ],
  [Species.ARCEUS]: [
    new SpeciesFormChange(Species.ARCEUS, "normal", "fighting", new SpeciesFormChangeItemTrigger(FormChangeItem.FIST_PLATE)),
    new SpeciesFormChange(Species.ARCEUS, "normal", "flying", new SpeciesFormChangeItemTrigger(FormChangeItem.SKY_PLATE)),
    new SpeciesFormChange(Species.ARCEUS, "normal", "poison", new SpeciesFormChangeItemTrigger(FormChangeItem.TOXIC_PLATE)),
    new SpeciesFormChange(Species.ARCEUS, "normal", "ground", new SpeciesFormChangeItemTrigger(FormChangeItem.EARTH_PLATE)),
    new SpeciesFormChange(Species.ARCEUS, "normal", "rock", new SpeciesFormChangeItemTrigger(FormChangeItem.STONE_PLATE)),
    new SpeciesFormChange(Species.ARCEUS, "normal", "bug", new SpeciesFormChangeItemTrigger(FormChangeItem.INSECT_PLATE)),
    new SpeciesFormChange(Species.ARCEUS, "normal", "ghost", new SpeciesFormChangeItemTrigger(FormChangeItem.SPOOKY_PLATE)),
    new SpeciesFormChange(Species.ARCEUS, "normal", "steel", new SpeciesFormChangeItemTrigger(FormChangeItem.IRON_PLATE)),
    new SpeciesFormChange(Species.ARCEUS, "normal", "fire", new SpeciesFormChangeItemTrigger(FormChangeItem.FLAME_PLATE)),
    new SpeciesFormChange(Species.ARCEUS, "normal", "water", new SpeciesFormChangeItemTrigger(FormChangeItem.SPLASH_PLATE)),
    new SpeciesFormChange(Species.ARCEUS, "normal", "grass", new SpeciesFormChangeItemTrigger(FormChangeItem.MEADOW_PLATE)),
    new SpeciesFormChange(Species.ARCEUS, "normal", "electric", new SpeciesFormChangeItemTrigger(FormChangeItem.ZAP_PLATE)),
    new SpeciesFormChange(Species.ARCEUS, "normal", "psychic", new SpeciesFormChangeItemTrigger(FormChangeItem.MIND_PLATE)),
    new SpeciesFormChange(Species.ARCEUS, "normal", "ice", new SpeciesFormChangeItemTrigger(FormChangeItem.ICICLE_PLATE)),
    new SpeciesFormChange(Species.ARCEUS, "normal", "dragon", new SpeciesFormChangeItemTrigger(FormChangeItem.DRACO_PLATE)),
    new SpeciesFormChange(Species.ARCEUS, "normal", "dark", new SpeciesFormChangeItemTrigger(FormChangeItem.DREAD_PLATE)),
    new SpeciesFormChange(Species.ARCEUS, "normal", "fairy", new SpeciesFormChangeItemTrigger(FormChangeItem.PIXIE_PLATE))
  ],
  [Species.DARMANITAN]: [
    new SpeciesFormChange(Species.DARMANITAN, "", "zen", new SpeciesFormChangeManualTrigger(), true),
    new SpeciesFormChange(Species.DARMANITAN, "zen", "", new SpeciesFormChangeManualTrigger(), true)
  ],
  [Species.GARBODOR]: [
    new SpeciesFormChange(Species.GARBODOR, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.TORNADUS]: [
    new SpeciesFormChange(Species.TORNADUS, SpeciesFormKey.INCARNATE, SpeciesFormKey.THERIAN, new SpeciesFormChangeItemTrigger(FormChangeItem.REVEAL_GLASS))
  ],
  [Species.THUNDURUS]: [
    new SpeciesFormChange(Species.THUNDURUS, SpeciesFormKey.INCARNATE, SpeciesFormKey.THERIAN, new SpeciesFormChangeItemTrigger(FormChangeItem.REVEAL_GLASS))
  ],
  [Species.LANDORUS]: [
    new SpeciesFormChange(Species.LANDORUS, SpeciesFormKey.INCARNATE, SpeciesFormKey.THERIAN, new SpeciesFormChangeItemTrigger(FormChangeItem.REVEAL_GLASS))
  ],
  [Species.KYUREM]: [
    new SpeciesFormChange(Species.KYUREM, "", "black", new SpeciesFormChangeItemTrigger(FormChangeItem.DARK_STONE)),
    new SpeciesFormChange(Species.KYUREM, "", "white", new SpeciesFormChangeItemTrigger(FormChangeItem.LIGHT_STONE))
  ],
  [Species.KELDEO]: [
    new SpeciesFormChange(Species.KELDEO, "ordinary", "resolute", new SpeciesFormChangeMoveLearnedTrigger(Moves.SECRET_SWORD)),
    new SpeciesFormChange(Species.KELDEO, "resolute", "ordinary", new SpeciesFormChangeMoveLearnedTrigger(Moves.SECRET_SWORD, false))
  ],
  [Species.MELOETTA]: [
    new SpeciesFormChange(Species.MELOETTA, "aria", "pirouette", new SpeciesFormChangePostMoveTrigger(Moves.RELIC_SONG), true),
    new SpeciesFormChange(Species.MELOETTA, "pirouette", "aria", new SpeciesFormChangePostMoveTrigger(Moves.RELIC_SONG), true),
    new SpeciesFormChange(Species.MELOETTA, "pirouette", "aria", new SpeciesFormChangeActiveTrigger(false), true)
  ],
  [Species.GENESECT]: [
    new SpeciesFormChange(Species.GENESECT, "", "shock", new SpeciesFormChangeItemTrigger(FormChangeItem.SHOCK_DRIVE)),
    new SpeciesFormChange(Species.GENESECT, "", "burn", new SpeciesFormChangeItemTrigger(FormChangeItem.BURN_DRIVE)),
    new SpeciesFormChange(Species.GENESECT, "", "chill", new SpeciesFormChangeItemTrigger(FormChangeItem.CHILL_DRIVE)),
    new SpeciesFormChange(Species.GENESECT, "", "douse", new SpeciesFormChangeItemTrigger(FormChangeItem.DOUSE_DRIVE))
  ],
  [Species.GRENINJA]: [
    new SpeciesFormChange(Species.GRENINJA, "battle-bond", "ash", new SpeciesFormChangeManualTrigger(), true),
    new SpeciesFormChange(Species.GRENINJA, "ash", "battle-bond", new SpeciesFormChangeManualTrigger(), true)
  ],
  [Species.PALAFIN] : [
    new SpeciesFormChange(Species.PALAFIN, "zero", "hero", new SpeciesFormChangeManualTrigger(), true),
    new SpeciesFormChange(Species.PALAFIN, "hero", "zero", new SpeciesFormChangeManualTrigger(), true)
  ],
  [Species.AEGISLASH]: [
    new SpeciesFormChange(Species.AEGISLASH, "blade", "shield", new SpeciesFormChangePreMoveTrigger(Moves.KINGS_SHIELD), true, new SpeciesFormChangeCondition(p => p.hasAbility(Abilities.STANCE_CHANGE))),
    new SpeciesFormChange(Species.AEGISLASH, "shield", "blade", new SpeciesFormChangePreMoveTrigger(m => allMoves[m].category !== MoveCategory.STATUS), true, new SpeciesFormChangeCondition(p => p.hasAbility(Abilities.STANCE_CHANGE))),
    new SpeciesFormChange(Species.AEGISLASH, "blade", "shield", new SpeciesFormChangeActiveTrigger(false), true)
  ],
  [Species.ZYGARDE]: [
    new SpeciesFormChange(Species.ZYGARDE, "50-pc", "complete", new SpeciesFormChangeManualTrigger(), true),
    new SpeciesFormChange(Species.ZYGARDE, "complete", "50-pc", new SpeciesFormChangeManualTrigger(), true),
    new SpeciesFormChange(Species.ZYGARDE, "10-pc", "complete", new SpeciesFormChangeManualTrigger(), true),
    new SpeciesFormChange(Species.ZYGARDE, "complete", "10-pc", new SpeciesFormChangeManualTrigger(), true)
  ],
  [Species.DIANCIE]: [
    new SpeciesFormChange(Species.DIANCIE, "", SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.DIANCITE))
  ],
  [Species.HOOPA]: [
    new SpeciesFormChange(Species.HOOPA, "", "unbound", new SpeciesFormChangeItemTrigger(FormChangeItem.PRISON_BOTTLE))
  ],
  [Species.WISHIWASHI]: [
    new SpeciesFormChange(Species.WISHIWASHI, "", "school", new SpeciesFormChangeManualTrigger(), true),
    new SpeciesFormChange(Species.WISHIWASHI, "school", "", new SpeciesFormChangeManualTrigger(), true)
  ],
  [Species.SILVALLY]: [
    new SpeciesFormChange(Species.SILVALLY, "normal", "fighting", new SpeciesFormChangeItemTrigger(FormChangeItem.FIGHTING_MEMORY)),
    new SpeciesFormChange(Species.SILVALLY, "normal", "flying", new SpeciesFormChangeItemTrigger(FormChangeItem.FLYING_MEMORY)),
    new SpeciesFormChange(Species.SILVALLY, "normal", "poison", new SpeciesFormChangeItemTrigger(FormChangeItem.POISON_MEMORY)),
    new SpeciesFormChange(Species.SILVALLY, "normal", "ground", new SpeciesFormChangeItemTrigger(FormChangeItem.GROUND_MEMORY)),
    new SpeciesFormChange(Species.SILVALLY, "normal", "rock", new SpeciesFormChangeItemTrigger(FormChangeItem.ROCK_MEMORY)),
    new SpeciesFormChange(Species.SILVALLY, "normal", "bug", new SpeciesFormChangeItemTrigger(FormChangeItem.BUG_MEMORY)),
    new SpeciesFormChange(Species.SILVALLY, "normal", "ghost", new SpeciesFormChangeItemTrigger(FormChangeItem.GHOST_MEMORY)),
    new SpeciesFormChange(Species.SILVALLY, "normal", "steel", new SpeciesFormChangeItemTrigger(FormChangeItem.STEEL_MEMORY)),
    new SpeciesFormChange(Species.SILVALLY, "normal", "fire", new SpeciesFormChangeItemTrigger(FormChangeItem.FIRE_MEMORY)),
    new SpeciesFormChange(Species.SILVALLY, "normal", "water", new SpeciesFormChangeItemTrigger(FormChangeItem.WATER_MEMORY)),
    new SpeciesFormChange(Species.SILVALLY, "normal", "grass", new SpeciesFormChangeItemTrigger(FormChangeItem.GRASS_MEMORY)),
    new SpeciesFormChange(Species.SILVALLY, "normal", "electric", new SpeciesFormChangeItemTrigger(FormChangeItem.ELECTRIC_MEMORY)),
    new SpeciesFormChange(Species.SILVALLY, "normal", "psychic", new SpeciesFormChangeItemTrigger(FormChangeItem.PSYCHIC_MEMORY)),
    new SpeciesFormChange(Species.SILVALLY, "normal", "ice", new SpeciesFormChangeItemTrigger(FormChangeItem.ICE_MEMORY)),
    new SpeciesFormChange(Species.SILVALLY, "normal", "dragon", new SpeciesFormChangeItemTrigger(FormChangeItem.DRAGON_MEMORY)),
    new SpeciesFormChange(Species.SILVALLY, "normal", "dark", new SpeciesFormChangeItemTrigger(FormChangeItem.DARK_MEMORY)),
    new SpeciesFormChange(Species.SILVALLY, "normal", "fairy", new SpeciesFormChangeItemTrigger(FormChangeItem.FAIRY_MEMORY))
  ],
  [Species.MINIOR]: [
    new SpeciesFormChange(Species.MINIOR, "red-meteor", "red", new SpeciesFormChangeManualTrigger(), true),
    new SpeciesFormChange(Species.MINIOR, "red", "red-meteor", new SpeciesFormChangeManualTrigger(), true),
    new SpeciesFormChange(Species.MINIOR, "orange-meteor", "orange", new SpeciesFormChangeManualTrigger(), true),
    new SpeciesFormChange(Species.MINIOR, "orange", "orange-meteor", new SpeciesFormChangeManualTrigger(), true),
    new SpeciesFormChange(Species.MINIOR, "yellow-meteor", "yellow", new SpeciesFormChangeManualTrigger(), true),
    new SpeciesFormChange(Species.MINIOR, "yellow", "yellow-meteor", new SpeciesFormChangeManualTrigger(), true),
    new SpeciesFormChange(Species.MINIOR, "green-meteor", "green", new SpeciesFormChangeManualTrigger(), true),
    new SpeciesFormChange(Species.MINIOR, "green", "green-meteor", new SpeciesFormChangeManualTrigger(), true),
    new SpeciesFormChange(Species.MINIOR, "blue-meteor", "blue", new SpeciesFormChangeManualTrigger(), true),
    new SpeciesFormChange(Species.MINIOR, "blue", "blue-meteor", new SpeciesFormChangeManualTrigger(), true),
    new SpeciesFormChange(Species.MINIOR, "indigo-meteor", "indigo", new SpeciesFormChangeManualTrigger(), true),
    new SpeciesFormChange(Species.MINIOR, "indigo", "indigo-meteor", new SpeciesFormChangeManualTrigger(), true),
    new SpeciesFormChange(Species.MINIOR, "violet-meteor", "violet", new SpeciesFormChangeManualTrigger(), true),
    new SpeciesFormChange(Species.MINIOR, "violet", "violet-meteor", new SpeciesFormChangeManualTrigger(), true)
  ],
  [Species.MIMIKYU]: [
    new SpeciesFormChange(Species.MIMIKYU, "disguised", "busted", new SpeciesFormChangeManualTrigger(), true),
    new SpeciesFormChange(Species.MIMIKYU, "busted", "disguised", new SpeciesFormChangeManualTrigger(), true)
  ],
  [Species.NECROZMA]: [
    new SpeciesFormChange(Species.NECROZMA, "", "dawn-wings", new SpeciesFormChangeItemTrigger(FormChangeItem.N_LUNARIZER)),
    new SpeciesFormChange(Species.NECROZMA, "", "dusk-mane", new SpeciesFormChangeItemTrigger(FormChangeItem.N_SOLARIZER))
  ],
  [Species.MELMETAL]: [
    new SpeciesFormChange(Species.MELMETAL, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.RILLABOOM]: [
    new SpeciesFormChange(Species.RILLABOOM, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.CINDERACE]: [
    new SpeciesFormChange(Species.CINDERACE, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.INTELEON]: [
    new SpeciesFormChange(Species.INTELEON, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.CORVIKNIGHT]: [
    new SpeciesFormChange(Species.CORVIKNIGHT, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.ORBEETLE]: [
    new SpeciesFormChange(Species.ORBEETLE, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.DREDNAW]: [
    new SpeciesFormChange(Species.DREDNAW, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.COALOSSAL]: [
    new SpeciesFormChange(Species.COALOSSAL, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.FLAPPLE]: [
    new SpeciesFormChange(Species.FLAPPLE, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.APPLETUN]: [
    new SpeciesFormChange(Species.APPLETUN, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.SANDACONDA]: [
    new SpeciesFormChange(Species.SANDACONDA, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.TOXTRICITY]: [
    new SpeciesFormChange(Species.TOXTRICITY, "amped", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(Species.TOXTRICITY, "lowkey", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(Species.TOXTRICITY, SpeciesFormKey.GIGANTAMAX, "amped", new SpeciesFormChangeCompoundTrigger(new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS, false), new SpeciesDefaultFormMatchTrigger("amped"))),
    new SpeciesFormChange(Species.TOXTRICITY, SpeciesFormKey.GIGANTAMAX, "lowkey", new SpeciesFormChangeCompoundTrigger(new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS, false), new SpeciesDefaultFormMatchTrigger("lowkey")))
  ],
  [Species.CENTISKORCH]: [
    new SpeciesFormChange(Species.CENTISKORCH, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.HATTERENE]: [
    new SpeciesFormChange(Species.HATTERENE, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.GRIMMSNARL]: [
    new SpeciesFormChange(Species.GRIMMSNARL, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.ALCREMIE]: [
    new SpeciesFormChange(Species.ALCREMIE, "vanilla-cream", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(Species.ALCREMIE, "ruby-cream", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(Species.ALCREMIE, "matcha-cream", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(Species.ALCREMIE, "mint-cream", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(Species.ALCREMIE, "lemon-cream", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(Species.ALCREMIE, "salted-cream", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(Species.ALCREMIE, "ruby-swirl", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(Species.ALCREMIE, "caramel-swirl", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(Species.ALCREMIE, "rainbow-swirl", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.MORPEKO]: [
    new SpeciesFormChange(Species.MORPEKO, "full-belly", "hangry", new SpeciesFormChangeManualTrigger(), true),
    new SpeciesFormChange(Species.MORPEKO, "hangry", "full-belly", new SpeciesFormChangeManualTrigger(), true)
  ],
  [Species.COPPERAJAH]: [
    new SpeciesFormChange(Species.COPPERAJAH, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.DURALUDON]: [
    new SpeciesFormChange(Species.DURALUDON, "", SpeciesFormKey.GIGANTAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.ZACIAN]: [
    new SpeciesFormChange(Species.ZACIAN, "hero-of-many-battles", "crowned", new SpeciesFormChangeItemTrigger(FormChangeItem.RUSTED_SWORD))
  ],
  [Species.ZAMAZENTA]: [
    new SpeciesFormChange(Species.ZAMAZENTA, "hero-of-many-battles", "crowned", new SpeciesFormChangeItemTrigger(FormChangeItem.RUSTED_SHIELD))
  ],
  [Species.ETERNATUS]: [
    new SpeciesFormChange(Species.ETERNATUS, "", SpeciesFormKey.ETERNAMAX, new SpeciesFormChangeManualTrigger()),
    new SpeciesFormChange(Species.ETERNATUS, "", SpeciesFormKey.ETERNAMAX, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.URSHIFU]: [
    new SpeciesFormChange(Species.URSHIFU, "single-strike", SpeciesFormKey.GIGANTAMAX_SINGLE, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS)),
    new SpeciesFormChange(Species.URSHIFU, "rapid-strike", SpeciesFormKey.GIGANTAMAX_RAPID, new SpeciesFormChangeItemTrigger(FormChangeItem.MAX_MUSHROOMS))
  ],
  [Species.CALYREX]: [
    new SpeciesFormChange(Species.CALYREX, "", "ice", new SpeciesFormChangeItemTrigger(FormChangeItem.ICY_REINS_OF_UNITY)),
    new SpeciesFormChange(Species.CALYREX, "", "shadow", new SpeciesFormChangeItemTrigger(FormChangeItem.SHADOW_REINS_OF_UNITY))
  ],
  [Species.ENAMORUS]: [
    new SpeciesFormChange(Species.ENAMORUS, SpeciesFormKey.INCARNATE, SpeciesFormKey.THERIAN, new SpeciesFormChangeItemTrigger(FormChangeItem.REVEAL_GLASS))
  ],
  [Species.OGERPON]: [
    new SpeciesFormChange(Species.OGERPON, "teal-mask", "wellspring-mask", new SpeciesFormChangeItemTrigger(FormChangeItem.WELLSPRING_MASK)),
    new SpeciesFormChange(Species.OGERPON, "teal-mask", "hearthflame-mask", new SpeciesFormChangeItemTrigger(FormChangeItem.HEARTHFLAME_MASK)),
    new SpeciesFormChange(Species.OGERPON, "teal-mask", "cornerstone-mask", new SpeciesFormChangeItemTrigger(FormChangeItem.CORNERSTONE_MASK)),
    new SpeciesFormChange(Species.OGERPON, "teal-mask", "teal-mask-tera", new SpeciesFormChangeManualTrigger(), true), //When holding a Grass Tera Shard
    new SpeciesFormChange(Species.OGERPON, "teal-mask-tera", "teal-mask", new SpeciesFormChangeManualTrigger(), true), //When no longer holding a Grass Tera Shard
    new SpeciesFormChange(Species.OGERPON, "wellspring-mask", "wellspring-mask-tera", new SpeciesFormChangeManualTrigger(), true), //When holding a Water Tera Shard
    new SpeciesFormChange(Species.OGERPON, "wellspring-mask-tera", "wellspring-mask", new SpeciesFormChangeManualTrigger(), true), //When no longer holding a Water Tera Shard
    new SpeciesFormChange(Species.OGERPON, "hearthflame-mask", "hearthflame-mask-tera", new SpeciesFormChangeManualTrigger(), true), //When holding a Fire Tera Shard
    new SpeciesFormChange(Species.OGERPON, "hearthflame-mask-tera", "hearthflame-mask", new SpeciesFormChangeManualTrigger(), true), //When no longer holding a Fire Tera Shard
    new SpeciesFormChange(Species.OGERPON, "cornerstone-mask", "cornerstone-mask-tera", new SpeciesFormChangeManualTrigger(), true), //When holding a Rock Tera Shard
    new SpeciesFormChange(Species.OGERPON, "cornerstone-mask-tera", "cornerstone-mask", new SpeciesFormChangeManualTrigger(), true) //When no longer holding a Rock Tera Shard
  ],
  [Species.TERAPAGOS]: [
    new SpeciesFormChange(Species.TERAPAGOS, "", "terastal", new SpeciesFormChangeManualTrigger(), true),
    new SpeciesFormChange(Species.TERAPAGOS, "terastal", "stellar", new SpeciesFormChangeManualTrigger(), true), //When holding a Stellar Tera Shard
    new SpeciesFormChange(Species.TERAPAGOS, "stellar", "terastal", new SpeciesFormChangeManualTrigger(), true) //When no longer holding a Stellar Tera Shard
  ],
  [Species.GALAR_DARMANITAN]: [
    new SpeciesFormChange(Species.GALAR_DARMANITAN, "", "zen", new SpeciesFormChangeManualTrigger(), true),
    new SpeciesFormChange(Species.GALAR_DARMANITAN, "zen", "", new SpeciesFormChangeManualTrigger(), true)
  ],
  [Species.EISCUE]: [
    new SpeciesFormChange(Species.EISCUE, "", "no-ice", new SpeciesFormChangeManualTrigger(), true),
    new SpeciesFormChange(Species.EISCUE, "no-ice", "", new SpeciesFormChangeManualTrigger(), true),
  ]
};

export function initPokemonForms() {
  const formChangeKeys = Object.keys(pokemonFormChanges);
  formChangeKeys.forEach(pk => {
    const formChanges = pokemonFormChanges[pk];
    const newFormChanges: SpeciesFormChange[] = [];
    for (const fc of formChanges) {
      const itemTrigger = fc.findTrigger(SpeciesFormChangeItemTrigger) as SpeciesFormChangeItemTrigger;
      if (itemTrigger && !formChanges.find(c => fc.formKey === c.preFormKey && fc.preFormKey === c.formKey)) {
        newFormChanges.push(new SpeciesFormChange(fc.speciesId, fc.formKey, fc.preFormKey, new SpeciesFormChangeItemTrigger(itemTrigger.item, false)));
      }
    }
    formChanges.push(...newFormChanges);
  });
}
