import { globalScene } from "#app/global-scene";
import type { TextStyle } from "#enums/text-style";
import { getTextWithColors } from "#ui/text";
import { isNullOrUndefined } from "#utils/common";
import i18next from "i18next";

/**
 * Will inject all relevant dialogue tokens that exist in the {@linkcode globalScene.currentBattle.mysteryEncounter.dialogueTokens}, into i18n text.
 * Also adds BBCodeText fragments for colored text, if applicable
 * @param keyOrString
 * @param primaryStyle Can define a text style to be applied to the entire string. Must be defined for BBCodeText styles to be applied correctly
 */
export function getEncounterText(keyOrString?: string, primaryStyle?: TextStyle): string | null {
  if (isNullOrUndefined(keyOrString)) {
    return null;
  }

  let textString: string | null = getTextWithDialogueTokens(keyOrString);

  // Can only color the text if a Primary Style is defined
  // primaryStyle is applied to all text that does not have its own specified style
  if (primaryStyle && textString) {
    textString = getTextWithColors(textString, primaryStyle, true);
  }

  return textString;
}

/**
 * Helper function to inject {@linkcode globalScene.currentBattle.mysteryEncounter.dialogueTokens} into a given content string
 * @param scene
 * @param keyOrString
 */
function getTextWithDialogueTokens(keyOrString: string): string | null {
  const tokens = globalScene.currentBattle?.mysteryEncounter?.dialogueTokens;

  if (i18next.exists(keyOrString, tokens)) {
    return i18next.t(keyOrString, tokens) as string;
  }

  return keyOrString ?? null;
}

/**
 * Will queue a message in UI with injected encounter data tokens
 * @param scene
 * @param contentKey
 */
export function queueEncounterMessage(contentKey: string): void {
  const text: string | null = getEncounterText(contentKey);
  globalScene.phaseManager.queueMessage(text ?? "", null, true);
}

/**
 * Will display a message in UI with injected encounter data tokens
 * @param scene
 * @param contentKey
 * @param delay
 * @param prompt
 * @param callbackDelay
 * @param promptDelay
 */
export function showEncounterText(
  contentKey: string,
  delay: number | null = null,
  callbackDelay = 0,
  prompt = true,
  promptDelay: number | null = null,
): Promise<void> {
  return new Promise<void>(resolve => {
    const text: string | null = getEncounterText(contentKey);
    globalScene.ui.showText(text ?? "", delay, () => resolve(), callbackDelay, prompt, promptDelay);
  });
}

/**
 * Will display a dialogue (with speaker title) in UI with injected encounter data tokens
 * @param scene
 * @param textContentKey
 * @param delay
 * @param speakerContentKey
 * @param callbackDelay
 */
export function showEncounterDialogue(
  textContentKey: string,
  speakerContentKey: string,
  delay: number | null = null,
  callbackDelay = 0,
): Promise<void> {
  return new Promise<void>(resolve => {
    const text: string | null = getEncounterText(textContentKey);
    const speaker: string | null = getEncounterText(speakerContentKey);
    globalScene.ui.showDialogue(text ?? "", speaker ?? "", delay, () => resolve(), callbackDelay);
  });
}
