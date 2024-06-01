import {
  BattleEndPhase,
  BerryPhase,
  CheckSwitchPhase, CommandPhase, DamagePhase, EggLapsePhase,
  EncounterPhase, EnemyCommandPhase, FaintPhase,
  LoginPhase, MessagePhase, MoveEffectPhase, MoveEndPhase, MovePhase, NewBattlePhase, NextEncounterPhase,
  PostSummonPhase,
  SelectGenderPhase, SelectModifierPhase,
  SelectStarterPhase, ShowAbilityPhase,
  TitlePhase, ToggleDoublePositionPhase, TurnEndPhase, TurnInitPhase, TurnStartPhase, VictoryPhase
} from "#app/phases";
import {Mode} from "#app/ui/ui";

export default class PhaseInterceptor {
  public scene;
  public phases = {};
  public log;
  private onHold;
  private interval;
  private promptInterval;
  private prompts;

  private PHASES = [
    [LoginPhase, this.startPhase],
    [TitlePhase, this.startPhase],
    [SelectGenderPhase, this.startPhase],
    [EncounterPhase, this.startPhase],
    [SelectStarterPhase, this.startPhase],
    [PostSummonPhase, this.startPhase],
    [ToggleDoublePositionPhase, this.startPhase],
    [CheckSwitchPhase, this.startPhase],
    [ShowAbilityPhase, this.startPhase],
    [MessagePhase, this.startPhase],
    [TurnInitPhase, this.startPhase],
    [CommandPhase, this.startPhase],
    [EnemyCommandPhase, this.startPhase],
    [TurnStartPhase, this.startPhase],
    [MovePhase, this.startPhase],
    [MoveEffectPhase, this.startPhase],
    [DamagePhase, this.startPhase],
    [FaintPhase, this.startPhase],
    [BerryPhase, this.startPhase],
    [TurnEndPhase, this.startPhase],
    [BattleEndPhase, this.startPhase],
    [EggLapsePhase, this.startPhase],
    [SelectModifierPhase, this.startPhase],
    [NextEncounterPhase, this.startPhase],
    [NewBattlePhase, this.startPhase],
    [VictoryPhase, this.startPhase],
    [MoveEndPhase, this.startPhase],
  ];

  constructor(scene) {
    this.scene = scene;
    this.log = [];
    this.onHold = [];
    this.prompts = [];
    this.initPhases();
    this.startPromptHander();
  }

  run(phaseTarget, skipFn?): Promise<void> {
    return new Promise(async (resolve) => {
      this.waitUntil(phaseTarget, skipFn).then(() => {
        const currentPhase = this.onHold.shift();
        currentPhase.call();
        resolve();
      }).catch(() => {
        resolve();
      });
    });
  }

  remove(phaseTarget, skipFn?): Promise<void> {
    return new Promise(async (resolve) => {
      this.waitUntil(phaseTarget, skipFn).then(() => {
        this.onHold.shift();
        this.scene.getCurrentPhase().end();
        resolve();
      }).catch(() => {
        resolve();
      });
    });
  }

  waitUntil(phaseTarget, skipFn?): Promise<void> {
    const targetName = typeof phaseTarget === "string" ? phaseTarget : phaseTarget.name;
    return new Promise((resolve, reject) => {
      this.interval = setInterval(() => {
        const currentPhase = this.onHold?.length && this.onHold[0] && this.onHold[0].name;
        if (currentPhase === targetName) {
          clearInterval(this.interval);
          return resolve();
        } else if (skipFn && skipFn()) {
          clearInterval(this.interval);
          return reject("Skipped phase");
        }
      }, 1000);
    });
  }

  initPhases() {
    for (const [phase, method] of this.PHASES) {
      const originalStart = phase.prototype.start;
      this.phases[phase.name] = originalStart;
      phase.prototype.start = () => method.call(this, phase);
    }
  }

  startPhase(phase) {
    this.log.push(phase.name);
    const instance = this.scene.getCurrentPhase();
    this.onHold.push({
      name: phase.name,
      call: () => {
        this.phases[phase.name].apply(instance);
      }
    });
  }

  startPromptHander() {
    this.promptInterval = setInterval(() => {
      if (this.prompts.length) {
        const actionForNextPrompt = this.prompts[0];
        const currentMode = this.scene.ui.getMode();
        const currentPhase = this.scene.getCurrentPhase().constructor.name;
        if (currentMode === actionForNextPrompt.mode && currentPhase === actionForNextPrompt.phaseTarget) {
          this.prompts.shift().callback();
        }
      }
    }, 1000);
  }

  addToNextPrompt(phaseTarget: string, mode: Mode, callback: () => void) {
    this.prompts.push({
      phaseTarget,
      mode,
      callback
    });
  }

  restoreOg() {
    for (const [phase] of this.PHASES) {
      phase.prototype.start = this.phases[phase.name];
    }
    clearInterval(this.promptInterval);
    clearInterval(this.interval);
  }
}
