import { EternalXiraniteSetDef } from "../abstractSet/EternalXiraniteSetDef";

class EternalXiraniteAuxiliaryArmDef extends EternalXiraniteSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_usp02_edc_03",
      type: "kit",
      name: "Eternal Xiranite Auxiliary Arm",
      icon: "item_equip_t4_suit_usp02_edc_03.png",
      defend: 21,
      bonusBuckets: {
        s1: "will",
        s2: "intellect",
        s3: "ultimateGainEfficiency",
      },
      bonusValuesByRank: {
        s1: [32, 35, 38, 41],
        s2: [21, 23, 25, 27],
        s3: [0.246, 0.271, 0.296, 0.32],
      },
    });
  }
}

export default new EternalXiraniteAuxiliaryArmDef();
