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
      fn: ({ read, sourceId, ev }) => {
        if (!sourceId) return null;

        const build = read.getBuild(sourceId);
        if (!build || build.weapon.id !== this.id) return null;

        const self = read.getEntity(sourceId);
        const existing = (self as any).buffs?.[LONG_WISH_BUFF];
        const stacks = Math.max(0, Number((existing as any)?.stacks ?? 0));

        // Prime as stacks=1. If already active (stacks=2), do nothing.
        if (stacks >= 2) return null;

        // If already primed (stacks=1), refresh by removing then applying.
        if (stacks === 1) {
          return function* (ctx) {
            yield ctx.emit.buffRemove({
              ownerId: sourceId,
              buffId: LONG_WISH_BUFF as any,
            });
            yield ctx.emit.buffApply({
              sourceId,
              targetId: sourceId,
              ownerId: sourceId,
              buffId: LONG_WISH_BUFF as any,
            });
          };
        }

        return function* (ctx) {
          yield ctx.emit.buffApply({
            sourceId,
            targetId: sourceId,
            ownerId: sourceId,
            buffId: LONG_WISH_BUFF as any,
          });
        };
      },
    });

    // Activate Long Wish during the next battle-skill or ultimate cast.
    registry.registerOnCastStart({
      id: "weapon.grandvision.longWish.activate",
      fn: ({ read, ev, sourceId }) => {
        if (!sourceId) return null;

        const build = read.getBuild(sourceId);
        if (!build || build.weapon.id !== this.id) return null;
        if (
          ev.skillType !== "normalSkill" &&
          ev.skillType !== "comboSkill" &&
          ev.skillType !== "ultimate"
        ) {
          return null;
        }

        const self = read.getEntity(sourceId);
        const existing = (self as any).buffs?.[LONG_WISH_BUFF];
        const stacks = Math.max(0, Number((existing as any)?.stacks ?? 0));
        if (stacks !== 1) return null;

        // Apply again to stack to 2 (active) for the duration of this cast.
        return function* (ctx) {
          yield ctx.emit.buffApply({
            sourceId,
            targetId: sourceId,
            ownerId: sourceId,
            buffId: LONG_WISH_BUFF as any,
          });
        };
      },
    });

    // Consume Long Wish at cast end.
    registry.registerOnCastEnd({
      id: "weapon.grandvision.longWish.consume",
      fn: ({ read, ev, sourceId }) => {
        if (!sourceId) return null;

        const build = read.getBuild(sourceId);
        if (!build || build.weapon.id !== this.id) return null;
        if (
          ev.skillType !== "normalSkill" &&
          ev.skillType !== "comboSkill" &&
          ev.skillType !== "ultimate"
        ) {
          return null;
        }

        const self = read.getEntity(sourceId);
        const existing = (self as any).buffs?.[LONG_WISH_BUFF];
        const stacks = Math.max(0, Number((existing as any)?.stacks ?? 0));
        if (stacks < 2) return null;

        return function* (ctx) {
          yield ctx.emit.buffRemove({
            ownerId: sourceId,
            buffId: LONG_WISH_BUFF as any,
          });
        };
      },
    });
  }
}

export default new GrandVisionDef();
