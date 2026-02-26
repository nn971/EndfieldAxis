import { BuffDef } from "../../BuffDef";
import type { SimRegistry } from "../../../../simulator/listeners/registry";

class ChenQianyuAtkBuffDef extends BuffDef {
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
      fn: ({ role, buff, collector, read, sourceId }) => {
        // stacking self buff: +4% attackIncMul per stack at talent1, +8% at talent2.
        if (role !== "source") return;
        const stacks = Math.max(0, Number((buff as any).stacks ?? 0));
        if (!Number.isFinite(stacks) || stacks <= 0) return;

        const talentRank = Number(read.getBuild(sourceId)?.talentRanks?.talent1 ?? 0);
        if (talentRank <= 0) return;

        const bonusPerStack = talentRank >= 2 ? 0.08 : 0.04;

        collector.addValue(
          "atkIncRatio",
          stacks * bonusPerStack,
          `buff.chenqianyu.talent1.atkInc(+${Math.round(
            bonusPerStack * 100,
          )}% x${stacks})`,
        );
      },
    });
  }
}

export default new ChenQianyuAtkBuffDef();
