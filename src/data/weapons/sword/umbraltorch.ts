import { WeaponDef } from "../WeaponDef";

class UmbralTorchDef extends WeaponDef {
  constructor() {
    super({
      id: "umbraltorch",
      name: "Umbral Torch",
      type: "sword",
      icon: "UMBRALTORCH.png",
      atkStat: {
        level1: 50,
        level90: 490,
      },
      s1: { id: "agilityboost", size: "L" },
      s2: { id: "physicaldmgboost", size: "L" },
      s3: {
        id: "covetousbuildup",
        cat: "infliction",
        name: "Infliction: Covetous Buildup",
        bonus: {
          bucket: "atkIncRatio",
          byRank: r => {
            const values = [0.07, 0.08, 0.09, 0.10, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.19];
            return values[r] ?? 0.07;
          },
        },
      },
    });
  }
}

export default new UmbralTorchDef();
