import type { SimRegistry } from "../../../simulator/listeners/registry";
import { BuffDef } from "../BuffDef";

export const BUFF_COMMON_AMP_ID = "buff.common.amp" as const;

class AmpBuffDef extends BuffDef {
  constructor() {
    super({
      id: BUFF_COMMON_AMP_ID,
      name: "Amp",
      icon: "BUFF_AMP.png",
      durationFrames: 1,
      maxStacks: 1,
    });
  }

  override registerSimPlugins(_registry: SimRegistry): void {}
}

export default new AmpBuffDef();
