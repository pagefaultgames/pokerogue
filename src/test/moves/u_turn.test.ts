import { Abilities } from "#app/enums/abilities.js";
import {
  SwitchPhase,
} from "#app/phases";
import i18next, { initI18n } from "#app/plugins/i18n.js";
import GameManager from "#app/test/utils/gameManager";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import * as Utils from "#app/utils";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { StatusEffect } from "#app/enums/status-effect.js";


describe("Moves - U-turn", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  function getActivePokemon() {
    return game.scene.getParty()[0];
  }

  beforeAll(() => {
    initI18n();
    i18next.changeLanguage("en");
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    const moveToUse = Moves.U_TURN;
    game.override.battleType("single");
    game.override.enemySpecies(Species.GENGAR);
    game.override.startingLevel(90);
    game.override.startingWave(97);
    game.override.moveset([moveToUse, Moves.SPLASH]);
    game.override.enemyMoveset(new Array(4).fill(Moves.ICE_BEAM));
    game.override.disableCrits();
  });

  it("triggers regenerator a single time when a regenerator user switches out with u-turn", async() => {
    // arrange
    game.override.ability(Abilities.REGENERATOR);
    await game.startBattle([
      Species.RAICHU,
      Species.SHUCKLE
    ]);

    // round 1 - take big damage
    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
    await game.toNextTurn();

    // round 2 - switch out using move
    const hpPreSwitch = game.scene.getParty()[0].hp;

    game.doAttack(getMovePosition(game.scene, 0, Moves.U_TURN));
    game.doSelectPokemon(1);
    await game.toNextTurn();

    // assert
    expect(game.textInterceptor.logs).toContain("Go! Shuckle!");
    expect(game.scene.getParty()[1].hp).toEqual(Math.floor(game.scene.getParty()[1].getMaxHp() * 0.33 + hpPreSwitch));
  }, 20000);

  it("triggers rough skin on the u-turn user before a new pokemon is switched in", async() => {
    // arrange
    game.override.enemyAbility(Abilities.ROUGH_SKIN);
    await game.startBattle([
      Species.RAICHU,
      Species.SHUCKLE
    ]);

    // act
    game.doAttack(getMovePosition(game.scene, 0, Moves.U_TURN));
    game.doSelectPokemon(1);
    await game.phaseInterceptor.to(SwitchPhase, false);

    // assert
    expect(getActivePokemon().hp).not.toEqual(getActivePokemon().getMaxHp());
    expect(game.textInterceptor.getLatestMessage()).toContain("Rough Skin\nhurt its attacker!");
    expect(game.phaseInterceptor.log).not.toContain("SwitchSummonPhase");
  }, 20000);

  it("triggers contact abilities on the u-turn user (eg poison point) before a new pokemon is switched in", async() => {
    // arrange
    game.override.enemyAbility(Abilities.POISON_POINT);
    await game.startBattle([
      Species.RAICHU,
      Species.SHUCKLE
    ]);
    vi.spyOn(game.scene.getEnemyParty()[0], "randSeedInt").mockImplementation((range, min) => {
      if (range === 100 && min === undefined) {
        return 0; // force poison point
      }
      return Utils.randSeedInt(range, min);
    });

    // act
    game.doAttack(getMovePosition(game.scene, 0, Moves.U_TURN));
    await game.phaseInterceptor.to(SwitchPhase, false);

    // assert
    expect(getActivePokemon().status?.effect).toEqual(StatusEffect.POISON);
    expect(game.textInterceptor.getLatestMessage()).toContain("Raichu\nwas poisoned!");
    expect(game.phaseInterceptor.log.slice(-2)).toEqual([
      "ShowAbilityPhase",
      "SwitchPhase"
    ]);
    expect(game.phaseInterceptor.log).not.toContain("SwitchSummonPhase");
  }, 20000);
});
