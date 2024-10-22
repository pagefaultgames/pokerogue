import { BattlerIndex } from "#app/battle";
import { ArenaTagSide } from "#app/data/arena-tag";
import { allMoves } from "#app/data/move";
import { Abilities } from "#app/enums/abilities";
import { ArenaTagType } from "#app/enums/arena-tag-type";
import { BattlerTagType } from "#app/enums/battler-tag-type";
import { Stat } from "#app/enums/stat";
import { StatusEffect } from "#app/enums/status-effect";
import { WeatherType } from "#app/enums/weather-type";
import { TurnEndPhase } from "#app/phases/turn-end-phase";
import GameManager from "#app/test/utils/gameManager";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
      .battleType("single")
      .ability(Abilities.WIMP_OUT)
      .enemySpecies(Species.NINJASK)
      .startingLevel(90)
      .startingWave(97)
      .moveset([ Moves.SPLASH ])
      .enemyMoveset(Moves.FALSE_SWIPE)
      .disableCrits();
  });

  it("triggers regenerator passive single time when switching out with wimp out", async () => {
    // arrange
    game.override
      .passiveAbility(Abilities.REGENERATOR)
      .startingLevel(5)
      .enemyLevel(100);
    await game.startBattle([
      Species.WIMPOD,
      Species.TYRUNT
    ]);

    // act
    game.move.select(Moves.FALSE_SWIPE);
    game.doSelectPartyPokemon(1);
    await game.phaseInterceptor.to(TurnEndPhase);

    // assert
    expect(game.scene.getParty()[1].hp).toEqual(Math.floor(game.scene.getParty()[1].getMaxHp() * 0.33 + 1));
    expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");
    expect(game.scene.getPlayerPokemon()!.species.speciesId).toBe(Species.TYRUNT);
  });
  it("It makes wild pokemon flee if triggered", async () => {
    // arrange
    game.override
      .enemyAbility(Abilities.WIMP_OUT)
      .startingLevel(150)
      .moveset([ Moves.FALSE_SWIPE ]);
    await game.startBattle([
      Species.GOLISOPOD,
      Species.TYRUNT
    ]);

    // act
    game.move.select(Moves.FALSE_SWIPE);
    await game.phaseInterceptor.to("BerryPhase");

    // assert
    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const isVisible = enemyPokemon.visible;
    const hasFled = enemyPokemon.switchOutStatus;
    expect(!isVisible && hasFled).toBe(true);
  });

  it("Does not trigger when HP already below half", async () => {
    // arrange
    game.override.moveset([ Moves.SPLASH ]);
    const playerHp = 5;
    await game.startBattle([
      Species.WIMPOD,
      Species.TYRUNT
    ]);
    game.scene.getPlayerPokemon()!.hp = playerHp;


    // act
    game.move.select(Moves.FALSE_SWIPE);
    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to(TurnEndPhase);

    // assert
    expect(game.scene.getParty()[0].hp).toEqual(1);
    expect(game.phaseInterceptor.log).not.toContain("SwitchSummonPhase");
    expect(game.scene.getPlayerPokemon()!.species.speciesId).toBe(Species.WIMPOD);
  });
  it("Trapping moves do not prevent Wimp Out from activating.", async () => {
    // arrange
    game.override
      .enemyMoveset([ Moves.SPIRIT_SHACKLE ])
      .startingLevel(53)
      .enemyLevel(45);
    await game.startBattle([
      Species.WIMPOD,
      Species.TYRUNT
    ]);

    // act
    game.move.select(Moves.SPIRIT_SHACKLE);
    game.doSelectPartyPokemon(1);


    await game.phaseInterceptor.to(TurnEndPhase);

    // assert
    expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");
    expect(game.scene.getPlayerPokemon()!.getTag(BattlerTagType.TRAPPED)).toBeUndefined();
    expect(game.scene.getPlayerPokemon()!.species.speciesId).toBe(Species.TYRUNT);
  });

  it("If this Ability activates due to being hit by U-turn or Volt Switch, the user of that move will not be switched out.", async () => {
    // arrange
    game.override
      .startingLevel(95)
      .enemyMoveset([ Moves.U_TURN ]);
    await game.startBattle([
      Species.WIMPOD,
      Species.TYRUNT
    ]);

    // act
    game.move.select(Moves.U_TURN);
    game.doSelectPartyPokemon(1);
    await game.phaseInterceptor.to(TurnEndPhase);

    // assert
    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const hasFled = enemyPokemon.switchOutStatus;
    expect(hasFled).toBe(false);
    expect(game.scene.getParty()[1].getHpRatio()).toBeLessThan(0.5);
    expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");
    expect(game.scene.getPlayerPokemon()!.species.speciesId).toBe(Species.TYRUNT);
  });

  it("If this Ability does not activate due to being hit by U-turn or Volt Switch, the user of that move will be switched out.", async () => {
    // arrange
    game.override
      .startingLevel(190)
      .moveset([ Moves.SPLASH ])
      .enemyMoveset([ Moves.U_TURN ]);
    await game.startBattle([
      Species.GOLISOPOD,
      Species.TYRUNT
    ]);

    // act
    game.move.select(Moves.SPLASH);
    game.move.select(Moves.U_TURN);
    await game.phaseInterceptor.to(TurnEndPhase);

    // assert
    const enemyPokemon = game.scene.getEnemyPokemon()!;
    const hasFled = enemyPokemon.switchOutStatus;
    expect(hasFled).toBe(true);
  });
  it("Dragon Tail and Circle Throw switch out Pokémon before the Ability activates.", async () => {
    // arrange
    game.override
      .startingLevel(69)
      .moveset([ Moves.SPLASH ])
      .enemyMoveset([ Moves.DRAGON_TAIL ]);
    await game.startBattle([
      Species.WIMPOD,
      Species.TYRUNT
    ]);
    vi.spyOn(allMoves[Moves.DRAGON_TAIL], "accuracy", "get").mockReturnValue(100);


    // act
    game.move.select(Moves.DRAGON_TAIL);
    game.doSelectPartyPokemon(1);
    await game.phaseInterceptor.to(TurnEndPhase);
    // assert
    expect(game.scene.getParty()[1].getHpRatio()).toBeLessThan(0.5);
  });
  it("triggers when recoil damage is taken", async () => {
    // arrange
    game.override
      .moveset([ Moves.HEAD_SMASH ])
      .enemyMoveset([ Moves.SPLASH ]);
    await game.startBattle([
      Species.WIMPOD,
      Species.TYRUNT
    ]);
    vi.spyOn(allMoves[Moves.HEAD_SMASH], "accuracy", "get").mockReturnValue(100);


    // act
    game.move.select(Moves.HEAD_SMASH);
    game.doSelectPartyPokemon(1);
    await game.phaseInterceptor.to(TurnEndPhase);

    // assert
    expect(game.scene.getParty()[1].getHpRatio()).toBeLessThan(0.5);
    expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");
    expect(game.scene.getPlayerPokemon()!.species.speciesId).toBe(Species.TYRUNT);
  });
  it("It does not activate when the Pokémon cuts its own HP", async () => {
    // arrange
    game.override
      .moveset([ Moves.SUBSTITUTE ])
      .enemyMoveset([ Moves.SPLASH ]);
    await game.startBattle([
      Species.WIMPOD,
      Species.TYRUNT
    ]);
    const playerHp = game.scene.getPlayerPokemon()!.hp;
    game.scene.getPlayerPokemon()!.hp = playerHp * 0.52;


    // act
    game.move.select(Moves.SUBSTITUTE);
    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to(TurnEndPhase);

    // assert
    expect(game.scene.getParty()[0].getHpRatio()).toBeLessThan(0.5);
    expect(game.phaseInterceptor.log).not.toContain("SwitchSummonPhase");
    expect(game.scene.getPlayerPokemon()!.species.speciesId).toBe(Species.WIMPOD);
  });
  it("Does not trigger when neutralized", async () => {
    // arrange
    game.override
      .enemyAbility(Abilities.NEUTRALIZING_GAS)
      .startingLevel(5);
    await game.startBattle([
      Species.WIMPOD,
      Species.TYRUNT
    ]);

    // act
    game.move.select(Moves.FALSE_SWIPE);
    await game.phaseInterceptor.to(TurnEndPhase);

    // assert
    const playerPkm = game.scene.getPlayerPokemon()!;
    expect(playerPkm.species.speciesId).toEqual(Species.WIMPOD);
    expect(playerPkm.getHpRatio()).toBeLessThan(0.5);
    expect(game.phaseInterceptor.log).not.toContain("SwitchSummonPhase");
  });
  it("If it falls below half and recovers back above half from a Shell Bell, Wimp Out will activate even after the Shell Bell recovery", async () => {
    // arrange
    game.override
      .moveset([ Moves.DOUBLE_EDGE ])
      .enemyMoveset([ Moves.SPLASH ])
      .startingHeldItems([
        { name: "SHELL_BELL", count: 3 },
        { name: "HEALING_CHARM", count: 5 },
      ]);
    await game.startBattle([
      Species.WIMPOD,
      Species.TYRUNT
    ]);
    const playerHp = game.scene.getPlayerPokemon()!.hp;
    game.scene.getPlayerPokemon()!.hp = playerHp * 0.75;

    // act
    game.move.select(Moves.DOUBLE_EDGE);
    game.doSelectPartyPokemon(1);
    await game.phaseInterceptor.to(TurnEndPhase);

    // assert
    expect(game.scene.getParty()[1].getHpRatio()).toBeGreaterThan(0.5);
    expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");
    expect(game.scene.getPlayerPokemon()!.species.speciesId).toBe(Species.TYRUNT);
  });
  it("Wimp Out will activate due to weather damage", async () => {
    // arrange
    game.override
      .moveset([ Moves.SPLASH ])
      .weather(WeatherType.HAIL)
      .enemyMoveset([ Moves.SPLASH ]);
    await game.startBattle([
      Species.WIMPOD,
      Species.TYRUNT
    ]);
    const playerHp = game.scene.getPlayerPokemon()!.hp;
    game.scene.getPlayerPokemon()!.hp = playerHp * 0.51;

    // act
    game.move.select(Moves.SPLASH);
    game.doSelectPartyPokemon(1);
    await game.phaseInterceptor.to(TurnEndPhase);

    // assert
    expect(game.scene.getParty()[1].getHpRatio()).toBeLessThan(0.5);
    expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");
    expect(game.scene.getPlayerPokemon()!.species.speciesId).toBe(Species.TYRUNT);
  });
  it("Does not trigger when enemy has sheer force", async () => {
    // arrange
    game.override
      .enemyAbility(Abilities.SHEER_FORCE)
      .enemyMoveset(Moves.SLUDGE_BOMB)
      .startingLevel(90);
    await game.startBattle([
      Species.WIMPOD,
      Species.TYRUNT
    ]);

    // act
    game.move.select(Moves.SLUDGE_BOMB);
    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to(TurnEndPhase);

    // assert
    const playerPkm = game.scene.getPlayerPokemon()!;
    expect(playerPkm.species.speciesId).toEqual(Species.WIMPOD);
    expect(playerPkm.getHpRatio()).toBeLessThan(0.5);
    expect(game.phaseInterceptor.log).not.toContain("SwitchSummonPhase");
  });
  it("Wimp Out will activate due to post turn status damage", async () => {
    // arrange
    game.override
      .moveset([ Moves.SPLASH ])
      .statusEffect(StatusEffect.POISON)
      .enemyMoveset([ Moves.SPLASH ]);
    await game.startBattle([
      Species.WIMPOD,
      Species.TYRUNT
    ]);
    const playerHp = game.scene.getPlayerPokemon()!.hp;
    game.scene.getPlayerPokemon()!.hp = playerHp * 0.51;

    // act
    game.move.select(Moves.SPLASH);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();


    // assert
    expect(game.scene.getParty()[1].getHpRatio()).toBeLessThan(0.5);
    expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");
    expect(game.scene.getPlayerPokemon()!.species.speciesId).toBe(Species.TYRUNT);
  });
  it("Wimp Out will activate due to bad dreams", async () => {
    // arrange
    game.override
      .moveset([ Moves.SPLASH ])
      .statusEffect(StatusEffect.SLEEP)
      .enemyAbility(Abilities.BAD_DREAMS);
    await game.startBattle([
      Species.WIMPOD,
      Species.TYRUNT
    ]);
    const playerHp = game.scene.getPlayerPokemon()!.hp;
    game.scene.getPlayerPokemon()!.hp = playerHp * 0.52;

    // act
    game.move.select(Moves.SPLASH);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    // assert
    expect(game.scene.getParty()[1].getHpRatio()).toBeGreaterThan(0);
    expect(game.scene.getParty()[1].getHpRatio()).toBeLessThan(0.5);
    expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");
    expect(game.scene.getPlayerPokemon()!.species.speciesId).toBe(Species.TYRUNT);
  });
  it("Wimp Out will activate due to leech seed", async () => {
    // arrange
    game.override
      .moveset([ Moves.SPLASH ])
      .enemyMoveset([ Moves.LEECH_SEED ]);
    await game.startBattle([
      Species.WIMPOD,
      Species.TYRUNT
    ]);
    vi.spyOn(allMoves[Moves.LEECH_SEED], "accuracy", "get").mockReturnValue(100);
    const playerHp = game.scene.getPlayerPokemon()!.hp;
    game.scene.getPlayerPokemon()!.hp = playerHp * 0.52;

    // act
    game.move.select(Moves.LEECH_SEED);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    // assert
    expect(game.scene.getParty()[1].getHpRatio()).toBeGreaterThan(0);
    expect(game.scene.getParty()[1].getHpRatio()).toBeLessThan(0.5);
    expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");
    expect(game.scene.getPlayerPokemon()!.species.speciesId).toBe(Species.TYRUNT);
  });
  it("Wimp Out will activate due to curse damage", async () => {
    // arrange
    game.override
      .moveset([ Moves.SPLASH ])
      .enemySpecies(Species.DUSKNOIR)
      .enemyMoveset([ Moves.CURSE ]);
    await game.startBattle([
      Species.WIMPOD,
      Species.TYRUNT
    ]);
    const playerHp = game.scene.getPlayerPokemon()!.hp;
    game.scene.getPlayerPokemon()!.hp = playerHp * 0.52;

    // act
    game.move.select(Moves.CURSE);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    // assert
    expect(game.scene.getParty()[1].getHpRatio()).toBeGreaterThan(0);
    expect(game.scene.getParty()[1].getHpRatio()).toBeLessThan(0.5);
    expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");
    expect(game.scene.getPlayerPokemon()!.species.speciesId).toBe(Species.TYRUNT);
  });
  it("Wimp Out will activate due to salt cure damage", async () => {
    // arrange
    game.override
      .moveset([ Moves.SPLASH ])
      .enemySpecies(Species.NACLI)
      .enemyMoveset([ Moves.SALT_CURE ])
      .enemyLevel(1);
    await game.startBattle([
      Species.WIMPOD,
      Species.TYRUNT
    ]);
    const playerHp = game.scene.getPlayerPokemon()!.hp;
    game.scene.getPlayerPokemon()!.hp = playerHp * 0.70;

    // act
    game.move.select(Moves.SALT_CURE);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    // assert
    expect(game.scene.getParty()[1].getHpRatio()).toBeGreaterThan(0);
    expect(game.scene.getParty()[1].getHpRatio()).toBeLessThan(0.5);
    expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");
    expect(game.scene.getPlayerPokemon()!.species.speciesId).toBe(Species.TYRUNT);
  });
  it("Wimp Out will activate due to damaging trap damage", async () => {
    // arrange
    game.override
      .moveset([ Moves.SPLASH ])
      .enemySpecies(Species.MAGIKARP)
      .enemyMoveset([ Moves.WHIRLPOOL ])
      .enemyLevel(1);
    await game.startBattle([
      Species.WIMPOD,
      Species.TYRUNT
    ]);
    vi.spyOn(allMoves[Moves.WHIRLPOOL], "accuracy", "get").mockReturnValue(100);
    const playerHp = game.scene.getPlayerPokemon()!.hp;
    game.scene.getPlayerPokemon()!.hp = playerHp * 0.55;

    // act
    game.move.select(Moves.WHIRLPOOL);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    // assert
    expect(game.scene.getParty()[1].getHpRatio()).toBeGreaterThan(0);
    expect(game.scene.getParty()[1].getHpRatio()).toBeLessThan(0.5);
    expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");
    expect(game.scene.getPlayerPokemon()!.species.speciesId).toBe(Species.TYRUNT);
  });
  it("Wimp Out will not activate if the Pokémon's HP falls below half due to hurting itself in confusion", async () => {
    // arrange
    game.override
      .moveset([ Moves.SWORDS_DANCE ])
      .enemyMoveset([ Moves.SWAGGER ]);
    await game.startBattle([
      Species.WIMPOD,
      Species.TYRUNT
    ]);
    const playerPokemon = game.scene.getPlayerPokemon()!;
    const playerHp = playerPokemon.hp;
    playerPokemon.hp = playerHp * 0.51;
    playerPokemon.setStatStage(Stat.ATK, 6);
    playerPokemon.addTag(BattlerTagType.CONFUSED);
    vi.spyOn(playerPokemon, "randSeedInt").mockReturnValue(0);
    vi.spyOn(allMoves[Moves.SWAGGER], "accuracy", "get").mockReturnValue(100);

    // act
    while (playerPokemon.getHpRatio() > 0.49) {
      game.move.select(Moves.SWORDS_DANCE);
      game.move.select(Moves.SWAGGER);
      await game.phaseInterceptor.to(TurnEndPhase);
    }

    // assert
    expect(playerPokemon.getHpRatio()).toBeLessThan(0.5);
    expect(game.phaseInterceptor.log).not.toContain("SwitchSummonPhase");
    expect(playerPokemon.species.speciesId).toBe(Species.WIMPOD);
  });
  it("Magic Guard passive should not allow indirect damage to trigger Wimp Out", async () => {
    // arrange
    game.scene.arena.addTag(ArenaTagType.STEALTH_ROCK, 1, Moves.STEALTH_ROCK, 0, ArenaTagSide.ENEMY);
    game.scene.arena.addTag(ArenaTagType.SPIKES, 1, Moves.SPIKES, 0, ArenaTagSide.ENEMY);
    game.override
      .passiveAbility(Abilities.MAGIC_GUARD)
      .moveset([ Moves.SPLASH ])
      .enemyMoveset([ Moves.LEECH_SEED ])
      .weather(WeatherType.HAIL)
      .statusEffect(StatusEffect.POISON);
    await game.startBattle([
      Species.WIMPOD,
      Species.TYRUNT
    ]);
    vi.spyOn(allMoves[Moves.LEECH_SEED], "accuracy", "get").mockReturnValue(100);
    const playerHp = game.scene.getPlayerPokemon()!.hp;
    game.scene.getPlayerPokemon()!.hp = playerHp * 0.51;


    // act
    game.move.select(Moves.SPLASH);
    game.move.select(Moves.LEECH_SEED);
    await game.phaseInterceptor.to(TurnEndPhase);

    // assert
    expect(game.scene.getParty()[0].getHpRatio()).toEqual(0.51);
    expect(game.phaseInterceptor.log).not.toContain("SwitchSummonPhase");
    expect(game.scene.getPlayerPokemon()!.species.speciesId).toBe(Species.WIMPOD);
  });
  it("Wimp Out activating should not cancel a double battle", async () => {
    // arrange
    game.override
      .battleType("double")
      .moveset([ Moves.FALSE_SWIPE, Moves.SPLASH ])
      .enemyAbility(Abilities.WIMP_OUT)
      .enemyMoveset([ Moves.SPLASH ])
      .enemyLevel(1);
    await game.startBattle([
      Species.WIMPOD,
      Species.TYRUNT
    ]);
    const enemyLeadPokemon = game.scene.getEnemyParty()[0]!;
    const enemySecPokemon = game.scene.getEnemyParty()[1]!;

    game.move.select(Moves.FALSE_SWIPE, 0, BattlerIndex.ENEMY);
    game.move.select(Moves.SPLASH, 1, BattlerIndex.ENEMY);

    await game.phaseInterceptor.to("BerryPhase");

    const isVisibleLead = enemyLeadPokemon.visible;
    const hasFledLead = enemyLeadPokemon.switchOutStatus;
    const isVisibleSec = enemySecPokemon.visible;
    const hasFledSec = enemySecPokemon.switchOutStatus;
    expect(!isVisibleLead && hasFledLead && isVisibleSec && !hasFledSec).toBe(true);
    expect(enemyLeadPokemon.hp).toBeLessThan(enemyLeadPokemon.getMaxHp());
    expect(enemySecPokemon.hp).toEqual(enemySecPokemon.getMaxHp());
  });
  it("Wimp Out will activate due to aftermath", async () => {
    // arrange
    game.override
      .moveset([ Moves.THUNDER_PUNCH ])
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.AFTERMATH)
      .enemyMoveset([ Moves.SPLASH ])
      .enemyLevel(1);
    await game.startBattle([
      Species.WIMPOD,
      Species.TYRUNT
    ]);
    const playerHp = game.scene.getPlayerPokemon()!.hp;
    game.scene.getPlayerPokemon()!.hp = playerHp * 0.51;

    // act
    game.move.select(Moves.THUNDER_PUNCH);
    game.doSelectPartyPokemon(1);
    await game.phaseInterceptor.to(TurnEndPhase);

    // assert
    expect(game.scene.getParty()[1].getHpRatio()).toBeGreaterThan(0);
    expect(game.scene.getParty()[1].getHpRatio()).toBeLessThan(0.5);
    expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");
    expect(game.scene.getPlayerPokemon()!.species.speciesId).toBe(Species.TYRUNT);
  });
  it("Activates due to entry hazards", async () => {
    // arrange
    game.scene.arena.addTag(ArenaTagType.STEALTH_ROCK, 1, Moves.STEALTH_ROCK, 0, ArenaTagSide.ENEMY);
    game.scene.arena.addTag(ArenaTagType.SPIKES, 1, Moves.SPIKES, 0, ArenaTagSide.ENEMY);
    game.override
      .enemySpecies(Species.CENTISKORCH)
      .enemyAbility(Abilities.WIMP_OUT);
    await game.startBattle([
      Species.TYRUNT
    ]);

    // assert
    expect(game.phaseInterceptor.log).not.toContain("MovePhase");
    expect(game.phaseInterceptor.log).toContain("BattleEndPhase");
  });
  it("Wimp Out will activate due to Nightmare", async () => {
    // arrange
    game.override
      .moveset([ Moves.SPLASH ])
      .enemyMoveset([ Moves.NIGHTMARE ])
      .statusEffect(StatusEffect.SLEEP);
    await game.startBattle([
      Species.WIMPOD,
      Species.TYRUNT
    ]);
    const playerHp = game.scene.getPlayerPokemon()!.hp;
    game.scene.getPlayerPokemon()!.hp = playerHp * 0.65;

    // act
    game.move.select(Moves.NIGHTMARE);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    // assert
    expect(game.scene.getParty()[1].getHpRatio()).toBeGreaterThan(0);
    expect(game.scene.getParty()[1].getHpRatio()).toBeLessThan(0.5);
    expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");
    expect(game.scene.getPlayerPokemon()!.species.speciesId).toBe(Species.TYRUNT);
  });
  it("triggers status on the wimp out user before a new pokemon is switched in", async () => {
    // arrange
    game.override
      .enemyMoveset(Moves.SLUDGE_BOMB)
      .startingLevel(80);
    await game.startBattle([
      Species.WIMPOD,
      Species.TYRUNT
    ]);
    vi.spyOn(game.scene.getEnemyPokemon()!, "randSeedInt").mockReturnValue(0);

    // act
    game.move.select(Moves.SLUDGE_BOMB);
    game.doSelectPartyPokemon(1);
    await game.phaseInterceptor.to(TurnEndPhase);

    // assert
    const playerPkm = game.scene.getPlayerPokemon()!;
    expect(game.scene.getParty()[1].status?.effect).toEqual(StatusEffect.POISON);
    expect(playerPkm.species.speciesId).toEqual(Species.TYRUNT);
    expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");
  });
  it("triggers after last hit of multi hit move", async () => {
    // arrange
    game.override
      .enemyMoveset(Moves.BULLET_SEED)
      .enemyAbility(Abilities.SKILL_LINK)
      .startingLevel(110)
      .enemyLevel(80);
    await game.startBattle([
      Species.WIMPOD,
      Species.TYRUNT
    ]);

    // act
    game.move.select(Moves.BULLET_SEED);
    game.doSelectPartyPokemon(1);
    await game.phaseInterceptor.to(TurnEndPhase);

    // assert
    const enemyPokemon = game.scene.getEnemyPokemon()!;
    expect(enemyPokemon.turnData.hitsLeft).toBe(0);
    expect(enemyPokemon.turnData.hitCount).toBe(5);
  });
});
