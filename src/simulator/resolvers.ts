import { makeId } from "../shared/lib/id";
import type { SimEntityId, SimEvent } from "../types/simulator/simulator";
import {
  type SimStatusType,
  type SimInfliction,
  type SimBuff,
} from "../types/simulator/infliction";
import { BuffId } from "../data/buffs/BuffDef";
import { SimWorld } from "./simulator";
import buffsData from "../data/buffs";
import { DamageType } from "../types/operator";
import { HitTypes } from "./damage/damageEngine";

// TODO: come up with a way to configure this
export const DEFAULT_INFLICTION_DURATION_FRAMES = 1800;

const EVENT_PREFIX = "SimEvent_";
function makeEventId() {
  return makeId(EVENT_PREFIX);
}

function computePhysicalStatusSpecialMul(
  world: SimWorld,
  sourceId: SimEntityId,
  statusType: SimStatusType,
  vulnerableConsumed: number = 0,
): number {
  const build = world.read.getBuild(sourceId);
  const rawLevel = Number(build?.level ?? 1);
  const level = Number.isFinite(rawLevel)
    ? Math.min(90, Math.max(1, rawLevel))
    : 1;

  const rawArts = Number(build?.restStat?.artsIntensity ?? 0);
  const artsIntensity = Number.isFinite(rawArts) ? rawArts : 0;

  const levelMul = 1 + (level - 1) / 392;
  const artsMul = 1 + artsIntensity / 100;

  const consumed = Math.max(0, Number(vulnerableConsumed ?? 0));

  let baseMul = 1;
  switch (statusType) {
    case "lift":
    case "knockDown":
      baseMul = 1.2;
      break;
    case "crush":
      baseMul = 1.5 * (1 + consumed);
      break;
    case "breach":
      baseMul = 0.5 * (1 + consumed);
      break;
    default:
      baseMul = 1;
  }

  return Math.round(baseMul * levelMul * artsMul * 1000) / 1000;
}

/** WARNING: should not in use */
// function scheduleInflictionExpire(
//   world: SimWorld,
//   targetId: SimEntityId,
//   inflictionType: DamageType,
// ): void {
//   world.ops.schedule({
//     id: makeEventId(),
//     type: "inflictionExpire",
//     frame: world.read.nowInFrames + DEFAULT_INFLICTION_DURATION_FRAMES,
//     seq: world.ops.nextSeq(),
//     sourceId: targetId,
//     targetId,
//     inflictionType,
//     ref: "auto",
//   } as SimEvent);
// }

function scheduleApplyInfliction(
  world: SimWorld,
  sourceId: SimEntityId,
  targetId: SimEntityId,
  inflictionType: DamageType,
): void {
  const id = makeEventId();
  world.ops.schedule({
    id: id,
    type: "inflictionApply",
    frame: world.read.nowInFrames,
    seq: world.ops.nextSeq(),
    sourceId,
    targetId,
    inflictionType: inflictionType,
    inflictionStacks: 1,
  } as SimEvent);
  // world.ops.schedule({
  //   id: makeEventId(),
  //   type: "inflictionExpire",
  //   frame: world.read.nowInFrames + DEFAULT_INFLICTION_DURATION_FRAMES,
  //   seq: world.ops.nextSeq(),
  //   sourceId: targetId,
  //   targetId,
  //   inflictionType,
  //   ref: id,
  // } as SimEvent);
}

function scheduleBuffExpire(
  world: SimWorld,
  targetId: SimEntityId,
  buffId: BuffId,
): void {
  const duration = buffsData[buffId].durationFrames;
  if (duration === undefined) {
    console.warn(
      `No duration defined for buffId=${buffId}, defaulting to non-expiring`,
    );
    return;
  }
  if (duration <= 0) {
    console.warn(
      `BuffId=${buffId} has non-positive durationFrames=${duration}, defaulting to non-expiring`,
    );
    return;
  }
  world.ops.schedule({
    id: makeEventId(),
    type: "buffExpire",
    frame: world.read.nowInFrames + duration,
    seq: world.ops.nextSeq(),
    sourceId: targetId,
    buffId: buffId,
    ref: "auto",
  } as SimEvent);
}

export function resolveStatusApplication(
  self: SimWorld,
  sourceId: SimEntityId,
  targetId: SimEntityId,
  statusType: SimStatusType,
) {
  const source = self.read.getEntity(sourceId);
  if (!source) throw new Error(`Unknown source with sourceId=${sourceId}`);

  const target = self.read.getEntity(targetId);
  if (!target) throw new Error(`Unknown target with targetId=${targetId}`);

  let shouldAddVulnerable =
    statusType === "lift" ||
    statusType === "breach" ||
    statusType === "crush" ||
    statusType === "knockDown";
  let shouldRemoveVulnerable = false;

  const current = (target as any).inflictions.physical?.stacks ?? 0;
  switch (statusType) {
    case "lift": {
      if (current <= 0) break;

      // Has vulnerable: add 1 stack (cap 4) and trigger Lift damage.
      // Schedule Lift damage as a hit event so it can interleave with other same-frame effects.
      self.ops.schedule({
        id: makeEventId(),
        type: "hit",
        frame: self.read.nowInFrames,
        seq: self.ops.nextSeq(),
        sourceId,
        targetId,
        damageType: "physical",
        hitTypes: { lift: true }, // TODO currently status damages benefits from no other hitTypes.
        dmgMultiplier: computePhysicalStatusSpecialMul(self, sourceId, "lift"),
      } as SimEvent);
      break;
    }

    case "crush": {
      if (current <= 0) break;

      // Has vulnerable: consume all stacks and trigger crush burst damage.
      shouldRemoveVulnerable = true;

      // Schedule crush burst damage as a hit event so it can interleave with other same-frame effects.
      self.ops.schedule({
        id: makeEventId(),
        type: "hit",
        frame: self.read.nowInFrames,
        seq: self.ops.nextSeq(),
        sourceId,
        targetId,
        damageType: "physical",
        hitTypes: { crush: true }, // TODO currently status damages benefits from no other hitTypes.
        // TEMP: more stacks => larger skill multiplier.
        dmgMultiplier: computePhysicalStatusSpecialMul(
          self,
          sourceId,
          "crush",
          current,
        ),
      } as SimEvent);
      break;
    }

    case "knockDown": {
      if (current <= 0) break;

      self.ops.schedule({
        id: makeEventId(),
        type: "hit",
        frame: self.read.nowInFrames,
        seq: self.ops.nextSeq(),
        sourceId,
        targetId,
        damageType: "physical",
        hitTypes: { knockDown: true }, // TODO currently status damages benefits from no other hitTypes.
        dmgMultiplier: computePhysicalStatusSpecialMul(
          self,
          sourceId,
          "knockDown",
        ),
      } as SimEvent);
      break;
    }
    case "breach": {
      // TODO: Add breached (or other name) debuff to enemy

      if (current <= 0) break;

      shouldRemoveVulnerable = true;

      self.ops.schedule({
        id: makeEventId(),
        type: "hit",
        frame: self.read.nowInFrames,
        seq: self.ops.nextSeq(),
        sourceId,
        targetId,
        damageType: "physical",
        hitTypes: { breach: true }, // TODO currently status damages benefits from no other hitTypes.
        dmgMultiplier: computePhysicalStatusSpecialMul(
          self,
          sourceId,
          "breach",
          current,
        ),
      } as SimEvent);

      // TODO
      console.warn(`TODO breach debuff not handled yet`);
      break;
    }

    default: {
      throw new Error(`Unhandled statusType=${statusType}`);
    }
  }

  if (shouldAddVulnerable) {
    scheduleApplyInfliction(self, sourceId, targetId, "physical");
    const after = Math.min(4, current + 1);

    self.ops.log(
      "buff",
      `${statusType}: vulnerable stacks ${current} -> ${after} (target=${(target as any).name})`,
    );
  } else if (shouldRemoveVulnerable) {
    self.ops.removeInfliction(targetId, "physical");

    self.ops.log(
      "buff",
      `${statusType}: vulnerable consumed=${current} (target=${(target as any).name})`,
    );
  }

  return current >= 1;
}

export function resolveBuffApplication(
  self: SimWorld,
  sourceId: SimEntityId,
  targetId: SimEntityId,
  buffId: BuffId,
) {
  const source = self.read.getEntity(sourceId);
  if (!source) throw new Error(`Unknown source with sourceId=${sourceId}`);

  const target = self.read.getEntity(targetId);
  if (!target) throw new Error(`Unknown target with targetId=${targetId}`);

  const existing = (target as any).buffs?.[buffId];

  if (buffId === "buff.crystal") {
    const had = Boolean(existing);
    self.ops.upsertBuff(targetId, {
      id: buffId,
      lastApplyFrame: self.read.nowInFrames,
      stacks: 1,
    } as SimBuff);
    scheduleBuffExpire(self, targetId, buffId);
    self.ops.log(
      "buff",
      `BUFF ${buffId} ${had ? "refresh" : "apply"} (source=${(source as any).name} target=${(target as any).name})`,
    );
    return true;
  }

  // Default fallback: apply as a non-stacking, possibly-expiring buff.
  // const had = Boolean(existing);
  // self.ops.upsertBuff(targetId, {
  //   id: buffId,
  //   lastApplyFrame: self.read.nowInFrames,
  //   stacks: 1,
  // } as SimBuff);
  // scheduleBuffExpire(self, targetId, buffId);
  // self.ops.log(
  //   "buff",
  //   `BUFF ${buffId} ${had ? "refresh" : "apply"} (source=${(source as any).name} target=${(target as any).name})`,
  // );
  // return true;
  const def = buffsData[buffId];
  const maxStacks = Math.max(1, Number((def as any)?.maxStacks ?? 1));

  const beforeStacks = Math.max(0, Number((existing as any)?.stacks ?? 0));
  const afterStacks = Math.min(maxStacks, beforeStacks + 1);

  const had = Boolean(existing);
  self.ops.upsertBuff(targetId, {
    id: buffId,
    lastApplyFrame: self.read.nowInFrames,
    stacks: afterStacks,
  } as SimBuff);
  scheduleBuffExpire(self, targetId, buffId);

  if (maxStacks > 1) {
    self.ops.log(
      "buff",
      `BUFF ${buffId} stacks ${beforeStacks} -> ${afterStacks} (source=${(source as any).name} target=${(target as any).name})`,
    );
  } else {
    self.ops.log(
      "buff",
      `BUFF ${buffId} ${had ? "refresh" : "apply"} (source=${(source as any).name} target=${(target as any).name})`,
    );
  }
  return true;
}

export function resolveBuffExpiration(
  self: SimWorld,
  entityId: SimEntityId,
  buffId: BuffId,
) {
  // return false if expiration event is stale

  const ent = self.read.getEntity(entityId);
  if (!ent) throw new Error(`Unknown entity with entityId ${entityId}`);

  const buff = (ent as any).buffs?.[buffId];
  if (!buff) return false; // already removed or consumed

  const duration = buffsData[buffId].durationFrames ?? 0;
  if (duration <= 0) return false;
  if (self.read.nowInFrames >= buff.lastApplyFrame + duration) {
    self.ops.removeBuff(entityId, buffId);
    self.ops.log("buff", `BUFF ${buffId} expire (entity=${(ent as any).name})`);
    return true;
  }

  return false;
}

export function resolveInflictionExpiration(
  self: SimWorld,
  sourceId: SimEntityId,
  inflictionType: DamageType,
) {
  // return false if expiration event is stale

  const ent = self.read.getEntity(sourceId);
  if (!ent) throw new Error(`Unknown entity with entityId ${sourceId}`);

  const inf = (ent as any).inflictions?.[inflictionType];
  if (!inf) return false; // already removed or consumed

  // check if expiration event is stale
  if (
    self.read.nowInFrames >=
    inf.lastApplyFrame + DEFAULT_INFLICTION_DURATION_FRAMES
  ) {
    self.ops.removeInfliction(sourceId, inflictionType);
    self.ops.log(
      "buff",
      `INFLICTION ${inflictionType} expire (entity=${(ent as any).name})`,
    );
    return true;
  }
  return false;
}
