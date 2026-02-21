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
    });
  }
}

export default new SwordmancerGauntletsDef();
