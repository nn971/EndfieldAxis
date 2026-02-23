import { makeId } from "../shared/lib/id";
import type { SimEntityId, SimEvent } from "../types/simulator/simulator";
import {
  type SimStatusType,
  type SimInfliction,
  type SimBuff,
} from "../types/simulator/infliction";
import { BuffId } from "../data/buffs/BuffDef";
import { buildDamageContext } from "./damage/damageEngine";
import { SimWorld } from "./simulator";
import buffsData from "../data/buffs";
import { DamageType } from "../types/operator";

// TODO: come up with a way to configure this
const DEFAULT_INFLICTION_DURATION_FRAMES = 1800;

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
  inflictionType: DamageType,
): void {
  world.ops.schedule({
    id: makeEventId(),
    type: "inflictionExpire",
    frame: world.read.nowInFrames + DEFAULT_INFLICTION_DURATION_FRAMES,
    seq: world.ops.nextSeq(),
    sourceId: targetId,
    targetId,
    inflictionType,
    ref: "auto",
  } as SimEvent);
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

  switch (statusType) {
    case "lift": {
      const current = (target as any).inflictions.physical?.stacks ?? 0;

      if (current <= 0) {
        self.ops.upsertInfliction(targetId, {
          type: "physical",
          stacks: 1,
          lastApplyFrame: self.read.nowInFrames,
        } as SimInfliction);

        scheduleInflictionExpire(self, targetId, "physical");
        self.ops.log(
          "buff",
          `INFLICTION vulnerable apply (by LIFT, target=${(target as any).name})`,
        );
        return false;
      } else {
        // Has vulnerable: add 1 stack (cap 4) and trigger lift proc damage.
        const before = current;
        const after = Math.min(4, before + 1);
        self.ops.upsertInfliction(targetId, {
          type: "physical",
          stacks: after,
          lastApplyFrame: self.read.nowInFrames,
        } as SimInfliction);

        scheduleInflictionExpire(self, targetId, "physical");

        self.ops.log(
          "buff",
          `LIFT: vulnerable stacks ${before} -> ${after} (target=${(target as any).name})`,
        );

        // Schedule lift proc damage as a hit event so it can interleave with other same-frame effects.
        self.ops.schedule({
          id: makeEventId(),
          type: "hit",
          frame: self.read.nowInFrames,
          seq: self.ops.nextSeq(),
          sourceId,
          targetId,
          damageType: "physical" as any,
          HitType: "lift",
          dmgMultiplier: 1,
        } as SimEvent);

        // const ctx = buildDamageContext({
        //   registry: self.registry,
        //   read: self.read,
        //   frame: self.read.nowInFrames,
        //   kind: "lift",
        //   sourceId,
        //   targetId,
        //   dmgSkillMultiplier: 1,
        //   meta: {
        //     note: `liftProc stacksBefore=${before} stacksAfter=${after}`,
        //   },
        // });

        // const res = self.damageModel.compute(ctx);
        // self.ops.applyDamage(targetId, res.amount);
        // const targetAfter = self.read.getEntity(targetId);

        // // TODO: replace debug log with exact breakdown UI.
        // self.ops.log(
        //   "dmg",
        //   `  DMG(liftProc)=${res.amount} incomingInc=${res.breakdown.rcvDmgIncMul.toFixed(
        //     2,
        //   )} special=${res.breakdown.specialMul.toFixed(2)} hp=${(targetAfter as any).hp}`,
        //   ctx,
        //   res.breakdown,
        //   res.amount,
        // );

        return true;
      }
    }

    case "crush": {
      const current = (target as any).inflictions.physical?.stacks ?? 0;

      if (current <= 0) {
        self.ops.upsertInfliction(targetId, {
          type: "physical",
          stacks: 1,
          lastApplyFrame: self.read.nowInFrames,
        } as SimInfliction);

        scheduleInflictionExpire(self, targetId, "physical");
        self.ops.log(
          "buff",
          `INFLICTION vulnerable apply (by CRUSH, target=${(target as any).name})`,
        );
        return false;
      }

      // Has vulnerable: consume all stacks and trigger crush burst damage.
      const consumed = current;
      self.ops.removeInfliction(targetId, "physical");

      self.ops.log(
        "buff",
        `CRUSHED: vulnerable consumed=${consumed} (target=${(target as any).name})`,
      );

      // Schedule crush burst damage as a hit event so it can interleave with other same-frame effects.
      self.ops.schedule({
        id: makeEventId(),
        type: "hit",
        frame: self.read.nowInFrames,
        seq: self.ops.nextSeq(),
        sourceId,
        targetId,
        damageType: "physical" as any,
        HitType: "crush",
        // TEMP: more stacks => larger skill multiplier.
        dmgMultiplier: consumed * CRUSH_BURST_SKILL_MUL_PER_STACK,
      } as SimEvent);

      // const ctx = buildDamageContext({
      //   registry: self.registry,
      //   read: self.read,
      //   frame: self.read.nowInFrames,
      //   kind: "crush",
      //   sourceId,
      //   targetId,
      //   // TEMP: more stacks => larger skill multiplier.
      //   dmgSkillMultiplier: consumed * CRUSH_BURST_SKILL_MUL_PER_STACK,
      //   meta: {
      //     note: `crushBurst consumed=${consumed}`,
      //   },
      // });

      // const res = self.damageModel.compute(ctx);
      // self.ops.applyDamage(targetId, res.amount);
      // const targetAfter = self.read.getEntity(targetId);

      // // TODO: exact crush scaling & rounding
      // self.ops.log(
      //   "dmg",
      //   `  DMG(crushBurst)=${res.amount} incomingInc=${res.breakdown.rcvDmgIncMul.toFixed(
      //     2,
      //   )} special=${res.breakdown.specialMul.toFixed(2)} hp=${(targetAfter as any).hp}`,
      //   ctx,
      //   res.breakdown,
      //   res.amount,
      // );

      return true;
    }

    default: {
      throw new Error(`Unhandled statusType=${statusType}`);
    }
  }
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

  if (buffId === "crystal") {
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
