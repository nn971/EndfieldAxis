import { SimRegistry } from "../../../simulator/listeners/registry";
import { WeaponDef } from "../WeaponDef";

const LONG_WISH_BUFF = "weapon.grandvision.longWish";

class GrandVisionDef extends WeaponDef {
  constructor() {
    super({
      id: "grandvision",
      name: "Grand Vision",
      type: "sword",
      icon: "GRANDVISION.png",
      atkStat: {
        level1: 51,
        level90: 500,
      },
      s1: { id: "agilityboost", size: "L" },
      s2: { id: "attackboost", size: "L" },
      s3: {
        id: "longtimewish",
        cat: "infliction",
        name: "Long Time Wish",
        bonus: {
          bucket: "artsIntensity",
          byRank: r => 24 + 6 * r + (r > 8 ? 6 : 0),
        },
      },
    });
  }

  override registerSimPlugins(registry: SimRegistry): void {
    // When the wielder applies Crystal, prime Long Wish for 20s.
    registry.registerOnBuffApply({
      id: "weapon.grandvision.longWish.prime",
      when: { buffId: "buff.crystal" },
      fn: ({ read, ev, sourceId, nextSeq, makeEventId }) => {
        if (!sourceId) return [];

        const build = read.getBuild(sourceId);
        if (!build || build.weapon.id !== this.id) return [];

        const self = read.getEntity(sourceId);
        const existing = (self as any).buffs?.[LONG_WISH_BUFF];
        const stacks = Math.max(0, Number((existing as any)?.stacks ?? 0));

        // Prime as stacks=1. If already active (stacks=2), do nothing.
        if (stacks >= 2) return [];

        // If already primed (stacks=1), refresh by removing then applying.
        // NOTE: Same-frame events execute by descending seq (larger seq first).
        // We schedule buffApply first, then buffRemove, so removal executes first.
        if (stacks === 1) {
          return [
            {
              id: makeEventId(),
              type: "buffApply",
              frame: ev.frame,
              seq: nextSeq(),
              sourceId,
              targetId: sourceId,
              ownerId: sourceId,
              buffId: LONG_WISH_BUFF as any,
            },
            {
              id: makeEventId(),
              type: "buffRemove",
              frame: ev.frame,
              seq: nextSeq(),
              ownerId: sourceId,
              buffId: LONG_WISH_BUFF as any,
            },
          ];
        }

        return [
          {
            id: makeEventId(),
            type: "buffApply",
            frame: ev.frame,
            seq: nextSeq(),
            sourceId,
            targetId: sourceId,
            ownerId: sourceId,
            buffId: LONG_WISH_BUFF as any,
          },
        ];
      },
    });

    // Activate Long Wish during the next battle-skill or ultimate cast.
    registry.registerOnCastStart({
      id: "weapon.grandvision.longWish.activate",
      fn: ({ read, ev, sourceId, nextSeq, makeEventId }) => {
        if (!sourceId) return [];

        const build = read.getBuild(sourceId);
        if (!build || build.weapon.id !== this.id) return [];
        if (
          ev.skillType !== "normalSkill" &&
          ev.skillType !== "comboSkill" &&
          ev.skillType !== "ultimate"
        ) {
          return [];
        }

        const self = read.getEntity(sourceId);
        const existing = (self as any).buffs?.[LONG_WISH_BUFF];
        const stacks = Math.max(0, Number((existing as any)?.stacks ?? 0));
        if (stacks !== 1) return [];

        // Apply again to stack to 2 (active) for the duration of this cast.
        return [
          {
            id: makeEventId(),
            type: "buffApply",
            frame: ev.frame,
            seq: nextSeq(),
            sourceId,
            targetId: sourceId,
            ownerId: sourceId,
            buffId: LONG_WISH_BUFF as any,
          },
        ];
      },
    });

    // Consume Long Wish at cast end.
    registry.registerOnCastEnd({
      id: "weapon.grandvision.longWish.consume",
      fn: ({ read, ev, sourceId, nextSeq, makeEventId }) => {
        if (!sourceId) return [];

        const build = read.getBuild(sourceId);
        if (!build || build.weapon.id !== this.id) return [];
        if (
          ev.skillType !== "normalSkill" &&
          ev.skillType !== "comboSkill" &&
          ev.skillType !== "ultimate"
        ) {
          return [];
        }

        const self = read.getEntity(sourceId);
        const existing = (self as any).buffs?.[LONG_WISH_BUFF];
        const stacks = Math.max(0, Number((existing as any)?.stacks ?? 0));
        if (stacks < 2) return [];

        return [
          {
            id: makeEventId(),
            type: "buffRemove",
            frame: ev.frame,
            seq: nextSeq(),
            ownerId: sourceId,
            buffId: LONG_WISH_BUFF as any,
          },
        ];
      },
    });
  }
}

export default new GrandVisionDef();
