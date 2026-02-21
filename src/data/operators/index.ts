import type { OperatorDef, OperatorId } from "../../types/operator";
import type { OperatorDefClass } from "./OperatorDefClass";

/**
 * Operator data is stored as TypeScript modules (default-exporting OperatorDefClass).
 * This keeps the existing folder and API shape stable for the editor.
 */
const modules = import.meta.glob(
  ["./*.ts", "!./index.ts", "!./OperatorDefClass.ts"],
  {
    eager: true,
  },
) as Record<string, { default: OperatorDefClass }>;

const byId = Object.fromEntries(
  Object.values(modules).map(mod => {
    const op = mod.default as unknown as OperatorDef;
    return [op.id, op];
  }),
) as Record<OperatorId, OperatorDef>;

export const operatorsData = Object.keys(byId).map(id => byId[id]!);

export const operatorsById = byId;

export function getOperator(id: OperatorId) {
  return byId[id] ?? null;
}
