import { BattlerTagType } from "#enums/battler-tag-type";
import { Challenges } from "#enums/challenges";
import { PokemonType } from "#enums/pokemon-type";
import { MoveResult } from "#app/field/pokemon";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Status } from "#app/data/status-effect";
import { StatusEffect } from "#enums/status-effect";

describe("Moves - Whirlwind", () => {
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
      .battleType("single")
      .moveset(Moves.SPLASH)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset([Moves.SPLASH, Moves.WHIRLWIND])
      .enemySpecies(Species.PIDGEY);
  });

  it.each([
    { move: Moves.FLY, name: "Fly" },
    { move: Moves.BOUNCE, name: "Bounce" },
    { move: Moves.SKY_DROP, name: "Sky Drop" },
  ])("should not hit a flying target: $name (=$move)", async ({ move }) => {
    game.override.moveset([move]);
    await game.classicMode.startBattle([Species.STARAPTOR]);

    const staraptor = game.scene.getPlayerPokemon()!;

    game.move.select(move);
    await game.forceEnemyMove(Moves.WHIRLWIND);

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(staraptor.findTag(t => t.tagType === BattlerTagType.FLYING)).toBeDefined();
    expect(game.scene.getEnemyPokemon()!.getLastXMoves(1)[0].result).toBe(MoveResult.MISS);
  });

  it("should force switches randomly", async () => {
    await game.classicMode.startBattle([Species.BULBASAUR, Species.CHARMANDER, Species.SQUIRTLE]);

    const [bulbasaur, charmander, squirtle] = game.scene.getPlayerParty();

    // Turn 1: Mock an RNG call that calls for switching to 1st backup Pokemon (Charmander)
    vi.spyOn(game.scene, "randBattleSeedInt").mockImplementation((_range, min = 0) => {
      return min;
    });
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.WHIRLWIND);
    await game.toNextTurn();

    expect(bulbasaur.isOnField()).toBe(false);
    expect(charmander.isOnField()).toBe(true);
    expect(squirtle.isOnField()).toBe(false);

    // Turn 2: Mock an RNG call that calls for switching to 2nd backup Pokemon (Squirtle)
    vi.spyOn(game.scene, "randBattleSeedInt").mockImplementation((_range, min = 0) => {
      return min + 1;
    });
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.WHIRLWIND);
    await game.toNextTurn();

    expect(bulbasaur.isOnField()).toBe(false);
    expect(charmander.isOnField()).toBe(false);
    expect(squirtle.isOnField()).toBe(true);
  });

  it("should not force a switch to a challenge-ineligible Pokemon", async () => {
    // Mono-Water challenge, Eevee is ineligible
    game.challengeMode.addChallenge(Challenges.SINGLE_TYPE, PokemonType.WATER + 1, 0);
    await game.challengeMode.startBattle([Species.LAPRAS, Species.EEVEE, Species.TOXAPEX, Species.PRIMARINA]);

    const [lapras, eevee, toxapex, primarina] = game.scene.getPlayerParty();

    // Turn 1: Mock an RNG call that would normally call for switching to Eevee, but it is ineligible
    vi.spyOn(game.scene, "randBattleSeedInt").mockImplementation((_range, min = 0) => {
      return min;
    });
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.WHIRLWIND);
    await game.toNextTurn();

    expect(lapras.isOnField()).toBe(false);
    expect(eevee.isOnField()).toBe(false);
    expect(toxapex.isOnField()).toBe(true);
    expect(primarina.isOnField()).toBe(false);
  });

  it("should not force a switch to a fainted Pokemon", async () => {
    await game.classicMode.startBattle([Species.LAPRAS, Species.EEVEE, Species.TOXAPEX, Species.PRIMARINA]);

    const [lapras, eevee, toxapex, primarina] = game.scene.getPlayerParty();

    // Turn 1: Eevee faints
    eevee.hp = 0;
    eevee.status = new Status(StatusEffect.FAINT);
    expect(eevee.isFainted()).toBe(true);
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.toNextTurn();

    // Turn 2: Mock an RNG call that would normally call for switching to Eevee, but it is fainted
    vi.spyOn(game.scene, "randBattleSeedInt").mockImplementation((_range, min = 0) => {
      return min;
    });
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.WHIRLWIND);
    await game.toNextTurn();

    expect(lapras.isOnField()).toBe(false);
    expect(eevee.isOnField()).toBe(false);
    expect(toxapex.isOnField()).toBe(true);
    expect(primarina.isOnField()).toBe(false);
  });

  it("should not force a switch if there are no available Pokemon to switch into", async () => {
    await game.classicMode.startBattle([Species.LAPRAS, Species.EEVEE]);

    const [lapras, eevee] = game.scene.getPlayerParty();

    // Turn 1: Eevee faints
    eevee.hp = 0;
    eevee.status = new Status(StatusEffect.FAINT);
    expect(eevee.isFainted()).toBe(true);
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.toNextTurn();

    // Turn 2: Mock an RNG call that would normally call for switching to Eevee, but it is fainted
    vi.spyOn(game.scene, "randBattleSeedInt").mockImplementation((_range, min = 0) => {
      return min;
    });
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.WHIRLWIND);
    await game.toNextTurn();

    expect(lapras.isOnField()).toBe(true);
    expect(eevee.isOnField()).toBe(false);
  });
});
