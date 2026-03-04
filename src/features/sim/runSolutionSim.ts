import operatorsData from "../../data/operators";
import { createDefaultDamageModel } from "../../simulator/damage/damageModel";
import type { SkillType } from "../../data/operators/OperatorDef";
import { loadSimRegistry } from "../../simulator/listeners/registry";
import type { SimLog } from "../../simulator/log";
import { SimWorld, type SimResourceSample } from "../../simulator/simulator";
import { makeSimEventId } from "../../shared/lib/utils";
import {
  INFLICTION_TYPE_LIST,
  type InflictionType,
  SimInfliction,
} from "../../types/simulator/infliction";
import type {
  SimEntity,
  SimEnv,
  SimEvent,
  SimEventType,
} from "../../types/simulator/simulator";
import type {
  SimRenderBar,
  SimRenderCache,
  SimRenderMarker,
  SkillBox,
  SolutionState,
} from "../../types/editor";
import type { DamageType } from "../../types/operator";
import {
  makeEmptySimDamageCache,
  type SimDamageCache,
  type SimHitDamageSnapshot,
} from "../../types/simDamage";
import { DAMAGE_BUCKETS, type DamageBucket } from "../../simulator/damage/damageBonuses";
import { DEFAULT_STAGGER_CAP_MILLI } from "../../types/simulator/stagger";

export type RunSolutionSimResult = {
  env: SimEnv;
  log: SimLog;
  processedEvents: SimEvent[];
  resourceSamples: SimResourceSample[];
  simRenderCache: SimRenderCache;
  totalDamage: number;
  hitDamageSnapshots: SimHitDamageSnapshot[];
};

function toSkillTypeOrNull(v: unknown): SkillType | null {
  if (
    v === "normalAttack" ||
    v === "normalSkill" ||
    v === "comboSkill" ||
    v === "ultimate"
  ) {
    return v;
  }
  return null;
}

function buildSimRenderCache(
  events: SimEvent[],
  resourceSamples: SimResourceSample[],
  teamSpCap: number,
  enemyStaggerCapMilli: number,
  ultimateEnergyMaxByOperatorId: Record<string, number>,
): SimRenderCache {
  const bars: SimRenderBar[] = [];
  const markers: SimRenderMarker[] = [];
  const enemyStaggerWindows: { startFrame: number; endFrame: number }[] = [];

  const eventById = new Map(events.map(ev => [ev.id, ev]));

  type ActiveBar = SimRenderBar & { key: string };
  const activeByKey = new Map<string, ActiveBar>();

  let simEndFrame = 0;

  function closeBar(key: string, frame: number) {
    const active = activeByKey.get(key);
    if (!active) return;
    active.endFrame = Math.max(active.startFrame + 1, frame);
    bars.push(active);
    activeByKey.delete(key);
  }

  for (const ev of events) {
    simEndFrame = Math.max(simEndFrame, ev.frame);
    if (ev.type === "statusApply") {
      markers.push({
        id: `status:${ev.id}`,
        type: "status",
        targetId: ev.targetId,
        effectId: ev.statusType,
        frame: ev.frame,
      });
      continue;
    }

    if (ev.type === "buffApply") {
      const targetId = ev.targetId;
      const key = `buff:${targetId}:${ev.buffId}`;
      const active = activeByKey.get(key);
      if (active) {
        active.refreshFrames.push(ev.frame);
        markers.push({
          id: `buff-refresh:${ev.id}`,
          type: "buffRefresh",
          targetId,
          effectId: ev.buffId,
          frame: ev.frame,
        });
      } else {
        activeByKey.set(key, {
          id: `bar:${key}:${ev.id}`,
          key,
          type: "buff",
          targetId,
          effectId: ev.buffId,
          startFrame: ev.frame,
          endFrame: ev.frame,
          refreshFrames: [],
        });
      }
      continue;
    }

    if (ev.type === "buffExpire" || ev.type === "buffRemove") {
      closeBar(`buff:${ev.targetId}:${ev.buffId}`, ev.frame);
      continue;
    }

    if (ev.type === "inflictionApply") {
      const targetId = ev.targetId;
      const key = `infliction:${targetId}:${ev.inflictionType}`;
      const active = activeByKey.get(key);
      if (active) {
        active.endFrame = Math.max(active.endFrame, ev.frame);
      } else {
        activeByKey.set(key, {
          id: `bar:${key}:${ev.id}`,
          key,
          type: "infliction",
          targetId,
          effectId: ev.inflictionType,
          startFrame: ev.frame,
          endFrame: ev.frame,
          refreshFrames: [],
        });
      }
      continue;
    }

    if (ev.type === "inflictionExpire" || ev.type === "inflictionRemove") {
      closeBar(`infliction:${ev.targetId}:${ev.inflictionType}`, ev.frame);
      continue;
    }

    if (ev.type === "staggerExpire") {
      const startFrame =
        typeof ev.ref === "string"
          ? Math.max(0, eventById.get(ev.ref)?.frame ?? ev.frame)
          : ev.frame;
      enemyStaggerWindows.push({
        startFrame,
        endFrame: Math.max(startFrame + 1, ev.frame),
      });
    }
  }

  for (const active of activeByKey.values()) {
    active.endFrame = Math.max(active.startFrame + 1, simEndFrame);
    bars.push(active);
  }

  const teamSpRealSeries = resourceSamples.map(sample => ({
    frame: sample.frame,
    seq: sample.seq,
    value: sample.teamSp.real,
  }));

  const teamSpTotalSeries = resourceSamples.map(sample => ({
    frame: sample.frame,
    seq: sample.seq,
    value: sample.teamSp.total,
  }));

  const enemyStaggerSeries = resourceSamples.map(sample => ({
    frame: sample.frame,
    seq: sample.seq,
    value: sample.enemyStaggerMilli / 1000,
  }));

  const ultimateEnergySeriesByOperatorId: Record<
    string,
    { frame: number; seq: number; value: number }[]
  > = {};

  for (const operatorId of Object.keys(ultimateEnergyMaxByOperatorId)) {
    ultimateEnergySeriesByOperatorId[operatorId] = resourceSamples.map(
      sample => ({
        frame: sample.frame,
        seq: sample.seq,
        value: Number(sample.ultimateCurrentByOperatorId[operatorId] ?? 0),
      }),
    );
  }

  return {
    bars,
    markers,
    teamSpRealSeries,
    teamSpTotalSeries,
    enemyStaggerSeries,
    enemyStaggerWindows,
    teamSpCap,
    enemyStaggerCap: enemyStaggerCapMilli / 1000,
    ultimateEnergySeriesByOperatorId,
    ultimateEnergyMaxByOperatorId,
    simEndFrame,
  };
}

function compileSkillCast(params: {
  sourceId: string;
  skillType: SkillType;
  targetId: string;
  startFrame: number;
  nextSeq: () => number;
}): SimEvent[] {
  const { sourceId, skillType, targetId, startFrame, nextSeq } = params;
  const operator = operatorsData[sourceId];
  if (!operator) {
    console.warn(
      `Unknown operator with id ${sourceId} while compiling skill cast`,
    );
    return [];
  }
  const skill = operator.skills[skillType];
  if (!skill) {
    console.warn(
      `Unknown skill type ${skillType} for operator ${sourceId} while compiling skill cast`,
    );
    return [];
  }

  const events: SimEvent[] = [];

  const startEventId = makeSimEventId();
  events.push({
    id: startEventId,
    type: "castStart",
    frame: startFrame,
    seq: nextSeq(),
    ref: null,
    sourceId,
    targetId,
    skillType,
  });

  events.push({
    id: makeSimEventId(),
    type: "castEnd",
    frame: startFrame + skill.durationFrames,
    seq: nextSeq(),
    sourceId,
    targetId,
    ref: startEventId,
    skillType,
  });

  return events;
}

function compileSkillBoxes(params: {
  skillBoxes: SkillBox[];
  targetId: string;
  nextSeq: () => number;
}): SimEvent[] {
  const { skillBoxes, targetId, nextSeq } = params;

  const sorted = [...skillBoxes].sort((a, b) => {
    if (a.startFrame !== b.startFrame) return a.startFrame - b.startFrame;
    if (a.operatorId !== b.operatorId)
      return a.operatorId.localeCompare(b.operatorId);
    if (a.skillType !== b.skillType)
      return a.skillType.localeCompare(b.skillType);
    return a.id.localeCompare(b.id);
  });

  const out: SimEvent[] = [];
  for (const box of sorted) {
    const evs = compileSkillCast({
      sourceId: box.operatorId,
      skillType: box.skillType,
      targetId,
      startFrame: box.startFrame,
      nextSeq,
    });
    out.push(...evs);
  }
  return out;
}

function getEmptyInfliction(): Record<InflictionType, SimInfliction> {
  return Object.fromEntries(
    INFLICTION_TYPE_LIST.map(type => [
      type,
      {
        type,
        stacks: 0,
        lastApplyFrame: -1,
      },
    ]),
  ) as Record<InflictionType, SimInfliction>;
}

function extractHitDamageSnapshots(log: SimLog): SimHitDamageSnapshot[] {
  const snapshots: SimHitDamageSnapshot[] = [];

  for (const entry of log) {
    if (entry.cat !== "dmg") continue;
    const meta =
      typeof entry.ctx.meta === "object" && entry.ctx.meta !== null
        ? (entry.ctx.meta as {
            hitEvent?: { id?: unknown; seq?: unknown };
            castStartEventId?: unknown;
            castSkillType?: unknown;
          })
        : undefined;
    const hitEvent =
      typeof meta?.hitEvent === "object" && meta.hitEvent !== null
        ? meta.hitEvent
        : undefined;
    const sourceId = entry.ctx.source.id;
    const targetId = entry.ctx.target.id;
    const buckets = Object.fromEntries(
      DAMAGE_BUCKETS.map(bucket => [bucket, Number(entry.ctx.bonuses[bucket] ?? 0)]),
    ) as Record<DamageBucket, number>;
    const hitSeq = Number(hitEvent?.seq ?? -1);

    snapshots.push({
      frame: entry.frame,
      seq: hitSeq,
      hitEventId: typeof hitEvent?.id === "string" ? hitEvent.id : "",
      castStartEventId: typeof meta?.castStartEventId === "string" ? meta.castStartEventId : null,
      castSkillType: toSkillTypeOrNull(meta?.castSkillType),
      sourceId,
      targetId,
      damageType: entry.ctx.type as DamageType,
      amount: entry.amount,
      buckets,
    });
  }

  return snapshots;
}

export function runSolutionSim(
  solution: Pick<
    SolutionState,
    "teamOperatorIds" | "controlledOperatorId" | "skillBoxes" | "buildByOperatorId"
  >,
): RunSolutionSimResult {
  const { teamOperatorIds, controlledOperatorId, skillBoxes, buildByOperatorId } =
    solution;
  const targetId = "enemy1";

  const allOperatorIds = new Set<string>(teamOperatorIds);
  for (const box of skillBoxes) {
    allOperatorIds.add(box.operatorId);
  }

  const entities: SimEntity[] = [
    ...Array.from(allOperatorIds).map(operatorId => ({
      id: operatorId,
      name: operatorsData[operatorId]?.name ?? operatorId,
      type: "operator" as const,
      hp: 999999,
      inflictions: getEmptyInfliction(),
      buffs: {},
      combo: {
        cooldown: 0,
        pending: false,
        availableUntilFrame: -1,
        lastTriggerFrame: -1,
      },
    })),
    {
      id: targetId,
      name: "Enemy1",
      type: "enemy",
      hp: 999999,
      inflictions: getEmptyInfliction(),
      buffs: {},
      stagger: {
        currentMilli: 0,
        capMilli: DEFAULT_STAGGER_CAP_MILLI,
        isStaggered: false,
      },
    },
  ];

  const registry = loadSimRegistry();
  const world = new SimWorld({
    entities,
    buildByOperatorId,
    nowInFrames: 0,
    futureEvents: [],
    registry,
    damageModel: createDefaultDamageModel(),
    teamOperatorIds,
    controlledOperatorId,
  });

  const events = compileSkillBoxes({
    skillBoxes,
    targetId,
    nextSeq: world.ops.nextSeq,
  });
  for (const ev of events) world.ops.schedule(ev);

  world.runSim();

  const ultimateEnergyMaxByOperatorId = Object.fromEntries(
    Object.entries(world.env.resources.ultimateByOperatorId).map(
      ([operatorId, state]) => [operatorId, Number(state.max ?? 0)],
    ),
  );

  const simRenderCache = buildSimRenderCache(
    world.processedEvents,
    world.resourceSamples,
    Number(world.env.resources.teamSp.cap),
    Number(world.env.entitiesById[targetId]?.stagger?.capMilli ?? 0),
    ultimateEnergyMaxByOperatorId,
  );
  const hitDamageSnapshots = extractHitDamageSnapshots(world.log);
  const totalDamage = hitDamageSnapshots.reduce((sum, snapshot) => sum + snapshot.amount, 0);
  const simDamageCache: SimDamageCache = {
    ...makeEmptySimDamageCache(),
    totalDamage,
    hitDamageSnapshots,
  };

  return {
    env: world.env,
    log: world.log,
    processedEvents: world.processedEvents,
    resourceSamples: world.resourceSamples,
    simRenderCache,
    totalDamage: simDamageCache.totalDamage,
    hitDamageSnapshots: simDamageCache.hitDamageSnapshots,
  };
}

export function toEventTypeSequence(events: SimEvent[]): SimEventType[] {
  return events.map(ev => ev.type);
}
