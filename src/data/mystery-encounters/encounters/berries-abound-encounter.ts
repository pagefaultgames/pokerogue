import { BattleStat } from "#app/data/battle-stat";
import { MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import {
  EnemyPartyConfig, generateModifierTypeOption,
  initBattleWithEnemyConfig,
  leaveEncounterWithoutBattle, setEncounterExp,
  setEncounterRewards
} from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { STEALING_MOVES } from "#app/data/mystery-encounters/requirements/requirement-groups";
import Pokemon, { EnemyPokemon } from "#app/field/pokemon";
import {
  BerryModifierType,
  getPartyLuckValue,
  ModifierPoolType,
  ModifierTypeOption, modifierTypes,
  regenerateModifierPoolThresholds,
} from "#app/modifier/modifier-type";
import { StatChangePhase } from "#app/phases";
import { randSeedInt } from "#app/utils";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import BattleScene from "#app/battle-scene";
import IMysteryEncounter, { MysteryEncounterBuilder } from "../mystery-encounter";
import { MoveRequirement } from "../mystery-encounter-requirements";
import { queueEncounterMessage, showEncounterText } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import { getPokemonNameWithAffix } from "#app/messages";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { TrainerSlot } from "#app/data/trainer-config";
import { applyModifierTypeToPlayerPokemon, getSpriteKeysFromPokemon } from "#app/data/mystery-encounters/utils/encounter-pokemon-utils";
import PokemonData from "#app/system/pokemon-data";
import { BerryModifier } from "#app/modifier/modifier";
import i18next from "#app/plugins/i18n";
import { BerryType } from "#enums/berry-type";

/** the i18n namespace for the encounter */
const namespace = "mysteryEncounter:berriesAbound";

/**
 * Berries Abound encounter.
 * @see {@link https://github.com/AsdarDevelops/PokeRogue-Events/issues/24 | GitHub Issue #24}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const BerriesAboundEncounter: IMysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(MysteryEncounterType.BERRIES_ABOUND)
    .withEncounterTier(MysteryEncounterTier.COMMON)
    .withSceneWaveRangeRequirement(10, 180) // waves 10 to 180
    .withCatchAllowed(true)
    .withHideWildIntroMessage(true)
    .withIntroSpriteConfigs([
      {
        spriteKey: "lum_berry",
        fileRoot: "items",
        isItem: true,
        x: 7,
        y: -14,
        disableAnimation: true
      },
      {
        spriteKey: "salac_berry",
        fileRoot: "items",
        isItem: true,
        x: 2,
        y: 4,
        disableAnimation: true
      },
      {
        spriteKey: "lansat_berry",
        fileRoot: "items",
        isItem: true,
        x: 32,
        y: 5,
        disableAnimation: true
      },
      {
        spriteKey: "liechi_berry",
        fileRoot: "items",
        isItem: true,
        x: 6,
        y: -5,
        disableAnimation: true
      },
      {
        spriteKey: "sitrus_berry",
        fileRoot: "items",
        isItem: true,
        x: 7,
        y: 8,
        disableAnimation: true
      },
      {
        spriteKey: "enigma_berry",
        fileRoot: "items",
        isItem: true,
        x: 26,
        y: -4,
        disableAnimation: true
      },
      {
        spriteKey: "leppa_berry",
        fileRoot: "items",
        isItem: true,
        x: 16,
        y: -27,
        disableAnimation: true
      },
      {
        spriteKey: "petaya_berry",
        fileRoot: "items",
        isItem: true,
        x: 30,
        y: -17,
        disableAnimation: true
      },
      {
        spriteKey: "ganlon_berry",
        fileRoot: "items",
        isItem: true,
        x: 16,
        y: -11,
        disableAnimation: true
      },
      {
        spriteKey: "apicot_berry",
        fileRoot: "items",
        isItem: true,
        x: 14,
        y: -2,
        disableAnimation: true
      },
      {
        spriteKey: "starf_berry",
        fileRoot: "items",
        isItem: true,
        x: 18,
        y: 9,
        disableAnimation: true
      },
    ]) // Set in onInit()
    .withIntroDialogue([
      {
        text: `${namespace}.intro`,
      },
    ])
    .withOnInit((scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter;

      // Calculate boss mon
      const bossSpecies = scene.arena.randomSpecies(scene.currentBattle.waveIndex, scene.currentBattle.waveIndex, 0, getPartyLuckValue(scene.getParty()), true);
      const bossPokemon = new EnemyPokemon(scene, bossSpecies, scene.currentBattle.waveIndex, TrainerSlot.NONE, true, null);
      const config: EnemyPartyConfig = {
        levelAdditiveMultiplier: 1,
        pokemonConfigs: [{
          species: bossSpecies,
          dataSource: new PokemonData(bossPokemon),
          isBoss: true
        }],
      };
      encounter.enemyPartyConfigs = [config];

      // Calculate the number of extra berries that player receives
      // 10-60 GREAT, 60-110 ULTRA, 110-160 ROGUE, 160-180 MASTER
      const numBerries =
        scene.currentBattle.waveIndex > 160 ? 7
          : scene.currentBattle.waveIndex > 110 ? 5
            : scene.currentBattle.waveIndex > 60 ? 4 : 2;
      regenerateModifierPoolThresholds(scene.getParty(), ModifierPoolType.PLAYER, 0);
      encounter.misc = { numBerries };

      const { spriteKey, fileRoot } = getSpriteKeysFromPokemon(bossPokemon);
      encounter.spriteConfigs.push({
        spriteKey: spriteKey,
        fileRoot: fileRoot,
        hasShadow: true,
        tint: 0.25,
        x: -5,
        repeat: true,
        isPokemon: true
      });

      // If player has a stealing move, they succeed automatically
      encounter.options[1].meetsRequirements(scene);
      const primaryPokemon = encounter.options[1].primaryPokemon;
      if (primaryPokemon) {
        // Use primaryPokemon to execute the thievery
        encounter.options[1].dialogue.buttonTooltip = `${namespace}.option.2.tooltip_special`;
      } else {
        encounter.options[1].dialogue.buttonTooltip = `${namespace}.option.2.tooltip`;
      }

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
        const encounter = scene.currentBattle.mysteryEncounter;
        const numBerries = encounter.misc.numBerries;

        const doBerryRewards = async () => {
          const berryText = numBerries + " " + i18next.t(`${namespace}.berries`);

          scene.playSound("item_fanfare");
          queueEncounterMessage(scene, i18next.t("battle:rewardGain", { modifierName: berryText }));

          // Generate a random berry and give it to the first Pokemon with room for it
          for (let i = 0; i < numBerries; i++) {
            await tryGiveBerry(scene);
          }
        };

        const shopOptions: ModifierTypeOption[] = [];
        for (let i = 0; i < 5; i++) {
          // Generate shop berries
          shopOptions.push(generateModifierTypeOption(scene, modifierTypes.BERRY));
        }

        setEncounterRewards(scene, { guaranteedModifierTypeOptions: shopOptions, fillRemaining: false }, null, doBerryRewards);
        await initBattleWithEnemyConfig(scene, scene.currentBattle.mysteryEncounter.enemyPartyConfigs[0]);
      }
    )
    .withOption(
      new MysteryEncounterOptionBuilder()
        .withOptionMode(MysteryEncounterOptionMode.DEFAULT_OR_SPECIAL)
        .withPrimaryPokemonRequirement(new MoveRequirement(STEALING_MOVES)) // Will set option2PrimaryName and option2PrimaryMove dialogue tokens automatically
        .withDialogue({
          buttonLabel: `${namespace}.option.2.label`,
          buttonTooltip: `${namespace}.option.2.tooltip`,
        })
        .withOptionPhase(async (scene: BattleScene) => {
          // Pick steal
          const encounter = scene.currentBattle.mysteryEncounter;
          const numBerries = encounter.misc.numBerries;

          const doBerryRewards = async () => {
            const berryText = numBerries + " " + i18next.t(`${namespace}.berries`);

            scene.playSound("item_fanfare");
            queueEncounterMessage(scene, i18next.t("battle:rewardGain", { modifierName: berryText }));

            // Generate a random berry and give it to the first Pokemon with room for it
            for (let i = 0; i < numBerries; i++) {
              await tryGiveBerry(scene);
            }
          };

          const shopOptions: ModifierTypeOption[] = [];
          for (let i = 0; i < 5; i++) {
            // Generate shop berries
            shopOptions.push(generateModifierTypeOption(scene, modifierTypes.BERRY));
          }

          setEncounterRewards(scene, { guaranteedModifierTypeOptions: shopOptions, fillRemaining: false }, null, doBerryRewards);

          // If player has a stealing move, they succeed automatically
          const primaryPokemon = encounter.options[1].primaryPokemon;
          if (primaryPokemon) {
            // Use primaryPokemon to execute the thievery
            await showEncounterText(scene, `${namespace}.option.2.special_result`);
            setEncounterExp(scene, primaryPokemon.id, encounter.enemyPartyConfigs[0].pokemonConfigs[0].species.baseExp, true);
            leaveEncounterWithoutBattle(scene);
            return;
          }

          const roll = randSeedInt(16);
          if (roll > 6) {
            // Noticed and attacked by boss, gets +1 to all stats at start of fight (62.5%)
            const config = scene.currentBattle.mysteryEncounter.enemyPartyConfigs[0];
            config.pokemonConfigs[0].tags = [BattlerTagType.MYSTERY_ENCOUNTER_POST_SUMMON];
            config.pokemonConfigs[0].mysteryEncounterBattleEffects = (pokemon: Pokemon) => {
              pokemon.scene.currentBattle.mysteryEncounter.setDialogueToken("enemyPokemon", getPokemonNameWithAffix(pokemon));
              queueEncounterMessage(pokemon.scene, `${namespace}option.2.boss_enraged`);
              pokemon.scene.unshiftPhase(new StatChangePhase(pokemon.scene, pokemon.getBattlerIndex(), true, [BattleStat.ATK, BattleStat.DEF, BattleStat.SPATK, BattleStat.SPDEF, BattleStat.SPD], 1));
            };
            await showEncounterText(scene, `${namespace}.option.2.bad_result`);
            await initBattleWithEnemyConfig(scene, config);
          } else {
            // Steal item (37.5%)
            // Display result message then proceed to rewards
            await showEncounterText(scene, `${namespace}.option.2.good_result`);
            leaveEncounterWithoutBattle(scene);
          }
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

async function tryGiveBerry(scene: BattleScene) {
  const berryType = randSeedInt(Object.keys(BerryType).filter(s => !isNaN(Number(s))).length) as BerryType;
  const berry = generateModifierTypeOption(scene, modifierTypes.BERRY, [berryType]).type as BerryModifierType;

  const party = scene.getParty();

  // Iterate over the party until berry was successfully given
  for (const pokemon of party) {
    const heldBerriesOfType = scene.findModifier(m => m instanceof BerryModifier
      && m.pokemonId === pokemon.id && (m as BerryModifier).berryType === berryType, true) as BerryModifier;

    if (!heldBerriesOfType || heldBerriesOfType.getStackCount() < heldBerriesOfType.getMaxStackCount(scene)) {
      await applyModifierTypeToPlayerPokemon(scene, pokemon, berry);
      break;
    }
  }
}
