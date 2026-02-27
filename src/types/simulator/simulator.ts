import { BuffId } from "../../data/buffs/BuffDef";
import { DmgType, SkillType } from "../../data/operators/OperatorDef";

import type {
  SimInfliction,
  SimBuff,
  SimStatusType,
  InflictionType,
} from "./infliction";

export type SimEventType =
  | "castStart" // start frame of casting a skill
  | "castEnd" // end frame of casting a skill
  | "hit" // attack or skill or status hit, physical or arts
  | "statusApply" // apply a status
  | "inflictionApply" // apply an infliction
  | "inflictionExpire" // expire an infliction, either by duration or by dispel
  | "buffApply" // apply a timed buff/debuff (e.g. enemy crystal)
  | "buffRemove" // remove a buff immediately (e.g. crystal consumed)
  | "buffExpire" // expire a timed buff/debuff
  | "comboTriggered" // combo trigger activated for an operator
  | "comboTriggerElapse" // combo trigger availability window elapsed
  | "comboCooldownEnd" // combo cooldown has ended
  | "reactionTick" // periodic tick for reaction buffs
  | "spReturn"; // return team SP from skill effects
// | string;

export type SimEventBase = {
  id: string; // unique id within a simulation, for endding events to refer to
  type: SimEventType;
  frame: number;
  seq: number; // larger seq earlier when frame equal

  /** Optional reference to a related event (parent / originating action). */
  ref?: string | null;
  // org?: string | null;

  sourceId?: SimEntityId;
  targetId?: SimEntityId;
};

export type SimEvent =
  | (SimEventBase & {
      type: "castStart";
      sourceId: SimEntityId;
      targetId?: SimEntityId;
      skillType: SkillType;
      comboValidation?: {
        isLegal: boolean;
        reason?: string;
      };
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
      damageType: DmgType;
      // hitTypes: HitTypes;
      dmgMultiplier?: number; // skillMultiplier or statusMultiplier
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
      inflictionType: InflictionType;
      inflictionStacks: number;
    })
  | (SimEventBase & {
      type: "inflictionExpire";
      sourceId: SimEntityId;
      inflictionType: InflictionType;
      ref: string;
    })
  | (SimEventBase & {
      type: "buffApply";
      sourceId?: SimEntityId;
      targetId: SimEntityId;
      buffId: BuffId;
      isForced?: boolean;
    })
  | (SimEventBase & {
      type: "buffRemove";
      /** entity who owns the buff */
      sourceId: SimEntityId;
      buffId: BuffId;
    })
  | (SimEventBase & {
      type: "buffExpire";
      sourceId: SimEntityId; // entity who owns the buff
      buffId: BuffId;
      ref: string;
    })
  | (SimEventBase & {
      type: "comboTriggered";
      sourceId: SimEntityId;
      targetId?: SimEntityId;
    })
  | (SimEventBase & {
      type: "comboTriggerElapse";
      sourceId: SimEntityId;
      ref: string;
    })
  | (SimEventBase & {
      type: "comboCooldownEnd";
      sourceId: SimEntityId;
      ref: string;
    })
  | (SimEventBase & {
      type: "reactionTick";
      sourceId: SimEntityId;
      targetId: SimEntityId;
      reactionBuffId: BuffId;
    })
  | (SimEventBase & {
      type: "spReturn";
      sourceId: SimEntityId;
      targetId?: SimEntityId;
      amount: number;
    });

export type SimTeamSpState = {
  current: number;
  cap: number;
  regenPerSecond: number;
  lastRegenFrame: number;
};

export type SimUltimateState = {
  current: number;
  max: number;
};

export type SimResourceState = {
  teamSp: SimTeamSpState;
  ultimateByOperatorId: Record<SimEntityId, SimUltimateState>;
};

export type SimEventSequence = SimEvent[];

export type SimEntityId = string;

export type SimComboState = {
  /** Remaining combo cooldown in frames. */
  cooldown: number;
  /** Whether combo is currently triggered and waiting for cast. */
  pending: boolean;
  /** Latest frame (inclusive) where the pending combo can still be cast. */
  availableUntilFrame: number;
  /** Last frame this combo was triggered. */
  lastTriggerFrame: number;
};

export type SimEntity = {
  id: SimEntityId;
  name: string;
  hp: number;
  inflictions: Record<InflictionType, SimInfliction>;

  buffs: Record<string, SimBuff>;

  /** Operator-only combo runtime state. */
  combo?: SimComboState;

  type: string; //TODO implement this
};

export type SimEnv = { entitiesById: Record<SimEntityId, SimEntity> };

export type SimGlobalBuffs = {
  link?: {
    /** Current link stacks available for the team. */
    stacks: number;
    /** Cast-start event id -> special multiplier for all hits from that cast. */
    castBonusByCastStartId: Record<string, number>;
  };
};

export type SimEnvWithGlobalBuffs = SimEnv & {
  globalBuffs: SimGlobalBuffs;
  resources: SimResourceState;
};

// Runtime simulation world is implemented as a class in simulator layer.
// Re-export as a type so other layers can refer to it without importing runtime values.
export type SimWorld = import("../../simulator/simulator").SimWorld;
