import type { OperatorId, OperatorDef } from "./OperatorDef";

/**
 * Operator data is stored as TypeScript modules (default-exporting OperatorDefClass).
 * This keeps the existing folder and API shape stable for the editor.
 */
const modules = import.meta.glob(
  ["./*.ts", "!./index.ts", "!./OperatorDef.ts"],
  {
    eager: true,
  },
) as Record<string, { default: OperatorDef }>;

const operatorsData = Object.fromEntries(
  Object.values(modules).map(mod => {
    const op = mod.default as unknown as OperatorDef;
    return [op.id, op];
  }),
) as Record<OperatorId, OperatorDef>;

export default operatorsData;

// export const operatorsData = Object.keys(operatorsData).map(id => operatorsData[id]!);

// export const operatorsById = byId;

// export function getOperator(id: OperatorId) {
//   return byId[id] ?? null;
// }
