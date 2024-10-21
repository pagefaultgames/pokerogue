import { ArenaTagSide } from "#app/data/arena-tag";
import { allMoves } from "#app/data/move";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Infiltrator", () => {
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
      .moveset([ Moves.TACKLE, Moves.WATER_GUN, Moves.SPORE, Moves.BABY_DOLL_EYES ])
      .ability(Abilities.INFILTRATOR)
      .battleType("single")
      .disableCrits()
      .enemySpecies(Species.SNORLAX)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it.each([
    { effectName: "Light Screen", tagType: ArenaTagType.LIGHT_SCREEN, move: Moves.WATER_GUN },
    { effectName: "Reflect", tagType: ArenaTagType.REFLECT, move: Moves.TACKLE },
    { effectName: "Aurora Veil", tagType: ArenaTagType.AURORA_VEIL, move: Moves.TACKLE }
  ])("should bypass the target's $effectName", async ({ tagType, move }) => {
    await game.classicMode.startBattle([ Species.MAGIKARP ]);

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    const preScreenDmg = enemy.getAttackDamage(player, allMoves[move]).damage;

    game.scene.arena.addTag(tagType, 1, Moves.NONE, enemy.id, ArenaTagSide.ENEMY, true);

    const postScreenDmg = enemy.getAttackDamage(player, allMoves[move]).damage;

    expect(postScreenDmg).toBe(preScreenDmg);
    expect(player.battleData.abilitiesApplied[0]).toBe(Abilities.INFILTRATOR);
  });

  it("should bypass the target's Safeguard", async () => {
    await game.classicMode.startBattle([ Species.MAGIKARP ]);

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    game.scene.arena.addTag(ArenaTagType.SAFEGUARD, 1, Moves.NONE, enemy.id, ArenaTagSide.ENEMY, true);

    game.move.select(Moves.SPORE);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(enemy.status?.effect).toBe(StatusEffect.SLEEP);
    expect(player.battleData.abilitiesApplied[0]).toBe(Abilities.INFILTRATOR);
  });

  // TODO: fix this interaction to pass this test
  it.skip("should bypass the target's Mist", async () => {
    await game.classicMode.startBattle([ Species.MAGIKARP ]);

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    game.scene.arena.addTag(ArenaTagType.MIST, 1, Moves.NONE, enemy.id, ArenaTagSide.ENEMY, true);

    game.move.select(Moves.BABY_DOLL_EYES);

    await game.phaseInterceptor.to("MoveEndPhase");
    expect(enemy.getStatStage(Stat.ATK)).toBe(-1);
    expect(player.battleData.abilitiesApplied[0]).toBe(Abilities.INFILTRATOR);
  });

  it("should bypass the target's Substitute", async () => {
    await game.classicMode.startBattle([ Species.MAGIKARP ]);

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    enemy.addTag(BattlerTagType.SUBSTITUTE, 1, Moves.NONE, enemy.id);

    game.move.select(Moves.BABY_DOLL_EYES);

    await game.phaseInterceptor.to("MoveEndPhase");
    expect(enemy.getStatStage(Stat.ATK)).toBe(-1);
    expect(player.battleData.abilitiesApplied[0]).toBe(Abilities.INFILTRATOR);
  });
});
