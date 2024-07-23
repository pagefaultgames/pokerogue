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
import { BattlerTagType } from "#app/enums/battler-tag-type.js";

describe("Abilities - Wind Power", () => {
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
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.WIND_POWER);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TAILWIND, Moves.SPLASH, Moves.PETAL_BLIZZARD, Moves.SANDSTORM]);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH]);
  });

  it("it becomes charged when hit by wind moves", async () => {
    await game.startBattle([Species.MAGIKARP]);
    const shiftry = game.scene.getEnemyPokemon();

    expect(shiftry.getTag(BattlerTagType.CHARGED)).toBeUndefined();

    game.doAttack(getMovePosition(game.scene, 0, Moves.PETAL_BLIZZARD));
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(shiftry.getTag(BattlerTagType.CHARGED)).toBeDefined();
  });

  it("it becomes charged when Tailwind takes effect on its side", async () => {
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.WIND_POWER);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.MAGIKARP);

    await game.startBattle([Species.SHIFTRY]);
    const shiftry = game.scene.getPlayerPokemon();

    expect(shiftry.getTag(BattlerTagType.CHARGED)).toBeUndefined();

    game.doAttack(getMovePosition(game.scene, 0, Moves.TAILWIND));
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(shiftry.getTag(BattlerTagType.CHARGED)).toBeDefined();
  });

  it("does not become charged when Tailwind takes effect on opposing side", async () => {
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.MAGIKARP);
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.WIND_POWER);

    await game.startBattle([Species.SHIFTRY]);
    const magikarp = game.scene.getEnemyPokemon();
    const shiftry = game.scene.getPlayerPokemon();

    expect(shiftry.getTag(BattlerTagType.CHARGED)).toBeUndefined();
    expect(magikarp.getTag(BattlerTagType.CHARGED)).toBeUndefined();

    game.doAttack(getMovePosition(game.scene, 0, Moves.TAILWIND));

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(shiftry.getTag(BattlerTagType.CHARGED)).toBeDefined();
    expect(magikarp.getTag(BattlerTagType.CHARGED)).toBeUndefined();
  });

  it("does not interact with Sandstorm", async () => {
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.MAGIKARP);

    await game.startBattle([Species.SHIFTRY]);
    const shiftry = game.scene.getPlayerPokemon();

    expect(shiftry.getTag(BattlerTagType.CHARGED)).toBeUndefined();

    game.doAttack(getMovePosition(game.scene, 0, Moves.SANDSTORM));

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(shiftry.getTag(BattlerTagType.CHARGED)).toBeUndefined();
  });
});
