import { allAbilities } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Quick Draw", () => {
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

  it("makes pokemon go first in its priority bracket", async () => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const pokemon = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    pokemon.hp = 1;
    enemy.hp = 1;

    game.move.select(MoveId.TACKLE);
    await game.phaseInterceptor.to("FaintPhase", false);

    expect(pokemon).not.toHaveFainted();
    expect(enemy).toHaveFainted();
    expect(pokemon).toHaveAbilityApplied(AbilityId.QUICK_DRAW);
  });

  it("is not triggered by non damaging moves", async () => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const pokemon = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    pokemon.hp = 1;
    enemy.hp = 1;

    game.move.select(MoveId.TAIL_WHIP);
    await game.phaseInterceptor.to("FaintPhase", false);

    expect(pokemon).toHaveFainted();
    expect(enemy).not.toHaveFainted();
    expect(pokemon).not.toHaveAbilityApplied(AbilityId.QUICK_DRAW);
  });

  it("does not increase priority", async () => {
    game.override.enemyMoveset([MoveId.EXTREME_SPEED]);
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    const pokemon = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();
    pokemon.hp = 1;
    enemy.hp = 1;

    game.move.select(MoveId.TACKLE);
    await game.phaseInterceptor.to("FaintPhase", false);

    expect(pokemon).toHaveFainted();
    expect(enemy).not.toHaveFainted();
    expect(pokemon).toHaveAbilityApplied(AbilityId.QUICK_DRAW);
  });
});
