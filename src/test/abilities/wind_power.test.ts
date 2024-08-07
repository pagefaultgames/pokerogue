import { BattlerTagType } from "#app/enums/battler-tag-type.js";
import { TurnEndPhase } from "#app/phases";
import GameManager from "#test/utils/gameManager";
import { getMovePosition } from "#test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SPLASH_ONLY } from "#test/utils/testUtils";

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
    game.override.battleType("single");
    game.override.enemySpecies(Species.SHIFTRY);
    game.override.enemyAbility(Abilities.WIND_POWER);
    game.override.moveset([Moves.TAILWIND, Moves.SPLASH, Moves.PETAL_BLIZZARD, Moves.SANDSTORM]);
    game.override.enemyMoveset(SPLASH_ONLY);
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
    game.override.ability(Abilities.WIND_POWER);
    game.override.enemySpecies(Species.MAGIKARP);

    await game.startBattle([Species.SHIFTRY]);
    const shiftry = game.scene.getPlayerPokemon();

    expect(shiftry.getTag(BattlerTagType.CHARGED)).toBeUndefined();

    game.doAttack(getMovePosition(game.scene, 0, Moves.TAILWIND));
    await game.phaseInterceptor.to(TurnEndPhase);

    expect(shiftry.getTag(BattlerTagType.CHARGED)).toBeDefined();
  });

  it("does not become charged when Tailwind takes effect on opposing side", async () => {
    game.override.enemySpecies(Species.MAGIKARP);
    game.override.ability(Abilities.WIND_POWER);

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
    game.override.enemySpecies(Species.MAGIKARP);

    await game.startBattle([Species.SHIFTRY]);
    const shiftry = game.scene.getPlayerPokemon();

    expect(shiftry.getTag(BattlerTagType.CHARGED)).toBeUndefined();

    game.doAttack(getMovePosition(game.scene, 0, Moves.SANDSTORM));

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(shiftry.getTag(BattlerTagType.CHARGED)).toBeUndefined();
  });
});
