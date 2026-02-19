export type SimInflictionType =
  | "vulnerable"
  | "heat"
  | "electric"
  | "cryo"
  | "nature";
export type SimStatusType = "lift" | "knockDown" | "crush" | "breach";

// "Buff" here means a timed effect that is NOT one of the stackable inflictions above.
// For now we only need one: "crystal".
// NOTE: This is intentionally data-driven and extendible.
export type SimBuffType = "crystal";

export type SimBuff = {
  type: SimBuffType;
  lastApplyFrame: number;
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
