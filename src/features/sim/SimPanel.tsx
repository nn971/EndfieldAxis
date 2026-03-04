import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { summarizeLog } from "../../simulator/log";
import { makeEmptySimRenderCache } from "../../types/editor";
import { makeEmptySimDamageCache } from "../../types/simDamage";
import {
  selectBuildByOperatorId,
  selectControlledOperatorId,
  selectSkillBoxes,
  selectTeamOperatorIds,
} from "../solution/selectors";
import {
  simDamageCacheReplaced,
  simRenderCacheReplaced,
} from "../solution/solutionSlice";
import { runSolutionSim } from "./runSolutionSim";

export default function SimPanel() {
  const dispatch = useAppDispatch();
  const [logText, setLogText] = useState("");
  const teamOperatorIds = useAppSelector(selectTeamOperatorIds);
  const controlledOperatorId = useAppSelector(selectControlledOperatorId);
  const skillBoxes = useAppSelector(selectSkillBoxes);
  const buildByOperatorId = useAppSelector(selectBuildByOperatorId);

  const run = () => {
    const result = runSolutionSim({
      teamOperatorIds,
      controlledOperatorId,
      skillBoxes,
      buildByOperatorId,
    });

    dispatch(simRenderCacheReplaced(result.simRenderCache));
    dispatch(
      simDamageCacheReplaced({
        totalDamage: result.totalDamage,
        hitDamageSnapshots: result.hitDamageSnapshots,
      }),
    );

    const finalWorldDescription = JSON.stringify(result.env, null, 2);
    setLogText(
      summarizeLog(
        result.log,
        ["sim", "act", "buff", "stat", "dmg", "SP", "dev"],
        true,
      ) +
        "\n\n" +
        `Final world state:\n${finalWorldDescription}`,
    );
  };

  return (
    <div className="mt-4 p-4 border border-zinc-700 rounded bg-zinc-900">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Simulator</h2>
          <div className="text-xs text-zinc-400">
            Console-style simulation log
          </div>
        </div>

        <div className="text-xs text-zinc-400 mt-1">
          Axis: {skillBoxes.length} skill boxes | Team:{" "}
          {teamOperatorIds.join(", ")}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-3 py-1 text-xs rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
            onClick={() => {
              setLogText("");
              dispatch(simRenderCacheReplaced(makeEmptySimRenderCache()));
              dispatch(simDamageCacheReplaced(makeEmptySimDamageCache()));
            }}
          >
            Clear
          </button>
          <button
            type="button"
            className="px-3 py-1 text-xs rounded border border-zinc-600 bg-zinc-100 text-zinc-900 hover:bg-white"
            onClick={run}
          >
            Run
          </button>
        </div>
      </div>

      <div className="mt-3">
        <pre className="h-[260px] overflow-auto rounded border border-zinc-800 bg-black/40 p-3 text-xs leading-5 whitespace-pre-wrap font-mono">
          {logText || "(click Run)"}
        </pre>
      </div>
    </div>
  );
}
