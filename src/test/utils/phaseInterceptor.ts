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
import UI, {Mode} from "#app/ui/ui";

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
  private inProgress;
  private originalSetMode;

  /**
   * List of phases with their corresponding start methods.
   */
  private PHASES = [
    [LoginPhase, this.startPhase, this.endPhase],
    [TitlePhase, this.startPhase, this.endPhase],
    [SelectGenderPhase, this.startPhase, this.endPhase],
    [EncounterPhase, this.startPhase, this.endPhase],
    [SelectStarterPhase, this.startPhase, this.endPhase],
    [PostSummonPhase, this.startPhase, this.endPhase],
    [SummonPhase, this.startPhase, this.endPhase],
    [ToggleDoublePositionPhase, this.startPhase, this.endPhase],
    [CheckSwitchPhase, this.startPhase, this.endPhase],
    [ShowAbilityPhase, this.startPhase, this.endPhase],
    [MessagePhase, this.startPhase, this.endPhase],
    [TurnInitPhase, this.startPhase, this.endPhase],
    [CommandPhase, this.startPhase, this.endPhase],
    [EnemyCommandPhase, this.startPhase, this.endPhase],
    [TurnStartPhase, this.startPhase, this.endPhase],
    [MovePhase, this.startPhase, this.endPhase],
    [MoveEffectPhase, this.startPhase, this.endPhase],
    [DamagePhase, this.startPhase, this.endPhase],
    [FaintPhase, this.startPhase, this.endPhase],
    [BerryPhase, this.startPhase, this.endPhase],
    [TurnEndPhase, this.startPhase, this.endPhase],
    [BattleEndPhase, this.startPhase, this.endPhase],
    [EggLapsePhase, this.startPhase, this.endPhase],
    [SelectModifierPhase, this.startPhase, this.endPhase],
    [NextEncounterPhase, this.startPhase, this.endPhase],
    [NewBattlePhase, this.startPhase, this.endPhase],
    [VictoryPhase, this.startPhase, this.endPhase],
    [MoveEndPhase, this.startPhase, this.endPhase],
    [StatChangePhase, this.startPhase, this.endPhase],
    [ShinySparklePhase, this.startPhase, this.endPhase],
  ];

  private endBySetMode = [
    TitlePhase, SelectGenderPhase, CheckSwitchPhase
  ];

  /**
   * Constructor to initialize the scene and properties, and to start the phase handling.
   * @param scene - The scene to be managed.
   */
  constructor(scene) {
    this.scene = scene;
    this.log = [];
    this.onHold = [];
    this.prompts = [];
    this.initPhases();
    this.startPromptHander();
  }

  /**
   * Method to set the starting phase.
   * @param phaseFrom - The phase to start from.
   * @returns The instance of the PhaseInterceptor.
   */
  runFrom(phaseFrom) {
    this.phaseFrom = phaseFrom;
    return this;
  }

  /**
   * Method to transition to a target phase.
   * @param phaseTo - The phase to transition to.
   * @returns A promise that resolves when the transition is complete.
   */
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

  /**
   * Method to run a phase with an optional skip function.
   * @param phaseTarget - The phase to run.
   * @param skipFn - Optional skip function.
   * @returns A promise that resolves when the phase is run.
   */
  run(phaseTarget, skipFn?): Promise<void> {
    const targetName = typeof phaseTarget === "string" ? phaseTarget : phaseTarget.name;
    this.scene.moveAnimations = null; // Mandatory to avoid crash
    return new Promise(async (resolve, reject) => {
      const interval = setInterval(async () => {
        const currentPhase = this.onHold.shift();
        if (currentPhase) {
          if (currentPhase.name !== targetName) {
            clearInterval(interval);
            if (skipFn && skipFn()) {
              resolve();
            }
            reject(`Wrong phase: ${currentPhase.name} instead of ${targetName}`);
          }
          this.inProgress = {
            name: currentPhase.name,
            callback: () => {
              clearInterval(interval);
              resolve();
            },
          };
          currentPhase.call();
        }
      });
    });
  }

  /**
   * Method to initialize phases and their corresponding methods.
   */
  initPhases() {
    this.originalSetMode = UI.prototype.setMode;
    UI.prototype.setMode = (mode, args) => this.setMode(mode, args);
    for (const [phase, methodStart, methodEnd] of this.PHASES) {
      const originalStart = phase.prototype.start;
      const originalEnd = phase.prototype.end;
      this.phases[phase.name] = {
        start: originalStart,
        end: originalEnd,
        endBySetMode: this.endBySetMode.some((elm) => elm.name === phase.name),
      };
      phase.prototype.start = () => methodStart.call(this, phase);
      phase.prototype.end = () => methodEnd.call(this, phase);
    }
  }

  /**
   * Method to start a phase and log it.
   * @param phase - The phase to start.
   */
  startPhase(phase) {
    this.log.push(phase.name);
    const instance = this.scene.getCurrentPhase();
    this.onHold.push({
      name: phase.name,
      call: () => {
        this.phases[phase.name].start.apply(instance);
      }
    });
  }

  /**
   * Method to end a phase and log it.
   * @param phase - The phase to start.
   */
  endPhase(phase) {
    const instance = this.scene.getCurrentPhase();
    this.phases[phase.name].end.apply(instance);
    this.inProgress?.callback();
  }

  /**
   * m2m to set mode.
   * @param phase - The phase to start.
   */
  setMode(mode: Mode, ...args: any[]): Promise<void> {
    const currentPhase = this.scene.getCurrentPhase();
    const instance = this.scene.ui;
    console.log("setMode", mode, args);
    const ret = this.originalSetMode.apply(instance, [mode, ...args]);
    if (this.phases[currentPhase.constructor.name].endBySetMode) {
      this.inProgress?.callback();
    }
    return ret;
  }

  /**
   * Method to start the prompt handler.
   */
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

  /**
   * Method to add an action to the next prompt.
   * @param phaseTarget - The target phase for the prompt.
   * @param mode - The mode of the UI.
   * @param callback - The callback function to execute.
   * @param expireFn - The function to determine if the prompt has expired.
   */
  addToNextPrompt(phaseTarget: string, mode: Mode, callback: () => void, expireFn: () => void) {
    this.prompts.push({
      phaseTarget,
      mode,
      callback,
      expireFn
    });
  }

  /**
   * Restores the original state of phases and clears intervals.
   *
   * This function iterates through all phases and resets their `start` method to the original
   * function stored in `this.phases`. Additionally, it clears the `promptInterval` and `interval`.
   */
  restoreOg() {
    for (const [phase] of this.PHASES) {
      phase.prototype.start = this.phases[phase.name].start;
      phase.prototype.end = this.phases[phase.name].end;
    }
    UI.prototype.setMode = this.originalSetMode;
    clearInterval(this.promptInterval);
    clearInterval(this.interval);
  }
}
