import { BattleStat } from "#app/data/battle-stat.js";
import { PostSummonPhase } from "#app/phases.js";
import i18next, { initI18n } from "#app/plugins/i18n.js";
import GameManager from "#app/test/utils/gameManager";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";


describe("Moves - Baton Pass", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  function getActivePokemon() {
    return game.scene.getParty()[0];
  }

  beforeAll(() => {
    initI18n();
    i18next.changeLanguage("en");
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    const moveToUse = Moves.BATON_PASS;
    game.override.battleType("single");
    game.override.enemySpecies(Species.MAGIKARP);
    game.override.startingLevel(1);
    game.override.startingWave(97);
    game.override.moveset([moveToUse, Moves.NASTY_PLOT, Moves.SPLASH]);
    game.override.enemyMoveset(new Array(4).fill(Moves.SPLASH));
    game.override.disableCrits();
  });

  it("passes stat stage buffs when player uses it", async() => {
    // arrange
    await game.startBattle([
      Species.RAICHU,
      Species.SHUCKLE
    ]);

    // round 1 - buff
    game.doAttack(getMovePosition(game.scene, 0, Moves.NASTY_PLOT));
    await game.toNextTurn();
    expect(getActivePokemon().summonData.battleStats[BattleStat.SPATK]).toEqual(2);

    // round 2 - baton pass
    game.doAttack(getMovePosition(game.scene, 0, Moves.BATON_PASS));
    game.doSelectPokemon(1);
    await game.toNextTurn();

    // assert
    expect(getActivePokemon().summonData.battleStats[BattleStat.SPATK]).toEqual(2);
  }, 20000);

  it("passes stat stage buffs when AI uses it", async() => {
    // arrange
    game.override.startingWave(5);
    game.override.enemyMoveset(new Array(4).fill([Moves.NASTY_PLOT]));
    await game.startBattle([
      Species.RAICHU,
      Species.SHUCKLE
    ]);

    // round 1 - ai buffs
    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
    await game.toNextTurn();

    // round 2 - baton pass
    game.phaseInterceptor.clearLogs();
    game.override.enemyMoveset(new Array(4).fill([Moves.BATON_PASS]));
    game.override.enemySpecies(Species.GENGAR);
    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
    await game.phaseInterceptor.to(PostSummonPhase, false);

    // assert
    // check buffs are still there
    expect(game.scene.getEnemyParty()[0].summonData.battleStats[BattleStat.SPATK]).toEqual(2);
    // confirm that a switch actually happened
    expect(game.textInterceptor.getLatestMessage()).toContain("sent out Magikarp");
    expect(game.phaseInterceptor.log.slice(-4)).toEqual([
      "MoveEffectPhase",
      "SwitchSummonPhase",
      "SummonPhase",
      "PostSummonPhase"
    ]);
  }, 20000);
});
