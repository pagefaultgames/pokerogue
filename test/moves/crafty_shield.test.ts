import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import GameManager from "#test/testUtils/gameManager";
import { Species } from "#enums/species";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Stat } from "#enums/stat";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import { BattlerIndex } from "#app/battle";
import { ArenaTagType } from "#enums/arena-tag-type";
import { ArenaTagSide } from "#app/data/arena-tag";

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
      .moveset([Moves.CRAFTY_SHIELD, Moves.SPLASH, Moves.SWORDS_DANCE, Moves.HOWL])
      .enemySpecies(Species.DUSKNOIR)
      .enemyMoveset(Moves.GROWL)
      .enemyAbility(Abilities.INSOMNIA)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should protect the user and allies from status moves", async () => {
    await game.classicMode.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

    const [charizard, blastoise] = game.scene.getPlayerField();
    game.move.select(Moves.CRAFTY_SHIELD, BattlerIndex.PLAYER);
    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER_2);
    await game.forceEnemyMove(Moves.GROWL);
    await game.forceEnemyMove(Moves.GROWL);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(charizard.getStatStage(Stat.ATK)).toBe(0);
    expect(blastoise.getStatStage(Stat.ATK)).toBe(0);
  });

  it("should not protect the user and allies from attack moves", async () => {
    game.override.enemyMoveset(Moves.TACKLE);
    await game.classicMode.startBattle([Species.CHARIZARD, Species.BLASTOISE]);
    
    const [charizard, blastoise] = game.scene.getPlayerField();

    game.move.select(Moves.CRAFTY_SHIELD, BattlerIndex.PLAYER);
    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER_2);
    await game.forceEnemyMove(Moves.TACKLE, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.TACKLE, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(charizard.isFullHp()).toBe(false);
    expect(blastoise.isFullHp()).toBe(false);
  });

  it("should not block entry hazards and field-targeted moves", async () => {
    game.override.enemyMoveset([Moves.PERISH_SONG, Moves.TOXIC_SPIKES]);
    await game.classicMode.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

    const [charizard, blastoise] = game.scene.getPlayerField();

    game.move.select(Moves.CRAFTY_SHIELD, BattlerIndex.PLAYER);
    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER_2);
    await game.forceEnemyMove(Moves.PERISH_SONG);
    await game.forceEnemyMove(Moves.TOXIC_SPIKES);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.scene.arena.getTagOnSide(ArenaTagType.TOXIC_SPIKES, ArenaTagSide.PLAYER)).toBeDefined();
    expect(charizard.getTag(BattlerTagType.PERISH_SONG)).toBeDefined();
    expect(blastoise.getTag(BattlerTagType.PERISH_SONG)).toBeDefined();
  });

  it("should protect the user and allies from moves that ignore other protection", async () => {
    game.override.moveset(Moves.CURSE);
    
    await game.classicMode.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

    const [charizard, blastoise] = game.scene.getPlayerField();

    game.move.select(Moves.CRAFTY_SHIELD, BattlerIndex.PLAYER);
    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER_2);
    await game.forceEnemyMove(Moves.CURSE, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.CURSE, BattlerIndex.PLAYER_2);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(charizard.getTag(BattlerTagType.CURSED)).toBeDefined();
    expect(blastoise.getTag(BattlerTagType.CURSED)).toBeDefined();

    const [dusknoir1, dusknoir2] = game.scene.getEnemyField();
    expect(dusknoir1.isFullHp()).toBe(false);
    expect(dusknoir2.isFullHp()).toBe(false);
  });

  it("should not block allies' self or ally-targeted moves", async () => {
    await game.classicMode.startBattle([Species.CHARIZARD, Species.BLASTOISE]);

    const [charizard, blastoise] = game.scene.getPlayerField();

    game.move.select(Moves.CRAFTY_SHIELD, BattlerIndex.PLAYER);
    game.move.select(Moves.SWORDS_DANCE, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(charizard.getStatStage(Stat.ATK)).toBe(0);
    expect(blastoise.getStatStage(Stat.ATK)).toBe(2);

    game.move.select(Moves.HOWL, BattlerIndex.PLAYER);
    game.move.select(Moves.CRAFTY_SHIELD, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(charizard.getStatStage(Stat.ATK)).toBe(1);
    expect(blastoise.getStatStage(Stat.ATK)).toBe(3);
  });
});
