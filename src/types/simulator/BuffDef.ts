import type { SimBuffType } from "./infliction";
import type { SimRegistry } from "../../simulator/registry";

/**
 * BuffDef
 * - Stores all metadata + simulator listener registrations for a buff in one class.
 * - The runtime SimBuff object stays unchanged (type/lastApplyFrame/stacks?).
 */
export abstract class BuffDef {
  readonly type: SimBuffType;

  protected constructor(type: SimBuffType) {
    this.type = type;
  }

  /** Register simulator listeners for this buff. */
  abstract registerSimPlugins(registry: SimRegistry): void;
}
