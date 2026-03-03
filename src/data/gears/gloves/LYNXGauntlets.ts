import { LYNXSetDef } from "../abstractSet/LYNXSetDef";

class LYNXGauntletsDef extends LYNXSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_heal01_hand_02",
      type: "gloves",
      name: "LYNX Gauntlets",
      icon: "item_equip_t4_suit_heal01_hand_02.png",
      defend: 42,
      bonusBuckets: {
        s1: "will",
        s2: "strength",
        s3: "intellect",
      },
      bonusValuesByRank: {
        s1: [65, 71, 78, 84],
        s2: [43, 47, 51, 55],
        s3: [29, 32, 35, 38],
      },
    });
  }
}

export default new LYNXGauntletsDef();
