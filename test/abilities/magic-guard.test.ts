import { getStatusEffectCatchRateMultiplier } from "#data/status-effect";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
import { toDmgValue } from "#utils/common";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("AbilityId - Magic Guard", () => {
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
      .ability(AbilityId.MAGIC_GUARD)
      .enemySpecies(SpeciesId.BLISSEY)
      .enemyAbility(AbilityId.NO_GUARD)
      .startingLevel(100)
      .enemyLevel(100);
  });

  //Bulbapedia Reference: https://bulbapedia.bulbagarden.net/wiki/Magic_Guard_(Ability)

  it.each<{ name: string; move?: MoveId; enemyMove?: MoveId }>([
    { name: "Non-Volatile Status Conditions", enemyMove: MoveId.TOXIC },
    { name: "Volatile Status Conditions", enemyMove: MoveId.LEECH_SEED },
    { name: "Crash Damage", move: MoveId.HIGH_JUMP_KICK, enemyMove: MoveId.PROTECT }, // Protect triggers crash damage
    { name: "Variable Recoil Moves", move: MoveId.DOUBLE_EDGE },
    { name: "HP% Recoil Moves", move: MoveId.CHLOROBLAST },
  ])("should prevent damage from $name", async ({ move = MoveId.SPLASH, enemyMove = MoveId.SPLASH }) => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    game.move.use(move);
    await game.move.forceEnemyMove(enemyMove);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toEndOfTurn();

    const magikarp = game.field.getPlayerPokemon();
    expect(magikarp.hp).toBe(magikarp.getMaxHp());
  });

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
      await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

      game.move.use(move);
      await game.move.forceEnemyMove(enemyMove);
      await game.toEndOfTurn();

      const magikarp = game.field.getPlayerPokemon();
      expect(magikarp.hp).toBe(magikarp.getMaxHp());
    },
  );

  it.each<{ name: string; move?: MoveId; enemyMove?: MoveId }>([
    { name: "Struggle recoil", move: MoveId.STRUGGLE },
    { name: "Self-induced HP cutting", move: MoveId.BELLY_DRUM },
    { name: "Confusion self-damage", enemyMove: MoveId.CONFUSE_RAY },
  ])("should not prevent damage from $name", async ({ move = MoveId.SPLASH, enemyMove = MoveId.SPLASH }) => {
    game.override.confusionActivation(true);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    game.move.use(move);
    await game.move.forceEnemyMove(enemyMove);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]); // Ensure confuse ray goes first
    await game.toEndOfTurn();

    const magikarp = game.field.getPlayerPokemon();
    expect(magikarp.hp).toBeLessThan(magikarp.getMaxHp());
  });

  it("should preserve toxic turn count and deal appropriate damage when disabled", async () => {
    game.override.statusEffect(StatusEffect.TOXIC);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    const magikarp = game.field.getPlayerPokemon();
    expect(magikarp.hp).toBe(magikarp.getMaxHp());
    expect(magikarp.status?.toxicTurnCount).toBe(1);

    // have a few turns pass
    game.move.use(MoveId.SPLASH);
    await game.toNextTurn();
    game.move.use(MoveId.SPLASH);
    await game.toNextTurn();
    game.move.use(MoveId.SPLASH);
    await game.toNextTurn();

    expect(magikarp.status?.toxicTurnCount).toBe(4);

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.GASTRO_ACID);
    await game.toNextTurn();

    expect(magikarp.status?.toxicTurnCount).toBe(5);
    expect(magikarp.getHpRatio(true)).toBeCloseTo(11 / 16, 1);
  });

  it("should preserve burn physical damage halving & status catch boost", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    // NB: Burn applies directly to the physical dmg formula, so we can't just check attack here
    game.move.use(MoveId.TACKLE);
    await game.move.forceEnemyMove(MoveId.WILL_O_WISP);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    const magikarp = game.field.getPlayerPokemon();
    expect(magikarp.hp).toBe(magikarp.getMaxHp());
    expect(magikarp.status?.effect).toBe(StatusEffect.BURN);
    expect(getStatusEffectCatchRateMultiplier(magikarp.status!.effect)).toBe(1.5);

    // Heal blissey to full & use tackle again
    const blissey = game.field.getEnemyPokemon();
    const prevDmg = blissey.getInverseHp();
    blissey.hp = blissey.getMaxHp();

    game.move.use(MoveId.TACKLE);
    await game.toNextTurn();

    const burntDmg = blissey.getInverseHp();
    expect(burntDmg).toBeCloseTo(toDmgValue(prevDmg / 2), 0);
  });

  it("should prevent damage from entry hazards, but not Toxic Spikes poison", async () => {
    game.scene.arena.addTag(ArenaTagType.SPIKES, -1, MoveId.SPIKES, 0, ArenaTagSide.PLAYER);
    game.scene.arena.addTag(ArenaTagType.TOXIC_SPIKES, -1, MoveId.TOXIC_SPIKES, 0, ArenaTagSide.PLAYER);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    // Magic guard prevented damage but not poison
    const player = game.field.getPlayerPokemon();
    expect(player.hp).toBe(player.getMaxHp());
    expect(player.status?.effect).toBe(StatusEffect.POISON);
  });
});
