import operatorsData from "../../data/operators";
import type { SkillType } from "../../data/operators/OperatorDef";
import type { SkillBox } from "../../types/editor";

export const DEFAULT_COMBO_FREEZE_FRAMES = 30;
export const DEFAULT_ULT_FREEZE_FRAMES = 120;

export function getCastStartFreezeFrames(
  operatorId: string,
  skillType: SkillType,
): number {
  const op = operatorsData[operatorId];
  const skillDef = op?.skills?.[skillType];

  const configured = skillDef?.freezeFramesOnCastStart;
  if (configured != null && Number.isFinite(configured) && configured >= 0) {
    return configured;
  }

  switch (skillType) {
    case "comboSkill":
      return DEFAULT_COMBO_FREEZE_FRAMES;
    case "ultimate":
      return DEFAULT_ULT_FREEZE_FRAMES;
    default:
      return 0;
  }
}

export function getSkillDurationGameFrames(
  box: SkillBox,
  operatorSkillDurationFrames: number,
): number {
  if (Number.isFinite(box.durationFrames) && box.durationFrames > 0) {
    return Math.max(1, Math.round(box.durationFrames));
  }

  if (
    Number.isFinite(operatorSkillDurationFrames) &&
    operatorSkillDurationFrames > 0
  ) {
    return Math.max(1, Math.round(operatorSkillDurationFrames));
  }

  return 1;
}
