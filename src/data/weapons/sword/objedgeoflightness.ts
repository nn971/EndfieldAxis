import { WeaponDef } from "../WeaponDef";

class OBJEdgeOfLightnessDef extends WeaponDef {
  constructor() {
    super({
      id: "objedgeoflightness",
      name: "OBJ Edge of Lightness",
      type: "sword",
      icon: "OBJEDGEOFLIGHTNESS.png",
      atkStat: { level1: 42, level90: 411 },
      s1: { id: "agilityboost", size: "M" },
      s2: { id: "attackboost", size: "M" },
      s3: {
        id: "flowunbridlededge",
        cat: "combative",
        name: "Unbridled Edge",
        bonus: {
          bucket: "secondaryAttribute",
          byRank: r => {
            const values = [14, 15.4, 16.8, 18.2, 19.6, 21, 22.4, 23.8, 25.2];
            return values[r] ?? 14;
          },
        },
      },
    });
  }
}

export default new OBJEdgeOfLightnessDef();
