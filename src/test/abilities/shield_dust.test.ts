import { BattlerIndex } from "#app/battle";
import { applyAbAttrs, applyPreDefendAbAttrs, IgnoreMoveEffectsAbAttr, MoveEffectChanceMultiplierAbAttr } from "#app/data/ability";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { NumberHolder } from "#app/utils";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Stat } from "#enums/stat";
import GameManager from "#test/utils/gameManager";
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
    game.override.battleType("single");
    game.override.enemySpecies(Species.ONIX);
    game.override.enemyAbility(Abilities.SHIELD_DUST);
    game.override.startingLevel(100);
    game.override.moveset(Moves.AIR_SLASH);
    game.override.enemyMoveset(Moves.TACKLE);
  });

  it("Shield Dust", async () => {
    await game.classicMode.startBattle([ Species.PIDGEOT ]);


    game.scene.getEnemyPokemon()!.stats[Stat.SPDEF] = 10000;
    expect(game.scene.getPlayerPokemon()!.formIndex).toBe(0);

    game.move.select(Moves.AIR_SLASH);

    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    await game.phaseInterceptor.to(MoveEffectPhase, false);

    // Shield Dust negates secondary effect
    const phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    const move = phase.move.getMove();
    expect(move.id).toBe(Moves.AIR_SLASH);

    const chance = new NumberHolder(move.chance);
    applyAbAttrs(MoveEffectChanceMultiplierAbAttr, phase.getUserPokemon()!, null, false, chance, move, phase.getFirstTarget(), false);
    applyPreDefendAbAttrs(IgnoreMoveEffectsAbAttr, phase.getFirstTarget()!, phase.getUserPokemon()!, null, null, false, chance);
    expect(chance.value).toBe(0);

  }, 20000);

  //TODO King's Rock Interaction Unit Test
});
