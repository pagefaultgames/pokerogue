import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { DamageAnimPhase } from "#phases/damage-anim-phase";
import { MoveEndPhase } from "#phases/move-end-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";

describe("Abilities - Sturdy", () => {
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
      .starterSpecies(SpeciesId.LUCARIO)
      .startingLevel(100)
      .moveset([MoveId.CLOSE_COMBAT, MoveId.FISSURE])
      .enemySpecies(SpeciesId.ARON)
      .enemyLevel(5)
      .enemyAbility(AbilityId.STURDY);
  });

  test("Sturdy activates when user is at full HP", async () => {
    await game.classicMode.startBattle();
    game.move.select(MoveId.CLOSE_COMBAT);
    await game.phaseInterceptor.to(MoveEndPhase);
    expect(game.field.getEnemyPokemon().hp).toBe(1);
  });

  test("Sturdy doesn't activate when user is not at full HP", async () => {
    await game.classicMode.startBattle();

    const enemyPokemon = game.field.getEnemyPokemon();
    enemyPokemon.hp = enemyPokemon.getMaxHp() - 1;

    game.move.select(MoveId.CLOSE_COMBAT);
    await game.phaseInterceptor.to(DamageAnimPhase);

    expect(enemyPokemon.hp).toBe(0);
    expect(enemyPokemon.isFainted()).toBe(true);
  });

  test("Sturdy pokemon should be immune to OHKO moves", async () => {
    await game.classicMode.startBattle();
    game.move.select(MoveId.FISSURE);
    await game.phaseInterceptor.to(MoveEndPhase);

    const enemyPokemon = game.field.getEnemyPokemon();
    expect(enemyPokemon.isFullHp()).toBe(true);
  });
});
