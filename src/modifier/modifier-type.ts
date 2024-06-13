import * as Modifiers from "./modifier";
import { AttackMove, allMoves } from "../data/move";
import { PokeballType, getPokeballCatchMultiplier, getPokeballName } from "../data/pokeball";
import Pokemon, { EnemyPokemon, PlayerPokemon, PokemonMove } from "../field/pokemon";
import { EvolutionItem, pokemonEvolutions } from "../data/pokemon-evolutions";
import { Stat, getStatName } from "../data/pokemon-stat";
import { tmPoolTiers, tmSpecies } from "../data/tms";
import { Type } from "../data/type";
import PartyUiHandler, { PokemonMoveSelectFilter, PokemonSelectFilter } from "../ui/party-ui-handler";
import * as Utils from "../utils";
import { TempBattleStat, getTempBattleStatBoosterItemName, getTempBattleStatName } from "../data/temp-battle-stat";
import { getBerryEffectDescription, getBerryName } from "../data/berry";
import { Unlockables } from "../system/unlockables";
import { StatusEffect, getStatusEffectDescriptor } from "../data/status-effect";
import { SpeciesFormKey } from "../data/pokemon-species";
import BattleScene from "../battle-scene";
import { VoucherType, getVoucherTypeIcon, getVoucherTypeName } from "../system/voucher";
import { FormChangeItem, SpeciesFormChangeItemTrigger, pokemonFormChanges } from "../data/pokemon-forms";
import { ModifierTier } from "./modifier-tier";
import { Nature, getNatureName, getNatureStatMultiplier } from "#app/data/nature";
import i18next from "#app/plugins/i18n";
import { getModifierTierTextTint } from "#app/ui/text";
import * as Overrides from "../overrides";
import { MoneyMultiplierModifier } from "./modifier";
import { Abilities } from "#enums/abilities";
import { BattlerTagType } from "#enums/battler-tag-type";
import { BerryType } from "#enums/berry-type";
import { Moves } from "#enums/moves";

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
  public localeKey: string;
  public iconImage: string;
  public group: string;
  public soundName: string;
  public tier: ModifierTier;
  protected newModifierFunc: NewModifierFunc;

  constructor(localeKey: string, iconImage: string, newModifierFunc: NewModifierFunc, group?: string, soundName?: string) {
    this.localeKey = localeKey;
    this.iconImage = iconImage;
    this.group = group || "";
    this.soundName = soundName || "restore";
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

  getOrInferTier(poolType: ModifierPoolType = ModifierPoolType.PLAYER): ModifierTier {
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
        if (pool[tier].find(m => (m as WeightedModifierType).modifierType.id === (this.generatorId || this.id))) {
          return (this.tier = tier);
        }
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
    super(null, null, null);
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
  private pokeballType: PokeballType;
  private count: integer;

  constructor(iconImage: string, pokeballType: PokeballType, count: integer) {
    super("", iconImage, (_type, _args) => new Modifiers.AddPokeballModifier(this, pokeballType, count), "pb", "pb_bounce_1");
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
  public selectFilter: PokemonSelectFilter;

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
        return i18next.t("modifierType:ModifierType.PokemonHeldItemModifierType.extra.inoperable", { "pokemonName": pokemon.name });
      }
      if (matchingModifier && matchingModifier.stackCount === maxStackCount) {
        return i18next.t("modifierType:ModifierType.PokemonHeldItemModifierType.extra.tooMany", { "pokemonName": pokemon.name });
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
        if (!pokemon.hp || (pokemon.hp >= pokemon.getMaxHp() && (!this.healStatus || (!pokemon.status && !pokemon.getTag(BattlerTagType.CONFUSED))))) {
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
  public moveSelectFilter: PokemonMoveSelectFilter;

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
        if (!pokemon.getMoveset().filter(m => m.ppUsed).length) {
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
  public battleCount: integer;

  constructor(localeKey: string, iconImage: string, battleCount: integer) {
    super(localeKey, iconImage, (_type, _args) => new Modifiers.DoubleBattleChanceBoosterModifier(this, this.battleCount), "lure");

    this.battleCount = battleCount;
  }

  getDescription(scene: BattleScene): string {
    return i18next.t("modifierType:ModifierType.DoubleBattleChanceBoosterModifierType.description", { battleCount: this.battleCount });
  }
}

export class TempBattleStatBoosterModifierType extends ModifierType implements GeneratedPersistentModifierType {
  public tempBattleStat: TempBattleStat;

  constructor(tempBattleStat: TempBattleStat) {
    super("", getTempBattleStatBoosterItemName(tempBattleStat).replace(/\./g, "").replace(/[ ]/g, "_").toLowerCase(),
      (_type, _args) => new Modifiers.TempBattleStatBoosterModifier(this, this.tempBattleStat));

    this.tempBattleStat = tempBattleStat;
  }

  get name(): string {
    return i18next.t(`modifierType:TempBattleStatBoosterItem.${getTempBattleStatBoosterItemName(this.tempBattleStat).replace(/\./g, "").replace(/[ ]/g, "_").toLowerCase()}`);
  }

  getDescription(scene: BattleScene): string {
    return i18next.t("modifierType:ModifierType.TempBattleStatBoosterModifierType.description", { tempBattleStatName: getTempBattleStatName(this.tempBattleStat) });
  }

  getPregenArgs(): any[] {
    return [ this.tempBattleStat ];
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
    super("", `${getAttackTypeBoosterItemName(moveType).replace(/[ \-]/g, "_").toLowerCase()}`,
      (_type, args) => new Modifiers.AttackTypeBoosterModifier(this, (args[0] as Pokemon).id, moveType, boostPercent));

    this.moveType = moveType;
    this.boostPercent = boostPercent;
  }

  get name(): string {
    return i18next.t(`modifierType:AttackTypeBoosterItem.${getAttackTypeBoosterItemName(this.moveType).replace(/[ \-]/g, "_").toLowerCase()}`);
  }

  getDescription(scene: BattleScene): string {
    // TODO: Need getTypeName?
    return i18next.t("modifierType:ModifierType.AttackTypeBoosterModifierType.description", { moveType: i18next.t(`pokemonInfo:Type.${Type[this.moveType]}`) });
  }

  getPregenArgs(): any[] {
    return [ this.moveType ];
  }
}

export class PokemonLevelIncrementModifierType extends PokemonModifierType {
  constructor(localeKey: string, iconImage: string) {
    super(localeKey, iconImage, (_type, args) => new Modifiers.PokemonLevelIncrementModifier(this, (args[0] as PlayerPokemon).id), (_pokemon: PlayerPokemon) => null);
  }

  getDescription(scene: BattleScene): string {
    return i18next.t("modifierType:ModifierType.PokemonLevelIncrementModifierType.description");
  }
}

export class AllPokemonLevelIncrementModifierType extends ModifierType {
  constructor(localeKey: string, iconImage: string) {
    super(localeKey, iconImage, (_type, _args) => new Modifiers.PokemonLevelIncrementModifier(this, -1));
  }

  getDescription(scene: BattleScene): string {
    return i18next.t("modifierType:ModifierType.AllPokemonLevelIncrementModifierType.description");
  }
}

function getBaseStatBoosterItemName(stat: Stat) {
  switch (stat) {
  case Stat.HP:
    return "HP Up";
  case Stat.ATK:
    return "Protein";
  case Stat.DEF:
    return "Iron";
  case Stat.SPATK:
    return "Calcium";
  case Stat.SPDEF:
    return "Zinc";
  case Stat.SPD:
    return "Carbos";
  }
}

export class PokemonBaseStatBoosterModifierType extends PokemonHeldItemModifierType implements GeneratedPersistentModifierType {
  private localeName: string;
  private stat: Stat;

  constructor(localeName: string, stat: Stat) {
    super("", localeName.replace(/[ \-]/g, "_").toLowerCase(), (_type, args) => new Modifiers.PokemonBaseStatModifier(this, (args[0] as Pokemon).id, this.stat));

    this.localeName = localeName;
    this.stat = stat;
  }

  get name(): string {
    return i18next.t(`modifierType:BaseStatBoosterItem.${this.localeName.replace(/[ \-]/g, "_").toLowerCase()}`);
  }

  getDescription(scene: BattleScene): string {
    return i18next.t("modifierType:ModifierType.PokemonBaseStatBoosterModifierType.description", { statName: getStatName(this.stat) });
  }

  getPregenArgs(): any[] {
    return [ this.stat ];
  }
}

class AllPokemonFullHpRestoreModifierType extends ModifierType {
  private descriptionKey: string;

  constructor(localeKey: string, iconImage: string, descriptionKey?: string, newModifierFunc?: NewModifierFunc) {
    super(localeKey, iconImage, newModifierFunc || ((_type, _args) => new Modifiers.PokemonHpRestoreModifier(this, -1, 0, 100, false)));

    this.descriptionKey = descriptionKey;
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
    super(localeKey, iconImage, (_type, _args) => new Modifiers.MoneyRewardModifier(this, moneyMultiplier), "money", "buy");

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
          && (!e.condition || e.condition.predicate(pokemon))).length && (pokemon.getFormKey() !== SpeciesFormKey.GIGANTAMAX)) {
          return null;
        } else if (pokemon.isFusion() && pokemonEvolutions.hasOwnProperty(pokemon.fusionSpecies.speciesId) && pokemonEvolutions[pokemon.fusionSpecies.speciesId].filter(e => e.item === this.evolutionItem
        && (!e.condition || e.condition.predicate(pokemon))).length && (pokemon.getFusionFormKey() !== SpeciesFormKey.GIGANTAMAX)) {
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
          && pokemonFormChanges[pokemon.species.speciesId].filter(fc => fc.trigger.hasTriggerType(SpeciesFormChangeItemTrigger))
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
      if (pregenArgs) {
        return new AttackTypeBoosterModifierType(pregenArgs[0] as Type, 20);
      }

      const attackMoveTypes = party.map(p => p.getMoveset().map(m => m.getMove()).filter(m => m instanceof AttackMove).map(m => m.type)).flat();
      if (!attackMoveTypes.length) {
        return null;
      }

      const attackMoveTypeWeights = new Map<Type, integer>();
      let totalWeight = 0;
      for (const t of attackMoveTypes) {
        if (attackMoveTypeWeights.has(t)) {
          if (attackMoveTypeWeights.get(t) < 3) {
            attackMoveTypeWeights.set(t, attackMoveTypeWeights.get(t) + 1);
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
      if (pregenArgs) {
        return new EvolutionItemModifierType(pregenArgs[0] as EvolutionItem);
      }

      const evolutionItemPool = [
        party.filter(p => pokemonEvolutions.hasOwnProperty(p.species.speciesId)).map(p => {
          const evolutions = pokemonEvolutions[p.species.speciesId];
          return evolutions.filter(e => e.item !== EvolutionItem.NONE && (e.evoFormKey === null || (e.preFormKey || "") === p.getFormKey()) && (!e.condition || e.condition.predicate(p)));
        }).flat(),
        party.filter(p => p.isFusion() && pokemonEvolutions.hasOwnProperty(p.fusionSpecies.speciesId)).map(p => {
          const evolutions = pokemonEvolutions[p.fusionSpecies.speciesId];
          return evolutions.filter(e => e.item !== EvolutionItem.NONE && (e.evoFormKey === null || (e.preFormKey || "") === p.getFusionFormKey()) && (!e.condition || e.condition.predicate(p)));
        }).flat()
      ].flat().flatMap(e => e.item).filter(i => (i > 50) === rare);

      if (!evolutionItemPool.length) {
        return null;
      }

      return new EvolutionItemModifierType(evolutionItemPool[Utils.randSeedInt(evolutionItemPool.length)]);
    });
  }
}

class FormChangeItemModifierTypeGenerator extends ModifierTypeGenerator {
  constructor() {
    super((party: Pokemon[], pregenArgs?: any[]) => {
      if (pregenArgs) {
        return new FormChangeItemModifierType(pregenArgs[0] as FormChangeItem);
      }

      const formChangeItemPool = party.filter(p => pokemonFormChanges.hasOwnProperty(p.species.speciesId)).map(p => {
        const formChanges = pokemonFormChanges[p.species.speciesId];
        return formChanges.filter(fc => ((fc.formKey.indexOf(SpeciesFormKey.MEGA) === -1 && fc.formKey.indexOf(SpeciesFormKey.PRIMAL) === -1) || party[0].scene.getModifiers(Modifiers.MegaEvolutionAccessModifier).length)
          && ((fc.formKey.indexOf(SpeciesFormKey.GIGANTAMAX) === -1 && fc.formKey.indexOf(SpeciesFormKey.ETERNAMAX) === -1) || party[0].scene.getModifiers(Modifiers.GigantamaxAccessModifier).length))
          .map(fc => fc.findTrigger(SpeciesFormChangeItemTrigger) as SpeciesFormChangeItemTrigger)
          .filter(t => t && t.active && !p.scene.findModifier(m => m instanceof Modifiers.PokemonFormChangeItemModifier && m.pokemonId === p.id && m.formChangeItem === t.item));
      }).flat().flatMap(fc => fc.item);

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
  POKEBALL: () => new AddPokeballModifierType("pb", PokeballType.POKEBALL, 5),
  GREAT_BALL: () => new AddPokeballModifierType("gb", PokeballType.GREAT_BALL, 5),
  ULTRA_BALL: () => new AddPokeballModifierType("ub", PokeballType.ULTRA_BALL, 5),
  ROGUE_BALL: () => new AddPokeballModifierType("rb", PokeballType.ROGUE_BALL, 5),
  MASTER_BALL: () => new AddPokeballModifierType("mb", PokeballType.MASTER_BALL, 1),

  RARE_CANDY: () => new PokemonLevelIncrementModifierType("modifierType:ModifierType.RARE_CANDY", "rare_candy"),
  RARER_CANDY: () => new AllPokemonLevelIncrementModifierType("modifierType:ModifierType.RARER_CANDY", "rarer_candy"),

  EVOLUTION_ITEM: () => new EvolutionItemModifierTypeGenerator(false),
  RARE_EVOLUTION_ITEM: () => new EvolutionItemModifierTypeGenerator(true),
  FORM_CHANGE_ITEM: () => new FormChangeItemModifierTypeGenerator(),

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

  ETHER: () => new PokemonPpRestoreModifierType("modifierType:ModifierType.ETHER", "ether", 10),
  MAX_ETHER: () => new PokemonPpRestoreModifierType("modifierType:ModifierType.MAX_ETHER", "max_ether", -1),

  ELIXIR: () => new PokemonAllMovePpRestoreModifierType("modifierType:ModifierType.ELIXIR", "elixir", 10),
  MAX_ELIXIR: () => new PokemonAllMovePpRestoreModifierType("modifierType:ModifierType.MAX_ELIXIR", "max_elixir", -1),

  PP_UP: () => new PokemonPpUpModifierType("modifierType:ModifierType.PP_UP", "pp_up", 1),
  PP_MAX: () => new PokemonPpUpModifierType("modifierType:ModifierType.PP_MAX", "pp_max", 3),

  /*REPEL: () => new DoubleBattleChanceBoosterModifierType('Repel', 5),
  SUPER_REPEL: () => new DoubleBattleChanceBoosterModifierType('Super Repel', 10),
  MAX_REPEL: () => new DoubleBattleChanceBoosterModifierType('Max Repel', 25),*/

  LURE: () => new DoubleBattleChanceBoosterModifierType("modifierType:ModifierType.LURE", "lure", 5),
  SUPER_LURE: () => new DoubleBattleChanceBoosterModifierType("modifierType:ModifierType.SUPER_LURE", "super_lure", 10),
  MAX_LURE: () => new DoubleBattleChanceBoosterModifierType("modifierType:ModifierType.MAX_LURE", "max_lure", 25),

  TEMP_STAT_BOOSTER: () => new ModifierTypeGenerator((party: Pokemon[], pregenArgs?: any[]) => {
    if (pregenArgs) {
      return new TempBattleStatBoosterModifierType(pregenArgs[0] as TempBattleStat);
    }
    const randTempBattleStat = Utils.randSeedInt(6) as TempBattleStat;
    return new TempBattleStatBoosterModifierType(randTempBattleStat);
  }),
  DIRE_HIT: () => new TempBattleStatBoosterModifierType(TempBattleStat.CRIT),

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
    if (pregenArgs) {
      return new PokemonNatureChangeModifierType(pregenArgs[0] as Nature);
    }
    return new PokemonNatureChangeModifierType(Utils.randSeedInt(Utils.getEnumValues(Nature).length) as Nature);
  }),

  TERA_SHARD: () => new ModifierTypeGenerator((party: Pokemon[], pregenArgs?: any[]) => {
    if (pregenArgs) {
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
    if (pregenArgs) {
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

  BATON: () => new PokemonHeldItemModifierType("modifierType:ModifierType.BATON", "stick", (type, args) => new Modifiers.SwitchEffectTransferModifier(type, (args[0] as Pokemon).id)),

  SHINY_CHARM: () => new ModifierType("modifierType:ModifierType.SHINY_CHARM", "shiny_charm", (type, _args) => new Modifiers.ShinyRateBoosterModifier(type)),
  ABILITY_CHARM: () => new ModifierType("modifierType:ModifierType.ABILITY_CHARM", "ability_charm", (type, _args) => new Modifiers.HiddenAbilityRateBoosterModifier(type)),

  IV_SCANNER: () => new ModifierType("modifierType:ModifierType.IV_SCANNER", "scanner", (type, _args) => new Modifiers.IvScannerModifier(type)),

  DNA_SPLICERS: () => new FusePokemonModifierType("modifierType:ModifierType.DNA_SPLICERS", "dna_splicers"),

  MINI_BLACK_HOLE: () => new TurnHeldItemTransferModifierType("modifierType:ModifierType.MINI_BLACK_HOLE", "mini_black_hole"),

  VOUCHER: () => new AddVoucherModifierType(VoucherType.REGULAR, 1),
  VOUCHER_PLUS: () => new AddVoucherModifierType(VoucherType.PLUS, 1),
  VOUCHER_PREMIUM: () => new AddVoucherModifierType(VoucherType.PREMIUM, 1),

  GOLDEN_POKEBALL: () => new ModifierType("modifierType:ModifierType.GOLDEN_POKEBALL", "pb_gold", (type, _args) => new Modifiers.ExtraModifierModifier(type), null, "pb_bounce_1"),

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

const modifierPool: ModifierPool = {
  [ModifierTier.COMMON]: [
    new WeightedModifierType(modifierTypes.POKEBALL, 6),
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
      const thresholdPartyMemberCount = Math.min(party.filter(p => p.hp && p.getMoveset().filter(m => m.ppUsed && (m.getMovePp() - m.ppUsed) <= 5).length).length, 3);
      return thresholdPartyMemberCount * 3;
    }, 9),
    new WeightedModifierType(modifierTypes.MAX_ETHER, (party: Pokemon[]) => {
      const thresholdPartyMemberCount = Math.min(party.filter(p => p.hp && p.getMoveset().filter(m => m.ppUsed && (m.getMovePp() - m.ppUsed) <= 5).length).length, 3);
      return thresholdPartyMemberCount;
    }, 3),
    new WeightedModifierType(modifierTypes.LURE, 2),
    new WeightedModifierType(modifierTypes.TEMP_STAT_BOOSTER, 4),
    new WeightedModifierType(modifierTypes.BERRY, 2),
    new WeightedModifierType(modifierTypes.TM_COMMON, 1),
  ].map(m => {
    m.setTier(ModifierTier.COMMON); return m;
  }),
  [ModifierTier.GREAT]: [
    new WeightedModifierType(modifierTypes.GREAT_BALL, 6),
    new WeightedModifierType(modifierTypes.FULL_HEAL, (party: Pokemon[]) => {
      const statusEffectPartyMemberCount = Math.min(party.filter(p => p.hp && !!p.status && !p.getHeldItems().some(i => {
        if (i instanceof Modifiers.TurnStatusEffectModifier) {
          return (i as Modifiers.TurnStatusEffectModifier).getStatusEffect() === p.status.effect;
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
          return (i as Modifiers.TurnStatusEffectModifier).getStatusEffect() === p.status.effect;
        }
        return false;
      })).length, 3);
      const thresholdPartyMemberCount = Math.floor((Math.min(party.filter(p => (p.getInverseHp() >= 150 || p.getHpRatio() <= 0.5) && !p.isFainted()).length, 3) + statusEffectPartyMemberCount) / 2);
      return thresholdPartyMemberCount;
    }, 3),
    new WeightedModifierType(modifierTypes.ELIXIR, (party: Pokemon[]) => {
      const thresholdPartyMemberCount = Math.min(party.filter(p => p.hp && p.getMoveset().filter(m => m.ppUsed && (m.getMovePp() - m.ppUsed) <= 5).length).length, 3);
      return thresholdPartyMemberCount * 3;
    }, 9),
    new WeightedModifierType(modifierTypes.MAX_ELIXIR, (party: Pokemon[]) => {
      const thresholdPartyMemberCount = Math.min(party.filter(p => p.hp && p.getMoveset().filter(m => m.ppUsed && (m.getMovePp() - m.ppUsed) <= 5).length).length, 3);
      return thresholdPartyMemberCount;
    }, 3),
    new WeightedModifierType(modifierTypes.DIRE_HIT, 4),
    new WeightedModifierType(modifierTypes.SUPER_LURE, 4),
    new WeightedModifierType(modifierTypes.NUGGET, 5),
    new WeightedModifierType(modifierTypes.EVOLUTION_ITEM, (party: Pokemon[]) => {
      return Math.min(Math.ceil(party[0].scene.currentBattle.waveIndex / 15), 8);
    }, 8),
    new WeightedModifierType(modifierTypes.MAP, (party: Pokemon[]) => party[0].scene.gameMode.isClassic && party[0].scene.currentBattle.waveIndex < 180 ? 1 : 0, 1),
    new WeightedModifierType(modifierTypes.TM_GREAT, 2),
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
    new WeightedModifierType(modifierTypes.ULTRA_BALL, 24),
    new WeightedModifierType(modifierTypes.MAX_LURE, 4),
    new WeightedModifierType(modifierTypes.BIG_NUGGET, 12),
    new WeightedModifierType(modifierTypes.PP_UP, 9),
    new WeightedModifierType(modifierTypes.PP_MAX, 3),
    new WeightedModifierType(modifierTypes.MINT, 4),
    new WeightedModifierType(modifierTypes.RARE_EVOLUTION_ITEM, (party: Pokemon[]) => Math.min(Math.ceil(party[0].scene.currentBattle.waveIndex / 15) * 4, 32), 32),
    new WeightedModifierType(modifierTypes.AMULET_COIN, 3),
    new WeightedModifierType(modifierTypes.TOXIC_ORB, (party: Pokemon[]) => {
      const checkedAbilities = [Abilities.QUICK_FEET, Abilities.GUTS, Abilities.MARVEL_SCALE, Abilities.TOXIC_BOOST, Abilities.POISON_HEAL, Abilities.MAGIC_GUARD];
      const checkedMoves = [Moves.FACADE, Moves.TRICK, Moves.FLING, Moves.SWITCHEROO, Moves.PSYCHO_SHIFT];
      // If a party member doesn't already have one of these two orbs and has one of the above moves or abilities, the orb can appear
      return party.some(p => !p.getHeldItems().some(i => i instanceof Modifiers.TurnStatusEffectModifier) && (checkedAbilities.some(a => p.hasAbility(a, false, true)) || p.getMoveset(true).some(m => checkedMoves.includes(m.moveId)))) ? 10 : 0;
    }, 10),
    new WeightedModifierType(modifierTypes.FLAME_ORB, (party: Pokemon[]) => {
      const checkedAbilities = [Abilities.QUICK_FEET, Abilities.GUTS, Abilities.MARVEL_SCALE, Abilities.FLARE_BOOST, Abilities.MAGIC_GUARD];
      const checkedMoves = [Moves.FACADE, Moves.TRICK, Moves.FLING, Moves.SWITCHEROO, Moves.PSYCHO_SHIFT];
      // If a party member doesn't already have one of these two orbs and has one of the above moves or abilities, the orb can appear
      return party.some(p => !p.getHeldItems().some(i => i instanceof Modifiers.TurnStatusEffectModifier) && (checkedAbilities.some(a => p.hasAbility(a, false, true)) || p.getMoveset(true).some(m => checkedMoves.includes(m.moveId)))) ? 10 : 0;
    }, 10),
    new WeightedModifierType(modifierTypes.REVIVER_SEED, 4),
    new WeightedModifierType(modifierTypes.CANDY_JAR, 5),
    new WeightedModifierType(modifierTypes.ATTACK_TYPE_BOOSTER, 10),
    new WeightedModifierType(modifierTypes.TM_ULTRA, 8),
    new WeightedModifierType(modifierTypes.RARER_CANDY, 4),
    new WeightedModifierType(modifierTypes.GOLDEN_PUNCH, 2),
    new WeightedModifierType(modifierTypes.IV_SCANNER, 4),
    new WeightedModifierType(modifierTypes.EXP_CHARM, 8),
    new WeightedModifierType(modifierTypes.EXP_SHARE, 12),
    new WeightedModifierType(modifierTypes.EXP_BALANCE, 4),
    new WeightedModifierType(modifierTypes.TERA_ORB, (party: Pokemon[]) => Math.min(Math.max(Math.floor(party[0].scene.currentBattle.waveIndex / 50) * 2, 1), 4), 4),
    new WeightedModifierType(modifierTypes.WIDE_LENS, 4),
  ].map(m => {
    m.setTier(ModifierTier.ULTRA); return m;
  }),
  [ModifierTier.ROGUE]: [
    new WeightedModifierType(modifierTypes.ROGUE_BALL, 24),
    new WeightedModifierType(modifierTypes.RELIC_GOLD, 2),
    new WeightedModifierType(modifierTypes.LEFTOVERS, 3),
    new WeightedModifierType(modifierTypes.SHELL_BELL, 3),
    new WeightedModifierType(modifierTypes.BERRY_POUCH, 4),
    new WeightedModifierType(modifierTypes.GRIP_CLAW, 5),
    new WeightedModifierType(modifierTypes.BATON, 2),
    new WeightedModifierType(modifierTypes.SOUL_DEW, 8),
    //new WeightedModifierType(modifierTypes.OVAL_CHARM, 6),
    new WeightedModifierType(modifierTypes.SOOTHE_BELL, 4),
    new WeightedModifierType(modifierTypes.ABILITY_CHARM, 6),
    new WeightedModifierType(modifierTypes.FOCUS_BAND, 5),
    new WeightedModifierType(modifierTypes.QUICK_CLAW, 3),
    new WeightedModifierType(modifierTypes.KINGS_ROCK, 3),
    new WeightedModifierType(modifierTypes.LOCK_CAPSULE, 3),
    new WeightedModifierType(modifierTypes.SUPER_EXP_CHARM, 10),
    new WeightedModifierType(modifierTypes.FORM_CHANGE_ITEM, 18),
    new WeightedModifierType(modifierTypes.MEGA_BRACELET, (party: Pokemon[]) => Math.min(Math.ceil(party[0].scene.currentBattle.waveIndex / 50), 4) * 8, 32),
    new WeightedModifierType(modifierTypes.DYNAMAX_BAND, (party: Pokemon[]) => Math.min(Math.ceil(party[0].scene.currentBattle.waveIndex / 50), 4) * 8, 32),
    new WeightedModifierType(modifierTypes.VOUCHER_PLUS, (party: Pokemon[], rerollCount: integer) => !party[0].scene.gameMode.isDaily ? Math.max(5 - rerollCount * 2, 0) : 0, 5),
  ].map(m => {
    m.setTier(ModifierTier.ROGUE); return m;
  }),
  [ModifierTier.MASTER]: [
    new WeightedModifierType(modifierTypes.MASTER_BALL, 24),
    new WeightedModifierType(modifierTypes.SHINY_CHARM, 14),
    new WeightedModifierType(modifierTypes.HEALING_CHARM, 18),
    new WeightedModifierType(modifierTypes.MULTI_LENS, 18),
    new WeightedModifierType(modifierTypes.VOUCHER_PREMIUM, (party: Pokemon[], rerollCount: integer) => !party[0].scene.gameMode.isDaily && !party[0].scene.gameMode.isEndless && !party[0].scene.gameMode.isSplicedOnly ? Math.max(6 - rerollCount * 2, 0) : 0, 6),
    new WeightedModifierType(modifierTypes.DNA_SPLICERS, (party: Pokemon[]) => !party[0].scene.gameMode.isSplicedOnly && party.filter(p => !p.fusionSpecies).length > 1 ? 24 : 0, 24),
    new WeightedModifierType(modifierTypes.MINI_BLACK_HOLE, (party: Pokemon[]) => party[0].scene.gameData.unlocks[Unlockables.MINI_BLACK_HOLE] ? 1 : 0, 1),
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
    new WeightedModifierType(modifierTypes.ATTACK_TYPE_BOOSTER, 1),
  ].map(m => {
    m.setTier(ModifierTier.ULTRA); return m;
  }),
  [ModifierTier.ROGUE]: [
    new WeightedModifierType(modifierTypes.REVIVER_SEED, 2),
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
  [ModifierTier.ROGUE]: [ ].map(m => {
    m.setTier(ModifierTier.ROGUE); return m;
  }),
  [ModifierTier.MASTER]: [ ].map(m => {
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
    modifierType.id = Object.keys(modifierTypes).find(k => modifierTypes[k] === modifierTypeFunc);
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
    let candidate = getNewModifierTypeOption(party, ModifierPoolType.PLAYER, modifierTiers?.length > i ? modifierTiers[i] : undefined);
    let r = 0;
    while (options.length && ++r < retryCount && options.filter(o => o.type.name === candidate.type.name || o.type.group === candidate.type.group).length) {
      candidate = getNewModifierTypeOption(party, ModifierPoolType.PLAYER, candidate.type.tier, candidate.upgradeCount);
    }
    options.push(candidate);
  });
  // OVERRIDE IF NECESSARY
  if (Overrides.ITEM_REWARD_OVERRIDE?.length) {
    options.forEach((mod, i) => {
      // @ts-ignore: keeps throwing don't use string as index error in typedoc run
      const override = modifierTypes[Overrides.ITEM_REWARD_OVERRIDE[i]]?.();
      mod.type = (override instanceof ModifierTypeGenerator ? override.generateType(party) : override) || mod.type;
    });
  }
  return options;
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
  const tierStackCount = tier === ModifierTier.ULTRA ? 5 : tier === ModifierTier.GREAT ? 3 : 1;
  const retryCount = 50;
  let candidate = getNewModifierTypeOption(null, ModifierPoolType.ENEMY_BUFF, tier);
  let r = 0;
  let matchingModifier: Modifiers.PersistentModifier;
  while (++r < retryCount && (matchingModifier = enemyModifiers.find(m => m.type.id === candidate.type.id)) && matchingModifier.getMaxStackCount(scene) < matchingModifier.stackCount + (r < 10 ? tierStackCount : 1)) {
    candidate = getNewModifierTypeOption(null, ModifierPoolType.ENEMY_BUFF, tier);
  }

  const modifier = candidate.type.newModifier() as Modifiers.EnemyPersistentModifier;
  modifier.stackCount = tierStackCount;

  return modifier;
}

export function getEnemyModifierTypesForWave(waveIndex: integer, count: integer, party: EnemyPokemon[], poolType: ModifierPoolType.WILD | ModifierPoolType.TRAINER, upgradeChance: integer = 0): PokemonHeldItemModifierType[] {
  const ret = new Array(count).fill(0).map(() => getNewModifierTypeOption(party, poolType, undefined, upgradeChance && !Utils.randSeedInt(upgradeChance) ? 1 : 0).type as PokemonHeldItemModifierType);
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
    tier = tierValue > 255 ? ModifierTier.COMMON : tierValue > 60 ? ModifierTier.GREAT : tierValue > 12 ? ModifierTier.ULTRA : tierValue ? ModifierTier.ROGUE : ModifierTier.MASTER;
    // Does this actually do anything?
    if (!upgradeCount) {
      upgradeCount = Math.min(upgradeCount, ModifierTier.MASTER - tier);
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
  let index: integer;
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
  let modifierType: ModifierType = (pool[tier][index]).modifierType;
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

  return new ModifierTypeOption(modifierType as ModifierType, upgradeCount);
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
  const luck = Phaser.Math.Clamp(party.map(p => p.isFainted() ? 0 : p.getLuck())
    .reduce((total: integer, value: integer) => total += value, 0), 0, 14);
  return luck || 0;
}

export function getLuckString(luckValue: integer): string {
  return [ "D", "C", "C+", "B-", "B", "B+", "A-", "A", "A+", "A++", "S", "S+", "SS", "SS+", "SSS" ][luckValue];
}

export function getLuckTextTint(luckValue: integer): integer {
  const modifierTier = luckValue ? luckValue > 2 ? luckValue > 5 ? luckValue > 9 ? luckValue > 11 ? ModifierTier.LUXURY : ModifierTier.MASTER : ModifierTier.ROGUE : ModifierTier.ULTRA : ModifierTier.GREAT : ModifierTier.COMMON;
  return getModifierTierTextTint(modifierTier);
}
