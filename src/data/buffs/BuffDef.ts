import type { SimRegistry } from "../../simulator/listeners/registry";

/**
 * BuffDef
 * - Stores all metadata + simulator listener registrations for a buff in one class.
 */
export type BuffId = string;

export type BuffDefInit = {
  id: BuffId;
  name: string;
  icon: string;
  durationFrames: number;
  maxStacks?: number; // default 1 (non-stacking buff)
};

export abstract class BuffDef {
  public readonly id: string;
  public readonly name: string;
  public readonly icon: string;
  public readonly durationFrames: number;
  public readonly maxStacks: number;

  protected constructor(init: BuffDefInit) {
    this.id = init.id;
    this.name = init.name;
    this.icon = init.icon;
    this.durationFrames = init.durationFrames;
    this.maxStacks = init.maxStacks ?? 1;
  }

  /** Register simulator listeners for this buff. */
  abstract registerSimPlugins(registry: SimRegistry): void;
}
