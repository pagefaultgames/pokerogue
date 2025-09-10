import type { Ability } from "#abilities/ability";
import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/constants";
import { globalScene } from "#app/global-scene";
import { speciesStarterCosts } from "#balance/starters";
import { allAbilities } from "#data/data-lists";
import { getNatureName } from "#data/nature";
import { AbilityAttr } from "#enums/ability-attr";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { Nature } from "#enums/nature";
import { getStatKey } from "#enums/stat";
import type { PlayerPokemon, Pokemon } from "#field/pokemon";
import type { PokemonHeldItemModifier } from "#modifiers/modifier";
import { queueEncounterMessage, showEncounterText } from "#mystery-encounters/encounter-dialogue-utils";
import type { EnemyPartyConfig } from "#mystery-encounters/encounter-phase-utils";
import {
  initBattleWithEnemyConfig,
  leaveEncounterWithoutBattle,
  selectPokemonForOption,
  setEncounterRewards,
} from "#mystery-encounters/encounter-phase-utils";
import { isPokemonValidForEncounterOptionSelection } from "#mystery-encounters/encounter-pokemon-utils";
import type { MysteryEncounter } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterBuilder } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterOptionBuilder } from "#mystery-encounters/mystery-encounter-option";
import { PokemonData } from "#system/pokemon-data";
import type { HeldModifierConfig } from "#types/held-modifier-config";
import type { OptionSelectItem } from "#ui/handlers/abstract-option-select-ui-handler";
import { isNullOrUndefined, randSeedShuffle } from "#utils/common";
import { getEnumValues } from "#utils/enums";
import i18next from "i18next";

/** The i18n namespace for the encounter */
const namespace = "mysteryEncounters/trainingSession";

/**
 * Training Session encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3802 | GitHub Issue #3802}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const TrainingSessionEncounter: MysteryEncounter = MysteryEncounterBuilder.withEncounterType(
  MysteryEncounterType.TRAINING_SESSION,
)
  .withEncounterTier(MysteryEncounterTier.ULTRA)
  .withSceneWaveRangeRequirement(...CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES)
  .withScenePartySizeRequirement(2, 6, true) // Must have at least 2 unfainted pokemon in party
  .withFleeAllowed(false)
  .withHideWildIntroMessage(true)
  .withPreventGameStatsUpdates(true) // Do not count the Pokemon as seen or defeated since it is ours
  .withIntroSpriteConfigs([
    {
      spriteKey: "training_session_gear",
      fileRoot: "mystery-encounters",
      hasShadow: true,
      y: 6,
      x: 5,
      yShadow: -2,
    },
  ])
  .withIntroDialogue([
    {
      text: `${namespace}:intro`,
    },
  ])
  .setLocalizationKey(`${namespace}`)
  .withTitle(`${namespace}:title`)
  .withDescription(`${namespace}:description`)
  .withQuery(`${namespace}:query`)
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
      .withHasDexProgress(true)
      .withDialogue({
        buttonLabel: `${namespace}:option.1.label`,
        buttonTooltip: `${namespace}:option.1.tooltip`,
        selected: [
          {
            text: `${namespace}:option.selected`,
          },
        ],
      })
      .withPreOptionPhase(async (): Promise<boolean> => {
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        const onPokemonSelected = (pokemon: PlayerPokemon) => {
          encounter.misc = {
            playerPokemon: pokemon,
          };
        };

        // Only Pokemon that are not KOed/legal can be trained
        const selectableFilter = (pokemon: Pokemon) => {
          return isPokemonValidForEncounterOptionSelection(pokemon, `${namespace}:invalidSelection`);
        };

        return selectPokemonForOption(onPokemonSelected, undefined, selectableFilter);
      })
      .withOptionPhase(async () => {
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        const playerPokemon: PlayerPokemon = encounter.misc.playerPokemon;

        // Spawn light training session with chosen pokemon
        // Every 50 waves, add +1 boss segment, capping at 5
        const segments = Math.min(2 + Math.floor(globalScene.currentBattle.waveIndex / 50), 5);
        const modifiers = new ModifiersHolder();
        const config = getEnemyConfig(playerPokemon, segments, modifiers);
        globalScene.removePokemonFromPlayerParty(playerPokemon, false);

        const onBeforeRewardsPhase = () => {
          encounter.setDialogueToken("stat1", "-");
          encounter.setDialogueToken("stat2", "-");
          // Add the pokemon back to party with IV boost
          let ivIndexes: any[] = [];
          playerPokemon.ivs.forEach((iv, index) => {
            if (iv < 31) {
              ivIndexes.push({ iv, index });
            }
          });

          // Improves 2 random non-maxed IVs
          // +10 if IV is < 10, +5 if between 10-20, and +3 if > 20
          // A 0-4 starting IV will cap in 6 encounters (assuming you always rolled that IV)
          // 5-14 starting IV caps in 5 encounters
          // 15-19 starting IV caps in 4 encounters
          // 20-24 starting IV caps in 3 encounters
          // 25-27 starting IV caps in 2 encounters
          let improvedCount = 0;
          while (ivIndexes.length > 0 && improvedCount < 2) {
            ivIndexes = randSeedShuffle(ivIndexes);
            const ivToChange = ivIndexes.pop();
            let newVal = ivToChange.iv;
            if (improvedCount === 0) {
              encounter.setDialogueToken("stat1", i18next.t(getStatKey(ivToChange.index)) ?? "");
            } else {
              encounter.setDialogueToken("stat2", i18next.t(getStatKey(ivToChange.index)) ?? "");
            }

            // Corrects required encounter breakpoints to be continuous for all IV values
            if (ivToChange.iv <= 21 && ivToChange.iv - (1 % 5) === 0) {
              newVal += 1;
            }

            newVal += ivToChange.iv <= 10 ? 10 : ivToChange.iv <= 20 ? 5 : 3;
            newVal = Math.min(newVal, 31);
            playerPokemon.ivs[ivToChange.index] = newVal;
            improvedCount++;
          }

          if (improvedCount > 0) {
            playerPokemon.calculateStats();
            globalScene.gameData.updateSpeciesDexIvs(playerPokemon.species.getRootSpeciesId(true), playerPokemon.ivs);
            globalScene.gameData.setPokemonCaught(playerPokemon, false);
          }

          // Add pokemon and mods back
          globalScene.getPlayerParty().push(playerPokemon);
          for (const mod of modifiers.value) {
            mod.pokemonId = playerPokemon.id;
            globalScene.addModifier(mod, true, false, false, true);
          }
          globalScene.updateModifiers(true);
          queueEncounterMessage(`${namespace}:option.1.finished`);
        };

        setEncounterRewards({ fillRemaining: true }, undefined, onBeforeRewardsPhase);

        await initBattleWithEnemyConfig(config);
      })
      .build(),
  )
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
      .withHasDexProgress(true)
      .withDialogue({
        buttonLabel: `${namespace}:option.2.label`,
        buttonTooltip: `${namespace}:option.2.tooltip`,
        secondOptionPrompt: `${namespace}:option.2.selectPrompt`,
        selected: [
          {
            text: `${namespace}:option.selected`,
          },
        ],
      })
      .withPreOptionPhase(async (): Promise<boolean> => {
        // Open menu for selecting pokemon and Nature
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        const onPokemonSelected = (pokemon: PlayerPokemon) => {
          // Return the options for nature selection
          return getEnumValues(Nature).map((nature: Nature) => {
            const option: OptionSelectItem = {
              label: getNatureName(nature, true, true, true),
              handler: () => {
                // Pokemon and second option selected
                encounter.setDialogueToken("nature", getNatureName(nature));
                encounter.misc = {
                  playerPokemon: pokemon,
                  chosenNature: nature,
                };
                return true;
              },
            };
            return option;
          });
        };

        // Only Pokemon that are not KOed/legal can be trained
        const selectableFilter = (pokemon: Pokemon) => {
          return isPokemonValidForEncounterOptionSelection(pokemon, `${namespace}:invalidSelection`);
        };

        return selectPokemonForOption(onPokemonSelected, undefined, selectableFilter);
      })
      .withOptionPhase(async () => {
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        const playerPokemon: PlayerPokemon = encounter.misc.playerPokemon;

        // Spawn medium training session with chosen pokemon
        // Every 40 waves, add +1 boss segment, capping at 6
        const segments = Math.min(2 + Math.floor(globalScene.currentBattle.waveIndex / 40), 6);
        const modifiers = new ModifiersHolder();
        const config = getEnemyConfig(playerPokemon, segments, modifiers);
        globalScene.removePokemonFromPlayerParty(playerPokemon, false);

        const onBeforeRewardsPhase = () => {
          queueEncounterMessage(`${namespace}:option.2.finished`);
          // Add the pokemon back to party with Nature change
          playerPokemon.setCustomNature(encounter.misc.chosenNature);
          globalScene.gameData.unlockSpeciesNature(playerPokemon.species, encounter.misc.chosenNature);

          // Add pokemon and modifiers back
          globalScene.getPlayerParty().push(playerPokemon);
          for (const mod of modifiers.value) {
            mod.pokemonId = playerPokemon.id;
            globalScene.addModifier(mod, true, false, false, true);
          }
          globalScene.updateModifiers(true);
        };

        setEncounterRewards({ fillRemaining: true }, undefined, onBeforeRewardsPhase);

        await initBattleWithEnemyConfig(config);
      })
      .build(),
  )
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
      .withHasDexProgress(true)
      .withDialogue({
        buttonLabel: `${namespace}:option.3.label`,
        buttonTooltip: `${namespace}:option.3.tooltip`,
        secondOptionPrompt: `${namespace}:option.3.selectPrompt`,
        selected: [
          {
            text: `${namespace}:option.selected`,
          },
        ],
      })
      .withPreOptionPhase(async (): Promise<boolean> => {
        // Open menu for selecting pokemon and ability to learn
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        const onPokemonSelected = (pokemon: PlayerPokemon) => {
          // Return the options for ability selection
          const speciesForm = pokemon.getFusionSpeciesForm()
            ? pokemon.getFusionSpeciesForm()
            : pokemon.getSpeciesForm();
          const abilityCount = speciesForm.getAbilityCount();
          const abilities: Ability[] = new Array(abilityCount)
            .fill(null)
            .map((_val, i) => allAbilities[speciesForm.getAbility(i)]);

          const optionSelectItems: OptionSelectItem[] = [];
          abilities.forEach((ability: Ability, index) => {
            if (!optionSelectItems.some(o => o.label === ability.name)) {
              const option: OptionSelectItem = {
                label: ability.name,
                handler: () => {
                  // Pokemon and ability selected
                  encounter.setDialogueToken("ability", ability.name);
                  encounter.misc = {
                    playerPokemon: pokemon,
                    abilityIndex: index,
                  };
                  return true;
                },
                onHover: () => {
                  showEncounterText(ability.description, 0, 0, false);
                },
              };
              optionSelectItems.push(option);
            }
          });

          return optionSelectItems;
        };

        // Only Pokemon that are not KOed/legal can be trained
        const selectableFilter = (pokemon: Pokemon) => {
          return isPokemonValidForEncounterOptionSelection(pokemon, `${namespace}:invalidSelection`);
        };

        return selectPokemonForOption(onPokemonSelected, undefined, selectableFilter);
      })
      .withOptionPhase(async () => {
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        const playerPokemon: PlayerPokemon = encounter.misc.playerPokemon;

        // Spawn hard training session with chosen pokemon
        // Every 30 waves, add +1 boss segment, capping at 6
        // Also starts with +1 to all stats
        const segments = Math.min(2 + Math.floor(globalScene.currentBattle.waveIndex / 30), 6);
        const modifiers = new ModifiersHolder();
        const config = getEnemyConfig(playerPokemon, segments, modifiers);
        config.pokemonConfigs![0].tags = [BattlerTagType.MYSTERY_ENCOUNTER_POST_SUMMON];
        globalScene.removePokemonFromPlayerParty(playerPokemon, false);

        const onBeforeRewardsPhase = () => {
          queueEncounterMessage(`${namespace}:option.3.finished`);
          // Add the pokemon back to party with ability change
          const abilityIndex = encounter.misc.abilityIndex;

          if (playerPokemon.getFusionSpeciesForm()) {
            playerPokemon.fusionAbilityIndex = abilityIndex;

            // Only update the fusion's dex data if the Pokemon is already caught in dex (ignore rentals)
            const rootFusionSpecies = playerPokemon.fusionSpecies?.getRootSpeciesId();
            if (
              !isNullOrUndefined(rootFusionSpecies)
              && speciesStarterCosts.hasOwnProperty(rootFusionSpecies)
              && !!globalScene.gameData.dexData[rootFusionSpecies].caughtAttr
            ) {
              globalScene.gameData.starterData[rootFusionSpecies].abilityAttr |=
                playerPokemon.fusionAbilityIndex !== 1 || playerPokemon.fusionSpecies?.ability2
                  ? 1 << playerPokemon.fusionAbilityIndex
                  : AbilityAttr.ABILITY_HIDDEN;
            }
          } else {
            playerPokemon.abilityIndex = abilityIndex;
          }

          playerPokemon.calculateStats();
          globalScene.gameData.setPokemonCaught(playerPokemon, false);

          // Add pokemon and mods back
          globalScene.getPlayerParty().push(playerPokemon);
          for (const mod of modifiers.value) {
            mod.pokemonId = playerPokemon.id;
            globalScene.addModifier(mod, true, false, false, true);
          }
          globalScene.updateModifiers(true);
        };

        setEncounterRewards({ fillRemaining: true }, undefined, onBeforeRewardsPhase);

        await initBattleWithEnemyConfig(config);
      })
      .build(),
  )
  .withSimpleOption(
    {
      buttonLabel: `${namespace}:option.4.label`,
      buttonTooltip: `${namespace}:option.4.tooltip`,
      selected: [
        {
          text: `${namespace}:option.4.selected`,
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

function getEnemyConfig(playerPokemon: PlayerPokemon, segments: number, modifiers: ModifiersHolder): EnemyPartyConfig {
  playerPokemon.resetSummonData();

  // Passes modifiers by reference
  modifiers.value = playerPokemon.getHeldItems();
  const modifierConfigs = modifiers.value.map(mod => {
    return {
      modifier: mod.clone(),
      isTransferable: false,
      stackCount: mod.stackCount,
    };
  }) as HeldModifierConfig[];

  const data = new PokemonData(playerPokemon);
  return {
    pokemonConfigs: [
      {
        species: playerPokemon.species,
        isBoss: true,
        bossSegments: segments,
        formIndex: playerPokemon.formIndex,
        level: playerPokemon.level,
        dataSource: data,
        modifierConfigs,
      },
    ],
  };
}

class ModifiersHolder {
  public value: PokemonHeldItemModifier[] = [];
}
