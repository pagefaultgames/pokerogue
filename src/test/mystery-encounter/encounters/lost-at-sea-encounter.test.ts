import { LostAtSeaEncounter } from "#app/data/mystery-encounters/encounters/lost-at-sea-encounter";
import * as MysteryEncounters from "#app/data/mystery-encounters/mystery-encounters";
import * as EncounterPhaseUtils from "#app/data/mystery-encounters/utils/encounter-phase-utils";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import { Biome } from "#app/enums/biome";
import { MysteryEncounterType } from "#app/enums/mystery-encounter-type";
import { Species } from "#app/enums/species";
import GameManager from "#app/test/utils/gameManager";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { runMysteryEncounterToEnd, runSelectMysteryEncounterOption } from "../encounter-test-utils";
import { MysteryEncounterOptionMode } from "#enums/mystery-encounter-option-mode";
import { MysteryEncounterTier } from "#enums/mystery-encounter-tier";
import { initSceneWithoutEncounterPhase } from "#test/utils/gameManagerUtils";
import BattleScene from "#app/battle-scene";
import { MysteryEncounterPhase } from "#app/phases/mystery-encounter-phases";
import { PartyExpPhase } from "#app/phases/party-exp-phase";


const namespace = "mysteryEncounter:lostAtSea";
/** Blastoise for surf. Pidgeot for fly. Abra for none. */
const defaultParty = [Species.BLASTOISE, Species.PIDGEOT, Species.ABRA];
const defaultBiome = Biome.SEA;
const defaultWave = 33;

describe("Lost at Sea - Mystery Encounter", () => {
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
        [Biome.SEA, [MysteryEncounterType.LOST_AT_SEA]],
        [Biome.MOUNTAIN, [MysteryEncounterType.MYSTERIOUS_CHALLENGERS]],
      ])
    );
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  it("should have the correct properties", async () => {
    await game.runToMysteryEncounter(MysteryEncounterType.LOST_AT_SEA, defaultParty);

    expect(LostAtSeaEncounter.encounterType).toBe(MysteryEncounterType.LOST_AT_SEA);
    expect(LostAtSeaEncounter.encounterTier).toBe(MysteryEncounterTier.COMMON);
    expect(LostAtSeaEncounter.dialogue).toBeDefined();
    expect(LostAtSeaEncounter.dialogue.intro).toStrictEqual([{ text: `${namespace}.intro` }]);
    expect(LostAtSeaEncounter.dialogue.encounterOptionsDialogue?.title).toBe(`${namespace}.title`);
    expect(LostAtSeaEncounter.dialogue.encounterOptionsDialogue?.description).toBe(`${namespace}.description`);
    expect(LostAtSeaEncounter.dialogue.encounterOptionsDialogue?.query).toBe(`${namespace}.query`);
    expect(LostAtSeaEncounter.options.length).toBe(3);
  });

  it("should not spawn outside of sea biome", async () => {
    game.override.mysteryEncounterTier(MysteryEncounterTier.COMMON);
    game.override.startingBiome(Biome.MOUNTAIN);
    await game.runToMysteryEncounter();

    expect(game.scene.currentBattle.mysteryEncounter?.encounterType).not.toBe(MysteryEncounterType.LOST_AT_SEA);
  });

  it("should not run below wave 11", async () => {
    game.override.startingWave(9);

    await game.runToMysteryEncounter();

    expect(game.scene.currentBattle.mysteryEncounter).toBeUndefined();
  });

  it("should not run above wave 179", async () => {
    game.override.startingWave(181);

    await game.runToMysteryEncounter();

    expect(game.scene.currentBattle.mysteryEncounter).toBeUndefined();
  });

  it("should initialize fully", () => {
    initSceneWithoutEncounterPhase(scene, defaultParty);
    scene.currentBattle.mysteryEncounter = LostAtSeaEncounter;

    const { onInit } = LostAtSeaEncounter;

    expect(LostAtSeaEncounter.onInit).toBeDefined();

    LostAtSeaEncounter.populateDialogueTokensFromRequirements(scene);
    const onInitResult = onInit!(scene);

    expect(LostAtSeaEncounter.dialogueTokens?.damagePercentage).toBe("25");
    expect(LostAtSeaEncounter.dialogueTokens?.option1RequiredMove).toBe("Surf");
    expect(LostAtSeaEncounter.dialogueTokens?.option2RequiredMove).toBe("Fly");
    expect(onInitResult).toBe(true);
  });

  describe("Option 1 - Surf", () => {
    it("should have the correct properties", () => {
      const option1 = LostAtSeaEncounter.options[0];
      expect(option1.optionMode).toBe(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT);
      expect(option1.dialogue).toBeDefined();
      expect(option1.dialogue).toStrictEqual({
        buttonLabel: `${namespace}.option.1.label`,
        disabledButtonLabel: `${namespace}.option.1.label_disabled`,
        buttonTooltip: `${namespace}.option.1.tooltip`,
        disabledButtonTooltip: `${namespace}.option.1.tooltip_disabled`,
        selected: [
          {
            text: `${namespace}.option.1.selected`,
          },
        ],
      });
    });

    it("should award exp to surfable PKM (Blastoise)", async () => {
      const laprasSpecies = getPokemonSpecies(Species.LAPRAS);

      await game.runToMysteryEncounter(MysteryEncounterType.LOST_AT_SEA, defaultParty);
      const party = game.scene.getParty();
      const blastoise = party.find((pkm) => pkm.species.speciesId === Species.BLASTOISE);
      const expBefore = blastoise!.exp;

      await runMysteryEncounterToEnd(game, 1);
      await game.phaseInterceptor.to(PartyExpPhase);

      expect(blastoise?.exp).toBe(expBefore + Math.floor(laprasSpecies.baseExp * defaultWave / 5 + 1));
    });

    it("should leave encounter without battle", async () => {
      game.override.startingWave(33);
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.LOST_AT_SEA, defaultParty);
      await runMysteryEncounterToEnd(game, 1);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });

    it("should be disabled if no surfable PKM is in party", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.LOST_AT_SEA, [Species.ARCANINE]);
      await game.phaseInterceptor.to(MysteryEncounterPhase, false);

      const encounterPhase = scene.getCurrentPhase();
      expect(encounterPhase?.constructor.name).toBe(MysteryEncounterPhase.name);
      const mysteryEncounterPhase = encounterPhase as MysteryEncounterPhase;
      vi.spyOn(mysteryEncounterPhase, "continueEncounter");
      vi.spyOn(mysteryEncounterPhase, "handleOptionSelect");
      vi.spyOn(scene.ui, "playError");

      await runSelectMysteryEncounterOption(game, 1);

      expect(scene.getCurrentPhase()?.constructor.name).toBe(MysteryEncounterPhase.name);
      expect(scene.ui.playError).not.toHaveBeenCalled(); // No error sfx, option is disabled
      expect(mysteryEncounterPhase.handleOptionSelect).not.toHaveBeenCalled();
      expect(mysteryEncounterPhase.continueEncounter).not.toHaveBeenCalled();
    });
  });

  describe("Option 2 - Fly", () => {
    it("should have the correct properties", () => {
      const option2 = LostAtSeaEncounter.options[1];

      expect(option2.optionMode).toBe(MysteryEncounterOptionMode.DISABLED_OR_DEFAULT);
      expect(option2.dialogue).toBeDefined();
      expect(option2.dialogue).toStrictEqual({
        buttonLabel: `${namespace}.option.2.label`,
        disabledButtonLabel: `${namespace}.option.2.label_disabled`,
        buttonTooltip: `${namespace}.option.2.tooltip`,
        disabledButtonTooltip: `${namespace}.option.2.tooltip_disabled`,
        selected: [
          {
            text: `${namespace}.option.2.selected`,
          },
        ],
      });
    });

    it("should award exp to flyable PKM (Pidgeot)", async () => {
      const laprasBaseExp = 187;
      const wave = 33;
      game.override.startingWave(wave);

      await game.runToMysteryEncounter(MysteryEncounterType.LOST_AT_SEA, defaultParty);
      const party = game.scene.getParty();
      const pidgeot = party.find((pkm) => pkm.species.speciesId === Species.PIDGEOT);
      const expBefore = pidgeot!.exp;

      await runMysteryEncounterToEnd(game, 2);
      await game.phaseInterceptor.to(PartyExpPhase);

      expect(pidgeot!.exp).toBe(expBefore + Math.floor(laprasBaseExp * defaultWave / 5 + 1));
    });

    it("should leave encounter without battle", async () => {
      game.override.startingWave(33);
      const leaveEncounterWithoutBattleSpy = vi.spyOn(EncounterPhaseUtils, "leaveEncounterWithoutBattle");

      await game.runToMysteryEncounter(MysteryEncounterType.LOST_AT_SEA, defaultParty);
      await runMysteryEncounterToEnd(game, 2);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });

    it("should be disabled if no flyable PKM is in party", async () => {
      await game.runToMysteryEncounter(MysteryEncounterType.LOST_AT_SEA, [Species.ARCANINE]);
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
  });

  describe("Option 3 - Wander aimlessy", () => {
    it("should have the correct properties", () => {
      const option3 = LostAtSeaEncounter.options[2];

      expect(option3.optionMode).toBe(MysteryEncounterOptionMode.DEFAULT);
      expect(option3.dialogue).toBeDefined();
      expect(option3.dialogue).toStrictEqual({
        buttonLabel: `${namespace}.option.3.label`,
        buttonTooltip: `${namespace}.option.3.tooltip`,
        selected: [
          {
            text: `${namespace}.option.3.selected`,
          },
        ],
      });
    });

    it("should damage all (allowed in battle) party PKM by 25%", async () => {
      game.override.startingWave(33);

      await game.runToMysteryEncounter(MysteryEncounterType.LOST_AT_SEA, defaultParty);

      const party = game.scene.getParty();
      const abra = party.find((pkm) => pkm.species.speciesId === Species.ABRA)!;
      vi.spyOn(abra, "isAllowedInBattle").mockReturnValue(false);

      await runMysteryEncounterToEnd(game, 3);

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

      await game.runToMysteryEncounter(MysteryEncounterType.LOST_AT_SEA, defaultParty);
      await runMysteryEncounterToEnd(game, 3);

      expect(leaveEncounterWithoutBattleSpy).toBeCalled();
    });
  });
});
