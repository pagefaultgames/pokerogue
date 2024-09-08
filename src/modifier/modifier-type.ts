import * as Modifiers from "./modifier";
import { AttackMove, allMoves, selfStatLowerMoves } from "../data/move";
import { MAX_PER_TYPE_POKEBALLS, PokeballType, getPokeballCatchMultiplier, getPokeballName } from "../data/pokeball";
import Pokemon, { EnemyPokemon, PlayerPokemon, PokemonMove } from "../field/pokemon";
import { EvolutionItem, pokemonEvolutions } from "../data/pokemon-evolutions";
import { tmPoolTiers, tmSpecies } from "../data/tms";
import { Type } from "../data/type";
import PartyUiHandler, { PokemonMoveSelectFilter, PokemonSelectFilter } from "../ui/party-ui-handler";
import * as Utils from "../utils";
import { getBerryEffectDescription, getBerryName } from "../data/berry";
import { Unlockables } from "../system/unlockables";
import { StatusEffect, getStatusEffectDescriptor } from "../data/status-effect";
import { SpeciesFormKey } from "../data/pokemon-species";
import BattleScene from "../battle-scene";
import { VoucherType, getVoucherTypeIcon, getVoucherTypeName } from "../system/voucher";
import { FormChangeItem, SpeciesFormChangeCondition, SpeciesFormChangeItemTrigger, pokemonFormChanges } from "../data/pokemon-forms";
import { ModifierTier } from "./modifier-tier";
import { Nature, getNatureName, getNatureStatMultiplier } from "#app/data/nature";
import i18next from "i18next";
import { getModifierTierTextTint } from "#app/ui/text";
import Overrides from "#app/overrides";
import { MoneyMultiplierModifier } from "./modifier";
import { Abilities } from "#enums/abilities";
import { BattlerTagType } from "#enums/battler-tag-type";
import { BerryType } from "#enums/berry-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { getPokemonNameWithAffix } from "#app/messages.js";
import { PermanentStat, TEMP_BATTLE_STATS, TempBattleStat, Stat, getStatKey } from "#app/enums/stat";

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
  public localeKey: string;
  public iconImage: string;
  public group: string;
  public soundName: string;
  public tier: ModifierTier;
  protected newModifierFunc: NewModifierFunc | null;

  constructor(localeKey: string | null, iconImage: string | null, newModifierFunc: NewModifierFunc | null, group?: string, soundName?: string) {
    this.localeKey = localeKey!; // TODO: is this bang correct?
    this.iconImage = iconImage!; // TODO: is this bang correct?
    this.group = group!; // TODO: is this bang correct?
    this.soundName = soundName ?? "se/restore";
    this.newModifierFunc = newModifierFunc;
  }

  get name(): string {
    return i18next.t(`${this.localeKey}.name` as any);
  }

  getDescription(scene: BattleScene): string {
    return i18next.t(`${this.localeKey}.description` as any);
  }

  setTier(tier: ModifierTier): void {
    this.tier = tier;
  }

  getOrInferTier(poolType: ModifierPoolType = ModifierPoolType.PLAYER): ModifierTier | null {
    if (this.tier) {
      return this.tier;
    }
    if (!this.id) {
      return null;
    }
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
    for (const type of poolTypes) {
      const pool = getModifierPoolForType(type);
      for (const tier of Utils.getEnumValues(ModifierTier)) {
        if (!pool.hasOwnProperty(tier)) {
          continue;
        }
        if (pool[tier].find(m => (m as WeightedModifierType).modifierType.id === this.id)) {
          return (this.tier = tier);
        }
      }
    }
    return null;
  }

  withIdFromFunc(func: ModifierTypeFunc): ModifierType {
    this.id = Object.keys(modifierTypes).find(k => modifierTypes[k] === func)!; // TODO: is this bang correct?
    return this;
  }

  /**
   * Populates the tier field by performing a reverse lookup on the modifier pool specified by {@linkcode poolType} using the
   * {@linkcode ModifierType}'s id.
   * @param poolType the {@linkcode ModifierPoolType} to look into to derive the item's tier; defaults to {@linkcode ModifierPoolType.PLAYER}
   */
  withTierFromPool(poolType: ModifierPoolType = ModifierPoolType.PLAYER): ModifierType {
    for (const tier of Object.values(getModifierPoolForType(poolType))) {
      for (const modifier of tier) {
        if (this.id === modifier.modifierType.id) {
          this.tier = modifier.modifierType.tier;
          break;
        }
      }
      if (this.tier) {
        break;
      }
    }
    return this;
  }

  newModifier(...args: any[]): Modifier | null {
    return this.newModifierFunc && this.newModifierFunc(this, args);
  }
}

type ModifierTypeGeneratorFunc = (party: Pokemon[], pregenArgs?: any[]) => ModifierType | null;

export class ModifierTypeGenerator extends ModifierType {
  private genTypeFunc:  ModifierTypeGeneratorFunc;

  constructor(genTypeFunc: ModifierTypeGeneratorFunc) {
    super(null, null, null);
    this.genTypeFunc = genTypeFunc;
  }

  generateType(party: Pokemon[], pregenArgs?: any[]) {
    const ret = this.genTypeFunc(party, pregenArgs);
    if (ret) {
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
  private pokeballType: PokeballType;
  private count: integer;

  constructor(iconImage: string, pokeballType: PokeballType, count: integer) {
    super("", iconImage, (_type, _args) => new Modifiers.AddPokeballModifier(this, pokeballType, count), "pb", "se/pb_bounce_1");
    this.pokeballType = pokeballType;
    this.count = count;
  }

  get name(): string {
    return i18next.t("modifierType:ModifierType.AddPokeballModifierType.name", {
      "modifierCount": this.count,
      "pokeballName": getPokeballName(this.pokeballType),
    });
  }

  getDescription(scene: BattleScene): string {
    return i18next.t("modifierType:ModifierType.AddPokeballModifierType.description", {
      "modifierCount": this.count,
      "pokeballName": getPokeballName(this.pokeballType),
      "catchRate": getPokeballCatchMultiplier(this.pokeballType) > -1 ? `${getPokeballCatchMultiplier(this.pokeballType)}x` : "100%",
      "pokeballAmount": `${scene.pokeballCounts[this.pokeballType]}`,
    });
  }
}

class AddVoucherModifierType extends ModifierType {
  private voucherType: VoucherType;
  private count: integer;

  constructor(voucherType: VoucherType, count: integer) {
    super("", getVoucherTypeIcon(voucherType), (_type, _args) => new Modifiers.AddVoucherModifier(this, voucherType, count), "voucher");
    this.count = count;
    this.voucherType = voucherType;
  }

  get name(): string {
    return i18next.t("modifierType:ModifierType.AddVoucherModifierType.name", {
      "modifierCount": this.count,
      "voucherTypeName": getVoucherTypeName(this.voucherType),
    });
  }

  getDescription(scene: BattleScene): string {
    return i18next.t("modifierType:ModifierType.AddVoucherModifierType.description", {
      "modifierCount": this.count,
      "voucherTypeName": getVoucherTypeName(this.voucherType),
    });
  }
}

export class PokemonModifierType extends ModifierType {
  public selectFilter: PokemonSelectFilter | undefined;

  constructor(localeKey: string, iconImage: string, newModifierFunc: NewModifierFunc, selectFilter?: PokemonSelectFilter, group?: string, soundName?: string) {
    super(localeKey, iconImage, newModifierFunc, group, soundName);

    this.selectFilter = selectFilter;
  }
}

export class PokemonHeldItemModifierType extends PokemonModifierType {
  constructor(localeKey: string, iconImage: string, newModifierFunc: NewModifierFunc, group?: string, soundName?: string) {
    super(localeKey, iconImage, newModifierFunc, (pokemon: PlayerPokemon) => {
      const dummyModifier = this.newModifier(pokemon);
      const matchingModifier = pokemon.scene.findModifier(m => m instanceof Modifiers.PokemonHeldItemModifier && m.pokemonId === pokemon.id && m.matchType(dummyModifier)) as Modifiers.PokemonHeldItemModifier;
      const maxStackCount = dummyModifier.getMaxStackCount(pokemon.scene);
      if (!maxStackCount) {
        return i18next.t("modifierType:ModifierType.PokemonHeldItemModifierType.extra.inoperable", { "pokemonName": getPokemonNameWithAffix(pokemon) });
      }
      if (matchingModifier && matchingModifier.stackCount === maxStackCount) {
        return i18next.t("modifierType:ModifierType.PokemonHeldItemModifierType.extra.tooMany", { "pokemonName": getPokemonNameWithAffix(pokemon) });
      }
      return null;
    }, group, soundName);
  }

  newModifier(...args: any[]): Modifiers.PokemonHeldItemModifier {
    return super.newModifier(...args) as Modifiers.PokemonHeldItemModifier;
  }
}

export class PokemonHpRestoreModifierType extends PokemonModifierType {
  protected restorePoints: integer;
  protected restorePercent: integer;
  protected healStatus: boolean;

  constructor(localeKey: string, iconImage: string, restorePoints: integer, restorePercent: integer, healStatus: boolean = false, newModifierFunc?: NewModifierFunc, selectFilter?: PokemonSelectFilter, group?: string) {
    super(localeKey, iconImage, newModifierFunc || ((_type, args) => new Modifiers.PokemonHpRestoreModifier(this, (args[0] as PlayerPokemon).id, this.restorePoints, this.restorePercent, this.healStatus, false)),
      selectFilter || ((pokemon: PlayerPokemon) => {
        if (!pokemon.hp || (pokemon.isFullHp() && (!this.healStatus || (!pokemon.status && !pokemon.getTag(BattlerTagType.CONFUSED))))) {
          return PartyUiHandler.NoEffectMessage;
        }
        return null;
      }), group || "potion");

    this.restorePoints = restorePoints;
    this.restorePercent = restorePercent;
    this.healStatus = healStatus;
  }

  getDescription(scene: BattleScene): string {
    return this.restorePoints
      ? i18next.t("modifierType:ModifierType.PokemonHpRestoreModifierType.description", {
        restorePoints: this.restorePoints,
        restorePercent: this.restorePercent,
      })
      : this.healStatus
        ? i18next.t("modifierType:ModifierType.PokemonHpRestoreModifierType.extra.fullyWithStatus")
        : i18next.t("modifierType:ModifierType.PokemonHpRestoreModifierType.extra.fully");
  }
}

export class PokemonReviveModifierType extends PokemonHpRestoreModifierType {
  constructor(localeKey: string, iconImage: string, restorePercent: integer) {
    super(localeKey, iconImage, 0, restorePercent, false, (_type, args) => new Modifiers.PokemonHpRestoreModifier(this, (args[0] as PlayerPokemon).id, 0, this.restorePercent, false, true),
      ((pokemon: PlayerPokemon) => {
        if (!pokemon.isFainted()) {
          return PartyUiHandler.NoEffectMessage;
        }
        return null;
      }), "revive");

    this.selectFilter = (pokemon: PlayerPokemon) => {
      if (pokemon.hp) {
        return PartyUiHandler.NoEffectMessage;
      }
      return null;
    };
  }

  getDescription(scene: BattleScene): string {
    return i18next.t("modifierType:ModifierType.PokemonReviveModifierType.description", { restorePercent: this.restorePercent });
  }
}

export class PokemonStatusHealModifierType extends PokemonModifierType {
  constructor(localeKey: string, iconImage: string) {
    super(localeKey, iconImage, ((_type, args) => new Modifiers.PokemonStatusHealModifier(this, (args[0] as PlayerPokemon).id)),
      ((pokemon: PlayerPokemon) => {
        if (!pokemon.hp || (!pokemon.status && !pokemon.getTag(BattlerTagType.CONFUSED))) {
          return PartyUiHandler.NoEffectMessage;
        }
        return null;
      }));
  }

  getDescription(scene: BattleScene): string {
    return i18next.t("modifierType:ModifierType.PokemonStatusHealModifierType.description");
  }
}

export abstract class PokemonMoveModifierType extends PokemonModifierType {
  public moveSelectFilter: PokemonMoveSelectFilter | undefined;

  constructor(localeKey: string, iconImage: string, newModifierFunc: NewModifierFunc, selectFilter?: PokemonSelectFilter, moveSelectFilter?: PokemonMoveSelectFilter, group?: string) {
    super(localeKey, iconImage, newModifierFunc, selectFilter, group);

    this.moveSelectFilter = moveSelectFilter;
  }
}

export class PokemonPpRestoreModifierType extends PokemonMoveModifierType {
  protected restorePoints: integer;

  constructor(localeKey: string, iconImage: string, restorePoints: integer) {
    super(localeKey, iconImage, (_type, args) => new Modifiers.PokemonPpRestoreModifier(this, (args[0] as PlayerPokemon).id, (args[1] as integer), this.restorePoints),
      (_pokemon: PlayerPokemon) => {
        return null;
      }, (pokemonMove: PokemonMove) => {
        if (!pokemonMove.ppUsed) {
          return PartyUiHandler.NoEffectMessage;
        }
        return null;
      }, "ether");

    this.restorePoints = restorePoints;
  }

  getDescription(scene: BattleScene): string {
    return this.restorePoints > -1
      ? i18next.t("modifierType:ModifierType.PokemonPpRestoreModifierType.description", { restorePoints: this.restorePoints })
      : i18next.t("modifierType:ModifierType.PokemonPpRestoreModifierType.extra.fully")
    ;
  }
}

export class PokemonAllMovePpRestoreModifierType extends PokemonModifierType {
  protected restorePoints: integer;

  constructor(localeKey: string, iconImage: string, restorePoints: integer) {
    super(localeKey, iconImage, (_type, args) => new Modifiers.PokemonAllMovePpRestoreModifier(this, (args[0] as PlayerPokemon).id, this.restorePoints),
      (pokemon: PlayerPokemon) => {
        if (!pokemon.getMoveset().filter(m => m?.ppUsed).length) {
          return PartyUiHandler.NoEffectMessage;
        }
        return null;
      }, "elixir");

    this.restorePoints = restorePoints;
  }

  getDescription(scene: BattleScene): string {
    return this.restorePoints > -1
      ? i18next.t("modifierType:ModifierType.PokemonAllMovePpRestoreModifierType.description", { restorePoints: this.restorePoints })
      : i18next.t("modifierType:ModifierType.PokemonAllMovePpRestoreModifierType.extra.fully")
    ;
  }
}

export class PokemonPpUpModifierType extends PokemonMoveModifierType {
  protected upPoints: integer;

  constructor(localeKey: string, iconImage: string, upPoints: integer) {
    super(localeKey, iconImage, (_type, args) => new Modifiers.PokemonPpUpModifier(this, (args[0] as PlayerPokemon).id, (args[1] as integer), this.upPoints),
      (_pokemon: PlayerPokemon) => {
        return null;
      }, (pokemonMove: PokemonMove) => {
        if (pokemonMove.getMove().pp < 5 || pokemonMove.ppUp >= 3) {
          return PartyUiHandler.NoEffectMessage;
        }
        return null;
      }, "ppUp");

    this.upPoints = upPoints;
  }

  getDescription(scene: BattleScene): string {
    return i18next.t("modifierType:ModifierType.PokemonPpUpModifierType.description", { upPoints: this.upPoints });
  }
}

export class PokemonNatureChangeModifierType extends PokemonModifierType {
  protected nature: Nature;

  constructor(nature: Nature) {
    super("", `mint_${Utils.getEnumKeys(Stat).find(s => getNatureStatMultiplier(nature, Stat[s]) > 1)?.toLowerCase() || "neutral" }`, ((_type, args) => new Modifiers.PokemonNatureChangeModifier(this, (args[0] as PlayerPokemon).id, this.nature)),
      ((pokemon: PlayerPokemon) => {
        if (pokemon.getNature() === this.nature) {
          return PartyUiHandler.NoEffectMessage;
        }
        return null;
      }), "mint");

    this.nature = nature;
  }

  get name(): string {
    return i18next.t("modifierType:ModifierType.PokemonNatureChangeModifierType.name", { natureName: getNatureName(this.nature) });
  }

  getDescription(scene: BattleScene): string {
    return i18next.t("modifierType:ModifierType.PokemonNatureChangeModifierType.description", { natureName: getNatureName(this.nature, true, true, true) });
  }
}

export class RememberMoveModifierType extends PokemonModifierType {
  constructor(localeKey: string, iconImage: string, group?: string) {
    super(localeKey, iconImage, (type, args) => new Modifiers.RememberMoveModifier(type, (args[0] as PlayerPokemon).id, (args[1] as integer)),
      (pokemon: PlayerPokemon) => {
        if (!pokemon.getLearnableLevelMoves().length) {
          return PartyUiHandler.NoEffectMessage;
        }
        return null;
      }, group);
  }
}

export class DoubleBattleChanceBoosterModifierType extends ModifierType {
  private maxBattles: number;

  constructor(localeKey: string, iconImage: string, maxBattles: number) {
    super(localeKey, iconImage, (_type, _args) => new Modifiers.DoubleBattleChanceBoosterModifier(this, maxBattles), "lure");

    this.maxBattles = maxBattles;
  }

  getDescription(_scene: BattleScene): string {
    return i18next.t("modifierType:ModifierType.DoubleBattleChanceBoosterModifierType.description", {
      battleCount: this.maxBattles
    });
  }
}

export class TempStatStageBoosterModifierType extends ModifierType implements GeneratedPersistentModifierType {
  private stat: TempBattleStat;
  private nameKey: string;
  private quantityKey: string;

  constructor(stat: TempBattleStat) {
    const nameKey = TempStatStageBoosterModifierTypeGenerator.items[stat];
    super("", nameKey, (_type, _args) => new Modifiers.TempStatStageBoosterModifier(this, this.stat, 5));

    this.stat = stat;
    this.nameKey = nameKey;
    this.quantityKey = (stat !== Stat.ACC) ? "percentage" : "stage";
  }

  get name(): string {
    return i18next.t(`modifierType:TempStatStageBoosterItem.${this.nameKey}`);
  }

  getDescription(_scene: BattleScene): string {
    return i18next.t("modifierType:ModifierType.TempStatStageBoosterModifierType.description", {
      stat: i18next.t(getStatKey(this.stat)),
      amount: i18next.t(`modifierType:ModifierType.TempStatStageBoosterModifierType.extra.${this.quantityKey}`)
    });
  }

  getPregenArgs(): any[] {
    return [ this.stat ];
  }
}

export class BerryModifierType extends PokemonHeldItemModifierType implements GeneratedPersistentModifierType {
  private berryType: BerryType;

  constructor(berryType: BerryType) {
    super("", `${BerryType[berryType].toLowerCase()}_berry`, (type, args) => new Modifiers.BerryModifier(type, (args[0] as Pokemon).id, berryType), "berry");

    this.berryType = berryType;
  }

  get name(): string {
    return getBerryName(this.berryType);
  }

  getDescription(scene: BattleScene): string {
    return getBerryEffectDescription(this.berryType);
  }

  getPregenArgs(): any[] {
    return [ this.berryType ];
  }
}

function getAttackTypeBoosterItemName(type: Type) {
  switch (type) {
  case Type.NORMAL:
    return "Silk Scarf";
  case Type.FIGHTING:
    return "Black Belt";
  case Type.FLYING:
    return "Sharp Beak";
  case Type.POISON:
    return "Poison Barb";
  case Type.GROUND:
    return "Soft Sand";
  case Type.ROCK:
    return "Hard Stone";
  case Type.BUG:
    return "Silver Powder";
  case Type.GHOST:
    return "Spell Tag";
  case Type.STEEL:
    return "Metal Coat";
  case Type.FIRE:
    return "Charcoal";
  case Type.WATER:
    return "Mystic Water";
  case Type.GRASS:
    return "Miracle Seed";
  case Type.ELECTRIC:
    return "Magnet";
  case Type.PSYCHIC:
    return "Twisted Spoon";
  case Type.ICE:
    return "Never-Melt Ice";
  case Type.DRAGON:
    return "Dragon Fang";
  case Type.DARK:
    return "Black Glasses";
  case Type.FAIRY:
    return "Fairy Feather";
  }
}

export class AttackTypeBoosterModifierType extends PokemonHeldItemModifierType implements GeneratedPersistentModifierType {
  public moveType: Type;
  public boostPercent: integer;

  constructor(moveType: Type, boostPercent: integer) {
    super("", `${getAttackTypeBoosterItemName(moveType)?.replace(/[ \-]/g, "_").toLowerCase()}`,
      (_type, args) => new Modifiers.AttackTypeBoosterModifier(this, (args[0] as Pokemon).id, moveType, boostPercent));

    this.moveType = moveType;
    this.boostPercent = boostPercent;
  }

  get name(): string {
    return i18next.t(`modifierType:AttackTypeBoosterItem.${getAttackTypeBoosterItemName(this.moveType)?.replace(/[ \-]/g, "_").toLowerCase()}`);
  }

  getDescription(scene: BattleScene): string {
    // TODO: Need getTypeName?
    return i18next.t("modifierType:ModifierType.AttackTypeBoosterModifierType.description", { moveType: i18next.t(`pokemonInfo:Type.${Type[this.moveType]}`) });
  }

  getPregenArgs(): any[] {
    return [ this.moveType ];
  }
}

export type SpeciesStatBoosterItem = keyof typeof SpeciesStatBoosterModifierTypeGenerator.items;

/**
 * Modifier type for {@linkcode Modifiers.SpeciesStatBoosterModifier}
 * @extends PokemonHeldItemModifierType
 * @implements GeneratedPersistentModifierType
 */
export class SpeciesStatBoosterModifierType extends PokemonHeldItemModifierType implements GeneratedPersistentModifierType {
  private key: SpeciesStatBoosterItem;

  constructor(key: SpeciesStatBoosterItem) {
    const item = SpeciesStatBoosterModifierTypeGenerator.items[key];
    super(`modifierType:SpeciesBoosterItem.${key}`, key.toLowerCase(), (type, args) => new Modifiers.SpeciesStatBoosterModifier(type, (args[0] as Pokemon).id, item.stats, item.multiplier, item.species));

    this.key = key;
  }

  getPregenArgs(): any[] {
    return [ this.key ];
  }
}

export class PokemonLevelIncrementModifierType extends PokemonModifierType {
  constructor(localeKey: string, iconImage: string) {
    super(localeKey, iconImage, (_type, args) => new Modifiers.PokemonLevelIncrementModifier(this, (args[0] as PlayerPokemon).id), (_pokemon: PlayerPokemon) => null);
  }

  getDescription(scene: BattleScene): string {
    let levels = 1;
    const hasCandyJar = scene.modifiers.find(modifier => modifier instanceof Modifiers.LevelIncrementBoosterModifier);
    if (hasCandyJar) {
      levels += hasCandyJar.stackCount;
    }
    return i18next.t("modifierType:ModifierType.PokemonLevelIncrementModifierType.description", { levels });
  }
}

export class AllPokemonLevelIncrementModifierType extends ModifierType {
  constructor(localeKey: string, iconImage: string) {
    super(localeKey, iconImage, (_type, _args) => new Modifiers.PokemonLevelIncrementModifier(this, -1));
  }

  getDescription(scene: BattleScene): string {
    let levels = 1;
    const hasCandyJar = scene.modifiers.find(modifier => modifier instanceof Modifiers.LevelIncrementBoosterModifier);
    if (hasCandyJar) {
      levels += hasCandyJar.stackCount;
    }
    return i18next.t("modifierType:ModifierType.AllPokemonLevelIncrementModifierType.description", { levels });
  }
}

export class BaseStatBoosterModifierType extends PokemonHeldItemModifierType implements GeneratedPersistentModifierType {
  private stat: PermanentStat;
  private key: string;

  constructor(stat: PermanentStat) {
    const key = BaseStatBoosterModifierTypeGenerator.items[stat];
    super("", key, (_type, args) => new Modifiers.BaseStatModifier(this, (args[0] as Pokemon).id, this.stat));

    this.stat = stat;
    this.key = key;
  }

  get name(): string {
    return i18next.t(`modifierType:BaseStatBoosterItem.${this.key}`);
  }

  getDescription(_scene: BattleScene): string {
    return i18next.t("modifierType:ModifierType.BaseStatBoosterModifierType.description", { stat: i18next.t(getStatKey(this.stat)) });
  }

  getPregenArgs(): any[] {
    return [ this.stat ];
  }
}

class AllPokemonFullHpRestoreModifierType extends ModifierType {
  private descriptionKey: string;

  constructor(localeKey: string, iconImage: string, descriptionKey?: string, newModifierFunc?: NewModifierFunc) {
    super(localeKey, iconImage, newModifierFunc || ((_type, _args) => new Modifiers.PokemonHpRestoreModifier(this, -1, 0, 100, false)));

    this.descriptionKey = descriptionKey!; // TODO: is this bang correct?
  }

  getDescription(scene: BattleScene): string {
    return i18next.t(`${this.descriptionKey || "modifierType:ModifierType.AllPokemonFullHpRestoreModifierType"}.description` as any);
  }
}

class AllPokemonFullReviveModifierType extends AllPokemonFullHpRestoreModifierType {
  constructor(localeKey: string, iconImage: string) {
    super(localeKey, iconImage, "modifierType:ModifierType.AllPokemonFullReviveModifierType", (_type, _args) => new Modifiers.PokemonHpRestoreModifier(this, -1, 0, 100, false, true));
  }
}

export class MoneyRewardModifierType extends ModifierType {
  private moneyMultiplier: number;
  private moneyMultiplierDescriptorKey: string;

  constructor(localeKey: string, iconImage: string, moneyMultiplier: number, moneyMultiplierDescriptorKey: string) {
    super(localeKey, iconImage, (_type, _args) => new Modifiers.MoneyRewardModifier(this, moneyMultiplier), "money", "se/buy");

    this.moneyMultiplier = moneyMultiplier;
    this.moneyMultiplierDescriptorKey = moneyMultiplierDescriptorKey;
  }

  getDescription(scene: BattleScene): string {
    const moneyAmount = new Utils.IntegerHolder(scene.getWaveMoneyAmount(this.moneyMultiplier));
    scene.applyModifiers(MoneyMultiplierModifier, true, moneyAmount);
    const formattedMoney = Utils.formatMoney(scene.moneyFormat, moneyAmount.value);

    return i18next.t("modifierType:ModifierType.MoneyRewardModifierType.description", {
      moneyMultiplier: i18next.t(this.moneyMultiplierDescriptorKey as any),
      moneyAmount: formattedMoney,
    });
  }
}

export class ExpBoosterModifierType extends ModifierType {
  private boostPercent: integer;

  constructor(localeKey: string, iconImage: string, boostPercent: integer) {
    super(localeKey, iconImage, () => new Modifiers.ExpBoosterModifier(this, boostPercent));

    this.boostPercent = boostPercent;
  }

  getDescription(scene: BattleScene): string {
    return i18next.t("modifierType:ModifierType.ExpBoosterModifierType.description", { boostPercent: this.boostPercent });
  }
}

export class PokemonExpBoosterModifierType extends PokemonHeldItemModifierType {
  private boostPercent: integer;

  constructor(localeKey: string, iconImage: string, boostPercent: integer) {
    super(localeKey, iconImage, (_type, args) => new Modifiers.PokemonExpBoosterModifier(this, (args[0] as Pokemon).id, boostPercent));

    this.boostPercent = boostPercent;
  }

  getDescription(scene: BattleScene): string {
    return i18next.t("modifierType:ModifierType.PokemonExpBoosterModifierType.description", { boostPercent: this.boostPercent });
  }
}

export class PokemonFriendshipBoosterModifierType extends PokemonHeldItemModifierType {
  constructor(localeKey: string, iconImage: string) {
    super(localeKey, iconImage, (_type, args) => new Modifiers.PokemonFriendshipBoosterModifier(this, (args[0] as Pokemon).id));
  }

  getDescription(scene: BattleScene): string {
    return i18next.t("modifierType:ModifierType.PokemonFriendshipBoosterModifierType.description");
  }
}

export class PokemonMoveAccuracyBoosterModifierType extends PokemonHeldItemModifierType {
  private amount: integer;

  constructor(localeKey: string, iconImage: string, amount: integer, group?: string, soundName?: string) {
    super(localeKey, iconImage, (_type, args) => new Modifiers.PokemonMoveAccuracyBoosterModifier(this, (args[0] as Pokemon).id, amount), group, soundName);

    this.amount = amount;
  }

  getDescription(scene: BattleScene): string {
    return i18next.t("modifierType:ModifierType.PokemonMoveAccuracyBoosterModifierType.description", { accuracyAmount: this.amount });
  }
}

export class PokemonMultiHitModifierType extends PokemonHeldItemModifierType {
  constructor(localeKey: string, iconImage: string) {
    super(localeKey, iconImage, (type, args) => new Modifiers.PokemonMultiHitModifier(type as PokemonMultiHitModifierType, (args[0] as Pokemon).id));
  }

  getDescription(scene: BattleScene): string {
    return i18next.t("modifierType:ModifierType.PokemonMultiHitModifierType.description");
  }
}

export class TmModifierType extends PokemonModifierType {
  public moveId: Moves;

  constructor(moveId: Moves) {
    super("", `tm_${Type[allMoves[moveId].type].toLowerCase()}`, (_type, args) => new Modifiers.TmModifier(this, (args[0] as PlayerPokemon).id),
      (pokemon: PlayerPokemon) => {
        if (pokemon.compatibleTms.indexOf(moveId) === -1 || pokemon.getMoveset().filter(m => m?.moveId === moveId).length) {
          return PartyUiHandler.NoEffectMessage;
        }
        return null;
      }, "tm");

    this.moveId = moveId;
  }

  get name(): string {
    return i18next.t("modifierType:ModifierType.TmModifierType.name", {
      moveId: Utils.padInt(Object.keys(tmSpecies).indexOf(this.moveId.toString()) + 1, 3),
      moveName: allMoves[this.moveId].name,
    });
  }

  getDescription(scene: BattleScene): string {
    return i18next.t(scene.enableMoveInfo ? "modifierType:ModifierType.TmModifierTypeWithInfo.description" : "modifierType:ModifierType.TmModifierType.description", { moveName: allMoves[this.moveId].name });
  }
}

export class EvolutionItemModifierType extends PokemonModifierType implements GeneratedPersistentModifierType {
  public evolutionItem: EvolutionItem;

  constructor(evolutionItem: EvolutionItem) {
    super("", EvolutionItem[evolutionItem].toLowerCase(), (_type, args) => new Modifiers.EvolutionItemModifier(this, (args[0] as PlayerPokemon).id),
      (pokemon: PlayerPokemon) => {
        if (pokemonEvolutions.hasOwnProperty(pokemon.species.speciesId) && pokemonEvolutions[pokemon.species.speciesId].filter(e => e.item === this.evolutionItem
          && (!e.condition || e.condition.predicate(pokemon)) && (e.preFormKey === null || e.preFormKey === pokemon.getFormKey())).length && (pokemon.getFormKey() !== SpeciesFormKey.GIGANTAMAX)) {
          return null;
        } else if (pokemon.isFusion() && pokemon.fusionSpecies && pokemonEvolutions.hasOwnProperty(pokemon.fusionSpecies.speciesId) && pokemonEvolutions[pokemon.fusionSpecies.speciesId].filter(e => e.item === this.evolutionItem
        && (!e.condition || e.condition.predicate(pokemon)) && (e.preFormKey === null || e.preFormKey === pokemon.getFusionFormKey())).length && (pokemon.getFusionFormKey() !== SpeciesFormKey.GIGANTAMAX)) {
          return null;
        }

        return PartyUiHandler.NoEffectMessage;
      });

    this.evolutionItem = evolutionItem;
  }

  get name(): string {
    return i18next.t(`modifierType:EvolutionItem.${EvolutionItem[this.evolutionItem]}`);
  }

  getDescription(scene: BattleScene): string {
    return i18next.t("modifierType:ModifierType.EvolutionItemModifierType.description");
  }

  getPregenArgs(): any[] {
    return [ this.evolutionItem ];
  }
}

/**
 * Class that represents form changing items
 */
export class FormChangeItemModifierType extends PokemonModifierType implements GeneratedPersistentModifierType {
  public formChangeItem: FormChangeItem;

  constructor(formChangeItem: FormChangeItem) {
    super("", FormChangeItem[formChangeItem].toLowerCase(), (_type, args) => new Modifiers.PokemonFormChangeItemModifier(this, (args[0] as PlayerPokemon).id, formChangeItem, true),
      (pokemon: PlayerPokemon) => {
        // Make sure the Pokemon has alternate forms
        if (pokemonFormChanges.hasOwnProperty(pokemon.species.speciesId)
          // Get all form changes for this species with an item trigger, including any compound triggers
          && pokemonFormChanges[pokemon.species.speciesId].filter(fc => fc.trigger.hasTriggerType(SpeciesFormChangeItemTrigger) && (fc.preFormKey === pokemon.getFormKey()))
          // Returns true if any form changes match this item
            .map(fc => fc.findTrigger(SpeciesFormChangeItemTrigger) as SpeciesFormChangeItemTrigger)
            .flat().flatMap(fc => fc.item).includes(this.formChangeItem)
        ) {
          return null;
        }

        return PartyUiHandler.NoEffectMessage;
      });

    this.formChangeItem = formChangeItem;
  }

  get name(): string {
    return i18next.t(`modifierType:FormChangeItem.${FormChangeItem[this.formChangeItem]}`);
  }

  getDescription(scene: BattleScene): string {
    return i18next.t("modifierType:ModifierType.FormChangeItemModifierType.description");
  }

  getPregenArgs(): any[] {
    return [ this.formChangeItem ];
  }
}

export class FusePokemonModifierType extends PokemonModifierType {
  constructor(localeKey: string, iconImage: string) {
    super(localeKey, iconImage, (_type, args) => new Modifiers.FusePokemonModifier(this, (args[0] as PlayerPokemon).id, (args[1] as PlayerPokemon).id),
      (pokemon: PlayerPokemon) => {
        if (pokemon.isFusion()) {
          return PartyUiHandler.NoEffectMessage;
        }
        return null;
      });
  }

  getDescription(scene: BattleScene): string {
    return i18next.t("modifierType:ModifierType.FusePokemonModifierType.description");
  }
}

class AttackTypeBoosterModifierTypeGenerator extends ModifierTypeGenerator {
  constructor() {
    super((party: Pokemon[], pregenArgs?: any[]) => {
      if (pregenArgs && (pregenArgs.length === 1) && (pregenArgs[0] in Type)) {
        return new AttackTypeBoosterModifierType(pregenArgs[0] as Type, 20);
      }

      const attackMoveTypes = party.map(p => p.getMoveset().map(m => m?.getMove()).filter(m => m instanceof AttackMove).map(m => m.type)).flat();
      if (!attackMoveTypes.length) {
        return null;
      }

      const attackMoveTypeWeights = new Map<Type, integer>();
      let totalWeight = 0;
      for (const t of attackMoveTypes) {
        if (attackMoveTypeWeights.has(t)) {
          if (attackMoveTypeWeights.get(t)! < 3) { // attackMoveTypeWeights.has(t) was checked before
            attackMoveTypeWeights.set(t, attackMoveTypeWeights.get(t)! + 1);
          } else {
            continue;
          }
        } else {
          attackMoveTypeWeights.set(t, 1);
        }
        totalWeight++;
      }

      if (!totalWeight) {
        return null;
      }

      let type: Type;

      const randInt = Utils.randSeedInt(totalWeight);
      let weight = 0;

      for (const t of attackMoveTypeWeights.keys()) {
        const typeWeight = attackMoveTypeWeights.get(t)!; // guranteed to be defined
        if (randInt <= weight + typeWeight) {
          type = t;
          break;
        }
        weight += typeWeight;
      }

      return new AttackTypeBoosterModifierType(type!, 20);
    });
  }
}

class BaseStatBoosterModifierTypeGenerator extends ModifierTypeGenerator {
  public static readonly items: Record<PermanentStat, string> = {
    [Stat.HP]: "hp_up",
    [Stat.ATK]: "protein",
    [Stat.DEF]: "iron",
    [Stat.SPATK]: "calcium",
    [Stat.SPDEF]: "zinc",
    [Stat.SPD]: "carbos"
  };

  constructor() {
    super((_party: Pokemon[], pregenArgs?: any[]) => {
      if (pregenArgs) {
        return new BaseStatBoosterModifierType(pregenArgs[0]);
      }
      const randStat: PermanentStat = Utils.randSeedInt(Stat.SPD + 1);
      return new BaseStatBoosterModifierType(randStat);
    });
  }
}

class TempStatStageBoosterModifierTypeGenerator extends ModifierTypeGenerator {
  public static readonly items: Record<TempBattleStat, string> = {
    [Stat.ATK]: "x_attack",
    [Stat.DEF]: "x_defense",
    [Stat.SPATK]: "x_sp_atk",
    [Stat.SPDEF]: "x_sp_def",
    [Stat.SPD]: "x_speed",
    [Stat.ACC]: "x_accuracy"
  };

  constructor() {
    super((_party: Pokemon[], pregenArgs?: any[]) => {
      if (pregenArgs && (pregenArgs.length === 1) && TEMP_BATTLE_STATS.includes(pregenArgs[0])) {
        return new TempStatStageBoosterModifierType(pregenArgs[0]);
      }
      const randStat: TempBattleStat = Utils.randSeedInt(Stat.ACC, Stat.ATK);
      return new TempStatStageBoosterModifierType(randStat);
    });
  }
}

/**
 * Modifier type generator for {@linkcode SpeciesStatBoosterModifierType}, which
 * encapsulates the logic for weighting the most useful held item from
 * the current list of {@linkcode items}.
 * @extends ModifierTypeGenerator
 */
class SpeciesStatBoosterModifierTypeGenerator extends ModifierTypeGenerator {
  /** Object comprised of the currently available species-based stat boosting held items */
  public static readonly items = {
    LIGHT_BALL: { stats: [Stat.ATK, Stat.SPATK], multiplier: 2, species: [Species.PIKACHU] },
    THICK_CLUB: { stats: [Stat.ATK], multiplier: 2, species: [Species.CUBONE, Species.MAROWAK, Species.ALOLA_MAROWAK] },
    METAL_POWDER: { stats: [Stat.DEF], multiplier: 2, species: [Species.DITTO] },
    QUICK_POWDER: { stats: [Stat.SPD], multiplier: 2, species: [Species.DITTO] },
  };

  constructor() {
    super((party: Pokemon[], pregenArgs?: any[]) => {
      const items = SpeciesStatBoosterModifierTypeGenerator.items;
      if (pregenArgs && (pregenArgs.length === 1) && (pregenArgs[0] in items)) {
        return new SpeciesStatBoosterModifierType(pregenArgs[0] as SpeciesStatBoosterItem);
      }

      const values = Object.values(items);
      const keys = Object.keys(items);
      const weights = keys.map(() => 0);

      for (const p of party) {
        const speciesId = p.getSpeciesForm(true).speciesId;
        const fusionSpeciesId = p.isFusion() ? p.getFusionSpeciesForm(true).speciesId : null;
        const hasFling = p.getMoveset(true).some(m => m?.moveId === Moves.FLING);

        for (const i in values) {
          const checkedSpecies = values[i].species;
          const checkedStats = values[i].stats;

          // If party member already has the item being weighted currently, skip to the next item
          const hasItem = p.getHeldItems().some(m => m instanceof Modifiers.SpeciesStatBoosterModifier
            && (m as Modifiers.SpeciesStatBoosterModifier).contains(checkedSpecies[0], checkedStats[0]));

          if (!hasItem) {
            if (checkedSpecies.includes(speciesId) || (!!fusionSpeciesId && checkedSpecies.includes(fusionSpeciesId))) {
              // Add weight if party member has a matching species or, if applicable, a matching fusion species
              weights[i]++;
            } else if (checkedSpecies.includes(Species.PIKACHU) && hasFling) {
              // Add weight to Light Ball if party member has Fling
              weights[i]++;
            }
          }
        }
      }

      let totalWeight = 0;
      for (const weight of weights) {
        totalWeight += weight;
      }

      if (totalWeight !== 0) {
        const randInt = Utils.randSeedInt(totalWeight, 1);
        let weight = 0;

        for (const i in weights) {
          if (weights[i] !== 0) {
            const curWeight = weight + weights[i];
            if (randInt <= weight + weights[i]) {
              return new SpeciesStatBoosterModifierType(keys[i] as SpeciesStatBoosterItem);
            }
            weight = curWeight;
          }
        }
      }

      return null;
    });
  }
}

class TmModifierTypeGenerator extends ModifierTypeGenerator {
  constructor(tier: ModifierTier) {
    super((party: Pokemon[], pregenArgs?: any[]) => {
      if (pregenArgs && (pregenArgs.length === 1) && (pregenArgs[0] in Moves)) {
        return new TmModifierType(pregenArgs[0] as Moves);
      }
      const partyMemberCompatibleTms = party.map(p => (p as PlayerPokemon).compatibleTms.filter(tm => !p.moveset.find(m => m?.moveId === tm)));
      const tierUniqueCompatibleTms = partyMemberCompatibleTms.flat().filter(tm => tmPoolTiers[tm] === tier).filter(tm => !allMoves[tm].name.endsWith(" (N)")).filter((tm, i, array) => array.indexOf(tm) === i);
      if (!tierUniqueCompatibleTms.length) {
        return null;
      }
      const randTmIndex = Utils.randSeedInt(tierUniqueCompatibleTms.length);
      return new TmModifierType(tierUniqueCompatibleTms[randTmIndex]);
    });
  }
}

class EvolutionItemModifierTypeGenerator extends ModifierTypeGenerator {
  constructor(rare: boolean) {
    super((party: Pokemon[], pregenArgs?: any[]) => {
      if (pregenArgs && (pregenArgs.length === 1) && (pregenArgs[0] in EvolutionItem)) {
        return new EvolutionItemModifierType(pregenArgs[0] as EvolutionItem);
      }

      const evolutionItemPool = [
        party.filter(p => pokemonEvolutions.hasOwnProperty(p.species.speciesId)).map(p => {
          const evolutions = pokemonEvolutions[p.species.speciesId];
          return evolutions.filter(e => e.item !== EvolutionItem.NONE && (e.evoFormKey === null || (e.preFormKey || "") === p.getFormKey()) && (!e.condition || e.condition.predicate(p)));
        }).flat(),
        party.filter(p => p.isFusion() && p.fusionSpecies && pokemonEvolutions.hasOwnProperty(p.fusionSpecies.speciesId)).map(p => {
          const evolutions = pokemonEvolutions[p.fusionSpecies!.speciesId];
          return evolutions.filter(e => e.item !== EvolutionItem.NONE && (e.evoFormKey === null || (e.preFormKey || "") === p.getFusionFormKey()) && (!e.condition || e.condition.predicate(p)));
        }).flat()
      ].flat().flatMap(e => e.item).filter(i => (!!i && i > 50) === rare);

      if (!evolutionItemPool.length) {
        return null;
      }

      return new EvolutionItemModifierType(evolutionItemPool[Utils.randSeedInt(evolutionItemPool.length)]!); // TODO: is the bang correct?
    });
  }
}

class FormChangeItemModifierTypeGenerator extends ModifierTypeGenerator {
  constructor(rare: boolean) {
    super((party: Pokemon[], pregenArgs?: any[]) => {
      if (pregenArgs && (pregenArgs.length === 1) && (pregenArgs[0] in FormChangeItem)) {
        return new FormChangeItemModifierType(pregenArgs[0] as FormChangeItem);
      }

      const formChangeItemPool = [...new Set(party.filter(p => pokemonFormChanges.hasOwnProperty(p.species.speciesId)).map(p => {
        const formChanges = pokemonFormChanges[p.species.speciesId];
        let formChangeItemTriggers = formChanges.filter(fc => ((fc.formKey.indexOf(SpeciesFormKey.MEGA) === -1 && fc.formKey.indexOf(SpeciesFormKey.PRIMAL) === -1) || party[0].scene.getModifiers(Modifiers.MegaEvolutionAccessModifier).length)
          && ((fc.formKey.indexOf(SpeciesFormKey.GIGANTAMAX) === -1 && fc.formKey.indexOf(SpeciesFormKey.ETERNAMAX) === -1) || party[0].scene.getModifiers(Modifiers.GigantamaxAccessModifier).length)
          && (!fc.conditions.length || fc.conditions.filter(cond => cond instanceof SpeciesFormChangeCondition && cond.predicate(p)).length)
          && (fc.preFormKey === p.getFormKey()))
          .map(fc => fc.findTrigger(SpeciesFormChangeItemTrigger) as SpeciesFormChangeItemTrigger)
          .filter(t => t && t.active && !p.scene.findModifier(m => m instanceof Modifiers.PokemonFormChangeItemModifier && m.pokemonId === p.id && m.formChangeItem === t.item));

        if (p.species.speciesId === Species.NECROZMA) {
          // technically we could use a simplified version and check for formChanges.length > 3, but in case any code changes later, this might break...

          let foundULTRA_Z = false,
            foundN_LUNA = false,
            foundN_SOLAR = false;
          formChangeItemTriggers.forEach((fc, i) => {
            switch (fc.item) {
            case FormChangeItem.ULTRANECROZIUM_Z:
              foundULTRA_Z = true;
              break;
            case FormChangeItem.N_LUNARIZER:
              foundN_LUNA = true;
              break;
            case FormChangeItem.N_SOLARIZER:
              foundN_SOLAR = true;
              break;
            }
          });
          if (foundULTRA_Z && foundN_LUNA && foundN_SOLAR) {
            // all three items are present -> user hasn't acquired any of the N_*ARIZERs -> block ULTRANECROZIUM_Z acquisition.
            formChangeItemTriggers = formChangeItemTriggers.filter(fc => fc.item !== FormChangeItem.ULTRANECROZIUM_Z);
          }
        }
        return formChangeItemTriggers;
      }).flat())
      ].flat().flatMap(fc => fc.item).filter(i => (i && i < 100) === rare);
      // convert it into a set to remove duplicate values, which can appear when the same species with a potential form change is in the party.

      if (!formChangeItemPool.length) {
        return null;
      }

      return new FormChangeItemModifierType(formChangeItemPool[Utils.randSeedInt(formChangeItemPool.length)]);
    });
  }
}

export class TerastallizeModifierType extends PokemonHeldItemModifierType implements GeneratedPersistentModifierType {
  private teraType: Type;

  constructor(teraType: Type) {
    super("", `${Type[teraType].toLowerCase()}_tera_shard`, (type, args) => new Modifiers.TerastallizeModifier(type as TerastallizeModifierType, (args[0] as Pokemon).id, teraType), "tera_shard");

    this.teraType = teraType;
  }

  get name(): string {
    return i18next.t("modifierType:ModifierType.TerastallizeModifierType.name", { teraType: i18next.t(`pokemonInfo:Type.${Type[this.teraType]}`) });
  }

  getDescription(scene: BattleScene): string {
    return i18next.t("modifierType:ModifierType.TerastallizeModifierType.description", { teraType: i18next.t(`pokemonInfo:Type.${Type[this.teraType]}`) });
  }

  getPregenArgs(): any[] {
    return [ this.teraType ];
  }
}

export class ContactHeldItemTransferChanceModifierType extends PokemonHeldItemModifierType {
  private chancePercent: integer;

  constructor(localeKey: string, iconImage: string, chancePercent: integer, group?: string, soundName?: string) {
    super(localeKey, iconImage, (type, args) => new Modifiers.ContactHeldItemTransferChanceModifier(type, (args[0] as Pokemon).id, chancePercent), group, soundName);

    this.chancePercent = chancePercent;
  }

  getDescription(scene: BattleScene): string {
    return i18next.t("modifierType:ModifierType.ContactHeldItemTransferChanceModifierType.description", { chancePercent: this.chancePercent });
  }
}

export class TurnHeldItemTransferModifierType extends PokemonHeldItemModifierType {
  constructor(localeKey: string, iconImage: string, group?: string, soundName?: string) {
    super(localeKey, iconImage, (type, args) => new Modifiers.TurnHeldItemTransferModifier(type, (args[0] as Pokemon).id), group, soundName);
  }

  getDescription(scene: BattleScene): string {
    return i18next.t("modifierType:ModifierType.TurnHeldItemTransferModifierType.description");
  }
}

export class EnemyAttackStatusEffectChanceModifierType extends ModifierType {
  private chancePercent: integer;
  private effect: StatusEffect;

  constructor(localeKey: string, iconImage: string, chancePercent: integer, effect: StatusEffect, stackCount?: integer) {
    super(localeKey, iconImage, (type, args) => new Modifiers.EnemyAttackStatusEffectChanceModifier(type, effect, chancePercent, stackCount), "enemy_status_chance");

    this.chancePercent = chancePercent;
    this.effect = effect;
  }

  getDescription(scene: BattleScene): string {
    return i18next.t("modifierType:ModifierType.EnemyAttackStatusEffectChanceModifierType.description", {
      chancePercent: this.chancePercent,
      statusEffect: getStatusEffectDescriptor(this.effect),
    });
  }
}

export class EnemyEndureChanceModifierType extends ModifierType {
  private chancePercent: number;

  constructor(localeKey: string, iconImage: string, chancePercent: number) {
    super(localeKey, iconImage, (type, _args) => new Modifiers.EnemyEndureChanceModifier(type, chancePercent), "enemy_endure");

    this.chancePercent = chancePercent;
  }

  getDescription(scene: BattleScene): string {
    return i18next.t("modifierType:ModifierType.EnemyEndureChanceModifierType.description", { chancePercent: this.chancePercent });
  }
}

export type ModifierTypeFunc = () => ModifierType;
type WeightedModifierTypeWeightFunc = (party: Pokemon[], rerollCount?: integer) => integer;

/**
 * High order function that returns a WeightedModifierTypeWeightFunc that will only be applied on
 * classic and skip an ModifierType if current wave is greater or equal to the one passed down
 * @param wave - Wave where we should stop showing the modifier
 * @param defaultWeight - ModifierType default weight
 * @returns A WeightedModifierTypeWeightFunc
 */
function skipInClassicAfterWave(wave: integer, defaultWeight: integer): WeightedModifierTypeWeightFunc {
  return (party: Pokemon[]) => {
    const gameMode =  party[0].scene.gameMode;
    const currentWave = party[0].scene.currentBattle.waveIndex;
    return gameMode.isClassic && currentWave >= wave ? 0 : defaultWeight;
  };
}

/**
 * High order function that returns a WeightedModifierTypeWeightFunc that will only be applied on
 * classic and it will skip a ModifierType if it is the last wave pull.
 * @param defaultWeight ModifierType default weight
 * @returns A WeightedModifierTypeWeightFunc
 */
function skipInLastClassicWaveOrDefault(defaultWeight: integer) : WeightedModifierTypeWeightFunc {
  return skipInClassicAfterWave(199, defaultWeight);
}
class WeightedModifierType {
  public modifierType: ModifierType;
  public weight: integer | WeightedModifierTypeWeightFunc;
  public maxWeight: integer;

  constructor(modifierTypeFunc: ModifierTypeFunc, weight: integer | WeightedModifierTypeWeightFunc, maxWeight?: integer) {
    this.modifierType = modifierTypeFunc();
    this.modifierType.id = Object.keys(modifierTypes).find(k => modifierTypes[k] === modifierTypeFunc)!; // TODO: is this bang correct?
    this.weight = weight;
    this.maxWeight = maxWeight || (!(weight instanceof Function) ? weight : 0);
  }

  setTier(tier: ModifierTier) {
    this.modifierType.setTier(tier);
  }
}

type BaseModifierOverride = {
  name: Exclude<ModifierTypeKeys, GeneratorModifierOverride["name"]>;
  count?: number;
};

/** Type for modifiers and held items that are constructed via {@linkcode ModifierTypeGenerator}. */
export type GeneratorModifierOverride = {
  count?: number;
} & (
  | {
      name: keyof Pick<typeof modifierTypes, "SPECIES_STAT_BOOSTER">;
      type?: SpeciesStatBoosterItem;
    }
  | {
      name: keyof Pick<typeof modifierTypes, "TEMP_STAT_STAGE_BOOSTER">;
      type?: TempBattleStat;
    }
  | {
      name: keyof Pick<typeof modifierTypes, "BASE_STAT_BOOSTER">;
      type?: Stat;
    }
  | {
      name: keyof Pick<typeof modifierTypes, "MINT">;
      type?: Nature;
    }
  | {
      name: keyof Pick<typeof modifierTypes, "ATTACK_TYPE_BOOSTER" | "TERA_SHARD">;
      type?: Type;
    }
  | {
      name: keyof Pick<typeof modifierTypes, "BERRY">;
      type?: BerryType;
    }
  | {
      name: keyof Pick<typeof modifierTypes, "EVOLUTION_ITEM" | "RARE_EVOLUTION_ITEM">;
      type?: EvolutionItem;
    }
  | {
      name: keyof Pick<typeof modifierTypes, "FORM_CHANGE_ITEM">;
      type?: FormChangeItem;
    }
  | {
      name: keyof Pick<typeof modifierTypes, "TM_COMMON" | "TM_GREAT" | "TM_ULTRA">;
      type?: Moves;
    }
);

/** Type used to construct modifiers and held items for overriding purposes. */
export type ModifierOverride = GeneratorModifierOverride | BaseModifierOverride;

export type ModifierTypeKeys = keyof typeof modifierTypes;

export const modifierTypes = {
  POKEBALL: () => new AddPokeballModifierType("pb", PokeballType.POKEBALL, 5),
  GREAT_BALL: () => new AddPokeballModifierType("gb", PokeballType.GREAT_BALL, 5),
  ULTRA_BALL: () => new AddPokeballModifierType("ub", PokeballType.ULTRA_BALL, 5),
  ROGUE_BALL: () => new AddPokeballModifierType("rb", PokeballType.ROGUE_BALL, 5),
  MASTER_BALL: () => new AddPokeballModifierType("mb", PokeballType.MASTER_BALL, 1),

  RARE_CANDY: () => new PokemonLevelIncrementModifierType("modifierType:ModifierType.RARE_CANDY", "rare_candy"),
  RARER_CANDY: () => new AllPokemonLevelIncrementModifierType("modifierType:ModifierType.RARER_CANDY", "rarer_candy"),

  EVOLUTION_ITEM: () => new EvolutionItemModifierTypeGenerator(false),
  RARE_EVOLUTION_ITEM: () => new EvolutionItemModifierTypeGenerator(true),
  FORM_CHANGE_ITEM: () => new FormChangeItemModifierTypeGenerator(false),
  RARE_FORM_CHANGE_ITEM: () => new FormChangeItemModifierTypeGenerator(true),

  MEGA_BRACELET: () => new ModifierType("modifierType:ModifierType.MEGA_BRACELET", "mega_bracelet", (type, _args) => new Modifiers.MegaEvolutionAccessModifier(type)),
  DYNAMAX_BAND: () => new ModifierType("modifierType:ModifierType.DYNAMAX_BAND", "dynamax_band", (type, _args) => new Modifiers.GigantamaxAccessModifier(type)),
  TERA_ORB: () => new ModifierType("modifierType:ModifierType.TERA_ORB", "tera_orb", (type, _args) => new Modifiers.TerastallizeAccessModifier(type)),

  MAP: () => new ModifierType("modifierType:ModifierType.MAP", "map", (type, _args) => new Modifiers.MapModifier(type)),

  POTION: () => new PokemonHpRestoreModifierType("modifierType:ModifierType.POTION", "potion", 20, 10),
  SUPER_POTION: () => new PokemonHpRestoreModifierType("modifierType:ModifierType.SUPER_POTION", "super_potion", 50, 25),
  HYPER_POTION: () => new PokemonHpRestoreModifierType("modifierType:ModifierType.HYPER_POTION", "hyper_potion", 200, 50),
  MAX_POTION: () => new PokemonHpRestoreModifierType("modifierType:ModifierType.MAX_POTION", "max_potion", 0, 100),
  FULL_RESTORE: () => new PokemonHpRestoreModifierType("modifierType:ModifierType.FULL_RESTORE", "full_restore", 0, 100, true),

  REVIVE: () => new PokemonReviveModifierType("modifierType:ModifierType.REVIVE", "revive", 50),
  MAX_REVIVE: () => new PokemonReviveModifierType("modifierType:ModifierType.MAX_REVIVE", "max_revive", 100),

  FULL_HEAL: () => new PokemonStatusHealModifierType("modifierType:ModifierType.FULL_HEAL", "full_heal"),

  SACRED_ASH: () => new AllPokemonFullReviveModifierType("modifierType:ModifierType.SACRED_ASH", "sacred_ash"),

  REVIVER_SEED: () => new PokemonHeldItemModifierType("modifierType:ModifierType.REVIVER_SEED", "reviver_seed", (type, args) => new Modifiers.PokemonInstantReviveModifier(type, (args[0] as Pokemon).id)),
  WHITE_HERB: () => new PokemonHeldItemModifierType("modifierType:ModifierType.WHITE_HERB", "white_herb", (type, args) => new Modifiers.ResetNegativeStatStageModifier(type, (args[0] as Pokemon).id)),

  ETHER: () => new PokemonPpRestoreModifierType("modifierType:ModifierType.ETHER", "ether", 10),
  MAX_ETHER: () => new PokemonPpRestoreModifierType("modifierType:ModifierType.MAX_ETHER", "max_ether", -1),

  ELIXIR: () => new PokemonAllMovePpRestoreModifierType("modifierType:ModifierType.ELIXIR", "elixir", 10),
  MAX_ELIXIR: () => new PokemonAllMovePpRestoreModifierType("modifierType:ModifierType.MAX_ELIXIR", "max_elixir", -1),

  PP_UP: () => new PokemonPpUpModifierType("modifierType:ModifierType.PP_UP", "pp_up", 1),
  PP_MAX: () => new PokemonPpUpModifierType("modifierType:ModifierType.PP_MAX", "pp_max", 3),

  /*REPEL: () => new DoubleBattleChanceBoosterModifierType('Repel', 5),
  SUPER_REPEL: () => new DoubleBattleChanceBoosterModifierType('Super Repel', 10),
  MAX_REPEL: () => new DoubleBattleChanceBoosterModifierType('Max Repel', 25),*/

  LURE: () => new DoubleBattleChanceBoosterModifierType("modifierType:ModifierType.LURE", "lure", 10),
  SUPER_LURE: () => new DoubleBattleChanceBoosterModifierType("modifierType:ModifierType.SUPER_LURE", "super_lure", 15),
  MAX_LURE: () => new DoubleBattleChanceBoosterModifierType("modifierType:ModifierType.MAX_LURE", "max_lure", 30),

  SPECIES_STAT_BOOSTER: () => new SpeciesStatBoosterModifierTypeGenerator(),

  TEMP_STAT_STAGE_BOOSTER: () => new TempStatStageBoosterModifierTypeGenerator(),

  DIRE_HIT: () => new class extends ModifierType {
    getDescription(_scene: BattleScene): string {
      return i18next.t("modifierType:ModifierType.TempStatStageBoosterModifierType.description", {
        stat: i18next.t("modifierType:ModifierType.DIRE_HIT.extra.raises"),
        amount: i18next.t("modifierType:ModifierType.TempStatStageBoosterModifierType.extra.stage")
      });
    }
  }("modifierType:ModifierType.DIRE_HIT", "dire_hit", (type, _args) => new Modifiers.TempCritBoosterModifier(type, 5)),

  BASE_STAT_BOOSTER: () => new BaseStatBoosterModifierTypeGenerator(),

  ATTACK_TYPE_BOOSTER: () => new AttackTypeBoosterModifierTypeGenerator(),

  MINT: () => new ModifierTypeGenerator((party: Pokemon[], pregenArgs?: any[]) => {
    if (pregenArgs && (pregenArgs.length === 1) && (pregenArgs[0] in Nature)) {
      return new PokemonNatureChangeModifierType(pregenArgs[0] as Nature);
    }
    return new PokemonNatureChangeModifierType(Utils.randSeedInt(Utils.getEnumValues(Nature).length) as Nature);
  }),

  TERA_SHARD: () => new ModifierTypeGenerator((party: Pokemon[], pregenArgs?: any[]) => {
    if (pregenArgs && (pregenArgs.length === 1) && (pregenArgs[0] in Type)) {
      return new TerastallizeModifierType(pregenArgs[0] as Type);
    }
    if (!party[0].scene.getModifiers(Modifiers.TerastallizeAccessModifier).length) {
      return null;
    }
    let type: Type;
    if (!Utils.randSeedInt(3)) {
      const partyMemberTypes = party.map(p => p.getTypes(false, false, true)).flat();
      type = Utils.randSeedItem(partyMemberTypes);
    } else {
      type = Utils.randSeedInt(64) ? Utils.randSeedInt(18) as Type : Type.STELLAR;
    }
    return new TerastallizeModifierType(type);
  }),

  BERRY: () => new ModifierTypeGenerator((party: Pokemon[], pregenArgs?: any[]) => {
    if (pregenArgs && (pregenArgs.length === 1) && (pregenArgs[0] in BerryType)) {
      return new BerryModifierType(pregenArgs[0] as BerryType);
    }
    const berryTypes = Utils.getEnumValues(BerryType);
    let randBerryType: BerryType;
    const rand = Utils.randSeedInt(12);
    if (rand < 2) {
      randBerryType = BerryType.SITRUS;
    } else if (rand < 4) {
      randBerryType = BerryType.LUM;
    } else if (rand < 6) {
      randBerryType = BerryType.LEPPA;
    } else {
      randBerryType = berryTypes[Utils.randSeedInt(berryTypes.length - 3) + 2];
    }
    return new BerryModifierType(randBerryType);
  }),

  TM_COMMON: () => new TmModifierTypeGenerator(ModifierTier.COMMON),
  TM_GREAT: () => new TmModifierTypeGenerator(ModifierTier.GREAT),
  TM_ULTRA: () => new TmModifierTypeGenerator(ModifierTier.ULTRA),

  MEMORY_MUSHROOM: () => new RememberMoveModifierType("modifierType:ModifierType.MEMORY_MUSHROOM", "big_mushroom"),

  EXP_SHARE: () => new ModifierType("modifierType:ModifierType.EXP_SHARE", "exp_share", (type, _args) => new Modifiers.ExpShareModifier(type)),
  EXP_BALANCE: () => new ModifierType("modifierType:ModifierType.EXP_BALANCE", "exp_balance", (type, _args) => new Modifiers.ExpBalanceModifier(type)),

  OVAL_CHARM: () => new ModifierType("modifierType:ModifierType.OVAL_CHARM", "oval_charm", (type, _args) => new Modifiers.MultipleParticipantExpBonusModifier(type)),

  EXP_CHARM: () => new ExpBoosterModifierType("modifierType:ModifierType.EXP_CHARM", "exp_charm", 25),
  SUPER_EXP_CHARM: () => new ExpBoosterModifierType("modifierType:ModifierType.SUPER_EXP_CHARM", "super_exp_charm", 60),
  GOLDEN_EXP_CHARM: () => new ExpBoosterModifierType("modifierType:ModifierType.GOLDEN_EXP_CHARM", "golden_exp_charm", 100),

  LUCKY_EGG: () => new PokemonExpBoosterModifierType("modifierType:ModifierType.LUCKY_EGG", "lucky_egg", 40),
  GOLDEN_EGG: () => new PokemonExpBoosterModifierType("modifierType:ModifierType.GOLDEN_EGG", "golden_egg", 100),

  SOOTHE_BELL: () => new PokemonFriendshipBoosterModifierType("modifierType:ModifierType.SOOTHE_BELL", "soothe_bell"),

  SCOPE_LENS: () => new PokemonHeldItemModifierType("modifierType:ModifierType.SCOPE_LENS", "scope_lens", (type, args) => new Modifiers.CritBoosterModifier(type, (args[0] as Pokemon).id, 1)),
  LEEK: () => new PokemonHeldItemModifierType("modifierType:ModifierType.LEEK", "leek", (type, args) => new Modifiers.SpeciesCritBoosterModifier(type, (args[0] as Pokemon).id, 2, [Species.FARFETCHD, Species.GALAR_FARFETCHD, Species.SIRFETCHD])),

  EVIOLITE: () => new PokemonHeldItemModifierType("modifierType:ModifierType.EVIOLITE", "eviolite", (type, args) => new Modifiers.EvolutionStatBoosterModifier(type, (args[0] as Pokemon).id, [Stat.DEF, Stat.SPDEF], 1.5)),

  SOUL_DEW: () => new PokemonHeldItemModifierType("modifierType:ModifierType.SOUL_DEW", "soul_dew", (type, args) => new Modifiers.PokemonNatureWeightModifier(type, (args[0] as Pokemon).id)),

  NUGGET: () => new MoneyRewardModifierType("modifierType:ModifierType.NUGGET", "nugget", 1, "modifierType:ModifierType.MoneyRewardModifierType.extra.small"),
  BIG_NUGGET: () => new MoneyRewardModifierType("modifierType:ModifierType.BIG_NUGGET", "big_nugget", 2.5, "modifierType:ModifierType.MoneyRewardModifierType.extra.moderate"),
  RELIC_GOLD: () => new MoneyRewardModifierType("modifierType:ModifierType.RELIC_GOLD", "relic_gold", 10, "modifierType:ModifierType.MoneyRewardModifierType.extra.large"),

  AMULET_COIN: () => new ModifierType("modifierType:ModifierType.AMULET_COIN", "amulet_coin", (type, _args) => new Modifiers.MoneyMultiplierModifier(type)),
  GOLDEN_PUNCH: () => new PokemonHeldItemModifierType("modifierType:ModifierType.GOLDEN_PUNCH", "golden_punch", (type, args) => new Modifiers.DamageMoneyRewardModifier(type, (args[0] as Pokemon).id)),
  COIN_CASE: () => new ModifierType("modifierType:ModifierType.COIN_CASE", "coin_case", (type, _args) => new Modifiers.MoneyInterestModifier(type)),

  LOCK_CAPSULE: () => new ModifierType("modifierType:ModifierType.LOCK_CAPSULE", "lock_capsule", (type, _args) => new Modifiers.LockModifierTiersModifier(type)),

  GRIP_CLAW: () => new ContactHeldItemTransferChanceModifierType("modifierType:ModifierType.GRIP_CLAW", "grip_claw", 10),
  WIDE_LENS: () => new PokemonMoveAccuracyBoosterModifierType("modifierType:ModifierType.WIDE_LENS", "wide_lens", 5),

  MULTI_LENS: () => new PokemonMultiHitModifierType("modifierType:ModifierType.MULTI_LENS", "zoom_lens"),

  HEALING_CHARM: () => new ModifierType("modifierType:ModifierType.HEALING_CHARM", "healing_charm", (type, _args) => new Modifiers.HealingBoosterModifier(type, 1.1)),
  CANDY_JAR: () => new ModifierType("modifierType:ModifierType.CANDY_JAR", "candy_jar", (type, _args) => new Modifiers.LevelIncrementBoosterModifier(type)),

  BERRY_POUCH: () => new ModifierType("modifierType:ModifierType.BERRY_POUCH", "berry_pouch", (type, _args) => new Modifiers.PreserveBerryModifier(type)),

  FOCUS_BAND: () => new PokemonHeldItemModifierType("modifierType:ModifierType.FOCUS_BAND", "focus_band", (type, args) => new Modifiers.SurviveDamageModifier(type, (args[0] as Pokemon).id)),

  QUICK_CLAW: () => new PokemonHeldItemModifierType("modifierType:ModifierType.QUICK_CLAW", "quick_claw", (type, args) => new Modifiers.BypassSpeedChanceModifier(type, (args[0] as Pokemon).id)),

  KINGS_ROCK: () => new PokemonHeldItemModifierType("modifierType:ModifierType.KINGS_ROCK", "kings_rock", (type, args) => new Modifiers.FlinchChanceModifier(type, (args[0] as Pokemon).id)),

  LEFTOVERS: () => new PokemonHeldItemModifierType("modifierType:ModifierType.LEFTOVERS", "leftovers", (type, args) => new Modifiers.TurnHealModifier(type, (args[0] as Pokemon).id)),
  SHELL_BELL: () => new PokemonHeldItemModifierType("modifierType:ModifierType.SHELL_BELL", "shell_bell", (type, args) => new Modifiers.HitHealModifier(type, (args[0] as Pokemon).id)),

  TOXIC_ORB: () => new PokemonHeldItemModifierType("modifierType:ModifierType.TOXIC_ORB", "toxic_orb", (type, args) => new Modifiers.TurnStatusEffectModifier(type, (args[0] as Pokemon).id)),
  FLAME_ORB: () => new PokemonHeldItemModifierType("modifierType:ModifierType.FLAME_ORB", "flame_orb", (type, args) => new Modifiers.TurnStatusEffectModifier(type, (args[0] as Pokemon).id)),

  BATON: () => new PokemonHeldItemModifierType("modifierType:ModifierType.BATON", "baton", (type, args) => new Modifiers.SwitchEffectTransferModifier(type, (args[0] as Pokemon).id)),

  SHINY_CHARM: () => new ModifierType("modifierType:ModifierType.SHINY_CHARM", "shiny_charm", (type, _args) => new Modifiers.ShinyRateBoosterModifier(type)),
  ABILITY_CHARM: () => new ModifierType("modifierType:ModifierType.ABILITY_CHARM", "ability_charm", (type, _args) => new Modifiers.HiddenAbilityRateBoosterModifier(type)),

  IV_SCANNER: () => new ModifierType("modifierType:ModifierType.IV_SCANNER", "scanner", (type, _args) => new Modifiers.IvScannerModifier(type)),

  DNA_SPLICERS: () => new FusePokemonModifierType("modifierType:ModifierType.DNA_SPLICERS", "dna_splicers"),

  MINI_BLACK_HOLE: () => new TurnHeldItemTransferModifierType("modifierType:ModifierType.MINI_BLACK_HOLE", "mini_black_hole"),

  VOUCHER: () => new AddVoucherModifierType(VoucherType.REGULAR, 1),
  VOUCHER_PLUS: () => new AddVoucherModifierType(VoucherType.PLUS, 1),
  VOUCHER_PREMIUM: () => new AddVoucherModifierType(VoucherType.PREMIUM, 1),

  GOLDEN_POKEBALL: () => new ModifierType("modifierType:ModifierType.GOLDEN_POKEBALL", "pb_gold", (type, _args) => new Modifiers.ExtraModifierModifier(type), undefined, "se/pb_bounce_1"),

  ENEMY_DAMAGE_BOOSTER: () => new ModifierType("modifierType:ModifierType.ENEMY_DAMAGE_BOOSTER", "wl_item_drop", (type, _args) => new Modifiers.EnemyDamageBoosterModifier(type, 5)),
  ENEMY_DAMAGE_REDUCTION: () => new ModifierType("modifierType:ModifierType.ENEMY_DAMAGE_REDUCTION", "wl_guard_spec", (type, _args) => new Modifiers.EnemyDamageReducerModifier(type, 2.5)),
  //ENEMY_SUPER_EFFECT_BOOSTER: () => new ModifierType('Type Advantage Token', 'Increases damage of super effective attacks by 30%', (type, _args) => new Modifiers.EnemySuperEffectiveDamageBoosterModifier(type, 30), 'wl_custom_super_effective'),
  ENEMY_HEAL: () => new ModifierType("modifierType:ModifierType.ENEMY_HEAL", "wl_potion", (type, _args) => new Modifiers.EnemyTurnHealModifier(type, 2, 10)),
  ENEMY_ATTACK_POISON_CHANCE: () => new EnemyAttackStatusEffectChanceModifierType("modifierType:ModifierType.ENEMY_ATTACK_POISON_CHANCE", "wl_antidote", 5, StatusEffect.POISON, 10),
  ENEMY_ATTACK_PARALYZE_CHANCE: () => new EnemyAttackStatusEffectChanceModifierType("modifierType:ModifierType.ENEMY_ATTACK_PARALYZE_CHANCE", "wl_paralyze_heal", 2.5, StatusEffect.PARALYSIS, 10),
  ENEMY_ATTACK_BURN_CHANCE: () => new EnemyAttackStatusEffectChanceModifierType("modifierType:ModifierType.ENEMY_ATTACK_BURN_CHANCE", "wl_burn_heal", 5, StatusEffect.BURN, 10),
  ENEMY_STATUS_EFFECT_HEAL_CHANCE: () => new ModifierType("modifierType:ModifierType.ENEMY_STATUS_EFFECT_HEAL_CHANCE", "wl_full_heal", (type, _args) => new Modifiers.EnemyStatusEffectHealChanceModifier(type, 2.5, 10)),
  ENEMY_ENDURE_CHANCE: () => new EnemyEndureChanceModifierType("modifierType:ModifierType.ENEMY_ENDURE_CHANCE", "wl_reset_urge", 2),
  ENEMY_FUSED_CHANCE: () => new ModifierType("modifierType:ModifierType.ENEMY_FUSED_CHANCE", "wl_custom_spliced", (type, _args) => new Modifiers.EnemyFusionChanceModifier(type, 1)),
};

interface ModifierPool {
  [tier: string]: WeightedModifierType[]
}

/**
 * Used to check if the player has max of a given ball type in Classic
 * @param party The player's party, just used to access the scene
 * @param ballType The {@linkcode PokeballType} being checked
 * @returns boolean: true if the player has the maximum of a given ball type
 */
function hasMaximumBalls(party: Pokemon[], ballType: PokeballType): boolean {
  return (party[0].scene.gameMode.isClassic && party[0].scene.pokeballCounts[ballType] >= MAX_PER_TYPE_POKEBALLS);
}

const modifierPool: ModifierPool = {
  [ModifierTier.COMMON]: [
    new WeightedModifierType(modifierTypes.POKEBALL, (party: Pokemon[]) => (hasMaximumBalls(party, PokeballType.POKEBALL)) ? 0 : 6, 6),
    new WeightedModifierType(modifierTypes.RARE_CANDY, 2),
    new WeightedModifierType(modifierTypes.POTION, (party: Pokemon[]) => {
      const thresholdPartyMemberCount = Math.min(party.filter(p => (p.getInverseHp() >= 10 || p.getHpRatio() <= 0.875) && !p.isFainted()).length, 3);
      return thresholdPartyMemberCount * 3;
    }, 9),
    new WeightedModifierType(modifierTypes.SUPER_POTION, (party: Pokemon[]) => {
      const thresholdPartyMemberCount = Math.min(party.filter(p => (p.getInverseHp() >= 25 || p.getHpRatio() <= 0.75) && !p.isFainted()).length, 3);
      return thresholdPartyMemberCount;
    }, 3),
    new WeightedModifierType(modifierTypes.ETHER, (party: Pokemon[]) => {
      const thresholdPartyMemberCount = Math.min(party.filter(p => p.hp && p.getMoveset().filter(m => m?.ppUsed && (m.getMovePp() - m.ppUsed) <= 5 && m.ppUsed >= Math.floor(m.getMovePp() / 2)).length).length, 3);
      return thresholdPartyMemberCount * 3;
    }, 9),
    new WeightedModifierType(modifierTypes.MAX_ETHER, (party: Pokemon[]) => {
      const thresholdPartyMemberCount = Math.min(party.filter(p => p.hp && p.getMoveset().filter(m => m?.ppUsed && (m.getMovePp() - m.ppUsed) <= 5 && m.ppUsed >= Math.floor(m.getMovePp() / 2)).length).length, 3);
      return thresholdPartyMemberCount;
    }, 3),
    new WeightedModifierType(modifierTypes.LURE, skipInLastClassicWaveOrDefault(2)),
    new WeightedModifierType(modifierTypes.TEMP_STAT_STAGE_BOOSTER, 4),
    new WeightedModifierType(modifierTypes.BERRY, 2),
    new WeightedModifierType(modifierTypes.TM_COMMON, 2),
  ].map(m => {
    m.setTier(ModifierTier.COMMON); return m;
  }),
  [ModifierTier.GREAT]: [
    new WeightedModifierType(modifierTypes.GREAT_BALL, (party: Pokemon[]) => (hasMaximumBalls(party, PokeballType.GREAT_BALL)) ? 0 : 6, 6),
    new WeightedModifierType(modifierTypes.PP_UP, 2),
    new WeightedModifierType(modifierTypes.FULL_HEAL, (party: Pokemon[]) => {
      const statusEffectPartyMemberCount = Math.min(party.filter(p => p.hp && !!p.status && !p.getHeldItems().some(i => {
        if (i instanceof Modifiers.TurnStatusEffectModifier) {
          return (i as Modifiers.TurnStatusEffectModifier).getStatusEffect() === p.status?.effect;
        }
        return false;
      })).length, 3);
      return statusEffectPartyMemberCount * 6;
    }, 18),
    new WeightedModifierType(modifierTypes.REVIVE, (party: Pokemon[]) => {
      const faintedPartyMemberCount = Math.min(party.filter(p => p.isFainted()).length, 3);
      return faintedPartyMemberCount * 9;
    }, 27),
    new WeightedModifierType(modifierTypes.MAX_REVIVE, (party: Pokemon[]) => {
      const faintedPartyMemberCount = Math.min(party.filter(p => p.isFainted()).length, 3);
      return faintedPartyMemberCount * 3;
    }, 9),
    new WeightedModifierType(modifierTypes.SACRED_ASH, (party: Pokemon[]) => {
      return party.filter(p => p.isFainted()).length >= Math.ceil(party.length / 2) ? 1 : 0;
    }, 1),
    new WeightedModifierType(modifierTypes.HYPER_POTION, (party: Pokemon[]) => {
      const thresholdPartyMemberCount = Math.min(party.filter(p => (p.getInverseHp() >= 100 || p.getHpRatio() <= 0.625) && !p.isFainted()).length, 3);
      return thresholdPartyMemberCount * 3;
    }, 9),
    new WeightedModifierType(modifierTypes.MAX_POTION, (party: Pokemon[]) => {
      const thresholdPartyMemberCount = Math.min(party.filter(p => (p.getInverseHp() >= 150 || p.getHpRatio() <= 0.5) && !p.isFainted()).length, 3);
      return thresholdPartyMemberCount;
    }, 3),
    new WeightedModifierType(modifierTypes.FULL_RESTORE, (party: Pokemon[]) => {
      const statusEffectPartyMemberCount = Math.min(party.filter(p => p.hp && !!p.status && !p.getHeldItems().some(i => {
        if (i instanceof Modifiers.TurnStatusEffectModifier) {
          return (i as Modifiers.TurnStatusEffectModifier).getStatusEffect() === p.status?.effect;
        }
        return false;
      })).length, 3);
      const thresholdPartyMemberCount = Math.floor((Math.min(party.filter(p => (p.getInverseHp() >= 150 || p.getHpRatio() <= 0.5) && !p.isFainted()).length, 3) + statusEffectPartyMemberCount) / 2);
      return thresholdPartyMemberCount;
    }, 3),
    new WeightedModifierType(modifierTypes.ELIXIR, (party: Pokemon[]) => {
      const thresholdPartyMemberCount = Math.min(party.filter(p => p.hp && p.getMoveset().filter(m => m?.ppUsed && (m.getMovePp() - m.ppUsed) <= 5 && m.ppUsed >= Math.floor(m.getMovePp() / 2)).length).length, 3);
      return thresholdPartyMemberCount * 3;
    }, 9),
    new WeightedModifierType(modifierTypes.MAX_ELIXIR, (party: Pokemon[]) => {
      const thresholdPartyMemberCount = Math.min(party.filter(p => p.hp && p.getMoveset().filter(m => m?.ppUsed && (m.getMovePp() - m.ppUsed) <= 5 && m.ppUsed >= Math.floor(m.getMovePp() / 2)).length).length, 3);
      return thresholdPartyMemberCount;
    }, 3),
    new WeightedModifierType(modifierTypes.DIRE_HIT, 4),
    new WeightedModifierType(modifierTypes.SUPER_LURE, skipInLastClassicWaveOrDefault(4)),
    new WeightedModifierType(modifierTypes.NUGGET, skipInLastClassicWaveOrDefault(5)),
    new WeightedModifierType(modifierTypes.EVOLUTION_ITEM, (party: Pokemon[]) => {
      return Math.min(Math.ceil(party[0].scene.currentBattle.waveIndex / 15), 8);
    }, 8),
    new WeightedModifierType(modifierTypes.MAP, (party: Pokemon[]) => party[0].scene.gameMode.isClassic && party[0].scene.currentBattle.waveIndex < 180 ? 1 : 0, 1),
    new WeightedModifierType(modifierTypes.TM_GREAT, 3),
    new WeightedModifierType(modifierTypes.MEMORY_MUSHROOM, (party: Pokemon[]) => {
      if (!party.find(p => p.getLearnableLevelMoves().length)) {
        return 0;
      }
      const highestPartyLevel = party.map(p => p.level).reduce((highestLevel: integer, level: integer) => Math.max(highestLevel, level), 1);
      return Math.min(Math.ceil(highestPartyLevel / 20), 4);
    }, 4),
    new WeightedModifierType(modifierTypes.BASE_STAT_BOOSTER, 3),
    new WeightedModifierType(modifierTypes.TERA_SHARD, 1),
    new WeightedModifierType(modifierTypes.DNA_SPLICERS, (party: Pokemon[]) => party[0].scene.gameMode.isSplicedOnly && party.filter(p => !p.fusionSpecies).length > 1 ? 4 : 0),
    new WeightedModifierType(modifierTypes.VOUCHER, (party: Pokemon[], rerollCount: integer) => !party[0].scene.gameMode.isDaily ? Math.max(1 - rerollCount, 0) : 0, 1),
  ].map(m => {
    m.setTier(ModifierTier.GREAT); return m;
  }),
  [ModifierTier.ULTRA]: [
    new WeightedModifierType(modifierTypes.ULTRA_BALL, (party: Pokemon[]) => (hasMaximumBalls(party, PokeballType.ULTRA_BALL)) ? 0 : 15, 15),
    new WeightedModifierType(modifierTypes.MAX_LURE, skipInLastClassicWaveOrDefault(4)),
    new WeightedModifierType(modifierTypes.BIG_NUGGET, skipInLastClassicWaveOrDefault(12)),
    new WeightedModifierType(modifierTypes.PP_MAX, 3),
    new WeightedModifierType(modifierTypes.MINT, 4),
    new WeightedModifierType(modifierTypes.RARE_EVOLUTION_ITEM, (party: Pokemon[]) => Math.min(Math.ceil(party[0].scene.currentBattle.waveIndex / 15) * 4, 32), 32),
    new WeightedModifierType(modifierTypes.FORM_CHANGE_ITEM, (party: Pokemon[]) => Math.min(Math.ceil(party[0].scene.currentBattle.waveIndex / 50), 4) * 6, 24),
    new WeightedModifierType(modifierTypes.AMULET_COIN, skipInLastClassicWaveOrDefault(3)),
    new WeightedModifierType(modifierTypes.EVIOLITE, (party: Pokemon[]) => {
      if (!party[0].scene.gameMode.isFreshStartChallenge() && party[0].scene.gameData.unlocks[Unlockables.EVIOLITE]) {
        return party.some(p => ((p.getSpeciesForm(true).speciesId in pokemonEvolutions) || (p.isFusion() && (p.getFusionSpeciesForm(true).speciesId in pokemonEvolutions))) && !p.getHeldItems().some(i => i instanceof Modifiers.EvolutionStatBoosterModifier)) ? 10 : 0;
      }
      return 0;
    }),
    new WeightedModifierType(modifierTypes.SPECIES_STAT_BOOSTER, 12),
    new WeightedModifierType(modifierTypes.LEEK, (party: Pokemon[]) => {
      const checkedSpecies = [ Species.FARFETCHD, Species.GALAR_FARFETCHD, Species.SIRFETCHD ];
      // If a party member doesn't already have a Leek and is one of the relevant species, Leek can appear
      return party.some(p => !p.getHeldItems().some(i => i instanceof Modifiers.SpeciesCritBoosterModifier) && (checkedSpecies.includes(p.getSpeciesForm(true).speciesId) || (p.isFusion() && checkedSpecies.includes(p.getFusionSpeciesForm(true).speciesId)))) ? 12 : 0;
    }, 12),
    new WeightedModifierType(modifierTypes.TOXIC_ORB, (party: Pokemon[]) => {
      const checkedAbilities = [Abilities.QUICK_FEET, Abilities.GUTS, Abilities.MARVEL_SCALE, Abilities.TOXIC_BOOST, Abilities.POISON_HEAL, Abilities.MAGIC_GUARD];
      const checkedMoves = [Moves.FACADE, Moves.TRICK, Moves.FLING, Moves.SWITCHEROO, Moves.PSYCHO_SHIFT];
      // If a party member doesn't already have one of these two orbs and has one of the above moves or abilities, the orb can appear
      return party.some(p => !p.getHeldItems().some(i => i instanceof Modifiers.TurnStatusEffectModifier) && (checkedAbilities.some(a => p.hasAbility(a, false, true)) || p.getMoveset(true).some(m => m && checkedMoves.includes(m.moveId)))) ? 10 : 0;
    }, 10),
    new WeightedModifierType(modifierTypes.FLAME_ORB, (party: Pokemon[]) => {
      const checkedAbilities = [Abilities.QUICK_FEET, Abilities.GUTS, Abilities.MARVEL_SCALE, Abilities.FLARE_BOOST, Abilities.MAGIC_GUARD];
      const checkedMoves = [Moves.FACADE, Moves.TRICK, Moves.FLING, Moves.SWITCHEROO, Moves.PSYCHO_SHIFT];
      // If a party member doesn't already have one of these two orbs and has one of the above moves or abilities, the orb can appear
      return party.some(p => !p.getHeldItems().some(i => i instanceof Modifiers.TurnStatusEffectModifier) && (checkedAbilities.some(a => p.hasAbility(a, false, true)) || p.getMoveset(true).some(m => m && checkedMoves.includes(m.moveId)))) ? 10 : 0;
    }, 10),
    new WeightedModifierType(modifierTypes.WHITE_HERB, (party: Pokemon[]) => {
      const checkedAbilities = [Abilities.WEAK_ARMOR, Abilities.CONTRARY, Abilities.MOODY, Abilities.ANGER_SHELL, Abilities.COMPETITIVE, Abilities.DEFIANT];
      const weightMultiplier = party.filter(
        p => !p.getHeldItems().some(i => i instanceof Modifiers.ResetNegativeStatStageModifier && i.stackCount >= i.getMaxHeldItemCount(p)) &&
          (checkedAbilities.some(a => p.hasAbility(a, false, true)) || p.getMoveset(true).some(m => m && selfStatLowerMoves.includes(m.moveId)))).length;
      // If a party member has one of the above moves or abilities and doesn't have max herbs, the herb will appear more frequently
      return 0 * (weightMultiplier ? 2 : 1) + (weightMultiplier ? weightMultiplier * 0 : 0);
    }, 10),
    new WeightedModifierType(modifierTypes.REVIVER_SEED, 4),
    new WeightedModifierType(modifierTypes.CANDY_JAR, skipInLastClassicWaveOrDefault(5)),
    new WeightedModifierType(modifierTypes.ATTACK_TYPE_BOOSTER, 9),
    new WeightedModifierType(modifierTypes.TM_ULTRA, 11),
    new WeightedModifierType(modifierTypes.RARER_CANDY, 4),
    new WeightedModifierType(modifierTypes.GOLDEN_PUNCH, skipInLastClassicWaveOrDefault(2)),
    new WeightedModifierType(modifierTypes.IV_SCANNER, skipInLastClassicWaveOrDefault(4)),
    new WeightedModifierType(modifierTypes.EXP_CHARM, skipInLastClassicWaveOrDefault(8)),
    new WeightedModifierType(modifierTypes.EXP_SHARE, skipInLastClassicWaveOrDefault(10)),
    new WeightedModifierType(modifierTypes.EXP_BALANCE, skipInLastClassicWaveOrDefault(3)),
    new WeightedModifierType(modifierTypes.TERA_ORB, (party: Pokemon[]) => Math.min(Math.max(Math.floor(party[0].scene.currentBattle.waveIndex / 50) * 2, 1), 4), 4),
    new WeightedModifierType(modifierTypes.QUICK_CLAW, 3),
    new WeightedModifierType(modifierTypes.WIDE_LENS, 4),
  ].map(m => {
    m.setTier(ModifierTier.ULTRA); return m;
  }),
  [ModifierTier.ROGUE]: [
    new WeightedModifierType(modifierTypes.ROGUE_BALL, (party: Pokemon[]) => (hasMaximumBalls(party, PokeballType.ROGUE_BALL)) ? 0 : 16, 16),
    new WeightedModifierType(modifierTypes.RELIC_GOLD, skipInLastClassicWaveOrDefault(2)),
    new WeightedModifierType(modifierTypes.LEFTOVERS, 3),
    new WeightedModifierType(modifierTypes.SHELL_BELL, 3),
    new WeightedModifierType(modifierTypes.BERRY_POUCH, 4),
    new WeightedModifierType(modifierTypes.GRIP_CLAW, 5),
    new WeightedModifierType(modifierTypes.SCOPE_LENS, 4),
    new WeightedModifierType(modifierTypes.BATON, 2),
    new WeightedModifierType(modifierTypes.SOUL_DEW, 7),
    //new WeightedModifierType(modifierTypes.OVAL_CHARM, 6),
    new WeightedModifierType(modifierTypes.SOOTHE_BELL, 4),
    new WeightedModifierType(modifierTypes.ABILITY_CHARM, skipInClassicAfterWave(189, 6)),
    new WeightedModifierType(modifierTypes.FOCUS_BAND, 5),
    new WeightedModifierType(modifierTypes.KINGS_ROCK, 3),
    new WeightedModifierType(modifierTypes.LOCK_CAPSULE, skipInLastClassicWaveOrDefault(3)),
    new WeightedModifierType(modifierTypes.SUPER_EXP_CHARM, skipInLastClassicWaveOrDefault(8)),
    new WeightedModifierType(modifierTypes.RARE_FORM_CHANGE_ITEM, (party: Pokemon[]) => Math.min(Math.ceil(party[0].scene.currentBattle.waveIndex / 50), 4) * 6, 24),
    new WeightedModifierType(modifierTypes.MEGA_BRACELET, (party: Pokemon[]) => Math.min(Math.ceil(party[0].scene.currentBattle.waveIndex / 50), 4) * 9, 36),
    new WeightedModifierType(modifierTypes.DYNAMAX_BAND, (party: Pokemon[]) => Math.min(Math.ceil(party[0].scene.currentBattle.waveIndex / 50), 4) * 9, 36),
    new WeightedModifierType(modifierTypes.VOUCHER_PLUS, (party: Pokemon[], rerollCount: integer) => !party[0].scene.gameMode.isDaily ? Math.max(3 - rerollCount * 1, 0) : 0, 3),
  ].map(m => {
    m.setTier(ModifierTier.ROGUE); return m;
  }),
  [ModifierTier.MASTER]: [
    new WeightedModifierType(modifierTypes.MASTER_BALL, (party: Pokemon[]) => (hasMaximumBalls(party, PokeballType.MASTER_BALL)) ? 0 : 24, 24),
    new WeightedModifierType(modifierTypes.SHINY_CHARM, 14),
    new WeightedModifierType(modifierTypes.HEALING_CHARM, 18),
    new WeightedModifierType(modifierTypes.MULTI_LENS, 18),
    new WeightedModifierType(modifierTypes.VOUCHER_PREMIUM, (party: Pokemon[], rerollCount: integer) => !party[0].scene.gameMode.isDaily && !party[0].scene.gameMode.isEndless && !party[0].scene.gameMode.isSplicedOnly ? Math.max(5 - rerollCount * 2, 0) : 0, 5),
    new WeightedModifierType(modifierTypes.DNA_SPLICERS, (party: Pokemon[]) => !party[0].scene.gameMode.isSplicedOnly && party.filter(p => !p.fusionSpecies).length > 1 ? 24 : 0, 24),
    new WeightedModifierType(modifierTypes.MINI_BLACK_HOLE, (party: Pokemon[]) => (!party[0].scene.gameMode.isFreshStartChallenge() && party[0].scene.gameData.unlocks[Unlockables.MINI_BLACK_HOLE]) ? 1 : 0, 1),
  ].map(m => {
    m.setTier(ModifierTier.MASTER); return m;
  })
};

const wildModifierPool: ModifierPool = {
  [ModifierTier.COMMON]: [
    new WeightedModifierType(modifierTypes.BERRY, 1)
  ].map(m => {
    m.setTier(ModifierTier.COMMON); return m;
  }),
  [ModifierTier.GREAT]: [
    new WeightedModifierType(modifierTypes.BASE_STAT_BOOSTER, 1)
  ].map(m => {
    m.setTier(ModifierTier.GREAT); return m;
  }),
  [ModifierTier.ULTRA]: [
    new WeightedModifierType(modifierTypes.ATTACK_TYPE_BOOSTER, 10),
    new WeightedModifierType(modifierTypes.WHITE_HERB, 0)
  ].map(m => {
    m.setTier(ModifierTier.ULTRA); return m;
  }),
  [ModifierTier.ROGUE]: [
    new WeightedModifierType(modifierTypes.LUCKY_EGG, 4),
  ].map(m => {
    m.setTier(ModifierTier.ROGUE); return m;
  }),
  [ModifierTier.MASTER]: [
    new WeightedModifierType(modifierTypes.GOLDEN_EGG, 1)
  ].map(m => {
    m.setTier(ModifierTier.MASTER); return m;
  })
};

const trainerModifierPool: ModifierPool = {
  [ModifierTier.COMMON]: [
    new WeightedModifierType(modifierTypes.BERRY, 8),
    new WeightedModifierType(modifierTypes.BASE_STAT_BOOSTER, 3)
  ].map(m => {
    m.setTier(ModifierTier.COMMON); return m;
  }),
  [ModifierTier.GREAT]: [
    new WeightedModifierType(modifierTypes.BASE_STAT_BOOSTER, 3),
  ].map(m => {
    m.setTier(ModifierTier.GREAT); return m;
  }),
  [ModifierTier.ULTRA]: [
    new WeightedModifierType(modifierTypes.ATTACK_TYPE_BOOSTER, 10),
    new WeightedModifierType(modifierTypes.WHITE_HERB, 0),
  ].map(m => {
    m.setTier(ModifierTier.ULTRA); return m;
  }),
  [ModifierTier.ROGUE]: [
    new WeightedModifierType(modifierTypes.FOCUS_BAND, 2),
    new WeightedModifierType(modifierTypes.LUCKY_EGG, 4),
    new WeightedModifierType(modifierTypes.QUICK_CLAW, 1),
    new WeightedModifierType(modifierTypes.GRIP_CLAW, 1),
    new WeightedModifierType(modifierTypes.WIDE_LENS, 1),
  ].map(m => {
    m.setTier(ModifierTier.ROGUE); return m;
  }),
  [ModifierTier.MASTER]: [
    new WeightedModifierType(modifierTypes.KINGS_ROCK, 1),
    new WeightedModifierType(modifierTypes.LEFTOVERS, 1),
    new WeightedModifierType(modifierTypes.SHELL_BELL, 1),
    new WeightedModifierType(modifierTypes.SCOPE_LENS, 1),
  ].map(m => {
    m.setTier(ModifierTier.MASTER); return m;
  })
};

const enemyBuffModifierPool: ModifierPool = {
  [ModifierTier.COMMON]: [
    new WeightedModifierType(modifierTypes.ENEMY_DAMAGE_BOOSTER, 9),
    new WeightedModifierType(modifierTypes.ENEMY_DAMAGE_REDUCTION, 9),
    new WeightedModifierType(modifierTypes.ENEMY_ATTACK_POISON_CHANCE, 3),
    new WeightedModifierType(modifierTypes.ENEMY_ATTACK_PARALYZE_CHANCE, 3),
    new WeightedModifierType(modifierTypes.ENEMY_ATTACK_BURN_CHANCE, 3),
    new WeightedModifierType(modifierTypes.ENEMY_STATUS_EFFECT_HEAL_CHANCE, 9),
    new WeightedModifierType(modifierTypes.ENEMY_ENDURE_CHANCE, 4),
    new WeightedModifierType(modifierTypes.ENEMY_FUSED_CHANCE, 1)
  ].map(m => {
    m.setTier(ModifierTier.COMMON); return m;
  }),
  [ModifierTier.GREAT]: [
    new WeightedModifierType(modifierTypes.ENEMY_DAMAGE_BOOSTER, 5),
    new WeightedModifierType(modifierTypes.ENEMY_DAMAGE_REDUCTION, 5),
    new WeightedModifierType(modifierTypes.ENEMY_STATUS_EFFECT_HEAL_CHANCE, 5),
    new WeightedModifierType(modifierTypes.ENEMY_ENDURE_CHANCE, 5),
    new WeightedModifierType(modifierTypes.ENEMY_FUSED_CHANCE, 1)
  ].map(m => {
    m.setTier(ModifierTier.GREAT); return m;
  }),
  [ModifierTier.ULTRA]: [
    new WeightedModifierType(modifierTypes.ENEMY_DAMAGE_BOOSTER, 10),
    new WeightedModifierType(modifierTypes.ENEMY_DAMAGE_REDUCTION, 10),
    new WeightedModifierType(modifierTypes.ENEMY_HEAL, 10),
    new WeightedModifierType(modifierTypes.ENEMY_STATUS_EFFECT_HEAL_CHANCE, 10),
    new WeightedModifierType(modifierTypes.ENEMY_ENDURE_CHANCE, 10),
    new WeightedModifierType(modifierTypes.ENEMY_FUSED_CHANCE, 5)
  ].map(m => {
    m.setTier(ModifierTier.ULTRA); return m;
  }),
  [ModifierTier.ROGUE]: [ ].map((m: WeightedModifierType) => {
    m.setTier(ModifierTier.ROGUE); return m;
  }),
  [ModifierTier.MASTER]: [ ].map((m: WeightedModifierType) => {
    m.setTier(ModifierTier.MASTER); return m;
  })
};

const dailyStarterModifierPool: ModifierPool = {
  [ModifierTier.COMMON]: [
    new WeightedModifierType(modifierTypes.BASE_STAT_BOOSTER, 1),
    new WeightedModifierType(modifierTypes.BERRY, 3),
  ].map(m => {
    m.setTier(ModifierTier.COMMON); return m;
  }),
  [ModifierTier.GREAT]: [
    new WeightedModifierType(modifierTypes.ATTACK_TYPE_BOOSTER, 5),
  ].map(m => {
    m.setTier(ModifierTier.GREAT); return m;
  }),
  [ModifierTier.ULTRA]: [
    new WeightedModifierType(modifierTypes.REVIVER_SEED, 4),
    new WeightedModifierType(modifierTypes.SOOTHE_BELL, 1),
    new WeightedModifierType(modifierTypes.SOUL_DEW, 1),
    new WeightedModifierType(modifierTypes.GOLDEN_PUNCH, 1),
  ].map(m => {
    m.setTier(ModifierTier.ULTRA); return m;
  }),
  [ModifierTier.ROGUE]: [
    new WeightedModifierType(modifierTypes.GRIP_CLAW, 5),
    new WeightedModifierType(modifierTypes.BATON, 2),
    new WeightedModifierType(modifierTypes.FOCUS_BAND, 5),
    new WeightedModifierType(modifierTypes.QUICK_CLAW, 3),
    new WeightedModifierType(modifierTypes.KINGS_ROCK, 3),
  ].map(m => {
    m.setTier(ModifierTier.ROGUE); return m;
  }),
  [ModifierTier.MASTER]: [
    new WeightedModifierType(modifierTypes.LEFTOVERS, 1),
    new WeightedModifierType(modifierTypes.SHELL_BELL, 1),
  ].map(m => {
    m.setTier(ModifierTier.MASTER); return m;
  })
};

export function getModifierType(modifierTypeFunc: ModifierTypeFunc): ModifierType {
  const modifierType = modifierTypeFunc();
  if (!modifierType.id) {
    modifierType.id = Object.keys(modifierTypes).find(k => modifierTypes[k] === modifierTypeFunc)!; // TODO: is this bang correct?
  }
  return modifierType;
}

let modifierPoolThresholds = {};
let ignoredPoolIndexes = {};

let dailyStarterModifierPoolThresholds = {};
let ignoredDailyStarterPoolIndexes = {}; // eslint-disable-line @typescript-eslint/no-unused-vars

let enemyModifierPoolThresholds = {};
let enemyIgnoredPoolIndexes = {}; // eslint-disable-line @typescript-eslint/no-unused-vars

let enemyBuffModifierPoolThresholds = {};
let enemyBuffIgnoredPoolIndexes = {}; // eslint-disable-line @typescript-eslint/no-unused-vars

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

const tierWeights = [ 768 / 1024, 195 / 1024, 48 / 1024, 12 / 1024, 1 / 1024 ];

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
      const existingModifiers = party[0].scene.findModifiers(m => m.type.id === weightedModifierType.modifierType.id, poolType === ModifierPoolType.PLAYER);
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
        const modifierId = weightedModifierType.modifierType.id;
        tierModifierIds.push(modifierId);
        const outputWeight = useMaxWeightForOutput ? weightedModifierType.maxWeight : weight;
        modifierTableData[modifierId] = { weight: outputWeight, tier: parseInt(t), tierPercent: 0, totalPercent: 0 };
        tierMaxWeight += outputWeight;
      }
      if (weight) {
        total += weight;
      } else {
        ignoredIndexes[t].push(i++);
        return total;
      }
      thresholds.set(total, i++);
      return total;
    }, 0);
    for (const id of tierModifierIds) {
      modifierTableData[id].tierPercent = Math.floor((modifierTableData[id].weight / tierMaxWeight) * 10000) / 100;
    }
    return [ t, Object.fromEntries(thresholds) ];
  })));
  for (const id of Object.keys(modifierTableData)) {
    modifierTableData[id].totalPercent = Math.floor(modifierTableData[id].tierPercent * tierWeights[modifierTableData[id].tier] * 100) / 100;
    modifierTableData[id].tier = ModifierTier[modifierTableData[id].tier];
  }
  if (outputModifierData) {
    console.table(modifierTableData);
  }
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
    let candidate = getNewModifierTypeOption(party, ModifierPoolType.PLAYER, modifierTiers && modifierTiers.length > i ? modifierTiers[i] : undefined);
    let r = 0;
    while (options.length && ++r < retryCount && options.filter(o => o.type?.name === candidate?.type?.name || o.type?.group === candidate?.type?.group).length) {
      candidate = getNewModifierTypeOption(party, ModifierPoolType.PLAYER, candidate?.type?.tier, candidate?.upgradeCount);
    }
    if (candidate) {
      options.push(candidate);
    }
  });

  overridePlayerModifierTypeOptions(options, party);

  return options;
}

/**
 * Replaces the {@linkcode ModifierType} of the entries within {@linkcode options} with any
 * {@linkcode ModifierOverride} entries listed in {@linkcode Overrides.ITEM_REWARD_OVERRIDE}
 * up to the smallest amount of entries between {@linkcode options} and the override array.
 * @param options Array of naturally rolled {@linkcode ModifierTypeOption}s
 * @param party Array of the player's current party
 */
export function overridePlayerModifierTypeOptions(options: ModifierTypeOption[], party: PlayerPokemon[]) {
  const minLength = Math.min(options.length, Overrides.ITEM_REWARD_OVERRIDE.length);
  for (let i = 0; i < minLength; i++) {
    const override: ModifierOverride = Overrides.ITEM_REWARD_OVERRIDE[i];
    const modifierFunc = modifierTypes[override.name];
    let modifierType: ModifierType | null = modifierFunc();

    if (modifierType instanceof ModifierTypeGenerator) {
      const pregenArgs = ("type" in override) && (override.type !== null) ? [override.type] : undefined;
      modifierType = modifierType.generateType(party, pregenArgs);
    }

    if (modifierType) {
      options[i].type = modifierType.withIdFromFunc(modifierFunc).withTierFromPool();
    }
  }
}

export function getPlayerShopModifierTypeOptionsForWave(waveIndex: integer, baseCost: integer): ModifierTypeOption[] {
  if (!(waveIndex % 10)) {
    return [];
  }

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
  let tierStackCount: number;
  switch (tier) {
  case ModifierTier.ULTRA:
    tierStackCount = 5;
    break;
  case ModifierTier.GREAT:
    tierStackCount = 3;
    break;
  default:
    tierStackCount = 1;
    break;
  }

  const retryCount = 50;
  let candidate = getNewModifierTypeOption([], ModifierPoolType.ENEMY_BUFF, tier);
  let r = 0;
  let matchingModifier: Modifiers.PersistentModifier | undefined;
  while (++r < retryCount && (matchingModifier = enemyModifiers.find(m => m.type.id === candidate?.type?.id)) && matchingModifier.getMaxStackCount(scene) < matchingModifier.stackCount + (r < 10 ? tierStackCount : 1)) {
    candidate = getNewModifierTypeOption([], ModifierPoolType.ENEMY_BUFF, tier);
  }

  const modifier = candidate?.type?.newModifier() as Modifiers.EnemyPersistentModifier;
  modifier.stackCount = tierStackCount;

  return modifier;
}

export function getEnemyModifierTypesForWave(waveIndex: integer, count: integer, party: EnemyPokemon[], poolType: ModifierPoolType.WILD | ModifierPoolType.TRAINER, upgradeChance: integer = 0): PokemonHeldItemModifierType[] {
  const ret = new Array(count).fill(0).map(() => getNewModifierTypeOption(party, poolType, undefined, upgradeChance && !Utils.randSeedInt(upgradeChance) ? 1 : 0)?.type as PokemonHeldItemModifierType);
  if (!(waveIndex % 1000)) {
    ret.push(getModifierType(modifierTypes.MINI_BLACK_HOLE) as PokemonHeldItemModifierType);
  }
  return ret;
}

export function getDailyRunStarterModifiers(party: PlayerPokemon[]): Modifiers.PokemonHeldItemModifier[] {
  const ret: Modifiers.PokemonHeldItemModifier[] = [];
  for (const p of party) {
    for (let m = 0; m < 3; m++) {
      const tierValue = Utils.randSeedInt(64);

      let tier: ModifierTier;
      if (tierValue > 25) {
        tier = ModifierTier.COMMON;
      } else if (tierValue > 12) {
        tier = ModifierTier.GREAT;
      } else if (tierValue > 4) {
        tier = ModifierTier.ULTRA;
      } else if (tierValue) {
        tier = ModifierTier.ROGUE;
      } else {
        tier = ModifierTier.MASTER;
      }

      const modifier = getNewModifierTypeOption(party, ModifierPoolType.DAILY_STARTER, tier)?.type?.newModifier(p) as Modifiers.PokemonHeldItemModifier;
      ret.push(modifier);
    }
  }

  return ret;
}

function getNewModifierTypeOption(party: Pokemon[], poolType: ModifierPoolType, tier?: ModifierTier, upgradeCount?: integer, retryCount: integer = 0): ModifierTypeOption | null {
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
    if (!upgradeCount) {
      upgradeCount = 0;
    }
    if (player && tierValue) {
      const partyLuckValue = getPartyLuckValue(party);
      const upgradeOdds = Math.floor(128 / ((partyLuckValue + 4) / 4));
      let upgraded = false;
      do {
        upgraded = Utils.randSeedInt(upgradeOdds) < 4;
        if (upgraded) {
          upgradeCount++;
        }
      } while (upgraded);
    }

    if (tierValue > 255) {
      tier = ModifierTier.COMMON;
    } else if (tierValue > 60) {
      tier = ModifierTier.GREAT;
    } else if (tierValue > 12) {
      tier = ModifierTier.ULTRA;
    } else if (tierValue) {
      tier = ModifierTier.ROGUE;
    } else {
      tier = ModifierTier.MASTER;
    }

    tier += upgradeCount;
    while (tier && (!modifierPool.hasOwnProperty(tier) || !modifierPool[tier].length)) {
      tier--;
      if (upgradeCount) {
        upgradeCount--;
      }
    }
  } else if (upgradeCount === undefined && player) {
    upgradeCount = 0;
    if (tier < ModifierTier.MASTER) {
      const partyShinyCount = party.filter(p => p.isShiny() && !p.isFainted()).length;
      const upgradeOdds = Math.floor(32 / ((partyShinyCount + 2) / 2));
      while (modifierPool.hasOwnProperty(tier + upgradeCount + 1) && modifierPool[tier + upgradeCount + 1].length) {
        if (!Utils.randSeedInt(upgradeOdds)) {
          upgradeCount++;
        } else {
          break;
        }
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
  let index: integer | undefined;
  for (const t of tierThresholds) {
    const threshold = parseInt(t);
    if (value < threshold) {
      index = thresholds[tier][threshold];
      break;
    }
  }

  if (index === undefined) {
    return null;
  }

  if (player) {
    console.log(index, ignoredPoolIndexes[tier].filter(i => i <= index).length, ignoredPoolIndexes[tier]);
  }
  let modifierType: ModifierType | null = (pool[tier][index]).modifierType;
  if (modifierType instanceof ModifierTypeGenerator) {
    modifierType = (modifierType as ModifierTypeGenerator).generateType(party);
    if (modifierType === null) {
      if (player) {
        console.log(ModifierTier[tier], upgradeCount);
      }
      return getNewModifierTypeOption(party, poolType, tier, upgradeCount, ++retryCount);
    }
  }

  console.log(modifierType, !player ? "(enemy)" : "");

  return new ModifierTypeOption(modifierType as ModifierType, upgradeCount!); // TODO: is this bang correct?
}

export function getDefaultModifierTypeForTier(tier: ModifierTier): ModifierType {
  let modifierType: ModifierType | WeightedModifierType = modifierPool[tier || ModifierTier.COMMON][0];
  if (modifierType instanceof WeightedModifierType) {
    modifierType = (modifierType as WeightedModifierType).modifierType;
  }
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
  const luck = Phaser.Math.Clamp(party.map(p => p.isAllowedInBattle() ? p.getLuck() : 0)
    .reduce((total: integer, value: integer) => total += value, 0), 0, 14);
  return luck || 0;
}

export function getLuckString(luckValue: integer): string {
  return [ "D", "C", "C+", "B-", "B", "B+", "A-", "A", "A+", "A++", "S", "S+", "SS", "SS+", "SSS" ][luckValue];
}

export function getLuckTextTint(luckValue: integer): integer {
  let modifierTier: ModifierTier;
  if (luckValue > 11) {
    modifierTier = ModifierTier.LUXURY;
  } else if (luckValue > 9) {
    modifierTier = ModifierTier.MASTER;
  } else if (luckValue > 5) {
    modifierTier = ModifierTier.ROGUE;
  } else if (luckValue > 2) {
    modifierTier = ModifierTier.ULTRA;
  } else if (luckValue) {
    modifierTier = ModifierTier.GREAT;
  } else {
    modifierTier = ModifierTier.COMMON;
  }
  return getModifierTierTextTint(modifierTier);
}
