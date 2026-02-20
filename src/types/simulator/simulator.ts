import { DmgType, SkillType } from "../operator";
import type {
  SimInfliction,
  SimBuff,
  SimStatusType,
  SimInflictionDef,
  SimInflictionType,
  SimBuffType,
} from "./infliction";

export type SimEventType =
  | "castStart" // start frame of casting a skill
  | "castEnd" // end frame of casting a skill
  | "hit" // attack or skill hit, physical or arts
  | "statusApply" // apply a status
  | "inflictionApply" // apply an infliction
  | "inflictionExpire" // expire an infliction, either by duration or by dispel
  | "buffApply" // apply a timed buff/debuff (e.g. enemy crystal)
  | "buffExpire"; // expire a timed buff/debuff
// | string;

export type SimEventBase = {
  id: string; // unique id within a simulation, for endding events to refer to
  type: SimEventType;
  frame: number;
  seq: number; // smaller seq earlier when frame equal

  sourceId?: SimEntityId;
  targetId?: SimEntityId;
};

export type SimEvent =
  | (SimEventBase & {
      type: "castStart";
      sourceId: SimEntityId;
      targetId?: SimEntityId;
      skillType: SkillType;
    })
  | (SimEventBase & {
      type: "castEnd";
      sourceId: SimEntityId;
      targetId?: SimEntityId;
      skillType: SkillType;
      ref: string; // id of the castStart event
    })
  | (SimEventBase & {
      type: "hit";
      sourceId: SimEntityId;
      targetId: SimEntityId;
      hitType: DmgType;
      /** If this hit was produced by compiling a skill cast, the originating skillType. */
      skillType?: SkillType;
      dmgMultiplier?: number; // TODO
    })
  | (SimEventBase & {
      type: "statusApply";
      sourceId: SimEntityId;
      targetId: SimEntityId;
      statusType: SimStatusType;
    })
  | (SimEventBase & {
      type: "inflictionApply";
      sourceId: SimEntityId;
      targetId: SimEntityId;
      inflictionType: SimInflictionType;
      inflictionStacks: number;
    })
  | (SimEventBase & {
      type: "inflictionExpire";
      sourceId: SimEntityId;
      targetId: SimEntityId;
      inflictionType: SimInflictionType;
      ref: string;
    })
  | (SimEventBase & {
      type: "buffApply";
      sourceId?: SimEntityId;
      targetId: SimEntityId;
      buffType: SimBuffType;
    })
  | (SimEventBase & {
      type: "buffExpire";
      sourceId: SimEntityId; // entity who owns the buff
      buffType: SimBuffType;
      ref: string;
    });

export type SimEventSequence = SimEvent[];

export type SimEntityId = string;
export type SimEntity = {
  id: SimEntityId;
  name: string;
  hp: number;
  inflictions: Record<string, SimInfliction>;

  buffs: Record<string, SimBuff>;

  type: string; //TODO implement this
};

export type SimEnv = { entitiesById: Record<SimEntityId, SimEntity> };

// Runtime simulation world is implemented as a class in simulator layer.
// Re-export as a type so other layers can refer to it without importing runtime values.
export type SimWorld = import("../../simulator/simulator").SimWorld;
