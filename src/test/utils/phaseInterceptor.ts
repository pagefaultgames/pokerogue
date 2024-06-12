import {
  BattleEndPhase,
  BerryPhase,
  CheckSwitchPhase,
  CommandPhase,
  DamagePhase,
  EggLapsePhase,
  EncounterPhase,
  EnemyCommandPhase,
  FaintPhase,
  LoginPhase,
  MessagePhase,
  MoveEffectPhase,
  MoveEndPhase,
  MovePhase,
  NewBattlePhase,
  NextEncounterPhase,
  PostSummonPhase,
  SelectGenderPhase,
  SelectModifierPhase,
  SelectStarterPhase,
  SelectTargetPhase,
  ShinySparklePhase,
  ShowAbilityPhase,
  StatChangePhase,
  SummonPhase,
  SwitchPhase,
  SwitchSummonPhase,
  TitlePhase,
  ToggleDoublePositionPhase,
  TurnEndPhase,
  TurnInitPhase,
  TurnStartPhase,
  UnavailablePhase,
  VictoryPhase
} from "#app/phases";
import UI, {Mode} from "#app/ui/ui";
import {Phase} from "#app/phase";
import ErrorInterceptor from "#app/test/utils/errorInterceptor";
import {QuietFormChangePhase} from "#app/form-change-phase";

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
  private originalSuperEnd;

  /**
   * List of phases with their corresponding start methods.
   */
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
    [SelectTargetPhase, this.startPhase],
    [UnavailablePhase, this.startPhase],
    [QuietFormChangePhase, this.startPhase],
    [SwitchPhase, this.startPhase],
    [SwitchSummonPhase, this.startPhase],
  ];

  private endBySetMode = [
    TitlePhase, SelectGenderPhase, CommandPhase
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
    this.startPromptHandler();
    this.initPhases();
  }

  rejectAll(error) {
    if (this.inProgress) {
      clearInterval(this.promptInterval);
      clearInterval(this.interval);
      clearInterval(this.intervalRun);
      this.inProgress.onError(error);
    }
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
  async to(phaseTo, runTarget: boolean = true): Promise<void> {
    return new Promise(async (resolve, reject) => {
      ErrorInterceptor.getInstance().add(this);
      if (this.phaseFrom) {
        await this.run(this.phaseFrom).catch((e) => reject(e));
        this.phaseFrom = null;
      }
      const targetName = typeof phaseTo === "string" ? phaseTo : phaseTo.name;
      this.intervalRun = setInterval(async() => {
        const currentPhase = this.onHold?.length && this.onHold[0];
        if (currentPhase && currentPhase.name === targetName) {
          clearInterval(this.intervalRun);
          if (!runTarget) {
            return resolve();
          }
          await this.run(currentPhase).catch((e) => {
            clearInterval(this.intervalRun);
            return reject(e);
          });
          return resolve();
        }
        if (currentPhase && currentPhase.name !== targetName) {
          await this.run(currentPhase).catch((e) => {
            clearInterval(this.intervalRun);
            return reject(e);
          });
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
      ErrorInterceptor.getInstance().add(this);
      const interval = setInterval(async () => {
        const currentPhase = this.onHold.shift();
        if (currentPhase) {
          if (currentPhase.name !== targetName) {
            clearInterval(interval);
            const skip = skipFn && skipFn(currentPhase.name);
            if (skip) {
              this.onHold.unshift(currentPhase);
              ErrorInterceptor.getInstance().remove(this);
              return resolve();
            }
            clearInterval(interval);
            return reject(`Wrong phase: this is ${currentPhase.name} and not ${targetName}`);
          }
          clearInterval(interval);
          this.inProgress = {
            name: currentPhase.name,
            callback: () => {
              ErrorInterceptor.getInstance().remove(this);
              resolve();
            },
            onError: (error) => reject(error),
          };
          currentPhase.call();
        }
      });
    });
  }

  whenAboutToRun(phaseTarget, skipFn?): Promise<void> {
    const targetName = typeof phaseTarget === "string" ? phaseTarget : phaseTarget.name;
    this.scene.moveAnimations = null; // Mandatory to avoid crash
    return new Promise(async (resolve, reject) => {
      ErrorInterceptor.getInstance().add(this);
      const interval = setInterval(async () => {
        const currentPhase = this.onHold.shift();
        if (currentPhase) {
          if (currentPhase.name !== targetName) {
            this.onHold.unshift(currentPhase);
          } else {
            clearInterval(interval);
            resolve();
          }
        }
      });
    });
  }

  /**
   * Method to initialize phases and their corresponding methods.
   */
  initPhases() {
    this.originalSetMode = UI.prototype.setMode;
    this.originalSuperEnd = Phase.prototype.end;
    UI.prototype.setMode = (mode, ...args) => this.setMode.call(this, mode, ...args);
    Phase.prototype.end = () => this.superEndPhase.call(this);
    for (const [phase, methodStart] of this.PHASES) {
      const originalStart = phase.prototype.start;
      this.phases[phase.name] = {
        start: originalStart,
        endBySetMode: this.endBySetMode.some((elm) => elm.name === phase.name),
      };
      phase.prototype.start = () => methodStart.call(this, phase);
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

  unlock() {
    this.inProgress?.callback();
    this.inProgress = undefined;
  }

  /**
   * Method to end a phase and log it.
   * @param phase - The phase to start.
   */
  superEndPhase() {
    const instance = this.scene.getCurrentPhase();
    this.originalSuperEnd.apply(instance);
    this.inProgress?.callback();
    this.inProgress = undefined;
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
    if (!this.phases[currentPhase.constructor.name]) {
      throw new Error(`missing ${currentPhase.constructor.name} in phaseInterceptior PHASES list`);
    }
    if (this.phases[currentPhase.constructor.name].endBySetMode) {
      this.inProgress?.callback();
      this.inProgress = undefined;
    }
    return ret;
  }

  /**
   * Method to start the prompt handler.
   */
  startPromptHandler() {
    this.promptInterval = setInterval(() => {
      if (this.prompts.length) {
        const actionForNextPrompt = this.prompts[0];
        const expireFn = actionForNextPrompt.expireFn && actionForNextPrompt.expireFn();
        const currentMode = this.scene.ui.getMode();
        const currentPhase = this.scene.getCurrentPhase().constructor.name;
        const currentHandler = this.scene.ui.getHandler();
        if (expireFn) {
          this.prompts.shift();
        } else if (currentMode === actionForNextPrompt.mode && currentPhase === actionForNextPrompt.phaseTarget && currentHandler.active && (!actionForNextPrompt.awaitingActionInput || (actionForNextPrompt.awaitingActionInput && currentHandler.awaitingActionInput))) {
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
  addToNextPrompt(phaseTarget: string, mode: Mode, callback: () => void, expireFn: () => void, awaitingActionInput: boolean = false) {
    this.prompts.push({
      phaseTarget,
      mode,
      callback,
      expireFn,
      awaitingActionInput
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
    }
    UI.prototype.setMode = this.originalSetMode;
    Phase.prototype.end = this.originalSuperEnd;
    clearInterval(this.promptInterval);
    clearInterval(this.interval);
    clearInterval(this.intervalRun);
  }
}
