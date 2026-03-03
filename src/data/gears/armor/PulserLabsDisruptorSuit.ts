import { GearsDef } from "../GearsDef";

class PulserLabsDisruptorSuitDef extends GearsDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_pulse_cryst01_body_01",
      type: "armor",
      name: "Pulser Labs Disruptor Suit",
      icon: "item_equip_t4_suit_pulse_cryst01_body_01.png",
      defend: 56,
      bonusBuckets: {
        s1: "intellect",
        s2: "will",
        s3: "artsIntensity",
      },
      bonusValuesByRank: {
        s1: [87, 95, 104, 113],
        s2: [58, 63, 69, 75],
        s3: [20, 22, 24, 26],
      },
    });
  }
}

export default new PulserLabsDisruptorSuitDef();
