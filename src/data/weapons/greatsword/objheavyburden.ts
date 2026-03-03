import { WeaponDef } from "../WeaponDef";

class OBJHeavyBurdenDef extends WeaponDef {
  constructor() {
    super({
      id: "objheavyburden",
      name: "OBJ Heavy Burden",
      type: "greatsword",
      icon: "OBJHEAVYBURDEN.png",
      atkStat: { level1: 42, level90: 411 },
      s1: { id: "attackboost", size: "M" },
      s2: { id: "agilityboost", size: "M" },
      s3: {
        id: "efficacytenaciouswill",
        cat: "combative",
        name: "Tenacious Will",
        bonus: {
          bucket: "will",
          byRank: r => {
            const values = [14, 15.4, 16.8, 18.2, 19.6, 21, 22.4, 23.8, 25.2];
            return values[r] ?? 14;
          },
        },
      },
    });
  }
}

export default new OBJHeavyBurdenDef();
