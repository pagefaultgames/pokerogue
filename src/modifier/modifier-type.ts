import { TYPE_BOOST_ITEM_BOOST_PERCENT } from "#app/constants";
import { timedEventManager } from "#app/global-event-manager";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import Overrides from "#app/overrides";
import { EvolutionItem, pokemonEvolutions } from "#balance/pokemon-evolutions";
import { tmPoolTiers, tmSpecies } from "#balance/tms";
import { getBerryEffectDescription, getBerryName } from "#data/berry";
import { getDailyEventSeedLuck } from "#data/daily-run";
import { allMoves, modifierTypes } from "#data/data-lists";
import { SpeciesFormChangeItemTrigger } from "#data/form-change-triggers";
import { getNatureName, getNatureStatMultiplier } from "#data/nature";
import { getPokeballCatchMultiplier, getPokeballName } from "#data/pokeball";
import { pokemonFormChanges, SpeciesFormChangeCondition } from "#data/pokemon-forms";
import { getStatusEffectDescriptor } from "#data/status-effect";
import { BattlerTagType } from "#enums/battler-tag-type";
import { BerryType } from "#enums/berry-type";
import { ChallengeType } from "#enums/challenge-type";
import { FormChangeItem } from "#enums/form-change-item";
import { ModifierPoolType } from "#enums/modifier-pool-type";
import { ModifierTier } from "#enums/modifier-tier";
import { MoveId } from "#enums/move-id";
import { Nature } from "#enums/nature";
import { PokeballType } from "#enums/pokeball";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesFormKey } from "#enums/species-form-key";
import { SpeciesId } from "#enums/species-id";
import type { PermanentStat, TempBattleStat } from "#enums/stat";
import { getStatKey, Stat, TEMP_BATTLE_STATS } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import type { EnemyPokemon, PlayerPokemon, Pokemon } from "#field/pokemon";
import {
  AddPokeballModifier,
  AddVoucherModifier,
  AttackTypeBoosterModifier,
  BaseStatModifier,
  BerryModifier,
  BoostBugSpawnModifier,
  BypassSpeedChanceModifier,
  ContactHeldItemTransferChanceModifier,
  CritBoosterModifier,
  CriticalCatchChanceBoosterModifier,
  DamageMoneyRewardModifier,
  DoubleBattleChanceBoosterModifier,
  EnemyAttackStatusEffectChanceModifier,
  EnemyDamageBoosterModifier,
  EnemyDamageReducerModifier,
  EnemyEndureChanceModifier,
  EnemyFusionChanceModifier,
  type EnemyPersistentModifier,
  EnemyStatusEffectHealChanceModifier,
  EnemyTurnHealModifier,
  EvolutionItemModifier,
  EvolutionStatBoosterModifier,
  EvoTrackerModifier,
  ExpBalanceModifier,
  ExpBoosterModifier,
  ExpShareModifier,
  ExtraModifierModifier,
  FieldEffectModifier,
  FlinchChanceModifier,
  FusePokemonModifier,
  GigantamaxAccessModifier,
  HealingBoosterModifier,
  HealShopCostModifier,
  HiddenAbilityRateBoosterModifier,
  HitHealModifier,
  IvScannerModifier,
  LevelIncrementBoosterModifier,
  LockModifierTiersModifier,
  MapModifier,
  MegaEvolutionAccessModifier,
  type Modifier,
  MoneyInterestModifier,
  MoneyMultiplierModifier,
  MoneyRewardModifier,
  MultipleParticipantExpBonusModifier,
  type PersistentModifier,
  PokemonAllMovePpRestoreModifier,
  PokemonBaseStatFlatModifier,
  PokemonBaseStatTotalModifier,
  PokemonExpBoosterModifier,
  PokemonFormChangeItemModifier,
  PokemonFriendshipBoosterModifier,
  PokemonHeldItemModifier,
  PokemonHpRestoreModifier,
  PokemonIncrementingStatModifier,
  PokemonInstantReviveModifier,
  PokemonLevelIncrementModifier,
  PokemonMoveAccuracyBoosterModifier,
  PokemonMultiHitModifier,
  PokemonNatureChangeModifier,
  PokemonNatureWeightModifier,
  PokemonPpRestoreModifier,
  PokemonPpUpModifier,
  PokemonStatusHealModifier,
  PreserveBerryModifier,
  RememberMoveModifier,
  ResetNegativeStatStageModifier,
  ShinyRateBoosterModifier,
  SpeciesCritBoosterModifier,
  SpeciesStatBoosterModifier,
  SurviveDamageModifier,
  SwitchEffectTransferModifier,
  TempCritBoosterModifier,
  TempExtraModifierModifier,
  TempStatStageBoosterModifier,
  TerastallizeAccessModifier,
  TerastallizeModifier,
  TmModifier,
  TurnHealModifier,
  TurnHeldItemTransferModifier,
  TurnStatusEffectModifier,
} from "#modifiers/modifier";
import type { PokemonMove } from "#moves/pokemon-move";
import { getVoucherTypeIcon, getVoucherTypeName, VoucherType } from "#system/voucher";
import type { ModifierTypeFunc, WeightedModifierTypeWeightFunc } from "#types/modifier-types";
import type { PokemonMoveSelectFilter, PokemonSelectFilter } from "#ui/handlers/party-ui-handler";
import { PartyUiHandler } from "#ui/handlers/party-ui-handler";
import { getModifierTierTextTint } from "#ui/text";
import { applyChallenges } from "#utils/challenge-utils";
import {
  BooleanHolder,
  formatMoney,
  isNullOrUndefined,
  NumberHolder,
  padInt,
  randSeedInt,
  randSeedItem,
} from "#utils/common";
import { getEnumKeys, getEnumValues } from "#utils/enums";
import { getModifierPoolForType, getModifierType } from "#utils/modifier-utils";
import { toCamelCase } from "#utils/strings";
import i18next from "i18next";

const outputModifierData = false;
const useMaxWeightForOutput = false;

type NewModifierFunc = (type: ModifierType, args: any[]) => Modifier;

export class ModifierType {
  public id: string;
  public localeKey: string;
  public iconImage: string;
  public group: string;
  public soundName: string;
  public tier: ModifierTier;
  protected newModifierFunc: NewModifierFunc | null;

  /**
   * Checks if the modifier type is of a specific type
   * @param modifierType - The type to check against
   * @return Whether the modifier type is of the specified type
   */
  public is<K extends ModifierTypeString>(modifierType: K): this is ModifierTypeInstanceMap[K] {
    const targetType = ModifierTypeConstructorMap[modifierType];
    if (!targetType) {
      return false;
    }
    return this instanceof targetType;
  }

  constructor(
    localeKey: string | null,
    iconImage: string | null,
    newModifierFunc: NewModifierFunc | null,
    group?: string,
    soundName?: string,
  ) {
    this.localeKey = localeKey!; // TODO: is this bang correct?
    this.iconImage = iconImage!; // TODO: is this bang correct?
    this.group = group!; // TODO: is this bang correct?
    this.soundName = soundName ?? "se/restore";
    this.newModifierFunc = newModifierFunc;
  }

  get name(): string {
    return i18next.t(`${this.localeKey}.name` as any);
  }

  getDescription(): string {
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
        poolTypes = [poolType, ModifierPoolType.TRAINER, ModifierPoolType.WILD];
        break;
      case ModifierPoolType.WILD:
        poolTypes = [poolType, ModifierPoolType.PLAYER, ModifierPoolType.TRAINER];
        break;
      case ModifierPoolType.TRAINER:
        poolTypes = [poolType, ModifierPoolType.PLAYER, ModifierPoolType.WILD];
        break;
      default:
        poolTypes = [poolType];
        break;
    }
    // Try multiple pool types in case of stolen items
    for (const type of poolTypes) {
      const pool = getModifierPoolForType(type);
      for (const tier of getEnumValues(ModifierTier)) {
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

  /**
   * Populates item id for ModifierType instance
   * @param func
   */
  withIdFromFunc(func: ModifierTypeFunc): ModifierType {
    this.id = Object.keys(modifierTypeInitObj).find(k => modifierTypeInitObj[k] === func)!; // TODO: is this bang correct?
    return this;
  }

  /**
   * Populates item tier for ModifierType instance
   * Tier is a necessary field for items that appear in player shop (determines the Pokeball visual they use)
   * To find the tier, this function performs a reverse lookup of the item type in modifier pools
   * It checks the weight of the item and will use the first tier for which the weight is greater than 0
   * This is to allow items to be in multiple item pools depending on the conditions, for example for events
   * If all tiers have a weight of 0 for the item, the first tier where the item was found is used
   * @param poolType Default 'ModifierPoolType.PLAYER'. Which pool to lookup item tier from
   * @param party optional. Needed to check the weight of modifiers with conditional weight (see {@linkcode WeightedModifierTypeWeightFunc})
   *  if not provided or empty, the weight check will be ignored
   * @param rerollCount Default `0`. Used to check the weight of modifiers with conditional weight (see {@linkcode WeightedModifierTypeWeightFunc})
   */
  withTierFromPool(
    poolType: ModifierPoolType = ModifierPoolType.PLAYER,
    party?: PlayerPokemon[],
    rerollCount = 0,
  ): ModifierType {
    let defaultTier: undefined | ModifierTier;
    for (const tier of Object.values(getModifierPoolForType(poolType))) {
      for (const modifier of tier) {
        if (this.id === modifier.modifierType.id) {
          let weight: number;
          if (modifier.weight instanceof Function) {
            weight = party ? modifier.weight(party, rerollCount) : 0;
          } else {
            weight = modifier.weight;
          }
          if (weight > 0) {
            this.tier = modifier.modifierType.tier;
            return this;
          }
          if (isNullOrUndefined(defaultTier)) {
            // If weight is 0, keep track of the first tier where the item was found
            defaultTier = modifier.modifierType.tier;
          }
        }
      }
    }

    // Didn't find a pool with weight > 0, fallback to first tier where the item was found, if any
    if (defaultTier) {
      this.tier = defaultTier;
    }

    return this;
  }

  newModifier(...args: any[]): Modifier | null {
    // biome-ignore lint/complexity/useOptionalChain: Changing to optional would coerce null return into undefined
    return this.newModifierFunc && this.newModifierFunc(this, args);
  }
}

type ModifierTypeGeneratorFunc = (party: Pokemon[], pregenArgs?: any[]) => ModifierType | null;

export class ModifierTypeGenerator extends ModifierType {
  private genTypeFunc: ModifierTypeGeneratorFunc;

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

export class AddPokeballModifierType extends ModifierType {
  private pokeballType: PokeballType;
  private count: number;

  constructor(iconImage: string, pokeballType: PokeballType, count: number) {
    super("", iconImage, (_type, _args) => new AddPokeballModifier(this, pokeballType, count), "pb", "se/pb_bounce_1");
    this.pokeballType = pokeballType;
    this.count = count;
  }

  get name(): string {
    return i18next.t("modifierType:ModifierType.AddPokeballModifierType.name", {
      modifierCount: this.count,
      pokeballName: getPokeballName(this.pokeballType),
    });
  }

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.AddPokeballModifierType.description", {
      modifierCount: this.count,
      pokeballName: getPokeballName(this.pokeballType),
      catchRate:
        getPokeballCatchMultiplier(this.pokeballType) > -1
          ? `${getPokeballCatchMultiplier(this.pokeballType)}x`
          : "100%",
      pokeballAmount: `${globalScene.pokeballCounts[this.pokeballType]}`,
    });
  }
}

export class AddVoucherModifierType extends ModifierType {
  private voucherType: VoucherType;
  private count: number;

  constructor(voucherType: VoucherType, count: number) {
    super(
      "",
      getVoucherTypeIcon(voucherType),
      (_type, _args) => new AddVoucherModifier(this, voucherType, count),
      "voucher",
    );
    this.count = count;
    this.voucherType = voucherType;
  }

  get name(): string {
    return i18next.t("modifierType:ModifierType.AddVoucherModifierType.name", {
      modifierCount: this.count,
      voucherTypeName: getVoucherTypeName(this.voucherType),
    });
  }

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.AddVoucherModifierType.description", {
      modifierCount: this.count,
      voucherTypeName: getVoucherTypeName(this.voucherType),
    });
  }
}

export class PokemonModifierType extends ModifierType {
  public selectFilter: PokemonSelectFilter | undefined;

  constructor(
    localeKey: string,
    iconImage: string,
    newModifierFunc: NewModifierFunc,
    selectFilter?: PokemonSelectFilter,
    group?: string,
    soundName?: string,
  ) {
    super(localeKey, iconImage, newModifierFunc, group, soundName);

    this.selectFilter = selectFilter;
  }
}

export class PokemonHeldItemModifierType extends PokemonModifierType {
  constructor(
    localeKey: string,
    iconImage: string,
    newModifierFunc: NewModifierFunc,
    group?: string,
    soundName?: string,
  ) {
    super(
      localeKey,
      iconImage,
      newModifierFunc,
      (pokemon: PlayerPokemon) => {
        const dummyModifier = this.newModifier(pokemon);
        const matchingModifier = globalScene.findModifier(
          m => m instanceof PokemonHeldItemModifier && m.pokemonId === pokemon.id && m.matchType(dummyModifier),
        ) as PokemonHeldItemModifier;
        const maxStackCount = dummyModifier.getMaxStackCount();
        if (!maxStackCount) {
          return i18next.t("modifierType:ModifierType.PokemonHeldItemModifierType.extra.inoperable", {
            pokemonName: getPokemonNameWithAffix(pokemon),
          });
        }
        if (matchingModifier && matchingModifier.stackCount === maxStackCount) {
          return i18next.t("modifierType:ModifierType.PokemonHeldItemModifierType.extra.tooMany", {
            pokemonName: getPokemonNameWithAffix(pokemon),
          });
        }
        return null;
      },
      group,
      soundName,
    );
  }

  newModifier(...args: any[]): PokemonHeldItemModifier {
    return super.newModifier(...args) as PokemonHeldItemModifier;
  }
}

export class TerastallizeModifierType extends PokemonModifierType {
  private teraType: PokemonType;

  constructor(teraType: PokemonType) {
    super(
      "",
      `${PokemonType[teraType].toLowerCase()}_tera_shard`,
      (type, args) => new TerastallizeModifier(type as TerastallizeModifierType, (args[0] as Pokemon).id, teraType),
      (pokemon: PlayerPokemon) => {
        if (
          [pokemon.species.speciesId, pokemon.fusionSpecies?.speciesId].filter(
            s => s === SpeciesId.TERAPAGOS || s === SpeciesId.OGERPON || s === SpeciesId.SHEDINJA,
          ).length > 0
        ) {
          return PartyUiHandler.NoEffectMessage;
        }
        return null;
      },
      "tera_shard",
    );

    this.teraType = teraType;
  }

  get name(): string {
    return i18next.t("modifierType:ModifierType.TerastallizeModifierType.name", {
      teraType: i18next.t(`pokemonInfo:type.${toCamelCase(PokemonType[this.teraType])}`),
    });
  }

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.TerastallizeModifierType.description", {
      teraType: i18next.t(`pokemonInfo:type.${toCamelCase(PokemonType[this.teraType])}`),
    });
  }

  getPregenArgs(): any[] {
    return [this.teraType];
  }
}

export class PokemonHpRestoreModifierType extends PokemonModifierType {
  protected restorePoints: number;
  protected restorePercent: number;
  protected healStatus: boolean;

  constructor(
    localeKey: string,
    iconImage: string,
    restorePoints: number,
    restorePercent: number,
    healStatus = false,
    newModifierFunc?: NewModifierFunc,
    selectFilter?: PokemonSelectFilter,
    group?: string,
  ) {
    super(
      localeKey,
      iconImage,
      newModifierFunc
        || ((_type, args) =>
          new PokemonHpRestoreModifier(
            this,
            (args[0] as PlayerPokemon).id,
            this.restorePoints,
            this.restorePercent,
            this.healStatus,
            false,
          )),
      selectFilter
        || ((pokemon: PlayerPokemon) => {
          if (
            !pokemon.hp
            || (pokemon.isFullHp()
              && (!this.healStatus || (!pokemon.status && !pokemon.getTag(BattlerTagType.CONFUSED))))
          ) {
            return PartyUiHandler.NoEffectMessage;
          }
          return null;
        }),
      group || "potion",
    );

    this.restorePoints = restorePoints;
    this.restorePercent = restorePercent;
    this.healStatus = healStatus;
  }

  getDescription(): string {
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
  constructor(localeKey: string, iconImage: string, restorePercent: number) {
    super(
      localeKey,
      iconImage,
      0,
      restorePercent,
      false,
      (_type, args) =>
        new PokemonHpRestoreModifier(this, (args[0] as PlayerPokemon).id, 0, this.restorePercent, false, true),
      (pokemon: PlayerPokemon) => {
        if (!pokemon.isFainted()) {
          return PartyUiHandler.NoEffectMessage;
        }
        return null;
      },
      "revive",
    );

    this.selectFilter = (pokemon: PlayerPokemon) => {
      const selectStatus = new BooleanHolder(pokemon.hp !== 0);
      applyChallenges(ChallengeType.PREVENT_REVIVE, selectStatus);
      if (selectStatus.value) {
        return PartyUiHandler.NoEffectMessage;
      }
      return null;
    };
  }

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.PokemonReviveModifierType.description", {
      restorePercent: this.restorePercent,
    });
  }
}

export class PokemonStatusHealModifierType extends PokemonModifierType {
  constructor(localeKey: string, iconImage: string) {
    super(
      localeKey,
      iconImage,
      (_type, args) => new PokemonStatusHealModifier(this, (args[0] as PlayerPokemon).id),
      (pokemon: PlayerPokemon) => {
        if (!pokemon.hp || (!pokemon.status && !pokemon.getTag(BattlerTagType.CONFUSED))) {
          return PartyUiHandler.NoEffectMessage;
        }
        return null;
      },
    );
  }

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.PokemonStatusHealModifierType.description");
  }
}

export abstract class PokemonMoveModifierType extends PokemonModifierType {
  public moveSelectFilter: PokemonMoveSelectFilter | undefined;

  constructor(
    localeKey: string,
    iconImage: string,
    newModifierFunc: NewModifierFunc,
    selectFilter?: PokemonSelectFilter,
    moveSelectFilter?: PokemonMoveSelectFilter,
    group?: string,
  ) {
    super(localeKey, iconImage, newModifierFunc, selectFilter, group);

    this.moveSelectFilter = moveSelectFilter;
  }
}

export class PokemonPpRestoreModifierType extends PokemonMoveModifierType {
  protected restorePoints: number;

  constructor(localeKey: string, iconImage: string, restorePoints: number) {
    super(
      localeKey,
      iconImage,
      (_type, args) =>
        new PokemonPpRestoreModifier(this, (args[0] as PlayerPokemon).id, args[1] as number, this.restorePoints),
      (_pokemon: PlayerPokemon) => {
        return null;
      },
      (pokemonMove: PokemonMove) => {
        if (!pokemonMove.ppUsed) {
          return PartyUiHandler.NoEffectMessage;
        }
        return null;
      },
      "ether",
    );

    this.restorePoints = restorePoints;
  }

  getDescription(): string {
    return this.restorePoints > -1
      ? i18next.t("modifierType:ModifierType.PokemonPpRestoreModifierType.description", {
          restorePoints: this.restorePoints,
        })
      : i18next.t("modifierType:ModifierType.PokemonPpRestoreModifierType.extra.fully");
  }
}

export class PokemonAllMovePpRestoreModifierType extends PokemonModifierType {
  protected restorePoints: number;

  constructor(localeKey: string, iconImage: string, restorePoints: number) {
    super(
      localeKey,
      iconImage,
      (_type, args) => new PokemonAllMovePpRestoreModifier(this, (args[0] as PlayerPokemon).id, this.restorePoints),
      (pokemon: PlayerPokemon) => {
        if (pokemon.getMoveset().filter(m => m.ppUsed).length === 0) {
          return PartyUiHandler.NoEffectMessage;
        }
        return null;
      },
      "elixir",
    );

    this.restorePoints = restorePoints;
  }

  getDescription(): string {
    return this.restorePoints > -1
      ? i18next.t("modifierType:ModifierType.PokemonAllMovePpRestoreModifierType.description", {
          restorePoints: this.restorePoints,
        })
      : i18next.t("modifierType:ModifierType.PokemonAllMovePpRestoreModifierType.extra.fully");
  }
}

export class PokemonPpUpModifierType extends PokemonMoveModifierType {
  protected upPoints: number;

  constructor(localeKey: string, iconImage: string, upPoints: number) {
    super(
      localeKey,
      iconImage,
      (_type, args) => new PokemonPpUpModifier(this, (args[0] as PlayerPokemon).id, args[1] as number, this.upPoints),
      (_pokemon: PlayerPokemon) => {
        return null;
      },
      (pokemonMove: PokemonMove) => {
        if (pokemonMove.getMove().pp < 5 || pokemonMove.ppUp >= 3 || pokemonMove.maxPpOverride) {
          return PartyUiHandler.NoEffectMessage;
        }
        return null;
      },
      "ppUp",
    );

    this.upPoints = upPoints;
  }

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.PokemonPpUpModifierType.description", { upPoints: this.upPoints });
  }
}

export class PokemonNatureChangeModifierType extends PokemonModifierType {
  protected nature: Nature;

  constructor(nature: Nature) {
    super(
      "",
      `mint_${
        getEnumKeys(Stat)
          .find(s => getNatureStatMultiplier(nature, Stat[s]) > 1)
          ?.toLowerCase() || "neutral"
      }`,
      (_type, args) => new PokemonNatureChangeModifier(this, (args[0] as PlayerPokemon).id, this.nature),
      (pokemon: PlayerPokemon) => {
        if (pokemon.getNature() === this.nature) {
          return PartyUiHandler.NoEffectMessage;
        }
        return null;
      },
      "mint",
    );

    this.nature = nature;
  }

  get name(): string {
    return i18next.t("modifierType:ModifierType.PokemonNatureChangeModifierType.name", {
      natureName: getNatureName(this.nature),
    });
  }

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.PokemonNatureChangeModifierType.description", {
      natureName: getNatureName(this.nature, true, true, true),
    });
  }
}

export class RememberMoveModifierType extends PokemonModifierType {
  constructor(localeKey: string, iconImage: string, group?: string) {
    super(
      localeKey,
      iconImage,
      (type, args) => new RememberMoveModifier(type, (args[0] as PlayerPokemon).id, args[1] as number),
      (pokemon: PlayerPokemon) => {
        if (pokemon.getLearnableLevelMoves().length === 0) {
          return PartyUiHandler.NoEffectMessage;
        }
        return null;
      },
      group,
    );
  }
}

export class DoubleBattleChanceBoosterModifierType extends ModifierType {
  private maxBattles: number;

  constructor(localeKey: string, iconImage: string, maxBattles: number) {
    super(localeKey, iconImage, (_type, _args) => new DoubleBattleChanceBoosterModifier(this, maxBattles), "lure");

    this.maxBattles = maxBattles;
  }

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.DoubleBattleChanceBoosterModifierType.description", {
      battleCount: this.maxBattles,
    });
  }
}

export class TempStatStageBoosterModifierType extends ModifierType implements GeneratedPersistentModifierType {
  private stat: TempBattleStat;
  private nameKey: string;
  private quantityKey: string;

  constructor(stat: TempBattleStat) {
    const nameKey = TempStatStageBoosterModifierTypeGenerator.items[stat];
    super("", nameKey, (_type, _args) => new TempStatStageBoosterModifier(this, this.stat, 5));

    this.stat = stat;
    this.nameKey = nameKey;
    this.quantityKey = stat !== Stat.ACC ? "percentage" : "stage";
  }

  get name(): string {
    return i18next.t(`modifierType:TempStatStageBoosterItem.${this.nameKey}`);
  }

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.TempStatStageBoosterModifierType.description", {
      stat: i18next.t(getStatKey(this.stat)),
      amount: i18next.t(`modifierType:ModifierType.TempStatStageBoosterModifierType.extra.${this.quantityKey}`),
    });
  }

  getPregenArgs(): any[] {
    return [this.stat];
  }
}

export class BerryModifierType extends PokemonHeldItemModifierType implements GeneratedPersistentModifierType {
  private berryType: BerryType;

  constructor(berryType: BerryType) {
    super(
      "",
      `${BerryType[berryType].toLowerCase()}_berry`,
      (type, args) => new BerryModifier(type, (args[0] as Pokemon).id, berryType),
      "berry",
    );

    this.berryType = berryType;
    this.id = "BERRY"; // needed to prevent harvest item deletion; remove after modifier rework
  }

  get name(): string {
    return getBerryName(this.berryType);
  }

  getDescription(): string {
    return getBerryEffectDescription(this.berryType);
  }

  getPregenArgs(): any[] {
    return [this.berryType];
  }
}

enum AttackTypeBoosterItem {
  SILK_SCARF,
  BLACK_BELT,
  SHARP_BEAK,
  POISON_BARB,
  SOFT_SAND,
  HARD_STONE,
  SILVER_POWDER,
  SPELL_TAG,
  METAL_COAT,
  CHARCOAL,
  MYSTIC_WATER,
  MIRACLE_SEED,
  MAGNET,
  TWISTED_SPOON,
  NEVER_MELT_ICE,
  DRAGON_FANG,
  BLACK_GLASSES,
  FAIRY_FEATHER,
}

export class AttackTypeBoosterModifierType
  extends PokemonHeldItemModifierType
  implements GeneratedPersistentModifierType
{
  public moveType: PokemonType;
  public boostPercent: number;

  constructor(moveType: PokemonType, boostPercent: number) {
    super(
      "",
      `${AttackTypeBoosterItem[moveType]?.toLowerCase()}`,
      (_type, args) => new AttackTypeBoosterModifier(this, (args[0] as Pokemon).id, moveType, boostPercent),
    );

    this.moveType = moveType;
    this.boostPercent = boostPercent;
  }

  get name(): string {
    return i18next.t(`modifierType:AttackTypeBoosterItem.${AttackTypeBoosterItem[this.moveType]?.toLowerCase()}`);
  }

  getDescription(): string {
    // TODO: Need getTypeName?
    return i18next.t("modifierType:ModifierType.AttackTypeBoosterModifierType.description", {
      moveType: i18next.t(`pokemonInfo:type.${toCamelCase(PokemonType[this.moveType])}`),
    });
  }

  getPregenArgs(): any[] {
    return [this.moveType];
  }
}

export type SpeciesStatBoosterItem = keyof typeof SpeciesStatBoosterModifierTypeGenerator.items;

/**
 * Modifier type for {@linkcode SpeciesStatBoosterModifier}
 * @extends PokemonHeldItemModifierType
 * @implements GeneratedPersistentModifierType
 */
export class SpeciesStatBoosterModifierType
  extends PokemonHeldItemModifierType
  implements GeneratedPersistentModifierType
{
  public key: SpeciesStatBoosterItem;

  constructor(key: SpeciesStatBoosterItem) {
    const item = SpeciesStatBoosterModifierTypeGenerator.items[key];
    super(
      `modifierType:SpeciesBoosterItem.${key}`,
      key.toLowerCase(),
      (type, args) =>
        new SpeciesStatBoosterModifier(type, (args[0] as Pokemon).id, item.stats, item.multiplier, item.species),
    );

    this.key = key;
  }

  getPregenArgs(): any[] {
    return [this.key];
  }
}

export class PokemonLevelIncrementModifierType extends PokemonModifierType {
  constructor(localeKey: string, iconImage: string) {
    super(
      localeKey,
      iconImage,
      (_type, args) => new PokemonLevelIncrementModifier(this, (args[0] as PlayerPokemon).id),
      (_pokemon: PlayerPokemon) => null,
    );
  }

  getDescription(): string {
    let levels = 1;
    const hasCandyJar = globalScene.modifiers.find(modifier => modifier instanceof LevelIncrementBoosterModifier);
    if (hasCandyJar) {
      levels += hasCandyJar.stackCount;
    }
    return i18next.t("modifierType:ModifierType.PokemonLevelIncrementModifierType.description", { levels });
  }
}

export class AllPokemonLevelIncrementModifierType extends ModifierType {
  constructor(localeKey: string, iconImage: string) {
    super(localeKey, iconImage, (_type, _args) => new PokemonLevelIncrementModifier(this, -1));
  }

  getDescription(): string {
    let levels = 1;
    const hasCandyJar = globalScene.modifiers.find(modifier => modifier instanceof LevelIncrementBoosterModifier);
    if (hasCandyJar) {
      levels += hasCandyJar.stackCount;
    }
    return i18next.t("modifierType:ModifierType.AllPokemonLevelIncrementModifierType.description", { levels });
  }
}

export class BaseStatBoosterModifierType
  extends PokemonHeldItemModifierType
  implements GeneratedPersistentModifierType
{
  private stat: PermanentStat;
  private key: string;

  constructor(stat: PermanentStat) {
    const key = BaseStatBoosterModifierTypeGenerator.items[stat];
    super("", key, (_type, args) => new BaseStatModifier(this, (args[0] as Pokemon).id, this.stat));

    this.stat = stat;
    this.key = key;
  }

  get name(): string {
    return i18next.t(`modifierType:BaseStatBoosterItem.${this.key}`);
  }

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.BaseStatBoosterModifierType.description", {
      stat: i18next.t(getStatKey(this.stat)),
    });
  }

  getPregenArgs(): any[] {
    return [this.stat];
  }
}

/**
 * Shuckle Juice item
 */
export class PokemonBaseStatTotalModifierType
  extends PokemonHeldItemModifierType
  implements GeneratedPersistentModifierType
{
  private readonly statModifier: 10 | -15;

  constructor(statModifier: 10 | -15) {
    super(
      statModifier > 0
        ? "modifierType:ModifierType.MYSTERY_ENCOUNTER_SHUCKLE_JUICE_GOOD"
        : "modifierType:ModifierType.MYSTERY_ENCOUNTER_SHUCKLE_JUICE_BAD",
      statModifier > 0 ? "berry_juice_good" : "berry_juice_bad",
      (_type, args) => new PokemonBaseStatTotalModifier(this, (args[0] as Pokemon).id, statModifier),
    );
    this.statModifier = statModifier;
  }

  override getDescription(): string {
    return this.statModifier > 0
      ? i18next.t("modifierType:ModifierType.MYSTERY_ENCOUNTER_SHUCKLE_JUICE_GOOD.description")
      : i18next.t("modifierType:ModifierType.MYSTERY_ENCOUNTER_SHUCKLE_JUICE_BAD.description");
  }

  public getPregenArgs(): any[] {
    return [this.statModifier];
  }
}

class AllPokemonFullHpRestoreModifierType extends ModifierType {
  private descriptionKey: string;

  constructor(localeKey: string, iconImage: string, descriptionKey?: string, newModifierFunc?: NewModifierFunc) {
    super(
      localeKey,
      iconImage,
      newModifierFunc || ((_type, _args) => new PokemonHpRestoreModifier(this, -1, 0, 100, false)),
    );

    this.descriptionKey = descriptionKey!; // TODO: is this bang correct?
  }

  getDescription(): string {
    return i18next.t(
      `${this.descriptionKey || "modifierType:ModifierType.AllPokemonFullHpRestoreModifierType"}.description` as any,
    );
  }
}

class AllPokemonFullReviveModifierType extends AllPokemonFullHpRestoreModifierType {
  constructor(localeKey: string, iconImage: string) {
    super(
      localeKey,
      iconImage,
      "modifierType:ModifierType.AllPokemonFullReviveModifierType",
      (_type, _args) => new PokemonHpRestoreModifier(this, -1, 0, 100, false, true),
    );
    this.group = "revive";
  }
}

export class MoneyRewardModifierType extends ModifierType {
  private moneyMultiplier: number;
  private moneyMultiplierDescriptorKey: string;

  constructor(localeKey: string, iconImage: string, moneyMultiplier: number, moneyMultiplierDescriptorKey: string) {
    super(localeKey, iconImage, (_type, _args) => new MoneyRewardModifier(this, moneyMultiplier), "money", "se/buy");

    this.moneyMultiplier = moneyMultiplier;
    this.moneyMultiplierDescriptorKey = moneyMultiplierDescriptorKey;
  }

  getDescription(): string {
    const moneyAmount = new NumberHolder(globalScene.getWaveMoneyAmount(this.moneyMultiplier));
    globalScene.applyModifiers(MoneyMultiplierModifier, true, moneyAmount);
    const formattedMoney = formatMoney(globalScene.moneyFormat, moneyAmount.value);

    return i18next.t("modifierType:ModifierType.MoneyRewardModifierType.description", {
      moneyMultiplier: i18next.t(this.moneyMultiplierDescriptorKey as any),
      moneyAmount: formattedMoney,
    });
  }
}

export class ExpBoosterModifierType extends ModifierType {
  private boostPercent: number;

  constructor(localeKey: string, iconImage: string, boostPercent: number) {
    super(localeKey, iconImage, () => new ExpBoosterModifier(this, boostPercent));

    this.boostPercent = boostPercent;
  }

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.ExpBoosterModifierType.description", {
      boostPercent: this.boostPercent,
    });
  }
}

export class PokemonExpBoosterModifierType extends PokemonHeldItemModifierType {
  private boostPercent: number;

  constructor(localeKey: string, iconImage: string, boostPercent: number) {
    super(
      localeKey,
      iconImage,
      (_type, args) => new PokemonExpBoosterModifier(this, (args[0] as Pokemon).id, boostPercent),
    );

    this.boostPercent = boostPercent;
  }

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.PokemonExpBoosterModifierType.description", {
      boostPercent: this.boostPercent,
    });
  }
}

export class PokemonFriendshipBoosterModifierType extends PokemonHeldItemModifierType {
  constructor(localeKey: string, iconImage: string) {
    super(localeKey, iconImage, (_type, args) => new PokemonFriendshipBoosterModifier(this, (args[0] as Pokemon).id));
  }

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.PokemonFriendshipBoosterModifierType.description");
  }
}

export class PokemonMoveAccuracyBoosterModifierType extends PokemonHeldItemModifierType {
  private amount: number;

  constructor(localeKey: string, iconImage: string, amount: number, group?: string, soundName?: string) {
    super(
      localeKey,
      iconImage,
      (_type, args) => new PokemonMoveAccuracyBoosterModifier(this, (args[0] as Pokemon).id, amount),
      group,
      soundName,
    );

    this.amount = amount;
  }

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.PokemonMoveAccuracyBoosterModifierType.description", {
      accuracyAmount: this.amount,
    });
  }
}

export class PokemonMultiHitModifierType extends PokemonHeldItemModifierType {
  constructor(localeKey: string, iconImage: string) {
    super(
      localeKey,
      iconImage,
      (type, args) => new PokemonMultiHitModifier(type as PokemonMultiHitModifierType, (args[0] as Pokemon).id),
    );
  }

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.PokemonMultiHitModifierType.description");
  }
}

export class TmModifierType extends PokemonModifierType {
  public moveId: MoveId;

  constructor(moveId: MoveId) {
    super(
      "",
      `tm_${PokemonType[allMoves[moveId].type].toLowerCase()}`,
      (_type, args) => new TmModifier(this, (args[0] as PlayerPokemon).id),
      (pokemon: PlayerPokemon) => {
        if (
          pokemon.compatibleTms.indexOf(moveId) === -1
          || pokemon.getMoveset().filter(m => m.moveId === moveId).length > 0
        ) {
          return PartyUiHandler.NoEffectMessage;
        }
        return null;
      },
      "tm",
    );

    this.moveId = moveId;
  }

  get name(): string {
    return i18next.t("modifierType:ModifierType.TmModifierType.name", {
      moveId: padInt(Object.keys(tmSpecies).indexOf(this.moveId.toString()) + 1, 3),
      moveName: allMoves[this.moveId].name,
    });
  }

  getDescription(): string {
    return i18next.t(
      globalScene.enableMoveInfo
        ? "modifierType:ModifierType.TmModifierTypeWithInfo.description"
        : "modifierType:ModifierType.TmModifierType.description",
      { moveName: allMoves[this.moveId].name },
    );
  }
}

export class EvolutionItemModifierType extends PokemonModifierType implements GeneratedPersistentModifierType {
  public evolutionItem: EvolutionItem;

  constructor(evolutionItem: EvolutionItem) {
    super(
      "",
      EvolutionItem[evolutionItem].toLowerCase(),
      (_type, args) => new EvolutionItemModifier(this, (args[0] as PlayerPokemon).id),
      (pokemon: PlayerPokemon) => {
        if (
          pokemonEvolutions.hasOwnProperty(pokemon.species.speciesId)
          && pokemonEvolutions[pokemon.species.speciesId].filter(e => e.validate(pokemon, false, this.evolutionItem))
            .length > 0
          && pokemon.getFormKey() !== SpeciesFormKey.GIGANTAMAX
        ) {
          return null;
        }
        if (
          pokemon.isFusion()
          && pokemon.fusionSpecies
          && pokemonEvolutions.hasOwnProperty(pokemon.fusionSpecies.speciesId)
          && pokemonEvolutions[pokemon.fusionSpecies.speciesId].filter(e =>
            e.validate(pokemon, true, this.evolutionItem),
          ).length > 0
          && pokemon.getFusionFormKey() !== SpeciesFormKey.GIGANTAMAX
        ) {
          return null;
        }

        return PartyUiHandler.NoEffectMessage;
      },
    );

    this.evolutionItem = evolutionItem;
  }

  get name(): string {
    return i18next.t(`modifierType:EvolutionItem.${EvolutionItem[this.evolutionItem]}`);
  }

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.EvolutionItemModifierType.description");
  }

  getPregenArgs(): any[] {
    return [this.evolutionItem];
  }
}

/**
 * Class that represents form changing items
 */
export class FormChangeItemModifierType extends PokemonModifierType implements GeneratedPersistentModifierType {
  public formChangeItem: FormChangeItem;

  constructor(formChangeItem: FormChangeItem) {
    super(
      "",
      FormChangeItem[formChangeItem].toLowerCase(),
      (_type, args) => new PokemonFormChangeItemModifier(this, (args[0] as PlayerPokemon).id, formChangeItem, true),
      (pokemon: PlayerPokemon) => {
        // Make sure the Pokemon has alternate forms
        if (
          pokemonFormChanges.hasOwnProperty(pokemon.species.speciesId) // Get all form changes for this species with an item trigger, including any compound triggers
          && pokemonFormChanges[pokemon.species.speciesId]
            .filter(
              fc => fc.trigger.hasTriggerType(SpeciesFormChangeItemTrigger) && fc.preFormKey === pokemon.getFormKey(),
            )
            // Returns true if any form changes match this item
            .flatMap(fc => fc.findTrigger(SpeciesFormChangeItemTrigger) as SpeciesFormChangeItemTrigger)
            .flatMap(fc => fc.item)
            .includes(this.formChangeItem)
        ) {
          return null;
        }

        return PartyUiHandler.NoEffectMessage;
      },
    );

    this.formChangeItem = formChangeItem;
  }

  get name(): string {
    return i18next.t(`modifierType:FormChangeItem.${FormChangeItem[this.formChangeItem]}`);
  }

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.FormChangeItemModifierType.description");
  }

  getPregenArgs(): any[] {
    return [this.formChangeItem];
  }
}

export class FusePokemonModifierType extends PokemonModifierType {
  constructor(localeKey: string, iconImage: string) {
    super(
      localeKey,
      iconImage,
      (_type, args) => new FusePokemonModifier(this, (args[0] as PlayerPokemon).id, (args[1] as PlayerPokemon).id),
      (pokemon: PlayerPokemon) => {
        const selectStatus = new BooleanHolder(pokemon.isFusion());
        applyChallenges(ChallengeType.POKEMON_FUSION, pokemon, selectStatus);
        if (selectStatus.value) {
          return PartyUiHandler.NoEffectMessage;
        }
        return null;
      },
    );
  }

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.FusePokemonModifierType.description");
  }
}

class AttackTypeBoosterModifierTypeGenerator extends ModifierTypeGenerator {
  constructor() {
    super((party: Pokemon[], pregenArgs?: any[]) => {
      if (pregenArgs && pregenArgs.length === 1 && pregenArgs[0] in PokemonType) {
        return new AttackTypeBoosterModifierType(pregenArgs[0] as PokemonType, TYPE_BOOST_ITEM_BOOST_PERCENT);
      }

      const attackMoveTypes = party.flatMap(p =>
        p
          .getMoveset()
          .map(m => m.getMove())
          .filter(m => m.is("AttackMove"))
          .map(m => m.type),
      );
      if (attackMoveTypes.length === 0) {
        return null;
      }

      const attackMoveTypeWeights = new Map<PokemonType, number>();
      let totalWeight = 0;
      for (const t of attackMoveTypes) {
        if (attackMoveTypeWeights.has(t)) {
          if (attackMoveTypeWeights.get(t)! < 3) {
            // attackMoveTypeWeights.has(t) was checked before
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

      let type: PokemonType;

      const randInt = randSeedInt(totalWeight);
      let weight = 0;

      for (const t of attackMoveTypeWeights.keys()) {
        const typeWeight = attackMoveTypeWeights.get(t)!; // guranteed to be defined
        if (randInt <= weight + typeWeight) {
          type = t;
          break;
        }
        weight += typeWeight;
      }

      return new AttackTypeBoosterModifierType(type!, TYPE_BOOST_ITEM_BOOST_PERCENT);
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
    [Stat.SPD]: "carbos",
  };

  constructor() {
    super((_party: Pokemon[], pregenArgs?: any[]) => {
      if (pregenArgs) {
        return new BaseStatBoosterModifierType(pregenArgs[0]);
      }
      const randStat: PermanentStat = randSeedInt(Stat.SPD + 1);
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
    [Stat.ACC]: "x_accuracy",
  };

  constructor() {
    super((_party: Pokemon[], pregenArgs?: any[]) => {
      if (pregenArgs && pregenArgs.length === 1 && TEMP_BATTLE_STATS.includes(pregenArgs[0])) {
        return new TempStatStageBoosterModifierType(pregenArgs[0]);
      }
      const randStat: TempBattleStat = randSeedInt(Stat.ACC, Stat.ATK);
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
    LIGHT_BALL: {
      stats: [Stat.ATK, Stat.SPATK],
      multiplier: 2,
      species: [SpeciesId.PIKACHU],
      rare: true,
    },
    THICK_CLUB: {
      stats: [Stat.ATK],
      multiplier: 2,
      species: [SpeciesId.CUBONE, SpeciesId.MAROWAK, SpeciesId.ALOLA_MAROWAK],
      rare: true,
    },
    METAL_POWDER: {
      stats: [Stat.DEF],
      multiplier: 2,
      species: [SpeciesId.DITTO],
      rare: true,
    },
    QUICK_POWDER: {
      stats: [Stat.SPD],
      multiplier: 2,
      species: [SpeciesId.DITTO],
      rare: true,
    },
    DEEP_SEA_SCALE: {
      stats: [Stat.SPDEF],
      multiplier: 2,
      species: [SpeciesId.CLAMPERL],
      rare: false,
    },
    DEEP_SEA_TOOTH: {
      stats: [Stat.SPATK],
      multiplier: 2,
      species: [SpeciesId.CLAMPERL],
      rare: false,
    },
  };

  constructor(rare: boolean) {
    super((party: Pokemon[], pregenArgs?: any[]) => {
      const items = SpeciesStatBoosterModifierTypeGenerator.items;
      if (pregenArgs && pregenArgs.length === 1 && pregenArgs[0] in items) {
        return new SpeciesStatBoosterModifierType(pregenArgs[0] as SpeciesStatBoosterItem);
      }

      // Get a pool of items based on the rarity.
      const keys: (keyof SpeciesStatBoosterItem)[] = [];
      const values: (typeof items)[keyof typeof items][] = [];
      const weights: number[] = [];
      for (const [key, val] of Object.entries(SpeciesStatBoosterModifierTypeGenerator.items)) {
        if (val.rare !== rare) {
          continue;
        }
        values.push(val);
        keys.push(key as keyof SpeciesStatBoosterItem);
        weights.push(0);
      }

      for (const p of party) {
        const speciesId = p.getSpeciesForm(true).speciesId;
        const fusionSpeciesId = p.isFusion() ? p.getFusionSpeciesForm(true).speciesId : null;
        // TODO: Use commented boolean when Fling is implemented
        const hasFling = false; /* p.getMoveset(true).some(m => m.moveId === MoveId.FLING) */

        for (const i in values) {
          const checkedSpecies = values[i].species;
          const checkedStats = values[i].stats;

          // If party member already has the item being weighted currently, skip to the next item
          const hasItem = p
            .getHeldItems()
            .some(
              m =>
                m instanceof SpeciesStatBoosterModifier
                && (m as SpeciesStatBoosterModifier).contains(checkedSpecies[0], checkedStats[0]),
            );

          if (!hasItem) {
            if (checkedSpecies.includes(speciesId) || (!!fusionSpeciesId && checkedSpecies.includes(fusionSpeciesId))) {
              // Add weight if party member has a matching species or, if applicable, a matching fusion species
              weights[i]++;
            } else if (checkedSpecies.includes(SpeciesId.PIKACHU) && hasFling) {
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
        const randInt = randSeedInt(totalWeight, 1);
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
      if (pregenArgs && pregenArgs.length === 1 && pregenArgs[0] in MoveId) {
        return new TmModifierType(pregenArgs[0] as MoveId);
      }
      const partyMemberCompatibleTms = party.map(p => {
        const previousLevelMoves = p.getLearnableLevelMoves();
        return (p as PlayerPokemon).compatibleTms.filter(
          tm => !p.moveset.find(m => m.moveId === tm) && !previousLevelMoves.find(lm => lm === tm),
        );
      });
      const tierUniqueCompatibleTms = partyMemberCompatibleTms
        .flat()
        .filter(tm => tmPoolTiers[tm] === tier)
        .filter(tm => !allMoves[tm].name.endsWith(" (N)"))
        .filter((tm, i, array) => array.indexOf(tm) === i);
      if (tierUniqueCompatibleTms.length === 0) {
        return null;
      }
      // TODO: should this use `randSeedItem`?
      const randTmIndex = randSeedInt(tierUniqueCompatibleTms.length);
      return new TmModifierType(tierUniqueCompatibleTms[randTmIndex]);
    });
  }
}

class EvolutionItemModifierTypeGenerator extends ModifierTypeGenerator {
  constructor(rare: boolean) {
    super((party: Pokemon[], pregenArgs?: any[]) => {
      if (pregenArgs && pregenArgs.length === 1 && pregenArgs[0] in EvolutionItem) {
        return new EvolutionItemModifierType(pregenArgs[0] as EvolutionItem);
      }

      const evolutionItemPool = [
        party
          .filter(
            p =>
              pokemonEvolutions.hasOwnProperty(p.species.speciesId)
              && (!p.pauseEvolutions
                || p.species.speciesId === SpeciesId.SLOWPOKE
                || p.species.speciesId === SpeciesId.EEVEE
                || p.species.speciesId === SpeciesId.KIRLIA
                || p.species.speciesId === SpeciesId.SNORUNT),
          )
          .flatMap(p => {
            const evolutions = pokemonEvolutions[p.species.speciesId];
            return evolutions.filter(e => e.isValidItemEvolution(p));
          }),
        party
          .filter(
            p =>
              p.isFusion()
              && p.fusionSpecies
              && pokemonEvolutions.hasOwnProperty(p.fusionSpecies.speciesId)
              && (!p.pauseEvolutions
                || p.fusionSpecies.speciesId === SpeciesId.SLOWPOKE
                || p.fusionSpecies.speciesId === SpeciesId.EEVEE
                || p.fusionSpecies.speciesId === SpeciesId.KIRLIA
                || p.fusionSpecies.speciesId === SpeciesId.SNORUNT),
          )
          .flatMap(p => {
            const evolutions = pokemonEvolutions[p.fusionSpecies!.speciesId];
            return evolutions.filter(e => e.isValidItemEvolution(p, true));
          }),
      ]
        .flat()
        .flatMap(e => e.evoItem)
        .filter(i => !!i && i > 50 === rare);

      if (evolutionItemPool.length === 0) {
        return null;
      }

      // TODO: should this use `randSeedItem`?
      return new EvolutionItemModifierType(evolutionItemPool[randSeedInt(evolutionItemPool.length)]!); // TODO: is the bang correct?
    });
  }
}

export class FormChangeItemModifierTypeGenerator extends ModifierTypeGenerator {
  constructor(isRareFormChangeItem: boolean) {
    super((party: Pokemon[], pregenArgs?: any[]) => {
      if (pregenArgs && pregenArgs.length === 1 && pregenArgs[0] in FormChangeItem) {
        return new FormChangeItemModifierType(pregenArgs[0] as FormChangeItem);
      }

      const formChangeItemPool = [
        ...new Set(
          party
            .filter(p => pokemonFormChanges.hasOwnProperty(p.species.speciesId))
            .flatMap(p => {
              const formChanges = pokemonFormChanges[p.species.speciesId];
              let formChangeItemTriggers = formChanges
                .filter(
                  fc =>
                    ((fc.formKey.indexOf(SpeciesFormKey.MEGA) === -1
                      && fc.formKey.indexOf(SpeciesFormKey.PRIMAL) === -1)
                      || globalScene.getModifiers(MegaEvolutionAccessModifier).length > 0)
                    && ((fc.formKey.indexOf(SpeciesFormKey.GIGANTAMAX) === -1
                      && fc.formKey.indexOf(SpeciesFormKey.ETERNAMAX) === -1)
                      || globalScene.getModifiers(GigantamaxAccessModifier).length > 0)
                    && (fc.conditions.length === 0
                      || fc.conditions.filter(cond => cond instanceof SpeciesFormChangeCondition && cond.predicate(p))
                        .length > 0)
                    && fc.preFormKey === p.getFormKey(),
                )
                .map(fc => fc.findTrigger(SpeciesFormChangeItemTrigger) as SpeciesFormChangeItemTrigger)
                .filter(
                  t =>
                    t?.active
                    && !globalScene.findModifier(
                      m =>
                        m instanceof PokemonFormChangeItemModifier
                        && m.pokemonId === p.id
                        && m.formChangeItem === t.item,
                    ),
                );

              if (p.species.speciesId === SpeciesId.NECROZMA) {
                // technically we could use a simplified version and check for formChanges.length > 3, but in case any code changes later, this might break...
                let foundULTRA_Z = false;
                let foundN_LUNA = false;
                let foundN_SOLAR = false;
                formChangeItemTriggers.forEach((fc, _i) => {
                  console.log("Checking ", fc.item);
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
                  formChangeItemTriggers = formChangeItemTriggers.filter(
                    fc => fc.item !== FormChangeItem.ULTRANECROZIUM_Z,
                  );
                } else {
                  console.log("DID NOT FIND ");
                }
              }
              return formChangeItemTriggers;
            }),
        ),
      ]
        .flat()
        .flatMap(fc => fc.item)
        .filter(i => (i && i < 100) === isRareFormChangeItem);
      // convert it into a set to remove duplicate values, which can appear when the same species with a potential form change is in the party.

      if (formChangeItemPool.length === 0) {
        return null;
      }

      // TODO: should this use `randSeedItem`?
      return new FormChangeItemModifierType(formChangeItemPool[randSeedInt(formChangeItemPool.length)]);
    });
  }
}

export class ContactHeldItemTransferChanceModifierType extends PokemonHeldItemModifierType {
  private chancePercent: number;

  constructor(localeKey: string, iconImage: string, chancePercent: number, group?: string, soundName?: string) {
    super(
      localeKey,
      iconImage,
      (type, args) => new ContactHeldItemTransferChanceModifier(type, (args[0] as Pokemon).id, chancePercent),
      group,
      soundName,
    );

    this.chancePercent = chancePercent;
  }

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.ContactHeldItemTransferChanceModifierType.description", {
      chancePercent: this.chancePercent,
    });
  }
}

export class TurnHeldItemTransferModifierType extends PokemonHeldItemModifierType {
  constructor(localeKey: string, iconImage: string, group?: string, soundName?: string) {
    super(
      localeKey,
      iconImage,
      (type, args) => new TurnHeldItemTransferModifier(type, (args[0] as Pokemon).id),
      group,
      soundName,
    );
  }

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.TurnHeldItemTransferModifierType.description");
  }
}

export class EnemyAttackStatusEffectChanceModifierType extends ModifierType {
  private chancePercent: number;
  private effect: StatusEffect;

  constructor(localeKey: string, iconImage: string, chancePercent: number, effect: StatusEffect, stackCount?: number) {
    super(
      localeKey,
      iconImage,
      (type, _args) => new EnemyAttackStatusEffectChanceModifier(type, effect, chancePercent, stackCount),
      "enemy_status_chance",
    );

    this.chancePercent = chancePercent;
    this.effect = effect;
  }

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.EnemyAttackStatusEffectChanceModifierType.description", {
      chancePercent: this.chancePercent,
      statusEffect: getStatusEffectDescriptor(this.effect),
    });
  }
}

export class EnemyEndureChanceModifierType extends ModifierType {
  private chancePercent: number;

  constructor(localeKey: string, iconImage: string, chancePercent: number) {
    super(localeKey, iconImage, (type, _args) => new EnemyEndureChanceModifier(type, chancePercent), "enemy_endure");

    this.chancePercent = chancePercent;
  }

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.EnemyEndureChanceModifierType.description", {
      chancePercent: this.chancePercent,
    });
  }
}

export class WeightedModifierType {
  public modifierType: ModifierType;
  public weight: number | WeightedModifierTypeWeightFunc;
  public maxWeight: number | WeightedModifierTypeWeightFunc;

  constructor(
    modifierTypeFunc: ModifierTypeFunc,
    weight: number | WeightedModifierTypeWeightFunc,
    maxWeight?: number | WeightedModifierTypeWeightFunc,
  ) {
    this.modifierType = modifierTypeFunc();
    this.modifierType.id = Object.keys(modifierTypeInitObj).find(k => modifierTypeInitObj[k] === modifierTypeFunc)!; // TODO: is this bang correct?
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
      name: keyof Pick<typeof modifierTypeInitObj, "SPECIES_STAT_BOOSTER" | "RARE_SPECIES_STAT_BOOSTER">;
      type?: SpeciesStatBoosterItem;
    }
  | {
      name: keyof Pick<typeof modifierTypeInitObj, "TEMP_STAT_STAGE_BOOSTER">;
      type?: TempBattleStat;
    }
  | {
      name: keyof Pick<typeof modifierTypeInitObj, "BASE_STAT_BOOSTER">;
      type?: Stat;
    }
  | {
      name: keyof Pick<typeof modifierTypeInitObj, "MINT">;
      type?: Nature;
    }
  | {
      name: keyof Pick<typeof modifierTypeInitObj, "ATTACK_TYPE_BOOSTER" | "TERA_SHARD">;
      type?: PokemonType;
    }
  | {
      name: keyof Pick<typeof modifierTypeInitObj, "BERRY">;
      type?: BerryType;
    }
  | {
      name: keyof Pick<typeof modifierTypeInitObj, "EVOLUTION_ITEM" | "RARE_EVOLUTION_ITEM">;
      type?: EvolutionItem;
    }
  | {
      name: keyof Pick<typeof modifierTypeInitObj, "FORM_CHANGE_ITEM" | "RARE_FORM_CHANGE_ITEM">;
      type?: FormChangeItem;
    }
  | {
      name: keyof Pick<typeof modifierTypeInitObj, "TM_COMMON" | "TM_GREAT" | "TM_ULTRA">;
      type?: MoveId;
    }
);

/** Type used to construct modifiers and held items for overriding purposes. */
export type ModifierOverride = GeneratorModifierOverride | BaseModifierOverride;

export type ModifierTypeKeys = keyof typeof modifierTypeInitObj;

const modifierTypeInitObj = Object.freeze({
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

  EVOLUTION_TRACKER_GIMMIGHOUL: () =>
    new PokemonHeldItemModifierType(
      "modifierType:ModifierType.EVOLUTION_TRACKER_GIMMIGHOUL",
      "relic_gold",
      (type, args) =>
        new EvoTrackerModifier(type, (args[0] as Pokemon).id, SpeciesId.GIMMIGHOUL, 10, (args[1] as number) ?? 1),
    ),

  MEGA_BRACELET: () =>
    new ModifierType(
      "modifierType:ModifierType.MEGA_BRACELET",
      "mega_bracelet",
      (type, _args) => new MegaEvolutionAccessModifier(type),
    ),
  DYNAMAX_BAND: () =>
    new ModifierType(
      "modifierType:ModifierType.DYNAMAX_BAND",
      "dynamax_band",
      (type, _args) => new GigantamaxAccessModifier(type),
    ),
  TERA_ORB: () =>
    new ModifierType(
      "modifierType:ModifierType.TERA_ORB",
      "tera_orb",
      (type, _args) => new TerastallizeAccessModifier(type),
    ),

  MAP: () => new ModifierType("modifierType:ModifierType.MAP", "map", (type, _args) => new MapModifier(type)),

  POTION: () => new PokemonHpRestoreModifierType("modifierType:ModifierType.POTION", "potion", 20, 10),
  SUPER_POTION: () =>
    new PokemonHpRestoreModifierType("modifierType:ModifierType.SUPER_POTION", "super_potion", 50, 25),
  HYPER_POTION: () =>
    new PokemonHpRestoreModifierType("modifierType:ModifierType.HYPER_POTION", "hyper_potion", 200, 50),
  MAX_POTION: () => new PokemonHpRestoreModifierType("modifierType:ModifierType.MAX_POTION", "max_potion", 0, 100),
  FULL_RESTORE: () =>
    new PokemonHpRestoreModifierType("modifierType:ModifierType.FULL_RESTORE", "full_restore", 0, 100, true),

  REVIVE: () => new PokemonReviveModifierType("modifierType:ModifierType.REVIVE", "revive", 50),
  MAX_REVIVE: () => new PokemonReviveModifierType("modifierType:ModifierType.MAX_REVIVE", "max_revive", 100),

  FULL_HEAL: () => new PokemonStatusHealModifierType("modifierType:ModifierType.FULL_HEAL", "full_heal"),

  SACRED_ASH: () => new AllPokemonFullReviveModifierType("modifierType:ModifierType.SACRED_ASH", "sacred_ash"),

  REVIVER_SEED: () =>
    new PokemonHeldItemModifierType(
      "modifierType:ModifierType.REVIVER_SEED",
      "reviver_seed",
      (type, args) => new PokemonInstantReviveModifier(type, (args[0] as Pokemon).id),
    ),
  WHITE_HERB: () =>
    new PokemonHeldItemModifierType(
      "modifierType:ModifierType.WHITE_HERB",
      "white_herb",
      (type, args) => new ResetNegativeStatStageModifier(type, (args[0] as Pokemon).id),
    ),

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

  SPECIES_STAT_BOOSTER: () => new SpeciesStatBoosterModifierTypeGenerator(false),
  RARE_SPECIES_STAT_BOOSTER: () => new SpeciesStatBoosterModifierTypeGenerator(true),

  TEMP_STAT_STAGE_BOOSTER: () => new TempStatStageBoosterModifierTypeGenerator(),

  DIRE_HIT: () =>
    new (class extends ModifierType {
      getDescription(): string {
        return i18next.t("modifierType:ModifierType.TempStatStageBoosterModifierType.description", {
          stat: i18next.t("modifierType:ModifierType.DIRE_HIT.extra.raises"),
          amount: i18next.t("modifierType:ModifierType.TempStatStageBoosterModifierType.extra.stage"),
        });
      }
    })("modifierType:ModifierType.DIRE_HIT", "dire_hit", (type, _args) => new TempCritBoosterModifier(type, 5)),

  BASE_STAT_BOOSTER: () => new BaseStatBoosterModifierTypeGenerator(),

  ATTACK_TYPE_BOOSTER: () => new AttackTypeBoosterModifierTypeGenerator(),

  MINT: () =>
    new ModifierTypeGenerator((_party: Pokemon[], pregenArgs?: any[]) => {
      if (pregenArgs && pregenArgs.length === 1 && pregenArgs[0] in Nature) {
        return new PokemonNatureChangeModifierType(pregenArgs[0] as Nature);
      }
      return new PokemonNatureChangeModifierType(randSeedItem(getEnumValues(Nature)));
    }),

  MYSTICAL_ROCK: () =>
    new PokemonHeldItemModifierType(
      "modifierType:ModifierType.MYSTICAL_ROCK",
      "mystical_rock",
      (type, args) => new FieldEffectModifier(type, (args[0] as Pokemon).id),
    ),

  TERA_SHARD: () =>
    new ModifierTypeGenerator((party: Pokemon[], pregenArgs?: any[]) => {
      if (pregenArgs && pregenArgs.length === 1 && pregenArgs[0] in PokemonType) {
        return new TerastallizeModifierType(pregenArgs[0] as PokemonType);
      }
      if (globalScene.getModifiers(TerastallizeAccessModifier).length === 0) {
        return null;
      }
      const teraTypes: PokemonType[] = [];
      for (const p of party) {
        if (
          !(p.hasSpecies(SpeciesId.TERAPAGOS) || p.hasSpecies(SpeciesId.OGERPON) || p.hasSpecies(SpeciesId.SHEDINJA))
        ) {
          teraTypes.push(p.teraType);
        }
      }
      let excludedType = PokemonType.UNKNOWN;
      if (teraTypes.length > 0 && teraTypes.filter(t => t === teraTypes[0]).length === teraTypes.length) {
        excludedType = teraTypes[0];
      }
      let shardType = randSeedInt(64) ? (randSeedInt(18) as PokemonType) : PokemonType.STELLAR;
      while (shardType === excludedType) {
        shardType = randSeedInt(64) ? (randSeedInt(18) as PokemonType) : PokemonType.STELLAR;
      }
      return new TerastallizeModifierType(shardType);
    }),

  BERRY: () =>
    new ModifierTypeGenerator((_party: Pokemon[], pregenArgs?: any[]) => {
      if (pregenArgs && pregenArgs.length === 1 && pregenArgs[0] in BerryType) {
        return new BerryModifierType(pregenArgs[0] as BerryType);
      }
      const berryTypes = getEnumValues(BerryType);
      let randBerryType: BerryType;
      const rand = randSeedInt(12);
      if (rand < 2) {
        randBerryType = BerryType.SITRUS;
      } else if (rand < 4) {
        randBerryType = BerryType.LUM;
      } else if (rand < 6) {
        randBerryType = BerryType.LEPPA;
      } else {
        randBerryType = berryTypes[randSeedInt(berryTypes.length - 3) + 2];
      }
      return new BerryModifierType(randBerryType);
    }),

  TM_COMMON: () => new TmModifierTypeGenerator(ModifierTier.COMMON),
  TM_GREAT: () => new TmModifierTypeGenerator(ModifierTier.GREAT),
  TM_ULTRA: () => new TmModifierTypeGenerator(ModifierTier.ULTRA),

  MEMORY_MUSHROOM: () => new RememberMoveModifierType("modifierType:ModifierType.MEMORY_MUSHROOM", "big_mushroom"),

  EXP_SHARE: () =>
    new ModifierType("modifierType:ModifierType.EXP_SHARE", "exp_share", (type, _args) => new ExpShareModifier(type)),
  EXP_BALANCE: () =>
    new ModifierType(
      "modifierType:ModifierType.EXP_BALANCE",
      "exp_balance",
      (type, _args) => new ExpBalanceModifier(type),
    ),

  OVAL_CHARM: () =>
    new ModifierType(
      "modifierType:ModifierType.OVAL_CHARM",
      "oval_charm",
      (type, _args) => new MultipleParticipantExpBonusModifier(type),
    ),

  EXP_CHARM: () => new ExpBoosterModifierType("modifierType:ModifierType.EXP_CHARM", "exp_charm", 25),
  SUPER_EXP_CHARM: () => new ExpBoosterModifierType("modifierType:ModifierType.SUPER_EXP_CHARM", "super_exp_charm", 60),
  GOLDEN_EXP_CHARM: () =>
    new ExpBoosterModifierType("modifierType:ModifierType.GOLDEN_EXP_CHARM", "golden_exp_charm", 100),

  LUCKY_EGG: () => new PokemonExpBoosterModifierType("modifierType:ModifierType.LUCKY_EGG", "lucky_egg", 40),
  GOLDEN_EGG: () => new PokemonExpBoosterModifierType("modifierType:ModifierType.GOLDEN_EGG", "golden_egg", 100),

  SOOTHE_BELL: () => new PokemonFriendshipBoosterModifierType("modifierType:ModifierType.SOOTHE_BELL", "soothe_bell"),

  SCOPE_LENS: () =>
    new PokemonHeldItemModifierType(
      "modifierType:ModifierType.SCOPE_LENS",
      "scope_lens",
      (type, args) => new CritBoosterModifier(type, (args[0] as Pokemon).id, 1),
    ),
  LEEK: () =>
    new PokemonHeldItemModifierType(
      "modifierType:ModifierType.LEEK",
      "leek",
      (type, args) =>
        new SpeciesCritBoosterModifier(type, (args[0] as Pokemon).id, 2, [
          SpeciesId.FARFETCHD,
          SpeciesId.GALAR_FARFETCHD,
          SpeciesId.SIRFETCHD,
        ]),
    ),

  EVIOLITE: () =>
    new PokemonHeldItemModifierType(
      "modifierType:ModifierType.EVIOLITE",
      "eviolite",
      (type, args) => new EvolutionStatBoosterModifier(type, (args[0] as Pokemon).id, [Stat.DEF, Stat.SPDEF], 1.5),
    ),

  SOUL_DEW: () =>
    new PokemonHeldItemModifierType(
      "modifierType:ModifierType.SOUL_DEW",
      "soul_dew",
      (type, args) => new PokemonNatureWeightModifier(type, (args[0] as Pokemon).id),
    ),

  NUGGET: () =>
    new MoneyRewardModifierType(
      "modifierType:ModifierType.NUGGET",
      "nugget",
      1,
      "modifierType:ModifierType.MoneyRewardModifierType.extra.small",
    ),
  BIG_NUGGET: () =>
    new MoneyRewardModifierType(
      "modifierType:ModifierType.BIG_NUGGET",
      "big_nugget",
      2.5,
      "modifierType:ModifierType.MoneyRewardModifierType.extra.moderate",
    ),
  RELIC_GOLD: () =>
    new MoneyRewardModifierType(
      "modifierType:ModifierType.RELIC_GOLD",
      "relic_gold",
      10,
      "modifierType:ModifierType.MoneyRewardModifierType.extra.large",
    ),

  AMULET_COIN: () =>
    new ModifierType(
      "modifierType:ModifierType.AMULET_COIN",
      "amulet_coin",
      (type, _args) => new MoneyMultiplierModifier(type),
    ),
  GOLDEN_PUNCH: () =>
    new PokemonHeldItemModifierType(
      "modifierType:ModifierType.GOLDEN_PUNCH",
      "golden_punch",
      (type, args) => new DamageMoneyRewardModifier(type, (args[0] as Pokemon).id),
    ),
  COIN_CASE: () =>
    new ModifierType(
      "modifierType:ModifierType.COIN_CASE",
      "coin_case",
      (type, _args) => new MoneyInterestModifier(type),
    ),

  LOCK_CAPSULE: () =>
    new ModifierType(
      "modifierType:ModifierType.LOCK_CAPSULE",
      "lock_capsule",
      (type, _args) => new LockModifierTiersModifier(type),
    ),

  GRIP_CLAW: () =>
    new ContactHeldItemTransferChanceModifierType("modifierType:ModifierType.GRIP_CLAW", "grip_claw", 10),
  WIDE_LENS: () => new PokemonMoveAccuracyBoosterModifierType("modifierType:ModifierType.WIDE_LENS", "wide_lens", 5),

  MULTI_LENS: () => new PokemonMultiHitModifierType("modifierType:ModifierType.MULTI_LENS", "zoom_lens"),

  HEALING_CHARM: () =>
    new ModifierType(
      "modifierType:ModifierType.HEALING_CHARM",
      "healing_charm",
      (type, _args) => new HealingBoosterModifier(type, 1.1),
    ),
  CANDY_JAR: () =>
    new ModifierType(
      "modifierType:ModifierType.CANDY_JAR",
      "candy_jar",
      (type, _args) => new LevelIncrementBoosterModifier(type),
    ),

  BERRY_POUCH: () =>
    new ModifierType(
      "modifierType:ModifierType.BERRY_POUCH",
      "berry_pouch",
      (type, _args) => new PreserveBerryModifier(type),
    ),

  FOCUS_BAND: () =>
    new PokemonHeldItemModifierType(
      "modifierType:ModifierType.FOCUS_BAND",
      "focus_band",
      (type, args) => new SurviveDamageModifier(type, (args[0] as Pokemon).id),
    ),

  QUICK_CLAW: () =>
    new PokemonHeldItemModifierType(
      "modifierType:ModifierType.QUICK_CLAW",
      "quick_claw",
      (type, args) => new BypassSpeedChanceModifier(type, (args[0] as Pokemon).id),
    ),

  KINGS_ROCK: () =>
    new PokemonHeldItemModifierType(
      "modifierType:ModifierType.KINGS_ROCK",
      "kings_rock",
      (type, args) => new FlinchChanceModifier(type, (args[0] as Pokemon).id),
    ),

  LEFTOVERS: () =>
    new PokemonHeldItemModifierType(
      "modifierType:ModifierType.LEFTOVERS",
      "leftovers",
      (type, args) => new TurnHealModifier(type, (args[0] as Pokemon).id),
    ),
  SHELL_BELL: () =>
    new PokemonHeldItemModifierType(
      "modifierType:ModifierType.SHELL_BELL",
      "shell_bell",
      (type, args) => new HitHealModifier(type, (args[0] as Pokemon).id),
    ),

  TOXIC_ORB: () =>
    new PokemonHeldItemModifierType(
      "modifierType:ModifierType.TOXIC_ORB",
      "toxic_orb",
      (type, args) => new TurnStatusEffectModifier(type, (args[0] as Pokemon).id),
    ),
  FLAME_ORB: () =>
    new PokemonHeldItemModifierType(
      "modifierType:ModifierType.FLAME_ORB",
      "flame_orb",
      (type, args) => new TurnStatusEffectModifier(type, (args[0] as Pokemon).id),
    ),

  BATON: () =>
    new PokemonHeldItemModifierType(
      "modifierType:ModifierType.BATON",
      "baton",
      (type, args) => new SwitchEffectTransferModifier(type, (args[0] as Pokemon).id),
    ),

  SHINY_CHARM: () =>
    new ModifierType(
      "modifierType:ModifierType.SHINY_CHARM",
      "shiny_charm",
      (type, _args) => new ShinyRateBoosterModifier(type),
    ),
  ABILITY_CHARM: () =>
    new ModifierType(
      "modifierType:ModifierType.ABILITY_CHARM",
      "ability_charm",
      (type, _args) => new HiddenAbilityRateBoosterModifier(type),
    ),
  CATCHING_CHARM: () =>
    new ModifierType(
      "modifierType:ModifierType.CATCHING_CHARM",
      "catching_charm",
      (type, _args) => new CriticalCatchChanceBoosterModifier(type),
    ),

  IV_SCANNER: () =>
    new ModifierType("modifierType:ModifierType.IV_SCANNER", "scanner", (type, _args) => new IvScannerModifier(type)),

  DNA_SPLICERS: () => new FusePokemonModifierType("modifierType:ModifierType.DNA_SPLICERS", "dna_splicers"),

  MINI_BLACK_HOLE: () =>
    new TurnHeldItemTransferModifierType("modifierType:ModifierType.MINI_BLACK_HOLE", "mini_black_hole"),

  VOUCHER: () => new AddVoucherModifierType(VoucherType.REGULAR, 1),
  VOUCHER_PLUS: () => new AddVoucherModifierType(VoucherType.PLUS, 1),
  VOUCHER_PREMIUM: () => new AddVoucherModifierType(VoucherType.PREMIUM, 1),

  GOLDEN_POKEBALL: () =>
    new ModifierType(
      "modifierType:ModifierType.GOLDEN_POKEBALL",
      "pb_gold",
      (type, _args) => new ExtraModifierModifier(type),
      undefined,
      "se/pb_bounce_1",
    ),
  SILVER_POKEBALL: () =>
    new ModifierType(
      "modifierType:ModifierType.SILVER_POKEBALL",
      "pb_silver",
      (type, _args) => new TempExtraModifierModifier(type, 100),
      undefined,
      "se/pb_bounce_1",
    ),

  ENEMY_DAMAGE_BOOSTER: () =>
    new ModifierType(
      "modifierType:ModifierType.ENEMY_DAMAGE_BOOSTER",
      "wl_item_drop",
      (type, _args) => new EnemyDamageBoosterModifier(type, 5),
    ),
  ENEMY_DAMAGE_REDUCTION: () =>
    new ModifierType(
      "modifierType:ModifierType.ENEMY_DAMAGE_REDUCTION",
      "wl_guard_spec",
      (type, _args) => new EnemyDamageReducerModifier(type, 2.5),
    ),
  //ENEMY_SUPER_EFFECT_BOOSTER: () => new ModifierType('Type Advantage Token', 'Increases damage of super effective attacks by 30%', (type, _args) => new EnemySuperEffectiveDamageBoosterModifier(type, 30), 'wl_custom_super_effective'),
  ENEMY_HEAL: () =>
    new ModifierType(
      "modifierType:ModifierType.ENEMY_HEAL",
      "wl_potion",
      (type, _args) => new EnemyTurnHealModifier(type, 2, 10),
    ),
  ENEMY_ATTACK_POISON_CHANCE: () =>
    new EnemyAttackStatusEffectChanceModifierType(
      "modifierType:ModifierType.ENEMY_ATTACK_POISON_CHANCE",
      "wl_antidote",
      5,
      StatusEffect.POISON,
      10,
    ),
  ENEMY_ATTACK_PARALYZE_CHANCE: () =>
    new EnemyAttackStatusEffectChanceModifierType(
      "modifierType:ModifierType.ENEMY_ATTACK_PARALYZE_CHANCE",
      "wl_paralyze_heal",
      2.5,
      StatusEffect.PARALYSIS,
      10,
    ),
  ENEMY_ATTACK_BURN_CHANCE: () =>
    new EnemyAttackStatusEffectChanceModifierType(
      "modifierType:ModifierType.ENEMY_ATTACK_BURN_CHANCE",
      "wl_burn_heal",
      5,
      StatusEffect.BURN,
      10,
    ),
  ENEMY_STATUS_EFFECT_HEAL_CHANCE: () =>
    new ModifierType(
      "modifierType:ModifierType.ENEMY_STATUS_EFFECT_HEAL_CHANCE",
      "wl_full_heal",
      (type, _args) => new EnemyStatusEffectHealChanceModifier(type, 2.5, 10),
    ),
  ENEMY_ENDURE_CHANCE: () =>
    new EnemyEndureChanceModifierType("modifierType:ModifierType.ENEMY_ENDURE_CHANCE", "wl_reset_urge", 2),
  ENEMY_FUSED_CHANCE: () =>
    new ModifierType(
      "modifierType:ModifierType.ENEMY_FUSED_CHANCE",
      "wl_custom_spliced",
      (type, _args) => new EnemyFusionChanceModifier(type, 1),
    ),

  MYSTERY_ENCOUNTER_SHUCKLE_JUICE: () =>
    new ModifierTypeGenerator((_party: Pokemon[], pregenArgs?: any[]) => {
      if (pregenArgs) {
        return new PokemonBaseStatTotalModifierType(pregenArgs[0] as 10 | -15);
      }
      return new PokemonBaseStatTotalModifierType(10);
    }),
  MYSTERY_ENCOUNTER_OLD_GATEAU: () =>
    new PokemonHeldItemModifierType(
      "modifierType:ModifierType.MYSTERY_ENCOUNTER_OLD_GATEAU",
      "old_gateau",
      (type, args) => new PokemonBaseStatFlatModifier(type, (args[0] as Pokemon).id),
    ),
  MYSTERY_ENCOUNTER_BLACK_SLUDGE: () =>
    new ModifierTypeGenerator((_party: Pokemon[], pregenArgs?: any[]) => {
      if (pregenArgs) {
        return new ModifierType(
          "modifierType:ModifierType.MYSTERY_ENCOUNTER_BLACK_SLUDGE",
          "black_sludge",
          (type, _args) => new HealShopCostModifier(type, pregenArgs[0] as number),
        );
      }
      return new ModifierType(
        "modifierType:ModifierType.MYSTERY_ENCOUNTER_BLACK_SLUDGE",
        "black_sludge",
        (type, _args) => new HealShopCostModifier(type, 2.5),
      );
    }),
  MYSTERY_ENCOUNTER_MACHO_BRACE: () =>
    new PokemonHeldItemModifierType(
      "modifierType:ModifierType.MYSTERY_ENCOUNTER_MACHO_BRACE",
      "macho_brace",
      (type, args) => new PokemonIncrementingStatModifier(type, (args[0] as Pokemon).id),
    ),
  MYSTERY_ENCOUNTER_GOLDEN_BUG_NET: () =>
    new ModifierType(
      "modifierType:ModifierType.MYSTERY_ENCOUNTER_GOLDEN_BUG_NET",
      "golden_net",
      (type, _args) => new BoostBugSpawnModifier(type),
    ),
});

/**
 * The initial set of modifier types, used to generate the modifier pool.
 */
export type ModifierTypes = typeof modifierTypeInitObj;

export interface ModifierPool {
  [tier: string]: WeightedModifierType[];
}

let modifierPoolThresholds = {};
let ignoredPoolIndexes = {};

let dailyStarterModifierPoolThresholds = {};
// biome-ignore lint/correctness/noUnusedVariables: TODO explain why this is marked as OK
let ignoredDailyStarterPoolIndexes = {};

let enemyModifierPoolThresholds = {};
// biome-ignore lint/correctness/noUnusedVariables: TODO explain why this is marked as OK
let enemyIgnoredPoolIndexes = {};

let enemyBuffModifierPoolThresholds = {};
// biome-ignore lint/correctness/noUnusedVariables: TODO explain why this is marked as OK
let enemyBuffIgnoredPoolIndexes = {};

const tierWeights = [768 / 1024, 195 / 1024, 48 / 1024, 12 / 1024, 1 / 1024];
/**
 * Allows a unit test to check if an item exists in the Modifier Pool. Checks the pool directly, rather than attempting to reroll for the item.
 */
export const itemPoolChecks: Map<ModifierTypeKeys, boolean | undefined> = new Map();

export function regenerateModifierPoolThresholds(party: Pokemon[], poolType: ModifierPoolType, rerollCount = 0) {
  const pool = getModifierPoolForType(poolType);
  itemPoolChecks.forEach((_v, k) => {
    itemPoolChecks.set(k, false);
  });

  const ignoredIndexes = {};
  const modifierTableData = {};
  const thresholds = Object.fromEntries(
    new Map(
      Object.keys(pool).map(t => {
        ignoredIndexes[t] = [];
        const thresholds = new Map();
        const tierModifierIds: string[] = [];
        let tierMaxWeight = 0;
        let i = 0;
        pool[t].reduce((total: number, modifierType: WeightedModifierType) => {
          const weightedModifierType = modifierType as WeightedModifierType;
          const existingModifiers = globalScene.findModifiers(
            m => m.type.id === weightedModifierType.modifierType.id,
            poolType === ModifierPoolType.PLAYER,
          );
          const itemModifierType =
            weightedModifierType.modifierType instanceof ModifierTypeGenerator
              ? weightedModifierType.modifierType.generateType(party)
              : weightedModifierType.modifierType;
          const weight =
            existingModifiers.length === 0
            || itemModifierType instanceof PokemonHeldItemModifierType
            || itemModifierType instanceof FormChangeItemModifierType
            || existingModifiers.find(m => m.stackCount < m.getMaxStackCount(true))
              ? weightedModifierType.weight instanceof Function
                ? // biome-ignore lint/complexity/noBannedTypes: TODO: refactor to not use Function type
                  (weightedModifierType.weight as Function)(party, rerollCount)
                : (weightedModifierType.weight as number)
              : 0;
          if (weightedModifierType.maxWeight) {
            const modifierId = weightedModifierType.modifierType.id;
            tierModifierIds.push(modifierId);
            const outputWeight = useMaxWeightForOutput ? weightedModifierType.maxWeight : weight;
            modifierTableData[modifierId] = {
              weight: outputWeight,
              tier: Number.parseInt(t),
              tierPercent: 0,
              totalPercent: 0,
            };
            tierMaxWeight += outputWeight;
          }
          if (weight) {
            total += weight;
          } else {
            ignoredIndexes[t].push(i++);
            return total;
          }
          if (itemPoolChecks.has(modifierType.modifierType.id as ModifierTypeKeys)) {
            itemPoolChecks.set(modifierType.modifierType.id as ModifierTypeKeys, true);
          }
          thresholds.set(total, i++);
          return total;
        }, 0);
        for (const id of tierModifierIds) {
          modifierTableData[id].tierPercent = Math.floor((modifierTableData[id].weight / tierMaxWeight) * 10000) / 100;
        }
        return [t, Object.fromEntries(thresholds)];
      }),
    ),
  );
  for (const id of Object.keys(modifierTableData)) {
    modifierTableData[id].totalPercent =
      Math.floor(modifierTableData[id].tierPercent * tierWeights[modifierTableData[id].tier] * 100) / 100;
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

export interface CustomModifierSettings {
  /** If specified, will override the next X items to be the specified tier. These can upgrade with luck. */
  guaranteedModifierTiers?: ModifierTier[];
  /** If specified, will override the first X items to be specific modifier options (these should be pre-genned). */
  guaranteedModifierTypeOptions?: ModifierTypeOption[];
  /** If specified, will override the next X items to be auto-generated from specific modifier functions (these don't have to be pre-genned). */
  guaranteedModifierTypeFuncs?: ModifierTypeFunc[];
  /**
   * If set to `true`, will fill the remainder of shop items that were not overridden by the 3 options above, up to the `count` param value.
   * @example
   * ```ts
   * count = 4;
   * customModifierSettings = { guaranteedModifierTiers: [ModifierTier.GREAT], fillRemaining: true };
   * ```
   * The first item in the shop will be `GREAT` tier, and the remaining `3` items will be generated normally.
   *
   * If `fillRemaining: false` in the same scenario, only 1 `GREAT` tier item will appear in the shop (regardless of the value of `count`).
   * @defaultValue `false`
   */
  fillRemaining?: boolean;
  /** If specified, can adjust the amount of money required for a shop reroll. If set to a negative value, the shop will not allow rerolls at all. */
  rerollMultiplier?: number;
  /**
   * If `false`, will prevent set item tiers from upgrading via luck.
   * @defaultValue `true`
   */
  allowLuckUpgrades?: boolean;
}

export function getModifierTypeFuncById(id: string): ModifierTypeFunc {
  return modifierTypeInitObj[id];
}

/**
 * Generates modifier options for a {@linkcode SelectModifierPhase}
 * @param count - Determines the number of items to generate
 * @param party - Party is required for generating proper modifier pools
 * @param modifierTiers - (Optional) If specified, rolls items in the specified tiers. Commonly used for tier-locking with Lock Capsule.
 * @param customModifierSettings - See {@linkcode CustomModifierSettings}
 */
export function getPlayerModifierTypeOptions(
  count: number,
  party: PlayerPokemon[],
  modifierTiers?: ModifierTier[],
  customModifierSettings?: CustomModifierSettings,
): ModifierTypeOption[] {
  const options: ModifierTypeOption[] = [];
  const retryCount = Math.min(count * 5, 50);
  if (!customModifierSettings) {
    for (let i = 0; i < count; i++) {
      const tier = modifierTiers && modifierTiers.length > i ? modifierTiers[i] : undefined;
      options.push(getModifierTypeOptionWithRetry(options, retryCount, party, tier));
    }
  } else {
    // Guaranteed mod options first
    if (
      customModifierSettings?.guaranteedModifierTypeOptions
      && customModifierSettings.guaranteedModifierTypeOptions.length > 0
    ) {
      options.push(...customModifierSettings.guaranteedModifierTypeOptions!);
    }

    // Guaranteed mod functions second
    if (
      customModifierSettings.guaranteedModifierTypeFuncs
      && customModifierSettings.guaranteedModifierTypeFuncs.length > 0
    ) {
      customModifierSettings.guaranteedModifierTypeFuncs!.forEach((mod, _i) => {
        const modifierId = Object.keys(modifierTypeInitObj).find(k => modifierTypeInitObj[k] === mod) as string;
        let guaranteedMod: ModifierType = modifierTypeInitObj[modifierId]?.();

        // Populates item id and tier
        guaranteedMod = guaranteedMod
          .withIdFromFunc(modifierTypeInitObj[modifierId])
          .withTierFromPool(ModifierPoolType.PLAYER, party);

        const modType =
          guaranteedMod instanceof ModifierTypeGenerator ? guaranteedMod.generateType(party) : guaranteedMod;
        if (modType) {
          const option = new ModifierTypeOption(modType, 0);
          options.push(option);
        }
      });
    }

    // Guaranteed tiers third
    if (customModifierSettings.guaranteedModifierTiers && customModifierSettings.guaranteedModifierTiers.length > 0) {
      const allowLuckUpgrades = customModifierSettings.allowLuckUpgrades ?? true;
      for (const tier of customModifierSettings.guaranteedModifierTiers) {
        options.push(getModifierTypeOptionWithRetry(options, retryCount, party, tier, allowLuckUpgrades));
      }
    }

    // Fill remaining
    if (options.length < count && customModifierSettings.fillRemaining) {
      while (options.length < count) {
        options.push(getModifierTypeOptionWithRetry(options, retryCount, party, undefined));
      }
    }
  }

  overridePlayerModifierTypeOptions(options, party);

  return options;
}

/**
 * Will generate a {@linkcode ModifierType} from the {@linkcode ModifierPoolType.PLAYER} pool, attempting to retry duplicated items up to retryCount
 * @param existingOptions Currently generated options
 * @param retryCount How many times to retry before allowing a dupe item
 * @param party Current player party, used to calculate items in the pool
 * @param tier If specified will generate item of tier
 * @param allowLuckUpgrades `true` to allow items to upgrade tiers (the little animation that plays and is affected by luck)
 */
function getModifierTypeOptionWithRetry(
  existingOptions: ModifierTypeOption[],
  retryCount: number,
  party: PlayerPokemon[],
  tier?: ModifierTier,
  allowLuckUpgrades?: boolean,
): ModifierTypeOption {
  allowLuckUpgrades = allowLuckUpgrades ?? true;
  let candidate = getNewModifierTypeOption(party, ModifierPoolType.PLAYER, tier, undefined, 0, allowLuckUpgrades);
  const candidateValidity = new BooleanHolder(true);
  applyChallenges(ChallengeType.WAVE_REWARD, candidate, candidateValidity);
  let r = 0;
  while (
    (existingOptions.length > 0
      && ++r < retryCount
      && existingOptions.filter(o => o.type.name === candidate?.type.name || o.type.group === candidate?.type.group)
        .length > 0)
    || !candidateValidity.value
  ) {
    candidate = getNewModifierTypeOption(
      party,
      ModifierPoolType.PLAYER,
      candidate?.type.tier ?? tier,
      candidate?.upgradeCount,
      0,
      allowLuckUpgrades,
    );
    applyChallenges(ChallengeType.WAVE_REWARD, candidate, candidateValidity);
  }
  return candidate!;
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
    const modifierFunc = modifierTypeInitObj[override.name];
    let modifierType: ModifierType | null = modifierFunc();

    if (modifierType instanceof ModifierTypeGenerator) {
      const pregenArgs = "type" in override && override.type !== null ? [override.type] : undefined;
      modifierType = modifierType.generateType(party, pregenArgs);
    }

    if (modifierType) {
      options[i].type = modifierType.withIdFromFunc(modifierFunc).withTierFromPool(ModifierPoolType.PLAYER, party);
    }
  }
}

export function getPlayerShopModifierTypeOptionsForWave(waveIndex: number, baseCost: number): ModifierTypeOption[] {
  if (!(waveIndex % 10)) {
    return [];
  }

  const options = [
    [
      new ModifierTypeOption(modifierTypeInitObj.POTION(), 0, baseCost * 0.2),
      new ModifierTypeOption(modifierTypeInitObj.ETHER(), 0, baseCost * 0.4),
      new ModifierTypeOption(modifierTypeInitObj.REVIVE(), 0, baseCost * 2),
    ],
    [
      new ModifierTypeOption(modifierTypeInitObj.SUPER_POTION(), 0, baseCost * 0.45),
      new ModifierTypeOption(modifierTypeInitObj.FULL_HEAL(), 0, baseCost),
    ],
    [
      new ModifierTypeOption(modifierTypeInitObj.ELIXIR(), 0, baseCost),
      new ModifierTypeOption(modifierTypeInitObj.MAX_ETHER(), 0, baseCost),
    ],
    [
      new ModifierTypeOption(modifierTypeInitObj.HYPER_POTION(), 0, baseCost * 0.8),
      new ModifierTypeOption(modifierTypeInitObj.MAX_REVIVE(), 0, baseCost * 2.75),
      new ModifierTypeOption(modifierTypeInitObj.MEMORY_MUSHROOM(), 0, baseCost * 4),
    ],
    [
      new ModifierTypeOption(modifierTypeInitObj.MAX_POTION(), 0, baseCost * 1.5),
      new ModifierTypeOption(modifierTypeInitObj.MAX_ELIXIR(), 0, baseCost * 2.5),
    ],
    [new ModifierTypeOption(modifierTypeInitObj.FULL_RESTORE(), 0, baseCost * 2.25)],
    [new ModifierTypeOption(modifierTypeInitObj.SACRED_ASH(), 0, baseCost * 10)],
  ];

  return options
    .slice(0, Math.ceil(Math.max(waveIndex + 10, 0) / 30))
    .flat()
    .filter(shopItem => {
      const status = new BooleanHolder(true);
      applyChallenges(ChallengeType.SHOP_ITEM, shopItem, status);
      return status.value;
    });
}

export function getEnemyBuffModifierForWave(
  tier: ModifierTier,
  enemyModifiers: PersistentModifier[],
): EnemyPersistentModifier {
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
  let matchingModifier: PersistentModifier | undefined;
  while (
    ++r < retryCount
    && (matchingModifier = enemyModifiers.find(m => m.type.id === candidate?.type?.id))
    && matchingModifier.getMaxStackCount() < matchingModifier.stackCount + (r < 10 ? tierStackCount : 1)
  ) {
    candidate = getNewModifierTypeOption([], ModifierPoolType.ENEMY_BUFF, tier);
  }

  const modifier = candidate?.type?.newModifier() as EnemyPersistentModifier;
  modifier.stackCount = tierStackCount;

  return modifier;
}

export function getEnemyModifierTypesForWave(
  waveIndex: number,
  count: number,
  party: EnemyPokemon[],
  poolType: ModifierPoolType.WILD | ModifierPoolType.TRAINER,
  upgradeChance = 0,
): PokemonHeldItemModifierType[] {
  const ret = new Array(count)
    .fill(0)
    .map(
      () =>
        getNewModifierTypeOption(party, poolType, undefined, upgradeChance && !randSeedInt(upgradeChance) ? 1 : 0)
          ?.type as PokemonHeldItemModifierType,
    );
  if (!(waveIndex % 1000)) {
    ret.push(getModifierType(modifierTypeInitObj.MINI_BLACK_HOLE) as PokemonHeldItemModifierType);
  }
  return ret;
}

export function getDailyRunStarterModifiers(party: PlayerPokemon[]): PokemonHeldItemModifier[] {
  const ret: PokemonHeldItemModifier[] = [];
  for (const p of party) {
    for (let m = 0; m < 3; m++) {
      const tierValue = randSeedInt(64);

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

      const modifier = getNewModifierTypeOption(party, ModifierPoolType.DAILY_STARTER, tier)?.type?.newModifier(
        p,
      ) as PokemonHeldItemModifier;
      ret.push(modifier);
    }
  }

  return ret;
}

/**
 * Generates a ModifierType from the specified pool
 * @param party party of the trainer using the item
 * @param poolType PLAYER/WILD/TRAINER
 * @param tier If specified, will override the initial tier of an item (can still upgrade with luck)
 * @param upgradeCount If defined, means that this is a new ModifierType being generated to override another via luck upgrade. Used for recursive logic
 * @param retryCount Max allowed tries before the next tier down is checked for a valid ModifierType
 * @param allowLuckUpgrades Default true. If false, will not allow ModifierType to randomly upgrade to next tier
 */
function getNewModifierTypeOption(
  party: Pokemon[],
  poolType: ModifierPoolType,
  tier?: ModifierTier,
  upgradeCount?: number,
  retryCount = 0,
  allowLuckUpgrades = true,
): ModifierTypeOption | null {
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
    const tierValue = randSeedInt(1024);
    if (!upgradeCount) {
      upgradeCount = 0;
    }
    if (player && tierValue && allowLuckUpgrades) {
      const partyLuckValue = getPartyLuckValue(party);
      const upgradeOdds = Math.floor(128 / ((partyLuckValue + 4) / 4));
      let upgraded = false;
      do {
        upgraded = randSeedInt(upgradeOdds) < 4;
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
    while (tier && (!pool.hasOwnProperty(tier) || pool[tier].length === 0)) {
      tier--;
      if (upgradeCount) {
        upgradeCount--;
      }
    }
  } else if (upgradeCount === undefined && player) {
    upgradeCount = 0;
    if (tier < ModifierTier.MASTER && allowLuckUpgrades) {
      const partyLuckValue = getPartyLuckValue(party);
      const upgradeOdds = Math.floor(128 / ((partyLuckValue + 4) / 4));
      while (pool.hasOwnProperty(tier + upgradeCount + 1) && pool[tier + upgradeCount + 1].length > 0) {
        if (randSeedInt(upgradeOdds) < 4) {
          upgradeCount++;
        } else {
          break;
        }
      }
      tier += upgradeCount;
    }
  } else if (retryCount >= 100 && tier) {
    retryCount = 0;
    tier--;
  }

  const tierThresholds = Object.keys(thresholds[tier]);
  const totalWeight = Number.parseInt(tierThresholds.at(-1)!);
  const value = randSeedInt(totalWeight);
  let index: number | undefined;
  for (const t of tierThresholds) {
    const threshold = Number.parseInt(t);
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
  let modifierType: ModifierType | null = pool[tier][index].modifierType;
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
  const modifierPool = getModifierPoolForType(ModifierPoolType.PLAYER);
  let modifierType: ModifierType | WeightedModifierType = modifierPool[tier || ModifierTier.COMMON][0];
  if (modifierType instanceof WeightedModifierType) {
    modifierType = (modifierType as WeightedModifierType).modifierType;
  }
  return modifierType;
}

export class ModifierTypeOption {
  public type: ModifierType;
  public upgradeCount: number;
  public cost: number;

  constructor(type: ModifierType, upgradeCount: number, cost = 0) {
    this.type = type;
    this.upgradeCount = upgradeCount;
    this.cost = Math.min(Math.round(cost), Number.MAX_SAFE_INTEGER);
  }
}

/**
 * Calculates the team's luck value.
 * @param party The player's party.
 * @returns A number between 0 and 14 based on the party's total luck value, or a random number between 0 and 14 if the player is in Daily Run mode.
 */
export function getPartyLuckValue(party: Pokemon[]): number {
  if (globalScene.gameMode.isDaily) {
    const DailyLuck = new NumberHolder(0);
    globalScene.executeWithSeedOffset(
      () => {
        const eventLuck = getDailyEventSeedLuck(globalScene.seed);
        if (!isNullOrUndefined(eventLuck)) {
          DailyLuck.value = eventLuck;
          return;
        }

        DailyLuck.value = randSeedInt(15); // Random number between 0 and 14
      },
      0,
      globalScene.seed,
    );
    return DailyLuck.value;
  }

  const eventSpecies = timedEventManager.getEventLuckBoostedSpecies();
  const luck = Phaser.Math.Clamp(
    party
      .map(p => (p.isAllowedInBattle() ? p.getLuck() + (eventSpecies.includes(p.species.speciesId) ? 1 : 0) : 0))
      .reduce((total: number, value: number) => (total += value), 0),
    0,
    14,
  );
  return Math.min(timedEventManager.getEventLuckBoost() + (luck ?? 0), 14);
}

export function getLuckString(luckValue: number): string {
  return ["D", "C", "C+", "B-", "B", "B+", "A-", "A", "A+", "A++", "S", "S+", "SS", "SS+", "SSS"][luckValue];
}

export function getLuckTextTint(luckValue: number): number {
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

export function initModifierTypes() {
  for (const [key, value] of Object.entries(modifierTypeInitObj)) {
    modifierTypes[key] = value;
  }
}

// TODO: If necessary, add the rest of the modifier types here.
// For now, doing the minimal work until the modifier rework lands.
const ModifierTypeConstructorMap = Object.freeze({
  ModifierTypeGenerator,
  PokemonHeldItemModifierType,
});

/**
 * Map of of modifier type strings to their constructor type
 */
export type ModifierTypeConstructorMap = typeof ModifierTypeConstructorMap;

/**
 * Map of modifier type strings to their instance type
 */
export type ModifierTypeInstanceMap = {
  [K in keyof ModifierTypeConstructorMap]: InstanceType<ModifierTypeConstructorMap[K]>;
};

export type ModifierTypeString = keyof ModifierTypeConstructorMap;
