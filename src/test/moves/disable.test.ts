import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import GameManager from "../utils/gameManager";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { CommandPhase, EnemyCommandPhase, TurnInitPhase } from "#app/phases.js";
import { Mode } from "#app/ui/ui.js";
import { getMovePosition } from "../utils/gameManagerUtils";
import {Command} from "#app/ui/command-ui-handler";
import { MoveResult } from "#app/field/pokemon.js";
import { Stat } from "#app/data/pokemon-stat.js";
import { DisabledTag } from "#app/data/battler-tags.js";
import { BattlerTagType } from "#enums/battler-tag-type";

describe("Moves - Disable", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  /** If in CommandPhase, input a move */
  const _useMove = (move?: Moves) => {
    move ??= Moves.DISABLE;

    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const movePosition = getMovePosition(game.scene, 0, move);
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });
  };

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
    game.override.ability(Abilities.NONE);
    game.override.enemyAbility(Abilities.NONE);
    game.override.moveset([Moves.DISABLE, Moves.SPLASH, Moves.NONE, Moves.NONE]);
    game.override.enemyMoveset([Moves.SPLASH,Moves.NONE,Moves.NONE,Moves.NONE]);
    game.override.starterSpecies(Species.PIKACHU);
    game.override.enemySpecies(Species.SHUCKLE);
  });

  it("DISABLE fails if enemy has no move history", async() => {
    // Player goes first
    await game.startBattle();
    expect(game.scene.getParty()[0].stats[Stat.SPD]).toBeGreaterThan(game.scene.getEnemyParty()[0].stats[Stat.SPD]);

    _useMove();

    await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(TurnInitPhase);
    expect(game.scene.getParty()[0].getMoveHistory().at(0)!.result).toBe(MoveResult.FAIL);
  }, 20000);

  it("DISABLE works when user moves after enemy", async() => {
    game.override.starterSpecies(Species.SHUCKLE);
    game.override.enemySpecies(Species.PIKACHU);

    await game.startBattle();
    expect(game.scene.getParty()[0].stats[Stat.SPD]).toBeLessThan(game.scene.getEnemyParty()[0].stats[Stat.SPD]);

    _useMove();
    await game.phaseInterceptor.to(CommandPhase);

    expect(game.scene.getParty()[0].getMoveHistory().at(0)!.move).toBe(Moves.DISABLE);
    expect(game.scene.getParty()[0].getMoveHistory().at(0)!.result).toBe(MoveResult.SUCCESS);
    expect(game.scene.getEnemyParty()[0].getMoveHistory().at(0)!.move).toBe(Moves.SPLASH);
    expect(game.scene.getEnemyParty()[0].summonData.tags).toHaveLength(1);
    expect(game.scene.getEnemyParty()[0].summonData.tags[0]).toBeInstanceOf(DisabledTag);
    expect((game.scene.getEnemyParty()[0].getTag(BattlerTagType.DISABLED) as DisabledTag).moveId).toBe(Moves.SPLASH);
    expect(game.scene.getEnemyParty()[0].isMoveDisabled(Moves.SPLASH)).toBe(true);

    _useMove();
    await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(CommandPhase);
    expect(game.scene.getEnemyParty()[0].getLastXMoves().at(0)!.move).toBe(Moves.STRUGGLE);
  }, 20000);

  it("DISABLE interrupts target's move when user moves first", async() => {
    // Player goes first
    await game.startBattle();

    _useMove(Moves.SPLASH);
    await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(CommandPhase);

    expect(game.scene.getEnemyParty()[0].getMoveHistory()).toHaveLength(1);

    // Both mons just used Splash last turn; now have player use Disable.

    _useMove(Moves.DISABLE);
    await game.phaseInterceptor.runFrom(EnemyCommandPhase).to(CommandPhase);

    expect(game.scene.getPlayerPokemon()!.getMoveHistory().length).toBe(2);

    expect(game.scene.getEnemyParty()[0].isMoveDisabled(Moves.SPLASH));
    expect(game.scene.getEnemyParty()[0].getMoveHistory().length).toBe(2);
    expect(game.scene.getEnemyParty()[0].getLastXMoves(2).at(0)!.result).toBe(MoveResult.FAIL);
    expect(game.scene.getEnemyParty()[0].getLastXMoves(2).at(1)!.result).toBe(MoveResult.SUCCESS);
  }, 20000);

});
