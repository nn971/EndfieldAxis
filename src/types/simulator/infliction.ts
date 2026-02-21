import { BuffId } from "../../data/buffs/BuffDef";

export type SimInflictionType =
  | "vulnerable"
  | "heat"
  | "electric"
  | "cryo"
  | "nature";
export type SimStatusType = "lift" | "knockDown" | "crush" | "breach";

export type SimBuff = {
  id: BuffId;
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
