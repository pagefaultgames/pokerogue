import { getPokemonNameWithAffix } from "#app/messages";
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
import { TrainerVariant } from "#enums/trainer-variant";
import { splitArray } from "#test/test-utils/array-utils";
import { GameManager } from "#test/test-utils/game-manager";
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
      .criticalHits(false)
      .randomTrainer({ trainerType: TrainerType.ACEROLA, alwaysDouble: false });
  });

  describe("Force Switch Moves", () => {
    it.each<{ name: string; move: MoveId }>([
      { name: "Whirlwind", move: MoveId.WHIRLWIND },
      { name: "Roar", move: MoveId.ROAR },
      { name: "Dragon Tail", move: MoveId.DRAGON_TAIL },
      { name: "Circle Throw", move: MoveId.CIRCLE_THROW },
    ])("$name should switch the target out and display custom text", async ({ move }) => {
      game.override.battleType(BattleType.TRAINER);
      await game.classicMode.startBattle([SpeciesId.BLISSEY, SpeciesId.BULBASAUR]);

      const enemy = game.field.getEnemyPokemon();
      game.move.use(move);
      await game.toEndOfTurn();

      const newEnemy = game.field.getEnemyPokemon();
      expect(newEnemy).not.toBe(enemy);
      expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");
      expect(game).toHaveShownMessage(
        i18next.t("battle:pokemonDraggedOut", {
          pokemonName: getPokemonNameWithAffix(newEnemy),
        }),
      );
    });

    it("should force switches to a random off-field pokemon", async () => {
      await game.classicMode.startBattle([SpeciesId.BULBASAUR, SpeciesId.CHARMANDER, SpeciesId.SQUIRTLE]);

      const [bulbasaur, charmander, squirtle] = game.scene.getPlayerParty();

      // Turn 1: Mock an RNG call that calls for switching to 1st backup Pokemon (Charmander)
      vi.spyOn(game.scene, "randBattleSeedInt").mockImplementation((_range, min = 0) => min);
      game.move.use(MoveId.SPLASH);
      await game.move.forceEnemyMove(MoveId.DRAGON_TAIL);
      await game.toNextTurn();

      expect(bulbasaur.isOnField()).toBe(false);
      expect(charmander.isOnField()).toBe(true);
      expect(squirtle.isOnField()).toBe(false);
      expect(bulbasaur).not.toHaveFullHp();

      // Turn 2: Mock an RNG call that calls for switching to 2nd backup Pokemon (Squirtle)
      vi.spyOn(game.scene, "randBattleSeedInt").mockImplementation((_range, min = 0) => min + 1);
      game.move.use(MoveId.SPLASH);
      await game.toNextTurn();

      expect(bulbasaur.isOnField()).toBe(false);
      expect(charmander.isOnField()).toBe(false);
      expect(squirtle.isOnField()).toBe(true);
      expect(charmander).not.toHaveFullHp();
    });

    it("should force trainers to switch randomly without selecting from a partner's party", async () => {
      game.override
        .battleStyle("double")
        .battleType(BattleType.TRAINER)
        .randomTrainer({ trainerType: TrainerType.TATE, trainerVariant: TrainerVariant.DOUBLE })
        .enemySpecies(0);
      await game.classicMode.startBattle([SpeciesId.WIMPOD]);

      expect(game.scene.currentBattle.trainer).not.toBeNull();
      const choiceSwitchSpy = vi.spyOn(game.scene.currentBattle.trainer!, "getNextSummonIndex");

      // Grab each trainer's pokemon based on trainer slot
      const [tateParty, lizaParty] = splitArray(
        game.scene.getEnemyParty(),
        pkmn => pkmn.trainerSlot === TrainerSlot.TRAINER,
      ).map(a => a.map(p => p.species.name));
      expect(tateParty).not.toEqual(lizaParty);
      expect(tateParty.length).toBeGreaterThan(0);

      // Force enemy trainers to switch to the first mon available.
      // Due to how enemy trainer parties are laid out, this prevents false positives
      // as Tate's pokemon are placed immediately before Liza's corresponding members.
      vi.spyOn(Phaser.Math.RND, "integerInRange").mockImplementation(min => min);

      game.move.use(MoveId.ROAR, BattlerIndex.PLAYER, BattlerIndex.ENEMY_2);
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
      await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

      const [enemy1, enemy2] = game.scene.getEnemyField();

      game.move.use(MoveId.DRAGON_TAIL, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
      // target the same pokemon, should be redirected after first flees
      game.move.use(MoveId.CIRCLE_THROW, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY);
      await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2]);
      await game.toEndOfTurn();

      expect(enemy1.visible).toBe(false);
      expect(enemy1.switchOutStatus).toBe(true);
      expect(enemy2).not.toHaveFullHp();
    });

    it("should perform a normal switch upon fainting an opponent", async () => {
      game.override.battleType(BattleType.TRAINER).startingLevel(1000); // make sure Dragon Tail KO's the opponent
      await game.classicMode.startBattle([SpeciesId.FEEBAS]);

      expect(game.scene.getEnemyParty().length).toBeGreaterThanOrEqual(2);
      const choiceSwitchSpy = vi.spyOn(game.scene.currentBattle.trainer!, "getNextSummonIndex");

      game.move.use(MoveId.DRAGON_TAIL);
      await game.toNextTurn();

      const enemy = game.field.getEnemyPokemon();
      expect(enemy).toHaveFullHp();

      expect(choiceSwitchSpy).toHaveBeenCalledTimes(1);
    });

    it("should neither switch nor softlock when activating reviver seed", async () => {
      game.override.battleType(BattleType.TRAINER).enemyHeldItems([{ name: "REVIVER_SEED" }]);
      await game.classicMode.startBattle([SpeciesId.FEEBAS]);

      const [karp1, karp2] = game.scene.getEnemyParty();
      karp1.hp = 1;

      game.move.use(MoveId.DRAGON_TAIL);
      await game.move.forceEnemyMove(MoveId.SPLASH); // Required to prevent enemy AI from swapping out
      await game.toNextTurn();

      // karp #1 should have consumed the reviver seed and stayed on field
      expect(karp1.isOnField()).toBe(true);
      expect(karp1.getHpRatio()).toBeCloseTo(0.5);
      expect(karp1.getHeldItems()).toHaveLength(0);
      expect(karp2.isOnField()).toBe(false);
    });

    it("should not force switches to a fainted or challenge-ineligible Pokemon", async () => {
      game.override.enemyLevel(1);
      // Mono-Water challenge
      game.challengeMode.addChallenge(Challenges.SINGLE_TYPE, PokemonType.WATER + 1, 0);
      await game.challengeMode.startBattle([SpeciesId.LAPRAS, SpeciesId.EEVEE, SpeciesId.TOXAPEX, SpeciesId.PRIMARINA]);

      const [lapras, eevee, toxapex, primarina] = game.scene.getPlayerParty();
      toxapex.hp = 0;

      // Mock an RNG call to switch to the first eligible pokemon.
      // Eevee is ineligible and Toxapex is fainted, so it should proc on Primarina instead
      vi.spyOn(game.scene, "randBattleSeedInt").mockImplementation((_range, min = 0) => min);

      game.move.use(MoveId.SPLASH);
      await game.move.forceEnemyMove(MoveId.DRAGON_TAIL);
      await game.toNextTurn();

      expect(lapras.isOnField()).toBe(false);
      expect(eevee.isOnField()).toBe(false);
      expect(toxapex.isOnField()).toBe(false);
      expect(primarina.isOnField()).toBe(true);
      expect(lapras).not.toHaveFullHp();
    });
  });

  describe("Self-Switch Attack Moves", () => {
    it("should trigger post defend/faint abilities before leaving the field", async () => {
      game.override.enemyAbility(AbilityId.AFTERMATH).enemyPassiveAbility(AbilityId.ROUGH_SKIN).enemyLevel(1);
      await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

      const feebas = game.field.getPlayerPokemon();
      const karp = game.field.getEnemyPokemon();

      game.move.use(MoveId.U_TURN);
      game.doSelectPartyPokemon(1);
      await game.toEndOfTurn();

      expect(karp).toHaveFainted();
      expect(karp).toHaveAbilityApplied(AbilityId.ROUGH_SKIN);
      expect(karp).toHaveAbilityApplied(AbilityId.AFTERMATH);
      expect(feebas.isOnField()).toBe(false);
      expect(feebas).not.toHaveFullHp();
    });

    it("should still switch when hitting an opponent's substitute", async () => {
      await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

      const feebas = game.field.getPlayerPokemon();
      const karp = game.field.getEnemyPokemon();
      karp.addTag(BattlerTagType.SUBSTITUTE, 0, MoveId.SUBSTITUTE);

      game.move.use(MoveId.U_TURN);
      game.doSelectPartyPokemon(1);
      await game.toEndOfTurn();

      expect(feebas.isOnField()).toBe(false);
      expect(game.phaseInterceptor.log).toContain("SwitchSummonPhase");
    });
  });

  describe("Baton Pass", () => {
    it("should pass the user's stat stages and BattlerTags to an ally", async () => {
      await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

      const [feebas, milotic] = game.scene.getPlayerParty();
      feebas.setStatStage(Stat.SPATK, 2);
      feebas.addTag(BattlerTagType.SUBSTITUTE, 0, MoveId.SUBSTITUTE);

      game.move.use(MoveId.BATON_PASS);
      game.doSelectPartyPokemon(1);
      await game.toEndOfTurn();

      expect(feebas.isOnField()).toBe(false);
      expect(milotic.isOnField()).toBe(true);
      expect(milotic).toHaveStatStage(Stat.SPATK, 2);
      expect(milotic).toHaveBattlerTag(BattlerTagType.SUBSTITUTE);
    });

    it("should not transfer non-transferrable effects", async () => {
      await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

      const [feebas, milotic] = game.scene.getPlayerParty();
      feebas.addTag(BattlerTagType.SALT_CURED, 0, MoveId.SALT_CURE);

      game.move.use(MoveId.BATON_PASS);
      game.doSelectPartyPokemon(1);
      await game.toEndOfTurn();

      expect(feebas.isOnField()).toBe(false);
      expect(milotic.isOnField()).toBe(true);
      expect(milotic).toHaveStatStage(Stat.SPATK, 2);
      expect(milotic).toHaveBattlerTag(BattlerTagType.SALT_CURED);
    });

    it("should remove the user's trapping effects on switch out", async () => {
      await game.classicMode.startBattle([SpeciesId.FEEBAMILOTIC]);

      game.move.use(MoveId.FIRE_SPIN);
      await game.move.forceHit();
      await game.toNextTurn();

      const enemy = game.field.getEnemyPokemon();
      expect(enemy).toHaveBattlerTag(BattlerTagType.FIRE_SPIN);

      game.move.use(MoveId.BATON_PASS);
      game.doSelectPartyPokemon(1);
      await game.toNextTurn();

      expect(enemy).not.toHaveBattlerTag(BattlerTagType.FIRE_SPIN);
    });
  });

  describe("Shed Tail", () => {
    it("should consume 50% of the user's max HP (rounded up) to transfer a 25% HP Substitute doll", async () => {
      await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

      const [feebas, milotic] = game.scene.getPlayerField();

      game.move.use(MoveId.SHED_TAIL);
      game.doSelectPartyPokemon(1);
      await game.toEndOfTurn();

      expect(feebas.isOnField()).toBe(false);
      expect(milotic.isOnField()).toBe(true);
      expect(feebas).toHaveTakenDamage(Math.ceil(feebas.getMaxHp() / 2));
      expect(milotic).toHaveFullHp();

      expect(feebas).toHaveBattlerTag({ tagType: BattlerTagType.SUBSTITUTE, hp: toDmgValue(feebas.getMaxHp() / 4) });
    });

    it("should not transfer other effects", async () => {
      await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

      const [feebas, milotic] = game.scene.getPlayerField();
      feebas.setStatStage(Stat.ATK, 6);

      game.move.use(MoveId.SHED_TAIL);
      game.doSelectPartyPokemon(1);
      await game.toEndOfTurn();

      expect(feebas.isOnField()).toBe(false);
      expect(milotic.isOnField()).toBe(true);
      expect(feebas).toHaveStatStage(Stat.ATK, 0);
      expect(milotic).toHaveStatStage(Stat.ATK, 0);
    });

    it("should fail if the user's HP is insufficient", async () => {
      await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MILOTIC]);

      const feebas = game.field.getPlayerPokemon();
      feebas.hp = Math.ceil(feebas.getMaxHp() / 2) - 1;

      game.move.use(MoveId.SHED_TAIL);
      game.doSelectPartyPokemon(1);
      await game.toEndOfTurn();

      expect(feebas).toHaveUsedMove({ move: MoveId.SHED_TAIL, result: MoveResult.FAIL });
    });

    it("should always fail if the user has 1 maximum HP", async () => {
      await game.classicMode.startBattle([SpeciesId.SHEDINJA, SpeciesId.MILOTIC]);

      const shedinja = game.field.getPlayerPokemon();

      game.move.use(MoveId.SHED_TAIL);
      game.doSelectPartyPokemon(1);
      await game.toEndOfTurn();

      expect(shedinja).toHaveUsedMove({ move: MoveId.SHED_TAIL, result: MoveResult.FAIL });
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
      // { name: "Parting Shot", move: MoveId.PARTING_SHOT },
      { name: "Dragon Tail", enemyMove: MoveId.DRAGON_TAIL },
      { name: "Circle Throw", enemyMove: MoveId.CIRCLE_THROW },
    ])("$name should not fail if no valid switch out target is found", async ({
      move = MoveId.SPLASH,
      enemyMove = MoveId.SPLASH,
    }) => {
      await game.classicMode.startBattle([SpeciesId.RAICHU]);

      game.move.use(move);
      await game.move.forceEnemyMove(enemyMove);
      game.doSelectPartyPokemon(1);
      await game.toNextTurn();

      expect(game.phaseInterceptor.log).not.toContain("SwitchSummonPhase");
      const user = enemyMove === MoveId.SPLASH ? game.field.getPlayerPokemon() : game.field.getEnemyPokemon();
      expect(user.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
    });

    it.each<{ name: string; move?: MoveId; enemyMove?: MoveId }>([
      { name: "Teleport", move: MoveId.TELEPORT },
      { name: "Baton Pass", move: MoveId.BATON_PASS },
      { name: "Shed Tail", move: MoveId.SHED_TAIL },
      { name: "Roar", enemyMove: MoveId.ROAR },
      { name: "Whirlwind", enemyMove: MoveId.WHIRLWIND },
    ])("$name should fail if no valid switch out target is found", async ({
      move = MoveId.SPLASH,
      enemyMove = MoveId.SPLASH,
    }) => {
      await game.classicMode.startBattle([SpeciesId.RAICHU, SpeciesId.SHUCKLE]);

      game.move.use(move);
      await game.move.forceEnemyMove(enemyMove);
      game.doSelectPartyPokemon(1);
      await game.toNextTurn();

      expect(game.phaseInterceptor.log).not.toContain("SwitchSummonPhase");
      const user = enemyMove === MoveId.SPLASH ? game.field.getPlayerPokemon() : game.field.getEnemyPokemon();
      expect(user.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
    });
  });
});
