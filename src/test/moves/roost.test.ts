import { Type } from "#app/data/type.js";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";

const TIMEOUT = 20 * 1000;

describe("Moves - Roost", () => {
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
    game.override.battleType("single");
    game.override.enemySpecies(Species.MAGIKARP);
    game.override.startingLevel(100);
    game.override.enemyLevel(100);
  });

  /**
   * Roost's behavior should be defined as:
   * The pokemon loses its flying type for a turn. If the pokemon was ungroundd solely due to being a flying type, it will be grounded until end of turn.
   *
   * 1. Pure Flying type pokemon -> become normal type until end of turn
   * 2. Dual Flying/X type pokemon -> become type X until end of turn
   * 3. Pokemon that use burn up into roost (ex. Moltres) -> become flying due to burn up, then typeless until end of turn after using roost
   * 4. If a pokemon is afflicted with Forest's Curse or Trick or treat, dual type pokemon will become 3 type pokemon after the flying type is regained
   *    Pure flying types become (Grass or Ghost) and then back to flying/ (Grass or Ghost),
   *    and pokemon post Burn up become ()
   * 5. If a pokemon is also ungrounded due to other reasons (such as levitate), it will stay ungrounded post roost, despite not being flying type.
   * 6. Non flying types using roost (such as dunsparce) are already grounded, so this move will only heal and have no other effects.
   */

  test(
    "Pure flying type -> becomes normal after roost and takes damage from ground moves -> regains flying",
    async () => {
      await game.startBattle([Species.TORNADUS]);
      game.override.moveset([Moves.ROOST]);
      game.move.select(Moves.ROOST);

      const playerPokemon = game.scene.getPlayerPokemon()!;
      game.override.enemyMoveset([Moves.EARTHQUAKE, Moves.EARTHQUAKE, Moves.EARTHQUAKE, Moves.EARTHQUAKE]);
      const playerPokemonStartingHP = playerPokemon.hp;
      await game.phaseInterceptor.to(MoveEffectPhase);

      // Should only be normal type, and NOT flying type
      let playerPokemonTypes = playerPokemon.summonData.types;
      expect(playerPokemon.getTag(BattlerTagType.ROOSTED)).toBeDefined();
      expect(playerPokemonTypes[0] === Type.NORMAL).toBeTruthy();
      expect(playerPokemonTypes[0] === Type.FLYING).toBeFalsy();
      expect(playerPokemon.isGrounded()).toBeTruthy();

      await game.phaseInterceptor.to(TurnEndPhase);

      // Should have lost HP and is now back to being pure flying
      playerPokemonTypes = playerPokemon.summonData.types;
      expect(playerPokemon.hp).toBeLessThan(playerPokemonStartingHP);
      expect(playerPokemonTypes[0] === Type.NORMAL).toBeFalsy();
      expect(playerPokemonTypes[0] === Type.FLYING).toBeTruthy();
      expect(playerPokemon.getTag(BattlerTagType.ROOSTED)).toBeUndefined();
      expect(playerPokemon.isGrounded()).toBeFalsy();

    }, TIMEOUT
  );

  test(
    "Dual X/flying type -> becomes type X after roost and takes damage from ground moves -> regains flying",
    async () => {
      await game.startBattle([Species.HAWLUCHA]);
      game.override.moveset([Moves.ROOST]);
      game.move.select(Moves.ROOST);

      const playerPokemon = game.scene.getPlayerPokemon()!;
      game.override.enemyMoveset([Moves.EARTHQUAKE, Moves.EARTHQUAKE, Moves.EARTHQUAKE, Moves.EARTHQUAKE]);
      const playerPokemonStartingHP = playerPokemon.hp;
      await game.phaseInterceptor.to(MoveEffectPhase);

      // Should only be pure fighting type and grounded
      let playerPokemonTypes = playerPokemon.summonData.types;
      expect(playerPokemon.getTag(BattlerTagType.ROOSTED)).toBeDefined();
      expect(playerPokemonTypes[0] === Type.FIGHTING).toBeTruthy();
      expect(playerPokemonTypes.length === 1).toBeTruthy();
      expect(playerPokemon.isGrounded()).toBeTruthy();

      await game.phaseInterceptor.to(TurnEndPhase);

      // Should have lost HP and is now back to being fighting/flying
      playerPokemonTypes = playerPokemon.summonData.types;
      expect(playerPokemon.hp).toBeLessThan(playerPokemonStartingHP);
      expect(playerPokemonTypes[0] === Type.FIGHTING).toBeTruthy();
      expect(playerPokemonTypes[1] === Type.FLYING).toBeTruthy();
      expect(playerPokemon.getTag(BattlerTagType.ROOSTED)).toBeUndefined();
      expect(playerPokemon.isGrounded()).toBeFalsy();

    }, TIMEOUT
  );

  test(
    "Dual X/flying type with levitate -> becomes type X after roost and does NOT takes damage from ground moves -> regains flying, is always grounded",
    async () => {
      await game.startBattle([Species.ROTOM]);
      //game.override.starterForms({ [Species.ROTOM]: 4 })
      game.override.moveset([Moves.ROOST]);
      game.move.select(Moves.ROOST);


      const playerPokemon = game.scene.getPlayerPokemon()!;
      game.override.enemyMoveset([Moves.EARTHQUAKE, Moves.EARTHQUAKE, Moves.EARTHQUAKE, Moves.EARTHQUAKE]);
      const playerPokemonStartingHP = playerPokemon.hp;

      expect(playerPokemon.summonData.types.length === 0).toBeTruthy();

      await game.phaseInterceptor.to(MoveEffectPhase);

      // Should only be pure electric type and not grounded
      let playerPokemonTypes = playerPokemon.summonData.types;
      console.log("TYPES OF POKEMONZZZ", playerPokemonTypes);

      expect(playerPokemon.getTag(BattlerTagType.ROOSTED)).toBeDefined();
      expect(playerPokemonTypes[0] === Type.ELECTRIC).toBeTruthy();
      expect(playerPokemonTypes.length === 1).toBeTruthy();
      expect(playerPokemon.isGrounded()).toBeFalsy();

      await game.phaseInterceptor.to(TurnEndPhase);

      // Should have same HP and is now back to being electric/flying
      playerPokemonTypes = playerPokemon.summonData.types;
      expect(playerPokemon.hp).toBe(playerPokemonStartingHP);
      expect(playerPokemonTypes[0] === Type.ELECTRIC).toBeTruthy();
      expect(playerPokemonTypes[1] === Type.FLYING).toBeTruthy();
      expect(playerPokemon.getTag(BattlerTagType.ROOSTED)).toBeUndefined();
      expect(playerPokemon.isGrounded()).toBeFalsy();

    }, TIMEOUT
  );
});
