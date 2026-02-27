import type { SimRegistry } from "../../../simulator/listeners/registry";
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
    registry.registerOnBuffApplyForBuff({
      buffId: this.id,
      id: "buff.combustion.scheduleDot",
      fn: ({ ev, read, nextSeq, makeEventId }) => {
        const target = read.getEntity(ev.targetId);
        const buff = (target as any).buffs?.[this.id];
        if (!buff) return [];

        const sourceId = String((buff as any).meta?.reactionSourceId ?? "");
        if (!sourceId) return [];

        return [
          {
            id: makeEventId(),
            type: "reactionTick",
            frame: ev.frame + COMBUSTION_DOT_INTERVAL_FRAMES,
            seq: nextSeq(),
            sourceId,
            targetId: ev.targetId,
            reactionBuffId: this.id,
            ref: ev.id,
          },
        ];
      },
    });
  }
}

export default new CombustionBuffDef();
