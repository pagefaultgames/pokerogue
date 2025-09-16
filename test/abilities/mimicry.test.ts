import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
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
      .moveset([MoveId.SPLASH])
      .ability(AbilityId.MIMICRY)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("Mimicry activates after the Pokémon with Mimicry is switched in while terrain is present, or whenever there is a change in terrain", async () => {
    game.override.enemyAbility(AbilityId.MISTY_SURGE);
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.ABRA]);

    const [playerPokemon1, playerPokemon2] = game.scene.getPlayerParty();
    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();
    expect(playerPokemon1.getTypes().includes(PokemonType.FAIRY)).toBe(true);

    game.doSwitchPokemon(1);
    await game.toNextTurn();

    expect(playerPokemon2.getTypes().includes(PokemonType.FAIRY)).toBe(true);
  });

  it("Pokemon should revert back to its original, root type once terrain ends", async () => {
    game.override.enemyAbility(AbilityId.MIMICRY);
    await game.classicMode.startBattle([SpeciesId.REGIELEKI]);

    const playerPokemon = game.field.getPlayerPokemon();

    game.move.use(MoveId.SKILL_SWAP);
    await game.move.forceEnemyMove(MoveId.PSYCHIC_TERRAIN);
    await game.toNextTurn();

    expect(playerPokemon.getTypes()).toEqual([PokemonType.PSYCHIC]);

    if (game.scene.arena.terrain) {
      game.scene.arena.terrain.turnsLeft = 1;
    }

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    expect(playerPokemon.getTypes()).toEqual([PokemonType.ELECTRIC]);
  });

  it("If the Pokemon is under the effect of a type-adding move and an equivalent terrain activates, the move's effect disappears", async () => {
    game.override.enemyMoveset([MoveId.FORESTS_CURSE, MoveId.GRASSY_TERRAIN]);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    const playerPokemon = game.field.getPlayerPokemon();
    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.FORESTS_CURSE);
    await game.toNextTurn();

    expect(playerPokemon.summonData.addedType).toBe(PokemonType.GRASS);

    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.GRASSY_TERRAIN);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(playerPokemon.summonData.addedType).toBeNull();
    expect(playerPokemon.getTypes()).toEqual([PokemonType.GRASS]);
  });
});
