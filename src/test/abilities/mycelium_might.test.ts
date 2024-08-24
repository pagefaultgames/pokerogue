import { MovePhase } from "#app/phases/move-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import GameManager from "#test/utils/gameManager";
import { Abilities } from "#enums/abilities";
import { Stat } from "#enums/stat";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";


describe("Abilities - Mycelium Might", () => {
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
    game.override.enemySpecies(Species.SHUCKLE);
    game.override.enemyAbility(Abilities.CLEAR_BODY);
    game.override.enemyMoveset([Moves.QUICK_ATTACK, Moves.QUICK_ATTACK, Moves.QUICK_ATTACK, Moves.QUICK_ATTACK]);
    game.override.ability(Abilities.MYCELIUM_MIGHT);
    game.override.moveset([Moves.QUICK_ATTACK, Moves.BABY_DOLL_EYES]);
  });

  /**
   * Bulbapedia References:
   * https://bulbapedia.bulbagarden.net/wiki/Mycelium_Might_(Ability)
   * https://bulbapedia.bulbagarden.net/wiki/Priority
   * https://www.smogon.com/forums/threads/scarlet-violet-battle-mechanics-research.3709545/page-24
   **/

  it("will move last in its priority bracket and ignore protective abilities", async () => {
    await game.startBattle([Species.REGIELEKI]);

    const leadIndex = game.scene.getPlayerPokemon()!.getBattlerIndex();
    const enemyPokemon = game.scene.getEnemyPokemon();
    const enemyIndex = enemyPokemon?.getBattlerIndex();

    game.move.select(Moves.BABY_DOLL_EYES);

    await game.phaseInterceptor.to(MovePhase, false);
    // The opponent Pokemon (without Mycelium Might) goes first despite having lower speed than the player Pokemon.
    expect((game.scene.getCurrentPhase() as MovePhase).pokemon.getBattlerIndex()).toBe(enemyIndex);

    await game.phaseInterceptor.run(MovePhase);
    await game.phaseInterceptor.to(MovePhase, false);

    // The player Pokemon (with Mycelium Might) goes last despite having higher speed than the opponent.
    expect((game.scene.getCurrentPhase() as MovePhase).pokemon.getBattlerIndex()).toBe(leadIndex);
    await game.phaseInterceptor.to(TurnEndPhase);
    expect(enemyPokemon?.getStatStage(Stat.ATK)).toBe(-1);
  }, 20000);

  it("will still go first if a status move that is in a higher priority bracket than the opponent's move is used", async () => {
    game.override.enemyMoveset([Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE]);
    await game.startBattle([Species.REGIELEKI]);

    const leadIndex = game.scene.getPlayerPokemon()!.getBattlerIndex();
    const enemyPokemon = game.scene.getEnemyPokemon();
    const enemyIndex = enemyPokemon?.getBattlerIndex();

    game.move.select(Moves.BABY_DOLL_EYES);

    await game.phaseInterceptor.to(MovePhase, false);
    // The player Pokemon (with M.M.) goes first because its move is still within a higher priority bracket than its opponent.
    expect((game.scene.getCurrentPhase() as MovePhase).pokemon.getBattlerIndex()).toBe(leadIndex);

    await game.phaseInterceptor.run(MovePhase);
    await game.phaseInterceptor.to(MovePhase, false);
    // The enemy Pokemon goes second because its move is in a lower priority bracket.
    expect((game.scene.getCurrentPhase() as MovePhase).pokemon.getBattlerIndex()).toBe(enemyIndex);
    await game.phaseInterceptor.to(TurnEndPhase);
    expect(enemyPokemon?.getStatStage(Stat.ATK)).toBe(-1);
  }, 20000);

  it("will not affect non-status moves", async () => {
    await game.startBattle([Species.REGIELEKI]);

    const leadIndex = game.scene.getPlayerPokemon()!.getBattlerIndex();
    const enemyIndex = game.scene.getEnemyPokemon()!.getBattlerIndex();

    game.move.select(Moves.QUICK_ATTACK);

    await game.phaseInterceptor.to(MovePhase, false);
    // The player Pokemon (with M.M.) goes first because it has a higher speed and did not use a status move.
    expect((game.scene.getCurrentPhase() as MovePhase).pokemon.getBattlerIndex()).toBe(leadIndex);

    await game.phaseInterceptor.run(MovePhase);
    await game.phaseInterceptor.to(MovePhase, false);
    // The enemy Pokemon (without M.M.) goes second because its speed is lower.
    expect((game.scene.getCurrentPhase() as MovePhase).pokemon.getBattlerIndex()).toBe(enemyIndex);
  }, 20000);
});
