import { GearsDef } from "../GearsDef";

class EternalXiraniteArmorDef extends GearsDef {
  constructor() {
    super({
      id: "eternalxiranitearmor",
      type: "armor",
      name: "Eternal Xiranite Armor",
      icon: "ETERNALXIRANITEARMOR.png",
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

export default new EternalXiraniteArmorDef();
