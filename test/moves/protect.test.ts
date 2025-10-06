import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { MoveUseMode } from "#enums/move-use-mode";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Protect", () => {
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
      .battleStyle("single")
      .moveset([MoveId.PROTECT, MoveId.SPIKY_SHIELD, MoveId.ENDURE, MoveId.SPLASH])
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyAbility(AbilityId.INSOMNIA)
      .enemyMoveset(MoveId.LUMINA_CRASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should protect the user from attacks and their secondary effects", async () => {
    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const charizard = game.field.getPlayerPokemon();

    game.move.select(MoveId.PROTECT);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(charizard.hp).toBe(charizard.getMaxHp());
    expect(charizard.getStatStage(Stat.SPDEF)).toBe(0);
    expect(charizard);
  });

  it.each<{ numTurns: number; chance: number }>([
    { numTurns: 1, chance: 3 },
    { numTurns: 2, chance: 9 },
    { numTurns: 3, chance: 27 },
    { numTurns: 4, chance: 81 },
  ])("should have a 1/$chance success rate after $numTurns successful uses", async ({ numTurns, chance }) => {
    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const charizard = game.scene.getPlayerPokemon()!;

    // mock RNG roll to suceed unless exactly the desired chance is hit
    vi.spyOn(charizard, "randBattleSeedInt").mockImplementation(range => (range !== chance ? 0 : 1));
    const conditionSpy = vi.spyOn(allMoves[MoveId.PROTECT]["conditions"][0], "apply");

    // click protect many times
    for (let x = 0; x < numTurns; x++) {
      game.move.select(MoveId.PROTECT);
      await game.toNextTurn();

      expect(charizard.hp).toBe(charizard.getMaxHp());
      expect(charizard.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
      expect(conditionSpy).toHaveLastReturnedWith(true);
    }

    game.move.select(MoveId.PROTECT);
    await game.toNextTurn();

    expect(charizard.hp).toBeLessThan(charizard.getMaxHp());
    expect(charizard.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
    expect(conditionSpy).toHaveLastReturnedWith(false);
  });

  it("should share fail chance with all move variants", async () => {
    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const charizard = game.field.getPlayerPokemon();
    charizard.summonData.moveHistory = [
      { move: MoveId.ENDURE, result: MoveResult.SUCCESS, targets: [BattlerIndex.PLAYER], useMode: MoveUseMode.NORMAL },
      {
        move: MoveId.SPIKY_SHIELD,
        result: MoveResult.SUCCESS,
        targets: [BattlerIndex.PLAYER],
        useMode: MoveUseMode.NORMAL,
      },
    ];
    // force protect to fail on anything >=2 uses (1/9 chance)
    vi.spyOn(charizard, "randBattleSeedInt").mockImplementation(range => (range >= 9 ? 1 : 0));

    game.move.select(MoveId.PROTECT);
    await game.toNextTurn();

    expect(charizard.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should reset fail chance on move failure", async () => {
    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const charizard = game.scene.getPlayerPokemon()!;
    // force protect to always fail if RNG roll attempt is made
    vi.spyOn(charizard, "randBattleSeedInt").mockReturnValue(1);

    game.move.select(MoveId.PROTECT);
    await game.toNextTurn();
    expect(charizard.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);

    game.move.select(MoveId.SPIKY_SHIELD);
    await game.toNextTurn();
    expect(charizard.getLastXMoves()[0].result).toBe(MoveResult.FAIL);

    game.move.select(MoveId.SPIKY_SHIELD);
    await game.toNextTurn();
    expect(charizard.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
  });

  it("should reset fail chance on using another move", async () => {
    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const charizard = game.scene.getPlayerPokemon()!;
    // force protect to always fail if RNG roll attempt is made
    vi.spyOn(charizard, "randBattleSeedInt").mockReturnValue(1);

    game.move.select(MoveId.PROTECT);
    await game.toNextTurn();
    expect(charizard.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    game.move.select(MoveId.PROTECT);
    await game.toNextTurn();
    expect(charizard.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
  });

  it("should reset fail chance on starting a new wave", async () => {
    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const charizard = game.field.getPlayerPokemon();
    // force protect to always fail if RNG roll attempt is made
    vi.spyOn(charizard, "randBattleSeedInt").mockReturnValue(1);

    game.move.select(MoveId.PROTECT);
    // Wait until move end phase to kill opponent to ensure protect doesn't fail due to going last
    await game.phaseInterceptor.to("MoveEndPhase");
    await game.doKillOpponents();
    await game.toNextWave();
    expect(charizard.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);

    game.move.select(MoveId.SPIKY_SHIELD);
    expect(charizard.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
  });

  it("should not be blocked by Psychic Terrain", async () => {
    game.override.ability(AbilityId.PSYCHIC_SURGE);
    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const charizard = game.scene.getPlayerPokemon()!;
    game.move.select(MoveId.PROTECT);
    await game.toNextTurn();

    expect(charizard.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
  });

  it("should stop subsequent hits of multi-hit moves", async () => {
    game.override.enemyMoveset([MoveId.TACHYON_CUTTER]);
    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const charizard = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.PROTECT);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(charizard.hp).toBe(charizard.getMaxHp());
    expect(enemyPokemon.turnData.hitCount).toBe(1);
  });

  it("should fail if the user moves last in the turn", async () => {
    game.override.enemyMoveset(MoveId.PROTECT);
    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const charizard = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.PROTECT);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(enemyPokemon.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
    expect(charizard.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should not block Protection-bypassing moves or Future Sight", async () => {
    game.override.enemyMoveset([MoveId.FUTURE_SIGHT, MoveId.MIGHTY_CLEAVE, MoveId.SPORE]);
    await game.classicMode.startBattle([SpeciesId.AGGRON]);

    const aggron = game.scene.getPlayerPokemon()!;
    vi.spyOn(aggron, "randBattleSeedInt").mockReturnValue(0);

    // Turn 1: setup future sight
    game.move.select(MoveId.PROTECT);
    await game.move.forceEnemyMove(MoveId.FUTURE_SIGHT);
    await game.toNextTurn();

    // Turn 2: mighty cleave
    game.move.select(MoveId.PROTECT);
    await game.move.forceEnemyMove(MoveId.MIGHTY_CLEAVE);
    await game.toNextTurn();

    expect(aggron.hp).toBeLessThan(aggron.getMaxHp());

    aggron.hp = aggron.getMaxHp();

    // turn 3: Future Sight hits
    game.move.select(MoveId.PROTECT);
    await game.move.forceEnemyMove(MoveId.SPORE);
    await game.toNextTurn();

    expect(aggron.hp).toBeLessThan(aggron.getMaxHp());
    expect(aggron.status?.effect).toBeUndefined(); // check that protect actually worked
  });

  // TODO: Add test
  it.todo("should not reset counter when throwing balls");
});
