import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Smelling Salts", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({ type: Phaser.HEADLESS });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .battleStyle("single")
      .criticalHits(false)
      .ability(AbilityId.BALL_FETCH)
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyLevel(100)
      .enemyMoveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.BALL_FETCH);
  });

  it("should cure the target's paralysis", async () => {
    game.override.enemyStatusEffect(StatusEffect.PARALYSIS);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const enemy = game.field.getEnemyPokemon();

    game.move.use(MoveId.SMELLING_SALTS);
    await game.toNextTurn();

    expect(enemy).toHaveStatusEffect(StatusEffect.NONE);
  });

  it("should not cure the user's own paralysis", async () => {
    game.override.statusEffect(StatusEffect.PARALYSIS);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    game.move.use(MoveId.SMELLING_SALTS);
    await game.move.forceStatusActivation(false);
    await game.toNextTurn();

    expect(enemy).not.toHaveFullHp();
    expect(player).toHaveStatusEffect(StatusEffect.PARALYSIS);
  });
});
