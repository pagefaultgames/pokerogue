import type BattleScene from "#app/battle-scene";
import { CreepingFogEncounter } from "#app/data/mystery-encounters/encounters/creeping-fog-encounter";
import * as MysteryEncounters from "#app/data/mystery-encounters/mystery-encounters";
import * as EncounterPhaseUtils from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { BiomeId } from "#enums/biome-id";
import { MysteryEncounterType } from "#app/enums/mystery-encounter-type";
import { SpeciesId } from "#enums/species-id";
import { PokemonMove } from "#app/data/moves/pokemon-move";
import { ModifierTier } from "#enums/modifier-tier";
import { CommandPhase } from "#app/phases/command-phase";
import { SelectModifierPhase } from "#app/phases/select-modifier-phase";
import ModifierSelectUiHandler from "#app/ui/modifier-select-ui-handler";
import { UiMode } from "#enums/ui-mode";
import { MoveId } from "#enums/move-id";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import {
  runMysteryEncounterToEnd,
  runSelectMysteryEncounterOption,
  skipBattleRunMysteryEncounterRewardsPhase,
} from "#test/mystery-encounter/encounter-test-utils";
import { MysteryEncounterPhase } from "#app/phases/mystery-encounter-phases";
import GameManager from "#test/testUtils/gameManager";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { WeatherType } from "#enums/weather-type";

const namespace = "mysteryEncounters/creepingFog";
const defaultParty = [SpeciesId.LAPRAS, SpeciesId.GENGAR, SpeciesId.ABRA];
const defaultBiome = BiomeId.FOREST;
const defaultWave = 51;
const enemyPokemonForest50_110 = [
  SpeciesId.MACHAMP,
  SpeciesId.GRIMMSNARL,
  SpeciesId.LYCANROC,
  SpeciesId.ALOLA_RATICATE,
];
const enemyPokemonSwamp110_140 = [
  SpeciesId.MACHAMP,
  SpeciesId.GRIMMSNARL,
  SpeciesId.POLIWRATH,
  SpeciesId.SCOLIPEDE,
  SpeciesId.MIENSHAO,
  SpeciesId.DRACOZOLT,
];
const enemyPokemonGraveyard140_Plus = [
  SpeciesId.MACHAMP,
  SpeciesId.GRIMMSNARL,
  SpeciesId.GOLURK,
  SpeciesId.HONEDGE,
  SpeciesId.ZWEILOUS,
  SpeciesId.SCOLIPEDE,
  SpeciesId.MIENSHAO,
  SpeciesId.DRACOZOLT,
  SpeciesId.PIDGEOT,
];

const enemyMoveset = {
  [SpeciesId.MACHAMP]: [MoveId.DYNAMIC_PUNCH, MoveId.STONE_EDGE, MoveId.DUAL_CHOP, MoveId.FISSURE],
  [SpeciesId.GRIMMSNARL]: [MoveId.STONE_EDGE, MoveId.CLOSE_COMBAT, MoveId.IRON_TAIL, MoveId.PLAY_ROUGH],
  [SpeciesId.LYCANROC]: [MoveId.STONE_EDGE, MoveId.CLOSE_COMBAT, MoveId.IRON_TAIL, MoveId.PLAY_ROUGH],
  [SpeciesId.ALOLA_RATICATE]: [MoveId.FALSE_SURRENDER, MoveId.SUCKER_PUNCH, MoveId.PLAY_ROUGH, MoveId.POPULATION_BOMB],
  [SpeciesId.POLIWRATH]: [MoveId.DYNAMIC_PUNCH, MoveId.HYDRO_PUMP, MoveId.DUAL_CHOP, MoveId.HYPNOSIS],
  [SpeciesId.GOLURK]: [MoveId.EARTHQUAKE, MoveId.POLTERGEIST, MoveId.DYNAMIC_PUNCH, MoveId.STONE_EDGE],
  [SpeciesId.HONEDGE]: [MoveId.IRON_HEAD, MoveId.POLTERGEIST, MoveId.SACRED_SWORD, MoveId.SHADOW_SNEAK],
  [SpeciesId.ZWEILOUS]: [MoveId.DRAGON_RUSH, MoveId.CRUNCH, MoveId.GUNK_SHOT, MoveId.SCREECH],
  [SpeciesId.SCOLIPEDE]: [MoveId.MEGAHORN, MoveId.NOXIOUS_TORQUE, MoveId.ROLLOUT, MoveId.BANEFUL_BUNKER],
  [SpeciesId.MIENSHAO]: [MoveId.HIGH_JUMP_KICK, MoveId.STONE_EDGE, MoveId.BLAZE_KICK, MoveId.GUNK_SHOT],
  [SpeciesId.DRACOZOLT]: [MoveId.BOLT_BEAK, MoveId.DRAGON_RUSH, MoveId.EARTHQUAKE, MoveId.STONE_EDGE],
  [SpeciesId.PIDGEOT]: [MoveId.HURRICANE, MoveId.HEAT_WAVE, MoveId.FOCUS_BLAST, MoveId.WILDBOLT_STORM],
};

describe("Creeping Fog - Mystery Encounter", () => {
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
      new Map<BiomeId, MysteryEncounterType[]>([
        [BiomeId.FOREST, [MysteryEncounterType.CREEPING_FOG]],
        [BiomeId.FOREST, [MysteryEncounterType.SAFARI_ZONE]],
        [BiomeId.SPACE, [MysteryEncounterType.MYSTERIOUS_CHALLENGERS]],
      ]),
    );
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.CREEPING_FOG, defaultParty);

    expect(CreepingFogEncounter.encounterType).toBe(MysteryEncounterType.CREEPING_FOG);
    expect(CreepingFogEncounter.encounterTier).toBe(MysteryEncounterTier.ULTRA);
    expect(CreepingFogEncounter.dialogue).toBeDefined();
    expect(CreepingFogEncounter.dialogue.intro).toStrictEqual([{ text: `${namespace}:intro` }]);
    expect(CreepingFogEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}:title`);
    expect(CreepingFogEncounter.dialogue.encounterOptionsDialogue?.description).toBe(`${namespace}:description`);
    expect(CreepingFogEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}:query`);
    expect(CreepingFogEncounter.options.length).toBe(4);
  });

  it("should not spawn outside of proper biomes", async () => {
    game.override.mysteryEncounterTier(MysteryEncounterTier.ULTRA);
    game.override.startingBiome(BiomeId.SPACE);

    await game.runToMysteryEncounter();
    expect(game.scene.currentBattle.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.CREEPING_FOG);
  });

  it("should not spawn outside of proper time of day", async () => {
    game.override.mysteryEncounterTier(MysteryEncounterTier.ULTRA);

    await game.runToMysteryEncounter();
    expect(game.scene.currentBattle.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.CREEPING_FOG);
  });

  describe("Option 1 - Confront the shadow", () => {
    it("should have the correct properties", () => {
      const option1 = CreepingFogEncounter.options[0];
      expect(option1.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option1.dialogue).toBeDefined();
      expect(option1.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.1.label`,
        buttonTooltip: `${namespace}:option.1.tooltip`,
        selected: [
          {
            text: `${namespace}:option.1.selected`,
          },
        ],
      });
    });

    it("should start battle against shadowy Pokemon from the Forest Low Level Pool", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.CREEPING_FOG, defaultParty);
      const partyLead = scene.getPlayerParty()[0];
      partyLead.level = 1000;
      partyLead.calculateStats();
      await runMysteryEncounterToEnd(game, 1, undefined, true);
      //Expect that the weather is set to heavy fog
      expect(scene.arena.weather?.weatherType).toBe(WeatherType.HEAVY_FOG);
      const enemyField = scene.getEnemyField();
      expect(scene.phaseManager.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      expect(enemyField.length).toBe(1);
      expect(enemyPokemonForest50_110).toContain(enemyField[0].species.speciesId);
      const moveset = enemyField[0].moveset.map(m => m.moveId);
      expect(enemyMoveset[enemyField[0].species.speciesId]).toEqual(moveset);
    });

    it("should start battle against shadowy Pokemon from the Swamp Mid Level Pool", async () => {
      game.override.startingWave(113);
      game.override.startingBiome(BiomeId.SWAMP);
      await game.runToMysteryEncounter(MysteryEncounterType.CREEPING_FOG, defaultParty);
      // Make party lead's level arbitrarily high to not get KOed by move
      const partyLead = scene.getPlayerParty()[0];
      partyLead.level = 1000;
      partyLead.calculateStats();
      await runMysteryEncounterToEnd(game, 1, undefined, true);
      //Expect that the weather is set to heavy fog
      expect(scene.arena.weather?.weatherType).toBe(WeatherType.HEAVY_FOG);
      const enemyField = scene.getEnemyField();
      expect(scene.phaseManager.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      expect(enemyField.length).toBe(1);
      expect(enemyPokemonSwamp110_140).toContain(enemyField[0].species.speciesId);
      const moveset = enemyField[0].moveset.map(m => m.moveId);
      expect(enemyMoveset[enemyField[0].species.speciesId]).toEqual(moveset);
    });

    it("should start battle against shadowy Pokemon from the Graveyard High Level Pool", async () => {
      game.override.startingWave(143);
      game.override.startingBiome(BiomeId.GRAVEYARD);
      await game.runToMysteryEncounter(MysteryEncounterType.CREEPING_FOG, defaultParty);
      // Make party lead's level arbitrarily high to not get KOed by move
      const partyLead = scene.getPlayerParty()[0];
      partyLead.level = 1000;
      partyLead.calculateStats();
      await runMysteryEncounterToEnd(game, 1, undefined, true);
      //Expect that the weather is set to heavy fog
      expect(scene.arena.weather?.weatherType).toBe(WeatherType.HEAVY_FOG);
      const enemyField = scene.getEnemyField();
      expect(scene.phaseManager.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      expect(enemyField.length).toBe(1);
      expect(enemyPokemonGraveyard140_Plus).toContain(enemyField[0].species.speciesId);
      const moveset = enemyField[0].moveset.map(m => m.moveId);
      expect(enemyMoveset[enemyField[0].species.speciesId]).toEqual(moveset);
    });

    it("should have a 2 rogue tier items in the rewards after battle", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.CREEPING_FOG, defaultParty);
      await runMysteryEncounterToEnd(game, 1, undefined, true);
      await skipBattleRunMysteryEncounterRewardsPhase(game);
      await game.phaseInterceptor.to(SelectModifierPhase, false);
      expect(scene.phaseManager.getCurrentPhase()?.constructor.name).toBe(SelectModifierPhase.name);
      await game.phaseInterceptor.run(SelectModifierPhase);

      expect(scene.ui.getMode()).to.equal(UiMode.MODIFIER_SELECT);
      const modifierSelectHandler = scene.ui.handlers.find(
        h => h instanceof ModifierSelectUiHandler,
      ) as ModifierSelectUiHandler;
      expect(
        modifierSelectHandler.options[0].modifierTypeOption.type.tier -
          modifierSelectHandler.options[0].modifierTypeOption.upgradeCount,
      ).toEqual(ModifierTier.ROGUE);
      expect(
        modifierSelectHandler.options[1].modifierTypeOption.type.tier -
          modifierSelectHandler.options[1].modifierTypeOption.upgradeCount,
      ).toEqual(ModifierTier.ROGUE);
    });
  });

  describe("Option 2 - Clear the Fog", () => {
    it("should have the correct properties", () => {
      const option2 = CreepingFogEncounter.options[1];
      expect(option2.optionMode).toBe(MysteryEncounterOptionMode.DISABLED_OR_SPECIAL);
      expect(option2.dialogue).toBeDefined();
      expect(option2.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.2.label`,
        buttonTooltip: `${namespace}:option.2.tooltip`,
        selected: [
          {
            text: `${namespace}:option.2.selected`,
          },
        ],
      });
    });

    it("should skip battle with Pokemon if wave level under 140", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");
      await game.runToMysteryEncounter(MysteryEncounterType.CREEPING_FOG, defaultParty);
      scene.getPlayerParty()[1].moveset = [new PokemonMove(MoveId.DEFOG)];
      await runMysteryEncounterToEnd(game, 2);
      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });

    it("should not skip battle with Pokemon", async () => {
      game.override.startingWave(143);
      game.override.startingBiome(BiomeId.GRAVEYARD);
      await game.runToMysteryEncounter(MysteryEncounterType.CREEPING_FOG, defaultParty);
      scene.getPlayerParty()[1].moveset = [new PokemonMove(MoveId.DEFOG)];
      const partyLead = scene.getPlayerParty()[0];
      partyLead.level = 1000;
      partyLead.calculateStats();
      await runMysteryEncounterToEnd(game, 2, undefined, true);
      const enemyField = scene.getEnemyField();
      expect(scene.phaseManager.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      expect(enemyField.length).toBe(1);
      expect(enemyPokemonGraveyard140_Plus).toContain(enemyField[0].species.speciesId);
      const moveset = enemyField[0].moveset.map(m => m.moveId);
      expect(enemyMoveset[enemyField[0].species.speciesId]).toEqual(moveset);
    });

    it("should NOT be selectable if the player doesn't have a defog type move", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.CREEPING_FOG, defaultParty);
      scene.getPlayerParty().forEach(p => (p.moveset = []));
      await game.phaseInterceptor.to(MysteryEncounterPhase, false);
      const encounterPhase = scene.phaseManager.getCurrentPhase();
      expect(encounterPhase?.constructor.name).toBe(MysteryEncounterPhase.name);
      const mysteryEncounterPhase = encounterPhase as MysteryEncounterPhase;
      vi.spyOn(mysteryEncounterPhase, "continueEncounter");
      vi.spyOn(mysteryEncounterPhase, "handleOptionSelect");
      await runSelectMysteryEncounterOption(game, 2);
      expect(mysteryEncounterPhase.handleOptionSelect).not.toHaveBeenCalled();
      expect(mysteryEncounterPhase.continueEncounter).not.toHaveBeenCalled();
    });
  });

  describe("Option 3 - Navigate through the Fog", () => {
    it("should have the correct properties", () => {
      const option3 = CreepingFogEncounter.options[2];
      expect(option3.optionMode).toBe(MysteryEncounterOptionMode.DISABLED_OR_SPECIAL);
      expect(option3.dialogue).toBeDefined();
      expect(option3.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.3.label`,
        buttonTooltip: `${namespace}:option.3.tooltip`,
        selected: [
          {
            text: `${namespace}:option.3.selected`,
          },
        ],
      });
    });

    it("should skip battle with Pokemon if wave level under 140", async () => {
      game.override.startingWave(63);
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");
      await game.runToMysteryEncounter(MysteryEncounterType.CREEPING_FOG, defaultParty);
      scene.getPlayerParty()[1].moveset = [new PokemonMove(MoveId.FORESIGHT)];
      await runMysteryEncounterToEnd(game, 3);
      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });

    it("should not skip battle with Pokemon", async () => {
      game.override.startingWave(143);
      game.override.startingBiome(BiomeId.GRAVEYARD);
      await game.runToMysteryEncounter(MysteryEncounterType.CREEPING_FOG, defaultParty);
      scene.getPlayerParty()[1].moveset = [new PokemonMove(MoveId.FORESIGHT)];
      const partyLead = scene.getPlayerParty()[0];
      partyLead.level = 1000;
      partyLead.calculateStats();
      await runMysteryEncounterToEnd(game, 3, undefined, true);
      //Expect that the weather is set to heavy fog
      expect(scene.arena.weather?.weatherType).toBe(WeatherType.HEAVY_FOG);
      const enemyField = scene.getEnemyField();
      expect(scene.phaseManager.getCurrentPhase()?.constructor.name).toBe(CommandPhase.name);
      expect(enemyField.length).toBe(1);
      expect(enemyPokemonGraveyard140_Plus).toContain(enemyField[0].species.speciesId);
      const moveset = enemyField[0].moveset.map(m => m.moveId);
      expect(enemyMoveset[enemyField[0].species.speciesId]).toEqual(moveset);
    });

    it("should NOT be selectable if the player doesn't have a light type move", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.CREEPING_FOG, defaultParty);
      scene.getPlayerParty().forEach(p => (p.moveset = []));
      await game.phaseInterceptor.to(MysteryEncounterPhase, false);

      const encounterPhase = scene.phaseManager.getCurrentPhase();
      expect(encounterPhase?.constructor.name).toBe(MysteryEncounterPhase.name);
      const mysteryEncounterPhase = encounterPhase as MysteryEncounterPhase;
      vi.spyOn(mysteryEncounterPhase, "continueEncounter");
      vi.spyOn(mysteryEncounterPhase, "handleOptionSelect");

      await runSelectMysteryEncounterOption(game, 3);
      expect(mysteryEncounterPhase.handleOptionSelect).not.toHaveBeenCalled();
      expect(mysteryEncounterPhase.continueEncounter).not.toHaveBeenCalled();
    });
  });

  describe("Option 4 - Leave the encounter", () => {
    it("should have the correct properties", () => {
      const option4 = CreepingFogEncounter.options[3];
      expect(option4.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option4.dialogue).toBeDefined();
      expect(option4.dialogue).toStrictEqual({
        buttonLabel: `${namespace}:option.4.label`,
        buttonTooltip: `${namespace}:option.4.tooltip`,
        selected: [
          {
            text: `${namespace}:option.4.selected`,
          },
        ],
      });
    });

    it("should leave encounter without battle", async () => {
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.CREEPING_FOG, defaultParty);
      await runMysteryEncounterToEnd(game, 4);
      //Expect that the weather is set to fog
      expect(scene.arena.weather?.weatherType).toBe(WeatherType.FOG);
      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });
});
