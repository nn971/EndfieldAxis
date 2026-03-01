import { makeSimEventId } from "../../shared/lib/utils";
import type { SimEvent, SimEventType } from "../../types/simulator/simulator";

export type StripEventRuntimeFields<T> = T extends SimEvent
  ? Omit<T, "id" | "seq">
  : never;
export type SimEventDraft = StripEventRuntimeFields<SimEvent>;

export type DraftAllocator = {
  nextSeq: () => number;
  makeId?: () => string;
};

export type OmitFrame<T> = T extends SimEventDraft ? Omit<T, "frame"> : never;

export type DraftEmitter = {
  now: <T extends SimEventDraft>(draft: OmitFrame<T>) => T;
  after: <T extends SimEventDraft>(
    deltaFrames: number,
    draft: OmitFrame<T>,
  ) => T;
};

export function createDraftEmitter(baseFrame: number): DraftEmitter {
  return {
    now: draft => ({ ...draft, frame: baseFrame }) as any,
    after: (deltaFrames, draft) =>
      ({ ...draft, frame: baseFrame + deltaFrames }) as any,
  };
}

export function materializeDrafts(
  drafts: readonly SimEventDraft[],
  alloc: DraftAllocator,
  opts?: { defaultRef?: string },
): SimEvent[] {
  const makeId = alloc.makeId ?? makeSimEventId;
  const grouped = new Map<number, SimEventDraft[]>();

  for (const draft of drafts) {
    const list = grouped.get(draft.frame);
    if (list) {
      list.push(draft);
      continue;
    }
    grouped.set(draft.frame, [draft]);
  }

  const frames = [...grouped.keys()].sort((a, b) => a - b);
  const frameSeqEntries = new Map<SimEventDraft, number>();

  for (const frame of frames) {
    const frameDrafts = grouped.get(frame) ?? [];
    for (let i = frameDrafts.length - 1; i >= 0; i -= 1) {
      frameSeqEntries.set(frameDrafts[i], alloc.nextSeq());
    }
  }

  return drafts.map(draft => {
    const ref = draft.ref ?? opts?.defaultRef;
    return {
      ...draft,
      id: makeId(),
      seq: frameSeqEntries.get(draft) ?? alloc.nextSeq(),
      ...(ref !== undefined ? { ref } : {}),
    } as SimEvent;
  });
}
