import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Burning Jealousy", () => {
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
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.ICE_SCALES)
      .enemyMoveset([MoveId.HOWL])
      .startingLevel(10)
      .enemyLevel(10)
      .starterSpecies(SpeciesId.FEEBAS)
      .ability(AbilityId.BALL_FETCH)
      .moveset([MoveId.BURNING_JEALOUSY, MoveId.GROWL]);
  });

  it("should burn the opponent if their stat stages were raised", async () => {
    await game.classicMode.startBattle();

    const enemy = game.field.getEnemyPokemon();

    game.move.select(MoveId.BURNING_JEALOUSY);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy.status?.effect).toBe(StatusEffect.BURN);
  });

  it("should still burn the opponent if their stat stages were both raised and lowered in the same turn", async () => {
    game.override.starterSpecies(0).battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.ABRA]);

    const enemy = game.field.getEnemyPokemon();

    game.move.select(MoveId.BURNING_JEALOUSY);
    game.move.select(MoveId.GROWL, 1);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy.status?.effect).toBe(StatusEffect.BURN);
  });

  it("should ignore stat stages raised by IMPOSTER", async () => {
    game.override.enemySpecies(SpeciesId.DITTO).enemyAbility(AbilityId.IMPOSTER).enemyMoveset(MoveId.SPLASH);
    await game.classicMode.startBattle();

    const enemy = game.field.getEnemyPokemon();

    game.move.select(MoveId.BURNING_JEALOUSY);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy.status?.effect).toBeUndefined();
  });

  // TODO: Make this test if WP is implemented
  it.todo("should ignore weakness policy", async () => {
    await game.classicMode.startBattle();
  });

  it("should be boosted by Sheer Force even if opponent didn't raise stat stages", async () => {
    game.override.ability(AbilityId.SHEER_FORCE).enemyMoveset(MoveId.SPLASH);
    vi.spyOn(allMoves[MoveId.BURNING_JEALOUSY], "calculateBattlePower");
    await game.classicMode.startBattle();

    game.move.select(MoveId.BURNING_JEALOUSY);
    await game.phaseInterceptor.to("BerryPhase");

    expect(allMoves[MoveId.BURNING_JEALOUSY].calculateBattlePower).toHaveReturnedWith(
      allMoves[MoveId.BURNING_JEALOUSY].power * 1.3,
    );
  });
});
