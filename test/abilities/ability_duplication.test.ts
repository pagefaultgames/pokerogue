import { Stat } from "#app/enums/stat";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, it, expect } from "vitest";

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
      .moveset([ Moves.SPLASH ])
      .battleType("single")
      .ability(Abilities.HUGE_POWER)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("huge power should only be applied once if both normal and passive", async () => {
    game.override.passiveAbility(Abilities.HUGE_POWER);

    await game.classicMode.startBattle([ Species.MAGIKARP ]);

    const [ magikarp ] = game.scene.getPlayerField();
    const magikarpAttack = magikarp.getEffectiveStat(Stat.ATK);

    magikarp.summonData.abilitySuppressed = true;

    expect(magikarp.getEffectiveStat(Stat.ATK)).toBe(magikarpAttack / 2);
  });

  it("huge power should stack with pure power", async () => {
    game.override.passiveAbility(Abilities.PURE_POWER);

    await game.classicMode.startBattle([ Species.MAGIKARP ]);

    const [ magikarp ] = game.scene.getPlayerField();
    const magikarpAttack = magikarp.getEffectiveStat(Stat.ATK);

    magikarp.summonData.abilitySuppressed = true;

    expect(magikarp.getEffectiveStat(Stat.ATK)).toBe(magikarpAttack / 4);
  });
});
