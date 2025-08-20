import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { WeatherType } from "#enums/weather-type";
import { GameManager } from "#test/test-utils/game-manager";
import { toDmgValue } from "#utils/common";
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
      .battleStyle("single")
      .ability(AbilityId.WIMP_OUT)
      .enemySpecies(SpeciesId.NINJASK)
      .enemyPassiveAbility(AbilityId.NO_GUARD)
      .startingLevel(90)
      .enemyLevel(70)
      .moveset([MoveId.SPLASH, MoveId.FALSE_SWIPE, MoveId.ENDURE])
      .enemyMoveset(MoveId.FALSE_SWIPE)
      .criticalHits(false);
  });

  function confirmSwitch(): void {
    const [pokemon1, pokemon2] = game.scene.getPlayerParty();

    expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");

    expect(pokemon1.species.speciesId).not.toBe(SpeciesId.WIMPOD);

    expect(pokemon2.species.speciesId).toBe(SpeciesId.WIMPOD);
    expect(pokemon2.isFainted()).toBe(false);
    expect(pokemon2.getHpRatio()).toBeLessThan(0.5);
  }

  function confirmNoSwitch(): void {
    const [pokemon1, pokemon2] = game.scene.getPlayerParty();

    expect(game.phaseInterceptor.log).not.toContain("SwitchSummonPhase");

    expect(pokemon2.species.speciesId).not.toBe(SpeciesId.WIMPOD);

    expect(pokemon1.species.speciesId).toBe(SpeciesId.WIMPOD);
    expect(pokemon1.isFainted()).toBe(false);
    expect(pokemon1.getHpRatio()).toBeLessThan(0.5);
  }

  it("triggers regenerator passive single time when switching out with wimp out", async () => {
    game.override.passiveAbility(AbilityId.REGENERATOR).startingLevel(5).enemyLevel(100);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

    const wimpod = game.field.getPlayerPokemon();

    game.move.select(MoveId.SPLASH);
    game.doSelectPartyPokemon(1);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(wimpod.hp).toEqual(Math.floor(wimpod.getMaxHp() * 0.33 + 1));
    confirmSwitch();
  });

  it("It makes wild pokemon flee if triggered", async () => {
    game.override.enemyAbility(AbilityId.WIMP_OUT);
    await game.classicMode.startBattle([SpeciesId.GOLISOPOD, SpeciesId.TYRUNT]);

    const enemyPokemon = game.field.getEnemyPokemon();
    enemyPokemon.hp *= 0.52;

    game.move.select(MoveId.FALSE_SWIPE);
    await game.phaseInterceptor.to("BerryPhase");

    const isVisible = enemyPokemon.visible;
    const hasFled = enemyPokemon.switchOutStatus;
    expect(!isVisible && hasFled).toBe(true);
  });

  it("Does not trigger when HP already below half", async () => {
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);
    const wimpod = game.field.getPlayerPokemon();
    wimpod.hp = 5;

    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(wimpod.hp).toEqual(1);
    confirmNoSwitch();
  });

  it("Trapping moves do not prevent Wimp Out from activating.", async () => {
    game.override.enemyMoveset([MoveId.SPIRIT_SHACKLE]).startingLevel(1).passiveAbility(AbilityId.STURDY);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

    game.move.select(MoveId.SPLASH);
    game.doSelectPartyPokemon(1);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");
    expect(game.field.getPlayerPokemon().getTag(BattlerTagType.TRAPPED)).toBeUndefined();
    expect(game.scene.getPlayerParty()[1].getTag(BattlerTagType.TRAPPED)).toBeUndefined();
    confirmSwitch();
  });

  it("If this Ability activates due to being hit by U-turn or Volt Switch, the user of that move will not be switched out.", async () => {
    game.override.startingLevel(1).enemyMoveset([MoveId.U_TURN]).passiveAbility(AbilityId.STURDY);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

    game.move.select(MoveId.SPLASH);
    game.doSelectPartyPokemon(1);
    await game.phaseInterceptor.to("TurnEndPhase");

    const enemyPokemon = game.field.getEnemyPokemon();
    const hasFled = enemyPokemon.switchOutStatus;
    expect(hasFled).toBe(false);
    confirmSwitch();
  });

  it("If this Ability does not activate due to being hit by U-turn or Volt Switch, the user of that move will be switched out.", async () => {
    game.override.startingLevel(190).startingWave(8).enemyMoveset([MoveId.U_TURN]);
    await game.classicMode.startBattle([SpeciesId.GOLISOPOD, SpeciesId.TYRUNT]);
    const RIVAL_NINJASK1 = game.field.getEnemyPokemon().id;
    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("BerryPhase", false);
    expect(game.field.getEnemyPokemon().id !== RIVAL_NINJASK1);
  });

  it("Dragon Tail and Circle Throw switch out Pokémon before the Ability activates.", async () => {
    game.override.startingLevel(69).enemyMoveset([MoveId.DRAGON_TAIL]);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

    const wimpod = game.field.getPlayerPokemon();

    game.move.select(MoveId.SPLASH);
    game.doSelectPartyPokemon(1);
    await game.phaseInterceptor.to("SwitchSummonPhase", false);

    expect(wimpod.waveData.abilitiesApplied).not.toContain(AbilityId.WIMP_OUT);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.field.getPlayerPokemon().species.speciesId).not.toBe(SpeciesId.WIMPOD);
  });

  it("triggers when recoil damage is taken", async () => {
    game.override.moveset([MoveId.HEAD_SMASH]).enemyMoveset([MoveId.SPLASH]);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

    game.move.select(MoveId.HEAD_SMASH);
    game.doSelectPartyPokemon(1);
    await game.phaseInterceptor.to("TurnEndPhase");

    confirmSwitch();
  });

  it("It does not activate when the Pokémon cuts its own HP", async () => {
    game.override.moveset([MoveId.SUBSTITUTE]).enemyMoveset([MoveId.SPLASH]);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

    const wimpod = game.field.getPlayerPokemon();
    wimpod.hp *= 0.52;

    game.move.select(MoveId.SUBSTITUTE);
    await game.phaseInterceptor.to("TurnEndPhase");

    confirmNoSwitch();
  });

  it("Does not trigger when neutralized", async () => {
    game.override.enemyAbility(AbilityId.NEUTRALIZING_GAS).startingLevel(5);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    confirmNoSwitch();
  });

  // TODO: Enable when this behavior is fixed (currently Shell Bell won't activate if Wimp Out activates because
  // the pokemon is removed from the field before the Shell Bell modifier is applied, so it can't see the
  // damage dealt and doesn't heal the pokemon)
  it.todo(
    "If it falls below half and recovers back above half from a Shell Bell, Wimp Out will activate even after the Shell Bell recovery",
    async () => {
      game.override
        .moveset([MoveId.DOUBLE_EDGE])
        .enemyMoveset([MoveId.SPLASH])
        .startingHeldItems([{ name: "SHELL_BELL", count: 4 }]);
      await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

      const wimpod = game.field.getPlayerPokemon();

      wimpod.damageAndUpdate(toDmgValue(wimpod.getMaxHp() * 0.4));

      game.move.select(MoveId.DOUBLE_EDGE);
      game.doSelectPartyPokemon(1);
      await game.phaseInterceptor.to("TurnEndPhase");

      expect(game.scene.getPlayerParty()[1]).toBe(wimpod);
      expect(wimpod.hp).toBeGreaterThan(toDmgValue(wimpod.getMaxHp() / 2));
      expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");
      expect(game.field.getPlayerPokemon().species.speciesId).toBe(SpeciesId.TYRUNT);
    },
  );

  it("Wimp Out will activate due to weather damage", async () => {
    game.override.weather(WeatherType.HAIL).enemyMoveset([MoveId.SPLASH]);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

    game.field.getPlayerPokemon().hp *= 0.51;

    game.move.select(MoveId.SPLASH);
    game.doSelectPartyPokemon(1);
    await game.phaseInterceptor.to("TurnEndPhase");

    confirmSwitch();
  });

  it("Does not trigger when enemy has sheer force", async () => {
    game.override.enemyAbility(AbilityId.SHEER_FORCE).enemyMoveset(MoveId.SLUDGE_BOMB).startingLevel(95);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

    game.field.getPlayerPokemon().hp *= 0.51;

    game.move.select(MoveId.ENDURE);
    await game.phaseInterceptor.to("TurnEndPhase");

    confirmNoSwitch();
  });

  it("Wimp Out will activate due to post turn status damage", async () => {
    game.override.statusEffect(StatusEffect.POISON).enemyMoveset([MoveId.SPLASH]);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

    game.field.getPlayerPokemon().hp *= 0.51;

    game.move.select(MoveId.SPLASH);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    confirmSwitch();
  });

  it("Wimp Out will activate due to bad dreams", async () => {
    game.override.statusEffect(StatusEffect.SLEEP).enemyAbility(AbilityId.BAD_DREAMS);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

    game.field.getPlayerPokemon().hp *= 0.52;

    game.move.select(MoveId.SPLASH);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    confirmSwitch();
  });

  it("Wimp Out will activate due to leech seed", async () => {
    game.override.enemyMoveset([MoveId.LEECH_SEED]);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);
    game.field.getPlayerPokemon().hp *= 0.52;

    game.move.select(MoveId.SPLASH);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    confirmSwitch();
  });

  it("Wimp Out will activate due to curse damage", async () => {
    game.override.enemySpecies(SpeciesId.DUSKNOIR).enemyMoveset([MoveId.CURSE]);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);
    game.field.getPlayerPokemon().hp *= 0.52;

    game.move.select(MoveId.SPLASH);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    confirmSwitch();
  });

  it("Wimp Out will activate due to salt cure damage", async () => {
    game.override.enemySpecies(SpeciesId.NACLI).enemyMoveset([MoveId.SALT_CURE]).enemyLevel(1);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);
    game.field.getPlayerPokemon().hp *= 0.7;

    game.move.select(MoveId.SPLASH);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    confirmSwitch();
  });

  it("Wimp Out will activate due to damaging trap damage", async () => {
    game.override.enemySpecies(SpeciesId.MAGIKARP).enemyMoveset([MoveId.WHIRLPOOL]).enemyLevel(1);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);
    game.field.getPlayerPokemon().hp *= 0.55;

    game.move.select(MoveId.SPLASH);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    confirmSwitch();
  });

  it("Magic Guard passive should not allow indirect damage to trigger Wimp Out", async () => {
    game.scene.arena.addTag(ArenaTagType.STEALTH_ROCK, 1, MoveId.STEALTH_ROCK, 0, ArenaTagSide.ENEMY);
    game.scene.arena.addTag(ArenaTagType.SPIKES, 1, MoveId.SPIKES, 0, ArenaTagSide.ENEMY);
    game.override
      .passiveAbility(AbilityId.MAGIC_GUARD)
      .enemyMoveset([MoveId.LEECH_SEED])
      .weather(WeatherType.HAIL)
      .statusEffect(StatusEffect.POISON);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);
    game.field.getPlayerPokemon().hp *= 0.51;

    game.move.select(MoveId.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.field.getPlayerPokemon().getHpRatio()).toEqual(0.51);
    expect(game.phaseInterceptor.log).not.toContain("SwitchSummonPhase");
    expect(game.field.getPlayerPokemon().species.speciesId).toBe(SpeciesId.WIMPOD);
  });

  it("Wimp Out activating should not cancel a double battle", async () => {
    game.override.battleStyle("double").enemyAbility(AbilityId.WIMP_OUT).enemyMoveset([MoveId.SPLASH]).enemyLevel(1);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);
    const [enemyLeadPokemon, enemySecPokemon] = game.scene.getEnemyParty();

    game.move.select(MoveId.FALSE_SWIPE, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.SPLASH, 1);

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
    game.override
      .moveset([MoveId.THUNDER_PUNCH])
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.AFTERMATH)
      .enemyMoveset([MoveId.SPLASH])
      .enemyLevel(1);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);
    game.field.getPlayerPokemon().hp *= 0.51;

    game.move.select(MoveId.THUNDER_PUNCH);
    game.doSelectPartyPokemon(1);
    await game.phaseInterceptor.to("TurnEndPhase");

    confirmSwitch();
  });

  it("Activates due to entry hazards", async () => {
    game.scene.arena.addTag(ArenaTagType.STEALTH_ROCK, 1, MoveId.STEALTH_ROCK, 0, ArenaTagSide.ENEMY);
    game.scene.arena.addTag(ArenaTagType.SPIKES, 1, MoveId.SPIKES, 0, ArenaTagSide.ENEMY);
    game.override.enemySpecies(SpeciesId.CENTISKORCH).enemyAbility(AbilityId.WIMP_OUT).startingWave(4);
    await game.classicMode.startBattle([SpeciesId.TYRUNT]);

    expect(game.phaseInterceptor.log).not.toContain("MovePhase");
    expect(game.phaseInterceptor.log).toContain("BattleEndPhase");
  });

  it("Wimp Out will activate due to Nightmare", async () => {
    game.override.enemyMoveset([MoveId.NIGHTMARE]).statusEffect(StatusEffect.SLEEP);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);
    game.field.getPlayerPokemon().hp *= 0.65;

    game.move.select(MoveId.SPLASH);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    confirmSwitch();
  });

  it("triggers status on the wimp out user before a new pokemon is switched in", async () => {
    game.override.enemyMoveset(MoveId.SLUDGE_BOMB).startingLevel(80);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);
    vi.spyOn(allMoves[MoveId.SLUDGE_BOMB], "chance", "get").mockReturnValue(100);

    game.move.select(MoveId.SPLASH);
    game.doSelectPartyPokemon(1);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(game.scene.getPlayerParty()[1].status?.effect).toEqual(StatusEffect.POISON);
    confirmSwitch();
  });

  it("triggers after last hit of multi hit move", async () => {
    game.override.enemyMoveset(MoveId.BULLET_SEED).enemyAbility(AbilityId.SKILL_LINK);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

    game.field.getPlayerPokemon().hp *= 0.51;

    game.move.select(MoveId.ENDURE);
    game.doSelectPartyPokemon(1);
    await game.phaseInterceptor.to("TurnEndPhase");

    const enemyPokemon = game.field.getEnemyPokemon();
    expect(enemyPokemon.turnData.hitsLeft).toBe(0);
    expect(enemyPokemon.turnData.hitCount).toBe(5);
    confirmSwitch();
  });

  it("triggers after last hit of multi hit move (multi lens)", async () => {
    game.override.enemyMoveset(MoveId.TACKLE).enemyHeldItems([{ name: "MULTI_LENS", count: 1 }]);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

    game.field.getPlayerPokemon().hp *= 0.51;

    game.move.select(MoveId.ENDURE);
    game.doSelectPartyPokemon(1);
    await game.phaseInterceptor.to("TurnEndPhase");

    const enemyPokemon = game.field.getEnemyPokemon();
    expect(enemyPokemon.turnData.hitsLeft).toBe(0);
    expect(enemyPokemon.turnData.hitCount).toBe(2);
    confirmSwitch();
  });
  it("triggers after last hit of Parental Bond", async () => {
    game.override.enemyMoveset(MoveId.TACKLE).enemyAbility(AbilityId.PARENTAL_BOND);
    await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);

    game.field.getPlayerPokemon().hp *= 0.51;

    game.move.select(MoveId.ENDURE);
    game.doSelectPartyPokemon(1);
    await game.phaseInterceptor.to("TurnEndPhase");

    const enemyPokemon = game.field.getEnemyPokemon();
    expect(enemyPokemon.turnData.hitsLeft).toBe(0);
    expect(enemyPokemon.turnData.hitCount).toBe(2);
    confirmSwitch();
  });

  // TODO: This interaction is not implemented yet
  it.todo(
    "Wimp Out will not activate if the Pokémon's HP falls below half due to hurting itself in confusion",
    async () => {
      game.override.moveset([MoveId.SWORDS_DANCE]).enemyMoveset([MoveId.SWAGGER]);
      await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRUNT]);
      const playerPokemon = game.field.getPlayerPokemon();
      playerPokemon.hp *= 0.51;
      playerPokemon.setStatStage(Stat.ATK, 6);
      playerPokemon.addTag(BattlerTagType.CONFUSED);

      // TODO: add helper function to force confusion self-hits

      while (playerPokemon.getHpRatio() > 0.49) {
        game.move.select(MoveId.SWORDS_DANCE);
        await game.phaseInterceptor.to("TurnEndPhase");
      }

      confirmNoSwitch();
    },
  );

  it("should not activate on wave X0 bosses", async () => {
    game.override.enemyAbility(AbilityId.WIMP_OUT).startingLevel(5850).startingWave(10);
    await game.classicMode.startBattle([SpeciesId.GOLISOPOD]);

    const enemyPokemon = game.field.getEnemyPokemon();

    // Use 2 turns of False Swipe due to opponent's health bar shield
    game.move.select(MoveId.FALSE_SWIPE);
    await game.toNextTurn();
    game.move.select(MoveId.FALSE_SWIPE);
    await game.toNextTurn();

    const isVisible = enemyPokemon.visible;
    const hasFled = enemyPokemon.switchOutStatus;
    expect(isVisible && !hasFled).toBe(true);
  });

  it("wimp out will not skip battles when triggered in a double battle", async () => {
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

    game.move.select(MoveId.FALSE_SWIPE, 0, BattlerIndex.ENEMY);
    game.move.select(MoveId.MATCHA_GOTCHA, 1);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(wimpod0.hp).toBeGreaterThan(0);
    expect(wimpod0.switchOutStatus).toBe(true);
    expect(wimpod0.isFainted()).toBe(false);
    expect(wimpod1.isFainted()).toBe(true);

    await game.toNextWave();
    expect(game.scene.currentBattle.waveIndex).toBe(wave + 1);
  });

  it("wimp out should not skip battles when triggering the same turn as another enemy faints", async () => {
    const wave = 2;
    game.override
      .enemySpecies(SpeciesId.WIMPOD)
      .enemyAbility(AbilityId.WIMP_OUT)
      .startingLevel(50)
      .enemyLevel(1)
      .enemyMoveset([MoveId.SPLASH, MoveId.ENDURE])
      .battleStyle("double")
      .moveset([MoveId.DRAGON_ENERGY, MoveId.SPLASH])
      .startingWave(wave);

    await game.classicMode.startBattle([SpeciesId.REGIDRAGO, SpeciesId.MAGIKARP]);

    // turn 1
    game.move.select(MoveId.DRAGON_ENERGY, 0);
    game.move.select(MoveId.SPLASH, 1);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.ENDURE);

    await game.phaseInterceptor.to("SelectModifierPhase");
    expect(game.scene.currentBattle.waveIndex).toBe(wave + 1);
  });
});
