import { useMemo, useState } from "react";
import { useAppSelector } from "../../app/hooks";
import { selectSkillBoxes, selectTeamOperatorIds } from "../solution/selectors";
import { getOperator } from "../../data/operators";
import { createSimWorld, makeQueue, runSim, schedule } from "../../sim/sim";
import { createSeqGenerator } from "../../shared/lib/utils";
import { compileSkillCast } from "../../sim/compiler";
import type { SimEvent, SimEntity } from "../../types/sim/simulator";
import type { SkillBox } from "../../types/editor";

import {
  TEMPgetZerothTestCaseEvents,
  TEMPgetFirstTestCaseEvents,
  TEMPgetSecondTestCaseEvents,
} from "./TEMPTestCases";

function compileSkillBoxes(params: {
  skillBoxes: SkillBox[];
  targetId: string;
  nextSeq: () => number;
}): SimEvent[] {
  const { skillBoxes, targetId, nextSeq } = params;

  // Deterministic ordering when multiple boxes have same frame
  const sorted = [...skillBoxes].sort((a, b) => {
    if (a.startFrame !== b.startFrame) return a.startFrame - b.startFrame;
    if (a.operatorId !== b.operatorId)
      return a.operatorId.localeCompare(b.operatorId);
    if (a.skillType !== b.skillType)
      return a.skillType.localeCompare(b.skillType);
    return a.id.localeCompare(b.id);
  });

  const out: SimEvent[] = [];
  for (const box of sorted) {
    const evs = compileSkillCast({
      sourceId: box.operatorId,
      skillType: box.skillType,
      targetId,
      startFrame: box.startFrame,
      nextSeq,
    });
    out.push(...evs);
  }
  return out;
}

export default function SimPanel() {
  const [logText, setLogText] = useState("");
  const teamOperatorIds = useAppSelector(selectTeamOperatorIds);
  const skillBoxes = useAppSelector(selectSkillBoxes);

  const run = () => {
    // const world = createSimWorld([
    //   {
    //     id: "endministrator",
    //     name: "Endministrator",
    //     type: "operator",
    //     inflictions: {},
    //   },
    //   {
    //     id: "chenqianyu",
    //     name: "Chen Qianyu",
    //     type: "operator",
    //     inflictions: {},
    //   },
    //   { id: "enemy1", name: "Enemy1", type: "enemy", inflictions: {} },
    // ] as SimEntity[]);

    // TEMP Optional: pre-seed enemy vulnerable stacks for testing.
    // const initialVulnStacks = 3;
    // if (initialVulnStacks > 0) {
    //   setStacks(world, statusLib, "enemy", "vulnerable", initialVulnStacks);
    // }

    const entities: SimEntity[] = [
      ...teamOperatorIds.map(opId => {
        const op = getOperator(opId);
        return {
          id: opId,
          name: op?.name ?? opId,
          type: "operator",
          hp: 1,
          inflictions: {},
          buffs: {},
        };
      }),
      // Just add a default enemy for now
      {
        id: "enemy1",
        name: "Enemy1",
        type: "enemy",
        hp: 1,
        inflictions: {},
        buffs: {},
      },
    ];

    const world = createSimWorld(entities);

    const queue = makeQueue();
    const nextSeq = createSeqGenerator(1);

    // const events = TEMPgetSecondTestCaseEvents(nextSeq);
    const events = compileSkillBoxes({
      skillBoxes,
      targetId: "enemy1",
      nextSeq,
    });
    for (const ev of events) schedule(queue, ev);

    const { world: finalWorld, log } = runSim({ world, queue, nextSeq });

    // const finalStacks =
    //   finalWorld.env.entitiesById["enemy1"].inflictions["vulnerable"]?.stacks ??
    //   0;
    // const tail = `\n[----] FINAL enemy.vulnerable=${finalStacks}`;

    const finalWorldDescription = finalWorld.env.toString();
    setLogText(log.join("\n") + `final world: ${finalWorldDescription}`);
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
            onClick={() => setLogText("")}
          >
            Clear
          </button>
          <button
            type="button"
            className="px-3 py-1 text-xs rounded border border-zinc-600 bg-zinc-100 text-zinc-900 hover:bg-white"
            onClick={() => run()}
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
