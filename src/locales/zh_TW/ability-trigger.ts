import { SimpleTranslationEntries } from "#app/interfaces/locales";

export const abilityTriggers: SimpleTranslationEntries = {
  "blockRecoilDamage" : "{{pokemonName}} 的 {{abilityName}}\n抵消了反作用力！",
  "badDreams": "{{pokemonName}} 被折磨着！",
  "costar": "{{pokemonName}} 複製了 {{allyName}} 的\n能力變化！",
  "iceFaceAvoidedDamage": "{{pokemonName}} 因爲 {{abilityName}}\n避免了傷害！",
  "trace": "{{pokemonName}} 複製了 {{targetName}} 的\n{{abilityName}}!",
  "windPowerCharged": "受 {{moveName}} 的影響， {{pokemonName}} 提升了能力！",
  "quickDraw":"{{pokemonName}} can act faster than normal, thanks to its Quick Draw!",
} as const;
