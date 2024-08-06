import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import Phaser from "phaser";
import GameManager from "#test/utils/gameManager";
import { getMovePosition } from "#test/utils/gameManagerUtils";
import { Species } from "#enums/species";
import { Moves } from "#enums/moves";
import { Abilities } from "#enums/abilities";

describe("Moves - Fusion Bolt", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  const fusionBolt = Moves.FUSION_BOLT;

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
    game.override.moveset([ fusionBolt ]);
    game.override.startingLevel(1);

    game.override.enemySpecies(Species.RESHIRAM);
    game.override.enemyAbility(Abilities.ROUGH_SKIN);
    game.override.enemyMoveset([ Moves.SPLASH, Moves.SPLASH, Moves.SPLASH, Moves.SPLASH ]);

    game.override.battleType("single");
    game.override.startingWave(97);
    game.override.disableCrits();
  });

  it("should not make contact", async() => {
    await game.startBattle([
      Species.ZEKROM,
    ]);

    const partyMember = game.scene.getPlayerPokemon();
    const initialHp = partyMember.hp;

    game.doAttack(getMovePosition(game.scene, 0, fusionBolt));

    await game.toNextTurn();

    expect(initialHp - partyMember.hp).toBe(0);
  }, 20000);
});
