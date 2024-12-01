import { leaveEncounterWithoutBattle, transitionMysteryEncounterIntroVisuals, updatePlayerMoney, } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { isNullOrUndefined, randSeedInt } from "#app/utils";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import BattleScene from "#app/battle-scene";
import MysteryEncounter, { MysteryEncounterBuilder } from "#app/data/mystery-encounters/mystery-encounter";
import { MoneyRequirement } from "#app/data/mystery-encounters/mystery-encounter-requirements";
import { catchPokemon, getRandomSpeciesByStarterCost, getSpriteKeysFromPokemon } from "#app/data/mystery-encounters/utils/encounter-pokemon-utils";
import PokemonSpecies, { getPokemonSpecies } from "#app/data/pokemon-species";
import { speciesStarterCosts } from "#app/data/balance/starters";
import { Species } from "#enums/species";
import { PokeballType } from "#enums/pokeball";
import { EnemyPokemon, PlayerPokemon } from "#app/field/pokemon";
import { MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import { showEncounterDialogue } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import PokemonData from "#app/system/pokemon-data";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/game-mode";
import { Abilities } from "#enums/abilities";
import { NON_LEGEND_PARADOX_POKEMON } from "#app/data/balance/special-species-groups";

/** the i18n namespace for this encounter */
const namespace = "mysteryEncounters/thePokemonSalesman";

const MAX_POKEMON_PRICE_MULTIPLIER = 4;

/** Odds of shiny magikarp will be 1/value */
const SHINY_MAGIKARP_WEIGHT = 100;

/**
 * Pokemon Salesman encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3799 | GitHub Issue #3799}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const ThePokemonSalesmanEncounter: MysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(MysteryEncounterType.THE_POKEMON_SALESMAN)
    .withEncounterTier(MysteryEncounterTier.ULTRA)
    .withSceneWaveRangeRequirement(...CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES)
    .withSceneRequirement(new MoneyRequirement(0, MAX_POKEMON_PRICE_MULTIPLIER)) // Some costs may not be as significant, this is the max you'd pay
    .withAutoHideIntroVisuals(false)
    .withIntroSpriteConfigs([
      {
        spriteKey: "pokemon_salesman",
        fileRoot: "mystery-encounters",
        hasShadow: true
      }
    ])
    .withIntroDialogue([
      {
        text: `${namespace}:intro`,
      },
      {
        text: `${namespace}:intro_dialogue`,
        speaker: `${namespace}:speaker`,
      },
    ])
    .setLocalizationKey(`${namespace}`)
    .withTitle(`${namespace}:title`)
    .withDescription(`${namespace}:description`)
    .withQuery(`${namespace}:query`)
    .withOnInit((scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter!;

      let species = getSalesmanSpeciesOffer();
      let tries = 0;

      // Reroll any species that don't have HAs
      while ((isNullOrUndefined(species.abilityHidden) || species.abilityHidden === Abilities.NONE) && tries < 5) {
        species = getSalesmanSpeciesOffer();
        tries++;
      }

      let pokemon: PlayerPokemon;
      if (randSeedInt(SHINY_MAGIKARP_WEIGHT) === 0 || isNullOrUndefined(species.abilityHidden) || species.abilityHidden === Abilities.NONE) {
        // If no HA mon found or you roll 1%, give shiny Magikarp with random variant
        species = getPokemonSpecies(Species.MAGIKARP);
        pokemon = new PlayerPokemon(scene, species, 5, 2, species.formIndex, undefined, true);
      } else {
        pokemon = new PlayerPokemon(scene, species, 5, 2, species.formIndex);
      }
      pokemon.generateAndPopulateMoveset();

      const { spriteKey, fileRoot } = getSpriteKeysFromPokemon(pokemon);
      encounter.spriteConfigs.push({
        spriteKey: spriteKey,
        fileRoot: fileRoot,
        hasShadow: true,
        repeat: true,
        isPokemon: true,
        isShiny: pokemon.shiny,
        variant: pokemon.variant
      });

      const starterTier = speciesStarterCosts[species.speciesId];
      // Prices decrease by starter tier less than 5, but only reduces cost by half at max
      let priceMultiplier = MAX_POKEMON_PRICE_MULTIPLIER * (Math.max(starterTier, 2.5) / 5);
      if (pokemon.shiny) {
        // Always max price for shiny (flip HA back to normal), and add special messaging
        priceMultiplier = MAX_POKEMON_PRICE_MULTIPLIER;
        pokemon.abilityIndex = 0;
        encounter.dialogue.encounterOptionsDialogue!.description = `${namespace}:description_shiny`;
        encounter.options[0].dialogue!.buttonTooltip = `${namespace}:option.1.tooltip_shiny`;
      }
      const price = scene.getWaveMoneyAmount(priceMultiplier);
      encounter.setDialogueToken("purchasePokemon", pokemon.getNameToRender());
      encounter.setDialogueToken("price", price.toString());
      encounter.misc = {
        price: price,
        pokemon: pokemon
      };

      pokemon.calculateStats();

      return true;
    })
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT)
        .withHasDexProgress(true)
        .withSceneMoneyRequirement(0, MAX_POKEMON_PRICE_MULTIPLIER) // Wave scaling money multiplier of 2
        .withDialogue({
          buttonLabel: `${namespace}:option.1.label`,
          buttonTooltip: `${namespace}:option.1.tooltip`,
          selected: [
            {
              text: `${namespace}:option.1.selected_message`,
            }
          ],
        })
        .withOptionPhase(async (scene: BattleScene) => {
          const encounter = scene.currentBattle.mysteryEncounter!;
          const price = encounter.misc.price;
          const purchasedPokemon = encounter.misc.pokemon as PlayerPokemon;

          // Update money
          updatePlayerMoney(scene, -price, true, false);

          // Show dialogue
          await showEncounterDialogue(scene, `${namespace}:option.1.selected_dialogue`, `${namespace}:speaker`);
          await transitionMysteryEncounterIntroVisuals(scene);

          // "Catch" purchased pokemon
          const data = new PokemonData(purchasedPokemon);
          data.player = false;
          await catchPokemon(scene, data.toPokemon(scene) as EnemyPokemon, null, PokeballType.POKEBALL, true, true);

          leaveEncounterWithoutBattle(scene, true);
        })
        .build()
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
      async (scene: BattleScene) => {
        // Leave encounter with no rewards or exp
        leaveEncounterWithoutBattle(scene, true);
        return true;
      }
    )
    .build();

/**
 * @returns A random species that has at most 5 starter cost and is not Mythical, Paradox, etc.
 */
export function getSalesmanSpeciesOffer(): PokemonSpecies {
  return getPokemonSpecies(getRandomSpeciesByStarterCost([ 0, 5 ], NON_LEGEND_PARADOX_POKEMON, undefined, false, false, false));
}
