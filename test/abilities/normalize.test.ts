import { TYPE_BOOST_ITEM_BOOST_PERCENT } from "#app/constants";
import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import { toDmgValue } from "#utils/common";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Normalize", () => {
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
      .moveset([MoveId.TACKLE])
      .ability(AbilityId.NORMALIZE)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should boost the power of normal type moves by 20%", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    const powerSpy = vi.spyOn(allMoves[MoveId.TACKLE], "calculateBattlePower");

    game.move.select(MoveId.TACKLE);
    await game.phaseInterceptor.to("BerryPhase");
    expect(powerSpy).toHaveLastReturnedWith(toDmgValue(allMoves[MoveId.TACKLE].power * 1.2));
  });

  it("should boost variable power moves", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    const magikarp = game.field.getPlayerPokemon();
    magikarp.friendship = 255;

    const powerSpy = vi.spyOn(allMoves[MoveId.RETURN], "calculateBattlePower");

    game.move.use(MoveId.RETURN);
    await game.toEndOfTurn();
    expect(powerSpy).toHaveLastReturnedWith(102 * 1.2);
  });

  it("should not apply the old type boost item after changing a move's type", async () => {
    game.override
      .startingHeldItems([{ name: "ATTACK_TYPE_BOOSTER", count: 1, type: PokemonType.GRASS }])
      .moveset([MoveId.LEAFAGE]);

    const powerSpy = vi.spyOn(allMoves[MoveId.LEAFAGE], "calculateBattlePower");
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    game.move.select(MoveId.LEAFAGE);
    await game.phaseInterceptor.to("BerryPhase");

    // It should return with 1.2 (that is, only the power boost from the ability)
    expect(powerSpy).toHaveLastReturnedWith(toDmgValue(allMoves[MoveId.LEAFAGE].power * 1.2));
  });

  it("should apply silk scarf's power boost after changing a move's type", async () => {
    game.override
      .startingHeldItems([{ name: "ATTACK_TYPE_BOOSTER", count: 1, type: PokemonType.NORMAL }])
      .moveset([MoveId.LEAFAGE]);

    const powerSpy = vi.spyOn(allMoves[MoveId.LEAFAGE], "calculateBattlePower");
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    game.move.select(MoveId.LEAFAGE);
    await game.phaseInterceptor.to("BerryPhase");

    // 1.2 from normalize boost, second 1.2 from
    expect(powerSpy).toHaveLastReturnedWith(
      toDmgValue(allMoves[MoveId.LEAFAGE].power * 1.2 * (1 + TYPE_BOOST_ITEM_BOOST_PERCENT / 100)),
    );
  });

  it.each([
    { moveName: "Revelation Dance", move: MoveId.REVELATION_DANCE },
    { moveName: "Judgement", move: MoveId.JUDGMENT, expected_ty: PokemonType.NORMAL },
    { moveName: "Terrain Pulse", move: MoveId.TERRAIN_PULSE },
    { moveName: "Weather Ball", move: MoveId.WEATHER_BALL },
    { moveName: "Multi Attack", move: MoveId.MULTI_ATTACK },
    { moveName: "Techno Blast", move: MoveId.TECHNO_BLAST },
    { moveName: "Hidden Power", move: MoveId.HIDDEN_POWER },
  ])("should not boost the power of $moveName", async ({ move }) => {
    game.override.moveset([move]);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    const powerSpy = vi.spyOn(allMoves[move], "calculateBattlePower");

    game.move.select(move);
    await game.phaseInterceptor.to("BerryPhase");
    expect(powerSpy).toHaveLastReturnedWith(allMoves[move].power);
  });
});
