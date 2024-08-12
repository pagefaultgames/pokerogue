import { Abilities } from "#app/enums/abilities";
import GameManager from "#test/utils/gameManager";
import { getMovePosition } from "#test/utils/gameManagerUtils";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { BattlerIndex } from "#app/battle.js";
import { BattlerTagType } from "#app/enums/battler-tag-type.js";
import { BerryPhase } from "#app/phases.js";

const TIMEOUT = 20 * 1000;

describe("Moves - Alluring Voice", () => {
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
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.ICE_SCALES)
      .enemyMoveset(Array(4).fill(Moves.HOWL))
      .startingLevel(10)
      .enemyLevel(10)
      .starterSpecies(Species.FEEBAS)
      .ability(Abilities.BALL_FETCH)
      .moveset([Moves.ALLURING_VOICE]);

  });

  it("should confuse the opponent if their stats were raised", async () => {
    await game.startBattle();

    const enemy = game.scene.getEnemyPokemon()!;

    game.doAttack(getMovePosition(game.scene, 0, Moves.ALLURING_VOICE));
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to(BerryPhase);
    console.log(enemy.getTag(BattlerTagType.CONFUSED));

    expect(enemy.getTag(BattlerTagType.CONFUSED)?.tagType).toBe("CONFUSED");
  }, TIMEOUT);
});
