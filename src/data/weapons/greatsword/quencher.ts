import { WeaponDef } from "../WeaponDef";

class QuencherDef extends WeaponDef {
  constructor() {
    super({
      id: "quencher",
      name: "Quencher",
      type: "greatsword",
      icon: "QUENCHER.png",
      atkStat: { level1: 34, level90: 341 },
      s1: { id: "attackboost", size: "S" },
      s2: { id: "attackboost", size: "S" },
      s3: {
        id: "crusherhonedintolegion",
        cat: "combative",
        name: "Crusher: Honed into Legion",
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

export default new QuencherDef();
