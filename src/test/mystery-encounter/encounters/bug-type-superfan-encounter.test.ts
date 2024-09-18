import * as MysteryEncounters from "#app/data/mystery-encounters/mystery-encounters";
import { Biome } from "#app/enums/biome";
import { MysteryEncounterType } from "#app/enums/mystery-encounter-type";
import { Species } from "#app/enums/species";
import GameManager from "#app/test/utils/gameManager";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runMysteryEncounterToEnd, runSelectMysteryEncounterOption, skipBattleRunMysteryEncounterRewardsPhase } from "#test/mystery-encounter/encounter-test-utils";
import { Moves } from "#enums/moves";
import BattleScene from "#app/battle-scene";
import { PokemonMove } from "#app/field/pokemon";
import { Mode } from "#app/ui/ui";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { initSceneWithoutEncounterPhase } from "#test/utils/gameManagerUtils";
import { TrainerType } from "#enums/trainer-type";
import { MysteryEncounterPhase, MysteryEncounterRewardsPhase } from "#app/phases/mystery-encounter-phases";
import { ContactHeldItemTransferChanceModifier } from "#app/modifier/modifier";
import { CommandPhase } from "#app/phases/command-phase";
import { BugTypeSuperfanEncounter } from "#app/data/mystery-encounters/encounters/bug-type-superfan-encounter";
import * as encounterPhaseUtils from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { SelectModifierPhase } from "#app/phases/select-modifier-phase";
import ModifierSelectUiHandler from "#app/ui/modifier-select-ui-handler";

const namespace = "mysteryEncounter:bugTypeSuperfan";
const defaultParty = [Species.LAPRAS, Species.GENGAR, Species.WEEDLE];
const defaultBiome = Biome.CAVE;
const defaultWave = 24;

const POOL_1_POKEMON = [
  Species.PARASECT,
  Species.VENOMOTH,
  Species.LEDIAN,
  Species.ARIADOS,
  Species.YANMA,
  Species.BEAUTIFLY,
  Species.DUSTOX,
  Species.MASQUERAIN,
  Species.NINJASK,
  Species.VOLBEAT,
  Species.ILLUMISE,
  Species.ANORITH,
  Species.KRICKETUNE,
  Species.WORMADAM,
  Species.MOTHIM,
  Species.SKORUPI,
  Species.JOLTIK,
  Species.LARVESTA,
  Species.VIVILLON,
  Species.CHARJABUG,
  Species.RIBOMBEE,
  Species.SPIDOPS,
  Species.LOKIX
];

const POOL_2_POKEMON = [
  Species.SCYTHER,
  Species.PINSIR,
  Species.HERACROSS,
  Species.FORRETRESS,
  Species.SCIZOR,
  Species.SHUCKLE,
  Species.SHEDINJA,
  Species.ARMALDO,
  Species.VESPIQUEN,
  Species.DRAPION,
  Species.YANMEGA,
  Species.LEAVANNY,
  Species.SCOLIPEDE,
  Species.CRUSTLE,
  Species.ESCAVALIER,
  Species.ACCELGOR,
  Species.GALVANTULA,
  Species.VIKAVOLT,
  Species.ARAQUANID,
  Species.ORBEETLE,
  Species.CENTISKORCH,
  Species.FROSMOTH,
  Species.KLEAVOR,
];

const POOL_3_POKEMON: { species: Species, formIndex?: number }[] = [
  {
    species: Species.PINSIR,
    formIndex: 1
  },
  {
    species: Species.SCIZOR,
    formIndex: 1
  },
  {
    species: Species.HERACROSS,
    formIndex: 1
  },
  {
    species: Species.ORBEETLE,
    formIndex: 1
  },
  {
    species: Species.CENTISKORCH,
    formIndex: 1
  },
  {
    species: Species.DURANT,
  },
  {
    species: Species.VOLCARONA,
  },
  {
    species: Species.GOLISOPOD,
  },
];

const POOL_4_POKEMON = [
  Species.GENESECT,
  Species.SLITHER_WING,
  Species.BUZZWOLE,
  Species.PHEROMOSA
];

const PHYSICAL_TUTOR_MOVES = [
  Moves.MEGAHORN,
  Moves.X_SCISSOR,
  Moves.ATTACK_ORDER,
  Moves.PIN_MISSILE,
  Moves.FIRST_IMPRESSION
];

const SPECIAL_TUTOR_MOVES = [
  Moves.SILVER_WIND,
  Moves.BUG_BUZZ,
  Moves.SIGNAL_BEAM,
  Moves.POLLEN_PUFF
];

const STATUS_TUTOR_MOVES = [
  Moves.STRING_SHOT,
  Moves.STICKY_WEB,
  Moves.SILK_TRAP,
  Moves.RAGE_POWDER,
  Moves.HEAL_ORDER
];

const MISC_TUTOR_MOVES = [
  Moves.BUG_BITE,
  Moves.LEECH_LIFE,
  Moves.DEFEND_ORDER,
  Moves.QUIVER_DANCE,
  Moves.TAIL_GLOW,
  Moves.INFESTATION,
  Moves.U_TURN
];

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
    game.override.mysteryEncounterChance(100);
    game.override.startingWave(defaultWave);
    game.override.startingBiome(defaultBiome);
    game.override.disableTrainerWaves();

    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(
      new Map<Biome, MysteryEncounterType[]>([
        [Biome.CAVE, [MysteryEncounterType.BUG_TYPE_SUPERFAN]],
      ])
    );
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.BUG_TYPE_SUPERFAN, defaultParty);

    expect(BugTypeSuperfanEncounter.encounterType).toBe(MysteryEncounterType.BUG_TYPE_SUPERFAN);
    expect(BugTypeSuperfanEncounter.encounterTier).toBe(MysteryEncounterTier.GREAT);
    expect(BugTypeSuperfanEncounter.dialogue).toBeDefined();
    expect(BugTypeSuperfanEncounter.dialogue.intro).toStrictEqual([
      {
        text: `${namespace}.intro`,
      },
      {
        speaker: `${namespace}.speaker`,
        text: `${namespace}.intro_dialogue`,
      },
    ]);
    expect(BugTypeSuperfanEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}.title`);
    expect(BugTypeSuperfanEncounter.dialogue.encounterOptionsDialogue?.description).toBe(`${namespace}.description`);
    expect(BugTypeSuperfanEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}.query`);
    expect(BugTypeSuperfanEncounter.options.length).toBe(3);
  });

  it("should not run below wave 10", async () => {
    game.override.startingWave(9);

    await game.runToMysteryEncounter();

    expect(scene.currentBattle?.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.BUG_TYPE_SUPERFAN);
  });

  it("should not run above wave 179", async () => {
    game.override.startingWave(181);

    await game.runToMysteryEncounter();

    expect(scene.currentBattle.mysteryEncounter).toBeUndefined();
  });

  it("should initialize fully", async () => {
    initSceneWithoutEncounterPhase(scene, defaultParty);
    scene.currentBattle.mysteryEncounter = BugTypeSuperfanEncounter;

    const { onInit } = BugTypeSuperfanEncounter;

    expect(BugTypeSuperfanEncounter.onInit).toBeDefined();

    BugTypeSuperfanEncounter.populateDialogueTokensFromRequirements(scene);
    const onInitResult = onInit!(scene);
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
        buttonLabel: `${namespace}.option.1.label`,
        buttonTooltip: `${namespace}.option.1.tooltip`,
        selected: [
          {
            speaker: `${namespace}.speaker`,
            text: `${namespace}.option.1.selected`,
          },
        ],
      });
    });

    it("should start battle against the Bug-Type Superfan with wave 30 party template", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.BUG_TYPE_SUPERFAN, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);

      const enemyParty = scene.getEnemyParty();
      expect(scene.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      expect(enemyParty.length).toBe(2);
      expect(scene.currentBattle.trainer?.config.trainerType).toBe(TrainerType.BUG_TYPE_SUPERFAN);
      expect(enemyParty[0].species.speciesId).toBe(Species.BEEDRILL);
      expect(enemyParty[1].species.speciesId).toBe(Species.BUTTERFREE);
    });

    it("should start battle against the Bug-Type Superfan with wave 50 party template", async () => {
      game.override.startingWave(43);
      await game.runToMysteryEncounter(MysteryEncounterType.BUG_TYPE_SUPERFAN, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);

      const enemyParty = scene.getEnemyParty();
      expect(scene.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      expect(enemyParty.length).toBe(3);
      expect(scene.currentBattle.trainer?.config.trainerType).toBe(TrainerType.BUG_TYPE_SUPERFAN);
      expect(enemyParty[0].species.speciesId).toBe(Species.BEEDRILL);
      expect(enemyParty[1].species.speciesId).toBe(Species.BUTTERFREE);
      expect(POOL_1_POKEMON.includes(enemyParty[2].species.speciesId)).toBe(true);
    });

    it("should start battle against the Bug-Type Superfan with wave 70 party template", async () => {
      game.override.startingWave(61);
      await game.runToMysteryEncounter(MysteryEncounterType.BUG_TYPE_SUPERFAN, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);

      const enemyParty = scene.getEnemyParty();
      expect(scene.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      expect(enemyParty.length).toBe(4);
      expect(scene.currentBattle.trainer?.config.trainerType).toBe(TrainerType.BUG_TYPE_SUPERFAN);
      expect(enemyParty[0].species.speciesId).toBe(Species.BEEDRILL);
      expect(enemyParty[1].species.speciesId).toBe(Species.BUTTERFREE);
      expect(POOL_1_POKEMON.includes(enemyParty[2].species.speciesId)).toBe(true);
      expect(POOL_2_POKEMON.includes(enemyParty[3].species.speciesId)).toBe(true);
    });

    it("should start battle against the Bug-Type Superfan with wave 100 party template", async () => {
      game.override.startingWave(81);
      await game.runToMysteryEncounter(MysteryEncounterType.BUG_TYPE_SUPERFAN, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);

      const enemyParty = scene.getEnemyParty();
      expect(scene.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      expect(enemyParty.length).toBe(5);
      expect(scene.currentBattle.trainer?.config.trainerType).toBe(TrainerType.BUG_TYPE_SUPERFAN);
      expect(enemyParty[0].species.speciesId).toBe(Species.BEEDRILL);
      expect(enemyParty[1].species.speciesId).toBe(Species.BUTTERFREE);
      expect(POOL_1_POKEMON.includes(enemyParty[2].species.speciesId)).toBe(true);
      expect(POOL_2_POKEMON.includes(enemyParty[3].species.speciesId)).toBe(true);
      expect(POOL_2_POKEMON.includes(enemyParty[4].species.speciesId)).toBe(true);
    });

    it("should start battle against the Bug-Type Superfan with wave 120 party template", async () => {
      game.override.startingWave(111);
      await game.runToMysteryEncounter(MysteryEncounterType.BUG_TYPE_SUPERFAN, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);

      const enemyParty = scene.getEnemyParty();
      expect(scene.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      expect(enemyParty.length).toBe(5);
      expect(scene.currentBattle.trainer?.config.trainerType).toBe(TrainerType.BUG_TYPE_SUPERFAN);
      expect(enemyParty[0].species.speciesId).toBe(Species.BEEDRILL);
      expect(enemyParty[0].formIndex).toBe(1);
      expect(enemyParty[1].species.speciesId).toBe(Species.BUTTERFREE);
      expect(enemyParty[1].formIndex).toBe(1);
      expect(POOL_2_POKEMON.includes(enemyParty[2].species.speciesId)).toBe(true);
      expect(POOL_2_POKEMON.includes(enemyParty[3].species.speciesId)).toBe(true);
      expect(POOL_3_POKEMON.some(config => enemyParty[4].species.speciesId === config.species)).toBe(true);
    });

    it("should start battle against the Bug-Type Superfan with wave 140 party template", async () => {
      game.override.startingWave(131);
      await game.runToMysteryEncounter(MysteryEncounterType.BUG_TYPE_SUPERFAN, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);

      const enemyParty = scene.getEnemyParty();
      expect(scene.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      expect(enemyParty.length).toBe(5);
      expect(scene.currentBattle.trainer?.config.trainerType).toBe(TrainerType.BUG_TYPE_SUPERFAN);
      expect(enemyParty[0].species.speciesId).toBe(Species.BEEDRILL);
      expect(enemyParty[0].formIndex).toBe(1);
      expect(enemyParty[1].species.speciesId).toBe(Species.BUTTERFREE);
      expect(enemyParty[1].formIndex).toBe(1);
      expect(POOL_2_POKEMON.includes(enemyParty[2].species.speciesId)).toBe(true);
      expect(POOL_3_POKEMON.some(config => enemyParty[3].species.speciesId === config.species)).toBe(true);
      expect(POOL_3_POKEMON.some(config => enemyParty[4].species.speciesId === config.species)).toBe(true);
    });

    it("should start battle against the Bug-Type Superfan with wave 160 party template", async () => {
      game.override.startingWave(151);
      await game.runToMysteryEncounter(MysteryEncounterType.BUG_TYPE_SUPERFAN, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);

      const enemyParty = scene.getEnemyParty();
      expect(scene.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      expect(enemyParty.length).toBe(5);
      expect(scene.currentBattle.trainer?.config.trainerType).toBe(TrainerType.BUG_TYPE_SUPERFAN);
      expect(enemyParty[0].species.speciesId).toBe(Species.BEEDRILL);
      expect(enemyParty[0].formIndex).toBe(1);
      expect(enemyParty[1].species.speciesId).toBe(Species.BUTTERFREE);
      expect(enemyParty[1].formIndex).toBe(1);
      expect(POOL_2_POKEMON.includes(enemyParty[2].species.speciesId)).toBe(true);
      expect(POOL_3_POKEMON.some(config => enemyParty[3].species.speciesId === config.species)).toBe(true);
      expect(POOL_4_POKEMON.includes(enemyParty[4].species.speciesId)).toBe(true);
    });

    it("should start battle against the Bug-Type Superfan with wave 180 party template", async () => {
      game.override.startingWave(171);
      await game.runToMysteryEncounter(MysteryEncounterType.BUG_TYPE_SUPERFAN, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);

      const enemyParty = scene.getEnemyParty();
      expect(scene.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      expect(enemyParty.length).toBe(5);
      expect(scene.currentBattle.trainer?.config.trainerType).toBe(TrainerType.BUG_TYPE_SUPERFAN);
      expect(enemyParty[0].species.speciesId).toBe(Species.BEEDRILL);
      expect(enemyParty[0].formIndex).toBe(1);
      expect(enemyParty[0].isBoss()).toBe(true);
      expect(enemyParty[0].bossSegments).toBe(2);
      expect(enemyParty[1].species.speciesId).toBe(Species.BUTTERFREE);
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

      expect(scene.getCurrentPhase()?.constructor.name).toBe(MysteryEncounterRewardsPhase.name);
      game.phaseInterceptor["prompts"] = []; // Clear out prompt handlers
      game.onNextPrompt("MysteryEncounterRewardsPhase", Mode.OPTION_SELECT, () => {
        game.phaseInterceptor.superEndPhase();
      });
      await game.phaseInterceptor.run(MysteryEncounterRewardsPhase);

      expect(selectOptionSpy).toHaveBeenCalledTimes(1);
      const optionData = selectOptionSpy.mock.calls[0][1];
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
        buttonLabel: `${namespace}.option.2.label`,
        buttonTooltip: `${namespace}.option.2.tooltip`,
        disabledButtonTooltip: `${namespace}.option.2.disabled_tooltip`
      });
    });

    it("should NOT be selectable if the player doesn't have any Bug types", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.BUG_TYPE_SUPERFAN, [Species.ABRA]);
      await game.phaseInterceptor.to(MysteryEncounterPhase, false);

      const encounterPhase = scene.getCurrentPhase();
      expect(encounterPhase?.constructor.name).toBe(MysteryEncounterPhase.name);
      const mysteryEncounterPhase = encounterPhase as MysteryEncounterPhase;
      vi.spyOn(mysteryEncounterPhase, "continueEncounter");
      vi.spyOn(mysteryEncounterPhase, "handleOptionSelect");
      vi.spyOn(scene.ui, "playError");

      await runSelectMysteryEncounterOption(game, 2);

      expect(scene.getCurrentPhase()?.constructor.name).toBe(MysteryEncounterPhase.name);
      expect(scene.ui.playError).not.toHaveBeenCalled(); // No error sfx, option is disabled
      expect(mysteryEncounterPhase.handleOptionSelect).not.toHaveBeenCalled();
      expect(mysteryEncounterPhase.continueEncounter).not.toHaveBeenCalled();
    });

    it("should proceed to rewards screen with 0-1 Bug Types reward options", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.BUG_TYPE_SUPERFAN, defaultParty);
      await runMysteryEncounterToEnd(game, 2);

      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);
      await game.phaseInterceptor.run(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(2);
      expect(modifierSelectHandler.options[0].modifierTypeOption.type.id).toBe("SUPER_LURE");
      expect(modifierSelectHandler.options[1].modifierTypeOption.type.id).toBe("GREAT_BALL");
    });

    it("should proceed to rewards screen with 2-3 Bug Types reward options", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.BUG_TYPE_SUPERFAN, [Species.BUTTERFREE, Species.BEEDRILL]);
      await runMysteryEncounterToEnd(game, 2);

      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);
      await game.phaseInterceptor.run(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(3);
      expect(modifierSelectHandler.options[0].modifierTypeOption.type.id).toBe("QUICK_CLAW");
      expect(modifierSelectHandler.options[1].modifierTypeOption.type.id).toBe("MAX_LURE");
      expect(modifierSelectHandler.options[2].modifierTypeOption.type.id).toBe("ULTRA_BALL");
    });

    it("should proceed to rewards screen with 4-5 Bug Types reward options", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.BUG_TYPE_SUPERFAN, [Species.BUTTERFREE, Species.BEEDRILL, Species.GALVANTULA, Species.VOLCARONA]);
      await runMysteryEncounterToEnd(game, 2);

      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);
      await game.phaseInterceptor.run(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(3);
      expect(modifierSelectHandler.options[0].modifierTypeOption.type.id).toBe("GRIP_CLAW");
      expect(modifierSelectHandler.options[1].modifierTypeOption.type.id).toBe("MAX_LURE");
      expect(modifierSelectHandler.options[2].modifierTypeOption.type.id).toBe("ROGUE_BALL");
    });

    it("should proceed to rewards screen with 6 Bug Types reward options (including form change item)", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.BUG_TYPE_SUPERFAN, [Species.BUTTERFREE, Species.BEEDRILL, Species.GALVANTULA, Species.VOLCARONA, Species.ANORITH, Species.GENESECT]);
      await runMysteryEncounterToEnd(game, 2);

      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);
      await game.phaseInterceptor.run(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(3);
      expect(modifierSelectHandler.options[0].modifierTypeOption.type.id).toBe("MASTER_BALL");
      expect(modifierSelectHandler.options[1].modifierTypeOption.type.id).toBe("MAX_LURE");
      expect(modifierSelectHandler.options[2].modifierTypeOption.type.id).toBe("FORM_CHANGE_ITEM");
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
        buttonLabel: `${namespace}.option.3.label`,
        buttonTooltip: `${namespace}.option.3.tooltip`,
        disabledButtonTooltip: `${namespace}.option.3.disabled_tooltip`,
        selected: [
          {
            text: `${namespace}.option.3.selected`,
          },
          {
            speaker: `${namespace}.speaker`,
            text: `${namespace}.option.3.selected_dialogue`,
          },
        ],
        secondOptionPrompt: `${namespace}.option.3.select_prompt`,
      });
    });

    it("should NOT be selectable if the player doesn't have any Bug items", async () => {
      game.scene.modifiers = [];
      await game.runToMysteryEncounter(MysteryEncounterType.BUG_TYPE_SUPERFAN, defaultParty);
      await game.phaseInterceptor.to(MysteryEncounterPhase, false);

      game.scene.modifiers = [];
      const encounterPhase = scene.getCurrentPhase();
      expect(encounterPhase?.constructor.name).toBe(MysteryEncounterPhase.name);
      const mysteryEncounterPhase = encounterPhase as MysteryEncounterPhase;
      vi.spyOn(mysteryEncounterPhase, "continueEncounter");
      vi.spyOn(mysteryEncounterPhase, "handleOptionSelect");
      vi.spyOn(scene.ui, "playError");

      await runSelectMysteryEncounterOption(game, 3);

      expect(scene.getCurrentPhase()?.constructor.name).toBe(MysteryEncounterPhase.name);
      expect(scene.ui.playError).not.toHaveBeenCalled(); // No error sfx, option is disabled
      expect(mysteryEncounterPhase.handleOptionSelect).not.toHaveBeenCalled();
      expect(mysteryEncounterPhase.continueEncounter).not.toHaveBeenCalled();
    });

    it("should remove the gifted item and proceed to rewards screen", async () => {
      game.override.startingHeldItems([{name: "GRIP_CLAW", count: 1}]);
      await game.runToMysteryEncounter(MysteryEncounterType.BUG_TYPE_SUPERFAN, [Species.BUTTERFREE]);

      const gripClawCountBefore = scene.findModifier(m => m instanceof ContactHeldItemTransferChanceModifier)?.stackCount ?? 0;

      await runMysteryEncounterToEnd(game, 3, { pokemonNo: 1, optionNo: 1 });

      expect(scene.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);
      await game.phaseInterceptor.run(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(Mode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(h => h instanceof ModifierSelectUiHandler) as ModifierSelectUiHandler;
      expect(modifierSelectHandler.options.length).toEqual(2);
      expect(modifierSelectHandler.options[0].modifierTypeOption.type.id).toBe("MYSTERY_ENCOUNTER_GOLDEN_BUG_NET");
      expect(modifierSelectHandler.options[1].modifierTypeOption.type.id).toBe("REVIVER_SEED");

      const gripClawCountAfter = scene.findModifier(m => m instanceof ContactHeldItemTransferChanceModifier)?.stackCount ?? 0;
      expect(gripClawCountBefore - 1).toBe(gripClawCountAfter);
    });

    it("should leave encounter without battle", async () => {
      game.override.startingHeldItems([{name: "GRIP_CLAW", count: 1}]);
      const leaveEncounterWithoutBattleSpy = vi.spyOn(encounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.BUG_TYPE_SUPERFAN, [Species.BUTTERFREE]);
      await runMysteryEncounterToEnd(game, 3, { pokemonNo: 1, optionNo: 1 });

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });
});
