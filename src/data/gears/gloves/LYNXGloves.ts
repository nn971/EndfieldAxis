import { LYNXSetDef } from "../abstractSet/LYNXSetDef";

class LYNXGlovesDef extends LYNXSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_heal01_hand_01",
      type: "gloves",
      name: "LYNX Gloves",
      icon: "item_equip_t4_suit_heal01_hand_01.png",
      defend: 42,
      bonusBuckets: {
        s1: "strength",
        s2: "will",
        s3: "ultimateGainEfficiency",
      },
      bonusValuesByRank: {
        s1: [65, 71, 78, 84],
        s2: [43, 47, 51, 55],
        s3: [20.5, 22.6, 24.6, 26.7],
      },
    });
  }
}

export default new LYNXGlovesDef();
