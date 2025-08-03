import { AbilityId } from "#enums/ability-id";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import type { PlayerPokemon } from "#field/pokemon";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Aroma Veil", () => {
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
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset([MoveId.HEAL_BLOCK, MoveId.IMPRISON, MoveId.SPLASH])
      .enemySpecies(SpeciesId.SHUCKLE)
      .ability(AbilityId.AROMA_VEIL)
      .moveset([MoveId.GROWL]);
  });

  it("Aroma Veil protects the Pokemon's side against most Move Restriction Battler Tags", async () => {
    await game.classicMode.startBattle([SpeciesId.REGIELEKI, SpeciesId.BULBASAUR]);

    const party = game.scene.getPlayerParty()! as PlayerPokemon[];

    game.move.select(MoveId.GROWL);
    game.move.select(MoveId.GROWL);
    await game.move.selectEnemyMove(MoveId.HEAL_BLOCK);
    await game.toNextTurn();
    party.forEach(p => {
      expect(p.getTag(BattlerTagType.HEAL_BLOCK)).toBeUndefined();
    });
  });

  it("Aroma Veil does not protect against Imprison", async () => {
    await game.classicMode.startBattle([SpeciesId.REGIELEKI, SpeciesId.BULBASAUR]);

    const party = game.scene.getPlayerParty()! as PlayerPokemon[];

    game.move.select(MoveId.GROWL);
    game.move.select(MoveId.GROWL, 1);
    await game.move.selectEnemyMove(MoveId.IMPRISON, BattlerIndex.PLAYER);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();
    expect(game.scene.arena.getTag(ArenaTagType.IMPRISON)).toBeDefined();
    party.forEach(p => {
      expect(p.getTag(BattlerTagType.IMPRISON)).toBeDefined();
    });
  });
});
