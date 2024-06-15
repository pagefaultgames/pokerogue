import { BattlerIndex } from "#app/battle";
import BattleScene from "#app/battle-scene";
import { battleSpecDialogue } from "#app/data/dialogue";
import { SpeciesFormChangeManualTrigger } from "#app/data/pokemon-forms";
import { BattleSpec } from "#app/enums/battle-spec";
import { DamageResult, EnemyPokemon, HitResult } from "#app/field/pokemon";
import { PersistentModifier } from "#app/modifier/modifier";
import { getModifierType, modifierTypes } from "#app/modifier/modifier-type";
import { PokemonPhase, SummonPhase, ToggleDoublePositionPhase } from "#app/phases";
import * as Utils from "#app/utils";

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
      this.scene.toggleInvert(true);
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
      this.scene.playSound("hit");
      break;
    case HitResult.SUPER_EFFECTIVE:
    case HitResult.ONE_HIT_KO:
      this.scene.playSound("hit_strong");
      break;
    case HitResult.NOT_VERY_EFFECTIVE:
      this.scene.playSound("hit_weak");
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

  end() {
    switch (this.scene.currentBattle.battleSpec) {
    case BattleSpec.FINAL_BOSS:
      const pokemon = this.getPokemon();
      if (pokemon instanceof EnemyPokemon && pokemon.isBoss() && !pokemon.formIndex && pokemon.bossSegmentIndex < 1) {
        this.scene.fadeOutBgm(Utils.fixedInt(2000), false);
        this.scene.ui.showDialogue(battleSpecDialogue[BattleSpec.FINAL_BOSS].firstStageWin, pokemon.species.name, null, () => {
          this.scene.addEnemyModifier(getModifierType(modifierTypes.MINI_BLACK_HOLE).newModifier(pokemon) as PersistentModifier, false, true);
          pokemon.generateAndPopulateMoveset(1);
          this.scene.setFieldScale(0.75);
          this.scene.triggerPokemonFormChange(pokemon, SpeciesFormChangeManualTrigger, false);
          this.scene.currentBattle.double = true;
          const availablePartyMembers = this.scene.getParty().filter(p => !p.isFainted());
          if (availablePartyMembers.length > 1) {
            this.scene.pushPhase(new ToggleDoublePositionPhase(this.scene, true));
            if (!availablePartyMembers[1].isOnField()) {
              this.scene.pushPhase(new SummonPhase(this.scene, 1));
            }
          }

          super.end();
        });
        return;
      }
      break;
    }

    super.end();
  }
}
