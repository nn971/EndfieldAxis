import type { SimRegistry } from "../../../simulator/listeners/registry";
import { BuffDef } from "../BuffDef";

export const BUFF_COMMON_PROTECTED_ID = "buff.common.protected" as const;

class ProtectedBuffDef extends BuffDef {
  constructor() {
    super({
      id: BUFF_COMMON_PROTECTED_ID,
      name: "Protected",
      icon: "BUFF_PROTECTED.png",
      durationFrames: 1,
      maxStacks: 1,
    });
  }

  override registerSimPlugins(_registry: SimRegistry): void {}
}

export default new ProtectedBuffDef();
