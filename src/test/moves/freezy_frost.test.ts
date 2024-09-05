import { Stat } from "#enums/stat";
import GameManager from "#test/utils/gameManager";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import { allMoves } from "#app/data/move";
import { TurnInitPhase } from "#app/phases/turn-init-phase";

describe("Moves - Freezy Frost", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({ type: Phaser.HEADLESS });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);

    game.override.battleType("single");

    game.override.enemySpecies(Species.RATTATA);
    game.override.enemyLevel(100);
    game.override.enemyMoveset(SPLASH_ONLY);
    game.override.enemyAbility(Abilities.NONE);

    game.override.startingLevel(100);
    game.override.moveset([Moves.FREEZY_FROST, Moves.SWORDS_DANCE, Moves.CHARM, Moves.SPLASH]);
    vi.spyOn(allMoves[Moves.FREEZY_FROST], "accuracy", "get").mockReturnValue(100);
    game.override.ability(Abilities.NONE);
  });

  it("should clear all stat stage changes", { timeout: 10000 }, async () => {
    await game.startBattle([Species.RATTATA]);
    const user = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    expect(user.getStatStage(Stat.ATK)).toBe(0);
    expect(enemy.getStatStage(Stat.ATK)).toBe(0);

    game.move.select(Moves.SWORDS_DANCE);
    await game.phaseInterceptor.to(TurnInitPhase);

    game.move.select(Moves.CHARM);
    await game.phaseInterceptor.to(TurnInitPhase);
    expect(user.getStatStage(Stat.ATK)).toBe(2);
    expect(enemy.getStatStage(Stat.ATK)).toBe(-2);

    game.move.select(Moves.FREEZY_FROST);
    await game.phaseInterceptor.to(TurnInitPhase);
    expect(user.getStatStage(Stat.ATK)).toBe(0);
    expect(enemy.getStatStage(Stat.ATK)).toBe(0);
  });
});
