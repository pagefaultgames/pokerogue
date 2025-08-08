import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
      .moveset([MoveId.QUICK_GUARD, MoveId.SPLASH, MoveId.SPIKY_SHIELD])
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyMoveset(MoveId.QUICK_ATTACK)
      .enemyAbility(AbilityId.BALL_FETCH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should protect the user and allies from priority moves", async () => {
    await game.classicMode.startBattle([SpeciesId.CHARIZARD, SpeciesId.BLASTOISE]);

    const [charizard, blastoise] = game.scene.getPlayerField();

    game.move.select(MoveId.QUICK_GUARD, BattlerIndex.PLAYER);
    game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.move.forceEnemyMove(MoveId.QUICK_ATTACK, BattlerIndex.PLAYER);
    await game.move.forceEnemyMove(MoveId.QUICK_ATTACK, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(charizard.hp).toBe(charizard.getMaxHp());
    expect(blastoise.hp).toBe(blastoise.getMaxHp());
  });

  it.each<{ name: string; move: MoveId; ability: AbilityId }>([
    { name: "Prankster", move: MoveId.SPORE, ability: AbilityId.PRANKSTER },
    { name: "Gale Wings", move: MoveId.BRAVE_BIRD, ability: AbilityId.GALE_WINGS },
  ])("should protect the user and allies from $name-boosted moves", async ({ move, ability }) => {
    game.override.enemyMoveset(move).enemyAbility(ability);
    await game.classicMode.startBattle([SpeciesId.CHARIZARD, SpeciesId.BLASTOISE]);

    const [charizard, blastoise] = game.scene.getPlayerField();

    game.move.select(MoveId.QUICK_GUARD, BattlerIndex.PLAYER);
    game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER_2);
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
    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const charizard = game.scene.getPlayerPokemon()!;
    // force protect to fail on anything >0 uses
    vi.spyOn(charizard, "randBattleSeedInt").mockReturnValue(1);

    game.move.select(MoveId.QUICK_GUARD);
    await game.toNextTurn();

    expect(charizard.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);

    game.move.select(MoveId.QUICK_GUARD);
    await game.toNextTurn();

    // ignored fail chance
    expect(charizard.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);

    game.move.select(MoveId.SPIKY_SHIELD);
    await game.toNextTurn();

    expect(charizard.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });
});
