import {
  BattleEndPhase,
  SelectTargetPhase,
  TurnInitPhase,
} from "#app/phases";
import GameManager from "#app/test/utils/gameManager";
import { getMovePosition, } from "#app/test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

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
  it("3v2 edge case", async() => {
    game.override.battleType("double");
    game.override.enemySpecies(Species.SHEDINJA);
    game.override.enemyMoveset([Moves.DESTINY_BOND]);
    game.override.enemyPassiveAbility(Abilities.PRANKSTER);
    game.override.moveset([Moves.AERIAL_ACE]);
    await game.startBattle([
      Species.BULBASAUR,
      Species.CHARIZARD,
      Species.SQUIRTLE,
    ]);
    const enemyToCheck = game.scene.getEnemyField();

    game.doAttack(getMovePosition(game.scene, 0, Moves.AERIAL_ACE));
    await game.phaseInterceptor.to(SelectTargetPhase, false);
    game.doSelectTarget(enemyToCheck[0].getBattlerIndex());

    game.doAttack(getMovePosition(game.scene, 1, Moves.AERIAL_ACE));
    await game.phaseInterceptor.to(SelectTargetPhase, false);
    game.doSelectTarget(enemyToCheck[1].getBattlerIndex());

    await game.phaseInterceptor.to(BattleEndPhase, false);

    // // commented this area since the phases code rn ended the summonphase automatically. Do modification if needed.
    // game.onNextPrompt("SwitchPhase", Mode.PARTY, () => {
    //   game.scene.unshiftPhase(new SwitchSummonPhase(game.scene, 1, 2, false, false));
    //   game.scene.ui.setMode(Mode.MESSAGE);
    // });
    // game.onNextPrompt("SwitchPhase", Mode.MESSAGE, () => {
    //   game.endPhase();
    // });

    game.doSelectModifier();
    game.doRevivePokemon(1);

    await game.phaseInterceptor.to(TurnInitPhase, false);
    expect(game.scene.getPlayerField().filter(p => !p.isFainted()).length).toBe(2);
  }, 200000);
});
