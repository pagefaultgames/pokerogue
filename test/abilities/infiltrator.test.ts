import { ArenaTagSide } from "#app/data/arena-tag";
import { allMoves } from "#app/data/data-lists";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import GameManager from "#test/testUtils/gameManager";
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
      .moveset([MoveId.TACKLE, MoveId.WATER_GUN, MoveId.SPORE, MoveId.BABY_DOLL_EYES])
      .ability(AbilityId.INFILTRATOR)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it.each([
    {
      effectName: "Light Screen",
      tagType: ArenaTagType.LIGHT_SCREEN,
      move: MoveId.WATER_GUN,
    },
    {
      effectName: "Reflect",
      tagType: ArenaTagType.REFLECT,
      move: MoveId.TACKLE,
    },
    {
      effectName: "Aurora Veil",
      tagType: ArenaTagType.AURORA_VEIL,
      move: MoveId.TACKLE,
    },
  ])("should bypass the target's $effectName", async ({ tagType, move }) => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    const preScreenDmg = enemy.getAttackDamage({ source: player, move: allMoves[move] }).damage;

    game.scene.arena.addTag(tagType, 1, MoveId.NONE, enemy.id, ArenaTagSide.ENEMY, true);

    const postScreenDmg = enemy.getAttackDamage({ source: player, move: allMoves[move] }).damage;

    expect(postScreenDmg).toBe(preScreenDmg);
    expect(player.waveData.abilitiesApplied).toContain(AbilityId.INFILTRATOR);
  });

  it("should bypass the target's Safeguard", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    game.scene.arena.addTag(ArenaTagType.SAFEGUARD, 1, MoveId.NONE, enemy.id, ArenaTagSide.ENEMY, true);

    game.move.select(MoveId.SPORE);

    await game.phaseInterceptor.to("BerryPhase", false);
    expect(enemy.status?.effect).toBe(StatusEffect.SLEEP);
    expect(player.waveData.abilitiesApplied).toContain(AbilityId.INFILTRATOR);
  });

  // TODO: fix this interaction to pass this test
  it.todo("should bypass the target's Mist", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    game.scene.arena.addTag(ArenaTagType.MIST, 1, MoveId.NONE, enemy.id, ArenaTagSide.ENEMY, true);

    game.move.select(MoveId.BABY_DOLL_EYES);

    await game.phaseInterceptor.to("MoveEndPhase");
    expect(enemy.getStatStage(Stat.ATK)).toBe(-1);
    expect(player.waveData.abilitiesApplied).toContain(AbilityId.INFILTRATOR);
  });

  it("should bypass the target's Substitute", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const player = game.scene.getPlayerPokemon()!;
    const enemy = game.scene.getEnemyPokemon()!;

    enemy.addTag(BattlerTagType.SUBSTITUTE, 1, MoveId.NONE, enemy.id);

    game.move.select(MoveId.BABY_DOLL_EYES);

    await game.phaseInterceptor.to("MoveEndPhase");
    expect(enemy.getStatStage(Stat.ATK)).toBe(-1);
    expect(player.waveData.abilitiesApplied).toContain(AbilityId.INFILTRATOR);
  });
});
