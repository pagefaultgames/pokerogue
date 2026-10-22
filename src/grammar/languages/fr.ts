import type { GrammarModule } from "#grammar/common";
import {
  findProtectedSpans,
  getSourceLanguage,
  getStringVariables,
  isProtected,
  type ProcessorOptions,
  withCapitalizeOption,
} from "#grammar/common";
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

export const NO_ELISION_STEMS: readonly string[] = [
  "hâbl",
  "hach",
  "hagard",
  "hai",
  "haï",
  "hâl",
  "halbran",
  "halle",
  "hallebard",
  "hallier",
  "hamac",
  "hamada",
  "hameau",
  "hammam",
  "hamster",
  "hamburger",
  "han",
  "happ",
  "harang",
  "harass",
  "harcel",
  "harde",
  "hardi",
  "harem",
  "hareng",
  "hargn",
  "haric",
  "harnach",
  "harnais",
  "harp",
  "harfang",
  "hart",
  "hasard",
  "hasch",
  "hât",
  "hau",
  "hav",
  "hay",
  "haw",
  "heaum",
  "henn",
  "héraut",
  "hériss",
  "héron",
  "herse",
  "hêtr",
  "heurt",
  "hibou",
  "hideu",
  "hiss",
  "hobb",
  "hoch",
  "hockey",
  "holland",
  "homar",
  "hongr",
  "honni",
  "hont",
  "hoqu",
  "hord",
  "hott",
  "houbl",
  "houe",
  "houill",
  "houl",
  "houp",
  "hour",
  "housp",
  "houss",
  "houx",
  "hubl",
  "huch",
  "huard",
  "hué",
  "huer",
  "hugu",
  "huit",
  "hun",
  "hupp",
  "hurl",
  "hurlu",
  "huss",
  "husk",
  "hutt",
  "hyèn",
  "onz",
  "uhlan",
  "ya",
  "yé",
  "yeoman",
  "yeti",
  "yi",
  "yo",
  "yu",
];

export const NO_ELISION_WORDS: ReadonlySet<string> = new Set([
  "hall",
  "halls",
  "halo",
  "halos",
  "hariyama",
  "haydaim",
  "hep",
  "héricendre",
  "héros",
  "hi",
  "hic",
  "hip",
  "hippie",
  "hippies",
  "hisui",
  "hoenn",
  "hold",
  "hoopa",
  "hot",
  "ho-oh",
  "hoothoot",
  "heatran",
  "heatranite",
  "houndour",
  "houndoom",
  "hoopa",
  "hotte-de-fer",
  "hurle-queue",
  "oui",
  "yen",
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
  return !NO_ELISION_WORDS.has(firstPart) && !NO_ELISION_STEMS.some(stem => firstPart.startsWith(stem));
}

export function applyFrenchElision(text: string, protectedValues: readonly string[] = []): string {
  const spans = findProtectedSpans(text, protectedValues);
  return text.replace(ELISION_PATTERN, (match, article: string, markup: string, next: string, offset: number) => {
    if (!startsWithVowelSound(next) || isProtected(spans, offset)) {
      return match;
    }
    const base = ELIDED_FORMS[article.toLowerCase()];
    return `${article.slice(0, base.length)}’${markup}${next}`;
  });
}

export class FrenchElisionProcessor implements PostProcessorModule {
  public readonly name = "french-elision";
  public readonly type = "postProcessor";

  process(
    value: string,
    _key: string | string[],
    options: ProcessorOptions | undefined,
    translator: { language?: string },
  ): string {
    return getSourceLanguage(options, translator).startsWith("fr")
      ? applyFrenchElision(value, getStringVariables(options))
      : value;
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
  fr_definite: "definite", //le; la; l’; les
  fr_indefinite: "indefinite", //un; une; des
  fr_de: "de", //du; de la; de l’; des
  fr_a: "a", //au; à la; à l’; aux
  fr_possessive: "possessive", //son; sa; son; ses
  fr_demonstrative: "demonstrative", //ce; cette; cet; ces
};

export function createFrenchArticleFormatter(form: FrenchArticleForm) {
  return withCapitalizeOption("fr", (value: unknown) => withFrenchArticle(String(value), form));
}

export const GRAMMAR: GrammarModule = {
  postProcessors: [new FrenchElisionProcessor()],
  formatters: {
    fr_definite: createFrenchArticleFormatter("definite"),
    fr_indefinite: createFrenchArticleFormatter("indefinite"),
    fr_de: createFrenchArticleFormatter("de"),
    fr_a: createFrenchArticleFormatter("a"),
    fr_possessive: createFrenchArticleFormatter("possessive"),
    fr_demonstrative: createFrenchArticleFormatter("demonstrative"),
  },
};
