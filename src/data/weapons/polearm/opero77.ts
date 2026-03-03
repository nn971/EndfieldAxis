import { WeaponDef } from "../WeaponDef";

class Opero77Def extends WeaponDef {
  constructor() {
    super({
      id: "opero77",
      name: "Opero 77",
      type: "polearm",
      icon: "OPERO77.png",
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

export default new Opero77Def();
