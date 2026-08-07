import { getStatusEffectCatchRateMultiplier } from "#data/status-effect";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/framework/game-manager";
import { toDmgValue } from "#utils/common";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Ability - Magic Guard", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .ability(AbilityId.MAGIC_GUARD)
      .enemySpecies(SpeciesId.BLISSEY)
      .enemyAbility(AbilityId.NO_GUARD)
      .startingLevel(100)
      .enemyLevel(100);
  });

  // Bulbapedia Reference: https://bulbapedia.bulbagarden.net/wiki/Magic_Guard_(Ability)

  it.each<{ name: string; move?: MoveId; enemyMove?: MoveId }>([
    { name: "Non-Volatile Status Conditions", enemyMove: MoveId.TOXIC },
    { name: "Volatile Status Conditions", enemyMove: MoveId.LEECH_SEED },
    // TODO: Add a test that Protect triggers crash damage if not already existing,
    // then mention the file name it's included in
    { name: "Crash Damage", move: MoveId.HIGH_JUMP_KICK, enemyMove: MoveId.PROTECT }, 
    { name: "Variable Recoil Moves", move: MoveId.DOUBLE_EDGE },
    { name: "HP% Recoil Moves", move: MoveId.CHLOROBLAST },
  ])("should prevent damage from $name", async ({ move = MoveId.SPLASH, enemyMove = MoveId.SPLASH }) => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    game.move.use(move);
    await game.move.forceEnemyMove(enemyMove);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toEndOfTurn();

    const player = game.field.getPlayerPokemon();
    expect(player).toHaveAbilityApplied(AbilityId.MAGIC_GUARD);
    expect(player).toHaveFullHp();
  });

  // biome-ignore format: prefer pre-2.3.6 formatting
  it.each<{ abName: string; move?: MoveId; enemyMove?: MoveId; passive?: AbilityId; enemyAbility?: AbilityId }>([
    { abName: "Bad Dreams", enemyMove: MoveId.SPORE, enemyAbility: AbilityId.BAD_DREAMS },
    { abName: "Aftermath", move: MoveId.PSYCHIC_FANGS, enemyAbility: AbilityId.AFTERMATH },
    { abName: "Innards Out", move: MoveId.PSYCHIC_FANGS, enemyAbility: AbilityId.INNARDS_OUT },
    { abName: "Rough Skin", move: MoveId.PSYCHIC_FANGS, enemyAbility: AbilityId.ROUGH_SKIN },
    { abName: "Dry Skin", move: MoveId.SUNNY_DAY, passive: AbilityId.DRY_SKIN },
    { abName: "Liquid Ooze", move: MoveId.DRAIN_PUNCH, enemyAbility: AbilityId.LIQUID_OOZE },
  ])(
    "should prevent damage from $abName",
    async ({
      move = MoveId.SPLASH,
      enemyMove = MoveId.SPLASH,
      passive = AbilityId.BALL_FETCH,
      enemyAbility = AbilityId.BALL_FETCH,
    }) => {
      game.override.enemyLevel(1).passiveAbility(passive).enemyAbility(enemyAbility);
      await game.classicMode.startBattle(SpeciesId.MAGIKARP);

      game.move.use(move);
      await game.move.forceEnemyMove(enemyMove);
      await game.toEndOfTurn();

      const player = game.field.getPlayerPokemon();
      const enemy = game.field.getEnemyPokemon();
      expect(player).toHaveAbilityApplied(AbilityId.MAGIC_GUARD);
      expect(enemy).toHaveAbilityApplied(ability);
      expect(player).toHaveFullHp();
    },
  );

  it.each<{ name: string; move?: MoveId; enemyMove?: MoveId }>([
    { name: "Struggle recoil", move: MoveId.STRUGGLE },
    { name: "Self-induced HP cutting", move: MoveId.BELLY_DRUM },
    { name: "Confusion self-damage", enemyMove: MoveId.CONFUSE_RAY },
  ])("should not trigger for $name", async ({ move = MoveId.SPLASH, enemyMove = MoveId.SPLASH }) => {
    game.override.confusionActivation(true);
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    game.move.use(move);
    await game.move.forceEnemyMove(enemyMove);
    game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]); // Ensure confuse ray goes first
    await game.toEndOfTurn();

    const player = game.field.getPlayerPokemon();
    expect(player).not.toHaveAbilityApplied(AbilityId.MAGIC_GUARD);
    expect(player).not.toHaveFullHp();
  });

  it("should preserve toxic turn count and deal appropriate damage when disabled", async () => {
    game.override.statusEffect(StatusEffect.TOXIC);
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    const player = game.field.getPlayerPokemon();
    expect(player).toHaveAbilityApplied(AbilityId.MAGIC_GUARD);
    expect(player).toHaveFullHp();
    expect(player.status?.toxicTurnCount).toBe(1);

    // pass a few turns
    game.move.use(MoveId.SPLASH);
    await game.toNextTurn();
    game.move.use(MoveId.SPLASH);
    await game.toNextTurn();
    game.move.use(MoveId.SPLASH);
    await game.toNextTurn();

    expect(player.status?.toxicTurnCount).toBe(4);

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.GASTRO_ACID);
    await game.toNextTurn();

    expect(player.status?.toxicTurnCount).toBe(5);
    expect(player.getHpRatio(true)).toBeCloseTo(11 / 16, 1);
  });

  it("should preserve burn physical damage halving & status catch boost", async () => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    // NB: Burn applies directly to the physical dmg formula, so we can't just check attack here
    // TODO: If a direct "get damage multiplier" func is added, use that instead
    game.move.use(MoveId.TACKLE);
    await game.move.forceEnemyMove(MoveId.WILL_O_WISP);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    const player = game.field.getPlayerPokemon();
    expect(player).toHaveAbilityApplied(AbilityId.MAGIC_GUARD);
    expect(player).toHaveFullHp();
    expect(player).toHaveStatusEffect(StatusEffect.BURN);
    expect(getStatusEffectCatchRateMultiplier(magikarp.status!.effect)).toBe(1.5);

    // Heal enemy to full & use tackle again
    const enemy = game.field.getEnemyPokemon();
    const prevDmg = enemy.getInverseHp();
    enemy.hp = enemy.getMaxHp();

    game.move.use(MoveId.TACKLE);
    await game.toNextTurn();

    const burntDmg = enemy.getInverseHp();
    expect(burntDmg).toBeCloseTo(toDmgValue(prevDmg / 2), 0);
  });

  it("should prevent damage from entry hazards, but not Toxic Spikes poison", async () => {
    game.scene.arena.addTag(ArenaTagType.SPIKES, -1, MoveId.SPIKES, 0, ArenaTagSide.PLAYER);
    game.scene.arena.addTag(ArenaTagType.TOXIC_SPIKES, -1, MoveId.TOXIC_SPIKES, 0, ArenaTagSide.PLAYER);
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    // Magic guard prevented damage but not poison
    const player = game.field.getPlayerPokemon();
    expect(player).toHaveAbilityApplied(AbilityId.MAGIC_GUARD);
    expect(player).toHaveFullHp();
    expect(player).toHaveStatusEffect(StatusEffect.POISON);
  });

  it("should prevent Spiky Shield contact damage for the attacker", async () => {
    await game.classicMode.startBattle(SpeciesId.MAGIKARP);

    game.move.use(MoveId.TACKLE);
    await game.move.forceEnemyMove(MoveId.SPIKY_SHIELD);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();
    expect(player).toHaveAbilityApplied(AbilityId.MAGIC_GUARD);
    expect(player).toHaveFullHp();
    expect(enemy).toHaveFullHp();

    // regression test: used to check defender's abiliry
    game.field.mockAbility(player, AbilityId.BALL_FETCH);
    game.field.mockAbility(enemy, AbilityId.MAGIC_GUARD);
    player.waveData.abilitiesApplied.clear();
    enemy.waveData.abilitiesApplied.clear();

    game.move.use(MoveId.TACKLE);
    await game.move.forceEnemyMove(MoveId.SPIKY_SHIELD);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toEndOfTurn();

    expect(enemy).not.toHaveAbilityApplied(AbilityId.MAGIC_GUARD);
    expect(player).not.toHaveFullHp();
});
