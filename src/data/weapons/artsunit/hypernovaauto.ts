import { WeaponDef } from "../WeaponDef";

class HypernovaAutoDef extends WeaponDef {
  constructor() {
    super({
      id: "hypernovaauto",
      name: "Hypernova Auto",
      type: "artsunit",
      icon: "HYPERNOVAAUTO.png",
      atkStat: { level1: 34, level90: 341 },
      s1: { id: "attackboost", size: "S" },
      s2: { id: "attackboost", size: "S" },
      s3: {
        id: "inspiringstartofasaga",
        cat: "combative",
        name: "Inspiring: Start of a Saga",
        bonus: {
          bucket: "atkIncRatio",
          byRank: r => {
            const values = [0.15, 0.18, 0.21, 0.24, 0.27, 0.30, 0.33, 0.36, 0.42];
            return values[r] ?? 0.15;
          },
        },
      },
    });
  }
}

export default new HypernovaAutoDef();
