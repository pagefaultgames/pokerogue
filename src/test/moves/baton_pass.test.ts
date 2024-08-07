import { BattleStat } from "#app/data/battle-stat.js";
import { PostSummonPhase, TurnEndPhase } from "#app/phases.js";
import GameManager from "#app/test/utils/gameManager";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SPLASH_ONLY } from "../utils/testUtils";


describe("Moves - Baton Pass", () => {
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
      .battleType("single")
      .enemySpecies(Species.DUGTRIO)
      .startingLevel(1)
      .startingWave(97)
      .moveset([Moves.BATON_PASS, Moves.NASTY_PLOT, Moves.SPLASH])
      .enemyMoveset(SPLASH_ONLY)
      .disableCrits();
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
    expect(game.scene.getPlayerPokemon()!.summonData.battleStats[BattleStat.SPATK]).toEqual(2);

    // round 2 - baton pass
    game.doAttack(getMovePosition(game.scene, 0, Moves.BATON_PASS));
    game.doSelectPartyPokemon(1);
    await game.phaseInterceptor.to(TurnEndPhase);

    // assert
    const playerPkm = game.scene.getPlayerPokemon()!;
    expect(playerPkm.species.speciesId).toEqual(Species.SHUCKLE);
    expect(playerPkm.summonData.battleStats[BattleStat.SPATK]).toEqual(2);
  }, 20000);

  it("passes stat stage buffs when AI uses it", async() => {
    // arrange
    game.override
      .startingWave(5)
      .enemyMoveset(new Array(4).fill([Moves.NASTY_PLOT]));
    await game.startBattle([
      Species.RAICHU,
      Species.SHUCKLE
    ]);

    // round 1 - ai buffs
    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
    await game.toNextTurn();

    // round 2 - baton pass
    game.scene.getEnemyPokemon()!.hp = 100;
    game.override.enemyMoveset(new Array(4).fill(Moves.BATON_PASS));
    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
    await game.phaseInterceptor.to(PostSummonPhase, false);

    // assert
    // check buffs are still there
    expect(game.scene.getEnemyPokemon()!.summonData.battleStats[BattleStat.SPATK]).toEqual(2);
    // confirm that a switch actually happened. can't use species because I
    // can't find a way to override trainer parties with more than 1 pokemon species
    expect(game.scene.getEnemyPokemon()!.hp).not.toEqual(100);
    expect(game.phaseInterceptor.log.slice(-4)).toEqual([
      "MoveEffectPhase",
      "SwitchSummonPhase",
      "SummonPhase",
      "PostSummonPhase"
    ]);
  }, 20000);
});
