import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/constants";
import { globalScene } from "#app/global-scene";
import { allHeldItems, allTrainerItems } from "#data/data-lists";
import { BattlerIndex } from "#enums/battler-index";
import { HeldItemCategoryId, HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { MoveUseMode } from "#enums/move-use-mode";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { RarityTier } from "#enums/reward-tier";
import { SpeciesId } from "#enums/species-id";
import { TrainerItemId } from "#enums/trainer-item-id";
import { assignItemToFirstFreePokemon } from "#items/item-utility";
import { PokemonMove } from "#moves/pokemon-move";
import { showEncounterText } from "#mystery-encounters/encounter-dialogue-utils";
import {
  type EnemyPartyConfig,
  type EnemyPokemonConfig,
  initBattleWithEnemyConfig,
  leaveEncounterWithoutBattle,
  loadCustomMovesForEncounter,
  setEncounterRewards,
  transitionMysteryEncounterIntroVisuals,
} from "#mystery-encounters/encounter-phase-utils";
import { type MysteryEncounter, MysteryEncounterBuilder } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterOptionBuilder } from "#mystery-encounters/mystery-encounter-option";
import i18next from "#plugins/i18n";
import { randSeedInt } from "#utils/common";
import { getPokemonSpecies } from "#utils/pokemon-utils";

/** the i18n namespace for this encounter */
const namespace = "mysteryEncounters/trashToTreasure";

const SOUND_EFFECT_WAIT_TIME = 700;

// Items will cost 2.5x as much for remainder of the run
const SHOP_ITEM_COST_MULTIPLIER = 2.5;

/**
 * Trash to Treasure encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3809 | GitHub Issue #3809}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const TrashToTreasureEncounter: MysteryEncounter = MysteryEncounterBuilder.withEncounterType(
  MysteryEncounterType.TRASH_TO_TREASURE,
)
  .withEncounterTier(MysteryEncounterTier.ULTRA)
  .withSceneWaveRangeRequirement(100, CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES[1])
  .withScenePartySizeRequirement(3, 6)
  .withMaxAllowedEncounters(1)
  .withFleeAllowed(false)
  .withIntroSpriteConfigs([
    {
      spriteKey: SpeciesId.GARBODOR.toString() + "-gigantamax",
      fileRoot: "pokemon",
      hasShadow: false,
      disableAnimation: true,
      scale: 1.5,
      y: 8,
      tint: 0.4,
    },
  ])
  .withAutoHideIntroVisuals(false)
  .withIntroDialogue([
    {
      text: `${namespace}:intro`,
    },
  ])
  .setLocalizationKey(`${namespace}`)
  .withTitle(`${namespace}:title`)
  .withDescription(`${namespace}:description`)
  .withQuery(`${namespace}:query`)
  .withOnInit(() => {
    const encounter = globalScene.currentBattle.mysteryEncounter!;

    // Calculate boss mon (shiny locked)
    const bossSpecies = getPokemonSpecies(SpeciesId.GARBODOR);
    const pokemonConfig: EnemyPokemonConfig = {
      species: bossSpecies,
      isBoss: true,
      shiny: false, // Shiny lock because of custom intro sprite
      formIndex: 1, // Gmax
      bossSegmentModifier: 1, // +1 Segment from normal
      moveSet: [MoveId.GUNK_SHOT, MoveId.STOMPING_TANTRUM, MoveId.HAMMER_ARM, MoveId.PAYBACK],
      heldItemConfig: [
        { entry: HeldItemCategoryId.BERRY, count: 4 },
        { entry: HeldItemCategoryId.BASE_STAT_BOOST, count: 2 },
        { entry: HeldItemId.TOXIC_ORB, count: randSeedInt(2, 0) },
        { entry: HeldItemId.SOOTHE_BELL, count: randSeedInt(2, 1) },
        { entry: HeldItemId.LUCKY_EGG, count: randSeedInt(3, 1) },
        { entry: HeldItemId.GOLDEN_EGG, count: randSeedInt(2, 0) },
      ],
    };
    const config: EnemyPartyConfig = {
      levelAdditiveModifier: 0.5,
      pokemonConfigs: [pokemonConfig],
      disableSwitch: true,
    };
    encounter.enemyPartyConfigs = [config];

    // Load animations/sfx for Garbodor fight start moves
    loadCustomMovesForEncounter([MoveId.TOXIC, MoveId.STOCKPILE]);

    globalScene.loadSe("PRSFX- Dig2", "battle_anims", "PRSFX- Dig2.wav");
    globalScene.loadSe("PRSFX- Venom Drench", "battle_anims", "PRSFX- Venom Drench.wav");

    encounter.setDialogueToken("costMultiplier", SHOP_ITEM_COST_MULTIPLIER.toString());

    return true;
  })
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
      .withOptionPhase(async () => {
        // Investigate garbage, battle Gmax Garbodor
        globalScene.setFieldScale(0.75);
        await showEncounterText(`${namespace}:option.1.selected2`);
        await transitionMysteryEncounterIntroVisuals();

        const encounter = globalScene.currentBattle.mysteryEncounter!;

        setEncounterRewards({
          guaranteedRewardSpecs: [HeldItemId.LEFTOVERS],
          guaranteedRarityTiers: [RarityTier.ROGUE, RarityTier.ULTRA, RarityTier.GREAT],
          fillRemaining: true,
        });
        encounter.startOfBattleEffects.push(
          {
            sourceBattlerIndex: BattlerIndex.ENEMY,
            targets: [BattlerIndex.PLAYER],
            move: new PokemonMove(MoveId.TOXIC),
            useMode: MoveUseMode.IGNORE_PP,
          },
          {
            sourceBattlerIndex: BattlerIndex.ENEMY,
            targets: [BattlerIndex.ENEMY],
            move: new PokemonMove(MoveId.STOCKPILE),
            useMode: MoveUseMode.IGNORE_PP,
          },
        );
        await initBattleWithEnemyConfig(encounter.enemyPartyConfigs[0]);
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
        // Play Dig2 and then Venom Drench sfx
        doGarbageDig();
      })
      .withOptionPhase(async () => {
        // Gain 1 Leftovers and 1 Shell Bell
        await transitionMysteryEncounterIntroVisuals();
        await tryApplyDigRewardItems();

        const blackSludge = globalScene.trainerItems.add(TrainerItemId.BLACK_SLUDGE);
        if (blackSludge) {
          globalScene.playSound("battle_anims/PRSFX- Venom Drench", {
            volume: 2,
          });
          await showEncounterText(
            i18next.t("battle:rewardGain", {
              modifierName: allTrainerItems[TrainerItemId.BLACK_SLUDGE].name,
            }),
            null,
            undefined,
            true,
          );
        }

        leaveEncounterWithoutBattle(true);
      })
      .build(),
  )
  .build();

async function tryApplyDigRewardItems() {
  const party = globalScene.getPlayerParty();

  // First leftovers
  assignItemToFirstFreePokemon(HeldItemId.LEFTOVERS, party);

  // Second leftovers
  assignItemToFirstFreePokemon(HeldItemId.LEFTOVERS, party);

  globalScene.playSound("item_fanfare");
  await showEncounterText(
    i18next.t("battle:rewardGainCount", {
      modifierName: allHeldItems[HeldItemId.LEFTOVERS].name,
      count: 1,
    }),
    null,
    undefined,
    true,
  );

  // Only Shell bell
  assignItemToFirstFreePokemon(HeldItemId.SHELL_BELL, party);

  globalScene.playSound("item_fanfare");
  await showEncounterText(
    i18next.t("battle:rewardGainCount", {
      modifierName: allHeldItems[HeldItemId.SHELL_BELL].name,
      count: 1,
    }),
    null,
    undefined,
    true,
  );
}

function doGarbageDig() {
  globalScene.playSound("battle_anims/PRSFX- Dig2");
  globalScene.time.delayedCall(SOUND_EFFECT_WAIT_TIME, () => {
    globalScene.playSound("battle_anims/PRSFX- Dig2");
    globalScene.playSound("battle_anims/PRSFX- Venom Drench", { volume: 2 });
  });
  globalScene.time.delayedCall(SOUND_EFFECT_WAIT_TIME * 2, () => {
    globalScene.playSound("battle_anims/PRSFX- Dig2");
  });
}
