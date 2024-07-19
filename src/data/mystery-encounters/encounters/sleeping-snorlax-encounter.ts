import { STEALING_MOVES } from "#app/data/mystery-encounters/requirements/requirement-groups";
import { modifierTypes } from "#app/modifier/modifier-type";
import { BerryType } from "#enums/berry-type";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { Species } from "#enums/species";
import BattleScene from "../../../battle-scene";
import * as Utils from "../../../utils";
import { getPokemonSpecies } from "../../pokemon-species";
import { Status, StatusEffect } from "../../status-effect";
import IMysteryEncounter, { MysteryEncounterBuilder, MysteryEncounterTier, } from "../mystery-encounter";
import { EncounterOptionMode, MysteryEncounterOptionBuilder } from "../mystery-encounter-option";
import { MoveRequirement } from "../mystery-encounter-requirements";
import { EnemyPartyConfig, EnemyPokemonConfig, generateModifierTypeOption, initBattleWithEnemyConfig, leaveEncounterWithoutBattle, setEncounterExp, setEncounterRewards, } from "../utils/encounter-phase-utils";
import { queueEncounterMessage } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";

/** i18n namespace for the encounter */
const namespace = "mysteryEncounter:sleeping_snorlax";

export const SleepingSnorlaxEncounter: IMysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(
    MysteryEncounterType.SLEEPING_SNORLAX
  )
    .withEncounterTier(MysteryEncounterTier.ULTRA)
    .withSceneWaveRangeRequirement(10, 180) // waves 10 to 180
    .withCatchAllowed(true)
    .withHideWildIntroMessage(true)
    .withIntroSpriteConfigs([
      {
        spriteKey: Species.SNORLAX.toString(),
        fileRoot: "pokemon",
        hasShadow: true,
        tint: 0.25,
        scale: 1.5,
        repeat: true,
        y: 5,
      },
    ])
    .withIntroDialogue([
      {
        text: `${namespace}_intro_message`,
      },
    ])
    .withOnInit((scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter;
      console.log(encounter);

      // Calculate boss mon
      const bossSpecies = getPokemonSpecies(Species.SNORLAX);
      const pokemonConfig: EnemyPokemonConfig = {
        species: bossSpecies,
        isBoss: true,
        status: StatusEffect.SLEEP,
        spriteScale: 1.5
      };
      const config: EnemyPartyConfig = {
        levelAdditiveMultiplier: 2,
        pokemonConfigs: [pokemonConfig],
      };
      encounter.enemyPartyConfigs = [config];
      return true;
    })
    .withTitle(`${namespace}_title`)
    .withDescription(`${namespace}_description`)
    .withQuery(`${namespace}_query`)
    .withSimpleOption(
      {
        buttonLabel: `${namespace}_option_1_label`,
        buttonTooltip: `${namespace}_option_1_tooltip`,
        selected: [
          {
            text: `${namespace}_option_1_selected_message`,
          },
        ],
      },
      async (scene: BattleScene) => {
        // Pick battle
        // TODO: do we want special rewards for this?
        // setCustomEncounterRewards(scene, { guaranteedModifierTypeFuncs: [modifierTypes.LEFTOVERS], fillRemaining: true});
        await initBattleWithEnemyConfig(
          scene,
          scene.currentBattle.mysteryEncounter.enemyPartyConfigs[0]
        );
      }
    )
    .withSimpleOption(
      {
        buttonLabel: `${namespace}_option_2_label`,
        buttonTooltip: `${namespace}_option_2_tooltip`,
        selected: [
          {
            text: `${namespace}_option_2_selected_message`,
          },
        ],
      },
      async (scene: BattleScene) => {
        const instance = scene.currentBattle.mysteryEncounter;
        let roll: integer;
        scene.executeWithSeedOffset(() => {
          roll = Utils.randSeedInt(16, 0);
        }, scene.currentBattle.waveIndex);

        // Half Snorlax exp to entire party
        setEncounterExp(
          scene,
          scene.getParty().map((p) => p.id),
          98
        );

        if (roll > 4) {
          // Fall asleep and get a sitrus berry (75%)
          const p = instance.primaryPokemon;
          p.status = new Status(StatusEffect.SLEEP, 0, 3);
          p.updateInfo(true);
          // const sitrus = (modifierTypes.BERRY?.() as ModifierTypeGenerator).generateType(scene.getParty(), [BerryType.SITRUS]);
          const sitrus = generateModifierTypeOption(
            scene,
            modifierTypes.BERRY,
            [BerryType.SITRUS]
          );

          setEncounterRewards(scene, {
            guaranteedModifierTypeOptions: [sitrus],
            fillRemaining: false,
          });
          queueEncounterMessage(scene, `${namespace}_option_2_bad_result`);
          leaveEncounterWithoutBattle(scene);
        } else {
          // Heal to full (25%)
          for (const pokemon of scene.getParty()) {
            pokemon.hp = pokemon.getMaxHp();
            pokemon.resetStatus();
            for (const move of pokemon.moveset) {
              move.ppUsed = 0;
            }
            pokemon.updateInfo(true);
          }

          queueEncounterMessage(scene, `${namespace}_option_2_good_result`);
          leaveEncounterWithoutBattle(scene);
        }
      }
    )
    .withOption(
      new MysteryEncounterOptionBuilder()
        .withOptionMode(EncounterOptionMode.DISABLED_OR_SPECIAL)
        .withPrimaryPokemonRequirement(new MoveRequirement(STEALING_MOVES))
        .withDialogue({
          buttonLabel: `${namespace}_option_3_label`,
          buttonTooltip: `${namespace}_option_3_tooltip`,
          disabledButtonTooltip: `${namespace}_option_3_disabled_tooltip`,
        })
        .withOptionPhase(async (scene: BattleScene) => {
          // Steal the Snorlax's Leftovers
          const instance = scene.currentBattle.mysteryEncounter;
          setEncounterRewards(scene, {
            guaranteedModifierTypeFuncs: [modifierTypes.LEFTOVERS],
            fillRemaining: false,
          });
          queueEncounterMessage(scene, `${namespace}_option_3_good_result`);
          // Snorlax exp to Pokemon that did the stealing
          setEncounterExp(scene, [instance.primaryPokemon.id], 189);
          leaveEncounterWithoutBattle(scene);
        })
        .build()
    )
    .build();
