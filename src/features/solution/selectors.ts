import type { RootState } from "../../app/store";

export const selectSolution = (s: RootState) => s.solution;
export const selectSolutionVersion = (s: RootState) => s.solution.version;
export const selectTeamOperatorIds = (s: RootState) =>
  s.solution.teamOperatorIds;
export const selectSkillBoxes = (s: RootState) => s.solution.skillBoxes;
export const selectBuildByOperatorId = (s: RootState) =>
  s.solution.buildByOperatorId;
export const selectSimRenderCache = (s: RootState) => s.solution.simRenderCache;
