import type { SimEnv } from "../types/simulator/simulator";
import { DAMAGE_BUCKETS } from "./damage/damageBonuses";
import type { DamageBreakdown } from "./damage/damageModel";
import type { DamageContext } from "./damage/damageModel";

export type SimLogEntryCat = "sim" | "act" | "buff" | "stat" | "dmg" | "dev";
type SimLogEntryBase = {
  frame: number;
  env: SimEnv;
  message: string;
};
export type SimLogEntry =
  | (SimLogEntryBase & {
      cat: "dmg";
      ctx: DamageContext;
      breakdown: DamageBreakdown;
      amount: number;
    })
  | (SimLogEntryBase & {
      cat: "sim" | "act" | "buff" | "stat" | "dev";
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
  message: string,

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
): string {
  const serialized: string[] = [];

  for (const entry of log) {
    if (categories.includes(entry.cat)) {
      const tag = `[${entry.cat.toUpperCase()}]`;
      if (entry.cat === "dmg") {
        serialized.push(`${fmtFrame(entry.frame)} ${tag} ${entry.message}`);
        const breakdown = entry.breakdown;
        const breakdownBonusLog = breakdown.bonusLog
          .map(
            ({ bucket, addValue, isRatio, note }) =>
              `bucket=${bucket}, +${addValue}, ${note}`,
          )
          .join("\n     ");
        serialized.push(
          `     Base attack: ${breakdown.operatorAttack + breakdown.weaponAttack}, Attack increase ratio: ${breakdown.atkIncRatio}, Attributes bonus: ${breakdown.attributeBonusRatio}, Final attack: ${breakdown.atkFinal}`,
        );
        serialized.push(
          `     Raw outcoming: ${breakdown.rawOutcoming}, Raw damage: ${breakdown.rawDamage}`,
        );
        serialized.push(
          `     Final multiplier: ${breakdown.dmgFinalMultiplier}, also gained from: \n     ` +
            breakdownBonusLog,
        );
      } else {
        serialized.push(`${fmtFrame(entry.frame)} ${tag} ${entry.message}`);
      }
    }
  }

  return serialized.join("\n");
}
