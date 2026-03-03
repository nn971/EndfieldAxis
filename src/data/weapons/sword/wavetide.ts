import { WeaponDef } from "../WeaponDef";

class WaveTideDef extends WeaponDef {
  constructor() {
    super({
      id: "wavetide",
      name: "Wave Tide",
      type: "sword",
      icon: "WAVETIDE.png",
      atkStat: { level1: 34, level90: 341 },
      s1: { id: "attackboost", size: "S" },
      s2: { id: "attackboost", size: "S" },
      s3: {
        id: "pursuitunendingcycle",
        cat: "combative",
        name: "Pursuit: Unending Cycle",
        bonus: {
          bucket: "atkIncRatio",
          byRank: r => {
            const values = [0.12, 0.144, 0.168, 0.192, 0.216, 0.24, 0.264, 0.288, 0.336];
            return values[r] ?? 0.12;
          },
        },
      },
    });
  }
}

export default new WaveTideDef();
