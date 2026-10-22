import type { GrammarModule } from "#grammar/common";

export const GRAMMAR_MODULES = Object.values(
  import.meta.glob<GrammarModule>("./languages/*.ts", {
    eager: true,
    import: "GRAMMAR",
  }),
);

export const GRAMMAR_POST_PROCESSORS = GRAMMAR_MODULES.flatMap(module => module.postProcessors);

export function registerGrammarFormatters(
  add: (name: string, formatter: GrammarModule["formatters"][string]) => void,
): void {
  for (const module of GRAMMAR_MODULES) {
    for (const [name, formatter] of Object.entries(module.formatters)) {
      add(name, formatter);
    }
  }
}
