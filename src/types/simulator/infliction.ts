import { BuffId } from "../../data/buffs/BuffDef";
import { DamageType } from "../operator";

export type SimStatusType = "lift" | "knockDown" | "crush" | "breach";

export type ArtsInflictionType = Exclude<DamageType, "physical">;
export type InflictionType = "vulnerable" | ArtsInflictionType;

export const ARTS_INFLICTION_TYPE_LIST = [
  "heat",
  "electric",
  "cryo",
  "nature",
] as const satisfies readonly ArtsInflictionType[];

export const INFLICTION_TYPE_LIST = [
  "vulnerable",
  ...ARTS_INFLICTION_TYPE_LIST,
] as const satisfies readonly InflictionType[];

export function isArtsInflictionType(
  type: InflictionType,
): type is ArtsInflictionType {
  return (
    type === "heat" ||
    type === "electric" ||
    type === "cryo" ||
    type === "nature"
  );
}

export type SimBuff = {
  id: BuffId;
  lastApplyFrame: number;

  /** Optional stacks for stackable buffs */
  stacks?: number;
  /** Optional per-buff runtime payload (e.g. reaction snapshots). */
  meta?: Record<string, unknown>;
};

export type SimInfliction = {
  type: InflictionType;
  stacks: number;
  lastApplyFrame: number;
};
