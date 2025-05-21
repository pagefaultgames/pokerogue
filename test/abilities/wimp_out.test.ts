import { BattlerIndex } from "#app/battle";
import { ArenaTagSide } from "#app/data/arena-tag";
import { allMoves } from "#app/data/moves/move";
import GameManager from "#test/testUtils/gameManager";
import { toDmgValue } from "#app/utils/common";
import { Abilities } from "#enums/abilities";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { StatusEffect } from "#enums/status-effect";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { BattleType } from "#enums/battle-type";
import { HitResult } from "#app/field/pokemon";
import type { ModifierOverride } from "#app/modifier/modifier-type";
import type { SwitchSummonPhase } from "#app/phases/switch-summon-phase";

describe("Abilities - Wimp Out", () => {
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
      .ability(Abilities.WIMP_OUT)
      .enemySpecies(Species.NINJASK)
      .enemyPassiveAbility(Abilities.NO_GUARD)
      .startingLevel(90)
      .enemyLevel(70)
      .moveset([Moves.SPLASH, Moves.FALSE_SWIPE, Moves.ENDURE, Moves.GUILLOTINE])
      .enemyMoveset(Moves.FALSE_SWIPE)
      .disableCrits();
  });

  function confirmSwitch(): void {
    const [pokemon1, pokemon2] = game.scene.getPlayerParty();

    expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");

    expect(pokemon1.species.speciesId).not.toBe(Species.WIMPOD);

    expect(pokemon2.species.speciesId).toBe(Species.WIMPOD);
    expect(pokemon2.isFainted()).toBe(false);
    expect(pokemon2.getHpRatio()).toBeLessThan(0.5);
  }

  function confirmNoSwitch(): void {
    const [pokemon1, pokemon2] = game.scene.getPlayerParty();

    expect(game.phaseInterceptor.log).not.toContain("SwitchSummonPhase");

    expect(pokemon2.species.speciesId).not.toBe(Species.WIMPOD);

    expect(pokemon1.species.speciesId).toBe(Species.WIMPOD);
    expect(pokemon1.isFainted()).toBe(false);
    expect(pokemon1.getHpRatio(true)).toBeLessThan(0.5);
  }

  it("should switch the user out when falling below half HP, canceling its subsequent moves", async () => {
    await game.classicMode.startBattle([Species.WIMPOD, Species.TYRUNT]);

    const wimpod = game.scene.getPlayerPokemon()!;
    wimpod.hp *= 0.52;

    game.move.select(Moves.SPLASH);
    game.doSelectPartyPokemon(1);
    await game.phaseInterceptor.to("TurnEndPhase");

    // Wimpod switched out after taking a hit, canceling its upcoming MoveEffectPhase before it could attack
    confirmSwitch();
    expect(game.scene.getEnemyPokemon()!.getInverseHp()).toBe(0);
    expect(game.phaseInterceptor.log.reduce((count, phase) => count + (phase === "MoveEffectPhase" ? 1 : 0), 0)).toBe(
      1,
    );
    expect(wimpod.turnData.acted).toBe(false);
  });

  it("should not trigger if user faints from damage and is revived", async () => {
    game.override
      .startingHeldItems([{ name: "REVIVER_SEED", count: 1 }])
      .enemyMoveset(Moves.BRAVE_BIRD)
      .enemyLevel(1000);
    await game.classicMode.startBattle([Species.WIMPOD, Species.TYRUNT]);

    const wimpod = game.scene.getPlayerPokemon()!;
    wimpod.hp *= 0.52;

    game.move.select(Moves.SPLASH);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    expect(wimpod.isFainted()).toBe(false);
    expect(wimpod.isOnField()).toBe(true);
    expect(wimpod.getHpRatio()).toBeCloseTo(0.5);
    expect(wimpod.getHeldItems()).toHaveLength(0);
    expect(wimpod.waveData.abilitiesApplied).not.toContain(Abilities.WIMP_OUT);
  });

  it("should trigger regenerator passive when switching out", async () => {
    game.override.passiveAbility(Abilities.REGENERATOR).startingLevel(5).enemyLevel(100);
    await game.classicMode.startBattle([Species.WIMPOD, Species.TYRUNT]);

    const wimpod = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.SPLASH);
    game.doSelectPartyPokemon(1);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(wimpod.hp).toEqual(Math.floor(wimpod.getMaxHp() * 0.33 + 1));
    confirmSwitch();
  });

  it("should cause wild pokemon to flee when triggered", async () => {
    game.override.enemyAbility(Abilities.WIMP_OUT);
    await game.classicMode.startBattle([Species.GOLISOPOD, Species.TYRUNT]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;
    enemyPokemon.hp *= 0.52;

    game.move.select(Moves.FALSE_SWIPE);
    await game.phaseInterceptor.to("BerryPhase");

    const isVisible = enemyPokemon.visible;
    const hasFled = enemyPokemon.switchOutStatus;
    expect(!isVisible && hasFled).toBe(true);
  });

  it("should not trigger if HP already below half", async () => {
    await game.classicMode.startBattle([Species.WIMPOD, Species.TYRUNT]);
    const wimpod = game.scene.getPlayerPokemon()!;
    wimpod.hp *= 0.1;

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(wimpod.getHpRatio()).toBeLessThan(0.1);
    confirmNoSwitch();
  });

  it("should bypass trapping moves", async () => {
    game.override.enemyMoveset([Moves.SPIRIT_SHACKLE]).startingLevel(53).enemyLevel(45);
    await game.classicMode.startBattle([Species.WIMPOD, Species.TYRUNT]);

    game.move.select(Moves.SPLASH);
    game.doSelectPartyPokemon(1);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");
    expect(game.scene.getPlayerPokemon()!.getTag(BattlerTagType.TRAPPED)).toBeUndefined();
    expect(game.scene.getPlayerParty()[1].getTag(BattlerTagType.TRAPPED)).toBeUndefined();
    confirmSwitch();
  });

  // TODO: Enable when dynamic speed order happens
  it.todo("should trigger separately for each Pokemon hit in speed order", async () => {
    game.override.battleStyle("double").enemyLevel(600).enemyMoveset(Moves.DRAGON_ENERGY);
    await game.classicMode.startBattle([Species.WIMPOD, Species.GOLISOPOD, Species.TYRANITAR, Species.KINGAMBIT]);

    // Golisopod switches out, Wimpod switches back in immediately afterwards
    game.move.select(Moves.ENDURE, BattlerIndex.PLAYER);
    game.move.select(Moves.ENDURE, BattlerIndex.PLAYER_2);
    game.doSelectPartyPokemon(3);
    game.doSelectPartyPokemon(3);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.scene.getPlayerParty().map(p => p.species.speciesId)).toBe([
      Species.TYRANITAR,
      Species.WIMPOD,
      Species.KINGAMBIT,
      Species.GOLISOPOD,
    ]);

    // Ttar and Kingambit should be at full HP; wimpod and golisopod should not
    // Ttar and Wimpod should be on field; kingambit and golisopod should not
    game.scene.getPlayerParty().forEach((p, i) => {
      expect(p.isOnField()).toBe(i < 2);
      expect(p.isFullHp()).toBe(i % 2 === 1);
    });
  });

  it("should block U-turn or Volt Switch on activation", async () => {
    game.override.battleType(BattleType.TRAINER).enemyMoveset(Moves.U_TURN);
    await game.classicMode.startBattle([Species.WIMPOD, Species.TYRUNT]);
    const ninjask = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.SPLASH);
    game.doSelectPartyPokemon(1);
    await game.phaseInterceptor.to("TurnEndPhase");

    confirmSwitch();
    expect(ninjask.isOnField()).toBe(true);
  });

  it("should not block U-turn or Volt Switch if not activated", async () => {
    game.override.battleType(BattleType.TRAINER).enemyMoveset(Moves.U_TURN).battleType(BattleType.TRAINER);
    await game.classicMode.startBattle([Species.GOLISOPOD, Species.TYRUNT]);

    const wimpod = game.scene.getPlayerPokemon()!;
    const ninjask = game.scene.getEnemyPokemon()!;

    // force enemy u turn to do 1 dmg
    vi.spyOn(wimpod, "getAttackDamage").mockReturnValue({
      cancelled: false,
      damage: 1,
      result: HitResult.EFFECTIVE,
    });

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("SwitchSummonPhase", false);
    const switchSummonPhase = game.scene.getCurrentPhase() as SwitchSummonPhase;
    expect(switchSummonPhase.getPokemon()).toBe(ninjask);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(wimpod.isOnField()).toBe(true);
    expect(ninjask.isOnField()).toBe(false);
  });

  it("should not activate from Dragon Tail and Circle Throw", async () => {
    game.override.startingLevel(69).enemyMoveset([Moves.DRAGON_TAIL]);
    await game.classicMode.startBattle([Species.WIMPOD, Species.TYRUNT]);

    const wimpod = game.scene.getPlayerPokemon()!;

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("SwitchSummonPhase", false);

    expect(wimpod.waveData.abilitiesApplied).not.toContain(Abilities.WIMP_OUT);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.scene.getPlayerPokemon()!.species.speciesId).not.toBe(Species.WIMPOD);
    // Force switches directly call `SwitchSummonPhase` to send in a random opponent,
    // as opposed to `SwitchPhase` which allows for player choice
    expect(game.phaseInterceptor.log).not.toContain("SwitchPhase");
  });

  it.each<{ type: string; playerMove?: Moves; playerPassive?: Abilities; enemyMove?: Moves; enemyAbility?: Abilities }>(
    [
      { type: "variable recoil moves", playerMove: Moves.HEAD_SMASH },
      { type: "HP-based recoil moves", playerMove: Moves.CHLOROBLAST },
      { type: "weather", enemyMove: Moves.HAIL },
      { type: "status", enemyMove: Moves.TOXIC },
      { type: "Ghost-type Curse", enemyMove: Moves.CURSE },
      { type: "Salt Cure", enemyMove: Moves.SALT_CURE },
      { type: "partial trapping moves", enemyMove: Moves.WHIRLPOOL }, // no guard passive makes this 100% accurate
      { type: "Leech Seed", enemyMove: Moves.LEECH_SEED },
      { type: "Powder", playerMove: Moves.EMBER, enemyMove: Moves.POWDER },
      { type: "Nightmare", playerPassive: Abilities.COMATOSE, enemyMove: Moves.NIGHTMARE },
      { type: "Bad Dreams", playerPassive: Abilities.COMATOSE, enemyAbility: Abilities.BAD_DREAMS },
    ],
  )(
    "should activate from damage caused by $type",
    async ({
      playerMove = Moves.SPLASH,
      playerPassive = Abilities.NONE,
      enemyMove = Moves.SPLASH,
      enemyAbility = Abilities.STURDY,
    }) => {
      game.override
        .moveset(playerMove)
        .enemyLevel(1)
        .passiveAbility(playerPassive)
        .enemySpecies(Species.GASTLY)
        .enemyMoveset(enemyMove)
        .enemyAbility(enemyAbility);
      await game.classicMode.startBattle([Species.WIMPOD, Species.TYRUNT]);

      const wimpod = game.scene.getPlayerPokemon()!;
      expect(wimpod).toBeDefined();
      wimpod.hp = toDmgValue(wimpod.getMaxHp() / 2 + 2);
      // mock enemy attack damage func to only do 1 dmg (for whirlpool)
      vi.spyOn(wimpod, "getAttackDamage").mockReturnValueOnce({
        cancelled: false,
        result: HitResult.EFFECTIVE,
        damage: 1,
      });

      game.move.select(playerMove);
      game.doSelectPartyPokemon(1);
      await game.toNextTurn();

      confirmSwitch();
    },
  );

  it.each<[name: string, ability: Abilities]>([
    ["Innards Out", Abilities.INNARDS_OUT],
    ["Aftermath", Abilities.AFTERMATH],
    ["Rough Skin", Abilities.ROUGH_SKIN],
  ])("should trigger after taking damage from %s ability", async (_, ability) => {
    game.override.enemyAbility(ability).enemyMoveset(Moves.SPLASH);
    await game.classicMode.startBattle([Species.WIMPOD, Species.TYRUNT]);

    const wimpod = game.scene.getPlayerPokemon()!;
    wimpod.hp *= 0.51;
    game.scene.getEnemyPokemon()!.hp = wimpod.hp - 1; // Ensure innards out doesn't KO

    game.move.select(Moves.GUILLOTINE);
    game.doSelectPartyPokemon(1);
    await game.toNextWave();

    confirmSwitch();
  });

  it("should not trigger from Sheer Force-boosted moves", async () => {
    game.override.enemyAbility(Abilities.SHEER_FORCE).enemyMoveset(Moves.SLUDGE_BOMB).startingLevel(95);
    await game.classicMode.startBattle([Species.WIMPOD, Species.TYRUNT]);

    game.scene.getPlayerPokemon()!.hp *= 0.51;

    game.move.select(Moves.ENDURE);
    await game.phaseInterceptor.to("TurnEndPhase");

    confirmNoSwitch();
  });

  it("should trigger from Flame Burst splash damage in doubles", async () => {
    game.override.battleStyle("double").enemyMoveset([Moves.FLAME_BURST, Moves.SPLASH]);
    await game.classicMode.startBattle([Species.WIMPOD, Species.ZYGARDE, Species.TYRUNT]);

    const wimpod = game.scene.getPlayerPokemon()!;
    expect(wimpod).toBeDefined();
    wimpod.hp *= 0.55;

    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER);
    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER_2);
    await game.forceEnemyMove(Moves.FLAME_BURST, BattlerIndex.PLAYER_2);
    await game.forceEnemyMove(Moves.SPLASH);
    game.doSelectPartyPokemon(2);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(wimpod.isOnField()).toBe(false);
    expect(wimpod.getHpRatio()).toBeLessThan(0.5);
  });

  it("should not activate when the Pokémon cuts its own HP below half", async () => {
    game.override.moveset(Moves.SUBSTITUTE).enemyMoveset([Moves.TIDY_UP, Moves.ROUND]);
    await game.classicMode.startBattle([Species.WIMPOD, Species.TYRUNT]);

    // Turn 1: Substitute knocks below half; no switch
    const wimpod = game.scene.getPlayerPokemon()!;
    wimpod.hp *= 0.52;

    game.move.select(Moves.SUBSTITUTE);
    await game.forceEnemyMove(Moves.TIDY_UP);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    confirmNoSwitch();
    // Turn 2: get back enough HP that substitute doesn't put us under
    wimpod.hp = wimpod.getMaxHp() * 0.8;

    game.move.select(Moves.SUBSTITUTE);
    await game.forceEnemyMove(Moves.ROUND);
    game.doSelectPartyPokemon(1);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("TurnEndPhase");

    confirmSwitch();
  });

  it("should not trigger when neutralized", async () => {
    game.override.enemyAbility(Abilities.NEUTRALIZING_GAS).startingLevel(5);
    await game.classicMode.startBattle([Species.WIMPOD, Species.TYRUNT]);

    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    confirmNoSwitch();
  });

  it("should disregard Shell Bell recovery while still activating it before switching", async () => {
    game.override
      .moveset(Moves.DOUBLE_EDGE)
      .enemyMoveset(Moves.SPLASH)
      .startingHeldItems([{ name: "SHELL_BELL", count: 4 }]); // heals 50% of damage dealt, more than recoil takes away
    await game.classicMode.startBattle([Species.WIMPOD, Species.TYRUNT]);

    const wimpod = game.scene.getPlayerPokemon()!;
    wimpod.hp *= 0.51;

    game.move.select(Moves.DOUBLE_EDGE);
    game.doSelectPartyPokemon(1);
    await game.phaseInterceptor.to("MoveEffectPhase");

    // Wimp out check activated from recoil before shell bell procced, but did not deny the pokemon its recovery
    expect(wimpod.turnData.damageTaken).toBeGreaterThan(0);
    expect(wimpod.getHpRatio()).toBeGreaterThan(0.5);

    await game.phaseInterceptor.to("TurnEndPhase");
    confirmSwitch();
    expect(game.phaseInterceptor.log).toContain("PokemonHealPhase");
  });

  it("should activate from entry hazard damage", async () => {
    game.scene.arena.addTag(ArenaTagType.STEALTH_ROCK, 1, Moves.STEALTH_ROCK, 0, ArenaTagSide.ENEMY);
    game.scene.arena.addTag(ArenaTagType.SPIKES, 1, Moves.SPIKES, 0, ArenaTagSide.ENEMY);
    game.override.enemySpecies(Species.CENTISKORCH).enemyAbility(Abilities.WIMP_OUT);
    await game.classicMode.startBattle([Species.TYRUNT]);

    expect(game.phaseInterceptor.log).not.toContain("MovePhase");
    expect(game.phaseInterceptor.log).toContain("BattleEndPhase");
  });

  it("should not switch if Magic Guard prevents damage", async () => {
    game.override.passiveAbility(Abilities.MAGIC_GUARD).enemyMoveset(Moves.LEECH_SEED);
    await game.classicMode.startBattle([Species.WIMPOD, Species.TYRUNT]);

    const wimpod = game.scene.getPlayerPokemon()!;
    wimpod.hp *= 0.51;

    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    expect(wimpod.isOnField()).toBe(true);
    expect(wimpod.getHpRatio()).toBeCloseTo(0.51);
  });

  it("should not cancel a double battle on activation", async () => {
    game.override.battleStyle("double").enemyAbility(Abilities.WIMP_OUT).enemyMoveset([Moves.SPLASH]).enemyLevel(1);
    await game.classicMode.startBattle([Species.WIMPOD, Species.TYRUNT]);
    const enemyLeadPokemon = game.scene.getEnemyParty()[0];
    const enemySecPokemon = game.scene.getEnemyParty()[1];

    game.move.select(Moves.FALSE_SWIPE, 0, BattlerIndex.ENEMY);
    game.move.select(Moves.SPLASH, 1);

    await game.phaseInterceptor.to("BerryPhase");

    const isVisibleLead = enemyLeadPokemon.visible;
    const hasFledLead = enemyLeadPokemon.switchOutStatus;
    const isVisibleSec = enemySecPokemon.visible;
    const hasFledSec = enemySecPokemon.switchOutStatus;
    expect(!isVisibleLead && hasFledLead && isVisibleSec && !hasFledSec).toBe(true);
    expect(enemyLeadPokemon.hp).toBeLessThan(enemyLeadPokemon.getMaxHp());
    expect(enemySecPokemon.hp).toEqual(enemySecPokemon.getMaxHp());
  });

  it("triggers move effects on the wimp out user before switching", async () => {
    game.override.enemyMoveset(Moves.SLUDGE_BOMB).startingLevel(80);
    await game.classicMode.startBattle([Species.WIMPOD, Species.TYRUNT]);
    vi.spyOn(allMoves[Moves.SLUDGE_BOMB], "chance", "get").mockReturnValue(100);

    game.move.select(Moves.SPLASH);
    game.doSelectPartyPokemon(1);
    await game.phaseInterceptor.to("TurnEndPhase");

    confirmSwitch();
    expect(game.scene.getPlayerParty()[1].status?.effect).toBe(StatusEffect.POISON);
  });

  it.each<{ type: string; move?: Moves; ability?: Abilities; items?: ModifierOverride[] }>([
    { type: "normal", move: Moves.DUAL_CHOP },
    { type: "Parental Bond", ability: Abilities.PARENTAL_BOND },
    { type: "Multi Lens", items: [{ name: "MULTI_LENS", count: 1 }] },
  ])(
    "should trigger after the last hit of $type multi-strike moves",
    async ({ move = Moves.TACKLE, ability = Abilities.COMPOUND_EYES, items = [] }) => {
      game.override.enemyMoveset(move).enemyAbility(ability).enemyHeldItems(items);
      await game.classicMode.startBattle([Species.WIMPOD, Species.TYRUNT]);

      const wimpod = game.scene.getPlayerPokemon()!;
      wimpod.hp *= 0.51;

      game.move.select(Moves.ENDURE);
      game.doSelectPartyPokemon(1);
      await game.phaseInterceptor.to("TurnEndPhase");

      const enemyPokemon = game.scene.getEnemyPokemon()!;
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
    game.override.enemyMoveset(Moves.CONFUSE_RAY).confusionActivation(true);
    await game.classicMode.startBattle([Species.WIMPOD, Species.TYRUNT]);

    const wimpod = game.scene.getPlayerPokemon()!;
    wimpod.hp *= 0.51;

    game.move.select(Moves.SPLASH);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("TurnEndPhase");

    confirmNoSwitch();
  });

  it("should not activate on wave X0 bosses", async () => {
    game.override.enemyAbility(Abilities.WIMP_OUT).startingLevel(5850).startingWave(10).enemyHealthSegments(3);
    await game.classicMode.startBattle([Species.GOLISOPOD]);

    const enemyPokemon = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.FALSE_SWIPE);
    await game.toNextTurn();

    expect(enemyPokemon.visible).toBe(true);
    expect(enemyPokemon.switchOutStatus).toBe(false);
  });

  it("should not skip battles when triggered in a double battle", async () => {
    const wave = 2;
    game.override
      .enemyMoveset(Moves.SPLASH)
      .enemySpecies(Species.WIMPOD)
      .enemyAbility(Abilities.WIMP_OUT)
      .moveset([Moves.MATCHA_GOTCHA, Moves.FALSE_SWIPE])
      .startingLevel(50)
      .enemyLevel(1)
      .battleStyle("double")
      .startingWave(wave);
    await game.classicMode.startBattle([Species.RAICHU, Species.PIKACHU]);
    const [wimpod0, wimpod1] = game.scene.getEnemyField();

    game.move.select(Moves.FALSE_SWIPE, 0, BattlerIndex.ENEMY);
    game.move.select(Moves.MATCHA_GOTCHA, 1);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(wimpod0.hp).toBeGreaterThan(0);
    expect(wimpod0.switchOutStatus).toBe(true);
    expect(wimpod0.isFainted()).toBe(false);
    expect(wimpod1.isFainted()).toBe(true);

    await game.toNextWave();
    expect(game.scene.currentBattle.waveIndex).toBe(wave + 1);
  });

  it("should not skip battles when triggering the same turn as another enemy faints", async () => {
    const wave = 2;
    game.override
      .enemySpecies(Species.WIMPOD)
      .enemyAbility(Abilities.WIMP_OUT)
      .startingLevel(50)
      .enemyLevel(1)
      .enemyMoveset([Moves.SPLASH, Moves.ENDURE])
      .battleStyle("double")
      .moveset([Moves.DRAGON_ENERGY, Moves.SPLASH])
      .startingWave(wave);

    await game.classicMode.startBattle([Species.REGIDRAGO, Species.MAGIKARP]);

    // turn 1 - 1st wimpod faints while the 2nd one flees
    game.move.select(Moves.DRAGON_ENERGY, 0);
    game.move.select(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.forceEnemyMove(Moves.ENDURE);

    await game.phaseInterceptor.to("SelectModifierPhase");
    expect(game.scene.currentBattle.waveIndex).toBe(wave + 1);
  });
});
