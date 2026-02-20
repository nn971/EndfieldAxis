import type { SimPluginRegisterFn } from "@/simulator/listener/registry";

export const register: SimPluginRegisterFn = registry => {
  registry.registerBuffDamageBonus({
    buffType: "crystal",
    id: "buff.crystal.incomingIncMul",
    fn: ({ role, collector }) => {
      // crystal: increases damage suffered by +20% (incomingIncMul)
      if (role === "target") {
        collector.addRatio(
          "incomingIncMul",
          0.2,
          "buff.crystal(+20% incomingInc)",
        );
      }
    },
  });
};
