import type { AbAttrCondition } from "#app/@types/ability-types";
import type Pokemon from "#app/field/pokemon";
import type { BooleanHolder } from "#app/utils/common";

export abstract class AbAttr {
  public showAbility: boolean;
  private extraCondition: AbAttrCondition;

  constructor(showAbility = true) {
    this.showAbility = showAbility;
  }

  /**
   * Applies ability effects without checking conditions
   * @param _pokemon - The pokemon to apply this ability to
   * @param _passive - Whether or not the ability is a passive
   * @param _simulated - Whether the call is simulated
   * @param _args - Extra args passed to the function. Handled by child classes.
   * @see {@linkcode canApply}
   */
  apply(
    _pokemon: Pokemon,
    _passive: boolean,
    _simulated: boolean,
    _cancelled: BooleanHolder | null,
    _args: any[],
  ): void {}

  getTriggerMessage(_pokemon: Pokemon, _abilityName: string, ..._args: any[]): string | null {
    return null;
  }

  getCondition(): AbAttrCondition | null {
    return this.extraCondition || null;
  }

  addCondition(condition: AbAttrCondition): AbAttr {
    this.extraCondition = condition;
    return this;
  }

  /**
   * Returns a boolean describing whether the ability can be applied under current conditions
   * @param _pokemon - The pokemon to apply this ability to
   * @param _passive - Whether or not the ability is a passive
   * @param _simulated - Whether the call is simulated
   * @param _args - Extra args passed to the function. Handled by child classes.
   * @returns `true` if the ability can be applied, `false` otherwise
   * @see {@linkcode apply}
   */
  canApply(_pokemon: Pokemon, _passive: boolean, _simulated: boolean, _args: any[]): boolean {
    return true;
  }
}
