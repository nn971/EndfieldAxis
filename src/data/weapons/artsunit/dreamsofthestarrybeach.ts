import { WeaponDef } from "../WeaponDef";

class DreamsOfTheStarryBeachDef extends WeaponDef {
  constructor() {
    super({
      id: "dreamsofthestarrybeach",
      name: "Dreams of the Starry Beach",
      type: "artsunit",
      icon: "DREAMSOFTHESTARRYBEACH.png",
      atkStat: {
        level1: 50,
        level90: 495,
      },
      s1: { id: "attackboost", size: "L" },
      s2: { id: "agilityboost", size: "L" },
      s3: {
        id: "inflictiontidalmurmurs",
        cat: "infliction",
        name: "Infliction: Tidal Murmurs",
        bonus: {
          bucket: "atkIncRatio",
          byRank: r => {
            const values = [0.15, 0.16, 0.17, 0.18, 0.19, 0.20, 0.21, 0.22, 0.23, 0.24, 0.26, 0.28];
            return values[r] ?? 0.15;
          },
        },
      },
    });
  }
}

export default new DreamsOfTheStarryBeachDef();
