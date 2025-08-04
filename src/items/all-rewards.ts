import { allRewards } from "#data/data-lists";
import { PokeballType } from "#enums/pokeball";
import { RewardId } from "#enums/reward-id";
import { RarityTier } from "#enums/reward-tier";
import { TrainerItemId } from "#enums/trainer-item-id";
import { VoucherType } from "#system/voucher";
import {
  AddMoneyReward,
  AddPokeballReward,
  AddVoucherReward,
  AllPokemonFullReviveReward,
  AllPokemonLevelIncrementReward,
  AttackTypeBoosterRewardGenerator,
  BaseStatBoosterRewardGenerator,
  BerryRewardGenerator,
  EvolutionItemRewardGenerator,
  FormChangeItemRewardGenerator,
  FusePokemonReward,
  LapsingTrainerItemReward,
  MintRewardGenerator,
  PokemonAllMovePpRestoreReward,
  PokemonHpRestoreReward,
  PokemonLevelIncrementReward,
  PokemonPpRestoreReward,
  PokemonPpUpReward,
  PokemonReviveReward,
  PokemonStatusHealReward,
  RememberMoveReward,
  SpeciesStatBoosterRewardGenerator,
  TempStatStageBoosterRewardGenerator,
  TeraTypeRewardGenerator,
  TmRewardGenerator,
} from "./reward";

export function initRewards() {
  // Pokeball rewards
  allRewards[RewardId.POKEBALL] = () => new AddPokeballReward("pb", PokeballType.POKEBALL, 5, RewardId.POKEBALL);
  allRewards[RewardId.GREAT_BALL] = () => new AddPokeballReward("gb", PokeballType.GREAT_BALL, 5, RewardId.GREAT_BALL);
  allRewards[RewardId.ULTRA_BALL] = () => new AddPokeballReward("ub", PokeballType.ULTRA_BALL, 5, RewardId.ULTRA_BALL);
  allRewards[RewardId.ROGUE_BALL] = () => new AddPokeballReward("rb", PokeballType.ROGUE_BALL, 5, RewardId.ROGUE_BALL);
  allRewards[RewardId.MASTER_BALL] = () =>
    new AddPokeballReward("mb", PokeballType.MASTER_BALL, 1, RewardId.MASTER_BALL);

  // Voucher rewards
  allRewards[RewardId.VOUCHER] = () => new AddVoucherReward(VoucherType.REGULAR, 1, RewardId.VOUCHER);
  allRewards[RewardId.VOUCHER_PLUS] = () => new AddVoucherReward(VoucherType.PLUS, 1, RewardId.VOUCHER_PLUS);
  allRewards[RewardId.VOUCHER_PREMIUM] = () => new AddVoucherReward(VoucherType.PREMIUM, 1, RewardId.VOUCHER_PREMIUM);

  // Money rewards
  allRewards[RewardId.NUGGET] = () =>
    new AddMoneyReward(
      "modifierType:ModifierType.NUGGET",
      "nugget",
      1,
      "modifierType:ModifierType.MoneyRewardModifierType.extra.small",
      RewardId.NUGGET,
    );
  allRewards[RewardId.BIG_NUGGET] = () =>
    new AddMoneyReward(
      "modifierType:ModifierType.BIG_NUGGET",
      "big_nugget",
      2.5,
      "modifierType:ModifierType.MoneyRewardModifierType.extra.moderate",
      RewardId.BIG_NUGGET,
    );
  allRewards[RewardId.RELIC_GOLD] = () =>
    new AddMoneyReward(
      "modifierType:ModifierType.RELIC_GOLD",
      "relic_gold",
      10,
      "modifierType:ModifierType.MoneyRewardModifierType.extra.large",
      RewardId.RELIC_GOLD,
    );

  // Party-wide consumables
  allRewards[RewardId.RARER_CANDY] = () =>
    new AllPokemonLevelIncrementReward("modifierType:ModifierType.RARER_CANDY", "rarer_candy");
  allRewards[RewardId.SACRED_ASH] = () =>
    new AllPokemonFullReviveReward("modifierType:ModifierType.SACRED_ASH", "sacred_ash");

  // Pokemon consumables
  allRewards[RewardId.RARE_CANDY] = () =>
    new PokemonLevelIncrementReward("modifierType:ModifierType.RARE_CANDY", "rare_candy");

  allRewards[RewardId.EVOLUTION_ITEM] = () => new EvolutionItemRewardGenerator(false, RewardId.EVOLUTION_ITEM);
  allRewards[RewardId.RARE_EVOLUTION_ITEM] = () => new EvolutionItemRewardGenerator(true, RewardId.RARE_EVOLUTION_ITEM);

  allRewards[RewardId.POTION] = () =>
    new PokemonHpRestoreReward("modifierType:ModifierType.POTION", "potion", RewardId.POTION, 20, 10);
  allRewards[RewardId.SUPER_POTION] = () =>
    new PokemonHpRestoreReward("modifierType:ModifierType.SUPER_POTION", "super_potion", RewardId.SUPER_POTION, 50, 25);
  allRewards[RewardId.HYPER_POTION] = () =>
    new PokemonHpRestoreReward(
      "modifierType:ModifierType.HYPER_POTION",
      "hyper_potion",
      RewardId.HYPER_POTION,
      200,
      50,
    );
  allRewards[RewardId.MAX_POTION] = () =>
    new PokemonHpRestoreReward("modifierType:ModifierType.MAX_POTION", "max_potion", RewardId.MAX_POTION, 0, 100);
  allRewards[RewardId.FULL_RESTORE] = () =>
    new PokemonHpRestoreReward(
      "modifierType:ModifierType.FULL_RESTORE",
      "full_restore",
      RewardId.FULL_RESTORE,
      0,
      100,
      true,
    );

  allRewards[RewardId.REVIVE] = () =>
    new PokemonReviveReward("modifierType:ModifierType.REVIVE", "revive", RewardId.REVIVE, 50);
  allRewards[RewardId.MAX_REVIVE] = () =>
    new PokemonReviveReward("modifierType:ModifierType.MAX_REVIVE", "max_revive", RewardId.MAX_REVIVE, 100);

  allRewards[RewardId.FULL_HEAL] = () =>
    new PokemonStatusHealReward("modifierType:ModifierType.FULL_HEAL", "full_heal");

  allRewards[RewardId.ETHER] = () =>
    new PokemonPpRestoreReward("modifierType:ModifierType.ETHER", "ether", RewardId.ETHER, 10);
  allRewards[RewardId.MAX_ETHER] = () =>
    new PokemonPpRestoreReward("modifierType:ModifierType.MAX_ETHER", "max_ether", RewardId.MAX_ETHER, -1);

  allRewards[RewardId.ELIXIR] = () =>
    new PokemonAllMovePpRestoreReward("modifierType:ModifierType.ELIXIR", "elixir", RewardId.ELIXIR, 10);
  allRewards[RewardId.MAX_ELIXIR] = () =>
    new PokemonAllMovePpRestoreReward("modifierType:ModifierType.MAX_ELIXIR", "max_elixir", RewardId.MAX_ELIXIR, -1);

  allRewards[RewardId.PP_UP] = () =>
    new PokemonPpUpReward("modifierType:ModifierType.PP_UP", "pp_up", RewardId.PP_UP, 1);
  allRewards[RewardId.PP_MAX] = () =>
    new PokemonPpUpReward("modifierType:ModifierType.PP_MAX", "pp_max", RewardId.PP_MAX, 3);

  /*
  REPEL] = () => new DoubleBattleChanceBoosterReward('Repel', 5),
  SUPER_REPEL] = () => new DoubleBattleChanceBoosterReward('Super Repel', 10),
  MAX_REPEL] = () => new DoubleBattleChanceBoosterReward('Max Repel', 25),*/

  allRewards[RewardId.MINT] = () => new MintRewardGenerator();

  allRewards[RewardId.TERA_SHARD] = () => new TeraTypeRewardGenerator();

  allRewards[RewardId.TM_COMMON] = () => new TmRewardGenerator(RarityTier.COMMON);
  allRewards[RewardId.TM_GREAT] = () => new TmRewardGenerator(RarityTier.GREAT);
  allRewards[RewardId.TM_ULTRA] = () => new TmRewardGenerator(RarityTier.ULTRA);

  allRewards[RewardId.MEMORY_MUSHROOM] = () =>
    new RememberMoveReward("modifierType:ModifierType.MEMORY_MUSHROOM", "big_mushroom");

  allRewards[RewardId.DNA_SPLICERS] = () =>
    new FusePokemonReward("modifierType:ModifierType.DNA_SPLICERS", "dna_splicers");

  // Form change items
  allRewards[RewardId.FORM_CHANGE_ITEM] = () => new FormChangeItemRewardGenerator(false, RewardId.FORM_CHANGE_ITEM);
  allRewards[RewardId.RARE_FORM_CHANGE_ITEM] = () =>
    new FormChangeItemRewardGenerator(true, RewardId.RARE_FORM_CHANGE_ITEM);

  // Held items

  allRewards[RewardId.SPECIES_STAT_BOOSTER] = () => new SpeciesStatBoosterRewardGenerator(false);
  allRewards[RewardId.RARE_SPECIES_STAT_BOOSTER] = () => new SpeciesStatBoosterRewardGenerator(true);

  allRewards[RewardId.BASE_STAT_BOOSTER] = () => new BaseStatBoosterRewardGenerator();

  allRewards[RewardId.ATTACK_TYPE_BOOSTER] = () => new AttackTypeBoosterRewardGenerator();

  allRewards[RewardId.BERRY] = () => new BerryRewardGenerator();

  //  MINI_BLACK_HOLE] = () => new HeldItemReward(HeldItemId.MINI_BLACK_HOLE),

  // Trainer items

  allRewards[RewardId.LURE] = () => new LapsingTrainerItemReward(TrainerItemId.LURE, RewardId.LURE);
  allRewards[RewardId.SUPER_LURE] = () => new LapsingTrainerItemReward(TrainerItemId.SUPER_LURE, RewardId.SUPER_LURE);
  allRewards[RewardId.MAX_LURE] = () => new LapsingTrainerItemReward(TrainerItemId.MAX_LURE, RewardId.MAX_LURE);

  allRewards[RewardId.TEMP_STAT_STAGE_BOOSTER] = () => new TempStatStageBoosterRewardGenerator();

  allRewards[RewardId.DIRE_HIT] = () =>
    new LapsingTrainerItemReward(TrainerItemId.DIRE_HIT, RewardId.TEMP_STAT_STAGE_BOOSTER);
  //  GOLDEN_POKEBALL] = () => new TrainerItemReward(TrainerItemId.GOLDEN_POKEBALL),
}
