import type { RootState } from '../../app/store';

export const selectTeamOperatorIds = (s: RootState) => s.solution.teamOperatorIds;
export const selectSkillBoxes = (s: RootState) => s.solution.skillBoxes;
export const selectBuildByOperatorId = (s: RootState) => s.solution.buildByOperatorId;
