import { SwordmancerDef } from "../abstractSet/SwordmancerDef";

class SwordmancerFlintDef extends SwordmancerDef {
  constructor() {
    super({
      id: "swordmancerflint",
      type: "kit",
      name: "Swordmancer Flint",
      icon: "SWORDMANCERFLINT.png",
      defend: 56,
      bonusBuckets: {
        s1: "agility",
        s2: "strength",
        s3: "physicalDmgIncRatio",
      },
      bonusValuesByRank: {
        s1: [32, 35, 38, 41],
        s2: [21, 23, 25, 27],
        s3: [0.23, 0.253, 0.276, 0.299],
      },
    });
  }
}

export default new SwordmancerFlintDef();
