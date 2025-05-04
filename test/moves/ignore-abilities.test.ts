import { BattlerIndex } from "#app/battle";
import { RandomMoveAttr } from "#app/data/moves/move";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Ability Ignores", () => {
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
      .moveset([Moves.MOONGEIST_BEAM, Moves.METRONOME])
      .ability(Abilities.STURDY)
      .startingLevel(200)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.STURDY)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should ignore enemy abilities", async () => {
    await game.classicMode.startBattle([Species.MILOTIC]);

    const enemy = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.MOONGEIST_BEAM);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy.isFainted()).toBe(true);
  });

  it("should not ignore enemy abilities when called by metronome", async () => {
    await game.classicMode.startBattle([Species.MILOTIC]);
    vi.spyOn(RandomMoveAttr.prototype, "getMove").mockReturnValue(Moves.PHOTON_GEYSER);

    const enemy = game.scene.getEnemyPokemon()!;
    game.move.select(Moves.METRONOME);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy.isFainted()).toBe(false);
    expect(game.scene.getPlayerPokemon()?.getLastXMoves()[0].move).toBe(Moves.PHOTON_GEYSER);
  });

  it("should not ignore enemy abilities when called by Mirror Move", async () => {
    game.override.moveset(Moves.MIRROR_MOVE).enemyMoveset(Moves.SUNSTEEL_STRIKE);

    await game.classicMode.startBattle([Species.MILOTIC]);

    const enemy = game.scene.getEnemyPokemon()!;
    game.move.select(Moves.MIRROR_MOVE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy.isFainted()).toBe(false);
    expect(game.scene.getPlayerPokemon()?.getLastXMoves()[0].move).toBe(Moves.SUNSTEEL_STRIKE);
  });
});
