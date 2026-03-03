import { EternalXiraniteSetDef } from "../abstractSet/EternalXiraniteSetDef";

class EternalXiranitePowerCoreT1Def extends EternalXiraniteSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_usp02_edc_02",
      type: "kit",
      name: "Eternal Xiranite Power Core T1",
      icon: "item_equip_t4_suit_usp02_edc_02.png",
      defend: 21,
      bonusBuckets: {
        s1: "intellect",
        s2: "will",
        s3: "intellect",
      },
      bonusValuesByRank: {
        s1: [32, 35, 38, 41],
        s2: [21, 23, 25, 27],
        s3: [20.7, 22.8, 24.8, 26.9],
      },
    });
  }
}

export default new EternalXiranitePowerCoreT1Def();
