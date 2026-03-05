import { useState } from "react";
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
  selectBuildByOperatorId,
  selectControlledOperatorId,
  selectSimRenderCache,
  selectSkillBoxes,
  selectTeamOperatorIds,
} from "./features/solution/selectors";
import SolutionSLPanel from "./features/solution/SolutionSLPanel";
import TestPanel from "./features/dev/testPanel";
import DamageStatisticPanel from "./features/sim/DamageStatisticPanel";
import LanguageSwitcher from "./shared/components/LanguageSwitcher";

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

  const teamOperatorIds = useAppSelector(selectTeamOperatorIds);
  const controlledOperatorId = useAppSelector(selectControlledOperatorId);
  const skillBoxes = useAppSelector(selectSkillBoxes);
  const buildByOperatorId = useAppSelector(selectBuildByOperatorId);
  const simRenderCache = useAppSelector(selectSimRenderCache);

  const [selectedLane, setSelectedLane] = useState<number | null>(null);

  const operatorId =
    selectedLane == null ? null : (teamOperatorIds[selectedLane] ?? null);
  const operatorBuild = operatorId ? buildByOperatorId[operatorId] : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-7xl p-4">
        <div className="mb-3 flex justify-end">
          <LanguageSwitcher />
        </div>

        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="w-full lg:w-[300px] lg:shrink-0">
            <OperatorEditor
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
            <SolutionSLPanel />
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
