import { HotWorkSetDef } from "../abstractSet/HotWorkSetDef";

class HotWorkPowerCartridgeDef extends HotWorkSetDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_fire_natr01_edc_03",
      type: "kit",
      name: "Hot Work Power Cartridge",
      icon: "item_equip_t4_suit_fire_natr01_edc_03.png",
      defend: 21,
      bonusBuckets: {
        s1: "will",
        s2: "intellect",
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

export default new HotWorkPowerCartridgeDef();
