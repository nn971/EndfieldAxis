import { BuffId } from "../../data/buffs/BuffDef";
import { DamageType } from "../operator";

export type SimStatusType = "lift" | "knockDown" | "crush" | "breach";

export type SimBuff = {
  id: BuffId;
  lastApplyFrame: number;

  /** Optional stacks for stackable buffs (e.g. Chen Qianyu self buff). */
  stacks?: number;
};

export type SimInflictionDef = {
  id: DamageType;
  name: string;
  durationFrames: 1800;
  maxStacks: 4;
};
export type SimInfliction = {
  type: DamageType;
  stacks: number;
  lastApplyFrame: number;
};
