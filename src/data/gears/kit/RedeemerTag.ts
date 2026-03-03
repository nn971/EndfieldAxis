import { GearsDef } from "../GearsDef";

class RedeemerTagDef extends GearsDef {
  constructor() {
    super({
      id: "item_equip_t4_parts_wuling01_edc_01",
      type: "kit",
      name: "Redeemer Tag",
      icon: "item_equip_t4_parts_wuling01_edc_01.png",
      defend: 21,
      bonusBuckets: {
        s1: "strength",
        s2: "will",
        s3: "strength",
      },
      bonusValuesByRank: {
        s1: [43, 47, 51, 55],
        s2: [17.8, 19.2, 20.6, 21.9],
        s3: [21, 23, 25, 27],
      },
    });
  }
}

export default new RedeemerTagDef();
