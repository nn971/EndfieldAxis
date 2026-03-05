import type { SimEnv } from "../../types/simulator/simulator";
import type { SimLogEntry, SimLogMessage } from "../../simulator/log";

type Translate = (key: string, options?: Record<string, unknown>) => string;

export type FormatSimLogArgs = {
  t: Translate;
  language: string;
  env: SimEnv;
  entry: SimLogEntry;
  message: SimLogMessage;
};

function readString(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function readNumber(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function resolveEntityDisplayName(
  env: SimEnv,
  meta: Record<string, unknown>,
  idKey: string,
  nameKey: string,
): string | undefined {
  const id = readString(meta[idKey]);
  if (!id) return undefined;
  const nameFromMeta = readString(meta[nameKey]);
  if (nameFromMeta) return nameFromMeta;
  return env.entitiesById[id]?.name ?? id;
}

export function formatSimLog({
  t,
  language,
  env,
  entry,
  message,
}: FormatSimLogArgs): string {
  const fallback = `[${message.code}]`;

  try {
    const numberFormatter = new Intl.NumberFormat(language, {
      maximumFractionDigits: 2,
    });
    const interpolation: Record<string, unknown> = {
      frame: entry.frame,
      category: entry.cat,
    };

    const meta = message.meta;
    if (meta) {
      for (const [key, value] of Object.entries(meta)) {
        const numericValue = readNumber(value);
        if (numericValue === undefined) {
          interpolation[key] = value;
        } else {
          interpolation[key] = numberFormatter.format(numericValue);
          interpolation[`${key}Raw`] = numericValue;
        }
      }

      const sourceName = resolveEntityDisplayName(
        env,
        meta,
        "sourceId",
        "sourceName",
      );
      if (sourceName) {
        interpolation.sourceName = sourceName;
        interpolation.sourceDisplayName = sourceName;
      }

      const targetName = resolveEntityDisplayName(
        env,
        meta,
        "targetId",
        "targetName",
      );
      if (targetName) {
        interpolation.targetName = targetName;
        interpolation.targetDisplayName = targetName;
      }
    }

    const key = `simLog.${message.code}`;
    const formatted = t(key, interpolation);
    if (!formatted || formatted === key) {
      return fallback;
    }
    return formatted;
  } catch {
    return fallback;
  }
}
