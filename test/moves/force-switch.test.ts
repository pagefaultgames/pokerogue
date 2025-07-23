import { SubstituteTag } from "#app/data/battler-tags";
import { getPokemonNameWithAffix } from "#app/messages";
import { splitArray } from "#app/utils/array";
import { toDmgValue } from "#app/utils/common";
import { AbilityId } from "#enums/ability-id";
import { BattleType } from "#enums/battle-type";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Challenges } from "#enums/challenges";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { TrainerSlot } from "#enums/trainer-slot";
import { TrainerType } from "#enums/trainer-type";
import { GameManager } from "#test/testUtils/gameManager";
import i18next from "i18next";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Moves - Switching Moves", () => {
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
      .ability(AbilityId.STURDY)
      .passiveAbility(AbilityId.NO_GUARD)
      .enemySpecies(SpeciesId.WAILORD)
      .enemyAbility(AbilityId.STURDY)
      .enemyMoveset(MoveId.SPLASH)
      .criticalHits(false);
  });

  describe("Force Switch Moves", () => {
    it("should force switches to a random off-field pokemon", async () => {
      await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.CHARMANDER, SpeciesId.SQUIRTLE]);

      const [bulbasaur, charmander, squirtle] = game.scene.getPlayerParty();

      // Turn 1: Mock an RNG call that calls for switching to 1st backup Pokemon (Charmander)
      vi.spyOn(game.scene, "randBattleSeedInt").mockImplementation((_range, min = 0) => {
        return min;
      });
      game.move.use(MoveId.SPLASH);
      await game.move.forceEnemyMove(MoveId.DRAGON_TAIL);
      await game.toNextTurn();

      expect(bulbasaur.isOnField()).toBe(false);
      expect(charmander.isOnField()).toBe(true);
      expect(squirtle.isOnField()).toBe(false);
      expect(bulbasaur.getInverseHp()).toBeGreaterThan(0);

      // Turn 2: Mock an RNG call that calls for switching to 2nd backup Pokemon (Squirtle)
      vi.spyOn(game.scene, "randBattleSeedInt").mockImplementation((_range, min = 0) => {
        return min + 1;
      });
      game.move.use(MoveId.SPLASH);
      await game.toNextTurn();

      expect(bulbasaur.isOnField()).toBe(false);
      expect(charmander.isOnField()).toBe(false);
      expect(squirtle.isOnField()).toBe(true);
      expect(charmander.getInverseHp()).toBeGreaterThan(0);
    });

    it("should force trainers to switch randomly without selecting from a partner's party", async () => {
      game.override
        .battleStyle("double")
        .battleType(BattleType.TRAINER)
        .randomTrainer({ trainerType: TrainerType.TATE, alwaysDouble: true })
        .enemySpecies(0);
      await game.classicMode.startBattle([SpeciesId.WIMPOD, SpeciesId.TYRANITAR]);

      expect(game.scene.currentBattle.trainer).not.toBeNull();
      const choiceSwitchSpy = vi.spyOn(game.scene.currentBattle.trainer!, "getNextSummonIndex");

      // Grab each trainer's pokemon based on species name
      const [tateParty, lizaParty] = splitArray(
        game.scene.getEnemyParty(),
        pkmn => pkmn.trainerSlot === TrainerSlot.TRAINER,
      ).map(a => a.map(p => p.species.name));

      expect(tateParty).not.toEqual(lizaParty);

      // Force enemy trainers to switch to the first mon available.
      // Due to how enemy trainer parties are laid out, this prevents false positives
      // as Tate's pokemon are placed immediately before Liza's corresponding members.
      vi.spyOn(Phaser.Math.RND, "integerInRange").mockImplementation(min => min);

      game.move.use(MoveId.DRAGON_TAIL, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2);
      game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
      await game.toEndOfTurn();

      const [tatePartyNew, lizaPartyNew] = splitArray(
        game.scene.getEnemyParty(),
        pkmn => pkmn.trainerSlot === TrainerSlot.TRAINER,
      ).map(a => a.map(p => p.species.name));

      // Forced switch move should have switched Liza's Pokemon with another one of her own at random
      expect(tatePartyNew).toEqual(tateParty);
      expect(lizaPartyNew).not.toEqual(lizaParty);
      expect(choiceSwitchSpy).not.toHaveBeenCalled();
    });

    it("should force wild Pokemon to flee and redirect moves accordingly", async () => {
      game.override.battleStyle("double");
      await game.classicMode.startBattle([SpeciesId.DRATINI, SpeciesId.DRATINI]);

      const [enemyLeadPokemon, enemySecPokemon] = game.scene.getEnemyParty();

      game.move.use(MoveId.DRAGON_TAIL, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
      // target the same pokemon, second move should be redirected after first flees
      // Focus punch used due to having even lower priority than Dtail
      game.move.use(MoveId.FOCUS_PUNCH, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY);
      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2]);
      await game.toEndOfTurn();

      expect(enemyLeadPokemon.visible).toBe(false);
      expect(enemyLeadPokemon.switchOutStatus).toBe(true);
      expect(enemySecPokemon.hp).toBeLessThan(enemySecPokemon.getMaxHp());
    });

    it("should not switch out a target with suction cups, unless the user has Mold Breaker", async () => {
      game.override.enemyAbility(AbilityId.SUCTION_CUPS);
      await game.classicMode.startBattle([SpeciesId.REGIELEKI]);

      const enemy = game.field.getEnemyPokemon();

      game.move.use(MoveId.DRAGON_TAIL);
      await game.toEndOfTurn();

      expect(enemy.isOnField()).toBe(true);
      expect(enemy.isFullHp()).toBe(false);

      // Turn 2: Mold Breaker should ignore switch blocking ability and switch out the target
      game.field.mockAbility(game.field.getPlayerPokemon(), AbilityId.MOLD_BREAKER);
      enemy.hp = enemy.getMaxHp();

      game.move.use(MoveId.DRAGON_TAIL);
      await game.toEndOfTurn();

      expect(enemy.isOnField()).toBe(false);
      expect(enemy.isFullHp()).toBe(false);
    });

    it("should not switch out a Commanded Dondozo", async () => {
      game.override.battleStyle("double").enemySpecies(SpeciesId.DONDOZO);
      await game.classicMode.startBattle([SpeciesId.REGIELEKI]);

      // pretend dondozo 2 commanded dondozo 1 (silly I know, but it works)
      const [dondozo1, dondozo2] = game.scene.getEnemyField();
      dondozo1.addTag(BattlerTagType.COMMANDED, 1, MoveId.NONE, dondozo2.id);

      game.move.use(MoveId.DRAGON_TAIL);
      await game.toEndOfTurn();

      expect(dondozo1.isOnField()).toBe(true);
      expect(dondozo1.isFullHp()).toBe(false);
    });

    it("should perform a normal switch upon fainting an opponent", async () => {
      game.override.battleType(BattleType.TRAINER).startingLevel(1000); // To make sure Dragon Tail KO's the opponent
      await game.classicMode.startBattle([SpeciesId.DRATINI]);

      expect(game.scene.getEnemyParty()).toHaveLength(2);
      const choiceSwitchSpy = vi.spyOn(game.scene.currentBattle.trainer!, "getNextSummonIndex");

      game.move.use(MoveId.DRAGON_TAIL);
      await game.toNextTurn();

      const enemy = game.field.getEnemyPokemon();
      expect(enemy).toBeDefined();
      expect(enemy.isFullHp()).toBe(true);

      expect(choiceSwitchSpy).toHaveBeenCalledTimes(1);
    });

    it("should neither switch nor softlock when activating an opponent's reviver seed", async () => {
      game.override
        .battleType(BattleType.TRAINER)
        .enemySpecies(SpeciesId.BLISSEY)
        .enemyHeldItems([{ name: "REVIVER_SEED" }]);
      await game.classicMode.startBattle([SpeciesId.DRATINI]);

      const [blissey1, blissey2] = game.scene.getEnemyParty()!;
      blissey1.hp = 1;

      game.move.use(MoveId.DRAGON_TAIL);
      await game.toNextTurn();

      // Bliseey #1 should have consumed the reviver seed and stayed on field
      expect(blissey1.isOnField()).toBe(true);
      expect(blissey1.getHpRatio()).toBeCloseTo(0.5);
      expect(blissey1.getHeldItems()).toHaveLength(0);
      expect(blissey2.isOnField()).toBe(false);
    });

    it("should neither switch nor softlock when activating a player's reviver seed", async () => {
      game.override.startingHeldItems([{ name: "REVIVER_SEED" }]).startingLevel(1000); // make hp rounding consistent
      await game.classicMode.startBattle([SpeciesId.BLISSEY, SpeciesId.BULBASAUR]);

      const [blissey, bulbasaur] = game.scene.getPlayerParty();
      blissey.hp = 1;

      game.move.use(MoveId.SPLASH);
      await game.move.forceEnemyMove(MoveId.DRAGON_TAIL);
      await game.toNextTurn();

      // dratini should have consumed the reviver seed and stayed on field
      expect(blissey.isOnField()).toBe(true);
      expect(blissey.getHpRatio()).toBeCloseTo(0.5);
      expect(blissey.getHeldItems()).toHaveLength(0);
      expect(bulbasaur.isOnField()).toBe(false);
    });

    it("should not force a switch to a fainted or challenge-ineligible Pokemon", async () => {
      game.override.startingLevel(100).enemyLevel(1);
      // Mono-Water challenge, Eevee is ineligible
      game.challengeMode.addChallenge(Challenges.SINGLE_TYPE, PokemonType.WATER + 1, 0);
      await game.challengeMode.startBattle([SpeciesId.LAPRAS, SpeciesId.EEVEE, SpeciesId.TOXAPEX, SpeciesId.PRIMARINA]);

      const [lapras, eevee, toxapex, primarina] = game.scene.getPlayerParty();
      toxapex.hp = 0;

      // Mock an RNG call to switch to the first eligible pokemon.
      // Eevee is ineligible and Toxapex is fainted, so it should proc on Primarina instead
      vi.spyOn(game.scene, "randBattleSeedInt").mockImplementation((_range, min = 0) => {
        return min;
      });
      game.move.use(MoveId.SPLASH);
      await game.move.forceEnemyMove(MoveId.DRAGON_TAIL);
      await game.toNextTurn();

      expect(lapras.isOnField()).toBe(false);
      expect(eevee.isOnField()).toBe(false);
      expect(toxapex.isOnField()).toBe(false);
      expect(primarina.isOnField()).toBe(true);
      expect(lapras.getInverseHp()).toBeGreaterThan(0);
    });

    it.each<{ name: string; move: MoveId }>([
      { name: "Whirlwind", move: MoveId.WHIRLWIND },
      { name: "Roar", move: MoveId.ROAR },
      { name: "Dragon Tail", move: MoveId.DRAGON_TAIL },
      { name: "Circle Throw", move: MoveId.CIRCLE_THROW },
    ])("should display custom text for forced switch outs", async ({ move }) => {
      game.override.battleType(BattleType.TRAINER);
      await game.classicMode.startBattle([SpeciesId.BLISSEY, SpeciesId.BULBASAUR]);

      const enemy = game.field.getEnemyPokemon();
      game.move.use(move);
      await game.toNextTurn();

      const newEnemy = game.field.getEnemyPokemon();
      expect(newEnemy).not.toBe(enemy);
      expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");
      // TODO: Replace this with the locale key in question
      expect(game.textInterceptor.logs).toContain(
        i18next.t("battle:pokemonDraggedOut", {
          pokemonName: getPokemonNameWithAffix(newEnemy),
        }),
      );
    });
  });

  describe("Self-Switch Attack Moves", () => {
    it("should trigger post defend abilities before a new pokemon is switched in", async () => {
      game.override.enemyAbility(AbilityId.ROUGH_SKIN);
      await game.classicMode.startBattle([SpeciesId.RAICHU, SpeciesId.SHUCKLE]);

      const raichu = game.field.getPlayerPokemon();

      game.move.use(MoveId.U_TURN);
      game.doSelectPartyPokemon(1);
      // advance to the phase for picking party members to send out
      await game.phaseInterceptor.to("SwitchPhase", false);

      expect(game.phaseInterceptor.log).not.toContain("SwitchSummonPhase");
      const player = game.field.getPlayerPokemon();
      expect(player).toBe(raichu);
      expect(player.isFullHp()).toBe(false);
      expect(game.field.getEnemyPokemon().waveData.abilityRevealed).toBe(true); // proxy for asserting ability activated
    });
  });

  describe("Baton Pass", () => {
    it("should pass the user's stat stages and BattlerTags to an ally", async () => {
      await game.classicMode.startBattle([SpeciesId.RAICHU, SpeciesId.SHUCKLE]);

      game.move.use(MoveId.NASTY_PLOT);
      await game.toNextTurn();

      const [raichu, shuckle] = game.scene.getPlayerParty();
      expect(raichu.getStatStage(Stat.SPATK)).toEqual(2);

      game.move.use(MoveId.SUBSTITUTE);
      await game.toNextTurn();

      expect(raichu.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();

      game.move.use(MoveId.BATON_PASS);
      game.doSelectPartyPokemon(1);
      await game.toEndOfTurn();

      expect(game.field.getPlayerPokemon()).toBe(shuckle);
      expect(shuckle.getStatStage(Stat.SPATK)).toEqual(2);
      expect(shuckle.getTag(BattlerTagType.SUBSTITUTE)).toBeDefined();
    });

    it("should not transfer non-transferrable effects", async () => {
      await game.classicMode.startBattle([SpeciesId.PIKACHU, SpeciesId.FEEBAS]);

      const [player1, player2] = game.scene.getPlayerParty();

      game.move.use(MoveId.BATON_PASS);
      await game.move.forceEnemyMove(MoveId.SALT_CURE);
      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);

      await game.phaseInterceptor.to("MoveEndPhase");
      expect(player1.getTag(BattlerTagType.SALT_CURED)).toBeDefined();

      game.doSelectPartyPokemon(1);
      await game.toNextTurn();

      expect(player1.isOnField()).toBe(false);
      expect(player2.isOnField()).toBe(true);
      expect(player2.getTag(BattlerTagType.SALT_CURED)).toBeUndefined();
    });

    it("should remove the user's binding effects on end", async () => {
      await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS]);

      game.move.use(MoveId.FIRE_SPIN);
      await game.move.forceHit();
      await game.toNextTurn();

      const enemy = game.field.getEnemyPokemon();
      expect(enemy.getTag(BattlerTagType.FIRE_SPIN)).toBeDefined();

      game.move.use(MoveId.BATON_PASS);
      game.doSelectPartyPokemon(1);
      await game.toNextTurn();

      expect(enemy.getTag(BattlerTagType.FIRE_SPIN)).toBeUndefined();
    });
  });

  describe("Shed Tail", () => {
    it("should consume 50% of the user's max HP (rounded up) to transfer a 25% HP Substitute doll", async () => {
      await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS]);

      const magikarp = game.field.getPlayerPokemon();

      game.move.use(MoveId.SHED_TAIL);
      game.doSelectPartyPokemon(1);
      await game.toEndOfTurn();

      const feebas = game.field.getPlayerPokemon();
      expect(feebas).not.toBe(magikarp);
      expect(feebas.hp).toBe(feebas.getMaxHp());

      const substituteTag = feebas.getTag(SubstituteTag)!;
      expect(substituteTag).toBeDefined();

      expect(magikarp.getInverseHp()).toBe(Math.ceil(magikarp.getMaxHp() / 2));
      expect(substituteTag.hp).toBe(Math.floor(magikarp.getMaxHp() / 4));
    });

    it("should not transfer other effects", async () => {
      await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS]);

      const magikarp = game.field.getPlayerPokemon();
      magikarp.setStatStage(Stat.ATK, 6);

      game.move.use(MoveId.SHED_TAIL);
      game.doSelectPartyPokemon(1);
      await game.toEndOfTurn();

      const newMon = game.field.getPlayerPokemon();
      expect(newMon).not.toBe(magikarp);
      expect(newMon.getStatStage(Stat.ATK)).toBe(0);
      expect(magikarp.getStatStage(Stat.ATK)).toBe(0);
    });

    it("should fail if the user's HP is insufficient", async () => {
      await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS]);

      const magikarp = game.field.getPlayerPokemon();
      const initHp = toDmgValue(magikarp.getMaxHp() / 2 - 1);
      magikarp.hp = initHp;

      game.move.use(MoveId.SHED_TAIL);
      await game.toEndOfTurn();

      expect(magikarp.isOnField()).toBe(true);
      expect(magikarp.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
      expect(magikarp.hp).toBe(initHp);
    });
  });

  describe("Failure Checks", () => {
    it.each<{ name: string; move: MoveId }>([
      { name: "U-Turn", move: MoveId.U_TURN },
      { name: "Flip Turn", move: MoveId.FLIP_TURN },
      { name: "Volt Switch", move: MoveId.VOLT_SWITCH },
      { name: "Baton Pass", move: MoveId.BATON_PASS },
      { name: "Shed Tail", move: MoveId.SHED_TAIL },
      { name: "Parting Shot", move: MoveId.PARTING_SHOT },
    ])("$name should not allow wild pokemon to flee", async ({ move }) => {
      game.override.enemyMoveset(move);
      await game.classicMode.startBattle([SpeciesId.RAICHU, SpeciesId.SHUCKLE]);

      const karp = game.field.getEnemyPokemon();
      game.move.use(MoveId.SPLASH);
      await game.toEndOfTurn();

      expect(game.phaseInterceptor.log).not.toContain("BattleEndPhase");
      const enemy = game.field.getEnemyPokemon();
      expect(enemy).toBe(karp);
      expect(enemy.switchOutStatus).toBe(false);
    });

    it.each<{ name: string; move?: MoveId; enemyMove?: MoveId }>([
      { name: "Teleport", enemyMove: MoveId.TELEPORT },
      { name: "Whirlwind", move: MoveId.WHIRLWIND },
      { name: "Roar", move: MoveId.ROAR },
      { name: "Dragon Tail", move: MoveId.DRAGON_TAIL },
      { name: "Circle Throw", move: MoveId.CIRCLE_THROW },
    ])("$name should allow wild pokemon to flee", async ({ move = MoveId.SPLASH, enemyMove = MoveId.SPLASH }) => {
      await game.classicMode.startBattle([SpeciesId.RAICHU, SpeciesId.SHUCKLE]);

      const enemy = game.field.getEnemyPokemon();

      game.move.use(move);
      await game.move.forceEnemyMove(enemyMove);
      game.doSelectPartyPokemon(1);
      await game.toNextTurn();

      expect(game.phaseInterceptor.log).toContain("BattleEndPhase");
      expect(game.field.getEnemyPokemon()).not.toBe(enemy);
    });

    it.each<{ name: string; move?: MoveId; enemyMove?: MoveId }>([
      { name: "U-Turn", move: MoveId.U_TURN },
      { name: "Flip Turn", move: MoveId.FLIP_TURN },
      { name: "Volt Switch", move: MoveId.VOLT_SWITCH },
      // TODO: Enable once Parting shot is fixed
      { name: "Parting Shot", move: MoveId.PARTING_SHOT },
      { name: "Dragon Tail", enemyMove: MoveId.DRAGON_TAIL },
      { name: "Circle Throw", enemyMove: MoveId.CIRCLE_THROW },
    ])(
      "$name should not fail if no valid switch out target is found",
      async ({ move = MoveId.SPLASH, enemyMove = MoveId.SPLASH }) => {
        await game.classicMode.startBattle([SpeciesId.RAICHU]);

        game.move.use(move);
        await game.move.forceEnemyMove(enemyMove);
        game.doSelectPartyPokemon(1);
        await game.toNextTurn();

        expect(game.phaseInterceptor.log).not.toContain("SwitchSummonPhase");
        const user = enemyMove === MoveId.SPLASH ? game.field.getPlayerPokemon() : game.field.getEnemyPokemon();
        expect(user.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
      },
    );

    it.each<{ name: string; move?: MoveId; enemyMove?: MoveId }>([
      { name: "Teleport", move: MoveId.TELEPORT },
      { name: "Baton Pass", move: MoveId.BATON_PASS },
      { name: "Shed Tail", move: MoveId.SHED_TAIL },
      { name: "Roar", enemyMove: MoveId.ROAR },
      { name: "Whirlwind", enemyMove: MoveId.WHIRLWIND },
    ])(
      "$name should fail if no valid switch out target is found",
      async ({ move = MoveId.SPLASH, enemyMove = MoveId.SPLASH }) => {
        await game.classicMode.startBattle([SpeciesId.RAICHU, SpeciesId.SHUCKLE]);

        game.move.use(move);
        await game.move.forceEnemyMove(enemyMove);
        game.doSelectPartyPokemon(1);
        await game.toNextTurn();

        expect(game.phaseInterceptor.log).not.toContain("SwitchSummonPhase");
        const user = enemyMove === MoveId.SPLASH ? game.field.getPlayerPokemon() : game.field.getEnemyPokemon();
        expect(user.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
      },
    );
  });
});
