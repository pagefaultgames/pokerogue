import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import {Abilities} from "#app/data/enums/abilities";
import {Species} from "#app/data/enums/species";
import {
  CommandPhase
} from "#app/phases";
import {Moves} from "#app/data/enums/moves";


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
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.RATTATA);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.HYDRATION);
    vi.spyOn(overrides, "OPP_PASSIVE_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.HYDRATION);
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.HYDRATION);
    vi.spyOn(overrides, "PASSIVE_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.HYDRATION);
    vi.spyOn(overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(3);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH,Moves.SPLASH,Moves.SPLASH,Moves.SPLASH]);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPIKES,Moves.SPLASH, Moves.ROAR]);
  });

  it("single - wild - stay on field - no damage", async() => {
    // player set spikes on the field and do splash for 3 turns
    // opponent do splash for 4 turns
    // nobody should take damage
    await game.runToSummon([
      Species.MIGHTYENA,
      Species.POOCHYENA,
    ]);
    await game.phaseInterceptor.to(CommandPhase, true);
    const initialHp = game.scene.getParty()[0].hp;
    expect(game.scene.getParty()[0].hp).toBe(initialHp);
    game.doAttack(0);
    await game.toNextTurn();
    game.doAttack(1);
    await game.toNextTurn();
    game.doAttack(1);
    await game.toNextTurn();
    game.doAttack(1);
    await game.toNextTurn();
    game.doAttack(1);
    await game.toNextTurn();
    expect(game.scene.getParty()[0].hp).toBe(initialHp);
    console.log(game.textInterceptor.logs);
  }, 20000);

  it("single - wild - take some damage", async() => {
    // player set spikes on the field and switch back to back
    // opponent do splash for 2 turns
    // nobody should take damage
    await game.runToSummon([
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

  it("trainer - wild - force switch opponent - should take damage", async() => {
    vi.spyOn(overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(5);
    // player set spikes on the field and do splash for 3 turns
    // opponent do splash for 4 turns
    // nobody should take damage
    await game.runToSummon([
      Species.MIGHTYENA,
      Species.POOCHYENA,
    ]);
    await game.phaseInterceptor.to(CommandPhase, true);
    const initialHpOpponent = game.scene.currentBattle.enemyParty[1].hp;
    game.doAttack(0);
    await game.toNextTurn();
    game.doAttack(2);
    await game.toNextTurn();
    expect(game.scene.currentBattle.enemyParty[0].hp).toBeLessThan(initialHpOpponent);
  }, 20000);

  it("trainer - wild - force switch by himself opponent - should take damage", async() => {
    vi.spyOn(overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(5);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(5000);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(0);
    // turn 1: player set spikes, opponent do splash
    // turn 2: player do splash, opponent switch pokemon
    // opponent pokemon should trigger spikes and lose HP
    await game.runToSummon([
      Species.MIGHTYENA,
      Species.POOCHYENA,
    ]);
    await game.phaseInterceptor.to(CommandPhase, true);
    const initialHpOpponent = game.scene.currentBattle.enemyParty[1].hp;
    game.doAttack(0);
    await game.toNextTurn();

    game.forceOpponentToSwitch();
    game.doAttack(1);
    await game.toNextTurn();
    expect(game.scene.currentBattle.enemyParty[0].hp).toBeLessThan(initialHpOpponent);
  }, 20000);

});
