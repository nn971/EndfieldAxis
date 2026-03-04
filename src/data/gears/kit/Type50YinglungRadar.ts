import { Type50YinglungSetDef } from "../abstractSet/Type50YinglungSetDef";

class Type50YinglungRadarDef extends Type50YinglungSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_atk02_edc_01",
      type: "kit",
      name: "Type 50 Yinglung Radar",
      icon: "item_equip_t4_suit_atk02_edc_01.png",
      defend: 28,
      bonusBuckets: {
        s1: "strength",
        s2: "will",
        s3: "physicalDmgIncRatio",
      },
      bonusValuesByRank: {
        s1: [32, 35, 38, 41],
        s2: [21, 23, 25, 27],
        s3: [0.115, 0.127, 0.138, 0.149],
      },
    });
  }
}

export default new Type50YinglungRadarDef();
