import BattleScene from "#app/battle-scene";
import { getTextWithColors, TextStyle } from "#app/ui/text";
import { UiTheme } from "#enums/ui-theme";
import { isNullOrUndefined } from "#app/utils";
import i18next from "i18next";

export function getEncounterText(scene: BattleScene, keyOrString?: string, primaryStyle?: TextStyle, uiTheme: UiTheme = UiTheme.DEFAULT): string | null {
  if (isNullOrUndefined(keyOrString)) {
    return null;
  }

  let textString: string | null = getTextWithDialogueTokens(scene, keyOrString);

  // Can only color the text if a Primary Style is defined
  // primaryStyle is applied to all text that does not have its own specified style
  if (primaryStyle && textString) {
    textString = getTextWithColors(textString, primaryStyle, uiTheme);
  }

  return textString;
}

function getTextWithDialogueTokens(scene: BattleScene, keyOrString?: string): string | null {
  if (isNullOrUndefined(keyOrString)) {
    return null;
  }

  const tokens = scene.currentBattle?.mysteryEncounter?.dialogueTokens;
  // @ts-ignore
  if (i18next.exists(keyOrString, tokens)) {
    const stringArray = [`${keyOrString}`] as any;
    stringArray.raw = [`${keyOrString}`];
    // @ts-ignore
    return i18next.t(stringArray, tokens) as string;
  }

  return keyOrString ?? null;
}

/**
 * Will queue a message in UI with injected encounter data tokens
 * @param scene
 * @param contentKey
 */
export function queueEncounterMessage(scene: BattleScene, contentKey: string): void {
  const text: string | null = getEncounterText(scene, contentKey);
  scene.queueMessage(text ?? "", null, true);
}

/**
 * Will display a message in UI with injected encounter data tokens
 * @param scene
 * @param contentKey
 * @param prompt
 * @param callbackDelay
 * @param promptDelay
 */
export function showEncounterText(scene: BattleScene, contentKey: string, callbackDelay: number = 0, prompt: boolean = true, promptDelay: number | null = null): Promise<void> {
  return new Promise<void>(resolve => {
    const text: string | null = getEncounterText(scene, contentKey);
    scene.ui.showText(text ?? "", null, () => resolve(), callbackDelay, prompt, promptDelay);
  });
}

/**
 * Will display a dialogue (with speaker title) in UI with injected encounter data tokens
 * @param scene
 * @param textContentKey
 * @param speakerContentKey
 * @param callbackDelay
 */
export function showEncounterDialogue(scene: BattleScene, textContentKey: string, speakerContentKey: string, callbackDelay: number = 0): Promise<void> {
  return new Promise<void>(resolve => {
    const text: string | null = getEncounterText(scene, textContentKey);
    const speaker: string | null = getEncounterText(scene, speakerContentKey);
    scene.ui.showDialogue(text ?? "", speaker ?? "", null, () => resolve(), callbackDelay);
  });
}
