import { EnemyPartyConfig, EnemyPokemonConfig, generateModifierType, initBattleWithEnemyConfig, leaveEncounterWithoutBattle, loadCustomMovesForEncounter, setEncounterRewards, transitionMysteryEncounterIntroVisuals, } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { modifierTypes, PokemonHeldItemModifierType } from "#app/modifier/modifier-type";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { gScene } from "#app/battle-scene";
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
    .withFleeAllowed(false)
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
    .setLocalizationKey(`${namespace}`)
    .withTitle(`${namespace}:title`)
    .withDescription(`${namespace}:description`)
    .withQuery(`${namespace}:query`)
    .withOnInit(() => {
      const encounter = gScene.currentBattle.mysteryEncounter!;

      // Calculate boss mon
      const bossSpecies = getPokemonSpecies(Species.GARBODOR);
      const pokemonConfig: EnemyPokemonConfig = {
        species: bossSpecies,
        isBoss: true,
        formIndex: 1, // Gmax
        bossSegmentModifier: 1, // +1 Segment from normal
        moveSet: [ Moves.PAYBACK, Moves.GUNK_SHOT, Moves.STOMPING_TANTRUM, Moves.DRAIN_PUNCH ]
      };
      const config: EnemyPartyConfig = {
        levelAdditiveModifier: 0.5,
        pokemonConfigs: [ pokemonConfig ],
        disableSwitch: true
      };
      encounter.enemyPartyConfigs = [ config ];

      // Load animations/sfx for Garbodor fight start moves
      loadCustomMovesForEncounter([ Moves.TOXIC, Moves.AMNESIA ]);

      gScene.loadSe("PRSFX- Dig2", "battle_anims", "PRSFX- Dig2.wav");
      gScene.loadSe("PRSFX- Venom Drench", "battle_anims", "PRSFX- Venom Drench.wav");

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
        .withPreOptionPhase(async () => {
          // Play Dig2 and then Venom Drench sfx
          doGarbageDig();
        })
        .withOptionPhase(async () => {
          // Gain 2 Leftovers and 2 Shell Bell
          await transitionMysteryEncounterIntroVisuals();
          await tryApplyDigRewardItems();

          const blackSludge = generateModifierType(modifierTypes.MYSTERY_ENCOUNTER_BLACK_SLUDGE, [ SHOP_ITEM_COST_MULTIPLIER ]);
          const modifier = blackSludge?.newModifier();
          if (modifier) {
            await gScene.addModifier(modifier, false, false, false, true);
            gScene.playSound("battle_anims/PRSFX- Venom Drench", { volume: 2 });
            await showEncounterText(i18next.t("battle:rewardGain", { modifierName: modifier.type.name }), null, undefined, true);
          }

          leaveEncounterWithoutBattle(true);
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
        .withOptionPhase(async () => {
          // Investigate garbage, battle Gmax Garbodor
          gScene.setFieldScale(0.75);
          await showEncounterText(`${namespace}:option.2.selected_2`);
          await transitionMysteryEncounterIntroVisuals();

          const encounter = gScene.currentBattle.mysteryEncounter!;

          setEncounterRewards({ guaranteedModifierTiers: [ ModifierTier.ROGUE, ModifierTier.ROGUE, ModifierTier.ULTRA, ModifierTier.GREAT ], fillRemaining: true });
          encounter.startOfBattleEffects.push(
            {
              sourceBattlerIndex: BattlerIndex.ENEMY,
              targets: [ BattlerIndex.PLAYER ],
              move: new PokemonMove(Moves.TOXIC),
              ignorePp: true
            },
            {
              sourceBattlerIndex: BattlerIndex.ENEMY,
              targets: [ BattlerIndex.ENEMY ],
              move: new PokemonMove(Moves.AMNESIA),
              ignorePp: true
            });
          await initBattleWithEnemyConfig(encounter.enemyPartyConfigs[0]);
        })
        .build()
    )
    .build();

async function tryApplyDigRewardItems() {
  const shellBell = generateModifierType(modifierTypes.SHELL_BELL) as PokemonHeldItemModifierType;
  const leftovers = generateModifierType(modifierTypes.LEFTOVERS) as PokemonHeldItemModifierType;

  const party = gScene.getParty();

  // Iterate over the party until an item was successfully given
  // First leftovers
  for (const pokemon of party) {
    const heldItems = gScene.findModifiers(m => m instanceof PokemonHeldItemModifier
      && m.pokemonId === pokemon.id, true) as PokemonHeldItemModifier[];
    const existingLeftovers = heldItems.find(m => m instanceof TurnHealModifier) as TurnHealModifier;

    if (!existingLeftovers || existingLeftovers.getStackCount() < existingLeftovers.getMaxStackCount()) {
      await applyModifierTypeToPlayerPokemon(pokemon, leftovers);
      break;
    }
  }

  // Second leftovers
  for (const pokemon of party) {
    const heldItems = gScene.findModifiers(m => m instanceof PokemonHeldItemModifier
      && m.pokemonId === pokemon.id, true) as PokemonHeldItemModifier[];
    const existingLeftovers = heldItems.find(m => m instanceof TurnHealModifier) as TurnHealModifier;

    if (!existingLeftovers || existingLeftovers.getStackCount() < existingLeftovers.getMaxStackCount()) {
      await applyModifierTypeToPlayerPokemon(pokemon, leftovers);
      break;
    }
  }

  gScene.playSound("item_fanfare");
  await showEncounterText(i18next.t("battle:rewardGainCount", { modifierName: leftovers.name, count: 2 }), null, undefined, true);

  // First Shell bell
  for (const pokemon of party) {
    const heldItems = gScene.findModifiers(m => m instanceof PokemonHeldItemModifier
      && m.pokemonId === pokemon.id, true) as PokemonHeldItemModifier[];
    const existingShellBell = heldItems.find(m => m instanceof HitHealModifier) as HitHealModifier;

    if (!existingShellBell || existingShellBell.getStackCount() < existingShellBell.getMaxStackCount()) {
      await applyModifierTypeToPlayerPokemon(pokemon, shellBell);
      break;
    }
  }

  // Second Shell bell
  for (const pokemon of party) {
    const heldItems = gScene.findModifiers(m => m instanceof PokemonHeldItemModifier
      && m.pokemonId === pokemon.id, true) as PokemonHeldItemModifier[];
    const existingShellBell = heldItems.find(m => m instanceof HitHealModifier) as HitHealModifier;

    if (!existingShellBell || existingShellBell.getStackCount() < existingShellBell.getMaxStackCount()) {
      await applyModifierTypeToPlayerPokemon(pokemon, shellBell);
      break;
    }
  }

  gScene.playSound("item_fanfare");
  await showEncounterText(i18next.t("battle:rewardGainCount", { modifierName: shellBell.name, count: 2 }), null, undefined, true);
}

function doGarbageDig() {
  gScene.playSound("battle_anims/PRSFX- Dig2");
  gScene.time.delayedCall(SOUND_EFFECT_WAIT_TIME, () => {
    gScene.playSound("battle_anims/PRSFX- Dig2");
    gScene.playSound("battle_anims/PRSFX- Venom Drench", { volume: 2 });
  });
  gScene.time.delayedCall(SOUND_EFFECT_WAIT_TIME * 2, () => {
    gScene.playSound("battle_anims/PRSFX- Dig2");
  });
}
