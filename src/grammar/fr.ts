import type { PostProcessorModule } from "i18next";

// #region Elision

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

/** Lowercase words starting with an *h aspiré* (or a vowel letter with a consonant sound), which block elision. */
export const NO_ELISION_WORDS: ReadonlySet<string> = new Set([
  // h aspiré
  "hache",
  "hachécateur",
  "hanche",
  "haricot",
  "harceleur",
  "hasard",
  "haut",
  "hâte",
  "hérisson",
  "héros",
  "hibou",
  "homard",
  "honte",
  "hoothoot",
  "housse",
  "huit",
  "hurle",
  "hurlement",
  // vowel letters with a consonant sound
  "onze",
  "oui",
  "uhlan",
  "yacht",
  "yaourt",
  "yen",
  "yéti",
  "yoga",
]);

const VOWEL_START = /^[aeiouyàâäéèêëîïôöùûüœæh]/i;

// Optional game markup (such as "@c{smile}") may sit between the article and the next word.
const ELISION_PATTERN = new RegExp(
  `(?<![\\p{L}\\p{N}'’])(${Object.keys(ELIDED_FORMS).join("|")})\\s+((?:@\\w\\{[^}]*\\})*)(\\p{L}[\\p{L}'’-]*)`,
  "giu",
);

/**
 * Whether `word` begins with a vowel sound (or *h muet*) and thus triggers elision.
 * @param word - The word to check
 * @param ignoreExceptions - (Default `false`) Whether to skip the {@linkcode NO_ELISION_WORDS} list and only test the first letter
 */
export function startsWithVowelSound(word: string, ignoreExceptions = false): boolean {
  if (!VOWEL_START.test(word)) {
    return false;
  }
  if (ignoreExceptions) {
    return true;
  }
  // Compound words such as "Hurle-Queue" are checked on their first part only
  const firstPart = word.toLowerCase().split(/[-’']/)[0];
  return !NO_ELISION_WORDS.has(firstPart);
}

/**
 * Replace "le/la/je/me/te/se/ne/de/que" followed by a vowel sound with the elided form (`l’`, `d’`, `qu’`, ...).
 * @param text - The fully interpolated French text
 * @returns The text with elisions applied
 */
export function applyFrenchElision(text: string): string {
  return text.replace(ELISION_PATTERN, (match, article: string, markup: string, next: string) => {
    if (!startsWithVowelSound(next)) {
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

// #endregion Elision

// #region Noun data

/**
 * Codes: `m` / `f` = gender; append `p` for plural names; append `h` to block elision
 * (*h aspiré*, or a vowel letter with a consonant sound such as "onze").
 */
export type FrenchNounCode = "m" | "f" | "mp" | "fp" | "mh" | "fh";

/**
 * Grammatical info for French nouns, as comma/newline-separated lists of localized names per code.
 * Names that are missing fall back to masculine, singular, with elision decided from the first letter.
 * Run `pnpm french-grammar:missing` to list names that still have no entry.
 */
const NOUN_LISTS: Readonly<Record<FrenchNounCode, string>> = {
  m: `
    Méga-Bracelet, Poignet Dynamax, Total Soin, PP Plus, PP Max, Multi Exp, Équilibr’Exp, Muscle +, Poireau,
    Évoluroc, Poké Écrin, Bandeau, Témoin, Charbon, Aimant, PV Plus, Fer, Calcium, Zinc, Carbone, Aucun,
    Améliorator, CD Douteux, Tissu Fauche, Électriseur, Magmariseur, Protecteur, Chantibonbon, Métal Composite
  `,
  f: `
    Poké Ball, Super Ball, Hyper Ball, Rogue Ball, Master Ball, Luxe Ball, Poké Ball Dorée,
    Carte, Guérison, Résugraine, Lentilscope, Loupe, Bonbonnière, Protéine, Bel’Écaille, Obsidienne,
    Gracidée, Necroluna, Necrosol
  `,
  mp: "Restes, Trésors, Maxi Champis",
  fp: "Lunettes Noires, Rênes de l’Unité du Froid, Rênes de l’Unité d’Effroi",
  mh: "",
  // "Heatran" is pronounced with an aspirated h
  fh: "Heatranite",
};

/**
 * Head words: the first word of a name found here decides its code (checked after the exact names above).
 * Modifiers like "Super", "Hyper", "Maxi", "Vieux" or "Rogue" are not listed, so they are skipped.
 */
const HEAD_LISTS: Readonly<Record<"m" | "f", string>> = {
  m: `
    Charme, Jeton, Module, Masque, Rouleau, Globe, Galet, Bol, Bracelet, Orbe, Jus, Grelot, Poing, Croc,
    Élixir, Parfum, Rappel, Bec, Pic, Sable, Mouchoir, Sac, Bonbon, Gâteau, Ducat, Trou, Bloc, Fil, Miroir,
    Vase, Bouclier, Sachet, Emblème, Scanner, Pointeau, Champi, Œuf, Sprint, Filet
  `,
  f: `
    Baie, Pierre, Plaque, ROM, Gemme, Méteorite, Potion, Huile, Poudre, Théière, Pomme, Écaille, Roche,
    Plume, Graine, Glace, Cuillère, Ceinture, Peau, Eau, Rune, Balle, Masse, Dent, Griffe, Flute, Couronne,
    Armure, Lentille, Pièce, Pépite, Boue, Cendre, Herbe, Rosée, Épée, Fraise, Boite,
    Attaque, Défense, Atq., Déf., Vitesse, Précision
  `,
};

/** Mega Stones ("Dracaufite X", "Absolite Z"...) are all feminine. */
const MEGA_STONE_PATTERN = /[iï]te( [xyz])?$/;

/** Build the lookup key for a noun: lowercase, NFC-normalized, with any whitespace (including non-breaking spaces) collapsed. */
export function toFrenchNounKey(name: string): string {
  return name.trim().toLowerCase().normalize("NFC").replace(/\s+/g, " ");
}

let nounCodes: Map<string, FrenchNounCode> | undefined;
let headCodes: Map<string, FrenchNounCode> | undefined;

function parseList(list: string, code: FrenchNounCode, target: Map<string, FrenchNounCode>): void {
  for (const name of list.split(",")) {
    if (name.trim() !== "") {
      target.set(toFrenchNounKey(name), code);
    }
  }
}

/** Build the lookups on first use so French grammar data costs nothing for players in other languages. */
function buildLookups(): Map<string, FrenchNounCode> {
  if (nounCodes === undefined || headCodes === undefined) {
    nounCodes = new Map();
    headCodes = new Map();
    for (const [code, list] of Object.entries(NOUN_LISTS) as [FrenchNounCode, string][]) {
      parseList(list, code, nounCodes);
    }
    for (const [code, list] of Object.entries(HEAD_LISTS) as ["m" | "f", string][]) {
      parseList(list, code, headCodes);
    }
  }
  return nounCodes;
}

/**
 * Get the grammar code of a noun: exact entry first, then the first known head word, then Mega Stone suffix.
 * @param name - The localized noun
 * @returns The noun's {@linkcode FrenchNounCode}, or `undefined` if it has no entry
 */
export function getFrenchNounCode(name: string): FrenchNounCode | undefined {
  const key = toFrenchNounKey(name);
  const exact = buildLookups().get(key);
  if (exact !== undefined) {
    return exact;
  }
  for (const word of key.split(" ")) {
    const code = headCodes?.get(word);
    if (code !== undefined) {
      return code;
    }
  }
  return MEGA_STONE_PATTERN.test(key) ? "f" : undefined;
}

// #endregion Noun data

// #region Articles

export type FrenchArticleForm = "definite" | "indefinite" | "de" | "a";

interface NounInfo {
  feminine: boolean;
  plural: boolean;
  /** Whether a singular definite/prepositional article would elide before this noun */
  elides: boolean;
}

function lookupNoun(noun: string): NounInfo {
  const code = getFrenchNounCode(noun);
  if (code === undefined) {
    return { feminine: false, plural: false, elides: startsWithVowelSound(noun) };
  }
  return {
    feminine: code.startsWith("f"),
    plural: code.includes("p"),
    elides: !code.includes("h") && startsWithVowelSound(noun, true),
  };
}

interface ArticleForms {
  masculine: string;
  feminine: string;
  /** Used before a vowel sound; the apostrophe attaches directly to the noun. Indefinite forms never elide. */
  elided?: string;
  plural: string;
}

const ARTICLE_FORMS: Readonly<Record<FrenchArticleForm, ArticleForms>> = {
  definite: { masculine: "le", feminine: "la", elided: "l’", plural: "les" },
  indefinite: { masculine: "un", feminine: "une", plural: "des" },
  de: { masculine: "du", feminine: "de la", elided: "de l’", plural: "des" },
  a: { masculine: "au", feminine: "à la", elided: "à l’", plural: "aux" },
};

/**
 * Prepend the requested French article to `noun`, choosing it from the noun's gender, number and first sound.
 * @param noun - The localized noun
 * @param form - Which article to use:
 * - `definite`: le / la / l’ / les
 * - `indefinite`: un / une / des
 * - `de`: du / de la / de l’ / des
 * - `a`: au / à la / à l’ / aux
 * @returns The noun preceded by its article, in lowercase
 */
export function withFrenchArticle(noun: string, form: FrenchArticleForm): string {
  const { feminine, plural, elides } = lookupNoun(noun);
  const forms = ARTICLE_FORMS[form];

  if (plural) {
    return `${forms.plural} ${noun}`;
  }
  if (elides && forms.elided) {
    return `${forms.elided}${noun}`;
  }
  return `${feminine ? forms.feminine : forms.masculine} ${noun}`;
}

/** Formatter names (all lowercase, as i18next normalizes them) mapped to their article form. */
export const FRENCH_ARTICLE_FORMATS: Readonly<Record<string, FrenchArticleForm>> = {
  fr_definite: "definite",
  fr_indefinite: "indefinite",
  fr_de: "de",
  fr_a: "a",
};

/**
 * Create an i18next formatter that applies an article form for French and returns the value untouched otherwise.
 * @param form - The article form to apply
 */
export function createFrenchArticleFormatter(form: FrenchArticleForm): (value: unknown, lng?: string) => string {
  return (value, lng) => {
    const text = String(value);
    return lng?.startsWith("fr") ? withFrenchArticle(text, form) : text;
  };
}

// #endregion Articles
