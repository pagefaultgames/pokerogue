import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

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
      .moveset([MoveId.SLASH, MoveId.FLASH_CANNON])
      .enemySpecies(SpeciesId.TOXAPEX)
      .enemyAbility(AbilityId.INSOMNIA)
      .enemyMoveset(MoveId.BANEFUL_BUNKER)
      .startingLevel(100)
      .enemyLevel(100);
  });

  function expectProtected() {
    expect(game.scene.getEnemyPokemon()?.hp).toBe(game.scene.getEnemyPokemon()?.getMaxHp());
    expect(game.scene.getPlayerPokemon()?.status?.effect).toBe(StatusEffect.POISON);
  }

  it("should protect the user and poison attackers that make contact", async () => {
    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    game.move.select(MoveId.SLASH);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase", false);

    expectProtected();
  });

  it("should ignore accuracy checks", async () => {
    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    game.move.select(MoveId.SLASH);
    await game.phaseInterceptor.to("MoveEndPhase"); // baneful bunker
    await game.move.forceMiss();

    await game.phaseInterceptor.to("BerryPhase", false);

    expectProtected();
  });

  it("should block non-contact moves without poisoning attackers", async () => {
    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const charizard = game.field.getPlayerPokemon();
    const toxapex = game.field.getEnemyPokemon();

    game.move.select(MoveId.FLASH_CANNON);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(toxapex.hp).toBe(toxapex.getMaxHp());
    expect(charizard.status?.effect).toBeUndefined();
  });
});
