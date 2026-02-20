export type SimInflictionType =
  | "vulnerable"
  | "heat"
  | "electric"
  | "cryo"
  | "nature";
export type SimStatusType = "lift" | "knockDown" | "crush" | "breach";

// Buffs are non-stacking time-based modifiers (e.g. crystal).
// NOTE: We keep buffs in this file for now to minimize file count.
export type SimBuffType = "crystal" | "chenqianyuAtk";

export type SimBuff = {
  type: SimBuffType;
  lastApplyFrame: number;

  /** Optional stacks for stackable buffs (e.g. Chen Qianyu self buff). */
  stacks?: number;
};

export type SimInflictionDef = {
  id: SimInflictionType;
  name: string;
  durationFrames: 1800;
  maxStacks: 4;
};
export type SimInfliction = {
  type: SimInflictionType;
  stacks: number;
  lastApplyFrame: number;
};
