import { GearsDef } from "../GearsDef";

class RedeemerTagT1Def extends GearsDef {
  constructor() {
    super({
      id: "item_equip_t4_parts_wuling01_edc_02",
      type: "kit",
      name: "Redeemer Tag T1",
      icon: "item_equip_t4_parts_wuling01_edc_02.png",
      defend: 21,
      bonusBuckets: {
        s1: "agility",
        s2: "comboSkillDmgIncRatio",
      },
      bonusValuesByRank: {
        s1: [43, 47, 51, 55],
        s2: [43.2, 47.5, 51.8, 56.2],
      },
    });
  }
}

export default new RedeemerTagT1Def();
