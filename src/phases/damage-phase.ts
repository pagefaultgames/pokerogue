import BattleScene from "#app/battle-scene.js";
import { BattlerIndex } from "#app/battle.js";
import { BattleSpec } from "#app/enums/battle-spec.js";
import { DamageResult, HitResult } from "#app/field/pokemon.js";
import * as Utils from "#app/utils.js";
import { PokemonPhase } from "./pokemon-phase";

export class DamagePhase extends PokemonPhase {
  private amount: integer;
  private damageResult: DamageResult;
  private critical: boolean;

  constructor(scene: BattleScene, battlerIndex: BattlerIndex, amount: integer, damageResult?: DamageResult, critical: boolean = false) {
    super(scene, battlerIndex);

    this.amount = amount;
    this.damageResult = damageResult || HitResult.EFFECTIVE;
    this.critical = critical;
  }

  start() {
    super.start();

    if (this.damageResult === HitResult.ONE_HIT_KO) {
      if (this.scene.moveAnimations) {
        this.scene.toggleInvert(true);
      }
      this.scene.time.delayedCall(Utils.fixedInt(1000), () => {
        this.scene.toggleInvert(false);
        this.applyDamage();
      });
      return;
    }

    this.applyDamage();
  }

  updateAmount(amount: integer): void {
    this.amount = amount;
  }

  applyDamage() {
    switch (this.damageResult) {
    case HitResult.EFFECTIVE:
      this.scene.playSound("se/hit");
      break;
    case HitResult.SUPER_EFFECTIVE:
    case HitResult.ONE_HIT_KO:
      this.scene.playSound("se/hit_strong");
      break;
    case HitResult.NOT_VERY_EFFECTIVE:
      this.scene.playSound("se/hit_weak");
      break;
    }

    if (this.amount) {
      this.scene.damageNumberHandler.add(this.getPokemon(), this.amount, this.damageResult, this.critical);
    }

    if (this.damageResult !== HitResult.OTHER) {
      const flashTimer = this.scene.time.addEvent({
        delay: 100,
        repeat: 5,
        startAt: 200,
        callback: () => {
          this.getPokemon().getSprite().setVisible(flashTimer.repeatCount % 2 === 0);
          if (!flashTimer.repeatCount) {
            this.getPokemon().updateInfo().then(() => this.end());
          }
        }
      });
    } else {
      this.getPokemon().updateInfo().then(() => this.end());
    }
  }

  override end() {
    if (this.scene.currentBattle.battleSpec === BattleSpec.FINAL_BOSS) {
      this.scene.initFinalBossPhaseTwo(this.getPokemon());
    } else {
      super.end();
    }
  }
}
