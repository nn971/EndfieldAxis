import type {
  SimEntity,
  SimEntityId,
  SimEvent,
} from "../../types/simulator/simulator";
import type { DamageContext, DamageKind } from "./damageModel";
import {
  DamageBonusCollector,
  type DamageBonusSnapshot,
} from "./damageBonuses";
import type { SimRegistry } from "../listeners/registry";
import type { SimRead } from "../simulator";

/**
 * DamageEngine builds the DamageContext fed into DamageModel.
 * All conditional logic (buffs/talents) lives in SimRegistry listeners.
 */

function collectDamageBonuses(params: {
  registry: SimRegistry;
  read: SimRead;
  ev?: SimEvent;
  kind: DamageKind;
  sourceId: SimEntityId;
  targetId: SimEntityId;
}): DamageBonusSnapshot {
  const { registry, read, ev, kind, sourceId, targetId } = params;
  const collector = new DamageBonusCollector();

  const source = read.getEntity(sourceId);
  const target = read.getEntity(targetId);

  // Global listeners (system rules not tied to a particular buff)
  registry.runGlobalDamageBonus({
    read,
    ev,
    kind,
    sourceId,
    targetId,
    collector,
  });

  // Source buffs
  for (const buff of Object.values(source.buffs ?? {})) {
    if (!buff) continue;
    registry.runBuffDamageBonus({
      read,
      ev,
      kind,
      sourceId,
      targetId,
      collector,
      role: "source",
      buff,
    });
  }

  // Target buffs
  for (const buff of Object.values(target.buffs ?? {})) {
    if (!buff) continue;
    registry.runBuffDamageBonus({
      read,
      ev,
      kind,
      sourceId,
      targetId,
      collector,
      role: "target",
      buff,
    });
  }

  return collector.snapshot();
}

export function buildDamageContext(params: {
  registry: SimRegistry;
  read: SimRead;
  frame: number;
  kind: DamageKind;
  sourceId: SimEntityId;
  targetId: SimEntityId;
  dmgSkillMultiplier: number;
  /** Optional event for listeners to inspect (e.g. hit.skillType). */
  ev?: SimEvent;
  meta?: Record<string, unknown>;
}): DamageContext {
  let bonuses = collectDamageBonuses({
    registry: params.registry,
    read: params.read,
    ev: params.ev,
    kind: params.kind,
    sourceId: params.sourceId,
    targetId: params.targetId,
  });

  // Merge static build-derived buckets (weapon skills / gears / etc.).
  const sourceBuild = params.read.getBuild(params.sourceId);
  if (sourceBuild?.restStat) {
    const merged: DamageBonusSnapshot = {
      ratio: { ...bonuses.ratio },
      value: { ...bonuses.value },
      log: [...bonuses.log],
    };

    for (const [bucket, delta] of Object.entries(
      sourceBuild.restStat.damageBonusRatio ?? {},
    )) {
      if (!Number.isFinite(delta) || delta === 0) continue;
      if (bucket in merged.ratio) {
        // bucket is expected to match DamageBucket keys.
        (merged.ratio as any)[bucket] += delta;
        merged.log.push({
          bucket: bucket as any,
          addRatio: delta,
          note: "restStat",
        });
      }
    }
    for (const [bucket, delta] of Object.entries(
      sourceBuild.restStat.damageBonusValue ?? {},
    )) {
      if (!Number.isFinite(delta) || delta === 0) continue;
      if (bucket in merged.value) {
        (merged.value as any)[bucket] += delta;
        merged.log.push({
          bucket: bucket as any,
          addValue: delta,
          note: "restStat",
        });
      }
    }

    bonuses = merged;
  }

  const source = params.read.getEntity(params.sourceId);
  const target = params.read.getEntity(params.targetId);

  return {
    frame: params.frame,
    kind: params.kind,
    source: source as unknown as SimEntity,
    target: target as unknown as SimEntity,
    dmgSkillMultiplier: params.dmgSkillMultiplier,
    bonuses,
    sourceBuild,
    meta: params.meta,
  };
}
