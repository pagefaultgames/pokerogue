import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { TurnStartPhase } from "#app/phases/turn-start-phase";

describe("Abilities - Stall", () => {
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
    game.override.battleType("single");
    game.override.disableCrits();
    game.override.enemySpecies(Species.REGIELEKI);
    game.override.enemyAbility(Abilities.STALL);
    game.override.enemyMoveset([Moves.QUICK_ATTACK, Moves.QUICK_ATTACK, Moves.QUICK_ATTACK, Moves.QUICK_ATTACK]);
    game.override.moveset([Moves.QUICK_ATTACK, Moves.TACKLE]);
  });

  /**
   * References:
   * https://bulbapedia.bulbagarden.net/wiki/Stall_(Ability)
   * https://bulbapedia.bulbagarden.net/wiki/Priority
   **/

  it("Pokemon with Stall should move last in its priority bracket regardless of speed", async () => {
    await game.startBattle([Species.SHUCKLE]);

    const playerIndex = game.scene.getPlayerPokemon()!.getBattlerIndex();
    const enemyIndex = game.scene.getEnemyPokemon()!.getBattlerIndex();

    game.move.select(Moves.QUICK_ATTACK);

    await game.phaseInterceptor.to(TurnStartPhase, false);
    const phase = game.scene.getCurrentPhase() as TurnStartPhase;
    const speedOrder = phase.getSpeedOrder();
    const commandOrder = phase.getCommandOrder();
    // The player Pokemon (without Stall) goes first despite having lower speed than the opponent.
    // The opponent Pokemon (with Stall) goes last despite having higher speed than the player Pokemon.
    expect(speedOrder).toEqual([enemyIndex, playerIndex]);
    expect(commandOrder).toEqual([playerIndex, enemyIndex]);
  }, 20000);

  it("Pokemon with Stall will go first if a move that is in a higher priority bracket than the opponent's move is used", async () => {
    await game.startBattle([Species.SHUCKLE]);

    const playerIndex = game.scene.getPlayerPokemon()!.getBattlerIndex();
    const enemyIndex = game.scene.getEnemyPokemon()!.getBattlerIndex();

    game.move.select(Moves.TACKLE);

    await game.phaseInterceptor.to(TurnStartPhase, false);
    const phase = game.scene.getCurrentPhase() as TurnStartPhase;
    const speedOrder = phase.getSpeedOrder();
    const commandOrder = phase.getCommandOrder();
    // The opponent Pokemon (with Stall) goes first because its move is still within a higher priority bracket than its opponent.
    // The player Pokemon goes second because its move is in a lower priority bracket.
    expect(speedOrder).toEqual([enemyIndex, playerIndex]);
    expect(commandOrder).toEqual([enemyIndex, playerIndex]);
  }, 20000);

  it("If both Pokemon have stall and use the same move, speed is used to determine who goes first.", async () => {
    game.override.ability(Abilities.STALL);
    await game.startBattle([Species.SHUCKLE]);

    const playerIndex = game.scene.getPlayerPokemon()!.getBattlerIndex();
    const enemyIndex = game.scene.getEnemyPokemon()!.getBattlerIndex();

    game.move.select(Moves.TACKLE);

    await game.phaseInterceptor.to(TurnStartPhase, false);
    const phase = game.scene.getCurrentPhase() as TurnStartPhase;
    const speedOrder = phase.getSpeedOrder();
    const commandOrder = phase.getCommandOrder();

    // The opponent Pokemon (with Stall) goes first because it has a higher speed.
    // The player Pokemon (with Stall) goes second because its speed is lower.
    expect(speedOrder).toEqual([enemyIndex, playerIndex]);
    expect(commandOrder).toEqual([enemyIndex, playerIndex]);
  }, 20000);
});
