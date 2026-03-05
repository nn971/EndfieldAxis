import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import operatorsData from "../../data/operators";
import {
  type DamageWatchEntry,
  makeEmptySimRenderCache,
  type SimRenderCache,
  type SkillBox,
  type SolutionState,
} from "../../types/editor";
import {
  makeEmptySimDamageCache,
  type SimDamageCache,
} from "../../types/simDamage";
import type { OperatorId, SkillType } from "../../data/operators/OperatorDef";
import type { OperatorBuild, RestStatSnapshot } from "../../types/operator";
import { statUpdater } from "./statUpdater";
import { makeId } from "../../shared/lib/id";
import { assignNoDup, moveItem } from "../../shared/lib/utils";

const DEFAULT_DURATION_FRAMES = 325;

function normalizeControlledOperatorId(state: SolutionState) {
  if (state.teamOperatorIds.includes(state.controlledOperatorId)) return;
  state.controlledOperatorId = state.teamOperatorIds[0] ?? "";
}

function getDurationFrames(operatorId: string, skillType: SkillType): number {
  return (
    operatorsData[operatorId]?.skills?.[skillType]?.durationFrames ??
    DEFAULT_DURATION_FRAMES
  );
}

export function makeEmptyRestStat(): RestStatSnapshot {
  return {
    operatorAttack: 0,
    weaponAttack: 0,
    baseAtk: 0,
    atkIncRatio: 0,
    atkIncFlat: 0,
    attributes: {
      strength: 0,
      agility: 0,
      intellect: 0,
      will: 0,
    },
    attributesBonusRatio: 0,

    criticalHitChance: 0.05,
    criticalHitDmgIncRatio: 0.5,
    artsIntensity: 0,
    comboCooldownReduction: 0,
    ultimateGainEfficiency: 0,
    staggerEfficiency: 0,
    dmgIncRatio: {
      physical: 0,
      heat: 0,
      electric: 0,
      cryo: 0,
      nature: 0,
    },
    ultimateDmgIncRatio: 0,
    log: [],
  };
}

function makeDefaultBuild(operatorId: OperatorId): OperatorBuild {
  const build: OperatorBuild = {
    id: operatorId,
    level: 90,
    potentialRank: 0,
    skillRanks: {
      normalAttack: 9,
      normalSkill: 9,
      comboSkill: 9,
      ultimate: 9,
    },
    talentRanks: {
      talent1: 2,
      talent2: 2,
    },
    trustRank: 4,
    weapon: { id: null, level: 90, skillRanks: { s1: 0, s2: 0, s3: 0 } },
    gears: {
      armor: { gearId: null, ranks: [0, 0, 0] },
      gloves: { gearId: null, ranks: [0, 0, 0] },
      kit1: { gearId: null, ranks: [0, 0, 0] },
      kit2: { gearId: null, ranks: [0, 0, 0] },
    },
    restStat: makeEmptyRestStat(),
  };

  statUpdater(build);

  return build;
}

function initState(): SolutionState {
  const teamOperatorIds = Object.keys(operatorsData).slice(0, 4);
  const buildByOperatorId: Record<string, OperatorBuild> = {};
  for (const op of Object.values(operatorsData))
    buildByOperatorId[op.id] = makeDefaultBuild(op.id);

  // const initialSkillBoxes: SkillBox[] = [
  //   {
  //     id: makeId("sb_"),
  //     operatorId: teamOperatorIds[0] ?? operatorsData[0]?.id ?? "unknown",
  //     skillType: "ultimate",
  //     startFrame: 360,
  //     durationFrames: 180,
  //   },
  // ];
  const initialSkillBoxes: SkillBox[] = [];

  return {
    version: 1,
    teamOperatorIds,
    controlledOperatorId: teamOperatorIds[0] ?? "",
    skillBoxes: initialSkillBoxes,
    buildByOperatorId,
    simRenderCache: makeEmptySimRenderCache(),
    simDamageCache: makeEmptySimDamageCache(),
    damageWatches: [],
  };
}

const initialState: SolutionState = initState();

export const solutionSlice = createSlice({
  name: "solution",
  initialState,
  reducers: {
    /**
     * Replace the entire solution state (used by Load).
     * NOTE: reducers in createSlice may either mutate OR return a new state.
     */
    solutionReplaced(_state, action: PayloadAction<SolutionState>) {
      const next = {
        ...action.payload,
        controlledOperatorId:
          action.payload.controlledOperatorId ??
          action.payload.teamOperatorIds[0] ??
          "",
      };
      next.simDamageCache ??= makeEmptySimDamageCache();
      next.damageWatches ??= [];
      for (const [opId, build] of Object.entries(
        next.buildByOperatorId ?? {},
      )) {
        try {
          build.id = opId;
          statUpdater(build);
        } catch (e) {
          console.warn(
            `Failed to update stats for operator ${opId} during solution load.`,
            JSON.stringify(e),
          );
        }
      }
      normalizeControlledOperatorId(next);
      return next;
    },
    simRenderCacheReplaced(state, action: PayloadAction<SimRenderCache>) {
      state.simRenderCache = action.payload;
    },
    simDamageCacheReplaced(state, action: PayloadAction<SimDamageCache>) {
      state.simDamageCache = action.payload;
    },
    damageWatchAdded(state, action: PayloadAction<{ name?: string } | undefined>) {
      const id = makeId("dw_");
      const defaultSourceId = state.controlledOperatorId || null;
      state.damageWatches.push({
        id,
        name: action.payload?.name ?? `Watch ${state.damageWatches.length + 1}`,
        filter: {
          sourceId: defaultSourceId,
          skillType: null,
          damageType: null,
        },
      });
    },
    damageWatchPatched(
      state,
      action: PayloadAction<{
        id: string;
        patch: Partial<Omit<DamageWatchEntry, "id">>;
      }>,
    ) {
      const { id, patch } = action.payload;
      const watch = state.damageWatches.find(w => w.id === id);
      if (!watch) return;
      Object.assign(watch, patch);
    },
    damageWatchDeleted(state, action: PayloadAction<{ id: string }>) {
      const { id } = action.payload;
      const idx = state.damageWatches.findIndex(w => w.id === id);
      if (idx >= 0) state.damageWatches.splice(idx, 1);
    },
    laneReordered(state, action: PayloadAction<{ from: number; to: number }>) {
      const { from, to } = action.payload;
      state.teamOperatorIds = moveItem(state.teamOperatorIds, from, to);
      normalizeControlledOperatorId(state);
    },
    teammateAssigned(
      state,
      action: PayloadAction<{ laneIndex: number; newOpId: string }>,
    ) {
      const { laneIndex, newOpId } = action.payload;
      const replacedOperatorId = state.teamOperatorIds[laneIndex];
      state.teamOperatorIds = assignNoDup(
        state.teamOperatorIds,
        laneIndex,
        newOpId,
      );
      if (replacedOperatorId === state.controlledOperatorId) {
        state.controlledOperatorId = newOpId;
      }
      normalizeControlledOperatorId(state);
    },
    controlledOperatorSet(
      state,
      action: PayloadAction<{ operatorId: string }>,
    ) {
      state.controlledOperatorId = action.payload.operatorId;
      normalizeControlledOperatorId(state);
    },
    skillBoxPatched(
      state,
      action: PayloadAction<{
        id: string;
        patch: Partial<Omit<SkillBox, "id">>;
      }>,
    ) {
      const { id, patch } = action.payload;
      const box = state.skillBoxes.find(b => b.id === id);
      if (!box) return;
      Object.assign(box, patch);
    },
    operatorBuildPatched(
      state,
      action: PayloadAction<{
        operatorId: string;
        patch: Partial<OperatorBuild>;
      }>,
    ) {
      const { operatorId, patch } = action.payload;
      const cur = state.buildByOperatorId[operatorId];
      if (!cur) return;

      // Recompute stats
      const next = { ...cur, ...patch } as OperatorBuild;
      next.id = operatorId;
      statUpdater(next);

      state.buildByOperatorId[operatorId] = next;
    },
    skillBoxAdded(
      state,
      action: PayloadAction<{
        operatorId: string;
        skillType: SkillType;
        startFrame: number;
        durationFrames?: number;
      }>,
    ) {
      const { operatorId, skillType, startFrame } = action.payload;
      const durationFrames =
        action.payload.durationFrames ??
        getDurationFrames(operatorId, skillType);
      state.skillBoxes.push({
        id: makeId("sb_"),
        operatorId,
        skillType,
        startFrame,
        durationFrames,
      });
    },
    skillBoxDeleted(state, action: PayloadAction<{ id: string }>) {
      const { id } = action.payload;
      const idx = state.skillBoxes.findIndex(b => b.id === id);
      if (idx >= 0) state.skillBoxes.splice(idx, 1);
    },
  },
});

export const {
  solutionReplaced,
  laneReordered,
  teammateAssigned,
  skillBoxPatched,
  operatorBuildPatched,
  skillBoxAdded,
  skillBoxDeleted,
  simRenderCacheReplaced,
  simDamageCacheReplaced,
  damageWatchAdded,
  damageWatchPatched,
  damageWatchDeleted,
  controlledOperatorSet,
} = solutionSlice.actions;

export default solutionSlice.reducer;
