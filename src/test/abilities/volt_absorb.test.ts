import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import Overrides from "#app/overrides";
import {
  TurnEndPhase,
} from "#app/phases";
import {getMovePosition} from "#app/test/utils/gameManagerUtils";
import { BattleStat } from "#app/data/battle-stat.js";
import { Abilities } from "#enums/abilities";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";

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
    vi.spyOn(Overrides, "BATTLE_TYPE_OVERRIDE", "get").mockReturnValue("single");
    vi.spyOn(Overrides, "NEVER_CRIT_OVERRIDE", "get").mockReturnValue(true);
  });

  it("does not activate when CHARGE is used", async () => {
    const moveToUse = Moves.CHARGE;
    const ability = Abilities.VOLT_ABSORB;

    vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([moveToUse]);
    vi.spyOn(Overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(ability);
    vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SPLASH, Moves.NONE, Moves.NONE, Moves.NONE]);
    vi.spyOn(Overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.DUSKULL);
    vi.spyOn(Overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.BALL_FETCH);

    await game.startBattle();

    game.doAttack(getMovePosition(game.scene, 0, moveToUse));

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.getParty()[0].summonData.battleStats[BattleStat.SPDEF]).toBe(1);
    expect(game.scene.getParty()[0].getTag(BattlerTagType.CHARGED)).toBeDefined();
    expect(game.phaseInterceptor.log).not.toContain("ShowAbilityPhase");
  });
});
