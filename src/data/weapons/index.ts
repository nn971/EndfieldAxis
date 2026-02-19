import weaponsJson from "./weapons.json";

export type WeaponId = string;

export type WeaponDef = {
  id: WeaponId;
  name: string;

  // Base weapon attack used by DamageModel (Endfield: "WeaponAttack").
  // TODO: confirm level scaling. For now it's a direct value.
  attack: number;
};

export const weaponsData = weaponsJson as WeaponDef[];

const weaponsById: Record<string, WeaponDef> = Object.fromEntries(
  weaponsData.map(w => [w.id, w]),
);

export function getWeapon(id: string): WeaponDef | null {
  return weaponsById[id] ?? null;
}
