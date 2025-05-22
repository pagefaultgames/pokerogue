import type { MoveAnim } from "#app/data/battle-anims";
import type { AddEnemyBuffModifierPhase } from "#app/phases/add-enemy-buff-modifier-phase";
import type { AttemptCapturePhase } from "#app/phases/attempt-capture-phase";
import type { AttemptRunPhase } from "#app/phases/attempt-run-phase";
import type { BattleEndPhase } from "#app/phases/battle-end-phase";
import type { BerryPhase } from "#app/phases/berry-phase";
import type { CheckStatusEffectPhase } from "#app/phases/check-status-effect-phase";
import type { CheckSwitchPhase } from "#app/phases/check-switch-phase";
import type { CommandPhase } from "#app/phases/command-phase";
import type { CommonAnimPhase } from "#app/phases/common-anim-phase";
import type { DamageAnimPhase } from "#app/phases/damage-anim-phase";
import type { EggHatchPhase } from "#app/phases/egg-hatch-phase";
import type { EggLapsePhase } from "#app/phases/egg-lapse-phase";
import type { EggSummaryPhase } from "#app/phases/egg-summary-phase";
import type { EncounterPhase } from "#app/phases/encounter-phase";
import type { EndCardPhase } from "#app/phases/end-card-phase";
import type { EndEvolutionPhase } from "#app/phases/end-evolution-phase";
import type { EnemyCommandPhase } from "#app/phases/enemy-command-phase";
import type { EvolutionPhase } from "#app/phases/evolution-phase";
import type { ExpPhase } from "#app/phases/exp-phase";
import type { FaintPhase } from "#app/phases/faint-phase";
import type { FormChangePhase } from "#app/phases/form-change-phase";
import type { GameOverModifierRewardPhase } from "#app/phases/game-over-modifier-reward-phase";
import type { GameOverPhase } from "#app/phases/game-over-phase";
import type { HideAbilityPhase } from "#app/phases/hide-ability-phase";
import type { HidePartyExpBarPhase } from "#app/phases/hide-party-exp-bar-phase";
import type { LearnMovePhase } from "#app/phases/learn-move-phase";
import type { LevelCapPhase } from "#app/phases/level-cap-phase";
import type { LevelUpPhase } from "#app/phases/level-up-phase";
import type { LoadMoveAnimPhase } from "#app/phases/load-move-anim-phase";
import type { LoginPhase } from "#app/phases/login-phase";
import type { MessagePhase } from "#app/phases/message-phase";
import type { ModifierRewardPhase } from "#app/phases/modifier-reward-phase";
import type { MoneyRewardPhase } from "#app/phases/money-reward-phase";
import type { MoveAnimPhase } from "#app/phases/move-anim-phase";
import type { MoveChargePhase } from "#app/phases/move-charge-phase";
import type { MoveEffectPhase } from "#app/phases/move-effect-phase";
import type { MoveEndPhase } from "#app/phases/move-end-phase";
import type { MoveHeaderPhase } from "#app/phases/move-header-phase";
import type { MovePhase } from "#app/phases/move-phase";
import type {
  MysteryEncounterPhase,
  MysteryEncounterOptionSelectedPhase,
  MysteryEncounterBattlePhase,
  MysteryEncounterRewardsPhase,
  PostMysteryEncounterPhase,
  MysteryEncounterBattleStartCleanupPhase,
} from "#app/phases/mystery-encounter-phases";
import type { NewBattlePhase } from "#app/phases/new-battle-phase";
import type { NewBiomeEncounterPhase } from "#app/phases/new-biome-encounter-phase";
import type { NextEncounterPhase } from "#app/phases/next-encounter-phase";
import type { ObtainStatusEffectPhase } from "#app/phases/obtain-status-effect-phase";
import type { PartyExpPhase } from "#app/phases/party-exp-phase";
import type { PartyHealPhase } from "#app/phases/party-heal-phase";
import type { PokemonAnimPhase } from "#app/phases/pokemon-anim-phase";
import type { PokemonHealPhase } from "#app/phases/pokemon-heal-phase";
import type { PokemonTransformPhase } from "#app/phases/pokemon-transform-phase";
import type { PostGameOverPhase } from "#app/phases/post-game-over-phase";
import type { PostSummonPhase } from "#app/phases/post-summon-phase";
import type { PostTurnStatusEffectPhase } from "#app/phases/post-turn-status-effect-phase";
import type { QuietFormChangePhase } from "#app/phases/quiet-form-change-phase";
import type { ReloadSessionPhase } from "#app/phases/reload-session-phase";
import type { ResetStatusPhase } from "#app/phases/reset-status-phase";
import type { ReturnPhase } from "#app/phases/return-phase";
import type { RevivalBlessingPhase } from "#app/phases/revival-blessing-phase";
import type { RibbonModifierRewardPhase } from "#app/phases/ribbon-modifier-reward-phase";
import type { ScanIvsPhase } from "#app/phases/scan-ivs-phase";
import type { SelectBiomePhase } from "#app/phases/select-biome-phase";
import type { SelectChallengePhase } from "#app/phases/select-challenge-phase";
import type { SelectGenderPhase } from "#app/phases/select-gender-phase";
import type { SelectModifierPhase } from "#app/phases/select-modifier-phase";
import type { SelectStarterPhase } from "#app/phases/select-starter-phase";
import type { SelectTargetPhase } from "#app/phases/select-target-phase";
import type { ShinySparklePhase } from "#app/phases/shiny-sparkle-phase";
import type { ShowAbilityPhase } from "#app/phases/show-ability-phase";
import type { ShowPartyExpBarPhase } from "#app/phases/show-party-exp-bar-phase";
import type { ShowTrainerPhase } from "#app/phases/show-trainer-phase";
import type { StatStageChangePhase } from "#app/phases/stat-stage-change-phase";
import type { SummonMissingPhase } from "#app/phases/summon-missing-phase";
import type { SummonPhase } from "#app/phases/summon-phase";
import type { SwitchBiomePhase } from "#app/phases/switch-biome-phase";
import type { SwitchPhase } from "#app/phases/switch-phase";
import type { SwitchSummonPhase } from "#app/phases/switch-summon-phase";
import type { TeraPhase } from "#app/phases/tera-phase";
import type { TitlePhase } from "#app/phases/title-phase";
import type { ToggleDoublePositionPhase } from "#app/phases/toggle-double-position-phase";
import type { TrainerVictoryPhase } from "#app/phases/trainer-victory-phase";
import type { TurnEndPhase } from "#app/phases/turn-end-phase";
import type { TurnInitPhase } from "#app/phases/turn-init-phase";
import type { TurnStartPhase } from "#app/phases/turn-start-phase";
import type { UnavailablePhase } from "#app/phases/unavailable-phase";
import type { UnlockPhase } from "#app/phases/unlock-phase";
import type { VictoryPhase } from "#app/phases/victory-phase";
import type { WeatherEffectPhase } from "#app/phases/weather-effect-phase";

export type PhaseClass =
  | typeof AddEnemyBuffModifierPhase
  | typeof AttemptCapturePhase
  | typeof AttemptRunPhase
  | typeof BattleEndPhase
  | typeof BerryPhase
  | typeof CheckStatusEffectPhase
  | typeof CheckSwitchPhase
  | typeof CommandPhase
  | typeof CommonAnimPhase
  | typeof DamageAnimPhase
  | typeof EggHatchPhase
  | typeof EggLapsePhase
  | typeof EggSummaryPhase
  | typeof EncounterPhase
  | typeof EndCardPhase
  | typeof EndEvolutionPhase
  | typeof EnemyCommandPhase
  | typeof EvolutionPhase
  | typeof FormChangePhase
  | typeof ExpPhase
  | typeof FaintPhase
  | typeof FormChangePhase
  | typeof GameOverPhase
  | typeof GameOverModifierRewardPhase
  | typeof HideAbilityPhase
  | typeof HidePartyExpBarPhase
  | typeof LearnMovePhase
  | typeof LevelUpPhase
  | typeof LevelCapPhase
  | typeof LoadMoveAnimPhase
  | typeof LoginPhase
  | typeof MessagePhase
  | typeof ModifierRewardPhase
  | typeof MoneyRewardPhase
  | typeof MoveAnimPhase
  | typeof MoveChargePhase
  | typeof MoveEffectPhase
  | typeof MoveEndPhase
  | typeof MoveHeaderPhase
  | typeof MovePhase
  | typeof MysteryEncounterPhase
  | typeof MysteryEncounterOptionSelectedPhase
  | typeof MysteryEncounterBattlePhase
  | typeof MysteryEncounterRewardsPhase
  | typeof MysteryEncounterBattleStartCleanupPhase
  | typeof MysteryEncounterRewardsPhase
  | typeof PostMysteryEncounterPhase
  | typeof NewBattlePhase
  | typeof NewBiomeEncounterPhase
  | typeof NextEncounterPhase
  | typeof ObtainStatusEffectPhase
  | typeof PartyExpPhase
  | typeof PartyHealPhase
  | typeof PokemonAnimPhase
  | typeof PokemonHealPhase
  | typeof PokemonTransformPhase
  | typeof PostGameOverPhase
  | typeof PostSummonPhase
  | typeof PostTurnStatusEffectPhase
  | typeof QuietFormChangePhase
  | typeof ReloadSessionPhase
  | typeof ResetStatusPhase
  | typeof ReturnPhase
  | typeof RevivalBlessingPhase
  | typeof RibbonModifierRewardPhase
  | typeof ScanIvsPhase
  | typeof SelectBiomePhase
  | typeof SelectChallengePhase
  | typeof SelectGenderPhase
  | typeof SelectModifierPhase
  | typeof SelectStarterPhase
  | typeof SelectTargetPhase
  | typeof ShinySparklePhase
  | typeof ShowAbilityPhase
  | typeof ShowTrainerPhase
  | typeof ShowPartyExpBarPhase
  | typeof StatStageChangePhase
  | typeof SummonMissingPhase
  | typeof SummonPhase
  | typeof SwitchBiomePhase
  | typeof SwitchPhase
  | typeof SwitchSummonPhase
  | typeof TeraPhase
  | typeof TitlePhase
  | typeof ToggleDoublePositionPhase
  | typeof TrainerVictoryPhase
  | typeof TurnEndPhase
  | typeof TurnInitPhase
  | typeof TurnStartPhase
  | typeof UnavailablePhase
  | typeof UnlockPhase
  | typeof VictoryPhase
  | typeof WeatherEffectPhase;

/** Typescript map used to map a string phase to the actual phase type */
export type PhaseMap = {
  AddEnemyBuffModifierPhase: AddEnemyBuffModifierPhase;
  AttemptCapturePhase: AttemptCapturePhase;
  AttemptRunPhase: AttemptRunPhase;
  BattleEndPhase: BattleEndPhase;
  BerryPhase: BerryPhase;
  CheckStatusEffectPhase: CheckStatusEffectPhase;
  CheckSwitchPhase: CheckSwitchPhase;
  CommandPhase: CommandPhase;
  CommonAnimPhase: CommonAnimPhase;
  DamageAnimPhase: DamageAnimPhase;
  EggHatchPhase: EggHatchPhase;
  EggLapsePhase: EggLapsePhase;
  EggSummaryPhase: EggSummaryPhase;
  EncounterPhase: EncounterPhase;
  EndCardPhase: EndCardPhase;
  EndEvolutionPhase: EndEvolutionPhase;
  EnemyCommandPhase: EnemyCommandPhase;
  EvolutionPhase: EvolutionPhase;
  ExpPhase: ExpPhase;
  FaintPhase: FaintPhase;
  FormChangePhase: FormChangePhase;
  GameOverPhase: GameOverPhase;
  GameOverModifierRewardPhase: GameOverModifierRewardPhase;
  HideAbilityPhase: HideAbilityPhase;
  HidePartyExpBarPhase: HidePartyExpBarPhase;
  LearnMovePhase: LearnMovePhase;
  LevelCapPhase: LevelCapPhase;
  LevelUpPhase: LevelUpPhase;
  LoadMoveAnimPhase: LoadMoveAnimPhase;
  LoginPhase: LoginPhase;
  MessagePhase: MessagePhase;
  ModifierRewardPhase: ModifierRewardPhase;
  MoneyRewardPhase: MoneyRewardPhase;
  MoveAnimPhase: MoveAnimPhase<MoveAnim>;
  MoveChargePhase: MoveChargePhase;
  MoveEffectPhase: MoveEffectPhase;
  MoveEndPhase: MoveEndPhase;
  MoveHeaderPhase: MoveHeaderPhase;
  MovePhase: MovePhase;
  MysteryEncounterPhase: MysteryEncounterPhase;
  MysteryEncounterOptionSelectedPhase: MysteryEncounterOptionSelectedPhase;
  MysteryEncounterBattlePhase: MysteryEncounterBattlePhase;
  MysteryEncounterBattleStartCleanupPhase: MysteryEncounterBattleStartCleanupPhase;
  MysteryEncounterRewardsPhase: MysteryEncounterRewardsPhase;
  PostMysteryEncounterPhase: PostMysteryEncounterPhase;
  NewBattlePhase: NewBattlePhase;
  NewBiomeEncounterPhase: NewBiomeEncounterPhase;
  NextEncounterPhase: NextEncounterPhase;
  ObtainStatusEffectPhase: ObtainStatusEffectPhase;
  PartyExpPhase: PartyExpPhase;
  PartyHealPhase: PartyHealPhase;
  PokemonAnimPhase: PokemonAnimPhase;
  PokemonHealPhase: PokemonHealPhase;
  PokemonTransformPhase: PokemonTransformPhase;
  PostGameOverPhase: PostGameOverPhase;
  PostSummonPhase: PostSummonPhase;
  PostTurnStatusEffectPhase: PostTurnStatusEffectPhase;
  QuietFormChangePhase: QuietFormChangePhase;
  ReloadSessionPhase: ReloadSessionPhase;
  ResetStatusPhase: ResetStatusPhase;
  ReturnPhase: ReturnPhase;
  RevivalBlessingPhase: RevivalBlessingPhase;
  RibbonModifierRewardPhase: RibbonModifierRewardPhase;
  ScanIvsPhase: ScanIvsPhase;
  SelectBiomePhase: SelectBiomePhase;
  SelectChallengePhase: SelectChallengePhase;
  SelectGenderPhase: SelectGenderPhase;
  SelectModifierPhase: SelectModifierPhase;
  SelectStarterPhase: SelectStarterPhase;
  SelectTargetPhase: SelectTargetPhase;
  ShinySparklePhase: ShinySparklePhase;
  ShowAbilityPhase: ShowAbilityPhase;
  ShowPartyExpBarPhase: ShowPartyExpBarPhase;
  ShowTrainerPhase: ShowTrainerPhase;
  StatStageChangePhase: StatStageChangePhase;
  SummonMissingPhase: SummonMissingPhase;
  SummonPhase: SummonPhase;
  SwitchBiomePhase: SwitchBiomePhase;
  SwitchPhase: SwitchPhase;
  SwitchSummonPhase: SwitchSummonPhase;
  TeraPhase: TeraPhase;
  TitlePhase: TitlePhase;
  ToggleDoublePositionPhase: ToggleDoublePositionPhase;
  TrainerVictoryPhase: TrainerVictoryPhase;
  TurnEndPhase: TurnEndPhase;
  TurnInitPhase: TurnInitPhase;
  TurnStartPhase: TurnStartPhase;
  UnavailablePhase: UnavailablePhase;
  UnlockPhase: UnlockPhase;
  VictoryPhase: VictoryPhase;
  WeatherEffectPhase: WeatherEffectPhase;
};

export type PhaseString = keyof PhaseMap;
