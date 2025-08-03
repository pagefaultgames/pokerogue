import type { ModifierOverride } from "#app/modifier/modifier-type";
import type { SwitchSummonPhase } from "#app/phases/switch-summon-phase";
import { toDmgValue } from "#app/utils/common";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattleType } from "#enums/battle-type";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { HitResult } from "#enums/hit-result";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Wimp Out/Emergency Exit", () => {
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
      .battleStyle("single")
      .ability(AbilityId.WIMP_OUT)
      .enemySpecies(SpeciesId.NINJASK)
      .enemyPassiveAbility(AbilityId.NO_GUARD)
      .enemyMoveset(MoveId.FALSE_SWIPE)
      .criticalHits(false);
  });

  function confirmSwitch(): void {
    const [pokemon1, pokemon2] = game.scene.getPlayerParty();

    expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");

    expect(pokemon1.species.speciesId).not.toBe(SpeciesId.WIMPOD);

    expect(pokemon2.species.speciesId).toBe(SpeciesId.WIMPOD);
    expect(pokemon2).toHaveFainted();
    expect(pokemon2.getHpRatio()).toBeLessThan(0.5);
  }

  function confirmNoSwitch(): void {
    const [pokemon1, pokemon2] = game.scene.getPlayerParty();

    expect(game.phaseInterceptor.log).not.toContain("SwitchSummonPhase");

    expect(pokemon2.species.speciesId).not.toBe(SpeciesId.WIMPOD);

    expect(pokemon1.species.speciesId).toBe(SpeciesId.WIMPOD);
    expect(pokemon1).toHaveFainted();
    expect(pokemon1.getHpRatio()).toBeLessThan(0.5);
  }

  it.each<{ name: string; ability: AbilityId }>([
    { name: "Wimp Out", ability: AbilityId.WIMP_OUT },
    { name: "Emergency Exit", ability: AbilityId.EMERGENCY_EXIT },
  ])("should switch the user out when falling below half HP, canceling its subsequent moves", async ({ ability }) => {
    game.override.ability(ability);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

    const wimpod = game.field.getPlayerPokemon();
    wimpod.hp *= 0.52;

    game.move.use(MoveId.SPLASH);
    game.doSelectPartyPokemon(1);
    await game.toEndOfTurn();

    // Wimpod switched out after taking a hit, canceling its upcoming MoveEffectPhase before it could attack
    confirmSwitch();
    expect(game.field.getEnemyPokemon()).toHaveFullHp();
    expect(game.phaseInterceptor.log.filter(phase => phase === "MoveEffectPhase")).toHaveLength(1);
  });

  it("should not trigger if user faints from damage and is revived", async () => {
    game.override
      .startingHeldItems([{ name: "REVIVER_SEED", count: 1 }])
      .enemyMoveset(MoveId.BRAVE_BIRD)
      .enemyLevel(1000);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

    const wimpod = game.field.getPlayerPokemon();
    wimpod.hp *= 0.52;

    game.move.use(MoveId.SPLASH);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    expect(wimpod).toHaveFainted();
    expect(wimpod.isOnField()).toBe(true);
    expect(wimpod.getHpRatio()).toBeCloseTo(0.5);
    expect(wimpod.getHeldItems()).toHaveLength(0);
    expect(wimpod).not.toHaveAbilityApplied(AbilityId.WIMP_OUT);
  });

  it("should trigger regenerator passive when switching out", async () => {
    game.override.passiveAbility(AbilityId.REGENERATOR).startingLevel(5).enemyLevel(100);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

    const wimpod = game.field.getPlayerPokemon();

    game.move.use(MoveId.SPLASH);
    game.doSelectPartyPokemon(1);
    await game.toEndOfTurn();

    expect(wimpod).toHaveHp(Math.floor(wimpod.getMaxHp() * 0.33 + 1));
    confirmSwitch();
  });

  it("should cause wild pokemon to flee when triggered", async () => {
    game.override.enemyAbility(AbilityId.WIMP_OUT);
    await game.classicMode.startBattle([SpeciesId.GOLISOPOD, SpeciesId.TYRUNT]);

    const enemyPokemon = game.field.getEnemyPokemon();
    enemyPokemon.hp *= 0.52;

    game.move.use(MoveId.FALSE_SWIPE);
    await game.toEndOfTurn();

    expect(enemyPokemon.visible).toBe(false);
    expect(enemyPokemon.switchOutStatus).toBe(true);
  });

  it("should not trigger if HP already below half", async () => {
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);
    const wimpod = game.field.getPlayerPokemon();
    wimpod.hp *= 0.1;

    game.move.use(MoveId.SPLASH);
    await game.toEndOfTurn();

    expect(wimpod.getHpRatio()).toBeLessThan(0.1);
    confirmNoSwitch();
  });

  it("should bypass trapping moves", async () => {
    game.override.enemyMoveset([MoveId.SPIRIT_SHACKLE]).startingLevel(53).enemyLevel(45);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

    game.move.use(MoveId.SPLASH);
    game.doSelectPartyPokemon(1);

    await game.toEndOfTurn();

    expect(game.field.getPlayerPokemon().getTag(BattlerTagType.TRAPPED)).toBeUndefined();
    expect(game.scene.getPlayerParty()[1].getTag(BattlerTagType.TRAPPED)).toBeUndefined();
    confirmSwitch();
  });

  it("should block U-turn or Volt Switch on activation", async () => {
    game.override.battleType(BattleType.TRAINER);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

    const wimpod = game.field.getPlayerPokemon();
    wimpod.hp *= 0.52;

    game.move.use(MoveId.SPLASH);
    game.doSelectPartyPokemon(1);
    await game.move.forceEnemyMove(MoveId.U_TURN);
    await game.toEndOfTurn();

    confirmSwitch();
    const ninjask = game.field.getEnemyPokemon();
    expect(ninjask.isOnField()).toBe(true);
  });

  it("should not block U-turn or Volt Switch if not activated", async () => {
    game.override.battleType(BattleType.TRAINER);
    await game.classicMode.startBattle([SpeciesId.GOLISOPOD, SpeciesId.TYRUNT]);

    const wimpod = game.field.getPlayerPokemon();
    const ninjask = game.field.getEnemyPokemon();

    // force enemy u turn to do 1 dmg
    vi.spyOn(wimpod, "getAttackDamage").mockReturnValueOnce({
      cancelled: false,
      damage: 1,
      result: HitResult.EFFECTIVE,
    });

    game.move.use(MoveId.SPLASH);
    await game.phaseInterceptor.to("SwitchSummonPhase", false);
    const switchSummonPhase = game.scene.phaseManager.getCurrentPhase() as SwitchSummonPhase;
    expect(switchSummonPhase.getPokemon()).toBe(ninjask);

    await game.toEndOfTurn();

    expect(wimpod.isOnField()).toBe(true);
    expect(ninjask.isOnField()).toBe(false);
  });

  it("should not activate when hit by force switch moves", async () => {
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

    const wimpod = game.field.getPlayerPokemon();
    wimpod.hp *= 0.52;

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.CIRCLE_THROW);
    await game.phaseInterceptor.to("SwitchSummonPhase", false);

    expect(wimpod.waveData.abilitiesApplied).not.toContain(AbilityId.WIMP_OUT);

    // Force switches directly call `SwitchSummonPhase` to send in a random opponent,
    // so wimp out triggering will stall out the test waiting for input
    await game.toEndOfTurn();
    expect(game.field.getPlayerPokemon().species.speciesId).not.toBe(SpeciesId.WIMPOD);
  });

  it.each<{
    type: string;
    playerMove?: MoveId;
    playerPassive?: AbilityId;
    enemyMove?: MoveId;
    enemyAbility?: AbilityId;
  }>([
    { type: "variable recoil moves", playerMove: MoveId.HEAD_SMASH },
    { type: "HP-based recoil moves", playerMove: MoveId.CHLOROBLAST },
    { type: "weather", enemyMove: MoveId.HAIL },
    { type: "status", enemyMove: MoveId.TOXIC },
    { type: "Ghost-type Curse", enemyMove: MoveId.CURSE },
    { type: "Salt Cure", enemyMove: MoveId.SALT_CURE },
    { type: "partial trapping moves", enemyMove: MoveId.WHIRLPOOL }, // no guard passive makes this 100% accurate
    { type: "Leech Seed", enemyMove: MoveId.LEECH_SEED },
    { type: "Powder", playerMove: MoveId.EMBER, enemyMove: MoveId.POWDER },
    { type: "Nightmare", playerPassive: AbilityId.COMATOSE, enemyMove: MoveId.NIGHTMARE },
    { type: "Bad Dreams", playerPassive: AbilityId.COMATOSE, enemyAbility: AbilityId.BAD_DREAMS },
  ])(
    "should activate from damage caused by $type",
    async ({
      playerMove = MoveId.SPLASH,
      playerPassive = AbilityId.NONE,
      enemyMove = MoveId.SPLASH,
      enemyAbility = AbilityId.STURDY,
    }) => {
      game.override
        .enemyLevel(1)
        .passiveAbility(playerPassive)
        .enemySpecies(SpeciesId.GASTLY)
        .enemyMoveset(enemyMove)
        .enemyAbility(enemyAbility);
      await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

      const wimpod = game.field.getPlayerPokemon();
      expect(wimpod).toBeDefined();
      wimpod.hp = toDmgValue(wimpod.getMaxHp() / 2 + 2);
      // mock enemy attack damage func to only do 1 dmg (for whirlpool)
      vi.spyOn(wimpod, "getAttackDamage").mockReturnValueOnce({
        cancelled: false,
        result: HitResult.EFFECTIVE,
        damage: 1,
      });

      game.move.use(playerMove);
      game.doSelectPartyPokemon(1);
      await game.toNextTurn();

      confirmSwitch();
    },
  );

  it.each<{ name: string; ability: AbilityId }>([
    { name: "Innards Out", ability: AbilityId.INNARDS_OUT },
    { name: "Aftermath", ability: AbilityId.AFTERMATH },
    { name: "Rough Skin", ability: AbilityId.ROUGH_SKIN },
  ])("should trigger after taking damage from %s ability", async ({ ability }) => {
    game.override.enemyAbility(ability).enemyMoveset(MoveId.SPLASH);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

    const wimpod = game.field.getPlayerPokemon();
    wimpod.hp *= 0.51;
    game.field.getEnemyPokemon().hp = wimpod.hp - 1; // Ensure innards out doesn't KO

    game.move.use(MoveId.GUILLOTINE);
    game.doSelectPartyPokemon(1);
    await game.toNextWave();

    confirmSwitch();
  });

  it("should not trigger from Sheer Force-boosted moves", async () => {
    game.override.enemyAbility(AbilityId.SHEER_FORCE).startingLevel(1);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

    game.field.getPlayerPokemon().hp *= 0.51;

    game.move.use(MoveId.ENDURE);
    await game.move.forceEnemyMove(MoveId.SLUDGE_BOMB);
    await game.toEndOfTurn();

    confirmNoSwitch();
  });

  it("should trigger from Flame Burst splash damage in doubles", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.ZYGARDE, SpeciesId.TYRUNT]);

    const wimpod = game.field.getPlayerPokemon();
    expect(wimpod).toBeDefined();
    wimpod.hp *= 0.52;

    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.move.forceEnemyMove(MoveId.FLAME_BURST, BattlerIndex.PLAYER_2);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    game.doSelectPartyPokemon(2);
    await game.toEndOfTurn();

    expect(wimpod.isOnField()).toBe(false);
    expect(wimpod.getHpRatio()).toBeLessThan(0.5);
  });

  it("should not activate when the Pokémon cuts its own HP below half", async () => {
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

    // Turn 1: Substitute knocks below half; no switch
    const wimpod = game.field.getPlayerPokemon();
    wimpod.hp *= 0.52;

    game.move.use(MoveId.SUBSTITUTE);
    await game.move.forceEnemyMove(MoveId.TIDY_UP);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    confirmNoSwitch();
    // Turn 2: get back enough HP that substitute doesn't put us under
    wimpod.hp = wimpod.getMaxHp() * 0.8;

    game.move.use(MoveId.SUBSTITUTE);
    await game.move.forceEnemyMove(MoveId.ROUND);
    game.doSelectPartyPokemon(1);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toEndOfTurn();

    confirmSwitch();
  });

  it("should not trigger when neutralized", async () => {
    game.override.enemyAbility(AbilityId.NEUTRALIZING_GAS).startingLevel(5);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

    game.move.use(MoveId.SPLASH);
    await game.toEndOfTurn();

    confirmNoSwitch();
  });

  it("should disregard Shell Bell recovery while still activating it before switching", async () => {
    game.override
      .moveset(MoveId.DOUBLE_EDGE)
      .enemyMoveset(MoveId.SPLASH)
      .startingHeldItems([{ name: "SHELL_BELL", count: 4 }]); // heals 50% of damage dealt, more than recoil takes away
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

    const wimpod = game.field.getPlayerPokemon();
    wimpod.hp *= 0.51;

    game.move.use(MoveId.DOUBLE_EDGE);
    game.doSelectPartyPokemon(1);
    await game.phaseInterceptor.to("MoveEffectPhase");

    // Wimp out check activated from recoil before shell bell procced, but did not deny the pokemon its recovery
    expect(wimpod.turnData.damageTaken).toBeGreaterThan(0);
    expect(wimpod.getHpRatio()).toBeGreaterThan(0.5);

    await game.toEndOfTurn();

    confirmSwitch();
  });

  it("should activate from entry hazard damage", async () => {
    // enemy centiscorch switches in... then dies
    game.scene.arena.addTag(ArenaTagType.STEALTH_ROCK, 1, MoveId.STEALTH_ROCK, 0, ArenaTagSide.ENEMY);
    game.scene.arena.addTag(ArenaTagType.SPIKES, 1, MoveId.SPIKES, 0, ArenaTagSide.ENEMY);
    game.override.enemySpecies(SpeciesId.CENTISKORCH).enemyAbility(AbilityId.WIMP_OUT);
    await game.classicMode.startBattle([SpeciesId.TYRUNT]);

    expect(game.phaseInterceptor.log).not.toContain("MovePhase");
    expect(game.phaseInterceptor.log).toContain("BattleEndPhase");
  });

  it("should not switch if Magic Guard prevents damage", async () => {
    game.override.passiveAbility(AbilityId.MAGIC_GUARD).enemyMoveset(MoveId.LEECH_SEED);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

    const wimpod = game.field.getPlayerPokemon();
    wimpod.hp *= 0.51;

    game.move.use(MoveId.SPLASH);
    await game.toNextTurn();

    expect(wimpod.isOnField()).toBe(true);
    expect(wimpod.getHpRatio()).toBeCloseTo(0.51);
  });

  it("should not cancel a double battle on activation", async () => {
    game.override.battleStyle("double").enemyAbility(AbilityId.WIMP_OUT).enemyLevel(1);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);
    const enemyLeadPokemon = game.scene.getEnemyParty()[0];
    const enemySecPokemon = game.scene.getEnemyParty()[1];

    game.move.use(MoveId.FALSE_SWIPE, 0, BattlerIndex.ENEMY);
    game.move.use(MoveId.SPLASH, 1);

    await game.toEndOfTurn();

    const isVisibleLead = enemyLeadPokemon.visible;
    const hasFledLead = enemyLeadPokemon.switchOutStatus;
    const isVisibleSec = enemySecPokemon.visible;
    const hasFledSec = enemySecPokemon.switchOutStatus;
    expect(!isVisibleLead && hasFledLead && isVisibleSec && !hasFledSec).toBe(true);
    expect(enemyLeadPokemon.hp).toBeLessThan(enemyLeadPokemon.getMaxHp());
    expect(enemySecPokemon.hp).toEqual(enemySecPokemon.getMaxHp());
  });

  it.each<{ type: string; move?: MoveId; ability?: AbilityId; items?: ModifierOverride[] }>([
    { type: "normal", move: MoveId.DUAL_CHOP },
    { type: "Parental Bond", ability: AbilityId.PARENTAL_BOND },
    { type: "Multi Lens", items: [{ name: "MULTI_LENS", count: 1 }] },
  ])(
    "should trigger after the last hit of $type multi-strike moves",
    async ({ move = MoveId.TACKLE, ability = AbilityId.COMPOUND_EYES, items = [] }) => {
      game.override.enemyMoveset(move).enemyAbility(ability).enemyHeldItems(items);
      await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

      const wimpod = game.field.getPlayerPokemon();
      wimpod.hp *= 0.51;

      game.move.use(MoveId.ENDURE);
      game.doSelectPartyPokemon(1);
      await game.toEndOfTurn();

      const enemyPokemon = game.field.getEnemyPokemon();
      expect(enemyPokemon.turnData.hitsLeft).toBe(0);
      expect(enemyPokemon.turnData.hitCount).toBe(2);
      confirmSwitch();

      // Switch triggered after the MEPs for both hits finished
      const phaseLogs = game.phaseInterceptor.log;
      expect(phaseLogs.filter(l => l === "MoveEffectPhase")).toHaveLength(3); // 1 for endure + 2 for dual hit
      expect(phaseLogs.lastIndexOf("SwitchSummonPhase")).toBeGreaterThan(phaseLogs.lastIndexOf("MoveEffectPhase"));
    },
  );

  it("should not activate from confusion damage", async () => {
    game.override.enemyMoveset(MoveId.CONFUSE_RAY).confusionActivation(true);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

    const wimpod = game.field.getPlayerPokemon();
    wimpod.hp *= 0.51;

    game.move.use(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toEndOfTurn();

    confirmNoSwitch();
  });

  it("should not activate on wave X0 bosses", async () => {
    game.override.enemyAbility(AbilityId.WIMP_OUT).startingLevel(5000).startingWave(10).enemyHealthSegments(3);
    await game.classicMode.startBattle([SpeciesId.GOLISOPOD]);

    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.use(MoveId.FALSE_SWIPE);
    await game.toNextTurn();

    expect(enemyPokemon.visible).toBe(true);
    expect(enemyPokemon.switchOutStatus).toBe(false);
  });

  it("should not skip battles when triggered in a double battle", async () => {
    const wave = 2;
    game.override
      .enemyMoveset(MoveId.SPLASH)
      .enemySpecies(SpeciesId.WIMPOD)
      .enemyAbility(AbilityId.WIMP_OUT)
      .moveset([MoveId.MATCHA_GOTCHA, MoveId.FALSE_SWIPE])
      .startingLevel(50)
      .enemyLevel(1)
      .battleStyle("double")
      .startingWave(wave);
    await game.classicMode.startBattle([SpeciesId.RAICHU, SpeciesId.PIKACHU]);
    const [wimpod0, wimpod1] = game.scene.getEnemyField();

    game.move.use(MoveId.FALSE_SWIPE, 0, BattlerIndex.ENEMY);
    game.move.use(MoveId.MATCHA_GOTCHA, 1);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.toEndOfTurn();

    expect(wimpod0.hp).toBeGreaterThan(0);
    expect(wimpod0.switchOutStatus).toBe(true);
    expect(wimpod0.isFainted()).toBe(false);
    expect(wimpod1.isFainted()).toBe(true);

    await game.toNextWave();
    expect(game.scene.currentBattle.waveIndex).toBe(wave + 1);
  });

  it("should not skip battles when triggering the same turn as another enemy faints", async () => {
    game.override
      .enemySpecies(SpeciesId.WIMPOD)
      .enemyAbility(AbilityId.WIMP_OUT)
      .startingLevel(50)
      .enemyLevel(1)
      .battleStyle("double")
      .startingWave(2);

    await game.classicMode.startBattle([SpeciesId.REGIDRAGO, SpeciesId.MAGIKARP]);

    // turn 1 - 1st wimpod faints while the 2nd one flees
    game.move.use(MoveId.DRAGON_ENERGY, BattlerIndex.PLAYER);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.ENDURE);

    await game.toNextWave();
    expect(game.scene.currentBattle.waveIndex).toBe(3);
  });
});
