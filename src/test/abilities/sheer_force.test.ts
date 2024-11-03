import { BattlerIndex } from "#app/battle";
import { applyAbAttrs, applyPostDefendAbAttrs, applyPreAttackAbAttrs, MoveEffectChanceMultiplierAbAttr, MovePowerBoostAbAttr, PostDefendTypeChangeAbAttr } from "#app/data/ability";
import { MoveEffectPhase } from "#app/phases/move-effect-phase";
import { NumberHolder } from "#app/utils";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Stat } from "#enums/stat";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { allMoves } from "#app/data/move";

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
    const movesToUse = [ Moves.AIR_SLASH, Moves.BIND, Moves.CRUSH_CLAW, Moves.TACKLE ];
    game.override.battleType("single");
    game.override.enemySpecies(Species.ONIX);
    game.override.startingLevel(100);
    game.override.moveset(movesToUse);
    game.override.enemyMoveset([ Moves.TACKLE, Moves.TACKLE, Moves.TACKLE, Moves.TACKLE ]);
  });

  it("Sheer Force", async () => {
    const moveToUse = Moves.AIR_SLASH;
    game.override.ability(Abilities.SHEER_FORCE);
    await game.classicMode.startBattle([ Species.PIDGEOT ]);

    game.scene.getEnemyPokemon()!.stats[Stat.SPDEF] = 10000;
    expect(game.scene.getPlayerPokemon()!.formIndex).toBe(0);

    game.move.select(moveToUse);

    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    await game.phaseInterceptor.to(MoveEffectPhase, false);

    const phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    const move = phase.move.getMove();
    expect(move.id).toBe(Moves.AIR_SLASH);

    //Verify the move is boosted and has no chance of secondary effects
    const power = new NumberHolder(move.power);
    const chance = new NumberHolder(move.chance);

    applyAbAttrs(MoveEffectChanceMultiplierAbAttr, phase.getUserPokemon()!, null, false, chance, move, phase.getFirstTarget(), false);
    applyPreAttackAbAttrs(MovePowerBoostAbAttr, phase.getUserPokemon()!, phase.getFirstTarget()!, move, false, power);

    expect(chance.value).toBe(0);
    expect(power.value).toBe(move.power * 5461 / 4096);


  }, 20000);

  it("Sheer Force with exceptions including binding moves", async () => {
    const moveToUse = Moves.BIND;
    game.override.ability(Abilities.SHEER_FORCE);
    await game.classicMode.startBattle([ Species.PIDGEOT ]);


    game.scene.getEnemyPokemon()!.stats[Stat.DEF] = 10000;
    expect(game.scene.getPlayerPokemon()!.formIndex).toBe(0);

    game.move.select(moveToUse);

    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    await game.phaseInterceptor.to(MoveEffectPhase, false);

    const phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    const move = phase.move.getMove();
    expect(move.id).toBe(Moves.BIND);

    //Binding moves and other exceptions are not affected by Sheer Force and have a chance.value of -1
    const power = new NumberHolder(move.power);
    const chance = new NumberHolder(move.chance);

    applyAbAttrs(MoveEffectChanceMultiplierAbAttr, phase.getUserPokemon()!, null, false, chance, move, phase.getFirstTarget(), false);
    applyPreAttackAbAttrs(MovePowerBoostAbAttr, phase.getUserPokemon()!, phase.getFirstTarget()!, move, false, power);

    expect(chance.value).toBe(-1);
    expect(power.value).toBe(move.power);


  }, 20000);

  it("Sheer Force with moves with no secondary effect", async () => {
    const moveToUse = Moves.TACKLE;
    game.override.ability(Abilities.SHEER_FORCE);
    await game.classicMode.startBattle([ Species.PIDGEOT ]);


    game.scene.getEnemyPokemon()!.stats[Stat.DEF] = 10000;
    expect(game.scene.getPlayerPokemon()!.formIndex).toBe(0);

    game.move.select(moveToUse);

    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    await game.phaseInterceptor.to(MoveEffectPhase, false);

    const phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    const move = phase.move.getMove();
    expect(move.id).toBe(Moves.TACKLE);

    //Binding moves and other exceptions are not affected by Sheer Force and have a chance.value of -1
    const power = new NumberHolder(move.power);
    const chance = new NumberHolder(move.chance);

    applyAbAttrs(MoveEffectChanceMultiplierAbAttr, phase.getUserPokemon()!, null, false, chance, move, phase.getFirstTarget(), false);
    applyPreAttackAbAttrs(MovePowerBoostAbAttr, phase.getUserPokemon()!, phase.getFirstTarget()!, move, false, power);

    expect(chance.value).toBe(-1);
    expect(power.value).toBe(move.power);


  }, 20000);

  it("Sheer Force Disabling Specific Abilities", async () => {
    const moveToUse = Moves.CRUSH_CLAW;
    game.override.enemyAbility(Abilities.COLOR_CHANGE);
    game.override.startingHeldItems([{ name: "KINGS_ROCK", count: 1 }]);
    game.override.ability(Abilities.SHEER_FORCE);
    await game.startBattle([ Species.PIDGEOT ]);


    game.scene.getEnemyPokemon()!.stats[Stat.DEF] = 10000;
    expect(game.scene.getPlayerPokemon()!.formIndex).toBe(0);

    game.move.select(moveToUse);

    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    await game.phaseInterceptor.to(MoveEffectPhase, false);

    const phase = game.scene.getCurrentPhase() as MoveEffectPhase;
    const move = phase.move.getMove();
    expect(move.id).toBe(Moves.CRUSH_CLAW);

    //Disable color change due to being hit by Sheer Force
    const power = new NumberHolder(move.power);
    const chance = new NumberHolder(move.chance);
    const user = phase.getUserPokemon()!;
    const target = phase.getFirstTarget()!;
    const opponentType = target.getTypes()[0];

    applyAbAttrs(MoveEffectChanceMultiplierAbAttr, user, null, false, chance, move, target, false);
    applyPreAttackAbAttrs(MovePowerBoostAbAttr, user, target, move, false, power);
    applyPostDefendAbAttrs(PostDefendTypeChangeAbAttr, target, user, move, target.apply(user, move));

    expect(chance.value).toBe(0);
    expect(power.value).toBe(move.power * 5461 / 4096);
    expect(target.getTypes().length).toBe(2);
    expect(target.getTypes()[0]).toBe(opponentType);

  }, 20000);

  it("Two Pokemon with abilities disabled by Sheer Force hitting each other should not cause a crash", async () => {
    const moveToUse = Moves.CRUNCH;
    game.override.enemyAbility(Abilities.COLOR_CHANGE)
      .ability(Abilities.COLOR_CHANGE)
      .moveset(moveToUse)
      .enemyMoveset(moveToUse);

    await game.classicMode.startBattle([
      Species.PIDGEOT
    ]);

    const pidgeot = game.scene.getPlayerParty()[0];
    const onix = game.scene.getEnemyParty()[0];

    pidgeot.stats[Stat.DEF] = 10000;
    onix.stats[Stat.DEF] = 10000;

    game.move.select(moveToUse);
    await game.toNextTurn();

    // Check that both Pokemon's Color Change activated
    const expectedTypes = [ allMoves[moveToUse].type ];
    expect(pidgeot.getTypes()).toStrictEqual(expectedTypes);
    expect(onix.getTypes()).toStrictEqual(expectedTypes);
  });

  //TODO King's Rock Interaction Unit Test
});
