import type { SimRegistry } from "../../../simulator/listeners/registry";
import { BuffDef } from "../BuffDef";

export const SOLIDIFICATION_BUFF_ID = "buff.solidification" as const;
export const SOLIDIFICATION_BASE_DURATION_FRAMES = 360;
export const SOLIDIFICATION_EXTRA_DURATION_PER_STACK_FRAMES = 90;
export const SOLIDIFICATION_INITIAL_HIT_BASE_MUL = 0.6;
export const SOLIDIFICATION_INITIAL_HIT_PER_STACK_MUL = 0.4;
export const SOLIDIFICATION_SHATTER_BASE_MUL = 2.5;
export const SOLIDIFICATION_SHATTER_PER_STACK_MUL = 1.5;

class SolidificationBuffDef extends BuffDef {
  constructor() {
    super({
      id: SOLIDIFICATION_BUFF_ID,
      name: "Solidification",
      icon: "SOLIDIFICATION.png",
      durationFrames: 360,
      maxStacks: 4,
    });
  }

  override registerSimPlugins(_registry: SimRegistry): void {}
}

export default new SolidificationBuffDef();
