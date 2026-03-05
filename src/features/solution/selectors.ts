import type { RootState } from "../../app/store";
import { makeEmptySimRenderCache, type SolutionState } from "../../types/editor";
import { makeEmptySimDamageCache } from "../../types/simDamage";

type SolutionWorkspaceEntity = {
  id: string;
  name: string;
  solution: SolutionState;
};

type SolutionWorkspace = RootState["solution"] & {
  activeId?: string;
  order?: string[];
  entities?: Record<string, SolutionWorkspaceEntity>;
};

const EMPTY_SOLUTION: SolutionState = {
  version: 0,
  teamOperatorIds: [],
  controlledOperatorId: "",
  skillBoxes: [],
  buildByOperatorId: {},
  simRenderCache: makeEmptySimRenderCache(),
  simDamageCache: makeEmptySimDamageCache(),
  damageWatches: [],
};

function getActiveWorkspaceProjection(state: RootState): {
  workspace: SolutionWorkspace;
  activeId: string;
  solution: SolutionState;
} {
  const workspace = state.solution as SolutionWorkspace;
  const entities = workspace.entities ?? {};
  const order = workspace.order ?? [];
  const firstOrderedId = order.find(id => Boolean(entities[id]));
  const fallbackId = firstOrderedId ?? Object.keys(entities)[0] ?? "";
  const activeId = entities[workspace.activeId ?? ""]
    ? (workspace.activeId as string)
    : fallbackId;
  const activeEntity = activeId ? entities[activeId] : undefined;

  return {
    workspace,
    activeId,
    solution: activeEntity?.solution ?? EMPTY_SOLUTION,
  };
}

export const selectSolutionWorkspace = (s: RootState) =>
  getActiveWorkspaceProjection(s).workspace;
export const selectActiveSolutionId = (s: RootState) =>
  getActiveWorkspaceProjection(s).activeId;
export const selectSolutionTabs = (s: RootState) => {
  const workspace = selectSolutionWorkspace(s);
  const order = workspace.order ?? [];
  const entities = workspace.entities ?? {};
  return order.flatMap(id => {
    const entity = entities[id];
    return entity ? [{ id: entity.id, name: entity.name }] : [];
  });
};

export const selectSolution = (s: RootState) =>
  getActiveWorkspaceProjection(s).solution;
export const selectSolutionVersion = (s: RootState) => selectSolution(s).version;
export const selectTeamOperatorIds = (s: RootState) =>
  selectSolution(s).teamOperatorIds;
export const selectControlledOperatorId = (s: RootState) =>
  selectSolution(s).controlledOperatorId;
export const selectSkillBoxes = (s: RootState) => selectSolution(s).skillBoxes;
export const selectBuildByOperatorId = (s: RootState) =>
  selectSolution(s).buildByOperatorId;
export const selectSimRenderCache = (s: RootState) =>
  selectSolution(s).simRenderCache;
export const selectSimDamageCache = (s: RootState) =>
  selectSolution(s).simDamageCache;
export const selectDamageWatches = (s: RootState) =>
  selectSolution(s).damageWatches;
