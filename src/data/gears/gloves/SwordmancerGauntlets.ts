import { GearsDef } from "../GearsDef";

class SwordmancerGauntletsDef extends GearsDef {
  constructor() {
    super({
      id: "swordmancergauntlets",
      type: "gloves",
      name: "Swordmancer TAC Gauntlets",
      icon: "SWORDMANCERGAUNTLETS.png",
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

export default new SwordmancerGauntletsDef();
