import type { AttemptRunPhase } from "#app/phases/attempt-run-phase";
import type { BattleEndPhase } from "#app/phases/battle-end-phase";
import type { BerryPhase } from "#app/phases/berry-phase";
import type { CheckSwitchPhase } from "#app/phases/check-switch-phase";
import type { CommandPhase } from "#app/phases/command-phase";
import type { DamageAnimPhase } from "#app/phases/damage-anim-phase";
import type { EggLapsePhase } from "#app/phases/egg-lapse-phase";
import type { EncounterPhase } from "#app/phases/encounter-phase";
import type { EndEvolutionPhase } from "#app/phases/end-evolution-phase";
import type { EnemyCommandPhase } from "#app/phases/enemy-command-phase";
import type { EvolutionPhase } from "#app/phases/evolution-phase";
import type { ExpPhase } from "#app/phases/exp-phase";
import type { FaintPhase } from "#app/phases/faint-phase";
import type { FormChangePhase } from "#app/phases/form-change-phase";
import type { GameOverModifierRewardPhase } from "#app/phases/game-over-modifier-reward-phase";
import type { GameOverPhase } from "#app/phases/game-over-phase";
import type { LearnMovePhase } from "#app/phases/learn-move-phase";
import type { LevelCapPhase } from "#app/phases/level-cap-phase";
import type { LoginPhase } from "#app/phases/login-phase";
import type { MessagePhase } from "#app/phases/message-phase";
import type { ModifierRewardPhase } from "#app/phases/modifier-reward-phase";
import type { MoveEffectPhase } from "#app/phases/move-effect-phase";
import type { MoveEndPhase } from "#app/phases/move-end-phase";
import type { MovePhase } from "#app/phases/move-phase";
import type {
  MysteryEncounterPhase,
  MysteryEncounterOptionSelectedPhase,
  MysteryEncounterBattlePhase,
  MysteryEncounterRewardsPhase,
  PostMysteryEncounterPhase,
} from "#app/phases/mystery-encounter-phases";
import type { NewBattlePhase } from "#app/phases/new-battle-phase";
import type { NewBiomeEncounterPhase } from "#app/phases/new-biome-encounter-phase";
import type { NextEncounterPhase } from "#app/phases/next-encounter-phase";
import type { PartyExpPhase } from "#app/phases/party-exp-phase";
import type { PartyHealPhase } from "#app/phases/party-heal-phase";
import type { PostGameOverPhase } from "#app/phases/post-game-over-phase";
import type { PostSummonPhase } from "#app/phases/post-summon-phase";
import type { QuietFormChangePhase } from "#app/phases/quiet-form-change-phase";
import type { RevivalBlessingPhase } from "#app/phases/revival-blessing-phase";
import type { RibbonModifierRewardPhase } from "#app/phases/ribbon-modifier-reward-phase";
import type { SelectBiomePhase } from "#app/phases/select-biome-phase";
import type { SelectGenderPhase } from "#app/phases/select-gender-phase";
import type { SelectModifierPhase } from "#app/phases/select-modifier-phase";
import type { SelectStarterPhase } from "#app/phases/select-starter-phase";
import type { SelectTargetPhase } from "#app/phases/select-target-phase";
import type { ShinySparklePhase } from "#app/phases/shiny-sparkle-phase";
import type { ShowAbilityPhase } from "#app/phases/show-ability-phase";
import type { StatStageChangePhase } from "#app/phases/stat-stage-change-phase";
import type { SummonPhase } from "#app/phases/summon-phase";
import type { SwitchPhase } from "#app/phases/switch-phase";
import type { SwitchSummonPhase } from "#app/phases/switch-summon-phase";
import type { TitlePhase } from "#app/phases/title-phase";
import type { ToggleDoublePositionPhase } from "#app/phases/toggle-double-position-phase";
import type { TurnEndPhase } from "#app/phases/turn-end-phase";
import type { TurnInitPhase } from "#app/phases/turn-init-phase";
import type { TurnStartPhase } from "#app/phases/turn-start-phase";
import type { UnavailablePhase } from "#app/phases/unavailable-phase";
import type { UnlockPhase } from "#app/phases/unlock-phase";
import type { VictoryPhase } from "#app/phases/victory-phase";

export type PhaseKind = "";
export type PhaseClass =
  | typeof LoginPhase
  | typeof TitlePhase
  | typeof SelectGenderPhase
  | typeof NewBiomeEncounterPhase
  | typeof SelectStarterPhase
  | typeof PostSummonPhase
  | typeof SummonPhase
  | typeof ToggleDoublePositionPhase
  | typeof CheckSwitchPhase
  | typeof ShowAbilityPhase
  | typeof MessagePhase
  | typeof TurnInitPhase
  | typeof CommandPhase
  | typeof EnemyCommandPhase
  | typeof TurnStartPhase
  | typeof MovePhase
  | typeof MoveEffectPhase
  | typeof DamageAnimPhase
  | typeof FaintPhase
  | typeof BerryPhase
  | typeof TurnEndPhase
  | typeof BattleEndPhase
  | typeof EggLapsePhase
  | typeof SelectModifierPhase
  | typeof NextEncounterPhase
  | typeof NewBattlePhase
  | typeof VictoryPhase
  | typeof LearnMovePhase
  | typeof MoveEndPhase
  | typeof StatStageChangePhase
  | typeof ShinySparklePhase
  | typeof SelectTargetPhase
  | typeof UnavailablePhase
  | typeof QuietFormChangePhase
  | typeof SwitchPhase
  | typeof SwitchSummonPhase
  | typeof PartyHealPhase
  | typeof FormChangePhase
  | typeof EvolutionPhase
  | typeof EndEvolutionPhase
  | typeof LevelCapPhase
  | typeof AttemptRunPhase
  | typeof SelectBiomePhase
  | typeof MysteryEncounterPhase
  | typeof MysteryEncounterOptionSelectedPhase
  | typeof MysteryEncounterBattlePhase
  | typeof MysteryEncounterRewardsPhase
  | typeof PostMysteryEncounterPhase
  | typeof RibbonModifierRewardPhase
  | typeof GameOverModifierRewardPhase
  | typeof ModifierRewardPhase
  | typeof PartyExpPhase
  | typeof ExpPhase
  | typeof EncounterPhase
  | typeof GameOverPhase
  | typeof UnlockPhase
  | typeof PostGameOverPhase
  | typeof RevivalBlessingPhase;
export type PhaseString =
  | "LoginPhase"
  | "TitlePhase"
  | "SelectGenderPhase"
  | "NewBiomeEncounterPhase"
  | "SelectStarterPhase"
  | "PostSummonPhase"
  | "SummonPhase"
  | "ToggleDoublePositionPhase"
  | "CheckSwitchPhase"
  | "ShowAbilityPhase"
  | "MessagePhase"
  | "TurnInitPhase"
  | "CommandPhase"
  | "EnemyCommandPhase"
  | "TurnStartPhase"
  | "MovePhase"
  | "MoveEffectPhase"
  | "DamageAnimPhase"
  | "FaintPhase"
  | "BerryPhase"
  | "TurnEndPhase"
  | "BattleEndPhase"
  | "EggLapsePhase"
  | "SelectModifierPhase"
  | "NextEncounterPhase"
  | "NewBattlePhase"
  | "VictoryPhase"
  | "LearnMovePhase"
  | "MoveEndPhase"
  | "StatStageChangePhase"
  | "ShinySparklePhase"
  | "SelectTargetPhase"
  | "UnavailablePhase"
  | "QuietFormChangePhase"
  | "SwitchPhase"
  | "SwitchSummonPhase"
  | "PartyHealPhase"
  | "FormChangePhase"
  | "EvolutionPhase"
  | "EndEvolutionPhase"
  | "LevelCapPhase"
  | "AttemptRunPhase"
  | "SelectBiomePhase"
  | "MysteryEncounterPhase"
  | "MysteryEncounterOptionSelectedPhase"
  | "MysteryEncounterBattlePhase"
  | "MysteryEncounterRewardsPhase"
  | "PostMysteryEncounterPhase"
  | "RibbonModifierRewardPhase"
  | "GameOverModifierRewardPhase"
  | "ModifierRewardPhase"
  | "PartyExpPhase"
  | "ExpPhase"
  | "EncounterPhase"
  | "GameOverPhase"
  | "UnlockPhase"
  | "PostGameOverPhase"
  | "RevivalBlessingPhase";
