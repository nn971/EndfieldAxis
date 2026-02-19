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
export type SimEvent = {
  id: string; // unique id within a simulation, for endding events to refer to
  type: SimEventType;
  frame: number;
  seq: number; // smaller seq earlier when frame equal

  sourceId?: SimEntityId;
  targetId?: SimEntityId;

  // field for endding events
  ref?: string; // id of the event being referred to

  // fields for castStart and castEnd
  skillType?: SkillType;

  // fields for hit
  hitType?: DmgType;
  dmgMultiplier?: number; // TODO

  //fields for statusApply
  statusType?: SimStatusType;

  //fields for inflictionApply, inflictionExpire
  inflictionType?: SimInflictionType;
  inflictionStacks?: number;

  // fields for buffApply, buffExpire
  buffType?: SimBuffType;

  // TEMP, TO BE REMOVED
  skillId?: string;
  skillName?: string;
  opName?: string;

  durationFrames?: number;
  op?: any;
  // [key: string]: any; // for extensibility
};
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

export type SimWorld = {
  env: SimEnv;
  nowInFrames: number;
  futureEvents: SimEventSequence;
};
