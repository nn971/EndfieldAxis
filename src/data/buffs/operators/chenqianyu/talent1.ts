import { BuffDef } from "../../BuffDef";
import type { SimRegistry } from "../../../../simulator/listeners/registry";

class ChenQianyuAtkBuffDef extends BuffDef {
  private readonly bonusPerStack = 0.08;

  constructor() {
    super({
      id: "buff.chenqianyu.talent1.atkInc",
      name: "Chen Qianyu Attack Bonus",
      icon: "CHENQIANYU_TALENT1.png",
      durationFrames: 600,
      maxStacks: 5,
    });
    // console.log("Chen Qianyu Talent 1 buff initialized");
  }

  override registerSimPlugins(registry: SimRegistry): void {
    registry.registerBuffDamageBonus({
      id: this.id,
      fn: ({ role, buff, collector }) => {
        // stacking self buff: +8% attackIncMul per stack
        if (role !== "source") return;
        const stacks = Math.max(0, Number((buff as any).stacks ?? 0));
        if (!Number.isFinite(stacks) || stacks <= 0) return;
        collector.addRatio(
          "attackIncMul",
          stacks * this.bonusPerStack,
          `buff.chenqianyu.talent1.atkInc(+8% x${stacks})`,
        );
      },
    });
  }
}

export default new ChenQianyuAtkBuffDef();
