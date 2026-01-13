import { globalScene } from "#app/global-scene";
import type { SceneBase } from "#app/scene-base";

/**
 * Create a Timer event and wait for it to conclude.
 * @param delay - The delay (in milliseconds) to wait for
 * @param scene - The {@linkcode SceneBase} on which the timer event plays; default {@linkcode globalScene}
 * @returns A Promise that resolves once the timer event has concluded.
 */
export async function waitTime(delay: number, scene: SceneBase = globalScene): Promise<void> {
  await new Promise(resolve => scene.time.delayedCall(delay, resolve));
}
