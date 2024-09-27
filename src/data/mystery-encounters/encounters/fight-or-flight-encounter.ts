import { MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import {
  EnemyPartyConfig,
  initBattleWithEnemyConfig,
  leaveEncounterWithoutBattle, setEncounterExp,
  setEncounterRewards
} from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { STEALING_MOVES } from "#app/data/mystery-encounters/requirements/requirement-groups";
import Pokemon, { EnemyPokemon } from "#app/field/pokemon";
import { ModifierTier } from "#app/modifier/modifier-tier";
import {
  getPartyLuckValue,
  getPlayerModifierTypeOptions,
  ModifierPoolType,
  ModifierTypeOption,
  regenerateModifierPoolThresholds,
} from "#app/modifier/modifier-type";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import BattleScene from "#app/battle-scene";
import MysteryEncounter, { MysteryEncounterBuilder } from "#app/data/mystery-encounters/mystery-encounter";
import { MoveRequirement } from "#app/data/mystery-encounters/mystery-encounter-requirements";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { TrainerSlot } from "#app/data/trainer-config";
import { getEncounterPokemonLevelForWave, getSpriteKeysFromPokemon, STANDARD_ENCOUNTER_BOOSTED_LEVEL_MODIFIER } from "#app/data/mystery-encounters/utils/encounter-pokemon-utils";
import PokemonData from "#app/system/pokemon-data";
import { BattlerTagType } from "#enums/battler-tag-type";
import { queueEncounterMessage } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import { randSeedInt } from "#app/utils";
import { StatStageChangePhase } from "#app/phases/stat-stage-change-phase";
import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/game-mode";

/** the i18n namespace for the encounter */
const namespace = "mysteryEncounter:fightOrFlight";

/**
 * Fight or Flight encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3795 | GitHub Issue #3795}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const FightOrFlightEncounter: MysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(MysteryEncounterType.FIGHT_OR_FLIGHT)
    .withEncounterTier(MysteryEncounterTier.COMMON)
    .withSceneWaveRangeRequirement(-1, -1)
    .withCatchAllowed(true)
    .withHideWildIntroMessage(true)
    .withFleeAllowed(false)
    .withIntroSpriteConfigs([]) // Set in onInit()
    .withIntroDialogue([
      {
        text: `${namespace}.intro`,
      },
    ])
    .withOnInit((scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter!;

      // Calculate boss mon
      const level = getEncounterPokemonLevelForWave(scene, STANDARD_ENCOUNTER_BOOSTED_LEVEL_MODIFIER);
      const bossSpecies = scene.arena.randomSpecies(scene.currentBattle.waveIndex, level, 0, getPartyLuckValue(scene.getParty()), true);
      const bossPokemon = new EnemyPokemon(scene, bossSpecies, level, TrainerSlot.NONE, true);
      encounter.setDialogueToken("enemyPokemon", bossPokemon.getNameToRender());
      const config: EnemyPartyConfig = {
        pokemonConfigs: [{
          level: level,
          species: bossSpecies,
          dataSource: new PokemonData(bossPokemon),
          isBoss: true,
          tags: [BattlerTagType.MYSTERY_ENCOUNTER_POST_SUMMON],
          mysteryEncounterBattleEffects: (pokemon: Pokemon) => {
            queueEncounterMessage(pokemon.scene, `${namespace}.option.1.stat_boost`);
            // Randomly boost 1 stat 2 stages
            // Cannot boost Spd, Acc, or Evasion
            pokemon.scene.unshiftPhase(new StatStageChangePhase(pokemon.scene, pokemon.getBattlerIndex(), true, [randSeedInt(4, 1)], 2));
          }
        }],
      };
      encounter.enemyPartyConfigs = [config];

      // Calculate item
      // Waves 10-40 GREAT, 60-120 ULTRA, 120-160 ROGUE, 160-180 MASTER
      const tier =
        scene.currentBattle.waveIndex > 160
          ? ModifierTier.MASTER
          : scene.currentBattle.waveIndex > 120
            ? ModifierTier.ROGUE
            : scene.currentBattle.waveIndex > 40
              ? ModifierTier.ULTRA
              : ModifierTier.GREAT;
      regenerateModifierPoolThresholds(scene.getParty(), ModifierPoolType.PLAYER, 0);
      let item: ModifierTypeOption | null = null;
      // TMs and Candy Jar excluded from possible rewards as they're too swingy in value for a singular item reward
      while (!item || item.type.id.includes("TM_") || item.type.id === "CANDY_JAR") {
        item = getPlayerModifierTypeOptions(1, scene.getParty(), [], { guaranteedModifierTiers: [tier], allowLuckUpgrades: false })[0];
      }
      encounter.setDialogueToken("itemName", item.type.name);
      encounter.misc = item;

      const { spriteKey, fileRoot } = getSpriteKeysFromPokemon(bossPokemon);
      encounter.spriteConfigs = [
        {
          spriteKey: item.type.iconImage,
          fileRoot: "items",
          hasShadow: false,
          x: 35,
          y: -5,
          scale: 0.75,
          isItem: true,
          disableAnimation: true
        },
        {
          spriteKey: spriteKey,
          fileRoot: fileRoot,
          hasShadow: true,
          tint: 0.25,
          x: -5,
          repeat: true,
          isPokemon: true
        },
      ];

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
            text: `${namespace}.option.1.selected`,
          },
        ],
      },
      async (scene: BattleScene) => {
        // Pick battle
        // Pokemon will randomly boost 1 stat by 2 stages
        const item = scene.currentBattle.mysteryEncounter!.misc as ModifierTypeOption;
        setEncounterRewards(scene, { guaranteedModifierTypeOptions: [item], fillRemaining: false });
        await initBattleWithEnemyConfig(scene, scene.currentBattle.mysteryEncounter!.enemyPartyConfigs[0]);
      }
    )
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DISABLED_OR_SPECIAL)
        .withPrimaryPokemonRequirement(new MoveRequirement(STEALING_MOVES)) // Will set option2PrimaryName and option2PrimaryMove dialogue tokens automatically
        .withDialogue({
          buttonLabel: `${namespace}.option.2.label`,
          buttonTooltip: `${namespace}.option.2.tooltip`,
          disabledButtonTooltip: `${namespace}.option.2.disabled_tooltip`,
          selected: [
            {
              text: `${namespace}.option.2.selected`
            }
          ]
        })
        .withOptionPhase(async (scene: BattleScene) => {
          // Pick steal
          const encounter = scene.currentBattle.mysteryEncounter!;
          const item = scene.currentBattle.mysteryEncounter!.misc as ModifierTypeOption;
          setEncounterRewards(scene, { guaranteedModifierTypeOptions: [item], fillRemaining: false });

          // Use primaryPokemon to execute the thievery
          const primaryPokemon = encounter.options[1].primaryPokemon!;
          setEncounterExp(scene, primaryPokemon.id, encounter.enemyPartyConfigs[0].pokemonConfigs![0].species.baseExp);
          leaveEncounterWithoutBattle(scene);
        })
        .build()
    )
    .withSimpleOption(
      {
        buttonLabel: `${namespace}.option.3.label`,
        buttonTooltip: `${namespace}.option.3.tooltip`,
        selected: [
          {
            text: `${namespace}.option.3.selected`,
          },
        ],
      },
      async (scene: BattleScene) => {
        // Leave encounter with no rewards or exp
        leaveEncounterWithoutBattle(scene, true);
        return true;
      }
    )
    .build();
