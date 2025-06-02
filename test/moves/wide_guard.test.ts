import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import GameManager from "#test/testUtils/gameManager";
import { Species } from "#enums/species";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Stat } from "#enums/stat";
import { BattlerIndex } from "#app/battle";
import { MoveResult } from "#app/field/pokemon";

describe("Moves - Wide Guard", () => {
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
      .moveset([Moves.WIDE_GUARD, Moves.SPLASH, Moves.SURF, Moves.SPIKY_SHIELD])
      .enemySpecies(Species.SNORLAX)
      .enemyMoveset([Moves.SWIFT, Moves.GROWL, Moves.TACKLE])
      .enemyAbility(Abilities.INSOMNIA)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should protect the user and allies from multi-target attack and status moves", async () => {
    await game.classicMode.startBattle([Species.CHARIZARD, Species.BLASTOISE]);
    const [charizard, blastoise] = game.scene.getPlayerField();

    game.move.select(Moves.WIDE_GUARD, BattlerIndex.PLAYER);
    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER_2);
    await game.move.forceEnemyMove(Moves.SWIFT);
    await game.move.forceEnemyMove(Moves.GROWL);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(charizard.hp).toBe(charizard.getMaxHp());
    expect(blastoise.hp).toBe(blastoise.getMaxHp());
    expect(charizard.getStatStage(Stat.ATK)).toBe(0);
    expect(blastoise.getStatStage(Stat.ATK)).toBe(0);
  });

  it("should not protect the user and allies from single-target moves", async () => {
    await game.classicMode.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

    const [charizard, blastoise] = game.scene.getPlayerField();
    game.move.select(Moves.WIDE_GUARD, BattlerIndex.PLAYER);
    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER_2);
    await game.move.forceEnemyMove(Moves.TACKLE, BattlerIndex.PLAYER);
    await game.move.forceEnemyMove(Moves.TACKLE, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(charizard.hp).toBeLessThan(charizard.getMaxHp());
    expect(blastoise.hp).toBeLessThan(blastoise.getMaxHp());
  });

  it("should protect the user from its ally's multi-target move", async () => {
    game.override.enemyMoveset(Moves.SPLASH);

    await game.classicMode.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

    const charizard = game.scene.getPlayerPokemon()!;
    const [snorlax1, snorlax2] = game.scene.getEnemyField();

    game.move.select(Moves.WIDE_GUARD, BattlerIndex.PLAYER);
    game.move.select(Moves.SURF, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(charizard.hp).toBe(charizard.getMaxHp());
    expect(snorlax1.hp).toBeLessThan(snorlax1.getMaxHp());
    expect(snorlax2.hp).toBeLessThan(snorlax2.getMaxHp());
  });

  it("should increment (but not respect) other protection moves' fail counters", async () => {
    game.override.battleStyle("single");
    await game.classicMode.startBattle([Species.CHARIZARD]);

    const charizard = game.scene.getPlayerPokemon()!;
    // force protect to fail on anything other than a guaranteed success
    vi.spyOn(charizard, "randBattleSeedInt").mockReturnValue(1);

    game.move.select(Moves.WIDE_GUARD);
    await game.toNextTurn();

    expect(charizard.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);

    // ignored fail chance
    game.move.select(Moves.WIDE_GUARD);
    await game.toNextTurn();

    expect(charizard.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);

    game.move.select(Moves.SPIKY_SHIELD);
    await game.toNextTurn();

    // ignored fail chance
    expect(charizard.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });
});
