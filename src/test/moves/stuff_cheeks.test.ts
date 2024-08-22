import { BattleStat } from "#app/data/battle-stat";
import { BerryType } from "#app/enums/berry-type";
import { StatusEffect } from "#app/enums/status-effect";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Stuff Cheeks", () => {
  describe("integration tests", () => {
    let phaserGame: Phaser.Game;
    let game: GameManager;

    beforeAll(() => {
      phaserGame = new Phaser.Game({ type: Phaser.HEADLESS });
    });

    afterEach(() => {
      game.phaseInterceptor.restoreOg();
    });

    beforeEach(() => {
      game = new GameManager(phaserGame);

      game.override
        .battleType("single")
        .enemyMoveset(SPLASH_ONLY)
        .enemyAbility(Abilities.BALL_FETCH)
        .moveset([Moves.STUFF_CHEEKS, Moves.SPLASH])
        .ability(Abilities.BALL_FETCH);
    });

    it(
      "should consume the user's berry and raise DEF 2 stages",
      async () => {
        game.override
          .startingHeldItems([{name: "BERRY", count: 1, type: BerryType.LUM}])
          .statusEffect(StatusEffect.BURN);

        await game.startBattle();
        const playerPokemon = game.scene.getPlayerPokemon()!;

        // playerPokemon has 1 Lum Berry in its held items
        game.move.select(Moves.STUFF_CHEEKS);
        await game.toNextTurn();

        // Stuff Cheeks should consume the Berry, raise DEF 2 stages, and cure Burn with Lum Berry
        expect(playerPokemon.getHeldItems().length).toBe(0);
        expect(playerPokemon.summonData.battleStats[BattleStat.DEF]).toBe(2);
        expect(playerPokemon.status?.effect).toBeFalsy();
      });

    it(
      "should be cancelled if the user loses its berry before Stuff Cheeks goes off",
      async () => {
        game.override
          .enemySpecies(Species.REGIELEKI)
          .enemyMoveset(Array(4).fill(Moves.BUG_BITE))
          .startingHeldItems([{name: "BERRY", count: 1, type: BerryType.LUM}])
          .statusEffect(StatusEffect.BURN);

        await game.startBattle([Species.SHUCKLE]);
        // Shuckle is slower than Regieleki, so Stuff Cheeks will trigger after Bug Bite (berry is consumed)
        const playerPokemon = game.scene.getPlayerPokemon()!;

        // playerPokemon has 1 Lum Berry in its held items
        game.move.select(Moves.STUFF_CHEEKS);
        await game.toNextTurn();

        // playerPokemon loses its Lum Berry, Stuff Cheeks does not raise defense two stages, and still has Burn status
        expect(playerPokemon.getHeldItems().length).toBe(0);
        expect(playerPokemon.summonData.battleStats[BattleStat.DEF]).toBe(0);
        expect(playerPokemon.status?.effect).toBe(StatusEffect.BURN);
      });
  });
});
