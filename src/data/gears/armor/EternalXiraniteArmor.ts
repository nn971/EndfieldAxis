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
    });
  }
}

export default new EternalXiraniteArmorDef();
