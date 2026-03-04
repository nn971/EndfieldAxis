import { Type50YinglungSetDef } from "../abstractSet/Type50YinglungSetDef";

class Type50YinglungKnifeDef extends Type50YinglungSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_atk02_edc_04",
      type: "kit",
      name: "Type 50 Yinglung Knife",
      icon: "item_equip_t4_suit_atk02_edc_04.png",
      defend: 28,
      bonusBuckets: {
        s1: "will",
        s2: "agility",
        s3: "physicalDmgIncRatio",
      },
      bonusValuesByRank: {
        s1: [32, 35, 38, 41],
        s2: [21, 23, 25, 27],
        s3: [0.138, 0.152, 0.166, 0.179],
      },
    });
  }
}

export default new Type50YinglungKnifeDef();
