import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Ability Duplication", () => {
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
      .moveset([MoveId.SPLASH])
      .battleStyle("single")
      .ability(AbilityId.HUGE_POWER)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("huge power should only be applied once if both normal and passive", async () => {
    game.override.passiveAbility(AbilityId.HUGE_POWER);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const [magikarp] = game.scene.getPlayerField();
    const magikarpAttack = magikarp.getEffectiveStat(Stat.ATK);

    magikarp.summonData.abilitySuppressed = true;

    expect(magikarp.getEffectiveStat(Stat.ATK)).toBe(magikarpAttack / 2);
  });

  it("huge power should stack with pure power", async () => {
    game.override.passiveAbility(AbilityId.PURE_POWER);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const [magikarp] = game.scene.getPlayerField();
    const magikarpAttack = magikarp.getEffectiveStat(Stat.ATK);

    magikarp.summonData.abilitySuppressed = true;

    expect(magikarp.getEffectiveStat(Stat.ATK)).toBe(magikarpAttack / 4);
  });
});
