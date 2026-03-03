import { WeaponDef } from "../WeaponDef";

class DeliveryGuaranteedDef extends WeaponDef {
  constructor() {
    super({
      id: "deliveryguaranteed",
      name: "Delivery Guaranteed",
      type: "artsunit",
      icon: "DELIVERYGUARANTEED.png",
      atkStat: {
        level1: 51,
        level90: 500,
      },
      s1: { id: "agilityboost", size: "L" },
      s2: { id: "agilityboost", size: "L" },
      s3: {
        id: "pursuitdutyfulfilled",
        cat: "combative",
        name: "Pursuit: Duty Fulfilled",
        bonus: {
          bucket: "atkIncRatio",
          byRank: r => {
            const values = [0.15, 0.16, 0.17, 0.18, 0.19, 0.20, 0.21, 0.22, 0.23, 0.24, 0.26, 0.28];
            return values[r] ?? 0.15;
          },
        },
      },
    });
  }
}

export default new DeliveryGuaranteedDef();
