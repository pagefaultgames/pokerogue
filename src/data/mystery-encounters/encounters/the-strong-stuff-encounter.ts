import { EnemyPartyConfig, generateModifierTypeOption, initBattleWithEnemyConfig, initCustomMovesForEncounter, leaveEncounterWithoutBattle, setEncounterRewards, transitionMysteryEncounterIntroVisuals } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { modifierTypes, PokemonHeldItemModifierType, } from "#app/modifier/modifier-type";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import BattleScene from "../../../battle-scene";
import IMysteryEncounter, { MysteryEncounterBuilder, MysteryEncounterTier, } from "../mystery-encounter";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import { Species } from "#enums/species";
import { Nature } from "#app/data/nature";
import Pokemon, { PlayerPokemon, PokemonMove } from "#app/field/pokemon";
import { queueEncounterMessage, showEncounterText } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import { modifyPlayerPokemonBST } from "#app/data/mystery-encounters/utils/encounter-pokemon-utils";
import { Moves } from "#enums/moves";
import { BattlerIndex } from "#app/battle";
import { StatChangePhase } from "#app/phases";
import { BattleStat } from "#app/data/battle-stat";
import { BattlerTagType } from "#enums/battler-tag-type";
import { BerryType } from "#enums/berry-type";

/** the i18n namespace for the encounter */
const namespace = "mysteryEncounter:theStrongStuff";

/**
 * The Strong Stuff encounter.
 * @see {@link https://github.com/AsdarDevelops/PokeRogue-Events/issues/54 | GitHub Issue #54}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const TheStrongStuffEncounter: IMysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(MysteryEncounterType.THE_STRONG_STUFF)
    .withEncounterTier(MysteryEncounterTier.COMMON)
    .withSceneWaveRangeRequirement(10, 180) // waves 10 to 180
    .withHideWildIntroMessage(true)
    .withAutoHideIntroVisuals(false)
    .withIntroSpriteConfigs([
      {
        spriteKey: "berry_juice",
        fileRoot: "items",
        hasShadow: true,
        isItem: true,
        scale: 1.5,
        x: -15,
        y: 3,
        disableAnimation: true
      },
      {
        spriteKey: Species.SHUCKLE.toString(),
        fileRoot: "pokemon",
        hasShadow: true,
        repeat: true,
        scale: 1.5,
        x: 20,
        y: 10,
        yShadow: 7
      },
    ]) // Set in onInit()
    .withIntroDialogue([
      {
        text: `${namespace}:intro`,
      },
    ])
    .withOnInit((scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter;

      // Calculate boss mon
      const config: EnemyPartyConfig = {
        levelAdditiveMultiplier: 1,
        disableSwitch: true,
        pokemonConfigs: [
          {
            species: getPokemonSpecies(Species.SHUCKLE),
            isBoss: true,
            bossSegments: 5,
            spriteScale: 1.5,
            nature: Nature.BOLD,
            moveSet: [Moves.INFESTATION, Moves.SALT_CURE, Moves.GASTRO_ACID, Moves.HEAL_ORDER],
            modifierTypes: [
              generateModifierTypeOption(scene, modifierTypes.BERRY, [BerryType.SITRUS]).type as PokemonHeldItemModifierType,
              generateModifierTypeOption(scene, modifierTypes.BERRY, [BerryType.APICOT]).type as PokemonHeldItemModifierType,
              generateModifierTypeOption(scene, modifierTypes.BERRY, [BerryType.GANLON]).type as PokemonHeldItemModifierType,
              generateModifierTypeOption(scene, modifierTypes.BERRY, [BerryType.LUM]).type as PokemonHeldItemModifierType,
              generateModifierTypeOption(scene, modifierTypes.BERRY, [BerryType.LUM]).type as PokemonHeldItemModifierType
            ],
            tags: [BattlerTagType.MYSTERY_ENCOUNTER_POST_SUMMON],
            mysteryEncounterBattleEffects: (pokemon: Pokemon) => {
              queueEncounterMessage(pokemon.scene, `${namespace}:option:2:stat_boost`);
              pokemon.scene.unshiftPhase(new StatChangePhase(pokemon.scene, pokemon.getBattlerIndex(), true, [BattleStat.DEF, BattleStat.SPDEF], 2));
            }
          }
        ],
      };

      encounter.enemyPartyConfigs = [config];

      initCustomMovesForEncounter(scene, [Moves.GASTRO_ACID, Moves.STEALTH_ROCK]);

      return true;
    })
    .withTitle(`${namespace}:title`)
    .withDescription(`${namespace}:description`)
    .withQuery(`${namespace}:query`)
    .withSimpleOption(
      {
        buttonLabel: `${namespace}:option:1:label`,
        buttonTooltip: `${namespace}:option:1:tooltip`,
        selected: [
          {
            text: `${namespace}:option:1:selected`
          }
        ]
      },
      async (scene: BattleScene) => {
        const encounter = scene.currentBattle.mysteryEncounter;
        // Do blackout and hide intro visuals during blackout
        scene.time.delayedCall(750, () => {
          transitionMysteryEncounterIntroVisuals(scene, true, true, 50);
        });

        // -20 to all base stats of highest BST, +10 to all base stats of rest of party
        // Get highest BST mon
        const party = scene.getParty();
        let highestBst: PlayerPokemon = null;
        let statTotal = 0;
        for (const pokemon of party) {
          if (!highestBst) {
            highestBst = pokemon;
            statTotal = pokemon.getSpeciesForm().getBaseStatTotal();
            continue;
          }

          const total = pokemon.getSpeciesForm().getBaseStatTotal();
          if (total > statTotal) {
            highestBst = pokemon;
            statTotal = total;
          }
        }

        if (!highestBst) {
          highestBst = party[0];
        }

        modifyPlayerPokemonBST(highestBst, -20);
        for (const pokemon of party) {
          if (highestBst.id === pokemon.id) {
            continue;
          }

          modifyPlayerPokemonBST(pokemon, 10);
        }

        encounter.setDialogueToken("highBstPokemon", highestBst.name);
        await showEncounterText(scene, `${namespace}:option:1:selected_2`, null, true);

        setEncounterRewards(scene, { fillRemaining: true });
        leaveEncounterWithoutBattle(scene, true);
        return true;
      }
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
        // Pick battle
        const encounter = scene.currentBattle.mysteryEncounter;
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
