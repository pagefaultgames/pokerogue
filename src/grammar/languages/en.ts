import type { GrammarModule } from "#grammar/common";
import { getSourceLanguage, getStringVariables, type ProcessorOptions, withCapitalizeOption } from "#grammar/common";
import type { PostProcessorModule } from "i18next";

const VOWEL_START = /^[aeioué]/i;
const ACRONYM = /^[A-Z]+$/;
const VOWEL_SOUNDING_LETTER_NAMES = "AEFHILMNORSX";
const CONSONANT_SOUND_PREFIXES = /^(uni(?![mnd])|unan|use|usu|uti|eu|one|once|ura|uk)/i;
const SILENT_H_PREFIXES = /^(hour|honest|honou?r|heir)/i;

export function startsWithEnglishVowelSound(word: string): boolean {
  const firstPart = word.split(/[-’']/)[0];
  if (ACRONYM.test(firstPart)) {
    return VOWEL_SOUNDING_LETTER_NAMES.includes(firstPart[0]);
  }
  if (SILENT_H_PREFIXES.test(word)) {
    return true;
  }
  return VOWEL_START.test(word) && !CONSONANT_SOUND_PREFIXES.test(word);
}

export function withEnglishArticle(noun: string): string {
  return `${startsWithEnglishVowelSound(noun) ? "an" : "a"} ${noun}`;
}

export function applyEnglishPossessives(text: string, interpolatedValues: readonly string[] = []): string {
  let result = text;
  for (const value of interpolatedValues) {
    if (value === "") {
      continue;
    }
    let index = result.indexOf(value);
    while (index !== -1) {
      const suffixIndex = index + value.length;
      const suffix = result.slice(suffixIndex, suffixIndex + 2);
      if (/^['’]s$/iu.test(suffix)) {
        const possessive = withEnglishPossessive(value);
        result = `${result.slice(0, index)}${possessive}${result.slice(suffixIndex + 2)}`;
        index = result.indexOf(value, index + possessive.length);
      } else {
        index = result.indexOf(value, suffixIndex);
      }
    }
  }
  return result;
}

export class EnglishPossessiveProcessor implements PostProcessorModule {
  public readonly name = "english-possessive";
  public readonly type = "postProcessor";

  process(
    value: string,
    _key: string | string[],
    options: ProcessorOptions | undefined,
    translator: { language?: string },
  ): string {
    if (!getSourceLanguage(options, translator).startsWith("en")) {
      return value;
    }
    const variables = getStringVariables(options);
    return applyEnglishPossessives(value, variables);
  }
}

export const ENGLISH_ARTICLE_FORMAT = "en_indefinite"; // a; an
export const ENGLISH_POSSESSIVE_FORMAT = "en_possessive"; //’s; ’

export function withEnglishPossessive(noun: string): string {
  return /s$/i.test(noun) ? `${noun}’` : `${noun}’s`;
}

export function createEnglishArticleFormatter() {
  return withCapitalizeOption((value: unknown) => withEnglishArticle(String(value)));
}

export function createEnglishPossessiveFormatter() {
  return withCapitalizeOption((value: unknown) => withEnglishPossessive(String(value)));
}

export const GRAMMAR: GrammarModule = {
  postProcessors: [new EnglishPossessiveProcessor()],
  formatters: {
    [ENGLISH_ARTICLE_FORMAT]: createEnglishArticleFormatter(),
    [ENGLISH_POSSESSIVE_FORMAT]: createEnglishPossessiveFormatter(),
  },
};
