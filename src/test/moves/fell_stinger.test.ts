import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import GameManager from "../utils/gameManager";
import { Species } from "#enums/species";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#app/enums/status-effect";
import { WeatherType } from "#app/enums/weather-type";


describe("Moves - Fell Stinger", () => {
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

    game.override.battleType("single")
      .moveset([ Moves.FELL_STINGER ])
      .startingLevel(50);

    game.override.enemyAbility(Abilities.STURDY)
      .enemySpecies(Species.HYPNO)
      .enemyLevel(5)
      .enemyHeldItems([]);

    game.override.weather(WeatherType.NONE);
  });

  it("should not grant stat boost when opponent gets KO'd by recoil", async () => {
    game.override.enemyMoveset([ Moves.DOUBLE_EDGE ]);
    await game.classicMode.startBattle([ Species.LEAVANNY ]);

    const leadPokemon = game.scene.getPlayerPokemon()!;
    game.move.select(Moves.FELL_STINGER);

    await game.phaseInterceptor.to("VictoryPhase");

    expect(leadPokemon.getStatStage(Stat.ATK) === 0); // Attack stage should still be at 0
  });

  it("should not grant stat boost when enemy is KO'd by status effect", async () => {
    game.override
      .enemyMoveset(Moves.SPLASH)
      .enemyStatusEffect(StatusEffect.BURN);
    await game.classicMode.startBattle([ Species.LEAVANNY ]);

    const leadPokemon = game.scene.getPlayerPokemon()!;
    game.move.select(Moves.FELL_STINGER);

    await game.phaseInterceptor.to("VictoryPhase");

    expect(leadPokemon.getStatStage(Stat.ATK) === 0); // Attack stage should still be at 0
  });

  it("should not grant stat boost when enemy is KO'd by damaging weather", async () => {
    game.override.weather(WeatherType.HAIL);
    await game.classicMode.startBattle([ Species.LEAVANNY ]);

    const leadPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.FELL_STINGER);

    await game.phaseInterceptor.to("VictoryPhase");

    expect(leadPokemon.getStatStage(Stat.ATK) === 0); // Attack stage should still be at 0
  });

  it("should not grant stat boost when enemy is KO'd by Dry Skin + Harsh Sunlight", async () => {
    game.override
      .enemyPassiveAbility(Abilities.STURDY)
      .enemyAbility(Abilities.DRY_SKIN)
      .weather(WeatherType.HARSH_SUN);
    await game.challengeMode.startBattle([ Species.LEAVANNY ]);

    const leadPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.FELL_STINGER);

    await game.phaseInterceptor.to("VictoryPhase");

    expect(leadPokemon.getStatStage(Stat.ATK) === 0); // Attack stage should still be at 0
  });

  it("should not grant stat boost if enemy is saved by Reviver Seed", async () => {
    game.override
      .enemyAbility(Abilities.KLUTZ)
      .enemyHeldItems([{ name: "REVIVER_SEED" }]);

    await game.classicMode.startBattle([ Species.LEAVANNY ]);

    const leadPokemon = game.scene.getPlayerPokemon()!;
    game.move.select(Moves.FELL_STINGER);

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(leadPokemon.getStatStage(Stat.ATK) === 0); // Attack stage should still be at 0
  });

  it("should grant stat boost when enemy dies directly to hit", async () => {
    game.override.enemyAbility(Abilities.KLUTZ);
    await game.challengeMode.startBattle([ Species.LEAVANNY ]);

    const leadPokemon = game.scene.getPlayerPokemon()!;
    game.move.select(Moves.FELL_STINGER);

    await game.phaseInterceptor.to("VictoryPhase");

    expect(leadPokemon.getStatStage(Stat.ATK) === 3); // Attack stage should have risen to 3
  });
});
