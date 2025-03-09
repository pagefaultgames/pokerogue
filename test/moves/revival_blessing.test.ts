import { BattlerIndex } from "#app/battle";
import { MoveResult } from "#app/field/pokemon";
import { toDmgValue } from "#app/utils";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
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
      .moveset([Moves.SPLASH, Moves.REVIVAL_BLESSING, Moves.MEMENTO])
      .ability(Abilities.BALL_FETCH)
      .battleType("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should revive a selected fainted Pokemon when used by the player", async () => {
    await game.classicMode.startBattle([Species.FEEBAS, Species.MAGIKARP]);

    game.move.select(Moves.MEMENTO);
    game.doSelectPartyPokemon(1, "SwitchPhase");
    await game.toNextTurn();

    const player = game.scene.getPlayerPokemon()!;

    expect(player.species.speciesId).toBe(Species.MAGIKARP);
    game.move.select(Moves.REVIVAL_BLESSING);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    game.doSelectPartyPokemon(1, "RevivalBlessingPhase");

    await game.phaseInterceptor.to("MoveEndPhase", false);

    const revivedPokemon = game.scene.getPlayerParty()[1];
    expect(revivedPokemon.status?.effect).toBeFalsy();
    expect(revivedPokemon.hp).toBe(Math.floor(revivedPokemon.getMaxHp() / 2));
  });

  it("should revive a random fainted enemy when used by an enemy Trainer", async () => {
    game.override.enemyMoveset(Moves.REVIVAL_BLESSING).startingWave(8);

    await game.classicMode.startBattle([Species.MAGIKARP]);

    game.move.select(Moves.SPLASH);
    await game.doKillOpponents();

    await game.toNextTurn();
    game.move.select(Moves.SPLASH);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);

    await game.phaseInterceptor.to("MoveEndPhase", false);

    const revivedPokemon = game.scene.getEnemyParty()[1];
    expect(revivedPokemon.status?.effect).toBeFalsy();
    expect(revivedPokemon.hp).toBe(Math.floor(revivedPokemon.getMaxHp() / 2));
  });

  it("should fail when there are no fainted Pokemon to target", async () => {
    await game.classicMode.startBattle([Species.FEEBAS, Species.MAGIKARP]);

    game.move.select(Moves.REVIVAL_BLESSING);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEndPhase", false);

    const player = game.scene.getPlayerPokemon()!;
    expect(player.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should revive a player pokemon and immediately send it back out if used in the same turn it fainted in doubles", async () => {
    game.override
      .battleType("double")
      .enemyMoveset([Moves.SPLASH, Moves.FISSURE])
      .enemyAbility(Abilities.NO_GUARD)
      .enemyLevel(100);
    await game.classicMode.startBattle([Species.FEEBAS, Species.MILOTIC, Species.GYARADOS]);

    const feebas = game.scene.getPlayerField()[0];

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.REVIVAL_BLESSING, 1);
    await game.forceEnemyMove(Moves.FISSURE, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER_2]);

    await game.phaseInterceptor.to("MoveEndPhase");
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(feebas.isFainted()).toBe(true);

    game.doSelectPartyPokemon(0, "RevivalBlessingPhase");
    await game.toNextTurn();

    expect(feebas.isFainted()).toBe(false);
    expect(feebas.hp).toBe(toDmgValue(0.5 * feebas.getMaxHp()));
    expect(game.scene.getPlayerField()[0]).toBe(feebas);
  });
});
