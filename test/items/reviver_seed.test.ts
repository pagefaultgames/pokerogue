import { BattlerIndex } from "#app/battle";
import { HitResult } from "#app/field/pokemon";
import { PokemonInstantReviveModifier } from "#app/modifier/modifier";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Stat } from "#enums/stat";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Items - Reviver Seed", () => {
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
      .moveset([Moves.SPLASH, Moves.TACKLE, Moves.LUMINA_CRASH])
      .ability(Abilities.BALL_FETCH)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.NO_GUARD)
      .startingHeldItems([{ name: "REVIVER_SEED" }])
      .enemyHeldItems([{ name: "REVIVER_SEED" }])
      .enemyMoveset(Moves.SPLASH)
      .startingLevel(100)
      .enemyLevel(100); // makes hp tests more accurate due to rounding
  });

  it("should be consumed upon fainting to revive the holder, removing temporary effects and healing to 50% max HP", async () => {
    await game.classicMode.startBattle([Species.MAGIKARP]);

    const enemy = game.scene.getEnemyPokemon()!;
    enemy.hp = 1;
    enemy.setStatStage(Stat.ATK, 6);

    expect(enemy.getHeldItems()[0]).toBeInstanceOf(PokemonInstantReviveModifier);
    game.move.select(Moves.TACKLE);
    await game.phaseInterceptor.to("TurnEndPhase");

    // Enemy ate seed, was revived and healed to half HP, clearing its attack boost at the same time.
    expect(enemy.isFainted()).toBeFalsy();
    expect(enemy.getHpRatio()).toBeCloseTo(0.5);
    expect(enemy.getHeldItems()[0]).toBeUndefined();
    expect(enemy.getStatStage(Stat.ATK)).toBe(0);
    expect(enemy.turnData.acted).toBe(true);
  });

  it("should nullify move effects on the killing blow and interrupt multi hits", async () => {
    // Give player a 4 hit lumina crash that lowers spdef by 2 stages per hit
    game.override.ability(Abilities.PARENTAL_BOND).startingHeldItems([
      { name: "REVIVER_SEED", count: 1 },
      { name: "MULTI_LENS", count: 2 },
    ]);
    await game.classicMode.startBattle([Species.MAGIKARP]);

    // give enemy 3 hp, dying 3 hits into the move
    const enemy = game.scene.getEnemyPokemon()!;
    enemy.hp = 3;
    vi.spyOn(enemy, "getAttackDamage").mockReturnValue({ cancelled: false, damage: 1, result: HitResult.EFFECTIVE });

    game.move.select(Moves.LUMINA_CRASH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("FaintPhase", false);
    expect(enemy.getStatStage(Stat.SPDEF)).toBe(-4); // killing hit effect got nullified due to fainting the target
    expect(enemy.getAttackDamage).toHaveBeenCalledTimes(3);

    await game.phaseInterceptor.to("TurnEndPhase");

    // Attack was cut short due to lack of targets, after which the enemy was revived and their stat stages reset
    expect(enemy.isFainted()).toBeFalsy();
    expect(enemy.getStatStage(Stat.SPDEF)).toBe(0);
    expect(enemy.getHpRatio()).toBeCloseTo(0.5);
    expect(enemy.getHeldItems()[0]).toBeUndefined();

    const player = game.scene.getPlayerPokemon()!;
    expect(player.turnData.hitsLeft).toBe(1);
  });

  it.each([
    { moveType: "Special Moves", move: Moves.WATER_GUN },
    { moveType: "Physical Moves", move: Moves.TACKLE },
    { moveType: "Fixed Damage Moves", move: Moves.SEISMIC_TOSS },
    { moveType: "Final Gambit", move: Moves.FINAL_GAMBIT },
    { moveType: "Counter Moves", move: Moves.COUNTER },
    { moveType: "OHKOs", move: Moves.SHEER_COLD },
    { moveType: "Confusion Self-hits", move: Moves.CONFUSE_RAY },
  ])("should activate from $moveType", async ({ move }) => {
    game.override.enemyMoveset(move).confusionActivation(true);
    await game.classicMode.startBattle([Species.MAGIKARP, Species.FEEBAS]);
    const player = game.scene.getPlayerPokemon()!;
    player.hp = 1;

    const reviverSeed = player.getHeldItems()[0] as PokemonInstantReviveModifier;
    const seedSpy = vi.spyOn(reviverSeed, "apply");

    game.move.select(Moves.TACKLE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("BerryPhase");

    expect(player.isFainted()).toBe(false);
    expect(seedSpy).toHaveBeenCalled();
  });

  // Damaging tests
  it.each([
    { moveType: "Salt Cure", move: Moves.SALT_CURE },
    { moveType: "Leech Seed", move: Moves.LEECH_SEED },
    { moveType: "Partial Trapping Move", move: Moves.WHIRLPOOL },
    { moveType: "Status Effect", move: Moves.WILL_O_WISP },
    { moveType: "Weather", move: Moves.SANDSTORM },
  ])("should not activate from $moveType damage", async ({ move }) => {
    game.override.moveset(move).enemyMoveset(Moves.ENDURE);
    await game.classicMode.startBattle([Species.MAGIKARP, Species.FEEBAS]);
    const enemy = game.scene.getEnemyPokemon()!;
    enemy.hp = 1;

    game.move.select(move);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(enemy.isFainted()).toBeTruthy();
  });

  // Self-damage tests
  it.each([
    { moveType: "Recoil", move: Moves.DOUBLE_EDGE },
    { moveType: "Sacrificial", move: Moves.EXPLOSION },
    { moveType: "Ghost-type Curse", move: Moves.CURSE },
    { moveType: "Liquid Ooze", move: Moves.GIGA_DRAIN },
  ])("should not activate from $moveType self-damage", async ({ move }) => {
    game.override.moveset(move).enemyAbility(Abilities.LIQUID_OOZE);
    await game.classicMode.startBattle([Species.GASTLY, Species.FEEBAS]);
    const player = game.scene.getPlayerPokemon()!;
    player.hp = 1;

    const playerSeed = player.getHeldItems()[0] as PokemonInstantReviveModifier;
    const seedSpy = vi.spyOn(playerSeed, "apply");

    game.move.select(move);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(player.isFainted()).toBeTruthy();
    expect(seedSpy).not.toHaveBeenCalled();
  });

  it("should not activate from Destiny Bond fainting", async () => {
    game.override
      .enemyLevel(100)
      .startingLevel(1)
      .enemySpecies(Species.MAGIKARP)
      .moveset(Moves.DESTINY_BOND)
      .startingHeldItems([]) // reset held items to nothing so user doesn't revive and not trigger Destiny Bond
      .enemyMoveset(Moves.TACKLE);
    await game.classicMode.startBattle([Species.MAGIKARP, Species.FEEBAS]);
    const player = game.scene.getPlayerPokemon()!;
    player.hp = 1;
    const enemy = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.DESTINY_BOND);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(enemy.isFainted()).toBeTruthy();
  });
});
