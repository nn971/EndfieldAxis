import { AethertechSetDef } from "../abstractSet/AethertechSetDef";

class AethertechGlovesDef extends AethertechSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_poise01_hand_01",
      type: "gloves",
      name: "Æthertech Gloves",
      icon: "item_equip_t4_suit_poise01_hand_01.png",
      defend: 42,
      bonusBuckets: {
        s1: "agility",
        s2: "strength",
        s3: "artsIntensity",
      },
      bonusValuesByRank: {
        s1: [65, 71, 78, 84],
        s2: [43, 47, 51, 55],
        s3: [34, 37, 41, 44],
      },
    });
  }
}

export default new AethertechGlovesDef();
