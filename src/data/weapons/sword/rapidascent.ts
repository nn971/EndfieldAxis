import { WeaponDef } from "../WeaponDef";

class RapidAscentDef extends WeaponDef {
  constructor() {
    super({
      id: "rapidascent",
      name: "Rapid Ascent",
      type: "sword",
      icon: "RAPIDASCENT.png",
      atkStat: {
        level1: 50,
        level90: 495,
      },
      s1: { id: "agilityboost", size: "L" },
      s2: { id: "agilityboost", size: "L" },
      s3: {
        id: "azureclouds",
        cat: "combative",
        name: "Twilight: Azure Clouds",
        bonus: {
          bucket: "physicalDmgIncRatio",
          byRank: r => {
            const values = [0.15, 0.16, 0.17, 0.18, 0.19, 0.20, 0.21, 0.22, 0.23, 0.24, 0.26, 0.28];
            return values[r] ?? 0.15;
          },
        },
      },
    });
  }
}

export default new RapidAscentDef();
