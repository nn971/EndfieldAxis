import type { BuffId } from "../../data/buffs/BuffDef";
import type { OperatorId } from "../../data/operators/OperatorDef";
import type { WeaponId } from "../../data/weapons/WeaponDef";
import type { BuffKey } from "./infliction";

/**
 * Shared event/listener condition shape.
 *
 * NOTE: for skill-generated events, we currently only rely on targetHasBuffId.
 */
export type SimEventWhen = {
  sourceOperatorId?: OperatorId;
  sourceWeaponId?: WeaponId;
  buffId?: BuffId;
  buffKey?: BuffKey;
  ownerHasBuffId?: BuffId;
  ownerHasBuffKey?: BuffKey;
  targetHasBuffId?: BuffId;
  targetHasBuffKey?: BuffKey;
};
