import { BattleStat } from "#app/data/battle-stat.js";
import { TurnEndPhase } from "#app/phases/turn-end-phase.js";
import GameManager from "#test/utils/gameManager";
import { getMovePosition } from "#test/utils/gameManagerUtils";
import { Abilities } from "#enums/abilities";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

// See also: TypeImmunityAbAttr
describe("Abilities - Volt Absorb", () => {
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
    game.override.disableCrits();
  });

  it("does not activate when CHARGE is used", async () => {
    const moveToUse = Moves.CHARGE;
    const ability = Abilities.VOLT_ABSORB;

    game.override.moveset([moveToUse]);
    game.override.ability(ability);
    game.override.enemyMoveset([Moves.SPLASH, Moves.NONE, Moves.NONE, Moves.NONE]);
    game.override.enemySpecies(Species.DUSKULL);
    game.override.enemyAbility(Abilities.BALL_FETCH);

    await game.startBattle();

    game.doAttack(getMovePosition(game.scene, 0, moveToUse));

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.getParty()[0].summonData.battleStats[BattleStat.SPDEF]).toBe(1);
    expect(game.scene.getParty()[0].getTag(BattlerTagType.CHARGED)).toBeDefined();
    expect(game.phaseInterceptor.log).not.toContain("ShowAbilityPhase");
  });
});
