import { AbilityId } from "#enums/ability-id";
import { HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Items - White Herb", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .battleStyle("single")
      .criticalHits(false)
      .ability(AbilityId.BALL_FETCH)
      .startingHeldItems([{ entry: HeldItemId.WHITE_HERB }])
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.CHARM);
  });

  it("should restore all lowered stat stages when one is lowered and be consumed", async () => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    player.setStatStage(Stat.SPATK, -2);

    game.move.use(MoveId.SPLASH);
    await game.toEndOfTurn();

    // Activates reactively to charm, but should reset all negative stat stages
    expect(player).toHaveStatStage(Stat.ATK, 0);
    expect(player).toHaveStatStage(Stat.SPATK, 0);
    expect(player).not.toHaveHeldItem(HeldItemId.WHITE_HERB);
  });

  it("should not activate when no stat stages are lowered", async () => {
    game.override.enemyMoveset(MoveId.SPLASH);

    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();

    game.move.use(MoveId.SPLASH);
    await game.toEndOfTurn();

    expect(player).toHaveHeldItem(HeldItemId.WHITE_HERB);
  });
});
