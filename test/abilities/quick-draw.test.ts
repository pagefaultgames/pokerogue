import { allAbilities } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { FaintPhase } from "#phases/faint-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

describe("Abilities - Quick Draw", () => {
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
      .starterSpecies(SpeciesId.MAGIKARP)
      .ability(AbilityId.QUICK_DRAW)
      .moveset([MoveId.TACKLE, MoveId.TAIL_WHIP])
      .enemyLevel(100)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset([MoveId.TACKLE]);

    vi.spyOn(
      allAbilities[AbilityId.QUICK_DRAW].getAttrs("BypassSpeedChanceAbAttr")[0],
      "chance",
      "get",
    ).mockReturnValue(100);
  });

  test("makes pokemon going first in its priority bracket", async () => {
    await game.classicMode.startBattle();

    const pokemon = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    pokemon.hp = 1;
    enemy.hp = 1;

    game.move.select(MoveId.TACKLE);
    await game.phaseInterceptor.to(FaintPhase, false);

    expect(pokemon.isFainted()).toBe(false);
    expect(enemy.isFainted()).toBe(true);
    expect(pokemon.waveData.abilitiesApplied).toContain(AbilityId.QUICK_DRAW);
  });

  test(
    "does not triggered by non damage moves",
    {
      retry: 5,
    },
    async () => {
      await game.classicMode.startBattle();

      const pokemon = game.field.getPlayerPokemon();
      const enemy = game.field.getEnemyPokemon();

      pokemon.hp = 1;
      enemy.hp = 1;

      game.move.select(MoveId.TAIL_WHIP);
      await game.phaseInterceptor.to(FaintPhase, false);

      expect(pokemon.isFainted()).toBe(true);
      expect(enemy.isFainted()).toBe(false);
      expect(pokemon.waveData.abilitiesApplied).not.contain(AbilityId.QUICK_DRAW);
    },
  );

  test("does not increase priority", async () => {
    game.override.enemyMoveset([MoveId.EXTREME_SPEED]);

    await game.classicMode.startBattle();

    const pokemon = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    pokemon.hp = 1;
    enemy.hp = 1;

    game.move.select(MoveId.TACKLE);
    await game.phaseInterceptor.to(FaintPhase, false);

    expect(pokemon.isFainted()).toBe(true);
    expect(enemy.isFainted()).toBe(false);
    expect(pokemon.waveData.abilitiesApplied).toContain(AbilityId.QUICK_DRAW);
  });
});
