import { OperatorBuild, SkillType } from "./operator";

export type SimRenderBarType = "buff" | "infliction";
export type SimRenderMarkerType = "status" | "buffRefresh";

export interface SimRenderBar {
  id: string;
  type: SimRenderBarType;
  ownerId: string;
  effectId: string;
  startFrame: number;
  endFrame: number;
  refreshFrames: number[];
}

export interface SimRenderMarker {
  id: string;
  type: SimRenderMarkerType;
  ownerId: string;
  effectId: string;
  frame: number;
}

export interface SimRenderSeriesPoint {
  frame: number;
  seq: number;
  value: number;
}

export interface SimRenderCache {
  bars: SimRenderBar[];
  markers: SimRenderMarker[];
  teamSpRealSeries: SimRenderSeriesPoint[];
  teamSpTotalSeries: SimRenderSeriesPoint[];
  teamSpCap: number;
  ultimateEnergySeriesByOperatorId: Record<string, SimRenderSeriesPoint[]>;
  ultimateEnergyMaxByOperatorId: Record<string, number>;
  simEndFrame: number;
}

export function makeEmptySimRenderCache(): SimRenderCache {
  return {
    bars: [],
    markers: [],
    teamSpRealSeries: [],
    teamSpTotalSeries: [],
    teamSpCap: 0,
    ultimateEnergySeriesByOperatorId: {},
    ultimateEnergyMaxByOperatorId: {},
    simEndFrame: 0,
  };
}

export interface SkillBox {
  id: string;
  operatorId: string;
  skillType: SkillType;
  startFrame: number;
  durationFrames: number;
}

export interface SolutionState {
  /**
   * Serialized solution schema version. Use this for migrations later.
   *
   * v1: teamOperatorIds, skillBoxes, buildByOperatorId
   */
  version: number;

  teamOperatorIds: string[]; // length 4
  skillBoxes: SkillBox[];
  buildByOperatorId: Record<string, OperatorBuild>;
  simRenderCache: SimRenderCache;
}
