import Battle from "#app/battle";
import { LostAtSeaEncounter } from "#app/data/mystery-encounters/encounters/lost-at-sea-encounter";
import { EncounterOptionMode } from "#app/data/mystery-encounters/mystery-encounter-option";
import * as MysteryEncounters from "#app/data/mystery-encounters/mystery-encounters";
import * as EncounterPhaseUtils from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { getPokemonSpecies } from "#app/data/pokemon-species.js";
import { Biome } from "#app/enums/biome";
import { Moves } from "#app/enums/moves";
import { MysteryEncounterType } from "#app/enums/mystery-encounter-type";
import { Species } from "#app/enums/species";
import GameManager from "#app/test/utils/gameManager";
import { workaround_reInitSceneWithOverrides } from "#app/test/utils/testUtils";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runSelectMysteryEncounterOption } from "../encounterTestUtils";

const namepsace = "mysteryEncounter:lostAtSea";
/** Blastoise for surf. Pidgeot for fly. Abra for none. */
const defaultParty = [Species.BLASTOISE, Species.PIDGEOT, Species.ABRA];
const defaultBiome = Biome.SEA;
const defaultWave = 33;

describe("Lost at Sea - Mystery Encounter", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({ type: Phaser.HEADLESS });
  });

  beforeEach(async () => {
    game = new GameManager(phaserGame);
    game.override.mysteryEncounterChance(100);
    game.override.startingBiome(defaultBiome);
    game.override.startingWave(defaultWave);
    vi.spyOn(MysteryEncounters, "allMysteryEncounters", "get").mockReturnValue({
      [MysteryEncounterType.LOST_AT_SEA]: LostAtSeaEncounter,
    });
    vi.spyOn(MysteryEncounters, "mysteryEncountersByBiome", "get").mockReturnValue(
      new Map<Biome, MysteryEncounterType[]>([[Biome.SEA, [MysteryEncounterType.LOST_AT_SEA]]])
    );
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  it("should have the correct properties", async () => {
    await workaround_reInitSceneWithOverrides(game);
    await game.runToMysteryEncounter(defaultParty);

    expect(LostAtSeaEncounter.encounterType).toBe(MysteryEncounterType.LOST_AT_SEA);
    expect(LostAtSeaEncounter.dialogue).toBeDefined();
    expect(LostAtSeaEncounter.dialogue.intro).toStrictEqual([{ text: `${namepsace}:intro` }]);
    expect(LostAtSeaEncounter.dialogue.encounterOptionsDialogue.title).toBe(`${namepsace}:title`);
    expect(LostAtSeaEncounter.dialogue.encounterOptionsDialogue.description).toBe(`${namepsace}:description`);
    expect(LostAtSeaEncounter.dialogue.encounterOptionsDialogue.query).toBe(`${namepsace}:query`);
    expect(LostAtSeaEncounter.options.length).toBe(3);
  });

  it("should not run outside of sea biome", async () => {
    game.override.startingBiome(Biome.MOUNTAIN);

    await workaround_reInitSceneWithOverrides(game);

    //expect the `TypeError: Cannot read properties of undefined (reading 'introVisuals')` error
    await expect(() => game.runToMysteryEncounter()).rejects.toThrowError(/introVisuals/);
  });

  it("should not run below wave 11", async () => {
    game.override.startingWave(10);

    await game.runToMysteryEncounter();

    expect(game.scene.currentBattle.mysteryEncounter).toBeUndefined();
  });

  it("should not run above wave 179", async () => {
    game.override.startingWave(180);

    await game.runToMysteryEncounter();

    expect(game.scene.currentBattle.mysteryEncounter).toBeUndefined();
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

    it("should award exp to surfable PKM (Blastoise)", async () => {
      const laprasSpecies = getPokemonSpecies(Species.LAPRAS);

      await workaround_reInitSceneWithOverrides(game);
      await game.runToMysteryEncounter(defaultParty);
      const party = game.scene.getParty();
      const blastoise = party.find((pkm) => pkm.species.speciesId === Species.PIDGEOT);
      const expBefore = blastoise.exp;

      await runSelectMysteryEncounterOption(game, 2);

      expect(blastoise.exp).toBe(expBefore + laprasSpecies.baseExp * defaultWave);
    });

    it("should leave encounter without battle", async () => {
      game.override.startingWave(33);
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await workaround_reInitSceneWithOverrides(game);
      await game.runToMysteryEncounter(defaultParty);
      await runSelectMysteryEncounterOption(game, 1);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });

    it("should be disabled if no surfable PKM is in party", async () => {
      // TODO
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

    it("should award exp to flyable PKM (Pidgeot)", async () => {
      const laprasBaseExp = 187;
      const wave = 33;
      game.override.startingWave(wave);

      await workaround_reInitSceneWithOverrides(game);
      await game.runToMysteryEncounter(defaultParty);
      const party = game.scene.getParty();
      const pidgeot = party.find((pkm) => pkm.species.speciesId === Species.PIDGEOT);
      const expBefore = pidgeot.exp;

      await runSelectMysteryEncounterOption(game, 2);

      expect(pidgeot.exp).toBe(expBefore + laprasBaseExp * wave);
    });

    it("should leave encounter without battle", async () => {
      game.override.startingWave(33);
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await workaround_reInitSceneWithOverrides(game);
      await game.runToMysteryEncounter(defaultParty);
      await runSelectMysteryEncounterOption(game, 2);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });

    it("should be disabled if no flyable PKM is in party", async () => {
      // TODO
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

    it("should damage all (allowed in battle) party PKM by 25%", async () => {
      game.override.startingWave(33);

      await workaround_reInitSceneWithOverrides(game);
      await game.runToMysteryEncounter(defaultParty);

      const party = game.scene.getParty();
      const abra = party.find((pkm) => pkm.species.speciesId === Species.ABRA);
      vi.spyOn(abra, "isAllowedInBattle").mockReturnValue(false);

      await runSelectMysteryEncounterOption(game, 3);

      const allowedPkm = party.filter((pkm) => pkm.isAllowedInBattle());
      const notAllowedPkm = party.filter((pkm) => !pkm.isAllowedInBattle());
      allowedPkm.forEach((pkm) =>
        expect(pkm.hp, `${pkm.name} should have receivd 25% damage: ${pkm.hp} / ${pkm.getMaxHp()} HP`).toBe(pkm.getMaxHp() - Math.floor(pkm.getMaxHp() * 0.25))
      );

      notAllowedPkm.forEach((pkm) => expect(pkm.hp, `${pkm.name} should be full hp: ${pkm.hp} / ${pkm.getMaxHp()} HP`).toBe(pkm.getMaxHp()));
    });

    it("should leave encounter without battle", async () => {
      game.override.startingWave(33);
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      workaround_reInitSceneWithOverrides(game);
      await game.runToMysteryEncounter(defaultParty);
      await runSelectMysteryEncounterOption(game, 3);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });
});
