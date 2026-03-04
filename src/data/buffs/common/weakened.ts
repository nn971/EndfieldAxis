import type { SimRegistry } from "../../../simulator/listeners/registry";
import { BuffDef } from "../BuffDef";

export const BUFF_COMMON_WEAKENED_ID = "buff.common.weakened" as const;

class WeakenedBuffDef extends BuffDef {
  constructor() {
    super({
      id: BUFF_COMMON_WEAKENED_ID,
      name: "Weakened",
      icon: "BUFF_WEAKENED.png",
      durationFrames: 1,
      maxStacks: 1,
    });
  }

  override registerSimPlugins(_registry: SimRegistry): void {}
}

export default new WeakenedBuffDef();
