import type { ModifierOverride } from "#app/modifier/modifier-type";
import type { SwitchSummonPhase } from "#app/phases/switch-summon-phase";
import { toDmgValue } from "#app/utils/common";
import { allAbilities } from "#data/data-lists";
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
import type { PostDamageForceSwitchAbAttr } from "#types/ability-types";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, type MockInstance, vi } from "vitest";

describe("Abilities - Wimp Out/Emergency Exit", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let canApplySpy: MockInstance<PostDamageForceSwitchAbAttr["canApply"]>;

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
      .criticalHits(false)
      .startingLevel(100)
      .enemyLevel(1000);

    canApplySpy = vi.spyOn(allAbilities[AbilityId.WIMP_OUT].getAttrs("PostDamageForceSwitchAbAttr")[0], "canApply");
  });

  /**
   * Confirm that Wimp Out triggered as a result of the user's HP having been lowered below half.
   */
  function confirmSwitch(): void {
    const [pokemon1, pokemon2] = game.scene.getPlayerParty();

    expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");

    expect(pokemon1.species.speciesId).not.toBe(SpeciesId.WIMPOD);

    expect(pokemon2.species.speciesId).toBe(SpeciesId.WIMPOD);
    expect(pokemon2).not.toHaveFainted();
    expect(pokemon2.getHpRatio()).toBeLessThan(0.5);
  }

  /**
   * Confirm that Wimp Out did *not* trigger despite the ability check having fired..
   */
  function confirmNoSwitch(): void {
    const [pokemon1, pokemon2] = game.scene.getPlayerParty();

    expect(game.phaseInterceptor.log).not.toContain("SwitchSummonPhase");

    expect(pokemon2.species.speciesId).not.toBe(SpeciesId.WIMPOD);

    expect(pokemon1.species.speciesId).toBe(SpeciesId.WIMPOD);
    expect(pokemon1).not.toHaveAbilityApplied(AbilityId.WIMP_OUT);
    expect(canApplySpy).toHaveLastReturnedWith(false);
  }

  it.each<{ name: string; ability: AbilityId }>([
    { name: "Wimp Out", ability: AbilityId.WIMP_OUT },
    { name: "Emergency Exit", ability: AbilityId.EMERGENCY_EXIT },
  ])("$name should switch the user out when falling below half HP, canceling its subsequent moves", async ({
    ability,
  }) => {
    game.override.ability(ability);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

    // Make sure we spy on EE for its test
    canApplySpy = vi.spyOn(allAbilities[ability].getAttrs("PostDamageForceSwitchAbAttr")[0], "canApply");

    const wimpod = game.field.getPlayerPokemon();
    wimpod.hp *= 0.52;

    game.move.use(MoveId.SPLASH);
    game.doSelectPartyPokemon(1);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toEndOfTurn();

    // Wimpod switched out after taking a hit, canceling its upcoming MovePhase before it could attack
    confirmSwitch();
    expect(game.field.getEnemyPokemon()).toHaveFullHp();
    expect(game.phaseInterceptor.log.filter(phase => phase === "MoveEffectPhase")).toHaveLength(1);
  });

  it("should not trigger if user faints from damage and is revived", async () => {
    game.override.startingHeldItems([{ name: "REVIVER_SEED", count: 1 }]);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

    const wimpod = game.field.getPlayerPokemon();

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.GUILLOTINE);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    expect(wimpod).not.toHaveFainted();
    expect(wimpod.isOnField()).toBe(true);
    expect(wimpod.getHpRatio()).toBeCloseTo(0.5);
    expect(wimpod.getHeldItems()).toHaveLength(0);
    expect(wimpod).not.toHaveAbilityApplied(AbilityId.WIMP_OUT);
  });

  it("should trigger regenerator passive when switching out", async () => {
    game.override.passiveAbility(AbilityId.REGENERATOR);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

    const wimpod = game.field.getPlayerPokemon();

    game.move.use(MoveId.SPLASH);
    game.doSelectPartyPokemon(1);
    await game.toEndOfTurn();

    expect(wimpod).toHaveHp(Math.floor(wimpod.getMaxHp() * 0.33 + 1));
    confirmSwitch();
  });

  it("should cause wild pokemon to flee when triggered", async () => {
    game.override.enemyAbility(AbilityId.WIMP_OUT).enemyLevel(1);
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
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

    game.move.use(MoveId.ENDURE);
    await game.move.forceEnemyMove(MoveId.SPIRIT_SHACKLE);
    game.doSelectPartyPokemon(1);

    await game.toEndOfTurn();

    const [tyrunt, wimpod] = game.scene.getPlayerParty();
    expect(tyrunt).not.toHaveBattlerTag(BattlerTagType.TRAPPED);
    expect(wimpod).not.toHaveBattlerTag(BattlerTagType.TRAPPED);
    confirmSwitch();
  });

  it("should block U-turn or Volt Switch on activation", async () => {
    game.override.battleType(BattleType.TRAINER);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

    const wimpod = game.field.getPlayerPokemon();
    wimpod.hp *= 0.52;

    game.move.use(MoveId.ENDURE);
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
    await game.move.forceEnemyMove(MoveId.U_TURN);
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

    game.move.use(MoveId.ENDURE);
    game.doSelectPartyPokemon(1);
    await game.move.forceEnemyMove(MoveId.CIRCLE_THROW);
    await game.toEndOfTurn();

    expect(game.field.getPlayerPokemon()).not.toBe(wimpod);
    expect(wimpod).not.toHaveAbilityApplied(AbilityId.WIMP_OUT);
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
  ])("should activate from damage caused by $type", async ({
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
  });

  it.each<{ name: string; ability: AbilityId }>([
    { name: "Innards Out", ability: AbilityId.INNARDS_OUT },
    { name: "Aftermath", ability: AbilityId.AFTERMATH },
    { name: "Rough Skin", ability: AbilityId.ROUGH_SKIN },
  ])("should trigger after taking damage from $name ability", async ({ ability }) => {
    game.override.enemyAbility(ability).enemyMoveset(MoveId.SPLASH).enemyLevel(1);
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

  it("should not activate from HP cutting moves", async () => {
    game.override.enemyAbility(AbilityId.INFILTRATOR); // bypass substitutes for False Swipe
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

    // Turn 1: Substitute knocks below half; no switch
    const wimpod = game.field.getPlayerPokemon();
    wimpod.hp *= 0.52;

    game.move.use(MoveId.SUBSTITUTE);
    await game.move.forceEnemyMove(MoveId.TIDY_UP);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    expect(wimpod.getHpRatio()).toBeLessThan(0.5);
    confirmNoSwitch();

    // Turn 2: get back enough HP that substitute doesn't put us under
    wimpod.hp = wimpod.getMaxHp() * 0.8;

    game.move.use(MoveId.SUBSTITUTE);
    game.doSelectPartyPokemon(1);
    await game.move.forceEnemyMove(MoveId.FALSE_SWIPE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toEndOfTurn();

    confirmSwitch();
  });

  it("should disregard Shell Bell recovery while still activating before switching", async () => {
    game.override.startingHeldItems([{ name: "SHELL_BELL", count: 4 }]); // heals 50% of damage dealt, more than recoil takes away
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

    const wimpod = game.field.getPlayerPokemon();
    wimpod.hp = wimpod.hp / 2 + 1;

    game.move.use(MoveId.DOUBLE_EDGE);
    game.doSelectPartyPokemon(1);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.phaseInterceptor.to("SwitchSummonPhase", false);

    // Wimp out activated from recoil damage before shell bell procced, but did not deny the pokemon its recovery
    expect(wimpod.turnData.damageTaken).toBeGreaterThan(0);
    expect(wimpod.getHpRatio()).toBeGreaterThan(0.5);
    expect(wimpod).toHaveAbilityApplied(AbilityId.WIMP_OUT);
  });

  it("should activate from entry hazard damage", async () => {
    await game.classicMode.startBattle([SpeciesId.TYRUNT, SpeciesId.WIMPOD]);

    // Switch wimpod in to a bunch of hazards making sure to queue inputs to switch back out again
    game.scene.arena.addTag(ArenaTagType.SPIKES, 1, MoveId.SPIKES, 0, ArenaTagSide.PLAYER);

    const wimpod = game.scene.getPlayerParty()[1];
    wimpod.hp *= 0.51;

    game.doSwitchPokemon(1);
    game.doSelectPartyPokemon(1);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.toEndOfTurn();

    confirmSwitch();
  });

  it("should not cancel a double battle on activation", async () => {
    game.override.battleStyle("double").enemyAbility(AbilityId.WIMP_OUT).enemyLevel(1);
    await game.classicMode.startBattle([SpeciesId.WIMPOD]);

    const [enemyLeadPokemon, enemySecPokemon] = game.scene.getEnemyParty();
    game.move.use(MoveId.FALSE_SWIPE, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    await game.toEndOfTurn();

    expect(enemyLeadPokemon.visible).toBe(false);
    expect(enemyLeadPokemon.switchOutStatus).toBe(true);
    expect(enemyLeadPokemon).not.toHaveFullHp();
    expect(enemySecPokemon.visible).toBe(true);
    expect(enemySecPokemon.switchOutStatus).toBe(false);
    expect(enemySecPokemon).toHaveFullHp();
  });

  it.each<{ type: string; move?: MoveId; ability?: AbilityId; items?: ModifierOverride[] }>([
    { type: "normal", move: MoveId.DUAL_CHOP },
    { type: "Parental Bond", ability: AbilityId.PARENTAL_BOND },
    { type: "Multi Lens", items: [{ name: "MULTI_LENS", count: 1 }] },
  ])("should trigger after the last hit of $type multi-strike moves", async ({
    move = MoveId.TACKLE,
    ability = AbilityId.COMPOUND_EYES,
    items = [],
  }) => {
    game.override.enemyAbility(ability).enemyHeldItems(items);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

    const wimpod = game.field.getPlayerPokemon();
    wimpod.hp *= 0.51;

    game.move.use(MoveId.ENDURE);
    game.doSelectPartyPokemon(1);
    await game.move.forceEnemyMove(move);
    await game.toEndOfTurn();

    const enemyPokemon = game.field.getEnemyPokemon();
    expect(enemyPokemon.turnData.hitsLeft).toBe(0);
    expect(enemyPokemon.turnData.hitCount).toBe(2);
    confirmSwitch();

    // Switch should've triggered after the MEPs for both hits finished
    const phaseLogs = game.phaseInterceptor.log;
    expect(phaseLogs.filter(l => l === "MoveEffectPhase")).toHaveLength(3); // 1 for endure + 2 for dual hit
    expect(phaseLogs.lastIndexOf("SwitchSummonPhase")).toBeGreaterThan(phaseLogs.lastIndexOf("MoveEffectPhase"));
  });

  it("should not activate from confusion damage", async () => {
    game.override.confusionActivation(true);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

    const wimpod = game.field.getPlayerPokemon();
    wimpod.hp *= 0.51;

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.CONFUSE_RAY);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toEndOfTurn();

    confirmNoSwitch();
  });

  it("should not count damage from multi-hits that hit substitute", async () => {
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

    // Give wimpod a 2 HP substitute, and put it 2 health above the 50% threshold
    const wimpod = game.field.getPlayerPokemon();
    wimpod.hp = toDmgValue(wimpod.hp * 0.5) + 2;
    wimpod.addTag(BattlerTagType.SUBSTITUTE);
    expect(wimpod).toHaveBattlerTag(BattlerTagType.SUBSTITUTE);
    wimpod.getTag(BattlerTagType.SUBSTITUTE)!.hp = 2;

    // force each hit to do 1 dmg
    vi.spyOn(wimpod, "getAttackDamage").mockReturnValue({
      cancelled: false,
      damage: 1,
      result: HitResult.EFFECTIVE,
    });

    game.move.use(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.TRIPLE_AXEL);
    await game.toEndOfTurn();

    confirmNoSwitch();
  });

  it("should not activate on wave X0 bosses", async () => {
    game.override.enemyAbility(AbilityId.WIMP_OUT).enemyLevel(1).startingWave(10).enemyHealthSegments(3);
    await game.classicMode.startBattle([SpeciesId.GOLISOPOD]);

    const enemy = game.field.getEnemyPokemon();

    game.move.use(MoveId.FALSE_SWIPE);
    await game.toNextTurn();

    expect(canApplySpy).toHaveBeenLastCalledWith(expect.objectContaining({ pokemon: enemy }));
    expect(canApplySpy).toHaveLastReturnedWith(false);
    expect(enemy.visible).toBe(true);
    expect(enemy.switchOutStatus).toBe(false);
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

    await game.phaseInterceptor.to("SelectModifierPhase", false);
    expect(game.scene.currentBattle.waveIndex).toBe(3);
  });
});
