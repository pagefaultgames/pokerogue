import { TYPE_BOOST_ITEM_BOOST_PERCENT } from "#app/constants";
import { allMoves } from "#app/data/moves/move";
import { toDmgValue } from "#app/utils/common";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { PokemonType } from "#enums/pokemon-type";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
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
      .moveset([Moves.TACKLE])
      .ability(Abilities.NORMALIZE)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should boost the power of normal type moves by 20%", async () => {
    await game.classicMode.startBattle([Species.MAGIKARP]);
    const powerSpy = vi.spyOn(allMoves[Moves.TACKLE], "calculateBattlePower");

    game.move.select(Moves.TACKLE);
    await game.phaseInterceptor.to("BerryPhase");
    expect(powerSpy).toHaveLastReturnedWith(toDmgValue(allMoves[Moves.TACKLE].power * 1.2));
  });

  it("should not apply the old type boost item after changing a move's type", async () => {
    game.override.startingHeldItems([{ name: "ATTACK_TYPE_BOOSTER", count: 1, type: PokemonType.GRASS }]);
    game.override.moveset([Moves.LEAFAGE]);

    const powerSpy = vi.spyOn(allMoves[Moves.LEAFAGE], "calculateBattlePower");
    await game.classicMode.startBattle([Species.MAGIKARP]);
    game.move.select(Moves.LEAFAGE);
    await game.phaseInterceptor.to("BerryPhase");

    // It should return with 1.2 (that is, only the power boost from the ability)
    expect(powerSpy).toHaveLastReturnedWith(toDmgValue(allMoves[Moves.LEAFAGE].power * 1.2));
  });

  it("should apply silk scarf's power boost after changing a move's type", async () => {
    game.override.startingHeldItems([{ name: "ATTACK_TYPE_BOOSTER", count: 1, type: PokemonType.NORMAL }]);
    game.override.moveset([Moves.LEAFAGE]);

    const powerSpy = vi.spyOn(allMoves[Moves.LEAFAGE], "calculateBattlePower");
    await game.classicMode.startBattle([Species.MAGIKARP]);
    game.move.select(Moves.LEAFAGE);
    await game.phaseInterceptor.to("BerryPhase");

    // 1.2 from normalize boost, second 1.2 from
    expect(powerSpy).toHaveLastReturnedWith(
      toDmgValue(allMoves[Moves.LEAFAGE].power * 1.2 * (1 + TYPE_BOOST_ITEM_BOOST_PERCENT / 100)),
    );
  });

  it.each([
    { moveName: "Revelation Dance", move: Moves.REVELATION_DANCE },
    { moveName: "Judgement", move: Moves.JUDGMENT, expected_ty: PokemonType.NORMAL },
    { moveName: "Terrain Pulse", move: Moves.TERRAIN_PULSE },
    { moveName: "Weather Ball", move: Moves.WEATHER_BALL },
    { moveName: "Multi Attack", move: Moves.MULTI_ATTACK },
    { moveName: "Techno Blast", move: Moves.TECHNO_BLAST },
    { moveName: "Hidden Power", move: Moves.HIDDEN_POWER },
  ])("should not boost the power of $moveName", async ({ move }) => {
    game.override.moveset([move]);
    await game.classicMode.startBattle([Species.MAGIKARP]);
    const powerSpy = vi.spyOn(allMoves[move], "calculateBattlePower");

    game.move.select(move);
    await game.phaseInterceptor.to("BerryPhase");
    expect(powerSpy).toHaveLastReturnedWith(allMoves[move].power);
  });
});
