import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Electrify", () => {
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
      .moveset(MoveId.ELECTRIFY)
      .battleStyle("single")
      .startingLevel(100)
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.TACKLE)
      .enemyLevel(100);
  });

  it("should convert attacks to Electric type", async () => {
    await game.classicMode.startBattle([SpeciesId.EXCADRILL]);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();
    vi.spyOn(enemyPokemon, "getMoveType");

    game.move.select(MoveId.ELECTRIFY);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(enemyPokemon.getMoveType).toHaveLastReturnedWith(PokemonType.ELECTRIC);
    expect(playerPokemon.hp).toBe(playerPokemon.getMaxHp());
  });

  it("should override type changes from abilities", async () => {
    game.override.enemyAbility(AbilityId.PIXILATE);

    await game.classicMode.startBattle([SpeciesId.EXCADRILL]);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getPlayerPokemon();
    vi.spyOn(enemyPokemon, "getMoveType");

    game.move.select(MoveId.ELECTRIFY);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(enemyPokemon.getMoveType).toHaveLastReturnedWith(PokemonType.ELECTRIC);
    expect(playerPokemon.hp).toBe(playerPokemon.getMaxHp());
  });
});
