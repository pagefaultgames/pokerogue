import { globalScene } from "#app/global-scene";
import type { TextStyle } from "#enums/text-style";
import type { ShowDialogueOptions, ShowTextOptions } from "#types/ui-types";
import { getTextWithColors } from "#ui/text";
import i18next from "i18next";

interface ShowEncounterTextOptions extends Omit<ShowTextOptions, "callback" | "prompt"> {
  /**
   * Whether to display the prompt icon at the end of the textbox.
   * @defaultValue `true`
   */
  readonly prompt?: boolean;
}

/**
 * Will inject all relevant dialogue tokens that exist in the {@linkcode globalScene.currentBattle.mysteryEncounter.dialogueTokens}, into i18n text.
 * Also adds BBCodeText fragments for colored text, if applicable
 * @param keyOrString
 * @param primaryStyle Can define a text style to be applied to the entire string. Must be defined for BBCodeText styles to be applied correctly
 */
export function getEncounterText(keyOrString?: undefined, primaryStyle?: TextStyle): null;
export function getEncounterText(keyOrString: string, primaryStyle?: TextStyle): string;
export function getEncounterText(keyOrString?: string, primaryStyle?: TextStyle): string | null;
export function getEncounterText(keyOrString?: string, primaryStyle?: TextStyle): string | null {
  if (keyOrString == null) {
    return null;
  }

  let textString = getTextWithDialogueTokens(keyOrString);

  // Can only color the text if a Primary Style is defined
  // primaryStyle is applied to all text that does not have its own specified style
  if (primaryStyle && textString) {
    textString = getTextWithColors(textString, primaryStyle, true);
  }

  return textString;
}

/**
 * Helper function to inject {@linkcode globalScene.currentBattle.mysteryEncounter.dialogueTokens} into a given content string
 * @param keyOrString
 */
function getTextWithDialogueTokens(keyOrString: string): string {
  const tokens = globalScene.currentBattle?.mysteryEncounter?.dialogueTokens;

  if (i18next.exists(keyOrString, tokens)) {
    return i18next.t(keyOrString, tokens);
  }

  return keyOrString;
}

/**
 * Will queue a message in UI with injected encounter data tokens
 * @param contentKey - The key representing the localized text
 */
export function queueEncounterMessage(contentKey: string): void {
  const text = getEncounterText(contentKey) ?? "";
  globalScene.phaseManager.queueMessage(text, { prompt: true });
}

/**
 * Will display a message in UI with injected encounter data tokens
 * @param contentKey - The key representing the localized text
 */
export async function showEncounterText(
  contentKey: string,
  { delay, callbackDelay = 0, prompt = true, promptDelay }: ShowEncounterTextOptions = {},
): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();

  const text = getEncounterText(contentKey) ?? "";
  globalScene.ui.showText(text, { delay, callback: () => resolve(), callbackDelay, prompt, promptDelay });

  return await promise;
}

/**
 * Will display a dialogue (with speaker title) in UI with injected encounter data tokens
 * @param textContentKey - The content key relating to the dialogue
 * @param speakerContentKey - The content key relating to the speaker
 */
export async function showEncounterDialogue(
  textContentKey: string,
  speakerContentKey: string,
  { delay, callbackDelay = 0 }: Omit<ShowDialogueOptions, "name" | "promptDelay"> = {},
): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();

  const text = getEncounterText(textContentKey) ?? "";
  const speaker = getEncounterText(speakerContentKey) ?? "";
  globalScene.ui.showDialogue(text, speaker, () => resolve(), { delay, callbackDelay });

  return await promise;
}
