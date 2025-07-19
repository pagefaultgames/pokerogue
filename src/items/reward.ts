import { TYPE_BOOST_ITEM_BOOST_PERCENT } from "#app/constants";
import { timedEventManager } from "#app/global-event-manager";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import Overrides from "#app/overrides";
import { EvolutionItem, FusionSpeciesFormEvolution, pokemonEvolutions } from "#balance/pokemon-evolutions";
import { FRIENDSHIP_GAIN_FROM_RARE_CANDY } from "#balance/starters";
import { tmPoolTiers, tmSpecies } from "#balance/tms";
import { allHeldItems, allMoves, allRewards, allTrainerItems } from "#data/data-lists";
import { getLevelTotalExp } from "#data/exp";
import { SpeciesFormChangeItemTrigger } from "#data/form-change-triggers";
import { getNatureName, getNatureStatMultiplier } from "#data/nature";
import { getPokeballCatchMultiplier, getPokeballName, MAX_PER_TYPE_POKEBALLS } from "#data/pokeball";
import { pokemonFormChanges, SpeciesFormChangeCondition } from "#data/pokemon-forms";
import { BattlerTagType } from "#enums/battler-tag-type";
import { BerryType } from "#enums/berry-type";
import { FormChangeItem } from "#enums/form-change-item";
import { HeldItemId } from "#enums/held-item-id";
import { LearnMoveType } from "#enums/learn-move-type";
import { MoveId } from "#enums/move-id";
import { Nature } from "#enums/nature";
import { PokeballType } from "#enums/pokeball";
import { PokemonType } from "#enums/pokemon-type";
import { RewardPoolType } from "#enums/reward-pool-type";
import { RewardTier } from "#enums/reward-tier";
import { SpeciesFormKey } from "#enums/species-form-key";
import { SpeciesId } from "#enums/species-id";
import type { PermanentStat, TempBattleStat } from "#enums/stat";
import { Stat, TEMP_BATTLE_STATS } from "#enums/stat";
import { TrainerItemId } from "#enums/trainer-item-id";
import type { PlayerPokemon, Pokemon } from "#field/pokemon";
import { attackTypeToHeldItem } from "#items/attack-type-booster";
import { permanentStatToHeldItem, statBoostItems } from "#items/base-stat-booster";
import { berryTypeToHeldItem } from "#items/berry";
import { getNewAttackTypeBoosterHeldItem, getNewBerryHeldItem, getNewVitaminHeldItem } from "#items/held-item-pool";
import { formChangeItemName } from "#items/item-utility";
import {
  SPECIES_STAT_BOOSTER_ITEMS,
  type SpeciesStatBoosterItemId,
  type SpeciesStatBoostHeldItem,
} from "#items/stat-booster";
import { TrainerItemEffect, tempStatToTrainerItem } from "#items/trainer-item";
import type { PokemonMove } from "#moves/pokemon-move";
import { getVoucherTypeIcon, getVoucherTypeName, VoucherType } from "#system/voucher";
import type { RewardFunc, WeightedRewardWeightFunc } from "#types/rewards";
import type { PokemonMoveSelectFilter, PokemonSelectFilter } from "#ui/party-ui-handler";
import { PartyUiHandler } from "#ui/party-ui-handler";
import { getRewardTierTextTint } from "#ui/text";
import {
  formatMoney,
  getEnumKeys,
  getEnumValues,
  isNullOrUndefined,
  NumberHolder,
  padInt,
  randSeedInt,
} from "#utils/common";
import { getRewardPoolForType } from "#utils/reward-utils";
import i18next from "i18next";

export class Reward {
  public id: string;
  public localeKey: string;
  public iconImage: string;
  public group: string;
  public soundName: string;
  public tier: RewardTier;

  /**
   * Checks if the modifier type is of a specific type
   * @param reward - The type to check against
   * @return Whether the modifier type is of the specified type
   */
  public is<K extends RewardString>(reward: K): this is RewardInstanceMap[K] {
    const targetType = RewardConstructorMap[reward];
    if (!targetType) {
      return false;
    }
    return this instanceof targetType;
  }

  constructor(localeKey: string | null, iconImage: string | null, group?: string, soundName?: string) {
    this.localeKey = localeKey!; // TODO: is this bang correct?
    this.iconImage = iconImage!; // TODO: is this bang correct?
    this.group = group!; // TODO: is this bang correct?
    this.soundName = soundName ?? "se/restore";
  }

  get name(): string {
    return i18next.t(`${this.localeKey}.name` as any);
  }

  getDescription(): string {
    return i18next.t(`${this.localeKey}.description` as any);
  }

  getIcon(): string {
    return this.iconImage;
  }

  setTier(tier: RewardTier): void {
    this.tier = tier;
  }
}

type RewardGeneratorFunc = (party: Pokemon[], pregenArgs?: any[]) => Reward | null;

export class RewardGenerator extends Reward {
  private genRewardFunc: RewardGeneratorFunc;

  constructor(genRewardFunc: RewardGeneratorFunc) {
    super(null, null);
    this.genRewardFunc = genRewardFunc;
  }

  generateReward(party: Pokemon[], pregenArgs?: any[]) {
    const ret = this.genRewardFunc(party, pregenArgs);
    if (ret) {
      ret.id = this.id;
      ret.setTier(this.tier);
    }
    return ret;
  }
}

export interface GeneratedPersistentReward {
  getPregenArgs(): any[];
}

export class AddPokeballReward extends Reward {
  private pokeballType: PokeballType;
  private count: number;

  constructor(iconImage: string, pokeballType: PokeballType, count: number) {
    super("", iconImage, "pb", "se/pb_bounce_1");
    this.pokeballType = pokeballType;
    this.count = count;
  }

  get name(): string {
    return i18next.t("modifierType:ModifierType.AddPokeballConsumableType.name", {
      modifierCount: this.count,
      pokeballName: getPokeballName(this.pokeballType),
    });
  }

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.AddPokeballConsumableType.description", {
      modifierCount: this.count,
      pokeballName: getPokeballName(this.pokeballType),
      catchRate:
        getPokeballCatchMultiplier(this.pokeballType) > -1
          ? `${getPokeballCatchMultiplier(this.pokeballType)}x`
          : "100%",
      pokeballAmount: `${globalScene.pokeballCounts[this.pokeballType]}`,
    });
  }

  /**
   * Applies {@linkcode AddPokeballReward}
   * @param battleScene {@linkcode BattleScene}
   * @returns always `true`
   */
  apply(): boolean {
    const pokeballCounts = globalScene.pokeballCounts;
    pokeballCounts[this.pokeballType] = Math.min(
      pokeballCounts[this.pokeballType] + this.count,
      MAX_PER_TYPE_POKEBALLS,
    );

    return true;
  }
}

export class AddVoucherReward extends Reward {
  private voucherType: VoucherType;
  private count: number;

  constructor(voucherType: VoucherType, count: number) {
    super("", getVoucherTypeIcon(voucherType), "voucher");
    this.count = count;
    this.voucherType = voucherType;
  }

  get name(): string {
    return i18next.t("modifierType:ModifierType.AddVoucherConsumableType.name", {
      modifierCount: this.count,
      voucherTypeName: getVoucherTypeName(this.voucherType),
    });
  }

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.AddVoucherConsumableType.description", {
      modifierCount: this.count,
      voucherTypeName: getVoucherTypeName(this.voucherType),
    });
  }

  /**
   * Applies {@linkcode AddVoucherReward}
   * @param battleScene {@linkcode BattleScene}
   * @returns always `true`
   */
  apply(): boolean {
    const voucherCounts = globalScene.gameData.voucherCounts;
    voucherCounts[this.voucherType] += this.count;

    return true;
  }
}

export class AddMoneyReward extends Reward {
  private moneyMultiplier: number;
  private moneyMultiplierDescriptorKey: string;

  constructor(localeKey: string, iconImage: string, moneyMultiplier: number, moneyMultiplierDescriptorKey: string) {
    super(localeKey, iconImage, "money", "se/buy");

    this.moneyMultiplier = moneyMultiplier;
    this.moneyMultiplierDescriptorKey = moneyMultiplierDescriptorKey;
  }

  getDescription(): string {
    const moneyAmount = new NumberHolder(globalScene.getWaveMoneyAmount(this.moneyMultiplier));
    globalScene.applyPlayerItems(TrainerItemEffect.MONEY_MULTIPLIER, { numberHolder: moneyAmount });
    const formattedMoney = formatMoney(globalScene.moneyFormat, moneyAmount.value);

    return i18next.t("modifierType:ModifierType.MoneyRewardReward.description", {
      moneyMultiplier: i18next.t(this.moneyMultiplierDescriptorKey as any),
      moneyAmount: formattedMoney,
    });
  }

  /**
   * Applies {@linkcode AddMoneyReward}
   * @returns always `true`
   */
  apply(): boolean {
    const moneyAmount = new NumberHolder(globalScene.getWaveMoneyAmount(this.moneyMultiplier));

    globalScene.applyPlayerItems(TrainerItemEffect.MONEY_MULTIPLIER, { numberHolder: moneyAmount });

    globalScene.addMoney(moneyAmount.value);

    for (const p of globalScene.getPlayerParty()) {
      if (p.species?.speciesId === SpeciesId.GIMMIGHOUL || p.fusionSpecies?.speciesId === SpeciesId.GIMMIGHOUL) {
        const factor = Math.min(Math.floor(this.moneyMultiplier), 3);
        p.heldItemManager.add(HeldItemId.GIMMIGHOUL_EVO_TRACKER, factor);
      }
    }

    return true;
  }
}

export class PokemonReward extends Reward {
  public selectFilter: PokemonSelectFilter | undefined;

  constructor(
    localeKey: string,
    iconImage: string,
    selectFilter?: PokemonSelectFilter,
    group?: string,
    soundName?: string,
  ) {
    super(localeKey, iconImage, group, soundName);

    this.selectFilter = selectFilter;
  }
}

export class HeldItemReward extends PokemonReward {
  public itemId: HeldItemId;
  constructor(itemId: HeldItemId, group?: string, soundName?: string) {
    super(
      "",
      "",
      (pokemon: PlayerPokemon) => {
        const hasItem = pokemon.heldItemManager.hasItem(this.itemId);
        const maxStackCount = allHeldItems[this.itemId].getMaxStackCount();
        if (!maxStackCount) {
          return i18next.t("modifierType:ModifierType.PokemonHeldItemReward.extra.inoperable", {
            pokemonName: getPokemonNameWithAffix(pokemon),
          });
        }
        if (hasItem && pokemon.heldItemManager.getStack(this.itemId) === maxStackCount) {
          return i18next.t("modifierType:ModifierType.PokemonHeldItemReward.extra.tooMany", {
            pokemonName: getPokemonNameWithAffix(pokemon),
          });
        }
        return null;
      },
      group,
      soundName,
    );
    this.itemId = itemId;
  }

  get name(): string {
    return allHeldItems[this.itemId].name;
  }

  getDescription(): string {
    return allHeldItems[this.itemId].description;
  }

  getIcon(): string {
    return allHeldItems[this.itemId].iconName;
  }

  apply(pokemon: PlayerPokemon): boolean {
    return pokemon.heldItemManager.add(this.itemId);
  }
}

export class TrainerItemReward extends Reward {
  public itemId: TrainerItemId;
  constructor(itemId: TrainerItemId, group?: string, soundName?: string) {
    super("", "", group, soundName);
    this.itemId = itemId;
  }

  get name(): string {
    return allTrainerItems[this.itemId].name;
  }

  getDescription(): string {
    return allTrainerItems[this.itemId].description;
  }

  getIcon(): string {
    return allTrainerItems[this.itemId].iconName;
  }

  apply() {
    globalScene.trainerItems.add(this.itemId);
  }
}

export class LapsingTrainerItemReward extends TrainerItemReward {
  apply() {
    globalScene.trainerItems.add(this.itemId, allTrainerItems[this.itemId].getMaxStackCount());
  }
}

export class TerastallizeReward extends PokemonReward {
  private teraType: PokemonType;

  constructor(teraType: PokemonType) {
    super(
      "",
      `${PokemonType[teraType].toLowerCase()}_tera_shard`,
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
    return i18next.t("modifierType:ModifierType.TerastallizeReward.name", {
      teraType: i18next.t(`pokemonInfo:Type.${PokemonType[this.teraType]}`),
    });
  }

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.TerastallizeReward.description", {
      teraType: i18next.t(`pokemonInfo:Type.${PokemonType[this.teraType]}`),
    });
  }

  getPregenArgs(): any[] {
    return [this.teraType];
  }

  /**
   * Checks if {@linkcode TerrastalizeConsumable} should be applied
   * @param playerPokemon The {@linkcode PlayerPokemon} that consumes the item
   * @returns `true` if the {@linkcode TerrastalizeConsumable} should be applied
   */
  shouldApply(playerPokemon?: PlayerPokemon): boolean {
    return (
      [playerPokemon?.species.speciesId, playerPokemon?.fusionSpecies?.speciesId].filter(
        s => s === SpeciesId.TERAPAGOS || s === SpeciesId.OGERPON || s === SpeciesId.SHEDINJA,
      ).length === 0
    );
  }

  /**
   * Applies {@linkcode TerrastalizeConsumable}
   * @param pokemon The {@linkcode PlayerPokemon} that consumes the item
   * @returns `true` if hp was restored
   */
  apply(pokemon: Pokemon): boolean {
    pokemon.teraType = this.teraType;
    return true;
  }
}

function restorePokemonHp(
  pokemon: Pokemon,
  percentToRestore: number,
  pointsToRestore = 0,
  healStatus = false,
  fainted = false,
): boolean {
  if (!pokemon.hp === fainted) {
    if (fainted || healStatus) {
      pokemon.resetStatus(true, true, false, false);
    }
    // Apply HealingCharm
    let multiplier = 1;
    if (!fainted) {
      const hpRestoreMultiplier = new NumberHolder(1);
      this.applyPlayerItems(TrainerItemEffect.HEALING_BOOSTER, { numberHolder: hpRestoreMultiplier });
      multiplier = hpRestoreMultiplier.value;
    }
    const restorePoints = Math.floor(pointsToRestore * multiplier);
    const restorePercent = Math.floor(percentToRestore * 0.01 * multiplier * pokemon.getMaxHp());
    pokemon.heal(Math.max(restorePercent, restorePoints, 1));
    return true;
  }
  return false;
}

export class PokemonHpRestoreReward extends PokemonReward {
  protected restorePoints: number;
  protected restorePercent: number;
  protected healStatus: boolean;

  constructor(
    localeKey: string,
    iconImage: string,
    restorePoints: number,
    restorePercent: number,
    healStatus = false,
    selectFilter?: PokemonSelectFilter,
    group?: string,
  ) {
    super(
      localeKey,
      iconImage,
      selectFilter ||
        ((pokemon: PlayerPokemon) => {
          if (
            !pokemon.hp ||
            (pokemon.isFullHp() && (!this.healStatus || (!pokemon.status && !pokemon.getTag(BattlerTagType.CONFUSED))))
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
      ? i18next.t("modifierType:ModifierType.PokemonHpRestoreReward.description", {
          restorePoints: this.restorePoints,
          restorePercent: this.restorePercent,
        })
      : this.healStatus
        ? i18next.t("modifierType:ModifierType.PokemonHpRestoreReward.extra.fullyWithStatus")
        : i18next.t("modifierType:ModifierType.PokemonHpRestoreReward.extra.fully");
  }

  apply(playerPokemon: PlayerPokemon): boolean {
    return restorePokemonHp(playerPokemon, this.restorePercent, this.restorePoints, this.healStatus, false);
  }
}

export class PokemonReviveReward extends PokemonHpRestoreReward {
  constructor(localeKey: string, iconImage: string, restorePercent: number) {
    super(
      localeKey,
      iconImage,
      0,
      restorePercent,
      false,
      (pokemon: PlayerPokemon) => {
        if (!pokemon.isFainted()) {
          return PartyUiHandler.NoEffectMessage;
        }
        return null;
      },
      "revive",
    );

    this.selectFilter = (pokemon: PlayerPokemon) => {
      if (pokemon.hp) {
        return PartyUiHandler.NoEffectMessage;
      }
      return null;
    };
  }

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.PokemonReviveReward.description", {
      restorePercent: this.restorePercent,
    });
  }

  apply(playerPokemon: PlayerPokemon): boolean {
    return restorePokemonHp(playerPokemon, this.restorePercent, 0, false, true);
  }
}

class AllPokemonFullReviveReward extends Reward {
  constructor(localeKey: string, iconImage: string) {
    super(localeKey, iconImage, "modifierType:ModifierType.AllPokemonFullReviveReward");
  }

  apply(): boolean {
    for (const pokemon of globalScene.getPlayerParty()) {
      restorePokemonHp(pokemon, 100, 0, false, true);
    }

    return true;
  }
}

export class PokemonStatusHealReward extends PokemonReward {
  constructor(localeKey: string, iconImage: string) {
    super(localeKey, iconImage, (pokemon: PlayerPokemon) => {
      if (!pokemon.hp || (!pokemon.status && !pokemon.getTag(BattlerTagType.CONFUSED))) {
        return PartyUiHandler.NoEffectMessage;
      }
      return null;
    });
  }

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.PokemonStatusHealReward.description");
  }

  apply(playerPokemon: PlayerPokemon): boolean {
    playerPokemon.resetStatus(true, true, false, false);
    return true;
  }
}

export abstract class PokemonMoveReward extends PokemonReward {
  public moveSelectFilter: PokemonMoveSelectFilter | undefined;

  constructor(
    localeKey: string,
    iconImage: string,
    selectFilter?: PokemonSelectFilter,
    moveSelectFilter?: PokemonMoveSelectFilter,
    group?: string,
  ) {
    super(localeKey, iconImage, selectFilter, group);

    this.moveSelectFilter = moveSelectFilter;
  }

  apply(_playerPokemon: PlayerPokemon, _moveIndex: number): boolean {
    return false;
  }
}

export class PokemonPpRestoreReward extends PokemonMoveReward {
  protected restorePoints: number;

  constructor(localeKey: string, iconImage: string, restorePoints: number) {
    super(
      localeKey,
      iconImage,
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
      ? i18next.t("modifierType:ModifierType.PokemonPpRestoreReward.description", {
          restorePoints: this.restorePoints,
        })
      : i18next.t("modifierType:ModifierType.PokemonPpRestoreReward.extra.fully");
  }

  /**
   * Applies {@linkcode PokemonPpRestoreConsumable}
   * @param playerPokemon The {@linkcode PlayerPokemon} that should get move pp restored
   * @returns always `true`
   */
  override apply(playerPokemon: PlayerPokemon, moveIndex: number): boolean {
    const move = playerPokemon.getMoveset()[moveIndex];

    if (move) {
      move.ppUsed = this.restorePoints > -1 ? Math.max(move.ppUsed - this.restorePoints, 0) : 0;
    }

    return true;
  }
}

export class PokemonAllMovePpRestoreReward extends PokemonReward {
  protected restorePoints: number;

  constructor(localeKey: string, iconImage: string, restorePoints: number) {
    super(
      localeKey,
      iconImage,
      (pokemon: PlayerPokemon) => {
        if (!pokemon.getMoveset().filter(m => m.ppUsed).length) {
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
      ? i18next.t("modifierType:ModifierType.PokemonAllMovePpRestoreReward.description", {
          restorePoints: this.restorePoints,
        })
      : i18next.t("modifierType:ModifierType.PokemonAllMovePpRestoreReward.extra.fully");
  }

  /**
   * Applies {@linkcode PokemonAllMovePpRestoreConsumable}
   * @param playerPokemon The {@linkcode PlayerPokemon} that should get all move pp restored
   * @returns always `true`
   */
  apply(playerPokemon: PlayerPokemon): boolean {
    for (const move of playerPokemon.getMoveset()) {
      if (move) {
        move.ppUsed = this.restorePoints > -1 ? Math.max(move.ppUsed - this.restorePoints, 0) : 0;
      }
    }

    return true;
  }
}

export class PokemonPpUpReward extends PokemonMoveReward {
  protected upPoints: number;

  constructor(localeKey: string, iconImage: string, upPoints: number) {
    super(
      localeKey,
      iconImage,
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
    return i18next.t("modifierType:ModifierType.PokemonPpUpReward.description", { upPoints: this.upPoints });
  }

  /**
   * Applies {@linkcode PokemonPpUpConsumable}
   * @param playerPokemon The {@linkcode PlayerPokemon} that gets a pp up on move-slot {@linkcode moveIndex}
   * @returns
   */
  override apply(playerPokemon: PlayerPokemon, moveIndex: number): boolean {
    const move = playerPokemon.getMoveset()[moveIndex];

    if (move && !move.maxPpOverride) {
      move.ppUp = Math.min(move.ppUp + this.upPoints, 3);
    }

    return true;
  }
}

export class PokemonNatureChangeReward extends PokemonReward {
  protected nature: Nature;

  constructor(nature: Nature) {
    super(
      "",
      `mint_${
        getEnumKeys(Stat)
          .find(s => getNatureStatMultiplier(nature, Stat[s]) > 1)
          ?.toLowerCase() || "neutral"
      }`,
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
    return i18next.t("modifierType:ModifierType.PokemonNatureChangeReward.name", {
      natureName: getNatureName(this.nature),
    });
  }

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.PokemonNatureChangeReward.description", {
      natureName: getNatureName(this.nature, true, true, true),
    });
  }

  /**
   * Applies {@linkcode PokemonNatureChangeConsumable}
   * @param playerPokemon {@linkcode PlayerPokemon} to apply the {@linkcode Nature} change to
   * @returns
   */
  apply(playerPokemon: PlayerPokemon): boolean {
    playerPokemon.setCustomNature(this.nature);
    globalScene.gameData.unlockSpeciesNature(playerPokemon.species, this.nature);

    return true;
  }
}

export class RememberMoveReward extends PokemonReward {
  constructor(localeKey: string, iconImage: string, group?: string) {
    super(
      localeKey,
      iconImage,
      (pokemon: PlayerPokemon) => {
        if (!pokemon.getLearnableLevelMoves().length) {
          return PartyUiHandler.NoEffectMessage;
        }
        return null;
      },
      group,
    );
  }

  /**
   * Applies {@linkcode RememberMoveConsumable}
   * @param playerPokemon The {@linkcode PlayerPokemon} that should remember the move
   * @returns always `true`
   */
  //TODO: Do we really need this cost parameter here?
  apply(playerPokemon: PlayerPokemon, levelMoveIndex: number, cost?: number): boolean {
    globalScene.phaseManager.unshiftNew(
      "LearnMovePhase",
      globalScene.getPlayerParty().indexOf(playerPokemon),
      playerPokemon.getLearnableLevelMoves()[levelMoveIndex],
      LearnMoveType.MEMORY,
      cost,
    );

    return true;
  }
}

class BerryRewardGenerator extends RewardGenerator {
  constructor() {
    super((_party: Pokemon[], pregenArgs?: any[]) => {
      if (pregenArgs && pregenArgs.length === 1 && pregenArgs[0] in BerryType) {
        const item = berryTypeToHeldItem[pregenArgs[0] as BerryType];
        return new HeldItemReward(item);
      }
      const item = getNewBerryHeldItem();
      return new HeldItemReward(item);
    });
  }
}

export class AttackTypeBoosterReward extends HeldItemReward implements GeneratedPersistentReward {
  public moveType: PokemonType;
  public boostPercent: number;

  constructor(moveType: PokemonType, boostPercent: number) {
    const itemId = attackTypeToHeldItem[moveType];
    super(itemId);
    this.moveType = moveType;
    this.boostPercent = boostPercent;
  }

  getPregenArgs(): any[] {
    return [this.moveType];
  }
}

function incrementLevelWithCandy(
  playerPokemon: PlayerPokemon,
  levelCount: NumberHolder = new NumberHolder(1),
): boolean {
  globalScene.applyPlayerItems(TrainerItemEffect.LEVEL_INCREMENT_BOOSTER, { numberHolder: levelCount });

  playerPokemon.level += levelCount.value;
  if (playerPokemon.level <= globalScene.getMaxExpLevel(true)) {
    playerPokemon.exp = getLevelTotalExp(playerPokemon.level, playerPokemon.species.growthRate);
    playerPokemon.levelExp = 0;
  }

  playerPokemon.addFriendship(FRIENDSHIP_GAIN_FROM_RARE_CANDY);

  globalScene.phaseManager.unshiftNew(
    "LevelUpPhase",
    globalScene.getPlayerParty().indexOf(playerPokemon),
    playerPokemon.level - levelCount.value,
    playerPokemon.level,
  );

  return true;
}

export class PokemonLevelIncrementReward extends PokemonReward {
  constructor(localeKey: string, iconImage: string) {
    super(localeKey, iconImage, (_pokemon: PlayerPokemon) => null);
  }

  getDescription(): string {
    let levels = 1;
    const candyJarStack = globalScene.trainerItems.getStack(TrainerItemId.CANDY_JAR);
    levels += candyJarStack;
    return i18next.t("modifierType:ModifierType.PokemonLevelIncrementReward.description", { levels });
  }

  /**
   * Applies {@linkcode PokemonLevelIncrementConsumable}
   * @param playerPokemon The {@linkcode PlayerPokemon} that should get levels incremented
   * @param levelCount The amount of levels to increment
   * @returns always `true`
   */
  apply(playerPokemon: PlayerPokemon, levelCount: NumberHolder = new NumberHolder(1)): boolean {
    return incrementLevelWithCandy(playerPokemon, levelCount);
  }
}

export class AllPokemonLevelIncrementReward extends Reward {
  getDescription(): string {
    let levels = 1;
    const candyJarStack = globalScene.trainerItems.getStack(TrainerItemId.CANDY_JAR);
    levels += candyJarStack;
    return i18next.t("modifierType:ModifierType.AllPokemonLevelIncrementReward.description", { levels });
  }

  apply(levelCount: NumberHolder = new NumberHolder(1)): boolean {
    for (const pokemon of globalScene.getPlayerParty()) {
      incrementLevelWithCandy(pokemon, levelCount);
    }

    return true;
  }
}

export class BaseStatBoosterReward extends HeldItemReward {
  private stat: PermanentStat;
  private key: string;

  constructor(stat: PermanentStat) {
    const key = statBoostItems[stat];
    const itemId = permanentStatToHeldItem[stat];
    super(itemId);

    this.stat = stat;
    this.key = key;
  }
}

export class TmReward extends PokemonReward {
  public moveId: MoveId;

  constructor(moveId: MoveId) {
    super(
      "",
      `tm_${PokemonType[allMoves[moveId].type].toLowerCase()}`,
      (pokemon: PlayerPokemon) => {
        if (
          pokemon.compatibleTms.indexOf(moveId) === -1 ||
          pokemon.getMoveset().filter(m => m.moveId === moveId).length
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
    return i18next.t("modifierType:ModifierType.TmReward.name", {
      moveId: padInt(Object.keys(tmSpecies).indexOf(this.moveId.toString()) + 1, 3),
      moveName: allMoves[this.moveId].name,
    });
  }

  getDescription(): string {
    return i18next.t(
      globalScene.enableMoveInfo
        ? "modifierType:ModifierType.TmRewardWithInfo.description"
        : "modifierType:ModifierType.TmReward.description",
      { moveName: allMoves[this.moveId].name },
    );
  }

  /**
   * Applies {@linkcode TmConsumable}
   * @param playerPokemon The {@linkcode PlayerPokemon} that should learn the TM
   * @returns always `true`
   */
  apply(playerPokemon: PlayerPokemon): boolean {
    globalScene.phaseManager.unshiftNew(
      "LearnMovePhase",
      globalScene.getPlayerParty().indexOf(playerPokemon),
      this.moveId,
      LearnMoveType.TM,
    );

    return true;
  }
}

export class EvolutionItemReward extends PokemonReward implements GeneratedPersistentReward {
  public evolutionItem: EvolutionItem;

  constructor(evolutionItem: EvolutionItem) {
    super("", EvolutionItem[evolutionItem].toLowerCase(), (pokemon: PlayerPokemon) => {
      if (
        pokemonEvolutions.hasOwnProperty(pokemon.species.speciesId) &&
        pokemonEvolutions[pokemon.species.speciesId].filter(e => e.validate(pokemon, false, this.evolutionItem))
          .length &&
        pokemon.getFormKey() !== SpeciesFormKey.GIGANTAMAX
      ) {
        return null;
      }
      if (
        pokemon.isFusion() &&
        pokemon.fusionSpecies &&
        pokemonEvolutions.hasOwnProperty(pokemon.fusionSpecies.speciesId) &&
        pokemonEvolutions[pokemon.fusionSpecies.speciesId].filter(e => e.validate(pokemon, true, this.evolutionItem))
          .length &&
        pokemon.getFusionFormKey() !== SpeciesFormKey.GIGANTAMAX
      ) {
        return null;
      }

      return PartyUiHandler.NoEffectMessage;
    });

    this.evolutionItem = evolutionItem;
  }

  get name(): string {
    return i18next.t(`reward:EvolutionItem.${EvolutionItem[this.evolutionItem]}`);
  }

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.EvolutionItemReward.description");
  }

  getPregenArgs(): any[] {
    return [this.evolutionItem];
  }

  /**
   * Applies {@linkcode EvolutionItemConsumable}
   * @param playerPokemon The {@linkcode PlayerPokemon} that should evolve via item
   * @returns `true` if the evolution was successful
   */
  apply(playerPokemon: PlayerPokemon): boolean {
    let matchingEvolution = pokemonEvolutions.hasOwnProperty(playerPokemon.species.speciesId)
      ? pokemonEvolutions[playerPokemon.species.speciesId].find(
          e => e.evoItem === this.evolutionItem && e.validate(playerPokemon, false, e.item!),
        )
      : null;

    if (!matchingEvolution && playerPokemon.isFusion()) {
      matchingEvolution = pokemonEvolutions[playerPokemon.fusionSpecies!.speciesId].find(
        e => e.evoItem === this.evolutionItem && e.validate(playerPokemon, true, e.item!),
      );
      if (matchingEvolution) {
        matchingEvolution = new FusionSpeciesFormEvolution(playerPokemon.species.speciesId, matchingEvolution);
      }
    }

    if (matchingEvolution) {
      globalScene.phaseManager.unshiftNew("EvolutionPhase", playerPokemon, matchingEvolution, playerPokemon.level - 1);
      return true;
    }

    return false;
  }
}

/**
 * Class that represents form changing items
 */
export class FormChangeItemReward extends PokemonReward {
  public formChangeItem: FormChangeItem;

  constructor(formChangeItem: FormChangeItem) {
    super("", FormChangeItem[formChangeItem].toLowerCase(), (pokemon: PlayerPokemon) => {
      // Make sure the Pokemon has alternate forms
      if (
        pokemonFormChanges.hasOwnProperty(pokemon.species.speciesId) &&
        // Get all form changes for this species with an item trigger, including any compound triggers
        pokemonFormChanges[pokemon.species.speciesId]
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
    });

    this.formChangeItem = formChangeItem;
  }

  get name(): string {
    return formChangeItemName(this.formChangeItem);
  }

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.FormChangeItemReward.description");
  }

  apply(pokemon: Pokemon) {
    if (pokemon.heldItemManager.hasFormChangeItem(this.formChangeItem)) {
      return;
    }

    pokemon.heldItemManager.addFormChangeItem(this.formChangeItem);
    pokemon.heldItemManager.toggleActive(this.formChangeItem);

    globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeItemTrigger);

    globalScene.updateItems(true);
  }
}

export class FusePokemonReward extends PokemonReward {
  constructor(localeKey: string, iconImage: string) {
    super(localeKey, iconImage, (pokemon: PlayerPokemon) => {
      if (pokemon.isFusion()) {
        return PartyUiHandler.NoEffectMessage;
      }
      return null;
    });
  }

  getDescription(): string {
    return i18next.t("modifierType:ModifierType.FusePokemonReward.description");
  }

  /**
   * Applies {@linkcode FusePokemonConsumable}
   * @param playerPokemon {@linkcode PlayerPokemon} that should be fused
   * @param playerPokemon2 {@linkcode PlayerPokemon} that should be fused with {@linkcode playerPokemon}
   * @returns always Promise<true>
   */
  apply(playerPokemon: PlayerPokemon, playerPokemon2: PlayerPokemon): boolean {
    playerPokemon.fuse(playerPokemon2);
    return true;
  }
}

class AttackTypeBoosterRewardGenerator extends RewardGenerator {
  constructor() {
    super((party: Pokemon[], pregenArgs?: any[]) => {
      if (pregenArgs && pregenArgs.length === 1 && pregenArgs[0] in PokemonType) {
        return new AttackTypeBoosterReward(pregenArgs[0] as PokemonType, TYPE_BOOST_ITEM_BOOST_PERCENT);
      }

      const item = getNewAttackTypeBoosterHeldItem(party);

      return item ? new HeldItemReward(item) : null;
    });
  }
}

class BaseStatBoosterRewardGenerator extends RewardGenerator {
  constructor() {
    super((_party: Pokemon[], pregenArgs?: any[]) => {
      if (pregenArgs) {
        return new BaseStatBoosterReward(pregenArgs[0]);
      }
      return new HeldItemReward(getNewVitaminHeldItem());
    });
  }
}

class TempStatStageBoosterRewardGenerator extends RewardGenerator {
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
        return new LapsingTrainerItemReward(tempStatToTrainerItem[pregenArgs[0]]);
      }
      const randStat: TempBattleStat = randSeedInt(Stat.ACC, Stat.ATK);
      return new LapsingTrainerItemReward(tempStatToTrainerItem[randStat]);
    });
  }
}

/**
 * Consumable type generator for {@linkcode SpeciesStatBoosterReward}, which
 * encapsulates the logic for weighting the most useful held item from
 * the current list of {@linkcode items}.
 * @extends RewardGenerator
 */
class SpeciesStatBoosterRewardGenerator extends RewardGenerator {
  /** Object comprised of the currently available species-based stat boosting held items */

  constructor(rare: boolean) {
    super((party: Pokemon[], pregenArgs?: any[]) => {
      if (pregenArgs && pregenArgs.length === 1 && pregenArgs[0] in SPECIES_STAT_BOOSTER_ITEMS) {
        return new HeldItemReward(pregenArgs[0] as HeldItemId);
      }

      // Get a pool of items based on the rarity.
      const tierItems = rare
        ? [HeldItemId.LIGHT_BALL, HeldItemId.THICK_CLUB, HeldItemId.METAL_POWDER, HeldItemId.QUICK_POWDER]
        : [HeldItemId.DEEP_SEA_SCALE, HeldItemId.DEEP_SEA_TOOTH];

      const weights = new Array(tierItems.length).fill(0);

      for (const p of party) {
        const speciesId = p.getSpeciesForm(true).speciesId;
        const fusionSpeciesId = p.isFusion() ? p.getFusionSpeciesForm(true).speciesId : null;
        // TODO: Use commented boolean when Fling is implemented
        const hasFling = false; /* p.getMoveset(true).some(m => m.moveId === MoveId.FLING) */

        for (const i in tierItems) {
          const checkedSpecies = (allHeldItems[tierItems[i]] as SpeciesStatBoostHeldItem).species;

          // If party member already has the item being weighted currently, skip to the next item
          const hasItem = p.heldItemManager.hasItem(tierItems[i]);

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

      // TODO: Replace this with a helper function
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
              return new HeldItemReward(tierItems[i]);
            }
            weight = curWeight;
          }
        }
      }

      return null;
    });
  }
}

class TmRewardGenerator extends RewardGenerator {
  constructor(tier: RewardTier) {
    super((party: Pokemon[], pregenArgs?: any[]) => {
      if (pregenArgs && pregenArgs.length === 1 && pregenArgs[0] in MoveId) {
        return new TmReward(pregenArgs[0] as MoveId);
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
      if (!tierUniqueCompatibleTms.length) {
        return null;
      }
      const randTmIndex = randSeedInt(tierUniqueCompatibleTms.length);
      return new TmReward(tierUniqueCompatibleTms[randTmIndex]);
    });
  }
}

class EvolutionItemRewardGenerator extends RewardGenerator {
  constructor(rare: boolean) {
    super((party: Pokemon[], pregenArgs?: any[]) => {
      if (pregenArgs && pregenArgs.length === 1 && pregenArgs[0] in EvolutionItem) {
        return new EvolutionItemReward(pregenArgs[0] as EvolutionItem);
      }

      const evolutionItemPool = [
        party
          .filter(
            p =>
              pokemonEvolutions.hasOwnProperty(p.species.speciesId) &&
              (!p.pauseEvolutions ||
                p.species.speciesId === SpeciesId.SLOWPOKE ||
                p.species.speciesId === SpeciesId.EEVEE ||
                p.species.speciesId === SpeciesId.KIRLIA ||
                p.species.speciesId === SpeciesId.SNORUNT),
          )
          .flatMap(p => {
            const evolutions = pokemonEvolutions[p.species.speciesId];
            return evolutions.filter(e => e.isValidItemEvolution(p));
          }),
        party
          .filter(
            p =>
              p.isFusion() &&
              p.fusionSpecies &&
              pokemonEvolutions.hasOwnProperty(p.fusionSpecies.speciesId) &&
              (!p.pauseEvolutions ||
                p.fusionSpecies.speciesId === SpeciesId.SLOWPOKE ||
                p.fusionSpecies.speciesId === SpeciesId.EEVEE ||
                p.fusionSpecies.speciesId === SpeciesId.KIRLIA ||
                p.fusionSpecies.speciesId === SpeciesId.SNORUNT),
          )
          .flatMap(p => {
            const evolutions = pokemonEvolutions[p.fusionSpecies!.speciesId];
            return evolutions.filter(e => e.isValidItemEvolution(p, true));
          }),
      ]
        .flat()
        .flatMap(e => e.evoItem)
        .filter(i => !!i && i > 50 === rare);

      if (!evolutionItemPool.length) {
        return null;
      }

      return new EvolutionItemReward(evolutionItemPool[randSeedInt(evolutionItemPool.length)]!); // TODO: is the bang correct?
    });
  }
}

export class FormChangeItemRewardGenerator extends RewardGenerator {
  constructor(isRareFormChangeItem: boolean) {
    super((party: Pokemon[], pregenArgs?: any[]) => {
      if (pregenArgs && pregenArgs.length === 1 && pregenArgs[0] in FormChangeItem) {
        return new FormChangeItemReward(pregenArgs[0] as FormChangeItem);
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
                    ((fc.formKey.indexOf(SpeciesFormKey.MEGA) === -1 &&
                      fc.formKey.indexOf(SpeciesFormKey.PRIMAL) === -1) ||
                      globalScene.trainerItems.hasItem(TrainerItemId.MEGA_BRACELET)) &&
                    ((fc.formKey.indexOf(SpeciesFormKey.GIGANTAMAX) === -1 &&
                      fc.formKey.indexOf(SpeciesFormKey.ETERNAMAX) === -1) ||
                      globalScene.trainerItems.hasItem(TrainerItemId.DYNAMAX_BAND)) &&
                    (!fc.conditions.length ||
                      fc.conditions.filter(cond => cond instanceof SpeciesFormChangeCondition && cond.predicate(p))
                        .length) &&
                    fc.preFormKey === p.getFormKey(),
                )
                .map(fc => fc.findTrigger(SpeciesFormChangeItemTrigger) as SpeciesFormChangeItemTrigger)
                .filter(t => t?.active && !p.heldItemManager.hasFormChangeItem(t.item));

              if (p.species.speciesId === SpeciesId.NECROZMA) {
                // technically we could use a simplified version and check for formChanges.length > 3, but in case any code changes later, this might break...
                let foundULTRA_Z = false,
                  foundN_LUNA = false,
                  foundN_SOLAR = false;
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

      if (!formChangeItemPool.length) {
        return null;
      }

      return new FormChangeItemReward(formChangeItemPool[randSeedInt(formChangeItemPool.length)]);
    });
  }
}

export class WeightedReward {
  public reward: Reward;
  public weight: number | WeightedRewardWeightFunc;
  public maxWeight: number | WeightedRewardWeightFunc;

  constructor(
    rewardFunc: RewardFunc,
    weight: number | WeightedRewardWeightFunc,
    maxWeight?: number | WeightedRewardWeightFunc,
  ) {
    this.reward = rewardFunc();
    this.reward.id = Object.keys(rewardInitObj).find(k => rewardInitObj[k] === rewardFunc)!; // TODO: is this bang correct?
    this.weight = weight;
    this.maxWeight = maxWeight || (!(weight instanceof Function) ? weight : 0);
  }

  setTier(tier: RewardTier) {
    this.reward.setTier(tier);
  }
}

type BaseRewardOverride = {
  name: Exclude<RewardKeys, GeneratorRewardOverride["name"]>;
  count?: number;
};

/** Type for modifiers and held items that are constructed via {@linkcode RewardGenerator}. */
export type GeneratorRewardOverride = {
  count?: number;
} & (
  | {
      name: keyof Pick<typeof rewardInitObj, "SPECIES_STAT_BOOSTER" | "RARE_SPECIES_STAT_BOOSTER">;
      type?: SpeciesStatBoosterItemId;
    }
  | {
      name: keyof Pick<typeof rewardInitObj, "TEMP_STAT_STAGE_BOOSTER">;
      type?: TempBattleStat;
    }
  | {
      name: keyof Pick<typeof rewardInitObj, "BASE_STAT_BOOSTER">;
      type?: Stat;
    }
  | {
      name: keyof Pick<typeof rewardInitObj, "MINT">;
      type?: Nature;
    }
  | {
      name: keyof Pick<typeof rewardInitObj, "ATTACK_TYPE_BOOSTER" | "TERA_SHARD">;
      type?: PokemonType;
    }
  | {
      name: keyof Pick<typeof rewardInitObj, "BERRY">;
      type?: BerryType;
    }
  | {
      name: keyof Pick<typeof rewardInitObj, "EVOLUTION_ITEM" | "RARE_EVOLUTION_ITEM">;
      type?: EvolutionItem;
    }
  | {
      name: keyof Pick<typeof rewardInitObj, "FORM_CHANGE_ITEM" | "RARE_FORM_CHANGE_ITEM">;
      type?: FormChangeItem;
    }
  | {
      name: keyof Pick<typeof rewardInitObj, "TM_COMMON" | "TM_GREAT" | "TM_ULTRA">;
      type?: MoveId;
    }
);

/** Type used to construct modifiers and held items for overriding purposes. */
export type RewardOverride = GeneratorRewardOverride | BaseRewardOverride;

export type RewardKeys = keyof typeof rewardInitObj;

const rewardInitObj = Object.freeze({
  // Pokeball rewards
  POKEBALL: () => new AddPokeballReward("pb", PokeballType.POKEBALL, 5),
  GREAT_BALL: () => new AddPokeballReward("gb", PokeballType.GREAT_BALL, 5),
  ULTRA_BALL: () => new AddPokeballReward("ub", PokeballType.ULTRA_BALL, 5),
  ROGUE_BALL: () => new AddPokeballReward("rb", PokeballType.ROGUE_BALL, 5),
  MASTER_BALL: () => new AddPokeballReward("mb", PokeballType.MASTER_BALL, 1),

  // Voucher rewards
  VOUCHER: () => new AddVoucherReward(VoucherType.REGULAR, 1),
  VOUCHER_PLUS: () => new AddVoucherReward(VoucherType.PLUS, 1),
  VOUCHER_PREMIUM: () => new AddVoucherReward(VoucherType.PREMIUM, 1),

  // Money rewards
  NUGGET: () =>
    new AddMoneyReward(
      "modifierType:ModifierType.NUGGET",
      "nugget",
      1,
      "modifierType:ModifierType.MoneyRewardReward.extra.small",
    ),
  BIG_NUGGET: () =>
    new AddMoneyReward(
      "modifierType:ModifierType.BIG_NUGGET",
      "big_nugget",
      2.5,
      "modifierType:ModifierType.MoneyRewardReward.extra.moderate",
    ),
  RELIC_GOLD: () =>
    new AddMoneyReward(
      "modifierType:ModifierType.RELIC_GOLD",
      "relic_gold",
      10,
      "modifierType:ModifierType.MoneyRewardReward.extra.large",
    ),

  // Party-wide consumables
  RARER_CANDY: () => new AllPokemonLevelIncrementReward("modifierType:ModifierType.RARER_CANDY", "rarer_candy"),
  SACRED_ASH: () => new AllPokemonFullReviveReward("modifierType:ModifierType.SACRED_ASH", "sacred_ash"),

  // Pokemon consumables
  RARE_CANDY: () => new PokemonLevelIncrementReward("modifierType:ModifierType.RARE_CANDY", "rare_candy"),

  EVOLUTION_ITEM: () => new EvolutionItemRewardGenerator(false),
  RARE_EVOLUTION_ITEM: () => new EvolutionItemRewardGenerator(true),

  POTION: () => new PokemonHpRestoreReward("modifierType:ModifierType.POTION", "potion", 20, 10),
  SUPER_POTION: () => new PokemonHpRestoreReward("modifierType:ModifierType.SUPER_POTION", "super_potion", 50, 25),
  HYPER_POTION: () => new PokemonHpRestoreReward("modifierType:ModifierType.HYPER_POTION", "hyper_potion", 200, 50),
  MAX_POTION: () => new PokemonHpRestoreReward("modifierType:ModifierType.MAX_POTION", "max_potion", 0, 100),
  FULL_RESTORE: () =>
    new PokemonHpRestoreReward("modifierType:ModifierType.FULL_RESTORE", "full_restore", 0, 100, true),

  REVIVE: () => new PokemonReviveReward("modifierType:ModifierType.REVIVE", "revive", 50),
  MAX_REVIVE: () => new PokemonReviveReward("modifierType:ModifierType.MAX_REVIVE", "max_revive", 100),

  FULL_HEAL: () => new PokemonStatusHealReward("modifierType:ModifierType.FULL_HEAL", "full_heal"),

  ETHER: () => new PokemonPpRestoreReward("modifierType:ModifierType.ETHER", "ether", 10),
  MAX_ETHER: () => new PokemonPpRestoreReward("modifierType:ModifierType.MAX_ETHER", "max_ether", -1),

  ELIXIR: () => new PokemonAllMovePpRestoreReward("modifierType:ModifierType.ELIXIR", "elixir", 10),
  MAX_ELIXIR: () => new PokemonAllMovePpRestoreReward("modifierType:ModifierType.MAX_ELIXIR", "max_elixir", -1),

  PP_UP: () => new PokemonPpUpReward("modifierType:ModifierType.PP_UP", "pp_up", 1),
  PP_MAX: () => new PokemonPpUpReward("modifierType:ModifierType.PP_MAX", "pp_max", 3),

  /*REPEL: () => new DoubleBattleChanceBoosterReward('Repel', 5),
  SUPER_REPEL: () => new DoubleBattleChanceBoosterReward('Super Repel', 10),
  MAX_REPEL: () => new DoubleBattleChanceBoosterReward('Max Repel', 25),*/

  MINT: () =>
    new RewardGenerator((_party: Pokemon[], pregenArgs?: any[]) => {
      if (pregenArgs && pregenArgs.length === 1 && pregenArgs[0] in Nature) {
        return new PokemonNatureChangeReward(pregenArgs[0] as Nature);
      }
      return new PokemonNatureChangeReward(randSeedInt(getEnumValues(Nature).length) as Nature);
    }),

  TERA_SHARD: () =>
    new RewardGenerator((party: Pokemon[], pregenArgs?: any[]) => {
      if (pregenArgs && pregenArgs.length === 1 && pregenArgs[0] in PokemonType) {
        return new TerastallizeReward(pregenArgs[0] as PokemonType);
      }
      if (!globalScene.trainerItems.hasItem(TrainerItemId.TERA_ORB)) {
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
      return new TerastallizeReward(shardType);
    }),

  TM_COMMON: () => new TmRewardGenerator(RewardTier.COMMON),
  TM_GREAT: () => new TmRewardGenerator(RewardTier.GREAT),
  TM_ULTRA: () => new TmRewardGenerator(RewardTier.ULTRA),

  MEMORY_MUSHROOM: () => new RememberMoveReward("modifierType:ModifierType.MEMORY_MUSHROOM", "big_mushroom"),

  DNA_SPLICERS: () => new FusePokemonReward("modifierType:ModifierType.DNA_SPLICERS", "dna_splicers"),

  // Held items
  FORM_CHANGE_ITEM: () => new FormChangeItemRewardGenerator(false),
  RARE_FORM_CHANGE_ITEM: () => new FormChangeItemRewardGenerator(true),

  REVIVER_SEED: () => new HeldItemReward(HeldItemId.REVIVER_SEED),

  WHITE_HERB: () => new HeldItemReward(HeldItemId.WHITE_HERB),

  SPECIES_STAT_BOOSTER: () => new SpeciesStatBoosterRewardGenerator(false),
  RARE_SPECIES_STAT_BOOSTER: () => new SpeciesStatBoosterRewardGenerator(true),

  BASE_STAT_BOOSTER: () => new BaseStatBoosterRewardGenerator(),

  ATTACK_TYPE_BOOSTER: () => new AttackTypeBoosterRewardGenerator(),

  MYSTICAL_ROCK: () => new HeldItemReward(HeldItemId.MYSTICAL_ROCK),

  BERRY: () => new BerryRewardGenerator(),

  LUCKY_EGG: () => new HeldItemReward(HeldItemId.LUCKY_EGG),
  GOLDEN_EGG: () => new HeldItemReward(HeldItemId.GOLDEN_EGG),

  SOOTHE_BELL: () => new HeldItemReward(HeldItemId.SOOTHE_BELL),

  SCOPE_LENS: () => new HeldItemReward(HeldItemId.SCOPE_LENS),
  LEEK: () => new HeldItemReward(HeldItemId.LEEK),

  EVIOLITE: () => new HeldItemReward(HeldItemId.EVIOLITE),

  SOUL_DEW: () => new HeldItemReward(HeldItemId.SOUL_DEW),

  GOLDEN_PUNCH: () => new HeldItemReward(HeldItemId.GOLDEN_PUNCH),

  GRIP_CLAW: () => new HeldItemReward(HeldItemId.GRIP_CLAW),
  WIDE_LENS: () => new HeldItemReward(HeldItemId.WIDE_LENS),

  MULTI_LENS: () => new HeldItemReward(HeldItemId.MULTI_LENS),

  FOCUS_BAND: () => new HeldItemReward(HeldItemId.FOCUS_BAND),

  QUICK_CLAW: () => new HeldItemReward(HeldItemId.QUICK_CLAW),

  KINGS_ROCK: () => new HeldItemReward(HeldItemId.KINGS_ROCK),

  LEFTOVERS: () => new HeldItemReward(HeldItemId.LEFTOVERS),

  SHELL_BELL: () => new HeldItemReward(HeldItemId.SHELL_BELL),

  TOXIC_ORB: () => new HeldItemReward(HeldItemId.TOXIC_ORB),

  FLAME_ORB: () => new HeldItemReward(HeldItemId.FLAME_ORB),

  BATON: () => new HeldItemReward(HeldItemId.BATON),

  MINI_BLACK_HOLE: () => new HeldItemReward(HeldItemId.MINI_BLACK_HOLE),

  // Trainer items
  MEGA_BRACELET: () => new TrainerItemReward(TrainerItemId.MEGA_BRACELET),
  DYNAMAX_BAND: () => new TrainerItemReward(TrainerItemId.DYNAMAX_BAND),
  TERA_ORB: () => new TrainerItemReward(TrainerItemId.TERA_ORB),

  MAP: () => new TrainerItemReward(TrainerItemId.MAP),

  LURE: () => new LapsingTrainerItemReward(TrainerItemId.LURE),
  SUPER_LURE: () => new LapsingTrainerItemReward(TrainerItemId.SUPER_LURE),
  MAX_LURE: () => new LapsingTrainerItemReward(TrainerItemId.MAX_LURE),

  TEMP_STAT_STAGE_BOOSTER: () => new TempStatStageBoosterRewardGenerator(),

  DIRE_HIT: () => new LapsingTrainerItemReward(TrainerItemId.DIRE_HIT),

  EXP_SHARE: () => new TrainerItemReward(TrainerItemId.EXP_SHARE),
  EXP_BALANCE: () => new TrainerItemReward(TrainerItemId.EXP_BALANCE),

  OVAL_CHARM: () => new TrainerItemReward(TrainerItemId.OVAL_CHARM),

  EXP_CHARM: () => new TrainerItemReward(TrainerItemId.EXP_CHARM),
  SUPER_EXP_CHARM: () => new TrainerItemReward(TrainerItemId.SUPER_EXP_CHARM),

  AMULET_COIN: () => new TrainerItemReward(TrainerItemId.AMULET_COIN),

  LOCK_CAPSULE: () => new TrainerItemReward(TrainerItemId.LOCK_CAPSULE),

  HEALING_CHARM: () => new TrainerItemReward(TrainerItemId.HEALING_CHARM),
  CANDY_JAR: () => new TrainerItemReward(TrainerItemId.CANDY_JAR),

  BERRY_POUCH: () => new TrainerItemReward(TrainerItemId.BERRY_POUCH),

  SHINY_CHARM: () => new TrainerItemReward(TrainerItemId.SHINY_CHARM),
  ABILITY_CHARM: () => new TrainerItemReward(TrainerItemId.ABILITY_CHARM),
  CATCHING_CHARM: () => new TrainerItemReward(TrainerItemId.CATCHING_CHARM),

  IV_SCANNER: () => new TrainerItemReward(TrainerItemId.IV_SCANNER),

  GOLDEN_POKEBALL: () => new TrainerItemReward(TrainerItemId.GOLDEN_POKEBALL),

  // Tokens //TODO: do we even need them here?
  ENEMY_DAMAGE_BOOSTER: () => new TrainerItemReward(TrainerItemId.ENEMY_DAMAGE_BOOSTER),
  ENEMY_DAMAGE_REDUCTION: () => new TrainerItemReward(TrainerItemId.ENEMY_DAMAGE_REDUCTION),
  //ENEMY_SUPER_EFFECT_BOOSTER: () => new Reward('Type Advantage Token', 'Increases damage of super effective attacks by 30%', (type, _args) => new EnemySuperEffectiveDamageBoosterModifier(type, 30), 'wl_custom_super_effective'),
  ENEMY_HEAL: () => new TrainerItemReward(TrainerItemId.ENEMY_HEAL),
  ENEMY_ATTACK_POISON_CHANCE: () => new TrainerItemReward(TrainerItemId.ENEMY_ATTACK_POISON_CHANCE),
  ENEMY_ATTACK_PARALYZE_CHANCE: () => new TrainerItemReward(TrainerItemId.ENEMY_ATTACK_PARALYZE_CHANCE),
  ENEMY_ATTACK_BURN_CHANCE: () => new TrainerItemReward(TrainerItemId.ENEMY_ATTACK_BURN_CHANCE),
  ENEMY_STATUS_EFFECT_HEAL_CHANCE: () => new TrainerItemReward(TrainerItemId.ENEMY_STATUS_EFFECT_HEAL_CHANCE),
  ENEMY_ENDURE_CHANCE: () => new TrainerItemReward(TrainerItemId.ENEMY_ENDURE_CHANCE),
  ENEMY_FUSED_CHANCE: () => new TrainerItemReward(TrainerItemId.ENEMY_FUSED_CHANCE),

  // Items from mystery encounters
  MYSTERY_ENCOUNTER_SHUCKLE_JUICE_GOOD: () => new HeldItemReward(HeldItemId.SHUCKLE_JUICE_GOOD),
  MYSTERY_ENCOUNTER_SHUCKLE_JUICE_BAD: () => new HeldItemReward(HeldItemId.SHUCKLE_JUICE_BAD),

  MYSTERY_ENCOUNTER_OLD_GATEAU: () => new HeldItemReward(HeldItemId.OLD_GATEAU),

  MYSTERY_ENCOUNTER_BLACK_SLUDGE: () => new TrainerItemReward(TrainerItemId.BLACK_SLUDGE),

  MYSTERY_ENCOUNTER_MACHO_BRACE: () => new HeldItemReward(HeldItemId.MACHO_BRACE),

  MYSTERY_ENCOUNTER_GOLDEN_BUG_NET: () => new TrainerItemReward(TrainerItemId.GOLDEN_BUG_NET),
});

/**
 * The initial set of modifier types, used to generate the modifier pool.
 */
export type Rewards = typeof rewardInitObj;

export interface RewardPool {
  [tier: string]: WeightedReward[];
}

let rewardPoolThresholds = {};
let ignoredPoolIndexes = {};

/**
 * Allows a unit test to check if an item exists in the Consumable Pool. Checks the pool directly, rather than attempting to reroll for the item.
 */
export const itemPoolChecks: Map<RewardKeys, boolean | undefined> = new Map();

export function regenerateRewardPoolThresholds(party: Pokemon[], poolType: RewardPoolType, rerollCount = 0) {
  const pool = getRewardPoolForType(poolType);
  itemPoolChecks.forEach((_v, k) => {
    itemPoolChecks.set(k, false);
  });

  const ignoredIndexes = {};
  const thresholds = Object.fromEntries(
    new Map(
      Object.keys(pool).map(t => {
        ignoredIndexes[t] = [];
        const thresholds = new Map();
        const tierModifierIds: string[] = [];
        let i = 0;
        pool[t].reduce((total: number, reward: WeightedReward) => {
          const weightedReward = reward as WeightedReward;
          const itemReward =
            weightedReward.reward instanceof RewardGenerator
              ? weightedReward.reward.generateReward(party)
              : weightedReward.reward;
          const trainerItemfullStack =
            itemReward instanceof TrainerItemReward ? globalScene.trainerItems.isMaxStack(itemReward.itemId) : false;
          const weight =
            !trainerItemfullStack || itemReward instanceof HeldItemReward || itemReward instanceof FormChangeItemReward
              ? weightedReward.weight instanceof Function
                ? // biome-ignore lint/complexity/noBannedTypes: TODO: refactor to not use Function type
                  (weightedReward.weight as Function)(party, rerollCount)
                : (weightedReward.weight as number)
              : 0;
          if (weightedReward.maxWeight) {
            const rewardId = weightedReward.reward.id;
            tierModifierIds.push(rewardId);
          }
          if (weight) {
            total += weight;
          } else {
            ignoredIndexes[t].push(i++);
            return total;
          }
          if (itemPoolChecks.has(reward.reward.id as RewardKeys)) {
            itemPoolChecks.set(reward.reward.id as RewardKeys, true);
          }
          thresholds.set(total, i++);
          return total;
        }, 0);
        return [t, Object.fromEntries(thresholds)];
      }),
    ),
  );
  switch (poolType) {
    case RewardPoolType.PLAYER:
      rewardPoolThresholds = thresholds;
      ignoredPoolIndexes = ignoredIndexes;
      break;
  }
}

export interface CustomRewardSettings {
  guaranteedRewardTiers?: RewardTier[];
  guaranteedRewardOptions?: RewardOption[];
  /** If specified, will override the next X items to be auto-generated from specific modifier functions (these don't have to be pre-genned). */
  guaranteedRewardFuncs?: RewardFunc[];
  /**
   * If set to `true`, will fill the remainder of shop items that were not overridden by the 3 options above, up to the `count` param value.
   * @example
   * ```ts
   * count = 4;
   * customRewardSettings = { guaranteedRewardTiers: [RewardTier.GREAT], fillRemaining: true };
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

export function getRewardFuncById(id: string): RewardFunc {
  return rewardInitObj[id];
}

/**
 * Generates modifier options for a {@linkcode SelectRewardPhase}
 * @param count - Determines the number of items to generate
 * @param party - Party is required for generating proper modifier pools
 * @param rewardTiers - (Optional) If specified, rolls items in the specified tiers. Commonly used for tier-locking with Lock Capsule.
 * @param customRewardSettings - See {@linkcode CustomRewardSettings}
 */
export function getPlayerRewardOptions(
  count: number,
  party: PlayerPokemon[],
  rewardTiers?: RewardTier[],
  customRewardSettings?: CustomRewardSettings,
): RewardOption[] {
  const options: RewardOption[] = [];
  const retryCount = Math.min(count * 5, 50);
  if (!customRewardSettings) {
    for (let i = 0; i < count; i++) {
      const tier = rewardTiers && rewardTiers.length > i ? rewardTiers[i] : undefined;
      options.push(getRewardOptionWithRetry(options, retryCount, party, tier));
    }
  } else {
    // Guaranteed mod options first
    if (customRewardSettings?.guaranteedRewardOptions && customRewardSettings.guaranteedRewardOptions.length > 0) {
      options.push(...customRewardSettings.guaranteedRewardOptions!);
    }

    // Guaranteed mod functions second
    if (customRewardSettings.guaranteedRewardFuncs && customRewardSettings.guaranteedRewardFuncs.length > 0) {
      customRewardSettings.guaranteedRewardFuncs!.forEach((mod, _i) => {
        const rewardId = Object.keys(rewardInitObj).find(k => rewardInitObj[k] === mod) as string;
        let guaranteedMod: Reward = rewardInitObj[rewardId]?.();

        // Populates item id and tier
        guaranteedMod = guaranteedMod.withTierFromPool(RewardPoolType.PLAYER, party);

        const modType = guaranteedMod instanceof RewardGenerator ? guaranteedMod.generateReward(party) : guaranteedMod;
        if (modType) {
          const option = new RewardOption(modType, 0);
          options.push(option);
        }
      });
    }

    // Guaranteed tiers third
    if (customRewardSettings.guaranteedRewardTiers && customRewardSettings.guaranteedRewardTiers.length > 0) {
      const allowLuckUpgrades = customRewardSettings.allowLuckUpgrades ?? true;
      for (const tier of customRewardSettings.guaranteedRewardTiers) {
        options.push(getRewardOptionWithRetry(options, retryCount, party, tier, allowLuckUpgrades));
      }
    }

    // Fill remaining
    if (options.length < count && customRewardSettings.fillRemaining) {
      while (options.length < count) {
        options.push(getRewardOptionWithRetry(options, retryCount, party, undefined));
      }
    }
  }

  overridePlayerRewardOptions(options, party);

  return options;
}

/**
 * Will generate a {@linkcode Reward} from the {@linkcode RewardPoolType.PLAYER} pool, attempting to retry duplicated items up to retryCount
 * @param existingOptions Currently generated options
 * @param retryCount How many times to retry before allowing a dupe item
 * @param party Current player party, used to calculate items in the pool
 * @param tier If specified will generate item of tier
 * @param allowLuckUpgrades `true` to allow items to upgrade tiers (the little animation that plays and is affected by luck)
 */
function getRewardOptionWithRetry(
  existingOptions: RewardOption[],
  retryCount: number,
  party: PlayerPokemon[],
  tier?: RewardTier,
  allowLuckUpgrades?: boolean,
): RewardOption {
  allowLuckUpgrades = allowLuckUpgrades ?? true;
  let candidate = getNewRewardOption(party, RewardPoolType.PLAYER, tier, undefined, 0, allowLuckUpgrades);
  let r = 0;
  while (
    existingOptions.length &&
    ++r < retryCount &&
    existingOptions.filter(o => o.type.name === candidate?.type.name || o.type.group === candidate?.type.group).length
  ) {
    console.log("Retry count:", r);
    console.log(candidate?.type.group);
    console.log(candidate?.type.name);
    console.log(existingOptions.filter(o => o.type.name === candidate?.type.name).length);
    console.log(existingOptions.filter(o => o.type.group === candidate?.type.group).length);
    candidate = getNewRewardOption(
      party,
      RewardPoolType.PLAYER,
      candidate?.type.tier ?? tier,
      candidate?.upgradeCount,
      0,
      allowLuckUpgrades,
    );
  }
  return candidate!;
}

/**
 * Replaces the {@linkcode Reward} of the entries within {@linkcode options} with any
 * {@linkcode RewardOverride} entries listed in {@linkcode Overrides.ITEM_REWARD_OVERRIDE}
 * up to the smallest amount of entries between {@linkcode options} and the override array.
 * @param options Array of naturally rolled {@linkcode RewardOption}s
 * @param party Array of the player's current party
 */
export function overridePlayerRewardOptions(options: RewardOption[], party: PlayerPokemon[]) {
  const minLength = Math.min(options.length, Overrides.ITEM_REWARD_OVERRIDE.length);
  for (let i = 0; i < minLength; i++) {
    const override: RewardOverride = Overrides.ITEM_REWARD_OVERRIDE[i];
    const rewardFunc = rewardInitObj[override.name];
    let reward: Reward | null = rewardFunc();

    if (reward instanceof RewardGenerator) {
      const pregenArgs = "type" in override && override.type !== null ? [override.type] : undefined;
      reward = reward.generateReward(party, pregenArgs);
    }

    if (reward) {
      options[i].type = reward.withTierFromPool(RewardPoolType.PLAYER, party);
    }
  }
}

export function getPlayerShopRewardOptionsForWave(waveIndex: number, baseCost: number): RewardOption[] {
  if (!(waveIndex % 10)) {
    return [];
  }

  const options = [
    [
      new RewardOption(rewardInitObj.POTION(), 0, baseCost * 0.2),
      new RewardOption(rewardInitObj.ETHER(), 0, baseCost * 0.4),
      new RewardOption(rewardInitObj.REVIVE(), 0, baseCost * 2),
    ],
    [
      new RewardOption(rewardInitObj.SUPER_POTION(), 0, baseCost * 0.45),
      new RewardOption(rewardInitObj.FULL_HEAL(), 0, baseCost),
    ],
    [new RewardOption(rewardInitObj.ELIXIR(), 0, baseCost), new RewardOption(rewardInitObj.MAX_ETHER(), 0, baseCost)],
    [
      new RewardOption(rewardInitObj.HYPER_POTION(), 0, baseCost * 0.8),
      new RewardOption(rewardInitObj.MAX_REVIVE(), 0, baseCost * 2.75),
      new RewardOption(rewardInitObj.MEMORY_MUSHROOM(), 0, baseCost * 4),
    ],
    [
      new RewardOption(rewardInitObj.MAX_POTION(), 0, baseCost * 1.5),
      new RewardOption(rewardInitObj.MAX_ELIXIR(), 0, baseCost * 2.5),
    ],
    [new RewardOption(rewardInitObj.FULL_RESTORE(), 0, baseCost * 2.25)],
    [new RewardOption(rewardInitObj.SACRED_ASH(), 0, baseCost * 10)],
  ];
  return options.slice(0, Math.ceil(Math.max(waveIndex + 10, 0) / 30)).flat();
}

/**
 * Generates a Reward from the specified pool
 * @param party party of the trainer using the item
 * @param poolType PLAYER/WILD/TRAINER
 * @param tier If specified, will override the initial tier of an item (can still upgrade with luck)
 * @param upgradeCount If defined, means that this is a new Reward being generated to override another via luck upgrade. Used for recursive logic
 * @param retryCount Max allowed tries before the next tier down is checked for a valid Reward
 * @param allowLuckUpgrades Default true. If false, will not allow Reward to randomly upgrade to next tier
 */
function getNewRewardOption(
  party: Pokemon[],
  poolType: RewardPoolType,
  baseTier?: RewardTier,
  upgradeCount?: number,
  retryCount = 0,
  allowLuckUpgrades = true,
): RewardOption | null {
  const player = !poolType;
  const pool = getRewardPoolForType(poolType);
  const thresholds = getPoolThresholds(poolType);

  let tier = 0;
  if (isNullOrUndefined(baseTier)) {
    baseTier = randomBaseTier();
  }
  if (isNullOrUndefined(upgradeCount)) {
    upgradeCount = allowLuckUpgrades ? getUpgradeCount(party, player, baseTier) : 0;
    tier = baseTier + upgradeCount;
  } else {
    tier = baseTier;
  }

  const tierThresholds = Object.keys(thresholds[tier]);
  const totalWeight = Number.parseInt(tierThresholds[tierThresholds.length - 1]);
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
  let reward: Reward | null = pool[tier][index].reward;
  if (reward instanceof RewardGenerator) {
    reward = (reward as RewardGenerator).generateReward(party);
    if (reward === null) {
      if (player) {
        console.log(RewardTier[tier], upgradeCount);
      }
      return getNewRewardOption(party, poolType, tier, upgradeCount, ++retryCount);
    }
  }

  console.log(reward, !player ? "(enemy)" : "");

  return new RewardOption(reward as Reward, upgradeCount!); // TODO: is this bang correct?
}

function getPoolThresholds(poolType: RewardPoolType) {
  let thresholds: object;
  switch (poolType) {
    case RewardPoolType.PLAYER:
      thresholds = rewardPoolThresholds;
      break;
  }
  return thresholds;
}

function randomBaseTier(): RewardTier {
  const tierValue = randSeedInt(1024);

  if (tierValue > 255) {
    return RewardTier.COMMON;
  }
  if (tierValue > 60) {
    return RewardTier.GREAT;
  }
  if (tierValue > 12) {
    return RewardTier.ULTRA;
  }
  if (tierValue) {
    return RewardTier.ROGUE;
  }
  return RewardTier.MASTER;
}

function getUpgradeCount(
  party: Pokemon[],
  player: boolean,
  baseTier: RewardTier,
  allowLuckUpgrades = true,
): RewardTier {
  const pool = getRewardPoolForType(RewardPoolType.PLAYER);
  let upgradeCount = 0;
  if (player) {
    if (baseTier < RewardTier.MASTER && allowLuckUpgrades) {
      const partyLuckValue = getPartyLuckValue(party);
      const upgradeOdds = Math.floor(128 / ((partyLuckValue + 4) / 4));
      while (pool.hasOwnProperty(baseTier + upgradeCount + 1) && pool[baseTier + upgradeCount + 1].length) {
        if (randSeedInt(upgradeOdds) < 4) {
          upgradeCount++;
        } else {
          break;
        }
      }
    }
  }
  return upgradeCount;
}

export function getDefaultRewardForTier(tier: RewardTier): Reward {
  const rewardPool = getRewardPoolForType(RewardPoolType.PLAYER);
  let reward: Reward | WeightedReward = rewardPool[tier || RewardTier.COMMON][0];
  if (reward instanceof WeightedReward) {
    reward = (reward as WeightedReward).reward;
  }
  return reward;
}

export class RewardOption {
  public type: Reward;
  public upgradeCount: number;
  public cost: number;

  constructor(type: Reward, upgradeCount: number, cost = 0) {
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
  let rewardTier: RewardTier;
  if (luckValue > 11) {
    rewardTier = RewardTier.LUXURY;
  } else if (luckValue > 9) {
    rewardTier = RewardTier.MASTER;
  } else if (luckValue > 5) {
    rewardTier = RewardTier.ROGUE;
  } else if (luckValue > 2) {
    rewardTier = RewardTier.ULTRA;
  } else if (luckValue) {
    rewardTier = RewardTier.GREAT;
  } else {
    rewardTier = RewardTier.COMMON;
  }
  return getRewardTierTextTint(rewardTier);
}

export function initRewards() {
  for (const [key, value] of Object.entries(rewardInitObj)) {
    allRewards[key] = value;
  }
}

// TODO: If necessary, add the rest of the modifier types here.
// For now, doing the minimal work until the modifier rework lands.
const RewardConstructorMap = Object.freeze({
  RewardGenerator,
});

/**
 * Map of of modifier type strings to their constructor type
 */
export type RewardConstructorMap = typeof RewardConstructorMap;

/**
 * Map of modifier type strings to their instance type
 */
export type RewardInstanceMap = {
  [K in keyof RewardConstructorMap]: InstanceType<RewardConstructorMap[K]>;
};

export type RewardString = keyof RewardConstructorMap;
