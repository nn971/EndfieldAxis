import { HotWorkSetDef } from "../abstractSet/HotWorkSetDef";

class HotWorkPowerBankDef extends HotWorkSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_fire_natr01_edc_01",
      type: "kit",
      name: "Hot Work Power Bank",
      icon: "item_equip_t4_suit_fire_natr01_edc_01.png",
      defend: 21,
      bonusBuckets: {
        s1: "strength",
        s2: "agility",
        s3: "artsIntensity",
      },
      bonusValuesByRank: {
        s1: [32, 35, 38, 41],
        s2: [21, 23, 25, 27],
        s3: [34, 37, 41, 44],
      },
    });
  }
}

export default new HotWorkPowerBankDef();
