import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { MoveEndPhase } from "#phases/move-end-phase";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Mycelium Might", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .ability(AbilityId.MYCELIUM_MIGHT);
  });

  /**
   * References:
   * https://bulbapedia.bulbagarden.net/wiki/Mycelium_Might_(Ability)
   * https://bulbapedia.bulbagarden.net/wiki/Priority
   * https://www.smogon.com/forums/threads/scarlet-violet-battle-mechanics-research.3709545/page-24
   */

  it("should cause the user's status moves to act last in their priority bracket", async () => {
    await game.classicMode.startBattle(SpeciesId.REGIELEKI);

    const enemy = game.field.getEnemyPokemon();
    const player = game.field.getPlayerPokemon();

    expect(game.field.getSpeedOrder()).toEqual([player, enemy]);

    game.move.use(MoveId.TICKLE);
    await game.phaseInterceptor.to("MoveEndPhase", false);

    const phase = game.scene.phaseManager.getCurrentPhase() as MoveEndPhase;
    expect(phase).toBeInstanceOf(MoveEndPhase);
    expect(phase.getPokemon()).toBe(enemy);
  });

  it("should allow the user's status moves to ignore the opponent's abilities", async () => {
    game.override.enemyAbility(AbilityId.CONTRARY);
    await game.classicMode.startBattle(SpeciesId.REGIELEKI);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    game.move.use(MoveId.TICKLE);
    await game.toEndOfTurn();

    expect(player).toHaveAbilityApplied(AbilityId.MYCELIUM_MIGHT);
    expect(enemy).not.toHaveAbilityApplied(AbilityId.CONTRARY);
    expect(enemy).toHaveStatStage(Stat.ATK, -1);
    expect(enemy).toHaveStatStage(Stat.DEF, -1);
  });

  it("should still go first if a higher-priority move is used", async () => {
    await game.classicMode.startBattle(SpeciesId.REGIELEKI);

    const player = game.field.getPlayerPokemon();

    game.move.use(MoveId.BABY_DOLL_EYES);
    await game.phaseInterceptor.to("MoveEndPhase", false);

    const phase = game.scene.phaseManager.getCurrentPhase() as MoveEndPhase;
    expect(phase).toBeInstanceOf(MoveEndPhase);
    expect(phase.getPokemon()).toBe(player);
    expect(player).toHaveFullHp();
  });

  it("should not affect non-status moves", async () => {
    await game.classicMode.startBattle(SpeciesId.REGIELEKI);

    const player = game.field.getPlayerPokemon();

    game.move.use(MoveId.TACKLE);
    await game.phaseInterceptor.to("MoveEndPhase", false);

    const phase = game.scene.phaseManager.getCurrentPhase() as MoveEndPhase;
    expect(phase).toBeInstanceOf(MoveEndPhase);
    expect(phase.getPokemon()).toBe(player);
    expect(player).toHaveFullHp();
  });
});
