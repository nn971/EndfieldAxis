import { makeId } from "../shared/lib/id";
import {
  SimEntityId,
  SimEntity,
  SimEnv,
  SimWorld,
  SimEvent,
} from "../types/sim/simulator";
import {
  SimStatusType,
  SimInfliction,
  SimInflictionType,
  SimBuffType,
  SimBuff,
} from "../types/sim/infliction";
import { pushLog } from "./log";
import { schedule } from "./sim";

// -----------------------------------------------------------------------------
// TEMP balancing constants
// -----------------------------------------------------------------------------
// TODO: move these into data-driven content (json/yml) once we have a stable schema.

const DEFAULT_INFLICTION_DURATION_FRAMES = 1800;
const MAX_VULNERABLE_STACKS = 4;

// "crystal" is a debuff on enemy:
// - lasts for 300 frames
// - increases physical damage suffered by 20%
// TODO: implement real damage model; for now we only log isCrystaled and multipliers.
export const CRYSTAL_DURATION_FRAMES = 300;
export const CRYSTAL_PHYSICAL_TAKEN_MULTIPLIER = 1.2;

// Physical status "lift" extra damage multiplier (fixed per your current prototype).
export const LIFT_STATUS_DAMAGE_MULTIPLIER = 1.2;

const EVENT_PREFIX = "SimEvent_";
function makeEventId() {
  return makeId(EVENT_PREFIX);
}

export function resolveStatusApplication(
  world: SimWorld, // mutable
  log: string[],
  targetId: SimEntityId,
  statusType: SimStatusType,
  nextSeq: () => number,
  sourceId?: SimEntityId,
) {
  /* directly mutate world, target and log via reference */

  const target = world.env.entitiesById[targetId];
  if (!target) throw new Error(`Unknown target with targetId=${targetId}`);

  switch (statusType) {
    case "crush": {
      const currentVulnerableStacks =
        target.inflictions.vulnerable?.stacks ?? 0;
      if (currentVulnerableStacks == 0) {
        target.inflictions.vulnerable = {
          type: "vulnerable",
          stacks: 1,
          lastApplyFrame: world.nowInFrame,
        } as SimInfliction;

        schedule(world.futureEvents, {
          id: makeEventId(),
          type: "inflictionExpire",
          frame: world.nowInFrame + DEFAULT_INFLICTION_DURATION_FRAMES,
          seq: nextSeq(),

          sourceId: targetId,
          inflictionType: "vulnerable",
        } as SimEvent);
        pushLog(
          log,
          world.nowInFrame,
          `INFLICTION vulnerable apply (target=${target.name})`,
        );
      } else {
        const isCrystaled = Boolean(target.buffs?.crystal);
        const dmgTakenMultiplier = isCrystaled
          ? CRYSTAL_PHYSICAL_TAKEN_MULTIPLIER
          : 1;

        // NOTE: Crush consumes ALL Vulnerable stacks and removes the infliction immediately.
        // TODO: compute actual damage based on stacksConsumed, operator build, enemy debuffs, etc.
        pushLog(
          log,
          world.nowInFrame,
          `CRUSH: ${target.name} stacksConsumed=${currentVulnerableStacks} isCrystaled=${isCrystaled} dmgTakenMultiplier=${dmgTakenMultiplier} // TODO damage`,
        );

        delete target.inflictions.vulnerable;
        pushLog(
          log,
          world.nowInFrame,
          `INFLICTION vulnerable removed (target=${target.name})`,
        );
      }
      return true;
    }

    case "lift": {
      const before = target.inflictions.vulnerable?.stacks ?? 0;

      if (before === 0) {
        // If target is NOT Vulnerable, Lift only applies Vulnerable(1).
        target.inflictions.vulnerable = {
          type: "vulnerable",
          stacks: 1,
          lastApplyFrame: world.nowInFrame,
        } as SimInfliction;

        schedule(world.futureEvents, {
          id: makeEventId(),
          type: "inflictionExpire",
          frame: world.nowInFrame + DEFAULT_INFLICTION_DURATION_FRAMES,
          seq: nextSeq(),

          sourceId: targetId,
          inflictionType: "vulnerable",
        } as SimEvent);

        pushLog(
          log,
          world.nowInFrame,
          `INFLICTION vulnerable apply (target=${target.name})`,
        );
        return true;
      }

      // If target is already Vulnerable, Lift increases Vulnerable stacks (+1, cap 4)
      // and triggers a Lift status damage instance.
      const after = Math.min(MAX_VULNERABLE_STACKS, before + 1);
      target.inflictions.vulnerable.stacks = after;
      target.inflictions.vulnerable.lastApplyFrame = world.nowInFrame;

      // Refresh duration on stack changes.
      schedule(world.futureEvents, {
        id: makeEventId(),
        type: "inflictionExpire",
        frame: world.nowInFrame + DEFAULT_INFLICTION_DURATION_FRAMES,
        seq: nextSeq(),

        sourceId: targetId,
        inflictionType: "vulnerable",
      } as SimEvent);

      pushLog(
        log,
        world.nowInFrame,
        `INFLICTION vulnerable +1 (${before} -> ${after}) (target=${target.name})`,
      );

      const isCrystaled = Boolean(target.buffs?.crystal);
      const dmgTakenMultiplier = isCrystaled
        ? CRYSTAL_PHYSICAL_TAKEN_MULTIPLIER
        : 1;
      // TODO: compute actual lift damage. For now we only log the multipliers.
      pushLog(
        log,
        world.nowInFrame,
        `LIFT: ${target.name} dmgMultiplier=${LIFT_STATUS_DAMAGE_MULTIPLIER} isCrystaled=${isCrystaled} dmgTakenMultiplier=${dmgTakenMultiplier} // TODO damage`,
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
  log: string[],
  targetId: SimEntityId,
  buffType: SimBuffType,
  nextSeq: () => number,
  sourceId?: SimEntityId,
) {
  const target = world.env.entitiesById[targetId];
  if (!target) throw new Error(`Unknown target with targetId=${targetId}`);

  // For now we only have one timed buff/debuff: crystal.
  const durationFrames = buffType === "crystal" ? CRYSTAL_DURATION_FRAMES : 0;

  // Refresh semantics: re-applying an already active buff refreshes its duration.
  target.buffs[buffType] = {
    type: buffType,
    lastApplyFrame: world.nowInFrame,
  } as SimBuff;

  schedule(world.futureEvents, {
    id: makeEventId(),
    type: "buffExpire",
    frame: world.nowInFrame + durationFrames,
    seq: nextSeq(),

    targetId,
    buffType,
  } as SimEvent);

  pushLog(
    log,
    world.nowInFrame,
    `BUFF ${buffType} apply/refresh (target=${target.name} duration=${durationFrames})`,
  );
  return true;
}

export function resolveInflictionExpiration(
  world: SimWorld,
  log: string[],
  sourceId: SimEntityId,
  inflictionType: SimInflictionType,
) {
  // return false if expiration event is stale

  const ent = world.env.entitiesById[sourceId];
  if (!ent) throw new Error(`Unknown entity with entityId ${sourceId}`);

  const inf = ent.inflictions?.[inflictionType];
  if (!inf) {
    // already removed (e.g. consumed by Crush) or never existed
    return false;
  }

  // check if expiration event is stale
  if (
    world.nowInFrame >=
    inf.lastApplyFrame + DEFAULT_INFLICTION_DURATION_FRAMES
  ) {
    delete ent.inflictions[inflictionType];
    pushLog(
      log,
      world.nowInFrame,
      `INFLICTION ${inflictionType} expire: (entity=${ent.name})`,
    );
    return true;
  }
  return false;
}

export function resolveBuffExpiration(
  world: SimWorld,
  log: string[],
  targetId: SimEntityId,
  buffType: SimBuffType,
) {
  const ent = world.env.entitiesById[targetId];
  if (!ent) throw new Error(`Unknown entity with entityId ${targetId}`);

  const buff = ent.buffs?.[buffType];
  if (!buff) return false;

  const durationFrames = buffType === "crystal" ? CRYSTAL_DURATION_FRAMES : 0;

  // stale-event guard: if refreshed, lastApplyFrame will be later.
  if (world.nowInFrame >= buff.lastApplyFrame + durationFrames) {
    delete ent.buffs[buffType];
    pushLog(
      log,
      world.nowInFrame,
      `BUFF ${buffType} expire (entity=${ent.name})`,
    );
    return true;
  }
  return false;
}
