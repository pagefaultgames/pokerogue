import BattleScene from "#app/battle-scene";
import { getTextWithColors, TextStyle } from "#app/ui/text";
import { UiTheme } from "#enums/ui-theme";
import { isNullOrUndefined } from "#app/utils";
import i18next from "i18next";

export function getEncounterText(scene: BattleScene, keyOrString: string, primaryStyle?: TextStyle, uiTheme: UiTheme = UiTheme.DEFAULT): string {
  if (isNullOrUndefined(keyOrString)) {
    return null;
  }

  let textString: string = getTextWithDialogueTokens(scene, keyOrString);

  // Can only color the text if a Primary Style is defined
  // primaryStyle is applied to all text that does not have its own specified style
  if (primaryStyle) {
    textString = getTextWithColors(textString, primaryStyle, uiTheme);
  }

  return textString;
}

function getTextWithDialogueTokens(scene: BattleScene, keyOrString: string): string {
  if (isNullOrUndefined(keyOrString)) {
    return null;
  }

  if (i18next.exists(keyOrString, scene.currentBattle?.mysteryEncounter?.dialogueTokens)) {
    const stringArray = [`${keyOrString}`] as any;
    stringArray.raw = [`${keyOrString}`];
    return i18next.t(stringArray, scene.currentBattle?.mysteryEncounter?.dialogueTokens);
  }

  return keyOrString;
}

/**
 * Will queue a message in UI with injected encounter data tokens
 * @param scene
 * @param contentKey
 */
export function queueEncounterMessage(scene: BattleScene, contentKey: string): void {
  const text: string = getEncounterText(scene, contentKey);
  scene.queueMessage(text, null, true);
}

/**
 * Will display a message in UI with injected encounter data tokens
 * @param scene
 * @param contentKey
 * @param prompt
 * @param callbackDelay
 */
export function showEncounterText(scene: BattleScene, contentKey: string, callbackDelay: number = 0, prompt: boolean = true): Promise<void> {
  return new Promise<void>(resolve => {
    const text: string = getEncounterText(scene, contentKey);
    scene.ui.showText(text, null, () => resolve(), callbackDelay, prompt);
  });
}

/**
 * Will display a dialogue (with speaker title) in UI with injected encounter data tokens
 * @param scene
 * @param textContentKey
 * @param speakerContentKey
 * @param callback
 */
export function showEncounterDialogue(scene: BattleScene, textContentKey: string, speakerContentKey: string, callback?: Function) {
  const text: string = getEncounterText(scene, textContentKey);
  const speaker: string = getEncounterText(scene, speakerContentKey);
  scene.ui.showDialogue(text, speaker, null, callback, 0, 0);
}
