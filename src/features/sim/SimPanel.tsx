import { useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  selectBuildByOperatorId,
  selectSkillBoxes,
  selectTeamOperatorIds,
} from "../solution/selectors";
import { createDefaultDamageModel } from "../../simulator/damage/damageModel";
import { compileSkillCast } from "../../simulator/compilers";
import type { SimEvent, SimEntity } from "../../types/simulator/simulator";
import type { SkillBox } from "../../types/editor";
import type {
  SimRenderBar,
  SimRenderCache,
  SimRenderMarker,
} from "../../types/editor";
import { type OperatorBuild } from "../../types/operator";
import OperatorsData from "../../data/operators";
import { summarizeLog } from "../../simulator/log";
import { loadSimRegistry } from "../../simulator/listeners/registry";
import { SimWorld } from "../../simulator/simulator";
import type { SimResourceSample } from "../../simulator/simulator";
import { simRenderCacheReplaced } from "../solution/solutionSlice";
import {
  INFLICTION_TYPE_LIST,
  type InflictionType,
  SimInfliction,
} from "../../types/simulator/infliction";

function buildSimRenderCache(
  events: SimEvent[],
  resourceSamples: SimResourceSample[],
  teamSpCap: number,
  ultimateEnergyMaxByOperatorId: Record<string, number>,
): SimRenderCache {
  const bars: SimRenderBar[] = [];
  const markers: SimRenderMarker[] = [];

  type ActiveBar = SimRenderBar & { key: string };
  const activeByKey = new Map<string, ActiveBar>();

  let simEndFrame = 0;

  function closeBar(key: string, frame: number) {
    const active = activeByKey.get(key);
    if (!active) return;
    active.endFrame = Math.max(active.startFrame + 1, frame);
    bars.push(active);
    activeByKey.delete(key);
  }

  for (const ev of events) {
    simEndFrame = Math.max(simEndFrame, ev.frame);
    if (ev.type === "statusApply") {
      markers.push({
        id: `status:${ev.id}`,
        type: "status",
        ownerId: ev.targetId,
        effectId: ev.statusType,
        frame: ev.frame,
      });
      continue;
    }

    if (ev.type === "buffApply") {
      const ownerId = ev.ownerId;
      const key = `buff:${ownerId}:${ev.buffId}`;
      const active = activeByKey.get(key);
      if (active) {
        active.refreshFrames.push(ev.frame);
        markers.push({
          id: `buff-refresh:${ev.id}`,
          type: "buffRefresh",
          ownerId,
          effectId: ev.buffId,
          frame: ev.frame,
        });
      } else {
        activeByKey.set(key, {
          id: `bar:${key}:${ev.id}`,
          key,
          type: "buff",
          ownerId,
          effectId: ev.buffId,
          startFrame: ev.frame,
          endFrame: ev.frame,
          refreshFrames: [],
        });
      }
      continue;
    }

    if (ev.type === "buffExpire" || ev.type === "buffRemove") {
      closeBar(`buff:${ev.ownerId}:${ev.buffId}`, ev.frame);
      continue;
    }

    if (ev.type === "inflictionApply") {
      const ownerId = ev.ownerId;
      const key = `infliction:${ownerId}:${ev.inflictionType}`;
      const active = activeByKey.get(key);
      if (active) {
        active.endFrame = Math.max(active.endFrame, ev.frame);
      } else {
        activeByKey.set(key, {
          id: `bar:${key}:${ev.id}`,
          key,
          type: "infliction",
          ownerId,
          effectId: ev.inflictionType,
          startFrame: ev.frame,
          endFrame: ev.frame,
          refreshFrames: [],
        });
      }
      continue;
    }

    if (ev.type === "inflictionExpire" || ev.type === "inflictionRemove") {
      if (!ev.ownerId) continue;
      closeBar(`infliction:${ev.ownerId}:${ev.inflictionType}`, ev.frame);
    }
  }

  for (const active of activeByKey.values()) {
    active.endFrame = Math.max(active.startFrame + 1, simEndFrame);
    bars.push(active);
  }

  const teamSpSeries = resourceSamples.map(sample => ({
    frame: sample.frame,
    seq: sample.seq,
    value: sample.teamSp,
  }));

  const ultimateEnergySeriesByOperatorId: Record<
    string,
    { frame: number; seq: number; value: number }[]
  > = {};

  for (const operatorId of Object.keys(ultimateEnergyMaxByOperatorId)) {
    ultimateEnergySeriesByOperatorId[operatorId] = resourceSamples.map(
      sample => ({
        frame: sample.frame,
        seq: sample.seq,
        value: Number(sample.ultimateCurrentByOperatorId[operatorId] ?? 0),
      }),
    );
  }

  return {
    bars,
    markers,
    teamSpSeries,
    teamSpCap,
    ultimateEnergySeriesByOperatorId,
    ultimateEnergyMaxByOperatorId,
    simEndFrame,
  };
}

function compileSkillBoxes(params: {
  skillBoxes: SkillBox[];
  targetId: string;
  nextSeq: () => number;
  buildByOperatorId: Record<string, OperatorBuild>;
}): SimEvent[] {
  const { skillBoxes, targetId, nextSeq, buildByOperatorId } = params;

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
      buildByOperatorId,
    });
    out.push(...evs);
  }
  return out;
}

function getEmptyInfliction(): Record<InflictionType, SimInfliction> {
  return Object.fromEntries(
    INFLICTION_TYPE_LIST.map(type => [
      type,
      {
        type: type,
        stacks: 0,
        lastApplyFrame: -1,
      },
    ]),
  ) as Record<InflictionType, SimInfliction>;
}

export default function SimPanel() {
  const dispatch = useAppDispatch();
  const [logText, setLogText] = useState("");
  const teamOperatorIds = useAppSelector(selectTeamOperatorIds);
  const skillBoxes = useAppSelector(selectSkillBoxes);
  const buildByOperatorId = useAppSelector(selectBuildByOperatorId);

  const registry = useMemo(() => loadSimRegistry(), []);

  const run = () => {
    const targetId = "enemy1";

    const allOperatorIds = new Set<string>(teamOperatorIds);
    for (const box of skillBoxes) {
      allOperatorIds.add(box.operatorId);
    }

    const entities: SimEntity[] = [
      ...Array.from(allOperatorIds).map(operatorId => ({
        id: operatorId,
        name: OperatorsData[operatorId]?.name ?? operatorId,
        type: "operator" as const,
        hp: 999999,
        inflictions: getEmptyInfliction(),
        buffs: {},
        combo: {
          cooldown: 0,
          pending: false,
          availableUntilFrame: -1,
          lastTriggerFrame: -1,
        },
      })),
      {
        id: targetId,
        name: "Enemy1",
        type: "enemy",
        hp: 999999,
        inflictions: getEmptyInfliction(),
        buffs: {},
      },
    ];

    const world = new SimWorld({
      entities,
      buildByOperatorId,
      nowInFrames: 0,
      futureEvents: [],
      registry,
      damageModel: createDefaultDamageModel(),
      teamOperatorIds,
    });

    const events = compileSkillBoxes({
      skillBoxes,
      targetId,
      nextSeq: world.ops.nextSeq,
      buildByOperatorId,
    });
    for (const ev of events) world.ops.schedule(ev);

    world.runSim();
    const ultimateEnergyMaxByOperatorId = Object.fromEntries(
      Object.entries(world.env.resources.ultimateByOperatorId).map(
        ([operatorId, state]) => [operatorId, Number(state.max ?? 0)],
      ),
    );
    dispatch(
      simRenderCacheReplaced(
        buildSimRenderCache(
          world.processedEvents,
          world.resourceSamples,
          Number(world.env.resources.teamSp.cap),
          ultimateEnergyMaxByOperatorId,
        ),
      ),
    );

    const finalWorldDescription = JSON.stringify(world.env, null, 2);
    setLogText(
      summarizeLog(
        world.log,
        ["sim", "act", "buff", "stat", "dmg", "dev"],
        false,
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
              dispatch(
                simRenderCacheReplaced({
                  bars: [],
                  markers: [],
                  teamSpSeries: [],
                  teamSpCap: 0,
                  ultimateEnergySeriesByOperatorId: {},
                  ultimateEnergyMaxByOperatorId: {},
                  simEndFrame: 0,
                }),
              );
            }}
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
