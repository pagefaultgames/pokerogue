import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Hyper Cutter", () => {
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
      .moveset([MoveId.SAND_ATTACK, MoveId.NOBLE_ROAR, MoveId.DEFOG, MoveId.OCTOLOCK])
      .ability(AbilityId.BALL_FETCH)
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyAbility(AbilityId.HYPER_CUTTER)
      .enemyMoveset(MoveId.SPLASH);
  });

  // Reference Link: https://bulbapedia.bulbagarden.net/wiki/Hyper_Cutter_(Ability)

  it("only prevents ATK drops", async () => {
    await game.classicMode.startBattle();

    const enemy = game.field.getEnemyPokemon();

    game.move.select(MoveId.OCTOLOCK);
    await game.toNextTurn();
    game.move.select(MoveId.DEFOG);
    await game.toNextTurn();
    game.move.select(MoveId.NOBLE_ROAR);
    await game.toNextTurn();
    game.move.select(MoveId.SAND_ATTACK);
    await game.toNextTurn();
    game.override.moveset([MoveId.STRING_SHOT]);
    game.move.select(MoveId.STRING_SHOT);
    await game.toNextTurn();

    expect(enemy.getStatStage(Stat.ATK)).toEqual(0);
    [Stat.ACC, Stat.DEF, Stat.EVA, Stat.SPATK, Stat.SPDEF, Stat.SPD].forEach((stat: number) =>
      expect(enemy.getStatStage(stat)).toBeLessThan(0),
    );
  });
});
