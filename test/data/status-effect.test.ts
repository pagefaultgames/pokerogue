import {
  getStatusEffectActivationText,
  getStatusEffectDescriptor,
  getStatusEffectHealText,
  getStatusEffectObtainText,
  getStatusEffectOverlapText,
  Status,
} from "#data/status-effect";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
import { mockI18next } from "#test/test-utils/test-utils";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

const pokemonName = "PKM";
const sourceText = "SOURCE";

// TODO: Make this a giant it.each
describe("Status Effect Messages", () => {
  describe("NONE", () => {
    const statusEffect = StatusEffect.NONE;

    it("should return the obtain text", () => {
      mockI18next();

      const text = getStatusEffectObtainText(statusEffect, pokemonName);
      expect(text).toBe("");

      const emptySourceText = getStatusEffectObtainText(statusEffect, pokemonName, "");
      expect(emptySourceText).toBe("");
    });

    it("should return the source-obtain text", () => {
      mockI18next();

      const text = getStatusEffectObtainText(statusEffect, pokemonName, sourceText);
      expect(text).toBe("");

      const emptySourceText = getStatusEffectObtainText(statusEffect, pokemonName, "");
      expect(emptySourceText).toBe("");
    });

    it("should return the activation text", () => {
      mockI18next();
      const text = getStatusEffectActivationText(statusEffect, pokemonName);
      expect(text).toBe("");
    });

    it("should return the overlap text", () => {
      mockI18next();
      const text = getStatusEffectOverlapText(statusEffect, pokemonName);
      expect(text).toBe("");
    });

    it("should return the heal text", () => {
      mockI18next();
      const text = getStatusEffectHealText(statusEffect, pokemonName);
      expect(text).toBe("");
    });

    it("should return the descriptor", () => {
      mockI18next();
      const text = getStatusEffectDescriptor(statusEffect);
      expect(text).toBe("");
    });
  });

  describe("POISON", () => {
    const statusEffect = StatusEffect.POISON;

    it("should return the obtain text", () => {
      mockI18next();

      const text = getStatusEffectObtainText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:poison.obtain");

      const emptySourceText = getStatusEffectObtainText(statusEffect, pokemonName, "");
      expect(emptySourceText).toBe("statusEffect:poison.obtain");
    });

    it("should return the activation text", () => {
      mockI18next();
      const text = getStatusEffectActivationText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:poison.activation");
    });

    it("should return the descriptor", () => {
      mockI18next();
      const text = getStatusEffectDescriptor(statusEffect);
      expect(text).toBe("statusEffect:poison.description");
    });

    it("should return the heal text", () => {
      mockI18next();
      const text = getStatusEffectHealText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:poison.heal");
    });

    it("should return the overlap text", () => {
      mockI18next();
      const text = getStatusEffectOverlapText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:poison.overlap");
    });
  });

  describe("TOXIC", () => {
    const statusEffect = StatusEffect.TOXIC;

    it("should return the obtain text", () => {
      mockI18next();

      const text = getStatusEffectObtainText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:toxic.obtain");

      const emptySourceText = getStatusEffectObtainText(statusEffect, pokemonName, "");
      expect(emptySourceText).toBe("statusEffect:toxic.obtain");
    });

    it("should return the activation text", () => {
      mockI18next();
      const text = getStatusEffectActivationText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:toxic.activation");
    });

    it("should return the descriptor", () => {
      mockI18next();
      const text = getStatusEffectDescriptor(statusEffect);
      expect(text).toBe("statusEffect:toxic.description");
    });

    it("should return the heal text", () => {
      mockI18next();
      const text = getStatusEffectHealText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:toxic.heal");
    });

    it("should return the overlap text", () => {
      mockI18next();
      const text = getStatusEffectOverlapText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:toxic.overlap");
    });
  });

  describe("PARALYSIS", () => {
    const statusEffect = StatusEffect.PARALYSIS;

    it("should return the obtain text", () => {
      mockI18next();

      const text = getStatusEffectObtainText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:paralysis.obtain");

      const emptySourceText = getStatusEffectObtainText(statusEffect, pokemonName, "");
      expect(emptySourceText).toBe("statusEffect:paralysis.obtain");
    });

    it("should return the activation text", () => {
      mockI18next();
      const text = getStatusEffectActivationText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:paralysis.activation");
    });

    it("should return the descriptor", () => {
      mockI18next();
      const text = getStatusEffectDescriptor(statusEffect);
      expect(text).toBe("statusEffect:paralysis.description");
    });

    it("should return the heal text", () => {
      mockI18next();
      const text = getStatusEffectHealText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:paralysis.heal");
    });

    it("should return the overlap text", () => {
      mockI18next();
      const text = getStatusEffectOverlapText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:paralysis.overlap");
    });
  });

  describe("SLEEP", () => {
    const statusEffect = StatusEffect.SLEEP;

    it("should return the obtain text", () => {
      mockI18next();

      const text = getStatusEffectObtainText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:sleep.obtain");

      const emptySourceText = getStatusEffectObtainText(statusEffect, pokemonName, "");
      expect(emptySourceText).toBe("statusEffect:sleep.obtain");
    });

    it("should return the activation text", () => {
      mockI18next();
      const text = getStatusEffectActivationText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:sleep.activation");
    });

    it("should return the descriptor", () => {
      mockI18next();
      const text = getStatusEffectDescriptor(statusEffect);
      expect(text).toBe("statusEffect:sleep.description");
    });

    it("should return the heal text", () => {
      mockI18next();
      const text = getStatusEffectHealText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:sleep.heal");
    });

    it("should return the overlap text", () => {
      mockI18next();
      const text = getStatusEffectOverlapText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:sleep.overlap");
    });
  });

  describe("FREEZE", () => {
    const statusEffect = StatusEffect.FREEZE;

    it("should return the obtain text", () => {
      mockI18next();

      const text = getStatusEffectObtainText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:freeze.obtain");

      const emptySourceText = getStatusEffectObtainText(statusEffect, pokemonName, "");
      expect(emptySourceText).toBe("statusEffect:freeze.obtain");
    });

    it("should return the activation text", () => {
      mockI18next();
      const text = getStatusEffectActivationText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:freeze.activation");
    });

    it("should return the descriptor", () => {
      mockI18next();
      const text = getStatusEffectDescriptor(statusEffect);
      expect(text).toBe("statusEffect:freeze.description");
    });

    it("should return the heal text", () => {
      mockI18next();
      const text = getStatusEffectHealText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:freeze.heal");
    });

    it("should return the overlap text", () => {
      mockI18next();
      const text = getStatusEffectOverlapText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:freeze.overlap");
    });
  });

  describe("BURN", () => {
    const statusEffect = StatusEffect.BURN;

    it("should return the obtain text", () => {
      mockI18next();

      const text = getStatusEffectObtainText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:burn.obtain");

      const emptySourceText = getStatusEffectObtainText(statusEffect, pokemonName, "");
      expect(emptySourceText).toBe("statusEffect:burn.obtain");
    });

    it("should return the activation text", () => {
      mockI18next();
      const text = getStatusEffectActivationText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:burn.activation");
    });

    it("should return the descriptor", () => {
      mockI18next();
      const text = getStatusEffectDescriptor(statusEffect);
      expect(text).toBe("statusEffect:burn.description");
    });

    it("should return the heal text", () => {
      mockI18next();
      const text = getStatusEffectHealText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:burn.heal");
    });

    it("should return the overlap text", () => {
      mockI18next();
      const text = getStatusEffectOverlapText(statusEffect, pokemonName);
      expect(text).toBe("statusEffect:burn.overlap");
    });
  });
});

describe("Status Effects", () => {
  describe("Paralysis", () => {
    let phaserGame: Phaser.Game;
    let game: GameManager;

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

      game.override
        .enemySpecies(SpeciesId.MAGIKARP)
        .enemyMoveset(MoveId.SPLASH)
        .enemyAbility(AbilityId.BALL_FETCH)
        .moveset([MoveId.QUICK_ATTACK])
        .ability(AbilityId.BALL_FETCH)
        .statusEffect(StatusEffect.PARALYSIS);
    });

    it("causes the pokemon's move to fail when activated", async () => {
      await game.classicMode.startBattle([SpeciesId.FEEBAS]);

      game.move.select(MoveId.QUICK_ATTACK);
      await game.move.forceStatusActivation(true);
      await game.toNextTurn();

      expect(game.field.getEnemyPokemon().isFullHp()).toBe(true);
      expect(game.field.getPlayerPokemon().getLastXMoves(1)[0].result).toBe(MoveResult.FAIL);
    });
  });

  describe("Sleep", () => {
    let phaserGame: Phaser.Game;
    let game: GameManager;

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
      game.override
        .moveset([MoveId.SPLASH])
        .ability(AbilityId.BALL_FETCH)
        .battleStyle("single")
        .criticalHits(false)
        .enemySpecies(SpeciesId.MAGIKARP)
        .enemyAbility(AbilityId.BALL_FETCH)
        .enemyMoveset(MoveId.SPLASH);
    });

    it("should last the appropriate number of turns", async () => {
      await game.classicMode.startBattle([SpeciesId.FEEBAS]);

      const player = game.field.getPlayerPokemon();
      player.status = new Status(StatusEffect.SLEEP, 0, 4);

      game.move.select(MoveId.SPLASH);
      await game.toNextTurn();

      expect(player.status.effect).toBe(StatusEffect.SLEEP);

      game.move.select(MoveId.SPLASH);
      await game.toNextTurn();

      expect(player.status.effect).toBe(StatusEffect.SLEEP);

      game.move.select(MoveId.SPLASH);
      await game.toNextTurn();

      expect(player.status.effect).toBe(StatusEffect.SLEEP);
      expect(player.getLastXMoves(1)[0].result).toBe(MoveResult.FAIL);

      game.move.select(MoveId.SPLASH);
      await game.toNextTurn();

      expect(player.status).toBeFalsy();
      expect(player.getLastXMoves(1)[0].result).toBe(MoveResult.SUCCESS);
    });
  });

  describe("Behavior", () => {
    let phaserGame: Phaser.Game;
    let game: GameManager;

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
      game.override
        .moveset([MoveId.SPLASH])
        .ability(AbilityId.BALL_FETCH)
        .battleStyle("single")
        .criticalHits(false)
        .enemySpecies(SpeciesId.MAGIKARP)
        .enemyAbility(AbilityId.BALL_FETCH)
        .enemyMoveset(MoveId.NUZZLE)
        .enemyLevel(2000);
    });

    it("should not inflict a 0 HP mon with a status", async () => {
      await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

      const player = game.field.getPlayerPokemon();
      player.hp = 0;

      expect(player.trySetStatus(StatusEffect.BURN)).toBe(false);
      expect(player.status?.effect).not.toBe(StatusEffect.BURN);
    });
  });
});
