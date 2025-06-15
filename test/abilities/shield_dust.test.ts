import { BattlerIndex } from "#enums/battler-index";
import { applyAbAttrs, applyPreDefendAbAttrs } from "#app/data/abilities/apply-ab-attrs";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { NumberHolder } from "#app/utils/common";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import GameManager from "#test/testUtils/gameManager";
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

    game.scene.getEnemyPokemon()!.stats[Stat.SPDEF] = 10000;
    expect(game.scene.getPlayerPokemon()!.formIndex).toBe(0);

    game.move.select(MoveId.AIR_SLASH);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to(MoveEffectPhase, false);

    // Shield Dust negates secondary effect
    const phase = game.scene.phaseManager.getCurrentPhase() as MoveEffectPhase;
    const move = phase.move;
    expect(move.id).toBe(MoveId.AIR_SLASH);

    const chance = new NumberHolder(move.chance);
    await applyAbAttrs(
      "MoveEffectChanceMultiplierAbAttr",
      phase.getUserPokemon()!,
      null,
      false,
      chance,
      move,
      phase.getFirstTarget(),
      false,
    );
    await applyPreDefendAbAttrs(
      "IgnoreMoveEffectsAbAttr",
      phase.getFirstTarget()!,
      phase.getUserPokemon()!,
      null,
      null,
      false,
      chance,
    );
    expect(chance.value).toBe(0);
  });

  //TODO King's Rock Interaction Unit Test
});
