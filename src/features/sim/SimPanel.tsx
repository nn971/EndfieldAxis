import { useState } from "react";
import { useAppSelector } from "../../app/hooks";
import {
  selectBuildByOperatorId,
  selectSkillBoxes,
  selectTeamOperatorIds,
} from "../solution/selectors";
import {
  createSimWorld,
  makeQueue,
  runSim,
  schedule,
} from "../../simulator/sim";
import { createDefaultDamageModel } from "../../simulator/damageModel";
import { createSeqGenerator } from "../../shared/lib/utils";
import { compileSkillCast } from "../../simulator/compiler";
import type { SimEvent, SimEntity } from "../../types/simulator/simulator";
import type { SkillBox } from "../../types/editor";
import { operatorsById } from "../../data/operators";

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
  const buildByOperatorId = useAppSelector(selectBuildByOperatorId);

  const run = () => {
    const targetId = "enemy1";

    const allOperatorIds = new Set<string>(teamOperatorIds);
    for (const box of skillBoxes) {
      allOperatorIds.add(box.operatorId);
    }

    const entities: SimEntity[] = [
      ...Array.from(allOperatorIds).map(operatorId => ({
        id: operatorId,
        name: operatorsById[operatorId]?.name ?? operatorId,
        type: "operator" as const,
        hp: 999999,
        inflictions: {},
        buffs: {},
      })),
      {
        id: targetId,
        name: "Enemy1",
        type: "enemy",
        hp: 999999,
        inflictions: {},
        buffs: {},
      },
    ];

    const world = createSimWorld(entities);

    const queue = makeQueue();
    const nextSeq = createSeqGenerator(1);

    const events = compileSkillBoxes({
      skillBoxes,
      targetId,
      nextSeq,
    });

    for (const ev of events) schedule(queue, ev);

    const damageModel = createDefaultDamageModel();

    const { log } = runSim({
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
