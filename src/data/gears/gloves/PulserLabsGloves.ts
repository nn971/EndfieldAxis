import { PulserLabsSetDef } from "../abstractSet/PulserLabsSetDef";

class PulserLabsGlovesDef extends PulserLabsSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_pulse_cryst01_hand_01",
      type: "gloves",
      name: "Pulser Labs Gloves",
      icon: "item_equip_t4_suit_pulse_cryst01_hand_01.png",
      defend: 42,
      bonusBuckets: {
        s1: "will",
        s2: "intellect",
        s3: "physicalDmgIncRatio",
      },
      bonusValuesByRank: {
        s1: [65, 71, 78, 84],
        s2: [43, 47, 51, 55],
        s3: [0.192, 0.211, 0.23, 0.249],
      },
    });
  }
}

export default new PulserLabsGlovesDef();
