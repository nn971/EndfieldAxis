import { WeaponDef } from "../WeaponDef";

class ThunderbergeDef extends WeaponDef {
  constructor() {
    super({
      id: "thunderberge",
      name: "Thunderberge",
      type: "greatsword",
      icon: "THUNDERBERGE.png",
      atkStat: {
        level1: 50,
        level90: 495,
      },
      s1: { id: "agilityboost", size: "L" },
      s2: { id: "agilityboost", size: "L" },
      s3: {
        id: "medicanteyeoftalos",
        cat: "combative",
        name: "Medicant: Eye of Talos",
        bonus: {
          bucket: "will",
          byRank: r => {
            const values = [20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 41, 44];
            return values[r] ?? 20;
          },
        },
      },
    });
  }
}

export default new ThunderbergeDef();
