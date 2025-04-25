import { Stat } from "#enums/stat";
import { EnemyCommandPhase } from "#app/phases/enemy-command-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - DOUBLE_EDGE", () => {
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
    const moveToUse = Moves.DOUBLE_EDGE;
    game.override.battleStyle("single");
    game.override.enemySpecies(Species.MAGIKARP);
    game.override.startingLevel(1);
    game.override.startingWave(97);
    game.override.moveset([moveToUse]);
    game.override.enemyMoveset([Moves.GROWTH, Moves.GROWTH, Moves.GROWTH, Moves.GROWTH]);
    game.override.disableCrits();
  });

  it("DOUBLE_EDGE against ghost", async () => {
    const moveToUse = Moves.DOUBLE_EDGE;
    game.override.enemySpecies(Species.GENGAR);
    await game.classicMode.startBattle([Species.MIGHTYENA]);
    const hpOpponent = game.scene.currentBattle.enemyParty[0].hp;
    game.move.select(moveToUse);
    await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(TurnEndPhase);
    const hpLost = hpOpponent - game.scene.currentBattle.enemyParty[0].hp;
    expect(hpLost).toBe(0);
  }, 20000);

  it("DOUBLE_EDGE against not resistant", async () => {
    const moveToUse = Moves.DOUBLE_EDGE;
    await game.classicMode.startBattle([Species.MIGHTYENA]);
    game.scene.currentBattle.enemyParty[0].stats[Stat.DEF] = 50;
    game.scene.getPlayerParty()[0].stats[Stat.ATK] = 50;

    const hpOpponent = game.scene.currentBattle.enemyParty[0].hp;

    game.move.select(moveToUse);
    await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(TurnEndPhase);
    const hpLost = hpOpponent - game.scene.currentBattle.enemyParty[0].hp;
    expect(hpLost).toBeGreaterThan(0);
    expect(hpLost).toBeLessThan(8);
  }, 20000);

  it("DOUBLE_EDGE against SUBSTITUTE does recoil", async () => {
    const moveToUse = Moves.DOUBLE_EDGE;
    game.override.enemySpecies(Species.PIDOVE);
    game.override.enemyMoveset([Moves.SUBSTITUTE, Moves.SUBSTITUTE, Moves.SUBSTITUTE, Moves.SUBSTITUTE]);
    await game.classicMode.startBattle([Species.TOGEPI]);
    game.scene.currentBattle.enemyParty[0].stats[Stat.DEF] = 50;
    game.scene.getPlayerParty()[0].stats[Stat.ATK] = 50;

    const hpTotal = game.scene.getPlayerParty()[0].stats[Stat.HP];

    game.move.select(moveToUse);
    await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(TurnEndPhase);
    const hpLost = hpTotal - game.scene.getPlayerParty()[0].stats[Stat.HP];
    expect(hpLost).toBeGreaterThan(0);
  }, 20000);
});
