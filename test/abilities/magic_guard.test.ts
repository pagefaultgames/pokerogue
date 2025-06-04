import { BattlerIndex } from "#app/battle";
import { ArenaTagSide } from "#app/data/arena-tag";
import { allMoves } from "#app/data/data-lists";
import { getStatusEffectCatchRateMultiplier } from "#app/data/status-effect";
import { Abilities } from "#enums/abilities";
import { ArenaTagType } from "#enums/arena-tag-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { StatusEffect } from "#enums/status-effect";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Magic Guard", () => {
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
      .ability(Abilities.MAGIC_GUARD)
      .enemySpecies(Species.BLISSEY)
      .enemyAbility(Abilities.NO_GUARD)
      .startingLevel(100)
      .enemyLevel(100);
  });

  //Bulbapedia Reference: https://bulbapedia.bulbagarden.net/wiki/Magic_Guard_(Ability)

  it.each<{ name: string; move?: Moves; enemyMove?: Moves }>([
    { name: "Non-Volatile Status Conditions", enemyMove: Moves.TOXIC },
    { name: "Volatile Status Conditions", enemyMove: Moves.LEECH_SEED },
    { name: "Crash Damage", move: Moves.HIGH_JUMP_KICK },
    { name: "Variable Recoil Moves", move: Moves.DOUBLE_EDGE },
    { name: "HP% Recoil Moves", move: Moves.CHLOROBLAST },
  ])("should prevent damage from $name", async ({ move = Moves.SPLASH, enemyMove = Moves.SPLASH }) => {
    await game.classicMode.startBattle([Species.MAGIKARP]);
    // force a miss on HJK
    vi.spyOn(allMoves[Moves.HIGH_JUMP_KICK], "accuracy", "get").mockReturnValue(0);

    game.move.use(move);
    await game.move.forceEnemyMove(enemyMove);
    await game.phaseInterceptor.to("TurnEndPhase");

    const magikarp = game.field.getPlayerPokemon();
    expect(magikarp.hp).toBe(magikarp.getMaxHp());
  });

  it.each<{ abName: string; move?: Moves; enemyMove?: Moves; passive?: Abilities; enemyAbility?: Abilities }>([
    { abName: "Bad Dreams", enemyMove: Moves.SPORE, enemyAbility: Abilities.BAD_DREAMS },
    { abName: "Aftermath", move: Moves.PSYCHIC_FANGS, enemyAbility: Abilities.AFTERMATH },
    { abName: "Innards Out", move: Moves.PSYCHIC_FANGS, enemyAbility: Abilities.INNARDS_OUT },
    { abName: "Rough Skin", move: Moves.PSYCHIC_FANGS, enemyAbility: Abilities.ROUGH_SKIN },
    { abName: "Dry Skin", move: Moves.SUNNY_DAY, passive: Abilities.DRY_SKIN },
    { abName: "Liquid Ooze", move: Moves.DRAIN_PUNCH, enemyAbility: Abilities.LIQUID_OOZE },
  ])(
    "should prevent damage from $abName",
    async ({
      move = Moves.SPLASH,
      enemyMove = Moves.SPLASH,
      passive = Abilities.BALL_FETCH,
      enemyAbility = Abilities.BALL_FETCH,
    }) => {
      game.override.enemyLevel(1).passiveAbility(passive).enemyAbility(enemyAbility);
      await game.classicMode.startBattle([Species.MAGIKARP]);

      game.move.use(move);
      await game.move.forceEnemyMove(enemyMove);
      await game.phaseInterceptor.to("TurnEndPhase");

      const magikarp = game.field.getPlayerPokemon();
      expect(magikarp.hp).toBe(magikarp.getMaxHp());
    },
  );

  it.each<{ name: string; move?: Moves; enemyMove?: Moves }>([
    { name: "Struggle recoil", move: Moves.STRUGGLE },
    { name: "Self-induced HP cutting", move: Moves.BELLY_DRUM },
    { name: "Confusion self-damage", enemyMove: Moves.CONFUSE_RAY },
  ])("should not prevent damage from $name", async ({ move = Moves.SPLASH, enemyMove = Moves.SPLASH }) => {
    game.override.confusionActivation(true);
    await game.classicMode.startBattle([Species.MAGIKARP]);

    game.move.use(move);
    await game.move.forceEnemyMove(enemyMove);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]); // forces enemy confusion to whiff own attack
    await game.phaseInterceptor.to("TurnEndPhase");

    const leadPokemon = game.field.getPlayerPokemon();
    expect(leadPokemon.hp).toBeLessThan(leadPokemon.getMaxHp());
  });

  it("should preserve toxic turn count and deal appropriate damage when ability lost", async () => {
    game.override.statusEffect(StatusEffect.TOXIC);
    await game.classicMode.startBattle([Species.MAGIKARP]);

    game.move.use(Moves.SPLASH);
    await game.move.forceEnemyMove(Moves.SPLASH);
    await game.toNextTurn();

    const magikarp = game.field.getPlayerPokemon();
    expect(magikarp.hp).toBe(magikarp.getMaxHp());
    expect(magikarp.status?.toxicTurnCount).toBe(1);

    // have a few turns pass
    game.move.use(Moves.SPLASH);
    await game.toNextTurn();
    game.move.use(Moves.SPLASH);
    await game.toNextTurn();
    game.move.use(Moves.SPLASH);
    await game.toNextTurn();
    expect(magikarp.status?.toxicTurnCount).toBe(4);

    game.move.use(Moves.SPLASH);
    await game.move.forceEnemyMove(Moves.GASTRO_ACID);
    await game.toNextTurn();

    expect(magikarp.status?.toxicTurnCount).toBe(5);
    expect(magikarp.getHpRatio(true)).toBeCloseTo(11 / 16, 1);
  });

  it("should preserve burn physical damage halving & status catch boost", async () => {
    game.override.startingLevel(100).enemyLevel(100);
    await game.classicMode.startBattle([Species.MAGIKARP]);

    // NB: Burn applies directly to the physical dmg formula, so we can't just check attack here
    game.move.use(Moves.TACKLE);
    await game.move.forceEnemyMove(Moves.SPLASH);
    await game.toNextTurn();

    const magikarp = game.field.getPlayerPokemon();
    expect(magikarp.hp).toBe(magikarp.getMaxHp());

    const blissey = game.field.getEnemyPokemon();
    const prevDmg = blissey.getInverseHp();
    blissey.hp = blissey.getMaxHp();

    magikarp.trySetStatus(StatusEffect.BURN, false, null, 0, null, true);
    expect(magikarp.status?.effect).toBe(StatusEffect.BURN);
    expect(getStatusEffectCatchRateMultiplier(magikarp.status!.effect)).toBe(1.5);

    game.move.use(Moves.TACKLE);
    await game.toNextTurn();

    const burntDmg = blissey.getInverseHp();
    expect(burntDmg).toBeCloseTo(prevDmg / 2, 0);
  });

  it("should prevent damage from entry hazards, but not Toxic Spikes poison", async () => {
    game.scene.arena.addTag(ArenaTagType.SPIKES, -1, Moves.SPIKES, 0, ArenaTagSide.PLAYER);
    game.scene.arena.addTag(ArenaTagType.TOXIC_SPIKES, -1, Moves.TOXIC_SPIKES, 0, ArenaTagSide.PLAYER);
    await game.classicMode.startBattle([Species.MAGIKARP]);

    // Magic guard prevented damage but not poison
    const player = game.field.getPlayerPokemon();
    expect(player.hp).toBe(player.getMaxHp());
    expect(player.status?.effect).toBe(StatusEffect.POISON);
  });
});
