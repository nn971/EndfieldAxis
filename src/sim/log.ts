function fmtFrame(frame: number): string {
  return String(frame).padStart(4, " ");
}

export function pushLog(log: string[], frame: number, message: string): void {
  log.push(`[${fmtFrame(frame)}] ${message}`);
}
