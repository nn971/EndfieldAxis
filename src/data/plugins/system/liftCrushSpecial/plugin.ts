import type { SimPluginRegisterFn } from "../../../../simulator/registry";

// TEMP constant (placeholder while reverse-engineering exact in-game formulas).
const SPECIAL_MULTIPLIER = 1.2;

export const register: SimPluginRegisterFn = registry => {
  registry.registerGlobalDamageBonus({
    id: "system.liftCrush.specialMul",
    fn: ({ kind, collector }) => {
      // Built-in rule (moved out of simulator core):
      // lift / crush damage uses SpecialMultiplier; normal hits do not.
      if (kind === "lift" || kind === "crush") {
        collector.addRatio(
          "specialMul",
          SPECIAL_MULTIPLIER - 1,
          `status.${kind}.special(1.2)`,
        );
      }
    },
    // Run early
    priority: -100,
  });
};
