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
import { CURRENT_SOLUTION_VERSION } from "./solutionSL";
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
    version: CURRENT_SOLUTION_VERSION,
    teamOperatorIds,
    controlledOperatorId: teamOperatorIds[0] ?? "",
    skillBoxes: initialSkillBoxes,
    buildByOperatorId,
    simRenderCache: makeEmptySimRenderCache(),
    simDamageCache: makeEmptySimDamageCache(),
    damageWatches: [],
  };
}

type SolutionWorkspaceEntity = {
  id: string;
  name: string;
  solution: SolutionState;
};

type SolutionWorkspaceState = {
  workspaceVersion: 1;
  activeId: string;
  order: string[];
  entities: Record<string, SolutionWorkspaceEntity>;
} & SolutionState;

function cloneSolutionState(solution: SolutionState): SolutionState {
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(solution);
    } catch {
      // Fallback to JSON method if structuredClone fails
    }
  }
  return JSON.parse(JSON.stringify(solution)) as SolutionState;
}

function normalizeSolution(solution: SolutionState): SolutionState {
  const next: SolutionState = {
    ...solution,
    version: CURRENT_SOLUTION_VERSION,
    controlledOperatorId:
      solution.controlledOperatorId ?? solution.teamOperatorIds[0] ?? "",
    simDamageCache: solution.simDamageCache ?? makeEmptySimDamageCache(),
    damageWatches: solution.damageWatches ?? [],
  };
  for (const [opId, build] of Object.entries(next.buildByOperatorId ?? {})) {
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
}

function getActiveEntity(
  state: SolutionWorkspaceState,
): SolutionWorkspaceEntity | undefined {
  return state.entities[state.activeId];
}

function getActiveSolution(
  state: SolutionWorkspaceState,
): SolutionState | undefined {
  return getActiveEntity(state)?.solution;
}

function syncActiveSolutionCompat(state: SolutionWorkspaceState): void {
  const activeSolution = getActiveSolution(state);
  if (!activeSolution) return;
  state.version = activeSolution.version;
  state.teamOperatorIds = activeSolution.teamOperatorIds;
  state.controlledOperatorId = activeSolution.controlledOperatorId;
  state.skillBoxes = activeSolution.skillBoxes;
  state.buildByOperatorId = activeSolution.buildByOperatorId;
  state.simRenderCache = activeSolution.simRenderCache;
  state.simDamageCache = activeSolution.simDamageCache;
  state.damageWatches = activeSolution.damageWatches;
}

const initialSolution = normalizeSolution(initState());
const initialTabId = makeId("wst_");
const initialState: SolutionWorkspaceState = {
  workspaceVersion: 1,
  activeId: initialTabId,
  order: [initialTabId],
  entities: {
    [initialTabId]: {
      id: initialTabId,
      name: "",
      solution: initialSolution,
    },
  },
  ...initialSolution,
};

export const solutionSlice = createSlice({
  name: "solution",
  initialState,
  reducers: {
    /**
     * Replace the entire solution state (used by Load).
     * NOTE: reducers in createSlice may either mutate OR return a new state.
     */
    solutionReplaced(_state, action: PayloadAction<SolutionState>) {
      const active = getActiveEntity(_state);
      if (!active) return;
      active.solution = normalizeSolution(action.payload);
      syncActiveSolutionCompat(_state);
    },
    workspaceTabNew(
      state,
      action: PayloadAction<{ name?: string } | undefined>,
    ) {
      const id = makeId("wst_");
      const solution = normalizeSolution(initState());
      state.entities[id] = {
        id,
        name: action.payload?.name ?? "",
        solution,
      };
      state.order.push(id);
      state.activeId = id;
      syncActiveSolutionCompat(state);
    },
    workspaceTabOpened(
      state,
      action: PayloadAction<{ name?: string; solution: SolutionState }>,
    ) {
      const id = makeId("wst_");
      state.entities[id] = {
        id,
        name: action.payload.name ?? "",
        solution: normalizeSolution(action.payload.solution),
      };
      state.order.push(id);
      state.activeId = id;
      syncActiveSolutionCompat(state);
    },
    workspaceTabSetActive(state, action: PayloadAction<{ id: string }>) {
      if (!state.entities[action.payload.id]) return;
      state.activeId = action.payload.id;
      syncActiveSolutionCompat(state);
    },
    workspaceTabRename(
      state,
      action: PayloadAction<{ id: string; name: string }>,
    ) {
      const entity = state.entities[action.payload.id];
      if (!entity) return;
      const trimmedName = action.payload.name.trim();
      if (!trimmedName) return;
      entity.name = trimmedName;
    },
    workspaceTabClone(
      state,
      action: PayloadAction<{ id: string; name?: string }>,
    ) {
      const source = state.entities[action.payload.id];
      if (!source) return;
      const sourceIndex = state.order.findIndex(id => id === source.id);
      if (sourceIndex < 0) return;

      const id = makeId("wst_");
      const cloned = normalizeSolution(cloneSolutionState(source.solution));
      cloned.simRenderCache = makeEmptySimRenderCache();
      cloned.simDamageCache = makeEmptySimDamageCache();
      state.entities[id] = {
        id,
        name: action.payload.name ?? "",
        solution: cloned,
      };
      state.order.splice(sourceIndex + 1, 0, id);
      state.activeId = id;
      syncActiveSolutionCompat(state);
    },
    workspaceTabClose(state, action: PayloadAction<{ id: string }>) {
      if (state.order.length <= 1) return;
      const closeId = action.payload.id;
      const index = state.order.findIndex(id => id === closeId);
      if (index < 0) return;

      state.order.splice(index, 1);
      delete state.entities[closeId];

      if (state.activeId !== closeId) return;
      const nextIndex = index - 1 >= 0 ? index - 1 : 0;
      const nextActiveId = state.order[nextIndex];
      if (!nextActiveId) return;
      state.activeId = nextActiveId;
      syncActiveSolutionCompat(state);
    },
    simRenderCacheReplaced(state, action: PayloadAction<SimRenderCache>) {
      const active = getActiveSolution(state);
      if (!active) return;
      active.simRenderCache = action.payload;
      syncActiveSolutionCompat(state);
    },
    simDamageCacheReplaced(state, action: PayloadAction<SimDamageCache>) {
      const active = getActiveSolution(state);
      if (!active) return;
      active.simDamageCache = action.payload;
      syncActiveSolutionCompat(state);
    },
    damageWatchAdded(state, action: PayloadAction<{ name?: string } | undefined>) {
      const active = getActiveSolution(state);
      if (!active) return;
      const id = makeId("dw_");
      const defaultSourceId = active.controlledOperatorId || null;
      const nextIndex = active.damageWatches.length + 1;
      active.damageWatches.push({
        id,
        name: action.payload?.name ?? "",
        nameI18n: {
          key: "damageStats.watchName",
          params: { index: nextIndex },
        },
        filter: {
          sourceId: defaultSourceId,
          skillType: null,
          damageType: null,
        },
      });
      syncActiveSolutionCompat(state);
    },
    damageWatchPatched(
      state,
      action: PayloadAction<{
        id: string;
        patch: Partial<Omit<DamageWatchEntry, "id">>;
      }>,
    ) {
      const active = getActiveSolution(state);
      if (!active) return;
      const { id, patch } = action.payload;
      const watch = active.damageWatches.find(w => w.id === id);
      if (!watch) return;
      Object.assign(watch, patch);
      syncActiveSolutionCompat(state);
    },
    damageWatchDeleted(state, action: PayloadAction<{ id: string }>) {
      const active = getActiveSolution(state);
      if (!active) return;
      const { id } = action.payload;
      const idx = active.damageWatches.findIndex(w => w.id === id);
      if (idx >= 0) active.damageWatches.splice(idx, 1);
      syncActiveSolutionCompat(state);
    },
    laneReordered(state, action: PayloadAction<{ from: number; to: number }>) {
      const active = getActiveSolution(state);
      if (!active) return;
      const { from, to } = action.payload;
      active.teamOperatorIds = moveItem(active.teamOperatorIds, from, to);
      normalizeControlledOperatorId(active);
      syncActiveSolutionCompat(state);
    },
    teammateAssigned(
      state,
      action: PayloadAction<{ laneIndex: number; newOpId: string }>,
    ) {
      const active = getActiveSolution(state);
      if (!active) return;
      const { laneIndex, newOpId } = action.payload;
      const replacedOperatorId = active.teamOperatorIds[laneIndex];
      active.teamOperatorIds = assignNoDup(
        active.teamOperatorIds,
        laneIndex,
        newOpId,
      );
      if (replacedOperatorId === active.controlledOperatorId) {
        active.controlledOperatorId = newOpId;
      }
      normalizeControlledOperatorId(active);
      syncActiveSolutionCompat(state);
    },
    controlledOperatorSet(
      state,
      action: PayloadAction<{ operatorId: string }>,
    ) {
      const active = getActiveSolution(state);
      if (!active) return;
      active.controlledOperatorId = action.payload.operatorId;
      normalizeControlledOperatorId(active);
      syncActiveSolutionCompat(state);
    },
    skillBoxPatched(
      state,
      action: PayloadAction<{
        id: string;
        patch: Partial<Omit<SkillBox, "id">>;
      }>,
    ) {
      const active = getActiveSolution(state);
      if (!active) return;
      const { id, patch } = action.payload;
      const box = active.skillBoxes.find(b => b.id === id);
      if (!box) return;
      Object.assign(box, patch);
      syncActiveSolutionCompat(state);
    },
    operatorBuildPatched(
      state,
      action: PayloadAction<{
        operatorId: string;
        patch: Partial<OperatorBuild>;
      }>,
    ) {
      const active = getActiveSolution(state);
      if (!active) return;
      const { operatorId, patch } = action.payload;
      const cur = active.buildByOperatorId[operatorId];
      if (!cur) return;

      // Recompute stats
      const next = { ...cur, ...patch } as OperatorBuild;
      next.id = operatorId;
      statUpdater(next);

      active.buildByOperatorId[operatorId] = next;
      syncActiveSolutionCompat(state);
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
      const active = getActiveSolution(state);
      if (!active) return;
      const { operatorId, skillType, startFrame } = action.payload;
      const durationFrames =
        action.payload.durationFrames ??
        getDurationFrames(operatorId, skillType);
      active.skillBoxes.push({
        id: makeId("sb_"),
        operatorId,
        skillType,
        startFrame,
        durationFrames,
      });
      syncActiveSolutionCompat(state);
    },
    skillBoxDeleted(state, action: PayloadAction<{ id: string }>) {
      const active = getActiveSolution(state);
      if (!active) return;
      const { id } = action.payload;
      const idx = active.skillBoxes.findIndex(b => b.id === id);
      if (idx >= 0) active.skillBoxes.splice(idx, 1);
      syncActiveSolutionCompat(state);
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
  workspaceTabNew,
  workspaceTabOpened,
  workspaceTabSetActive,
  workspaceTabRename,
  workspaceTabClone,
  workspaceTabClose,
} = solutionSlice.actions;

export default solutionSlice.reducer;
