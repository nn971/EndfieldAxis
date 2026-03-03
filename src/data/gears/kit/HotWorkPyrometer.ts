import { HotWorkSetDef } from "../abstractSet/HotWorkSetDef";

class HotWorkPyrometerDef extends HotWorkSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_fire_natr01_edc_02",
      type: "kit",
      name: "Hot Work Pyrometer",
      icon: "item_equip_t4_suit_fire_natr01_edc_02.png",
      defend: 21,
      bonusBuckets: {
        s1: "intellect",
        s2: "physicalDmgIncRatio",
        s3: "will",
      },
      bonusValuesByRank: {
        s1: [32, 35, 38, 41],
        s2: [20.7, 22.8, 24.8, 26.9],
        s3: [14, 15, 17, 18],
      },
    });
  }
}

export default new HotWorkPyrometerDef();
