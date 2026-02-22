import { SimRegistry } from "../../simulator/listeners/registry";
import { OperatorAttributeType } from "../operators/OperatorDef";

export type GearsId = string;

export type GearsType = "armor" | "gloves" | "kit";
export const GearsTypeName = {
  armor: "Armor",
  gloves: "Gloves",
  kit: "Kit",
} as Record<GearsType, string>;

export type GearsDefInit = {
  id: GearsId;
  type: GearsType;
  name: string;
  icon: string;
  defend: number;
  attributes: {
    main: OperatorAttributeType;
    sub: OperatorAttributeType;
  };
  restAttrByRank: {
    mainByRank: [number, number, number, number];
    subByRank: [number, number, number, number];
  };
};

export class GearsDef {
  public readonly id: GearsId;
  public readonly type: GearsType;
  public readonly name: string;
  public readonly icon: string;

  public readonly defend: number;
  public readonly attributes: {
    main: OperatorAttributeType;
    sub: OperatorAttributeType;
  };
  public readonly restAttrByRank: {
    mainByRank: [number, number, number, number];
    subByRank: [number, number, number, number];
  };

  constructor(init: GearsDefInit) {
    this.id = init.id;
    this.type = init.type;
    this.name = init.name;
    this.icon = init.icon;
    this.defend = init.defend;
    this.attributes = init.attributes;
    this.restAttrByRank = init.restAttrByRank;
  }

  registerSimPlugins(_registry: SimRegistry): void {}

  getRestAttributeBonus(ranks: [number, number, number]): {
    main: number;
    sub: number;
  } {
    const clamp = (r: number) =>
      Math.max(0, Math.min(3, Number.isFinite(r) ? Math.round(r) : 0));
    const [r1, r2, r3] = ranks.map(clamp) as [number, number, number];

    const main =
      this.restAttrByRank.mainByRank[r1] +
      this.restAttrByRank.mainByRank[r2] +
      this.restAttrByRank.mainByRank[r3];

    const sub =
      this.restAttrByRank.subByRank[r1] +
      this.restAttrByRank.subByRank[r2] +
      this.restAttrByRank.subByRank[r3];

    return { main, sub };
  }
}
