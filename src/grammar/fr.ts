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

export const NO_ELISION_WORDS: ReadonlySet<string> = new Set([
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

const ELISION_PATTERN = new RegExp(
  `(?<![\\p{L}\\p{N}'’])(${Object.keys(ELIDED_FORMS).join("|")})\\s+((?:@\\w\\{[^}]*\\})*)(\\p{L}[\\p{L}'’-]*)`,
  "giu",
);

export function startsWithVowelSound(word: string, ignoreExceptions = false): boolean {
  if (!VOWEL_START.test(word)) {
    return false;
  }
  if (ignoreExceptions) {
    return true;
  }
  const firstPart = word.toLowerCase().split(/[-’']/)[0];
  return !NO_ELISION_WORDS.has(firstPart);
}

export function applyFrenchElision(text: string, protectedValues: readonly string[] = []): string {
  const spans = findProtectedSpans(text, protectedValues);
  return text.replace(ELISION_PATTERN, (match, article: string, markup: string, next: string, offset: number) => {
    if (!startsWithVowelSound(next) || spans.some(([start, end]) => offset >= start && offset < end)) {
      return match;
    }
    const base = ELIDED_FORMS[article.toLowerCase()];
    return `${article.slice(0, base.length)}’${markup}${next}`;
  });
}

function findProtectedSpans(text: string, values: readonly string[]): [number, number][] {
  const spans: [number, number][] = [];
  for (const value of values) {
    if (!value.includes(" ")) {
      continue;
    }
    for (let index = text.indexOf(value); index !== -1; index = text.indexOf(value, index + value.length)) {
      spans.push([index, index + value.length]);
    }
  }
  return spans;
}

export class FrenchElisionProcessor implements PostProcessorModule {
  public readonly name = "french-elision";
  public readonly type = "postProcessor";

  process(
    value: string,
    _key: string | string[],
    options: { lng?: string; [variable: string]: unknown } | undefined,
    translator: { language?: string },
  ): string {
    const language = options?.lng ?? translator.language ?? "";
    if (!language.startsWith("fr")) {
      return value;
    }
    const variables = Object.values(options ?? {}).filter((v): v is string => typeof v === "string");
    return applyFrenchElision(value, variables);
  }
}

export type FrenchNounCode = "m" | "f" | "mp" | "fp" | "mh" | "fh";

const NOUN_LISTS: Readonly<Record<FrenchNounCode, string>> = {
  m: `
    Méga-Bracelet, Poignet Dynamax, Total Soin, PP Plus, PP Max, Multi Exp, Équilibr’Exp, Muscle +, Poireau,
    Évoluroc, Poké Écrin, Bandeau, Témoin, Charbon, Aimant, PV Plus, Fer, Calcium, Zinc, Carbone, Aucun,
    Améliorator, CD Douteux, Tissu Fauche, Électriseur, Magmariseur, Protecteur, Chantibonbon, Métal Composite
  `,
  f: `
    Poké Ball, Super Ball, Hyper Ball, Rogue Ball, Master Ball, Luxe Ball, Poké Ball Dorée,
    Carte, Esquive, Guérison, Résugraine, Lentilscope, Loupe, Bonbonnière, Protéine, Bel’Écaille, Obsidienne,
    Gracidée, Necroluna, Necrosol
  `,
  mp: "Restes, Trésors, Maxi Champis, PV",
  fp: "Lunettes Noires, Rênes de l’Unité du Froid, Rênes de l’Unité d’Effroi",
  mh: "",
  fh: "Heatranite",
};

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

const MEGA_STONE_PATTERN = /[iï]te( [xyz])?$/;

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

export type FrenchArticleForm = "definite" | "indefinite" | "de" | "a" | "possessive" | "demonstrative";

interface NounInfo {
  feminine: boolean;
  plural: boolean;
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
  elided?: string;
  vowelMasculine?: string;
  vowelFeminine?: string;
  plural: string;
}

const ARTICLE_FORMS: Readonly<Record<FrenchArticleForm, ArticleForms>> = {
  definite: { masculine: "le", feminine: "la", elided: "l’", plural: "les" },
  indefinite: { masculine: "un", feminine: "une", plural: "des" },
  de: { masculine: "du", feminine: "de la", elided: "de l’", plural: "des" },
  a: { masculine: "au", feminine: "à la", elided: "à l’", plural: "aux" },
  possessive: { masculine: "son", feminine: "sa", vowelFeminine: "son", plural: "ses" },
  demonstrative: { masculine: "ce", feminine: "cette", vowelMasculine: "cet", plural: "ces" },
};

export function withFrenchArticle(noun: string, form: FrenchArticleForm): string {
  const { feminine, plural, elides } = lookupNoun(noun);
  const forms = ARTICLE_FORMS[form];

  if (plural) {
    return `${forms.plural} ${noun}`;
  }
  if (elides && forms.elided) {
    return `${forms.elided}${noun}`;
  }
  const plainForm = feminine ? forms.feminine : forms.masculine;
  const vowelForm = feminine ? forms.vowelFeminine : forms.vowelMasculine;
  return `${(elides && vowelForm) || plainForm} ${noun}`;
}

export const FRENCH_ARTICLE_FORMATS: Readonly<Record<string, FrenchArticleForm>> = {
  fr_definite: "definite",
  fr_indefinite: "indefinite",
  fr_de: "de",
  fr_a: "a",
  fr_possessive: "possessive",
  fr_demonstrative: "demonstrative",
};

export function createFrenchArticleFormatter(form: FrenchArticleForm): (value: unknown, lng?: string) => string {
  return (value, lng) => {
    const text = String(value);
    return lng?.startsWith("fr") ? withFrenchArticle(text, form) : text;
  };
}
