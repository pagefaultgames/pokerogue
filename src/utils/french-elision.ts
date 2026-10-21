import type { PostProcessorModule } from "i18next";

const ELIDED_FORMS: Readonly<Record<string, string>> = {
  le: "l",
  la: "l",
  je: "j",
  me: "m",
  te: "t",
  se: "s",
  ne: "n",
  de: "d",
  que: "qu",
};

export const NO_ELISION_WORDS: Set<string> = new Set([
  // h aspiré
  "hache",
  "hanche",
  "haricot",
  "harceleur",
  "hérisson",
  "héros",
  "hibou",
  "homard",
  "honte",
  "housse",
  "hurlement",
  "huit",
  "hâte",
  "haut",
  "hasard",
  "Hoothoot",
  "Hachécateur",
  "hurle",
  // vowel letters with a consonant sound
  "onze",
  "oui",
  "yacht",
  "yaourt",
  "yéti",
  "yoga",
  "yen",
  "uhlan",
]);

const VOWEL_START = /^[aeiouyàâäéèêëîïôöùûüœæh]/i;

// Optional game markup (such as "@c{smile}") may sit between the article and the next word.
const ELISION_PATTERN = new RegExp(
  `(?<![\\p{L}\\p{N}'’])(${Object.keys(ELIDED_FORMS).join("|")})\\s+((?:@\\w\\{[^}]*\\})*)(\\p{L}[\\p{L}'’-]*)`,
  "giu",
);

function triggersElision(word: string): boolean {
  if (!VOWEL_START.test(word)) {
    return false;
  }

  const firstPart = word.toLowerCase().split(/[-’']/)[0];
  return !NO_ELISION_WORDS.has(firstPart);
}

/**
 * @param text
 * @returns
 */

export function applyFrenchElision(text: string): string {
  return text.replace(ELISION_PATTERN, (match, article: string, markup: string, next: string) => {
    if (!triggersElision(next)) {
      return match;
    }
    const base = ELIDED_FORMS[article.toLowerCase()];
    return `${article.slice(0, base.length)}’${markup}${next}`;
  });
}

/** i18next post-processor applying {@linkcode applyFrenchElision} to French translations only. */
export class FrenchElisionProcessor implements PostProcessorModule {
  public readonly name = "french-elision";
  public readonly type = "postProcessor";

  process(
    value: string,
    _key: string | string[],
    options: { lng?: string } | undefined,
    translator: { language?: string },
  ): string {
    const language = options?.lng ?? translator.language ?? "";
    return language.startsWith("fr") ? applyFrenchElision(value) : value;
  }
}
