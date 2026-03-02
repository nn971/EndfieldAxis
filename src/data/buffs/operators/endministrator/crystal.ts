import { BuffDef } from "../../BuffDef";
import type { SimRegistry } from "../../../../simulator/listeners/registry";
import { type SimScript, type SimScriptContext } from "../../../../simulator/scripts";
import type { SimRead } from "../../../../simulator/simulator";

const ENDMINISTRATOR_ID = "endministrator";
export const CRYSTAL_ON_STATUS_APPLY_PLUGIN_ID =
  "buff.crystal.consume.onStatusApply";

const CRYSTAL_SHATTER_MUL_BY_CS_RANK = [
  1.78, 1.96, 2.13, 2.31, 2.49, 2.67, 2.84, 3.02, 3.2, 3.42, 3.69, 4.0,
] as const;

function getEndministratorComboRank(read: SimRead): number {
  const rank = Number(
    read.getBuild(ENDMINISTRATOR_ID)?.skillRanks?.comboSkill ?? 9,
  );
  if (!Number.isFinite(rank)) return 9;
  return Math.max(1, Math.min(12, Math.round(rank)));
}

function spawnCrystalConsumeEvents(params: {
  read: SimRead;
  targetId: string;
  ref?: string | null;
}): SimScript {
  const csRank = getEndministratorComboRank(params.read);
  const crystalShatterMul = CRYSTAL_SHATTER_MUL_BY_CS_RANK[csRank - 1] ?? 3.2;

  return function* (ctx: SimScriptContext) {
    yield ctx.emit.buffRemove({
      targetId: params.targetId,
      buffId: "buff.crystal" as any,
      ref: params.ref,
    });
    yield ctx.emit.hit({
      sourceId: ENDMINISTRATOR_ID,
      targetId: params.targetId,
      damageType: "physical",
      hitTypes: { comboSkill: true },
      dmgMultiplier: crystalShatterMul,
      ref: params.ref,
    });
  };
}

class CrystalBuffDef extends BuffDef {
  constructor() {
    super({
      id: "buff.crystal",
      name: "Crystal",
      icon: "CRYSTAL.png",
      durationFrames: 240,
      maxStacks: 1,
    });
  }

  override registerSimPlugins(registry: SimRegistry): void {
    registry.registerBuffDamageBonus({
      id: this.id,
      fn: ({ role, collector }) => {
        // crystal: increases damage suffered by +20% (incomingIncMul)
        if (role === "target") {
          collector.addValue(
            "rcvDmgIncRatio",
            0.2,
            "buff.crystal(+20% incomingInc)",
          );
        }
      },
    });

    registry.registerOnStatusApply({
      id: CRYSTAL_ON_STATUS_APPLY_PLUGIN_ID,
      fn: function* ({ read, ev, targetId, emit, sourceId, startFrame, skillType }) {
        if (ev?.type !== "statusApply" || !targetId) return;
        if (!read.env.entitiesById[ENDMINISTRATOR_ID]) return;

        const target = read.getEntity(targetId);
        if (!(target as any).buffs?.["buff.crystal"]) return;
        if (
          ev.statusType !== "lift" &&
          ev.statusType !== "knockDown" &&
          ev.statusType !== "crush" &&
          ev.statusType !== "breach"
        ) {
          return;
        }

        const script = spawnCrystalConsumeEvents({
          read,
          targetId,
          ref: ev.id,
        });
        yield* script({ read, ev, emit, sourceId, targetId, startFrame, skillType });
      },
    });

    registry.registerOnInflictionApply({
      id: "buff.crystal.consume.onInflictionApply",
      fn: function* ({ read, ev, targetId, emit, sourceId, startFrame, skillType }) {
        if (ev?.type !== "inflictionApply" || !targetId) return;
        if (!read.env.entitiesById[ENDMINISTRATOR_ID]) return;

        const target = read.getEntity(targetId);
        if (!(target as any).buffs?.["buff.crystal"]) return;
        if (ev.inflictionType !== "vulnerable") return;

        // Skip inflictions spawned by statusApply to avoid double consume.
        if (ev.ref) {
          const parent = read.getEvent(ev.ref);
          if (parent?.type === "statusApply") return;
        }

        const script = spawnCrystalConsumeEvents({
          read,
          targetId,
          ref: ev.id,
        });
        yield* script({ read, ev, emit, sourceId, targetId, startFrame, skillType });
      },
    });
  }
}

export default new CrystalBuffDef();
