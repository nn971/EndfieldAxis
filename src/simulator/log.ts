import type { DamageContext } from "./damageModel";

function fmtFrame(frame: number): string {
  return String(frame).padStart(4, " ");
}

export function pushLog(log: string[], frame: number, message: string): void {
  log.push(`[${fmtFrame(frame)}] ${message}`);
}
export function logDamage(
  log: string[],
  frame: number,
  ctx: DamageContext,
  amount: number,
) {
  const b = ctx.meta as any;
  // Keep logs compact, but show the key multipliers that can change during combat.
  pushLog(
    log,
    frame,
    `DMG ${amount} kind=${ctx.kind} skillMul=${ctx.dmgSkillMultiplier}` +
      (b?.note ? ` (${b.note})` : ""),
  );
}
