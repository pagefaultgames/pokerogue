import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/constants";
import { globalScene } from "#app/global-scene";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { Stat } from "#enums/stat";
import type { PlayerPokemon, Pokemon } from "#field/pokemon";
import { showEncounterDialogue, showEncounterText } from "#mystery-encounters/encounter-dialogue-utils";
import {
  leaveEncounterWithoutBattle,
  selectPokemonForOption,
  setEncounterExp,
  setEncounterRewards,
  transitionMysteryEncounterIntroVisuals,
  updatePlayerMoney,
} from "#mystery-encounters/encounter-phase-utils";
import { isPokemonValidForEncounterOptionSelection } from "#mystery-encounters/encounter-pokemon-utils";
import type { MysteryEncounter } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterBuilder } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterOptionBuilder } from "#mystery-encounters/mystery-encounter-option";
import { MoveRequirement } from "#mystery-encounters/mystery-encounter-requirements";
import { CHARMING_MOVES } from "#mystery-encounters/requirement-groups";
import i18next from "i18next";

/** the i18n namespace for the encounter */
const namespace = "mysteryEncounters/partTimer";

/**
 * Part Timer encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3813 | GitHub Issue #3813}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const PartTimerEncounter: MysteryEncounter = MysteryEncounterBuilder.withEncounterType(
  MysteryEncounterType.PART_TIMER,
)
  .withEncounterTier(MysteryEncounterTier.COMMON)
  .withSceneWaveRangeRequirement(...CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES)
  .withIntroSpriteConfigs([
    {
      spriteKey: "part_timer_crate",
      fileRoot: "mystery-encounters",
      hasShadow: false,
      y: 6,
      x: 15,
    },
    {
      spriteKey: "worker_f",
      fileRoot: "trainer",
      hasShadow: true,
      x: -18,
      y: 4,
    },
  ])
  .withAutoHideIntroVisuals(false)
  .withIntroDialogue([
    {
      text: `${namespace}:intro`,
    },
    {
      speaker: `${namespace}:speaker`,
      text: `${namespace}:introDialogue`,
    },
  ])
  .withOnInit(() => {
    // Load sfx
    globalScene.loadSe("PRSFX- Horn Drill1", "battle_anims", "PRSFX- Horn Drill1.wav");
    globalScene.loadSe("PRSFX- Horn Drill3", "battle_anims", "PRSFX- Horn Drill3.wav");
    globalScene.loadSe("PRSFX- Guillotine2", "battle_anims", "PRSFX- Guillotine2.wav");
    globalScene.loadSe("PRSFX- Heavy Slam2", "battle_anims", "PRSFX- Heavy Slam2.wav");

    globalScene.loadSe("PRSFX- Agility", "battle_anims", "PRSFX- Agility.wav");
    globalScene.loadSe("PRSFX- Extremespeed1", "battle_anims", "PRSFX- Extremespeed1.wav");
    globalScene.loadSe("PRSFX- Accelerock1", "battle_anims", "PRSFX- Accelerock1.wav");

    globalScene.loadSe("PRSFX- Captivate", "battle_anims", "PRSFX- Captivate.wav");
    globalScene.loadSe("PRSFX- Attract2", "battle_anims", "PRSFX- Attract2.wav");
    globalScene.loadSe("PRSFX- Aurora Veil2", "battle_anims", "PRSFX- Aurora Veil2.wav");

    return true;
  })
  .setLocalizationKey(`${namespace}`)
  .withTitle(`${namespace}:title`)
  .withDescription(`${namespace}:description`)
  .withQuery(`${namespace}:query`)
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
      .withDialogue({
        buttonLabel: `${namespace}:option.1.label`,
        buttonTooltip: `${namespace}:option.1.tooltip`,
        selected: [
          {
            text: `${namespace}:option.1.selected`,
          },
        ],
      })
      .withPreOptionPhase(async () => {
        const encounter = globalScene.currentBattle.mysteryEncounter!;

        const onPokemonSelected = (pokemon: PlayerPokemon) => {
          encounter.setDialogueToken("selectedPokemon", pokemon.getNameToRender());

          // Calculate the "baseline" stat value (90 base stat, 16 IVs, neutral nature, same level as pokemon) to compare
          // Resulting money is 2.5 * (% difference from baseline), with minimum of 1 and maximum of 4.
          // Calculation from Pokemon.calculateStats
          const baselineValue = Math.floor((2 * 90 + 16) * pokemon.level * 0.01) + 5;
          const percentDiff = (pokemon.getStat(Stat.SPD) - baselineValue) / baselineValue;
          const moneyMultiplier = Math.min(Math.max(2.5 * (1 + percentDiff), 1), 4);

          encounter.misc = {
            moneyMultiplier,
          };

          // Reduce all PP to 2 (if they started at greater than 2)
          for (const move of pokemon.moveset) {
            if (move) {
              const newPpUsed = move.getMovePp() - 2;
              move.ppUsed = move.ppUsed < newPpUsed ? newPpUsed : move.ppUsed;
            }
          }

          setEncounterExp(pokemon.id, 100);

          // Hide intro visuals
          transitionMysteryEncounterIntroVisuals(true, false);
          // Play sfx for "working"
          doDeliverySfx();
        };

        // Only Pokemon non-KOd pokemon can be selected
        const selectableFilter = (pokemon: Pokemon) => {
          return isPokemonValidForEncounterOptionSelection(pokemon, `${namespace}:invalidSelection`);
        };

        return selectPokemonForOption(onPokemonSelected, undefined, selectableFilter);
      })
      .withOptionPhase(async () => {
        // Pick Deliveries
        // Bring visuals back in
        await transitionMysteryEncounterIntroVisuals(false, false);

        const moneyMultiplier = globalScene.currentBattle.mysteryEncounter!.misc.moneyMultiplier;

        // Give money and do dialogue
        if (moneyMultiplier > 2.5) {
          await showEncounterDialogue(`${namespace}:jobCompleteGood`, `${namespace}:speaker`);
        } else {
          await showEncounterDialogue(`${namespace}:jobCompleteBad`, `${namespace}:speaker`);
        }
        const moneyChange = globalScene.getWaveMoneyAmount(moneyMultiplier);
        updatePlayerMoney(moneyChange, true, false);
        await showEncounterText(
          i18next.t("mysteryEncounterMessages:receiveMoney", {
            amount: moneyChange,
          }),
        );
        await showEncounterText(`${namespace}:pokemonTired`);

        setEncounterRewards({ fillRemaining: true });
        leaveEncounterWithoutBattle();
      })
      .build(),
  )
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
      .withDialogue({
        buttonLabel: `${namespace}:option.2.label`,
        buttonTooltip: `${namespace}:option.2.tooltip`,
        selected: [
          {
            text: `${namespace}:option.2.selected`,
          },
        ],
      })
      .withPreOptionPhase(async () => {
        const encounter = globalScene.currentBattle.mysteryEncounter!;

        const onPokemonSelected = (pokemon: PlayerPokemon) => {
          encounter.setDialogueToken("selectedPokemon", pokemon.getNameToRender());

          // Calculate the "baseline" stat value (75 base stat, 16 IVs, neutral nature, same level as pokemon) to compare
          // Resulting money is 2.5 * (% difference from baseline), with minimum of 1 and maximum of 4.
          // Calculation from Pokemon.calculateStats
          const baselineHp = Math.floor((2 * 75 + 16) * pokemon.level * 0.01) + pokemon.level + 10;
          const baselineAtkDef = Math.floor((2 * 75 + 16) * pokemon.level * 0.01) + 5;
          const baselineValue = baselineHp + 1.5 * (baselineAtkDef * 2);
          const strongestValue =
            pokemon.getStat(Stat.HP) + 1.5 * (pokemon.getStat(Stat.ATK) + pokemon.getStat(Stat.DEF));
          const percentDiff = (strongestValue - baselineValue) / baselineValue;
          const moneyMultiplier = Math.min(Math.max(2.5 * (1 + percentDiff), 1), 4);

          encounter.misc = {
            moneyMultiplier,
          };

          // Reduce all PP to 2 (if they started at greater than 2)
          for (const move of pokemon.moveset) {
            if (move) {
              const newPpUsed = move.getMovePp() - 2;
              move.ppUsed = move.ppUsed < newPpUsed ? newPpUsed : move.ppUsed;
            }
          }

          setEncounterExp(pokemon.id, 100);

          // Hide intro visuals
          transitionMysteryEncounterIntroVisuals(true, false);
          // Play sfx for "working"
          doStrongWorkSfx();
        };

        // Only Pokemon non-KOd pokemon can be selected
        const selectableFilter = (pokemon: Pokemon) => {
          return isPokemonValidForEncounterOptionSelection(pokemon, `${namespace}:invalidSelection`);
        };

        return selectPokemonForOption(onPokemonSelected, undefined, selectableFilter);
      })
      .withOptionPhase(async () => {
        // Pick Move Warehouse items
        // Bring visuals back in
        await transitionMysteryEncounterIntroVisuals(false, false);

        const moneyMultiplier = globalScene.currentBattle.mysteryEncounter!.misc.moneyMultiplier;

        // Give money and do dialogue
        if (moneyMultiplier > 2.5) {
          await showEncounterDialogue(`${namespace}:jobCompleteGood`, `${namespace}:speaker`);
        } else {
          await showEncounterDialogue(`${namespace}:jobCompleteBad`, `${namespace}:speaker`);
        }
        const moneyChange = globalScene.getWaveMoneyAmount(moneyMultiplier);
        updatePlayerMoney(moneyChange, true, false);
        await showEncounterText(
          i18next.t("mysteryEncounterMessages:receiveMoney", {
            amount: moneyChange,
          }),
        );
        await showEncounterText(`${namespace}:pokemonTired`);

        setEncounterRewards({ fillRemaining: true });
        leaveEncounterWithoutBattle();
      })
      .build(),
  )
  .withOption(
    MysteryEncounterOptionBuilder.newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_SPECIAL)
      .withPrimaryPokemonRequirement(new MoveRequirement(CHARMING_MOVES, true)) // Will set option3PrimaryName and option3PrimaryMove dialogue tokens automatically
      .withDialogue({
        buttonLabel: `${namespace}:option.3.label`,
        buttonTooltip: `${namespace}:option.3.tooltip`,
        disabledButtonTooltip: `${namespace}:option.3.disabledTooltip`,
        selected: [
          {
            text: `${namespace}:option.3.selected`,
          },
        ],
      })
      .withPreOptionPhase(async () => {
        const encounter = globalScene.currentBattle.mysteryEncounter!;
        const selectedPokemon = encounter.selectedOption?.primaryPokemon!;
        encounter.setDialogueToken("selectedPokemon", selectedPokemon.getNameToRender());

        // Reduce all PP to 2 (if they started at greater than 2)
        for (const move of selectedPokemon.moveset) {
          if (move) {
            const newPpUsed = move.getMovePp() - 2;
            move.ppUsed = move.ppUsed < newPpUsed ? newPpUsed : move.ppUsed;
          }
        }

        setEncounterExp(selectedPokemon.id, 100);

        // Hide intro visuals
        transitionMysteryEncounterIntroVisuals(true, false);
        // Play sfx for "working"
        doSalesSfx();
        return true;
      })
      .withOptionPhase(async () => {
        // Assist with Sales
        // Bring visuals back in
        await transitionMysteryEncounterIntroVisuals(false, false);

        // Give money and do dialogue
        await showEncounterDialogue(`${namespace}:jobCompleteGood`, `${namespace}:speaker`);
        const moneyChange = globalScene.getWaveMoneyAmount(2.5);
        updatePlayerMoney(moneyChange, true, false);
        await showEncounterText(
          i18next.t("mysteryEncounterMessages:receiveMoney", {
            amount: moneyChange,
          }),
        );
        await showEncounterText(`${namespace}:pokemonTired`);

        setEncounterRewards({ fillRemaining: true });
        leaveEncounterWithoutBattle();
      })
      .build(),
  )
  .withOutroDialogue([
    {
      speaker: `${namespace}:speaker`,
      text: `${namespace}:outro`,
    },
  ])
  .build();

function doStrongWorkSfx() {
  globalScene.playSound("battle_anims/PRSFX- Horn Drill1");
  globalScene.playSound("battle_anims/PRSFX- Horn Drill1");

  globalScene.time.delayedCall(1000, () => {
    globalScene.playSound("battle_anims/PRSFX- Guillotine2");
  });

  globalScene.time.delayedCall(2000, () => {
    globalScene.playSound("battle_anims/PRSFX- Heavy Slam2");
  });

  globalScene.time.delayedCall(2500, () => {
    globalScene.playSound("battle_anims/PRSFX- Guillotine2");
  });
}

function doDeliverySfx() {
  globalScene.playSound("battle_anims/PRSFX- Accelerock1");

  globalScene.time.delayedCall(1500, () => {
    globalScene.playSound("battle_anims/PRSFX- Extremespeed1");
  });

  globalScene.time.delayedCall(2000, () => {
    globalScene.playSound("battle_anims/PRSFX- Extremespeed1");
  });

  globalScene.time.delayedCall(2250, () => {
    globalScene.playSound("battle_anims/PRSFX- Agility");
  });
}

function doSalesSfx() {
  globalScene.playSound("battle_anims/PRSFX- Captivate");

  globalScene.time.delayedCall(1500, () => {
    globalScene.playSound("battle_anims/PRSFX- Attract2");
  });

  globalScene.time.delayedCall(2000, () => {
    globalScene.playSound("battle_anims/PRSFX- Aurora Veil2");
  });

  globalScene.time.delayedCall(3000, () => {
    globalScene.playSound("battle_anims/PRSFX- Attract2");
  });
}
