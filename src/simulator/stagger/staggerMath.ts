const MILLI_SCALE = 1_000;

export function toMilli(x: number): number {
  const value = Number.isFinite(x) ? x : 0;
  return Math.round(value * MILLI_SCALE);
}

export function mulRatioMilli(valueMilli: number, ratioMilli: number): number {
  const value = Math.trunc(Number(valueMilli) || 0);
  const ratio = Math.trunc(Number(ratioMilli) || 0);
  return Math.floor((value * ratio + MILLI_SCALE / 2) / MILLI_SCALE);
}
