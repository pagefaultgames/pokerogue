import Battle from "#app/battle";
import { LostAtSeaEncounter } from "#app/data/mystery-encounters/encounters/lost-at-sea-encounter";
import { MysteryEncounterTier } from "#app/data/mystery-encounters/mystery-encounter";
import { EncounterOptionMode } from "#app/data/mystery-encounters/mystery-encounter-option";
import * as MysteryEncounters from "#app/data/mystery-encounters/mystery-encounters";
import * as EncounterPhaseUtils from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { WeatherType } from "#app/data/weather";
import { Biome } from "#app/enums/biome";
import { Moves } from "#app/enums/moves";
import { MysteryEncounterType } from "#app/enums/mystery-encounter-type";
import { Species } from "#app/enums/species";
import GameManager from "#app/test/utils/gameManager";
import { workaround_reInitSceneWithOverrides } from "#app/test/utils/testUtils";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runSelectMysteryEncounterOption } from "../encounterTestUtils";

const namepsace = "mysteryEncounter:lostAtSea";

describe("Lost at Sea - Mystery Encounter", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({ type: Phaser.HEADLESS });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override.mysteryEncounterChance(100);
    game.override.startingBiome(Biome.SEA);
    vi.spyOn(MysteryEncounters, "allMysteryEncounters", "get").mockReturnValue({ [MysteryEncounterType.LOST_AT_SEA]: LostAtSeaEncounter });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter([Species.ABRA]);

    expect(LostAtSeaEncounter.encounterType).toBe(MysteryEncounterType.LOST_AT_SEA);
    expect(LostAtSeaEncounter.dialogue).toBeDefined();
    expect(LostAtSeaEncounter.dialogue.intro).toStrictEqual([{ text: `${namepsace}:intro` }]);
    expect(LostAtSeaEncounter.dialogue.encounterOptionsDialogue.title).toBe(`${namepsace}:title`);
    expect(LostAtSeaEncounter.dialogue.encounterOptionsDialogue.description).toBe(`${namepsace}:description`);
    expect(LostAtSeaEncounter.dialogue.encounterOptionsDialogue.query).toBe(`${namepsace}:query`);
    expect(LostAtSeaEncounter.options.length).toBe(3);
  });

  it("should not run below wave 11", async () => {
    game.override.startingWave(10);

    await game.runToMysteryEncounter();

    const { currentBattle } = game.scene;
    expect(currentBattle).toBeDefined();
    expect(currentBattle.mysteryEncounter).toBeUndefined();
  });

  it("should not run above wave 179", async () => {
    game.override.startingWave(180);

    await game.runToMysteryEncounter();

    const { currentBattle } = game.scene;
    expect(currentBattle).toBeDefined();
    expect(currentBattle.mysteryEncounter).toBeUndefined();
  });

  it("should set the correct dialog tokens during initialization", () => {
    vi.spyOn(game.scene, "currentBattle", "get").mockReturnValue({ mysteryEncounter: LostAtSeaEncounter } as Battle);

    const { onInit } = LostAtSeaEncounter;

    expect(LostAtSeaEncounter.onInit).toBeDefined();

    const onInitResult = onInit(game.scene);

    expect(LostAtSeaEncounter.dialogueTokens?.damagePercentage).toBe("25");
    expect(LostAtSeaEncounter.dialogueTokens?.option1RequiredMove).toBe(Moves[Moves.SURF]);
    expect(LostAtSeaEncounter.dialogueTokens?.option2RequiredMove).toBe(Moves[Moves.FLY]);
    expect(onInitResult).toBe(true);
  });

  describe("Option 1 - Surf", () => {
    it("should have the correct properties", () => {
      const option1 = LostAtSeaEncounter.options[0];
      expect(option1.optionMode).toBe(EncounterOptionMode.DISABLED_OR_DEFAULT);
      expect(option1.dialogue).toBeDefined();
      expect(option1.dialogue).toStrictEqual({
        buttonLabel: `${namepsace}:option:1:label`,
        disabledButtonLabel: `${namepsace}:option:1:label_disabled`,
        buttonTooltip: `${namepsace}:option:1:tooltip`,
        disabledButtonTooltip: `${namepsace}:option:1:tooltip_disabled`,
        selected: [
          {
            text: `${namepsace}:option:1:selected`,
          },
        ],
      });
    });
  });

  describe("Option 2 - Fly", () => {
    it("should have the correct properties", () => {
      const option2 = LostAtSeaEncounter.options[1];

      expect(option2.optionMode).toBe(EncounterOptionMode.DISABLED_OR_DEFAULT);
      expect(option2.dialogue).toBeDefined();
      expect(option2.dialogue).toStrictEqual({
        buttonLabel: `${namepsace}:option:2:label`,
        disabledButtonLabel: `${namepsace}:option:2:label_disabled`,
        buttonTooltip: `${namepsace}:option:2:tooltip`,
        disabledButtonTooltip: `${namepsace}:option:2:tooltip_disabled`,
        selected: [
          {
            text: `${namepsace}:option:2:selected`,
          },
        ],
      });
    });
  });

  describe("Option 3 - Wander aimlessy", () => {
    it("should have the correct properties", () => {
      const option3 = LostAtSeaEncounter.options[2];

      expect(option3.optionMode).toBe(EncounterOptionMode.DEFAULT);
      expect(option3.dialogue).toBeDefined();
      expect(option3.dialogue).toStrictEqual({
        buttonLabel: `${namepsace}:option:3:label`,
        buttonTooltip: `${namepsace}:option:3:tooltip`,
        selected: [
          {
            text: `${namepsace}:option:3:selected`,
          },
        ],
      });
    });

    it("should handle the option phase properly", async () => {
      game.override.startingWave(33);
      game.override.weather(WeatherType.RAIN);
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      workaround_reInitSceneWithOverrides(game);
      await game.runToMysteryEncounter([Species.ABRA, Species.ZEBSTRIKA, Species.BULBASAUR, Species.GROUDON]);
      await runSelectMysteryEncounterOption(game, 3);

      const { encounteredEvents } = game.scene.mysteryEncounterData;
      const party = game.scene.getParty();

      expect(encounteredEvents.some(([type, tier]) => type === MysteryEncounterType.LOST_AT_SEA && tier === MysteryEncounterTier.COMMON)).toBe(true);
      party.forEach((pkm) => {
        const maxHp = pkm.getMaxHp();
        const expectMsg = `${pkm.name} should have receivd 25% damage: ${pkm.hp} / ${maxHp} HP`;

        expect(pkm.hp, expectMsg).toBe(maxHp - Math.floor(maxHp * 0.25));
      });
      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });
});
