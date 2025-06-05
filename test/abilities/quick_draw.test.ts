import { BypassSpeedChanceAbAttr } from "#app/data/abilities/ability";
import { allAbilities } from "#app/data/data-lists";
import { FaintPhase } from "#app/phases/faint-phase";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
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
    game.override.battleStyle("single");

    game.override.starterSpecies(SpeciesId.MAGIKARP);
    game.override.ability(AbilityId.QUICK_DRAW);
    game.override.moveset([MoveId.TACKLE, MoveId.TAIL_WHIP]);

    game.override.enemyLevel(100);
    game.override.enemySpecies(SpeciesId.MAGIKARP);
    game.override.enemyAbility(AbilityId.BALL_FETCH);
    game.override.enemyMoveset([MoveId.TACKLE]);

    vi.spyOn(allAbilities[AbilityId.QUICK_DRAW].getAttrs(BypassSpeedChanceAbAttr)[0], "chance", "get").mockReturnValue(
      100,
    );
  });

  test("makes pokemon going first in its priority bracket", async () => {
    await game.classicMode.startBattle();

    const pokemon = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    pokemon.hp = 1;
    enemy.hp = 1;

    game.move.select(MoveId.TACKLE);
    await game.phaseInterceptor.to(FaintPhase, false);

    expect(pokemon.isFainted()).toBe(false);
    expect(enemy.isFainted()).toBe(true);
    expect(pokemon.waveData.abilitiesApplied).contain(AbilityId.QUICK_DRAW);
  }, 20000);

  test(
    "does not triggered by non damage moves",
    {
      retry: 5,
    },
    async () => {
      await game.classicMode.startBattle();

      const pokemon = game.scene.getPlayerPokemon()!;
      const enemy = game.scene.getEnemyPokemon()!;

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

    const pokemon = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    pokemon.hp = 1;
    enemy.hp = 1;

    game.move.select(MoveId.TACKLE);
    await game.phaseInterceptor.to(FaintPhase, false);

    expect(pokemon.isFainted()).toBe(true);
    expect(enemy.isFainted()).toBe(false);
    expect(pokemon.waveData.abilitiesApplied).contain(AbilityId.QUICK_DRAW);
  }, 20000);
});
