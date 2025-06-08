import { HideAbilityPhase } from "./phases/hide-ability-phase";
import { ShowAbilityPhase } from "./phases/show-ability-phase";
import { TurnInitPhase } from "./phases/turn-init-phase";
import type { Phase } from "#app/phase";
import type { default as Pokemon } from "#app/field/pokemon";
import type { Constructor } from "#app/utils/common";
import { MessagePhase } from "./phases/message-phase";
import { globalScene } from "#app/global-scene";

/**
 * Manager for phases used by battle scene.
 *
 * *This file must not be imported or used directly. The manager is exclusively used by the battle scene and is not intended for external use.*
 */

export class PhaseManager {
  /** PhaseQueue: dequeue/remove the first element to get the next phase */
  public phaseQueue: Phase[] = [];
  public conditionalQueue: Array<[() => boolean, Phase]> = [];
  /** PhaseQueuePrepend: is a temp storage of what will be added to PhaseQueue */
  private phaseQueuePrepend: Phase[] = [];

  /** overrides default of inserting phases to end of phaseQueuePrepend array. Useful for inserting Phases "out of order" */
  private phaseQueuePrependSpliceIndex = -1;
  private nextCommandPhaseQueue: Phase[] = [];

  private currentPhase: Phase | null = null;
  private standbyPhase: Phase | null = null;

  /* Phase Functions */
  getCurrentPhase(): Phase | null {
    return this.currentPhase;
  }

  getStandbyPhase(): Phase | null {
    return this.standbyPhase;
  }

  /**
   * Adds a phase to the conditional queue and ensures it is executed only when the specified condition is met.
   *
   * This method allows deferring the execution of a phase until certain conditions are met, which is useful for handling
   * situations like abilities and entry hazards that depend on specific game states.
   *
   * @param phase - The phase to be added to the conditional queue.
   * @param condition - A function that returns a boolean indicating whether the phase should be executed.
   *
   */
  pushConditionalPhase(phase: Phase, condition: () => boolean): void {
    this.conditionalQueue.push([condition, phase]);
  }

  /**
   * Adds a phase to nextCommandPhaseQueue, as long as boolean passed in is false
   * @param phase {@linkcode Phase} the phase to add
   * @param defer boolean on which queue to add to, defaults to false, and adds to phaseQueue
   */
  pushPhase(phase: Phase, defer = false): void {
    (!defer ? this.phaseQueue : this.nextCommandPhaseQueue).push(phase);
  }

  /**
   * Adds Phase(s) to the end of phaseQueuePrepend, or at phaseQueuePrependSpliceIndex
   * @param phases {@linkcode Phase} the phase(s) to add
   */
  unshiftPhase(...phases: Phase[]): void {
    if (this.phaseQueuePrependSpliceIndex === -1) {
      this.phaseQueuePrepend.push(...phases);
    } else {
      this.phaseQueuePrepend.splice(this.phaseQueuePrependSpliceIndex, 0, ...phases);
    }
  }

  /**
   * Clears the phaseQueue
   */
  clearPhaseQueue(): void {
    this.phaseQueue.splice(0, this.phaseQueue.length);
  }

  /**
   * Clears all phase-related stuff, including all phase queues, the current and standby phases, and a splice index
   */
  clearAllPhases(): void {
    for (const queue of [this.phaseQueue, this.phaseQueuePrepend, this.conditionalQueue, this.nextCommandPhaseQueue]) {
      queue.splice(0, queue.length);
    }
    this.currentPhase = null;
    this.standbyPhase = null;
    this.clearPhaseQueueSplice();
  }

  /**
   * Used by function unshiftPhase(), sets index to start inserting at current length instead of the end of the array, useful if phaseQueuePrepend gets longer with Phases
   */
  setPhaseQueueSplice(): void {
    this.phaseQueuePrependSpliceIndex = this.phaseQueuePrepend.length;
  }

  /**
   * Resets phaseQueuePrependSpliceIndex to -1, implies that calls to unshiftPhase will insert at end of phaseQueuePrepend
   */
  clearPhaseQueueSplice(): void {
    this.phaseQueuePrependSpliceIndex = -1;
  }

  /**
   * Is called by each Phase implementations "end()" by default
   * We dump everything from phaseQueuePrepend to the start of of phaseQueue
   * then removes first Phase and starts it
   */
  shiftPhase(): void {
    if (this.standbyPhase) {
      this.currentPhase = this.standbyPhase;
      this.standbyPhase = null;
      return;
    }

    if (this.phaseQueuePrependSpliceIndex > -1) {
      this.clearPhaseQueueSplice();
    }
    if (this.phaseQueuePrepend.length) {
      while (this.phaseQueuePrepend.length) {
        const poppedPhase = this.phaseQueuePrepend.pop();
        if (poppedPhase) {
          this.phaseQueue.unshift(poppedPhase);
        }
      }
    }
    if (!this.phaseQueue.length) {
      this.populatePhaseQueue();
      // Clear the conditionalQueue if there are no phases left in the phaseQueue
      this.conditionalQueue = [];
    }

    this.currentPhase = this.phaseQueue.shift() ?? null;

    // Check if there are any conditional phases queued
    if (this.conditionalQueue?.length) {
      // Retrieve the first conditional phase from the queue
      const conditionalPhase = this.conditionalQueue.shift();
      // Evaluate the condition associated with the phase
      if (conditionalPhase?.[0]()) {
        // If the condition is met, add the phase to the phase queue
        this.pushPhase(conditionalPhase[1]);
      } else if (conditionalPhase) {
        // If the condition is not met, re-add the phase back to the front of the conditional queue
        this.conditionalQueue.unshift(conditionalPhase);
      } else {
        console.warn("condition phase is undefined/null!", conditionalPhase);
      }
    }

    if (this.currentPhase) {
      console.log(`%cStart Phase ${this.currentPhase.constructor.name}`, "color:green;");
      this.currentPhase.start();
    }
  }

  overridePhase(phase: Phase): boolean {
    if (this.standbyPhase) {
      return false;
    }

    this.standbyPhase = this.currentPhase;
    this.currentPhase = phase;
    console.log(`%cStart Phase ${phase.constructor.name}`, "color:green;");
    phase.start();

    return true;
  }

  /**
   * Find a specific {@linkcode Phase} in the phase queue.
   *
   * @param phaseFilter filter function to use to find the wanted phase
   * @returns the found phase or undefined if none found
   */
  findPhase<P extends Phase = Phase>(phaseFilter: (phase: P) => boolean): P | undefined {
    return this.phaseQueue.find(phaseFilter) as P;
  }

  tryReplacePhase(phaseFilter: (phase: Phase) => boolean, phase: Phase): boolean {
    const phaseIndex = this.phaseQueue.findIndex(phaseFilter);
    if (phaseIndex > -1) {
      this.phaseQueue[phaseIndex] = phase;
      return true;
    }
    return false;
  }

  tryRemovePhase(phaseFilter: (phase: Phase) => boolean): boolean {
    const phaseIndex = this.phaseQueue.findIndex(phaseFilter);
    if (phaseIndex > -1) {
      this.phaseQueue.splice(phaseIndex, 1);
      return true;
    }
    return false;
  }

  /**
   * Will search for a specific phase in {@linkcode phaseQueuePrepend} via filter, and remove the first result if a match is found.
   * @param phaseFilter filter function
   */
  tryRemoveUnshiftedPhase(phaseFilter: (phase: Phase) => boolean): boolean {
    const phaseIndex = this.phaseQueuePrepend.findIndex(phaseFilter);
    if (phaseIndex > -1) {
      this.phaseQueuePrepend.splice(phaseIndex, 1);
      return true;
    }
    return false;
  }

  /**
   * Tries to add the input phase to index before target phase in the phaseQueue, else simply calls unshiftPhase()
   * @param phase {@linkcode Phase} the phase to be added
   * @param targetPhase {@linkcode Phase} the type of phase to search for in phaseQueue
   * @returns boolean if a targetPhase was found and added
   */
  prependToPhase(phase: Phase | Phase[], targetPhase: Constructor<Phase>): boolean {
    if (!Array.isArray(phase)) {
      phase = [phase];
    }
    const targetIndex = this.phaseQueue.findIndex(ph => ph instanceof targetPhase);

    if (targetIndex !== -1) {
      this.phaseQueue.splice(targetIndex, 0, ...phase);
      return true;
    }
    this.unshiftPhase(...phase);
    return false;
  }

  /**
   * Attempt to add the input phase(s) to index after target phase in the {@linkcode phaseQueue}, else simply calls {@linkcode unshiftPhase()}
   * @param phase - The phase(s) to be added
   * @param targetPhase - The type of phase to search for in {@linkcode phaseQueue}
   * @returns `true` if a `targetPhase` was found to append to
   */
  appendToPhase(phase: Phase | Phase[], targetPhase: Constructor<Phase>): boolean {
    if (!Array.isArray(phase)) {
      phase = [phase];
    }
    const targetIndex = this.phaseQueue.findIndex(ph => ph instanceof targetPhase);

    if (targetIndex !== -1 && this.phaseQueue.length > targetIndex) {
      this.phaseQueue.splice(targetIndex + 1, 0, ...phase);
      return true;
    }
    this.unshiftPhase(...phase);
    return false;
  }

  /**
   * Adds a MessagePhase, either to PhaseQueuePrepend or nextCommandPhaseQueue
   * @param message - string for MessagePhase
   * @param callbackDelay - optional param for MessagePhase constructor
   * @param prompt - optional param for MessagePhase constructor
   * @param promptDelay - optional param for MessagePhase constructor
   * @param defer - Whether to allow the phase to be deferred
   *
   * @see {@linkcode MessagePhase} for more details on the parameters
   */
  queueMessage(
    message: string,
    callbackDelay?: number | null,
    prompt?: boolean | null,
    promptDelay?: number | null,
    defer?: boolean | null,
  ) {
    const phase = new MessagePhase(message, callbackDelay, prompt, promptDelay);
    if (!defer) {
      // adds to the end of PhaseQueuePrepend
      this.unshiftPhase(phase);
    } else {
      //remember that pushPhase adds it to nextCommandPhaseQueue
      this.pushPhase(phase);
    }
  }

  /**
   * Queues an ability bar flyout phase
   * @param pokemon The pokemon who has the ability
   * @param passive Whether the ability is a passive
   * @param show Whether to show or hide the bar
   */
  public queueAbilityDisplay(pokemon: Pokemon, passive: boolean, show: boolean): void {
    this.unshiftPhase(show ? new ShowAbilityPhase(pokemon.getBattlerIndex(), passive) : new HideAbilityPhase());
    this.clearPhaseQueueSplice();
  }

  /**
   * Hides the ability bar if it is currently visible
   */
  public hideAbilityBar(): void {
    if (globalScene.abilityBar.isVisible()) {
      this.unshiftPhase(new HideAbilityPhase());
    }
  }

  /**
   * Moves everything from nextCommandPhaseQueue to phaseQueue (keeping order)
   */
  private populatePhaseQueue(): void {
    if (this.nextCommandPhaseQueue.length) {
      this.phaseQueue.push(...this.nextCommandPhaseQueue);
      this.nextCommandPhaseQueue.splice(0, this.nextCommandPhaseQueue.length);
    }
    this.phaseQueue.push(new TurnInitPhase());
  }
}
