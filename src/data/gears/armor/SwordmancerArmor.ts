import { GearsDef } from "../GearsDef";

class SwordmancerArmorDef extends GearsDef {
  constructor() {
    super({
      id: "swordmancerarmor",
      type: "armor",
      name: "Swordmancer Heavy Armor",
      icon: "SWORDMANCERARMOR.png",
      defend: 56,
      attributes: {
        main: "will",
        sub: "intellect",
      },
      restAttrByRank: {
        mainByRank: [0, 0, 0, 0],
        subByRank: [0, 0, 0, 0],
      },
    });
  }
}

export default new SwordmancerArmorDef();
