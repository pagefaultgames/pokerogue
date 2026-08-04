import { settings } from "#app/global-settings-manager";
import type { AudioManager as GlobalAudioManager } from "#audio/audio-manager";

export let audioManager: GlobalAudioManager;

// This is necessary to avoid a crash when running the pokemon data export script due to phaser-rex3 being imported
// If that is fixed, this can be removed and replaced with `export const audioManager = new AudioManager();` again
export async function initGlobalAudioManager(): Promise<void> {
  const { AudioManager } = await import("#audio/audio-manager");
  const {
    bgmVolume: bgm,
    fieldVolume: field,
    masterVolume: main,
    soundEffectsVolume: se,
    uiVolume: ui,
  } = settings.audio;
  audioManager = new AudioManager({ bgm, field, main, se, ui });
}
