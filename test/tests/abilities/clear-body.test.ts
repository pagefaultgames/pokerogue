import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Clear Body", () => {
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
      .moveset([MoveId.TICKLE])
      .ability(AbilityId.BALL_FETCH)
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyAbility(AbilityId.CLEAR_BODY)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("only activates once when blocking a multi-stat drop", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const enemy = game.field.getEnemyPokemon();
    const queueAbilityDisplaySpy = vi.spyOn(game.scene.phaseManager, "queueAbilityDisplay");

    game.move.select(MoveId.TICKLE);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    expect(enemy.getStatStage(Stat.ATK)).toBe(0);
    expect(enemy.getStatStage(Stat.DEF)).toBe(0);

    const clearBodyDisplays = queueAbilityDisplaySpy.mock.calls.filter(([pokemon]) => pokemon === enemy);

    expect(clearBodyDisplays).toHaveLength(2);
  });
});
