import { BattlerIndex } from "#app/battle";
import { applyAbAttrs, applyPostDefendAbAttrs, applyPreAttackAbAttrs, MoveEffectChanceMultiplierAbAttr, MovePowerBoostAbAttr, PostDefendTypeChangeAbAttr } from "#app/data/ability";
import { Stat } from "#enums/stat";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import * as Utils from "#app/utils";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";


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
    game.override.battleType("single");
    game.override.enemySpecies(Species.ONIX);
    game.override.startingLevel(100);
    game.override.moveset(movesToUse);
    game.override.enemyMoveset([Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE]);
  });

  it("Sheer Force", async () => {
    const moveToUse = Moves.AIR_SLASH;
    game.override.ability(Abilities.SHEER_FORCE);
    await game.startBattle([
      Species.PIDGEOT
    ]);


    game.scene.getEnemyParty()[0].stats[Stat.SPDEF] = 10000;
    expect(game.scene.getParty()[0].formIndex).toBe(0);

    game.move.select(moveToUse);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to(MoveEffectPhase, false);

    const phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    const move = phase.move.getMove();
    expect(move.id).toBe(Moves.AIR_SLASH);

    //Verify the move is boosted and has no chance of secondary effects
    const power = new Utils.IntegerHolder(move.power);
    const chance = new Utils.IntegerHolder(move.chance);

    applyAbAttrs(MoveEffectChanceMultiplierAbAttr, phase.getUserPokemon()!, null, false, chance, move, phase.getTarget(), false);
    applyPreAttackAbAttrs(MovePowerBoostAbAttr, phase.getUserPokemon()!, phase.getTarget()!, move, false, power);

    expect(chance.value).toBe(0);
    expect(power.value).toBe(move.power * 5461 / 4096);


  }, 20000);

  it("Sheer Force with exceptions including binding moves", async () => {
    const moveToUse = Moves.BIND;
    game.override.ability(Abilities.SHEER_FORCE);
    await game.startBattle([
      Species.PIDGEOT
    ]);


    game.scene.getEnemyParty()[0].stats[Stat.DEF] = 10000;
    expect(game.scene.getParty()[0].formIndex).toBe(0);

    game.move.select(moveToUse);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to(MoveEffectPhase, false);

    const phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    const move = phase.move.getMove();
    expect(move.id).toBe(Moves.BIND);

    //Binding moves and other exceptions are not affected by Sheer Force and have a chance.value of -1
    const power = new Utils.IntegerHolder(move.power);
    const chance = new Utils.IntegerHolder(move.chance);

    applyAbAttrs(MoveEffectChanceMultiplierAbAttr, phase.getUserPokemon()!, null, false, chance, move, phase.getTarget(), false);
    applyPreAttackAbAttrs(MovePowerBoostAbAttr, phase.getUserPokemon()!, phase.getTarget()!, move, false, power);

    expect(chance.value).toBe(-1);
    expect(power.value).toBe(move.power);


  }, 20000);

  it("Sheer Force with moves with no secondary effect", async () => {
    const moveToUse = Moves.TACKLE;
    game.override.ability(Abilities.SHEER_FORCE);
    await game.startBattle([
      Species.PIDGEOT
    ]);


    game.scene.getEnemyParty()[0].stats[Stat.DEF] = 10000;
    expect(game.scene.getParty()[0].formIndex).toBe(0);

    game.move.select(moveToUse);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to(MoveEffectPhase, false);

    const phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    const move = phase.move.getMove();
    expect(move.id).toBe(Moves.TACKLE);

    //Binding moves and other exceptions are not affected by Sheer Force and have a chance.value of -1
    const power = new Utils.IntegerHolder(move.power);
    const chance = new Utils.IntegerHolder(move.chance);

    applyAbAttrs(MoveEffectChanceMultiplierAbAttr, phase.getUserPokemon()!, null, false, chance, move, phase.getTarget(), false);
    applyPreAttackAbAttrs(MovePowerBoostAbAttr, phase.getUserPokemon()!, phase.getTarget()!, move, false, power);

    expect(chance.value).toBe(-1);
    expect(power.value).toBe(move.power);


  }, 20000);

  it("Sheer Force Disabling Specific Abilities", async () => {
    const moveToUse = Moves.CRUSH_CLAW;
    game.override.enemyAbility(Abilities.COLOR_CHANGE);
    game.override.startingHeldItems([{ name: "KINGS_ROCK", count: 1 }]);
    game.override.ability(Abilities.SHEER_FORCE);
    await game.startBattle([
      Species.PIDGEOT
    ]);


    game.scene.getEnemyParty()[0].stats[Stat.DEF] = 10000;
    expect(game.scene.getParty()[0].formIndex).toBe(0);

    game.move.select(moveToUse);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to(MoveEffectPhase, false);

    const phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    const move = phase.move.getMove();
    expect(move.id).toBe(Moves.CRUSH_CLAW);

    //Disable color change due to being hit by Sheer Force
    const power = new Utils.IntegerHolder(move.power);
    const chance = new Utils.IntegerHolder(move.chance);
    const user = phase.getUserPokemon()!;
    const target = phase.getTarget()!;
    const opponentType = target.getTypes()[0];

    applyAbAttrs(MoveEffectChanceMultiplierAbAttr, user, null, false, chance, move, target, false);
    applyPreAttackAbAttrs(MovePowerBoostAbAttr, user, target, move, false, power);
    applyPostDefendAbAttrs(PostDefendTypeChangeAbAttr, target, user, move, target.apply(user, move));

    expect(chance.value).toBe(0);
    expect(power.value).toBe(move.power * 5461 / 4096);
    expect(target.getTypes().length).toBe(2);
    expect(target.getTypes()[0]).toBe(opponentType);

  }, 20000);

  //TODO King's Rock Interaction Unit Test
});
