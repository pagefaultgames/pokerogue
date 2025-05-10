import { SubstituteTag } from "#app/data/battler-tags";
import { MoveResult } from "#app/field/pokemon";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
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
      .moveset([Moves.SHED_TAIL])
      .battleStyle("single")
      .enemySpecies(Species.SNORLAX)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("transfers a Substitute doll to the switched in Pokemon", async () => {
    await game.classicMode.startBattle([Species.MAGIKARP, Species.FEEBAS]);

    const magikarp = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.SHED_TAIL);
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
    await game.classicMode.startBattle([Species.MAGIKARP]);

    const magikarp = game.scene.getPlayerPokemon()!;
    expect(game.scene.getPlayerParty().length).toBe(1);

    game.move.select(Moves.SHED_TAIL);

    await game.phaseInterceptor.to("TurnEndPhase", false);

    expect(magikarp.isOnField()).toBeTruthy();
    expect(magikarp.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });
});
