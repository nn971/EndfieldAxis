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
import {
  ARTS_INFLICTION_TYPE_LIST,
  isArtsInflictionType,
  type ArtsInflictionType,
  type InflictionType,
} from "../types/simulator/infliction";
import {
  SOLIDIFICATION_BUFF_ID,
  SOLIDIFICATION_INITIAL_HIT_BASE_MUL,
  SOLIDIFICATION_INITIAL_HIT_PER_STACK_MUL,
  SOLIDIFICATION_BASE_DURATION_FRAMES,
  SOLIDIFICATION_EXTRA_DURATION_PER_STACK_FRAMES,
} from "../data/buffs/reactions/solidification";
import {
  COMBUSTION_BUFF_ID,
  COMBUSTION_INITIAL_HIT_BASE_MUL,
  COMBUSTION_INITIAL_HIT_PER_STACK_MUL,
  COMBUSTION_DOT_BASE_MUL,
  COMBUSTION_DOT_PER_STACK_MUL,
} from "../data/buffs/reactions/combustion";
import {
  ELECTRIFICATION_BUFF_ID,
  ELECTRIFICATION_INITIAL_HIT_BASE_MUL,
  ELECTRIFICATION_INITIAL_HIT_PER_STACK_MUL,
  ELECTRIFICATION_BASE_DURATION_FRAMES,
  ELECTRIFICATION_EXTRA_DURATION_PER_STACK_FRAMES,
} from "../data/buffs/reactions/electrification";
import {
  CORROSION_BUFF_ID,
  CORROSION_INITIAL_HIT_BASE_MUL,
  CORROSION_INITIAL_HIT_PER_STACK_MUL,
  CORROSION_REDUCTION_PER_SECOND_BASE,
  CORROSION_REDUCTION_PER_SECOND_PER_STACK,
  CORROSION_MIN_RESISTANCE_BASE,
  CORROSION_MIN_RESISTANCE_PER_STACK,
} from "../data/buffs/reactions/corrosion";

// TODO: come up with a way to configure this
export const DEFAULT_INFLICTION_DURATION_FRAMES = 1800;

const EVENT_PREFIX = "SimEvent_";
function makeEventId() {
  return makeId(EVENT_PREFIX);
}

function scheduleApplyArtsInfliction(
  world: SimWorld,
  sourceId: SimEntityId,
  targetId: SimEntityId,
  inflictionType: ArtsInflictionType,
  ref?: string,
): void {
  const id = makeEventId();
  world.ops.schedule({
    id: id,
    type: "inflictionApply",
    frame: world.read.nowInFrames,
    seq: world.ops.nextSeq(),
    sourceId,
    targetId,
    inflictionType,
    inflictionStacks: 1,
    ref,
  } as SimEvent);
}

function scheduleApplyVulnerable(
  world: SimWorld,
  sourceId: SimEntityId,
  targetId: SimEntityId,
  ref?: string,
): void {
  const id = makeEventId();
  world.ops.schedule({
    id: id,
    type: "inflictionApply",
    frame: world.read.nowInFrames,
    seq: world.ops.nextSeq(),
    sourceId,
    targetId,
    inflictionType: "vulnerable",
    inflictionStacks: 1,
    ref,
  } as SimEvent);
}

/** compute the special multiplier for physical status */
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

  const levelMul = 1 + (level + 9) / 426.5; // TODO this formula need to be verified by tons of real data
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
      console.warn(
        `unknown statusType ${statusType} when computing special multiplier`,
      );
      baseMul = 1;
  }

  const finalMul = baseMul * levelMul * artsMul;
  // console.log(baseMul, levelMul, artsMul, finalMul);

  return finalMul;
}

/** WARNING: should not in use */
// function scheduleInflictionExpire(
//   world: SimWorld,
//   targetId: SimEntityId,
//   inflictionType: InflictionType,
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
  inflictionType: InflictionType,
  ref?: string,
): void {
  if (isArtsInfliction(inflictionType)) {
    scheduleApplyArtsInfliction(world, sourceId, targetId, inflictionType, ref);
    return;
  }

  scheduleApplyVulnerable(world, sourceId, targetId, ref);
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
  triggerPlugins: () => void,
  ev: Extract<SimEvent, { type: "statusApply" }>,
) {
  const sourceId = ev.sourceId;
  const targetId = ev.targetId;
  const statusType = ev.statusType;
  const ref = ev.id;

  const source = sourceId ? self.read.getEntity(sourceId) : null;

  const target = self.read.getEntity(targetId);
  if (!target) throw new Error(`Unknown target with targetId=${targetId}`);

  let shouldAddVulnerable =
    statusType === "lift" ||
    statusType === "breach" ||
    statusType === "crush" ||
    statusType === "knockDown";
  let shouldRemoveVulnerable = false;

  const current = (target as any).inflictions.vulnerable?.stacks ?? 0;
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
        hitTypes: { lift: true },
        dmgMultiplier: computePhysicalStatusSpecialMul(self, sourceId, "lift"),
      } as SimEvent);

      triggerPlugins();
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

      triggerPlugins();
      break;
    }

    case "crush": {
      if (current <= 0) break;

      // Has vulnerable: consume all stacks and trigger crush burst damage.
      shouldAddVulnerable = false;
      shouldRemoveVulnerable = true;

      triggerPlugins();

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

    case "breach": {
      // TODO: Add breached (or other name) debuff to enemy

      if (current <= 0) break;

      // Has vulnerable: consume all stacks and trigger breach burst damage.
      shouldRemoveVulnerable = true;
      shouldAddVulnerable = false;

      triggerPlugins();

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
    scheduleApplyVulnerable(self, sourceId, targetId, ref);
    const after = Math.min(4, current + 1);

    // self.ops.log(
    //   "buff",
    //   `${statusType}: vulnerable stacks ${current} -> ${after} (target=${(target as any).name})`,
    // );
  } else if (shouldRemoveVulnerable) {
    self.ops.removeInfliction(targetId, "vulnerable");

    self.ops.log(
      "buff",
      `${statusType}: vulnerable consumed=${current} (target=${(target as any).name})`,
    );
  }
}

export function resolveBuffApplication(
  self: SimWorld,
  ev: Extract<SimEvent, { type: "buffApply" }>,
) {
  const sourceId = ev.sourceId ?? null;
  const targetId = ev.targetId;
  const buffId = ev.buffId;

  const source = sourceId ? self.read.getEntity(sourceId) : null;

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
      `BUFF ${buffId} ${had ? "refresh" : "apply"} (source=${(source as any)?.name ?? "system"} target=${(target as any).name})`,
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
  //   `BUFF ${buffId} ${had ? "refresh" : "apply"} (source=${(source as any)?.name ?? "system"} target=${(target as any).name})`,
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
    meta:
      buffId === CORROSION_BUFF_ID && existing
        ? (existing as any).meta
        : ((ev as any).meta ?? (existing as any)?.meta),
  } as SimBuff);
  scheduleBuffExpire(self, targetId, buffId);

  if (maxStacks > 1) {
    self.ops.log(
      "buff",
      `BUFF ${buffId} stacks ${beforeStacks} -> ${afterStacks} (source=${(source as any)?.name ?? "system"} target=${(target as any).name})`,
    );
  } else {
    self.ops.log(
      "buff",
      `BUFF ${buffId} ${had ? "refresh" : "apply"} (source=${(source as any)?.name ?? "system"} target=${(target as any).name})`,
    );
  }
  return true;
}

export function resolveBuffExpiration(
  self: SimWorld,
  ev: Extract<SimEvent, { type: "buffExpire" }>,
) {
  // return false if expiration event is stale

  const ent = self.read.getEntity(ev.sourceId);
  if (!ent) throw new Error(`Unknown entity with entityId ${ev.sourceId}`);

  const buffId = ev.buffId;
  const buff = (ent as any).buffs?.[buffId];
  if (!buff) return false; // already removed or consumed

  const duration =
    buffId === SOLIDIFICATION_BUFF_ID
      ? SOLIDIFICATION_BASE_DURATION_FRAMES +
        Number((buff as any).stacks ?? 0) *
          SOLIDIFICATION_EXTRA_DURATION_PER_STACK_FRAMES
      : buffId === ELECTRIFICATION_BUFF_ID
        ? ELECTRIFICATION_BASE_DURATION_FRAMES +
          Number((buff as any).stacks ?? 0) *
            ELECTRIFICATION_EXTRA_DURATION_PER_STACK_FRAMES
        : (buffsData[buffId].durationFrames ?? 0);
  if (duration <= 0) return false;
  if (self.read.nowInFrames >= buff.lastApplyFrame + duration) {
    self.ops.removeBuff(ent.id, buffId);
    self.ops.log("buff", `BUFF ${buffId} expire (entity=${(ent as any).name})`);
    return true;
  }

  return false;
}

export function resolveInflictionApplication(
  self: SimWorld,
  ev: Extract<SimEvent, { type: "inflictionApply" }>,
) {
  const source = self.read.getEntity(ev.sourceId ?? null);
  if (!source) throw new Error(`Unknown source with sourceId=${ev.sourceId}`);

  const target = self.read.getEntity(ev.targetId ?? null);
  if (!target) throw new Error(`Unknown target with targetId=${ev.targetId}`);

  if (isArtsInflictionType(ev.inflictionType)) {
    const artsType = ev.inflictionType;
    const existingStacksByType = Object.fromEntries(
      ARTS_INFLICTION_TYPE_LIST.map(type => [
        type,
        Number(target.inflictions[type].stacks ?? 0),
      ]),
    ) as Record<ArtsInflictionType, number>;

    const currentSameTypeStacks = existingStacksByType[artsType];
    const nonSameTypeStacks = ARTS_INFLICTION_TYPE_LIST.filter(
      type => type !== artsType,
    ).reduce((sum, type) => sum + existingStacksByType[type], 0);
    const consumedArtsStacks = Object.values(existingStacksByType).reduce(
      (sum, stacks) => sum + stacks,
      0,
    );

    if (nonSameTypeStacks > 0) {
      for (const type of ARTS_INFLICTION_TYPE_LIST) {
        self.ops.removeInfliction(target.id, type);
      }

      let reactionBuffId: BuffId;
      let initialHitBaseMul: number;
      let initialHitPerStackMul: number;
      let buffStacks = consumedArtsStacks;
      let buffMeta: Record<string, unknown> | undefined;

      switch (artsType) {
        case "cryo":
          reactionBuffId = SOLIDIFICATION_BUFF_ID;
          initialHitBaseMul = SOLIDIFICATION_INITIAL_HIT_BASE_MUL;
          initialHitPerStackMul = SOLIDIFICATION_INITIAL_HIT_PER_STACK_MUL;
          break;
        case "heat":
          reactionBuffId = COMBUSTION_BUFF_ID;
          initialHitBaseMul = COMBUSTION_INITIAL_HIT_BASE_MUL;
          initialHitPerStackMul = COMBUSTION_INITIAL_HIT_PER_STACK_MUL;
          buffStacks = 1;
          buffMeta = {
            reactionSourceId: source.id,
            combustionTickMultiplier:
              COMBUSTION_DOT_BASE_MUL +
              consumedArtsStacks * COMBUSTION_DOT_PER_STACK_MUL,
          };
          break;
        case "electric":
          reactionBuffId = ELECTRIFICATION_BUFF_ID;
          initialHitBaseMul = ELECTRIFICATION_INITIAL_HIT_BASE_MUL;
          initialHitPerStackMul = ELECTRIFICATION_INITIAL_HIT_PER_STACK_MUL;
          break;
        case "nature":
          reactionBuffId = CORROSION_BUFF_ID;
          initialHitBaseMul = CORROSION_INITIAL_HIT_BASE_MUL;
          initialHitPerStackMul = CORROSION_INITIAL_HIT_PER_STACK_MUL;
          buffStacks = 1;
          buffMeta = {
            corrosionReductionPerSecond:
              CORROSION_REDUCTION_PER_SECOND_BASE +
              consumedArtsStacks * CORROSION_REDUCTION_PER_SECOND_PER_STACK,
            corrosionMinResistanceMul:
              CORROSION_MIN_RESISTANCE_BASE +
              consumedArtsStacks * CORROSION_MIN_RESISTANCE_PER_STACK,
          };
          break;
      }

      self.ops.schedule({
        id: makeEventId(),
        type: "hit",
        frame: self.nowInFrames,
        seq: self.ops.nextSeq(),
        sourceId: source.id,
        targetId: target.id,
        damageType: artsType,
        dmgMultiplier:
          initialHitBaseMul + consumedArtsStacks * initialHitPerStackMul,
        ref: ev.id,
      } as SimEvent);

      self.ops.upsertBuff(target.id, {
        id: reactionBuffId,
        lastApplyFrame: self.read.nowInFrames,
        stacks: buffStacks,
        meta: buffMeta,
      } as SimBuff);

      scheduleBuffExpire(self, target.id, reactionBuffId);

      const buffApplyEvent = {
        id: makeEventId(),
        type: "buffApply",
        frame: ev.frame,
        seq: self.ops.nextSeq(),
        sourceId: source.id,
        targetId: target.id,
        buffId: reactionBuffId,
        isForced: false,
        ref: ev.id,
      } as Extract<SimEvent, { type: "buffApply" }>;
      const onBuffApplySpawned = self.registry.runOnBuffApply({
        read: self.read,
        ev: buffApplyEvent,
        sourceId: source.id,
        targetId: target.id,
        nextSeq: self.ops.nextSeq,
        makeEventId: () => makeId("SimEvent_"),
      });
      for (const sev of onBuffApplySpawned) self.ops.schedule(sev);

      self.ops.log(
        "buff",
        `${reactionBuffId} triggered on ${(target as any).name}: consumed arts stacks=${consumedArtsStacks}`,
      );

      return;
    }

    const current = currentSameTypeStacks;
    self.ops.addInfliction(target.id, ev.inflictionType, ev.inflictionStacks);
    const after = target.inflictions[ev.inflictionType].stacks;
    self.ops.log(
      "buff",
      `${ev.inflictionType} infliction stacks ${current} -> ${after} (target=${(target as any).name})`,
    );

    const isBurstTrigger = current > 0;
    if (isBurstTrigger) {
      self.ops.schedule({
        id: makeEventId(),
        type: "hit",
        frame: self.read.nowInFrames + ARTS_BURST_DELAY_FRAMES,
        seq: self.ops.nextSeq(),
        sourceId: source.id,
        targetId: target.id,
        damageType: artsType,
        dmgMultiplier: ARTS_BURST_BASE_MUL + after * ARTS_BURST_PER_STACK_MUL,
        ref: ev.id,
      } as SimEvent);
    }
  } else {
    const current = target.inflictions[ev.inflictionType].stacks;
    self.ops.addInfliction(target.id, ev.inflictionType, ev.inflictionStacks);
    const after = target.inflictions[ev.inflictionType].stacks;
    self.ops.log(
      "buff",
      `${ev.inflictionType} infliction stacks ${current} -> ${after} (target=${(target as any).name})`,
    );
  }

  const spawned = self.registry.runOnInflictionApply({
    read: self.read,
    ev,
    sourceId: source.id,
    targetId: target.id,
    nextSeq: self.ops.nextSeq,
    makeEventId: () => makeId("SimEvent_"),
  });
  for (const sev of spawned) self.ops.schedule(sev);

  self.ops.schedule({
    id: makeEventId(),
    type: "inflictionExpire",
    frame: self.read.nowInFrames + DEFAULT_INFLICTION_DURATION_FRAMES,
    seq: self.ops.nextSeq(),
    sourceId: target.id,
    targetId: undefined,
    inflictionType: ev.inflictionType,
    ref: ev.id,
  } as SimEvent);
}

export function resolveInflictionExpiration(
  self: SimWorld,
  ev: Extract<SimEvent, { type: "inflictionExpire" }>,
) {
  // return false if expiration event is stale

  const ent = self.read.getEntity(ev.sourceId);
  if (!ent) throw new Error(`Unknown entity with entityId ${ev.sourceId}`);

  const inflictionType = ev.inflictionType;
  const inf = (ent as any).inflictions?.[inflictionType];
  if (!inf) return false; // already removed or consumed

  // check if expiration event is stale
  if (
    self.read.nowInFrames >=
    inf.lastApplyFrame + DEFAULT_INFLICTION_DURATION_FRAMES
  ) {
    self.ops.removeInfliction(ent.id, inflictionType);
    self.ops.log(
      "buff",
      `INFLICTION ${inflictionType} expire (entity=${(ent as any).name})`,
    );
    return true;
  }
  return false;
}
export const ARTS_BURST_DELAY_FRAMES = 12;
export const ARTS_BURST_BASE_MUL = 0.55;
export const ARTS_BURST_PER_STACK_MUL = 0.25;
