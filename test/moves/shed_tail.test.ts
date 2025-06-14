import { SubstituteTag } from "#app/data/battler-tags";
import { MoveResult } from "#enums/move-result";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, it, expect } from "vitest";

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

    const magikarp = game.scene.getPlayerPokemon()!;

    game.move.select(MoveId.SHED_TAIL);
    game.doSelectPartyPokemon(1);

    await game.phaseInterceptor.to("TurnEndPhase", false);

    const feebas = game.scene.getPlayerPokemon()!;
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

    const magikarp = game.scene.getPlayerPokemon()!;
    expect(game.scene.getPlayerParty().length).toBe(1);

    game.move.select(MoveId.SHED_TAIL);

    await game.phaseInterceptor.to("TurnEndPhase", false);

    expect(magikarp.isOnField()).toBeTruthy();
    expect(magikarp.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });
});
