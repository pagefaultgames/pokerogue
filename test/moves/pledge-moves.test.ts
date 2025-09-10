import { allAbilities, allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import { toDmgValue } from "#utils/common";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Pledge Moves", () => {
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
      .battleStyle("double")
      .startingLevel(100)
      .moveset([MoveId.FIRE_PLEDGE, MoveId.GRASS_PLEDGE, MoveId.WATER_PLEDGE, MoveId.SPLASH])
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyLevel(100)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("Fire Pledge - should be an 80-power Fire-type attack outside of combination", async () => {
    await game.classicMode.startBattle([SpeciesId.BLASTOISE, SpeciesId.CHARIZARD]);

    const firePledge = allMoves[MoveId.FIRE_PLEDGE];
    vi.spyOn(firePledge, "calculateBattlePower");

    const playerPokemon = game.scene.getPlayerField();
    vi.spyOn(playerPokemon[0], "getMoveType");

    game.move.select(MoveId.FIRE_PLEDGE, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, 1);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("MoveEndPhase", false);

    expect(firePledge.calculateBattlePower).toHaveLastReturnedWith(80);
    expect(playerPokemon[0].getMoveType).toHaveLastReturnedWith(PokemonType.FIRE);
  });

  it("Fire Pledge - should not combine with an ally using Fire Pledge", async () => {
    await game.classicMode.startBattle([SpeciesId.BLASTOISE, SpeciesId.CHARIZARD]);

    const firePledge = allMoves[MoveId.FIRE_PLEDGE];
    vi.spyOn(firePledge, "calculateBattlePower");

    const playerPokemon = game.scene.getPlayerField();
    playerPokemon.forEach(p => vi.spyOn(p, "getMoveType"));

    const enemyPokemon = game.scene.getEnemyField();

    game.move.select(MoveId.FIRE_PLEDGE, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.FIRE_PLEDGE, 0, BattlerIndex.ENEMY_2);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

    await game.phaseInterceptor.to("MoveEndPhase");
    expect(firePledge.calculateBattlePower).toHaveLastReturnedWith(80);
    expect(playerPokemon[0].getMoveType).toHaveLastReturnedWith(PokemonType.FIRE);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(firePledge.calculateBattlePower).toHaveLastReturnedWith(80);
    expect(playerPokemon[1].getMoveType).toHaveLastReturnedWith(PokemonType.FIRE);

    enemyPokemon.forEach(p => expect(p.hp).toBeLessThan(p.getMaxHp()));
  });

  it("Fire Pledge - should not combine with an enemy's Pledge move", async () => {
    game.override.battleStyle("single").enemyMoveset(MoveId.GRASS_PLEDGE);

    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.FIRE_PLEDGE);

    await game.toNextTurn();

    // Neither Pokemon should defer their move's effects as they would
    // if they combined moves, so both should be damaged.
    expect(playerPokemon.hp).toBeLessThan(playerPokemon.getMaxHp());
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
    expect(game.scene.arena.getTag(ArenaTagType.FIRE_GRASS_PLEDGE)).toBeUndefined();
  });

  it("Grass Pledge - should combine with Fire Pledge to form a 150-power Fire-type attack that creates a 'sea of fire'", async () => {
    await game.classicMode.startBattle([SpeciesId.CHARIZARD, SpeciesId.BLASTOISE]);

    const grassPledge = allMoves[MoveId.GRASS_PLEDGE];
    vi.spyOn(grassPledge, "calculateBattlePower");

    const playerPokemon = game.scene.getPlayerField();
    const enemyPokemon = game.scene.getEnemyField();

    vi.spyOn(playerPokemon[1], "getMoveType");
    const baseDmgMock = vi.spyOn(enemyPokemon[0], "getBaseDamage");

    game.move.select(MoveId.FIRE_PLEDGE, 0, BattlerIndex.ENEMY_2);
    game.move.select(MoveId.GRASS_PLEDGE, 1, BattlerIndex.ENEMY);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    // advance to the end of PLAYER_2's move this turn
    for (let i = 0; i < 2; i++) {
      await game.phaseInterceptor.to("MoveEndPhase");
    }
    expect(playerPokemon[1].getMoveType).toHaveLastReturnedWith(PokemonType.FIRE);
    expect(grassPledge.calculateBattlePower).toHaveLastReturnedWith(150);

    const baseDmg = baseDmgMock.mock.results.at(-1)!.value;
    expect(enemyPokemon[0].getMaxHp() - enemyPokemon[0].hp).toBe(toDmgValue(baseDmg * 1.5));
    expect(enemyPokemon[1].hp).toBe(enemyPokemon[1].getMaxHp()); // PLAYER should not have attacked
    expect(game.scene.arena.getTagOnSide(ArenaTagType.FIRE_GRASS_PLEDGE, ArenaTagSide.ENEMY)).toBeDefined();

    const enemyStartingHp = enemyPokemon.map(p => p.hp);
    await game.toNextTurn();
    enemyPokemon.forEach((p, i) => expect(enemyStartingHp[i] - p.hp).toBe(toDmgValue(p.getMaxHp() / 8)));
  });

  it("Fire Pledge - should combine with Water Pledge to form a 150-power Water-type attack that creates a 'rainbow'", async () => {
    game.override.moveset([MoveId.FIRE_PLEDGE, MoveId.WATER_PLEDGE, MoveId.FIERY_DANCE, MoveId.SPLASH]);

    await game.classicMode.startBattle([SpeciesId.BLASTOISE, SpeciesId.VENUSAUR]);

    const firePledge = allMoves[MoveId.FIRE_PLEDGE];
    vi.spyOn(firePledge, "calculateBattlePower");

    const playerPokemon = game.scene.getPlayerField();
    const enemyPokemon = game.scene.getEnemyField();

    vi.spyOn(playerPokemon[1], "getMoveType");

    game.move.select(MoveId.WATER_PLEDGE, 0, BattlerIndex.ENEMY_2);
    game.move.select(MoveId.FIRE_PLEDGE, 1, BattlerIndex.ENEMY);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    // advance to the end of PLAYER_2's move this turn
    for (let i = 0; i < 2; i++) {
      await game.phaseInterceptor.to("MoveEndPhase");
    }
    expect(playerPokemon[1].getMoveType).toHaveLastReturnedWith(PokemonType.WATER);
    expect(firePledge.calculateBattlePower).toHaveLastReturnedWith(150);
    expect(enemyPokemon[1].hp).toBe(enemyPokemon[1].getMaxHp()); // PLAYER should not have attacked
    expect(game.scene.arena.getTagOnSide(ArenaTagType.WATER_FIRE_PLEDGE, ArenaTagSide.PLAYER)).toBeDefined();

    await game.toNextTurn();

    game.move.select(MoveId.FIERY_DANCE, 0, BattlerIndex.ENEMY_2);
    game.move.select(MoveId.SPLASH, 1);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("MoveEndPhase");

    // Rainbow effect should increase Fiery Dance's chance of raising Sp. Atk to 100%
    expect(playerPokemon[0].getStatStage(Stat.SPATK)).toBe(1);
  });

  it("Water Pledge - should combine with Grass Pledge to form a 150-power Grass-type attack that creates a 'swamp'", async () => {
    await game.classicMode.startBattle([SpeciesId.BLASTOISE, SpeciesId.CHARIZARD]);

    const waterPledge = allMoves[MoveId.WATER_PLEDGE];
    vi.spyOn(waterPledge, "calculateBattlePower");

    const playerPokemon = game.scene.getPlayerField();
    const enemyPokemon = game.scene.getEnemyField();
    const enemyStartingSpd = enemyPokemon.map(p => p.getEffectiveStat(Stat.SPD));

    vi.spyOn(playerPokemon[1], "getMoveType");

    game.move.select(MoveId.GRASS_PLEDGE, 0, BattlerIndex.ENEMY_2);
    game.move.select(MoveId.WATER_PLEDGE, 1, BattlerIndex.ENEMY);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    // advance to the end of PLAYER_2's move this turn
    for (let i = 0; i < 2; i++) {
      await game.phaseInterceptor.to("MoveEndPhase");
    }

    expect(playerPokemon[1].getMoveType).toHaveLastReturnedWith(PokemonType.GRASS);
    expect(waterPledge.calculateBattlePower).toHaveLastReturnedWith(150);
    expect(enemyPokemon[1].hp).toBe(enemyPokemon[1].getMaxHp());

    expect(game.scene.arena.getTagOnSide(ArenaTagType.GRASS_WATER_PLEDGE, ArenaTagSide.ENEMY)).toBeDefined();
    enemyPokemon.forEach((p, i) => expect(p.getEffectiveStat(Stat.SPD)).toBe(Math.floor(enemyStartingSpd[i] / 4)));
  });

  it("Pledge Moves - should alter turn order when used in combination", async () => {
    await game.classicMode.startBattle([SpeciesId.CHARIZARD, SpeciesId.BLASTOISE]);

    const enemyPokemon = game.scene.getEnemyField();

    game.move.select(MoveId.WATER_PLEDGE, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.FIRE_PLEDGE, 1, BattlerIndex.ENEMY_2);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER_2]);
    // PLAYER_2 should act with a combined move immediately after PLAYER as the second move in the turn
    for (let i = 0; i < 2; i++) {
      await game.phaseInterceptor.to("MoveEndPhase");
    }
    expect(enemyPokemon[0].hp).toBe(enemyPokemon[0].getMaxHp());
    expect(enemyPokemon[1].hp).toBeLessThan(enemyPokemon[1].getMaxHp());
  });

  it("Pledge Moves - 'rainbow' effect should not stack with Serene Grace when applied to flinching moves", async () => {
    game.override
      .ability(AbilityId.SERENE_GRACE)
      .moveset([MoveId.FIRE_PLEDGE, MoveId.WATER_PLEDGE, MoveId.IRON_HEAD, MoveId.SPLASH]);

    await game.classicMode.startBattle([SpeciesId.BLASTOISE, SpeciesId.CHARIZARD]);

    const ironHeadFlinchAttr = allMoves[MoveId.IRON_HEAD].getAttrs("FlinchAttr")[0];
    vi.spyOn(ironHeadFlinchAttr, "getMoveChance");

    game.move.select(MoveId.WATER_PLEDGE, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.FIRE_PLEDGE, 1, BattlerIndex.ENEMY_2);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.scene.arena.getTagOnSide(ArenaTagType.WATER_FIRE_PLEDGE, ArenaTagSide.PLAYER)).toBeDefined();

    game.move.select(MoveId.IRON_HEAD, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, 1);

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(ironHeadFlinchAttr.getMoveChance).toHaveLastReturnedWith(60);
  });

  it("Pledge Moves - should have no effect when the second ally's move is cancelled", async () => {
    game.override.enemyMoveset([MoveId.SPLASH, MoveId.SPORE]);

    await game.classicMode.startBattle([SpeciesId.BLASTOISE, SpeciesId.CHARIZARD]);

    const enemyPokemon = game.scene.getEnemyField();

    game.move.select(MoveId.FIRE_PLEDGE, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.GRASS_PLEDGE, 1, BattlerIndex.ENEMY_2);

    await game.move.selectEnemyMove(MoveId.SPORE, BattlerIndex.PLAYER_2);
    await game.move.selectEnemyMove(MoveId.SPLASH);

    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2]);

    await game.phaseInterceptor.to("BerryPhase", false);

    enemyPokemon.forEach(p => expect(p.hp).toBe(p.getMaxHp()));
  });

  it("Pledge Moves - should ignore redirection from another Pokemon's Storm Drain", async () => {
    await game.classicMode.startBattle([SpeciesId.BLASTOISE, SpeciesId.CHARIZARD]);

    const enemyPokemon = game.scene.getEnemyField();
    vi.spyOn(enemyPokemon[1], "getAbility").mockReturnValue(allAbilities[AbilityId.STORM_DRAIN]);

    game.move.select(MoveId.WATER_PLEDGE, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, 1);

    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

    await game.phaseInterceptor.to("MoveEndPhase", false);

    expect(enemyPokemon[0].hp).toBeLessThan(enemyPokemon[0].getMaxHp());
    expect(enemyPokemon[1].getStatStage(Stat.SPATK)).toBe(0);
  });

  it("Pledge Moves - should not ignore redirection from another Pokemon's Follow Me", async () => {
    game.override.enemyMoveset([MoveId.FOLLOW_ME, MoveId.SPLASH]);
    await game.classicMode.startBattle([SpeciesId.BLASTOISE, SpeciesId.CHARIZARD]);

    game.move.select(MoveId.WATER_PLEDGE, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, 1);

    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.FOLLOW_ME);

    await game.phaseInterceptor.to("BerryPhase", false);

    const enemyPokemon = game.scene.getEnemyField();
    expect(enemyPokemon[0].hp).toBe(enemyPokemon[0].getMaxHp());
    expect(enemyPokemon[1].hp).toBeLessThan(enemyPokemon[1].getMaxHp());
  });
});
