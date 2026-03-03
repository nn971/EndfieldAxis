import { PulserLabsSetDef } from "../abstractSet/PulserLabsSetDef";

class PulserLabsCalibratorDef extends PulserLabsSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_pulse_cryst01_edc_02",
      type: "kit",
      name: "Pulser Labs Calibrator",
      icon: "item_equip_t4_suit_pulse_cryst01_edc_02.png",
      defend: 21,
      bonusBuckets: {
        s1: "intellect",
        s2: "artsIntensity",
        s3: "will",
      },
      bonusValuesByRank: {
        s1: [32, 35, 38, 41],
        s2: [34, 37, 41, 44],
        s3: [14, 15, 17, 18],
      },
    });
  }
}

export default new PulserLabsCalibratorDef();
