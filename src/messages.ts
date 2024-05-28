import { BattleSpec } from "./enums/battle-spec";
import Pokemon from "./field/pokemon";
import i18next from "./plugins/i18n";

export function getPokemonMessage(pokemon: Pokemon, content: string): string {
  return `${getPokemonNameWithAffix(pokemon)} ${content}`;
}

export function getPokemonNameWithAffix(pokemon: Pokemon): string {
  switch (pokemon.scene.currentBattle.battleSpec) {
  case BattleSpec.DEFAULT:
    return !pokemon.isPlayer()
      ? pokemon.hasTrainer()
        ? i18next.t("battle:foePokemonWithAffix", {
          pokemonName: pokemon.name,
        })
        : i18next.t("battle:wildPokemonWithAffix", {
          pokemonName: pokemon.name,
        })
      : pokemon.name;
  case BattleSpec.FINAL_BOSS:
    return !pokemon.isPlayer()
      ? i18next.t("battle:foePokemonWithAffix", { pokemonName: pokemon.name })
      : pokemon.name;
  default:
    pokemon.name;
  }
}
