import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import type { EntryHazardTagType } from "#types/arena-tags";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Tidy Up", () => {
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
      .enemyMoveset(MoveId.SPLASH)
      .ability(AbilityId.BALL_FETCH);
  });

  it.each<{ name: string; tagType: EntryHazardTagType }>([
    { name: "Spikes", tagType: ArenaTagType.SPIKES },
    { name: "Toxic Spikes", tagType: ArenaTagType.TOXIC_SPIKES },
    { name: "Stealth Rock", tagType: ArenaTagType.STEALTH_ROCK },
    { name: "Sticky Web", tagType: ArenaTagType.STICKY_WEB },
  ])("should remove $name from both sides of the field", async ({ tagType }) => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    // Add tag to both sides of the field
    game.scene.arena.addTag(tagType, 1, undefined, game.field.getPlayerPokemon().id, ArenaTagSide.PLAYER);
    game.scene.arena.addTag(tagType, 1, undefined, game.field.getPlayerPokemon().id, ArenaTagSide.ENEMY);

    expect(game.scene.arena.getTag(tagType)).toBeDefined();

    game.move.use(MoveId.TIDY_UP);
    await game.toEndOfTurn();

    expect(game.scene.arena.getTag(tagType)).toBeUndefined();
  });

  it("should clear substitutes from all pokemon", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.CINCCINO, SpeciesId.FEEBAS]);

    game.move.use(MoveId.SUBSTITUTE, BattlerIndex.PLAYER);
    game.move.use(MoveId.SUBSTITUTE, BattlerIndex.PLAYER_2);
    await game.move.forceEnemyMove(MoveId.SUBSTITUTE);
    await game.move.forceEnemyMove(MoveId.SUBSTITUTE);
    await game.toNextTurn();

    game.scene.getField(true).forEach(p => {
      expect(p).toHaveBattlerTag(BattlerTagType.SUBSTITUTE);
    });

    game.move.use(MoveId.TIDY_UP, BattlerIndex.PLAYER);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toEndOfTurn();

    game.scene.getField(true).forEach(p => {
      expect(p).not.toHaveBattlerTag(BattlerTagType.SUBSTITUTE);
    });
  });

  it("should raise the user's stats even if a tag cannot be removed", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();
    expect(feebas).toHaveStatStage(Stat.ATK, 0);
    expect(feebas).toHaveStatStage(Stat.SPD, 0);

    game.move.use(MoveId.TIDY_UP);
    await game.toEndOfTurn();

    expect(feebas).toHaveStatStage(Stat.ATK, 1);
    expect(feebas).toHaveStatStage(Stat.SPD, 1);
  });
});
