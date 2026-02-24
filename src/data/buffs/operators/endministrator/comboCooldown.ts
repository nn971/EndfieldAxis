import { BuffDef } from "../../BuffDef";
import type { SimRegistry } from "../../../../simulator/listeners/registry";

class EndministratorComboCooldownMarkerDef extends BuffDef {
  constructor() {
    super({
      id: "buff.endministrator.comboSkill.cooldown",
      name: "Endministrator Combo Cooldown",
      icon: "ENDMINISTRATOR.png",
      durationFrames: 100000,
      maxStacks: 1,
    });
  }

  override registerSimPlugins(_registry: SimRegistry): void {}
}

export default new EndministratorComboCooldownMarkerDef();
