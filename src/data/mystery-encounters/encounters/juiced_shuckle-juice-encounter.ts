import { EnemyPartyConfig, initBattleWithEnemyConfig, leaveEncounterWithoutBattle, setEncounterRewards } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { modifierTypes, } from "#app/modifier/modifier-type";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import BattleScene from "../../../battle-scene";
import IMysteryEncounter, { MysteryEncounterBuilder, MysteryEncounterTier, } from "../mystery-encounter";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import { Species } from "#enums/species";
import { Nature } from "#app/data/nature";

/** the i18n namespace for the encounter */
const namespace = "mysteryEncounter:oneForAll";

export const JuicedShuckleJuiceEncounter: IMysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(
    MysteryEncounterType.JUICED_SHUCKLE_JUICE
  )
    .withEncounterTier(MysteryEncounterTier.COMMON)
    .withSceneWaveRangeRequirement(10, 180) // waves 10 to 180
    .withHideWildIntroMessage(true)
    .withIntroSpriteConfigs([
      {
        spriteKey: Species.SHUCKLE.toString(),
        fileRoot: "pokemon",
        hasShadow: true,
        repeat: true,
        scale: 2
      },
      {
        spriteKey: "berry_juice",
        fileRoot: "mystery-encounters",
        hasShadow: true,
        scale: 2
      },
    ]) // Set in onInit()
    .withIntroDialogue([
      {
        text: `${namespace}_intro_message`,
      },
    ])
    .withOnInit((scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter;

      // Calculate boss mon
      const config: EnemyPartyConfig = {
        levelAdditiveMultiplier: 1,
        pokemonConfigs: [
          {
            species: getPokemonSpecies(Species.SHUCKLE),
            isBoss: true,
            bossSegments: 5,
            spriteScale: 2,
            nature: Nature.BOLD,
            // moves: [Moves.INFESTATION, Moves.SALT_CURE, Moves.STEALTH_ROCK, Moves.RECOVER]
          }
        ],
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
            text: `${namespace}_option_1_selected`,
          },
        ],
      },
      async (scene: BattleScene) => {
        // Leave encounter with no rewards or exp
        // const encounter = scene.currentBattle.mysteryEncounter;

        // Get highest BST mon
        const party = scene.getParty();
        let highestBst = null;
        let statTotal = 0;
        for (const pokemon of party) {
          if (!highestBst) {
            highestBst = pokemon;
            statTotal = pokemon.summonData.stats.reduce((i, n) => n + i);
            continue;
          }

          const total = pokemon.summonData.stats.reduce((i, n) => n + i);
          if (total > statTotal) {
            highestBst = pokemon;
            statTotal = total;
          }
        }

        if (!highestBst) {
          highestBst = party[0];
        }



        leaveEncounterWithoutBattle(scene, true);
        return true;
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
        // Pick battle
        setEncounterRewards(scene, { guaranteedModifierTypeFuncs: [modifierTypes.SOUL_DEW], fillRemaining: true });
        await initBattleWithEnemyConfig(scene, scene.currentBattle.mysteryEncounter.enemyPartyConfigs[0]);
      }
    )
    .build();
