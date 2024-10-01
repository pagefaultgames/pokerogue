import { MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import { EnemyPartyConfig, initBattleWithEnemyConfig, loadCustomMovesForEncounter, leaveEncounterWithoutBattle, setEncounterExp, setEncounterRewards, transitionMysteryEncounterIntroVisuals, generateModifierType } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { AttackTypeBoosterModifierType, modifierTypes, } from "#app/modifier/modifier-type";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import BattleScene from "#app/battle-scene";
import MysteryEncounter, { MysteryEncounterBuilder } from "#app/data/mystery-encounters/mystery-encounter";
import { TypeRequirement } from "#app/data/mystery-encounters/mystery-encounter-requirements";
import { Species } from "#enums/species";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import { Gender } from "#app/data/gender";
import { Type } from "#app/data/type";
import { BattlerIndex } from "#app/battle";
import { PokemonMove } from "#app/field/pokemon";
import { Moves } from "#enums/moves";
import { EncounterBattleAnim } from "#app/data/battle-anims";
import { WeatherType } from "#app/data/weather";
import { isNullOrUndefined, randSeedInt } from "#app/utils";
import { StatusEffect } from "#app/data/status-effect";
import { queueEncounterMessage } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import { applyDamageToPokemon, applyModifierTypeToPlayerPokemon } from "#app/data/mystery-encounters/utils/encounter-pokemon-utils";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { EncounterAnim } from "#enums/encounter-anims";
import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/game-mode";

/** the i18n namespace for the encounter */
const namespace = "mysteryEncounters/fieryFallout";

/**
 * Damage percentage taken when suffering the heat.
 * Can be a number between `0` - `100`.
 * The higher the more damage taken (100% = instant KO).
 */
const DAMAGE_PERCENTAGE: number = 20;

/**
 * Fiery Fallout encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3814 | GitHub Issue #3814}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const FieryFalloutEncounter: MysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(MysteryEncounterType.FIERY_FALLOUT)
    .withEncounterTier(MysteryEncounterTier.COMMON)
    .withSceneWaveRangeRequirement(40, CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES[1])
    .withCatchAllowed(true)
    .withIntroSpriteConfigs([]) // Set in onInit()
    .withAnimations(EncounterAnim.MAGMA_BG, EncounterAnim.MAGMA_SPOUT)
    .withAutoHideIntroVisuals(false)
    .withFleeAllowed(false)
    .withIntroDialogue([
      {
        text: `${namespace}:intro`,
      },
    ])
    .withOnInit((scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter!;

      // Calculate boss mons
      const volcaronaSpecies = getPokemonSpecies(Species.VOLCARONA);
      const config: EnemyPartyConfig = {
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

      // Load hidden Volcarona sprites
      encounter.spriteConfigs = [
        {
          spriteKey: "",
          fileRoot: "",
          species: Species.VOLCARONA,
          repeat: true,
          hidden: true,
          hasShadow: true,
          x: -20,
          startFrame: 20
        },
        {
          spriteKey: "",
          fileRoot: "",
          species: Species.VOLCARONA,
          repeat: true,
          hidden: true,
          hasShadow: true,
          x: 20
        },
      ];

      // Load animations/sfx for Volcarona moves
      loadCustomMovesForEncounter(scene, [Moves.FIRE_SPIN, Moves.QUIVER_DANCE]);

      scene.arena.trySetWeather(WeatherType.SUNNY, true);

      encounter.setDialogueToken("volcaronaName", getPokemonSpecies(Species.VOLCARONA).getName());

      return true;
    })
    .withOnVisualsStart((scene: BattleScene) => {
      // Play animations
      const background = new EncounterBattleAnim(EncounterAnim.MAGMA_BG, scene.getPlayerPokemon()!, scene.getPlayerPokemon());
      background.playWithoutTargets(scene, 200, 70, 2, 3);
      const animation = new EncounterBattleAnim(EncounterAnim.MAGMA_SPOUT, scene.getPlayerPokemon()!, scene.getPlayerPokemon());
      animation.playWithoutTargets(scene, 80, 100, 2);
      scene.time.delayedCall(600, () => {
        animation.playWithoutTargets(scene, -20, 100, 2);
      });
      scene.time.delayedCall(1200, () => {
        animation.playWithoutTargets(scene, 140, 150, 2);
      });

      return true;
    })
    .withTitle(`${namespace}:title`)
    .withDescription(`${namespace}:description`)
    .withQuery(`${namespace}:query`)
    .withSimpleOption(
      {
        buttonLabel: `${namespace}:option.1.label`,
        buttonTooltip: `${namespace}:option.1.tooltip`,
        selected: [
          {
            text: `${namespace}:option.1.selected`,
          },
        ],
      },
      async (scene: BattleScene) => {
        // Pick battle
        const encounter = scene.currentBattle.mysteryEncounter!;
        setEncounterRewards(scene, { fillRemaining: true }, undefined, () => giveLeadPokemonCharcoal(scene));

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
        await initBattleWithEnemyConfig(scene, scene.currentBattle.mysteryEncounter!.enemyPartyConfigs[0]);
      }
    )
    .withSimpleOption(
      {
        buttonLabel: `${namespace}:option.2.label`,
        buttonTooltip: `${namespace}:option.2.tooltip`,
        selected: [
          {
            text: `${namespace}:option.2.selected`,
          },
        ],
      },
      async (scene: BattleScene) => {
        // Damage non-fire types and burn 1 random non-fire type member
        const encounter = scene.currentBattle.mysteryEncounter!;
        const nonFireTypes = scene.getParty().filter((p) => p.isAllowedInBattle() && !p.getTypes().includes(Type.FIRE));

        for (const pkm of nonFireTypes) {
          const percentage = DAMAGE_PERCENTAGE / 100;
          const damage = Math.floor(pkm.getMaxHp() * percentage);
          applyDamageToPokemon(scene, pkm, damage);
        }

        // Burn random member
        const burnable = nonFireTypes.filter(p => isNullOrUndefined(p.status) || isNullOrUndefined(p.status.effect) || p.status.effect === StatusEffect.NONE);
        if (burnable?.length > 0) {
          const roll = randSeedInt(burnable.length);
          const chosenPokemon = burnable[roll];
          if (chosenPokemon.trySetStatus(StatusEffect.BURN)) {
            // Burn applied
            encounter.setDialogueToken("burnedPokemon", chosenPokemon.getNameToRender());
            queueEncounterMessage(scene, `${namespace}:option.2.target_burned`);
          }
        }

        // No rewards
        leaveEncounterWithoutBattle(scene, true);
      }
    )
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_SPECIAL)
        .withPrimaryPokemonRequirement(new TypeRequirement(Type.FIRE, true, 1)) // Will set option3PrimaryName dialogue token automatically
        .withSecondaryPokemonRequirement(new TypeRequirement(Type.FIRE, true, 1)) // Will set option3SecondaryName dialogue token automatically
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
          transitionMysteryEncounterIntroVisuals(scene, false, false, 2000);
        })
        .withOptionPhase(async (scene: BattleScene) => {
          // Fire types help calm the Volcarona
          const encounter = scene.currentBattle.mysteryEncounter!;
          transitionMysteryEncounterIntroVisuals(scene);
          setEncounterRewards(scene,
            { fillRemaining: true },
            undefined,
            () => {
              giveLeadPokemonCharcoal(scene);
            });

          const primary = encounter.options[2].primaryPokemon!;
          const secondary = encounter.options[2].secondaryPokemon![0];

          setEncounterExp(scene, [primary.id, secondary.id], getPokemonSpecies(Species.VOLCARONA).baseExp * 2);
          leaveEncounterWithoutBattle(scene);
        })
        .build()
    )
    .build();

function giveLeadPokemonCharcoal(scene: BattleScene) {
  // Give first party pokemon Charcoal for free at end of battle
  const leadPokemon = scene.getParty()?.[0];
  if (leadPokemon) {
    const charcoal = generateModifierType(scene, modifierTypes.ATTACK_TYPE_BOOSTER, [Type.FIRE]) as AttackTypeBoosterModifierType;
    applyModifierTypeToPlayerPokemon(scene, leadPokemon, charcoal);
    scene.currentBattle.mysteryEncounter!.setDialogueToken("leadPokemon", leadPokemon.getNameToRender());
    queueEncounterMessage(scene, `${namespace}:found_charcoal`);
  }
}
