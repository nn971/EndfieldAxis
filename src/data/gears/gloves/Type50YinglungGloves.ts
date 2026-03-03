import { Type50YinglungSetDef } from "../abstractSet/Type50YinglungSetDef";

class Type50YinglungGlovesDef extends Type50YinglungSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_atk02_hand_01",
      type: "gloves",
      name: "Type 50 Yinglung Gloves",
      icon: "item_equip_t4_suit_atk02_hand_01.png",
      defend: 28,
      bonusBuckets: {
        s1: "agility",
        s2: "intellect",
        s3: "physicalDmgIncRatio",
      },
      bonusValuesByRank: {
        s1: [65, 71, 78, 84],
        s2: [43, 47, 51, 55],
        s3: [20.7, 22.8, 24.8, 26.9],
      },
    });
  }
}

export default new Type50YinglungGlovesDef();
