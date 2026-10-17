import { BattlerIndex } from "#enums/battler-index";
import { Challenges } from "#enums/challenges";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Challenges - Illegal Evolutions", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);

    // Mono-Water; any Pokemon we mock as illegal stands in for one that evolved into a non-Water species
    game.challengeMode.addChallenge(Challenges.SINGLE_TYPE, PokemonType.WATER + 1, 0);
    game.override.enemySpecies(SpeciesId.MAGIKARP).enemyMoveset(MoveId.SPLASH);
  });

  it("should recall an on-field Pokemon that become illegal and send in a legal replacement", async () => {
    game.override.battleStyle("single");
    await game.challengeMode.startBattle(SpeciesId.SQUIRTLE, SpeciesId.WARTORTLE);

    const [squirtle, wartortle] = game.scene.getPlayerParty();
    vi.spyOn(squirtle, "isAllowedInChallenge").mockReturnValue(false);

    game.move.use(MoveId.SPLASH);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    expect(squirtle.isOnField()).toBe(false);
    expect(wartortle.isOnField()).toBe(true);
    expect(game.field.getPlayerPokemon()).toBe(wartortle);
  });

  it("should recall an illegal Pokemon in doubles while leaving its legal ally out", async () => {
    game.override.battleStyle("double");
    await game.challengeMode.startBattle(SpeciesId.SQUIRTLE, SpeciesId.WARTORTLE);

    const [squirtle, wartortle] = game.scene.getPlayerParty();
    vi.spyOn(squirtle, "isAllowedInChallenge").mockReturnValue(false);

    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.toNextTurn();

    expect(squirtle.isOnField()).toBe(false);
    expect(wartortle.isOnField()).toBe(true);
    expect(game.phaseInterceptor.phaseLog).not.toContain("GameOverPhase");
  });

  it("should not game over at the start of the next wave if a legal ally is already on the field", async () => {
    game.override.battleStyle("double");
    await game.challengeMode.startBattle(SpeciesId.SQUIRTLE, SpeciesId.WARTORTLE);

    const [squirtle, wartortle] = game.scene.getPlayerParty();

    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.doKillOpponents();
    await game.phaseInterceptor.to("BattleEndPhase");
    vi.spyOn(squirtle, "isAllowedInChallenge").mockReturnValue(false);
    await game.toNextWave();

    expect(game.phaseInterceptor.phaseLog).not.toContain("GameOverPhase");
    expect(squirtle.isOnField()).toBe(false);
    expect(wartortle.isOnField()).toBe(true);
  });
});
