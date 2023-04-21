import * as Modifiers from './modifier';
import { AttackMove, Moves, allMoves } from '../data/move';
import { PokeballType, getPokeballName } from '../data/pokeball';
import Pokemon, { EnemyPokemon, PlayerPokemon, PokemonMove } from '../pokemon';
import { EvolutionItem, pokemonEvolutions } from '../data/pokemon-evolutions';
import { Stat, getStatName } from '../data/pokemon-stat';
import { tmSpecies } from '../data/tms';
import { Type } from '../data/type';
import PartyUiHandler, { PokemonMoveSelectFilter, PokemonSelectFilter } from '../ui/party-ui-handler';
import * as Utils from '../utils';
import { TempBattleStat, getTempBattleStatBoosterItemName, getTempBattleStatName } from '../data/temp-battle-stat';
import { BerryType, getBerryEffectDescription, getBerryName } from '../data/berry';

type Modifier = Modifiers.Modifier;

export enum ModifierTier {
  COMMON,
  GREAT,
  ULTRA,
  MASTER,
  LUXURY
};

type NewModifierFunc = (type: ModifierType, args: any[]) => Modifier;

export class ModifierType {
  public name: string;
  public description: string;
  public iconImage: string;
  public group: string;
  public soundName: string;
  public tier: ModifierTier;
  protected newModifierFunc: NewModifierFunc;

  constructor(name: string, description: string, newModifierFunc: NewModifierFunc, iconImage?: string, group?: string, soundName?: string) {
    this.name = name;
    this.description = description;
    this.iconImage = iconImage || name?.replace(/[ \-]/g, '_')?.toLowerCase();
    this.group = group || '';
    this.soundName = soundName || 'restore';
    this.newModifierFunc = newModifierFunc;
  }

  setTier(tier: ModifierTier): void {
    this.tier = tier;
  }

  newModifier(...args: any[]): Modifier {
    return this.newModifierFunc(this, args);
  }
}

class AddPokeballModifierType extends ModifierType {
  constructor(pokeballType: PokeballType, count: integer, iconImage?: string) {
    super(`${count}x ${getPokeballName(pokeballType)}`, `Receive ${getPokeballName(pokeballType)} x${count}`,
      (_type, _args) => new Modifiers.AddPokeballModifier(this, pokeballType, count), iconImage, 'pb', 'pb_bounce_1');
  }
}

export class PokemonModifierType extends ModifierType {
  public selectFilter: PokemonSelectFilter;

  constructor(name: string, description: string, newModifierFunc: NewModifierFunc, selectFilter?: PokemonSelectFilter, iconImage?: string, group?: string, soundName?: string) {
    super(name, description, newModifierFunc, iconImage, group, soundName);

    this.selectFilter = selectFilter;
  }
}

export class PokemonHeldItemModifierType extends PokemonModifierType {
  constructor(name: string, description: string, newModifierFunc: NewModifierFunc, iconImage?: string, group?: string, soundName?: string) {
    super(name, description, newModifierFunc, undefined, iconImage, group, soundName);
  }

  newModifier(...args: any[]): Modifiers.PokemonHeldItemModifier {
    return super.newModifier(...args) as Modifiers.PokemonHeldItemModifier;
  }
}

export class PokemonHpRestoreModifierType extends PokemonModifierType {
  protected restorePoints: integer;
  protected percent: boolean;

  constructor(name: string, restorePoints: integer, percent?: boolean, newModifierFunc?: NewModifierFunc, selectFilter?: PokemonSelectFilter, iconImage?: string, group?: string) {
    super(name, `Restore ${restorePoints}${percent ? '%' : ''} HP for one POKéMON`,
      newModifierFunc || ((_type, args) => new Modifiers.PokemonHpRestoreModifier(this, (args[0] as PlayerPokemon).id, this.restorePoints, this.percent, false)),
    selectFilter || ((pokemon: PlayerPokemon) => {
      if (!pokemon.hp || pokemon.hp >= pokemon.getMaxHp())
        return PartyUiHandler.NoEffectMessage;
      return null;
    }), iconImage, group || 'potion');

    this.restorePoints = restorePoints;
    this.percent = !!percent;
  }
}

export class PokemonReviveModifierType extends PokemonHpRestoreModifierType {
  constructor(name: string, restorePercent: integer, iconImage?: string) {
    super(name, restorePercent, true, (_type, args) => new Modifiers.PokemonHpRestoreModifier(this, (args[0] as PlayerPokemon).id, this.restorePoints, true, true),
      ((pokemon: PlayerPokemon) => {
        if (pokemon.hp)
          return PartyUiHandler.NoEffectMessage;
        return null;
      }), iconImage, 'revive');

    this.description = `Revive one POKéMON and restore ${restorePercent}% HP`;
    this.selectFilter = (pokemon: PlayerPokemon) => {
      if (pokemon.hp)
        return PartyUiHandler.NoEffectMessage;
      return null;
    };
  }
}

export class PokemonStatusHealModifierType extends PokemonModifierType {
  constructor(name: string) {
    super(name, `Heal any status ailment for one POKéMON`,
      ((_type, args) => new Modifiers.PokemonStatusHealModifier(this, (args[0] as PlayerPokemon).id)),
      ((pokemon: PlayerPokemon) => {
        if (!pokemon.hp || !pokemon.status)
          return PartyUiHandler.NoEffectMessage;
        return null;
      }));
  }
}

export abstract class PokemonMoveModifierType extends PokemonModifierType {
  public moveSelectFilter: PokemonMoveSelectFilter;

  constructor(name: string, description: string, newModifierFunc: NewModifierFunc, selectFilter?: PokemonSelectFilter, moveSelectFilter?: PokemonMoveSelectFilter,
    iconImage?: string, group?: string) {
    super(name, description, newModifierFunc, selectFilter, iconImage, group);

    this.moveSelectFilter = moveSelectFilter;
  }
}

export class PokemonPpRestoreModifierType extends PokemonMoveModifierType {
  protected restorePoints: integer;

  constructor(name: string, restorePoints: integer, iconImage?: string) {
    super(name, `Restore ${restorePoints > -1 ? restorePoints : 'all'} PP for one POKéMON move`, (_type, args) => new Modifiers.PokemonPpRestoreModifier(this, (args[0] as PlayerPokemon).id, (args[1] as integer), this.restorePoints),
      (_pokemon: PlayerPokemon) => {
      return null;
    }, (pokemonMove: PokemonMove) => {
      if (!pokemonMove.ppUsed)
        return PartyUiHandler.NoEffectMessage;
      return null;
    }, iconImage, 'ether');

    this.restorePoints = this.restorePoints;
  }
}

export class PokemonAllMovePpRestoreModifierType extends PokemonModifierType {
  protected restorePoints: integer;

  constructor(name: string, restorePoints: integer, iconImage?: string) {
    super(name, `Restore ${restorePoints > -1 ? restorePoints : 'all'} PP for all of one POKéMON's moves`, (_type, args) => new Modifiers.PokemonAllMovePpRestoreModifier(this, (args[0] as PlayerPokemon).id, this.restorePoints),
      (pokemon: PlayerPokemon) => {
        if (!pokemon.moveset.filter(m => m.ppUsed).length)
          return PartyUiHandler.NoEffectMessage;
        return null;
      }, iconImage, 'elixir');

    this.restorePoints = this.restorePoints;
  }
}

export class TempBattleStatBoosterModifierType extends ModifierType {
  public tempBattleStat: TempBattleStat;

  constructor(tempBattleStat: TempBattleStat) {
    super(Utils.toPokemonUpperCase(getTempBattleStatBoosterItemName(tempBattleStat)),
      `Increases the ${getTempBattleStatName(tempBattleStat)} of all party members by 1 stage for 5 battles`,
      (_type, _args) => new Modifiers.TempBattleStatBoosterModifier(this, this.tempBattleStat),
      getTempBattleStatBoosterItemName(tempBattleStat).replace(/\./g, '').replace(/[ ]/g, '_').toLowerCase());

    this.tempBattleStat = tempBattleStat;
  }
}

function getAttackTypeBoosterItemName(type: Type) {
  switch (type) {
    case Type.NORMAL:
      return 'Silk Scarf';
    case Type.FIGHTING:
      return 'Black Belt';
    case Type.FLYING:
      return 'Sharp Beak';
    case Type.POISON:
      return 'Poison Barb';
    case Type.GROUND:
      return 'Soft Sand';
    case Type.ROCK:
      return 'Hard Stone';
    case Type.BUG:
      return 'Silver Powder';
    case Type.GHOST:
      return 'Spell Tag';
    case Type.STEEL:
      return 'Metal Coat';
    case Type.FIRE:
      return 'Charcoal';
    case Type.WATER:
      return 'Mystic Water';
    case Type.GRASS:
      return 'Miracle Seed';
    case Type.ELECTRIC:
      return 'Magnet';
    case Type.PSYCHIC:
      return 'Twisted Spoon';
    case Type.ICE:
      return 'Never-Melt Ice'
    case Type.DRAGON:
      return 'Dragon Fang';
    case Type.DARK:
      return 'Black Glasses';
    case Type.FAIRY:
      return 'Clefairy Doll';
  }
}

export class AttackTypeBoosterModifierType extends PokemonHeldItemModifierType {
  public moveType: Type;
  public boostPercent: integer;

  constructor(moveType: Type, boostPercent: integer) {
    super(Utils.toPokemonUpperCase(getAttackTypeBoosterItemName(moveType)), `Inceases the power of a POKéMON's ${Type[moveType]}-type moves by 20%`,
      (_type, args) => new Modifiers.AttackTypeBoosterModifier(this, (args[0] as Pokemon).id, moveType, boostPercent),
      `${getAttackTypeBoosterItemName(moveType).replace(/[ \-]/g, '_').toLowerCase()}`);

    this.moveType = moveType;
    this.boostPercent = boostPercent;
  }
}

export class PokemonLevelIncrementModifierType extends PokemonModifierType {
  constructor(name: string, iconImage?: string) {
    super(name, `Increase a POKéMON\'s level by 1`, (_type, args) => new Modifiers.PokemonLevelIncrementModifier(this, (args[0] as PlayerPokemon).id),
      (_pokemon: PlayerPokemon) => null, iconImage);
  }
}

function getBaseStatBoosterItemName(stat: Stat) {
  switch (stat) {
    case Stat.HP:
      return 'HP-UP';
    case Stat.ATK:
      return 'PROTEIN';
    case Stat.DEF:
      return 'IRON';
    case Stat.SPATK:
      return 'CALCIUM';
    case Stat.SPDEF:
      return 'ZINC';
    case Stat.SPD:
      return 'CARBOS';
  }
}

export class PokemonBaseStatBoosterModifierType extends PokemonHeldItemModifierType {
  private stat: Stat;

  constructor(name: string, stat: Stat, _iconImage?: string) {
    super(name, `Increases the holder's base ${getStatName(stat)} by 20%`, (_type, args) => new Modifiers.PokemonBaseStatModifier(this, (args[0] as Pokemon).id, this.stat));

    this.stat = stat;
  }
}

class AllPokemonFullHpRestoreModifierType extends ModifierType {
  constructor(name: string, description?: string, newModifierFunc?: NewModifierFunc, iconImage?: string) {
    super(name, description || `Restore 100% HP for all POKéMON`, newModifierFunc || ((_type, _args) => new Modifiers.PokemonHpRestoreModifier(this, -1, 100, false)), iconImage);
  }
}

class AllPokemonFullReviveModifierType extends AllPokemonFullHpRestoreModifierType {
  constructor(name: string, iconImage?: string) {
    super(name, `Revives all fainted POKéMON, restoring 100% HP`, (_type, _args) => new Modifiers.PokemonHpRestoreModifier(this, -1, 100, true), iconImage);
  }
}

export class ExpBoosterModifierType extends ModifierType {
  constructor(name: string, boostPercent: integer, iconImage?: string) {
    super(name, `Increases gain of EXP. Points by ${boostPercent}%`, () => new Modifiers.ExpBoosterModifier(this, boostPercent), iconImage);
  }
}

export class PokemonExpBoosterModifierType extends PokemonHeldItemModifierType {
  constructor(name: string, boostPercent: integer, iconImage?: string) {
    super(name, `Increases the holder's gain of EXP. Points by ${boostPercent}%`, (_type, args) => new Modifiers.PokemonExpBoosterModifier(this, (args[0] as Pokemon).id, boostPercent),
      iconImage);
  }
}

export class TmModifierType extends PokemonModifierType {
  public moveId: Moves;

  constructor(moveId: Moves) {
    super(`TM${Utils.padInt(Object.keys(tmSpecies).indexOf(moveId.toString()) + 1, 3)} - ${allMoves[moveId].name}`, `Teach ${allMoves[moveId].name} to a POKéMON`, (_type, args) => new Modifiers.TmModifier(this, (args[0] as PlayerPokemon).id),
      (pokemon: PlayerPokemon) => {
        if (pokemon.compatibleTms.indexOf(moveId) === -1 || pokemon.moveset.filter(m => m?.moveId === moveId).length)
          return PartyUiHandler.NoEffectMessage;
        return null;
      }, `tm_${Type[allMoves[moveId].type].toLowerCase()}`, 'tm');

    this.moveId = moveId;
  }
}

function getEvolutionItemName(evolutionItem: EvolutionItem) {
  switch (evolutionItem) {
    case EvolutionItem.LINKING_CORD:
      return 'Linking Cord';
    case EvolutionItem.SUN_STONE:
      return 'Sun Stone';
    case EvolutionItem.MOON_STONE:
      return 'Moon Stone';
    case EvolutionItem.LEAF_STONE:
      return 'Leaf Stone';
    case EvolutionItem.FIRE_STONE:
      return 'Fire Stone';
    case EvolutionItem.WATER_STONE:
      return 'Water Stone';
    case EvolutionItem.THUNDER_STONE:
      return 'Thunder Stone';
    case EvolutionItem.ICE_STONE:
      return 'Ice Stone';
    case EvolutionItem.DUSK_STONE:
      return 'Dusk Stone';
    case EvolutionItem.DAWN_STONE:
      return 'Dawn Stone';
    case EvolutionItem.SHINY_STONE:
      return 'Shiny Stone';
  }
}

export class EvolutionItemModifierType extends PokemonModifierType {
  public evolutionItem: EvolutionItem;

  constructor(evolutionItem: EvolutionItem) {
    super(getEvolutionItemName(evolutionItem), `Causes certain POKéMON to evolve`, (_type, args) => new Modifiers.EvolutionItemModifier(this, (args[0] as PlayerPokemon).id),
    (pokemon: PlayerPokemon) => {
      if (pokemonEvolutions.hasOwnProperty(pokemon.species.speciesId) && pokemonEvolutions[pokemon.species.speciesId].filter(e => e.item === this.evolutionItem
        && (!e.condition || e.condition.predicate(pokemon))).length)
        return null;

      return PartyUiHandler.NoEffectMessage;
    }, getEvolutionItemName(evolutionItem).replace(/[ \-]/g, '_').toLowerCase());

    this.evolutionItem = evolutionItem;
  }
}

class ModifierTypeGenerator extends ModifierType {
  private genTypeFunc: Function;

  constructor(genTypeFunc: Function) {
    super(null, null, null, null);
    this.genTypeFunc = genTypeFunc;
  }

  generateType(party: Pokemon[]) {
    const ret = this.genTypeFunc(party);
    if (ret)
      ret.setTier(this.tier);
    return ret;
  }
}

class AttackTypeBoosterModifierTypeGenerator extends ModifierTypeGenerator {
  constructor() {
    super((party: Pokemon[]) => {
      const attackMoveTypes = party.map(p => p.moveset.map(m => m.getMove()).filter(m => m instanceof AttackMove).map(m => m.type)).flat();
      const attackMoveTypeWeights = new Map<Type, integer>();
      let totalWeight = 0;
      for (let t of attackMoveTypes) {
        if (attackMoveTypeWeights.has(t)) {
          if (attackMoveTypeWeights.get(t) < 3)
            attackMoveTypeWeights.set(t, attackMoveTypeWeights.get(t) + 1);
          else
            continue;
        } else
          attackMoveTypeWeights.set(t, 1);
        totalWeight++;
      }

      if (!totalWeight)
        return null;

      let type: Type;
      
      const randInt = Utils.randInt(totalWeight);
      let weight = 0;

      for (let t of attackMoveTypeWeights.keys()) {
        const typeWeight = attackMoveTypeWeights.get(t);
        if (randInt <= weight + typeWeight) {
          type = t;
          break;
        }
        weight += typeWeight;
      }
      
      return new AttackTypeBoosterModifierType(type, 20);
    });
  }
}

class EvolutionItemModifierTypeGenerator extends ModifierTypeGenerator {
  constructor() {
    super((party: Pokemon[]) => {
      const evolutionItemPool = party.filter(p => pokemonEvolutions.hasOwnProperty(p.species.speciesId)).map(p => {
        const evolutions = pokemonEvolutions[p.species.speciesId]
        return evolutions.filter(e => e.item !== EvolutionItem.NONE && (!e.condition || e.condition.predicate(p)));
      }).flat().flatMap(e => e.item);

      if (!evolutionItemPool.length)
        return null;

      return new EvolutionItemModifierType(evolutionItemPool[Utils.randInt(evolutionItemPool.length)]);
    });
  }
}

class HeldItemTransferModifierType extends ModifierType {
  constructor(name: string, iconImage?: string, group?: string, soundName?: string) {
    super(name, 'All held items in your party are transferred to a POKéMON on summon', (type, _args) => new Modifiers.HeldItemTransferModifier(type), iconImage, group, soundName);
  }
}

class WeightedModifierType {
  public modifierType: ModifierType;
  public weight: integer | Function;

  constructor(modifierType: ModifierType, weight: integer | Function) {
    this.modifierType = modifierType;
    this.weight = weight;
  }

  setTier(tier: ModifierTier) {
    this.modifierType.setTier(tier);
  }
}

const modifierTypes = {
  POKEBALL: new AddPokeballModifierType(PokeballType.POKEBALL, 5, 'pb'),
  GREAT_BALL: new AddPokeballModifierType(PokeballType.GREAT_BALL, 5, 'gb'),
  ULTRA_BALL: new AddPokeballModifierType(PokeballType.ULTRA_BALL, 5, 'ub'),
  MASTER_BALL: new AddPokeballModifierType(PokeballType.MASTER_BALL, 1, 'mb'),

  RARE_CANDY: new PokemonLevelIncrementModifierType('RARE CANDY'),

  EVOLUTION_ITEM: new EvolutionItemModifierTypeGenerator(),

  POTION: new PokemonHpRestoreModifierType('POTION', 20),
  SUPER_POTION: new PokemonHpRestoreModifierType('SUPER POTION', 50),
  HYPER_POTION: new PokemonHpRestoreModifierType('HYPER POTION', 200),
  MAX_POTION: new PokemonHpRestoreModifierType('MAX POTION', 100, true),
  
  REVIVE: new PokemonReviveModifierType('REVIVE', 50),
  MAX_REVIVE: new PokemonReviveModifierType('MAX REVIVE', 100),

  FULL_HEAL: new PokemonStatusHealModifierType('FULL HEAL'),

  SACRED_ASH: new AllPokemonFullReviveModifierType('SACRED ASH'),

  ETHER: new PokemonPpRestoreModifierType('ETHER', 10),
  MAX_ETHER: new PokemonPpRestoreModifierType('MAX ETHER', -1),

  ELIXIR: new PokemonAllMovePpRestoreModifierType('ELIXIR', 10),
  MAX_ELIXIR: new PokemonAllMovePpRestoreModifierType('MAX ELIXIR', -1),

  TEMP_STAT_BOOSTER: new ModifierTypeGenerator((party: Pokemon[]) => {
    const randTempBattleStat = Utils.randInt(7) as TempBattleStat;
    return new TempBattleStatBoosterModifierType(randTempBattleStat);
  }),

  BASE_STAT_BOOSTER: new ModifierTypeGenerator((party: Pokemon[]) => {
    const randStat = Utils.randInt(6) as Stat;
    return new PokemonBaseStatBoosterModifierType(getBaseStatBoosterItemName(randStat), randStat);
  }),

  ATTACK_TYPE_BOOSTER: new AttackTypeBoosterModifierTypeGenerator(),

  BERRY: new ModifierTypeGenerator((party: Pokemon[]) => {
    const berryTypes = Utils.getEnumValues(BerryType);
    const randBerryType = berryTypes[Utils.randInt(berryTypes.length)];
    return new PokemonHeldItemModifierType(getBerryName(randBerryType), getBerryEffectDescription(randBerryType),
      (type, args) => new Modifiers.BerryModifier(type, (args[0] as Pokemon).id, randBerryType),
      null, 'berry');
  }),

  TM: new ModifierTypeGenerator((party: Pokemon[]) => {
    const partyMemberCompatibleTms = party.map(p => (p as PlayerPokemon).compatibleTms);
    const uniqueCompatibleTms = partyMemberCompatibleTms.flat().filter((tm, i, array) => array.indexOf(tm) === i);
    if (!uniqueCompatibleTms.length)
      return null;
    const randTmIndex = Utils.randInt(uniqueCompatibleTms.length);
    return new TmModifierType(uniqueCompatibleTms[randTmIndex]);
  }),

  EXP_SHARE: new ModifierType('EXP. SHARE', 'All POKéMON in your party gain an additional 10% of a battle\'s EXP. Points',
    (type, _args) => new Modifiers.ExpShareModifier(type), 'exp_share'),
  EXP_BALANCE: new ModifierType('EXP. BALANCE', 'All EXP. Points received from battles are split between the lower leveled party members',
    (type, _args) => new Modifiers.ExpBalanceModifier(type), 'exp_balance'),

  EXP_CHARM: new ExpBoosterModifierType('EXP CHARM', 25),
  GOLDEN_EXP_CHARM: new ExpBoosterModifierType('GOLDEN EXP CHARM', 100),

  LUCKY_EGG: new PokemonExpBoosterModifierType('LUCKY EGG', 50),

  HEALING_CHARM: new ModifierType('HEALING CHARM', 'Doubles the effectiveness of HP restoring moves and items (excludes revives)',
    (type, _args) => new Modifiers.HealingBoosterModifier(type, 2), 'healing_charm'),

  OVAL_CHARM: new ModifierType('OVAL CHARM', 'For every X (no. of party members) items in a POKéMON\'s held item stack, give one to each other party member',
    (type, _args) => new Modifiers.PartyShareModifier(type), 'oval_charm'),

  BERRY_POUCH: new ModifierType('BERRY POUCH', 'Adds a 25% chance that a used berry will not be consumed',
    (type, _args) => new Modifiers.PreserveBerryModifier(type)),

  LEFTOVERS: new PokemonHeldItemModifierType('LEFTOVERS', 'Heals 1/16 of a POKéMON\'s maximum HP every turn',
    (type, args) => new Modifiers.TurnHealModifier(type, (args[0] as Pokemon).id)),
  SHELL_BELL: new PokemonHeldItemModifierType('SHELL BELL', 'Heals 1/8 of a POKéMON\'s dealt damage',
    (type, args) => new Modifiers.HitHealModifier(type, (args[0] as Pokemon).id)),

  SHINY_CHARM: new ModifierType('SHINY CHARM', 'Dramatically increases the chance of a wild POKéMON being shiny', (type, _args) => new Modifiers.ShinyRateBoosterModifier(type)),

  MINI_BLACK_HOLE: new HeldItemTransferModifierType('MINI BLACK HOLE'),
  
  GOLDEN_POKEBALL: new ModifierType(`GOLDEN ${getPokeballName(PokeballType.POKEBALL)}`, 'Adds 1 extra item option at the end of every battle',
    (type, _args) => new Modifiers.ExtraModifierModifier(type), 'pb_gold', null, 'pb_bounce_1'),
};

const modifierPool = {
  [ModifierTier.COMMON]: [
    new WeightedModifierType(modifierTypes.POKEBALL, 6),
    new WeightedModifierType(modifierTypes.RARE_CANDY, 2),
    new WeightedModifierType(modifierTypes.POTION, (party: Pokemon[]) => {
      const thresholdPartyMemberCount = party.filter(p => p.getInverseHp() >= 10 || p.getHpRatio() <= 0.875).length;
      return thresholdPartyMemberCount * 3;
    }),
    new WeightedModifierType(modifierTypes.SUPER_POTION, (party: Pokemon[]) => {
      const thresholdPartyMemberCount = party.filter(p => p.getInverseHp() >= 25 || p.getHpRatio() <= 0.75).length;
      return thresholdPartyMemberCount;
    }),
    new WeightedModifierType(modifierTypes.ETHER, (party: Pokemon[]) => {
      const thresholdPartyMemberCount = party.filter(p => p.hp && p.moveset.filter(m => (m.getMove().pp - m.ppUsed) <= 5).length).length;
      return thresholdPartyMemberCount * 3;
    }),
    new WeightedModifierType(modifierTypes.MAX_ETHER, (party: Pokemon[]) => {
      const thresholdPartyMemberCount = party.filter(p => p.hp && p.moveset.filter(m => (m.getMove().pp - m.ppUsed) <= 5).length).length;
      return thresholdPartyMemberCount;
    }),
    new WeightedModifierType(modifierTypes.TEMP_STAT_BOOSTER, 4),
    new WeightedModifierType(modifierTypes.BERRY, 2)
  ].map(m => { m.setTier(ModifierTier.COMMON); return m; }),
  [ModifierTier.GREAT]: [
    new WeightedModifierType(modifierTypes.GREAT_BALL, 12),
    new WeightedModifierType(modifierTypes.FULL_HEAL, (party: Pokemon[]) => {
      const statusEffectPartyMemberCount = party.filter(p => p.hp && !!p.status).length;
      return statusEffectPartyMemberCount * 8;
    }),
    new WeightedModifierType(modifierTypes.REVIVE, (party: Pokemon[]) => {
      const faintedPartyMemberCount = party.filter(p => !p.hp).length;
      return faintedPartyMemberCount * 6;
    }),
    new WeightedModifierType(modifierTypes.MAX_REVIVE, (party: Pokemon[]) => {
      const faintedPartyMemberCount = party.filter(p => !p.hp).length;
      return faintedPartyMemberCount * 2;
    }),
    new WeightedModifierType(modifierTypes.SACRED_ASH, (party: Pokemon[]) => {
      return party.filter(p => !p.hp).length >= Math.ceil(party.length / 2) ? 1 : 0;
    }),
    new WeightedModifierType(modifierTypes.HYPER_POTION, (party: Pokemon[]) => {
      const thresholdPartyMemberCount = party.filter(p => p.getInverseHp() >= 100 || p.getHpRatio() <= 0.625).length;
      return thresholdPartyMemberCount * 2;
    }),
    new WeightedModifierType(modifierTypes.MAX_POTION, (party: Pokemon[]) => {
      const thresholdPartyMemberCount = party.filter(p => p.getInverseHp() >= 150 || p.getHpRatio() <= 0.5).length;
      return Math.ceil(thresholdPartyMemberCount / 1.5);
    }),
    new WeightedModifierType(modifierTypes.ELIXIR, (party: Pokemon[]) => {
      const thresholdPartyMemberCount = party.filter(p => p.hp && p.moveset.filter(m => (m.getMove().pp - m.ppUsed) <= 5).length).length;
      return thresholdPartyMemberCount * 2;
    }),
    new WeightedModifierType(modifierTypes.MAX_ELIXIR, (party: Pokemon[]) => {
      const thresholdPartyMemberCount = party.filter(p => p.hp && p.moveset.filter(m => (m.getMove().pp - m.ppUsed) <= 5).length).length;
      return Math.ceil(thresholdPartyMemberCount / 1.5);
    }),
    new WeightedModifierType(modifierTypes.TM, 4),
    new WeightedModifierType(modifierTypes.EXP_SHARE, 2),
    new WeightedModifierType(modifierTypes.BASE_STAT_BOOSTER, 4)
  ].map(m => { m.setTier(ModifierTier.GREAT); return m; }),
  [ModifierTier.ULTRA]: [
    new WeightedModifierType(modifierTypes.ULTRA_BALL, 8),
    new WeightedModifierType(modifierTypes.EVOLUTION_ITEM, 12),
    new WeightedModifierType(modifierTypes.ATTACK_TYPE_BOOSTER, 5),
    modifierTypes.OVAL_CHARM,
    modifierTypes.HEALING_CHARM,
    new WeightedModifierType(modifierTypes.LEFTOVERS, 2),
    new WeightedModifierType(modifierTypes.SHELL_BELL, 2),
    new WeightedModifierType(modifierTypes.EXP_CHARM, 4),
    new WeightedModifierType(modifierTypes.LUCKY_EGG, 3),
    new WeightedModifierType(modifierTypes.BERRY_POUCH, 3),
    modifierTypes.EXP_BALANCE
  ].map(m => { m.setTier(ModifierTier.ULTRA); return m; }),
  [ModifierTier.MASTER]: [
    new WeightedModifierType(modifierTypes.MASTER_BALL, 3),
    new WeightedModifierType(modifierTypes.SHINY_CHARM, 2),
    modifierTypes.MINI_BLACK_HOLE
  ].map(m => { m.setTier(ModifierTier.MASTER); return m; }),
  [ModifierTier.LUXURY]: [
    modifierTypes.GOLDEN_EXP_CHARM,
    modifierTypes.GOLDEN_POKEBALL
  ].map(m => { m.setTier(ModifierTier.LUXURY); return m; }),
};

const enemyModifierPool = {
  [ModifierTier.COMMON]: [
    modifierTypes.BERRY
  ].map(m => { m.setTier(ModifierTier.COMMON); return m; }),
  [ModifierTier.GREAT]: [
    modifierTypes.BASE_STAT_BOOSTER
  ].map(m => { m.setTier(ModifierTier.GREAT); return m; }),
  [ModifierTier.ULTRA]: [
    new WeightedModifierType(new AttackTypeBoosterModifierTypeGenerator(), 5),
    new WeightedModifierType(modifierTypes.LUCKY_EGG, 2),
  ].map(m => { m.setTier(ModifierTier.ULTRA); return m; }),
  [ModifierTier.MASTER]: [
    modifierTypes.SHELL_BELL
  ].map(m => { m.setTier(ModifierTier.MASTER); return m; })
};

let modifierPoolThresholds = {};
let ignoredPoolIndexes = {};

let enemyModifierPoolThresholds = {};
let enemyIgnoredPoolIndexes = {};

export function regenerateModifierPoolThresholds(party: Pokemon[], player?: boolean) {
  if (player === undefined)
    player = true;
  const pool = player ? modifierPool : enemyModifierPool;
  const ignoredIndexes = {};
  const thresholds = Object.fromEntries(new Map(Object.keys(pool).map(t => {
    ignoredIndexes[t] = [];
    const thresholds = new Map();
    let i = 0;
    pool[t].reduce((total: integer, modifierType: ModifierType | WeightedModifierType) => {
      if (modifierType instanceof WeightedModifierType) {
        const weightedModifierType = modifierType as WeightedModifierType;
        const weight = weightedModifierType.weight instanceof Function
        ? (weightedModifierType.weight as Function)(party)
        : weightedModifierType.weight as integer;
        if (weight)
          total += weight;
        else {
          ignoredIndexes[t].push(i++);
          return total;
        }
      } else
        total++;
      thresholds.set(total, i++);
      return total;
    }, 0);
    return [ t, Object.fromEntries(thresholds) ]
  })));
  if (player) {
    modifierPoolThresholds = thresholds;
    ignoredPoolIndexes = ignoredIndexes;
  } else {
    enemyModifierPoolThresholds = thresholds;
    enemyIgnoredPoolIndexes = ignoredIndexes;
  }
}

export function getPlayerModifierTypeOptionsForWave(waveIndex: integer, count: integer, party: PlayerPokemon[]): ModifierTypeOption[] {
  if (waveIndex % 10 === 0)
    return modifierPool[ModifierTier.LUXURY].map(m => new ModifierTypeOption(m, false));
  const options: ModifierTypeOption[] = [];
  const retryCount = Math.min(count * 5, 50);
  new Array(count).fill(0).map(() => {
    let candidate = getNewModifierTypeOption(party);
    let r = 0;
    while (options.length && ++r < retryCount && options.filter(o => o.type.name === candidate.type.name || o.type.group === candidate.type.group).length)
      candidate = getNewModifierTypeOption(party, true, candidate.type.tier, candidate.upgraded);
    options.push(candidate);
  });
  return options;
}

export function getEnemyModifierTypesForWave(waveIndex: integer, count: integer, party: EnemyPokemon[]): PokemonHeldItemModifierType[] {
  return new Array(count).fill(0).map(() => getNewModifierTypeOption(party, false).type as PokemonHeldItemModifierType);
}

function getNewModifierTypeOption(party: Pokemon[], player?: boolean, tier?: ModifierTier, upgrade?: boolean): ModifierTypeOption {
  if (player === undefined)
    player = true;
  if (tier === undefined) {
    const tierValue = Utils.randInt(256);
    if (player) {
      const partyShinyCount = party.filter(p => p.shiny).length;
      const upgradeOdds = Math.floor(32 / Math.max((partyShinyCount * 2), 1));
      upgrade = !Utils.randInt(upgradeOdds);
    } else
      upgrade = false;
    tier = (tierValue >= 52 ? ModifierTier.COMMON : tierValue >= 8 ? ModifierTier.GREAT : tierValue >= 1 ? ModifierTier.ULTRA : ModifierTier.MASTER) + (upgrade ? 1 : 0);
  }
  
  const thresholds = Object.keys((player ? modifierPoolThresholds : enemyModifierPoolThresholds)[tier]);
  const totalWeight = parseInt(thresholds[thresholds.length - 1]);
  const value = Utils.randInt(totalWeight);
  let index: integer;
  for (let t of thresholds) {
    let threshold = parseInt(t);
    if (value < threshold) {
      index = (player ? modifierPoolThresholds : enemyModifierPoolThresholds)[tier][threshold];
      break;
    }
  }
  
  if (player)
    console.log(index, ignoredPoolIndexes[tier].filter(i => i <= index).length, ignoredPoolIndexes[tier])
  let modifierType: ModifierType | WeightedModifierType = (player ? modifierPool : enemyModifierPool)[tier][index];
  if (modifierType instanceof WeightedModifierType)
    modifierType = (modifierType as WeightedModifierType).modifierType;
  if (modifierType instanceof ModifierTypeGenerator) {
    modifierType = (modifierType as ModifierTypeGenerator).generateType(party);
    if (modifierType === null) {
      if (player)
        console.log(ModifierTier[tier], upgrade);
      return getNewModifierTypeOption(party, player, tier, upgrade);
    }
  }

  console.log(modifierType, !player ? '(enemy)' : '');

  return new ModifierTypeOption(modifierType as ModifierType, upgrade);
}

export function getDefaultModifierTypeForTier(tier: ModifierTier): ModifierType {
  let modifierType: ModifierType | WeightedModifierType = modifierPool[tier][tier !== ModifierTier.LUXURY ? 0 : 1];
  if (modifierType instanceof WeightedModifierType)
    modifierType = (modifierType as WeightedModifierType).modifierType;
  return modifierType;
}

export class ModifierTypeOption {
  public type: ModifierType;
  public upgraded: boolean;

  constructor(type: ModifierType, upgraded: boolean) {
    this.type = type;
    this.upgraded = upgraded;
  }
}