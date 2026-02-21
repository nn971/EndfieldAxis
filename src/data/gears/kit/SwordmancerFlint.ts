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
    });
  }
}

export default new SwordmancerFlintDef();
