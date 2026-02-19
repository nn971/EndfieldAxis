import { OperatorBuild, SkillType } from "./operator";

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
}
