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
  //TODO

  constructor(init: GearsDefInit) {
    this.id = init.id;
    this.type = init.type;
    this.name = init.name;
    this.icon = init.icon;
    this.defend = init.defend;
    this.attributes = init.attributes;
  }

  registerSimPlugins(_registry: SimRegistry): void {}
}
