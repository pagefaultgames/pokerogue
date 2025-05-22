import type { EnemyPartyConfig, EnemyPokemonConfig } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import {
  generateModifierType,
  initBattleWithEnemyConfig,
  leaveEncounterWithoutBattle,
  loadCustomMovesForEncounter,
  setEncounterRewards,
  transitionMysteryEncounterIntroVisuals,
} from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import type { PokemonHeldItemModifierType } from "#app/modifier/modifier-type";
import { modifierTypes } from "#app/modifier/modifier-type";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { globalScene } from "#app/global-scene";
import type MysteryEncounter from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterBuilder } from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterOptionBuilder } from "#app/data/mystery-encounters/mystery-encounter-option";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { Species } from "#enums/species";
import { HitHealModifier, PokemonHeldItemModifier, TurnHealModifier } from "#app/modifier/modifier";
import { applyModifierTypeToPlayerPokemon } from "#app/data/mystery-encounters/utils/encounter-pokemon-utils";
import { showEncounterText } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import i18next from "#app/plugins/i18n";
import { ModifierTier } from "#app/modifier/modifier-tier";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import { Moves } from "#enums/moves";
import { BattlerIndex } from "#app/battle";
import { PokemonMove } from "#app/field/pokemon";
import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/constants";
import { randSeedInt } from "#app/utils/common";

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
  .withSceneWaveRangeRequirement(60, CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES[1])
  .withMaxAllowedEncounters(1)
  .withFleeAllowed(false)
  .withIntroSpriteConfigs([
    {
      spriteKey: Species.GARBODOR.toString() + "-gigantamax",
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
    const bossSpecies = getPokemonSpecies(Species.GARBODOR);
    const pokemonConfig: EnemyPokemonConfig = {
      species: bossSpecies,
      isBoss: true,
      shiny: false, // Shiny lock because of custom intro sprite
      formIndex: 1, // Gmax
      bossSegmentModifier: 1, // +1 Segment from normal
      moveSet: [Moves.GUNK_SHOT, Moves.STOMPING_TANTRUM, Moves.HAMMER_ARM, Moves.PAYBACK],
      modifierConfigs: [
        {
          modifier: generateModifierType(modifierTypes.BERRY) as PokemonHeldItemModifierType,
        },
        {
          modifier: generateModifierType(modifierTypes.BERRY) as PokemonHeldItemModifierType,
        },
        {
          modifier: generateModifierType(modifierTypes.BERRY) as PokemonHeldItemModifierType,
        },
        {
          modifier: generateModifierType(modifierTypes.BERRY) as PokemonHeldItemModifierType,
        },
        {
          modifier: generateModifierType(modifierTypes.BASE_STAT_BOOSTER) as PokemonHeldItemModifierType,
        },
        {
          modifier: generateModifierType(modifierTypes.BASE_STAT_BOOSTER) as PokemonHeldItemModifierType,
        },
        {
          modifier: generateModifierType(modifierTypes.TOXIC_ORB) as PokemonHeldItemModifierType,
          stackCount: randSeedInt(2, 0),
        },
        {
          modifier: generateModifierType(modifierTypes.SOOTHE_BELL) as PokemonHeldItemModifierType,
          stackCount: randSeedInt(2, 1),
        },
        {
          modifier: generateModifierType(modifierTypes.LUCKY_EGG) as PokemonHeldItemModifierType,
          stackCount: randSeedInt(3, 1),
        },
        {
          modifier: generateModifierType(modifierTypes.GOLDEN_EGG) as PokemonHeldItemModifierType,
          stackCount: randSeedInt(2, 0),
        },
      ],
    };
    const config: EnemyPartyConfig = {
      levelAdditiveModifier: 0.5,
      pokemonConfigs: [pokemonConfig],
      disableSwitch: true,
    };
    encounter.enemyPartyConfigs = [config];

    // Load animations/sfx for Garbodor fight start moves
    loadCustomMovesForEncounter([Moves.TOXIC, Moves.STOCKPILE]);

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
      .withPreOptionPhase(async () => {
        // Play Dig2 and then Venom Drench sfx
        doGarbageDig();
      })
      .withOptionPhase(async () => {
        // Gain 2 Leftovers and 1 Shell Bell
        await transitionMysteryEncounterIntroVisuals();
        await tryApplyDigRewardItems();

        const blackSludge = generateModifierType(modifierTypes.MYSTERY_ENCOUNTER_BLACK_SLUDGE, [
          SHOP_ITEM_COST_MULTIPLIER,
        ]);
        const modifier = blackSludge?.newModifier();
        if (modifier) {
          await globalScene.addModifier(modifier, false, false, false, true);
          globalScene.playSound("battle_anims/PRSFX- Venom Drench", {
            volume: 2,
          });
          await showEncounterText(
            i18next.t("battle:rewardGain", {
              modifierName: modifier.type.name,
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
      .withOptionPhase(async () => {
        // Investigate garbage, battle Gmax Garbodor
        globalScene.setFieldScale(0.75);
        await showEncounterText(`${namespace}:option.2.selected_2`);
        await transitionMysteryEncounterIntroVisuals();

        const encounter = globalScene.currentBattle.mysteryEncounter!;

        setEncounterRewards({
          guaranteedModifierTiers: [ModifierTier.ROGUE, ModifierTier.ROGUE, ModifierTier.ULTRA, ModifierTier.GREAT],
          fillRemaining: true,
        });
        encounter.startOfBattleEffects.push(
          {
            sourceBattlerIndex: BattlerIndex.ENEMY,
            targets: [BattlerIndex.PLAYER],
            move: new PokemonMove(Moves.TOXIC),
            ignorePp: true,
          },
          {
            sourceBattlerIndex: BattlerIndex.ENEMY,
            targets: [BattlerIndex.ENEMY],
            move: new PokemonMove(Moves.STOCKPILE),
            ignorePp: true,
          },
        );
        await initBattleWithEnemyConfig(encounter.enemyPartyConfigs[0]);
      })
      .build(),
  )
  .build();

async function tryApplyDigRewardItems() {
  const shellBell = generateModifierType(modifierTypes.SHELL_BELL) as PokemonHeldItemModifierType;
  const leftovers = generateModifierType(modifierTypes.LEFTOVERS) as PokemonHeldItemModifierType;

  const party = globalScene.getPlayerParty();

  // Iterate over the party until an item was successfully given
  // First leftovers
  for (const pokemon of party) {
    const heldItems = globalScene.findModifiers(
      m => m instanceof PokemonHeldItemModifier && m.pokemonId === pokemon.id,
      true,
    ) as PokemonHeldItemModifier[];
    const existingLeftovers = heldItems.find(m => m instanceof TurnHealModifier) as TurnHealModifier;

    if (!existingLeftovers || existingLeftovers.getStackCount() < existingLeftovers.getMaxStackCount()) {
      await applyModifierTypeToPlayerPokemon(pokemon, leftovers);
      break;
    }
  }

  // Second leftovers
  for (const pokemon of party) {
    const heldItems = globalScene.findModifiers(
      m => m instanceof PokemonHeldItemModifier && m.pokemonId === pokemon.id,
      true,
    ) as PokemonHeldItemModifier[];
    const existingLeftovers = heldItems.find(m => m instanceof TurnHealModifier) as TurnHealModifier;

    if (!existingLeftovers || existingLeftovers.getStackCount() < existingLeftovers.getMaxStackCount()) {
      await applyModifierTypeToPlayerPokemon(pokemon, leftovers);
      break;
    }
  }

  globalScene.playSound("item_fanfare");
  await showEncounterText(
    i18next.t("battle:rewardGainCount", {
      modifierName: leftovers.name,
      count: 2,
    }),
    null,
    undefined,
    true,
  );

  // Only Shell bell
  for (const pokemon of party) {
    const heldItems = globalScene.findModifiers(
      m => m instanceof PokemonHeldItemModifier && m.pokemonId === pokemon.id,
      true,
    ) as PokemonHeldItemModifier[];
    const existingShellBell = heldItems.find(m => m instanceof HitHealModifier) as HitHealModifier;

    if (!existingShellBell || existingShellBell.getStackCount() < existingShellBell.getMaxStackCount()) {
      await applyModifierTypeToPlayerPokemon(pokemon, shellBell);
      break;
    }
  }

  globalScene.playSound("item_fanfare");
  await showEncounterText(
    i18next.t("battle:rewardGainCount", {
      modifierName: shellBell.name,
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
