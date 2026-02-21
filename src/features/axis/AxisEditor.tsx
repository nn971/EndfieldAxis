import { useEffect, useMemo, useRef, useState } from "react";
import type { SkillBox } from "../../types/editor";
import type { SkillType } from "../../data/operators/OperatorDef";
import operatorsData from "../../data/operators";
import { moveItem } from "../../shared/lib/utils";

const SKILL_TABS: { key: SkillType; label: string }[] = [
  { key: "normalAttack", label: "Normal Attack" },
  { key: "normalSkill", label: "Normal Skill" },
  { key: "comboSkill", label: "Combo Skill" },
  { key: "ultimate", label: "Ultimate" },
];

type Props = {
  teamOperatorIds: string[];
  skillBoxes: SkillBox[];
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
  skillBoxes,
  onLaneLabelClick,
  onCommitLaneReorder,
  onCommitSkillBoxPatch,
  onAddSkillBox,
  onDeleteSkillBox,
}: Props) {
  const LEFT_GUTTER_WIDTH = 150;
  const AXIS_LENTH_IN_FRAMES = 3600;
  const UPPER_GUTTER_HEIGHT = 20;
  const LANE_HEIGHT = 100;
  const SKILL_BOX_HEIGHT = 30;

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
      localY >= 0 &&
      localY <= 4 * LANE_HEIGHT;

    if (!overAxis)
      return { overAxis: false, laneIndex: null, startFrame: null };

    const laneIndex = Math.max(
      0,
      Math.min(3, Math.floor(localY / LANE_HEIGHT)),
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
        className="relative mt-4 mb-4 overflow-hidden border border-zinc-700 rounded bg-zinc-900"
        style={{ height: UPPER_GUTTER_HEIGHT + 4 * LANE_HEIGHT }}
      >
        {/* left gutter with lane labels */}
        <div
          className="absolute top-0 left-0"
          style={{ width: LEFT_GUTTER_WIDTH, height: "100%" }}
        >
          <div
            className="relative"
            style={{ top: UPPER_GUTTER_HEIGHT, height: 4 * LANE_HEIGHT }}
          >
            {[0, 1, 2, 3].map(laneIndex => {
              const opId = effectiveTeamOperatorIds[laneIndex];
              const name = operatorsData[opId]?.name ?? opId ?? "—";

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
                  <button
                    type="button"
                    className="h-full w-full text-xs bg-zinc-800 hover:bg-zinc-700 select-none touch-none cursor-grab active:cursor-grabbing"
                    onPointerDown={e => onLanePointerDown(e, laneIndex)}
                    onPointerMove={onLanePointerMove}
                    onPointerUp={onLanePointerUp}
                    onPointerCancel={onLanePointerCancel}
                  >
                    {name}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="absolute relative overflow-x-auto overflow-y-hidden"
          style={{
            height: UPPER_GUTTER_HEIGHT + 4 * LANE_HEIGHT,
            left: LEFT_GUTTER_WIDTH,
            right: 0,
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

          {/* skill boxes */}
          <div
            ref={axisAreaRef}
            className="absolute"
            style={{
              left: 0,
              top: UPPER_GUTTER_HEIGHT,
              width: AXIS_LENTH_IN_FRAMES,
              height: 4 * LANE_HEIGHT,
            }}
          >
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
                  className="absolute bg-gray-500 border border-gray-400"
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
