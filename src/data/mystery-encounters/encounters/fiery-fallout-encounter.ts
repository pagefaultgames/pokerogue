import { EncounterOptionMode, MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import { EnemyPartyConfig, generateModifierTypeOption, initBattleWithEnemyConfig, leaveEncounterWithoutBattle, setEncounterExp, setEncounterRewards } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
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
import { initMoveAnim } from "#app/data/battle-anims";
import { WeatherType } from "#app/data/weather";

/** the i18n namespace for the encounter */
const namespace = "mysteryEncounter:fiery_fallout";

export const FieryFalloutEncounter: IMysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(
    MysteryEncounterType.FIERY_FALLOUT
  )
    .withEncounterTier(MysteryEncounterTier.COMMON)
    .withSceneWaveRangeRequirement(40, 180) // waves 10 to 180
    .withCatchAllowed(true)
    .withIntroSpriteConfigs([]) // Set in onInit()
    .withIntroDialogue([
      {
        text: `${namespace}_intro_message`,
      },
    ])
    .withOnInit((scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter;

      // Calculate boss mon
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

      const spriteKey = volcaronaSpecies.getSpriteId(false, null, false, null);
      encounter.spriteConfigs = [
        {
          spriteKey: spriteKey,
          fileRoot: "pokemon",
          tint: 0.9,
          repeat: true
        }
      ];

      // Sets weather for 5 turns
      scene.arena.trySetWeather(WeatherType.SUNNY, true);

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
        // Pick battle
        const encounter = scene.currentBattle.mysteryEncounter;
        // TODO: play heat wave animation for weather effect
        // await initMoveAnim(scene, Moves.HEAT_WAVE);
        // await loadMoveAnimAssets(scene, [ Moves.HEAT_WAVE ], true);
        // const heatWave = new MoveAnim(Moves.HEAT_WAVE, scene.getPlayerPokemon(), 0);
        // heatWave.play(scene);

        await initMoveAnim(scene, Moves.QUIVER_DANCE);
        await initMoveAnim(scene, Moves.FIRE_SPIN);
        await initMoveAnim(scene, Moves.HEAT_WAVE);
        const charcoal = generateModifierTypeOption(scene, modifierTypes.ATTACK_TYPE_BOOSTER, [Type.FIRE]);
        setEncounterRewards(scene, { guaranteedModifierTypeOptions: [charcoal], fillRemaining: true });
        encounter.startOfBattleEffects.push(
          {
            sourceBattlerIndex: BattlerIndex.ENEMY,
            targets: [BattlerIndex.PLAYER, BattlerIndex.PLAYER_2],
            move: new PokemonMove(Moves.HEAT_WAVE),
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
          },
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
          });
        await initBattleWithEnemyConfig(scene, scene.currentBattle.mysteryEncounter.enemyPartyConfigs[0]);
      }
    )
    .withSimpleOption(
      {
        buttonLabel: `${namespace}_option_2_label`,
        buttonTooltip: `${namespace}_option_2_tooltip`,
        selected: [
          {
            text: `${namespace}_option_2_selected`,
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
        .withPrimaryPokemonRequirement(new TypeRequirement(Type.FIRE, 2)) // Will set option2PrimaryName and option2PrimaryMove dialogue tokens automatically
        .withDialogue({
          buttonLabel: `${namespace}_option_3_label`,
          buttonTooltip: `${namespace}_option_3_tooltip`,
          selected: [
            {
              text: `${namespace}_option_3_selected`,
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
