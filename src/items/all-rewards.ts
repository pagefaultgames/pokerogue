import { PokeballType } from "#enums/pokeball";
import { RewardId } from "#enums/reward-id";
import { RarityTier } from "#enums/reward-tier";
import { TrainerItemId } from "#enums/trainer-item-id";
import { VoucherType } from "#system/voucher";
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

// TODO: Move to `reward-utils.ts` and un-exportt
export const allRewards = {
  [RewardId.NONE]: new EmptyReward(),

  // Pokeball rewards
  [RewardId.POKEBALL]: new AddPokeballReward("pb", PokeballType.POKEBALL, 5, RewardId.POKEBALL),
  [RewardId.GREAT_BALL]: new AddPokeballReward("gb", PokeballType.GREAT_BALL, 5, RewardId.GREAT_BALL),
  [RewardId.ULTRA_BALL]: new AddPokeballReward("ub", PokeballType.ULTRA_BALL, 5, RewardId.ULTRA_BALL),
  [RewardId.ROGUE_BALL]: new AddPokeballReward("rb", PokeballType.ROGUE_BALL, 5, RewardId.ROGUE_BALL),
  [RewardId.MASTER_BALL]: new AddPokeballReward("mb", PokeballType.MASTER_BALL, 1, RewardId.MASTER_BALL),

  // Voucher rewards
  [RewardId.VOUCHER]: new AddVoucherReward(VoucherType.REGULAR, 1, RewardId.VOUCHER),
  [RewardId.VOUCHER_PLUS]: new AddVoucherReward(VoucherType.PLUS, 1, RewardId.VOUCHER_PLUS),
  [RewardId.VOUCHER_PREMIUM]: new AddVoucherReward(VoucherType.PREMIUM, 1, RewardId.VOUCHER_PREMIUM),

  // Money rewards
  [RewardId.NUGGET]: new AddMoneyReward(
    "modifierType:ModifierType.NUGGET",
    "nugget",
    1,
    "modifierType:ModifierType.MoneyRewardModifierType.extra.small",
    RewardId.NUGGET,
  ),
  [RewardId.BIG_NUGGET]: new AddMoneyReward(
    "modifierType:ModifierType.BIG_NUGGET",
    "big_nugget",
    2.5,
    "modifierType:ModifierType.MoneyRewardModifierType.extra.moderate",
    RewardId.BIG_NUGGET,
  ),
  [RewardId.RELIC_GOLD]: new AddMoneyReward(
    "modifierType:ModifierType.RELIC_GOLD",
    "relic_gold",
    10,
    "modifierType:ModifierType.MoneyRewardModifierType.extra.large",
    RewardId.RELIC_GOLD,
  ),

  // Party-wide consumables
  [RewardId.RARER_CANDY]: new AllPokemonLevelIncrementReward("modifierType:ModifierType.RARER_CANDY", "rarer_candy"),
  [RewardId.SACRED_ASH]: new AllPokemonFullReviveReward("modifierType:ModifierType.SACRED_ASH", "sacred_ash"),

  // Pokemon consumables
  [RewardId.RARE_CANDY]: new PokemonLevelIncrementReward("modifierType:ModifierType.RARE_CANDY", "rare_candy"),

  [RewardId.EVOLUTION_ITEM]: new EvolutionItemRewardGenerator(false),
  [RewardId.RARE_EVOLUTION_ITEM]: new EvolutionItemRewardGenerator(true),

  [RewardId.POTION]: new PokemonHpRestoreReward("modifierType:ModifierType.POTION", "potion", RewardId.POTION, 20, 10),
  [RewardId.SUPER_POTION]: new PokemonHpRestoreReward(
    "modifierType:ModifierType.SUPER_POTION",
    "super_potion",
    RewardId.SUPER_POTION,
    50,
    25,
  ),
  [RewardId.HYPER_POTION]: new PokemonHpRestoreReward(
    "modifierType:ModifierType.HYPER_POTION",
    "hyper_potion",
    RewardId.HYPER_POTION,
    200,
    50,
  ),
  [RewardId.MAX_POTION]: new PokemonHpRestoreReward(
    "modifierType:ModifierType.MAX_POTION",
    "max_potion",
    RewardId.MAX_POTION,
    0,
    100,
  ),
  [RewardId.FULL_RESTORE]: new PokemonHpRestoreReward(
    "modifierType:ModifierType.FULL_RESTORE",
    "full_restore",
    RewardId.FULL_RESTORE,
    0,
    100,
    true,
  ),

  [RewardId.REVIVE]: new PokemonReviveReward("modifierType:ModifierType.REVIVE", "revive", RewardId.REVIVE, 50),
  [RewardId.MAX_REVIVE]: new PokemonReviveReward(
    "modifierType:ModifierType.MAX_REVIVE",
    "max_revive",
    RewardId.MAX_REVIVE,
    100,
  ),

  [RewardId.FULL_HEAL]: new PokemonStatusHealReward("modifierType:ModifierType.FULL_HEAL", "full_heal"),

  [RewardId.ETHER]: new PokemonPpRestoreReward("modifierType:ModifierType.ETHER", "ether", RewardId.ETHER, 10),
  [RewardId.MAX_ETHER]: new PokemonPpRestoreReward(
    "modifierType:ModifierType.MAX_ETHER",
    "max_ether",
    RewardId.MAX_ETHER,
    -1,
  ),

  [RewardId.ELIXIR]: new PokemonAllMovePpRestoreReward(
    "modifierType:ModifierType.ELIXIR",
    "elixir",
    RewardId.ELIXIR,
    10,
  ),
  [RewardId.MAX_ELIXIR]: new PokemonAllMovePpRestoreReward(
    "modifierType:ModifierType.MAX_ELIXIR",
    "max_elixir",
    RewardId.MAX_ELIXIR,
    -1,
  ),

  [RewardId.PP_UP]: new PokemonPpUpReward("modifierType:ModifierType.PP_UP", "pp_up", RewardId.PP_UP, 1),
  [RewardId.PP_MAX]: new PokemonPpUpReward("modifierType:ModifierType.PP_MAX", "pp_max", RewardId.PP_MAX, 3),

  [RewardId.MINT]: new MintRewardGenerator(),

  [RewardId.TERA_SHARD]: new TeraTypeRewardGenerator(),

  [RewardId.TM_COMMON]: new TmRewardGenerator(RarityTier.COMMON),
  [RewardId.TM_GREAT]: new TmRewardGenerator(RarityTier.GREAT),
  [RewardId.TM_ULTRA]: new TmRewardGenerator(RarityTier.ULTRA),

  [RewardId.MEMORY_MUSHROOM]: new RememberMoveReward("modifierType:ModifierType.MEMORY_MUSHROOM", "big_mushroom"),

  [RewardId.DNA_SPLICERS]: new FusePokemonReward("modifierType:ModifierType.DNA_SPLICERS", "dna_splicers"),

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

  [RewardId.LURE]: new LapsingTrainerItemReward(TrainerItemId.LURE),
  [RewardId.SUPER_LURE]: new LapsingTrainerItemReward(TrainerItemId.SUPER_LURE),
  [RewardId.MAX_LURE]: new LapsingTrainerItemReward(TrainerItemId.MAX_LURE),

  [RewardId.TEMP_STAT_STAGE_BOOSTER]: new TempStatStageBoosterRewardGenerator(),

  [RewardId.DIRE_HIT]: new LapsingTrainerItemReward(TrainerItemId.DIRE_HIT),
} as const satisfies {
  [k in RewardId]: Reward | RewardGenerator;
};

export type allRewardsType = typeof allRewards;
