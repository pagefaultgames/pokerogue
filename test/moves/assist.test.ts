import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { MoveUseMode } from "#enums/move-use-mode";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Move - Assist", () => {
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

    // Manual moveset overrides are required for the player pokemon in these tests
    // because the normal moveset override doesn't allow for accurate testing of moveset changes
    game.override
      .ability(AbilityId.NO_GUARD)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyLevel(100)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should call a random eligible move from an ally's moveset and apply secondary effects", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.SHUCKLE]);

    const [feebas, shuckle] = game.scene.getPlayerField();
    game.move.changeMoveset(feebas, [MoveId.CIRCLE_THROW, MoveId.ASSIST, MoveId.WOOD_HAMMER, MoveId.ACID_SPRAY]);
    game.move.changeMoveset(shuckle, [MoveId.COPYCAT, MoveId.ASSIST, MoveId.TORCH_SONG, MoveId.TACKLE]);

    // Force rolling the first eligible move for both mons
    vi.spyOn(feebas, "randBattleSeedInt").mockImplementation(() => 0);
    vi.spyOn(shuckle, "randBattleSeedInt").mockImplementation(() => 0);

    game.move.select(MoveId.ASSIST, BattlerIndex.PLAYER);
    game.move.select(MoveId.ASSIST, BattlerIndex.PLAYER_2);
    await game.toEndOfTurn();

    expect(feebas).toHaveUsedMove({ move: MoveId.TORCH_SONG, useMode: MoveUseMode.FOLLOW_UP });
    expect(shuckle).toHaveUsedMove({ move: MoveId.WOOD_HAMMER, useMode: MoveUseMode.FOLLOW_UP });
    expect(feebas).toHaveStatStage(Stat.SPATK, 1); // Stat raised from Assist --> Torch Song
    expect(shuckle).not.toHaveFullHp(); // recoil dmg taken from Assist --> Wood Hammer

    expect(feebas.getLastXMoves(-1).map(tm => tm.result)).toEqual([MoveResult.SUCCESS, MoveResult.SUCCESS]);
    expect(shuckle.getLastXMoves(-1).map(tm => tm.result)).toEqual([MoveResult.SUCCESS, MoveResult.SUCCESS]);
  });

  it("should consider off-field allies", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.SHUCKLE]);

    const [feebas, shuckle] = game.scene.getPlayerParty();
    game.move.changeMoveset(shuckle, MoveId.HYPER_BEAM);

    game.move.use(MoveId.ASSIST);
    await game.toEndOfTurn();

    expect(feebas).toHaveUsedMove({
      move: MoveId.HYPER_BEAM,
      useMode: MoveUseMode.FOLLOW_UP,
      result: MoveResult.SUCCESS,
    });
  });

  it("should fail if there are no allies, even if user has eligible moves", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();
    game.move.changeMoveset(feebas, [MoveId.ASSIST, MoveId.TACKLE]);

    game.move.select(MoveId.ASSIST);
    await game.toEndOfTurn();

    expect(feebas).toHaveUsedMove({ move: MoveId.ASSIST, result: MoveResult.FAIL });
  });

  it("should fail if allies have no eligible moves", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.SHUCKLE]);

    const [feebas, shuckle] = game.scene.getPlayerParty();
    // All of these are ineligible moves
    game.move.changeMoveset(shuckle, [MoveId.METRONOME, MoveId.DIG, MoveId.FLY]);

    game.move.use(MoveId.ASSIST);
    await game.toEndOfTurn();

    expect(feebas).toHaveUsedMove({ move: MoveId.ASSIST, result: MoveResult.FAIL });
  });
});
