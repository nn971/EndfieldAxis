import type {
  SimEntity,
  SimEntityId,
  SimEvent,
} from "../types/simulator/simulator";
import {
  type SimStatusType,
  type SimInfliction,
  type SimBuff,
} from "../types/simulator/infliction";
import { BuffId } from "../data/buffs/BuffDef";
import { SimRead, SimWorld } from "./simulator";
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
  COMBUSTION_DOT_INTERVAL_FRAMES,
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
import { makeSimEventId } from "../shared/lib/utils";
import { buildDamageContext } from "./damage/damageEngine";
import operatorsData from "../data/operators";
import { SimEventWhen } from "../types/simulator/when";

// TODO: come up with a way to configure this
export const DEFAULT_INFLICTION_DURATION_FRAMES = 1800;

export const ARTS_BURST_DELAY_FRAMES = 12;
export const ARTS_BURST_BASE_MUL = 0.55;
export const ARTS_BURST_PER_STACK_MUL = 0.25;

export const COMBO_AVAILABLE_WINDOW_FRAMES = 300;

export function validateEventWhen(
  read: SimRead,
  ev: SimEvent,
): { isValid: boolean; reason?: string } {
  const when = ev.when;
  if (!when) return { isValid: true };

  const sourceId = "sourceId" in ev ? ev.sourceId : undefined;
  const targetId = "targetId" in ev ? ev.targetId : undefined;

  return validateWhenAgainstEvent(read, ev, when, { sourceId, targetId });
}

function validateWhenAgainstEvent(
  read: SimRead,
  ev: SimEvent,
  when: SimEventWhen,
  context: {
    sourceId?: SimEntityId;
    targetId?: SimEntityId;
  },
): { isValid: boolean; reason?: string } {
  if (when.sourceOperatorId && context.sourceId !== when.sourceOperatorId) {
    return {
      isValid: false,
      reason: `sourceOperatorId mismatch (expected=${when.sourceOperatorId}, actual=${context.sourceId ?? "undefined"})`,
    };
  }

  if (when.sourceWeaponId) {
    if (!context.sourceId) {
      return {
        isValid: false,
        reason: `sourceWeaponId requires sourceId`,
      };
    }
    const sourceBuild = read.getBuild(context.sourceId);
    const weaponId = sourceBuild?.weapon.id;
    if (weaponId !== when.sourceWeaponId) {
      return {
        isValid: false,
        reason: `sourceWeaponId mismatch (expected=${when.sourceWeaponId}, actual=${weaponId ?? "undefined"})`,
      };
    }
  }

  if (when.buffId) {
    if (!("buffId" in ev)) {
      return {
        isValid: false,
        reason: `buffId requires a buff event`,
      };
    }
    if (ev.buffId !== when.buffId) {
      return {
        isValid: false,
        reason: `buffId mismatch (expected=${when.buffId}, actual=${ev.buffId})`,
      };
    }
  }

  if (when.ownerHasBuffId) {
    const targetId = "targetId" in ev ? ev.targetId : undefined;
    if (!targetId) {
      return {
        isValid: false,
        reason: `ownerHasBuffId requires targetId`,
      };
    }
    const owner = read.getEntity(targetId);
    if (!(owner as any)?.buffs?.[when.ownerHasBuffId]) {
      return {
        isValid: false,
        reason: `owner missing buff ${when.ownerHasBuffId}`,
      };
    }
  }

  if (when.targetHasBuffId) {
    if (!context.targetId) {
      return {
        isValid: false,
        reason: `targetHasBuffId requires targetId`,
      };
    }
    const target = read.getEntity(context.targetId);
    if (!(target as any)?.buffs?.[when.targetHasBuffId]) {
      return {
        isValid: false,
        reason: `target missing buff ${when.targetHasBuffId}`,
      };
    }
  }

  return { isValid: true };
}

function scheduleApplyVulnerable(
  world: SimWorld,
  sourceId: SimEntityId,
  targetId: SimEntityId,
  ref?: string,
): void {
  const id = makeSimEventId();
  world.ops.schedule({
    id: id,
    type: "inflictionApply",
    frame: world.read.nowInFrames,
    seq: world.ops.nextSeq(),
    sourceId,
    targetId: targetId,
    inflictionType: "vulnerable",
    inflictionStacks: 1,
    ref,
  } as SimEvent);
}

function scheduleInflictionRemove(
  world: SimWorld,
  targetId: SimEntityId,
  inflictionType: InflictionType,
  ref?: string,
): void {
  world.ops.schedule({
    id: makeSimEventId(),
    type: "inflictionRemove",
    frame: world.read.nowInFrames,
    seq: world.ops.nextSeq(),
    targetId,
    inflictionType,
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
    id: makeSimEventId(),
    type: "buffExpire",
    frame: world.read.nowInFrames + duration,
    seq: world.ops.nextSeq(),
    targetId: targetId,
    buffId: buffId,
    ref: "auto",
  } as SimEvent);
}

function getCastStartForEvent(
  read: SimRead,
  ev: SimEvent,
): Extract<SimEvent, { type: "castStart" }> | null {
  let ref = ev.ref;
  let hops = 0;
  while (typeof ref === "string" && hops < 16) {
    const parent = read.getEvent(ref);
    if (!parent) return null;
    if (parent.type === "castStart") return parent;
    ref = parent.ref;
    hops += 1;
  }
  return null;
}

function getComboUltimateGain(operatorId: SimEntityId): number {
  const opDef = operatorsData[operatorId];
  const raw = Number(opDef?.getComboUltimateEnergyGainOnHit?.() ?? 6.5);
  return Number.isFinite(raw) ? Math.max(0, raw) : 6.5;
}

function getUltimateGainEfficiency(
  read: SimRead,
  operatorId: SimEntityId,
): number {
  const build = read.getBuild(operatorId);
  const raw = Number(build?.restStat?.ultimateGainEfficiency ?? 0);
  return Math.max(0, Number.isFinite(raw) ? raw : 0);
}

function scheduleComboTriggerElapse(
  world: SimWorld,
  operatorId: SimEntityId,
  triggerEventId: string,
  frame: number,
): void {
  world.ops.schedule({
    id: makeSimEventId(),
    type: "comboTriggerElapse",
    frame: frame + COMBO_AVAILABLE_WINDOW_FRAMES,
    seq: world.ops.nextSeq(),
    sourceId: operatorId,
    ref: triggerEventId,
  });
}

export function resolveCastStart(
  self: SimWorld,
  ev: Extract<SimEvent, { type: "castStart" }>,
) {
  const source = ev.sourceId
    ? (self.read.getEntity(ev.sourceId) as SimEntity)
    : null;
  const target = ev.targetId
    ? (self.read.getEntity(ev.targetId) as SimEntity)
    : null;
  const comboLegal = ev.comboValidation?.isLegal ?? true;
  const comboReason = ev.comboValidation?.reason;
  if (!comboLegal) {
    self.ops.log(
      "act",
      `"${source?.name}" failed to cast "${ev.skillType}" (${comboReason ?? "illegal combo cast"})`,
    );
  }

  if (ev.skillType === "normalSkill") {
    const spendRes = self.spendTeamSp(100, ev.frame);
    self.normalSkillCastById.set(ev.id, {
      spent: spendRes.spent,
      realSpent: spendRes.realSpent,
      fakeSpent: spendRes.fakeSpent,
      lastHitEventId: self.findLastHitEventIdForCast(ev.id),
    });
    if (!spendRes.isLegal) {
      self.ops.log(
        "act",
        `"${source?.name}" normal skill cast with insufficient SP (spent ${spendRes.spent.toFixed(2)}/100)`,
      );
    }
  }

  if (ev.skillType === "ultimate") {
    const spendRes = self.spendUltimateEnergy(ev.sourceId);
    if (!spendRes.isLegal) {
      self.ops.log(
        "act",
        `"${source?.name}" ultimate cast with insufficient ultimate energy (spent ${spendRes.spent.toFixed(2)}/${spendRes.cost.toFixed(2)})`,
      );
    }
  }

  self.ops.log(
    "act",
    `"${source?.name}" cast "${ev.skillType}" on "${target?.name}"`,
  );

  const spawned = self.registry.runOnCastStart({
    read: self.read,
    ev: ev,
    sourceId: ev.sourceId,
    targetId: ev.targetId,
  });
  self.ops.scheduleDrafts(spawned);
}

export function resolveCastEnd(
  self: SimWorld,
  ev: Extract<SimEvent, { type: "castEnd" }>,
) {
  const source = ev.sourceId
    ? (self.read.getEntity(ev.sourceId) as SimEntity)
    : null;
  const target = ev.targetId
    ? (self.read.getEntity(ev.targetId) as SimEntity)
    : null;
  self.ops.log(
    "act",
    `"${source?.name}" finished casting "${ev.skillType}" on "${target?.name}"`,
  );

  const spawned = self.registry.runOnCastEnd({
    read: self.read,
    ev: ev,
    sourceId: ev.sourceId,
    targetId: ev.targetId,
  });
  self.ops.scheduleDrafts(spawned);
}

export function resolveHit(
  self: SimWorld,
  ev: Extract<SimEvent, { type: "hit" }>,
) {
  const source = ev.sourceId
    ? (self.read.getEntity(ev.sourceId) as SimEntity)
    : null;
  const target = ev.targetId
    ? (self.read.getEntity(ev.targetId) as SimEntity)
    : null;
  if (!target) throw new Error(`undefined target`);
  if (!source) throw new Error(`undefined source`);

  const parentCastStart = getCastStartForEvent(self.read, ev);

  const dmgSkillMultiplier = Number(ev.dmgMultiplier ?? 1);

  const ctx = buildDamageContext({
    registry: self.registry,
    read: self.read,
    frame: ev.frame,
    damageType: ev.damageType,
    sourceId: source.id,
    targetId: target.id,
    dmgSkillMultiplier,
    ev,
    meta: {
      note: `source=${source.name} target=${target.name}`,
      hitEvent: ev,
    },
  });

  const res = self.damageModel.compute(ctx);
  self.ops.applyDamage(target.id, res.amount);

  const targetAfter = self.read.getEntity(target.id);

  self.ops.log(
    "dmg",
    `"${source.name}" hit "${target.name}" for ${res.amount} damage (hp left: ${(targetAfter as any).hp})`,
    ctx,
    res.breakdown,
    res.amount,
  );

  if (parentCastStart?.skillType === "comboSkill") {
    const gainBase = getComboUltimateGain(parentCastStart.sourceId);
    const efficiency = getUltimateGainEfficiency(
      self.read,
      parentCastStart.sourceId,
    );
    const gain = gainBase * (1 + efficiency);
    const gained = self.ops.gainUltimateEnergy(parentCastStart.sourceId, gain);
    if (gained > 0) {
      self.ops.log(
        "act",
        `"${source.name}" gained ${gained.toFixed(2)} ultimate energy from combo hit`,
      );
    }
  }

  if (parentCastStart?.skillType === "normalSkill") {
    const castState = self.normalSkillCastById.get(parentCastStart.id);
    if (castState && castState.lastHitEventId === ev.id) {
      const ratio = Math.max(0, Math.min(1, castState.realSpent / 100));
      const baseGain = 6.5 * ratio;
      const efficiency = getUltimateGainEfficiency(
        self.read,
        parentCastStart.sourceId,
      );
      const gain = baseGain * (1 + efficiency);
      const gained = self.ops.gainUltimateEnergy(
        parentCastStart.sourceId,
        gain,
      );
      if (gained > 0) {
        const owner = self.read.getEntity(parentCastStart.sourceId);
        self.ops.log(
          "act",
          `"${owner?.name}" gained ${gained.toFixed(2)} ultimate energy from normal skill hit`,
        );
      }
    }
  }

  const spawned = self.registry.runAfterHit({
    read: self.read,
    ev: ev,
    sourceId: source.id,
    targetId: target.id,
  });
  self.ops.scheduleDrafts(spawned);
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
        id: makeSimEventId(),
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
        id: makeSimEventId(),
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
        id: makeSimEventId(),
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
        id: makeSimEventId(),
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
    scheduleInflictionRemove(self, targetId, "vulnerable", ev.id);

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
    self.ops.addBuff(targetId, {
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
  self.ops.addBuff(targetId, {
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

  const ent = self.read.getEntity(ev.targetId);
  if (!ent) throw new Error(`Unknown entity with entityId ${ev.targetId}`);

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

  const owner = self.read.getEntity(ev.targetId ?? null);
  if (!owner) throw new Error(`Unknown target with targetId=${ev.targetId}`);

  if (isArtsInflictionType(ev.inflictionType)) {
    const artsType = ev.inflictionType;
    const existingStacksByType = Object.fromEntries(
      ARTS_INFLICTION_TYPE_LIST.map(type => [
        type,
        Number(owner.inflictions[type].stacks ?? 0),
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
        scheduleInflictionRemove(self, owner.id, type, ev.id);
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
        id: makeSimEventId(),
        type: "hit",
        frame: self.nowInFrames,
        seq: self.ops.nextSeq(),
        sourceId: source.id,
        targetId: owner.id,
        damageType: artsType,
        dmgMultiplier:
          initialHitBaseMul + consumedArtsStacks * initialHitPerStackMul,
        ref: ev.id,
      } as SimEvent);

      self.ops.schedule({
        id: makeSimEventId(),
        type: "buffApply",
        frame: ev.frame,
        seq: self.ops.nextSeq(),
        sourceId: source.id,
        targetId: owner.id,
        buffId: reactionBuffId,
        isForced: false,
        ref: ev.id,
      } as Extract<SimEvent, { type: "buffApply" }>);

      scheduleBuffExpire(self, owner.id, reactionBuffId);

      self.ops.log(
        "buff",
        `${reactionBuffId} triggered on ${(owner as any).name}: consumed arts stacks=${consumedArtsStacks}`,
      );
      self.ops.log(
        "buff",
        `Arts Reaction consumed inflictions on ${(owner as any).name}`,
      );

      return;
    }

    const current = currentSameTypeStacks;
    self.ops.addInfliction(owner.id, ev.inflictionType, ev.inflictionStacks);
    const after = owner.inflictions[ev.inflictionType].stacks;
    self.ops.log(
      "buff",
      `${ev.inflictionType} infliction stacks ${current} -> ${after} (target=${(owner as any).name})`,
    );

    const isBurstTrigger = current > 0;
    if (isBurstTrigger) {
      self.ops.schedule({
        id: makeSimEventId(),
        type: "hit",
        frame: self.read.nowInFrames + ARTS_BURST_DELAY_FRAMES,
        seq: self.ops.nextSeq(),
        sourceId: source.id,
        targetId: owner.id,
        damageType: artsType,
        dmgMultiplier: ARTS_BURST_BASE_MUL + after * ARTS_BURST_PER_STACK_MUL,
        ref: ev.id,
      } as SimEvent);
    }
  } else {
    const current = owner.inflictions[ev.inflictionType].stacks;
    self.ops.addInfliction(owner.id, ev.inflictionType, ev.inflictionStacks);
    const after = owner.inflictions[ev.inflictionType].stacks;
    self.ops.log(
      "buff",
      `${ev.inflictionType} infliction stacks ${current} -> ${after} (target=${(owner as any).name})`,
    );
  }

  const spawned = self.registry.runOnInflictionApply({
    read: self.read,
    ev,
    sourceId: source.id,
    targetId: owner.id,
  });
  self.ops.scheduleDrafts(spawned);

  self.ops.schedule({
    id: makeSimEventId(),
    type: "inflictionExpire",
    frame: self.read.nowInFrames + DEFAULT_INFLICTION_DURATION_FRAMES,
    seq: self.ops.nextSeq(),
    targetId: owner.id,
    inflictionType: ev.inflictionType,
    ref: ev.id,
  } as SimEvent);
}

export function resolveInflictionExpiration(
  self: SimWorld,
  ev: Extract<SimEvent, { type: "inflictionExpire" }>,
) {
  // return false if expiration event is stale

  const ent = self.read.getEntity(ev.targetId);
  if (!ent) throw new Error(`Unknown entity with entityId ${ev.targetId}`);

  const inflictionType = ev.inflictionType;
  const inf = (ent as any).inflictions?.[inflictionType];
  if (!inf) return false; // already removed or consumed

  // check if expiration event is stale
  if (
    self.read.nowInFrames >=
    inf.lastApplyFrame + DEFAULT_INFLICTION_DURATION_FRAMES
  ) {
    scheduleInflictionRemove(self, ent.id, inflictionType, ev.id);
    self.ops.log(
      "buff",
      `INFLICTION ${inflictionType} expire (entity=${(ent as any).name})`,
    );
    return true;
  }
  return false;
}

export function resolveInflictionRemoval(
  self: SimWorld,
  ev: Extract<SimEvent, { type: "inflictionRemove" }>,
) {
  self.ops.removeInfliction(ev.targetId, ev.inflictionType);
}

export function resolveReactionTick(
  self: SimWorld,
  ev: Extract<SimEvent, { type: "reactionTick" }>,
) {
  const tickTarget = self.read.getEntity(ev.targetId ?? null);
  if (!tickTarget) return;
  if (ev.reactionBuffId !== COMBUSTION_BUFF_ID) return;

  const combustion = (tickTarget as any).buffs?.[COMBUSTION_BUFF_ID] as
    | SimBuff
    | undefined;
  if (!combustion) return;

  const tickSourceId = String(
    (combustion as any).meta?.reactionSourceId ?? ev.sourceId,
  );
  if (!tickSourceId) return;

  const tickMultiplier = Number(
    (combustion as any).meta?.combustionTickMultiplier ?? 0,
  );
  if (tickMultiplier > 0) {
    self.ops.schedule({
      id: makeSimEventId(),
      type: "hit",
      frame: ev.frame,
      seq: self.ops.nextSeq(),
      sourceId: tickSourceId,
      targetId: ev.targetId,
      damageType: "heat",
      dmgMultiplier: tickMultiplier,
      ref: ev.id,
    } as SimEvent);
  }

  self.ops.schedule({
    id: makeSimEventId(),
    type: "reactionTick",
    frame: ev.frame + COMBUSTION_DOT_INTERVAL_FRAMES,
    seq: self.ops.nextSeq(),
    sourceId: tickSourceId,
    targetId: ev.targetId,
    reactionBuffId: COMBUSTION_BUFF_ID,
    ref: ev.id,
  } as SimEvent);
}

export function resolveComboTriggered(
  self: SimWorld,
  ev: Extract<SimEvent, { type: "comboTriggered" }>,
) {
  const sourceId = ev.sourceId;
  const sourceEnt = self.read.getEntity(sourceId);
  if (!sourceEnt) throw new Error(`Can not find entity id=(${sourceId})`);
  if (sourceEnt.type !== "operator") return;

  const accepted = self.ops.triggerCombo(sourceId, ev.frame);
  if (!accepted) return;

  scheduleComboTriggerElapse(self, sourceId, ev.id, ev.frame);
  self.ops.log("act", `"${sourceEnt.name}" combo triggered`);
}

export function resolveComboTriggerElapse(
  self: SimWorld,
  ev: Extract<SimEvent, { type: "comboTriggerElapse" }>,
) {
  const sourceId = ev.sourceId;
  const sourceEnt = self.read.getEntity(sourceId);
  if (!sourceEnt) throw new Error(`Can not find entity id=(${sourceId})`);
  if (sourceEnt.type !== "operator") return;

  const combo = sourceEnt.combo;
  if (!combo) return;
  if (!combo.pending) return;
  if (combo.availableUntilFrame > ev.frame) return;

  combo.pending = false;
  combo.availableUntilFrame = -1;
  self.removeFromComboQueue(sourceId);
  self.ops.log("act", `"${sourceEnt.name}" combo trigger elapsed`);
}

export function resolveComboCooldownEnd(
  self: SimWorld,
  ev: Extract<SimEvent, { type: "comboCooldownEnd" }>,
) {
  const sourceId = ev.sourceId;
  const sourceEnt = self.read.getEntity(sourceId);
  if (!sourceEnt) throw new Error(`Can not find entity id=(${sourceId})`);
  if (sourceEnt.type !== "operator") return;

  const combo = sourceEnt.combo;
  if (!combo) return;
  combo.cooldown = 0;
}

export function resolveSpRecover(
  self: SimWorld,
  ev: Extract<SimEvent, { type: "spRecover" }>,
) {
  const gained = self.ops.recoverTeamSp(ev.amount, ev.frame);

  self.ops.log(
    "act",
    `team SP recover ${gained.toFixed(2)} from ${ev.sourceId} (real=${self.env.resources.teamSp.real.toFixed(2)}, fake=${self.env.resources.teamSp.fake.toFixed(2)})`,
  );
}

export function resolveSpReturn(
  self: SimWorld,
  ev: Extract<SimEvent, { type: "spReturn" }>,
) {
  const gained = self.ops.returnTeamSp(ev.amount, ev.frame);

  self.ops.log(
    "act",
    `team SP return ${gained.toFixed(2)} from ${ev.sourceId} (real=${self.env.resources.teamSp.real.toFixed(2)}, fake=${self.env.resources.teamSp.fake.toFixed(2)})`,
  );
}
