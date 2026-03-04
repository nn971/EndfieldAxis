import { BuffDef } from "../../BuffDef";
import type { SimRegistry } from "../../../../simulator/listeners/registry";
import { SOLIDIFICATION_BUFF_ID } from "../../reactions/solidification";

const ESTELLA_ID = "estella" as const;

export const ESTELLA_TALENT1_COMMISERATION_BUFF_ID =
  "buff.estella.talent1.commiseration" as const;

const COMMISERATION_SP_RETURN_BY_TALENT_RANK = {
  1: 7.5,
  2: 15,
} as const;

function getCommiserationSpReturnByTalentRank(talentRank: number): number {
  if (talentRank >= 2) return COMMISERATION_SP_RETURN_BY_TALENT_RANK[2];
  if (talentRank >= 1) return COMMISERATION_SP_RETURN_BY_TALENT_RANK[1];
  return 0;
}

class CommiserationDef extends BuffDef {
  constructor() {
    super({
      id: ESTELLA_TALENT1_COMMISERATION_BUFF_ID,
      name: "Commiseration",
      icon: "ESTELLA.png",
      durationFrames: -1,
      maxStacks: 1,
    });
  }

  override registerSimPlugins(registry: SimRegistry): void {
    registry.registerOnBuffConsumed({
      id: "operator.estella.talent1.commiseration.applyOnShatter",
      when: { buffId: SOLIDIFICATION_BUFF_ID },
      fn: function* (ctx) {
        const { read, ev, emit } = ctx;
        if (ev?.type !== "buffRemove" || !ev.ref) return;

        const shatterTrigger = read.getEvent(ev.ref);
        if (!shatterTrigger) return;
        if (
          shatterTrigger.type !== "statusApply" &&
          shatterTrigger.type !== "inflictionApply"
        ) {
          return;
        }
        if (shatterTrigger.sourceId !== ESTELLA_ID) return;

        const talentRank = Number(
          read.getBuild(ESTELLA_ID)?.talentRanks?.talent1 ?? 0,
        );
        if (talentRank <= 0) return;

        yield emit.buffApply({
          sourceId: ESTELLA_ID,
          targetId: ESTELLA_ID,
          buffId: ESTELLA_TALENT1_COMMISERATION_BUFF_ID,
        });
      },
    });

    registry.registerOnCastStart({
      id: "operator.estella.talent1.commiseration.consumeOnOnomatopoeia",
      fn: function* (ctx) {
        const { read, ev, emit } = ctx;
        if (ev?.type !== "castStart") return;
        if (ev.sourceId !== ESTELLA_ID || ev.skillType !== "normalSkill")
          return;

        const estella = read.getEntity(ESTELLA_ID);
        if (!estella?.buffs?.[ESTELLA_TALENT1_COMMISERATION_BUFF_ID]) return;

        const talentRank = Number(
          read.getBuild(ESTELLA_ID)?.talentRanks?.talent1 ?? 0,
        );
        const amount = getCommiserationSpReturnByTalentRank(talentRank);

        if (amount > 0) {
          yield emit.spReturn({
            sourceId: ESTELLA_ID,
            amount,
          });
        }

        yield emit.buffRemove({
          targetId: ESTELLA_ID,
          buffId: ESTELLA_TALENT1_COMMISERATION_BUFF_ID,
        });
      },
    });
  }
}

export default new CommiserationDef();
