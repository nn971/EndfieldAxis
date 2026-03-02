import { CRYSTAL_ON_STATUS_APPLY_PLUGIN_ID } from "../../data/buffs/operators/endministrator/crystal";
import { SWORDMANCER_ON_STATUS_APPLY_PLUGIN_ID } from "../../data/gears/abstractSet/SwordmancerDef";
import { SUNDERING_STEEL_ON_STATUS_APPLY_PLUGIN_ID } from "../../data/weapons/sword/sunderingsteel";

export type OrderedPluginEntry = {
  id: string;
};

export type PluginOrderingConstraint = {
  before: string;
  after: string;
};

export type PluginOrderingBucket =
  | "globalDamageBonus"
  | "buffDamageBonus"
  | "afterHit"
  | "onCastStart"
  | "onCastEnd"
  | "onStatusApply"
  | "onBuffApply"
  | "onBuffConsumed"
  | "onInflictionApply"
  | "onInflictionConsumed";

export type PluginOrderingConfig = Partial<
  Record<PluginOrderingBucket, PluginOrderingConstraint[]>
>;

/** Configures which plugin should affect simulation first.
 *  "before" plugin triggers later so affects earlier.
 *  "after" plugin vice versa.
 */
const config: PluginOrderingConfig = {
  onStatusApply: [
    {
      before: SUNDERING_STEEL_ON_STATUS_APPLY_PLUGIN_ID,
      after: SWORDMANCER_ON_STATUS_APPLY_PLUGIN_ID,
    },
    {
      before: CRYSTAL_ON_STATUS_APPLY_PLUGIN_ID,
      after: SWORDMANCER_ON_STATUS_APPLY_PLUGIN_ID,
    },
  ],
};

export function sortPluginsByGameOrder<
  TEntry extends OrderedPluginEntry,
>(params: { entries: TEntry[]; bucket: PluginOrderingBucket }): void {
  const { entries, bucket } = params;
  entries.sort((a, b) => a.id.localeCompare(b.id));

  const constraints = assertKnownConstraintIds({
    bucket,
    constraints: config[bucket] ?? [],
    entries,
  });
  if (constraints.length === 0 || entries.length <= 1) return;

  const ids = new Set(entries.map(entry => entry.id));
  const adjacency = new Map<string, Set<string>>();
  const indegree = new Map<string, number>();

  for (const entry of entries) {
    adjacency.set(entry.id, new Set());
    indegree.set(entry.id, 0);
  }

  for (const constraint of constraints) {
    const neighbors = adjacency.get(constraint.before)!;
    if (neighbors.has(constraint.after)) continue;

    neighbors.add(constraint.after);
    indegree.set(constraint.after, (indegree.get(constraint.after) ?? 0) + 1);
  }

  const queue = [...entries]
    .filter(entry => (indegree.get(entry.id) ?? 0) === 0)
    .map(entry => entry.id)
    .sort((a, b) => a.localeCompare(b));

  const orderedIds: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    orderedIds.push(id);

    const neighbors = adjacency.get(id);
    if (!neighbors) continue;

    for (const nextId of neighbors) {
      const nextDegree = (indegree.get(nextId) ?? 0) - 1;
      indegree.set(nextId, nextDegree);
      if (nextDegree === 0) {
        queue.push(nextId);
        queue.sort((a, b) => a.localeCompare(b));
      }
    }
  }

  if (orderedIds.length !== entries.length) {
    throw new Error(
      `[plugin-order] Dependency cycle in ${bucket}: ${formatCyclePath(adjacency, ids)}`,
    );
  }

  const rank = new Map<string, number>();
  orderedIds.forEach((id, index) => rank.set(id, index));
  entries.sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
}

function assertKnownConstraintIds<TEntry extends OrderedPluginEntry>(params: {
  bucket: PluginOrderingBucket;
  constraints: PluginOrderingConstraint[];
  entries: TEntry[];
}): PluginOrderingConstraint[] {
  const { bucket, constraints, entries } = params;
  const ids = new Set(entries.map(entry => entry.id));
  const unknownIds = new Set<string>();
  const validConstraints: PluginOrderingConstraint[] = [];

  for (const constraint of constraints) {
    const hasBefore = ids.has(constraint.before);
    const hasAfter = ids.has(constraint.after);
    if (!hasBefore || !hasAfter) {
      if (!hasBefore) unknownIds.add(constraint.before);
      if (!hasAfter) unknownIds.add(constraint.after);
      console.warn(
        `[plugin-order] Unknown plugin id in ${bucket} constraint: ` +
          `${constraint.before} -> ${constraint.after}`,
      );
      continue;
    }
    validConstraints.push(constraint);
  }

  if (unknownIds.size > 0) {
    console.warn(
      `[plugin-order] Unknown plugin ids in ${bucket}: ${[...unknownIds]
        .sort((a, b) => a.localeCompare(b))
        .join(", ")}`,
    );
  }

  return validConstraints;
}

function formatCyclePath(
  adjacency: Map<string, Set<string>>,
  ids: Set<string>,
): string {
  const visited = new Set<string>();
  const inStack = new Set<string>();
  const stack: string[] = [];

  const nodes = [...ids].sort((a, b) => a.localeCompare(b));
  for (const id of nodes) {
    const cycle = visit(id);
    if (cycle) return cycle;
  }

  return "(cycle detected, but path could not be resolved)";

  function visit(node: string): string | null {
    if (inStack.has(node)) {
      const startIndex = stack.indexOf(node);
      const cyclePath = [...stack.slice(startIndex), node];
      return cyclePath.join(" -> ");
    }
    if (visited.has(node)) return null;

    visited.add(node);
    inStack.add(node);
    stack.push(node);

    const neighbors = [...(adjacency.get(node) ?? [])].sort((a, b) =>
      a.localeCompare(b),
    );
    for (const next of neighbors) {
      const cycle = visit(next);
      if (cycle) return cycle;
    }

    stack.pop();
    inStack.delete(node);
    return null;
  }
}
