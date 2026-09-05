import { globalScene } from "#app/global-scene";
import type { SceneBase } from "#app/scene-base";

/**
 * Create a Timer event and wait for it to conclude.
 * @param delay - The delay (in milliseconds) to wait for
 * @param scene - (Default {@linkcode globalScene}) The {@linkcode SceneBase} on which the timer event should play
 * @returns A Promise that resolves once the timer event has concluded.
 * @remarks
 * This is most useful for waiting between portions of animations or other time-based events
 * in increments not directly related to the durations of said events.
 * @example
 * ```ts
 * // do first part of animation...
 * await waitTime(1000);
 * // do second part of animation...
 * ```
 */
export async function waitTime(delay: number, scene: SceneBase = globalScene): Promise<void> {
  await new Promise(resolve => scene.time.delayedCall(delay, resolve));
}
