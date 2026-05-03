import { getGameMode } from "#app/game-mode";
import { Phase } from "#app/phase";
import { Status } from "#data/status-effect";
import { AbilityId } from "#enums/ability-id";
import { BattleType } from "#enums/battle-type";
import { BattlerIndex } from "#enums/battler-index";
import { GameModes } from "#enums/game-modes";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { TrainerType } from "#enums/trainer-type";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Double Battles", () => {
  const DOUBLE_CHANCE = 8; // Normal chance of double battle is 1/8

  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .enemyMoveset(MoveId.SPLASH)
      .moveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.BALL_FETCH)
      .ability(AbilityId.BALL_FETCH);
  });

  // double-battle player's pokemon both fainted in same round, then revive one, and next double battle summons two player's pokemon successfully.
  // (There were bugs that either only summon one when can summon two, player stuck in switchPhase etc)
  it("3v2 edge case: player summons 2 pokemon on the next battle after being fainted and revived", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle(SpeciesId.BULBASAUR, SpeciesId.CHARIZARD, SpeciesId.SQUIRTLE);

    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.SPLASH, 1);

    for (const pokemon of game.scene.getPlayerField()) {
      pokemon.hp = 0;
      pokemon.status = new Status(StatusEffect.FAINT);
      expect(pokemon.isFainted()).toBe(true);
    }

    await game.doKillOpponents();

    await game.phaseInterceptor.to("BattleEndPhase");
    game.doSelectModifier();

    const charizard = game.scene.getPlayerParty().findIndex(p => p.species.speciesId === SpeciesId.CHARIZARD);
    game.doRevivePokemon(charizard);

    await game.phaseInterceptor.to("TurnInitPhase");
    expect(game.scene.getPlayerField().filter(p => !p.isFainted())).toHaveLength(2);
  });

  it("randomly chooses between single and double battles if there is no battle type override", async () => {
    let rngSweepProgress = 0; // Will simulate RNG rolls by slowly increasing from 0 to 1
    let doubleCount = 0;
    let singleCount = 0;

    vi.spyOn(Phaser.Math.RND, "realInRange").mockImplementation((min: number, max: number) => {
      return rngSweepProgress * (max - min) + min;
    });

    // Play through endless, waves 1 to 9, counting number of double battles from waves 2 to 9
    await game.classicMode.startBattle(SpeciesId.BULBASAUR);
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
    await game.classicMode.startBattle(SpeciesId.BULBASAUR, SpeciesId.CHARMANDER);

    // Run 2 single -> double transitions and 2 double -> single transitions
    for (let waveNumber = 1; waveNumber < 5; waveNumber++) {
      const isDouble = waveNumber % 2 === 0;
      expect(game.scene.currentBattle.double).toBe(isDouble);
      expect(game.scene.currentBattle.waveIndex).toBe(waveNumber);

      game.move.use(MoveId.SPLASH);
      if (isDouble) {
        game.move.use(MoveId.SPLASH, 1);
      }
      await game.doKillOpponents();
      await game.toNextWave();

      expect(game.scene.currentBattle.double).toBe(!isDouble);
    }
  });

  it("should trigger multiple switches in speed order without swapping phases", async () => {
    game.override.battleStyle("double").battleType(BattleType.TRAINER);

    await game.classicMode.startBattle(SpeciesId.MAGIKARP, SpeciesId.FEEBAS, SpeciesId.POLITOED, SpeciesId.MILOTIC);

    const [player1, player2, player3, player4] = game.scene.getPlayerParty();
    const [enemy1, enemy2] = game.scene.getEnemyField();
    game.field.mockAbility(player2, AbilityId.SWIFT_SWIM);
    game.field.mockAbility(player3, AbilityId.DRIZZLE);
    vi.spyOn(player1, "getStat").mockImplementation(stat => (stat === Stat.SPD ? 100 : player1.stats[stat]));
    vi.spyOn(player2, "getStat").mockImplementation(stat => (stat === Stat.SPD ? 40 : player2.stats[stat]));
    vi.spyOn(player3, "getStat").mockImplementation(stat => (stat === Stat.SPD ? 10 : player3.stats[stat]));
    vi.spyOn(enemy1, "getStat").mockImplementation(stat => (stat === Stat.SPD ? 55 : enemy1.stats[stat]));
    vi.spyOn(enemy2, "getStat").mockImplementation(stat => (stat === Stat.SPD ? 50 : enemy2.stats[stat]));

    // Mock out `Phase.start` to track all switch/recall/summon/post summon phases queued,
    // alongside a reference to their respective pokemon.
    // We cannot do this _post hoc_ as the `SwitchPhase`s will have rearranged the player party by turn end
    // (thus making any BattlerIndex-based references inaccurate)
    const phases = [] as ["RecallPhase" | "SwitchPhase" | "SummonPhase" | "PostSummonPhase", string][];
    vi.spyOn(Phase.prototype, "start").mockImplementation(function (this: Phase) {
      if (this.is("RecallPhase") || this.is("SwitchPhase") || this.is("SummonPhase") || this.is("PostSummonPhase")) {
        phases.push([this.phaseName, this.getPokemon().name]);
      }
    });

    // switch magikarp out for politoed, and feebas out for milotic
    // drizzle should double feebas' speed and make it move 2nd
    game.doSwitchPokemon(2);
    game.doSwitchPokemon(3);
    game.forceEnemyToSwitch();
    await game.toEndOfTurn();

    // Ensure proper ordering of effects - each pokemon should do recall -> switch -> summon -> post summon in that order
    expect(phases).toEqual([
      ["RecallPhase", player1.name],
      ["SwitchPhase", player1.name],
      ["SummonPhase", player3.name],
      ["PostSummonPhase", player3.name],
      ["RecallPhase", player2.name],
      ["SwitchPhase", player2.name],
      ["SummonPhase", player4.name],
      ["PostSummonPhase", player4.name],
      ["RecallPhase", enemy1.name],
      ["SwitchPhase", enemy1.name],
      ["SummonPhase", expect.anything()],
      ["PostSummonPhase", expect.anything()],
    ]);
  });

  describe("Trainer Double Battles", () => {
    beforeEach(() => {
      game.override
        .randomTrainer({ trainerType: TrainerType.TWINS })
        .battleType(BattleType.TRAINER)
        .startingLevel(1000)
        .startingWave(12);
    });

    it.each<{ side: string; order: BattlerIndex[] }>([
      { side: "left", order: [BattlerIndex.PLAYER, BattlerIndex.PLAYER_2] },
      { side: "right", order: [BattlerIndex.PLAYER_2, BattlerIndex.PLAYER] },
    ])("should advance exactly one wave if the $side opponent is defeated first", async ({ order }) => {
      await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.MILOTIC);

      game.move.use(MoveId.MOONBLAST, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
      game.move.use(MoveId.MOONBLAST, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2);
      await game.setTurnOrder([...order, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
      await game.toNextWave();

      expect(game.scene.currentBattle.waveIndex).toBe(13);
      expect(game.phaseInterceptor.log.filter(phase => phase === "SelectModifierPhase")).toHaveLength(1);
      expect(game.scene.phaseManager.hasPhaseOfType("SelectModifierPhase")).toBe(false);
    });

    it("should advance exactly one wave if both opponents are defeated at the same time", async () => {
      await game.classicMode.startBattle(SpeciesId.FEEBAS);

      game.move.use(MoveId.DAZZLING_GLEAM);
      await game.toNextWave();

      expect(game.scene.currentBattle.waveIndex).toBe(13);
      expect(game.phaseInterceptor.log.filter(phase => phase === "SelectModifierPhase")).toHaveLength(1);
      expect(game.scene.phaseManager.hasPhaseOfType("SelectModifierPhase")).toBe(false);
    });
  });
});
