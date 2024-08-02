import {
  BattleEndPhase,
  TurnInitPhase,
} from "#app/phases";
import GameManager from "#app/test/utils/gameManager";
import { getMovePosition, } from "#app/test/utils/gameManagerUtils";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SPLASH_ONLY } from "../utils/testUtils";
import { Status, StatusEffect } from "#app/data/status-effect.js";

describe("Test Battle Phase", () => {
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
  });

  // double-battle player's pokemon both fainted in same round, then revive one, and next double battle summons two player's pokemon successfully.
  // (There were bugs that either only summon one when can summon two, player stuck in switchPhase etc)
  it("3v2 edge case: player summons 2 pokemon on the next battle after being fainted and revived", async() => {
    game.override.battleType("double");
    game.override.enemyMoveset(SPLASH_ONLY);
    game.override.moveset(SPLASH_ONLY);
    await game.startBattle([
      Species.BULBASAUR,
      Species.CHARIZARD,
      Species.SQUIRTLE,
    ]);

    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
    game.doAttack(getMovePosition(game.scene, 1, Moves.SPLASH));

    const pokemon1 = game.scene.getParty()[0];
    expect(pokemon1).not.toBe(undefined);

    pokemon1.hp = 0;
    pokemon1.status = new Status(StatusEffect.FAINT);
    expect(pokemon1.isFainted()).toBe(true);

    const pokemon2 = game.scene.getParty()[1];
    expect(pokemon2).not.toBe(undefined);

    pokemon2.hp = 0;
    pokemon2.status = new Status(StatusEffect.FAINT);
    expect(pokemon2.isFainted()).toBe(true);

    await game.doKillOpponents();

    await game.phaseInterceptor.to(BattleEndPhase);
    game.doSelectModifier();
    game.doRevivePokemon(1);
    await game.phaseInterceptor.to(TurnInitPhase);
    expect(game.scene.getPlayerField().filter(p => !p.isFainted()).length).toBe(2);
  }, 20000);
});
