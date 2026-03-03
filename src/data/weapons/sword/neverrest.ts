import { WeaponDef } from "../WeaponDef";

class NeverRestDef extends WeaponDef {
  constructor() {
    super({
      id: "neverrest",
      name: "Never Rest",
      type: "sword",
      icon: "NEVERREST.png",
      atkStat: {
        level1: 51,
        level90: 500,
      },
      s1: { id: "agilityboost", size: "L" },
      s2: { id: "attackboost", size: "L" },
      s3: {
        id: "reincarnation",
        cat: "combative",
        name: "Flow: Reincarnation",
        bonus: {
          bucket: "physicalDmgIncRatio",
          byRank: r => {
            const values = [0.16, 0.18, 0.20, 0.22, 0.24, 0.26, 0.28, 0.30, 0.32, 0.34, 0.37, 0.40];
            return values[r] ?? 0.16;
          },
        },
      },
    });
  }
}

export default new NeverRestDef();
