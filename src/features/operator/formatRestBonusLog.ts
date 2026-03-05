import gearsData, { gearsSetData } from "../../data/gears";
import operatorsData from "../../data/operators";
import weaponsData from "../../data/weapons";
import {
  tGearName,
  tGearSetName,
  tOperatorName,
  tWeaponName,
} from "../../i18n/content";
import type { RestBonusEntry, RestLogMessage } from "../../types/operator";

type Translate = (key: string, options?: Record<string, unknown>) => string;

export type FormatRestBonusLogArgs = {
  t: Translate;
  language: string;
  entry: RestBonusEntry;
};

function readNumber(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function resolveFallbackLabel(message: RestLogMessage): string {
  return `[${message.code}]`;
}

export function formatRestBonusLog({
  t,
  language,
  entry,
}: FormatRestBonusLogArgs): string {
  if (typeof entry.log === "string") {
    return entry.log;
  }

  const message = entry.log;
  const fallback = resolveFallbackLabel(message);

  try {
    const numberFormatter = new Intl.NumberFormat(language, {
      maximumFractionDigits: 2,
    });
    const interpolation: Record<string, unknown> = {
      source: entry.source,
      bucket: entry.bucket,
    };
    const meta = message.meta;

    if (meta) {
      for (const [key, value] of Object.entries(meta)) {
        const numericValue = readNumber(value);
        interpolation[key] =
          numericValue === undefined
            ? value
            : numberFormatter.format(numericValue);
      }

      if (meta.operatorId) {
        const operatorName = tOperatorName(
          t,
          meta.operatorId,
          operatorsData[meta.operatorId]?.name ?? meta.operatorId,
        );
        interpolation.operatorName = operatorName;
      }

      if (meta.weaponId) {
        const weaponName = tWeaponName(
          t,
          meta.weaponId,
          weaponsData[meta.weaponId]?.name ?? meta.weaponId,
        );
        interpolation.weaponName = weaponName;
      }

      if (meta.gearId) {
        const gearName = tGearName(
          t,
          meta.gearId,
          gearsData[meta.gearId]?.name ?? meta.gearId,
        );
        interpolation.gearName = gearName;
      }

      if (meta.gearSetId) {
        const gearSetName = tGearSetName(
          t,
          meta.gearSetId,
          gearsSetData[meta.gearSetId]?.name ?? meta.gearSetId,
        );
        interpolation.gearSetName = gearSetName;
      }
    }

    const key = `restLog.${message.code}`;
    const formatted = t(key, {
      ...interpolation,
      defaultValue: fallback,
    });
    if (!formatted || formatted === key) {
      return fallback;
    }
    return formatted;
  } catch {
    return fallback;
  }
}
