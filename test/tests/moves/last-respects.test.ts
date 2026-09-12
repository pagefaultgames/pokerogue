import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import type { Move } from "#moves/move";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Last Respects", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  let move: Move;
  let basePower: number;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    move = allMoves[MoveId.LAST_RESPECTS];
    basePower = move.power;
    game.override
      .battleStyle("single")
      .criticalHits(false)
      .ability(AbilityId.BALL_FETCH)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(1);

    vi.spyOn(move, "calculateBattlePower");
  });

  it("should have 150 power if 2 allies faint before using move", async () => {
    await game.classicMode.startBattle(SpeciesId.BULBASAUR, SpeciesId.CHARMANDER, SpeciesId.SQUIRTLE);

    game.move.use(MoveId.MEMENTO);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    game.move.use(MoveId.MEMENTO);
    game.doSelectPartyPokemon(2);
    await game.toNextTurn();

    game.move.use(MoveId.LAST_RESPECTS);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(move.calculateBattlePower).toHaveReturnedWith(basePower + 2 * 50);
  });

  it("should have 200 power if an ally fainted twice and another one once", async () => {
    await game.classicMode.startBattle(SpeciesId.BULBASAUR, SpeciesId.CHARMANDER, SpeciesId.SQUIRTLE);

    game.move.use(MoveId.MEMENTO);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    game.doRevivePokemon(1);
    game.move.use(MoveId.MEMENTO);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    game.move.use(MoveId.MEMENTO);
    game.doSelectPartyPokemon(2);
    await game.toNextTurn();

    game.move.use(MoveId.LAST_RESPECTS);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(move.calculateBattlePower).toHaveReturnedWith(basePower + 3 * 50);
  });

  it("should maintain its power for the player during the next battle if it is within the same arena encounter, even on reload", async () => {
    await game.classicMode.startBattle(SpeciesId.BULBASAUR, SpeciesId.CHARMANDER, SpeciesId.SQUIRTLE);

    game.move.use(MoveId.LUNAR_DANCE);
    game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    game.move.use(MoveId.LAST_RESPECTS);
    await game.toNextWave();

    expect(game.scene.arena.playerFaints).toBe(1);

    await game.reload.reloadSession();

    expect(game.scene.arena.playerFaints).toBe(1);

    game.move.use(MoveId.LAST_RESPECTS);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("MoveEndPhase");
    expect(move.calculateBattlePower).toHaveLastReturnedWith(basePower + 1 * 50);
  });

  it("should reset enemyFaints count on progressing to the next wave.", async () => {
    await game.classicMode.startBattle(SpeciesId.BULBASAUR, SpeciesId.CHARMANDER, SpeciesId.SQUIRTLE);

    game.move.use(MoveId.GUILLOTINE);
    await game.toEndOfTurn();

    expect(game.scene.currentBattle.enemyFaints).toBe(1);

    await game.toNextWave();

    // reset on new wave
    expect(game.scene.currentBattle.waveIndex).toBe(2);
    expect(game.scene.currentBattle.enemyFaints).toBe(0);

    // TODO: Do this automatically on load and remove this call
    game.removeEnemyHeldItems();

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.LAST_RESPECTS);
    await game.toEndOfTurn();

    expect(move.calculateBattlePower).toHaveLastReturnedWith(50);
  });

  it("should reset playerFaints count if we enter new trainer battle", async () => {
    game.override.startingWave(4);

    await game.classicMode.startBattle(SpeciesId.BULBASAUR, SpeciesId.CHARMANDER, SpeciesId.SQUIRTLE);

    game.move.use(MoveId.LUNAR_DANCE);
    game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    game.move.use(MoveId.LAST_RESPECTS);
    await game.toNextWave();

    game.move.use(MoveId.LAST_RESPECTS);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(move.calculateBattlePower).toHaveLastReturnedWith(basePower);
  });

  it("should reset playerFaints count if we enter new biome", async () => {
    game.override.startingWave(10);

    await game.classicMode.startBattle(SpeciesId.BULBASAUR, SpeciesId.CHARMANDER, SpeciesId.SQUIRTLE);

    game.move.use(MoveId.LUNAR_DANCE);
    game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    game.move.use(MoveId.LAST_RESPECTS);
    await game.toNextWave();

    game.move.use(MoveId.LAST_RESPECTS);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(move.calculateBattlePower).toHaveLastReturnedWith(basePower);
  });
});
