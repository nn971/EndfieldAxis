import { useEffect, useState } from "react";
import AxisEditor from "./features/axis/AxisEditor";
import OperatorEditor from "./features/operator/OperatorEditor";
import SimPanel from "./features/sim/SimPanel";
import { useAppDispatch, useAppSelector } from "./app/hooks";
import {
  controlledOperatorSet,
  laneReordered,
  teammateAssigned,
  skillBoxPatched,
  operatorBuildPatched,
  skillBoxAdded,
  skillBoxDeleted,
} from "./features/solution/solutionSlice";
import {
  selectActiveSolutionId,
  selectBuildByOperatorId,
  selectControlledOperatorId,
  selectSimRenderCache,
  selectSkillBoxes,
  selectTeamOperatorIds,
} from "./features/solution/selectors";
import TestPanel from "./features/dev/testPanel";
import DamageStatisticPanel from "./features/sim/DamageStatisticPanel";
import TopBar from "./shared/components/TopBar";

function remapSelectedLane(
  selectedLane: number | null,
  from: number,
  to: number,
) {
  if (selectedLane == null) return null;
  if (selectedLane === from) return to;
  if (from < to && selectedLane > from && selectedLane <= to)
    return selectedLane - 1;
  if (from > to && selectedLane < from && selectedLane >= to)
    return selectedLane + 1;
  return selectedLane;
}

export default function App() {
  const dispatch = useAppDispatch();

  const activeSolutionId = useAppSelector(selectActiveSolutionId);
  const teamOperatorIds = useAppSelector(selectTeamOperatorIds);
  const controlledOperatorId = useAppSelector(selectControlledOperatorId);
  const skillBoxes = useAppSelector(selectSkillBoxes);
  const buildByOperatorId = useAppSelector(selectBuildByOperatorId);
  const simRenderCache = useAppSelector(selectSimRenderCache);

  const [selectedLane, setSelectedLane] = useState<number | null>(null);

  useEffect(() => {
    void activeSolutionId;
    setSelectedLane(null);
  }, [activeSolutionId]);

  const operatorId =
    selectedLane == null ? null : (teamOperatorIds[selectedLane] ?? null);
  const operatorBuild = operatorId ? buildByOperatorId[operatorId] : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-7xl p-4">
        <TopBar />

        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="w-full lg:w-[300px] lg:shrink-0">
            <OperatorEditor
              key={activeSolutionId}
              laneIndex={selectedLane}
              operatorId={operatorId}
              operatorBuild={operatorBuild}
              teamOperatorIds={teamOperatorIds}
              controlledOperatorId={controlledOperatorId}
              onCommitOperatorBuildPatch={(opId, patch) =>
                dispatch(operatorBuildPatched({ operatorId: opId, patch }))
              }
              onChangeTeammateId={(laneIndex, newOpId) =>
                dispatch(teammateAssigned({ laneIndex, newOpId }))
              }
              onClose={() => setSelectedLane(null)}
              onSetControlledOperator={operatorId =>
                dispatch(controlledOperatorSet({ operatorId }))
              }
            />
          </div>

          <div className="min-w-0 flex-1">
            <AxisEditor
              key={activeSolutionId}
              teamOperatorIds={teamOperatorIds}
              controlledOperatorId={controlledOperatorId}
              skillBoxes={skillBoxes}
              simRenderCache={simRenderCache}
              onLaneLabelClick={laneIndex => setSelectedLane(laneIndex)}
              onCommitLaneReorder={(from, to) => {
                dispatch(laneReordered({ from, to }));
                setSelectedLane(prev => remapSelectedLane(prev, from, to));
              }}
              onCommitSkillBoxPatch={(id, patch) =>
                dispatch(skillBoxPatched({ id, patch }))
              }
              onAddSkillBox={payload => dispatch(skillBoxAdded(payload))}
              onDeleteSkillBox={id => dispatch(skillBoxDeleted({ id }))}
            />

            <SimPanel />
            <TestPanel />
          </div>

          <div className="w-full lg:w-[320px] lg:shrink-0 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-auto">
            <DamageStatisticPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
