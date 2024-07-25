import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import Overrides from "#app/overrides";
import { Species } from "#enums/species";
import { PostSummonPhase, TurnEndPhase, } from "#app/phases";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";
import { ArenaTagType } from "#app/enums/arena-tag-type.js";

describe("Abilities - Screen Cleaner", () => {
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
    game.override.battleType("single");
    vi.spyOn(Overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.SCREEN_CLEANER);
    game.override.enemySpecies(Species.SHUCKLE);
  });

  it("removes Aurora Veil", async () => {
    vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.HAIL]);
    game.override.enemyMoveset([Moves.AURORA_VEIL, Moves.AURORA_VEIL, Moves.AURORA_VEIL, Moves.AURORA_VEIL]);

    await game.startBattle([Species.MAGIKARP, Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.HAIL));
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.arena.getTag(ArenaTagType.AURORA_VEIL)).toBeDefined();

    await game.toNextTurn();
    game.doSwitchPokemon(1);
    await game.phaseInterceptor.to(PostSummonPhase);

    expect(game.scene.arena.getTag(ArenaTagType.AURORA_VEIL)).toBeUndefined();
  });

  it("removes Light Screen", async () => {
    game.override.enemyMoveset([Moves.LIGHT_SCREEN, Moves.LIGHT_SCREEN, Moves.LIGHT_SCREEN, Moves.LIGHT_SCREEN]);

    await game.startBattle([Species.MAGIKARP, Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.arena.getTag(ArenaTagType.LIGHT_SCREEN)).toBeDefined();

    await game.toNextTurn();
    game.doSwitchPokemon(1);
    await game.phaseInterceptor.to(PostSummonPhase);

    expect(game.scene.arena.getTag(ArenaTagType.LIGHT_SCREEN)).toBeUndefined();
  });

  it("removes Reflect", async () => {
    game.override.enemyMoveset([Moves.REFLECT, Moves.REFLECT, Moves.REFLECT, Moves.REFLECT]);

    await game.startBattle([Species.MAGIKARP, Species.MAGIKARP]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.arena.getTag(ArenaTagType.REFLECT)).toBeDefined();

    await game.toNextTurn();
    game.doSwitchPokemon(1);
    await game.phaseInterceptor.to(PostSummonPhase);

    expect(game.scene.arena.getTag(ArenaTagType.REFLECT)).toBeUndefined();
  });
});
