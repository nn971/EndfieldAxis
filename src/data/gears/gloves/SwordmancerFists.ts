import { GearsDef } from "../GearsDef";

class SwordmancerFistsDef extends GearsDef {
  constructor() {
    super({
      id: "swordmancerfists",
      type: "gloves",
      name: "Swordmancer TAC Fists",
      icon: "SWORDMANCERFISTS.png",
      defend: 56,
      bonusBuckets: {
        s1: "agility",
        s2: "strength",
        s3: "ultimateDmgIncRatio",
      },
      bonusValuesByRank: {
        s1: [65, 71, 78, 84],
        s2: [43, 47, 51, 55],
        s3: [0.431, 0.474, 0.518, 0.561],
      },
    });
  }
}

export default new SwordmancerFistsDef();
