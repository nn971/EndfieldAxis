import { BuffId } from "../../data/buffs/BuffDef";
import type { DamageBucket } from "../../simulator/damage/damageBonuses";
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
  id: BuffTypeId;
  key: BuffKey;
  expiresAtFrame: number | null;
  durationFrames: number | null;
  mods?: readonly BuffMod[];
  lastApplyFrame: number;

  /** Optional stacks for stackable buffs */
  stacks?: number;
  meta?: Record<string, unknown>;
  runtime?: Record<string, unknown>;
};

export type BuffTypeId = BuffId;
export type BuffKey = string;

export type BuffMod =
  | {
      kind: "flat";
      role: "source" | "target";
      bucket: DamageBucket;
      value: number;
      damageType?: DamageType;
    }
  | {
      kind: "perStack";
      role: "source" | "target";
      bucket: DamageBucket;
      valuePerStack: number;
      damageType?: DamageType;
    };

export type SimInfliction = {
  type: InflictionType;
  stacks: number;
  lastApplyFrame: number;
};
