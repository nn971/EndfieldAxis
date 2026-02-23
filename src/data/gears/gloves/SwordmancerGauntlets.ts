import { SwordmancerDef } from "../abstractSet/SwordmancerDef";

class SwordmancerGauntletsDef extends SwordmancerDef {
  constructor() {
    super({
      id: "swordmancergauntlets",
      type: "gloves",
      name: "Swordmancer TAC Gauntlets",
      icon: "SWORDMANCERGAUNTLETS.png",
      defend: 56,
      bonusBuckets: {
        s1: "will",
        s2: "intellect",
        s3: "agility",
      },
      bonusValuesByRank: {
        s1: [0, 0, 0, 0],
        s2: [0, 0, 0, 0],
        s3: [0, 0, 0, 0],
      },
    });
  }
}

export default new SwordmancerGauntletsDef();
