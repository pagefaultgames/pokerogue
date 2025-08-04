import type { RewardId } from "#enums/reward-id";
import type {
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
} from "#items/reward";

/**
 * The type of the `allRewards` const object.
 * @todo Make `allRewards` a const object and replace all references to this with `typeof allRewards`
 */
export type allRewardsType = {
  // Pokeball rewards
  [RewardId.POKEBALL]: () => AddPokeballReward;
  [RewardId.GREAT_BALL]: () => AddPokeballReward;
  [RewardId.ULTRA_BALL]: () => AddPokeballReward;
  [RewardId.ROGUE_BALL]: () => AddPokeballReward;
  [RewardId.MASTER_BALL]: () => AddPokeballReward;

  // Voucher rewards
  [RewardId.VOUCHER]: () => AddVoucherReward;
  [RewardId.VOUCHER_PLUS]: () => AddVoucherReward;
  [RewardId.VOUCHER_PREMIUM]: () => AddVoucherReward;

  // Money rewards
  [RewardId.NUGGET]: () => AddMoneyReward;
  [RewardId.BIG_NUGGET]: () => AddMoneyReward;
  [RewardId.RELIC_GOLD]: () => AddMoneyReward;

  // Party-wide consumables
  [RewardId.RARER_CANDY]: () => AllPokemonLevelIncrementReward;
  [RewardId.SACRED_ASH]: () => AllPokemonFullReviveReward;

  // Pokemon consumables
  [RewardId.RARE_CANDY]: () => PokemonLevelIncrementReward;

  [RewardId.EVOLUTION_ITEM]: () => EvolutionItemRewardGenerator;
  [RewardId.RARE_EVOLUTION_ITEM]: () => EvolutionItemRewardGenerator;

  [RewardId.POTION]: () => PokemonHpRestoreReward;
  [RewardId.SUPER_POTION]: () => PokemonHpRestoreReward;
  [RewardId.HYPER_POTION]: () => PokemonHpRestoreReward;
  [RewardId.MAX_POTION]: () => PokemonHpRestoreReward;
  [RewardId.FULL_RESTORE]: () => PokemonHpRestoreReward;

  [RewardId.REVIVE]: () => PokemonReviveReward;
  [RewardId.MAX_REVIVE]: () => PokemonReviveReward;

  [RewardId.FULL_HEAL]: () => PokemonStatusHealReward;

  [RewardId.ETHER]: () => PokemonPpRestoreReward;
  [RewardId.MAX_ETHER]: () => PokemonPpRestoreReward;

  [RewardId.ELIXIR]: () => PokemonAllMovePpRestoreReward;
  [RewardId.MAX_ELIXIR]: () => PokemonAllMovePpRestoreReward;

  [RewardId.PP_UP]: () => PokemonPpUpReward;
  [RewardId.PP_MAX]: () => PokemonPpUpReward;

  /*
  [RewardId.REPEL]: () => DoubleBattleChanceBoosterReward,
  [RewardId.SUPER_REPEL]: () => DoubleBattleChanceBoosterReward,
  [RewardId.MAX_REPEL]: () => DoubleBattleChanceBoosterReward,
  */

  [RewardId.MINT]: () => MintRewardGenerator;

  [RewardId.TERA_SHARD]: () => TeraTypeRewardGenerator;

  [RewardId.TM_COMMON]: () => TmRewardGenerator;
  [RewardId.TM_GREAT]: () => TmRewardGenerator;
  [RewardId.TM_ULTRA]: () => TmRewardGenerator;

  [RewardId.MEMORY_MUSHROOM]: () => RememberMoveReward;

  [RewardId.DNA_SPLICERS]: () => FusePokemonReward;

  // Form change items
  [RewardId.FORM_CHANGE_ITEM]: () => FormChangeItemRewardGenerator;
  [RewardId.RARE_FORM_CHANGE_ITEM]: () => FormChangeItemRewardGenerator;

  // Held items

  [RewardId.SPECIES_STAT_BOOSTER]: () => SpeciesStatBoosterRewardGenerator;
  [RewardId.RARE_SPECIES_STAT_BOOSTER]: () => SpeciesStatBoosterRewardGenerator;

  [RewardId.BASE_STAT_BOOSTER]: () => BaseStatBoosterRewardGenerator;

  [RewardId.ATTACK_TYPE_BOOSTER]: () => AttackTypeBoosterRewardGenerator;

  [RewardId.BERRY]: () => BerryRewardGenerator;

  // [RewardId.MINI_BLACK_HOLE]: () => HeldItemReward,

  // Trainer items

  [RewardId.LURE]: () => LapsingTrainerItemReward;
  [RewardId.SUPER_LURE]: () => LapsingTrainerItemReward;
  [RewardId.MAX_LURE]: () => LapsingTrainerItemReward;

  [RewardId.TEMP_STAT_STAGE_BOOSTER]: () => TempStatStageBoosterRewardGenerator;

  [RewardId.DIRE_HIT]: () => LapsingTrainerItemReward;
  // [RewardId.GOLDEN_POKEBALL]: () => TrainerItemReward,
};
