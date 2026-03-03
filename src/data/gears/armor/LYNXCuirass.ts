import { GearsDef } from "../GearsDef";

class LYNXCuirassDef extends GearsDef {
  constructor() {
    super({
      id: "item_equip_t4_suit_heal01_body_02",
      type: "armor",
      name: "LYNX Cuirass",
      icon: "item_equip_t4_suit_heal01_body_02.png",
      defend: 56,
      bonusBuckets: {
        s1: "will",
        s2: "intellect",
        s3: "strength",
      },
      bonusValuesByRank: {
        s1: [87, 95, 104, 113],
        s2: [58, 63, 69, 75],
        s3: [29, 32, 35, 38],
      },
    });
  }
}

export default new LYNXCuirassDef();
