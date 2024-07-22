import { leaveEncounterWithoutBattle, transitionMysteryEncounterIntroVisuals, updatePlayerMoney, } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { isNullOrUndefined, randSeedInt } from "#app/utils";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import BattleScene from "../../../battle-scene";
import IMysteryEncounter, { MysteryEncounterBuilder, MysteryEncounterTier, } from "../mystery-encounter";
import { MoneyRequirement } from "../mystery-encounter-requirements";
import { catchPokemon, getRandomSpeciesByStarterTier } from "#app/data/mystery-encounters/utils/encounter-pokemon-utils";
import { getPokemonSpecies, speciesStarters } from "#app/data/pokemon-species";
import { Species } from "#enums/species";
import { PokeballType } from "#app/data/pokeball";
import { EnemyPokemon, PlayerPokemon } from "#app/field/pokemon";
import { EncounterOptionMode, MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import { showEncounterDialogue } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import PokemonData from "#app/system/pokemon-data";

/** the i18n namespace for this encounter */
const namespace = "mysteryEncounter:pokemonSalesman";

const MAX_POKEMON_PRICE_MULTIPLIER = 6;

/**
 * Pokemon Salesman encounter.
 * @see {@link https://github.com/AsdarDevelops/PokeRogue-Events/issues/36 | GitHub Issue #36}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const PokemonSalesmanEncounter: IMysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(MysteryEncounterType.POKEMON_SALESMAN)
    .withEncounterTier(MysteryEncounterTier.ULTRA)
    .withSceneWaveRangeRequirement(10, 180)
    .withSceneRequirement(new MoneyRequirement(null, MAX_POKEMON_PRICE_MULTIPLIER)) // Some costs may not be as significant, this is the max you'd pay
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
    .withTitle(`${namespace}:title`)
    .withDescription(`${namespace}:description`)
    .withQuery(`${namespace}:query`)
    .withOnInit((scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter;

      let species = getPokemonSpecies(getRandomSpeciesByStarterTier([0, 5]));
      const tries = 0;

      // Reroll any species that don't have HAs
      while (isNullOrUndefined(species.abilityHidden) && tries < 5) {
        species = getPokemonSpecies(getRandomSpeciesByStarterTier([0, 5]));
      }

      let pokemon: PlayerPokemon;
      if (isNullOrUndefined(species.abilityHidden) || randSeedInt(100) === 0) {
        // If no HA mon found or you roll 1%, give shiny Magikarp
        species = getPokemonSpecies(Species.MAGIKARP);
        const hiddenIndex = species.ability2 ? 2 : 1;
        pokemon = scene.addPlayerPokemon(species, 5, hiddenIndex, species.formIndex, null, true);
      } else {
        const hiddenIndex = species.ability2 ? 2 : 1;
        pokemon = scene.addPlayerPokemon(species, 5, hiddenIndex, species.formIndex);
      }

      const spriteKey = pokemon.getSpriteId();
      const spriteRoot = pokemon.getSpriteAtlasPath();
      encounter.spriteConfigs.push({
        spriteKey: spriteKey,
        fileRoot: spriteRoot,
        hasShadow: true,
        repeat: true,
        isPokemon: true
      });

      const starterTier = speciesStarters[species.speciesId];
      // Prices decrease by starter tier less than 5, but only reduces cost by half at max
      let priceMultiplier = MAX_POKEMON_PRICE_MULTIPLIER * (Math.max(starterTier, 2.5) / 5);
      if (pokemon.shiny) {
        // Always max price for shiny (flip HA back to normal), and add special messaging
        priceMultiplier = MAX_POKEMON_PRICE_MULTIPLIER;
        pokemon.abilityIndex = 0;
        encounter.dialogue.encounterOptionsDialogue.description = `${namespace}:description_shiny`;
        encounter.options[0].dialogue.buttonTooltip = `${namespace}:option:1:tooltip_shiny`;
      }
      const price = scene.getWaveMoneyAmount(priceMultiplier);
      encounter.setDialogueToken("purchasePokemon", pokemon.name);
      encounter.setDialogueToken("price", price.toString());
      encounter.misc = {
        price: price,
        pokemon: pokemon
      };

      pokemon.calculateStats();

      return true;
    })
    .withOption(
      new MysteryEncounterOptionBuilder()
        .withOptionMode(EncounterOptionMode.DEFAULT_OR_SPECIAL)
        .withHasDexProgress(true)
        .withSceneMoneyRequirement(null, MAX_POKEMON_PRICE_MULTIPLIER) // Wave scaling money multiplier of 2
        .withDialogue({
          buttonLabel: `${namespace}:option:1:label`,
          buttonTooltip: `${namespace}:option:1:tooltip`,
          selected: [
            {
              text: `${namespace}:option:1:selected_message`,
            }
          ],
        })
        .withOptionPhase(async (scene: BattleScene) => {
          const encounter = scene.currentBattle.mysteryEncounter;
          const price = encounter.misc.price;
          const purchasedPokemon = encounter.misc.pokemon as PlayerPokemon;

          // Update money
          updatePlayerMoney(scene, -price, true, false);

          // Show dialogue
          await showEncounterDialogue(scene, `${namespace}:option:1:selected_dialogue`, `${namespace}:speaker`);
          await transitionMysteryEncounterIntroVisuals(scene);

          // "Catch" purchased pokemon
          const data = new PokemonData(purchasedPokemon);
          data.player = false;
          await catchPokemon(scene, data.toPokemon(scene) as EnemyPokemon, null, PokeballType.POKEBALL, true);

          leaveEncounterWithoutBattle(scene, true);
        })
        .build()
    )
    .withSimpleOption(
      {
        buttonLabel: `${namespace}:option:2:label`,
        buttonTooltip: `${namespace}:option:2:tooltip`,
        selected: [
          {
            text: `${namespace}:option:2:selected`,
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
