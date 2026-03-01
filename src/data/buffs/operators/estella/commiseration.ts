import { BuffDef } from "../../BuffDef";
import type { SimRegistry } from "../../../../simulator/listeners/registry";

class CommiserationDef extends BuffDef {
  constructor() {
    super({
      id: "operator.estella.talent1.commiseration",
      name: "Commiseration",
      icon: "Estella.png",
      durationFrames: -1,
      maxStacks: 2,
    });
  }

  override registerSimPlugins(_registry: SimRegistry): void {
  }
}

export default new CommiserationDef();
