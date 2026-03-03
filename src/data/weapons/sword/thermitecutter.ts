import { WeaponDef } from "../WeaponDef";

class ThermiteCutterDef extends WeaponDef {
  constructor() {
    super({
      id: "thermitecutter",
      name: "Thermite Cutter",
      type: "sword",
      icon: "THERMITECUTTER.png",
      atkStat: {
        level1: 50,
        level90: 490,
      },
      s1: { id: "agilityboost", size: "L" },
      s2: { id: "attackboost", size: "L" },
      s3: {
        id: "thermalrelease",
        cat: "combative",
        name: "Flow: Thermal Release",
        bonus: {
          bucket: "atkIncRatio",
          byRank: r => {
            const values = [0.10, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.20, 0.22];
            return values[r] ?? 0.10;
          },
        },
      },
    });
  }
}

export default new ThermiteCutterDef();
