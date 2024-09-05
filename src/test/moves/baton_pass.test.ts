import { BattlerIndex } from "#app/battle";
import GameManager from "#app/test/utils/gameManager";
import { Abilities } from "#enums/abilities";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Stat } from "#enums/stat";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

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
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .moveset([Moves.BATON_PASS, Moves.NASTY_PLOT, Moves.SPLASH])
      .ability(Abilities.BALL_FETCH)
      .enemyMoveset(SPLASH_ONLY)
      .disableCrits();
  });

  it("transfers all stat stages when player uses it", async() => {
    // arrange
    await game.classicMode.startBattle([Species.RAICHU, Species.SHUCKLE]);

    // round 1 - buff
    game.move.select(Moves.NASTY_PLOT);
    await game.toNextTurn();

    let playerPokemon = game.scene.getPlayerPokemon()!;

    expect(playerPokemon.getStatStage(Stat.SPATK)).toEqual(2);

    // round 2 - baton pass
    game.move.select(Moves.BATON_PASS);
    game.doSelectPartyPokemon(1);
    await game.phaseInterceptor.to("TurnEndPhase");

    // assert
    playerPokemon = game.scene.getPlayerPokemon()!;
    expect(playerPokemon.species.speciesId).toEqual(Species.SHUCKLE);
    expect(playerPokemon.getStatStage(Stat.SPATK)).toEqual(2);
  }, 20000);

  it("passes stat stage buffs when AI uses it", async () => {
    // arrange
    game.override
      .startingWave(5)
      .enemyMoveset(new Array(4).fill([Moves.NASTY_PLOT]));
    await game.classicMode.startBattle([Species.RAICHU, Species.SHUCKLE]);

    // round 1 - ai buffs
    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    // round 2 - baton pass
    game.scene.getEnemyPokemon()!.hp = 100;
    game.override.enemyMoveset(new Array(4).fill(Moves.BATON_PASS));
    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("PostSummonPhase", false);

    // assert
    // check buffs are still there
    expect(game.scene.getEnemyPokemon()!.getStatStage(Stat.SPATK)).toEqual(2);
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

  it("doesn't transfer effects that aren't transferrable", async() => {
    game.override.enemyMoveset(Array(4).fill(Moves.SALT_CURE));
    await game.classicMode.startBattle([Species.PIKACHU, Species.FEEBAS]);

    const [player1, player2] = game.scene.getParty();

    game.move.select(Moves.BATON_PASS);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("MoveEndPhase");
    expect(player1.findTag((t) => t.tagType === BattlerTagType.SALT_CURED)).toBeTruthy();
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    expect(player2.findTag((t) => t.tagType === BattlerTagType.SALT_CURED)).toBeUndefined();
  }, 20000);
});
