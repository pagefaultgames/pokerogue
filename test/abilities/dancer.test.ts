import { BattlerIndex } from "#app/battle";
import Pokemon from "#app/field/pokemon";
import { MovePhase } from "#app/phases/move-phase";
import { Abilities } from "#enums/abilities";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Abilities - Dancer", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  /**
   * Check that the specified {@linkcode Pokemon} is using the specified move
   * in the current {@linkcode MovePhase} against the specified targets.
   */
  function checkCurrentMoveUser(
    pokemon: Pokemon | undefined,
    move: Moves,
    targets?: BattlerIndex[],
    followUp: boolean | "status-only" = "status-only",
  ) {
    const currentPhase = game.scene.getCurrentPhase() as MovePhase;
    expect(currentPhase).not.toBeNull();
    expect(currentPhase).toBeInstanceOf(MovePhase);
    expect.soft(currentPhase.pokemon).toBe(pokemon);
    expect.soft(currentPhase.move.moveId).toBe(move);
    if (targets) {
      expect.soft(currentPhase.targets).toHaveLength(targets.length);
      expect.soft(currentPhase.targets).toEqual(expect.arrayContaining(targets));
    }
    // ENABLE ONCE RULE TURNS ON // biome-ignore lint/complexity/useLiteralKeys: Needed to check protected class property
    expect.soft(currentPhase["followUp"]).toBe(followUp);
  }

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
    game.override.battleStyle("single").ability(Abilities.DANCER).enemySpecies(Species.SHUCKLE).enemyLevel(100);
  });

  // Reference Link: https://bulbapedia.bulbagarden.net/wiki/Dancer_(Ability)

  it("should copy dance moves without consuming extra PP", async () => {
    game.override.enemyAbility(Abilities.DANCER);
    await game.classicMode.startBattle([Species.ORICORIO]);

    const oricorio = game.scene.getPlayerPokemon()!;
    expect(oricorio).toBeDefined();
    const shuckle = game.scene.getEnemyPokemon()!;
    expect(shuckle).toBeDefined();

    game.move.changeMoveset(oricorio, [Moves.VICTORY_DANCE, Moves.SWORDS_DANCE]);
    game.move.changeMoveset(shuckle, [Moves.VICTORY_DANCE, Moves.SWORDS_DANCE]);

    game.move.select(Moves.SWORDS_DANCE);
    await game.forceEnemyMove(Moves.VICTORY_DANCE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("BerryPhase");

    // shpuldn't use PP if copied move is also in moveset
    expect(oricorio.moveset.map(m => m.ppUsed)).toEqual([0, 1]);
    expect(shuckle.moveset.map(m => m.ppUsed)).toEqual([1, 0]);

    // effects were applied correctly
    expect(oricorio.getStatStage(Stat.ATK)).toBe(3);
    expect(shuckle.getStatStage(Stat.ATK)).toBe(3);

    // moves showed up in history
    expect(oricorio.getLastXMoves(-1)).toHaveLength(2);
    expect(oricorio.getLastXMoves(-1)).toBe(
      expect.arrayContaining([
        expect.objectContaining({ move: Moves.SWORDS_DANCE, virtual: false }),
        expect.objectContaining({ move: Moves.VICTORY_DANCE, virtual: true }),
      ]),
    );
    expect(shuckle.getLastXMoves(-1)).toHaveLength(2);
    expect(shuckle.getLastXMoves(-1)).toBe(
      expect.arrayContaining([
        expect.objectContaining({ move: Moves.SWORDS_DANCE, virtual: true }),
        expect.objectContaining({ move: Moves.VICTORY_DANCE, virtual: false }),
      ]),
    );
  });

  // TODO: Enable once abilities start proccing in speed order
  it.todo("should target correctly & respect speed order during doubles", async () => {
    game.override
      .battleStyle("double")
      .enemyAbility(Abilities.DANCER)
      .moveset([Moves.REVELATION_DANCE, Moves.SPLASH])
      .enemyMoveset([Moves.FIERY_DANCE, Moves.SWORDS_DANCE]);
    await game.classicMode.startBattle([Species.ORICORIO, Species.FEEBAS]);

    const [oricorio, feebas, shuckle1, shuckle2] = game.scene.getField();
    expect(oricorio).toBeDefined();
    expect(feebas).toBeDefined();
    expect(shuckle1).toBeDefined();
    expect(shuckle2).toBeDefined();
    // Set the mons in reverse speed order - P1, P2, E1, E2
    // Used in place of `setTurnOrder` as the latter only applies for current phase
    game.scene.getField().forEach((pok, i) => pok.setStat(Stat.SPD, 5 - i));

    // oricorio uses splash, everyone else dances like crazy
    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER);
    game.move.select(Moves.REVELATION_DANCE, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2);
    await game.forceEnemyMove(Moves.FIERY_DANCE, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.SWORDS_DANCE);

    await game.phaseInterceptor.to("MovePhase", false); // oricorio splash
    checkCurrentMoveUser(oricorio, Moves.SPLASH, [BattlerIndex.PLAYER]);

    await game.phaseInterceptor.to("MovePhase", false); // feebas uses rev dance on shuckle #2
    checkCurrentMoveUser(feebas, Moves.REVELATION_DANCE, [BattlerIndex.PLAYER_2]);

    await game.phaseInterceptor.to("MovePhase", false); // oricorio copies rev dance against same target
    checkCurrentMoveUser(oricorio, Moves.REVELATION_DANCE, [BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("MovePhase", false); // shuckle 1 copies rev dance vs feebas
    checkCurrentMoveUser(shuckle1, Moves.REVELATION_DANCE, [BattlerIndex.PLAYER_2]);
    await game.phaseInterceptor.to("MovePhase", false); // shuckle 2 copies rev dance vs feebas
    checkCurrentMoveUser(shuckle2, Moves.REVELATION_DANCE, [BattlerIndex.PLAYER_2]);

    await game.phaseInterceptor.to("MovePhase", false); // oricorio copies fiery dance
    checkCurrentMoveUser(oricorio, Moves.FIERY_DANCE, [BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to("MovePhase"); // shuckle 2 uses fiery dance
    await game.phaseInterceptor.to("MovePhase", false); // oricorio copies fiery dance

    checkCurrentMoveUser(oricorio, Moves.FIERY_DANCE, [BattlerIndex.ENEMY_2]);
  });

  it("should count as last move recieved for counter moves", async () => {
    game.override
      .battleStyle("double")
      .moveset([Moves.REVELATION_DANCE, Moves.SPLASH])
      .enemyMoveset([Moves.METAL_BURST, Moves.SPLASH]);
    await game.classicMode.startBattle([Species.ORICORIO, Species.FEEBAS]);

    const [oricorio, feebas, shuckle1, shuckle2] = game.scene.getField();
    expect(oricorio).toBeDefined();
    expect(feebas).toBeDefined();
    expect(shuckle1).toBeDefined();
    expect(shuckle2).toBeDefined();

    // Feebas attacks enemy 2, prompting oricorio to do the same
    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER);
    game.move.select(Moves.REVELATION_DANCE, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.forceEnemyMove(Moves.METAL_BURST);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2]);

    // ORDER:
    // oricorio splash
    // shuckle 1 splash
    // feebas rev dance vs shuckle 2
    // oricorio copies rev dance vs shuckle 2
    // shuckle metal burst

    await game.phaseInterceptor.to("TurnEndPhase");
    expect(shuckle2.getLastXMoves(-1)[0].move).toBe(Moves.METAL_BURST);
    expect(shuckle2.getLastXMoves(-1)[0].targets).toBe([BattlerIndex.PLAYER]);

    expect(oricorio.hp).toBeLessThan(oricorio.getMaxHp());
  });

  it("should not trigger on failed/ineffective moves", async () => {
    game.override
      .moveset([Moves.SPLASH, Moves.PROTECT])
      .enemySpecies(Species.GROUDON)
      .enemyMoveset([Moves.FEATHER_DANCE, Moves.REVELATION_DANCE]);
    await game.classicMode.startBattle([Species.ORICORIO]);

    const oricorio = game.scene.getPlayerPokemon()!;
    const groudon = game.scene.getEnemyPokemon()!;
    expect(oricorio).toBeDefined();
    expect(groudon).toBeDefined();

    // minimize attack and use feather dance
    oricorio.setStatStage(Stat.ATK, -6);
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.FEATHER_DANCE);
    await game.toNextTurn();

    // wasn't copied due to failing at -6
    expect(oricorio.getStatStage(Stat.ATK)).toBe(-6);
    expect(groudon.getStatStage(Stat.ATK)).toBe(0);

    // reset attack, but block with protect this time
    oricorio.setStatStage(Stat.ATK, 0);
    game.move.select(Moves.PROTECT);
    await game.forceEnemyMove(Moves.FEATHER_DANCE);
    await game.toNextTurn();

    // wasn't copied due to being blocked
    expect(oricorio.getStatStage(Stat.ATK)).toBe(0);
    expect(groudon.getStatStage(Stat.ATK)).toBe(0);

    // Enemy uses ground-type rev dance immune
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.REVELATION_DANCE);
    await game.toNextTurn();

    // wasn't copied due to being ineffective
    expect(oricorio.hp).toBe(oricorio.getMaxHp());
    expect(groudon.hp).toBe(groudon.getMaxHp());
  });

  // TODO: Enable once confusion override from Cud Chew PR gets merged
  it.todo("should trigger confusion self-damage, even if protected", async () => {
    game.override.moveset([Moves.PROTECT, Moves.SPLASH]).enemyMoveset([Moves.TEETER_DANCE, Moves.SWORDS_DANCE]);
    /*       .confusionActivation(false); // disable confusion unless forced by mocks */
    await game.classicMode.startBattle([Species.ORICORIO]);

    const oricorio = game.scene.getPlayerPokemon()!;
    expect(oricorio).toBeDefined();

    // get confused
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.TEETER_DANCE);
    await game.toNextTurn();

    // Protect, then copy swords dance
    game.move.select(Moves.PROTECT);
    await game.forceEnemyMove(Moves.SWORDS_DANCE);
    await game.toNextTurn();

    await game.phaseInterceptor.to("MovePhase"); // protect
    await game.phaseInterceptor.to("MovePhase"); // Swords dance
    // await game.move.forceConfusionActivation(true); // force confusion proc during swords dance copy
    await game.phaseInterceptor.to("TurnEndPhase");

    // took damage from confusion instead of using move;
    // enemy remains confused
    expect(oricorio.hp).toBeLessThan(oricorio.getMaxHp());
    expect(oricorio.getTag(BattlerTagType.CONFUSED)).toBeDefined();
    expect(game.scene.getEnemyPokemon()?.getTag(BattlerTagType.CONFUSED)).toBeUndefined();
  });

  it.each([
    { name: "asleep", condition: StatusEffect.SLEEP },
    { name: "frozen", condition: StatusEffect.FREEZE },
    { name: "fully paralyzed", condition: StatusEffect.PARALYSIS },
  ])("should not trigger while $name", async ({ condition }) => {
    game.override
      .moveset(Moves.SPLASH)
      .enemyMoveset(Moves.SWORDS_DANCE)
      .statusEffect(condition)
      .passiveAbility(Abilities.EARLY_BIRD) // only used for sleep
      .statusActivation(true);
    await game.classicMode.startBattle([Species.ORICORIO]);

    const oricorio = game.scene.getPlayerPokemon()!;
    expect(oricorio).toBeDefined();
    expect(oricorio.status).not.toBeNull();

    // This is always 4 if using sleep override, but just to be safe
    const prevSleepTurns = oricorio.status?.sleepTurnsRemaining ?? 4;

    // attempt to copy swords dance while asleep
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.SWORDS_DANCE);
    await game.toNextTurn();

    expect(oricorio.getLastXMoves(-1)[0]).toBe(expect.objectContaining({ move: Moves.NONE }));
    expect(oricorio.status).toBeTruthy();
    if (oricorio.status?.effect === StatusEffect.SLEEP) {
      expect(oricorio.status?.sleepTurnsRemaining).toBe(prevSleepTurns - 1); // null coaclesce to make compiler happy
    }
    expect(oricorio.getStatStage(Stat.ATK)).toBe(0);
  });

  // TODO: Enable once rampaging moves are fixed
  it.todo("should not lock user into Petal Dance or tick down duration", async () => {
    game.override.moveset([Moves.SPLASH, Moves.PETAL_DANCE]).enemyMoveset(Moves.PETAL_DANCE);
    await game.classicMode.startBattle([Species.ORICORIO]);

    // Mock RNG to make frenzy always last for max duration
    vi.spyOn(Pokemon.prototype, "randSeedIntRange").mockImplementation((_, max) => max);
    const oricorio = game.scene.getPlayerPokemon()!;
    expect(oricorio).toBeDefined();

    const shuckle = game.scene.getEnemyPokemon()!;
    expect(shuckle).toBeDefined();

    // Enemy uses petal dance and we copy
    game.move.select(Moves.SPLASH);
    await game.phaseInterceptor.to("TurnEndPhase");

    // used petal dance without being locked into move
    expect(oricorio.getLastXMoves(-1)[0]).toBe(expect.objectContaining({ move: Moves.PETAL_DANCE, virtual: true }));
    expect(oricorio.getMoveQueue()).toHaveLength(0);
    expect(oricorio.getTag(BattlerTagType.FRENZY)).toBeUndefined();
    expect(shuckle.turnData.attacksReceived).toHaveLength(1);

    await game.toNextTurn();

    // Use petal dance ourselves and copy enemy one
    game.move.select(Moves.PETAL_DANCE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.phaseInterceptor.to("TurnEndPhase");

    // locked into Petal Dance for the next 2 turns (not 3)
    expect(oricorio.getMoveQueue()).toHaveLength(2);
    expect(oricorio.getTag(BattlerTagType.FRENZY)).toBeDefined();
    expect(oricorio.getTag(BattlerTagType.FRENZY)?.turnCount).toBe(2);
  });

  it("should not trigger while flinched", async () => {
    game.override.battleStyle("double").moveset(Moves.SPLASH).enemyMoveset([Moves.SWORDS_DANCE, Moves.FAKE_OUT]);
    await game.classicMode.startBattle([Species.ORICORIO]);

    const oricorio = game.scene.getPlayerPokemon()!;
    expect(oricorio).toBeDefined();

    // get faked out and use swords dance
    game.move.select(Moves.SPLASH);
    await game.forceEnemyMove(Moves.SWORDS_DANCE);
    await game.forceEnemyMove(Moves.FAKE_OUT, BattlerIndex.PLAYER);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    expect(oricorio.getLastXMoves(-1)[0]).toBe(expect.objectContaining({ move: Moves.NONE }));
    expect(oricorio.getStatStage(Stat.ATK)).toBe(0);
  });

  // TODO: Enable once interaction is confirmed
  it.todo("should not count as last move used for mirror move", async () => {
    game.override.moveset([Moves.FIERY_DANCE, Moves.REVELATION_DANCE]).enemyMoveset([Moves.MIRROR_MOVE, Moves.SPLASH]);
    await game.classicMode.startBattle([Species.ORICORIO, Species.FEEBAS]);

    const [, shuckle2] = game.scene.getPlayerParty();

    game.move.select(Moves.REVELATION_DANCE, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2);
    game.move.select(Moves.FIERY_DANCE, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2);
    await game.forceEnemyMove(Moves.SPLASH, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.MIRROR_MOVE, BattlerIndex.PLAYER);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to("MovePhase"); // Oricorio rev dance
    await game.phaseInterceptor.to("MovePhase"); // Feebas fiery dance
    await game.phaseInterceptor.to("MovePhase"); // Oricorio fiery dance (from dancer)

    await game.phaseInterceptor.to("MovePhase"); // shuckle 2 copies oricorio
    await game.phaseInterceptor.to("MovePhase", false); // copied move used

    checkCurrentMoveUser(shuckle2, Moves.REVELATION_DANCE); // change to fiery dance if i am in fact wrong
  });

  it("should not count as the last move used for Instruct", async () => {
    game.override.moveset([Moves.FIERY_DANCE, Moves.SPLASH]).enemyMoveset([Moves.INSTRUCT, Moves.SPLASH]);
    await game.classicMode.startBattle([Species.ORICORIO, Species.FEEBAS]);

    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER);
    game.move.select(Moves.FIERY_DANCE, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.forceEnemyMove(Moves.INSTRUCT, BattlerIndex.PLAYER);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to("MovePhase"); // Oricorio uses splash
    await game.phaseInterceptor.to("MovePhase"); // Feebas uses fiery dance
    await game.phaseInterceptor.to("MovePhase"); // Oricorio copies fiery dance

    await game.phaseInterceptor.to("MovePhase"); // shuckle 2 instructs oricorio
    await game.phaseInterceptor.to("MovePhase", false); // instructed move used

    checkCurrentMoveUser(game.scene.getPlayerPokemon(), Moves.REVELATION_DANCE, [BattlerIndex.ENEMY_2], true);
  });
});
