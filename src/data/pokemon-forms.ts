import { TimeOfDay } from "../arena";
import { PokemonFormChangeItemModifier } from "../modifier/modifier";
import Pokemon from "../pokemon";
import { Moves } from "./move";
import { SpeciesFormKey } from "./pokemon-species";
import { Species } from "./species";
import { StatusEffect } from "./status-effect";

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
  ADAMANT_CRYSTAL,
  LUSTROUS_ORB,
  GRISEOUS_CORE,
  REVEAL_GLASS,
  GRACIDEA
}

export type SpeciesFormChangeConditionPredicate = (p: Pokemon) => boolean;
export type SpeciesFormChangeConditionEnforceFunc = (p: Pokemon) => void;

export class SpeciesFormChange {
  public speciesId: Species;
  public preFormKey: string;
  public formKey: string;
  public trigger: SpeciesFormChangeTrigger;
  public quiet: boolean;

  constructor(speciesId: Species, preFormKey: string, evoFormKey: string, trigger: SpeciesFormChangeTrigger, quiet: boolean = false) {
    this.speciesId = speciesId;
    this.preFormKey = preFormKey;
    this.formKey = evoFormKey;
    this.trigger = trigger;
    this.quiet = quiet;
  }

  canChange(pokemon: Pokemon): boolean {
    if (pokemon.species.speciesId !== this.speciesId)
      return false;

    if (!pokemon.species.forms.length)
      return false;

    const formKeys = pokemon.species.forms.map(f => f.formKey);
    if (formKeys[pokemon.formIndex] !== this.preFormKey)
      return false;

    if (formKeys[pokemon.formIndex] === this.formKey)
      return false;

    if (!this.trigger.canChange(pokemon))
      return false;

    return true;
  }

  findTrigger(triggerType: { new(...args: any[]): SpeciesFormChangeTrigger }): SpeciesFormChangeTrigger {
    if (!this.trigger.hasTriggerType(triggerType))
      return null;

    let trigger = this.trigger;

    if (trigger instanceof SpeciesFormChangeCompoundTrigger)
      return trigger.triggers.find(t => t.hasTriggerType(triggerType));

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

export class SpeciesFormChangeCompoundTrigger {
  public triggers: SpeciesFormChangeTrigger[];

  constructor(...triggers: SpeciesFormChangeTrigger[]) {
    this.triggers = triggers;
  }

  canChange(pokemon: Pokemon): boolean {
    for (let trigger of this.triggers) {
      if (!trigger.canChange(pokemon))
        return false;
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
    return !!pokemon.scene.findModifier(m => m instanceof PokemonFormChangeItemModifier && m.pokemonId === pokemon.id && m.formChangeItem === this.item && m.active === this.active && (!pokemon.formIndex === this.active));
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
    if (!Array.isArray(statusEffects))
      statusEffects = [ statusEffects ];
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

export class SpeciesFormChangeMoveUsedTrigger extends SpeciesFormChangeTrigger {
  public move: Moves;
  public used: boolean;

  constructor(move: Moves, used: boolean = true) {
    super();
    this.move = move;
    this.used = used;
  }

  canChange(pokemon: Pokemon): boolean {
    return pokemon.summonData && !!pokemon.getLastXMoves(1).filter(m => m.move === this.move).length === this.used;
  }
}

export function getSpeciesFormChangeMessage(pokemon: Pokemon, formChange: SpeciesFormChange, preName: string): string {
  const isMega = formChange.formKey.indexOf(SpeciesFormKey.MEGA) > -1;
  const isRevert = !isMega && formChange.formKey === pokemon.species.forms[0].formKey;
  const prefix = !pokemon.isPlayer() ? pokemon.hasTrainer() ? 'Foe ' : 'Wild ' : 'Your ';
  if (isMega)
    return `${prefix}${preName} mega-evolved\ninto ${pokemon.name}!`;
  if (isRevert)
    return `${prefix}${pokemon.name} reverted\nto its original form!`;
  return `${prefix}${preName} changed form!`;
}

interface PokemonFormChanges {
  [key: string]: SpeciesFormChange[]
}

export const pokemonFormChanges: PokemonFormChanges = {
  [Species.VENUSAUR]: [
    new SpeciesFormChange(Species.VENUSAUR, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.VENUSAURITE))
  ],
  [Species.BLASTOISE]: [
    new SpeciesFormChange(Species.BLASTOISE, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.BLASTOISINITE))
  ],
  [Species.CHARIZARD]: [
    new SpeciesFormChange(Species.CHARIZARD, '', SpeciesFormKey.MEGA_X, new SpeciesFormChangeItemTrigger(FormChangeItem.CHARIZARDITE_X)),
    new SpeciesFormChange(Species.CHARIZARD, '', SpeciesFormKey.MEGA_Y, new SpeciesFormChangeItemTrigger(FormChangeItem.CHARIZARDITE_Y))
  ],
  [Species.BEEDRILL]: [
    new SpeciesFormChange(Species.BEEDRILL, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.BEEDRILLITE))
  ],
  [Species.PIDGEOT]: [
    new SpeciesFormChange(Species.PIDGEOT, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.PIDGEOTITE))
  ],
  [Species.ALAKAZAM]: [
    new SpeciesFormChange(Species.ALAKAZAM, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.ALAKAZITE))
  ],
  [Species.SLOWBRO]: [
    new SpeciesFormChange(Species.SLOWBRO, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.SLOWBRONITE))
  ],
  [Species.GENGAR]: [
    new SpeciesFormChange(Species.GENGAR, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.GENGARITE))
  ],
  [Species.KANGASKHAN]: [
    new SpeciesFormChange(Species.KANGASKHAN, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.KANGASKHANITE))
  ],
  [Species.PINSIR]: [
    new SpeciesFormChange(Species.PINSIR, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.PINSIRITE))
  ],
  [Species.GYARADOS]: [
    new SpeciesFormChange(Species.GYARADOS, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.GYARADOSITE))
  ],
  [Species.AERODACTYL]: [
    new SpeciesFormChange(Species.AERODACTYL, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.AERODACTYLITE))
  ],
  [Species.MEWTWO]: [
    new SpeciesFormChange(Species.MEWTWO, '', SpeciesFormKey.MEGA_X, new SpeciesFormChangeItemTrigger(FormChangeItem.MEWTWONITE_X)),
    new SpeciesFormChange(Species.MEWTWO, '', SpeciesFormKey.MEGA_Y, new SpeciesFormChangeItemTrigger(FormChangeItem.MEWTWONITE_Y))
  ],
  [Species.AMPHAROS]: [
    new SpeciesFormChange(Species.AMPHAROS, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.AMPHAROSITE))
  ],
  [Species.STEELIX]: [
    new SpeciesFormChange(Species.STEELIX, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.STEELIXITE))
  ],
  [Species.SCIZOR]: [
    new SpeciesFormChange(Species.SCIZOR, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.SCIZORITE))
  ],
  [Species.HERACROSS]: [
    new SpeciesFormChange(Species.HERACROSS, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.HERACRONITE))
  ],
  [Species.HOUNDOOM]: [
    new SpeciesFormChange(Species.HOUNDOOM, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.HOUNDOOMINITE))
  ],
  [Species.TYRANITAR]: [
    new SpeciesFormChange(Species.TYRANITAR, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.TYRANITARITE))
  ],
  [Species.SCEPTILE]: [
    new SpeciesFormChange(Species.SCEPTILE, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.SCEPTILITE))
  ],
  [Species.BLAZIKEN]: [
    new SpeciesFormChange(Species.BLAZIKEN, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.BLAZIKENITE))
  ],
  [Species.SWAMPERT]: [
    new SpeciesFormChange(Species.SWAMPERT, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.SWAMPERTITE))
  ],
  [Species.GARDEVOIR]: [
    new SpeciesFormChange(Species.GARDEVOIR, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.GARDEVOIRITE))
  ],
  [Species.SABLEYE]: [
    new SpeciesFormChange(Species.SABLEYE, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.SABLENITE))
  ],
  [Species.MAWILE]: [
    new SpeciesFormChange(Species.MAWILE, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.MAWILITE))
  ],
  [Species.AGGRON]: [
    new SpeciesFormChange(Species.AGGRON, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.AGGRONITE))
  ],
  [Species.MEDICHAM]: [
    new SpeciesFormChange(Species.MEDICHAM, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.MEDICHAMITE))
  ],
  [Species.MANECTRIC]: [
    new SpeciesFormChange(Species.MANECTRIC, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.MANECTITE))
  ],
  [Species.SHARPEDO]: [
    new SpeciesFormChange(Species.SHARPEDO, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.SHARPEDONITE))
  ],
  [Species.CAMERUPT]: [
    new SpeciesFormChange(Species.CAMERUPT, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.CAMERUPTITE))
  ],
  [Species.ALTARIA]: [
    new SpeciesFormChange(Species.ALTARIA, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.ALTARIANITE))
  ],
  [Species.BANETTE]: [
    new SpeciesFormChange(Species.BANETTE, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.BANETTITE))
  ],
  [Species.ABSOL]: [
    new SpeciesFormChange(Species.ABSOL, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.ABSOLITE))
  ],
  [Species.GLALIE]: [
    new SpeciesFormChange(Species.GLALIE, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.GLALITITE))
  ],
  [Species.SALAMENCE]: [
    new SpeciesFormChange(Species.SALAMENCE, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.SALAMENCITE))
  ],
  [Species.METAGROSS]: [
    new SpeciesFormChange(Species.METAGROSS, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.METAGROSSITE))
  ],
  [Species.LATIAS]: [
    new SpeciesFormChange(Species.LATIAS, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.LATIASITE))
  ],
  [Species.LATIOS]: [
    new SpeciesFormChange(Species.LATIOS, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.LATIOSITE))
  ],
  [Species.KYOGRE]: [
    new SpeciesFormChange(Species.KYOGRE, '', SpeciesFormKey.PRIMAL, new SpeciesFormChangeItemTrigger(FormChangeItem.BLUE_ORB))
  ],
  [Species.GROUDON]: [
    new SpeciesFormChange(Species.GROUDON, '', SpeciesFormKey.PRIMAL, new SpeciesFormChangeItemTrigger(FormChangeItem.RED_ORB))
  ],
  [Species.RAYQUAZA]: [
    new SpeciesFormChange(Species.RAYQUAZA, '', SpeciesFormKey.MEGA, new SpeciesFormChangeCompoundTrigger(new SpeciesFormChangeItemTrigger(FormChangeItem.RAYQUAZITE), new SpeciesFormChangeMoveLearnedTrigger(Moves.DRAGON_ASCENT)))
  ],
  [Species.LOPUNNY]: [
    new SpeciesFormChange(Species.LOPUNNY, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.LOPUNNITE))
  ],
  [Species.GARCHOMP]: [
    new SpeciesFormChange(Species.GARCHOMP, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.GARCHOMPITE))
  ],
  [Species.LUCARIO]: [
    new SpeciesFormChange(Species.LUCARIO, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.LUCARIONITE))
  ],
  [Species.ABOMASNOW]: [
    new SpeciesFormChange(Species.ABOMASNOW, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.ABOMASITE))
  ],
  [Species.GALLADE]: [
    new SpeciesFormChange(Species.GALLADE, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.GALLADITE))
  ],
  [Species.AUDINO]: [
    new SpeciesFormChange(Species.AUDINO, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.AUDINITE))
  ],
  [Species.DIALGA]: [
    new SpeciesFormChange(Species.DIALGA, '', SpeciesFormKey.ORIGIN, new SpeciesFormChangeItemTrigger(FormChangeItem.ADAMANT_CRYSTAL))
  ],
  [Species.PALKIA]: [
    new SpeciesFormChange(Species.PALKIA, '', SpeciesFormKey.ORIGIN, new SpeciesFormChangeItemTrigger(FormChangeItem.LUSTROUS_ORB))
  ],
  [Species.GIRATINA]: [
    new SpeciesFormChange(Species.GIRATINA, '', SpeciesFormKey.ORIGIN, new SpeciesFormChangeItemTrigger(FormChangeItem.GRISEOUS_CORE))
  ],
  [Species.SHAYMIN]: [
    new SpeciesFormChange(Species.SHAYMIN, 'land', 'sky', new SpeciesFormChangeCompoundTrigger(new SpeciesFormChangeTimeOfDayTrigger(TimeOfDay.DAY, TimeOfDay.DUSK),
      new SpeciesFormChangeItemTrigger(FormChangeItem.GRACIDEA), new SpeciesFormChangeStatusEffectTrigger(StatusEffect.FREEZE, true))),
    new SpeciesFormChange(Species.SHAYMIN, 'sky', 'land', new SpeciesFormChangeTimeOfDayTrigger(TimeOfDay.DAWN, TimeOfDay.NIGHT)),
    new SpeciesFormChange(Species.SHAYMIN, 'sky', 'land', new SpeciesFormChangeStatusEffectTrigger(StatusEffect.FREEZE))
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
  [Species.KELDEO]: [
    new SpeciesFormChange(Species.KELDEO, 'ordinary', 'resolute', new SpeciesFormChangeMoveLearnedTrigger(Moves.SACRED_SWORD)),
    new SpeciesFormChange(Species.KELDEO, 'resolute', 'ordinary', new SpeciesFormChangeMoveLearnedTrigger(Moves.SACRED_SWORD, false))
  ],
  [Species.MELOETTA]: [
    new SpeciesFormChange(Species.MELOETTA, 'aria', 'pirouette', new SpeciesFormChangeMoveUsedTrigger(Moves.RELIC_SONG), true),
    new SpeciesFormChange(Species.MELOETTA, 'pirouette', 'aria', new SpeciesFormChangeMoveUsedTrigger(Moves.RELIC_SONG), true),
    new SpeciesFormChange(Species.MELOETTA, 'pirouette', 'aria', new SpeciesFormChangeActiveTrigger(false), true)
  ],
  [Species.DIANCIE]: [
    new SpeciesFormChange(Species.DIANCIE, '', SpeciesFormKey.MEGA, new SpeciesFormChangeItemTrigger(FormChangeItem.DIANCITE))
  ],
  [Species.ENAMORUS]: [
    new SpeciesFormChange(Species.ENAMORUS, SpeciesFormKey.INCARNATE, SpeciesFormKey.THERIAN, new SpeciesFormChangeItemTrigger(FormChangeItem.REVEAL_GLASS))
  ]
};

{
  const formChangeKeys = Object.keys(pokemonFormChanges);
  formChangeKeys.forEach(pk => {
    const formChanges = pokemonFormChanges[pk];
    let newFormChanges: SpeciesFormChange[] = [];
    for (let fc of formChanges) {
      const itemTrigger = fc.findTrigger(SpeciesFormChangeItemTrigger) as SpeciesFormChangeItemTrigger;
      if (itemTrigger && !formChanges.find(c => fc.formKey === c.preFormKey && fc.preFormKey === c.formKey))
        newFormChanges.push(new SpeciesFormChange(fc.speciesId, fc.formKey, fc.preFormKey, new SpeciesFormChangeItemTrigger(itemTrigger.item, false)));
    }
    formChanges.push(...newFormChanges);
  });
}