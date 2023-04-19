import { BattleStat, getBattleStatName } from './battle-stat';
import * as Modifiers from './modifier';
import { AttackMove, Moves, allMoves } from './move';
import { PokeballType, getPokeballName } from './pokeball';
import { PlayerPokemon, PokemonMove } from './pokemon';
import { EvolutionItem, pokemonEvolutions } from './pokemon-evolutions';
import { Stat, getStatName } from './pokemon-stat';
import { tmSpecies } from './tms';
import { Type } from './type';
import PartyUiHandler, { PokemonMoveSelectFilter, PokemonSelectFilter } from './ui/party-ui-handler';
import * as Utils from './utils';

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
  public tier: ModifierTier;
  private newModifierFunc: NewModifierFunc;

  constructor(name: string, description: string, newModifierFunc: NewModifierFunc, iconImage?: string, group?: string,) {
    this.name = name;
    this.description = description;
    this.iconImage = iconImage || name?.replace(/[ \-]/g, '_')?.toLowerCase();
    this.group = group || '';
    this.newModifierFunc = newModifierFunc;
  }

  setTier(tier: ModifierTier) {
    this.tier = tier;
  }

  newModifier(...args: any[]) {
    return this.newModifierFunc(this, args);
  }
}

class AddPokeballModifierType extends ModifierType {
  constructor(pokeballType: PokeballType, count: integer, iconImage?: string) {
    super(`${count}x ${getPokeballName(pokeballType)}`, `Receive ${getPokeballName(pokeballType)} x${count}`, (_type, _args) => new Modifiers.AddPokeballModifier(this, pokeballType, count), iconImage, 'pb');
  }
}

export class PokemonModifierType extends ModifierType {
  public selectFilter: PokemonSelectFilter;

  constructor(name: string, description: string, newModifierFunc: NewModifierFunc, selectFilter?: PokemonSelectFilter, iconImage?: string, group?: string) {
    super(name, description, newModifierFunc, iconImage, group);

    this.selectFilter = selectFilter;
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

export enum TempBattleStat {
  ATK,
  DEF,
  SPATK,
  SPDEF,
  SPD,
  ACC,
  CRIT
}

function getTempBattleStatName(tempBattleStat: TempBattleStat) {
  if (tempBattleStat === TempBattleStat.CRIT)
    return 'critical-hit ratio';
  return getBattleStatName(tempBattleStat as integer as BattleStat);
}

function getTempBattleStatBoosterItemName(tempBattleStat: TempBattleStat) {
  switch (tempBattleStat) {
    case TempBattleStat.ATK:
      return 'X Attack';
    case TempBattleStat.DEF:
      return 'X Defense';
    case TempBattleStat.SPATK:
      return 'X Sp. Atk';
    case TempBattleStat.SPDEF:
      return 'X Sp. Def';
    case TempBattleStat.SPD:
      return 'X Speed';
    case TempBattleStat.ACC:
      return 'X Accuracy';
    case TempBattleStat.CRIT:
      return 'Dire Hit';
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

export class AttackTypeBoosterModifierType extends PokemonModifierType {
  public moveType: Type;
  public boostPercent: integer;

  constructor(moveType: Type, boostPercent: integer) {
    super(Utils.toPokemonUpperCase(getAttackTypeBoosterItemName(moveType)), `Inceases the power of a POKéMON's ${Type[moveType]}-type moves by 20%`,
      (_type, args) => new Modifiers.AttackTypeBoosterModifier(this, (args[0] as PlayerPokemon).id, moveType, boostPercent),
      null, `${getAttackTypeBoosterItemName(moveType).replace(/[ \-]/g, '_').toLowerCase()}`);

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

export class PokemonBaseStatBoosterModifierType extends PokemonModifierType {
  private stat: Stat;

  constructor(name: string, stat: Stat, _iconImage?: string) {
    super(name, `Increases the holder's base ${getStatName(stat)} by 20%` , (_type, args) => new Modifiers.PokemonBaseStatModifier(this, (args[0] as PlayerPokemon).id, this.stat));

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

export class PokemonExpBoosterModifierType extends PokemonModifierType {
  constructor(name: string, boostPercent: integer, iconImage?: string) {
    super(name, `Increases the holder's gain of EXP. Points by ${boostPercent}%`, (_type, args) => new Modifiers.PokemonExpBoosterModifier(this, (args[0] as PlayerPokemon).id, boostPercent), iconImage);
  }
}

export class TmModifierType extends PokemonModifierType {
  public moveId: Moves;

  constructor(moveId: Moves) {
    super(`TM${Utils.padInt(Object.keys(tmSpecies).indexOf(moveId.toString()) + 1, 3)} - ${allMoves[moveId - 1].name}`, `Teach ${allMoves[moveId - 1].name} to a POKéMON`, (_type, args) => new Modifiers.TmModifier(this, (args[0] as PlayerPokemon).id),
      (pokemon: PlayerPokemon) => {
        if (pokemon.compatibleTms.indexOf(moveId) === -1 || pokemon.moveset.filter(m => m?.moveId === moveId).length)
          return PartyUiHandler.NoEffectMessage;
        return null;
      }, `tm_${Type[allMoves[moveId - 1].type].toLowerCase()}`, 'tm');

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

  generateType(party: PlayerPokemon[]) {
    const ret = this.genTypeFunc(party);
    if (ret)
      ret.setTier(this.tier);
    return ret;
  }
}

class AttackTypeBoosterModifierTypeGenerator extends ModifierTypeGenerator {
  constructor() {
    super((party: PlayerPokemon[]) => {
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
    super((party: PlayerPokemon[]) => {
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

const modifierPool = {
  [ModifierTier.COMMON]: [
    new WeightedModifierType(new AddPokeballModifierType(PokeballType.POKEBALL, 5, 'pb'), 6),
    new WeightedModifierType(new PokemonLevelIncrementModifierType('RARE CANDY'), 2),
    new WeightedModifierType(new PokemonHpRestoreModifierType('POTION', 20), (party: PlayerPokemon[]) => {
      const thresholdPartyMemberCount = party.filter(p => p.getInverseHp() >= 10 || p.getHpRatio() <= 0.875).length;
      return thresholdPartyMemberCount * 3;
    }),
    new WeightedModifierType(new PokemonHpRestoreModifierType('SUPER POTION', 50), (party: PlayerPokemon[]) => {
      const thresholdPartyMemberCount = party.filter(p => p.getInverseHp() >= 25 || p.getHpRatio() <= 0.75).length;
      return thresholdPartyMemberCount;
    }),
    new WeightedModifierType(new PokemonPpRestoreModifierType('ETHER', 10), (party: PlayerPokemon[]) => {
      const thresholdPartyMemberCount = party.filter(p => p.hp && p.moveset.filter(m => (m.getMove().pp - m.ppUsed) <= 5).length).length;
      return thresholdPartyMemberCount * 3;
    }),
    new WeightedModifierType(new PokemonPpRestoreModifierType('MAX ETHER', -1), (party: PlayerPokemon[]) => {
      const thresholdPartyMemberCount = party.filter(p => p.hp && p.moveset.filter(m => (m.getMove().pp - m.ppUsed) <= 5).length).length;
      return thresholdPartyMemberCount;
    }),
    new WeightedModifierType(new ModifierTypeGenerator((party: PlayerPokemon[]) => {
      const randTempBattleStat = Utils.randInt(7) as TempBattleStat;
      return new TempBattleStatBoosterModifierType(randTempBattleStat);
    }), 4)
  ].map(m => { m.setTier(ModifierTier.COMMON); return m; }),
  [ModifierTier.GREAT]: [
    new WeightedModifierType(new AddPokeballModifierType(PokeballType.GREAT_BALL, 5, 'gb'), 12),
    new WeightedModifierType(new PokemonStatusHealModifierType('FULL HEAL'), (party: PlayerPokemon[]) => {
      const statusEffectPartyMemberCount = party.filter(p => p.hp && !!p.status).length;
      return statusEffectPartyMemberCount * 8;
    }),
    new WeightedModifierType(new PokemonReviveModifierType('REVIVE', 50), (party: PlayerPokemon[]) => {
      const faintedPartyMemberCount = party.filter(p => !p.hp).length;
      return faintedPartyMemberCount * 6;
    }),
    new WeightedModifierType(new PokemonReviveModifierType('MAX REVIVE', 100), (party: PlayerPokemon[]) => {
      const faintedPartyMemberCount = party.filter(p => !p.hp).length;
      return faintedPartyMemberCount * 2;
    }),
    new WeightedModifierType(new AllPokemonFullReviveModifierType('SACRED ASH'), (party: PlayerPokemon[]) => {
      return party.filter(p => !p.hp).length >= Math.ceil(party.length / 2) ? 1 : 0;
    }),
    new WeightedModifierType(new PokemonHpRestoreModifierType('HYPER POTION', 200), (party: PlayerPokemon[]) => {
      const thresholdPartyMemberCount = party.filter(p => p.getInverseHp() >= 100 || p.getHpRatio() <= 0.625).length;
      return thresholdPartyMemberCount * 2;
    }),
    new WeightedModifierType(new PokemonHpRestoreModifierType('MAX POTION', 100, true), (party: PlayerPokemon[]) => {
      const thresholdPartyMemberCount = party.filter(p => p.getInverseHp() >= 150 || p.getHpRatio() <= 0.5).length;
      return Math.ceil(thresholdPartyMemberCount / 1.5);
    }),
    new WeightedModifierType(new PokemonAllMovePpRestoreModifierType('ELIXIR', 10), (party: PlayerPokemon[]) => {
      const thresholdPartyMemberCount = party.filter(p => p.hp && p.moveset.filter(m => (m.getMove().pp - m.ppUsed) <= 5).length).length;
      return thresholdPartyMemberCount * 2;
    }),
    new WeightedModifierType(new PokemonAllMovePpRestoreModifierType('MAX ELIXIR', -1), (party: PlayerPokemon[]) => {
      const thresholdPartyMemberCount = party.filter(p => p.hp && p.moveset.filter(m => (m.getMove().pp - m.ppUsed) <= 5).length).length;
      return Math.ceil(thresholdPartyMemberCount / 1.5);
    }),
    new WeightedModifierType(new ModifierTypeGenerator((party: PlayerPokemon[]) => {
      const partyMemberCompatibleTms = party.map(p => p.compatibleTms);
      const uniqueCompatibleTms = partyMemberCompatibleTms.flat().filter((tm, i, array) => array.indexOf(tm) === i);
      const randTmIndex = Utils.randInt(uniqueCompatibleTms.length);
      return new TmModifierType(uniqueCompatibleTms[randTmIndex]);
    }), 4),
    new WeightedModifierType(new ModifierType('EXP. SHARE', 'All POKéMON in your party gain an additional 10% of a battle\'s EXP. Points', (type, _args) => new Modifiers.ExpShareModifier(type), 'exp_share'), 2),
    new WeightedModifierType(new PokemonExpBoosterModifierType('LUCKY EGG', 50), 2),
    new WeightedModifierType(new ModifierTypeGenerator((party: PlayerPokemon[]) => {
      const randStat = Utils.randInt(6) as Stat;
      return new PokemonBaseStatBoosterModifierType(getBaseStatBoosterItemName(randStat), randStat);
    }), 4)
  ].map(m => { m.setTier(ModifierTier.GREAT); return m; }),
  [ModifierTier.ULTRA]: [
    new WeightedModifierType(new AddPokeballModifierType(PokeballType.ULTRA_BALL, 5, 'ub'), 8),
    new WeightedModifierType(new EvolutionItemModifierTypeGenerator(), 5),
    new WeightedModifierType(new AttackTypeBoosterModifierTypeGenerator(), 3),
    new ModifierType('OVAL CHARM', 'For every X (no. of party members) items in a POKéMON\'s held item stack, give one to each other party member',
      (type, _args) => new Modifiers.PartyShareModifier(type), 'oval_charm'),
    new ModifierType('HEALING CHARM', 'Doubles the effectiveness of HP restoring moves and items (excludes revives)', (type, _args) => new Modifiers.HealingBoosterModifier(type, 2), 'healing_charm'),
    new WeightedModifierType(new PokemonModifierType('SHELL BELL', 'Heals 1/8 of a POKéMON\'s dealt damage', (type, args) => new Modifiers.HitHealModifier(type, (args[0] as PlayerPokemon).id)), 2),
    new WeightedModifierType(new ExpBoosterModifierType('EXP CHARM', 25), 4)
  ].map(m => { m.setTier(ModifierTier.ULTRA); return m; }),
  [ModifierTier.MASTER]: [
    new AddPokeballModifierType(PokeballType.MASTER_BALL, 1, 'mb'),
    new WeightedModifierType(new ModifierType('SHINY CHARM', 'Dramatically increases the chance of a wild POKéMON being shiny', (type, _args) => new Modifiers.ShinyRateBoosterModifier(type)), 2)
  ].map(m => { m.setTier(ModifierTier.MASTER); return m; }),
  [ModifierTier.LUXURY]: [
    new ExpBoosterModifierType('GOLDEN EXP CHARM', 100),
    new ModifierType(`GOLDEN ${getPokeballName(PokeballType.POKEBALL)}`, 'Adds 1 extra item option at the end of every battle', (type, _args) => new Modifiers.ExtraModifierModifier(type), 'pb_gold')
  ].map(m => { m.setTier(ModifierTier.LUXURY); return m; }),
};

let modifierPoolThresholds = {};
let ignoredPoolIndexes = {};

export function regenerateModifierPoolThresholds(party: PlayerPokemon[]) {
  ignoredPoolIndexes = {};
  modifierPoolThresholds = Object.fromEntries(new Map(Object.keys(modifierPool).map(t => {
    ignoredPoolIndexes[t] = [];
    const thresholds = new Map();
    let i = 0;
    modifierPool[t].reduce((total: integer, modifierType: ModifierType | WeightedModifierType) => {
      if (modifierType instanceof WeightedModifierType) {
        const weightedModifierType = modifierType as WeightedModifierType;
        const weight = weightedModifierType.weight instanceof Function
        ? (weightedModifierType.weight as Function)(party)
        : weightedModifierType.weight as integer;
        if (weight)
          total += weight;
        else {
          ignoredPoolIndexes[t].push(i++);
          return total;
        }
      } else
        total++;
      thresholds.set(total, i++);
      return total;
    }, 0);
    return [ t, Object.fromEntries(thresholds) ]
  })));
}

export function getModifierTypeOptionsForWave(waveIndex: integer, count: integer, party: PlayerPokemon[]): ModifierTypeOption[] {
  if (waveIndex % 10 === 0)
    return modifierPool[ModifierTier.LUXURY].map(m => new ModifierTypeOption(m, false));
  const options: ModifierTypeOption[] = [];
  const retryCount = Math.min(count * 5, 50);
  new Array(count).fill(0).map(() => {
    let candidate = getNewModifierTypeOption(party);
    let r = 0;
    while (options.length && ++r < retryCount && options.filter(o => o.type.name === candidate.type.name || o.type.group === candidate.type.group).length)
      candidate = getNewModifierTypeOption(party, candidate.type.tier, candidate.upgraded);
    options.push(candidate);
  });
  return options;
}

function getNewModifierTypeOption(party: PlayerPokemon[], tier?: ModifierTier, upgrade?: boolean): ModifierTypeOption {
  const tierValue = Utils.randInt(256);
  if (tier === undefined) {
    const partyShinyCount = party.filter(p => p.shiny).length;
    const upgradeOdds = Math.floor(32 / Math.max((partyShinyCount * 2), 1));
    upgrade =  !Utils.randInt(upgradeOdds);
    tier = (tierValue >= 52 ? ModifierTier.COMMON : tierValue >= 8 ? ModifierTier.GREAT : tierValue >= 1 ? ModifierTier.ULTRA : ModifierTier.MASTER) + (upgrade ? 1 : 0);
  }
  const thresholds = Object.keys(modifierPoolThresholds[tier]);
  const totalWeight = parseInt(thresholds[thresholds.length - 1]);
  const value = Utils.randInt(totalWeight);
  let index: integer;
  for (let t of thresholds) {
    let threshold = parseInt(t);
    if (value < threshold) {
      index = modifierPoolThresholds[tier][threshold];
      break;
    }
  }
  console.log(index, ignoredPoolIndexes[tier].filter(i => i <= index).length, ignoredPoolIndexes[tier])
  let modifierType: ModifierType | WeightedModifierType = modifierPool[tier][index];
  if (modifierType instanceof WeightedModifierType)
    modifierType = (modifierType as WeightedModifierType).modifierType;
  if (modifierType instanceof ModifierTypeGenerator) {
    modifierType = (modifierType as ModifierTypeGenerator).generateType(party);
    if (modifierType === null) {
      console.log(ModifierTier[tier], upgrade);
      return getNewModifierTypeOption(party, tier, upgrade);
    }
  }
  console.log(modifierType);
  return new ModifierTypeOption(modifierType as ModifierType, upgrade);
}

export class ModifierTypeOption {
  public type: ModifierType;
  public upgraded: boolean;

  constructor(type: ModifierType, upgraded: boolean) {
    this.type = type;
    this.upgraded = upgraded;
  }
}