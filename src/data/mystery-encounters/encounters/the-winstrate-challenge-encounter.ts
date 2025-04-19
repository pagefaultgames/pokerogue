import type { EnemyPartyConfig } from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import {
  generateModifierType,
  generateModifierTypeOption,
  initBattleWithEnemyConfig,
  leaveEncounterWithoutBattle,
  setEncounterRewards,
  transitionMysteryEncounterIntroVisuals,
} from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import type { PokemonHeldItemModifierType } from "#app/modifier/modifier-type";
import { modifierTypes } from "#app/modifier/modifier-type";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { globalScene } from "#app/global-scene";
import type MysteryEncounter from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterBuilder } from "#app/data/mystery-encounters/mystery-encounter";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { TrainerType } from "#enums/trainer-type";
import { Species } from "#enums/species";
import { Abilities } from "#enums/abilities";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import { Moves } from "#enums/moves";
import { Nature } from "#enums/nature";
import { PokemonType } from "#enums/pokemon-type";
import { BerryType } from "#enums/berry-type";
import { Stat } from "#enums/stat";
import { SpeciesFormChangeAbilityTrigger } from "#app/data/pokemon-forms";
import { applyPostBattleInitAbAttrs, PostBattleInitAbAttr } from "#app/data/abilities/ability";
import { showEncounterDialogue, showEncounterText } from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import { MysteryEncounterMode } from "#enums/mystery-encounter-mode";
import { PartyHealPhase } from "#app/phases/party-heal-phase";
import { ShowTrainerPhase } from "#app/phases/show-trainer-phase";
import { ReturnPhase } from "#app/phases/return-phase";
import i18next from "i18next";
import { ModifierTier } from "#app/modifier/modifier-tier";
import { CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES } from "#app/constants";
import { BattlerTagType } from "#enums/battler-tag-type";

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
      text: `${namespace}:intro_dialogue`,
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
      globalScene.unshiftPhase(new PartyHealPhase(true));
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

    await showEncounterDialogue(`${namespace}:victory_2`, `${namespace}:speaker`);
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
      playerField.forEach((_, p) => globalScene.unshiftPhase(new ReturnPhase(p)));

      for (const pokemon of globalScene.getPlayerParty()) {
        // Only trigger form change when Eiscue is in Noice form
        // Hardcoded Eiscue for now in case it is fused with another pokemon
        if (
          pokemon.species.speciesId === Species.EISCUE &&
          pokemon.hasAbility(Abilities.ICE_FACE) &&
          pokemon.formIndex === 1
        ) {
          globalScene.triggerPokemonFormChange(pokemon, SpeciesFormChangeAbilityTrigger);
        }

        pokemon.resetBattleData();
        applyPostBattleInitAbAttrs(PostBattleInitAbAttr, pokemon);
      }

      globalScene.unshiftPhase(new ShowTrainerPhase());
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
        species: getPokemonSpecies(Species.SWELLOW),
        isBoss: false,
        abilityIndex: 0, // Guts
        nature: Nature.ADAMANT,
        moveSet: [Moves.FACADE, Moves.BRAVE_BIRD, Moves.PROTECT, Moves.QUICK_ATTACK],
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
        species: getPokemonSpecies(Species.OBSTAGOON),
        isBoss: false,
        abilityIndex: 1, // Guts
        nature: Nature.ADAMANT,
        moveSet: [Moves.FACADE, Moves.OBSTRUCT, Moves.NIGHT_SLASH, Moves.FIRE_PUNCH],
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
        species: getPokemonSpecies(Species.ROSERADE),
        isBoss: false,
        abilityIndex: 0, // Natural Cure
        nature: Nature.CALM,
        moveSet: [Moves.SYNTHESIS, Moves.SLUDGE_BOMB, Moves.GIGA_DRAIN, Moves.SLEEP_POWDER],
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
        species: getPokemonSpecies(Species.GARDEVOIR),
        isBoss: false,
        formIndex: 1,
        nature: Nature.TIMID,
        moveSet: [Moves.PSYSHOCK, Moves.MOONBLAST, Moves.SHADOW_BALL, Moves.WILL_O_WISP],
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
        species: getPokemonSpecies(Species.SEAKING),
        isBoss: false,
        abilityIndex: 3, // Lightning Rod
        nature: Nature.ADAMANT,
        moveSet: [Moves.WATERFALL, Moves.MEGAHORN, Moves.KNOCK_OFF, Moves.REST],
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
        species: getPokemonSpecies(Species.BRELOOM),
        isBoss: false,
        abilityIndex: 1, // Poison Heal
        nature: Nature.JOLLY,
        moveSet: [Moves.SPORE, Moves.SWORDS_DANCE, Moves.SEED_BOMB, Moves.DRAIN_PUNCH],
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
        species: getPokemonSpecies(Species.CAMERUPT),
        isBoss: false,
        formIndex: 1,
        nature: Nature.CALM,
        moveSet: [Moves.EARTH_POWER, Moves.FIRE_BLAST, Moves.YAWN, Moves.PROTECT],
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
        species: getPokemonSpecies(Species.MEDICHAM),
        isBoss: false,
        formIndex: 1,
        nature: Nature.IMPISH,
        moveSet: [Moves.AXE_KICK, Moves.ICE_PUNCH, Moves.ZEN_HEADBUTT, Moves.BULLET_PUNCH],
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
        species: getPokemonSpecies(Species.HISUI_ELECTRODE),
        isBoss: false,
        abilityIndex: 0, // Soundproof
        nature: Nature.MODEST,
        moveSet: [Moves.THUNDERBOLT, Moves.GIGA_DRAIN, Moves.FOUL_PLAY, Moves.THUNDER_WAVE],
        modifierConfigs: [
          {
            modifier: generateModifierType(modifierTypes.BASE_STAT_BOOSTER, [Stat.SPD]) as PokemonHeldItemModifierType,
            stackCount: 2,
            isTransferable: false,
          },
        ],
      },
      {
        species: getPokemonSpecies(Species.SWALOT),
        isBoss: false,
        abilityIndex: 2, // Gluttony
        nature: Nature.QUIET,
        moveSet: [Moves.SLUDGE_BOMB, Moves.GIGA_DRAIN, Moves.ICE_BEAM, Moves.EARTHQUAKE],
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
        species: getPokemonSpecies(Species.DODRIO),
        isBoss: false,
        abilityIndex: 2, // Tangled Feet
        nature: Nature.JOLLY,
        moveSet: [Moves.DRILL_PECK, Moves.QUICK_ATTACK, Moves.THRASH, Moves.KNOCK_OFF],
        modifierConfigs: [
          {
            modifier: generateModifierType(modifierTypes.KINGS_ROCK) as PokemonHeldItemModifierType,
            stackCount: 2,
            isTransferable: false,
          },
        ],
      },
      {
        species: getPokemonSpecies(Species.ALAKAZAM),
        isBoss: false,
        formIndex: 1,
        nature: Nature.BOLD,
        moveSet: [Moves.PSYCHIC, Moves.SHADOW_BALL, Moves.FOCUS_BLAST, Moves.THUNDERBOLT],
        modifierConfigs: [
          {
            modifier: generateModifierType(modifierTypes.WIDE_LENS) as PokemonHeldItemModifierType,
            stackCount: 2,
            isTransferable: false,
          },
        ],
      },
      {
        species: getPokemonSpecies(Species.DARMANITAN),
        isBoss: false,
        abilityIndex: 0, // Sheer Force
        nature: Nature.IMPISH,
        moveSet: [Moves.EARTHQUAKE, Moves.U_TURN, Moves.FLARE_BLITZ, Moves.ROCK_SLIDE],
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
