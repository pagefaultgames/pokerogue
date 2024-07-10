import { Ability, allAbilities } from "#app/data/ability";
import {
  EnemyPartyConfig,
  getEncounterText,
  initBattleWithEnemyConfig,
  selectPokemonForOption,
  setEncounterRewards
} from "#app/data/mystery-encounters/mystery-encounter-utils";
import { getNatureName, Nature } from "#app/data/nature";
import { speciesStarters } from "#app/data/pokemon-species";
import { Stat } from "#app/data/pokemon-stat";
import { PlayerPokemon } from "#app/field/pokemon";
import { pokemonInfo } from "#app/locales/en/pokemon-info";
import { PokemonHeldItemModifier } from "#app/modifier/modifier";
import { PokemonHeldItemModifierType } from "#app/modifier/modifier-type";
import { AbilityAttr } from "#app/system/game-data";
import PokemonData from "#app/system/pokemon-data";
import { OptionSelectItem } from "#app/ui/abstact-option-select-ui-handler";
import { randSeedShuffle } from "#app/utils";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import BattleScene from "../../../battle-scene";
import MysteryEncounter, { MysteryEncounterBuilder, MysteryEncounterTier } from "../mystery-encounter";
import { MysteryEncounterOptionBuilder } from "../mystery-encounter-option";

export const TrainingSessionEncounter: MysteryEncounter = MysteryEncounterBuilder
  .withEncounterType(MysteryEncounterType.TRAINING_SESSION)
  .withEncounterTier(MysteryEncounterTier.ULTRA)
  .withIntroSpriteConfigs([
    {
      spriteKey: "training_gear",
      fileRoot: "mystery-encounters",
      hasShadow: true,
      y: 3
    }
  ])
  .withSceneWaveRangeRequirement(10, 180) // waves 10 to 180
  .withHideWildIntroMessage(true)
  .withOption(new MysteryEncounterOptionBuilder()
    .withPreOptionPhase(async (scene: BattleScene): Promise<boolean> => {
      const encounter = scene.currentBattle.mysteryEncounter;
      const onPokemonSelected = (pokemon: PlayerPokemon) => {
        encounter.misc = {
          playerPokemon: pokemon
        };
      };

      return selectPokemonForOption(scene, onPokemonSelected);
    })
    .withOptionPhase(async (scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter;
      const playerPokemon: PlayerPokemon = encounter.misc.playerPokemon;

      // Spawn light training session with chosen pokemon
      // Every 50 waves, add +1 boss segment, capping at 5
      const segments = Math.min(2 + Math.floor(scene.currentBattle.waveIndex / 50), 5);
      const modifiers = new ModifiersHolder();
      const config = getEnemyConfig(scene, playerPokemon, segments, modifiers);
      scene.removePokemonFromPlayerParty(playerPokemon, false);

      const getIvName = (index: number) => {
        switch (index) {
        case Stat.HP:
          return pokemonInfo.Stat["HPshortened"];
        case Stat.ATK:
          return pokemonInfo.Stat["ATKshortened"];
        case Stat.DEF:
          return pokemonInfo.Stat["DEFshortened"];
        case Stat.SPATK:
          return pokemonInfo.Stat["SPATKshortened"];
        case Stat.SPDEF:
          return pokemonInfo.Stat["SPDEFshortened"];
        case Stat.SPD:
          return pokemonInfo.Stat["SPDshortened"];
        }
      };

      const onBeforeRewardsPhase = () => {
        encounter.setDialogueToken("stat1", "-");
        encounter.setDialogueToken("stat2", "-");
        // Add the pokemon back to party with IV boost
        const ivIndexes = [];
        playerPokemon.ivs.forEach((iv, index) => {
          if (iv < 31) {
            ivIndexes.push({ iv: iv, index: index });
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
          if (improvedCount === 0) {
            encounter.setDialogueToken("stat1", getIvName(ivToChange.index));
          } else {
            encounter.setDialogueToken("stat2", getIvName(ivToChange.index));
          }

          // Corrects required encounter breakpoints to be continuous for all IV values
          if (ivToChange.iv <= 21 && ivToChange.iv - 1 % 5 === 0) {
            newVal += 1;
          }

          newVal += ivToChange.iv <= 10 ? 10 : ivToChange.iv <= 20 ? 5 : 3;
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
        scene.queueMessage(getEncounterText(scene, "mysteryEncounter:training_session_battle_finished_1"), null, true);
      };

      setEncounterRewards(scene, { fillRemaining: true }, null, onBeforeRewardsPhase);

      return initBattleWithEnemyConfig(scene, config);
    })
    .build()
  )
  .withOption(new MysteryEncounterOptionBuilder()
    .withPreOptionPhase(async (scene: BattleScene): Promise<boolean> => {
      // Open menu for selecting pokemon and Nature
      const encounter = scene.currentBattle.mysteryEncounter;
      const natures = new Array(25).fill(null).map((val, i) => i as Nature);
      const onPokemonSelected = (pokemon: PlayerPokemon) => {
        // Return the options for nature selection
        return natures.map((nature: Nature) => {
          const option: OptionSelectItem = {
            label: getNatureName(nature, true, true, true, scene.uiTheme),
            handler: () => {
              // Pokemon and second option selected
              encounter.setDialogueToken("nature", getNatureName(nature));
              encounter.misc = {
                playerPokemon: pokemon,
                chosenNature: nature
              };
              return true;
            }
          };
          return option;
        });
      };

      return selectPokemonForOption(scene, onPokemonSelected);
    })
    .withOptionPhase(async (scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter;
      const playerPokemon: PlayerPokemon = encounter.misc.playerPokemon;

      // Spawn medium training session with chosen pokemon
      // Every 40 waves, add +1 boss segment, capping at 6
      const segments = Math.min(2 + Math.floor(scene.currentBattle.waveIndex / 40), 6);
      const modifiers = new ModifiersHolder();
      const config = getEnemyConfig(scene, playerPokemon, segments, modifiers);
      scene.removePokemonFromPlayerParty(playerPokemon, false);

      const onBeforeRewardsPhase = () => {
        scene.queueMessage(getEncounterText(scene, "mysteryEncounter:training_session_battle_finished_2"), null, true);
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

      setEncounterRewards(scene, { fillRemaining: true }, null, onBeforeRewardsPhase);

      return initBattleWithEnemyConfig(scene, config);
    })
    .build()
  )
  .withOption(new MysteryEncounterOptionBuilder()
    .withPreOptionPhase(async (scene: BattleScene): Promise<boolean> => {
      // Open menu for selecting pokemon and ability to learn
      const encounter = scene.currentBattle.mysteryEncounter;
      const onPokemonSelected = (pokemon: PlayerPokemon) => {
        // Return the options for ability selection
        const speciesForm = !!pokemon.getFusionSpeciesForm() ? pokemon.getFusionSpeciesForm() : pokemon.getSpeciesForm();
        const abilityCount = speciesForm.getAbilityCount();
        const abilities = new Array(abilityCount).fill(null).map((val, i) => allAbilities[speciesForm.getAbility(i)]);
        return abilities.map((ability: Ability, index) => {
          const option: OptionSelectItem = {
            label: ability.name,
            handler: () => {
              // Pokemon and ability selected
              encounter.setDialogueToken("ability", ability.name);
              encounter.misc = {
                playerPokemon: pokemon,
                abilityIndex: index
              };
              return true;
            },
            onHover: () => {
              scene.ui.showText(ability.description);
            }
          };
          return option;
        });
      };

      return selectPokemonForOption(scene, onPokemonSelected);
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
      config.pokemonConfigs[0].tags = [BattlerTagType.MYSTERY_ENCOUNTER_POST_SUMMON];
      scene.removePokemonFromPlayerParty(playerPokemon, false);

      const onBeforeRewardsPhase = () => {
        scene.queueMessage(getEncounterText(scene, "mysteryEncounter:training_session_battle_finished_3"), null, true);
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

      setEncounterRewards(scene, { fillRemaining: true }, null, onBeforeRewardsPhase);

      return initBattleWithEnemyConfig(scene, config);
    })
    .build()
  )
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

  constructor() {
  }
}
