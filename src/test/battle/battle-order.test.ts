import { Stat } from "#app/data/pokemon-stat";
import { EnemyCommandPhase } from "#app/phases/enemy-command-phase";
import { SelectTargetPhase } from "#app/phases/select-target-phase";
import { TurnStartPhase } from "#app/phases/turn-start-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";


describe("Battle order", () => {
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
    game.override.battleType("single");
    game.override.enemySpecies(Species.MEWTWO);
    game.override.enemyAbility(Abilities.INSOMNIA);
    game.override.ability(Abilities.INSOMNIA);
    game.override.moveset([Moves.TACKLE]);
  });

  it("opponent faster than player 50 vs 150", async () => {
    await game.startBattle([
      Species.BULBASAUR,
    ]);
    game.scene.getParty()[0].stats[Stat.SPD] = 50;
    game.scene.currentBattle.enemyParty[0].stats[Stat.SPD] = 150;

    game.move.select(Moves.TACKLE);
    await game.phaseInterceptor.run(EnemyCommandPhase);
    const phase = game.scene.getCurrentPhase() as TurnStartPhase;
    const order = phase.getOrder();
    expect(order[0]).toBe(2);
    expect(order[1]).toBe(0);
  }, 20000);

  it("Player faster than opponent 150 vs 50", async () => {
    await game.startBattle([
      Species.BULBASAUR,
    ]);
    game.scene.getParty()[0].stats[Stat.SPD] = 150;
    game.scene.currentBattle.enemyParty[0].stats[Stat.SPD] = 50;

    game.move.select(Moves.TACKLE);
    await game.phaseInterceptor.run(EnemyCommandPhase);
    const phase = game.scene.getCurrentPhase() as TurnStartPhase;
    const order = phase.getOrder();
    expect(order[0]).toBe(0);
    expect(order[1]).toBe(2);
  }, 20000);

  it("double - both opponents faster than player 50/50 vs 150/150", async () => {
    game.override.battleType("double");
    await game.startBattle([
      Species.BULBASAUR,
      Species.BLASTOISE,
    ]);
    game.scene.getParty()[0].stats[Stat.SPD] = 50;
    game.scene.getParty()[1].stats[Stat.SPD] = 50;
    game.scene.currentBattle.enemyParty[0].stats[Stat.SPD] = 150;
    game.scene.currentBattle.enemyParty[1].stats[Stat.SPD] = 150;

    game.move.select(Moves.TACKLE);
    game.move.select(Moves.TACKLE, 1);
    await game.phaseInterceptor.runFrom(SelectTargetPhase).to(TurnStartPhase, false);
    const phase = game.scene.getCurrentPhase() as TurnStartPhase;
    const order = phase.getOrder();
    expect(order.indexOf(0)).toBeGreaterThan(order.indexOf(2));
    expect(order.indexOf(0)).toBeGreaterThan(order.indexOf(3));
    expect(order.indexOf(1)).toBeGreaterThan(order.indexOf(2));
    expect(order.indexOf(1)).toBeGreaterThan(order.indexOf(3));
  }, 20000);

  it("double - speed tie except 1 - 100/100 vs 100/150", async () => {
    game.override.battleType("double");
    await game.startBattle([
      Species.BULBASAUR,
      Species.BLASTOISE,
    ]);
    game.scene.getParty()[0].stats[Stat.SPD] = 100;
    game.scene.getParty()[1].stats[Stat.SPD] = 100;
    game.scene.currentBattle.enemyParty[0].stats[Stat.SPD] = 100;
    game.scene.currentBattle.enemyParty[1].stats[Stat.SPD] = 150;

    game.move.select(Moves.TACKLE);
    game.move.select(Moves.TACKLE, 1);
    await game.phaseInterceptor.runFrom(SelectTargetPhase).to(TurnStartPhase, false);
    const phase = game.scene.getCurrentPhase() as TurnStartPhase;
    const order = phase.getOrder();
    expect(order.indexOf(3)).toBeLessThan(order.indexOf(0));
    expect(order.indexOf(3)).toBeLessThan(order.indexOf(1));
    expect(order.indexOf(3)).toBeLessThan(order.indexOf(2));
  }, 20000);

  it("double - speed tie 100/150 vs 100/150", async () => {
    game.override.battleType("double");
    await game.startBattle([
      Species.BULBASAUR,
      Species.BLASTOISE,
    ]);
    game.scene.getParty()[0].stats[Stat.SPD] = 100;
    game.scene.getParty()[1].stats[Stat.SPD] = 150;
    game.scene.currentBattle.enemyParty[0].stats[Stat.SPD] = 100;
    game.scene.currentBattle.enemyParty[1].stats[Stat.SPD] = 150;

    game.move.select(Moves.TACKLE);
    game.move.select(Moves.TACKLE, 1);
    await game.phaseInterceptor.runFrom(SelectTargetPhase).to(TurnStartPhase, false);
    const phase = game.scene.getCurrentPhase() as TurnStartPhase;
    const order = phase.getOrder();
    expect(order.indexOf(1)).toBeLessThan(order.indexOf(0));
    expect(order.indexOf(1)).toBeLessThan(order.indexOf(2));
    expect(order.indexOf(3)).toBeLessThan(order.indexOf(0));
    expect(order.indexOf(3)).toBeLessThan(order.indexOf(2));
  }, 20000);
});
