import type BattleScene from "#app/battle-scene";
import { speciesStarterCosts } from "#app/data/balance/starters";
import MysteryEncounter from "#app/data/mystery-encounters/mystery-encounter";
import {
  getEncounterText,
  queueEncounterMessage,
  showEncounterDialogue,
  showEncounterText,
} from "#app/data/mystery-encounters/utils/encounter-dialogue-utils";
import {
  getHighestLevelPlayerPokemon,
  getLowestLevelPlayerPokemon,
  getRandomPlayerPokemon,
  getRandomSpeciesByStarterCost,
  koPlayerPokemon,
} from "#app/data/mystery-encounters/utils/encounter-pokemon-utils";
import { getPokemonSpecies } from "#app/data/pokemon-species";
import { PokemonType } from "#enums/pokemon-type";
import { MessagePhase } from "#app/phases/message-phase";
import GameManager from "#test/testUtils/gameManager";
import { Species } from "#enums/species";
import { StatusEffect } from "#enums/status-effect";
import { initSceneWithoutEncounterPhase } from "#test/testUtils/gameManagerUtils";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Mystery Encounter Utils", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let scene: BattleScene;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    scene = game.scene;
    initSceneWithoutEncounterPhase(game.scene, [Species.ARCEUS, Species.MANAPHY]);
  });

  describe("getRandomPlayerPokemon", () => {
    it("gets a random pokemon from player party", () => {
      // Seeds are calculated to return index 0 first, 1 second (if both pokemon are legal)
      game.override.seed("random");

      let result = getRandomPlayerPokemon();
      expect(result.species.speciesId).toBe(Species.MANAPHY);

      game.override.seed("random2");

      result = getRandomPlayerPokemon();
      expect(result.species.speciesId).toBe(Species.ARCEUS);
    });

    it("gets a fainted pokemon from player party if isAllowedInBattle is false", async () => {
      // Both pokemon fainted
      scene.getPlayerParty().forEach(p => {
        p.hp = 0;
        p.trySetStatus(StatusEffect.FAINT);
        void p.updateInfo();
      });

      // Seeds are calculated to return index 0 first, 1 second (if both pokemon are legal)
      game.override.seed("random");

      let result = getRandomPlayerPokemon();
      expect(result.species.speciesId).toBe(Species.MANAPHY);

      game.override.seed("random2");

      result = getRandomPlayerPokemon();
      expect(result.species.speciesId).toBe(Species.ARCEUS);
    });

    it("gets an unfainted legal pokemon from player party if isAllowed is true and isFainted is false", async () => {
      // Only faint 1st pokemon
      const party = scene.getPlayerParty();
      party[0].hp = 0;
      party[0].trySetStatus(StatusEffect.FAINT);
      await party[0].updateInfo();

      // Seeds are calculated to return index 0 first, 1 second (if both pokemon are legal)
      game.override.seed("random");

      let result = getRandomPlayerPokemon(true);
      expect(result.species.speciesId).toBe(Species.MANAPHY);

      game.override.seed("random2");

      result = getRandomPlayerPokemon(true);
      expect(result.species.speciesId).toBe(Species.MANAPHY);
    });

    it("returns last unfainted pokemon if doNotReturnLastAbleMon is false", async () => {
      // Only faint 1st pokemon
      const party = scene.getPlayerParty();
      party[0].hp = 0;
      party[0].trySetStatus(StatusEffect.FAINT);
      await party[0].updateInfo();

      // Seeds are calculated to return index 0 first, 1 second (if both pokemon are legal)
      game.override.seed("random");

      let result = getRandomPlayerPokemon(true, false);
      expect(result.species.speciesId).toBe(Species.MANAPHY);

      game.override.seed("random2");

      result = getRandomPlayerPokemon(true, false);
      expect(result.species.speciesId).toBe(Species.MANAPHY);
    });

    it("never returns last unfainted pokemon if doNotReturnLastAbleMon is true", async () => {
      // Only faint 1st pokemon
      const party = scene.getPlayerParty();
      party[0].hp = 0;
      party[0].trySetStatus(StatusEffect.FAINT);
      await party[0].updateInfo();

      // Seeds are calculated to return index 0 first, 1 second (if both pokemon are legal)
      game.override.seed("random");

      let result = getRandomPlayerPokemon(true, false, true);
      expect(result.species.speciesId).toBe(Species.ARCEUS);

      game.override.seed("random2");

      result = getRandomPlayerPokemon(true, false, true);
      expect(result.species.speciesId).toBe(Species.ARCEUS);
    });
  });

  describe("getHighestLevelPlayerPokemon", () => {
    it("gets highest level pokemon", () => {
      const party = scene.getPlayerParty();
      party[0].level = 100;

      const result = getHighestLevelPlayerPokemon();
      expect(result.species.speciesId).toBe(Species.ARCEUS);
    });

    it("gets highest level pokemon at different index", () => {
      const party = scene.getPlayerParty();
      party[1].level = 100;

      const result = getHighestLevelPlayerPokemon();
      expect(result.species.speciesId).toBe(Species.MANAPHY);
    });

    it("breaks ties by getting returning lower index", () => {
      const party = scene.getPlayerParty();
      party[0].level = 100;
      party[1].level = 100;

      const result = getHighestLevelPlayerPokemon();
      expect(result.species.speciesId).toBe(Species.ARCEUS);
    });

    it("returns highest level unfainted if unfainted is true", async () => {
      const party = scene.getPlayerParty();
      party[0].level = 100;
      party[0].hp = 0;
      party[0].trySetStatus(StatusEffect.FAINT);
      await party[0].updateInfo();
      party[1].level = 10;

      const result = getHighestLevelPlayerPokemon(true);
      expect(result.species.speciesId).toBe(Species.MANAPHY);
    });
  });

  describe("getLowestLevelPokemon", () => {
    it("gets lowest level pokemon", () => {
      const party = scene.getPlayerParty();
      party[0].level = 100;

      const result = getLowestLevelPlayerPokemon();
      expect(result.species.speciesId).toBe(Species.MANAPHY);
    });

    it("gets lowest level pokemon at different index", () => {
      const party = scene.getPlayerParty();
      party[1].level = 100;

      const result = getLowestLevelPlayerPokemon();
      expect(result.species.speciesId).toBe(Species.ARCEUS);
    });

    it("breaks ties by getting returning lower index", () => {
      const party = scene.getPlayerParty();
      party[0].level = 100;
      party[1].level = 100;

      const result = getLowestLevelPlayerPokemon();
      expect(result.species.speciesId).toBe(Species.ARCEUS);
    });

    it("returns lowest level unfainted if unfainted is true", async () => {
      const party = scene.getPlayerParty();
      party[0].level = 10;
      party[0].hp = 0;
      party[0].trySetStatus(StatusEffect.FAINT);
      await party[0].updateInfo();
      party[1].level = 100;

      const result = getLowestLevelPlayerPokemon(true);
      expect(result.species.speciesId).toBe(Species.MANAPHY);
    });
  });

  describe("getRandomSpeciesByStarterCost", () => {
    it("gets species for a starter tier", () => {
      const result = getRandomSpeciesByStarterCost(5);
      const pokeSpecies = getPokemonSpecies(result);

      expect(pokeSpecies.speciesId).toBe(result);
      expect(speciesStarterCosts[result]).toBe(5);
    });

    it("gets species for a starter tier range", () => {
      const result = getRandomSpeciesByStarterCost([5, 8]);
      const pokeSpecies = getPokemonSpecies(result);

      expect(pokeSpecies.speciesId).toBe(result);
      expect(speciesStarterCosts[result]).toBeGreaterThanOrEqual(5);
      expect(speciesStarterCosts[result]).toBeLessThanOrEqual(8);
    });

    it("excludes species from search", () => {
      // Only 9 tiers are: Kyogre, Groudon, Rayquaza, Arceus, Zacian, Koraidon, Miraidon, Terapagos
      const result = getRandomSpeciesByStarterCost(9, [
        Species.KYOGRE,
        Species.GROUDON,
        Species.RAYQUAZA,
        Species.ARCEUS,
        Species.KORAIDON,
        Species.MIRAIDON,
        Species.TERAPAGOS,
      ]);
      const pokeSpecies = getPokemonSpecies(result);
      expect(pokeSpecies.speciesId).toBe(Species.ZACIAN);
    });

    it("gets species of specified types", () => {
      // Only 9 tiers are: Kyogre, Groudon, Rayquaza, Arceus, Zacian, Koraidon, Miraidon, Terapagos
      const result = getRandomSpeciesByStarterCost(9, undefined, [PokemonType.GROUND]);
      const pokeSpecies = getPokemonSpecies(result);
      expect(pokeSpecies.speciesId).toBe(Species.GROUDON);
    });
  });

  describe("koPlayerPokemon", () => {
    it("KOs a pokemon", () => {
      const party = scene.getPlayerParty();
      const arceus = party[0];
      arceus.hp = 100;
      expect(arceus.isAllowedInBattle()).toBe(true);

      koPlayerPokemon(arceus);
      expect(arceus.isAllowedInBattle()).toBe(false);
    });
  });

  describe("getTextWithEncounterDialogueTokens", () => {
    it("injects dialogue tokens and color styling", () => {
      scene.currentBattle.mysteryEncounter = new MysteryEncounter(null);
      scene.currentBattle.mysteryEncounter.setDialogueToken("test", "value");

      const result = getEncounterText("mysteryEncounter:unit_test_dialogue");
      expect(result).toEqual("mysteryEncounter:unit_test_dialogue");
    });

    it("can perform nested dialogue token injection", () => {
      scene.currentBattle.mysteryEncounter = new MysteryEncounter(null);
      scene.currentBattle.mysteryEncounter.setDialogueToken("test", "value");
      scene.currentBattle.mysteryEncounter.setDialogueToken("testvalue", "new");

      const result = getEncounterText("mysteryEncounter:unit_test_dialogue");
      expect(result).toEqual("mysteryEncounter:unit_test_dialogue");
    });
  });

  describe("queueEncounterMessage", () => {
    it("queues a message with encounter dialogue tokens", async () => {
      scene.currentBattle.mysteryEncounter = new MysteryEncounter(null);
      scene.currentBattle.mysteryEncounter.setDialogueToken("test", "value");
      const spy = vi.spyOn(game.scene, "queueMessage");
      const phaseSpy = vi.spyOn(game.scene, "unshiftPhase");

      queueEncounterMessage("mysteryEncounter:unit_test_dialogue");
      expect(spy).toHaveBeenCalledWith("mysteryEncounter:unit_test_dialogue", null, true);
      expect(phaseSpy).toHaveBeenCalledWith(expect.any(MessagePhase));
    });
  });

  describe("showEncounterText", () => {
    it("showText with dialogue tokens", async () => {
      scene.currentBattle.mysteryEncounter = new MysteryEncounter(null);
      scene.currentBattle.mysteryEncounter.setDialogueToken("test", "value");
      const spy = vi.spyOn(game.scene.ui, "showText");

      await showEncounterText("mysteryEncounter:unit_test_dialogue");
      expect(spy).toHaveBeenCalledWith(
        "mysteryEncounter:unit_test_dialogue",
        null,
        expect.any(Function),
        0,
        true,
        null,
      );
    });
  });

  describe("showEncounterDialogue", () => {
    it("showText with dialogue tokens", async () => {
      scene.currentBattle.mysteryEncounter = new MysteryEncounter(null);
      scene.currentBattle.mysteryEncounter.setDialogueToken("test", "value");
      const spy = vi.spyOn(game.scene.ui, "showDialogue");

      await showEncounterDialogue("mysteryEncounter:unit_test_dialogue", "mysteryEncounter:unit_test_dialogue");
      expect(spy).toHaveBeenCalledWith(
        "mysteryEncounter:unit_test_dialogue",
        "mysteryEncounter:unit_test_dialogue",
        null,
        expect.any(Function),
        0,
      );
    });
  });
});
