import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Chloroblast and Steel Beam", () => {
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
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH);
  });

  it.each([
    { move: MoveId.CHLOROBLAST, name: "Chloroblast" },
    { move: MoveId.STEEL_BEAM, name: "Steel Beam" },
  ])("should deal recoil damage equal to half the user's maximum HP", async ({ move }) => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.move.use(move);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toEndOfTurn();

    const player = game.field.getPlayerPokemon();
    expect(player).toHaveUsedMove({ move, result: MoveResult.SUCCESS });
    expect(player).toHaveTakenDamage(player.getMaxHp() / 2);
  });

  it("should not deal recoil damage if the opponent uses protect", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    game.move.use(MoveId.CHLOROBLAST);
    await game.move.forceEnemyMove(MoveId.PROTECT);
    await game.toEndOfTurn();

    const player = game.field.getPlayerPokemon();
    expect(player).toHaveUsedMove({ move: MoveId.CHLOROBLAST, result: MoveResult.MISS });
    expect(player).toHaveFullHp();
  });
});
