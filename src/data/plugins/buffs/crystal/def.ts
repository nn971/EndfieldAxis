import { BuffDef } from "../../../../types/simulator/BuffDef";
import type { SimRegistry } from "../../../../simulator/registry";

class CrystalBuffDef extends BuffDef {
  constructor() {
    super("crystal");
  }

  override registerSimPlugins(registry: SimRegistry): void {
    registry.registerBuffDamageBonus({
      buffType: this.type,
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
  }
}

export const crystalBuffDef = new CrystalBuffDef();
