import { getPokemonNameWithAffix } from "#app/messages";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import i18next from "i18next";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Move - Laser Focus", () => {
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
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should make the user's next attack a guaranteed critical hit", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(MoveId.LASER_FOCUS);
    await game.toNextTurn();

    const feebas = game.field.getPlayerPokemon();
    expect(feebas).toHaveBattlerTag(BattlerTagType.ALWAYS_CRIT);
    expect(game).toHaveShownMessage(
      i18next.t("battlerTags:laserFocusOnAdd", {
        pokemonNameWithAffix: getPokemonNameWithAffix(feebas),
      }),
    );

    const enemy = game.field.getEnemyPokemon();
    const critSpy = vi.spyOn(enemy, "getCriticalHitResult");

    game.move.use(MoveId.TACKLE);
    await game.toEndOfTurn();

    expect(critSpy).toHaveLastReturnedWith(true);
  });

  it("should disappear at the end of the next turn", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const feebas = game.field.getPlayerPokemon();

    game.move.use(MoveId.LASER_FOCUS);
    await game.toNextTurn();

    expect(feebas).toHaveBattlerTag(BattlerTagType.ALWAYS_CRIT);

    game.move.use(MoveId.SPLASH);
    await game.toNextTurn();

    expect(feebas).not.toHaveBattlerTag(BattlerTagType.ALWAYS_CRIT);

    const enemy = game.field.getEnemyPokemon();
    const critSpy = vi.spyOn(enemy, "getCriticalHitResult");

    game.move.use(MoveId.TACKLE);
    await game.toEndOfTurn();

    expect(critSpy).toHaveLastReturnedWith(false);
  });

  it("should boost all attacks until the end of the next turn", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(MoveId.LASER_FOCUS);
    await game.toNextTurn();

    const enemy = game.field.getEnemyPokemon();
    const critSpy = vi.spyOn(enemy, "getCriticalHitResult");

    game.move.use(MoveId.TACKLE);
    await game.move.forceEnemyMove(MoveId.INSTRUCT);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toEndOfTurn();

    expect(critSpy).toHaveReturnedTimes(2);
    expect(critSpy).toHaveNthReturnedWith(1, true);
    expect(critSpy).toHaveNthReturnedWith(2, true);
  });
});
