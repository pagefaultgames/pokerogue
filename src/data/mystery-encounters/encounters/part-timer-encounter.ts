import { MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import { leaveEncounterWithoutBattle, selectPokemonForOption, setEncounterExp, setEncounterRewards, transitionMysteryEncounterIntroVisuals, updatePlayerMoney } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import BattleScene from "#app/battle-scene";
import MysteryEncounter, { MysteryEncounterBuilder } from "#app/data/mystery-encounters/mystery-encounter";
import { MoveRequirement } from "#app/data/mystery-encounters/mystery-encounter-requirements";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { Stat } from "#enums/stat";
import { CHARMING_MOVES } from "#app/data/mystery-encounters/requirements/requirement-groups";
import { showEncounterDialogue, showEncounterText } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import i18next from "i18next";
import Pokemon, { PlayerPokemon } from "#app/field/pokemon";
import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/game-mode";
import { isPokemonValidForEncounterOptionSelection } from "#app/data/mystery-encounters/utils/encounter-pokemon-utils";

/** the i18n namespace for the encounter */
const namespace = "mysteryEncounters/partTimer";

/**
 * Part Timer encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3813 | GitHub Issue #3813}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const PartTimerEncounter: MysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(MysteryEncounterType.PART_TIMER)
    .withEncounterTier(MysteryEncounterTier.COMMON)
    .withSceneWaveRangeRequirement(...CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES)
    .withIntroSpriteConfigs([
      {
        spriteKey: "part_timer_crate",
        fileRoot: "mystery-encounters",
        hasShadow: false,
        y: 6,
        x: 15
      },
      {
        spriteKey: "worker_f",
        fileRoot: "trainer",
        hasShadow: true,
        x: -18,
        y: 4
      }
    ])
    .withAutoHideIntroVisuals(false)
    .withIntroDialogue([
      {
        text: `${namespace}:intro`,
      },
      {
        speaker: `${namespace}:speaker`,
        text: `${namespace}:intro_dialogue`,
      },
    ])
    .withOnInit((scene: BattleScene) => {
      // Load sfx
      scene.loadSe("PRSFX- Horn Drill1", "battle_anims", "PRSFX- Horn Drill1.wav");
      scene.loadSe("PRSFX- Horn Drill3", "battle_anims", "PRSFX- Horn Drill3.wav");
      scene.loadSe("PRSFX- Guillotine2", "battle_anims", "PRSFX- Guillotine2.wav");
      scene.loadSe("PRSFX- Heavy Slam2", "battle_anims", "PRSFX- Heavy Slam2.wav");

      scene.loadSe("PRSFX- Agility", "battle_anims", "PRSFX- Agility.wav");
      scene.loadSe("PRSFX- Extremespeed1", "battle_anims", "PRSFX- Extremespeed1.wav");
      scene.loadSe("PRSFX- Accelerock1", "battle_anims", "PRSFX- Accelerock1.wav");

      scene.loadSe("PRSFX- Captivate", "battle_anims", "PRSFX- Captivate.wav");
      scene.loadSe("PRSFX- Attract2", "battle_anims", "PRSFX- Attract2.wav");
      scene.loadSe("PRSFX- Aurora Veil2", "battle_anims", "PRSFX- Aurora Veil2.wav");

      return true;
    })
    .withTitle(`${namespace}:title`)
    .withDescription(`${namespace}:description`)
    .withQuery(`${namespace}:query`)
    .withOption(MysteryEncounterOptionBuilder
      .newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
      .withDialogue({
        buttonLabel: `${namespace}:option.1.label`,
        buttonTooltip: `${namespace}:option.1.tooltip`,
        selected: [
          {
            text: `${namespace}:option.1.selected`
          }
        ]
      })
      .withPreOptionPhase(async (scene: BattleScene) => {
        const encounter = scene.currentBattle.mysteryEncounter!;

        const onPokemonSelected = (pokemon: PlayerPokemon) => {
          encounter.setDialogueToken("selectedPokemon", pokemon.getNameToRender());

          // Calculate the "baseline" stat value (90 base stat, 16 IVs, neutral nature, same level as pokemon) to compare
          // Resulting money is 2.5 * (% difference from baseline), with minimum of 1 and maximum of 4.
          // Calculation from Pokemon.calculateStats
          const baselineValue = Math.floor(((2 * 90 + 16) * pokemon.level) * 0.01) + 5;
          const percentDiff = (pokemon.getStat(Stat.SPD) - baselineValue) / baselineValue;
          const moneyMultiplier = Math.min(Math.max(2.5 * (1 + percentDiff), 1), 4);

          encounter.misc = {
            moneyMultiplier
          };

          // Reduce all PP to 2 (if they started at greater than 2)
          pokemon.moveset.forEach(move => {
            if (move) {
              const newPpUsed = move.getMovePp() - 2;
              move.ppUsed = move.ppUsed < newPpUsed ? newPpUsed : move.ppUsed;
            }
          });

          setEncounterExp(scene, pokemon.id, 100);

          // Hide intro visuals
          transitionMysteryEncounterIntroVisuals(scene, true, false);
          // Play sfx for "working"
          doDeliverySfx(scene);
        };

        // Only Pokemon non-KOd pokemon can be selected
        const selectableFilter = (pokemon: Pokemon) => {
          return isPokemonValidForEncounterOptionSelection(pokemon, scene, `${namespace}:invalid_selection`);
        };

        return selectPokemonForOption(scene, onPokemonSelected, undefined, selectableFilter);
      })
      .withOptionPhase(async (scene: BattleScene) => {
        // Pick Deliveries
        // Bring visuals back in
        await transitionMysteryEncounterIntroVisuals(scene, false, false);

        const moneyMultiplier = scene.currentBattle.mysteryEncounter!.misc.moneyMultiplier;

        // Give money and do dialogue
        if (moneyMultiplier > 2.5) {
          await showEncounterDialogue(scene, `${namespace}:job_complete_good`, `${namespace}:speaker`);
        } else {
          await showEncounterDialogue(scene, `${namespace}:job_complete_bad`, `${namespace}:speaker`);
        }
        const moneyChange = scene.getWaveMoneyAmount(moneyMultiplier);
        updatePlayerMoney(scene, moneyChange, true, false);
        await showEncounterText(scene, i18next.t("mysteryEncounterMessages:receive_money", { amount: moneyChange }));
        await showEncounterText(scene, `${namespace}:pokemon_tired`);

        setEncounterRewards(scene, { fillRemaining: true });
        leaveEncounterWithoutBattle(scene);
      })
      .build()
    )
    .withOption(MysteryEncounterOptionBuilder
      .newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
      .withDialogue({
        buttonLabel: `${namespace}:option.2.label`,
        buttonTooltip: `${namespace}:option.2.tooltip`,
        selected: [
          {
            text: `${namespace}:option.2.selected`
          }
        ]
      })
      .withPreOptionPhase(async (scene: BattleScene) => {
        const encounter = scene.currentBattle.mysteryEncounter!;

        const onPokemonSelected = (pokemon: PlayerPokemon) => {
          encounter.setDialogueToken("selectedPokemon", pokemon.getNameToRender());

          // Calculate the "baseline" stat value (75 base stat, 16 IVs, neutral nature, same level as pokemon) to compare
          // Resulting money is 2.5 * (% difference from baseline), with minimum of 1 and maximum of 4.
          // Calculation from Pokemon.calculateStats
          const baselineHp = Math.floor(((2 * 75 + 16) * pokemon.level) * 0.01) + pokemon.level + 10;
          const baselineAtkDef = Math.floor(((2 * 75 + 16) * pokemon.level) * 0.01) + 5;
          const baselineValue = baselineHp + 1.5 * (baselineAtkDef * 2);
          const strongestValue = pokemon.getStat(Stat.HP) + 1.5 * (pokemon.getStat(Stat.ATK) + pokemon.getStat(Stat.DEF));
          const percentDiff = (strongestValue - baselineValue) / baselineValue;
          const moneyMultiplier = Math.min(Math.max(2.5 * (1 + percentDiff), 1), 4);

          encounter.misc = {
            moneyMultiplier
          };

          // Reduce all PP to 2 (if they started at greater than 2)
          pokemon.moveset.forEach(move => {
            if (move) {
              const newPpUsed = move.getMovePp() - 2;
              move.ppUsed = move.ppUsed < newPpUsed ? newPpUsed : move.ppUsed;
            }
          });

          setEncounterExp(scene, pokemon.id, 100);

          // Hide intro visuals
          transitionMysteryEncounterIntroVisuals(scene, true, false);
          // Play sfx for "working"
          doStrongWorkSfx(scene);
        };

        // Only Pokemon non-KOd pokemon can be selected
        const selectableFilter = (pokemon: Pokemon) => {
          return isPokemonValidForEncounterOptionSelection(pokemon, scene, `${namespace}:invalid_selection`);
        };

        return selectPokemonForOption(scene, onPokemonSelected, undefined, selectableFilter);
      })
      .withOptionPhase(async (scene: BattleScene) => {
        // Pick Move Warehouse items
        // Bring visuals back in
        await transitionMysteryEncounterIntroVisuals(scene, false, false);

        const moneyMultiplier = scene.currentBattle.mysteryEncounter!.misc.moneyMultiplier;

        // Give money and do dialogue
        if (moneyMultiplier > 2.5) {
          await showEncounterDialogue(scene, `${namespace}:job_complete_good`, `${namespace}:speaker`);
        } else {
          await showEncounterDialogue(scene, `${namespace}:job_complete_bad`, `${namespace}:speaker`);
        }
        const moneyChange = scene.getWaveMoneyAmount(moneyMultiplier);
        updatePlayerMoney(scene, moneyChange, true, false);
        await showEncounterText(scene, i18next.t("mysteryEncounterMessages:receive_money", { amount: moneyChange }));
        await showEncounterText(scene, `${namespace}:pokemon_tired`);

        setEncounterRewards(scene, { fillRemaining: true });
        leaveEncounterWithoutBattle(scene);
      })
      .build()
    )
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_SPECIAL)
        .withPrimaryPokemonRequirement(new MoveRequirement(CHARMING_MOVES)) // Will set option3PrimaryName and option3PrimaryMove dialogue tokens automatically
        .withDialogue({
          buttonLabel: `${namespace}:option.3.label`,
          buttonTooltip: `${namespace}:option.3.tooltip`,
          disabledButtonTooltip: `${namespace}:option.3.disabled_tooltip`,
          selected: [
            {
              text: `${namespace}:option.3.selected`,
            },
          ],
        })
        .withPreOptionPhase(async (scene: BattleScene) => {
          const encounter = scene.currentBattle.mysteryEncounter!;
          const selectedPokemon = encounter.selectedOption?.primaryPokemon!;
          encounter.setDialogueToken("selectedPokemon", selectedPokemon.getNameToRender());

          // Reduce all PP to 2 (if they started at greater than 2)
          selectedPokemon.moveset.forEach(move => {
            if (move) {
              const newPpUsed = move.getMovePp() - 2;
              move.ppUsed = move.ppUsed < newPpUsed ? newPpUsed : move.ppUsed;
            }
          });

          setEncounterExp(scene, selectedPokemon.id, 100);

          // Hide intro visuals
          transitionMysteryEncounterIntroVisuals(scene, true, false);
          // Play sfx for "working"
          doSalesSfx(scene);
          return true;
        })
        .withOptionPhase(async (scene: BattleScene) => {
          // Assist with Sales
          // Bring visuals back in
          await transitionMysteryEncounterIntroVisuals(scene, false, false);

          // Give money and do dialogue
          await showEncounterDialogue(scene, `${namespace}:job_complete_good`, `${namespace}:speaker`);
          const moneyChange = scene.getWaveMoneyAmount(2.5);
          updatePlayerMoney(scene, moneyChange, true, false);
          await showEncounterText(scene, i18next.t("mysteryEncounterMessages:receive_money", { amount: moneyChange }));
          await showEncounterText(scene, `${namespace}:pokemon_tired`);

          setEncounterRewards(scene, { fillRemaining: true });
          leaveEncounterWithoutBattle(scene);
        })
        .build()
    )
    .withOutroDialogue([
      {
        speaker: `${namespace}:speaker`,
        text: `${namespace}:outro`,
      }
    ])
    .build();

function doStrongWorkSfx(scene: BattleScene) {
  scene.playSound("battle_anims/PRSFX- Horn Drill1");
  scene.playSound("battle_anims/PRSFX- Horn Drill1");

  scene.time.delayedCall(1000, () => {
    scene.playSound("battle_anims/PRSFX- Guillotine2");
  });

  scene.time.delayedCall(2000, () => {
    scene.playSound("battle_anims/PRSFX- Heavy Slam2");
  });

  scene.time.delayedCall(2500, () => {
    scene.playSound("battle_anims/PRSFX- Guillotine2");
  });
}

function doDeliverySfx(scene: BattleScene) {
  scene.playSound("battle_anims/PRSFX- Accelerock1");

  scene.time.delayedCall(1500, () => {
    scene.playSound("battle_anims/PRSFX- Extremespeed1");
  });

  scene.time.delayedCall(2000, () => {
    scene.playSound("battle_anims/PRSFX- Extremespeed1");
  });

  scene.time.delayedCall(2250, () => {
    scene.playSound("battle_anims/PRSFX- Agility");
  });
}

function doSalesSfx(scene: BattleScene) {
  scene.playSound("battle_anims/PRSFX- Captivate");

  scene.time.delayedCall(1500, () => {
    scene.playSound("battle_anims/PRSFX- Attract2");
  });

  scene.time.delayedCall(2000, () => {
    scene.playSound("battle_anims/PRSFX- Aurora Veil2");
  });

  scene.time.delayedCall(3000, () => {
    scene.playSound("battle_anims/PRSFX- Attract2");
  });
}
