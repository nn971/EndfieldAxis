import { LYNXSetDef } from "../abstractSet/LYNXSetDef";

class LYNXConnectorDef extends LYNXSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_heal01_edc_01",
      type: "kit",
      name: "LYNX Connector",
      icon: "item_equip_t4_suit_heal01_edc_01.png",
      defend: 21,
      bonusBuckets: {
        s1: "strength",
        s2: "will",
        s3: "intellect",
      },
      bonusValuesByRank: {
        s1: [32, 35, 38, 41],
        s2: [21, 23, 25, 27],
        s3: [14, 15, 17, 18],
      },
    });
  }
}

export default new LYNXConnectorDef();
