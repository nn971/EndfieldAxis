import { GearsDef } from "../GearsDef";

class SwordmancerFistsDef extends GearsDef {
  constructor() {
    super({
      id: "swordmancerfists",
      type: "gloves",
      name: "Swordmancer TAC Fists",
      icon: "SWORDMANCERFISTS.png",
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

export default new SwordmancerFistsDef();
