import { GearsDef } from "../GearsDef";

class RedeemerSealDef extends GearsDef {
  constructor() {
    super({
      id: "item_equip_t4_parts_wuling01_edc_03",
      type: "kit",
      name: "Redeemer Seal",
      icon: "item_equip_t4_parts_wuling01_edc_03.png",
      defend: 21,
      bonusBuckets: {
        s1: "intellect",
        s2: "ultimateGainEfficiency",
      },
      bonusValuesByRank: {
        s1: [43, 47, 51, 55],
        s2: [25.7, 28.3, 30.9, 33.4],
      },
    });
  }
}

export default new RedeemerSealDef();
