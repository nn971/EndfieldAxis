import { WeaponDef } from "../WeaponDef";

class FormerFineryDef extends WeaponDef {
  constructor() {
    super({
      id: "formerfinery",
      name: "Former Finery",
      type: "greatsword",
      icon: "FORMERFINERY.png",
      atkStat: {
        level1: 50,
        level90: 495,
      },
      s1: { id: "agilityboost", size: "L" },
      s2: { id: "agilityboost", size: "L" },
      s3: {
        id: "efficacymincingtherapy",
        cat: "combative",
        name: "Efficacy: Mincing Therapy",
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

export default new FormerFineryDef();
