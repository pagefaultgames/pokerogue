import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
      .moveset([MoveId.WIDE_GUARD, MoveId.SPLASH, MoveId.SURF, MoveId.SPIKY_SHIELD])
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyMoveset([MoveId.SWIFT, MoveId.GROWL, MoveId.TACKLE])
      .enemyAbility(AbilityId.INSOMNIA)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should protect the user and allies from multi-target attack and status moves", async () => {
    await game.classicMode.startBattle([SpeciesId.CHARIZARD, SpeciesId.BLASTOISE]);
    const [charizard, blastoise] = game.scene.getPlayerField();

    game.move.select(MoveId.WIDE_GUARD, BattlerIndex.PLAYER);
    game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.move.forceEnemyMove(MoveId.SWIFT);
    await game.move.forceEnemyMove(MoveId.GROWL);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(charizard.hp).toBe(charizard.getMaxHp());
    expect(blastoise.hp).toBe(blastoise.getMaxHp());
    expect(charizard.getStatStage(Stat.ATK)).toBe(0);
    expect(blastoise.getStatStage(Stat.ATK)).toBe(0);
  });

  it("should not protect the user and allies from single-target moves", async () => {
    await game.classicMode.startBattle([SpeciesId.CHARIZARD, SpeciesId.BLASTOISE]);

    const [charizard, blastoise] = game.scene.getPlayerField();
    game.move.select(MoveId.WIDE_GUARD, BattlerIndex.PLAYER);
    game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.move.forceEnemyMove(MoveId.TACKLE, BattlerIndex.PLAYER);
    await game.move.forceEnemyMove(MoveId.TACKLE, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(charizard.hp).toBeLessThan(charizard.getMaxHp());
    expect(blastoise.hp).toBeLessThan(blastoise.getMaxHp());
  });

  it("should protect the user from its ally's multi-target move", async () => {
    game.override.enemyMoveset(MoveId.SPLASH);

    await game.classicMode.startBattle([SpeciesId.CHARIZARD, SpeciesId.BLASTOISE]);

    const charizard = game.scene.getPlayerPokemon()!;
    const [snorlax1, snorlax2] = game.scene.getEnemyField();

    game.move.select(MoveId.WIDE_GUARD, BattlerIndex.PLAYER);
    game.move.select(MoveId.SURF, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(charizard.hp).toBe(charizard.getMaxHp());
    expect(snorlax1.hp).toBeLessThan(snorlax1.getMaxHp());
    expect(snorlax2.hp).toBeLessThan(snorlax2.getMaxHp());
  });

  it("should increment (but not respect) other protection moves' fail counters", async () => {
    game.override.battleStyle("single");
    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const charizard = game.scene.getPlayerPokemon()!;
    // force protect to fail on anything other than a guaranteed success
    vi.spyOn(charizard, "randBattleSeedInt").mockReturnValue(1);

    game.move.select(MoveId.WIDE_GUARD);
    await game.toNextTurn();

    expect(charizard.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);

    // ignored fail chance
    game.move.select(MoveId.WIDE_GUARD);
    await game.toNextTurn();

    expect(charizard.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);

    game.move.select(MoveId.SPIKY_SHIELD);
    await game.toNextTurn();

    // ignored fail chance
    expect(charizard.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });
});
