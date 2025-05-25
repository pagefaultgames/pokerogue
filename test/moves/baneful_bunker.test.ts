import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import GameManager from "#test/testUtils/gameManager";
import { Species } from "#enums/species";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { BattlerIndex } from "#app/battle";
import { StatusEffect } from "#app/enums/status-effect";

describe("Moves - Baneful Bunker", () => {
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
      .moveset([Moves.SLASH, Moves.FLASH_CANNON])
      .enemySpecies(Species.TOXAPEX)
      .enemyAbility(Abilities.INSOMNIA)
      .enemyMoveset(Moves.BANEFUL_BUNKER)
      .startingLevel(100)
      .enemyLevel(100);
  });

  function expectProtected() {
    expect(game.scene.getEnemyPokemon()?.hp).toBe(game.scene.getEnemyPokemon()?.getMaxHp());
    expect(game.scene.getPlayerPokemon()?.status?.effect).toBe(StatusEffect.POISON);
  }

  it("should protect the user and poison attackers that make contact", async () => {
    await game.classicMode.startBattle([Species.CHARIZARD]);

    game.move.select(Moves.SLASH);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase", false);

    expectProtected();
  });

  it("should ignore accuracy checks", async () => {
    await game.classicMode.startBattle([Species.CHARIZARD]);

    game.move.select(Moves.SLASH);
    await game.phaseInterceptor.to("MoveEndPhase"); // baneful bunker
    await game.move.forceMiss();

    await game.phaseInterceptor.to("BerryPhase", false);

    expectProtected();
  });

  it("should block non-contact moves without poisoning attackers", async () => {
    await game.classicMode.startBattle([Species.CHARIZARD]);

    const charizard = game.scene.getPlayerPokemon()!;
    const toxapex = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.FLASH_CANNON);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(toxapex.hp).toBe(toxapex.getMaxHp());
    expect(charizard.status?.effect).toBeUndefined();
  });
});
