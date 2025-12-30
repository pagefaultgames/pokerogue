import { TerrainType } from "#data/terrain";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Defog", () => {
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
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should remove terrains", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(MoveId.DEFOG);
    await game.move.forceEnemyMove(MoveId.ELECTRIC_TERRAIN);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);

    await game.phaseInterceptor.to("MoveEndPhase");
    expect(game).toHaveTerrain(TerrainType.ELECTRIC);

    await game.toEndOfTurn();
    expect(game).not.toHaveTerrain(TerrainType.ELECTRIC);
  });

  it("should lower opponent's evasion by 1 stage", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(MoveId.DEFOG);
    await game.toEndOfTurn();

    expect(game.field.getEnemyPokemon()).toHaveStatStage(Stat.EVA, -1);
  });

  it.each<{ tagType: ArenaTagType; tagName: string }>([
    { tagType: ArenaTagType.SPIKES, tagName: "Spikes" },
    { tagType: ArenaTagType.STEALTH_ROCK, tagName: "Stealth Rocks" },
    { tagType: ArenaTagType.TOXIC_SPIKES, tagName: "Toxic Spikes" },
    { tagType: ArenaTagType.STICKY_WEB, tagName: "Sticky Web" },
  ])("should remove $tagName from both sides of the field", async ({ tagType }) => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.scene.arena.addTag(tagType, 0, undefined, game.field.getEnemyPokemon().id, ArenaTagSide.PLAYER);
    game.scene.arena.addTag(tagType, 0, undefined, game.field.getPlayerPokemon().id, ArenaTagSide.ENEMY);

    game.move.use(MoveId.DEFOG);
    await game.toEndOfTurn();

    expect(game).not.toHaveArenaTag({ tagType, side: ArenaTagSide.PLAYER });
    expect(game).not.toHaveArenaTag({ tagType, side: ArenaTagSide.ENEMY });
  });

  it.each<{ tagType: ArenaTagType; tagName: string }>([
    { tagType: ArenaTagType.REFLECT, tagName: "Reflect" },
    { tagType: ArenaTagType.LIGHT_SCREEN, tagName: "Light Screen" },
    { tagType: ArenaTagType.AURORA_VEIL, tagName: "Aurora Veil" },
    { tagType: ArenaTagType.SAFEGUARD, tagName: "Safeguard" },
    { tagType: ArenaTagType.MIST, tagName: "Mist" },
  ])("should remove $tagName only from the target's side of the field", async ({ tagType }) => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.scene.arena.addTag(tagType, 0, undefined, game.field.getEnemyPokemon().id, ArenaTagSide.ENEMY);
    game.scene.arena.addTag(tagType, 0, undefined, game.field.getPlayerPokemon().id, ArenaTagSide.PLAYER);

    game.move.use(MoveId.DEFOG);
    await game.toEndOfTurn();

    expect(game).toHaveArenaTag({ tagType, side: ArenaTagSide.PLAYER });
    expect(game).not.toHaveArenaTag({ tagType, side: ArenaTagSide.ENEMY });
  });
});
