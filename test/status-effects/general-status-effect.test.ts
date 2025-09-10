import { allAbilities } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { ObtainStatusEffectPhase } from "#phases/obtain-status-effect-phase";
import { GameManager } from "#test/test-utils/game-manager";
import type { PostAttackContactApplyStatusEffectAbAttr } from "#types/ability-types";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

describe("Status Effects - General", () => {
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
      .battleStyle("single")
      .enemyLevel(5)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .ability(AbilityId.BALL_FETCH);
  });

  test("multiple status effects from the same interaction should not overwrite each other", async () => {
    game.override.ability(AbilityId.POISON_TOUCH).moveset([MoveId.NUZZLE]);
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);

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

    game.move.select(MoveId.NUZZLE);
    await game.toEndOfTurn();

    expect(statusEffectPhaseSpy).toHaveBeenCalledOnce();
    const enemy = game.field.getEnemyPokemon();
    // This test does not care which status effect is applied, as long as one is.
    expect(enemy.status?.effect).toBeOneOf([StatusEffect.POISON, StatusEffect.PARALYSIS]);
  });
});
