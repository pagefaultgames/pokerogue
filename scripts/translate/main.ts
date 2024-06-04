import { resources } from "#app/plugins/i18n.js";
import { DeeplClient } from "./src/clients/deepl-client";
import { getDeeplClients, getDeeplClientWithMostRemainingCharacters } from "./src/utils/client";
import { NewTranslation, getLanguagesTranslated, getMissingTranslations, generateResourcesWithNewTranslations, writeModifiedResourcesToFiles } from "./src/utils/translation";

// 1. Get the missing translations
const missingTranslations = getMissingTranslations();
console.log(`Missing translations: ${missingTranslations.length}`);

// 2. Get the DeepL Clients
const deeplApiKeys = process.env.DEEPL_API_KEYS?.split(",") || [];
const deeplClients = getDeeplClients(deeplApiKeys);
console.log(`DeepL clients: ${deeplClients.length}`);

// 3. Translate the missing translations
const newTranslations: NewTranslation[] = [];

for (const missingTranslation of missingTranslations) {
  const { key, language, enTranslation } = missingTranslation;
  if (!DeeplClient.isLanguageSupported(language)) {
    console.log(`Language ${language} is not supported by DeeplAPI`);
    continue;
  }
  console.log(`Translating ${key} to ${language} based on the English translation: ${enTranslation}`);
  const client = await getDeeplClientWithMostRemainingCharacters(deeplClients);
  if (!client) {
    throw new Error("No DeepL client available");
  }
  const translation = await client.translate(enTranslation, "en", language);
  newTranslations.push({ language, key, value: translation });
}

// 4. Generate the resources with the new translations
console.log(`Generating resources with ${newTranslations.length} new translations`);
const newResources = generateResourcesWithNewTranslations(resources, newTranslations);


// 5. Write the modified resources to files
console.log("Writing modified resources to files");
writeModifiedResourcesToFiles(newResources, getLanguagesTranslated(newTranslations));
console.log("Done");
