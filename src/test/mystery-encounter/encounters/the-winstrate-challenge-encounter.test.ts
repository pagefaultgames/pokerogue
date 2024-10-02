import * as MysteryEncounters from "#app/data/mystery-encounters/mystery-encounters";
import { HUMAN_TRANSITABLE_BIOMES } from "#app/data/mystery-encounters/mystery-encounters";
import { Biome } from "#app/enums/biome";
import { MysteryEncounterType } from "#app/enums/mystery-encounter-type";
import { Species } from "#app/enums/species";
import GameManager from "#app/test/utils/gameManager";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runMysteryEncounterToEnd } from "#test/mystery-encounter/encounter-test-utils";
import BattleScene from "#app/battle-scene";
import { Mode } from "#app/ui/ui";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { initSceneWithoutEncounterPhase } from "#test/utils/gameManagerUtils";
import { MysteryEncounterMode } from "#enums/mystery-encounter-mode";
import ModifierSelectUiHandler from "#app/ui/modifier-select-ui-handler";
import MysteryEncounter from "#app/data/mystery-encounters/mystery-encounter";
import { TrainerType } from "#enums/trainer-type";
import { Nature } from "#enums/nature";
import { Moves } from "#enums/moves";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import { TheWinstrateChallengeEncounter } from "#app/data/mystery-encounters/encounters/the-winstrate-challenge-encounter";
import { Status, StatusEffect } from "#app/data/status-effect";
import { MysteryEncounterRewardsPhase } from "#app/phases/mystery-encounter-phases";
import { CommandPhase } from "#app/phases/command-phase";
import { SelectModifierPhase } from "#app/phases/select-modifier-phase";
import { PartyHealPhase } from "#app/phases/party-heal-phase";
import { VictoryPhase } from "#app/phases/victory-phase";

const namespace = "mysteryEncounters/theWinstrateChallenge";
const defaultParty = [Species.LAPRAS, Species.GENGAR, Species.ABRA];
const defaultBiome = Biome.CAVE;
const defaultWave = 45;

describe("The Winstrate Challenge - Mystery Encounter", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let scene: BattleScene;

  beforeAll(() => {
    phaserGame = new Phaser.Game({ type: Phaser.HEADLESS });
  });

  beforeEach(async () => {
    game = new GameManager(phaserGame);
    scene = game.scene;
    game.override.mysteryEncounterChance(100);
    game.override.startingWave(defaultWave);
    game.override.startingBiome(defaultBiome);
    game.override.disableTrainerWaves();

    const biomeMap = new Map<Biome, MysteryEncounterType[]>([
      [Biome.VOLCANO, [MysteryEncounterType.FIGHT_OR_FLIGHT]],
    ]);
    HUMAN_TRANSITABLE_BIOMES.forEach(biome => {
      biomeMap.set(biome, [MysteryEncounterType.THE_WINSTRATE_CHALLENGE]);
    });
    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(biomeMap);
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.THE_WINSTRATE_CHALLENGE, defaultParty);

    expect(TheWinstrateChallengeEncounter.encounterType).toBe(MysteryEncounterType.THE_WINSTRATE_CHALLENGE);
    expect(TheWinstrateChallengeEncounter.encounterTier).toBe(MysteryEncounterTier.ROGUE);
    expect(TheWinstrateChallengeEncounter.dialogue).toBeDefined();
    expect(TheWinstrateChallengeEncounter.dialogue.intro).toStrictEqual([
      { text: `${namespace}:intro` },
      {
        speaker: `${namespace}:speaker`,
        text: `${namespace}:intro_dialogue`,
      }
    ]);
    expect(TheWinstrateChallengeEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}:title`);
    expect(TheWinstrateChallengeEncounter.dialogue.encounterOptionsDialogue?.description).toBe(`${namespace}:description`);
    expect(TheWinstrateChallengeEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}:query`);
    expect(TheWinstrateChallengeEncounter.options.length).toBe(2);
  });

  it("should not spawn outside of HUMAN_TRANSITABLE_BIOMES", async () => {
    game.override.mysteryEncounterTier(MysteryEncounterTier.GREAT);
    game.override.startingBiome(Biome.VOLCANO);
    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.THE_WINSTRATE_CHALLENGE);
  });

  it("should initialize fully", async () => {
    initSceneWithoutEncounterPhase(scene, defaultParty);
    scene.currentBattle.mysteryEncounter = new MysteryEncounter(TheWinstrateChallengeEncounter);
    const encounter = scene.currentBattle.mysteryEncounter!;
    scene.currentBattle.waveIndex = defaultWave;

    const { onInit } = encounter;

    expect(encounter.onInit).toBeDefined();

    encounter.populateDialogueTokensFromRequirements(scene);
    const onInitResult = onInit!(scene);

    expect(encounter.enemyPartyConfigs).toBeDefined();
    expect(encounter.enemyPartyConfigs.length).toBe(5);
    expect(encounter.enemyPartyConfigs).toEqual([
      {
        trainerType: TrainerType.VITO,
        pokemonConfigs: [
          {
            species: getPokemonSpecies(Species.HISUI_ELECTRODE),
            isBoss: false,
            abilityIndex: 0, // Soundproof
            nature: Nature.MODEST,
            moveSet: [Moves.THUNDERBOLT, Moves.GIGA_DRAIN, Moves.FOUL_PLAY, Moves.THUNDER_WAVE],
            modifierConfigs: expect.any(Array)
          },
          {
            species: getPokemonSpecies(Species.SWALOT),
            isBoss: false,
            abilityIndex: 2, // Gluttony
            nature: Nature.QUIET,
            moveSet: [Moves.SLUDGE_BOMB, Moves.GIGA_DRAIN, Moves.ICE_BEAM, Moves.EARTHQUAKE],
            modifierConfigs: expect.any(Array)
          },
          {
            species: getPokemonSpecies(Species.DODRIO),
            isBoss: false,
            abilityIndex: 2, // Tangled Feet
            nature: Nature.JOLLY,
            moveSet: [Moves.DRILL_PECK, Moves.QUICK_ATTACK, Moves.THRASH, Moves.KNOCK_OFF],
            modifierConfigs: expect.any(Array)
          },
          {
            species: getPokemonSpecies(Species.ALAKAZAM),
            isBoss: false,
            formIndex: 1,
            nature: Nature.BOLD,
            moveSet: [Moves.PSYCHIC, Moves.SHADOW_BALL, Moves.FOCUS_BLAST, Moves.THUNDERBOLT],
            modifierConfigs: expect.any(Array)
          },
          {
            species: getPokemonSpecies(Species.DARMANITAN),
            isBoss: false,
            abilityIndex: 0, // Sheer Force
            nature: Nature.IMPISH,
            moveSet: [Moves.EARTHQUAKE, Moves.U_TURN, Moves.FLARE_BLITZ, Moves.ROCK_SLIDE],
            modifierConfigs: expect.any(Array)
          }
        ]
      },
      {
        trainerType: TrainerType.VICKY,
        pokemonConfigs: [
          {
            species: getPokemonSpecies(Species.MEDICHAM),
            isBoss: false,
            formIndex: 1,
            nature: Nature.IMPISH,
            moveSet: [Moves.AXE_KICK, Moves.ICE_PUNCH, Moves.ZEN_HEADBUTT, Moves.BULLET_PUNCH],
            modifierConfigs: expect.any(Array)
          }
        ]
      },
      {
        trainerType: TrainerType.VIVI,
        pokemonConfigs: [
          {
            species: getPokemonSpecies(Species.SEAKING),
            isBoss: false,
            abilityIndex: 3, // Lightning Rod
            nature: Nature.ADAMANT,
            moveSet: [Moves.WATERFALL, Moves.MEGAHORN, Moves.KNOCK_OFF, Moves.REST],
            modifierConfigs: expect.any(Array)
          },
          {
            species: getPokemonSpecies(Species.BRELOOM),
            isBoss: false,
            abilityIndex: 1, // Poison Heal
            nature: Nature.JOLLY,
            moveSet: [Moves.SPORE, Moves.SWORDS_DANCE, Moves.SEED_BOMB, Moves.DRAIN_PUNCH],
            modifierConfigs: expect.any(Array)
          },
          {
            species: getPokemonSpecies(Species.CAMERUPT),
            isBoss: false,
            formIndex: 1,
            nature: Nature.CALM,
            moveSet: [Moves.EARTH_POWER, Moves.FIRE_BLAST, Moves.YAWN, Moves.PROTECT],
            modifierConfigs: expect.any(Array)
          }
        ]
      },
      {
        trainerType: TrainerType.VICTORIA,
        pokemonConfigs: [
          {
            species: getPokemonSpecies(Species.ROSERADE),
            isBoss: false,
            abilityIndex: 0, // Natural Cure
            nature: Nature.CALM,
            moveSet: [Moves.SYNTHESIS, Moves.SLUDGE_BOMB, Moves.GIGA_DRAIN, Moves.SLEEP_POWDER],
            modifierConfigs: expect.any(Array)
          },
          {
            species: getPokemonSpecies(Species.GARDEVOIR),
            isBoss: false,
            formIndex: 1,
            nature: Nature.TIMID,
            moveSet: [Moves.PSYSHOCK, Moves.MOONBLAST, Moves.SHADOW_BALL, Moves.WILL_O_WISP],
            modifierConfigs: expect.any(Array)
          }
        ]
      },
      {
        trainerType: TrainerType.VICTOR,
        pokemonConfigs: [
          {
            species: getPokemonSpecies(Species.SWELLOW),
            isBoss: false,
            abilityIndex: 0, // Guts
            nature: Nature.ADAMANT,
            moveSet: [Moves.FACADE, Moves.BRAVE_BIRD, Moves.PROTECT, Moves.QUICK_ATTACK],
            modifierConfigs: expect.any(Array)
          },
          {
            species: getPokemonSpecies(Species.OBSTAGOON),
            isBoss: false,
            abilityIndex: 1, // Guts
            nature: Nature.ADAMANT,
            moveSet: [Moves.FACADE, Moves.OBSTRUCT, Moves.NIGHT_SLASH, Moves.FIRE_PUNCH],
            modifierConfigs: expect.any(Array)
          }
        ]
      }
    ]);
    expect(encounter.spriteConfigs).toBeDefined();
    expect(encounter.spriteConfigs.length).toBe(5);
    expect(onInitResult).toBe(true);
  });

  describe("Option 1 - Normal Battle", () => {
    it("should have the correct properties", () => {
      const option = TheWinstrateChallengeEncounter.options[0];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.1.label`,
        buttonTooltip: `${namespace}:option.1.tooltip`,
        selected: [
          {
            speaker: `${namespace}:speaker`,
            text: `${namespace}:option.1.selected`,
          },
        ],
      });
    });

    it("should battle all 5 trainers for a Macho Brace reward", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.THE_WINSTRATE_CHALLENGE, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);

      expect(scene.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      expect(scene.currentBattle.trainer).toBeDefined();
      expect(scene.currentBattle.trainer!.config.trainerType).toBe(TrainerType.VICTOR);
      expect(scene.currentBattle.mysteryEncounter?.enemyPartyConfigs.length).toBe(4);
      expect(scene.currentBattle.mysteryEncounter?.encounterMode).toBe(MysteryEncounterMode.TRAINER_BATTLE);

      await skipBattleToNextBattle(game);
      expect(scene.currentBattle.trainer).toBeDefined();
      expect(scene.currentBattle.trainer!.config.trainerType).toBe(TrainerType.VICTORIA);
      expect(scene.currentBattle.mysteryEncounter?.enemyPartyConfigs.length).toBe(3);
      expect(scene.currentBattle.mysteryEncounter?.encounterMode).toBe(MysteryEncounterMode.TRAINER_BATTLE);

      await skipBattleToNextBattle(game);
      expect(scene.currentBattle.trainer).toBeDefined();
      expect(scene.currentBattle.trainer!.config.trainerType).toBe(TrainerType.VIVI);
      expect(scene.currentBattle.mysteryEncounter?.enemyPartyConfigs.length).toBe(2);
      expect(scene.currentBattle.mysteryEncounter?.encounterMode).toBe(MysteryEncounterMode.TRAINER_BATTLE);

      await skipBattleToNextBattle(game);
      expect(scene.currentBattle.trainer).toBeDefined();
      expect(scene.currentBattle.trainer!.config.trainerType).toBe(TrainerType.VICKY);
      expect(scene.currentBattle.mysteryEncounter?.enemyPartyConfigs.length).toBe(1);
      expect(scene.currentBattle.mysteryEncounter?.encounterMode).toBe(MysteryEncounterMode.TRAINER_BATTLE);

      await skipBattleToNextBattle(game);
      expect(scene.currentBattle.trainer).toBeDefined();
      expect(scene.currentBattle.trainer!.config.trainerType).toBe(TrainerType.VITO);
      expect(scene.currentBattle.mysteryEncounter?.enemyPartyConfigs.length).toBe(0);
      expect(scene.currentBattle.mysteryEncounter?.encounterMode).toBe(MysteryEncounterMode.TRAINER_BATTLE);

      // Should have Macho Brace in the rewards
      await skipBattleToNextBattle(game, true);
      await game.phaseInterceptor.to(SelectModifierPhase, false);
      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);
      await game.phaseInterceptor.run(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(1);
      expect(modifierSelectHandler.options[0].modifierTypeOption.type.id).toBe("MYSTERY_ENCOUNTER_MACHO_BRACE");
    }, 15000);
  });

  describe("Option 2 - Refuse the Challenge", () => {
    it("should have the correct properties", () => {
      const option = TheWinstrateChallengeEncounter.options[1];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.2.label`,
        buttonTooltip: `${namespace}:option.2.tooltip`,
        selected: [
          {
            speaker: `${namespace}:speaker`,
            text: `${namespace}:option.2.selected`,
          },
        ],
      });
    });

    it("Should fully heal the party", async () => {
      const phaseSpy = vi.spyOn(scene, "unshiftPhase");

      await game.runToMysteryEncounter(MysteryEncounterType.THE_WINSTRATE_CHALLENGE, defaultParty);
      await runMysteryEncounterToEnd(game, 2);

      const partyHealPhases = phaseSpy.mock.calls.filter(p => p[0] instanceof PartyHealPhase).map(p => p[0]);
      expect(partyHealPhases.length).toBe(1);
    });

    it("should have a Rarer Candy in the rewards", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.THE_WINSTRATE_CHALLENGE, defaultParty);
      await runMysteryEncounterToEnd(game, 2);
      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);
      await game.phaseInterceptor.run(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(1);
      expect(modifierSelectHandler.options[0].modifierTypeOption.type.id).toBe("RARER_CANDY");
    });
  });
});

/**
 * For any {@linkcode MysteryEncounter} that has a battle, can call this to skip battle and proceed to MysteryEncounterRewardsPhase
 * @param game
 * @param isFinalBattle
 */
async function skipBattleToNextBattle(game: GameManager, isFinalBattle: boolean = false) {
  game.scene.clearPhaseQueue();
  game.scene.clearPhaseQueueSplice();
  const commandUiHandler = game.scene.ui.handlers[Mode.COMMAND];
  commandUiHandler.clear();
  game.scene.getEnemyParty().forEach(p => {
    p.hp = 0;
    p.status = new Status(StatusEffect.FAINT);
    game.scene.field.remove(p);
  });
  game.phaseInterceptor["onHold"] = [];
  game.scene.pushPhase(new VictoryPhase(game.scene, 0));
  game.phaseInterceptor.superEndPhase();
  if (isFinalBattle) {
    await game.phaseInterceptor.to(MysteryEncounterRewardsPhase);
  } else {
    await game.phaseInterceptor.to(CommandPhase);
  }
}
