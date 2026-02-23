import { SimEnv } from "../types/simulator/simulator";
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
      breakdown: Record<string, unknown>;
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
  breakdown?: Record<string, unknown>,
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
        // serialized.push(
        //   `breakdown: ${JSON.stringify(entry.breakdown.bonusLog, null, 2)} | amount: ${entry.amount}`,
        // );
      } else {
        serialized.push(`${fmtFrame(entry.frame)} ${tag} ${entry.message}`);
      }
    }
  }

  return serialized.join("\n");
}
