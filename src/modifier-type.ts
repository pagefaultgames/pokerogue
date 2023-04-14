import * as Modifiers from './modifier';
import { Moves, allMoves } from './move';
import { PokeballType, getPokeballName } from './pokeball';
import { PlayerPokemon, PokemonMove } from './pokemon';
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
  public tier: ModifierTier;
  private newModifierFunc: NewModifierFunc;

  constructor(name: string, description: string, newModifierFunc: NewModifierFunc, iconImage?: string) {
    this.name = name;
    this.description = description;
    this.iconImage = iconImage || name?.replace(/[ \-]/g, '_')?.toLowerCase();
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
    super(`${count}x ${getPokeballName(pokeballType)}`, `Receive ${getPokeballName(pokeballType)} x${count}`, (_type, _args) => new Modifiers.AddPokeballModifier(this, pokeballType, count), iconImage);
  }
}

export class PokemonModifierType extends ModifierType {
  public selectFilter: PokemonSelectFilter;

  constructor(name: string, description: string, newModifierFunc: NewModifierFunc, selectFilter?: PokemonSelectFilter, iconImage?: string) {
    super(name, description, newModifierFunc, iconImage);

    this.selectFilter = selectFilter;
  }
}

export class PokemonHpRestoreModifierType extends PokemonModifierType {
  protected restorePoints: integer;
  protected percent: boolean;

  constructor(name: string, restorePoints: integer, percent?: boolean, newModifierFunc?: NewModifierFunc, selectFilter?: PokemonSelectFilter, iconImage?: string) {
    super(name, `Restore ${restorePoints}${percent ? '%' : ''} HP for one POKéMON`,
      newModifierFunc || ((_type, args) => new Modifiers.PokemonHpRestoreModifier(this, (args[0] as PlayerPokemon).id, this.restorePoints, this.percent, false)),
    selectFilter || ((pokemon: PlayerPokemon) => {
      if (!pokemon.hp || pokemon.hp >= pokemon.getMaxHp())
        return PartyUiHandler.NoEffectMessage;
      return null;
    }), iconImage);

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
      }), iconImage);

    this.description = `Revive one POKéMON and restore ${restorePercent}% HP`;
    this.selectFilter = (pokemon: PlayerPokemon) => {
      if (pokemon.hp)
        return PartyUiHandler.NoEffectMessage;
      return null;
    };
  }
}

export abstract class PokemonMoveModifierType extends PokemonModifierType {
  public moveSelectFilter: PokemonMoveSelectFilter;

  constructor(name: string, description: string, newModifierFunc: NewModifierFunc, selectFilter?: PokemonSelectFilter, moveSelectFilter?: PokemonMoveSelectFilter, iconImage?: string) {
    super(name, description, newModifierFunc, selectFilter, iconImage);

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
    }, iconImage);

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
      }, iconImage);

    this.restorePoints = this.restorePoints;
  }
}

export class PokemonLevelIncrementModifierType extends PokemonModifierType {
  constructor(name: string, iconImage?: string) {
    super(name, `Increase a POKéMON\'s level by 1`, (_type, args) => new Modifiers.PokemonLevelIncrementModifier(this, (args[0] as PlayerPokemon).id),
      (_pokemon: PlayerPokemon) => null, iconImage);
  }
}

export class PokemonBaseStatBoosterModifierType extends PokemonModifierType {
  private stat: Stat;

  constructor(name: string, stat: Stat, _iconImage?: string) {
    super(name, `Increases one POKéMON's base ${getStatName(stat)} by 20%` , (_type, args) => new Modifiers.PokemonBaseStatModifier(this, (args[0] as PlayerPokemon).id, this.stat));

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

export class TmModifierType extends PokemonModifierType {
  public moveId: Moves;

  constructor(moveId: Moves) {
    super(`TM${Utils.padInt(Object.keys(tmSpecies).indexOf(moveId.toString()) + 1, 3)} - ${allMoves[moveId - 1].name}`, `Teach ${allMoves[moveId - 1].name} to a POKéMON`, (_type, args) => new Modifiers.TmModifier(this, (args[0] as PlayerPokemon).id),
      (pokemon: PlayerPokemon) => {
        if (pokemon.compatibleTms.indexOf(moveId) === -1 || pokemon.moveset.filter(m => m?.moveId === moveId).length)
          return PartyUiHandler.NoEffectMessage;
        return null;
      }, `tm_${Type[allMoves[moveId - 1].type].toLowerCase()}`);

    this.moveId = moveId;
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
    ret.setTier(this.tier);
    return ret;
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
    new WeightedModifierType(new AddPokeballModifierType(PokeballType.POKEBALL, 5, 'pb'), 2),
    new WeightedModifierType(new PokemonHpRestoreModifierType('POTION', 20), (party: PlayerPokemon[]) => {
      const thresholdPartyMemberCount = party.filter(p => p.getInverseHp() >= 10 || p.getHpRatio() <= 0.875).length;
      return thresholdPartyMemberCount;
    }),
    new WeightedModifierType(new PokemonHpRestoreModifierType('SUPER POTION', 50), (party: PlayerPokemon[]) => {
      const thresholdPartyMemberCount = party.filter(p => p.getInverseHp() >= 25 || p.getHpRatio() <= 0.75).length;
      return Math.ceil(thresholdPartyMemberCount / 3);
    }),
    new WeightedModifierType(new PokemonPpRestoreModifierType('ETHER', 10), (party: PlayerPokemon[]) => {
      const thresholdPartyMemberCount = party.filter(p => p.moveset.filter(m => m.ppUsed >= 5).length).length;
      return thresholdPartyMemberCount;
    }),
    new WeightedModifierType(new PokemonPpRestoreModifierType('MAX ETHER', -1), (party: PlayerPokemon[]) => {
      const thresholdPartyMemberCount = party.filter(p => p.moveset.filter(m => m.ppUsed > 10).length).length;
      return Math.ceil(thresholdPartyMemberCount / 3);
    })
  ].map(m => { m.setTier(ModifierTier.COMMON); return m; }),
  [ModifierTier.GREAT]: [
    new WeightedModifierType(new AddPokeballModifierType(PokeballType.GREAT_BALL, 5, 'gb'), 3),
    new WeightedModifierType(new PokemonReviveModifierType('REVIVE', 50), (party: PlayerPokemon[]) => {
      const faintedPartyMemberCount = party.filter(p => !p.hp).length;
      return faintedPartyMemberCount * 3;
    }),
    new WeightedModifierType(new PokemonReviveModifierType('MAX REVIVE', 100), (party: PlayerPokemon[]) => {
      const faintedPartyMemberCount = party.filter(p => !p.hp).length;
      return faintedPartyMemberCount;
    }),
    new WeightedModifierType(new PokemonHpRestoreModifierType('HYPER POTION', 200), (party: PlayerPokemon[]) => {
      const thresholdPartyMemberCount = party.filter(p => p.getInverseHp() >= 100 || p.getHpRatio() <= 0.625).length;
      return thresholdPartyMemberCount;
    }),
    new WeightedModifierType(new PokemonHpRestoreModifierType('MAX POTION', 100, true), (party: PlayerPokemon[]) => {
      const thresholdPartyMemberCount = party.filter(p => p.getInverseHp() >= 150 || p.getHpRatio() <= 0.5).length;
      return Math.ceil(thresholdPartyMemberCount / 3);
    }),
    new WeightedModifierType(new PokemonAllMovePpRestoreModifierType('ELIXIR', 10), (party: PlayerPokemon[]) => {
      const thresholdPartyMemberCount = party.filter(p => p.moveset.filter(m => m.ppUsed >= 5).length).length;
      return thresholdPartyMemberCount;
    }),
    new WeightedModifierType(new PokemonAllMovePpRestoreModifierType('MAX ELIXIR', -1), (party: PlayerPokemon[]) => {
      const thresholdPartyMemberCount = party.filter(p => p.moveset.filter(m => m.ppUsed > 10).length).length;
      return Math.ceil(thresholdPartyMemberCount / 3);
    }),
    new WeightedModifierType(new ModifierTypeGenerator((party: PlayerPokemon[]) => {
      const partyMemberCompatibleTms = party.map(p => p.compatibleTms);
      const uniqueCompatibleTms = partyMemberCompatibleTms.flat().filter((tm, i, array) => array.indexOf(tm) === i);
      const randTmIndex = Utils.randInt(uniqueCompatibleTms.length);
      return new TmModifierType(uniqueCompatibleTms[randTmIndex]);
    }), 2),
    new PokemonLevelIncrementModifierType('RARE CANDY'),
    new PokemonBaseStatBoosterModifierType('HP-UP', Stat.HP),
    new PokemonBaseStatBoosterModifierType('PROTEIN', Stat.ATK),
    new PokemonBaseStatBoosterModifierType('IRON', Stat.DEF),
    new PokemonBaseStatBoosterModifierType('CALCIUM', Stat.SPATK),
    new PokemonBaseStatBoosterModifierType('ZINC', Stat.SPDEF),
    new PokemonBaseStatBoosterModifierType('CARBOS', Stat.SPD)
  ].map(m => { m.setTier(ModifierTier.GREAT); return m; }),
  [ModifierTier.ULTRA]: [
    new AddPokeballModifierType(PokeballType.ULTRA_BALL, 5, 'ub'),
    new WeightedModifierType(new AllPokemonFullReviveModifierType('SACRED ASH'), (party: PlayerPokemon[]) => {
      return party.filter(p => !p.hp).length >= Math.ceil(party.length / 2) ? 1 : 0;
    }),
    new ModifierType('OVAL CHARM', 'For every X (no. of party members) items in a POKéMON\'s held item stack, give one to each other party member',
      (type, _args) => new Modifiers.PartyShareModifier(type), 'oval_charm'),
    new ModifierType('HEALING CHARM', 'Doubles the effectiveness of HP restoring moves and items (excludes revives)', (type, _args) => new Modifiers.HealingBoosterModifier(type, 2), 'healing_charm'),
    new WeightedModifierType(new PokemonModifierType('SHELL BELL', 'Heals 1/8 of a POKéMON\'s damage dealt', (type, args) => new Modifiers.HitHealModifier(type, (args[0] as PlayerPokemon).id)), 8),
    new ExpBoosterModifierType('LUCKY EGG', 25),
    new ModifierType('EXP. SHARE', 'All POKéMON in your party gain an additional 10% of a battle\'s EXP. Points', (type, _args) => new Modifiers.ExpShareModifier(type), 'exp_share')
  ].map(m => { m.setTier(ModifierTier.ULTRA); return m; }),
  [ModifierTier.MASTER]: [
    new AddPokeballModifierType(PokeballType.MASTER_BALL, 1, 'mb'),
    new WeightedModifierType(new ModifierType('SHINY CHARM', 'Dramatically increases the chance of a wild POKéMON being shiny', (type, _args) => new Modifiers.ShinyRateBoosterModifier(type)), 2)
  ].map(m => { m.setTier(ModifierTier.MASTER); return m; }),
  [ModifierTier.LUXURY]: [
    new ExpBoosterModifierType('GOLDEN EGG', 100),
    new ModifierType(`GOLDEN ${getPokeballName(PokeballType.POKEBALL)}`, 'Adds 1 extra ITEM option at the end of every battle', (type, _args) => new Modifiers.ExtraModifierModifier(type), 'pb_gold')
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
  console.log(modifierPoolThresholds)
}

export function getModifierTypeOptionsForWave(waveIndex: integer, count: integer, party: PlayerPokemon[]): ModifierTypeOption[] {
  if (waveIndex % 10 === 0)
    return modifierPool[ModifierTier.LUXURY].map(m => new ModifierTypeOption(m, false));
  return new Array(count).fill(0).map(() => getNewModifierTypeOption(party));
}

function getNewModifierTypeOption(party: PlayerPokemon[]): ModifierTypeOption {
  const tierValue = Utils.randInt(256);
  const upgrade = Utils.randInt(32) === 0;
  const tier: ModifierTier = (tierValue >= 52 ? ModifierTier.COMMON : tierValue >= 8 ? ModifierTier.GREAT : tierValue >= 1 ? ModifierTier.ULTRA : ModifierTier.MASTER) + (upgrade ? 1 : 0);
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
  if (modifierType instanceof ModifierTypeGenerator)
    modifierType = (modifierType as ModifierTypeGenerator).generateType(party);
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