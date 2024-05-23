import BattleScene from "../battle-scene";
import { PersistentModifier } from "../modifier/modifier";
import { GeneratedPersistentModifierType, ModifierTypeGenerator, getModifierTypeFuncById } from "../modifier/modifier-type";

export default class ModifierData {
  private player: boolean;
  private typeId: string;
  private typeGeneratorId: string;
  private typePregenArgs: any[];
  private args: any[];
  private stackCount: integer;

  public className: string;

  constructor(source: PersistentModifier | any, player: boolean) {
    const sourceModifier = source instanceof PersistentModifier ? source as PersistentModifier : null;
    this.player = player;
    this.typeId = sourceModifier ? sourceModifier.type.id : source.typeId;
    this.typeGeneratorId = sourceModifier ? sourceModifier.type.generatorId : source.typeGeneratorId;
    if (sourceModifier) {
      if ("getPregenArgs" in source.type) {
        this.typePregenArgs = (source.type as GeneratedPersistentModifierType).getPregenArgs();
      }
    } else if (source.typePregenArgs) {
      this.typePregenArgs = source.typePregenArgs;
    }
    this.args = sourceModifier ? sourceModifier.getArgs() : source.args || [];
    this.stackCount = source.stackCount;
    this.className = sourceModifier ? sourceModifier.constructor.name : source.className;
  }

  toModifier(scene: BattleScene, constructor: any): PersistentModifier {
    const typeFunc = getModifierTypeFuncById(this.typeId);
    if (!typeFunc) {
      return null;
    }

    try {
      let type = typeFunc();
      type.id = this.typeId;
      type.generatorId = this.typeGeneratorId;

      if (type instanceof ModifierTypeGenerator) {
        type = (type as ModifierTypeGenerator).generateType(this.player ? scene.getParty() : scene.getEnemyField(), this.typePregenArgs);
      }

      const ret = Reflect.construct(constructor, ([ type ] as any[]).concat(this.args).concat(this.stackCount)) as PersistentModifier;

      if (ret.stackCount > ret.getMaxStackCount(scene)) {
        ret.stackCount = ret.getMaxStackCount(scene);
      }

      return ret;
    } catch (err) {
      console.error(err);
      return null;
    }
  }
}
