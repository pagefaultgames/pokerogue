import type { BattleScene } from "#app/battle-scene";
import { BiomeId } from "#enums/biome-id";
import { MoveId } from "#enums/move-id";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { SpeciesId } from "#enums/species-id";
import { TrainerType } from "#enums/trainer-type";
import { UiMode } from "#enums/ui-mode";
import { ContactHeldItemTransferChanceModifier } from "#modifiers/modifier";
import { PokemonMove } from "#moves/pokemon-move";
import { BugTypeSuperfanEncounter } from "#mystery-encounters/bug-type-superfan-encounter";
import * as encounterPhaseUtils from "#mystery-encounters/encounter-phase-utils";
import * as MysteryEncounters from "#mystery-encounters/mystery-encounters";
import { MysteryEncounterPhase } from "#phases/mystery-encounter-phases";
import {
  runMysteryEncounterToEnd,
  runSelectMysteryEncounterOption,
  skipBattleRunMysteryEncounterRewardsPhase,
} from "#test/mystery-encounter/encounter-test-utils";
import { GameManager } from "#test/test-utils/game-manager";
import { initSceneWithoutEncounterPhase } from "#test/test-utils/game-manager-utils";
import { ModifierSelectUiHandler } from "#ui/handlers/modifier-select-ui-handler";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const namespace = "mysteryEncounters/bugTypeSuperfan";
const defaultParty = [SpeciesId.LAPRAS, SpeciesId.GENGAR, SpeciesId.WEEDLE];
const defaultBiome = BiomeId.CAVE;
const defaultWave = 24;

const POOL_1_POKEMON = [
  SpeciesId.PARASECT,
  SpeciesId.VENOMOTH,
  SpeciesId.LEDIAN,
  SpeciesId.ARIADOS,
  SpeciesId.YANMA,
  SpeciesId.BEAUTIFLY,
  SpeciesId.DUSTOX,
  SpeciesId.MASQUERAIN,
  SpeciesId.NINJASK,
  SpeciesId.VOLBEAT,
  SpeciesId.ILLUMISE,
  SpeciesId.ANORITH,
  SpeciesId.KRICKETUNE,
  SpeciesId.WORMADAM,
  SpeciesId.MOTHIM,
  SpeciesId.SKORUPI,
  SpeciesId.JOLTIK,
  SpeciesId.LARVESTA,
  SpeciesId.VIVILLON,
  SpeciesId.CHARJABUG,
  SpeciesId.RIBOMBEE,
  SpeciesId.SPIDOPS,
  SpeciesId.LOKIX,
];

const POOL_2_POKEMON = [
  SpeciesId.SCYTHER,
  SpeciesId.PINSIR,
  SpeciesId.HERACROSS,
  SpeciesId.FORRETRESS,
  SpeciesId.SCIZOR,
  SpeciesId.SHUCKLE,
  SpeciesId.SHEDINJA,
  SpeciesId.ARMALDO,
  SpeciesId.VESPIQUEN,
  SpeciesId.DRAPION,
  SpeciesId.YANMEGA,
  SpeciesId.LEAVANNY,
  SpeciesId.SCOLIPEDE,
  SpeciesId.CRUSTLE,
  SpeciesId.ESCAVALIER,
  SpeciesId.ACCELGOR,
  SpeciesId.GALVANTULA,
  SpeciesId.VIKAVOLT,
  SpeciesId.ARAQUANID,
  SpeciesId.ORBEETLE,
  SpeciesId.CENTISKORCH,
  SpeciesId.FROSMOTH,
  SpeciesId.KLEAVOR,
];

const POOL_3_POKEMON: { species: SpeciesId; formIndex?: number }[] = [
  {
    species: SpeciesId.PINSIR,
    formIndex: 1,
  },
  {
    species: SpeciesId.SCIZOR,
    formIndex: 1,
  },
  {
    species: SpeciesId.HERACROSS,
    formIndex: 1,
  },
  {
    species: SpeciesId.ORBEETLE,
    formIndex: 1,
  },
  {
    species: SpeciesId.CENTISKORCH,
    formIndex: 1,
  },
  {
    species: SpeciesId.DURANT,
  },
  {
    species: SpeciesId.VOLCARONA,
  },
  {
    species: SpeciesId.GOLISOPOD,
  },
];

const POOL_4_POKEMON = [SpeciesId.GENESECT, SpeciesId.SLITHER_WING, SpeciesId.BUZZWOLE, SpeciesId.PHEROMOSA];

const PHYSICAL_TUTOR_MOVES = [
  MoveId.MEGAHORN,
  MoveId.ATTACK_ORDER,
  MoveId.BUG_BITE,
  MoveId.FIRST_IMPRESSION,
  MoveId.LUNGE,
];

const SPECIAL_TUTOR_MOVES = [
  MoveId.SILVER_WIND,
  MoveId.SIGNAL_BEAM,
  MoveId.BUG_BUZZ,
  MoveId.POLLEN_PUFF,
  MoveId.STRUGGLE_BUG,
];

const STATUS_TUTOR_MOVES = [
  MoveId.STRING_SHOT,
  MoveId.DEFEND_ORDER,
  MoveId.RAGE_POWDER,
  MoveId.STICKY_WEB,
  MoveId.SILK_TRAP,
];

const MISC_TUTOR_MOVES = [MoveId.LEECH_LIFE, MoveId.U_TURN, MoveId.HEAL_ORDER, MoveId.QUIVER_DANCE, MoveId.INFESTATION];

describe("Bug-Type Superfan - Mystery Encounter", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let scene: BattleScene;

  beforeAll(() => {
    phaserGame = new Phaser.Game({ type: Phaser.HEADLESS });
  });

  beforeEach(async () => {
    game = new GameManager(phaserGame);
    scene = game.scene;
    game.override
      .mysteryEncounterChance(100)
      .startingWave(defaultWave)
      .startingBiome(defaultBiome)
      .disableTrainerWaves();

    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(
      new Map<BiomeId, MysteryEncounterType[]>([[BiomeId.CAVE, [MysteryEncounterType.BUG_TYPE_SUPERFAN]]]),
    );
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.BUG_TYPE_SUPERFAN, defaultParty);

    expect(BugTypeSuperfanEncounter.encounterType).toBe(MysteryEncounterType.BUG_TYPE_SUPERFAN);
    expect(BugTypeSuperfanEncounter.encounterTier).toBe(MysteryEncounterTier.GREAT);
    expect(BugTypeSuperfanEncounter.dialogue).toBeDefined();
    expect(BugTypeSuperfanEncounter.dialogue.intro).toStrictEqual([
      {
        text: `${namespace}:intro`,
      },
      {
        speaker: `${namespace}:speaker`,
        text: `${namespace}:introDialogue`,
      },
    ]);
    expect(BugTypeSuperfanEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}:title`);
    expect(BugTypeSuperfanEncounter.dialogue.encounterOptionsDialogue?.description).toBe(`${namespace}:description`);
    expect(BugTypeSuperfanEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}:query`);
    expect(BugTypeSuperfanEncounter.options.length).toBe(3);
  });

  it("should initialize fully", async () => {
    initSceneWithoutEncounterPhase(scene, defaultParty);
    scene.currentBattle.mysteryEncounter = BugTypeSuperfanEncounter;

    const { onInit } = BugTypeSuperfanEncounter;

    expect(BugTypeSuperfanEncounter.onInit).toBeDefined();

    BugTypeSuperfanEncounter.populateDialogueTokensFromRequirements();
    const onInitResult = onInit!();
    const config = BugTypeSuperfanEncounter.enemyPartyConfigs[0];

    expect(config).toBeDefined();
    expect(config.trainerConfig?.trainerType).toBe(TrainerType.BUG_TYPE_SUPERFAN);
    expect(config.trainerConfig?.partyTemplates).toBeDefined();
    expect(config.female).toBe(true);
    expect(onInitResult).toBe(true);
  });

  describe("Option 1 - Battle the Bug-Type Superfan", () => {
    it("should have the correct properties", () => {
      const option = BugTypeSuperfanEncounter.options[0];
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

    it("should start battle against the Bug-Type Superfan with wave 30 party template", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.BUG_TYPE_SUPERFAN, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);

      const enemyParty = scene.getEnemyParty();
      expect(game).toBeAtPhase("CommandPhase");
      expect(enemyParty.length).toBe(2);
      expect(scene.currentBattle.trainer?.config.trainerType).toBe(TrainerType.BUG_TYPE_SUPERFAN);
      expect(enemyParty[0].species.speciesId).toBe(SpeciesId.BEEDRILL);
      expect(enemyParty[1].species.speciesId).toBe(SpeciesId.BUTTERFREE);
    });

    it("should start battle against the Bug-Type Superfan with wave 50 party template", async () => {
      game.override.startingWave(43);
      await game.runToMysteryEncounter(MysteryEncounterType.BUG_TYPE_SUPERFAN, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);

      const enemyParty = scene.getEnemyParty();
      expect(game).toBeAtPhase("CommandPhase");
      expect(enemyParty.length).toBe(3);
      expect(scene.currentBattle.trainer?.config.trainerType).toBe(TrainerType.BUG_TYPE_SUPERFAN);
      expect(enemyParty[0].species.speciesId).toBe(SpeciesId.BEEDRILL);
      expect(enemyParty[1].species.speciesId).toBe(SpeciesId.BUTTERFREE);
      expect(POOL_1_POKEMON.includes(enemyParty[2].species.speciesId)).toBe(true);
    });

    it("should start battle against the Bug-Type Superfan with wave 70 party template", async () => {
      game.override.startingWave(63);
      await game.runToMysteryEncounter(MysteryEncounterType.BUG_TYPE_SUPERFAN, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);

      const enemyParty = scene.getEnemyParty();
      expect(game).toBeAtPhase("CommandPhase");
      expect(enemyParty.length).toBe(4);
      expect(scene.currentBattle.trainer?.config.trainerType).toBe(TrainerType.BUG_TYPE_SUPERFAN);
      expect(enemyParty[0].species.speciesId).toBe(SpeciesId.BEEDRILL);
      expect(enemyParty[1].species.speciesId).toBe(SpeciesId.BUTTERFREE);
      expect(POOL_1_POKEMON.includes(enemyParty[2].species.speciesId)).toBe(true);
      expect(POOL_2_POKEMON.includes(enemyParty[3].species.speciesId)).toBe(true);
    });

    it("should start battle against the Bug-Type Superfan with wave 100 party template", async () => {
      game.override.startingWave(83);
      await game.runToMysteryEncounter(MysteryEncounterType.BUG_TYPE_SUPERFAN, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);

      const enemyParty = scene.getEnemyParty();
      expect(game).toBeAtPhase("CommandPhase");
      expect(enemyParty.length).toBe(5);
      expect(scene.currentBattle.trainer?.config.trainerType).toBe(TrainerType.BUG_TYPE_SUPERFAN);
      expect(enemyParty[0].species.speciesId).toBe(SpeciesId.BEEDRILL);
      expect(enemyParty[1].species.speciesId).toBe(SpeciesId.BUTTERFREE);
      expect(POOL_1_POKEMON.includes(enemyParty[2].species.speciesId)).toBe(true);
      expect(POOL_2_POKEMON.includes(enemyParty[3].species.speciesId)).toBe(true);
      expect(POOL_2_POKEMON.includes(enemyParty[4].species.speciesId)).toBe(true);
    });

    it("should start battle against the Bug-Type Superfan with wave 120 party template", async () => {
      game.override.startingWave(113);
      await game.runToMysteryEncounter(MysteryEncounterType.BUG_TYPE_SUPERFAN, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);

      const enemyParty = scene.getEnemyParty();
      expect(game).toBeAtPhase("CommandPhase");
      expect(enemyParty.length).toBe(5);
      expect(scene.currentBattle.trainer?.config.trainerType).toBe(TrainerType.BUG_TYPE_SUPERFAN);
      expect(enemyParty[0].species.speciesId).toBe(SpeciesId.BEEDRILL);
      expect(enemyParty[0].formIndex).toBe(1);
      expect(enemyParty[1].species.speciesId).toBe(SpeciesId.BUTTERFREE);
      expect(enemyParty[1].formIndex).toBe(1);
      expect(POOL_2_POKEMON.includes(enemyParty[2].species.speciesId)).toBe(true);
      expect(POOL_2_POKEMON.includes(enemyParty[3].species.speciesId)).toBe(true);
      expect(POOL_3_POKEMON.some(config => enemyParty[4].species.speciesId === config.species)).toBe(true);
    });

    it("should start battle against the Bug-Type Superfan with wave 140 party template", async () => {
      game.override.startingWave(133);
      await game.runToMysteryEncounter(MysteryEncounterType.BUG_TYPE_SUPERFAN, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);

      const enemyParty = scene.getEnemyParty();
      expect(game).toBeAtPhase("CommandPhase");
      expect(enemyParty.length).toBe(5);
      expect(scene.currentBattle.trainer?.config.trainerType).toBe(TrainerType.BUG_TYPE_SUPERFAN);
      expect(enemyParty[0].species.speciesId).toBe(SpeciesId.BEEDRILL);
      expect(enemyParty[0].formIndex).toBe(1);
      expect(enemyParty[1].species.speciesId).toBe(SpeciesId.BUTTERFREE);
      expect(enemyParty[1].formIndex).toBe(1);
      expect(POOL_2_POKEMON.includes(enemyParty[2].species.speciesId)).toBe(true);
      expect(POOL_3_POKEMON.some(config => enemyParty[3].species.speciesId === config.species)).toBe(true);
      expect(POOL_3_POKEMON.some(config => enemyParty[4].species.speciesId === config.species)).toBe(true);
    });

    it("should start battle against the Bug-Type Superfan with wave 160 party template", async () => {
      game.override.startingWave(153);
      await game.runToMysteryEncounter(MysteryEncounterType.BUG_TYPE_SUPERFAN, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);

      const enemyParty = scene.getEnemyParty();
      expect(game).toBeAtPhase("CommandPhase");
      expect(enemyParty.length).toBe(5);
      expect(scene.currentBattle.trainer?.config.trainerType).toBe(TrainerType.BUG_TYPE_SUPERFAN);
      expect(enemyParty[0].species.speciesId).toBe(SpeciesId.BEEDRILL);
      expect(enemyParty[0].formIndex).toBe(1);
      expect(enemyParty[1].species.speciesId).toBe(SpeciesId.BUTTERFREE);
      expect(enemyParty[1].formIndex).toBe(1);
      expect(POOL_2_POKEMON.includes(enemyParty[2].species.speciesId)).toBe(true);
      expect(POOL_3_POKEMON.some(config => enemyParty[3].species.speciesId === config.species)).toBe(true);
      expect(POOL_4_POKEMON.includes(enemyParty[4].species.speciesId)).toBe(true);
    });

    it("should start battle against the Bug-Type Superfan with wave 180 party template", async () => {
      game.override.startingWave(173);
      await game.runToMysteryEncounter(MysteryEncounterType.BUG_TYPE_SUPERFAN, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);

      const enemyParty = scene.getEnemyParty();
      expect(game).toBeAtPhase("CommandPhase");
      expect(enemyParty.length).toBe(5);
      expect(scene.currentBattle.trainer?.config.trainerType).toBe(TrainerType.BUG_TYPE_SUPERFAN);
      expect(enemyParty[0].species.speciesId).toBe(SpeciesId.BEEDRILL);
      expect(enemyParty[0].formIndex).toBe(1);
      expect(enemyParty[0].isBoss()).toBe(true);
      expect(enemyParty[0].bossSegments).toBe(2);
      expect(enemyParty[1].species.speciesId).toBe(SpeciesId.BUTTERFREE);
      expect(enemyParty[1].formIndex).toBe(1);
      expect(enemyParty[1].isBoss()).toBe(true);
      expect(enemyParty[1].bossSegments).toBe(2);
      expect(POOL_3_POKEMON.some(config => enemyParty[2].species.speciesId === config.species)).toBe(true);
      expect(POOL_3_POKEMON.some(config => enemyParty[3].species.speciesId === config.species)).toBe(true);
      expect(POOL_4_POKEMON.includes(enemyParty[4].species.speciesId)).toBe(true);
    });

    it("should let the player learn a Bug move after battle ends", async () => {
      const selectOptionSpy = vi.spyOn(encounterPhaseUtils, "selectOptionThenPokemon");
      await game.runToMysteryEncounter(MysteryEncounterType.BUG_TYPE_SUPERFAN, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);
      await skipBattleRunMysteryEncounterRewardsPhase(game, false);

      expect(game).toBeAtPhase("MysteryEncounterRewardsPhase");
      game.phaseInterceptor["prompts"] = []; // Clear out prompt handlers
      game.onNextPrompt("MysteryEncounterRewardsPhase", UiMode.OPTION_SELECT, () => {
        game.endPhase();
      });
      await game.phaseInterceptor.to("MysteryEncounterRewardsPhase");

      expect(selectOptionSpy).toHaveBeenCalledTimes(1);
      const optionData = selectOptionSpy.mock.calls[0][0];
      expect(PHYSICAL_TUTOR_MOVES.some(move => new PokemonMove(move).getName() === optionData[0].label)).toBe(true);
      expect(SPECIAL_TUTOR_MOVES.some(move => new PokemonMove(move).getName() === optionData[1].label)).toBe(true);
      expect(STATUS_TUTOR_MOVES.some(move => new PokemonMove(move).getName() === optionData[2].label)).toBe(true);
      expect(MISC_TUTOR_MOVES.some(move => new PokemonMove(move).getName() === optionData[3].label)).toBe(true);
    });
  });

  describe("Option 2 - Show off Bug Types", () => {
    it("should have the correct properties", () => {
      const option = BugTypeSuperfanEncounter.options[1];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.2.label`,
        buttonTooltip: `${namespace}:option.2.tooltip`,
        disabledButtonTooltip: `${namespace}:option.2.disabledTooltip`,
      });
    });

    it("should NOT be selectable if the player doesn't have any Bug types", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.BUG_TYPE_SUPERFAN, [SpeciesId.ABRA]);
      await game.phaseInterceptor.to("MysteryEncounterPhase", false);

      const encounterPhase = scene.phaseManager.getCurrentPhase();
      expect(encounterPhase?.constructor.name).toBe(MysteryEncounterPhase.name);
      const mysteryEncounterPhase = encounterPhase as MysteryEncounterPhase;
      vi.spyOn(mysteryEncounterPhase, "continueEncounter");
      vi.spyOn(mysteryEncounterPhase, "handleOptionSelect");
      vi.spyOn(scene.ui, "playError");

      await runSelectMysteryEncounterOption(game, 2);

      expect(game).toBeAtPhase("MysteryEncounterPhase");
      expect(scene.ui.playError).not.toHaveBeenCalled(); // No error sfx, option is disabled
      expect(mysteryEncounterPhase.handleOptionSelect).not.toHaveBeenCalled();
      expect(mysteryEncounterPhase.continueEncounter).not.toHaveBeenCalled();
    });

    it("should proceed to rewards screen with 0-1 Bug Types reward options", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.BUG_TYPE_SUPERFAN, defaultParty);
      await runMysteryEncounterToEnd(game, 2);

      expect(game).toBeAtPhase("SelectModifierPhase");
      await game.phaseInterceptor.to("SelectModifierPhase");

      expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(
        h => h instanceof ModifierSelectUiHandler,
      ) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(2);
      expect(modifierSelectHandler.options[0].modifierTypeOption.type.id).toBe("SUPER_LURE");
      expect(modifierSelectHandler.options[1].modifierTypeOption.type.id).toBe("GREAT_BALL");
    });

    it("should proceed to rewards screen with 2-3 Bug Types reward options", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.BUG_TYPE_SUPERFAN, [
        SpeciesId.BUTTERFREE,
        SpeciesId.BEEDRILL,
      ]);
      await runMysteryEncounterToEnd(game, 2);

      expect(game).toBeAtPhase("SelectModifierPhase");
      await game.phaseInterceptor.to("SelectModifierPhase");

      expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(
        h => h instanceof ModifierSelectUiHandler,
      ) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(3);
      expect(modifierSelectHandler.options[0].modifierTypeOption.type.id).toBe("QUICK_CLAW");
      expect(modifierSelectHandler.options[1].modifierTypeOption.type.id).toBe("MAX_LURE");
      expect(modifierSelectHandler.options[2].modifierTypeOption.type.id).toBe("ULTRA_BALL");
    });

    it("should proceed to rewards screen with 4-5 Bug Types reward options", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.BUG_TYPE_SUPERFAN, [
        SpeciesId.BUTTERFREE,
        SpeciesId.BEEDRILL,
        SpeciesId.GALVANTULA,
        SpeciesId.VOLCARONA,
      ]);
      await runMysteryEncounterToEnd(game, 2);

      expect(game).toBeAtPhase("SelectModifierPhase");
      await game.phaseInterceptor.to("SelectModifierPhase");

      expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(
        h => h instanceof ModifierSelectUiHandler,
      ) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(3);
      expect(modifierSelectHandler.options[0].modifierTypeOption.type.id).toBe("GRIP_CLAW");
      expect(modifierSelectHandler.options[1].modifierTypeOption.type.id).toBe("MAX_LURE");
      expect(modifierSelectHandler.options[2].modifierTypeOption.type.id).toBe("ROGUE_BALL");
    });

    it("should proceed to rewards screen with 6 Bug Types reward options (including form change item)", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.BUG_TYPE_SUPERFAN, [
        SpeciesId.BUTTERFREE,
        SpeciesId.BEEDRILL,
        SpeciesId.GALVANTULA,
        SpeciesId.VOLCARONA,
        SpeciesId.ANORITH,
        SpeciesId.GENESECT,
      ]);
      await runMysteryEncounterToEnd(game, 2);

      expect(game).toBeAtPhase("SelectModifierPhase");
      await game.phaseInterceptor.to("SelectModifierPhase");

      expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(
        h => h instanceof ModifierSelectUiHandler,
      ) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(4);
      expect(modifierSelectHandler.options[0].modifierTypeOption.type.id).toBe("MASTER_BALL");
      expect(modifierSelectHandler.options[1].modifierTypeOption.type.id).toBe("MEGA_BRACELET");
      expect(modifierSelectHandler.options[2].modifierTypeOption.type.id).toBe("DYNAMAX_BAND");
      expect(modifierSelectHandler.options[3].modifierTypeOption.type.id).toBe("FORM_CHANGE_ITEM");
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(encounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.BUG_TYPE_SUPERFAN, defaultParty);
      await runMysteryEncounterToEnd(game, 2);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });

  describe("Option 3 - Give a Bug Item", () => {
    it("should have the correct properties", () => {
      const option = BugTypeSuperfanEncounter.options[2];
      expect(option.optionMode).toBe(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT);
      expect(option.dialogue).toBeDefined();
      expect(option.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.3.label`,
        buttonTooltip: `${namespace}:option.3.tooltip`,
        disabledButtonTooltip: `${namespace}:option.3.disabledTooltip`,
        selected: [
          {
            text: `${namespace}:option.3.selected`,
          },
          {
            speaker: `${namespace}:speaker`,
            text: `${namespace}:option.3.selectedDialogue`,
          },
        ],
        secondOptionPrompt: `${namespace}:option.3.selectPrompt`,
      });
    });

    it("should NOT be selectable if the player doesn't have any Bug items", async () => {
      game.scene.modifiers = [];
      await game.runToMysteryEncounter(MysteryEncounterType.BUG_TYPE_SUPERFAN, defaultParty);
      await game.phaseInterceptor.to("MysteryEncounterPhase", false);

      game.scene.modifiers = [];
      const encounterPhase = scene.phaseManager.getCurrentPhase();
      expect(encounterPhase?.constructor.name).toBe(MysteryEncounterPhase.name);
      const mysteryEncounterPhase = encounterPhase as MysteryEncounterPhase;
      vi.spyOn(mysteryEncounterPhase, "continueEncounter");
      vi.spyOn(mysteryEncounterPhase, "handleOptionSelect");
      vi.spyOn(scene.ui, "playError");

      await runSelectMysteryEncounterOption(game, 3);

      expect(game).toBeAtPhase("MysteryEncounterPhase");
      expect(scene.ui.playError).not.toHaveBeenCalled(); // No error sfx, option is disabled
      expect(mysteryEncounterPhase.handleOptionSelect).not.toHaveBeenCalled();
      expect(mysteryEncounterPhase.continueEncounter).not.toHaveBeenCalled();
    });

    it("should remove the gifted item and proceed to rewards screen", async () => {
      game.override.startingHeldItems([{ name: "GRIP_CLAW", count: 1 }]);
      await game.runToMysteryEncounter(MysteryEncounterType.BUG_TYPE_SUPERFAN, [SpeciesId.BUTTERFREE]);

      const gripClawCountBefore =
        scene.findModifier(m => m instanceof ContactHeldItemTransferChanceModifier)?.stackCount ?? 0;

      await runMysteryEncounterToEnd(game, 3, { pokemonNo: 1, optionNo: 1 });

      expect(game).toBeAtPhase("SelectModifierPhase");
      await game.phaseInterceptor.to("SelectModifierPhase");

      expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(
        h => h instanceof ModifierSelectUiHandler,
      ) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(2);
      expect(modifierSelectHandler.options[0].modifierTypeOption.type.id).toBe("MYSTERY_ENCOUNTER_GOLDEN_BUG_NET");
      expect(modifierSelectHandler.options[1].modifierTypeOption.type.id).toBe("REVIVER_SEED");

      const gripClawCountAfter =
        scene.findModifier(m => m instanceof ContactHeldItemTransferChanceModifier)?.stackCount ?? 0;
      expect(gripClawCountBefore - 1).toBe(gripClawCountAfter);
    });

    it("should leave encounter without battle", async () => {
      game.override.startingHeldItems([{ name: "GRIP_CLAW", count: 1 }]);
      const leaveEncounterWithoutBattleSpy = vi.spyOn(encounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.BUG_TYPE_SUPERFAN, [SpeciesId.BUTTERFREE]);
      await runMysteryEncounterToEnd(game, 3, { pokemonNo: 1, optionNo: 1 });

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });
});
