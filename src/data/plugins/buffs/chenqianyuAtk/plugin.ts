import type { SimPluginRegisterFn } from "../../../simulator/simPlugins/registry";

const BONUS_PER_STACK = 0.08;

export const register: SimPluginRegisterFn = registry => {
  registry.registerBuffDamageBonus({
    buffType: "chenqianyuAtk",
    id: "buff.chenqianyuAtk.attackIncMul",
    fn: ({ role, buff, collector }) => {
      // stacking self buff: +8% attackIncMul per stack
      if (role !== "source") return;
      const stacks = Math.max(0, Number((buff as any).stacks ?? 0));
      if (!Number.isFinite(stacks) || stacks <= 0) return;
      collector.addRatio(
        "attackIncMul",
        stacks * BONUS_PER_STACK,
        `buff.chenqianyuAtk(+8% x${stacks})`,
      );
    },
  });
};
