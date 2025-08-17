import { AbilityId } from "#enums/ability-id";
import { Challenges } from "#enums/challenges";
import { MoveId } from "#enums/move-id";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import { PokeballType } from "#enums/pokeball";
import { SpeciesId } from "#enums/species-id";
import { runMysteryEncounterToEnd } from "#test/mystery-encounter/encounter-test-utils";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Challenges - Limited Catch", () => {
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

    game.challengeMode.addChallenge(Challenges.LIMITED_CATCH, 1, 1);
    game.override
      .battleStyle("single")
      .enemySpecies(SpeciesId.VOLTORB)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingModifier([{ name: "MASTER_BALL", count: 1 }]);
  });

  it("should allow wild Pokémon to be caught on X1 waves", async () => {
    game.override.startingWave(31);
    await game.challengeMode.startBattle([SpeciesId.NUZLEAF]);

    game.doThrowPokeball(PokeballType.MASTER_BALL);
    await game.toEndOfTurn();

    expect(game.scene.getPlayerParty()).toHaveLength(2);
  });

  it("should prevent Pokémon from being caught on non-X1 waves", async () => {
    game.override.startingWave(53);
    await game.challengeMode.startBattle([SpeciesId.NUZLEAF]);

    game.doThrowPokeball(PokeballType.MASTER_BALL);
    await game.toEndOfTurn();

    expect(game.scene.getPlayerParty()).toHaveLength(1);
  });

  it("should allow gift Pokémon from Mystery Encounters to be added to party", async () => {
    game.override
      .mysteryEncounterChance(100)
      .mysteryEncounter(MysteryEncounterType.THE_POKEMON_SALESMAN)
      .startingWave(12);
    game.scene.money = 20000;

    await game.challengeMode.runToSummon([SpeciesId.NUZLEAF]);

    await runMysteryEncounterToEnd(game, 1);

    expect(game.scene.getPlayerParty()).toHaveLength(2);
  });
});
