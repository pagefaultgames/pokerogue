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

export type FormatterOptions = {
  adjective?: boolean | string;
  animate?: boolean | string;
  case?: string;
  capitalize?: boolean | string;
  declinable?: boolean | string;
  definite?: boolean | string;
  gender?: string;
  plural?: boolean | string;
  stressedA?: boolean | string;
};

export type GrammarFormatter = (value: unknown, lng?: string, options?: FormatterOptions) => string;

export const capitalizeFormatter: GrammarFormatter = value => capitalizeFirst(String(value));

export interface GrammarModule {
  postProcessors: PostProcessorModule[];
  formatters: Record<string, GrammarFormatter>;
}

export function withCapitalizeOption<T extends unknown[]>(
  format: (value: unknown, options?: FormatterOptions, ...rest: T) => string,
): (value: unknown, lng?: string, options?: FormatterOptions, ...rest: T) => string {
  return (value, _lng, options, ...rest) => {
    const result = format(value, options, ...rest);
    const requested = options?.capitalize === true || options?.capitalize === "true";
    return requested ? capitalizeFirst(result) : result;
  };
}
