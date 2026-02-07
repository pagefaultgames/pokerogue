import {
  AddSecondStrikeAbAttr,
  AlliedFieldDamageReductionAbAttr,
  AllyMoveCategoryPowerBoostAbAttr,
  AllyStatMultiplierAbAttr,
  AlwaysHitAbAttr,
  ArenaTrapAbAttr,
  AttackTypeImmunityAbAttr,
  BattlerTagImmunityAbAttr,
  BlockCritAbAttr,
  BlockItemTheftAbAttr,
  BlockNonDirectDamageAbAttr,
  BlockOneHitKOAbAttr,
  BlockRecoilDamageAttr,
  BlockRedirectAbAttr,
  BlockStatusDamageAbAttr,
  BlockWeatherDamageAttr,
  BonusCritAbAttr,
  BypassBurnDamageReductionAbAttr,
  BypassSpeedChanceAbAttr,
  ChangeMovePriorityAbAttr,
  ChangeMovePriorityInBracketAbAttr,
  ClearTerrainAbAttr,
  ClearWeatherAbAttr,
  CommanderAbAttr,
  ConditionalCritAbAttr,
  ConditionalUserFieldBattlerTagImmunityAbAttr,
  ConditionalUserFieldProtectStatAbAttr,
  ConditionalUserFieldStatusEffectImmunityAbAttr,
  ConfusionOnStatusEffectAbAttr,
  CopyFaintedAllyAbilityAbAttr,
  CudChewConsumeBerryAbAttr,
  CudChewRecordBerryAbAttr,
  DoubleBattleChanceAbAttr,
  DoubleBerryEffectAbAttr,
  DownloadAbAttr,
  EffectSporeAbAttr,
  FetchBallAbAttr,
  FieldMoveTypePowerBoostAbAttr,
  FieldMultiplyStatAbAttr,
  FieldPreventExplosiveMovesAbAttr,
  FieldPriorityMoveImmunityAbAttr,
  FlinchStatStageChangeAbAttr,
  ForceSwitchOutImmunityAbAttr,
  ForewarnAbAttr,
  FormBlockDamageAbAttr,
  FriskAbAttr,
  FullHpResistTypeAbAttr,
  GorillaTacticsAbAttr,
  getWeatherCondition,
  HealFromBerryUseAbAttr,
  IgnoreContactAbAttr,
  IgnoreMoveEffectsAbAttr,
  IgnoreOpponentStatStagesAbAttr,
  IgnoreProtectOnContactAbAttr,
  IgnoreTypeImmunityAbAttr,
  IgnoreTypeStatusEffectImmunityAbAttr,
  IncreasePpAbAttr,
  InfiltratorAbAttr,
  IntimidateImmunityAbAttr,
  LowHpMoveTypePowerBoostAbAttr,
  MaxMultiHitAbAttr,
  MoneyAbAttr,
  MoodyAbAttr,
  MoveAbilityBypassAbAttr,
  MoveDamageBoostAbAttr,
  MoveEffectChanceMultiplierAbAttr,
  MoveImmunityAbAttr,
  MoveImmunityStatStageChangeAbAttr,
  MovePowerBoostAbAttr,
  MoveTypeChangeAbAttr,
  MoveTypePowerBoostAbAttr,
  MultCritAbAttr,
  NoFusionAbilityAbAttr,
  NonSuperEffectiveImmunityAbAttr,
  NoTransformAbilityAbAttr,
  PokemonTypeChangeAbAttr,
  PostAttackApplyBattlerTagAbAttr,
  PostAttackApplyStatusEffectAbAttr,
  PostAttackContactApplyStatusEffectAbAttr,
  PostAttackStealHeldItemAbAttr,
  PostBattleInitFormChangeAbAttr,
  PostBattleLootAbAttr,
  PostBiomeChangeTerrainChangeAbAttr,
  PostBiomeChangeWeatherChangeAbAttr,
  PostDamageForceSwitchAbAttr,
  PostDancingMoveAbAttr,
  PostDefendAbilityGiveAbAttr,
  PostDefendAbilitySwapAbAttr,
  PostDefendApplyArenaTrapTagAbAttr,
  PostDefendApplyBattlerTagAbAttr,
  PostDefendContactApplyStatusEffectAbAttr,
  PostDefendContactApplyTagChanceAbAttr,
  PostDefendContactDamageAbAttr,
  PostDefendHpGatedStatStageChangeAbAttr,
  PostDefendMoveDisableAbAttr,
  PostDefendPerishSongAbAttr,
  PostDefendStatStageChangeAbAttr,
  PostDefendStealHeldItemAbAttr,
  PostDefendTerrainChangeAbAttr,
  PostDefendTypeChangeAbAttr,
  PostDefendWeatherChangeAbAttr,
  PostFaintContactDamageAbAttr,
  PostFaintFormChangeAbAttr,
  PostFaintHPDamageAbAttr,
  PostFaintUnsuppressedWeatherFormChangeAbAttr,
  PostIntimidateStatStageChangeAbAttr,
  PostItemLostApplyBattlerTagAbAttr,
  PostKnockOutStatStageChangeAbAttr,
  PostReceiveCritStatStageChangeAbAttr,
  PostStatStageChangeStatStageChangeAbAttr,
  PostSummonAddArenaTagAbAttr,
  PostSummonAddBattlerTagAbAttr,
  PostSummonAllyHealAbAttr,
  PostSummonClearAllyStatStagesAbAttr,
  PostSummonCopyAbilityAbAttr,
  PostSummonCopyAllyStatsAbAttr,
  PostSummonFormChangeAbAttr,
  PostSummonFormChangeByWeatherAbAttr,
  PostSummonHealStatusAbAttr,
  PostSummonMessageAbAttr,
  PostSummonRemoveArenaTagAbAttr,
  PostSummonRemoveBattlerTagAbAttr,
  PostSummonStatStageChangeAbAttr,
  PostSummonStatStageChangeOnArenaAbAttr,
  PostSummonTerrainChangeAbAttr,
  PostSummonTransformAbAttr,
  PostSummonUnnamedMessageAbAttr,
  PostSummonUserFieldRemoveStatusEffectAbAttr,
  PostSummonWeatherChangeAbAttr,
  PostSummonWeatherSuppressedFormChangeAbAttr,
  PostTeraFormChangeStatChangeAbAttr,
  PostTerrainChangeAddBattlerTagAttr,
  PostTurnFormChangeAbAttr,
  PostTurnHurtIfSleepingAbAttr,
  PostTurnResetStatusAbAttr,
  PostTurnRestoreBerryAbAttr,
  PostTurnStatusHealAbAttr,
  PostVictoryFormChangeAbAttr,
  PostVictoryStatStageChangeAbAttr,
  PostWeatherChangeAddBattlerTagAbAttr,
  PostWeatherChangeFormChangeAbAttr,
  PostWeatherLapseDamageAbAttr,
  PostWeatherLapseHealAbAttr,
  PreDefendFullHpEndureAbAttr,
  PreLeaveFieldClearWeatherAbAttr,
  PreLeaveFieldRemoveSuppressAbilitiesSourceAbAttr,
  PreSwitchOutFormChangeAbAttr,
  PreSwitchOutHealAbAttr,
  PreSwitchOutResetStatusAbAttr,
  PreventBerryUseAbAttr,
  PreventBypassSpeedChanceAbAttr,
  ProtectStatAbAttr,
  ReceivedMoveDamageMultiplierAbAttr,
  ReceivedTypeDamageMultiplierAbAttr,
  RedirectTypeMoveAbAttr,
  ReduceBerryUseThresholdAbAttr,
  ReduceBurnDamageAbAttr,
  ReduceStatusEffectDurationAbAttr,
  ReflectStatStageChangeAbAttr,
  ReflectStatusMoveAbAttr,
  ReverseDrainAbAttr,
  RunSuccessAbAttr,
  SpeedBoostAbAttr,
  StabBoostAbAttr,
  StatMultiplierAbAttr,
  StatStageChangeCopyAbAttr,
  StatStageChangeMultiplierAbAttr,
  StatusEffectImmunityAbAttr,
  SuppressWeatherEffectAbAttr,
  SyncEncounterNatureAbAttr,
  SynchronizeStatusAbAttr,
  TerrainEventTypeChangeAbAttr,
  TypeImmunityAddBattlerTagAbAttr,
  TypeImmunityHealAbAttr,
  TypeImmunityStatStageChangeAbAttr,
  UserFieldBattlerTagImmunityAbAttr,
  UserFieldMoveTypePowerBoostAbAttr,
  UserFieldStatusEffectImmunityAbAttr,
  WeightMultiplierAbAttr,
  WonderSkinAbAttr,
} from "#abilities/ab-attrs";
import { AbBuilder, type Ability } from "#abilities/ability";
import { globalScene } from "#app/global-scene";
import { getPokemonNameWithAffix } from "#app/messages";
import { GroundedTag } from "#data/battler-tags";
import { allAbilities, allMoves } from "#data/data-lists";
import { Gender } from "#data/gender";
import { getNonVolatileStatusEffects } from "#data/status-effect";
import { TerrainType } from "#data/terrain";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveCategory } from "#enums/move-category";
import { MoveFlags } from "#enums/move-flags";
import { MoveId } from "#enums/move-id";
import { MovePriorityInBracket } from "#enums/move-priority-in-bracket";
import { MoveTarget } from "#enums/move-target";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { EFFECTIVE_STATS, type EffectiveStat, getStatKey, Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { WeatherType } from "#enums/weather-type";
import type { Pokemon } from "#field/pokemon";
import { applyMoveAttrs } from "#moves/apply-attrs";
import { noAbilityTypeOverrideMoves } from "#moves/invalid-moves";
import type { AbAttrCondition, PokemonAttackCondition } from "#types/ability-types";
import type { Move } from "#types/move-types";
import { NumberHolder, randSeedInt, toDmgValue } from "#utils/common";
import i18next from "i18next";

export function initAbilities() {
  (allAbilities as Ability[]).push(
    new AbBuilder(AbilityId.NONE, 3).build(),
    new AbBuilder(AbilityId.STENCH, 3) //
      .attr(
        PostAttackApplyBattlerTagAbAttr,
        false,
        (user, target, move) => (!move.hasAttr("FlinchAttr") && !move.hitsSubstitute(user, target) ? 10 : 0),
        BattlerTagType.FLINCHED,
      )
      .build(),
    new AbBuilder(AbilityId.DRIZZLE, 3) //
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.RAIN)
      .attr(PostBiomeChangeWeatherChangeAbAttr, WeatherType.RAIN)
      .build(),
    new AbBuilder(AbilityId.SPEED_BOOST, 3) //
      .attr(SpeedBoostAbAttr)
      .build(),
    new AbBuilder(AbilityId.BATTLE_ARMOR, 3) //
      .attr(BlockCritAbAttr)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.STURDY, 3) //
      .attr(PreDefendFullHpEndureAbAttr)
      .attr(BlockOneHitKOAbAttr)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.DAMP, 3) //
      .attr(FieldPreventExplosiveMovesAbAttr)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.LIMBER, 3) //
      .attr(StatusEffectImmunityAbAttr, StatusEffect.PARALYSIS)
      .attr(PostSummonHealStatusAbAttr, StatusEffect.PARALYSIS)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.SAND_VEIL, 3) //
      .attr(StatMultiplierAbAttr, Stat.EVA, 1.2)
      .attr(BlockWeatherDamageAttr, WeatherType.SANDSTORM)
      .condition(getWeatherCondition(WeatherType.SANDSTORM))
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.STATIC, 3) //
      .attr(PostDefendContactApplyStatusEffectAbAttr, 30, StatusEffect.PARALYSIS)
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.VOLT_ABSORB, 3) //
      .attr(TypeImmunityHealAbAttr, PokemonType.ELECTRIC)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.WATER_ABSORB, 3) //
      .attr(TypeImmunityHealAbAttr, PokemonType.WATER)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.OBLIVIOUS, 3) //
      .attr(BattlerTagImmunityAbAttr, [BattlerTagType.INFATUATED, BattlerTagType.TAUNT])
      .attr(PostSummonRemoveBattlerTagAbAttr, BattlerTagType.INFATUATED, BattlerTagType.TAUNT)
      .attr(IntimidateImmunityAbAttr)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.CLOUD_NINE, 3) //
      .attr(SuppressWeatherEffectAbAttr, true)
      .attr(PostSummonUnnamedMessageAbAttr, i18next.t("abilityTriggers:weatherEffectDisappeared"))
      .attr(PostSummonWeatherSuppressedFormChangeAbAttr)
      .attr(PostFaintUnsuppressedWeatherFormChangeAbAttr)
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.COMPOUND_EYES, 3) //
      .attr(StatMultiplierAbAttr, Stat.ACC, 1.3)
      .build(),
    new AbBuilder(AbilityId.INSOMNIA, 3) //
      .attr(StatusEffectImmunityAbAttr, StatusEffect.SLEEP)
      .attr(PostSummonHealStatusAbAttr, StatusEffect.SLEEP)
      .attr(BattlerTagImmunityAbAttr, BattlerTagType.DROWSY)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.COLOR_CHANGE, 3) //
      .attr(PostDefendTypeChangeAbAttr)
      .condition(sheerForceHitDisableAbCondition)
      .build(),
    new AbBuilder(AbilityId.IMMUNITY, 3) //
      .attr(StatusEffectImmunityAbAttr, StatusEffect.POISON, StatusEffect.TOXIC)
      .attr(PostSummonHealStatusAbAttr, StatusEffect.POISON, StatusEffect.TOXIC)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.FLASH_FIRE, 3) //
      .attr(TypeImmunityAddBattlerTagAbAttr, PokemonType.FIRE, BattlerTagType.FIRE_BOOST, 1)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.SHIELD_DUST, 3) //
      .attr(IgnoreMoveEffectsAbAttr)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.OWN_TEMPO, 3) //
      .attr(BattlerTagImmunityAbAttr, BattlerTagType.CONFUSED)
      .attr(PostSummonRemoveBattlerTagAbAttr, BattlerTagType.CONFUSED)
      .attr(IntimidateImmunityAbAttr)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.SUCTION_CUPS, 3) //
      .attr(ForceSwitchOutImmunityAbAttr)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.INTIMIDATE, 3) //
      .attr(PostSummonStatStageChangeAbAttr, [Stat.ATK], -1, false, true)
      .build(),
    new AbBuilder(AbilityId.SHADOW_TAG, 3) //
      .attr(ArenaTrapAbAttr, (_user, target) => !target.hasAbility(AbilityId.SHADOW_TAG))
      .build(),
    new AbBuilder(AbilityId.ROUGH_SKIN, 3) //
      .attr(PostDefendContactDamageAbAttr, 8)
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.WONDER_GUARD, 3) //
      .attr(NonSuperEffectiveImmunityAbAttr)
      .uncopiable()
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.LEVITATE, 3) //
      .attr(
        AttackTypeImmunityAbAttr,
        PokemonType.GROUND,
        (pokemon: Pokemon) => !pokemon.getTag(GroundedTag) && !globalScene.arena.getTag(ArenaTagType.GRAVITY),
      )
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.EFFECT_SPORE, 3) //
      .attr(EffectSporeAbAttr)
      .build(),
    new AbBuilder(AbilityId.SYNCHRONIZE, 3) //
      .attr(SyncEncounterNatureAbAttr)
      .attr(SynchronizeStatusAbAttr)
      .build(),
    new AbBuilder(AbilityId.CLEAR_BODY, 3) //
      .attr(ProtectStatAbAttr)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.NATURAL_CURE, 3) //
      .attr(PreSwitchOutResetStatusAbAttr)
      .build(),
    new AbBuilder(AbilityId.LIGHTNING_ROD, 3) //
      .attr(RedirectTypeMoveAbAttr, PokemonType.ELECTRIC)
      .attr(TypeImmunityStatStageChangeAbAttr, PokemonType.ELECTRIC, Stat.SPATK, 1)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.SERENE_GRACE, 3) //
      .attr(MoveEffectChanceMultiplierAbAttr, 2)
      .build(),
    new AbBuilder(AbilityId.SWIFT_SWIM, 3) //
      .attr(StatMultiplierAbAttr, Stat.SPD, 2)
      .condition(getWeatherCondition(WeatherType.RAIN, WeatherType.HEAVY_RAIN))
      .build(),
    new AbBuilder(AbilityId.CHLOROPHYLL, 3) //
      .attr(StatMultiplierAbAttr, Stat.SPD, 2)
      .condition(getWeatherCondition(WeatherType.SUNNY, WeatherType.HARSH_SUN))
      .build(),
    new AbBuilder(AbilityId.ILLUMINATE, 3) //
      .attr(ProtectStatAbAttr, Stat.ACC)
      .attr(DoubleBattleChanceAbAttr)
      .attr(IgnoreOpponentStatStagesAbAttr, [Stat.EVA])
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.TRACE, 3) //
      .attr(PostSummonCopyAbilityAbAttr)
      .uncopiable()
      .build(),
    new AbBuilder(AbilityId.HUGE_POWER, 3) //
      .attr(StatMultiplierAbAttr, Stat.ATK, 2)
      .build(),
    new AbBuilder(AbilityId.POISON_POINT, 3) //
      .attr(PostDefendContactApplyStatusEffectAbAttr, 30, StatusEffect.POISON)
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.INNER_FOCUS, 3) //
      .attr(BattlerTagImmunityAbAttr, BattlerTagType.FLINCHED)
      .attr(IntimidateImmunityAbAttr)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.MAGMA_ARMOR, 3) //
      .attr(StatusEffectImmunityAbAttr, StatusEffect.FREEZE)
      .attr(PostSummonHealStatusAbAttr, StatusEffect.FREEZE)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.WATER_VEIL, 3) //
      .attr(StatusEffectImmunityAbAttr, StatusEffect.BURN)
      .attr(PostSummonHealStatusAbAttr, StatusEffect.BURN)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.MAGNET_PULL, 3) //
      .attr(ArenaTrapAbAttr, (_user, target) => {
        return (
          target.getTypes(true).includes(PokemonType.STEEL)
          || (target.getTypes(true).includes(PokemonType.STELLAR) && target.getTypes().includes(PokemonType.STEEL))
        );
      })
      .build(),
    new AbBuilder(AbilityId.SOUNDPROOF, 3) //
      .attr(
        MoveImmunityAbAttr,
        (pokemon, attacker, move) => pokemon !== attacker && move.hasFlag(MoveFlags.SOUND_BASED),
      )
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.RAIN_DISH, 3) //
      .attr(PostWeatherLapseHealAbAttr, 1, WeatherType.RAIN, WeatherType.HEAVY_RAIN)
      .build(),
    new AbBuilder(AbilityId.SAND_STREAM, 3) //
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.SANDSTORM)
      .attr(PostBiomeChangeWeatherChangeAbAttr, WeatherType.SANDSTORM)
      .build(),
    new AbBuilder(AbilityId.PRESSURE, 3) //
      .attr(IncreasePpAbAttr)
      .attr(PostSummonMessageAbAttr, (pokemon: Pokemon) =>
        i18next.t("abilityTriggers:postSummonPressure", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }),
      )
      .build(),
    new AbBuilder(AbilityId.THICK_FAT, 3) //
      .attr(ReceivedTypeDamageMultiplierAbAttr, PokemonType.FIRE, 0.5)
      .attr(ReceivedTypeDamageMultiplierAbAttr, PokemonType.ICE, 0.5)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.EARLY_BIRD, 3) //
      .attr(ReduceStatusEffectDurationAbAttr, StatusEffect.SLEEP)
      .build(),
    new AbBuilder(AbilityId.FLAME_BODY, 3) //
      .attr(PostDefendContactApplyStatusEffectAbAttr, 30, StatusEffect.BURN)
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.RUN_AWAY, 3) //
      .attr(RunSuccessAbAttr)
      .build(),
    new AbBuilder(AbilityId.KEEN_EYE, 3) //
      .attr(ProtectStatAbAttr, Stat.ACC)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.HYPER_CUTTER, 3) //
      .attr(ProtectStatAbAttr, Stat.ATK)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.PICKUP, 3) //
      .attr(PostBattleLootAbAttr)
      .unsuppressable()
      .build(),
    new AbBuilder(AbilityId.TRUANT, 3) //
      .attr(PostSummonAddBattlerTagAbAttr, BattlerTagType.TRUANT, 1, false)
      .build(),
    new AbBuilder(AbilityId.HUSTLE, 3) //
      .attr(StatMultiplierAbAttr, Stat.ATK, 1.5)
      .attr(StatMultiplierAbAttr, Stat.ACC, 0.8, (_user, _target, move) => move.category === MoveCategory.PHYSICAL)
      .build(),
    new AbBuilder(AbilityId.CUTE_CHARM, 3) //
      .attr(PostDefendContactApplyTagChanceAbAttr, 30, BattlerTagType.INFATUATED)
      .build(),
    new AbBuilder(AbilityId.PLUS, 3) //
      .conditionalAttr(
        p =>
          globalScene.currentBattle.double
          && [AbilityId.PLUS, AbilityId.MINUS].some(a => p.getAlly()?.hasAbility(a) ?? false),
        StatMultiplierAbAttr,
        Stat.SPATK,
        1.5,
      )
      .build(),
    new AbBuilder(AbilityId.MINUS, 3) //
      .conditionalAttr(
        p =>
          globalScene.currentBattle.double
          && [AbilityId.PLUS, AbilityId.MINUS].some(a => p.getAlly()?.hasAbility(a) ?? false),
        StatMultiplierAbAttr,
        Stat.SPATK,
        1.5,
      )
      .build(),
    new AbBuilder(AbilityId.FORECAST, 3, -2) //
      .uncopiable()
      .unreplaceable()
      .attr(NoFusionAbilityAbAttr)
      .attr(PostSummonFormChangeByWeatherAbAttr)
      .attr(PostWeatherChangeFormChangeAbAttr, AbilityId.FORECAST, [
        WeatherType.NONE,
        WeatherType.SANDSTORM,
        WeatherType.STRONG_WINDS,
        WeatherType.FOG,
      ])
      .build(),
    new AbBuilder(AbilityId.STICKY_HOLD, 3) //
      .attr(BlockItemTheftAbAttr)
      .bypassFaint()
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.SHED_SKIN, 3) //
      .conditionalAttr(_pokemon => !randSeedInt(3), PostTurnResetStatusAbAttr)
      .build(),
    new AbBuilder(AbilityId.GUTS, 3) //
      .attr(BypassBurnDamageReductionAbAttr)
      .conditionalAttr(
        pokemon => !!pokemon.status || pokemon.hasAbility(AbilityId.COMATOSE),
        StatMultiplierAbAttr,
        Stat.ATK,
        1.5,
      )
      .build(),
    new AbBuilder(AbilityId.MARVEL_SCALE, 3) //
      .conditionalAttr(
        pokemon => !!pokemon.status || pokemon.hasAbility(AbilityId.COMATOSE),
        StatMultiplierAbAttr,
        Stat.DEF,
        1.5,
      )
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.LIQUID_OOZE, 3) //
      .attr(ReverseDrainAbAttr)
      .build(),
    new AbBuilder(AbilityId.OVERGROW, 3) //
      .attr(LowHpMoveTypePowerBoostAbAttr, PokemonType.GRASS)
      .build(),
    new AbBuilder(AbilityId.BLAZE, 3) //
      .attr(LowHpMoveTypePowerBoostAbAttr, PokemonType.FIRE)
      .build(),
    new AbBuilder(AbilityId.TORRENT, 3) //
      .attr(LowHpMoveTypePowerBoostAbAttr, PokemonType.WATER)
      .build(),
    new AbBuilder(AbilityId.SWARM, 3) //
      .attr(LowHpMoveTypePowerBoostAbAttr, PokemonType.BUG)
      .build(),
    new AbBuilder(AbilityId.ROCK_HEAD, 3) //
      .attr(BlockRecoilDamageAttr)
      .build(),
    new AbBuilder(AbilityId.DROUGHT, 3) //
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.SUNNY)
      .attr(PostBiomeChangeWeatherChangeAbAttr, WeatherType.SUNNY)
      .build(),
    new AbBuilder(AbilityId.ARENA_TRAP, 3) //
      .attr(ArenaTrapAbAttr, (_user, target) => target.isGrounded())
      .attr(DoubleBattleChanceAbAttr)
      .build(),
    new AbBuilder(AbilityId.VITAL_SPIRIT, 3) //
      .attr(StatusEffectImmunityAbAttr, StatusEffect.SLEEP)
      .attr(PostSummonHealStatusAbAttr, StatusEffect.SLEEP)
      .attr(BattlerTagImmunityAbAttr, BattlerTagType.DROWSY)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.WHITE_SMOKE, 3) //
      .attr(ProtectStatAbAttr)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.PURE_POWER, 3) //
      .attr(StatMultiplierAbAttr, Stat.ATK, 2)
      .build(),
    new AbBuilder(AbilityId.SHELL_ARMOR, 3) //
      .attr(BlockCritAbAttr)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.AIR_LOCK, 3) //
      .attr(SuppressWeatherEffectAbAttr, true)
      .attr(PostSummonUnnamedMessageAbAttr, i18next.t("abilityTriggers:weatherEffectDisappeared"))
      .attr(PostSummonWeatherSuppressedFormChangeAbAttr)
      .attr(PostFaintUnsuppressedWeatherFormChangeAbAttr)
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.TANGLED_FEET, 4) //
      .conditionalAttr(pokemon => !!pokemon.getTag(BattlerTagType.CONFUSED), StatMultiplierAbAttr, Stat.EVA, 2)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.MOTOR_DRIVE, 4) //
      .attr(TypeImmunityStatStageChangeAbAttr, PokemonType.ELECTRIC, Stat.SPD, 1)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.RIVALRY, 4) //
      .attr(
        MovePowerBoostAbAttr,
        (user, target, _move) =>
          user.gender !== Gender.GENDERLESS && target?.gender !== Gender.GENDERLESS && user.gender === target?.gender,
        1.25,
      )
      .attr(
        MovePowerBoostAbAttr,
        (user, target, _move) =>
          user.gender !== Gender.GENDERLESS && target?.gender !== Gender.GENDERLESS && user.gender !== target?.gender,
        0.75,
      )
      .build(),
    new AbBuilder(AbilityId.STEADFAST, 4) //
      .attr(FlinchStatStageChangeAbAttr, [Stat.SPD], 1)
      .build(),
    new AbBuilder(AbilityId.SNOW_CLOAK, 4) //
      .attr(StatMultiplierAbAttr, Stat.EVA, 1.2)
      .attr(BlockWeatherDamageAttr, WeatherType.HAIL)
      .condition(getWeatherCondition(WeatherType.HAIL, WeatherType.SNOW))
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.GLUTTONY, 4) //
      .attr(ReduceBerryUseThresholdAbAttr)
      .build(),
    new AbBuilder(AbilityId.ANGER_POINT, 4) //
      .attr(PostReceiveCritStatStageChangeAbAttr, Stat.ATK, 12)
      .build(),
    new AbBuilder(AbilityId.UNBURDEN, 4) //
      .attr(PostItemLostApplyBattlerTagAbAttr, BattlerTagType.UNBURDEN)
      .bypassFaint() // Allows reviver seed to activate Unburden
      .edgeCase() // Should not restore Unburden boost if Pokemon loses then regains Unburden ability
      .build(),
    new AbBuilder(AbilityId.HEATPROOF, 4) //
      .attr(ReceivedTypeDamageMultiplierAbAttr, PokemonType.FIRE, 0.5)
      .attr(ReduceBurnDamageAbAttr, 0.5)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.SIMPLE, 4) //
      .attr(StatStageChangeMultiplierAbAttr, 2)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.DRY_SKIN, 4) //
      .attr(PostWeatherLapseDamageAbAttr, 2, WeatherType.SUNNY, WeatherType.HARSH_SUN)
      .attr(PostWeatherLapseHealAbAttr, 2, WeatherType.RAIN, WeatherType.HEAVY_RAIN)
      .attr(ReceivedTypeDamageMultiplierAbAttr, PokemonType.FIRE, 1.25)
      .attr(TypeImmunityHealAbAttr, PokemonType.WATER)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.DOWNLOAD, 4) //
      .attr(DownloadAbAttr)
      .build(),
    new AbBuilder(AbilityId.IRON_FIST, 4) //
      .attr(MovePowerBoostAbAttr, (_user, _target, move) => move.hasFlag(MoveFlags.PUNCHING_MOVE), 1.2)
      .build(),
    new AbBuilder(AbilityId.POISON_HEAL, 4) //
      .attr(PostTurnStatusHealAbAttr, StatusEffect.TOXIC, StatusEffect.POISON)
      .attr(BlockStatusDamageAbAttr, StatusEffect.TOXIC, StatusEffect.POISON)
      .build(),
    new AbBuilder(AbilityId.ADAPTABILITY, 4) //
      .attr(StabBoostAbAttr)
      .build(),
    new AbBuilder(AbilityId.SKILL_LINK, 4) //
      .attr(MaxMultiHitAbAttr)
      .build(),
    new AbBuilder(AbilityId.HYDRATION, 4) //
      .attr(PostTurnResetStatusAbAttr)
      .condition(getWeatherCondition(WeatherType.RAIN, WeatherType.HEAVY_RAIN))
      .build(),
    new AbBuilder(AbilityId.SOLAR_POWER, 4) //
      .attr(PostWeatherLapseDamageAbAttr, 2, WeatherType.SUNNY, WeatherType.HARSH_SUN)
      .attr(StatMultiplierAbAttr, Stat.SPATK, 1.5)
      .condition(getWeatherCondition(WeatherType.SUNNY, WeatherType.HARSH_SUN))
      .build(),
    new AbBuilder(AbilityId.QUICK_FEET, 4) //
      // TODO: This should ignore the speed drop, not manually undo it
      .conditionalAttr(
        pokemon => (pokemon.status ? pokemon.status.effect === StatusEffect.PARALYSIS : false),
        StatMultiplierAbAttr,
        Stat.SPD,
        2,
      )
      .conditionalAttr(
        pokemon => !!pokemon.status || pokemon.hasAbility(AbilityId.COMATOSE),
        StatMultiplierAbAttr,
        Stat.SPD,
        1.5,
      )
      .build(),
    new AbBuilder(AbilityId.NORMALIZE, 4) //
      .attr(MoveTypeChangeAbAttr, PokemonType.NORMAL, anyTypeMoveConversionCondition)
      .attr(MovePowerBoostAbAttr, anyTypeMoveConversionCondition, 1.2)
      .build(),
    new AbBuilder(AbilityId.SNIPER, 4) //
      .attr(MultCritAbAttr, 1.5)
      .build(),
    new AbBuilder(AbilityId.MAGIC_GUARD, 4) //
      .attr(BlockNonDirectDamageAbAttr)
      .build(),
    new AbBuilder(AbilityId.NO_GUARD, 4) //
      .attr(AlwaysHitAbAttr)
      .attr(DoubleBattleChanceAbAttr)
      .build(),
    new AbBuilder(AbilityId.STALL, 4) //
      .attr(ChangeMovePriorityInBracketAbAttr, (_pokemon, _move: Move) => true, MovePriorityInBracket.LAST)
      .build(),
    new AbBuilder(AbilityId.TECHNICIAN, 4) //
      .attr(
        MovePowerBoostAbAttr,
        (user, target, move) => {
          const power = new NumberHolder(move.power);
          applyMoveAttrs("VariablePowerAttr", user, target, move, power);
          return power.value <= 60;
        },
        1.5,
      )
      .build(),
    new AbBuilder(AbilityId.LEAF_GUARD, 4) //
      .attr(StatusEffectImmunityAbAttr)
      .condition(getWeatherCondition(WeatherType.SUNNY, WeatherType.HARSH_SUN))
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.KLUTZ, 4, 1) //
      .unimplemented()
      .build(),
    new AbBuilder(AbilityId.MOLD_BREAKER, 4) //
      .attr(PostSummonMessageAbAttr, (pokemon: Pokemon) =>
        i18next.t("abilityTriggers:postSummonMoldBreaker", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }),
      )
      .attr(MoveAbilityBypassAbAttr)
      .build(),
    new AbBuilder(AbilityId.SUPER_LUCK, 4) //
      .attr(BonusCritAbAttr)
      .build(),
    new AbBuilder(AbilityId.AFTERMATH, 4) //
      .attr(PostFaintContactDamageAbAttr, 4)
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.ANTICIPATION, 4) //
      .conditionalAttr(anticipationCondition, PostSummonMessageAbAttr, (pokemon: Pokemon) =>
        i18next.t("abilityTriggers:postSummonAnticipation", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }),
      )
      .build(),
    new AbBuilder(AbilityId.FOREWARN, 4) //
      .attr(ForewarnAbAttr)
      .build(),
    new AbBuilder(AbilityId.UNAWARE, 4) //
      .attr(IgnoreOpponentStatStagesAbAttr, [Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.ACC, Stat.EVA])
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.TINTED_LENS, 4) //
      .attr(MoveDamageBoostAbAttr, 2, (user, target, move) => (target?.getMoveEffectiveness(user!, move) ?? 1) <= 0.5)
      .build(),
    new AbBuilder(AbilityId.FILTER, 4) //
      .attr(
        ReceivedMoveDamageMultiplierAbAttr,
        (target, user, move) => target.getMoveEffectiveness(user, move) >= 2,
        0.75,
      )
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.SLOW_START, 4) //
      .attr(PostSummonAddBattlerTagAbAttr, BattlerTagType.SLOW_START, 5)
      .build(),
    new AbBuilder(AbilityId.SCRAPPY, 4) //
      .attr(IgnoreTypeImmunityAbAttr, PokemonType.GHOST, [PokemonType.NORMAL, PokemonType.FIGHTING])
      .attr(IntimidateImmunityAbAttr)
      .build(),
    new AbBuilder(AbilityId.STORM_DRAIN, 4) //
      .attr(RedirectTypeMoveAbAttr, PokemonType.WATER)
      .attr(TypeImmunityStatStageChangeAbAttr, PokemonType.WATER, Stat.SPATK, 1)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.ICE_BODY, 4) //
      .attr(BlockWeatherDamageAttr, WeatherType.HAIL)
      .attr(PostWeatherLapseHealAbAttr, 1, WeatherType.HAIL, WeatherType.SNOW)
      .build(),
    new AbBuilder(AbilityId.SOLID_ROCK, 4) //
      .attr(
        ReceivedMoveDamageMultiplierAbAttr,
        (target, user, move) => target.getMoveEffectiveness(user, move) >= 2,
        0.75,
      )
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.SNOW_WARNING, 4) //
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.SNOW)
      .attr(PostBiomeChangeWeatherChangeAbAttr, WeatherType.SNOW)
      .build(),
    new AbBuilder(AbilityId.HONEY_GATHER, 4) //
      .attr(MoneyAbAttr)
      .unsuppressable()
      .build(),
    new AbBuilder(AbilityId.FRISK, 4) //
      .attr(FriskAbAttr)
      .build(),
    new AbBuilder(AbilityId.RECKLESS, 4) //
      .attr(MovePowerBoostAbAttr, (_user, _target, move) => move.hasFlag(MoveFlags.RECKLESS_MOVE), 1.2)
      .build(),
    new AbBuilder(AbilityId.MULTITYPE, 4) //
      .attr(NoFusionAbilityAbAttr)
      .uncopiable()
      .unsuppressable()
      .unreplaceable()
      .build(),
    new AbBuilder(AbilityId.FLOWER_GIFT, 4, -2) //
      .conditionalAttr(
        getWeatherCondition(WeatherType.SUNNY || WeatherType.HARSH_SUN),
        StatMultiplierAbAttr,
        Stat.ATK,
        1.5,
      )
      .conditionalAttr(
        getWeatherCondition(WeatherType.SUNNY || WeatherType.HARSH_SUN),
        StatMultiplierAbAttr,
        Stat.SPDEF,
        1.5,
      )
      .conditionalAttr(
        getWeatherCondition(WeatherType.SUNNY || WeatherType.HARSH_SUN),
        AllyStatMultiplierAbAttr,
        Stat.ATK,
        1.5,
      )
      .conditionalAttr(
        getWeatherCondition(WeatherType.SUNNY || WeatherType.HARSH_SUN),
        AllyStatMultiplierAbAttr,
        Stat.SPDEF,
        1.5,
      )
      .attr(NoFusionAbilityAbAttr)
      .attr(PostSummonFormChangeByWeatherAbAttr)
      .attr(PostWeatherChangeFormChangeAbAttr, AbilityId.FLOWER_GIFT, [
        WeatherType.NONE,
        WeatherType.SANDSTORM,
        WeatherType.STRONG_WINDS,
        WeatherType.FOG,
        WeatherType.HAIL,
        WeatherType.HEAVY_RAIN,
        WeatherType.SNOW,
        WeatherType.RAIN,
      ])
      .uncopiable()
      .unreplaceable()
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.BAD_DREAMS, 4) //
      .attr(PostTurnHurtIfSleepingAbAttr)
      .build(),
    new AbBuilder(AbilityId.PICKPOCKET, 5) //
      .attr(PostDefendStealHeldItemAbAttr, (target, user, move) =>
        move.doesFlagEffectApply({ flag: MoveFlags.MAKES_CONTACT, user, target }),
      )
      .condition(sheerForceHitDisableAbCondition)
      .build(),
    new AbBuilder(AbilityId.SHEER_FORCE, 5) //
      .attr(MovePowerBoostAbAttr, (_user, _target, move) => move.chance >= 1, 1.3)
      .attr(MoveEffectChanceMultiplierAbAttr, 0) // This attribute does not seem to function - Should disable life orb, eject button, red card, kee/maranga berry if they get implemented
      .build(),
    new AbBuilder(AbilityId.CONTRARY, 5) //
      .attr(StatStageChangeMultiplierAbAttr, -1)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.UNNERVE, 5, 1) //
      .attr(PreventBerryUseAbAttr)
      .build(),
    new AbBuilder(AbilityId.DEFIANT, 5) //
      .attr(PostStatStageChangeStatStageChangeAbAttr, (_target, _statsChanged, stages) => stages < 0, [Stat.ATK], 2)
      .build(),
    new AbBuilder(AbilityId.DEFEATIST, 5) //
      .attr(StatMultiplierAbAttr, Stat.ATK, 0.5)
      .attr(StatMultiplierAbAttr, Stat.SPATK, 0.5)
      .condition(pokemon => pokemon.getHpRatio() <= 0.5)
      .build(),
    new AbBuilder(AbilityId.CURSED_BODY, 5) //
      .attr(PostDefendMoveDisableAbAttr, 30)
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.HEALER, 5) //
      .conditionalAttr(pokemon => pokemon.getAlly() != null && randSeedInt(10) < 3, PostTurnResetStatusAbAttr, true)
      .build(),
    new AbBuilder(AbilityId.FRIEND_GUARD, 5) //
      .attr(AlliedFieldDamageReductionAbAttr, 0.75)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.WEAK_ARMOR, 5) //
      .attr(
        PostDefendStatStageChangeAbAttr,
        (_target, _user, move) => move.category === MoveCategory.PHYSICAL,
        Stat.DEF,
        -1,
      )
      .attr(
        PostDefendStatStageChangeAbAttr,
        (_target, _user, move) => move.category === MoveCategory.PHYSICAL,
        Stat.SPD,
        2,
      )
      .build(),
    new AbBuilder(AbilityId.HEAVY_METAL, 5) //
      .attr(WeightMultiplierAbAttr, 2)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.LIGHT_METAL, 5) //
      .attr(WeightMultiplierAbAttr, 0.5)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.MULTISCALE, 5) //
      .attr(ReceivedMoveDamageMultiplierAbAttr, (target, _user, _move) => target.isFullHp(), 0.5)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.TOXIC_BOOST, 5) //
      .attr(
        MovePowerBoostAbAttr,
        (user, _target, move) =>
          move.category === MoveCategory.PHYSICAL
          && (user.status?.effect === StatusEffect.POISON || user.status?.effect === StatusEffect.TOXIC),
        1.5,
      )
      .build(),
    new AbBuilder(AbilityId.FLARE_BOOST, 5) //
      .attr(
        MovePowerBoostAbAttr,
        (user, _target, move) => move.category === MoveCategory.SPECIAL && user.status?.effect === StatusEffect.BURN,
        1.5,
      )
      .build(),
    new AbBuilder(AbilityId.HARVEST, 5) //
      .attr(
        PostTurnRestoreBerryAbAttr,
        // Rate is doubled when under sun, cf https://dex.pokemonshowdown.com/abilities/harvest
        pokemon => (getWeatherCondition(WeatherType.SUNNY, WeatherType.HARSH_SUN)(pokemon) ? 1 : 0.5),
      )
      .edgeCase() // Cannot recover berries used up by fling or natural gift (unimplemented)
      .build(),
    new AbBuilder(AbilityId.TELEPATHY, 5) //
      .attr(MoveImmunityAbAttr, (pokemon, attacker, move) => pokemon.getAlly() === attacker && move.is("AttackMove"))
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.MOODY, 5) //
      .attr(MoodyAbAttr)
      .build(),
    new AbBuilder(AbilityId.OVERCOAT, 5) //
      .attr(BlockWeatherDamageAttr)
      .attr(
        MoveImmunityAbAttr,
        (pokemon, attacker, move) => pokemon !== attacker && move.hasFlag(MoveFlags.POWDER_MOVE),
      )
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.POISON_TOUCH, 5) //
      .attr(PostAttackContactApplyStatusEffectAbAttr, 30, StatusEffect.POISON)
      .build(),
    new AbBuilder(AbilityId.REGENERATOR, 5) //
      .attr(PreSwitchOutHealAbAttr)
      .build(),
    new AbBuilder(AbilityId.BIG_PECKS, 5) //
      .attr(ProtectStatAbAttr, Stat.DEF)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.SAND_RUSH, 5) //
      .attr(StatMultiplierAbAttr, Stat.SPD, 2)
      .attr(BlockWeatherDamageAttr, WeatherType.SANDSTORM)
      .condition(getWeatherCondition(WeatherType.SANDSTORM))
      .build(),
    new AbBuilder(AbilityId.WONDER_SKIN, 5) //
      .attr(WonderSkinAbAttr)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.ANALYTIC, 5) //
      .attr(
        MovePowerBoostAbAttr,
        user =>
          // Boost power if all other Pokemon have already moved (no other moves are slated to execute)
          !globalScene.phaseManager.hasPhaseOfType("MovePhase", phase => phase.pokemon.id !== user.id),
        1.3,
      )
      .build(),
    new AbBuilder(AbilityId.ILLUSION, 5) //
      // // The Pokemon generate an illusion if it's available
      // .attr(IllusionPreSummonAbAttr, false)
      // .attr(IllusionBreakAbAttr)
      // // The Pokemon loses its illusion when damaged by a move
      // .attr(PostDefendIllusionBreakAbAttr, true)
      // // Disable Illusion in fusions
      // .attr(NoFusionAbilityAbAttr)
      // // Illusion is available again after a battle
      // .conditionalAttr((pokemon) => pokemon.isAllowedInBattle(), IllusionPostBattleAbAttr, false)
      .uncopiable()
      // .bypassFaint()
      .unimplemented() // TODO: reimplement Illusion properly
      .build(),
    new AbBuilder(AbilityId.IMPOSTER, 5) //
      .attr(PostSummonTransformAbAttr)
      .uncopiable()
      .edgeCase() // Should copy rage fist hit count, etc (see Transform edge case for full list)
      .build(),
    new AbBuilder(AbilityId.INFILTRATOR, 5) //
      .attr(InfiltratorAbAttr)
      .partial() // does not bypass Mist
      .build(),
    new AbBuilder(AbilityId.MUMMY, 5) //
      .attr(PostDefendAbilityGiveAbAttr, AbilityId.MUMMY)
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.MOXIE, 5) //
      .attr(PostVictoryStatStageChangeAbAttr, Stat.ATK, 1)
      .build(),
    new AbBuilder(AbilityId.JUSTIFIED, 5) //
      .attr(
        PostDefendStatStageChangeAbAttr,
        (_target, user, move) => user.getMoveType(move) === PokemonType.DARK && move.category !== MoveCategory.STATUS,
        Stat.ATK,
        1,
      )
      .build(),
    new AbBuilder(AbilityId.RATTLED, 5) //
      .attr(
        PostDefendStatStageChangeAbAttr,
        (_target, user, move) => {
          const moveType = user.getMoveType(move);
          return (
            move.category !== MoveCategory.STATUS
            && (moveType === PokemonType.DARK || moveType === PokemonType.BUG || moveType === PokemonType.GHOST)
          );
        },
        Stat.SPD,
        1,
      )
      .attr(PostIntimidateStatStageChangeAbAttr, [Stat.SPD], 1)
      .build(),
    new AbBuilder(AbilityId.MAGIC_BOUNCE, 5) //
      .attr(ReflectStatusMoveAbAttr)
      .ignorable()
      // Interactions with stomping tantrum, instruct, encore, and probably other moves that
      // rely on move history
      .edgeCase()
      .build(),
    new AbBuilder(AbilityId.SAP_SIPPER, 5) //
      .attr(TypeImmunityStatStageChangeAbAttr, PokemonType.GRASS, Stat.ATK, 1)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.PRANKSTER, 5) //
      .attr(ChangeMovePriorityAbAttr, (_pokemon, move: Move) => move.category === MoveCategory.STATUS, 1)
      .build(),
    new AbBuilder(AbilityId.SAND_FORCE, 5) //
      .attr(MoveTypePowerBoostAbAttr, PokemonType.ROCK, 1.3)
      .attr(MoveTypePowerBoostAbAttr, PokemonType.GROUND, 1.3)
      .attr(MoveTypePowerBoostAbAttr, PokemonType.STEEL, 1.3)
      .attr(BlockWeatherDamageAttr, WeatherType.SANDSTORM)
      .condition(getWeatherCondition(WeatherType.SANDSTORM))
      .build(),
    new AbBuilder(AbilityId.IRON_BARBS, 5) //
      .attr(PostDefendContactDamageAbAttr, 8)
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.ZEN_MODE, 5) //
      .attr(PostBattleInitFormChangeAbAttr, () => 0)
      .attr(PostSummonFormChangeAbAttr, p => (p.getHpRatio() <= 0.5 ? 1 : 0))
      .attr(PostTurnFormChangeAbAttr, p => (p.getHpRatio() <= 0.5 ? 1 : 0))
      .attr(NoFusionAbilityAbAttr)
      .uncopiable()
      .unreplaceable()
      .unsuppressable()
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.VICTORY_STAR, 5) //
      .attr(StatMultiplierAbAttr, Stat.ACC, 1.1)
      .attr(AllyStatMultiplierAbAttr, Stat.ACC, 1.1, false)
      .build(),
    new AbBuilder(AbilityId.TURBOBLAZE, 5) //
      .attr(PostSummonMessageAbAttr, (pokemon: Pokemon) =>
        i18next.t("abilityTriggers:postSummonTurboblaze", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }),
      )
      .attr(MoveAbilityBypassAbAttr)
      .build(),
    new AbBuilder(AbilityId.TERAVOLT, 5) //
      .attr(PostSummonMessageAbAttr, (pokemon: Pokemon) =>
        i18next.t("abilityTriggers:postSummonTeravolt", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }),
      )
      .attr(MoveAbilityBypassAbAttr)
      .build(),
    new AbBuilder(AbilityId.AROMA_VEIL, 6) //
      .attr(UserFieldBattlerTagImmunityAbAttr, [
        BattlerTagType.INFATUATED,
        BattlerTagType.TAUNT,
        BattlerTagType.DISABLED,
        BattlerTagType.TORMENT,
        BattlerTagType.HEAL_BLOCK,
      ])
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.FLOWER_VEIL, 6) //
      .attr(ConditionalUserFieldStatusEffectImmunityAbAttr, (target: Pokemon, source: Pokemon | null) => {
        return source ? target.getTypes().includes(PokemonType.GRASS) && target.id !== source.id : false;
      })
      .attr(
        ConditionalUserFieldBattlerTagImmunityAbAttr,
        (target: Pokemon) => {
          return target.getTypes().includes(PokemonType.GRASS);
        },
        [BattlerTagType.DROWSY],
      )
      .attr(ConditionalUserFieldProtectStatAbAttr, (target: Pokemon) => {
        return target.getTypes().includes(PokemonType.GRASS);
      })
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.CHEEK_POUCH, 6) //
      .attr(HealFromBerryUseAbAttr, 1 / 3)
      .build(),
    new AbBuilder(AbilityId.PROTEAN, 6) //
      .attr(PokemonTypeChangeAbAttr)
      // .condition((p) => !p.summonData.abilitiesApplied.includes(AbilityId.PROTEAN)) //Gen 9 Implementation
      // TODO: needs testing on interaction with weather blockage
      .edgeCase()
      .build(),
    new AbBuilder(AbilityId.FUR_COAT, 6) //
      .attr(ReceivedMoveDamageMultiplierAbAttr, (_target, _user, move) => move.category === MoveCategory.PHYSICAL, 0.5)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.MAGICIAN, 6) //
      .attr(PostAttackStealHeldItemAbAttr)
      .build(),
    new AbBuilder(AbilityId.BULLETPROOF, 6) //
      .attr(
        MoveImmunityAbAttr,
        (pokemon, attacker, move) => pokemon !== attacker && move.hasFlag(MoveFlags.BALLBOMB_MOVE),
      )
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.COMPETITIVE, 6) //
      .attr(PostStatStageChangeStatStageChangeAbAttr, (_target, _statsChanged, stages) => stages < 0, [Stat.SPATK], 2)
      .build(),
    new AbBuilder(AbilityId.STRONG_JAW, 6) //
      .attr(MovePowerBoostAbAttr, (_user, _target, move) => move.hasFlag(MoveFlags.BITING_MOVE), 1.5)
      .build(),
    new AbBuilder(AbilityId.REFRIGERATE, 6) //
      .attr(MoveTypeChangeAbAttr, PokemonType.ICE, normalTypeMoveConversionCondition)
      .attr(MovePowerBoostAbAttr, normalTypeMoveConversionCondition, 1.2)
      .build(),
    new AbBuilder(AbilityId.SWEET_VEIL, 6) //
      .attr(UserFieldStatusEffectImmunityAbAttr, StatusEffect.SLEEP)
      .attr(PostSummonUserFieldRemoveStatusEffectAbAttr, StatusEffect.SLEEP)
      .attr(UserFieldBattlerTagImmunityAbAttr, BattlerTagType.DROWSY)
      .ignorable()
      .partial() // Mold Breaker ally should not be affected by Sweet Veil
      .build(),
    new AbBuilder(AbilityId.STANCE_CHANGE, 6) //
      .attr(NoFusionAbilityAbAttr)
      .uncopiable()
      .unreplaceable()
      .unsuppressable()
      .build(),
    new AbBuilder(AbilityId.GALE_WINGS, 6) //
      .attr(
        ChangeMovePriorityAbAttr,
        (pokemon, move) => pokemon.isFullHp() && pokemon.getMoveType(move) === PokemonType.FLYING,
        1,
      )
      .build(),
    new AbBuilder(AbilityId.MEGA_LAUNCHER, 6) //
      .attr(MovePowerBoostAbAttr, (_user, _target, move) => move.hasFlag(MoveFlags.PULSE_MOVE), 1.5)
      .build(),
    new AbBuilder(AbilityId.GRASS_PELT, 6) //
      .conditionalAttr(getTerrainCondition(TerrainType.GRASSY), StatMultiplierAbAttr, Stat.DEF, 1.5)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.SYMBIOSIS, 6) //
      .unimplemented()
      .build(),
    new AbBuilder(AbilityId.TOUGH_CLAWS, 6) //
      .attr(MovePowerBoostAbAttr, (_user, _target, move) => move.hasFlag(MoveFlags.MAKES_CONTACT), 1.3)
      .build(),
    new AbBuilder(AbilityId.PIXILATE, 6) //
      .attr(MoveTypeChangeAbAttr, PokemonType.FAIRY, normalTypeMoveConversionCondition)
      .attr(MovePowerBoostAbAttr, normalTypeMoveConversionCondition, 1.2)
      .build(),
    new AbBuilder(AbilityId.GOOEY, 6) //
      .attr(
        PostDefendStatStageChangeAbAttr,
        (_target, _user, move) => move.hasFlag(MoveFlags.MAKES_CONTACT),
        Stat.SPD,
        -1,
        false,
      )
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.AERILATE, 6) //
      .attr(MoveTypeChangeAbAttr, PokemonType.FLYING, normalTypeMoveConversionCondition)
      .attr(MovePowerBoostAbAttr, normalTypeMoveConversionCondition, 1.2)
      .build(),
    new AbBuilder(AbilityId.PARENTAL_BOND, 6) //
      .attr(AddSecondStrikeAbAttr)
      // Only multiply damage on the last strike of multi-strike moves
      .attr(
        MoveDamageBoostAbAttr,
        0.25,
        (user, target, move) =>
          user.turnData.hitCount > 1 // move was originally multi hit
          && user.turnData.hitsLeft === 1 // move is on its final strike
          && move.canBeMultiStrikeEnhanced(user, true, target),
      )
      .build(),
    new AbBuilder(AbilityId.DARK_AURA, 6) //
      .attr(PostSummonMessageAbAttr, (pokemon: Pokemon) =>
        i18next.t("abilityTriggers:postSummonDarkAura", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }),
      )
      .attr(FieldMoveTypePowerBoostAbAttr, PokemonType.DARK, 4 / 3)
      .build(),
    new AbBuilder(AbilityId.FAIRY_AURA, 6) //
      .attr(PostSummonMessageAbAttr, (pokemon: Pokemon) =>
        i18next.t("abilityTriggers:postSummonFairyAura", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }),
      )
      .attr(FieldMoveTypePowerBoostAbAttr, PokemonType.FAIRY, 4 / 3)
      .build(),
    new AbBuilder(AbilityId.AURA_BREAK, 6) //
      .ignorable()
      .conditionalAttr(
        _pokemon => globalScene.getField(true).some(p => p.hasAbility(AbilityId.DARK_AURA)),
        FieldMoveTypePowerBoostAbAttr,
        PokemonType.DARK,
        9 / 16,
      )
      .conditionalAttr(
        _pokemon => globalScene.getField(true).some(p => p.hasAbility(AbilityId.FAIRY_AURA)),
        FieldMoveTypePowerBoostAbAttr,
        PokemonType.FAIRY,
        9 / 16,
      )
      .conditionalAttr(
        _pokemon =>
          globalScene.getField(true).some(p => p.hasAbility(AbilityId.DARK_AURA) || p.hasAbility(AbilityId.FAIRY_AURA)),
        PostSummonMessageAbAttr,
        (pokemon: Pokemon) =>
          i18next.t("abilityTriggers:postSummonAuraBreak", { pokemonNameWithAffix: getPokemonNameWithAffix(pokemon) }),
      )
      .build(),
    new AbBuilder(AbilityId.PRIMORDIAL_SEA, 6) //
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.HEAVY_RAIN)
      .attr(PostBiomeChangeWeatherChangeAbAttr, WeatherType.HEAVY_RAIN)
      .attr(PreLeaveFieldClearWeatherAbAttr, WeatherType.HEAVY_RAIN)
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.DESOLATE_LAND, 6) //
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.HARSH_SUN)
      .attr(PostBiomeChangeWeatherChangeAbAttr, WeatherType.HARSH_SUN)
      .attr(PreLeaveFieldClearWeatherAbAttr, WeatherType.HARSH_SUN)
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.DELTA_STREAM, 6) //
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.STRONG_WINDS)
      .attr(PostBiomeChangeWeatherChangeAbAttr, WeatherType.STRONG_WINDS)
      .attr(PreLeaveFieldClearWeatherAbAttr, WeatherType.STRONG_WINDS)
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.STAMINA, 7) //
      .attr(
        PostDefendStatStageChangeAbAttr,
        (_target, _user, move) => move.category !== MoveCategory.STATUS,
        Stat.DEF,
        1,
      )
      .build(),
    new AbBuilder(AbilityId.WIMP_OUT, 7) //
      .attr(PostDamageForceSwitchAbAttr)
      .condition(sheerForceHitDisableAbCondition)
      .edgeCase() // Should not trigger when hurting itself in confusion, causes Fake Out to fail turn 1 and succeed turn 2 if pokemon is switched out before battle start via playing in Switch Mode
      .build(),
    new AbBuilder(AbilityId.EMERGENCY_EXIT, 7) //
      .attr(PostDamageForceSwitchAbAttr)
      .condition(sheerForceHitDisableAbCondition)
      .edgeCase() // Should not trigger when hurting itself in confusion, causes Fake Out to fail turn 1 and succeed turn 2 if pokemon is switched out before battle start via playing in Switch Mode
      .build(),
    new AbBuilder(AbilityId.WATER_COMPACTION, 7) //
      .attr(
        PostDefendStatStageChangeAbAttr,
        (_target, user, move) => user.getMoveType(move) === PokemonType.WATER && move.category !== MoveCategory.STATUS,
        Stat.DEF,
        2,
      )
      .build(),
    new AbBuilder(AbilityId.MERCILESS, 7) //
      .attr(
        ConditionalCritAbAttr,
        (_user, target, _move) =>
          target?.status?.effect === StatusEffect.TOXIC || target?.status?.effect === StatusEffect.POISON,
      )
      .build(),
    new AbBuilder(AbilityId.SHIELDS_DOWN, 7, -1) //
      // Change into Meteor Form on switch-in or turn end if HP >= 50%,
      // or Core Form if HP <= 50%.
      .attr(PostBattleInitFormChangeAbAttr, p => p.formIndex % 7)
      .attr(PostSummonFormChangeAbAttr, p => (p.formIndex % 7) + (p.getHpRatio() <= 0.5 ? 7 : 0))
      .attr(PostTurnFormChangeAbAttr, p => (p.formIndex % 7) + (p.getHpRatio() <= 0.5 ? 7 : 0))
      // All variants of Meteor Form are immune to status effects & Yawn
      .conditionalAttr(p => p.formIndex < 7, StatusEffectImmunityAbAttr)
      .conditionalAttr(p => p.formIndex < 7, BattlerTagImmunityAbAttr, BattlerTagType.DROWSY)
      .attr(NoFusionAbilityAbAttr)
      .attr(NoTransformAbilityAbAttr)
      .uncopiable()
      .unreplaceable()
      .unsuppressable()
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.STAKEOUT, 7) //
      .attr(MovePowerBoostAbAttr, (_user, target, _move) => !!target?.turnData.switchedInThisTurn, 2)
      .build(),
    new AbBuilder(AbilityId.WATER_BUBBLE, 7) //
      .attr(ReceivedTypeDamageMultiplierAbAttr, PokemonType.FIRE, 0.5)
      .attr(MoveTypePowerBoostAbAttr, PokemonType.WATER, 2)
      .attr(StatusEffectImmunityAbAttr, StatusEffect.BURN)
      .attr(PostSummonHealStatusAbAttr, StatusEffect.BURN)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.STEELWORKER, 7) //
      .attr(MoveTypePowerBoostAbAttr, PokemonType.STEEL)
      .build(),
    new AbBuilder(AbilityId.BERSERK, 7) //
      .attr(
        PostDefendHpGatedStatStageChangeAbAttr,
        (_target, _user, move) => move.category !== MoveCategory.STATUS,
        0.5,
        [Stat.SPATK],
        1,
      )
      .condition(sheerForceHitDisableAbCondition)
      .build(),
    new AbBuilder(AbilityId.SLUSH_RUSH, 7) //
      .attr(StatMultiplierAbAttr, Stat.SPD, 2)
      .condition(getWeatherCondition(WeatherType.HAIL, WeatherType.SNOW))
      .build(),
    new AbBuilder(AbilityId.LONG_REACH, 7) //
      .attr(IgnoreContactAbAttr)
      .build(),
    new AbBuilder(AbilityId.LIQUID_VOICE, 7) //
      .attr(
        MoveTypeChangeAbAttr,
        PokemonType.WATER,
        (user, target, move) =>
          move.hasFlag(MoveFlags.SOUND_BASED) && anyTypeMoveConversionCondition(user, target, move),
      )
      .build(),
    new AbBuilder(AbilityId.TRIAGE, 7) //
      .attr(ChangeMovePriorityAbAttr, (_pokemon, move) => move.hasFlag(MoveFlags.TRIAGE_MOVE), 3)
      .build(),
    new AbBuilder(AbilityId.GALVANIZE, 7) //
      .attr(MoveTypeChangeAbAttr, PokemonType.ELECTRIC, normalTypeMoveConversionCondition)
      .attr(MovePowerBoostAbAttr, normalTypeMoveConversionCondition, 1.2)
      .build(),
    new AbBuilder(AbilityId.SURGE_SURFER, 7) //
      .conditionalAttr(getTerrainCondition(TerrainType.ELECTRIC), StatMultiplierAbAttr, Stat.SPD, 2)
      .build(),
    new AbBuilder(AbilityId.SCHOOLING, 7, -1) //
      .attr(PostBattleInitFormChangeAbAttr, () => 0)
      .attr(PostSummonFormChangeAbAttr, p => (p.level < 20 || p.getHpRatio() <= 0.25 ? 0 : 1))
      .attr(PostTurnFormChangeAbAttr, p => (p.level < 20 || p.getHpRatio() <= 0.25 ? 0 : 1))
      .attr(NoFusionAbilityAbAttr)
      .uncopiable()
      .unreplaceable()
      .unsuppressable()
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.DISGUISE, 7) //
      .attr(NoTransformAbilityAbAttr)
      .attr(NoFusionAbilityAbAttr)
      // Add BattlerTagType.DISGUISE if the pokemon is in its disguised form
      .conditionalAttr(
        pokemon => pokemon.formIndex === 0,
        PostSummonAddBattlerTagAbAttr,
        BattlerTagType.DISGUISE,
        0,
        false,
      )
      .attr(
        FormBlockDamageAbAttr,
        (target, user, move) => !!target.getTag(BattlerTagType.DISGUISE) && target.getMoveEffectiveness(user, move) > 0,
        0,
        BattlerTagType.DISGUISE,
        (pokemon, abilityName) =>
          i18next.t("abilityTriggers:disguiseAvoidedDamage", {
            pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
            abilityName,
          }),
        pokemon => toDmgValue(pokemon.getMaxHp() / 8),
      )
      .attr(PostBattleInitFormChangeAbAttr, () => 0)
      .attr(PostFaintFormChangeAbAttr, () => 0)
      .uncopiable()
      .unreplaceable()
      .unsuppressable()
      .bypassFaint()
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.BATTLE_BOND, 7) //
      .conditionalAttr(
        p => p.species.speciesId === SpeciesId.GRENINJA,
        PostVictoryFormChangeAbAttr,
        () => 2,
      )
      .conditionalAttr(
        p => p.species.speciesId === SpeciesId.GRENINJA,
        PostBattleInitFormChangeAbAttr,
        () => 1,
      )
      .conditionalAttr(
        p => p.species.speciesId === SpeciesId.GRENINJA,
        PostFaintFormChangeAbAttr,
        () => 1,
      )
      .conditionalAttr(
        p => p.species.speciesId !== SpeciesId.GRENINJA && !p.summonData.abilitiesApplied.has(AbilityId.BATTLE_BOND),
        PostVictoryStatStageChangeAbAttr,
        [Stat.ATK, Stat.SPATK, Stat.SPD],
        1,
      )
      .attr(NoFusionAbilityAbAttr)
      .uncopiable()
      .unreplaceable()
      .unsuppressable()
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.POWER_CONSTRUCT, 7) //
      // Change to 10% complete or 50% complete on switchout/turn end if at <50% HP;
      // revert to 10% PC or 50% PC before a new battle starts
      .conditionalAttr(
        p => p.formIndex === 4 || p.formIndex === 5,
        PostBattleInitFormChangeAbAttr,
        p => p.formIndex - 2,
      )
      .conditionalAttr(
        p => p.getHpRatio() <= 0.5 && (p.formIndex === 2 || p.formIndex === 3),
        PostSummonFormChangeAbAttr,
        p => p.formIndex + 2,
      )
      .conditionalAttr(
        p => p.getHpRatio() <= 0.5 && (p.formIndex === 2 || p.formIndex === 3),
        PostTurnFormChangeAbAttr,
        p => p.formIndex + 2,
      )
      .conditionalAttr(
        p => p.formIndex === 4 || p.formIndex === 5,
        PostFaintFormChangeAbAttr,
        p => p.formIndex - 2,
      )
      .attr(NoFusionAbilityAbAttr)
      .uncopiable()
      .unreplaceable()
      .unsuppressable()
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.CORROSION, 7) //
      .attr(
        IgnoreTypeStatusEffectImmunityAbAttr,
        [StatusEffect.POISON, StatusEffect.TOXIC],
        [PokemonType.STEEL, PokemonType.POISON],
      )
      .build(),
    new AbBuilder(AbilityId.COMATOSE, 7) //
      .attr(StatusEffectImmunityAbAttr, ...getNonVolatileStatusEffects())
      .attr(BattlerTagImmunityAbAttr, BattlerTagType.DROWSY)
      .uncopiable()
      .unreplaceable()
      .unsuppressable()
      .build(),
    new AbBuilder(AbilityId.QUEENLY_MAJESTY, 7) //
      .attr(FieldPriorityMoveImmunityAbAttr)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.INNARDS_OUT, 7) //
      .attr(PostFaintHPDamageAbAttr)
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.DANCER, 7) //
      .attr(PostDancingMoveAbAttr)
      /*
       * Incorrect interations with:
       * Petal Dance (should not lock in or count down timer; currently does both)
       * Flinches (due to tag being removed earlier)
       * Failed/protected moves (should not trigger if original move is protected against)
       */
      .edgeCase()
      .build(),
    new AbBuilder(AbilityId.BATTERY, 7) //
      .attr(AllyMoveCategoryPowerBoostAbAttr, [MoveCategory.SPECIAL], 1.3)
      .build(),
    new AbBuilder(AbilityId.FLUFFY, 7) //
      .attr(
        ReceivedMoveDamageMultiplierAbAttr,
        (target, user, move) => move.doesFlagEffectApply({ flag: MoveFlags.MAKES_CONTACT, user, target }),
        0.5,
      )
      .attr(ReceivedMoveDamageMultiplierAbAttr, (_target, user, move) => user.getMoveType(move) === PokemonType.FIRE, 2)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.DAZZLING, 7) //
      .attr(FieldPriorityMoveImmunityAbAttr)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.SOUL_HEART, 7) //
      .attr(PostKnockOutStatStageChangeAbAttr, Stat.SPATK, 1)
      .build(),
    new AbBuilder(AbilityId.TANGLING_HAIR, 7) //
      .attr(
        PostDefendStatStageChangeAbAttr,
        (target, user, move) => move.doesFlagEffectApply({ flag: MoveFlags.MAKES_CONTACT, user, target }),
        Stat.SPD,
        -1,
        false,
      )
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.RECEIVER, 7) //
      .attr(CopyFaintedAllyAbilityAbAttr)
      .uncopiable()
      .build(),
    new AbBuilder(AbilityId.POWER_OF_ALCHEMY, 7) //
      .attr(CopyFaintedAllyAbilityAbAttr)
      .uncopiable()
      .build(),
    new AbBuilder(AbilityId.BEAST_BOOST, 7) //
      .attr(
        PostVictoryStatStageChangeAbAttr,
        p => {
          let highestStat: EffectiveStat;
          let highestValue = 0;
          for (const s of EFFECTIVE_STATS) {
            const value = p.getStat(s, false);
            if (value > highestValue) {
              highestStat = s;
              highestValue = value;
            }
          }
          return highestStat!;
        },
        1,
      )
      .build(),
    new AbBuilder(AbilityId.RKS_SYSTEM, 7) //
      .attr(NoFusionAbilityAbAttr)
      .uncopiable()
      .unreplaceable()
      .unsuppressable()
      .build(),
    new AbBuilder(AbilityId.ELECTRIC_SURGE, 7) //
      .attr(PostSummonTerrainChangeAbAttr, TerrainType.ELECTRIC)
      .attr(PostBiomeChangeTerrainChangeAbAttr, TerrainType.ELECTRIC)
      .build(),
    new AbBuilder(AbilityId.PSYCHIC_SURGE, 7) //
      .attr(PostSummonTerrainChangeAbAttr, TerrainType.PSYCHIC)
      .attr(PostBiomeChangeTerrainChangeAbAttr, TerrainType.PSYCHIC)
      .build(),
    new AbBuilder(AbilityId.MISTY_SURGE, 7) //
      .attr(PostSummonTerrainChangeAbAttr, TerrainType.MISTY)
      .attr(PostBiomeChangeTerrainChangeAbAttr, TerrainType.MISTY)
      .build(),
    new AbBuilder(AbilityId.GRASSY_SURGE, 7) //
      .attr(PostSummonTerrainChangeAbAttr, TerrainType.GRASSY)
      .attr(PostBiomeChangeTerrainChangeAbAttr, TerrainType.GRASSY)
      .build(),
    new AbBuilder(AbilityId.FULL_METAL_BODY, 7) //
      .attr(ProtectStatAbAttr)
      .build(),
    new AbBuilder(AbilityId.SHADOW_SHIELD, 7) //
      .attr(ReceivedMoveDamageMultiplierAbAttr, (target, _user, _move) => target.isFullHp(), 0.5)
      .build(),
    new AbBuilder(AbilityId.PRISM_ARMOR, 7) //
      .attr(
        ReceivedMoveDamageMultiplierAbAttr,
        (target, user, move) => target.getMoveEffectiveness(user, move) >= 2,
        0.75,
      )
      .build(),
    new AbBuilder(AbilityId.NEUROFORCE, 7) //
      .attr(MovePowerBoostAbAttr, (user, target, move) => (target?.getMoveEffectiveness(user, move) ?? 1) >= 2, 1.25)
      .build(),
    new AbBuilder(AbilityId.INTREPID_SWORD, 8) //
      .attr(PostSummonStatStageChangeAbAttr, [Stat.ATK], 1, true)
      .build(),
    new AbBuilder(AbilityId.DAUNTLESS_SHIELD, 8) //
      .attr(PostSummonStatStageChangeAbAttr, [Stat.DEF], 1, true)
      .build(),
    new AbBuilder(AbilityId.LIBERO, 8) //
      .attr(PokemonTypeChangeAbAttr)
      //.condition((p) => !p.summonData.abilitiesApplied.includes(AbilityId.LIBERO)), //Gen 9 Implementation
      // TODO: needs testing on interaction with weather blockage
      .edgeCase()
      .build(),
    new AbBuilder(AbilityId.BALL_FETCH, 8) //
      .attr(FetchBallAbAttr)
      .condition(getOncePerBattleCondition(AbilityId.BALL_FETCH))
      .build(),
    new AbBuilder(AbilityId.COTTON_DOWN, 8) //
      .attr(
        PostDefendStatStageChangeAbAttr,
        (_target, _user, move) => move.category !== MoveCategory.STATUS,
        Stat.SPD,
        -1,
        false,
        true,
      )
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.PROPELLER_TAIL, 8) //
      .attr(BlockRedirectAbAttr)
      .build(),
    new AbBuilder(AbilityId.MIRROR_ARMOR, 8) //
      .attr(ReflectStatStageChangeAbAttr)
      .ignorable()
      .build(),
    /*
     * Right now, the logic is attached to Surf and Dive moves. Ideally, the post-defend/hit should be an
     * ability attribute but the current implementation of move effects for BattlerTag does not support this- in the case
     * where Cramorant is fainted.
     */
    new AbBuilder(AbilityId.GULP_MISSILE, 8) //
      .attr(NoTransformAbilityAbAttr)
      .attr(NoFusionAbilityAbAttr)
      .unsuppressable()
      .uncopiable()
      .unreplaceable()
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.STALWART, 8) //
      .attr(BlockRedirectAbAttr)
      .build(),
    new AbBuilder(AbilityId.STEAM_ENGINE, 8) //
      .attr(
        PostDefendStatStageChangeAbAttr,
        (_target, user, move) => {
          const moveType = user.getMoveType(move);
          return (
            move.category !== MoveCategory.STATUS && (moveType === PokemonType.FIRE || moveType === PokemonType.WATER)
          );
        },
        Stat.SPD,
        6,
      )
      .build(),
    new AbBuilder(AbilityId.PUNK_ROCK, 8) //
      .attr(MovePowerBoostAbAttr, (_user, _target, move) => move.hasFlag(MoveFlags.SOUND_BASED), 1.3)
      .attr(ReceivedMoveDamageMultiplierAbAttr, (_target, _user, move) => move.hasFlag(MoveFlags.SOUND_BASED), 0.5)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.SAND_SPIT, 8) //
      .attr(
        PostDefendWeatherChangeAbAttr,
        WeatherType.SANDSTORM,
        (_target, _user, move) => move.category !== MoveCategory.STATUS,
      )
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.ICE_SCALES, 8) //
      .attr(ReceivedMoveDamageMultiplierAbAttr, (_target, _user, move) => move.category === MoveCategory.SPECIAL, 0.5)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.RIPEN, 8) //
      .attr(DoubleBerryEffectAbAttr)
      .build(),
    new AbBuilder(AbilityId.ICE_FACE, 8, -2) //
      .attr(NoTransformAbilityAbAttr)
      .attr(NoFusionAbilityAbAttr)
      // Add BattlerTagType.ICE_FACE if the pokemon is in ice face form
      .conditionalAttr(
        pokemon => pokemon.formIndex === 0,
        PostSummonAddBattlerTagAbAttr,
        BattlerTagType.ICE_FACE,
        0,
        false,
      )
      // When summoned with active HAIL or SNOW, add BattlerTagType.ICE_FACE
      .conditionalAttr(
        getWeatherCondition(WeatherType.HAIL, WeatherType.SNOW),
        PostSummonAddBattlerTagAbAttr,
        BattlerTagType.ICE_FACE,
        0,
      )
      // When weather changes to HAIL or SNOW while pokemon is fielded, add BattlerTagType.ICE_FACE
      .attr(PostWeatherChangeAddBattlerTagAbAttr, BattlerTagType.ICE_FACE, 0, WeatherType.HAIL, WeatherType.SNOW)
      .attr(
        FormBlockDamageAbAttr,
        (target, _user, move) => move.category === MoveCategory.PHYSICAL && !!target.getTag(BattlerTagType.ICE_FACE),
        0,
        BattlerTagType.ICE_FACE,
        (pokemon, abilityName) =>
          i18next.t("abilityTriggers:iceFaceAvoidedDamage", {
            pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
            abilityName,
          }),
      )
      .attr(PostBattleInitFormChangeAbAttr, () => 0)
      .uncopiable()
      .unreplaceable()
      .unsuppressable()
      .bypassFaint()
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.POWER_SPOT, 8) //
      .attr(AllyMoveCategoryPowerBoostAbAttr, [MoveCategory.SPECIAL, MoveCategory.PHYSICAL], 1.3)
      .build(),
    new AbBuilder(AbilityId.MIMICRY, 8, -1) //
      .attr(TerrainEventTypeChangeAbAttr)
      .build(),
    new AbBuilder(AbilityId.SCREEN_CLEANER, 8) //
      .attr(PostSummonRemoveArenaTagAbAttr, [ArenaTagType.AURORA_VEIL, ArenaTagType.LIGHT_SCREEN, ArenaTagType.REFLECT])
      .build(),
    new AbBuilder(AbilityId.STEELY_SPIRIT, 8) //
      .attr(UserFieldMoveTypePowerBoostAbAttr, PokemonType.STEEL)
      .build(),
    new AbBuilder(AbilityId.PERISH_BODY, 8) //
      .attr(PostDefendPerishSongAbAttr, 4)
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.WANDERING_SPIRIT, 8) //
      .attr(PostDefendAbilitySwapAbAttr)
      .bypassFaint()
      .edgeCase() // interacts incorrectly with rock head. It's meant to switch abilities before recoil would apply so that a pokemon with rock head would lose rock head first and still take the recoil
      .build(),
    new AbBuilder(AbilityId.GORILLA_TACTICS, 8) //
      .attr(GorillaTacticsAbAttr)
      // TODO: Verify whether Gorilla Tactics increases struggle's power or not
      .edgeCase()
      .build(),
    new AbBuilder(AbilityId.NEUTRALIZING_GAS, 8, 2) //
      .attr(PostSummonAddArenaTagAbAttr, true, ArenaTagType.NEUTRALIZING_GAS, 0)
      .attr(PreLeaveFieldRemoveSuppressAbilitiesSourceAbAttr)
      .uncopiable()
      .attr(NoTransformAbilityAbAttr)
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.PASTEL_VEIL, 8) //
      .attr(PostSummonUserFieldRemoveStatusEffectAbAttr, StatusEffect.POISON, StatusEffect.TOXIC)
      .attr(UserFieldStatusEffectImmunityAbAttr, StatusEffect.POISON, StatusEffect.TOXIC)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.HUNGER_SWITCH, 8) //
      .attr(PostTurnFormChangeAbAttr, p => (p.getFormKey() ? 0 : 1))
      .attr(PostTurnFormChangeAbAttr, p => (p.getFormKey() ? 1 : 0))
      .attr(NoTransformAbilityAbAttr)
      .attr(NoFusionAbilityAbAttr)
      .condition(pokemon => !pokemon.isTerastallized)
      .uncopiable()
      .unreplaceable()
      .build(),
    new AbBuilder(AbilityId.QUICK_DRAW, 8) //
      .attr(BypassSpeedChanceAbAttr, 30)
      .build(),
    new AbBuilder(AbilityId.UNSEEN_FIST, 8) //
      .attr(IgnoreProtectOnContactAbAttr)
      .build(),
    new AbBuilder(AbilityId.CURIOUS_MEDICINE, 8) //
      .attr(PostSummonClearAllyStatStagesAbAttr)
      .build(),
    new AbBuilder(AbilityId.TRANSISTOR, 8) //
      .attr(MoveTypePowerBoostAbAttr, PokemonType.ELECTRIC, 1.3)
      .build(),
    new AbBuilder(AbilityId.DRAGONS_MAW, 8) //
      .attr(MoveTypePowerBoostAbAttr, PokemonType.DRAGON)
      .build(),
    new AbBuilder(AbilityId.CHILLING_NEIGH, 8) //
      .attr(PostVictoryStatStageChangeAbAttr, Stat.ATK, 1)
      .build(),
    new AbBuilder(AbilityId.GRIM_NEIGH, 8) //
      .attr(PostVictoryStatStageChangeAbAttr, Stat.SPATK, 1)
      .build(),
    new AbBuilder(AbilityId.AS_ONE_GLASTRIER, 8, 1) //
      .attr(PostSummonMessageAbAttr, (pokemon: Pokemon) =>
        i18next.t("abilityTriggers:postSummonAsOneGlastrier", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        }),
      )
      .attr(PreventBerryUseAbAttr)
      .attr(PostVictoryStatStageChangeAbAttr, Stat.ATK, 1)
      .uncopiable()
      .unreplaceable()
      .unsuppressable()
      .build(),
    new AbBuilder(AbilityId.AS_ONE_SPECTRIER, 8, 1) //
      .attr(PostSummonMessageAbAttr, (pokemon: Pokemon) =>
        i18next.t("abilityTriggers:postSummonAsOneSpectrier", {
          pokemonNameWithAffix: getPokemonNameWithAffix(pokemon),
        }),
      )
      .attr(PreventBerryUseAbAttr)
      .attr(PostVictoryStatStageChangeAbAttr, Stat.SPATK, 1)
      .uncopiable()
      .unreplaceable()
      .unsuppressable()
      .build(),
    new AbBuilder(AbilityId.LINGERING_AROMA, 9) //
      .attr(PostDefendAbilityGiveAbAttr, AbilityId.LINGERING_AROMA)
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.SEED_SOWER, 9) //
      .attr(PostDefendTerrainChangeAbAttr, TerrainType.GRASSY)
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.THERMAL_EXCHANGE, 9) //
      .attr(
        PostDefendStatStageChangeAbAttr,
        (_target, user, move) => user.getMoveType(move) === PokemonType.FIRE && move.category !== MoveCategory.STATUS,
        Stat.ATK,
        1,
      )
      .attr(StatusEffectImmunityAbAttr, StatusEffect.BURN)
      .attr(PostSummonHealStatusAbAttr, StatusEffect.BURN)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.ANGER_SHELL, 9) //
      .attr(
        PostDefendHpGatedStatStageChangeAbAttr,
        (_target, _user, move) => move.category !== MoveCategory.STATUS,
        0.5,
        [Stat.ATK, Stat.SPATK, Stat.SPD],
        1,
      )
      .attr(
        PostDefendHpGatedStatStageChangeAbAttr,
        (_target, _user, move) => move.category !== MoveCategory.STATUS,
        0.5,
        [Stat.DEF, Stat.SPDEF],
        -1,
      )
      .condition(sheerForceHitDisableAbCondition)
      .build(),
    new AbBuilder(AbilityId.PURIFYING_SALT, 9) //
      .attr(StatusEffectImmunityAbAttr)
      .attr(ReceivedTypeDamageMultiplierAbAttr, PokemonType.GHOST, 0.5)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.WELL_BAKED_BODY, 9) //
      .attr(TypeImmunityStatStageChangeAbAttr, PokemonType.FIRE, Stat.DEF, 2)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.WIND_RIDER, 9) //
      .attr(
        MoveImmunityStatStageChangeAbAttr,
        (pokemon, attacker, move) =>
          pokemon !== attacker && move.hasFlag(MoveFlags.WIND_MOVE) && move.category !== MoveCategory.STATUS,
        Stat.ATK,
        1,
      )
      .attr(PostSummonStatStageChangeOnArenaAbAttr, ArenaTagType.TAILWIND)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.GUARD_DOG, 9) //
      .attr(PostIntimidateStatStageChangeAbAttr, [Stat.ATK], 1, true)
      .attr(ForceSwitchOutImmunityAbAttr)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.ROCKY_PAYLOAD, 9) //
      .attr(MoveTypePowerBoostAbAttr, PokemonType.ROCK)
      .build(),
    new AbBuilder(AbilityId.WIND_POWER, 9) //
      .attr(
        PostDefendApplyBattlerTagAbAttr,
        (_target, _user, move) => move.hasFlag(MoveFlags.WIND_MOVE),
        BattlerTagType.CHARGED,
      )
      .build(),
    new AbBuilder(AbilityId.ZERO_TO_HERO, 9) //
      .uncopiable()
      .unreplaceable()
      .unsuppressable()
      .attr(NoTransformAbilityAbAttr)
      .attr(NoFusionAbilityAbAttr)
      .attr(PostBattleInitFormChangeAbAttr, () => 0)
      .attr(PreSwitchOutFormChangeAbAttr, pokemon => (pokemon.isFainted() ? pokemon.formIndex : 1))
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.COMMANDER, 9) //
      .attr(CommanderAbAttr)
      .attr(DoubleBattleChanceAbAttr)
      .uncopiable()
      .edgeCase() // Encore, Frenzy, and other non-`TURN_END` tags don't lapse correctly on the commanding Pokemon.
      .build(),
    new AbBuilder(AbilityId.ELECTROMORPHOSIS, 9) //
      .attr(
        PostDefendApplyBattlerTagAbAttr,
        (_target, _user, move) => move.category !== MoveCategory.STATUS,
        BattlerTagType.CHARGED,
      )
      .build(),
    new AbBuilder(AbilityId.PROTOSYNTHESIS, 9, -2) //
      .conditionalAttr(
        getWeatherCondition(WeatherType.SUNNY, WeatherType.HARSH_SUN),
        PostSummonAddBattlerTagAbAttr,
        BattlerTagType.PROTOSYNTHESIS,
        0,
        true,
      )
      .attr(
        PostWeatherChangeAddBattlerTagAbAttr,
        BattlerTagType.PROTOSYNTHESIS,
        0,
        WeatherType.SUNNY,
        WeatherType.HARSH_SUN,
      )
      .uncopiable()
      .attr(NoTransformAbilityAbAttr)
      .build(),
    new AbBuilder(AbilityId.QUARK_DRIVE, 9, -2) //
      .conditionalAttr(
        getTerrainCondition(TerrainType.ELECTRIC),
        PostSummonAddBattlerTagAbAttr,
        BattlerTagType.QUARK_DRIVE,
        0,
        true,
      )
      .attr(PostTerrainChangeAddBattlerTagAttr, BattlerTagType.QUARK_DRIVE, 0, TerrainType.ELECTRIC)
      .uncopiable()
      .attr(NoTransformAbilityAbAttr)
      .build(),
    new AbBuilder(AbilityId.GOOD_AS_GOLD, 9) //
      .attr(
        MoveImmunityAbAttr,
        (pokemon, attacker, move) =>
          pokemon !== attacker
          && move.category === MoveCategory.STATUS
          && ![MoveTarget.ENEMY_SIDE, MoveTarget.BOTH_SIDES, MoveTarget.USER_SIDE].includes(move.moveTarget),
      )
      .edgeCase() // Heal Bell should not cure the status of a Pokemon with Good As Gold
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.VESSEL_OF_RUIN, 9) //
      .attr(FieldMultiplyStatAbAttr, Stat.SPATK, 0.75)
      .attr(PostSummonMessageAbAttr, user =>
        i18next.t("abilityTriggers:postSummonVesselOfRuin", {
          pokemonNameWithAffix: getPokemonNameWithAffix(user),
          statName: i18next.t(getStatKey(Stat.SPATK)),
        }),
      )
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.SWORD_OF_RUIN, 9) //
      .attr(FieldMultiplyStatAbAttr, Stat.DEF, 0.75)
      .attr(PostSummonMessageAbAttr, user =>
        i18next.t("abilityTriggers:postSummonSwordOfRuin", {
          pokemonNameWithAffix: getPokemonNameWithAffix(user),
          statName: i18next.t(getStatKey(Stat.DEF)),
        }),
      )
      .build(),
    new AbBuilder(AbilityId.TABLETS_OF_RUIN, 9) //
      .attr(FieldMultiplyStatAbAttr, Stat.ATK, 0.75)
      .attr(PostSummonMessageAbAttr, user =>
        i18next.t("abilityTriggers:postSummonTabletsOfRuin", {
          pokemonNameWithAffix: getPokemonNameWithAffix(user),
          statName: i18next.t(getStatKey(Stat.ATK)),
        }),
      )
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.BEADS_OF_RUIN, 9) //
      .attr(FieldMultiplyStatAbAttr, Stat.SPDEF, 0.75)
      .attr(PostSummonMessageAbAttr, user =>
        i18next.t("abilityTriggers:postSummonBeadsOfRuin", {
          pokemonNameWithAffix: getPokemonNameWithAffix(user),
          statName: i18next.t(getStatKey(Stat.SPDEF)),
        }),
      )
      .build(),
    new AbBuilder(AbilityId.ORICHALCUM_PULSE, 9) //
      .attr(PostSummonWeatherChangeAbAttr, WeatherType.SUNNY)
      .attr(PostBiomeChangeWeatherChangeAbAttr, WeatherType.SUNNY)
      .conditionalAttr(
        getWeatherCondition(WeatherType.SUNNY, WeatherType.HARSH_SUN),
        StatMultiplierAbAttr,
        Stat.ATK,
        4 / 3,
      )
      .build(),
    new AbBuilder(AbilityId.HADRON_ENGINE, 9) //
      .attr(PostSummonTerrainChangeAbAttr, TerrainType.ELECTRIC)
      .attr(PostBiomeChangeTerrainChangeAbAttr, TerrainType.ELECTRIC)
      .conditionalAttr(getTerrainCondition(TerrainType.ELECTRIC), StatMultiplierAbAttr, Stat.SPATK, 4 / 3)
      .build(),
    new AbBuilder(AbilityId.OPPORTUNIST, 9) //
      .attr(StatStageChangeCopyAbAttr)
      .build(),
    new AbBuilder(AbilityId.CUD_CHEW, 9) //
      .attr(CudChewConsumeBerryAbAttr)
      .attr(CudChewRecordBerryAbAttr)
      .build(),
    new AbBuilder(AbilityId.SHARPNESS, 9) //
      .attr(MovePowerBoostAbAttr, (_user, _target, move) => move.hasFlag(MoveFlags.SLICING_MOVE), 1.5)
      .build(),
    new AbBuilder(AbilityId.SUPREME_OVERLORD, 9) //
      .conditionalAttr(
        p => (p.isPlayer() ? globalScene.arena.playerFaints : globalScene.currentBattle.enemyFaints) > 0,
        PostSummonAddBattlerTagAbAttr,
        BattlerTagType.SUPREME_OVERLORD,
        0,
        true,
      )
      .edgeCase() // Tag is not tied to ability, so suppression/removal etc will not function until a structure to allow this is implemented
      .build(),
    new AbBuilder(AbilityId.COSTAR, 9, -2) //
      .attr(PostSummonCopyAllyStatsAbAttr)
      .build(),
    new AbBuilder(AbilityId.TOXIC_DEBRIS, 9) //
      .attr(
        PostDefendApplyArenaTrapTagAbAttr,
        (_target, _user, move) => move.category === MoveCategory.PHYSICAL,
        ArenaTagType.TOXIC_SPIKES,
      )
      .bypassFaint()
      .build(),
    new AbBuilder(AbilityId.ARMOR_TAIL, 9) //
      .attr(FieldPriorityMoveImmunityAbAttr)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.EARTH_EATER, 9) //
      .attr(TypeImmunityHealAbAttr, PokemonType.GROUND)
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.MYCELIUM_MIGHT, 9) //
      .attr(
        ChangeMovePriorityInBracketAbAttr,
        (_pokemon, move) => move.category === MoveCategory.STATUS,
        MovePriorityInBracket.LAST,
      )
      .attr(PreventBypassSpeedChanceAbAttr, (_pokemon, move) => move.category === MoveCategory.STATUS)
      .attr(MoveAbilityBypassAbAttr, (_pokemon, move: Move) => move.category === MoveCategory.STATUS)
      .build(),
    new AbBuilder(AbilityId.MINDS_EYE, 9) //
      .attr(IgnoreTypeImmunityAbAttr, PokemonType.GHOST, [PokemonType.NORMAL, PokemonType.FIGHTING])
      .attr(ProtectStatAbAttr, Stat.ACC)
      .attr(IgnoreOpponentStatStagesAbAttr, [Stat.EVA])
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.SUPERSWEET_SYRUP, 9) //
      .attr(PostSummonStatStageChangeAbAttr, [Stat.EVA], -1)
      .build(),
    new AbBuilder(AbilityId.HOSPITALITY, 9, -2) //
      .attr(PostSummonAllyHealAbAttr, 4, true)
      .build(),
    new AbBuilder(AbilityId.TOXIC_CHAIN, 9) //
      .attr(PostAttackApplyStatusEffectAbAttr, false, 30, StatusEffect.TOXIC)
      .build(),
    new AbBuilder(AbilityId.EMBODY_ASPECT_TEAL, 9) //
      .attr(PostTeraFormChangeStatChangeAbAttr, [Stat.SPD], 1) // Activates immediately upon Terastallizing, as well as upon switching in while Terastallized
      .conditionalAttr(pokemon => pokemon.isTerastallized, PostSummonStatStageChangeAbAttr, [Stat.SPD], 1, true)
      .uncopiable()
      .unreplaceable() // TODO is this true?
      .attr(NoTransformAbilityAbAttr)
      .build(),
    new AbBuilder(AbilityId.EMBODY_ASPECT_WELLSPRING, 9) //
      .attr(PostTeraFormChangeStatChangeAbAttr, [Stat.SPDEF], 1)
      .conditionalAttr(pokemon => pokemon.isTerastallized, PostSummonStatStageChangeAbAttr, [Stat.SPDEF], 1, true)
      .uncopiable()
      .unreplaceable()
      .attr(NoTransformAbilityAbAttr)
      .build(),
    new AbBuilder(AbilityId.EMBODY_ASPECT_HEARTHFLAME, 9) //
      .attr(PostTeraFormChangeStatChangeAbAttr, [Stat.ATK], 1)
      .conditionalAttr(pokemon => pokemon.isTerastallized, PostSummonStatStageChangeAbAttr, [Stat.ATK], 1, true)
      .uncopiable()
      .unreplaceable()
      .attr(NoTransformAbilityAbAttr)
      .build(),
    new AbBuilder(AbilityId.EMBODY_ASPECT_CORNERSTONE, 9) //
      .attr(PostTeraFormChangeStatChangeAbAttr, [Stat.DEF], 1)
      .conditionalAttr(pokemon => pokemon.isTerastallized, PostSummonStatStageChangeAbAttr, [Stat.DEF], 1, true)
      .uncopiable()
      .unreplaceable()
      .attr(NoTransformAbilityAbAttr)
      .build(),
    new AbBuilder(AbilityId.TERA_SHIFT, 9, 2) //
      .attr(PostSummonFormChangeAbAttr, p => (p.getFormKey() ? 0 : 1))
      .uncopiable()
      .unreplaceable()
      .unsuppressable()
      .attr(NoTransformAbilityAbAttr)
      .attr(NoFusionAbilityAbAttr)
      .build(),
    new AbBuilder(AbilityId.TERA_SHELL, 9) //
      .attr(FullHpResistTypeAbAttr)
      .uncopiable()
      .ignorable()
      .build(),
    new AbBuilder(AbilityId.TERAFORM_ZERO, 9) //
      .attr(ClearWeatherAbAttr)
      .attr(ClearTerrainAbAttr)
      .uncopiable()
      .condition(getOncePerBattleCondition(AbilityId.TERAFORM_ZERO))
      .build(),
    new AbBuilder(AbilityId.POISON_PUPPETEER, 9) //
      .uncopiable()
      .attr(ConfusionOnStatusEffectAbAttr, StatusEffect.POISON, StatusEffect.TOXIC)
      .build(),
  );
}

/**
 * Creates an ability condition that causes the ability to fail if that ability
 * has already been used by that pokemon that battle. It requires an ability to
 * be specified due to current limitations in how conditions on abilities work.
 * @param ability The ability to check if it's already been applied
 * @returns The condition
 */
function getOncePerBattleCondition(ability: AbilityId): AbAttrCondition {
  return (pokemon: Pokemon) => {
    return !pokemon.waveData.abilitiesApplied.has(ability);
  };
}

function getTerrainCondition(...terrainTypes: TerrainType[]): AbAttrCondition {
  return (_pokemon: Pokemon) => {
    const terrainType = globalScene.arena.terrain?.terrainType;
    return !!terrainType && terrainTypes.indexOf(terrainType) > -1;
  };
}

/**
 * Condition used by {@link https://bulbapedia.bulbagarden.net/wiki/Anticipation_(Ability) | Anticipation}
 * to show a message if any opponent knows a "dangerous" move.
 * @param pokemon - The {@linkcode Pokemon} with this ability
 * @returns Whether the message should be shown
 */
const anticipationCondition: AbAttrCondition = (pokemon: Pokemon) =>
  pokemon.getOpponents().some(opponent =>
    opponent.moveset.some(movesetMove => {
      const move = movesetMove.getMove();
      if (!move.is("AttackMove")) {
        return false;
      }

      if (move.hasAttr("OneHitKOAttr")) {
        return true;
      }

      // Check whether the move's base type (not accounting for variable type changes) is super effective
      // Edge case for hidden power, type is computed
      const typeHolder = new NumberHolder(move.type);
      applyMoveAttrs("HiddenPowerTypeAttr", opponent, pokemon, move, typeHolder);

      const eff = pokemon.getAttackTypeEffectiveness(typeHolder.value, {
        source: opponent,
        ignoreStrongWinds: true,
        move,
      });
      return eff >= 2;
    }),
  );

/**
 * Condition function checking whether a move can have its type changed by an ability.
 * - Variable-type moves (e.g. {@linkcode MoveId.MULTI_ATTACK}) can't have their type changed.
 * - Tera-based moves can't have their type changed if the move's type would be changed due to the user being Terastallized.
 * @returns Whether the move can have its type changed by an ability
 * @remarks
 * Used for {@link https://bulbapedia.bulbagarden.net/wiki/Normalize_(Ability) | Normalize}
 * and as part of the conditions for similar type-changing abilities
 */
const anyTypeMoveConversionCondition: PokemonAttackCondition = (user, _target, move): boolean => {
  if (noAbilityTypeOverrideMoves.has(move.id)) {
    return false;
  }

  if (!user.isTerastallized) {
    return true;
  }

  if (move.id === MoveId.TERA_BLAST) {
    return false;
  }
  if (
    move.id === MoveId.TERA_STARSTORM
    && user.getTeraType() === PokemonType.STELLAR
    && user.hasSpecies(SpeciesId.TERAPAGOS)
  ) {
    return false;
  }

  return true;
};

/**
 * Similar to {@linkcode anyTypeMoveConversionCondition}, except that the given move must also be Normal-type.
 * @remarks
 * Used for {@link https://bulbapedia.bulbagarden.net/wiki/Pixilate_(Ability) | Pixilate} et al.
 */
const normalTypeMoveConversionCondition: PokemonAttackCondition = (user, target, move): boolean =>
  move.type === PokemonType.NORMAL && anyTypeMoveConversionCondition(user, target, move);

/**
 * Condition function to applied to abilities related to Sheer Force.
 * Checks if last move used against target was affected by a Sheer Force user and:
 * Disables: Color Change, Pickpocket, Berserk, Anger Shell, Wimp Out, Emergency Exit
 * @returns An {@linkcode AbAttrCondition} to disable the ability under the proper conditions.
 */
const sheerForceHitDisableAbCondition: AbAttrCondition = (pokemon: Pokemon): boolean => {
  const lastReceivedAttack = pokemon.turnData.attacksReceived[0];
  if (!lastReceivedAttack) {
    return true;
  }

  const lastAttacker = pokemon.getOpponents().find(p => p.id === lastReceivedAttack.sourceId);
  if (!lastAttacker) {
    return true;
  }

  /** `true` if the last move's chance is above 0 and the last attacker's ability is sheer force */
  const sheerForceAffected =
    allMoves[lastReceivedAttack.move].chance >= 0 && lastAttacker.hasAbility(AbilityId.SHEER_FORCE);

  return !sheerForceAffected;
};
