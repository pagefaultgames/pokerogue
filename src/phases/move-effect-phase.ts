import { BattlerIndex } from "#app/battle";
import BattleScene from "#app/battle-scene";
import {
  AddSecondStrikeAbAttr,
  AlwaysHitAbAttr,
  applyPostAttackAbAttrs,
  applyPostDefendAbAttrs,
  applyPreAttackAbAttrs,
  IgnoreMoveEffectsAbAttr,
  MaxMultiHitAbAttr,
  PostAttackAbAttr,
  PostDefendAbAttr,
  TypeImmunityAbAttr,
} from "#app/data/ability";
import { ArenaTagSide, ConditionalProtectTag } from "#app/data/arena-tag";
import { MoveAnim } from "#app/data/battle-anims";
import {
  BattlerTagLapseType,
  DamageProtectedTag,
  ProtectedTag,
  SemiInvulnerableTag,
  SubstituteTag,
} from "#app/data/battler-tags";
import {
  applyFilteredMoveAttrs,
  applyMoveAttrs,
  AttackMove,
  DelayedAttackAttr,
  FixedDamageAttr,
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
  VariableTargetAttr,
} from "#app/data/move";
import { SpeciesFormChangePostMoveTrigger } from "#app/data/pokemon-forms";
import { Type } from "#app/data/type";
import Pokemon, { HitResult, MoveResult, PokemonMove } from "#app/field/pokemon";
import { getPokemonNameWithAffix } from "#app/messages";
import {
  ContactHeldItemTransferChanceModifier,
  EnemyAttackStatusEffectChanceModifier,
  FlinchChanceModifier,
  HitHealModifier,
  PokemonMultiHitModifier,
} from "#app/modifier/modifier";
import { PokemonPhase } from "#app/phases/pokemon-phase";
import { BooleanHolder, executeIf, NumberHolder } from "#app/utils";
import { BattlerTagType } from "#enums/battler-tag-type";
import { Moves } from "#enums/moves";
import i18next from "i18next";

export class MoveEffectPhase extends PokemonPhase {
  public move: PokemonMove;
  protected targets: BattlerIndex[];

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
  }

  public override start(): void {
    super.start();

    /** The Pokemon using this phase's invoked move */
    const user = this.getUserPokemon();
    /** All Pokemon targeted by this phase's invoked move */
    const targets = this.getTargets();

    if (!user) {
      return super.end();
    }

    const isDelayedAttack = this.move.getMove().hasAttr(DelayedAttackAttr);
    /** If the user was somehow removed from the field and it's not a delayed attack, end this phase */
    if (!user.isOnField() && !isDelayedAttack) {
      return super.end();
    }

    /**
     * Does an effect from this move override other effects on this turn?
     * e.g. Charging moves (Fly, etc.) on their first turn of use.
     */
    const overridden = new BooleanHolder(false);
    /** The {@linkcode Move} object from {@linkcode allMoves} invoked by this phase */
    const move = this.move.getMove();

    // Assume single target for override
    applyMoveAttrs(OverrideMoveEffectAttr, user, this.getFirstTarget() ?? null, move, overridden, this.move.virtual).then(() => {
      // If other effects were overriden, stop this phase before they can be applied
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
        // If Parental Bond is applicable, double the hit count
        applyPreAttackAbAttrs(AddSecondStrikeAbAttr, user, null, move, false, targets.length, hitCount, new NumberHolder(0));
        // If Multi-Lens is applicable, multiply the hit count by 1 + the number of Multi-Lenses held by the user
        if (move instanceof AttackMove && !move.hasAttr(FixedDamageAttr)) {
          this.scene.applyModifiers(PokemonMultiHitModifier, user.isPlayer(), user, hitCount, new NumberHolder(0));
        }
        // Set the user's relevant turnData fields to reflect the final hit count
        user.turnData.hitCount = hitCount.value;
        user.turnData.hitsLeft = hitCount.value;
      }

      /**
       * Log to be entered into the user's move history once the move result is resolved.
       * Note that `result` (a {@linkcode MoveResult}) logs whether the move was successfully
       * used in the sense of "Does it have an effect on the user?".
       */
      const moveHistoryEntry = { move: this.move.moveId, targets: this.targets, result: MoveResult.PENDING, virtual: this.move.virtual };

      /**
       * Stores results of hit checks of the invoked move against all targets, organized by battler index.
       * @see {@linkcode hitCheck}
       */
      const targetHitChecks = Object.fromEntries(targets.map(p => [ p.getBattlerIndex(), this.hitCheck(p) ]));
      const hasActiveTargets = targets.some(t => t.isActive(true));

      /** Check if the target is immune via ability to the attacking move, and NOT in semi invulnerable state */
      const isImmune = targets[0]?.hasAbilityWithAttr(TypeImmunityAbAttr)
        && (targets[0]?.getAbility()?.getAttrs(TypeImmunityAbAttr)?.[0]?.getImmuneType() === user.getMoveType(move))
        && !targets[0]?.getTag(SemiInvulnerableTag);

      /**
       * If no targets are left for the move to hit (FAIL), or the invoked move is single-target
       * (and not random target) and failed the hit check against its target (MISS), log the move
       * as FAILed or MISSed (depending on the conditions above) and end this phase.
       */
      if (!hasActiveTargets || (!move.hasAttr(VariableTargetAttr) && !move.isMultiTarget() && !targetHitChecks[this.targets[0]] && !targets[0].getTag(ProtectedTag) && !isImmune)) {
        this.stopMultiHit();
        if (hasActiveTargets) {
          this.scene.queueMessage(i18next.t("battle:attackMissed", { pokemonNameWithAffix: this.getFirstTarget() ? getPokemonNameWithAffix(this.getFirstTarget()!) : "" }));
          moveHistoryEntry.result = MoveResult.MISS;
          applyMoveAttrs(MissEffectAttr, user, null, this.move.getMove());
        } else {
          this.scene.queueMessage(i18next.t("battle:attackFailed"));
          moveHistoryEntry.result = MoveResult.FAIL;
        }
        user.pushMoveHistory(moveHistoryEntry);
        return this.end();
      }

      /** All move effect attributes are chained together in this array to be applied asynchronously. */
      const applyAttrs: Promise<void>[] = [];

      const playOnEmptyField = this.scene.currentBattle?.mysteryEncounter?.hasBattleAnimationsWithoutTargets ?? false;
      // Move animation only needs one target
      new MoveAnim(move.id as Moves, user, this.getFirstTarget()!.getBattlerIndex()!, playOnEmptyField).play(this.scene, move.hitsSubstitute(user, this.getFirstTarget()!), () => {
        /** Has the move successfully hit a target (for damage) yet? */
        let hasHit: boolean = false;
        for (const target of targets) {
          // Prevent ENEMY_SIDE targeted moves from occurring twice in double battles
          if (move.moveTarget === MoveTarget.ENEMY_SIDE && target !== targets[targets.length - 1]) {
            continue;
          }

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

          /** Is the pokemon immune due to an ablility, and also not in a semi invulnerable state?  */
          const isImmune = target.hasAbilityWithAttr(TypeImmunityAbAttr)
            && (target.getAbility()?.getAttrs(TypeImmunityAbAttr)?.[0]?.getImmuneType() === user.getMoveType(move))
            && !target.getTag(SemiInvulnerableTag);

          /** Is the target hidden by the effects of its Commander ability? */
          const isCommanding = this.scene.currentBattle.double && target.getAlly()?.getTag(BattlerTagType.COMMANDED)?.getSourcePokemon(this.scene) === target;

          /**
           * If the move missed a target, stop all future hits against that target
           * and move on to the next target (if there is one).
           */
          if (isCommanding || (!isImmune && !isProtected && !targetHitChecks[target.getBattlerIndex()])) {
            this.stopMultiHit(target);
            this.scene.queueMessage(i18next.t("battle:attackMissed", { pokemonNameWithAffix: getPokemonNameWithAffix(target) }));
            if (moveHistoryEntry.result === MoveResult.PENDING) {
              moveHistoryEntry.result = MoveResult.MISS;
            }
            user.pushMoveHistory(moveHistoryEntry);
            applyMoveAttrs(MissEffectAttr, user, null, move);
            continue;
          }

          /** Does this phase represent the invoked move's first strike? */
          const firstHit = (user.turnData.hitsLeft === user.turnData.hitCount);

          // Only log the move's result on the first strike
          if (firstHit) {
            user.pushMoveHistory(moveHistoryEntry);
          }

          /**
           * Since all fail/miss checks have applied, the move is considered successfully applied.
           * It's worth noting that if the move has no effect or is protected against, this assignment
           * is overwritten and the move is logged as a FAIL.
           */
          moveHistoryEntry.result = MoveResult.SUCCESS;

          /**
           * Stores the result of applying the invoked move to the target.
           * If the target is protected, the result is always `NO_EFFECT`.
           * Otherwise, the hit result is based on type effectiveness, immunities,
           * and other factors that may negate the attack or status application.
           *
           * Internally, the call to {@linkcode Pokemon.apply} is where damage is calculated
           * (for attack moves) and the target's HP is updated. However, this isn't
           * made visible to the user until the resulting {@linkcode DamagePhase}
           * is invoked.
           */
          const hitResult = !isProtected ? target.apply(user, move) : HitResult.NO_EFFECT;

          /** Does {@linkcode hitResult} indicate that damage was dealt to the target? */
          const dealsDamage = [
            HitResult.EFFECTIVE,
            HitResult.SUPER_EFFECTIVE,
            HitResult.NOT_VERY_EFFECTIVE,
            HitResult.ONE_HIT_KO
          ].includes(hitResult);

          /** Is this target the first one hit by the move on its current strike? */
          const firstTarget = dealsDamage && !hasHit;
          if (firstTarget) {
            hasHit = true;
          }

          /**
           * If the move has no effect on the target (i.e. the target is protected or immune),
           * change the logged move result to FAIL.
           */
          if (hitResult === HitResult.NO_EFFECT) {
            moveHistoryEntry.result = MoveResult.FAIL;
          }

          /** Does this phase represent the invoked move's last strike? */
          const lastHit = (user.turnData.hitsLeft === 1 || !this.getFirstTarget()?.isActive());

          /**
           * If the user can change forms by using the invoked move,
           * it only changes forms after the move's last hit
           * (see Relic Song's interaction with Parental Bond when used by Meloetta).
           */
          if (lastHit) {
            this.scene.triggerPokemonFormChange(user, SpeciesFormChangePostMoveTrigger);
          }

          /**
           * Create a Promise that applys *all* effects from the invoked move's MoveEffectAttrs.
           * These are ordered by trigger type (see {@linkcode MoveEffectTrigger}), and each trigger
           * type requires different conditions to be met with respect to the move's hit result.
           */
          const k = new Promise<void>((resolve) => {
            //Start promise chain and apply PRE_APPLY move attributes
            let promiseChain: Promise<void | null> = applyFilteredMoveAttrs((attr: MoveAttr) =>
              attr instanceof MoveEffectAttr
              && attr.trigger === MoveEffectTrigger.PRE_APPLY
              && (!attr.firstHitOnly || firstHit)
              && (!attr.lastHitOnly || lastHit)
              && hitResult !== HitResult.NO_EFFECT, user, target, move);

            /** Don't complete if the move failed */
            if (hitResult === HitResult.FAIL) {
              return resolve();
            }

            /** Apply Move/Ability Effects in correct order */
            promiseChain = promiseChain
              .then(this.applySelfTargetEffects(user, target, firstHit, lastHit));

            if (hitResult !== HitResult.NO_EFFECT) {
              promiseChain
                .then(this.applyPostApplyEffects(user, target, firstHit, lastHit))
                .then(this.applyHeldItemFlinchCheck(user, target, dealsDamage))
                .then(this.applySuccessfulAttackEffects(user, target, firstHit, lastHit, !!isProtected, hitResult, firstTarget))
                .then(() => resolve());
            } else {
              promiseChain
                .then(() => applyMoveAttrs(NoEffectAttr, user, null, move))
                .then(resolve);
            }
          });

          applyAttrs.push(k);
        }

        // Apply the move's POST_TARGET effects on the move's last hit, after all targeted effects have resolved
        const postTarget = (user.turnData.hitsLeft === 1 || !this.getFirstTarget()?.isActive()) ?
          applyFilteredMoveAttrs((attr: MoveAttr) => attr instanceof MoveEffectAttr && attr.trigger === MoveEffectTrigger.POST_TARGET, user, null, move) :
          null;

        if (postTarget) {
          if (applyAttrs.length) { // If there is a pending asynchronous move effect, do this after
            applyAttrs[applyAttrs.length - 1].then(() => postTarget);
          } else { // Otherwise, push a new asynchronous move effect
            applyAttrs.push(postTarget);
          }
        }

        // Wait for all move effects to finish applying, then end this phase
        Promise.allSettled(applyAttrs).then(() => {
          /**
           * Remove the target's substitute (if it exists and has expired)
           * after all targeted effects have applied.
           * This prevents blocked effects from applying until after this hit resolves.
           */
          targets.forEach(target => {
            const substitute = target.getTag(SubstituteTag);
            if (substitute && substitute.hp <= 0) {
              target.lapseTag(BattlerTagType.SUBSTITUTE);
            }
          });
          this.end();
        });
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
   * Apply self-targeted effects that trigger `POST_APPLY`
   *
   * @param user - The {@linkcode Pokemon} using this phase's invoked move
   * @param target - {@linkcode Pokemon} the current target of this phase's invoked move
   * @param firstHit - `true` if this is the first hit in a multi-hit attack
   * @param lastHit - `true` if this is the last hit in a multi-hit attack
   * @returns a function intended to be passed into a `then()` call.
   */
  protected applySelfTargetEffects(user: Pokemon, target: Pokemon, firstHit: boolean, lastHit: boolean): () => Promise<void | null> {
    return () => applyFilteredMoveAttrs((attr: MoveAttr) =>
      attr instanceof MoveEffectAttr
      && attr.trigger === MoveEffectTrigger.POST_APPLY
      && attr.selfTarget
      && (!attr.firstHitOnly || firstHit)
      && (!attr.lastHitOnly || lastHit), user, target, this.move.getMove());
  }

  /**
   * Applies non-self-targeted effects that trigger `POST_APPLY`
   * (i.e. Smelling Salts curing Paralysis, and the forced switch from U-Turn, Dragon Tail, etc)
   * @param user - The {@linkcode Pokemon} using this phase's invoked move
   * @param target - {@linkcode Pokemon} the current target of this phase's invoked move
   * @param firstHit - `true` if this is the first hit in a multi-hit attack
   * @param lastHit - `true` if this is the last hit in a multi-hit attack
   * @returns a function intended to be passed into a `then()` call.
   */
  protected applyPostApplyEffects(user: Pokemon, target: Pokemon, firstHit: boolean, lastHit: boolean): () => Promise<void | null> {
    return () => applyFilteredMoveAttrs((attr: MoveAttr) =>
      attr instanceof MoveEffectAttr
      && attr.trigger === MoveEffectTrigger.POST_APPLY
      && !attr.selfTarget
      && (!attr.firstHitOnly || firstHit)
      && (!attr.lastHitOnly || lastHit), user, target, this.move.getMove());
  }

  /**
   * Applies effects that trigger on HIT
   * (i.e. Final Gambit, Power-Up Punch, Drain Punch)
   * @param user - The {@linkcode Pokemon} using this phase's invoked move
   * @param target - {@linkcode Pokemon} the current target of this phase's invoked move
   * @param firstHit - `true` if this is the first hit in a multi-hit attack
   * @param lastHit - `true` if this is the last hit in a multi-hit attack
   * @param firstTarget - `true` if {@linkcode target} is the first target hit by this strike of {@linkcode move}
   * @returns a function intended to be passed into a `then()` call.
   */
  protected applyOnHitEffects(user: Pokemon, target: Pokemon, firstHit : boolean, lastHit: boolean, firstTarget: boolean): Promise<void> {
    return applyFilteredMoveAttrs((attr: MoveAttr) =>
      attr instanceof MoveEffectAttr
      && attr.trigger === MoveEffectTrigger.HIT
      && (!attr.firstHitOnly || firstHit)
      && (!attr.lastHitOnly || lastHit)
      && (!attr.firstTargetOnly || firstTarget), user, target, this.move.getMove());
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

          if (!this.move.getMove().hitsSubstitute(user, target)) {
            if (!user.isPlayer() && this.move.getMove() instanceof AttackMove) {
              user.scene.applyShuffledModifiers(this.scene, EnemyAttackStatusEffectChanceModifier, false, target);
            }

            target.lapseTags(BattlerTagLapseType.AFTER_HIT);
          }

        })
    );
  }

  /**
   * Applies all effects and attributes that require a move to connect with a target,
   * namely reactive effects like Weak Armor, on-hit effects like that of Power-Up Punch, and item stealing effects
   * @param user - The {@linkcode Pokemon} using this phase's invoked move
   * @param target - {@linkcode Pokemon} the current target of this phase's invoked move
   * @param firstHit - `true` if this is the first hit in a multi-hit attack
   * @param lastHit - `true` if this is the last hit in a multi-hit attack
   * @param isProtected - `true` if the target is protected by effects such as Protect
   * @param hitResult - The {@linkcode HitResult} of the attempted move
   * @param firstTarget - `true` if {@linkcode target} is the first target hit by this strike of {@linkcode move}
   * @returns a function intended to be passed into a `then()` call.
   */
  protected applySuccessfulAttackEffects(user: Pokemon, target: Pokemon, firstHit : boolean, lastHit: boolean, isProtected : boolean, hitResult: HitResult, firstTarget: boolean) : () => Promise<void | null> {
    return () => executeIf(!isProtected, () =>
      this.applyOnHitEffects(user, target, firstHit, lastHit, firstTarget).then(() =>
        this.applyOnGetHitAbEffects(user, target, hitResult)).then(() =>
        applyPostAttackAbAttrs(PostAttackAbAttr, user, target, this.move.getMove(), hitResult)).then(() => {  // Item Stealing Effects

        if (this.move.getMove() instanceof AttackMove) {
          this.scene.applyModifiers(ContactHeldItemTransferChanceModifier, this.player, user, target);
        }
      })
    );
  }

  /**
   * Handles checking for and applying Flinches
   * @param user - The {@linkcode Pokemon} using this phase's invoked move
   * @param target - {@linkcode Pokemon} the current target of this phase's invoked move
   * @param dealsDamage - `true` if the attempted move successfully dealt damage
   * @returns a function intended to be passed into a `then()` call.
   */
  protected applyHeldItemFlinchCheck(user: Pokemon, target: Pokemon, dealsDamage: boolean) : () => void {
    return () => {
      if (dealsDamage && !target.hasAbilityWithAttr(IgnoreMoveEffectsAbAttr) && !this.move.getMove().hitsSubstitute(user, target)) {
        const flinched = new BooleanHolder(false);
        user.scene.applyModifiers(FlinchChanceModifier, user.isPlayer(), user, flinched);
        if (flinched.value) {
          target.addTag(BattlerTagType.FLINCHED, undefined, this.move.moveId, user.id);
        }
      }
    };
  }

  /**
   * Resolves whether this phase's invoked move hits the given target
   * @param target - The {@linkcode Pokemon} targeted by the invoked move
   * @returns `true` if the move hits the target
   */
  public hitCheck(target: Pokemon): boolean {
    // Moves targeting the user and entry hazards can't miss
    if ([ MoveTarget.USER, MoveTarget.ENEMY_SIDE ].includes(this.move.getMove().moveTarget)) {
      return true;
    }

    const user = this.getUserPokemon();

    if (!user) {
      return false;
    }

    // Hit check only calculated on first hit for multi-hit moves unless flag is set to check all hits.
    // However, if an ability with the MaxMultiHitAbAttr, namely Skill Link, is present, act as a normal
    // multi-hit move and proceed with all hits
    if (user.turnData.hitsLeft < user.turnData.hitCount) {
      if (!this.move.getMove().hasFlag(MoveFlags.CHECK_ALL_HITS) || user.hasAbilityWithAttr(MaxMultiHitAbAttr)) {
        return true;
      }
    }

    if (user.hasAbilityWithAttr(AlwaysHitAbAttr) || target.hasAbilityWithAttr(AlwaysHitAbAttr)) {
      return true;
    }

    // If the user should ignore accuracy on a target, check who the user targeted last turn and see if they match
    if (user.getTag(BattlerTagType.IGNORE_ACCURACY) && (user.getLastXMoves().find(() => true)?.targets || []).indexOf(target.getBattlerIndex()) !== -1) {
      return true;
    }

    if (target.getTag(BattlerTagType.ALWAYS_GET_HIT)) {
      return true;
    }

    if (target.getTag(BattlerTagType.TELEKINESIS) && !target.getTag(SemiInvulnerableTag) && !this.move.getMove().hasAttr(OneHitKOAttr)) {
      return true;
    }

    const semiInvulnerableTag = target.getTag(SemiInvulnerableTag);
    if (semiInvulnerableTag
        && !this.move.getMove().getAttrs(HitsTagAttr).some(hta => hta.tagType === semiInvulnerableTag.tagType)
        && !(this.move.getMove().hasAttr(ToxicAccuracyAttr) && user.isOfType(Type.POISON))
    ) {
      return false;
    }

    const moveAccuracy = this.move.getMove().calculateBattleAccuracy(user, target);

    if (moveAccuracy === -1) {
      return true;
    }

    const accuracyMultiplier = user.getAccuracyMultiplier(target, this.move.getMove());
    const rand = user.randSeedInt(100);

    return rand < (moveAccuracy * accuracyMultiplier);
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

  /**
   * Removes the given {@linkcode Pokemon} from this phase's target list
   * @param target - The {@linkcode Pokemon} to be removed
   */
  protected removeTarget(target: Pokemon): void {
    const targetIndex = this.targets.findIndex(ind => ind === target.getBattlerIndex());
    if (targetIndex !== -1) {
      this.targets.splice(this.targets.findIndex(ind => ind === target.getBattlerIndex()), 1);
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
    if (!target || this.targets.length === 0 ) {
      user.turnData.hitCount = 1;
      user.turnData.hitsLeft = 1;
    }
  }

  /** @returns A new `MoveEffectPhase` with the same properties as this phase */
  protected getNewHitPhase(): MoveEffectPhase {
    return new MoveEffectPhase(this.scene, this.battlerIndex, this.targets, this.move);
  }
}
