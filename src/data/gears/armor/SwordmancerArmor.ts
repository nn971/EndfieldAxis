import { SwordmancerDef } from "../abstractSet/SwordmancerDef";

class SwordmancerArmorDef extends SwordmancerDef {
  constructor() {
    super({
      id: "swordmancerarmor",
      type: "armor",
      name: "Swordmancer Heavy Armor",
      icon: "SWORDMANCERARMOR.png",
      defend: 56,
      bonusBuckets: {
        s1: "agility",
        s2: "strength",
        s3: "artsIntensity",
      },
      bonusValuesByRank: {
        s1: [87, 95, 104, 113],
        s2: [58, 63, 69, 75],
        s3: [20, 22, 24, 26],
      },
    });
  }
}

export default new SwordmancerArmorDef();
