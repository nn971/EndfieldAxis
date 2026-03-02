import type { SimRegistry } from "../../../simulator/listeners/registry";
import { delay } from "../../../simulator/scripts";
import { BuffDef } from "../BuffDef";

export const COMBUSTION_BUFF_ID = "buff.combustion" as const;
export const COMBUSTION_DURATION_FRAMES = 600;
export const COMBUSTION_INITIAL_HIT_BASE_MUL = 0.5;
export const COMBUSTION_INITIAL_HIT_PER_STACK_MUL = 0.35;
export const COMBUSTION_DOT_BASE_MUL = 0.2;
export const COMBUSTION_DOT_PER_STACK_MUL = 0.12;
export const COMBUSTION_DOT_INTERVAL_FRAMES = 60;

class CombustionBuffDef extends BuffDef {
  constructor() {
    super({
      id: COMBUSTION_BUFF_ID,
      name: "Combustion",
      icon: "COMBUSTION.png",
      durationFrames: COMBUSTION_DURATION_FRAMES,
      maxStacks: 1,
    });
  }

  override registerSimPlugins(registry: SimRegistry): void {
    registry.registerOnBuffApply({
      id: "buff.combustion.scheduleDot",
      when: { buffId: this.id },
      fn: ({ ev, read }) => {
        const target = read.getEntity(ev.ownerId);
        const buff = (target as any).buffs?.[this.id];
        if (!buff) return null;

        const sourceId = String((buff as any).meta?.reactionSourceId ?? "");
        if (!sourceId) return null;

        return function* (ctx) {
          yield delay(COMBUSTION_DOT_INTERVAL_FRAMES);
          yield ctx.emit.reactionTick({
            sourceId,
            targetId: ev.ownerId,
            reactionBuffId: this.id,
            ref: ev.id,
          });
        }.bind(this);
      },
    });
  }
}

export default new CombustionBuffDef();
