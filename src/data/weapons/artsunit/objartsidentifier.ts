import { WeaponDef } from "../WeaponDef";

class OBJArtsIdentifierDef extends WeaponDef {
  constructor() {
    super({
      id: "objartsidentifier",
      name: "OBJ Arts Identifier",
      type: "artsunit",
      icon: "OBJARTSIDENTIFIER.png",
      atkStat: { level1: 42, level90: 411 },
      s1: { id: "attackboost", size: "M" },
      s2: { id: "agilityboost", size: "M" },
      s3: {
        id: "objartsidentifier_transcendentarts",
        cat: "combative",
        name: "Transcendent Arts",
        bonus: {
          bucket: "artsIntensity",
          byRank: r => {
            const values = [28, 30.8, 33.6, 36.4, 39.2, 42, 44.8, 47.6, 50.4];
            return values[r] ?? 28;
          },
        },
      },
    });
  }
}

export default new OBJArtsIdentifierDef();
