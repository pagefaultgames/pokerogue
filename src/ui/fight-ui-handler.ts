import BattleScene from "../battle-scene";
import { addTextObject, TextStyle } from "./text";
import { getTypeDamageMultiplierColor, Type } from "../data/type";
import { Command } from "./command-ui-handler";
import { Mode } from "./ui";
import UiHandler from "./ui-handler";
import * as Utils from "../utils";
import Move, * as MoveData from "../data/move";
import i18next from "i18next";
import {Button} from "#enums/buttons";
import { Stat } from "#app/data/pokemon-stat.js";
import { WeatherType } from "#app/data/weather.js";
import { Moves } from "#app/enums/moves.js";
import { AddSecondStrikeAbAttr, AllyMoveCategoryPowerBoostAbAttr, AlwaysHitAbAttr, applyAbAttrs, applyBattleStatMultiplierAbAttrs, applyPreAttackAbAttrs, applyPreDefendAbAttrs, applyPreDefendAbAttrsNoApply, BattleStatMultiplierAbAttr, BlockCritAbAttr, BypassBurnDamageReductionAbAttr, ConditionalCritAbAttr, DamageBoostAbAttr, FieldMoveTypePowerBoostAbAttr, FieldPriorityMoveImmunityAbAttr, IgnoreOpponentEvasionAbAttr, IgnoreOpponentStatChangesAbAttr, MoveImmunityAbAttr, MultCritAbAttr, PreDefendFullHpEndureAbAttr, ReceivedMoveDamageMultiplierAbAttr, StabBoostAbAttr, TypeImmunityAbAttr, UserFieldMoveTypePowerBoostAbAttr, VariableMovePowerAbAttr, WonderSkinAbAttr } from "#app/data/ability.js";
import { ArenaTagType } from "#app/enums/arena-tag-type.js";
import { ArenaTagSide, WeakenMoveScreenTag, WeakenMoveTypeTag } from "#app/data/arena-tag.js";
import { HelpingHandTag, SemiInvulnerableTag, TypeBoostTag } from "#app/data/battler-tags.js";
import { TerrainType } from "#app/data/terrain.js";
import { AttackTypeBoosterModifier, EnemyDamageBoosterModifier, EnemyDamageReducerModifier, PokemonMoveAccuracyBoosterModifier, PokemonMultiHitModifier, TempBattleStatBoosterModifier } from "#app/modifier/modifier.js";
import { BattlerTagType } from "#app/enums/battler-tag-type.js";
import { TempBattleStat } from "#app/data/temp-battle-stat.js";
import { StatusEffect } from "#app/data/status-effect.js";
import { BattleStat } from "#app/data/battle-stat.js";
import { PokemonMultiHitModifierType } from "#app/modifier/modifier-type.js";
import { MoveCategory } from "#app/data/move.js";
import Pokemon, { EnemyPokemon, HitResult, PlayerPokemon, PokemonMove } from "#app/field/pokemon.js";
import { CommandPhase } from "#app/phases/command-phase.js";
import { MoveEffectPhase } from "#app/phases/move-effect-phase.js";

export default class FightUiHandler extends UiHandler {
  public static readonly MOVES_CONTAINER_NAME = "moves";

  private movesContainer: Phaser.GameObjects.Container;
  private moveInfoContainer: Phaser.GameObjects.Container;
  private typeIcon: Phaser.GameObjects.Sprite;
  private ppLabel: Phaser.GameObjects.Text;
  private ppText: Phaser.GameObjects.Text;
  private powerLabel: Phaser.GameObjects.Text;
  private powerText: Phaser.GameObjects.Text;
  private accuracyLabel: Phaser.GameObjects.Text;
  private accuracyText: Phaser.GameObjects.Text;
  private cursorObj: Phaser.GameObjects.Image | null;
  private moveCategoryIcon: Phaser.GameObjects.Sprite;

  protected fieldIndex: integer = 0;
  protected cursor2: integer = 0;

  constructor(scene: BattleScene) {
    super(scene, Mode.FIGHT);
  }

  setup() {
    const ui = this.getUi();

    this.movesContainer = this.scene.add.container(18, -38.7);
    this.movesContainer.setName(FightUiHandler.MOVES_CONTAINER_NAME);
    ui.add(this.movesContainer);

    this.moveInfoContainer = this.scene.add.container(1, 0);
    this.moveInfoContainer.setName("move-info");
    ui.add(this.moveInfoContainer);

    this.typeIcon = this.scene.add.sprite(this.scene.scaledCanvas.width - 57, -36, Utils.getLocalizedSpriteKey("types"), "unknown");
    this.typeIcon.setVisible(false);
    this.moveInfoContainer.add(this.typeIcon);

    this.moveCategoryIcon = this.scene.add.sprite(this.scene.scaledCanvas.width - 25, -36, "categories", "physical");
    this.moveCategoryIcon.setVisible(false);
    this.moveInfoContainer.add(this.moveCategoryIcon);

    this.ppLabel = addTextObject(this.scene, this.scene.scaledCanvas.width - 70, -26, "PP", TextStyle.MOVE_INFO_CONTENT);
    this.ppLabel.setOrigin(0.0, 0.5);
    this.ppLabel.setVisible(false);
    this.ppLabel.setText(i18next.t("fightUiHandler:pp"));
    this.moveInfoContainer.add(this.ppLabel);

    this.ppText = addTextObject(this.scene, this.scene.scaledCanvas.width - 12, -26, "--/--", TextStyle.MOVE_INFO_CONTENT);
    this.ppText.setOrigin(1, 0.5);
    this.ppText.setVisible(false);
    this.moveInfoContainer.add(this.ppText);

    this.powerLabel = addTextObject(this.scene, this.scene.scaledCanvas.width - 70, -18, "POWER", TextStyle.MOVE_INFO_CONTENT);
    this.powerLabel.setOrigin(0.0, 0.5);
    this.powerLabel.setVisible(false);
    this.powerLabel.setText(i18next.t("fightUiHandler:power"));
    this.moveInfoContainer.add(this.powerLabel);

    this.powerText = addTextObject(this.scene, this.scene.scaledCanvas.width - 12, -18, "---", TextStyle.MOVE_INFO_CONTENT);
    this.powerText.setOrigin(1, 0.5);
    this.powerText.setVisible(false);
    this.moveInfoContainer.add(this.powerText);

    this.accuracyLabel = addTextObject(this.scene, this.scene.scaledCanvas.width - 70, -10, "ACC", TextStyle.MOVE_INFO_CONTENT);
    this.accuracyLabel.setOrigin(0.0, 0.5);
    this.accuracyLabel.setVisible(false);
    this.accuracyLabel.setText(i18next.t("fightUiHandler:accuracy"));
    this.moveInfoContainer.add(this.accuracyLabel);

    this.accuracyText = addTextObject(this.scene, this.scene.scaledCanvas.width - 12, -10, "---", TextStyle.MOVE_INFO_CONTENT);
    this.accuracyText.setOrigin(1, 0.5);
    this.accuracyText.setVisible(false);
    this.moveInfoContainer.add(this.accuracyText);
  }

  show(args: any[]): boolean {
    super.show(args);

    this.fieldIndex = args.length ? args[0] as integer : 0;

    const messageHandler = this.getUi().getMessageHandler();
    messageHandler.bg.setVisible(false);
    messageHandler.commandWindow.setVisible(false);
    messageHandler.movesWindowContainer.setVisible(true);
    this.setCursor(this.getCursor());
    this.displayMoves();

    return true;
  }

  processInput(button: Button): boolean {
    const ui = this.getUi();

    let success = false;

    const cursor = this.getCursor();

    if (button === Button.CANCEL || button === Button.ACTION) {
      if (button === Button.ACTION) {
        if ((this.scene.getCurrentPhase() as CommandPhase).handleCommand(Command.FIGHT, cursor, false)) {
          success = true;
        } else {
          ui.playError();
        }
      } else {
        ui.setMode(Mode.COMMAND, this.fieldIndex);
        success = true;
      }
    } else {
      switch (button) {
      case Button.UP:
        if (cursor >= 2) {
          success = this.setCursor(cursor - 2);
        }
        break;
      case Button.DOWN:
        if (cursor < 2) {
          success = this.setCursor(cursor + 2);
        }
        break;
      case Button.LEFT:
        if (cursor % 2 === 1) {
          success = this.setCursor(cursor - 1);
        }
        break;
      case Button.RIGHT:
        if (cursor % 2 === 0) {
          success = this.setCursor(cursor + 1);
        }
        break;
      }
    }

    if (success) {
      ui.playSelect();
    }

    return success;
  }

  getCursor(): integer {
    return !this.fieldIndex ? this.cursor : this.cursor2;
  }

  simulateAttack(scene: BattleScene, user: Pokemon, target: Pokemon, move: Move) {
    let result: HitResult | undefined = undefined;
    const damage1 = new Utils.NumberHolder(0);
    const damage2 = new Utils.NumberHolder(0);
    const defendingSidePlayField = target.isPlayer() ? this.scene.getPlayerField() : this.scene.getEnemyField();

    const variableCategory = new Utils.IntegerHolder(move.category);
    MoveData.applyMoveAttrs(MoveData.VariableMoveCategoryAttr, user, target, move, variableCategory);
    const moveCategory = variableCategory.value as MoveData.MoveCategory;

    const typeChangeMovePowerMultiplier = new Utils.NumberHolder(1);
    MoveData.applyMoveAttrs(MoveData.VariableMoveTypeAttr, user, target, move);
    const types = target.getTypes(true, true);

    const cancelled = new Utils.BooleanHolder(false);
    const typeless = move.hasAttr(MoveData.TypelessAttr);
    const typeMultiplier = new Utils.NumberHolder(!typeless && (moveCategory !== MoveData.MoveCategory.STATUS)
      ? target.getAttackTypeEffectiveness(move.type, user, false, false)
      : 1);
    MoveData.applyMoveAttrs(MoveData.VariableMoveTypeMultiplierAttr, user, target, move, typeMultiplier);
    if (typeless) {
      typeMultiplier.value = 1;
    }
    if (types.find(t => move.isTypeImmune(user, target, t))) {
      typeMultiplier.value = 0;
    }

    // Apply arena tags for conditional protection
    if (!move.checkFlag(MoveData.MoveFlags.IGNORE_PROTECT, user, target) && !move.isAllyTarget()) {
      const defendingSide = target.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY;
      this.scene.arena.applyTagsForSide(ArenaTagType.QUICK_GUARD, defendingSide, cancelled, this, move.priority);
      this.scene.arena.applyTagsForSide(ArenaTagType.WIDE_GUARD, defendingSide, cancelled, this, move.moveTarget);
      this.scene.arena.applyTagsForSide(ArenaTagType.MAT_BLOCK, defendingSide, cancelled, this, move.category);
      this.scene.arena.applyTagsForSide(ArenaTagType.CRAFTY_SHIELD, defendingSide, cancelled, this, move.category, move.moveTarget);
    }

    switch (moveCategory) {
    case MoveData.MoveCategory.PHYSICAL:
    case MoveData.MoveCategory.SPECIAL:
      const isPhysical = moveCategory === MoveData.MoveCategory.PHYSICAL;
      const power = new Utils.NumberHolder(move.power);
      const sourceTeraType = user.getTeraType();
      if (sourceTeraType !== Type.UNKNOWN && sourceTeraType === move.type && power.value < 60 && move.priority <= 0 && !move.hasAttr(MoveData.MultiHitAttr) && !this.scene.findModifier(m => m instanceof PokemonMultiHitModifier && m.pokemonId === user.id)) {
        power.value = 60;
      }
      applyPreAttackAbAttrs(VariableMovePowerAbAttr, user, target, move, true, power);

      if (user.getAlly()?.hasAbilityWithAttr(AllyMoveCategoryPowerBoostAbAttr)) {
        applyPreAttackAbAttrs(AllyMoveCategoryPowerBoostAbAttr, user, target, move, true, power);
      }

      const fieldAuras = new Set(
        this.scene.getField(true)
          .map((p) => p.getAbilityAttrs(FieldMoveTypePowerBoostAbAttr) as FieldMoveTypePowerBoostAbAttr[])
          .flat(),
      );
      for (const aura of fieldAuras) {
        // The only relevant values are `move` and the `power` holder
        aura.applyPreAttack(null, null, true, null, move, [power]);
      }

      const alliedField: Pokemon[] = user instanceof PlayerPokemon ? this.scene.getPlayerField() : this.scene.getEnemyField();
      alliedField.forEach(p => applyPreAttackAbAttrs(UserFieldMoveTypePowerBoostAbAttr, p, user, move, true, power));

      power.value *= typeChangeMovePowerMultiplier.value;

      if (!typeless) {
        if (target.hasAbilityWithAttr(TypeImmunityAbAttr)) {
          //
        }
        applyPreDefendAbAttrsNoApply(TypeImmunityAbAttr, user, target, move, cancelled, typeMultiplier);
        MoveData.applyMoveAttrs(MoveData.NeutralDamageAgainstFlyingTypeMultiplierAttr, user, target, move, typeMultiplier);
      }
      if (!cancelled.value) {
        applyPreDefendAbAttrs(MoveImmunityAbAttr, user, target, move, cancelled, true, typeMultiplier);
        defendingSidePlayField.forEach((p) => applyPreDefendAbAttrs(FieldPriorityMoveImmunityAbAttr, p, user, move, cancelled, true, typeMultiplier));
      }

      if (cancelled.value) {
        //user.stopMultiHit(target);
        result = HitResult.NO_EFFECT;
      } else {
        const typeBoost = user.findTag(t => t instanceof TypeBoostTag && t.boostedType === move.type) as TypeBoostTag;
        if (typeBoost) {
          power.value *= typeBoost.boostValue;
          if (typeBoost.oneUse) {
            //user.removeTag(typeBoost.tagType);
          }
        }
        const arenaAttackTypeMultiplier = new Utils.NumberHolder(this.scene.arena.getAttackTypeMultiplier(move.type, user.isGrounded()));
        MoveData.applyMoveAttrs(MoveData.IgnoreWeatherTypeDebuffAttr, user, target, move, arenaAttackTypeMultiplier);
        if (this.scene.arena.getTerrainType() === TerrainType.GRASSY && target.isGrounded() && move.type === Type.GROUND && move.moveTarget === MoveData.MoveTarget.ALL_NEAR_OTHERS) {
          power.value /= 2;
        }

        MoveData.applyMoveAttrs(MoveData.VariablePowerAttr, user, target, move, power);

        this.scene.applyModifiers(PokemonMultiHitModifier, user.isPlayer(), user, new Utils.IntegerHolder(0), power);
        if (!typeless) {
          this.scene.arena.applyTags(WeakenMoveTypeTag, move.type, power);
          this.scene.applyModifiers(AttackTypeBoosterModifier, user.isPlayer(), user, move.type, power);
        }
        if (user.getTag(HelpingHandTag)) {
          power.value *= 1.5;
        }
        let isCritical: boolean = true;
        const critOnly = new Utils.BooleanHolder(false);
        const critAlways = user.getTag(BattlerTagType.ALWAYS_CRIT);
        MoveData.applyMoveAttrs(MoveData.CritOnlyAttr, user, target, move, critOnly);
        applyAbAttrs(ConditionalCritAbAttr, user, null, true, critOnly, target, move);
        if (isCritical) {
          const blockCrit = new Utils.BooleanHolder(false);
          applyAbAttrs(BlockCritAbAttr, target, null, true, blockCrit);
          if (blockCrit.value) {
            isCritical = false;
          }
        }
        const sourceAtk = new Utils.IntegerHolder(user.getBattleStat(isPhysical ? Stat.ATK : Stat.SPATK, target, move, false));
        const targetDef = new Utils.IntegerHolder(target.getBattleStat(isPhysical ? Stat.DEF : Stat.SPDEF, user, move, false));
        const sourceAtkCrit = new Utils.IntegerHolder(user.getBattleStat(isPhysical ? Stat.ATK : Stat.SPATK, target, move, isCritical));
        const targetDefCrit = new Utils.IntegerHolder(target.getBattleStat(isPhysical ? Stat.DEF : Stat.SPDEF, user, move, isCritical));
        const criticalMultiplier = new Utils.NumberHolder(isCritical ? 1.5 : 1);
        applyAbAttrs(MultCritAbAttr, user, null, true, criticalMultiplier);
        const screenMultiplier = new Utils.NumberHolder(1);
        if (!isCritical) {
          this.scene.arena.applyTagsForSide(WeakenMoveScreenTag, target.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY, move.category, this.scene.currentBattle.double, screenMultiplier);
        }
        const isTypeImmune = (typeMultiplier.value * arenaAttackTypeMultiplier.value) === 0;
        const sourceTypes = user.getTypes();
        const matchesSourceType = sourceTypes[0] === move.type || (sourceTypes.length > 1 && sourceTypes[1] === move.type);
        const stabMultiplier = new Utils.NumberHolder(1);
        if (sourceTeraType === Type.UNKNOWN && matchesSourceType) {
          stabMultiplier.value += 0.5;
        } else if (sourceTeraType !== Type.UNKNOWN && sourceTeraType === move.type) {
          stabMultiplier.value += 0.5;
        }

        applyAbAttrs(StabBoostAbAttr, user, null, true, stabMultiplier);

        if (sourceTeraType !== Type.UNKNOWN && matchesSourceType) {
          stabMultiplier.value = Math.min(stabMultiplier.value + 0.5, 2.25);
        }

        MoveData.applyMoveAttrs(MoveData.VariableAtkAttr, user, target, move, sourceAtk);
        MoveData.applyMoveAttrs(MoveData.VariableDefAttr, user, target, move, targetDef);
        MoveData.applyMoveAttrs(MoveData.VariableAtkAttr, user, target, move, sourceAtkCrit);
        MoveData.applyMoveAttrs(MoveData.VariableDefAttr, user, target, move, targetDefCrit);

        const effectPhase = this.scene.getCurrentPhase();
        let numTargets = 1;
        if (effectPhase instanceof MoveEffectPhase) {
          numTargets = effectPhase.getTargets().length;
        }
        const twoStrikeMultiplier = new Utils.NumberHolder(1);
        applyPreAttackAbAttrs(AddSecondStrikeAbAttr, user, target, move, true, numTargets, new Utils.IntegerHolder(0), twoStrikeMultiplier);

        if (!isTypeImmune) {
          damage1.value = Math.ceil(((((2 * user.level / 5 + 2) * power.value * sourceAtk.value / targetDef.value) / 50) + 2) * stabMultiplier.value * typeMultiplier.value * arenaAttackTypeMultiplier.value * screenMultiplier.value * twoStrikeMultiplier.value * 0.85); // low roll
          damage2.value = Math.ceil(((((2 * user.level / 5 + 2) * power.value * sourceAtkCrit.value / targetDefCrit.value) / 50) + 2) * stabMultiplier.value * typeMultiplier.value * arenaAttackTypeMultiplier.value * screenMultiplier.value * twoStrikeMultiplier.value * criticalMultiplier.value); // high roll crit
          if (isPhysical && user.status && user.status.effect === StatusEffect.BURN) {
            if (!move.hasAttr(MoveData.BypassBurnDamageReductionAttr)) {
              const burnDamageReductionCancelled = new Utils.BooleanHolder(false);
              applyAbAttrs(BypassBurnDamageReductionAbAttr, user, burnDamageReductionCancelled);
              if (!burnDamageReductionCancelled.value) {
                damage1.value = Math.floor(damage1.value / 2);
                damage2.value = Math.floor(damage2.value / 2);
              }
            }
          }

          applyPreAttackAbAttrs(DamageBoostAbAttr, user, target, move, true, damage1);
          applyPreAttackAbAttrs(DamageBoostAbAttr, user, target, move, true, damage2);

          /**
           * For each {@link HitsTagAttr} the move has, doubles the damage of the move if:
           * The target has a {@link BattlerTagType} that this move interacts with
           * AND
           * The move doubles damage when used against that tag
           */
          move.getAttrs(MoveData.HitsTagAttr).filter(hta => hta.doubleDamage).forEach(hta => {
            if (target.getTag(hta.tagType)) {
              damage1.value *= 2;
              damage2.value *= 2;
            }
          });
        }

        if (this.scene.arena.terrain?.terrainType === TerrainType.MISTY && target.isGrounded() && move.type === Type.DRAGON) {
          damage1.value = Math.floor(damage1.value / 2);
          damage2.value = Math.floor(damage2.value / 2);
        }

        const fixedDamage1 = new Utils.IntegerHolder(0);
        const fixedDamage2 = new Utils.IntegerHolder(0);
        MoveData.applyMoveAttrs(MoveData.FixedDamageAttr, user, target, move, fixedDamage1, true, false);
        MoveData.applyMoveAttrs(MoveData.FixedDamageAttr, user, target, move, fixedDamage2, false, true);
        if (!isTypeImmune && fixedDamage1.value) {
          damage1.value = fixedDamage1.value;
          isCritical = false;
          result = HitResult.EFFECTIVE;
        }
        if (!isTypeImmune && fixedDamage2.value) {
          damage2.value = fixedDamage2.value;
          isCritical = false;
          result = HitResult.EFFECTIVE;
        }

        if (!result) {
          if (!typeMultiplier.value) {
            result = move.id === Moves.SHEER_COLD ? HitResult.IMMUNE : HitResult.NO_EFFECT;
          } else {
            const oneHitKo = new Utils.BooleanHolder(false);
            MoveData.applyMoveAttrs(MoveData.OneHitKOAttr, user, target, move, oneHitKo);
            if (oneHitKo.value) {
              result = HitResult.ONE_HIT_KO;
              isCritical = false;
              damage1.value = target.hp;
              damage2.value = target.hp;
            } else if (typeMultiplier.value >= 2) {
              result = HitResult.SUPER_EFFECTIVE;
            } else if (typeMultiplier.value >= 1) {
              result = HitResult.EFFECTIVE;
            } else {
              result = HitResult.NOT_VERY_EFFECTIVE;
            }
          }
        }

        if (!fixedDamage1.value) {
          if (!user.isPlayer()) {
            this.scene.applyModifiers(EnemyDamageBoosterModifier, false, damage1);
          } else {
            this.scene.applyModifiers(EnemyDamageReducerModifier, false, damage1);
          }
        }

        if (!fixedDamage2.value) {
          if (!user.isPlayer()) {
            this.scene.applyModifiers(EnemyDamageBoosterModifier, false, damage2);
          } else {
            this.scene.applyModifiers(EnemyDamageReducerModifier, false, damage2);
          }
        }

        MoveData.applyMoveAttrs(MoveData.ModifiedDamageAttr, user, target, move, damage1);
        MoveData.applyMoveAttrs(MoveData.ModifiedDamageAttr, user, target, move, damage2);
        applyPreDefendAbAttrs(ReceivedMoveDamageMultiplierAbAttr, user, target, move, cancelled, true, damage1);
        applyPreDefendAbAttrs(ReceivedMoveDamageMultiplierAbAttr, user, target, move, cancelled, true, damage2);

        //console.log("damage (min)", damage1.value, move.name, power.value, sourceAtk, targetDef);
        //console.log("damage (max)", damage2.value, move.name, power.value, sourceAtkCrit, targetDefCrit);

        // In case of fatal damage, this tag would have gotten cleared before we could lapse it.
        const destinyTag = target.getTag(BattlerTagType.DESTINY_BOND);

        const oneHitKo = result === HitResult.ONE_HIT_KO;
        if (damage1.value) {
          if (target.getHpRatio() === 1) {
            applyPreDefendAbAttrs(PreDefendFullHpEndureAbAttr, target, user, move, cancelled, true, damage1);
          }
        }
        if (damage2.value) {
          if (target.getHpRatio() === 1) {
            applyPreDefendAbAttrs(PreDefendFullHpEndureAbAttr, target, user, move, cancelled, true, damage2);
          }
        }
      }
      break;
    case MoveData.MoveCategory.STATUS:
      if (!typeless) {
        applyPreDefendAbAttrsNoApply(TypeImmunityAbAttr, target, user, move, cancelled, true, typeMultiplier);
      }
      if (!cancelled.value) {
        applyPreDefendAbAttrs(MoveImmunityAbAttr, target, user, move, cancelled, true, typeMultiplier);
        defendingSidePlayField.forEach((p) => applyPreDefendAbAttrs(FieldPriorityMoveImmunityAbAttr, p, user, move, cancelled, true, typeMultiplier));
      }
      if (!typeMultiplier.value) {
        return -1
      }
      result = cancelled.value || !typeMultiplier.value ? HitResult.NO_EFFECT : HitResult.STATUS;
      break;
    }
    return [damage1.value, damage2.value]
  }

  calculateAccuracy(user: Pokemon, target: Pokemon, move: PokemonMove) {
    if (this.scene.currentBattle.double && false) {
      switch (move.getMove().moveTarget) {
        case MoveData.MoveTarget.USER: // Targets yourself
          return -1; // Moves targeting yourself always hit
        case MoveData.MoveTarget.OTHER: // Targets one Pokemon
          return move.getMove().accuracy
        case MoveData.MoveTarget.ALL_OTHERS: // Targets all Pokemon
          return move.getMove().accuracy;
        case MoveData.MoveTarget.NEAR_OTHER: // Targets a Pokemon adjacent to the user
          return move.getMove().accuracy;
        case MoveData.MoveTarget.ALL_NEAR_OTHERS: // Targets all Pokemon adjacent to the user
          return move.getMove().accuracy;
        case MoveData.MoveTarget.NEAR_ENEMY: // Targets an opponent adjacent to the user
          return move.getMove().accuracy;
        case MoveData.MoveTarget.ALL_NEAR_ENEMIES: // Targets all opponents adjacent to the user
          return move.getMove().accuracy;
        case MoveData.MoveTarget.RANDOM_NEAR_ENEMY: // Targets a random opponent adjacent to the user
          return move.getMove().accuracy;
        case MoveData.MoveTarget.ALL_ENEMIES: // Targets all opponents
          return move.getMove().accuracy;
        case MoveData.MoveTarget.ATTACKER: // Counter move
          return move.getMove().accuracy;
        case MoveData.MoveTarget.NEAR_ALLY: // Targets an adjacent ally
          return move.getMove().accuracy;
        case MoveData.MoveTarget.ALLY: // Targets an ally
          return move.getMove().accuracy;
        case MoveData.MoveTarget.USER_OR_NEAR_ALLY: // Targets an ally or yourself
          return move.getMove().accuracy;
        case MoveData.MoveTarget.USER_AND_ALLIES: // Targets all on your side
          return move.getMove().accuracy;
        case MoveData.MoveTarget.ALL: // Targets everyone
          return move.getMove().accuracy;
        case MoveData.MoveTarget.USER_SIDE: // Targets your field
          return move.getMove().accuracy;
        case MoveData.MoveTarget.ENEMY_SIDE: // Targets enemy field
          return -1; // Moves placing entry hazards always hit
        case MoveData.MoveTarget.BOTH_SIDES: // Targets the entire field
          return move.getMove().accuracy;
        case MoveData.MoveTarget.PARTY: // Targets all of the Player's Pokemon, including ones that aren't active
          return move.getMove().accuracy;
        case MoveData.MoveTarget.CURSE:
          return move.getMove().accuracy;
      }
    }
    // Moves targeting the user and entry hazards can't miss
    if ([MoveData.MoveTarget.USER, MoveData.MoveTarget.ENEMY_SIDE].includes(move.getMove().moveTarget)) {
      return -1;
    }
    if (target == undefined) return move.getMove().accuracy;
    // If either Pokemon has No Guard, 
    if (user.hasAbilityWithAttr(AlwaysHitAbAttr) || target.hasAbilityWithAttr(AlwaysHitAbAttr)) {
      return -1;
    }
    // If the user should ignore accuracy on a target, check who the user targeted last turn and see if they match
    if (user.getTag(BattlerTagType.IGNORE_ACCURACY) && (user.getLastXMoves().slice(1).find(() => true)?.targets || []).indexOf(target.getBattlerIndex()) !== -1) {
      return -1;
    }

    const hiddenTag = target.getTag(SemiInvulnerableTag);
    if (hiddenTag && !move.getMove().getAttrs(MoveData.HitsTagAttr).some(hta => hta.tagType === hiddenTag.tagType)) {
      return 0;
    }
    const moveAccuracy = new Utils.NumberHolder(move.getMove().accuracy);

    MoveData.applyMoveAttrs(MoveData.VariableAccuracyAttr, user, target, move.getMove(), moveAccuracy);
    applyPreDefendAbAttrs(WonderSkinAbAttr, target, user, move.getMove(), { value: false }, true, moveAccuracy);

    if (moveAccuracy.value === -1) {
      return -1;
    }

    const isOhko = move.getMove().hasAttr(MoveData.OneHitKOAccuracyAttr);

    if (!isOhko) {
      user.scene.applyModifiers(PokemonMoveAccuracyBoosterModifier, user.isPlayer(), user, moveAccuracy);
    }

    if (this.scene.arena.weather?.weatherType === WeatherType.FOG) {
      moveAccuracy.value = Math.floor(moveAccuracy.value * 0.9);
    }

    if (!isOhko && this.scene.arena.getTag(ArenaTagType.GRAVITY)) {
      moveAccuracy.value = Math.floor(moveAccuracy.value * 1.67);
    }

    const userAccuracyLevel = new Utils.IntegerHolder(user.summonData.battleStats[BattleStat.ACC]);
    const targetEvasionLevel = new Utils.IntegerHolder(target.summonData.battleStats[BattleStat.EVA]);
    applyAbAttrs(IgnoreOpponentStatChangesAbAttr, target, null, true, userAccuracyLevel);
    applyAbAttrs(IgnoreOpponentStatChangesAbAttr, user, null, true, targetEvasionLevel);
    applyAbAttrs(IgnoreOpponentEvasionAbAttr, user, null, true, targetEvasionLevel);
    MoveData.applyMoveAttrs(MoveData.IgnoreOpponentStatChangesAttr, user, target, move.getMove(), targetEvasionLevel);
    this.scene.applyModifiers(TempBattleStatBoosterModifier, user.isPlayer(), TempBattleStat.ACC, userAccuracyLevel);

    const accuracyMultiplier = new Utils.NumberHolder(1);
    if (userAccuracyLevel.value !== targetEvasionLevel.value) {
      accuracyMultiplier.value = userAccuracyLevel.value > targetEvasionLevel.value
        ? (3 + Math.min(userAccuracyLevel.value - targetEvasionLevel.value, 6)) / 3
        : 3 / (3 + Math.min(targetEvasionLevel.value - userAccuracyLevel.value, 6));
    }

    applyBattleStatMultiplierAbAttrs(BattleStatMultiplierAbAttr, user, BattleStat.ACC, accuracyMultiplier, true, move.getMove());

    const evasionMultiplier = new Utils.NumberHolder(1);
    applyBattleStatMultiplierAbAttrs(BattleStatMultiplierAbAttr, target, BattleStat.EVA, evasionMultiplier, true);

    accuracyMultiplier.value /= evasionMultiplier.value;

    return moveAccuracy.value * accuracyMultiplier.value
  }

  calcDamage(scene: BattleScene, user: PlayerPokemon, target: Pokemon, move: PokemonMove) {
    /*
    var power = move.getMove().power
    var myAtk = 0
    var theirDef = 0
    var myAtkC = 0
    var theirDefC = 0
    switch (move.getMove().category) {
      case MoveData.MoveCategory.PHYSICAL:
        myAtk = user.getBattleStat(Stat.ATK, target, move.getMove())
        myAtkC = user.getBattleStat(Stat.ATK, target, move.getMove(), true)
        theirDef = target.getBattleStat(Stat.DEF, user, move.getMove())
        theirDefC = target.getBattleStat(Stat.DEF, user, move.getMove(), true)
        break;
      case MoveData.MoveCategory.SPECIAL:
        myAtk = user.getBattleStat(Stat.SPATK, target, move.getMove())
        myAtkC = user.getBattleStat(Stat.SPATK, target, move.getMove(), true)
        theirDef = target.getBattleStat(Stat.SPDEF, user, move.getMove())
        theirDefC = target.getBattleStat(Stat.SPDEF, user, move.getMove(), true)
        break;
      case MoveData.MoveCategory.STATUS:
        return "---"
    }
    var stabBonus = 1
    var types = user.getTypes()
    // Apply STAB bonus
    for (var i = 0; i < types.length; i++) {
      if (types[i] == move.getMove().type) {
        stabBonus = 1.5
      }
    }
    // Apply Tera Type bonus
    if (stabBonus == 1.5) {
      // STAB
      if (move.getMove().type == user.getTeraType()) {
        stabBonus = 2
      }
    } else if (move.getMove().type == user.getTeraType()) {
      stabBonus = 1.5
    }
    // Apply adaptability
    if (stabBonus == 2) {
      // Tera-STAB
      if (move.getMove().type == user.getTeraType()) {
        stabBonus = 2.25
      }
    } else if (stabBonus == 1.5) {
      // STAB or Tera
      if (move.getMove().type == user.getTeraType()) {
        stabBonus = 2
      }
    } else if (move.getMove().type == user.getTeraType()) {
      // Adaptability
      stabBonus = 1.5
    }
    var weatherBonus = 1
    if (this.scene.arena.weather.weatherType == WeatherType.RAIN || this.scene.arena.weather.weatherType == WeatherType.HEAVY_RAIN) {
      if (move.getMove().type == Type.WATER) {
        weatherBonus = 1.5
      }
      if (move.getMove().type == Type.FIRE) {
        weatherBonus = this.scene.arena.weather.weatherType == WeatherType.HEAVY_RAIN ? 0 : 0.5
      }
    }
    if (this.scene.arena.weather.weatherType == WeatherType.SUNNY || this.scene.arena.weather.weatherType == WeatherType.HARSH_SUN) {
      if (move.getMove().type == Type.FIRE) {
        weatherBonus = 1.5
      }
      if (move.getMove().type == Type.WATER) {
        weatherBonus = this.scene.arena.weather.weatherType == WeatherType.HARSH_SUN ? 0 : (move.moveId == Moves.HYDRO_STEAM ? 1.5 : 0.5)
      }
    }
    var typeBonus = target.getAttackMoveEffectiveness(user, move)
    var modifiers = stabBonus * weatherBonus
    */
    var dmgHigh = 0
    var dmgLow = 0
    // dmgLow = (((2*user.level/5 + 2) * power * myAtk / theirDef)/50 + 2) * 0.85 * modifiers
    // dmgHigh = (((2*user.level/5 + 2) * power * myAtkC / theirDefC)/50 + 2) * 1.5 * modifiers
    var out = this.simulateAttack(scene, user, target, move.getMove())
    var minHits = 1
    var maxHits = 1
    var mh = move.getMove().getAttrs(MoveData.MultiHitAttr)
    for (var i = 0; i < mh.length; i++) {
      var mh2 = mh[i] as MoveData.MultiHitAttr
      switch (mh2.multiHitType) {
        case MoveData.MultiHitType._2:
          minHits = 2;
          maxHits = 2;
        case MoveData.MultiHitType._2_TO_5:
          minHits = 2;
          maxHits = 5;
        case MoveData.MultiHitType._3:
          minHits = 3;
          maxHits = 3;
        case MoveData.MultiHitType._10:
          minHits = 10;
          maxHits = 10;
        case MoveData.MultiHitType.BEAT_UP:
          const party = user.isPlayer() ? user.scene.getParty() : user.scene.getEnemyParty();
          // No status means the ally pokemon can contribute to Beat Up
          minHits = party.reduce((total, pokemon) => {
            return total + (pokemon.id === user.id ? 1 : pokemon?.status && pokemon.status.effect !== StatusEffect.NONE ? 0 : 1);
          }, 0);
          maxHits = minHits
      }
    }
    var h = user.getHeldItems()
    for (var i = 0; i < h.length; i++) {
      if (h[i].type instanceof PokemonMultiHitModifierType) {
        minHits += h[i].getStackCount()
        maxHits += h[i].getStackCount()
      }
    }
    dmgLow = out[0] * minHits
    dmgHigh = out[1] * maxHits
    var qSuffix = ""
    if (target.isBoss()) {
      var bossSegs = (target as EnemyPokemon).bossSegments
      //dmgLow /= bossSegs
      //dmgHigh /= bossSegs
      //qSuffix = "?"
    }
    var dmgLowP = Math.round((dmgLow)/target.getBattleStat(Stat.HP)*100)
    var dmgHighP = Math.round((dmgHigh)/target.getBattleStat(Stat.HP)*100)
    /*
    if (user.hasAbility(Abilities.PARENTAL_BOND)) {
      // Second hit deals 0.25x damage
      dmgLow *= 1.25
      dmgHigh *= 1.25
    }
    */
    var koText = ""
    if (Math.floor(dmgLow) >= target.hp) {
      koText = " (KO)"
    } else if (Math.ceil(dmgHigh) >= target.hp) {
      var percentChance = 1 - ((target.hp - dmgLow + 1) / (dmgHigh - dmgLow + 1))
      koText = " (" + Math.round(percentChance * 100) + "% KO)"
    }
    if (target.getMoveEffectiveness(user, move.getMove(), false, true) == undefined) {
      return "---"
    }
    if (scene.damageDisplay == "Value")
      return target.getMoveEffectiveness(user, move.getMove(), false, true) + "x - " + (Math.round(dmgLow) == Math.round(dmgHigh) ? Math.round(dmgLow).toString() + qSuffix : Math.round(dmgLow) + "-" + Math.round(dmgHigh) + qSuffix) + koText
    if (scene.damageDisplay == "Percent")
      return target.getMoveEffectiveness(user, move.getMove(), false, true) + "x - " + (dmgLowP == dmgHighP ? dmgLowP + "%" + qSuffix : dmgLowP + "%-" + dmgHighP + "%" + qSuffix) + koText
    if (scene.damageDisplay == "Off")
      return target.getMoveEffectiveness(user, move.getMove(), false, true) + "x" + ((Math.floor(dmgLow) >= target.hp) ? " (KO)" : "")
  }

  setCursor(cursor: integer): boolean {
    const ui = this.getUi();

    const changed = this.getCursor() !== cursor;
    if (changed) {
      if (!this.fieldIndex) {
        this.cursor = cursor;
      } else {
        this.cursor2 = cursor;
      }
    }

    if (!this.cursorObj) {
      this.cursorObj = this.scene.add.image(0, 0, "cursor");
      ui.add(this.cursorObj);
    }

    const pokemon = (this.scene.getCurrentPhase() as CommandPhase).getPokemon();
    const moveset = pokemon.getMoveset();

    const hasMove = cursor < moveset.length;

    if (hasMove) {
      const pokemonMove = moveset[cursor]!; // TODO: is the bang correct?
      const moveType = pokemon.getMoveType(pokemonMove.getMove());
      const textureKey = Utils.getLocalizedSpriteKey("types");
      this.typeIcon.setTexture(textureKey, Type[moveType].toLowerCase()).setScale(0.8);

      const moveCategory = pokemonMove.getMove().category;
      this.moveCategoryIcon.setTexture("categories", MoveCategory[moveCategory].toLowerCase()).setScale(1.0);
      const power = pokemonMove.getMove().power;
      const accuracy = pokemonMove.getMove().accuracy;
      const maxPP = pokemonMove.getMovePp();
      const pp = maxPP - pokemonMove.ppUsed;

      const accuracy1 = this.calculateAccuracy(pokemon, this.scene.getEnemyField()[0], pokemonMove)
      const accuracy2 = this.calculateAccuracy(pokemon, this.scene.getEnemyField()[1], pokemonMove)
      const ppLeftStr = Utils.padInt(pp, 2, "  ");
      const ppMaxStr = Utils.padInt(maxPP, 2, "  ");
      this.ppText.setText(`${ppLeftStr}/${ppMaxStr}`);
      this.powerText.setText(`${power >= 0 ? power : "---"}`);
      this.accuracyText.setText(`${accuracy >= 0 ? accuracy : "---"}`);
      this.accuracyText.setText(`${accuracy1 >= 0 ? Math.round(accuracy1) : "---"}`);
      if (this.scene.getEnemyField()[1] != undefined)
        this.accuracyText.setText(`${accuracy1 >= 0 ? Math.round(accuracy1) : "---"}/${accuracy2 >= 0 ? Math.round(accuracy2) : "---"}`);

      const ppPercentLeft = pp / maxPP;

      //** Determines TextStyle according to percentage of PP remaining */
      let ppColorStyle = TextStyle.MOVE_PP_FULL;
      if (ppPercentLeft > 0.25 && ppPercentLeft <= 0.5) {
        ppColorStyle = TextStyle.MOVE_PP_HALF_FULL;
      } else if (ppPercentLeft > 0 && ppPercentLeft <= 0.25) {
        ppColorStyle = TextStyle.MOVE_PP_NEAR_EMPTY;
      } else if (ppPercentLeft === 0) {
        ppColorStyle = TextStyle.MOVE_PP_EMPTY;
      }

      //** Changes the text color and shadow according to the determined TextStyle */
      this.ppText.setColor(this.getTextColor(ppColorStyle, false));
      this.ppText.setShadowColor(this.getTextColor(ppColorStyle, true));

      pokemon.getOpponents().forEach((opponent) => {
        opponent.updateEffectiveness(this.getEffectivenessText(pokemon, opponent, pokemonMove));
        opponent.updateEffectiveness(this.calcDamage(this.scene, pokemon, opponent, pokemonMove));
      });
    }

    this.typeIcon.setVisible(hasMove);
    this.ppLabel.setVisible(hasMove);
    this.ppText.setVisible(hasMove);
    this.powerLabel.setVisible(hasMove);
    this.powerText.setVisible(hasMove);
    this.accuracyLabel.setVisible(hasMove);
    this.accuracyText.setVisible(hasMove);
    this.moveCategoryIcon.setVisible(hasMove);

    this.cursorObj.setPosition(13 + (cursor % 2 === 1 ? 100 : 0), -31 + (cursor >= 2 ? 15 : 0));

    return changed;
  }

  /**
   * Gets multiplier text for a pokemon's move against a specific opponent
   * Returns undefined if it's a status move
   */
  private getEffectivenessText(pokemon: Pokemon, opponent: Pokemon, pokemonMove: PokemonMove): string | undefined {
    const effectiveness = opponent.getMoveEffectiveness(pokemon, pokemonMove.getMove(), !opponent.battleData?.abilityRevealed);
    if (effectiveness === undefined) {
      return undefined;
    }

    return `${effectiveness}x`;
  }

  displayMoves() {
    const pokemon = (this.scene.getCurrentPhase() as CommandPhase).getPokemon();
    const moveset = pokemon.getMoveset();

    for (let moveIndex = 0; moveIndex < 4; moveIndex++) {
      const moveText = addTextObject(this.scene, moveIndex % 2 === 0 ? 0 : 100, moveIndex < 2 ? 0 : 16, "-", TextStyle.WINDOW);
      moveText.setName("text-empty-move");

      if (moveIndex < moveset.length) {
        const pokemonMove = moveset[moveIndex]!; // TODO is the bang correct?
        moveText.setText(pokemonMove.getName());
        moveText.setName(pokemonMove.getName());
        moveText.setColor(this.getMoveColor(pokemon, pokemonMove) ?? moveText.style.color);
      }

      this.movesContainer.add(moveText);
    }
  }

  /**
   * Returns a specific move's color based on its type effectiveness against opponents
   * If there are multiple opponents, the highest effectiveness' color is returned
   * @returns A color or undefined if the default color should be used
   */
  private getMoveColor(pokemon: Pokemon, pokemonMove: PokemonMove): string | undefined {
    if (!this.scene.typeHints) {
      return undefined;
    }

    const opponents = pokemon.getOpponents();
    if (opponents.length <= 0) {
      return undefined;
    }

    const moveColors = opponents
      .map((opponent) => opponent.getMoveEffectiveness(pokemon, pokemonMove.getMove(), !opponent.battleData.abilityRevealed))
      .sort((a, b) => b - a)
      .map((effectiveness) => getTypeDamageMultiplierColor(effectiveness ?? 0, "offense"));

    return moveColors[0];
  }

  clear() {
    super.clear();
    const messageHandler = this.getUi().getMessageHandler();
    this.clearMoves();
    this.typeIcon.setVisible(false);
    this.ppLabel.setVisible(false);
    this.ppText.setVisible(false);
    this.powerLabel.setVisible(false);
    this.powerText.setVisible(false);
    this.accuracyLabel.setVisible(false);
    this.accuracyText.setVisible(false);
    this.moveCategoryIcon.setVisible(false);
    messageHandler.bg.setVisible(true);
    this.eraseCursor();
  }

  clearMoves() {
    this.movesContainer.removeAll(true);

    const opponents = (this.scene.getCurrentPhase() as CommandPhase).getPokemon().getOpponents();
    opponents.forEach((opponent) => {
      opponent.updateEffectiveness(undefined);
    });
  }

  eraseCursor() {
    if (this.cursorObj) {
      this.cursorObj.destroy();
    }
    this.cursorObj = null;
  }
}