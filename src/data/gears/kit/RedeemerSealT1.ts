import { GearsDef } from "../GearsDef";

class RedeemerSealT1Def extends GearsDef {
  constructor() {
    super({
      id: "item_equip_t4_parts_wuling01_edc_04",
      type: "kit",
      name: "Redeemer Seal T1",
      icon: "item_equip_t4_parts_wuling01_edc_04.png",
      defend: 21,
      bonusBuckets: {
        s1: "will",
        s2: "criticalChance",
      },
      bonusValuesByRank: {
        s1: [43, 47, 51, 55],
        s2: [10.8, 11.9, 13.0, 14.0],
      },
    });
  }
}

export default new RedeemerSealT1Def();
