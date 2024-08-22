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

    const playerPokemonIndex = game.scene.getPlayerPokemon()?.getBattlerIndex();
    const enemyPokemonIndex = game.scene.getEnemyPokemon()?.getBattlerIndex();
    const phase = game.scene.getCurrentPhase() as TurnStartPhase;
    const order = phase.getCommandOrder();
    expect(order[0]).toBe(enemyPokemonIndex);
    expect(order[1]).toBe(playerPokemonIndex);
  }, 20000);

  it("Player faster than opponent 150 vs 50", async () => {
    await game.startBattle([
      Species.BULBASAUR,
    ]);
    game.scene.getParty()[0].stats[Stat.SPD] = 150;
    game.scene.currentBattle.enemyParty[0].stats[Stat.SPD] = 50;

    game.move.select(Moves.TACKLE);
    await game.phaseInterceptor.run(EnemyCommandPhase);

    const playerPokemonIndex = game.scene.getPlayerPokemon()?.getBattlerIndex();
    const enemyPokemonIndex = game.scene.getEnemyPokemon()?.getBattlerIndex();
    const phase = game.scene.getCurrentPhase() as TurnStartPhase;
    const order = phase.getCommandOrder();
    expect(order[0]).toBe(playerPokemonIndex);
    expect(order[1]).toBe(enemyPokemonIndex);
  }, 20000);

  it("double - both opponents faster than player 50/50 vs 150/150", async () => {
    game.override.battleType("double");
    await game.startBattle([
      Species.BULBASAUR,
      Species.BLASTOISE,
    ]);

    const playerParty = game.scene.getParty();
    const playerPokemon1 = playerParty[0];
    const playerPokemon2 = playerParty[1];
    const enemyPokemon1 = game.scene.currentBattle.enemyParty[0];
    const enemyPokemon2 = game.scene.currentBattle.enemyParty[1];
    playerPokemon1.stats[Stat.SPD] = 50;
    playerPokemon2.stats[Stat.SPD] = 50;
    enemyPokemon1.stats[Stat.SPD] = 150;
    enemyPokemon2.stats[Stat.SPD] = 150;

    game.move.select(Moves.TACKLE);
    game.move.select(Moves.TACKLE, 1);
    await game.phaseInterceptor.runFrom(SelectTargetPhase).to(TurnStartPhase, false);

    const pp1Index = playerPokemon1?.getBattlerIndex();
    const pp2Index = playerPokemon2?.getBattlerIndex();
    const ep1Index = enemyPokemon1?.getBattlerIndex();
    const ep2Index = enemyPokemon2?.getBattlerIndex();
    const phase = game.scene.getCurrentPhase() as TurnStartPhase;
    const order = phase.getCommandOrder();
    expect(order.slice(0,2).includes(ep1Index)).toBe(true);
    expect(order.slice(0,2).includes(ep2Index)).toBe(true);
    expect(order.slice(2,4).includes(pp1Index)).toBe(true);
    expect(order.slice(2,4).includes(pp2Index)).toBe(true);
  }, 20000);

  it("double - speed tie except 1 - 100/100 vs 100/150", async () => {
    game.override.battleType("double");
    await game.startBattle([
      Species.BULBASAUR,
      Species.BLASTOISE,
    ]);
    const playerParty = game.scene.getParty();
    const playerPokemon1 = playerParty[0];
    const playerPokemon2 = playerParty[1];
    const enemyPokemon1 = game.scene.currentBattle.enemyParty[0];
    const enemyPokemon2 = game.scene.currentBattle.enemyParty[1];
    playerPokemon1.stats[Stat.SPD] = 100;
    playerPokemon2.stats[Stat.SPD] = 100;
    enemyPokemon1.stats[Stat.SPD] = 100;
    enemyPokemon2.stats[Stat.SPD] = 150;

    game.move.select(Moves.TACKLE);
    game.move.select(Moves.TACKLE, 1);
    await game.phaseInterceptor.runFrom(SelectTargetPhase).to(TurnStartPhase, false);

    const pp1Index = playerPokemon1?.getBattlerIndex();
    const pp2Index = playerPokemon2?.getBattlerIndex();
    const ep1Index = enemyPokemon1?.getBattlerIndex();
    const ep2Index = enemyPokemon2?.getBattlerIndex();
    const phase = game.scene.getCurrentPhase() as TurnStartPhase;
    const order = phase.getCommandOrder();
    expect(order[0]).toBe(ep2Index);
    expect(order.slice(1,4).includes(ep1Index)).toBe(true);
    expect(order.slice(1,4).includes(pp2Index)).toBe(true);
    expect(order.slice(1,4).includes(pp1Index)).toBe(true);
  }, 20000);

  it("double - speed tie 100/150 vs 100/150", async () => {
    game.override.battleType("double");
    await game.startBattle([
      Species.BULBASAUR,
      Species.BLASTOISE,
    ]);
    const playerParty = game.scene.getParty();
    const playerPokemon1 = playerParty[0];
    const playerPokemon2 = playerParty[1];
    const enemyPokemon1 = game.scene.currentBattle.enemyParty[0];
    const enemyPokemon2 = game.scene.currentBattle.enemyParty[1];
    playerPokemon1.stats[Stat.SPD] = 100;
    playerPokemon2.stats[Stat.SPD] = 150;
    enemyPokemon1.stats[Stat.SPD] = 100;
    enemyPokemon2.stats[Stat.SPD] = 150;

    game.move.select(Moves.TACKLE);
    game.move.select(Moves.TACKLE, 1);
    await game.phaseInterceptor.runFrom(SelectTargetPhase).to(TurnStartPhase, false);

    const pp1Index = playerPokemon1?.getBattlerIndex();
    const pp2Index = playerPokemon2?.getBattlerIndex();
    const ep1Index = enemyPokemon1?.getBattlerIndex();
    const ep2Index = enemyPokemon2?.getBattlerIndex();
    const phase = game.scene.getCurrentPhase() as TurnStartPhase;
    const order = phase.getCommandOrder();
    expect(order.slice(0,2).includes(pp2Index)).toBe(true);
    expect(order.slice(0,2).includes(ep2Index)).toBe(true);
    expect(order.slice(2,4).includes(ep1Index)).toBe(true);
    expect(order.slice(2,4).includes(pp1Index)).toBe(true);
  }, 20000);
});
