import { BuffDef } from "../../BuffDef";
import type { SimRegistry } from "../../../../simulator/listeners/registry";

class CrystalBuffDef extends BuffDef {
  constructor() {
    super({
      id: "buff.crystal",
      name: "Crystal",
      icon: "CRYSTAL.png",
      durationFrames: 240,
      maxStacks: 1,
    });
  }

  override registerSimPlugins(registry: SimRegistry): void {
    registry.registerBuffDamageBonus({
      id: this.id,
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

export default new CrystalBuffDef();
