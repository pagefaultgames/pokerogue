import { globalScene } from "#app/global-scene";
import { BattlerIndex } from "#enums/battler-index";
import { TrainerSlot } from "#enums/trainer-slot";
import type { Pokemon } from "#field/pokemon";
import { FieldPhase } from "#phases/field-phase";

export abstract class PokemonPhase extends FieldPhase {
  /**
   * The battler index this phase refers to, or the pokemon ID if greater than 3.
   * TODO: Make this either use IDs or `BattlerIndex`es, not a weird mix of both
   */
  protected battlerIndex: BattlerIndex | number;
  // TODO: Why is this needed?
  public player: boolean;
  /** @todo Remove in favor of `battlerIndex` pleas for fuck's sake */
  public fieldIndex: number;

  constructor(battlerIndex?: BattlerIndex | number) {
    super();

    battlerIndex =
      battlerIndex
      ?? globalScene
        .getField()
        .find(p => p?.isActive())
        ?.getBattlerIndex();
    if (battlerIndex === undefined) {
      // TODO: figure out a suitable fallback behavior
      console.warn("There are no Pokemon on the field!");
      battlerIndex = BattlerIndex.PLAYER;
    }

    this.battlerIndex = battlerIndex;
    this.player = battlerIndex < 2;
    this.fieldIndex = battlerIndex % 2;
  }

  // TODO: This should have `undefined` in its signature
  getPokemon(): Pokemon {
    if (this.battlerIndex > BattlerIndex.ENEMY_2) {
      return globalScene.getPokemonById(this.battlerIndex)!;
    }
    return globalScene.getField()[this.battlerIndex]!;
  }

  /**
   * @returns The {@linkcode Pokemon} at this Phase's field index, or
   * `undefined` if no such Pokemon exists. Unlike {@linkcode getPokemon}, this
   * doesn't require the Pokemon to be active or on the field for it
   * to be returned.
   *
   * @todo This is a bandaid fix for an issue where {@linkcode RecallPhase}
   * would crash the game during a double -> single battle transition. If this phase is
   * refactored, this method should be removed in favor of a more flexible {@linkcode getPokemon}
   * (or ideally a complete overhaul of field getters)
   * @see {@link https://github.com/Despair-Games/poketernity/pull/1236#pullrequestreview-3046453380}
   */
  protected getPokemonAtFieldIndex(): Pokemon | undefined {
    return this.getAlliedParty()[this.fieldIndex];
  }

  protected getAlliedParty(): Pokemon[] {
    return this.player ? globalScene.getPlayerParty() : globalScene.getEnemyParty();
  }

  /**
   * @returns the {@linkcode TrainerSlot} for this phase's {@linkcode getPokemon | Pokemon},
   * or {@linkcode TrainerSlot.NONE} if the Pokemon does not have a Trainer
   */
  protected getTrainerSlot(): TrainerSlot {
    const pokemon = this.getPokemon();

    return pokemon.isEnemy() ? pokemon.trainerSlot : TrainerSlot.NONE;
  }

  protected getOpposingField(): Pokemon[] {
    return this.player ? globalScene.getEnemyField() : globalScene.getPlayerField();
  }
}
