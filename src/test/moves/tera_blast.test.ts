import { BattlerIndex } from "#app/battle";
import { Stat } from "#enums/stat";
import { allMoves, TeraMoveCategoryAttr } from "#app/data/move";
import { Type } from "#enums/type";
import { Abilities } from "#app/enums/abilities";
import { HitResult } from "#app/field/pokemon";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Tera Blast", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  const moveToCheck = allMoves[Moves.TERA_BLAST];
  const teraBlastAttr = moveToCheck.getAttrs(TeraMoveCategoryAttr)[0];

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
      .battleType("single")
      .disableCrits()
      .starterSpecies(Species.FEEBAS)
      .moveset([ Moves.TERA_BLAST ])
      .ability(Abilities.BALL_FETCH)
      .startingHeldItems([{ name: "TERA_SHARD", type: Type.FIRE }])
      .enemySpecies(Species.MAGIKARP)
      .enemyMoveset(Moves.SPLASH)
      .enemyAbility(Abilities.STURDY)
      .enemyLevel(50);

    vi.spyOn(moveToCheck, "calculateBattlePower");
  });

  it("changes type to match user's tera type", async () => {
    game.override
      .enemySpecies(Species.FURRET)
      .startingHeldItems([{ name: "TERA_SHARD", type: Type.FIGHTING }]);
    await game.startBattle();
    const enemyPokemon = game.scene.getEnemyPokemon()!;
    vi.spyOn(enemyPokemon, "apply");

    game.move.select(Moves.TERA_BLAST);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(enemyPokemon.apply).toHaveReturnedWith(HitResult.SUPER_EFFECTIVE);
  }, 20000);

  it("increases power if user is Stellar tera type", async () => {
    game.override.startingHeldItems([{ name: "TERA_SHARD", type: Type.STELLAR }]);

    await game.startBattle();

    game.move.select(Moves.TERA_BLAST);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(moveToCheck.calculateBattlePower).toHaveReturnedWith(100);
  }, 20000);

  it("is super effective against terastallized targets if user is Stellar tera type", async () => {
    game.override.startingHeldItems([{ name: "TERA_SHARD", type: Type.STELLAR }]);

    await game.startBattle();

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    vi.spyOn(enemyPokemon, "apply");
    vi.spyOn(enemyPokemon, "isTerastallized").mockReturnValue(true);

    game.move.select(Moves.TERA_BLAST);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    await game.phaseInterceptor.to("MoveEffectPhase");

    expect(enemyPokemon.apply).toHaveReturnedWith(HitResult.SUPER_EFFECTIVE);
  });

  it("uses the higher ATK for damage calculation", async () => {
    await game.startBattle();

    const playerPokemon = game.scene.getPlayerPokemon()!;
    playerPokemon.stats[Stat.ATK] = 100;
    playerPokemon.stats[Stat.SPATK] = 1;

    vi.spyOn(teraBlastAttr, "apply");

    game.move.select(Moves.TERA_BLAST);
    await game.toNextTurn();
    expect(teraBlastAttr.apply).toHaveLastReturnedWith(true);
  });

  it("uses the higher SPATK for damage calculation", async () => {
    await game.startBattle();

    const playerPokemon = game.scene.getPlayerPokemon()!;
    playerPokemon.stats[Stat.ATK] = 1;
    playerPokemon.stats[Stat.SPATK] = 100;

    vi.spyOn(teraBlastAttr, "apply");

    game.move.select(Moves.TERA_BLAST);
    await game.toNextTurn();
    expect(teraBlastAttr.apply).toHaveLastReturnedWith(false);
  });

  it("should stay as a special move if ATK turns lower than SPATK mid-turn", async () => {
    game.override.enemyMoveset([ Moves.CHARM ]);
    await game.startBattle();

    const playerPokemon = game.scene.getPlayerPokemon()!;
    playerPokemon.stats[Stat.ATK] = 51;
    playerPokemon.stats[Stat.SPATK] = 50;

    vi.spyOn(teraBlastAttr, "apply");

    game.move.select(Moves.TERA_BLAST);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.toNextTurn();
    expect(teraBlastAttr.apply).toHaveLastReturnedWith(false);
  });

  it("does not change its move category from stat changes due to held items", async () => {
    game.override
      .startingHeldItems([{ name: "SPECIES_STAT_BOOSTER", type: "THICK_CLUB" }])
      .starterSpecies(Species.CUBONE);
    await game.startBattle();

    const playerPokemon = game.scene.getPlayerPokemon()!;

    playerPokemon.stats[Stat.ATK] = 50;
    playerPokemon.stats[Stat.SPATK] = 51;

    vi.spyOn(teraBlastAttr, "apply");

    game.move.select(Moves.TERA_BLAST);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.toNextTurn();

    expect(teraBlastAttr.apply).toHaveLastReturnedWith(false);
  });

  it("does not change its move category from stat changes due to abilities", async () => {
    game.override.ability(Abilities.HUGE_POWER);
    await game.startBattle();

    const playerPokemon = game.scene.getPlayerPokemon()!;
    playerPokemon.stats[Stat.ATK] = 50;
    playerPokemon.stats[Stat.SPATK] = 51;

    vi.spyOn(teraBlastAttr, "apply");

    game.move.select(Moves.TERA_BLAST);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.toNextTurn();
    expect(teraBlastAttr.apply).toHaveLastReturnedWith(false);
  });


  it("causes stat drops if user is Stellar tera type", async () => {
    game.override.startingHeldItems([{ name: "TERA_SHARD", type: Type.STELLAR }]);
    await game.startBattle();

    const playerPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.TERA_BLAST);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(playerPokemon.getStatStage(Stat.SPATK)).toBe(-1);
    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(-1);
  }, 20000);
});
