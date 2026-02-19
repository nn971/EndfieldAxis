/* lane reordering */
export function moveItem<T>(arr: T[], from: number, to: number): T[] {
  const next = arr.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

// Enforce "no duplicates": if newOpId is already used in another lane, swap.
export function assignNoDup(
  arr: string[],
  laneIndex: number,
  newOpId: string,
): string[] {
  const next = arr.slice();
  const oldId = next[laneIndex];
  const otherLane = next.findIndex(id => id === newOpId);

  if (otherLane !== -1 && otherLane !== laneIndex) {
    next[otherLane] = oldId; // swap
  }
  next[laneIndex] = newOpId;
  return next;
}

// generate a increasing enumerator
export function createSeqGenerator(start = 1): () => number {
  let n = start;
  return () => n++;
}
