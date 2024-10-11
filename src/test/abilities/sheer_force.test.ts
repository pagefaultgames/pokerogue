import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import * as overrides from "#app/overrides";
import {Abilities} from "#enums/abilities";
import {applyAbAttrs ,applyPreAttackAbAttrs,applyPostDefendAbAttrs, MoveEffectChanceMultiplierAbAttr, MovePowerBoostAbAttr, PostDefendTypeChangeAbAttr} from "#app/data/ability";
import {Species} from "#enums/species";
import {
  CommandPhase,
  MoveEffectPhase,
} from "#app/phases";
import {Mode} from "#app/ui/ui";
import {Stat} from "#app/data/pokemon-stat";
import {Moves} from "#enums/moves";
import {getMovePosition} from "#app/test/utils/gameManagerUtils";
import {Command} from "#app/ui/command-ui-handler";
import * as Utils from "#app/utils";


describe("Abilities - Sheer Force", () => {
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
    const movesToUse = [Moves.AIR_SLASH, Moves.BIND, Moves.CRUSH_CLAW, Moves.TACKLE];
    vi.spyOn(overrides, "SINGLE_BATTLE_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.ONIX);
    vi.spyOn(overrides, "STARTING_LEVEL_OVERRIDE", "get").mockReturnValue(100);
    vi.spyOn(overrides, "MOVESET_OVERRIDE", "get").mockReturnValue(movesToUse);
    vi.spyOn(overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue([Moves.TACKLE,Moves.TACKLE,Moves.TACKLE,Moves.TACKLE]);
  });

  it("Sheer Force", async() => {
    const moveToUse = Moves.AIR_SLASH;
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.SHEER_FORCE);
    await game.startBattle([
      Species.PIDGEOT
    ]);


    game.scene.getEnemyParty()[0].stats[Stat.SPDEF] = 10000;
    game.scene.getEnemyParty()[0].stats[Stat.SPD] = 1;
    expect(game.scene.getParty()[0].formIndex).toBe(0);

    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const movePosition = getMovePosition(game.scene, 0, moveToUse);
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });

    await game.phaseInterceptor.to(MoveEffectPhase, false);

    const phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    const move = phase.move.getMove();
    expect(move.id).toBe(Moves.AIR_SLASH);

    //Verify the move is boosted and has no chance of secondary effects
    const power = new Utils.IntegerHolder(move.power);
    const chance = new Utils.IntegerHolder(move.chance);

    applyAbAttrs(MoveEffectChanceMultiplierAbAttr, phase.getUserPokemon(), null, chance, move, phase.getTarget(), false);
    applyPreAttackAbAttrs(MovePowerBoostAbAttr, phase.getUserPokemon(), phase.getTarget(), move, power);

    expect(chance.value).toBe(0);
    expect(power.value).toBe(move.power * 5461/4096);


  }, 20000);

  it("Sheer Force with exceptions including binding moves", async() => {
    const moveToUse = Moves.BIND;
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.SHEER_FORCE);
    await game.startBattle([
      Species.PIDGEOT
    ]);


    game.scene.getEnemyParty()[0].stats[Stat.DEF] = 10000;
    game.scene.getEnemyParty()[0].stats[Stat.SPD] = 1;
    expect(game.scene.getParty()[0].formIndex).toBe(0);

    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const movePosition = getMovePosition(game.scene, 0, moveToUse);
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });

    await game.phaseInterceptor.to(MoveEffectPhase, false);

    const phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    const move = phase.move.getMove();
    expect(move.id).toBe(Moves.BIND);

    //Binding moves and other exceptions are not affected by Sheer Force and have a chance.value of -1
    const power = new Utils.IntegerHolder(move.power);
    const chance = new Utils.IntegerHolder(move.chance);

    applyAbAttrs(MoveEffectChanceMultiplierAbAttr, phase.getUserPokemon(), null, chance, move, phase.getTarget(), false);
    applyPreAttackAbAttrs(MovePowerBoostAbAttr, phase.getUserPokemon(), phase.getTarget(), move, power);

    expect(chance.value).toBe(-1);
    expect(power.value).toBe(move.power);


  }, 20000);

  it("Sheer Force with moves with no secondary effect", async() => {
    const moveToUse = Moves.TACKLE;
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.SHEER_FORCE);
    await game.startBattle([
      Species.PIDGEOT
    ]);


    game.scene.getEnemyParty()[0].stats[Stat.DEF] = 10000;
    game.scene.getEnemyParty()[0].stats[Stat.SPD] = 1;
    expect(game.scene.getParty()[0].formIndex).toBe(0);

    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const movePosition = getMovePosition(game.scene, 0, moveToUse);
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });

    await game.phaseInterceptor.to(MoveEffectPhase, false);

    const phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    const move = phase.move.getMove();
    expect(move.id).toBe(Moves.TACKLE);

    //Binding moves and other exceptions are not affected by Sheer Force and have a chance.value of -1
    const power = new Utils.IntegerHolder(move.power);
    const chance = new Utils.IntegerHolder(move.chance);

    applyAbAttrs(MoveEffectChanceMultiplierAbAttr, phase.getUserPokemon(), null, chance, move, phase.getTarget(), false);
    applyPreAttackAbAttrs(MovePowerBoostAbAttr, phase.getUserPokemon(), phase.getTarget(), move, power);

    expect(chance.value).toBe(-1);
    expect(power.value).toBe(move.power);


  }, 20000);

  it("Sheer Force Disabling Specific Abilities", async() => {
    const moveToUse = Moves.CRUSH_CLAW;
    vi.spyOn(overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.COLOR_CHANGE);
    vi.spyOn(overrides, "STARTING_HELD_ITEMS_OVERRIDE", "get").mockReturnValue([{name: "KINGS_ROCK", count: 1}]);
    vi.spyOn(overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.SHEER_FORCE);
    await game.startBattle([
      Species.PIDGEOT
    ]);


    game.scene.getEnemyParty()[0].stats[Stat.DEF] = 10000;
    game.scene.getEnemyParty()[0].stats[Stat.SPD] = 1;
    expect(game.scene.getParty()[0].formIndex).toBe(0);

    game.onNextPrompt("CommandPhase", Mode.COMMAND, () => {
      game.scene.ui.setMode(Mode.FIGHT, (game.scene.getCurrentPhase() as CommandPhase).getFieldIndex());
    });
    game.onNextPrompt("CommandPhase", Mode.FIGHT, () => {
      const movePosition = getMovePosition(game.scene, 0, moveToUse);
      (game.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, movePosition, false);
    });

    await game.phaseInterceptor.to(MoveEffectPhase, false);

    const phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    const move = phase.move.getMove();
    expect(move.id).toBe(Moves.CRUSH_CLAW);

    //Disable color change due to being hit by Sheer Force
    const power = new Utils.IntegerHolder(move.power);
    const chance = new Utils.IntegerHolder(move.chance);
    const user = phase.getUserPokemon();
    const target = phase.getTarget();
    const opponentType = target.getTypes()[0];

    applyAbAttrs(MoveEffectChanceMultiplierAbAttr, user, null, chance, move, target, false);
    applyPreAttackAbAttrs(MovePowerBoostAbAttr, user, target, move, power);
    applyPostDefendAbAttrs(PostDefendTypeChangeAbAttr, target, user, move, target.apply(user, move));

    expect(chance.value).toBe(0);
    expect(power.value).toBe(move.power * 5461/4096);
    expect(target.getTypes().length).toBe(2);
    expect(target.getTypes()[0]).toBe(opponentType);

  }, 20000);

  //TODO King's Rock Interaction Unit Test
});
