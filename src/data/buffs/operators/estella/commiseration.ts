import { BuffDef } from "../../BuffDef";
import type { SimRegistry } from "../../../../simulator/listeners/registry";

class CommiserationDef extends BuffDef {
  constructor() {
    super({
      id: "operator.estella.talent1.commiseration",
      name: "Commiseration",
      icon: "Estella.png",
      durationFrames: -1,
      maxStacks: 2,
    });
  }

  override registerSimPlugins(registry: SimRegistry): void {
    // registry.registerOnCastStartForBuff({
    //   id: "operator.estella.talent1.commiseration.onCastStart",
    //   fn: ({ read, ev, sourceId, nextSeq, makeEventId }) => {
    //     if (ev.sourceId != "estella" || ev.skillType != "normalSkill")
    //       return [];
    //     return [
    //       {
    //         id: makeEventId(),
    //         type: "buffRemove",
    //         frame: read.nowInFrames,
    //         seq: nextSeq(),
    //         ownerId: "estella",
    //         buffId: this.id,
    //       },
    //       {
    //         id: makeEventId(),
    //         type: "spReturn",
    //         frame: read.nowInFrames,
    //         seq: nextSeq(),
    //         sourceId: "estella",
    //         amount: 15, // TODO
    //       },
    //     ];
    //   },
    // });
  }
}

export default new CommiserationDef();
