import { Abilities } from "#enums/abilities";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Own Tempo", () => {
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
      .moveset([Moves.SPLASH])
      .ability(Abilities.BALL_FETCH)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should remove confusion when gained", async () => {
    game.override
      .ability(Abilities.OWN_TEMPO)
      .enemyAbility(Abilities.BALL_FETCH)
      .moveset(Moves.SKILL_SWAP)
      .enemyMoveset(Moves.SPLASH);
    await game.classicMode.startBattle([Species.FEEBAS]);
    const enemy = game.scene.getEnemyPokemon();
    enemy?.addTag(BattlerTagType.CONFUSED);
    expect(enemy?.getTag(BattlerTagType.CONFUSED)).toBeTruthy();

    game.move.select(Moves.SKILL_SWAP);
    await game.phaseInterceptor.to("BerryPhase");

    expect(enemy?.getTag(BattlerTagType.CONFUSED)).toBeFalsy();
  });
});
