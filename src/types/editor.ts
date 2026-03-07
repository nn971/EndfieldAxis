import type { SkillType } from "../data/operators/OperatorDef";
import type { OperatorBuild, DamageType } from "./operator";
import type { SimDamageCache } from "./simDamage";

export type SimRenderBarType = "buff" | "infliction";
export type SimRenderMarkerType = "status" | "buffRefresh";

export interface SimRenderBar {
  id: string;
  type: SimRenderBarType;
  targetId: string;
  effectId: string;
  startFrame: number;
  endFrame: number;
  refreshFrames: number[];
}

export interface SimRenderMarker {
  id: string;
  type: SimRenderMarkerType;
  targetId: string;
  effectId: string;
  frame: number;
}

export interface SimRenderSeriesPoint {
  frame: number;
  seq: number;
  value: number;
}

export interface SimRenderWindow {
  startFrame: number;
  endFrame: number;
}

export interface SimRenderCache {
  bars: SimRenderBar[];
  markers: SimRenderMarker[];
  teamSpRealSeries: SimRenderSeriesPoint[];
  teamSpTotalSeries: SimRenderSeriesPoint[];
  enemyStaggerSeries: SimRenderSeriesPoint[];
  enemyStaggerWindows: SimRenderWindow[];
  teamSpCap: number;
  enemyStaggerCap: number;
  ultimateEnergySeriesByOperatorId: Record<string, SimRenderSeriesPoint[]>;
  ultimateEnergyMaxByOperatorId: Record<string, number>;
  simEndFrame: number;
  invalidSkillBoxById: Record<
    string,
    {
      kind: "strict" | "soft";
      reasons: string[];
    }
  >;
}

export function makeEmptySimRenderCache(): SimRenderCache {
  return {
    bars: [],
    markers: [],
    teamSpRealSeries: [],
    teamSpTotalSeries: [],
    enemyStaggerSeries: [],
    enemyStaggerWindows: [],
    teamSpCap: 0,
    enemyStaggerCap: 0,
    ultimateEnergySeriesByOperatorId: {},
    ultimateEnergyMaxByOperatorId: {},
    simEndFrame: 0,
    invalidSkillBoxById: {},
  };
}

export interface SkillBox {
  id: string;
  operatorId: string;
  skillType: SkillType;
  startFrame: number;
  durationFrames: number;
}

export type DamageWatchFilter = {
  sourceId: string | null;
  skillType: SkillType | null;
  damageType: DamageType | null;
};

export type I18nTextRef = {
  key: string;
  params?: Record<string, string | number>;
};

export type DamageWatchEntry = {
  id: string;
  name: string;
  nameI18n?: I18nTextRef;
  filter: DamageWatchFilter;
};

export interface SolutionState {
  /**
   * Serialized solution schema version. Use this for migrations later.
   *
   * v1: teamOperatorIds, skillBoxes, buildByOperatorId
   */
  version: number;

  teamOperatorIds: string[]; // length 4
  controlledOperatorId: string;
  skillBoxes: SkillBox[];
  buildByOperatorId: Record<string, OperatorBuild>;
  simRenderCache: SimRenderCache;
  simDamageCache: SimDamageCache;
  damageWatches: DamageWatchEntry[];
}
