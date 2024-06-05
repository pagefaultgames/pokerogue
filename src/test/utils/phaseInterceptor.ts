import {
  BattleEndPhase,
  BerryPhase,
  CheckSwitchPhase, CommandPhase, DamagePhase, EggLapsePhase,
  EncounterPhase, EnemyCommandPhase, FaintPhase,
  LoginPhase, MessagePhase, MoveEffectPhase, MoveEndPhase, MovePhase, NewBattlePhase, NextEncounterPhase,
  PostSummonPhase,
  SelectGenderPhase, SelectModifierPhase,
  SelectStarterPhase, ShinySparklePhase, ShowAbilityPhase, StatChangePhase, SummonPhase,
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
  private intervalRun;
  private prompts;
  private phaseFrom;

  private PHASES = [
    [LoginPhase, this.startPhase],
    [TitlePhase, this.startPhase],
    [SelectGenderPhase, this.startPhase],
    [EncounterPhase, this.startPhase],
    [SelectStarterPhase, this.startPhase],
    [PostSummonPhase, this.startPhase],
    [SummonPhase, this.startPhase],
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
    [StatChangePhase, this.startPhase],
    [ShinySparklePhase, this.startPhase],
  ];

  constructor(scene) {
    this.scene = scene;
    this.log = [];
    this.onHold = [];
    this.prompts = [];
    this.initPhases();
    this.startPromptHander();
  }

  runFrom(phaseFrom) {
    this.phaseFrom = phaseFrom;
    return this;
  }

  async to(phaseTo): Promise<void> {
    return new Promise(async (resolve) => {
      await this.run(this.phaseFrom);
      this.phaseFrom = null;
      const targetName = typeof phaseTo === "string" ? phaseTo : phaseTo.name;
      this.intervalRun = setInterval(async () => {
        const currentPhase = this.onHold?.length && this.onHold[0];
        if (currentPhase && currentPhase.name !== targetName) {
          await this.run(currentPhase.name);
        } else if (currentPhase.name === targetName) {
          await this.run(currentPhase.name);
          clearInterval(this.intervalRun);
          return resolve();
        }
      });
    });
  }


  run(phaseTarget, skipFn?): Promise<void> {
    this.scene.moveAnimations = null; // Mandatory to avoid crash
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


  mustRun(phaseTarget): Promise<void> {
    const targetName = typeof phaseTarget === "string" ? phaseTarget : phaseTarget.name;
    this.scene.moveAnimations = null; // Mandatory to avoid crash
    return new Promise(async (resolve, reject) => {
      const interval = setInterval(async () => {
        const currentPhase = this.onHold?.length && this.onHold[0];
        if (currentPhase && currentPhase.name !== targetName) {
          reject(currentPhase);
        } else if (currentPhase && currentPhase.name === targetName) {
          clearInterval(interval);
          await this.run(phaseTarget);
          resolve();
        }
      });
    });
  }

  whenAboutToRun(phaseTarget, skipFn?): Promise<void> {
    return new Promise(async (resolve) => {
      this.waitUntil(phaseTarget, skipFn).then(() => {
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
        // if the currentPhase here is not filled, it means it's a phase we haven't added to the list
        if (currentPhase === targetName) {
          clearInterval(this.interval);
          return resolve();
        } else if (skipFn && skipFn()) {
          clearInterval(this.interval);
          return reject("Skipped phase");
        }
      });
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
        const expireFn = actionForNextPrompt.expireFn && actionForNextPrompt.expireFn();
        const currentMode = this.scene.ui.getMode();
        const currentPhase = this.scene.getCurrentPhase().constructor.name;
        if (expireFn) {
          this.prompts.shift();
        } else if (currentMode === actionForNextPrompt.mode && currentPhase === actionForNextPrompt.phaseTarget) {
          this.prompts.shift().callback();
        }
      }
    });
  }

  addToNextPrompt(phaseTarget: string, mode: Mode, callback: () => void, expireFn: () => void) {
    this.prompts.push({
      phaseTarget,
      mode,
      callback,
      expireFn
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
