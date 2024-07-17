import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import overrides from "#app/overrides";
import { Species } from "#enums/species";
import {
  TurnEndPhase,
} from "#app/phases";
import { Moves } from "#enums/moves";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";
import { BattleStat } from "#app/data/battle-stat.js";

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
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.SHIFTRY);
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.WIND_RIDER);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TAILWIND, Moves.SPLASH, Moves.PETAL_BLIZZARD, Moves.SANDSTORM]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
  });

  it("takes no damage from wind moves and its Attack is increased by one stage when hit by one", async () => {
    await game.startBattle([Species.MAGIKARP]);
    const shiftry = game.scene.getEnemyPokemon();

    expect(shiftry.summonData.battleStats[BattleStat.ATK]).toBe(0);

    game.doAttack(getMovePosition(game.scene, 0, Moves.PETAL_BLIZZARD));

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(shiftry.hp).equals(shiftry.getMaxHp());
    expect(shiftry.summonData.battleStats[BattleStat.ATK]).toBe(1);
  });

  it("Attack is increased by one stage when Tailwind is present on its side", async () => {
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.WIND_RIDER);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.MAGIKARP);

    await game.startBattle([Species.SHIFTRY]);
    const shiftry = game.scene.getPlayerPokemon();

    expect(shiftry.summonData.battleStats[BattleStat.ATK]).toBe(0);

    game.doAttack(getMovePosition(game.scene, 0, Moves.TAILWIND));

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(shiftry.summonData.battleStats[BattleStat.ATK]).toBe(1);
  });

  it("does not increase Attack when Tailwind is present on opposing side", async () => {
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.WIND_RIDER);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.MAGIKARP);

    await game.startBattle([Species.SHIFTRY]);
    const magikarp = game.scene.getEnemyPokemon();
    const shiftry = game.scene.getPlayerPokemon();

    expect(shiftry.summonData.battleStats[BattleStat.ATK]).toBe(0);
    expect(magikarp.summonData.battleStats[BattleStat.ATK]).toBe(0);

    game.doAttack(getMovePosition(game.scene, 0, Moves.TAILWIND));

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(shiftry.summonData.battleStats[BattleStat.ATK]).toBe(1);
    expect(magikarp.summonData.battleStats[BattleStat.ATK]).toBe(0);
  });

  it("does not increase Attack when Tailwind is present on opposing side", async () => {
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.MAGIKARP);

    await game.startBattle([Species.SHIFTRY]);
    const magikarp = game.scene.getEnemyPokemon();
    const shiftry = game.scene.getPlayerPokemon();

    expect(shiftry.summonData.battleStats[BattleStat.ATK]).toBe(0);
    expect(magikarp.summonData.battleStats[BattleStat.ATK]).toBe(0);

    game.doAttack(getMovePosition(game.scene, 0, Moves.TAILWIND));

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(shiftry.summonData.battleStats[BattleStat.ATK]).toBe(1);
    expect(magikarp.summonData.battleStats[BattleStat.ATK]).toBe(0);
  });

  it("does not interact with Sandstorm", async () => {
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.MAGIKARP);

    await game.startBattle([Species.SHIFTRY]);
    const shiftry = game.scene.getPlayerPokemon();

    expect(shiftry.summonData.battleStats[BattleStat.ATK]).toBe(0);
    expect(shiftry.hp).equals(shiftry.getMaxHp());

    game.doAttack(getMovePosition(game.scene, 0, Moves.SANDSTORM));

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(shiftry.summonData.battleStats[BattleStat.ATK]).toBe(0);
    expect(shiftry.hp).lessThan(shiftry.getMaxHp());
  });
});
