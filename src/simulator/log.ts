import type { SimEnv } from "../types/simulator/simulator";
import type { DamageBreakdown } from "./damage/damageModel";
import type { DamageContext } from "./damage/damageModel";

export type SimLogEntryCat =
  | "sim"
  | "act"
  | "buff"
  | "stat"
  | "dmg"
  | "SP"
  | "dev";

export type SimLogCode =
  | "sim_start"
  | "sim_end"
  | "sim_abort_max_steps"
  | "dev_dismiss_event_when_mismatch"
  | "dev_warn_unknown_event"
  | "act_cast_illegal_combo"
  | "act_cast_start"
  | "act_cast_end"
  | "act_cast_insufficient_sp"
  | "act_cast_insufficient_ultimate"
  | "act_combo_triggered"
  | "act_combo_elapsed"
  | "act_team_sp_recover"
  | "act_team_sp_return"
  | "act_ultimate_gain_combo_hit"
  | "act_team_ultimate_gain_normal_skill_final_hit"
  | "dmg_hit"
  | "buff_apply"
  | "buff_refresh"
  | "buff_stack_change"
  | "buff_expire"
  | "buff_removed"
  | "buff_vulnerable_consumed"
  | "infliction_stack_change"
  | "infliction_expire"
  | "reaction_triggered"
  | "reaction_consumed_inflictions"
  | "dmg_breakdown_attack"
  | "dmg_breakdown_raw"
  | "dmg_breakdown_multiplier_header"
  | "dmg_breakdown_bonus_line";

export type SimLogMessage = {
  code: SimLogCode;
  meta?: Record<string, unknown>;
};

const simLogCodes: SimLogCode[] = [
  "sim_start",
  "sim_end",
  "sim_abort_max_steps",
  "dev_dismiss_event_when_mismatch",
  "dev_warn_unknown_event",
  "act_cast_illegal_combo",
  "act_cast_start",
  "act_cast_end",
  "act_cast_insufficient_sp",
  "act_cast_insufficient_ultimate",
  "act_combo_triggered",
  "act_combo_elapsed",
  "act_team_sp_recover",
  "act_team_sp_return",
  "act_ultimate_gain_combo_hit",
  "act_team_ultimate_gain_normal_skill_final_hit",
  "dmg_hit",
  "buff_apply",
  "buff_refresh",
  "buff_stack_change",
  "buff_expire",
  "buff_removed",
  "buff_vulnerable_consumed",
  "infliction_stack_change",
  "infliction_expire",
  "reaction_triggered",
  "reaction_consumed_inflictions",
  "dmg_breakdown_attack",
  "dmg_breakdown_raw",
  "dmg_breakdown_multiplier_header",
  "dmg_breakdown_bonus_line",
];

export function isSimLogMessage(v: unknown): v is SimLogMessage {
  if (!v || typeof v !== "object") return false;

  const maybeLogMessage = v as { code?: unknown; meta?: unknown };
  if (
    typeof maybeLogMessage.code !== "string" ||
    !simLogCodes.includes(maybeLogMessage.code as SimLogCode)
  ) {
    return false;
  }

  return (
    maybeLogMessage.meta === undefined ||
    (typeof maybeLogMessage.meta === "object" && maybeLogMessage.meta !== null)
  );
}

type SimLogEntryBase = {
  frame: number;
  env: SimEnv;
  message: string | SimLogMessage;
};
export type SimLogEntry =
  | (SimLogEntryBase & {
      cat: "dmg";
      ctx: DamageContext;
      breakdown: DamageBreakdown;
      amount: number;
    })
  | (SimLogEntryBase & {
      cat: "sim" | "act" | "buff" | "stat" | "SP" | "dev";
    });
export type SimLog = SimLogEntry[];

function fmtFrame(frame: number): string {
  return String(frame).padStart(4, " ");
}

export function pushLog(
  log: SimLog, // mutable

  logEntryType: SimLogEntryCat,
  frame: number,
  env: SimEnv,
  message: string | SimLogMessage,

  // these are required for damage log entries
  ctx?: DamageContext,
  breakdown?: DamageBreakdown,
  amount?: number,
): void {
  if (logEntryType === "dmg") {
    if (!ctx || !breakdown || amount === undefined)
      throw new Error("Damage log entries require ctx, breakdown, and amount");
    const entry: SimLogEntry = {
      cat: "dmg",
      frame,
      env,
      message,
      ctx,
      breakdown,
      amount,
    };
    log.push(entry);
    return;
  } else {
    const entry: SimLogEntry = {
      cat: logEntryType,
      frame,
      env,
      message,
    };
    log.push(entry);
  }
}

export function summarizeLog(
  log: SimLog,
  categories: SimLogEntryCat[],
  detailedDmg: boolean = true,
  formatMessage?: (message: SimLogMessage, entry: SimLogEntry) => string,
): string {
  const serialized: string[] = [];

  const formatLogMessageText = (
    message: string | SimLogMessage,
    entry: SimLogEntry,
  ): string => {
    if (typeof message === "string") {
      return message;
    }

    const fallback = `[${message.code}]`;
    if (!formatMessage) {
      return fallback;
    }

    try {
      const formatted = formatMessage(message, entry);
      return formatted || fallback;
    } catch {
      return fallback;
    }
  };

  for (const entry of log) {
    if (categories.includes(entry.cat)) {
      const tag = `[${entry.cat.toUpperCase()}]`;
      const messageText = formatLogMessageText(entry.message, entry);
      serialized.push(`${fmtFrame(entry.frame)} ${tag} ${messageText}`);

      if (detailedDmg && entry.cat === "dmg") {
        const breakdown = entry.breakdown;
        serialized.push(
          `     ${formatLogMessageText(
            {
              code: "dmg_breakdown_attack",
              meta: {
                baseAttack: breakdown.operatorAttack,
                weaponAttack: breakdown.weaponAttack,
                atkIncRatio: breakdown.atkIncRatio,
                attributeBonusRatio: breakdown.attributeBonusRatio,
                atkFinal: breakdown.atkFinal,
              },
            },
            entry,
          )}`,
        );
        serialized.push(
          `     ${formatLogMessageText(
            {
              code: "dmg_breakdown_raw",
              meta: {
                rawOutcoming: breakdown.rawOutcoming,
                rawDamage: breakdown.rawDamage,
              },
            },
            entry,
          )}`,
        );
        serialized.push(
          `     ${formatLogMessageText(
            {
              code: "dmg_breakdown_multiplier_header",
              meta: {
                dmgFinalMultiplier: breakdown.dmgFinalMultiplier,
              },
            },
            entry,
          )}`,
        );
        for (const { bucket, addValue, note } of breakdown.bonusLog) {
          serialized.push(
            `     ${formatLogMessageText(
              {
                code: "dmg_breakdown_bonus_line",
                meta: { bucket, addValue, note },
              },
              entry,
            )}`,
          );
        }
      }
    }
  }

  return serialized.join("\n");
}
