import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { EFFECTIVE_STATS, Stat } from "#enums/stat";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Ability - Moody", () => {
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
      .enemySpecies(SpeciesId.RATTATA)
      .enemyAbility(AbilityId.BALL_FETCH)
      .ability(AbilityId.MOODY)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should increase one stat stage by 2 and decrease a different stat stage by 1, excluding accuracy/evasion", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();

    game.move.use(MoveId.SPLASH);
    await game.toNextTurn();

    expect(player).toHaveStatStage(Stat.ACC, 0);
    expect(player).toHaveStatStage(Stat.EVA, 0);

    const nonAccEvaStatStages = player.getStatStages().slice(0, EFFECTIVE_STATS.length);
    expect(nonAccEvaStatStages).toEqualUnsorted([2, -1, 0, 0, 0]);
  });

  it("should only increase one stat stage by 2 if all stat stages are at -6", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();

    for (const stat of EFFECTIVE_STATS) {
      player.setStatStage(stat, -6);
    }

    game.move.use(MoveId.SPLASH);
    await game.toNextTurn();

    expect(player.getStatStages().slice(0, EFFECTIVE_STATS.length)).toEqualUnsorted([-4, -6, -6, -6, -6]);
  });

  it("should only decrease one stat stage by 1 stage if all stat stages are at 6", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();

    for (const stat of EFFECTIVE_STATS) {
      player.setStatStage(stat, 6);
    }

    game.move.use(MoveId.SPLASH);
    await game.toNextTurn();

    expect(player.getStatStages().slice(0, EFFECTIVE_STATS.length)).toEqualUnsorted([5, 6, 6, 6, 6]);
  });
});
