import {
  Status,
  StatusEffect,
  getStatusEffectActivationText,
  getStatusEffectDescriptor,
  getStatusEffectHealText,
  getStatusEffectObtainText,
  getStatusEffectOverlapText,
} from "#app/data/status-effect";
import { MoveResult } from "#app/field/pokemon";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import { mockI18next } from "#test/utils/testUtils";
import i18next from "i18next";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const pokemonName = "PKM";
const sourceText = "SOURCE";

describe("Status Effect Messages", () => {
  beforeAll(() => {
    i18next.init();
  });

  describe("NONE", () => {
    const statusEffect = StatusEffect.NONE;

    it("should return the obtain text", () => {
      mockI18next();

      const text = getStatusEffectObtainText(statusEffect, pokemonName);
      console.log("text:", text);
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

  afterEach(() => {
    vi.resetAllMocks();
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
        .enemySpecies(Species.MAGIKARP)
        .enemyMoveset(Moves.SPLASH)
        .enemyAbility(Abilities.BALL_FETCH)
        .moveset([ Moves.QUICK_ATTACK ])
        .ability(Abilities.BALL_FETCH)
        .statusEffect(StatusEffect.PARALYSIS);
    });

    it("causes the pokemon's move to fail when activated", async () => {
      await game.classicMode.startBattle([ Species.FEEBAS ]);

      game.move.select(Moves.QUICK_ATTACK);
      await game.move.forceStatusActivation(true);
      await game.toNextTurn();

      expect(game.scene.getEnemyPokemon()!.isFullHp()).toBe(true);
      expect(game.scene.getPlayerPokemon()!.getLastXMoves(1)[0].result).toBe(MoveResult.FAIL);
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
        .moveset([ Moves.SPLASH ])
        .ability(Abilities.BALL_FETCH)
        .battleType("single")
        .disableCrits()
        .enemySpecies(Species.MAGIKARP)
        .enemyAbility(Abilities.BALL_FETCH)
        .enemyMoveset(Moves.SPLASH);
    });

    it("should last the appropriate number of turns", async () => {
      await game.classicMode.startBattle([ Species.FEEBAS ]);

      const player = game.scene.getPlayerPokemon()!;
      player.status = new Status(StatusEffect.SLEEP, 0, 4);

      game.move.select(Moves.SPLASH);
      await game.toNextTurn();

      expect(player.status.effect).toBe(StatusEffect.SLEEP);

      game.move.select(Moves.SPLASH);
      await game.toNextTurn();

      expect(player.status.effect).toBe(StatusEffect.SLEEP);

      game.move.select(Moves.SPLASH);
      await game.toNextTurn();

      expect(player.status.effect).toBe(StatusEffect.SLEEP);
      expect(player.getLastXMoves(1)[0].result).toBe(MoveResult.FAIL);

      game.move.select(Moves.SPLASH);
      await game.toNextTurn();

      expect(player.status?.effect).toBeUndefined();
      expect(player.getLastXMoves(1)[0].result).toBe(MoveResult.SUCCESS);
    });
  });
});
