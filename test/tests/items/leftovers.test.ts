import { AbilityId } from "#enums/ability-id";
import { HeldItemId } from "#enums/held-item-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import { toDmgValue } from "#utils/common";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Items - Leftovers", () => {
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
      .startingHeldItems([{ entry: HeldItemId.LEFTOVERS }])
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100);
  });

  it.each([1, 2])("should heal max HP/16 x %d at the end of each turn", async count => {
    game.override.startingHeldItems([{ entry: HeldItemId.LEFTOVERS, count }]);
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    const expectedHeal = toDmgValue(player.getMaxHp() / 16) * count;
    player.hp -= expectedHeal * 3; // leave room to observe healing

    game.move.use(MoveId.SPLASH);
    game.phaseInterceptor.clearLogs();
    await game.toNextTurn();

    expect(game.phaseInterceptor.log).toContain("PokemonHealPhase");
    expect(player.hp).toBe(player.getMaxHp() - expectedHeal * 2);
  });

  it("should not queue a heal phase when at full HP", async () => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const player = game.field.getPlayerPokemon();
    expect(player.isFullHp()).toBe(true);

    game.move.use(MoveId.SPLASH);
    game.phaseInterceptor.clearLogs();
    await game.toEndOfTurn();
    await game.phaseInterceptor.to("CommandPhase", false);

    expect(game.phaseInterceptor.log).not.toContain("PokemonHealPhase");
    expect(player.hp).toBe(player.getMaxHp());
    expect(player).toHaveHeldItem(HeldItemId.LEFTOVERS);
  });
});
