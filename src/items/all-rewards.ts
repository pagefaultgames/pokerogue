import { RewardId } from "#enums/reward-id";
import { RarityTier } from "#enums/reward-tier";
import { TrainerItemId } from "#enums/trainer-item-id";
import { VoucherType } from "#enums/voucher-type";
import { EmptyReward, type Reward, type RewardGenerator } from "./reward";
import { EvolutionItemRewardGenerator } from "./rewards/evolution-item";
import { FormChangeItemRewardGenerator } from "./rewards/form-change";
import { FusePokemonReward } from "./rewards/fuse";
import {
  AttackTypeBoosterRewardGenerator,
  BaseStatBoosterRewardGenerator,
  BerryRewardGenerator,
} from "./rewards/held-item-reward";
import { AllPokemonLevelIncrementReward, PokemonLevelIncrementReward } from "./rewards/level-increment";
import { AddMoneyReward } from "./rewards/money";
import { MintRewardGenerator } from "./rewards/nature-change";
import { AddPokeballReward } from "./rewards/pokeball";
import { PokemonAllMovePpRestoreReward, PokemonPpRestoreReward } from "./rewards/pp-restore";
import { PokemonPpUpReward } from "./rewards/pp-up";
import { RememberMoveReward } from "./rewards/remember-move";
import { AllPokemonFullReviveReward, PokemonHpRestoreReward, PokemonReviveReward } from "./rewards/restore";
import { SpeciesStatBoosterRewardGenerator } from "./rewards/species-stat-booster";
import { PokemonStatusHealReward } from "./rewards/status-heal";
import { TeraTypeRewardGenerator } from "./rewards/tera-type";
import { TmRewardGenerator } from "./rewards/tm";
import { LapsingTrainerItemReward, TempStatStageBoosterRewardGenerator } from "./rewards/trainer-item-reward";
import { AddVoucherReward } from "./rewards/voucher";

// TODO: Merge with `reward-utils.ts` and possibly remove export
export const allRewards = {
  [RewardId.NONE]: new EmptyReward(),
  [RewardId.GENERIC_HELD_ITEM]: new EmptyReward(),
  [RewardId.GENERIC_TRAINER_ITEM]: new EmptyReward(),

  // Pokeball rewards
  [RewardId.POKEBALL]: new AddPokeballReward(RewardId.POKEBALL, "pb", 5),
  [RewardId.GREAT_BALL]: new AddPokeballReward(RewardId.GREAT_BALL, "gb", 5),
  [RewardId.ULTRA_BALL]: new AddPokeballReward(RewardId.ULTRA_BALL, "ub", 5),
  [RewardId.ROGUE_BALL]: new AddPokeballReward(RewardId.ROGUE_BALL, "rb", 5),
  [RewardId.MASTER_BALL]: new AddPokeballReward(RewardId.MASTER_BALL, "mb", 1),

  // Voucher rewards
  [RewardId.VOUCHER]: new AddVoucherReward(RewardId.VOUCHER, VoucherType.REGULAR, 1),
  [RewardId.VOUCHER_PLUS]: new AddVoucherReward(RewardId.VOUCHER_PLUS, VoucherType.PLUS, 1),
  [RewardId.VOUCHER_PREMIUM]: new AddVoucherReward(RewardId.VOUCHER_PREMIUM, VoucherType.PREMIUM, 1),

  // Money rewards
  [RewardId.NUGGET]: new AddMoneyReward(
    RewardId.NUGGET,
    "reward:nugget",
    "nugget",
    1,
    "reward:moneyReward.extra.small",
  ),
  [RewardId.BIG_NUGGET]: new AddMoneyReward(
    RewardId.BIG_NUGGET,
    "reward:bigNugget",
    "big_nugget",
    2.5,
    "reward:moneyReward.extra.moderate",
  ),
  [RewardId.RELIC_GOLD]: new AddMoneyReward(
    RewardId.RELIC_GOLD,
    "reward:relicGold",
    "relic_gold",
    10,
    "reward:moneyReward.extra.large",
  ),

  // Party-wide consumables
  [RewardId.RARER_CANDY]: new AllPokemonLevelIncrementReward("reward:rarerCandy", "rarer_candy"),
  [RewardId.SACRED_ASH]: new AllPokemonFullReviveReward("reward:sacredAsh", "sacred_ash"),

  // Pokemon consumables
  [RewardId.RARE_CANDY]: new PokemonLevelIncrementReward("reward:rareCandy", "rare_candy"),

  [RewardId.EVOLUTION_ITEM]: new EvolutionItemRewardGenerator(false),
  [RewardId.RARE_EVOLUTION_ITEM]: new EvolutionItemRewardGenerator(true),

  [RewardId.POTION]: new PokemonHpRestoreReward(RewardId.POTION, "reward:potion", "potion", 20, 10),
  [RewardId.SUPER_POTION]: new PokemonHpRestoreReward(
    RewardId.SUPER_POTION,
    "reward:superPotion",
    "super_potion",
    50,
    25,
  ),
  [RewardId.HYPER_POTION]: new PokemonHpRestoreReward(
    RewardId.HYPER_POTION,
    "reward:hyperPotion",
    "hyper_potion",
    200,
    50,
  ),
  [RewardId.MAX_POTION]: new PokemonHpRestoreReward(RewardId.MAX_POTION, "reward:maxPotion", "max_potion", 0, 100),
  [RewardId.FULL_RESTORE]: new PokemonHpRestoreReward(
    RewardId.FULL_RESTORE,
    "reward:fullRestore",
    "full_restore",
    0,
    100,
    true,
  ),

  [RewardId.REVIVE]: new PokemonReviveReward(RewardId.REVIVE, "reward:revive", "revive", 50),
  [RewardId.MAX_REVIVE]: new PokemonReviveReward(RewardId.MAX_REVIVE, "reward:maxRevive", "max_revive", 100),

  [RewardId.FULL_HEAL]: new PokemonStatusHealReward("reward:fullHeal", "full_heal"),

  [RewardId.ETHER]: new PokemonPpRestoreReward(RewardId.ETHER, "reward:ether", "ether", 10),
  [RewardId.MAX_ETHER]: new PokemonPpRestoreReward(RewardId.MAX_ETHER, "reward:maxEther", "max_ether", -1),

  [RewardId.ELIXIR]: new PokemonAllMovePpRestoreReward(RewardId.ELIXIR, "reward:elixir", "elixir", 10),
  [RewardId.MAX_ELIXIR]: new PokemonAllMovePpRestoreReward(RewardId.MAX_ELIXIR, "reward:maxElixir", "max_elixir", -1),

  [RewardId.PP_UP]: new PokemonPpUpReward(RewardId.PP_UP, "reward:ppUp", "pp_up", 1),
  [RewardId.PP_MAX]: new PokemonPpUpReward(RewardId.PP_MAX, "reward:ppMax", "pp_max", 3),

  [RewardId.MINT]: new MintRewardGenerator(),

  [RewardId.TERA_SHARD]: new TeraTypeRewardGenerator(),

  [RewardId.TM_COMMON]: new TmRewardGenerator(RarityTier.COMMON),
  [RewardId.TM_GREAT]: new TmRewardGenerator(RarityTier.GREAT),
  [RewardId.TM_ULTRA]: new TmRewardGenerator(RarityTier.ULTRA),

  [RewardId.MEMORY_MUSHROOM]: new RememberMoveReward("reward:memoryMushroom", "big_mushroom"),

  [RewardId.DNA_SPLICERS]: new FusePokemonReward("reward:dnaSplicers", "dna_splicers"),

  // Form change items
  [RewardId.FORM_CHANGE_ITEM]: new FormChangeItemRewardGenerator(false),
  [RewardId.RARE_FORM_CHANGE_ITEM]: new FormChangeItemRewardGenerator(true),

  // Held items

  [RewardId.SPECIES_STAT_BOOSTER]: new SpeciesStatBoosterRewardGenerator(false),
  [RewardId.RARE_SPECIES_STAT_BOOSTER]: new SpeciesStatBoosterRewardGenerator(true),

  [RewardId.VITAMIN]: new BaseStatBoosterRewardGenerator(),

  [RewardId.ATTACK_TYPE_BOOSTER]: new AttackTypeBoosterRewardGenerator(),

  [RewardId.BERRY]: new BerryRewardGenerator(),

  // Trainer items

  [RewardId.LURE]: new LapsingTrainerItemReward(RewardId.LURE, TrainerItemId.LURE),
  [RewardId.SUPER_LURE]: new LapsingTrainerItemReward(RewardId.SUPER_LURE, TrainerItemId.SUPER_LURE),
  [RewardId.MAX_LURE]: new LapsingTrainerItemReward(RewardId.MAX_LURE, TrainerItemId.MAX_LURE),

  [RewardId.TEMP_STAT_STAGE_BOOSTER]: new TempStatStageBoosterRewardGenerator(),

  [RewardId.DIRE_HIT]: new LapsingTrainerItemReward(RewardId.DIRE_HIT, TrainerItemId.DIRE_HIT),
} as const satisfies Readonly<Record<RewardId, Reward | RewardGenerator>>;

export type AllRewardsType = typeof allRewards;
