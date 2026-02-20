import { makeId } from "../shared/lib/id";
import type { OperatorBuild } from "../types/operator";
import type {
  SimEntityId,
  SimWorld,
  SimEvent,
} from "../types/simulator/simulator";
import {
  type SimStatusType,
  type SimInfliction,
  type SimInflictionType,
  type SimBuff,
  type SimBuffType,
} from "../types/simulator/infliction";
import { pushLog, SimLog } from "./log";
import type { DamageContext, DamageModel } from "./damageModel";

// Local scheduler to avoid circular imports between resolver <-> sim.
function schedule(queue: SimEvent[], ev: SimEvent): void {
  let lo = 0,
    hi = queue.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const m = queue[mid];
    if (m.frame < ev.frame || (m.frame === ev.frame && m.seq <= ev.seq))
      lo = mid + 1;
    else hi = mid;
  }
  queue.splice(lo, 0, ev);
}

// TODO: load from data file (inflictions.json) instead of hardcoding.
const DEFAULT_INFLICTION_DURATION_FRAMES = 1800;

// crystal debuff lasts 300 frames.
const BUFF_DURATION_FRAMES: Record<SimBuffType, number> = {
  crystal: 300,
};

// Placeholder while reverse-engineering crush scaling.
// TODO: replace with real scaling from gameplay data.
const CRUSH_BURST_SKILL_MUL_PER_STACK = 1;

const EVENT_PREFIX = "SimEvent_";
function makeEventId() {
  return makeId(EVENT_PREFIX);
}

function scheduleInflictionExpire(
  world: SimWorld,
  targetId: SimEntityId,
  inflictionType: SimInflictionType,
  nextSeq: () => number,
): void {
  schedule(world.futureEvents, {
    id: makeEventId(),
    type: "inflictionExpire",
    frame: world.nowInFrames + DEFAULT_INFLICTION_DURATION_FRAMES,
    seq: nextSeq(),

    // sourceId = entity who owns the infliction
    sourceId: targetId,
    inflictionType,
  } as SimEvent);
}

function scheduleBuffExpire(
  world: SimWorld,
  targetId: SimEntityId,
  buffType: SimBuffType,
  nextSeq: () => number,
): void {
  schedule(world.futureEvents, {
    id: makeEventId(),
    type: "buffExpire",
    frame: world.nowInFrames + (BUFF_DURATION_FRAMES[buffType] ?? 0),
    seq: nextSeq(),

    // sourceId = entity who owns the buff
    sourceId: targetId,
    buffType,
  } as SimEvent);
}

export function resolveStatusApplication(
  world: SimWorld, // mutable
  sourceId: SimEntityId,
  targetId: SimEntityId,
  statusType: SimStatusType,
  nextSeq: () => number,
  damageModel: DamageModel,
  buildByOperatorId?: Record<string, OperatorBuild>,
) {
  /* directly mutate world, target and log via reference */

  const source = world.env.entitiesById[sourceId];
  if (!source) throw new Error(`Unknown source with sourceId=${sourceId}`);

  const target = world.env.entitiesById[targetId];
  if (!target) throw new Error(`Unknown target with targetId=${targetId}`);

  switch (statusType) {
    case "lift": {
      const current = target.inflictions.vulnerable?.stacks ?? 0;

      if (current <= 0) {
        target.inflictions.vulnerable = {
          type: "vulnerable",
          stacks: 1,
          lastApplyFrame: world.nowInFrames,
        } as SimInfliction;

        scheduleInflictionExpire(world, targetId, "vulnerable", nextSeq);
        pushLog(
          world.log,
          "buff&stat",
          world.nowInFrames,
          world.env,
          `INFLICTION vulnerable apply (by LIFT, target=${target.name})`,
        );
        return true;
      }

      // Has vulnerable: add 1 stack (cap 4) and trigger lift proc damage.
      const before = current;
      const after = Math.min(4, before + 1);
      target.inflictions.vulnerable = {
        type: "vulnerable",
        stacks: after,
        lastApplyFrame: world.nowInFrames,
      } as SimInfliction;

      scheduleInflictionExpire(world, targetId, "vulnerable", nextSeq);

      pushLog(
        world.log,
        "buff&stat",
        world.nowInFrames,
        world.env,
        `LIFT: vulnerable stacks ${before} -> ${after} (target=${target.name})`,
      );

      const ctx: DamageContext = {
        frame: world.nowInFrames,
        kind: "lift",
        source,
        target,
        dmgSkillMultiplier: 1,
        sourceBuild: buildByOperatorId?.[sourceId],
        meta: {
          note: `liftProc stacksBefore=${before} stacksAfter=${after}`,
        },
      };

      const res = damageModel.compute(ctx);
      target.hp -= res.amount;

      // TODO: replace debug log with exact breakdown UI.
      pushLog(
        world.log,
        "dmg",
        world.nowInFrames,
        world.env,
        `  DMG(liftProc)=${res.amount} incomingInc=${res.breakdown.incomingIncMul.toFixed(
          2,
        )} special=${res.breakdown.specialMul.toFixed(2)} hp=${target.hp}`,
        ctx,
        res.amount,
      );

      return true;
    }

    case "crush": {
      const current = target.inflictions.vulnerable?.stacks ?? 0;

      if (current <= 0) {
        target.inflictions.vulnerable = {
          type: "vulnerable",
          stacks: 1,
          lastApplyFrame: world.nowInFrames,
        } as SimInfliction;

        scheduleInflictionExpire(world, targetId, "vulnerable", nextSeq);
        pushLog(
          world.log,
          "buff&stat",
          world.nowInFrames,
          world.env,
          `INFLICTION vulnerable apply (by CRUSH, target=${target.name})`,
        );
        return true;
      }

      // Has vulnerable: consume all stacks and trigger crush burst damage.
      const consumed = current;
      delete target.inflictions.vulnerable;

      pushLog(
        world.log,
        "buff&stat",
        world.nowInFrames,
        world.env,
        `CRUSHED: vulnerable consumed=${consumed} (target=${target.name})`,
      );

      const ctx: DamageContext = {
        frame: world.nowInFrames,
        kind: "crush",
        source,
        target,
        // TEMP: more stacks => larger skill multiplier.
        dmgSkillMultiplier: consumed * CRUSH_BURST_SKILL_MUL_PER_STACK,
        sourceBuild: buildByOperatorId?.[sourceId],
        meta: {
          note: `crushBurst consumed=${consumed}`,
        },
      };

      const res = damageModel.compute(ctx);
      target.hp -= res.amount;

      // TODO: exact crush scaling & rounding
      pushLog(
        world.log,
        "dmg",
        world.nowInFrames,
        world.env,
        `  DMG(crushBurst)=${res.amount} incomingInc=${res.breakdown.incomingIncMul.toFixed(
          2,
        )} special=${res.breakdown.specialMul.toFixed(2)} hp=${target.hp}`,
        ctx,
        res.amount,
      );

      return true;
    }

    default: {
      throw new Error(`Unhandled statusType=${statusType}`);
    }
  }
}

export function resolveBuffApplication(
  world: SimWorld,
  sourceId: SimEntityId,
  targetId: SimEntityId,
  buffType: SimBuffType,
  nextSeq: () => number,
) {
  const source = world.env.entitiesById[sourceId];
  if (!source) throw new Error(`Unknown source with sourceId=${sourceId}`);

  const target = world.env.entitiesById[targetId];
  if (!target) throw new Error(`Unknown target with targetId=${targetId}`);

  const had = Boolean(target.buffs?.[buffType]);

  target.buffs[buffType] = {
    type: buffType,
    lastApplyFrame: world.nowInFrames,
  } as SimBuff;

  scheduleBuffExpire(world, targetId, buffType, nextSeq);

  pushLog(
    world.log,
    "buff&stat",
    world.nowInFrames,
    world.env,
    `BUFF ${buffType} ${had ? "refresh" : "apply"} (source=${source.name} target=${target.name})`,
  );

  return true;
}

export function resolveBuffExpiration(
  world: SimWorld,
  entityId: SimEntityId,
  buffType: SimBuffType,
) {
  // return false if expiration event is stale

  const ent = world.env.entitiesById[entityId];
  if (!ent) throw new Error(`Unknown entity with entityId ${entityId}`);

  const buff = ent.buffs?.[buffType];
  if (!buff) return false; // already removed or consumed

  const duration = BUFF_DURATION_FRAMES[buffType] ?? 0;
  if (world.nowInFrames >= buff.lastApplyFrame + duration) {
    delete ent.buffs[buffType];
    pushLog(
      world.log,
      "buff&stat",
      world.nowInFrames,
      world.env,
      `BUFF ${buffType} expire (entity=${ent.name})`,
    );
    return true;
  }

  return false;
}

export function resolveInflictionExpiration(
  world: SimWorld,
  sourceId: SimEntityId,
  inflictionType: SimInflictionType,
) {
  // return false if expiration event is stale

  const ent = world.env.entitiesById[sourceId];
  if (!ent) throw new Error(`Unknown entity with entityId ${sourceId}`);

  const inf = ent.inflictions?.[inflictionType];
  if (!inf) return false; // already removed or consumed

  // check if expiration event is stale
  if (
    world.nowInFrames >=
    inf.lastApplyFrame + DEFAULT_INFLICTION_DURATION_FRAMES
  ) {
    delete ent.inflictions[inflictionType];
    pushLog(
      world.log,
      "buff&stat",
      world.nowInFrames,
      world.env,
      `INFLICTION ${inflictionType} expire (entity=${ent.name})`,
    );
    return true;
  }
  return false;
}
