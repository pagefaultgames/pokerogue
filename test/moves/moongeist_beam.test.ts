import { BattlerIndex } from "#app/battle";
import Move, { RandomMoveAttr } from "#app/data/moves/move";
import type Pokemon from "#app/field/pokemon";
import { Abilities } from "#enums/abilities";
import { MoveFlags } from "#enums/MoveFlags";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";

describe("Moves - Moongeist Beam", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let flagSpy: MockInstance<
    ({
      flag,
      user,
      target,
      isFollowUp,
    }: { flag: MoveFlags; user: Pokemon; target?: Pokemon; isFollowUp?: boolean }) => boolean
  >;

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
      .moveset([Moves.MOONGEIST_BEAM, Moves.METRONOME])
      .ability(Abilities.BALL_FETCH)
      .startingLevel(200)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.STURDY)
      .enemyMoveset(Moves.SPLASH);

    flagSpy = vi.spyOn(Move.prototype, "doesFlagEffectApply");
  });

  /*** Check whether the enemy pokemon's ability was successfully ignored or not. */
  function expectEnemyAbilityIgnored(ignored: boolean) {
    expect(game.scene.getEnemyPokemon()!.isFainted()).toBe(ignored);

    const lastPlayerIgnoreCheckIndex = flagSpy.mock.calls
      .reverse()
      .findIndex(
        ([value]) => value.flag === MoveFlags.IGNORE_ABILITIES && value.user.id === game.scene.getPlayerPokemon()?.id,
      );

    expect(flagSpy).toHaveNthReturnedWith(lastPlayerIgnoreCheckIndex, ignored);
  }

  it("should ignore enemy abilities", async () => {
    await game.classicMode.startBattle([Species.MILOTIC]);

    game.move.select(Moves.MOONGEIST_BEAM);
    await game.phaseInterceptor.to("BerryPhase");

    expectEnemyAbilityIgnored(true);
  });

  it("should not ignore enemy abilities when called by metronome", async () => {
    await game.classicMode.startBattle([Species.MILOTIC]);
    vi.spyOn(RandomMoveAttr.prototype, "getMove").mockReturnValue(Moves.PHOTON_GEYSER);

    game.move.select(Moves.METRONOME);
    await game.phaseInterceptor.to("BerryPhase");

    expectEnemyAbilityIgnored(false);
    expect(game.scene.getPlayerPokemon()?.getLastXMoves()[0].move).toBe(Moves.PHOTON_GEYSER);
  });

  it("should not ignore enemy abilities when called by Mirror Move", async () => {
    game.override.moveset(Moves.MIRROR_MOVE).enemyMoveset(Moves.SUNSTEEL_STRIKE);

    await game.classicMode.startBattle([Species.MILOTIC]);

    game.move.select(Moves.MIRROR_MOVE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase");

    expectEnemyAbilityIgnored(false);
    expect(game.scene.getPlayerPokemon()?.getLastXMoves()[0].move).toBe(Moves.SUNSTEEL_STRIKE);
  });
});
