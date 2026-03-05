import type { SimLogCode, SimLogMessage } from "./log";

type LogMetaByCode = {
  sim_start: undefined;
  sim_end: undefined;
  sim_abort_max_steps: { maxSteps: number };
  dev_dismiss_event_when_mismatch: {
    eventType: string;
    eventId: string;
    reason: string;
  };
  dev_warn_unknown_event: { eventType: string };
  act_cast_illegal_combo: {
    sourceId: string;
    sourceName?: string;
    skillType: string;
    reason: string;
  };
  act_cast_start: {
    sourceId: string;
    sourceName?: string;
    targetId: string;
    targetName?: string;
    skillType: string;
  };
  act_cast_end: {
    sourceId: string;
    sourceName?: string;
    targetId: string;
    targetName?: string;
    skillType: string;
  };
  act_cast_insufficient_sp: {
    sourceId: string;
    sourceName?: string;
    spent: number;
    cost: number;
  };
  act_cast_insufficient_ultimate: {
    sourceId: string;
    sourceName?: string;
    spent: number;
    cost: number;
  };
  act_combo_triggered: { sourceId: string; sourceName?: string };
  act_combo_elapsed: { sourceId: string; sourceName?: string };
  act_team_sp_recover: {
    sourceId: string;
    gained: number;
    real: number;
    fake: number;
  };
  act_team_sp_return: {
    sourceId: string;
    gained: number;
    real: number;
    fake: number;
  };
  act_ultimate_gain_combo_hit: {
    sourceId: string;
    sourceName?: string;
    gained: number;
  };
  act_team_ultimate_gain_normal_skill_final_hit: {
    gained: number;
    realSpRatio: number;
  };
  dmg_hit: {
    sourceId: string;
    sourceName?: string;
    targetId: string;
    targetName?: string;
    amount: number;
    hpLeft: number;
  };
  buff_apply: {
    buffId: string;
    sourceId?: string;
    sourceName?: string;
    targetId: string;
    targetName?: string;
  };
  buff_refresh: {
    buffId: string;
    sourceId?: string;
    sourceName?: string;
    targetId: string;
    targetName?: string;
  };
  buff_stack_change: {
    buffId: string;
    before: number;
    after: number;
    sourceId?: string;
    sourceName?: string;
    targetId: string;
    targetName?: string;
  };
  buff_expire: { buffId: string; targetId: string; targetName?: string };
  buff_removed: { buffId: string; targetId: string; targetName?: string };
  buff_vulnerable_consumed: {
    statusType: string;
    consumed: number;
    targetId: string;
    targetName?: string;
  };
  infliction_stack_change: {
    inflictionType: string;
    before: number;
    after: number;
    targetId: string;
    targetName?: string;
  };
  infliction_expire: {
    inflictionType: string;
    targetId: string;
    targetName?: string;
  };
  reaction_triggered: {
    reactionBuffId: string;
    targetId: string;
    targetName?: string;
    consumedArtsStacks: number;
  };
  reaction_consumed_inflictions: {
    reactionBuffId: string;
    targetId: string;
    targetName?: string;
    consumedArtsStacks: number;
  };
  dmg_breakdown_attack: {
    baseAttack: number;
    weaponAttack: number;
    atkIncRatio: number;
    attributeBonusRatio: number;
    atkFinal: number;
  };
  dmg_breakdown_raw: { rawOutcoming: number; rawDamage: number };
  dmg_breakdown_multiplier_header: { dmgFinalMultiplier: number };
  dmg_breakdown_bonus_line: {
    bucket: string;
    addValue: number;
    note: string;
  };
};

type MessageForCode<C extends SimLogCode> = SimLogMessage &
  (LogMetaByCode[C] extends undefined
    ? { code: C; meta?: undefined }
    : { code: C; meta: NonNullable<LogMetaByCode[C]> });

function buildLogMessage<C extends SimLogCode>(code: C): MessageForCode<C>;
function buildLogMessage<C extends SimLogCode>(
  code: C,
  meta: NonNullable<LogMetaByCode[C]>,
): MessageForCode<C>;
function buildLogMessage<C extends SimLogCode>(
  code: C,
  meta?: NonNullable<LogMetaByCode[C]>,
): MessageForCode<C> {
  if (meta === undefined) {
    return { code } as MessageForCode<C>;
  }
  return { code, meta } as MessageForCode<C>;
}

export const logMsg = {
  simStart: () => buildLogMessage("sim_start"),
  simEnd: () => buildLogMessage("sim_end"),
  simAbortMaxSteps: (maxSteps: number) =>
    buildLogMessage("sim_abort_max_steps", { maxSteps }),

  devDismissEventWhenMismatch: (meta: {
    eventType: string;
    eventId: string;
    reason: string;
  }) => buildLogMessage("dev_dismiss_event_when_mismatch", meta),
  devWarnUnknownEvent: (eventType: string) =>
    buildLogMessage("dev_warn_unknown_event", { eventType }),

  actCastIllegalCombo: (meta: {
    sourceId: string;
    sourceName?: string;
    skillType: string;
    reason: string;
  }) => buildLogMessage("act_cast_illegal_combo", meta),
  actCastStart: (meta: {
    sourceId: string;
    sourceName?: string;
    targetId: string;
    targetName?: string;
    skillType: string;
  }) => buildLogMessage("act_cast_start", meta),
  actCastEnd: (meta: {
    sourceId: string;
    sourceName?: string;
    targetId: string;
    targetName?: string;
    skillType: string;
  }) => buildLogMessage("act_cast_end", meta),
  actCastInsufficientSp: (meta: {
    sourceId: string;
    sourceName?: string;
    spent: number;
    cost: number;
  }) => buildLogMessage("act_cast_insufficient_sp", meta),
  actCastInsufficientUltimate: (meta: {
    sourceId: string;
    sourceName?: string;
    spent: number;
    cost: number;
  }) => buildLogMessage("act_cast_insufficient_ultimate", meta),

  actComboTriggered: (meta: { sourceId: string; sourceName?: string }) =>
    buildLogMessage("act_combo_triggered", meta),
  actComboElapsed: (meta: { sourceId: string; sourceName?: string }) =>
    buildLogMessage("act_combo_elapsed", meta),

  actTeamSpRecover: (meta: {
    sourceId: string;
    gained: number;
    real: number;
    fake: number;
  }) => buildLogMessage("act_team_sp_recover", meta),
  actTeamSpReturn: (meta: {
    sourceId: string;
    gained: number;
    real: number;
    fake: number;
  }) => buildLogMessage("act_team_sp_return", meta),
  actUltimateGainComboHit: (meta: {
    sourceId: string;
    sourceName?: string;
    gained: number;
  }) => buildLogMessage("act_ultimate_gain_combo_hit", meta),
  actTeamUltimateGainNormalSkillFinalHit: (meta: {
    gained: number;
    realSpRatio: number;
  }) => buildLogMessage("act_team_ultimate_gain_normal_skill_final_hit", meta),

  dmgHit: (meta: {
    sourceId: string;
    sourceName?: string;
    targetId: string;
    targetName?: string;
    amount: number;
    hpLeft: number;
  }) => buildLogMessage("dmg_hit", meta),

  buffApply: (meta: {
    buffId: string;
    sourceId?: string;
    sourceName?: string;
    targetId: string;
    targetName?: string;
  }) => buildLogMessage("buff_apply", meta),
  buffRefresh: (meta: {
    buffId: string;
    sourceId?: string;
    sourceName?: string;
    targetId: string;
    targetName?: string;
  }) => buildLogMessage("buff_refresh", meta),
  buffStackChange: (meta: {
    buffId: string;
    before: number;
    after: number;
    sourceId?: string;
    sourceName?: string;
    targetId: string;
    targetName?: string;
  }) => buildLogMessage("buff_stack_change", meta),
  buffExpire: (meta: { buffId: string; targetId: string; targetName?: string }) =>
    buildLogMessage("buff_expire", meta),
  buffRemoved: (meta: { buffId: string; targetId: string; targetName?: string }) =>
    buildLogMessage("buff_removed", meta),
  buffVulnerableConsumed: (meta: {
    statusType: string;
    consumed: number;
    targetId: string;
    targetName?: string;
  }) => buildLogMessage("buff_vulnerable_consumed", meta),

  inflictionStackChange: (meta: {
    inflictionType: string;
    before: number;
    after: number;
    targetId: string;
    targetName?: string;
  }) => buildLogMessage("infliction_stack_change", meta),
  inflictionExpire: (meta: {
    inflictionType: string;
    targetId: string;
    targetName?: string;
  }) => buildLogMessage("infliction_expire", meta),

  reactionTriggered: (meta: {
    reactionBuffId: string;
    targetId: string;
    targetName?: string;
    consumedArtsStacks: number;
  }) => buildLogMessage("reaction_triggered", meta),
  reactionConsumedInflictions: (meta: {
    reactionBuffId: string;
    targetId: string;
    targetName?: string;
    consumedArtsStacks: number;
  }) => buildLogMessage("reaction_consumed_inflictions", meta),

  dmgBreakdownAttack: (meta: {
    baseAttack: number;
    weaponAttack: number;
    atkIncRatio: number;
    attributeBonusRatio: number;
    atkFinal: number;
  }) => buildLogMessage("dmg_breakdown_attack", meta),
  dmgBreakdownRaw: (meta: { rawOutcoming: number; rawDamage: number }) =>
    buildLogMessage("dmg_breakdown_raw", meta),
  dmgBreakdownMultiplierHeader: (meta: { dmgFinalMultiplier: number }) =>
    buildLogMessage("dmg_breakdown_multiplier_header", meta),
  dmgBreakdownBonusLine: (meta: {
    bucket: string;
    addValue: number;
    note: string;
  }) => buildLogMessage("dmg_breakdown_bonus_line", meta),
};
