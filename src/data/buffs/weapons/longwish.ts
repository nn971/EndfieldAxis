import { BuffDef } from "../BuffDef";
import type { SimRegistry } from "../../../simulator/listeners/registry";

/**
 * Long Wish (Grand Vision weapon effect)
 *
 * We reuse stacks for state:
 * - stacks=1: primed (within 20s, next eligible cast will activate)
 * - stacks=2: active (during the cast, grants +57.6% Physical DMG Dealt)
 */
class LongWishDef extends BuffDef {
  constructor() {
    super({
      id: "weapon.grandvision.longWish",
      name: "Long Wish",
      // Reuse existing icon to avoid adding new assets.
      icon: "GRANDVISION.png",
      durationFrames: 1200,
      maxStacks: 2,
    });
  }

  override registerSimPlugins(registry: SimRegistry): void {
    registry.registerBuffDamageBonus({
      id: this.id,
      fn: ({ role, buff, collector }) => {
        if (role !== "source") return;
        const stacks = Math.max(0, Number((buff as any).stacks ?? 0));
        // Only stacks=2 is the "active" window.
        if (stacks < 2) return;
        collector.addValue(
          "dmgIncRatio",
          0.576,
          "Long Wish(+57.6% Physical DMG Dealt)",
        );
      },
    });
  }
}

export default new LongWishDef();
