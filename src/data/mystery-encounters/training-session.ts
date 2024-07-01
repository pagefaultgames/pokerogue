import BattleScene from "../../battle-scene";
import {
  applyEncounterDialogueTokens,
  EnemyPartyConfig,
  initBattleWithEnemyConfig,
  setCustomEncounterRewards
} from "#app/data/mystery-encounters/mystery-encounter-utils";
import {MysteryEncounterType} from "#enums/mystery-encounter-type";
import MysteryEncounter, {MysteryEncounterBuilder, MysteryEncounterTier} from "../mystery-encounter";
import {MysteryEncounterOptionBuilder} from "../mystery-encounter-option";
import {WaveCountRequirement} from "../mystery-encounter-requirements";
import {Mode} from "#app/ui/ui";
import {PartyOption, PartyUiMode} from "#app/ui/party-ui-handler";
import {PlayerPokemon} from "#app/field/pokemon";
import PokemonData from "#app/system/pokemon-data";
import {randSeedShuffle} from "#app/utils";
import {getNatureName, Nature} from "#app/data/nature";
import {BattlerTagType} from "#enums/battler-tag-type";
import i18next from "i18next";
import {OptionSelectItem} from "#app/ui/abstact-option-select-ui-handler";
import {PokemonHeldItemModifier} from "#app/modifier/modifier";
import {PokemonHeldItemModifierType} from "#app/modifier/modifier-type";
import {Ability, allAbilities} from "#app/data/ability";
import {speciesStarters} from "#app/data/pokemon-species";
import {AbilityAttr} from "#app/system/game-data";

export const TrainingSessionEncounter: MysteryEncounter = new MysteryEncounterBuilder()
  .withEncounterType(MysteryEncounterType.TRAINING_SESSION)
  .withEncounterTier(MysteryEncounterTier.RARE)
  .withIntroSpriteConfigs([
    {
      spriteKey: "training_gear",
      fileRoot: "mystery-encounters",
      hasShadow: true,
      y: 3
    }
  ]) // No intro sprites
  .withRequirement(new WaveCountRequirement([10, 180])) // waves 10 to 180
  .withHideWildIntroMessage(true)
  .withOption(new MysteryEncounterOptionBuilder()
    .withPreOptionPhase(async (scene: BattleScene): Promise<boolean> => {
      const encounter = scene.currentBattle.mysteryEncounter;
      return new Promise(resolve => {
        // Open party screen to choose pokemon to train
        scene.ui.setMode(Mode.PARTY, PartyUiMode.SELECT, -1, (slotIndex: integer, option: PartyOption) => {
          if (slotIndex < scene.getParty().length) {
            scene.ui.setMode(Mode.MYSTERY_ENCOUNTER).then(() => {
              const pokemon = scene.getParty()[slotIndex];
              encounter.misc = {
                playerPokemon: pokemon
              };

              scene.currentBattle.mysteryEncounter.dialogueTokens.push([/@ec\{pokeName\}/gi, pokemon.name]);

              resolve(true);
            });
          } else {
            scene.ui.setMode(Mode.MYSTERY_ENCOUNTER);
            resolve(false);
          }
        });
      });
    })
    .withOptionPhase(async (scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter;
      const playerPokemon: PlayerPokemon = encounter.misc.playerPokemon;

      // Spawn light training session with chosen pokemon
      // Every 50 waves, add +1 boss segment, capping at 5
      const segments = Math.min(2 + Math.floor(scene.currentBattle.waveIndex / 50), 5);
      const modifiers = new ModifiersHolder();
      const config = getEnemyConfig(scene, playerPokemon, segments, modifiers);

      // Remove pokemon and modifiers from party (will be added back later)
      const partyIndex = scene.getParty().indexOf(playerPokemon);
      scene.getParty().splice(partyIndex, 1);
      scene.updateModifiers(true);

      const onBeforeRewardsPhase = () => {
        const text = i18next.t("mysteryEncounter:training_session_battle_finished");
        scene.queueMessage(applyEncounterDialogueTokens(scene, text), null, true);
        // Add the pokemon back to party with IV boost
        const ivIndexes = [];
        playerPokemon.ivs.forEach((iv, index) => {
          if (iv < 31) {
            ivIndexes.push({iv: iv, index: index});
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
          randSeedShuffle(ivIndexes);
          const ivToChange = ivIndexes.pop();
          let newVal = ivToChange.iv;

          // Corrects required encounter breakpoints to be continuous for all IV values
          if (ivToChange.iv <= 21 && ivToChange.iv - 1 % 5 === 0) {
            newVal += 1;
          }
          if (ivToChange.iv <= 10) {
            newVal += 10;
          } else if (ivToChange.iv <= 20) {
            newVal += 5;
          } else {
            newVal += 3;
          }
          newVal = Math.min(newVal, 31);
          playerPokemon.ivs[ivToChange.index] = newVal;
          improvedCount++;
        }

        if (improvedCount > 0) {
          playerPokemon.calculateStats();
          scene.gameData.updateSpeciesDexIvs(playerPokemon.species.getRootSpeciesId(true), playerPokemon.ivs);
          scene.gameData.setPokemonCaught(playerPokemon, false);
        }

        // Add pokemon and mods back
        scene.getParty().push(playerPokemon);
        for (const mod of modifiers.value) {
          scene.addModifier(mod, true, false, false, true);
        }
        scene.updateModifiers(true);
      };

      setCustomEncounterRewards(scene, { fillRemaining: true }, null, onBeforeRewardsPhase);

      return initBattleWithEnemyConfig(scene, config);
    })
    .build())
  .withOption(new MysteryEncounterOptionBuilder()
    .withPreOptionPhase(async (scene: BattleScene): Promise<boolean> => {
      const encounter = scene.currentBattle.mysteryEncounter;
      return new Promise(resolve => {
        // Open party screen to choose pokemon to train
        scene.ui.setMode(Mode.PARTY, PartyUiMode.SELECT, -1, (slotIndex: integer, option: PartyOption) => {
          if (slotIndex < scene.getParty().length) {
            const pokemon = scene.getParty()[slotIndex];
            scene.currentBattle.mysteryEncounter.dialogueTokens.push([/@ec\{pokeName\}/gi, pokemon.name]);
            scene.ui.setMode(Mode.MESSAGE).then(() => {
              scene.ui.showText(i18next.t("mysteryEncounter:training_session_option_2_select_prompt"), null, () => {
                const natures = new Array(25).fill(null).map((val, i) => i as Nature);
                scene.ui.setModeWithoutClear(Mode.OPTION_SELECT, {
                  options: natures.map((n: Nature) => {
                    const option: OptionSelectItem = {
                      label: getNatureName(n, true, true, true, scene.uiTheme),
                      handler: () => {
                        // Set chosen nature
                        encounter.misc = {
                          playerPokemon: pokemon,
                          chosenNature: n
                        };
                        resolve(true);
                        return true;
                      }
                    };
                    return option;
                  }).concat({
                    label: i18next.t("menu:cancel"),
                    handler: () => {
                      scene.ui.clearText();
                      scene.ui.setMode(Mode.MYSTERY_ENCOUNTER);
                      resolve(false);
                      return true;
                    },
                    onHover: () => {
                      scene.ui.showText("Return to encounter option select.");
                    }
                  }),
                  maxOptions: 7,
                  yOffset: 0,
                  supportHover: true
                });
              }, null, true);
            });
          } else {
            scene.ui.setMode(Mode.MYSTERY_ENCOUNTER);
            resolve(false);
          }
        });
      });
    })
    .withOptionPhase(async (scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter;
      const playerPokemon: PlayerPokemon = encounter.misc.playerPokemon;

      // Spawn medium training session with chosen pokemon
      // Every 40 waves, add +1 boss segment, capping at 6
      const segments = Math.min(2 + Math.floor(scene.currentBattle.waveIndex / 40), 6);
      const modifiers = new ModifiersHolder();
      const config = getEnemyConfig(scene, playerPokemon, segments, modifiers);

      // Remove from party (will be added back later)
      const partyIndex = scene.getParty().indexOf(playerPokemon);
      scene.getParty().splice(partyIndex, 1);

      const onBeforeRewardsPhase = () => {
        const text = i18next.t("mysteryEncounter:training_session_battle_finished");
        scene.queueMessage(applyEncounterDialogueTokens(scene, text), null, true);
        // Add the pokemon back to party with Nature change
        playerPokemon.setNature(encounter.misc.chosenNature);
        scene.gameData.setPokemonCaught(playerPokemon, false);

        // Add pokemon and mods back
        scene.getParty().push(playerPokemon);
        for (const mod of modifiers.value) {
          scene.addModifier(mod, true, false, false, true);
        }
        scene.updateModifiers(true);
      };

      setCustomEncounterRewards(scene, { fillRemaining: true }, null, onBeforeRewardsPhase);

      return initBattleWithEnemyConfig(scene, config);
    })
    .build())
  .withOption(new MysteryEncounterOptionBuilder()
    .withPreOptionPhase(async (scene: BattleScene): Promise<boolean> => {
      const encounter = scene.currentBattle.mysteryEncounter;
      return new Promise(resolve => {
        // Open party screen to choose pokemon to train
        scene.ui.setMode(Mode.PARTY, PartyUiMode.SELECT, -1, (slotIndex: integer, option: PartyOption) => {
          if (slotIndex < scene.getParty().length) {
            const pokemon = scene.getParty()[slotIndex];
            scene.currentBattle.mysteryEncounter.dialogueTokens.push([/@ec\{pokeName\}/gi, pokemon.name]);
            scene.ui.setMode(Mode.MESSAGE).then(() => {
              scene.ui.showText(i18next.t("mysteryEncounter:training_session_option_3_select_prompt"), null, () => {
                // const isFusion = !!pokemon.getFusionSpeciesForm();
                const speciesForm = !!pokemon.getFusionSpeciesForm() ? pokemon.getFusionSpeciesForm() : pokemon.getSpeciesForm();
                const abilityCount = speciesForm.getAbilityCount();
                const abilities = new Array(abilityCount).fill(null).map((val, i) => allAbilities[speciesForm.getAbility(i)]);
                scene.ui.showText(abilities[0].description);
                scene.ui.setModeWithoutClear(Mode.OPTION_SELECT, {
                  options: abilities.map((ability: Ability, i) => {
                    const option: OptionSelectItem = {
                      label: ability.name,
                      handler: () => {
                        // Set chosen ability
                        encounter.misc = {
                          playerPokemon: pokemon,
                          abilityIndex: i
                        };
                        resolve(true);
                        return true;
                      },
                      onHover: () => {
                        scene.ui.showText(ability.description);
                      }
                    };
                    return option;
                  }).concat({
                    label: i18next.t("menu:cancel"),
                    handler: () => {
                      scene.ui.clearText();
                      scene.ui.setMode(Mode.MYSTERY_ENCOUNTER);
                      resolve(false);
                      return true;
                    },
                    onHover: () => {
                      scene.ui.showText("Return to encounter option select.");
                    }
                  }),
                  maxOptions: 7,
                  yOffset: 0,
                  supportHover: true
                });
              }, null, true);
            });
          } else {
            scene.ui.setMode(Mode.MYSTERY_ENCOUNTER);
            resolve(false);
          }
        });
      });
    })
    .withOptionPhase(async (scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter;
      const playerPokemon: PlayerPokemon = encounter.misc.playerPokemon;

      // Spawn hard training session with chosen pokemon
      // Every 30 waves, add +1 boss segment, capping at 6
      // Also starts with +1 to all stats
      const segments = Math.min(2 + Math.floor(scene.currentBattle.waveIndex / 30), 6);
      const modifiers = new ModifiersHolder();
      const config = getEnemyConfig(scene, playerPokemon, segments, modifiers);
      config.pokemonConfigs[0].tags = [BattlerTagType.ENRAGED];

      // Remove from party (will be added back later)
      const partyIndex = scene.getParty().indexOf(playerPokemon);
      scene.getParty().splice(partyIndex, 1);

      const onBeforeRewardsPhase = () => {
        const text = i18next.t("mysteryEncounter:training_session_battle_finished");
        scene.queueMessage(applyEncounterDialogueTokens(scene, text), null, true);
        // Add the pokemon back to party with ability change
        const abilityIndex = encounter.misc.abilityIndex;
        if (!!playerPokemon.getFusionSpeciesForm()) {
          playerPokemon.fusionAbilityIndex = abilityIndex;
          if (speciesStarters.hasOwnProperty(playerPokemon.fusionSpecies.speciesId)) {
            scene.gameData.starterData[playerPokemon.fusionSpecies.speciesId].abilityAttr |= abilityIndex !== 1 || playerPokemon.fusionSpecies.ability2
              ? Math.pow(2, playerPokemon.fusionAbilityIndex)
              : AbilityAttr.ABILITY_HIDDEN;
          }
        } else {
          playerPokemon.abilityIndex = abilityIndex;
          if (speciesStarters.hasOwnProperty(playerPokemon.species.speciesId)) {
            scene.gameData.starterData[playerPokemon.species.speciesId].abilityAttr |= abilityIndex !== 1 || playerPokemon.species.ability2
              ? Math.pow(2, playerPokemon.abilityIndex)
              : AbilityAttr.ABILITY_HIDDEN;
          }
        }

        playerPokemon.getAbility();
        playerPokemon.calculateStats();
        scene.gameData.setPokemonCaught(playerPokemon, false);

        // Add pokemon and mods back
        scene.getParty().push(playerPokemon);
        for (const mod of modifiers.value) {
          scene.addModifier(mod, true, false, false, true);
        }
        scene.updateModifiers(true);
      };

      setCustomEncounterRewards(scene, { fillRemaining: true }, null, onBeforeRewardsPhase);

      return initBattleWithEnemyConfig(scene, config);
    })
    .build())
  .build();

function getEnemyConfig(scene: BattleScene, playerPokemon: PlayerPokemon, segments: number, modifiers: ModifiersHolder): EnemyPartyConfig {
  playerPokemon.resetSummonData();

  // Passes modifiers by reference
  modifiers.value = scene.findModifiers(m => m instanceof PokemonHeldItemModifier
    && (m as PokemonHeldItemModifier).pokemonId === playerPokemon.id) as PokemonHeldItemModifier[];
  const modifierTypes = modifiers.value.map(mod => mod.type) as PokemonHeldItemModifierType[];

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
        modifierTypes: modifierTypes
      }
    ]
  };
}

class ModifiersHolder {
  public value: PokemonHeldItemModifier[] = [];

  constructor() {}
}
