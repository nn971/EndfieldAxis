import { LYNXSetDef } from "../abstractSet/LYNXSetDef";

class LYNXAegisInjectorDef extends LYNXSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_heal01_edc_04",
      type: "kit",
      name: "LYNX Aegis Injector",
      icon: "item_equip_t4_suit_heal01_edc_04.png",
      defend: 21,
      bonusBuckets: {
        s1: "will",
        s2: "intellect",
        s3: "will",
      },
      bonusValuesByRank: {
        s1: [32, 35, 38, 41],
        s2: [21, 23, 25, 27],
        s3: [14, 15, 17, 18],
      },
    });
  }
}

export default new LYNXAegisInjectorDef();
