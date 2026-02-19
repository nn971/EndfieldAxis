import { useState } from "react";
import { useAppSelector } from "../../app/hooks";
import { selectSkillBoxes, selectTeamOperatorIds } from "../solution/selectors";
import {
  createSimWorld,
  makeQueue,
  runSim,
  schedule,
} from "../../simulator/sim";
import { createDefaultDamageModel } from "../../simulator/damageModel";
import type { OperatorBuild } from "../../types/operator";
import { createSeqGenerator } from "../../shared/lib/utils";
import { compileSkillCast } from "../../simulator/compiler";
import type { SimEvent, SimEntity } from "../../types/simulator/simulator";
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
    const world = createSimWorld([
      {
        id: "endministrator",
        name: "Endministrator",
        type: "operator",
        hp: 999999,
        inflictions: {},
        buffs: {},
      },
      {
        id: "chenqianyu",
        name: "Chen Qianyu",
        type: "operator",
        hp: 999999,
        inflictions: {},
        buffs: {},
      },
      {
        id: "enemy1",
        name: "Enemy1",
        type: "enemy",
        hp: 999999,
        inflictions: {},
        buffs: {},
      },
    ] as SimEntity[]);

    const queue = makeQueue();
    const nextSeq = createSeqGenerator(1);

    const events = TEMPgetSecondTestCaseEvents(nextSeq);

    for (const ev of events) schedule(queue, ev);

    // TEMP: build snapshot for damage formula (normally comes from Redux).
    const buildByOperatorId: Record<string, OperatorBuild> = {
      endministrator: {
        level: 90,
        mainAttributePoints: 0,
        secondaryAttributePoints: 0,
        potentialRank: 0,
        skillRanks: {},
        talentRanks: {},
        weapon: { weaponId: "w1", level: 1, skillRanks: {} },
        gears: {
          armor: { gearId: null, ranks: [0, 0, 0] },
          gloves: { gearId: null, ranks: [0, 0, 0] },
          kit1: { gearId: null, ranks: [0, 0, 0] },
          kit2: { gearId: null, ranks: [0, 0, 0] },
        },
      },
      chenqianyu: {
        level: 90,
        mainAttributePoints: 0,
        secondaryAttributePoints: 0,
        potentialRank: 0,
        skillRanks: {},
        talentRanks: {},
        weapon: { weaponId: "w1", level: 1, skillRanks: {} },
        gears: {
          armor: { gearId: null, ranks: [0, 0, 0] },
          gloves: { gearId: null, ranks: [0, 0, 0] },
          kit1: { gearId: null, ranks: [0, 0, 0] },
          kit2: { gearId: null, ranks: [0, 0, 0] },
        },
      },
    };

    const damageModel = createDefaultDamageModel();

    const { world: finalWorld, log } = runSim({
      world,
      queue,
      nextSeq,
      buildByOperatorId,
      damageModel,
    });

    // const finalWorldDescription = finalWorld.env.toString();
    // setLogText(log.join("\n") + `final world: ${finalWorldDescription}`);

    setLogText(log.join("\n"));
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
