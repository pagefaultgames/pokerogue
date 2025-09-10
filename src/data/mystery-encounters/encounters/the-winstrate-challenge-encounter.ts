import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/constants";
import { globalScene } from "#app/global-scene";
import { SpeciesFormChangeAbilityTrigger } from "#data/form-change-triggers";
import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { MysteryEncounterMode } from "#enums/mystery-encounter-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { Nature } from "#enums/nature";
import { RewardId } from "#enums/reward-id";
import { RarityTier } from "#enums/reward-tier";
import { SpeciesId } from "#enums/species-id";
import { TrainerType } from "#enums/trainer-type";
import type { Reward } from "#items/reward";
import { generateRewardOptionFromId } from "#items/reward-utils";
import { showEncounterDialogue, showEncounterText } from "#mystery-encounters/encounter-dialogue-utils";
import type { EnemyPartyConfig } from "#mystery-encounters/encounter-phase-utils";
import {
  initBattleWithEnemyConfig,
  leaveEncounterWithoutBattle,
  setEncounterRewards,
  transitionMysteryEncounterIntroVisuals,
} from "#mystery-encounters/encounter-phase-utils";
import type { MysteryEncounter } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterBuilder } from "#mystery-encounters/mystery-encounter";
import { getPokemonSpecies } from "#utils/pokemon-utils";
import i18next from "i18next";

// TODO: make all items unstealable

/** the i18n namespace for the encounter */
const namespace = "mysteryEncounters/theWinstrateChallenge";

/**
 * The Winstrate Challenge encounter.
 * @see {@link https://github.com/pagefaultgames/pokerogue/issues/3821 | GitHub Issue #3821}
 * @see For biome requirements check {@linkcode mysteryEncountersByBiome}
 */
export const TheWinstrateChallengeEncounter: MysteryEncounter = MysteryEncounterBuilder.withEncounterType(
  MysteryEncounterType.THE_WINSTRATE_CHALLENGE,
)
  .withEncounterTier(MysteryEncounterTier.ROGUE)
  .withSceneWaveRangeRequirement(100, CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES[1])
  .withIntroSpriteConfigs([
    {
      spriteKey: "vito",
      fileRoot: "trainer",
      hasShadow: false,
      x: 16,
      y: -4,
    },
    {
      spriteKey: "vivi",
      fileRoot: "trainer",
      hasShadow: false,
      x: -14,
      y: -4,
    },
    {
      spriteKey: "victor",
      fileRoot: "trainer",
      hasShadow: true,
      x: -32,
    },
    {
      spriteKey: "victoria",
      fileRoot: "trainer",
      hasShadow: true,
      x: 40,
    },
    {
      spriteKey: "vicky",
      fileRoot: "trainer",
      hasShadow: true,
      x: 3,
      y: 5,
      yShadow: 5,
    },
  ])
  .withIntroDialogue([
    {
      text: `${namespace}:intro`,
    },
    {
      speaker: `${namespace}:speaker`,
      text: `${namespace}:introDialogue`,
    },
  ])
  .withAutoHideIntroVisuals(false)
  .withOnInit(() => {
    const encounter = globalScene.currentBattle.mysteryEncounter!;

    // Loaded back to front for pop() operations
    encounter.enemyPartyConfigs.push(getVitoTrainerConfig());
    encounter.enemyPartyConfigs.push(getVickyTrainerConfig());
    encounter.enemyPartyConfigs.push(getViviTrainerConfig());
    encounter.enemyPartyConfigs.push(getVictoriaTrainerConfig());
    encounter.enemyPartyConfigs.push(getVictorTrainerConfig());

    return true;
  })
  .setLocalizationKey(`${namespace}`)
  .withTitle(`${namespace}:title`)
  .withDescription(`${namespace}:description`)
  .withQuery(`${namespace}:query`)
  .withSimpleOption(
    {
      buttonLabel: `${namespace}:option.1.label`,
      buttonTooltip: `${namespace}:option.1.tooltip`,
      selected: [
        {
          speaker: `${namespace}:speaker`,
          text: `${namespace}:option.1.selected`,
        },
      ],
    },
    async () => {
      // Spawn 5 trainer battles back to back with Macho Brace in rewards
      globalScene.currentBattle.mysteryEncounter!.doContinueEncounter = async () => {
        await endTrainerBattleAndShowDialogue();
      };
      await transitionMysteryEncounterIntroVisuals(true, false);
      await spawnNextTrainerOrEndEncounter();
    },
  )
  .withSimpleOption(
    {
      buttonLabel: `${namespace}:option.2.label`,
      buttonTooltip: `${namespace}:option.2.tooltip`,
      selected: [
        {
          speaker: `${namespace}:speaker`,
          text: `${namespace}:option.2.selected`,
        },
      ],
    },
    async () => {
      // Refuse the challenge, they full heal the party and give the player a Rarer Candy
      globalScene.phaseManager.unshiftNew("PartyHealPhase", true);
      setEncounterRewards({
        guaranteedRewardSpecs: [RewardId.RARER_CANDY],
        fillRemaining: false,
      });
      leaveEncounterWithoutBattle();
    },
  )
  .build();

async function spawnNextTrainerOrEndEncounter() {
  const encounter = globalScene.currentBattle.mysteryEncounter!;
  const nextConfig = encounter.enemyPartyConfigs.pop();
  if (!nextConfig) {
    await transitionMysteryEncounterIntroVisuals(false, false);
    await showEncounterDialogue(`${namespace}:victory`, `${namespace}:speaker`);

    // Give 10x Voucher
    const reward = generateRewardOptionFromId(RewardId.VOUCHER_PREMIUM).type;
    globalScene.applyReward(reward as Reward, {});
    globalScene.playSound("item_fanfare");
    await showEncounterText(i18next.t("battle:rewardGain", { modifierName: (reward as Reward).name }));

    await showEncounterDialogue(`${namespace}:victory2`, `${namespace}:speaker`);
    globalScene.ui.clearText(); // Clears "Winstrate" title from screen as rewards get animated in
    const machoBrace = generateRewardOptionFromId(HeldItemId.MACHO_BRACE)!;
    machoBrace.type.tier = RarityTier.MASTER;
    setEncounterRewards({
      guaranteedRewardOptions: [machoBrace],
      fillRemaining: false,
    });
    encounter.doContinueEncounter = undefined;
    leaveEncounterWithoutBattle(false, MysteryEncounterMode.NO_BATTLE);
  } else {
    await initBattleWithEnemyConfig(nextConfig);
  }
}

function endTrainerBattleAndShowDialogue(): Promise<void> {
  // biome-ignore lint/suspicious/noAsyncPromiseExecutor: TODO: Consider refactoring to avoid async promise executor
  return new Promise(async resolve => {
    if (globalScene.currentBattle.mysteryEncounter!.enemyPartyConfigs.length === 0) {
      // Battle is over
      const trainer = globalScene.currentBattle.trainer;
      if (trainer) {
        globalScene.tweens.add({
          targets: trainer,
          x: "+=16",
          y: "-=16",
          alpha: 0,
          ease: "Sine.easeInOut",
          duration: 750,
          onComplete: () => {
            globalScene.field.remove(trainer, true);
          },
        });
      }

      await spawnNextTrainerOrEndEncounter();
      resolve(); // Wait for all dialogue/post battle stuff to complete before resolving
    } else {
      globalScene.arena.resetArenaEffects();
      const playerField = globalScene.getPlayerField();
      for (const pokemon of playerField) {
        pokemon.lapseTag(BattlerTagType.COMMANDED);
      }
      playerField.forEach((_, p) => globalScene.phaseManager.unshiftNew("ReturnPhase", p));

      for (const pokemon of globalScene.getPlayerParty()) {
        // Only trigger form change when Eiscue is in Noice form
        // Hardcoded Eiscue for now in case it is fused with another pokemon
        if (
          pokemon.species.speciesId === SpeciesId.EISCUE
          && pokemon.hasAbility(AbilityId.ICE_FACE)
          && pokemon.formIndex === 1
        ) {
          globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeAbilityTrigger);
        }

        // Each trainer battle is supposed to be a new fight, so reset all per-battle activation effects
        pokemon.resetBattleAndWaveData();
        applyAbAttrs("PostBattleInitAbAttr", { pokemon });
      }

      globalScene.phaseManager.unshiftNew("ShowTrainerPhase");
      // Hide the trainer and init next battle
      const trainer = globalScene.currentBattle.trainer;
      // Unassign previous trainer from battle so it isn't destroyed before animation completes
      globalScene.currentBattle.trainer = null;
      await spawnNextTrainerOrEndEncounter();
      if (trainer) {
        globalScene.tweens.add({
          targets: trainer,
          x: "+=16",
          y: "-=16",
          alpha: 0,
          ease: "Sine.easeInOut",
          duration: 750,
          onComplete: () => {
            globalScene.field.remove(trainer, true);
            resolve();
          },
        });
      }
    }
  });
}

function getVictorTrainerConfig(): EnemyPartyConfig {
  return {
    trainerType: TrainerType.VICTOR,
    pokemonConfigs: [
      {
        species: getPokemonSpecies(SpeciesId.SWELLOW),
        isBoss: false,
        abilityIndex: 0, // Guts
        nature: Nature.ADAMANT,
        moveSet: [MoveId.FACADE, MoveId.BRAVE_BIRD, MoveId.PROTECT, MoveId.QUICK_ATTACK],
        heldItemConfig: [
          { entry: HeldItemId.FLAME_ORB, count: 1 },
          { entry: HeldItemId.FOCUS_BAND, count: 2 },
        ],
      },
      {
        species: getPokemonSpecies(SpeciesId.OBSTAGOON),
        isBoss: false,
        abilityIndex: 1, // Guts
        nature: Nature.ADAMANT,
        moveSet: [MoveId.FACADE, MoveId.OBSTRUCT, MoveId.NIGHT_SLASH, MoveId.FIRE_PUNCH],
        heldItemConfig: [
          { entry: HeldItemId.FLAME_ORB, count: 1 },
          { entry: HeldItemId.LEFTOVERS, count: 2 },
        ],
      },
    ],
  };
}

function getVictoriaTrainerConfig(): EnemyPartyConfig {
  return {
    trainerType: TrainerType.VICTORIA,
    pokemonConfigs: [
      {
        species: getPokemonSpecies(SpeciesId.ROSERADE),
        isBoss: false,
        abilityIndex: 0, // Natural Cure
        nature: Nature.CALM,
        moveSet: [MoveId.SYNTHESIS, MoveId.SLUDGE_BOMB, MoveId.GIGA_DRAIN, MoveId.SLEEP_POWDER],
        heldItemConfig: [
          { entry: HeldItemId.SOUL_DEW, count: 1 },
          { entry: HeldItemId.QUICK_CLAW, count: 2 },
        ],
      },
      {
        species: getPokemonSpecies(SpeciesId.GARDEVOIR),
        isBoss: false,
        formIndex: 1,
        nature: Nature.TIMID,
        moveSet: [MoveId.PSYSHOCK, MoveId.MOONBLAST, MoveId.SHADOW_BALL, MoveId.WILL_O_WISP],
        heldItemConfig: [
          { entry: HeldItemId.TWISTED_SPOON, count: 1 },
          { entry: HeldItemId.FAIRY_FEATHER, count: 1 },
        ],
      },
    ],
  };
}

function getViviTrainerConfig(): EnemyPartyConfig {
  return {
    trainerType: TrainerType.VIVI,
    pokemonConfigs: [
      {
        species: getPokemonSpecies(SpeciesId.SEAKING),
        isBoss: false,
        abilityIndex: 3, // Lightning Rod
        nature: Nature.ADAMANT,
        moveSet: [MoveId.WATERFALL, MoveId.MEGAHORN, MoveId.KNOCK_OFF, MoveId.REST],
        heldItemConfig: [
          { entry: HeldItemId.LUM_BERRY, count: 2 },
          { entry: HeldItemId.HP_UP, count: 4 },
        ],
      },
      {
        species: getPokemonSpecies(SpeciesId.BRELOOM),
        isBoss: false,
        abilityIndex: 1, // Poison Heal
        nature: Nature.JOLLY,
        moveSet: [MoveId.SPORE, MoveId.SWORDS_DANCE, MoveId.SEED_BOMB, MoveId.DRAIN_PUNCH],
        heldItemConfig: [
          { entry: HeldItemId.HP_UP, count: 4 },
          { entry: HeldItemId.TOXIC_ORB, count: 1 },
        ],
      },
      {
        species: getPokemonSpecies(SpeciesId.CAMERUPT),
        isBoss: false,
        formIndex: 1,
        nature: Nature.CALM,
        moveSet: [MoveId.EARTH_POWER, MoveId.FIRE_BLAST, MoveId.YAWN, MoveId.PROTECT],
        heldItemConfig: [{ entry: HeldItemId.QUICK_CLAW, count: 3 }],
      },
    ],
  };
}

function getVickyTrainerConfig(): EnemyPartyConfig {
  return {
    trainerType: TrainerType.VICKY,
    pokemonConfigs: [
      {
        species: getPokemonSpecies(SpeciesId.MEDICHAM),
        isBoss: false,
        formIndex: 1,
        nature: Nature.IMPISH,
        moveSet: [MoveId.AXE_KICK, MoveId.ICE_PUNCH, MoveId.ZEN_HEADBUTT, MoveId.BULLET_PUNCH],
        heldItemConfig: [{ entry: HeldItemId.SHELL_BELL, count: 1 }],
      },
    ],
  };
}

function getVitoTrainerConfig(): EnemyPartyConfig {
  return {
    trainerType: TrainerType.VITO,
    pokemonConfigs: [
      {
        species: getPokemonSpecies(SpeciesId.HISUI_ELECTRODE),
        isBoss: false,
        abilityIndex: 0, // Soundproof
        nature: Nature.MODEST,
        moveSet: [MoveId.THUNDERBOLT, MoveId.GIGA_DRAIN, MoveId.FOUL_PLAY, MoveId.THUNDER_WAVE],
        heldItemConfig: [{ entry: HeldItemId.ZINC, count: 2 }],
      },
      {
        species: getPokemonSpecies(SpeciesId.SWALOT),
        isBoss: false,
        abilityIndex: 2, // Gluttony
        nature: Nature.QUIET,
        moveSet: [MoveId.SLUDGE_BOMB, MoveId.GIGA_DRAIN, MoveId.ICE_BEAM, MoveId.EARTHQUAKE],
        heldItemConfig: [
          { entry: HeldItemId.SITRUS_BERRY, count: 2 },
          { entry: HeldItemId.APICOT_BERRY, count: 2 },
          { entry: HeldItemId.GANLON_BERRY, count: 2 },
          { entry: HeldItemId.STARF_BERRY, count: 2 },
          { entry: HeldItemId.SALAC_BERRY, count: 2 },
          { entry: HeldItemId.LUM_BERRY, count: 2 },
          { entry: HeldItemId.LANSAT_BERRY, count: 2 },
          { entry: HeldItemId.LIECHI_BERRY, count: 2 },
          { entry: HeldItemId.PETAYA_BERRY, count: 2 },
          { entry: HeldItemId.ENIGMA_BERRY, count: 2 },
          { entry: HeldItemId.LEPPA_BERRY, count: 2 },
        ],
      },
      {
        species: getPokemonSpecies(SpeciesId.DODRIO),
        isBoss: false,
        abilityIndex: 2, // Tangled Feet
        nature: Nature.JOLLY,
        moveSet: [MoveId.DRILL_PECK, MoveId.QUICK_ATTACK, MoveId.THRASH, MoveId.KNOCK_OFF],
        heldItemConfig: [{ entry: HeldItemId.KINGS_ROCK, count: 2 }],
      },
      {
        species: getPokemonSpecies(SpeciesId.ALAKAZAM),
        isBoss: false,
        formIndex: 1,
        nature: Nature.BOLD,
        moveSet: [MoveId.PSYCHIC, MoveId.SHADOW_BALL, MoveId.FOCUS_BLAST, MoveId.THUNDERBOLT],
        heldItemConfig: [{ entry: HeldItemId.WIDE_LENS, count: 2 }],
      },
      {
        species: getPokemonSpecies(SpeciesId.DARMANITAN),
        isBoss: false,
        abilityIndex: 0, // Sheer Force
        nature: Nature.IMPISH,
        moveSet: [MoveId.EARTHQUAKE, MoveId.U_TURN, MoveId.FLARE_BLITZ, MoveId.ROCK_SLIDE],
        heldItemConfig: [{ entry: HeldItemId.QUICK_CLAW, count: 2 }],
      },
    ],
  };
}
