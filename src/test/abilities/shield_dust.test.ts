import { applyAbAttrs, applyPreDefendAbAttrs, IgnoreMoveEffectsAbAttr, MoveEffectChanceMultiplierAbAttr } from "#app/data/ability";
import { Stat } from "#app/data/pokemon-stat";
import { CommandPhase, MoveEffectPhase } from "#app/phases";
import GameManager from "#test/utils/gameManager";
import { getMovePosition } from "#test/utils/gameManagerUtils";
import { Command } from "#app/ui/command-ui-handler";
import { Mode } from "#app/ui/ui";
import * as Utils from "#app/utils";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { BattlerIndex } from "#app/battle.js";


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
    const movesToUse = [Moves.AIR_SLASH];
    game.override.battleType("single");
    game.override.enemySpecies(Species.ONIX);
    game.override.enemyAbility(Abilities.SHIELD_DUST);
    game.override.startingLevel(100);
    game.override.moveset(movesToUse);
    game.override.enemyMoveset([Moves.TACKLE,Moves.TACKLE,Moves.TACKLE,Moves.TACKLE]);
  });

  it("Shield Dust", async() => {
    const moveToUse = Moves.AIR_SLASH;
    await game.startBattle([
      Species.PIDGEOT
    ]);


    game.scene.getEnemyParty()[0].stats[Stat.SPDEF] = 10000;
    expect(game.scene.getParty()[0].formIndex).toBe(0);

    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const movePosition = getMovePosition(game.scene, 0, moveToUse);
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to(MoveEffectPhase, false);

    // Shield Dust negates secondary effect
    const phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    const move = phase.move.getMove();
    expect(move.id).toBe(Moves.AIR_SLASH);

    const chance = new Utils.IntegerHolder(move.chance);
    applyAbAttrs(MoveEffectChanceMultiplierAbAttr, phase.getUserPokemon()!, null, chance, move, phase.getTarget(), false);
    applyPreDefendAbAttrs(IgnoreMoveEffectsAbAttr, phase.getTarget()!, phase.getUserPokemon()!, null!, null!, chance);
    expect(chance.value).toBe(0);

  }, 20000);

  //TODO King's Rock Interaction Unit Test
});
