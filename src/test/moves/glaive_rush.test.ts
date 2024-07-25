import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#app/test/utils/gameManager";
import Overrides from "#app/overrides";
import { DamagePhase, TurnEndPhase } from "#app/phases";
import { getMovePosition } from "#app/test/utils/gameManagerUtils";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Abilities } from "#app/enums/abilities.js";
import { allMoves } from "#app/data/move.js";


describe("Moves - Glaive Rush", () => {
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
    vi.spyOn(Overrides, "BATTLE_TYPE_OVERRIDE", "get").mockReturnValue("single");
    vi.spyOn(Overrides, "NEVER_CRIT_OVERRIDE", "get").mockReturnValue(true);
    vi.spyOn(Overrides, "OPP_SPECIES_OVERRIDE", "get").mockReturnValue(Species.MAGIKARP);
    vi.spyOn(Overrides, "OPP_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.BALL_FETCH);
    vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue(Array(4).fill(Moves.GLAIVE_RUSH));
    vi.spyOn(Overrides, "STARTER_SPECIES_OVERRIDE", "get").mockReturnValue(Species.KLINK);
    vi.spyOn(Overrides, "ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.UNNERVE);
    vi.spyOn(Overrides, "PASSIVE_ABILITY_OVERRIDE", "get").mockReturnValue(Abilities.FUR_COAT);
    vi.spyOn(Overrides, "MOVESET_OVERRIDE", "get").mockReturnValue([Moves.SHADOW_SNEAK, Moves.AVALANCHE, Moves.SPLASH, Moves.GLAIVE_RUSH]);
  });

  it("takes double damage from attacks", async() => {
    await game.startBattle();
    const enemy = game.scene.getEnemyPokemon();
    enemy.hp = 1000;

    vi.spyOn(game.scene, "randBattleSeedInt").mockReturnValue(0);
    game.doAttack(getMovePosition(game.scene, 0, Moves.SHADOW_SNEAK));
    await game.phaseInterceptor.to(DamagePhase);
    const damageDealt = 1000 - enemy.hp;
    await game.phaseInterceptor.to(TurnEndPhase);
    game.doAttack(getMovePosition(game.scene, 0, Moves.SHADOW_SNEAK));
    await game.phaseInterceptor.to(DamagePhase);
    expect(enemy.hp).toBeLessThanOrEqual(1001 - (damageDealt * 3));

  }, 20000);

  it("always gets hit by attacks", async() => {
    await game.startBattle();
    const enemy = game.scene.getEnemyPokemon();
    enemy.hp = 1000;

    allMoves[Moves.AVALANCHE].accuracy = 0;
    game.doAttack(getMovePosition(game.scene, 0, Moves.AVALANCHE));
    await game.phaseInterceptor.to(TurnEndPhase);
    expect(enemy.hp).toBeLessThan(1000);

  }, 20000);

  it("interacts properly with multi-lens", async() => {
    vi.spyOn(Overrides, "STARTING_HELD_ITEMS_OVERRIDE", "get").mockReturnValue([{name: "MULTI_LENS", count: 2}]);
    vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue(Array(4).fill(Moves.AVALANCHE));
    await game.startBattle();
    const player = game.scene.getPlayerPokemon();
    const enemy = game.scene.getEnemyPokemon();
    enemy.hp = 1000;
    player.hp = 1000;

    allMoves[Moves.AVALANCHE].accuracy = 0;
    game.doAttack(getMovePosition(game.scene, 0, Moves.GLAIVE_RUSH));
    await game.phaseInterceptor.to(TurnEndPhase);
    expect(player.hp).toBeLessThan(1000);
    player.hp = 1000;
    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
    await game.phaseInterceptor.to(TurnEndPhase);
    expect(player.hp).toBe(1000);

  }, 20000);

  it("secondary effects only last until next move", async() => {
    vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue(Array(4).fill(Moves.SHADOW_SNEAK));
    await game.startBattle();
    const player = game.scene.getPlayerPokemon();
    const enemy = game.scene.getEnemyPokemon();
    enemy.hp = 1000;
    player.hp = 1000;
    allMoves[Moves.SHADOW_SNEAK].accuracy = 0;

    game.doAttack(getMovePosition(game.scene, 0, Moves.GLAIVE_RUSH));
    await game.phaseInterceptor.to(TurnEndPhase);
    expect(player.hp).toBe(1000);

    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
    await game.phaseInterceptor.to(TurnEndPhase);
    const damagedHp = player.hp;
    expect(player.hp).toBeLessThan(1000);

    game.doAttack(getMovePosition(game.scene, 0, Moves.SPLASH));
    await game.phaseInterceptor.to(TurnEndPhase);
    expect(player.hp).toBe(damagedHp);

  }, 20000);

  it("secondary effects are removed upon switching", async() => {
    vi.spyOn(Overrides, "OPP_MOVESET_OVERRIDE", "get").mockReturnValue(Array(4).fill(Moves.SHADOW_SNEAK));
    vi.spyOn(Overrides, "STARTER_SPECIES_OVERRIDE", "get").mockReturnValue(0);
    await game.startBattle([Species.KLINK, Species.FEEBAS]);
    const player = game.scene.getPlayerPokemon();
    const enemy = game.scene.getEnemyPokemon();
    enemy.hp = 1000;
    allMoves[Moves.SHADOW_SNEAK].accuracy = 0;

    game.doAttack(getMovePosition(game.scene, 0, Moves.GLAIVE_RUSH));
    await game.phaseInterceptor.to(TurnEndPhase);
    expect(player.hp).toBe(player.getMaxHp());

    game.doSwitchPokemon(1);
    await game.phaseInterceptor.to(TurnEndPhase);
    game.doSwitchPokemon(1);
    await game.phaseInterceptor.to(TurnEndPhase);
    expect(player.hp).toBe(player.getMaxHp());

  }, 20000);
});
