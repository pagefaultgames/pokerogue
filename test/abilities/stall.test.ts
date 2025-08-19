import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { TurnStartPhase } from "#phases/turn-start-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

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
    game.override
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.REGIELEKI)
      .enemyAbility(AbilityId.STALL)
      .enemyMoveset(MoveId.QUICK_ATTACK)
      .moveset([MoveId.QUICK_ATTACK, MoveId.TACKLE]);
  });

  /**
   * References:
   * https://bulbapedia.bulbagarden.net/wiki/Stall_(Ability)
   * https://bulbapedia.bulbagarden.net/wiki/Priority
   */

  it("Pokemon with Stall should move last in its priority bracket regardless of speed", async () => {
    await game.classicMode.startBattle([SpeciesId.SHUCKLE]);

    const playerIndex = game.field.getPlayerPokemon().getBattlerIndex();
    const enemyIndex = game.field.getEnemyPokemon().getBattlerIndex();

    game.move.select(MoveId.QUICK_ATTACK);

    await game.phaseInterceptor.to(TurnStartPhase, false);
    const phase = game.scene.phaseManager.getCurrentPhase() as TurnStartPhase;
    const speedOrder = phase.getSpeedOrder();
    const commandOrder = phase.getCommandOrder();
    // The player Pokemon (without Stall) goes first despite having lower speed than the opponent.
    // The opponent Pokemon (with Stall) goes last despite having higher speed than the player Pokemon.
    expect(speedOrder).toEqual([enemyIndex, playerIndex]);
    expect(commandOrder).toEqual([playerIndex, enemyIndex]);
  });

  it("Pokemon with Stall will go first if a move that is in a higher priority bracket than the opponent's move is used", async () => {
    await game.classicMode.startBattle([SpeciesId.SHUCKLE]);

    const playerIndex = game.field.getPlayerPokemon().getBattlerIndex();
    const enemyIndex = game.field.getEnemyPokemon().getBattlerIndex();

    game.move.select(MoveId.TACKLE);

    await game.phaseInterceptor.to(TurnStartPhase, false);
    const phase = game.scene.phaseManager.getCurrentPhase() as TurnStartPhase;
    const speedOrder = phase.getSpeedOrder();
    const commandOrder = phase.getCommandOrder();
    // The opponent Pokemon (with Stall) goes first because its move is still within a higher priority bracket than its opponent.
    // The player Pokemon goes second because its move is in a lower priority bracket.
    expect(speedOrder).toEqual([enemyIndex, playerIndex]);
    expect(commandOrder).toEqual([enemyIndex, playerIndex]);
  });

  it("If both Pokemon have stall and use the same move, speed is used to determine who goes first.", async () => {
    game.override.ability(AbilityId.STALL);
    await game.classicMode.startBattle([SpeciesId.SHUCKLE]);

    const playerIndex = game.field.getPlayerPokemon().getBattlerIndex();
    const enemyIndex = game.field.getEnemyPokemon().getBattlerIndex();

    game.move.select(MoveId.TACKLE);

    await game.phaseInterceptor.to(TurnStartPhase, false);
    const phase = game.scene.phaseManager.getCurrentPhase() as TurnStartPhase;
    const speedOrder = phase.getSpeedOrder();
    const commandOrder = phase.getCommandOrder();

    // The opponent Pokemon (with Stall) goes first because it has a higher speed.
    // The player Pokemon (with Stall) goes second because its speed is lower.
    expect(speedOrder).toEqual([enemyIndex, playerIndex]);
    expect(commandOrder).toEqual([enemyIndex, playerIndex]);
  });
});
