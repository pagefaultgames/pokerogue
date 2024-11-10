import { BattlerIndex } from "#app/battle";
import { toDmgValue } from "#app/utils";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Revival Blessing", () => {
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
      .moveset([ Moves.SPLASH, Moves.REVIVAL_BLESSING ])
      .ability(Abilities.BALL_FETCH)
      .battleType("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.NO_GUARD)
      .enemyMoveset([ Moves.SPLASH, Moves.FISSURE ])
      .enemyLevel(10);
  });

  it("should revive a player pokemon to half health", async () => {
    await game.classicMode.startBattle([ Species.FEEBAS, Species.MILOTIC ]);

    const feebas = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.FISSURE);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    expect(feebas.isFainted()).toBe(true);

    game.move.select(Moves.REVIVAL_BLESSING);
    await game.forceEnemyMove(Moves.SPLASH);
    game.doSelectPartyPokemon(1, "MoveEffectPhase");
    await game.toNextTurn();

    expect(feebas.isFainted()).toBe(false);
    expect(feebas.hp).toBe(toDmgValue(0.5 * feebas.getMaxHp()));
  });

  it("should revive a player pokemon to half health and send it back out if used in the same turn it fainted in doubles", async () => {
    game.override.battleType("double");
    await game.classicMode.startBattle([ Species.FEEBAS, Species.MILOTIC, Species.GYARADOS ]);

    const feebas = game.scene.getPlayerField()[0];

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.REVIVAL_BLESSING, 1);
    await game.forceEnemyMove(Moves.FISSURE, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER_2 ]);

    await game.phaseInterceptor.to("MoveEndPhase");
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(feebas.isFainted()).toBe(true);

    game.doSelectPartyPokemon(0, "MoveEffectPhase");
    await game.toNextTurn();

    expect(feebas.isFainted()).toBe(false);
    expect(feebas.hp).toBe(toDmgValue(0.5 * feebas.getMaxHp()));
    expect(game.scene.getPlayerField()[0]).toBe(feebas);
  });
});
