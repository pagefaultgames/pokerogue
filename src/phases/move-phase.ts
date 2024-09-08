import BattleScene from "#app/battle-scene.js";
import { BattlerIndex } from "#app/battle.js";
import { applyAbAttrs, applyPostMoveUsedAbAttrs, applyPreAttackAbAttrs, BlockRedirectAbAttr, IncreasePpAbAttr, PokemonTypeChangeAbAttr, PostMoveUsedAbAttr, RedirectMoveAbAttr } from "#app/data/ability.js";
import { CommonAnim } from "#app/data/battle-anims.js";
import { BattlerTagLapseType, CenterOfAttentionTag } from "#app/data/battler-tags.js";
import { allMoves, applyMoveAttrs, BypassRedirectAttr, BypassSleepAttr, ChargeAttr, CopyMoveAttr, HealStatusEffectAttr, MoveFlags, PreMoveMessageAttr } from "#app/data/move.js";
import { SpeciesFormChangePreMoveTrigger } from "#app/data/pokemon-forms.js";
import { getStatusEffectActivationText, getStatusEffectHealText } from "#app/data/status-effect.js";
import { Type } from "#app/data/type.js";
import { getTerrainBlockMessage } from "#app/data/weather.js";
import { Abilities } from "#app/enums/abilities.js";
import { BattlerTagType } from "#app/enums/battler-tag-type.js";
import { Moves } from "#app/enums/moves.js";
import { StatusEffect } from "#app/enums/status-effect.js";
import { MoveUsedEvent } from "#app/events/battle-scene.js";
import Pokemon, { MoveResult, PokemonMove, TurnMove } from "#app/field/pokemon.js";
import { getPokemonNameWithAffix } from "#app/messages.js";
import * as Utils from "#app/utils.js";
import i18next from "i18next";
import { BattlePhase } from "./battle-phase";
import { CommonAnimPhase } from "./common-anim-phase";
import { MoveEffectPhase } from "./move-effect-phase";
import { MoveEndPhase } from "./move-end-phase";
import { ShowAbilityPhase } from "./show-ability-phase";

export class MovePhase extends BattlePhase {
  public pokemon: Pokemon;
  public move: PokemonMove;
  public targets: BattlerIndex[];
  protected followUp: boolean;
  protected ignorePp: boolean;
  protected failed: boolean;
  protected cancelled: boolean;

  constructor(scene: BattleScene, pokemon: Pokemon, targets: BattlerIndex[], move: PokemonMove, followUp?: boolean, ignorePp?: boolean) {
    super(scene);

    this.pokemon = pokemon;
    this.targets = targets;
    this.move = move;
    this.followUp = followUp ?? false;
    this.ignorePp = ignorePp ?? false;
    this.failed = false;
    this.cancelled = false;
  }

  canMove(ignoreDisableTags?: boolean): boolean {
    return this.pokemon.isActive(true) && this.move.isUsable(this.pokemon, this.ignorePp, ignoreDisableTags) && !!this.targets.length;
  }

  /**Signifies the current move should fail but still use PP */
  fail(): void {
    this.failed = true;
  }

  /**Signifies the current move should cancel and retain PP */
  cancel(): void {
    this.cancelled = true;
  }

  start() {
    super.start();

    console.log(Moves[this.move.moveId]);

    if (!this.canMove(true)) {
      if (this.pokemon.isActive(true) && this.move.ppUsed >= this.move.getMovePp()) { // if the move PP was reduced from Spite or otherwise, the move fails
        this.fail();
        this.showMoveText();
        this.showFailedText();
      }
      return this.end();
    }

    if (!this.followUp) {
      if (this.move.getMove().checkFlag(MoveFlags.IGNORE_ABILITIES, this.pokemon, null)) {
        this.scene.arena.setIgnoreAbilities();
      }
    } else {
      this.pokemon.turnData.hitsLeft = 0; // TODO: is `0` correct?
      this.pokemon.turnData.hitCount = 0; // TODO: is `0` correct?
    }

    // Move redirection abilities (ie. Storm Drain) only support single target moves
    const moveTarget = this.targets.length === 1
      ? new Utils.IntegerHolder(this.targets[0])
      : null;
    if (moveTarget) {
      const oldTarget = moveTarget.value;
      this.scene.getField(true).filter(p => p !== this.pokemon).forEach(p => applyAbAttrs(RedirectMoveAbAttr, p, null, false, this.move.moveId, moveTarget));
      this.pokemon.getOpponents().forEach(p => {
        const redirectTag = p.getTag(CenterOfAttentionTag) as CenterOfAttentionTag;
        if (redirectTag && (!redirectTag.powder || (!this.pokemon.isOfType(Type.GRASS) && !this.pokemon.hasAbility(Abilities.OVERCOAT)))) {
          moveTarget.value = p.getBattlerIndex();
        }
      });
      //Check if this move is immune to being redirected, and restore its target to the intended target if it is.
      if ((this.pokemon.hasAbilityWithAttr(BlockRedirectAbAttr) || this.move.getMove().hasAttr(BypassRedirectAttr))) {
        //If an ability prevented this move from being redirected, display its ability pop up.
        if ((this.pokemon.hasAbilityWithAttr(BlockRedirectAbAttr) && !this.move.getMove().hasAttr(BypassRedirectAttr)) && oldTarget !== moveTarget.value) {
          this.scene.unshiftPhase(new ShowAbilityPhase(this.scene, this.pokemon.getBattlerIndex(), this.pokemon.getPassiveAbility().hasAttr(BlockRedirectAbAttr)));
        }
        moveTarget.value = oldTarget;
      }
      this.targets[0] = moveTarget.value;
    }

    // Check for counterattack moves to switch target
    if (this.targets.length === 1 && this.targets[0] === BattlerIndex.ATTACKER) {
      if (this.pokemon.turnData.attacksReceived.length) {
        const attack = this.pokemon.turnData.attacksReceived[0];
        this.targets[0] = attack.sourceBattlerIndex;

        // account for metal burst and comeuppance hitting remaining targets in double battles
        // counterattack will redirect to remaining ally if original attacker faints
        if (this.scene.currentBattle.double && this.move.getMove().hasFlag(MoveFlags.REDIRECT_COUNTER)) {
          if (this.scene.getField()[this.targets[0]].hp === 0) {
            const opposingField = this.pokemon.isPlayer() ? this.scene.getEnemyField() : this.scene.getPlayerField();
            //@ts-ignore
            this.targets[0] = opposingField.find(p => p.hp > 0)?.getBattlerIndex(); //TODO: fix ts-ignore
          }
        }
      }
      if (this.targets[0] === BattlerIndex.ATTACKER) {
        this.fail(); // Marks the move as failed for later in doMove
        this.showMoveText();
        this.showFailedText();
      }
    }

    const targets = this.scene.getField(true).filter(p => {
      if (this.targets.indexOf(p.getBattlerIndex()) > -1) {
        return true;
      }
      return false;
    });

    const doMove = () => {
      this.pokemon.turnData.acted = true; // Record that the move was attempted, even if it fails

      this.pokemon.lapseTags(BattlerTagLapseType.PRE_MOVE);

      let ppUsed = 1;
      // Filter all opponents to include only those this move is targeting
      const targetedOpponents = this.pokemon.getOpponents().filter(o => this.targets.includes(o.getBattlerIndex()));
      for (const opponent of targetedOpponents) {
        if (this.move.ppUsed + ppUsed >= this.move.getMovePp()) { // If we're already at max PP usage, stop checking
          break;
        }
        if (opponent.hasAbilityWithAttr(IncreasePpAbAttr)) { // Accounting for abilities like Pressure
          ppUsed++;
        }
      }

      if (!this.followUp && this.canMove() && !this.cancelled) {
        this.pokemon.lapseTags(BattlerTagLapseType.MOVE);
      }

      const moveQueue = this.pokemon.getMoveQueue();
      if (this.cancelled || this.failed) {
        if (this.failed) {
          this.move.usePp(ppUsed); // Only use PP if the move failed
          this.scene.eventTarget.dispatchEvent(new MoveUsedEvent(this.pokemon?.id, this.move.getMove(), this.move.ppUsed));
        }

        // Record a failed move so Abilities like Truant don't trigger next turn and soft-lock
        this.pokemon.pushMoveHistory({ move: Moves.NONE, result: MoveResult.FAIL });

        this.pokemon.lapseTags(BattlerTagLapseType.MOVE_EFFECT); // Remove any tags from moves like Fly/Dive/etc.
        moveQueue.shift(); // Remove the second turn of charge moves
        return this.end();
      }

      this.scene.triggerPokemonFormChange(this.pokemon, SpeciesFormChangePreMoveTrigger);

      if (this.move.moveId) {
        this.showMoveText();
      }

      // This should only happen when there are no valid targets left on the field
      if ((moveQueue.length && moveQueue[0].move === Moves.NONE) || !targets.length) {
        this.showFailedText();
        this.cancel();

        // Record a failed move so Abilities like Truant don't trigger next turn and soft-lock
        this.pokemon.pushMoveHistory({ move: Moves.NONE, result: MoveResult.FAIL });

        this.pokemon.lapseTags(BattlerTagLapseType.MOVE_EFFECT); // Remove any tags from moves like Fly/Dive/etc.

        moveQueue.shift();
        return this.end();
      }

      if ((!moveQueue.length || !moveQueue.shift()?.ignorePP) && !this.ignorePp) { // using .shift here clears out two turn moves once they've been used
        this.move.usePp(ppUsed);
        this.scene.eventTarget.dispatchEvent(new MoveUsedEvent(this.pokemon?.id, this.move.getMove(), this.move.ppUsed));
      }

      if (!allMoves[this.move.moveId].hasAttr(CopyMoveAttr)) {
        this.scene.currentBattle.lastMove = this.move.moveId;
      }

      // Assume conditions affecting targets only apply to moves with a single target
      let success = this.move.getMove().applyConditions(this.pokemon, targets[0], this.move.getMove());
      const cancelled = new Utils.BooleanHolder(false);
      let failedText = this.move.getMove().getFailedText(this.pokemon, targets[0], this.move.getMove(), cancelled);
      if (success && this.scene.arena.isMoveWeatherCancelled(this.pokemon, this.move.getMove())) {
        success = false;
      } else if (success && this.scene.arena.isMoveTerrainCancelled(this.pokemon, this.targets, this.move.getMove())) {
        success = false;
        if (failedText === null) {
          failedText = getTerrainBlockMessage(targets[0], this.scene.arena.terrain?.terrainType!); // TODO: is this bang correct?
        }
      }

      /**
         * Trigger pokemon type change before playing the move animation
         * Will still change the user's type when using Roar, Whirlwind, Trick-or-Treat, and Forest's Curse,
         * regardless of whether the move successfully executes or not.
         */
      if (success || [Moves.ROAR, Moves.WHIRLWIND, Moves.TRICK_OR_TREAT, Moves.FORESTS_CURSE].includes(this.move.moveId)) {
        applyPreAttackAbAttrs(PokemonTypeChangeAbAttr, this.pokemon, null, this.move.getMove());
      }

      if (success) {
        this.scene.unshiftPhase(this.getEffectPhase());
      } else {
        this.pokemon.pushMoveHistory({ move: this.move.moveId, targets: this.targets, result: MoveResult.FAIL, virtual: this.move.virtual });
        if (!cancelled.value) {
          this.showFailedText(failedText);
        }
      }
      // Checks if Dancer ability is triggered
      if (this.move.getMove().hasFlag(MoveFlags.DANCE_MOVE) && !this.followUp) {
        // Pokemon with Dancer can be on either side of the battle so we check in both cases
        this.scene.getPlayerField().forEach(pokemon => {
          applyPostMoveUsedAbAttrs(PostMoveUsedAbAttr, pokemon, this.move, this.pokemon, this.targets);
        });
        this.scene.getEnemyField().forEach(pokemon => {
          applyPostMoveUsedAbAttrs(PostMoveUsedAbAttr, pokemon, this.move, this.pokemon, this.targets);
        });
      }
      this.end();
    };

    if (!this.followUp && this.pokemon.status && !this.pokemon.status.isPostTurn()) {
      this.pokemon.status.incrementTurn();
      let activated = false;
      let healed = false;

      switch (this.pokemon.status.effect) {
      case StatusEffect.PARALYSIS:
        if (!this.pokemon.randSeedInt(4)) {
          activated = true;
          this.cancelled = true;
        }
        break;
      case StatusEffect.SLEEP:
        applyMoveAttrs(BypassSleepAttr, this.pokemon, null, this.move.getMove());
        healed = this.pokemon.status.turnCount === this.pokemon.status.cureTurn;
        activated = !healed && !this.pokemon.getTag(BattlerTagType.BYPASS_SLEEP);
        this.cancelled = activated;
        break;
      case StatusEffect.FREEZE:
        healed = !!this.move.getMove().findAttr(attr => attr instanceof HealStatusEffectAttr && attr.selfTarget && attr.isOfEffect(StatusEffect.FREEZE)) || !this.pokemon.randSeedInt(5);
        activated = !healed;
        this.cancelled = activated;
        break;
      }

      if (activated) {
        this.scene.queueMessage(getStatusEffectActivationText(this.pokemon.status.effect, getPokemonNameWithAffix(this.pokemon)));
        this.scene.unshiftPhase(new CommonAnimPhase(this.scene, this.pokemon.getBattlerIndex(), undefined, CommonAnim.POISON + (this.pokemon.status.effect - 1)));
        doMove();
      } else {
        if (healed) {
          this.scene.queueMessage(getStatusEffectHealText(this.pokemon.status.effect, getPokemonNameWithAffix(this.pokemon)));
          this.pokemon.resetStatus();
          this.pokemon.updateInfo();
        }
        doMove();
      }
    } else {
      doMove();
    }
  }

  getEffectPhase(): MoveEffectPhase {
    return new MoveEffectPhase(this.scene, this.pokemon.getBattlerIndex(), this.targets, this.move);
  }

  showMoveText(): void {
    if (this.move.getMove().hasAttr(ChargeAttr)) {
      const lastMove = this.pokemon.getLastXMoves() as TurnMove[];
      if (!lastMove.length || lastMove[0].move !== this.move.getMove().id || lastMove[0].result !== MoveResult.OTHER) {
        this.scene.queueMessage(i18next.t("battle:useMove", {
          pokemonNameWithAffix: getPokemonNameWithAffix(this.pokemon),
          moveName: this.move.getName()
        }), 500);
        return;
      }
    }

    if (this.pokemon.getTag(BattlerTagType.RECHARGING || BattlerTagType.INTERRUPTED)) {
      return;
    }

    this.scene.queueMessage(i18next.t("battle:useMove", {
      pokemonNameWithAffix: getPokemonNameWithAffix(this.pokemon),
      moveName: this.move.getName()
    }), 500);
    applyMoveAttrs(PreMoveMessageAttr, this.pokemon, this.pokemon.getOpponents().find(() => true)!, this.move.getMove()); //TODO: is the bang correct here?
  }

  showFailedText(failedText: string | null = null): void {
    this.scene.queueMessage(failedText || i18next.t("battle:attackFailed"));
  }

  end() {
    if (!this.followUp && this.canMove()) {
      this.scene.unshiftPhase(new MoveEndPhase(this.scene, this.pokemon.getBattlerIndex()));
    }

    super.end();
  }
}
