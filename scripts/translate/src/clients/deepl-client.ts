import axios from "axios";

/**
 * DeeplClient is a client for the DeepL API.
 */

export class DeeplClient {
  private static readonly USAGE_ENDPOINT = 'https://api-free.deepl.com/v2/usage';
  private static readonly TRANSLATE_ENDPOINT = 'https://api-free.deepl.com/v2/translate';
  private static readonly VARIABLE_XML_TAG = 'x';
  private static readonly SUPPORTED_SOURCE_LANGUAGES = ["AR", "BG", "CS", "DA", "DE", "EL", "EN", "ES", "ET", "FI", "FR", "HU", "ID", "IT", "JA", "KO", "LT", "LV", "NB", "NL", "PL", "PT", "RO", "RU", "SK", "SL", "SV", "TR", "UK", "ZH"];
  private static readonly SUPPORTED_TARGET_LANGUAGES = ["AR", "BG", "CS", "DA", "DE", "EL", "EN", "EN-GB", "EN-US", "ES", "ET", "FI", "FR", "HU", "ID", "IT", "JA", "KO", "LT", "LV", "NB", "NL", "PL", "PT", "PT-BR", "PT-PT", "RO", "RU", "SK", "SL", "SV", "TR", "UK", "ZH"];

  private apiKey: string;
  private remainingCharacters: number | null;
  private apiKeyValidated: boolean;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.apiKeyValidated = false;
    this.remainingCharacters = null;
  }

  /**
   * Translates text from a source language to a target language.
   *
   * @param {string} text The text to translate
   * @param {string} sourceLanguage The source language
   * @param {string} targetLanguage The target language
   * @throws {Error} If the character limit is exceeded
   * @returns {Promise<string>} The translated text
   */
  public async translate(text: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
    await this.validateApiKey();
    const formattedText = DeeplClient.formatTextForApi(text);
    if (await this.getRemainingCharacters() < text.length) {
      throw new Error("Character limit exceeded");
    }
    const formattedSourceLanguage = DeeplClient.formatLanguageForApi(sourceLanguage);
    const formattedTargetLanguage = DeeplClient.formatLanguageForApi(targetLanguage);
    const safeFormattedTargetLanguage = DeeplClient.fallbackLanguage(formattedTargetLanguage);
    if (!safeFormattedTargetLanguage) {
      throw new Error("Target language not supported");
    }
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `DeepL-Auth-Key ${this.apiKey}`
    };
    const data = {
      'text': [formattedText],
      'source_lang': formattedSourceLanguage,
      'target_lang': safeFormattedTargetLanguage,
      'tag_handling': 'xml',
      'ignore_tags': [DeeplClient.VARIABLE_XML_TAG]
    };
    const response = await axios.post(DeeplClient.TRANSLATE_ENDPOINT, data, { headers });
    const rawTranslatedText = response.data.translations[0].text;
    this.decreaseRemainingCharacters(formattedText.length);
    const translatedText = DeeplClient.formatTextFromApi(rawTranslatedText);
    return translatedText;
  }

  /**
   * Gets the number of remaining characters that can be translated.
   *
   * @throws {Error} If the API key is invalid
   * @returns {Promise<number>} The number of remaining characters   *
   */
  public async getRemainingCharacters(): Promise<number> {
    await this.validateApiKey();
    if (this.remainingCharacters !== null) {
      return this.remainingCharacters;
    }
    const headers = { 'Authorization': `DeepL-Auth-Key ${this.apiKey}` };
    const response = await axios.get(DeeplClient.USAGE_ENDPOINT, { headers });
    const count = parseInt(response.data.character_count);
    const limit = parseInt(response.data.character_limit);
    this.remainingCharacters = limit - count;
    return this.remainingCharacters;
  }

  /**
   * Returns whether the language is supported.
   *
   * @param {string} language The language to check
   * @returns {boolean} Whether the language is supported
   */
  public static isLanguageSupported(language: string): boolean {
    return DeeplClient.fallbackLanguage(language) !== undefined;
  }

  /**
   * Validates the API key.
   *
   * @throws {Error} If the API key is invalid
   * @returns {Promise<void>}
   */
  private async validateApiKey(): Promise<void> {
    if (this.apiKeyValidated) {
      return;
    }
    if (!this.apiKey) {
      throw new Error("API key is required");
    }
    const headers = { 'Authorization': `DeepL-Auth-Key ${this.apiKey}` };
    const response = await axios.get(DeeplClient.USAGE_ENDPOINT, { headers });
    if (response.status !== 200) {
      throw new Error("Invalid API key");
    }
    this.apiKeyValidated = true;
  }

  /**
   * Decreases the number of remaining characters.
   *
   * @param {number} remainingCharacters The number of characters to decrease
   * @returns {void}
   */
  private decreaseRemainingCharacters(remainingCharacters: number): void {
    if (this.remainingCharacters === undefined || this.remainingCharacters === null) {
      return;
    }
    this.remainingCharacters -= remainingCharacters;
  }

  /**
   * Formats the language for the DeepL API.
   *
   * @param {string} language The language to format
   * @returns {string} The formatted language
   */
  private static formatLanguageForApi(language: string): string {
    return language.replace("_", "-").toUpperCase();
  }

  /**
   * Formats the text for the DeepL API.
   *
   * @param {string} text The text to format
   * @returns {string} The formatted text
   */
  private static formatTextForApi(text: string): string {
    return text.replace("{{", `<${DeeplClient.VARIABLE_XML_TAG}>`).replace("}}", `</${DeeplClient.VARIABLE_XML_TAG}>`);
  }

  /**
   * Formats the text from the DeepL API.
   *
   * @param {string} text The text to format
   * @returns {string} The formatted text
   */
  private static formatTextFromApi(text: string): string {
    return text.replace(`<${DeeplClient.VARIABLE_XML_TAG}>`, "{{").replace(`</${DeeplClient.VARIABLE_XML_TAG}>`, "}}");
  }

  /**
   * Fallback to a supported language if the language is not supported.
   * If not possible, return undefined.
   *
   * @param {string} language The language to fallback
   * @returns {string | undefined} The fallback language
   */
  private static fallbackLanguage(language: string): string | undefined {
    const formattedLanguage = DeeplClient.formatLanguageForApi(language);
    if (DeeplClient.SUPPORTED_TARGET_LANGUAGES.includes(formattedLanguage)) {
      return formattedLanguage;
    }
    const simplifiedLanguage = formattedLanguage.split("-")[0];
    if (DeeplClient.SUPPORTED_TARGET_LANGUAGES.includes(simplifiedLanguage)) {
      return simplifiedLanguage;
    }
    return undefined;
  }

}
