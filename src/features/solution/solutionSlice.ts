import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import operatorsData from "../../data/operators";
import type { SkillBox, SolutionState } from "../../types/editor";
import type { SkillType } from "../../data/operators/OperatorDef";
import type { OperatorBuild } from "../../types/operator";
import { makeId } from "../../shared/lib/id";
import { assignNoDup, moveItem } from "../../shared/lib/utils";

const DEFAULT_DURATION_FRAMES = 325;

function getDurationFrames(operatorId: string, skillType: SkillType): number {
  return (
    operatorsData[operatorId]?.skills?.[skillType]?.durationFrames ??
    DEFAULT_DURATION_FRAMES
  );
}

function makeDefaultBuild(): OperatorBuild {
  return {
    level: 90,

    potentialRank: 2,
    skillRanks: {
      normalAttack: 6,
      normalSkill: 6,
      comboSkill: 9,
      ultimate: 9,
    },
    talentRanks: {
      talent1: 2,
      talent2: 2,
    },
    weapon: {
      weaponId: "w1",
      level: 80,
      skillRanks: { wskill1: 6, wskill2: 9, wskill3: 4 },
    },
    gears: {
      armor: { gearId: "g_armor_1", ranks: [1, 0, 3] },
      gloves: { gearId: "g_gloves_2", ranks: [0, 0, 0] },
      kit1: { gearId: null, ranks: [0, 0, 0] },
      kit2: { gearId: null, ranks: [0, 0, 0] },
    },
  };
}

function initState(): SolutionState {
  const teamOperatorIds = Object.keys(operatorsData).slice(0, 4);
  const buildByOperatorId: Record<string, OperatorBuild> = {};
  for (const op of Object.values(operatorsData))
    buildByOperatorId[op.id] = makeDefaultBuild();

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
    skillBoxes: initialSkillBoxes,
    buildByOperatorId,
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
      return action.payload;
    },
    laneReordered(state, action: PayloadAction<{ from: number; to: number }>) {
      const { from, to } = action.payload;
      state.teamOperatorIds = moveItem(state.teamOperatorIds, from, to);
    },
    teammateAssigned(
      state,
      action: PayloadAction<{ laneIndex: number; newOpId: string }>,
    ) {
      const { laneIndex, newOpId } = action.payload;
      state.teamOperatorIds = assignNoDup(
        state.teamOperatorIds,
        laneIndex,
        newOpId,
      );
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
      state.buildByOperatorId[operatorId] = { ...cur, ...patch };
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
} = solutionSlice.actions;

export default solutionSlice.reducer;
