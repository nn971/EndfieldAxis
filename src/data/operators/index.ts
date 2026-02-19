// import order from "./order.json";'
import type { OperatorDef } from "../../types/operator";
import type { OperatorId } from "../../types/operator";

// Load all operator json files in this folder, excluding order.json
const modules = import.meta.glob(["./*.json", "!./_*.json"], {
  eager: true,
  import: "default",
}) as Record<string, OperatorDef>;

const byId = Object.fromEntries(
  Object.values(modules).map((op: OperatorDef) => [op.id, op]),
);

// Keep stable order (order.json), append any extras not listed
export const operatorsData = Object.keys(byId).map(id => byId[id]);

export const operatorsById = byId;

export function getOperator(id: OperatorId) {
  return byId[id] ?? null;
}
