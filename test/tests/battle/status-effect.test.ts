import type { PostAttackContactApplyStatusEffectAbAttr } from "#abilities/ab-attrs";
import { allAbilities } from "#data/data-lists";
import { Status } from "#data/status-effect";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { ObtainStatusEffectPhase } from "#phases/obtain-status-effect-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Status Effects", () => {
  describe("Paralysis", () => {
    let phaserGame: Phaser.Game;
    let game: GameManager;

    beforeAll(() => {
      phaserGame = new Phaser.Game({
        type: Phaser.HEADLESS,
      });
    });

    beforeEach(() => {
      game = new GameManager(phaserGame);

      game.override
        .enemySpecies(SpeciesId.MAGIKARP)
        .enemyMoveset(MoveId.SPLASH)
        .enemyAbility(AbilityId.BALL_FETCH)
        .ability(AbilityId.BALL_FETCH)
        .statusEffect(StatusEffect.PARALYSIS);
    });

    it("causes the pokemon's move to fail when activated", async () => {
      await game.classicMode.startBattle(SpeciesId.FEEBAS);

      game.move.use(MoveId.QUICK_ATTACK);
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

    beforeEach(() => {
      game = new GameManager(phaserGame);
      game.override
        .ability(AbilityId.BALL_FETCH)
        .battleStyle("single")
        .criticalHits(false)
        .enemySpecies(SpeciesId.MAGIKARP)
        .enemyAbility(AbilityId.BALL_FETCH)
        .enemyMoveset(MoveId.SPLASH);
    });

    it("should last the appropriate number of turns", async () => {
      await game.classicMode.startBattle(SpeciesId.FEEBAS);

      const player = game.field.getPlayerPokemon();
      player.status = new Status(StatusEffect.SLEEP, 0, 4);

      game.move.use(MoveId.SPLASH);
      await game.toNextTurn();

      expect(player.status.effect).toBe(StatusEffect.SLEEP);

      game.move.use(MoveId.SPLASH);
      await game.toNextTurn();

      expect(player.status.effect).toBe(StatusEffect.SLEEP);

      game.move.use(MoveId.SPLASH);
      await game.toNextTurn();

      expect(player.status.effect).toBe(StatusEffect.SLEEP);
      expect(player.getLastXMoves(1)[0].result).toBe(MoveResult.FAIL);

      game.move.use(MoveId.SPLASH);
      await game.toNextTurn();

      expect(player.status).toBeFalsy();
      expect(player.getLastXMoves(1)[0].result).toBe(MoveResult.SUCCESS);
    });
  });

  describe("General", () => {
    let phaserGame: Phaser.Game;
    let game: GameManager;

    beforeAll(() => {
      phaserGame = new Phaser.Game({
        type: Phaser.HEADLESS,
      });
    });

    beforeEach(() => {
      game = new GameManager(phaserGame);
      game.override
        .ability(AbilityId.BALL_FETCH)
        .battleStyle("single")
        .criticalHits(false)
        .enemySpecies(SpeciesId.MAGIKARP)
        .enemyAbility(AbilityId.BALL_FETCH)
        .enemyMoveset(MoveId.SPLASH);
    });

    it("should not inflict a 0 HP mon with a status", async () => {
      await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.MILOTIC);

      const player = game.field.getPlayerPokemon();
      player.hp = 0;

      expect(player.trySetStatus(StatusEffect.BURN)).toBe(false);
      expect(player).not.toHaveStatusEffect(StatusEffect.BURN);
    });

    it("multiple status effects from the same interaction should not overwrite each other", async () => {
      game.override.ability(AbilityId.POISON_TOUCH);
      await game.classicMode.startBattle(SpeciesId.PIKACHU);

      // Force poison touch to always apply
      vi.spyOn(
        allAbilities[AbilityId.POISON_TOUCH].getAttrs(
          "PostAttackContactApplyStatusEffectAbAttr",
          // expose chance, which is private, for testing purpose, but keep type safety otherwise
        )[0] as unknown as Omit<PostAttackContactApplyStatusEffectAbAttr, "chance"> & { chance: number },
        "chance",
        "get",
      ).mockReturnValue(100);
      const statusEffectPhaseSpy = vi.spyOn(ObtainStatusEffectPhase.prototype, "start");

      game.move.use(MoveId.NUZZLE);
      await game.toEndOfTurn();

      expect(statusEffectPhaseSpy).toHaveBeenCalledOnce();
      const enemy = game.field.getEnemyPokemon();
      // This test does not care which status effect is applied, as long as one is.
      expect(enemy.status?.effect).toBeOneOf([StatusEffect.POISON, StatusEffect.PARALYSIS]);
    });
  });
});
