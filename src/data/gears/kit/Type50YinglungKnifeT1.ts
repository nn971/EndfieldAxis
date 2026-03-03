import { Type50YinglungSetDef } from "../abstractSet/Type50YinglungSetDef";

class Type50YinglungKnifeT1Def extends Type50YinglungSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_atk02_edc_05",
      type: "kit",
      name: "Type 50 Yinglung Knife T1",
      icon: "item_equip_t4_suit_atk02_edc_05.png",
      defend: 28,
      bonusBuckets: {
        s1: "intellect",
        s2: "strength",
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

export default new Type50YinglungKnifeT1Def();
