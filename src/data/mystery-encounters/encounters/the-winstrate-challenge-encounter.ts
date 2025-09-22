import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/constants";
import { globalScene } from "#app/global-scene";
import { modifierTypes } from "#data/data-lists";
import { SpeciesFormChangeAbilityTrigger } from "#data/form-change-triggers";
import { AbilityId } from "#enums/ability-id";
import { BattlerTagType } from "#enums/battler-tag-type";
import { BerryType } from "#enums/berry-type";
import { ModifierTier } from "#enums/modifier-tier";
import { MoveId } from "#enums/move-id";
import { MysteryEncounterMode } from "#enums/mystery-encounter-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { Nature } from "#enums/nature";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { TrainerType } from "#enums/trainer-type";
import type { PokemonHeldItemModifierType } from "#modifiers/modifier-type";
import { showEncounterDialogue, showEncounterText } from "#mystery-encounters/encounter-dialogue-utils";
import type { EnemyPartyConfig } from "#mystery-encounters/encounter-phase-utils";
import {
  generateModifierType,
  generateModifierTypeOption,
  initBattleWithEnemyConfig,
  leaveEncounterWithoutBattle,
  setEncounterRewards,
  transitionMysteryEncounterIntroVisuals,
} from "#mystery-encounters/encounter-phase-utils";
import type { MysteryEncounter } from "#mystery-encounters/mystery-encounter";
import { MysteryEncounterBuilder } from "#mystery-encounters/mystery-encounter";
import { getPokemonSpecies } from "#utils/pokemon-utils";
import i18next from "i18next";

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
        guaranteedModifierTypeFuncs: [modifierTypes.RARER_CANDY],
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
    const newModifier = modifierTypes.VOUCHER_PREMIUM().newModifier();
    globalScene.addModifier(newModifier);
    globalScene.playSound("item_fanfare");
    await showEncounterText(i18next.t("battle:rewardGain", { modifierName: newModifier?.type.name }));

    await showEncounterDialogue(`${namespace}:victory2`, `${namespace}:speaker`);
    globalScene.ui.clearText(); // Clears "Winstrate" title from screen as rewards get animated in
    const machoBrace = generateModifierTypeOption(modifierTypes.MYSTERY_ENCOUNTER_MACHO_BRACE)!;
    machoBrace.type.tier = ModifierTier.MASTER;
    setEncounterRewards({
      guaranteedModifierTypeOptions: [machoBrace],
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
        modifierConfigs: [
          {
            modifier: generateModifierType(modifierTypes.FLAME_ORB) as PokemonHeldItemModifierType,
            isTransferable: false,
          },
          {
            modifier: generateModifierType(modifierTypes.FOCUS_BAND) as PokemonHeldItemModifierType,
            stackCount: 2,
            isTransferable: false,
          },
        ],
      },
      {
        species: getPokemonSpecies(SpeciesId.OBSTAGOON),
        isBoss: false,
        abilityIndex: 1, // Guts
        nature: Nature.ADAMANT,
        moveSet: [MoveId.FACADE, MoveId.OBSTRUCT, MoveId.NIGHT_SLASH, MoveId.FIRE_PUNCH],
        modifierConfigs: [
          {
            modifier: generateModifierType(modifierTypes.FLAME_ORB) as PokemonHeldItemModifierType,
            isTransferable: false,
          },
          {
            modifier: generateModifierType(modifierTypes.LEFTOVERS) as PokemonHeldItemModifierType,
            stackCount: 2,
            isTransferable: false,
          },
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
        modifierConfigs: [
          {
            modifier: generateModifierType(modifierTypes.SOUL_DEW) as PokemonHeldItemModifierType,
            isTransferable: false,
          },
          {
            modifier: generateModifierType(modifierTypes.QUICK_CLAW) as PokemonHeldItemModifierType,
            stackCount: 2,
            isTransferable: false,
          },
        ],
      },
      {
        species: getPokemonSpecies(SpeciesId.GARDEVOIR),
        isBoss: false,
        formIndex: 1,
        nature: Nature.TIMID,
        moveSet: [MoveId.PSYSHOCK, MoveId.MOONBLAST, MoveId.SHADOW_BALL, MoveId.WILL_O_WISP],
        modifierConfigs: [
          {
            modifier: generateModifierType(modifierTypes.ATTACK_TYPE_BOOSTER, [
              PokemonType.PSYCHIC,
            ]) as PokemonHeldItemModifierType,
            stackCount: 1,
            isTransferable: false,
          },
          {
            modifier: generateModifierType(modifierTypes.ATTACK_TYPE_BOOSTER, [
              PokemonType.FAIRY,
            ]) as PokemonHeldItemModifierType,
            stackCount: 1,
            isTransferable: false,
          },
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
        modifierConfigs: [
          {
            modifier: generateModifierType(modifierTypes.BERRY, [BerryType.LUM]) as PokemonHeldItemModifierType,
            stackCount: 2,
            isTransferable: false,
          },
          {
            modifier: generateModifierType(modifierTypes.BASE_STAT_BOOSTER, [Stat.HP]) as PokemonHeldItemModifierType,
            stackCount: 4,
            isTransferable: false,
          },
        ],
      },
      {
        species: getPokemonSpecies(SpeciesId.BRELOOM),
        isBoss: false,
        abilityIndex: 1, // Poison Heal
        nature: Nature.JOLLY,
        moveSet: [MoveId.SPORE, MoveId.SWORDS_DANCE, MoveId.SEED_BOMB, MoveId.DRAIN_PUNCH],
        modifierConfigs: [
          {
            modifier: generateModifierType(modifierTypes.BASE_STAT_BOOSTER, [Stat.HP]) as PokemonHeldItemModifierType,
            stackCount: 4,
            isTransferable: false,
          },
          {
            modifier: generateModifierType(modifierTypes.TOXIC_ORB) as PokemonHeldItemModifierType,
            isTransferable: false,
          },
        ],
      },
      {
        species: getPokemonSpecies(SpeciesId.CAMERUPT),
        isBoss: false,
        formIndex: 1,
        nature: Nature.CALM,
        moveSet: [MoveId.EARTH_POWER, MoveId.FIRE_BLAST, MoveId.YAWN, MoveId.PROTECT],
        modifierConfigs: [
          {
            modifier: generateModifierType(modifierTypes.QUICK_CLAW) as PokemonHeldItemModifierType,
            stackCount: 3,
            isTransferable: false,
          },
        ],
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
        modifierConfigs: [
          {
            modifier: generateModifierType(modifierTypes.SHELL_BELL) as PokemonHeldItemModifierType,
            isTransferable: false,
          },
        ],
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
        modifierConfigs: [
          {
            modifier: generateModifierType(modifierTypes.BASE_STAT_BOOSTER, [Stat.SPD]) as PokemonHeldItemModifierType,
            stackCount: 2,
            isTransferable: false,
          },
        ],
      },
      {
        species: getPokemonSpecies(SpeciesId.SWALOT),
        isBoss: false,
        abilityIndex: 2, // Gluttony
        nature: Nature.QUIET,
        moveSet: [MoveId.SLUDGE_BOMB, MoveId.GIGA_DRAIN, MoveId.ICE_BEAM, MoveId.EARTHQUAKE],
        modifierConfigs: [
          {
            modifier: generateModifierType(modifierTypes.BERRY, [BerryType.SITRUS]) as PokemonHeldItemModifierType,
            stackCount: 2,
          },
          {
            modifier: generateModifierType(modifierTypes.BERRY, [BerryType.APICOT]) as PokemonHeldItemModifierType,
            stackCount: 2,
          },
          {
            modifier: generateModifierType(modifierTypes.BERRY, [BerryType.GANLON]) as PokemonHeldItemModifierType,
            stackCount: 2,
          },
          {
            modifier: generateModifierType(modifierTypes.BERRY, [BerryType.STARF]) as PokemonHeldItemModifierType,
            stackCount: 2,
          },
          {
            modifier: generateModifierType(modifierTypes.BERRY, [BerryType.SALAC]) as PokemonHeldItemModifierType,
            stackCount: 2,
          },
          {
            modifier: generateModifierType(modifierTypes.BERRY, [BerryType.LUM]) as PokemonHeldItemModifierType,
            stackCount: 2,
          },
          {
            modifier: generateModifierType(modifierTypes.BERRY, [BerryType.LANSAT]) as PokemonHeldItemModifierType,
            stackCount: 2,
          },
          {
            modifier: generateModifierType(modifierTypes.BERRY, [BerryType.LIECHI]) as PokemonHeldItemModifierType,
            stackCount: 2,
          },
          {
            modifier: generateModifierType(modifierTypes.BERRY, [BerryType.PETAYA]) as PokemonHeldItemModifierType,
            stackCount: 2,
          },
          {
            modifier: generateModifierType(modifierTypes.BERRY, [BerryType.ENIGMA]) as PokemonHeldItemModifierType,
            stackCount: 2,
          },
          {
            modifier: generateModifierType(modifierTypes.BERRY, [BerryType.LEPPA]) as PokemonHeldItemModifierType,
            stackCount: 2,
          },
        ],
      },
      {
        species: getPokemonSpecies(SpeciesId.DODRIO),
        isBoss: false,
        abilityIndex: 2, // Tangled Feet
        nature: Nature.JOLLY,
        moveSet: [MoveId.DRILL_PECK, MoveId.QUICK_ATTACK, MoveId.THRASH, MoveId.KNOCK_OFF],
        modifierConfigs: [
          {
            modifier: generateModifierType(modifierTypes.KINGS_ROCK) as PokemonHeldItemModifierType,
            stackCount: 2,
            isTransferable: false,
          },
        ],
      },
      {
        species: getPokemonSpecies(SpeciesId.ALAKAZAM),
        isBoss: false,
        formIndex: 1,
        nature: Nature.BOLD,
        moveSet: [MoveId.PSYCHIC, MoveId.SHADOW_BALL, MoveId.FOCUS_BLAST, MoveId.THUNDERBOLT],
        modifierConfigs: [
          {
            modifier: generateModifierType(modifierTypes.WIDE_LENS) as PokemonHeldItemModifierType,
            stackCount: 2,
            isTransferable: false,
          },
        ],
      },
      {
        species: getPokemonSpecies(SpeciesId.DARMANITAN),
        isBoss: false,
        abilityIndex: 0, // Sheer Force
        nature: Nature.IMPISH,
        moveSet: [MoveId.EARTHQUAKE, MoveId.U_TURN, MoveId.FLARE_BLITZ, MoveId.ROCK_SLIDE],
        modifierConfigs: [
          {
            modifier: generateModifierType(modifierTypes.QUICK_CLAW) as PokemonHeldItemModifierType,
            stackCount: 2,
            isTransferable: false,
          },
        ],
      },
    ],
  };
}
