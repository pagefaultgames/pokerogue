import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/constants";
import { timedEventManager } from "#app/global-event-manager";
import { globalScene } from "#app/global-scene";
import { NON_LEGEND_PARADOX_POKEMON, NON_LEGEND_ULTRA_BEASTS } from "#balance/special-species-groups";
import { speciesStarterCosts } from "#balance/starters";
import type { PokemonSpecies } from "#data/pokemon-species";
import { AbilityId } from "#enums/ability-id";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { PokeballType } from "#enums/pokeball";
import { SpeciesId } from "#enums/species-id";
import type { EnemyPokemon } from "#field/pokemon";
import { PlayerPokemon } from "#field/pokemon";
import { showEncounterDialogue } from "#mystery-encounters/encounter-dialogue-utils";
import {
  leaveEncounterWithoutBattle,
  transitionMysteryEncounterIntroVisuals,
  updatePlayerMoney,
} from "#mystery-encounters/encounter-phase-utils";
import {
  catchPokemon,
  getRandomSpeciesByStarterCost,
  getSpriteKeysFromPokemon,
} from "#mystery-encounters/encounter-pokemon-utils";
import type { MysteryEncounter } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterBuilder } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterOptionBuilder } from "#mystery-encounters/mystery-encounter-option";
import { MoneyRequirement } from "#mystery-encounters/mystery-encounter-requirements";
import { PokemonData } from "#system/pokemon-data";
import { isNullOrUndefined, randSeedInt, randSeedItem } from "#utils/common";
import { getPokemonSpecies } from "#utils/pokemon-utils";

/** the i18n namespace for this encounter */
const namespace = "mysteryEncounters/thePokemonSalesman";

const MAX_POKEMON_PRICE_MULTIPLIER = 4;

/** Odds of shiny magikarp will be 1/value */
const SHINY_MAGIKARP_WEIGHT = 100;

/** Odds of event sale will be value/100 */
const EVENT_THRESHOLD = 50;

/**
 * Pokemon Salesman encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3799 | GitHub Issue #3799}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const ThePokemonSalesmanEncounter: MysteryEncounter = MysteryEncounterBuilder.withEncounterType(
  MysteryEncounterType.THE_POKEMON_SALESMAN,
)
  .withEncounterTier(MysteryEncounterTier.ULTRA)
  .withSceneWaveRangeRequirement(...CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES)
  .withSceneRequirement(new MoneyRequirement(0, MAX_POKEMON_PRICE_MULTIPLIER)) // Some costs may not be as significant, this is the max you'd pay
  .withAutoHideIntroVisuals(false)
  .withIntroSpriteConfigs([
    {
      spriteKey: "pokemon_salesman",
      fileRoot: "mystery-encounters",
      hasShadow: true,
    },
  ])
  .withIntroDialogue([
    {
      text: `${namespace}:intro`,
    },
    {
      text: `${namespace}:introDialogue`,
      speaker: `${namespace}:speaker`,
    },
  ])
  .setLocalizationKey(`${namespace}`)
  .withTitle(`${namespace}:title`)
  .withDescription(`${namespace}:description`)
  .withQuery(`${namespace}:query`)
  .withOnInit(() => {
    const encounter = globalScene.currentBattle.mysteryEncounter!;

    let species = getSalesmanSpeciesOffer();
    let tries = 0;

    // Reroll any species that don't have HAs
    while ((isNullOrUndefined(species.abilityHidden) || species.abilityHidden === AbilityId.NONE) && tries < 5) {
      species = getSalesmanSpeciesOffer();
      tries++;
    }

    const r = randSeedInt(SHINY_MAGIKARP_WEIGHT);

    const validEventEncounters = timedEventManager
      .getEventEncounters()
      .filter(
        s =>
          !getPokemonSpecies(s.species).legendary
          && !getPokemonSpecies(s.species).subLegendary
          && !getPokemonSpecies(s.species).mythical
          && !NON_LEGEND_PARADOX_POKEMON.includes(s.species)
          && !NON_LEGEND_ULTRA_BEASTS.includes(s.species),
      );

    let pokemon: PlayerPokemon;
    /**
     * Mon is determined as follows:
     * If you roll the 1% for Shiny Magikarp, you get Magikarp with a random variant
     * If an event with more than 1 valid event encounter species is active, you have 20% chance to get one of those
     * If the rolled species has no HA, and there are valid event encounters, you will get one of those
     * If the rolled species has no HA and there are no valid event encounters, you will get Shiny Magikarp
     * Mons rolled from the event encounter pool get 3 extra shiny rolls
     */
    if (
      r === 0
      || ((isNullOrUndefined(species.abilityHidden) || species.abilityHidden === AbilityId.NONE)
        && validEventEncounters.length === 0)
    ) {
      // If you roll 1%, give shiny Magikarp with random variant
      species = getPokemonSpecies(SpeciesId.MAGIKARP);
      pokemon = new PlayerPokemon(species, 5, 2, undefined, undefined, true);
    } else if (
      validEventEncounters.length > 0
      && (r <= EVENT_THRESHOLD || isNullOrUndefined(species.abilityHidden) || species.abilityHidden === AbilityId.NONE)
    ) {
      tries = 0;
      do {
        // If you roll 20%, give event encounter with 3 extra shiny rolls and its HA, if it has one
        const enc = randSeedItem(validEventEncounters);
        species = getPokemonSpecies(enc.species);
        pokemon = new PlayerPokemon(
          species,
          5,
          species.abilityHidden === AbilityId.NONE ? undefined : 2,
          enc.formIndex,
        );
        pokemon.trySetShinySeed();
        pokemon.trySetShinySeed();
        pokemon.trySetShinySeed();
        if (pokemon.shiny || pokemon.abilityIndex === 2) {
          break;
        }
        tries++;
      } while (tries < 6);
      if (!pokemon.shiny && pokemon.abilityIndex !== 2) {
        // If, after 6 tries, you STILL somehow don't have an HA or shiny mon, pick from only the event mons that have an HA.
        if (validEventEncounters.some(s => !!getPokemonSpecies(s.species).abilityHidden)) {
          validEventEncounters.filter(s => !!getPokemonSpecies(s.species).abilityHidden);
          const enc = randSeedItem(validEventEncounters);
          species = getPokemonSpecies(enc.species);
          pokemon = new PlayerPokemon(species, 5, 2, enc.formIndex);
          pokemon.trySetShinySeed();
          pokemon.trySetShinySeed();
          pokemon.trySetShinySeed();
        } else {
          // If there's, and this would never happen, no eligible event encounters with a hidden ability, just do Magikarp
          species = getPokemonSpecies(SpeciesId.MAGIKARP);
          pokemon = new PlayerPokemon(species, 5, 2, undefined, undefined, true);
        }
      }
    } else {
      pokemon = new PlayerPokemon(species, 5, 2, species.formIndex);
    }
    pokemon.generateAndPopulateMoveset();

    const { spriteKey, fileRoot } = getSpriteKeysFromPokemon(pokemon);
    encounter.spriteConfigs.push({
      spriteKey,
      fileRoot,
      hasShadow: true,
      repeat: true,
      isPokemon: true,
      isShiny: pokemon.shiny,
      variant: pokemon.variant,
    });

    const starterTier = speciesStarterCosts[species.speciesId];
    // Prices decrease by starter tier less than 5, but only reduces cost by half at max
    let priceMultiplier = MAX_POKEMON_PRICE_MULTIPLIER * (Math.max(starterTier, 2.5) / 5);
    if (pokemon.shiny) {
      // Always max price for shiny (flip HA back to normal), and add special messaging
      priceMultiplier = MAX_POKEMON_PRICE_MULTIPLIER;
      pokemon.abilityIndex = 0;
      encounter.dialogue.encounterOptionsDialogue!.description = `${namespace}:descriptionShiny`;
      encounter.options[0].dialogue!.buttonTooltip = `${namespace}:option.1.tooltipShiny`;
    }
    const price = globalScene.getWaveMoneyAmount(priceMultiplier);
    encounter.setDialogueToken("purchasePokemon", pokemon.getNameToRender());
    encounter.setDialogueToken("price", price.toString());
    encounter.misc = {
      price,
      pokemon,
    };

    pokemon.calculateStats();

    return true;
  })
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT)
      .withHasDexProgress(true)
      .withSceneMoneyRequirement(0, MAX_POKEMON_PRICE_MULTIPLIER) // Wave scaling money multiplier of 2
      .withDialogue({
        buttonLabel: `${namespace}:option.1.label`,
        buttonTooltip: `${namespace}:option.1.tooltip`,
        selected: [
          {
            text: `${namespace}:option.1.selectedMessage`,
          },
        ],
      })
      .withOptionPhase(async () => {
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        const price = encounter.misc.price;
        const purchasedPokemon = encounter.misc.pokemon as PlayerPokemon;

        // Update money
        updatePlayerMoney(-price, true, false);

        // Show dialogue
        await showEncounterDialogue(`${namespace}:option.1.selectedDialogue`, `${namespace}:speaker`);
        await transitionMysteryEncounterIntroVisuals();

        // "Catch" purchased pokemon
        const data = new PokemonData(purchasedPokemon);
        data.player = false;
        await catchPokemon(data.toPokemon() as EnemyPokemon, null, PokeballType.POKEBALL, true, true);

        leaveEncounterWithoutBattle(true);
      })
      .build(),
  )
  .withSimpleOption(
    {
      buttonLabel: `${namespace}:option.2.label`,
      buttonTooltip: `${namespace}:option.2.tooltip`,
      selected: [
        {
          text: `${namespace}:option.2.selected`,
        },
      ],
    },
    async () => {
      // Leave encounter with no rewards or exp
      leaveEncounterWithoutBattle(true);
      return true;
    },
  )
  .build();

/**
 * @returns A random species that has at most 5 starter cost and is not Mythical, Paradox, etc.
 */
export function getSalesmanSpeciesOffer(): PokemonSpecies {
  return getPokemonSpecies(
    getRandomSpeciesByStarterCost([0, 5], NON_LEGEND_PARADOX_POKEMON, undefined, false, false, false),
  );
}
