import { globalScene } from "#app/global-scene";
import { speciesDataRegistry } from "#app/global-species-data-registry";
import { FusionSpeciesFormEvolution } from "#balance/pokemon-evolutions";
import { EvolutionItem } from "#enums/evolution-item";
import { SpeciesFormKey } from "#enums/species-form-key";
import { SpeciesId } from "#enums/species-id";
import type { PlayerPokemon } from "#field/pokemon";
import { PokemonReward, type PokemonRewardParams, RewardGenerator } from "#items/reward";
import { PartyUiHandler } from "#ui/party-ui-handler";
import { randSeedItem } from "#utils/common";
import { toCamelCase } from "#utils/strings";
import i18next from "i18next";

export class EvolutionItemReward extends PokemonReward {
  public evolutionItem: EvolutionItem;

  constructor(evolutionItem: EvolutionItem) {
    super("", EvolutionItem[evolutionItem].toLowerCase(), (pokemon: PlayerPokemon) => {
      if (
        speciesDataRegistry.hasEvolutions(pokemon.species.speciesId)
        && speciesDataRegistry
          .getEvolutions(pokemon.species.speciesId)
          .filter(e => e.validate(pokemon, false, this.evolutionItem)).length > 0
        && pokemon.getFormKey() !== SpeciesFormKey.GIGANTAMAX
      ) {
        return null;
      }
      if (
        pokemon.isFusion()
        && pokemon.fusionSpecies
        && speciesDataRegistry.hasEvolutions(pokemon.fusionSpecies.speciesId)
        && speciesDataRegistry
          .getEvolutions(pokemon.fusionSpecies.speciesId)
          .filter(e => e.validate(pokemon, true, this.evolutionItem)).length > 0
        && pokemon.getFusionFormKey() !== SpeciesFormKey.GIGANTAMAX
      ) {
        return null;
      }

      return PartyUiHandler.NoEffectMessage;
    });

    this.evolutionItem = evolutionItem;
  }

  get name(): string {
    return i18next.t(`item:${toCamelCase(EvolutionItem[this.evolutionItem])}.name`);
  }

  get description(): string {
    return i18next.t([
      `item:${toCamelCase(EvolutionItem[this.evolutionItem])}.description`,
      "reward:evolutionItem.description",
    ]);
  }

  /**
   * Applies {@linkcode EvolutionItemConsumable}
   * @param playerPokemon The {@linkcode PlayerPokemon} that should evolve via item
   * @returns `true` if the evolution was successful
   */
  apply({ pokemon }: PokemonRewardParams): boolean {
    let matchingEvolution = speciesDataRegistry.hasEvolutions(pokemon.species.speciesId)
      ? speciesDataRegistry
          .getEvolutions(pokemon.species.speciesId)
          .find(e => e.evoItem === this.evolutionItem && e.validate(pokemon, false, e.item!))
      : null;

    if (!matchingEvolution && pokemon.isFusion()) {
      matchingEvolution = speciesDataRegistry
        .getEvolutions(pokemon.fusionSpecies!.speciesId)
        .find(e => e.evoItem === this.evolutionItem && e.validate(pokemon, true, e.item!));
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

    // TODO: refactor once species code isn't a horrible burning mess
    const evolutionItemPool = [
      party
        .filter(
          p =>
            speciesDataRegistry.hasEvolutions(p.species.speciesId)
            && (!p.pauseEvolutions
              || p.species.speciesId === SpeciesId.SLOWPOKE
              || p.species.speciesId === SpeciesId.EEVEE
              || p.species.speciesId === SpeciesId.KIRLIA
              || p.species.speciesId === SpeciesId.SNORUNT),
        )
        .flatMap(p => {
          const evolutions = speciesDataRegistry.getEvolutions(p.species.speciesId);
          return evolutions.filter(e => e.isValidItemEvolution(p));
        }),
      party
        .filter(
          p =>
            p.isFusion()
            && p.fusionSpecies
            && speciesDataRegistry.hasEvolutions(p.fusionSpecies.speciesId)
            && (!p.pauseEvolutions
              || p.fusionSpecies.speciesId === SpeciesId.SLOWPOKE
              || p.fusionSpecies.speciesId === SpeciesId.EEVEE
              || p.fusionSpecies.speciesId === SpeciesId.KIRLIA
              || p.fusionSpecies.speciesId === SpeciesId.SNORUNT),
        )
        .flatMap(p => {
          const evolutions = speciesDataRegistry.getEvolutions(p.fusionSpecies!.speciesId);
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
