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
import { makeSimEventId } from "../shared/lib/utils";
import { logMsg } from "./log/logMessages";
import { buildDamageContext } from "./damage/damageEngine";
import operatorsData from "../data/operators";
import type { SkillType } from "../data/operators/OperatorDef";
import { SimEventWhen } from "../types/simulator/when";
import { STAGGER_DURATION_FRAMES } from "../types/simulator/stagger";
import { SOLIDIFICATION_BUFF_ID } from "../data/buffs/reactions/solidification";
import { COMBUSTION_BUFF_ID } from "../data/buffs/reactions/combustion";
import { ELECTRIFICATION_BUFF_ID } from "../data/buffs/reactions/electrification";
import { CORROSION_BUFF_ID } from "../data/buffs/reactions/corrosion";
import {
  computePhysicalStatusMultiplier,
  computeArtsReactionMultiplier,
  computeArtsBurstMultiplier,
  type ArtsReactionType,
  ARTS_BURST_DELAY_FRAMES,
  ARTS_BURST_BASE_MUL,
  ARTS_BURST_PER_STACK_MUL,
  SOLIDIFICATION_INITIAL_HIT_BASE_MUL,
  SOLIDIFICATION_INITIAL_HIT_PER_STACK_MUL,
  SOLIDIFICATION_BASE_DURATION_FRAMES,
  SOLIDIFICATION_EXTRA_DURATION_PER_STACK_FRAMES,
  SOLIDIFICATION_SHATTER_BASE_MUL,
  SOLIDIFICATION_SHATTER_PER_STACK_MUL,
  COMBUSTION_INITIAL_HIT_BASE_MUL,
  COMBUSTION_INITIAL_HIT_PER_STACK_MUL,
  COMBUSTION_DOT_BASE_MUL,
  COMBUSTION_DOT_PER_STACK_MUL,
  COMBUSTION_DOT_INTERVAL_FRAMES,
  ELECTRIFICATION_INITIAL_HIT_BASE_MUL,
  ELECTRIFICATION_INITIAL_HIT_PER_STACK_MUL,
  ELECTRIFICATION_BASE_DURATION_FRAMES,
  ELECTRIFICATION_EXTRA_DURATION_PER_STACK_FRAMES,
  ELECTRIFICATION_RCV_ARTS_BASE,
  ELECTRIFICATION_RCV_ARTS_PER_STACK,
  CORROSION_INITIAL_HIT_BASE_MUL,
  CORROSION_INITIAL_HIT_PER_STACK_MUL,
  CORROSION_REDUCTION_PER_SECOND_BASE,
  CORROSION_REDUCTION_PER_SECOND_PER_STACK,
  CORROSION_MIN_RESISTANCE_BASE,
  CORROSION_MIN_RESISTANCE_PER_STACK,
} from "./damage/statusDamage";

export const DEFAULT_INFLICTION_DURATION_FRAMES = 1800;

export const NORMAL_SKILL_TEAM_ULTIMATE_GAIN = 6.5;

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

  if (when.buffKey) {
    if (!("buffId" in ev)) {
      return {
        isValid: false,
        reason: `buffKey requires a buff event`,
      };
    }
    const eventBuffKey = ev.buffKey ?? ev.buffId;
    if (eventBuffKey !== when.buffKey) {
      return {
        isValid: false,
        reason: `buffKey mismatch (expected=${when.buffKey}, actual=${eventBuffKey})`,
      };
    }
  }

  if (when.ownerHasBuffId) {
    const ownerId = getOwnerIdForWhen(ev, context);
    if (!ownerId) {
      return {
        isValid: false,
        reason: `ownerHasBuffId requires ownerId`,
      };
    }
    if (!read.hasBuffType(ownerId, when.ownerHasBuffId)) {
      return {
        isValid: false,
        reason: `owner missing buff type ${when.ownerHasBuffId}`,
      };
    }
  }

  if (when.ownerHasBuffKey) {
    const ownerId = getOwnerIdForWhen(ev, context);
    if (!ownerId) {
      return {
        isValid: false,
        reason: `ownerHasBuffKey requires ownerId`,
      };
    }
    if (!read.getBuffByKey(ownerId, when.ownerHasBuffKey)) {
      return {
        isValid: false,
        reason: `owner missing buff key ${when.ownerHasBuffKey}`,
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
    if (!read.hasBuffType(context.targetId, when.targetHasBuffId)) {
      return {
        isValid: false,
        reason: `target missing buff type ${when.targetHasBuffId}`,
      };
    }
  }

  if (when.targetHasBuffKey) {
    if (!context.targetId) {
      return {
        isValid: false,
        reason: `targetHasBuffKey requires targetId`,
      };
    }
    if (!read.getBuffByKey(context.targetId, when.targetHasBuffKey)) {
      return {
        isValid: false,
        reason: `target missing buff key ${when.targetHasBuffKey}`,
      };
    }
  }

  return { isValid: true };
}

function getOwnerIdForWhen(
  ev: SimEvent,
  context: {
    sourceId?: SimEntityId;
    targetId?: SimEntityId;
  },
): SimEntityId | undefined {
  if (ev.type === "buffApply" || ev.type === "buffRemove") {
    return ev.targetId;
  }
  if (ev.type === "inflictionApply" || ev.type === "inflictionExpire") {
    return ev.targetId;
  }
  if (ev.type === "spRecover" || ev.type === "spReturn") {
    return ev.sourceId;
  }
  if (context.targetId) return context.targetId;
  return undefined;
}

function scheduleApplyVulnerable(
  world: SimWorld,
  sourceId: SimEntityId,
  targetId: SimEntityId,
  ref?: string,
): void {
  const id = makeSimEventId();
  world.ops.scheduleAtGameFrame(
    {
      id: id,
      type: "inflictionApply",
      seq: world.ops.nextSeq(),
      sourceId,
      targetId: targetId,
      inflictionType: "vulnerable",
      inflictionStacks: 1,
      ref,
    } as SimEvent,
    world.read.nowGameInFrames,
  );
}

function scheduleInflictionRemove(
  world: SimWorld,
  targetId: SimEntityId,
  inflictionType: InflictionType,
  ref?: string,
): void {
  world.ops.scheduleAtGameFrame(
    {
      id: makeSimEventId(),
      type: "inflictionRemove",
      frame: world.read.nowRealInFrames,
      seq: world.ops.nextSeq(),
      targetId,
      inflictionType,
      ref,
    } as SimEvent,
    world.read.nowRealInFrames,
  );
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

  return computePhysicalStatusMultiplier(
    statusType,
    level,
    artsIntensity,
    vulnerableConsumed,
  );
}

function scheduleBuffExpire(
  world: SimWorld,
  targetId: SimEntityId,
  buffId: BuffId,
  buffKey: string,
  expiresAtGameFrame: number | null,
): void {
  if (expiresAtGameFrame === null) {
    return;
  }
  world.ops.scheduleAtGameFrame(
    {
      id: makeSimEventId(),
      type: "buffExpire",
      seq: world.ops.nextSeq(),
      targetId: targetId,
      buffId: buffId,
      buffKey,
      ref: "auto",
    } as Omit<Extract<SimEvent, { type: "buffExpire" }>, "frame">,
    expiresAtGameFrame,
    world.nowRealInFrames,
  );
}

function getEventDurationFrames(
  ev: Extract<SimEvent, { type: "buffApply" }>,
): number | undefined {
  return (ev as { durationFrames?: number }).durationFrames;
}

function normalizeBuffDurationFrames(params: {
  buffId: BuffId;
  stacks: number;
  durationFramesOverride?: number;
}): number | null {
  const { buffId, stacks, durationFramesOverride } = params;

  if (buffId === SOLIDIFICATION_BUFF_ID) {
    return (
      SOLIDIFICATION_BASE_DURATION_FRAMES +
      stacks * SOLIDIFICATION_EXTRA_DURATION_PER_STACK_FRAMES
    );
  }

  if (buffId === ELECTRIFICATION_BUFF_ID) {
    return (
      ELECTRIFICATION_BASE_DURATION_FRAMES +
      stacks * ELECTRIFICATION_EXTRA_DURATION_PER_STACK_FRAMES
    );
  }

  if (durationFramesOverride === undefined) {
    const buffDef = buffsData[buffId];
    if (!buffDef) {
      console.warn(
        `Unknown buffId=${buffId} during buff apply, defaulting to non-expiring`,
      );
      return null;
    }
  }

  const durationFrames =
    durationFramesOverride ?? buffsData[buffId]?.durationFrames;
  if (durationFrames === undefined) {
    console.warn(
      `No duration defined for buffId=${buffId}, defaulting to non-expiring`,
    );
    return null;
  }
  if (durationFrames <= 0) {
    console.warn(
      `BuffId=${buffId} has non-positive durationFrames=${durationFrames}, defaulting to non-expiring`,
    );
    return null;
  }

  return durationFrames;
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

function getSkillStaggerOnHit(
  sourceId: SimEntityId,
  skillType: SkillType,
): number {
  return Number(operatorsData[sourceId]?.skills[skillType]?.staggerOnHit ?? 0);
}

function getStaggerOnHitFromAncestorEvent(
  read: SimRead,
  sourceId: SimEntityId,
  ev: SimEvent,
): number {
  const castStart = getCastStartForEvent(read, ev);
  if (!castStart) return 0;
  return getSkillStaggerOnHit(sourceId, castStart.skillType);
}

function getComboUltimateGain(operatorId: SimEntityId): number {
  const opDef = operatorsData[operatorId];
  const raw = Number(opDef?.getComboUltimateEnergyGainOnHit?.() ?? 6.5);
  return Number.isFinite(raw) ? Math.max(0, raw) : 6.5;
}

function toMilli(value: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.floor(Math.max(0, numeric) * 1000);
}

function clamp01(value: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(1, Math.max(0, numeric));
}

function tryGainStaggerAndCheckStaggeredTrigger(
  self: SimWorld,
  sourceId: SimEntityId,
  targetId: SimEntityId,
  staggerOnHit: number,
): boolean {
  const target = self.read.getEntity(targetId);
  if (!target?.stagger) return false;
  if (target.stagger.isStaggered) return false;
  if (target.stagger.pendingApplyFrame === self.read.nowGameInFrames)
    return false;

  const baseMilli = toMilli(staggerOnHit);
  if (baseMilli <= 0) return false;

  const sourceBuild = self.read.getBuild(sourceId);
  const effMilli = toMilli(sourceBuild?.restStat?.staggerEfficiency ?? 0);
  const gainMilli = Math.floor((baseMilli * (1000 + effMilli)) / 1000);
  if (gainMilli <= 0) return false;

  target.stagger.currentMilli += gainMilli;
  if (target.stagger.currentMilli < target.stagger.capMilli) return false;

  target.stagger.currentMilli = target.stagger.capMilli;
  target.stagger.pendingApplyFrame = self.read.nowGameInFrames;
  return true;
}

function applyStaggeredStatus(
  self: SimWorld,
  sourceId: SimEntityId,
  targetId: SimEntityId,
  ref: string,
): void {
  const target = self.read.getEntity(targetId);
  if (!target?.stagger) return;

  target.stagger.isStaggered = true;
  target.stagger.pendingApplyFrame = undefined;
  target.stagger.staggeredExpireFrame =
    self.read.nowGameInFrames + STAGGER_DURATION_FRAMES;

  self.ops.scheduleAtGameFrame(
    {
      id: makeSimEventId(),
      type: "staggerExpire",
      seq: self.ops.nextSeq(),
      targetId,
      ref,
    } as Omit<Extract<SimEvent, { type: "staggerExpire" }>, "frame">,
    target.stagger.staggeredExpireFrame,
    self.nowRealInFrames,
  );
}

function scheduleStaggeredDebuffApply(
  self: SimWorld,
  sourceId: SimEntityId,
  targetId: SimEntityId,
  ref: string,
): void {
  applyStaggeredStatus(self, sourceId, targetId, ref);
}

function scheduleComboTriggerElapse(
  world: SimWorld,
  operatorId: SimEntityId,
  triggerEventId: string,
  frame: number,
): void {
  world.ops.scheduleAtRealFrame({
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
  const appendSoftInvalidReason = (reason: string) => {
    ev.softInvalidReasons ??= [];
    if (!ev.softInvalidReasons.includes(reason)) {
      ev.softInvalidReasons.push(reason);
    }
  };
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
      logMsg.actCastIllegalCombo({
        sourceId: ev.sourceId,
        sourceName: source?.name,
        skillType: ev.skillType,
        reason: comboReason ?? "illegal combo cast",
      }),
    );
  }

  if (ev.skillType === "normalSkill") {
    const spendRes = self.spendTeamSp(100, ev.frame);
    self.normalSkillCastById.set(ev.id, {
      spent: spendRes.spent,
      realSpent: spendRes.realSpent,
      fakeSpent: spendRes.fakeSpent,
    });
    if (!spendRes.isLegal) {
      appendSoftInvalidReason("soft:insufficient-team-sp");
      self.ops.log(
        "act",
        logMsg.actCastInsufficientSp({
          sourceId: ev.sourceId,
          sourceName: source?.name,
          spent: spendRes.spent,
          cost: 100,
        }),
      );
    }
  }

  if (ev.skillType === "ultimate") {
    const spendRes = self.spendUltimateEnergy(ev.sourceId);
    if (!spendRes.isLegal) {
      appendSoftInvalidReason("soft:insufficient-ultimate-energy");
      self.ops.log(
        "act",
        logMsg.actCastInsufficientUltimate({
          sourceId: ev.sourceId,
          sourceName: source?.name,
          spent: spendRes.spent,
          cost: spendRes.cost,
        }),
      );
    }
  }

  if (ev.skillType === "comboSkill") {
    const combo = source?.combo;
    if (!combo) {
      console.warn(
        `comboSkill castStart sourceId=${ev.sourceId} has no combo state`,
      );
      return;
    }

    if (combo.cooldown > 0) {
      appendSoftInvalidReason("soft:combo-cooldown");
      const reason = `combo cooldown active (${combo.cooldown}f remaining)`;
      self.ops.log(
        "act",
        logMsg.actCastIllegalCombo({
          sourceId: ev.sourceId,
          sourceName: source?.name,
          skillType: ev.skillType,
          reason,
        }),
      );
      console.warn(
        `Soft-invalid comboSkill castStart sourceId=${ev.sourceId}: ${reason}`,
      );
    }

    const build = self.read.getBuild(ev.sourceId);
    const opDef = operatorsData[ev.sourceId];
    const cooldownByRank = opDef?.getComboCooldownSecondsByRank(
      build?.potentialRank,
    );

    let cooldownFrames = 0;
    if (cooldownByRank && cooldownByRank.length > 0) {
      const rawRank = Number(build?.potentialRank ?? 0);
      const rank = Number.isFinite(rawRank) ? Math.floor(rawRank) : 0;
      const clampedRank = Math.min(
        cooldownByRank.length - 1,
        Math.max(0, rank),
      );
      const baseSeconds = Number(
        cooldownByRank[clampedRank] ?? cooldownByRank[0] ?? 0,
      );
      const safeBaseSeconds = Number.isFinite(baseSeconds)
        ? Math.max(0, baseSeconds)
        : 0;
      const reduction = clamp01(
        Number(build?.restStat?.comboCooldownReduction ?? 0),
      );
      const effectiveSeconds = safeBaseSeconds * (1 - reduction);
      cooldownFrames = Math.max(0, Math.round(effectiveSeconds * 60));
    }

    combo.cooldown = cooldownFrames;
  }

  self.ops.log(
    "act",
    logMsg.actCastStart({
      sourceId: ev.sourceId,
      sourceName: source?.name,
      targetId: ev.targetId ?? "unknown",
      targetName: target?.name,
      skillType: ev.skillType,
    }),
  );

  if (ev.skillType === "normalAttack" || ev.skillType === "normalSkill") {
    const spawned = self.registry.runOnCastStart({
      read: self.read,
      ops: self.ops,
      ev: ev,
      sourceId: ev.sourceId,
      targetId: ev.targetId,
    });
    self.ops.scheduleDraftsAtGameFrame(spawned, {
      minRealFrame: self.nowRealInFrames,
    });
  }
}

export function resolveCastScriptStart(
  self: SimWorld,
  ev: Extract<SimEvent, { type: "castScriptStart" }>,
) {
  const castStart = self.read.getEvent(ev.ref);
  if (!castStart || castStart.type !== "castStart") {
    throw new Error(
      `castScriptStart ref=${ev.ref} does not point to castStart event`,
    );
  }

  if (
    castStart.skillType !== "comboSkill" &&
    castStart.skillType !== "ultimate"
  ) {
    return;
  }

  const spawned = self.registry.runOnCastStart({
    read: self.read,
    ops: self.ops,
    ev: castStart,
    sourceId: castStart.sourceId,
    targetId: castStart.targetId,
  });
  self.ops.scheduleDraftsAtGameFrame(spawned, {
    minRealFrame: self.nowRealInFrames,
  });
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
    logMsg.actCastEnd({
      sourceId: ev.sourceId,
      sourceName: source?.name,
      targetId: ev.targetId ?? "unknown",
      targetName: target?.name,
      skillType: ev.skillType,
    }),
  );

  const spawned = self.registry.runOnCastEnd({
    read: self.read,
    ops: self.ops,
    ev: ev,
    sourceId: ev.sourceId,
    targetId: ev.targetId,
  });
  self.ops.scheduleDraftsAtGameFrame(spawned, {
    minRealFrame: self.nowRealInFrames,
  });
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
  const isNormalAttackHit = parentCastStart?.skillType === "normalAttack";
  const isFinalNormalAttackHit = isNormalAttackHit
    ? self.findLastHitEventIdForCast(parentCastStart.id) === ev.id
    : false;
  const canApplyStagger =
    !isNormalAttackHit ||
    (source.id === self.controlledOperatorId && isFinalNormalAttackHit);
  const staggerOnHit = Number(
    ev.staggerOnHit ??
      getStaggerOnHitFromAncestorEvent(self.read, source.id, ev),
  );
  let shouldApplyStaggeredDebuff = false;
  if (canApplyStagger && staggerOnHit > 0) {
    shouldApplyStaggeredDebuff = tryGainStaggerAndCheckStaggeredTrigger(
      self,
      source.id,
      target.id,
      staggerOnHit,
    );
  }

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
      castStartEventId: parentCastStart?.id ?? null,
      castSkillType: parentCastStart?.skillType ?? null,
      hitEvent: ev,
    },
  });

  const res = self.damageModel.compute(ctx);
  self.ops.applyDamage(target.id, res.amount);

  const targetAfter = self.read.getEntity(target.id);

  self.ops.log(
    "dmg",
    logMsg.dmgHit({
      sourceId: source.id,
      sourceName: source.name,
      targetId: target.id,
      targetName: target.name,
      amount: res.amount,
      hpLeft: Number((targetAfter as any)?.hp ?? 0),
    }),
    ctx,
    res.breakdown,
    res.amount,
  );

  if (parentCastStart?.skillType === "comboSkill") {
    const gainBase = getComboUltimateGain(parentCastStart.sourceId);
    const gained = self.ops.gainUltimateEnergy(
      parentCastStart.sourceId,
      gainBase,
    );
    if (gained > 0) {
      self.ops.log(
        "act",
        logMsg.actUltimateGainComboHit({
          sourceId: source.id,
          sourceName: source.name,
          gained,
        }),
      );
    }
  }

  if (parentCastStart?.skillType === "normalSkill") {
    const lastHitEventId = self.findLastHitEventIdForCast(parentCastStart.id);
    if (lastHitEventId === ev.id) {
      const castState = self.normalSkillCastById.get(parentCastStart.id);
      self.normalSkillCastById.delete(parentCastStart.id);

      const spent = Math.max(0, Number(castState?.spent ?? 0));
      const realSpent = Math.max(0, Number(castState?.realSpent ?? 0));
      const realSpRatio = spent > 0 ? Math.min(1, realSpent / spent) : 0;
      const gainPerOperator = NORMAL_SKILL_TEAM_ULTIMATE_GAIN * realSpRatio;
      if (gainPerOperator > 0) {
        const operatorIds = Object.keys(
          self.env.resources.ultimateByOperatorId,
        ).sort((a, b) => a.localeCompare(b));
        let totalGained = 0;

        for (const operatorId of operatorIds) {
          totalGained += self.ops.gainUltimateEnergy(
            operatorId,
            gainPerOperator,
          );
        }

        if (totalGained > 0) {
          self.ops.log(
            "act",
            logMsg.actTeamUltimateGainNormalSkillFinalHit({
              gained: totalGained,
              realSpRatio,
            }),
          );
        }
      }
    }
  }

  const spawned = self.registry.runAfterHit({
    read: self.read,
    ops: self.ops,
    ev: ev,
    sourceId: source.id,
    targetId: target.id,
  });
  self.ops.scheduleDraftsAtGameFrame(spawned, {
    minRealFrame: self.nowRealInFrames,
  });

  if (shouldApplyStaggeredDebuff) {
    scheduleStaggeredDebuffApply(self, source.id, target.id, ev.id);
  }
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
  const inheritedStaggerOnHit = getStaggerOnHitFromAncestorEvent(
    self.read,
    sourceId,
    ev,
  );
  switch (statusType) {
    case "lift": {
      if (current <= 0) break;

      // Has vulnerable: add 1 stack (cap 4) and trigger Lift damage.
      // Schedule Lift damage as a hit event so it can interleave with other same-frame effects.
      self.ops.scheduleAtGameFrame(
        {
          id: makeSimEventId(),
          type: "hit",
          seq: self.ops.nextSeq(),
          sourceId,
          targetId,
          damageType: "physical",
          staggerOnHit: inheritedStaggerOnHit,
          dmgMultiplier: computePhysicalStatusSpecialMul(
            self,
            sourceId,
            "lift",
          ),
        },
        self.read.nowGameInFrames,
      );

      triggerPlugins();
      break;
    }
    case "knockDown": {
      if (current <= 0) break;

      self.ops.scheduleAtGameFrame(
        {
          id: makeSimEventId(),
          type: "hit",
          seq: self.ops.nextSeq(),
          sourceId,
          targetId,
          damageType: "physical",
          staggerOnHit: inheritedStaggerOnHit,
          dmgMultiplier: computePhysicalStatusSpecialMul(
            self,
            sourceId,
            "knockDown",
          ),
        },
        self.read.nowGameInFrames,
      );

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
      self.ops.scheduleAtGameFrame(
        {
          id: makeSimEventId(),
          type: "hit",
          seq: self.ops.nextSeq(),
          sourceId,
          targetId,
          damageType: "physical",
          staggerOnHit: inheritedStaggerOnHit,
          // TEMP: more stacks => larger skill multiplier.
          dmgMultiplier: computePhysicalStatusSpecialMul(
            self,
            sourceId,
            "crush",
            current,
          ),
        },
        self.read.nowGameInFrames,
      );
      break;
    }

    case "breach": {
      // TODO: Add breached (or other name) debuff to enemy

      if (current <= 0) break;

      // Has vulnerable: consume all stacks and trigger breach burst damage.
      shouldRemoveVulnerable = true;
      shouldAddVulnerable = false;

      triggerPlugins();

      self.ops.scheduleAtGameFrame(
        {
          id: makeSimEventId(),
          type: "hit",
          seq: self.ops.nextSeq(),
          sourceId,
          targetId,
          damageType: "physical",
          staggerOnHit: inheritedStaggerOnHit,
          dmgMultiplier: computePhysicalStatusSpecialMul(
            self,
            sourceId,
            "breach",
            current,
          ),
        },
        self.read.nowGameInFrames,
      );

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
  } else if (shouldRemoveVulnerable) {
    scheduleInflictionRemove(self, targetId, "vulnerable", ev.id);

    self.ops.log(
      "buff",
      logMsg.buffVulnerableConsumed({
        statusType,
        consumed: current,
        targetId,
        targetName: (target as any).name,
      }),
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
  const buffKey = ev.buffKey ?? ev.buffId;

  const source = sourceId ? self.read.getEntity(sourceId) : null;

  const target = self.read.getEntity(targetId);
  if (!target) throw new Error(`Unknown target with targetId=${targetId}`);

  const existing = (target as any).buffs?.[buffKey];

  const eventDurationFrames = getEventDurationFrames(ev);

  if (buffId === "buff.crystal") {
    const had = Boolean(existing);
    const durationFrames = normalizeBuffDurationFrames({
      buffId,
      stacks: 1,
      durationFramesOverride: eventDurationFrames,
    });
    const expiresAtFrame =
      durationFrames === null
        ? null
        : self.read.nowGameInFrames + durationFrames;
    self.ops.addBuff(targetId, {
      id: buffId,
      key: buffKey,
      durationFrames,
      expiresAtFrame,
      lastApplyFrame: self.read.nowGameInFrames,
      stacks: 1,
    } as SimBuff);
    scheduleBuffExpire(self, targetId, buffId, buffKey, expiresAtFrame);
    self.ops.log(
      "buff",
      had
        ? logMsg.buffRefresh({
            buffId,
            sourceId: source?.id,
            sourceName: (source as any)?.name,
            targetId,
            targetName: (target as any).name,
          })
        : logMsg.buffApply({
            buffId,
            sourceId: source?.id,
            sourceName: (source as any)?.name,
            targetId,
            targetName: (target as any).name,
          }),
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
  const maxStacks = Math.max(
    1,
    Number(ev.maxStacks ?? (def as any)?.maxStacks ?? 1),
  );

  const beforeStacks = Math.max(0, Number((existing as any)?.stacks ?? 0));
  const afterStacks = Math.min(maxStacks, beforeStacks + 1);
  const durationFrames = normalizeBuffDurationFrames({
    buffId,
    stacks: afterStacks,
    durationFramesOverride: eventDurationFrames,
  });
  const expiresAtFrame =
    durationFrames === null ? null : self.read.nowGameInFrames + durationFrames;

  const had = Boolean(existing);
  self.ops.addBuff(targetId, {
    id: buffId,
    key: buffKey,
    durationFrames,
    expiresAtFrame,
    lastApplyFrame: self.read.nowGameInFrames,
    stacks: afterStacks,
    mods: ev.mods ?? (existing as SimBuff | undefined)?.mods,
    runtime: ev.runtime ?? (existing as SimBuff | undefined)?.runtime,
    meta:
      buffId === CORROSION_BUFF_ID && existing
        ? (existing as any).meta
        : ((ev as any).meta ?? (existing as any)?.meta),
  } as SimBuff);
  scheduleBuffExpire(self, targetId, buffId, buffKey, expiresAtFrame);

  if (maxStacks > 1) {
    self.ops.log(
      "buff",
      logMsg.buffStackChange({
        buffId,
        before: beforeStacks,
        after: afterStacks,
        sourceId: source?.id,
        sourceName: (source as any)?.name,
        targetId,
        targetName: (target as any).name,
      }),
    );
  } else {
    self.ops.log(
      "buff",
      had
        ? logMsg.buffRefresh({
            buffId,
            sourceId: source?.id,
            sourceName: (source as any)?.name,
            targetId,
            targetName: (target as any).name,
          })
        : logMsg.buffApply({
            buffId,
            sourceId: source?.id,
            sourceName: (source as any)?.name,
            targetId,
            targetName: (target as any).name,
          }),
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
  const buffKey = ev.buffKey ?? ev.buffId;
  const buff = (ent as any).buffs?.[buffKey];
  if (!buff) return false; // already removed or consumed

  const expiresAtGameFrame = (buff as SimBuff).expiresAtFrame;
  if (expiresAtGameFrame === null) return false;
  if (self.read.nowGameInFrames >= expiresAtGameFrame) {
    self.ops.removeBuff(ent.id, buffKey);
    self.ops.log(
      "buff",
      logMsg.buffExpire({
        buffId,
        targetId: ent.id,
        targetName: (ent as any).name,
      }),
    );
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
  const sourceBuild = self.read.getBuild(source.id);

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

      const reactionTypeMap: Record<
        ArtsInflictionType,
        {
          buffId: BuffId;
          reactionType: ArtsReactionType;
          buffStacksOverride?: number;
        }
      > = {
        cryo: {
          buffId: SOLIDIFICATION_BUFF_ID,
          reactionType: "solidification",
        },
        heat: {
          buffId: COMBUSTION_BUFF_ID,
          reactionType: "combustion",
          buffStacksOverride: 1,
        },
        electric: {
          buffId: ELECTRIFICATION_BUFF_ID,
          reactionType: "electrification",
        },
        nature: {
          buffId: CORROSION_BUFF_ID,
          reactionType: "corrosion",
          buffStacksOverride: 1,
        },
      };

      const reactionConfig = reactionTypeMap[artsType];
      const reactionBuffId = reactionConfig.buffId;
      const buffStacks =
        reactionConfig.buffStacksOverride ?? consumedArtsStacks;

      let buffMeta: Record<string, unknown> | undefined;
      if (artsType === "heat") {
        buffMeta = {
          reactionSourceId: source.id,
          combustionTickMultiplier:
            COMBUSTION_DOT_BASE_MUL +
            consumedArtsStacks * COMBUSTION_DOT_PER_STACK_MUL,
        };
      } else if (artsType === "nature") {
        buffMeta = {
          corrosionReductionPerSecond:
            CORROSION_REDUCTION_PER_SECOND_BASE +
            consumedArtsStacks * CORROSION_REDUCTION_PER_SECOND_PER_STACK,
          corrosionMinResistanceMul:
            CORROSION_MIN_RESISTANCE_BASE +
            consumedArtsStacks * CORROSION_MIN_RESISTANCE_PER_STACK,
        };
      }

      self.ops.scheduleAtRealFrame({
        id: makeSimEventId(),
        type: "hit",
        frame: self.nowInFrames,
        seq: self.ops.nextSeq(),
        sourceId: source.id,
        targetId: owner.id,
        damageType: artsType,
        staggerOnHit: getStaggerOnHitFromAncestorEvent(
          self.read,
          source.id,
          ev,
        ),
        dmgMultiplier: computeArtsReactionMultiplier(
          reactionConfig.reactionType,
          consumedArtsStacks,
          sourceBuild?.level ?? 1,
          sourceBuild?.restStat?.artsIntensity ?? 0,
        ),
        ref: ev.id,
      } as SimEvent);

      self.ops.scheduleAtRealFrame({
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

      self.ops.log(
        "buff",
        logMsg.reactionTriggered({
          reactionBuffId,
          targetId: owner.id,
          targetName: (owner as any).name,
          consumedArtsStacks,
        }),
      );
      self.ops.log(
        "buff",
        logMsg.reactionConsumedInflictions({
          reactionBuffId,
          targetId: owner.id,
          targetName: (owner as any).name,
          consumedArtsStacks,
        }),
      );

      return;
    }

    const current = currentSameTypeStacks;
    self.ops.addInfliction(owner.id, ev.inflictionType, ev.inflictionStacks);
    const after = owner.inflictions[ev.inflictionType].stacks;
    self.ops.log(
      "buff",
      logMsg.inflictionStackChange({
        inflictionType: ev.inflictionType,
        before: current,
        after,
        targetId: owner.id,
        targetName: (owner as any).name,
      }),
    );

    const isBurstTrigger = current > 0;
    if (isBurstTrigger) {
      self.ops.scheduleAtRealFrame({
        id: makeSimEventId(),
        type: "hit",
        frame: self.read.nowGameInFrames + ARTS_BURST_DELAY_FRAMES,
        seq: self.ops.nextSeq(),
        sourceId: source.id,
        targetId: owner.id,
        damageType: artsType,
        staggerOnHit: 0,
        dmgMultiplier: computeArtsBurstMultiplier(
          after,
          sourceBuild?.level ?? 1,
          sourceBuild?.restStat?.artsIntensity ?? 0,
        ),
        ref: ev.id,
      } as SimEvent);
    }
  } else {
    const current = owner.inflictions[ev.inflictionType].stacks;
    self.ops.addInfliction(owner.id, ev.inflictionType, ev.inflictionStacks);
    const after = owner.inflictions[ev.inflictionType].stacks;
    self.ops.log(
      "buff",
      logMsg.inflictionStackChange({
        inflictionType: ev.inflictionType,
        before: current,
        after,
        targetId: owner.id,
        targetName: (owner as any).name,
      }),
    );
  }

  const spawned = self.registry.runOnInflictionApply({
    read: self.read,
    ops: self.ops,
    ev,
    sourceId: source.id,
    targetId: owner.id,
  });
  self.ops.scheduleDraftsAtGameFrame(spawned, {
    minRealFrame: self.nowRealInFrames,
  });

  self.ops.scheduleAtGameFrame(
    {
      id: makeSimEventId(),
      type: "inflictionExpire",
      seq: self.ops.nextSeq(),
      targetId: owner.id,
      inflictionType: ev.inflictionType,
      ref: ev.id,
    } as Omit<Extract<SimEvent, { type: "inflictionExpire" }>, "frame">,
    self.read.nowGameInFrames + DEFAULT_INFLICTION_DURATION_FRAMES,
    self.nowRealInFrames,
  );
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
    self.read.nowGameInFrames >=
    inf.lastApplyFrame + DEFAULT_INFLICTION_DURATION_FRAMES
  ) {
    scheduleInflictionRemove(self, ent.id, inflictionType, ev.id);
    self.ops.log(
      "buff",
      logMsg.inflictionExpire({
        inflictionType,
        targetId: ent.id,
        targetName: (ent as any).name,
      }),
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
    const tickSourceIdTyped = tickSourceId as SimEntityId;
    self.ops.scheduleAtRealFrame({
      id: makeSimEventId(),
      type: "hit",
      frame: ev.frame,
      seq: self.ops.nextSeq(),
      sourceId: tickSourceIdTyped,
      targetId: ev.targetId,
      damageType: "heat",
      staggerOnHit: getStaggerOnHitFromAncestorEvent(
        self.read,
        tickSourceIdTyped,
        ev,
      ),
      dmgMultiplier: tickMultiplier,
      ref: ev.id,
    } as SimEvent);
  }

  self.ops.scheduleAtGameFrame(
    {
      id: makeSimEventId(),
      type: "reactionTick",
      seq: self.ops.nextSeq(),
      sourceId: tickSourceId,
      targetId: ev.targetId,
      reactionBuffId: COMBUSTION_BUFF_ID,
      ref: ev.id,
    } as Omit<Extract<SimEvent, { type: "reactionTick" }>, "frame">,
    self.read.nowGameInFrames + COMBUSTION_DOT_INTERVAL_FRAMES,
    self.nowRealInFrames,
  );
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
  self.ops.log(
    "act",
    logMsg.actComboTriggered({
      sourceId: sourceEnt.id,
      sourceName: sourceEnt.name,
    }),
  );
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
  self.ops.log(
    "act",
    logMsg.actComboElapsed({
      sourceId: sourceEnt.id,
      sourceName: sourceEnt.name,
    }),
  );
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
    logMsg.actTeamSpRecover({
      sourceId: ev.sourceId,
      gained,
      real: self.env.resources.teamSp.real,
      fake: self.env.resources.teamSp.fake,
    }),
  );
}

export function resolveSpReturn(
  self: SimWorld,
  ev: Extract<SimEvent, { type: "spReturn" }>,
) {
  const gained = self.ops.returnTeamSp(ev.amount, ev.frame);

  self.ops.log(
    "act",
    logMsg.actTeamSpReturn({
      sourceId: ev.sourceId,
      gained,
      real: self.env.resources.teamSp.real,
      fake: self.env.resources.teamSp.fake,
    }),
  );
}

export function resolveStaggerExpire(
  self: SimWorld,
  ev: Extract<SimEvent, { type: "staggerExpire" }>,
) {
  const target = self.read.getEntity(ev.targetId);
  if (!target?.stagger) return;

  if (target.stagger.staggeredExpireFrame === undefined) return;
  if (self.read.nowGameInFrames >= target.stagger.staggeredExpireFrame) {
    target.stagger.currentMilli = 0;
    target.stagger.pendingApplyFrame = undefined;
    target.stagger.isStaggered = false;
    target.stagger.staggeredExpireFrame = undefined;
  }
}
