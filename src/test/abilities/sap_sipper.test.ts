import { Stat } from "#enums/stat";
import { TerrainType } from "#app/data/terrain";
import { MoveEndPhase } from "#app/phases/move-end-phase";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import { Abilities } from "#enums/abilities";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { allMoves, RandomMoveAttr } from "#app/data/move";

// See also: TypeImmunityAbAttr
describe("Abilities - Sap Sipper", () => {
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
    game.override.battleType("single")
      .disableCrits()
      .ability(Abilities.SAP_SIPPER)
      .enemySpecies(Species.RATTATA)
      .enemyAbility(Abilities.SAP_SIPPER)
      .enemyMoveset(Moves.SPLASH);
  });

  it("raises ATK stat stage by 1 and block effects when activated against a grass attack", async() => {
    const moveToUse = Moves.LEAFAGE;

    game.override.moveset(moveToUse);

    await game.classicMode.startBattle([ Species.BULBASAUR ]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const initialEnemyHp = enemyPokemon.hp;

    game.move.select(moveToUse);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(initialEnemyHp - enemyPokemon.hp).toBe(0);
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(1);
  });

  it("raises ATK stat stage by 1 and block effects when activated against a grass status move", async() => {
    const moveToUse = Moves.SPORE;

    game.override.moveset(moveToUse);

    await game.classicMode.startBattle([ Species.BULBASAUR ]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(moveToUse);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(enemyPokemon.status).toBeUndefined();
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(1);
  });

  it("do not activate against status moves that target the field", async () => {
    const moveToUse = Moves.GRASSY_TERRAIN;

    game.override.moveset(moveToUse);

    await game.classicMode.startBattle([ Species.BULBASAUR ]);

    game.move.select(moveToUse);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(game.scene.arena.terrain).toBeDefined();
    expect(game.scene.arena.terrain!.terrainType).toBe(TerrainType.GRASSY);
    expect(game.scene.getEnemyPokemon()!.getStatStage(Stat.ATK)).toBe(0);
  });

  it("activate once against multi-hit grass attacks", async () => {
    const moveToUse = Moves.BULLET_SEED;

    game.override.moveset(moveToUse);

    await game.classicMode.startBattle([ Species.BULBASAUR ]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const initialEnemyHp = enemyPokemon.hp;

    game.move.select(moveToUse);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(initialEnemyHp - enemyPokemon.hp).toBe(0);
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(1);
  });

  it("do not activate against status moves that target the user", async () => {
    const moveToUse = Moves.SPIKY_SHIELD;

    game.override.moveset(moveToUse);

    await game.classicMode.startBattle([ Species.BULBASAUR ]);

    const playerPokemon = game.scene.getPlayerPokemon()!;

    game.move.select(moveToUse);

    await game.phaseInterceptor.to(MoveEndPhase);

    expect(playerPokemon.getTag(BattlerTagType.SPIKY_SHIELD)).toBeDefined();

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(playerPokemon.getStatStage(Stat.ATK)).toBe(0);
    expect(game.phaseInterceptor.log).not.toContain("ShowAbilityPhase");
  });

  it("activate once against multi-hit grass attacks (metronome)", async () => {
    const moveToUse = Moves.METRONOME;

    const randomMoveAttr = allMoves[Moves.METRONOME].findAttr(attr => attr instanceof RandomMoveAttr) as RandomMoveAttr;
    vi.spyOn(randomMoveAttr, "getMoveOverride").mockReturnValue(Moves.BULLET_SEED);

    game.override.moveset(moveToUse);

    await game.classicMode.startBattle([ Species.BULBASAUR ]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const initialEnemyHp = enemyPokemon.hp;

    game.move.select(moveToUse);

    await game.phaseInterceptor.to(TurnEndPhase);

    expect(initialEnemyHp - enemyPokemon.hp).toBe(0);
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(1);
  });

  it("still activates regardless of accuracy check", async () => {
    game.override.moveset(Moves.LEAF_BLADE);

    await game.classicMode.startBattle([ Species.BULBASAUR ]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.LEAF_BLADE);
    await game.phaseInterceptor.to("MoveEffectPhase");

    await game.move.forceMiss();
    await game.phaseInterceptor.to("BerryPhase", false);
    expect(enemyPokemon.getStatStage(Stat.ATK)).toBe(1);
  });
});
