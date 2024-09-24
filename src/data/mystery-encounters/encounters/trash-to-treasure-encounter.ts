import { EnemyPartyConfig, EnemyPokemonConfig, generateModifierType, initBattleWithEnemyConfig, leaveEncounterWithoutBattle, loadCustomMovesForEncounter, setEncounterRewards, transitionMysteryEncounterIntroVisuals, } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { modifierTypes, PokemonHeldItemModifierType } from "#app/modifier/modifier-type";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import BattleScene from "#app/battle-scene";
import MysteryEncounter, { MysteryEncounterBuilder } from "#app/data/mystery-encounters/mystery-encounter";
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
import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/game-mode";

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
export const TrashToTreasureEncounter: MysteryEncounter =
  MysteryEncounterBuilder.withEncounterType(MysteryEncounterType.TRASH_TO_TREASURE)
    .withEncounterTier(MysteryEncounterTier.ULTRA)
    .withSceneWaveRangeRequirement(60, CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES[1])
    .withMaxAllowedEncounters(1)
    .withIntroSpriteConfigs([
      {
        spriteKey: Species.GARBODOR.toString() + "-gigantamax",
        fileRoot: "pokemon",
        hasShadow: false,
        disableAnimation: true,
        scale: 1.5,
        y: 8,
        tint: 0.4
      }
    ])
    .withAutoHideIntroVisuals(false)
    .withIntroDialogue([
      {
        text: `${namespace}:intro`,
      },
    ])
    .withTitle(`${namespace}:title`)
    .withDescription(`${namespace}:description`)
    .withQuery(`${namespace}:query`)
    .withOnInit((scene: BattleScene) => {
      const encounter = scene.currentBattle.mysteryEncounter!;

      // Calculate boss mon
      const bossSpecies = getPokemonSpecies(Species.GARBODOR);
      const pokemonConfig: EnemyPokemonConfig = {
        species: bossSpecies,
        isBoss: true,
        formIndex: 1, // Gmax
        bossSegmentModifier: 1, // +1 Segment from normal
        moveSet: [Moves.PAYBACK, Moves.GUNK_SHOT, Moves.STOMPING_TANTRUM, Moves.DRAIN_PUNCH]
      };
      const config: EnemyPartyConfig = {
        levelAdditiveModifier: 1,
        pokemonConfigs: [pokemonConfig],
        disableSwitch: true
      };
      encounter.enemyPartyConfigs = [config];

      // Load animations/sfx for Garbodor fight start moves
      loadCustomMovesForEncounter(scene, [Moves.TOXIC, Moves.AMNESIA]);

      scene.loadSe("PRSFX- Dig2", "battle_anims", "PRSFX- Dig2.wav");
      scene.loadSe("PRSFX- Venom Drench", "battle_anims", "PRSFX- Venom Drench.wav");

      encounter.setDialogueToken("costMultiplier", SHOP_ITEM_COST_MULTIPLIER.toString());

      return true;
    })
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
        .withDialogue({
          buttonLabel: `${namespace}:option.1.label`,
          buttonTooltip: `${namespace}:option.1.tooltip`,
          selected: [
            {
              text: `${namespace}:option.1.selected`,
            },
          ],
        })
        .withPreOptionPhase(async (scene: BattleScene) => {
          // Play Dig2 and then Venom Drench sfx
          doGarbageDig(scene);
        })
        .withOptionPhase(async (scene: BattleScene) => {
          // Gain 2 Leftovers and 2 Shell Bell
          transitionMysteryEncounterIntroVisuals(scene);
          await tryApplyDigRewardItems(scene);

          const blackSludge = generateModifierType(scene, modifierTypes.MYSTERY_ENCOUNTER_BLACK_SLUDGE, [SHOP_ITEM_COST_MULTIPLIER]);
          const modifier = blackSludge?.newModifier();
          if (modifier) {
            await scene.addModifier(modifier, false, false, false, true);
            scene.playSound("battle_anims/PRSFX- Venom Drench", { volume: 2 });
            await showEncounterText(scene, i18next.t("battle:rewardGain", { modifierName: modifier.type.name }), null, undefined, true);
          }

          leaveEncounterWithoutBattle(scene, true);
        })
        .build()
    )
    .withOption(
      MysteryEncounterOptionBuilder
        .newOptionWithMode(MysteryEncounterOptionMode.DEFAULT)
        .withDialogue({
          buttonLabel: `${namespace}:option.2.label`,
          buttonTooltip: `${namespace}:option.2.tooltip`,
          selected: [
            {
              text: `${namespace}:option.2.selected`,
            },
          ],
        })
        .withOptionPhase(async (scene: BattleScene) => {
          // Investigate garbage, battle Gmax Garbodor
          scene.setFieldScale(0.75);
          await showEncounterText(scene, `${namespace}:option.2.selected_2`);
          transitionMysteryEncounterIntroVisuals(scene);

          const encounter = scene.currentBattle.mysteryEncounter!;

          setEncounterRewards(scene, { guaranteedModifierTiers: [ModifierTier.ROGUE, ModifierTier.ROGUE, ModifierTier.ULTRA, ModifierTier.GREAT], fillRemaining: true });
          encounter.startOfBattleEffects.push(
            {
              sourceBattlerIndex: BattlerIndex.ENEMY,
              targets: [BattlerIndex.PLAYER],
              move: new PokemonMove(Moves.TOXIC),
              ignorePp: true
            },
            {
              sourceBattlerIndex: BattlerIndex.ENEMY,
              targets: [BattlerIndex.ENEMY],
              move: new PokemonMove(Moves.AMNESIA),
              ignorePp: true
            });
          await initBattleWithEnemyConfig(scene, encounter.enemyPartyConfigs[0]);
        })
        .build()
    )
    .build();

async function tryApplyDigRewardItems(scene: BattleScene) {
  const shellBell = generateModifierType(scene, modifierTypes.SHELL_BELL) as PokemonHeldItemModifierType;
  const leftovers = generateModifierType(scene, modifierTypes.LEFTOVERS) as PokemonHeldItemModifierType;

  const party = scene.getParty();

  // Iterate over the party until an item was successfully given
  // First leftovers
  for (const pokemon of party) {
    const heldItems = scene.findModifiers(m => m instanceof PokemonHeldItemModifier
      && m.pokemonId === pokemon.id, true) as PokemonHeldItemModifier[];
    const existingLeftovers = heldItems.find(m => m instanceof TurnHealModifier) as TurnHealModifier;

    if (!existingLeftovers || existingLeftovers.getStackCount() < existingLeftovers.getMaxStackCount(scene)) {
      await applyModifierTypeToPlayerPokemon(scene, pokemon, leftovers);
      break;
    }
  }

  // Second leftovers
  for (const pokemon of party) {
    const heldItems = scene.findModifiers(m => m instanceof PokemonHeldItemModifier
      && m.pokemonId === pokemon.id, true) as PokemonHeldItemModifier[];
    const existingLeftovers = heldItems.find(m => m instanceof TurnHealModifier) as TurnHealModifier;

    if (!existingLeftovers || existingLeftovers.getStackCount() < existingLeftovers.getMaxStackCount(scene)) {
      await applyModifierTypeToPlayerPokemon(scene, pokemon, leftovers);
      break;
    }
  }

  scene.playSound("item_fanfare");
  await showEncounterText(scene, i18next.t("battle:rewardGain", { modifierName: "2x " + leftovers.name }), null, undefined, true);

  // First Shell bell
  for (const pokemon of party) {
    const heldItems = scene.findModifiers(m => m instanceof PokemonHeldItemModifier
      && m.pokemonId === pokemon.id, true) as PokemonHeldItemModifier[];
    const existingShellBell = heldItems.find(m => m instanceof HitHealModifier) as HitHealModifier;

    if (!existingShellBell || existingShellBell.getStackCount() < existingShellBell.getMaxStackCount(scene)) {
      await applyModifierTypeToPlayerPokemon(scene, pokemon, shellBell);
      break;
    }
  }

  // Second Shell bell
  for (const pokemon of party) {
    const heldItems = scene.findModifiers(m => m instanceof PokemonHeldItemModifier
      && m.pokemonId === pokemon.id, true) as PokemonHeldItemModifier[];
    const existingShellBell = heldItems.find(m => m instanceof HitHealModifier) as HitHealModifier;

    if (!existingShellBell || existingShellBell.getStackCount() < existingShellBell.getMaxStackCount(scene)) {
      await applyModifierTypeToPlayerPokemon(scene, pokemon, shellBell);
      break;
    }
  }

  scene.playSound("item_fanfare");
  await showEncounterText(scene, i18next.t("battle:rewardGain", { modifierName: "2x " + shellBell.name }), null, undefined, true);
}

async function doGarbageDig(scene: BattleScene) {
  scene.playSound("battle_anims/PRSFX- Dig2");
  scene.time.delayedCall(SOUND_EFFECT_WAIT_TIME, () => {
    scene.playSound("battle_anims/PRSFX- Dig2");
    scene.playSound("battle_anims/PRSFX- Venom Drench", { volume: 2 });
  });
  scene.time.delayedCall(SOUND_EFFECT_WAIT_TIME * 2, () => {
    scene.playSound("battle_anims/PRSFX- Dig2");
  });
}
