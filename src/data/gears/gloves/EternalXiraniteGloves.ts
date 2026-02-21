import { GearsDef } from "../GearsDef";

class EternalXiraniteGlovesDef extends GearsDef {
  constructor() {
    super({
      id: "eternalxiranitegloves",
      type: "gloves",
      name: "Eternal Xiranite Gloves",
      icon: "ETERNALXIRANITEGLOVES.png",
      defend: 56,
      attributes: {
        main: "will",
        sub: "intellect",
      },
    });
  }
}

export default new EternalXiraniteGlovesDef();
