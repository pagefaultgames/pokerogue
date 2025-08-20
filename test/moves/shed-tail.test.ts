import { SubstituteTag } from "#data/battler-tags";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Shed Tail", () => {
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
      .moveset([MoveId.SHED_TAIL])
      .battleStyle("single")
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("transfers a Substitute doll to the switched in Pokemon", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS]);

    const magikarp = game.field.getPlayerPokemon();

    game.move.select(MoveId.SHED_TAIL);
    game.doSelectPartyPokemon(1);

    await game.phaseInterceptor.to("TurnEndPhase", false);

    const feebas = game.field.getPlayerPokemon();
    const substituteTag = feebas.getTag(SubstituteTag);

    expect(feebas).not.toBe(magikarp);
    expect(feebas.hp).toBe(feebas.getMaxHp());
    // Note: Altered the test to be consistent with the correct HP cost :yipeevee_static:
    expect(magikarp.hp).toBe(Math.floor(magikarp.getMaxHp() / 2));
    expect(substituteTag).toBeDefined();
    expect(substituteTag?.hp).toBe(Math.floor(magikarp.getMaxHp() / 4));
  });

  it("should fail if no ally is available to switch in", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const magikarp = game.field.getPlayerPokemon();
    expect(game.scene.getPlayerParty().length).toBe(1);

    game.move.select(MoveId.SHED_TAIL);

    await game.phaseInterceptor.to("TurnEndPhase", false);

    expect(magikarp.isOnField()).toBeTruthy();
    expect(magikarp.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });
});
