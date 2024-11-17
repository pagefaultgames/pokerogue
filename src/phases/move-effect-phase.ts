import { BattlerIndex } from "#app/battle";
import BattleScene from "#app/battle-scene";
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
  PostDamageForceSwitchAbAttr,
  PostDefendAbAttr,
} from "#app/data/ability";
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
import {
  applyFilteredMoveAttrs,
  applyMoveAttrs,
  AttackMove,
  DelayedAttackAttr,
  FlinchAttr,
  HitsTagAttr,
  MissEffectAttr,
  MoveAttr,
  MoveCategory,
  MoveEffectAttr,
  MoveEffectTrigger,
  MoveFlags,
  MoveTarget,
  MultiHitAttr,
  NoEffectAttr,
  OneHitKOAttr,
  OverrideMoveEffectAttr,
  ToxicAccuracyAttr,
} from "#app/data/move";
import { SpeciesFormChangePostMoveTrigger } from "#app/data/pokemon-forms";
import { Type } from "#enums/type";
import Pokemon, { DamageResult, HitResult, MoveResult, PokemonMove, TurnMove } from "#app/field/pokemon";
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
import { BooleanHolder, executeIf, isNullOrUndefined, NumberHolder } from "#app/utils";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Moves } from "#enums/moves";
import i18next from "i18next";
import { TypeDamageMultiplier } from "#app/data/type";
import { DamageAchv } from "#app/system/achv";
import { FaintPhase } from "./faint-phase";

type HitCheckEntry = [ HitCheckResult, TypeDamageMultiplier ];

export class MoveEffectPhase extends PokemonPhase {
  public move: PokemonMove;
  protected targets: BattlerIndex[];

  private hitChecks: HitCheckEntry[];
  private moveHistoryEntry: TurnMove;

  /** MOVE EFFECT TRIGGER CONDITIONS */

  /** Is this the first strike of a move? */
  private firstHit: boolean;
  /** Is this the last strike of a move? */
  private lastHit: boolean;

  constructor(scene: BattleScene, battlerIndex: BattlerIndex, targets: BattlerIndex[], move: PokemonMove) {
    super(scene, battlerIndex);
    this.move = move;
    /**
     * In double battles, if the right Pokemon selects a spread move and the left Pokemon dies
     * with no party members available to switch in, then the right Pokemon takes the index
     * of the left Pokemon and gets hit unless this is checked.
     */
    if (targets.includes(battlerIndex) && this.move.getMove().moveTarget === MoveTarget.ALL_NEAR_OTHERS) {
      const i = targets.indexOf(battlerIndex);
      targets.splice(i, i + 1);
    }
    this.targets = targets;

    this.hitChecks = Array(this.targets.length).fill([ HitCheckResult.PENDING, 0 ]);
  }

  public override start() {
    super.start();

    /** The Pokemon using this phase's invoked move */
    const user = this.getUserPokemon();
    /** All Pokemon targeted by this phase's invoked move */
    const targets = this.getTargets();

    if (isNullOrUndefined(user)) {
      return super.end();
    }

    const isDelayedAttack = this.move.getMove().hasAttr(DelayedAttackAttr);
    /** If the user was somehow removed from the field and it's not a delayed attack, end this phase */
    if (!user.isOnField() && !isDelayedAttack) {
      return super.end();
    }

    /**
     * Does an effect from this move override other effects on this turn?
     * e.g. Metronome/Nature Power/etc. when queueing a generated move.
     */
    const overridden = new BooleanHolder(false);
    /** The {@linkcode Move} object from {@linkcode allMoves} invoked by this phase */
    const move = this.move.getMove();

    // This assumes single target for override
    applyMoveAttrs(OverrideMoveEffectAttr, user, this.getFirstTarget() ?? null, move, overridden, this.move.virtual);
    // If other effects were overridden, stop this phase before they can be applied
    if (overridden.value) {
      return this.end();
    }

    user.lapseTags(BattlerTagLapseType.MOVE_EFFECT);

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
      this.scene.applyModifiers(PokemonMultiHitModifier, user.isPlayer(), user, move.id, hitCount);
      // Set the user's relevant turnData fields to reflect the final hit count
      user.turnData.hitCount = hitCount.value;
      user.turnData.hitsLeft = hitCount.value;
    }

    this.moveHistoryEntry = { move: move.id, targets: this.targets, result: MoveResult.PENDING, virtual: this.move.virtual };

    targets.forEach((t, i) => this.hitChecks[i] = this.hitCheck(t));

    if (!targets.some(t => t.isActive(true))) {
      this.scene.queueMessage(i18next.t("battle:attackFailed"));
      this.moveHistoryEntry.result = MoveResult.FAIL;
    }

    if (this.hitChecks.some(hc => hc[0] === HitCheckResult.HIT)) {
      this.moveHistoryEntry.result = MoveResult.SUCCESS;
    } else {
      user.turnData.hitCount = 1;
      user.turnData.hitsLeft = 1;

      if (this.hitChecks.every(hc => hc[0] === HitCheckResult.MISS)) {
        this.moveHistoryEntry.result = MoveResult.MISS;
      } else {
        this.moveHistoryEntry.result = MoveResult.FAIL;
      }
    }

    this.firstHit = user.turnData.hitCount === user.turnData.hitsLeft;
    this.lastHit = user.turnData.hitsLeft === 1 || !targets.some(t => t.isActive(true));

    // If the move successfully hit at least 1 target, or the move has a
    // post-target effect, play the move's animation
    const tryPlayAnim = (this.moveHistoryEntry.result === MoveResult.SUCCESS || move.getAttrs(MoveEffectAttr).some(attr => attr.trigger === MoveEffectTrigger.POST_TARGET))
      ? this.playMoveAnim(user)
      : Promise.resolve();

    tryPlayAnim.then(() => {
      // If this phase represents the first strike of the given move,
      // log the move in the user's move history.
      if (this.firstHit) {
        user.pushMoveHistory(this.moveHistoryEntry);
      }

      const applyPromises: Promise<void>[] = [];

      for (const target of targets) {
        const [ hitCheckResult, effectiveness ] = this.hitChecks[targets.indexOf(target)];

        switch (hitCheckResult) {
          case HitCheckResult.HIT:
            applyPromises.push(this.applyMoveEffects(target, effectiveness));
            break;
          case HitCheckResult.NO_EFFECT:
            if (move.id === Moves.SHEER_COLD) {
              this.scene.queueMessage(i18next.t("battle:hitResultImmune", { pokemonName: getPokemonNameWithAffix(target) }));
            } else {
              this.scene.queueMessage(i18next.t("battle:hitResultNoEffect", { pokemonName: getPokemonNameWithAffix(target) }));
            }
          case HitCheckResult.PROTECTED:
          case HitCheckResult.NO_EFFECT_NO_MESSAGE:
            applyMoveAttrs(NoEffectAttr, user, target, move);
            break;
          case HitCheckResult.MISS:
            this.scene.queueMessage(i18next.t("battle:attackMissed", { pokemonNameWithAffix: this.getFirstTarget() ? getPokemonNameWithAffix(this.getFirstTarget()!) : "" }));
            applyMoveAttrs(MissEffectAttr, user, target, move);
            break;
          case HitCheckResult.PENDING:
          case HitCheckResult.ERROR:
            console.log(`Unexpected hit check result ${HitCheckResult[hitCheckResult]}. Aborting phase.`);
            return this.end();
        }
      }

      Promise.allSettled(applyPromises)
        .then(() => executeIf(this.lastHit, () => this.triggerMoveEffects(MoveEffectTrigger.POST_TARGET, user, null)))
        .then(() => {
          this.updateSubstitutes();
          this.end();
        });
    });
  }

  protected playMoveAnim(user: Pokemon): Promise<void> {
    return new Promise((resolve) => {
      const move = this.move.getMove();
      const firstTargetPokemon = this.getFirstTarget() ?? null;
      const playOnEmptyField = this.scene.currentBattle?.mysteryEncounter?.hasBattleAnimationsWithoutTargets ?? false;
      new MoveAnim(move.id, user, firstTargetPokemon!.getBattlerIndex(), playOnEmptyField)
        .play(this.scene, move.hitsSubstitute(user, firstTargetPokemon), () => resolve());
    });
  }

  protected applyMoveEffects(target: Pokemon, effectiveness: TypeDamageMultiplier): Promise<void> {
    const user = this.getUserPokemon();
    const move = this.move.getMove();

    const firstTarget = target === this.getTargets().find((_, i) => this.hitChecks[i][1] > 0);

    if (isNullOrUndefined(user)) {
      return Promise.resolve();
    }

    // prevent field-targeted moves from activating multiple times
    if (move.isFieldTarget() && target !== this.getTargets()[this.targets.length - 1]) {
      return Promise.resolve();
    }

    return this.triggerMoveEffects(MoveEffectTrigger.PRE_APPLY, user, target).then(() => {
      const hitResult = this.applyMove(target, effectiveness);

      return this.triggerMoveEffects(MoveEffectTrigger.POST_APPLY, user, target, firstTarget, true)
        .then(() => executeIf(!move.hitsSubstitute(user, target),
          () => this.applyOnTargetEffects(user, target, hitResult, firstTarget)))
        .then(() => {
          if (this.lastHit) {
            this.scene.triggerPokemonFormChange(user, SpeciesFormChangePostMoveTrigger);
          }
        });
    });
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
        // Only apply the next phase to previously hit targets
        this.targets = this.targets.filter((_, i) => this.hitChecks[i][0] === HitCheckResult.HIT);
        this.scene.unshiftPhase(this.getNewHitPhase());
      } else {
        // Queue message for number of hits made by multi-move
        // If multi-hit attack only hits once, still want to render a message
        const hitsTotal = user.turnData.hitCount - Math.max(user.turnData.hitsLeft, 0);
        if (hitsTotal > 1 || (user.turnData.hitsLeft && user.turnData.hitsLeft > 0)) {
          // If there are multiple hits, or if there are hits of the multi-hit move left
          this.scene.queueMessage(i18next.t("battle:attackHitsCount", { count: hitsTotal }));
        }
        this.scene.applyModifiers(HitHealModifier, this.player, user);
        // Clear all cached move effectiveness values among targets
        this.getTargets().forEach((target) => target.turnData.moveEffectiveness = null);
      }
    }

    super.end();
  }

  /**
   * Triggers move effects of the given move effect trigger.
   * @param triggerType The {@linkcode MoveEffectTrigger} being applied
   * @param user The {@linkcode Pokemon} using the move
   * @param target The {@linkcode Pokemon} targeted by the move
   * @param firstTarget Whether the target is the first to be hit by the current strike
   * @param selfTarget If defined, limits the effects triggered to either self-targeted
   * effects (if set to `true`) or targeted effects (if set to `false`).
   * @returns a `Promise` applying the relevant move effects.
   */
  protected triggerMoveEffects(triggerType: MoveEffectTrigger, user: Pokemon, target: Pokemon | null, firstTarget?: boolean | null, selfTarget?: boolean): Promise<void> {
    return applyFilteredMoveAttrs((attr: MoveAttr) =>
      attr instanceof MoveEffectAttr
      && attr.trigger === triggerType
      && (isNullOrUndefined(selfTarget) || (attr.selfTarget === selfTarget))
      && (!attr.firstHitOnly || this.firstHit)
      && (!attr.lastHitOnly || this.lastHit)
      && (!attr.firstTargetOnly || (firstTarget ?? true)),
    user, target, this.move.getMove());
  }

  /**
   * Apply the results of this phase's move to the given target
   * @param target The {@linkcode Pokemon} struck by the move
   */
  protected applyMove(target: Pokemon, effectiveness: TypeDamageMultiplier): HitResult {
    /** The {@linkcode Pokemon} using the move */
    const user = this.getUserPokemon()!;

    /** The {@linkcode Move} being used */
    const move = this.move.getMove();
    const moveCategory = user.getMoveCategory(target, move);

    if (moveCategory === MoveCategory.STATUS) {
      return HitResult.STATUS;
    }

    const isCritical = target.getCriticalHitResult(user, move, false);

    const { result: result, damage: dmg } = target.getAttackDamage(user, move, false, false, isCritical, false, effectiveness);

    const typeBoost = user.findTag(t => t instanceof TypeBoostTag && t.boostedType === user.getMoveType(move)) as TypeBoostTag;
    if (typeBoost?.oneUse) {
      user.removeTag(typeBoost.tagType);
    }

    // In case of fatal damage, this tag would have gotten cleared before we could lapse it.
    const destinyTag = target.getTag(BattlerTagType.DESTINY_BOND);
    const grudgeTag = target.getTag(BattlerTagType.GRUDGE);

    const isOneHitKo = result === HitResult.ONE_HIT_KO;

    if (dmg) {
      target.lapseTags(BattlerTagLapseType.HIT);

      const substitute = target.getTag(SubstituteTag);
      const isBlockedBySubstitute = !!substitute && move.hitsSubstitute(user, target);
      if (isBlockedBySubstitute) {
        substitute.hp -= dmg;
      }
      if (!target.isPlayer() && dmg >= target.hp) {
        this.scene.applyModifiers(EnemyEndureChanceModifier, false, target);
      }

      /**
       * We explicitly require to ignore the faint phase here, as we want to show the messages
       * about the critical hit and the super effective/not very effective messages before the faint phase.
       */
      const damage = target.damageAndUpdate(isBlockedBySubstitute ? 0 : dmg, result as DamageResult, isCritical, isOneHitKo, isOneHitKo, true, user);

      if (damage > 0) {
        if (user.isPlayer()) {
          this.scene.validateAchvs(DamageAchv, new NumberHolder(damage));
          if (damage > this.scene.gameData.gameStats.highestDamage) {
            this.scene.gameData.gameStats.highestDamage = damage;
          }
        }
        user.turnData.totalDamageDealt += damage;
        user.turnData.singleHitDamageDealt = damage;
        target.turnData.damageTaken += damage;
        target.battleData.hitCount++;

        // Multi-Lens and Parental Bond check for Wimp Out/Emergency Exit
        if (target.hasAbilityWithAttr(PostDamageForceSwitchAbAttr)) {
          const multiHitModifier = user.getHeldItems().find(m => m instanceof PokemonMultiHitModifier);
          if (multiHitModifier || user.hasAbilityWithAttr(AddSecondStrikeAbAttr)) {
            applyPostDamageAbAttrs(PostDamageAbAttr, target, damage, target.hasPassive(), false, [], user);
          }
        }

        const attackResult = { move: move.id, result: result as DamageResult, damage: damage, critical: isCritical, sourceId: user.id, sourceBattlerIndex: user.getBattlerIndex() };
        target.turnData.attacksReceived.unshift(attackResult);
        if (user.isPlayer() && !target.isPlayer()) {
          this.scene.applyModifiers(DamageMoneyRewardModifier, true, user, new NumberHolder(damage));
        }
      }
    }

    if (isCritical) {
      this.scene.queueMessage(i18next.t("battle:hitResultCriticalHit"));
    }

    // want to include is.Fainted() in case multi hit move ends early, still want to render message
    if (user.turnData.hitsLeft === 1 || target.isFainted()) {
      switch (result) {
        case HitResult.SUPER_EFFECTIVE:
          this.scene.queueMessage(i18next.t("battle:hitResultSuperEffective"));
          break;
        case HitResult.NOT_VERY_EFFECTIVE:
          this.scene.queueMessage(i18next.t("battle:hitResultNotVeryEffective"));
          break;
        case HitResult.ONE_HIT_KO:
          this.scene.queueMessage(i18next.t("battle:hitResultOneHitKO"));
          break;
      }
    }

    if (target.isFainted()) {
      // set splice index here, so future scene queues happen before FaintedPhase
      this.scene.setPhaseQueueSplice();
      this.scene.unshiftPhase(new FaintPhase(this.scene, target.getBattlerIndex(), isOneHitKo, destinyTag, grudgeTag, user));

      target.destroySubstitute();
      target.lapseTag(BattlerTagType.COMMANDED);
      target.resetSummonData();
    }

    return result;
  }

  protected applyOnTargetEffects(user: Pokemon, target: Pokemon, hitResult: HitResult, firstTarget: boolean): Promise<void | null> {
    const move = this.move.getMove();

    /** Does {@linkcode hitResult} indicate that damage was dealt to the target? */
    const dealsDamage = [
      HitResult.EFFECTIVE,
      HitResult.SUPER_EFFECTIVE,
      HitResult.NOT_VERY_EFFECTIVE,
      HitResult.ONE_HIT_KO
    ].includes(hitResult);

    return this.triggerMoveEffects(MoveEffectTrigger.POST_APPLY, user, target, firstTarget, false)
      .then(() => this.applyHeldItemFlinchCheck(user, target, dealsDamage))
      .then(() => this.applyOnGetHitAbEffects(user, target, hitResult))
      .then(() => applyPostAttackAbAttrs(PostAttackAbAttr, user, target, move, hitResult))
      .then(() => {
        if (move instanceof AttackMove) {
          this.scene.applyModifiers(ContactHeldItemTransferChanceModifier, this.player, user, target);
        }
      });
  }


  /**
   * Applies reactive effects that occur when a Pokémon is hit.
   * (i.e. Effect Spore, Disguise, Liquid Ooze, Beak Blast)
   * @param user - The {@linkcode Pokemon} using this phase's invoked move
   * @param target - {@linkcode Pokemon} the current target of this phase's invoked move
   * @param hitResult - The {@linkcode HitResult} of the attempted move
   * @returns a `Promise` intended to be passed into a `then()` call.
   */
  protected applyOnGetHitAbEffects(user: Pokemon, target: Pokemon, hitResult: HitResult): Promise<void | null> {
    return executeIf(!target.isFainted() || target.canApplyAbility(), () =>
      applyPostDefendAbAttrs(PostDefendAbAttr, target, user, this.move.getMove(), hitResult)
        .then(() => {
          if (!user.isPlayer() && this.move.getMove() instanceof AttackMove) {
            user.scene.applyShuffledModifiers(this.scene, EnemyAttackStatusEffectChanceModifier, false, target);
          }

          target.lapseTags(BattlerTagLapseType.AFTER_HIT);
        })
    );
  }

  /**
   * Handles checking for and applying flinches from held items (i.e. King's Rock)
   * @param user - The {@linkcode Pokemon} using this phase's invoked move
   * @param target - {@linkcode Pokemon} the current target of this phase's invoked move
   * @param dealsDamage - `true` if the attempted move successfully dealt damage
   * @returns a function intended to be passed into a `then()` call.
   */
  protected applyHeldItemFlinchCheck(user: Pokemon, target: Pokemon, dealsDamage: boolean) : void {
    if (this.move.getMove().hasAttr(FlinchAttr)) {
      return;
    }

    if (dealsDamage && !target.hasAbilityWithAttr(IgnoreMoveEffectsAbAttr) && !this.move.getMove().hitsSubstitute(user, target)) {
      const flinched = new BooleanHolder(false);
      user.scene.applyModifiers(FlinchChanceModifier, user.isPlayer(), user, flinched);
      if (flinched.value) {
        target.addTag(BattlerTagType.FLINCHED, undefined, this.move.moveId, user.id);
      }
    }
  }

  /**
   * Resolves whether this phase's invoked move hits the given target
   * @param target - The {@linkcode Pokemon} targeted by the invoked move
   * @returns A {@linkcode HitCheckEntry} which specifies the move's outcome and
   * effectiveness (if applicable)
   */
  public hitCheck(target: Pokemon): HitCheckEntry {
    const user = this.getUserPokemon();
    const move = this.move.getMove();

    if (isNullOrUndefined(user)) {
      return [ HitCheckResult.ERROR, 0 ];
    }

    // Moves targeting the user or field bypass accuracy and effectiveness checks
    if (move.moveTarget === MoveTarget.USER || move.isFieldTarget()) {
      return [ HitCheckResult.HIT, 1 ];
    }

    // If the target is somehow not on the field, cancel the hit check silently
    if (!target.isActive(true)) {
      return [ HitCheckResult.NO_EFFECT_NO_MESSAGE, 0 ];
    }

    /** Is the target hidden by the effects of its Commander ability? */
    const isCommanding = this.scene.currentBattle.double && target.getAlly()?.getTag(BattlerTagType.COMMANDED)?.getSourcePokemon(this.scene) === target;
    if (isCommanding) {
      return [ HitCheckResult.MISS, 0 ];
    }

    /** Is there an effect that causes the move to bypass accuracy checks, including semi-invulnerability? */
    const alwaysHit = [ user, target ].some(p => p.hasAbilityWithAttr(AlwaysHitAbAttr))
      || (user.getTag(BattlerTagType.IGNORE_ACCURACY) && (user.getLastXMoves().find(() => true)?.targets || []).indexOf(target.getBattlerIndex()) !== -1)
      || !!target.getTag(BattlerTagType.ALWAYS_GET_HIT);

    const semiInvulnerableTag = target.getTag(SemiInvulnerableTag);
    /** Should the move miss due to the target's semi-invulnerability? */
    const targetIsSemiInvulnerable = !!semiInvulnerableTag
      && !this.move.getMove().getAttrs(HitsTagAttr).some(hta => hta.tagType === semiInvulnerableTag.tagType)
      && !(this.move.getMove().hasAttr(ToxicAccuracyAttr) && user.isOfType(Type.POISON));

    if (targetIsSemiInvulnerable && !alwaysHit) {
      return [ HitCheckResult.MISS, 0 ];
    }

    // Check if the target is protected by any effect
    /** The {@linkcode ArenaTagSide} to which the target belongs */
    const targetSide = target.isPlayer() ? ArenaTagSide.PLAYER : ArenaTagSide.ENEMY;
    /** Has the invoked move been cancelled by conditional protection (e.g Quick Guard)? */
    const hasConditionalProtectApplied = new BooleanHolder(false);
    /** Does the applied conditional protection bypass Protect-ignoring effects? */
    const bypassIgnoreProtect = new BooleanHolder(false);
    /** If the move is not targeting a Pokemon on the user's side, try to apply conditional protection effects */
    if (!this.move.getMove().isAllyTarget()) {
      this.scene.arena.applyTagsForSide(ConditionalProtectTag, targetSide, false, hasConditionalProtectApplied, user, target, move.id, bypassIgnoreProtect);
    }

    /** Is the target protected by Protect, etc. or a relevant conditional protection effect? */
    const isProtected = (
      bypassIgnoreProtect.value
      || !this.move.getMove().checkFlag(MoveFlags.IGNORE_PROTECT, user, target))
      && (hasConditionalProtectApplied.value
        || (!target.findTags(t => t instanceof DamageProtectedTag).length
          && target.findTags(t => t instanceof ProtectedTag).find(t => target.lapseTag(t.tagType)))
        || (this.move.getMove().category !== MoveCategory.STATUS
          && target.findTags(t => t instanceof DamageProtectedTag).find(t => target.lapseTag(t.tagType))));

    if (isProtected) {
      return [ HitCheckResult.PROTECTED, 0 ];
    }

    const cancelNoEffectMessage = new BooleanHolder(false);
    const effectiveness = target.getMoveEffectiveness(user, move, false, false, cancelNoEffectMessage);
    if (effectiveness === 0) {
      return cancelNoEffectMessage.value
        ? [ HitCheckResult.NO_EFFECT_NO_MESSAGE, effectiveness ]
        : [ HitCheckResult.NO_EFFECT, effectiveness ];
    }

    // Strikes after the first in a multi-strike move are guaranteed to hit,
    // unless the move is flagged to check all hits and the user does not have Skill Link.
    if (user.turnData.hitsLeft < user.turnData.hitCount) {
      if (!move.hasFlag(MoveFlags.CHECK_ALL_HITS) || user.hasAbilityWithAttr(MaxMultiHitAbAttr)) {
        return [ HitCheckResult.HIT, effectiveness ];
      }
    }

    if (alwaysHit || (target.getTag(BattlerTagType.TELEKINESIS) && !move.hasAttr(OneHitKOAttr))) {
      return [ HitCheckResult.HIT, effectiveness ];
    }

    const moveAccuracy = move.calculateBattleAccuracy(user, target);

    if (moveAccuracy === -1) {
      return [ HitCheckResult.HIT, effectiveness ];
    }

    const accuracyMultiplier = user.getAccuracyMultiplier(target, move);
    const rand = user.randSeedInt(100);

    if (rand < (moveAccuracy * accuracyMultiplier)) {
      return [ HitCheckResult.HIT, effectiveness ];
    } else {
      return [ HitCheckResult.MISS, 0 ];
    }
  }

  protected updateSubstitutes(): void {
    const targets = this.getTargets();
    targets.forEach(target => {
      const substitute = target.getTag(SubstituteTag);
      if (substitute && substitute.hp <= 0) {
        target.lapseTag(BattlerTagType.SUBSTITUTE);
      }
    });
  }

  /** @returns The {@linkcode Pokemon} using this phase's invoked move */
  public getUserPokemon(): Pokemon | null {
    if (this.battlerIndex > BattlerIndex.ENEMY_2) {
      return this.scene.getPokemonById(this.battlerIndex);
    }
    return (this.player ? this.scene.getPlayerField() : this.scene.getEnemyField())[this.fieldIndex];
  }

  /** @returns An array of all {@linkcode Pokemon} targeted by this phase's invoked move */
  public getTargets(): Pokemon[] {
    return this.scene.getField(true).filter(p => this.targets.indexOf(p.getBattlerIndex()) > -1);
  }

  /** @returns The first target of this phase's invoked move */
  public getFirstTarget(): Pokemon | undefined {
    return this.getTargets()[0];
  }

  /** @returns A new `MoveEffectPhase` with the same properties as this phase */
  protected getNewHitPhase(): MoveEffectPhase {
    return new MoveEffectPhase(this.scene, this.battlerIndex, this.targets, this.move);
  }
}

/** Descriptor */
export enum HitCheckResult {
  /** Hit checks haven't been evaluated yet in this pass */
  PENDING,
  /** The move hits the target successfully */
  HIT,
  /** The move has no effect on the target */
  NO_EFFECT,
  /** The move has no effect on the target, but doesn't proc the default "no effect" message. */
  NO_EFFECT_NO_MESSAGE,
  /** The target protected itself against the move */
  PROTECTED,
  /** The move missed the target */
  MISS,
  /** The move failed unexpectedly */
  ERROR
}
