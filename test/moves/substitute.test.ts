import { SubstituteTag, TrappedTag } from "#data/battler-tags";
import { allMoves } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { ArenaTagSide } from "#enums/arena-tag-side";
import { ArenaTagType } from "#enums/arena-tag-type";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { BerryType } from "#enums/berry-type";
import { Command } from "#enums/command";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { UiMode } from "#enums/ui-mode";
import { StealHeldItemChanceAttr } from "#moves/move";
import type { CommandPhase } from "#phases/command-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Substitute", () => {
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
      .moveset([MoveId.SUBSTITUTE, MoveId.SWORDS_DANCE, MoveId.TACKLE, MoveId.SPLASH])
      .enemySpecies(SpeciesId.SNORLAX)
      .enemyAbility(AbilityId.INSOMNIA)
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100)
      .enemyLevel(100);
  });

  it("should cause the user to take damage", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.field.getPlayerPokemon();

    game.move.select(MoveId.SUBSTITUTE);

    await game.phaseInterceptor.to("MoveEndPhase", false);

    expect(leadPokemon.hp).toBe(Math.ceil((leadPokemon.getMaxHp() * 3) / 4));
  });

  it("should redirect enemy attack damage to the Substitute doll", async () => {
    game.override.enemyMoveset(MoveId.TACKLE);

    await game.classicMode.startBattle([SpeciesId.SKARMORY]);

    const leadPokemon = game.field.getPlayerPokemon();

    game.move.select(MoveId.SUBSTITUTE);

    await game.phaseInterceptor.to("MoveEndPhase", false);

    expect(leadPokemon.hp).toBe(Math.ceil((leadPokemon.getMaxHp() * 3) / 4));
    expect(leadPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();
    const postSubHp = leadPokemon.hp;

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(leadPokemon.hp).toBe(postSubHp);
    expect(leadPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();
  });

  it("should fade after redirecting more damage than its remaining HP", async () => {
    // Giga Impact OHKOs Magikarp if substitute isn't up
    game.override.enemyMoveset(MoveId.GIGA_IMPACT);
    vi.spyOn(allMoves[MoveId.GIGA_IMPACT], "accuracy", "get").mockReturnValue(100);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.field.getPlayerPokemon();

    game.move.select(MoveId.SUBSTITUTE);

    await game.phaseInterceptor.to("MoveEndPhase", false);

    expect(leadPokemon.hp).toBe(Math.ceil((leadPokemon.getMaxHp() * 3) / 4));
    expect(leadPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();
    const postSubHp = leadPokemon.hp;

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(leadPokemon.hp).toBe(postSubHp);
    expect(leadPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeUndefined();
  });

  it("should block stat changes from status moves", async () => {
    game.override.enemyMoveset(MoveId.CHARM);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const leadPokemon = game.field.getPlayerPokemon();

    game.move.select(MoveId.SUBSTITUTE);

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(leadPokemon.getStatStage(Stat.ATK)).toBe(0);
    expect(leadPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();
  });

  it("should be bypassed by sound-based moves", async () => {
    game.override.enemyMoveset(MoveId.ECHOED_VOICE);

    await game.classicMode.startBattle([SpeciesId.BLASTOISE]);

    const leadPokemon = game.field.getPlayerPokemon();

    game.move.select(MoveId.SUBSTITUTE);

    await game.phaseInterceptor.to("MoveEndPhase");

    expect(leadPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();
    const postSubHp = leadPokemon.hp;

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(leadPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();
    expect(leadPokemon.hp).toBeLessThan(postSubHp);
  });

  it("should be bypassed by attackers with Infiltrator", async () => {
    game.override.enemyMoveset(MoveId.TACKLE).enemyAbility(AbilityId.INFILTRATOR);

    await game.classicMode.startBattle([SpeciesId.BLASTOISE]);

    const leadPokemon = game.field.getPlayerPokemon();

    game.move.select(MoveId.SUBSTITUTE);

    await game.phaseInterceptor.to("MoveEndPhase");

    expect(leadPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();
    const postSubHp = leadPokemon.hp;

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(leadPokemon.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();
    expect(leadPokemon.hp).toBeLessThan(postSubHp);
  });

  it("shouldn't block the user's own status moves", async () => {
    await game.classicMode.startBattle([SpeciesId.BLASTOISE]);

    const leadPokemon = game.field.getPlayerPokemon();

    game.move.select(MoveId.SUBSTITUTE);

    await game.phaseInterceptor.to("MoveEndPhase");
    await game.toNextTurn();

    game.move.select(MoveId.SWORDS_DANCE);

    await game.phaseInterceptor.to("MoveEndPhase", false);

    expect(leadPokemon.getStatStage(Stat.ATK)).toBe(2);
  });

  it("shouldn't block moves that target the user's side of the field", async () => {
    game.override.moveset(MoveId.LIGHT_SCREEN);

    await game.classicMode.startBattle([SpeciesId.BLASTOISE]);

    const leadPokemon = game.field.getPlayerPokemon();
    vi.spyOn(leadPokemon, "getMoveEffectiveness");

    leadPokemon.addTag(BattlerTagType.SUBSTITUTE, 0, MoveId.NONE, leadPokemon.id);

    game.move.select(MoveId.LIGHT_SCREEN);

    await game.toNextTurn();

    expect(leadPokemon.getMoveEffectiveness).not.toHaveReturnedWith(0);
    expect(game.scene.arena.getTagOnSide(ArenaTagType.LIGHT_SCREEN, ArenaTagSide.PLAYER)).toBeDefined();
  });

  it("shouldn't block the opponent from setting hazards", async () => {
    game.override.enemyMoveset(MoveId.STEALTH_ROCK);

    await game.classicMode.startBattle([SpeciesId.BLASTOISE]);

    const leadPokemon = game.field.getPlayerPokemon();
    vi.spyOn(leadPokemon, "getMoveEffectiveness");

    game.move.select(MoveId.SUBSTITUTE);

    await game.toNextTurn();

    expect(leadPokemon.getMoveEffectiveness).not.toHaveReturnedWith(0);
    expect(game.scene.arena.getTagOnSide(ArenaTagType.STEALTH_ROCK, ArenaTagSide.PLAYER)).toBeDefined();
  });

  it("shouldn't block moves that target both sides of the field", async () => {
    game.override.moveset(MoveId.TRICK_ROOM).enemyMoveset(MoveId.GRAVITY);

    await game.classicMode.startBattle([SpeciesId.BLASTOISE]);

    const pokemon = game.scene.getField(true);
    pokemon.forEach(p => {
      vi.spyOn(p, "getMoveEffectiveness");
      p.addTag(BattlerTagType.SUBSTITUTE, 0, MoveId.NONE, p.id);
    });

    game.move.select(MoveId.TRICK_ROOM);

    await game.toNextTurn();

    pokemon.forEach(p => expect(p.getMoveEffectiveness).not.toHaveReturnedWith(0));
    expect(game.scene.arena.getTag(ArenaTagType.TRICK_ROOM)).toBeDefined();
    expect(game.scene.arena.getTag(ArenaTagType.GRAVITY)).toBeDefined();
  });

  it("should protect the user from flinching", async () => {
    game.override.enemyMoveset(MoveId.FAKE_OUT).startingLevel(1); // Ensures the Substitute will break

    await game.classicMode.startBattle([SpeciesId.BLASTOISE]);

    const leadPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    leadPokemon.addTag(BattlerTagType.SUBSTITUTE, 0, MoveId.NONE, leadPokemon.id);

    game.move.select(MoveId.TACKLE);

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
  });

  it("should protect the user from being trapped", async () => {
    vi.spyOn(allMoves[MoveId.SAND_TOMB], "accuracy", "get").mockReturnValue(100);
    game.override.enemyMoveset(MoveId.SAND_TOMB);

    await game.classicMode.startBattle([SpeciesId.BLASTOISE]);

    const leadPokemon = game.field.getPlayerPokemon();

    leadPokemon.addTag(BattlerTagType.SUBSTITUTE, 0, MoveId.NONE, leadPokemon.id);

    game.move.select(MoveId.SPLASH);

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(leadPokemon.getTag(TrappedTag)).toBeUndefined();
  });

  it("should prevent the user's stats from being lowered", async () => {
    vi.spyOn(allMoves[MoveId.LIQUIDATION], "chance", "get").mockReturnValue(100);
    game.override.enemyMoveset(MoveId.LIQUIDATION);

    await game.classicMode.startBattle([SpeciesId.BLASTOISE]);

    const leadPokemon = game.field.getPlayerPokemon();

    leadPokemon.addTag(BattlerTagType.SUBSTITUTE, 0, MoveId.NONE, leadPokemon.id);

    game.move.select(MoveId.SPLASH);

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(leadPokemon.getStatStage(Stat.DEF)).toBe(0);
  });

  it("should protect the user from being afflicted with status effects", async () => {
    game.override.enemyMoveset(MoveId.NUZZLE);

    await game.classicMode.startBattle([SpeciesId.BLASTOISE]);

    const leadPokemon = game.field.getPlayerPokemon();

    leadPokemon.addTag(BattlerTagType.SUBSTITUTE, 0, MoveId.NONE, leadPokemon.id);

    game.move.select(MoveId.SPLASH);

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(leadPokemon.status?.effect).not.toBe(StatusEffect.PARALYSIS);
  });

  it("should prevent the user's items from being stolen", async () => {
    game.override.enemyMoveset(MoveId.THIEF).startingHeldItems([{ name: "BERRY", type: BerryType.SITRUS }]);
    vi.spyOn(allMoves[MoveId.THIEF], "attrs", "get").mockReturnValue([new StealHeldItemChanceAttr(1.0)]); // give Thief 100% steal rate

    await game.classicMode.startBattle([SpeciesId.BLASTOISE]);

    const leadPokemon = game.field.getPlayerPokemon();

    leadPokemon.addTag(BattlerTagType.SUBSTITUTE, 0, MoveId.NONE, leadPokemon.id);

    game.move.select(MoveId.SPLASH);

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(leadPokemon.getHeldItems().length).toBe(1);
  });

  it("should prevent the user's items from being removed", async () => {
    game.override.moveset([MoveId.KNOCK_OFF]).enemyHeldItems([{ name: "BERRY", type: BerryType.SITRUS }]);

    await game.classicMode.startBattle([SpeciesId.BLASTOISE]);

    const enemyPokemon = game.field.getEnemyPokemon();

    enemyPokemon.addTag(BattlerTagType.SUBSTITUTE, 0, MoveId.NONE, enemyPokemon.id);
    const enemyNumItems = enemyPokemon.getHeldItems().length;

    game.move.select(MoveId.KNOCK_OFF);

    await game.phaseInterceptor.to("MoveEndPhase", false);

    expect(enemyPokemon.getHeldItems().length).toBe(enemyNumItems);
  });

  it("move effect should prevent the user's berries from being stolen and eaten", async () => {
    game.override.enemyMoveset(MoveId.BUG_BITE).startingHeldItems([{ name: "BERRY", type: BerryType.SITRUS }]);

    await game.classicMode.startBattle([SpeciesId.BLASTOISE]);

    const leadPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    leadPokemon.addTag(BattlerTagType.SUBSTITUTE, 0, MoveId.NONE, leadPokemon.id);

    game.move.select(MoveId.TACKLE);

    await game.phaseInterceptor.to("MoveEndPhase", false);
    const enemyPostAttackHp = enemyPokemon.hp;

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(leadPokemon.getHeldItems().length).toBe(1);
    expect(enemyPokemon.hp).toBe(enemyPostAttackHp);
  });

  it("should prevent the user's stats from being reset by Clear Smog", async () => {
    game.override.enemyMoveset(MoveId.CLEAR_SMOG);

    await game.classicMode.startBattle([SpeciesId.BLASTOISE]);

    const leadPokemon = game.field.getPlayerPokemon();

    leadPokemon.addTag(BattlerTagType.SUBSTITUTE, 0, MoveId.NONE, leadPokemon.id);

    game.move.select(MoveId.SWORDS_DANCE);

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(leadPokemon.getStatStage(Stat.ATK)).toBe(2);
  });

  it("should prevent the user from becoming confused", async () => {
    game.override.enemyMoveset(MoveId.MAGICAL_TORQUE);
    vi.spyOn(allMoves[MoveId.MAGICAL_TORQUE], "chance", "get").mockReturnValue(100);

    await game.classicMode.startBattle([SpeciesId.BLASTOISE]);

    const leadPokemon = game.field.getPlayerPokemon();

    leadPokemon.addTag(BattlerTagType.SUBSTITUTE, 0, MoveId.NONE, leadPokemon.id);

    game.move.select(MoveId.SWORDS_DANCE);

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(leadPokemon.getTag(BattlerTagType.CONFUSED)).toBeUndefined();
    expect(leadPokemon.getStatStage(Stat.ATK)).toBe(2);
  });

  it("should transfer to the switched in Pokemon when the source uses Baton Pass", async () => {
    game.override.moveset([MoveId.SUBSTITUTE, MoveId.BATON_PASS]);

    await game.classicMode.startBattle([SpeciesId.BLASTOISE, SpeciesId.CHARIZARD]);

    const leadPokemon = game.field.getPlayerPokemon();

    leadPokemon.addTag(BattlerTagType.SUBSTITUTE, 0, MoveId.NONE, leadPokemon.id);

    // Simulate a Baton switch for the player this turn
    game.onNextPrompt("CommandPhase", UiMode.COMMAND, () => {
      (game.scene.phaseManager.getCurrentPhase() as CommandPhase).handleCommand(Command.POKEMON, 1, true);
    });

    await game.phaseInterceptor.to("MovePhase", false);

    const switchedPokemon = game.field.getPlayerPokemon();
    const subTag = switchedPokemon.getTag(SubstituteTag)!;
    expect(subTag).toBeDefined();
    expect(subTag.hp).toBe(Math.floor((leadPokemon.getMaxHp() * 1) / 4));
  });

  it("should prevent the source's Rough Skin from activating when hit", async () => {
    game.override.enemyMoveset(MoveId.TACKLE).ability(AbilityId.ROUGH_SKIN);

    await game.classicMode.startBattle([SpeciesId.BLASTOISE]);

    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.select(MoveId.SUBSTITUTE);

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
  });

  it("should prevent the source's Focus Punch from failing when hit", async () => {
    game.override.enemyMoveset(MoveId.TACKLE).moveset([MoveId.FOCUS_PUNCH]);

    // Make Focus Punch 40 power to avoid a KO
    vi.spyOn(allMoves[MoveId.FOCUS_PUNCH], "calculateBattlePower").mockReturnValue(40);

    await game.classicMode.startBattle([SpeciesId.BLASTOISE]);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    playerPokemon.addTag(BattlerTagType.SUBSTITUTE, 0, MoveId.NONE, playerPokemon.id);

    game.move.select(MoveId.FOCUS_PUNCH);

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(playerPokemon.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());
  });

  it("should not allow Shell Trap to activate when attacked", async () => {
    game.override.enemyMoveset(MoveId.TACKLE).moveset([MoveId.SHELL_TRAP]);

    await game.classicMode.startBattle([SpeciesId.BLASTOISE]);

    const playerPokemon = game.field.getPlayerPokemon();

    playerPokemon.addTag(BattlerTagType.SUBSTITUTE, 0, MoveId.NONE, playerPokemon.id);

    game.move.select(MoveId.SHELL_TRAP);

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(playerPokemon.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should not allow Beak Blast to burn opponents when hit", async () => {
    game.override.enemyMoveset(MoveId.TACKLE).moveset([MoveId.BEAK_BLAST]);

    await game.classicMode.startBattle([SpeciesId.BLASTOISE]);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    playerPokemon.addTag(BattlerTagType.SUBSTITUTE, 0, MoveId.NONE, playerPokemon.id);

    game.move.select(MoveId.BEAK_BLAST);

    await game.phaseInterceptor.to("MoveEndPhase");

    expect(enemyPokemon.status?.effect).not.toBe(StatusEffect.BURN);
  });

  it("should cause incoming attacks to not activate Counter", async () => {
    game.override.enemyMoveset(MoveId.TACKLE).moveset([MoveId.COUNTER]);

    await game.classicMode.startBattle([SpeciesId.BLASTOISE]);

    const playerPokemon = game.field.getPlayerPokemon();
    const enemyPokemon = game.field.getEnemyPokemon();

    playerPokemon.addTag(BattlerTagType.SUBSTITUTE, 0, MoveId.NONE, playerPokemon.id);

    game.move.select(MoveId.COUNTER);

    await game.phaseInterceptor.to("BerryPhase", false);

    expect(playerPokemon.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
    expect(enemyPokemon.hp).toBe(enemyPokemon.getMaxHp());
  });

  it("should prevent Sappy Seed from applying its Leech Seed effect to the user", async () => {
    game.override.enemyMoveset(MoveId.SAPPY_SEED);

    await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

    const playerPokemon = game.field.getPlayerPokemon();

    playerPokemon.addTag(BattlerTagType.SUBSTITUTE, 0, MoveId.NONE, playerPokemon.id);

    game.move.select(MoveId.SPLASH);

    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]); // enemy uses Sappy Seed first
    await game.move.forceHit(); // forces Sappy Seed to hit
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(playerPokemon.getTag(BattlerTagType.SEEDED)).toBeUndefined();
  });
});
