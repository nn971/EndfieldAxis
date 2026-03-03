import { WeaponDef } from "../WeaponDef";

class Peco5Def extends WeaponDef {
  constructor() {
    super({
      id: "peco5",
      name: "Peco 5",
      type: "handcannon",
      icon: "PECO5.png",
      atkStat: { level1: 29, level90: 283 },
      s1: { id: "attackboost", size: "S" },
      s2: { id: "attackboost", size: "S" },
      s3: {
        id: "assaultarmamentprep",
        cat: "combative",
        name: "Assault: Armament Prep",
        bonus: {
          bucket: "atkIncRatio",
          byRank: r => {
            const values = [0.12, 0.14, 0.17, 0.19, 0.22, 0.24, 0.26, 0.29, 0.34];
            return values[r] ?? 0.12;
          },
        },
      },
    });
  }
}

export default new Peco5Def();
