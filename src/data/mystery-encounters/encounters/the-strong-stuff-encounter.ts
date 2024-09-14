import { EnemyPartyConfig, initBattleWithEnemyConfig, loadCustomMovesForEncounter, leaveEncounterWithoutBattle, setEncounterRewards, transitionMysteryEncounterIntroVisuals, generateModifierType } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { modifierTypes, PokemonHeldItemModifierType, } from "#app/modifier/modifier-type";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import BattleScene from "#app/battle-scene";
import MysteryEncounter, { MysteryEncounterBuilder } from "../mystery-encounter";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import { Species } from "#enums/species";
import { Nature } from "#app/data/nature";
import Pokemon, { PokemonMove } from "#app/field/pokemon";
import { queueEncounterMessage, showEncounterText } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import { modifyPlayerPokemonBST } from "#app/data/mystery-encounters/utils/encounter-pokemon-utils";
import { Moves } from "#enums/moves";
import { BattlerIndex } from "#app/battle";
import { BattlerTagType } from "#enums/battler-tag-type";
import { BerryType } from "#enums/berry-type";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterPokemonData } from "#app/data/mystery-encounters/mystery-encounter-pokemon-data";
import { Stat } from "#enums/stat";
import { StatStageChangePhase } from "#app/phases/stat-stage-change-phase";
import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/game-mode";

/** the i18n namespace for the encounter */
const namespace = "mysteryEncounter:theStrongStuff";

// Halved for HP stat
const HIGH_BST_REDUCTION_VALUE = 15;
const BST_INCREASE_VALUE = 10;

/**
 * The Strong Stuff encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3803 | GitHub Issue #3803}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const TheStrongStuffEncounter: MysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(MysteryEncounterType.THE_STRONG_STUFF)
    .withEncounterTier(MysteryEncounterTier.GREAT)
    .withSceneWaveRangeRequirement(...CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES)
    .withScenePartySizeRequirement(3, 6) // Must have at least 3 pokemon in party
    .withHideWildIntroMessage(true)
    .withAutoHideIntroVisuals(false)
    .withIntroSpriteConfigs([
      {
        spriteKey: "berry_juice",
        fileRoot: "items",
        hasShadow: true,
        isItem: true,
        scale: 1.25,
        x: -15,
        y: 3,
        disableAnimation: true
      },
      {
        spriteKey: Species.SHUCKLE.toString(),
        fileRoot: "pokemon",
        hasShadow: true,
        repeat: true,
        scale: 1.25,
        x: 20,
        y: 10,
        yShadow: 7
      },
    ]) // Set in onInit()
    .withIntroDialogue([
      {
        text: `${namespace}.intro`,
      },
    ])
    .withOnInit((scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter!;

      // Calculate boss mon
      const config: EnemyPartyConfig = {
        levelAdditiveMultiplier: 1,
        disableSwitch: true,
        pokemonConfigs: [
          {
            species: getPokemonSpecies(Species.SHUCKLE),
            isBoss: true,
            bossSegments: 5,
            mysteryEncounterPokemonData: new MysteryEncounterPokemonData({ spriteScale: 1.25 }),
            nature: Nature.BOLD,
            moveSet: [Moves.INFESTATION, Moves.SALT_CURE, Moves.GASTRO_ACID, Moves.HEAL_ORDER],
            modifierConfigs: [
              {
                modifier: generateModifierType(scene, modifierTypes.BERRY, [BerryType.SITRUS]) as PokemonHeldItemModifierType
              },
              {
                modifier: generateModifierType(scene, modifierTypes.BERRY, [BerryType.ENIGMA]) as PokemonHeldItemModifierType
              },
              {
                modifier: generateModifierType(scene, modifierTypes.BERRY, [BerryType.APICOT]) as PokemonHeldItemModifierType
              },
              {
                modifier: generateModifierType(scene, modifierTypes.BERRY, [BerryType.GANLON]) as PokemonHeldItemModifierType
              },
              {
                modifier: generateModifierType(scene, modifierTypes.BERRY, [BerryType.LUM]) as PokemonHeldItemModifierType,
                stackCount: 2
              }
            ],
            tags: [BattlerTagType.MYSTERY_ENCOUNTER_POST_SUMMON],
            mysteryEncounterBattleEffects: (pokemon: Pokemon) => {
              queueEncounterMessage(pokemon.scene, `${namespace}.option.2.stat_boost`);
              pokemon.scene.unshiftPhase(new StatStageChangePhase(pokemon.scene, pokemon.getBattlerIndex(), true, [Stat.DEF, Stat.SPDEF], 2));
            }
          }
        ],
      };

      encounter.enemyPartyConfigs = [config];

      loadCustomMovesForEncounter(scene, [Moves.GASTRO_ACID, Moves.STEALTH_ROCK]);

      encounter.setDialogueToken("shuckleName", getPokemonSpecies(Species.SHUCKLE).getName());

      return true;
    })
    .withTitle(`${namespace}.title`)
    .withDescription(`${namespace}.description`)
    .withQuery(`${namespace}.query`)
    .withSimpleOption(
      {
        buttonLabel: `${namespace}.option.1.label`,
        buttonTooltip: `${namespace}.option.1.tooltip`,
        selected: [
          {
            text: `${namespace}.option.1.selected`
          }
        ]
      },
      async (scene: BattleScene) => {
        const encounter = scene.currentBattle.mysteryEncounter!;
        // Do blackout and hide intro visuals during blackout
        scene.time.delayedCall(750, () => {
          transitionMysteryEncounterIntroVisuals(scene, true, true, 50);
        });

        // -15 to all base stats of highest BST (halved for HP), +10 to all base stats of rest of party (halved for HP)
        // Sort party by bst
        const sortedParty = scene.getParty().slice(0)
          .sort((pokemon1, pokemon2) => {
            const pokemon1Bst = pokemon1.calculateBaseStats().reduce((a, b) => a + b, 0);
            const pokemon2Bst = pokemon2.calculateBaseStats().reduce((a, b) => a + b, 0);
            return pokemon2Bst - pokemon1Bst;
          });

        sortedParty.forEach((pokemon, index) => {
          if (index < 2) {
            // -15 to the two highest BST mons
            modifyPlayerPokemonBST(pokemon, -HIGH_BST_REDUCTION_VALUE);
            encounter.setDialogueToken("highBstPokemon" + (index + 1), pokemon.getNameToRender());
          } else {
            // +10 for the rest
            modifyPlayerPokemonBST(pokemon, BST_INCREASE_VALUE);
          }
        });

        encounter.setDialogueToken("reductionValue", HIGH_BST_REDUCTION_VALUE.toString());
        encounter.setDialogueToken("increaseValue", BST_INCREASE_VALUE.toString());
        await showEncounterText(scene, `${namespace}.option.1.selected_2`, null, undefined, true);

        setEncounterRewards(scene, { fillRemaining: true });
        leaveEncounterWithoutBattle(scene, true);
        return true;
      }
    )
    .withSimpleOption(
      {
        buttonLabel: `${namespace}.option.2.label`,
        buttonTooltip: `${namespace}.option.2.tooltip`,
        selected: [
          {
            text: `${namespace}.option.2.selected`,
          },
        ],
      },
      async (scene: BattleScene) => {
        // Pick battle
        const encounter = scene.currentBattle.mysteryEncounter!;
        setEncounterRewards(scene, { guaranteedModifierTypeFuncs: [modifierTypes.SOUL_DEW], fillRemaining: true });
        encounter.startOfBattleEffects.push(
          {
            sourceBattlerIndex: BattlerIndex.ENEMY,
            targets: [BattlerIndex.PLAYER],
            move: new PokemonMove(Moves.GASTRO_ACID),
            ignorePp: true
          },
          {
            sourceBattlerIndex: BattlerIndex.ENEMY,
            targets: [BattlerIndex.PLAYER],
            move: new PokemonMove(Moves.STEALTH_ROCK),
            ignorePp: true
          });

        transitionMysteryEncounterIntroVisuals(scene, true, true, 500);
        await initBattleWithEnemyConfig(scene, encounter.enemyPartyConfigs[0]);
      }
    )
    .build();
