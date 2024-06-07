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

  /**
   * Method to ensure a phase is run, to throw error on test if not.
   * @param phaseTarget - The phase to run.
   * @returns A promise that resolves when the phase is run.
   */
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

  /**
   * Method to execute actions when about to run a phase. Does not run the phase, stop right before.
   * @param phaseTarget - The phase to run.
   * @param skipFn - Optional skip function.
   * @returns A promise that resolves when the phase is about to run.
   */
  whenAboutToRun(phaseTarget, skipFn?): Promise<void> {
    return new Promise(async (resolve) => {
      this.waitUntil(phaseTarget, skipFn).then(() => {
        resolve();
      }).catch(() => {
        resolve();
      });
    });
  }

  /**
   * Method to remove a phase from the list.
   * @param phaseTarget - The phase to remove.
   * @param skipFn - Optional skip function.
   * @returns A promise that resolves when the phase is removed.
   */
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

  /**
   * Method to wait until a specific phase is reached.
   * @param phaseTarget - The phase to wait for.
   * @param skipFn - Optional skip function.
   * @returns A promise that resolves when the phase is reached.
   */
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

  /**
   * Method to initialize phases and their corresponding methods.
   */
  initPhases() {
    for (const [phase, method] of this.PHASES) {
      const originalStart = phase.prototype.start;
      this.phases[phase.name] = originalStart;
      phase.prototype.start = () => method.call(this, phase);
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
        this.phases[phase.name].apply(instance);
      }
    });
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
      phase.prototype.start = this.phases[phase.name];
    }
    clearInterval(this.promptInterval);
    clearInterval(this.interval);
  }
}
