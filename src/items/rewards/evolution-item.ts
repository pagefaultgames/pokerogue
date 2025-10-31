import { globalScene } from "#app/global-scene";
import { EvolutionItem, FusionSpeciesFormEvolution, pokemonEvolutions } from "#balance/pokemon-evolutions";
import { SpeciesFormKey } from "#enums/species-form-key";
import { SpeciesId } from "#enums/species-id";
import type { PlayerPokemon } from "#field/pokemon";
import { PokemonReward, type PokemonRewardParams, RewardGenerator } from "#items/reward";
import { PartyUiHandler } from "#ui/party-ui-handler";
import { randSeedItem } from "#utils/common";
import i18next from "i18next";

export class EvolutionItemReward extends PokemonReward {
  public evolutionItem: EvolutionItem;

  constructor(evolutionItem: EvolutionItem) {
    super("", EvolutionItem[evolutionItem].toLowerCase(), (pokemon: PlayerPokemon) => {
      if (
        pokemonEvolutions.hasOwnProperty(pokemon.species.speciesId)
        && pokemonEvolutions[pokemon.species.speciesId].filter(e => e.validate(pokemon, false, this.evolutionItem))
          .length > 0
        && pokemon.getFormKey() !== SpeciesFormKey.GIGANTAMAX
      ) {
        return null;
      }
      if (
        pokemon.isFusion()
        && pokemon.fusionSpecies
        && pokemonEvolutions.hasOwnProperty(pokemon.fusionSpecies.speciesId)
        && pokemonEvolutions[pokemon.fusionSpecies.speciesId].filter(e => e.validate(pokemon, true, this.evolutionItem))
          .length > 0
        && pokemon.getFusionFormKey() !== SpeciesFormKey.GIGANTAMAX
      ) {
        return null;
      }

      return PartyUiHandler.NoEffectMessage;
    });

    this.evolutionItem = evolutionItem;
  }

  get name(): string {
    return i18next.t(`modifierType:EvolutionItem.${EvolutionItem[this.evolutionItem]}`);
  }

  get description(): string {
    return i18next.t("modifierType:ModifierType.EvolutionItemModifierType.description");
  }

  /**
   * Applies {@linkcode EvolutionItemConsumable}
   * @param playerPokemon The {@linkcode PlayerPokemon} that should evolve via item
   * @returns `true` if the evolution was successful
   */
  apply({ pokemon }: PokemonRewardParams): boolean {
    let matchingEvolution = pokemonEvolutions.hasOwnProperty(pokemon.species.speciesId)
      ? pokemonEvolutions[pokemon.species.speciesId].find(
          e => e.evoItem === this.evolutionItem && e.validate(pokemon, false, e.item!),
        )
      : null;

    if (!matchingEvolution && pokemon.isFusion()) {
      matchingEvolution = pokemonEvolutions[pokemon.fusionSpecies!.speciesId].find(
        e => e.evoItem === this.evolutionItem && e.validate(pokemon, true, e.item!),
      );
      if (matchingEvolution) {
        matchingEvolution = new FusionSpeciesFormEvolution(pokemon.species.speciesId, matchingEvolution);
      }
    }

    if (matchingEvolution) {
      globalScene.phaseManager.unshiftNew("EvolutionPhase", pokemon, matchingEvolution, pokemon.level - 1);
      return true;
    }

    return false;
  }
}

export class EvolutionItemRewardGenerator extends RewardGenerator {
  private rare: boolean;
  constructor(rare: boolean) {
    super();
    this.rare = rare;
  }

  override generateReward(pregenArgs?: EvolutionItem) {
    if (pregenArgs !== undefined) {
      return new EvolutionItemReward(pregenArgs);
    }

    const party = globalScene.getPlayerParty();

    const evolutionItemPool = [
      party
        .filter(
          p =>
            pokemonEvolutions.hasOwnProperty(p.species.speciesId)
            && (!p.pauseEvolutions
              || p.species.speciesId === SpeciesId.SLOWPOKE
              || p.species.speciesId === SpeciesId.EEVEE
              || p.species.speciesId === SpeciesId.KIRLIA
              || p.species.speciesId === SpeciesId.SNORUNT),
        )
        .flatMap(p => {
          const evolutions = pokemonEvolutions[p.species.speciesId];
          return evolutions.filter(e => e.isValidItemEvolution(p));
        }),
      party
        .filter(
          p =>
            p.isFusion()
            && p.fusionSpecies
            && pokemonEvolutions.hasOwnProperty(p.fusionSpecies.speciesId)
            && (!p.pauseEvolutions
              || p.fusionSpecies.speciesId === SpeciesId.SLOWPOKE
              || p.fusionSpecies.speciesId === SpeciesId.EEVEE
              || p.fusionSpecies.speciesId === SpeciesId.KIRLIA
              || p.fusionSpecies.speciesId === SpeciesId.SNORUNT),
        )
        .flatMap(p => {
          const evolutions = pokemonEvolutions[p.fusionSpecies!.speciesId];
          return evolutions.filter(e => e.isValidItemEvolution(p, true));
        }),
    ]
      .flat()
      .flatMap(e => e.evoItem)
      .filter(i => !!i && i > 50 === this.rare);

    if (evolutionItemPool.length === 0) {
      return null;
    }

    return new EvolutionItemReward(randSeedItem(evolutionItemPool));
  }
}
