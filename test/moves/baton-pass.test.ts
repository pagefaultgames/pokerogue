import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
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
      .battleStyle("single")
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .moveset([MoveId.BATON_PASS, MoveId.NASTY_PLOT, MoveId.SPLASH])
      .ability(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .criticalHits(false);
  });

  it("transfers all stat stages when player uses it", async () => {
    // arrange
    await game.classicMode.startBattle([SpeciesId.RAICHU, SpeciesId.SHUCKLE]);

    // round 1 - buff
    game.move.select(MoveId.NASTY_PLOT);
    await game.toNextTurn();

    let playerPokemon = game.field.getPlayerPokemon();

    expect(playerPokemon.getStatStage(Stat.SPATK)).toEqual(2);

    // round 2 - baton pass
    game.move.select(MoveId.BATON_PASS);
    game.doSelectPartyPokemon(1);
    await game.phaseInterceptor.to("TurnEndPhase");

    // assert
    playerPokemon = game.field.getPlayerPokemon();
    expect(playerPokemon.species.speciesId).toEqual(SpeciesId.SHUCKLE);
    expect(playerPokemon.getStatStage(Stat.SPATK)).toEqual(2);
  });

  it("passes stat stage buffs when AI uses it", async () => {
    // arrange
    game.override.startingWave(5).enemyMoveset([MoveId.NASTY_PLOT, MoveId.BATON_PASS]);
    await game.classicMode.startBattle([SpeciesId.RAICHU, SpeciesId.SHUCKLE]);

    // round 1 - ai buffs
    game.move.select(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.NASTY_PLOT);
    await game.toNextTurn();

    // round 2 - baton pass
    game.move.select(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.BATON_PASS);
    await game.phaseInterceptor.to("PostSummonPhase", false);

    // check buffs are still there
    expect(game.field.getEnemyPokemon().getStatStage(Stat.SPATK)).toEqual(2);
    // confirm that a switch actually happened. can't use species because I
    // can't find a way to override trainer parties with more than 1 pokemon species
    expect(game.phaseInterceptor.log.slice(-4)).toEqual([
      "MoveEffectPhase",
      "SwitchSummonPhase",
      "SummonPhase",
      "PostSummonPhase",
    ]);
  });

  it("doesn't transfer effects that aren't transferrable", async () => {
    game.override.enemyMoveset([MoveId.SALT_CURE]);
    await game.classicMode.startBattle([SpeciesId.PIKACHU, SpeciesId.FEEBAS]);

    const [player1, player2] = game.scene.getPlayerParty();

    game.move.select(MoveId.BATON_PASS);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("MoveEndPhase");
    expect(player1.findTag(t => t.tagType === BattlerTagType.SALT_CURED)).toBeTruthy();
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    expect(player2.findTag(t => t.tagType === BattlerTagType.SALT_CURED)).toBeUndefined();
  });

  it("doesn't allow binding effects from the user to persist", async () => {
    game.override.moveset([MoveId.FIRE_SPIN, MoveId.BATON_PASS]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS]);

    const enemy = game.field.getEnemyPokemon();

    game.move.select(MoveId.FIRE_SPIN);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.move.forceHit();

    await game.toNextTurn();

    expect(enemy.getTag(BattlerTagType.FIRE_SPIN)).toBeDefined();

    game.move.select(MoveId.BATON_PASS);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    expect(enemy.getTag(BattlerTagType.FIRE_SPIN)).toBeUndefined();
  });
});
