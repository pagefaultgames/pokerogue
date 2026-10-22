import type { PostProcessorModule } from "i18next";

export type ProtectedSpan = readonly [start: number, end: number];

export function findProtectedSpans(text: string, values: readonly string[]): ProtectedSpan[] {
  const spans: ProtectedSpan[] = [];
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

export function isProtected(spans: readonly ProtectedSpan[], offset: number): boolean {
  return spans.some(([start, end]) => offset >= start && offset < end);
}

export function getStringVariables(options: object | undefined): string[] {
  return Object.values(options ?? {}).filter((v): v is string => typeof v === "string");
}

export interface ProcessorOptions {
  lng?: string;
  i18nResolved?: { usedLng?: string };
  [variable: string]: unknown;
}

export function getSourceLanguage(options: ProcessorOptions | undefined, translator: { language?: string }): string {
  return options?.i18nResolved?.usedLng ?? options?.lng ?? translator.language ?? "";
}

export function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export const CAPITALIZE_LANGUAGES: Set<string> = new Set(["en", "fr"]);

export type FormatterOptions = { capitalize?: boolean | string };

export type GrammarFormatter = (value: unknown, lng?: string, options?: FormatterOptions) => string;

export interface GrammarModule {
  postProcessors: PostProcessorModule[];
  formatters: Record<string, GrammarFormatter>;
}

export function withCapitalizeOption<T extends unknown[]>(
  language: string,
  format: (value: unknown, ...rest: T) => string,
): (value: unknown, lng?: string, options?: FormatterOptions, ...rest: T) => string {
  return (value, _lng, options, ...rest) => {
    const result = format(value, ...rest);
    const requested = options?.capitalize === true || options?.capitalize === "true";
    return requested && CAPITALIZE_LANGUAGES.has(language) ? capitalizeFirst(result) : result;
  };
}
