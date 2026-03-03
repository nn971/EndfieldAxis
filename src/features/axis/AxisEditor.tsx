import { useEffect, useMemo, useRef, useState } from "react";
import type {
  SimRenderBar,
  SimRenderMarker,
  SimRenderCache,
  SkillBox,
} from "../../types/editor";
import type { SkillType } from "../../data/operators/OperatorDef";
import operatorsData from "../../data/operators";
import { moveItem } from "../../shared/lib/utils";
import placeholderImg from "../../assets/default/placeholder.jpg";

type SeriesPoint = { frame: number; value: number };

function buildLineAndAreaPath(params: {
  points: SeriesPoint[];
  maxFrame: number;
  maxValue: number;
  width: number;
  height: number;
}) {
  const { points, maxFrame, maxValue, width, height } = params;
  if (points.length === 0 || width <= 0 || height <= 0 || maxValue <= 0) {
    return { linePath: "", areaPath: "" };
  }

  const toX = (frame: number) =>
    Math.max(0, Math.min(width, (frame / maxFrame) * width));
  const toY = (value: number) =>
    Math.max(0, Math.min(height, height - (value / maxValue) * height));

  const lineSegments = points.map((point, idx) => {
    const x = toX(point.frame);
    const y = toY(point.value);
    return `${idx === 0 ? "M" : "L"}${x} ${y}`;
  });

  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const areaPath =
    `${lineSegments.join(" ")} ` +
    `L${toX(lastPoint.frame)} ${height} ` +
    `L${toX(firstPoint.frame)} ${height} Z`;

  return {
    linePath: lineSegments.join(" "),
    areaPath,
  };
}

const SKILL_TABS: { key: SkillType; label: string }[] = [
  { key: "normalAttack", label: "Normal Attack" },
  { key: "normalSkill", label: "Normal Skill" },
  { key: "comboSkill", label: "Combo Skill" },
  { key: "ultimate", label: "Ultimate" },
];

type Props = {
  teamOperatorIds: string[];
  controlledOperatorId: string;
  skillBoxes: SkillBox[];
  simRenderCache: SimRenderCache;
  onLaneLabelClick?: (laneIndex: number) => void;
  onCommitLaneReorder?: (from: number, to: number) => void;
  onCommitSkillBoxPatch?: (
    id: string,
    patch: Partial<Omit<SkillBox, "id">>,
  ) => void;
  onAddSkillBox?: (payload: {
    operatorId: string;
    skillType: SkillType;
    startFrame: number;
    durationFrames?: number;
  }) => void;
  onDeleteSkillBox?: (id: string) => void;
};

// const operatorsData = operatorsJson as OperatorDef[];

export default function AxisEditor({
  teamOperatorIds,
  controlledOperatorId,
  skillBoxes,
  simRenderCache,
  onLaneLabelClick,
  onCommitLaneReorder,
  onCommitSkillBoxPatch,
  onAddSkillBox,
  onDeleteSkillBox,
}: Props) {
  const LEFT_GUTTER_WIDTH = 150;
  const AXIS_LENTH_IN_FRAMES = 3600;
  const UPPER_GUTTER_HEIGHT = 20;
  const SP_TRACK_HEIGHT = 36;
  const LANE_AREA_TOP = UPPER_GUTTER_HEIGHT + SP_TRACK_HEIGHT;
  const LANE_HEIGHT = 100;
  const SKILL_BOX_HEIGHT = 30;
  const BUFF_BAR_HEIGHT = 8;
  const BAR_ROW_PITCH = 12;
  const MARKER_ROW_PITCH = 18;
  const BAR_BAND_OFFSET = 12;
  const MARKER_BAND_OFFSET = 56;
  const RENDERED_LANE_COUNT = 5;
  const ENEMY_LANE_INDEX = 4;

  const MINOR = 12;
  const MAJOR = 60;

  const axisAreaRef = useRef<HTMLDivElement | null>(null);

  // const operatorsById = useMemo<Record<string, OperatorDef>>(
  //   () => Object.fromEntries(operatorsData.map(op => [op.id, op])),
  //   [],
  // );

  /* adding skill box handlers */
  const DEFAULT_NEW_BOX_DURATION = 325;

  const [addSkillDrag, setAddSkillDrag] = useState<null | {
    pointerId: number;
    skillType: SkillType;
    overAxis: boolean;
    laneIndex: number | null;
    startFrame: number | null;
  }>(null);

  function computeDropTarget(clientX: number, clientY: number) {
    const el = axisAreaRef.current;
    if (!el)
      return {
        overAxis: false,
        laneIndex: null as number | null,
        startFrame: null as number | null,
      };

    const rect = el.getBoundingClientRect();

    const localX = clientX - rect.left; // includes scrollLeft automatically due to rect shifting
    const localY = clientY - rect.top;

    const overAxis =
      localX >= 0 &&
      localX <= AXIS_LENTH_IN_FRAMES &&
      localY >= LANE_AREA_TOP &&
      localY <= LANE_AREA_TOP + 4 * LANE_HEIGHT;

    if (!overAxis)
      return { overAxis: false, laneIndex: null, startFrame: null };

    const laneIndex = Math.max(
      0,
      Math.min(3, Math.floor((localY - LANE_AREA_TOP) / LANE_HEIGHT)),
    );
    const startFrame = clampStart(Math.round(localX)); // 1px = 1 frame in your current coordinate model

    return { overAxis: true, laneIndex, startFrame };
  }

  function onSkillTypePointerDown(
    e: React.PointerEvent<HTMLButtonElement>,
    skillType: SkillType,
  ) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    const t = computeDropTarget(e.clientX, e.clientY);
    setAddSkillDrag({
      pointerId: e.pointerId,
      skillType,
      overAxis: t.overAxis,
      laneIndex: t.laneIndex,
      startFrame: t.startFrame,
    });
  }

  function onSkillTypePointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (!addSkillDrag) return;
    if (e.pointerId !== addSkillDrag.pointerId) return;

    e.preventDefault();
    const t = computeDropTarget(e.clientX, e.clientY);
    setAddSkillDrag(prev =>
      prev
        ? {
            ...prev,
            overAxis: t.overAxis,
            laneIndex: t.laneIndex,
            startFrame: t.startFrame,
          }
        : prev,
    );
  }

  function onSkillTypePointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    if (!addSkillDrag) return;
    if (e.pointerId !== addSkillDrag.pointerId) return;

    e.preventDefault();
    e.currentTarget.releasePointerCapture(addSkillDrag.pointerId);

    if (
      addSkillDrag.overAxis &&
      addSkillDrag.laneIndex != null &&
      addSkillDrag.startFrame != null
    ) {
      // respect lane reorder preview if it is active
      const effectiveTeamOperatorIds = laneDragState
        ? moveItem(
            laneDragState.originIds,
            laneDragState.from,
            laneDragState.to,
          )
        : teamOperatorIds;

      const operatorId = effectiveTeamOperatorIds[addSkillDrag.laneIndex];
      if (operatorId) {
        onAddSkillBox?.({
          operatorId,
          skillType: addSkillDrag.skillType,
          startFrame: addSkillDrag.startFrame,
        });
      }
    }

    setAddSkillDrag(null);
  }

  function onSkillTypePointerCancel() {
    setAddSkillDrag(null);
  }

  /* skill box right-click menu handlers */
  const [skillBoxMenu, setSkillBoxMenu] = useState<null | {
    boxId: string;
    x: number; // viewport coords
    y: number;
  }>(null);

  function openSkillBoxMenu(e: React.MouseEvent, boxId: string) {
    e.preventDefault(); // stop browser menu
    e.stopPropagation();

    const MENU_W = 160;
    const MENU_H = 44;

    const x = Math.min(e.clientX, window.innerWidth - MENU_W - 8);
    const y = Math.min(e.clientY, window.innerHeight - MENU_H - 8);

    setSkillBoxMenu({ boxId, x, y });
  }
  useEffect(() => {
    if (!skillBoxMenu) return;

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setSkillBoxMenu(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [skillBoxMenu]);

  /* dragging skill boxes handlers */
  const [skillBoxDragState, setSkillBoxDragState] = useState<null | {
    id: string;
    pointerId: number;
    originX: number;
    originStartFrame: number;
    previewStartFrame: number;
  }>(null);

  const clampStart = (x: number) =>
    Math.max(0, Math.min(AXIS_LENTH_IN_FRAMES, x));

  function onSkillBoxPointerDown(
    e: React.PointerEvent<HTMLDivElement>,
    box: SkillBox,
  ) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    setSkillBoxDragState({
      id: box.id,
      pointerId: e.pointerId,
      originX: e.clientX,
      originStartFrame: box.startFrame,
      previewStartFrame: box.startFrame,
    });
  }

  function onSkillBoxPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!skillBoxDragState) return;
    if (e.pointerId !== skillBoxDragState.pointerId) return;

    e.preventDefault();
    const deltaFrames = Math.round(e.clientX - skillBoxDragState.originX);
    const nextStart = clampStart(
      skillBoxDragState.originStartFrame + deltaFrames,
    );

    setSkillBoxDragState(prev =>
      prev ? { ...prev, previewStartFrame: nextStart } : prev,
    );
  }

  function onSkillBoxPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!skillBoxDragState) return;
    if (e.pointerId !== skillBoxDragState.pointerId) return;

    e.preventDefault();
    e.currentTarget.releasePointerCapture(skillBoxDragState.pointerId);

    onCommitSkillBoxPatch?.(skillBoxDragState.id, {
      startFrame: skillBoxDragState.previewStartFrame,
    });

    setSkillBoxDragState(null);
  }

  function onSkillBoxPointerCancel() {
    setSkillBoxDragState(null);
  }

  /* lane reordering handlers */
  const [laneDragState, setLaneDragState] = useState<null | {
    pointerId: number;
    startX: number;
    startY: number;
    from: number;
    to: number;
    moved: boolean;
    originIds: string[];
  }>(null);

  const CLICK_TOL = 5;
  const clampLane = (x: number) => Math.max(0, Math.min(3, x));

  function onLanePointerDown(
    e: React.PointerEvent<HTMLButtonElement>,
    laneIndex: number,
  ) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    setLaneDragState({
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      from: laneIndex,
      to: laneIndex,
      moved: false,
      originIds: teamOperatorIds,
    });
  }

  function onLanePointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (!laneDragState) return;
    if (e.pointerId !== laneDragState.pointerId) return;

    e.preventDefault();
    const dx = e.clientX - laneDragState.startX;
    const dy = e.clientY - laneDragState.startY;

    const movedNow =
      laneDragState.moved ||
      Math.abs(dx) > CLICK_TOL ||
      Math.abs(dy) > CLICK_TOL;

    const deltaLanes = Math.round(dy / LANE_HEIGHT);
    const target = clampLane(laneDragState.from + deltaLanes);

    setLaneDragState(prev =>
      prev ? { ...prev, moved: movedNow, to: target } : prev,
    );
  }

  function onLanePointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    if (!laneDragState) return;
    if (e.pointerId !== laneDragState.pointerId) return;

    e.preventDefault();
    e.currentTarget.releasePointerCapture(laneDragState.pointerId);

    if (!laneDragState.moved) {
      onLaneLabelClick?.(laneDragState.from);
    } else if (laneDragState.from !== laneDragState.to) {
      onCommitLaneReorder?.(laneDragState.from, laneDragState.to);
    }

    setLaneDragState(null);
  }

  function onLanePointerCancel() {
    setLaneDragState(null);
  }

  const effectiveTeamOperatorIds = laneDragState
    ? moveItem(laneDragState.originIds, laneDragState.from, laneDragState.to)
    : teamOperatorIds;

  const ghostOperatorId =
    addSkillDrag?.laneIndex != null
      ? effectiveTeamOperatorIds[addSkillDrag.laneIndex]
      : null;

  const ghostDurationFrames =
    ghostOperatorId && addSkillDrag
      ? (operatorsData[ghostOperatorId]?.skills?.[addSkillDrag.skillType]
          ?.durationFrames ?? DEFAULT_NEW_BOX_DURATION)
      : DEFAULT_NEW_BOX_DURATION;

  const laneLabels = useMemo(
    () => [...effectiveTeamOperatorIds, "enemy"],
    [effectiveTeamOperatorIds],
  );

  const laneIndexByOwnerId = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < effectiveTeamOperatorIds.length; i += 1) {
      map.set(effectiveTeamOperatorIds[i], i);
    }
    return map;
  }, [effectiveTeamOperatorIds]);

  const toLaneIndex = (targetId: string): number =>
    laneIndexByOwnerId.get(targetId) ?? ENEMY_LANE_INDEX;

  const barRowById = useMemo(() => {
    const byLane: Record<number, number[]> = {};
    const rows = new Map<string, number>();
    const sorted = [...simRenderCache.bars].sort((a, b) => {
      const laneDelta = toLaneIndex(a.targetId) - toLaneIndex(b.targetId);
      if (laneDelta !== 0) return laneDelta;
      if (a.startFrame !== b.startFrame) return a.startFrame - b.startFrame;
      if (a.endFrame !== b.endFrame) return a.endFrame - b.endFrame;
      return a.id.localeCompare(b.id);
    });

    for (const bar of sorted) {
      const laneIndex = toLaneIndex(bar.targetId);
      const laneRows = (byLane[laneIndex] ??= []);
      let rowIndex = laneRows.findIndex(
        lastEnd => bar.startFrame > lastEnd + 2,
      );
      if (rowIndex < 0) {
        rowIndex = laneRows.length;
        laneRows.push(bar.endFrame);
      } else {
        laneRows[rowIndex] = Math.max(laneRows[rowIndex], bar.endFrame);
      }
      rows.set(bar.id, rowIndex);
    }

    return rows;
  }, [simRenderCache.bars, laneIndexByOwnerId]);

  const markerRowById = useMemo(() => {
    const byLane: Record<number, number[]> = {};
    const rows = new Map<string, number>();
    const sorted = [...simRenderCache.markers].sort((a, b) => {
      const laneDelta = toLaneIndex(a.targetId) - toLaneIndex(b.targetId);
      if (laneDelta !== 0) return laneDelta;
      if (a.frame !== b.frame) return a.frame - b.frame;
      return a.id.localeCompare(b.id);
    });

    for (const marker of sorted) {
      const laneIndex = toLaneIndex(marker.targetId);
      const laneRows = (byLane[laneIndex] ??= []);
      let rowIndex = laneRows.findIndex(
        lastFrame => marker.frame > lastFrame + 10,
      );
      if (rowIndex < 0) {
        rowIndex = laneRows.length;
        laneRows.push(marker.frame);
      } else {
        laneRows[rowIndex] = marker.frame;
      }
      rows.set(marker.id, rowIndex);
    }

    return rows;
  }, [simRenderCache.markers, laneIndexByOwnerId]);

  return (
    <div className="p-4 border border-zinc-700 rounded bg-zinc-900">
      <h2 className="text-lg font-semibold mb-2">Axis Editor</h2>
      <p className="text-sm text-zinc-300">
        This is a placeholder for the Axis Editor component.
      </p>

      <div className="mt-3 flex gap-2">
        {SKILL_TABS.map(t => (
          <button
            key={t.key}
            type="button"
            className="px-3 py-1 text-xs rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-700
                 select-none touch-none cursor-grab active:cursor-grabbing"
            onPointerDown={e => onSkillTypePointerDown(e, t.key)}
            onPointerMove={onSkillTypePointerMove}
            onPointerUp={onSkillTypePointerUp}
            onPointerCancel={onSkillTypePointerCancel}
            title="Drag into the axis to add a skill box"
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* axis area */}
      <div
        className="relative mt-4 mb-4 flex border border-zinc-700 rounded bg-zinc-900"
        style={{
          height: LANE_AREA_TOP + RENDERED_LANE_COUNT * LANE_HEIGHT,
        }}
      >
        {/* left gutter with lane labels */}
        <div
          className="relative top-0 left-0"
          style={{ width: LEFT_GUTTER_WIDTH, height: "100%" }}
        >
          <div
            className="relative"
            style={{
              top: LANE_AREA_TOP,
              height: RENDERED_LANE_COUNT * LANE_HEIGHT,
            }}
          >
            {[0, 1, 2, 3, 4].map(laneIndex => {
              const opId = laneLabels[laneIndex];
              const name =
                laneIndex === ENEMY_LANE_INDEX
                  ? "Enemy"
                  : (operatorsData[opId]?.name ?? opId ?? "—");

              return (
                <div
                  key={laneIndex}
                  className="absolute left-0 flex items-center border-t border-zinc-700"
                  style={{
                    top: laneIndex * LANE_HEIGHT,
                    height: LANE_HEIGHT,
                    width: LEFT_GUTTER_WIDTH,
                  }}
                >
                  {laneIndex === ENEMY_LANE_INDEX ? (
                    <div className="h-full w-full text-xs bg-zinc-800 flex items-center justify-center text-zinc-300">
                      {name}
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="h-full w-full px-2 text-xs bg-zinc-800 hover:bg-zinc-700 select-none touch-none cursor-grab active:cursor-grabbing"
                      onPointerDown={e => onLanePointerDown(e, laneIndex)}
                      onPointerMove={onLanePointerMove}
                      onPointerUp={onLanePointerUp}
                      onPointerCancel={onLanePointerCancel}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-left">{name}</span>
                        {opId === controlledOperatorId && (
                          <span className="shrink-0 rounded border border-emerald-400/80 bg-emerald-700/30 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-100">
                            CTRL
                          </span>
                        )}
                      </div>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="relative flex-1 overflow-x-auto overflow-y-hidden"
          style={{
            height: LANE_AREA_TOP + RENDERED_LANE_COUNT * LANE_HEIGHT,
          }}
        >
          {/* axis grid */}
          {Array.from({
            length: Math.floor(AXIS_LENTH_IN_FRAMES / MINOR) + 1,
          }).map((_, i) => {
            const frame = i * MINOR;
            const s = Math.floor(frame / 60);
            const x = frame;
            const isMajor = frame % MAJOR === 0;
            return (
              <div key={frame}>
                <div
                  className={`absolute top-0 h-full ${isMajor ? "border-zinc-700" : "border-zinc-800"} border-r`}
                  style={{ left: x }}
                />
                {isMajor && (
                  <div
                    className="absolute z-10 top-1 text-[10px] text-zinc-400"
                    style={{ left: x + 4 }}
                  >
                    {s}s
                  </div>
                )}
              </div>
            );
          })}

          <div
            className="absolute border-y border-zinc-700/70 bg-zinc-800/40"
            style={{
              top: UPPER_GUTTER_HEIGHT,
              left: 0,
              width: AXIS_LENTH_IN_FRAMES,
              height: SP_TRACK_HEIGHT,
            }}
          >
            {/* SP rendering */}
            {simRenderCache.teamSpRealSeries.length > 1 &&
              simRenderCache.teamSpTotalSeries.length > 1 &&
              simRenderCache.teamSpCap > 0 &&
              (() => {
                const { linePath: realLinePath, areaPath: realAreaPath } =
                  buildLineAndAreaPath({
                    points: simRenderCache.teamSpRealSeries.map(point => ({
                      frame: point.frame,
                      value: point.value,
                    })),
                    maxFrame: AXIS_LENTH_IN_FRAMES,
                    maxValue: simRenderCache.teamSpCap,
                    width: AXIS_LENTH_IN_FRAMES,
                    height: SP_TRACK_HEIGHT,
                  });
                const { linePath: totalLinePath, areaPath: totalAreaPath } =
                  buildLineAndAreaPath({
                    points: simRenderCache.teamSpTotalSeries.map(point => ({
                      frame: point.frame,
                      value: point.value,
                    })),
                    maxFrame: AXIS_LENTH_IN_FRAMES,
                    maxValue: simRenderCache.teamSpCap,
                    width: AXIS_LENTH_IN_FRAMES,
                    height: SP_TRACK_HEIGHT,
                  });
                const spMarkerY = (spValue: number) =>
                  Math.max(
                    0,
                    Math.min(
                      SP_TRACK_HEIGHT,
                      SP_TRACK_HEIGHT -
                        (spValue / simRenderCache.teamSpCap) * SP_TRACK_HEIGHT,
                    ),
                  );
                const markerLevels = [100, 200].filter(
                  level => level <= simRenderCache.teamSpCap,
                );
                return (
                  <svg
                    className="absolute inset-0 pointer-events-none"
                    width={AXIS_LENTH_IN_FRAMES}
                    height={SP_TRACK_HEIGHT}
                    viewBox={`0 0 ${AXIS_LENTH_IN_FRAMES} ${SP_TRACK_HEIGHT}`}
                  >
                    {markerLevels.map(level => (
                      <line
                        key={`sp-marker-${level}`}
                        x1={0}
                        x2={AXIS_LENTH_IN_FRAMES}
                        y1={spMarkerY(level)}
                        y2={spMarkerY(level)}
                        stroke="rgba(255, 255, 255, 0.35)"
                        strokeWidth={1}
                      />
                    ))}
                    <path
                      d={`${totalAreaPath} ${realAreaPath}`}
                      fill="rgba(251, 113, 133, 0.20)"
                      fillRule="evenodd"
                    />
                    <path d={realAreaPath} fill="rgba(250, 204, 21, 0.14)" />
                    <path
                      d={realLinePath}
                      fill="none"
                      stroke="rgba(253, 224, 71, 0.85)"
                      strokeWidth={1.5}
                    />
                    <path
                      d={totalLinePath}
                      fill="none"
                      stroke="rgba(252, 165, 165, 0.85)"
                      strokeWidth={1.4}
                    />
                  </svg>
                );
              })()}
          </div>

          {/* skill boxes */}
          <div
            ref={axisAreaRef}
            className="absolute"
            style={{
              left: 0,
              top: LANE_AREA_TOP,
              width: AXIS_LENTH_IN_FRAMES,
              height: RENDERED_LANE_COUNT * LANE_HEIGHT,
            }}
          >
            <svg
              className="absolute inset-0 pointer-events-none"
              width={AXIS_LENTH_IN_FRAMES}
              height={RENDERED_LANE_COUNT * LANE_HEIGHT}
              viewBox={`0 0 ${AXIS_LENTH_IN_FRAMES} ${RENDERED_LANE_COUNT * LANE_HEIGHT}`}
            >
              {effectiveTeamOperatorIds.map((operatorId, laneIndex) => {
                const points =
                  simRenderCache.ultimateEnergySeriesByOperatorId[operatorId];
                const maxValue =
                  simRenderCache.ultimateEnergyMaxByOperatorId[operatorId] ?? 0;
                if (!points || points.length < 2 || maxValue <= 0) return null;

                const laneTop = laneIndex * LANE_HEIGHT;
                const chartTopPadding = 8;
                const chartBottomPadding = 8;
                const chartHeight =
                  LANE_HEIGHT - chartTopPadding - chartBottomPadding;
                const { linePath, areaPath } = buildLineAndAreaPath({
                  points: points.map(point => ({
                    frame: point.frame,
                    value: point.value,
                  })),
                  maxFrame: AXIS_LENTH_IN_FRAMES,
                  maxValue,
                  width: AXIS_LENTH_IN_FRAMES,
                  height: chartHeight,
                });

                return (
                  <g
                    key={`ue-series-${operatorId}`}
                    transform={`translate(0 ${laneTop + chartTopPadding})`}
                  >
                    <path d={areaPath} fill="rgba(228, 228, 231, 0.12)" />
                    <path
                      d={linePath}
                      fill="none"
                      stroke="rgba(228, 228, 231, 0.72)"
                      strokeWidth={1.25}
                    />
                  </g>
                );
              })}
              {/* Stagger chart */}
              {(() => {
                const points = simRenderCache.enemyStaggerSeries;
                const maxValue = simRenderCache.enemyStaggerCap;
                if (!points || points.length < 2 || maxValue <= 0) return null;

                const laneTop = ENEMY_LANE_INDEX * LANE_HEIGHT;
                const chartTopPadding = 8;
                const chartBottomPadding = 8;
                const chartHeight =
                  LANE_HEIGHT - chartTopPadding - chartBottomPadding;
                const { linePath, areaPath } = buildLineAndAreaPath({
                  points: points.map(point => ({
                    frame: point.frame,
                    value: point.value,
                  })),
                  maxFrame: AXIS_LENTH_IN_FRAMES,
                  maxValue,
                  width: AXIS_LENTH_IN_FRAMES,
                  height: chartHeight,
                });

                return (
                  <g
                    key="enemy-stagger-series"
                    transform={`translate(0 ${laneTop + chartTopPadding})`}
                  >
                    <path d={areaPath} fill="rgba(251, 146, 60, 0.12)" />
                    <path
                      d={linePath}
                      fill="none"
                      stroke="rgba(251, 146, 60, 0.88)"
                      strokeWidth={1.3}
                    />
                  </g>
                );
              })()}
            </svg>

            {/* buff bars */}
            {simRenderCache.bars.map(bar => {
              const laneIndex = toLaneIndex(bar.targetId);
              const width = Math.max(2, bar.endFrame - bar.startFrame);
              const rowIndex = barRowById.get(bar.id) ?? 0;
              const top =
                laneIndex * LANE_HEIGHT +
                BAR_BAND_OFFSET +
                rowIndex * BAR_ROW_PITCH;
              return (
                <div key={bar.id}>
                  <div
                    className={`absolute border ${bar.type === "buff" ? "bg-sky-500/35 border-sky-300/80" : "bg-rose-500/30 border-rose-300/80"}`}
                    style={{
                      left: bar.startFrame,
                      top,
                      width,
                      height: BUFF_BAR_HEIGHT,
                    }}
                  />
                  <img
                    src={placeholderImg}
                    alt={bar.effectId}
                    className="absolute size-4 rounded-sm border border-zinc-200/60"
                    style={{
                      left: bar.startFrame - 2,
                      top: top - 5,
                    }}
                  />
                  {bar.refreshFrames.map((refreshFrame, idx) => (
                    <div
                      key={`${bar.id}-refresh-${idx}`}
                      className="absolute w-[2px] bg-amber-300"
                      style={{
                        left: refreshFrame,
                        top: top - 4,
                        height: BUFF_BAR_HEIGHT + 8,
                      }}
                    />
                  ))}
                </div>
              );
            })}

            {simRenderCache.markers.map(marker => {
              const laneIndex = toLaneIndex(marker.targetId);
              const rowIndex = markerRowById.get(marker.id) ?? 0;
              const top =
                laneIndex * LANE_HEIGHT +
                MARKER_BAND_OFFSET +
                rowIndex * MARKER_ROW_PITCH;
              return (
                <div key={marker.id}>
                  <img
                    src={placeholderImg}
                    alt={marker.effectId}
                    className="absolute size-4 rounded-sm border border-zinc-200/60"
                    style={{
                      left: marker.frame - 2,
                      top,
                    }}
                  />
                  <div
                    className="absolute w-[2px] bg-emerald-300"
                    style={{ left: marker.frame + 6, top, height: 18 }}
                  />
                </div>
              );
            })}

            {/* adding skill box preview */}
            {addSkillDrag?.overAxis &&
              addSkillDrag.laneIndex != null &&
              addSkillDrag.startFrame != null && (
                <div
                  className="absolute border border-dashed border-zinc-300 bg-zinc-200/20 pointer-events-none"
                  style={{
                    left: addSkillDrag.startFrame,
                    width: ghostDurationFrames,
                    height: SKILL_BOX_HEIGHT,
                    top:
                      addSkillDrag.laneIndex * LANE_HEIGHT +
                      LANE_HEIGHT / 2 -
                      SKILL_BOX_HEIGHT / 2,
                  }}
                >
                  <div className="p-1 text-xs text-zinc-100/90 truncate">
                    {String(addSkillDrag.skillType)}
                  </div>
                </div>
              )}

            {skillBoxes.map(box => {
              const laneIndex = effectiveTeamOperatorIds.indexOf(
                box.operatorId,
              );
              const isActive = skillBoxDragState?.id === box.id;
              const startFrame = isActive
                ? skillBoxDragState!.previewStartFrame
                : box.startFrame;

              return (
                <div
                  key={box.id}
                  className="absolute bg-gray-500/75 border border-gray-300/80"
                  style={{
                    left: startFrame,
                    width: box.durationFrames,
                    height: SKILL_BOX_HEIGHT,
                    top:
                      laneIndex * LANE_HEIGHT +
                      LANE_HEIGHT / 2 -
                      SKILL_BOX_HEIGHT / 2,
                  }}
                  onPointerDown={e => onSkillBoxPointerDown(e, box)}
                  onPointerMove={onSkillBoxPointerMove}
                  onPointerUp={onSkillBoxPointerUp}
                  onPointerCancel={onSkillBoxPointerCancel}
                  onContextMenu={e => openSkillBoxMenu(e, box.id)}
                >
                  <div className="p-1 text-xs text-white truncate">
                    {String(box.skillType)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* skill box context menu */}
      {skillBoxMenu && (
        <div
          className="fixed inset-0 z-50"
          onPointerDown={() => setSkillBoxMenu(null)} // click outside closes
          onContextMenu={e => {
            e.preventDefault();
            setSkillBoxMenu(null);
          }}
        >
          <div
            className="absolute w-40 rounded border border-zinc-700 bg-zinc-900 shadow-lg overflow-hidden"
            style={{ left: skillBoxMenu.x, top: skillBoxMenu.y }}
            onPointerDown={e => e.stopPropagation()} // keep clicks inside menu
            onContextMenu={e => e.preventDefault()}
          >
            <button
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-800"
              onClick={() => {
                onDeleteSkillBox?.(skillBoxMenu.boxId);
                setSkillBoxMenu(null);
              }}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
