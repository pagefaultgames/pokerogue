import { generateModifierTypeOption, leaveEncounterWithoutBattle, selectPokemonForOption, setEncounterExp, updatePlayerMoney, } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { StatusEffect } from "#app/data/status-effect";
import Pokemon, { PlayerPokemon } from "#app/field/pokemon";
import { modifierTypes } from "#app/modifier/modifier-type";
import { isNullOrUndefined, randSeedInt } from "#app/utils";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import BattleScene from "../../../battle-scene";
import IMysteryEncounter, { MysteryEncounterBuilder, MysteryEncounterTier, } from "../mystery-encounter";
import { EncounterOptionMode, MysteryEncounterOptionBuilder } from "../mystery-encounter-option";
import { MoneyRequirement } from "../mystery-encounter-requirements";
import { getEncounterText, queueEncounterMessage } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import { applyDamageToPokemon, getRandomSpeciesByStarterTier } from "#app/data/mystery-encounters/utils/encounter-pokemon-utils";
import { getPokemonSpecies, speciesStarters } from "#app/data/pokemon-species";
import { Species } from "#enums/species";

/** the i18n namespace for this encounter */
const namespace = "mysteryEncounter:pokemonSalesman";

/**
 * Pokemon Salesman encounter.
 * @see {@link https://github.com/AsdarDevelops/PokeRogue-Events/issues/36 | GitHub Issue #36}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const PokemonSalesmanEncounter: IMysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(MysteryEncounterType.POKEMON_SALESMAN)
    .withEncounterTier(MysteryEncounterTier.ULTRA)
    .withSceneWaveRangeRequirement(10, 180)
    .withSceneRequirement(new MoneyRequirement(null, 8)) // Some costs may not be as significant, this is the max you'd pay
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


      let pokemon;
      if (isNullOrUndefined(species.abilityHidden) || randSeedInt(100) === 0) {
        // If no HA mon found or you roll 1%, give shiny Magikarp
        species = getPokemonSpecies(Species.MAGIKARP);
        const hiddenIndex = species.ability2 ? 2 : 1;
        pokemon = scene.addPlayerPokemon(species, 5, hiddenIndex, species.formIndex, null, true);
      } else {
        const hiddenIndex = species.ability2 ? 2 : 1;
        pokemon = scene.addPlayerPokemon(species, 5, hiddenIndex, species.formIndex);
      }

      const starterTier = speciesStarters[species.speciesId];
      // Prices by starter tier: 8/6.4/4.8/4/4
      let priceMultiplier = 8 * (Math.max(starterTier, 2.5) / 5);
      if (pokemon.shiny) {
        // Always max price for shiny, and add special message to intro
        priceMultiplier = 8;
        encounter.setDialogueToken("specialShinyText", `$t(${namespace}:shiny)`);
      } else {
        encounter.setDialogueToken("specialShinyText", "");
      }
      encounter.setDialogueToken("purchasePokemon", pokemon.name);
      encounter.setDialogueToken("price", pokemon.name);
      encounter.misc = {
        money: scene.getWaveMoneyAmount(priceMultiplier),
        pokemon: pokemon,
        // shiny: pokemon.shiny
      };

      pokemon.calculateStats();

      return true;
    })
    .withSimpleOption({
      buttonLabel: `${namespace}:option:1:label`,
      buttonTooltip: `${namespace}:option:1:tooltip`,
      selected: [
        {
          text: `${namespace}:option:selected`,
        },
      ],
    },
    async (scene: BattleScene) => {
      // Choose Cheap Option
      const encounter = scene.currentBattle.mysteryEncounter;
      const cost = encounter.misc.money;
      // const purchasedPokemon = encounter.misc.pokemon;

      // Update money
      updatePlayerMoney(scene, -cost);

      leaveEncounterWithoutBattle(scene);
    })
    .withOption(
      new MysteryEncounterOptionBuilder()
        .withOptionMode(EncounterOptionMode.DEFAULT)
        .withSceneMoneyRequirement(0, 2) // Wave scaling money multiplier of 2
        .withDialogue({
          buttonLabel: `${namespace}:option:1:label`,
          buttonTooltip: `${namespace}:option:1:tooltip`,
          selected: [
            {
              text: `${namespace}:option:selected`,
            },
          ],
        })
        .withPreOptionPhase(async (scene: BattleScene): Promise<boolean> => {
          const encounter = scene.currentBattle.mysteryEncounter;
          const onPokemonSelected = (pokemon: PlayerPokemon) => {
            // Update money
            updatePlayerMoney(scene, -(encounter.options[0].requirements[0] as MoneyRequirement).requiredMoney);
            // Calculate modifiers and dialogue tokens
            const modifiers = [
              generateModifierTypeOption(scene, modifierTypes.BASE_STAT_BOOSTER).type,
              generateModifierTypeOption(scene, modifierTypes.BASE_STAT_BOOSTER).type,
            ];
            encounter.setDialogueToken("boost1", modifiers[0].name);
            encounter.setDialogueToken("boost2", modifiers[1].name);
            encounter.misc = {
              chosenPokemon: pokemon,
              modifiers: modifiers,
            };
          };

          // Only Pokemon that can gain benefits are above 1/3rd HP with no status
          const selectableFilter = (pokemon: Pokemon) => {
            // If pokemon meets primary pokemon reqs, it can be selected
            const meetsReqs = encounter.pokemonMeetsPrimaryRequirements(scene, pokemon);
            if (!meetsReqs) {
              return getEncounterText(scene, `${namespace}:invalid_selection`);
            }

            return null;
          };

          return selectPokemonForOption(scene, onPokemonSelected, null, selectableFilter);
        })
        .withOptionPhase(async (scene: BattleScene) => {
          // Choose Cheap Option
          const encounter = scene.currentBattle.mysteryEncounter;
          const chosenPokemon = encounter.misc.chosenPokemon;
          const modifiers = encounter.misc.modifiers;

          for (const modType of modifiers) {
            const modifier = modType.newModifier(chosenPokemon);
            await scene.addModifier(modifier, true, false, false, true);
          }
          scene.updateModifiers(true);

          leaveEncounterWithoutBattle(scene);
        })
        .withPostOptionPhase(async (scene: BattleScene) => {
          // Damage and status applied after dealer leaves (to make thematic sense)
          const encounter = scene.currentBattle.mysteryEncounter;
          const chosenPokemon = encounter.misc.chosenPokemon;

          // Pokemon takes 1/3 max HP damage
          applyDamageToPokemon(scene, chosenPokemon, Math.floor(chosenPokemon.getMaxHp() / 3));

          // Roll for poison (80%)
          if (randSeedInt(10) < 8) {
            if (chosenPokemon.trySetStatus(StatusEffect.TOXIC)) {
              // Toxic applied
              queueEncounterMessage(scene, `${namespace}:bad_poison`);
            } else {
              // Pokemon immune or something else prevents status
              queueEncounterMessage(scene, `${namespace}:damage_only`);
            }
          } else {
            queueEncounterMessage(scene, `${namespace}:damage_only`);
          }

          setEncounterExp(scene, [chosenPokemon.id], 100);

          chosenPokemon.updateInfo();
        })
        .build()
    )
    .withOption(
      new MysteryEncounterOptionBuilder()
        .withOptionMode(EncounterOptionMode.DISABLED_OR_DEFAULT)
        .withSceneMoneyRequirement(0, 5) // Wave scaling money multiplier of 5
        .withDialogue({
          buttonLabel: `${namespace}:option:2:label`,
          buttonTooltip: `${namespace}:option:2:tooltip`,
          selected: [
            {
              text: `${namespace}:option:selected`,
            },
          ],
        })
        .withPreOptionPhase(async (scene: BattleScene): Promise<boolean> => {
          const encounter = scene.currentBattle.mysteryEncounter;
          const onPokemonSelected = (pokemon: PlayerPokemon) => {
            // Update money
            updatePlayerMoney(scene, -(encounter.options[1].requirements[0] as MoneyRequirement).requiredMoney);
            // Calculate modifiers and dialogue tokens
            const modifiers = [
              generateModifierTypeOption(scene, modifierTypes.BASE_STAT_BOOSTER).type,
              generateModifierTypeOption(scene, modifierTypes.BASE_STAT_BOOSTER).type,
            ];
            encounter.setDialogueToken("boost1", modifiers[0].name);
            encounter.setDialogueToken("boost2", modifiers[1].name);
            encounter.misc = {
              chosenPokemon: pokemon,
              modifiers: modifiers,
            };
          };

          // Only Pokemon that can gain benefits are above 1/3rd HP with no status
          const selectableFilter = (pokemon: Pokemon) => {
            // If pokemon meets primary pokemon reqs, it can be selected
            const meetsReqs = encounter.pokemonMeetsPrimaryRequirements(scene, pokemon);
            if (!meetsReqs) {
              return getEncounterText(scene, `${namespace}:invalid_selection`);
            }

            return null;
          };

          return selectPokemonForOption(scene, onPokemonSelected, null, selectableFilter);
        })
        .withOptionPhase(async (scene: BattleScene) => {
          // Choose Expensive Option
          const encounter = scene.currentBattle.mysteryEncounter;
          const chosenPokemon = encounter.misc.chosenPokemon;
          const modifiers = encounter.misc.modifiers;

          for (const modType of modifiers) {
            const modifier = modType.newModifier(chosenPokemon);
            await scene.addModifier(modifier, true, false, false, true);
          }
          scene.updateModifiers(true);

          leaveEncounterWithoutBattle(scene);
        })
        .withPostOptionPhase(async (scene: BattleScene) => {
          // Status applied after dealer leaves (to make thematic sense)
          const encounter = scene.currentBattle.mysteryEncounter;
          const chosenPokemon = encounter.misc.chosenPokemon;

          // Roll for poison (20%)
          if (randSeedInt(10) < 2) {
            if (chosenPokemon.trySetStatus(StatusEffect.POISON)) {
              // Poison applied
              queueEncounterMessage(scene, `${namespace}:poison`);
            } else {
              // Pokemon immune or something else prevents status
              queueEncounterMessage(scene, `${namespace}:no_bad_effects`);
            }
          } else {
            queueEncounterMessage(scene, `${namespace}:no_bad_effects`);
          }

          setEncounterExp(scene, [chosenPokemon.id], 100);

          chosenPokemon.updateInfo();
        })
        .build()
    )
    .withSimpleOption(
      {
        buttonLabel: `${namespace}:option:3:label`,
        buttonTooltip: `${namespace}:option:3:tooltip`,
      },
      async (scene: BattleScene) => {
        // Leave encounter with no rewards or exp
        leaveEncounterWithoutBattle(scene, true);
        return true;
      }
    )
    .build();
