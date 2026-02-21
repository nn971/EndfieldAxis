import { BuffDef } from "../../../../types/simulator/BuffDef";
import type { SimRegistry } from "../../../../simulator/registry";

class ChenQianyuAtkBuffDef extends BuffDef {
  private readonly bonusPerStack = 0.08;

  constructor() {
    super("chenqianyuAtk");
  }

  override registerSimPlugins(registry: SimRegistry): void {
    registry.registerBuffDamageBonus({
      buffType: this.type,
      id: "buff.chenqianyuAtk.attackIncMul",
      fn: ({ role, buff, collector }) => {
        // stacking self buff: +8% attackIncMul per stack
        if (role !== "source") return;
        const stacks = Math.max(0, Number((buff as any).stacks ?? 0));
        if (!Number.isFinite(stacks) || stacks <= 0) return;
        collector.addRatio(
          "attackIncMul",
          stacks * this.bonusPerStack,
          `buff.chenqianyuAtk(+8% x${stacks})`,
        );
      },
    });
  }
}

export const chenqianyuAtkBuffDef = new ChenQianyuAtkBuffDef();
