import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { summarizeLog } from "../../simulator/log/log";
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
import { formatSimLog } from "./formatSimLog";
import { runSolutionSim, type RunSolutionSimResult } from "./runSolutionSim";

export default function SimPanel() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const [lastRunResult, setLastRunResult] =
    useState<RunSolutionSimResult | null>(null);
  const teamOperatorIds = useAppSelector(selectTeamOperatorIds);
  const controlledOperatorId = useAppSelector(selectControlledOperatorId);
  const skillBoxes = useAppSelector(selectSkillBoxes);
  const buildByOperatorId = useAppSelector(selectBuildByOperatorId);

  const logText = useMemo(() => {
    if (!lastRunResult) return "";

    const finalWorldDescription = JSON.stringify(lastRunResult.env, null, 2);
    return (
      summarizeLog(
        lastRunResult.log,
        // ["sim", "act", "buff", "stat", "dmg", "SP", "dev"],
        ["SP", "act"],
        true,
        (message, entry) =>
          formatSimLog({
            t,
            language: i18n.language,
            env: entry.env,
            entry,
            message,
          }),
      ) +
      "\n\n" +
      `${t("sim.finalWorldState")}\n${finalWorldDescription}`
    );
  }, [i18n.language, lastRunResult, t]);

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

    setLastRunResult(result);
  };

  return (
    <div
      className="mt-4 p-4 border border-zinc-700 rounded bg-zinc-900"
      data-testid="panel-sim"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("sim.heading")}</h2>
          <div className="text-xs text-zinc-400">
            {t("sim.consoleStyleLog")}
          </div>
        </div>

        <div className="text-xs text-zinc-400 mt-1">
          {t("sim.status", {
            skillBoxes: skillBoxes.length,
            team: teamOperatorIds.join(", "),
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-3 py-1 text-xs rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
            onClick={() => {
              setLastRunResult(null);
              dispatch(simRenderCacheReplaced(makeEmptySimRenderCache()));
              dispatch(simDamageCacheReplaced(makeEmptySimDamageCache()));
            }}
          >
            {t("sim.clear")}
          </button>
          <button
            type="button"
            className="px-3 py-1 text-xs rounded border border-zinc-600 bg-zinc-100 text-zinc-900 hover:bg-white"
            onClick={run}
            data-testid="sim-run"
          >
            {t("sim.run")}
          </button>
        </div>
      </div>

      <div className="mt-3">
        <pre
          className="h-[260px] overflow-auto rounded border border-zinc-800 bg-black/40 p-3 text-xs leading-5 whitespace-pre-wrap font-mono"
          data-testid="sim-log"
        >
          {logText || t("sim.clickRun")}
        </pre>
      </div>
    </div>
  );
}
