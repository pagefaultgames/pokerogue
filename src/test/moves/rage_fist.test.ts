import { BattlerIndex } from "#app/battle";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { allMoves } from "#app/data/move";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Rage Fist", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  const move = allMoves[Moves.RAGE_FIST];

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
      .battleType("single")
      .moveset([ Moves.RAGE_FIST, Moves.SPLASH, Moves.SUBSTITUTE ])
      .startingLevel(100)
      .enemyLevel(1)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.DOUBLE_KICK);

    vi.spyOn(move, "calculateBattlePower");
  });

  it("should have 100 more power if hit twice before calling Rage Fist", async () => {
    game.override
      .enemySpecies(Species.MAGIKARP);

    await game.classicMode.startBattle([ Species.MAGIKARP ]);

    game.move.select(Moves.RAGE_FIST);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(move.calculateBattlePower).toHaveLastReturnedWith(150);
  });

  it("should maintain its power during next battle if it is within the same arena encounter", async () => {
    game.override
      .enemySpecies(Species.MAGIKARP)
      .startingWave(1);

    await game.classicMode.startBattle([ Species.MAGIKARP ]);

    game.move.select(Moves.RAGE_FIST);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.toNextWave();

    game.move.select(Moves.RAGE_FIST);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(move.calculateBattlePower).toHaveLastReturnedWith(250);
  });

  it("should reset the hitRecCounter if we enter new trainer battle", async () => {
    game.override
      .enemySpecies(Species.MAGIKARP)
      .startingWave(4);

    await game.classicMode.startBattle([ Species.MAGIKARP ]);

    game.move.select(Moves.RAGE_FIST);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.toNextWave();

    game.move.select(Moves.RAGE_FIST);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(move.calculateBattlePower).toHaveLastReturnedWith(150);
  });

  it("should not increase the hitCounter if Substitute is hit", async () => {
    game.override
      .enemySpecies(Species.MAGIKARP)
      .startingWave(4);

    await game.classicMode.startBattle([ Species.MAGIKARP ]);

    game.move.select(Moves.SUBSTITUTE);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(game.scene.getPlayerPokemon()?.customPokemonData.hitsRecCount).toBe(0);
  });

  //For some unknown reason the second Rage fist is not called. This might be due to entering a new biome
  it.todo("should reset the hitRecCounter if we enter new biome", async () => {
    game.override
      .enemySpecies(Species.MAGIKARP)
      .startingWave(10);

    await game.classicMode.startBattle([ Species.MAGIKARP ]);

    game.move.select(Moves.RAGE_FIST);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.toNextTurn();

    game.move.select(Moves.RAGE_FIST);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.phaseInterceptor.to("BerryPhase", false);

    expect(move.calculateBattlePower).toHaveLastReturnedWith(150);
  });

  //Test does not work correctly. Feel free to add changes if you can make it work
  it.todo("should not reset the hitRecCounter if switched out", async () => {
    game.override
      .enemySpecies(Species.MAGIKARP)
      .startingWave(1);

    await game.classicMode.startBattle([ Species.CHARIZARD, Species.BLASTOISE ]);

    game.move.select(Moves.RAGE_FIST);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    game.doSelectPartyPokemon(1);
    await game.toNextWave();

    game.move.select(Moves.RAGE_FIST);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    game.doSelectPartyPokemon(0);
    await game.phaseInterceptor.to("CommandPhase");

    expect(move.calculateBattlePower).toHaveLastReturnedWith(150);
    expect(game.scene.getPlayerParty()[0].species.speciesId).toBe(Species.CHARIZARD);
  });
});
