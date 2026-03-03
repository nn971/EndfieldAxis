import { EternalXiraniteSetDef } from "../abstractSet/EternalXiraniteSetDef";

class EternalXiranitePowerCoreDef extends EternalXiraniteSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_usp02_edc_01",
      type: "kit",
      name: "Eternal Xiranite Power Core",
      icon: "item_equip_t4_suit_usp02_edc_01.png",
      defend: 21,
      bonusBuckets: {
        s1: "intellect",
        s2: "strength",
        s3: "ultimateGainEfficiency",
      },
      bonusValuesByRank: {
        s1: [32, 35, 38, 41],
        s2: [21, 23, 25, 27],
        s3: [24.6, 27.1, 29.6, 32.0],
      },
    });
  }
}

export default new EternalXiranitePowerCoreDef();
