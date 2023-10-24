import * as Modifiers from './modifier';
import { AttackMove, Moves, allMoves } from '../data/move';
import { PokeballType, getPokeballName } from '../data/pokeball';
import Pokemon, { EnemyPokemon, PlayerPokemon, PokemonMove } from '../pokemon';
import { EvolutionItem, pokemonEvolutions } from '../data/pokemon-evolutions';
import { Stat, getStatName } from '../data/pokemon-stat';
import { tmPoolTiers, tmSpecies } from '../data/tms';
import { Type } from '../data/type';
import PartyUiHandler, { PokemonMoveSelectFilter, PokemonSelectFilter } from '../ui/party-ui-handler';
import * as Utils from '../utils';
import { TempBattleStat, getTempBattleStatBoosterItemName, getTempBattleStatName } from '../data/temp-battle-stat';
import { BerryType, getBerryEffectDescription, getBerryName } from '../data/berry';
import { Unlockables } from '../system/unlockables';
import { GameMode } from '../game-mode';

type Modifier = Modifiers.Modifier;

export enum ModifierTier {
  COMMON,
  GREAT,
  ULTRA,
  MASTER,
  LUXURY
};

export enum ModifierPoolType {
  PLAYER,
  WILD,
  TRAINER
}

type NewModifierFunc = (type: ModifierType, args: any[]) => Modifier;

export class ModifierType {
  public id: string;
  public generatorId: string;
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
    this.iconImage = iconImage || name?.replace(/[ \-]/g, '_')?.replace(/['\.]/g, '')?.toLowerCase();
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

type ModifierTypeGeneratorFunc = (party: Pokemon[], pregenArgs?: any[]) => ModifierType;

export class ModifierTypeGenerator extends ModifierType {
  private genTypeFunc:  ModifierTypeGeneratorFunc;

  constructor(genTypeFunc: ModifierTypeGeneratorFunc) {
    super(null, null, null, null);
    this.genTypeFunc = genTypeFunc;
  }

  generateType(party: Pokemon[], pregenArgs?: any[]) {
    const ret = this.genTypeFunc(party, pregenArgs);
    if (ret) {
      ret.generatorId = ret.id;
      ret.id = this.id;
      ret.setTier(this.tier);
    }
    return ret;
  }
}

export interface GeneratedPersistentModifierType {
  getPregenArgs(): any[];
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
  protected restorePercent: integer;

  constructor(name: string, restorePoints: integer, restorePercent: integer, newModifierFunc?: NewModifierFunc, selectFilter?: PokemonSelectFilter, iconImage?: string, group?: string) {
    super(name, restorePoints ? `Restore ${restorePoints} HP or ${restorePercent}% HP for one Pokémon, whichever is higher` : `Restore ${restorePercent}% HP for one Pokémon`,
      newModifierFunc || ((_type, args) => new Modifiers.PokemonHpRestoreModifier(this, (args[0] as PlayerPokemon).id, this.restorePoints, this.restorePercent, false)),
    selectFilter || ((pokemon: PlayerPokemon) => {
      if (!pokemon.hp || pokemon.hp >= pokemon.getMaxHp())
        return PartyUiHandler.NoEffectMessage;
      return null;
    }), iconImage, group || 'potion');

    this.restorePoints = restorePoints;
    this.restorePercent = restorePercent;
  }
}

export class PokemonReviveModifierType extends PokemonHpRestoreModifierType {
  constructor(name: string, restorePercent: integer, iconImage?: string) {
    super(name, 0, restorePercent, (_type, args) => new Modifiers.PokemonHpRestoreModifier(this, (args[0] as PlayerPokemon).id, 0, this.restorePercent, true),
      ((pokemon: PlayerPokemon) => {
        if (!pokemon.isFainted())
          return PartyUiHandler.NoEffectMessage;
        return null;
      }), iconImage, 'revive');

    this.description = `Revive one Pokémon and restore ${restorePercent}% HP`;
    this.selectFilter = (pokemon: PlayerPokemon) => {
      if (pokemon.hp)
        return PartyUiHandler.NoEffectMessage;
      return null;
    };
  }
}

export class PokemonStatusHealModifierType extends PokemonModifierType {
  constructor(name: string) {
    super(name, `Heal any status ailment for one Pokémon`,
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
    super(name, `Restore ${restorePoints > -1 ? restorePoints : 'all'} PP for one Pokémon move`, (_type, args) => new Modifiers.PokemonPpRestoreModifier(this, (args[0] as PlayerPokemon).id, (args[1] as integer), this.restorePoints),
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
    super(name, `Restore ${restorePoints > -1 ? restorePoints : 'all'} PP for all of one Pokémon's moves`, (_type, args) => new Modifiers.PokemonAllMovePpRestoreModifier(this, (args[0] as PlayerPokemon).id, this.restorePoints),
      (pokemon: PlayerPokemon) => {
        if (!pokemon.getMoveset().filter(m => m.ppUsed).length)
          return PartyUiHandler.NoEffectMessage;
        return null;
      }, iconImage, 'elixir');

    this.restorePoints = this.restorePoints;
  }
}

export class DoubleBattleChanceBoosterModifierType extends ModifierType {
  public battleCount: integer;

  constructor(name: string, battleCount: integer) {
    super(name, `Doubles the chance of an encounter being a double battle for ${battleCount} battles`, (_type, _args) => new Modifiers.DoubleBattleChanceBoosterModifier(this, this.battleCount),
      null, 'lure');

    this.battleCount = battleCount;
  }
}

export class TempBattleStatBoosterModifierType extends ModifierType implements GeneratedPersistentModifierType {
  public tempBattleStat: TempBattleStat;

  constructor(tempBattleStat: TempBattleStat) {
    super(getTempBattleStatBoosterItemName(tempBattleStat),
      `Increases the ${getTempBattleStatName(tempBattleStat)} of all party members by 1 stage for 5 battles`,
      (_type, _args) => new Modifiers.TempBattleStatBoosterModifier(this, this.tempBattleStat),
      getTempBattleStatBoosterItemName(tempBattleStat).replace(/\./g, '').replace(/[ ]/g, '_').toLowerCase());

    this.tempBattleStat = tempBattleStat;
  }

  getPregenArgs(): any[] {
    return [ this.tempBattleStat ];
  }
}

export class BerryModifierType extends PokemonHeldItemModifierType implements GeneratedPersistentModifierType {
  private berryType: BerryType;

  constructor(berryType: BerryType) {
    super(getBerryName(berryType), getBerryEffectDescription(berryType),
      (type, args) => new Modifiers.BerryModifier(type, (args[0] as Pokemon).id, berryType),
      null, 'berry');
    
    this.berryType = berryType;
  }

  getPregenArgs(): any[] {
    return [ this.berryType ];
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

export class AttackTypeBoosterModifierType extends PokemonHeldItemModifierType implements GeneratedPersistentModifierType {
  public moveType: Type;
  public boostPercent: integer;

  constructor(moveType: Type, boostPercent: integer) {
    super(getAttackTypeBoosterItemName(moveType), `Inceases the power of a Pokémon's ${Utils.toReadableString(Type[moveType])}-type moves by 20%`,
      (_type, args) => new Modifiers.AttackTypeBoosterModifier(this, (args[0] as Pokemon).id, moveType, boostPercent),
      `${getAttackTypeBoosterItemName(moveType).replace(/[ \-]/g, '_').toLowerCase()}`);

    this.moveType = moveType;
    this.boostPercent = boostPercent;
  }

  getPregenArgs(): any[] {
    return [ this.moveType ];
  }
}

export class PokemonLevelIncrementModifierType extends PokemonModifierType {
  constructor(name: string, iconImage?: string) {
    super(name, `Increase a Pokémon\'s level by 1`, (_type, args) => new Modifiers.PokemonLevelIncrementModifier(this, (args[0] as PlayerPokemon).id),
      (_pokemon: PlayerPokemon) => null, iconImage);
  }
}

export class AllPokemonLevelIncrementModifierType extends ModifierType {
  constructor(name: string, iconImage?: string) {
    super(name, `Increase all party members' level by 1`, (_type, _args) => new Modifiers.PokemonLevelIncrementModifier(this, -1), iconImage);
  }
}

function getBaseStatBoosterItemName(stat: Stat) {
  switch (stat) {
    case Stat.HP:
      return 'Hp-Up';
    case Stat.ATK:
      return 'Protein';
    case Stat.DEF:
      return 'Iron';
    case Stat.SPATK:
      return 'Calcium';
    case Stat.SPDEF:
      return 'Zinc';
    case Stat.SPD:
      return 'Carbos';
  }
}

export class PokemonBaseStatBoosterModifierType extends PokemonHeldItemModifierType implements GeneratedPersistentModifierType {
  private stat: Stat;

  constructor(name: string, stat: Stat, _iconImage?: string) {
    super(name, `Increases the holder's base ${getStatName(stat)} by 20%`, (_type, args) => new Modifiers.PokemonBaseStatModifier(this, (args[0] as Pokemon).id, this.stat));

    this.stat = stat;
  }

  getPregenArgs(): any[] {
    return [ this.stat ];
  }
}

class AllPokemonFullHpRestoreModifierType extends ModifierType {
  constructor(name: string, description?: string, newModifierFunc?: NewModifierFunc, iconImage?: string) {
    super(name, description || `Restore 100% HP for all Pokémon`, newModifierFunc || ((_type, _args) => new Modifiers.PokemonHpRestoreModifier(this, -1, 0, 100)), iconImage);
  }
}

class AllPokemonFullReviveModifierType extends AllPokemonFullHpRestoreModifierType {
  constructor(name: string, iconImage?: string) {
    super(name, `Revives all fainted Pokémon, restoring 100% HP`, (_type, _args) => new Modifiers.PokemonHpRestoreModifier(this, -1, 0, 100, true), iconImage);
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
    super(`TM${Utils.padInt(Object.keys(tmSpecies).indexOf(moveId.toString()) + 1, 3)} - ${allMoves[moveId].name}`, `Teach ${allMoves[moveId].name} to a Pokémon`, (_type, args) => new Modifiers.TmModifier(this, (args[0] as PlayerPokemon).id),
      (pokemon: PlayerPokemon) => {
        if (pokemon.compatibleTms.indexOf(moveId) === -1 || pokemon.getMoveset().filter(m => m?.moveId === moveId).length)
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

export class EvolutionItemModifierType extends PokemonModifierType implements GeneratedPersistentModifierType {
  public evolutionItem: EvolutionItem;

  constructor(evolutionItem: EvolutionItem) {
    super(getEvolutionItemName(evolutionItem), `Causes certain Pokémon to evolve`, (_type, args) => new Modifiers.EvolutionItemModifier(this, (args[0] as PlayerPokemon).id),
    (pokemon: PlayerPokemon) => {
      if (pokemonEvolutions.hasOwnProperty(pokemon.species.speciesId) && pokemonEvolutions[pokemon.species.speciesId].filter(e => e.item === this.evolutionItem
        && (!e.condition || e.condition.predicate(pokemon))).length)
        return null;

      return PartyUiHandler.NoEffectMessage;
    }, getEvolutionItemName(evolutionItem).replace(/[ \-]/g, '_').toLowerCase());

    this.evolutionItem = evolutionItem;
  }

  getPregenArgs(): any[] {
    return [ this.evolutionItem ];
  }
}

class AttackTypeBoosterModifierTypeGenerator extends ModifierTypeGenerator {
  constructor() {
    super((party: Pokemon[], pregenArgs?: any[]) => {
      if (pregenArgs)
        return new AttackTypeBoosterModifierType(pregenArgs[0] as Type, 20);

      const attackMoveTypes = party.map(p => p.getMoveset().map(m => m.getMove()).filter(m => m instanceof AttackMove).map(m => m.type)).flat();
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
      
      const randInt = Utils.randSeedInt(totalWeight);
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

class TmModifierTypeGenerator extends ModifierTypeGenerator {
  constructor(tier: ModifierTier) {
    super((party: Pokemon[]) => {
      const partyMemberCompatibleTms = party.map(p => (p as PlayerPokemon).compatibleTms);
      const tierUniqueCompatibleTms = partyMemberCompatibleTms.flat().filter(tm => tmPoolTiers[tm] === tier).filter(tm => !allMoves[tm].name.endsWith(' (N)')).filter((tm, i, array) => array.indexOf(tm) === i);
      if (!tierUniqueCompatibleTms.length)
        return null;
      const randTmIndex = Utils.randSeedInt(tierUniqueCompatibleTms.length);
      return new TmModifierType(tierUniqueCompatibleTms[randTmIndex]);
    });
  }
}

class EvolutionItemModifierTypeGenerator extends ModifierTypeGenerator {
  constructor() {
    super((party: Pokemon[], pregenArgs?: any[]) => {
      if (pregenArgs)
        return new EvolutionItemModifierType(pregenArgs[0] as EvolutionItem);

      const evolutionItemPool = party.filter(p => pokemonEvolutions.hasOwnProperty(p.species.speciesId)).map(p => {
        const evolutions = pokemonEvolutions[p.species.speciesId]
        return evolutions.filter(e => e.item !== EvolutionItem.NONE && (!e.condition || e.condition.predicate(p)));
      }).flat().flatMap(e => e.item);

      if (!evolutionItemPool.length)
        return null;

      return new EvolutionItemModifierType(evolutionItemPool[Utils.randSeedInt(evolutionItemPool.length)]);
    });
  }
}

export class ContactHeldItemTransferChanceModifierType extends PokemonHeldItemModifierType {
  constructor(name: string, chancePercent: integer, iconImage?: string, group?: string, soundName?: string) {
    super(name, `On contact, there is a ${chancePercent}% chance the foe's held item will be stolen`, (type, args) => new Modifiers.ContactHeldItemTransferChanceModifier(type, (args[0] as Pokemon).id, chancePercent), iconImage, group, soundName);
  }
}

export class TurnHeldItemTransferModifierType extends PokemonHeldItemModifierType {
  constructor(name: string, iconImage?: string, group?: string, soundName?: string) {
    super(name, 'Every turn, the holder acquires one held item from the foe', (type, args) => new Modifiers.TurnHeldItemTransferModifier(type, (args[0] as Pokemon).id), iconImage, group, soundName);
  }
}

export type ModifierTypeFunc = () => ModifierType;
type WeightedModifierTypeWeightFunc = (party: Pokemon[]) => integer;

class WeightedModifierType {
  public modifierType: ModifierType;
  public weight: integer | WeightedModifierTypeWeightFunc;

  constructor(modifierTypeFunc: ModifierTypeFunc, weight: integer | WeightedModifierTypeWeightFunc) {
    this.modifierType = modifierTypeFunc();
    this.modifierType.id = Object.keys(modifierTypes).find(k => modifierTypes[k] === modifierTypeFunc);
    this.weight = weight;
  }

  setTier(tier: ModifierTier) {
    this.modifierType.setTier(tier);
  }
}

export const modifierTypes = {
  POKEBALL: () => new AddPokeballModifierType(PokeballType.POKEBALL, 5, 'pb'),
  GREAT_BALL: () => new AddPokeballModifierType(PokeballType.GREAT_BALL, 5, 'gb'),
  ULTRA_BALL: () => new AddPokeballModifierType(PokeballType.ULTRA_BALL, 5, 'ub'),
  MASTER_BALL: () => new AddPokeballModifierType(PokeballType.MASTER_BALL, 1, 'mb'),

  RARE_CANDY: () => new PokemonLevelIncrementModifierType('Rare Candy'),
  RARER_CANDY: () => new AllPokemonLevelIncrementModifierType('Rarer Candy'),

  EVOLUTION_ITEM: () => new EvolutionItemModifierTypeGenerator(),

  MAP: () => new ModifierType('Map', 'Allows you to choose your destination at a crossroads', (type, _args) => new Modifiers.MapModifier(type)),

  POTION: () => new PokemonHpRestoreModifierType('Potion', 20, 10),
  SUPER_POTION: () => new PokemonHpRestoreModifierType('Super Potion', 50, 25),
  HYPER_POTION: () => new PokemonHpRestoreModifierType('Hyper Potion', 200, 50),
  MAX_POTION: () => new PokemonHpRestoreModifierType('Max Potion', 100, 100),
  
  REVIVE: () => new PokemonReviveModifierType('Revive', 50),
  MAX_REVIVE: () => new PokemonReviveModifierType('Max Revive', 100),

  FULL_HEAL: () => new PokemonStatusHealModifierType('Full Heal'),

  SACRED_ASH: () => new AllPokemonFullReviveModifierType('Sacred Ash'),

  REVIVER_SEED: () => new PokemonHeldItemModifierType('Reviver Seed', 'Revives the holder for 1/2 HP upon fainting',
    (type, args) => new Modifiers.PokemonInstantReviveModifier(type, (args[0] as Pokemon).id)),

  ETHER: () => new PokemonPpRestoreModifierType('Ether', 10),
  MAX_ETHER: () => new PokemonPpRestoreModifierType('Max Ether', -1),

  ELIXIR: () => new PokemonAllMovePpRestoreModifierType('Elixir', 10),
  MAX_ELIXIR: () => new PokemonAllMovePpRestoreModifierType('Max Elixir', -1),

  LURE: () => new DoubleBattleChanceBoosterModifierType('Lure', 5),
  SUPER_LURE: () => new DoubleBattleChanceBoosterModifierType('Super Lure', 10),
  MAX_LURE: () => new DoubleBattleChanceBoosterModifierType('Max Lure', 25),

  TEMP_STAT_BOOSTER: () => new ModifierTypeGenerator((party: Pokemon[], pregenArgs?: any[]) => {
    if (pregenArgs)
      return new TempBattleStatBoosterModifierType(pregenArgs[0] as TempBattleStat);
    const randTempBattleStat = Utils.randSeedInt(7) as TempBattleStat;
    return new TempBattleStatBoosterModifierType(randTempBattleStat);
  }),

  BASE_STAT_BOOSTER: () => new ModifierTypeGenerator((party: Pokemon[], pregenArgs?: any[]) => {
    if (pregenArgs) {
      const stat = pregenArgs[0] as Stat;
      return new PokemonBaseStatBoosterModifierType(getBaseStatBoosterItemName(stat), stat);
    }
    const randStat = Utils.randSeedInt(6) as Stat;
    return new PokemonBaseStatBoosterModifierType(getBaseStatBoosterItemName(randStat), randStat);
  }),

  ATTACK_TYPE_BOOSTER: () => new AttackTypeBoosterModifierTypeGenerator(),

  BERRY: () => new ModifierTypeGenerator((party: Pokemon[], pregenArgs?: any[]) => {
    if (pregenArgs)
      return new BerryModifierType(pregenArgs[0] as BerryType);
    const berryTypes = Utils.getEnumValues(BerryType);
    let randBerryType: BerryType;
    let rand = Utils.randSeedInt(10);
    if (rand < 2)
      randBerryType = BerryType.SITRUS;
    else if (rand < 4)
      randBerryType = BerryType.LUM;
    else
      randBerryType = berryTypes[Utils.randSeedInt(berryTypes.length - 2) + 2];
    return new BerryModifierType(randBerryType);
  }),

  TM_COMMON: () => new TmModifierTypeGenerator(ModifierTier.COMMON),
  TM_GREAT: () => new TmModifierTypeGenerator(ModifierTier.GREAT),
  TM_ULTRA: () => new TmModifierTypeGenerator(ModifierTier.ULTRA),

  EXP_SHARE: () => new ModifierType('EXP. All', 'Non-participants receive 20% of a single participant\'s EXP. Points',
    (type, _args) => new Modifiers.ExpShareModifier(type), 'exp_share'),
  EXP_BALANCE: () => new ModifierType('EXP. Balance', 'All EXP. Points received from battles are split between the lower leveled party members',
    (type, _args) => new Modifiers.ExpBalanceModifier(type)),

  OVAL_CHARM: () => new ModifierType('Oval Charm', 'When multiple Pokémon participate in a battle, each gets an extra 10% of the total EXP',
    (type, _args) => new Modifiers.MultipleParticipantExpBonusModifier(type)),

  EXP_CHARM: () => new ExpBoosterModifierType('EXP. Charm', 25),
  GOLDEN_EXP_CHARM: () => new ExpBoosterModifierType('Golden EXP. Charm', 75),

  LUCKY_EGG: () => new PokemonExpBoosterModifierType('Lucky Egg', 50),
  GOLDEN_EGG: () => new PokemonExpBoosterModifierType('Golden Egg', 150),

  GRIP_CLAW: () => new ContactHeldItemTransferChanceModifierType('Grip Claw', 10),

  HEALING_CHARM: () => new ModifierType('Healing Charm', 'Increases the effectiveness of HP restoring moves and items by 100% (excludes revives)',
    (type, _args) => new Modifiers.HealingBoosterModifier(type, 2), 'healing_charm'),
  CANDY_JAR: () => new ModifierType('Candy Jar', 'Increases the number of levels added by RARE CANDY items by 1', (type, _args) => new Modifiers.LevelIncrementBoosterModifier(type)),

  BERRY_POUCH: () => new ModifierType('Berry Pouch', 'Adds a 25% chance that a used berry will not be consumed',
    (type, _args) => new Modifiers.PreserveBerryModifier(type)),

  FOCUS_BAND: () => new PokemonHeldItemModifierType('Focus Band', 'Adds a 10% chance to survive with 1 HP after being damaged enough to faint',
    (type, args) => new Modifiers.SurviveDamageModifier(type, (args[0] as Pokemon).id)),

  KINGS_ROCK: () => new PokemonHeldItemModifierType('King\'s Rock', 'Adds a 10% chance an attack move will cause the opponent to flinch',
    (type, args) => new Modifiers.FlinchChanceModifier(type, (args[0] as Pokemon).id)),

  LEFTOVERS: () => new PokemonHeldItemModifierType('Leftovers', 'Heals 1/16 of a Pokémon\'s maximum HP every turn',
    (type, args) => new Modifiers.TurnHealModifier(type, (args[0] as Pokemon).id)),
  SHELL_BELL: () => new PokemonHeldItemModifierType('Shell Bell', 'Heals 1/8 of a Pokémon\'s dealt damage',
    (type, args) => new Modifiers.HitHealModifier(type, (args[0] as Pokemon).id)),

  BATON: () => new PokemonHeldItemModifierType('Baton', 'Allows passing along effects when switching Pokémon, which also bypasses traps',
    (type, args) => new Modifiers.SwitchEffectTransferModifier(type, (args[0] as Pokemon).id), 'stick'),

  SHINY_CHARM: () => new ModifierType('Shiny Charm', 'Dramatically increases the chance of a wild Pokémon being shiny', (type, _args) => new Modifiers.ShinyRateBoosterModifier(type)),

  MINI_BLACK_HOLE: () => new TurnHeldItemTransferModifierType('Mini Black Hole'),
  
  GOLDEN_POKEBALL: () => new ModifierType(`Golden ${getPokeballName(PokeballType.POKEBALL)}`, 'Adds 1 extra item option at the end of every battle',
    (type, _args) => new Modifiers.ExtraModifierModifier(type), 'pb_gold', null, 'pb_bounce_1'),
};

const modifierPool = {
  [ModifierTier.COMMON]: [
    new WeightedModifierType(modifierTypes.POKEBALL, 6),
    new WeightedModifierType(modifierTypes.RARE_CANDY, 2),
    new WeightedModifierType(modifierTypes.POTION, (party: Pokemon[]) => {
      const thresholdPartyMemberCount = Math.min(party.filter(p => p.getInverseHp() >= 10 || p.getHpRatio() <= 0.875).length, 3);
      return thresholdPartyMemberCount * 3;
    }),
    new WeightedModifierType(modifierTypes.SUPER_POTION, (party: Pokemon[]) => {
      const thresholdPartyMemberCount = Math.min(party.filter(p => p.getInverseHp() >= 25 || p.getHpRatio() <= 0.75).length, 3);
      return thresholdPartyMemberCount;
    }),
    new WeightedModifierType(modifierTypes.ETHER, (party: Pokemon[]) => {
      const thresholdPartyMemberCount = Math.min(party.filter(p => p.hp && p.getMoveset().filter(m => (m.getMove().pp - m.ppUsed) <= 5).length).length, 3);
      return thresholdPartyMemberCount * 3;
    }),
    new WeightedModifierType(modifierTypes.MAX_ETHER, (party: Pokemon[]) => {
      const thresholdPartyMemberCount = Math.min(party.filter(p => p.hp && p.getMoveset().filter(m => (m.getMove().pp - m.ppUsed) <= 5).length).length, 3);
      return thresholdPartyMemberCount;
    }),
    new WeightedModifierType(modifierTypes.LURE, 2),
    new WeightedModifierType(modifierTypes.TEMP_STAT_BOOSTER, 4),
    new WeightedModifierType(modifierTypes.BERRY, 2),
    new WeightedModifierType(modifierTypes.TM_COMMON, 1)
  ].map(m => { m.setTier(ModifierTier.COMMON); return m; }),
  [ModifierTier.GREAT]: [
    new WeightedModifierType(modifierTypes.GREAT_BALL, 6),
    new WeightedModifierType(modifierTypes.EVOLUTION_ITEM, 2),
    new WeightedModifierType(modifierTypes.FULL_HEAL, (party: Pokemon[]) => {
      const statusEffectPartyMemberCount = Math.min(party.filter(p => p.hp && !!p.status).length, 3);
      return statusEffectPartyMemberCount * 6;
    }),
    new WeightedModifierType(modifierTypes.REVIVE, (party: Pokemon[]) => {
      const faintedPartyMemberCount = Math.min(party.filter(p => p.isFainted()).length, 3);
      return faintedPartyMemberCount * 9;
    }),
    new WeightedModifierType(modifierTypes.MAX_REVIVE, (party: Pokemon[]) => {
      const faintedPartyMemberCount = Math.min(party.filter(p => p.isFainted()).length, 3);
      return faintedPartyMemberCount * 3;
    }),
    new WeightedModifierType(modifierTypes.SACRED_ASH, (party: Pokemon[]) => {
      return party.filter(p => p.isFainted()).length >= Math.ceil(party.length / 2) ? 1 : 0;
    }),
    new WeightedModifierType(modifierTypes.HYPER_POTION, (party: Pokemon[]) => {
      const thresholdPartyMemberCount = Math.min(party.filter(p => p.getInverseHp() >= 100 || p.getHpRatio() <= 0.625).length, 3);
      return thresholdPartyMemberCount * 3;
    }),
    new WeightedModifierType(modifierTypes.MAX_POTION, (party: Pokemon[]) => {
      const thresholdPartyMemberCount = Math.min(party.filter(p => p.getInverseHp() >= 150 || p.getHpRatio() <= 0.5).length, 3);
      return thresholdPartyMemberCount;
    }),
    new WeightedModifierType(modifierTypes.ELIXIR, (party: Pokemon[]) => {
      const thresholdPartyMemberCount = Math.min(party.filter(p => p.hp && p.getMoveset().filter(m => (m.getMove().pp - m.ppUsed) <= 5).length).length, 3);
      return thresholdPartyMemberCount * 3;
    }),
    new WeightedModifierType(modifierTypes.MAX_ELIXIR, (party: Pokemon[]) => {
      const thresholdPartyMemberCount = Math.min(party.filter(p => p.hp && p.getMoveset().filter(m => (m.getMove().pp - m.ppUsed) <= 5).length).length, 3);
      return thresholdPartyMemberCount;
    }),
    new WeightedModifierType(modifierTypes.SUPER_LURE, 4),
    new WeightedModifierType(modifierTypes.MAP, (party: Pokemon[]) => party[0].scene.gameMode === GameMode.CLASSIC ? 1 : 0),
    new WeightedModifierType(modifierTypes.TM_GREAT, 2),
    new WeightedModifierType(modifierTypes.EXP_SHARE, 1),
    new WeightedModifierType(modifierTypes.BASE_STAT_BOOSTER, 3),
  ].map(m => { m.setTier(ModifierTier.GREAT); return m; }),
  [ModifierTier.ULTRA]: [
    new WeightedModifierType(modifierTypes.ULTRA_BALL, 8),
    new WeightedModifierType(modifierTypes.MAX_LURE, 4),
    new WeightedModifierType(modifierTypes.ATTACK_TYPE_BOOSTER, 4),
    new WeightedModifierType(modifierTypes.TM_ULTRA, 5),
    new WeightedModifierType(modifierTypes.REVIVER_SEED, 3),
    new WeightedModifierType(modifierTypes.CANDY_JAR, 3),
    new WeightedModifierType(modifierTypes.GRIP_CLAW, 2),
    new WeightedModifierType(modifierTypes.HEALING_CHARM, 1),
    new WeightedModifierType(modifierTypes.BATON, 1),
    new WeightedModifierType(modifierTypes.FOCUS_BAND, 3),
    new WeightedModifierType(modifierTypes.KINGS_ROCK, 2),
    new WeightedModifierType(modifierTypes.LEFTOVERS, 2),
    new WeightedModifierType(modifierTypes.SHELL_BELL, 2),
    new WeightedModifierType(modifierTypes.BERRY_POUCH, 3),
    new WeightedModifierType(modifierTypes.EXP_CHARM, 4),
    new WeightedModifierType(modifierTypes.OVAL_CHARM, 2),
    new WeightedModifierType(modifierTypes.EXP_BALANCE, 1),
  ].map(m => { m.setTier(ModifierTier.ULTRA); return m; }),
  [ModifierTier.MASTER]: [
    new WeightedModifierType(modifierTypes.MASTER_BALL, 3),
    new WeightedModifierType(modifierTypes.SHINY_CHARM, 2),
    new WeightedModifierType(modifierTypes.MINI_BLACK_HOLE, (party: Pokemon[]) => party[0].scene.gameData.unlocks[Unlockables.MINI_BLACK_HOLE] ? 1 : 0)
  ].map(m => { m.setTier(ModifierTier.MASTER); return m; }),
  [ModifierTier.LUXURY]: [
    new WeightedModifierType(modifierTypes.GOLDEN_EXP_CHARM, 1),
    new WeightedModifierType(modifierTypes.GOLDEN_POKEBALL, 1),
    new WeightedModifierType(modifierTypes.RARER_CANDY, 1),
  ].map(m => { m.setTier(ModifierTier.LUXURY); return m; }),
};

const wildModifierPool = {
  [ModifierTier.COMMON]: [
    new WeightedModifierType(modifierTypes.BERRY, 1)
  ].map(m => { m.setTier(ModifierTier.COMMON); return m; }),
  [ModifierTier.GREAT]: [
    new WeightedModifierType(modifierTypes.BASE_STAT_BOOSTER, 1)
  ].map(m => { m.setTier(ModifierTier.GREAT); return m; }),
  [ModifierTier.ULTRA]: [
    new WeightedModifierType(modifierTypes.ATTACK_TYPE_BOOSTER, 10),
    new WeightedModifierType(modifierTypes.LUCKY_EGG, 4),
  ].map(m => { m.setTier(ModifierTier.ULTRA); return m; }),
  [ModifierTier.MASTER]: [
    new WeightedModifierType(modifierTypes.GOLDEN_EGG, 1)
  ].map(m => { m.setTier(ModifierTier.MASTER); return m; })
};

const trainerModifierPool = {
  [ModifierTier.COMMON]: [
    new WeightedModifierType(modifierTypes.BERRY, 8),
    new WeightedModifierType(modifierTypes.BASE_STAT_BOOSTER, 3)
  ].map(m => { m.setTier(ModifierTier.COMMON); return m; }),
  [ModifierTier.GREAT]: [
    new WeightedModifierType(modifierTypes.BASE_STAT_BOOSTER, 3),
    new WeightedModifierType(modifierTypes.ATTACK_TYPE_BOOSTER, 1),
  ].map(m => { m.setTier(ModifierTier.GREAT); return m; }),
  [ModifierTier.ULTRA]: [
    new WeightedModifierType(modifierTypes.REVIVER_SEED, 2),
    new WeightedModifierType(modifierTypes.FOCUS_BAND, 2),
    new WeightedModifierType(modifierTypes.LUCKY_EGG, 4),
    new WeightedModifierType(modifierTypes.GRIP_CLAW, 1),
    new WeightedModifierType(modifierTypes.KINGS_ROCK, 1),
    new WeightedModifierType(modifierTypes.LEFTOVERS, 1),
    new WeightedModifierType(modifierTypes.SHELL_BELL, 1),
  ].map(m => { m.setTier(ModifierTier.ULTRA); return m; }),
  [ModifierTier.MASTER]: [
    new WeightedModifierType(modifierTypes.GOLDEN_EGG, 1),
  ].map(m => { m.setTier(ModifierTier.MASTER); return m; })
};

let modifierPoolThresholds = {};
let ignoredPoolIndexes = {};

let enemyModifierPoolThresholds = {};
let enemyIgnoredPoolIndexes = {};

export function regenerateModifierPoolThresholds(party: Pokemon[], poolType: ModifierPoolType) {
  const player = !poolType;
  const pool = player ? modifierPool : poolType === ModifierPoolType.WILD ? wildModifierPool : trainerModifierPool;
  const ignoredIndexes = {};
  const thresholds = Object.fromEntries(new Map(Object.keys(pool).map(t => {
    ignoredIndexes[t] = [];
    const thresholds = new Map();
    let i = 0;
    pool[t].reduce((total: integer, modifierType: WeightedModifierType) => {
      const weightedModifierType = modifierType as WeightedModifierType;
      const existingModifier = party[0].scene.findModifier(m => (m.type.generatorId || m.type.id) === weightedModifierType.modifierType.id);
      const weight = !existingModifier || existingModifier.stackCount < existingModifier.getMaxStackCount()
        ? weightedModifierType.weight instanceof Function
          ? (weightedModifierType.weight as Function)(party)
          : weightedModifierType.weight as integer
        : 0;
      if (weight)
        total += weight;
      else {
        ignoredIndexes[t].push(i++);
        return total;
      }
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

export function getModifierTypeFuncById(id: string): ModifierTypeFunc {
  return modifierTypes[id];
}

export function getPlayerModifierTypeOptionsForWave(waveIndex: integer, count: integer, party: PlayerPokemon[]): ModifierTypeOption[] {
  if (waveIndex % 10 === 0)
    return modifierPool[ModifierTier.LUXURY].filter(m => !(m.weight instanceof Function) || m.weight(party)).map(m => new ModifierTypeOption(m.modifierType, false));
  const options: ModifierTypeOption[] = [];
  const retryCount = Math.min(count * 5, 50);
  new Array(count).fill(0).map(() => {
    let candidate = getNewModifierTypeOption(party, ModifierPoolType.PLAYER);
    let r = 0;
    while (options.length && ++r < retryCount && options.filter(o => o.type.name === candidate.type.name || o.type.group === candidate.type.group).length)
      candidate = getNewModifierTypeOption(party, ModifierPoolType.PLAYER, candidate.type.tier, candidate.upgraded);
    options.push(candidate);
  });
  return options;
}

export function getEnemyModifierTypesForWave(waveIndex: integer, count: integer, party: EnemyPokemon[], poolType: ModifierPoolType.WILD | ModifierPoolType.TRAINER): PokemonHeldItemModifierType[] {
  const ret = new Array(count).fill(0).map(() => getNewModifierTypeOption(party, poolType).type as PokemonHeldItemModifierType);
  if (waveIndex === 200) {
    const miniBlackHole = modifierTypes.MINI_BLACK_HOLE();
    miniBlackHole.id = 'MINI_BLACK_HOLE';
    ret.push(miniBlackHole);
  }
  return ret;
}

function getNewModifierTypeOption(party: Pokemon[], poolType: ModifierPoolType, tier?: ModifierTier, upgrade?: boolean): ModifierTypeOption {
  const player = !poolType;
  if (tier === undefined) {
    const tierValue = Utils.randSeedInt(256);
    if (player && tierValue) {
      const partyShinyCount = party.filter(p => p.shiny).length;
      const upgradeOdds = Math.floor(32 / Math.max((partyShinyCount * 2), 1));
      upgrade = !Utils.randSeedInt(upgradeOdds);
    } else
      upgrade = false;
    tier = (tierValue >= 52 ? ModifierTier.COMMON : tierValue >= 8 ? ModifierTier.GREAT : tierValue >= 1 ? ModifierTier.ULTRA : ModifierTier.MASTER) + (upgrade ? 1 : 0);
  }
  
  const thresholds = Object.keys((player ? modifierPoolThresholds : enemyModifierPoolThresholds)[tier]);
  const totalWeight = parseInt(thresholds[thresholds.length - 1]);
  const value = Utils.randSeedInt(totalWeight);
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
  let modifierType: ModifierType = ((player ? modifierPool : poolType === ModifierPoolType.WILD ? wildModifierPool : trainerModifierPool)[tier][index]).modifierType;
  if (modifierType instanceof ModifierTypeGenerator) {
    modifierType = (modifierType as ModifierTypeGenerator).generateType(party);
    if (modifierType === null) {
      if (player)
        console.log(ModifierTier[tier], upgrade);
      return getNewModifierTypeOption(party, poolType, tier, upgrade);
    }
  }

  console.log(modifierType, !player ? '(enemy)' : '');

  return new ModifierTypeOption(modifierType as ModifierType, upgrade);
}

export function getDefaultModifierTypeForTier(tier: ModifierTier): ModifierType {
  let modifierType: ModifierType | WeightedModifierType = modifierPool[tier][tier !== ModifierTier.LUXURY ? 0 : 2];
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