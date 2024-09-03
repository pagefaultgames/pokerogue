import { Stat } from "#enums/stat";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import { SPLASH_ONLY } from "#test/utils/testUtils";
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
      .battleType("single")
      .moveset([Moves.SAND_ATTACK, Moves.NOBLE_ROAR, Moves.DEFOG, Moves.OCTOLOCK])
      .ability(Abilities.BALL_FETCH)
      .enemySpecies(Species.SHUCKLE)
      .enemyAbility(Abilities.HYPER_CUTTER)
      .enemyMoveset(SPLASH_ONLY);
  });

  // Reference Link: https://bulbapedia.bulbagarden.net/wiki/Hyper_Cutter_(Ability)

  it("only prevents ATK drops", async () => {
    await game.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.OCTOLOCK);
    await game.toNextTurn();
    game.move.select(Moves.DEFOG);
    await game.toNextTurn();
    game.move.select(Moves.NOBLE_ROAR);
    await game.toNextTurn();
    game.move.select(Moves.SAND_ATTACK);
    await game.toNextTurn();
    game.override.moveset([Moves.STRING_SHOT]);
    game.move.select(Moves.STRING_SHOT);
    await game.toNextTurn();

    expect(enemy.getStatStage(Stat.ATK)).toEqual(0);
    [Stat.ACC, Stat.DEF, Stat.EVA, Stat.SPATK, Stat.SPDEF, Stat.SPD].forEach((stat: number) => expect(enemy.getStatStage(stat)).toBeLessThan(0));
  });
});
