import * as Modifiers from './modifier';
import { AttackMove, allMoves } from '../data/move';
import { Moves } from "../data/enums/moves";
import { PokeballType, getPokeballCatchMultiplier, getPokeballName } from '../data/pokeball';
import Pokemon, { EnemyPokemon, PlayerPokemon, PokemonMove } from '../field/pokemon';
import { EvolutionItem, SpeciesFriendshipEvolutionCondition, pokemonEvolutions } from '../data/pokemon-evolutions';
import { Stat, getStatName } from '../data/pokemon-stat';
import { tmPoolTiers, tmSpecies } from '../data/tms';
import { Type } from '../data/type';
import PartyUiHandler, { PokemonMoveSelectFilter, PokemonSelectFilter } from '../ui/party-ui-handler';
import * as Utils from '../utils';
import { TempBattleStat, getTempBattleStatBoosterIconName, getTempBattleStatBoosterItemName, getTempBattleStatName } from '../data/temp-battle-stat';
import { BerryType, getBerryEffectDescription, getBerryName } from '../data/berry';
import { Unlockables } from '../system/unlockables';
import { StatusEffect, getStatusEffectDescriptor } from '../data/status-effect';
import { SpeciesFormKey } from '../data/pokemon-species';
import BattleScene from '../battle-scene';
import { VoucherType, getVoucherTypeIcon, getVoucherTypeName } from '../system/voucher';
import { FormChangeItem, SpeciesFormChangeItemTrigger, pokemonFormChanges } from '../data/pokemon-forms';
import { ModifierTier } from './modifier-tier';
import { Nature, getNatureName, getNatureStatMultiplier } from '#app/data/nature';
import i18next, { Localizable } from '#app/plugins/i18n';
import { getModifierTierTextTint } from '#app/ui/text';

const outputModifierData = false;
const useMaxWeightForOutput = false;

type Modifier = Modifiers.Modifier;

export enum ModifierPoolType {
  PLAYER,
  WILD,
  TRAINER,
  ENEMY_BUFF,
  DAILY_STARTER
}

type NewModifierFunc = (type: ModifierType, args: any[]) => Modifier;

export class ModifierType {
  public id: string;
  public generatorId: string;
  public name: string;
  protected description: string;
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

  getDescription(scene: BattleScene): string {
    return this.description;
  }

  setDescription(description: string): void {
    this.description = description;
  }

  setTier(tier: ModifierTier): void {
    this.tier = tier;
  }

  getOrInferTier(poolType: ModifierPoolType = ModifierPoolType.PLAYER): ModifierTier {
    if (this.tier)
      return this.tier;
    if (!this.id)
      return null;
    let poolTypes: ModifierPoolType[];
    switch (poolType) {
      case ModifierPoolType.PLAYER:
        poolTypes = [ poolType, ModifierPoolType.TRAINER, ModifierPoolType.WILD ];
        break;
      case ModifierPoolType.WILD:
        poolTypes = [ poolType, ModifierPoolType.PLAYER, ModifierPoolType.TRAINER ];
        break;
      case ModifierPoolType.TRAINER:
        poolTypes = [ poolType, ModifierPoolType.PLAYER, ModifierPoolType.WILD ];
        break;
      default:
        poolTypes = [ poolType ];
        break;
    }
    // Try multiple pool types in case of stolen items
    for (let type of poolTypes) {
      const pool = getModifierPoolForType(type);
      for (let tier of Utils.getEnumValues(ModifierTier)) {
        if (!pool.hasOwnProperty(tier))
          continue;
        if (pool[tier].find(m => (m as WeightedModifierType).modifierType.id === (this.generatorId || this.id)))
          return (this.tier = tier);
      }
    }
    return null;
  }

  withIdFromFunc(func: ModifierTypeFunc): ModifierType {
    this.id = Object.keys(modifierTypes).find(k => modifierTypes[k] === func);
    return this;
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

class AddPokeballModifierType extends ModifierType implements Localizable {
  private pokeballType: PokeballType;
  private count: integer;

  constructor(pokeballType: PokeballType, count: integer, iconImage?: string) {
    super('', '', (_type, _args) => new Modifiers.AddPokeballModifier(this, pokeballType, count), iconImage, 'pb', 'pb_bounce_1');
    this.pokeballType = pokeballType;
    this.count = count;
  }

  localize(): void {
    this.name = `${this.count}x ${getPokeballName(this.pokeballType)}`;
    this.description = `${i18next.t("modifier:recieveModifier", { modifier: getPokeballName(this.pokeballType), amount: this.count.toString() })}\n${i18next.t("modifier:catchRate", { multiplier: getPokeballCatchMultiplier(this.pokeballType) > -1 ? `${getPokeballCatchMultiplier(this.pokeballType)}x` : '100%' })}`;
  }
}

class AddVoucherModifierType extends ModifierType {
  private voucherType: VoucherType;
  private count: integer;
  constructor(voucherType: VoucherType, count: integer) {
    super('', '',
      (_type, _args) => new Modifiers.AddVoucherModifier(this, voucherType, count), getVoucherTypeIcon(voucherType), 'voucher');
    this.voucherType = voucherType;
    this.count = count;
  }
  localize(): void {
    this.name = `${this.count}x ${getVoucherTypeName(this.voucherType)}`;
    this.description = i18next.t('modifier:recieveModifier', { modifier: getVoucherTypeName(this.voucherType), amount: this.count.toString() });
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
    super(name, description, newModifierFunc, (pokemon: PlayerPokemon) => {
      const dummyModifier = this.newModifier(pokemon);
      const matchingModifier = pokemon.scene.findModifier(m => m instanceof Modifiers.PokemonHeldItemModifier && m.pokemonId === pokemon.id && m.matchType(dummyModifier)) as Modifiers.PokemonHeldItemModifier;
      const maxStackCount = dummyModifier.getMaxStackCount(pokemon.scene);
      if (!maxStackCount)
        return `${pokemon.name} can\'t take\nthis item!`;
      if (matchingModifier && matchingModifier.stackCount === maxStackCount)
        return `${pokemon.name} has too many\nof this item!`;
      return null;
    }, iconImage, group, soundName);
  }
  localize(): void {
    this.name = i18next.t(`modifierType:${this.name}.name`);
    this.description = i18next.t(`modifierType:${this.id}.description`);
  }

  newModifier(...args: any[]): Modifiers.PokemonHeldItemModifier {
    return super.newModifier(...args) as Modifiers.PokemonHeldItemModifier;
  }
}

export class PokemonHpRestoreModifierType extends PokemonModifierType {
  protected restorePoints: integer;
  protected restorePercent: integer;
  protected healStatus: boolean;

  constructor(name: string, restorePoints: integer, restorePercent: integer, healStatus: boolean = false, newModifierFunc?: NewModifierFunc, selectFilter?: PokemonSelectFilter, iconImage?: string, group?: string) {
    super(name, '',
      newModifierFunc || ((_type, args) => new Modifiers.PokemonHpRestoreModifier(this, (args[0] as PlayerPokemon).id, this.restorePoints, this.restorePercent, this.healStatus, false)),
    selectFilter || ((pokemon: PlayerPokemon) => {
      if (!pokemon.hp || (pokemon.hp >= pokemon.getMaxHp() && (!this.healStatus || !pokemon.status)))
        return PartyUiHandler.NoEffectMessage;
      return null;
    }), iconImage, group || 'potion');


    this.restorePoints = restorePoints;
    this.restorePercent = restorePercent;
    this.healStatus = healStatus;
    this.localize();
  }

  localize(): void {

    this.description = this.restorePoints ? i18next.t("modifier:hpRestore", { restorePoints: this.restorePoints, restorePercent: this.restorePercent }) : (this.healStatus ? i18next.t("modifierType:FULL_RESTORE.description") : i18next.t("modifierType:MAX_POTION.description"));

  }
}

export class PokemonReviveModifierType extends PokemonHpRestoreModifierType {
  constructor(name: string, restorePercent: integer, iconImage?: string) {
    super(name, 0, restorePercent, false, (_type, args) => new Modifiers.PokemonHpRestoreModifier(this, (args[0] as PlayerPokemon).id, 0, this.restorePercent, false, true),
      ((pokemon: PlayerPokemon) => {
        if (!pokemon.isFainted())
          return PartyUiHandler.NoEffectMessage;
        return null;
      }), iconImage, 'revive');
    this.restorePercent = restorePercent;
    this.localize()
    this.selectFilter = (pokemon: PlayerPokemon) => {
      if (pokemon.hp)
        return PartyUiHandler.NoEffectMessage;
      return null;
    };
  }

  localize(): void {
    this.description =  i18next.t("modifier:revive", { restorePercent: this.restorePercent });
  }
}

export class PokemonStatusHealModifierType extends PokemonModifierType {
  constructor(name: string) {
    super(name, '',
      ((_type, args) => new Modifiers.PokemonStatusHealModifier(this, (args[0] as PlayerPokemon).id)),
      ((pokemon: PlayerPokemon) => {
        if (!pokemon.hp || !pokemon.status)
          return PartyUiHandler.NoEffectMessage;
        return null;
      }), 'full_heal');
      this.localize();
  }
  localize(): void {
    this.description = i18next.t("modifierType:FULL_HEAL.description");
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
    super(name, '', (_type, args) => new Modifiers.PokemonPpRestoreModifier(this, (args[0] as PlayerPokemon).id, (args[1] as integer), this.restorePoints),
      (_pokemon: PlayerPokemon) => {
      return null;
    }, (pokemonMove: PokemonMove) => {
      if (!pokemonMove.ppUsed)
        return PartyUiHandler.NoEffectMessage;
      return null;
    }, iconImage, 'ether');
    
    this.restorePoints = restorePoints;
    this.localize()
  }

  localize(): void {
    if (this.restorePoints > -1)
      this.description = i18next.t("modifier:ppRestore", { restorePoints: this.restorePoints });
    else
      this.description = i18next.t("modifierType:MAX_ETHER.description");
  }
}

export class PokemonAllMovePpRestoreModifierType extends PokemonModifierType {
  protected restorePoints: integer;

  constructor(name: string, restorePoints: integer, iconImage?: string) {
    super(name, '', (_type, args) => new Modifiers.PokemonAllMovePpRestoreModifier(this, (args[0] as PlayerPokemon).id, this.restorePoints),
      (pokemon: PlayerPokemon) => {
        if (!pokemon.getMoveset().filter(m => m.ppUsed).length)
          return PartyUiHandler.NoEffectMessage;
        return null;
      }, iconImage, 'elixir');

    this.restorePoints = restorePoints;
    this.localize();
  }

  localize(): void {
    if (this.restorePoints > -1)
      this.description = i18next.t("modifier:ppRestoreAll", { restorePoints: this.restorePoints });
    else
      this.description = i18next.t("modifierType:MAX_ELIXIR.description");
  }
}

export class PokemonPpUpModifierType extends PokemonMoveModifierType {
  protected upPoints: integer;

  constructor(name: string, upPoints: integer, iconImage?: string) {
    super(name, `Permanently increases PP for one Pokémon move by ${upPoints} for every 5 maximum PP (maximum 3)`, (_type, args) => new Modifiers.PokemonPpUpModifier(this, (args[0] as PlayerPokemon).id, (args[1] as integer), this.upPoints),
      (_pokemon: PlayerPokemon) => {
      return null;
    }, (pokemonMove: PokemonMove) => {
      if (pokemonMove.getMove().pp < 5 || pokemonMove.ppUp >= 3)
        return PartyUiHandler.NoEffectMessage;
      return null;
    }, iconImage, 'ppUp');

    this.upPoints = upPoints;
  }
  localize(): void {
    this.description = i18next.t("modifier:ppUp", { upPoints: this.upPoints });
  }
}

export class PokemonNatureChangeModifierType extends PokemonModifierType {
  protected nature: Nature;

  constructor(nature: Nature) {
    super(`${i18next.t("modifierType:MINT.name",{ nature: getNatureName(nature) })}`, i18next.t("modifier:mint", { nature:getNatureName(nature, true, true, true) }), ((_type, args) => new Modifiers.PokemonNatureChangeModifier(this, (args[0] as PlayerPokemon).id, this.nature)),
      ((pokemon: PlayerPokemon) => {
        if (pokemon.getNature() === this.nature)
          return PartyUiHandler.NoEffectMessage;
        return null;
      }), `mint_${Utils.getEnumKeys(Stat).find(s => getNatureStatMultiplier(nature, Stat[s]) > 1)?.toLowerCase() || 'neutral' }`, 'mint');

    this.nature = nature;
  }
}

export class RememberMoveModifierType extends PokemonModifierType {
  constructor(name: string, description: string, iconImage?: string, group?: string) {
    super(name, description, (type, args) => new Modifiers.RememberMoveModifier(type, (args[0] as PlayerPokemon).id, (args[1] as integer)),
      (pokemon: PlayerPokemon) => {
        if (!pokemon.getLearnableLevelMoves().length)
          return PartyUiHandler.NoEffectMessage;
        return null;
      }, iconImage, group);
  }
}

export class DoubleBattleChanceBoosterModifierType extends ModifierType {
  public battleCount: integer;

  constructor(name: string, battleCount: integer, iconImage?: string) {
    super(name, `Doubles the chance of an encounter being a double battle for ${battleCount} battles`, (_type, _args) => new Modifiers.DoubleBattleChanceBoosterModifier(this, this.battleCount),
      iconImage, 'lure');

    this.battleCount = battleCount;
  }

  localize(): void {
    this.description = i18next.t("modifier:lure", { battleCount: this.battleCount });
  }
}

export class TempBattleStatBoosterModifierType extends ModifierType implements GeneratedPersistentModifierType {
  public tempBattleStat: TempBattleStat;

  constructor(tempBattleStat: TempBattleStat) {
    super(getTempBattleStatBoosterItemName(tempBattleStat),
      i18next.t('modifier:tempBattleStatBoost', { tempBattleStat: getTempBattleStatName(tempBattleStat) }),
      (_type, _args) => new Modifiers.TempBattleStatBoosterModifier(this, this.tempBattleStat),
      getTempBattleStatBoosterIconName(tempBattleStat));

    this.tempBattleStat = tempBattleStat;
  }

  getPregenArgs(): any[] {
    return [ this.tempBattleStat ];
  }
}

export class BerryModifierType extends PokemonHeldItemModifierType implements GeneratedPersistentModifierType {
  private berryType: BerryType;

  constructor(berryType: BerryType) {
    super(`${i18next.t("modifierType:BERRY.name", { berry: i18next.t(`berry:${getBerryName(berryType)}`)})}`, getBerryEffectDescription(berryType),
      (type, args) => new Modifiers.BerryModifier(type, (args[0] as Pokemon).id, berryType),
      `${BerryType[berryType].toLowerCase()}_berry`, 'berry');
    
    this.berryType = berryType;
  }

  getPregenArgs(): any[] {
    return [ this.berryType ];
  }
}

function getAttackTypeBoosterItemName(type: Type) {
  switch (type) {
    case Type.NORMAL:
      return i18next.t('modifierType:SILK_SCARF.name');
    case Type.FIGHTING:
      return i18next.t('modifierType:BLACK_BELT.name');
    case Type.FLYING:
      return i18next.t('modifierType:SHARP_BEAK.name');
    case Type.POISON:
      return i18next.t('modifierType:POISON_BARB.name');
    case Type.GROUND:
      return i18next.t('modifierType:SOFT_SAND.name');
    case Type.ROCK:
      return i18next.t('modifierType:HARD_STONE.name');
    case Type.BUG:
      return i18next.t('modifierType:SILVER_POWER.name');
    case Type.GHOST:
      return i18next.t('modifierType:SPELL_TAG.name');
    case Type.STEEL:
      return i18next.t('modifierType:METAL_COAT.name');
    case Type.FIRE:
      return i18next.t('modifierType:CHARCOAL.name');
    case Type.WATER:
      return i18next.t('modifierType:MYSTIC_WATER.name');
    case Type.GRASS:
      return i18next.t('modifierType:MIRACLE_SEED.name');
    case Type.ELECTRIC:
      return i18next.t('modifierType:MAGNET.name');
    case Type.PSYCHIC:
      return i18next.t('modifierType:TWISTED_SPOON.name');
    case Type.ICE:
      return i18next.t('modifierType:NEVER_MELT_ICE.name');
    case Type.DRAGON:
      return i18next.t('modifierType:DRAGON_FANG.name');
    case Type.DARK:
      return i18next.t('modifierType:BLACK_GLASSES.name');
    case Type.FAIRY:
      return i18next.t('modifierType:FAIRY_FEATHER.name');
  }
}

function getAttackTypeBoosterItemIconName(type: Type) {
  switch (type) {
    case Type.NORMAL:
      return 'silk_scarf';
    case Type.FIGHTING:
      return 'black_belt';
    case Type.FLYING:
      return 'sharp_beak';
    case Type.POISON:
      return 'poison_barb';
    case Type.GROUND:
      return 'soft_sand';
    case Type.ROCK:
      return 'hard_stone';
    case Type.BUG:
      return 'silver_powder';
    case Type.GHOST:
      return 'spell_tag';
    case Type.STEEL:
      return 'metal_coat';
    case Type.FIRE:
      return 'charcoal';
    case Type.WATER:
      return 'mystic_water';
    case Type.GRASS:
      return 'miracle_seed';
    case Type.ELECTRIC:
      return 'magnet';
    case Type.PSYCHIC:
      return 'twisted_spoon';
    case Type.ICE:
      return 'never_melt_ice';
    case Type.DRAGON:
      return 'dragon_fang';
    case Type.DARK:
      return 'black_glasses';
    case Type.FAIRY:
      return 'fairy_feather';
  }
}

export class AttackTypeBoosterModifierType extends PokemonHeldItemModifierType implements GeneratedPersistentModifierType {
  public moveType: Type;
  public boostPercent: integer;

  constructor(moveType: Type, boostPercent: integer) {
    super(getAttackTypeBoosterItemName(moveType), i18next.t("modifier:atkTypeBooster", {type: i18next.t(`type:${Utils.toReadableString(Type[moveType]).toLowerCase()}`)}),
      (_type, args) => new Modifiers.AttackTypeBoosterModifier(this, (args[0] as Pokemon).id, moveType, boostPercent),
      getAttackTypeBoosterItemIconName(moveType));

    this.moveType = moveType;
    this.boostPercent = boostPercent;
  }

  getPregenArgs(): any[] {
    return [ this.moveType ];
  }
}

export class PokemonLevelIncrementModifierType extends PokemonModifierType {
  constructor(name: string, iconImage?: string) {
    super(name, '', (_type, args) => new Modifiers.PokemonLevelIncrementModifier(this, (args[0] as PlayerPokemon).id),
      (_pokemon: PlayerPokemon) => null, iconImage);
  }

  localize(): void {
    this.description = i18next.t("modifierType:RARE_CANDY.description");
  }
}

export class AllPokemonLevelIncrementModifierType extends ModifierType {
  constructor(name: string, iconImage?: string) {
    super(name, '', (_type, _args) => new Modifiers.PokemonLevelIncrementModifier(this, -1), iconImage);
  }
  
  localize(): void {
    this.description = i18next.t("modifierType:RARER_CANDY.description");
  }
}

function getBaseStatBoosterItemName(stat: Stat) {
  switch (stat) {
    case Stat.HP:
      return i18next.t('modifierType:HP_UP.name');
    case Stat.ATK:
      return i18next.t('modifierType:PROTEIN.name');
    case Stat.DEF:
      return i18next.t('modifierType:IRON.name');
    case Stat.SPATK:
      return i18next.t('modifierType:CALCIUM.name');
    case Stat.SPDEF:
      return i18next.t('modifierType:ZINC.name');
    case Stat.SPD:
      return i18next.t('modifierType:CARBOS.name');
  }
}

function getBaseStatBoosterID(stat: Stat) {
  switch (stat) {
    case Stat.HP:
      return 'HP_UP';
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

export class PokemonBaseStatBoosterModifierType extends PokemonHeldItemModifierType implements GeneratedPersistentModifierType {
  private stat: Stat;

  constructor(name: string, stat: Stat, _iconImage?: string) {
    super(name, i18next.t("modifier:baseStatBoost", { stat: getStatName(stat)}), (_type, args) => new Modifiers.PokemonBaseStatModifier(this, (args[0] as Pokemon).id, this.stat), getBaseStatBoosterID(stat).toLowerCase());

    this.stat = stat;
  }

  getPregenArgs(): any[] {
    return [ this.stat ];
  }
}

class AllPokemonFullHpRestoreModifierType extends ModifierType {
  constructor(name: string, description?: string, newModifierFunc?: NewModifierFunc, iconImage?: string) {
    super(name, description || '', newModifierFunc || ((_type, _args) => new Modifiers.PokemonHpRestoreModifier(this, -1, 0, 100, false)), iconImage);
  }
  localize(): void {
    this.description = i18next.t("modifierType:SACRED_ASH.description");
  }
}

class AllPokemonFullReviveModifierType extends AllPokemonFullHpRestoreModifierType {
  constructor(name: string, iconImage?: string) {
    super(name, '', (_type, _args) => new Modifiers.PokemonHpRestoreModifier(this, -1, 0, 100, false, true), iconImage);
    this.localize();
  }
  localize(): void {
    this.description = i18next.t("modifierType:SACRED_ASH.description");
  }
}

export class MoneyRewardModifierType extends ModifierType {
  private moneyMultiplier: number;
  private moneyMultiplierDescriptor: string;

  constructor(name: string, moneyMultiplier: number, moneyMultiplierDescriptor: string, iconImage?: string) {
    super(name, ``, (_type, _args) => new Modifiers.MoneyRewardModifier(this, moneyMultiplier), iconImage, 'money', 'buy');

    this.moneyMultiplier = moneyMultiplier;
    this.moneyMultiplierDescriptor = moneyMultiplierDescriptor;
    this.localize();
  }

  localize(): void {
    this.name = `${i18next.t(`modifierType:${this.name}.name`)}`;
    this.description = i18next.t("modifier:moneyReward", { moneyMultiplierDescriptor: i18next.t(`modifier:${this.moneyMultiplierDescriptor}`) });
  }

  getDescription(scene: BattleScene): string {
    return this.description.replace('{AMOUNT}', scene.getWaveMoneyAmount(this.moneyMultiplier).toLocaleString('en-US'));
  }
}

export class ExpBoosterModifierType extends ModifierType {
  private boostPercent: integer;
  constructor(name: string, boostPercent: integer, iconImage?: string) {
    super(name, ``, () => new Modifiers.ExpBoosterModifier(this, boostPercent), iconImage);
    this.boostPercent = boostPercent;
    this.localize();
  }

  localize(): void {
    this.name = `${i18next.t(`modifierType:${this.name}.name`)}`;
    this.description = `${i18next.t("modifier:expCharm", { boostPercent: this.boostPercent })}`;
  }

}

export class PokemonExpBoosterModifierType extends PokemonHeldItemModifierType {
  private boostPercent: integer;
  constructor(name: string, boostPercent: integer, iconImage?: string) {
    super(name, `${i18next.t("modifier:expEgg", { boostPercent })}`, (_type, args) => new Modifiers.PokemonExpBoosterModifier(this, (args[0] as Pokemon).id, boostPercent),
      iconImage);
    this.boostPercent = boostPercent;
    this.name = name;
    this.localize();
  }
  localize(): void {
    this.name = i18next.t(`modifierType:${this.name}.name`);
    this.description = i18next.t("modifier:expEgg", { boostPercent: this.boostPercent });
  
  }
}

export class PokemonFriendshipBoosterModifierType extends PokemonHeldItemModifierType {
  constructor(name: string, iconImage?: string) {
    super(name,`${i18next.t("modifierType:SOOTHE_BELL.description")}`, (_type, args) => new Modifiers.PokemonFriendshipBoosterModifier(this, (args[0] as Pokemon).id), iconImage);
  }
}

export class PokemonMoveAccuracyBoosterModifierType extends PokemonHeldItemModifierType {
  private amount: integer;
  constructor(name: string, amount: integer, iconImage?: string, group?: string, soundName?: string) {
    super(name, '', (_type, args) => new Modifiers.PokemonMoveAccuracyBoosterModifier(this, (args[0] as Pokemon).id, amount), iconImage, group, soundName);
    this.amount = amount;
  }
  localize(): void {
    this.description = i18next.t("modifier:moveAccuracyBooster", { amount: this.amount });
  
  }
}

export class PokemonMultiHitModifierType extends PokemonHeldItemModifierType {
  constructor(name: string, iconImage?: string) {
    super(name, '', (type, args) => new Modifiers.PokemonMultiHitModifier(type as PokemonMultiHitModifierType, (args[0] as Pokemon).id), iconImage);
    
  }
  localize(): void {
    this.description = i18next.t("modifier:multiHit");
  }
}

export class TmModifierType extends PokemonModifierType {
  public moveId: Moves;

  constructor(moveId: Moves) {
    super(`TM${Utils.padInt(Object.keys(tmSpecies).indexOf(moveId.toString()) + 1, 3)} - ${allMoves[moveId].name}`, `${i18next.t("modifier:tm", {move:allMoves[moveId].name })}`, (_type, args) => new Modifiers.TmModifier(this, (args[0] as PlayerPokemon).id),
      (pokemon: PlayerPokemon) => {
        if (pokemon.compatibleTms.indexOf(moveId) === -1 || pokemon.getMoveset().filter(m => m?.moveId === moveId).length)
          return PartyUiHandler.NoEffectMessage;
        return null;
      }, `tm_${Type[allMoves[moveId].type].toLowerCase()}`, 'tm');

    this.moveId = moveId;
  }
}

export class EvolutionItemModifierType extends PokemonModifierType implements GeneratedPersistentModifierType {
  public evolutionItem: EvolutionItem;

  constructor(evolutionItem: EvolutionItem) {
    super('', '', (_type, args) => new Modifiers.EvolutionItemModifier(this, (args[0] as PlayerPokemon).id),
    (pokemon: PlayerPokemon) => {
      if (pokemonEvolutions.hasOwnProperty(pokemon.species.speciesId) && pokemonEvolutions[pokemon.species.speciesId].filter(e => e.item === this.evolutionItem
        && (!e.condition || e.condition.predicate(pokemon))).length)
        return null;
      else if (pokemon.isFusion() && pokemonEvolutions.hasOwnProperty(pokemon.fusionSpecies.speciesId) && pokemonEvolutions[pokemon.fusionSpecies.speciesId].filter(e => e.item === this.evolutionItem
        && (!e.condition || e.condition.predicate(pokemon))).length)
        return null;

      return PartyUiHandler.NoEffectMessage;
    }, EvolutionItem[evolutionItem].toLowerCase());

    this.evolutionItem = evolutionItem;
    this.localize();
  }

  localize(): void {
    this.name = i18next.t(`modifierType:${EvolutionItem[this.evolutionItem]}.name`);
    this.description = i18next.t("modifier:evolve");
  }

  getPregenArgs(): any[] {
    return [ this.evolutionItem ];
  }
}

export class FormChangeItemModifierType extends PokemonModifierType implements GeneratedPersistentModifierType {
  public formChangeItem: FormChangeItem;

  constructor(formChangeItem: FormChangeItem) {
    super('', '', (_type, args) => new Modifiers.PokemonFormChangeItemModifier(this, (args[0] as PlayerPokemon).id, formChangeItem, true),
    (pokemon: PlayerPokemon) => {
      if (pokemonFormChanges.hasOwnProperty(pokemon.species.speciesId) && !!pokemonFormChanges[pokemon.species.speciesId].find(fc => fc.trigger.hasTriggerType(SpeciesFormChangeItemTrigger)
        && (fc.trigger as SpeciesFormChangeItemTrigger).item === this.formChangeItem))
        return null;

      return PartyUiHandler.NoEffectMessage;
    }, FormChangeItem[formChangeItem].toLowerCase());

    this.formChangeItem = formChangeItem;
    this.localize();
  }

  localize(): void {
    this.name = i18next.t(`modifierType:${FormChangeItem[this.formChangeItem]}.name`);
    this.description = i18next.t("modifier:formChange");
  }
  getPregenArgs(): any[] {
    return [ this.formChangeItem ];
  }
}

export class FusePokemonModifierType extends PokemonModifierType {
  constructor(name: string, iconImage?: string) {
    super(name, `${i18next.t("modifier:fusePokemon")}`, (_type, args) => new Modifiers.FusePokemonModifier(this, (args[0] as PlayerPokemon).id, (args[1] as PlayerPokemon).id),
      (pokemon: PlayerPokemon) => {
        if (pokemon.isFusion())
          return PartyUiHandler.NoEffectMessage;
        return null;
      }, iconImage);
  }
  localize(): void {
    this.description = i18next.t("modifier:fusePokemon");
  }
}

class AttackTypeBoosterModifierTypeGenerator extends ModifierTypeGenerator {
  constructor() {
    super((party: Pokemon[], pregenArgs?: any[]) => {
      if (pregenArgs)
        return new AttackTypeBoosterModifierType(pregenArgs[0] as Type, 20);

      const attackMoveTypes = party.map(p => p.getMoveset().map(m => m.getMove()).filter(m => m instanceof AttackMove).map(m => m.type)).flat();
      if (!attackMoveTypes.length)
        return null;

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
      const partyMemberCompatibleTms = party.map(p => (p as PlayerPokemon).compatibleTms.filter(tm => !p.moveset.find(m => m.moveId === tm)));
      const tierUniqueCompatibleTms = partyMemberCompatibleTms.flat().filter(tm => tmPoolTiers[tm] === tier).filter(tm => !allMoves[tm].name.endsWith(' (N)')).filter((tm, i, array) => array.indexOf(tm) === i);
      if (!tierUniqueCompatibleTms.length)
        return null;
      const randTmIndex = Utils.randSeedInt(tierUniqueCompatibleTms.length);
      return new TmModifierType(tierUniqueCompatibleTms[randTmIndex]);
    });
  }
}

class EvolutionItemModifierTypeGenerator extends ModifierTypeGenerator {
  constructor(rare: boolean) {
    super((party: Pokemon[], pregenArgs?: any[]) => {
      if (pregenArgs)
        return new EvolutionItemModifierType(pregenArgs[0] as EvolutionItem);

      const evolutionItemPool = [
        party.filter(p => pokemonEvolutions.hasOwnProperty(p.species.speciesId)).map(p => {
          const evolutions = pokemonEvolutions[p.species.speciesId];
          return evolutions.filter(e => e.item !== EvolutionItem.NONE && (e.evoFormKey === null || (e.preFormKey || '') === p.getFormKey()) && (!e.condition || e.condition.predicate(p)));
        }).flat(),
        party.filter(p => p.isFusion() && pokemonEvolutions.hasOwnProperty(p.fusionSpecies.speciesId)).map(p => {
          const evolutions = pokemonEvolutions[p.fusionSpecies.speciesId];
          return evolutions.filter(e => e.item !== EvolutionItem.NONE && (e.evoFormKey === null || (e.preFormKey || '') === p.getFusionFormKey()) && (!e.condition || e.condition.predicate(p)));
        }).flat()
      ].flat().flatMap(e => e.item).filter(i => (i > 50) === rare);

      if (!evolutionItemPool.length)
        return null;

      return new EvolutionItemModifierType(evolutionItemPool[Utils.randSeedInt(evolutionItemPool.length)]);
    });
  }
}

class FormChangeItemModifierTypeGenerator extends ModifierTypeGenerator {
  constructor() {
    super((party: Pokemon[], pregenArgs?: any[]) => {
      if (pregenArgs)
        return new FormChangeItemModifierType(pregenArgs[0] as FormChangeItem);

      const formChangeItemPool = party.filter(p => pokemonFormChanges.hasOwnProperty(p.species.speciesId)).map(p => {
        const formChanges = pokemonFormChanges[p.species.speciesId];
        return formChanges.filter(fc => ((fc.formKey.indexOf(SpeciesFormKey.MEGA) === -1 && fc.formKey.indexOf(SpeciesFormKey.PRIMAL) === -1) || party[0].scene.getModifiers(Modifiers.MegaEvolutionAccessModifier).length)
          && ((fc.formKey.indexOf(SpeciesFormKey.GIGANTAMAX) === -1 && fc.formKey.indexOf(SpeciesFormKey.ETERNAMAX) === -1) || party[0].scene.getModifiers(Modifiers.GigantamaxAccessModifier).length))
          .map(fc => fc.findTrigger(SpeciesFormChangeItemTrigger) as SpeciesFormChangeItemTrigger)
          .filter(t => t && t.active && !p.scene.findModifier(m => m instanceof Modifiers.PokemonFormChangeItemModifier && m.pokemonId === p.id && m.formChangeItem === t.item));
      }).flat().flatMap(fc => fc.item);

      if (!formChangeItemPool.length)
        return null;

      return new FormChangeItemModifierType(formChangeItemPool[Utils.randSeedInt(formChangeItemPool.length)]);
    });
  }
}

export class TerastallizeModifierType extends PokemonHeldItemModifierType implements GeneratedPersistentModifierType {
  private teraType: Type;

  constructor(teraType: Type) {
    super(`${i18next.t("modifierType:TERA_SHARD.name", { type: i18next.t(`type:${Utils.toReadableString(Type[teraType])}`)})}`, `${i18next.t("modifier:tera", { type: i18next.t(`type:${Utils.toReadableString(Type[teraType]).toLocaleLowerCase()}`)})}`, (type, args) => new Modifiers.TerastallizeModifier(type as TerastallizeModifierType, (args[0] as Pokemon).id, teraType), `${Utils.toReadableString(Type[teraType]).toLocaleLowerCase()}_tera_shard`, 'tera_shard');

    this.teraType = teraType;
  }

  getPregenArgs(): any[] {
    return [ this.teraType ];
  }
}

export class ContactHeldItemTransferChanceModifierType extends PokemonHeldItemModifierType {
  private chancePercent: integer;
  constructor(name: string, chancePercent: integer, iconImage?: string, group?: string, soundName?: string) {
    super(name, '', (type, args) => new Modifiers.ContactHeldItemTransferChanceModifier(type, (args[0] as Pokemon).id, chancePercent), iconImage, group, soundName);
    this.chancePercent = chancePercent;
    this.localize();
  }
  localize(): void {
    this.description = i18next.t("modifier:contactItemTransfer", { chancePercent: this.chancePercent });
  }
}

export class TurnHeldItemTransferModifierType extends PokemonHeldItemModifierType {
  constructor(name: string, iconImage?: string, group?: string, soundName?: string) {
    super(name, `${i18next.t("modifier:heldItemTransfer")}`, (type, args) => new Modifiers.TurnHeldItemTransferModifier(type, (args[0] as Pokemon).id), iconImage, group, soundName);
  }
  localize(): void {
    this.description = i18next.t("modifier:heldItemTransfer");
  
  }
}

export class EnemyAttackStatusEffectChanceModifierType extends ModifierType {
  private chancePercent: integer;
  private effect: StatusEffect;
  constructor(name: string, chancePercent: integer, effect: StatusEffect, iconImage?: string) {
    super(name, `${i18next.t("modifier:attackStatusEffect", { chancePercent: chancePercent , effect: getStatusEffectDescriptor(effect) })}`, (type, args) => new Modifiers.EnemyAttackStatusEffectChanceModifier(type, effect, chancePercent), iconImage, 'enemy_status_chance')
    this.chancePercent = chancePercent;
    this.effect = effect;
  }
  localize(): void {
    this.description = i18next.t("modifier:attackStatusEffect", { chancePercent: this.chancePercent , effect: getStatusEffectDescriptor(this.effect) });
  }
}

export class EnemyEndureChanceModifierType extends ModifierType {
  private chancePercent: integer;
  constructor(name: string, chancePercent: number, iconImage?: string) {
    super(name, `${i18next.t("modifier:endureChance", { chancePercent })}`, (type, _args) => new Modifiers.EnemyEndureChanceModifier(type, chancePercent), iconImage, 'enemy_endure');
    this.chancePercent = chancePercent;
  }
  localize(): void {
    this.description = i18next.t("modifier:endureChance", { chancePercent: this.chancePercent });
  }
}

export type ModifierTypeFunc = () => ModifierType;
type WeightedModifierTypeWeightFunc = (party: Pokemon[], rerollCount?: integer) => integer;

class WeightedModifierType {
  public modifierType: ModifierType;
  public weight: integer | WeightedModifierTypeWeightFunc;
  public maxWeight: integer;

  constructor(modifierTypeFunc: ModifierTypeFunc, weight: integer | WeightedModifierTypeWeightFunc, maxWeight?: integer) {
    this.modifierType = modifierTypeFunc();
    this.modifierType.id = Object.keys(modifierTypes).find(k => modifierTypes[k] === modifierTypeFunc);
    this.weight = weight;
    this.maxWeight = maxWeight || (!(weight instanceof Function) ? weight : 0);
  }

  setTier(tier: ModifierTier) {
    this.modifierType.setTier(tier);
  }
}

export const modifierTypes = {
  POKEBALL: () => new AddPokeballModifierType(PokeballType.POKEBALL, 5, 'pb'),
  GREAT_BALL: () => new AddPokeballModifierType(PokeballType.GREAT_BALL, 5, 'gb'),
  ULTRA_BALL: () => new AddPokeballModifierType(PokeballType.ULTRA_BALL, 5, 'ub'),
  ROGUE_BALL: () => new AddPokeballModifierType(PokeballType.ROGUE_BALL, 5, 'rb'),
  MASTER_BALL: () => new AddPokeballModifierType(PokeballType.MASTER_BALL, 1, 'mb'),

  RARE_CANDY: () => new PokemonLevelIncrementModifierType(i18next.t("modifierType:RARE_CANDY.name"), 'rare_candy'),
  RARER_CANDY: () => new AllPokemonLevelIncrementModifierType(i18next.t("modifierType:RARER_CANDY.name"), 'rarer_candy'),

  EVOLUTION_ITEM: () => new EvolutionItemModifierTypeGenerator(false),
  RARE_EVOLUTION_ITEM: () => new EvolutionItemModifierTypeGenerator(true),
  FORM_CHANGE_ITEM: () => new FormChangeItemModifierTypeGenerator(),

  MEGA_BRACELET: () => new ModifierType(i18next.t("modifierType:MEGA_BRACELET.name"), i18next.t("modifierType:MEGA_BRACELET.description"), (type, _args) => new Modifiers.MegaEvolutionAccessModifier(type), 'mega_bracelet'),
  DYNAMAX_BAND: () => new ModifierType(i18next.t("modifierType:DYNAMAX_BAND.name"), i18next.t("modifierType:DYNAMAX_BAND.description"), (type, _args) => new Modifiers.GigantamaxAccessModifier(type), 'dynamax_band'),
  TERA_ORB: () => new ModifierType(i18next.t("modifierType:TERA_ORB.name"), i18next.t("modifierType:TERA_ORB.description"), (type, _args) => new Modifiers.TerastallizeAccessModifier(type), "tera_orb"),

  MAP: () => new ModifierType(i18next.t("modifierType:MAP.name"), i18next.t("modifierType:MAP.description"), (type, _args) => new Modifiers.MapModifier(type), 'map'),

  POTION: () => new PokemonHpRestoreModifierType(i18next.t("modifierType:POTION.name"), 20, 10, undefined ,undefined , undefined, 'potion'),
  SUPER_POTION: () => new PokemonHpRestoreModifierType(i18next.t("modifierType:SUPER_POTION.name"), 50, 25, undefined, undefined, undefined, 'super_potion'),
  HYPER_POTION: () => new PokemonHpRestoreModifierType(i18next.t("modifierType:HYPER_POTION.name"), 200, 50, undefined, undefined, undefined, 'hyper_potion'),
  MAX_POTION: () => new PokemonHpRestoreModifierType(i18next.t("modifierType:MAX_POTION.name"), 0, 100, true, undefined, undefined, 'max_potion'),
  FULL_RESTORE: () => new PokemonHpRestoreModifierType(i18next.t("modifierType:FULL_RESTORE.name"), 0, 100, true, undefined, undefined, 'full_restore'),
  
  REVIVE: () => new PokemonReviveModifierType(i18next.t("modifierType:REVIVE.name"), 50,"revive"),
  MAX_REVIVE: () => new PokemonReviveModifierType(i18next.t("modifierType:MAX_REVIVE.name"), 100, "max_revive"),

  FULL_HEAL: () => new PokemonStatusHealModifierType(i18next.t("modifierType:FULL_HEAL.name")),

  SACRED_ASH: () => new AllPokemonFullReviveModifierType(i18next.t("modifierType:SACRED_ASH.name"), 'sacred_ash'),

  REVIVER_SEED: () => new PokemonHeldItemModifierType(i18next.t("modifierType:REVIVER_SEED.name"), i18next.t("modifierType:REVIVER_SEED.description"),
    (type, args) => new Modifiers.PokemonInstantReviveModifier(type, (args[0] as Pokemon).id), 'reviver_seed'),

  ETHER: () => new PokemonPpRestoreModifierType(i18next.t("modifierType:ETHER.name"), 10, 'ether'),
  MAX_ETHER: () => new PokemonPpRestoreModifierType(i18next.t("modifierType:MAX_ETHER.name"), -1, 'max_ether'),

  ELIXIR: () => new PokemonAllMovePpRestoreModifierType(i18next.t("modifierType:ELIXIR.name"), 10, 'elixir'),
  MAX_ELIXIR: () => new PokemonAllMovePpRestoreModifierType(i18next.t("modifierType:MAX_ELIXIR.name"), -1, "max_elixir"),

  PP_UP: () => new PokemonPpUpModifierType(i18next.t("modifierType:PP_UP.name"), 1, 'pp_up'),
  PP_MAX: () => new PokemonPpUpModifierType(i18next.t("modifierType:PP_MAX"), 3, 'pp_max'),

  /*REPEL: () => new DoubleBattleChanceBoosterModifierType('Repel', 5),
  SUPER_REPEL: () => new DoubleBattleChanceBoosterModifierType('Super Repel', 10),
  MAX_REPEL: () => new DoubleBattleChanceBoosterModifierType('Max Repel', 25),*/

  LURE: () => new DoubleBattleChanceBoosterModifierType(i18next.t("modifierType:LURE"), 5, "lure"),
  SUPER_LURE: () => new DoubleBattleChanceBoosterModifierType(i18next.t("modifierType:SUPER_LURE"), 10, "super_lure"),
  MAX_LURE: () => new DoubleBattleChanceBoosterModifierType(i18next.t("modifierType:MAX_LURE"), 25, "max_lure"),

  TEMP_STAT_BOOSTER: () => new ModifierTypeGenerator((party: Pokemon[], pregenArgs?: any[]) => {
    if (pregenArgs)
      return new TempBattleStatBoosterModifierType(pregenArgs[0] as TempBattleStat);
    const randTempBattleStat = Utils.randSeedInt(7) as TempBattleStat;
    return new TempBattleStatBoosterModifierType(randTempBattleStat);
  }),
/* Now included in TEMP_STAT_BOOSTER  DIRE_HIT: () => return new TempBattleStatBoosterModifierType(TempBattleStat.CRIT), */

  BASE_STAT_BOOSTER: () => new ModifierTypeGenerator((party: Pokemon[], pregenArgs?: any[]) => {
    if (pregenArgs) {
      const stat = pregenArgs[0] as Stat;
      return new PokemonBaseStatBoosterModifierType(getBaseStatBoosterItemName(stat), stat);
    }
    const randStat = Utils.randSeedInt(6) as Stat;
    return new PokemonBaseStatBoosterModifierType(getBaseStatBoosterItemName(randStat), randStat);
  }),

  ATTACK_TYPE_BOOSTER: () => new AttackTypeBoosterModifierTypeGenerator(),

  MINT: () => new ModifierTypeGenerator((party: Pokemon[], pregenArgs?: any[]) => {
    if (pregenArgs)
      return new PokemonNatureChangeModifierType(pregenArgs[0] as Nature);
    return new PokemonNatureChangeModifierType(Utils.randSeedInt(Utils.getEnumValues(Nature).length) as Nature);
  }),

  TERA_SHARD: () => new ModifierTypeGenerator((party: Pokemon[], pregenArgs?: any[]) => {
    if (pregenArgs)
      return new TerastallizeModifierType(pregenArgs[0] as Type);
    if (!party[0].scene.getModifiers(Modifiers.TerastallizeAccessModifier).length)
      return null;
    let type: Type;
    if (!Utils.randSeedInt(3)) {
      const partyMemberTypes = party.map(p => p.getTypes(false, false, true)).flat();
      type = Utils.randSeedItem(partyMemberTypes);
    } else
      type = Utils.randSeedInt(64) ? Utils.randSeedInt(18) as Type : Type.STELLAR;
    return new TerastallizeModifierType(type);
  }),

  BERRY: () => new ModifierTypeGenerator((party: Pokemon[], pregenArgs?: any[]) => {
    if (pregenArgs)
      return new BerryModifierType(pregenArgs[0] as BerryType);
    const berryTypes = Utils.getEnumValues(BerryType);
    let randBerryType: BerryType;
    let rand = Utils.randSeedInt(12);
    if (rand < 2)
      randBerryType = BerryType.SITRUS;
    else if (rand < 4)
      randBerryType = BerryType.LUM;
    else if (rand < 6)
      randBerryType = BerryType.LEPPA;
    else
      randBerryType = berryTypes[Utils.randSeedInt(berryTypes.length - 3) + 2];
    return new BerryModifierType(randBerryType);
  }),

  TM_COMMON: () => new TmModifierTypeGenerator(ModifierTier.COMMON),
  TM_GREAT: () => new TmModifierTypeGenerator(ModifierTier.GREAT),
  TM_ULTRA: () => new TmModifierTypeGenerator(ModifierTier.ULTRA),

  MEMORY_MUSHROOM: () => new RememberMoveModifierType(`${i18next.t("modifierType:MEMORY_MUSHROOM.name")}`, `${i18next.t("modifierType:MEMORY_MUSHROOM.description")}`, 'big_mushroom'),

  EXP_SHARE: () => new ModifierType(`${i18next.t("modifierType:EXP_SHARE.name")}`, `${i18next.t("modifierType:EXP_SHARE.description")}`,
    (type, _args) => new Modifiers.ExpShareModifier(type), 'exp_share'),
  EXP_BALANCE: () => new ModifierType(`${i18next.t("modifierType:EXP_BALANCE.name")}`, `${i18next.t("modifierType:EXP_BALANCE.description")}`,
    (type, _args) => new Modifiers.ExpBalanceModifier(type), 'exp_balance'),

  OVAL_CHARM: () => new ModifierType(`${i18next.t("modifierType:OVAL_CHARM.name")}`, `${i18next.t("modifierType:OVAL_CHARM.description")}`,
    (type, _args) => new Modifiers.MultipleParticipantExpBonusModifier(type), "oval_charm"),

  EXP_CHARM: () => new ExpBoosterModifierType('EXP_CHARM', 25, 'exp_charm'),
  SUPER_EXP_CHARM: () => new ExpBoosterModifierType('SUPER_EXP_CHARM', 60, 'super_exp_charm'),
  GOLDEN_EXP_CHARM: () => new ExpBoosterModifierType('GOLDEN_EXP_CHARM', 100, 'golden_exp_charm'),

  LUCKY_EGG: () => new PokemonExpBoosterModifierType("LUCKY_EGG", 40, 'lucky_egg'),
  GOLDEN_EGG: () => new PokemonExpBoosterModifierType("GOLDEN_EGG", 100, 'golden_egg'),

  SOOTHE_BELL: () => new PokemonFriendshipBoosterModifierType(`${i18next.t("modifierType:SOOTHE_BELL.name")}`, 'soothe_bell'),

  SOUL_DEW: () => new PokemonHeldItemModifierType("SOUL_DEW",`${i18next.t("modifierType:SOUL_DEW.description")}`, (type, args) => new Modifiers.PokemonNatureWeightModifier(type, (args[0] as Pokemon).id), "soul_dew"),

  NUGGET: () => new MoneyRewardModifierType('NUGGET', 1, 'small'),
  BIG_NUGGET: () => new MoneyRewardModifierType('BIG_NUGGET', 2.5, 'moderate'),
  RELIC_GOLD: () => new MoneyRewardModifierType('RELIC_GOLD', 10, 'large'),

  AMULET_COIN: () => new ModifierType(`${i18next.t("modifierType:AMULET_COIN.name")}`,`${i18next.t("modifierType:AMULET_COIN.description")}`, (type, _args) => new Modifiers.MoneyMultiplierModifier(type), "amulet_coin"),
  GOLDEN_PUNCH: () => new PokemonHeldItemModifierType("GOLDEN_PUNCH",`${i18next.t("modifierType:GOLDEN_PUNCH.description")}`, (type, args) => new Modifiers.DamageMoneyRewardModifier(type, (args[0] as Pokemon).id), "golden_punch"),
  COIN_CASE: () => new ModifierType(`${i18next.t("modifierType:COIN_CASE.name")}`,`${i18next.t("modifierType:COIN_CASE.description")}`, (type, _args) => new Modifiers.MoneyInterestModifier(type), "coin_case"),

  LOCK_CAPSULE: () => new ModifierType(`${i18next.t("modifierType:LOCK_CAPSULE.name")}`,`${i18next.t("modifierType:LOCK_CAPSULE.description")}`, (type, _args) => new Modifiers.LockModifierTiersModifier(type), 'lock_capsule'),

  GRIP_CLAW: () => new ContactHeldItemTransferChanceModifierType(`${i18next.t("modifierType:GRIP_CLAW.name")}`, 10, "grip_claw"),
  WIDE_LENS: () => new PokemonMoveAccuracyBoosterModifierType(`${i18next.t("modifierType:WIDE_LENS.name")}`, 5, 'wide_lens'),

  MULTI_LENS: () => new PokemonMultiHitModifierType(`${i18next.t("modifierType:MULTI_LENS.name")}`, 'zoom_lens'),

  HEALING_CHARM: () => new ModifierType(`${i18next.t("modifierType:HEALING_CHARM.name")}`,`${i18next.t("modifierType:HEALING_CHARM.description")}`,
    (type, _args) => new Modifiers.HealingBoosterModifier(type, 1.1), 'healing_charm'),
  CANDY_JAR: () => new ModifierType(`${i18next.t("modifierType:CANDY_JAR.name")}`,`${i18next.t("modifierType:CANDY_JAR.description")}`, (type, _args) => new Modifiers.LevelIncrementBoosterModifier(type), "candy_jar"),

  BERRY_POUCH: () => new ModifierType(`${i18next.t("modifierType:BERRY_POUCH.name")}`,`${i18next.t("modifierType:BERRY_POUCH.description")}`,
    (type, _args) => new Modifiers.PreserveBerryModifier(type), 'berry_pouch'),

  FOCUS_BAND: () => new PokemonHeldItemModifierType(`${i18next.t("modifierType:FOCUS_BAND.name")}`,`${i18next.t("modifierType:FOCUS_BAND.description")}`,
    (type, args) => new Modifiers.SurviveDamageModifier(type, (args[0] as Pokemon).id), 'focus_band'),

  KINGS_ROCK: () => new PokemonHeldItemModifierType("KINGS_ROCK",`${i18next.t("modifierType:KINGS_ROCK.description")}`,
    (type, args) => new Modifiers.FlinchChanceModifier(type, (args[0] as Pokemon).id), 'kings_rock'),

  LEFTOVERS: () => new PokemonHeldItemModifierType("LEFTOVERS",`${i18next.t("modifierType:LEFTOVERS.description")}`,
    (type, args) => new Modifiers.TurnHealModifier(type, (args[0] as Pokemon).id), 'leftovers'),
  SHELL_BELL: () => new PokemonHeldItemModifierType("SHELL_BELL",`${i18next.t("modifierType:SHELL_BELL.description")}`,
    (type, args) => new Modifiers.HitHealModifier(type, (args[0] as Pokemon).id), 'shell_bell'),

  BATON: () => new PokemonHeldItemModifierType("BATON",`${i18next.t("modifierType:BATON.description")}`,
    (type, args) => new Modifiers.SwitchEffectTransferModifier(type, (args[0] as Pokemon).id), 'stick'),

  SHINY_CHARM: () => new ModifierType(`${i18next.t("modifierType:SHINY_CHARM.name")}`,`${i18next.t("modifierType:SHINY_CHARM.description")}`, (type, _args) => new Modifiers.ShinyRateBoosterModifier(type), 'shiny_charm'),
  ABILITY_CHARM: () => new ModifierType(`${i18next.t("modifierType:ABILITY_CHARM.name")}`,`${i18next.t("modifierType:ABILITY_CHARM.description")}`, (type, _args) => new Modifiers.HiddenAbilityRateBoosterModifier(type), 'ability_charm'),

  IV_SCANNER: () => new ModifierType(`${i18next.t("modifierType:IV_SCANNER.name")}`,`${i18next.t("modifierType:IV_SCANNER.description")}`, (type, _args) => new Modifiers.IvScannerModifier(type), 'scanner'),

  DNA_SPLICERS: () => new FusePokemonModifierType(`${i18next.t("modifierType:DNA_SPLICERS.name")}`, 'dna_splicers'),

  MINI_BLACK_HOLE: () => new TurnHeldItemTransferModifierType(`${i18next.t("modifierType:MINI_BLACK_HOLE.name")}`, 'mini_black_hole'),
  
  VOUCHER: () => new AddVoucherModifierType(VoucherType.REGULAR, 1),
  VOUCHER_PLUS: () => new AddVoucherModifierType(VoucherType.PLUS, 1),
  VOUCHER_PREMIUM: () => new AddVoucherModifierType(VoucherType.PREMIUM, 1),

  GOLDEN_POKEBALL: () => new ModifierType(`${i18next.t("modifierType:GOLDEN_POKEBALL.name")}`,`${i18next.t("modifierType:GOLDEN_POKEBALL.description")}`,
    (type, _args) => new Modifiers.ExtraModifierModifier(type), 'pb_gold', null, 'pb_bounce_1'),

  ENEMY_DAMAGE_BOOSTER: () => new ModifierType(`${i18next.t("modifierType:DAMAGE_TOKEN.name")}`,`${i18next.t("modifierType:DAMAGE_TOKEN.description")}`, (type, _args) => new Modifiers.EnemyDamageBoosterModifier(type, 5), 'wl_item_drop'),
  ENEMY_DAMAGE_REDUCTION: () => new ModifierType(`${i18next.t("modifierType:PROTECTION_TOKEN.name")}`,`${i18next.t("modifierType:PROTECTION_TOKEN.description")}`, (type, _args) => new Modifiers.EnemyDamageReducerModifier(type, 2.5), 'wl_guard_spec'),
  //ENEMY_SUPER_EFFECT_BOOSTER: () => new ModifierType('Type Advantage Token', 'Increases damage of super effective attacks by 30%', (type, _args) => new Modifiers.EnemySuperEffectiveDamageBoosterModifier(type, 30), 'wl_custom_super_effective'),
  ENEMY_HEAL: () => new ModifierType(`${i18next.t("modifierType:RECOVERY_TOKEN.name")}`,`${i18next.t("modifierType:RECOVERY_TOKEN.description")}`, (type, _args) => new Modifiers.EnemyTurnHealModifier(type, 3), 'wl_potion'),
  ENEMY_ATTACK_POISON_CHANCE: () => new EnemyAttackStatusEffectChanceModifierType(`${i18next.t("modifierType:POISON_TOKEN.name")}`, 10, StatusEffect.POISON, 'wl_antidote'),
  ENEMY_ATTACK_PARALYZE_CHANCE: () => new EnemyAttackStatusEffectChanceModifierType(`${i18next.t("modifierType:PARALYZE_TOKEN.name")}`, 10, StatusEffect.PARALYSIS, 'wl_paralyze_heal'),
  ENEMY_ATTACK_SLEEP_CHANCE: () => new EnemyAttackStatusEffectChanceModifierType(`${i18next.t("modifierType:SLEEP_TOKEN.name")}`, 10, StatusEffect.SLEEP, 'wl_awakening'),
  ENEMY_ATTACK_FREEZE_CHANCE: () => new EnemyAttackStatusEffectChanceModifierType(`${i18next.t("modifierType:FREEZE_TOKEN.name")}`, 10, StatusEffect.FREEZE, 'wl_ice_heal'),
  ENEMY_ATTACK_BURN_CHANCE: () => new EnemyAttackStatusEffectChanceModifierType(`${i18next.t("modifierType:BURN_TOKEN.name")}`, 10, StatusEffect.BURN, 'wl_burn_heal'),
  ENEMY_STATUS_EFFECT_HEAL_CHANCE: () => new ModifierType(`${i18next.t("modifierType:FULL_HEAL_TOKEN.name")}`,`${i18next.t("modifierType:FULL_HEAL_TOKEN.description")}`, (type, _args) => new Modifiers.EnemyStatusEffectHealChanceModifier(type, 10), 'wl_full_heal'),
  ENEMY_ENDURE_CHANCE: () => new EnemyEndureChanceModifierType('Endure Token', 2.5, 'wl_reset_urge'),
  ENEMY_FUSED_CHANCE: () => new ModifierType(`${i18next.t("modifierType:FUSION_TOKEN.name")}`,`${i18next.t("modifierType:FUSION_TOKEN.description")}`, (type, _args) => new Modifiers.EnemyFusionChanceModifier(type, 1), 'wl_custom_spliced'),
};

interface ModifierPool {
  [tier: string]: WeightedModifierType[]
}

const modifierPool: ModifierPool = {
  [ModifierTier.COMMON]: [
    new WeightedModifierType(modifierTypes.POKEBALL, 6),
    new WeightedModifierType(modifierTypes.RARE_CANDY, 2),
    new WeightedModifierType(modifierTypes.POTION, (party: Pokemon[]) => {
      const thresholdPartyMemberCount = Math.min(party.filter(p => p.getInverseHp() >= 10 || p.getHpRatio() <= 0.875).length, 3);
      return thresholdPartyMemberCount * 3;
    }, 9),
    new WeightedModifierType(modifierTypes.SUPER_POTION, (party: Pokemon[]) => {
      const thresholdPartyMemberCount = Math.min(party.filter(p => p.getInverseHp() >= 25 || p.getHpRatio() <= 0.75).length, 3);
      return thresholdPartyMemberCount;
    }, 3),
    new WeightedModifierType(modifierTypes.ETHER, (party: Pokemon[]) => {
      const thresholdPartyMemberCount = Math.min(party.filter(p => p.hp && p.getMoveset().filter(m => (m.getMove().pp - m.ppUsed) <= 5).length).length, 3);
      return thresholdPartyMemberCount * 3;
    }, 9),
    new WeightedModifierType(modifierTypes.MAX_ETHER, (party: Pokemon[]) => {
      const thresholdPartyMemberCount = Math.min(party.filter(p => p.hp && p.getMoveset().filter(m => (m.getMove().pp - m.ppUsed) <= 5).length).length, 3);
      return thresholdPartyMemberCount;
    }, 3),
    new WeightedModifierType(modifierTypes.LURE, 2),
    new WeightedModifierType(modifierTypes.TEMP_STAT_BOOSTER, 4),
    new WeightedModifierType(modifierTypes.BERRY, 2),
    new WeightedModifierType(modifierTypes.TM_COMMON, 1),
  ].map(m => { m.setTier(ModifierTier.COMMON); return m; }),
  [ModifierTier.GREAT]: [
    new WeightedModifierType(modifierTypes.GREAT_BALL, 6),
    new WeightedModifierType(modifierTypes.FULL_HEAL, (party: Pokemon[]) => {
      const statusEffectPartyMemberCount = Math.min(party.filter(p => p.hp && !!p.status).length, 3);
      return statusEffectPartyMemberCount * 6;
    }, 18),
    new WeightedModifierType(modifierTypes.REVIVE, (party: Pokemon[]) => {
      const faintedPartyMemberCount = Math.min(party.filter(p => p.isFainted()).length, 3);
      return faintedPartyMemberCount * 9;
    }, 3),
    new WeightedModifierType(modifierTypes.MAX_REVIVE, (party: Pokemon[]) => {
      const faintedPartyMemberCount = Math.min(party.filter(p => p.isFainted()).length, 3);
      return faintedPartyMemberCount * 3;
    }, 9),
    new WeightedModifierType(modifierTypes.SACRED_ASH, (party: Pokemon[]) => {
      return party.filter(p => p.isFainted()).length >= Math.ceil(party.length / 2) ? 1 : 0;
    }, 1),
    new WeightedModifierType(modifierTypes.HYPER_POTION, (party: Pokemon[]) => {
      const thresholdPartyMemberCount = Math.min(party.filter(p => p.getInverseHp() >= 100 || p.getHpRatio() <= 0.625).length, 3);
      return thresholdPartyMemberCount * 3;
    }, 9),
    new WeightedModifierType(modifierTypes.MAX_POTION, (party: Pokemon[]) => {
      const thresholdPartyMemberCount = Math.min(party.filter(p => p.getInverseHp() >= 150 || p.getHpRatio() <= 0.5).length, 3);
      return thresholdPartyMemberCount;
    }, 3),
    new WeightedModifierType(modifierTypes.FULL_RESTORE, (party: Pokemon[]) => {
      const statusEffectPartyMemberCount = Math.min(party.filter(p => p.hp && !!p.status).length, 3);
      const thresholdPartyMemberCount = Math.floor((Math.min(party.filter(p => p.getInverseHp() >= 150 || p.getHpRatio() <= 0.5).length, 3) + statusEffectPartyMemberCount) / 2);
      return thresholdPartyMemberCount;
    }, 3),
    new WeightedModifierType(modifierTypes.ELIXIR, (party: Pokemon[]) => {
      const thresholdPartyMemberCount = Math.min(party.filter(p => p.hp && p.getMoveset().filter(m => (m.getMove().pp - m.ppUsed) <= 5).length).length, 3);
      return thresholdPartyMemberCount * 3;
    }, 9),
    new WeightedModifierType(modifierTypes.MAX_ELIXIR, (party: Pokemon[]) => {
      const thresholdPartyMemberCount = Math.min(party.filter(p => p.hp && p.getMoveset().filter(m => (m.getMove().pp - m.ppUsed) <= 5).length).length, 3);
      return thresholdPartyMemberCount;
    }, 3),
    new WeightedModifierType(modifierTypes.SUPER_LURE, 4),
    new WeightedModifierType(modifierTypes.NUGGET, 5),
    new WeightedModifierType(modifierTypes.EVOLUTION_ITEM, (party: Pokemon[]) => {
      return Math.min(Math.ceil(party[0].scene.currentBattle.waveIndex / 15), 8);
    }, 8),
    new WeightedModifierType(modifierTypes.MAP, (party: Pokemon[]) => party[0].scene.gameMode.isClassic ? 1 : 0, 1),
    new WeightedModifierType(modifierTypes.TM_GREAT, 2),
    new WeightedModifierType(modifierTypes.MEMORY_MUSHROOM, (party: Pokemon[]) => {
      if (!party.find(p => p.getLearnableLevelMoves().length))
        return 0;
      const highestPartyLevel = party.map(p => p.level).reduce((highestLevel: integer, level: integer) => Math.max(highestLevel, level), 1);
      return Math.min(Math.ceil(highestPartyLevel / 20), 4);
    }, 4),
    new WeightedModifierType(modifierTypes.BASE_STAT_BOOSTER, 3),
    new WeightedModifierType(modifierTypes.TERA_SHARD, 1),
    new WeightedModifierType(modifierTypes.DNA_SPLICERS, (party: Pokemon[]) => party[0].scene.gameMode.isSplicedOnly && party.filter(p => !p.fusionSpecies).length > 1 ? 4 : 0),
  ].map(m => { m.setTier(ModifierTier.GREAT); return m; }),
  [ModifierTier.ULTRA]: [
    new WeightedModifierType(modifierTypes.ULTRA_BALL, 24),
    new WeightedModifierType(modifierTypes.MAX_LURE, 4),
    new WeightedModifierType(modifierTypes.BIG_NUGGET, 12),
    new WeightedModifierType(modifierTypes.PP_UP, 9),
    new WeightedModifierType(modifierTypes.PP_MAX, 3),
    new WeightedModifierType(modifierTypes.MINT, 4),
    new WeightedModifierType(modifierTypes.RARE_EVOLUTION_ITEM, (party: Pokemon[]) => Math.min(Math.ceil(party[0].scene.currentBattle.waveIndex / 15) * 4, 32), 32),
    new WeightedModifierType(modifierTypes.AMULET_COIN, 3),
    new WeightedModifierType(modifierTypes.REVIVER_SEED, 4),
    new WeightedModifierType(modifierTypes.CANDY_JAR, 5),
    new WeightedModifierType(modifierTypes.ATTACK_TYPE_BOOSTER, 10),
    new WeightedModifierType(modifierTypes.TM_ULTRA, 8),
    new WeightedModifierType(modifierTypes.RARER_CANDY, 4),
    new WeightedModifierType(modifierTypes.SOOTHE_BELL, (party: Pokemon[]) => party.find(p => (pokemonEvolutions.hasOwnProperty(p.species.speciesId) && pokemonEvolutions[p.species.speciesId].find(e => e.condition && e.condition instanceof SpeciesFriendshipEvolutionCondition)) || p.moveset.find(m => m.moveId === Moves.RETURN)) ? 16 : 0, 16),
    new WeightedModifierType(modifierTypes.GOLDEN_PUNCH, 2),
    new WeightedModifierType(modifierTypes.IV_SCANNER, 4),
    new WeightedModifierType(modifierTypes.EXP_CHARM, 8),
    new WeightedModifierType(modifierTypes.EXP_SHARE, 12),
    new WeightedModifierType(modifierTypes.EXP_BALANCE, 4),
    new WeightedModifierType(modifierTypes.TERA_ORB, (party: Pokemon[]) => Math.min(Math.max(Math.floor(party[0].scene.currentBattle.waveIndex / 50) * 2, 1), 4), 4),
    new WeightedModifierType(modifierTypes.VOUCHER, (party: Pokemon[], rerollCount: integer) => !party[0].scene.gameMode.isDaily ? Math.max(3 - rerollCount, 0) : 0, 3),
  ].map(m => { m.setTier(ModifierTier.ULTRA); return m; }),
  [ModifierTier.ROGUE]: [
    new WeightedModifierType(modifierTypes.ROGUE_BALL, 24),
    new WeightedModifierType(modifierTypes.RELIC_GOLD, 2),
    new WeightedModifierType(modifierTypes.LEFTOVERS, 3),
    new WeightedModifierType(modifierTypes.SHELL_BELL, 3),
    new WeightedModifierType(modifierTypes.BERRY_POUCH, 4),
    new WeightedModifierType(modifierTypes.GRIP_CLAW, 5),
    new WeightedModifierType(modifierTypes.WIDE_LENS, 4),
    new WeightedModifierType(modifierTypes.BATON, 2),
    new WeightedModifierType(modifierTypes.SOUL_DEW, 8),
    //new WeightedModifierType(modifierTypes.OVAL_CHARM, 6),
    new WeightedModifierType(modifierTypes.ABILITY_CHARM, 6),
    new WeightedModifierType(modifierTypes.FOCUS_BAND, 5),
    new WeightedModifierType(modifierTypes.KINGS_ROCK, 3),
    new WeightedModifierType(modifierTypes.LOCK_CAPSULE, 3),
    new WeightedModifierType(modifierTypes.SUPER_EXP_CHARM, 10),
    new WeightedModifierType(modifierTypes.FORM_CHANGE_ITEM, 18),
    new WeightedModifierType(modifierTypes.MEGA_BRACELET, (party: Pokemon[]) => Math.min(Math.ceil(party[0].scene.currentBattle.waveIndex / 50), 4) * 8, 32),
    new WeightedModifierType(modifierTypes.DYNAMAX_BAND, (party: Pokemon[]) => Math.min(Math.ceil(party[0].scene.currentBattle.waveIndex / 50), 4) * 8, 32),
  ].map(m => { m.setTier(ModifierTier.ROGUE); return m; }),
  [ModifierTier.MASTER]: [
    new WeightedModifierType(modifierTypes.MASTER_BALL, 24),
    new WeightedModifierType(modifierTypes.SHINY_CHARM, 14),
    new WeightedModifierType(modifierTypes.HEALING_CHARM, 18),
    new WeightedModifierType(modifierTypes.MULTI_LENS, 18),
    new WeightedModifierType(modifierTypes.VOUCHER_PLUS, (party: Pokemon[], rerollCount: integer) => !party[0].scene.gameMode.isDaily ? Math.max(9 - rerollCount * 3, 0) : 0, 9),
    new WeightedModifierType(modifierTypes.DNA_SPLICERS, (party: Pokemon[]) => !party[0].scene.gameMode.isSplicedOnly && party.filter(p => !p.fusionSpecies).length > 1 ? 24 : 0, 24),
    new WeightedModifierType(modifierTypes.MINI_BLACK_HOLE, (party: Pokemon[]) => party[0].scene.gameData.unlocks[Unlockables.MINI_BLACK_HOLE] ? 1 : 0, 1),
  ].map(m => { m.setTier(ModifierTier.MASTER); return m; })
};

const wildModifierPool: ModifierPool = {
  [ModifierTier.COMMON]: [
    new WeightedModifierType(modifierTypes.BERRY, 1)
  ].map(m => { m.setTier(ModifierTier.COMMON); return m; }),
  [ModifierTier.GREAT]: [
    new WeightedModifierType(modifierTypes.BASE_STAT_BOOSTER, 1)
  ].map(m => { m.setTier(ModifierTier.GREAT); return m; }),
  [ModifierTier.ULTRA]: [
    new WeightedModifierType(modifierTypes.ATTACK_TYPE_BOOSTER, 10),
  ].map(m => { m.setTier(ModifierTier.ULTRA); return m; }),
  [ModifierTier.ROGUE]: [
    new WeightedModifierType(modifierTypes.LUCKY_EGG, 4),
  ].map(m => { m.setTier(ModifierTier.ROGUE); return m; }),
  [ModifierTier.MASTER]: [
    new WeightedModifierType(modifierTypes.GOLDEN_EGG, 1)
  ].map(m => { m.setTier(ModifierTier.MASTER); return m; })
};

const trainerModifierPool: ModifierPool = {
  [ModifierTier.COMMON]: [
    new WeightedModifierType(modifierTypes.BERRY, 8),
    new WeightedModifierType(modifierTypes.BASE_STAT_BOOSTER, 3)
  ].map(m => { m.setTier(ModifierTier.COMMON); return m; }),
  [ModifierTier.GREAT]: [
    new WeightedModifierType(modifierTypes.BASE_STAT_BOOSTER, 3),
  ].map(m => { m.setTier(ModifierTier.GREAT); return m; }),
  [ModifierTier.ULTRA]: [
    new WeightedModifierType(modifierTypes.ATTACK_TYPE_BOOSTER, 1),
  ].map(m => { m.setTier(ModifierTier.ULTRA); return m; }),
  [ModifierTier.ROGUE]: [
    new WeightedModifierType(modifierTypes.REVIVER_SEED, 2),
    new WeightedModifierType(modifierTypes.FOCUS_BAND, 2),
    new WeightedModifierType(modifierTypes.LUCKY_EGG, 4),
    new WeightedModifierType(modifierTypes.GRIP_CLAW, 1),
    new WeightedModifierType(modifierTypes.WIDE_LENS, 1),
  ].map(m => { m.setTier(ModifierTier.ROGUE); return m; }),
  [ModifierTier.MASTER]: [
    new WeightedModifierType(modifierTypes.KINGS_ROCK, 1),
    new WeightedModifierType(modifierTypes.LEFTOVERS, 1),
    new WeightedModifierType(modifierTypes.SHELL_BELL, 1),
  ].map(m => { m.setTier(ModifierTier.MASTER); return m; })
};

const enemyBuffModifierPool: ModifierPool = {
  [ModifierTier.COMMON]: [
    new WeightedModifierType(modifierTypes.ENEMY_DAMAGE_BOOSTER, 10),
    new WeightedModifierType(modifierTypes.ENEMY_DAMAGE_REDUCTION, 10),
    new WeightedModifierType(modifierTypes.ENEMY_ATTACK_POISON_CHANCE, 2),
    new WeightedModifierType(modifierTypes.ENEMY_ATTACK_PARALYZE_CHANCE, 2),
    new WeightedModifierType(modifierTypes.ENEMY_ATTACK_SLEEP_CHANCE, 2),
    new WeightedModifierType(modifierTypes.ENEMY_ATTACK_FREEZE_CHANCE, 2),
    new WeightedModifierType(modifierTypes.ENEMY_ATTACK_BURN_CHANCE, 2),
    new WeightedModifierType(modifierTypes.ENEMY_STATUS_EFFECT_HEAL_CHANCE, 10),
    new WeightedModifierType(modifierTypes.ENEMY_ENDURE_CHANCE, 10000),
    new WeightedModifierType(modifierTypes.ENEMY_FUSED_CHANCE, 1)
  ].map(m => { m.setTier(ModifierTier.COMMON); return m; }),
  [ModifierTier.GREAT]: [
    new WeightedModifierType(modifierTypes.ENEMY_DAMAGE_BOOSTER, 5),
    new WeightedModifierType(modifierTypes.ENEMY_DAMAGE_REDUCTION, 5),
    new WeightedModifierType(modifierTypes.ENEMY_STATUS_EFFECT_HEAL_CHANCE, 5),
    new WeightedModifierType(modifierTypes.ENEMY_ENDURE_CHANCE, 5),
    new WeightedModifierType(modifierTypes.ENEMY_FUSED_CHANCE, 1)
  ].map(m => { m.setTier(ModifierTier.GREAT); return m; }),
  [ModifierTier.ULTRA]: [
    new WeightedModifierType(modifierTypes.ENEMY_DAMAGE_BOOSTER, 5),
    new WeightedModifierType(modifierTypes.ENEMY_DAMAGE_REDUCTION, 5),
    new WeightedModifierType(modifierTypes.ENEMY_HEAL, 5),
    new WeightedModifierType(modifierTypes.ENEMY_STATUS_EFFECT_HEAL_CHANCE, 5),
    new WeightedModifierType(modifierTypes.ENEMY_ENDURE_CHANCE, 5),
    new WeightedModifierType(modifierTypes.ENEMY_FUSED_CHANCE, 300)
  ].map(m => { m.setTier(ModifierTier.ULTRA); return m; }),
  [ModifierTier.ROGUE]: [ ].map(m => { m.setTier(ModifierTier.ROGUE); return m; }),
  [ModifierTier.MASTER]: [ ].map(m => { m.setTier(ModifierTier.MASTER); return m; })
};

const dailyStarterModifierPool: ModifierPool = {
  [ModifierTier.COMMON]: [
    new WeightedModifierType(modifierTypes.BASE_STAT_BOOSTER, 1),
    new WeightedModifierType(modifierTypes.BERRY, 3),
  ].map(m => { m.setTier(ModifierTier.COMMON); return m; }),
  [ModifierTier.GREAT]: [
    new WeightedModifierType(modifierTypes.ATTACK_TYPE_BOOSTER, 5),
  ].map(m => { m.setTier(ModifierTier.GREAT); return m; }),
  [ModifierTier.ULTRA]: [
    new WeightedModifierType(modifierTypes.REVIVER_SEED, 4),
    new WeightedModifierType(modifierTypes.SOOTHE_BELL, 1),
    new WeightedModifierType(modifierTypes.SOUL_DEW, 1),
    new WeightedModifierType(modifierTypes.GOLDEN_PUNCH, 1),
  ].map(m => { m.setTier(ModifierTier.ULTRA); return m; }),
  [ModifierTier.ROGUE]: [
    new WeightedModifierType(modifierTypes.GRIP_CLAW, 5),
    new WeightedModifierType(modifierTypes.BATON, 2),
    new WeightedModifierType(modifierTypes.FOCUS_BAND, 5),
    new WeightedModifierType(modifierTypes.KINGS_ROCK, 3),
  ].map(m => { m.setTier(ModifierTier.ROGUE); return m; }),
  [ModifierTier.MASTER]: [
    new WeightedModifierType(modifierTypes.LEFTOVERS, 1),
    new WeightedModifierType(modifierTypes.SHELL_BELL, 1),
  ].map(m => { m.setTier(ModifierTier.MASTER); return m; })
};

export function getModifierType(modifierTypeFunc: ModifierTypeFunc): ModifierType {
  const modifierType = modifierTypeFunc();
  if (!modifierType.id)
    modifierType.id = Object.keys(modifierTypes).find(k => modifierTypes[k] === modifierTypeFunc);
  return modifierType;
}

let modifierPoolThresholds = {};
let ignoredPoolIndexes = {};

let dailyStarterModifierPoolThresholds = {};
let ignoredDailyStarterPoolIndexes = {};

let enemyModifierPoolThresholds = {};
let enemyIgnoredPoolIndexes = {};

let enemyBuffModifierPoolThresholds = {};
let enemyBuffIgnoredPoolIndexes = {};

export function getModifierPoolForType(poolType: ModifierPoolType): ModifierPool {
  let pool: ModifierPool;
  switch (poolType) {
    case ModifierPoolType.PLAYER:
      pool = modifierPool;
      break;
    case ModifierPoolType.WILD:
      pool = wildModifierPool;
      break;
    case ModifierPoolType.TRAINER:
      pool = trainerModifierPool;
      break;
    case ModifierPoolType.ENEMY_BUFF:
      pool = enemyBuffModifierPool;
      break;
    case ModifierPoolType.DAILY_STARTER:
      pool = dailyStarterModifierPool;
      break;
  }
  return pool;
}

const tierWeights = [ 769 / 1024, 192 / 1024, 48 / 1024, 12 / 1024, 1 / 1024 ];

export function regenerateModifierPoolThresholds(party: Pokemon[], poolType: ModifierPoolType, rerollCount: integer = 0) {
  const pool = getModifierPoolForType(poolType);
 
  const ignoredIndexes = {};
  const modifierTableData = {};
  const thresholds = Object.fromEntries(new Map(Object.keys(pool).map(t => {
    ignoredIndexes[t] = [];
    const thresholds = new Map();
    const tierModifierIds: string[] = [];
    let tierMaxWeight = 0;
    let i = 0;
    pool[t].reduce((total: integer, modifierType: WeightedModifierType) => {
      const weightedModifierType = modifierType as WeightedModifierType;
      const existingModifiers = party[0].scene.findModifiers(m => (m.type.generatorId || m.type.id) === weightedModifierType.modifierType.id, poolType === ModifierPoolType.PLAYER);
      const itemModifierType = weightedModifierType.modifierType instanceof ModifierTypeGenerator
        ? weightedModifierType.modifierType.generateType(party)
        : weightedModifierType.modifierType;
      const weight = !existingModifiers.length
        || itemModifierType instanceof PokemonHeldItemModifierType
        || itemModifierType instanceof FormChangeItemModifierType
        || existingModifiers.find(m => m.stackCount < m.getMaxStackCount(party[0].scene, true))
        ? weightedModifierType.weight instanceof Function
          ? (weightedModifierType.weight as Function)(party, rerollCount)
          : weightedModifierType.weight as integer
        : 0;
      if (weightedModifierType.maxWeight) {
        const modifierId = weightedModifierType.modifierType.generatorId || weightedModifierType.modifierType.id;
        tierModifierIds.push(modifierId);
        const outputWeight = useMaxWeightForOutput ? weightedModifierType.maxWeight : weight;
        modifierTableData[modifierId] = { weight: outputWeight, tier: parseInt(t), tierPercent: 0, totalPercent: 0 };
        tierMaxWeight += outputWeight;
      }
      if (weight)
        total += weight;
      else {
        ignoredIndexes[t].push(i++);
        return total;
      }
      thresholds.set(total, i++);
      return total;
    }, 0);
    for (let id of tierModifierIds)
      modifierTableData[id].tierPercent = Math.floor((modifierTableData[id].weight / tierMaxWeight) * 10000) / 100;
    return [ t, Object.fromEntries(thresholds) ];
  })));
  for (let id of Object.keys(modifierTableData)) {
    modifierTableData[id].totalPercent = Math.floor(modifierTableData[id].tierPercent * tierWeights[modifierTableData[id].tier] * 100) / 100;
    modifierTableData[id].tier = ModifierTier[modifierTableData[id].tier];
  }
  if (outputModifierData)
    console.table(modifierTableData);
  switch (poolType) {
    case ModifierPoolType.PLAYER:
      modifierPoolThresholds = thresholds;
      ignoredPoolIndexes = ignoredIndexes;
      break;
    case ModifierPoolType.WILD:
    case ModifierPoolType.TRAINER:
      enemyModifierPoolThresholds = thresholds;
      enemyIgnoredPoolIndexes = ignoredIndexes;
      break;
    case ModifierPoolType.ENEMY_BUFF:
      enemyBuffModifierPoolThresholds = thresholds;
      enemyBuffIgnoredPoolIndexes = ignoredIndexes;
      break;
    case ModifierPoolType.DAILY_STARTER:
      dailyStarterModifierPoolThresholds = thresholds;
      ignoredDailyStarterPoolIndexes = ignoredIndexes;
      break;
  }
}

export function getModifierTypeFuncById(id: string): ModifierTypeFunc {
  return modifierTypes[id];
}

export function getPlayerModifierTypeOptions(count: integer, party: PlayerPokemon[], modifierTiers?: ModifierTier[]): ModifierTypeOption[] {
  const options: ModifierTypeOption[] = [];
  const retryCount = Math.min(count * 5, 50);
  new Array(count).fill(0).map((_, i) => {
    let candidate = getNewModifierTypeOption(party, ModifierPoolType.PLAYER, modifierTiers?.length > i ? modifierTiers[i] : undefined);
    let r = 0;
    while (options.length && ++r < retryCount && options.filter(o => o.type.name === candidate.type.name || o.type.group === candidate.type.group).length)
      candidate = getNewModifierTypeOption(party, ModifierPoolType.PLAYER, candidate.type.tier, candidate.upgradeCount);
    options.push(candidate);
  });
  return options;
}

export function getPlayerShopModifierTypeOptionsForWave(waveIndex: integer, baseCost: integer): ModifierTypeOption[] {
  if (!(waveIndex % 10))
    return [];

  const options = [
    [
      new ModifierTypeOption(modifierTypes.POTION(), 0, baseCost * 0.2),
      new ModifierTypeOption(modifierTypes.ETHER(), 0, baseCost * 0.4),
      new ModifierTypeOption(modifierTypes.REVIVE(), 0, baseCost * 2)
    ],
    [
      new ModifierTypeOption(modifierTypes.SUPER_POTION(), 0, baseCost * 0.45),
      new ModifierTypeOption(modifierTypes.FULL_HEAL(), 0, baseCost),
    ],
    [
      new ModifierTypeOption(modifierTypes.ELIXIR(), 0, baseCost),
      new ModifierTypeOption(modifierTypes.MAX_ETHER(), 0, baseCost)
    ],
    [
      new ModifierTypeOption(modifierTypes.HYPER_POTION(), 0, baseCost * 0.8),
      new ModifierTypeOption(modifierTypes.MAX_REVIVE(), 0, baseCost * 2.75)
    ],
    [
      new ModifierTypeOption(modifierTypes.MAX_POTION(), 0, baseCost * 1.5),
      new ModifierTypeOption(modifierTypes.MAX_ELIXIR(), 0, baseCost * 2.5)
    ],
    [
      new ModifierTypeOption(modifierTypes.FULL_RESTORE(), 0, baseCost * 2.25)
    ],
    [
      new ModifierTypeOption(modifierTypes.SACRED_ASH(), 0, baseCost * 10)
    ]
  ];
  return options.slice(0, Math.ceil(Math.max(waveIndex + 10, 0) / 30)).flat();
}

export function getEnemyBuffModifierForWave(tier: ModifierTier, enemyModifiers: Modifiers.PersistentModifier[], scene: BattleScene): Modifiers.EnemyPersistentModifier {
  const tierStackCount = tier === ModifierTier.ULTRA ? 5 : tier === ModifierTier.GREAT ? 3 : 1;
  const retryCount = 50;
  let candidate = getNewModifierTypeOption(null, ModifierPoolType.ENEMY_BUFF, tier);
  let r = 0;
  let matchingModifier: Modifiers.PersistentModifier;
  while (++r < retryCount && (matchingModifier = enemyModifiers.find(m => m.type.id === candidate.type.id)) && matchingModifier.getMaxStackCount(scene) < matchingModifier.stackCount + (r < 10 ? tierStackCount : 1))
    candidate = getNewModifierTypeOption(null, ModifierPoolType.ENEMY_BUFF, tier);

  const modifier = candidate.type.newModifier() as Modifiers.EnemyPersistentModifier;
  modifier.stackCount = tierStackCount;

  return modifier;
}

export function getEnemyModifierTypesForWave(waveIndex: integer, count: integer, party: EnemyPokemon[], poolType: ModifierPoolType.WILD | ModifierPoolType.TRAINER, upgradeChance: integer = 0): PokemonHeldItemModifierType[] {
  const ret = new Array(count).fill(0).map(() => getNewModifierTypeOption(party, poolType, undefined, upgradeChance && !Utils.randSeedInt(upgradeChance) ? 1 : 0).type as PokemonHeldItemModifierType);
  if (!(waveIndex % 1000))
    ret.push(getModifierType(modifierTypes.MINI_BLACK_HOLE) as PokemonHeldItemModifierType);
  return ret;
}

export function getDailyRunStarterModifiers(party: PlayerPokemon[]): Modifiers.PokemonHeldItemModifier[] {
  const ret: Modifiers.PokemonHeldItemModifier[] = [];
  for (let p of party) {
    for (let m = 0; m < 3; m++) {
      const tierValue = Utils.randSeedInt(64);
      const tier = tierValue > 25 ? ModifierTier.COMMON : tierValue > 12 ? ModifierTier.GREAT : tierValue > 4 ? ModifierTier.ULTRA : tierValue ? ModifierTier.ROGUE : ModifierTier.MASTER;
      const modifier = getNewModifierTypeOption(party, ModifierPoolType.DAILY_STARTER, tier).type.newModifier(p) as Modifiers.PokemonHeldItemModifier;
      ret.push(modifier);
    }
  }

  return ret;
}

function getNewModifierTypeOption(party: Pokemon[], poolType: ModifierPoolType, tier?: ModifierTier, upgradeCount?: integer, retryCount: integer = 0): ModifierTypeOption {
  const player = !poolType;
  const pool = getModifierPoolForType(poolType);
  let thresholds: object;
  switch (poolType) {
    case ModifierPoolType.PLAYER:
      thresholds = modifierPoolThresholds;
      break;
    case ModifierPoolType.WILD:
      thresholds = enemyModifierPoolThresholds;
      break;
    case ModifierPoolType.TRAINER:
      thresholds = enemyModifierPoolThresholds;
      break;
    case ModifierPoolType.ENEMY_BUFF:
      thresholds = enemyBuffModifierPoolThresholds;
      break;
    case ModifierPoolType.DAILY_STARTER:
      thresholds = dailyStarterModifierPoolThresholds;
      break;
  }
  if (tier === undefined) {
    const tierValue = Utils.randSeedInt(1024);
    if (!upgradeCount)
      upgradeCount = 0;
    if (player && tierValue) {
      const partyLuckValue = getPartyLuckValue(party);
      const upgradeOdds = Math.floor(128 / ((partyLuckValue + 4) / 4));
      let upgraded = false;
      do {
        upgraded = Utils.randSeedInt(upgradeOdds) < 4;
        if (upgraded)
          upgradeCount++;
      } while (upgraded);
    }
    tier = tierValue > 255 ? ModifierTier.COMMON : tierValue > 60 ? ModifierTier.GREAT : tierValue > 12 ? ModifierTier.ULTRA : tierValue ? ModifierTier.ROGUE : ModifierTier.MASTER;
    // Does this actually do anything?
    if (!upgradeCount)
      upgradeCount = Math.min(upgradeCount, ModifierTier.MASTER - tier);
    tier += upgradeCount;
    while (tier && (!modifierPool.hasOwnProperty(tier) || !modifierPool[tier].length)) {
      tier--;
      if (upgradeCount)
        upgradeCount--;
    }
  } else if (upgradeCount === undefined && player) {
    upgradeCount = 0;
    if (tier < ModifierTier.MASTER) {
      const partyShinyCount = party.filter(p => p.isShiny() && !p.isFainted()).length;
      const upgradeOdds = Math.floor(32 / ((partyShinyCount + 2) / 2));
      while (modifierPool.hasOwnProperty(tier + upgradeCount + 1) && modifierPool[tier + upgradeCount + 1].length) {
        if (!Utils.randSeedInt(upgradeOdds))
          upgradeCount++;
        else
          break;
      }
      tier += upgradeCount;
    }
  } else if (retryCount === 10 && tier) {
    retryCount = 0;
    tier--;
  }

  const tierThresholds = Object.keys(thresholds[tier]);
  const totalWeight = parseInt(tierThresholds[tierThresholds.length - 1]);
  const value = Utils.randSeedInt(totalWeight);
  let index: integer;
  for (let t of tierThresholds) {
    let threshold = parseInt(t);
    if (value < threshold) {
      index = thresholds[tier][threshold];
      break;
    }
  }

  if (index === undefined)
    return null;
  
  if (player)
    console.log(index, ignoredPoolIndexes[tier].filter(i => i <= index).length, ignoredPoolIndexes[tier])
  let modifierType: ModifierType = (pool[tier][index]).modifierType;
  if (modifierType instanceof ModifierTypeGenerator) {
    modifierType = (modifierType as ModifierTypeGenerator).generateType(party);
    if (modifierType === null) {
      if (player)
        console.log(ModifierTier[tier], upgradeCount);
      return getNewModifierTypeOption(party, poolType, tier, upgradeCount, ++retryCount);
    }
  }

  console.log(modifierType, !player ? '(enemy)' : '');

  return new ModifierTypeOption(modifierType as ModifierType, upgradeCount);
}

export function getDefaultModifierTypeForTier(tier: ModifierTier): ModifierType {
  let modifierType: ModifierType | WeightedModifierType = modifierPool[tier || ModifierTier.COMMON][0];
  if (modifierType instanceof WeightedModifierType)
    modifierType = (modifierType as WeightedModifierType).modifierType;
  return modifierType;
}

export class ModifierTypeOption {
  public type: ModifierType;
  public upgradeCount: integer;
  public cost: integer;

  constructor(type: ModifierType, upgradeCount: integer, cost: number = 0) {
    this.type = type;
    this.upgradeCount = upgradeCount;
    this.cost = Math.min(Math.round(cost), Number.MAX_SAFE_INTEGER);
  }
}

export function getPartyLuckValue(party: Pokemon[]): integer {
  return Phaser.Math.Clamp(party.map(p => p.isFainted() || !p.isShiny() ? 0 : !p.isFusion() || !p.shiny || !p.fusionShiny ? p.variant + 1 : (p.variant + 1) + (p.fusionVariant + 1))
    .reduce((total: integer, value: integer) => total += value, 0), 0, 14);
}

export function getLuckString(luckValue: integer): string {
  return [ 'D', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+', 'A++', 'S', 'S+', 'SS', 'SS+', 'SSS' ][luckValue];
}

export function getLuckTextTint(luckValue: integer): integer {
  const modifierTier = luckValue ? luckValue > 2 ? luckValue > 5 ? luckValue > 9 ? luckValue > 11 ? ModifierTier.LUXURY : ModifierTier.MASTER : ModifierTier.ROGUE : ModifierTier.ULTRA : ModifierTier.GREAT : ModifierTier.COMMON;
  return getModifierTierTextTint(modifierTier);
}