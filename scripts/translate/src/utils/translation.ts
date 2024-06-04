import * as fs from "fs";
import i18next from "i18next";
import { getIsInitialized, resources, initI18n } from "#app/plugins/i18n.js";
import { config } from "#app/locales/en/config.js";
import { dig, serializeWithBackticks, updateNestedObject } from "./object";

interface MissingTranslation {
  language: string;
  key: string;
  enTranslation: string;
};

export interface NewTranslation {
  language: string;
  key: string;
  value: string;
}

interface NamespacesByFile {
  [file: string]: string[];
}

/**
 * Get the supported namespaces
 *
 * @returns {readonly string[]} The supported namespaces
 */
function getSupportedNamespaces(): readonly string[] {
  return Object.keys(config);
}

/**
 * Get the supported languages
 *
 * @returns {readonly string[]} The supported languages
 */
function getSupportedLanguages(): readonly string[] {
  return Object.keys(resources);
}

/**
 * Get the missing translations for a language and namespace
 *
 * @param {string} language The language
 * @param {string} namespace The namespace
 * @returns {readonly string[]} The missing translations
 */
function getMissingTranslationsForNamespace(language: string, namespace: string): readonly string[] {
  return getMissingTranslationForPrefix(language, namespace);
}

/**
 * Get the missing translations for a language, namespace and a given prefix
 *
 * @param {string} language The language
 * @param {string} namespace The namespace
 * @param {readonly string[]} prefixes The prefixes
 * @returns {readonly string[]} The missing translations
 */
function getMissingTranslationForPrefix(language: string, namespace: string, prefixes: string[] = []): string[] {
  const missingTranslations: string[] = [];
  const keys = Object.keys(dig(config, [namespace, ...prefixes]));
  for (const key of keys) {
    const keyPath = `${namespace}:${[...prefixes, key].join(".")}`;
    const enTranslation = i18next.t(keyPath as unknown as TemplateStringsArray, { lng: "en", returnObjects: true });
    if (typeof enTranslation === "string") {
      if (!i18next.exists(keyPath)) {
        missingTranslations.push(keyPath);
      }
    } else if (typeof enTranslation === "object") {
      missingTranslations.push(...getMissingTranslationForPrefix(language, namespace, [...prefixes, key]));
    }
  }
  return missingTranslations;
}

/**
 * Get the missing translations in the locales files
 *
 * @returns {readonly MissingTranslation[]} The missing translations
 */
export function getMissingTranslations(): MissingTranslation[] {
  if (!getIsInitialized()) {
    initI18n();
  }

  const supportedLanguages = getSupportedLanguages().filter(language => language !== "en");
  const supportedNamespaces = getSupportedNamespaces();

  const result: MissingTranslation[] = [];
  for (const language of supportedLanguages) {
    i18next.changeLanguage(language);
    for (const namespace of supportedNamespaces) {
      const missingTranslations = getMissingTranslationsForNamespace(language, namespace);
      if (missingTranslations.length > 0) {
        missingTranslations.forEach(missingTranslation => {
          const enTranslation = i18next.t(missingTranslation as unknown as TemplateStringsArray, { lng: "en" });
          result.push({
            language,
            enTranslation,
            key: missingTranslation,
          });
        });
      }
    }
  }
  return result;
}

/**
 * Get the languages that have at least one new translation
 *
 * @param {NewTranslation[]} newTranslations The new translations
 * @returns {string[]} The languages translated
 */
export function getLanguagesTranslated(newTranslations: NewTranslation[]): string[] {
  const languagesTranslated: string[] = [];
  newTranslations.forEach((translation) => {
    const { language } = translation;
    if (language && !languagesTranslated.includes(language)) {
      languagesTranslated.push(language);
    }
  });
  return languagesTranslated;
}

/**
 * Generate the resources with the new translations
 *
 * @param {Object} resources The resources
 * @param {NewTranslation[]} newTranslations The new translations
 * @returns {Object} The modified resources
 */
export function generateResourcesWithNewTranslations(resources: Object, newTranslations: NewTranslation[]) {
  const modifiedResources = JSON.parse(JSON.stringify(resources));

  newTranslations.forEach((translation) => {
    const { language, key, value } = translation;
    if (!language || !key || !value) {
      return;
    }
    const [namespace, path] = key.split(":");
    const nestedKeys = path.split(".");
    updateNestedObject(modifiedResources, [language, namespace, ...nestedKeys], value);
  });

  return modifiedResources;
}

/**
 * Get the namespaces by file
 *
 * @returns {NamespacesByFile} The namespaces by file
 */
function getNamespacesByFile(): NamespacesByFile {
  const namespacesByFile: NamespacesByFile = {};
  fs.readdirSync("src/locales/en").forEach((file) => {
    if (file === "config.ts") {
      return;
    }
    const fileContent = fs.readFileSync(`src/locales/en/${file}`, "utf8");
    const pattern = /export const ([a-zA-Z0-9_]+):/g;
    const namespaces = Array.from(fileContent.matchAll(pattern), (match) => match[1]);
    namespacesByFile[file] = namespaces;
  });
  return namespacesByFile;
}

/**
 * Write the modified resources to the file
 *
 * @param {Object} modifiedResources The modified resources
 * @param {string[]} languagesTranslated The languages translated
 */
export function writeModifiedResourcesToFiles(modifiedResources: Object, languagesTranslated: string[]): void {
  const namespacesByFile = getNamespacesByFile();
  for (const language of languagesTranslated) {
    for (const file of Object.keys(namespacesByFile)) {
      const namespaces = namespacesByFile[file];
      for (const namespace of namespaces) {
        const fileContent = fs.readFileSync(`src/locales/${language}/${file}`, "utf8");
        const pattern = new RegExp(`export const ${namespace}: \\w+\\s*=\\s*(\\{.*?\\})(?:\\s*as const)?;`, "s");
        const match = fileContent.match(pattern);
        if (!match) {
          continue;
        }
        const objectContent = match[1];
        const newFileContent = fileContent.replace(objectContent, serializeWithBackticks(modifiedResources[language][namespace]));
        fs.writeFileSync(`src/locales/${language}/${file}`, newFileContent);
      }
    }
  }
}
