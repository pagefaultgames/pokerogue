import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Type } from "#enums/type";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Mimicry", () => {
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
      .moveset([ Moves.SPLASH ])
      .ability(Abilities.MIMICRY)
      .battleType("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyMoveset(Moves.SPLASH);
  });

  it("Mimicry activates after the Pokémon with Mimicry is switched in while terrain is present, or whenever there is a change in terrain", async () => {
    game.override.enemyAbility(Abilities.MISTY_SURGE);
    await game.classicMode.startBattle([ Species.FEEBAS, Species.ABRA ]);

    const [ playerPokemon1, playerPokemon2 ] = game.scene.getPlayerParty();
    game.move.select(Moves.SPLASH);
    await game.toNextTurn();
    expect(playerPokemon1.getTypes().includes(Type.FAIRY)).toBe(true);

    game.doSwitchPokemon(1);
    await game.toNextTurn();

    expect(playerPokemon2.getTypes().includes(Type.FAIRY)).toBe(true);
  });

  it("Pokemon should revert back to its original, root type once terrain ends", async () => {
    game.override
      .moveset([ Moves.SPLASH, Moves.TRANSFORM ])
      .enemyAbility(Abilities.MIMICRY)
      .enemyMoveset([ Moves.SPLASH, Moves.PSYCHIC_TERRAIN ]);
    await game.classicMode.startBattle([ Species.REGIELEKI ]);

    const playerPokemon = game.scene.getPlayerPokemon();
    game.move.select(Moves.TRANSFORM);
    await game.forceEnemyMove(Moves.PSYCHIC_TERRAIN);
    await game.toNextTurn();
    expect(playerPokemon?.getTypes().includes(Type.PSYCHIC)).toBe(true);

    if (game.scene.arena.terrain) {
      game.scene.arena.terrain.turnsLeft = 1;
    }

    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.toNextTurn();
    expect(playerPokemon?.getTypes().includes(Type.ELECTRIC)).toBe(true);
  });

  it("If the Pokemon is under the effect of a type-adding move and an equivalent terrain activates, the move's effect disappears", async () => {
    game.override
      .enemyMoveset([ Moves.FORESTS_CURSE, Moves.GRASSY_TERRAIN ]);
    await game.classicMode.startBattle([ Species.FEEBAS ]);

    const playerPokemon = game.scene.getPlayerPokemon();
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.FORESTS_CURSE);
    await game.toNextTurn();

    expect(playerPokemon?.summonData.addedType).toBe(Type.GRASS);

    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.GRASSY_TERRAIN);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(playerPokemon?.summonData.addedType).toBeNull();
    expect(playerPokemon?.getTypes().includes(Type.GRASS)).toBe(true);
  });
});
