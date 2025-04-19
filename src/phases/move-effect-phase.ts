import { BattlerIndex } from "#app/battle";
import { globalScene } from "#app/global-scene";
import {
  AddSecondStrikeAbAttr,
  AlwaysHitAbAttr,
  applyPostAttackAbAttrs,
  applyPostDamageAbAttrs,
  applyPostDefendAbAttrs,
  applyPreAttackAbAttrs,
  IgnoreMoveEffectsAbAttr,
  MaxMultiHitAbAttr,
  PostAttackAbAttr,
  PostDamageAbAttr,
  PostDefendAbAttr,
  ReflectStatusMoveAbAttr,
} from "#app/data/abilities/ability";
import { ArenaTagSide, ConditionalProtectTag } from "#app/data/arena-tag";
import { MoveAnim } from "#app/data/battle-anims";
import {
  BattlerTagLapseType,
  DamageProtectedTag,
  ProtectedTag,
  SemiInvulnerableTag,
  SubstituteTag,
  TypeBoostTag,
} from "#app/data/battler-tags";
import type { MoveAttr } from "#app/data/moves/move";
import {
  applyFilteredMoveAttrs,
  applyMoveAttrs,
  AttackMove,
  DelayedAttackAttr,
  FlinchAttr,
  getMoveTargets,
  HitsTagAttr,
  MissEffectAttr,
  MoveEffectAttr,
  MultiHitAttr,
  NoEffectAttr,
  OneHitKOAttr,
  OverrideMoveEffectAttr,
  StatChangeBeforeDmgCalcAttr,
  ToxicAccuracyAttr,
} from "#app/data/moves/move";
import { MoveEffectTrigger } from "#enums/MoveEffectTrigger";
import { MoveFlags } from "#enums/MoveFlags";
import { MoveTarget } from "#enums/MoveTarget";
import { MoveCategory } from "#enums/MoveCategory";
import { SpeciesFormChangePostMoveTrigger } from "#app/data/pokemon-forms";
import { PokemonType } from "#enums/pokemon-type";
import { DamageResult, PokemonMove, type TurnMove } from "#app/field/pokemon";
import type Pokemon from "#app/field/pokemon";
import { HitResult, MoveResult } from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import {
  ContactHeldItemTransferChanceModifier,
  DamageMoneyRewardModifier,
  EnemyAttackStatusEffectChanceModifier,
  EnemyEndureChanceModifier,
  FlinchChanceModifier,
  HitHealModifier,
  PokemonMultiHitModifier,
} from "#app/modifier/modifier";
import { PokemonPhase } from "#app/phases/pokemon-phase";
import { BooleanHolder, isNullOrUndefined, NumberHolder } from "#app/utils/common";
import type { nil } from "#app/utils/common";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Moves } from "#enums/moves";
import i18next from "i18next";
import type { Phase } from "#app/phase";
import { ShowAbilityPhase } from "./show-ability-phase";
import { MovePhase } from "./move-phase";
import { MoveEndPhase } from "./move-end-phase";
import { HideAbilityPhase } from "#app/phases/hide-ability-phase";
import { TypeDamageMultiplier } from "#app/data/type";
import { HitCheckResult } from "#enums/hit-check-result";
import type Move from "#app/data/moves/move";
import { isFieldTargeted } from "#app/data/moves/move-utils";
import { FaintPhase } from "./faint-phase";
import { DamageAchv } from "#app/system/achv";

type HitCheckEntry = [HitCheckResult, TypeDamageMultiplier];

export class MoveEffectPhase extends PokemonPhase {
  public move: Move;
  private virtual = false;
  protected targets: BattlerIndex[];
  protected reflected = false;

  /** The result of the hit check against each target */
  private hitChecks: HitCheckEntry[];

  /** The move history entry for the move */
  private moveHistoryEntry: TurnMove;

  /** Is this the first strike of a move? */
  private firstHit: boolean;
  /** Is this the last strike of a move? */
  private lastHit: boolean;

  /** Phases queued during moves */
  private queuedPhases: Phase[] = [];

  /**
   * @param reflected Indicates that the move was reflected by the user due to magic coat or magic bounce
   * @param virtual Indicates that the move is a virtual move (i.e. called by metronome)
   */
  constructor(battlerIndex: BattlerIndex, targets: BattlerIndex[], move: Move, reflected = false, virtual = false) {
    super(battlerIndex);
    this.move = move;
    this.virtual = virtual;

    this.reflected = reflected;
    /**
     * In double battles, if the right Pokemon selects a spread move and the left Pokemon dies
     * with no party members available to switch in, then the right Pokemon takes the index
     * of the left Pokemon and gets hit unless this is checked.
     */
    if (targets.includes(battlerIndex) && this.move.moveTarget === MoveTarget.ALL_NEAR_OTHERS) {
      const i = targets.indexOf(battlerIndex);
      targets.splice(i, i + 1);
    }
    this.targets = targets;

    this.hitChecks = Array(this.targets.length).fill([HitCheckResult.PENDING, 0]);
  }

  /**
   * Compute targets and the results of hit checks of the invoked move against all targets,
   * organized by battler index.
   *
   * **This is *not* a pure function**; it has the following side effects
   * - `this.hitChecks` - The results of the hit checks against each target
   * - `this.moveHistoryEntry` - Sets success or failure based on the hit check results
   * - user.turnData.hitCount and user.turnData.hitsLeft - Both set to 1 if the
   *   move was unsuccessful against all targets
   *
   * @returns The targets of the invoked move
   * @see {@linkcode hitCheck}
   */
  private conductHitChecks(user: Pokemon, fieldMove: boolean): Pokemon[] {
    /** All Pokemon targeted by this phase's invoked move */
    /** Whether any hit check ended in a success */
    let anySuccess = false;
    /** Whether the attack missed all of its targets */
    let allMiss = true;

    let targets = this.getTargets();

    // For field targeted moves, we only look for the first target that may magic bounce

    for (const [i, target] of targets.entries()) {
      const hitCheck = this.hitCheck(target);
      // If the move bounced and was a field targeted move,
      // then immediately stop processing other targets
      if (fieldMove && hitCheck[0] === HitCheckResult.REFLECTED) {
        targets = [target];
        this.hitChecks = [hitCheck];
        break;
      }
      if (hitCheck[0] === HitCheckResult.HIT) {
        anySuccess = true;
      } else {
        allMiss ||= hitCheck[0] === HitCheckResult.MISS;
      }
      this.hitChecks[i] = hitCheck;
    }

    if (anySuccess) {
      this.moveHistoryEntry.result = MoveResult.SUCCESS;
    } else {
      user.turnData.hitCount = 1;
      user.turnData.hitsLeft = 1;
      this.moveHistoryEntry.result = allMiss ? MoveResult.MISS : MoveResult.FAIL;
    }

    return targets;
  }

  /**
   * Queue the phaes that should occur when the target reflects the move back to the user
   * @param user - The {@linkcode Pokemon} using this phase's invoked move
   * @param target - The {@linkcode Pokemon} that is reflecting the move
   *
   */
  private queueReflectedMove(user: Pokemon, target: Pokemon): void {
    const newTargets = this.move.isMultiTarget()
      ? getMoveTargets(target, this.move.id).targets
      : [user.getBattlerIndex()];
    // TODO: ability displays should be handled by the ability
    if (!target.getTag(BattlerTagType.MAGIC_COAT)) {
      this.queuedPhases.push(
        new ShowAbilityPhase(target.getBattlerIndex(), target.getPassiveAbility().hasAttr(ReflectStatusMoveAbAttr)),
      );
      this.queuedPhases.push(new HideAbilityPhase());
    }

    this.queuedPhases.push(
      new MovePhase(target, newTargets, new PokemonMove(this.move.id, 0, 0, true), true, true, true),
    );
  }

  /**
   * Apply the move to each of the resolved targets.
   * @param targets - The resolved set of targets of the move
   * @throws Error if there was an unexpected hit check result
   */
  private applyToTargets(user: Pokemon, targets: Pokemon[]): void {
    for (const [i, target] of targets.entries()) {
      const [hitCheckResult, effectiveness] = this.hitChecks[i];
      switch (hitCheckResult) {
        case HitCheckResult.HIT:
          this.applyMoveEffects(target, effectiveness);
          if (isFieldTargeted(this.move)) {
            // Stop processing other targets if the move is a field move
            return;
          }
          break;
        case HitCheckResult.NO_EFFECT:
          globalScene.queueMessage(
            i18next.t(this.move.id === Moves.SHEER_COLD ? "battle:hitResultImmune" : "battle:hitResultNoEffect", {
              pokemonName: getPokemonNameWithAffix(target),
            }),
          );
        case HitCheckResult.NO_EFFECT_NO_MESSAGE:
        case HitCheckResult.PROTECTED:
        case HitCheckResult.TARGET_NOT_ON_FIELD:
          applyMoveAttrs(NoEffectAttr, user, target, this.move);
          break;
        case HitCheckResult.MISS:
          globalScene.queueMessage(
            i18next.t("battle:attackMissed", { pokemonNameWithAffix: getPokemonNameWithAffix(target) }),
          );
          applyMoveAttrs(MissEffectAttr, user, target, this.move);
          break;
        case HitCheckResult.REFLECTED:
          this.queueReflectedMove(user, target);
          break;
        case HitCheckResult.PENDING:
        case HitCheckResult.ERROR:
          throw new Error("Unexpected hit check result");
      }
    }
  }

  public override start(): void {
    super.start();

    /** The Pokemon using this phase's invoked move */
    const user = this.getUserPokemon();

    if (!user) {
      super.end();
      return;
    }

    /** If an enemy used this move, set this as last enemy that used move or ability */
    if (!user.isPlayer()) {
      globalScene.currentBattle.lastEnemyInvolved = this.fieldIndex;
    } else {
      globalScene.currentBattle.lastPlayerInvolved = this.fieldIndex;
    }

    const isDelayedAttack = this.move.hasAttr(DelayedAttackAttr);
    /** If the user was somehow removed from the field and it's not a delayed attack, end this phase */
    if (!user.isOnField()) {
      if (!isDelayedAttack) {
        super.end();
        return;
      }
      if (!user.scene) {
        /*
         * This happens if the Pokemon that used the delayed attack gets caught and released
         * on the turn the attack would have triggered. Having access to the global scene
         * in the future may solve this entirely, so for now we just cancel the hit
         */
        super.end();
        return;
      }
      if (isNullOrUndefined(user.turnData)) {
        user.resetTurnData();
      }
    }

    /**
     * Does an effect from this move override other effects on this turn?
     * e.g. Charging moves (Fly, etc.) on their first turn of use.
     */
    const overridden = new BooleanHolder(false);
    const move = this.move;

    // Assume single target for override
    applyMoveAttrs(OverrideMoveEffectAttr, user, this.getFirstTarget() ?? null, move, overridden, this.virtual);

    // If other effects were overriden, stop this phase before they can be applied
    if (overridden.value) {
      return this.end();
    }

    // Lapse `MOVE_EFFECT` effects (i.e. semi-invulnerability) when applicable
    user.lapseTags(BattlerTagLapseType.MOVE_EFFECT);

    // If the user is acting again (such as due to Instruct), reset hitsLeft/hitCount so that
    // the move executes correctly (ensures all hits of a multi-hit are properly calculated)
    if (user.turnData.hitsLeft === 0 && user.turnData.hitCount > 0 && user.turnData.extraTurns > 0) {
      user.turnData.hitsLeft = -1;
      user.turnData.hitCount = 0;
      user.turnData.extraTurns--;
    }

    /**
     * If this phase is for the first hit of the invoked move,
     * resolve the move's total hit count. This block combines the
     * effects of the move itself, Parental Bond, and Multi-Lens to do so.
     */
    if (user.turnData.hitsLeft === -1) {
      const hitCount = new NumberHolder(1);
      // Assume single target for multi hit
      applyMoveAttrs(MultiHitAttr, user, this.getFirstTarget() ?? null, move, hitCount);
      // If Parental Bond is applicable, add another hit
      applyPreAttackAbAttrs(AddSecondStrikeAbAttr, user, null, move, false, hitCount, null);
      // If Multi-Lens is applicable, add hits equal to the number of held Multi-Lenses
      globalScene.applyModifiers(PokemonMultiHitModifier, user.isPlayer(), user, move.id, hitCount);
      // Set the user's relevant turnData fields to reflect the final hit count
      user.turnData.hitCount = hitCount.value;
      user.turnData.hitsLeft = hitCount.value;
    }

    /*
     * Log to be entered into the user's move history once the move result is resolved.
     * Note that `result` logs whether the move was successfully
     * used in the sense of "Does it have an effect on the user?".
     */
    this.moveHistoryEntry = {
      move: this.move.id,
      targets: this.targets,
      result: MoveResult.PENDING,
      virtual: this.virtual,
    };

    const fieldMove = isFieldTargeted(move);

    const targets = this.conductHitChecks(user, fieldMove);

    this.firstHit = user.turnData.hitCount === user.turnData.hitsLeft;
    this.lastHit = user.turnData.hitsLeft === 1 || !targets.some(t => t.isActive(true));

    // Play the animation if the move was successful against any of its targets or it has a POST_TARGET effect (like self destruct)
    if (
      this.moveHistoryEntry.result === MoveResult.SUCCESS ||
      move.getAttrs(MoveEffectAttr).some(attr => attr.trigger === MoveEffectTrigger.POST_TARGET)
    ) {
      const firstTarget = this.getFirstTarget();
      new MoveAnim(
        move.id as Moves,
        user,
        firstTarget?.getBattlerIndex() ?? BattlerIndex.ATTACKER,
        // Field moves and some moves used in mystery encounters should be played even on an empty field
        fieldMove || (globalScene.currentBattle?.mysteryEncounter?.hasBattleAnimationsWithoutTargets ?? false),
      ).play(move.hitsSubstitute(user, firstTarget), () => this.postAnimCallback(user, targets));

      return;
    }
    this.postAnimCallback(user, targets);
  }

  /**
   * Callback to be called after the move animation is played
   */
  private postAnimCallback(user: Pokemon, targets: Pokemon[]) {
    // Add to the move history entry
    if (this.firstHit) {
      user.pushMoveHistory(this.moveHistoryEntry);
    }

    try {
      this.applyToTargets(user, targets);
    } catch (e) {
      console.warn(e.message || "Unexpected error in move effect phase");
      this.end();
      return;
    }

    if (this.queuedPhases.length) {
      globalScene.appendToPhase(this.queuedPhases, MoveEndPhase);
    }
    const moveType = user.getMoveType(this.move, true);
    if (this.move.category !== MoveCategory.STATUS && !user.stellarTypesBoosted.includes(moveType)) {
      user.stellarTypesBoosted.push(moveType);
    }

    if (this.lastHit) {
      this.triggerMoveEffects(MoveEffectTrigger.POST_TARGET, user, null);
    }

    this.updateSubstitutes();
    this.end();
  }

  public override end(): void {
    const user = this.getUserPokemon();
    /**
     * If this phase isn't for the invoked move's last strike,
     * unshift another MoveEffectPhase for the next strike.
     * Otherwise, queue a message indicating the number of times the move has struck
     * (if the move has struck more than once), then apply the heal from Shell Bell
     * to the user.
     */
    if (user) {
      if (user.turnData.hitsLeft && --user.turnData.hitsLeft >= 1 && this.getFirstTarget()?.isActive()) {
        globalScene.unshiftPhase(this.getNewHitPhase());
      } else {
        // Queue message for number of hits made by multi-move
        // If multi-hit attack only hits once, still want to render a message
        const hitsTotal = user.turnData.hitCount - Math.max(user.turnData.hitsLeft, 0);
        if (hitsTotal > 1 || (user.turnData.hitsLeft && user.turnData.hitsLeft > 0)) {
          // If there are multiple hits, or if there are hits of the multi-hit move left
          globalScene.queueMessage(i18next.t("battle:attackHitsCount", { count: hitsTotal }));
        }
        globalScene.applyModifiers(HitHealModifier, this.player, user);
        this.getTargets().forEach(target => (target.turnData.moveEffectiveness = null));
      }
    }

    super.end();
  }

  /**
   * Applies reactive effects that occur when a Pokémon is hit.
   * (i.e. Effect Spore, Disguise, Liquid Ooze, Beak Blast)
   * @param user - The {@linkcode Pokemon} using this phase's invoked move
   * @param target - {@linkcode Pokemon} the current target of this phase's invoked move
   * @param hitResult - The {@linkcode HitResult} of the attempted move
   * @returns a `Promise` intended to be passed into a `then()` call.
   */
  protected applyOnGetHitAbEffects(user: Pokemon, target: Pokemon, hitResult: HitResult): void {
    applyPostDefendAbAttrs(PostDefendAbAttr, target, user, this.move, hitResult);
    target.lapseTags(BattlerTagLapseType.AFTER_HIT);
  }

  /**
   * Handles checking for and applying Flinches
   * @param user - The {@linkcode Pokemon} using this phase's invoked move
   * @param target - {@linkcode Pokemon} the current target of this phase's invoked move
   * @param dealsDamage - `true` if the attempted move successfully dealt damage
   * @returns a function intended to be passed into a `then()` call.
   */
  protected applyHeldItemFlinchCheck(user: Pokemon, target: Pokemon, dealsDamage: boolean): void {
    if (this.move.hasAttr(FlinchAttr)) {
      return;
    }

    if (dealsDamage && !target.hasAbilityWithAttr(IgnoreMoveEffectsAbAttr) && !this.move.hitsSubstitute(user, target)) {
      const flinched = new BooleanHolder(false);
      globalScene.applyModifiers(FlinchChanceModifier, user.isPlayer(), user, flinched);
      if (flinched.value) {
        target.addTag(BattlerTagType.FLINCHED, undefined, this.move.id, user.id);
      }
    }
  }

  /** Return whether the target is protected by protect or a relevant conditional protection
   * @param user - The {@linkcode Pokemon} using this phase's invoked move
   * @param target - {@linkcode Pokemon} the target to check for protection
   * @param move - The {@linkcode Move} being used
   */
  private protectedCheck(user: Pokemon, target: Pokemon) {
    /** The {@linkcode ArenaTagSide} to which the target belongs */
    const targetSide = target.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY;
    /** Has the invoked move been cancelled by conditional protection (e.g Quick Guard)? */
    const hasConditionalProtectApplied = new BooleanHolder(false);
    /** Does the applied conditional protection bypass Protect-ignoring effects? */
    const bypassIgnoreProtect = new BooleanHolder(false);
    /** If the move is not targeting a Pokemon on the user's side, try to apply conditional protection effects */
    if (!this.move.isAllyTarget()) {
      globalScene.arena.applyTagsForSide(
        ConditionalProtectTag,
        targetSide,
        false,
        hasConditionalProtectApplied,
        user,
        target,
        this.move.id,
        bypassIgnoreProtect,
      );
    }

    return (
      ![MoveTarget.ENEMY_SIDE, MoveTarget.BOTH_SIDES].includes(this.move.moveTarget) &&
      (bypassIgnoreProtect.value || !this.move.doesFlagEffectApply({ flag: MoveFlags.IGNORE_PROTECT, user, target })) &&
      (hasConditionalProtectApplied.value ||
        (!target.findTags(t => t instanceof DamageProtectedTag).length &&
          target.findTags(t => t instanceof ProtectedTag).find(t => target.lapseTag(t.tagType))) ||
        (this.move.category !== MoveCategory.STATUS &&
          target.findTags(t => t instanceof DamageProtectedTag).find(t => target.lapseTag(t.tagType))))
    );
  }

  /**
   * Conduct the hit check and type effectiveness for this move against the target
   *
   * Checks occur in the following order:
   * 1. if the move is self-target
   * 2. if the target is on the field
   * 3. if the target is hidden by the effects of its commander ability
   * 4. if the target is in an applicable semi-invulnerable state
   * 5. if the target has an applicable protection effect
   * 6. if the move is reflected by magic coat or magic bounce
   * 7. type effectiveness calculation, including immunities from abilities and typing
   * 9. if accuracy is checked, whether the roll passes the accuracy check
   * @param target - The {@linkcode Pokemon} targeted by the invoked move
   * @returns a {@linkcode HitCheckEntry} containing the attack's {@linkcode HitCheckResult}
   *  and {@linkcode TypeDamageMultiplier | effectiveness} against the target.
   */
  public hitCheck(target: Pokemon): HitCheckEntry {
    const user = this.getUserPokemon();
    const move = this.move;

    if (!user) {
      return [HitCheckResult.ERROR, 0];
    }

    // Moves targeting the user bypass all checks
    if (move.moveTarget === MoveTarget.USER) {
      return [HitCheckResult.HIT, 1];
    }

    const fieldTargeted = isFieldTargeted(move);

    if (!target.isActive(true) && !fieldTargeted) {
      return [HitCheckResult.TARGET_NOT_ON_FIELD, 0];
    }

    // Commander causes moves used against the target to miss
    if (
      !fieldTargeted &&
      globalScene.currentBattle.double &&
      target.getAlly()?.getTag(BattlerTagType.COMMANDED)?.getSourcePokemon() === target
    ) {
      return [HitCheckResult.MISS, 0];
    }

    /** Whether both accuracy and invulnerability checks can be skipped */
    const bypassAccAndInvuln = fieldTargeted || this.checkBypassAccAndInvuln(target);
    const semiInvulnerableTag = target.getTag(SemiInvulnerableTag);

    if (semiInvulnerableTag && !bypassAccAndInvuln && !this.checkBypassSemiInvuln(semiInvulnerableTag)) {
      return [HitCheckResult.MISS, 0];
    }

    if (!fieldTargeted && this.protectedCheck(user, target)) {
      return [HitCheckResult.PROTECTED, 0];
    }

    if (!this.reflected && move.doesFlagEffectApply({ flag: MoveFlags.REFLECTABLE, user, target })) {
      return [HitCheckResult.REFLECTED, 0];
    }

    // After the magic bounce check, field targeted moves are always successful
    if (fieldTargeted) {
      return [HitCheckResult.HIT, 1];
    }

    const cancelNoEffectMessage = new BooleanHolder(false);

    /**
     * The effectiveness of the move against the given target.
     * Accounts for type and move immunities from defensive typing, abilities, and other effects.
     */
    const effectiveness = target.getMoveEffectiveness(user, move, false, false, cancelNoEffectMessage);
    if (effectiveness === 0) {
      return [
        cancelNoEffectMessage.value ? HitCheckResult.NO_EFFECT_NO_MESSAGE : HitCheckResult.NO_EFFECT,
        effectiveness,
      ];
    }

    const moveAccuracy = move.calculateBattleAccuracy(user, target);

    // Strikes after the first in a multi-strike move are guaranteed to hit,
    // unless the move is flagged to check all hits and the user does not have Skill Link.
    if (user.turnData.hitsLeft < user.turnData.hitCount) {
      if (!move.hasFlag(MoveFlags.CHECK_ALL_HITS) || user.hasAbilityWithAttr(MaxMultiHitAbAttr)) {
        return [HitCheckResult.HIT, effectiveness];
      }
    }

    const bypassAccuracy =
      bypassAccAndInvuln ||
      target.getTag(BattlerTagType.ALWAYS_GET_HIT) ||
      (target.getTag(BattlerTagType.TELEKINESIS) && !this.move.hasAttr(OneHitKOAttr));

    if (moveAccuracy === -1 || bypassAccuracy) {
      return [HitCheckResult.HIT, effectiveness];
    }

    const accuracyMultiplier = user.getAccuracyMultiplier(target, this.move);
    const rand = user.randSeedInt(100);

    if (rand < moveAccuracy * accuracyMultiplier) {
      return [HitCheckResult.HIT, effectiveness];
    }

    return [HitCheckResult.MISS, 0];
  }

  /**
   * Check whether the move should bypass *both* the accuracy *and* semi-invulnerable states.
   * @param target - The {@linkcode Pokemon} targeted by the invoked move
   * @returns `true` if the move should bypass accuracy and semi-invulnerability
   *
   * Accuracy and semi-invulnerability can be bypassed by:
   * - An ability like {@linkcode Abilities.NO_GUARD | No Guard}
   * - A poison type using {@linkcode Moves.TOXIC | Toxic}
   * - A move like {@linkcode Moves.LOCK_ON | Lock-On} or {@linkcode Moves.MIND_READER | Mind Reader}.
   * - A field-targeted move like spikes
   *
   * Does *not* check against effects {@linkcode Moves.GLAIVE_RUSH | Glaive Rush} status (which
   * should not bypass semi-invulnerability), or interactions like Earthquake hitting against Dig,
   * (which should not bypass the accuracy check).
   *
   * @see {@linkcode hitCheck}
   */
  public checkBypassAccAndInvuln(target: Pokemon) {
    const user = this.getUserPokemon();
    if (!user) {
      return false;
    }
    if (user.hasAbilityWithAttr(AlwaysHitAbAttr) || target.hasAbilityWithAttr(AlwaysHitAbAttr)) {
      return true;
    }
    if (this.move.hasAttr(ToxicAccuracyAttr) && user.isOfType(PokemonType.POISON)) {
      return true;
    }
    // TODO: Fix lock on / mind reader check.
    if (
      user.getTag(BattlerTagType.IGNORE_ACCURACY) &&
      (user.getLastXMoves().find(() => true)?.targets || []).indexOf(target.getBattlerIndex()) !== -1
    ) {
      return true;
    }
    if (isFieldTargeted(this.move)) {
      return true;
    }
  }

  /**
   * Check whether the move is able to ignore the given `semiInvulnerableTag`
   * @param semiInvulnerableTag - The semiInvulnerable tag to check against
   * @returns `true` if the move can ignore the semi-invulnerable state
   */
  public checkBypassSemiInvuln(semiInvulnerableTag: SemiInvulnerableTag | nil): boolean {
    if (!semiInvulnerableTag) {
      return false;
    }
    const move = this.move;
    return move.getAttrs(HitsTagAttr).some(hta => hta.tagType === semiInvulnerableTag.tagType);
  }

  /** @returns The {@linkcode Pokemon} using this phase's invoked move */
  public getUserPokemon(): Pokemon | null {
    if (this.battlerIndex > BattlerIndex.ENEMY_2) {
      return globalScene.getPokemonById(this.battlerIndex);
    }
    return (this.player ? globalScene.getPlayerField() : globalScene.getEnemyField())[this.fieldIndex];
  }

  /** @returns An array of all {@linkcode Pokemon} targeted by this phase's invoked move */
  public getTargets(): Pokemon[] {
    return globalScene.getField(true).filter(p => this.targets.indexOf(p.getBattlerIndex()) > -1);
  }

  /** @returns The first target of this phase's invoked move */
  public getFirstTarget(): Pokemon | undefined {
    return this.getTargets()[0];
  }

  /**
   * Removes the given {@linkcode Pokemon} from this phase's target list
   * @param target - The {@linkcode Pokemon} to be removed
   */
  protected removeTarget(target: Pokemon): void {
    const targetIndex = this.targets.findIndex(ind => ind === target.getBattlerIndex());
    if (targetIndex !== -1) {
      this.targets.splice(
        this.targets.findIndex(ind => ind === target.getBattlerIndex()),
        1,
      );
    }
  }

  /**
   * Prevents subsequent strikes of this phase's invoked move from occurring
   * @param target - If defined, only stop subsequent strikes against this {@linkcode Pokemon}
   */
  public stopMultiHit(target?: Pokemon): void {
    // If given a specific target, remove the target from subsequent strikes
    if (target) {
      this.removeTarget(target);
    }
    const user = this.getUserPokemon();
    if (!user) {
      return;
    }
    // If no target specified, or the specified target was the last of this move's
    // targets, completely cancel all subsequent strikes.
    if (!target || this.targets.length === 0) {
      user.turnData.hitCount = 1;
      user.turnData.hitsLeft = 1;
    }
  }

  /** @returns A new `MoveEffectPhase` with the same properties as this phase */
  protected getNewHitPhase(): MoveEffectPhase {
    return new MoveEffectPhase(this.battlerIndex, this.targets, this.move, this.reflected, this.virtual);
  }

  /** Removes all substitutes that were broken by this phase's invoked move */
  protected updateSubstitutes(): void {
    const targets = this.getTargets();
    for (const target of targets) {
      const substitute = target.getTag(SubstituteTag);
      if (substitute && substitute.hp <= 0) {
        target.lapseTag(BattlerTagType.SUBSTITUTE);
      }
    }
  }

  /**
   * Triggers move effects of the given move effect trigger.
   * @param triggerType The {@linkcode MoveEffectTrigger} being applied
   * @param user The {@linkcode Pokemon} using the move
   * @param target The {@linkcode Pokemon} targeted by the move
   * @param firstTarget Whether the target is the first to be hit by the current strike
   * @param selfTarget If defined, limits the effects triggered to either self-targeted
   *  effects (if set to `true`) or targeted effects (if set to `false`).
   * @returns a `Promise` applying the relevant move effects.
   */
  protected triggerMoveEffects(
    triggerType: MoveEffectTrigger,
    user: Pokemon,
    target: Pokemon | null,
    firstTarget?: boolean | null,
    selfTarget?: boolean,
  ): void {
    return applyFilteredMoveAttrs(
      (attr: MoveAttr) =>
        attr instanceof MoveEffectAttr &&
        attr.trigger === triggerType &&
        (isNullOrUndefined(selfTarget) || attr.selfTarget === selfTarget) &&
        (!attr.firstHitOnly || this.firstHit) &&
        (!attr.lastHitOnly || this.lastHit) &&
        (!attr.firstTargetOnly || (firstTarget ?? true)),
      user,
      target,
      this.move,
    );
  }

  /**
   * Applies all move effects that trigger in the event of a successful hit:
   *
   * - {@linkcode MoveEffectTrigger.PRE_APPLY | PRE_APPLY} effects`
   * - Applying damage to the target
   * - {@linkcode MoveEffectTrigger.POST_APPLY | POST_APPLY} effects
   * - Invoking {@linkcode applyOnTargetEffects} if the move does not hit a substitute
   * - Triggering form changes and emergency exit / wimp out if this is the last hit
   *
   * @param target the {@linkcode Pokemon} hit by this phase's move.
   * @param effectiveness the effectiveness of the move (as previously evaluated in {@linkcode hitCheck})
   */
  protected applyMoveEffects(target: Pokemon, effectiveness: TypeDamageMultiplier): void {
    const user = this.getUserPokemon();

    /** The first target hit by the move */
    const firstTarget = target === this.getTargets().find((_, i) => this.hitChecks[i][1] > 0);

    if (isNullOrUndefined(user)) {
      return;
    }

    this.triggerMoveEffects(MoveEffectTrigger.PRE_APPLY, user, target);

    const hitResult = this.applyMove(user, target, effectiveness);

    this.triggerMoveEffects(MoveEffectTrigger.POST_APPLY, user, target, firstTarget, true);
    if (!this.move.hitsSubstitute(user, target)) {
      this.applyOnTargetEffects(user, target, hitResult, firstTarget);
    }
    if (this.lastHit) {
      globalScene.triggerPokemonFormChange(user, SpeciesFormChangePostMoveTrigger);

      // Multi-hit check for Wimp Out/Emergency Exit
      if (user.turnData.hitCount > 1) {
        applyPostDamageAbAttrs(PostDamageAbAttr, target, 0, target.hasPassive(), false, [], user);
      }
    }
  }

  /**
   * Sub-method of for {@linkcode applyMoveEffects} that applies damage to the target.
   *
   * @param user - The {@linkcode Pokemon} using this phase's invoked move
   * @param target - The {@linkcode Pokemon} targeted by the move
   * @param effectiveness - The effectiveness of the move against the target
   */
  protected applyMoveDamage(user: Pokemon, target: Pokemon, effectiveness: TypeDamageMultiplier): HitResult {
    const isCritical = target.getCriticalHitResult(user, this.move, false);

    /*
     * Apply stat changes from {@linkcode move} and gives it to {@linkcode source}
     * before damage calculation
     */
    applyMoveAttrs(StatChangeBeforeDmgCalcAttr, user, target, this.move);

    const { result: result, damage: dmg } = target.getAttackDamage({
      source: user,
      move: this.move,
      ignoreAbility: false,
      ignoreSourceAbility: false,
      ignoreAllyAbility: false,
      ignoreSourceAllyAbility: false,
      simulated: false,
      effectiveness,
      isCritical,
    });

    const typeBoost = user.findTag(
      t => t instanceof TypeBoostTag && t.boostedType === user.getMoveType(this.move),
    ) as TypeBoostTag;
    if (typeBoost?.oneUse) {
      user.removeTag(typeBoost.tagType);
    }

    const isOneHitKo = result === HitResult.ONE_HIT_KO;

    if (!dmg) {
      return result;
    }

    target.lapseTags(BattlerTagLapseType.HIT);

    const substitute = target.getTag(SubstituteTag);
    const isBlockedBySubstitute = substitute && this.move.hitsSubstitute(user, target);
    if (isBlockedBySubstitute) {
      substitute.hp -= dmg;
    } else if (!target.isPlayer() && dmg >= target.hp) {
      globalScene.applyModifiers(EnemyEndureChanceModifier, false, target);
    }

    const damage = isBlockedBySubstitute
      ? 0
      : target.damageAndUpdate(dmg, {
          result: result as DamageResult,
          ignoreFaintPhase: true,
          ignoreSegments: isOneHitKo,
          isCritical,
          source: user,
        });

    if (isCritical) {
      globalScene.queueMessage(i18next.t("battle:criticalHit"));
    }

    if (damage <= 0) {
      return result;
    }

    if (user.isPlayer()) {
      globalScene.validateAchvs(DamageAchv, new NumberHolder(damage));

      if (damage > globalScene.gameData.gameStats.highestDamage) {
        globalScene.gameData.gameStats.highestDamage = damage;
      }
    }

    user.turnData.totalDamageDealt += damage;
    user.turnData.singleHitDamageDealt = damage;
    target.battleData.hitCount++;
    target.turnData.damageTaken += damage;

    target.turnData.attacksReceived.unshift({
      move: this.move.id,
      result: result as DamageResult,
      damage: damage,
      critical: isCritical,
      sourceId: user.id,
      sourceBattlerIndex: user.getBattlerIndex(),
    });

    if (user.isPlayer() && !target.isPlayer()) {
      globalScene.applyModifiers(DamageMoneyRewardModifier, true, user, new NumberHolder(damage));
    }

    return result;
  }

  /**
   * Sub-method of {@linkcode applyMove} that handles the event of a target fainting.
   * @param user - The {@linkcode Pokemon} using this phase's invoked move
   * @param target - The {@linkcode Pokemon} that fainted
   */
  protected onFaintTarget(user: Pokemon, target: Pokemon): void {
    // set splice index here, so future scene queues happen before FaintedPhase
    globalScene.setPhaseQueueSplice();

    globalScene.unshiftPhase(new FaintPhase(target.getBattlerIndex(), false, user));

    target.destroySubstitute();
    target.lapseTag(BattlerTagType.COMMANDED);
  }

  /**
   * Sub-method of {@linkcode applyMove} that queues the hit-result message
   * on the final strike of the move against a target
   * @param result - The {@linkcode HitResult} of the move
   */
  protected queueHitResultMessage(result: HitResult) {
    let msg: string | undefined;
    switch (result) {
      case HitResult.SUPER_EFFECTIVE:
        msg = i18next.t("battle:hitResultSuperEffective");
        break;
      case HitResult.NOT_VERY_EFFECTIVE:
        msg = i18next.t("battle:hitResultNotVeryEffective");
        break;
      case HitResult.ONE_HIT_KO:
        msg = i18next.t("battle:hitResultOneHitKO");
        break;
    }
    if (msg) {
      globalScene.queueMessage(msg);
    }
  }

  /** Apply the result of this phase's move to the given target
   * @param user - The {@linkcode Pokemon} using this phase's invoked move
   * @param target - The {@linkcode Pokemon} struck by the move
   * @param effectiveness - The effectiveness of the move against the target
   */
  protected applyMove(user: Pokemon, target: Pokemon, effectiveness: TypeDamageMultiplier): HitResult {
    const moveCategory = user.getMoveCategory(target, this.move);

    if (moveCategory === MoveCategory.STATUS) {
      return HitResult.STATUS;
    }

    const result = this.applyMoveDamage(user, target, effectiveness);

    if (user.turnData.hitsLeft === 1 && target.isFainted()) {
      this.queueHitResultMessage(result);
    }

    if (target.isFainted()) {
      this.onFaintTarget(user, target);
    }

    return result;
  }

  /**
   * Applies all effects aimed at the move's target.
   * To be used when the target is successfully and directly hit by the move.
   * @param user - The {@linkcode Pokemon} using the move
   * @param target - The {@linkcode Pokemon} targeted by the move
   * @param hitResult - The {@linkcode HitResult} obtained from applying the move
   * @param firstTarget - `true` if the target is the first Pokemon hit by the attack
   */
  protected applyOnTargetEffects(user: Pokemon, target: Pokemon, hitResult: HitResult, firstTarget: boolean): void {
    /** Does {@linkcode hitResult} indicate that damage was dealt to the target? */
    const dealsDamage = [
      HitResult.EFFECTIVE,
      HitResult.SUPER_EFFECTIVE,
      HitResult.NOT_VERY_EFFECTIVE,
      HitResult.ONE_HIT_KO,
    ].includes(hitResult);

    this.triggerMoveEffects(MoveEffectTrigger.POST_APPLY, user, target, firstTarget, false);
    this.applyHeldItemFlinchCheck(user, target, dealsDamage);
    this.applyOnGetHitAbEffects(user, target, hitResult);
    applyPostAttackAbAttrs(PostAttackAbAttr, user, target, this.move, hitResult);

    // We assume only enemy Pokemon are able to have the EnemyAttackStatusEffectChanceModifier from tokens
    if (!user.isPlayer() && this.move instanceof AttackMove) {
      globalScene.applyShuffledModifiers(EnemyAttackStatusEffectChanceModifier, false, target);
    }

    // Apply Grip Claw's chance to steal an item from the target
    if (this.move instanceof AttackMove) {
      globalScene.applyModifiers(ContactHeldItemTransferChanceModifier, this.player, user, target);
    }
  }
}
