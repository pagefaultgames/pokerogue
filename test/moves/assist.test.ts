import { BattlerIndex } from "#enums/battler-index";
import { Stat } from "#app/enums/stat";
import { MoveResult } from "#enums/move-result";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Assist", () => {
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

    expect(feebas.getLastXMoves()[0].move).toBe(MoveId.TORCH_SONG);
    expect(shuckle.getLastXMoves()[0].move).toBe(MoveId.WOOD_HAMMER);
    expect(feebas.getStatStage(Stat.SPATK)).toBe(1); // Stat raised from Assist --> Torch Song
    expect(shuckle.hp).toBeLessThan(shuckle.getMaxHp()); // recoil dmg taken from Assist --> Wood Hammer

    expect(feebas.getLastXMoves(-1).map(tm => tm.result)).toEqual([MoveResult.SUCCESS, MoveResult.SUCCESS]);
    expect(shuckle.getLastXMoves(-1).map(tm => tm.result)).toEqual([MoveResult.SUCCESS, MoveResult.SUCCESS]);
  });

  it("should consider off-field allies", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.SHUCKLE]);

    const [feebas, shuckle] = game.scene.getPlayerParty();
    game.move.changeMoveset(shuckle, MoveId.HYPER_BEAM);

    game.move.use(MoveId.ASSIST);
    await game.toEndOfTurn();

    expect(feebas.getLastXMoves(-1)).toHaveLength(2);
    expect(feebas.getLastXMoves()[0]).toMatchObject({
      move: MoveId.HYPER_BEAM,
      target: [BattlerIndex.ENEMY],
      virtual: true,
      result: MoveResult.SUCCESS,
    });
  });

  it("should fail if there are no allies, even if user has eligible moves", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();
    game.move.changeMoveset(feebas, [MoveId.ASSIST, MoveId.TACKLE]);

    game.move.select(MoveId.ASSIST);
    await game.toEndOfTurn();

    expect(feebas.getLastXMoves(-1)).toHaveLength(1);
    expect(feebas.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should fail if allies have no eligible moves", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.SHUCKLE]);

    const [feebas, shuckle] = game.scene.getPlayerParty();
    // All of these are ineligible moves
    game.move.changeMoveset(shuckle, [MoveId.METRONOME, MoveId.DIG, MoveId.FLY]);

    game.move.use(MoveId.ASSIST);
    await game.toEndOfTurn();

    expect(feebas.getLastXMoves(-1)).toHaveLength(1);
    expect(feebas.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });
});
