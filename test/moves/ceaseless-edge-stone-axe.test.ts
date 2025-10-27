import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import type { EntryHazardTagType } from "#types/arena-tags";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe.each<{ name: string; move: MoveId; hazard: EntryHazardTagType; hazardName: string }>([
  { name: "Ceaseless Edge", move: MoveId.CEASELESS_EDGE, hazard: ArenaTagType.SPIKES, hazardName: "spikes" },
  { name: "Stone Axe", move: MoveId.STONE_AXE, hazard: ArenaTagType.STEALTH_ROCK, hazardName: "stealth rock" },
])("Move - $name", ({ move, hazard, hazardName }) => {
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
      .enemySpecies(SpeciesId.RATTATA)
      .ability(AbilityId.NO_GUARD)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it(`should hit and apply ${hazardName}`, async () => {
    await game.classicMode.startBattle([SpeciesId.ILLUMISE]);

    game.move.use(move);
    await game.phaseInterceptor.to("MoveEffectPhase", false);

    // Spikes should not have any layers before move effect is applied
    expect(game).not.toHaveArenaTag(hazard, ArenaTagSide.ENEMY);

    await game.toEndOfTurn();

    expect(game).toHaveArenaTag({ tagType: hazard, side: ArenaTagSide.ENEMY, layers: 1 });
    expect(game.field.getEnemyPokemon()).not.toHaveFullHp();
  });

  const maxLayers = hazard === ArenaTagType.SPIKES ? 3 : 1;

  it(`should not fail if ${hazardName} already has max layers (${maxLayers})`, async () => {
    await game.classicMode.startBattle([SpeciesId.ILLUMISE]);

    for (let i = 0; i < maxLayers; i++) {
      game.scene.arena.addTag(hazard, 0, undefined, 0, ArenaTagSide.ENEMY);
    }
    expect(game).toHaveArenaTag({ tagType: hazard, side: ArenaTagSide.ENEMY, layers: maxLayers });

    game.move.use(move);
    await game.toEndOfTurn();

    // Should not have increased due to already being at max layers
    expect(game).toHaveArenaTag({ tagType: hazard, side: ArenaTagSide.ENEMY, layers: maxLayers });
    const illumise = game.field.getPlayerPokemon();
    expect(illumise).toHaveUsedMove({ move, result: MoveResult.SUCCESS });
    expect(game.field.getEnemyPokemon()).not.toHaveFullHp();
  });

  it.runIf(move === MoveId.CEASELESS_EDGE)(
    "should apply 1 layer of spikes per hit when given multiple hits",
    async () => {
      game.override.startingHeldItems([{ name: "MULTI_LENS" }]);
      await game.classicMode.startBattle([SpeciesId.ILLUMISE]);

      game.move.use(MoveId.CEASELESS_EDGE);
      await game.phaseInterceptor.to("MoveEffectPhase");

      // Hit 1
      expect(game).toHaveArenaTag({ tagType: ArenaTagType.SPIKES, side: ArenaTagSide.ENEMY, layers: 1 });

      await game.toEndOfTurn();

      // Hit 2
      expect(game).toHaveArenaTag({ tagType: ArenaTagType.SPIKES, side: ArenaTagSide.ENEMY, layers: 2 });
      expect(game.field.getEnemyPokemon()).not.toHaveFullHp();
    },
  );
});
