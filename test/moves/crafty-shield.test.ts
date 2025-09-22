import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Crafty Shield", () => {
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
      .battleStyle("double")
      .enemySpecies(SpeciesId.DUSKNOIR)
      .enemyMoveset(MoveId.GROWL)
      .enemyAbility(AbilityId.INSOMNIA)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should protect the user and allies from status moves", async () => {
    await game.classicMode.startBattle([SpeciesId.CHARIZARD, SpeciesId.BLASTOISE]);

    const [charizard, blastoise] = game.scene.getPlayerField();
    game.move.use(MoveId.CRAFTY_SHIELD, BattlerIndex.PLAYER);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.move.forceEnemyMove(MoveId.GROWL);
    await game.move.forceEnemyMove(MoveId.GROWL);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(charizard.getStatStage(Stat.ATK)).toBe(0);
    expect(blastoise.getStatStage(Stat.ATK)).toBe(0);
  });

  it("should not protect the user and allies from attack moves", async () => {
    game.override.enemyMoveset(MoveId.TACKLE);
    await game.classicMode.startBattle([SpeciesId.CHARIZARD, SpeciesId.BLASTOISE]);

    const [charizard, blastoise] = game.scene.getPlayerField();

    game.move.use(MoveId.CRAFTY_SHIELD, BattlerIndex.PLAYER);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.move.forceEnemyMove(MoveId.TACKLE, BattlerIndex.PLAYER);
    await game.move.forceEnemyMove(MoveId.TACKLE, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(charizard.isFullHp()).toBe(false);
    expect(blastoise.isFullHp()).toBe(false);
  });

  it("should not block entry hazards and field-targeted moves", async () => {
    game.override.enemyMoveset([MoveId.PERISH_SONG, MoveId.TOXIC_SPIKES]);
    await game.classicMode.startBattle([SpeciesId.CHARIZARD, SpeciesId.BLASTOISE]);

    const [charizard, blastoise] = game.scene.getPlayerField();

    game.move.use(MoveId.CRAFTY_SHIELD, BattlerIndex.PLAYER);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.move.forceEnemyMove(MoveId.PERISH_SONG);
    await game.move.forceEnemyMove(MoveId.TOXIC_SPIKES);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.scene.arena.getTagOnSide(ArenaTagType.TOXIC_SPIKES, ArenaTagSide.PLAYER)).toBeDefined();
    expect(charizard.getTag(BattlerTagType.PERISH_SONG)).toBeDefined();
    expect(blastoise.getTag(BattlerTagType.PERISH_SONG)).toBeDefined();
  });

  it("should protect the user and allies from moves that ignore other protection", async () => {
    game.override.moveset(MoveId.CURSE);

    await game.classicMode.startBattle([SpeciesId.CHARIZARD, SpeciesId.BLASTOISE]);

    const [charizard, blastoise] = game.scene.getPlayerField();

    game.move.use(MoveId.CRAFTY_SHIELD, BattlerIndex.PLAYER);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.move.forceEnemyMove(MoveId.CURSE, BattlerIndex.PLAYER);
    await game.move.forceEnemyMove(MoveId.CURSE, BattlerIndex.PLAYER_2);

    await game.toEndOfTurn();

    expect(charizard.getTag(BattlerTagType.CURSED)).toBeUndefined();
    expect(blastoise.getTag(BattlerTagType.CURSED)).toBeUndefined();

    const [dusknoir1, dusknoir2] = game.scene.getEnemyField();
    expect(dusknoir1).toHaveFullHp();
    expect(dusknoir2).toHaveFullHp();
  });

  it("should not block allies' self or ally-targeted moves", async () => {
    await game.classicMode.startBattle([SpeciesId.CHARIZARD, SpeciesId.BLASTOISE]);

    const [charizard, blastoise] = game.scene.getPlayerField();

    game.move.use(MoveId.CRAFTY_SHIELD, BattlerIndex.PLAYER);
    game.move.use(MoveId.SWORDS_DANCE, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(charizard.getStatStage(Stat.ATK)).toBe(0);
    expect(blastoise.getStatStage(Stat.ATK)).toBe(2);

    game.move.use(MoveId.HOWL, BattlerIndex.PLAYER);
    game.move.use(MoveId.CRAFTY_SHIELD, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(charizard.getStatStage(Stat.ATK)).toBe(1);
    expect(blastoise.getStatStage(Stat.ATK)).toBe(3);
  });
});
