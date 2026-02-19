import { OperatorBuild, SkillType } from "./operator";

export interface SkillBox {
  id: string;
  operatorId: string;
  skillType: SkillType;
  startFrame: number;
  durationFrames: number;
}

export interface SolutionState {
  teamOperatorIds: string[]; // length 4
  skillBoxes: SkillBox[];
  buildByOperatorId: Record<string, OperatorBuild>;
}
