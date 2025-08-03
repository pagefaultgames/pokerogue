import { getPokemonNameWithAffix } from "#app/messages";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import i18next from "i18next";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Ability - Truant", () => {
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
      .criticalHits(false)
      .moveset([MoveId.SPLASH, MoveId.TACKLE])
      .ability(AbilityId.TRUANT)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should loaf around and prevent using moves every other turn", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    // Turn 1: Splash succeeds
    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    expect(player.getLastXMoves(1)[0]).toEqual(
      expect.objectContaining({ move: MoveId.SPLASH, result: MoveResult.SUCCESS }),
    );

    // Turn 2: Truant activates, cancelling tackle and displaying message
    game.move.select(MoveId.TACKLE);
    await game.toNextTurn();

    expect(player.getLastXMoves(1)[0]).toEqual(expect.objectContaining({ move: MoveId.NONE, result: MoveResult.FAIL }));
    expect(enemy.hp).toBe(enemy.getMaxHp());
    expect(game.textInterceptor.logs).toContain(
      i18next.t("battlerTags:truantLapse", {
        pokemonNameWithAffix: getPokemonNameWithAffix(player),
      }),
    );

    // Turn 3: Truant didn't activate, tackle worked
    game.move.select(MoveId.TACKLE);
    await game.toNextTurn();

    expect(player.getLastXMoves(1)[0]).toEqual(
      expect.objectContaining({ move: MoveId.TACKLE, result: MoveResult.SUCCESS }),
    );
    expect(enemy.hp).toBeLessThan(enemy.getMaxHp());
  });
});
