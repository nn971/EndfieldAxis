import { GearsDef } from "../GearsDef";

class SwordmancerFlintDef extends GearsDef {
  constructor() {
    super({
      id: "swordmancerflint",
      type: "kit",
      name: "Swordmancer Flint",
      icon: "SWORDMANCERFLINT.png",
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

export default new SwordmancerFlintDef();
