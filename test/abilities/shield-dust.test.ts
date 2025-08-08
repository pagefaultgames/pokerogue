import { applyAbAttrs } from "#abilities/apply-ab-attrs";
import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { MoveEffectPhase } from "#phases/move-effect-phase";
import { GameManager } from "#test/test-utils/game-manager";
import { NumberHolder } from "#utils/common";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Shield Dust", () => {
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
      .battleStyle("single")
      .enemySpecies(SpeciesId.ONIX)
      .enemyAbility(AbilityId.SHIELD_DUST)
      .startingLevel(100)
      .moveset(MoveId.AIR_SLASH)
      .enemyMoveset(MoveId.TACKLE);
  });

  it("Shield Dust", async () => {
    await game.classicMode.startBattle([SpeciesId.PIDGEOT]);

    game.field.getEnemyPokemon().stats[Stat.SPDEF] = 10000;
    expect(game.field.getPlayerPokemon().formIndex).toBe(0);

    game.move.select(MoveId.AIR_SLASH);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to(MoveEffectPhase, false);

    // Shield Dust negates secondary effect
    const phase = game.scene.phaseManager.getCurrentPhase() as MoveEffectPhase;
    const move = phase.move;
    expect(move.id).toBe(MoveId.AIR_SLASH);

    const chance = new NumberHolder(move.chance);
    applyAbAttrs("MoveEffectChanceMultiplierAbAttr", {
      pokemon: phase.getUserPokemon()!,
      chance,
      move,
    });
    applyAbAttrs("IgnoreMoveEffectsAbAttr", {
      pokemon: phase.getFirstTarget()!,
      move,
      chance,
    });
    expect(chance.value).toBe(0);
  });

  //TODO King's Rock Interaction Unit Test
});
