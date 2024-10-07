import { BattlerTagType } from "#app/enums/battler-tag-type";
import { allMoves } from "#app/data/move";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, it, expect, vi } from "vitest";

describe("Moves - Telekinesis", () => {
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
      .moveset([ Moves.TELEKINESIS, Moves.TACKLE, Moves.MUD_SHOT, Moves.SMACK_DOWN ])
      .battleType("single")
      .enemySpecies(Species.SNORLAX)
      .enemyLevel(60)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset([ Moves.SPLASH ]);
  });

  it("Telekinesis makes the affected vulnerable to most attacking moves regardless of accuracy", async () => {
    await game.classicMode.startBattle([ Species.MAGIKARP ]);

    const enemyOpponent = game.scene.getEnemyPokemon();
    expect(enemyOpponent).toBeDefined();

    game.move.select(Moves.TELEKINESIS);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemyOpponent?.getTag(BattlerTagType.TELEKINESIS)).toBeDefined();
    expect(enemyOpponent?.getTag(BattlerTagType.FLOATING)).toBeDefined();

    await game.toNextTurn();
    vi.spyOn(allMoves[Moves.TACKLE], "accuracy", "get").mockReturnValue(0);
    game.move.select(Moves.TACKLE);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemyOpponent?.hp).toBeLessThan(enemyOpponent?.getMaxHp()!);
  });

  it("Telekinesis makes the affected airborne and immune to most Ground-moves", async () => {
    await game.classicMode.startBattle([ Species.MAGIKARP ]);

    const enemyOpponent = game.scene.getEnemyPokemon();
    expect(enemyOpponent).toBeDefined();

    game.move.select(Moves.TELEKINESIS);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemyOpponent?.getTag(BattlerTagType.TELEKINESIS)).toBeDefined();
    expect(enemyOpponent?.getTag(BattlerTagType.FLOATING)).toBeDefined();

    await game.toNextTurn();
    vi.spyOn(allMoves[Moves.MUD_SHOT], "accuracy", "get").mockReturnValue(100);
    game.move.select(Moves.MUD_SHOT);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemyOpponent?.hp).toEqual(enemyOpponent?.getMaxHp()!);
  });

  it("Telekinesis can still affect Pokemon that have been transformed into invalid Pokemon", async () => {
    game.override.enemyMoveset(Moves.TRANSFORM);
    await game.classicMode.startBattle([ Species.DIGLETT ]);

    const enemyOpponent = game.scene.getEnemyPokemon();
    expect(enemyOpponent).toBeDefined();

    game.move.select(Moves.TELEKINESIS);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemyOpponent?.getTag(BattlerTagType.TELEKINESIS)).toBeDefined();
    expect(enemyOpponent?.getTag(BattlerTagType.FLOATING)).toBeDefined();
  });

  it("Moves like Smack Down and 1000 Arrows remove all effects of Telekinesis from the target Pokemon", async () => {
    await game.classicMode.startBattle([ Species.MAGIKARP ]);

    const enemyOpponent = game.scene.getEnemyPokemon();
    expect(enemyOpponent).toBeDefined();

    game.move.select(Moves.TELEKINESIS);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemyOpponent?.getTag(BattlerTagType.TELEKINESIS)).toBeDefined();
    expect(enemyOpponent?.getTag(BattlerTagType.FLOATING)).toBeDefined();

    await game.toNextTurn();
    game.move.select(Moves.SMACK_DOWN);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemyOpponent?.getTag(BattlerTagType.TELEKINESIS)).toBeUndefined();
    expect(enemyOpponent?.getTag(BattlerTagType.FLOATING)).toBeUndefined();
  });

  it("Ingrain will remove the floating effect of Telekinesis, but not the 100% hit", async () => {
    game.override.enemyMoveset([ Moves.SPLASH, Moves.INGRAIN ]);
    await game.classicMode.startBattle([ Species.MAGIKARP ]);

    const enemyOpponent = game.scene.getEnemyPokemon();
    expect(enemyOpponent).toBeDefined();

    game.move.select(Moves.TELEKINESIS);
    game.forceEnemyMove(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemyOpponent?.getTag(BattlerTagType.TELEKINESIS)).toBeDefined();
    expect(enemyOpponent?.getTag(BattlerTagType.FLOATING)).toBeDefined();

    await game.toNextTurn();
    vi.spyOn(allMoves[Moves.MUD_SHOT], "accuracy", "get").mockReturnValue(0);
    game.move.select(Moves.MUD_SHOT);
    game.forceEnemyMove(Moves.INGRAIN);
    await game.phaseInterceptor.to("TurnEndPhase");
    expect(enemyOpponent?.getTag(BattlerTagType.TELEKINESIS)).toBeDefined();
    expect(enemyOpponent?.getTag(BattlerTagType.INGRAIN)).toBeDefined();
    expect(enemyOpponent?.getTag(BattlerTagType.IGNORE_FLYING)).toBeDefined();
    expect(enemyOpponent?.getTag(BattlerTagType.FLOATING)).toBeUndefined();
    expect(enemyOpponent?.hp).toBeLessThan(enemyOpponent!.getMaxHp());
  });

});
