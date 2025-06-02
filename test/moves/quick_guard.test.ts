import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import GameManager from "#test/testUtils/gameManager";
import { Species } from "#enums/species";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { BattlerIndex } from "#app/battle";
import { MoveResult } from "#app/field/pokemon";

describe("Moves - Quick Guard", () => {
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
      .battleStyle("double")
      .moveset([Moves.QUICK_GUARD, Moves.SPLASH, Moves.SPIKY_SHIELD])
      .enemySpecies(Species.SNORLAX)
      .enemyMoveset(Moves.QUICK_ATTACK)
      .enemyAbility(Abilities.BALL_FETCH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should protect the user and allies from priority moves", async () => {
    await game.classicMode.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

    const [charizard, blastoise] = game.scene.getPlayerField();

    game.move.select(Moves.QUICK_GUARD, BattlerIndex.PLAYER);
    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER_2);
    await game.move.forceEnemyMove(Moves.QUICK_ATTACK, BattlerIndex.PLAYER);
    await game.move.forceEnemyMove(Moves.QUICK_ATTACK, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(charizard.hp).toBe(charizard.getMaxHp());
    expect(blastoise.hp).toBe(blastoise.getMaxHp());
  });

  it.each<{ name: string; move: Moves; ability: Abilities }>([
    { name: "Prankster", move: Moves.SPORE, ability: Abilities.PRANKSTER },
    { name: "Gale Wings", move: Moves.BRAVE_BIRD, ability: Abilities.GALE_WINGS },
  ])("should protect the user and allies from $name-boosted moves", async ({ move, ability }) => {
    game.override.enemyMoveset(move).enemyAbility(ability);
    await game.classicMode.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

    const [charizard, blastoise] = game.scene.getPlayerField();

    game.move.select(Moves.QUICK_GUARD, BattlerIndex.PLAYER);
    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER_2);
    await game.move.forceEnemyMove(move, BattlerIndex.PLAYER);
    await game.move.forceEnemyMove(move, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(charizard.hp).toBe(charizard.getMaxHp());
    expect(blastoise.hp).toBe(blastoise.getMaxHp());
    expect(charizard.status?.effect).toBeUndefined();
    expect(blastoise.status?.effect).toBeUndefined();
  });

  it("should increment (but not respect) other protection moves' fail counters", async () => {
    game.override.battleStyle("single");
    await game.classicMode.startBattle([Species.CHARIZARD]);

    const charizard = game.scene.getPlayerPokemon()!;
    // force protect to fail on anything >0 uses
    vi.spyOn(charizard, "randBattleSeedInt").mockReturnValue(1);

    game.move.select(Moves.QUICK_GUARD);
    await game.toNextTurn();

    expect(charizard.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);

    game.move.select(Moves.QUICK_GUARD);
    await game.toNextTurn();

    // ignored fail chance
    expect(charizard.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);

    game.move.select(Moves.SPIKY_SHIELD);
    await game.toNextTurn();

    expect(charizard.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });
});
