import type { GrammarModule } from "#grammar/common";
import {
  capitalizeFirst,
  findProtectedSpans,
  getSourceLanguage,
  getStringVariables,
  isProtected,
  type ProcessorOptions,
  withCapitalizeOption,
} from "#grammar/common";
import type { PostProcessorModule } from "i18next";

const VOWEL_START = /^[aeioué]/i;
const ACRONYM = /^[A-Z]+$/;
const VOWEL_SOUNDING_LETTER_NAMES = "AEFHILMNORSX";
const CONSONANT_SOUND_PREFIXES = /^(uni(?![mnd])|unan|use|usu|uti|eu|one|once|ura|uk)/i;
const SILENT_H_PREFIXES = /^(hour|honest|honou?r|heir)/i;

const ARTICLE_PATTERN = /(?<![\p{L}\p{N}'’-])(an?)\s+((?:@\w\{[^}]*\})*)(\p{L}[\p{L}\p{N}'’-]*)/giu;

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

export function applyEnglishArticles(text: string, protectedValues: readonly string[] = []): string {
  const spans = findProtectedSpans(text, protectedValues);
  return text.replace(ARTICLE_PATTERN, (match, article: string, markup: string, next: string, offset: number) => {
    if (isProtected(spans, offset)) {
      return match;
    }
    const corrected = startsWithEnglishVowelSound(next) ? "an" : "a";
    const result = article[0] === "A" ? capitalizeFirst(corrected) : corrected;
    return `${result} ${markup}${next}`;
  });
}

export class EnglishArticleProcessor implements PostProcessorModule {
  public readonly name = "english-article";
  public readonly type = "postProcessor";

  process(
    value: string,
    _key: string | string[],
    options: ProcessorOptions | undefined,
    translator: { language?: string },
  ): string {
    return getSourceLanguage(options, translator).startsWith("en")
      ? applyEnglishArticles(value, getStringVariables(options))
      : value;
  }
}

export const ENGLISH_ARTICLE_FORMAT = "en_indefinite"; // a; an
export const ENGLISH_POSSESSIVE_FORMAT = "en_possessive"; //’s; ’

export function withEnglishPossessive(noun: string): string {
  return /s$/i.test(noun) ? `${noun}’` : `${noun}’s`;
}

export function createEnglishArticleFormatter() {
  return withCapitalizeOption("en", (value: unknown) => withEnglishArticle(String(value)));
}

export function createEnglishPossessiveFormatter() {
  return withCapitalizeOption("en", (value: unknown) => withEnglishPossessive(String(value)));
}

export const GRAMMAR: GrammarModule = {
  postProcessors: [new EnglishArticleProcessor()],
  formatters: {
    [ENGLISH_ARTICLE_FORMAT]: createEnglishArticleFormatter(),
    [ENGLISH_POSSESSIVE_FORMAT]: createEnglishPossessiveFormatter(),
  },
};
