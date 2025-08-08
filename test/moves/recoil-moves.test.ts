import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Recoil Moves", () => {
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
      .enemySpecies(Species.PIDOVE)
      .startingLevel(1)
      .enemyLevel(100)
      .enemyMoveset(Moves.SUBSTITUTE)
      .disableCrits()
      .ability(Abilities.NO_GUARD)
      .enemyAbility(Abilities.BALL_FETCH);
  });

  it.each([
    { moveName: "Double Edge", moveId: Moves.DOUBLE_EDGE },
    { moveName: "Brave Bird", moveId: Moves.BRAVE_BIRD },
    { moveName: "Flare Blitz", moveId: Moves.FLARE_BLITZ },
    { moveName: "Head Charge", moveId: Moves.HEAD_CHARGE },
    { moveName: "Head Smash", moveId: Moves.HEAD_SMASH },
    { moveName: "Light of Ruin", moveId: Moves.LIGHT_OF_RUIN },
    { moveName: "Struggle", moveId: Moves.STRUGGLE },
    { moveName: "Submission", moveId: Moves.SUBMISSION },
    { moveName: "Take Down", moveId: Moves.TAKE_DOWN },
    { moveName: "Volt Tackle", moveId: Moves.VOLT_TACKLE },
    { moveName: "Wave Crash", moveId: Moves.WAVE_CRASH },
    { moveName: "Wild Charge", moveId: Moves.WILD_CHARGE },
    { moveName: "Wood Hammer", moveId: Moves.WOOD_HAMMER },
  ])("$moveName causes recoil damage when hitting a substitute", async ({ moveId }) => {
    game.override.moveset([moveId]);
    await game.classicMode.startBattle([Species.TOGEPI]);

    game.move.select(moveId);
    await game.toNextTurn();

    const playerPokemon = game.scene.getPlayerPokemon()!;
    expect(playerPokemon.hp).toBeLessThan(playerPokemon.getMaxHp());
  });

  it("causes recoil damage when hitting a substitute in a double battle", async () => {
    game.override.battleStyle("double").moveset([Moves.DOUBLE_EDGE]);

    await game.classicMode.startBattle([Species.TOGEPI, Species.TOGEPI]);

    const [playerPokemon1, playerPokemon2] = game.scene.getPlayerField();

    game.move.select(Moves.DOUBLE_EDGE, 0);
    game.move.select(Moves.DOUBLE_EDGE, 1);

    await game.phaseInterceptor.to("TurnEndPhase", false);
    await game.toNextTurn();

    console.log(playerPokemon1.hp);
    console.log(playerPokemon2.hp);

    expect(playerPokemon1.hp).toBeLessThan(playerPokemon1.getMaxHp());
    expect(playerPokemon2.hp).toBeLessThan(playerPokemon2.getMaxHp());
  });
});
