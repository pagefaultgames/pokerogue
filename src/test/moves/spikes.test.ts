import { CommandPhase } from "#app/phases/command-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";


describe("Moves - Spikes", () => {
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
    game.scene.battleStyle = 1;
    game.override.battleType("single");
    game.override.enemySpecies(Species.RATTATA);
    game.override.enemyAbility(Abilities.HYDRATION);
    game.override.enemyPassiveAbility(Abilities.HYDRATION);
    game.override.ability(Abilities.HYDRATION);
    game.override.passiveAbility(Abilities.HYDRATION);
    game.override.startingWave(3);
    game.override.enemyMoveset([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
    game.override.moveset([Moves.SPIKES, Moves.SPLASH, Moves.ROAR]);
  });

  it("single - wild - stay on field - no damage", async () => {
    await game.classicMode.runToSummon([
      Species.MIGHTYENA,
      Species.POOCHYENA,
    ]);
    await game.phaseInterceptor.to(CommandPhase, true);
    const initialHp = game.scene.getParty()[0].hp;
    expect(game.scene.getParty()[0].hp).toBe(initialHp);
    game.move.select(Moves.SPIKES);
    await game.toNextTurn();
    game.move.select(Moves.SPLASH);
    await game.toNextTurn();
    expect(game.scene.getParty()[0].hp).toBe(initialHp);
  }, 20000);

  it("single - wild - take some damage", async () => {
    // player set spikes on the field and switch back to back
    // opponent do splash for 2 turns
    // nobody should take damage
    await game.classicMode.runToSummon([
      Species.MIGHTYENA,
      Species.POOCHYENA,
    ]);
    await game.phaseInterceptor.to(CommandPhase, false);

    const initialHp = game.scene.getParty()[0].hp;
    game.doSwitchPokemon(1);
    await game.phaseInterceptor.run(CommandPhase);
    await game.phaseInterceptor.to(CommandPhase, false);

    game.doSwitchPokemon(1);
    await game.phaseInterceptor.run(CommandPhase);
    await game.phaseInterceptor.to(CommandPhase, false);

    expect(game.scene.getParty()[0].hp).toBe(initialHp);
  }, 20000);

  it("trainer - wild - force switch opponent - should take damage", async () => {
    game.override.startingWave(5);
    // player set spikes on the field and do splash for 3 turns
    // opponent do splash for 4 turns
    // nobody should take damage
    await game.classicMode.runToSummon([
      Species.MIGHTYENA,
      Species.POOCHYENA,
    ]);
    await game.phaseInterceptor.to(CommandPhase, true);
    const initialHpOpponent = game.scene.currentBattle.enemyParty[1].hp;
    game.move.select(Moves.SPIKES);
    await game.toNextTurn();
    game.move.select(Moves.ROAR);
    await game.toNextTurn();
    expect(game.scene.currentBattle.enemyParty[0].hp).toBeLessThan(initialHpOpponent);
  }, 20000);

  it("trainer - wild - force switch by himself opponent - should take damage", async () => {
    game.override.startingWave(5);
    game.override.startingLevel(5000);
    game.override.enemySpecies(0);
    // turn 1: player set spikes, opponent do splash
    // turn 2: player do splash, opponent switch pokemon
    // opponent pokemon should trigger spikes and lose HP
    await game.classicMode.runToSummon([
      Species.MIGHTYENA,
      Species.POOCHYENA,
    ]);
    await game.phaseInterceptor.to(CommandPhase, true);
    const initialHpOpponent = game.scene.currentBattle.enemyParty[1].hp;
    game.move.select(Moves.SPIKES);
    await game.toNextTurn();

    game.forceEnemyToSwitch();
    game.move.select(Moves.SPLASH);
    await game.toNextTurn();
    expect(game.scene.currentBattle.enemyParty[0].hp).toBeLessThan(initialHpOpponent);
  }, 20000);

});
