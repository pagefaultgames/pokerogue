import { BattleStat } from "#app/data/battle-stat";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Wind Rider", () => {
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
      .battleType("single")
      .enemySpecies(Species.SHIFTRY)
      .enemyAbility(Abilities.WIND_RIDER)
      .moveset([Moves.TAILWIND, Moves.SPLASH, Moves.PETAL_BLIZZARD, Moves.SANDSTORM])
      .enemyMoveset(SPLASH_ONLY);
  });

  it("takes no damage from wind moves and its Attack is increased by one stage when hit by one", async () => {
    await game.classicMode.startBattle([Species.MAGIKARP]);
    const shiftry = game.scene.getEnemyPokemon()!;

    expect(shiftry.summonData.battleStats[BattleStat.ATK]).toBe(0);

    game.move.select(Moves.PETAL_BLIZZARD);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(shiftry.isFullHp()).toBe(true);
    expect(shiftry.summonData.battleStats[BattleStat.ATK]).toBe(1);
  });

  it("Attack is increased by one stage when Tailwind is present on its side", async () => {
    game.override.ability(Abilities.WIND_RIDER);
    game.override.enemySpecies(Species.MAGIKARP);

    await game.classicMode.startBattle([Species.SHIFTRY]);
    const shiftry = game.scene.getPlayerPokemon()!;

    expect(shiftry.summonData.battleStats[BattleStat.ATK]).toBe(0);

    game.move.select(Moves.TAILWIND);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(shiftry.summonData.battleStats[BattleStat.ATK]).toBe(1);
  });

  it("does not increase Attack when Tailwind is present on opposing side", async () => {
    game.override.ability(Abilities.WIND_RIDER);
    game.override.enemySpecies(Species.MAGIKARP);

    await game.classicMode.startBattle([Species.SHIFTRY]);
    const magikarp = game.scene.getEnemyPokemon()!;
    const shiftry = game.scene.getPlayerPokemon()!;

    expect(shiftry.summonData.battleStats[BattleStat.ATK]).toBe(0);
    expect(magikarp.summonData.battleStats[BattleStat.ATK]).toBe(0);

    game.move.select(Moves.TAILWIND);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(shiftry.summonData.battleStats[BattleStat.ATK]).toBe(1);
    expect(magikarp.summonData.battleStats[BattleStat.ATK]).toBe(0);
  });

  it("does not increase Attack when Tailwind is present on opposing side", async () => {
    game.override
      .enemySpecies(Species.MAGIKARP)
      .ability(Abilities.WIND_RIDER);

    await game.classicMode.startBattle([Species.SHIFTRY]);
    const magikarp = game.scene.getEnemyPokemon()!;
    const shiftry = game.scene.getPlayerPokemon()!;

    expect(shiftry.summonData.battleStats[BattleStat.ATK]).toBe(0);
    expect(magikarp.summonData.battleStats[BattleStat.ATK]).toBe(0);

    game.move.select(Moves.TAILWIND);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(shiftry.summonData.battleStats[BattleStat.ATK]).toBe(1);
    expect(magikarp.summonData.battleStats[BattleStat.ATK]).toBe(0);
  });

  it("does not interact with Sandstorm", async () => {
    game.override.enemySpecies(Species.MAGIKARP);

    await game.classicMode.startBattle([Species.SHIFTRY]);
    const shiftry = game.scene.getPlayerPokemon()!;

    expect(shiftry.summonData.battleStats[BattleStat.ATK]).toBe(0);
    expect(shiftry.isFullHp()).toBe(true);

    game.move.select(Moves.SANDSTORM);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(shiftry.summonData.battleStats[BattleStat.ATK]).toBe(0);
    expect(shiftry.hp).lessThan(shiftry.getMaxHp());
  });
});
