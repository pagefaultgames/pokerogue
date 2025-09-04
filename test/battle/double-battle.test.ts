import { getGameMode } from "#app/game-mode";
import { Status } from "#data/status-effect";
import { AbilityId } from "#enums/ability-id";
import { BattleType } from "#enums/battle-type";
import { BattlerIndex } from "#enums/battler-index";
import { GameModes } from "#enums/game-modes";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { TrainerType } from "#enums/trainer-type";
import { BattleEndPhase } from "#phases/battle-end-phase";
import { TurnInitPhase } from "#phases/turn-init-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Double Battles", () => {
  const DOUBLE_CHANCE = 8; // Normal chance of double battle is 1/8

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
  });

  // double-battle player's pokemon both fainted in same round, then revive one, and next double battle summons two player's pokemon successfully.
  // (There were bugs that either only summon one when can summon two, player stuck in switchPhase etc)
  it("3v2 edge case: player summons 2 pokemon on the next battle after being fainted and revived", async () => {
    game.override.battleStyle("double").enemyMoveset(MoveId.SPLASH).moveset(MoveId.SPLASH);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.CHARIZARD, SpeciesId.SQUIRTLE]);

    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.SPLASH, 1);

    for (const pokemon of game.scene.getPlayerField()) {
      pokemon.hp = 0;
      pokemon.status = new Status(StatusEffect.FAINT);
      expect(pokemon.isFainted()).toBe(true);
    }

    await game.doKillOpponents();

    await game.phaseInterceptor.to(BattleEndPhase);
    game.doSelectModifier();

    const charizard = game.scene.getPlayerParty().findIndex(p => p.species.speciesId === SpeciesId.CHARIZARD);
    game.doRevivePokemon(charizard);

    await game.phaseInterceptor.to(TurnInitPhase);
    expect(game.scene.getPlayerField().filter(p => !p.isFainted())).toHaveLength(2);
  });

  it("randomly chooses between single and double battles if there is no battle type override", async () => {
    let rngSweepProgress = 0; // Will simulate RNG rolls by slowly increasing from 0 to 1
    let doubleCount = 0;
    let singleCount = 0;

    vi.spyOn(Phaser.Math.RND, "realInRange").mockImplementation((min: number, max: number) => {
      return rngSweepProgress * (max - min) + min;
    });

    game.override
      .enemyMoveset(MoveId.SPLASH)
      .moveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.BALL_FETCH)
      .ability(AbilityId.BALL_FETCH);

    // Play through endless, waves 1 to 9, counting number of double battles from waves 2 to 9
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);
    game.scene.gameMode = getGameMode(GameModes.ENDLESS);

    for (let i = 0; i < DOUBLE_CHANCE; i++) {
      rngSweepProgress = (i + 0.5) / DOUBLE_CHANCE;

      game.move.select(MoveId.SPLASH);
      await game.doKillOpponents();
      await game.toNextWave();

      if (game.scene.getEnemyParty().length === 1) {
        singleCount++;
      } else if (game.scene.getEnemyParty().length === 2) {
        doubleCount++;
      }
    }

    expect(doubleCount).toBe(1);
    expect(singleCount).toBe(DOUBLE_CHANCE - 1);
  });

  it("should transition to and from double battles without crashing", async () => {
    game.override.battleStyle("even-doubles");
    await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.CHARMANDER]);

    // Run 2 single -> double transitions and 2 double -> single transitions
    for (let waveNumber = 1; waveNumber < 5; waveNumber++) {
      const isDouble = waveNumber % 2 === 0;
      expect(game.scene.currentBattle.double).toBe(isDouble);
      expect(game.scene.currentBattle.waveIndex).toBe(waveNumber);

      game.move.select(MoveId.SPLASH);
      if (isDouble) {
        game.move.select(MoveId.SPLASH, 1);
      }
      await game.doKillOpponents();
      await game.toNextWave();

      expect(game.scene.currentBattle.double).toBe(!isDouble);
    }
  });

  it("shouldn't hit itself if ally dies before move", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.MILOTIC);

    const [, milotic] = game.scene.getPlayerField();

    game.move.select(MoveId.MEMENTO, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.SURF, 1);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER_2]);
    await game.toNextTurn();

    expect(milotic.isFullHp()).toBe(true);
  });

  describe("Trainer Double Battles", () => {
    beforeEach(() => {
      game.override
        .randomTrainer({ trainerType: TrainerType.TWINS })
        .battleType(BattleType.TRAINER)
        .startingLevel(1000)
        .startingWave(12);
    });

    it("should advance exactly one wave if both opponents are defeated at the same time", async () => {
      await game.classicMode.startBattle([SpeciesId.FEEBAS]);

      game.move.use(MoveId.DAZZLING_GLEAM);
      await game.toNextWave();

      expect(game.scene.currentBattle.waveIndex).toBe(13);
      expect(game.phaseInterceptor.log.filter(phase => phase === "SelectModifierPhase").length).toBe(1);
      expect(game.scene.phaseManager.hasPhaseOfType("SelectModifierPhase")).toBe(false);
    });

    it("should advance exactly one wave if the left opponent is defeated first", async () => {
      await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

      game.move.use(MoveId.MOONBLAST, 0, BattlerIndex.ENEMY);
      game.move.use(MoveId.MOONBLAST, 1, BattlerIndex.ENEMY_2);
      await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
      await game.toNextWave();

      expect(game.scene.currentBattle.waveIndex).toBe(13);
      expect(game.phaseInterceptor.log.filter(phase => phase === "SelectModifierPhase").length).toBe(1);
      expect(game.scene.phaseManager.hasPhaseOfType("SelectModifierPhase")).toBe(false);
    });

    it("should advance exactly one wave if the right opponent is defeated first", async () => {
      await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

      game.move.use(MoveId.MOONBLAST, 0, BattlerIndex.ENEMY_2);
      game.move.use(MoveId.MOONBLAST, 1, BattlerIndex.ENEMY);
      await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
      await game.toNextWave();

      expect(game.scene.currentBattle.waveIndex).toBe(13);
      expect(game.phaseInterceptor.log.filter(phase => phase === "SelectModifierPhase").length).toBe(1);
      expect(game.scene.phaseManager.hasPhaseOfType("SelectModifierPhase")).toBe(false);
    });
  });
});
