import { EncounterOptionMode, MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import { EnemyPartyConfig, generateModifierTypeOption, initBattleWithEnemyConfig, initCustomMovesForEncounter, leaveEncounterWithoutBattle, setEncounterExp, setEncounterRewards } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { modifierTypes, } from "#app/modifier/modifier-type";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import BattleScene from "../../../battle-scene";
import IMysteryEncounter, { MysteryEncounterBuilder, MysteryEncounterTier, } from "../mystery-encounter";
import { TypeRequirement } from "../mystery-encounter-requirements";
import { Species } from "#enums/species";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import { Gender } from "#app/data/gender";
import { Type } from "#app/data/type";
import { BattlerIndex } from "#app/battle";
import { PokemonMove } from "#app/field/pokemon";
import { Moves } from "#enums/moves";
import { EncounterAnim, EncounterBattleAnim } from "#app/data/battle-anims";
import { WeatherType } from "#app/data/weather";
import { randSeedInt } from "#app/utils";

/** the i18n namespace for the encounter */
const namespace = "mysteryEncounter:fieryFallout";

/**
 * Fiery Fallout encounter.
 * @see {@link https://github.com/AsdarDevelops/PokeRogue-Events/issues/88 | GitHub Issue #88}
 * @see For biome requirements check [mysteryEncountersByBiome](../mystery-encounters.ts)
 */
export const FieryFalloutEncounter: IMysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(
    MysteryEncounterType.FIERY_FALLOUT
  )
    .withEncounterTier(MysteryEncounterTier.COMMON)
    .withSceneWaveRangeRequirement(40, 180) // waves 10 to 180
    .withCatchAllowed(true)
    .withIntroSpriteConfigs([]) // Set in onInit()
    .withAnimations(EncounterAnim.MAGMA_BG, EncounterAnim.MAGMA_SPOUT)
    .withIntroDialogue([
      {
        text: `${namespace}:intro`,
      },
    ])
    .withOnInit((scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter;

      // Calculate boss mons
      const volcaronaSpecies = getPokemonSpecies(Species.VOLCARONA);
      const config: EnemyPartyConfig = {
        levelAdditiveMultiplier: 0.25,
        pokemonConfigs: [
          {
            species: volcaronaSpecies,
            isBoss: false,
            gender: Gender.MALE
          },
          {
            species: volcaronaSpecies,
            isBoss: false,
            gender: Gender.FEMALE
          }
        ],
        doubleBattle: true,
        disableSwitch: true
      };
      encounter.enemyPartyConfigs = [config];

      // Sets weather for 5 turns
      scene.arena.trySetWeather(WeatherType.SUNNY, true);

      // Load animations/sfx for Volcarona moves
      initCustomMovesForEncounter(scene, [Moves.FIRE_SPIN, Moves.QUIVER_DANCE]);

      return true;
    })
    .withOnVisualsStart((scene: BattleScene) => {
      // Play animations
      const background = new EncounterBattleAnim(EncounterAnim.MAGMA_BG, scene.getPlayerPokemon(), scene.getPlayerPokemon());
      background.playWithoutTargets(scene, 200, 70, 2, 3);
      const animation = new EncounterBattleAnim(EncounterAnim.MAGMA_SPOUT, scene.getPlayerPokemon(), scene.getPlayerPokemon());
      animation.playWithoutTargets(scene, 100, 100, 2);
      const increment = 600;
      for (let i = 3; i < 6; i++) {
        scene.time.delayedCall((increment) * (i - 2), () => {
          animation.playWithoutTargets(scene, randSeedInt(12) * 15, 150 - randSeedInt(10) * 15, 2);
        });
      }

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
            text: `${namespace}:option:1:selected`,
          },
        ],
      },
      async (scene: BattleScene) => {
        // Pick battle
        const encounter = scene.currentBattle.mysteryEncounter;
        const charcoal = generateModifierTypeOption(scene, modifierTypes.ATTACK_TYPE_BOOSTER, [Type.FIRE]);
        setEncounterRewards(scene, { guaranteedModifierTypeOptions: [charcoal], fillRemaining: true });
        encounter.startOfBattleEffects.push(
          {
            sourceBattlerIndex: BattlerIndex.ENEMY,
            targets: [BattlerIndex.PLAYER],
            move: new PokemonMove(Moves.FIRE_SPIN),
            ignorePp: true
          },
          {
            sourceBattlerIndex: BattlerIndex.ENEMY_2,
            targets: [BattlerIndex.PLAYER_2],
            move: new PokemonMove(Moves.FIRE_SPIN),
            ignorePp: true
          },
          {
            sourceBattlerIndex: BattlerIndex.ENEMY,
            targets: [BattlerIndex.ENEMY],
            move: new PokemonMove(Moves.QUIVER_DANCE),
            ignorePp: true
          },
          {
            sourceBattlerIndex: BattlerIndex.ENEMY_2,
            targets: [BattlerIndex.ENEMY_2],
            move: new PokemonMove(Moves.QUIVER_DANCE),
            ignorePp: true
          });
        await initBattleWithEnemyConfig(scene, scene.currentBattle.mysteryEncounter.enemyPartyConfigs[0]);
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
        // Damage party and burn 1 random member
        // No rewards
        leaveEncounterWithoutBattle(scene);
      }
    )
    .withOption(
      new MysteryEncounterOptionBuilder()
        .withOptionMode(EncounterOptionMode.DISABLED_OR_SPECIAL)
        .withPrimaryPokemonRequirement(new TypeRequirement(Type.FIRE, true,2)) // Will set option2PrimaryName and option2PrimaryMove dialogue tokens automatically
        .withDialogue({
          buttonLabel: `${namespace}:option:3:label`,
          buttonTooltip: `${namespace}:option:3:tooltip`,
          disabledButtonTooltip: `${namespace}:option:3:disabled_tooltip`,
          selected: [
            {
              text: `${namespace}:option:3:selected`,
            },
          ],
        })
        .withOptionPhase(async (scene: BattleScene) => {
          // Fire types help calm the Volcarona
          // const encounter = scene.currentBattle.mysteryEncounter;
          const charcoal = generateModifierTypeOption(scene, modifierTypes.ATTACK_TYPE_BOOSTER, [Type.FIRE]);
          setEncounterRewards(scene, { guaranteedModifierTypeOptions: [charcoal], fillRemaining: true });
          setEncounterExp(scene, scene.getParty().map(p => p.id), 500);
          leaveEncounterWithoutBattle(scene);
        })
        .build()
    )
    .build();
