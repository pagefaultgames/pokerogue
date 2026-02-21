import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Hyper Cutter", () => {
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
      .ability(AbilityId.BALL_FETCH)
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyAbility(AbilityId.HYPER_CUTTER)
      .enemyMoveset(MoveId.SPLASH);
  });

  // Reference Link: https://bulbapedia.bulbagarden.net/wiki/Hyper_Cutter_(Ability)

  it("only prevents ATK drops", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const enemy = game.field.getEnemyPokemon();

    game.move.use(MoveId.OCTOLOCK);
    await game.toNextTurn();
    game.move.use(MoveId.DEFOG);
    await game.toNextTurn();
    game.move.use(MoveId.NOBLE_ROAR);
    await game.toNextTurn();
    game.move.use(MoveId.SAND_ATTACK);
    await game.toNextTurn();
    game.move.use(MoveId.STRING_SHOT);
    await game.toNextTurn();

    expect(enemy.getStatStage(Stat.ATK)).toEqual(0);
    // biome-ignore lint/suspicious/useIterableCallbackReturn: false positive
    [Stat.ACC, Stat.DEF, Stat.EVA, Stat.SPATK, Stat.SPDEF, Stat.SPD].forEach((stat: number) =>
      expect(enemy.getStatStage(stat)).toBeLessThan(0),
    );
  });
});
